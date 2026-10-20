<script setup lang="ts">
const links = useRuntimeConfig().public;

// плашка с датой открывает создание события в Google Календаре (весь день, конец не включается)
const calendarLink = 'https://calendar.google.com/calendar/render?' + new URLSearchParams({
    action: 'TEMPLATE',
    text: 'South HUB 2027',
    dates: '20270609/20270614',
    details: 'South HUB 2027 — кэмп для C-level в технологиях. https://southhub.ru',
}).toString();
const asset = useAsset();

// Первый экран закреплён на время «сборки»: при прокрутке по очереди проявляются слова
// заголовка, подводка, кнопка и карточка с видео, а фоновое видео проматывается
// до золотого кадра горы. Потом экран уезжает обычной прокруткой.
// На вертикальных экранах берётся отдельная вертикальная нарезка.
const VIDEO_DESKTOP = 'video/hero.mp4';
const VIDEO_MOBILE = 'video/hero-mobile.mp4';
const SCRUB_EASE = 0.12;   // насколько быстро кадр догоняет прокрутку
const FREEZE_AT = 7.6;     // золотой кадр, на котором видео останавливается, когда фон уходит с экрана
const STALL_MS = 1200;     // столько ждём окончания перемотки, потом перезагружаем видео
const WORD_STAGGER = 0.12; // с, задержка между словами заголовка при загрузке
const REVEAL_END = 0.85;   // к этой доле прокрутки проявляется последний элемент

const menuOpen = ref(false);
const aboutOpen = ref(false);
const reelOpen = ref(false);
const videoReady = ref(false);
const scrollRef = ref<HTMLElement | null>(null);
const heroRef = ref<HTMLElement | null>(null);
const bgRef = ref<HTMLElement | null>(null);
const videoRef = ref<HTMLVideoElement | null>(null);
let stopScrub: (() => void) | undefined;

const setupScrub = () => {
    const wrap = scrollRef.value;
    const hero = heroRef.value;
    const video = videoRef.value;
    if (!wrap || !hero || !video) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        hero.querySelectorAll('[data-reveal]').forEach((el) => el.classList.add('is-in'));
        return;
    }

    const portrait = window.matchMedia('(orientation: portrait)').matches;
    // Видео скачивается целиком и отдаётся плееру из памяти: иначе каждая перемотка в ещё
    // не загруженное место ждёт сети, и картинка подвисает на скролле
    const src = asset(portrait ? VIDEO_MOBILE : VIDEO_DESKTOP);
    let blobUrl = '';
    let stopped = false;
    fetch(src)
        .then((res) => (res.ok ? res.blob() : Promise.reject(res.status)))
        .then((blob) => { blobUrl = URL.createObjectURL(blob); return blobUrl; })
        .catch(() => src)
        .then((url) => {
            if (stopped) return;
            video.src = url;
            video.load();
        });

    let target = 0;
    let shown = 0;
    let frame = 0;

    // элементы экрана по шагам; у заголовка в мобильной и десктопной вёрстке разные span,
    // поэтому берутся только видимые
    let steps: HTMLElement[][] = [];
    let lastWidth = 0;
    const layout = () => {
        // ширина та же — значит Safari просто спрятал панели, ничего не пересчитываем
        if (window.innerWidth === lastWidth) return;
        lastWidth = window.innerWidth;
        // экран выше окна закрепляется так, чтобы был виден его низ
        hero.style.setProperty('--hero-top', `${Math.min(0, window.innerHeight - hero.offsetHeight)}px`);
        const byStep = new Map<number, HTMLElement[]>();
        hero.querySelectorAll<HTMLElement>('[data-reveal]').forEach((el) => {
            if (!el.offsetParent && getComputedStyle(el).position !== 'fixed') return;
            const n = Number(el.dataset.reveal);
            byStep.set(n, [...(byStep.get(n) ?? []), el]);
        });
        steps = [...byStep.keys()].sort((a, b) => a - b).map((n) => byStep.get(n)!);
    };

    // доля «сборки»: сколько прокручено из запаса под закреплённым экраном
    const progress = () => {
        const distance = wrap.offsetHeight - hero.offsetHeight;
        const passed = -wrap.getBoundingClientRect().top;
        return distance > 0 ? Math.min(1, Math.max(0, passed / distance)) : 0;
    };

    // проявленное остаётся на месте и при обратной прокрутке. Первый шаг — весь заголовок —
    // проявляется сразу при загрузке, слово за словом; остальные элементы по прокрутке
    const reveal = (p: number) => {
        steps.forEach((els, i) => {
            if (p >= (i / steps.length) * REVEAL_END) els.forEach((el, j) => {
                el.style.transitionDelay = `${j * WORD_STAGGER}s`;
                el.classList.add('is-in');
            });
        });
    };

    // Safari после простоя может выгрузить декодер: перемотка тогда «висит» (seeking не сбрасывается)
    // и кадр больше не меняется. Если seeked не пришёл за STALL_MS, видео перезагружается из памяти.
    let seekAt = 0;
    let recovering = false;
    const prime = () => video.play().then(() => video.pause()).catch(() => {}).finally(onScroll);
    const recover = () => {
        if (recovering) return;
        recovering = true;
        seekAt = 0;
        video.addEventListener('loadeddata', () => { recovering = false; prime(); }, { once: true });
        video.load();
    };
    video.addEventListener('seeked', () => { seekAt = 0; });

    const tick = () => {
        frame = 0;
        if (!video.duration || recovering) return;
        shown += (target - shown) * SCRUB_EASE;
        if (Math.abs(target - shown) < 0.002) shown = target;
        const time = shown * Math.min(FREEZE_AT, video.duration - 0.05);
        const now = performance.now();
        if (video.seeking && !seekAt) seekAt = now;
        if (seekAt && now - seekAt > STALL_MS) { recover(); return; }
        if (Math.abs(video.currentTime - time) > 1 / 60 && !video.seeking) {
            video.currentTime = time;
            if (!seekAt) seekAt = now;
        }
        if (shown !== target || video.seeking) frame = requestAnimationFrame(tick);
    };

    // видео идёт до тех пор, пока фон не ушёл с экрана целиком, и останавливается на золотом кадре
    const videoProgress = () => Math.min(1, Math.max(0, -wrap.getBoundingClientRect().top / wrap.offsetHeight));

    const onScroll = () => {
        const p = progress();
        reveal(p);
        target = videoProgress();
        if (!frame) frame = requestAnimationFrame(tick);
    };
    const onResize = () => { layout(); onScroll(); };

    const onReady = () => {
        videoReady.value = true;
        // iOS Safari отдаёт кадры при перемотке только после первого play()
        prime();
    };
    // после возврата на вкладку или из сна Safari снова нужен play(), чтобы перемотка показывала кадры
    const onWake = () => { if (document.visibilityState === 'visible' && video.readyState >= 2) prime(); };

    video.addEventListener('loadeddata', onReady, { once: true });
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onResize);
    document.addEventListener('visibilitychange', onWake);
    window.addEventListener('pageshow', onWake);
    window.addEventListener('focus', onWake);
    layout();
    onScroll();

    stopScrub = () => {
        stopped = true;
        if (blobUrl) URL.revokeObjectURL(blobUrl);
        cancelAnimationFrame(frame);
        window.removeEventListener('scroll', onScroll);
        window.removeEventListener('resize', onResize);
        document.removeEventListener('visibilitychange', onWake);
        window.removeEventListener('pageshow', onWake);
        window.removeEventListener('focus', onWake);
    };
};

const toggleMenu = (open: boolean) => {
    menuOpen.value = open;
    document.documentElement.style.overflow = open ? 'hidden' : '';
};

const onKey = (e: KeyboardEvent) => {
    if (e.key === 'Escape' && menuOpen.value) toggleMenu(false);
};

onMounted(() => {
    window.addEventListener('keydown', onKey);
    setupScrub();
});
onBeforeUnmount(() => {
    stopScrub?.();
    window.removeEventListener('keydown', onKey);
    document.documentElement.style.overflow = '';
});
</script>

<template>
    <div ref="scrollRef" class="hero-scroll">
    <div class="hero__track">
        <div class="hero__bg" aria-hidden="true">
            <picture>
                <source media="(orientation: portrait)" :srcset="asset('img/hero-mobile.webp')" type="image/webp">
                <source :srcset="asset('img/hero.webp')" type="image/webp">
                <img :src="asset('img/hero.jpg')" alt="" fetchpriority="high">
            </picture>
            <video ref="videoRef" :class="{ 'is-ready': videoReady }" muted playsinline preload="auto" disablepictureinpicture />
        </div>
    </div>
    <section ref="heroRef" class="hero">

        <header class="nav">
            <a :href="links.siteLink" class="nav__logo" aria-label="South HUB">
                <img :src="asset('icons/logo.svg')" width="178" height="20" alt="SOUTHUUUB">
            </a>

            <div class="nav__right">
                <nav class="nav__links">
                    <a :href="links.askLink" target="_blank" rel="noopener" class="link-arrow">Задать вопрос</a>
                </nav>
                <div class="nav__actions">
                    <a :href="links.loginLink" target="_blank" rel="noopener" class="btn nav__login">
                        Войти
                    </a>
                    <a :href="links.telegramInviteLink" target="_blank" rel="noopener" class="corners tg-box" aria-label="Telegram">
                        <i /><i /><i /><i />
                        <img :src="asset('icons/tg-plane.svg')" width="23" height="19" alt="">
                    </a>
                </div>
            </div>

            <button class="nav__burger" type="button" aria-label="Открыть меню" @click="toggleMenu(true)">
                <img :src="asset('icons/burger.svg')" width="50" height="14" alt="">
            </button>
        </header>

        <div class="stage">
            <h1 class="title">
                <span class="title__line title__line--1"><span class="w" data-reveal="1">South</span> <span class="w" data-reveal="1">HUB</span></span>
                <span class="title__line title__line--2">
                    <span class="title__desk"><span class="w" data-reveal="1">Кэмп</span> <span class="w" data-reveal="1">для</span> <span class="w" data-reveal="1">C-level</span></span>
                    <span class="title__mob"><span class="w" data-reveal="1">Кэмп</span></span>
                    <a :href="links.ticketLink" target="_blank" rel="noopener" class="btn btn--solid hero__cta hero__cta--desk" data-reveal="3">Купить билет</a>
                </span>
                <span class="title__line title__line--mob"><span class="w" data-reveal="1">для</span> <span class="w" data-reveal="1">C-level</span></span>
                <span class="title__line title__line--3"><span class="w" data-reveal="1">в</span> <span class="w" data-reveal="1">технологиях</span></span>
            </h1>

            <button type="button" class="hero__lead" :data-open="aboutOpen || undefined" aria-haspopup="dialog" data-reveal="2" @click="aboutOpen = true">
                <span class="hero__lead-text">От тёплых связей к большим совместным проектам. Масштаб людей и идей, объединённых созиданием.</span>
                <span class="hero__lead-badge"><img :src="asset('icons/menu-arrow.svg')" width="18" height="18" alt="" class="hero__lead-arrow"></span>
            </button>

            <div class="hero__bottom">
                <a :href="links.ticketLink" target="_blank" rel="noopener" class="btn btn--solid hero__cta hero__cta--mob" data-reveal="3">Купить билет</a>

                <a :href="calendarLink" target="_blank" rel="noopener" class="chip chip--link" aria-label="Добавить South HUB 2027 в Google Календарь" data-reveal="4">
                    <img :src="asset('icons/date.svg')" width="20" height="17" alt="" class="chip__icon">
                    <time datetime="2027-06-09">09–13 июня, 2027</time>
                </a>

                <button type="button" class="card" aria-haspopup="dialog" data-reveal="5" @click="reelOpen = true">
                    <span class="card__thumb">
                        <video
                            :src="asset('video/recap-2026-preview.mp4')"
                            :poster="asset('img/recap-2026.webp')"
                            muted
                            loop
                            autoplay
                            playsinline
                            preload="metadata"
                            disablepictureinpicture
                            aria-hidden="true"
                        />
                        <span class="card__play">
                            <img :src="asset('icons/play.svg')" width="30" height="30" alt="">
                        </span>
                    </span>
                    <span class="card__body">
                        <span class="card__title">Как прошёл<br class="card__br"> South HUB'2026</span>
                        <img :src="asset('icons/arrow.svg')" width="11" height="11" alt="" class="card__arrow">
                    </span>
                </button>
            </div>
        </div>

        <Transition name="menu">
            <div v-if="menuOpen" class="menu" role="dialog" aria-modal="true" aria-label="Меню">
                <div class="menu__head">
                    <img :src="asset('icons/logo.svg')" width="178" height="20" alt="SOUTHUUUB">
                    <button type="button" class="menu__close" aria-label="Закрыть меню" @click="toggleMenu(false)">
                        <img :src="asset('icons/close.svg')" width="18" height="18" alt="">
                    </button>
                </div>
                <nav class="menu__links">
                    <a :href="links.askLink" target="_blank" rel="noopener">
                        Задать вопрос
                        <img :src="asset('icons/menu-arrow.svg')" width="18" height="18" alt="">
                    </a>
                </nav>
                <div class="menu__bottom">
                    <a :href="links.ticketLink" target="_blank" rel="noopener" class="btn btn--solid menu__cta">Купить билет</a>
                    <div class="menu__row">
                        <a :href="links.loginLink" target="_blank" rel="noopener" class="btn nav__login">
                            Войти
                        </a>
                        <a :href="links.telegramInviteLink" target="_blank" rel="noopener" class="corners tg-box" aria-label="Telegram">
                            <i /><i /><i /><i />
                            <img :src="asset('icons/tg-plane.svg')" width="23" height="19" alt="">
                        </a>
                    </div>
                </div>
            </div>
        </Transition>

        <AboutPopup v-model:open="aboutOpen" />
        <VideoPopup v-model:open="reelOpen" />
    </section>
    </div>
</template>

<style scoped>
/* лишний экран прокрутки, за который проигрывается видео */
/* запас прокрутки, пока герой закреплён и видео проматывается; именно блок, а не padding: sticky не заходит в padding родителя */
.hero-scroll { position: relative; background: #6d7f97; }
/* запас прокрутки, пока экран закреплён и собирается; блок, а не padding: sticky не заходит в padding */
.hero-scroll::after { content: ""; display: block; height: 160svh; }

/* медленное проявление элементов первого экрана; класс .is-in ставит скрипт по прокрутке */
[data-reveal] {
    opacity: 0;
    filter: blur(10px);
    translate: 0 40px;
    transition: opacity 1.4s ease, filter 1.4s ease, translate 1.6s cubic-bezier(.16, .8, .24, 1);
}
.w[data-reveal] { display: inline-block; translate: 0 .35em; }
[data-reveal].is-in { opacity: 1; filter: none; translate: none; }

.hero {
    position: sticky;
    top: var(--hero-top, 0px);
    min-height: max(100svh, calc(var(--u) * 996));
    color: var(--white);
    z-index: 1;
    overflow: hidden;
}

/* фон закреплён на всю высоту .hero-scroll, видео стоит на месте и проматывается. */
.hero__track { position: absolute; inset: 0; clip-path: inset(0); }
/* fixed, а не sticky: в iOS Safari sticky-фон дёргается при инерционной прокрутке и когда
   прячутся панели; fixed-слой рисуется отдельно и стоит на месте. За пределы блока
   его не пускает clip-path у дорожки */
.hero__bg {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100lvh;
    overflow: hidden;
}
.hero__bg picture, .hero__bg img, .hero__bg video {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
}
.hero__bg img, .hero__bg video { object-fit: cover; object-position: 50% 60%; }
.hero__bg video { opacity: 0; transition: opacity .4s ease; }
.hero__bg video.is-ready { opacity: 1; }
/* затемнение под текстом: у нового видео яркое небо */
.hero__bg::after {
    content: '';
    position: absolute;
    inset: 0;
    background: linear-gradient(180deg, rgba(0, 0, 0, .25) 0%, rgba(0, 0, 0, .05) 40%, rgba(0, 0, 0, .3) 100%);
}

/* ---------- шапка ---------- */
.nav {
    position: absolute;
    z-index: 2;
    top: max(20px, calc(var(--u) * 30));
    left: calc(var(--u) * 40);
    right: calc(var(--u) * 40);
    height: 50px;
    display: flex;
    align-items: center;
}
.nav__logo img { width: 178px; height: 20px; }
.nav__right {
    position: absolute;
    right: 0;
    width: max(calc(var(--u) * 600), 500px);
    top: 0;
    height: 50px;
    display: flex;
    align-items: center;
    justify-content: space-between;
}
.nav__links { display: flex; gap: calc(var(--u) * 40); font-size: 14px; line-height: 1; white-space: nowrap; }
.nav__actions { display: flex; align-items: center; gap: 20px; }
.nav__login { --btn-w: 150px; }
.tg-box { display: flex; width: 50px; height: 50px; transition: opacity .2s ease; }
.tg-box img { width: 23px; height: 19px; }
.nav__burger { display: none; }

/* ---------- первый экран ---------- */
.stage {
    position: absolute;
    left: 0;
    right: 0;
    bottom: 0;
    height: calc(var(--u) * 996);
}

.title {
    font-size: calc(var(--u) * 100);
    line-height: 1.28;
    text-transform: uppercase;
    white-space: nowrap;
}
.title__line { position: absolute; display: block; }
.title__line--1 { left: calc(var(--u) * 40); top: calc(var(--u) * 306); }
.title__line--2 { left: 50%; top: calc(var(--u) * 434); transform: translateX(-50%); }
.title__line--3 { right: calc(var(--u) * 40); top: calc(var(--u) * 562); }
.title__mob, .title__line--mob { display: none; }

.hero__cta--desk {
    position: absolute;
    left: 0;
    top: calc(100% + var(--u) * 42);
    width: max(240px, calc(var(--u) * 338));
    font-size: 16px;
    text-transform: none;
    letter-spacing: 0;
}
.hero__cta--mob { display: none; }

.hero__lead {
    position: absolute;
    left: calc(var(--u) * 1280);
    top: calc(var(--u) * 283);
    width: calc(var(--u) * 600);
    font-size: max(16px, calc(var(--u) * 20));
    line-height: 1.25;
}
/* подводка — стеклянная плашка с круглой кнопкой-стрелкой, которая «дышит» и зовёт открыть попап */
.hero__lead {
    display: flex;
    align-items: center;
    gap: 20px;
    padding: 16px 16px 16px 20px;
    text-align: left;
    color: inherit;
    cursor: pointer;
    border: 1px solid rgba(255, 255, 255, .15);
    border-radius: 15px;
    background: rgba(0, 0, 0, .2);
    -webkit-backdrop-filter: blur(10px);
    backdrop-filter: blur(10px);
}
.hero__lead.is-in { transition: opacity 1.4s ease, filter 1.4s ease, translate 1.6s cubic-bezier(.16, .8, .24, 1), background-color .3s ease, border-color .3s ease; }
.hero__lead-text { flex: 1; }
.hero__lead-badge {
    position: relative;
    flex: none;
    width: 48px;
    height: 48px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 50%;
    background: var(--white);
    transition: transform .35s ease;
}
.hero__lead-badge::before {
    content: "";
    position: absolute;
    inset: 0;
    border-radius: 50%;
    border: 1px solid var(--white);
    animation: lead-ring 2.4s ease-out infinite;
    pointer-events: none;
}
.hero__lead-arrow {
    width: 18px;
    height: 18px;
    filter: invert(1);
    transition: transform .35s ease;
}
@media (hover: hover) {
    .hero__lead:hover { background-color: rgba(0, 0, 0, .35); border-color: rgba(255, 255, 255, .35); }
    .hero__lead:hover .hero__lead-badge { transform: scale(1.08); }
    .hero__lead:hover .hero__lead-arrow { transform: translate(2px, -2px); }
}
.hero__lead:active .hero__lead-badge { transform: scale(.92); }
.hero__lead[data-open] .hero__lead-arrow { transform: rotate(90deg); }
@keyframes lead-ring {
    0% { transform: scale(1); opacity: .8; }
    70%, 100% { transform: scale(1.6); opacity: 0; }
}

.hero__bottom {
    position: absolute;
    left: calc(var(--u) * 1280);
    top: calc(var(--u) * 690);
    width: calc(var(--u) * 600);
}

.chip {
    display: inline-flex;
    align-items: center;
    gap: 10px;
    height: 40px;
    padding: 0 21px 0 13px;
    border: 1px solid rgba(255, 255, 255, .1);
    border-radius: 50px;
    background: rgba(0, 0, 0, .2);
    -webkit-backdrop-filter: blur(10px);
    backdrop-filter: blur(10px);
    font-size: 16px;
    line-height: 1;
    white-space: nowrap;
}
.chip__icon { width: 19px; height: 16px; }
.chip--link { color: inherit; text-decoration: none; transition: background .2s ease; }
.chip--link:hover { background: rgba(0, 0, 0, .4); }

.card {
    text-align: left;
    color: inherit;
    position: absolute;
    left: 0;
    right: 0;
    top: calc(var(--u) * 96);
    display: flex;
    align-items: center;
    gap: 20px;
    padding: 10px 20px 10px 10px;
    border: 1px solid rgba(255, 255, 255, .1);
    border-radius: 15px;
    background: rgba(0, 0, 0, .2);
    -webkit-backdrop-filter: blur(10px);
    backdrop-filter: blur(10px);
}
.card__thumb {
    position: relative;
    flex: none;
    width: max(110px, calc(var(--u) * 160));
    aspect-ratio: 1;
    border-radius: 10px;
    overflow: hidden;
    display: flex;
    align-items: center;
    justify-content: center;
}
.card__thumb > video { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; transition: transform .4s ease; }
.card__play {
    position: relative;
    width: 30px;
    height: 30px;
    border-radius: 8px;
    background: rgba(0, 0, 0, .2);
    -webkit-backdrop-filter: blur(20px);
    backdrop-filter: blur(20px);
    transition: opacity .2s ease;
}
.card__body {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 20px;
    padding-left: calc(var(--u) * 16);
}
.card__title { font-size: max(16px, calc(var(--u) * 20)); line-height: 1.25; transition: opacity .2s ease; }
.card__br { display: none; }
.card__arrow { width: 10px; height: 10px; transition: transform .25s ease; }
@media (hover: hover) { .card:hover .card__title { opacity: .6; } }
@media (hover: hover) { .card:hover .card__arrow { transform: translate(2px, -2px); } }
@media (hover: hover) { .card:hover .card__thumb > video { transform: scale(1.05); } }
.card:active .card__title, .card:active .card__play { opacity: .3; }

/* ---------- меню (только мобильная версия) ---------- */
.menu {
    position: fixed;
    inset: 0;
    z-index: 20;
    display: flex;
    flex-direction: column;
    padding: 20px 16px max(30px, env(safe-area-inset-bottom));
    background: rgba(0, 0, 0, .2);
    -webkit-backdrop-filter: blur(30px);
    backdrop-filter: blur(30px);
    color: var(--white);
}
.menu__head { display: flex; align-items: center; justify-content: space-between; height: 50px; }
.menu__head > img { width: 178px; height: 20px; }
.menu__close { width: 50px; height: 50px; display: flex; align-items: center; justify-content: flex-end; }
.menu__links {
    flex: 1;
    display: flex;
    flex-direction: column;
    justify-content: center;
    gap: 90px;
    font-size: 24px;
    line-height: 1.25;
}
.menu__links a { display: flex; align-items: center; justify-content: space-between; }
.menu__links a:active { opacity: .5; }
.menu__bottom { display: flex; flex-direction: column; gap: 20px; }
.menu__cta { width: 100%; }
.menu__row { display: flex; justify-content: center; align-items: center; gap: 30px; }

.menu-enter-active, .menu-leave-active { transition: opacity .3s ease; }
.menu-enter-from, .menu-leave-to { opacity: 0; }

/* ---------- мобильная и планшетная версия ---------- */
@media (max-width: 1279px) {
    .hero {
        min-height: 100svh;
        display: flex;
        flex-direction: column;
        padding: 20px 16px 30px;
    }
    .hero__bg img, .hero__bg video { object-position: 50% 50%; }

    .nav { position: static; height: 50px; justify-content: space-between; }
    .nav__right { display: none; }
    .nav__burger { display: flex; align-items: center; justify-content: flex-end; width: 60px; height: 50px; }
    .nav__burger img { width: 50px; height: 14px; }

    .stage {
        position: relative;
        flex: 1;
        height: auto;
        display: flex;
        flex-direction: column;
    }

    /* отступы и размеры завязаны на высоту окна (svh): экран закрепляется на время сборки
       и должен целиком помещаться в окно Safari с панелями, иначе верх с заголовком уедет */
    .title {
        position: relative;
        margin-top: min(40px, 3svh);
        display: flex;
        flex-direction: column;
        font-size: min(10.26vw, 72px, 5.6svh);
        line-height: 1.275;
    }
    .title__line { position: static; transform: none; }
    .title__line--2 { left: auto; }
    .title__desk { display: none; }
    .title__mob { display: inline; }
    .title__line--mob { display: block; text-align: right; }
    .title__line--3 { text-align: right; }
    .hero__cta--desk { display: none; }

    .hero__lead {
        position: relative;
        z-index: 1;
        left: auto;
        top: auto;
        width: auto;
        margin-top: min(40px, 3svh);
        max-width: 520px;
        font-size: 16px;
        gap: 14px;
        padding: 12px 12px 12px 16px;
    }
    .hero__lead-badge { width: 40px; height: 40px; }

    .hero__bottom {
        position: static;
        width: auto;
        margin-top: auto;
        padding-top: min(70px, 3svh);
        display: flex;
        flex-direction: column;
        align-items: center;
    }
    .hero__cta--mob { display: flex; width: 100%; }
    .chip { margin-top: min(20px, 1.5svh); height: 40px; padding: 0 20px 0 12px; border: 0; font-size: 14px; }
    .chip__icon { width: 16px; height: 13px; }

    .card {
        position: static;
        margin-top: min(46px, 3svh);
        width: 100%;
        align-items: stretch;
        padding: 10px;
    }
    .card__thumb { width: min(144px, 14svh); }
    .card__body {
        flex-direction: column;
        align-items: stretch;
        justify-content: space-between;
        padding-left: 0;
    }
    .card__title { font-size: 14px; }
    .card__br { display: inline; }
    .card__arrow { align-self: flex-end; }
}

@media (max-width: 1279px) and (min-width: 600px) {
    .hero { padding: 24px 32px 40px; }
    .card { max-width: 560px; }
}

@media (prefers-reduced-motion: reduce) {
    .hero-scroll::after { display: none; }
    [data-reveal] { opacity: 1; filter: none; translate: none; transition: none; }
    .hero__lead-badge::before { animation: none; }
    .hero__bg video { display: none; }
}
</style>
