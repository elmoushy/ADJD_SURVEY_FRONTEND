<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from "vue"
import { useAppStore } from "../../../stores/useAppStore"
import { messageManagementAPI } from "../../../services/messageManagementService"
import { emailTemplatesAPI } from "../../../services/emailTemplatesService"
import EmailTemplateModal from "../../../components/EmailTemplateModal/EmailTemplateModal.vue"
import type {
  UserNameEmail,
  CostCenterListItem,
  CreateCostCenterRequest
} from "../../../types/message-management.types"
import type {
  EmailTemplate,
  EmailTemplateDetail,
  CreateEmailTemplateRequest,
  EmailTemplateError
} from "../../../types/email-templates.types"
import { TEMPLATE_CATEGORIES } from "../../../types/email-templates.types"
import Swal from "sweetalert2"

type TabKey = "cost-centers" | "users" | "email-templates"

const tabs: Array<{ id: TabKey; label: string }> = [
  { id: "cost-centers", label: "مراكز التكلفة" },
  { id: "users", label: "المستخدمين" },
  { id: "email-templates", label: "قوالب الايميل" },
]

const store = useAppStore()
const currentTheme = computed(() => store.currentTheme)
const isRTL = computed(() => store.isRTL)

const activeTab = ref<TabKey>("cost-centers")
const searchInput = ref("")
const searchQuery = ref("")
const selectedFilter = ref("")
const isLoading = ref(false)

// Users data
const users = ref<UserNameEmail[]>([])
const usersCount = ref(0)

// Cost Centers data
const costCenters = ref<CostCenterListItem[]>([])
const costCentersCount = ref(0)

// Modal state
const costCenterModalVisible = ref(false)
const costCenterModalMode = ref<"create" | "edit">("create")
const selectedCostCenterId = ref<number | null>(null)

// Email input state
const recipientEmailInput = ref("")
const ccEmailInput = ref("")

// File input refs
const recipientFileInput = ref<HTMLInputElement | null>(null)
const ccFileInput = ref<HTMLInputElement | null>(null)

// Form state
const costCenterForm = reactive<CreateCostCenterRequest>({
  cost_center_code: "",
  cost_center_name: "",
  cost_center_name_ar: "",
  description: "",
  description_ar: "",
  is_active: true,
  recipient_emails: [],
  cc_emails: [],
})

const formErrors = ref<Record<string, string[]>>({})

// Email validation helper
const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

// Add recipient email
const addRecipientEmail = () => {
  const email = recipientEmailInput.value.trim()
  
  if (!email) {
    return
  }
  
  if (!isValidEmail(email)) {
    Swal.fire({
      title: "خطأ",
      text: "البريد الإلكتروني غير صالح",
      icon: "error",
      confirmButtonText: "حسناً",
    })
    return
  }
  
  if (!costCenterForm.recipient_emails) {
    costCenterForm.recipient_emails = []
  }
  
  if (costCenterForm.recipient_emails.includes(email)) {
    Swal.fire({
      title: "تنبيه",
      text: "البريد الإلكتروني موجود بالفعل",
      icon: "warning",
      confirmButtonText: "حسناً",
    })
    return
  }
  
  costCenterForm.recipient_emails.push(email)
  recipientEmailInput.value = ""
}

// Remove recipient email
const removeRecipientEmail = (email: string) => {
  if (!costCenterForm.recipient_emails) return
  const index = costCenterForm.recipient_emails.indexOf(email)
  if (index > -1) {
    costCenterForm.recipient_emails.splice(index, 1)
  }
}

// Add CC email
const addCCEmail = () => {
  const email = ccEmailInput.value.trim()
  
  if (!email) {
    return
  }
  
  if (!isValidEmail(email)) {
    Swal.fire({
      title: "خطأ",
      text: "البريد الإلكتروني غير صالح",
      icon: "error",
      confirmButtonText: "حسناً",
    })
    return
  }
  
  if (!costCenterForm.cc_emails) {
    costCenterForm.cc_emails = []
  }
  
  if (costCenterForm.cc_emails.includes(email)) {
    Swal.fire({
      title: "تنبيه",
      text: "البريد الإلكتروني موجود بالفعل",
      icon: "warning",
      confirmButtonText: "حسناً",
    })
    return
  }
  
  costCenterForm.cc_emails.push(email)
  ccEmailInput.value = ""
}

// Remove CC email
const removeCCEmail = (email: string) => {
  if (!costCenterForm.cc_emails) return
  const index = costCenterForm.cc_emails.indexOf(email)
  if (index > -1) {
    costCenterForm.cc_emails.splice(index, 1)
  }
}

// Download Excel template for emails
const downloadEmailTemplate = (type: "recipient" | "cc") => {
  // Create a simple CSV format (Excel compatible)
  const csvContent = "البريد الإلكتروني\nuser1@example.com\nuser2@example.com\nuser3@example.com"
  const blob = new Blob(["\ufeff" + csvContent], { type: "text/csv;charset=utf-8;" })
  const link = document.createElement("a")
  const url = URL.createObjectURL(blob)
  
  link.setAttribute("href", url)
  link.setAttribute("download", type === "recipient" ? "recipients_template.csv" : "cc_template.csv")
  link.style.visibility = "hidden"
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

// Upload Excel file for recipients
const handleRecipientFileUpload = (event: Event) => {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]
  
  if (!file) return
  
  // Check file type
  const validTypes = [
    "text/csv",
    "application/vnd.ms-excel",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
  ]
  
  if (!validTypes.includes(file.type) && !file.name.endsWith(".csv")) {
    Swal.fire({
      title: "خطأ",
      text: "يرجى تحميل ملف CSV أو Excel فقط",
      icon: "error",
      confirmButtonText: "حسناً",
    })
    target.value = ""
    return
  }
  
  const reader = new FileReader()
  reader.onload = (e) => {
    const text = e.target?.result as string
    const emails = parseEmailsFromCSV(text)
    
    if (emails.length === 0) {
      Swal.fire({
        title: "تنبيه",
        text: "لم يتم العثور على رسائل بريد إلكتروني صالحة في الملف",
        icon: "warning",
        confirmButtonText: "حسناً",
      })
      target.value = ""
      return
    }
    
    // Add valid emails to recipient list
    if (!costCenterForm.recipient_emails) {
      costCenterForm.recipient_emails = []
    }
    
    let addedCount = 0
    let duplicateCount = 0
    let invalidCount = 0
    
    emails.forEach(email => {
      if (!isValidEmail(email)) {
        invalidCount++
      } else if (costCenterForm.recipient_emails!.includes(email)) {
        duplicateCount++
      } else {
        costCenterForm.recipient_emails!.push(email)
        addedCount++
      }
    })
    
    let message = `تم إضافة ${addedCount} بريد إلكتروني بنجاح`
    if (duplicateCount > 0) {
      message += `\nتم تجاهل ${duplicateCount} بريد مكرر`
    }
    if (invalidCount > 0) {
      message += `\nتم تجاهل ${invalidCount} بريد غير صالح`
    }
    
    Swal.fire({
      title: "نجح",
      text: message,
      icon: "success",
      confirmButtonText: "حسناً",
    })
    
    target.value = ""
  }
  
  reader.readAsText(file)
}

// Upload Excel file for CC
const handleCCFileUpload = (event: Event) => {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]
  
  if (!file) return
  
  // Check file type
  const validTypes = [
    "text/csv",
    "application/vnd.ms-excel",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
  ]
  
  if (!validTypes.includes(file.type) && !file.name.endsWith(".csv")) {
    Swal.fire({
      title: "خطأ",
      text: "يرجى تحميل ملف CSV أو Excel فقط",
      icon: "error",
      confirmButtonText: "حسناً",
    })
    target.value = ""
    return
  }
  
  const reader = new FileReader()
  reader.onload = (e) => {
    const text = e.target?.result as string
    const emails = parseEmailsFromCSV(text)
    
    if (emails.length === 0) {
      Swal.fire({
        title: "تنبيه",
        text: "لم يتم العثور على رسائل بريد إلكتروني صالحة في الملف",
        icon: "warning",
        confirmButtonText: "حسناً",
      })
      target.value = ""
      return
    }
    
    // Add valid emails to CC list
    if (!costCenterForm.cc_emails) {
      costCenterForm.cc_emails = []
    }
    
    let addedCount = 0
    let duplicateCount = 0
    let invalidCount = 0
    
    emails.forEach(email => {
      if (!isValidEmail(email)) {
        invalidCount++
      } else if (costCenterForm.cc_emails!.includes(email)) {
        duplicateCount++
      } else {
        costCenterForm.cc_emails!.push(email)
        addedCount++
      }
    })
    
    let message = `تم إضافة ${addedCount} بريد إلكتروني بنجاح`
    if (duplicateCount > 0) {
      message += `\nتم تجاهل ${duplicateCount} بريد مكرر`
    }
    if (invalidCount > 0) {
      message += `\nتم تجاهل ${invalidCount} بريد غير صالح`
    }
    
    Swal.fire({
      title: "نجح",
      text: message,
      icon: "success",
      confirmButtonText: "حسناً",
    })
    
    target.value = ""
  }
  
  reader.readAsText(file)
}

// Parse emails from CSV content
const parseEmailsFromCSV = (csvContent: string): string[] => {
  const emails: string[] = []
  const lines = csvContent.split(/\r?\n/)
  
  // Skip header row if it exists
  const startIndex = lines[0]?.toLowerCase().includes("email") || lines[0]?.includes("بريد") ? 1 : 0
  
  for (let i = startIndex; i < lines.length; i++) {
    const line = lines[i].trim()
    if (!line) continue
    
    // Handle both comma and semicolon separators
    const parts = line.split(/[,;]/)
    parts.forEach(part => {
      const email = part.trim().replace(/['"]/g, "")
      if (email && email.includes("@")) {
        emails.push(email)
      }
    })
  }
  
  return emails
}

// Trigger file input click
const triggerRecipientFileUpload = () => {
  recipientFileInput.value?.click()
}

const triggerCCFileUpload = () => {
  ccFileInput.value?.click()
}

// Fetch all users
const fetchUsers = async () => {
  try {
    isLoading.value = true
    const response = await messageManagementAPI.getAllUsers()
    users.value = response.users
    usersCount.value = response.count
  } catch (error) {
    console.error("Failed to fetch users:", error)
    Swal.fire({
      title: "خطأ",
      text: "فشل في تحميل المستخدمين",
      icon: "error",
      confirmButtonText: "حسناً",
    })
  } finally {
    isLoading.value = false
  }
}

// Fetch all cost centers
const fetchCostCenters = async () => {
  try {
    isLoading.value = true
    const params: any = {}
    if (searchQuery.value) {
      params.search = searchQuery.value
    }
    if (selectedFilter.value === "active") {
      params.is_active = true
    } else if (selectedFilter.value === "inactive") {
      params.is_active = false
    }
    
    const response = await messageManagementAPI.getAllCostCenters(params)
    costCenters.value = response.results
    costCentersCount.value = response.count
  } catch (error) {
    console.error("Failed to fetch cost centers:", error)
    Swal.fire({
      title: "خطأ",
      text: "فشل في تحميل مراكز التكلفة",
      icon: "error",
      confirmButtonText: "حسناً",
    })
  } finally {
    isLoading.value = false
  }
}

// Open create modal
const openCreateModal = () => {
  costCenterModalMode.value = "create"
  selectedCostCenterId.value = null
  resetForm()
  costCenterModalVisible.value = true
}

// Open edit modal
const openEditModal = async (id: number) => {
  try {
    isLoading.value = true
    
    const costCenter = await messageManagementAPI.getCostCenterDetails(id)
    
    costCenterModalMode.value = "edit"
    selectedCostCenterId.value = id
    
    // Populate form with existing data
    costCenterForm.cost_center_code = costCenter.cost_center_code
    costCenterForm.cost_center_name = costCenter.cost_center_name
    costCenterForm.cost_center_name_ar = costCenter.cost_center_name_ar
    costCenterForm.description = costCenter.description || ""
    costCenterForm.description_ar = costCenter.description_ar || ""
    costCenterForm.is_active = costCenter.is_active
    costCenterForm.recipient_emails = [...costCenter.recipients]
    costCenterForm.cc_emails = [...costCenter.ccs]
    
    costCenterModalVisible.value = true
  } catch (error) {
    console.error("Failed to fetch cost center details:", error)
    Swal.fire({
      title: "خطأ",
      text: "فشل في تحميل تفاصيل مركز التكلفة",
      icon: "error",
      confirmButtonText: "حسناً",
    })
  } finally {
    isLoading.value = false
  }
}

// Close modal
const closeCostCenterModal = () => {
  costCenterModalVisible.value = false
  resetForm()
}

// Reset form
const resetForm = () => {
  costCenterForm.cost_center_code = ""
  costCenterForm.cost_center_name = ""
  costCenterForm.cost_center_name_ar = ""
  costCenterForm.description = ""
  costCenterForm.description_ar = ""
  costCenterForm.is_active = true
  costCenterForm.recipient_emails = []
  costCenterForm.cc_emails = []
  recipientEmailInput.value = ""
  ccEmailInput.value = ""
  formErrors.value = {}
}

// Handle form submission
const handleSubmit = async () => {
  try {
    isLoading.value = true
    formErrors.value = {}
    
    if (costCenterModalMode.value === "create") {
      await messageManagementAPI.createCostCenter(costCenterForm)
      Swal.fire({
        title: "نجح",
        text: "تم إنشاء مركز التكلفة بنجاح",
        icon: "success",
        confirmButtonText: "حسناً",
      })
    } else if (selectedCostCenterId.value) {
      await messageManagementAPI.updateCostCenter(selectedCostCenterId.value, costCenterForm)
      Swal.fire({
        title: "نجح",
        text: "تم تحديث مركز التكلفة بنجاح",
        icon: "success",
        confirmButtonText: "حسناً",
      })
    }
    
    closeCostCenterModal()
    await fetchCostCenters()
  } catch (error: any) {
    console.error("Failed to submit cost center:", error)
    
    // Handle validation errors
    if (error && typeof error === "object") {
      formErrors.value = error as Record<string, string[]>
    } else {
      Swal.fire({
        title: "خطأ",
        text: "فشل في حفظ مركز التكلفة",
        icon: "error",
        confirmButtonText: "حسناً",
      })
    }
  } finally {
    isLoading.value = false
  }
}

// Delete cost center
const handleDelete = async (id: number, name: string) => {
  const result = await Swal.fire({
    title: "هل أنت متأكد؟",
    text: `هل تريد حذف مركز التكلفة "${name}"؟ هذا الإجراء لا يمكن التراجع عنه.`,
    icon: "warning",
    showCancelButton: true,
    confirmButtonColor: "#d33",
    cancelButtonColor: "#3085d6",
    confirmButtonText: "نعم، احذف",
    cancelButtonText: "إلغاء",
  })
  
  if (result.isConfirmed) {
    try {
      isLoading.value = true
      await messageManagementAPI.deleteCostCenter(id)
      Swal.fire({
        title: "تم الحذف",
        text: "تم حذف مركز التكلفة بنجاح",
        icon: "success",
        confirmButtonText: "حسناً",
      })
      await fetchCostCenters()
    } catch (error) {
      console.error("Failed to delete cost center:", error)
      Swal.fire({
        title: "خطأ",
        text: "فشل في حذف مركز التكلفة",
        icon: "error",
        confirmButtonText: "حسناً",
      })
    } finally {
      isLoading.value = false
    }
  }
}

// Toggle active status
const handleToggleStatus = async (id: number, currentStatus: boolean) => {
  try {
    isLoading.value = true
    await messageManagementAPI.toggleCostCenterStatus(id, !currentStatus)
    await fetchCostCenters()
  } catch (error) {
    console.error("Failed to toggle status:", error)
    Swal.fire({
      title: "خطأ",
      text: "فشل في تغيير الحالة",
      icon: "error",
      confirmButtonText: "حسناً",
    })
  } finally {
    isLoading.value = false
  }
}

// Apply search
const applySearch = () => {
  searchQuery.value = searchInput.value.trim()
}

// Filtered users
const filteredUsers = computed(() => {
  const normalizedQuery = searchQuery.value.toLowerCase()
  let result = [...users.value]
  
  if (normalizedQuery) {
    result = result.filter((user) => {
      const haystack = `${user.full_name} ${user.email}`.toLowerCase()
      return haystack.includes(normalizedQuery)
    })
  }
  
  // Sort
  if (selectedFilter.value === "name") {
    result.sort((a, b) => a.full_name.localeCompare(b.full_name, "ar"))
  } else if (selectedFilter.value === "email") {
    result.sort((a, b) => a.email.localeCompare(b.email))
  }
  
  return result
})

// Format date
const formatDate = (value: string) => {
  const date = new Date(value)
  return new Intl.DateTimeFormat("ar", {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(date)
}

// Get error message for field
const getFieldError = (field: string): string => {
  const errors = formErrors.value[field]
  return errors && errors.length > 0 ? errors[0] : ""
}

// ============================================
// EMAIL TEMPLATES LOGIC
// ============================================

// Email Templates data
const emailTemplates = ref<EmailTemplate[]>([])
const emailTemplatesCount = ref(0)

// Email Template Modal state
const templateModalVisible = ref(false)
const templateModalMode = ref<"create" | "edit">("create")
const selectedTemplate = ref<EmailTemplateDetail | null>(null)
const templateModalRef = ref<InstanceType<typeof EmailTemplateModal> | null>(null)

// Fetch all email templates
const fetchEmailTemplates = async () => {
  try {
    isLoading.value = true
    const filters: any = {}
    
    // Apply search
    if (searchQuery.value) {
      filters.search = searchQuery.value
    }
    
    // Apply category filter
    if (selectedFilter.value && selectedFilter.value !== "") {
      filters.category = selectedFilter.value
    }
    
    const response = await emailTemplatesAPI.getAllTemplates(filters)
    emailTemplates.value = response.results
    emailTemplatesCount.value = response.count
  } catch (error) {
    console.error("Failed to fetch email templates:", error)
    Swal.fire({
      title: "خطأ",
      text: "فشل في تحميل قوالب البريد الإلكتروني",
      icon: "error",
      confirmButtonText: "حسناً",
    })
  } finally {
    isLoading.value = false
  }
}

// Open create template modal
const openCreateTemplateModal = () => {
  templateModalMode.value = "create"
  selectedTemplate.value = null
  templateModalVisible.value = true
}

// Open edit template modal
const openEditTemplateModal = async (id: number) => {
  try {
    isLoading.value = true
    const template = await emailTemplatesAPI.getTemplateById(id)
    selectedTemplate.value = template
    templateModalMode.value = "edit"
    templateModalVisible.value = true
  } catch (error) {
    console.error("Failed to fetch template details:", error)
    Swal.fire({
      title: "خطأ",
      text: "فشل في تحميل تفاصيل القالب",
      icon: "error",
      confirmButtonText: "حسناً",
    })
  } finally {
    isLoading.value = false
  }
}

// Close template modal
const closeTemplateModal = () => {
  templateModalVisible.value = false
  selectedTemplate.value = null
}

// Handle template form submission
const handleTemplateSubmit = async (templateData: CreateEmailTemplateRequest) => {
  try {
    isLoading.value = true
    
    if (templateModalMode.value === "create") {
      await emailTemplatesAPI.createTemplate(templateData)
      Swal.fire({
        title: "نجح",
        text: "تم إنشاء القالب بنجاح",
        icon: "success",
        confirmButtonText: "حسناً",
      })
    } else if (selectedTemplate.value) {
      await emailTemplatesAPI.updateTemplate(selectedTemplate.value.id, templateData)
      Swal.fire({
        title: "نجح",
        text: "تم تحديث القالب بنجاح",
        icon: "success",
        confirmButtonText: "حسناً",
      })
    }
    
    closeTemplateModal()
    await fetchEmailTemplates()
  } catch (error: any) {
    console.error("Failed to submit email template:", error)
    
    // Handle validation errors
    if (error.response?.data && typeof error.response.data === "object") {
      const errors = error.response.data as EmailTemplateError
      templateModalRef.value?.setErrors(errors)
    } else {
      Swal.fire({
        title: "خطأ",
        text: "فشل في حفظ القالب",
        icon: "error",
        confirmButtonText: "حسناً",
      })
    }
  } finally {
    isLoading.value = false
  }
}

// Delete email template
const handleDeleteTemplate = async (id: number, name: string) => {
  const result = await Swal.fire({
    title: "هل أنت متأكد؟",
    text: `هل تريد حذف القالب "${name}"؟ هذا الإجراء لا يمكن التراجع عنه.`,
    icon: "warning",
    showCancelButton: true,
    confirmButtonColor: "#d33",
    cancelButtonColor: "#3085d6",
    confirmButtonText: "نعم، احذف",
    cancelButtonText: "إلغاء",
  })
  
  if (result.isConfirmed) {
    try {
      isLoading.value = true
      await emailTemplatesAPI.deleteTemplate(id)
      Swal.fire({
        title: "تم الحذف",
        text: "تم حذف القالب بنجاح",
        icon: "success",
        confirmButtonText: "حسناً",
      })
      await fetchEmailTemplates()
    } catch (error) {
      console.error("Failed to delete template:", error)
      Swal.fire({
        title: "خطأ",
        text: "فشل في حذف القالب",
        icon: "error",
        confirmButtonText: "حسناً",
      })
    } finally {
      isLoading.value = false
    }
  }
}

// Toggle template active status
const handleToggleTemplateStatus = async (id: number, currentStatus: boolean) => {
  try {
    isLoading.value = true
    await emailTemplatesAPI.toggleTemplateStatus(id, !currentStatus)
    await fetchEmailTemplates()
  } catch (error) {
    console.error("Failed to toggle template status:", error)
    Swal.fire({
      title: "خطأ",
      text: "فشل في تغيير حالة القالب",
      icon: "error",
      confirmButtonText: "حسناً",
    })
  } finally {
    isLoading.value = false
  }
}

// Get category label in Arabic
const getCategoryLabel = (category: string): string => {
  const cat = TEMPLATE_CATEGORIES.find(c => c.value === category)
  return cat ? cat.label_ar : category
}

// Watch active tab
watch(activeTab, (newTab) => {
  searchInput.value = ""
  searchQuery.value = ""
  selectedFilter.value = ""
  
  if (newTab === "users") {
    fetchUsers()
  } else if (newTab === "cost-centers") {
    fetchCostCenters()
  } else if (newTab === "email-templates") {
    fetchEmailTemplates()
  }
})

// Watch search query and filter
watch([searchQuery, selectedFilter], () => {
  if (activeTab.value === "cost-centers") {
    fetchCostCenters()
  } else if (activeTab.value === "email-templates") {
    fetchEmailTemplates()
  }
})

// Initialize
onMounted(() => {
  fetchCostCenters()
})
</script>

<template>
  <section :class="$style.page" :data-theme="currentTheme" :dir="isRTL ? 'rtl' : 'ltr'">
    <header :class="$style.header">
      <div :class="$style.titleBlock">
        <h1 :class="$style.title">إدارة الرسائل</h1>
      </div>
      <button
        v-if="activeTab === 'cost-centers'"
        type="button"
        :class="$style.primaryAction"
        @click="openCreateModal"
      >
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M10 2.83331V16.1666" stroke="white" stroke-width="1.25" stroke-linecap="round" stroke-linejoin="round"/>
          <path d="M3.33594 9.5H16.6693" stroke="white" stroke-width="1.25" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
        إنشاء مركز تكلفة جديد
      </button>
      <button
        v-if="activeTab === 'email-templates'"
        type="button"
        :class="$style.primaryAction"
        @click="openCreateTemplateModal"
      >
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M10 2.83331V16.1666" stroke="white" stroke-width="1.25" stroke-linecap="round" stroke-linejoin="round"/>
          <path d="M3.33594 9.5H16.6693" stroke="white" stroke-width="1.25" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
        إنشاء قالب بريد إلكتروني جديد
      </button>
    </header>

    <nav :class="$style.tabs" aria-label="Message Management tabs">
      <button
        v-for="tab in tabs"
        :key="tab.id"
        type="button"
        :class="[$style.tabButton, activeTab === tab.id ? $style.tabActive : '']"
        @click="activeTab = tab.id"
      >
        {{ tab.label }}
      </button>
    </nav>

    <div :class="$style.contentArea">
      <div :class="$style.toolbar">
        <div :class="$style.searchGroup">
          <input
            v-model="searchInput"
            :class="$style.searchInput"
            type="search"
            :placeholder="
              activeTab === 'users' 
                ? 'ابحث في المستخدمين' 
                : activeTab === 'email-templates'
                ? 'ابحث في قوالب البريد الإلكتروني'
                : 'ابحث في مراكز التكلفة'
            "
            @input="applySearch"
            @keyup.enter="applySearch"
          />
        </div>
        <select v-model="selectedFilter" :class="$style.filterSelect">
          <option value="">فرز حسب</option>
          <template v-if="activeTab === 'users'">
            <option value="name">الاسم</option>
            <option value="email">البريد الإلكتروني</option>
          </template>
          <template v-else-if="activeTab === 'email-templates'">
            <option v-for="cat in TEMPLATE_CATEGORIES" :key="cat.value" :value="cat.value">
              {{ cat.label_ar }}
            </option>
          </template>
          <template v-else>
            <option value="active">نشط فقط</option>
            <option value="inactive">غير نشط فقط</option>
          </template>
        </select>
      </div>

      <!-- Loading State -->
      <div v-if="isLoading" :class="$style.loadingState">
        <div :class="$style.spinner"></div>
        <p>جاري التحميل...</p>
      </div>

      <!-- Cost Centers Tab -->
      <template v-else-if="activeTab === 'cost-centers'">
        <div v-if="costCenters.length" :class="$style.tableContainer">
          <div :class="$style.tableScroll">
            <table :class="$style.table">
              <thead>
                <tr>
                  <th :class="$style.headCell">الرمز</th>
                  <th :class="$style.headCell">الاسم</th>
                  <th :class="$style.headCell">المنسق المالى</th>
                  <th :class="$style.headCell">المدراء</th>
                  <th :class="$style.headCell">الحالة</th>
                  <th :class="$style.headCell">تاريخ الإنشاء</th>
                  <th :class="$style.headCell">الإجراءات</th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="costCenter in costCenters"
                  :key="costCenter.id"
                  :class="$style.tableRow"
                >
                  <td :class="$style.tableCell">{{ costCenter.cost_center_code }}</td>
                  <td :class="$style.tableCell">{{ costCenter.cost_center_name }}</td>
                  <td :class="$style.tableCell">{{ costCenter.recipient_count }}</td>
                  <td :class="$style.tableCell">{{ costCenter.cc_count }}</td>
                  <td :class="$style.tableCell">
                    <span
                      :class="[
                        $style.statusBadge,
                        costCenter.is_active ? $style.statusActive : $style.statusInactive
                      ]"
                    >
                      {{ costCenter.is_active ? "نشط" : "غير نشط" }}
                    </span>
                  </td>
                  <td :class="$style.tableCell">{{ formatDate(costCenter.created_at) }}</td>
                  <td :class="$style.tableCell">
                    <div :class="$style.actionButtons">
                      <button
                        type="button"
                        :class="$style.editButton"
                        @click="openEditModal(costCenter.id)"
                        title="تعديل"
                      >
                        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                          <path d="M11.333 2.00004C11.5081 1.82494 11.716 1.68605 11.9447 1.59129C12.1735 1.49653 12.4187 1.44775 12.6663 1.44775C12.914 1.44775 13.1592 1.49653 13.3879 1.59129C13.6167 1.68605 13.8246 1.82494 13.9997 2.00004C14.1748 2.17513 14.3137 2.383 14.4084 2.61178C14.5032 2.84055 14.552 3.08575 14.552 3.33337C14.552 3.58099 14.5032 3.82619 14.4084 4.05497C14.3137 4.28374 14.1748 4.49161 13.9997 4.66671L5.33301 13.3334L1.66634 14.3334L2.66634 10.6667L11.333 2.00004Z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                        </svg>
                      </button>
                      <button
                        type="button"
                        :class="$style.toggleButton"
                        @click="handleToggleStatus(costCenter.id, costCenter.is_active)"
                        :title="costCenter.is_active ? 'تعطيل' : 'تفعيل'"
                      >
                        <svg v-if="costCenter.is_active" width="16" height="16" viewBox="0 0 16 16" fill="none">
                          <path d="M8 14.6667C11.6819 14.6667 14.6667 11.6819 14.6667 8C14.6667 4.3181 11.6819 1.33333 8 1.33333C4.3181 1.33333 1.33333 4.3181 1.33333 8C1.33333 11.6819 4.3181 14.6667 8 14.6667Z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                          <path d="M8 10.6667V8" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                          <path d="M8 5.33333H8.00667" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                        </svg>
                        <svg v-else width="16" height="16" viewBox="0 0 16 16" fill="none">
                          <path d="M8 14.6667C11.6819 14.6667 14.6667 11.6819 14.6667 8C14.6667 4.3181 11.6819 1.33333 8 1.33333C4.3181 1.33333 1.33333 4.3181 1.33333 8C1.33333 11.6819 4.3181 14.6667 8 14.6667Z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                          <path d="M10 6L6 10" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                          <path d="M6 6L10 10" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                        </svg>
                      </button>
                      <button
                        type="button"
                        :class="$style.deleteButton"
                        @click="handleDelete(costCenter.id, costCenter.cost_center_name)"
                        title="حذف"
                      >
                        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                          <path d="M2 4H3.33333H14" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                          <path d="M5.33301 4.00004V2.66671C5.33301 2.31309 5.47348 1.97395 5.7235 1.7239C5.97353 1.47385 6.31267 1.33337 6.66634 1.33337H9.33301C9.68663 1.33337 10.0258 1.47385 10.2758 1.7239C10.5259 1.97395 10.6663 2.31309 10.6663 2.66671V4.00004M12.6663 4.00004V13.3334C12.6663 13.687 12.5259 14.0262 12.2758 14.2762C12.0258 14.5262 11.6867 14.6667 11.333 14.6667H4.66634C4.31272 14.6667 3.97358 14.5262 3.72353 14.2762C3.47348 14.0262 3.33301 13.687 3.33301 13.3334V4.00004H12.6663Z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                        </svg>
                      </button>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
        <div v-else :class="$style.emptyState">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" style="opacity: 0.3;">
            <path d="M19 21H5C4.46957 21 3.96086 20.7893 3.58579 20.4142C3.21071 20.0391 3 19.5304 3 19V5C3 4.46957 3.21071 3.96086 3.58579 3.58579C3.96086 3.21071 4.46957 3 5 3H19C19.5304 3 20.0391 3.21071 20.4142 3.58579C20.7893 3.96086 21 4.46957 21 5V19C21 19.5304 20.7893 20.0391 20.4142 20.4142C20.0391 20.7893 19.5304 21 19 21Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
          <p>لا توجد مراكز تكلفة مطابقة للمعايير الحالية.</p>
        </div>
      </template>

      <!-- Users Tab -->
      <template v-else-if="activeTab === 'users'">
        <div v-if="filteredUsers.length" :class="$style.tableContainer">
          <div :class="$style.tableScroll">
            <table :class="$style.table">
              <thead>
                <tr>
                  <th :class="$style.headCell">المعرف</th>
                  <th :class="$style.headCell">الاسم الكامل</th>
                  <th :class="$style.headCell">البريد الإلكتروني</th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="user in filteredUsers"
                  :key="user.id"
                  :class="$style.tableRow"
                >
                  <td :class="$style.tableCell">{{ user.id }}</td>
                  <td :class="$style.tableCell">{{ user.full_name }}</td>
                  <td :class="[$style.tableCell, $style.emailCell]">{{ user.email }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
        <div v-else :class="$style.emptyState">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" style="opacity: 0.3;">
            <path d="M20 21V19C20 17.9391 19.5786 16.9217 18.8284 16.1716C18.0783 15.4214 17.0609 15 16 15H8C6.93913 15 5.92172 15.4214 5.17157 16.1716C4.42143 16.9217 4 17.9391 4 19V21" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            <path d="M12 11C14.2091 11 16 9.20914 16 7C16 4.79086 14.2091 3 12 3C9.79086 3 8 4.79086 8 7C8 9.20914 9.79086 11 12 11Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
          <p>لا يوجد مستخدمون مطابقون للمعايير الحالية.</p>
        </div>
      </template>

      <!-- Email Templates Tab -->
      <template v-else-if="activeTab === 'email-templates'">
        <div v-if="emailTemplates.length" :class="$style.tableContainer">
          <div :class="$style.tableScroll">
            <table :class="$style.table">
              <thead>
                <tr>
                  <th :class="$style.headCell">الاسم</th>
                  <th :class="$style.headCell">الاسم بالعربية</th>
                  <th :class="$style.headCell">التصنيف</th>
                  <th :class="$style.headCell">الحالة</th>
                  <th :class="$style.headCell">تاريخ الإنشاء</th>
                  <th :class="$style.headCell">الإجراءات</th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="template in emailTemplates"
                  :key="template.id"
                  :class="$style.tableRow"
                >
                  <td :class="$style.tableCell">{{ template.name }}</td>
                  <td :class="$style.tableCell">{{ template.name_ar || '-' }}</td>
                  <td :class="$style.tableCell">{{ getCategoryLabel(template.category) }}</td>
                  <td :class="$style.tableCell">
                    <span
                      :class="[
                        $style.statusBadge,
                        template.is_active ? $style.statusActive : $style.statusInactive
                      ]"
                    >
                      {{ template.is_active ? "نشط" : "غير نشط" }}
                    </span>
                  </td>
                  <td :class="$style.tableCell">{{ formatDate(template.created_at) }}</td>
                  <td :class="$style.tableCell">
                    <div :class="$style.actionButtons">
                      <button
                        type="button"
                        :class="$style.editButton"
                        @click="openEditTemplateModal(template.id)"
                        title="تعديل"
                      >
                        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                          <path d="M11.333 2.00004C11.5081 1.82494 11.716 1.68605 11.9447 1.59129C12.1735 1.49653 12.4187 1.44775 12.6663 1.44775C12.914 1.44775 13.1592 1.49653 13.3879 1.59129C13.6167 1.68605 13.8246 1.82494 13.9997 2.00004C14.1748 2.17513 14.3137 2.383 14.4084 2.61178C14.5032 2.84055 14.552 3.08575 14.552 3.33337C14.552 3.58099 14.5032 3.82619 14.4084 4.05497C14.3137 4.28374 14.1748 4.49161 13.9997 4.66671L5.33301 13.3334L1.66634 14.3334L2.66634 10.6667L11.333 2.00004Z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                        </svg>
                      </button>
                      <button
                        type="button"
                        :class="$style.toggleButton"
                        @click="handleToggleTemplateStatus(template.id, template.is_active)"
                        :title="template.is_active ? 'تعطيل' : 'تفعيل'"
                      >
                        <svg v-if="template.is_active" width="16" height="16" viewBox="0 0 16 16" fill="none">
                          <path d="M8 14.6667C11.6819 14.6667 14.6667 11.6819 14.6667 8C14.6667 4.3181 11.6819 1.33333 8 1.33333C4.3181 1.33333 1.33333 4.3181 1.33333 8C1.33333 11.6819 4.3181 14.6667 8 14.6667Z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                          <path d="M8 10.6667V8" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                          <path d="M8 5.33333H8.00667" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                        </svg>
                        <svg v-else width="16" height="16" viewBox="0 0 16 16" fill="none">
                          <path d="M8 14.6667C11.6819 14.6667 14.6667 11.6819 14.6667 8C14.6667 4.3181 11.6819 1.33333 8 1.33333C4.3181 1.33333 1.33333 4.3181 1.33333 8C1.33333 11.6819 4.3181 14.6667 8 14.6667Z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                          <path d="M10 6L6 10" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                          <path d="M6 6L10 10" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                        </svg>
                      </button>
                      <button
                        type="button"
                        :class="$style.deleteButton"
                        @click="handleDeleteTemplate(template.id, template.name)"
                        title="حذف"
                      >
                        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                          <path d="M2 4H3.33333H14" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                          <path d="M5.33301 4.00004V2.66671C5.33301 2.31309 5.47348 1.97395 5.7235 1.7239C5.97353 1.47385 6.31267 1.33337 6.66634 1.33337H9.33301C9.68663 1.33337 10.0258 1.47385 10.2758 1.7239C10.5259 1.97395 10.6663 2.31309 10.6663 2.66671V4.00004M12.6663 4.00004V13.3334C12.6663 13.687 12.5259 14.0262 12.2758 14.2762C12.0258 14.5262 11.6867 14.6667 11.333 14.6667H4.66634C4.31272 14.6667 3.97358 14.5262 3.72353 14.2762C3.47348 14.0262 3.33301 13.687 3.33301 13.3334V4.00004H12.6663Z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                        </svg>
                      </button>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
        <div v-else :class="$style.emptyState">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" style="opacity: 0.3;">
            <path d="M3 8L10.89 13.26C11.5199 13.6728 12.4801 13.6728 13.11 13.26L21 8M5 19H19C19.5304 19 20.0391 18.7893 20.4142 18.4142C20.7893 18.0391 21 17.5304 21 17V7C21 6.46957 20.7893 5.96086 20.4142 5.58579C20.0391 5.21071 19.5304 5 19 5H5C4.46957 5 3.96086 5.21071 3.58579 5.58579C3.21071 5.96086 3 6.46957 3 7V17C3 17.5304 3.21071 18.0391 3.58579 18.4142C3.96086 18.7893 4.46957 19 5 19Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
          <p>لا توجد قوالب بريد إلكتروني مطابقة للمعايير الحالية.</p>
        </div>
      </template>
    </div>

    <!-- Cost Center Modal -->
    <teleport to="body">
      <div v-if="costCenterModalVisible" :class="$style.modalOverlay" @click.self="closeCostCenterModal">
        <section
          :class="$style.modalContainer"
          role="dialog"
          aria-modal="true"
          aria-labelledby="cost-center-modal-title"
        >
          <header :class="$style.modalHeader">
            <h2 id="cost-center-modal-title" :class="$style.modalTitle">
              {{ costCenterModalMode === "create" ? "إنشاء مركز تكلفة جديد" : "تعديل مركز التكلفة" }}
            </h2>
            <button
              type="button"
              :class="$style.closeButton"
              @click="closeCostCenterModal"
              aria-label="إغلاق النافذة"
            >
              <span aria-hidden="true">&times;</span>
            </button>
          </header>

          <div :class="$style.modalBody">
            <div :class="$style.formField">
              <label :class="$style.fieldLabel" for="cost_center_code">رمز مركز التكلفة *</label>
              <input
                id="cost_center_code"
                v-model="costCenterForm.cost_center_code"
                type="text"
                :class="[$style.fieldInput, getFieldError('cost_center_code') ? $style.fieldError : '']"
                placeholder="مثال: CC-001"
              />
              <span v-if="getFieldError('cost_center_code')" :class="$style.errorText">
                {{ getFieldError('cost_center_code') }}
              </span>
            </div>

            <div :class="$style.formField">
              <label :class="$style.fieldLabel" for="cost_center_name">اسم مركز التكلفة (إنجليزي) *</label>
              <input
                id="cost_center_name"
                v-model="costCenterForm.cost_center_name"
                type="text"
                :class="[$style.fieldInput, getFieldError('cost_center_name') ? $style.fieldError : '']"
                placeholder="مثال: Human Resources"
              />
              <span v-if="getFieldError('cost_center_name')" :class="$style.errorText">
                {{ getFieldError('cost_center_name') }}
              </span>
            </div>

            <!-- <div :class="$style.formField">
              <label :class="$style.fieldLabel" for="cost_center_name_ar">اسم مركز التكلفة (عربي)</label>
              <input
                id="cost_center_name_ar"
                v-model="costCenterForm.cost_center_name_ar"
                type="text"
                :class="[$style.fieldInput, getFieldError('cost_center_name_ar') ? $style.fieldError : '']"
                placeholder="مثال: الموارد البشرية"
              />
              <span v-if="getFieldError('cost_center_name_ar')" :class="$style.errorText">
                {{ getFieldError('cost_center_name_ar') }}
              </span>
            </div>

            <div :class="$style.formField">
              <label :class="$style.fieldLabel" for="description">الوصف (إنجليزي)</label>
              <textarea
                id="description"
                v-model="costCenterForm.description"
                :class="[$style.fieldTextarea, getFieldError('description') ? $style.fieldError : '']"
                rows="3"
                placeholder="وصف مركز التكلفة"
              ></textarea>
              <span v-if="getFieldError('description')" :class="$style.errorText">
                {{ getFieldError('description') }}
              </span>
            </div>

            <div :class="$style.formField">
              <label :class="$style.fieldLabel" for="description_ar">الوصف (عربي)</label>
              <textarea
                id="description_ar"
                v-model="costCenterForm.description_ar"
                :class="[$style.fieldTextarea, getFieldError('description_ar') ? $style.fieldError : '']"
                rows="3"
                placeholder="وصف مركز التكلفة بالعربية"
              ></textarea>
              <span v-if="getFieldError('description_ar')" :class="$style.errorText">
                {{ getFieldError('description_ar') }}
              </span>
            </div> -->

            <!-- Recipient Emails (TO Field) -->
            <div :class="$style.formField">
              <div :class="$style.fieldLabelRow">
                <label :class="$style.fieldLabel">المستلمين (TO)</label>
                <div :class="$style.fileActionButtons">
                  <button
                    type="button"
                    :class="$style.downloadTemplateButton"
                    @click="downloadEmailTemplate('recipient')"
                    title="تحميل قالب Excel"
                  >
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                      <path d="M14 10V12.6667C14 13.0203 13.8595 13.3594 13.6095 13.6095C13.3594 13.8595 13.0203 14 12.6667 14H3.33333C2.97971 14 2.64057 13.8595 2.39052 13.6095C2.14048 13.3594 2 13.0203 2 12.6667V10" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                      <path d="M4.66797 6.66669L8.0013 10L11.3346 6.66669" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                      <path d="M8 10V2" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                    </svg>
                    تحميل قالب
                  </button>
                  <button
                    type="button"
                    :class="$style.uploadButton"
                    @click="triggerRecipientFileUpload"
                    title="رفع ملف Excel"
                  >
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                      <path d="M14 10V12.6667C14 13.0203 13.8595 13.3594 13.6095 13.6095C13.3594 13.8595 13.0203 14 12.6667 14H3.33333C2.97971 14 2.64057 13.8595 2.39052 13.6095C2.14048 13.3594 2 13.0203 2 12.6667V10" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                      <path d="M11.3346 5.33331L8.0013 1.99998L4.66797 5.33331" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                      <path d="M8 2V10" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                    </svg>
                    رفع ملف
                  </button>
                  <input
                    ref="recipientFileInput"
                    type="file"
                    accept=".csv,.xlsx,.xls"
                    style="display: none;"
                    @change="handleRecipientFileUpload"
                  />
                </div>
              </div>
              
              <!-- Selected Recipients -->
              <div v-if="costCenterForm.recipient_emails && costCenterForm.recipient_emails.length" :class="$style.selectedChipsContainer">
                <div
                  v-for="email in costCenterForm.recipient_emails"
                  :key="email"
                  :class="$style.userChip"
                >
                  <div :class="$style.userChipContent">
                    <span :class="$style.userChipEmail">{{ email }}</span>
                  </div>
                  <button
                    type="button"
                    :class="$style.chipRemove"
                    @click="removeRecipientEmail(email)"
                    title="إزالة"
                  >
                    &times;
                  </button>
                </div>
              </div>

              <!-- Email Input -->
              <div :class="$style.emailInputGroup">
                <input
                  v-model="recipientEmailInput"
                  type="email"
                  :class="[$style.fieldInput, getFieldError('recipient_emails') ? $style.fieldError : '']"
                  placeholder="أدخل البريد الإلكتروني واضغط إضافة (مثال: user@example.com)"
                  @keyup.enter="addRecipientEmail"
                />
                <button
                  type="button"
                  :class="$style.addEmailButton"
                  @click="addRecipientEmail"
                  title="إضافة بريد إلكتروني"
                >
                  إضافة
                </button>
              </div>
              
              <span v-if="getFieldError('recipient_emails')" :class="$style.errorText">
                {{ getFieldError('recipient_emails') }}
              </span>
              <small :class="$style.fieldHint">المستلمون الرئيسيون للرسائل - أدخل البريد الإلكتروني يدوياً أو ارفع ملف Excel</small>
            </div>

            <!-- CC Emails -->
            <div :class="$style.formField">
              <div :class="$style.fieldLabelRow">
                <label :class="$style.fieldLabel">نسخة كربونية (CC)</label>
                <div :class="$style.fileActionButtons">
                  <button
                    type="button"
                    :class="$style.downloadTemplateButton"
                    @click="downloadEmailTemplate('cc')"
                    title="تحميل قالب Excel"
                  >
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                      <path d="M14 10V12.6667C14 13.0203 13.8595 13.3594 13.6095 13.6095C13.3594 13.8595 13.0203 14 12.6667 14H3.33333C2.97971 14 2.64057 13.8595 2.39052 13.6095C2.14048 13.3594 2 13.0203 2 12.6667V10" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                      <path d="M4.66797 6.66669L8.0013 10L11.3346 6.66669" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                      <path d="M8 10V2" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                    </svg>
                    تحميل قالب
                  </button>
                  <button
                    type="button"
                    :class="$style.uploadButton"
                    @click="triggerCCFileUpload"
                    title="رفع ملف Excel"
                  >
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                      <path d="M14 10V12.6667C14 13.0203 13.8595 13.3594 13.6095 13.6095C13.3594 13.8595 13.0203 14 12.6667 14H3.33333C2.97971 14 2.64057 13.8595 2.39052 13.6095C2.14048 13.3594 2 13.0203 2 12.6667V10" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                      <path d="M11.3346 5.33331L8.0013 1.99998L4.66797 5.33331" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                      <path d="M8 2V10" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                    </svg>
                    رفع ملف
                  </button>
                  <input
                    ref="ccFileInput"
                    type="file"
                    accept=".csv,.xlsx,.xls"
                    style="display: none;"
                    @change="handleCCFileUpload"
                  />
                </div>
              </div>
              
              <!-- Selected CCs -->
              <div v-if="costCenterForm.cc_emails && costCenterForm.cc_emails.length" :class="$style.selectedChipsContainer">
                <div
                  v-for="email in costCenterForm.cc_emails"
                  :key="email"
                  :class="$style.userChip"
                >
                  <div :class="$style.userChipContent">
                    <span :class="$style.userChipEmail">{{ email }}</span>
                  </div>
                  <button
                    type="button"
                    :class="$style.chipRemove"
                    @click="removeCCEmail(email)"
                    title="إزالة"
                  >
                    &times;
                  </button>
                </div>
              </div>

              <!-- Email Input -->
              <div :class="$style.emailInputGroup">
                <input
                  v-model="ccEmailInput"
                  type="email"
                  :class="[$style.fieldInput, getFieldError('cc_emails') ? $style.fieldError : '']"
                  placeholder="أدخل البريد الإلكتروني واضغط إضافة (مثال: user@example.com)"
                  @keyup.enter="addCCEmail"
                />
                <button
                  type="button"
                  :class="$style.addEmailButton"
                  @click="addCCEmail"
                  title="إضافة بريد إلكتروني"
                >
                  إضافة
                </button>
              </div>
              
              <span v-if="getFieldError('cc_emails')" :class="$style.errorText">
                {{ getFieldError('cc_emails') }}
              </span>
              <small :class="$style.fieldHint">المديرون والمشرفون الذين يحتاجون إلى متابعة الرسائل - أدخل البريد الإلكتروني يدوياً أو ارفع ملف Excel</small>
            </div>

            <div :class="$style.formField">
              <label :class="$style.checkboxLabel">
                <input
                  type="checkbox"
                  v-model="costCenterForm.is_active"
                  :class="$style.checkbox"
                />
                <span>مركز التكلفة نشط</span>
              </label>
            </div>
          </div>

          <footer :class="$style.modalActions">
            <button type="button" :class="$style.submitButton" @click="handleSubmit" :disabled="isLoading">
              {{ costCenterModalMode === "create" ? "إنشاء" : "تحديث" }}
            </button>
            <button type="button" :class="$style.cancelButton" @click="closeCostCenterModal" :disabled="isLoading">
              إلغاء
            </button>
          </footer>
        </section>
      </div>
    </teleport>

    <!-- Email Template Modal -->
    <EmailTemplateModal
      ref="templateModalRef"
      :visible="templateModalVisible"
      :mode="templateModalMode"
      :template="selectedTemplate"
      @close="closeTemplateModal"
      @submit="handleTemplateSubmit"
    />
  </section>
</template>

<style module src="./MessageManagement.module.css"></style>
