// Яндекс.Метрика (раньше react-yandex-metrika). Счётчик и настройки как в shsites.
// Работает на southhub.ru сама, на других адресах (демо, localhost) только с ENABLE_METRIC.
const YM_COUNTER_ID = 89187152;

type Ym = ((...args: unknown[]) => void) & { a?: unknown[][]; l?: number };

declare global {
    interface Window {
        ym?: Ym;
    }
}

export default defineNuxtPlugin(() => {
    const isProdHost = /(^|\.)southhub\.ru$/.test(window.location.hostname);
    if (!isProdHost && !useRuntimeConfig().public.enableMetric) return;

    const ym: Ym = window.ym ?? function (...args: unknown[]) {
        (ym.a = ym.a || []).push(args);
    };
    ym.l = Date.now();
    window.ym = ym;

    const script = document.createElement('script');
    script.async = true;
    script.defer = true;
    script.src = 'https://mc.yandex.ru/metrika/tag.js';
    document.head.appendChild(script);

    ym(YM_COUNTER_ID, 'init', {
        defer: true,
        webvisor: true,
        clickmap: true,
        trackLinks: true,
        accurateTrackBounce: true,
        ecommerce: 'dataLayer',
    });
});
