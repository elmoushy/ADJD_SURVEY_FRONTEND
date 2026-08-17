// Survey topics store.
//
// Caches the two payloads that are read repeatedly and change rarely — the topic
// forest (tree/map views, pickers) and the colour/icon palette — behind a short TTL.
// Paginated card lists are deliberately NOT cached: they are server-filtered and
// must always reflect the current query.

import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { topicService } from '@/services/topicService'
import type {
  PaginatedTopics,
  SurveyTopic,
  TopicAssignResult,
  TopicCreatePayload,
  TopicListFilters,
  TopicPalette,
  TopicTreeNode,
  TopicUpdatePayload,
} from '@/types/topic.types'

const TREE_TTL_MS = 60_000

export const useTopicsStore = defineStore('surveyTopics', () => {
  // ── State ────────────────────────────────────────────────────────────────
  const topicsById = ref<Record<string, SurveyTopic>>({})
  const tree = ref<TopicTreeNode[]>([])
  const treeTotal = ref(0)
  const treeTruncated = ref(false)
  const ungroupedCount = ref(0)
  const palette = ref<TopicPalette | null>(null)

  const treeFetchedAt = ref(0)
  const loadingTree = ref(false)
  const error = ref<string | null>(null)

  // ── Derived ──────────────────────────────────────────────────────────────
  const rootNodes = computed(() => tree.value.filter(node => !node.parent))

  const childrenOf = computed(() => {
    const map = new Map<string, TopicTreeNode[]>()
    tree.value.forEach(node => {
      if (!node.parent) return
      const bucket = map.get(node.parent) || []
      bucket.push(node)
      map.set(node.parent, bucket)
    })
    return map
  })

  const topicName = (topicId?: string | null): string | null =>
    topicId ? topicsById.value[topicId]?.name ?? tree.value.find(n => n.id === topicId)?.name ?? null : null

  // ── Actions ──────────────────────────────────────────────────────────────
  function cache(topics: SurveyTopic[]) {
    topics.forEach(topic => {
      topicsById.value[topic.id] = topic
    })
  }

  async function fetchTopics(filters?: TopicListFilters): Promise<PaginatedTopics> {
    error.value = null
    try {
      const page = await topicService.listTopics(filters)
      cache(page.results)
      return page
    } catch (e: any) {
      error.value = e?.message || 'Failed to load topics'
      throw e
    }
  }

  async function fetchTree(force = false) {
    const fresh = Date.now() - treeFetchedAt.value < TREE_TTL_MS
    if (!force && fresh && tree.value.length) return tree.value
    if (loadingTree.value) return tree.value

    loadingTree.value = true
    try {
      const data = await topicService.getTree()
      tree.value = data.results
      treeTotal.value = data.total
      treeTruncated.value = data.truncated
      ungroupedCount.value = data.ungrouped_survey_count
      treeFetchedAt.value = Date.now()
      return tree.value
    } catch (e: any) {
      error.value = e?.message || 'Failed to load topic tree'
      throw e
    } finally {
      loadingTree.value = false
    }
  }

  async function fetchPalette() {
    if (palette.value) return palette.value
    palette.value = await topicService.getPalette()
    return palette.value
  }

  async function fetchTopic(topicId: string) {
    const detail = await topicService.getTopic(topicId)
    cache([detail.topic, ...detail.children])
    return detail
  }

  async function createTopic(payload: TopicCreatePayload) {
    const topic = await topicService.createTopic(payload)
    cache([topic])
    invalidate()
    return topic
  }

  async function updateTopic(topicId: string, payload: TopicUpdatePayload) {
    const topic = await topicService.updateTopic(topicId, payload)
    cache([topic])
    invalidate()
    return topic
  }

  async function archiveTopic(topicId: string, isArchived: boolean) {
    const result = await topicService.archiveTopic(topicId, isArchived)
    const cached = topicsById.value[topicId]
    if (cached) cached.is_archived = result.is_archived
    invalidate()
    return result
  }

  async function deleteTopic(topicId: string) {
    const result = await topicService.deleteTopic(topicId)
    delete topicsById.value[topicId]
    invalidate()
    return result
  }

  async function assignSurveys(topicId: string | null, surveyIds: string[]): Promise<TopicAssignResult> {
    const result = await topicService.assignSurveys(topicId, surveyIds)
    invalidate()
    return result
  }

  async function detachSurveys(topicId: string, surveyIds: string[]): Promise<TopicAssignResult> {
    const result = await topicService.detachSurveys(topicId, surveyIds)
    invalidate()
    return result
  }

  async function undoAssign(previousTopics: Record<string, string | null>) {
    await topicService.undoAssign(previousTopics)
    invalidate()
  }

  /** Drop the cached forest so the next read refetches (counters changed). */
  function invalidate() {
    treeFetchedAt.value = 0
  }

  return {
    // state
    topicsById,
    tree,
    treeTotal,
    treeTruncated,
    ungroupedCount,
    palette,
    loadingTree,
    error,
    // derived
    rootNodes,
    childrenOf,
    topicName,
    // actions
    fetchTopics,
    fetchTree,
    fetchPalette,
    fetchTopic,
    createTopic,
    updateTopic,
    archiveTopic,
    deleteTopic,
    assignSurveys,
    detachSurveys,
    undoAssign,
    invalidate,
  }
})
