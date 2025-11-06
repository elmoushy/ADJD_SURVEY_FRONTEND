<script setup lang="ts">
import { ref, reactive, computed, watch } from 'vue'
import { QuillEditor } from '@vueup/vue-quill'
import '@vueup/vue-quill/dist/vue-quill.snow.css'
import type {
  EmailTemplateDetail,
  CreateEmailTemplateRequest,
  EmailTemplateError
} from '@/types/email-templates.types'
import { TEMPLATE_CATEGORIES } from '@/types/email-templates.types'

interface Props {
  visible: boolean
  mode: 'create' | 'edit'
  template?: EmailTemplateDetail | null
}

interface Emits {
  (e: 'close'): void
  (e: 'submit', data: CreateEmailTemplateRequest): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

// Form state
const formData = reactive<CreateEmailTemplateRequest>({
  name: '',
  name_ar: '',
  subject: '',
  subject_ar: '',
  body_html: '',
  body_html_ar: '',
  body_text: '',
  is_active: true,
  category: 'GENERAL'
})

const formErrors = ref<EmailTemplateError>({})

// Quill editor configuration
const editorOptions = {
  modules: {
    toolbar: [
      [{ header: [1, 2, 3, 4, 5, 6, false] }],
      ['bold', 'italic', 'underline', 'strike'],
      [{ color: [] }, { background: [] }],
      [{ align: [] }],
      [{ list: 'ordered' }, { list: 'bullet' }],
      ['blockquote', 'code-block'],
      [{ indent: '-1' }, { indent: '+1' }],
      ['link', 'image'],
      ['clean']
    ]
  },
  placeholder: 'اكتب محتوى البريد الإلكتروني هنا...',
  theme: 'snow'
}

// Load template data when in edit mode
watch(
  () => props.template,
  (newTemplate) => {
    if (newTemplate && props.mode === 'edit') {
      formData.name = newTemplate.name
      formData.name_ar = newTemplate.name_ar || ''
      formData.subject = newTemplate.subject
      formData.subject_ar = newTemplate.subject_ar || ''
      formData.body_html = newTemplate.body_html
      formData.body_html_ar = newTemplate.body_html_ar || ''
      formData.body_text = newTemplate.body_text || ''
      formData.is_active = newTemplate.is_active
      formData.category = newTemplate.category
    }
  },
  { immediate: true }
)

// Reset form when modal closes
watch(
  () => props.visible,
  (isVisible) => {
    if (!isVisible) {
      resetForm()
    }
  }
)

const resetForm = () => {
  formData.name = ''
  formData.name_ar = ''
  formData.subject = ''
  formData.subject_ar = ''
  formData.body_html = ''
  formData.body_html_ar = ''
  formData.body_text = ''
  formData.is_active = true
  formData.category = 'GENERAL'
  formErrors.value = {}
}

const handleSubmit = () => {
  formErrors.value = {}
  emit('submit', { ...formData })
}

const handleClose = () => {
  emit('close')
}

const getFieldError = (field: keyof EmailTemplateError): string => {
  const errors = formErrors.value[field]
  return Array.isArray(errors) && errors.length > 0 ? errors[0] : ''
}

// Modal title
const modalTitle = computed(() => {
  return props.mode === 'create' ? 'إنشاء قالب بريد إلكتروني جديد' : 'تعديل قالب البريد الإلكتروني'
})

// Expose method to set errors from parent
defineExpose({
  setErrors: (errors: EmailTemplateError) => {
    formErrors.value = errors
  }
})
</script>

<template>
  <teleport to="body">
    <div v-if="visible" :class="$style.modalOverlay" @click.self="handleClose">
      <section
        :class="$style.modalContainer"
        role="dialog"
        aria-modal="true"
        :aria-labelledby="`email-template-modal-title-${mode}`"
      >
        <header :class="$style.modalHeader">
          <h2 :id="`email-template-modal-title-${mode}`" :class="$style.modalTitle">
            {{ modalTitle }}
          </h2>
          <button
            type="button"
            :class="$style.closeButton"
            @click="handleClose"
            aria-label="إغلاق النافذة"
          >
            <span aria-hidden="true">&times;</span>
          </button>
        </header>

        <div :class="$style.modalBody">
          <!-- Template Name -->
          <div :class="$style.formField">
            <label :class="$style.fieldLabel" for="template_name">اسم القالب *</label>
            <input
              id="template_name"
              v-model="formData.name"
              type="text"
              :class="[$style.fieldInput, getFieldError('name') ? $style.fieldError : '']"
              placeholder="مثال: Welcome Email"
            />
            <span v-if="getFieldError('name')" :class="$style.errorText">
              {{ getFieldError('name') }}
            </span>
          </div>

          <!-- Category -->
          <div :class="$style.formField">
            <label :class="$style.fieldLabel" for="template_category">التصنيف *</label>
            <select
              id="template_category"
              v-model="formData.category"
              :class="[$style.fieldSelect, getFieldError('category') ? $style.fieldError : '']"
            >
              <option
                v-for="cat in TEMPLATE_CATEGORIES"
                :key="cat.value"
                :value="cat.value"
              >
                {{ cat.label_ar }} ({{ cat.label }})
              </option>
            </select>
            <span v-if="getFieldError('category')" :class="$style.errorText">
              {{ getFieldError('category') }}
            </span>
          </div>

          <!-- Subject -->
          <div :class="$style.formField">
            <label :class="$style.fieldLabel" for="template_subject">موضوع البريد *</label>
            <input
              id="template_subject"
              v-model="formData.subject"
              type="text"
              :class="[$style.fieldInput, getFieldError('subject') ? $style.fieldError : '']"
              placeholder="مثال: Welcome to WeaponPowerCloud"
            />
            <span v-if="getFieldError('subject')" :class="$style.errorText">
              {{ getFieldError('subject') }}
            </span>
            <small :class="$style.fieldHint">يمكنك استخدام متغيرات مثل: user_name, date</small>
          </div>

          <!-- Body HTML - Rich Text Editor -->
          <div :class="$style.formField">
            <label :class="$style.fieldLabel">محتوى البريد الإلكتروني *</label>
            <div :class="[getFieldError('body_html') ? $style.editorError : '']">
              <QuillEditor
                v-model:content="formData.body_html"
                contentType="html"
                :options="editorOptions"
                :class="$style.richTextEditor"
              />
            </div>
            <span v-if="getFieldError('body_html')" :class="$style.errorText">
              {{ getFieldError('body_html') }}
            </span>
            <small :class="$style.fieldHint">
              استخدم شريط الأدوات لتنسيق النص، إضافة روابط، صور، وغيرها
            </small>
          </div>

          <!-- Active Status -->
          <div :class="$style.formField">
            <label :class="$style.checkboxLabel">
              <input
                type="checkbox"
                v-model="formData.is_active"
                :class="$style.checkbox"
              />
              <span>القالب نشط</span>
            </label>
          </div>
        </div>

        <footer :class="$style.modalActions">
          <button type="button" :class="$style.submitButton" @click="handleSubmit">
            {{ mode === 'create' ? 'إنشاء' : 'تحديث' }}
          </button>
          <button type="button" :class="$style.cancelButton" @click="handleClose">
            إلغاء
          </button>
        </footer>
      </section>
    </div>
  </teleport>
</template>

<style module>
/* Modal Overlay */
.modalOverlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
  padding: 1rem;
  overflow-y: auto;
}

/* Modal Container */
.modalContainer {
  background: var(--modal-bg, #ffffff);
  border-radius: 12px;
  width: 100%;
  max-width: 900px;
  max-height: 90vh;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
}

/* Modal Header */
.modalHeader {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1.5rem 2rem;
  border-bottom: 1px solid var(--border-color, #e0e0e0);
  background: var(--header-bg, #f5f5f5);
}

.modalTitle {
  font-size: 1.5rem;
  font-weight: 600;
  color: var(--text-primary, #1a1a1a);
  margin: 0;
}

.closeButton {
  background: transparent;
  border: none;
  font-size: 2rem;
  color: var(--text-secondary, #666);
  cursor: pointer;
  padding: 0;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
  transition: background 0.2s;
}

.closeButton:hover {
  background: rgba(0, 0, 0, 0.05);
}

/* Modal Body */
.modalBody {
  padding: 2rem;
  overflow-y: auto;
  flex: 1;
}

/* Form Fields */
.formField {
  margin-bottom: 1.5rem;
}

.fieldLabel {
  display: block;
  font-weight: 500;
  color: var(--text-primary, #1a1a1a);
  margin-bottom: 0.5rem;
  font-size: 0.95rem;
}

.fieldInput,
.fieldSelect,
.fieldTextarea {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid var(--border-color, #d0d0d0);
  border-radius: 6px;
  font-size: 0.95rem;
  font-family: inherit;
  transition: border-color 0.2s, box-shadow 0.2s;
  background: var(--input-bg, #ffffff);
  color: var(--text-primary, #1a1a1a);
}

.fieldInput:focus,
.fieldSelect:focus,
.fieldTextarea:focus {
  outline: none;
  border-color: var(--primary-color, #2563eb);
  box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
}

.fieldTextarea {
  resize: vertical;
  min-height: 100px;
}

/* Rich Text Editor */
.richTextEditor {
  background: var(--input-bg, #ffffff);
  border-radius: 6px;
  min-height: 250px;
}

.richTextEditor :global(.ql-toolbar) {
  border: 1px solid var(--border-color, #d0d0d0);
  border-radius: 6px 6px 0 0;
  background: var(--input-bg, #ffffff);
}

.richTextEditor :global(.ql-container) {
  border: 1px solid var(--border-color, #d0d0d0);
  border-top: none;
  border-radius: 0 0 6px 6px;
  min-height: 200px;
  font-size: 0.95rem;
}

.richTextEditor :global(.ql-editor) {
  min-height: 200px;
}

.editorError :global(.ql-toolbar),
.editorError :global(.ql-container) {
  border-color: var(--error-color, #dc2626) !important;
}

.fieldError {
  border-color: var(--error-color, #dc2626) !important;
}

.errorText {
  display: block;
  color: var(--error-color, #dc2626);
  font-size: 0.875rem;
  margin-top: 0.375rem;
}

.fieldHint {
  display: block;
  color: var(--text-secondary, #666);
  font-size: 0.875rem;
  margin-top: 0.375rem;
  font-style: italic;
}

/* Checkbox */
.checkboxLabel {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
  font-weight: 500;
}

.checkbox {
  width: 18px;
  height: 18px;
  cursor: pointer;
}

/* Modal Actions */
.modalActions {
  display: flex;
  gap: 1rem;
  padding: 1.5rem 2rem;
  border-top: 1px solid var(--border-color, #e0e0e0);
  background: var(--footer-bg, #f5f5f5);
  justify-content: flex-end;
}

.submitButton,
.cancelButton {
  padding: 0.75rem 1.5rem;
  border-radius: 6px;
  font-weight: 500;
  font-size: 0.95rem;
  cursor: pointer;
  transition: all 0.2s;
  border: none;
}

.submitButton {
  background: var(--primary-color, #2563eb);
  color: white;
}

.submitButton:hover {
  background: var(--primary-hover, #1d4ed8);
}

.submitButton:disabled {
  background: var(--disabled-bg, #9ca3af);
  cursor: not-allowed;
}

.cancelButton {
  background: transparent;
  color: var(--text-secondary, #666);
  border: 1px solid var(--border-color, #d0d0d0);
}

.cancelButton:hover {
  background: rgba(0, 0, 0, 0.05);
}

/* Responsive Design */
@media (max-width: 768px) {
  .modalContainer {
    max-width: 100%;
    max-height: 100vh;
    border-radius: 0;
  }

  .modalHeader {
    padding: 1rem;
  }

  .modalBody {
    padding: 1rem;
  }

  .modalActions {
    padding: 1rem;
    flex-direction: column-reverse;
  }

  .submitButton,
  .cancelButton {
    width: 100%;
  }
}

/* Dark Mode Support */
[data-theme="dark"] .modalContainer {
  background: #1f2937;
}

[data-theme="dark"] .modalHeader,
[data-theme="dark"] .modalActions {
  background: #111827;
  border-color: #374151;
}

[data-theme="dark"] .modalTitle {
  color: #f9fafb;
}

[data-theme="dark"] .fieldLabel {
  color: #f3f4f6;
}

[data-theme="dark"] .fieldInput,
[data-theme="dark"] .fieldSelect,
[data-theme="dark"] .fieldTextarea {
  background: #111827;
  border-color: #374151;
  color: #f9fafb;
}

/* Dark Mode - Rich Text Editor */
[data-theme="dark"] .richTextEditor :global(.ql-toolbar) {
  background: #111827;
  border-color: #374151;
}

[data-theme="dark"] .richTextEditor :global(.ql-container) {
  background: #111827;
  border-color: #374151;
}

[data-theme="dark"] .richTextEditor :global(.ql-editor) {
  color: #f9fafb;
}

[data-theme="dark"] .richTextEditor :global(.ql-snow .ql-stroke) {
  stroke: #9ca3af;
}

[data-theme="dark"] .richTextEditor :global(.ql-snow .ql-fill) {
  fill: #9ca3af;
}

[data-theme="dark"] .richTextEditor :global(.ql-snow .ql-picker-label) {
  color: #9ca3af;
}

[data-theme="dark"] .fieldHint {
  color: #9ca3af;
}

[data-theme="dark"] .closeButton {
  color: #9ca3af;
}

[data-theme="dark"] .closeButton:hover {
  background: rgba(255, 255, 255, 0.1);
}

[data-theme="dark"] .cancelButton {
  color: #9ca3af;
  border-color: #374151;
}

[data-theme="dark"] .cancelButton:hover {
  background: rgba(255, 255, 255, 0.05);
}
</style>
