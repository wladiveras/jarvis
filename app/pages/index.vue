<template>
  <div class="h-dvh flex flex-col md:flex-row">
    <USlideover
      v-model="isDrawerOpen"
      class="md:hidden"
      :ui="{ width: 'max-w-xs' }"
    >
      <LlmSettings
        v-model:llm-params="llmParams"
        @hide-drawer="isDrawerOpen = false"
        @reset="resetSettings"
      />
    </USlideover>

    <div class="hidden md:block md:w-1/3 lg:w-1/4">
      <LlmSettings v-model:llm-params="llmParams" @reset="resetSettings" />
    </div>

    <UDivider orientation="vertical" class="hidden md:block" />

    <div class="flex-grow md:w-2/3 lg:w-3/4">
      <ChatPanel
        :chat-history="chatHistory"
        :loading="loading"
        @clear="chatHistory = []"
        @message="sendMessage"
        @show-drawer="isDrawerOpen = true"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { useStorageAsync } from '@vueuse/core';
import type { ChatMessage, LlmParams, LoadingType } from '~~/types';

const isDrawerOpen = ref(false);

const defaultSettings: LlmParams = {
  model: '@cf/meta/llama-3.2-3b-instruct',
  temperature: 0.2,
  maxTokens: 512,
  systemPrompt: `
  "Você é um sistema de categorização inteligente de mensagens de clientes de uma autoescola. Sua tarefa é: Analisar uma lista de mensagens reais enviadas por clientes. Para cada mensagem: 1. Classifique a mensagem com uma **categoria única**, descritiva e objetiva, baseada na intenção da frase. 2. Crie uma **regex robusta no padrão .NET**, com agrupamentos e variações para detectar mensagens semelhantes. A regex deve: - Ser compatível com .NET. - Usar agrupamentos e palavras alternadas. - Lidar com português informal (abreviações, erros comuns, variações de escrita). - Ser precisa para evitar falsos positivos. Formato obrigatório da resposta (em JSON por mensagem): [ { \"mensagem\": \"<mensagem original>\", \"categoria\": \"<categoria atribuída>\", \"regex\": \"<regex .NET robusta gerada para identificar mensagens similares>\" }, ... (repetir para cada mensagem) ] ⚠️ Não adicione explicações nem mensagens fora do JSON. ⚠️ Não agrupe tudo em uma única categoria genérica, seja específico na intenção de cada frase. ⚠️ Não escreva texto fora do JSON. 📥 Mensagens: {mensagens} 📂 Categorias já existentes (para tentar agrupar): {categoriasText}"
  `,
  stream: true,
};

const llmParams = useStorageAsync<LlmParams>('llmParams', {
  ...defaultSettings,
});
const resetSettings = () => {
  llmParams.value = { ...defaultSettings };
};

const chatHistory = ref<ChatMessage[]>([]);
const loading = ref<LoadingType>('idle');
async function sendMessage(message: string) {
  chatHistory.value.push({ role: 'user', content: message });

  try {
    loading.value = llmParams.value.stream ? 'stream' : 'message';

    const response = useAIChat('/api/chat', llmParams.value.model, {
      ...llmParams.value,
      model: undefined,
      messages: chatHistory.value,
    })();

    let responseAdded = false;
    for await (const chunk of response) {
      if (responseAdded) {
        // add the chunk to the current message's content
        chatHistory.value[chatHistory.value.length - 1]!.content += chunk;
      } else {
        // add a new message to the chat history
        chatHistory.value.push({
          role: 'assistant',
          content: chunk,
        });

        responseAdded = true;
      }
    }
  } catch (erro) {
    console.error('Erro ao enviar mensagem:', erro);
  } finally {
    loading.value = 'idle';
  }
}
</script>
