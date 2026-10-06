<script setup lang="ts">
const pub = usePublicPath();
const getLinkWithUtm = useLinkWithUtm();
const { telegramChanellLink } = useRuntimeConfig().public;

const trackRef = ref<HTMLDivElement | null>(null);
let animationId = 0;
let currentOffset = 0;
let lastTime = 0;
let isPaused = false;
// Полоса стоит, пока её не видно, и начинает ехать, когда появляется на экране
let isVisible = false;

const SPEED = 80;

const TEXTS = ['Все инсайты и новости ближе, чем вы думаете', 'подпишитесь, чтобы оставаться на связи'];

const handleMouseEnter = () => {
    isPaused = true;
};

const handleMouseLeave = () => {
    isPaused = false;
};

let cleanup: (() => void) | undefined;

onMounted(() => {
    const track = trackRef.value;
    if (!track) return;

    const trackWidth = track.scrollWidth / 2;

    const animate = (timestamp: number) => {
        if (!isPaused && isVisible) {
            if (lastTime === 0) {
                lastTime = timestamp;
            }

            const delta = (timestamp - lastTime) / 1000;
            currentOffset += delta * SPEED;
            currentOffset %= trackWidth;

            track.style.transform = `translateX(-${currentOffset}px)`;
            lastTime = timestamp;
        } else {
            lastTime = 0;
        }

        animationId = requestAnimationFrame(animate);
    };

    const start = () => {
        if (!animationId) animationId = requestAnimationFrame(animate);
    };
    const stop = () => {
        cancelAnimationFrame(animationId);
        animationId = 0;
        lastTime = 0;
    };

    const observer = new IntersectionObserver(([entry]) => {
        isVisible = !!entry?.isIntersecting;
        if (isVisible) start();
        else stop();
    });
    observer.observe(track);

    cleanup = () => {
        observer.disconnect();
        stop();
    };
});

onBeforeUnmount(() => cleanup?.());
</script>

<template>
    <a
        id="btn_lending_infinity_banner"
        class="infinity-banner-wrapper"
        :href="getLinkWithUtm(telegramChanellLink)"
        target="_blank"
        @mouseenter="handleMouseEnter"
        @mouseleave="handleMouseLeave"
    >
        <div class="infinity-banner-track">
            <div ref="trackRef" class="infinity-banner-items">
                <div v-for="n in 8" :key="n" class="infinity-banner-item">
                    <template v-for="text in TEXTS" :key="text">
                        <img :src="pub('/v2/infinity-banner-tg.svg')" alt="telegramm-icon" height="36" width="36" loading="lazy" decoding="async" class="infinity-banner-tg">
                        <img :src="pub('/v2/header-logo-white.svg')" alt="southuub" width="220" height="24" loading="lazy" decoding="async" class="infinity-banner-logo">
                        <p :class="[FONT_MONT_BOOK, 'infinity-banner-text']">{{ text }}</p>
                    </template>
                </div>
            </div>
        </div>
    </a>
</template>
