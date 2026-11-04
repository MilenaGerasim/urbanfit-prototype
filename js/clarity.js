// Microsoft Clarity: записи сессий и тепловые карты для UX-теста.
// Работает только на опубликованной странице (github.io), локально ничего не отправляет.
const CLARITY_ID = 'z87snh4dad'; // ID проекта из clarity.microsoft.com → Settings → Overview

if (CLARITY_ID && location.hostname.endsWith('github.io')) {
  (function (c, l, a, r, i, t, y) {
    c[a] = c[a] || function () { (c[a].q = c[a].q || []).push(arguments); };
    t = l.createElement(r); t.async = 1; t.src = 'https://www.clarity.ms/tag/' + i;
    y = l.getElementsByTagName(r)[0]; y.parentNode.insertBefore(t, y);
  })(window, document, 'clarity', 'script', CLARITY_ID);
  // номер респондента из ссылки: …/urbanfit-prototype/?r=7
  const r = new URLSearchParams(location.search).get('r');
  if (r) { clarity('identify', 'r' + r); clarity('set', 'respondent', r); }
}

// Прототип — одна страница, экраны внутри неё. Чтобы в Clarity смотреть клики по каждому экрану,
// ставим метку экрана и меняем адрес (#home, #tariffs, #sheet-payNew…) без новой записи в истории.
function track(name) {
  history.replaceState(null, '', location.pathname + location.search + '#' + name);
  if (window.clarity) { clarity('set', 'screen', name); clarity('event', name); }
}
