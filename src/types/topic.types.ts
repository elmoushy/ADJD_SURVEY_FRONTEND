// Survey Topic ("موضوع") types — folders that group related surveys.
// Mirrors surveys/serializers.py::SurveyTopicSerializer and views_topics.py.

export interface TopicBreadcrumbItem {
  id: string
  name: string
}

export interface SurveyTopic {
  id: string
  name: string
  description: string
  color: string
  icon: string

  // hierarchy
  parent: string | null
  parent_name: string | null
  breadcrumb: TopicBreadcrumbItem[]
  depth: number
  path: string

  // ordering / lifecycle
  is_pinned: boolean
  display_order: number
  is_archived: boolean

  created_by_email: string | null
  created_by_name: string | null
  created_at: string
  updated_at: string

  // counters (annotated server-side — never computed in the browser)
  children_count: number
  survey_count: number
  active_survey_count: number
  response_count: number
  total_survey_count: number
  total_response_count: number
}

/** Light node used by the tree + relationship map views. */
export interface TopicTreeNode {
  id: string
  name: string
  parent: string | null
  depth: number
  path: string
  color: string
  icon: string
  is_archived: boolean
  survey_count: number
  total_survey_count: number
  children_count: number
}

/** Light survey node rendered inside the relationship map. */
export interface TopicSurveyNode {
  id: string
  title: string
  status: string
  status_display: string
  is_active: boolean
  visibility: string
  topic: string | null
  response_count: number
}

export interface TopicKpis {
  total_surveys: number
  active_surveys: number
  draft_surveys: number
  total_responses: number
}

export interface TopicDetailResponse {
  topic: SurveyTopic
  children: SurveyTopic[]
  kpis: TopicKpis
}

export interface TopicTreeResponse {
  results: TopicTreeNode[]
  total: number
  truncated: boolean
  limit: number
  ungrouped_survey_count: number
}

export interface TopicNodesResponse {
  topic_id: string
  children: TopicTreeNode[]
  surveys: TopicSurveyNode[]
  survey_total: number
  truncated: boolean
}

export interface TopicAssignResult {
  topic_id: string | null
  topic_name: string | null
  assigned: number
  skipped: number
  errors: string[]
  /** survey id -> the topic it was in before this call (enables a real Undo) */
  previous_topics: Record<string, string | null>
}

export interface TopicPalette {
  colors: string[]
  icons: string[]
  max_depth: number
}

export type TopicSortOption =
  | 'name_asc'
  | 'name_desc'
  | 'newest'
  | 'oldest'
  | 'most_surveys'
  | 'most_responses'

export interface TopicListFilters {
  search?: string
  /** 'root' (default) | 'all' | <uuid> */
  parent?: string
  sort_by?: TopicSortOption
  /** '0' (default) | '1' | 'all' */
  is_archived?: string
  only_mine?: string
  page?: number
  per_page?: number
}

export interface PaginatedTopics {
  count: number
  total_pages: number
  current_page: number
  per_page: number
  next: string | null
  previous: string | null
  results: SurveyTopic[]
}

export interface TopicCreatePayload {
  name: string
  description?: string
  color?: string
  icon?: string
  parent?: string | null
  is_pinned?: boolean
  display_order?: number
}

export type TopicUpdatePayload = Partial<TopicCreatePayload>

// ── Assigned users (survey preview panel) ───────────────────────────────────
export type AssignedAudienceMode = 'public' | 'all_authenticated' | 'explicit'
export type AssignedUserSource = 'direct' | 'group' | 'all_authenticated'

export interface AssignedUser {
  id: number
  name: string
  email: string
  responded: boolean
  responded_at: string | null
  source: AssignedUserSource
}

export interface AssignedUserGroup {
  id: number
  name: string
  member_count: number
}

export interface AssignedUsersResponse {
  visibility: string
  mode: AssignedAudienceMode
  total_users: number
  responded_count: number
  pending_count: number
  groups: AssignedUserGroup[]
  results: AssignedUser[]
  count: number
  total_pages: number
  current_page: number
  per_page: number
}

export interface AssignedUsersFilters {
  search?: string
  /** named response_status (not status) so it cannot clash with the Survey filterset */
  response_status?: 'all' | 'responded' | 'pending'
  page?: number
  per_page?: number
}
