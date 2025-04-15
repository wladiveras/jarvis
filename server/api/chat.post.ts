export default defineEventHandler(async (event) => {
  const { model, params } = await readBody(event);
  if (!model || !params) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Modelo de chat ou parâmetros ausentes',
    });
  }

  const config = {
    max_tokens: params.maxTokens,
    temperature: params.temperature,
    top_p: params.topP,
    top_k: params.topK,
    frequency_penalty: params.frequencyPenalty,
    presence_penalty: params.presencePenalty,
    repetition_penalty: params.repetitionPenalty,
    stream: params.stream,
  };

  const ai = hubAI();

  // Função para validar regex
  const isValidRegex = (regex: string): boolean => {
    try {
      new RegExp(regex); // Tenta criar o regex
      return true;
    } catch {
      return false; // Retorna falso se o regex for inválido
    }
  };

  // Função para limpar escapes desnecessários
  const cleanRegex = (regex: string): string => {
    return regex.replace(/\\\\s/g, "\\s"); // Substitui \\s por \s
  };

  try {
    const result = await ai.run(model, {
      messages: params.systemPrompt
        ? [{ role: 'system', content: params.systemPrompt }, ...params.messages]
        : params.messages,
      ...config,
    });

    let response = params.stream
      ? sendStream(event, result as ReadableStream)
      : (result as { response: string }).response;

    if (!params.stream && response) {
      const parsedResponse = JSON.parse(response);

      // Valida e ajusta o regex
      parsedResponse.forEach((item: any) => {
        if (item.regex) {
          item.regex = cleanRegex(item.regex); // Limpa escapes desnecessários
          if (!isValidRegex(item.regex)) {
            throw createError({
              statusCode: 400,
              statusMessage: `Regex inválido: ${item.regex}`,
            });
          }
        }
      });

      response = JSON.stringify(parsedResponse);
    }

    return response;
  } catch (error) {
    console.error(error);
    throw createError({
      statusCode: 500,
      statusMessage: 'Erro ao processar a solicitação',
    });
  }
});