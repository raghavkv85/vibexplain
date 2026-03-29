#!/usr/bin/env node
import { startServer } from './server.js';
import { explain } from './explainer.js';
import { detectArtifacts } from './artifacts.js';
import { extractTriplets } from './triplets.js';
import { spawn } from 'child_process';
import { createInterface } from 'readline';
import { openDashboard } from './open.js';

const args = process.argv.slice(2);
const port = parseInt(process.env.VIBEXPLAIN_PORT || '3777', 10);

// Mode 1: Wrap a command — `vibexplain -- claude-code "build a todo app"`
// Mode 2: Pipe mode    — `some-agent 2>&1 | vibexplain`
// Mode 3: Demo mode    — `vibexplain --demo`

const dashSep = args.indexOf('--');
const isDemo = args.includes('--demo');
const isPipe = !process.stdin.isTTY && dashSep === -1 && !isDemo;
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

if (isWrap) {
  // Spawn the wrapped command
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
  const rl = createInterface({ input: process.stdin, terminal: false });
  rl.on('line', handleLine);
  openDashboard(port);

} else if (isDemo) {
  openDashboard(port);

  // Send a demo plan
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
        'Add SQS queue for async event processing',
        'Set up SNS for notifications',
        'Add Cognito user pool for authentication',
        'Containerize with Docker',
        'Set up CloudFront CDN distribution',
        'Deploy infrastructure with Terraform',
      ],
    });
  }, 400);

  const demoCommands = [
    'mkdir my-app',
    'npm init -y',
    'npm install express',
    'npm install --save-dev nodemon',
    'mkdir -p src/routes',
    'git init',
    'git add .',
    'git commit -m "initial commit"',
    'npm install mongoose',
    'aws dynamodb create-table --table-name users',
    'aws s3 mb s3://my-app-assets',
    'aws lambda create-function --function-name processOrder',
    'aws apigateway create-rest-api --name my-app-api',
    'aws sqs create-queue --queue-name order-events',
    'aws sns create-topic --name notifications',
    'aws cognito-idp create-user-pool --pool-name my-app-users',
    'docker build -t my-app .',
    'docker run -p 3000:3000 my-app',
    'aws cloudfront create-distribution --origin-domain my-app-assets.s3.amazonaws.com',
    'terraform apply',
  ];
  let i = 0;
  const interval = setInterval(() => {
    if (i >= demoCommands.length) { clearInterval(interval); return; }
    handleLine(demoCommands[i++]);
  }, 1200);

} else {
  console.log(`
\x1b[35m  vibexplain\x1b[0m — see what your AI is actually doing

  \x1b[1mUsage:\x1b[0m

    Wrap your agent:    vibexplain -- claude-code "build me a todo app"
    Pipe mode:          your-agent 2>&1 | vibexplain
    Demo:               vibexplain --demo

  Dashboard opens at http://localhost:${port}
`);
}
