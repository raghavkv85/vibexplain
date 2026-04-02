import { createServer } from 'http';
import { readFileSync, existsSync, watchFile, mkdirSync, appendFileSync, readdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { WebSocketServer } from 'ws';

const __dir = dirname(fileURLToPath(import.meta.url));
const dashDir = join(__dir, '..', 'dashboard');
const mime = { '.html': 'text/html', '.css': 'text/css', '.js': 'text/javascript', '.json': 'application/json' };
const sessDir = join(process.cwd(), '.vibexplain', 'sessions');

const planFiles = ['PLAN.md', 'plan.md', 'spec.md', 'SPEC.md', 'TODO.md', 'CLAUDE.md'];

function parsePlan(content) {
  // Extract numbered steps, bullet points, or markdown headers as plan steps
  const lines = content.split('\n');
  const steps = [];
  for (const line of lines) {
    const trimmed = line.trim();
    const m = trimmed.match(/^(?:\d+[.)]\s*|[-*]\s+|#{1,3}\s+)(.+)/);
    if (m && m[1].length > 5) steps.push(m[1].trim());
  }
  return steps.length ? { type: 'plan', steps } : null;
}

export function startServer(port = 3777) {
  const history = [];
  let planData = null;

  // Session persistence
  mkdirSync(sessDir, { recursive: true });
  const sessionId = new Date().toISOString().replace(/[:.]/g, '-');
  const sessionFile = join(sessDir, `${sessionId}.jsonl`);

  function saveEvent(event) {
    appendFileSync(sessionFile, JSON.stringify(event) + '\n');
  }

  function loadSessions() {
    try {
      return readdirSync(sessDir)
        .filter(f => f.endsWith('.jsonl'))
        .sort().reverse()
        .map(f => {
          try {
            const lines = readFileSync(join(sessDir, f), 'utf-8').trim().split('\n').filter(Boolean);
            const first = lines[0] ? JSON.parse(lines[0]) : null;
            return { id: f.replace('.jsonl', ''), started: first?.ts, count: lines.length, file: f };
          } catch { return null; }
        }).filter(Boolean);
    } catch { return []; }
  }

  function loadSession(file) {
    try {
      const lines = readFileSync(join(sessDir, file), 'utf-8').trim().split('\n').filter(Boolean);
      const events = lines.map(l => JSON.parse(l));
      return { id: file.replace('.jsonl', ''), started: events[0]?.ts, events };
    } catch { return null; }
  }

  // Watch for plan files
  function checkPlanFiles() {
    for (const name of planFiles) {
      const p = join(process.cwd(), name);
      if (existsSync(p)) {
        const parsed = parsePlan(readFileSync(p, 'utf-8'));
        if (parsed) {
          planData = JSON.stringify(parsed);
          if (!history.includes(planData)) history.unshift(planData);
          for (const client of wss.clients) {
            if (client.readyState === 1) client.send(planData);
          }
        }
        watchFile(p, { interval: 1000 }, () => checkPlanFiles());
        return;
      }
    }
  }

  const server = createServer((req, res) => {
    const url = req.url.split('?')[0];
    if (url === '/favicon.ico') { res.writeHead(204); res.end(); return; }

    // API endpoints for session history
    if (url === '/api/sessions') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(loadSessions()));
      return;
    }
    if (url.startsWith('/api/session/')) {
      const file = url.slice('/api/session/'.length) + '.jsonl';
      const data = loadSession(file);
      res.writeHead(data ? 200 : 404, { 'Content-Type': 'application/json' });
      res.end(data ? JSON.stringify(data) : '{"error":"not found"}');
      return;
    }

    const file = url === '/' ? '/index.html' : url;
    const ext = file.slice(file.lastIndexOf('.'));
    try {
      res.writeHead(200, { 'Content-Type': mime[ext] || 'text/plain' });
      res.end(readFileSync(join(dashDir, file)));
    } catch {
      res.writeHead(404);
      res.end('Not found');
    }
  });

  const wss = new WebSocketServer({ server, path: '/ws' });

  wss.on('connection', (ws) => {
    // Replay history to new client
    for (const msg of history) {
      ws.send(msg);
    }
  });

  server.listen(port, () => {
    console.log(`\x1b[35m  vibexplain\x1b[0m dashboard → http://localhost:${port}`);
    checkPlanFiles();
  });

  return {
    broadcast(data) {
      const msg = JSON.stringify(data);
      history.push(msg);
      if (data.id) { saveEvent(data); }
      for (const client of wss.clients) {
        if (client.readyState === 1) client.send(msg);
      }
    }
  };
}
