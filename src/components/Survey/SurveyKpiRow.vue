<template>
  <section :class="$style.statsSection">
    <div :class="$style.kpiGrid">
      <div
        v-for="card in cards"
        :key="card.key"
        :class="$style.kpiCard"
        role="status"
        aria-live="polite"
      >
        <div :class="$style.kpiTop">
          <div :class="$style.kpiHead">
            <!-- the "active" icon variant already carries its own notification dot -->
            <div :class="$style.kpiBadge" aria-hidden="true">
              <component :is="card.icon" />
            </div>
            <div :class="$style.kpiTitle">{{ card.title }}</div>
          </div>

          <div :class="$style.kpiArrowWrap" v-if="card.trend !== undefined && card.trend !== null">
            <svg v-if="card.trend >= 0" width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path d="M9.01562 5V6.96875H15.625L4 18.5938L5.40625 20L17.0312 8.375V14.9844H19V5H9.01562Z" fill="#00A350" />
            </svg>
            <svg v-else width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path d="M9.01562 19V17.0312H15.625L4 5.40625L5.40625 4L17.0312 15.625V9.01562H19V19H9.01562Z" fill="#DC3545" />
            </svg>
          </div>
        </div>

        <div :class="$style.kpiMain">
          <span :class="$style.kpiNumber">{{ card.value }}</span>
          <span :class="$style.kpiUnit">{{ card.unit }}</span>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
/**
 * The three KPI cards shown above a survey list.
 *
 * Extracted verbatim from SurveyControl.vue (same markup, same stylesheet) so the
 * survey-management shell and the topic page render identical cards — the topic
 * page simply feeds it the topic-scoped analytics the list endpoint returns.
 */
import { computed, defineComponent, h } from 'vue'
import { storeToRefs } from 'pinia'
import { useAppStore } from '@/stores/useAppStore'

const props = defineProps<{
  analytics: {
    total_surveys?: number
    active_surveys?: number
    total_responses?: number
    trends?: { total?: number; active?: number; responses?: number }
  } | null
}>()

const store = useAppStore()
const { currentLanguage } = storeToRefs(store)
const isRTL = computed(() => currentLanguage.value === 'ar')

const surveyPaths = [
  {
    d: 'M3 10C3 6.22876 3 4.34315 4.17157 3.17157C5.34315 2 7.22876 2 11 2H13C16.7712 2 18.6569 2 19.8284 3.17157C21 4.34315 21 6.22876 21 10V14C21 17.7712 21 19.6569 19.8284 20.8284C18.6569 22 16.7712 22 13 22H11C7.22876 22 5.34315 22 4.17157 20.8284C3 19.6569 3 17.7712 3 14V10Z',
    'stroke-width': '1.5',
  },
  { d: 'M8 10H16', 'stroke-width': '1.5', 'stroke-linecap': 'round' },
  { d: 'M8 14H13', 'stroke-width': '1.5', 'stroke-linecap': 'round' },
]

const makeIcon = (withDot: boolean) =>
  defineComponent({
    name: withDot ? 'IconSurveyDot' : 'IconSurvey',
    setup() {
      return () =>
        h(
          'svg',
          {
            width: 24,
            height: 24,
            viewBox: '0 0 24 24',
            fill: 'none',
            xmlns: 'http://www.w3.org/2000/svg',
            'aria-hidden': 'true',
            focusable: 'false',
          },
          [
            ...surveyPaths.map(path => h('path', { ...path, stroke: '#181B25' })),
            ...(withDot
              ? [h('rect', { x: '17', y: '0', width: '5', height: '5', rx: '2.5', fill: '#D44333' })]
              : []),
          ]
        )
    },
  })

const IconSurvey = makeIcon(false)
const IconSurveyWithDot = makeIcon(true)

const cards = computed(() => {
  const a = props.analytics
  const rtl = isRTL.value
  const trends = a?.trends || {}
  const surveysUnit = rtl ? 'إيضاحات' : 'surveys'
  const responsesUnit = rtl ? 'ردود' : 'responses'

  return [
    {
      key: 'total',
      title: rtl ? 'إجمالي إيضاحات' : 'Total surveys',
      value: a?.total_surveys ?? 0,
      unit: surveysUnit,
      trend: trends.total ?? null,
      icon: IconSurvey,
      dot: false,
    },
    {
      key: 'active',
      title: rtl ? 'إيضاحات النشطة' : 'Active surveys',
      value: a?.active_surveys ?? 0,
      unit: surveysUnit,
      trend: trends.active ?? null,
      icon: IconSurveyWithDot,
      dot: true,
    },
    {
      key: 'responses',
      title: rtl ? 'إجمالي الردود' : 'Total responses',
      value: a?.total_responses ?? 0,
      unit: responsesUnit,
      trend: trends.responses ?? null,
      icon: IconSurvey,
      dot: false,
    },
  ]
})
</script>

<style module src="../../pages/Control/SurveyControl.module.css"></style>
