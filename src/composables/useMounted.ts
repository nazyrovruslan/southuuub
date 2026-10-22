import { onMounted, ref } from 'vue'

/** false при пререндере и в момент гидратации, true после монтирования: для разметки, которой нет в статическом HTML. */
export function useMounted() {
  const mounted = ref(false)
  onMounted(() => { mounted.value = true })
  return mounted
}
