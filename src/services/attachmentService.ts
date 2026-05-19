import { apiClient } from './jwtAuthService'

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
}

export interface AttachmentUploadResponse {
  attachment: AttachmentInfo
}

export interface AttachmentListResponse {
  attachments: AttachmentInfo[]
  count: number
}

// ─── Response Attachments ────────────────────────────────────────────────────

export const attachmentService = {
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
