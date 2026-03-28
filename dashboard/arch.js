// Architecture view — live cloud/infra architecture diagram
(function() {
const archNS = 'http://www.w3.org/2000/svg';
const archSvg = document.getElementById('arch-svg');

const serviceCatalog = {
  // AWS
  lambda:       { icon:'λ',  label:'Lambda',         color:'#ff9900' },
  apigateway:   { icon:'⇄',  label:'API Gateway',    color:'#ff9900' },
  dynamodb:     { icon:'◎',  label:'DynamoDB',       color:'#4053d6' },
  s3:           { icon:'◇',  label:'S3',             color:'#3f8624' },
  ec2:          { icon:'▣',  label:'EC2',            color:'#ff9900' },
  ecs:          { icon:'◈',  label:'ECS',            color:'#ff9900' },
  rds:          { icon:'◉',  label:'RDS',            color:'#4053d6' },
  sqs:          { icon:'↦',  label:'SQS',            color:'#ff9900' },
  sns:          { icon:'⚑',  label:'SNS',            color:'#ff9900' },
  cloudfront:   { icon:'◐',  label:'CloudFront',     color:'#8c4fff' },
  cognito:      { icon:'👤', label:'Cognito',         color:'#dd344c' },
  iam:          { icon:'🔑', label:'IAM',             color:'#dd344c' },
  vpc:          { icon:'☐',  label:'VPC',             color:'#8c4fff' },
  route53:      { icon:'🌐', label:'Route 53',        color:'#8c4fff' },
  secretsmanager:{icon:'🔒', label:'Secrets Mgr',     color:'#dd344c' },
  cloudwatch:   { icon:'📊', label:'CloudWatch',      color:'#ff9900' },
  stepfunctions:{ icon:'⟳',  label:'Step Functions',  color:'#ff9900' },
  eventbridge:  { icon:'⚡', label:'EventBridge',     color:'#ff9900' },
  // GCP
  cloudfunctions:{ icon:'ƒ', label:'Cloud Functions', color:'#4285f4' },
  cloudrun:     { icon:'▷',  label:'Cloud Run',       color:'#4285f4' },
  gcs:          { icon:'◇',  label:'Cloud Storage',   color:'#4285f4' },
  bigquery:     { icon:'◫',  label:'BigQuery',        color:'#4285f4' },
  firestore:    { icon:'◎',  label:'Firestore',       color:'#ffca28' },
  pubsub:       { icon:'↦',  label:'Pub/Sub',         color:'#4285f4' },
  gke:          { icon:'☸',  label:'GKE',             color:'#4285f4' },
  cloudsql:     { icon:'◉',  label:'Cloud SQL',       color:'#4285f4' },
  // Azure
  azfunctions:  { icon:'ƒ',  label:'Azure Functions', color:'#0078d4' },
  azappservice: { icon:'▣',  label:'App Service',     color:'#0078d4' },
  cosmosdb:     { icon:'◎',  label:'Cosmos DB',       color:'#0078d4' },
  azblob:       { icon:'◇',  label:'Blob Storage',    color:'#0078d4' },
  azservicebus: { icon:'↦',  label:'Service Bus',     color:'#0078d4' },
  aks:          { icon:'☸',  label:'AKS',             color:'#0078d4' },
  azsql:        { icon:'◉',  label:'Azure SQL',       color:'#0078d4' },
  // Containers & IaC
  docker:       { icon:'🐳', label:'Docker',          color:'#2496ed' },
  k8s:          { icon:'☸',  label:'Kubernetes',      color:'#326ce5' },
  terraform:    { icon:'⬡',  label:'Terraform',       color:'#7b42bc' },
  pulumi:       { icon:'⬡',  label:'Pulumi',          color:'#8a3391' },
  serverless:   { icon:'⚡', label:'Serverless Fwk',  color:'#fd5750' },
  // Platforms & Hosting
  vercel:       { icon:'▲',  label:'Vercel',          color:'#e6edf3' },
  netlify:      { icon:'◆',  label:'Netlify',         color:'#00c7b7' },
  firebase:     { icon:'🔥', label:'Firebase',        color:'#ffca28' },
  supabase:     { icon:'⚡', label:'Supabase',        color:'#3ecf8e' },
  flyio:        { icon:'▷',  label:'Fly.io',          color:'#8b5cf6' },
  railway:      { icon:'🚂', label:'Railway',         color:'#e6edf3' },
  heroku:       { icon:'◈',  label:'Heroku',          color:'#430098' },
  // App frameworks
  express:      { icon:'⚡', label:'Express',         color:'#3fb950' },
  react:        { icon:'⚛',  label:'React',           color:'#61dafb' },
  nextjs:       { icon:'▲',  label:'Next.js',         color:'#e6edf3' },
  django:       { icon:'🐍', label:'Django',          color:'#092e20' },
  flask:        { icon:'🧪', label:'Flask',           color:'#e6edf3' },
  fastapi:      { icon:'⚡', label:'FastAPI',         color:'#009688' },
  // Databases
  postgres:     { icon:'🐘', label:'PostgreSQL',      color:'#336791' },
  mongodb:      { icon:'🍃', label:'MongoDB',         color:'#47a248' },
  redis:        { icon:'◆',  label:'Redis',           color:'#dc382d' },
  mysql:        { icon:'🐬', label:'MySQL',           color:'#4479a1' },
  elasticsearch:{ icon:'🔍', label:'Elasticsearch',   color:'#fed10a' },
  // Data & Analytics
  snowflake:    { icon:'❄',  label:'Snowflake',       color:'#29b5e8' },
  databricks:   { icon:'◈',  label:'Databricks',      color:'#ff3621' },
  kafka:        { icon:'◉',  label:'Kafka',           color:'#231f20' },
  airflow:      { icon:'🌀', label:'Airflow',         color:'#017cee' },
  dbt:          { icon:'◫',  label:'dbt',             color:'#ff694b' },
  spark:        { icon:'⚡', label:'Spark',           color:'#e25a1c' },
  // SaaS & APIs
  stripe:       { icon:'💳', label:'Stripe',          color:'#635bff' },
  twilio:       { icon:'📱', label:'Twilio',          color:'#f22f46' },
  sendgrid:     { icon:'✉',  label:'SendGrid',        color:'#1a82e2' },
  slack:        { icon:'💬', label:'Slack',            color:'#4a154b' },
  auth0:        { icon:'🔐', label:'Auth0',           color:'#eb5424' },
  // Networking
  nginx:        { icon:'▶',  label:'Nginx',           color:'#009639' },
  cloudflare:   { icon:'☁',  label:'Cloudflare',      color:'#f38020' },
};

// Detection patterns
const detectPatterns = {
  // AWS
  lambda:       [/aws\s+lambda/],
  apigateway:   [/aws\s+apigateway/],
  dynamodb:     [/aws\s+dynamodb/],
  s3:           [/aws\s+s3/],
  ec2:          [/aws\s+ec2(?!\s+(create-vpc|describe-vpcs))/],
  ecs:          [/aws\s+ecs/],
  rds:          [/aws\s+rds/],
  sqs:          [/aws\s+sqs/],
  sns:          [/aws\s+sns/],
  cloudfront:   [/aws\s+cloudfront/],
  cognito:      [/aws\s+cognito/],
  iam:          [/aws\s+iam/],
  vpc:          [/aws\s+ec2\s+(create-vpc|describe-vpcs)/,/terraform.*aws_vpc/],
  route53:      [/aws\s+route53/],
  secretsmanager:[/aws\s+secretsmanager/],
  cloudwatch:   [/aws\s+(cloudwatch|logs)/],
  stepfunctions:[/aws\s+stepfunctions/],
  eventbridge:  [/aws\s+events/],
  // GCP
  cloudfunctions:[/gcloud\s+functions/],
  cloudrun:     [/gcloud\s+run/],
  gcs:          [/gsutil\s/,/gcloud\s+storage/],
  bigquery:     [/bq\s/,/gcloud\s+bigquery/],
  firestore:    [/gcloud\s+firestore/,/firebase\s+.*firestore/],
  pubsub:       [/gcloud\s+pubsub/],
  gke:          [/gcloud\s+container/],
  cloudsql:     [/gcloud\s+sql/],
  // Azure
  azfunctions:  [/az\s+functionapp/],
  azappservice: [/az\s+webapp/,/az\s+appservice/],
  cosmosdb:     [/az\s+cosmosdb/],
  azblob:       [/az\s+storage\s+blob/,/az\s+storage\s+account/],
  azservicebus: [/az\s+servicebus/],
  aks:          [/az\s+aks/],
  azsql:        [/az\s+sql/],
  // Containers & IaC
  docker:       [/^docker\s/],
  k8s:          [/^kubectl\s/],
  terraform:    [/^terraform\s/],
  pulumi:       [/^pulumi\s/],
  serverless:   [/^serverless\s/,/^sls\s/],
  // Platforms
  vercel:       [/^vercel\s/,/npx\s+vercel/],
  netlify:      [/^netlify\s/,/npx\s+netlify/],
  firebase:     [/^firebase\s/],
  supabase:     [/^supabase\s/,/npx\s+supabase/],
  flyio:        [/^fly\s/,/^flyctl\s/],
  railway:      [/^railway\s/],
  heroku:       [/^heroku\s/],
  // Frameworks
  express:      [/npm\s+(install|i)\s+.*express/],
  react:        [/npm\s+(install|i)\s+.*react/,/npx\s+create-react-app/],
  nextjs:       [/npx\s+create-next-app/,/npm\s+(install|i)\s+.*\bnext\b/],
  django:       [/pip\s+install.*django/,/django-admin\s/],
  flask:        [/pip\s+install.*flask/],
  fastapi:      [/pip\s+install.*fastapi/],
  // Databases
  postgres:     [/npm\s+(install|i)\s+.*\bpg\b/,/pip\s+install.*psycopg/,/psql\s/],
  mongodb:      [/npm\s+(install|i)\s+.*(mongoose|mongodb)/,/mongosh?\s/],
  redis:        [/npm\s+(install|i)\s+.*(redis|ioredis)/,/redis-cli\s/],
  mysql:        [/npm\s+(install|i)\s+.*mysql/,/pip\s+install.*mysql/,/^mysql\s/],
  elasticsearch:[/npm\s+(install|i)\s+.*elasticsearch/,/pip\s+install.*elasticsearch/],
  // Data & Analytics
  snowflake:    [/snowsql\s/,/npm\s+(install|i)\s+.*snowflake/,/pip\s+install.*snowflake/],
  databricks:   [/databricks\s/,/pip\s+install.*databricks/],
  kafka:        [/kafka-/,/npm\s+(install|i)\s+.*kafkajs/,/pip\s+install.*kafka/],
  airflow:      [/airflow\s/,/pip\s+install.*airflow/],
  dbt:          [/^dbt\s/,/pip\s+install.*dbt/],
  spark:        [/spark-submit/,/pip\s+install.*pyspark/],
  // SaaS
  stripe:       [/npm\s+(install|i)\s+.*stripe/,/pip\s+install.*stripe/],
  twilio:       [/npm\s+(install|i)\s+.*twilio/,/pip\s+install.*twilio/],
  sendgrid:     [/npm\s+(install|i)\s+.*sendgrid/],
  slack:        [/npm\s+(install|i)\s+.*slack/,/pip\s+install.*slack/],
  auth0:        [/npm\s+(install|i)\s+.*auth0/],
  // Networking
  nginx:        [/docker.*nginx/],
  cloudflare:   [/^wrangler\s/,/npx\s+wrangler/],
};

// Layout: row, col position in the request flow grid
const layout = {
  // Row 0: Entry / CDN
  cloudfront:{row:0,col:0}, route53:{row:0,col:1}, nginx:{row:0,col:2}, cloudflare:{row:0,col:3}, vercel:{row:0,col:4}, netlify:{row:0,col:5},
  // Row 1: Auth & Security
  cognito:{row:1,col:0}, iam:{row:1,col:1}, secretsmanager:{row:1,col:2}, auth0:{row:1,col:3}, firebase:{row:1,col:4}, supabase:{row:1,col:5},
  // Row 2: API / Frontend
  apigateway:{row:2,col:0}, react:{row:2,col:1}, nextjs:{row:2,col:2}, django:{row:2,col:3}, flask:{row:2,col:4}, fastapi:{row:2,col:5},
  // Row 3: Compute
  lambda:{row:3,col:0}, express:{row:3,col:1}, ecs:{row:3,col:2}, ec2:{row:3,col:3}, docker:{row:3,col:4},
  cloudfunctions:{row:3,col:5}, cloudrun:{row:3,col:6}, azfunctions:{row:3,col:7}, azappservice:{row:3,col:8},
  // Row 4: Messaging & Events
  sqs:{row:4,col:0}, sns:{row:4,col:1}, eventbridge:{row:4,col:2}, stepfunctions:{row:4,col:3},
  pubsub:{row:4,col:4}, azservicebus:{row:4,col:5}, kafka:{row:4,col:6}, slack:{row:4,col:7}, twilio:{row:4,col:8}, sendgrid:{row:4,col:9},
  // Row 5: Data & Storage
  dynamodb:{row:5,col:0}, s3:{row:5,col:1}, rds:{row:5,col:2}, mongodb:{row:5,col:3}, postgres:{row:5,col:4}, redis:{row:5,col:5}, mysql:{row:5,col:6},
  firestore:{row:5,col:7}, gcs:{row:5,col:8}, cosmosdb:{row:5,col:9}, azblob:{row:5,col:10}, cloudsql:{row:5,col:11}, azsql:{row:5,col:12}, elasticsearch:{row:5,col:13},
  // Row 6: Analytics & Data Platforms
  bigquery:{row:6,col:0}, snowflake:{row:6,col:1}, databricks:{row:6,col:2}, kafka:{row:6,col:3}, airflow:{row:6,col:4}, dbt:{row:6,col:5}, spark:{row:6,col:6}, stripe:{row:6,col:7},
  // Row 7: Infra & Orchestration
  terraform:{row:7,col:0}, k8s:{row:7,col:1}, pulumi:{row:7,col:2}, serverless:{row:7,col:3}, vpc:{row:7,col:4}, gke:{row:7,col:5}, aks:{row:7,col:6},
  cloudwatch:{row:7,col:7}, flyio:{row:7,col:8}, railway:{row:7,col:9}, heroku:{row:7,col:10},
};

const rowLabels = {0:'ENTRY',1:'AUTH',2:'API',3:'COMPUTE',4:'MESSAGING',5:'DATA',6:'ANALYTICS',7:'INFRA'};

// Connections (request flow direction)
const connections = [
  // Entry → API/Compute
  ['cloudfront','apigateway'],['cloudfront','s3'],['route53','cloudfront'],['route53','apigateway'],
  ['nginx','express'],['nginx','nextjs'],['cloudflare','express'],['cloudflare','nextjs'],
  ['vercel','nextjs'],['netlify','react'],
  // Auth → API
  ['cognito','apigateway'],['auth0','apigateway'],['auth0','express'],
  ['firebase','react'],['firebase','nextjs'],['supabase','react'],['supabase','nextjs'],
  // API → Compute
  ['apigateway','lambda'],['apigateway','express'],['apigateway','ecs'],['apigateway','ec2'],
  ['react','express'],['react','apigateway'],['nextjs','express'],['nextjs','apigateway'],
  ['django','postgres'],['django','redis'],['flask','postgres'],['flask','redis'],['flask','mongodb'],
  ['fastapi','postgres'],['fastapi','redis'],['fastapi','mongodb'],
  // Compute → Data
  ['lambda','dynamodb'],['lambda','s3'],['lambda','sqs'],['lambda','rds'],
  ['express','mongodb'],['express','postgres'],['express','redis'],['express','dynamodb'],['express','mysql'],
  ['ecs','rds'],['ecs','dynamodb'],['ecs','s3'],['ec2','rds'],['ec2','s3'],
  ['cloudfunctions','firestore'],['cloudfunctions','gcs'],['cloudfunctions','pubsub'],
  ['cloudrun','cloudsql'],['cloudrun','gcs'],
  ['azfunctions','cosmosdb'],['azfunctions','azblob'],['azfunctions','azservicebus'],
  ['azappservice','azsql'],['azappservice','azblob'],
  ['docker','express'],['docker','nextjs'],['docker','django'],['docker','fastapi'],
  // Messaging
  ['sns','sqs'],['sns','lambda'],['eventbridge','lambda'],['eventbridge','sqs'],['stepfunctions','lambda'],
  ['pubsub','cloudfunctions'],['azservicebus','azfunctions'],
  ['kafka','spark'],['kafka','lambda'],['kafka','express'],
  // Data → Analytics
  ['s3','bigquery'],['s3','snowflake'],['s3','databricks'],['s3','spark'],
  ['gcs','bigquery'],['azblob','databricks'],
  ['airflow','bigquery'],['airflow','snowflake'],['airflow','spark'],
  ['dbt','bigquery'],['dbt','snowflake'],['dbt','postgres'],
  // SaaS
  ['express','stripe'],['express','twilio'],['express','sendgrid'],['express','slack'],
  ['lambda','stripe'],['lambda','sendgrid'],
];

// State
const activeServices = {};
const serviceCommands = {};
let latestServiceId = null;

function el(tag, attrs={}) {
  const e = document.createElementNS(archNS, tag);
  for (const [k,v] of Object.entries(attrs)) e.setAttribute(k, v);
  return e;
}

function loadSpec(specData) {
  if (!specData || !specData.steps) return;
  // Pre-populate from spec — just detect and render
  const text = specData.steps.join(' ').toLowerCase();
  for (const [id, svc] of Object.entries(serviceCatalog)) {
    if (text.includes(svc.label.toLowerCase()) || text.includes(id)) {
      if (!activeServices[id]) activeServices[id] = { ...svc, id, skeleton: true };
    }
  }
  render();
}

function addCommand(event) {
  const cmd = event.explanation[0].command;
  let changed = false;
  for (const id of Object.keys(activeServices)) activeServices[id].isLatest = false;

  for (const [id, patterns] of Object.entries(detectPatterns)) {
    const matches = patterns.some(re => re.test(cmd));
    if (!matches) continue;
    if (!serviceCommands[id]) serviceCommands[id] = [];
    serviceCommands[id].push(event);
    if (activeServices[id]) {
      activeServices[id].isLatest = true;
      activeServices[id].skeleton = false;
      latestServiceId = id;
      changed = true;
    } else {
      activeServices[id] = { ...serviceCatalog[id], id, isLatest: true };
      latestServiceId = id;
      changed = true;
    }
  }
  if (changed) render();
}

function render() {
  archSvg.innerHTML = '';
  const ids = Object.keys(activeServices);
  if (!ids.length) {
    const t = el('text', {x:500,y:320,'text-anchor':'middle',fill:themeColor('--dim'),'font-size':14,'font-family':'inherit'});
    t.textContent = 'Architecture will appear as services are detected…';
    archSvg.appendChild(t);
    return;
  }

  // Marker defs for arrowheads
  const defs = el('defs');
  const colors = new Set(ids.map(id => serviceCatalog[id]?.color).filter(Boolean));
  for (const c of colors) {
    const m = el('marker',{id:'ah'+c.replace('#',''),markerWidth:10,markerHeight:7,refX:9,refY:3.5,orient:'auto',markerUnits:'strokeWidth'});
    m.appendChild(el('polygon',{points:'0 0, 10 3.5, 0 7',fill:c}));
    defs.appendChild(m);
  }
  archSvg.appendChild(defs);

  const nW = 140, nH = 64, gX = 20, gY = 16, padL = 90, padT = 30;
  const positions = {};

  // Find active rows
  const activeRows = new Set();
  for (const id of ids) { const lp = layout[id]; if (lp) activeRows.add(lp.row); }
  const sortedRows = [...activeRows].sort((a,b) => a - b);
  const rowYMap = {};
  sortedRows.forEach((r, i) => { rowYMap[r] = padT + i * (nH + gY + 20); });

  // Position nodes
  for (const id of ids) {
    const lp = layout[id];
    if (!lp) continue;
    const x = padL + lp.col * (nW + gX);
    const y = rowYMap[lp.row];
    positions[id] = { x, y, w: nW, h: nH };
  }

  // Row labels
  for (const row of sortedRows) {
    const y = rowYMap[row] + nH / 2;
    const t = el('text',{x:12,y,'text-anchor':'start','dominant-baseline':'middle',fill:themeColor('--dim'),'font-size':10,'font-weight':600,'font-family':'inherit','letter-spacing':'1'});
    t.textContent = rowLabels[row] || '';
    archSvg.appendChild(t);
  }

  // Draw connections (behind nodes)
  for (const [a, b] of connections) {
    const fP = positions[a], tP = positions[b];
    if (!fP || !tP) continue;
    const bothActive = activeServices[a] && !activeServices[a].skeleton && activeServices[b] && !activeServices[b].skeleton;
    if (!bothActive) continue;

    const fCx = fP.x+fP.w/2, fCy = fP.y+fP.h/2, tCx = tP.x+tP.w/2, tCy = tP.y+tP.h/2;
    const dx = tCx-fCx, dy = tCy-fCy;
    let x1,y1,x2,y2;
    if (Math.abs(dy) > Math.abs(dx)*0.4) {
      x1=fP.x+fP.w/2; y1=dy>0?fP.y+fP.h:fP.y;
      x2=tP.x+tP.w/2; y2=dy>0?tP.y:tP.y+tP.h;
    } else {
      x1=dx>0?fP.x+fP.w:fP.x; y1=fP.y+fP.h/2;
      x2=dx>0?tP.x:tP.x+tP.w; y2=tP.y+tP.h/2;
    }
    const midX=(x1+x2)/2, midY=(y1+y2)/2;
    let d;
    if (Math.abs(y1-y2) > Math.abs(x1-x2)*0.4) d = `M${x1},${y1} C${x1},${midY} ${x2},${midY} ${x2},${y2}`;
    else d = `M${x1},${y1} C${midX},${y1} ${midX},${y2} ${x2},${y2}`;

    const col = serviceCatalog[a]?.color || '#484f58';
    archSvg.appendChild(el('path',{d,fill:'none',stroke:col,'stroke-width':1.5,'stroke-opacity':0.5,
      'marker-end':`url(#ah${col.replace('#','')})`,
      'stroke-dasharray':'300','stroke-dashoffset':'300',style:'animation:archDraw 0.8s ease forwards'}));
  }

  // Draw service boxes
  for (const id of ids) {
    const p = positions[id];
    if (!p) continue;
    const svc = activeServices[id];
    const cat = serviceCatalog[id];
    const isSkeleton = svc.skeleton;
    const isLatest = svc.isLatest;
    const g = el('g',{style: isSkeleton ? '' : 'animation:archFade 0.5s ease; cursor:pointer'});

    // Blinking border on active service
    if (isLatest) {
      g.appendChild(el('rect',{x:p.x-4,y:p.y-4,width:nW+8,height:nH+8,rx:12,
        fill:'none',stroke:cat.color,'stroke-width':3,
        style:'animation:archBlink 0.8s ease-in-out infinite'}));
    }

    g.appendChild(el('rect',{
      x:p.x, y:p.y, width:nW, height:nH, rx:10,
      fill: isSkeleton ? 'none' : themeColor('--surface'),
      stroke: isSkeleton ? themeColor('--border') : cat.color,
      'stroke-width': isLatest ? 2.5 : isSkeleton ? 1 : 2,
      'stroke-dasharray': isSkeleton ? '4 3' : 'none',
      opacity: isSkeleton ? 0.3 : 1,
    }));

    const iconT = el('text',{x:p.x+nW/2,y:p.y+24,'text-anchor':'middle',fill: isSkeleton ? themeColor('--border') : cat.color,'font-size':20,'font-family':'inherit'});
    iconT.textContent = cat.icon;
    g.appendChild(iconT);

    const labelT = el('text',{x:p.x+nW/2,y:p.y+46,'text-anchor':'middle',fill: isSkeleton ? themeColor('--border') : cat.color,'font-size':11,'font-weight':600,'font-family':'inherit'});
    labelT.textContent = cat.label;
    g.appendChild(labelT);

    if (isLatest) {
      const dot = el('text',{x:p.x+nW-8,y:p.y+14,'text-anchor':'middle',fill:cat.color,'font-size':12});
      dot.textContent = '●';
      g.appendChild(dot);
    }

    if (!isSkeleton) g.addEventListener('click', () => showDetail(id));
    archSvg.appendChild(g);
  }

  const maxRow = Math.max(...sortedRows);
  const maxCol = Math.max(...ids.map(id => layout[id]?.col ?? 0));
  const svgW = Math.max(900, padL + (maxCol+1)*(nW+gX) + 40);
  const svgH = Math.max(400, rowYMap[maxRow] + nH + 60);
  archSvg.setAttribute('viewBox', `0 0 ${svgW} ${svgH}`);
}

function escArch(s) { const d = document.createElement('div'); d.textContent = s; return d.innerHTML; }

function showDetail(id) {
  const existing = document.querySelector('.detail-overlay');
  if (existing) existing.remove();
  const svc = activeServices[id];
  const cat = serviceCatalog[id];
  if (!svc) return;
  const events = serviceCommands[id] || [];
  const conns = connections.filter(([a,b]) => (a===id||b===id) && activeServices[a] && !activeServices[a].skeleton && activeServices[b] && !activeServices[b].skeleton)
    .map(([a,b]) => ({ dir: a===id?'→':'←', label: serviceCatalog[a===id?b:a]?.label || (a===id?b:a), icon: serviceCatalog[a===id?b:a]?.icon || '' }));

  const panel = document.createElement('div');
  panel.className = 'detail-overlay';
  let html = `<button class="detail-close">✕</button>`;
  html += `<div class="detail-icon" style="color:${cat.color}">${cat.icon}</div>`;
  html += `<div class="detail-title" style="color:${cat.color}">${cat.label}</div>`;
  html += `<div class="detail-sub">${events.length} command${events.length!==1?'s':''} executed</div>`;

  // Connections
  if (conns.length) {
    html += `<div class="detail-section">Connections</div>`;
    for (const c of conns) html += `<div class="detail-conn">${c.dir} ${c.icon} ${escArch(c.label)}</div>`;
  }

  // Commands with full explanations
  if (events.length) {
    html += `<div class="detail-section">Activity</div>`;
    for (const ev of events) {
      const exp = ev.explanation[0];
      html += `<div class="detail-event">`;
      html += `<div class="detail-cmd">${escArch(exp.command)}</div>`;
      if (exp.toolDesc) html += `<div class="detail-desc">${escArch(exp.toolDesc)}</div>`;
      if (exp.action) html += `<div class="detail-action">⤷ ${escArch(exp.action)}</div>`;
      if (exp.flags && exp.flags.length) {
        for (const f of exp.flags) html += `<div class="detail-flag">${escArch(f.flag)} <span>${escArch(f.meaning)}</span></div>`;
      }
      if (ev.artifacts && ev.artifacts.length) {
        html += `<div class="detail-artifacts">${ev.artifacts.map(a => `<span>${a.icon} ${escArch(a.name)}</span>`).join(' ')}</div>`;
      }
      html += `</div>`;
    }
  }

  panel.innerHTML = html;
  document.getElementById('left-panel').appendChild(panel);
  panel.querySelector('.detail-close').addEventListener('click', () => panel.remove());
}

render();
window.arch = { addCommand, loadSpec };
})();
