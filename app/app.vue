<template>
    <main>
        <AppHero />
        <PatternBlock />
        <AppFooter />
    </main>
</template>

<script setup lang="ts">
// фавиконка лежит в public/, путь считает useAsset (на GitHub Pages и в статической сборке сайт не в корне)
const asset = useAsset();
useHead({ link: [{ rel: 'icon', href: asset('favicon.ico') }] });
</script>
