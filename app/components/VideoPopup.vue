<script setup lang="ts">
// Ролик «Как прошёл South HUB'2026» во весь экран, плеер как на демо Snow BASE 2027: стартует без звука,
// звук включается кнопкой «Включить звук» или нажатием на видео, после этого появляются обычные контролы.
// Закрывается крестиком, кликом по фону и Esc.
const open = defineModel<boolean>('open', { default: false });

const asset = useAsset();
const videoRef = ref<HTMLVideoElement | null>(null);
const dialogRef = ref<HTMLElement | null>(null);
const muted = ref(true);

const unmute = () => {
    const v = videoRef.value;
    if (!v || !muted.value) return;
    v.muted = false;
    v.play().catch(() => {});
};

const close = () => { open.value = false; };
const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') close(); };

watch(open, async (value) => {
    document.documentElement.style.overflow = value ? 'hidden' : '';
    if (value) {
        muted.value = true;
        window.addEventListener('keydown', onKey);
        await nextTick();
        // фокус на сам диалог, а не на крестик: иначе Safari рисует вокруг крестика синюю рамку
        dialogRef.value?.focus({ preventScroll: true });
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
            <div v-if="open" ref="dialogRef" class="reel" tabindex="-1" role="dialog" aria-modal="true" aria-label="Как прошёл South HUB'2026" @click.self="close">
                <button type="button" class="corners reel__close" aria-label="Закрыть" @click="close">
                    <i /><i /><i /><i />
                    <img :src="asset('icons/close-thin.svg')" width="14" height="14" alt="">
                </button>
                <div class="reel__frame">
                    <video
                        ref="videoRef"
                        class="reel__video"
                        :src="asset('video/recap-2026.mp4')"
                        :poster="asset('img/recap-2026.webp')"
                        :controls="!muted"
                        muted
                        autoplay
                        playsinline
                        preload="metadata"
                        @click="unmute"
                        @volumechange="muted = ($event.target as HTMLVideoElement).muted"
                    />
                    <button v-if="muted" type="button" class="reel__sound" @click="unmute">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true">
                            <path d="M4 9v6h4l5 4V5L8 9H4z" />
                            <path d="M16.5 8.5a5 5 0 0 1 0 7M19 6a8.5 8.5 0 0 1 0 12" />
                        </svg>
                        Включить звук
                    </button>
                </div>
            </div>
        </Transition>
    </Teleport>
</template>

<style scoped>
.reel:focus { outline: none; }
.reel {
    position: fixed;
    inset: 0;
    z-index: 30;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 70px 16px;
    background: rgba(0, 0, 0, .85);
}

.reel__frame { position: relative; }

.reel__video {
    width: min(100%, 80svh, 720px);
    aspect-ratio: 1;
    border-radius: 15px;
    background: #000;
    cursor: pointer;
}

.reel__sound {
    position: absolute;
    left: 50%;
    bottom: 20px;
    transform: translateX(-50%);
    display: flex;
    align-items: center;
    gap: 10px;
    height: 44px;
    padding: 0 20px;
    background: rgba(255, 255, 255, .85);
    -webkit-backdrop-filter: blur(10px);
    backdrop-filter: blur(10px);
    color: var(--black);
    border-radius: 50px;
    font-size: 16px;
    white-space: nowrap;
    transition: background .2s ease;
}
@media (hover: hover) { .reel__sound:hover { background: var(--white); } }

.reel__close {
    position: absolute;
    top: 16px;
    right: 16px;
    width: 50px;
    height: 50px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--white);
    transition: opacity .2s ease;
}

.reel-enter-active, .reel-leave-active { transition: opacity .3s ease; }
.reel-enter-active .reel__frame, .reel-leave-active .reel__frame { transition: transform .3s ease; }
.reel-enter-from, .reel-leave-to { opacity: 0; }
.reel-enter-from .reel__frame, .reel-leave-to .reel__frame { transform: scale(.96); }
</style>
