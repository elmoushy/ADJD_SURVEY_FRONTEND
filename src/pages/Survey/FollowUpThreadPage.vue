<script setup lang="ts">
import { onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useFollowUpsStore } from '@/stores/followUps'
import { useSimpleAuth } from '@/composables/useSimpleAuth'
import FollowUpThread from '@/components/Survey/FollowUpThread.vue'
import FollowUpStatusBadge from '@/components/Survey/FollowUpStatusBadge.vue'
import FollowUpAuditTimeline from '@/components/Survey/FollowUpAuditTimeline.vue'

const { t } = useI18n()
const route = useRoute()
const router = useRouter()
const store = useFollowUpsStore()
const { user } = useSimpleAuth()

const threadId = computed(() => route.params.id as string)
const thread   = computed(() => store.threadsById[threadId.value] ?? null)
const isAdmin  = computed(() => {
  const role = user.value?.role
  return role === 'admin' || role === 'manager' || role === 'super_admin'
})

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('ar-AE', {
    year: 'numeric', month: 'long', day: 'numeric',
  })
}

onMounted(async () => {
  await store.loadThread(threadId.value)
  await store.markRead(threadId.value)
})
</script>

<template>
  <div :class="$style.page" dir="rtl">

    <!-- Top nav bar -->
    <div :class="$style.topBar">
      <button :class="$style.backBtn" @click="router.push('/my-follow-ups')">
        <i class="fas fa-arrow-right"></i>
        {{ t('followUp.myFollowUps') }}
      </button>
    </div>

    <!-- Loading state -->
    <div v-if="!thread" :class="$style.loadingState">
      <div :class="$style.spinner"></div>
      <span>{{ t('common.loading') }}</span>
    </div>

    <!-- Thread content -->
    <template v-else>

      <!-- Page header card -->
      <div :class="$style.headerCard">
        <div :class="$style.headerLeft">
          <div :class="$style.surveyIcon">
            <i class="fas fa-file-alt"></i>
          </div>
          <div :class="$style.headerInfo">
            <p :class="$style.headerMeta">{{ t('followUp.surveyLabel') }}</p>
            <h1 :class="$style.surveyTitle">{{ thread.response_summary.survey_title }}</h1>
            <p :class="$style.openedAt">
              <i class="fas fa-calendar-alt"></i>
              {{ t('followUp.openedAt') }}: {{ formatDate(thread.created_at) }}
            </p>
          </div>
        </div>
        <FollowUpStatusBadge :status="thread.status" :large="true" />
      </div>

      <!-- Body: two columns -->
      <div :class="$style.body">

        <!-- Main chat column -->
        <div :class="$style.mainCol">
          <FollowUpThread :thread="thread" :is-admin="isAdmin" />
        </div>

        <!-- Sidebar: audit timeline -->
        <aside :class="$style.sidebar">
          <div :class="$style.sidebarCard">
            <h3 :class="$style.sidebarTitle">
              <i class="fas fa-history"></i>
              {{ t('followUp.auditLog') }}
            </h3>
            <FollowUpAuditTimeline :thread="thread" />
          </div>
        </aside>

      </div>
    </template>
  </div>
</template>

<style module>
/* ── Page shell ─────────────────────────────────────────────── */
.page {
  min-height: 100vh;
  background: #f4f6f9;
  padding: 20px 24px 48px;
  max-width: 1100px;
  margin: 0 auto;
  box-sizing: border-box;
}

/* ── Top bar ────────────────────────────────────────────────── */
.topBar {
  display: flex;
  align-items: center;
  margin-bottom: 20px;
}

.backBtn {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 8px 16px;
  font-size: 13px;
  font-weight: 500;
  color: #374151;
  cursor: pointer;
  transition: background 0.15s, box-shadow 0.15s;
}
.backBtn:hover {
  background: #f9fafb;
  box-shadow: 0 1px 4px rgba(0,0,0,0.08);
}

/* ── Loading ────────────────────────────────────────────────── */
.loadingState {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
  padding: 80px 0;
  color: #9ca3af;
  font-size: 14px;
}
.spinner {
  width: 32px;
  height: 32px;
  border: 3px solid #e5e7eb;
  border-top-color: #1a6fa8;
  border-radius: 50%;
  animation: spin 0.7s linear infinite;
}
@keyframes spin { to { transform: rotate(360deg); } }

/* ── Header card ────────────────────────────────────────────── */
.headerCard {
  background: #fff;
  border-radius: 14px;
  padding: 20px 24px;
  margin-bottom: 20px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  box-shadow: 0 1px 4px rgba(0,0,0,0.06);
}

.headerLeft {
  display: flex;
  align-items: flex-start;
  gap: 16px;
}

.surveyIcon {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  background: linear-gradient(135deg, #1a6fa8, #2d9cdb);
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  font-size: 20px;
  flex-shrink: 0;
}

.headerInfo {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.headerMeta {
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: #9ca3af;
  margin: 0;
}

.surveyTitle {
  font-size: 18px;
  font-weight: 700;
  color: #111827;
  margin: 0;
}

.openedAt {
  font-size: 12px;
  color: #6b7280;
  margin: 0;
  display: flex;
  align-items: center;
  gap: 5px;
}

/* ── Body layout ────────────────────────────────────────────── */
.body {
  display: grid;
  grid-template-columns: 1fr 240px;
  gap: 20px;
  align-items: start;
}

@media (max-width: 700px) {
  .body { grid-template-columns: 1fr; }
  .sidebar { order: -1; }
}

.mainCol { min-width: 0; }

/* ── Sidebar ────────────────────────────────────────────────── */
.sidebar { position: sticky; top: 24px; }

.sidebarCard {
  background: #fff;
  border-radius: 14px;
  padding: 18px 20px;
  box-shadow: 0 1px 4px rgba(0,0,0,0.06);
}

.sidebarTitle {
  font-size: 12px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: #6b7280;
  margin: 0 0 16px;
  display: flex;
  align-items: center;
  gap: 7px;
}
</style>
