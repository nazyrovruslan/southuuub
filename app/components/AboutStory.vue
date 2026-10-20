<script setup lang="ts">
// Полный текст о кэмпе: идёт поверх закреплённого видео сразу под первым экраном
const links = useRuntimeConfig().public;
</script>

<template>
    <section id="about" class="story" aria-labelledby="story-title">
        <div class="story__inner">
            <h2 id="story-title" class="story__title">South HUB Camp 2027<span>Coworking</span></h2>

            <p class="story__accent">В прошлом году мы мечтали вместе. В этом — создаём вместе.</p>

            <div class="story__text">
                <p>SOUTH HUB — масштаб людей, идей и тёплых связей.</p>
                <p>Сообщество, построенное на философии нетворминга. Здесь знакомства перерастают в доверие, доверие — в партнёрства, а идеи — в совместные проекты.</p>
                <p>
                    В этом году мы делаем следующий шаг.<br>
                    От общей мечты — к совместному созиданию.<br>
                    Объединяем лидеров, команды, корпорации и страны, чтобы не просто обсуждать будущее, а создавать его вместе.
                </p>
                <p>SOUTH HUB CAMP 2027 — COWORKING.</p>
            </div>

            <p class="story__accent">Будущее создаётся между нами.</p>

            <a :href="links.ticketLink" target="_blank" rel="noopener" class="btn btn--solid story__cta">Купить билет</a>
        </div>
    </section>
</template>

<style scoped>
.story {
    position: relative;
    z-index: 1;
    display: flex;
    align-items: center;
    min-height: 100svh;
    padding: max(120px, calc(var(--u) * 200)) calc(var(--u) * 40);
    color: var(--white);
    text-shadow: 0 1px 24px rgba(0, 0, 0, .35);
    /* лёгкое затемнение, чтобы текст читался на ярком кадре */
    background: linear-gradient(180deg, transparent, rgba(0, 0, 0, .35) 20%, rgba(0, 0, 0, .35) 80%, transparent);
}

/* колонка текста стоит там же, где подводка в первом экране */
.story__inner {
    display: flex;
    flex-direction: column;
    gap: max(24px, calc(var(--u) * 40));
    width: min(100%, max(560px, calc(var(--u) * 800)));
    margin-left: auto;
    margin-right: calc(var(--u) * 40);
}

.story__title {
    font-size: max(40px, calc(var(--u) * 80));
    line-height: 1;
    text-transform: uppercase;
}
.story__title span {
    display: block;
    margin-top: 12px;
    font-size: max(18px, calc(var(--u) * 28));
    letter-spacing: .08em;
    opacity: .7;
}

.story__accent { font-size: max(22px, calc(var(--u) * 36)); line-height: 1.25; }

.story__text {
    display: flex;
    flex-direction: column;
    gap: 20px;
    font-size: max(16px, calc(var(--u) * 22));
    line-height: 1.45;
}

.story__cta { align-self: flex-start; min-width: 240px; margin-top: 10px; }

@media (max-width: 1279px) {
    .story { padding: 100px 16px; }
    .story__inner { width: 100%; max-width: 640px; margin: 0; }
}

@media (max-width: 767px) {
    .story { padding: 80px 16px; }
    .story__title { font-size: 34px; }
    .story__title span { font-size: 16px; }
    .story__accent { font-size: 22px; }
    .story__text { gap: 16px; }
    .story__cta { align-self: stretch; }
}
</style>
