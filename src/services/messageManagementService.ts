import { apiClient } from './jwtAuthService'
import type {
  UsersNamesEmailsResponse,
  CostCentersListResponse,
  CostCenter,
  CreateCostCenterRequest,
  UpdateCostCenterRequest,
  ApiError
} from '../types/message-management.types'

/**
 * Message Management API Service
 * Handles API calls for user and cost center management
 */
export const messageManagementAPI = {
  /**
   * Get all active users with their names and emails
   * No pagination - returns all active users
   */
  getAllUsers: async (): Promise<UsersNamesEmailsResponse> => {
    try {
      const response = await apiClient.get<UsersNamesEmailsResponse>('/auth/users/names-emails/')
      return response.data
    } catch (error: any) {
      console.error('Failed to fetch users:', error)
      throw error
    }
  },

  /**
   * Get all cost centers (no pagination)
   * @param params Optional query parameters for filtering and sorting
   */
  getAllCostCenters: async (params?: {
    is_active?: boolean
    search?: string
    ordering?: string
  }): Promise<CostCentersListResponse> => {
    try {
      const response = await apiClient.get<CostCentersListResponse>('/email/cost-centers/', {
        params
      })
      return response.data
    } catch (error: any) {
      console.error('Failed to fetch cost centers:', error)
      throw error
    }
  },

  /**
   * Get detailed information about a specific cost center
   * @param id Cost center ID
   */
  getCostCenterDetails: async (id: number): Promise<CostCenter> => {
    try {
      const response = await apiClient.get<CostCenter>(`/email/cost-centers/${id}/`)
      return response.data
    } catch (error: any) {
      console.error(`Failed to fetch cost center ${id}:`, error)
      throw error
    }
  },

  /**
   * Create a new cost center
   * @param data Cost center creation data
   */
  createCostCenter: async (data: CreateCostCenterRequest): Promise<CostCenter> => {
    try {
      const response = await apiClient.post<CostCenter>('/email/cost-centers/', data)
      return response.data
    } catch (error: any) {
      console.error('Failed to create cost center:', error)
      
      // Handle validation errors
      if (error.response?.status === 400) {
        throw error.response.data as ApiError
      }
      
      // Handle conflict (duplicate code)
      if (error.response?.status === 409) {
        throw {
          cost_center_code: ['رمز مركز التكلفة موجود بالفعل']
        } as ApiError
      }
      
      throw error
    }
  },

  /**
   * Update an existing cost center (full update)
   * @param id Cost center ID
   * @param data Full cost center data
   */
  updateCostCenter: async (id: number, data: CreateCostCenterRequest): Promise<CostCenter> => {
    try {
      const response = await apiClient.put<CostCenter>(`/email/cost-centers/${id}/`, data)
      return response.data
    } catch (error: any) {
      console.error(`Failed to update cost center ${id}:`, error)
      
      // Handle validation errors
      if (error.response?.status === 400) {
        throw error.response.data as ApiError
      }
      
      // Handle conflict (duplicate code)
      if (error.response?.status === 409) {
        throw {
          cost_center_code: ['رمز مركز التكلفة موجود بالفعل']
        } as ApiError
      }
      
      throw error
    }
  },

  /**
   * Partially update an existing cost center
   * @param id Cost center ID
   * @param data Partial cost center data
   */
  patchCostCenter: async (id: number, data: UpdateCostCenterRequest): Promise<CostCenter> => {
    try {
      const response = await apiClient.patch<CostCenter>(`/email/cost-centers/${id}/`, data)
      return response.data
    } catch (error: any) {
      console.error(`Failed to patch cost center ${id}:`, error)
      
      // Handle validation errors
      if (error.response?.status === 400) {
        throw error.response.data as ApiError
      }
      
      // Handle conflict (duplicate code)
      if (error.response?.status === 409) {
        throw {
          cost_center_code: ['رمز مركز التكلفة موجود بالفعل']
        } as ApiError
      }
      
      throw error
    }
  },

  /**
   * Delete a cost center (permanent operation)
   * @param id Cost center ID
   */
  deleteCostCenter: async (id: number): Promise<void> => {
    try {
      await apiClient.delete(`/email/cost-centers/${id}/`)
    } catch (error: any) {
      console.error(`Failed to delete cost center ${id}:`, error)
      throw error
    }
  },

  /**
   * Toggle cost center active status (soft delete alternative)
   * @param id Cost center ID
   * @param isActive New active status
   */
  toggleCostCenterStatus: async (id: number, isActive: boolean): Promise<CostCenter> => {
    return messageManagementAPI.patchCostCenter(id, { is_active: isActive })
  }
}
