<script setup lang="ts">
const TEXT_1 = `сообщество для C-level в${NBSP}IT`;
const TEXT_2 = 'участников';
const TEXT_3 = `CTO&CIO, 18%${NBSP}CPO, 15%${NBSP}CEO и 8%${NBSP}CDO`;
const TEXT_4 = `лет комьюнити IT-руководителей`;

const isMobile = ref<boolean | null>(null);
const isAnimated = ref(false);
const shouldAnimate = ref(false);
const wrapperRef = ref<HTMLDivElement | null>(null);

const count1 = ref(0);
const count2 = ref(0);
const count3 = ref(0);
const count4 = ref(0);

const notAnimatedStyle = computed(() => (!shouldAnimate.value ? { bottom: '0', top: 'auto' } : undefined));

const animateNumber = (
    start: number,
    end: number,
    setter: (value: number) => void,
    duration: number,
) => {
    const startTime = performance.now();

    const updateNumber = (currentTime: number) => {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const currentValue = Math.floor(start + (end - start) * progress);
        setter(currentValue);

        if (progress < 1) {
            requestAnimationFrame(updateNumber);
        }
    };

    requestAnimationFrame(updateNumber);
};

const startAnimations = () => {
    animateNumber(0, 1, (v) => { count1.value = v; }, 3000);
    animateNumber(0, 1700, (v) => { count2.value = v; }, 3000);
    animateNumber(0, 32, (v) => { count3.value = v; }, 3000);
    animateNumber(0, 5, (v) => { count4.value = v; }, 3000);
};

const updateColumn = () => {
    const mobile = window.matchMedia('(max-width: 767px)').matches;

    isMobile.value = mobile;
};

const handleScroll = () => {
    if (!wrapperRef.value || isAnimated.value) return;

    const rect = wrapperRef.value.getBoundingClientRect();
    const isVisible = rect.top <= 80;

    if (isVisible) {
        isAnimated.value = true;
        shouldAnimate.value = true;
        startAnimations();
    }
};

onMounted(() => {
    window.addEventListener('resize', updateColumn);
    updateColumn();

    window.addEventListener('scroll', handleScroll);
});

onBeforeUnmount(() => {
    window.removeEventListener('resize', updateColumn);
    window.removeEventListener('scroll', handleScroll);
});
</script>

<template>
    <div
        id="community-in-numbers"
        ref="wrapperRef"
        class="community-in-numbers-wrapper"
    >
        <h3 :class="[FONT_MONT_BOOK, 'community-in-numbers-title']" style="cursor: pointer">мы в цифрах</h3>

        <div v-if="isMobile === false" class="community-in-numbers-infographic">
            <div class="community-in-numbers-infographic-item">
                <div :class="['community-in-numbers-infographic-item-animated', shouldAnimate ? 'animate-item-1' : '']">
                    <div class="community-in-numbers-infographic-item-fill" />
                </div>
                <div
                    :class="['community-in-numbers-infographic-item-content', shouldAnimate ? 'animate-content-1' : '']"
                    :style="notAnimatedStyle"
                >
                    <div :class="[FONT_MONT_BOOK_EXTRA_LIGHT, 'community-in-numbers-infographic-item-count']">№{{ count1.toLocaleString() }}</div>
                    <div :class="[FONT_MONT_BOOK, 'community-in-numbers-infographic-item-desc']">{{ TEXT_1 }}</div>
                </div>
            </div>

            <div class="community-in-numbers-infographic-item">
                <div :class="['community-in-numbers-infographic-item-line', shouldAnimate ? 'animate-line-2' : '']" />
                <div :class="['community-in-numbers-infographic-item-animated', shouldAnimate ? 'animate-item-2' : '']">
                    <div class="community-in-numbers-infographic-item-fill" />
                </div>
                <div
                    :class="['community-in-numbers-infographic-item-content', shouldAnimate ? 'animate-content-2' : '']"
                    :style="notAnimatedStyle"
                >
                    <div :class="[FONT_MONT_BOOK_EXTRA_LIGHT, 'community-in-numbers-infographic-item-count']">{{ count2 }}{{ count2 === 1700 ? '+' : '' }}</div>
                    <div :class="[FONT_MONT_BOOK, 'community-in-numbers-infographic-item-desc']">{{ TEXT_2 }}</div>
                </div>
            </div>

            <div class="community-in-numbers-infographic-item">
                <div :class="['community-in-numbers-infographic-item-line', shouldAnimate ? 'animate-line-3' : '']" />
                <div :class="['community-in-numbers-infographic-item-animated', shouldAnimate ? 'animate-item-3' : '']">
                    <div class="community-in-numbers-infographic-item-fill" />
                </div>
                <div
                    :class="['community-in-numbers-infographic-item-content', shouldAnimate ? 'animate-content-3' : '']"
                    :style="notAnimatedStyle"
                >
                    <div :class="[FONT_MONT_BOOK_EXTRA_LIGHT, 'community-in-numbers-infographic-item-count']">{{ count3 }}%</div>
                    <div :class="[FONT_MONT_BOOK, 'community-in-numbers-infographic-item-desc']">{{ TEXT_3 }}</div>
                </div>
            </div>

            <div class="community-in-numbers-infographic-item">
                <div :class="['community-in-numbers-infographic-item-line', shouldAnimate ? 'animate-line-4' : '']" />
                <div :class="['community-in-numbers-infographic-item-animated', shouldAnimate ? 'animate-item-4' : '']">
                    <div class="community-in-numbers-infographic-item-fill" />
                </div>
                <div
                    :class="['community-in-numbers-infographic-item-content', shouldAnimate ? 'animate-content-4' : '']"
                    :style="notAnimatedStyle"
                >
                    <div :class="[FONT_MONT_BOOK_EXTRA_LIGHT, 'community-in-numbers-infographic-item-count']">{{ count4 }}</div>
                    <div :class="[FONT_MONT_BOOK, 'community-in-numbers-infographic-item-desc']">{{ TEXT_4 }}</div>
                </div>
            </div>
        </div>

        <div v-if="isMobile === true" class="community-in-numbers-infographic-mobile">
            <div class="community-in-numbers-infographic-mobile-left-content">
                <div class="community-in-numbers-infographic-mobile-item">
                    <div class="community-in-numbers-infographic-mobile-content">
                        <div :class="[FONT_MONT_BOOK_EXTRA_LIGHT, 'community-in-numbers-infographic-item-count']">№{{ count1.toLocaleString() }}</div>
                        <div :class="[FONT_MONT_BOOK, 'community-in-numbers-infographic-item-desc']">{{ TEXT_1 }}</div>
                    </div>
                </div>

                <div class="community-in-numbers-infographic-mobile-item">
                    <div class="community-in-numbers-infographic-mobile-content">
                        <div :class="[FONT_MONT_BOOK_EXTRA_LIGHT, 'community-in-numbers-infographic-item-count']">{{ count3 }}%</div>
                        <div :class="[FONT_MONT_BOOK, 'community-in-numbers-infographic-item-desc']">{{ TEXT_3 }}</div>
                    </div>
                </div>
            </div>

            <div :class="['community-in-numbers-infographic-mobile-line', shouldAnimate ? 'community-in-numbers-infographic-mobile-line-animate' : '']" />

            <div class="community-in-numbers-infographic-mobile-right-content">
                <div class="community-in-numbers-infographic-mobile-item">
                    <div class="community-in-numbers-infographic-mobile-item-content">
                        <div :class="[FONT_MONT_BOOK_EXTRA_LIGHT, 'community-in-numbers-infographic-item-count']">{{ count2 }}{{ count2 === 1700 ? '+' : '' }}</div>
                        <div :class="[FONT_MONT_BOOK, 'community-in-numbers-infographic-item-desc']">{{ TEXT_2 }}</div>
                    </div>
                </div>

                <div class="community-in-numbers-infographic-mobile-item">
                    <div class="community-in-numbers-infographic-mobile-content">
                        <div :class="[FONT_MONT_BOOK_EXTRA_LIGHT, 'community-in-numbers-infographic-item-count']">{{ count4 }}</div>
                        <div :class="[FONT_MONT_BOOK, 'community-in-numbers-infographic-item-desc']">{{ TEXT_4 }}</div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>
