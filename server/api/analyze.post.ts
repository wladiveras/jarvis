export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const mensagens = body.mensagens

  const prompt = `
Você é um gerador de regex avançado. Analise as mensagens abaixo e agrupe-as em categorias coerentes. Para cada grupo, gere:
- Nome da categoria (em snake_case)
- Lista de mensagens similares
- Regex .NET compatível que aceite essas variações, incluindo padrões complexos e específicos.

Certifique-se de que os regex gerados sejam robustos e capazes de capturar variações linguísticas, como sinônimos, conjugação de verbos, e diferentes formas de expressar a mesma ideia.

Formato de resposta em Markdown (MDC):
# Análise de Mensagens

As mensagens foram analisadas e agrupadas nas seguintes categorias:

\`\`\`json
[
  {
    "categoria": "nome_categoria",
    "mensagens": ["mensagem1", "mensagem2", "..."],
    "regex": "regex_aqui"
  }
]
\`\`\`

Exemplo de regex avançado:
\`\`\`regex
.(\\b(laudo|exame).(inclu(so|sos|ido|ído))\\b).|.(\\b(mais).(tax(a|as))\\b).|.(\\b(inclu(so|sos|ido|ído|ir|indo)|custo.(laudo|exam(e|es)).)\\b).|.(\\bpago mais alguma\\b).|.(\\bvalor . pagar .por fora\\b).|.(\\btaxas já vem excluindo\\b).|.(\\bcom.(laudo|exame) ou sem\\b).|.(\\bpag(a|ava).etap(a|as)\\b).|.(\\bexam(e|es).qua(l|is)\\b).|.(\\bs(ão|ao) só.tax(a|as)\\b).|.(\\btaxas.pag(a|as).(de uma vez|junt(o|os|a))\\b).|.(\\b.é.o.psico(teste|técnico|tecnico)\\b).|.(\\bexame m(é|e)dico\\b).|.(\\b(o que|oque|qua(is|l)) (s(ão|ao|eria)|é|e).tax(a|as)\\b).|.(\\btax(as|a).detran\\b).|.(\\binclui todas as tax(as|a).* (do que)\\b).*
\`\`\`

Mensagens:
${mensagens}
`.trim();

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
      top_p: 1,         // Probabilidade cumulativa (nucleus sampling). Valores típicos: 0.8 ~ 0.95.
      max_tokens: 4096, // Define o máximo de tokens possíveis na resposta.
    }
  })

  return response.result.response
})