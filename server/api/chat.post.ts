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

  // Função para ajustar regex para o formato genérico
  const adjustToGenericRegex = (): string => {
    return `^(qual|quanto)*(valor|custo|preço)*de*(exame|laudo|por*fora)*$`;
  };

  // Função para limpar e ajustar o regex gerado pela IA
  const cleanAndAdjustRegex = (regex: string): string => {
    return regex
    .replace(/\\s\*/g, " ") // Substitui \\s* por um espaço simples
    .replace(/\\s\+/g, " ") // Substitui \\s+ por um espaço simples
    .replace(/\\s/g, " ") // Substitui \\s por um espaço simples
    .replace(/\s+/g, " ") // Remove espaços extras
    .replace(/\\\?/g, "?") // Remove escapes desnecessários de interrogações
    .replace(/\\\./g, ".") // Remove escapes desnecessários de pontos
    .replace(/\\\|/g, "|") // Remove escapes desnecessários de pipes
    .replace(/\(\?:/g, "(") // Remove agrupamentos não capturantes
    .replace(/\(\s*\)/g, "") // Remove agrupamentos vazios
    .replace(/\)\?/g, ")") // Remove agrupamentos opcionais mal formatados
    .trim(); // Remove espaços extras no início e no final
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
        item.regex = cleanAndAdjustRegex(item.regex); // Limpa e ajusta o regex
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