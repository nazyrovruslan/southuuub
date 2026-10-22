<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue'
import southuIcon from '../../assets/icons/southu.svg'
import uIcon from '../../assets/icons/u.svg'
import bIcon from '../../assets/icons/b.svg'
// Чёрный блок с буквами U, как на southhub.ru: буквы под курсором (на телефоне — под пальцем)
// плавно увеличиваются вместе с соседями и медленно возвращаются.
type Cell = { kind: 'logo' | 'u' | 'b' | 'text' | 'empty'; span?: number };

const TEXT = 'масштаб идей, людей и тёплых связей';

const row = (n: number, kind: Cell['kind'] = 'u'): Cell[] => Array.from({ length: n }, () => ({ kind }));

// Десктоп: 5 рядов по 12 ячеек. Первый ряд, как на Snow BASE, не в сетке: логотип слева,
// а буквы распределяются по оставшейся ширине своим шагом, поэтому не встают в колонки других рядов
const desktopRows: Cell[][] = [
    [{ kind: 'logo' }, ...row(11)],
    row(12),
    [...row(7), { kind: 'text', span: 4 }, { kind: 'u' }],
    row(12),
    [...row(11), { kind: 'b' }],
];

// Телефон: 7 рядов по 6 ячеек
const mobileRows: Cell[][] = [
    [{ kind: 'logo' }, ...row(4)],
    row(6),
    row(6),
    [{ kind: 'u' }, { kind: 'text', span: 5 }],
    row(6),
    row(6),
    [...row(5), { kind: 'b' }],
];

const WAVE_MAX_SCALE = 2;
const WAVE_RADIUS = 1.1;   // радиус влияния в шагах сетки
const WAVE_GROW = 0.22;    // скорость увеличения за кадр
const WAVE_FADE = 0.06;    // скорость затухания за кадр

const blockRef = ref<HTMLElement | null>(null);
let cleanup: (() => void) | undefined;

onMounted(() => {
    const block = blockRef.value;
    if (!block || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    let letters: HTMLElement[] = [];
    let centers: { x: number; y: number }[] = [];
    let current: number[] = [];
    let pitch = 1;
    let pointer: { x: number; y: number } | null = null;
    let frame = 0;

    const measure = () => {
        letters = Array.from(block.querySelectorAll<HTMLElement>('[data-wave]')).filter((el) => el.offsetParent !== null);
        const rect = block.getBoundingClientRect();
        centers = letters.map((el) => {
            const r = el.getBoundingClientRect();
            return { x: r.left - rect.left + r.width / 2, y: r.top - rect.top + r.height / 2 };
        });
        current = letters.map(() => 1);
        // шаг сетки берётся по последнему ряду: первый ряд стоит не в сетке
        const last = centers[centers.length - 1];
        const sameRow = centers.filter((c) => last && c.y === last.y).sort((a, b) => a.x - b.x);
        const prev = sameRow[sameRow.length - 2];
        pitch = last && prev ? last.x - prev.x : 100;
    };

    const tick = () => {
        let moving = false;
        letters.forEach((el, i) => {
            let target = 1;
            if (pointer) {
                const c = centers[i]!;
                const d = Math.hypot((c.x - pointer.x) / pitch, (c.y - pointer.y) / (pitch * 0.9));
                target = 1 + (WAVE_MAX_SCALE - 1) * Math.max(0, 1 - d / WAVE_RADIUS);
            }
            const speed = target > current[i]! ? WAVE_GROW : WAVE_FADE;
            current[i]! += (target - current[i]!) * speed;
            if (Math.abs(target - current[i]!) > 0.002) moving = true;
            else current[i] = target;
            el.style.transform = current[i] === 1 ? '' : `scale(${current[i]!.toFixed(3)})`;
        });
        frame = moving || pointer ? requestAnimationFrame(tick) : 0;
    };

    const start = () => { if (!frame) frame = requestAnimationFrame(tick); };

    const setPointer = (clientX: number, clientY: number) => {
        const rect = block.getBoundingClientRect();
        pointer = { x: clientX - rect.left, y: clientY - rect.top };
        start();
    };
    const clearPointer = () => { pointer = null; start(); };

    const onMove = (e: PointerEvent) => setPointer(e.clientX, e.clientY);
    const onTouch = (e: TouchEvent) => { const t = e.touches[0]; if (t) setPointer(t.clientX, t.clientY); };

    measure();
    window.addEventListener('resize', measure);
    block.addEventListener('pointermove', onMove);
    block.addEventListener('pointerleave', clearPointer);
    block.addEventListener('touchstart', onTouch, { passive: true });
    block.addEventListener('touchmove', onTouch, { passive: true });
    block.addEventListener('touchend', clearPointer);
    block.addEventListener('touchcancel', clearPointer);

    cleanup = () => {
        cancelAnimationFrame(frame);
        window.removeEventListener('resize', measure);
        block.removeEventListener('pointermove', onMove);
        block.removeEventListener('pointerleave', clearPointer);
        block.removeEventListener('touchstart', onTouch);
        block.removeEventListener('touchmove', onTouch);
        block.removeEventListener('touchend', clearPointer);
        block.removeEventListener('touchcancel', clearPointer);
    };
});

onBeforeUnmount(() => cleanup?.());
</script>

<template>
    <section ref="blockRef" class="pattern" aria-label="Масштаб идей, людей и тёплых связей">
        <div v-for="(layout, key) in { desk: desktopRows, mob: mobileRows }" :key="key" :class="['pattern__grid', `pattern__grid--${key}`]">
            <div v-for="(cells, r) in layout" :key="r" :class="['pattern__row', { 'pattern__row--first': r === 0 }]">
                <template v-for="(cell, c) in cells" :key="c">
                    <img v-if="cell.kind === 'logo'" :src="southuIcon" width="119" height="20" alt="SOUTHU" class="pattern__logo">
                    <img v-else-if="cell.kind === 'u'" :src="uIcon" width="19" height="20" alt="" class="pattern__letter" data-wave>
                    <img v-else-if="cell.kind === 'b'" :src="bIcon" width="19" height="20" alt="" class="pattern__letter" data-wave>
                    <p v-else-if="cell.kind === 'text'" class="pattern__text" :style="{ gridColumn: `span ${cell.span}` }">{{ TEXT }}</p>
                    <span v-else />
                </template>
            </div>
        </div>
    </section>
</template>

<style scoped>
.pattern {
    background: var(--black);
    color: var(--white);
    overflow: hidden;
    touch-action: pan-y;
}

.pattern__grid {
    display: flex;
    flex-direction: column;
    padding: calc(var(--u) * 40) calc(var(--u) * 40);
    gap: calc(var(--u) * 100);
}

/* Ячейки стоят с одинаковым шагом, первая у левого края, последняя у правого, как в макете */
.pattern__row {
    display: grid;
    grid-template-columns: repeat(11, minmax(0, 1fr)) 19px;
    align-items: center;
    height: 20px;
}

/* первый ряд: логотип у левого края, буквы разложены по остатку ширины своим шагом, как на Snow BASE */
.pattern__row--first { display: flex; justify-content: space-between; }

.pattern__grid--mob { display: none; }

.pattern__letter {
    width: 19px;
    height: 20px;
    transform-origin: 50% 50%;
    will-change: transform;
}
/* логотип занимает одну ячейку: на узких экранах он сжимается, чтобы не наехать на соседнюю букву */
.pattern__logo { width: min(119px, calc((100vw - var(--u) * 80 - 19px) / 11 - 16px)); height: auto; max-width: none; }

.pattern__text {
    font-size: max(16px, calc(var(--u) * 26));
    line-height: 1;
    white-space: nowrap;
    margin-left: -2px;
}

@media (max-width: 1023px) {
    .pattern__grid--desk { display: none; }
    .pattern__grid--mob {
        display: flex;
        padding: 60px 16px;
        gap: 90px;
    }
    .pattern__grid--mob .pattern__row { grid-template-columns: repeat(5, minmax(0, 1fr)) 19px; }
    .pattern__logo { width: 119px; }
    .pattern__text { font-size: 14px; text-align: right; margin-left: 0; }
}

@media (max-width: 1023px) and (min-width: 600px) {
    .pattern__grid--mob { padding: 80px 32px; }
    .pattern__text { font-size: 18px; }
}
</style>
