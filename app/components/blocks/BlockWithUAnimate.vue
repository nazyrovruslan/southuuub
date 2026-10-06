<script setup lang="ts">
type Device = 'desktop' | 'desktop_s' | 'tablet' | 'mobile';

const rowGrid = {
    desktop: [0, 1, 2, 3, 4],
    desktop_s: [0, 1, 2, 3, 4],
    tablet: [0, 1, 2, 3, 4, 5, 6],
    mobile: [0, 1, 2, 3, 4, 5, 6],
};

const columnGrid = {
    desktop: 12,
    desktop_s: 10,
    tablet: 10,
    mobile: 6,
};

// Десктоп: шаг сетки как в макете 1440 (буква 50px + промежуток ~66px). На экранах шире
// 1440 добавляются столбцы с буквами, SOUTHU остаётся с левого края, B — справа в нижнем ряду.
// Выше 1920 страница масштабируется целиком (wide-screen.css), столбцов столько же, сколько на 1920.
const DESKTOP_MIN_COLUMNS = 12;
const DESKTOP_PITCH = 115.5;
const DESKTOP_SIDE_PADDING = 60;

const getDesktopColumns = () => {
    const content = Math.min(window.innerWidth, 1920) - DESKTOP_SIDE_PADDING * 2;
    return Math.max(DESKTOP_MIN_COLUMNS, Math.floor((content + DESKTOP_PITCH - 50) / DESKTOP_PITCH));
};

// Волна: каждая буква увеличивается по расстоянию от неё до курсора (на телефоне — до пальца),
// поэтому вместе с наведённой растут соседи по бокам, сверху и снизу, а зона
// наведения непрерывная — каждая буква «ловит» курсор до середины пути к соседней.
const WAVE_MAX_SCALE = 2;       // наведённая буква: 20px -> 40px, как раньше
const WAVE_RADIUS = 1.1;        // радиус влияния в шагах сетки по горизонтали
const WAVE_GROW = 0.22;         // скорость увеличения за кадр (быстро)
const WAVE_FADE = 0.06;         // скорость затухания за кадр (медленно)

/**
 * TODO после выкатки
 * 1) Они должны при просто наведении увеличиваться медленно и медленно затухать
 * 2) Если юыстро проводить курсором, то они быстро увеличиваются и так же медленно затухают
 * 3) Пространство между ними???
 */

const pub = usePublicPath();

const device = ref<Device>('desktop');
const desktopColumns = ref(DESKTOP_MIN_COLUMNS);
const blockRef = ref<HTMLDivElement | null>(null);

let headerCleanup: (() => void) | undefined;
let columnCleanup: (() => void) | undefined;
let waveCleanup: (() => void) | undefined;

const setupHeader = () => {
    const header = document.querySelector('#header');
    const targetBlock = document.querySelector('#block-with-u-animate');

    if (!header || !targetBlock) return;

    let lastScrollY = window.scrollY;

    const handleScroll = () => {
        const currentScrollY = window.scrollY;
        const blockRect = targetBlock.getBoundingClientRect();
        const blockTop = blockRect.top - 70;
        const isScrollingUp = currentScrollY < lastScrollY;

        // Блок ещё не доехал до экрана → шапка видна. После этого блока до конца
        // страницы шапку не показываем (идёт подвал с логотипом median.agency).
        const isReached = blockRect.top < window.innerHeight;

        if (!isReached) {
            header.classList.remove('header_hidden');
        } else {
            // Блок виден → применяем исходную логику
            if (blockTop <= 0) {
                header.classList.add('header_hidden');
            }
            else if (isScrollingUp && blockTop <= 70) {
                header.classList.add('header_hidden');
            } else {
                header.classList.remove('header_hidden');
            }
        }

        // Цвет шапки, когда её вызвали прокруткой вверх: на чёрном блоке U — белая,
        // ниже, на светлом подвале — чёрная. Обработчик подключён позже блока
        // «как стать частью сообщества», поэтому его решение последнее.
        if (blockRect.top <= 70) {
            header.classList.toggle('header_black', blockRect.bottom <= 70);
        }
        // С блока U и до конца страницы логотип в шапке не нужен: ниже свой логотип
        header.classList.toggle('header_no_logo', blockRect.top <= 70);

        lastScrollY = currentScrollY;
    };

    window.addEventListener('scroll', handleScroll);
    handleScroll(); // начальная проверка

    return () => {
        window.removeEventListener('scroll', handleScroll);
    };
};

const setupColumns = () => {
    const updateColumn = () => {
        const desktop_s = window.matchMedia('(max-width: 1280px)').matches;
        const tablet = window.matchMedia('(max-width: 1024px)').matches;
        const mobile = window.matchMedia('(max-width: 767px)').matches;

        if (mobile) {
            device.value = 'mobile';
            return;
        }

        if (tablet) {
            device.value = 'tablet';
            return;
        }

        if (desktop_s) {
            device.value = 'desktop_s';
            return;
        }

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
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const icons = Array.from(block.querySelectorAll<HTMLElement>('[data-wave-letter]'));
    const current = icons.map(() => 1);
    const target = icons.map(() => 1);
    let frame = 0;

    const tick = () => {
        let moving = false;
        icons.forEach((icon, i) => {
            const diff = target[i]! - current[i]!;
            if (Math.abs(diff) < 0.002) {
                current[i] = target[i]!;
            } else {
                current[i]! += diff * (diff > 0 ? WAVE_GROW : WAVE_FADE);
                moving = true;
            }
            icon.style.transform = current[i] === 1 ? '' : `scale(${current[i]!.toFixed(3)})`;
        });
        frame = moving ? requestAnimationFrame(tick) : 0;
    };
    const run = () => {
        if (!frame) frame = requestAnimationFrame(tick);
    };

    const wave = (point: { clientX: number; clientY: number }) => {
        const rects = icons.map((icon) => icon.getBoundingClientRect());
        // шаг сетки по горизонтали: расстояние между двумя соседними буквами одной строки
        // (по центрам: масштаб меняет края прямоугольника, но не центр)
        const centers = rects.map((r) => [r.left + r.width / 2, r.top + r.height / 2] as const);
        let pitch = Infinity;
        for (let i = 1; i < centers.length; i++) {
            const dx = Math.abs(centers[i]![0] - centers[i - 1]![0]);
            if (dx > 1 && Math.abs(centers[i]![1] - centers[i - 1]![1]) < 1) pitch = Math.min(pitch, dx);
        }
        const radius = (Number.isFinite(pitch) ? pitch : 150) * WAVE_RADIUS;

        centers.forEach(([cx, cy], i) => {
            const d = Math.hypot(point.clientX - cx, point.clientY - cy) / radius;
            target[i] = 1 + (WAVE_MAX_SCALE - 1) * Math.exp(-d * d);
        });
        run();
    };
    const onLeave = () => {
        target.fill(1);
        run();
    };

    const onMove = (event: PointerEvent) => {
        if (event.pointerType !== 'touch') wave(event);
    };

    // Телефон: волна идёт за пальцем, в том числе пока страница прокручивается
    const onTouch = (event: TouchEvent) => {
        if (event.touches[0]) wave(event.touches[0]);
    };

    block.addEventListener('pointermove', onMove);
    block.addEventListener('pointerleave', onLeave);
    block.addEventListener('touchstart', onTouch, { passive: true });
    block.addEventListener('touchmove', onTouch, { passive: true });
    block.addEventListener('touchend', onLeave);
    block.addEventListener('touchcancel', onLeave);
    return () => {
        block.removeEventListener('pointermove', onMove);
        block.removeEventListener('pointerleave', onLeave);
        block.removeEventListener('touchstart', onTouch);
        block.removeEventListener('touchmove', onTouch);
        block.removeEventListener('touchend', onLeave);
        block.removeEventListener('touchcancel', onLeave);
        cancelAnimationFrame(frame);
        icons.forEach((icon) => { icon.style.transform = ''; });
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

const columns = computed(() => (device.value === 'desktop' ? desktopColumns.value : columnGrid[device.value]));

const isLogo = (row: number, col: number) => row === 0 && col === 0;

const isSpecialText = (row: number, col: number) => {
    const d = device.value;
    return (d === 'desktop' && row === 2 && col === columns.value - 5) ||
        (d === 'desktop_s' && row === 2 && col === 5) ||
        (d === 'tablet' && row === 3 && col === 3) ||
        (d === 'mobile' && row === 3 && col === 1);
};

const isVisibleB = (row: number, col: number) => {
    switch (device.value) {
        case 'desktop':
            return row === 4 && col === columns.value - 1;
        case 'desktop_s':
            return row === 4 && col === 9;
        case 'tablet':
            return row === 6 && col === 9;
        case 'mobile':
            return row === 6 && col === 5;
        default:
            return false;
    }
};

// Первый ряд на десктопе как в макете: логотип SOUTHU слева, а за ним на одну букву
// больше, чем столбцов до правого края; буквы равномерно занимают оставшуюся ширину.
// desktop_s раскладывается так же, как десктоп (последняя ветка)
const getRowCells = (row: number) => {
    const cols = columns.value;
    if (device.value === 'tablet') {
        if (row === 0) {
            return [
                { type: 'special', col: 0, span: 2 },
                ...Array.from({ length: cols - 2 }, (_, i) => ({ type: 'svg', col: i + 2, span: 1 })),
            ];
        } else if (row === 3) {
            return [
                ...Array.from({ length: cols - 7 }, (_, i) => ({ type: 'svg', col: i, span: 1 })),
                { type: 'special', col: cols - 7, span: 6 },
                { type: 'svg', col: cols - 1, span: 1 },
            ];
        } else {
            return Array.from({ length: cols }, (_, i) => ({ type: 'svg', col: i, span: 1 }));
        }
    }

    if (device.value === 'mobile') {
        if (row === 0) {
            return [
                { type: 'special', col: 0, span: 2 },
                ...Array.from({ length: cols - 2 }, (_, i) => ({ type: 'svg', col: i + 2, span: 1 })),
            ];
        } else if (row === 3) {
            return [
                ...Array.from({ length: cols - 5 }, (_, i) => ({ type: 'svg', col: i, span: 1 })),
                { type: 'special', col: cols - 5, span: 5 },
            ];
        } else {
            return Array.from({ length: cols }, (_, i) => ({ type: 'svg', col: i, span: 1 }));
        }
    }

    if (row === 0) {
        return [
            { type: 'special', col: 0, span: 1 },
            ...Array.from({ length: cols - 1 }, (_, i) => ({ type: 'svg', col: i + 1, span: 1 })),
        ];
    } else if (row === 2) {
        return [
            ...Array.from({ length: cols - 5 }, (_, i) => ({ type: 'svg', col: i, span: 1 })),
            { type: 'special', col: cols - 5, span: 4 },
            { type: 'svg', col: cols - 1, span: 1 },
        ];
    } else {
        return Array.from({ length: cols }, (_, i) => ({ type: 'svg', col: i, span: 1 }));
    }
};
</script>

<template>
    <div
        id="block-with-u-animate"
        ref="blockRef"
        class="block-with-u-animate"
        :style="device === 'desktop' ? { '--u-columns': columns } : undefined"
    >
        <div
            v-for="row in rowGrid[device]"
            :key="row"
            :class="`block-with-u-animate-row block-with-u-animate-row-${row}`"
        >
            <div
                v-for="(cell, index) in getRowCells(row)"
                :key="`${row}-${cell.col}-${index}`"
                :class="`block-with-u-animate-cell ${cell.type === 'special' ? 'special-cell-wrapper' : ''}`"
            >
                <img
                    v-if="isLogo(row, cell.col)"
                    :src="pub('/v2/animate-u-block-logo.svg')"
                    alt=""
                    loading="lazy"
                    width="110"
                    height="21"
                    decoding="async"
                    class="block-with-u-animate-logo-icon"
                >
                <div v-else-if="isSpecialText(row, cell.col)" :class="`special-cell special-cell-third-row ${FONT_MONT_BOOK}`">масштаб идей, людей и теплых связей</div>
                <div v-else class="block-with-u-animate-svg-container" data-wave-letter="true">
                    <img
                        :src="isVisibleB(row, cell.col) ? pub('/v2/animate-b.svg') : pub('/v2/animate-u.svg')"
                        alt=""
                        loading="lazy"
                        width="20"
                        height="21"
                        decoding="async"
                        class="block-with-u-animate-svg-icon"
                    >
                </div>
            </div>
        </div>
    </div>
</template>
