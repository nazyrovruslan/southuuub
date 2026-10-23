<script setup lang="ts">
import { provideSiteConfig } from './composables/useSiteConfig'
import HeroSection from './components/sections/HeroSection.vue'
import PatternSection from './components/sections/PatternSection.vue'
import TicketWidget from './components/widgets/TicketWidget.vue'
import AppFooter from './components/layout/AppFooter.vue'

const cfg = provideSiteConfig()
</script>

<template>
    <main>
        <HeroSection />
        <PatternSection />
        <!-- Виджет продажи билетов: в HTML всегда есть пустая оболочка, показывается и ходит в API,
             только когда Django передал адрес API (ticketsApiUrl в #dsfc-config) -->
        <TicketWidget :api-url="cfg.ticketsApiUrl" :event-id="cfg.ticketsEventId" />
        <AppFooter />
    </main>
</template>
