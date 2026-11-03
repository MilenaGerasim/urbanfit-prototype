// Экраны прототипа. Каждый возвращает { html, dark?, mount? }.
// dark — статус-бар белыми иконками (тёмный верх экрана).
const Screens = {};

/* ---------- Тарифы: карусель браслетов + шторка преимуществ ---------- */
Screens.tariffs = (p) => {
  let idx = Math.max(0, TARIFF_ORDER.indexOf(p.tariff || 'district'));
  const isNew = !S.sub;

  const bgs = TARIFF_ORDER.map((id, i) => {
    const [a, b] = screenBg(TARIFFS[id]);
    return `<div class="tf-bg" data-i="${i}" style="opacity:${i === idx ? 1 : 0}"><i style="background-color:var(--bg-dark-primary)"></i><i style="background-image:${a.replace(/"/g, '&quot;')}"></i><i style="background-image:${b.replace(/"/g, '&quot;')}"></i></div>`;
  }).join('');
  const brs = TARIFF_ORDER.map((id, i) => `<div class="tf-br" data-i="${i}"><img src="${A}${TARIFFS[id].main}" alt=""></div>`).join('');
  const rows = BENEFITS.map(([ic, t, d], i) => `
      <div class="bf" data-n="${i}"><i class="ib" style="--m:url(../assets/${ic.split('|')[0]});${ic.includes('|') ? `--s:${ic.split('|')[1]}` : ''}"></i>
        <div class="tx"><p class="t-m">${t}</p><p class="t-s">${d}</p></div></div>`).join('');

  return {
    dark: true, lightHome: true,
    html: `
    <div class="tariffs" style="position:absolute;inset:0">
      ${bgs}<div class="tf-noise"></div>
      <div class="tf-track">${brs}</div>
      <div class="tf-info"></div>
      <div class="dots">${TARIFF_ORDER.map(() => '<i></i>').join('')}</div>
      <div class="tf-scroll"><div class="tf-spacer"></div>
        <div class="sheet-dark ${isNew ? 'with-fee' : ''}"><div class="ind"></div>
          <div class="sheet-head"><div class="sh-name"></div><div class="dots sh-dots">${TARIFF_ORDER.map(() => '<i></i>').join('')}</div></div>
          <div class="benefits">${rows}</div></div>
      </div>
      <div class="tf-fade"></div>
      <div class="tf-bottom"></div>
      ${UI.appBar('Тарифы')}
    </div>`,
    mount(el) {
      const info = el.querySelector('.tf-info'), bottom = el.querySelector('.tf-bottom');
      const render = (animate) => {
        const t = TARIFFS[TARIFF_ORDER[idx]], id = TARIFF_ORDER[idx];
        el.querySelectorAll('.tf-bg').forEach(b => b.style.opacity = +b.dataset.i === idx ? 1 : 0);
        // −1 слева, 0 в центре, +1 справа; дальние уходят за край
        el.querySelectorAll('.tf-br').forEach(b => {
          const r = +b.dataset.i - idx;
          const pos = { '-2': [-350, 195], '-1': [-147, 195], '0': [56, 296], '1': [360, 195], '2': [563, 195] }[Math.max(-2, Math.min(2, r))];
          b.className = 'tf-br ' + (r === 0 ? 'main' : r < 0 ? 'side left' : 'side right');
          b.style.left = pos[0] + 'px'; b.style.width = pos[1] + 'px';
          b.style.opacity = Math.abs(r) > 1 ? 0 : 1;
        });
        const set = () => { info.innerHTML = `<div class="nm"><p class="h4">${t.name}</p><p class="t-m">${t.sub}</p></div>${UI.price(t.price)}`; info.style.opacity = 1; };
        if (animate) { info.style.opacity = 0; setTimeout(set, 180); } else set();
        el.querySelectorAll('.dots').forEach(g => g.querySelectorAll('i').forEach((d, i) => d.classList.toggle('on', i === idx)));
        el.querySelector('.sh-name').innerHTML = `<p class="t-l-b">${t.name}</p>${UI.price(t.price)}`;
        el.querySelectorAll('.bf').forEach(r => {
          r.classList.toggle('off', +r.dataset.n >= t.active);
          if (r.dataset.n === '1') r.querySelector('p').textContent = `Гостевой доступ для ${t.friends}`;
        });
        // кнопка внизу
        let html;
        // над кнопкой у нового — плашка вступительного взноса (кроме Нео)
        const fee = isNew && id !== 'neo';
        el.querySelector('.sheet-dark').classList.toggle('with-fee', fee);
        if (id === 'neo') {
          // Нео продаётся, только когда выбран клуб URBANFIT. NEO; у пользователя выбран Академическая (смену клуба не делаем)
          html = UI.btn('Доступен только в клубе URBANFIT. NEO', '', 'dark disable');
        } else if (isNew) {
          html = `<div class="fee" data-act="fee"><div class="r1 t-m-b"><p>Вступительный взнос</p><p>${money(ENTRY_FEE)}&nbsp;₽</p></div>
            <div class="r2"><p class="t-s">* оплачивается 1 раз при оформлении</p><img src="${A}ic-more-info.svg" alt=""></div></div>
            ${UI.btn(`К оплате · ${money(t.price + ENTRY_FEE)}&nbsp;₽`, 'data-act="pay"', 'dark')}`;
        } else if (id === S.sub.tariff) {
          html = UI.btn('Это ваш тариф', '', 'dark disable');
        } else {
          html = UI.btn('Сменить тариф', 'data-act="change"', 'dark');
        }
        bottom.innerHTML = html;
      };
      // при смене тарифа список преимуществ уезжает в сторону свайпа — видно, что сравниваешь тарифы
      const list = el.querySelector('.benefits');
      const goTo = i => {
        if (i < 0 || i > 3 || i === idx) return;
        list.classList.remove('slide-l', 'slide-r'); void list.offsetWidth;
        list.classList.add(i > idx ? 'slide-l' : 'slide-r');
        idx = i; render(true);
      };
      render(false);

      bottom.addEventListener('click', e => {
        const a = e.target.closest('[data-act]'); if (!a) return;
        const id = TARIFF_ORDER[idx];
        if (a.dataset.act === 'fee') feeCard();
        else if (a.dataset.act === 'pay') openSheet('payNew', { tariff: id });
        else if (TARIFFS[id].price > TARIFFS[S.sub.tariff].price) openSheet('payUpgrade', { tariff: id });
        else askDowngrade(id);
      });
      el.querySelectorAll('.tf-br').forEach(b => b.addEventListener('click', () => goTo(+b.dataset.i)));

      // свайп влево/вправо — и над браслетами, и над поднятой шторкой; браслеты едут за пальцем
      const track = el.querySelector('.tf-track');
      let sx = null, sy = 0, horiz = null;
      el.addEventListener('pointerdown', e => { sx = e.clientX; sy = e.clientY; horiz = null; });
      el.addEventListener('pointermove', e => {
        if (sx === null) return;
        const dx = e.clientX - sx, dy = e.clientY - sy;
        if (horiz === null && Math.hypot(dx, dy) > 8) horiz = Math.abs(dx) > Math.abs(dy);
        if (horiz) {
          const edge = (idx === 0 && dx > 0) || (idx === 3 && dx < 0); // у края тянется туже
          track.classList.add('drag');
          brs.forEach(b => b.style.translate = `${dx / (device._k || 1) * (edge ? .2 : .5)}px`);
        }
      });
      const brs = [...track.querySelectorAll('.tf-br')];
      const release = () => { track.classList.remove('drag'); brs.forEach(b => b.style.translate = ''); };
      const end = e => {
        if (sx === null) return;
        const dx = e.clientX - sx;
        release();
        if (horiz && Math.abs(dx) > 40) goTo(idx + (dx < 0 ? 1 : -1));
        sx = null;
      };
      // подсказка при первом открытии: браслеты слегка «качнутся» в сторону, как при свайпе
      if (!S.swipeHinted) {
        S.swipeHinted = true;
        setTimeout(() => track.classList.add('hint'), 700);
        track.addEventListener('animationend', () => track.classList.remove('hint'));
      }
      el.addEventListener('pointerup', end);
      el.addEventListener('pointercancel', () => { sx = null; release(); });
      el._keys = e => { if (e.key === 'ArrowRight') goTo(idx + 1); if (e.key === 'ArrowLeft') goTo(idx - 1); };

      // шторка поднимается при прокрутке; когда доходит до App Bar — у него появляется фон
      const sc = el.querySelector('.tf-scroll'), bar = el.querySelector('.appbar');
      const sheet = el.querySelector('.sheet-dark');
      sc.addEventListener('scroll', () => {
        const up = sc.scrollTop > 467 - 106;
        bar.classList.toggle('solid', up);
        sheet.classList.toggle('raised', up); // шапка с названием тарифа видна, когда шторка закрыла браслеты
      });
    },
  };
};

/* ---------- Выбор дат заморозки ----------
   Доступен ближайший месяц от сегодня: весь период (7–30 дней) должен в него уместиться.
   Первое нажатие — начало (+6 дней автоматически), второе — конец.
   Начало в последние 6 дней окна — подсказка, что 7 дней уже не помещаются.
   При изменении дат можно выбрать и новое начало (не раньше сегодня). */
Screens.freezeDates = (p) => {
  const today = D.today(), winEnd = D.addDays(D.addMonths(today, 1), -1);
  const lastStart = D.addDays(winEnd, -(FREEZE.minDays - 1));
  const edit = p.edit && S.freeze;
  let start = edit ? S.freeze.start : today;
  let end = edit ? S.freeze.end : D.addDays(today, FREEZE.minDays - 1);
  if (end > winEnd) end = winEnd;
  let phase = 'start';

  const COLW = 56.2857;
  const months = [];
  for (let m = new Date(today.getFullYear(), today.getMonth(), 1); m <= winEnd; m = new Date(m.getFullYear(), m.getMonth() + 1, 1)) months.push(m);
  const maxEnd = s => { const e = D.addDays(s, FREEZE.maxDays - 1); return e > winEnd ? winEnd : e; };

  return {
    html: `
    ${UI.appBar('Выберите период', false).replace('class="appbar ', 'class="appbar tall ').replace('</p>', '</p><p class="sub t-m">от 7 до 30 дней</p>')}
    <div class="cal">
      <div class="cal-dates">
        <div data-box="start"><p class="t-s c-sec">Начало</p><p class="t-m-b v"></p></div>
        <div data-box="end"><p class="t-s c-sec">Конец</p><p class="t-m-b v"></p></div>
      </div>
      <div class="cal-wd t-m">${['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'].map((d, i) => `<p style="left:${12 + COLW * i}px">${d}</p>`).join('')}</div>
      <div class="cal-scroll"></div>
    </div>
    <div class="sticky">
      <div class="dp">
        <div class="days"><p class="t-m-b nowrap" data-n></p><div class="pr"><span class="chip-s t-s-b" data-disc></span><p class="h5" data-price></p></div></div>
        <p class="t-s c-sec">Чем дольше заморозка, тем выгоднее</p>
      </div>
      ${UI.btn('', 'data-continue')}
    </div>`,
    mount(el) {
      const box = el.querySelector('.cal-scroll');
      const render = () => {
        const days = D.diffDays(start, end) + 1, price = freezePrice(days), disc = freezeDiscount(days);
        const isOff = d => d < today || d > winEnd || (phase === 'end' && d > maxEnd(start));
        box.innerHTML = months.map(m => {
          const y = m.getFullYear(), mo = m.getMonth(), n = new Date(y, mo + 1, 0).getDate();
          const off0 = (m.getDay() + 6) % 7, rows = Math.ceil((off0 + n) / 7);
          const cell = i => [12 + COLW * ((off0 + i) % 7), 36 + 40 * Math.floor((off0 + i) / 7)];
          let cells = '', rng = '';
          for (let r = 0; r < rows; r++) {
            const inRow = [];
            for (let i = 0; i < n; i++) if (Math.floor((off0 + i) / 7) === r) { const d = new Date(y, mo, i + 1); if (d >= start && d <= end) inRow.push(i); }
            if (inRow.length && D.diffDays(start, end) > 0) { // и одиночный день в строке (например, 30-е) тоже подсвечиваем
              const [x1, y1] = cell(inRow[0]), [x2] = cell(inRow[inRow.length - 1]);
              rng += `<i class="rng" style="left:${x1}px;top:${y1}px;width:${x2 - x1 + 40}px"></i>`;
            }
          }
          for (let i = 0; i < n; i++) {
            const d = new Date(y, mo, i + 1), [x, yy] = cell(i);
            const cls = (D.same(d, start) || D.same(d, end)) ? 'end' : (isOff(d) ? 'off' : '');
            cells += `<div class="day ${cls}" data-d="${d.getTime()}" style="left:${x}px;top:${yy}px">${i + 1}</div>`;
          }
          return `<div class="month" style="height:${rows * 40 + 32}px"><p class="mt t-m-b">${D.MONTHS[mo]}</p>${rng}${cells}</div>`;
        }).join('');
        el.querySelector('[data-box="start"] .v').textContent = D.wd(start);
        el.querySelector('[data-box="end"] .v').textContent = D.wd(end);
        el.querySelector('[data-box="start"]').classList.toggle('focus', phase === 'start');
        el.querySelector('[data-box="end"]').classList.toggle('focus', phase === 'end');
        el.querySelector('[data-n]').textContent = `Выбрано ${days} ${plural(days, ['день', 'дня', 'дней'])}`;
        const dc = el.querySelector('[data-disc]');
        dc.textContent = `- ${disc}%`; dc.style.display = disc ? '' : 'none';
        el.querySelector('[data-price]').innerHTML = `${money(price)}&nbsp;₽`;
        el.querySelector('[data-continue] span').innerHTML = `Продолжить · ${money(price)}&nbsp;₽`;
      };
      box.addEventListener('click', e => {
        const c = e.target.closest('.day'); if (!c || c.classList.contains('off')) return;
        const d = new Date(+c.dataset.d);
        if (phase === 'start' || d < start) {
          if (d > lastStart) { toast(`Заморозка длится минимум 7 дней и должна уместиться до ${D.dm(winEnd)}. Выберите начало не позже ${D.dm(lastStart)}`); return; }
          start = d; end = D.addDays(d, FREEZE.minDays - 1); phase = 'end';
        } else {
          const len = D.diffDays(start, d) + 1;
          end = len < FREEZE.minDays ? D.addDays(start, FREEZE.minDays - 1) : d;
          phase = 'start';
        }
        const top = box.scrollTop; render(); box.scrollTop = top;
      });
      // подсказка над нижней панелью, исчезает сама
      const toast = text => {
        let t = el.querySelector('.cal-toast');
        if (!t) { t = document.createElement('div'); t.className = 'cal-toast t-s'; el.appendChild(t); }
        t.textContent = text;
        t.classList.add('show');
        clearTimeout(t._h); t._h = setTimeout(() => t.classList.remove('show'), 3500);
      };
      el.querySelector('[data-box="start"]').addEventListener('click', () => {
        phase = 'start'; render();
      });
      el.querySelector('[data-box="end"]').addEventListener('click', () => { phase = 'end'; render(); });
      el.querySelector('[data-continue]').addEventListener('click', () => {
        const days = D.diffDays(start, end) + 1;
        openSheet('freezePay', { start, end, days, edit: !!edit });
      });
      render();
    },
  };
};

/* ---------- Ваш абонемент ---------- */
Screens.subscription = () => {
  const t = TARIFFS[S.sub.tariff], today = D.today();
  const frozen = S.freeze && S.freeze.start <= today;
  const checks = BENEFITS.slice(0, t.active).map(([, title]) =>
    `<div class="chk"><img src="${A}ic-check.svg" alt=""><p class="t-m">${title.replace('{friends}', t.friends).replace(' <br>', ' ')}</p></div>`).join('');
  const pending = S.pending ? `<p class="t-s c-sec">С ${D.full(billingDate())} — тариф «${TARIFFS[S.pending.tariff].name}»</p>` : '';
  return {
    html: `
    <div class="scroll"><div class="sub-page">
      <div class="card sub">
        <div class="sub-info">
          <div class="sub-top">
            <div class="row-b"><p class="t-l-b c-act">Тариф «${t.name}»</p>${frozen ? '<span class="bchip ice">Заморожен</span>' : '<span class="bchip ok">Активен</span>'}</div>
            ${UI.price(nextCharge())}
            ${S.saveDiscount ? `<p class="t-s c-sec">Скидка 30% действует на одно списание, далее ${money(TARIFFS[S.sub.tariff].price)}&nbsp;₽/мес</p>` : ''}
            ${pending}
          </div>
          <div class="sub-meta">
            <div style="width:94px"><p class="t-s c-sec">Дата списания</p><p class="t-m-b">${D.full(billingDate())}</p></div>
            <div><p class="t-s c-sec">Филиал</p><p class="t-m-b addr2">URBANFIT. Академическая<img src="${A}ic-arrow-down-dark.svg" alt=""></p></div>
          </div>
          <div class="checks">${checks}</div>
        </div>
        ${UI.btn('Изучить другие тарифы', `data-go="tariffs" data-params='{"tariff":"${S.sub.tariff}"}'`, 'sec')}
      </div>
      ${UI.freezeCard()}
    </div></div>
    ${UI.appBar('Ваш абонемент', false)}
    ${UI.navbar()}`,
  };
};

/* ---------- Главная: новый пользователь / активен / заморожен / заморозка запланирована ---------- */
Screens.home = () => {
  const s = S.sub;
  const stories = `
    <div class="stories hscroll">
      <div class="story"><img class="ph" src="${A}story-1.png" alt=""><p class="t-s">Приют <br>для кошек <br>и собак</p></div>
      <div class="story"><img class="ph" src="${A}story-2.png" alt=""><p class="t-s">FAQ-бот доступен!</p></div>
      <div class="story"><img class="ph" src="${A}story-3.png" alt=""><p class="t-s">-90% на вступитель-ный взнос</p></div>
      <div class="story"><img class="ph crop4" src="${A}story-4.png" alt=""><p class="t-s">Дарите абонементы друзьям</p></div>
    </div>`;

  let card = '';
  if (s) {
    const frozenNow = S.freeze && S.freeze.start <= D.today();
    if (frozenNow) {
      card = `
      <button class="sub-mini frozen" data-go="subscription">
        <div class="head"><p class="t-m-b">Ваш абонемент</p><img class="chev" src="${A}ic-arrow-right.svg" alt="">
          <div class="chip ice t-s-b">Заморожен</div></div>
        <div class="col"><p class="t-s c-sec nowrap">Окончание заморозки</p><p class="t-l-b">${D.full(S.freeze.end)}</p></div>
      </button>`;
    } else {
      card = `
      <button class="sub-mini" data-go="subscription">
        <div class="head"><p class="t-m-b">Ваш абонемент</p><img class="chev" src="${A}ic-arrow-right.svg" alt="">
          <div class="chip ok t-s-b">Активен</div></div>
        <div class="cols">
          <div class="col"><p class="t-s c-sec">Дата списания</p><p class="t-l-b">${D.full(billingDate())}</p></div>
          <div class="col"><p class="t-s c-sec">Сумма списания</p>${UI.price(nextCharge())}</div>
        </div>
      </button>`;
    }
  }

  const tiles = TARIFF_ORDER.map(id => {
    const t = TARIFFS[id];
    const [g1, g2] = tileGradients(t);
    return `
      <button class="t-tile ${t.tall ? 'tall' : ''}" data-tariff="${id}">
        <div class="g1" style="background-image:${g1.replace(/"/g, '&quot;')}"></div>
        <div class="g2" style="background-image:${g2.replace(/"/g, '&quot;')}"></div>
        <img class="noise" src="${A}noise.png" alt="">
        <p class="desc t-m">${t.desc}</p>
        ${UI.price(t.price)}
        <p class="name t-l-b">${t.name}</p>
        <div class="br"><div><img src="${A}${t.img}" alt=""></div></div>
      </button>`;
  }).join('');

  const trainers = [
    ['trainer-1', 'Софья Трофименко', 'left:8.05%;top:6.01%;width:89.71%;height:93.99%', 78.581],
    ['trainer-2', 'Руслан Некрасов', 'left:3.35%;top:2.18%;width:93.31%;height:97.82%', 69.335],
    ['trainer-3', 'Нина Алиева', 'left:4.87%;top:6.96%;width:94.92%;height:93.04%', 78.581],
  ].map(([f, n, pos, from]) => `
      <div class="trainer">
        <div class="photo"><img class="bg" src="${A}trainer-bg.jpg" alt=""><img src="${A}${f}.png" style="${pos}" alt=""></div>
        <div class="tint" style="background:linear-gradient(to bottom, rgba(28,74,132,0) ${from}%, #1c4a84);-webkit-mask-image:url(${A}${f}-mask.png);mask-image:url(${A}${f}-mask.png)"></div>
        <p class="nm t-s">${n}</p>
        <div class="mini-chip"><img src="${A}ic-star.svg" alt=""><span class="t-xs c-sec">5</span></div>
      </div>`).join('');

  const group = (bg, color, dot, tag, title, time) => `
      <div class="group"><div class="in">
        <div style="display:flex;flex-direction:column;gap:4px">
          <div style="display:flex;flex-direction:column;gap:12px">
            <div class="tag t-s-b" style="background:${bg};color:${color}"><img src="${A}${dot}" alt="">${tag}</div>
            <p class="t-l-b">${title}</p>
          </div>
          <p class="t-s c-sec">URBANFIT. Академическая</p>
        </div>
        <div class="when"><img src="${A}ic-calendar-12.svg" alt=""><p class="t-s c-sec nowrap">${time}</p></div>
      </div></div>`;

  const heights = [12, 20, 16, 12, 24, 32, 24, 12, 24, 44, 56, 56, 56, 44, 32, 12, 4];
  const bars = heights.map((h, i) => `<i class="${i === 10 ? 'now' : ''}" style="height:${h}px;${i === 4 || i === 12 ? 'width:11px' : ''}"></i>`).join('');


  // у нового пользователя тарифы первыми, у пользователя с абонементом — в конце (как в Figma)
  const tariffsSec = `
        <div class="sec">
          <div class="sec-head"><p class="t-m-b nowrap">${s ? 'Тарифы' : 'Выберите свой тариф'}</p>${UI.link('Подробнее', `data-tariff="${s ? 'city' : 'district'}"`)}</div>
          <div class="tariff-grid">${tiles}</div>
        </div>
`;
  const trainersSec = `
        <div class="sec">
          <div class="sec-head"><p class="t-m-b">Тренеры</p>${UI.link('Все')}</div>
          <div class="row-scroll hscroll">${trainers}</div>
        </div>
`;
  const groups = `
        <div class="sec">
          <div class="sec-head"><p class="t-m-b">Ближайшие групповые занятия</p>${UI.link('Все')}</div>
          <div class="row-scroll hscroll">
            ${group('#ffe8d7', '#e36402', 'chip-dot-orange.svg', 'Силовые', 'Крепкие руки', 'Сегодня, 19:00 – 19:55')}
            ${group('#eed7ff', '#9915f8', 'chip-dot-purple.svg', 'Йога и пилатес', 'Фитнес-йога', 'Сегодня, 20:00 – 20:55')}
          </div>
        </div>
`;
  const stat = `
        <div class="sec">
          <div class="sec-head"><p class="t-m-b">Статистика загруженности</p></div>
          <div class="stat">
            <p class="ttl t-l-b">Много людей</p>
            <div class="donut"><img src="${A}circle-diagram.svg" alt=""><img class="arc" src="${A}circle-arc.svg" alt=""><span class="t-s-b">80%</span></div>
            <div class="bars-wrap"><div class="bars">${bars}</div>
              <div class="bars-time t-xs"><p>07:00</p><p>15:00</p><p>00:00</p></div></div>
          </div>
        </div>
`;

  return {
    dark: true,
    html: `
    <div class="scroll"><div class="home">
      <div class="up ${s ? '' : 'new-user'}">
        <div class="up-bg"><img class="photo" src="${A}up-bg.png" alt=""><img class="noise" src="${A}noise.png" alt=""></div>
        <div class="insides">
          <div class="addr-row">
            <p class="addr t-m">URBANFIT. Академическая<img src="${A}ic-arrow-down.svg" alt=""></p>
            <img class="bell" src="${A}ic-bell.svg" alt="">
          </div>
          ${stories}
        </div>
        ${card}
      </div>
      <div class="content">
        ${(s ? [stat, trainersSec, groups, tariffsSec] : [tariffsSec, trainersSec, groups, stat]).join('')}
      </div>
    </div></div>
    ${UI.navbar()}`,
    mount(el) {
      // когда тёмный верх уезжает под статус-бар — иконки становятся тёмными
      const sc = el.querySelector('.scroll'), up = el.querySelector('.up');
      sc.addEventListener('scroll', () => statusTone(sc.scrollTop < up.offsetHeight - 50));
      el.querySelectorAll('[data-tariff]').forEach(b => b.addEventListener('click', () => {
        const id = b.dataset.tariff;
        // у пользователя с абонементом Нео недоступен (другой зал) — ничего не происходит на его экране
        go('tariffs', { tariff: id });
      }));
    },
  };
};
