/* eslint-disable */
const fs = require('fs');
const path = require('path');

(async () => {
  const lt = require('localtunnel');
  const port = Number(process.env.PORT || 3000);
  const tunnel = await lt({ port });

  const url = tunnel.url;
  const file = path.join(__dirname, 'tunnel_url.txt');
  try { fs.writeFileSync(file, url, 'utf8'); } catch (e) {}
  console.log(`Public URL: ${url}`);
  console.log('Keep this process running to keep the tunnel alive.');

  tunnel.on('close', () => {
    try { fs.unlinkSync(file); } catch (_) {}
    console.log('Tunnel closed');
  });

  process.on('SIGINT', async () => {
    try { await tunnel.close(); } catch (_) {}
    process.exit(0);
  });
})();