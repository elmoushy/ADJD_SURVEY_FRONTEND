/**
 * Email Retrieval Service
 * Handles retrieving emails from inbox, outbox, drafts, and transactions log
 */

import { apiClient } from './jwtAuthService'
import type {
  InboxResponse,
  InboxItemDetail,
  OutboxResponse,
  DraftsResponse,
  DraftDetail,
  TransactionsResponse,
  MarkReadResponse,
  ToggleStarResponse,
  ToggleArchiveResponse,
  InboxFilters,
  OutboxFilters,
  DraftsFilters,
  TransactionsFilters
} from '@/types/email-retrieval.types.ts'

const EMAIL_API_BASE = '/email'

/**
 * Email Retrieval API Service
 */
export const emailRetrievalAPI = {
  /**
   * Get inbox emails (received emails)
   * GET /api/email/inbox/
   */
  getInbox: async (params?: InboxFilters): Promise<InboxResponse> => {
    const response = await apiClient.get<InboxResponse>(`${EMAIL_API_BASE}/inbox/`, { params })
    return response.data
  },

  /**
   * Get inbox email detail
   * GET /api/email/inbox/{id}/
   * ⚠️ Automatically marks email as read
   */
  getInboxDetail: async (id: number): Promise<InboxItemDetail> => {
    const response = await apiClient.get<InboxItemDetail>(`${EMAIL_API_BASE}/inbox/${id}/`)
    return response.data
  },

  /**
   * Mark email as read
   * POST /api/email/inbox/{id}/mark-read/
   */
  markAsRead: async (id: number): Promise<MarkReadResponse> => {
    const response = await apiClient.post<MarkReadResponse>(
      `${EMAIL_API_BASE}/inbox/${id}/mark-read/`
    )
    return response.data
  },

  /**
   * Toggle star status
   * POST /api/email/inbox/{id}/star/
   */
  toggleStar: async (id: number): Promise<ToggleStarResponse> => {
    const response = await apiClient.post<ToggleStarResponse>(
      `${EMAIL_API_BASE}/inbox/${id}/star/`
    )
    return response.data
  },

  /**
   * Toggle archive status
   * POST /api/email/inbox/{id}/archive/
   */
  toggleArchive: async (id: number): Promise<ToggleArchiveResponse> => {
    const response = await apiClient.post<ToggleArchiveResponse>(
      `${EMAIL_API_BASE}/inbox/${id}/archive/`
    )
    return response.data
  },

  /**
   * Get outbox emails (sent emails)
   * GET /api/email/outbox/
   */
  getOutbox: async (params?: OutboxFilters): Promise<OutboxResponse> => {
    const response = await apiClient.get<OutboxResponse>(`${EMAIL_API_BASE}/outbox/`, { params })
    return response.data
  },

  /**
   * Get outbox email detail
   * GET /api/email/outbox/{id}/
   */
  getOutboxDetail: async (id: number): Promise<import('@/types/email-retrieval.types').EmailLog> => {
    const response = await apiClient.get<import('@/types/email-retrieval.types').EmailLog>(`${EMAIL_API_BASE}/outbox/${id}/`)
    return response.data
  },

  /**
   * Get drafts list
   * GET /api/email/drafts/
   */
  getDrafts: async (params?: DraftsFilters): Promise<DraftsResponse> => {
    const response = await apiClient.get<DraftsResponse>(`${EMAIL_API_BASE}/drafts/`, { params })
    return response.data
  },

  /**
   * Get draft detail
   * GET /api/email/drafts/{id}/
   */
  getDraftDetail: async (id: number): Promise<DraftDetail> => {
    const response = await apiClient.get<DraftDetail>(`${EMAIL_API_BASE}/drafts/${id}/`)
    return response.data
  },

  /**
   * Delete draft
   * DELETE /api/email/drafts/{id}/
   */
  deleteDraft: async (id: number): Promise<void> => {
    await apiClient.delete(`${EMAIL_API_BASE}/drafts/${id}/`)
  },

  /**
   * Get transactions log (all email activity)
   * GET /api/email/transactions/
   * Admins see all transactions, regular users see only their own
   */
  getTransactions: async (params?: TransactionsFilters): Promise<TransactionsResponse> => {
    const response = await apiClient.get<TransactionsResponse>(
      `${EMAIL_API_BASE}/transactions/`,
      { params }
    )
    return response.data
  }
}
