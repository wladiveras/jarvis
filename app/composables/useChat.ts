import type { ChatMessage, LlmParams } from '~~/types';

export interface CategorizedMessage {
  mensagem: string;
  categoria: string;
  regex: string;
}

export function categorizeMessages(
  messages: { mensagem: string }[]
): CategorizedMessage[] {
  const categorias = [
    {
      categoria: 'Valor Total e Taxas',
      regex:
        /^(?:qual|qto|quanto) (?:é|custa|tem) (?:incluído|incluso) (?:taxa|taxas|preço|valor)?$|^(?:quanto|qual) valor (?:é|será) (?:cobrado|taxado)?$/,
    },
    {
      categoria: 'Inclusão de Taxas no Valor',
      regex:
        /^(?:tudo|incluído|incluso) (?:está|será) (?:n|na) (?:conta|boleto)?$|^(?:já|ja) (?:está|esta) (?:incluso|incluído)?$/,
    },
    {
      categoria: 'Inclusão de Laudo e Exame',
      regex:
        /^(?:laudo|exame|psicotécnico|psicológico) (?:está|estão) (?:incluso|incluídos)?$|^(?:incluso|incluído) (?:laudo|exame)?$/,
    },
    {
      categoria: 'Esclarecimento de Valor',
      regex:
        /^(?:qual|qto|quanto) (?:custa|costam|fica|ficam) (?:exame|laudo|taxa|taxas)? (?:por fora)?$|^(?:valor|preço) (?:é|será) (?:este|esse)?$/,
    },
    {
      categoria: 'Esclarecimento de Inclusão',
      regex:
        /^(?:é|será) (?:incluso|incluído) (?:laudo|exame)?$|^(?:laudo|exame) (?:é|está) (?:incluso|incluído)?$/,
    },
    {
      categoria: 'Pagamento e Inclusão de Taxas',
      regex:
        /^(?:pagamento|preço|valor) (?:é|será) (?:com|sem) (?:taxa|taxas|laudo|exame)?$|^(?:eu|Eu) (?:vou|quer) (?:pagar|pagando)?$/,
    },
    {
      categoria: 'Etapas de Pagamento',
      regex:
        /^(?:pagamento|taxas|exames) (?:por|em) (?:etapas|parcelas)?$|^(?:quais|quais são) (?:exames|taxas)?$/,
    },
    {
      categoria: 'Esclarecimento de Taxas e Exames',
      regex: /^(?:o que|quais são) (?:as taxas|taxas)?$|^(?:exame|psicotécnico|psicológico) (?:é|o que)?$/,
    },
    {
      categoria: 'Local do Exame Médico',
      regex: /^(?:onde|local) (?:exame|laudo|médico)?$/,
    },
  ];

  const categorizedMessages: CategorizedMessage[] = [];

  for (const { mensagem } of messages) {
    let categoriaEncontrada = 'Sem Categoria';
    let regexEncontrado = '';

    for (const { categoria, regex } of categorias) {
      const regexObj = new RegExp(regex, 'i');
      if (regexObj.test(mensagem)) {
        categoriaEncontrada = categoria;
        regexEncontrado = regex;
        break;
      }
    }

    categorizedMessages.push({
      mensagem,
      categoria: categoriaEncontrada,
      regex: regexEncontrado,
    });
  }

  return categorizedMessages;
}


export function useChat() {
  async function* streamResponse(
    url: string,
    messages: ChatMessage[],
    llmParams: LlmParams
  ) {
    let buffer = '';

    try {
      const response = await $fetch<ReadableStream>(url, {
        method: 'POST',
        body: {
          messages,
          params: llmParams,
        },
        responseType: 'stream',
      });

      const reader = response.pipeThrough(new TextDecoderStream()).getReader();

      while (true) {
        const { value, done } = await reader.read();

        if (done) {
          if (buffer.trim()) {
            console.warn('Fluxo terminou com dados não analisados:', buffer);
          }

          return;
        }

        buffer += value;
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice('data: '.length).trim();
            if (data === '[DONE]') {
              return;
            }

            try {
              const jsonData = JSON.parse(data);
              if (jsonData.response) {
                yield jsonData.response;
              }
            } catch (parseError) {
              console.warn('Error parsing JSON:', parseError);
            }
          }
        }
      }
    } catch (error) {
      console.error('Erro ao enviar mensagem:', error);

      throw error;
    }
  }

  async function getResponse(
    url: string,
    messages: ChatMessage[],
    llmParams: LlmParams
  ) {
    try {
      const response = await $fetch<string>(url, {
        method: 'POST',
        body: {
          messages,
          params: llmParams,
        },
      });

      return response;
    } catch (error) {
      console.error('Erro ao enviar mensagem:', error);
      throw error;
    }
  }

  return {
    categorizeMessages,
    getResponse,
    streamResponse,
  };
}
