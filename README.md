# ⚡ vibexplain

See what your AI coding agent is actually doing — in real time.

![status](https://img.shields.io/badge/status-alpha-blueviolet) ![license](https://img.shields.io/badge/license-MIT-green) ![node](https://img.shields.io/badge/node-%3E%3D18-blue)

---

You tell an AI agent to "build me a serverless API with auth" and it starts running. But what is it actually doing? vibexplain shows you — a live dashboard with a mind map, architecture diagram, and plain-English explanations.

## Install

```bash
npm install -g vibexplain
```

Requires [Node.js](https://nodejs.org/) v18+.

## Usage

(E.g. Kiro - Terminal)
```bash
# Terminal 1
cd your-project
vibexplain

# Terminal 2 — use your agent as normal
kiro-cli chat    # or claude, cursor, aider, anything
```

That's it. The dashboard opens automatically in your browser.

### New project?

Start vibexplain first, then tell your agent what to build. The dashboard starts empty and fills in as your agent works — files, dependencies, infrastructure, commits.

| Tool | What you do | What vibexplain sees |
|---|---|---|
| **Kiro** | `cd your-project && vibexplain` in Terminal 1, `kiro-cli chat` in Terminal 2 | File watcher detects new files, deps, IaC, git commits |
| **Claude Code** | `cd your-project && vibexplain` in Terminal 1, `claude` in Terminal 2 | JSONL tailer captures every exact command + file watcher as backup |
| **Cursor / Windsurf** | `cd your-project && vibexplain` in Terminal 1, use IDE normally | File watcher detects all filesystem changes |
| **Aider** | `cd your-project && vibexplain` in Terminal 1, `aider` in Terminal 2 | File watcher + stdout parsing via `vibexplain -- aider` |

### Existing project?

vibexplain scans your project on startup — git history, package.json, Terraform, Serverless, CDK — and pre-populates the dashboard with what's already there. Then it watches for new changes.

| Tool | What you do | What vibexplain sees |
|---|---|---|
| **Kiro** | `cd your-project && vibexplain` in Terminal 1, then `kiro-cli chat` in Terminal 2 | Scanner bootstraps dashboard (git, deps, IaC with real names), then file watcher tracks new changes |
| **Claude Code** | `cd your-project && vibexplain` in Terminal 1, then `claude` in Terminal 2 | Scanner bootstraps + JSONL tailer captures exact commands going forward |
| **Cursor / Windsurf** | `cd your-project && vibexplain` in Terminal 1, use IDE normally | Scanner bootstraps + file watcher tracks changes |
| **Aider** | `cd your-project && vibexplain` in Terminal 1, then `aider` in Terminal 2 | Scanner bootstraps + file watcher tracks changes |

## How it detects changes

vibexplain layers three detection methods. All run automatically.

| Method | What it catches | Works with |
|---|---|---|
| **Scanner** | Git history, deps, IaC resources (with real names) | Everything |
| **File watcher** | New files, dep changes, IaC changes, git commits | Every agent |
| **Claude Code tailer** | Exact Bash commands from JSONL session logs | Claude Code (auto-detected) |

Claude Code users get exact commands automatically. Everyone else gets file-watcher-based detection. No config needed either way.

## What you see

Three views + a narrative panel:

- **🧠 Mind Map** — commands grouped by category (packages, git, infra, etc.)
- **🏗️ Architecture** — live diagram of 121 cloud services across AWS, GCP, Azure, and more
- **🔗 Dependencies** — relationships between packages, services, and configs
- **📖 Narrative** — plain-English explanation of what's happening and why

## Other modes

```bash
vibexplain --demo              # sample data, no agent needed
vibexplain --scan              # one-time scan, no live updates
vibexplain -- claude "prompt"  # wrap an agent process
your-agent 2>&1 | vibexplain  # pipe mode
```

## Spec-driven architecture

Drop a `PLAN.md`, `spec.md`, or `TODO.md` in your project root. vibexplain pre-draws a skeleton architecture that lights up as your agent builds each piece.

## Development

```bash
git clone https://github.com/raghavkv85/vibexplain.git
cd vibexplain
npm install
npm run demo
```

## License

MIT
