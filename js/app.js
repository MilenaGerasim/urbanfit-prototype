// Состояние прототипа и навигация
const S = {
  sub: null,          // { tariff, bought, billing } — появляется после первой покупки
  freeze: null,       // { start, end, days, price }
  saveDiscount: false,// согласился сохранить тариф со скидкой 30%
  pending: null,      // { tariff, from } — переход на дешёвый тариф со следующей даты списания
  failed: {},         // первая оплата в каждой ветке проваливается
};

const ENTRY_FEE = 3000; // вступительный взнос, только для новых

// Дата списания с учётом заморозки: старая дата + дни заморозки
const billingDate = () => S.freeze ? D.addDays(S.sub.billing, S.freeze.days) : S.sub.billing;
const nextCharge = () => {
  const t = TARIFFS[S.pending ? S.pending.tariff : S.sub.tariff];
  return S.saveDiscount ? Math.round(t.price * 0.7) : t.price;
};

/* ---------- Навигация: стек экранов + анимации iOS ---------- */
const stack = [];
const $screens = document.getElementById('screens');
const $status = document.getElementById('statusbar');
$status.innerHTML = UI.statusbar();

function build(name, params) {
  const make = Screens[name];
  if (!make) { console.warn('Нет экрана', name); return null; }
  const def = make(params || {});
  const el = document.createElement('div');
  el.className = 'screen';
  el.dataset.name = name;
  el.innerHTML = def.html;
  el._def = def;
  el._params = params || {};
  el.addEventListener('click', e => {
    const g = e.target.closest('[data-go]');
    if (g) { go(g.dataset.go, g.dataset.params ? JSON.parse(g.dataset.params) : {}); }
    if (e.target.closest('[data-back]')) back();
  });
  if (def.mount) def.mount(el, params || {});
  return el;
}

// light=true — белые иконки статус-бара (под ними тёмный фон)
const statusTone = light => $status.classList.toggle('dark', !light);

function setChrome(def) {
  statusTone(!!def.dark);
  document.querySelector('.homebar').classList.toggle('light', !!def.lightHome);
}

function show(el, inCls, prev, outCls) {
  $screens.appendChild(el);
  setChrome(el._def);
  if (prev) {
    el.classList.add(inCls);
    prev.classList.add(outCls);
    setTimeout(() => { prev.remove(); el.classList.remove(inCls); }, 460);
  }
}

// go(name, params, { replace, reset, anim })
function go(name, params, opts = {}) {
  const el = build(name, params);
  if (!el) return;
  const prev = stack[stack.length - 1];
  if (opts.reset) stack.length = 0; else if (opts.replace) stack.pop();
  stack.push({ name, params });
  show(el, opts.anim === 'fade' ? 'anim-fade-in' : 'anim-in-right', prev && prev.el, 'anim-out-left');
  stack[stack.length - 1].el = el;
  if (prev && (opts.reset || opts.replace)) prev.el && setTimeout(() => prev.el.remove(), 460);
}

function back() {
  if (stack.length < 2) return;
  const cur = stack.pop();
  const prevEntry = stack[stack.length - 1];
  // экран под нами перерисовываем: состояние могло измениться
  const el = build(prevEntry.name, prevEntry.params);
  prevEntry.el = el;
  $screens.insertBefore(el, cur.el);
  setChrome(el._def);
  el.classList.add('anim-in-left');
  cur.el.classList.add('anim-out-right');
  setTimeout(() => { cur.el.remove(); el.classList.remove('anim-in-left'); }, 460);
}

// стрелки на клавиатуре листают карусель (удобно на ПК)
document.addEventListener('keydown', e => { const top = stack[stack.length - 1]; top && top.el && top.el._keys && top.el._keys(e); });

/* ---------- Шторки поверх экрана (оплата, подтверждение) ---------- */
// Одна шторка: содержимое меняется на месте (оплата → ожидание → успех/провал), высота анимируется.
const $overlay = document.getElementById('overlay');
let sheetLocked = false; // во время «Ожидаем оплату» закрыть нельзя

let onDismiss = null;     // что делать, если шторку смахнули или нажали мимо

// Высота шторки = высота содержимого (снизу всегда 35 px), меняется плавно.
// keepHeight — оставить прежнюю высоту (экран «Ожидаем оплату»).
function fitSheet(keepHeight) {
  const sheet = $overlay.querySelector('.bsheet');
  if (!sheet) return;
  const from = sheet.offsetHeight;
  if (keepHeight && from) return;
  sheet.style.height = 'auto';
  const to = sheet.offsetHeight;
  if (!from) { sheet.style.height = to + 'px'; return; }
  sheet.style.height = from + 'px';
  void sheet.offsetHeight;
  sheet.style.height = to + 'px';
}

function dismiss() { if (sheetLocked) return; onDismiss ? onDismiss() : closeSheet(); }

// Смахивание вниз: тянем шторку пальцем, отпустили ниже 100 px — закрываем
function enableSwipeDown(el) {
  let y0 = null, dy = 0;
  el.addEventListener('pointerdown', e => {
    if (sheetLocked || e.target.closest('input, .cal-scroll')) return;
    y0 = e.clientY; dy = 0;
  });
  el.addEventListener('pointermove', e => {
    if (y0 === null) return;
    dy = Math.max(0, (e.clientY - y0) / (device._k || 1));
    if (dy > 6) { el.classList.add('drag'); el.style.translate = `0 ${dy}px`; }
  });
  const end = () => {
    if (y0 === null) return;
    y0 = null;
    el.classList.remove('drag'); el.style.translate = '';
    if (dy > 100) dismiss();
  };
  el.addEventListener('pointerup', end);
  el.addEventListener('pointercancel', end);
}

function openSheet(name, params = {}) {
  const def = Sheets[name](params);
  let sheet = $overlay.querySelector('.bsheet');
  if (!sheet) {
    $overlay.innerHTML = `<div class="dim"></div><div class="bsheet"><div class="ind"></div></div>`;
    sheet = $overlay.querySelector('.bsheet');
    $overlay.querySelector('.dim').addEventListener('click', dismiss);
    enableSwipeDown(sheet);
    document.querySelector('.homebar').classList.remove('light'); // на белой шторке полоска тёмная
    setTimeout(() => $overlay.classList.add('open'), 30);
  }
  sheet.querySelector('.body') && sheet.querySelector('.body').remove();
  const body = document.createElement('div');
  body.className = 'body';
  body.innerHTML = def.html;
  sheet.appendChild(body);
  sheetLocked = !!def.locked;
  onDismiss = def.onDismiss || null;
  useReadyImages(body);
  fitSheet(def.keepHeight);
  // картинка ещё грузится — пересчитаем высоту, когда загрузится
  body.querySelectorAll('img').forEach(img => { if (!img.complete) img.addEventListener('load', () => fitSheet(def.keepHeight), { once: true }); });
  if (def.mount) def.mount(body);
}

// Карточка по центру экрана (Floating Card). Если открыта шторка — сначала убираем её.
function openCard(html, mount, dismissFn) {
  const show = () => {
    $overlay.innerHTML = `<div class="dim"></div><div class="fcard">${html}</div>`;
    onDismiss = dismissFn || null;
    $overlay.querySelector('.dim').addEventListener('click', dismiss);
    if (mount) mount($overlay.querySelector('.fcard'));
    setTimeout(() => $overlay.classList.add('open'), 30);
  };
  if ($overlay.classList.contains('open')) closeSheet(show); else show();
}

function closeSheet(after) {
  $overlay.classList.remove('open');
  sheetLocked = false;
  onDismiss = null;
  const top = stack[stack.length - 1];
  if (top && top.el) setChrome(top.el._def);
  setTimeout(() => { $overlay.innerHTML = ''; after && after(); }, 420);
}

// «Оплатить» → ожидание → первая попытка в ветке проваливается, повтор — успех
function runPayment(branch, onSuccess, retry) {
  openSheet('wait');
  setTimeout(() => {
    if (!S.failed[branch]) { S.failed[branch] = true; openSheet('fail', { retry }); }
    else onSuccess();
  }, 1500);
}

// Неиспользованный остаток текущего тарифа: потрачен 1 день оплаченного периода
const unusedCredit = () => {
  const period = D.diffDays(S.sub.bought, S.sub.billing);
  return Math.round(TARIFFS[S.sub.tariff].price * (period - 1) / period);
};

/* ---------- Устройство: ПК — рамка iPhone, смартфон — на весь экран ---------- */
const device = document.querySelector('.device');
function fit() {
  const touch = matchMedia('(pointer: coarse)').matches;
  const mobile = touch && Math.min(innerWidth, innerHeight) < 600;
  document.body.classList.toggle('mobile', mobile);
  if (mobile) {
    // интерфейс 402 px шириной масштабируем ровно в ширину экрана
    const k = innerWidth / 402;
    device._k = k;
    device.style.transform = `scale(${k})`;
    device.style.height = `${innerHeight / k}px`;
  } else {
    device.style.height = '874px';
    const k = Math.min(1, (innerHeight - 60) / 874, (innerWidth - 60) / 402);
    device._k = k;
    device.style.transform = `scale(${k})`;
  }
}
addEventListener('resize', fit);
fit();

// Картинки шторок скачиваем и распаковываем один раз при открытии прототипа.
// В шторку вставляем этот же, уже готовый элемент — иначе браузер заново распаковывает
// картинку и показывает шторку на мгновение без неё.
const READY_IMG = {};
['img-success.png', 'img-fail.png', 'img-discount.png', 'ic-loader.svg'].forEach(f => {
  const i = new Image(); i.src = A + f; i.decode().catch(() => {}); READY_IMG[A + f] = i;
});
function useReadyImages(root) {
  root.querySelectorAll('img').forEach(ph => {
    const ready = READY_IMG[ph.getAttribute('src')];
    if (!ready || ready === ph) return;
    for (const a of ['class', 'width', 'height', 'alt']) ph.hasAttribute(a) ? ready.setAttribute(a, ph.getAttribute(a)) : ready.removeAttribute(a);
    ph.replaceWith(ready);
  });
}

go('home');
