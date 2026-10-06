<script setup lang="ts">
// (не LazyVideo: префикс Lazy в Nuxt занят под ленивую загрузку компонентов)
// Видео начинает грузиться только при приближении к экрану (за ~1 экран),
// а до этого показывает постер. Без этого все ролики качаются при открытии страницы.
defineProps<{ src: string; poster?: string; id?: string }>();

const videoRef = ref<HTMLVideoElement | null>(null);
let cleanup: (() => void) | undefined;

onMounted(() => {
    const video = videoRef.value;
    if (!video) return;

    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // для Safari: muted должен быть атрибутом, иначе play() отклоняется
    video.muted = true;
    video.setAttribute('muted', '');

    // Safari может отклонить play() до готовности данных: повторяем на canplay
    // (один обработчик на все отклонённые попытки, а не по одному на каждую прокрутку)
    const retryPlay = () => video.play().catch(() => {});
    const start = () => {
        if (video.preload !== 'auto') {
            video.preload = 'auto';
            video.load();
        }
        if (!reduceMotion && video.paused) {
            video.play().catch(() => {
                video.addEventListener('canplay', retryPlay, { once: true });
            });
        }
    };

    // Запасной вариант: внутри закреплённого GSAP блока Safari не всегда
    // сообщает о пересечении, поэтому проверяем положение и при прокрутке.
    const onScroll = () => {
        const rect = video.getBoundingClientRect();
        if (rect.bottom > -300 && rect.top < window.innerHeight + 300) start();
    };
    window.addEventListener('scroll', onScroll, { passive: true });

    let observer: IntersectionObserver | undefined;
    if ('IntersectionObserver' in window) {
        observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) start();
                    else if (!video.paused) video.pause();
                });
            },
            { rootMargin: '100% 0px' },
        );
        observer.observe(video);
    } else {
        start();
    }

    cleanup = () => {
        observer?.disconnect();
        window.removeEventListener('scroll', onScroll);
        video.removeEventListener('canplay', retryPlay);
    };
});

onBeforeUnmount(() => cleanup?.());
</script>

<template>
    <video
        :id="id"
        ref="videoRef"
        muted
        loop
        playsinline
        preload="none"
        :poster="poster"
        disableRemotePlayback
    >
        <source :src="src" type="video/mp4">
    </video>
</template>
