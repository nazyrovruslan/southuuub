// Внешняя ссылка в новой вкладке. noopener: открытая страница не получает доступа
// к window.opener и не может подменить эту вкладку (у <a target="_blank"> браузеры
// делают так сами, у window.open — нет)
export const openExternal = (url: string | undefined) => {
    if (!url) return null;
    return window.open(url, '_blank', 'noopener');
};
