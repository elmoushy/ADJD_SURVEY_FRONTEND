// Survey topics ("مواضيع") API client.
//
// Mirrors the conventions of surveyService.ts: the shared apiClient, the trailing
// slash placed BEFORE the query string (so Django's APPEND_SLASH never issues a 301
// that would cost a round-trip and can drop the Authorization header), and the
// { status, message, data } envelope unwrapped in one place.

import type { AxiosResponse } from 'axios'
import { apiClient } from './jwtAuthService'
import type {
  PaginatedTopics,
  SurveyTopic,
  TopicAssignResult,
  TopicCreatePayload,
  TopicDetailResponse,
  TopicListFilters,
  TopicNodesResponse,
  TopicPalette,
  TopicTreeResponse,
  TopicUpdatePayload,
} from '../types/topic.types'

class TopicService {
  private baseURL = '/surveys/topics/'

  private buildQuery(filters?: Record<string, unknown>): string {
    if (!filters) return ''
    const params = new URLSearchParams()
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params.append(key, String(value))
      }
    })
    const query = params.toString()
    return query ? `?${query}` : ''
  }

  /** Unwrap `{status, message, data}`; tolerate a flat body. */
  private unwrap<T>(response: AxiosResponse<any>): T {
    const body = response.data
    if (body && typeof body === 'object' && 'data' in body) return body.data as T
    return body as T
  }

  private message(error: any, fallback: string): Error {
    const detail = error?.response?.data?.message || error?.response?.data?.detail
    return new Error(detail || error?.message || fallback)
  }

  // ── Read ──────────────────────────────────────────────────────────────────
  async listTopics(filters?: TopicListFilters): Promise<PaginatedTopics> {
    try {
      const response = await apiClient.get(`${this.baseURL}${this.buildQuery(filters as any)}`)
      const data = this.unwrap<any>(response)
      return {
        count: data?.count ?? 0,
        total_pages: data?.total_pages ?? 0,
        current_page: data?.current_page ?? 1,
        per_page: data?.per_page ?? 24,
        next: data?.next ?? null,
        previous: data?.previous ?? null,
        results: data?.results ?? [],
      }
    } catch (error: any) {
      throw this.message(error, 'Failed to load topics')
    }
  }

  async getTopic(topicId: string): Promise<TopicDetailResponse> {
    try {
      const response = await apiClient.get(`${this.baseURL}${topicId}/`)
      return this.unwrap<TopicDetailResponse>(response)
    } catch (error: any) {
      throw this.message(error, 'Failed to load topic')
    }
  }

  async getTree(includeArchived = false): Promise<TopicTreeResponse> {
    try {
      const query = this.buildQuery(includeArchived ? { include_archived: '1' } : undefined)
      const response = await apiClient.get(`${this.baseURL}tree/${query}`)
      return this.unwrap<TopicTreeResponse>(response)
    } catch (error: any) {
      throw this.message(error, 'Failed to load topic tree')
    }
  }

  /** Lazy expansion for the map: child topics + survey nodes of one topic. */
  async getTopicNodes(topicId: string): Promise<TopicNodesResponse> {
    try {
      const response = await apiClient.get(`${this.baseURL}${topicId}/nodes/`)
      return this.unwrap<TopicNodesResponse>(response)
    } catch (error: any) {
      throw this.message(error, 'Failed to load topic contents')
    }
  }

  async getPalette(): Promise<TopicPalette> {
    try {
      const response = await apiClient.get(`${this.baseURL}palette/`)
      return this.unwrap<TopicPalette>(response)
    } catch (error: any) {
      throw this.message(error, 'Failed to load topic palette')
    }
  }

  // ── Write ─────────────────────────────────────────────────────────────────
  async createTopic(payload: TopicCreatePayload): Promise<SurveyTopic> {
    try {
      const response = await apiClient.post(this.baseURL, payload)
      return this.unwrap<SurveyTopic>(response)
    } catch (error: any) {
      throw this.message(error, 'Failed to create topic')
    }
  }

  async updateTopic(topicId: string, payload: TopicUpdatePayload): Promise<SurveyTopic> {
    try {
      const response = await apiClient.patch(`${this.baseURL}${topicId}/`, payload)
      return this.unwrap<SurveyTopic>(response)
    } catch (error: any) {
      throw this.message(error, 'Failed to update topic')
    }
  }

  /** Soft delete (super admin only). Surveys are detached, never deleted. */
  async deleteTopic(topicId: string): Promise<{ detached_surveys: number; reparented_children: number }> {
    try {
      const response = await apiClient.delete(`${this.baseURL}${topicId}/`)
      return this.unwrap<{ detached_surveys: number; reparented_children: number }>(response)
    } catch (error: any) {
      throw this.message(error, 'Failed to delete topic')
    }
  }

  async archiveTopic(topicId: string, isArchived: boolean): Promise<{ id: string; is_archived: boolean }> {
    try {
      const response = await apiClient.post(`${this.baseURL}${topicId}/archive/`, {
        is_archived: isArchived,
      })
      return this.unwrap<{ id: string; is_archived: boolean }>(response)
    } catch (error: any) {
      throw this.message(error, 'Failed to archive topic')
    }
  }

  /** Bulk assign surveys to a topic. `topicId = null` clears the topic. */
  async assignSurveys(topicId: string | null, surveyIds: string[]): Promise<TopicAssignResult> {
    try {
      const response = await apiClient.post(`${this.baseURL}assign/`, {
        topic_id: topicId,
        survey_ids: surveyIds,
      })
      return this.unwrap<TopicAssignResult>(response)
    } catch (error: any) {
      throw this.message(error, 'Failed to move surveys')
    }
  }

  /** Remove surveys from a topic — they become ungrouped, never deleted. */
  async detachSurveys(topicId: string, surveyIds: string[]): Promise<TopicAssignResult> {
    try {
      const response = await apiClient.post(`${this.baseURL}${topicId}/detach/`, {
        survey_ids: surveyIds,
      })
      return this.unwrap<TopicAssignResult>(response)
    } catch (error: any) {
      throw this.message(error, 'Failed to remove surveys from topic')
    }
  }

  /**
   * Restore each survey to the topic it was in before an assign call.
   * Groups the previous_topics map by target topic so the undo is a few bulk calls,
   * not one call per survey.
   */
  async undoAssign(previousTopics: Record<string, string | null>): Promise<void> {
    const grouped = new Map<string | null, string[]>()
    Object.entries(previousTopics).forEach(([surveyId, topicId]) => {
      const bucket = grouped.get(topicId) || []
      bucket.push(surveyId)
      grouped.set(topicId, bucket)
    })
    for (const [topicId, surveyIds] of grouped.entries()) {
      await this.assignSurveys(topicId, surveyIds)
    }
  }
}

export const topicService = new TopicService()
export default topicService
