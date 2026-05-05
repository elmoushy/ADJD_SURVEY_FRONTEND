import { apiClient } from './jwtAuthService'
import type { FollowUpThread, FollowUpMessage, FollowUpPreset } from '@/types/survey.types'

const BASE = '/surveys/follow-ups'

export const followUpService = {
  async list(params?: { status?: string[] }): Promise<FollowUpThread[]> {
    const query = params?.status?.map(s => `status=${s}`).join('&') ?? ''
    const { data } = await apiClient.get(`${BASE}/${query ? `?${query}` : ''}`)
    return data?.data?.results ?? data?.results ?? []
  },

  async get(id: string): Promise<FollowUpThread> {
    const { data } = await apiClient.get(`${BASE}/${id}/`)
    return data?.data ?? data
  },

  async openOnResponse(responseId: string, message: string, presetKey?: string): Promise<FollowUpThread> {
    const { data } = await apiClient.post(`${BASE}/open-on-response/${responseId}/`, {
      initial_message: message,
      preset_key: presetKey ?? '',
    })
    return data?.data ?? data
  },

  async sendMessage(threadId: string, body: string): Promise<FollowUpMessage> {
    const { data } = await apiClient.post(`${BASE}/${threadId}/messages/`, { body })
    return data?.data ?? data
  },

  async decide(threadId: string, decision: 'accepted' | 'rejected', reason: string): Promise<FollowUpThread> {
    const { data } = await apiClient.post(`${BASE}/${threadId}/decision/`, { decision, reason })
    return data?.data ?? data
  },

  async markRead(threadId: string): Promise<void> {
    await apiClient.post(`${BASE}/${threadId}/mark-read/`)
  },

  async presets(lang = 'ar'): Promise<FollowUpPreset[]> {
    const { data } = await apiClient.get(`${BASE}/presets/?lang=${lang}`)
    return data?.data ?? data ?? []
  },
}
