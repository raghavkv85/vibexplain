// Branching mind map — groups commands into category branches radiating from center
(function() {
const NS = 'http://www.w3.org/2000/svg';

const categories = {
  'Project Setup':  { tools: ['mkdir', 'touch', 'cp', 'mv', 'rm', 'chmod', 'ln', 'tar', 'find'], color: '#58a6ff' },
  'Package Mgmt':   { tools: ['npm', 'npx', 'pip', 'pip3', 'cargo', 'brew', 'yarn', 'pnpm', 'gem', 'bundler', 'go'], color: '#3fb950' },
  'Version Control': { tools: ['git'], color: '#d29922' },
  'Containers':     { tools: ['docker', 'kubectl'], color: '#f778ba' },
  'Infrastructure': { tools: ['terraform', 'aws', 'ssh', 'scp'], color: '#bc8cff' },
  'Run & Execute':  { tools: ['node', 'python', 'python3', 'curl', 'wget', 'make', 'cmake', 'ruby'], color: '#f85149' },
  'Text & Search':  { tools: ['grep', 'sed', 'awk', 'cat', 'head', 'tail', 'wc', 'sort', 'uniq'], color: '#d29922' },
};

function categorize(cmd) {
  const tool = cmd.split(/\s+/)[0];
  for (const [cat, def] of Object.entries(categories)) {
    if (def.tools.includes(tool)) return cat;
  }
  return 'Other';
}

// State
const branches = {}; // { category: [{ id, cmd, desc, artifacts }] }
let svgEl, panGroup;
let latestNodeId = null;

// Zoom/pan state
let viewX = 0, viewY = 0, zoom = 1;
let isPanning = false, panStartX = 0, panStartY = 0;

function setZoom(newZoom) {
  zoom = Math.max(0.2, Math.min(3, newZoom));
  applyTransform();
}

function initZoomPan() {
  const container = document.getElementById('mindmap-view');

  // Zoom buttons
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

  // Scroll zoom
  container.addEventListener('wheel', (e) => {
    e.preventDefault();
    setZoom(zoom * (e.deltaY > 0 ? 0.9 : 1.1));
  }, { passive: false });

  // Drag pan
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
    container.style.cursor = 'grab';
  });
  container.style.cursor = 'grab';
}

function applyTransform() {
  if (panGroup) panGroup.setAttribute('transform', `translate(${viewX},${viewY}) scale(${zoom})`);
}

function addNode(event) {
  const exp = event.explanation[0];
  const cat = categorize(exp.command);
  if (!branches[cat]) branches[cat] = [];
  branches[cat].push({
    id: event.id,
    cmd: trunc(exp.command, 30),
    desc: trunc(exp.action || exp.toolDesc, 36),
    artifacts: (event.artifacts || []).slice(0, 3),
  });
  latestNodeId = event.id;
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
  const cx = W / 2;
  const cy = H / 2;
  svgEl.setAttribute('viewBox', `0 0 ${W} ${H}`);

  const cats = Object.keys(branches);
  if (!cats.length) return;

  drawCenterNode(cx, cy);

  const angleStep = (2 * Math.PI) / Math.max(cats.length, 1);
  const branchRadius = Math.min(W, H) * 0.28;

  cats.forEach((cat, i) => {
    const angle = angleStep * i - Math.PI / 2;
    const bx = cx + Math.cos(angle) * branchRadius;
    const by = cy + Math.sin(angle) * branchRadius;
    const color = (categories[cat]?.color) || '#8b949e';

    drawLine(cx, cy, bx, by, color, 2);
    drawBranchLabel(bx, by, cat, color);

    const nodes = branches[cat];
    const nodeSpacing = 70;

    nodes.forEach((node, ni) => {
      const dist = branchRadius + 60 + ni * nodeSpacing;
      const nx = cx + Math.cos(angle) * dist;
      const ny = cy + Math.sin(angle) * dist;

      const prevDist = ni === 0 ? branchRadius : branchRadius + 60 + (ni - 1) * nodeSpacing;
      const px = cx + Math.cos(angle) * prevDist;
      const py = cy + Math.sin(angle) * prevDist;
      const isLatest = node.id === latestNodeId;
      drawLine(px, py, nx, ny, color, 1.5, isLatest);
      drawNode(nx, ny, node, color, isLatest);
    });
  });
}

function drawCenterNode(cx, cy) {
  const g = el('g');
  g.append(
    el('circle', { cx, cy, r: 32, fill: themeColor('--surface'), stroke: '#bc8cff', 'stroke-width': 2.5 }),
    (() => { const t = el('text', { x: cx, y: cy + 1, 'text-anchor': 'middle', 'dominant-baseline': 'middle', fill: '#bc8cff', 'font-size': 11, 'font-weight': 600, 'font-family': 'inherit' }); t.textContent = '⚡ build'; return t; })()
  );
  panGroup.appendChild(g);
}

function drawBranchLabel(x, y, label, color) {
  const g = el('g');
  const t = el('text', { x, y: y + 1, 'text-anchor': 'middle', 'dominant-baseline': 'middle', fill: color, 'font-size': 11, 'font-weight': 600, 'font-family': 'inherit' });
  t.textContent = label;
  g.append(el('rect', { x: x - 56, y: y - 14, width: 112, height: 28, rx: 14, fill: themeColor('--surface'), stroke: color, 'stroke-width': 2 }), t);
  panGroup.appendChild(g);
}

function drawNode(x, y, node, color, isLatest) {
  const g = el('g');
  if (isLatest) {
    g.style.opacity = '0';
    g.style.transition = 'opacity 0.4s ease, transform 0.4s ease';
    g.style.transform = 'translateY(10px)';
    requestAnimationFrame(() => { g.style.opacity = '1'; g.style.transform = 'translateY(0)'; });
  }

  const h = 44 + node.artifacts.length * 16;
  const w = 220;

  g.appendChild(el('rect', {
    x: x - w / 2, y: y - h / 2, width: w, height: h, rx: 8,
    fill: themeColor('--surface'), stroke: isLatest ? color : themeColor('--border'), 'stroke-width': isLatest ? 2 : 1.5,
  }));

  const cmd = el('text', { x: x - w / 2 + 10, y: y - h / 2 + 18, fill: color, 'font-size': 12, 'font-weight': 600, 'font-family': 'inherit' });
  cmd.textContent = node.cmd;
  g.appendChild(cmd);

  const desc = el('text', { x: x - w / 2 + 10, y: y - h / 2 + 34, fill: '#8b949e', 'font-size': 10, 'font-family': 'inherit' });
  desc.textContent = node.desc;
  g.appendChild(desc);

  node.artifacts.forEach((a, i) => {
    const at = el('text', { x: x - w / 2 + 10, y: y - h / 2 + 50 + i * 16, fill: '#3fb950', 'font-size': 10, 'font-family': 'inherit' });
    at.textContent = `${a.icon} ${a.name}`;
    g.appendChild(at);
  });

  panGroup.appendChild(g);
}

function drawLine(x1, y1, x2, y2, color, width, dashed) {
  const attrs = { x1, y1, x2, y2, stroke: color, 'stroke-width': width, 'stroke-opacity': 0.6 };
  if (dashed) attrs['stroke-dasharray'] = '6 3';
  panGroup.appendChild(el('line', attrs));
}

function el(tag, attrs = {}) {
  const e = document.createElementNS(NS, tag);
  for (const [k, v] of Object.entries(attrs)) e.setAttribute(k, v);
  return e;
}

function trunc(s, max) {
  return s && s.length > max ? s.slice(0, max - 1) + '…' : (s || '');
}

// Init zoom/pan once DOM is ready
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', initZoomPan);
else initZoomPan();

window.mindmap = { addNode };
})();
