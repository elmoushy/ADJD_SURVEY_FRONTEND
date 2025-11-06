import { apiClient } from './jwtAuthService'
import type {
  EmailTemplate,
  EmailTemplateDetail,
  EmailTemplateListResponse,
  CreateEmailTemplateRequest,
  UpdateEmailTemplateRequest,
  EmailTemplateFilters
} from '../types/email-templates.types'

/**
 * Email Templates API Service
 * Handles all CRUD operations for email templates
 */

const BASE_URL = '/email/templates/'

export const emailTemplatesAPI = {
  /**
   * Get all email templates with optional filtering and pagination
   * @param filters - Filter parameters (is_active, category, search, ordering, page, page_size)
   * @returns Paginated list of email templates
   */
  getAllTemplates: async (filters?: EmailTemplateFilters): Promise<EmailTemplateListResponse> => {
    const params = new URLSearchParams()
    
    if (filters?.is_active !== undefined) {
      params.append('is_active', String(filters.is_active))
    }
    if (filters?.category) {
      params.append('category', filters.category)
    }
    if (filters?.search) {
      params.append('search', filters.search)
    }
    if (filters?.ordering) {
      params.append('ordering', filters.ordering)
    }
    if (filters?.page) {
      params.append('page', String(filters.page))
    }
    if (filters?.page_size) {
      params.append('page_size', String(filters.page_size))
    }
    
    const url = params.toString() ? `${BASE_URL}?${params}` : BASE_URL
    const response = await apiClient.get<EmailTemplateListResponse>(url)
    return response.data
  },

  /**
   * Get detailed information about a specific email template
   * @param id - Template ID
   * @returns Full template details including HTML content
   */
  getTemplateById: async (id: number): Promise<EmailTemplateDetail> => {
    const response = await apiClient.get<EmailTemplateDetail>(`${BASE_URL}${id}/`)
    return response.data
  },

  /**
   * Create a new email template
   * @param templateData - Template data to create
   * @returns Created template with all details
   */
  createTemplate: async (templateData: CreateEmailTemplateRequest): Promise<EmailTemplateDetail> => {
    const response = await apiClient.post<EmailTemplateDetail>(BASE_URL, templateData)
    return response.data
  },

  /**
   * Update an existing email template (full update)
   * @param id - Template ID
   * @param templateData - Complete template data
   * @returns Updated template with all details
   */
  updateTemplate: async (
    id: number,
    templateData: CreateEmailTemplateRequest
  ): Promise<EmailTemplateDetail> => {
    const response = await apiClient.put<EmailTemplateDetail>(
      `${BASE_URL}${id}/`,
      templateData
    )
    return response.data
  },

  /**
   * Partially update an email template
   * @param id - Template ID
   * @param updates - Partial template data to update
   * @returns Updated template with all details
   */
  patchTemplate: async (
    id: number,
    updates: UpdateEmailTemplateRequest
  ): Promise<EmailTemplateDetail> => {
    const response = await apiClient.patch<EmailTemplateDetail>(
      `${BASE_URL}${id}/`,
      updates
    )
    return response.data
  },

  /**
   * Toggle template active status (soft delete alternative)
   * @param id - Template ID
   * @param isActive - New active status
   * @returns Updated template
   */
  toggleTemplateStatus: async (id: number, isActive: boolean): Promise<EmailTemplateDetail> => {
    return emailTemplatesAPI.patchTemplate(id, { is_active: isActive })
  },

  /**
   * Delete an email template permanently (use with caution!)
   * @param id - Template ID
   * @returns void (204 No Content)
   */
  deleteTemplate: async (id: number): Promise<void> => {
    await apiClient.delete(`${BASE_URL}${id}/`)
  },

  /**
   * Search templates by name or subject
   * @param searchQuery - Search query
   * @returns Filtered list of templates
   */
  searchTemplates: async (searchQuery: string): Promise<EmailTemplate[]> => {
    const response = await emailTemplatesAPI.getAllTemplates({ search: searchQuery })
    return response.results
  },

  /**
   * Get templates by category
   * @param category - Template category
   * @returns Filtered list of templates
   */
  getTemplatesByCategory: async (
    category: EmailTemplateFilters['category']
  ): Promise<EmailTemplate[]> => {
    const response = await emailTemplatesAPI.getAllTemplates({ category })
    return response.results
  },

  /**
   * Get only active templates
   * @returns List of active templates
   */
  getActiveTemplates: async (): Promise<EmailTemplate[]> => {
    const response = await emailTemplatesAPI.getAllTemplates({ is_active: true })
    return response.results
  }
}
