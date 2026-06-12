<template>
  <div :class="$style.publicSurveyContainer" :data-theme="currentTheme" :dir="isRTL ? 'rtl' : 'ltr'">

    <!-- Loading -->
    <div v-if="isLoading" :class="$style.loadingContainer">
      <div :class="$style.loadingSpinner"></div>
      <p :class="$style.loadingText">جاري تحميل إجاباتك...</p>
    </div>

    <!-- Error -->
    <div v-else-if="error" :class="$style.errorState">
      <div :class="$style.errorIcon">
        <i class="fas fa-exclamation-triangle"></i>
      </div>
      <h2 :class="$style.errorTitle">خطأ</h2>
      <p :class="$style.errorMessage">{{ error }}</p>
      <button :class="$style.secondaryButton" @click="goBack">
        <i class="fas fa-arrow-right"></i>
        العودة إلى الإيضاحات
      </button>
    </div>

    <!-- Response View -->
    <div v-else-if="survey && responseData" :class="$style.surveyForm">

      <!-- Header -->
      <div :class="$style.formHeader">
        <div :class="$style.formTitleSection">
          <h1 :class="$style.formTitle">{{ survey.title }}</h1>
          <div :class="$style.formSubtitle">
            <i class="fas fa-history"></i>
            <span>إجاباتك المقدمة بتاريخ {{ formatDate(responseData.submitted_at) }}</span>
          </div>
        </div>
        <!-- Read-only banner -->
        <div :class="ro.readOnlyBanner">
          <i class="fas fa-lock"></i>
          <span>وضع القراءة فقط — لا يمكن تعديل الإجابات</span>
        </div>
      </div>

      <!-- Questions (read-only) -->
      <div :class="$style.allQuestionsContainer">
        <div
          v-for="(question, index) in survey.questions"
          :key="question.id"
          :class="$style.questionContainer"
        >
          <div :class="$style.questionHeader">
            <div :class="$style.questionBadge">
              <span :class="$style.questionIndex">{{ (index as number) + 1 }}</span>
            </div>
            <h2 :class="$style.questionTitle">
              {{ question.text }}
              <span v-if="question.is_required" :class="$style.required">*</span>
            </h2>
          </div>

          <!-- Text -->
          <div v-if="question.question_type === 'text'" :class="$style.inputContainer">
            <div :class="$style.inputWrapper">
              <input
                type="text"
                :class="[$style.textInput, ro.readOnly]"
                :value="responseData.answers[question.id] || ''"
                disabled
                :placeholder="responseData.answers[question.id] ? '' : 'لم يتم الإجابة'"
              />
            </div>
          </div>

          <!-- Textarea -->
          <div v-else-if="question.question_type === 'textarea'" :class="$style.inputContainer">
            <div :class="$style.inputWrapper">
              <textarea
                :class="[$style.textArea, ro.readOnly]"
                :value="responseData.answers[question.id] || ''"
                disabled
                rows="4"
                :placeholder="responseData.answers[question.id] ? '' : 'لم يتم الإجابة'"
              ></textarea>
            </div>
          </div>

          <!-- Single Choice -->
          <div v-else-if="question.question_type === 'single_choice'" :class="$style.choicesContainer">
            <div :class="$style.choicesTitle">
              <i class="fas fa-dot-circle"></i>
              <span>اختر إجابة واحدة:</span>
            </div>
            <div
              v-for="(option, i) in getQuestionOptions(question.options)"
              :key="i"
              :class="[
                $style.choiceOption,
                ro.readOnlyChoice,
                { [$style.selected]: responseData.answers[question.id] === option }
              ]"
            >
              <div :class="$style.choiceRadio">
                <div v-if="responseData.answers[question.id] === option" :class="$style.radioSelected"></div>
              </div>
              <span :class="$style.choiceText">{{ option }}</span>
              <div :class="$style.choiceCheck" v-if="responseData.answers[question.id] === option">
                <i class="fas fa-check"></i>
              </div>
            </div>
          </div>

          <!-- Multiple Choice -->
          <div v-else-if="question.question_type === 'multiple_choice'" :class="$style.choicesContainer">
            <div :class="$style.choicesTitle">
              <i class="fas fa-check-square"></i>
              <span>يمكنك اختيار أكثر من إجابة:</span>
            </div>
            <div
              v-for="(option, i) in getQuestionOptions(question.options)"
              :key="i"
              :class="[
                $style.choiceOption,
                ro.readOnlyChoice,
                { [$style.multiSelected]: isMultiSelected(question.id, option) }
              ]"
            >
              <div :class="$style.choiceCheckbox">
                <i v-if="isMultiSelected(question.id, option)" class="fas fa-check"></i>
              </div>
              <span :class="$style.choiceText">{{ option }}</span>
            </div>
          </div>

          <!-- Yes/No -->
          <div v-else-if="question.question_type === 'yes_no'" :class="$style.yesNoWrapper">
            <div :class="$style.yesNoContainer">
              <div :class="$style.yesNoButtons">
                <button
                  :class="[$style.yesNoButton, $style.yes, ro.readOnlyBtn,
                           { [$style.selected]: responseData.answers[question.id] === 'نعم' }]"
                  disabled type="button"
                >
                  <i class="fas fa-check" :class="$style.yesNoButtonIcon"></i>
                  <span :class="$style.yesNoButtonText">نعم</span>
                </button>
                <button
                  :class="[$style.yesNoButton, $style.no, ro.readOnlyBtn,
                           { [$style.selected]: responseData.answers[question.id] === 'لا' }]"
                  disabled type="button"
                >
                  <i class="fas fa-times" :class="$style.yesNoButtonIcon"></i>
                  <span :class="$style.yesNoButtonText">لا</span>
                </button>
              </div>
            </div>
          </div>

          <!-- Rating -->
          <div v-else-if="question.question_type === 'rating'" :class="$style.ratingContainer">
            <div :class="$style.ratingLabels">
              <span>{{ getRatingLabel('min', question.options) }}</span>
              <span>{{ getRatingLabel('max', question.options) }}</span>
            </div>
            <div :class="$style.ratingScale">
              <button
                v-for="rating in getRatingOptions(question.options)"
                :key="rating"
                :class="[$style.ratingButton, ro.readOnlyBtn,
                         { [$style.selected]: String(responseData.answers[question.id]) === String(rating) }]"
                disabled
              >{{ rating }}</button>
            </div>
          </div>

          <!-- Unanswered fallback -->
          <div v-else :class="$style.inputContainer">
            <p :class="ro.noAnswer">لم يتم الإجابة على هذا السؤال</p>
          </div>
        </div>

        <!-- Back button -->
        <div :class="$style.submitContainer">
          <button :class="$style.secondaryButton" @click="goBack">
            <i class="fas fa-arrow-right"></i>
            <span>العودة إلى الإيضاحات</span>
          </button>
        </div>
      </div>
    </div>

  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from '@/hooks/useI18n'
import { surveyService } from '@/services/surveyService'

const route = useRoute()
const router = useRouter()
const { currentTheme, isRTL } = useI18n()

const isLoading = ref(true)
const error = ref<string | null>(null)
const survey = ref<any>(null)
const responseData = ref<any>(null)

const loadResponse = async () => {
  try {
    isLoading.value = true
    error.value = null
    const surveyId = route.params.id as string
    const result = await surveyService.getMyResponse(surveyId)
    if (result?.data) {
      survey.value = result.data.survey
      responseData.value = result.data.response
    } else {
      error.value = 'لم يتم العثور على الإجابة'
    }
  } catch (err: any) {
    error.value = err?.response?.data?.message || err?.message || 'فشل في تحميل الإجابة'
  } finally {
    isLoading.value = false
  }
}

const goBack = () => router.push('/surveys')

const formatDate = (iso: string): string => {
  if (!iso) return ''
  try {
    return new Date(iso).toLocaleDateString('ar-SA', {
      year: 'numeric', month: 'long', day: 'numeric',
      hour: '2-digit', minute: '2-digit'
    })
  } catch { return iso }
}

const getQuestionOptions = (options: string | undefined): string[] => {
  if (!options) return []
  try {
    const arr = typeof options === 'string' ? JSON.parse(options) : options
    return Array.isArray(arr) ? arr.map(String) : []
  } catch { return [] }
}

const getRatingOptions = (options: string | undefined): any[] => {
  if (!options) return [1, 2, 3, 4, 5]
  try {
    const arr = typeof options === 'string' ? JSON.parse(options) : options
    if (!Array.isArray(arr) || arr.length === 0) return [1, 2, 3, 4, 5]
    const nums = arr.map(Number).filter(n => !isNaN(n)).sort((a, b) => a - b)
    return nums.length > 0 ? nums : arr
  } catch { return [1, 2, 3, 4, 5] }
}

const getRatingLabel = (type: 'min' | 'max', options?: string): string => {
  if (!options) return type === 'min' ? 'ضعيف' : 'ممتاز'
  try {
    const arr = typeof options === 'string' ? JSON.parse(options) : options
    const nums = (Array.isArray(arr) ? arr : []).map(Number).filter(n => !isNaN(n)).sort((a: number, b: number) => a - b)
    if (nums.length === 0) return type === 'min' ? 'ضعيف' : 'ممتاز'
    return String(type === 'min' ? nums[0] : nums[nums.length - 1])
  } catch { return type === 'min' ? 'ضعيف' : 'ممتاز' }
}

const isMultiSelected = (questionId: string, option: string): boolean => {
  const raw = responseData.value?.answers?.[questionId] || ''
  if (!raw) return false
  return raw.split(',').map((s: string) => s.trim()).includes(option)
}

onMounted(loadResponse)
</script>

<!-- Primary styles: shared with AuthSurveyView / PublicSurveyView -->
<style module src="./PublicSurveyView.module.css"></style>

<!-- Read-only overrides: separate named module to avoid $style conflict -->
<style module="ro">
.readOnly {
  background-color: #f5f5f5 !important;
  color: #555 !important;
  cursor: not-allowed !important;
  border-color: #e0e0e0 !important;
  opacity: 1 !important;
}

.readOnlyChoice {
  cursor: default !important;
  pointer-events: none;
  opacity: 0.85;
}

.readOnlyBtn {
  cursor: not-allowed !important;
  pointer-events: none;
}

.readOnlyBanner {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  background: #fff8e1;
  border: 1px solid #f0c040;
  color: #7a5c00;
  border-radius: 8px;
  padding: 8px 14px;
  font-size: 13px;
  font-weight: 500;
  margin-top: 8px;
}

.noAnswer {
  color: #aaa;
  font-style: italic;
  font-size: 14px;
  margin: 8px 0 0;
}
</style>
