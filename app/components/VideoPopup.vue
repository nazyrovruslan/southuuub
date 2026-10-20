<script setup lang="ts">
// Ролик «Как прошёл South HUB'2026» во весь экран со звуком. Закрывается крестиком, кликом по фону и Esc.
const open = defineModel<boolean>('open', { default: false });

const asset = useAsset();
const videoRef = ref<HTMLVideoElement | null>(null);
const closeRef = ref<HTMLButtonElement | null>(null);

const close = () => { open.value = false; };
const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') close(); };

watch(open, async (value) => {
    document.documentElement.style.overflow = value ? 'hidden' : '';
    if (value) {
        window.addEventListener('keydown', onKey);
        await nextTick();
        closeRef.value?.focus();
        videoRef.value?.play().catch(() => {});
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
        <Transition name="reel">
            <div v-if="open" class="reel" role="dialog" aria-modal="true" aria-label="Как прошёл South HUB'2026" @click.self="close">
                <button ref="closeRef" type="button" class="reel__close" aria-label="Закрыть" @click="close">
                    <img :src="asset('icons/close.svg')" width="18" height="18" alt="">
                </button>
                <video
                    ref="videoRef"
                    class="reel__video"
                    :src="asset('video/recap-2026.mp4')"
                    :poster="asset('img/recap-2026.webp')"
                    controls
                    playsinline
                    preload="metadata"
                />
            </div>
        </Transition>
    </Teleport>
</template>

<style scoped>
.reel {
    position: fixed;
    inset: 0;
    z-index: 30;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 70px 16px;
    background: rgba(0, 0, 0, .6);
    -webkit-backdrop-filter: blur(30px);
    backdrop-filter: blur(30px);
}

.reel__video {
    width: min(100%, 80svh, 720px);
    aspect-ratio: 1;
    border-radius: 15px;
    background: #000;
}

.reel__close {
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
@media (hover: hover) { .reel__close:hover { transform: rotate(90deg); } }
.reel__close:active { opacity: .5; }

.reel-enter-active, .reel-leave-active { transition: opacity .3s ease; }
.reel-enter-active .reel__video, .reel-leave-active .reel__video { transition: transform .3s ease; }
.reel-enter-from, .reel-leave-to { opacity: 0; }
.reel-enter-from .reel__video, .reel-leave-to .reel__video { transform: scale(.96); }
</style>
