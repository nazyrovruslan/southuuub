// SEO-параметры главной из shsites (ответ /api/v1/seo/sh-main/ на 2026-10-09).
// Подставляются, если shsites не настроен или не ответил, чтобы мета-теги и разметка были всегда.
const description = 'Получи доступ к коллективному разуму – пространству открытого нетворкинга в сообществе равных, где рождаются идеи, партнёрства и новые смыслы. Масштаб людей, идей и тёплых связей.';
const seoTitle = 'South HUB — Сообщество C-level в IT';

export const DEFAULT_SEO = {
    page: {
        title: 'Southuuub',
        seo_title: seoTitle,
        search_description: description,
        meta_keywords: '',
        seo_author: '',
        og_title: seoTitle,
        og_description: description,
        og_image_url: null as string | null,
        og_site_name: 'Southuuub',
        twitter_card: 'summary_large_image',
        schema_json_ld: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'WebPage',
            url: 'https://southhub.ru/',
            name: seoTitle,
            description,
        }),
        canonical_url: 'https://southhub.ru/',
    },
    site: {
        org_name: 'South HUB',
        schema_json_ld: JSON.stringify({
            '@context': 'https://schema.org',
            '@graph': [
                { '@type': 'Organization', name: 'South HUB' },
                { '@type': 'WebSite', url: 'https://southhub.ru', name: 'South HUB' },
            ],
        }),
    },
};
