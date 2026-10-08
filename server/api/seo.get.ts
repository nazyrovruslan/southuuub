// Кэш на 10 минут: страница не ходит в shsites на каждый просмотр, а медленный или
// недоступный shsites не тормозит и не нагружает сайт. Устаревшие данные отдаются сразу,
// обновление идёт в фоне. Пустой объект вместо null, чтобы кэшировался и отказ shsites.
export default defineCachedEventHandler(async () => (await getSeoData()) ?? {}, { maxAge: 600, swr: true, name: 'seo' });
