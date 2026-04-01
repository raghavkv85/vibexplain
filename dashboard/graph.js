// Dependencies view — clean table replacing the knowledge graph
(function() {
const container = document.getElementById('graph-view');
const rows = [];
const seen = new Set();

function esc(s) { const d = document.createElement('div'); d.textContent = s; return d.innerHTML; }

const typeIcons = {
  package: '📦', cloud: '☁️', service: '⚙️', image: '🐳', container: '▶️',
  endpoint: '🌐', infra: '🏗️', platform: '🚀', config: '📄', server: '🖥️',
};

function render() {
  if (!rows.length) {
    container.innerHTML = '<div class="dep-empty">Dependencies will appear as commands stream in…</div>';
    return;
  }

  let html = '<table class="dep-table"><thead><tr><th>Entity</th><th>Type</th><th>Relationship</th><th>Connected To</th></tr></thead><tbody>';
  for (const r of rows) {
    const icon = typeIcons[r.objType] || '•';
    const connIcon = typeIcons[r.subjType] || '•';
    html += `<tr>`;
    html += `<td class="dep-entity">${icon} ${esc(r.object)}</td>`;
    html += `<td class="dep-type">${esc(r.objType)}</td>`;
    html += `<td class="dep-rel">${esc(r.predicate)}</td>`;
    html += `<td class="dep-conn">${connIcon} ${esc(r.subject)}</td>`;
    html += `</tr>`;
  }
  html += '</tbody></table>';
  container.innerHTML = html;
}

function addEvent(event) {
  if (!event.triplets?.length) return;
  for (const t of event.triplets) {
    const key = `${t.subject.id}|${t.predicate}|${t.object.id}`;
    if (seen.has(key)) continue;
    seen.add(key);
    rows.push({
      subject: t.subject.label, subjType: t.subject.type,
      predicate: t.predicate.replace(/-/g, ' '),
      object: t.object.label, objType: t.object.type,
    });
  }
  render();
}

function clear() { rows.length = 0; seen.clear(); render(); }

render();
window.knowledgeGraph = { addEvent, clear };
})();
