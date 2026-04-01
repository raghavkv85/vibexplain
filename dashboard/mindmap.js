// Branching mind map — collapsed summary cards per category
(function() {
const NS = 'http://www.w3.org/2000/svg';

const categories = {
  'Project Setup':  { tools: ['mkdir', 'touch', 'cp', 'mv', 'rm', 'chmod', 'ln', 'tar', 'find'], color: '#58a6ff', icon: '📁' },
  'Package Mgmt':   { tools: ['npm', 'npx', 'pip', 'pip3', 'cargo', 'brew', 'yarn', 'pnpm', 'gem', 'bundler', 'go'], color: '#3fb950', icon: '📦' },
  'Version Control': { tools: ['git'], color: '#d29922', icon: '🔀' },
  'Containers':     { tools: ['docker', 'kubectl'], color: '#f778ba', icon: '🐳' },
  'Infrastructure': { tools: ['terraform', 'aws', 'gcloud', 'az', 'ssh', 'scp'], color: '#bc8cff', icon: '☁️' },
  'Run & Execute':  { tools: ['node', 'python', 'python3', 'curl', 'wget', 'make', 'cmake', 'ruby'], color: '#f85149', icon: '🚀' },
  'Platforms':      { tools: ['vercel', 'netlify', 'firebase', 'fly', 'flyctl', 'railway', 'heroku', 'supabase'], color: '#58a6ff', icon: '🌐' },
};

const branches = {}; // { category: [{ id, cmd, summary, key }] }
let svgEl, panGroup;
let expandedCat = null; // which category is expanded

// Zoom/pan state
let viewX = 0, viewY = 0, zoom = 1;
let isPanning = false, panStartX = 0, panStartY = 0;

function categorize(cmd) {
  const tool = cmd.split(/\s+/)[0];
  for (const [cat, def] of Object.entries(categories)) {
    if (def.tools.includes(tool)) return cat;
  }
  return 'Other';
}

function setZoom(newZoom) {
  zoom = Math.max(0.2, Math.min(3, newZoom));
  applyTransform();
}

function initZoomPan() {
  const container = document.getElementById('mindmap-view');
  const controls = document.createElement('div');
  controls.className = 'zoom-controls';
  controls.innerHTML = '<button class="zoom-btn" data-action="in">+</button><button class="zoom-btn" data-action="out">−</button><button class="zoom-btn" data-action="reset">⌂</button>';
  container.appendChild(controls);
  controls.addEventListener('click', (e) => {
    const action = e.target.dataset.action;
    if (action === 'in') setZoom(zoom * 1.3);
    else if (action === 'out') setZoom(zoom / 1.3);
    else if (action === 'reset') { zoom = 1; viewX = 0; viewY = 0; applyTransform(); }
  });
  container.addEventListener('wheel', (e) => {
    e.preventDefault();
    setZoom(zoom * (e.deltaY > 0 ? 0.9 : 1.1));
  }, { passive: false });
  container.addEventListener('mousedown', (e) => {
    if (e.target.closest('.zoom-controls')) return;
    isPanning = true; panStartX = e.clientX; panStartY = e.clientY;
    container.style.cursor = 'grabbing';
  });
  window.addEventListener('mousemove', (e) => {
    if (!isPanning) return;
    viewX += (e.clientX - panStartX) / zoom;
    viewY += (e.clientY - panStartY) / zoom;
    panStartX = e.clientX; panStartY = e.clientY;
    applyTransform();
  });
  window.addEventListener('mouseup', () => {
    isPanning = false;
    document.getElementById('mindmap-view').style.cursor = 'grab';
  });
  container.style.cursor = 'grab';
}

function applyTransform() {
  if (panGroup) panGroup.setAttribute('transform', `translate(${viewX},${viewY}) scale(${zoom})`);
}

function el(tag, attrs = {}) {
  const e = document.createElementNS(NS, tag);
  for (const [k, v] of Object.entries(attrs)) e.setAttribute(k, v);
  return e;
}
function trunc(s, max) { return s && s.length > max ? s.slice(0, max - 1) + '…' : (s || ''); }

// Extract a short "key item" from a command for the summary
function extractKey(cmd, summary) {
  // Try to pull a meaningful name from the summary
  const quoted = summary.match(/'([^']+)'/);
  if (quoted) return quoted[1];
  // Fall back to last meaningful token
  const parts = cmd.split(/\s+/).filter(t => !t.startsWith('-') && t.length > 1);
  return parts[parts.length - 1] || cmd.split(/\s+/)[0];
}

function addNode(event) {
  const exp = event.explanation[0];
  const cat = categorize(exp.command);
  if (!branches[cat]) branches[cat] = [];
  branches[cat].push({
    id: event.id,
    cmd: exp.command,
    summary: exp.summary || exp.action || exp.toolDesc,
    key: extractKey(exp.command, exp.summary || ''),
  });
  render();
}

function render() {
  svgEl = document.getElementById('mindmap');
  svgEl.innerHTML = '';
  panGroup = el('g');
  svgEl.appendChild(panGroup);
  applyTransform();

  const W = svgEl.parentElement.clientWidth || 800;
  const H = svgEl.parentElement.clientHeight || 600;
  const cx = W / 2, cy = H / 2;
  svgEl.setAttribute('viewBox', `0 0 ${W} ${H}`);

  const cats = Object.keys(branches);
  if (!cats.length) return;

  // Center node
  const cg = el('g');
  cg.append(
    el('circle', { cx, cy, r: 30, fill: themeColor('--surface'), stroke: '#bc8cff', 'stroke-width': 2.5 }),
    (() => { const t = el('text', { x: cx, y: cy + 1, 'text-anchor': 'middle', 'dominant-baseline': 'middle', fill: '#bc8cff', 'font-size': 11, 'font-weight': 600, 'font-family': 'inherit' }); t.textContent = '⚡ build'; return t; })()
  );
  panGroup.appendChild(cg);

  const angleStep = (2 * Math.PI) / Math.max(cats.length, 1);
  const radius = Math.min(W, H) * 0.3;

  cats.forEach((cat, i) => {
    const angle = angleStep * i - Math.PI / 2;
    const catDef = categories[cat] || { color: '#8b949e', icon: '•' };
    const color = catDef.color;
    const nodes = branches[cat];
    const isExpanded = expandedCat === cat;

    const bx = cx + Math.cos(angle) * radius;
    const by = cy + Math.sin(angle) * radius;

    // Line from center to card
    panGroup.appendChild(el('line', { x1: cx, y1: cy, x2: bx, y2: by, stroke: color, 'stroke-width': 2, 'stroke-opacity': 0.5 }));

    // Summary card
    const keyItems = [...new Set(nodes.map(n => n.key))].slice(0, 3);
    const cardW = 200, lineH = 16;
    const expandedH = isExpanded ? nodes.length * lineH + 8 : 0;
    const cardH = 58 + expandedH;

    const g = el('g');
    g.style.cursor = 'pointer';

    // Card background
    g.appendChild(el('rect', {
      x: bx - cardW / 2, y: by - 29, width: cardW, height: cardH, rx: 10,
      fill: themeColor('--surface'), stroke: color, 'stroke-width': 2,
    }));

    // Icon + category + count
    const header = el('text', { x: bx - cardW / 2 + 12, y: by - 8, fill: color, 'font-size': 12, 'font-weight': 700, 'font-family': 'inherit' });
    header.textContent = `${catDef.icon} ${cat}`;
    g.appendChild(header);

    // Count badge
    const badge = el('text', { x: bx + cardW / 2 - 12, y: by - 8, 'text-anchor': 'end', fill: themeColor('--dim'), 'font-size': 11, 'font-family': 'inherit' });
    badge.textContent = `${nodes.length}`;
    g.appendChild(badge);

    // Key items preview
    const preview = el('text', { x: bx - cardW / 2 + 12, y: by + 10, fill: themeColor('--dim'), 'font-size': 10, 'font-family': 'inherit' });
    preview.textContent = trunc(keyItems.join(', '), 28);
    g.appendChild(preview);

    // Expand indicator
    const arrow = el('text', { x: bx, y: by + 24, 'text-anchor': 'middle', fill: themeColor('--dim'), 'font-size': 9, 'font-family': 'inherit' });
    arrow.textContent = isExpanded ? '▲ collapse' : '▼ expand';
    g.appendChild(arrow);

    // Expanded detail
    if (isExpanded) {
      nodes.forEach((node, ni) => {
        const ty = by + 40 + ni * lineH;
        const t = el('text', { x: bx - cardW / 2 + 14, y: ty, fill: themeColor('--text'), 'font-size': 10, 'font-family': 'inherit' });
        t.textContent = trunc(node.summary, 30);
        g.appendChild(t);
      });
    }

    g.addEventListener('click', (e) => {
      e.stopPropagation();
      expandedCat = expandedCat === cat ? null : cat;
      render();
    });

    panGroup.appendChild(g);
  });
}

initZoomPan();
render();

window.mindmap = { addNode, clear() { for (const k in branches) delete branches[k]; expandedCat = null; render(); } };
})();
