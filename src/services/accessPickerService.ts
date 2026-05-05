import { apiClient } from './jwtAuthService'
import type { SharedAudience } from '@/types/survey.types'

export const accessPickerService = {
  async search(q: string): Promise<SharedAudience> {
    const { data } = await apiClient.get(`/surveys/access-picker/search/?q=${encodeURIComponent(q)}`)
    return data?.data ?? data ?? { users: [], groups: [] }
  },
}
