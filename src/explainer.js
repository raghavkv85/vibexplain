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

  // Build human summary
  const parts = [info._desc];
  if (sub && info[sub]) parts.push(`→ ${info[sub]}`);
  if (flagExplanations.length) {
    parts.push(`(${flagExplanations.map(f => f.meaning).join(', ')})`);
  }
  result.summary = parts.join(' ');

  return result;
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
