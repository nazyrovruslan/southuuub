<script setup lang="ts">
const lkLink = useLkProfileLink();

// RegestryMemeberForm из оригинала не перенесён: его open никогда не становился true (мёртвый код)
const handleClick = () => openExternal(lkLink('hero'));
</script>

<template>
    <AntButton
        id="btn_lending_main_banner"
        type="primary"
        class="main-banner-button base-button"
        @click="handleClick"
    >
        <span :class="`${FONT_MONT_BOOK}`">Стать участником</span>
    </AntButton>
</template>
