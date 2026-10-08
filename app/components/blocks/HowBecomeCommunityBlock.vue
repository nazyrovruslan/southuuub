<script setup lang="ts">
const lkLink = useLkProfileLink();

const handleClick = () => openExternal(lkLink('community'));

const title = 'стать частью\nсообщества';
const description = `мы заботливо формируем наше\nсообщество, чтобы вы в${NBSP}нём чувствовали\nсебя комфортно и${NBSP}усиливали друг друга. поэтому очень внимательно относимся\nк модерации каждой заявки.`;

let cleanup: (() => void) | undefined;

onMounted(() => {
    const header = document.querySelector('#header');
    const targetBlock = document.querySelector('#how-become-community-block');

    if (!header || !targetBlock) return;

    let lastScrollY = window.scrollY;
    let isHeaderBlack = false;

    const handleScroll = () => {
        const currentScrollY = window.scrollY;
        const blockTop = targetBlock.getBoundingClientRect().top;
        const isScrollingUp = currentScrollY < lastScrollY;

        if (blockTop <= 0) {
            if (!isHeaderBlack) {
                header.classList.add('header_black');
                isHeaderBlack = true;
            }
        } else if (isScrollingUp && blockTop <= 50) {
            if (!isHeaderBlack) {
                header.classList.add('header_black');
                isHeaderBlack = true;
            }
        } else if (isHeaderBlack) {
            header.classList.remove('header_black');
            isHeaderBlack = false;
        }

        lastScrollY = currentScrollY;
    };

    window.addEventListener('scroll', handleScroll);

    handleScroll();

    cleanup = () => window.removeEventListener('scroll', handleScroll);
});

onBeforeUnmount(() => cleanup?.());
</script>

<template>
    <div id="how-become-community-block" class="how-become-community-block-wrapper">
        <h3 :class="[FONT_MONT_BOOK, 'how-become-community-block-title']">{{ title }}</h3>

        <p :class="[FONT_MONT_BOOK, 'how-become-community-block-description']">{{ description }}</p>

        <AntButton
            id="btn_lending_apply_community"
            class="how-become-community-block-button base-button base-button_black"
            @click="handleClick"
        >
            <span :class="FONT_MONT_BOOK">подать заявку</span>
        </AntButton>
    </div>
</template>
