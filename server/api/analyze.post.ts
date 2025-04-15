export default defineEventHandler(async (event) => {
    const body = await readBody(event)
    const mensagens = body.mensagens

    const prompt = `
    Você é um gerador de regex avançado. Sua tarefa é analisar as mensagens fornecidas, agrupá-las em categorias coerentes e gerar um JSON no formato especificado abaixo. Seja direto e siga estritamente o formato solicitado.
    
    Para cada grupo, gere:
    - Nome da categoria (em snake_case).
    - Lista de mensagens similares.
    - Regex .NET compatível que aceite essas variações.
    - Exemplos de mensagens que **não devem ser aceitas**.
    
    **Formato de resposta esperado (em JSON):**
    \`\`\`json
    [
      {
        "categoria": "nome_categoria",
        "mensagens": ["mensagem1", "mensagem2", "..."],
        "regex": "regex_aqui",
        "exemplos_invalidos": ["mensagem_invalida1", "mensagem_invalida2", "..."]
      }
    ]
    \`\`\`
    
    **Regras importantes:**
    - Sempre use case insensitive nos regex gerados.
    - Utilize expressões regulares avançadas, como lookaheads, lookbehinds e quantificadores, para capturar padrões complexos.
    - Valide os regex gerados com exemplos de mensagens que não devem ser aceitas.
    - Não inclua explicações extensas. Apenas forneça o JSON no formato solicitado.
    - Caso não haja mensagens suficientes para criar categorias significativas, retorne um JSON vazio: \`[]\`.
    
    **Mensagens para análise:**
    ${mensagens}
    `.trim();

    const response = await $fetch<ApiResponse>(
        `https://api.cloudflare.com/client/v4/accounts/${process.env.CLOUDFLARE_ACCOUNT_ID}/ai/run/@cf/meta/llama-4-scout-17b-16e-instruct`,
        {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${process.env.CLOUDFLARE_API_TOKEN}`,
                'Content-Type': 'application/json'
            },
            body: {
                messages: [{ role: 'user', content: prompt }],
                temperature: 0, // Controla a aleatoriedade. Quanto maior, mais criativo (ex: 0.7).
                top_k: 1, // Limita o número de palavras candidatas por etapa. (ex: 20 ou 40).
                top_p: 0.8, // Probabilidade cumulativa (nucleus sampling). Valores típicos: 0.8 ~ 0.95.
                max_tokens: 4096 // Define o máximo de tokens possíveis na resposta.
            }
        }
    )

    return response.result.response
})
