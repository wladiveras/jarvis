// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2024-07-30',
  // https://nuxt.com/docs/getting-started/upgrade#testing-nuxt-4
  future: { compatibilityVersion: 4 },

  // https://nuxt.com/modules
  modules: ['@nuxt/ui-pro', '@nuxt/content', '@nuxtjs/mdc', '@nuxthub/core'],
  css: ['~/assets/css/main.css'],

  // https://hub.nuxt.com/docs/getting-started/installation#options
  hub: {
    ai: true,
    cache: true,
  },

  content: {
    highlight: {
      theme: 'github-dark',
      preload: ['json']
    }
  },

  // https://devtools.nuxt.com
  devtools: { enabled: true },
});