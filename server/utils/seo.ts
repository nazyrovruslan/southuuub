// SEO-данные страницы из shsites. Ключ API живёт только на сервере.
export const getSeoData = async (slug?: string) => {
    const { shsitesApiKey, public: { shsitesUrl } } = useRuntimeConfig();
    if (!shsitesUrl) return null;

    try {
        const endpoint = slug ? `${shsitesUrl}/api/v1/seo/sh-main/${slug}` : `${shsitesUrl}/api/v1/seo/sh-main/`;

        const response = await fetch(endpoint, {
            // если shsites не отвечает, страница не должна ждать вместе с ним
            signal: AbortSignal.timeout(5000),
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
                'Api-Key': `${shsitesApiKey}`,
            },
        });

        if (!response.ok) {
            console.error(`HTTP error! status: ${response.status}`);
            return null;
        }

        const contentType = response.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
            console.error('Expected JSON but got:', contentType);
            return null;
        }

        return await response.json();
    } catch (error) {
        console.error('Error fetching SEO data:', error);
        return null;
    }
};
