import { apiClient } from './jwtAuthService'
import type { SurveyAttachment } from '@/types/survey.types'

// ─── Types ───────────────────────────────────────────────────────────────────

export interface AttachmentInfo {
  id: string
  original_filename: string
  file_size: number
  mime_type: string
  format_name: string
  is_image: boolean
  description: string
  uploaded_by: number | null
  uploaded_by_name: string | null
  uploaded_at: string
  download_url: string
  can_delete?: boolean
}

export interface AttachmentUploadResponse {
  attachment: AttachmentInfo
}

export interface AttachmentListResponse {
  attachments: AttachmentInfo[]
  count: number
}

// Allowed types for the creator's survey reference files (documents,
// presentations and images — mirrors the backend whitelist)
export const SURVEY_ATTACHMENT_ACCEPT =
  '.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.jpg,.jpeg,.png,.gif'

export const SURVEY_ATTACHMENT_MIMES = new Set<string>([
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'image/jpeg',
  'image/png',
  'image/gif',
])

export const SURVEY_ATTACHMENT_EXTENSIONS = [
  'pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'jpg', 'jpeg', 'png', 'gif',
]

export const MAX_SURVEY_ATTACHMENTS = 5
export const MAX_ATTACHMENT_SIZE_MB = 10

// Built from the configured API base rather than the server-provided absolute
// URL, so the link is correct regardless of how the backend sees its own host.
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000/api/'

/**
 * Direct URL of a survey attachment. The download endpoint is open to
 * anonymous respondents, so this can be used as an href / window.open target
 * (images and PDFs are served inline, other formats download).
 */
export function getSurveyAttachmentUrl(attachmentId: string): string {
  const base = API_BASE_URL.endsWith('/') ? API_BASE_URL : `${API_BASE_URL}/`
  return `${base}surveys/survey-attachments/${attachmentId}/download/`
}

// ─── Response Attachments ────────────────────────────────────────────────────

export const attachmentService = {
  // ─── Survey Attachments (creator reference files) ──────────────────────────

  /**
   * Attach a reference file to a survey. Creator only.
   */
  async uploadSurveyAttachment(
    surveyId: string,
    file: File,
    description = ''
  ): Promise<SurveyAttachment> {
    const formData = new FormData()
    formData.append('file', file)
    if (description) formData.append('description', description)

    const { data } = await apiClient.post(
      `/surveys/surveys/${surveyId}/attachments/upload/`,
      formData,
      {
        headers: { 'Content-Type': 'multipart/form-data' },
        timeout: 300000, // 5 min
      }
    )
    return data?.data?.attachment ?? data?.attachment
  },

  /**
   * List a survey's reference attachments (readable by respondents too).
   */
  async listSurveyAttachments(surveyId: string): Promise<SurveyAttachment[]> {
    const { data } = await apiClient.get(`/surveys/surveys/${surveyId}/attachments/`)
    return data?.data?.attachments ?? data?.attachments ?? []
  },

  /**
   * Remove a reference attachment from a survey. Creator only.
   */
  async deleteSurveyAttachment(attachmentId: string): Promise<void> {
    await apiClient.delete(`/surveys/survey-attachments/${attachmentId}/`)
  },

  /**
   * Download a survey attachment to disk (forces attachment disposition).
   */
  async downloadSurveyAttachment(
    attachmentId: string,
    filename: string
  ): Promise<void> {
    const { data } = await apiClient.get(
      `/surveys/survey-attachments/${attachmentId}/download/?download=1`,
      { responseType: 'blob' }
    )
    const blobUrl = URL.createObjectURL(data)
    const link = document.createElement('a')
    link.href = blobUrl
    link.download = filename
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(blobUrl)
  },

  /**
   * Upload attachment to a survey response.
   */
  async uploadResponseAttachment(
    responseId: string,
    file: File,
    description = ''
  ): Promise<AttachmentInfo> {
    const formData = new FormData()
    formData.append('file', file)
    if (description) formData.append('description', description)

    const { data } = await apiClient.post(
      `/surveys/responses/${responseId}/attachments/upload/`,
      formData,
      {
        headers: { 'Content-Type': 'multipart/form-data' },
        timeout: 300000, // 5 min
      }
    )
    return data?.data?.attachment ?? data?.attachment
  },

  /**
   * List attachments for a survey response.
   */
  async listResponseAttachments(responseId: string): Promise<AttachmentInfo[]> {
    const { data } = await apiClient.get(
      `/surveys/responses/${responseId}/attachments/`
    )
    return data?.data?.attachments ?? data?.attachments ?? []
  },

  /**
   * Download a response attachment (returns blob URL for preview/download).
   */
  async downloadResponseAttachment(attachmentId: string): Promise<string> {
    const { data } = await apiClient.get(
      `/surveys/response-attachments/${attachmentId}/download/`,
      { responseType: 'blob' }
    )
    return URL.createObjectURL(data)
  },

  /**
   * Delete a response attachment.
   */
  async deleteResponseAttachment(attachmentId: string): Promise<void> {
    await apiClient.delete(`/surveys/response-attachments/${attachmentId}/`)
  },

  // ─── Follow-Up Message Attachments ──────────────────────────────────────────

  /**
   * Upload attachment to a follow-up message.
   */
  async uploadFollowUpAttachment(
    threadId: string,
    messageId: string,
    file: File,
    description = ''
  ): Promise<AttachmentInfo> {
    const formData = new FormData()
    formData.append('file', file)
    if (description) formData.append('description', description)

    const { data } = await apiClient.post(
      `/surveys/follow-ups/${threadId}/messages/${messageId}/attachments/upload/`,
      formData,
      {
        headers: { 'Content-Type': 'multipart/form-data' },
        timeout: 300000,
      }
    )
    return data?.data?.attachment ?? data?.attachment
  },

  /**
   * Download a follow-up message attachment (returns blob URL).
   */
  async downloadFollowUpAttachment(attachmentId: string): Promise<string> {
    const { data } = await apiClient.get(
      `/surveys/follow-up-attachments/${attachmentId}/download/`,
      { responseType: 'blob' }
    )
    return URL.createObjectURL(data)
  },

  /**
   * Delete a follow-up message attachment.
   */
  async deleteFollowUpAttachment(attachmentId: string): Promise<void> {
    await apiClient.delete(`/surveys/follow-up-attachments/${attachmentId}/`)
  },
}
