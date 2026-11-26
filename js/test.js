// Тестовый режим без модератора: …/urbanfit-prototype/?test
// Одна общая ссылка. Каждый участник получает случайный код (K7F2), он хранится в браузере
// и ставится меткой в Clarity. Задания идут одной историей (без сброса состояния):
// оформить абонемент → повысить тариф → пауза → перенести паузу.
// 2026-11-26: задание «перейти на самый недорогой тариф» убрано (в нём не было правок, поняли 19 из 22);
// колонки формы не сдвигаем — у каждого вопроса свой номер col, колонка 2 остаётся пустой («—»).
// Прототип сам понимает, что задание выполнено (тариф сменился, пауза оформлена…),
// и после возврата на экран показывает вопрос. Ответы с кодом уходят в Google Форму.
//
// Как подключить Google Форму:
// 1. Создать форму: поле «Код» + 5 полей «Абзац» — по одному на вопрос, в порядке вопросов ниже
//    (4 вопроса после заданий + последний общий).
// 2. ⋮ → «Получить ссылку с заполненными ответами» → вписать что угодно → скопировать ссылку.
//    В ней будут entry.123456=… — это номера полей.
// 3. Вписать сюда адрес формы (…/formResponse) и номера полей. Подключено 2026-11-24.
const TEST_FORM = {
  url: 'https://docs.google.com/forms/d/e/1FAIpQLSeYXlK6eBF573r8r6jEL1gJjk3PyDcn99iVY6VC3c-KWcac7w/formResponse',
  code: 'entry.1049290107',
  answers: ['entry.2066342450', 'entry.2021498407', 'entry.710240063', 'entry.243653338', 'entry.741309879'], // по порядку вопросов
};

const isSpa = id => id === 'megapolis' || id === 'neo';
const TEST_TASKS = [
  {
    id: 'buy',
    text: 'Оформите абонемент, чтобы ходить на&nbsp;групповые тренировки. Спа-зона вам не&nbsp;нужна',
    done: () => !!S.sub,
  },
  {
    id: 'upgrade',
    text: 'Вы решили, что спа-зона <span class="nowrap">всё-таки</span> нужна. Перейдите на&nbsp;тариф <span class="nowrap">со спа-зоной</span>',
    q: 'Вы заплатили полную стоимость нового тарифа или&nbsp;меньше? Как вы думаете, почему?',
    col: 0, // колонка формы «Перерасчёт»
    look: false, // сумма видна только в шторке оплаты — в приложении её уже не найти
    ensure: () => { if (!S.sub || isSpa(S.sub.tariff)) S.sub = sub('city'); }, // в разминке купили спа — начинаем с «Сити»
    done: () => isSpa(S.sub.tariff),
  },
  {
    id: 'freeze',
    text: 'Вы уезжаете. Поставьте абонемент на&nbsp;паузу на&nbsp;2&nbsp;недели, начиная со&nbsp;следующего понедельника',
    q: 'Пауза была платной или бесплатной? Легко&nbsp;ли было найти, где её&nbsp;оформить?',
    col: 2,
    look: false,
    ensure: () => { if (!S.sub) S.sub = sub('city'); S.subScrollHinted = false; },
    done: () => !!S.freeze,
  },
  {
    id: 'freezeEdit',
    text: 'Планы поменялись: вы&nbsp;уезжаете уже сегодня. Перенесите начало паузы на&nbsp;сегодня',
    q: 'Сможете ли вы потом ещё раз поменять даты паузы? Почему <span class="nowrap">вы так думаете?</span>',
    col: 3,
    ensure: () => {
      if (!S.sub) S.sub = sub('city');
      if (!S.freeze) { const start = D.addDays(D.today(), 7), days = 14;
        S.freeze = { start, end: D.addDays(start, days - 1), days, price: freezePrice(days), edited: false }; }
    },
    done: () => !!S.freeze && S.freeze.edited,
  },
];
const FINAL_Q = 'Что в приложении показалось вам непонятным или неудобным?';

// Запасное состояние (если задание пропустили или перезагрузили страницу): абонемент куплен сегодня
function sub(tariff) { const t = D.today(); return { tariff, bought: t, billing: D.addMonths(t, 1) }; }

(() => {
  if (!new URLSearchParams(location.search).has('test')) return;

  // ---------- код и прогресс (в приватном окне может не сохраниться — тогда просто в памяти) ----------
  const KEY = 'uf-test';
  const load = () => { try { return JSON.parse(localStorage.getItem(KEY)) || {}; } catch { return {}; } };
  const save = () => { try { localStorage.setItem(KEY, JSON.stringify(st)); } catch {} };
  const st = load();
  if (!st.code) {
    const abc = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
    st.code = Array.from({ length: 4 }, () => abc[Math.floor(Math.random() * abc.length)]).join('');
    st.step = -1; st.answers = [];
    save();
  }
  const cl = (...a) => { if (window.clarity) clarity(...a); };
  cl('identify', st.code); cl('set', 'respondent', st.code); cl('set', 'mode', 'test');

  const FINAL_COL = 4; // номер колонки формы у последнего вопроса
  // Ответ сразу сохраняется в браузере и в Clarity (видно, даже если человек бросил тест на середине)
  function send(qi, text) {
    st.answers[qi] = text; save();
    cl('set', 'answer' + (qi + 1), text.slice(0, 250));
  }
  // В Google Форму — одной строкой со всеми ответами, после последнего вопроса
  function submitAll() {
    if (!TEST_FORM.url || st.sent) return;
    const body = new URLSearchParams({ [TEST_FORM.code]: st.code });
    TEST_FORM.answers.forEach((e, qi) => body.append(e, st.answers[qi] || '—'));
    fetch(TEST_FORM.url, { method: 'POST', mode: 'no-cors', body }).catch(() => {});
    st.sent = true; save();
  }

  // ---------- слой теста поверх прототипа ----------
  const phone = document.getElementById('phone');
  const layer = document.createElement('div'); layer.className = 'tlayer';
  const pill = document.createElement('button'); pill.className = 'tpill';   // «Задание 2 из 5» — напоминание
  const back = document.createElement('button'); back.className = 'tback';  // «Вернуться к вопросу»
  back.innerHTML = '<span>Вернуться к вопросу</span>';
  phone.append(pill, back, layer);

  // на «Главной» справа колокольчик — плашка встаёт левее
  const origTrack = track;
  track = name => {
    origTrack(name);
    if (/^(sheet|card)-/.test(name)) return;
    pill.classList.toggle('on-home', name === 'home');
    check();
  };
  pill.classList.add('on-home');

  const total = TEST_TASKS.length;
  const label = i => `<p class="t-s c-sec">Задание ${i + 1} из ${total}</p>`;
  let active = false; // задание выполняется (карточек нет)

  function card(html, mount) {
    layer.innerHTML = `<div class="tdim"></div><div class="tcard">${html}</div>`;
    layer.classList.add('open');
    pill.classList.remove('show'); back.classList.remove('show');
    mount && mount(layer.querySelector('.tcard'));
  }
  const hide = () => { layer.classList.remove('open'); setTimeout(() => { if (!layer.classList.contains('open')) layer.innerHTML = ''; }, 300); };

  function intro() {
    card(`
      <div class="tx"><p class="t-l-b">Проверим <span class="nowrap">приложение UrbanFit</span></p>
        <p class="t-m c-sec">${total} ${plural(total, ['короткое задание', 'коротких задания', 'коротких заданий'])} — около 8&nbsp;минут. Правильных ответов нет: мы&nbsp;проверяем приложение, а&nbsp;не&nbsp;вас</p></div>
      <div class="tlist t-s">
        <p>Действуйте так, как действовали бы в&nbsp;обычном приложении</p>
        <p>Следующее задание появится само, когда вы&nbsp;закончите</p>
        <p>Деньги не списываются. Если оплата не&nbsp;прошла — попробуйте ещё раз</p>
      </div>
      <div class="btns">${UI.btn('Начать', 'data-ok')}</div>`,
    c => c.querySelector('[data-ok]').addEventListener('click', () => task(0)));
  }

  function task(i) {
    st.step = i; save();
    const t = TEST_TASKS[i];
    t.ensure && t.ensure();
    card(`
      <div class="tx">${label(i)}<p class="t-l-b">${t.text}</p></div>
      <div class="btns">${UI.btn('Приступить', 'data-ok')}</div>`,
    c => c.querySelector('[data-ok]').addEventListener('click', () => {
      hide(); active = true;
      pill.innerHTML = `<span>Задание ${i + 1}/${total}</span>`; pill.classList.add('show');
      cl('event', 'task-' + t.id);
      // каждое задание начинается с «Главной», перерисованной под текущее состояние
      // (после пропуска или перезагрузки состояние могло поменяться)
      $overlay.classList.remove('open'); $overlay.innerHTML = ''; sheetLocked = false; onDismiss = null;
      $screens.innerHTML = ''; stack.length = 0; go('home');
    }));
  }

  // Задание выполнено — проверяем при каждом возврате на экран (после окна успеха и т.п.)
  function check() {
    if (!active) return;
    const i = st.step, t = TEST_TASKS[i];
    if (!t || !t.done()) return;
    active = false;
    cl('event', 'done-' + t.id);
    setTimeout(() => next(i), 450); // дать экрану доехать
  }
  function next(i) {
    const t = TEST_TASKS[i];
    if (t.q) question(i); else advance(i);
  }
  function advance(i) {
    if (i + 1 < total) task(i + 1);
    else { st.step = total; save(); question(total); }
  }

  // Напоминание: текст задания + «пропустить», если не получается
  pill.addEventListener('click', () => {
    const i = st.step, t = TEST_TASKS[i];
    active = false;
    card(`
      <div class="tx">${label(i)}<p class="t-l-b">${t.text}</p></div>
      <div class="btns">${UI.btn('Продолжить', 'data-ok')}</div>
      <button class="tskip t-s" data-skip>Не получается — пропустить задание</button>`,
    c => {
      c.querySelector('[data-ok]').addEventListener('click', () => { hide(); active = true; pill.classList.add('show'); check(); });
      c.querySelector('[data-skip]').addEventListener('click', () => { cl('event', 'skip-' + t.id); next(i); });
    });
  });

  const drafts = {};
  function question(i) {
    const last = i === total, q = last ? FINAL_Q : TEST_TASKS[i].q, qi = last ? FINAL_COL : TEST_TASKS[i].col;
    cl('event', last ? 'question-final' : 'question-' + TEST_TASKS[i].id);
    card(`
      <div class="tx">${last ? '<p class="t-s c-sec">Последний вопрос</p>' : label(i)}<p class="t-m-b">${q}</p></div>
      <div class="tfield"><textarea class="t-m" rows="4" placeholder="${last ? 'Можно пропустить' : 'Ваш ответ'}"></textarea><p class="t-s terr"></p></div>
      <div class="btns">${UI.btn(last ? 'Отправить' : 'Дальше', 'data-ok')}${!last && TEST_TASKS[i].look === false ? '' : UI.btn('Посмотреть в приложении', 'data-look', 'sec')}</div>`,
    c => {
      const ta = c.querySelector('textarea'), err = c.querySelector('.terr'), f = c.querySelector('.tfield');
      ta.value = drafts[qi] || '';
      ta.addEventListener('input', () => { drafts[qi] = ta.value; err.textContent = ''; f.classList.remove('bad'); });
      // свернуть вопрос и полистать приложение; текст ответа сохраняется
      c.querySelector('[data-look]')?.addEventListener('click', () => {
        hide(); back.classList.add('show'); back.onclick = () => question(i);
        cl('event', 'look-' + qi);
      });
      c.querySelector('[data-ok]').addEventListener('click', () => {
        const v = ta.value.trim();
        if (!v && !last) { err.textContent = 'Напишите хотя бы пару слов'; f.classList.add('bad'); return; }
        if (v) send(qi, v);
        if (last) { st.step = total + 1; save(); submitAll(); done(); } else advance(i);
      });
    });
  }

  function done() {
    card(`
      <img class="tkitten" src="${A}img-kitten.jpg" width="240" height="246" alt="Котёнок со штангой: «сегодня у меня день попы»">
      <div class="tx"><p class="t-l-b">Спасибо!</p><p class="t-m c-sec">Ответы отправлены. Вы очень помогли сделать приложение удобнее</p></div>`);
  }

  // Продолжаем с того места, где человек остановился (перезагрузил страницу)
  if (st.step > total) done();
  else if (st.step === total) question(total);
  else if (st.step >= 0) task(st.step);
  else intro();
})();
