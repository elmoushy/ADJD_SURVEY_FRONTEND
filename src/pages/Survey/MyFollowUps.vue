<script setup lang="ts">
import { onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useFollowUpsStore } from '@/stores/followUps'
import FollowUpStatusBadge from '@/components/Survey/FollowUpStatusBadge.vue'
import type { FollowUpStatus } from '@/types/survey.types'

const { t } = useI18n()
const router = useRouter()
const store = useFollowUpsStore()

onMounted(() => store.loadInbox())

const ORDER: Record<FollowUpStatus, number> = {
  pending_reply: 0,
  replied: 1,
  accepted: 2,
  rejected: 3,
  closed: 4,
}

const sortedThreads = computed(() =>
  [...store.inboxThreads].sort(
    (a, b) => (ORDER[a.status] ?? 9) - (ORDER[b.status] ?? 9)
  )
)

function openThread(id: string) {
  router.push(`/my-follow-ups/${id}`)
}
</script>

<template>
  <div :class="$style.page" dir="rtl">
    <!-- Header -->
    <header :class="$style.header">
      <div :class="$style.headerIcon">
        <i class="fas fa-comments"></i>
      </div>
      <div>
        <h1 :class="$style.headerTitle">{{ t('followUp.myFollowUps') }}</h1>
        <p :class="$style.headerSub">{{ sortedThreads.length ? `${sortedThreads.length} ${t('followUp.myFollowUps')}` : t('followUp.noThreads') }}</p>
      </div>
    </header>

    <!-- Empty state -->
    <div v-if="!sortedThreads.length" :class="$style.empty">
      <div :class="$style.emptyIcon">
        <i class="fas fa-comments"></i>
      </div>
      <p :class="$style.emptyText">{{ t('followUp.noThreads') }}</p>
    </div>

    <!-- Thread list -->
    <ul v-else :class="$style.list">
      <li
        v-for="thread in sortedThreads"
        :key="thread.id"
        :class="$style.item"
        @click="openThread(thread.id)"
      >
        <div :class="$style.itemIcon">
          <i class="fas fa-comment-dots"></i>
        </div>
        <div :class="$style.itemBody">
          <div :class="$style.itemTitle">
            {{ thread.response_summary.survey_title }}
          </div>
          <div :class="$style.itemMeta">
            <FollowUpStatusBadge :status="thread.status" />
            <span :class="$style.date">
              <i class="far fa-clock"></i>
              {{ new Date(thread.updated_at).toLocaleDateString('ar-AE', { year: 'numeric', month: 'short', day: 'numeric' }) }}
            </span>
          </div>
        </div>
        <div :class="$style.itemArrow">
          <i class="fas fa-chevron-left"></i>
        </div>
      </li>
    </ul>
  </div>
</template>

<style module>
/* ── Page shell ── */
.page {
  width: 100%;
  padding: 32px 24px;
  direction: rtl;
  font-family: inherit;
}

/* ── Header ── */
.header {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 32px;
  padding-bottom: 24px;
  border-bottom: 2px solid #f0ebe2;
}

.headerIcon {
  width: 52px;
  height: 52px;
  border-radius: 16px;
  background: linear-gradient(135deg, #B78A41, #A17D23);
  display: grid;
  place-items: center;
  color: #fff;
  font-size: 22px;
  flex-shrink: 0;
  box-shadow: 0 8px 20px rgba(183, 138, 65, 0.28);
}

.headerTitle {
  font-size: 22px;
  font-weight: 800;
  color: #0f172a;
  margin: 0 0 4px;
  letter-spacing: -0.01em;
}

.headerSub {
  font-size: 13px;
  color: #94a3b8;
  margin: 0;
}

/* ── Empty state ── */
.empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 16px;
  padding: 80px 0;
  background: #F5F7FA;
  border-radius: 24px;
}

.emptyIcon {
  width: 72px;
  height: 72px;
  border-radius: 999px;
  background: #efe5d8;
  display: grid;
  place-items: center;
  color: #B78A41;
  font-size: 28px;
}

.emptyText {
  font-size: 16px;
  font-weight: 600;
  color: #94a3b8;
  margin: 0;
}

/* ── Thread list ── */
.list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.item {
  background: #fff;
  border-radius: 20px;
  padding: 16px 20px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 14px;
  transition: transform 0.18s ease, box-shadow 0.18s ease, background 0.18s ease;
  box-shadow: 0 2px 8px rgba(15, 23, 42, 0.05);
}

.item:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(183, 138, 65, 0.14);
  background: #fffcf7;
}

.itemIcon {
  width: 44px;
  height: 44px;
  border-radius: 14px;
  background: #F5F7FA;
  display: grid;
  place-items: center;
  color: #B78A41;
  font-size: 18px;
  flex-shrink: 0;
}

.itemBody {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.itemTitle {
  font-weight: 700;
  font-size: 15px;
  color: #0f172a;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.itemMeta {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}

.date {
  font-size: 12px;
  color: #94a3b8;
  display: flex;
  align-items: center;
  gap: 4px;
}

.itemArrow {
  color: #B78A41;
  font-size: 14px;
  flex-shrink: 0;
  opacity: 0.6;
  transition: opacity 0.15s, transform 0.15s;
}

.item:hover .itemArrow {
  opacity: 1;
  transform: translateX(-3px);
}
</style>
