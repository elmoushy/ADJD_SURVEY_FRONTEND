import { apiClient } from './jwtAuthService'

// ─── Types ───────────────────────────────────────────────────────────────────

/**
 * An email attachment as returned by the backend.
 * `_local` is a frontend-only flag: when true the attachment is "borrowed"
 * (e.g. carried from a template) and removing it should NOT call the delete API.
 */
export interface EmailAttachment {
  id: string
  original_filename: string
  file_size: number
  mime_type: string
  format_name: string
  description: string
  uploaded_by: number | null
  uploaded_by_name: string | null
  uploaded_at: string
  download_url: string
  _local?: boolean
}

// Allowed types / limits (kept in sync with the backend attachment_utils.py)
export const MAX_EMAIL_ATTACHMENT_SIZE_MB = 15
export const MAX_EMAIL_ATTACHMENTS = 10

export const ALLOWED_ATTACHMENT_EXTENSIONS = [
  '.pdf', '.doc', '.docx', '.xls', '.xlsx', '.csv'
]

// `accept` attribute value for the file input
export const ATTACHMENT_ACCEPT = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'text/csv',
  ...ALLOWED_ATTACHMENT_EXTENSIONS
].join(',')

// ─── Service ───────────────────────────────────────────────────────────────

const BASE = '/email/attachments'

export const emailAttachmentService = {
  /**
   * Upload a document attachment (PDF/CSV/Excel/Word, max 15MB).
   * Returns the created (orphan) attachment whose id is later associated
   * with a template/draft or sent with an email.
   */
  async upload(file: File, description = ''): Promise<EmailAttachment> {
    const formData = new FormData()
    formData.append('file', file)
    if (description) formData.append('description', description)

    const { data } = await apiClient.post<EmailAttachment>(
      `${BASE}/upload/`,
      formData,
      {
        headers: { 'Content-Type': 'multipart/form-data' },
        timeout: 300000 // 5 min — large files
      }
    )
    return data
  },

  /**
   * Delete an attachment by id.
   */
  async remove(id: string): Promise<void> {
    await apiClient.delete(`${BASE}/${id}/`)
  },

  /**
   * Download an attachment and trigger a browser save with the original name.
   */
  async download(attachment: EmailAttachment): Promise<void> {
    const { data } = await apiClient.get(`${BASE}/${attachment.id}/download/`, {
      responseType: 'blob'
    })
    const url = URL.createObjectURL(data)
    const link = document.createElement('a')
    link.href = url
    link.download = attachment.original_filename
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

/**
 * Human-readable file size (e.g. "1.4 MB").
 */
export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`
}

/**
 * Client-side validation mirroring the backend. Returns an Arabic error
 * message string, or null if the file is acceptable.
 */
export function validateAttachment(file: File): string | null {
  const maxBytes = MAX_EMAIL_ATTACHMENT_SIZE_MB * 1024 * 1024
  const dotIndex = file.name.lastIndexOf('.')
  const ext = dotIndex >= 0 ? file.name.slice(dotIndex).toLowerCase() : ''

  if (!ALLOWED_ATTACHMENT_EXTENSIONS.includes(ext)) {
    return `نوع الملف غير مسموح به. الأنواع المسموحة: PDF، Word، Excel، CSV`
  }
  if (file.size > maxBytes) {
    return `حجم الملف (${(file.size / 1024 / 1024).toFixed(2)} ميغابايت) يتجاوز الحد الأقصى (${MAX_EMAIL_ATTACHMENT_SIZE_MB} ميغابايت)`
  }
  return null
}
