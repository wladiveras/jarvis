<template>
  <div class="h-full flex flex-col overflow-hidden">
    <div class="flex items-center justify-between px-4 h-14">
      <div class="flex items-center gap-x-4">
        <h2 class="md:text-lg text-gray-600 dark:text-gray-300">
          LLM Settings
        </h2>
      </div>
      <UButton
        icon="i-heroicons-x-mark-20-solid"
        color="gray"
        variant="ghost"
        class="md:hidden"
        @click="$emit('hideDrawer')"
      />
    </div>
    <UDivider />
    <div class="p-4 flex-1 space-y-6 overflow-y-auto">
      <UFormGroup label="Model">
        <USelectMenu v-model="llmParams.model" size="md" :options="models" />
      </UFormGroup>

      <RangeInput
        v-model="llmParams.temperature"
        label="Temperature"
        :min="0"
        :max="5"
        :step="0.1"
      />

      <RangeInput
        v-model="llmParams.maxTokens"
        label="Max Tokens"
        :min="1"
        :max="4096"
      />

      <UFormGroup label="System Prompt">
        <UTextarea
          v-model="llmParams.systemPrompt"
          :rows="3"
          :maxrows="8"
          autoresize
        />
      </UFormGroup>

      <div class="flex items-center justify-between">
        <span>Stream Response</span>
        <UToggle v-model="llmParams.stream" />
      </div>

      <UAccordion
        :items="accordionItems"
        color="white"
        variant="solid"
        size="md"
      >
        <template #item>
          <UCard :ui="{ body: { base: 'space-y-6', padding: 'p-4 sm:p-4' } }">
            <RangeInput
              v-model="llmParams.topP"
              label="Top P"
              :min="0"
              :max="2"
              :step="0.1"
            />

            <RangeInput
              v-model="llmParams.topK"
              label="Top K"
              :min="1"
              :max="50"
            />

            <RangeInput
              v-model="llmParams.frequencyPenalty"
              label="Frequency Penalty"
              :min="0"
              :max="2"
              :step="0.1"
            />

            <RangeInput
              v-model="llmParams.presencePenalty"
              label="Presence Penalty"
              :min="0"
              :max="2"
              :step="0.1"
            />

            <RangeInput
              v-model="llmParams.repetitionPenalty"
              label="Repetition Penalty"
              :min="0"
              :max="2"
              :step="0.1"
            />
          </UCard>
        </template>
      </UAccordion>

      <UButton color="gray" size="sm" block @click="$emit('reset')">
        Reset settings
      </UButton>
    </div>
    <div class="p-2">
      <UButton
        to="https://hub.nuxt.com?utm_source=hub-chat"
        target="_blank"
        variant="link"
        color="gray"
        rel="noopener"
        size="sm"
      >
        Hosted on NuxtHub
      </UButton>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { LlmParams } from '~~/types';

const llmParams = defineModel('llmParams', {
  type: Object as () => LlmParams,
  required: true,
});

defineEmits(['hideDrawer', 'reset']);

const accordionItems = [
  {
    label: 'Advanced Settings',
    defaultOpen: false,
  },
];

const defaultModels = [
  '@hf/thebloke/deepseek-coder-6.7b-base-awq',
  '@hf/thebloke/deepseek-coder-6.7b-instruct-awq',
  '@cf/deepseek-ai/deepseek-math-7b-base',
  '@cf/deepseek-ai/deepseek-math-7b-instruct',
  '@cf/thebloke/discolm-german-7b-v1-awq',
  '@cf/tiiuae/falcon-7b-instruct',
  '@cf/google/gemma-2b-it-lora',
  '@cf/google/gemma-7b-it-lora',
  '@hf/google/gemma-7b-it',
  '@hf/nousresearch/hermes-2-pro-mistral-7b',
  '@hf/thebloke/llama-2-13b-chat-awq',
  '@cf/meta/llama-2-7b-chat-fp16',
  '@cf/meta-llama/llama-2-7b-chat-hf-lora',
  '@cf/meta/llama-3-8b-instruct',
  '@cf/meta/llama-3-8b-instruct-awq',
  '@cf/meta/llama-3.1-8b-instruct',
  '@cf/meta/llama-3.1-8b-instruct-awq',
  '@cf/meta/llama-3.1-8b-instruct-fp8',
  '@hf/thebloke/llamaguard-7b-awq',
  '@cf/mistral/mistral-7b-instruct-v0.1',
  '@hf/thebloke/mistral-7b-instruct-v0.1-awq',
  '@cf/mistral/mistral-7b-instruct-v0.2-lora',
  '@hf/mistral/mistral-7b-instruct-v0.2',
  '@hf/thebloke/neural-chat-7b-v3-1-awq',
  '@cf/openchat/openchat-3.5-0106',
  '@hf/thebloke/openhermes-2.5-mistral-7b-awq',
  '@cf/microsoft/phi-2',
  '@cf/qwen/qwen1.5-0.5b-chat',
  '@cf/qwen/qwen1.5-1.8b-chat',
  '@cf/qwen/qwen1.5-14b-chat-awq',
  '@cf/qwen/qwen1.5-7b-chat-awq',
  '@cf/defog/sqlcoder-7b-2',
  '@hf/nexusflow/starling-lm-7b-beta',
  '@cf/tinyllama/tinyllama-1.1b-chat-v1.0',
  '@cf/fblgit/una-cybertron-7b-v2-bf16',
  '@hf/thebloke/zephyr-7b-beta-awq',
];

const { data: serverModels } = await useFetch('/api/models');

const models = computed(() =>
  serverModels.value?.length ? serverModels.value : defaultModels
);
</script>
