'use client';

import { useSearchParams } from 'next/navigation';
import { useCallback, useMemo } from 'react';

export const useGetLinkWithUtm = () => {
    const searchParams = useSearchParams();

    const utmParams = useMemo(() => ({
        utm_source: searchParams.get('utm_source'),
        utm_medium: searchParams.get('utm_medium'),
        utm_campaign: searchParams.get('utm_campaign'),
        utm_term: searchParams.get('utm_term'),
        utm_content: searchParams.get('utm_content'),
    }), [searchParams]);

    const getLinkWithUtm = useCallback((url: string | undefined): string => {
        if (!url) {
            return '';
        }

        try {
            if (!url.includes('southhub.ru')) {
                return url;
            }

            // Фильтруем только существующие UTM-параметры
            const validUtmParams = Object.entries(utmParams)
                .filter(([_, value]) => value !== null && value !== undefined)
                .map(([key, value]) => `${key}=${encodeURIComponent(value!)}`);

            if (validUtmParams.length === 0) {
                return url;
            }

            const separator = url.includes('?') ? '&' : '?';

            return `${url}${separator}${validUtmParams.join('&')}`;
        } catch (err) {
            return url;
        }
    }, [utmParams]);

    return getLinkWithUtm;
};