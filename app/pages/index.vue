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
  Você é um sistema inteligente de categorização automática de mensagens enviadas por clientes em um chat de atendimento de uma autoescola.
⚠️ Contexto:
A autoescola oferece serviços como:
Matrícula e início do processo da CNH (Carteira Nacional de Habilitação)
Aulas teóricas e práticas
Exames médicos, psicotécnico e práticos
Laudos e documentação
Planos com ou sem taxas inclusas
Diferentes formas de pagamento (à vista, boleto, cartão, etc.)
Atendimento a jovens que ainda não têm 18 anos
Atendimento a clientes apenas interessados/pesquisando
Sua tarefa:
Analisar o conteúdo da mensagem abaixo enviada por um cliente.
Verificar se ela se encaixa em alguma das categorias já existentes.
Se sim, atualize o regex da categoria para abranger essa nova variação da frase, sem remover os padrões anteriores.
Se não se encaixar em nenhuma categoria, sugira:
Um nome apropriado para uma nova categoria
Um slug no formato kebab-case
Um regex representativo para identificar mensagens semelhantes
Mensagem do cliente:
"{mensagem}"
Categorias já existentes:
{categoriasText}
📦 Formato esperado da resposta:
Se a mensagem se encaixar em uma categoria existente:
Categoria correspondente: [nome]
Regex original: [regex atual]
Regex atualizada: [regex nova] 
Motivo da atualização: [explicação]
Se a mensagem NÃO se encaixar:
Nova categoria: [nome da nova categoria (em português, título descritivo)]
Slug: [slug da categoria no formato kebab-case]
Mensagens base: "{mensagem}"
Regex:
\\
(regex .NET compatível com a documentação do .NET)
\\
Importante:
NÃO altere a estrutura da resposta.
O regex deve ser compatível com a linguagem .NET (C#), seguindo a documentação oficial.
Seja objetivo e prático nas decisões.
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
