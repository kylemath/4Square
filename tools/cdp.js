// Tiny headless-Chrome driver over the DevTools protocol (no npm packages): used by embed_win_check.js and shots.js.
//   const { serve, launch } = require('./cdp'); const srv = await serve(rootDir); const B = await launch(); const P = await B.page(390, 844);
//   await P.goto(srv.url + 'x.html'); await P.eval('1+1'); await P.click(x, y); await P.shot('a.png'); B.close(); srv.close();
// Needs Node >= 20 with --experimental-websocket (re-exec'd automatically) and Google Chrome or Chromium.
if (typeof WebSocket === 'undefined' && !process.env.CDP_REEXEC) {
  const r = require('child_process').spawnSync(process.execPath, ['--experimental-websocket', ...process.argv.slice(1)], { stdio: 'inherit', env: Object.assign({}, process.env, { CDP_REEXEC: '1' }) });
  process.exit(r.status === null ? 1 : r.status);
}
const { spawn } = require('child_process'), http = require('http'), fs = require('fs'), path = require('path'), os = require('os');
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.json': 'application/json', '.css': 'text/css', '.svg': 'image/svg+xml', '.png': 'image/png', '.webmanifest': 'application/json' };
function serve(root) {
  return new Promise(res => {
    const s = http.createServer((q, r) => {
      const f = path.join(root, decodeURIComponent(q.url.split('?')[0]));
      if (!f.startsWith(root) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { r.statusCode = 404; return r.end('no'); }
      r.setHeader('content-type', MIME[path.extname(f)] || 'application/octet-stream'); r.setHeader('cache-control', 'no-store'); r.end(fs.readFileSync(f));
    }).listen(0, '127.0.0.1', () => res({ url: 'http://127.0.0.1:' + s.address().port + '/', close: () => s.close() }));
  });
}
const sleep = ms => new Promise(r => setTimeout(r, ms));
async function launch() {
  const exe = ['/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', '/usr/bin/chromium', '/usr/bin/google-chrome'].find(p => fs.existsSync(p));
  if (!exe) throw new Error('Chrome not found');
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'cdp-'));
  const ch = spawn(exe, ['--headless=new', '--remote-debugging-port=0', '--user-data-dir=' + dir, '--no-first-run', '--disable-gpu', '--hide-scrollbars', '--mute-audio',
    '--autoplay-policy=no-user-gesture-required', '--disable-background-timer-throttling', '--disable-renderer-backgrounding', 'about:blank'], { stdio: ['ignore', 'ignore', 'pipe'] });
  const wsUrl = await new Promise((ok, no) => { let b = ''; ch.stderr.on('data', d => { b += d; const m = b.match(/DevTools listening on (ws:\S+)/); if (m) ok(m[1]); }); ch.on('exit', () => no(new Error('chrome exited'))); setTimeout(() => no(new Error('chrome start timeout')), 15000); });
  const ws = new WebSocket(wsUrl); await new Promise(r => ws.addEventListener('open', r));
  let id = 0; const pend = new Map(), ev = [];
  ws.addEventListener('message', m => { const d = JSON.parse(m.data); if (d.id && pend.has(d.id)) { const p = pend.get(d.id); pend.delete(d.id); d.error ? p.no(new Error(d.error.message)) : p.ok(d.result); } else ev.slice().forEach(f => f(d)); });
  const send = (method, params, sessionId) => new Promise((ok, no) => { const i = ++id; pend.set(i, { ok, no }); ws.send(JSON.stringify({ id: i, method, params: params || {}, sessionId })); });
  return {
    async page(w, h, dpr) {
      const { targetId } = await send('Target.createTarget', { url: 'about:blank' });
      const { sessionId } = await send('Target.attachToTarget', { targetId, flatten: true });
      const S = (m, p) => send(m, p, sessionId);
      await S('Page.enable'); await S('Runtime.enable');
      await S('Emulation.setDeviceMetricsOverride', { width: w, height: h, deviceScaleFactor: dpr || 1, mobile: false });
      const logs = []; ev.push(d => { if (d.sessionId === sessionId && d.method === 'Runtime.exceptionThrown') { const x = d.params.exceptionDetails; logs.push(x.exception ? x.exception.description : x.text); } });
      return {
        logs, S,
        async goto(url) { const l = new Promise(r => { const f = d => { if (d.sessionId === sessionId && d.method === 'Page.loadEventFired') { ev.splice(ev.indexOf(f), 1); r(); } }; ev.push(f); }); await S('Page.navigate', { url }); await l; },
        async eval(expr) { const r = await S('Runtime.evaluate', { expression: expr, returnByValue: true, awaitPromise: true }); if (r.exceptionDetails) throw new Error(r.exceptionDetails.exception ? r.exceptionDetails.exception.description : r.exceptionDetails.text); return r.result.value; },
        async addScript(src) { await S('Page.addScriptToEvaluateOnNewDocument', { source: src }); },
        async click(x, y) { for (const type of ['mouseMoved', 'mousePressed', 'mouseReleased']) await S('Input.dispatchMouseEvent', { type, x, y, button: 'left', buttons: type === 'mousePressed' ? 1 : 0, clickCount: 1 }); },
        async shot(file) { const r = await S('Page.captureScreenshot', { format: 'png' }); fs.writeFileSync(file, Buffer.from(r.data, 'base64')); return file; },
        async scheme(dark) { await S('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-color-scheme', value: dark ? 'dark' : 'light' }] }); },
        sleep,
      };
    },
    close() { try { ws.close(); } catch (e) { /* gone */ } ch.kill(); try { fs.rmSync(dir, { recursive: true, force: true }); } catch (e) { /* busy */ } },
  };
}
module.exports = { serve, launch, sleep };
