// Путь к файлу из public/ с учётом baseURL (на GitHub Pages сайт лежит не в корне)
export const useAsset = () => {
    const base = useRuntimeConfig().app.baseURL.replace(/\/$/, '');
    return (path: string) => `${base}/${path.replace(/^\//, '')}`;
};
