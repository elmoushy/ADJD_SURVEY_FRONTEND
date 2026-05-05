<script setup lang="ts">
import { ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import type { AuthenticatedRespondentInfo } from '@/types/survey.types'

const props = defineProps<{
  respondent: AuthenticatedRespondentInfo | null
  open: boolean
}>()

const emit = defineEmits<{ close: [] }>()

const { t } = useI18n()

function close() {
  emit('close')
}
</script>

<template>
  <Teleport to="body">
    <Transition name="drawer">
      <div v-if="open && respondent" :class="$style.overlay" @click.self="close">
        <aside :class="$style.drawer">
          <header :class="$style.header">
            <span :class="$style.title">{{ t('survey.responses.viewProfile') }}</span>
            <button :class="$style.closeBtn" @click="close" aria-label="close">
              <i class="fas fa-times"></i>
            </button>
          </header>

          <div :class="$style.body">
            <div :class="$style.avatarBlock">
              <div :class="$style.avatarCircle">{{ respondent.avatar_initials }}</div>
              <div>
                <div :class="$style.name">{{ respondent.name }}</div>
                <div :class="$style.email">{{ respondent.email }}</div>
              </div>
            </div>

            <dl :class="$style.meta">
              <template v-if="respondent.role">
                <dt>{{ t('survey.responses.role') }}</dt>
                <dd>{{ respondent.role }}</dd>
              </template>
              <template v-if="respondent.department">
                <dt>{{ t('survey.responses.department') }}</dt>
                <dd>{{ respondent.department }}</dd>
              </template>
              <template v-if="respondent.joined_at">
                <dt>{{ t('survey.responses.joinedAt') }}</dt>
                <dd>{{ new Date(respondent.joined_at).toLocaleDateString('ar-AE') }}</dd>
              </template>
            </dl>
          </div>
        </aside>
      </div>
    </Transition>
  </Teleport>
</template>

<style module>
.overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.35);
  z-index: 1000;
  display: flex;
  justify-content: flex-end;
}

.drawer {
  background: #fff;
  width: min(380px, 90vw);
  height: 100%;
  overflow-y: auto;
  box-shadow: -4px 0 24px rgba(0, 0, 0, 0.15);
  display: flex;
  flex-direction: column;
}

.header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px 24px;
  border-bottom: 1px solid #eee;
}

.title {
  font-weight: 600;
  font-size: 16px;
}

.closeBtn {
  background: none;
  border: none;
  cursor: pointer;
  font-size: 18px;
  color: #666;
  padding: 4px 8px;
}

.body {
  padding: 24px;
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.avatarBlock {
  display: flex;
  align-items: center;
  gap: 16px;
}

.avatarCircle {
  width: 56px;
  height: 56px;
  border-radius: 50%;
  background: #1a6fa8;
  color: #fff;
  font-weight: 700;
  font-size: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.name {
  font-weight: 600;
  font-size: 16px;
}

.email {
  color: #666;
  font-size: 13px;
  margin-top: 2px;
}

.meta {
  display: grid;
  grid-template-columns: auto 1fr;
  gap: 8px 16px;
  font-size: 14px;
  margin: 0;
}

.meta dt {
  color: #888;
  font-weight: 500;
}

.meta dd {
  margin: 0;
  color: #333;
}
</style>

<style>
.drawer-enter-active,
.drawer-leave-active {
  transition: transform 0.25s ease;
}
.drawer-enter-from,
.drawer-leave-to {
  transform: translateX(100%);
}
</style>
