<template>
  <div class="p-8 max-w-3xl mx-auto">
    <h1 class="text-2xl font-bold mb-4">Gerador de Regex por Categorias</h1>

    <div class="space-y-4 w-full">
      <UTextarea
        class="w-full"
        v-model="input"
        autoresize
        :rows="6"
        placeholder="Cole aqui as mensagens do cliente..."
      />

      <UButton class="w-full" :loading="loading" @click="analisarMensagens">
        Analisar
      </UButton>
    </div>

    <div v-if="response" class="mt-6 space-y-4">
      <MDC :value="response" tag="article" />
    </div>
  </div>
</template>

<script setup lang="ts">
const input = useState('input', () => '');
const response = ref('');
const loading = ref(false);

const analisarMensagens = async () => {
  loading.value = true;

  try {
    const data = await $fetch('/api/analyze', {
      method: 'POST',
      body: { mensagens: input.value },
    });
    // Atualiza o response diretamente com o texto retornado pela API;
    response.value = data;

  } catch (err) {
    console.error('Erro ao analisar mensagens:', err);
    alert('Erro ao processar as mensagens. Verifique o console para mais detalhes.');
  } finally {
    input.value = ''; // Limpa o campo de entrada após a análise
    loading.value = false;
  }
};
</script>