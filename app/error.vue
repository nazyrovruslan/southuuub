<script setup lang="ts">
import type { NuxtError } from '#app';

const props = defineProps<{ error: NuxtError }>();
const pub = usePublicPath();

const code = computed(() => props.error?.statusCode || 500);
const isNotFound = computed(() => code.value === 404);

const title = computed(() => (isNotFound.value ? 'Такой страницы нет' : 'Что-то пошло не так'));
const text = computed(() => (isNotFound.value
    ? `Возможно, ссылка устарела или${NBSP}в${NBSP}адресе опечатка. Всё главное о${NBSP}South${NBSP}HUB на${NBSP}главной.`
    : `Мы уже разбираемся. Обновите страницу чуть позже или${NBSP}вернитесь на${NBSP}главную.`));

useHead({
    title: () => `${code.value} · South HUB`,
    meta: [{ name: 'robots', content: 'noindex' }],
});
</script>

<template>
    <div class="error-page">
        <a :href="pub('/')" class="error-page-logo">
            <img :src="pub('/v2/header-logo-white.svg')" alt="SOUTHUUUB" width="180" height="21">
        </a>

        <main class="error-page-content">
            <p :class="[FONT_MONT_BOOK_EXTRA_LIGHT, 'error-page-code']">{{ code }}</p>
            <h1 :class="[FONT_IBM_PLEX_SERIF_ITALIC, 'error-page-title']">{{ title }}</h1>
            <p :class="[FONT_MONT_BOOK, 'error-page-text']">{{ text }}</p>
            <a :href="pub('/')" :class="[FONT_MONT_BOOK, 'base-button error-page-button']">на главную</a>
        </main>
    </div>
</template>

<style>
.error-page {
    min-height: 100vh;
    min-height: 100svh;
    display: flex;
    flex-direction: column;
    padding: 24px 40px 48px;
    background: rgb(17, 17, 17);
    color: #fff;
}

.error-page-logo img {
    display: block;
}

.error-page-content {
    flex: 1;
    display: flex;
    flex-direction: column;
    justify-content: center;
    max-width: 720px;
}

.error-page-code {
    margin: 0;
    font-size: clamp(120px, 22vw, 320px);
    line-height: 0.9;
    letter-spacing: -0.04em;
    color: #D5FF37;
}

.error-page-title {
    margin: 24px 0 0;
    font-size: clamp(32px, 4vw, 56px);
    line-height: 1.1;
    font-weight: 400;
}

.error-page-text {
    margin: 16px 0 40px;
    max-width: 480px;
    font-size: 18px;
    line-height: 1.4;
    color: rgba(255, 255, 255, 0.7);
}

.error-page-button {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    text-decoration: none;
}

@media (max-width: 767px) {
    .error-page {
        padding: 16px 16px 40px;
    }

    .error-page-text {
        font-size: 16px;
    }
}
</style>
