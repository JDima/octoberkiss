/* ═══════════════  осенний поцелуй · octoberkiss  ═══════════════ */
(function () {
  'use strict';

  var CFG = {
    weddingISO : '2026-10-22T17:30:00+03:00', // дата и время сбора гостей (МСК)
    audioStart : 0,     // файл обрезан по 1:11.5 — «это…осенний поцелуй» звучит сразу
    audioPeak  : 0.62,  // финальная громкость
    fadeMs     : 7000,  // длительность нарастания
    flightMs   : 3100   // полёт лебедя
  };

  var $ = function (id) { return document.getElementById(id); };
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  var cover  = $('cover'),
      openBtn= $('openBtn'),
      site   = $('site'),
      bar    = $('bar'),
      burger = $('burger'),
      menu   = $('menu'),
      sound  = $('sound'),
      track  = $('track');

  /* ── высота вьюпорта ──
     современные браузеры считают 100svh сами (и не дёргают вёрстку,
     когда адресная строка съезжает); подставляем px только там, где svh нет */
  var hasSvh = !!(window.CSS && CSS.supports && CSS.supports('height', '100svh'));
  function setVH () {
    if (hasSvh) return;
    document.documentElement.style.setProperty('--vh', window.innerHeight + 'px');
  }
  setVH();
  requestAnimationFrame(function () { bar.classList.add('is-shown'); });
  window.addEventListener('resize', setVH);
  window.addEventListener('orientationchange', function () { setTimeout(setVH, 250); });

  /* ═══════════  МУЗЫКА  ═══════════ */
  var audioOK = false, fadeTimer = null;

  /* Перемотка на нужную секунду.
     Пока файл не «seekable» (медленная сеть; хостинг без Range-запросов)
     currentTime просто не применяется — поэтому пробуем ещё несколько секунд. */
  function seekStart (tries) {
    tries = tries || 0;
    try {
      var sk = track.seekable;
      if (sk && sk.length && sk.end(sk.length - 1) > CFG.audioStart) {
        track.currentTime = CFG.audioStart;
      }
    } catch (e) {}
    if (Math.abs(track.currentTime - CFG.audioStart) > 1.5 && tries < 40) {
      setTimeout(function () { seekStart(tries + 1); }, 250);
    }
  }

  function startMusic () {
    if (!track) return;
    try { track.volume = 0; } catch (e) {}
    seekStart();

    var p = track.play();
    if (p && p.then) {
      p.then(function () { audioOK = true; fadeIn(); showSound(); })
       .catch(function () { audioOK = false; });
    } else { audioOK = true; fadeIn(); showSound(); }
  }

  function fadeIn () {
    var t0 = performance.now();
    clearInterval(fadeTimer);
    fadeTimer = setInterval(function () {
      var k = Math.min(1, (performance.now() - t0) / CFG.fadeMs);
      var eased = Math.pow(k, 1.7);            // медленно в начале, но фраза уже слышна
      try { track.volume = eased * CFG.audioPeak; } catch (e) {}
      if (k >= 1) clearInterval(fadeTimer);
    }, 60);
  }

  function showSound () {
    sound.hidden = false;
    requestAnimationFrame(function () { sound.classList.add('is-shown'); });
  }

  if (track) {
    track.addEventListener('ended', function () {
      seekStart();
      track.play().catch(function () {});
    });
  }

  function toggleSound () {
    if (!track) return;
    if (track.paused) {
      track.play();
      sound.classList.remove('is-muted');
      sound.setAttribute('aria-label', 'Выключить музыку');
    } else {
      track.pause();
      sound.classList.add('is-muted');
      sound.setAttribute('aria-label', 'Включить музыку');
    }
  }
  sound.addEventListener('click', toggleSound);

  document.addEventListener('visibilitychange', function () {
    if (!audioOK || !track) return;
    if (document.hidden) { track.pause(); }
    else if (!sound.classList.contains('is-muted')) { track.play().catch(function(){}); }
  });

  /* ═══════════  МЕНЮ  ═══════════ */
  function setMenu (open) {
    document.body.classList.toggle('menu-open', open);
    burger.setAttribute('aria-expanded', open ? 'true' : 'false');
    menu.setAttribute('aria-hidden', open ? 'false' : 'true');
  }
  burger.addEventListener('click', function () {
    setMenu(!document.body.classList.contains('menu-open'));
  });
  menu.addEventListener('click', function (e) {
    var a = e.target.closest('a');
    if (!a) return;
    setMenu(false);
    /* если конверт ещё не открыт — открываем его, а потом прыгаем к разделу */
    if (!opened) {
      e.preventDefault();
      var href = a.getAttribute('href');
      open();
      setTimeout(function () {
        var t = document.querySelector(href);
        if (t) t.scrollIntoView({ behavior: 'auto', block: 'start' });
      }, reduce ? 200 : 900);
    }
  });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && document.body.classList.contains('menu-open')) setMenu(false);
  });

  /* ═══════════  ОТКРЫТИЕ КОНВЕРТА  ═══════════ */
  var opened = false;

  function reveal () {
    document.body.classList.remove('is-locked');
    site.setAttribute('aria-hidden', 'false');
    site.classList.add('is-live');
    cover.classList.add('is-gone');
    revealInit();
    window.scrollTo(0, 0);
  }

  function open () {
    if (opened) return;
    opened = true;
    startMusic();
    cover.classList.add('is-opening');
    setTimeout(reveal, reduce ? 120 : 620);
  }
  openBtn.addEventListener('click', open);

  /* ═══════════  ПОЯВЛЕНИЕ БЛОКОВ  ═══════════ */
  function revealInit () {
    var secs = document.querySelectorAll('[data-rv]');
    if (!('IntersectionObserver' in window)) {
      secs.forEach(function (s) { s.classList.add('in'); });
      return;
    }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
      });
    }, { threshold: 0.15, rootMargin: '0px 0px -8% 0px' });
    secs.forEach(function (s) { io.observe(s); });
  }

  /* ═══════════  ОБРАТНЫЙ ОТСЧЁТ  ═══════════ */
  var TARGET = new Date(CFG.weddingISO).getTime();

  var FORMS = {
    d: ['день', 'дня', 'дней'],
    h: ['час', 'часа', 'часов'],
    m: ['минута', 'минуты', 'минут'],
    s: ['секунда', 'секунды', 'секунд']
  };
  function plural (n, f) {
    var n10 = n % 10, n100 = n % 100;
    if (n10 === 1 && n100 !== 11) return f[0];
    if (n10 >= 2 && n10 <= 4 && (n100 < 10 || n100 >= 20)) return f[1];
    return f[2];
  }
  var pad = function (n) { return n < 10 ? '0' + n : '' + n; };

  var el = {
    d: $('cd-d'), h: $('cd-h'), m: $('cd-m'), s: $('cd-s'),
    dl: $('cd-dl'), hl: $('cd-hl'), ml: $('cd-ml'), sl: $('cd-sl'),
    box: $('countdown'), done: $('cd-done')
  };

  function tick () {
    var diff = TARGET - Date.now();
    if (diff <= 0) {
      el.box.hidden = true;
      el.done.hidden = false;
      clearInterval(cdTimer);
      return;
    }
    var sec = Math.floor(diff / 1000);
    var d = Math.floor(sec / 86400);
    var h = Math.floor(sec % 86400 / 3600);
    var m = Math.floor(sec % 3600 / 60);
    var s = sec % 60;

    el.d.textContent = d;      el.dl.textContent = plural(d, FORMS.d);
    el.h.textContent = pad(h); el.hl.textContent = plural(h, FORMS.h);
    el.m.textContent = pad(m); el.ml.textContent = plural(m, FORMS.m);
    el.s.textContent = pad(s); el.sl.textContent = plural(s, FORMS.s);
  }
  tick();
  var cdTimer = setInterval(tick, 1000);

  /* ?skip — открыть сразу основную страницу, без конверта (для отладки)
     ?skip=820 — то же, но с фиксированной высотой экрана (для скриншотов) */
  var skipM = /[?&]skip(?:=(\d+))?/.exec(location.search);
  if (skipM) {
    if (skipM[1]) {
      var fv = skipM[1] + 'px';
      document.documentElement.style.setProperty('--vh', fv);
      window.removeEventListener('resize', setVH);
      setVH = function () { document.documentElement.style.setProperty('--vh', fv); };
    }
    opened = true;
    reveal();
    document.querySelectorAll('[data-rv]').forEach(function (s) { s.classList.add('in'); });
    showSound();
  }
})();
