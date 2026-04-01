// Theme toggle
(function(){
  const btn=document.getElementById('theme-toggle');
  const saved=localStorage.getItem('vibexplain-theme');
  if(saved==='light'){document.documentElement.setAttribute('data-theme','light');btn.textContent='☀️';}
  btn.addEventListener('click',()=>{
    const isLight=document.documentElement.getAttribute('data-theme')==='light';
    if(isLight){document.documentElement.removeAttribute('data-theme');btn.textContent='🌙';}
    else{document.documentElement.setAttribute('data-theme','light');btn.textContent='☀️';}
    localStorage.setItem('vibexplain-theme',isLight?'dark':'light');
  });
})();

// Resizable divider
(function(){
  const divider=document.getElementById('divider'), main=document.querySelector('main');
  let dragging=false;
  divider.addEventListener('mousedown',()=>{dragging=true;divider.classList.add('active');document.body.style.cursor='col-resize';document.body.style.userSelect='none';});
  window.addEventListener('mousemove',e=>{if(!dragging)return;const rect=main.getBoundingClientRect();const rightW=Math.max(200,Math.min(rect.width-300,rect.right-e.clientX));main.style.gridTemplateColumns=`1fr 4px ${rightW}px`;});
  window.addEventListener('mouseup',()=>{dragging=false;divider.classList.remove('active');document.body.style.cursor='';document.body.style.userSelect='';});
})();

const narrative = document.getElementById('narrative');
const statusEl = document.getElementById('status');

const emptyNarrative = `<div class="empty-state">The story of your build<br>will appear here</div>`;

narrative.innerHTML = emptyNarrative;

let firstCommand = true;
let ws;

// Tab switching
document.querySelectorAll('.toolbar .tab').forEach(tab => {
  tab.addEventListener('click', () => {
    document.querySelectorAll('.toolbar .tab').forEach(t => t.classList.remove('active'));
    tab.classList.add('active');
    document.querySelectorAll('.panel-view').forEach(v => v.classList.remove('active'));
    document.getElementById(tab.dataset.panel + '-view').classList.add('active');
  });
});

function connect() {
  ws = new WebSocket(`ws://${location.host}/ws`);
  ws.onopen = () => { statusEl.textContent = 'live'; statusEl.className = 'status connected'; };
  ws.onclose = () => { statusEl.textContent = 'disconnected'; statusEl.className = 'status'; setTimeout(connect, 2000); };
  ws.onmessage = (e) => {
    const event = JSON.parse(e.data);
    if (event.type === 'plan') { window.arch.loadSpec(event); return; }
    if (firstCommand) { narrative.innerHTML = ''; firstCommand = false; }
    renderNarrative(event);
    window.mindmap.addNode(event);
    window.arch.addCommand(event);
    window.knowledgeGraph.addEvent(event);
  };
}

function renderNarrative(event) {
  const entry = document.createElement('div');
  entry.className = 'narr-entry';
  const summaries = event.explanation.map(e => e.summary);
  const cmdRef = event.explanation.map(e => e.command).join(' → ');
  let html = `<div class="time">${fmtTime(event.ts)}</div>`;
  html += `<div class="cmd-ref">${esc(cmdRef)}</div>`;
  html += `<div class="text">${summaries.map(s => esc(s)).join('<br>')}</div>`;
  if (event.artifacts?.length) {
    html += `<div class="artifacts-narr">${event.artifacts.map(a => `${a.icon} ${esc(a.name)}`).join(' · ')}</div>`;
  }
  entry.innerHTML = html;
  narrative.appendChild(entry);
  narrative.scrollTop = narrative.scrollHeight;
}

function fmtTime(ts) { return new Date(ts).toLocaleTimeString(); }
function esc(s) { const d = document.createElement('div'); d.textContent = s; return d.innerHTML; }

connect();
