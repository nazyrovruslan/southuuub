<script setup lang="ts">
// Замена Drawer из antd (справа, ширина 378px): та же разметка и классы,
// выезд панели и затемнение фона как у antd.
const props = defineProps<{ open: boolean; contentClass?: string }>();
const emit = defineEmits<{ close: [] }>();

const onKeydown = (event: KeyboardEvent) => {
    if (event.key === 'Escape' && props.open) emit('close');
};

onMounted(() => window.addEventListener('keydown', onKeydown));
onBeforeUnmount(() => window.removeEventListener('keydown', onKeydown));
</script>

<template>
    <Teleport to="body">
        <Transition name="ant-drawer-motion" :duration="300">
            <div v-if="open" class="ant-drawer ant-drawer-right ant-drawer-open" tabindex="-1">
                <div class="ant-drawer-mask" @click="emit('close')" />
                <div class="ant-drawer-content-wrapper" style="width: 378px;">
                    <div :class="['ant-drawer-content', contentClass]" role="dialog" aria-modal="true">
                        <div class="ant-drawer-header">
                            <div class="ant-drawer-header-title">
                                <button type="button" class="ant-drawer-close" aria-label="Close" @click="emit('close')">
                                    <slot name="closeIcon" />
                                </button>
                                <div class="ant-drawer-title">
                                    <slot name="title" />
                                </div>
                            </div>
                        </div>
                        <div class="ant-drawer-body">
                            <slot />
                        </div>
                    </div>
                </div>
            </div>
        </Transition>
    </Teleport>
</template>

<style>
.ant-drawer-motion-enter-active .ant-drawer-mask,
.ant-drawer-motion-leave-active .ant-drawer-mask {
    transition: opacity 0.3s;
}

.ant-drawer-motion-enter-from .ant-drawer-mask,
.ant-drawer-motion-leave-to .ant-drawer-mask {
    opacity: 0;
}

.ant-drawer-motion-enter-active .ant-drawer-content-wrapper,
.ant-drawer-motion-leave-active .ant-drawer-content-wrapper {
    transition: transform 0.3s;
}

.ant-drawer-motion-enter-from .ant-drawer-content-wrapper,
.ant-drawer-motion-leave-to .ant-drawer-content-wrapper {
    transform: translateX(100%);
}
</style>
