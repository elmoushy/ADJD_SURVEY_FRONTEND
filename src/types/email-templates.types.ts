/**
 * Email Template Type Definitions
 * Supports bilingual email templates with HTML content
 */

export interface EmailTemplateUser {
  id: number
  email: string
  first_name: string
  last_name: string
}

export type TemplateCategory = 
  | 'GENERAL'
  | 'ANNOUNCEMENT'
  | 'NOTIFICATION'
  | 'REMINDER'
  | 'REPORT'
  | 'OTHER'

export interface EmailTemplate {
  id: number
  name: string
  name_ar?: string
  category: TemplateCategory
  is_active: boolean
  created_by: EmailTemplateUser
  created_at: string
  updated_at: string
}

export interface EmailTemplateDetail extends EmailTemplate {
  subject: string
  subject_ar?: string
  body_html: string
  body_html_ar?: string
  body_text?: string
}

export interface CreateEmailTemplateRequest {
  name: string
  name_ar?: string
  subject: string
  subject_ar?: string
  body_html: string
  body_html_ar?: string
  body_text?: string
  is_active?: boolean
  category: TemplateCategory
}

export interface UpdateEmailTemplateRequest extends Partial<CreateEmailTemplateRequest> {}

export interface EmailTemplateListResponse {
  count: number
  next: string | null
  previous: string | null
  results: EmailTemplate[]
}

export interface EmailTemplateFilters {
  is_active?: boolean
  category?: TemplateCategory | ''
  search?: string
  ordering?: string
  page?: number
  page_size?: number
}

export const TEMPLATE_CATEGORIES: { value: TemplateCategory; label: string; label_ar: string }[] = [
  { value: 'GENERAL', label: 'General', label_ar: 'عام' },
  { value: 'ANNOUNCEMENT', label: 'Announcement', label_ar: 'إعلان' },
  { value: 'NOTIFICATION', label: 'Notification', label_ar: 'إشعار' },
  { value: 'REMINDER', label: 'Reminder', label_ar: 'تذكير' },
  { value: 'REPORT', label: 'Report', label_ar: 'تقرير' },
  { value: 'OTHER', label: 'Other', label_ar: 'أخرى' }
]

export interface EmailTemplateError {
  name?: string[]
  name_ar?: string[]
  subject?: string[]
  subject_ar?: string[]
  body_html?: string[]
  body_html_ar?: string[]
  body_text?: string[]
  category?: string[]
  is_active?: string[]
  detail?: string
}
