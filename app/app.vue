<script setup lang="ts">
import montBook from '~/assets/fonts/Mont-Book.woff2?url';
import ibmSerifItalic from '~/assets/fonts/IBMPlexSerif-Italic.woff2?url';
import ibmSerifLight from '~/assets/fonts/IBMPlexSerif-Light.woff2?url';

// Шрифты первого экрана грузим сразу, как делал next/font
useHead({
    link: [montBook, ibmSerifItalic, ibmSerifLight].map((href) => ({
        rel: 'preload', as: 'font', type: 'font/woff2', href, crossorigin: '',
    })),
});

await useSeoData();

const isOpenCookieModal = ref(false);

onMounted(() => {
    if (!window.localStorage.getItem('isVisibleCookieAlert')) {
        isOpenCookieModal.value = true;
    }
});

const acceptCookies = () => {
    isOpenCookieModal.value = false;
    window.localStorage.setItem('isVisibleCookieAlert', 'true');
};

const cookieText = `Мы собираем cookies, потому что они помогают сайту помнить вас и${NBSP}оставаться таким${NBSP}же внимательным, как${NBSP}люди в${NBSP}сообществе South${NBSP}HUВ. Просто скажите «да»`;
</script>

<template>
    <Preloader />

    <div style="position: relative; top: 0; left: 0;">
        <AppHeader />

        <main>
            <MainBanner />

            <AccordionsBlock />

            <InfinityBanner />
            <OurProjectsScrollableBlock />

            <MoreNew />

            <SocietyPhotosBlock />

            <CommunityInNumbers />

            <InfinityBanner />

            <HowBecomeCommunityBlock />

            <BlockWithUAnimate />

            <AboutUsBlock />
        </main>

        <AppFooter />

        <div v-if="isOpenCookieModal" class="cookie-banner">
            <p :class="[FONT_MONT_BOOK, 'cookie-banner-text']">{{ cookieText }}</p>

            <div class="cookie-banner_button-wrapper">
                <AntButton
                    id="btn_lending_cookie_button"
                    :class="[FONT_MONT_BOOK, 'base-button cookie-banner-button']"
                    @click="acceptCookies"
                >
                    <span>да</span>
                </AntButton>
            </div>
        </div>
    </div>
</template>
