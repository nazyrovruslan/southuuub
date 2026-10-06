<script setup lang="ts">
// Замена Collapse из antd (ghost, иконка справа): та же разметка и классы,
// раскрытие с анимацией высоты, как ant-motion-collapse.
export type CollapseItem = { key: string; label: string; children: string };

const props = defineProps<{
    items: CollapseItem[];
    defaultActiveKey?: string[];
    labelClass?: string;
    childrenClass?: string;
    expandIcon?: string;
}>();

const active = ref(new Set(props.defaultActiveKey ?? []));

const toggle = (key: string) => {
    const next = new Set(active.value);
    if (next.has(key)) next.delete(key);
    else next.add(key);
    active.value = next;
};

const MOTION = 'height 0.2s cubic-bezier(0.645, 0.045, 0.355, 1), opacity 0.2s cubic-bezier(0.645, 0.045, 0.355, 1)';

const setHeight = (el: Element, height: string, opacity: string) => {
    const node = el as HTMLElement;
    node.style.height = height;
    node.style.opacity = opacity;
};

const once = (fn: () => void) => {
    let called = false;
    return () => {
        if (!called) {
            called = true;
            fn();
        }
    };
};

const onEnter = (el: Element, finish: () => void) => {
    const done = once(finish);
    const node = el as HTMLElement;
    node.style.overflow = 'hidden';
    setHeight(node, '0px', '0');
    requestAnimationFrame(() => {
        node.style.transition = MOTION;
        setHeight(node, `${node.scrollHeight}px`, '1');
    });
    node.addEventListener('transitionend', () => done(), { once: true });
    setTimeout(done, 300);
};

const onLeave = (el: Element, finish: () => void) => {
    const done = once(finish);
    const node = el as HTMLElement;
    node.style.overflow = 'hidden';
    setHeight(node, `${node.offsetHeight}px`, '1');
    requestAnimationFrame(() => {
        node.style.transition = MOTION;
        setHeight(node, '0px', '0');
    });
    node.addEventListener('transitionend', () => done(), { once: true });
    setTimeout(done, 300);
};

const onAfter = (el: Element) => {
    const node = el as HTMLElement;
    // display не трогаем: им управляет v-show
    node.style.removeProperty('height');
    node.style.removeProperty('opacity');
    node.style.removeProperty('overflow');
    node.style.removeProperty('transition');
};
</script>

<template>
    <div class="ant-collapse ant-collapse-icon-position-end ant-collapse-ghost">
        <div
            v-for="item in items"
            :key="item.key"
            :class="['ant-collapse-item', { 'ant-collapse-item-active': active.has(item.key) }]"
        >
            <div
                class="ant-collapse-header"
                role="button"
                :aria-expanded="active.has(item.key)"
                aria-disabled="false"
                tabindex="0"
                @click="toggle(item.key)"
                @keydown.enter.space.prevent="toggle(item.key)"
            >
                <div class="ant-collapse-expand-icon">
                    <img
                        v-if="expandIcon"
                        :src="expandIcon"
                        alt=""
                        aria-hidden="true"
                        width="47"
                        height="47"
                        class="ant-collapse-arrow"
                    >
                </div>
                <span class="ant-collapse-header-text">
                    <p :class="labelClass">{{ item.label }}</p>
                </span>
            </div>
            <Transition :css="false" @enter="onEnter" @leave="onLeave" @after-enter="onAfter" @after-leave="onAfter">
                <div v-show="active.has(item.key)" class="ant-collapse-content ant-collapse-content-active">
                    <div class="ant-collapse-content-box">
                        <p :class="childrenClass">{{ item.children }}</p>
                    </div>
                </div>
            </Transition>
        </div>
    </div>
</template>
