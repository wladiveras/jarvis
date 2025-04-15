<template>
  <div class="flex flex-col h-full bg-gray-50 dark:bg-gray-950">
    <ChatHeader
      :clear-disabled="chatHistory.length === 0"

      @clear="$emit('clear')"
      @show-drawer="$emit('showDrawer')"
    />
    <UDivider />
        <div ref="chatContainer" class="flex-1 overflow-y-auto p-4 space-y-5">
      <div
        v-for="(message, index) in chatHistory"
        :key="`message-${index}`"
        class="flex items-start gap-x-4"
      >
        <div
          class="w-12 h-12 p-2 rounded-full"
          :class="`${message.role === 'user' ? 'bg-primary/20' : 'bg-blue-500/20'}`"
        >
          <UIcon
            :name="`${
              message.role === 'user'
                ? 'i-heroicons-user-16-solid'
                : 'i-heroicons-sparkles-solid'
            }`"
            class="w-8 h-8"
            :class="`${message.role === 'user' ? 'text-primary-400' : 'text-blue-400'}`"
          />
      </div>
        <pre v-if="isJson(message.content)" class="bg-gray-800 p-2 rounded text-sm overflow-auto" v-html="formatJson(message.content)" />
        <AssistantMessage v-else :content="message.content" />
      </div>
      <ChatLoadingSkeleton v-if="loading === 'message'" />
      <NoChats v-if="chatHistory.length === 0" class="h-full" />
    </div>

    <UDivider />
    <div class="flex items-start p-3.5 relative">
      <UTextarea
        ref="userInput"
        v-model="userMessage"
        placeholder="Como posso te ajudar hoje?"
        class="w-full"
        :ui="{ padding: { xl: 'pr-11' } }"
        :rows="1"
        :maxrows="5"
        :disabled="loading !== 'idle'"
        autoresize
        size="xl"
        @keydown.enter.exact.prevent="sendMessage"
        @keydown.enter.shift.exact.prevent="userMessage += '\n'"
      />

      <UButton
        icon="i-heroicons-arrow-up-20-solid"
        class="absolute top-5 right-5"
        :disabled="loading !== 'idle'"
        @click="sendMessage"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import type { ChatMessage, LoadingType, CategorizedMessage } from '~~/types';
import { categorizeMessages } from '~~/app/composables/useChat';

const props = defineProps<{
  chatHistory: Array<ChatMessage>;
  loading: LoadingType;
}>();


const emit = defineEmits<{
  message: [message: string];
  clear: [];
  showDrawer: [];
}>();

const userMessage = ref('');
const chatContainer = useTemplateRef('chatContainer');
let observer: MutationObserver | null = null
const resultMessages = ref<any[]>([])


onMounted(() => {
  if (chatContainer.value) {
    observer = new MutationObserver(() => {
      if (chatContainer.value) {
        chatContainer.value.scrollTop = chatContainer.value.scrollHeight;
      }
    });

    observer.observe(chatContainer.value, {
      childList: true,
      subtree: true,
      characterData: true,
    });
  }
});

onUnmounted(() => {
  if (observer) {
    observer.disconnect();
  }
});

const userInput = useTemplateRef('userInput');
watch(
  () => props.loading,
  () => {
    if (props.loading === 'idle') {
      nextTick(() => {
        userInput.value?.textarea.focus();
      });
    }
  }
);

const sendMessage = () => {
  if (!userMessage.value.trim()) return;

  try {
    const message = userMessage.value;
    emit('message', message);

    const userMessageIndex = props.chatHistory.findLastIndex(
      (msg) => msg.role === "user"
    );

        resultMessages.value = categorizeMessages([{ mensagem: message }]);
        
         props.chatHistory[userMessageIndex].extra = resultMessages.value;
        resultMessages.value = [];
    });

    userMessage.value = '';
  } catch (error) {
    console.error("Erro ao enviar mensagem:", error);
  }
};

const isJson = (str: string): boolean => {
  try {
    JSON.parse(str);
    return true;
  } catch (error) {
    return false;
  }
};

const formatJson = (jsonString: string): string => {
  try {
    const json = JSON.parse(jsonString);
    return JSON.stringify(json, null, 2)
      .replace(/("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|\b\d+\b)/g, (match) => {
        let cls = 'text-gray-300'; // Default color
        if (/^"/.test(match)) {
          if (/:$/.test(match)) {
            cls = 'text-blue-400'; // Keys
          } else {
            cls = 'text-green-400'; // Strings
          }
        } else if (/true|false/.test(match)) {
          cls = 'text-yellow-400'; // Booleans
        } else if (/null/.test(match)) {
          cls = 'text-purple-400'; // Null
        } else if (/^\d+$/.test(match)) {
          cls = 'text-red-400'; // Numbers
        }
        return `<span class="${cls}">${match}</span>`;
      });
  } catch (error) {
    return jsonString;
  }
};

</script>






