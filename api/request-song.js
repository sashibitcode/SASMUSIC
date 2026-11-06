import { setCorsHeaders, getClientIp, checkRequestRateLimit } from './_utils.js';

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export default async function handler(req, res) {
  setCorsHeaders(req, res);

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const clientIp = getClientIp(req);
  const rateStatus = checkRequestRateLimit(clientIp);

  if (!rateStatus.allowed) {
    return res.status(429).json({
      error: `Too many requests sent. Please wait ${rateStatus.minutesLeft} minute(s) before requesting again.`
    });
  }

  try {
    let body = req.body;
    if (typeof body === 'string') {
      try {
        body = JSON.parse(body);
      } catch (e) {
        // ignore
      }
    }

    const { songName, userName, userEmail } = body || {};

    if (!songName || typeof songName !== 'string' || songName.trim().length === 0) {
      return res.status(400).json({ error: 'Song title is required' });
    }

    // Anti-spam requirement: must be a signed-in user with valid email
    if (!userEmail || typeof userEmail !== 'string' || !userEmail.includes('@') || userEmail.toLowerCase() === 'guest' || userEmail === 'Not Provided') {
      return res.status(401).json({
        error: 'Song request bhejne ke liye Google se Sign In hona anivarya hai.'
      });
    }

    const cleanSongName = songName.trim().slice(0, 120);
    const cleanUserName = (userName && typeof userName === 'string') ? userName.trim().slice(0, 60) : 'Verified User';
    const cleanUserEmail = userEmail.trim().slice(0, 100);

    const now = new Date();
    const timeString = now.toLocaleString('en-IN', {
      timeZone: 'Asia/Kolkata',
      dateStyle: 'medium',
      timeStyle: 'short'
    });

    const botToken = process.env.TELEGRAM_BOT_TOKEN;
    const chatId = process.env.TELEGRAM_CHAT_ID;

    let telegramSent = false;

    if (botToken && chatId) {
      const messageText = [
        `🎵 <b>NEW VERIFIED SONG REQUEST • SAS MUSIC</b> 🎵`,
        `──────────────────────────────`,
        `🎧 <b>Song:</b> <code>${escapeHtml(cleanSongName)}</code>`,
        `👤 <b>Requested By:</b> ${escapeHtml(cleanUserName)}`,
        `📧 <b>Verified Email:</b> ${escapeHtml(cleanUserEmail)}`,
        `🔒 <b>Status:</b> ✅ Logged-in & Verified`,
        `⏰ <b>Time:</b> ${timeString} (IST)`,
        `⚡ <b>Commitment:</b> <i>Within 10 Minutes!</i>`,
        `──────────────────────────────`,
        `🚀 <i>Add to Google Drive to make it available for all listeners!</i>`
      ].join('\n');

      try {
        const tgRes = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chat_id: chatId,
            text: messageText,
            parse_mode: 'HTML',
            disable_web_page_preview: true
          })
        });

        const tgData = await tgRes.json();
        telegramSent = Boolean(tgRes.ok && tgData.ok);
        if (!telegramSent) {
          console.warn('[Telegram Dispatch Warning]', tgData);
        }
      } catch (tgErr) {
        console.error('[Telegram Dispatch Error]', tgErr);
      }
    } else {
      console.log(`[Song Request Received (Configure TELEGRAM_BOT_TOKEN & TELEGRAM_CHAT_ID in Vercel to receive instant alerts)]: "${cleanSongName}" from ${cleanUserName}`);
    }

    return res.status(200).json({
      success: true,
      message: 'Song request successfully received! We will add it within 10 minutes.',
      song: cleanSongName,
      delivered: telegramSent
    });
  } catch (error) {
    console.error('Error processing song request:', error);
    return res.status(500).json({ error: 'Failed to submit song request. Please try again.' });
  }
}

