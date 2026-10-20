<script setup lang="ts">
const links = useRuntimeConfig().public;
const asset = useAsset();

// Фоновое видео не играет само, а прокручивается вместе со страницей: фон закреплён,
// первый экран уезжает поверх него, и видео доходит до золотого кадра горы.
// Под текстом о кэмпе этот кадр стоит стоп-кадром.
// На вертикальных экранах берётся отдельная вертикальная нарезка.
const VIDEO_DESKTOP = 'video/hero.mp4';
const VIDEO_MOBILE = 'video/hero-mobile.mp4';
const SCRUB_EASE = 0.12;
const FREEZE_AT = 7.2;     // секунда видео, на которой оно останавливается под текстом   // насколько быстро кадр догоняет прокрутку

const menuOpen = ref(false);
const aboutOpen = ref(false);
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
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const portrait = window.matchMedia('(orientation: portrait)').matches;
    video.src = asset(portrait ? VIDEO_MOBILE : VIDEO_DESKTOP);
    video.load();

    let target = 0;
    let shown = 0;
    let frame = 0;

    // доля первого экрана, которая уже уехала вверх
    const progress = () => {
        const distance = hero.offsetHeight;
        const passed = -wrap.getBoundingClientRect().top;
        return distance > 0 ? Math.min(1, Math.max(0, passed / distance)) : 0;
    };

    const tick = () => {
        frame = 0;
        if (!video.duration) return;
        shown += (target - shown) * SCRUB_EASE;
        if (Math.abs(target - shown) < 0.002) shown = target;
        const time = shown * Math.min(FREEZE_AT, video.duration - 0.05);
        if (Math.abs(video.currentTime - time) > 1 / 60 && !video.seeking) video.currentTime = time;
        if (shown !== target || video.seeking) frame = requestAnimationFrame(tick);
    };

    const onScroll = () => {
        target = progress();
        if (!frame) frame = requestAnimationFrame(tick);
    };

    const onReady = () => {
        videoReady.value = true;
        // iOS Safari отдаёт кадры при перемотке только после первого play()
        video.play().then(() => video.pause()).catch(() => {}).finally(onScroll);
    };

    video.addEventListener('loadeddata', onReady, { once: true });
    window.addEventListener('scroll', onScroll, { passive: true });

    stopScrub = () => {
        cancelAnimationFrame(frame);
        window.removeEventListener('scroll', onScroll);
    };
};

// подводка в первом экране ведёт к полному тексту под ним; стрелка поворачивается вниз
const toAbout = () => {
    aboutOpen.value = true;
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    document.getElementById('about')?.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth' });
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
                    <a :href="links.snowbaseLink" target="_blank" rel="noopener" class="link-arrow">Snow BASE'2027</a>
                    <a :href="links.askLink" target="_blank" rel="noopener" class="link-arrow">Задать вопрос</a>
                </nav>
                <div class="nav__actions">
                    <a :href="links.loginLink" target="_blank" rel="noopener" class="btn nav__login">
                        <img :src="asset('icons/login.svg')" width="17" height="21" alt="" class="nav__login-icon">
                        Войти
                    </a>
                    <a :href="links.telegramInviteLink" target="_blank" rel="noopener" class="tg-box" aria-label="Telegram">
                        <img :src="asset('icons/tg-box.svg')" width="51" height="51" alt="">
                    </a>
                </div>
            </div>

            <button class="nav__burger" type="button" aria-label="Открыть меню" @click="toggleMenu(true)">
                <img :src="asset('icons/burger.svg')" width="50" height="14" alt="">
            </button>
        </header>

        <div class="stage">
            <h1 class="title">
                <span class="title__line title__line--1">South HUB</span>
                <span class="title__line title__line--2">
                    <span class="title__desk">Кэмп для C-level</span>
                    <span class="title__mob">Кэмп</span>
                    <a :href="links.ticketLink" target="_blank" rel="noopener" class="btn btn--solid hero__cta hero__cta--desk">Купить билет</a>
                </span>
                <span class="title__line title__line--mob">для C-level</span>
                <span class="title__line title__line--3">в технологиях</span>
            </h1>

            <a href="#about" :class="['hero__lead', { 'is-open': aboutOpen }]" @click.prevent="toAbout">
                От тёплых связей к большим совместным проектам. Масштаб людей и идей, объединённых созиданием.
                <img :src="asset('icons/menu-arrow.svg')" width="18" height="18" alt="" class="hero__lead-arrow">
            </a>

            <div class="hero__bottom">
                <a :href="links.ticketLink" target="_blank" rel="noopener" class="btn btn--solid hero__cta hero__cta--mob">Купить билет</a>

                <p class="chip">
                    <img :src="asset('icons/date.svg')" width="20" height="17" alt="" class="chip__icon">
                    <time datetime="2027-06-09">09–13 июня, 2027</time>
                </p>

                <a :href="links.recap2026Link" target="_blank" rel="noopener" class="card">
                    <span class="card__thumb">
                        <img :src="asset('img/showreel-2026.webp')" alt="" loading="lazy" width="160" height="160">
                        <span class="card__play">
                            <img :src="asset('icons/play.svg')" width="30" height="30" alt="">
                        </span>
                    </span>
                    <span class="card__body">
                        <span class="card__title">Как прошёл<br class="card__br"> South HUB'2026</span>
                        <img :src="asset('icons/arrow.svg')" width="11" height="11" alt="" class="card__arrow">
                    </span>
                </a>
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
                    <a :href="links.snowbaseLink" target="_blank" rel="noopener">
                        Snow BASE'2027
                        <img :src="asset('icons/menu-arrow.svg')" width="18" height="18" alt="">
                    </a>
                    <a :href="links.askLink" target="_blank" rel="noopener">
                        Задать вопрос
                        <img :src="asset('icons/menu-arrow.svg')" width="18" height="18" alt="">
                    </a>
                </nav>
                <div class="menu__bottom">
                    <a :href="links.ticketLink" target="_blank" rel="noopener" class="btn btn--solid menu__cta">Купить билет</a>
                    <div class="menu__row">
                        <a :href="links.loginLink" target="_blank" rel="noopener" class="btn btn--outline nav__login">
                            <img :src="asset('icons/login.svg')" width="17" height="21" alt="" class="nav__login-icon">
                            Войти
                        </a>
                        <a :href="links.telegramInviteLink" target="_blank" rel="noopener" class="tg-box" aria-label="Telegram">
                            <img :src="asset('icons/tg-box.svg')" width="51" height="51" alt="">
                        </a>
                    </div>
                </div>
            </div>
        </Transition>

    </section>
    <AboutStory />
    </div>
</template>

<style scoped>
/* лишний экран прокрутки, за который проигрывается видео */
/* запас прокрутки, пока герой закреплён и видео проматывается; именно блок, а не padding: sticky не заходит в padding родителя */
.hero-scroll { position: relative; background: #6d7f97; }

.hero {
    position: relative;
    min-height: max(100svh, calc(var(--u) * 996));
    color: var(--white);
    z-index: 1;
    overflow: hidden;
}

/* фон закреплён на всю высоту .hero-scroll: первый экран и текст о кэмпе уезжают обычной
   прокруткой, а видео стоит на месте и проматывается. Дорожка нужна, чтобы фон не вылезал за низ блока */
.hero__track { position: absolute; inset: 0; }
.hero__bg {
    position: sticky;
    top: 0;
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
.nav__actions { display: flex; gap: 20px; }
.nav__login { padding: 0 30px; }
.nav__login-icon { width: 16px; height: 20px; filter: invert(1); }
.tg-box { display: block; width: 50px; height: 50px; transition: opacity .2s ease, transform .25s ease; }
.tg-box img { width: 50px; height: 50px; }
@media (hover: hover) { .tg-box:hover { transform: scale(1.06); } }
.tg-box:active { opacity: .5; }
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
    top: calc(var(--u) * 323);
    width: calc(var(--u) * 600);
    font-size: max(16px, calc(var(--u) * 20));
    line-height: 1.25;
}
.hero__lead { display: block; text-align: left; cursor: pointer; }
/* стрелка в конце текста ведёт к полному тексту ниже: на десктопе «подпрыгивает» по наведению,
   после нажатия поворачивается вниз */
.hero__lead-arrow {
    display: inline-block;
    width: .8em;
    height: .8em;
    margin-left: .35em;
    vertical-align: baseline;
    transition: transform .35s ease;
}
@media (hover: hover) {
    .hero__lead:hover .hero__lead-arrow { animation: lead-arrow 1s ease-in-out infinite; }
}
.hero__lead.is-open .hero__lead-arrow { transform: rotate(90deg); }
@keyframes lead-arrow {
    0%, 100% { transform: translate(0, 0); }
    50% { transform: translate(4px, -4px); }
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

.card {
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
.card__thumb > img { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; transition: transform .4s ease; }
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
@media (hover: hover) { .card:hover .card__thumb > img { transform: scale(1.05); } }
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
.menu__row { display: flex; justify-content: center; gap: 30px; }

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

    .title {
        position: relative;
        margin-top: 40px;
        display: flex;
        flex-direction: column;
        font-size: min(10.26vw, 72px);
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
        margin-top: 40px;
        max-width: 520px;
        font-size: 16px;
    }

    .hero__bottom {
        position: static;
        width: auto;
        margin-top: auto;
        padding-top: 70px;
        display: flex;
        flex-direction: column;
        align-items: center;
    }
    .hero__cta--mob { display: flex; width: 100%; }
    .chip { margin-top: 20px; height: 40px; padding: 0 20px 0 12px; border: 0; font-size: 14px; }
    .chip__icon { width: 16px; height: 13px; }

    .card {
        position: static;
        margin-top: 46px;
        width: 100%;
        align-items: stretch;
        padding: 10px;
    }
    .card__thumb { width: 144px; }
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
    .hero__bg video { display: none; }
}
</style>
