import { cache } from 'react';
import { SHSITES_API_KEY, SHSITES_URL } from '../constants';

export const getSeoData = cache(async (slug?: string) => {
    // сервис SEO не настроен: берём заголовок и описание по умолчанию, без запроса и ошибки в логе
    if (!SHSITES_URL) return null;

    try {
        const endpoint = slug ? `${SHSITES_URL}/api/v1/seo/sh-main/${slug}` : `${SHSITES_URL}/api/v1/seo/sh-main/`;
        
        const response = await fetch(endpoint, {
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
                'Api-Key': `${SHSITES_API_KEY}`,
            },
            cache: 'no-store',
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
});