// Даты и деньги. Всё считается от реального «сегодня» на устройстве.
const D = (() => {
  const DAY = 86400000;
  const WD = ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'];
  const MONTHS = ['Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь', 'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'];
  const pad = n => String(n).padStart(2, '0');

  const today = () => { const d = new Date(); d.setHours(0, 0, 0, 0); return d; };
  const addDays = (d, n) => { const r = new Date(d); r.setDate(r.getDate() + n); return r; };
  // +1 месяц; 31 января → последний день февраля
  const addMonths = (d, n) => {
    const r = new Date(d.getFullYear(), d.getMonth() + n, 1);
    const last = new Date(r.getFullYear(), r.getMonth() + 1, 0).getDate();
    r.setDate(Math.min(d.getDate(), last));
    return r;
  };
  const diffDays = (a, b) => Math.round((b - a) / DAY);
  const same = (a, b) => a && b && a.getTime() === b.getTime();

  return {
    today, addDays, addMonths, diffDays, same, MONTHS,
    full: d => `${pad(d.getDate())}.${pad(d.getMonth() + 1)}.${d.getFullYear()}`,          // 25.10.2026
    short: d => `${pad(d.getDate())}.${pad(d.getMonth() + 1)}.${String(d.getFullYear()).slice(2)}`, // 10.10.26
    dm: d => `${pad(d.getDate())}.${pad(d.getMonth() + 1)}`,                                   // 10.10
    wd: d => `${WD[d.getDay()]}, ${pad(d.getDate())}.${pad(d.getMonth() + 1)}.${d.getFullYear()}`, // Сб, 26.09.2026
  };
})();

// Деньги: «2 200» с неразрывным пробелом, как в макете
const money = n => String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, ' ');

// Склонение: plural(15, ['день','дня','дней'])
const plural = (n, f) => {
  const a = Math.abs(n) % 100, b = a % 10;
  if (a > 10 && a < 20) return f[2];
  if (b > 1 && b < 5) return f[1];
  if (b === 1) return f[0];
  return f[2];
};

// Цена заморозки — из таблицы zamorozka_cena.xlsx (лист «Модель цены»):
// цена = 200 ₽ за 7 дней + по 400/23 ₽ за каждый день сверх, округление до 10 ₽.
const FREEZE = { minDays: 7, maxDays: 30, minPrice: 200, maxPrice: 600, step: 10 };
const freezePrice = days => {
  const perExtra = (FREEZE.maxPrice - FREEZE.minPrice) / (FREEZE.maxDays - FREEZE.minDays);
  const exact = FREEZE.minPrice + (days - FREEZE.minDays) * perExtra;
  return Math.round(exact / FREEZE.step) * FREEZE.step;
};
// Выгода относительно цены дня при минимуме; в бейдже округляем вниз (15 дн → 20%, как в макете)
const freezeDiscount = days => {
  const basePerDay = FREEZE.minPrice / FREEZE.minDays;
  return Math.max(0, Math.floor((1 - freezePrice(days) / days / basePerDay) * 100 + 1e-9));
};
