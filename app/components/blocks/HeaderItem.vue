<script setup lang="ts">
const props = defineProps<{
    id: string;
    title: string;
    intoScroll?: string;
    link?: string;
}>();

const handleScrollIntoView = () => {
    if (props.intoScroll) {
        const element = document.getElementById(props.intoScroll);

        if (element) {
            const y = element.getBoundingClientRect().top + window.scrollY;
            window.scrollTo({ top: y, behavior: 'smooth' });
        }

        return;
    }

    if (props.link) {
        window.open(props.link, '_blank');
    }
};
</script>

<template>
    <div :id="id" :class="[FONT_MONT_BOOK, 'header_item']" @click="handleScrollIntoView">{{ title }}</div>
</template>
