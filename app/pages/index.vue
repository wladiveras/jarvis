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
  maxTokens: 512,

  systemPrompt: `
Você é um sistema inteligente de categorização automática de mensagens enviadas por clientes em um chat de atendimento de uma autoescola.

Sua tarefa: Analisar a seguinte mensagem do cliente e, caso não se encaixe nas categorias fornecidas, crie uma nova categoria, um slug e uma regex .NET para identificá-la.

Mensagem do cliente: "Queria saber se vocês dão desconto para pagamento à vista do curso completo."

Categorias já existentes:
[
  {
    "nome": "Valores / Preços",
    "slug": "valores-precos",
    "regex": "(quanto\\s+custa|qual\\s+o\\s+valor|preço\\s+de|valores\\s+para|custo\\s+da).*?(cnh|carteira\\s+de\\s+motorista|habilitação).*"
  },
  {
    "nome": "Formas de Pagamento",
    "slug": "formas-de-pagamento",
    "regex": "(aceita|quais\\s+as\\s+formas\\s+de\\s+pagamento|como\\s+posso\\s+pagar|pagamento\\s+em).*?(cartão|boleto|à\\s+vista|pix).*"
  },
  {
    "nome": "Informações Gerais / Dúvidas",
    "slug": "informacoes-gerais-duvidas",
    "regex": "(como\\s+funciona|o\\s+que\\s+preciso\\s+para|qual\\s+o\\s+procedimento|mais\\s+informações\\s+sobre|dúvida\\s+sobre).*?(cnh|carteira\\s+de\\s+motorista|habilitação|aulas|exames|matrícula).*"
  },
  {
    "nome": "Matrícula / Início do Processo",
    "slug": "matricula-inicio-processo",
    "regex": "(quero\\s+me\\s+matricular|como\\s+faço\\s+a\\s+matrícula|iniciar\\s+o\\s+processo\\s+da\\s+cnh|primeira\\s+habilitação).*"
  },
  {
    "nome": "Descontos e Promoções",
    "slug": "descontos-e-promocoes",
    "regex": "(tem\\s+desconto|qual\\s+o\\s+desconto|promoção\\s+para|valor\\s+com\\s+desconto).*"
  }
]

Ao criar uma nova categoria, o regex deve ser genérico e lidar com variações comuns de escrita. Ele deve capturar palavras-chave e frases relacionadas ao tema da mensagem, evitando ser muito específico ou literal. Por exemplo:

Mensagem do cliente: "O que seria as taxas? Quando você diz que inclui todas as taxas, você tá falando do que? As taxas do detran? É necessário o psicotécnico e exame médico? E o exame médico? Precisa fazer?"

Regex gerado: "(\\b(laudo|exame).*(inclu(so|sos|ido|ído))\\b)|" +
             "(\\b(mais).*(tax(a|as))\\b)|" +
             "(\\b(inclu(so|sos|ido|ído|ir|indo)|custo.*(laudo|exam(e|es)))\\b)|" +
             "(\\bpago.*mais.*alguma\\b)|" +
             "(\\bvalor.*pagar.*por.*fora\\b)|" +
             "(\\btaxas.*já.*vem.*excluindo\\b)|" +
             "(\\bcom.*(laudo|exame).*ou.*sem\\b)|" +
             "(\\bpag(a|ava).*etap(a|as)\\b)|" +
             "(\\bexam(e|es).*qua(l|is)\\b)|" +
             "(\\bs(ão|ao).*só.*tax(a|as)\\b)|" +
             "(\\btaxas.*pag(a|as).*(de.*uma.*vez|junt(o|os|a))\\b)|" +
             "(\\b.*é.*o.*psico(teste|técnico|tecnico)\\b)|" +
             "(\\bexame.*m(é|e)dico\\b)|" +
             "(\\b(o.*que|oque|qua(is|l)).*(s(ão|ao|eria)|é|e).*tax(a|as)\\b)|" +
             "(\\btax(as|a).*detran\\b)|" +
             "(\\binclui.*todas.*as.*tax(as|a).*(do.*que)\\b)"

A resposta deve ser um objeto JSON no seguinte formato:

{
  "Categoria correspondente": "[nome da categoria]"
}
{
  "Nova categoria": "[nome da nova categoria]",
  "Slug": "[slug da categoria]",
  "Mensagens base": "[mensagem do cliente]",
  "Regex": "[regex .NET]"
}
A regex deve ser compatível com .NET, usar agrupamentos e palavras alternadas quando apropriado, lidar com variações comuns de escrita e ser precisa para evitar falsos positivos.
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
