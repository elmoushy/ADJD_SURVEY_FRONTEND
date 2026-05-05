<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useFollowUpsStore } from '@/stores/followUps'
import { useSimpleAuth } from '@/composables/useSimpleAuth'
import FollowUpThread from './FollowUpThread.vue'
import FollowUpStatusBadge from './FollowUpStatusBadge.vue'

const props = defineProps<{
  responseId: string | null
  open: boolean
}>()

const emit = defineEmits<{ close: [] }>()

const { t } = useI18n()
const store = useFollowUpsStore()
const { user } = useSimpleAuth()

const isAdmin = computed(() => {
  const role = user.value?.role
  return role === 'admin' || role === 'manager' || role === 'super_admin'
})

const thread = computed(() => {
  if (!props.responseId) return null
  return Object.values(store.threadsById).find(
    (t) => t.response_id === props.responseId
  ) ?? null
})

watch(() => props.open, async (open) => {
  if (open && props.responseId && !thread.value) {
    await store.loadInbox()
  }
})
</script>

<template>
  <Teleport to="body">
    <Transition name="drawer">
      <div v-if="open" :class="$style.overlay" @click.self="$emit('close')">
        <aside :class="$style.drawer">
          <header :class="$style.header">
            <div :class="$style.headerLeft">
              <span :class="$style.title">{{ t('followUp.askFollowUp') }}</span>
              <FollowUpStatusBadge v-if="thread" :status="thread.status" />
            </div>
            <button @click="$emit('close')"><i class="fas fa-times"></i></button>
          </header>

          <div :class="$style.body">
            <FollowUpThread
              v-if="thread"
              :thread="thread"
              :is-admin="isAdmin"
            />
            <p v-else :class="$style.empty">{{ t('followUp.status.pending_reply') }}</p>
          </div>
        </aside>
      </div>
    </Transition>
  </Teleport>
</template>

<style module>
.overlay {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.35);
  z-index: 1000;
  display: flex;
  justify-content: flex-end;
}

.drawer {
  background: #fff;
  width: min(480px, 92vw);
  height: 100%;
  overflow-y: auto;
  box-shadow: -4px 0 24px rgba(0,0,0,0.15);
  display: flex;
  flex-direction: column;
}

.header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  border-bottom: 1px solid #eee;
  gap: 12px;
}

.headerLeft { display: flex; align-items: center; gap: 10px; }
.title { font-weight: 600; font-size: 15px; }

.header button { background: none; border: none; cursor: pointer; font-size: 18px; color: #666; }

.body { padding: 20px; flex: 1; overflow-y: auto; }
.empty { color: #888; text-align: center; margin-top: 40px; }
</style>

<style>
.drawer-enter-active, .drawer-leave-active { transition: transform 0.25s ease; }
.drawer-enter-from, .drawer-leave-to { transform: translateX(100%); }
</style>
