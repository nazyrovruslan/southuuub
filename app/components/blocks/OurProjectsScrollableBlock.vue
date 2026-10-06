<script setup lang="ts">
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { getOurProjectItems } from '~/utils/our-projects';

const getLinkWIthUtm = useLinkWithUtm();
const pub = usePublicPath();
const links = useRuntimeConfig().public;

const containerRef = ref<HTMLDivElement | null>(null);
const rightColumnRef = ref<HTMLDivElement | null>(null);
const leftColumnRef = ref<HTMLDivElement | null>(null);
const isMobile = ref(false);
let mobileAnimation: gsap.core.Timeline | null = null;
let scrollTriggers: ScrollTrigger[] = [];

const ITEMS = getOurProjectItems(getLinkWIthUtm, links, pub);

const setupAnimations = (isMobile: boolean) => {
    const container = containerRef.value;
    const rightColumn = rightColumnRef.value;

    if (!container || !rightColumn) return;

    // Scoped-поиск внутри компонента, а не по всему документу
    const imgWrappers = container.querySelectorAll<HTMLElement>(
        '.our-projects-item-right-img-wrapper',
    );
    const imgs = gsap.utils.toArray<HTMLImageElement>(
        container.querySelectorAll('.our-projects-item-right-img'),
    );
    const infoSections = gsap.utils.toArray<HTMLElement>(
        container.querySelectorAll('.our-projects-item-left-info'),
    );

    imgWrappers.forEach((wrapper, index) => {
        const reverseIndex = imgWrappers.length - index;
        wrapper.setAttribute('data-index', String(reverseIndex));
        wrapper.style.zIndex = String(reverseIndex);
    });

    // Очистка предыдущих триггеров
    scrollTriggers.forEach((trigger) => trigger.kill());
    scrollTriggers = [];

    if (mobileAnimation) {
        mobileAnimation.kill();
        mobileAnimation = null;
    }

    // Сброс inline-стилей перед новым сетапом
    if (rightColumn) {
        rightColumn.removeAttribute('style');
        rightColumn.style.height = '';
        rightColumn.style.marginTop = '';
    }
    imgs.forEach((img) => {
        if (img?.style) img.removeAttribute('style');
    });

    const updateHeaderVisibility = (isPinned: boolean) => {
        const header = document.getElementById('header');
        if (!header) return;

        header.style.opacity = isPinned ? '0' : '1';
        header.style.transition = 'opacity 0.3s ease';
        header.style.pointerEvents = isPinned ? 'none' : 'auto';
    };

    if (!isMobile) {
        // ============ DESKTOP ============
        rightColumn.classList.remove('mobile');
        rightColumn.classList.add('desktop');

        const mainTimeline = gsap.timeline({
            scrollTrigger: {
                trigger: '.our-projects-scrollable-block',
                start: 'top top',
                end: 'bottom bottom',
                pin: '.our-projects-item-right',
                scrub: true,
                invalidateOnRefresh: true,
                anticipatePin: 1,
                refreshPriority: 1, // MainBanner = 0
            },
        });

        if (mainTimeline.scrollTrigger) {
            scrollTriggers.push(mainTimeline.scrollTrigger);
        }

        gsap.set(imgs, {
            clearProps: 'clipPath,objectPosition,objectFit,transform,willChange',
        });

        gsap.set(imgs, {
            clipPath: 'inset(0% 0% 0% 0%)',
            objectPosition: '0px 0%',
            objectFit: 'cover',
            force3D: true,
        });

        imgs.forEach((_, index) => {
            const currentImage = imgs[index];
            const nextImage = imgs[index + 1] ? imgs[index + 1] : null;

            const sectionTimeline = gsap.timeline();

            if (nextImage) {
                sectionTimeline
                    .to(
                        currentImage!,
                        {
                            clipPath: 'inset(0% 0% 100% 0%)',
                            objectPosition: '0px 60%',
                            duration: 1.5,
                            ease: 'none',
                        },
                        0,
                    )
                    .to(
                        nextImage,
                        {
                            objectPosition: '0px 40%',
                            duration: 1.5,
                            ease: 'none',
                        },
                        0,
                    );
            }

            mainTimeline.add(sectionTimeline);
        });
    } else {
        // ============ MOBILE ============
        rightColumn.style.height = '275px';
        rightColumn.style.marginTop = '72px';

        rightColumn.classList.remove('desktop');
        rightColumn.classList.add('mobile');

        gsap.set(imgs, {
            clearProps: 'clipPath,objectPosition,objectFit,transform,willChange',
        });

        gsap.set(imgs, {
            willChange: 'clip-path',
            force3D: true,
            objectFit: 'cover',
            objectPosition: 'center center',
        });

        const mobileTimeline = gsap.timeline({
            scrollTrigger: {
                trigger: '.our-projects-scrollable-block',
                start: 'top top',
                end: 'bottom bottom',
                scrub: 0.3,
                pin: '.our-projects-item-right',
                pinSpacing: false,
                anticipatePin: 1,
                invalidateOnRefresh: true,
                refreshPriority: 1,
            },
        });

        if (mobileTimeline.scrollTrigger) {
            scrollTriggers.push(mobileTimeline.scrollTrigger);
        }

        imgs.forEach((img, index) => {
            if (index === 0) {
                gsap.set(img, {
                    clipPath: 'inset(0% 0% 0% 0%)',
                    objectPosition: 'center 50%',
                });
            } else {
                gsap.set(img, {
                    clipPath: 'inset(100% 0% 0% 0%)',
                    objectPosition: 'center 50%',
                });
            }
        });

        const sectionDuration = 1 / infoSections.length;

        for (let i = 0; i < imgs.length - 1; i++) {
            const currentImg = imgs[i]!;
            const nextImg = imgs[i + 1]!;
            const startPosition = i * sectionDuration;

            mobileTimeline.to(
                currentImg,
                {
                    clipPath: 'inset(0% 0% 100% 0%)',
                    objectPosition: 'center 70%',
                    duration: sectionDuration * 0.8,
                    ease: 'none',
                },
                startPosition + sectionDuration * 0.1,
            );

            mobileTimeline.fromTo(
                nextImg,
                {
                    clipPath: 'inset(100% 0% 0% 0%)',
                    objectPosition: 'center 30%',
                },
                {
                    clipPath: 'inset(0% 0% 0% 0%)',
                    objectPosition: 'center 50%',
                    duration: sectionDuration * 0.8,
                    ease: 'none',
                },
                startPosition + sectionDuration * 0.1,
            );
        }

        mobileAnimation = mobileTimeline;
    }

    const boundaryTrigger = ScrollTrigger.create({
        trigger: '.our-projects-scrollable-block',
        start: 'top 70px',
        end: 'bottom top',
        refreshPriority: 1,
        onEnter: () => updateHeaderVisibility(true),
        onLeave: () => updateHeaderVisibility(false),
        onEnterBack: () => updateHeaderVisibility(true),
        onLeaveBack: () => updateHeaderVisibility(false),
    });

    scrollTriggers.push(boundaryTrigger);

    return () => {
        scrollTriggers.forEach((trigger) => trigger.kill());
        scrollTriggers = [];

        if (mobileAnimation) {
            mobileAnimation.kill();
            mobileAnimation = null;
        }

        const header = document.getElementById('header');
        if (header) {
            header.style.opacity = '1';
            header.style.pointerEvents = 'auto';
        }
    };
};

let removeMqlListener: (() => void) | undefined;
let cleanupAnimations: (() => void) | undefined;
let stopWatch: (() => void) | undefined;

onMounted(() => {
    gsap.registerPlugin(ScrollTrigger);

    // Как в React: второй эффект первый раз отрабатывает со значением isMobile
    // из первого рендера (false), а после обновления состояния — пересоздаётся
    cleanupAnimations = setupAnimations(isMobile.value);

    stopWatch = watch(isMobile, (value) => {
        cleanupAnimations?.();
        cleanupAnimations = setupAnimations(value);
    }, { flush: 'post' });

    const mql = window.matchMedia('(max-width: 1024px)');

    const handleMqlChange = (e: MediaQueryListEvent | MediaQueryList) => {
        isMobile.value = e.matches;
    };

    handleMqlChange(mql);
    mql.addEventListener('change', handleMqlChange);
    removeMqlListener = () => mql.removeEventListener('change', handleMqlChange);
});

onBeforeUnmount(() => {
    stopWatch?.();
    removeMqlListener?.();
    cleanupAnimations?.();
});
</script>

<template>
    <div
        id="our-projects-block"
        ref="containerRef"
        class="our-projects-scrollable-block-wrapper"
    >
        <div class="our-projects-scrollable-block">
            <!-- Левая колонка - текст -->
            <div ref="leftColumnRef" class="our-projects-item-left">
                <div
                    v-for="item in ITEMS"
                    :id="item.id"
                    :key="item.id"
                    class="our-projects-item-left-info"
                >
                    <h2 :class="[FONT_MONT_BOOK, 'our-projects-item-left-info-title']">{{ item.title }}</h2>
                    <p :class="[FONT_MONT_BOOK, 'our-projects-item-left-info-description']">{{ item.description }}</p>
                    <AntButton
                        :id="`btn_lending_${item.id}`"
                        class="our-projects-item-left-info-button base-button"
                        type="primary"
                        @click="item.onClick"
                    >
                        <span :class="FONT_MONT_BOOK">{{ item.buttonTitle }}</span>
                    </AntButton>
                </div>
            </div>

            <!-- Правая колонка - картинки -->
            <div ref="rightColumnRef" class="our-projects-item-right">
                <h2 :class="[FONT_MONT_BOOK, 'our-projects-item-right-title']">где встречаемся</h2>

                <!-- data-index ставится в setupAnimations — единый источник истины -->
                <div
                    v-for="item in ITEMS"
                    :key="`img-${item.id}`"
                    class="our-projects-item-right-img-wrapper"
                >
                    <ImageWithFallback
                        v-if="item.imageSrc"
                        :src="item.imageSrc"
                        :alt-src="item.altSrc!"
                        :alt="item.imageAlt"
                        :width="isMobile ? 612 : 900"
                        :height="isMobile ? 275 : 536"
                        sizes="(max-width: 1024px) 100vw, 50vw"
                        class="our-projects-item-right-img"
                    />
                    <DeferredVideo
                        v-if="item.videoSrc"
                        class="our-projects-item-right-img"
                        :src="item.videoSrc"
                        :poster="item.videoSrc.replace(/\.mp4$/, '-poster.webp')"
                        :id="item.videoId"
                    />
                </div>
            </div>
        </div>
    </div>
</template>
