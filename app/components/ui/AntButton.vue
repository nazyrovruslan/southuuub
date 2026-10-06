<script setup lang="ts">
// Замена Button из antd: та же разметка и классы, стили — assets/css/antd-lite.css
withDefaults(defineProps<{ type?: 'primary' | 'text' }>(), { type: 'primary' });
defineEmits<{ click: [event: MouseEvent] }>();
</script>

<template>
    <button
        type="button"
        :class="[
            'ant-btn',
            type === 'primary'
                ? 'ant-btn-primary ant-btn-color-primary ant-btn-variant-solid'
                : 'ant-btn-text ant-btn-color-default ant-btn-variant-text',
        ]"
        @click="$emit('click', $event)"
    >
        <slot />
    </button>
</template>
