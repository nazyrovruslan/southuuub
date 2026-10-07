<script setup lang="ts">
type Device = 'desktop' | 'desktop_s' | 'tablet' | 'mobile';

const columnGrid = {
    desktop: 13,
    desktop_s: 11,
    tablet: 7,
    mobile: 5,
};

// Десктоп: шаг сетки как в макете 1440 (крестик 50px + промежуток ~56px). На экранах
// шире 1440 добавляются столбцы, на более узких столбцов 13 и сетка сжимается в процентах.
// Выше 1920 страница масштабируется целиком (wide-screen.css), столбцов столько же, сколько на 1920.
const DESKTOP_MIN_COLUMNS = 13;
const DESKTOP_PITCH = 106;
const DESKTOP_SIDE_PADDING = 60;

const getDesktopColumns = () => {
    const content = Math.min(window.innerWidth, 1920) - DESKTOP_SIDE_PADDING * 2;
    return Math.max(DESKTOP_MIN_COLUMNS, Math.floor((content + DESKTOP_PITCH - 50) / DESKTOP_PITCH));
};

// Волна, как в блоке с буквами U: крестики отталкиваются от курсора (на телефоне — от пальца)
// и поворачиваются тем сильнее, чем ближе курсор. Быстро реагируют, медленно возвращаются.
// Ближайший крестик превращается в иконку. На телефоне то же самое, но только по тапу.
const WAVE_RADIUS = 1.1;        // радиус влияния в шагах сетки по горизонтали
const WAVE_SHIFT = 14;          // максимальный сдвиг от курсора, px
const WAVE_TURN = 0.75;         // поворот: доля угла направления от курсора
const WAVE_GROW = 0.22;
const WAVE_FADE = 0.06;

// Телефон и планшет: когда прогресс блока доходит до SCROLL_SHOW_UNTIL, сразу
// открываются три разные иконки (телеграм, эфир, ютуб) в разных столбцах и остаются.
// Это происходит один раз, дальше прокрутка блок не трогает. Прогресс считается
// от момента, когда верх блока на SCROLL_START высоты экрана, до момента, когда низ
// блока на SCROLL_END.
const SCROLL_START = 0.85;
const SCROLL_END = 0.25;
const SCROLL_SHOW_UNTIL = 0.3;

const shuffledOrder = (length: number) => {
    const order = Array.from({ length }, (_, i) => i);
    let seed = 7;
    for (let i = length - 1; i > 0; i--) {
        seed = (seed * 16807) % 2147483647;
        const j = seed % (i + 1);
        [order[i], order[j]] = [order[j]!, order[i]!];
    }
    return order;
};

const pub = usePublicPath();
const getLinkWIthUtm = useLinkWithUtm();
const {
    telegramChanellLink: TELEGRAM_CHANELL_LINK,
    youtubePlaylistLink: YOUTUBE_PLAYLIST_LINK,
    southhubYoutube: SOUTHHUB_YOUTUBE,
} = useRuntimeConfig().public;

const device = ref<Device>('desktop');
const hoveredCell = ref<{ row: number; col: number } | null>(null);
const desktopColumns = ref(DESKTOP_MIN_COLUMNS);
const blockRef = ref<HTMLDivElement | null>(null);
// касание открывает ссылку, только если иконка в этой клетке уже была показана
let touchOpensLink: boolean | null = null;
// иконки при прокрутке уже показаны: второй раз не повторяем
let scrollShown = false;
// три иконки, открытые при прокрутке на телефоне
const pinnedCells = ref<{ row: number; col: number }[]>([]);

let headerCleanup: (() => void) | undefined;
let columnCleanup: (() => void) | undefined;
let waveCleanup: (() => void) | undefined;

const setupHeader = () => {
    const header = document.querySelector('#header');
    const targetBlock = document.querySelector('#more-new');

    if (!header || !targetBlock) return;

    let lastScrollY = window.scrollY;
    let isHeaderBlack = false;

    const handleScroll = () => {
        const currentScrollY = window.scrollY;
        const blockRect = targetBlock.getBoundingClientRect();
        const blockTop = blockRect.top - 70;
        const isScrollingUp = currentScrollY < lastScrollY;

        if (blockTop <= 0) {
            if (!isHeaderBlack) {
                header.classList.add('header_black');
                isHeaderBlack = true;
            }
        }
        else if (isScrollingUp && blockTop <= 70) {
            if (!isHeaderBlack) {
                header.classList.add('header_black');
                isHeaderBlack = true;
            }
        } else {
            if (isHeaderBlack) {
                header.classList.remove('header_black');
                isHeaderBlack = false;
            }
        }

        lastScrollY = currentScrollY;
    };

    window.addEventListener('scroll', handleScroll);

    handleScroll();

    return () => {
        window.removeEventListener('scroll', handleScroll);
    };
};

// Responsive device detection
const setupColumns = () => {
    const updateColumn = () => {
        const desktop_s = window.matchMedia('(max-width: 1280px)').matches;
        const tablet = window.matchMedia('(max-width: 1024px)').matches;
        const mobile = window.matchMedia('(max-width: 767px)').matches;

        if (mobile) { device.value = 'mobile'; return; }
        if (tablet) { device.value = 'tablet'; return; }
        if (desktop_s) { device.value = 'desktop_s'; return; }
        device.value = 'desktop';
        desktopColumns.value = getDesktopColumns();
    };

    window.addEventListener('resize', updateColumn);
    updateColumn();

    return () => {
        window.removeEventListener('resize', updateColumn);
    };
};

const setupWave = () => {
    const block = blockRef.value;
    if (!block) return;
    const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

    const cells = Array.from(block.querySelectorAll<HTMLElement>('[data-wave-cell]'));
    const crosses = cells.map((cell) => cell.querySelector<HTMLElement>('[data-wave-cross]'));

    // Зона наведения каждой клетки растягивается до середины пути к соседним
    // (псевдоэлемент в CSS), поэтому между крестиками нет «мёртвых» промежутков.
    const updateHitArea = () => {
        if (cells.length < 2) return;
        const a = cells[0]!.getBoundingClientRect();
        const b = cells[1]!.getBoundingClientRect();
        const row = block.querySelectorAll('.more-new-row');
        const rowGap = row.length > 1
            ? row[1]!.getBoundingClientRect().top - row[0]!.getBoundingClientRect().bottom
            : 0;
        block.style.setProperty('--wave-gap-x', `${Math.max(0, (b.left - a.right) / 2)}px`);
        block.style.setProperty('--wave-gap-y', `${Math.max(0, rowGap / 2)}px`);
    };
    updateHitArea();
    window.addEventListener('resize', updateHitArea);

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        return () => window.removeEventListener('resize', updateHitArea);
    }

    const current = cells.map(() => 0);
    const target = cells.map(() => 0);
    const dir = cells.map(() => ({ x: 0, y: 0, angle: 0 }));
    let frame = 0;

    const tick = () => {
        let moving = false;
        crosses.forEach((cross, i) => {
            const diff = target[i]! - current[i]!;
            if (Math.abs(diff) < 0.002) {
                current[i] = target[i]!;
            } else {
                current[i]! += diff * (diff > 0 ? WAVE_GROW : WAVE_FADE);
                moving = true;
            }
            if (!cross) return;
            const k = current[i]!;
            const { x, y, angle } = dir[i]!;
            cross.style.transform = k === 0
                ? ''
                : `translate(${(x * WAVE_SHIFT * k).toFixed(2)}px, ${(y * WAVE_SHIFT * k).toFixed(2)}px) rotate(${(angle * WAVE_TURN * k).toFixed(1)}deg)`;
        });
        frame = moving ? requestAnimationFrame(tick) : 0;
    };
    const run = () => {
        if (!frame) frame = requestAnimationFrame(tick);
    };

    const centerOf = (index: number) => {
        const r = cells[index]!.getBoundingClientRect();
        return { clientX: r.left + r.width / 2, clientY: r.top + r.height / 2 };
    };
    // клетки с открытыми при прокрутке иконками; соседние крестики вокруг них не двигаются
    let pinned: number[] = [];

    const wave = (point: { clientX: number; clientY: number } | null) => {
        const centers = cells.map((_, i) => centerOf(i));
        const pitch = centers.length > 1 ? Math.abs(centers[1]!.clientX - centers[0]!.clientX) || 150 : 150;
        const radius = pitch * WAVE_RADIUS;
        const sources = point ? [point] : [];

        let nearest = -1;
        let nearestDist = Infinity;
        target.fill(0);
        centers.forEach((center, i) => {
            sources.forEach((source, s) => {
                const dx = center.clientX - source.clientX;
                const dy = center.clientY - source.clientY;
                const len = Math.hypot(dx, dy);
                if (s === 0 && point && len < nearestDist) { nearestDist = len; nearest = i; }
                const d = len / radius;
                const k = Math.exp(-d * d);
                if (k <= target[i]!) return;
                target[i] = k;
                if (len > 0.5) {
                    // угол направления от курсора: 0° — сверху, 90° — справа, ±180° — снизу
                    dir[i] = { x: dx / len, y: dy / len, angle: (Math.atan2(dx, -dy) * 180) / Math.PI };
                }
            });
        });
        // крестики, ставшие иконками, не двигаем
        if (nearest >= 0) target[nearest] = 0;
        run();
        return nearest;
    };
    const onLeave = () => {
        wave(null);
    };

    const onMove = (event: PointerEvent) => {
        if (event.pointerType === 'touch') return;
        wave(event);
    };

    const nearestCell = (point: { clientX: number; clientY: number }) => {
        let nearest = -1;
        let nearestDist = Infinity;
        cells.forEach((_, i) => {
            const c = centerOf(i);
            const len = Math.hypot(c.clientX - point.clientX, c.clientY - point.clientY);
            if (len < nearestDist) { nearestDist = len; nearest = i; }
        });
        return nearest;
    };

    // Телефон: прокрутка пальцем крестики не трогает, всё происходит только по тапу.
    // Первый тап закрывает три иконки, открытые при прокрутке; дальше тап работает как
    // курсор на десктопе: крестик под пальцем становится иконкой, соседние расходятся.
    // Тап по уже открытой иконке открывает её ссылку.
    let touchStart: { x: number; y: number; time: number } | null = null;
    const onTouch = (event: TouchEvent) => {
        const touch = event.touches[0];
        if (!touch) return;
        touchStart = { x: touch.clientX, y: touch.clientY, time: Date.now() };
        const cell = cells[nearestCell(touch)];
        if (cell?.dataset.row && cell.dataset.col) {
            const row = Number(cell.dataset.row);
            const col = Number(cell.dataset.col);
            const shown = [hoveredCell.value, ...pinnedCells.value];
            touchOpensLink = shown.some((c) => c?.row === row && c.col === col);
        }
    };

    // по одной клетке на каждую иконку: строки 0–1 телеграм, 2–4 эфир, 5–6 ютуб;
    // клетки в разных строках и столбцах, выбор перемешан, но всегда одинаков
    const pickPinned = () => {
        const groups = [[0, 1], [2, 3, 4], [5, 6]];
        const usedCols = new Set<string>();
        const usedRows = new Set<string>();
        const order = shuffledOrder(cells.length);
        return groups.map((rows) => order.find((i) => {
            const { row = '', col = '' } = cells[i]!.dataset;
            if (!rows.includes(Number(row)) || usedCols.has(col)) return false;
            // соседние строки двух иконок не ставим вплотную
            if (usedRows.has(String(Number(row) - 1)) || usedRows.has(String(Number(row) + 1))) return false;
            usedCols.add(col);
            usedRows.add(row);
            return true;
        })).filter((i): i is number => i !== undefined);
    };
    const restorePinned = () => {
        pinned = pinnedCells.value
            .map(({ row, col }) => cells.findIndex((c) => c.dataset.row === String(row) && c.dataset.col === String(col)))
            .filter((i) => i >= 0);
    };
    const onScroll = () => {
        if (scrollShown || !cells.length) return;
        const rect = block.getBoundingClientRect();
        const vh = window.innerHeight;
        const start = vh * SCROLL_START;
        const length = rect.height + start - vh * SCROLL_END;
        const progress = (start - rect.top) / length;
        if (progress < SCROLL_SHOW_UNTIL) return;
        scrollShown = true;
        window.removeEventListener('scroll', onScroll);
        pinned = pickPinned();
        pinnedCells.value = pinned.map((i) => ({ row: Number(cells[i]!.dataset.row), col: Number(cells[i]!.dataset.col) }));
        hoveredCell.value = null;
        wave(null);
    };

    const onTouchEnd = (event: TouchEvent) => {
        const touch = event.changedTouches[0];
        const start = touchStart;
        touchStart = null;
        if (!touch || !start) return;
        const isTap = Math.hypot(touch.clientX - start.x, touch.clientY - start.y) < 10
            && Date.now() - start.time < 600;
        if (!isTap) return;
        if (pinned.length) {
            pinned = [];
            pinnedCells.value = [];
            hoveredCell.value = null;
            wave(null);
            return;
        }
        const nearest = wave(touch);
        const cell = cells[nearest];
        if (cell?.dataset.row && cell.dataset.col) {
            const row = Number(cell.dataset.row);
            const col = Number(cell.dataset.col);
            const prev = hoveredCell.value;
            if (prev?.row !== row || prev.col !== col) hoveredCell.value = { row, col };
        }
    };
    const onTouchCancel = () => {
        touchStart = null;
    };

    if (finePointer) {
        block.addEventListener('pointermove', onMove);
        block.addEventListener('pointerleave', onLeave);
    }
    block.addEventListener('touchstart', onTouch, { passive: true });
    if (!finePointer) {
        restorePinned();
        window.addEventListener('scroll', onScroll, { passive: true });
        onScroll();
    }
    block.addEventListener('touchend', onTouchEnd);
    block.addEventListener('touchcancel', onTouchCancel);
    return () => {
        window.removeEventListener('resize', updateHitArea);
        block.removeEventListener('pointermove', onMove);
        block.removeEventListener('pointerleave', onLeave);
        block.removeEventListener('touchstart', onTouch);
        window.removeEventListener('scroll', onScroll);
        block.removeEventListener('touchend', onTouchEnd);
        block.removeEventListener('touchcancel', onTouchCancel);
        cancelAnimationFrame(frame);
        crosses.forEach((cross) => { if (cross) cross.style.transform = ''; });
    };
};

onMounted(() => {
    headerCleanup = setupHeader();
    columnCleanup = setupColumns();
    waveCleanup = setupWave();
});

// как useEffect(..., [device, desktopColumns]): перезапуск после перерисовки сетки
watch([device, desktopColumns], () => {
    waveCleanup?.();
    waveCleanup = setupWave();
}, { flush: 'post' });

onBeforeUnmount(() => {
    headerCleanup?.();
    columnCleanup?.();
    waveCleanup?.();
    waveCleanup = undefined;
});

const isHovered = (row: number, col: number): boolean =>
    [hoveredCell.value, ...pinnedCells.value].some((cell) => cell?.row === row && cell.col === col);

const isSpecialContent = (row: number, col: number) =>
    (device.value === 'mobile' && row === 3 && col === 0) ||
    (row === 3 && col === 1);

const linkTo = (row: number) => {
    const opensLink = touchOpensLink;
    touchOpensLink = null;
    if (opensLink === false) return;

    if ([0, 1].includes(row)) {
        return window.open(getLinkWIthUtm(TELEGRAM_CHANELL_LINK), '_blank');
    }
    if ([2, 3, 4].includes(row)) {
        return window.open(getLinkWIthUtm(YOUTUBE_PLAYLIST_LINK), '_blank');
    }
    if ([5, 6].includes(row)) {
        return window.open(getLinkWIthUtm(SOUTHHUB_YOUTUBE), '_blank');
    }
};

const columns = computed(() => (device.value === 'desktop' ? desktopColumns.value : columnGrid[device.value]));

const getRowCells = (row: number) => {
    const cols = columns.value;
    if (row === 3) {
        // desktop_s раскладывается так же, как десктоп (последний return)
        if (device.value === 'tablet') {
            return [
                { type: 'svg', col: 0, span: 1 },
                { type: 'special', col: 1, span: 5 },
                ...Array.from({ length: cols - 5 }, (_, i) => ({ type: 'svg', col: i + 5, span: 1 })),
            ];
        }

        if (device.value === 'mobile') {
            return [{ type: 'special', col: 0, span: 5 }];
        }

        return [
            { type: 'svg', col: 0, span: 1 },
            { type: 'special', col: 1, span: 7 },
            ...Array.from({ length: cols - 8 }, (_, i) => ({ type: 'svg', col: i + 8, span: 1 })),
        ];
    } else {
        return Array.from({ length: cols }, (_, i) => ({ type: 'svg', col: i, span: 1 }));
    }
};

// касание на телефоне ставит иконку само (волна выше), мышиные события браузер
// при касании тоже присылает, их пропускаем, чтобы иконка не пропадала
const handleMouseEnter = (row: number, col: number, type: string) => {
    if (type === 'svg' && window.matchMedia('(hover: hover)').matches) {
        hoveredCell.value = { row, col };
    }
};

const handleMouseLeave = () => {
    if (window.matchMedia('(hover: hover)').matches) {
        hoveredCell.value = null;
    }
};
</script>

<template>
    <div
        id="more-new"
        ref="blockRef"
        class="more-new"
        :style="device === 'desktop' ? { '--more-new-columns': columns } : undefined"
    >
        <div v-for="row in [0, 1, 2, 3, 4, 5, 6]" :key="row" :class="`more-new-row more-new-row-${row}`">
            <div
                v-for="(cell, index) in getRowCells(row)"
                :key="`${row}-${cell.col}-${index}`"
                :class="`more-new-cell ${cell.type === 'special' ? 'more-new-special-cell-wrapper' : ''}`"
                :data-wave-cell="cell.type === 'svg' ? '' : undefined"
                :data-row="row"
                :data-col="cell.col"
                @mouseenter="handleMouseEnter(row, cell.col, cell.type)"
                @mouseleave="handleMouseLeave"
            >
                <div v-if="isSpecialContent(row, cell.col)" :class="`more-new-special-cell more-new-special-cell-third-row ${FONT_MONT_BOOK}`">у нас много нового</div>
                <div v-else class="more-new-svg-container" @click="linkTo(row)">
                    <img
                        :src="pub('/v2/more-new-cross.svg')"
                        alt=""
                        data-wave-cross="true"
                        loading="lazy"
                        :width="device === 'mobile' ? 30 : 50"
                        :height="device === 'mobile' ? 30 : 50"
                        decoding="async"
                        class="more-new-svg-icon more-new-svg-icon-cross"
                        :style="{ opacity: isHovered(row, cell.col) ? 0 : 1 }"
                    >
                    <img
                        :src="pub('/v2/more-new-telegram.svg')"
                        alt=""
                        loading="lazy"
                        width="50"
                        height="50"
                        decoding="async"
                        class="more-new-svg-icon"
                        :style="{ opacity: [0, 1].includes(row) && isHovered(row, cell.col) ? 1 : 0, cursor: 'pointer' }"
                    >
                    <img
                        :src="pub('/v2/more-new-live.svg')"
                        alt=""
                        loading="lazy"
                        width="50"
                        height="50"
                        decoding="async"
                        class="more-new-svg-icon"
                        :style="{ opacity: [2, 3, 4].includes(row) && isHovered(row, cell.col) ? 1 : 0, cursor: 'pointer' }"
                    >
                    <img
                        :src="pub('/v2/more-new-youtube.svg')"
                        alt=""
                        loading="lazy"
                        width="50"
                        height="50"
                        decoding="async"
                        class="more-new-svg-icon"
                        :style="{ opacity: [5, 6].includes(row) && isHovered(row, cell.col) ? 1 : 0, cursor: 'pointer' }"
                    >
                </div>
            </div>
        </div>
    </div>
</template>
