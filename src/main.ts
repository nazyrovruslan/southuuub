import { ViteSSG } from 'vite-ssg/single-page'
import App from './App.vue'
import './styles/fonts.css'
import './styles/main.css'

// hydration: true — иначе vite-ssg/single-page перерисует страницу поверх готовой разметки, а не гидратирует её.
// useHead: false — <head> принадлежит Django (DSFC/1 §6): приложение не трогает title и мета-теги и не меняет <html lang>.
export const createApp = ViteSSG(App, undefined, { hydration: true, useHead: false })
