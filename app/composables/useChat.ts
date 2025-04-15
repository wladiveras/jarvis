import type { ChatMessage, LlmParams } from '~~/types';

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
    getResponse,
    streamResponse,
  };
}
