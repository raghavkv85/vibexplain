// Extracts Subject-Predicate-Object triplets from parsed command events
// Each triplet: { subject: { id, label, type }, predicate, object: { id, label, type } }

const extractors = [
  // mkdir — command creates directories
  { match: /^mkdir\s+(-p\s+)?(.+)/, extract: (m, cmd, tool) => {
    const dirs = m[2].split(/\s+/).filter(Boolean);
    const triplets = [];
    for (const d of dirs) {
      triplets.push({ subject: { id: tool, label: tool, type: 'tool' }, predicate: 'creates', object: { id: norm(d), label: d, type: 'dir' } });
      // Parent-child relationship for nested dirs
      const parts = d.split('/').filter(Boolean);
      if (parts.length > 1) {
        for (let i = 0; i < parts.length - 1; i++) {
          const parent = parts.slice(0, i + 1).join('/');
          const child = parts.slice(0, i + 2).join('/');
          triplets.push({ subject: { id: norm(parent), label: parent, type: 'dir' }, predicate: 'contains', object: { id: norm(child), label: child, type: 'dir' } });
        }
      }
    }
    return triplets;
  }},

  // touch — creates files
  { match: /^touch\s+(.+)/, extract: (m) => {
    const files = m[1].split(/\s+/).filter(Boolean);
    const triplets = [];
    for (const f of files) {
      triplets.push({ subject: { id: 'agent', label: 'Agent', type: 'agent' }, predicate: 'creates', object: { id: norm(f), label: f, type: 'file' } });
      // File belongs to its directory
      const dir = f.includes('/') ? f.slice(0, f.lastIndexOf('/')) : '.';
      if (dir !== '.') {
        triplets.push({ subject: { id: norm(dir), label: dir, type: 'dir' }, predicate: 'contains', object: { id: norm(f), label: f, type: 'file' } });
      }
    }
    return triplets;
  }},

  // npm init
  { match: /^npm\s+init/, extract: () => [
    { subject: { id: 'npm', label: 'npm', type: 'tool' }, predicate: 'creates', object: { id: 'package.json', label: 'package.json', type: 'config' } },
  ]},

  // npm install <packages>
  { match: /^npm\s+(install|i)\s+/, extract: (m, cmd) => {
    const isDev = /--save-dev|-D/.test(cmd);
    const pkgs = cmd.replace(/^npm\s+(install|i)\s+/, '').split(/\s+/).filter(t => !t.startsWith('-'));
    const triplets = [];
    for (const pkg of pkgs) {
      if (!pkg) continue;
      triplets.push({ subject: { id: 'package.json', label: 'package.json', type: 'config' }, predicate: isDev ? 'dev-depends-on' : 'depends-on', object: { id: norm(pkg), label: pkg, type: 'package' } });
    }
    // Packages may depend on each other (inferred)
    if (pkgs.length > 1) {
      for (let i = 1; i < pkgs.length; i++) {
        triplets.push({ subject: { id: norm(pkgs[0]), label: pkgs[0], type: 'package' }, predicate: 'installed-with', object: { id: norm(pkgs[i]), label: pkgs[i], type: 'package' } });
      }
    }
    return triplets;
  }},

  // npm run <script>
  { match: /^npm\s+(run|test|start|build)\s*(.*)/, extract: (m) => {
    const script = m[2]?.trim() || m[1];
    return [
      { subject: { id: 'package.json', label: 'package.json', type: 'config' }, predicate: 'defines', object: { id: norm('script:' + script), label: script, type: 'script' } },
    ];
  }},

  // yarn/pnpm add
  { match: /^(yarn|pnpm)\s+add\s+/, extract: (m, cmd) => {
    const isDev = /--dev|-D/.test(cmd);
    const pkgs = cmd.replace(/^(yarn|pnpm)\s+add\s+/, '').split(/\s+/).filter(t => !t.startsWith('-'));
    return pkgs.filter(Boolean).map(pkg => ({
      subject: { id: 'package.json', label: 'package.json', type: 'config' },
      predicate: isDev ? 'dev-depends-on' : 'depends-on',
      object: { id: norm(pkg), label: pkg, type: 'package' },
    }));
  }},

  // pip install
  { match: /^pip3?\s+install\s+/, extract: (m, cmd) => {
    const pkgs = cmd.replace(/^pip3?\s+install\s+/, '').split(/\s+/).filter(t => !t.startsWith('-'));
    return pkgs.filter(Boolean).map(pkg => ({
      subject: { id: 'requirements', label: 'requirements', type: 'config' },
      predicate: 'depends-on',
      object: { id: norm(pkg), label: pkg, type: 'package' },
    }));
  }},

  // cargo add
  { match: /^cargo\s+add\s+(\S+)/, extract: (m) => [
    { subject: { id: 'Cargo.toml', label: 'Cargo.toml', type: 'config' }, predicate: 'depends-on', object: { id: norm(m[1]), label: m[1], type: 'package' } },
  ]},

  // git init
  { match: /^git\s+init/, extract: () => [
    { subject: { id: 'agent', label: 'Agent', type: 'agent' }, predicate: 'initializes', object: { id: 'git', label: 'git repo', type: 'vcs' } },
  ]},

  // git add
  { match: /^git\s+add\s+(.+)/, extract: (m) => {
    const files = m[1].split(/\s+/).filter(Boolean);
    return files.map(f => ({
      subject: { id: 'git', label: 'git repo', type: 'vcs' }, predicate: 'stages', object: { id: norm(f), label: f, type: f === '.' ? 'dir' : 'file' },
    }));
  }},

  // git commit
  { match: /^git\s+commit/, extract: (m, cmd) => {
    const msg = cmd.match(/-m\s+["']([^"']+)["']/)?.[1] || cmd.match(/-m\s+(\S+)/)?.[1] || 'commit';
    return [
      { subject: { id: 'git', label: 'git repo', type: 'vcs' }, predicate: 'records', object: { id: norm('commit:' + msg.slice(0, 20)), label: msg, type: 'commit' } },
    ];
  }},

  // git push
  { match: /^git\s+push\s*(.*)/, extract: (m) => {
    const remote = m[1].split(/\s+/).find(t => !t.startsWith('-')) || 'origin';
    return [
      { subject: { id: 'git', label: 'git repo', type: 'vcs' }, predicate: 'pushes-to', object: { id: norm(remote), label: remote, type: 'remote' } },
    ];
  }},

  // git clone
  { match: /^git\s+clone\s+(\S+)/, extract: (m) => {
    const repo = m[1].split('/').pop()?.replace('.git', '') || m[1];
    return [
      { subject: { id: 'agent', label: 'Agent', type: 'agent' }, predicate: 'clones', object: { id: norm(repo), label: repo, type: 'repo' } },
    ];
  }},

  // docker build
  { match: /^docker\s+build\s+(.+)/, extract: (m, cmd) => {
    const tag = cmd.match(/-t\s+(\S+)/)?.[1] || 'image';
    const file = cmd.match(/-f\s+(\S+)/)?.[1] || 'Dockerfile';
    return [
      { subject: { id: norm(file), label: file, type: 'config' }, predicate: 'builds', object: { id: norm(tag), label: tag, type: 'image' } },
    ];
  }},

  // docker run
  { match: /^docker\s+run\s+(.+)/, extract: (m, cmd) => {
    const image = cmd.split(/\s+/).filter(t => !t.startsWith('-')).pop() || 'image';
    const port = cmd.match(/-p\s+(\d+):(\d+)/);
    const triplets = [
      { subject: { id: norm(image), label: image, type: 'image' }, predicate: 'runs-as', object: { id: norm('container:' + image), label: image + ' container', type: 'container' } },
    ];
    if (port) {
      triplets.push({ subject: { id: norm('container:' + image), label: image + ' container', type: 'container' }, predicate: 'exposes', object: { id: norm('port:' + port[1]), label: ':' + port[1], type: 'endpoint' } });
    }
    return triplets;
  }},

  // docker compose
  { match: /^docker\s+compose\s+/, extract: () => [
    { subject: { id: 'docker-compose.yml', label: 'docker-compose.yml', type: 'config' }, predicate: 'orchestrates', object: { id: 'containers', label: 'containers', type: 'container' } },
  ]},

  // terraform init/plan/apply/destroy
  { match: /^terraform\s+(init|plan|apply|destroy)/, extract: (m) => {
    const actions = { init: 'initializes', plan: 'plans', apply: 'provisions', destroy: 'destroys' };
    return [
      { subject: { id: 'terraform', label: 'Terraform', type: 'tool' }, predicate: actions[m[1]], object: { id: 'infra', label: 'infrastructure', type: 'infra' } },
    ];
  }},

  // AWS CLI
  { match: /^aws\s+(\S+)\s+(\S+)(.*)/, extract: (m) => {
    const service = m[1];
    const action = m[2];
    const rest = m[3] || '';
    const name = rest.match(/--(?:table-name|function-name|bucket|queue-name|topic-name|pool-name|name|rest-api-name|origin-domain)\s+(\S+)/)?.[1]
      || rest.match(/s3:\/\/(\S+)/)?.[1]
      || service;
    const serviceMap = {
      s3: 'S3', dynamodb: 'DynamoDB', lambda: 'Lambda', apigateway: 'API Gateway',
      sqs: 'SQS', sns: 'SNS', 'cognito-idp': 'Cognito', cloudfront: 'CloudFront',
      ec2: 'EC2', ecs: 'ECS', rds: 'RDS', iam: 'IAM', route53: 'Route 53',
      secretsmanager: 'Secrets Manager', cloudwatch: 'CloudWatch',
    };
    const label = serviceMap[service] || service;
    const triplets = [
      { subject: { id: 'agent', label: 'Agent', type: 'agent' }, predicate: action.startsWith('create') || action === 'mb' ? 'creates' : action.startsWith('delete') ? 'deletes' : 'configures', object: { id: norm(service + ':' + name), label: name, type: 'service' } },
      { subject: { id: norm(service + ':' + name), label: name, type: 'service' }, predicate: 'hosted-on', object: { id: norm('aws:' + service), label: label, type: 'cloud' } },
    ];
    return triplets;
  }},

  // GCP gcloud
  { match: /^gcloud\s+(\S+)\s+(\S+)(.*)/, extract: (m) => {
    const service = m[1];
    const action = m[2];
    return [
      { subject: { id: 'agent', label: 'Agent', type: 'agent' }, predicate: action === 'create' ? 'creates' : 'configures', object: { id: norm('gcp:' + service), label: service, type: 'service' } },
      { subject: { id: norm('gcp:' + service), label: service, type: 'service' }, predicate: 'hosted-on', object: { id: 'gcp', label: 'Google Cloud', type: 'cloud' } },
    ];
  }},

  // Azure az
  { match: /^az\s+(\S+)\s+(\S+)(.*)/, extract: (m) => {
    const service = m[1];
    const action = m[2];
    return [
      { subject: { id: 'agent', label: 'Agent', type: 'agent' }, predicate: action === 'create' ? 'creates' : 'configures', object: { id: norm('az:' + service), label: service, type: 'service' } },
      { subject: { id: norm('az:' + service), label: service, type: 'service' }, predicate: 'hosted-on', object: { id: 'azure', label: 'Azure', type: 'cloud' } },
    ];
  }},

  // Platform deploys (vercel, netlify, firebase, fly, railway, heroku)
  { match: /^(vercel|netlify|firebase|fly|flyctl|railway|heroku)\s+(deploy|launch|init|push)/, extract: (m) => [
    { subject: { id: 'agent', label: 'Agent', type: 'agent' }, predicate: 'deploys-to', object: { id: norm(m[1]), label: m[1], type: 'platform' } },
  ]},

  // node/python/ruby — runs a file
  { match: /^(node|python|python3|ruby)\s+(\S+)/, extract: (m) => [
    { subject: { id: norm(m[1]), label: m[1], type: 'runtime' }, predicate: 'executes', object: { id: norm(m[2]), label: m[2], type: 'file' } },
  ]},

  // curl/wget — HTTP request
  { match: /^(curl|wget)\s+.*?(https?:\/\/[^\s"']+)/, extract: (m) => {
    let host;
    try { host = new URL(m[2]).hostname; } catch { host = m[2]; }
    return [
      { subject: { id: 'agent', label: 'Agent', type: 'agent' }, predicate: 'requests', object: { id: norm(host), label: host, type: 'endpoint' } },
    ];
  }},

  // kubectl apply/get/delete
  { match: /^kubectl\s+(apply|get|delete|create)\s+(.+)/, extract: (m, cmd) => {
    const file = cmd.match(/-f\s+(\S+)/)?.[1];
    const resource = m[2].split(/\s+/).find(t => !t.startsWith('-')) || 'resource';
    const triplets = [
      { subject: { id: 'kubectl', label: 'kubectl', type: 'tool' }, predicate: m[1] === 'apply' ? 'deploys' : m[1] + 's', object: { id: norm('k8s:' + resource), label: resource, type: 'k8s' } },
    ];
    if (file) {
      triplets.push({ subject: { id: norm(file), label: file, type: 'config' }, predicate: 'defines', object: { id: norm('k8s:' + resource), label: resource, type: 'k8s' } });
    }
    return triplets;
  }},

  // cp/mv — file operations
  { match: /^(cp|mv)\s+.*?(\S+)\s+(\S+)\s*$/, extract: (m) => [
    { subject: { id: norm(m[2]), label: m[2], type: 'file' }, predicate: m[1] === 'cp' ? 'copied-to' : 'moved-to', object: { id: norm(m[3]), label: m[3], type: 'file' } },
  ]},

  // chmod — permissions
  { match: /^chmod\s+\S+\s+(.+)/, extract: (m) => {
    const files = m[1].split(/\s+/).filter(Boolean);
    return files.map(f => ({
      subject: { id: 'agent', label: 'Agent', type: 'agent' }, predicate: 'configures', object: { id: norm(f), label: f, type: 'file' },
    }));
  }},

  // ssh
  { match: /^ssh\s+(\S+)/, extract: (m) => [
    { subject: { id: 'agent', label: 'Agent', type: 'agent' }, predicate: 'connects-to', object: { id: norm(m[1]), label: m[1], type: 'server' } },
  ]},

  // make
  { match: /^make\s*(\S*)/, extract: (m) => {
    const target = m[1] || 'default';
    return [
      { subject: { id: 'Makefile', label: 'Makefile', type: 'config' }, predicate: 'runs', object: { id: norm('make:' + target), label: target, type: 'script' } },
    ];
  }},
];

function norm(s) {
  return s.toLowerCase().replace(/[^a-z0-9._:/-]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
}

export function extractTriplets(rawCommand) {
  const cmd = rawCommand.trim();
  if (!cmd) return [];

  // Handle pipes/chains — extract from each part
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
