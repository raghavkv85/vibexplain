// Knowledge Graph — force-directed SVG visualization of entity relationships
(function () {
  const NS = 'http://www.w3.org/2000/svg';

  // --- Data store ---
  const nodes = new Map(); // id -> { id, label, type, degree, community, x, y, vx, vy }
  const edges = [];        // [{ source, target, predicate, inferred }]
  const edgeSet = new Set(); // dedup key "source|predicate|target"
  const nodeCommands = new Map(); // nodeId -> [{ cmd, desc, ts }]

  // Type colors
  const typeColors = {
    agent: '#bc8cff', tool: '#8b949e', file: '#58a6ff', dir: '#3fb950',
    config: '#d29922', package: '#f778ba', vcs: '#d29922', commit: '#8b949e',
    remote: '#f85149', image: '#f778ba', container: '#bc8cff', endpoint: '#f85149',
    service: '#58a6ff', cloud: '#3fb950', infra: '#bc8cff', platform: '#58a6ff',
    runtime: '#d29922', server: '#f85149', k8s: '#58a6ff', repo: '#3fb950', script: '#d29922',
  };

  // Type icons
  const typeIcons = {
    agent: '\u2699', tool: '\u2692', file: '\uD83D\uDCC4', dir: '\uD83D\uDCC1',
    config: '\u2699', package: '\uD83D\uDCE6', vcs: '\uD83D\uDD00', commit: '\uD83D\uDCBE',
    remote: '\u2601', image: '\uD83D\uDC33', container: '\u25B6', endpoint: '\uD83C\uDF10',
    service: '\u2601', cloud: '\u2601', infra: '\u2601', platform: '\uD83D\uDE80',
    runtime: '\u25B6', server: '\uD83D\uDDA5', k8s: '\u2638', repo: '\uD83D\uDCC2', script: '\u25B6',
  };

  // Community palette
  const communityColors = [
    '#58a6ff', '#3fb950', '#d29922', '#f778ba', '#bc8cff',
    '#f85149', '#79c0ff', '#56d364', '#e3b341', '#ff7b72',
  ];

  let svgEl, panGroup;
  let viewX = 0, viewY = 0, zoom = 1;
  let isPanning = false, panStartX = 0, panStartY = 0;
  let W = 800, H = 600;
  let animFrame = null;
  let selectedNode = null;
  let hoveredNode = null;
  let simRunning = false;
  let simCooldown = 0;

  // --- Force simulation parameters ---
  const SIM_ALPHA = 0.3;
  const REPULSION = 800;
  const SPRING_LEN = 120;
  const SPRING_K = 0.02;
  const DAMPING = 0.85;
  const CENTER_PULL = 0.01;

  function ensureNode(n, cmdInfo) {
    if (!nodes.has(n.id)) {
      nodes.set(n.id, {
        ...n, degree: 0, community: -1,
        x: W / 2 + (Math.random() - 0.5) * W * 0.6,
        y: H / 2 + (Math.random() - 0.5) * H * 0.6,
        vx: 0, vy: 0,
      });
    }
    // Track commands per node
    if (cmdInfo) {
      if (!nodeCommands.has(n.id)) nodeCommands.set(n.id, []);
      const list = nodeCommands.get(n.id);
      if (!list.some(c => c.cmd === cmdInfo.cmd)) list.push(cmdInfo);
    }
    return nodes.get(n.id);
  }

  function addTriplets(triplets, cmdInfo) {
    let changed = false;
    for (const t of triplets) {
      const s = ensureNode(t.subject, cmdInfo);
      const o = ensureNode(t.object, cmdInfo);
      const key = `${t.subject.id}|${t.predicate}|${t.object.id}`;
      if (!edgeSet.has(key)) {
        edgeSet.add(key);
        edges.push({ source: t.subject.id, target: t.object.id, predicate: t.predicate, inferred: !!t.inferred });
        s.degree++;
        o.degree++;
        changed = true;
      }
    }
    if (changed) {
      detectCommunities();
      startSimulation();
    }
  }

  // --- Community detection (connected components with label propagation) ---
  function detectCommunities() {
    // Simple: connected components via BFS
    const visited = new Set();
    let cid = 0;
    for (const [id] of nodes) {
      if (visited.has(id)) continue;
      const queue = [id];
      visited.add(id);
      while (queue.length) {
        const cur = queue.shift();
        const node = nodes.get(cur);
        if (node) node.community = cid;
        // Find neighbors
        for (const e of edges) {
          const neighbor = e.source === cur ? e.target : e.target === cur ? e.source : null;
          if (neighbor && !visited.has(neighbor)) {
            visited.add(neighbor);
            queue.push(neighbor);
          }
        }
      }
      cid++;
    }
  }

  // --- Force-directed layout ---
  function simulate() {
    if (!simRunning) return;
    const arr = [...nodes.values()];
    const n = arr.length;
    if (n === 0) { simRunning = false; return; }

    // Repulsion (all pairs)
    for (let i = 0; i < n; i++) {
      for (let j = i + 1; j < n; j++) {
        let dx = arr[j].x - arr[i].x;
        let dy = arr[j].y - arr[i].y;
        let dist = Math.sqrt(dx * dx + dy * dy) || 1;
        const force = REPULSION / (dist * dist);
        const fx = (dx / dist) * force;
        const fy = (dy / dist) * force;
        arr[i].vx -= fx;
        arr[i].vy -= fy;
        arr[j].vx += fx;
        arr[j].vy += fy;
      }
    }

    // Spring attraction (edges)
    for (const e of edges) {
      const s = nodes.get(e.source);
      const t = nodes.get(e.target);
      if (!s || !t) continue;
      let dx = t.x - s.x;
      let dy = t.y - s.y;
      let dist = Math.sqrt(dx * dx + dy * dy) || 1;
      const displacement = dist - SPRING_LEN;
      const force = SPRING_K * displacement;
      const fx = (dx / dist) * force;
      const fy = (dy / dist) * force;
      s.vx += fx;
      s.vy += fy;
      t.vx -= fx;
      t.vy -= fy;
    }

    // Center pull
    for (const node of arr) {
      node.vx += (W / 2 - node.x) * CENTER_PULL;
      node.vy += (H / 2 - node.y) * CENTER_PULL;
    }

    // Integrate
    let totalMovement = 0;
    for (const node of arr) {
      node.vx *= DAMPING;
      node.vy *= DAMPING;
      node.x += node.vx * SIM_ALPHA;
      node.y += node.vy * SIM_ALPHA;
      // Keep in bounds (soft)
      node.x = Math.max(40, Math.min(W - 40, node.x));
      node.y = Math.max(40, Math.min(H - 40, node.y));
      totalMovement += Math.abs(node.vx) + Math.abs(node.vy);
    }

    render();

    simCooldown++;
    if (totalMovement < 0.5 || simCooldown > 300) {
      simRunning = false;
    } else {
      animFrame = requestAnimationFrame(simulate);
    }
  }

  function startSimulation() {
    simCooldown = 0;
    if (!simRunning) {
      simRunning = true;
      animFrame = requestAnimationFrame(simulate);
    }
  }

  // --- Rendering ---
  function render() {
    svgEl = document.getElementById('graph-svg');
    if (!svgEl) return;
    svgEl.innerHTML = '';

    // Defs for arrowheads
    const defs = el('defs');
    const marker = el('marker', { id: 'graph-arrow', viewBox: '0 0 10 6', refX: '10', refY: '3', markerWidth: '8', markerHeight: '6', orient: 'auto-start-reverse' });
    marker.appendChild(el('path', { d: 'M0,0 L10,3 L0,6 Z', fill: themeColor('--dim') }));
    defs.appendChild(marker);
    svgEl.appendChild(defs);

    panGroup = el('g');
    panGroup.setAttribute('transform', `translate(${viewX},${viewY}) scale(${zoom})`);
    svgEl.appendChild(panGroup);

    const blastSet = getBlastRadius(hoveredNode || selectedNode);

    // Draw edges
    for (const e of edges) {
      const s = nodes.get(e.source);
      const t = nodes.get(e.target);
      if (!s || !t) continue;

      const highlighted = blastSet && (blastSet.has(e.source) || blastSet.has(e.target));
      const dimmed = blastSet && !highlighted;
      const edgeColor = dimmed ? themeColor('--border') : themeColor('--dim');

      const g = el('g');
      g.style.opacity = dimmed ? '0.15' : '1';

      // Edge line
      const line = el('line', {
        x1: s.x, y1: s.y, x2: t.x, y2: t.y,
        stroke: edgeColor, 'stroke-width': highlighted ? 2 : 1,
        'marker-end': 'url(#graph-arrow)',
      });
      if (e.inferred) line.setAttribute('stroke-dasharray', '5 3');
      g.appendChild(line);

      // Edge label
      const mx = (s.x + t.x) / 2;
      const my = (s.y + t.y) / 2;
      const label = el('text', {
        x: mx, y: my - 4,
        'text-anchor': 'middle', 'font-size': 9, fill: edgeColor,
        'font-family': 'inherit', 'pointer-events': 'none',
      });
      label.textContent = e.predicate;
      g.appendChild(label);

      panGroup.appendChild(g);
    }

    // Draw nodes
    for (const [id, node] of nodes) {
      const highlighted = blastSet && blastSet.has(id);
      const dimmed = blastSet && !highlighted;
      const isSelected = selectedNode === id;
      const isHovered = hoveredNode === id;
      const radius = nodeRadius(node);
      const color = communityColors[node.community % communityColors.length] || typeColors[node.type] || '#8b949e';

      const g = el('g');
      g.style.opacity = dimmed ? '0.15' : '1';
      g.style.cursor = 'pointer';
      g.dataset.nodeId = id;

      // Glow for selected/hovered
      if (isSelected || isHovered) {
        g.appendChild(el('circle', {
          cx: node.x, cy: node.y, r: radius + 6,
          fill: 'none', stroke: color, 'stroke-width': 2, 'stroke-opacity': 0.4,
        }));
      }

      // Node circle
      g.appendChild(el('circle', {
        cx: node.x, cy: node.y, r: radius,
        fill: themeColor('--surface'), stroke: color,
        'stroke-width': isSelected ? 3 : 2,
      }));

      // Icon
      const icon = el('text', {
        x: node.x, y: node.y + 1,
        'text-anchor': 'middle', 'dominant-baseline': 'middle',
        'font-size': radius * 0.8, 'pointer-events': 'none',
      });
      icon.textContent = typeIcons[node.type] || '\u25CF';
      g.appendChild(icon);

      // Label below
      const label = el('text', {
        x: node.x, y: node.y + radius + 14,
        'text-anchor': 'middle', 'font-size': 10,
        fill: dimmed ? themeColor('--border') : color,
        'font-family': 'inherit', 'font-weight': 600, 'pointer-events': 'none',
      });
      label.textContent = trunc(node.label, 18);
      g.appendChild(label);

      // Degree badge
      if (node.degree > 1) {
        const bx = node.x + radius * 0.7;
        const by = node.y - radius * 0.7;
        g.appendChild(el('circle', { cx: bx, cy: by, r: 8, fill: color }));
        const badge = el('text', {
          x: bx, y: by + 1,
          'text-anchor': 'middle', 'dominant-baseline': 'middle',
          'font-size': 8, fill: themeColor('--bg'), 'font-weight': 700,
          'font-family': 'inherit', 'pointer-events': 'none',
        });
        badge.textContent = node.degree;
        g.appendChild(badge);
      }

      panGroup.appendChild(g);
    }
  }

  function nodeRadius(node) {
    return Math.max(16, Math.min(36, 14 + node.degree * 3));
  }

  // --- Blast radius: BFS from a node ---
  function getBlastRadius(nodeId) {
    if (!nodeId) return null;
    const visited = new Set([nodeId]);
    const queue = [nodeId];
    while (queue.length) {
      const cur = queue.shift();
      for (const e of edges) {
        const neighbor = e.source === cur ? e.target : e.target === cur ? e.source : null;
        if (neighbor && !visited.has(neighbor)) {
          visited.add(neighbor);
          queue.push(neighbor);
        }
      }
    }
    return visited;
  }

  // --- Interaction ---
  function initInteractions() {
    const container = document.getElementById('graph-view');
    if (!container) return;

    // Zoom controls
    const controls = document.createElement('div');
    controls.className = 'zoom-controls';
    controls.innerHTML = '<button class="zoom-btn" data-action="in">+</button><button class="zoom-btn" data-action="out">\u2212</button><button class="zoom-btn" data-action="reset">\u2302</button>';
    container.appendChild(controls);
    controls.addEventListener('click', (e) => {
      const action = e.target.dataset.action;
      if (action === 'in') setZoom(zoom * 1.3);
      else if (action === 'out') setZoom(zoom / 1.3);
      else if (action === 'reset') { zoom = 1; viewX = 0; viewY = 0; render(); }
    });

    // Scroll zoom
    container.addEventListener('wheel', (e) => {
      e.preventDefault();
      setZoom(zoom * (e.deltaY > 0 ? 0.9 : 1.1));
    }, { passive: false });

    // Drag pan
    container.addEventListener('mousedown', (e) => {
      if (e.target.closest('.zoom-controls') || e.target.closest('.detail-overlay')) return;
      // Check if clicking a node
      const nodeG = e.target.closest('[data-node-id]');
      if (nodeG) {
        const id = nodeG.dataset.nodeId;
        selectedNode = selectedNode === id ? null : id;
        showDetail(selectedNode);
        render();
        return;
      }
      isPanning = true; panStartX = e.clientX; panStartY = e.clientY;
      container.style.cursor = 'grabbing';
    });
    window.addEventListener('mousemove', (e) => {
      if (!isPanning) return;
      viewX += (e.clientX - panStartX) / zoom;
      viewY += (e.clientY - panStartY) / zoom;
      panStartX = e.clientX; panStartY = e.clientY;
      render();
    });
    window.addEventListener('mouseup', () => {
      isPanning = false;
      const container = document.getElementById('graph-view');
      if (container) container.style.cursor = 'grab';
    });
    container.style.cursor = 'grab';

    // Hover for blast radius
    container.addEventListener('mouseover', (e) => {
      const nodeG = e.target.closest('[data-node-id]');
      const newHovered = nodeG ? nodeG.dataset.nodeId : null;
      if (newHovered !== hoveredNode) {
        hoveredNode = newHovered;
        render();
      }
    });
    container.addEventListener('mouseout', (e) => {
      if (!e.target.closest('[data-node-id]') && hoveredNode) {
        hoveredNode = null;
        render();
      }
    });
  }

  function setZoom(newZoom) {
    zoom = Math.max(0.2, Math.min(3, newZoom));
    render();
  }

  // --- Detail overlay ---
  function showDetail(nodeId) {
    const container = document.getElementById('graph-view');
    const existing = container.querySelector('.detail-overlay');
    if (existing) existing.remove();
    if (!nodeId) return;

    const node = nodes.get(nodeId);
    if (!node) return;

    const cmds = nodeCommands.get(nodeId) || [];
    const connections = edges.filter(e => e.source === nodeId || e.target === nodeId);
    const color = communityColors[node.community % communityColors.length] || typeColors[node.type] || '#8b949e';

    const overlay = document.createElement('div');
    overlay.className = 'detail-overlay';
    let html = `<button class="detail-close">\u00D7</button>`;
    html += `<div class="detail-icon">${typeIcons[node.type] || '\u25CF'}</div>`;
    html += `<div class="detail-title" style="color:${color}">${esc(node.label)}</div>`;
    html += `<div class="detail-sub">${node.type} \u00B7 ${node.degree} connections \u00B7 community ${node.community}</div>`;

    if (connections.length) {
      html += `<div class="detail-section">Relationships</div>`;
      for (const c of connections) {
        const otherId = c.source === nodeId ? c.target : c.source;
        const other = nodes.get(otherId);
        const dir = c.source === nodeId ? '\u2192' : '\u2190';
        html += `<div class="detail-conn">${dir} <strong>${c.predicate}</strong> <span>${esc(other?.label || otherId)}</span></div>`;
      }
    }

    if (cmds.length) {
      html += `<div class="detail-section">Commands</div>`;
      for (const c of cmds) {
        html += `<div class="detail-event"><div class="detail-cmd">${esc(c.cmd)}</div>`;
        if (c.desc) html += `<div class="detail-desc">${esc(c.desc)}</div>`;
        html += `</div>`;
      }
    }

    overlay.innerHTML = html;
    container.appendChild(overlay);

    overlay.querySelector('.detail-close').addEventListener('click', () => {
      selectedNode = null;
      overlay.remove();
      render();
    });
  }

  // --- Stats bar ---
  function renderStats() {
    let statsEl = document.getElementById('graph-stats');
    if (!statsEl) return;
    const nodeCount = nodes.size;
    const edgeCount = edges.length;
    const communities = new Set([...nodes.values()].map(n => n.community)).size;
    statsEl.textContent = `${nodeCount} entities \u00B7 ${edgeCount} relationships \u00B7 ${communities} clusters`;
  }

  // --- Public API ---
  function addEvent(event) {
    if (!event.triplets || !event.triplets.length) return;
    const cmdInfo = {
      cmd: event.raw || event.explanation?.[0]?.command || '',
      desc: event.explanation?.[0]?.summary || '',
      ts: event.ts,
    };
    addTriplets(event.triplets, cmdInfo);
    renderStats();
  }

  // --- Helpers ---
  function el(tag, attrs = {}) {
    const e = document.createElementNS(NS, tag);
    for (const [k, v] of Object.entries(attrs)) e.setAttribute(k, v);
    return e;
  }
  function trunc(s, max) {
    return s && s.length > max ? s.slice(0, max - 1) + '\u2026' : (s || '');
  }
  function esc(s) { const d = document.createElement('div'); d.textContent = s; return d.innerHTML; }

  // --- Init ---
  function init() {
    const container = document.getElementById('graph-view');
    if (!container) return;
    const svgCheck = document.getElementById('graph-svg');
    if (svgCheck) {
      W = container.clientWidth || 800;
      H = container.clientHeight || 600;
    }
    initInteractions();
    // Handle resize
    window.addEventListener('resize', () => {
      W = container.clientWidth || 800;
      H = container.clientHeight || 600;
      render();
    });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();

  window.knowledgeGraph = { addEvent };
})();
