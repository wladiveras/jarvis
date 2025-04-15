<template>
  <div class="p-8 max-w-3xl mx-auto">
    <h1 class="text-2xl font-bold mb-4">Gerador de Regex por Categorias</h1>

    <UTextarea
      v-model="input"
      autoresize
      :rows="6"
      placeholder="Cole aqui as mensagens do cliente..."
    />

    <UButton class="mt-4" :loading="loading" @click="analisarMensagens">
      Analisar
    </UButton>

    <div v-if="jsonData.length" class="mt-6 space-y-4">
      <div
        v-for="(grupo, index) in jsonData"
        :key="index"
        class="border border-gray-300 rounded p-4 mb-4"
      >
        <h2 class="text-lg font-semibold mb-2">{{ grupo.categoria }}</h2>

        <div class="mb-2 text-sm text-gray-400">Regex:</div>
        <pre class="bg-gray-900 text-white p-4 rounded overflow-auto text-sm">
          {{ grupo.regex }}
        </pre>

        <div class="mt-4 text-sm text-gray-400">Mensagens:</div>
        <ul class="list-disc pl-5">
          <li v-for="(msg, i) in grupo.mensagens" :key="i">
            {{ msg }}
          </li>
        </ul>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const input = ref('');
const loading = ref(false);
const jsonData = ref([]);

const analisarMensagens = async () => {
  loading.value = true;
  jsonData.value = [];

  try {
    const { data } = await useFetch('/api/analyze', {
      method: 'POST',
      body: { mensagens: input.value },
    });

    // Verifica se a resposta é válida
    if (!data.value || typeof data.value !== 'string') {
      throw new Error('Resposta inválida da API.');
    }

    // Extrai JSON bruto da resposta
    const match = data.value.match(/\[\s*{[\s\S]*}\s*\]/);
    if (!match) throw new Error('JSON não encontrado na resposta.');

    const jsonBruto = match[0];

    // Valida e analisa o JSON
    const parsed = JSON.parse(jsonBruto);
    if (!Array.isArray(parsed)) throw new Error('JSON não está no formato esperado.');

    jsonData.value = parsed;
  } catch (err) {
    console.error('Erro ao analisar mensagens:', err);
    alert('Erro ao processar as mensagens. Verifique o console para mais detalhes.');
  }

  loading.value = false;
};
</script>