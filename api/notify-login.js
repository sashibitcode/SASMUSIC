import { setCorsHeaders, getClientIp } from './_utils.js';

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// In-memory cache to prevent duplicate alerts within 5 minutes for same user
const recentLoginCache = new Map();

function parseDeviceSummary(userAgent) {
  if (!userAgent || typeof userAgent !== 'string') return 'Web Browser';
  const ua = userAgent.toLowerCase();

  let os = 'Unknown OS';
  if (ua.includes('android')) os = 'Android';
  else if (ua.includes('iphone') || ua.includes('ipad')) os = 'iOS';
  else if (ua.includes('windows')) os = 'Windows';
  else if (ua.includes('macintosh') || ua.includes('mac os')) os = 'macOS';
  else if (ua.includes('linux')) os = 'Linux';

  let browser = 'Browser';
  if (ua.includes('edg/')) browser = 'Edge';
  else if (ua.includes('chrome/') && !ua.includes('edg/')) browser = 'Chrome';
  else if (ua.includes('safari/') && !ua.includes('chrome/')) browser = 'Safari';
  else if (ua.includes('firefox/')) browser = 'Firefox';
  else if (ua.includes('opera/') || ua.includes('opr/')) browser = 'Opera';

  return `${os} • ${browser}`;
}

export default async function handler(req, res) {
  setCorsHeaders(req, res);

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    let body = req.body;
    if (typeof body === 'string') {
      try {
        body = JSON.parse(body);
      } catch (e) {
        // ignore parse error
      }
    }

    const { userId, userName, userEmail, authProvider, userAgent } = body || {};

    if (!userId && !userEmail) {
      return res.status(400).json({ error: 'User identifier required' });
    }

    const userKey = String(userId || userEmail).trim();
    const now = Date.now();
    const lastNotified = recentLoginCache.get(userKey);

    // Skip duplicate alerts within 5 minutes (300,000 ms)
    if (lastNotified && (now - lastNotified) < 300000) {
      return res.status(200).json({
        success: true,
        skipped: true,
        message: 'Notification already sent recently'
      });
    }

    // Clean up cache if too large (over 500 entries)
    if (recentLoginCache.size > 500) {
      for (const [k, v] of recentLoginCache.entries()) {
        if (now - v > 600000) recentLoginCache.delete(k);
      }
    }
    recentLoginCache.set(userKey, now);

    const cleanUserName = (userName && typeof userName === 'string') ? userName.trim().slice(0, 80) : 'Music Listener';
    const cleanUserEmail = (userEmail && typeof userEmail === 'string') ? userEmail.trim().slice(0, 100) : 'Not Provided';
    const cleanProvider = (authProvider && typeof authProvider === 'string') ? authProvider.trim() : 'Google / Clerk';
    const clientIp = getClientIp(req);
    const deviceSummary = parseDeviceSummary(userAgent || req.headers['user-agent']);

    // Vercel Geolocation headers
    const city = req.headers['x-vercel-ip-city'] ? decodeURIComponent(req.headers['x-vercel-ip-city']) : '';
    const region = req.headers['x-vercel-ip-country-region'] || '';
    const country = req.headers['x-vercel-ip-country'] || '';

    let locationStr = 'Online';
    if (city && country) {
      locationStr = `${city}${region ? ', ' + region : ''}, ${country}`;
    } else if (country) {
      locationStr = country;
    }

    const timeString = new Date().toLocaleString('en-IN', {
      timeZone: 'Asia/Kolkata',
      dateStyle: 'medium',
      timeStyle: 'short'
    });

    const botToken = process.env.TELEGRAM_BOT_TOKEN;
    const chatId = process.env.TELEGRAM_CHAT_ID;

    let telegramSent = false;

    if (botToken && chatId) {
      const messageText = [
        `🔐 <b>NEW USER SIGNED IN • SAS MUSIC</b> 🔐`,
        `──────────────────────────────`,
        `👤 <b>User:</b> ${escapeHtml(cleanUserName)}`,
        `📧 <b>Email:</b> <code>${escapeHtml(cleanUserEmail)}</code>`,
        `🔑 <b>Method:</b> ${escapeHtml(cleanProvider)}`,
        `📍 <b>Location:</b> ${escapeHtml(locationStr)}`,
        `🌐 <b>IP Address:</b> <code>${escapeHtml(clientIp)}</code>`,
        `📱 <b>Device:</b> ${escapeHtml(deviceSummary)}`,
        `⏰ <b>Time:</b> ${timeString} (IST)`,
        `──────────────────────────────`,
        `🎧 <i>User is actively exploring the music hub!</i>`
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
          console.warn('[Login Notification Telegram Warning]', tgData);
        }
      } catch (tgErr) {
        console.error('[Login Notification Telegram Error]', tgErr);
      }
    } else {
      console.log(`[User Login]: ${cleanUserName} (${cleanUserEmail}) from ${locationStr}`);
    }

    return res.status(200).json({
      success: true,
      delivered: telegramSent
    });
  } catch (error) {
    console.error('Error in notify-login API:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

