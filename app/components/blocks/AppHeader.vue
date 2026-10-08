<script setup lang="ts">
const pub = usePublicPath();
const getLinkWithUtm = useLinkWithUtm();
const lkLink = useLkProfileLink();

// Сколько пикселей прокрутки нужно в одну сторону, чтобы шапка вернулась или снова спряталась
const PEEK_DELTA = 8;

// После начала прокрутки шапке нужна подложка, иначе на телефонах она лежит прямо на тексте.
// Прокрутка вверх всегда возвращает шапку, даже там, где блоки её прячут (header_peek).
let removeScroll: (() => void) | undefined;
onMounted(() => {
    const header = document.getElementById('header');
    if (!header) return;

    let lastY = window.scrollY;
    const update = () => {
        const y = window.scrollY;
        header.classList.toggle('header_scrolled', y > 10);
        if (y <= 10 || y - lastY > PEEK_DELTA) {
            header.classList.remove('header_peek');
        } else if (lastY - y > PEEK_DELTA) {
            header.classList.add('header_peek');
        } else {
            return;
        }
        lastY = y;
    };
    update();
    window.addEventListener('scroll', update, { passive: true });
    removeScroll = () => window.removeEventListener('scroll', update);
});
onBeforeUnmount(() => removeScroll?.());

const scrollToTop = () => window.scrollTo({ top: 0, behavior: 'smooth' });
</script>

<template>
    <div id="header" class="header header_desktop">
        <div class="header_desktop_wrapper">
            <div class="header-logo">
                <img
                    :src="pub('/v2/header-logo-white.svg')"
                    alt="SOUTHUUUB"
                    width="180"
                    height="21"
                    style="cursor: pointer;"
                    class="header-logo-white"
                    @click="scrollToTop"
                >
                <img
                    :src="pub('/v2/footer/footer-logo-black.svg')"
                    alt="SOUTHUUUB"
                    width="180"
                    height="21"
                    style="cursor: pointer;"
                    class="header-logo-black"
                    @click="scrollToTop"
                >

                <HeaderBurger />
            </div>

            <div class="header-items">
                <HeaderItem id="btn_lending_header_item_southub" title="south hub camp" :link="getLinkWithUtm('https://southhub.ru/southub/')" />
                <HeaderItem id="btn_lending_header_item_our_project" title="где встречаемся" into-scroll="our-projects-block" />
                <HeaderItem id="btn_lending_header_item_login" title="войти" :link="lkLink('head')" />
            </div>
        </div>
    </div>
</template>
