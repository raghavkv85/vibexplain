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

export function scanProject() {
  const commands = [];

  // 1. Git history
  const log = tryExec('git log --oneline --reverse -50');
  if (log) {
    commands.push('git init');
    for (const line of log.split('\n').filter(Boolean)) {
      const msg = line.replace(/^[a-f0-9]+\s+/, '');
      commands.push(`git commit -m "${msg}"`);
    }
  }

  // 2. Package managers
  const pkg = tryRead('package.json');
  if (pkg) {
    try {
      const p = JSON.parse(pkg);
      commands.push('npm init -y');
      const deps = Object.keys(p.dependencies || {});
      const devDeps = Object.keys(p.devDependencies || {});
      if (deps.length) commands.push(`npm install ${deps.join(' ')}`);
      if (devDeps.length) commands.push(`npm install --save-dev ${devDeps.join(' ')}`);
      for (const [name, script] of Object.entries(p.scripts || {})) {
        if (name !== 'start' && name !== 'test') commands.push(script);
      }
    } catch { /* ignore */ }
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
  if (existsSync(join(cwd, 'Dockerfile'))) commands.push(`docker build -t ${basename(cwd)} .`);
  if (existsSync(join(cwd, 'docker-compose.yml')) || existsSync(join(cwd, 'docker-compose.yaml'))) {
    commands.push('docker compose up');
  }

  // 4. Infrastructure as Code — extract real resource names
  if (existsSync(join(cwd, 'terraform')) || ['main.tf', 'terraform.tf'].some(f => existsSync(join(cwd, f)))) {
    commands.push('terraform init', 'terraform apply');
  }
  if (existsSync(join(cwd, 'serverless.yml'))) commands.push('serverless deploy');
  if (existsSync(join(cwd, 'cdk.json'))) commands.push('cdk deploy');
  if (existsSync(join(cwd, 'pulumi.yaml'))) commands.push('pulumi up');

  commands.push(...scanIaCFiles());

  // 5. Project structure
  const dirs = scanDirs();
  if (dirs.length) commands.push(`mkdir -p ${dirs.join(' ')}`);

  return [...new Set(commands)];
}

function scanDirs() {
  const ignore = new Set(['node_modules', '.git', 'dist', 'build', '.next', '__pycache__', '.terraform', 'target', 'coverage']);
  try {
    return readdirSync(cwd)
      .filter(f => !ignore.has(f) && !f.startsWith('.') && statSync(join(cwd, f)).isDirectory());
  } catch { return []; }
}

// --- IaC scanning with real resource name extraction ---

// Terraform: resource "aws_dynamodb_table" "users" { ... name = "users-table" }
function extractTerraformResources(content) {
  const cmds = [];
  // Match resource blocks and try to find the name attribute inside
  const resourceBlocks = content.matchAll(/resource\s+"(\w+)"\s+"(\w+)"\s*\{([^}]*(?:\{[^}]*\}[^}]*)*)\}/gs);
  for (const [, type, localName, body] of resourceBlocks) {
    const nameMatch = body.match(/(?:name|table_name|function_name|queue_name|topic_name|cluster_name|bucket)\s*=\s*"([^"]+)"/);
    const name = nameMatch?.[1] || localName;
    const cmd = terraformTypeToCmd(type, name);
    if (cmd) cmds.push(cmd);
  }
  return cmds;
}

const tfTypeMap = [
  [/aws_dynamodb_table/, (n) => `aws dynamodb create-table --table-name ${n}`],
  [/aws_lambda_function/, (n) => `aws lambda create-function --function-name ${n}`],
  [/aws_api_gateway_rest_api|aws_apigatewayv2_api/, (n) => `aws apigateway create-rest-api --name ${n}`],
  [/aws_s3_bucket/, (n) => `aws s3 mb s3://${n}`],
  [/aws_sqs_queue/, (n) => `aws sqs create-queue --queue-name ${n}`],
  [/aws_sns_topic/, (n) => `aws sns create-topic --name ${n}`],
  [/aws_cognito_user_pool/, (n) => `aws cognito-idp create-user-pool --pool-name ${n}`],
  [/aws_cloudfront_distribution/, (n) => `aws cloudfront create-distribution --origin-domain ${n}`],
  [/aws_ecs_cluster/, (n) => `aws ecs create-cluster --cluster-name ${n}`],
  [/aws_db_instance|aws_rds_cluster/, (n) => `aws rds create-db-instance --db-instance-identifier ${n}`],
  [/aws_elasticache/, (n) => `aws elasticache create-cache-cluster --cache-cluster-id ${n}`],
  [/aws_sfn_state_machine/, (n) => `aws stepfunctions create-state-machine --name ${n}`],
  [/aws_cloudwatch_event_rule|aws_cloudwatch_event_bus/, (n) => `aws events create-event-bus --name ${n}`],
  [/aws_secretsmanager_secret/, (n) => `aws secretsmanager create-secret --name ${n}`],
  [/aws_cloudwatch_log_group/, (n) => `aws logs create-log-group --log-group-name ${n}`],
  [/aws_route53_zone/, (n) => `aws route53 create-hosted-zone --name ${n}`],
  [/aws_kinesis_stream/, (n) => `aws kinesis create-stream --stream-name ${n}`],
  [/aws_kms_key/, () => `aws kms create-key`],
  [/aws_instance/, () => `aws ec2 run-instances --instance-type t3.micro`],
  [/google_cloudfunctions_function/, (n) => `gcloud functions deploy ${n}`],
  [/google_cloud_run_service/, (n) => `gcloud run deploy ${n}`],
  [/google_bigquery_dataset/, (n) => `bq mk ${n}`],
  [/google_firestore_database/, () => `gcloud firestore databases create`],
  [/google_pubsub_topic/, (n) => `gcloud pubsub topics create ${n}`],
  [/azurerm_function_app/, (n) => `az functionapp create --name ${n}`],
  [/azurerm_cosmosdb_account/, (n) => `az cosmosdb create --name ${n}`],
  [/azurerm_storage_account/, (n) => `az storage account create --name ${n}`],
];

function terraformTypeToCmd(type, name) {
  for (const [pattern, fn] of tfTypeMap) {
    if (pattern.test(type)) return fn(name);
  }
  return null;
}

// Serverless Framework: functions.processOrder, resources.Resources.UsersTable
function extractServerlessResources(content) {
  const cmds = [];
  // Functions
  const funcMatches = content.matchAll(/^\s{2}(\w+):\s*$/gm);
  let inFunctions = false;
  for (const line of content.split('\n')) {
    if (/^functions:/.test(line)) { inFunctions = true; continue; }
    if (/^\w/.test(line) && !/^functions:/.test(line)) { inFunctions = false; continue; }
    if (inFunctions) {
      const m = line.match(/^\s{2}(\w[\w-]*):/);
      if (m) cmds.push(`aws lambda create-function --function-name ${m[1]}`);
    }
  }
  // CloudFormation resources in serverless.yml
  const cfnCmds = extractCfnResources(content);
  cmds.push(...cfnCmds);
  return cmds;
}

// CloudFormation / SAM template resources
function extractCfnResources(content) {
  const cmds = [];
  const cfnTypeMap = [
    [/AWS::DynamoDB::Table/, 'dynamodb', 'table-name', 'TableName'],
    [/AWS::Lambda::Function/, 'lambda', 'function-name', 'FunctionName'],
    [/AWS::ApiGateway::RestApi|AWS::ApiGatewayV2::Api/, 'apigateway', 'name', 'Name'],
    [/AWS::S3::Bucket/, 's3', null, 'BucketName'],
    [/AWS::SQS::Queue/, 'sqs', 'queue-name', 'QueueName'],
    [/AWS::SNS::Topic/, 'sns', 'name', 'TopicName'],
    [/AWS::Cognito::UserPool/, 'cognito-idp', 'pool-name', 'PoolName'],
    [/AWS::ECS::Cluster/, 'ecs', 'cluster-name', 'ClusterName'],
  ];

  for (const [typePattern, service, flag, propName] of cfnTypeMap) {
    const typeMatches = content.matchAll(new RegExp(`Type:\\s*['"]?(${typePattern.source})['"]?`, 'g'));
    for (const tm of typeMatches) {
      // Try to find the property name nearby
      const idx = tm.index;
      const nearby = content.slice(idx, idx + 500);
      const nameMatch = nearby.match(new RegExp(`${propName}:\\s*['"]?([\\w-]+)`));
      const name = nameMatch?.[1] || service;
      if (service === 's3') {
        cmds.push(`aws s3 mb s3://${name}`);
      } else {
        cmds.push(`aws ${service} create-${flag ? flag.replace('-name', '') : service} --${flag || 'name'} ${name}`);
      }
    }
  }
  return cmds;
}

// Fallback: regex pattern matching for files that aren't structured IaC
const fallbackPatterns = [
  [/dynamodb|dynamo_db/i, 'aws dynamodb create-table --table-name app-table'],
  [/aws_lambda|lambda.*function/i, 'aws lambda create-function --function-name app-function'],
  [/apigateway|api.gateway|rest.api|http.api/i, 'aws apigateway create-rest-api --name app-api'],
  [/s3.*bucket|aws_s3/i, 'aws s3 mb s3://app-bucket'],
  [/sqs|aws_sqs/i, 'aws sqs create-queue --queue-name app-queue'],
  [/sns|aws_sns/i, 'aws sns create-topic --name app-topic'],
  [/cognito|user.pool/i, 'aws cognito-idp create-user-pool --pool-name app-users'],
  [/cloudfront|distribution/i, 'aws cloudfront create-distribution --origin-domain app.s3.amazonaws.com'],
  [/ecs|fargate|task.definition/i, 'aws ecs create-cluster --cluster-name app-cluster'],
  [/ec2|instance/i, 'aws ec2 run-instances --instance-type t3.micro'],
  [/rds|aurora|db.instance/i, 'aws rds create-db-instance --db-instance-identifier app-db'],
  [/elasticache|redis.*aws/i, 'aws elasticache create-cache-cluster --cache-cluster-id app-cache'],
  [/step.?function|state.?machine/i, 'aws stepfunctions create-state-machine --name app-workflow'],
  [/eventbridge|event.?bus/i, 'aws events create-event-bus --name app-events'],
  [/cloud.?function|gcf/i, 'gcloud functions deploy app-function'],
  [/cloud.?run/i, 'gcloud run deploy app-service'],
  [/bigquery/i, 'bq mk app_dataset'],
  [/cosmos.?db/i, 'az cosmosdb create --name app-cosmos'],
];

function scanIaCFiles() {
  const commands = [];
  const seen = new Set();

  const iacFiles = ['.tf', '.yml', '.yaml', '.json'];

  function scanDir(dir, depth = 0) {
    if (depth > 3) return;
    try {
      for (const entry of readdirSync(dir)) {
        if (entry.startsWith('.') || entry === 'node_modules' || entry === '.terraform') continue;
        const full = join(dir, entry);
        const stat = statSync(full);
        if (stat.isDirectory()) {
          scanDir(full, depth + 1);
        } else {
          const ext = entry.slice(entry.lastIndexOf('.'));
          if (!iacFiles.includes(ext)) continue;
          const content = readFileSync(full, 'utf-8');

          // Try structured extraction first
          let extracted = [];
          if (ext === '.tf') {
            extracted = extractTerraformResources(content);
          } else if (entry === 'serverless.yml' || entry === 'serverless.yaml') {
            extracted = extractServerlessResources(content);
          } else if (entry === 'template.yaml' || entry === 'template.yml' || entry === 'template.json') {
            extracted = extractCfnResources(content);
          }

          if (extracted.length) {
            for (const cmd of extracted) {
              if (!seen.has(cmd)) { seen.add(cmd); commands.push(cmd); }
            }
          } else {
            // Fallback to regex patterns
            for (const [pattern, cmd] of fallbackPatterns) {
              if (pattern.test(content) && !seen.has(cmd)) {
                seen.add(cmd);
                commands.push(cmd);
              }
            }
          }
        }
      }
    } catch { /* permission errors */ }
  }

  scanDir(cwd);
  return commands;
}
