// Tails Codex CLI JSONL session transcripts for real-time command extraction
// Zero config — auto-detects active sessions from ~/.codex/sessions/
import { existsSync, readdirSync, statSync, watch } from 'fs';
import { join } from 'path';
import { homedir } from 'os';
import { createInterface } from 'readline';
import { createReadStream } from 'fs';

const CODEX_SESSIONS = join(homedir(), '.codex', 'sessions');

export function startCodexTailer(cwd, onCommand) {
  if (!existsSync(CODEX_SESSIONS)) return null;

  console.log(`\x1b[35m  vibexplain\x1b[0m Codex CLI detected — tailing session transcripts`);

  const tailed = new Map();

  function findLatestSession() {
    try {
      const files = readdirSync(CODEX_SESSIONS)
        .filter(f => f.endsWith('.jsonl'))
        .map(f => ({ name: f, mtime: statSync(join(CODEX_SESSIONS, f)).mtimeMs }))
        .sort((a, b) => b.mtime - a.mtime);
      return files[0]?.name || null;
    } catch { return null; }
  }

  function tailFile(filename) {
    const filepath = join(CODEX_SESSIONS, filename);
    if (tailed.has(filename)) return;

    let offset = 0;
    try { offset = statSync(filepath).size; } catch { return; }
    tailed.set(filename, { offset });

    function readNewLines() {
      const state = tailed.get(filename);
      if (!state) return;
      try {
        const currentSize = statSync(filepath).size;
        if (currentSize <= state.offset) return;

        const stream = createReadStream(filepath, { start: state.offset, encoding: 'utf-8' });
        const rl = createInterface({ input: stream, crlfDelay: Infinity });

        rl.on('line', (line) => {
          if (!line.trim()) return;
          try { processRecord(JSON.parse(line)); } catch { /* malformed */ }
        });

        rl.on('close', () => { state.offset = currentSize; });
      } catch { /* file gone */ }
    }

    try {
      const watcher = watch(filepath, () => readNewLines());
      const poll = setInterval(readNewLines, 1000);
      return { close() { watcher.close(); clearInterval(poll); } };
    } catch { return null; }
  }

  function processRecord(record) {
    // Codex uses OpenAI message format with function_call / tool_calls
    if (record.role === 'assistant') {
      // tool_calls format
      const calls = record.tool_calls || [];
      for (const call of calls) {
        if (call.type === 'function' && call.function?.name === 'shell') {
          try {
            const args = JSON.parse(call.function.arguments);
            if (args.command) onCommand(args.command);
          } catch { /* malformed args */ }
        }
        if (call.type === 'function' && (call.function?.name === 'write' || call.function?.name === 'edit')) {
          try {
            const args = JSON.parse(call.function.arguments);
            if (args.path) onCommand(`touch ${args.path}`);
          } catch { /* malformed args */ }
        }
      }
      // function_call format (older)
      if (record.function_call?.name === 'shell') {
        try {
          const args = JSON.parse(record.function_call.arguments);
          if (args.command) onCommand(args.command);
        } catch { /* malformed */ }
      }
    }

    // Codex also nests messages inside a content array sometimes
    if (record.type === 'function_call' && record.name === 'shell') {
      try {
        const args = typeof record.arguments === 'string' ? JSON.parse(record.arguments) : record.arguments;
        if (args?.command) onCommand(args.command);
      } catch { /* malformed */ }
    }
  }

  const latest = findLatestSession();
  const watchers = [];
  if (latest) {
    const w = tailFile(latest);
    if (w) watchers.push(w);
  }

  let dirWatcher;
  try {
    dirWatcher = watch(CODEX_SESSIONS, (_, filename) => {
      if (filename?.endsWith('.jsonl')) {
        const w = tailFile(filename);
        if (w) watchers.push(w);
      }
    });
  } catch { /* dir watch failed */ }

  return {
    close() {
      for (const w of watchers) w.close();
      if (dirWatcher) dirWatcher.close();
    }
  };
}
