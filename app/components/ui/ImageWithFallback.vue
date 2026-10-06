<script setup lang="ts">
// Картинка с запасным файлом на случай ошибки загрузки
const props = defineProps<{
    src: string;
    altSrc: string;
    alt: string;
    width?: number | string;
    height?: number | string;
    sizes?: string;
    loading?: 'lazy' | 'eager';
}>();

const imgSrc = ref(props.src);
watch(() => props.src, (src) => { imgSrc.value = src; });
</script>

<template>
    <img
        :src="imgSrc"
        :alt="alt"
        :width="width"
        :height="height"
        :sizes="sizes"
        :loading="loading ?? 'lazy'"
        decoding="async"
        style="object-fit: cover;"
        @error="imgSrc = altSrc"
    >
</template>
