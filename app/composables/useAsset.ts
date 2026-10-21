// Путь к файлу из public/ с учётом baseURL (на GitHub Pages сайт лежит не в корне).
// В статической сборке (`npm run static`) index.html задаёт window.__ASSETS__: папку,
// где лежат файлы сайта, когда страницу отдаёт чужой бэкенд (например Django через {% static %}).
declare global { interface Window { __ASSETS__?: string } }
export const useAsset = () => {
    const base = (import.meta.client && window.__ASSETS__) || useRuntimeConfig().app.baseURL;
    return (path: string) => base.replace(/\/$/, '') + '/' + path.replace(/^\//, '');
};
