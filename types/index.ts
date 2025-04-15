export interface CategorizedMessage {
  mensagem: string;
  categoria: string;
  regex: string;
}


export type LlmParams = {
  model: string;
  temperature?: number;
  maxTokens?: number;
  topP?: number;
  topK?: number;
  frequencyPenalty?: number;
  presencePenalty?: number;
  repetitionPenalty?: number;
  systemPrompt?: string;
  stream?: boolean;
};

export type ChatMessage = {
  role: string;
  content: string;
  extra?: CategorizedMessage[];
};

export type LoadingType = 'idle' | 'stream' | 'message';
