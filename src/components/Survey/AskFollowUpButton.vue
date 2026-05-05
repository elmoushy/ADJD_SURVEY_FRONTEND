<script setup lang="ts">
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { followUpService } from '@/services/followUpService'
import type { FollowUpThread, FollowUpPreset } from '@/types/survey.types'

const props = defineProps<{ responseId: string }>()
const emit = defineEmits<{ opened: [thread: FollowUpThread] }>()

const { t } = useI18n()

const showModal = ref(false)
const message = ref('')
const selectedPreset = ref('')
const presets = ref<FollowUpPreset[]>([])
const loading = ref(false)
const error = ref('')

async function openModal() {
  showModal.value = true
  if (!presets.value.length) {
    presets.value = await followUpService.presets()
  }
}

function applyPreset(preset: FollowUpPreset) {
  message.value = preset.text
  selectedPreset.value = preset.key
}

async function send() {
  if (!message.value.trim()) return
  loading.value = true
  error.value = ''
  try {
    const thread = await followUpService.openOnResponse(props.responseId, message.value, selectedPreset.value || undefined)
    emit('opened', thread)
    showModal.value = false
    message.value = ''
    selectedPreset.value = ''
  } catch (e: any) {
    error.value = e?.message || t('followUp.error.generic')
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <button :class="$style.btn" @click="openModal">
    <i class="fas fa-comment-dots"></i>
    {{ t('followUp.askFollowUp') }}
  </button>

  <!-- Ask follow-up modal -->
  <Teleport to="body">
    <div v-if="showModal" :class="$style.overlay" @click.self="showModal = false">
      <div :class="$style.modal">
        <header :class="$style.header">
          <span>{{ t('followUp.askFollowUp') }}</span>
          <button @click="showModal = false"><i class="fas fa-times"></i></button>
        </header>

        <div :class="$style.body">
          <!-- Preset chips -->
          <div :class="$style.presets">
            <button
              v-for="p in presets"
              :key="p.key"
              :class="[$style.presetChip, selectedPreset === p.key && $style.active]"
              @click="applyPreset(p)"
            >
              {{ p.text }}
            </button>
          </div>

          <textarea
            v-model="message"
            :class="$style.textarea"
            :placeholder="t('followUp.replyPlaceholder')"
            rows="4"
          ></textarea>

          <p v-if="error" :class="$style.error">{{ error }}</p>
        </div>

        <footer :class="$style.footer">
          <button :class="$style.sendBtn" :disabled="loading || !message.trim()" @click="send">
            <i v-if="loading" class="fas fa-spinner fa-spin"></i>
            {{ t('followUp.askFollowUp') }}
          </button>
        </footer>
      </div>
    </div>
  </Teleport>
</template>

<style module>
.btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background: #f0f7ff;
  color: #1a6fa8;
  border: 1px solid #c5ddf0;
  border-radius: 8px;
  padding: 5px 12px;
  font-size: 12px;
  cursor: pointer;
  transition: background 0.15s;
}
.btn:hover { background: #daeeff; }

.overlay {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.4);
  z-index: 1100;
  display: flex;
  align-items: center;
  justify-content: center;
}

.modal {
  background: #fff;
  border-radius: 12px;
  width: min(480px, 92vw);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  box-shadow: 0 16px 40px rgba(0,0,0,0.18);
}

.header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  border-bottom: 1px solid #eee;
  font-weight: 600;
}
.header button {
  background: none;
  border: none;
  cursor: pointer;
  font-size: 16px;
  color: #666;
}

.body { padding: 16px 20px; display: flex; flex-direction: column; gap: 12px; }

.presets {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}
.presetChip {
  background: #f5f5f5;
  border: 1px solid #ddd;
  border-radius: 20px;
  padding: 4px 12px;
  font-size: 12px;
  cursor: pointer;
}
.presetChip.active {
  background: #e0f0ff;
  border-color: #1a6fa8;
  color: #1a6fa8;
}

.textarea {
  width: 100%;
  border: 1px solid #ddd;
  border-radius: 8px;
  padding: 10px 12px;
  font-size: 14px;
  resize: vertical;
  box-sizing: border-box;
}

.error { color: #ef4444; font-size: 13px; margin: 0; }

.footer {
  padding: 12px 20px;
  border-top: 1px solid #eee;
  display: flex;
  justify-content: flex-end;
}
.sendBtn {
  background: #1a6fa8;
  color: #fff;
  border: none;
  border-radius: 8px;
  padding: 8px 20px;
  font-size: 14px;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 6px;
}
.sendBtn:disabled { opacity: 0.6; cursor: not-allowed; }
</style>
