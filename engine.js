'use strict';

// Motor de SimulaCTRL: sin pantalla ni almacenamiento, solo cálculo.
// Los meses se manejan como enteros (año × 12 + mes − 1) para que simular sea rápido; el buscador
// del plan recomendado repite la simulación miles de veces.

const ymToT = (ym) => Number(ym.slice(0, 4)) * 12 + Number(ym.slice(5, 7)) - 1;
const tToYm = (t) => `${Math.floor(t / 12)}-${String((t % 12) + 1).padStart(2, '0')}`;
const pmt = (balance, r, n) => (n <= 0 ? balance : r ? (balance * r) / (1 - (1 + r) ** -n) : balance / n);
const nper = (balance, r, payment) => {
  if (!r) return Math.ceil(balance / payment - 1e-9);
  const x = 1 - (balance * r) / payment;
  return x <= 0 ? Infinity : Math.ceil(-Math.log(x) / Math.log(1 + r) - 1e-9);
};

// ---------- Previsiones del Euribor a 12 meses ----------
// Actualizar a mano al menos cada trimestre. Fuente: informes citados, recogidos el 31-10-2026.
const EURIBOR_FALLBACK = { ym: '2026-10', value: 3.239 };
const FORECASTS = {
  updated: 'octubre de 2026',
  sources: [
    { name: 'CaixaBank Research', date: 'oct. 2026', dec26: 3.39, dec27: 2.65, dec28: null },
    { name: 'Bankinter', date: 'sep. 2026', dec26: 3.20, dec27: 3.05, dec28: 2.85 },
    { name: 'Panel Funcas', date: 'sep. 2026', dec26: 2.92, dec27: 2.70, dec28: null },
  ],
  // Media de las previsiones de arriba; a partir de 2029 no hay previsiones publicadas y se mantiene
  // un nivel de largo plazo prudente.
  path: [['2026-12', 3.17], ['2027-12', 2.80], ['2028-12', 2.85], ['2030-12', 2.75]],
};

const CURVES = {
  analistas: { name: 'Analistas', text: 'Media de CaixaBank Research, Bankinter y Funcas' },
  mercado: { name: 'Mercado', text: 'Lo que descuenta la curva de tipos del BCE, en directo' },
  plano: { name: 'Sin cambios', text: 'El último Euribor publicado, para siempre' },
  sube: { name: 'Sube 1 punto', text: 'Analistas + 1 punto en 2 años' },
  baja: { name: 'Baja 1 punto', text: 'Analistas − 1 punto en 2 años' },
  propia: { name: 'La mía', text: 'Tus propios valores' },
};

// Devuelve un array mes a mes desde `base` (primer mes conocido) y lo envuelve en una función por t
function buildCurve(kind, market, custom) {
  const monthly = market?.monthly || {};
  const lastYm = market?.last || EURIBOR_FALLBACK.ym;
  const lastVal = market?.value ?? EURIBOR_FALLBACK.value;
  const t0 = ymToT(lastYm);
  const anchors = (list) => {
    const pts = [[t0, lastVal], ...list.map(([ym, v]) => [ymToT(ym), v]).filter(([t]) => t > t0)];
    return (t) => {
      if (t >= pts.at(-1)[0]) return pts.at(-1)[1];
      for (let i = 1; i < pts.length; i++) {
        if (t <= pts[i][0]) {
          const [a, av] = pts[i - 1];
          const [b, bv] = pts[i];
          return av + ((bv - av) * (t - a)) / (b - a);
        }
      }
      return lastVal;
    };
  };
  const analysts = anchors(FORECASTS.path);
  let future = analysts;
  if (kind === 'plano') future = () => lastVal;
  else if (kind === 'sube') future = (t) => analysts(t) + Math.min(1, (t - t0) / 24);
  else if (kind === 'baja') future = (t) => Math.max(0, analysts(t) - Math.min(1, (t - t0) / 24));
  else if (kind === 'propia') {
    const pts = (custom || []).filter((c) => Number.isFinite(c.v)).map((c) => [`${c.y}-12`, c.v]);
    if (pts.length) future = anchors(pts);
  } else if (kind === 'mercado' && market?.forward) {
    const f = market.forward;
    // Cada dato es el tipo a 1 año dentro de k años: se sitúa en el mes k × 12 y se interpola
    future = (t) => {
      const x = (t - t0) / 12;
      const k = Math.min(f.length - 2, Math.floor(x));
      const w = Math.min(1, x - k);
      return Math.max(0, lastVal + f[k] + (f[k + 1] - f[k]) * w - f[0]);
    };
  }
  const fn = (t) => {
    if (t > t0) return future(t);
    return monthly[tToYm(t)] ?? lastVal;
  };
  fn.kind = kind;
  return fn;
}

// ---------- Deducciones por vivienda habitual ----------
// Solo las que dependen de lo que se paga cada año: son las que cambian el plan de amortización.
// Las de pago único al comprar no se incluyen. kind: 'all' = capital + intereses + gastos del
// préstamo; 'capital' = sin intereses; 'interest' = solo intereses; 'excess' = solo la subida de
// intereses desde el Euribor de diciembre de 2022 (Madrid). group: solo una regla de cada grupo.
const STATE_RULE = {
  id: 'estatal', group: 'base', name: 'Compra antes de 2013 (régimen transitorio)', pct: 15, kind: 'all', maxBase: 9040, perHolder: true,
  req: 'Comprada antes del 1-1-2013 y con deducción aplicada antes de 2013. 7,5 % estatal + 7,5 % autonómico.',
};
const FORAL_NOTE = 'Comprueba los límites de renta y las novedades de 2026 en tu Hacienda Foral.';
const R = {
  and: { id: 'and6', name: 'Menor de 35 años o vivienda protegida', pct: 6, kind: 'all', maxBase: 9040, age: true, req: 'Base imponible hasta 25.000 € (individual) o 30.000 € (conjunta).' },
  ast: { id: 'astvpo', name: 'Vivienda protegida', pct: 100, kind: 'all', maxDed: 1000, req: 'Vivienda con protección pública. Máximo 1.000 € en los años siguientes a la compra.' },
  can5: { id: 'can5', group: 'can', name: 'Base hasta 26.035 €', pct: 5, kind: 'all', maxBase: 6000, perHolder: true, req: 'Límite conjunto del 15 % de la cuota autonómica.' },
  can55: { id: 'can55', group: 'can', name: 'Base hasta 26.035 € y menor de 40', pct: 5.5, kind: 'all', maxBase: 6000, perHolder: true, age: true, req: 'Límite conjunto del 15 % de la cuota autonómica.' },
  can35: { id: 'can35', group: 'can', name: 'Base hasta 46.455 €', pct: 3.5, kind: 'all', maxBase: 6000, perHolder: true, req: 'Límite conjunto del 15 % de la cuota autonómica.' },
  can4: { id: 'can4', group: 'can', name: 'Base hasta 46.455 € y menor de 40', pct: 4, kind: 'all', maxBase: 6000, perHolder: true, age: true, req: 'Límite conjunto del 15 % de la cuota autonómica.' },
  clm150: { id: 'clm150', group: 'clm', name: 'Intereses, menor de 40 (renta baja)', pct: 100, kind: 'interest', maxDed: 150, age: true, req: 'Primera vivienda, tipo variable. Base hasta 12.500 € (individual) o 25.000 € (conjunta).' },
  clm100: { id: 'clm100', group: 'clm', name: 'Intereses, menor de 40', pct: 100, kind: 'interest', maxDed: 100, age: true, req: 'Primera vivienda, tipo variable. Base hasta 27.000 € (individual) o 36.000 € (conjunta).' },
  cyl: { id: 'cyl', name: 'Menor de 36 en el medio rural', pct: 15, kind: 'all', maxBase: 10000, age: true, req: 'Valor inferior a 150.000 €, municipio pequeño, base hasta 18.900 € (individual) o 31.500 € (conjunta).' },
  mad30: { id: 'mad30', name: 'Intereses, menor de 30', pct: 25, kind: 'interest', maxDed: 1031, age: true, req: 'Solo hasta el mes anterior a cumplir 30 años.' },
  madx: { id: 'madx', name: 'Subida de intereses (tipo variable)', pct: 25, kind: 'excess', maxDed: 300, req: 'Precio hasta 390.000 €; renta hasta 30.930 € por miembro. Incompatible con la de menores de 30.' },
  mur: { id: 'mur', name: 'Hasta 40 años', pct: 5, kind: 'all', maxBase: 9040, minusState: true, maxDed: 300, age: true, req: 'Base menor de 40.000 € y ahorro hasta 1.800 €. La base se reduce con lo que ya entre en la estatal.' },
  rio15: { id: 'rio15', group: 'rio', name: 'Menor de 36, compra desde 2013', pct: 15, kind: 'all', maxBase: 9000, age: true, req: 'Base liquidable hasta 18.030 € (individual) o 30.050 € (conjunta).' },
  rio5: { id: 'rio5', group: 'rio', name: 'Menor de 36, compra antes de 2013 (renta baja)', pct: 5, kind: 'all', maxBase: 9040, minusState: true, age: true, req: 'Base liquidable hasta 18.030 € (individual) o 30.050 € (conjunta).' },
  rio3: { id: 'rio3', group: 'rio', name: 'Menor de 36, compra antes de 2013', pct: 3, kind: 'all', maxBase: 9040, minusState: true, age: true, req: 'Vivienda en La Rioja.' },
  val: { id: 'val', name: 'Primera vivienda, hasta 35 años', pct: 5, kind: 'capital', maxBase: 9040, age: true, req: 'Sin intereses. Base hasta 30.000 € (individual) o 47.000 € (conjunta); se reduce desde 27.000 € o 44.000 €.' },
  ext3: { id: 'ext3', group: 'ext', name: 'Vivienda nueva, menor de 36', pct: 3, kind: 'capital', maxBase: 9040, age: true, req: 'Sin intereses. Base hasta 19.000 € (individual) o 24.000 € (conjunta).' },
  ext5: { id: 'ext5', group: 'ext', name: 'Vivienda nueva en municipio de menos de 3.000', pct: 5, kind: 'capital', maxBase: 9040, age: true, req: 'Sin intereses. Base hasta 28.000 € (individual) o 45.000 € (conjunta).' },
  ext25: { id: 'ext25', name: 'Intereses, menor de 36', pct: 25, kind: 'interest', maxBase: 1000, age: true, req: 'Base hasta 28.000 € (individual) o 45.000 € (conjunta).' },
};
const CAT9 = { id: 'cat', group: 'base', name: 'Compra antes de 30-7-2011 con caso especial', pct: 16.5, kind: 'all', maxBase: 9040, perHolder: true, req: '7,5 % estatal + 9 % autonómico si tienes 32 años o menos, un hijo, 183 días en paro o discapacidad del 65 %, y renta de hasta 30.000 €.' };
const foral = (id, name, pct, maxDed, extra = {}) => ({ id, group: 'foral', name, pct, kind: 'all', maxDed, perHolder: true, lifetime: 36000, req: FORAL_NOTE, ...extra });
const FORAL_GEN = (k) => foral(`${k}18`, 'General', 18, 1530);
const FORAL_YOUNG = (k) => foral(`${k}23`, 'Menor de 30 o familia numerosa', 23, 1955, { age: true });

const REGIONS = {
  andalucia: { name: 'Andalucía', rules: [STATE_RULE, R.and] },
  aragon: { name: 'Aragón', rules: [STATE_RULE] },
  asturias: { name: 'Asturias', rules: [STATE_RULE, R.ast] },
  baleares: { name: 'Illes Balears', rules: [STATE_RULE] },
  canarias: { name: 'Canarias', rules: [STATE_RULE, R.can5, R.can55, R.can35, R.can4] },
  cantabria: { name: 'Cantabria', rules: [STATE_RULE] },
  clm: { name: 'Castilla-La Mancha', rules: [STATE_RULE, R.clm150, R.clm100] },
  cyl: { name: 'Castilla y León', rules: [STATE_RULE, R.cyl] },
  cataluna: { name: 'Cataluña', rules: [STATE_RULE, CAT9] },
  valencia: { name: 'Comunitat Valenciana', rules: [STATE_RULE, R.val] },
  extremadura: { name: 'Extremadura', rules: [STATE_RULE, R.ext3, R.ext5, R.ext25] },
  galicia: { name: 'Galicia', rules: [STATE_RULE] },
  madrid: { name: 'Comunidad de Madrid', rules: [STATE_RULE, R.mad30, R.madx] },
  murcia: { name: 'Región de Murcia', rules: [STATE_RULE, R.mur] },
  rioja: { name: 'La Rioja', rules: [STATE_RULE, R.rio15, R.rio5, R.rio3] },
  ceuta: { name: 'Ceuta o Melilla', rules: [STATE_RULE] },
  alava: { name: 'Álava (foral)', foral: true, rules: [foral('ala18', 'General', 18, 1530), foral('ala20', 'Municipio de menos de 4.000 habitantes', 20, 1836), foral('ala25', 'Menor de 36 o colectivos protegidos', 25, 2346, { age: true })] },
  bizkaia: { name: 'Bizkaia (foral)', foral: true, rules: [FORAL_GEN('biz'), FORAL_YOUNG('biz')] },
  gipuzkoa: { name: 'Gipuzkoa (foral)', foral: true, rules: [FORAL_GEN('gip'), FORAL_YOUNG('gip')] },
  navarra: { name: 'Navarra (foral)', foral: true, rules: [] },
};
const MADRID_REF = 3.018; // Euribor de diciembre de 2022, referencia de la deducción de Madrid

// Reglas elegidas en un préstamo, con su límite de base ya multiplicado por las declaraciones
function activeRules(loan) {
  const d = loan.ded;
  if (!d?.on) return [];
  const pool = REGIONS[d.region]?.rules || [];
  const out = [];
  for (const sel of d.rules) {
    let rule = pool.find((r) => r.id === sel.id);
    if (sel.id === 'custom') {
      const c = d.custom;
      if (!(c.pct > 0)) continue;
      rule = { id: 'custom', name: 'Personalizada', pct: c.pct, kind: c.kind, maxBase: c.maxBase || 0, maxDed: c.maxDed || 0, perHolder: true };
    }
    if (rule) out.push({ ...rule, perHolder: true, until: sel.until || 9999 }); // límites por declaración
  }
  return out;
}

// ---------- Simulación ----------

// Todo lo que no cambia entre planes: se prepara una vez y se reutiliza
function prepare(loan, market, curveKind) {
  const env = loan.env;
  const t0 = ymToT(loan.nextPay);
  const rules = activeRules(loan);
  const curve = buildCurve(curveKind || env.curve, market, env.custom);
  const net = (env.returnGross * (1 - env.savingsTax / 100)) / 100;
  return {
    L: loan, t0, n: Math.max(1, Math.round(loan.years * 12 + loan.months)), rules, curve,
    tRev: loan.rateType === 'fixed' ? Infinity : ymToT(loan.nextReview || loan.nextPay),
    feeT: loan.feeUntil ? ymToT(loan.feeUntil) : 0,
    dfM: (1 + net) ** (1 / 12), infM: (1 + env.inflation / 100) ** (1 / 12),
    share: (loan.ded?.deductiblePct ?? 100) / 100,
    holders: Math.max(1, loan.ded?.holders || 1),
    used: loan.ded?.lifetimeUsed || 0,
    insDed: !!loan.insuranceDed,
  };
}

// Deducción de un año. a = [capital, extra, intereses, comisión, seguro, exceso]; se acumula el crédito de por vida
function yearDeduction(ctx, a, y, usedBox) {
  const { rules, holders, share } = ctx;
  if (!rules.length) return 0;
  const all = (a[0] + a[1] + a[2] + a[3] + (ctx.insDed ? a[4] : 0)) * share;
  let total = 0;
  let stateBase = 0;
  for (const r of rules) {
    if (y > r.until) continue;
    const base = r.kind === 'all' ? all : r.kind === 'capital' ? (a[0] + a[1]) * share : r.kind === 'interest' ? a[2] * share : a[5] * share;
    let cap = r.maxBase ? r.maxBase * (r.perHolder ? holders : 1) : Infinity;
    if (r.minusState) cap = Math.max(0, cap - stateBase);
    const counted = Math.min(base, cap);
    if (r.group === 'base') stateBase = counted;
    let ded = (counted * r.pct) / 100;
    if (r.maxDed) ded = Math.min(ded, r.maxDed * (r.perHolder ? holders : 1));
    if (r.lifetime) {
      ded = Math.min(ded, Math.max(0, r.lifetime * holders - usedBox.v));
      usedBox.v += ded;
    }
    total += ded;
  }
  return total;
}

// Importe anual a partir del cual pagar más ya no deduce más (0 si no hay regla que dependa de lo pagado)
function deductibleCap(ctx, y) {
  let cap = 0;
  for (const r of ctx.rules) {
    if (y > r.until || r.minusState || r.kind === 'interest' || r.kind === 'excess') continue;
    let c = r.maxBase ? r.maxBase * (r.perHolder ? ctx.holders : 1) : Infinity;
    if (r.maxDed) c = Math.min(c, ((r.maxDed * (r.perHolder ? ctx.holders : 1)) / r.pct) * 100);
    if (c < Infinity) cap = Math.max(cap, c);
  }
  return cap / ctx.share;
}

// plan = { items: [{ t, amount }] ordenados por t, mode: 'term' | 'payment' }.
// term = misma cuota, menos plazo; payment = mismo plazo, menos cuota. La amortización se aplica justo
// antes de la cuota de ese mes. Con detail devuelve además el cuadro mes a mes.
function simulate(ctx, plan, detail = false) {
  const { L, t0, n, curve, tRev, feeT, dfM, infM } = ctx;
  const items = plan.items;
  let bal = L.balance;
  let rem = n;
  let r = L.tin / 1200;
  let pay = pmt(bal, r, rem);
  const pay0 = pay;
  const review = L.review || 12;
  const lag = L.lag ?? 2;
  const insM = (L.insurance || 0) / 12;
  const y0 = Math.floor(t0 / 12);
  const yCount = Math.ceil(n / 12) + 3;
  const Y = new Float64Array(yCount * 6);

  // Cuotas ya pagadas este año (no cuentan en la carga, pero sí en el límite deducible)
  if (t0 % 12) {
    let b = bal;
    for (let k = 0; k < t0 % 12; k++) {
      const prev = (b + pay) / (1 + r);
      Y[0] += prev * r === 0 ? pay : pay - prev * r;
      Y[2] += prev * r;
      Y[4] += insM;
      b = prev;
    }
  }

  let interest = 0, fees = 0, ins = 0, extra = 0;
  let dfK = 1, infK = 1;
  let vp = 0, real = 0;
  let t = t0;
  let ip = 0;
  let cancelled = false;
  const rows = detail ? [] : null;
  const applied = detail ? [] : null;

  while (bal > 0.005 && rem > 0) {
    let revised = false;
    if (t >= tRev && (t - tRev) % review === 0) {
      r = Math.max(0, curve(t - lag) + L.spread) / 1200;
      pay = pmt(bal, r, rem);
      revised = true;
    }
    let ex = 0, fee = 0;
    while (ip < items.length && items[ip].t <= t) {
      const a = Math.min(items[ip++].amount, bal);
      if (a <= 0) continue;
      const pct = feeT && t >= feeT ? L.feeAfterPct : L.feePct;
      const f = (a * (pct || 0)) / 100;
      bal -= a; ex += a; fee += f;
      if (detail) applied.push({ t, amount: a, fee: f });
      if (bal <= 0.005) { bal = 0; cancelled = true; break; }
      if (plan.mode === 'term') rem = Math.max(1, Math.min(rem, nper(bal, r, pay)));
      else pay = pmt(bal, r, rem);
    }
    const yi = Math.floor(t / 12) - y0;
    const o = yi * 6;
    extra += ex; fees += fee;
    Y[o + 1] += ex; Y[o + 3] += fee;
    let int = 0, cap = 0, insNow = 0;
    if (!cancelled) {
      int = bal * r;
      cap = rem === 1 ? bal : Math.min(Math.max(pay - int, 0), bal);
      bal -= cap;
      rem--;
      insNow = insM;
      interest += int; ins += insNow;
      Y[o] += cap; Y[o + 2] += int; Y[o + 4] += insNow;
      if (L.rateType !== 'fixed') {
        // Parte de los intereses por encima de los que habría con el Euribor de dic. 2022
        const refR = Math.max(0, MADRID_REF + L.spread) / 1200;
        if (r > refR) Y[o + 5] += ((bal + cap) * (r - refR));
      }
    }
    const out = int + cap + ex + fee + insNow;
    vp += out / dfK;
    real += (int + fee + insNow) / infK;
    if (detail) rows.push({ t, rate: r * 1200, payment: int + cap, interest: int, capital: cap, extra: ex, fee, ins: insNow, balance: Math.max(0, bal), revised });
    t++;
    dfK *= dfM; infK *= infM;
    if (cancelled) break;
  }

  // Deducción: se cobra en la declaración de junio del año siguiente
  const box = { v: ctx.used };
  let ded = 0;
  const years = detail ? [] : null;
  const yEnd = Math.floor((t - 1) / 12);
  for (let y = y0; y <= yEnd; y++) {
    const o = (y - y0) * 6;
    const a = [Y[o], Y[o + 1], Y[o + 2], Y[o + 3], Y[o + 4], Y[o + 5]];
    const d = yearDeduction(ctx, a, y, box);
    ded += d;
    const k = (y + 1) * 12 + 5 - t0;
    vp -= d / dfM ** k;
    real -= d / infM ** k;
    if (detail) {
      const base = a[0] + a[1] + a[2] + a[3] + (ctx.insDed ? a[4] : 0);
      years.push({ y, capital: a[0], extra: a[1], interest: a[2], fee: a[3], ins: a[4], ded: d, base, cap: deductibleCap(ctx, y) });
    }
  }
  const res = {
    carga: interest + fees + ins - ded, interest, fees, ins, ded, extra, vp, real,
    months: t - t0, endT: t - 1, pay0,
  };
  if (detail) Object.assign(res, { rows, years, applied, cuotaEnd: rows.filter((x) => x.payment).at(-2)?.payment ?? pay });
  return res;
}

const planOf = (items, mode, ctx) => ({
  mode,
  items: items.map((i) => ({ t: Math.max(ctx.t0, i.t ?? ymToT(i.ym)), amount: i.amount })).filter((i) => i.amount > 0).sort((a, b) => a.t - b.t),
});

// Dinero disponible acumulado hasta el mes t
const availableAt = (b, t, t0) => (b.today || 0) + ((b.yearly || 0) * Math.max(0, t - t0)) / 12;

// Mes de la amortización de cada año
const planDates = (ctx, month) => {
  const out = [ctx.t0];
  const y0 = Math.floor(ctx.t0 / 12);
  for (let y = y0; ; y++) {
    const t = y * 12 + month - 1;
    if (t >= ctx.t0 + ctx.n) break;
    if (t > ctx.t0) out.push(t);
  }
  return out;
};

// Plan que completa cada año lo justo hasta el tope deducible, sin pasarse del dinero disponible
function fillPlan(ctx, mode, budget, { fromT = ctx.t0, toT = Infinity, limit = Infinity } = {}) {
  const items = [];
  let spent = 0;
  for (const t of planDates(ctx, budget.month || 1)) {
    if (t < fromT || t > toT) continue;
    const y = Math.floor(t / 12);
    const cap = deductibleCap(ctx, y);
    if (!cap) continue;
    for (let pass = 0; pass < 2; pass++) {
      const s = simulate(ctx, { items, mode }, true);
      const row = s.years.find((v) => v.y === y);
      if (!row) return items;
      const gap = cap - row.base;
      const room = Math.min(availableAt(budget, t, ctx.t0) - spent, limit - spent);
      const a = Math.floor(Math.min(gap, room) / 50) * 50;
      if (a < Math.max(50, budget.min || 0)) break;
      const same = items.find((i) => i.t === t);
      if (same) same.amount += a; else items.push({ t, amount: a });
      spent += a;
    }
  }
  return items;
}

// ---------- Plan recomendado ----------
// Busca el reparto por años con menos carga financiera (o menor valor actual). Parte de varios
// repartos razonables y los mejora moviendo importes entre años mientras el resultado mejore.
async function optimize(ctx, budget, goal, onTick, signal) {
  const dates = planDates(ctx, budget.month || 1);
  const N = dates.length;
  const lastAvail = availableAt(budget, dates[N - 1], ctx.t0);
  if (lastAvail < 50) return { items: [], mode: 'term' };
  const minA = budget.min || 0;
  const sizes = [50000, 20000, 10000, 5000, 2000, 1000, 500, 100].filter((c) => c <= lastAvail);
  if (!sizes.length) sizes.push(50);
  const objective = (a, mode) => {
    const items = [];
    for (let i = 0; i < N; i++) if (a[i] > 0) items.push({ t: dates[i], amount: a[i] });
    const s = simulate(ctx, { items, mode });
    return (goal === 'vp' ? s.vp : s.carga) + items.length; // 1 € por cada operación: evita planes con migajas
  };
  const feasible = (a) => {
    let c = 0;
    for (let i = 0; i < N; i++) {
      if (a[i] < 0) return false;
      if (a[i] > 0 && a[i] < minA) return false;
      c += a[i];
      if (c > availableAt(budget, dates[i], ctx.t0) + 0.5) return false;
    }
    return true;
  };
  const seedsFor = (mode) => {
    const now = new Array(N).fill(0);
    now[0] = Math.floor(availableAt(budget, dates[0], ctx.t0));
    for (let i = 1; i < N; i++) now[i] = Math.floor(availableAt(budget, dates[i], ctx.t0) - availableAt(budget, dates[i - 1], ctx.t0));
    const none = new Array(N).fill(0);
    const seeds = [now, none];
    if (ctx.rules.length) {
      const fill = new Array(N).fill(0);
      for (const it of fillPlan(ctx, mode, budget)) fill[dates.indexOf(it.t)] = it.amount;
      seeds.push(fill);
      // Primero el hueco deducible y lo que sobra del dinero, el primer año sin deducción
      const lump = fill.slice();
      const rest = lastAvail - lump.reduce((x, v) => x + v, 0);
      if (rest > 0) lump[N - 1] += Math.floor(rest);
      seeds.push(lump);
    }
    return seeds;
  };

  const deadline = performance.now() + 6000;
  let last = performance.now();
  let best = null;
  let done = 0;
  const modes = ['term', 'payment'];
  const seedLists = modes.map(seedsFor);
  const total = seedLists.flat().length;
  for (let m = 0; m < 2; m++) {
    for (const seed of seedLists[m]) {
      const a = feasible(seed) ? seed.slice() : new Array(N).fill(0);
      let cost = objective(a, modes[m]);
      for (const c of sizes) {
        let moved = true;
        while (moved && performance.now() < deadline) {
          moved = false;
          for (let i = 0; i < N; i++) {
            const targets = [i + 1, i - 1, 0, i + 2, i + 3, -1, -2];
            for (const j of targets) {
              if (j >= N || j === i || j < -2) continue;
              const old = [a[i], j >= 0 ? a[j] : 0];
              if (j === -1) a[i] += c;                 // añadir
              else if (j === -2) a[i] = Math.max(0, a[i] - c); // quitar
              else { if (a[i] <= 0) continue; const x = Math.min(c, a[i]); a[i] -= x; a[j] += x; }
              if (feasible(a)) {
                const v = objective(a, modes[m]);
                if (v < cost - 0.5) { cost = v; moved = true; continue; }
              }
              a[i] = old[0];
              if (j >= 0) a[j] = old[1];
            }
            if (performance.now() - last > 24) {
              await new Promise((r) => setTimeout(r));
              last = performance.now();
              if (signal?.stop) return null;
              onTick?.((done + 0.5) / total);
            }
          }
        }
      }
      if (!best || cost < best.cost) best = { cost, a: a.slice(), mode: modes[m] };
      done++;
      onTick?.(done / total);
    }
  }
  // Solo lo que se llega a aplicar: lo que sobraría tras cancelar el préstamo no entra en el plan
  const items = dates.map((t, i) => ({ t, amount: best.a[i] })).filter((i) => i.amount > 0);
  const applied = simulate(ctx, { items, mode: best.mode }, true).applied;
  return { mode: best.mode, items: applied.map((i) => ({ ym: tToYm(i.t), amount: Math.ceil(i.amount) })) };
}

// Plan «todo cuanto antes»: lo disponible hoy y el ahorro de cada año en su fecha
function lumpPlan(ctx, budget) {
  const dates = planDates(ctx, budget.month || 1);
  const out = [];
  dates.forEach((t, i) => {
    const a = i === 0 ? availableAt(budget, t, ctx.t0) : availableAt(budget, t, ctx.t0) - availableAt(budget, dates[i - 1], ctx.t0);
    if (a >= Math.max(1, budget.min || 0)) out.push({ ym: tToYm(t), amount: Math.round(a) });
  });
  return out;
}
