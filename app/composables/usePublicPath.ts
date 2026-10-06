import { joinURL } from 'ufo';

// Путь к файлу из public/ с учётом app.baseURL (демо лежит не в корне домена).
export const usePublicPath = () => {
    const base = useRuntimeConfig().app.baseURL;
    return (path: string) => joinURL(base, path);
};
