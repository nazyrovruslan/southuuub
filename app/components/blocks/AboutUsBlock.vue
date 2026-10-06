<script setup lang="ts">
const pub = usePublicPath();
const getLinkWithUtm = useLinkWithUtm();
const { telegramContactUsLink } = useRuntimeConfig().public;

const handleClick = () => window.open(getLinkWithUtm(telegramContactUsLink), '_blank');

const text = 'made by median.agency\nКоманда, которая мечтает. думает. делает.';
</script>

<template>
    <div id="about-us-block" class="about-us-block-wrapper">
        <div class="about-us-block-info-wrapper">
            <div class="about-us-block-logo-wrapper">
                <a
                    id="btn_lending_logo_about_us"
                    href="https://median.agency"
                    target="_blank"
                    rel="noopener noreferrer"
                >
                    <img :src="pub('/v2/median-logo.png')" alt="median-agency" width="201" height="87" loading="lazy" decoding="async">
                </a>
            </div>

            <div class="about-us-block-line" />

            <div class="about-us-block-button-wrapper">
                <AntButton
                    id="btn_lending_contact_us"
                    :class="[FONT_MONT_BOOK, 'about-us-block-info-button base-button base-button_black']"
                    @click="handleClick"
                >
                    <span>связаться</span>
                </AntButton>
            </div>

            <div class="about-us-block-text-wrapper">
                <p :class="[FONT_MONT_BOOK, 'about-us-block-info-text']">{{ text }}</p>
            </div>
        </div>
    </div>
</template>
