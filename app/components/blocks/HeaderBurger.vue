<script setup lang="ts">
const getLinkWithUtm = useLinkWithUtm();
const { lkLoginLink } = useRuntimeConfig().public;

const isActive = ref(false);
useLockScroll(isActive);
</script>

<template>
    <AntButton id="btn_lending_burger" type="text" class="header-burger" @click="isActive = true">
        <svg width="39" height="18" viewBox="0 0 39 18" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M0 4H39" stroke="white" stroke-width="2" />
            <path d="M0 14H39" stroke="white" stroke-width="2" />
        </svg>
    </AntButton>

    <AntDrawer :open="isActive" content-class="header-drawer" @close="isActive = false">
        <template #closeIcon>
            <svg width="30" height="30" viewBox="0 0 30 30" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M10.8876 9.07874C13.9407 12.1318 13.9405 17.0824 10.8876 20.1356L6.6056 24.4176L5.19139 23.0034L9.47339 18.7214C11.7452 16.4492 11.7454 12.765 9.47339 10.493L5.19139 6.21096L6.6056 4.79674L10.8876 9.07874ZM20.5288 10.8507C18.2567 13.1228 18.2567 16.8069 20.5288 19.0791L24.8108 23.3611L23.3966 24.7753L19.1146 20.4933C16.0614 17.4401 16.0615 12.4896 19.1146 9.43644L23.3966 5.15444L24.8108 6.56865L20.5288 10.8507Z" fill="white" />
            </svg>
        </template>
        <template #title>
            <div />
        </template>

        <div>
            <div @click="isActive = false">
                <HeaderItem id="btn_lending_header_item_southub" title="south hub camp" :link="getLinkWithUtm('https://southhub.ru/southub/')" />
            </div>
            <div @click="isActive = false">
                <HeaderItem id="btn_lending_header_item_our_project" title="где встречаемся" into-scroll="our-projects-block" />
            </div>
            <div @click="isActive = false">
                <HeaderItem id="btn_lending_header_item_login" title="войти" :link="getLinkWithUtm(lkLoginLink)" />
            </div>
        </div>
    </AntDrawer>
</template>
