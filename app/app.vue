<template>
  <NuxtRouteAnnouncer />
  <NuxtLoadingIndicator />
  <NuxtPage />
</template>

<script setup lang="ts">
useHead({
  bodyAttrs: {
    class: 'bg-white dark:bg-gray-900',
  },
});
useSeoMeta({
  title: 'Jarvis - AI LLM',
  ogTitle: 'Jarvis - AI LLM ',
  description:
    'Jarvis - uma AI LLM para um desafio tecnico.',
  ogImage:
    'https://assets.hub.nuxt.com/eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJodHRwczovL2h1Yi1jaGF0Lm51eHQuZGV2IiwiaWF0IjoxNzI0NTcyMzI3fQ.HqgnQrHVs34qdjFSP6RYy_M94duSAgPEvGgHF5j0xvI.jpg?theme=light',
  twitterCard: 'summary_large_image',
});
</script>
