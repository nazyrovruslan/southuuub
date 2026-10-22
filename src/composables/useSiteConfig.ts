// Настройки, которые Django может менять без пересборки (DSFC/1 §7).
// Описание и значения по умолчанию — dsfc.config.json, оттуда же собирается dsfc-manifest.json.
// Первый кадр (и при пререндере, и при гидратации) рендерится со значениями по умолчанию,
// значения из <script id="dsfc-config" type="application/json"> применяются только после монтирования,
// поэтому разметка при гидратации всегда совпадает.
import { inject, onMounted, provide, reactive, type InjectionKey } from 'vue'
import project from '../../dsfc.config.json'

type Spec = { type: string; label: string; default: string | number | boolean }
type Keys = keyof typeof project.config
export type SiteConfig = { [K in Keys]: (typeof project.config)[K]['default'] }

const KEY: InjectionKey<SiteConfig> = Symbol('site-config')

const defaults = Object.fromEntries(
  Object.entries(project.config as Record<string, Spec>).map(([k, v]) => [k, v.default]),
) as SiteConfig

/** Вызывается один раз в App.vue: создаёт настройки и читает значения из Django после монтирования. */
export function provideSiteConfig(): SiteConfig {
  const cfg = reactive({ ...defaults }) as SiteConfig
  provide(KEY, cfg)
  onMounted(() => {
    const el = document.getElementById('dsfc-config')
    if (!el) return
    try {
      const cms = JSON.parse(el.textContent || '{}') as Record<string, unknown>
      for (const k of Object.keys(defaults) as Keys[]) {
        // тип значения должен совпадать с типом по умолчанию, иначе остаётся значение из сборки
        if (k in cms && typeof cms[k] === typeof defaults[k]) (cfg as Record<Keys, unknown>)[k] = cms[k]
      }
    } catch (e) {
      console.warn('dsfc-config: некорректный JSON', e)
    }
  })
  return cfg
}

export function useSiteConfig(): SiteConfig {
  return inject(KEY, defaults)
}
