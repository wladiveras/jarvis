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

Sua tarefa: Analisar uma lista de mensagens fornecida pelo cliente. Você deve categorizar cada mensagem, e, caso não se encaixe nas categorias fornecidas, crie uma nova categoria, um slug e uma regex .NET para identificá-la.

As mensagens serão fornecidas no seguinte formato:
\`\`\`
 - [mensagem 1] - [mensagem 2] - [mensagem 3] ...\n\`\`\`

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

Quando necessário criar uma nova categoria, o regex deve ser genérico e lidar com variações comuns de escrita, capturando palavras-chave e frases relacionadas ao tema da mensagem, evitando ser muito específico ou literal.

Você deve responder com um array JSON válido contendo um objeto para cada mensagem, com os seguintes atributos:
\`\`\`json
[
  {
    "mensagem": "[mensagem do cliente]",
    "categoria": "[categoria da mensagem]",
    "regex": "[regex correspondente à categoria da mensagem]"
  },
   {
    "mensagem": "[mensagem do cliente]",
    "categoria": "[categoria da mensagem]",
    "regex": "[regex correspondente à categoria da mensagem]"
  }
]
\`\`\`

Caso precise criar uma nova categoria, responda primeiro com um objeto JSON neste formato:
\`\`\`json
{
  "Categoria correspondente": "[nome da categoria mais próxima]"
}
\`\`\`
E em seguida, retorne um segundo objeto com os detalhes da nova categoria criada, no seguinte formato:
\`\`\`json
{
  "Nova categoria": "[nome da nova categoria]",
  "Slug": "[slug da categoria]",
  "Mensagens base": "[mensagem do cliente]",
  "Regex": "[regex .NET criada para a nova categoria]"
}
\`\`\`

Exemplo de resposta para mensagens com categorias já existentes:
\`\`\`json
[{"mensagem": "1800 a vista mais taxas ?? 2000 e não tá incluído taxas","categoria": "duvida_valor_taxas","regex": "^(\\\\d+\\\\s*a\\\\s*vista\\\\s*mais\\\\s*taxas?|\\\\d+\\\\s*e\\\\s*não\\\\s*tá\\\\s*incluído\\\\s*taxas)$"},{"mensagem": "Essa que é de 4× no boleto de 590 já é incluído tudo isso ?","categoria": "duvida_inclusao_taxas","regex": "^Essa\\\\s*que\\\\s*é\\\\s*de\\\\s*4×\\\\s*no\\\\s*boleto\\\\s*de\\\\s*590\\\\s*já\\\\s*é\\\\s*incluído\\\\s*tudo\\\\s*isso\\?$"}]
\`\`\`
Exemplo de resposta para nova categoria:
\`\`\`json
{"Categoria correspondente": "Descontos e Promoções"}
{"Nova categoria": "Descontos para Pagamento à Vista","Slug": "descontos-para-pagamento-a-vista","Mensagens base": "Queria saber se vocês dão desconto para pagamento à vista do curso completo.","Regex": "(desconto|descontos|à\\\\s+vista|pagamento).*?(curso|mensal|completo).*"}
\`\`\`

A regex deve ser compatível com .NET, usar agrupamentos e palavras alternadas quando apropriado, lidar com variações comuns de escrita e ser precisa para evitar falsos positivos.

Importante: A resposta deve ser apenas o JSON, sem nenhum outro texto ou formatação extra.

Lembre-se: Você deve retornar sempre um array JSON no primeiro caso ou dois objetos JSON no segundo caso, e nada mais.
` ,
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
A regex deve ser compatível com .NET, usar agrupamentos e palavras alternadas quando apropriado, lidar com variações comuns de escrita e ser precisa para evitar falsos positivos.

Importante: A resposta deve ser apenas o JSON, sem nenhum outro texto ou formatação extra.
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
