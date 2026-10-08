import { withQuery } from 'ufo';

const UTM_KEYS = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content'] as const;

// UTM-метки из адреса страницы. Заполняются после гидратации (plugins/utm.client.ts),
// чтобы статически собранная страница не расходилась с серверной разметкой.
export const useUtmParams = () => useState<Record<string, string>>('utm-params', () => ({}));

// Добавляет UTM-метки к ссылкам на southhub.ru
export const useLinkWithUtm = () => {
    const utmParams = useUtmParams();

    return (url: string | undefined): string => {
        if (!url) {
            return '';
        }

        // Ссылки со своими метками (кнопки в кабинет) оставляем как есть
        if (!url.includes('southhub.ru') || url.includes('utm_source=')) {
            return url;
        }

        const validUtmParams = Object.entries(utmParams.value)
            .map(([key, value]) => `${key}=${encodeURIComponent(value)}`);

        if (validUtmParams.length === 0) {
            return url;
        }

        const separator = url.includes('?') ? '&' : '?';

        return `${url}${separator}${validUtmParams.join('&')}`;
    };
};

// Ссылка в личный кабинет с меткой места на странице: head, hero, community
export const useLkProfileLink = () => {
    const { lkProfileLink } = useRuntimeConfig().public;
    return (medium: string) => withQuery(lkProfileLink, { utm_source: 'southhub.ru', utm_medium: medium });
};

export const readUtmParams = (search: string) => {
    const params = new URLSearchParams(search);
    const result: Record<string, string> = {};
    for (const key of UTM_KEYS) {
        const value = params.get(key);
        if (value !== null) result[key] = value;
    }
    return result;
};
