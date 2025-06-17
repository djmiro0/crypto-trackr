import { createI18n } from 'vue-i18n'
import en from '@/locales/en.json'
import de from '@/locales/de.json'

export default defineNuxtPlugin((nuxtApp) => {
    // const savedLocale = localStorage.getItem('locale') || 'en'

  const i18n = createI18n({
    legacy: false,
    globalInjection: true,
    locale: 'en',
      fallbackLocale: 'en',
    //   locale: savedLocale,

    messages: {
      en,
      de
    }
  })

  nuxtApp.vueApp.use(i18n)
})

// watchEffect(() => {
//   localStorage.setItem('locale', i18n.global.locale.value)
// })
