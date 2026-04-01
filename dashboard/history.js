// Session selector — dropdown in header, replays past sessions into all views
(function() {
const select = document.getElementById('session-select');
const narrative = document.getElementById('narrative');
const narrativeHeading = document.querySelector('#narrative-panel h2');

function esc(s) { const d = document.createElement('div'); d.textContent = s; return d.innerHTML; }
function fmtDateTime(ts) {
  const d = new Date(ts);
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) +
    ' ' + d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
}

// Populate dropdown with past sessions
async function loadSessionList() {
  try {
    const sessions = await (await fetch('/api/sessions')).json();
    for (const s of sessions) {
      const opt = document.createElement('option');
      opt.value = s.id;
      opt.textContent = fmtDateTime(s.started) + ' (' + s.count + ' cmds)';
      select.appendChild(opt);
    }
  } catch { /* no sessions yet */ }
}

// When user picks a past session, replay its events into all views
select.addEventListener('change', async () => {
  const id = select.value;
  if (id === 'live') {
    narrativeHeading.textContent = "What's happening";
    // Reconnect to live — reload page is simplest
    location.reload();
    return;
  }

  // Load session data
  let data;
  try { data = await (await fetch(`/api/session/${id}`)).json(); } catch { return; }
  if (!data?.events?.length) return;

  narrativeHeading.textContent = 'What happened — ' + fmtDateTime(data.started);

  // Clear all views
  window.mindmap.clear();
  window.arch.clear();
  window.knowledgeGraph.clear();
  narrative.innerHTML = '';

  // Replay events into all views
  for (const event of data.events) {
    window.mindmap.addNode(event);
    window.arch.addCommand(event);
    window.knowledgeGraph.addEvent(event);

    // Render narrative entry
    const entry = document.createElement('div');
    entry.className = 'narr-entry';
    const exp = event.explanation?.[0];
    if (!exp) continue;
    let html = `<div class="time">${new Date(event.ts).toLocaleTimeString()}</div>`;
    html += `<div class="cmd-ref">${esc(exp.command)}</div>`;
    html += `<div class="text">${esc(exp.summary)}</div>`;
    if (event.artifacts?.length) {
      html += `<div class="artifacts-narr">${event.artifacts.map(a => `${a.icon} ${esc(a.name)}`).join(' · ')}</div>`;
    }
    entry.innerHTML = html;
    narrative.appendChild(entry);
  }
});

loadSessionList();
})();
