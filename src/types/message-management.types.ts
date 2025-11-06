// Message Management Types
export interface UserNameEmail {
  id: number
  full_name: string
  email: string
}

export interface UsersNamesEmailsResponse {
  users: UserNameEmail[]
  count: number
}

export interface CostCenterEmail {
  id: number
  email: string
  email_type: 'recipient' | 'cc'
  display_name: string | null
  is_active: boolean
}

export interface CostCenterCreatedBy {
  id: number
  email: string
  first_name: string
  last_name: string
}

export interface CostCenter {
  id: number
  cost_center_code: string
  cost_center_name: string
  cost_center_name_ar: string
  description?: string
  description_ar?: string
  is_active: boolean
  emails: CostCenterEmail[]
  recipients: string[]
  ccs: string[]
  created_by: CostCenterCreatedBy
  created_at: string
  updated_at: string
}

export interface CostCenterListItem {
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

export interface CostCentersListResponse {
  count: number
  next: string | null
  previous: string | null
  results: CostCenterListItem[]
}

export interface CreateCostCenterRequest {
  cost_center_code: string
  cost_center_name: string
  cost_center_name_ar?: string
  description?: string
  description_ar?: string
  is_active?: boolean
  recipient_emails?: string[]
  cc_emails?: string[]
}

export interface UpdateCostCenterRequest {
  cost_center_code?: string
  cost_center_name?: string
  cost_center_name_ar?: string
  description?: string
  description_ar?: string
  is_active?: boolean
  recipient_emails?: string[]
  cc_emails?: string[]
}

export interface ApiError {
  detail?: string
  [key: string]: string[] | string | undefined
}
