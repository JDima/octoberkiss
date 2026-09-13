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

  /* геометрия улетающего лебедя: ширина .flyer и пропорции его viewBox */
  var FLY = { fw: 220, ratio: 768 / 505 };

  var $ = function (id) { return document.getElementById(id); };
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  var cover  = $('cover'),
      openBtn= $('openBtn'),
      site   = $('site'),
      bar    = $('bar'),
      burger = $('burger'),
      menu   = $('menu'),
      flyer  = $('flyer'),
      swanEnv= $('swan-in-env'),
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
    flySwan();
    setTimeout(reveal, reduce ? 120 : 620);
  }
  openBtn.addEventListener('click', open);

  /* ═══════════  ПОЛЁТ ЛЕБЕДЯ  ═══════════ */
  function flySwan () {
    var from = swanEnv.getBoundingClientRect();
    var fw   = flyer.offsetWidth || FLY.fw;
    var fh   = fw * FLY.ratio;
    var vw   = window.innerWidth, vh = window.innerHeight;

    var s0 = Math.max(0.55, Math.min(1.35, (from.width * 1.55) / fw));

    function at (cx, cy, s) { return { x: cx - fw * s / 2, y: cy - fh * s / 2, s: s }; }
    function kf (p, rot, op) {
      return {
        transform: 'translate(' + p.x.toFixed(1) + 'px,' + p.y.toFixed(1) + 'px) rotate(' + rot + 'deg) scale(' + p.s.toFixed(3) + ')',
        opacity: op
      };
    }

    var p0 = at(from.left + from.width * 0.42, from.top + from.height * 0.26, s0);
    var p1 = at(vw * 0.42, vh * 0.34, s0 * 0.84);
    var p2 = at(vw * 0.30, vh * 0.13, s0 * 0.54);
    var p3 = at(vw * 0.10, -vh * 0.16, s0 * 0.30);

    if (reduce) return;

    flyer.style.transform = kf(p0, -5, 1).transform;
    dropFeathers(p0, fw, s0);
    flyer.classList.add('is-flying');

    var anim = flyer.animate([
      Object.assign(kf(p0, -5,  0), { offset: 0,    easing: 'ease-out' }),
      Object.assign(kf(p0, -9,  1), { offset: 0.07, easing: 'cubic-bezier(.3,0,.4,1)' }),
      Object.assign(kf(p1, -18, 1), { offset: 0.38, easing: 'cubic-bezier(.4,0,.5,1)' }),
      Object.assign(kf(p2, -13, .9), { offset: 0.70, easing: 'cubic-bezier(.4,0,.4,1)' }),
      Object.assign(kf(p3, -20, 0), { offset: 1,    easing: 'cubic-bezier(.4,0,.6,1)' })
    ], { duration: CFG.flightMs, fill: 'forwards' });

    anim.onfinish = function () {
      flyer.classList.remove('is-flying');
      flyer.style.visibility = 'hidden';
    };
  }

  /* пёрышки, слетающие вниз в момент взлёта */
  function dropFeathers (p0, fw, s0) {
    var box = $('feathers');
    if (!box) return;
    var list = box.querySelectorAll('.feather');
    var vh = window.innerHeight;

    Array.prototype.forEach.call(list, function (f, i) {
      var x0 = p0.x + fw * s0 * (0.24 + i * 0.16);
      var y0 = p0.y + fw * s0 * FLY.ratio * (0.14 + i * 0.05);
      var drift = (i % 2 ? 1 : -1) * (34 + i * 20);
      var end = vh * (0.78 + i * 0.07);
      var sc = 0.8 + i * 0.18;

      f.animate([
        { transform: 'translate(' + x0 + 'px,' + y0 + 'px) rotate(' + (-16 + i * 12) + 'deg) scale(' + sc + ')', opacity: 0, offset: 0 },
        { transform: 'translate(' + (x0 + drift * 0.3) + 'px,' + (y0 + 60) + 'px) rotate(' + (10 + i * 8) + 'deg) scale(' + sc + ')', opacity: 0.95, offset: 0.18 },
        { transform: 'translate(' + (x0 - drift * 0.5) + 'px,' + (y0 + (end - y0) * 0.45) + 'px) rotate(' + (-22 - i * 6) + 'deg) scale(' + sc + ')', opacity: 0.9, offset: 0.55 },
        { transform: 'translate(' + (x0 + drift) + 'px,' + end + 'px) rotate(' + (26 + i * 10) + 'deg) scale(' + sc + ')', opacity: 0, offset: 1 }
      ], {
        duration: 3600 + i * 700,
        delay: 140 + i * 260,
        easing: 'cubic-bezier(.34,.12,.5,1)',
        fill: 'forwards'
      });
    });
  }

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
