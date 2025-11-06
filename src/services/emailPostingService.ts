/**
 * Email Posting Service
 * Handles sending emails, managing drafts, and loading form data
 */

import { apiClient } from './jwtAuthService'
import type {
  SendEmailRequest,
  SendEmailResponse,
  SendDraftRequest,
  CostCentersResponse,
  TemplatesResponse,
  EmailTemplateDetail,
  SaveDraftRequest,
  UpdateDraftRequest,
  DraftResponse
} from '@/types/email-posting.types'

const EMAIL_API_BASE = '/email'

/**
 * Email Posting API Service
 */
export const emailPostingAPI = {
  /**
   * Send email immediately
   * POST /api/email/send/
   */
  sendEmail: async (data: SendEmailRequest): Promise<SendEmailResponse> => {
    const response = await apiClient.post<SendEmailResponse>(`${EMAIL_API_BASE}/send/`, data)
    return response.data
  },

  /**
   * Send email from draft
   * POST /api/email/send-draft/{draft_id}/
   */
  sendDraft: async (draftId: number, overrides?: SendDraftRequest): Promise<SendEmailResponse> => {
    const response = await apiClient.post<SendEmailResponse>(
      `${EMAIL_API_BASE}/send-draft/${draftId}/`,
      overrides || {}
    )
    return response.data
  },

  /**
   * Get cost centers for recipient selection
   * GET /api/email/cost-centers/
   */
  getCostCenters: async (params?: {
    is_active?: boolean
    search?: string
    ordering?: string
  }): Promise<CostCentersResponse> => {
    const response = await apiClient.get<CostCentersResponse>(
      `${EMAIL_API_BASE}/cost-centers/`,
      { params }
    )
    return response.data
  },

  /**
   * Get email templates for form dropdown
   * GET /api/email/templates/
   */
  getTemplates: async (params?: {
    is_active?: boolean
    category?: string
    search?: string
    ordering?: string
  }): Promise<TemplatesResponse> => {
    const response = await apiClient.get<TemplatesResponse>(
      `${EMAIL_API_BASE}/templates/`,
      { params }
    )
    return response.data
  },

  /**
   * Get specific template details (full content)
   * GET /api/email/templates/{id}/
   */
  getTemplateById: async (id: number): Promise<EmailTemplateDetail> => {
    const response = await apiClient.get<EmailTemplateDetail>(
      `${EMAIL_API_BASE}/templates/${id}/`
    )
    return response.data
  },

  /**
   * Save email as draft
   * POST /api/email/drafts/
   */
  saveDraft: async (data: SaveDraftRequest): Promise<DraftResponse> => {
    const response = await apiClient.post<DraftResponse>(`${EMAIL_API_BASE}/drafts/`, data)
    return response.data
  },

  /**
   * Update existing draft
   * PATCH /api/email/drafts/{id}/
   */
  updateDraft: async (id: number, data: UpdateDraftRequest): Promise<DraftResponse> => {
    const response = await apiClient.patch<DraftResponse>(
      `${EMAIL_API_BASE}/drafts/${id}/`,
      data
    )
    return response.data
  },

  /**
   * Get draft details
   * GET /api/email/drafts/{id}/
   */
  getDraftById: async (id: number): Promise<DraftResponse> => {
    const response = await apiClient.get<DraftResponse>(`${EMAIL_API_BASE}/drafts/${id}/`)
    return response.data
  },

  /**
   * Delete draft
   * DELETE /api/email/drafts/{id}/
   */
  deleteDraft: async (id: number): Promise<void> => {
    await apiClient.delete(`${EMAIL_API_BASE}/drafts/${id}/`)
  }
}
