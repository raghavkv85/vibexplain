#!/usr/bin/env node
import { startServer } from './server.js';
import { explain } from './explainer.js';
import { detectArtifacts } from './artifacts.js';
import { extractTriplets } from './triplets.js';
import { spawn } from 'child_process';
import { createInterface } from 'readline';
import { openDashboard } from './open.js';
import { scanProject } from './scanner.js';

const args = process.argv.slice(2);
const port = parseInt(process.env.VIBEXPLAIN_PORT || '3777', 10);
const noScan = args.includes('--no-scan');

// Mode 1: Wrap a command — `vibexplain -- claude-code "build a todo app"`
// Mode 2: Pipe mode    — `some-agent 2>&1 | vibexplain`
// Mode 3: Demo mode    — `vibexplain --demo`
// Mode 4: Scan only    — `vibexplain --scan`

const dashSep = args.indexOf('--');
const isDemo = args.includes('--demo');
const isScanOnly = args.includes('--scan') && dashSep === -1;
const isPipe = !process.stdin.isTTY && dashSep === -1 && !isDemo && !isScanOnly;
const isWrap = dashSep !== -1;

const { broadcast } = startServer(port);
let seq = 0;

function handleLine(line) {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith('#') || trimmed.startsWith('//')) return;
  const cleaned = trimmed.startsWith('$ ') ? trimmed.slice(2) : trimmed;
  if (!/^[a-zA-Z_./~][a-zA-Z0-9_./-]*\s/.test(cleaned) && !/^[a-zA-Z_./~][a-zA-Z0-9_./-]*$/.test(cleaned)) return;

  const explanation = explain(cleaned);
  if (!explanation) return;
  const artifacts = detectArtifacts(cleaned);
  const triplets = extractTriplets(cleaned);
  broadcast({
    id: ++seq,
    ts: Date.now(),
    raw: cleaned,
    explanation: Array.isArray(explanation) ? explanation : [explanation],
    artifacts,
    triplets,
  });
  console.log(`\x1b[36m  #${seq}\x1b[0m ${cleaned}`);
}

function bootstrapScan() {
  const commands = scanProject();
  if (!commands.length) return;
  console.log(`\x1b[35m  vibexplain\x1b[0m scanning project… found ${commands.length} historical items`);
  for (const cmd of commands) handleLine(cmd);
  console.log(`\x1b[35m  vibexplain\x1b[0m scan complete — dashboard pre-populated`);
}

if (isScanOnly) {
  openDashboard(port);
  bootstrapScan();

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
  console.log(`
\x1b[35m  vibexplain\x1b[0m — see what your AI is actually doing

  \x1b[1mUsage:\x1b[0m

    Wrap your agent:    vibexplain -- claude-code "build me a todo app"
    Pipe mode:          your-agent 2>&1 | vibexplain
    Scan only:          vibexplain --scan
    Demo:               vibexplain --demo
    Skip auto-scan:     vibexplain --no-scan -- claude-code "..."

  Dashboard opens at http://localhost:${port}
`);
}
