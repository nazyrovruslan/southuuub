export default defineNuxtPlugin((nuxtApp) => {
    nuxtApp.hook('app:mounted', () => {
        useUtmParams().value = readUtmParams(window.location.search);
    });
});
