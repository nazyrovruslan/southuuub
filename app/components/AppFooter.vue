<script setup lang="ts">
const links = useRuntimeConfig().public;
const asset = useAsset();
</script>

<template>
    <footer class="footer">
        <div class="median">
            <a :href="links.medianLink" target="_blank" rel="noopener" class="median__logo fade" aria-label="median.agency">
                <img :src="asset('icons/median.svg')" width="186" height="80" alt="median.agency">
            </a>
            <span class="median__line" />
            <div class="median__made">
                <a :href="links.contactUsLink" target="_blank" rel="noopener" class="bracket median__contact">Связаться</a>
                <p class="median__text">made by median.agency<br>Команда, которая мечтает. думает. делает.</p>
            </div>
        </div>

        <span class="footer__line" />

        <div class="bottom">
            <a :href="links.siteLink" target="_blank" rel="noopener" class="bottom__logo fade" aria-label="South HUB">
                <img :src="asset('icons/logo-black.svg')" width="186" height="21" alt="SOUTHUUUB">
            </a>

            <div class="bottom__contacts">
                <p>Контакты:</p>
                <p>Email: <a href="mailto:mail@southhub.ru" class="u-link">mail@southhub.ru</a></p>
                <p>Telegram: <a :href="links.askLink" target="_blank" rel="noopener" class="u-link">+7 862 29 59 977</a></p>
            </div>

            <p class="bottom__legal">
                ООО «Высокие люди»<br>
                ИНН 2320134913<br>
                <a :href="links.confidentialLink" target="_blank" rel="noopener" class="legal-link">Политика конфиденциальности</a><br>
                <a :href="links.cookiesLink" target="_blank" rel="noopener" class="legal-link">Политика обработки файлов cookie</a><br>
                <a :href="links.pdLink" target="_blank" rel="noopener" class="legal-link">Политика обработки персональных данных</a><br>
                © 2022-2026 South HUB. Все права защищены
            </p>

            <div class="bottom__social">
                <a :href="links.youtubeLink" target="_blank" rel="noopener" class="fade" aria-label="YouTube">
                    <img :src="asset('icons/youtube.svg')" width="22" height="16" alt="">
                </a>
                <a :href="links.linkedinLink" target="_blank" rel="noopener" class="fade" aria-label="LinkedIn">
                    <img :src="asset('icons/linkedin.svg')" width="20" height="20" alt="">
                </a>
                <a :href="links.telegramChannelLink" target="_blank" rel="noopener" class="fade" aria-label="Telegram">
                    <img :src="asset('icons/telegram-black.svg')" width="23" height="19" alt="">
                </a>
            </div>
        </div>
    </footer>
</template>

<style scoped>
.footer {
    padding: 80px calc(var(--u) * 40);
    background: var(--page);
    color: var(--black);
}

.fade { transition: opacity .2s ease; }
@media (hover: hover) { .fade:hover { opacity: .5; } }
.fade:active { opacity: .25; }

.median {
    display: flex;
    align-items: center;
    gap: 40px;
}
.median__logo img { width: 186px; height: 80px; }
.median__line { flex: 1; height: 1px; background: var(--grey); }
.median__made {
    display: flex;
    align-items: center;
    gap: calc(var(--u) * 54);
    flex: none;
}
.median__contact { flex: none; --btn-w: 191px; }
.median__text { font-size: max(20px, calc(var(--u) * 25)); line-height: 1.28; white-space: nowrap; }

.footer__line {
    display: block;
    height: 1px;
    margin-top: max(140px, calc(var(--u) * 245));
    background: var(--grey);
}

.bottom {
    display: grid;
    grid-template-columns: calc(var(--u) * 465) calc(var(--u) * 620) 1fr auto;
    align-items: end;
    margin-top: 40px;
    font-size: 16px;
    line-height: 1.25;
}
.bottom__logo img { width: 186px; height: 21px; }
.bottom__contacts { display: flex; flex-direction: column; gap: 10px; }
.bottom__legal { line-height: 1.25; }
.bottom__social { display: flex; gap: 40px; align-items: center; height: 24px; }
.bottom__social a { display: flex; align-items: center; justify-content: center; width: 24px; height: 24px; }

.u-link { transition: opacity .2s ease; }
@media (hover: hover) { .u-link:hover { text-decoration: underline; text-underline-offset: 3px; } }
.legal-link { text-decoration: underline; text-underline-offset: 2px; transition: opacity .2s ease; }
@media (hover: hover) { .legal-link:hover { opacity: .5; } }

@media (max-width: 1279px) and (min-width: 1024px) {
    .bottom { grid-template-columns: 1fr 1fr 1.4fr auto; gap: 24px; }
}

@media (max-width: 1023px) {
    .footer { padding: 60px 16px 40px; }
    .median { flex-direction: column; align-items: flex-start; gap: 40px; }
    .median__logo img { width: 171px; height: 74px; }
    .median__line { display: none; }
    .median__made { flex-direction: column-reverse; align-items: flex-start; gap: 20px; }
    .median__text { font-size: 20px; white-space: normal; max-width: 300px; }

    .footer__line { margin-top: 60px; }

    .bottom {
        display: flex;
        flex-direction: column;
        align-items: flex-start;
        gap: 40px;
        margin-top: 70px;
        font-size: 14px;
    }
    .bottom__contacts { gap: 10px; }
    .bottom__social { gap: 40px; }
}

@media (max-width: 1023px) and (min-width: 600px) {
    .footer { padding: 80px 32px 48px; }
}
</style>
