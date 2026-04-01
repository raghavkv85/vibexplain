// Command knowledge base — maps CLI tools to explanations of their subcommands/flags
const knowledge = {
  git: {
    _desc: 'Version control system — tracks changes to your code',
    init: 'Creates a new git repository in the current folder',
    clone: 'Downloads a copy of a remote repository to your machine',
    add: 'Stages files so they\'re included in the next commit',
    commit: 'Saves a snapshot of your staged changes with a message',
    push: 'Uploads your local commits to a remote repository',
    pull: 'Downloads and merges changes from a remote repository',
    checkout: 'Switches to a different branch or restores files',
    switch: 'Switches to a different branch',
    branch: 'Lists, creates, or deletes branches',
    merge: 'Combines changes from one branch into another',
    stash: 'Temporarily shelves uncommitted changes',
    log: 'Shows the commit history',
    diff: 'Shows what changed between commits or in your working files',
    reset: 'Unstages files or moves the branch pointer back to a previous commit',
    rebase: 'Replays your commits on top of another branch\'s history',
    remote: 'Manages connections to remote repositories',
    fetch: 'Downloads changes from remote without merging them',
    status: 'Shows which files are modified, staged, or untracked',
    tag: 'Creates a named reference to a specific commit (like a version label)',
  },
  npm: {
    _desc: 'Node.js package manager — installs and manages JavaScript dependencies',
    install: 'Downloads and installs packages listed in package.json (or a specific package)',
    init: 'Creates a new package.json file for your project',
    run: 'Executes a script defined in package.json',
    test: 'Runs the test script from package.json',
    start: 'Runs the start script from package.json',
    build: 'Runs the build script from package.json',
    publish: 'Uploads your package to the npm registry',
    uninstall: 'Removes a package from your project',
    update: 'Updates packages to their latest allowed versions',
    ls: 'Lists installed packages',
    audit: 'Checks for known security vulnerabilities in dependencies',
    ci: 'Clean install — deletes node_modules and installs from lockfile exactly',
  },
  npx: {
    _desc: 'Runs a package binary without installing it globally',
  },
  docker: {
    _desc: 'Container platform — packages apps with their dependencies into isolated environments',
    build: 'Creates a container image from a Dockerfile',
    run: 'Starts a new container from an image',
    ps: 'Lists running containers',
    stop: 'Stops a running container',
    pull: 'Downloads a container image from a registry',
    push: 'Uploads a container image to a registry',
    compose: 'Manages multi-container applications defined in docker-compose.yml',
    exec: 'Runs a command inside a running container',
    logs: 'Shows output from a container',
    images: 'Lists downloaded container images',
  },
  pip: {
    _desc: 'Python package manager — installs Python libraries',
    install: 'Downloads and installs a Python package',
    uninstall: 'Removes a Python package',
    freeze: 'Lists all installed packages and their versions',
    list: 'Lists installed packages',
  },
  python: {
    _desc: 'Runs Python code',
    '-m': 'Runs a Python module as a script',
  },
  node: {
    _desc: 'Runs JavaScript code outside the browser',
  },
  curl: {
    _desc: 'Makes HTTP requests from the command line — downloads files or talks to APIs',
  },
  mkdir: {
    _desc: 'Creates a new directory (folder)',
    '-p': 'Creates parent directories too if they don\'t exist',
  },
  cd: {
    _desc: 'Changes the current working directory',
  },
  ls: {
    _desc: 'Lists files and folders in a directory',
    '-la': 'Shows all files (including hidden) with details',
  },
  cat: {
    _desc: 'Displays the contents of a file',
  },
  rm: {
    _desc: 'Deletes files or directories',
    '-rf': 'Force-deletes recursively — be careful, no undo!',
  },
  cp: {
    _desc: 'Copies files or directories',
  },
  mv: {
    _desc: 'Moves or renames files',
  },
  chmod: {
    _desc: 'Changes file permissions (who can read, write, or execute)',
  },
  brew: {
    _desc: 'macOS package manager — installs command-line tools and apps',
    install: 'Installs a package',
    uninstall: 'Removes a package',
    update: 'Updates Homebrew itself and its package list',
    upgrade: 'Upgrades installed packages to latest versions',
  },
  cargo: {
    _desc: 'Rust package manager and build tool',
    build: 'Compiles your Rust project',
    run: 'Compiles and runs your Rust project',
    test: 'Runs your project\'s tests',
    init: 'Creates a new Rust project in the current directory',
    new: 'Creates a new Rust project in a new directory',
    add: 'Adds a dependency to Cargo.toml',
  },
  aws: {
    _desc: 'AWS command-line interface — manages Amazon Web Services resources',
    dynamodb: 'Manages DynamoDB NoSQL database tables and items',
    s3: 'Manages S3 object storage buckets and files',
    's3api': 'Low-level S3 API operations',
    lambda: 'Manages Lambda serverless functions',
    apigateway: 'Manages API Gateway REST and HTTP APIs',
    sqs: 'Manages SQS message queues for async processing',
    sns: 'Manages SNS notification topics and subscriptions',
    'cognito-idp': 'Manages Cognito user pools for authentication',
    cloudfront: 'Manages CloudFront CDN distributions',
    ec2: 'Manages EC2 virtual machine instances',
    ecs: 'Manages ECS container orchestration clusters and services',
    ecr: 'Manages ECR container image registry',
    rds: 'Manages RDS relational database instances',
    iam: 'Manages IAM users, roles, and permissions',
    cloudformation: 'Manages CloudFormation infrastructure stacks',
    stepfunctions: 'Manages Step Functions state machine workflows',
    events: 'Manages EventBridge rules and event buses for scheduling and routing',
    secretsmanager: 'Manages Secrets Manager for storing sensitive configuration',
    logs: 'Manages CloudWatch log groups and streams',
    route53: 'Manages Route 53 DNS hosted zones and records',
    kms: 'Manages KMS encryption keys',
    kinesis: 'Manages Kinesis data streams for real-time processing',
    elasticache: 'Manages ElastiCache Redis/Memcached clusters',
    wafv2: 'Manages WAF web application firewall rules',
    ssm: 'Manages Systems Manager parameters and commands',
    'create-table': 'Creates a new database table',
    'create-function': 'Creates a new serverless function',
    'create-rest-api': 'Creates a new REST API',
    'create-queue': 'Creates a new message queue',
    'create-topic': 'Creates a new notification topic',
    'create-user-pool': 'Creates a new user authentication pool',
    'create-distribution': 'Creates a new CDN distribution',
    'create-cluster': 'Creates a new cluster',
    'create-cache-cluster': 'Creates a new cache cluster',
    'create-db-instance': 'Creates a new database instance',
    'create-state-machine': 'Creates a new state machine workflow',
    'create-event-bus': 'Creates a new event bus',
    'create-secret': 'Stores a new secret',
    'create-log-group': 'Creates a new log group',
    'create-hosted-zone': 'Creates a new DNS hosted zone',
    'create-key': 'Creates a new encryption key',
    'create-stream': 'Creates a new data stream',
    'create-web-acl': 'Creates a new web application firewall ACL',
    'put-rule': 'Creates or updates an event rule for scheduling or routing',
    'run-instances': 'Launches new EC2 instances',
    'mb': 'Creates a new S3 bucket',
    'deploy': 'Deploys a function or service',
    '--table-name': 'specifies the table name',
    '--function-name': 'specifies the function name',
    '--queue-name': 'specifies the queue name',
    '--name': 'specifies the resource name',
    '--pool-name': 'specifies the user pool name',
    '--cluster-name': 'specifies the cluster name',
    '--cache-cluster-id': 'specifies the cache cluster ID',
    '--origin-domain': 'specifies the origin domain for CDN',
    '--db-instance-identifier': 'specifies the database instance ID',
    '--instance-type': 'specifies the EC2 instance size',
  },
  wget: {
    _desc: 'Downloads files from the web',
    '-O': 'saves to a specific filename',
  },
  tar: {
    _desc: 'Archives and compresses files into a single bundle',
    '-x': 'extract files from an archive',
    '-c': 'create a new archive',
    '-z': 'use gzip compression',
    '-f': 'specify the archive filename',
  },
  sed: {
    _desc: 'Stream editor — finds and replaces text in files',
    '-i': 'edit files in place (modifies the original)',
  },
  awk: {
    _desc: 'Text processing tool — extracts and transforms columns of data',
  },
  grep: {
    _desc: 'Searches for text patterns in files',
    '-r': 'search recursively through directories',
    '-i': 'case-insensitive search',
    '-n': 'show line numbers',
  },
  find: {
    _desc: 'Searches for files and directories by name, type, or other criteria',
  },
  ssh: {
    _desc: 'Securely connects to a remote machine over the network',
  },
  scp: {
    _desc: 'Copies files between machines over an encrypted connection',
  },
  make: {
    _desc: 'Build automation tool — runs tasks defined in a Makefile',
  },
  cmake: {
    _desc: 'Build system generator — creates platform-specific build files from CMakeLists.txt',
  },
  go: {
    _desc: 'Go language toolchain — builds, tests, and manages Go projects',
    build: 'Compiles Go packages and dependencies',
    run: 'Compiles and runs a Go program',
    test: 'Runs tests in the current package',
    mod: 'Manages Go module dependencies',
    get: 'Downloads and installs packages and dependencies',
    fmt: 'Formats Go source code',
  },
  yarn: {
    _desc: 'JavaScript package manager — alternative to npm with faster installs',
    add: 'Installs a package and adds it to dependencies',
    remove: 'Removes a package',
    install: 'Installs all dependencies from yarn.lock',
    dev: 'Runs the dev script',
    build: 'Runs the build script',
  },
  pnpm: {
    _desc: 'Fast, disk-efficient JavaScript package manager',
    add: 'Installs a package',
    install: 'Installs all dependencies',
    run: 'Runs a script from package.json',
  },
  ruby: {
    _desc: 'Runs Ruby code',
  },
  gem: {
    _desc: 'Ruby package manager — installs Ruby libraries (gems)',
    install: 'Downloads and installs a gem',
  },
  bundler: {
    _desc: 'Ruby dependency manager — installs gems listed in a Gemfile',
    install: 'Installs all gems from the Gemfile',
  },
  head: {
    _desc: 'Shows the first lines of a file',
  },
  tail: {
    _desc: 'Shows the last lines of a file',
    '-f': 'follow — keep watching for new lines (live log tailing)',
  },
  wc: {
    _desc: 'Counts lines, words, and characters in a file',
    '-l': 'count only lines',
  },
  sort: {
    _desc: 'Sorts lines of text',
  },
  uniq: {
    _desc: 'Removes duplicate adjacent lines',
  },
  ln: {
    _desc: 'Creates links between files',
    '-s': 'create a symbolic (soft) link',
  },
  terraform: {
    _desc: 'Infrastructure-as-code tool — defines cloud resources in config files',
    init: 'Initializes a Terraform working directory and downloads providers',
    plan: 'Shows what changes Terraform would make without applying them',
    apply: 'Creates or updates infrastructure to match your config',
    destroy: 'Tears down all infrastructure managed by this config',
  },
  kubectl: {
    _desc: 'Kubernetes CLI — manages containers running in a cluster',
    apply: 'Creates or updates resources from a config file',
    get: 'Lists resources (pods, services, etc.)',
    delete: 'Removes resources',
    logs: 'Shows logs from a container in a pod',
    exec: 'Runs a command inside a running pod',
  },
  // GCP
  gcloud: {
    _desc: 'Google Cloud CLI — manages GCP resources',
    functions: 'Manages Cloud Functions (serverless compute)',
    run: 'Manages Cloud Run services (containerized apps)',
    storage: 'Manages Cloud Storage buckets and objects',
    pubsub: 'Manages Pub/Sub topics and subscriptions',
    sql: 'Manages Cloud SQL database instances',
    container: 'Manages GKE Kubernetes clusters',
    firestore: 'Manages Firestore document databases',
    bigquery: 'Manages BigQuery datasets and queries',
  },
  gsutil: { _desc: 'Google Cloud Storage CLI — copies, syncs, and manages objects in GCS buckets' },
  bq: { _desc: 'BigQuery CLI — runs queries and manages datasets in Google BigQuery' },
  // Azure
  az: {
    _desc: 'Azure CLI — manages Microsoft Azure resources',
    functionapp: 'Manages Azure Functions (serverless compute)',
    webapp: 'Manages Azure App Service web apps',
    cosmosdb: 'Manages Cosmos DB (globally distributed database)',
    storage: 'Manages Azure Storage accounts, blobs, and queues',
    servicebus: 'Manages Azure Service Bus messaging',
    aks: 'Manages Azure Kubernetes Service clusters',
    sql: 'Manages Azure SQL databases',
  },
  // Platforms
  vercel: { _desc: 'Vercel CLI — deploys frontend apps and serverless functions', deploy: 'Deploys the project to Vercel' },
  netlify: { _desc: 'Netlify CLI — deploys sites and manages serverless functions', deploy: 'Deploys the site to Netlify' },
  firebase: { _desc: 'Firebase CLI — manages Firebase projects (auth, hosting, Firestore)', deploy: 'Deploys to Firebase Hosting and Cloud Functions', init: 'Initializes Firebase in the current project' },
  supabase: { _desc: 'Supabase CLI — manages Supabase projects (Postgres, auth, storage)', init: 'Initializes a Supabase project', start: 'Starts local Supabase services' },
  fly: { _desc: 'Fly.io CLI — deploys apps to edge servers worldwide', deploy: 'Deploys the app to Fly.io', launch: 'Creates and configures a new Fly app' },
  flyctl: { _desc: 'Fly.io CLI — deploys apps to edge servers worldwide' },
  railway: { _desc: 'Railway CLI — deploys apps with managed infrastructure', up: 'Deploys the project to Railway' },
  heroku: { _desc: 'Heroku CLI — manages Heroku apps and add-ons', create: 'Creates a new Heroku app' },
  // IaC
  pulumi: { _desc: 'Pulumi — infrastructure as code using real programming languages', up: 'Creates or updates infrastructure', preview: 'Shows what changes would be made', destroy: 'Tears down all managed infrastructure' },
  serverless: { _desc: 'Serverless Framework — deploys serverless apps to any cloud', deploy: 'Deploys the service to the cloud provider' },
  sls: { _desc: 'Serverless Framework (shorthand) — deploys serverless apps', deploy: 'Deploys the service' },
  wrangler: { _desc: 'Cloudflare Workers CLI — deploys edge functions and sites', deploy: 'Deploys to Cloudflare Workers', dev: 'Starts a local development server' },
  // Data tools
  snowsql: { _desc: 'Snowflake CLI — runs SQL queries against Snowflake data warehouse' },
  databricks: { _desc: 'Databricks CLI — manages Databricks workspaces, jobs, and clusters' },
  dbt: { _desc: 'dbt — transforms data in your warehouse using SQL models', run: 'Runs all dbt models', test: 'Runs data tests', build: 'Runs and tests all models' },
  airflow: { _desc: 'Apache Airflow — orchestrates data pipelines and workflows' },
  psql: { _desc: 'PostgreSQL interactive terminal — runs SQL queries against a Postgres database' },
  mongosh: { _desc: 'MongoDB Shell — interactive interface to query and manage MongoDB' },
  mysql: { _desc: 'MySQL CLI — runs SQL queries against a MySQL database' },
};

// Flags that are common across many tools
const commonFlags = {
  '-v': 'verbose — show more detailed output',
  '--verbose': 'show more detailed output',
  '-q': 'quiet — suppress output',
  '--quiet': 'suppress output',
  '-f': 'force — skip confirmations',
  '--force': 'skip confirmations',
  '-h': 'show help',
  '--help': 'show help',
  '--version': 'show version number',
  '-y': 'auto-confirm — say yes to all prompts',
  '--yes': 'auto-confirm — say yes to all prompts',
  '-D': 'save as dev dependency (npm)',
  '--save-dev': 'save as dev dependency — only needed during development',
  '-g': 'install globally (available system-wide)',
  '--global': 'install globally (available system-wide)',
  '-r': 'recursive — apply to all subdirectories',
  '-p': 'create parent directories if needed',
};

export function explain(rawCommand) {
  const cmd = rawCommand.trim();
  if (!cmd) return null;

  // Handle pipes/chains/semicolons — explain each part
  if (/&&|\|\||[|;]/.test(cmd)) {
    const parts = cmd.split(/\s*(?:&&|\|\||[|;])\s*/).filter(Boolean);
    if (parts.length > 1) return parts.map(part => explain(part)).filter(Boolean);
  }

  // Strip leading $(...) wrapper
  const subshellMatch = cmd.match(/^\$\((.+)\)$/);
  if (subshellMatch) return explain(subshellMatch[1]);

  const tokens = tokenize(cmd);
  if (!tokens.length) return null;

  const base = tokens[0];
  const info = knowledge[base];
  const result = { command: cmd, tool: base };

  if (!info) {
    result.toolDesc = `Runs the "${base}" command`;
    result.summary = `Executes: ${cmd}`;
    return result;
  }

  result.toolDesc = info._desc;

  // Find subcommand
  const sub = tokens.find((t, i) => i > 0 && !t.startsWith('-') && info[t]);
  if (sub) {
    result.subcommand = sub;
    result.action = info[sub];
  }

  // Explain notable flags
  const flags = tokens.filter(t => t.startsWith('-'));
  const flagExplanations = flags.map(f => {
    const toolFlag = info[f];
    const common = commonFlags[f];
    return toolFlag || common ? { flag: f, meaning: toolFlag || common } : null;
  }).filter(Boolean);

  if (flagExplanations.length) result.flags = flagExplanations;

  // Build human summary — contextual, project-relevant
  result.summary = buildSummary(base, sub, tokens, info, flagExplanations);

  return result;
}

function buildSummary(base, sub, tokens, info, flagExps) {
  // Extract named values: --flag value pairs
  const named = {};
  for (let i = 0; i < tokens.length; i++) {
    if (tokens[i].startsWith('--') && i + 1 < tokens.length && !tokens[i + 1].startsWith('-')) {
      named[tokens[i]] = tokens[i + 1];
    }
  }
  // Extract positional args (non-flag, non-tool, non-subcommand tokens)
  const positional = tokens.filter((t, i) => i > 0 && !t.startsWith('-') && t !== sub && !Object.values(named).includes(t));

  const name = named['--name'] || named['--table-name'] || named['--function-name'] ||
    named['--queue-name'] || named['--pool-name'] || named['--cluster-name'] ||
    named['--cache-cluster-id'] || named['--db-instance-identifier'] ||
    named['--stream-name'] || named['--topic-name'] || named['--log-group-name'] || '';

  // Context-aware summaries for common patterns
  if (base === 'aws' || base === 'gcloud' || base === 'az') return cloudSummary(base, sub, tokens, named, name);
  if (base === 'npm' || base === 'yarn' || base === 'pnpm') return pkgSummary(base, sub, tokens, positional);
  if (base === 'git') return gitSummary(sub, tokens, named, positional);
  if (base === 'docker') return dockerSummary(sub, tokens, named, positional);
  if (base === 'terraform') return tfSummary(sub);
  if (base === 'kubectl') return k8sSummary(sub, tokens, positional);
  if (base === 'mkdir') return `Creates project directories: ${positional.join(', ')}`;

  // Fallback
  const parts = [info._desc];
  if (sub && info[sub]) parts.push(`→ ${info[sub]}`);
  if (name) parts.push(`'${name}'`);
  return parts.join(' ');
}

function cloudSummary(base, sub, tokens, named, name) {
  const provider = base === 'aws' ? 'AWS' : base === 'gcloud' ? 'GCP' : 'Azure';
  const action = tokens.find((t, i) => i > 1 && !t.startsWith('-') && /^(create|delete|update|put|get|describe|list|deploy|run|mb|rm)/.test(t));

  const serviceLabels = {
    dynamodb: 'DynamoDB table', s3: 'S3 bucket', lambda: 'Lambda function',
    apigateway: 'API Gateway', sqs: 'SQS queue', sns: 'SNS topic',
    'cognito-idp': 'Cognito user pool', cloudfront: 'CloudFront distribution',
    ec2: 'EC2 instance', ecs: 'ECS cluster', ecr: 'container registry',
    rds: 'RDS database', iam: 'IAM resource', stepfunctions: 'Step Functions workflow',
    events: 'EventBridge rule', secretsmanager: 'secret', logs: 'CloudWatch log group',
    route53: 'Route 53 zone', kms: 'KMS key', kinesis: 'Kinesis stream',
    elasticache: 'ElastiCache cluster', wafv2: 'WAF rule', ssm: 'SSM parameter',
    functions: 'Cloud Function', run: 'Cloud Run service', storage: 'storage bucket',
    pubsub: 'Pub/Sub topic', bigquery: 'BigQuery dataset', firestore: 'Firestore database',
    functionapp: 'Azure Function', webapp: 'App Service', cosmosdb: 'Cosmos DB',
    servicebus: 'Service Bus', aks: 'AKS cluster', sql: 'Azure SQL database',
  };

  const svcLabel = serviceLabels[sub] || sub || 'resource';
  const verb = action?.startsWith('create') || action === 'mb' ? 'Sets up' :
    action?.startsWith('put') ? 'Configures' :
    action?.startsWith('delete') || action === 'rm' ? 'Removes' :
    action?.startsWith('update') ? 'Updates' :
    action === 'deploy' ? 'Deploys' :
    action === 'run' || action === 'run-instances' ? 'Launches' : 'Manages';

  let summary = `${verb} ${svcLabel}`;
  if (name) summary += ` '${name}'`;
  summary += ` in your project`;

  // Add purpose hints based on service type
  const purposes = {
    events: ' for scheduled tasks and event routing',
    sqs: ' for async message processing',
    sns: ' for push notifications and alerts',
    'cognito-idp': ' for user authentication',
    cloudfront: ' for global content delivery',
    elasticache: ' for fast data caching',
    stepfunctions: ' for orchestrating multi-step workflows',
    lambda: ' for serverless compute',
    apigateway: ' as the API entry point',
    dynamodb: ' for NoSQL data storage',
    s3: ' for file and asset storage',
    rds: ' for relational data storage',
    kinesis: ' for real-time data streaming',
    secretsmanager: ' for secure credential storage',
    logs: ' for monitoring and debugging',
  };
  summary += purposes[sub] || '';
  return summary;
}

function pkgSummary(base, sub, tokens, positional) {
  if (sub === 'init') return 'Initializes a new project with a package.json';
  if (sub === 'install' || sub === 'i' || sub === 'add') {
    const isDev = tokens.includes('-D') || tokens.includes('--save-dev');
    const pkgs = tokens.filter((t, i) => i > 1 && !t.startsWith('-') && t !== sub);
    if (!pkgs.length) return 'Installs all project dependencies from package.json';
    return `Adds ${pkgs.join(', ')} as ${isDev ? 'dev ' : ''}dependencies to the project`;
  }
  if (sub === 'run') return `Runs the '${positional[0] || 'script'}' task defined in package.json`;
  if (sub === 'test') return 'Runs the project test suite';
  if (sub === 'build') return 'Builds the project for production';
  return `Runs ${base} ${sub || ''}`.trim();
}

function gitSummary(sub, tokens, named, positional) {
  if (sub === 'init') return 'Initializes a new Git repository to track code changes';
  if (sub === 'commit') {
    const msg = tokens.join(' ').match(/-m\s+["']?([^"']+)/);
    return msg ? `Saves a checkpoint: "${msg[1]}"` : 'Saves a code checkpoint';
  }
  if (sub === 'add') return positional[0] === '.' ? 'Stages all changed files for commit' : `Stages ${positional.join(', ')} for commit`;
  if (sub === 'push') return 'Pushes local commits to the remote repository';
  if (sub === 'pull') return 'Pulls latest changes from the remote repository';
  if (sub === 'clone') return `Clones the ${positional[0] || ''} repository locally`.trim();
  if (sub === 'checkout' || sub === 'switch') return `Switches to the '${positional[0] || ''}' branch`.trim();
  if (sub === 'branch') return positional[0] ? `Creates a new branch '${positional[0]}'` : 'Lists branches';
  if (sub === 'merge') return `Merges '${positional[0] || ''}' into the current branch`.trim();
  return `Git ${sub || 'operation'}`;
}

function dockerSummary(sub, tokens, named, positional) {
  if (sub === 'build') {
    const tag = named['-t'] || named['--tag'] || '';
    return tag ? `Builds a container image '${tag}' from the Dockerfile` : 'Builds a container image from the Dockerfile';
  }
  if (sub === 'run') {
    const port = tokens.join(' ').match(/-p\s+(\S+)/);
    return port ? `Starts a container accessible on port ${port[1]}` : 'Starts a new container';
  }
  if (sub === 'push') return `Pushes the container image to a registry`;
  if (sub === 'compose') return 'Manages multi-container services with Docker Compose';
  return `Docker ${sub || 'operation'}`;
}

function tfSummary(sub) {
  if (sub === 'init') return 'Initializes Terraform and downloads required providers';
  if (sub === 'apply') return 'Provisions all defined cloud infrastructure';
  if (sub === 'plan') return 'Previews infrastructure changes without applying them';
  if (sub === 'destroy') return 'Tears down all managed infrastructure';
  return `Terraform ${sub || 'operation'}`;
}

function k8sSummary(sub, tokens, positional) {
  if (sub === 'apply') return `Deploys Kubernetes resources from ${positional.find(t => t.endsWith('.yaml') || t.endsWith('.yml')) || 'manifest'}`;
  if (sub === 'get') return `Lists Kubernetes ${positional[0] || 'resources'}`;
  if (sub === 'delete') return `Removes Kubernetes ${positional[0] || 'resources'}`;
  return `Kubernetes ${sub || 'operation'}`;
}

function tokenize(cmd) {
  // Simple shell tokenizer — handles quotes
  const tokens = [];
  let current = '';
  let inQuote = null;
  for (const ch of cmd) {
    if (inQuote) {
      if (ch === inQuote) { inQuote = null; } else { current += ch; }
    } else if (ch === '"' || ch === "'") {
      inQuote = ch;
    } else if (ch === ' ' || ch === '\t') {
      if (current) { tokens.push(current); current = ''; }
    } else {
      current += ch;
    }
  }
  if (current) tokens.push(current);
  return tokens;
}
