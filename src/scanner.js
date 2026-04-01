// Scans an existing project to bootstrap the dashboard with historical context
import { execSync } from 'child_process';
import { existsSync, readFileSync, readdirSync, statSync } from 'fs';
import { join, basename } from 'path';

const cwd = process.cwd();

function tryRead(file) {
  const p = join(cwd, file);
  return existsSync(p) ? readFileSync(p, 'utf-8') : null;
}

function tryExec(cmd) {
  try { return execSync(cmd, { cwd, encoding: 'utf-8', timeout: 5000, stdio: ['pipe', 'pipe', 'pipe'] }).trim(); } catch { return ''; }
}

// Synthesize commands that represent the current project state
export function scanProject() {
  const commands = [];

  // 1. Git history — recent commands the agent likely ran
  const log = tryExec('git log --oneline --reverse -50');
  if (log) {
    commands.push('git init');
    for (const line of log.split('\n').filter(Boolean)) {
      const msg = line.replace(/^[a-f0-9]+\s+/, '');
      commands.push(`git commit -m "${msg}"`);
    }
  }

  // 2. Package managers — reconstruct install commands from lockfiles/manifests
  const pkg = tryRead('package.json');
  if (pkg) {
    try {
      const p = JSON.parse(pkg);
      commands.push('npm init -y');
      const deps = Object.keys(p.dependencies || {});
      const devDeps = Object.keys(p.devDependencies || {});
      if (deps.length) commands.push(`npm install ${deps.join(' ')}`);
      if (devDeps.length) commands.push(`npm install --save-dev ${devDeps.join(' ')}`);
      // Scripts hint at what the project does
      for (const [name, script] of Object.entries(p.scripts || {})) {
        if (name !== 'start' && name !== 'test') commands.push(script);
      }
    } catch { /* ignore parse errors */ }
  }

  const reqs = tryRead('requirements.txt');
  if (reqs) {
    const pkgs = reqs.split('\n').map(l => l.trim().split(/[=<>!]/)[0]).filter(Boolean);
    if (pkgs.length) commands.push(`pip install ${pkgs.join(' ')}`);
  }

  const cargo = tryRead('Cargo.toml');
  if (cargo) {
    const depMatches = cargo.matchAll(/^(\w[\w-]*)\s*=/gm);
    for (const m of depMatches) {
      if (!['package', 'name', 'version', 'edition', 'authors', 'description'].includes(m[1])) {
        commands.push(`cargo add ${m[1]}`);
      }
    }
  }

  // 3. Docker
  if (existsSync(join(cwd, 'Dockerfile'))) {
    const name = basename(cwd);
    commands.push(`docker build -t ${name} .`);
  }
  if (existsSync(join(cwd, 'docker-compose.yml')) || existsSync(join(cwd, 'docker-compose.yaml'))) {
    commands.push('docker compose up');
  }

  // 4. Infrastructure as Code
  if (existsSync(join(cwd, 'terraform'))) commands.push('terraform init', 'terraform apply');
  for (const f of ['main.tf', 'terraform.tf']) {
    if (existsSync(join(cwd, f))) { commands.push('terraform init', 'terraform apply'); break; }
  }
  if (existsSync(join(cwd, 'serverless.yml'))) commands.push('serverless deploy');
  if (existsSync(join(cwd, 'cdk.json'))) commands.push('cdk deploy');
  if (existsSync(join(cwd, 'pulumi.yaml'))) commands.push('pulumi up');

  // 5. AWS/GCP/Azure resources from IaC files
  const iacCommands = scanIaCFiles();
  commands.push(...iacCommands);

  // 6. Project structure — synthesize mkdir for key directories
  const dirs = scanDirs();
  if (dirs.length) commands.push(`mkdir -p ${dirs.join(' ')}`);

  // Deduplicate
  return [...new Set(commands)];
}

function scanDirs() {
  const ignore = new Set(['node_modules', '.git', 'dist', 'build', '.next', '__pycache__', '.terraform', 'target', 'coverage']);
  try {
    return readdirSync(cwd)
      .filter(f => !ignore.has(f) && !f.startsWith('.') && statSync(join(cwd, f)).isDirectory());
  } catch { return []; }
}

function scanIaCFiles() {
  const commands = [];
  const seen = new Set();

  // Map of patterns in IaC files to synthetic AWS/GCP/Azure CLI commands
  const resourceMap = [
    [/dynamodb|dynamo_db/i, 'aws dynamodb create-table --table-name app-table'],
    [/lambda|aws_lambda/i, 'aws lambda create-function --function-name app-function'],
    [/apigateway|api.gateway|rest.api|http.api/i, 'aws apigateway create-rest-api --name app-api'],
    [/s3.*bucket|aws_s3/i, 'aws s3 mb s3://app-bucket'],
    [/sqs|queue/i, 'aws sqs create-queue --queue-name app-queue'],
    [/sns|topic/i, 'aws sns create-topic --name app-topic'],
    [/cognito|user.pool/i, 'aws cognito-idp create-user-pool --pool-name app-users'],
    [/cloudfront|distribution/i, 'aws cloudfront create-distribution --origin-domain app.s3.amazonaws.com'],
    [/ecs|fargate|task.definition/i, 'aws ecs create-cluster --cluster-name app-cluster'],
    [/ec2|instance/i, 'aws ec2 run-instances --instance-type t3.micro'],
    [/rds|aurora|db.instance/i, 'aws rds create-db-instance --db-instance-identifier app-db'],
    [/elasticache|redis.*aws/i, 'aws elasticache create-cache-cluster --cache-cluster-id app-cache'],
    [/step.?function|state.?machine/i, 'aws stepfunctions create-state-machine --name app-workflow'],
    [/eventbridge|event.?bus/i, 'aws events create-event-bus --name app-events'],
    [/secrets?.?manager/i, 'aws secretsmanager create-secret --name app-secret'],
    [/cloud.?watch|log.?group/i, 'aws logs create-log-group --log-group-name app-logs'],
    [/route.?53|hosted.?zone/i, 'aws route53 create-hosted-zone --name app.example.com'],
    [/waf|web.?acl/i, 'aws wafv2 create-web-acl --name app-waf'],
    [/kms|encrypt/i, 'aws kms create-key'],
    [/kinesis|stream/i, 'aws kinesis create-stream --stream-name app-stream'],
    [/cloud.?function|gcf/i, 'gcloud functions deploy app-function'],
    [/cloud.?run/i, 'gcloud run deploy app-service'],
    [/bigquery/i, 'bq mk app_dataset'],
    [/firestore/i, 'gcloud firestore databases create'],
    [/pub.?sub/i, 'gcloud pubsub topics create app-topic'],
    [/azure.*function/i, 'az functionapp create --name app-function'],
    [/cosmos.?db/i, 'az cosmosdb create --name app-cosmos'],
    [/blob.*storage|storage.*account/i, 'az storage account create --name appstorage'],
  ];

  // Scan terraform, serverless, CDK, and other IaC files
  const iacGlobs = [
    '*.tf', 'serverless.yml', 'serverless.yaml', 'template.yaml', 'template.yml',
    'cdk.json', 'pulumi.yaml',
  ];

  function scanDir(dir, depth = 0) {
    if (depth > 3) return;
    try {
      for (const entry of readdirSync(dir)) {
        if (entry.startsWith('.') || entry === 'node_modules' || entry === '.terraform') continue;
        const full = join(dir, entry);
        const stat = statSync(full);
        if (stat.isDirectory()) {
          scanDir(full, depth + 1);
        } else if (iacGlobs.some(g => entry.endsWith(g.replace('*', '')))) {
          const content = readFileSync(full, 'utf-8');
          for (const [pattern, cmd] of resourceMap) {
            if (pattern.test(content) && !seen.has(cmd)) {
              seen.add(cmd);
              commands.push(cmd);
            }
          }
        }
      }
    } catch { /* permission errors etc */ }
  }

  scanDir(cwd);
  return commands;
}
