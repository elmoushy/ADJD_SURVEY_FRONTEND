/**
 * Email Retrieval Types
 * Types for retrieving emails from inbox, outbox, drafts, and transactions
 */

import type { CostCenter, EmailTemplateOption } from './email-posting.types'

// Email Status
export type EmailStatus = 'SUCCESS' | 'FAILED' | 'PENDING'

// Send Types
export type SendType = 'ANNOUNCEMENT' | 'SPECIFIC'

// Email Types
export type EmailType = 'SENT' | 'RECEIVED'

/**
 * User Info
 */
export interface UserInfo {
  id: number
  email: string
  first_name: string
  last_name: string
}

/**
 * Email Log (from Outbox/Transactions)
 */
export interface EmailLog {
  id: number
  user: UserInfo
  cost_center: CostCenter | null
  template?: EmailTemplateOption | null
  send_type: SendType
  email_type: EmailType
  subject: string
  body_html?: string
  recipient_emails?: string[]
  cc_emails?: string[]
  email_status: EmailStatus
  email_error?: string | null
  recipient_count: number
  sent_at: string
  metadata?: {
    sent_from_draft?: boolean
    draft_id?: number | null
    retry_count?: number
    ip_address?: string
    user_agent?: string
    custom_fields?: Record<string, any>
    [key: string]: any
  }
}

/**
 * Inbox Item (received email)
 */
export interface InboxItem {
  id: number
  email: EmailLog
  sender: UserInfo
  is_to: boolean // true if in TO field, false if CC
  is_read: boolean
  read_at: string | null
  is_starred: boolean
  is_archived: boolean
}

/**
 * Inbox Item Detail (with full content)
 */
export interface InboxItemDetail extends InboxItem {
  email: EmailLog & {
    body_html: string
    recipient_emails: string[]
    cc_emails: string[]
  }
}

/**
 * Inbox Response (paginated)
 */
export interface InboxResponse {
  count: number
  page: number
  page_size: number
  results: InboxItem[]
}

/**
 * Inbox Filters
 */
export interface InboxFilters {
  page?: number
  page_size?: number
  is_read?: boolean
  is_starred?: boolean
  search?: string
}

/**
 * Outbox Response (paginated)
 */
export interface OutboxResponse {
  count: number
  page: number
  page_size: number
  results: EmailLog[]
}

/**
 * Outbox Filters
 */
export interface OutboxFilters {
  page?: number
  page_size?: number
  email_status?: EmailStatus
  send_type?: SendType
  search?: string
}

/**
 * Draft Item
 */
export interface DraftItem {
  id: number
  send_type: SendType
  subject: string
  draft_name: string | null
  template: number | null
  created_at: string
  updated_at: string
}

/**
 * Draft Detail (full content)
 */
export interface DraftDetail {
  id: number
  send_type: SendType
  subject: string
  body_html: string
  cost_center_ids: number[] | null
  draft_name: string | null
  template: EmailTemplateOption | null
  template_id: number | null
  created_at: string
  updated_at: string
}

/**
 * Drafts Response (paginated)
 */
export interface DraftsResponse {
  count: number
  next: string | null
  previous: string | null
  results: DraftItem[]
}

/**
 * Drafts Filters
 */
export interface DraftsFilters {
  page?: number
  page_size?: number
  send_type?: SendType
  search?: string
}

/**
 * Transactions Response (paginated)
 */
export interface TransactionsResponse {
  count: number
  page: number
  page_size: number
  results: EmailLog[]
}

/**
 * Transactions Filters
 */
export interface TransactionsFilters {
  page?: number
  page_size?: number
  email_status?: EmailStatus
  email_type?: EmailType
  send_type?: SendType
  cost_center_id?: number
  search?: string
}

/**
 * Mark as Read Response
 */
export interface MarkReadResponse {
  success: boolean
  message: string
}

/**
 * Toggle Star Response
 */
export interface ToggleStarResponse {
  success: boolean
  is_starred: boolean
}

/**
 * Toggle Archive Response
 */
export interface ToggleArchiveResponse {
  success: boolean
  is_archived: boolean
}
