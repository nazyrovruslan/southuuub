/* eslint-disable @typescript-eslint/no-explicit-any */
// Мета-теги и Schema.org JSON-LD из shsites (как generateMetadata в Next-версии).
// При ошибке или в статической сборке без shsites остаются значения из nuxt.config.
// Возвращает промис загрузки: useHead регистрируется до await, пока доступен контекст Nuxt.
const parseSchema = (value: unknown) => {
    if (!value) return null;
    if (typeof value !== 'string') return value;
    try {
        return JSON.parse(value);
    } catch {
        return null;
    }
};

export const useSeoData = () => {
    const request = useAsyncData<any>('seo', () => $fetch('/api/seo').then((res) => res ?? {}).catch(() => ({})));
    const { data } = request;

    const page = computed(() => data.value?.page ?? DEFAULT_SEO.page);
    const site = computed(() => data.value?.site ?? DEFAULT_SEO.site);

    useHead(() => {
        const p = page.value;
        if (!p) return {} as Record<string, never>;

        const title = p.og_title || p.seo_title || p.title;
        const description = p.og_description || p.search_description;

        return {
            title: p.seo_title || p.title,
            meta: [
                { name: 'description', content: p.search_description },
                { name: 'keywords', content: p.meta_keywords },
                ...(p.seo_author ? [{ name: 'author', content: p.seo_author }] : []),
                { name: 'robots', content: 'index, follow' },
                { property: 'og:title', content: title },
                { property: 'og:description', content: description },
                ...(p.og_image_url ? [
                    { property: 'og:image', content: p.og_image_url },
                    { property: 'og:image:width', content: '1200' },
                    { property: 'og:image:height', content: '630' },
                    { property: 'og:image:alt', content: p.title },
                ] : []),
                { property: 'og:site_name', content: p.og_site_name || site.value?.org_name },
                { property: 'og:url', content: p.canonical_url },
                { property: 'og:type', content: 'website' },
                { name: 'twitter:card', content: p.twitter_card || 'summary_large_image' },
                { name: 'twitter:title', content: title },
                { name: 'twitter:description', content: description },
                ...(p.og_image_url ? [{ name: 'twitter:image', content: p.og_image_url }] : []),
            ],
            link: p.canonical_url ? [{ rel: 'canonical', href: p.canonical_url }] : [],
        };
    });

    useHead(() => {
        // shsites отдаёт разметку строкой JSON: разбираем, иначе в странице окажутся строки, а не объекты
        const schemas = [page.value?.schema_json_ld, site.value?.schema_json_ld]
            .flat()
            .map(parseSchema)
            .filter(Boolean);
        if (!schemas.length) return {};
        return {
            // < экранируем: строка из shsites с </script> иначе закрыла бы тег и выполнилась как HTML
            script: [{ id: 'structured-data', type: 'application/ld+json', innerHTML: JSON.stringify(schemas).replace(/</g, '\\u003c') }],
        };
    });
    return request;
};
