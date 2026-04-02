#!/usr/bin/env node
import { startServer } from './server.js';
import { explain } from './explainer.js';
import { detectArtifacts } from './artifacts.js';
import { extractTriplets } from './triplets.js';
import { spawn } from 'child_process';
import { createInterface } from 'readline';
import { openDashboard } from './open.js';
import { scanProject } from './scanner.js';
import { startWatcher } from './watcher.js';
import { startClaudeCodeTailer } from './claude-tailer.js';
import { startCodexTailer } from './codex-tailer.js';

const args = process.argv.slice(2);

if (args.includes('--help') || args.includes('-h')) {
  console.log(`
\x1b[35m  vibexplain\x1b[0m — see what your AI is actually doing

  \x1b[1mUsage:\x1b[0m

    vibexplain                  Scan project + watch for live changes (default)
    vibexplain --demo           Run with sample data
    vibexplain --scan           One-time scan, no live updates
    vibexplain -- <agent> ...   Wrap an agent process + watch files

  \x1b[1mOptions:\x1b[0m

    --no-scan           Skip initial project scan
    --no-watch          Disable file watcher in wrap mode
    --help, -h          Show this help

  Dashboard opens at http://localhost:${process.env.VIBEXPLAIN_PORT || 3777}
`);
  process.exit(0);
}

const port = parseInt(process.env.VIBEXPLAIN_PORT || '3777', 10);
const noScan = args.includes('--no-scan');
const noWatch = args.includes('--no-watch');

// Mode 1: Wrap a command — `vibexplain -- claude-code "build a todo app"`
// Mode 2: Pipe mode    — `some-agent 2>&1 | vibexplain`
// Mode 3: Demo mode    — `vibexplain --demo`
// Mode 4: Scan only    — `vibexplain --scan`
// Mode 5: Watch mode   — `vibexplain --watch` (scan + live file watching)

const dashSep = args.indexOf('--');
const isDemo = args.includes('--demo');
const isWatch = args.includes('--watch') && dashSep === -1;
const isScanOnly = args.includes('--scan') && dashSep === -1 && !isWatch;
const isPipe = !process.stdin.isTTY && dashSep === -1 && !isDemo && !isScanOnly && !isWatch;
const isWrap = dashSep !== -1;

const { broadcast } = startServer(port);
let seq = 0;

function processCommand(cmd) {
  const explanation = explain(cmd);
  if (!explanation) return;
  const artifacts = detectArtifacts(cmd);
  const triplets = extractTriplets(cmd);
  broadcast({
    id: ++seq,
    ts: Date.now(),
    raw: cmd,
    explanation: Array.isArray(explanation) ? explanation : [explanation],
    artifacts,
    triplets,
  });
  console.log(`\x1b[36m  #${seq}\x1b[0m ${cmd}`);
}

// Patterns that AI coding agents use to display commands in their output
const agentCommandPatterns = [
  // Claude Code: ⏺ Bash(npm install express) or ⏺ bash: npm install express
  /^[⏺●]\s*(?:Bash|bash)\s*\(\s*(.+?)\s*\)/i,
  /^[⏺●]\s*(?:Bash|bash|execute_bash|shell|run|command)[:\s]+(.+)/i,
  // Aider: > Run shell command: npm install express
  /^>\s*(?:Run(?:ning)?|Shell)\s*(?:shell\s*)?(?:command)?[:\s]+(.+)/i,
  // Generic patterns
  /^(?:Running|Executing|Command)[:\s]+[`'"]?(.+?)[`'"]?\s*$/i,
  /^\$\s+(.+)/,
];

function handleLine(line) {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith('#') || trimmed.startsWith('//')) return;

  // Try extracting a command from agent output patterns first
  for (const pat of agentCommandPatterns) {
    const m = trimmed.match(pat);
    if (m && m[1]) { processCommand(m[1].trim()); return; }
  }

  // Direct command detection (original logic)
  const cleaned = trimmed.startsWith('$ ') ? trimmed.slice(2) : trimmed;
  if (!/^[a-zA-Z_./~][a-zA-Z0-9_./-]*\s/.test(cleaned) && !/^[a-zA-Z_./~][a-zA-Z0-9_./-]*$/.test(cleaned)) return;
  processCommand(cleaned);
}

function bootstrapScan() {
  const commands = scanProject();
  if (!commands.length) return;
  console.log(`\x1b[35m  vibexplain\x1b[0m scanning project… found ${commands.length} historical items`);
  for (const cmd of commands) handleLine(cmd);
  console.log(`\x1b[35m  vibexplain\x1b[0m scan complete — dashboard pre-populated`);
}

// Starts file watcher + Claude Code JSONL tailer with shared dedup
function startLiveTracking() {
  const seenCmds = new Set();
  const dedupedHandler = (cmd) => {
    if (seenCmds.has(cmd)) return;
    seenCmds.add(cmd);
    setTimeout(() => seenCmds.delete(cmd), 5000);
    handleLine(cmd);
  };
  startWatcher(process.cwd(), dedupedHandler);
  startClaudeCodeTailer(process.cwd(), dedupedHandler);
  startCodexTailer(process.cwd(), dedupedHandler);
}

if (isScanOnly) {
  openDashboard(port);
  bootstrapScan();

} else if (isWatch) {
  if (!noScan) bootstrapScan();
  startLiveTracking();
  openDashboard(port);

} else if (isWrap) {
  if (!noScan) bootstrapScan();

  const childArgs = args.slice(dashSep + 1);
  if (!childArgs.length) {
    console.error('Usage: vibexplain -- <command> [args...]');
    process.exit(1);
  }

  const child = spawn(childArgs[0], childArgs.slice(1), {
    stdio: ['inherit', 'pipe', 'pipe'],
    shell: true,
  });

  const rlOut = createInterface({ input: child.stdout });
  const rlErr = createInterface({ input: child.stderr });
  rlOut.on('line', (l) => { process.stdout.write(l + '\n'); handleLine(l); });
  rlErr.on('line', (l) => { process.stderr.write(l + '\n'); handleLine(l); });

  // Also watch files + tail Claude Code sessions
  if (!noWatch) startLiveTracking();

  child.on('exit', (code) => {
    console.log(`\x1b[35m  vibexplain\x1b[0m agent exited (${code}). Dashboard still running at http://localhost:${port}`);
  });

  openDashboard(port);

} else if (isPipe) {
  if (!noScan) bootstrapScan();
  const rl = createInterface({ input: process.stdin, terminal: false });
  rl.on('line', handleLine);
  openDashboard(port);

} else if (isDemo) {
  openDashboard(port);

  // Phase 1: Simulate scanning an existing project (instant, like --scan)
  const scanCommands = [
    'git init',
    'git commit -m "initial commit"',
    'git commit -m "add Express API with routes"',
    'git commit -m "add DynamoDB user table and S3 bucket"',
    'git commit -m "add Lambda order processor"',
    'git commit -m "add Docker support"',
    'npm init -y',
    'npm install express mongoose dotenv',
    'npm install --save-dev nodemon jest',
    'mkdir -p src/routes src/models src/middleware',
    'aws dynamodb create-table --table-name users',
    'aws s3 mb s3://my-app-assets',
    'aws lambda create-function --function-name processOrder',
    'aws apigateway create-rest-api --name my-app-api',
    'aws cognito-idp create-user-pool --pool-name my-app-users',
    'docker build -t my-app .',
  ];

  // Phase 2: Live commands — agent adds new features on top
  const liveCommands = [
    'npm install ioredis',
    'aws sqs create-queue --queue-name order-events',
    'aws sns create-topic --name notifications',
    'aws cloudfront create-distribution --origin-domain my-app-assets.s3.amazonaws.com',
    'aws elasticache create-cache-cluster --cache-cluster-id my-app-cache',
    'terraform apply',
    'kubectl apply -f k8s/deployment.yaml',
    'docker run -p 3000:3000 my-app',
    'aws stepfunctions create-state-machine --name order-workflow',
    'aws events put-rule --name nightly-sync',
  ];

  // Send plan
  setTimeout(() => {
    broadcast({
      type: 'plan',
      steps: [
        'Initialize a new Node.js project with Express',
        'Set up project structure and version control',
        'Create DynamoDB table for user data',
        'Set up S3 bucket for static assets',
        'Create Lambda function for order processing',
        'Configure API Gateway as the entry point',
        'Add Cognito user pool for authentication',
        'Containerize with Docker',
        'Add SQS queue for async event processing',
        'Add SNS for notifications',
        'Set up CloudFront CDN distribution',
        'Add ElastiCache for session caching',
        'Deploy infrastructure with Terraform',
        'Add Step Functions workflow for orders',
        'Set up EventBridge for scheduled tasks',
      ],
    });
  }, 400);

  // Phase 1: rapid-fire scan results (existing project state)
  setTimeout(() => {
    console.log(`\x1b[35m  vibexplain\x1b[0m scanning project… found ${scanCommands.length} historical items`);
    for (const cmd of scanCommands) handleLine(cmd);
    console.log(`\x1b[35m  vibexplain\x1b[0m scan complete — dashboard pre-populated`);

    // Phase 2: live commands stream in with delay
    let i = 0;
    const interval = setInterval(() => {
      if (i >= liveCommands.length) { clearInterval(interval); return; }
      handleLine(liveCommands[i++]);
    }, 1500);
  }, 1000);

} else {
  // Default: scan + watch + tail Claude Code sessions
  if (!noScan) bootstrapScan();
  startLiveTracking();
  openDashboard(port);
}
