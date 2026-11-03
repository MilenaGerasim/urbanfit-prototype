// Общие куски интерфейса (компоненты из секции «Компоненты» в Figma)
const A = 'assets/';

const UI = {
  statusbar: () => `
    <div class="sb-side"><div class="sb-time">9:41</div><img class="sb-ico" src="${A}sb-location.svg" alt=""></div>
    <div class="sb-island"><img src="${A}sb-lens.svg" alt=""></div>
    <div class="sb-side right">
      <div class="sb-net"><img src="${A}sb-signal.svg" alt=""></div>
      <img class="sb-data" src="${A}sb-data.svg" alt="">
      <div class="sb-bat"><img src="${A}sb-battery.svg" alt=""><img class="fill" src="${A}sb-battery-fill.svg" alt=""><span>32</span></div>
    </div>`,

  // Вкладки меню неактивны: не относятся к проверяемым сценариям
  navbar: () => `
    <div class="navbar">
      <img class="bg" src="${A}nav-bg.svg" alt="">
      <div class="nav-item active"><img src="${A}ic-home.svg" style="left:25px" alt=""><span style="left:18px">Главная</span></div>
      <div class="nav-item"><img src="${A}ic-calendar.svg" style="left:104px" alt=""><span style="left:87px">Расписание</span></div>
      <div class="nav-item nav-qr"><img class="circle" src="${A}nav-qr-circle.svg" alt=""><img class="qr" src="${A}ic-qr.svg" alt=""><span>Войти в зал</span></div>
      <div class="nav-item"><img src="${A}ic-cup.svg" style="left:275px" alt=""><span style="left:265px">Тренеры</span></div>
      <div class="nav-item"><img src="${A}ic-person.svg" style="left:354px" alt=""><span style="left:343px">Профиль</span></div>
    </div>`,

  price: (sum, unit = '₽/мес') => `<div class="price"><b>${money(sum)}</b><i>${unit}</i></div>`,

  link: (text, action = '') => `
    <button class="link" ${action}><p class="t-s">${text}</p><img src="${A}ic-arrow-right.svg" alt=""></button>`,
};

// Тарифы: цены и тексты с плиток «Главной»
const TARIFFS = {
  district: { name: 'Дистрикт', price: 1600, desc: 'Безлимитный доступ в клуб', img: 'bracelet-district.png',
    g1: ['rgba(140,152,169,1)', 'rgba(96,113,138,0.72837)', 'rgba(51,74,106,0.45673)', 'rgba(32,44,61,0.22837)'],
    g2: ['rgba(255,253,245,1)', 'rgba(194,193,188,0.75)', 'rgba(134,133,130,0.5)', 'rgba(73,74,73,0.25)'] },
  city: { name: 'Сити', price: 2200, desc: 'Доступ в клуб и групповые занятия', img: 'bracelet-city.png',
    g1: ['rgba(41,141,233,1)', 'rgba(38,107,172,0.72837)', 'rgba(35,72,110,0.45673)', 'rgba(24,43,63,0.22837)'],
    g2: ['rgba(177,216,255,1)', 'rgba(136,166,195,0.75)', 'rgba(95,115,135,0.5)', 'rgba(54,65,75,0.25)'] },
  megapolis: { name: 'Мегаполис', price: 2500, desc: 'Доступ во все клубы, групповые<br>и спа-зона', img: 'bracelet-megapolis.png', tall: true,
    g1: ['rgba(255,200,39,1)', 'rgba(216,163,34,0.86418)', 'rgba(177,126,30,0.72837)', 'rgba(138,89,25,0.59255)', 'rgba(99,52,20,0.45673)'],
    g2: ['rgba(248,217,112,1)', 'rgba(189,166,88,0.75)', 'rgba(130,116,64,0.5)', 'rgba(72,65,39,0.25)'] },
  neo: { name: 'Нео', price: 5900, desc: 'Все возможности + водно-термальный комплекс', img: 'bracelet-neo.png', tall: true,
    g1: ['rgba(53,200,232,1)', 'rgba(41,168,196,0.86418)', 'rgba(28,136,159,0.72837)', 'rgba(16,103,123,0.59255)', 'rgba(3,71,86,0.45673)'],
    g2: ['rgba(125,226,248,1)', 'rgba(97,173,190,0.75)', 'rgba(69,120,132,0.5)', 'rgba(41,67,73,0.25)'] },
};
const TARIFF_ORDER = ['district', 'city', 'megapolis', 'neo'];

// Экран «Тарифы»: подзаголовок, большой браслет, фон (радиальные градиенты 402×874), число доступных преимуществ
Object.assign(TARIFFS.district, { sub: 'Для тех, кому нужно самое главное', main: 'bracelet-district.png', active: 6, friends: '1 друга',
  bg1: [['140,152,169,1', 0], ['96,113,138,0.72837', .25481], ['51,74,106,0.45673', .50962], ['32,44,61,0.22837', .75481]],
  bg2: ['255,253,245', '194,193,188', '134,133,130', '73,74,73'] });
Object.assign(TARIFFS.city, { sub: 'Для тех, кто соблюдает баланс', main: 'bracelet-city.png', active: 7, friends: '3 друзей',
  bg1: [['41,141,233,1', 0], ['38,106,171,0.64', .35817], ['35,72,110,0.28', .71635]],
  bg2: ['177,216,255', '136,166,195', '95,115,135', '54,65,75'] });
Object.assign(TARIFFS.megapolis, { sub: 'Для тех, кто хочет максимум', main: 'bracelet-megapolis-main.png', active: 10, friends: '∞ друзей',
  bg1: [['255,200,39,1', 0], ['216,163,34,0.82091', .17909], ['177,126,30,0.64183', .35817], ['138,89,25,0.46274', .53726], ['99,52,20,0.28365', .71635]],
  bg2: ['248,217,112', '189,166,88', '130,115,63', '72,65,39'] });
Object.assign(TARIFFS.neo, { sub: 'Для тех, кто готов окунуться в будущее', main: 'bracelet-neo-main.png', active: 11, friends: '∞ друзей',
  bg1: [['53,200,232,1', 0], ['41,168,196,0.82', .17909], ['28,136,159,0.64', .35817], ['16,103,123,0.46', .53726], ['3,71,86,0.28', .71635]],
  bg2: ['125,226,248', '97,173,190', '69,120,131', '41,67,73'] });

const screenBg = t => {
  const svg = (m, stops, op) => `url("data:image/svg+xml;utf8,<svg viewBox='0 0 402 874' xmlns='http://www.w3.org/2000/svg' preserveAspectRatio='none'><rect x='0' y='0' height='100%25' width='100%25' fill='url(%23grad)' opacity='${op}'/><defs><radialGradient id='grad' gradientUnits='userSpaceOnUse' cx='0' cy='0' r='10' gradientTransform='matrix(${m})'>${stops}<stop stop-color='rgba(13,14,15,0)' offset='1'/></radialGradient></defs></svg>")`;
  const s1 = t.bg1.map(([c, o]) => `<stop stop-color='rgba(${c})' offset='${o}'/>`).join('');
  const s2 = t.bg2.map((c, i) => `<stop stop-color='rgba(${c},${[1, .75, .5, .25][i]})' offset='${i * .25}'/>`).join('');
  return [svg('1.4854e-14 22.65 -44.721 -1.6749e-13 201 210.5', s1, 0.8), svg('-1.1894e-14 19.35 -20.954 4.4987e-14 201 215.5', s2, 0.4)];
};

// Преимущества (шторка). Первые N доступны, остальные — серые.
// «файл|размер» — у иконки внутри квадрата 40×40 свой размер (как в наборе Icons_Big)
const BENEFITS = [
  ['ic-infinity.svg', 'Безлимитный доступ в клуб', 'Неограниченное количество посещений клуба ежедневно с 7:00 до 00:00'],
  ['ib-friends.svg', 'Гостевой доступ для {friends}', 'Бесплатная первая тренировка для друга <br>при совместном визите в клуб'],
  ['ib-whistle.svg', 'Ознакомительная тренировка <br>с тренером', 'Вводная тренировка с экспертом и персональные рекомендации с учётом уровня подготовки <br>и результатов тестирования'],
  ['ib-locker.svg', 'Шкафчик на время посещения', 'Удобное хранение одежды и личных вещей <br>во время тренировки'],
  ['ib-save.svg', 'Сейфовая ячейка', 'Безопасное хранение ценных вещей'],
  ['ib-weight.svg', 'Анализ состава тела InBody', 'Измерение мышечной и жировой массы, <br>а также уровня воды в организме'],
  ['ib-barbell.svg|30.45px 30.45px', 'Групповые тренировки', 'От йоги и растяжки до силовых, танцевальных <br>и функциональных тренировок'],
  ['ib-spa.svg|34px 26.79px', 'СПА-зона', 'Хаммам, сауна и зона отдыха для расслабления'],
  ['ib-buildings.svg', 'Посещение всех клубов сети', 'Доступ ко всем клубам сети UrbanFit <br>по одной подписке'],
  ['ib-family.svg', 'Семейный доступ', 'Возможность посещать клуб вместе с близкими <br>по одной подписке при совместном посещении'],
  ['ib-swimming.svg|34px 34px', 'Водно-термальный комплекс', 'Пространство для отдыха и восстановления <br>с бассейнами и банями'],
];

// Кнопки (Button_Primary / Button_Secondary): тема light|dark, состояние default|disable
UI.btn = (text, attrs = '', cls = '') => `<button class="btn ${cls}" ${attrs}><span>${text}</span></button>`;
UI.appBar = (title, dark = true) => `
  <div class="appbar ${dark ? 'dark' : ''}">
    <p class="t-l-b">${title}</p>
    <button class="back" data-back aria-label="Назад"><img src="${A}${dark ? 'ic-back.svg' : 'ic-back-dark.svg'}" alt=""></button>
  </div>`;

// Даты заморозки можно изменить только один раз — потом кнопка неактивна, под ней пояснение
const editBtn = label => S.freeze.edited
  ? `${UI.btn(label, '', 'sec disable')}<p class="t-s c-sec fz-note">Даты уже изменены, повторно изменить нельзя</p>`
  : UI.btn(label, 'data-go="freezeDates" data-params=\'{"edit":true}\'', 'sec');

// Блок «Заморозка» (Заморозка_мини): нет / запланирована / идёт / заканчивается
UI.freezeCard = () => {
  const f = S.freeze, today = D.today();
  const head = chip => `<div class="fz-head"><img src="${A}ic-snow.svg" alt=""><div><p class="t-l-b">Заморозка</p>${chip || ''}</div></div>`;
  if (!f) return `<div class="card fz">${head()}<p class="t-m c-sec" style="margin-top:-4px">Приостановите абонемент на 7–30 дней</p>
      ${UI.btn('Выбрать период', 'data-go="freezeDates"')}</div>`;
  if (f.start > today) return `<div class="card fz">${head(`<span class="bchip ice">Запланирована</span>`)}
      <div class="fz-plan"><div><img src="${A}ic-calendar-16.svg" alt=""><p class="t-m c-sec">${D.dm(f.start)} — ${D.dm(f.end)}</p></div><p class="t-m-b">${f.days} ${plural(f.days, ['день', 'дня', 'дней'])}</p></div>
      ${editBtn('Изменить даты')}</div>`;
  const left = D.diffDays(today, f.end) + 1;
  const ending = left <= 3;
  return `<div class="card fz">${head(`<span class="bchip ok">Активна до ${D.dm(f.end)}</span>`)}
      <div class="fz-left"><p><b>${left}</b><span class="t-m">${plural(left, ['день остался', 'дня осталось', 'дней осталось'])}</span></p><p class="t-m c-sec">из ${f.days}</p></div>
      <div class="fz-bar"><i style="width:${Math.max(8, 370 * left / f.days)}px"></i></div>
      ${editBtn(ending ? 'Продлить' : 'Изменить даты')}</div>`;
};

// Радиальные градиенты плиток — те же SVG, что отдаёт Figma
const tileGradients = (t) => {
  const h = t.tall ? 246 : 226;
  const stops = (arr, offs) => arr.map((c, i) => `<stop stop-color='${c}' offset='${offs[i]}'/>`).join('') + `<stop stop-color='rgba(13,14,15,0)' offset='1'/>`;
  const offs1 = t.tall ? [0, 0.1274, 0.25481, 0.38221, 0.50962] : [0, 0.25481, 0.50962, 0.75481];
  const m1 = t.tall ? '-14.4 -25.797 81.479 -53.887 157.5 197.56' : '-14.4 -23.7 81.479 -49.506 157.5 181.5';
  const m2 = t.tall
    ? (t === TARIFFS.neo ? '-4.8 -12.79 13.141 -5.8435 147 226.41' : '-6.1 -15.299 15.697 -7.3664 160 251.5')
    : '-4.8 -11.75 13.141 -5.3684 147 208';
  const svg = (m, s, op) => `url("data:image/svg+xml;utf8,<svg viewBox='0 0 181 ${h}' xmlns='http://www.w3.org/2000/svg' preserveAspectRatio='none'><rect x='0' y='0' height='100%25' width='100%25' fill='url(%23grad)' opacity='${op}'/><defs><radialGradient id='grad' gradientUnits='userSpaceOnUse' cx='0' cy='0' r='10' gradientTransform='matrix(${m})'>${s}</radialGradient></defs></svg>")`;
  return [svg(m1, stops(t.g1, offs1), 0.8), svg(m2, stops(t.g2, [0, 0.25, 0.5, 0.75]), 0.4)];
};
