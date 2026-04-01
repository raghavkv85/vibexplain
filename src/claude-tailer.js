// Tails Claude Code JSONL session transcripts for real-time command extraction
// Zero config — auto-detects active sessions from ~/.claude/projects/
import { existsSync, readdirSync, statSync, readFileSync, watch } from 'fs';
import { join, resolve } from 'path';
import { homedir } from 'os';
import { createInterface } from 'readline';
import { createReadStream } from 'fs';

const CLAUDE_DIR = join(homedir(), '.claude', 'projects');

// Convert a cwd path to Claude's project directory hash
// /Users/foo/my-project → -Users-foo-my-project
function cwdToProjectHash(cwd) {
  return cwd.replace(/\//g, '-').replace(/-\./g, '--');
}

export function startClaudeCodeTailer(cwd, onCommand) {
  if (!existsSync(CLAUDE_DIR)) return null;

  const hash = cwdToProjectHash(resolve(cwd));
  const projectDir = join(CLAUDE_DIR, hash, 'sessions');
  if (!existsSync(projectDir)) return null;

  console.log(`\x1b[35m  vibexplain\x1b[0m Claude Code detected — tailing session transcripts`);

  const tailed = new Map(); // sessionFile -> { offset }

  function findLatestSession() {
    try {
      const files = readdirSync(projectDir)
        .filter(f => f.endsWith('.jsonl'))
        .map(f => ({ name: f, mtime: statSync(join(projectDir, f)).mtimeMs }))
        .sort((a, b) => b.mtime - a.mtime);
      return files[0]?.name || null;
    } catch { return null; }
  }

  function tailFile(filename) {
    const filepath = join(projectDir, filename);
    if (tailed.has(filename)) return;

    let offset = 0;
    // Start from end of existing content (only read new lines)
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
        let bytesRead = 0;

        rl.on('line', (line) => {
          bytesRead += Buffer.byteLength(line, 'utf-8') + 1; // +1 for newline
          if (!line.trim()) return;
          try {
            const record = JSON.parse(line);
            processRecord(record);
          } catch { /* malformed line */ }
        });

        rl.on('close', () => {
          state.offset = currentSize;
        });
      } catch { /* file gone */ }
    }

    // Watch for changes
    try {
      const watcher = watch(filepath, () => readNewLines());
      // Also poll as backup (watch can miss events)
      const poll = setInterval(readNewLines, 1000);
      return { close() { watcher.close(); clearInterval(poll); } };
    } catch { return null; }
  }

  function processRecord(record) {
    if (record.type !== 'assistant') return;
    if (!record.message?.content) return;

    const blocks = Array.isArray(record.message.content)
      ? record.message.content
      : [record.message.content];

    for (const block of blocks) {
      if (block.type !== 'tool_use') continue;

      // Bash/shell commands
      if (block.name === 'Bash' || block.name === 'bash') {
        const cmd = block.input?.command;
        if (cmd) onCommand(cmd);
      }

      // File writes — synthesize touch
      if (block.name === 'Write' || block.name === 'Edit' || block.name === 'MultiEdit') {
        const file = block.input?.file_path || block.input?.path;
        if (file) onCommand(`touch ${file}`);
      }
    }
  }

  // Start tailing the most recent session
  const latest = findLatestSession();
  const watchers = [];
  if (latest) {
    const w = tailFile(latest);
    if (w) watchers.push(w);
  }

  // Watch for new session files
  let dirWatcher;
  try {
    dirWatcher = watch(projectDir, (_, filename) => {
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
