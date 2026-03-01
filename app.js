let cantanti = [];
let serate = [];
let voti = {};
let top5 = {};
let top5Info = {};
let classificaFinale = [];

let currentSerata = 1;
let showTop5 = false;
let showClassifica = false;

/* ── INIT ── */
fetch('data.json')
  .then(r => r.json())
  .then(data => {
    cantanti        = data.cantanti;
    serate          = data.serate;
    voti            = data.voti;
    top5            = data.top5;
    top5Info        = data.top5Info;
    classificaFinale = data.classificaFinale || [];
    render();
  });

/* ── COLOR MAP ── */
function cc(c) {
  return {
    'rosso':        'voto-rosso',
    'verde-chiaro': 'voto-verde-chiaro',
    'verde':        'voto-verde',
    'grigio':       'voto-grigio',
    'giallo':       'voto-giallo'
  }[c] || 'voto-nd';
}

/* ── RENDER NAV ── */
function renderNav() {
  document.getElementById('serateNav').innerHTML =
    serate.map(s =>
      `<button class="serata-btn ${!showTop5 && !showClassifica && currentSerata === s.n ? 'active' : ''}"
               onclick="selectSerata(${s.n})">${s.label}</button>`
    ).join('') +
    `<button class="top5-btn ${showTop5 ? 'active' : ''}" onclick="toggleTop5()">🏆 Top 5 Serate</button>` +
    `<button class="classifica-btn ${showClassifica ? 'active' : ''}" onclick="toggleClassifica()">🎖️ Classifica Finale</button>`;
}

/* ── RENDER TITLE ── */
function renderTitle() {
  const s = serate[currentSerata - 1];
  document.getElementById('serataTitle').innerHTML = (showTop5 || showClassifica) ? '' :
    `<h2><span>${s.label}</span> — ${s.data}</h2><p>Valutazioni medie della nostra giuria</p>`;
}

/* ── RENDER GRID ── */
function renderGrid() {
  const grid = document.getElementById('cantantiGrid');
  if (showTop5 || showClassifica) { grid.innerHTML = ''; return; }

  grid.innerHTML = cantanti.map((c, i) => {
    const vd    = voti[c.num] && voti[c.num][currentSerata];
    const badge = vd
      ? `<div class="voto-badge ${cc(vd.c)}">${vd.v}</div>`
      : `<div class="voto-badge voto-nd">–</div>`;
    const m = c.migliore && c.migliore[currentSerata];

    return `
      <div class="cantante-card ${m ? 'migliore' : ''} ${!vd ? 'no-voto' : ''}"
           style="animation-delay:${i * 0.03}s"
           onclick="openModal(${c.num})">
        <div class="num-badge">${c.num}</div>
        <div class="cantante-info">
          <div class="cantante-nome ${m ? 'migliore-testo' : ''}">${c.nome}</div>
          <div class="cantante-canzone">${c.canzone}</div>
        </div>
        ${badge}
      </div>`;
  }).join('');
}

/* ── RENDER TOP 5 ── */
function renderTop5() {
  const section = document.getElementById('top5Section');
  if (!showTop5) { section.style.display = 'none'; return; }
  section.style.display = 'block';

  section.innerHTML = `
    <div class="top5-header">
      <h2>Top <span>5</span> Serate</h2>
      <p>Sala stampa Sanremo • Confronto con il nostro voto</p>
    </div>
    ${serate.map(s => {
      const items = top5[s.n];
      const info  = top5Info[s.n] || {};
      const isTop10 = s.n === 4;
      return `
        <div class="top5-serata">
          <div class="top5-serata-title">🎤 ${s.label} — ${s.data}${isTop10 ? ' <span class="top10-badge">TOP 10</span>' : ''}</div>
          <div class="top5-items">
            ${items.length > 0
              ? items.map((nome, i) => {
                  const d = info[nome];
                  return `
                    <div class="top5-item" style="animation-delay:${i * 0.06}s">
                      <div class="top5-rank">${i + 1}</div>
                      <div class="top5-nome">${nome}</div>
                      ${d ? `
                        <div class="top5-item-meta">
                          <span class="match-pill ${d.match ? 'match-yes' : 'match-no'}">
                            ${d.match ? '✓ Concordiamo' : '✗ Divergiamo'}
                          </span>
                          <span class="top5-nota">${d.nota}</span>
                        </div>` : ''}
                    </div>`;
                }).join('')
              : `<div class="top5-item nd">
                   <div class="top5-rank" style="color:rgba(255,255,255,0.15)">—</div>
                   <div class="top5-nome">Dati non ancora disponibili</div>
                 </div>`
            }
          </div>
        </div>`;
    }).join('')}`;
}

/* ── RENDER CLASSIFICA ── */
function renderClassifica() {
  const section = document.getElementById('classificaSection');
  if (!showClassifica) { section.style.display = 'none'; return; }
  section.style.display = 'block';

  const medalIcons = { 1: '🥇', 2: '🥈', 3: '🥉' };

  section.innerHTML = `
    <div class="top5-header">
      <h2>Classifica <span>Finale</span></h2>
      <p>76° Festival di Sanremo 2026 • Classifica ufficiale</p>
    </div>
    <div class="classifica-items">
      ${classificaFinale.map(item => {
        const cantante = cantanti.find(c => c.nome === item.nome);
        const votoMedio = cantante ? calcolaMedia(cantante.num) : null;
        const medal = medalIcons[item.pos] || '';
        const topClass = item.pos <= 3 ? 'classifica-podio' : item.pos <= 10 ? 'classifica-top10' : '';
        return `
          <div class="classifica-item ${topClass}" style="animation-delay:${(item.pos-1) * 0.03}s">
            <div class="classifica-rank">${medal || item.pos}</div>
            <div class="classifica-info">
              <div class="classifica-nome">${item.nome}</div>
              <div class="classifica-canzone">${item.canzone}</div>
            </div>
          </div>`;
      }).join('')}
    </div>`;
}

function calcolaMedia(num) {
  const v = voti[num];
  if (!v) return null;
  const valori = Object.values(v).filter(x => x !== null).map(x => x.v);
  if (!valori.length) return null;
  return (valori.reduce((a, b) => a + b, 0) / valori.length).toFixed(1);
}

/* ── RENDER LEGENDA ── */
function renderLegenda() {
  const legenda = document.getElementById('legenda');
  legenda.style.display = (showTop5 || showClassifica) ? 'none' : 'flex';
  const leg5 = document.getElementById('legenda5note');
  if (leg5) leg5.style.display = currentSerata === 5 ? 'flex' : 'none';
}

/* ── RENDER ALL ── */
function render() {
  renderNav();
  renderTitle();
  renderGrid();
  renderTop5();
  renderClassifica();
  renderLegenda();
}

/* ── ACTIONS ── */
function selectSerata(n) {
  currentSerata = n;
  showTop5 = false;
  showClassifica = false;
  render();
}

function toggleTop5() {
  showTop5 = !showTop5;
  showClassifica = false;
  render();
}

function toggleClassifica() {
  showClassifica = !showClassifica;
  showTop5 = false;
  render();
}

/* ── MODAL ── */
function openModal(num) {
  const c = cantanti.find(x => x.num === num);
  document.getElementById('modalNome').textContent    = c.nome;
  document.getElementById('modalCanzone').textContent = `"${c.canzone}"`;
  document.getElementById('modalVoti').innerHTML = serate.map(s => {
    const vd    = voti[num] && voti[num][s.n];
    const badge = vd
      ? `<div class="modal-voto-display ${cc(vd.c)}">${vd.v}</div>`
      : `<div class="modal-voto-display voto-nd" style="font-size:13px;font-family:Montserrat">–</div>`;
    return `
      <div class="modal-voto-row">
        <span class="modal-serata-label">${s.label} · ${s.data}</span>
        ${badge}
      </div>`;
  }).join('');
  document.getElementById('modalOverlay').classList.add('show');
}

function closeModal() {
  document.getElementById('modalOverlay').classList.remove('show');
}

document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('modalOverlay').addEventListener('click', function(e) {
    if (e.target === this) closeModal();
  });
});