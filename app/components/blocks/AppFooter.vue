<script setup lang="ts">
const pub = usePublicPath();
const getLinkWithUtm = useLinkWithUtm();
const {
    southhubTelegram,
    southhubConfidentialLink,
    southhubCookiesLink,
    southhubPdLink,
    southhubYoutube,
    southhubLinkedin,
    telegramChanellLink,
} = useRuntimeConfig().public;
</script>

<template>
    <div id="footer" class="footer">
        <div class="footer-wrapper">
            <div class="footer-line" />

            <div class="footer-info">
                <div class="footer-logo-wrapper">
                    <img :src="pub('/v2/footer/footer-logo-black.svg')" alt="southuub" width="200" height="22" loading="lazy" decoding="async" class="footer-logo">
                </div>

                <div class="footer-contacts footer-contacts-first">
                    <p :class="[FONT_MONT_BOOK, 'footer-contacts-label']">Контакты:</p>
                    <div class="footer-contacts-items">
                        <span :class="[FONT_MONT_BOOK, 'footer-contacts-label']">Email:</span>
                        <a href="mailto:mail@southhub.ru" target="_blank" :class="[FONT_MONT_BOOK, 'footer-contacts-link']">mail@southhub.ru</a>
                    </div>
                    <div class="footer-contacts-items">
                        <span :class="[FONT_MONT_BOOK, 'footer-contacts-label']">Telegram:</span>
                        <a :href="getLinkWithUtm(southhubTelegram)" target="_blank" :class="[FONT_MONT_BOOK, 'footer-contacts-link']">+7 862 29 59 977</a>
                    </div>
                </div>

                <div class="footer-contacts footer-contacts-second">
                    <p :class="[FONT_MONT_BOOK, 'footer-contacts-label']">ООО «Высокие люди»</p>
                    <p :class="[FONT_MONT_BOOK, 'footer-contacts-label']">ИНН 2320134913</p>
                    <a :href="getLinkWithUtm(southhubConfidentialLink)" target="_blank" :class="[FONT_MONT_BOOK, 'footer-contacts-label footer-contacts-label-dashed']">Политика конфиденциальности</a>
                    <a :href="getLinkWithUtm(southhubCookiesLink)" target="_blank" :class="[FONT_MONT_BOOK, 'footer-contacts-label footer-contacts-label-dashed']">Политика обработки файлов cookie</a>
                    <a :href="getLinkWithUtm(southhubPdLink)" target="_blank" :class="[FONT_MONT_BOOK, 'footer-contacts-label footer-contacts-label-dashed']">Политика обработки персональных данных</a>
                    <p :class="[FONT_MONT_BOOK, 'footer-contacts-label']">© 2022-2026 South HUB. Все права защищены</p>
                </div>

                <div class="footer-icons">
                    <a :href="getLinkWithUtm(southhubYoutube)" target="_blank">
                        <img :src="pub('/v2/footer/youtube.svg')" alt="youtube" width="24" height="24" loading="lazy" decoding="async">
                    </a>
                    <a :href="getLinkWithUtm(southhubLinkedin)" target="_blank">
                        <img :src="pub('/v2/footer/linkedin.svg')" alt="linkedin" width="24" height="24" loading="lazy" decoding="async">
                    </a>
                    <a :href="getLinkWithUtm(telegramChanellLink)" target="_blank" :class="[FONT_MONT_BOOK, 'footer-contacts-link']">
                        <img :src="pub('/v2/footer/telegram.svg')" alt="telegramm" width="24" height="24" loading="lazy" decoding="async">
                    </a>
                </div>
            </div>
        </div>
    </div>
</template>
