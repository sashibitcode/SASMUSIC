#!/usr/bin/env node

/**
 * SAS Music - Google OAuth2 Refresh Token Generator
 * 
 * One-time setup script to obtain a GOOGLE_REFRESH_TOKEN for Google Drive uploads.
 * Uses native Node.js HTTP server and fetch — zero external dependencies required!
 * 
 * Usage:
 *   node scripts/get-refresh-token.js
 */

import http from 'http';
import readline from 'readline';

const PORT = 3000;
const REDIRECT_URI = `http://localhost:${PORT}/oauth2callback`;
const SCOPES = 'https://www.googleapis.com/auth/drive';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function prompt(question) {
  return new Promise((resolve) => rl.question(question, (ans) => resolve(ans.trim())));
}

async function main() {
  console.log('\n🎵 ========================================================');
  console.log('   SAS Music - Google Drive Refresh Token Generator');
  console.log('========================================================\n');
  console.log('Before running this script, ensure you have created an');
  console.log('OAuth 2.0 Client ID in Google Cloud Console:');
  console.log('  1. Application type: "Web application"');
  console.log(`  2. Authorized redirect URI: ${REDIRECT_URI}\n`);

  let clientId = process.env.GOOGLE_CLIENT_ID;
  let clientSecret = process.env.GOOGLE_CLIENT_SECRET;

  if (!clientId) {
    clientId = await prompt('Enter your Google Client ID: ');
  }
  if (!clientSecret) {
    clientSecret = await prompt('Enter your Google Client Secret: ');
  }

  if (!clientId || !clientSecret) {
    console.error('\n❌ Error: Both Client ID and Client Secret are required.');
    process.exit(1);
  }

  const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${encodeURIComponent(clientId)}&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&response_type=code&scope=${encodeURIComponent(SCOPES)}&access_type=offline&prompt=consent`;

  const server = http.createServer(async (req, res) => {
    try {
      const reqUrl = new URL(req.url, `http://localhost:${PORT}`);
      if (reqUrl.pathname !== '/oauth2callback') {
        res.writeHead(404, { 'Content-Type': 'text/plain' });
        res.end('Not Found');
        return;
      }

      const code = reqUrl.searchParams.get('code');
      const error = reqUrl.searchParams.get('error');

      if (error) {
        res.writeHead(400, { 'Content-Type': 'text/html' });
        res.end(`<h2 style="color:red">Authorization Failed: ${error}</h2>`);
        console.error(`\n❌ Authorization was rejected: ${error}`);
        server.close();
        process.exit(1);
      }

      if (!code) {
        res.writeHead(400, { 'Content-Type': 'text/plain' });
        res.end('Missing code parameter');
        return;
      }

      // Exchange authorization code for tokens
      const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          code,
          client_id: clientId,
          client_secret: clientSecret,
          redirect_uri: REDIRECT_URI,
          grant_type: 'authorization_code'
        })
      });

      const tokenData = await tokenRes.json();

      if (!tokenRes.ok || !tokenData.refresh_token) {
        res.writeHead(500, { 'Content-Type': 'text/html' });
        res.end(`<h2>Failed to obtain refresh token</h2><p>${JSON.stringify(tokenData)}</p>`);
        console.error('\n❌ Token exchange failed:', tokenData);
        server.close();
        process.exit(1);
      }

      res.writeHead(200, { 'Content-Type': 'text/html' });
      res.end(`
        <div style="font-family:sans-serif; text-align:center; padding:40px; background:#06110c; color:#fff; min-height:100vh;">
          <h1 style="color:#A31C1B;">Authorization Successful!</h1>
          <p>Your Google Drive refresh token has been generated.</p>
          <p>Please return to your terminal to copy your credentials.</p>
        </div>
      `);

      console.log('\n✅ ========================================================');
      console.log('   SUCCESS! Your Refresh Token has been generated:');
      console.log('========================================================\n');
      console.log(`GOOGLE_CLIENT_ID=${clientId}`);
      console.log(`GOOGLE_CLIENT_SECRET=${clientSecret}`);
      console.log(`GOOGLE_REFRESH_TOKEN=${tokenData.refresh_token}\n`);
      console.log('📋 Add these values to your Vercel Project Environment Variables!\n');

      server.close();
      rl.close();
      process.exit(0);
    } catch (err) {
      console.error('\n❌ Server error:', err);
      res.writeHead(500, { 'Content-Type': 'text/plain' });
      res.end('Internal Server Error');
      server.close();
      process.exit(1);
    }
  });

  server.listen(PORT, () => {
    console.log(`\n🌐 Listening for OAuth callback on http://localhost:${PORT}/oauth2callback`);
    console.log('\n👉 Open the following URL in your web browser to sign in:');
    console.log('------------------------------------------------------------');
    console.log(authUrl);
    console.log('------------------------------------------------------------\n');
  });
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

