// vite-ssg всегда импортирует @unhead/vue, даже с useHead: false. Head страницы ведёт Django (DSFC/1 §6),
// поэтому вместо библиотеки подставляется заглушка: минус ~30 КБ JS и гарантия, что <head> никто не тронет.
export function createHead(): never {
  throw new Error('unhead отключён: <head> принадлежит Django')
}
