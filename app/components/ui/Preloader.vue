<script setup lang="ts">
const pub = usePublicPath();

const PRELOADER_IMAGES = [
    pub('/v2/preloader-icon-1.svg'),
    pub('/v2/preloader-icon-2.svg'),
    pub('/v2/preloader-icon-3.svg'),
];
const STEP_INTERVAL_MS = 500;
// совпадает с transition в preloader.css: прелоадер успевает целиком уехать вверх
const HIDE_ANIMATION_MS = 600;
const OVERFLOW_RESTORE_DELAY_MS = 500;
// Прелоадер держится, пока видео первого экрана не скачается целиком,
// но не дольше этого времени на совсем медленном интернете.
const MAX_WAIT_MS = 20000;
// Минимальное время показа, чтобы прелоадер не мигал, когда видео уже в кэше.
const MIN_SHOW_MS = 1200;
// Первая часть видео первого экрана; вторая (общий план) короткая и догружается следом.
const HERO_VIDEOS = [{ id: 'main-video-banner', weight: 1 }];

const isVisible = ref(true);
const isAnimating = ref(false);
const activeStep = ref(0);
const pageLoadProgress = ref(0);
const isTimedOut = ref(false);
const isMinShown = ref(false);

// Ждём только видео первого экрана: остальные грузятся при прокрутке.
const heroVideoProgress = useVideoLoadingProgress(HERO_VIDEOS);

const combinedProgress = computed(() => isTimedOut.value ? 100 : Math.min(
    Math.round((heroVideoProgress.value * 0.8) + (pageLoadProgress.value * 0.2)),
    100,
));

useLockScroll(isVisible, OVERFLOW_RESTORE_DELAY_MS);

const cleanups: (() => void)[] = [];
onBeforeUnmount(() => cleanups.forEach((fn) => fn()));

onMounted(() => {
    const timer = setTimeout(() => { isTimedOut.value = true; }, MAX_WAIT_MS);
    const minTimer = setTimeout(() => { isMinShown.value = true; }, MIN_SHOW_MS);
    const stepInterval = setInterval(() => {
        activeStep.value = (activeStep.value + 1) % PRELOADER_IMAGES.length;
    }, STEP_INTERVAL_MS);
    cleanups.push(() => {
        clearTimeout(timer);
        clearTimeout(minTimer);
        clearInterval(stepInterval);
    });

    const setPageProgress = (value: number) => {
        pageLoadProgress.value = Math.max(pageLoadProgress.value, value);
    };

    if (document.readyState === 'complete') {
        pageLoadProgress.value = 100;
        return;
    }

    const updatePageLoadProgress = () => {
        const resources = performance.getEntriesByType('resource') as PerformanceResourceTiming[];

        if (resources.length === 0) {
            pageLoadProgress.value = document.readyState === 'loading' ? 10 : 50;
            return;
        }

        const loadedResources = resources.filter(entry => (
            entry.name.includes('.js') ||
            entry.name.includes('.css') ||
            entry.initiatorType === 'script' ||
            entry.initiatorType === 'link' ||
            entry.initiatorType === 'xmlhttprequest' ||
            entry.initiatorType === 'fetch'
        ));

        if (loadedResources.length === 0) {
            pageLoadProgress.value = 50;
            return;
        }

        const totalProgress = loadedResources.reduce((sum, resource) => {
            if (resource.transferSize === 0 && resource.decodedBodySize === 0) {
                return sum + 100;
            }
            return sum + (resource.transferSize ? 100 : 0);
        }, 0);

        setPageProgress(Math.min(Math.round(totalProgress / loadedResources.length), 100));
    };

    updatePageLoadProgress();

    const handleLoad = () => { pageLoadProgress.value = 100; };
    const handleDOMContentLoaded = () => setPageProgress(70);

    let performanceObserver: PerformanceObserver | null = null;
    try {
        performanceObserver = new PerformanceObserver((list) => {
            if (list.getEntries().length > 0) updatePageLoadProgress();
        });
        performanceObserver.observe({ type: 'resource', buffered: true });
    } catch {
        console.warn('PerformanceObserver not supported, using fallback');
    }

    window.addEventListener('load', handleLoad);
    document.addEventListener('DOMContentLoaded', handleDOMContentLoaded);
    const interval = setInterval(updatePageLoadProgress, 200);

    cleanups.push(() => {
        window.removeEventListener('load', handleLoad);
        document.removeEventListener('DOMContentLoaded', handleDOMContentLoaded);
        performanceObserver?.disconnect();
        clearInterval(interval);
    });
});

let hideTimer: ReturnType<typeof setTimeout> | undefined;
cleanups.push(() => clearTimeout(hideTimer));

watch([combinedProgress, isMinShown], ([progress, minShown]) => {
    if (progress < 100 || !minShown || isAnimating.value) return;

    isAnimating.value = true;
    // Первый экран показывает контент, пока прелоадер уезжает вверх
    window.__preloaderHidden = true;
    window.dispatchEvent(new Event(PRELOADER_HIDE_EVENT));

    hideTimer = setTimeout(() => {
        window.scrollTo(0, 0);
        isVisible.value = false;
    }, HIDE_ANIMATION_MS);
});
</script>

<template>
    <div v-if="isVisible" :class="['preloader', { 'preloader--hidden': isAnimating }]">
        <div class="preloader__content">
            <div class="preloader__images">
                <img
                    v-for="(src, index) in PRELOADER_IMAGES"
                    :key="index"
                    :src="src"
                    :alt="`preloader step ${index + 1}`"
                    width="280"
                    height="80"
                    :class="['preloader__image', { 'preloader__image--active': activeStep === index }]"
                >
            </div>

            <div :class="['preloader__progress', FONT_IBM_PLEX_SERIF_LIGHT]">{{ combinedProgress }}%</div>
        </div>
    </div>
</template>
