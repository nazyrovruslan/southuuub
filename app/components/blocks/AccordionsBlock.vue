<script setup lang="ts">
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import type { CollapseItem } from '../ui/AntCollapse.vue';

const pub = usePublicPath();

const ITEMS: CollapseItem[] = [
    {
        key: '1',
        label: 'Баланс',
        children: 'верим, что успех и эффективность руководителя строятся на балансе профессиональных связей, семьи, саморазвития, обучения и физической формы',
    },
    {
        key: '2',
        label: 'Совместное развитие',
        children: 'создаём пространство, в котором комфортно расти и вдохновлять других, влиять на развитие бизнеса и всей IT-индустрии',
    },
    {
        key: '3',
        label: 'Безопасная среда',
        children: 'строим тёплое сообщество равных, где поддержка важнее регалий, юмор — часть культуры, а доверие и открытость позволяют вести честные разговоры',
    },
    {
        key: '4',
        label: 'Со-создание',
        children: 'любая активность сообщества рождается из энергии участников: идей, опыта, запросов и инициатив. здесь созидают вместе — а значит, по-настоящему',
    },
];

let cleanup: (() => void) | undefined;

onMounted(() => {
    gsap.registerPlugin(ScrollTrigger);

    const header = document.querySelector<HTMLElement>('#header');
    const targetBlock = document.querySelector<HTMLElement>('#accordions-block');

    if (!header || !targetBlock) return;

    const addBlack = () => header.classList.add('header_black');
    const removeBlack = () => header.classList.remove('header_black');

    const st = ScrollTrigger.create({
        trigger: targetBlock,
        start: 'top 70px',
        end: 'bottom top',
        refreshPriority: 2, // MainBanner = 0, OurProjects = 1
        onEnter: addBlack,
        onLeave: removeBlack,
        onEnterBack: addBlack,
        onLeaveBack: removeBlack,
    });

    cleanup = () => {
        st.kill();
        header.classList.remove('header_black');
    };
});

onBeforeUnmount(() => cleanup?.());
</script>

<template>
    <section id="accordions-block" class="accordions-block-wrapper" aria-label="Наши ценности">
        <div :class="[FONT_MONT_BOOK, 'accordions-block-title']">наши ценности</div>

        <div class="accordions-block-list">
            <AntCollapse
                :items="ITEMS"
                class="accordions-block-component"
                :default-active-key="['1', '2', '3', '4']"
                :expand-icon="pub('/accordion-plus.svg')"
                :label-class="`${FONT_MONT_BOOK} accordions-block-label`"
                :children-class="`${FONT_MONT_BOOK} accordions-block-children`"
            />
        </div>
    </section>
</template>
