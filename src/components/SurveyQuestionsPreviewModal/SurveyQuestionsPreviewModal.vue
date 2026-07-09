<template>
  <div :class="$style.modalOverlay" @click="$emit('close')">
    <div
      :class="$style.modalContainer"
      :data-theme="currentTheme"
      :dir="isRTL ? 'rtl' : 'ltr'"
      @click.stop
    >
      <!-- Header -->
      <div :class="$style.modalHeader">
        <div :class="$style.modalHeaderText">
          <h2 :class="$style.modalTitle">
            <i class="fas fa-clipboard-list" :class="$style.modalIcon"></i>
            <span :class="$style.modalTitleText">{{ survey.title }}</span>
          </h2>
          <div :class="$style.modalSubtitleRow">
            <span :class="$style.readOnlyBadge">
              <i class="fas fa-lock"></i>
              {{ isRTL ? 'معاينة فقط — وضع القراءة' : 'Preview only — read-only' }}
            </span>
            <span v-if="questions.length" :class="$style.questionCountBadge">
              <i class="fas fa-question-circle"></i>
              {{ isRTL ? `${questions.length} سؤال` : `${questions.length} question${questions.length === 1 ? '' : 's'}` }}
            </span>
          </div>
        </div>
        <button :class="$style.closeButton" :title="isRTL ? 'إغلاق' : 'Close'" @click="$emit('close')">
          <i class="fas fa-times"></i>
        </button>
      </div>

      <!-- Body -->
      <div :class="$style.modalBody">
        <!-- Loading (only when we had to fetch questions ourselves) -->
        <div v-if="isLoading" :class="$style.loadingState">
          <div :class="$style.loadingSpinner"></div>
          <p>{{ isRTL ? 'جاري تحميل الأسئلة...' : 'Loading questions...' }}</p>
        </div>

        <!-- Error -->
        <div v-else-if="loadError" :class="$style.errorState">
          <i class="fas fa-exclamation-triangle" :class="$style.errorIcon"></i>
          <p>{{ loadError }}</p>
        </div>

        <!-- Empty -->
        <div v-else-if="questions.length === 0" :class="$style.emptyState">
          <i class="fas fa-inbox" :class="$style.emptyIcon"></i>
          <p>{{ isRTL ? 'لا توجد أسئلة في هذا الإيضاحات بعد' : 'This survey has no questions yet' }}</p>
        </div>

        <!-- Questions -->
        <div v-else :class="$style.questionsList">
          <div
            v-for="(question, index) in questions"
            :key="question.id"
            :class="$style.questionCard"
          >
            <div :class="$style.questionHeader">
              <span :class="$style.questionIndex">{{ index + 1 }}</span>
              <h3 :class="$style.questionText">
                {{ question.text }}
                <span v-if="question.is_required" :class="$style.requiredMark">*</span>
              </h3>
            </div>
            <div v-if="question.is_required" :class="$style.requiredNote">
              <i class="fas fa-star"></i>
              <span>{{ isRTL ? 'هذا السؤال مطلوب' : 'This question is required' }}</span>
            </div>

            <!-- Text -->
            <div v-if="question.question_type === 'text'" :class="$style.answerArea">
              <input type="text" :class="$style.textInput" disabled :placeholder="isRTL ? 'حقل إجابة نصي قصير' : 'Short text answer field'" />
            </div>

            <!-- Textarea -->
            <div v-else-if="question.question_type === 'textarea'" :class="$style.answerArea">
              <textarea :class="$style.textArea" disabled rows="3" :placeholder="isRTL ? 'حقل إجابة نصي طويل' : 'Long text answer field'"></textarea>
            </div>

            <!-- Single Choice -->
            <div v-else-if="question.question_type === 'single_choice'" :class="$style.choicesList">
              <div v-for="(option, i) in getOptions(question.options)" :key="i" :class="$style.choiceRow">
                <span :class="$style.radioCircle"></span>
                <span :class="$style.choiceLabel">{{ option }}</span>
              </div>
            </div>

            <!-- Multiple Choice -->
            <div v-else-if="question.question_type === 'multiple_choice'" :class="$style.choicesList">
              <div v-for="(option, i) in getOptions(question.options)" :key="i" :class="$style.choiceRow">
                <span :class="$style.checkboxSquare"></span>
                <span :class="$style.choiceLabel">{{ option }}</span>
              </div>
            </div>

            <!-- Yes/No -->
            <div v-else-if="question.question_type === 'yes_no'" :class="$style.yesNoRow">
              <span :class="$style.yesNoPill">
                <i class="fas fa-check"></i>
                {{ isRTL ? 'نعم' : 'Yes' }}
              </span>
              <span :class="$style.yesNoPill">
                <i class="fas fa-times"></i>
                {{ isRTL ? 'لا' : 'No' }}
              </span>
            </div>

            <!-- Rating -->
            <div v-else-if="question.question_type === 'rating'" :class="$style.ratingArea">
              <div :class="$style.ratingLabels">
                <span>{{ getRatingLabel('min', question.options) }}</span>
                <span>{{ getRatingLabel('max', question.options) }}</span>
              </div>
              <div :class="$style.ratingScale">
                <span v-for="rating in getRatingOptions(question.options)" :key="rating" :class="$style.ratingPill">
                  {{ rating }}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { storeToRefs } from 'pinia'
import { useAppStore } from '../../stores/useAppStore'
import { surveyService } from '../../services/surveyService'
import type { Survey, SurveyQuestion } from '../../types/survey.types'

interface Props {
  survey: Survey
}

const props = defineProps<Props>()
const emit = defineEmits<{ close: [] }>()

const store = useAppStore()
const { currentTheme, currentLanguage } = storeToRefs(store)
const isRTL = computed(() => currentLanguage.value === 'ar')

const isLoading = ref(false)
const loadError = ref<string | null>(null)
const fetchedQuestions = ref<SurveyQuestion[] | null>(null)

// Prefer the questions already loaded on the survey (no extra request needed);
// only hit the detail endpoint when they're genuinely missing.
const questions = computed<SurveyQuestion[]>(() => {
  if (fetchedQuestions.value) return fetchedQuestions.value
  return props.survey.questions || []
})

const loadQuestionsIfMissing = async () => {
  if (props.survey.questions) return
  try {
    isLoading.value = true
    loadError.value = null
    const response = await surveyService.getSurvey(props.survey.id)
    fetchedQuestions.value = response?.data?.questions || []
  } catch (err: any) {
    loadError.value = err?.response?.data?.message || err?.message ||
      (isRTL.value ? 'فشل في تحميل الأسئلة' : 'Failed to load questions')
  } finally {
    isLoading.value = false
  }
}

const getOptions = (options: string | undefined): string[] => {
  if (!options) return []
  try {
    const arr = typeof options === 'string' ? JSON.parse(options) : options
    return Array.isArray(arr) ? arr.map(String) : []
  } catch { return [] }
}

const getRatingOptions = (options: string | undefined): (string | number)[] => {
  if (!options) return [1, 2, 3, 4, 5]
  try {
    const arr = typeof options === 'string' ? JSON.parse(options) : options
    if (!Array.isArray(arr) || arr.length === 0) return [1, 2, 3, 4, 5]
    const nums = arr.map(Number).filter((n) => !isNaN(n)).sort((a, b) => a - b)
    return nums.length > 0 ? nums : arr
  } catch { return [1, 2, 3, 4, 5] }
}

const getRatingLabel = (type: 'min' | 'max', options?: string): string => {
  const fallback = type === 'min' ? (isRTL.value ? 'ضعيف' : 'Poor') : (isRTL.value ? 'ممتاز' : 'Excellent')
  if (!options) return fallback
  try {
    const arr = typeof options === 'string' ? JSON.parse(options) : options
    const nums = (Array.isArray(arr) ? arr : []).map(Number).filter((n) => !isNaN(n)).sort((a: number, b: number) => a - b)
    if (nums.length === 0) return fallback
    return String(type === 'min' ? nums[0] : nums[nums.length - 1])
  } catch { return fallback }
}

const handleKeydown = (e: KeyboardEvent) => {
  if (e.key === 'Escape') emit('close')
}

onMounted(() => {
  loadQuestionsIfMissing()
  window.addEventListener('keydown', handleKeydown)
})
onUnmounted(() => window.removeEventListener('keydown', handleKeydown))
</script>

<style module>
.modalOverlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(8px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 20px;
}

.modalContainer {
  background: rgba(255, 255, 255, 0.97);
  backdrop-filter: blur(20px);
  border-radius: 20px;
  width: 100%;
  max-width: 720px;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.2);
  border: 1px solid rgba(255, 255, 255, 0.3);
  animation: modalSlideIn 0.25s ease-out;
}

@keyframes modalSlideIn {
  from { opacity: 0; transform: translateY(-16px) scale(0.97); }
  to { opacity: 1; transform: translateY(0) scale(1); }
}

.modalHeader {
  padding: 20px 28px;
  border-bottom: 1px solid rgba(161, 125, 35, 0.12);
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 16px;
  background: linear-gradient(135deg, rgba(161, 125, 35, 0.06) 0%, rgba(161, 125, 35, 0.02) 100%);
  flex-shrink: 0;
}

.modalHeaderText {
  min-width: 0;
  flex: 1;
}

.modalTitle {
  font-size: 1.25rem;
  font-weight: 600;
  margin: 0;
  color: var(--text-color, #1f2937);
  display: flex;
  align-items: center;
  gap: 10px;
}

.modalTitleText {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.modalIcon {
  color: #A17D23;
  flex-shrink: 0;
}

.modalSubtitleRow {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 8px;
  flex-wrap: wrap;
}

.readOnlyBadge,
.questionCountBadge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  font-weight: 500;
  padding: 4px 10px;
  border-radius: 999px;
}

.readOnlyBadge {
  background: #fff8e1;
  border: 1px solid #f0c040;
  color: #7a5c00;
}

.questionCountBadge {
  background: rgba(161, 125, 35, 0.08);
  border: 1px solid rgba(161, 125, 35, 0.2);
  color: #A17D23;
}

.closeButton {
  background: none;
  border: none;
  font-size: 1.25rem;
  color: #6b7280;
  cursor: pointer;
  padding: 8px;
  border-radius: 8px;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  flex-shrink: 0;
}

.closeButton:hover {
  background: rgba(156, 163, 175, 0.15);
  color: var(--text-color, #1f2937);
}

.modalBody {
  padding: 24px 28px 28px;
  overflow-y: auto;
  flex: 1;
}

.loadingState,
.errorState,
.emptyState {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: 48px 16px;
  color: #6b7280;
  text-align: center;
}

.loadingSpinner {
  width: 32px;
  height: 32px;
  border: 3px solid rgba(161, 125, 35, 0.2);
  border-top-color: #A17D23;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.errorIcon,
.emptyIcon {
  font-size: 28px;
  color: #d1a94a;
}

.questionsList {
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.questionCard {
  background: rgba(245, 247, 250, 0.6);
  border: 1px solid rgba(0, 0, 0, 0.06);
  border-radius: 14px;
  padding: 18px 20px;
}

.questionHeader {
  display: flex;
  align-items: flex-start;
  gap: 12px;
}

.questionIndex {
  flex-shrink: 0;
  width: 26px;
  height: 26px;
  border-radius: 50%;
  background: #A17D23;
  color: white;
  font-size: 13px;
  font-weight: 600;
  display: flex;
  align-items: center;
  justify-content: center;
}

.questionText {
  font-size: 15px;
  font-weight: 600;
  color: var(--text-color, #1f2937);
  margin: 0;
  line-height: 1.5;
}

.requiredMark {
  color: #dc3545;
  margin-inline-start: 4px;
}

.requiredNote {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: #b8860b;
  margin: 8px 0 0 38px;
}

.answerArea {
  margin-top: 12px;
  margin-inline-start: 38px;
}

.textInput,
.textArea {
  width: 100%;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  padding: 10px 14px;
  font-size: 14px;
  background: #f5f5f5;
  color: #9ca3af;
  cursor: not-allowed;
  font-family: inherit;
  resize: none;
}

.choicesList {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-top: 12px;
  margin-inline-start: 38px;
}

.choiceRow {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 12px;
  border-radius: 8px;
  border: 1px solid #e5e7eb;
  background: white;
  opacity: 0.9;
}

.radioCircle {
  flex-shrink: 0;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  border: 2px solid #c7ccd1;
}

.checkboxSquare {
  flex-shrink: 0;
  width: 16px;
  height: 16px;
  border-radius: 4px;
  border: 2px solid #c7ccd1;
}

.choiceLabel {
  font-size: 14px;
  color: #4b5563;
}

.yesNoRow {
  display: flex;
  gap: 10px;
  margin-top: 12px;
  margin-inline-start: 38px;
}

.yesNoPill {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 18px;
  border-radius: 8px;
  border: 1px solid #e5e7eb;
  background: white;
  color: #4b5563;
  font-size: 14px;
}

.ratingArea {
  margin-top: 12px;
  margin-inline-start: 38px;
}

.ratingLabels {
  display: flex;
  justify-content: space-between;
  font-size: 12px;
  color: #9ca3af;
  margin-bottom: 8px;
}

.ratingScale {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.ratingPill {
  min-width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 8px;
  border: 1px solid #e5e7eb;
  background: white;
  color: #4b5563;
  font-size: 13px;
}

/* Dark theme */
.modalContainer[data-theme="night"] {
  background: rgba(30, 32, 38, 0.97);
  border-color: rgba(255, 255, 255, 0.08);
}

.modalContainer[data-theme="night"] .modalHeader {
  background: linear-gradient(135deg, rgba(161, 125, 35, 0.12) 0%, rgba(161, 125, 35, 0.03) 100%);
  border-bottom-color: rgba(255, 255, 255, 0.08);
}

.modalContainer[data-theme="night"] .questionCard {
  background: rgba(255, 255, 255, 0.04);
  border-color: rgba(255, 255, 255, 0.08);
}

.modalContainer[data-theme="night"] .choiceRow,
.modalContainer[data-theme="night"] .yesNoPill,
.modalContainer[data-theme="night"] .ratingPill {
  background: rgba(255, 255, 255, 0.05);
  border-color: rgba(255, 255, 255, 0.1);
  color: #d1d5db;
}

.modalContainer[data-theme="night"] .textInput,
.modalContainer[data-theme="night"] .textArea {
  background: rgba(255, 255, 255, 0.05);
  border-color: rgba(255, 255, 255, 0.1);
  color: #6b7280;
}

.modalContainer[data-theme="night"] .closeButton:hover {
  background: rgba(255, 255, 255, 0.08);
}
</style>
