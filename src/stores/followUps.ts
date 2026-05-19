import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { followUpService } from '@/services/followUpService'
import type { FollowUpThread, FollowUpMessage, FollowUpPreset } from '@/types/survey.types'

export const useFollowUpsStore = defineStore('followUps', () => {
  const threadsById = ref<Record<string, FollowUpThread>>({})
  const inboxIds = ref<string[]>([])
  const presets = ref<FollowUpPreset[]>([])

  const inboxThreads = computed(() =>
    inboxIds.value.map(id => threadsById.value[id]).filter(Boolean)
  )

  const unreadCount = computed(() =>
    inboxThreads.value.filter(t => t.status === 'pending_reply').length
  )

  async function loadInbox() {
    const data = await followUpService.list()
    data.forEach(t => { threadsById.value[t.id] = t })
    inboxIds.value = data.map(t => t.id)
  }

  async function loadThread(id: string) {
    const thread = await followUpService.get(id)
    threadsById.value[id] = thread
    if (!inboxIds.value.includes(id)) inboxIds.value.push(id)
  }

  async function openOnResponse(responseId: string, body: string, presetKey?: string) {
    const thread = await followUpService.openOnResponse(responseId, body, presetKey)
    threadsById.value[thread.id] = thread
    if (!inboxIds.value.includes(thread.id)) inboxIds.value.unshift(thread.id)
    return thread
  }

  async function sendMessage(threadId: string, body: string) {
    // Optimistic update
    const tempId = `temp-${Date.now()}`
    const tempMsg: FollowUpMessage = {
      id: tempId,
      sender_email: null,
      sender_role: 'responder',
      body,
      is_preset: false,
      preset_key: '',
      created_at: new Date().toISOString(),
      read_at: null,
    }
    if (threadsById.value[threadId]) {
      threadsById.value[threadId].messages.push(tempMsg)
    }
    try {
      const msg = await followUpService.sendMessage(threadId, body)
      const thread = threadsById.value[threadId]
      if (thread) {
        const idx = thread.messages.findIndex(m => m.id === tempId)
        if (idx !== -1) thread.messages[idx] = msg
        // Refresh thread status
        await loadThread(threadId)
      }
      return msg
    } catch (e) {
      // Rollback optimistic update
      const thread = threadsById.value[threadId]
      if (thread) {
        thread.messages = thread.messages.filter(m => m.id !== tempId)
      }
      throw e
    }
  }

  async function decide(threadId: string, decision: 'accepted' | 'rejected', reason: string) {
    const updated = await followUpService.decide(threadId, decision, reason)
    threadsById.value[threadId] = updated
  }

  async function markRead(threadId: string) {
    await followUpService.markRead(threadId)
  }

  async function loadPresets() {
    if (presets.value.length) return
    presets.value = await followUpService.presets()
  }

  return {
    threadsById,
    inboxIds,
    presets,
    inboxThreads,
    unreadCount,
    loadInbox,
    loadThread,
    openOnResponse,
    sendMessage,
    decide,
    markRead,
    loadPresets,
  }
})
