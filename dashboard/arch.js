// Architecture view — live cloud/infra architecture diagram
(function() {
const archNS = 'http://www.w3.org/2000/svg';
const archSvg = document.getElementById('arch-svg');
const archPan = document.createElementNS(archNS, 'g');
archSvg.appendChild(archPan);

// Zoom/pan state
let aZoom = 1, aViewX = 0, aViewY = 0, aIsPanning = false, aPanX = 0, aPanY = 0;

function applyArchTransform() {
  archPan.setAttribute('transform', `translate(${aViewX},${aViewY}) scale(${aZoom})`);
}

(function initArchZoomPan() {
  const container = document.getElementById('arch-view');
  const controls = document.createElement('div');
  controls.className = 'zoom-controls';
  controls.innerHTML = '<button class="zoom-btn" data-action="in">+</button><button class="zoom-btn" data-action="out">−</button><button class="zoom-btn" data-action="reset">⌂</button>';
  container.appendChild(controls);
  controls.addEventListener('click', (e) => {
    const a = e.target.dataset.action;
    if (a === 'in') aZoom = Math.min(3, aZoom * 1.3);
    else if (a === 'out') aZoom = Math.max(0.2, aZoom / 1.3);
    else if (a === 'reset') { aZoom = 1; aViewX = 0; aViewY = 0; }
    applyArchTransform();
  });
  container.addEventListener('wheel', (e) => {
    e.preventDefault();
    aZoom = Math.max(0.2, Math.min(3, aZoom * (e.deltaY > 0 ? 0.9 : 1.1)));
    applyArchTransform();
  }, { passive: false });
  container.addEventListener('mousedown', (e) => {
    if (e.target.closest('.zoom-controls') || e.target.closest('.detail-overlay')) return;
    aIsPanning = true; aPanX = e.clientX; aPanY = e.clientY;
    container.style.cursor = 'grabbing';
  });
  window.addEventListener('mousemove', (e) => {
    if (!aIsPanning) return;
    aViewX += (e.clientX - aPanX) / aZoom;
    aViewY += (e.clientY - aPanY) / aZoom;
    aPanX = e.clientX; aPanY = e.clientY;
    applyArchTransform();
  });
  window.addEventListener('mouseup', () => { aIsPanning = false; document.getElementById('arch-view').style.cursor = 'grab'; });
  container.style.cursor = 'grab';
})();

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
  // AWS (continued)
  elasticache:  { icon:'◆',  label:'ElastiCache',    color:'#4053d6' },
  kinesis:      { icon:'↦',  label:'Kinesis',         color:'#ff9900' },
  emr:          { icon:'◈',  label:'EMR',             color:'#ff9900' },
  redshift:     { icon:'◫',  label:'Redshift',        color:'#4053d6' },
  glue:         { icon:'🔗', label:'Glue',             color:'#ff9900' },
  athena:       { icon:'🔍', label:'Athena',           color:'#ff9900' },
  sagemaker:    { icon:'🧠', label:'SageMaker',        color:'#ff9900' },
  bedrock:      { icon:'🤖', label:'Bedrock',          color:'#ff9900' },
  amplify:      { icon:'📱', label:'Amplify',          color:'#ff9900' },
  appsync:      { icon:'⇄',  label:'AppSync',          color:'#ff9900' },
  ses:          { icon:'✉',  label:'SES',              color:'#ff9900' },
  ecr:          { icon:'🐳', label:'ECR',              color:'#ff9900' },
  codepipeline: { icon:'⟳',  label:'CodePipeline',    color:'#ff9900' },
  codebuild:    { icon:'🔨', label:'CodeBuild',        color:'#ff9900' },
  cloudformation:{ icon:'📋',label:'CloudFormation',   color:'#ff9900' },
  elasticbeanstalk:{ icon:'🌱',label:'Elastic Beanstalk',color:'#ff9900' },
  waf:          { icon:'🛡',  label:'WAF',             color:'#dd344c' },
  kms:          { icon:'🔑', label:'KMS',              color:'#dd344c' },
  ssm:          { icon:'⚙',  label:'Systems Manager', color:'#ff9900' },
  efs:          { icon:'📁', label:'EFS',              color:'#3f8624' },
  aurora:       { icon:'◉',  label:'Aurora',           color:'#4053d6' },
  // GCP
  cloudfunctions:{ icon:'ƒ', label:'Cloud Functions', color:'#4285f4' },
  cloudrun:     { icon:'▷',  label:'Cloud Run',       color:'#4285f4' },
  gcs:          { icon:'◇',  label:'Cloud Storage',   color:'#4285f4' },
  bigquery:     { icon:'◫',  label:'BigQuery',        color:'#4285f4' },
  firestore:    { icon:'◎',  label:'Firestore',       color:'#ffca28' },
  pubsub:       { icon:'↦',  label:'Pub/Sub',         color:'#4285f4' },
  gke:          { icon:'☸',  label:'GKE',             color:'#4285f4' },
  cloudsql:     { icon:'◉',  label:'Cloud SQL',       color:'#4285f4' },
  gce:          { icon:'▣',  label:'Compute Engine',  color:'#4285f4' },
  gcr:          { icon:'🐳', label:'Artifact Registry',color:'#4285f4' },
  cloudcdn:     { icon:'◐',  label:'Cloud CDN',       color:'#4285f4' },
  clouddns:     { icon:'🌐', label:'Cloud DNS',       color:'#4285f4' },
  memorystore:  { icon:'◆',  label:'Memorystore',     color:'#4285f4' },
  spanner:      { icon:'◉',  label:'Spanner',         color:'#4285f4' },
  bigtable:     { icon:'◎',  label:'Bigtable',        color:'#4285f4' },
  dataflow:     { icon:'↦',  label:'Dataflow',        color:'#4285f4' },
  dataproc:     { icon:'◈',  label:'Dataproc',        color:'#4285f4' },
  vertexai:     { icon:'🧠', label:'Vertex AI',       color:'#4285f4' },
  cloudtasks:   { icon:'📋', label:'Cloud Tasks',     color:'#4285f4' },
  scheduler:    { icon:'⏰', label:'Cloud Scheduler', color:'#4285f4' },
  secretmgr:    { icon:'🔒', label:'Secret Manager',  color:'#4285f4' },
  iap:          { icon:'🔐', label:'IAP',             color:'#4285f4' },
  loadbalancer: { icon:'⇄',  label:'Load Balancer',   color:'#4285f4' },
  cloudbuild:   { icon:'🔨', label:'Cloud Build',     color:'#4285f4' },
  // Azure
  azfunctions:  { icon:'ƒ',  label:'Azure Functions', color:'#0078d4' },
  azappservice: { icon:'▣',  label:'App Service',     color:'#0078d4' },
  cosmosdb:     { icon:'◎',  label:'Cosmos DB',       color:'#0078d4' },
  azblob:       { icon:'◇',  label:'Blob Storage',    color:'#0078d4' },
  azservicebus: { icon:'↦',  label:'Service Bus',     color:'#0078d4' },
  aks:          { icon:'☸',  label:'AKS',             color:'#0078d4' },
  azsql:        { icon:'◉',  label:'Azure SQL',       color:'#0078d4' },
  azvm:         { icon:'▣',  label:'Azure VM',        color:'#0078d4' },
  azcdn:        { icon:'◐',  label:'Azure CDN',       color:'#0078d4' },
  azdns:        { icon:'🌐', label:'Azure DNS',       color:'#0078d4' },
  azredis:      { icon:'◆',  label:'Azure Cache',     color:'#0078d4' },
  azeventhubs:  { icon:'↦',  label:'Event Hubs',      color:'#0078d4' },
  azkeyvault:   { icon:'🔑', label:'Key Vault',       color:'#0078d4' },
  azcontainer:  { icon:'🐳', label:'Container Apps',  color:'#0078d4' },
  azfrontdoor:  { icon:'◐',  label:'Front Door',      color:'#0078d4' },
  azlogic:      { icon:'⟳',  label:'Logic Apps',      color:'#0078d4' },
  azsignalr:    { icon:'⇄',  label:'SignalR',         color:'#0078d4' },
  azmonitor:    { icon:'📊', label:'Azure Monitor',   color:'#0078d4' },
  azopenai:     { icon:'🤖', label:'Azure OpenAI',    color:'#0078d4' },
  azdevops:     { icon:'⟳',  label:'Azure DevOps',    color:'#0078d4' },
  azsynapse:    { icon:'◫',  label:'Synapse',         color:'#0078d4' },
  azdatafactory:{ icon:'🔗', label:'Data Factory',    color:'#0078d4' },
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
  // AWS continued
  elasticache:  [/aws\s+elasticache/],
  kinesis:      [/aws\s+kinesis/],
  emr:          [/aws\s+emr/],
  redshift:     [/aws\s+redshift/],
  glue:         [/aws\s+glue/],
  athena:       [/aws\s+athena/],
  sagemaker:    [/aws\s+sagemaker/],
  bedrock:      [/aws\s+bedrock/],
  amplify:      [/aws\s+amplify/,/npx\s+amplify/],
  appsync:      [/aws\s+appsync/],
  ses:          [/aws\s+ses/],
  ecr:          [/aws\s+ecr/],
  codepipeline: [/aws\s+codepipeline/],
  codebuild:    [/aws\s+codebuild/],
  cloudformation:[/aws\s+cloudformation/],
  elasticbeanstalk:[/aws\s+elasticbeanstalk/,/^eb\s/],
  waf:          [/aws\s+waf/],
  kms:          [/aws\s+kms/],
  ssm:          [/aws\s+ssm/],
  efs:          [/aws\s+efs/],
  aurora:       [/aws\s+rds.*aurora/],
  // GCP
  cloudfunctions:[/gcloud\s+functions/],
  cloudrun:     [/gcloud\s+run/],
  gcs:          [/gsutil\s/,/gcloud\s+storage/],
  bigquery:     [/bq\s/,/gcloud\s+bigquery/],
  firestore:    [/gcloud\s+firestore/,/firebase\s+.*firestore/],
  pubsub:       [/gcloud\s+pubsub/],
  gke:          [/gcloud\s+container\s+clusters/],
  cloudsql:     [/gcloud\s+sql/],
  gce:          [/gcloud\s+compute\s+instances/],
  gcr:          [/gcloud\s+artifacts/,/gcloud\s+container\s+images/],
  cloudcdn:     [/gcloud\s+compute\s+backend.*cdn/],
  clouddns:     [/gcloud\s+dns/],
  memorystore:  [/gcloud\s+redis/],
  spanner:      [/gcloud\s+spanner/],
  bigtable:     [/gcloud\s+bigtable/,/cbt\s/],
  dataflow:     [/gcloud\s+dataflow/],
  dataproc:     [/gcloud\s+dataproc/],
  vertexai:     [/gcloud\s+ai/,/gcloud\s+ml/],
  cloudtasks:   [/gcloud\s+tasks/],
  scheduler:    [/gcloud\s+scheduler/],
  secretmgr:    [/gcloud\s+secrets/],
  iap:          [/gcloud\s+iap/],
  loadbalancer: [/gcloud\s+compute\s+(forwarding|target|backend|url-map|health)/],
  cloudbuild:   [/gcloud\s+builds/],
  // Azure
  azfunctions:  [/az\s+functionapp/],
  azappservice: [/az\s+webapp/,/az\s+appservice/],
  cosmosdb:     [/az\s+cosmosdb/],
  azblob:       [/az\s+storage\s+blob/,/az\s+storage\s+account/],
  azservicebus: [/az\s+servicebus/],
  aks:          [/az\s+aks/],
  azsql:        [/az\s+sql/],
  azvm:         [/az\s+vm\s/],
  azcdn:        [/az\s+cdn/],
  azdns:        [/az\s+network\s+dns/],
  azredis:      [/az\s+redis/],
  azeventhubs:  [/az\s+eventhubs/],
  azkeyvault:   [/az\s+keyvault/],
  azcontainer:  [/az\s+containerapp/],
  azfrontdoor:  [/az\s+network\s+front-door/,/az\s+afd/],
  azlogic:      [/az\s+logic/],
  azsignalr:    [/az\s+signalr/],
  azmonitor:    [/az\s+monitor/],
  azopenai:     [/az\s+cognitiveservices/,/az\s+openai/],
  azdevops:     [/az\s+devops/,/az\s+pipelines/],
  azsynapse:    [/az\s+synapse/],
  azdatafactory:[/az\s+datafactory/],
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
  azfrontdoor:{row:0,col:6}, azcdn:{row:0,col:7}, cloudcdn:{row:0,col:8}, clouddns:{row:0,col:9}, azdns:{row:0,col:10}, loadbalancer:{row:0,col:11}, waf:{row:0,col:12},
  // Row 1: Auth & Security
  cognito:{row:1,col:0}, iam:{row:1,col:1}, secretsmanager:{row:1,col:2}, auth0:{row:1,col:3}, firebase:{row:1,col:4}, supabase:{row:1,col:5},
  kms:{row:1,col:6}, azkeyvault:{row:1,col:7}, secretmgr:{row:1,col:8}, iap:{row:1,col:9},
  // Row 2: API / Frontend
  apigateway:{row:2,col:0}, appsync:{row:2,col:1}, react:{row:2,col:2}, nextjs:{row:2,col:3}, django:{row:2,col:4}, flask:{row:2,col:5}, fastapi:{row:2,col:6}, amplify:{row:2,col:7}, azsignalr:{row:2,col:8},
  // Row 3: Compute
  lambda:{row:3,col:0}, express:{row:3,col:1}, ecs:{row:3,col:2}, ec2:{row:3,col:3}, docker:{row:3,col:4},
  cloudfunctions:{row:3,col:5}, cloudrun:{row:3,col:6}, gce:{row:3,col:7},
  azfunctions:{row:3,col:8}, azappservice:{row:3,col:9}, azvm:{row:3,col:10}, azcontainer:{row:3,col:11}, azlogic:{row:3,col:12},
  stepfunctions:{row:3,col:13}, elasticbeanstalk:{row:3,col:14},
  // Row 4: Messaging & Events
  sqs:{row:4,col:0}, sns:{row:4,col:1}, eventbridge:{row:4,col:2}, kinesis:{row:4,col:3},
  pubsub:{row:4,col:4}, cloudtasks:{row:4,col:5}, scheduler:{row:4,col:6},
  azservicebus:{row:4,col:7}, azeventhubs:{row:4,col:8},
  kafka:{row:4,col:9}, slack:{row:4,col:10}, twilio:{row:4,col:11}, sendgrid:{row:4,col:12}, ses:{row:4,col:13}, stripe:{row:4,col:14},
  // Row 5: Data & Storage
  dynamodb:{row:5,col:0}, s3:{row:5,col:1}, rds:{row:5,col:2}, aurora:{row:5,col:3}, mongodb:{row:5,col:4}, postgres:{row:5,col:5}, redis:{row:5,col:6}, mysql:{row:5,col:7}, elasticsearch:{row:5,col:8}, elasticache:{row:5,col:9}, efs:{row:5,col:10},
  firestore:{row:5,col:11}, gcs:{row:5,col:12}, cloudsql:{row:5,col:13}, spanner:{row:5,col:14}, bigtable:{row:5,col:15}, memorystore:{row:5,col:16},
  cosmosdb:{row:5,col:17}, azblob:{row:5,col:18}, azsql:{row:5,col:19}, azredis:{row:5,col:20},
  // Row 6: Analytics & AI
  bigquery:{row:6,col:0}, snowflake:{row:6,col:1}, databricks:{row:6,col:2}, redshift:{row:6,col:3}, athena:{row:6,col:4}, glue:{row:6,col:5},
  airflow:{row:6,col:6}, dbt:{row:6,col:7}, spark:{row:6,col:8}, dataflow:{row:6,col:9}, dataproc:{row:6,col:10}, emr:{row:6,col:11},
  sagemaker:{row:6,col:12}, bedrock:{row:6,col:13}, vertexai:{row:6,col:14}, azopenai:{row:6,col:15}, azsynapse:{row:6,col:16}, azdatafactory:{row:6,col:17},
  // Row 7: Infra & CI/CD
  terraform:{row:7,col:0}, k8s:{row:7,col:1}, pulumi:{row:7,col:2}, serverless:{row:7,col:3}, cloudformation:{row:7,col:4},
  vpc:{row:7,col:5}, gke:{row:7,col:6}, aks:{row:7,col:7},
  ecr:{row:7,col:8}, gcr:{row:7,col:9}, cloudbuild:{row:7,col:10}, codepipeline:{row:7,col:11}, codebuild:{row:7,col:12}, azdevops:{row:7,col:13},
  cloudwatch:{row:7,col:14}, azmonitor:{row:7,col:15}, ssm:{row:7,col:16},
  flyio:{row:7,col:17}, railway:{row:7,col:18}, heroku:{row:7,col:19},
};

const rowLabels = {0:'ENTRY',1:'AUTH',2:'API',3:'COMPUTE',4:'MESSAGING',5:'DATA',6:'ANALYTICS',7:'INFRA'};

// Connections (request flow direction)
const connections = [
  // Entry → API/Compute
  ['cloudfront','apigateway'],['cloudfront','s3'],['route53','cloudfront'],['route53','apigateway'],
  ['nginx','express'],['nginx','nextjs'],['cloudflare','express'],['cloudflare','nextjs'],
  ['vercel','nextjs'],['netlify','react'],['azfrontdoor','azappservice'],['azfrontdoor','azfunctions'],
  ['azcdn','azblob'],['cloudcdn','gcs'],['loadbalancer','gce'],['loadbalancer','cloudrun'],
  // Auth → API
  ['cognito','apigateway'],['auth0','apigateway'],['auth0','express'],
  ['firebase','react'],['firebase','nextjs'],['supabase','react'],['supabase','nextjs'],['iap','cloudrun'],
  // API → Compute
  ['apigateway','lambda'],['apigateway','express'],['apigateway','ecs'],['apigateway','ec2'],
  ['appsync','lambda'],['appsync','dynamodb'],
  ['react','express'],['react','apigateway'],['nextjs','express'],['nextjs','apigateway'],
  ['django','postgres'],['django','redis'],['flask','postgres'],['flask','mongodb'],
  ['fastapi','postgres'],['fastapi','redis'],['fastapi','mongodb'],
  // Compute → Data (AWS)
  ['lambda','dynamodb'],['lambda','s3'],['lambda','sqs'],['lambda','rds'],['lambda','aurora'],['lambda','elasticache'],
  ['express','mongodb'],['express','postgres'],['express','redis'],['express','dynamodb'],['express','mysql'],['express','elasticsearch'],
  ['ecs','rds'],['ecs','dynamodb'],['ecs','s3'],['ecs','aurora'],['ec2','rds'],['ec2','s3'],['ec2','efs'],
  ['docker','express'],['docker','nextjs'],['docker','django'],['docker','fastapi'],
  ['elasticbeanstalk','rds'],['elasticbeanstalk','s3'],
  // Compute → Data (GCP)
  ['cloudfunctions','firestore'],['cloudfunctions','gcs'],['cloudfunctions','pubsub'],['cloudfunctions','bigtable'],
  ['cloudrun','cloudsql'],['cloudrun','gcs'],['cloudrun','memorystore'],['cloudrun','spanner'],
  ['gce','cloudsql'],['gce','gcs'],
  // Compute → Data (Azure)
  ['azfunctions','cosmosdb'],['azfunctions','azblob'],['azfunctions','azservicebus'],['azfunctions','azsql'],
  ['azappservice','azsql'],['azappservice','azblob'],['azappservice','azredis'],['azappservice','cosmosdb'],
  ['azvm','azsql'],['azvm','azblob'],['azcontainer','cosmosdb'],['azcontainer','azsql'],
  ['azlogic','azservicebus'],['azlogic','cosmosdb'],
  // Messaging
  ['sns','sqs'],['sns','lambda'],['eventbridge','lambda'],['eventbridge','sqs'],['stepfunctions','lambda'],
  ['kinesis','lambda'],['kinesis','s3'],
  ['pubsub','cloudfunctions'],['pubsub','cloudrun'],['cloudtasks','cloudrun'],
  ['azservicebus','azfunctions'],['azeventhubs','azfunctions'],
  ['kafka','spark'],['kafka','lambda'],['kafka','express'],
  ['ses','lambda'],['ses','sns'],
  // Data → Analytics
  ['s3','redshift'],['s3','athena'],['s3','glue'],['s3','emr'],['s3','sagemaker'],['s3','bedrock'],
  ['s3','bigquery'],['s3','snowflake'],['s3','databricks'],['s3','spark'],
  ['gcs','bigquery'],['gcs','dataflow'],['gcs','dataproc'],['gcs','vertexai'],
  ['azblob','azsynapse'],['azblob','azdatafactory'],['azblob','databricks'],['azblob','azopenai'],
  ['glue','redshift'],['glue','s3'],['athena','s3'],
  ['airflow','bigquery'],['airflow','snowflake'],['airflow','spark'],['airflow','redshift'],
  ['dbt','bigquery'],['dbt','snowflake'],['dbt','postgres'],['dbt','redshift'],
  ['dataflow','bigquery'],['dataproc','gcs'],['emr','s3'],
  ['azdatafactory','azsynapse'],['azdatafactory','azsql'],
  // SaaS
  ['express','stripe'],['express','twilio'],['express','sendgrid'],['express','slack'],
  ['lambda','stripe'],['lambda','sendgrid'],
  // CI/CD
  ['codepipeline','codebuild'],['codebuild','ecr'],['codebuild','s3'],
  ['cloudbuild','cloudrun'],['cloudbuild','gcr'],['cloudbuild','gke'],
  ['azdevops','aks'],['azdevops','azappservice'],
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

  // Extract resource name from command
  const nameMatch = cmd.match(/--(?:table-name|function-name|queue-name|name|pool-name|cluster-name|cache-cluster-id|db-instance-identifier)\s+(\S+)/);
  const resourceName = nameMatch ? nameMatch[1] : null;

  for (const [id, patterns] of Object.entries(detectPatterns)) {
    const matches = patterns.some(re => re.test(cmd));
    if (!matches) continue;
    if (!serviceCommands[id]) serviceCommands[id] = [];
    serviceCommands[id].push(event);
    if (activeServices[id]) {
      activeServices[id].isLatest = true;
      activeServices[id].skeleton = false;
      if (resourceName && !activeServices[id].resources) activeServices[id].resources = [];
      if (resourceName && !activeServices[id].resources?.includes(resourceName)) activeServices[id].resources.push(resourceName);
      latestServiceId = id;
      changed = true;
    } else {
      activeServices[id] = { ...serviceCatalog[id], id, isLatest: true, resources: resourceName ? [resourceName] : [] };
      latestServiceId = id;
      changed = true;
    }
  }
  if (changed) render();
}

function render() {
  // Keep defs on archSvg, clear only archPan
  archPan.innerHTML = '';
  // Remove old defs
  const oldDefs = archSvg.querySelector('defs');
  if (oldDefs) oldDefs.remove();

  const ids = Object.keys(activeServices);
  if (!ids.length) {
    const t = el('text', {x:500,y:320,'text-anchor':'middle',fill:themeColor('--dim'),'font-size':14,'font-family':'inherit'});
    t.textContent = 'Architecture will appear as services are detected…';
    archPan.appendChild(t);
    return;
  }

  // Marker defs for arrowheads — on archSvg, not archPan, so transforms don't affect them
  const defs = el('defs');
  const colors = new Set(ids.map(id => serviceCatalog[id]?.color).filter(Boolean));
  for (const c of colors) {
    const m = el('marker',{id:'ah'+c.replace('#',''),markerWidth:10,markerHeight:7,refX:9,refY:3.5,orient:'auto',markerUnits:'strokeWidth'});
    m.appendChild(el('polygon',{points:'0 0, 10 3.5, 0 7',fill:c}));
    defs.appendChild(m);
  }
  archSvg.insertBefore(defs, archPan);

  const nW = 140, nH = 64, gX = 30, gY = 20, padL = 30, padT = 50;
  const positions = {};

  // Horizontal layout: rows become columns (left-to-right flow)
  const activeCols = new Set();
  for (const id of ids) { const lp = layout[id]; if (lp) activeCols.add(lp.row); }
  const sortedCols = [...activeCols].sort((a,b) => a - b);
  const colXMap = {};
  sortedCols.forEach((c, i) => { colXMap[c] = padL + i * (nW + gX + 20); });

  // Position nodes: layout.row → x column, layout.col → y position within column
  for (const id of ids) {
    const lp = layout[id];
    if (!lp) continue;
    const x = colXMap[lp.row];
    const y = padT + lp.col * (nH + gY);
    positions[id] = { x, y, w: nW, h: nH };
  }

  // Use row as column grouping for labels
  const sortedRows = sortedCols;

  // Row labels are now part of group boxes

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
    archPan.appendChild(el('path',{d,fill:'none',stroke:col,'stroke-width':1.5,'stroke-opacity':0.5,
      'marker-end':`url(#ah${col.replace('#','')})`,
      'stroke-dasharray':'300','stroke-dashoffset':'300',style:'animation:archDraw 0.8s ease forwards'}));
  }

  // Draw group boxes (dashed borders around services in same column/tier)
  const colGroups = {};
  for (const id of ids) {
    const lp = layout[id];
    if (!lp || !positions[id]) continue;
    const svc = activeServices[id];
    if (svc.skeleton) continue;
    (colGroups[lp.row] ||= []).push(positions[id]);
  }
  for (const [col, posArr] of Object.entries(colGroups)) {
    if (posArr.length < 1) continue;
    const minX = Math.min(...posArr.map(p => p.x)) - 16;
    const maxX = Math.max(...posArr.map(p => p.x)) + nW + 16;
    const minY = Math.min(...posArr.map(p => p.y)) - 28;
    const maxY = Math.max(...posArr.map(p => p.y)) + nH + 16;
    archPan.appendChild(el('rect', {
      x: minX, y: minY, width: maxX - minX, height: maxY - minY, rx: 12,
      fill: 'none', stroke: themeColor('--border'), 'stroke-width': 1, 'stroke-dasharray': '6 4', opacity: 0.6,
    }));
    const label = rowLabels[parseInt(col)] || '';
    if (label) {
      const lt = el('text', { x: minX + 8, y: minY + 12, fill: themeColor('--dim'), 'font-size': 9, 'font-weight': 600, 'letter-spacing': '1', 'font-family': 'inherit' });
      lt.textContent = label;
      archPan.appendChild(lt);
    }
  }

  // Draw service boxes
  for (const id of ids) {
    const p = positions[id];
    if (!p) continue;
    const svc = activeServices[id];
    const cat = serviceCatalog[id];
    const isSkeleton = svc.skeleton;
    const isLatest = svc.isLatest;
    const resources = svc.resources || [];
    const hasResources = resources.length > 0 && !isSkeleton;
    const boxH = hasResources ? nH + resources.length * 14 + 4 : nH;
    const g = el('g',{style: isSkeleton ? '' : 'animation:archFade 0.5s ease; cursor:pointer'});

    if (isLatest) {
      g.appendChild(el('rect',{x:p.x-4,y:p.y-4,width:nW+8,height:boxH+8,rx:12,
        fill:'none',stroke:cat.color,'stroke-width':3,
        style:'animation:archBlink 0.8s ease-in-out infinite'}));
    }

    g.appendChild(el('rect',{
      x:p.x, y:p.y, width:nW, height:boxH, rx:10,
      fill: isSkeleton ? 'none' : themeColor('--surface'),
      stroke: isSkeleton ? themeColor('--border') : cat.color,
      'stroke-width': isLatest ? 2.5 : isSkeleton ? 1 : 2,
      'stroke-dasharray': isSkeleton ? '4 3' : 'none',
      opacity: isSkeleton ? 0.3 : 1,
    }));

    const iconT = el('text',{x:p.x+nW/2,y:p.y+22,'text-anchor':'middle',fill: isSkeleton ? themeColor('--border') : cat.color,'font-size':18,'font-family':'inherit'});
    iconT.textContent = cat.icon;
    g.appendChild(iconT);

    const labelT = el('text',{x:p.x+nW/2,y:p.y+40,'text-anchor':'middle',fill: isSkeleton ? themeColor('--border') : cat.color,'font-size':11,'font-weight':600,'font-family':'inherit'});
    labelT.textContent = cat.label;
    g.appendChild(labelT);

    // Resource names under service label
    if (hasResources) {
      resources.forEach((r, ri) => {
        const rt = el('text',{x:p.x+nW/2,y:p.y+54+ri*14,'text-anchor':'middle',fill:themeColor('--dim'),'font-size':9,'font-family':'inherit'});
        rt.textContent = r.length > 18 ? r.slice(0,17)+'…' : r;
        g.appendChild(rt);
      });
    }

    if (isLatest) {
      const dot = el('text',{x:p.x+nW-8,y:p.y+14,'text-anchor':'middle',fill:cat.color,'font-size':12});
      dot.textContent = '●';
      g.appendChild(dot);
    }

    if (!isSkeleton) g.addEventListener('click', () => showDetail(id));
    archPan.appendChild(g);
  }
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
window.arch = { addCommand, loadSpec, clear() { for (const k in activeServices) delete activeServices[k]; for (const k in serviceCommands) delete serviceCommands[k]; latestServiceId = null; render(); } };
})();
