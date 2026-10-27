/* South HUB 2027 — анонс. Обычный JavaScript без сборки и библиотек.
   Подключается через <script defer>, поэтому работает и с диска (file://), и с любого хостинга.

   Что здесь:
   1. настройки ссылок из <script id="site-config" type="application/json"> (необязательно);
   2. первый экран: проявление элементов и фоновое видео, которое проматывается прокруткой;
   3. меню, попап с полным текстом, попап с роликом;
   4. волна букв U под курсором;
   5. виджет билетов (включается, только если в настройках задан ticketsApiUrl). */
(function () {
    'use strict';

    var reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    /* ---------- 1. настройки ----------
       Ссылки уже стоят в HTML. Чтобы поменять их без правки разметки, перед </body> можно добавить
       <script id="site-config" type="application/json">{"ticketLink": "https://…"}</script>.
       Ключ совпадает с атрибутом data-link у ссылок. */
    var config = { ticketsApiUrl: '', ticketsEventId: 'sh2027' };
    var configEl = document.getElementById('site-config');
    if (configEl) {
        try {
            var cms = JSON.parse(configEl.textContent || '{}');
            Object.keys(cms).forEach(function (key) {
                if (typeof cms[key] !== 'string') return;
                config[key] = cms[key];
                document.querySelectorAll('[data-link="' + key + '"]').forEach(function (a) { a.href = cms[key]; });
            });
        } catch (e) {
            console.warn('site-config: некорректный JSON', e);
        }
    }

    /* ---------- 2. первый экран ----------
       Экран закреплён на время «сборки»: при прокрутке по очереди проявляются слова заголовка,
       подводка, кнопка и карточка с видео, а фоновое видео проматывается до золотого кадра горы.
       Потом экран уезжает обычной прокруткой. На вертикальных экранах берётся вертикальная нарезка. */
    var SCRUB_EASE = 0.12;   // насколько быстро кадр догоняет прокрутку
    var FREEZE_AT = 7.6;     // золотой кадр, на котором видео останавливается, когда фон уходит с экрана
    var STALL_MS = 1200;     // столько ждём окончания перемотки, потом перезагружаем видео
    var WORD_STAGGER = 0.12; // с, задержка между словами заголовка при загрузке
    var REVEAL_END = 0.85;   // к этой доле прокрутки проявляется последний элемент

    function setupHero() {
        var wrap = document.querySelector('[data-hero-scroll]');
        var hero = document.querySelector('[data-hero]');
        var video = document.querySelector('[data-hero-video]');
        if (!wrap || !hero || !video) return;
        if (reducedMotion) {
            hero.querySelectorAll('[data-reveal]').forEach(function (el) { el.classList.add('is-in'); });
            return;
        }

        // Видео скачивается целиком и отдаётся плееру из памяти: иначе каждая перемотка в ещё
        // не загруженное место ждёт сети, и картинка подвисает на скролле. С диска (file://) fetch
        // не работает, тогда видео берётся по обычному адресу.
        var portrait = window.matchMedia('(orientation: portrait)').matches;
        var src = portrait ? video.dataset.srcPortrait : video.dataset.src;
        var load = window.fetch && location.protocol !== 'file:'
            ? fetch(src)
                .then(function (res) { return res.ok ? res.blob() : Promise.reject(res.status); })
                .then(function (blob) { return URL.createObjectURL(blob); })
                .catch(function () { return src; })
            : Promise.resolve(src);
        load.then(function (url) { video.src = url; video.load(); });

        var target = 0;
        var shown = 0;
        var frame = 0;

        // элементы экрана по шагам; у заголовка в мобильной и десктопной вёрстке разные span,
        // поэтому берутся только видимые
        var steps = [];
        var lastWidth = 0;
        function layout() {
            // ширина та же — значит Safari просто спрятал панели, ничего не пересчитываем
            if (window.innerWidth === lastWidth) return;
            lastWidth = window.innerWidth;
            // экран выше окна закрепляется так, чтобы был виден его низ
            hero.style.setProperty('--hero-top', Math.min(0, window.innerHeight - hero.offsetHeight) + 'px');
            var byStep = {};
            hero.querySelectorAll('[data-reveal]').forEach(function (el) {
                if (!el.offsetParent && getComputedStyle(el).position !== 'fixed') return;
                var n = Number(el.dataset.reveal);
                (byStep[n] = byStep[n] || []).push(el);
            });
            steps = Object.keys(byStep).map(Number).sort(function (a, b) { return a - b; })
                .map(function (n) { return byStep[n]; });
        }

        // доля «сборки»: сколько прокручено из запаса под закреплённым экраном
        function progress() {
            var distance = wrap.offsetHeight - hero.offsetHeight;
            var passed = -wrap.getBoundingClientRect().top;
            return distance > 0 ? Math.min(1, Math.max(0, passed / distance)) : 0;
        }

        // проявленное остаётся на месте и при обратной прокрутке. Первый шаг — весь заголовок —
        // проявляется сразу при загрузке, слово за словом; остальные элементы по прокрутке
        function reveal(p) {
            steps.forEach(function (els, i) {
                if (p >= (i / steps.length) * REVEAL_END) els.forEach(function (el, j) {
                    el.style.transitionDelay = j * WORD_STAGGER + 's';
                    el.classList.add('is-in');
                });
            });
        }

        // Safari после простоя может выгрузить декодер: перемотка тогда «висит» (seeking не сбрасывается)
        // и кадр больше не меняется. Если seeked не пришёл за STALL_MS, видео перезагружается из памяти.
        var seekAt = 0;
        var recovering = false;
        function prime() {
            var played = video.play();
            var done = function () { video.pause(); onScroll(); };
            if (played && played.then) played.then(done, onScroll); else done();
        }
        function recover() {
            if (recovering) return;
            recovering = true;
            seekAt = 0;
            video.addEventListener('loadeddata', function () { recovering = false; prime(); }, { once: true });
            video.load();
        }
        video.addEventListener('seeked', function () { seekAt = 0; });

        function tick() {
            frame = 0;
            if (!video.duration || recovering) return;
            shown += (target - shown) * SCRUB_EASE;
            if (Math.abs(target - shown) < 0.002) shown = target;
            var time = shown * Math.min(FREEZE_AT, video.duration - 0.05);
            var now = performance.now();
            if (video.seeking && !seekAt) seekAt = now;
            if (seekAt && now - seekAt > STALL_MS) { recover(); return; }
            if (Math.abs(video.currentTime - time) > 1 / 60 && !video.seeking) {
                video.currentTime = time;
                if (!seekAt) seekAt = now;
            }
            if (shown !== target || video.seeking) frame = requestAnimationFrame(tick);
        }

        // видео идёт до тех пор, пока фон не ушёл с экрана целиком, и останавливается на золотом кадре
        function videoProgress() {
            return Math.min(1, Math.max(0, -wrap.getBoundingClientRect().top / wrap.offsetHeight));
        }

        function onScroll() {
            reveal(progress());
            target = videoProgress();
            if (!frame) frame = requestAnimationFrame(tick);
        }

        video.addEventListener('loadeddata', function () {
            video.classList.add('is-ready');
            // iOS Safari отдаёт кадры при перемотке только после первого play()
            prime();
        }, { once: true });
        // после возврата на вкладку или из сна Safari снова нужен play(), чтобы перемотка показывала кадры
        function onWake() { if (document.visibilityState === 'visible' && video.readyState >= 2) prime(); }

        window.addEventListener('scroll', onScroll, { passive: true });
        window.addEventListener('resize', function () { layout(); onScroll(); });
        document.addEventListener('visibilitychange', onWake);
        window.addEventListener('pageshow', onWake);
        window.addEventListener('focus', onWake);
        layout();
        onScroll();
    }

    /* ---------- 3. меню и попапы ----------
       Кнопка с data-open="<id>" открывает окно с этим id. Закрывается кнопкой data-close, Esc,
       а попапы ещё и кликом по фону (data-backdrop). Пока окно открыто, страница не прокручивается. */
    var openDialog = null;
    var opener = null;
    var hooks = {};

    function show(id, from) {
        var dlg = document.getElementById(id);
        if (!dlg || openDialog) return;
        openDialog = dlg;
        opener = from || null;
        if (opener) opener.setAttribute('aria-expanded', 'true');
        document.documentElement.style.overflow = 'hidden';
        dlg.hidden = false;
        // кадр на то, чтобы окно отрисовалось прозрачным, потом плавное появление
        requestAnimationFrame(function () { requestAnimationFrame(function () { dlg.classList.add('is-open'); }); });
        // фокус на само окно, а не на крестик: иначе Safari рисует вокруг крестика синюю рамку
        dlg.focus({ preventScroll: true });
        if (hooks[id] && hooks[id].open) hooks[id].open(dlg);
    }

    function hide() {
        var dlg = openDialog;
        if (!dlg) return;
        openDialog = null;
        dlg.classList.remove('is-open');
        document.documentElement.style.overflow = '';
        if (opener) { opener.removeAttribute('aria-expanded'); opener.focus({ preventScroll: true }); opener = null; }
        var finished = false;
        function onEnd(e) { if (e.target === dlg) finish(); }
        function finish() {
            dlg.removeEventListener('transitionend', onEnd);
            if (finished || dlg.classList.contains('is-open')) return;
            finished = true;
            dlg.hidden = true;
            if (hooks[dlg.id] && hooks[dlg.id].closed) hooks[dlg.id].closed(dlg);
        }
        dlg.addEventListener('transitionend', onEnd);
        setTimeout(finish, 400); // если transitionend не придёт (вкладка в фоне, без анимаций)
    }

    document.addEventListener('click', function (e) {
        var openBtn = e.target.closest('[data-open]');
        if (openBtn) { show(openBtn.dataset.open, openBtn); return; }
        if (!openDialog) return;
        if (e.target.closest('[data-close]') || (e.target === openDialog && openDialog.hasAttribute('data-backdrop'))) hide();
    });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') hide(); });

    // ролик: видео загружается при открытии и стартует без звука; звук — кнопкой или нажатием на видео,
    // после этого появляются обычные контролы. При закрытии видео выгружается и в следующий раз идёт сначала.
    (function () {
        var reel = document.getElementById('reel');
        if (!reel) return;
        var video = reel.querySelector('video');
        var sound = reel.querySelector('.reel__sound');
        function unmute() {
            if (!video.muted) return;
            video.muted = false;
            var p = video.play();
            if (p && p.catch) p.catch(function () {});
        }
        video.addEventListener('click', unmute);
        sound.addEventListener('click', unmute);
        video.addEventListener('volumechange', function () {
            video.controls = !video.muted;
            sound.hidden = !video.muted;
        });
        hooks.reel = {
            open: function () {
                video.muted = true;
                video.controls = false;
                sound.hidden = false;
                video.src = video.dataset.src;
                var p = video.play();
                if (p && p.catch) p.catch(function () {});
            },
            closed: function () {
                video.pause();
                video.removeAttribute('src');
                video.load();
            },
        };
    })();

    /* ---------- 4. волна букв ----------
       Буквы под курсором (на телефоне — под пальцем) плавно увеличиваются вместе с соседями
       и медленно возвращаются. */
    var WAVE_MAX_SCALE = 2;
    var WAVE_RADIUS = 1.1;   // радиус влияния в шагах сетки
    var WAVE_GROW = 0.22;    // скорость увеличения за кадр
    var WAVE_FADE = 0.06;    // скорость затухания за кадр

    function setupPattern() {
        var block = document.querySelector('[data-pattern]');
        if (!block || reducedMotion) return;

        var letters = [];
        var centers = [];
        var current = [];
        var pitch = 1;
        var pointer = null;
        var frame = 0;

        function measure() {
            letters = Array.prototype.filter.call(block.querySelectorAll('[data-wave]'), function (el) { return el.offsetParent !== null; });
            var rect = block.getBoundingClientRect();
            centers = letters.map(function (el) {
                var r = el.getBoundingClientRect();
                return { x: r.left - rect.left + r.width / 2, y: r.top - rect.top + r.height / 2 };
            });
            current = letters.map(function () { return 1; });
            // шаг сетки берётся по последнему ряду: первый ряд стоит не в сетке
            var last = centers[centers.length - 1];
            var sameRow = centers.filter(function (c) { return last && c.y === last.y; }).sort(function (a, b) { return a.x - b.x; });
            var prev = sameRow[sameRow.length - 2];
            pitch = last && prev ? last.x - prev.x : 100;
        }

        function tick() {
            var moving = false;
            letters.forEach(function (el, i) {
                var t = 1;
                if (pointer) {
                    var c = centers[i];
                    var d = Math.hypot((c.x - pointer.x) / pitch, (c.y - pointer.y) / (pitch * 0.9));
                    t = 1 + (WAVE_MAX_SCALE - 1) * Math.max(0, 1 - d / WAVE_RADIUS);
                }
                var speed = t > current[i] ? WAVE_GROW : WAVE_FADE;
                current[i] += (t - current[i]) * speed;
                if (Math.abs(t - current[i]) > 0.002) moving = true;
                else current[i] = t;
                el.style.transform = current[i] === 1 ? '' : 'scale(' + current[i].toFixed(3) + ')';
            });
            frame = moving || pointer ? requestAnimationFrame(tick) : 0;
        }

        function start() { if (!frame) frame = requestAnimationFrame(tick); }
        function setPointer(x, y) {
            var rect = block.getBoundingClientRect();
            pointer = { x: x - rect.left, y: y - rect.top };
            start();
        }
        function clearPointer() { pointer = null; start(); }
        function onTouch(e) { var t = e.touches[0]; if (t) setPointer(t.clientX, t.clientY); }

        measure();
        window.addEventListener('resize', measure);
        block.addEventListener('pointermove', function (e) { setPointer(e.clientX, e.clientY); });
        block.addEventListener('pointerleave', clearPointer);
        block.addEventListener('touchstart', onTouch, { passive: true });
        block.addEventListener('touchmove', onTouch, { passive: true });
        block.addEventListener('touchend', clearPointer);
        block.addEventListener('touchcancel', clearPointer);
    }

    /* ---------- 5. виджет билетов ----------
       GET <ticketsApiUrl>?event=<ticketsEventId> →
       { "tickets": [{ "id": "standard", "title": "Стандарт", "price": 150000, "currency": "RUB",
                       "description": "…", "url": "https://lk.southhub.ru/…", "available": true }] }
       Состояния: загрузка, ошибка с повтором, пусто, список. Ошибка API не ломает остальную страницу. */
    function setupTickets() {
        var section = document.querySelector('[data-tickets]');
        if (!section || !config.ticketsApiUrl) return;
        var body = section.querySelector('[data-tickets-body]');
        section.hidden = false;

        function esc(s) {
            return String(s).replace(/[&<>"']/g, function (ch) {
                return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch];
            });
        }
        function price(t) {
            try {
                return new Intl.NumberFormat('ru-RU', { style: 'currency', currency: t.currency || 'RUB', maximumFractionDigits: 0 }).format(t.price);
            } catch (e) {
                return (t.price + ' ' + (t.currency || '')).trim();
            }
        }
        // в ссылку попадают только http(s)-адреса
        function safeUrl(u) {
            try { var url = new URL(u, location.href); return /^https?:$/.test(url.protocol) ? url.href : '#'; } catch (e) { return '#'; }
        }

        function load() {
            section.setAttribute('aria-busy', 'true');
            body.innerHTML = '<p class="tickets__note" role="status">Загружаем тарифы…</p>';
            var url = new URL(config.ticketsApiUrl, location.href);
            if (config.ticketsEventId) url.searchParams.set('event', config.ticketsEventId);
            var ctrl = window.AbortController ? new AbortController() : null;
            var timedOut = false;
            var timer = setTimeout(function () { timedOut = true; if (ctrl) ctrl.abort(); }, 10000);
            fetch(url.href, { headers: { Accept: 'application/json' }, credentials: 'same-origin', signal: ctrl && ctrl.signal })
                .then(function (res) {
                    if (!res.ok) throw new Error('Ошибка сервера (' + res.status + ')');
                    return res.json().catch(function () { throw new Error('Сервер вернул не JSON'); });
                }, function () {
                    throw new Error(timedOut ? 'Сервер не ответил вовремя' : 'Нет связи с сервером');
                })
                .then(function (data) {
                    // неполные записи не показываем, чтобы одна битая строка в API не ломала виджет
                    var list = Array.isArray(data && data.tickets) ? data.tickets.filter(function (t) {
                        return t && t.title && typeof t.price === 'number' && t.url;
                    }) : [];
                    body.innerHTML = list.length
                        ? '<ul class="tickets__list">' + list.map(function (t) {
                            return '<li class="tickets__item">' +
                                '<h3 class="tickets__name">' + esc(t.title) + '</h3>' +
                                (t.description ? '<p class="tickets__desc">' + esc(t.description) + '</p>' : '') +
                                '<p class="tickets__price">' + esc(price(t)) + '</p>' +
                                (t.available !== false
                                    ? '<a href="' + esc(safeUrl(t.url)) + '" target="_blank" rel="noopener" class="btn btn--solid tickets__buy">Купить билет</a>'
                                    : '<p class="tickets__sold">Распродано</p>') +
                                '</li>';
                        }).join('') + '</ul>'
                        : '<p class="tickets__note">Продажа билетов скоро откроется.</p>';
                })
                .catch(function (e) {
                    body.innerHTML = '<div class="tickets__note" role="alert"><p>Не удалось загрузить тарифы. ' + esc(e.message) +
                        '</p><button type="button" class="btn tickets__retry">Повторить</button></div>';
                    body.querySelector('.tickets__retry').addEventListener('click', load);
                })
                .then(function () { clearTimeout(timer); section.removeAttribute('aria-busy'); });
        }
        load();
    }

    setupHero();
    setupPattern();
    setupTickets();
})();
