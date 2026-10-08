<script setup lang="ts">
const getLinkWIthUtm = useLinkWithUtm();
const { lkRegisterLink } = useRuntimeConfig().public;

// RegestryMemeberForm из оригинала не перенесён: его open никогда не становился true (мёртвый код)
const handleClick = () => openExternal(getLinkWIthUtm(lkRegisterLink));
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
