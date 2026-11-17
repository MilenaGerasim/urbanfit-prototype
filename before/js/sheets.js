// Шторки (компонент Bottom Sheet). Каждая: { html, mount?, locked?, keepHeight?, onDismiss? }
// Высота считается по содержимому (app.js → fitSheet): снизу всегда 35 px.
const Sheets = {};

// Блок оплаты/подтверждения: карты, промокод, итог, пояснения под линией, кнопка, оферта
const payBlock = ({ title = 'Оплата', lines, sumLabel = 'К оплате', total, notes = '', btn, promo = true, attr = 'data-pay' }) => `
  <p class="t-l-b pay-title">${title}</p>
  <div class="pay">
    <div class="ins">
      <div class="cards">
        <div class="pcard sel"><img class="logo" src="${A}ic-mastercard.svg" alt="">
          <div class="info"><p class="t-s-b">Mastercard</p><img class="dots4" src="${A}card-dots.svg" alt=""><p class="t-s c-sec">1234</p></div></div>
        <div class="pcard"><div class="logo add"><img src="${A}ic-add-card.svg" alt=""></div>
          <div class="info"><p class="t-s-b">Добавить карту</p></div></div>
      </div>
      ${promo ? `<label class="promo"><input class="t-m" placeholder="Промокод" autocomplete="off"><button class="apply" type="button">Применить</button></label>
      <p class="promo-msg t-s c-red" hidden>Промокод не найден</p>` : ''}
      <div class="total">
        <div class="lines t-m">${lines.map(([a, b]) => `<div class="ln"><p>${a}</p><p>${b}</p></div>`).join('')}</div>
        <div class="sum h5"><p>${sumLabel}</p><p>${money(total)}&nbsp;₽</p></div>
        ${notes ? `<hr>${notes}` : ''}
      </div>
      ${UI.btn(btn, attr)}
    </div>
    <p class="offer t-s">Нажимая на кнопку, вы соглашаетесь <br>с <b>Договором оферты</b></p>
  </div>`;

const notesList = items => items.length === 1
  ? `<p class="t-s c-sec">${items[0]}</p>`
  : `<ul class="t-s">${items.map(i => `<li>${i}</li>`).join('')}</ul>`;

// Промокод: ошибка появляется под полем, шторка растёт вверх (низ остаётся на 35 px)
const mountPromo = body => {
  const box = body.querySelector('.promo'); if (!box) return;
  const inp = box.querySelector('input'), msg = body.querySelector('.promo-msg');
  inp.addEventListener('input', () => {
    box.classList.toggle('typed', !!inp.value.trim());
    if (!msg.hidden) { msg.hidden = true; fitSheet(); }
  });
  box.querySelector('.apply').addEventListener('click', () => { msg.hidden = false; fitSheet(); });
};

const RENEW = 'Тариф будет продлеваться ежемесячно <br>по актуальной стоимости на момент продления';
const goHome = () => closeSheet(() => go('home', {}, { reset: true, anim: 'fade' }));

/* Новый пользователь: взнос + первый месяц */
Sheets.payNew = ({ tariff }) => {
  const t = TARIFFS[tariff], total = ENTRY_FEE + t.price;
  return {
    html: payBlock({
      lines: [['Вступительный взнос', `${money(ENTRY_FEE)}&nbsp;₽`], ['Ежемесячная подписка', `${money(t.price)}&nbsp;₽`]],
      total, notes: notesList([RENEW]), btn: `Оплатить · ${money(total)}&nbsp;₽`,
    }),
    mount(body) {
      mountPromo(body);
      body.querySelector('[data-pay]').addEventListener('click', () => runPayment('new', () => {
        const today = D.today();
        S.sub = { tariff, bought: today, billing: D.addMonths(today, 1) };
        openSheet('success', { title: `Тариф «${t.name}» активирован` });
      }, () => openSheet('payNew', { tariff })));
    },
  };
};

/* Переход на тариф дороже: перерасчёт за неиспользованные дни */
Sheets.payUpgrade = ({ tariff }) => {
  const t = TARIFFS[tariff], credit = unusedCredit(), total = Math.max(0, t.price - credit);
  return {
    html: payBlock({
      lines: [['Ежемесячная подписка', `${money(t.price)}&nbsp;₽`], ['Перерасчёт', `-${money(credit)}&nbsp;₽`]],
      total,
      notes: notesList(['Учтена стоимость неиспользованного периода текущего тарифа', RENEW.replace(' <br>', ' ')]),
      btn: `Оплатить · ${money(total)}&nbsp;₽`,
    }),
    mount(body) {
      mountPromo(body);
      body.querySelector('[data-pay]').addEventListener('click', () => runPayment('upgrade', () => {
        const today = D.today();
        S.sub = { tariff, bought: today, billing: D.addMonths(today, 1) };
        S.saveDiscount = false; S.pending = null;
        openSheet('success', { title: `Тариф «${t.name}» активирован` });
      }, () => openSheet('payUpgrade', { tariff })));
    },
  };
};

/* ---------- Заморозка ---------- */
const daysTxt = n => `${n} ${plural(n, ['день', 'дня', 'дней'])}`;

const ONCE = 'Изменить даты можно только один раз';
const ONCE_BUY = 'После покупки даты заморозки можно <br>изменить только один раз';

const applyFreeze = ({ start, end, days, edit, refund = 0 }) => {
  S.freeze = { start, end, days, price: freezePrice(days), edited: !!edit }; // edited — даты уже меняли (второй раз нельзя)
  const now = start <= D.today();
  const back = refund ? ` <br>Разница ${money(refund)}&nbsp;₽ вернётся на карту в&nbsp;течение 3 рабочих дней` : '';
  let title, text;
  if (edit) {
    title = 'Даты заморозки изменены';
    text = (now ? `Абонемент будет заморожен до <b>${D.short(end)}</b>` : `Заморозка начнётся <b>${D.short(start)}</b>`) + back;
  } else if (now) {
    title = 'Заморозка успешно активирована'; text = `Абонемент будет заморожен до <b>${D.short(end)}</b>`;
  } else {
    title = 'Заморозка успешно приобретена'; text = `Она автоматически активируется <br>с <b>${D.short(start)}</b>`;
  }
  openSheet('success', { title, text });
};

// Покупка или изменение дат: дороже — доплата разницы, дешевле — возврат, столько же — без оплаты
Sheets.freezePay = (p) => {
  const price = freezePrice(p.days), paid = p.edit ? S.freeze.price : 0, diff = price - paid;
  const label = `Заморозка на ${daysTxt(p.days)}`;
  if (p.edit && diff <= 0) {
    const refund = -diff;
    return {
      html: payBlock({
        title: 'Изменение дат', promo: false, attr: 'data-ok',
        lines: [[label, `${money(price)}&nbsp;₽`], ['Уже оплачено', `${money(paid)}&nbsp;₽`]],
        sumLabel: refund ? 'К возврату' : 'К оплате', total: refund,
        notes: notesList([refund ? `Разница вернётся на карту •••• 1234 <br>в течение 3 рабочих дней` : 'Новый период стоит столько же, доплата не нужна', ONCE]),
        btn: 'Подтвердить',
      }),
      mount(body) { body.querySelector('[data-ok]').addEventListener('click', () => applyFreeze({ ...p, refund })); },
    };
  }
  const lines = [[label, `${money(price)}&nbsp;₽`]];
  if (paid) lines.push(['Уже оплачено', `-${money(paid)}&nbsp;₽`]);
  return {
    // о правиле «один раз» предупреждаем уже при покупке, а не только при изменении дат
    html: payBlock({ title: p.edit ? 'Изменение дат' : 'Оплата', lines, total: diff, notes: notesList([p.edit ? ONCE : ONCE_BUY]), btn: `Оплатить · ${money(diff)}&nbsp;₽` }),
    mount(body) {
      mountPromo(body);
      body.querySelector('[data-pay]').addEventListener('click', () =>
        runPayment('freeze', () => applyFreeze(p), () => openSheet('freezePay', p)));
    },
  };
};

/* ---------- Вступительный взнос ---------- */
// Упрощённый пересказ п. 4.2.1 договора с сайта URBANFIT
function feeCard() {
  openCard(`
    <div class="tx"><p class="t-l-b">Вступительный взнос</p>
      <p class="t-m">Разовый платёж ${money(ENTRY_FEE)}&nbsp;₽ при&nbsp;оформлении абонемента, оплачивается вместе с первым месяцем и больше не списывается</p></div>
    <div class="btns">${UI.btn('Понятно', 'data-ok', 'sec')}</div>`,
  card => card.querySelector('[data-ok]').addEventListener('click', () => closeSheet()));
}

/* ---------- Переход на тариф дешевле ---------- */
// «Сменить тариф?» — Да / Нет
function askDowngrade(tariff) {
  openCard(`
    <div class="tx"><p class="t-l-b">Сменить тариф?</p><p class="t-m">Все преимущества действующего тарифа перестанут действовать</p></div>
    <div class="btns">${UI.btn('Да', 'data-yes', 'sec')}${UI.btn('Нет', 'data-no')}</div>`,
  card => {
    card.querySelector('[data-yes]').addEventListener('click', () => closeSheet(() => openSheet('reason', { tariff })));
    card.querySelector('[data-no]').addEventListener('click', () => keptCard(false));
  });
}

// «Все преимущества тарифа сохранились» (+ скидка 30%, если согласились)
function keptCard(discount) {
  openCard(`
    <div class="tx"><p class="t-l-b">Все преимущества тарифа <br>сохранились</p>
      <p class="t-m">${discount ? 'Скидка 30% автоматически применится <br>при следующем списании. <br>' : ''}Спасибо, что остались с нами!</p></div>
    <div class="btns">${UI.btn('На главную', 'data-home', 'sec')}</div>`,
  card => card.querySelector('[data-home]').addEventListener('click', goHome), goHome);
}

const REASONS = ['Хочу сократить расходы', 'Редко хожу в зал', 'Не использую все возможности тарифа', 'Изменился график',
  'Временно снижаю активность', 'Хочу более простой тариф', 'Другое'];

Sheets.reason = ({ tariff }) => ({
  html: `<div class="reason">
      <div class="q"><p class="t-l-b">Почему вы меняете тариф?</p>
        <div class="choices">${REASONS.map((r, i) => `<button class="choice" data-i="${i}"><img src="${A}radio-off.svg" alt=""><p class="t-m">${r}</p></button>`).join('')}</div></div>
      ${UI.btn('Продолжить', 'data-next', 'disable')}
    </div>`,
  mount(body) {
    const next = body.querySelector('[data-next]');
    body.querySelectorAll('.choice').forEach(c => c.addEventListener('click', () => {
      body.querySelectorAll('.choice img').forEach(img => img.src = `${A}radio-off.svg`);
      c.querySelector('img').src = `${A}radio-on.svg`;
      next.classList.remove('disable');
    }));
    next.addEventListener('click', () => openSheet('discount', { tariff }));
  },
});

Sheets.discount = ({ tariff }) => ({
  html: `<div class="result">
      <div class="res-in">
        <img class="pic" src="${A}img-discount.png" width="612" height="490" alt="">
        <div class="txt"><p class="h5">Сохраните тариф <br>со скидкой 30%</p><p class="t-m" style="width:370px">Оставайтесь с тарифом ещё на месяц <br>и пользуйтесь всеми его преимуществами</p></div>
      </div>
      <div class="btns">${UI.btn('Сохранить тариф', 'data-keep')}${UI.btn('Продолжить смену тарифа', 'data-go-on', 'sec')}</div>
    </div>`,
  mount(body) {
    body.querySelector('[data-keep]').addEventListener('click', () => { S.saveDiscount = true; keptCard(true); });
    body.querySelector('[data-go-on]').addEventListener('click', () => openSheet('confirmDowngrade', { tariff }));
  },
});

// Без оплаты сейчас: новый тариф начнёт действовать со следующей даты списания
Sheets.confirmDowngrade = ({ tariff }) => {
  const t = TARIFFS[tariff], date = billingDate();
  return {
    html: payBlock({
      title: 'Смена тарифа', promo: false, attr: 'data-ok',
      lines: [['Ежемесячная подписка', `${money(t.price)}&nbsp;₽`]],
      sumLabel: 'Сейчас к оплате', total: 0,
      notes: notesList([`Первое списание ${money(t.price)}&nbsp;₽ — ${D.full(date)}`, `До этой даты действуют преимущества тарифа «${TARIFFS[S.sub.tariff].name}»`]),
      btn: 'Подтвердить',
    }),
    mount(body) {
      body.querySelector('[data-ok]').addEventListener('click', () => {
        S.pending = { tariff };
        S.saveDiscount = false;
        openSheet('success', { title: 'Тариф будет изменён',
          text: `Преимущества вашего тарифа сохранятся до <b>${D.short(date)}</b>, после произойдёт переход на тариф «${t.name}»`, textWidth: 330 }); // 330 вместо 314: с кавычками «Дистрикт» иначе уходит на 4-ю строку
      });
    },
  };
};

/* Ожидаем оплату — крутящееся колесо (аннотация в Figma); высота как у предыдущей шторки */
Sheets.wait = () => ({
  locked: true, keepHeight: true,
  html: `<div class="wait"><img src="${A}ic-loader.svg" alt=""><p class="t-m-b">Ожидаем оплату</p></div>`,
});

// Успех — информационная шторка: смахнули или нажали мимо → на главную
Sheets.success = ({ title, text = 'Всё готово к вашей следующей тренировке', textWidth }) => ({
  onDismiss: goHome,
  html: `<div class="result">
      <div class="res-in">
        <img class="pic" src="${A}img-success.png" width="612" height="473" alt="">
        <div class="txt"><p class="h5">${title}</p><p class="t-m"${textWidth ? ` style="width:${textWidth}px"` : ''}>${text}</p></div>
      </div>
      ${UI.btn('На главную', 'data-home')}
    </div>`,
  mount(body) { body.querySelector('[data-home]').addEventListener('click', goHome); },
});

Sheets.fail = ({ retry }) => ({
  html: `<div class="result">
      <div class="res-in">
        <img class="pic" src="${A}img-fail.png" width="612" height="480" alt="">
        <div class="txt"><p class="h5">Что-то пошло не так</p><p class="t-m">Не удалось провести оплату. Попробуйте ещё раз</p></div>
      </div>
      <div class="btns">${UI.btn('Попробовать снова', 'data-retry', 'red')}${UI.btn('Отмена', 'data-cancel', 'sec')}</div>
    </div>`,
  mount(body) {
    body.querySelector('[data-retry]').addEventListener('click', retry);
    body.querySelector('[data-cancel]').addEventListener('click', () => closeSheet());
  },
});
