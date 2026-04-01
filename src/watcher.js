// Watches the project directory for real-time changes and synthesizes commands
import { watch, readFileSync, existsSync, statSync } from 'fs';
import { join, basename, extname } from 'path';
import { execSync } from 'child_process';

const IGNORE = new Set(['node_modules', '.git', 'dist', 'build', '.next', '__pycache__', '.terraform', 'target', 'coverage', '.vibexplain', '.DS_Store']);
const DEBOUNCE_MS = 500;

export function startWatcher(cwd, onCommand) {
  const pending = new Map();
  let lastPkgDeps = snapshotDeps(cwd);
  let lastGitHead = getGitHead(cwd);
  const iacState = new Map(); // file -> Set of matched cloud commands (for diffing)
  let startupGrace = true;
  setTimeout(() => { startupGrace = false; }, 2000); // ignore events during startup

  // Poll git HEAD for new commits
  const gitPoll = setInterval(() => {
    const head = getGitHead(cwd);
    if (head && head !== lastGitHead) {
      lastGitHead = head;
      const msg = getLastCommitMsg(cwd);
      onCommand(`git commit -m "${msg || 'update'}"`);
    }
  }, 2000);

  function watchDir(dir) {
    try {
      return watch(dir, { recursive: true }, (eventType, filename) => {
        if (!filename || startupGrace) return;
        const parts = filename.split('/');
        if (parts.some(p => IGNORE.has(p) || p.startsWith('.'))) return;

        const key = filename;
        if (pending.has(key)) clearTimeout(pending.get(key));
        pending.set(key, setTimeout(() => {
          pending.delete(key);
          handleChange(filename);
        }, DEBOUNCE_MS));
      });
    } catch { return null; }
  }

  function handleChange(filename) {
    const full = join(cwd, filename);
    const base = basename(filename);
    const ext = extname(filename);
    const exists = existsSync(full);

    // Package.json — diff deps
    if (base === 'package.json' && exists) {
      const newDeps = snapshotDeps(cwd);
      const added = [...newDeps].filter(d => !lastPkgDeps.has(d));
      const removed = [...lastPkgDeps].filter(d => !newDeps.has(d));
      lastPkgDeps = newDeps;
      if (added.length) onCommand(`npm install ${added.join(' ')}`);
      if (removed.length) onCommand(`npm uninstall ${removed.join(' ')}`);
      return;
    }

    // requirements.txt
    if (base === 'requirements.txt' && exists) {
      onCommand('pip install -r requirements.txt');
      return;
    }

    // Dockerfile / docker-compose
    if (base === 'Dockerfile' || base.startsWith('docker-compose.')) {
      onCommand(base === 'Dockerfile' ? `docker build -t ${basename(cwd)} .` : 'docker compose up');
      return;
    }

    // Terraform files
    if (ext === '.tf') { onCommand('terraform apply'); return; }

    // Serverless / CDK / Pulumi
    if (base === 'serverless.yml' || base === 'serverless.yaml') { onCommand('serverless deploy'); return; }
    if (base === 'cdk.json') { onCommand('cdk deploy'); return; }
    if (base === 'pulumi.yaml') { onCommand('pulumi up'); return; }

    // IaC content — only emit NEW cloud resources (diff against previous state)
    if (exists && ['.tf', '.yml', '.yaml', '.json', '.ts', '.js'].includes(ext)) {
      const newCmds = new Set(detectCloudResources(full));
      const prev = iacState.get(filename) || new Set();
      iacState.set(filename, newCmds);
      for (const cmd of newCmds) {
        if (!prev.has(cmd)) onCommand(cmd);
      }
      if (newCmds.size > 0) return;
    }

    // File deleted
    if (!exists) {
      onCommand(`rm ${filename}`);
      return;
    }

    // Skip generic touch events for regular file edits — they're noise.
    // Only emit for genuinely new files (not in git).
    try {
      const tracked = execSync(`git ls-files ${filename}`, { cwd, encoding: 'utf-8', timeout: 2000, stdio: ['pipe', 'pipe', 'pipe'] }).trim();
      if (tracked) return; // existing tracked file was just edited, skip
    } catch { /* not a git repo or git not available, fall through */ }

    // New file
    try {
      const stat = statSync(full);
      if (stat.isDirectory()) {
        onCommand(`mkdir -p ${filename}`);
      } else {
        onCommand(`touch ${filename}`);
      }
    } catch { /* race condition */ }
  }

  const watcher = watchDir(cwd);
  console.log(`\x1b[35m  vibexplain\x1b[0m watching project for changes…`);

  return {
    close() {
      clearInterval(gitPoll);
      if (watcher) watcher.close();
    }
  };
}

function snapshotDeps(cwd) {
  try {
    const pkg = JSON.parse(readFileSync(join(cwd, 'package.json'), 'utf-8'));
    return new Set([...Object.keys(pkg.dependencies || {}), ...Object.keys(pkg.devDependencies || {})]);
  } catch { return new Set(); }
}

function getGitHead(cwd) {
  try {
    return execSync('git rev-parse HEAD', { cwd, encoding: 'utf-8', timeout: 2000, stdio: ['pipe', 'pipe', 'pipe'] }).trim();
  } catch { return null; }
}

function getLastCommitMsg(cwd) {
  try {
    return execSync('git log -1 --format=%s', { cwd, encoding: 'utf-8', timeout: 2000, stdio: ['pipe', 'pipe', 'pipe'] }).trim();
  } catch { return null; }
}

const cloudPatterns = [
  [/dynamodb|dynamo_db/i, 'aws dynamodb create-table --table-name app-table'],
  [/aws_lambda|lambda.*function/i, 'aws lambda create-function --function-name app-function'],
  [/apigateway|api.gateway/i, 'aws apigateway create-rest-api --name app-api'],
  [/s3.*bucket|aws_s3_bucket/i, 'aws s3 mb s3://app-bucket'],
  [/sqs|aws_sqs/i, 'aws sqs create-queue --queue-name app-queue'],
  [/sns|aws_sns/i, 'aws sns create-topic --name app-topic'],
  [/cognito|user.pool/i, 'aws cognito-idp create-user-pool --pool-name app-users'],
  [/cloudfront|distribution/i, 'aws cloudfront create-distribution --origin-domain app.s3.amazonaws.com'],
  [/ecs|fargate/i, 'aws ecs create-cluster --cluster-name app-cluster'],
  [/rds|aurora|db.instance/i, 'aws rds create-db-instance --db-instance-identifier app-db'],
  [/step.?function|state.?machine/i, 'aws stepfunctions create-state-machine --name app-workflow'],
  [/eventbridge|event.?bus/i, 'aws events create-event-bus --name app-events'],
  [/cloud.?function|gcf/i, 'gcloud functions deploy app-function'],
  [/cloud.?run/i, 'gcloud run deploy app-service'],
  [/bigquery/i, 'bq mk app_dataset'],
  [/cosmos.?db/i, 'az cosmosdb create --name app-cosmos'],
];

function detectCloudResources(filePath) {
  try {
    const content = readFileSync(filePath, 'utf-8');
    return cloudPatterns.filter(([p]) => p.test(content)).map(([, cmd]) => cmd);
  } catch { return []; }
}
