<script setup lang="ts">
// Попап «Подробнее» с полным текстом о кэмпе. Закрывается крестиком, кликом по фону и Esc.
const open = defineModel<boolean>('open', { default: false });

const links = useRuntimeConfig().public;
const asset = useAsset();
const closeRef = ref<HTMLButtonElement | null>(null);

const close = () => { open.value = false; };
const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') close(); };

watch(open, async (value) => {
    document.documentElement.style.overflow = value ? 'hidden' : '';
    if (value) {
        window.addEventListener('keydown', onKey);
        await nextTick();
        closeRef.value?.focus();
    } else {
        window.removeEventListener('keydown', onKey);
    }
});

onBeforeUnmount(() => {
    window.removeEventListener('keydown', onKey);
    if (open.value) document.documentElement.style.overflow = '';
});
</script>

<template>
    <Teleport to="body">
        <Transition name="about">
            <div v-if="open" class="about" role="dialog" aria-modal="true" aria-labelledby="about-title" @click.self="close">
                <article class="about__panel">
                    <button ref="closeRef" type="button" class="about__close" aria-label="Закрыть" @click="close">
                        <img :src="asset('icons/close.svg')" width="18" height="18" alt="">
                    </button>

                    <h2 id="about-title" class="about__title">South HUB Camp 2027<span>Coworking</span></h2>

                    <div class="about__text">
                        <p class="about__accent">В прошлом году мы мечтали вместе. В этом — создаём вместе.</p>
                        <p>SOUTH HUB — масштаб людей, идей и тёплых связей.</p>
                        <p>Сообщество, построенное на философии нетворминга. Здесь знакомства перерастают в доверие, доверие — в партнёрства, а идеи — в совместные проекты.</p>
                        <p>
                            В этом году мы делаем следующий шаг.<br>
                            От общей мечты — к совместному созиданию.<br>
                            Объединяем лидеров, команды, корпорации и страны, чтобы не просто обсуждать будущее, а создавать его вместе.
                        </p>
                        <p>SOUTH HUB CAMP 2027 — COWORKING.</p>
                        <p class="about__accent">Будущее создаётся между нами.</p>
                    </div>

                    <a :href="links.ticketLink" target="_blank" rel="noopener" class="btn about__cta">Купить билет</a>
                </article>
            </div>
        </Transition>
    </Teleport>
</template>

<style scoped>
.about {
    position: fixed;
    inset: 0;
    z-index: 30;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 40px 16px;
    overflow-y: auto;
    overscroll-behavior: contain;
    background: rgba(0, 0, 0, .35);
    -webkit-backdrop-filter: blur(30px);
    backdrop-filter: blur(30px);
    color: var(--white);
}

.about__panel {
    position: relative;
    width: 100%;
    max-width: 760px;
    margin: auto;
    padding: 50px;
    border: 1px solid rgba(255, 255, 255, .1);
    border-radius: 15px;
    background: rgba(0, 0, 0, .25);
}

.about__close {
    position: absolute;
    top: 16px;
    right: 16px;
    width: 50px;
    height: 50px;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: opacity .2s ease, transform .25s ease;
}
@media (hover: hover) { .about__close:hover { transform: rotate(90deg); } }
.about__close:active { opacity: .5; }

.about__title {
    padding-right: 40px;
    font-size: 48px;
    line-height: 1.1;
    text-transform: uppercase;
}
.about__title span { display: block; margin-top: 8px; font-size: 24px; letter-spacing: .08em; opacity: .7; }

.about__text {
    display: flex;
    flex-direction: column;
    gap: 20px;
    margin-top: 40px;
    font-size: 18px;
    line-height: 1.4;
}
.about__accent { font-size: 22px; line-height: 1.3; }

.about__cta { margin-top: 40px; width: 100%; max-width: 338px; }

.about-enter-active, .about-leave-active { transition: opacity .3s ease; }
.about-enter-active .about__panel, .about-leave-active .about__panel { transition: transform .3s ease; }
.about-enter-from, .about-leave-to { opacity: 0; }
.about-enter-from .about__panel, .about-leave-to .about__panel { transform: translateY(20px); }

@media (max-width: 767px) {
    .about { padding: 16px; align-items: flex-start; }
    .about__panel { padding: 30px 20px; }
    .about__close { top: 8px; right: 8px; }
    .about__title { font-size: 32px; }
    .about__title span { font-size: 18px; }
    .about__text { margin-top: 30px; font-size: 16px; gap: 16px; }
    .about__accent { font-size: 18px; }
    .about__cta { max-width: none; }
}
</style>
