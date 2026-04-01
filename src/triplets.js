// Extracts Subject-Predicate-Object triplets from parsed command events
// Focused on high-signal entities: services, packages, containers, infrastructure
// Low-value nodes (individual files, dirs, commits) are collapsed or omitted

const extractors = [
  // npm/yarn/pnpm install — project depends on packages
  { match: /^(npm|yarn|pnpm)\s+(install|i|add)\s+/, extract: (m, cmd) => {
    const isDev = /--save-dev|-D/.test(cmd);
    const pkgs = cmd.replace(/^(npm|yarn|pnpm)\s+(install|i|add)\s+/, '').split(/\s+/).filter(t => t && !t.startsWith('-'));
    return pkgs.map(pkg => ({
      subject: { id: 'project', label: 'Project', type: 'config' },
      predicate: isDev ? 'dev-depends-on' : 'depends-on',
      object: { id: norm(pkg), label: pkg, type: 'package' },
    }));
  }},

  // pip install
  { match: /^pip3?\s+install\s+/, extract: (m, cmd) => {
    const pkgs = cmd.replace(/^pip3?\s+install\s+/, '').split(/\s+/).filter(t => t && !t.startsWith('-'));
    return pkgs.map(pkg => ({
      subject: { id: 'project', label: 'Project', type: 'config' },
      predicate: 'depends-on',
      object: { id: norm(pkg), label: pkg, type: 'package' },
    }));
  }},

  // cargo add
  { match: /^cargo\s+add\s+(\S+)/, extract: (m) => [
    { subject: { id: 'project', label: 'Project', type: 'config' }, predicate: 'depends-on', object: { id: norm(m[1]), label: m[1], type: 'package' } },
  ]},

  // docker build
  { match: /^docker\s+build\s+(.+)/, extract: (m, cmd) => {
    const tag = cmd.match(/-t\s+(\S+)/)?.[1] || 'app';
    return [
      { subject: { id: 'project', label: 'Project', type: 'config' }, predicate: 'containerized-as', object: { id: norm(tag), label: tag, type: 'image' } },
    ];
  }},

  // docker run
  { match: /^docker\s+run\s+(.+)/, extract: (m, cmd) => {
    const image = cmd.split(/\s+/).filter(t => !t.startsWith('-')).pop() || 'app';
    const port = cmd.match(/-p\s+(\d+):\d+/);
    const triplets = [
      { subject: { id: norm(image), label: image, type: 'image' }, predicate: 'runs-as', object: { id: norm('container:' + image), label: image, type: 'container' } },
    ];
    if (port) {
      triplets.push({ subject: { id: norm('container:' + image), label: image, type: 'container' }, predicate: 'exposes', object: { id: norm('port:' + port[1]), label: ':' + port[1], type: 'endpoint' } });
    }
    return triplets;
  }},

  // docker compose
  { match: /^docker\s+compose\s+/, extract: () => [
    { subject: { id: 'project', label: 'Project', type: 'config' }, predicate: 'orchestrates', object: { id: 'compose', label: 'Docker Compose', type: 'container' } },
  ]},

  // terraform
  { match: /^terraform\s+(init|plan|apply|destroy)/, extract: (m) => [
    { subject: { id: 'terraform', label: 'Terraform', type: 'infra' }, predicate: m[1] === 'apply' ? 'provisions' : m[1] + 's', object: { id: 'infra', label: 'Infrastructure', type: 'infra' } },
  ]},

  // AWS CLI — only service-level relationships
  { match: /^aws\s+(\S+)\s+(\S+)(.*)/, extract: (m) => {
    const service = m[1];
    const action = m[2];
    const rest = m[3] || '';
    const name = rest.match(/--(?:table-name|function-name|queue-name|topic-name|pool-name|name|cluster-name|cache-cluster-id|db-instance-identifier|stream-name)\s+(\S+)/)?.[1];
    const serviceMap = {
      s3: 'S3', dynamodb: 'DynamoDB', lambda: 'Lambda', apigateway: 'API Gateway',
      sqs: 'SQS', sns: 'SNS', 'cognito-idp': 'Cognito', cloudfront: 'CloudFront',
      ec2: 'EC2', ecs: 'ECS', ecr: 'ECR', rds: 'RDS', iam: 'IAM', route53: 'Route 53',
      secretsmanager: 'Secrets Manager', logs: 'CloudWatch', kms: 'KMS',
      stepfunctions: 'Step Functions', events: 'EventBridge', kinesis: 'Kinesis',
      elasticache: 'ElastiCache', wafv2: 'WAF', ssm: 'SSM', cloudformation: 'CloudFormation',
    };
    const label = serviceMap[service] || service;
    const verb = action.startsWith('create') || action === 'mb' ? 'creates' : action.startsWith('delete') ? 'deletes' : 'configures';
    const triplets = [
      { subject: { id: 'project', label: 'Project', type: 'config' }, predicate: 'uses', object: { id: norm('aws:' + service), label: label, type: 'cloud' } },
    ];
    if (name) {
      triplets.push({ subject: { id: norm('aws:' + service), label: label, type: 'cloud' }, predicate: verb, object: { id: norm(name), label: name, type: 'service' } });
    }
    // Infer connections between AWS services
    const connections = {
      apigateway: ['lambda'], lambda: ['dynamodb', 'sqs', 's3'], sqs: ['lambda'],
      sns: ['lambda', 'sqs'], cloudfront: ['s3'], events: ['lambda', 'sqs'],
      stepfunctions: ['lambda'], 'cognito-idp': ['apigateway'],
    };
    for (const target of (connections[service] || [])) {
      if (serviceMap[target]) {
        triplets.push({ subject: { id: norm('aws:' + service), label: label, type: 'cloud' }, predicate: 'connects-to', object: { id: norm('aws:' + target), label: serviceMap[target], type: 'cloud' }, inferred: true });
      }
    }
    return triplets;
  }},

  // GCP gcloud
  { match: /^gcloud\s+(\S+)\s+(\S+)(.*)/, extract: (m) => {
    const service = m[1];
    return [
      { subject: { id: 'project', label: 'Project', type: 'config' }, predicate: 'uses', object: { id: norm('gcp:' + service), label: service, type: 'cloud' } },
    ];
  }},

  // Azure az
  { match: /^az\s+(\S+)\s+(\S+)(.*)/, extract: (m) => {
    const service = m[1];
    return [
      { subject: { id: 'project', label: 'Project', type: 'config' }, predicate: 'uses', object: { id: norm('az:' + service), label: service, type: 'cloud' } },
    ];
  }},

  // Platform deploys
  { match: /^(vercel|netlify|firebase|fly|flyctl|railway|heroku|supabase)\s+(deploy|launch|init|push)/, extract: (m) => [
    { subject: { id: 'project', label: 'Project', type: 'config' }, predicate: 'deploys-to', object: { id: norm(m[1]), label: m[1], type: 'platform' } },
  ]},

  // kubectl
  { match: /^kubectl\s+(apply|create)\s+(.+)/, extract: (m, cmd) => {
    const file = cmd.match(/-f\s+(\S+)/)?.[1];
    return [
      { subject: { id: 'project', label: 'Project', type: 'config' }, predicate: 'deploys-to', object: { id: 'kubernetes', label: 'Kubernetes', type: 'infra' } },
      ...(file ? [{ subject: { id: 'kubernetes', label: 'Kubernetes', type: 'infra' }, predicate: 'uses', object: { id: norm(file), label: file, type: 'config' } }] : []),
    ];
  }},

  // curl/wget — external API
  { match: /^(curl|wget)\s+.*?(https?:\/\/[^\s"']+)/, extract: (m) => {
    let host;
    try { host = new URL(m[2]).hostname; } catch { host = m[2]; }
    return [
      { subject: { id: 'project', label: 'Project', type: 'config' }, predicate: 'calls', object: { id: norm(host), label: host, type: 'endpoint' } },
    ];
  }},

  // ssh
  { match: /^ssh\s+(\S+)/, extract: (m) => [
    { subject: { id: 'project', label: 'Project', type: 'config' }, predicate: 'connects-to', object: { id: norm(m[1]), label: m[1], type: 'server' } },
  ]},
];

function norm(s) {
  return s.toLowerCase().replace(/[^a-z0-9._:/-]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
}

export function extractTriplets(rawCommand) {
  const cmd = rawCommand.trim();
  if (!cmd) return [];

  if (/&&|\|\||[|;]/.test(cmd)) {
    const parts = cmd.split(/\s*(?:&&|\|\||[|;])\s*/).filter(Boolean);
    if (parts.length > 1) return parts.flatMap(p => extractTriplets(p));
  }

  for (const ex of extractors) {
    const m = cmd.match(ex.match);
    if (m) return ex.extract(m, cmd, cmd.split(/\s+/)[0]);
  }
  return [];
}
