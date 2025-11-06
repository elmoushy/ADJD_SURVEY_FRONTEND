/**
 * Email Posting Types
 * Types for sending emails and managing email composition
 */

// Send Types
export type SendType = 'ANNOUNCEMENT' | 'SPECIFIC'

// Email Status
export type EmailStatus = 'SUCCESS' | 'FAILED' | 'PENDING'

// Email Types
export type EmailType = 'SENT' | 'DRAFT' | 'INBOX' | 'OUTBOX'

/**
 * Cost Center - Organizational unit with email recipients
 */
export interface CostCenter {
  id: number
  cost_center_code: string
  cost_center_name: string
  cost_center_name_ar: string
  is_active: boolean
  email_count: number
  recipient_count: number
  cc_count: number
  created_at: string
}

/**
 * Cost Centers List Response
 */
export interface CostCentersResponse {
  count: number
  next: string | null
  previous: string | null
  results: CostCenter[]
}

/**
 * Recipient Info - Details about email recipients per cost center
 */
export interface RecipientInfo {
  cost_center_id: number
  cost_center_code: string
  recipient_emails: string[]
  cc_emails: string[]
}

/**
 * Email Log - Record of sent email
 */
export interface EmailLog {
  id: number
  email_type: EmailType
  subject: string
  email_status: EmailStatus
  sent_at: string
}

/**
 * Send Email Request
 */
export interface SendEmailRequest {
  send_type: SendType
  subject: string
  body_html: string
  cost_center_ids?: number[]
  template_id?: number | null
}

/**
 * Email Detail in Send Response
 */
export interface EmailSendDetail {
  success: boolean
  cost_center: string
  recipients_count: number
  log_id: number
}

/**
 * Send Email Response
 */
export interface SendEmailResponse {
  success: boolean
  sent_count: number
  failed_count: number
  total_cost_centers: number
  details: EmailSendDetail[]
  sent_log_id: number
}

/**
 * Send Draft Request (overrides)
 */
export interface SendDraftRequest {
  subject?: string
  body_html?: string
}

/**
 * Email Template (simplified for dropdown)
 */
export interface EmailTemplateOption {
  id: number
  name: string
  name_ar: string
  category: string
  is_active: boolean
  created_at: string
  updated_at: string
}

/**
 * Email Template Details (full content)
 */
export interface EmailTemplateDetail {
  id: number
  name: string
  name_ar: string
  subject: string
  subject_ar: string | null
  body_html: string
  body_html_ar: string | null
  body_text: string | null
  is_active: boolean
  category: string
  created_by: {
    id: number
    email: string
    first_name: string
    last_name: string
  }
  created_at: string
  updated_at: string
}

/**
 * Templates List Response
 */
export interface TemplatesResponse {
  count: number
  next: string | null
  previous: string | null
  results: EmailTemplateOption[]
}

/**
 * Email Posting Error
 */
export interface EmailPostingError {
  send_type?: string[]
  subject?: string[]
  body_html?: string[]
  cost_center_ids?: string[]
  template_id?: string[]
  detail?: string
  message?: string
  errors?: string[]
}

/**
 * Email Compose Form Data
 */
export interface EmailComposeFormData {
  send_type: SendType
  cost_center_ids: number[]
  template_id: number | null
  subject: string
  body_html: string
}

/**
 * Draft Save Request
 */
export interface SaveDraftRequest {
  send_type: SendType
  subject: string
  body_html: string
  cost_center_ids?: number[]
  draft_name?: string
  template_id?: number | null
}

/**
 * Draft Response
 */
export interface DraftResponse {
  id: number
  send_type: SendType
  subject: string
  body_html: string
  cost_center_ids: number[] | null
  draft_name: string | null
  template: any | null
  template_id: number | null
  created_at: string
  updated_at: string
}

/**
 * Update Draft Request
 */
export interface UpdateDraftRequest {
  send_type?: SendType
  subject?: string
  body_html?: string
  cost_center_ids?: number[]
  draft_name?: string
  template_id?: number | null
}
