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
        <div :class="$style.headerActions">
          <button
            v-if="questions.length"
            :class="$style.toolButton"
            :title="isRTL ? 'طباعة' : 'Print'"
            :disabled="isExporting"
            @click="printQuestions"
          >
            <i class="fas fa-print"></i>
            <span :class="$style.toolButtonText">{{ isRTL ? 'طباعة' : 'Print' }}</span>
          </button>
          <!-- <button
            v-if="questions.length"
            :class="$style.toolButton"
            :title="isRTL ? 'تحميل PDF' : 'Download PDF'"
            :disabled="isExporting"
            @click="downloadQuestionsPdf"
          >
            <i :class="isExporting ? 'fas fa-spinner fa-spin' : 'fas fa-download'"></i>
            <span :class="$style.toolButtonText">{{ isRTL ? 'تحميل' : 'Download' }}</span>
          </button> -->
          <button :class="$style.closeButton" :title="isRTL ? 'إغلاق' : 'Close'" @click="$emit('close')">
            <i class="fas fa-times"></i>
          </button>
        </div>
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
import jsPDF from 'jspdf'
import { addAmiriFont } from '../../lib/fonts/Amiri-normal'
import { reshape } from 'arabic-persian-reshaper'
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
const isExporting = ref(false)

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

// ── Print / Download helpers ──────────────────────────────────────
const escapeHtml = (value: unknown): string =>
  String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')

const questionTypeLabel = (type: string): string => {
  const labels: Record<string, { ar: string; en: string }> = {
    text: { ar: 'نص قصير', en: 'Short text' },
    textarea: { ar: 'نص طويل', en: 'Long text' },
    single_choice: { ar: 'اختيار واحد', en: 'Single choice' },
    multiple_choice: { ar: 'اختيار متعدد', en: 'Multiple choice' },
    yes_no: { ar: 'نعم / لا', en: 'Yes / No' },
    rating: { ar: 'تقييم', en: 'Rating' },
  }
  const m = labels[type]
  return m ? (isRTL.value ? m.ar : m.en) : type
}

// English digits/date format, regardless of UI language.
const formatSurveyDate = (iso?: string | null): string => {
  if (!iso) return ''
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  return d.toLocaleString('en-GB', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit', hour12: true,
  })
}

const createdByName = (): string => {
  const s = props.survey as any
  return s.creator_name || s.created_by_name || s.creator_email || (isRTL.value ? 'غير معروف' : 'Unknown')
}

// ── jsPDF direct-text rendering (same approach as the responses report) ──
// No DOM screenshot involved, so there's nothing that can render "blank".
function cleanDirectionMarkers(text: string): string {
  if (!text) return text
  return text.replace(/[‎‏‪‫‬‭‮⁦⁧⁨⁩]/g, '').trim()
}

function isArabicLine(s: string): boolean {
  return /[؀-ۿ]/.test(String(s || ''))
}

function shapeArabicText(text: string, rtl: boolean): string {
  if (!rtl || !text) return text
  try {
    const cleaned = cleanDirectionMarkers(text)
    const shaped = reshape(cleaned)
    return shaped.split('').reverse().join('')
  } catch {
    return text
  }
}

interface DrawTextOptions {
  rtl: boolean
  size?: number
  weight?: 'normal' | 'bold'
  color?: string
  align?: 'left' | 'right' | 'center'
}

const drawText = (pdf: jsPDF, text: string, x: number, y: number, options: DrawTextOptions) => {
  const { rtl, size = 11, weight = 'normal', color = '#231F20' } = options
  const align = options.align ?? (rtl ? 'right' : 'left')
  const base = text ?? ''
  const cleaned = cleanDirectionMarkers(base)
  const shaped = shapeArabicText(cleaned, rtl && isArabicLine(base))
  pdf.setFont('Amiri', weight === 'bold' ? 'bold' : 'normal')
  pdf.setFontSize(size)
  pdf.setTextColor(color)
  pdf.text(shaped, x, y, { align, isInputRtl: false })
}

const drawParagraph = (
  pdf: jsPDF,
  text: string,
  x: number,
  y: number,
  width: number,
  options: DrawTextOptions & { lineHeight?: number },
): number => {
  const { lineHeight = 5.5 } = options
  pdf.setFont('Amiri', options.weight === 'bold' ? 'bold' : 'normal')
  pdf.setFontSize(options.size ?? 11)
  const lines = pdf.splitTextToSize(text ?? '', width) as string[]
  let cursorY = y
  lines.forEach((line) => {
    drawText(pdf, line, x, cursorY, { ...options, rtl: options.rtl && isArabicLine(line) })
    cursorY += lineHeight
  })
  return cursorY
}

// Build a self-contained HTML fragment (details header + questions) used for
// both printing and PDF download. Native browser rendering handles Arabic/RTL.
const buildPrintableHtml = (): string => {
  const rtl = isRTL.value
  const dir = rtl ? 'rtl' : 'ltr'
  const L = (ar: string, en: string) => (rtl ? ar : en)

  const detailRows: string[] = []
  detailRows.push(`<tr><td class="lbl">${L('أنشئ بواسطة', 'Created by')}</td><td>${escapeHtml(createdByName())}</td></tr>`)
  detailRows.push(`<tr><td class="lbl">${L('الحالة', 'Status')}</td><td>${props.survey.is_active ? L('نشط', 'Active') : L('غير نشط', 'Inactive')}</td></tr>`)
  const start = formatSurveyDate((props.survey as any).start_date)
  if (start) detailRows.push(`<tr><td class="lbl">${L('تاريخ البدء', 'Start date')}</td><td dir="ltr">${escapeHtml(start)}</td></tr>`)
  const end = formatSurveyDate((props.survey as any).end_date)
  if (end) detailRows.push(`<tr><td class="lbl">${L('تاريخ الانتهاء', 'End date')}</td><td dir="ltr">${escapeHtml(end)}</td></tr>`)
  detailRows.push(`<tr><td class="lbl">${L('عدد الأسئلة', 'Questions')}</td><td>${questions.value.length}</td></tr>`)

  const questionsHtml = questions.value.map((q, index) => {
    let answerHtml = ''
    if (q.question_type === 'text' || q.question_type === 'textarea') {
      answerHtml = `<div class="ans-line">${L('', 'Text answer field')}</div>`
    } else if (q.question_type === 'single_choice' || q.question_type === 'multiple_choice') {
      const mark = q.question_type === 'single_choice' ? '◯' : '☐'
      answerHtml = '<ul class="opts">' + getOptions(q.options).map(o => `<li><span class="mark">${mark}</span> ${escapeHtml(o)}</li>`).join('') + '</ul>'
    } else if (q.question_type === 'yes_no') {
      answerHtml = `<div class="opts-inline"><span>◯ ${L('نعم', 'Yes')}</span><span>◯ ${L('لا', 'No')}</span></div>`
    } else if (q.question_type === 'rating') {
      answerHtml = '<div class="opts-inline">' + getRatingOptions(q.options).map(r => `<span class="rate">${escapeHtml(r)}</span>`).join('') + '</div>'
    }
    const required = q.is_required ? ` <span class="req">*</span>` : ''
    const typeLabel = escapeHtml(questionTypeLabel(q.question_type))
    return `
      <div class="q">
        <div class="q-head"><span class="q-num">${index + 1}</span><span class="q-text">${escapeHtml(q.text)}${required}</span></div>
        <div class="q-type">${L('نوع السؤال', 'Type')}: ${typeLabel}</div>
        ${answerHtml}
      </div>`
  }).join('')

  return `
    <div class="survey-print" dir="${dir}" style="text-align:${rtl ? 'right' : 'left'}">
      <style>
        .survey-print { font-family: 'Segoe UI', Tahoma, Arial, sans-serif; color: #231F20; padding: 8px 4px; }
        .survey-print .title { font-size: 22px; font-weight: 700; color: #A17D23; margin: 0 0 12px; }
        .survey-print .details { width: 100%; border-collapse: collapse; margin-bottom: 22px; }
        .survey-print .details td { border: 1px solid #e8dcc0; padding: 7px 10px; font-size: 13px; }
        .survey-print .details td.lbl { background: #f7f0e0; font-weight: 700; width: 32%; }
        .survey-print .q { border: 1px solid #e5e7eb; border-radius: 8px; padding: 12px 14px; margin-bottom: 12px; page-break-inside: avoid; }
        .survey-print .q-head { display: flex; align-items: flex-start; gap: 8px; }
        .survey-print .q-num { flex-shrink: 0; width: 22px; height: 22px; border-radius: 50%; background: #A17D23; color: #fff; font-size: 12px; font-weight: 700; display: inline-flex; align-items: center; justify-content: center; }
        .survey-print .q-text { font-size: 14px; font-weight: 600; line-height: 1.5; }
        .survey-print .req { color: #dc3545; }
        .survey-print .q-type { font-size: 11px; color: #808285; margin: 6px 0 8px; }
        .survey-print .opts { list-style: none; padding: 0; margin: 0; }
        .survey-print .opts li { padding: 4px 0; font-size: 13px; }
        .survey-print .mark { color: #A17D23; }
        .survey-print .opts-inline { display: flex; flex-wrap: wrap; gap: 10px; font-size: 13px; }
        .survey-print .rate { border: 1px solid #e5e7eb; border-radius: 6px; padding: 3px 10px; }
        .survey-print .ans-line { border-bottom: 1px dashed #c7ccd1; height: 20px; }
      </style>
      <h1 class="title">${escapeHtml(props.survey.title)}</h1>
      <table class="details"><tbody>${detailRows.join('')}</tbody></table>
      ${questionsHtml}
    </div>`
}

const printQuestions = () => {
  const html = buildPrintableHtml()
  const w = window.open('', '_blank', 'width=900,height=700')
  if (!w) return
  const dir = isRTL.value ? 'rtl' : 'ltr'
  w.document.write(`<!doctype html><html dir="${dir}"><head><meta charset="utf-8"><title>${escapeHtml(props.survey.title)}</title></head><body>${html}</body></html>`)
  w.document.close()
  w.focus()
  // Give the new window a tick to render before printing.
  setTimeout(() => { w.print(); }, 300)
}

const downloadQuestionsPdf = () => {
  if (isExporting.value) return
  isExporting.value = true
  try {
    const rtl = isRTL.value
    const pdf = new jsPDF({ orientation: 'p', unit: 'mm', format: 'a4' })
    addAmiriFont(pdf)
    pdf.setFont('Amiri', 'normal')

    const colors = {
      primary: '#A17D23',
      secondary: '#231F20',
      subtitle: '#4D4D4F',
      border: '#E5E8E1',
    }

    const pageWidth = pdf.internal.pageSize.getWidth()
    const pageHeight = pdf.internal.pageSize.getHeight()
    const margin = 18
    const contentWidth = pageWidth - margin * 2
    let yPosition = margin

    const ensureSpace = (height: number) => {
      if (yPosition + height > pageHeight - margin) {
        pdf.addPage()
        pdf.setFont('Amiri', 'normal')
        yPosition = margin
      }
    }

    // "label : value" row — separator sits between label and value; in RTL
    // the label is anchored right and the value drawn to its left so English
    // values (names, dates) keep their natural left-to-right order.
    const SEP = ':'
    const drawInfoRow = (label: string, value: string) => {
      const size = 11
      const rawValue = String(value ?? '')
      ensureSpace(9)
      if (rtl && isArabicLine(label)) {
        const rightX = pageWidth - margin
        pdf.setFont('Amiri', 'normal')
        pdf.setFontSize(size)
        const labelWidth = pdf.getTextWidth(shapeArabicText(cleanDirectionMarkers(label), true))
        drawText(pdf, label, rightX, yPosition + 4, { rtl: true, size, color: colors.secondary, align: 'right' })
        const sepWidth = pdf.getTextWidth(SEP)
        const sepX = rightX - labelWidth - 2
        drawText(pdf, SEP, sepX, yPosition + 4, { rtl: false, size, color: colors.secondary, align: 'right' })
        drawText(pdf, rawValue, sepX - sepWidth - 2, yPosition + 4, {
          rtl: isArabicLine(rawValue), size, color: colors.subtitle, align: 'right',
        })
      } else {
        drawText(pdf, `${label} ${SEP} ${rawValue}`, margin, yPosition + 4, {
          rtl: false, size, color: colors.subtitle, align: 'left',
        })
      }
      yPosition += 8
    }

    // Header banner
    pdf.setFillColor(colors.primary)
    pdf.roundedRect(margin, yPosition, contentWidth, 22, 4, 4, 'F')
    drawText(pdf, props.survey.title, pageWidth / 2, yPosition + 14, {
      rtl: rtl && isArabicLine(props.survey.title), size: 16, weight: 'bold', color: '#FFFFFF', align: 'center',
    })
    yPosition += 32

    // Details
    drawInfoRow(rtl ? 'أنشئ بواسطة' : 'Created by', createdByName())
    drawInfoRow(
      rtl ? 'الحالة' : 'Status',
      props.survey.is_active ? (rtl ? 'نشط' : 'Active') : (rtl ? 'غير نشط' : 'Inactive'),
    )
    const start = formatSurveyDate((props.survey as any).start_date)
    if (start) drawInfoRow(rtl ? 'تاريخ البدء' : 'Start date', start)
    const end = formatSurveyDate((props.survey as any).end_date)
    if (end) drawInfoRow(rtl ? 'تاريخ الانتهاء' : 'End date', end)
    drawInfoRow(rtl ? 'عدد الأسئلة' : 'Questions', String(questions.value.length))
    yPosition += 4

    pdf.setDrawColor(colors.border)
    pdf.setLineWidth(0.3)
    pdf.line(margin, yPosition, pageWidth - margin, yPosition)
    yPosition += 8

    // Questions
    questions.value.forEach((q, index) => {
      ensureSpace(22)

      const circleX = rtl ? pageWidth - margin - 3 : margin + 3
      pdf.setFillColor(colors.primary)
      pdf.circle(circleX, yPosition + 2, 3, 'F')
      drawText(pdf, String(index + 1), circleX, yPosition + 3, {
        rtl: false, size: 8, weight: 'bold', color: '#FFFFFF', align: 'center',
      })

      const textX = rtl ? circleX - 6 : circleX + 6
      const required = q.is_required ? ' *' : ''
      const questionLine = `${q.text}${required}`
      yPosition = drawParagraph(pdf, questionLine, textX, yPosition + 3, contentWidth - 10, {
        rtl: rtl && isArabicLine(q.text), size: 11, weight: 'bold', color: colors.secondary,
        lineHeight: 5.5, align: rtl ? 'right' : 'left',
      })

      const typeLine = `${rtl ? 'نوع السؤال' : 'Type'}: ${questionTypeLabel(q.question_type)}`
      yPosition = drawParagraph(pdf, typeLine, textX, yPosition + 1, contentWidth - 10, {
        rtl: rtl && isArabicLine(typeLine), size: 9, color: colors.subtitle, lineHeight: 5, align: rtl ? 'right' : 'left',
      }) + 3

      if (q.question_type === 'text' || q.question_type === 'textarea') {
        ensureSpace(8)
        pdf.setDrawColor(colors.border)
        pdf.setLineWidth(0.2)
        const lineEndX = rtl ? margin : pageWidth - margin
        pdf.line(textX, yPosition, lineEndX, yPosition)
        yPosition += 8
      } else if (q.question_type === 'single_choice' || q.question_type === 'multiple_choice') {
        const mark = q.question_type === 'single_choice' ? 'o' : '[ ]'
        getOptions(q.options).forEach((opt) => {
          ensureSpace(7)
          const line = `${mark} ${opt}`
          yPosition = drawParagraph(pdf, line, textX, yPosition + 4, contentWidth - 10, {
            rtl: rtl && isArabicLine(opt), size: 10, color: colors.secondary, lineHeight: 5, align: rtl ? 'right' : 'left',
          })
        })
        yPosition += 2
      } else if (q.question_type === 'yes_no') {
        ensureSpace(8)
        const line = rtl ? 'o نعم      o لا' : 'o Yes      o No'
        yPosition = drawParagraph(pdf, line, textX, yPosition + 4, contentWidth - 10, {
          rtl, size: 10, color: colors.secondary, lineHeight: 5, align: rtl ? 'right' : 'left',
        }) + 2
      } else if (q.question_type === 'rating') {
        ensureSpace(8)
        const opts = getRatingOptions(q.options).join('   ')
        const line = `${getRatingLabel('min', q.options)}   ${opts}   ${getRatingLabel('max', q.options)}`
        yPosition = drawParagraph(pdf, line, textX, yPosition + 4, contentWidth - 10, {
          rtl: rtl && isArabicLine(line), size: 10, color: colors.secondary, lineHeight: 5, align: rtl ? 'right' : 'left',
        }) + 2
      }

      ensureSpace(6)
      yPosition += 4
      pdf.setDrawColor(colors.border)
      pdf.setLineWidth(0.15)
      pdf.line(margin, yPosition, pageWidth - margin, yPosition)
      yPosition += 8
    })

    const safeTitle = (props.survey.title || 'survey').replace(/[\\/:*?"<>|]+/g, '_').slice(0, 60)
    pdf.save(`${safeTitle}.pdf`)
  } catch (err) {
    console.error('Failed to generate survey PDF:', err)
  } finally {
    isExporting.value = false
  }
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

.headerActions {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
}

.toolButton {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  background: rgba(161, 125, 35, 0.1);
  border: 1px solid rgba(161, 125, 35, 0.25);
  color: #A17D23;
  cursor: pointer;
  padding: 8px 14px;
  border-radius: 10px;
  font-size: 13px;
  font-weight: 600;
  transition: all 0.2s ease;
  white-space: nowrap;
}

.toolButton:hover:not(:disabled) {
  background: rgba(161, 125, 35, 0.18);
}

.toolButton:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.toolButtonText {
  line-height: 1;
}

@media (max-width: 560px) {
  .toolButtonText { display: none; }
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

.modalContainer[data-theme="night"] .toolButton {
  background: rgba(206, 165, 91, 0.14);
  border-color: rgba(206, 165, 91, 0.3);
  color: #CEA55B;
}

.modalContainer[data-theme="night"] .toolButton:hover:not(:disabled) {
  background: rgba(206, 165, 91, 0.24);
}
</style>
