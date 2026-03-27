// Detects files, directories, routes, and resources a command likely creates or touches
const patterns = [
  // mkdir — creates directories
  { match: /^mkdir\s+(-p\s+)?(.+)/, extract: (m) => m[2].split(/\s+/).map(d => ({ type: 'dir', name: d })) },
  // touch / echo > — creates files
  { match: /^touch\s+(.+)/, extract: (m) => m[1].split(/\s+/).map(f => ({ type: 'file', name: f })) },
  { match: />\s*(\S+)/, extract: (m) => [{ type: 'file', name: m[1] }] },
  // npm init — creates package.json
  { match: /^npm\s+init/, extract: () => [{ type: 'file', name: 'package.json' }] },
  // npm install — modifies package.json, creates node_modules
  { match: /^npm\s+(install|i)\s+/, extract: (m, cmd) => {
    const pkgs = cmd.replace(/^npm\s+(install|i)\s+/, '').split(/\s+/).filter(t => !t.startsWith('-'));
    return [{ type: 'dep', name: pkgs.join(', ') || 'dependencies' }, { type: 'dir', name: 'node_modules/' }];
  }},
  // git init — creates .git
  { match: /^git\s+init/, extract: () => [{ type: 'dir', name: '.git/' }] },
  // git commit — creates a commit
  { match: /^git\s+commit/, extract: (m, cmd) => {
    const msg = cmd.match(/-m\s+["']?([^"']+)/);
    return [{ type: 'commit', name: msg ? msg[1] : 'commit' }];
  }},
  // docker build — creates image
  { match: /^docker\s+build\s+.*-t\s+(\S+)/, extract: (m) => [{ type: 'image', name: m[1] }] },
  // docker run — starts container
  { match: /^docker\s+run/, extract: (m, cmd) => {
    const port = cmd.match(/-p\s+(\d+:\d+)/);
    return [{ type: 'container', name: port ? `port ${port[1]}` : 'container' }];
  }},
  // terraform apply — creates infra
  { match: /^terraform\s+apply/, extract: () => [{ type: 'infra', name: 'infrastructure resources' }] },
  // cargo new/init
  { match: /^cargo\s+(new|init)\s+(\S+)/, extract: (m) => [{ type: 'dir', name: m[2] + '/' }, { type: 'file', name: 'Cargo.toml' }] },
  // pip install
  { match: /^pip\s+install\s+/, extract: (m, cmd) => {
    const pkgs = cmd.replace(/^pip\s+install\s+/, '').split(/\s+/).filter(t => !t.startsWith('-'));
    return [{ type: 'dep', name: pkgs.join(', ') }];
  }},
  // node/python — runs a file
  { match: /^(node|python|python3|ruby)\s+(\S+)/, extract: (m) => [{ type: 'run', name: m[2] }] },
  // go build/run
  { match: /^go\s+(build|run)\s+(\S+)/, extract: (m) => [{ type: 'run', name: m[2] }] },
  // yarn/pnpm add
  { match: /^(yarn|pnpm)\s+add\s+/, extract: (m, cmd) => {
    const pkgs = cmd.replace(/^(yarn|pnpm)\s+add\s+/, '').split(/\s+/).filter(t => !t.startsWith('-'));
    return [{ type: 'dep', name: pkgs.join(', ') }];
  }},
  // make
  { match: /^make(\s+\S+)?/, extract: (m) => [{ type: 'run', name: m[1]?.trim() || 'default target' }] },
  // wget
  { match: /^wget\s+.*?(\S+)$/, extract: (m) => [{ type: 'file', name: m[1].split('/').pop() || 'download' }] },
  // tar extract
  { match: /^tar\s+.*?(\S+)$/, extract: (m) => [{ type: 'file', name: m[1] }] },
  // ssh/scp
  { match: /^ssh\s+(\S+)/, extract: (m) => [{ type: 'run', name: `→ ${m[1]}` }] },
  // gem install
  { match: /^gem\s+install\s+(\S+)/, extract: (m) => [{ type: 'dep', name: m[1] }] },
];

const typeIcons = {
  file: '📄', dir: '📁', dep: '📦', commit: '💾',
  image: '🐳', container: '▶️', infra: '☁️', run: '🚀',
};

export function detectArtifacts(command) {
  for (const p of patterns) {
    const m = command.match(p.match);
    if (m) {
      return p.extract(m, command).map(a => ({ ...a, icon: typeIcons[a.type] || '•' }));
    }
  }
  return [];
}
