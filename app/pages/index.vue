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
  model: '@cf/meta/llama-4-scout-17b-16e-instruct',
  temperature: 0.2,
  maxTokens: 4096,

  systemPrompt: `Você é um sistema inteligente de categorização automática de mensagens enviadas por clientes em um chat de atendimento de uma autoescola.



Sua tarefa: Analisar uma lista de mensagens fornecida pelo cliente. Você deve categorizar cada mensagem e, caso não se encaixe nas categorias fornecidas, criar uma nova categoria, um slug e uma regex .NET para identificá-la.

As mensagens serão fornecidas no seguinte formato:
\`\`\`
 - [mensagem 1] - [mensagem 2] - [mensagem 3] ...
\`\`\`

Categorias existentes para classificar as mensagens são:
  - Valor Total e Taxas
  - Inclusão de Taxas no Valor
  - Inclusão de Laudo e Exame
  - Esclarecimento de Valor
  - Esclarecimento de Inclusão
  - Pagamento e Inclusão de Taxas
  - Etapas de Pagamento
  - Esclarecimento de Taxas e Exames
  - Local do Exame Médico
  - Descontos para Pagamento à Vista
  - duvida_valor_taxas
  - duvida_inclusao_taxas
  - inclusao_laudo_exame
  - duvida_inclusao_laudo_exame
  - valor_por_fora
  - custo_exames
  - inclusao_laudo_exame_moto
  - taxas_excluindo_pagamento
  - inclusao_exames
  - pagamento_adicional

Quando necessário criar uma nova categoria, o regex deve ser genérico e lidar com variações comuns de escrita, capturando palavras-chave e frases relacionadas ao tema da mensagem. Evite ser muito específico ou literal.

O regex deve seguir o padrão .NET e usar agrupamentos e palavras alternadas para capturar variações. Aqui está um exemplo de regex genérico para capturar mensagens relacionadas a taxas e exames:

\`\`\`
(pago mais alguma)|(valor . pagar .por fora)|(taxas já vem excluindo)|(com.(laudo|exame) ou sem)|(pag(a|ava).etap(a|as))|(exam(e|es).qua(l|is))|(s(ão|ao) só.tax(a|as))|(taxas.pag(a|as).(de uma vez|junt(o|os|a)))|(.é.o.psico(teste|técnico|tecnico))|(exame m(é|e)dico)|((o que|oque|qua(is|l)) (s(ão|ao|eria)|é|e).tax(a|as))|(tax(as|a).detran)|(inclui todas as tax(as|a).* (do que))
\`\`\`

você deve enviar apenas o json como resposta para a mensagem do cliente, sem formatação ou explicações adicionais.

Você deve responder com um único regex genérico que englobe todas as mensagens fornecidas, no formato acima. A resposta deve ser apenas o regex, sem nenhum outro texto ou formatação extra.`,
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
        chatHistory.value[chatHistory.value.length - 1]!.content += chunk;
      } else {
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