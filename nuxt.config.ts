// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  modules: ['nuxt-highcharts', '@nuxt/icon'],
  compatibilityDate: '2025-05-15',
  devtools: { enabled: true },
  icon: {
    mode: 'css',
    cssLayer: 'base'
  }
})