'use strict';

// Versión de la app (se ve en la pantalla de inicio). Arreglos y ajustes: 0.1.x; novedades: 0.x.0.
const APP_VERSION = '0.2.0';
// Uso de la app en Vercel Analytics: es una sola página, así que cada función se cuenta como una
// página virtual. Solo se envía el nombre de la función, nunca datos de la app.
const track = (path) => { try { window.va?.('pageview', { path }); } catch (_) { /* sin analítica */ } };
const trackLabel = (label) => track(`/${label.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')}`);
const DATA_KEY = 'simular:data';
const DISPLAY_KEY = 'simular:display';
const INSTALL_HINT_KEY = 'simular:installHint';
const MARKET_KEY = 'simular:euribor';
const LOCALE = 'es-ES';
const MONTHS_SHORT = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
const MONTHS = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];

const ICONS = {
  house: '<path d="M4 11l8-7 8 7"/><path d="M6.5 9.5V20h11V9.5"/>',
  percent: '<path d="M18 6L6 18"/><circle cx="7.5" cy="7.5" r="2.5"/><circle cx="16.5" cy="16.5" r="2.5"/>',
  trend: '<path d="M4 17l5-5 4 3 7-7"/><path d="M15 8h5v5"/>',
  stairs: '<path d="M4 6h5v5h5v5h6"/><path d="M17 13l3 3-3 3"/>',
  star: '<path d="M12 3.5l2.6 5.3 5.9.9-4.3 4.1 1 5.8L12 16.9l-5.2 2.7 1-5.8-4.3-4.1 5.9-.9z"/>',
  trash: '<path d="M4.5 7h15M10 11v6M14 11v6"/><path d="M6.5 7l1 12.5A1.5 1.5 0 0 0 9 21h6a1.5 1.5 0 0 0 1.5-1.5l1-12.5M9.5 7V4.5h5V7"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  copy: '<rect x="8" y="8" width="12" height="12" rx="2"/><path d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2"/>',
  palette: '<path d="M12 3a9 9 0 1 0 0 18c1.1 0 1.6-.9 1.2-1.8-.5-1-.1-2.2 1.1-2.2H17a4 4 0 0 0 4-4c0-5.5-4-10-9-10z"/><circle cx="7.5" cy="11" r="1.2"/><circle cx="10" cy="7" r="1.2"/><circle cx="15" cy="7.5" r="1.2"/>',
  info: '<circle cx="12" cy="12" r="8.5"/><path d="M12 11v5.5"/><circle cx="12" cy="7.8" r=".6" fill="currentColor"/>',
  chevron: '<path d="M9 5l7 7-7 7"/>',
  close: '<path d="M6 6l12 12M18 6L6 18"/>',
};
const icon = (name, size = 22) =>
  `<svg viewBox="0 0 24 24" width="${size}" height="${size}" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICONS[name]}</svg>`;

// Logo de SimulaCTRL: anillo fino, anillo discontinuo, arco y una casa con el capital bajando en escalones
let logoCount = 0;
function logoSVG(size) {
  const id = `sim-g${logoCount++}`;
  return `
    <svg class="logo-mark" viewBox="0 0 120 120" width="${size}" height="${size}" fill="none" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
      <defs>
        <linearGradient id="${id}" x1="0" y1="1" x2="1" y2="0">
          <stop offset="0" stop-color="#0f766e"/><stop offset=".55" stop-color="#2dd4bf"/><stop offset="1" stop-color="#fde68a"/>
        </linearGradient>
      </defs>
      <circle cx="60" cy="60" r="52" stroke="url(#${id})" stroke-width="1.2" opacity=".55"/>
      <circle cx="60" cy="60" r="42" stroke="url(#${id})" stroke-width=".8" stroke-dasharray="2 5" opacity=".6"/>
      <path class="logo-arc" pathLength="1" d="M60 8 A52 52 0 1 1 14.97 86" stroke="url(#${id})" stroke-width="3"/>
      <circle class="logo-dot" cx="14.97" cy="86" r="3" fill="#fde68a" stroke="none"/>
      <path d="M33 57l27-23 27 23" stroke="url(#${id})" stroke-width="1.8"/>
      <path d="M40 51v33h40V51" stroke="url(#${id})" stroke-width="1.8"/>
      <path d="M47 57h8v8h8v8h10" stroke="url(#${id})" stroke-width="1.8"/>
      <path d="M69 69l4 4-4 4" stroke="url(#${id})" stroke-width="1.8"/>
    </svg>`;
}
document.querySelectorAll('[data-logo]').forEach((el) => { el.innerHTML = logoSVG(Number(el.dataset.logo)); });
document.getElementById('app-version').textContent = `Versión ${APP_VERSION}`;

// ---------- Utilidades ----------

const $ = (id) => document.getElementById(id);
const uid = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const num = (n, d = 2) => (n || 0).toLocaleString(LOCALE, { minimumFractionDigits: d, maximumFractionDigits: d, useGrouping: 'always' });
const money = (n) => `${num(n)} €`;
const money0 = (n) => `${num(n, 0).replace("-", "−")} €`;
const pct = (p, d = 2) => `${num(p, d)} %`;
// Valor de un campo: con punto de miles y los decimales que tenga
const formatInput = (n) => (n || n === 0 ? n.toLocaleString(LOCALE, { maximumFractionDigits: 4, useGrouping: 'always' }) : '');
const ymShort = (ym) => `${MONTHS_SHORT[Number(ym.slice(5)) - 1]} ${ym.slice(0, 4)}`;
const ymLong = (ym) => `${MONTHS[Number(ym.slice(5)) - 1]} de ${ym.slice(0, 4)}`;
const termText = (months) => {
  const y = Math.floor(months / 12);
  const m = months % 12;
  return [y ? `${y} ${y === 1 ? 'año' : 'años'}` : '', m ? `${m} ${m === 1 ? 'mes' : 'meses'}` : ''].filter(Boolean).join(' y ') || '0 meses';
};
const nowYm = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`; };
const nextYm = (n = 1) => tToYm(ymToT(nowYm()) + n);

// Importes: admite 1.234,56 · 1234.56 · 1.234
function parseAmount(str) {
  let s = String(str).replace(/[^\d.,-]/g, '');
  if (s.includes(',')) s = s.replace(/\./g, '').replace(',', '.');
  else if (/^-?[1-9]\d{0,2}(\.\d{3})+$/.test(s)) s = s.replace(/\./g, '');
  const n = parseFloat(s);
  return Number.isFinite(n) ? n : 0;
}

function load(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch (_) {
    return fallback;
  }
}
function save(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch (_) {
    return false;
  }
}

// ---------- Datos ----------

const newLoan = (name = 'Mi hipoteca') => normLoan({ id: uid(), name });
function normLoan(l) {
  const def = {
    id: uid(), name: 'Préstamo', kind: 'hipoteca',
    balance: 0, years: 0, months: 0, nextPay: nextYm(), tin: 0,
    rateType: 'fixed', spread: 0, nextReview: nextYm(), review: 12, lag: 2,
    insurance: 0, insuranceDed: true,
    feePct: 0, feeAfterPct: 0, feeUntil: '',
    scenarios: [], rec: null,
  };
  const ded = { on: false, region: 'madrid', rules: [], holders: 1, deductiblePct: 100, lifetimeUsed: 0, custom: { pct: 0, kind: 'all', maxBase: 0, maxDed: 0 } };
  const excess = { on: false, initial: 0, freePct: 20, scope: 'year', feePct: 0, done: 0 };
  const budget = { today: 0, yearly: 0, month: 1, min: 0, goal: 'carga' };
  const env = {
    curve: 'analistas', returnGross: 2.5, savingsTax: 19, inflation: 2.3,
    custom: [2027, 2028, 2029, 2030, 2031].map((y) => ({ y, v: null })),
  };
  return {
    ...def, ...l,
    ded: { ...ded, ...(l.ded || {}), custom: { ...ded.custom, ...(l.ded?.custom || {}) } },
    excess: { ...excess, ...(l.excess || {}) },
    budget: { ...budget, ...(l.budget || {}) },
    env: { ...env, ...(l.env || {}) },
  };
}
function normData(d) {
  d = d && typeof d === 'object' ? d : {};
  const loans = Array.isArray(d.loans) ? d.loans.map(normLoan) : [];
  return { loans, cur: loans.some((l) => l.id === d.cur) ? d.cur : loans[0]?.id ?? null };
}
let data = normData(load(DATA_KEY, null));
function persist() { save(DATA_KEY, data); }
const loan = () => data.loans.find((l) => l.id === data.cur) || null;
const loanReady = (l) => !!(l && l.balance > 0 && l.years * 12 + l.months > 0 && (l.tin > 0 || l.rateType !== 'fixed'));

// ---------- Euribor (Banco Central Europeo) ----------
// Igual que en UnderCTRL: media mensual a 12 meses y tipos a plazo de la curva de la zona euro (AAA).
const ECB_API = 'https://data-api.ecb.europa.eu/service/data';
const MARKET_TTL = 12 * 3600e3;
let market = load(MARKET_KEY, null);

function parseEcbCsv(text) {
  const lines = text.trim().split(/\r?\n/);
  const head = lines.shift().split(',');
  const col = (name) => head.indexOf(name);
  const [k, p, v] = [col('KEY'), col('TIME_PERIOD'), col('OBS_VALUE')];
  return lines.map((l) => l.split(',')).map((r) => ({ key: r[k], period: r[p], value: parseFloat(r[v]) }))
    .filter((r) => Number.isFinite(r.value));
}

async function fetchMarket() {
  const get = (url) => fetch(url, { signal: AbortSignal.timeout(12000) }).then((r) => (r.ok ? r.text() : Promise.reject(new Error(r.status))));
  const years = Array.from({ length: 30 }, (_, i) => `SR_${i + 1}Y`);
  const [hist, curve] = await Promise.all([
    get(`${ECB_API}/FM/M.U2.EUR.RT.MM.EURIBOR1YD_.HSTA?format=csvdata&lastNObservations=24`),
    get(`${ECB_API}/YC/B.U2.EUR.4F.G_N_A.SV_C_YM.${years.join('+')}?format=csvdata&lastNObservations=1`).catch(() => ''),
  ]);
  const monthly = Object.fromEntries(parseEcbCsv(hist).map((r) => [r.period, r.value]));
  const last = Object.keys(monthly).sort().at(-1);
  if (!last) throw new Error('sin datos');
  let forward = null;
  let curveDate = '';
  if (curve) {
    const spot = [0];
    for (const r of parseEcbCsv(curve)) {
      const n = Number(r.key.match(/SR_(\d+)Y$/)?.[1]);
      if (n) { spot[n] = r.value; curveDate = r.period; }
    }
    if (spot.length === 31 && spot.every((s) => Number.isFinite(s))) {
      forward = Array.from({ length: 30 }, (_, k) => (k + 1) * spot[k + 1] - k * spot[k]);
    }
  }
  return { monthly, last, value: monthly[last], forward, curveDate, at: Date.now() };
}

function refreshMarket() {
  if (market && Date.now() - market.at < MARKET_TTL) return;
  fetchMarket().then((m) => {
    const changed = m.last !== market?.last || m.value !== market?.value;
    market = m;
    save(MARKET_KEY, m);
    if (changed) render();
  }).catch(() => { /* sin conexión: sigue el último dato guardado */ });
}

// ---------- Hojas ----------

function closeSheet() {
  document.querySelector('.sheet-backdrop')?.remove();
}
function newSheet(center = false) {
  closeSheet();
  const back = document.createElement('div');
  back.className = `sheet-backdrop${center ? ' center' : ''}`;
  document.body.append(back);
  back.addEventListener('click', (e) => { if (e.target === back) closeSheet(); });
  return back;
}

// ---------- Plan recomendado y escenarios ----------

// Colores por escenario: fijos para cada identidad, también el trazo cambia para no depender del color
const SERIES = {
  base: { var: '--s-base', dash: '2 5' },
  rec: { var: '--s-rec', dash: '' },
  lump: { var: '--s-lump', dash: '7 4' },
};
const USER_SERIES = [['--s-u1', '1 0'], ['--s-u2', '9 3 2 3'], ['--s-u3', '4 3']];

// Huella de lo que influye en el plan: si cambia, hay que recalcular el recomendado
function recKey(l) {
  const { scenarios, rec, name, id, ...rest } = l;
  return JSON.stringify([rest, market?.last, market?.value, market?.curveDate]);
}
let opt = { running: false, progress: 0, signal: null };

async function ensureRec(l) {
  const key = recKey(l);
  if (l.rec?.key === key || (opt.running && opt.key === key)) return;
  if (opt.signal) opt.signal.stop = true;
  const signal = { stop: false };
  opt = { running: true, progress: 0, key, signal };
  const ctx = prepare(l, market);
  await new Promise((r) => setTimeout(r, 60));
  if (signal.stop) return;
  const r = await optimize(ctx, l.budget, l.budget.goal, (p) => {
    opt.progress = p;
    const bar = document.querySelector('.opt-bar i');
    if (bar) bar.style.width = `${Math.round(p * 100)}%`;
  }, signal);
  if (!r || signal.stop) return;
  l.rec = { key, ...r };
  opt = { running: false, progress: 1, signal: null };
  persist();
  render();
}

// Todos los escenarios del préstamo, ya simulados con el contexto indicado
function scenariosOf(l, ctx) {
  const list = [];
  const run = (id, name, mode, items, sub, s) => {
    const plan = planOf(items, mode, ctx);
    list.push({ id, name, sub, mode, items, plan, r: simulate(ctx, plan, true), ...s });
  };
  run('base', 'Sin amortizar', 'term', [], 'Seguir pagando la cuota', SERIES.base);
  if (l.rec?.key === recKey(l)) {
    run('rec', 'Recomendado', l.rec.mode, l.rec.items, 'El de menos coste, calculado por la app', { ...SERIES.rec, auto: true });
  }
  const lump = lumpPlan(ctx, l.budget);
  if (lump.length) run('lump', 'Todo cuanto antes', 'term', lump, 'Sin esperar: lo que hay, ya', { ...SERIES.lump, auto: true });
  l.scenarios.forEach((sc, i) => {
    const [v, dash] = USER_SERIES[i % USER_SERIES.length];
    run(sc.id, sc.name, sc.mode, sc.items, 'Escenario propio', { var: v, dash, user: true });
  });
  return list;
}
const modeText = (m) => (m === 'term' ? 'reduce plazo' : 'reduce cuota');
const costOf = (l, r) => (l.budget.goal === 'vp' ? r.vp : r.carga);
const goalName = (l) => (l.budget.goal === 'vp' ? 'Coste en valor actual' : 'Carga financiera');
const signed = (v) => `${v > 0.5 ? '+' : v < -0.5 ? '−' : ''}${money0(Math.abs(v))}`;

// Lo que gana y lo que pierde un plan frente a no amortizar: cada concepto con su signo
function bridgeOf(base, r) {
  const interest = base.interest - r.interest;
  const ins = base.ins - r.ins;
  const fees = base.fees - r.fees;
  const ded = r.ded - base.ded;
  return {
    rows: [
      [interest >= 0 ? 'Intereses que te ahorras' : 'Intereses de más', interest],
      [ins >= 0 ? 'Seguros que te ahorras' : 'Seguros de más', ins],
      ['Comisiones que pagas', fees],
      [ded < 0 ? 'Deducción que pierdes' : 'Deducción que ganas', ded],
    ].filter(([, x]) => Math.abs(x) >= 0.5),
    gain: Math.max(0, interest) + Math.max(0, ins) + Math.max(0, ded),
    loss: Math.max(0, -interest) + Math.max(0, -ins) - fees + Math.max(0, -ded),
    net: base.carga - r.carga,
  };
}
function bridgeHTML(base, r) {
  const b = bridgeOf(base, r);
  return `<div class="bridge">
    ${b.rows.map(([n, x]) => `<div class="br-row"><span>${n}</span><b class="${x > 0 ? 'ok' : 'neg-t'}">${signed(x)}</b></div>`).join('')}
    <div class="br-row br-total"><span>${b.net >= 0 ? 'Ahorro neto' : 'Pérdida neta'}</span><b class="${b.net >= 0 ? 'ok' : 'neg-t'}">${signed(b.net)}</b></div>
  </div>`;
}

// Barras divergentes: a la derecha lo que ahorras, a la izquierda lo que pierdes, y la marca del resultado
function balanceBars(list, base) {
  const rows = list.filter((s) => s.id !== 'base' && s.items.length).map((s) => ({ s, b: bridgeOf(base.r, s.r) }));
  if (!rows.length) return '';
  const maxGain = Math.max(...rows.map((x) => x.b.gain), 1);
  const maxLoss = Math.max(...rows.map((x) => x.b.loss), 0);
  const span = maxGain + maxLoss;
  const zero = (maxLoss / span) * 100;
  const pos = (v) => zero + (v / span) * 100;
  return `
    <div class="card bars-card">
      <p class="label">Qué ganas y qué pierdes</p>
      <p class="small muted">Cada plan frente a no amortizar.</p>
      ${rows.map(({ s, b }) => `
        <div class="bb">
          <div class="bb-head"><span>${esc(s.name)}</span><b class="${b.net >= 0 ? 'ok' : 'neg-t'}">${signed(b.net)}</b></div>
          <div class="bb-track">
            <span class="bb-zero" style="left:${zero}%"></span>
            ${b.loss ? `<i class="bb-neg" style="left:${pos(-b.loss)}%;width:calc(${(b.loss / span) * 100}% - 1px)" title="Pierdes ${money0(b.loss)}"></i>` : ''}
            <i class="bb-pos" style="left:calc(${zero}% + 1px);width:calc(${(b.gain / span) * 100}% - 1px)" title="Ahorras ${money0(b.gain)}"></i>
            <span class="bb-net" style="left:${pos(b.net)}%" title="Resultado ${signed(b.net)}"></span>
          </div>
          <div class="bb-foot"><span>${b.loss >= 0.5 ? `Pierdes ${money0(b.loss)}` : 'No pierdes nada'}</span><span>Ahorras ${money0(b.gain)}</span></div>
        </div>`).join('')}
      <div class="legend">
        <span><i class="key bb-neg"></i>Pierdes</span><span><i class="key bb-pos"></i>Ahorras</span><span><i class="key-net"></i>Resultado</span>
      </div>
    </div>`;
}

// ---------- Pantallas ----------

const TABS = [['datos', 'Préstamo', 'house'], ['deduccion', 'Deducción', 'percent'], ['futuro', 'Previsiones', 'trend'], ['plan', 'Plan', 'stairs'], ['comparar', 'Comparar', 'star']];
let tab = 'datos';
let openSc = null;

function field(label, path, value, { unit = '', type = 'num', hint = '', ph = '0' } = {}) {
  const input = type === 'month'
    ? `<input type="month" data-f="${path}" data-t="text" value="${esc(value || '')}">`
    : type === 'text'
      ? `<input type="text" data-f="${path}" data-t="text" value="${esc(value)}" autocomplete="off">`
      : `<input type="text" inputmode="decimal" data-f="${path}" data-t="num" value="${formatInput(value || '')}" placeholder="${ph}" autocomplete="off">`;
  return `<label class="field"><span>${label}</span>${unit ? `<span class="unit">${input}<i>${unit}</i></span>` : input}${hint ? `<small>${hint}</small>` : ''}</label>`;
}
function select(label, path, value, options, numeric = false) {
  return `<label class="field"><span>${label}</span><select data-f="${path}" data-t="${numeric ? 'int' : 'text'}">${options.map(([v, t]) => `<option value="${v}" ${String(v) === String(value) ? 'selected' : ''}>${esc(t)}</option>`).join('')}</select></label>`;
}
function seg(path, value, options, label) {
  return `<div class="seg" role="group" aria-label="${label}">${options.map(([v, t]) => `<button type="button" data-seg="${path}" data-v="${v}" class="${String(value) === String(v) ? 'on' : ''}" aria-pressed="${String(value) === String(v)}">${t}</button>`).join('')}</div>`;
}
const swtch = (path, on, label) => `<button type="button" class="switch ${on ? 'on' : ''}" data-sw="${path}" role="switch" aria-checked="${!!on}" aria-label="${label}"><span></span></button>`;

function viewDatos(l) {
  const ctx = loanReady(l) ? prepare(l, market) : null;
  const pay = ctx ? pmt(l.balance, l.tin / 1200, ctx.n) : 0;
  const end = ctx ? simulate(ctx, { items: [], mode: 'term' }) : null;
  return `
    <section class="group">
      <p class="label">Tu préstamo</p>
      <div class="card form">
        <div class="grid2">
          <div class="span2">${field('Nombre', 'name', l.name, { type: 'text' })}</div>
          ${field('Capital pendiente hoy', 'balance', l.balance, { unit: '€' })}
          ${field('Próxima cuota', 'nextPay', l.nextPay, { type: 'month' })}
          ${field('Plazo: años', 'years', l.years)}
          ${field('Meses', 'months', l.months)}
        </div>
      </div>
    </section>
    <section class="group">
      <p class="label">Tipo de interés</p>
      <div class="card form">
        ${seg('rateType', l.rateType, [['fixed', 'Fijo'], ['variable', 'Variable'], ['mixed', 'Mixto']], 'Tipo de interés')}
        <div class="grid2">
          ${field(l.rateType === 'fixed' ? 'Interés (TIN)' : l.rateType === 'variable' ? 'Interés (TIN)' : 'Interés fijo (TIN)', 'tin', l.tin, { unit: '%' })}
          ${l.rateType === 'fixed' ? '' : `
            ${field('Diferencial', 'spread', l.spread, { unit: '%' })}
            ${field(l.rateType === 'mixed' ? 'Empieza el variable' : 'Próxima revisión', 'nextReview', l.nextReview, { type: 'month' })}
            ${select('Revisión', 'review', l.review, [[12, 'Una vez al año'], [6, 'Dos veces al año']], true)}`}
        </div>
        ${l.rateType !== 'fixed' ? '<p class="small muted">Cada revisión usa el Euribor publicado dos meses antes, como es habitual en las hipotecas.</p>' : ''}
      </div>
    </section>
    <section class="group">
      <p class="label">Gastos del préstamo</p>
      <div class="card form">
        <div class="grid2">
          ${field('Comisión', 'feePct', l.feePct, { unit: '%' })}
          ${field('Seguros al año', 'insurance', l.insurance, { unit: '€' })}
          ${field('Comisión tras corte', 'feeAfterPct', l.feeAfterPct, { unit: '%' })}
          ${field('Fecha de corte', 'feeUntil', l.feeUntil, { type: 'month' })}
        </div>
        <p class="small muted">Mira tu escritura. Máximos de la Ley 5/2019 (firmas desde el 16-6-2019) y solo si el banco tiene pérdida: <b>fijo</b>, 2 % los 10 primeros años y 1,5 % después; <b>variable</b>, 0,25 % los 3 primeros años o 0,15 % los 5 primeros, y 0 después.</p>
        <div class="line-sw"><span>Los seguros figuran en las condiciones del préstamo<small>Solo así entran en la base deducible</small></span>${swtch('insuranceDed', l.insuranceDed, 'Seguros en la base deducible')}</div>
        <div class="line-sw"><span>Comisión por superar un % del capital inicial<small>Se suma a la comisión anterior, solo sobre lo que exceda</small></span>${swtch('excess.on', l.excess.on, 'Comisión por superar un porcentaje')}</div>
        ${l.excess.on ? `
          <div class="grid2">
            ${field('Capital inicial', 'excess.initial', l.excess.initial, { unit: '€' })}
            ${field('Sin comisión hasta', 'excess.freePct', l.excess.freePct, { unit: '%' })}
            ${field('Comisión del exceso', 'excess.feePct', l.excess.feePct, { unit: '%' })}
            ${l.excess.scope === 'total' ? field('Ya amortizado', 'excess.done', l.excess.done, { unit: '€' }) : ''}
          </div>
          ${seg('excess.scope', l.excess.scope, [['year', 'Límite por año'], ['total', 'Límite en toda la vida']], 'Cómo se cuenta el límite')}
          <p class="small muted">${l.excess.initial > 0
            ? `Puedes amortizar ${money0((l.excess.initial * l.excess.freePct) / 100)} ${l.excess.scope === 'year' ? 'cada año' : 'en total'} sin esta comisión. Comprueba en tu escritura cómo se cuenta.`
            : 'Indica el capital inicial del préstamo para aplicarla.'}</p>` : ''}
      </div>
    </section>
    ${ctx ? `
      <div class="card hero">
        <p class="label">Si sigues como hasta ahora</p>
        <p class="hero-net">${money(pay)}<span class="hero-unit">/mes</span></p>
        <p class="hero-sub">Terminas en ${ymLong(tToYm(end.endT))}</p>
        <div class="hero-stats">
          <span><b>${money0(end.interest)}</b><small>Intereses</small></span>
          <span><b>${end.ded ? `−${money0(end.ded)}` : money0(0)}</b><small>Deducción</small></span>
          <span><b>${money0(end.carga)}</b><small>Carga neta</small></span>
        </div>
      </div>
      <button type="button" class="done-btn cta" data-go="${l.ded.on ? 'plan' : 'deduccion'}">Seguir</button>`
    : '<p class="note">Con el capital, el plazo y el interés ya se puede simular.</p>'}
    <button type="button" class="ghost-btn danger center-btn" data-del-loan>${icon('trash', 18)} Quitar este préstamo</button>`;
}

function viewDeduccion(l) {
  const d = l.ded;
  const region = REGIONS[d.region];
  const has = (id) => d.rules.find((r) => r.id === id);
  const rule = (r) => {
    const sel = has(r.id);
    const limit = [
      `${num(r.pct, r.pct % 1 ? 1 : 0)} %${r.kind === 'interest' ? ' de los intereses' : r.kind === 'capital' ? ' sin intereses' : r.kind === 'excess' ? ' del exceso de intereses' : ''}`,
      r.maxBase ? `hasta ${money0(r.maxBase)} de base` : '',
      r.maxDed ? `máximo ${money0(r.maxDed)} al año` : '',
    ].filter(Boolean).join(' · ');
    return `
      <div class="q ${sel ? 'open' : ''}">
        <div class="line-sw"><span><b>${esc(r.name)}</b><small>${limit}</small></span>${`<button type="button" class="switch ${sel ? 'on' : ''}" data-rule="${r.id}" role="switch" aria-checked="${!!sel}" aria-label="${esc(r.name)}"><span></span></button>`}</div>
        ${sel ? `<p class="small muted q-txt">${esc(r.req)}</p>
          ${r.age || r.id === 'custom' ? `<div class="grid2">${`<label class="field"><span>Último año</span><input type="text" inputmode="numeric" data-rule-until="${r.id}" value="${sel.until || ''}" placeholder="sin fin"></label>`}</div>` : ''}` : ''}
      </div>`;
  };
  const customSel = has('custom');
  return `
    <section class="group">
      <p class="label">Vivienda habitual</p>
      <div class="card form">
        <div class="line-sw"><span>Aplico una deducción por este préstamo<small>Cambia el plan: a veces interesa amortizar poco a poco</small></span>${swtch('ded.on', d.on, 'Tiene deducción')}</div>
        ${d.on ? `<div class="grid2">
          <div class="span2">${select('Dónde tributas', 'ded.region', d.region, Object.entries(REGIONS).map(([k, v]) => [k, v.name]))}</div>
          <div class="span2">${select('Declaraciones que deducen', 'ded.holders', d.holders, [[1, 'Una (individual o conjunta)'], [2, 'Dos (cada titular la suya)']], true)}</div>
          <div class="span2">${field('Parte deducible del préstamo', 'ded.deductiblePct', d.deductiblePct, { unit: '%' })}</div>
          ${region.foral && region.rules.length ? `<div class="span2">${field('Ya deducido por esta vivienda', 'ded.lifetimeUsed', d.lifetimeUsed, { unit: '€', hint: 'El crédito total es de 36.000 € por persona.' })}</div>` : ''}
        </div>` : ''}
      </div>
    </section>
    ${d.on ? `
      <section class="group">
        <p class="label">Deducciones de ${esc(region.name.replace(' (foral)', ''))}</p>
        <p class="small muted intro">Activa las que te correspondan: la app no comprueba tu renta ni tu edad.</p>
        <div class="checklist">
          ${region.rules.map(rule).join('')}
          ${!region.rules.length ? '<div class="card form"><p class="small">En Navarra solo sobrevive el régimen transitorio de compras anteriores, y no he podido confirmar sus porcentajes actuales. Consulta tu caso en Hacienda Foral de Navarra y usa la deducción personalizada.</p></div>' : ''}
          <div class="q ${customSel ? 'open' : ''}">
            <div class="line-sw"><span><b>Personalizada</b><small>Para otra regla o un caso que no esté en la lista</small></span><button type="button" class="switch ${customSel ? 'on' : ''}" data-rule="custom" role="switch" aria-checked="${!!customSel}" aria-label="Deducción personalizada"><span></span></button></div>
            ${customSel ? `<div class="grid2">
              ${field('Porcentaje', 'ded.custom.pct', d.custom.pct, { unit: '%' })}
              ${select('Sobre', 'ded.custom.kind', d.custom.kind, [['all', 'Capital e intereses'], ['capital', 'Solo capital'], ['interest', 'Solo intereses']])}
              ${field('Base máxima al año', 'ded.custom.maxBase', d.custom.maxBase, { unit: '€' })}
              ${field('Deducción máx. al año', 'ded.custom.maxDed', d.custom.maxDed, { unit: '€' })}
              <label class="field"><span>Último año</span><input type="text" inputmode="numeric" data-rule-until="custom" value="${customSel.until || ''}" placeholder="sin fin"></label>
            </div>` : ''}
          </div>
        </div>
      </section>
      <div class="card form">
        <p class="small"><b>Importante.</b> La base máxima es por declaración: en conjunta no se duplica; si cada titular declara por separado, cada uno tiene la suya. Solo se deduce si pagas suficiente IRPF, y Hacienda exige que tu patrimonio crezca en el año al menos lo invertido: amortizar con ahorros ya existentes puede no cumplirlo.</p>
        <p class="small muted">Datos del Manual de Renta 2025 de la AEAT. Los forales proceden de fuentes secundarias y las normas cambian: confirma tu caso antes de decidir.</p>
      </div>` : ''}`;
}

function viewFuturo(l) {
  const e = l.env;
  const nowVal = market?.value ?? EURIBOR_FALLBACK.value;
  const nowM = market?.last ?? EURIBOR_FALLBACK.ym;
  const t0 = ymToT(nowM);
  const point = (fn, ym) => pct(fn(ymToT(ym)));
  const row = (k) => {
    const c = CURVES[k];
    const off = k === 'mercado' && !market?.forward;
    const fn = buildCurve(k, market, e.custom);
    return `<button type="button" class="row curve ${e.curve === k ? 'hit' : ''}" data-seg="env.curve" data-v="${k}" ${off ? 'disabled' : ''} aria-pressed="${e.curve === k}">
      <span class="row-text"><b>${c.name}</b><small>${off ? 'Sin conexión con el BCE' : c.text}</small></span>
      <span class="row-amt"><b>${point(fn, `${t0 < ymToT('2027-12') ? 2027 : Number(nowM.slice(0, 4)) + 1}-12`)}</b><small>en 5 años ${pct(fn(t0 + 60))}</small></span>
    </button>`;
  };
  const fn = buildCurve(e.curve, market, e.custom);
  const pts = [];
  for (let t = t0; t <= t0 + 120; t += 3) pts.push([t, fn(t)]);
  return `
    <div class="card hero">
      <p class="label">Euribor a 12 meses</p>
      <p class="hero-net">${pct(nowVal, 3)}</p>
      <p class="hero-sub">${market ? `Dato oficial del BCE, ${ymLong(nowM)}` : `Último dato conocido, ${ymLong(nowM)}`}</p>
    </div>
    <section class="group">
      <p class="label">Qué Euribor esperar</p>
      <div class="list">${Object.keys(CURVES).map(row).join('')}</div>
      ${e.curve === 'propia' ? `<div class="card form"><p class="small muted">Euribor previsto en diciembre de cada año.</p><div class="grid3">${e.custom.map((c, i) => `<label class="field"><span>${c.y}</span><span class="unit"><input type="text" inputmode="decimal" data-custom="${i}" value="${formatInput(c.v ?? '')}" placeholder="${num(buildCurve('analistas', market)(ymToT(`${c.y}-12`)))}"><i>%</i></span></label>`).join('')}</div></div>` : ''}
      <div class="card chart-card" data-chart="curve">${lineChart([{ name: CURVES[e.curve].name, color: 'var(--s-rec)', dash: '', pts }], { y: (v) => pct(v), yAxis: (v) => `${num(v, 1)} %`, label: `Euribor previsto: ${CURVES[e.curve].name}`, zero: true })}</div>
      ${l.rateType === 'fixed' ? '<p class="note">Tu préstamo es fijo: el Euribor no le afecta.</p>' : ''}
    </section>
    <section class="group">
      <p class="label">Previsiones de ${FORECASTS.updated}</p>
      <div class="card table">
        <div class="t-row t-head f3"><span>Fuente</span><span>Dic 27</span><span>Dic 28</span></div>
        ${FORECASTS.sources.map((s) => `<div class="t-row f3"><span>${s.name}<small>${s.date}</small></span><span>${pct(s.dec27)}</span><span>${s.dec28 ? pct(s.dec28) : '—'}</span></div>`).join('')}
      </div>
      <p class="note">Nadie publica previsiones más allá de 2028: desde ahí, el escenario Analistas se queda en 2,75 %. Por eso conviene mirar también «Sube» y «Baja».</p>
    </section>
    <section class="group">
      <p class="label">Otras estimaciones</p>
      <div class="card form">
        <div class="grid2">
          ${field('Rentabilidad', 'env.returnGross', e.returnGross, { unit: '%', hint: 'Bruta, en un depósito o similar' })}
          ${field('Impuesto ahorro', 'env.savingsTax', e.savingsTax, { unit: '%', hint: 'Entre el 19 y el 30 %' })}
          ${field('Inflación', 'env.inflation', e.inflation, { unit: '%', hint: 'El BCE prevé 2,1 % en 2028' })}
        </div>
        <p class="small muted">La rentabilidad mide lo que ganas por no amortizar y mantener el dinero; la inflación pasa los costes futuros a euros de hoy.</p>
      </div>
    </section>`;
}

function budgetCard(l) {
  const b = l.budget;
  return `
    <section class="group">
      <p class="label">Tu dinero para amortizar</p>
      <div class="card form">
        <div class="grid2">
          ${field('Disponible hoy', 'budget.today', b.today, { unit: '€' })}
          ${field('Y cada año podrías', 'budget.yearly', b.yearly, { unit: '€' })}
          ${select('Mes de amortización', 'budget.month', b.month, MONTHS.map((m, i) => [i + 1, m[0].toUpperCase() + m.slice(1)]), true)}
          ${field('Mínimo por operación', 'budget.min', b.min, { unit: '€', hint: 'Si tu banco lo exige' })}
        </div>
        <p class="opt-label">El recomendado busca</p>
        ${seg('budget.goal', b.goal, [['carga', 'Menos carga financiera'], ['vp', 'Mejor con tu dinero rindiendo']], 'Objetivo')}
        <p class="small muted">${b.goal === 'carga' ? 'Intereses, comisiones y seguros, menos deducciones.' : `Tiene en cuenta que el dinero que no amortizas te renta un ${pct(l.env.returnGross * (1 - l.env.savingsTax / 100))} neto.`}</p>
      </div>
    </section>`;
}

function whyText(l, ctx, rec, base) {
  const out = [];
  const n = rec.applied.length;
  if (!n) return ['Con estos datos, no amortizar es lo más barato: lo que ganarías no compensa perder la deducción o pagar la comisión.'];
  const hasCap = rec.years.some((y) => y.cap > 0);
  if (n === 1) out.push(`Una sola amortización de ${money0(rec.extra)} en ${ymLong(tToYm(rec.applied[0].t))}.`);
  else out.push(`${n} amortizaciones que suman ${money0(rec.extra)}, entre ${ymShort(tToYm(rec.applied[0].t))} y ${ymShort(tToYm(rec.applied.at(-1).t))}.`);
  if (hasCap && n > 1) {
    const filled = rec.years.filter((y) => y.extra > 0 && y.base >= y.cap - 300).length;
    if (filled) out.push(`En ${filled} ${filled === 1 ? 'año llega' : 'años llega'} justo al tope deducible para no perder deducción.`);
  }
const lost = base.ded - rec.ded;
if (ctx.rules.length && lost >= 0.5) out.push(`Renuncias a ${money0(lost)} de deducción a cambio de pagar ${money0(base.interest - rec.interest)} menos de intereses.`);
else if (ctx.rules.length) out.push('Ahorras intereses sin perder deducción.');
  if (rec.carga < 0) out.push('La carga sale negativa porque lo que deduces supera a los intereses y gastos.');
  return out;
}

function scenarioRow(sc, l, base) {
  const saved = costOf(l, base.r) - costOf(l, sc.r);
  const open = openSc === sc.id;
  return `
    <div class="sc ${sc.id === 'rec' ? 'rec' : ''} ${open ? 'open' : ''}">
      <button type="button" class="sc-head" data-open="${sc.id}" aria-expanded="${open}">
        <span class="sc-key" style="--k:var(${sc.var})"><svg width="24" height="8" aria-hidden="true"><line x1="1" y1="4" x2="23" y2="4" stroke-width="2.4" stroke-linecap="round" stroke-dasharray="${sc.dash || ''}"/></svg></span>
        <span class="row-text"><b>${esc(sc.name)}</b><small>${sc.items.length ? `${money0(sc.r.extra)} · ${modeText(sc.mode)} · fin ${ymShort(tToYm(sc.r.endT))}` : esc(sc.sub)}</small></span>
        <span class="row-amt"><b>${money0(costOf(l, sc.r))}</b><small class="${saved > 0.5 ? 'ok' : ''}">${sc.id === 'base' ? 'referencia' : saved > 0.5 ? `ahorras ${money0(saved)}` : saved < -0.5 ? `pierdes ${money0(-saved)}` : 'sin ahorro'}</small></span>
      </button>
      ${open ? scenarioBody(sc, l, base) : ''}
    </div>`;
}

function scenarioBody(sc, l, base) {
  const y = (sc.items.length ? bridgeHTML(base.r, sc.r) : '') + yearsTable(sc.r);
  if (sc.user) {
    return `<div class="sc-body">
      ${field('Nombre', `sc.${sc.id}.name`, sc.name, { type: 'text' })}
      ${seg(`sc.${sc.id}.mode`, sc.mode, [['term', 'Reducir plazo'], ['payment', 'Reducir cuota']], 'Qué reduce')}
      <p class="opt-label">Amortizaciones</p>
      <div class="items">
        ${sc.items.map((it, i) => `<div class="item">
          <input type="month" aria-label="Mes" data-item="${sc.id}" data-i="${i}" data-k="ym" value="${it.ym}">
          <span class="unit"><input type="text" inputmode="decimal" aria-label="Importe" data-item="${sc.id}" data-i="${i}" data-k="amount" value="${formatInput(it.amount)}"><i>€</i></span>
          <button type="button" class="mini-btn" data-item-del="${sc.id}" data-i="${i}" aria-label="Quitar">${icon('close', 16)}</button>
        </div>`).join('') || '<p class="small muted">Aún no hay amortizaciones.</p>'}
      </div>
      <div class="btn-row">
        <button type="button" class="ghost-btn small-btn" data-item-add="${sc.id}">${icon('plus', 16)} Añadir</button>
        <button type="button" class="ghost-btn small-btn danger" data-sc-del="${sc.id}">${icon('trash', 16)} Quitar escenario</button>
      </div>
      ${y}
    </div>`;
  }
  return `<div class="sc-body">
    ${sc.items.length ? `<div class="chips-list">${sc.items.map((i) => `<span class="pill"><b>${money0(i.amount)}</b> ${ymShort(i.ym)}</span>`).join('')}</div>` : ''}
    ${sc.items.length ? `<button type="button" class="ghost-btn small-btn" data-sc-copy="${sc.id}">${icon('copy', 16)} Copiar como escenario propio</button>` : ''}
    ${y}
  </div>`;
}

function yearsTable(r) {
  return `<details class="years-d"><summary>Año a año ${icon('chevron', 14)}</summary>
    <div class="y-scroll"><table class="y-table">
      <thead><tr><th>Año</th><th>Cuotas</th><th>Extra</th><th>Intereses</th><th>Deducción</th><th>Tope libre</th></tr></thead>
      <tbody>${r.years.map((y) => {
        const free = y.cap ? Math.max(0, y.cap - y.base) : 0;
        return `<tr><td>${y.y}</td><td>${num(y.capital + y.interest, 0)}</td><td>${y.extra ? num(y.extra, 0) : '–'}</td><td>${num(y.interest, 0)}</td><td>${y.ded ? num(y.ded, 0) : '–'}</td><td>${free >= 1 ? num(free, 0) : '–'}</td></tr>`;
      }).join('')}</tbody>
    </table></div>
    <p class="note">El año en curso incluye en el tope las cuotas ya pagadas. «Tope libre» es lo que aún podrías pagar ese año con deducción.</p>
  </details>`;
}

function viewPlan(l) {
  if (!loanReady(l)) return needData();
  const ctx = prepare(l, market);
  const list = scenariosOf(l, ctx);
  const base = list[0];
  const rec = list.find((s) => s.id === 'rec');
  const noMoney = !(l.budget.today > 0 || l.budget.yearly > 0);
  if (!rec && !noMoney) ensureRec(l);
  const saved = rec ? costOf(l, base.r) - costOf(l, rec.r) : 0;
  return `
    ${budgetCard(l)}
    ${noMoney ? '<p class="note">Indica cuánto puedes amortizar y la app calculará el mejor plan.</p>' : !rec ? `
      <div class="card hero"><p class="label">Buscando el mejor plan</p><p class="hero-sub">Probando repartos entre años…</p><div class="opt-bar"><i style="width:${Math.round(opt.progress * 100)}%"></i></div></div>` : `
      <div class="card hero">
        <p class="label">Plan recomendado</p>
        <p class="hero-net">${money0(Math.max(0, saved))}</p>
        <p class="hero-sub">de ${l.budget.goal === 'vp' ? 'mejora en valor actual' : 'ahorro en carga financiera'} frente a no amortizar</p>
        <div class="hero-stats">
          <span><b>${money0(rec.r.extra)}</b><small>Amortizas</small></span>
          <span><b>${ymShort(tToYm(rec.r.endT))}</b><small>Terminas</small></span>
          <span><b>${rec.mode === 'term' ? 'Plazo' : 'Cuota'}</b><small>Reduces</small></span>
        </div>
        ${rec.items.length ? bridgeHTML(base.r, rec.r) : ''}
        <ul class="why">${whyText(l, ctx, rec.r, base.r).map((t) => `<li>${esc(t)}</li>`).join('')}</ul>
      </div>`}
    <section class="group">
      <p class="label">Escenarios · ${goalName(l).toLowerCase()}</p>
      <div class="scs">${list.map((s) => scenarioRow(s, l, base)).join('')}</div>
      <button type="button" class="ghost-btn add-more" data-sc-new>${icon('plus', 18)} Nuevo escenario</button>
    </section>`;
}

function viewComparar(l) {
  if (!loanReady(l)) return needData();
  const ctx = prepare(l, market);
  const list = scenariosOf(l, ctx);
  if (!list.some((s) => s.id === 'rec') && (l.budget.today > 0 || l.budget.yearly > 0)) ensureRec(l);
  const base = list[0];
  const series = list.map((s) => ({
    name: s.name, color: `var(${s.var})`, dash: s.dash,
    pts: [[ctx.t0 - 1, l.balance], ...s.r.rows.map((r) => [r.t, r.balance])],
  }));
  const metrics = [
    ['Intereses', (r) => money0(r.interest)],
    ['Comisiones', (r) => money0(r.fees)],
    ['Seguros', (r) => money0(r.ins)],
    ['Deducción', (r) => (r.ded ? `−${money0(r.ded)}` : money0(0))],
    ['Carga financiera', (r) => money0(r.carga), 'tr-total'],
    ['Frente a no amortizar', (r) => (r === base.r ? '–' : signed(base.r.carga - r.carga)), 'tr-sub'],
    ['En euros de hoy', (r) => money0(r.real)],
    ['Coste en valor actual', (r) => money0(r.vp)],
    ['Amortizado', (r) => money0(r.extra)],
    ['Termina en', (r) => ymShort(tToYm(r.endT))],
    ['Plazo', (r) => termText(r.months)],
  ];
  const stress = l.rateType === 'fixed' ? '' : `
    <section class="group">
      <p class="label">Si el Euribor no acierta</p>
      <div class="card y-scroll"><table class="y-table cmp">
        <thead><tr><th>Euribor</th>${list.map((s) => `<th>${esc(s.name)}</th>`).join('')}</tr></thead>
        <tbody>${['baja', 'analistas', 'plano', 'sube'].map((k) => {
          const c = prepare(l, market, k);
          return `<tr><td>${CURVES[k].name}</td>${list.map((s) => `<td>${money0(costOf(l, simulate(c, s.plan)))}</td>`).join('')}</tr>`;
        }).join('')}</tbody>
      </table></div>
      <p class="note">${goalName(l)} de cada plan si el Euribor va por otro camino, sin cambiar el plan.</p>
    </section>`;
  const net = l.env.returnGross * (1 - l.env.savingsTax / 100);
  const rateNow = base.r.rows[0]?.rate ?? l.tin;
  return `
    ${balanceBars(list, base)}
    <div class="card chart-card" data-chart="bal">
      <p class="label">Capital pendiente</p>
      ${lineChart(series, { y: money0, yAxis: (v) => `${num(v / 1000, 0)} k`, label: 'Capital pendiente por escenario', zero: true, end: list.map((s) => ymShort(tToYm(s.r.endT))) })}
    </div>
    <section class="group">
      <p class="label">Comparativa</p>
      <div class="card y-scroll"><table class="y-table cmp">
        <thead><tr><th></th>${list.map((s) => `<th>${esc(s.name)}</th>`).join('')}</tr></thead>
        <tbody>${metrics.map(([n, f, c]) => `<tr class="${c || ''}"><td>${n}</td>${list.map((s) => `<td>${f(s.r)}</td>`).join('')}</tr>`).join('')}</tbody>
      </table></div>
    </section>
    ${stress}
    <div class="card form">
      <p class="small"><b>Préstamo frente a ahorro.</b> Pagas ${pct(rateNow)} de interés y tu dinero rinde ${pct(net)} neto. ${rateNow > net ? 'Amortizar te sale a cuenta frente a guardar el dinero, sin contar la deducción.' : 'Tu dinero rinde más que lo que cuesta el préstamo: amortizar puede no compensar. Prueba el objetivo «Mejor con tu dinero rindiendo».'}</p>
      <p class="small muted">Es una simulación con previsiones, no asesoramiento financiero. Antes de amortizar, conserva un colchón y pide al banco el cálculo real.</p>
    </div>`;
}

const needData = () => `<div class="card empty">${icon('house', 30)}<b>Faltan datos del préstamo</b><small>Indica el capital pendiente, el plazo y el interés.</small><button type="button" class="done-btn" data-go="datos">Completar</button></div>`;

// ---------- Gráfico de líneas ----------
// Un solo eje; cada línea además del color lleva su trazo. El cursor muestra los valores de cada mes.
let chartSeries = {};
function lineChart(series, { y, yAxis, label, zero, end = [] }) {
  const id = `c${Object.keys(chartSeries).length}`;
  const W = Math.min(document.documentElement.clientWidth - 62, 836);
  const H = 210;
  const m = { l: 38, r: 8, t: 8, b: 22 };
  const all = series.flatMap((s) => s.pts);
  const x0 = Math.min(...all.map((p) => p[0]));
  const x1 = Math.max(...all.map((p) => p[0]));
  const vs = all.map((p) => p[1]);
  const lo = zero ? 0 : Math.min(...vs);
  const raw = (Math.max(...vs) - lo) / 4 || 1;
  const mag = 10 ** Math.floor(Math.log10(raw));
  const step = [1, 2, 2.5, 5, 10].map((k) => k * mag).find((k) => k >= raw);
  const hi = Math.ceil(Math.max(...vs) / step) * step;
  const X = (t) => m.l + ((t - x0) / (x1 - x0 || 1)) * (W - m.l - m.r);
  const Y = (v) => H - m.b - ((v - lo) / (hi - lo || 1)) * (H - m.t - m.b);
  const yTicks = [];
  for (let v = lo; v <= hi + 1e-9; v += step) yTicks.push(v);
  const spanY = (x1 - x0) / 12;
  const every = spanY > 24 ? 5 : spanY > 7 ? 2 : 1;
  const xTicks = [];
  for (let yr = Math.ceil(x0 / 12); yr * 12 <= x1; yr++) if (yr % every === 0) xTicks.push(yr);
  const path = (pts) => pts.map((p, i) => `${i ? 'L' : 'M'}${X(p[0]).toFixed(1)} ${Y(p[1]).toFixed(1)}`).join('');
  chartSeries[id] = { series, X, x0, x1, y, m, W, H, Y };
  return `
    <div class="chart" data-id="${id}">
      <svg viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" role="img" aria-label="${esc(label)}">
        ${yTicks.map((v) => `<line class="grid" x1="${m.l}" x2="${W - m.r}" y1="${Y(v)}" y2="${Y(v)}"/><text class="tick" x="${m.l - 6}" y="${Y(v) + 3.5}" text-anchor="end">${yAxis(v)}</text>`).join('')}
        ${xTicks.map((yr) => `<text class="tick" x="${X(yr * 12)}" y="${H - 6}" text-anchor="middle">${yr}</text>`).join('')}
        ${series.map((s) => `<path d="${path(s.pts)}" fill="none" stroke="${s.color}" stroke-width="2" stroke-linejoin="round" stroke-linecap="round" stroke-dasharray="${s.dash || ''}"/>`).join('')}
        <line class="cross" y1="${m.t}" y2="${H - m.b}" hidden/>
      </svg>
      <div class="tip" hidden></div>
    </div>
    ${series.length > 1 ? `<div class="legend">${series.map((s, i) => `<span><svg width="22" height="8" aria-hidden="true"><line x1="1" y1="4" x2="21" y2="4" stroke="${s.color}" stroke-width="2.4" stroke-linecap="round" stroke-dasharray="${s.dash || ''}"/></svg>${esc(s.name)}${end[i] ? ` <small>${end[i]}</small>` : ''}</span>`).join('')}</div>` : ''}`;
}

function bindCharts(view) {
  view.querySelectorAll('.chart').forEach((el) => {
    const c = chartSeries[el.dataset.id];
    const svg = el.querySelector('svg');
    const cross = el.querySelector('.cross');
    const tip = el.querySelector('.tip');
    const show = (e) => {
      const rect = svg.getBoundingClientRect();
      const px = ((e.clientX - rect.left) / rect.width) * c.W;
      const t = Math.round(c.x0 + ((px - c.m.l) / (c.W - c.m.l - c.m.r)) * (c.x1 - c.x0));
      if (t < c.x0 || t > c.x1) { hide(); return; }
      const x = c.X(t);
      cross.setAttribute('x1', x); cross.setAttribute('x2', x);
      cross.removeAttribute('hidden');
      tip.innerHTML = `<b>${ymShort(tToYm(t))}</b>${c.series.map((s) => {
        const p = s.pts.find((q) => q[0] >= t) ?? [0, 0];
        return `<span>${esc(s.name)}<i>${c.y(s.pts.at(-1)[0] < t ? 0 : p[1])}</i></span>`;
      }).join('')}`;
      tip.hidden = false;
      tip.style.left = `${Math.min(x + 10, c.W - tip.offsetWidth - 2)}px`;
      if (x + 10 + tip.offsetWidth > c.W) tip.style.left = `${Math.max(0, x - tip.offsetWidth - 10)}px`;
    };
    const hide = () => { cross.setAttribute('hidden', ''); tip.hidden = true; };
    el.addEventListener('pointermove', show);
    el.addEventListener('pointerdown', show);
    el.addEventListener('pointerleave', hide);
  });
}

// ---------- Render y edición ----------

function render() {
  const view = $('view');
  const l = loan();
  chartSeries = {};
  const scroll = window.scrollY;
  if (!l) {
    view.innerHTML = `
      <div class="intro"><p class="intro-text">Simula cómo amortizar tu préstamo o hipoteca: cuánto, cuándo y si reducir cuota o plazo, con tu deducción por vivienda y las previsiones del Euribor.</p></div>
      <div class="card empty">${icon('stairs', 30)}<b>Añade tu préstamo</b><small>Solo necesitas el capital pendiente, el plazo y el interés. Todo se queda en tu dispositivo.</small><button type="button" class="done-btn" data-new-loan>Añadir préstamo</button></div>`;
    bindView(view);
    return;
  }
  const views = { datos: viewDatos, deduccion: viewDeduccion, futuro: viewFuturo, plan: viewPlan, comparar: viewComparar };
  view.innerHTML = `
    ${data.loans.length > 1 ? `<div class="pills loans">${data.loans.map((x) => `<button type="button" class="${x.id === l.id ? 'on' : ''}" data-loan="${x.id}">${esc(x.name)}</button>`).join('')}</div>` : ''}
    <nav class="tabs" aria-label="Secciones">${TABS.map(([k, t, ic]) => `<button type="button" class="${tab === k ? 'on' : ''}" data-tab="${k}" aria-current="${tab === k ? 'page' : 'false'}">${icon(ic, 18)}<span>${t}</span></button>`).join('')}</nav>
    ${views[tab](l)}`;
  bindView(view);
  bindCharts(view);
  window.scrollTo(0, scroll);
}

function setPath(obj, path, value) {
  const keys = path.split('.');
  const last = keys.pop();
  keys.reduce((o, k) => o[k], obj)[last] = value;
}
const scById = (l, id) => l.scenarios.find((s) => s.id === id);

function applyField(l, path, value) {
  if (path.startsWith('sc.')) {
    const [, id, key] = path.split('.');
    const sc = scById(l, id);
    if (sc) sc[key] = value;
  } else {
    setPath(l, path, value);
    if (path === 'ded.region') l.ded.rules = [];
  }
  persist();
  render();
}

function toggleRule(l, id) {
  const d = l.ded;
  const pool = REGIONS[d.region].rules;
  if (d.rules.some((r) => r.id === id)) d.rules = d.rules.filter((r) => r.id !== id);
  else {
    const group = pool.find((r) => r.id === id)?.group;
    if (group) d.rules = d.rules.filter((r) => pool.find((p) => p.id === r.id)?.group !== group);
    d.rules.push({ id, until: 0 });
  }
  persist();
  render();
}

function bindView(view) {
  const l = loan();
  view.querySelectorAll('[data-tab]').forEach((b) => b.addEventListener('click', () => {
    tab = b.dataset.tab; track(`/${tab}`); window.scrollTo(0, 0); render();
  }));
  view.querySelectorAll('[data-go]').forEach((b) => b.addEventListener('click', () => {
    tab = b.dataset.go; window.scrollTo(0, 0); render();
  }));
  view.querySelectorAll('[data-new-loan]').forEach((b) => b.addEventListener('click', addLoan));
  view.querySelectorAll('[data-loan]').forEach((b) => b.addEventListener('click', () => {
    data.cur = b.dataset.loan; openSc = null; persist(); render();
  }));
  if (!l) return;
  view.querySelectorAll('[data-f]').forEach((el) => el.addEventListener('change', () => {
    const t = el.dataset.t;
    applyField(l, el.dataset.f, t === 'num' ? parseAmount(el.value) : t === 'int' ? Number(el.value) : el.value);
  }));
  view.querySelectorAll('[data-seg]').forEach((b) => b.addEventListener('click', () => applyField(l, b.dataset.seg, b.dataset.v)));
  view.querySelectorAll('[data-sw]').forEach((b) => b.addEventListener('click', () => {
    const p = b.dataset.sw;
    const cur = p.split('.').reduce((o, k) => o[k], l);
    applyField(l, p, !cur);
  }));
  view.querySelectorAll('[data-rule]').forEach((b) => b.addEventListener('click', () => toggleRule(l, b.dataset.rule)));
  view.querySelectorAll('[data-rule-until]').forEach((el) => el.addEventListener('change', () => {
    const sel = l.ded.rules.find((r) => r.id === el.dataset.ruleUntil);
    if (sel) { sel.until = Math.round(parseAmount(el.value)) || 0; persist(); render(); }
  }));
  view.querySelectorAll('[data-custom]').forEach((el) => el.addEventListener('change', () => {
    l.env.custom[Number(el.dataset.custom)].v = el.value.trim() ? parseAmount(el.value) : null;
    persist(); render();
  }));
  view.querySelector('[data-del-loan]')?.addEventListener('click', () => confirmDeleteLoan(l));
  view.querySelectorAll('[data-open]').forEach((b) => b.addEventListener('click', () => {
    openSc = openSc === b.dataset.open ? null : b.dataset.open; render();
  }));
  view.querySelector('[data-sc-new]')?.addEventListener('click', () => openNewScenario(l));
  view.querySelectorAll('[data-sc-copy]').forEach((b) => b.addEventListener('click', () => {
    const ctx = prepare(l, market);
    const src = scenariosOf(l, ctx).find((s) => s.id === b.dataset.scCopy);
    addScenario(l, `Copia de ${src.name.toLowerCase()}`, src.mode, src.items);
  }));
  view.querySelectorAll('[data-sc-del]').forEach((b) => b.addEventListener('click', () => {
    l.scenarios = l.scenarios.filter((s) => s.id !== b.dataset.scDel); persist(); render();
  }));
  view.querySelectorAll('[data-item]').forEach((el) => el.addEventListener('change', () => {
    const it = scById(l, el.dataset.item).items[Number(el.dataset.i)];
    it[el.dataset.k] = el.dataset.k === 'amount' ? parseAmount(el.value) : el.value;
    scById(l, el.dataset.item).items.sort((a, b) => a.ym.localeCompare(b.ym));
    persist(); render();
  }));
  view.querySelectorAll('[data-item-del]').forEach((b) => b.addEventListener('click', () => {
    scById(l, b.dataset.itemDel).items.splice(Number(b.dataset.i), 1); persist(); render();
  }));
  view.querySelectorAll('[data-item-add]').forEach((b) => b.addEventListener('click', () => {
    const sc = scById(l, b.dataset.itemAdd);
    const lastYm = sc.items.at(-1)?.ym;
    sc.items.push({ ym: lastYm ? tToYm(ymToT(lastYm) + 12) : l.nextPay, amount: 1000 });
    persist(); render();
  }));
}

function addLoan() {
  const l = newLoan(data.loans.length ? `Préstamo ${data.loans.length + 1}` : 'Mi hipoteca');
  data.loans.push(l);
  data.cur = l.id;
  tab = 'datos';
  persist();
  render();
}

function addScenario(l, name, mode, items) {
  const sc = { id: uid(), name, mode, items: items.map((i) => ({ ...i })) };
  l.scenarios.push(sc);
  openSc = sc.id;
  persist();
  render();
  track('/escenario-nuevo');
}

// Nuevo escenario: en blanco o generado a partir de una fórmula sencilla
function openNewScenario(l) {
  const ctx = prepare(l, market);
  const hasCap = planDates(ctx, l.budget.month).some((t) => deductibleCap(ctx, Math.floor(t / 12)) > 0);
  const back = newSheet();
  back.innerHTML = `
    <div class="sheet" role="dialog" aria-modal="true" aria-label="Nuevo escenario">
      <h2 class="sheet-title">Nuevo escenario</h2>
      <p class="small muted">Elige cómo empezar; después puedes cambiar cualquier importe.</p>
      <div class="list">
        <button type="button" class="row plain" data-k="blank"><span class="row-text"><b>En blanco</b><small>Añade tus propias amortizaciones</small></span></button>
        <div class="row plain col">
          <span class="row-text"><b>Una cantidad cada año</b><small>Lo mismo durante varios años</small></span>
          <div class="grid2">
            <label class="field"><span>Importe al año</span><span class="unit"><input type="text" inputmode="decimal" id="ns-amt" placeholder="0"><i>€</i></span></label>
            <label class="field"><span>Durante (años)</span><input type="text" inputmode="numeric" id="ns-years" placeholder="5"></label>
          </div>
          <button type="button" class="ghost-btn small-btn" data-k="yearly">Crear</button>
        </div>
        ${hasCap ? `<button type="button" class="row plain" data-k="fill"><span class="row-text"><b>Completar la deducción cada año</b><small>Lo justo para llegar al tope, con el dinero que has indicado</small></span></button>` : ''}
      </div>
      <p class="opt-label">Qué reduce</p>
      <div class="seg" id="ns-mode"><button type="button" data-m="term" class="on">Reducir plazo</button><button type="button" data-m="payment">Reducir cuota</button></div>
      <div class="sheet-actions"><button type="button" class="ghost-btn" data-close>Cancelar</button></div>
    </div>`;
  $('ns-amt').addEventListener('change', (e) => { e.target.value = formatInput(parseAmount(e.target.value) || ''); });
  let mode = 'term';
  back.querySelectorAll('[data-m]').forEach((b) => b.addEventListener('click', () => {
    mode = b.dataset.m;
    back.querySelectorAll('[data-m]').forEach((x) => x.classList.toggle('on', x === b));
  }));
  back.querySelector('[data-close]').addEventListener('click', closeSheet);
  const n = l.scenarios.length + 1;
  back.querySelector('[data-k="blank"]').addEventListener('click', () => { closeSheet(); addScenario(l, `Escenario ${n}`, mode, []); });
  back.querySelector('[data-k="yearly"]').addEventListener('click', () => {
    const amt = parseAmount($('ns-amt').value);
    const yrs = Math.round(parseAmount($('ns-years').value)) || 5;
    if (!(amt > 0)) { toast('Indica el importe', { warn: true }); return; }
    const dates = planDates(ctx, l.budget.month).slice(0, yrs);
    closeSheet();
    addScenario(l, `${money0(amt)} al año`, mode, dates.map((t) => ({ ym: tToYm(t), amount: amt })));
  });
  back.querySelector('[data-k="fill"]')?.addEventListener('click', () => {
    const items = fillPlan(ctx, mode, l.budget);
    closeSheet();
    if (!items.length) toast('Tus cuotas ya llegan al tope, o falta dinero disponible', { warn: true });
    addScenario(l, 'Completar deducción', mode, items.map((i) => ({ ym: tToYm(i.t), amount: i.amount })));
  });
}

function confirmDeleteLoan(l) {
  const back = newSheet(true);
  back.innerHTML = `
    <div class="sheet" role="dialog" aria-modal="true" aria-label="Quitar préstamo">
      <h2 class="sheet-title">¿Quitar ${esc(l.name)}?</h2>
      <p class="small muted">Se borran sus datos y sus escenarios de este dispositivo.</p>
      <div class="sheet-actions">
        <button type="button" class="ghost-btn" data-close>Cancelar</button>
        <button type="button" class="done-btn danger-fill" data-ok>Quitar</button>
      </div>
    </div>`;
  back.querySelector('[data-close]').addEventListener('click', closeSheet);
  back.querySelector('[data-ok]').addEventListener('click', () => {
    data.loans = data.loans.filter((x) => x.id !== l.id);
    data.cur = data.loans[0]?.id ?? null;
    persist(); closeSheet(); render();
  });
}

// ---------- Menú ⋯ ----------

const MENU = [
  { label: 'Añadir préstamo', icon: 'plus', run: () => addLoan() },
  { label: 'Opciones de visualización', icon: 'palette', run: () => openDisplaySheet() },
  { label: 'Borrar todo', icon: 'trash', run: () => confirmClear() },
  { label: 'Información', icon: 'info', run: () => openInfoSheet() },
];

function openMenu() {
  const menu = $('menu');
  menu.innerHTML = MENU.map((m, i) =>
    `<button class="menu-item" role="menuitem" data-i="${i}">${icon(m.icon, 20)}<span>${m.label}</span></button>`).join('');
  menu.querySelectorAll('.menu-item').forEach((b) => b.addEventListener('click', () => {
    closeMenu();
    trackLabel(MENU[b.dataset.i].label);
    MENU[b.dataset.i].run();
  }));
  const r = $('menu-btn').getBoundingClientRect();
  menu.style.top = `${r.bottom + 6}px`;
  menu.style.right = `${Math.max(8, window.innerWidth - r.right)}px`;
  menu.hidden = false;
  $('menu-btn').setAttribute('aria-expanded', 'true');
}
function closeMenu() {
  $('menu').hidden = true;
  $('menu-btn').setAttribute('aria-expanded', 'false');
}
$('menu-btn').addEventListener('click', (e) => {
  e.stopPropagation();
  if ($('menu').hidden) openMenu();
  else closeMenu();
});
document.addEventListener('click', (e) => {
  if (!$('menu').hidden && !e.target.closest('#menu')) closeMenu();
});
window.addEventListener('resize', closeMenu);

$('add-btn').addEventListener('click', addLoan);

function confirmClear() {
  const back = newSheet(true);
  back.innerHTML = `
    <div class="sheet" role="dialog" aria-modal="true" aria-label="Borrar todo">
      <h2 class="sheet-title">¿Borrar todo?</h2>
      <p class="small muted">Se quitan los préstamos y escenarios de este dispositivo.</p>
      <div class="sheet-actions">
        <button type="button" class="ghost-btn" data-close>Cancelar</button>
        <button type="button" class="done-btn danger-fill" data-ok>Borrar</button>
      </div>
    </div>`;
  back.querySelector('[data-close]').addEventListener('click', closeSheet);
  back.querySelector('[data-ok]').addEventListener('click', () => {
    data = normData(null);
    persist(); closeSheet(); render();
    toast('Datos borrados');
  });
}

function openInfoSheet() {
  const back = newSheet(true);
  back.innerHTML = `
    <div class="sheet" role="dialog" aria-modal="true" aria-label="Información">
      <span class="install-logo">${logoSVG(56)}</span>
      <h2 class="sheet-title">SimulaCTRL</h2>
      <p class="small muted">Versión ${APP_VERSION} · by OmT Finance</p>
      <p class="small">Simula la amortización anticipada de préstamos e hipotecas: fijo, variable o mixto, con la deducción por vivienda habitual de tu comunidad y las previsiones del Euribor. Calcula el plan con menos carga financiera y lo compara con tus propios escenarios.</p>
      <p class="small muted">Tus datos se guardan solo en este dispositivo. Del exterior solo se consulta el Euribor en el Banco Central Europeo. Es una simulación, no asesoramiento financiero ni fiscal.</p>
      <div class="sheet-actions"><button type="button" class="done-btn" data-close>Cerrar</button></div>
    </div>`;
  back.querySelector('[data-close]').addEventListener('click', closeSheet);
}

// ---------- Opciones de visualización (modo y fondo) ----------

const WALLS = {
  marea: { name: 'Marea', c: ['45 212 191', '253 230 138', '20 184 166', '15 118 110'] },
  arena: { name: 'Arena', c: ['253 230 138', '245 208 120', '217 170 80', '146 100 40'] },
  acero: { name: 'Acero', c: ['100 116 139', '148 163 184', '59 130 246', '30 64 175'] },
  noche: { name: 'Noche', c: ['99 102 241', '56 189 248', '30 64 175', '76 29 149'] },
};
const lightQuery = matchMedia('(prefers-color-scheme: light)');
let display = { theme: 'auto', wall: 'marea', ...load(DISPLAY_KEY, {}) };
if (!WALLS[display.wall]) display.wall = 'marea';

function applyDisplay() {
  const light = display.theme === 'light' || (display.theme === 'auto' && lightQuery.matches);
  document.documentElement.dataset.theme = light ? 'light' : 'dark';
  document.documentElement.dataset.wall = display.wall;
  document.querySelector('meta[name="theme-color"]').setAttribute('content', light ? '#f1faf7' : '#081413');
}
lightQuery.addEventListener('change', () => { if (display.theme === 'auto') applyDisplay(); });

function wallPreview(key) {
  const [c1, c2, c3, c4] = WALLS[key].c;
  const light = document.documentElement.dataset.theme === 'light';
  const a = light ? 0.4 : 0.5;
  const base = light ? '#f1faf7' : '#081413';
  return `radial-gradient(70% 60% at 15% 10%, rgb(${c1} / ${a}), transparent 70%), radial-gradient(60% 55% at 90% 25%, rgb(${c2} / ${a * 0.8}), transparent 72%),
    radial-gradient(70% 60% at 75% 95%, rgb(${c3} / ${a * 0.85}), transparent 70%), radial-gradient(60% 55% at 5% 85%, rgb(${c4} / ${a * 0.8}), transparent 72%), ${base}`;
}

function openDisplaySheet() {
  const back = newSheet();
  const draw = () => {
    back.innerHTML = `
      <div class="sheet" role="dialog" aria-modal="true" aria-label="Opciones de visualización">
        <h2 class="sheet-title">Opciones de visualización</h2>
        <p class="opt-label">Modo</p>
        <div class="seg" role="group" aria-label="Modo">
          ${[['dark', 'Oscuro'], ['light', 'Claro'], ['auto', 'Automático']].map(([v, l]) =>
            `<button type="button" data-theme-opt="${v}" class="${display.theme === v ? 'on' : ''}" aria-pressed="${display.theme === v}">${l}</button>`).join('')}
        </div>
        <p class="muted small">${display.theme === 'auto' ? 'Sigue el modo claro u oscuro del sistema.' : '&nbsp;'}</p>
        <p class="opt-label">Fondo</p>
        <div class="walls">
          ${Object.entries(WALLS).map(([k, w]) =>
            `<button type="button" class="wall ${display.wall === k ? 'on' : ''}" data-wall-opt="${k}" style="background:${wallPreview(k)}" aria-pressed="${display.wall === k}">${w.name}</button>`).join('')}
        </div>
        <div class="sheet-actions"><button class="done-btn" type="button">Listo</button></div>
      </div>`;
    back.querySelectorAll('[data-theme-opt]').forEach((b) => b.addEventListener('click', () => {
      display.theme = b.dataset.themeOpt;
      save(DISPLAY_KEY, display);
      applyDisplay();
      draw();
    }));
    back.querySelectorAll('[data-wall-opt]').forEach((b) => b.addEventListener('click', () => {
      display.wall = b.dataset.wallOpt;
      save(DISPLAY_KEY, display);
      applyDisplay();
      draw();
    }));
    back.querySelector('.done-btn').addEventListener('click', closeSheet);
  };
  draw();
}

// ---------- Aviso breve ----------

let toastTimer = 0;
function toast(text, { warn = false, stay = false } = {}) {
  const el = $('toast');
  el.textContent = text;
  el.classList.toggle('warn', warn);
  el.hidden = false;
  clearTimeout(toastTimer);
  if (!stay) toastTimer = setTimeout(() => { el.hidden = true; }, warn ? 5000 : 2400);
}

// ---------- Pantalla de inicio ----------
// Sin botón Entrar: el logo aparece (el arco se dibuja), se ve un instante y se pasa sola a la app
// con la transición de cristal, como en las demás apps.
const SPLASH_HOLD_MS = 1700;
const SPLASH_OUT_MS = 1200;
function enterApp() {
  const body = document.body;
  if (!$('splash') || body.classList.contains('entering')) return;
  body.classList.add('entering');
  setTimeout(() => {
    $('splash').remove();
    body.classList.remove('booting', 'entering');
    maybeShowInstallHint();
  }, SPLASH_OUT_MS);
}
setTimeout(enterApp, SPLASH_HOLD_MS);

// ---------- Aviso: añadir a la pantalla de inicio (solo móvil y tablet) ----------

const ua = navigator.userAgent;
const isIOS = /iPhone|iPad|iPod/.test(ua) || (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1);
const isAndroid = /Android/.test(ua);
const isStandalone = () => matchMedia('(display-mode: standalone)').matches || navigator.standalone === true;
const HINT_ICONS = {
  share: '<path d="M12 3.5v11M8 7.5l4-4 4 4"/><path d="M7 10.5H6a1.5 1.5 0 0 0-1.5 1.5v7A1.5 1.5 0 0 0 6 20.5h12a1.5 1.5 0 0 0 1.5-1.5v-7a1.5 1.5 0 0 0-1.5-1.5h-1"/>',
  more: '<circle cx="12" cy="5.5" r="1.5" fill="currentColor"/><circle cx="12" cy="12" r="1.5" fill="currentColor"/><circle cx="12" cy="18.5" r="1.5" fill="currentColor"/>',
  add: '<rect x="4" y="4" width="16" height="16" rx="3.5"/><path d="M12 8.5v7M8.5 12h7"/>',
  check: '<path d="M5 12.5l4.5 4.5L19 7.5"/>',
};
const hintIcon = (name) =>
  `<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${HINT_ICONS[name]}</svg>`;

function maybeShowInstallHint() {
  if (!(isIOS || isAndroid) || isStandalone()) return;
  if (load(INSTALL_HINT_KEY, null) === 'off') return;
  const steps = isIOS
    ? [
        ['share', 'Pulsa el botón <b>Compartir</b> de Safari (abajo en el iPhone, arriba en el iPad).'],
        ['add', 'Desliza hacia abajo y elige <b>Añadir a pantalla de inicio</b>.'],
        ['check', 'Pulsa <b>Añadir</b>. El icono de SimulaCTRL aparecerá junto a tus apps.'],
      ]
    : [
        ['more', 'Pulsa el menú <b>⋮</b> de Chrome, arriba a la derecha.'],
        ['add', 'Elige <b>Añadir a pantalla de inicio</b> o <b>Instalar aplicación</b>.'],
        ['check', 'Confirma con <b>Instalar</b>. El icono de SimulaCTRL aparecerá junto a tus apps.'],
      ];
  const back = newSheet(true);
  back.innerHTML = `
    <div class="sheet install-sheet" role="dialog" aria-modal="true" aria-labelledby="install-title">
      <span class="install-logo">${logoSVG(56)}</span>
      <h2 class="sheet-title" id="install-title">Añade SimulaCTRL a tu pantalla de inicio</h2>
      <p class="muted small">Así la abrirás como una app más, a pantalla completa y con un solo toque.</p>
      <ol class="install-steps">
        ${steps.map(([ic, text]) => `<li><span class="step-icon">${hintIcon(ic)}</span><span>${text}</span></li>`).join('')}
      </ol>
      <div class="install-footer">
        <label class="no-more"><input type="checkbox" id="install-no-more" /> No mostrar más</label>
        <button class="done-btn" type="button" id="install-ok">Aceptar</button>
      </div>
    </div>`;
  back.querySelector('#install-ok').addEventListener('click', () => {
    if (back.querySelector('#install-no-more').checked) save(INSTALL_HINT_KEY, 'off');
    closeSheet();
  });
}

// ---------- Siempre en vertical ----------
try { screen.orientation?.lock?.('portrait').catch(() => {}); } catch (_) { /* no compatible */ }

// ---------- Sin zoom (Safari en iOS ignora user-scalable=no) ----------
document.addEventListener('gesturestart', (e) => e.preventDefault());

applyDisplay();
render();
refreshMarket();

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => navigator.serviceWorker.register('sw.js').catch(() => {}));
}
