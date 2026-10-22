<script setup lang="ts">
// Виджет продажи билетов. При пререндере и гидратации — пустая скрытая оболочка (одинаковая разметка).
// В браузере, когда Django передал адрес API, загружает тарифы и показывает состояния:
// загрузка, ошибка с повтором, пусто, список. Ошибка API не ломает остальную страницу.
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { fetchTickets, type Ticket } from '../../services/tickets'

const props = defineProps<{ apiUrl: string; eventId: string }>()

type State = 'idle' | 'loading' | 'error' | 'empty' | 'ready'
const state = ref<State>('idle')
const tickets = ref<Ticket[]>([])
const errorText = ref('')
let controller: AbortController | undefined

const load = async () => {
  controller?.abort()
  if (!props.apiUrl) { state.value = 'idle'; return }
  controller = new AbortController()
  const { signal } = controller
  state.value = 'loading'
  try {
    const list = await fetchTickets(props.apiUrl, props.eventId, signal)
    if (signal.aborted) return
    tickets.value = list
    state.value = list.length ? 'ready' : 'empty'
  } catch (e) {
    if (signal.aborted) return
    errorText.value = e instanceof Error ? e.message : 'Неизвестная ошибка'
    state.value = 'error'
  }
}

// значения из Django приходят после монтирования родителя, поэтому следим за пропсами
onMounted(load)
watch(() => [props.apiUrl, props.eventId], load)
onBeforeUnmount(() => controller?.abort())

const price = (t: Ticket) => {
  try {
    return new Intl.NumberFormat('ru-RU', { style: 'currency', currency: t.currency || 'RUB', maximumFractionDigits: 0 }).format(t.price)
  } catch {
    return `${t.price} ${t.currency ?? ''}`.trim()
  }
}
const busy = computed(() => state.value === 'loading')
</script>

<template>
    <section class="tickets" :hidden="state === 'idle'" :aria-busy="busy" aria-labelledby="tickets-title">
        <h2 id="tickets-title" class="tickets__title">Билеты</h2>

        <p v-if="state === 'loading'" class="tickets__note" role="status">Загружаем тарифы…</p>

        <div v-else-if="state === 'error'" class="tickets__note" role="alert">
            <p>Не удалось загрузить тарифы. {{ errorText }}</p>
            <button type="button" class="btn tickets__retry" @click="load">Повторить</button>
        </div>

        <p v-else-if="state === 'empty'" class="tickets__note">Продажа билетов скоро откроется.</p>

        <ul v-else-if="state === 'ready'" class="tickets__list">
            <li v-for="t in tickets" :key="t.id" class="tickets__item">
                <h3 class="tickets__name">{{ t.title }}</h3>
                <p v-if="t.description" class="tickets__desc">{{ t.description }}</p>
                <p class="tickets__price">{{ price(t) }}</p>
                <a v-if="t.available !== false" :href="t.url" target="_blank" rel="noopener" class="btn btn--solid tickets__buy">Купить билет</a>
                <p v-else class="tickets__sold">Распродано</p>
            </li>
        </ul>
    </section>
</template>

<style scoped>
.tickets {
    padding: 80px calc(var(--u) * 40);
    background: var(--black);
    color: var(--white);
}
.tickets[hidden] { display: none; }
.tickets__title { font-size: max(32px, calc(var(--u) * 60)); line-height: 1.1; text-transform: uppercase; }
.tickets__note { display: flex; flex-direction: column; align-items: flex-start; gap: 20px; margin-top: 40px; font-size: 18px; line-height: 1.4; }
.tickets__retry { --btn-w: 191px; }
.tickets__list {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
    gap: 20px;
    margin: 40px 0 0;
    padding: 0;
    list-style: none;
}
.tickets__item {
    display: flex;
    flex-direction: column;
    gap: 16px;
    padding: 30px;
    border: 1px solid rgba(255, 255, 255, .15);
    border-radius: 15px;
}
.tickets__name { margin: 0; font-size: 24px; font-weight: 400; line-height: 1.25; }
.tickets__desc { font-size: 16px; line-height: 1.4; opacity: .7; }
.tickets__price { margin-top: auto; font-size: 28px; line-height: 1.2; }
.tickets__buy { width: 100%; }
.tickets__sold { font-size: 16px; opacity: .5; }

@media (max-width: 1023px) {
    .tickets { padding: 60px 16px; }
    .tickets__item { padding: 20px; }
}
</style>
