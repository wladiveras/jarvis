export default defineEventHandler(async (event) => {
    const body = await readBody(event)
    const mensagens = body.mensagens
  
    const prompt = `
    Você é um gerador de regex avançado. Analise as mensagens abaixo e agrupe-as em categorias coerentes. Para cada grupo, gere:
    - Nome da categoria (em snake_case)
    - Lista de mensagens similares
    - Regex .NET compatível que aceite essas variações
    
    Formato de resposta:
    [
      {
        "categoria": "nome_categoria",
        "mensagens": ["mensagem1", "mensagem2", "..."],
        "regex": "regex_aqui"
      }
    ]
    
    Mensagens:
    ${mensagens}
      `.trim();
    
  
    interface ApiResponse {
      result: {
        response: any; 
      };
    }

    const response = await $fetch<ApiResponse>(`https://api.cloudflare.com/client/v4/accounts/${process.env.CLOUDFLARE_ACCOUNT_ID}/ai/run/@cf/meta/llama-4-scout-17b-16e-instruct`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.CLOUDFLARE_API_TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: {  
        messages: [{ role: 'user', content: prompt }],
        temperature: 0,  // Controla a aleatoriedade. Quanto maior, mais criativo (ex: 0.7).
        top_k: 1,        // Limita o número de palavras candidatas por etapa. (ex: 20 ou 40).
        top_p: 1         // Probabilidade cumulativa (nucleus sampling). Valores típicos: 0.8 ~ 0.95.
      }
    })
  
    return response.result.response
  })