<script setup lang="ts">
import { computed, reactive, ref, watch } from "vue";
import { useAppStore } from "../../../stores/useAppStore";
import { useSimpleAuth } from '../../../composables/useSimpleAuth';
import { QuillEditor, Quill } from '@vueup/vue-quill';
import '@vueup/vue-quill/dist/vue-quill.snow.css';
import Swal from 'sweetalert2';
import { emailPostingAPI } from '@/services/emailPostingService';
import { emailRetrievalAPI } from '@/services/emailRetrievalService';
import EmailAttachments from '@/components/EmailAttachments/EmailAttachments.vue';
import { emailAttachmentService, formatFileSize, type EmailAttachment } from '@/services/emailAttachmentService';
import type { CostCenter, EmailTemplateOption, SendType } from '@/types/email-posting.types';
import type { InboxItem, InboxItemDetail, EmailLog, DraftItem, EmailStatus } from '@/types/email-retrieval.types';

// Register a paperclip icon for the custom "attachment" toolbar button (once)
const quillIcons = Quill.import('ui/icons') as Record<string, string>;
if (!quillIcons.attachment) {
  quillIcons.attachment =
    '<svg viewbox="0 0 18 18"><path class="ql-stroke" style="fill:none;stroke-width:1.5" d="M14.5 7.3l-6.1 6.1a3.2 3.2 0 0 1-4.6-4.6l6.1-6.1a2.1 2.1 0 0 1 3 3l-6.1 6.1a1 1 0 0 1-1.5-1.5l5.6-5.6"/></svg>';
}

type TabKey = "inbox" | "outbox" | "drafts" | "history";

const { user } = useSimpleAuth();
const isRegularUser = computed(() => user.value?.role === 'user');

const allTabs: Array<{ id: TabKey; label: string; adminOnly?: boolean }> = [
  { id: "inbox", label: "الصندوق الوارد" },
  { id: "outbox", label: "الصندوق الصادر", adminOnly: true },
  { id: "drafts", label: "المسودات", adminOnly: true },
  { id: "history", label: "سجل العمليات" },
];

const tabs = computed(() =>
  isRegularUser.value ? allTabs.filter(t => !t.adminOnly) : allTabs
);

const activeTab = ref<TabKey>("inbox");
const searchInput = ref("");
const searchQuery = ref("");

// Data from API
const inboxItems = ref<InboxItem[]>([]);
const outboxItems = ref<EmailLog[]>([]);
const draftItems = ref<DraftItem[]>([]);
const transactionItems = ref<EmailLog[]>([]);

// Pagination
const currentPage = ref(1);
const totalCount = ref(0);
const pageSize = ref(6);
const loading = ref(false);

// Status labels for history
const historyStatusLabel: Record<EmailStatus, string> = {
  SUCCESS: "تم الإرسال",
  PENDING: "قيد الإرسال",
  FAILED: "فشل الإرسال",
};

const historyStatusClassKey: Record<EmailStatus, string> = {
  SUCCESS: "statusSent",
  PENDING: "statusDraft",
  FAILED: "statusFailed",
};

const store = useAppStore();
const currentTheme = computed(() => store.currentTheme);
const isRTL = computed(() => store.isRTL);
const composeModalVisible = ref(false);
const draftNameModalVisible = ref(false);
const draftNameInput = ref("");
const editingDraftId = ref<number | null>(null);
const emailDetailModalVisible = ref(false);
const selectedEmailDetail = ref<EmailLog | null>(null);

// Load data based on active tab
const loadTabData = async () => {
  loading.value = true;
  try {
    switch (activeTab.value) {
      case 'inbox':
        await loadInbox();
        break;
      case 'outbox':
        await loadOutbox();
        break;
      case 'drafts':
        await loadDrafts();
        break;
      case 'history':
        await loadTransactions();
        break;
    }
  } catch (error) {
    console.error('Error loading tab data:', error);
    Swal.fire({
      icon: 'error',
      title: 'خطأ',
      text: 'فشل تحميل البيانات',
      confirmButtonText: 'حسناً'
    });
  } finally {
    loading.value = false;
  }
};

// Load inbox emails
const loadInbox = async () => {
  try {
    const response = await emailRetrievalAPI.getInbox({
      page: currentPage.value,
      page_size: pageSize.value,
      search: searchQuery.value || undefined,
      is_read: undefined // Add filters if needed
    });
    inboxItems.value = response.results;
    totalCount.value = response.count;
  } catch (error) {
    console.error('Failed to load inbox:', error);
    throw error;
  }
};

// Load outbox emails
const loadOutbox = async () => {
  try {
    const response = await emailRetrievalAPI.getOutbox({
      page: currentPage.value,
      page_size: pageSize.value,
      search: searchQuery.value || undefined
    });
    outboxItems.value = response.results;
    totalCount.value = response.count;
  } catch (error) {
    console.error('Failed to load outbox:', error);
    throw error;
  }
};

// Load drafts
const loadDrafts = async () => {
  try {
    const response = await emailRetrievalAPI.getDrafts({
      page: currentPage.value,
      page_size: pageSize.value,
      search: searchQuery.value || undefined
    });
    draftItems.value = response.results;
    totalCount.value = response.count;
  } catch (error) {
    console.error('Failed to load drafts:', error);
    throw error;
  }
};

// Load transactions
const loadTransactions = async () => {
  try {
    const response = await emailRetrievalAPI.getTransactions({
      page: currentPage.value,
      page_size: pageSize.value,
      search: searchQuery.value || undefined
    });
    transactionItems.value = response.results;
    totalCount.value = response.count;
  } catch (error) {
    console.error('Failed to load transactions:', error);
    throw error;
  }
};

// Watch for tab changes and search
watch(activeTab, () => {
  currentPage.value = 1;
  loadTabData();
});

watch([currentPage, searchQuery], () => {
  loadTabData();
});

// Initial load
loadTabData();

// Form data for email composition
const composeForm = reactive({
  sendType: "ANNOUNCEMENT" as SendType,
  subject: "",
  templateId: null as number | null,
  templateContent: "",
  costCenterIds: [] as number[],
});

// Form data lists
const costCenters = ref<CostCenter[]>([]);
const templates = ref<EmailTemplateOption[]>([]);
const loadingCostCenters = ref(false);
const loadingTemplates = ref(false);
const sendingEmail = ref(false);

const isSpecificSend = computed(() => composeForm.sendType === "SPECIFIC");

// Attachments state (compose)
const composeAttachmentsRef = ref<{ openFilePicker: () => void } | null>(null);
const composeAttachments = ref<EmailAttachment[]>([]);

// Quill editor configuration — custom paperclip button opens the file picker
const editorOptions = {
  modules: {
    toolbar: {
      container: [
        [{ header: [1, 2, 3, false] }],
        ['bold', 'italic', 'underline'],
        [{ color: [] }, { background: [] }],
        [{ align: [] }],
        [{ list: 'ordered' }, { list: 'bullet' }],
        ['link'],
        ['attachment'],
        ['clean']
      ],
      handlers: {
        attachment: () => composeAttachmentsRef.value?.openFilePicker()
      }
    }
  },
  placeholder: 'اكتب محتوى البريد الإلكتروني هنا...',
  theme: 'snow'
};

// Load cost centers and templates when modal opens
const openComposeModal = async () => {
  composeModalVisible.value = true;
  await Promise.all([loadCostCenters(), loadTemplates()]);
};

// Open draft for editing
const openDraftForEditing = async (draftId: number) => {
  try {
    loading.value = true;
    
    // Set editing ID first to prevent template from overriding content
    editingDraftId.value = draftId;
    
    // Fetch full draft details from API
    const draft = await emailRetrievalAPI.getDraftDetail(draftId);
    
    // Load the draft data into form
    composeForm.sendType = draft.send_type;
    composeForm.subject = draft.subject;
    composeForm.templateContent = draft.body_html;
    // Extract template ID from the template object (if exists)
    composeForm.templateId = draft.template ? draft.template.id : null;
    composeForm.costCenterIds = draft.cost_center_ids || [];
    // Load the draft's own attachments (owned by the draft, not borrowed)
    composeAttachments.value = ((draft as any).attachments as EmailAttachment[] | undefined) || [];
    
    // Open the compose modal
    await openComposeModal();
  } catch (error) {
    console.error('Failed to open draft:', error);
    editingDraftId.value = null; // Reset on error
    Swal.fire({
      icon: 'error',
      title: 'خطأ',
      text: 'فشل فتح المسودة',
      confirmButtonText: 'حسناً'
    });
  } finally {
    loading.value = false;
  }
};

const closeComposeModal = () => {
  composeModalVisible.value = false;
  editingDraftId.value = null;
  resetComposeForm();
};

const resetComposeForm = () => {
  composeForm.sendType = "ANNOUNCEMENT";
  composeForm.subject = "";
  composeForm.templateId = null;
  composeForm.templateContent = "";
  composeForm.costCenterIds = [];
  composeAttachments.value = [];
};

// Load cost centers for recipient selection
const loadCostCenters = async () => {
  loadingCostCenters.value = true;
  try {
    const response = await emailPostingAPI.getCostCenters({ is_active: true });
    costCenters.value = response.results;
  } catch (error) {
    console.error('Failed to load cost centers:', error);
    Swal.fire({
      icon: 'error',
      title: 'خطأ',
      text: 'فشل تحميل مراكز التكلفة',
      confirmButtonText: 'حسناً'
    });
  } finally {
    loadingCostCenters.value = false;
  }
};

// Load email templates
const loadTemplates = async () => {
  loadingTemplates.value = true;
  try {
    const response = await emailPostingAPI.getTemplates({ is_active: true });
    templates.value = response.results;
  } catch (error) {
    console.error('Failed to load templates:', error);
    Swal.fire({
      icon: 'error',
      title: 'خطأ',
      text: 'فشل تحميل القوالب',
      confirmButtonText: 'حسناً'
    });
  } finally {
    loadingTemplates.value = false;
  }
};

// Load template content into form
const loadTemplateContent = async (templateId: number | null) => {
  if (!templateId) {
    // Only clear if not editing a draft
    if (!editingDraftId.value) {
      composeForm.subject = "";
      composeForm.templateContent = "";
    }
    return;
  }

  try {
    const template = await emailPostingAPI.getTemplateById(templateId);
    // Only override subject/content if not editing a draft
    if (!editingDraftId.value) {
      composeForm.subject = template.subject;
      composeForm.templateContent = template.body_html;
      // Auto-carry the template's attachments (borrowed → removing is local only)
      const templateAttachments = (template as any).attachments as EmailAttachment[] | undefined;
      composeAttachments.value = (templateAttachments || []).map(a => ({ ...a, _local: true }));
    }
  } catch (error) {
    console.error('Failed to load template content:', error);
    Swal.fire({
      icon: 'error',
      title: 'خطأ',
      text: 'فشل تحميل محتوى القالب',
      confirmButtonText: 'حسناً'
    });
  }
};

// Download an attachment from the email detail view
const downloadDetailAttachment = async (attachment: EmailAttachment) => {
  try {
    await emailAttachmentService.download(attachment);
  } catch (error) {
    console.error('Download failed:', error);
    Swal.fire({
      icon: 'error',
      title: 'خطأ',
      text: 'تعذر تحميل المرفق',
      confirmButtonText: 'حسناً'
    });
  }
};

// Validate form
const validateForm = (): boolean => {
  if (!composeForm.subject.trim()) {
    Swal.fire({
      icon: 'warning',
      title: 'تنبيه',
      text: 'يرجى إدخال موضوع البريد',
      confirmButtonText: 'حسناً'
    });
    return false;
  }

  if (!composeForm.templateContent.trim()) {
    Swal.fire({
      icon: 'warning',
      title: 'تنبيه',
      text: 'يرجى إدخال محتوى البريد',
      confirmButtonText: 'حسناً'
    });
    return false;
  }

  if (composeForm.sendType === 'SPECIFIC' && composeForm.costCenterIds.length === 0) {
    Swal.fire({
      icon: 'warning',
      title: 'تنبيه',
      text: 'يرجى اختيار مركز تكلفة واحد على الأقل',
      confirmButtonText: 'حسناً'
    });
    return false;
  }

  return true;
};

// Send email
const handleSendCompose = async () => {
  // Validation
  if (!validateForm()) return;

  // Confirm sending
  const confirmResult = await Swal.fire({
    icon: 'question',
    title: 'تأكيد الإرسال',
    text: composeForm.sendType === 'ANNOUNCEMENT' 
      ? 'سيتم إرسال البريد لجميع مراكز التكلفة. هل تريد المتابعة؟'
      : `سيتم إرسال البريد إلى ${composeForm.costCenterIds.length} مركز تكلفة. هل تريد المتابعة؟`,
    showCancelButton: true,
    confirmButtonText: 'نعم، أرسل',
    cancelButtonText: 'إلغاء'
  });

  if (!confirmResult.isConfirmed) return;

  sendingEmail.value = true;

  try {
    const payload = {
      send_type: composeForm.sendType,
      subject: composeForm.subject,
      body_html: composeForm.templateContent,
      cost_center_ids: composeForm.sendType === 'SPECIFIC' ? composeForm.costCenterIds : undefined,
      template_id: composeForm.templateId,
      attachment_ids: composeAttachments.value.map(a => a.id)
    };

    const response = await emailPostingAPI.sendEmail(payload);

    await Swal.fire({
      icon: 'success',
      title: 'تم استلام طلب الإرسال',
      html: `
        <p>جارٍ إرسال البريد في الخلفية وسيصل المستلمون خلال لحظات.</p>
        <p>عدد مراكز التكلفة: <strong>${response.total_cost_centers}</strong></p>
      `,
      confirmButtonText: 'حسناً'
    });

    closeComposeModal();
  } catch (error: any) {
    console.error('Failed to send email:', error);
    
    const errorMessage = error.response?.data?.message 
      || error.response?.data?.detail 
      || 'فشل إرسال البريد الإلكتروني';

    Swal.fire({
      icon: 'error',
      title: 'خطأ في الإرسال',
      text: errorMessage,
      confirmButtonText: 'حسناً'
    });
  } finally {
    sendingEmail.value = false;
  }
};

// Save as draft
const handleSaveAsDraft = async () => {
  // Validation
  if (!validateForm()) return;

  // If editing existing draft, update directly without showing modal
  if (editingDraftId.value) {
    await confirmSaveDraft();
    return;
  }

  // Show draft name modal only for new drafts
  draftNameInput.value = "";
  draftNameModalVisible.value = true;
};

const closeDraftNameModal = () => {
  draftNameModalVisible.value = false;
  draftNameInput.value = "";
};

const confirmSaveDraft = async () => {
  sendingEmail.value = true;
  draftNameModalVisible.value = false;

  try {
    const draftData = {
      send_type: composeForm.sendType,
      subject: composeForm.subject,
      body_html: composeForm.templateContent,
      cost_center_ids: composeForm.sendType === 'SPECIFIC' ? composeForm.costCenterIds : undefined,
      draft_name: editingDraftId.value ? undefined : (draftNameInput.value.trim() || undefined),
      template_id: composeForm.templateId,
      attachment_ids: composeAttachments.value.map(a => a.id)
    };

    let draft;
    // Check if editing an existing draft or creating a new one
    if (editingDraftId.value) {
      draft = await emailPostingAPI.updateDraft(editingDraftId.value, draftData);
    } else {
      draft = await emailPostingAPI.saveDraft(draftData);
    }

    // Close compose modal first
    closeComposeModal();

    // Show success message
    await Swal.fire({
      icon: 'success',
      title: editingDraftId.value ? 'تم تحديث المسودة' : 'تم حفظ المسودة',
      html: `
        <p>${editingDraftId.value ? 'تم تحديث المسودة بنجاح' : 'تم حفظ المسودة بنجاح'}</p>
        ${draft.draft_name ? `<p>الاسم: <strong>${draft.draft_name}</strong></p>` : ''}
        <p>رقم المسودة: <strong>${draft.id}</strong></p>
      `,
      confirmButtonText: 'حسناً'
    });

    // Refresh the data
    await loadTabData();
  } catch (error: any) {
    console.error('Failed to save/update draft:', error);
    
    const errorMessage = error.response?.data?.message 
      || error.response?.data?.detail 
      || (editingDraftId.value ? 'فشل تحديث المسودة' : 'فشل حفظ المسودة');

    Swal.fire({
      icon: 'error',
      title: 'خطأ في الحفظ',
      text: errorMessage,
      confirmButtonText: 'حسناً'
    });
  } finally {
    sendingEmail.value = false;
    draftNameInput.value = "";
  }
};

// Delete draft
const handleDeleteDraft = async (draftId: number, draftName: string | null) => {
  // Confirm deletion
  const confirmResult = await Swal.fire({
    icon: 'warning',
    title: 'تأكيد الحذف',
    html: `
      <p>هل أنت متأكد من حذف هذه المسودة؟</p>
      ${draftName ? `<p><strong>${draftName}</strong></p>` : ''}
      <p style="color: #dc3545; font-size: 14px;">سيتم حذف المسودة بشكل نهائي.</p>
    `,
    showCancelButton: true,
    confirmButtonText: 'نعم، احذف',
    cancelButtonText: 'إلغاء',
    confirmButtonColor: '#dc3545',
    cancelButtonColor: '#6c757d'
  });

  if (!confirmResult.isConfirmed) return;

  try {
    loading.value = true;
    
    await emailPostingAPI.deleteDraft(draftId);

    await Swal.fire({
      icon: 'success',
      title: 'تم الحذف',
      text: 'تم حذف المسودة بنجاح',
      confirmButtonText: 'حسناً',
      timer: 2000
    });

    // Refresh the drafts list
    await loadTabData();
  } catch (error: any) {
    console.error('Failed to delete draft:', error);
    
    const errorMessage = error.response?.data?.message 
      || error.response?.data?.detail 
      || 'فشل حذف المسودة';

    Swal.fire({
      icon: 'error',
      title: 'خطأ في الحذف',
      text: errorMessage,
      confirmButtonText: 'حسناً'
    });
  } finally {
    loading.value = false;
  }
};

// Watch template selection
watch(
  () => composeForm.templateId,
  (newTemplateId) => {
    if (newTemplateId) {
      loadTemplateContent(newTemplateId);
    }
  }
);

// Clear cost centers when switching to announcement
watch(
  () => composeForm.sendType,
  (newType) => {
    if (newType === 'ANNOUNCEMENT') {
      composeForm.costCenterIds = [];
    }
  }
);

const applySearch = () => {
  searchQuery.value = searchInput.value.trim();
  currentPage.value = 1; // Reset to first page on search
};

// Computed properties for displaying data
const displayedInboxItems = computed(() => inboxItems.value);
const displayedOutboxItems = computed(() => outboxItems.value);
const displayedDraftItems = computed(() => draftItems.value);
const displayedTransactionItems = computed(() => transactionItems.value);

// Total pages calculation
const totalPages = computed(() => Math.ceil(totalCount.value / pageSize.value));

// Pagination handlers
const goToNextPage = () => {
  if (currentPage.value < totalPages.value) {
    currentPage.value++;
  }
};

const goToPreviousPage = () => {
  if (currentPage.value > 1) {
    currentPage.value--;
  }
};

const formatDate = (value: string) => {
  const date = new Date(value);
  return new Intl.DateTimeFormat("ar", {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(date);
};

const formatTime = (value: string) => {
  const date = new Date(value);
  return new Intl.DateTimeFormat("ar", {
    hour: "numeric",
    minute: "numeric",
  }).format(date);
};

const formatHistoryDate = (value: string) => {
  const date = new Date(value);
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const formatHistoryMeta = (value: string) => {
  return `${formatTime(value)} • ${formatHistoryDate(value)}`;
};

// Open outbox email detail
const openEmailDetail = async (emailId: number) => {
  try {
    loading.value = true;
    const detail = await emailRetrievalAPI.getOutboxDetail(emailId);
    selectedEmailDetail.value = detail;
    emailDetailModalVisible.value = true;
  } catch (error) {
    console.error('Failed to load outbox email detail:', error);
    Swal.fire({
      icon: 'error',
      title: 'خطأ',
      text: 'فشل تحميل تفاصيل البريد',
      confirmButtonText: 'حسناً'
    });
  } finally {
    loading.value = false;
  }
};

// Store the selected inbox item detail separately
const selectedInboxDetail = ref<InboxItemDetail | null>(null);

// Open inbox email detail
const openInboxDetail = async (inboxItemId: number) => {
  try {
    loading.value = true;
    const detail = await emailRetrievalAPI.getInboxDetail(inboxItemId);
    selectedInboxDetail.value = detail;
    selectedEmailDetail.value = detail.email;
    emailDetailModalVisible.value = true;
    
    // Reload inbox to update read status in the list
    if (activeTab.value === 'inbox') {
      await loadInbox();
    }
  } catch (error) {
    console.error('Failed to load inbox email detail:', error);
    Swal.fire({
      icon: 'error',
      title: 'خطأ',
      text: 'فشل تحميل تفاصيل البريد',
      confirmButtonText: 'حسناً'
    });
  } finally {
    loading.value = false;
  }
};

const closeEmailDetailModal = () => {
  emailDetailModalVisible.value = false;
  selectedEmailDetail.value = null;
  selectedInboxDetail.value = null;
};
</script>

<template>
  <section :class="$style.page" :data-theme="currentTheme" :dir="isRTL ? 'rtl' : 'ltr'">
    <header :class="$style.header">
      <div :class="$style.titleBlock">
        <h1 :class="$style.title">التواصل</h1>
      </div>
      <button v-if="!isRegularUser" type="button" :class="$style.primaryAction" @click="openComposeModal">
       <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M10 2.83331V16.1666" stroke="white" stroke-width="1.25" stroke-linecap="round" stroke-linejoin="round"/>
<path d="M3.33594 9.5H16.6693" stroke="white" stroke-width="1.25" stroke-linecap="round" stroke-linejoin="round"/>
</svg>

        إنشاء رسالة جديدة
      </button>
    </header>

    <nav :class="$style.tabs" aria-label="Communication tabs">
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
            placeholder="ابحث في الرسائل"
            @input="applySearch"
            @keyup.enter="applySearch"
          />
        </div>
      </div>

      <!-- Loading State -->
      <div v-if="loading" :class="$style.loadingState">
        <i class="fas fa-spinner fa-spin" style="font-size: 32px;"></i>
        <p>جاري التحميل...</p>
      </div>

      <!-- Inbox Tab -->
      <template v-else-if="activeTab === 'inbox'">
        <div v-if="displayedInboxItems.length" :class="$style.messagesList">
          <article
            v-for="item in displayedInboxItems"
            :key="item.id"
            :class="[$style.messageCard, !item.is_read ? $style.unread : '', $style.clickable]"
            @click="openInboxDetail(item.id)"
          >
            <div :class="$style.cardHeader">
              <div :class="$style.cardMain">
                <span :class="$style.icon">
                  <svg
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M2 12C2 8.22876 2 6.34315 3.17157 5.17157C4.34315 4 6.22876 4 10 4H14C17.7712 4 19.6569 4 20.8284 5.17157C22 6.34315 22 8.22876 22 12C22 15.7712 22 17.6569 20.8284 18.8284C19.6569 20 17.7712 20 14 20H10C6.22876 20 4.34315 20 3.17157 18.8284C2 17.6569 2 15.7712 2 12Z"
                      stroke="#A17D23"
                      stroke-width="1.5"
                    />
                    <path
                      d="M6 8L8.1589 9.79908C9.99553 11.3296 10.9139 12.0949 12 12.0949C13.0861 12.0949 14.0045 11.3296 15.8411 9.79908L18 8"
                      stroke="#A17D23"
                      stroke-width="1.5"
                      stroke-linecap="round"
                    />
                  </svg>
                </span>
                <div :class="$style.textBlock">
                  <h2 :class="$style.messageTitle">{{ item.email.subject }}</h2>
                  <p :class="$style.messageSubtitle">
                    من: {{ item.sender?.first_name }} {{ item.sender?.last_name }}
                    {{ item.is_to ? '' : '(نسخة)' }}
                  </p>
                  <p :class="$style.messageBody">
                    {{ item.email.send_type === 'ANNOUNCEMENT' ? '📢 إعلان عام' : '📧 رسالة محددة' }}
                  </p>
                </div>
              </div>
              <div :class="$style.meta">
                <span>{{ formatTime(item.email.sent_at) }}</span>
                <span>{{ formatDate(item.email.sent_at) }}</span>
                <span v-if="item.is_starred" style="color: #FFD700;">⭐</span>
              </div>
            </div>
          </article>
        </div>
        <div v-else :class="$style.emptyState">
          <i class="fas fa-inbox" style="font-size: 32px;"></i>
          <p>لا توجد رسائل واردة.</p>
        </div>
      </template>

      <!-- Outbox Tab -->
      <template v-else-if="activeTab === 'outbox'">
        <div v-if="displayedOutboxItems.length" :class="$style.messagesList">
          <article
            v-for="email in displayedOutboxItems"
            :key="email.id"
            :class="[$style.messageCard, $style.clickable]"
            @click="openEmailDetail(email.id)"
          >
            <div :class="$style.cardHeader">
              <div :class="$style.cardMain">
                <span :class="$style.icon">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="#A17D23" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                    <path d="M2 17L12 22L22 17" stroke="#A17D23" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                    <path d="M2 12L12 17L22 12" stroke="#A17D23" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                  </svg>
                </span>
                <div :class="$style.textBlock">
                  <h2 :class="$style.messageTitle">{{ email.subject }}</h2>
                  <p :class="$style.messageSubtitle">
                    {{ email.send_type === 'ANNOUNCEMENT' ? '📢 إعلان عام' : '📧 رسالة محددة' }}
                    • {{ email.recipient_count }} مستلم
                  </p>
                  <p :class="$style.messageBody">
                    <span :class="[$style.statusBadge, $style[historyStatusClassKey[email.email_status]]]">
                      {{ historyStatusLabel[email.email_status] }}
                    </span>
                  </p>
                </div>
              </div>
              <div :class="$style.meta">
                <span>{{ formatTime(email.sent_at) }}</span>
                <span>{{ formatDate(email.sent_at) }}</span>
              </div>
            </div>
          </article>
        </div>
        <div v-else :class="$style.emptyState">
          <i class="fas fa-paper-plane" style="font-size: 32px;"></i>
          <p>لا توجد رسائل مرسلة.</p>
        </div>
      </template>

      <!-- Drafts Tab -->
      <template v-else-if="activeTab === 'drafts'">
        <div v-if="displayedDraftItems.length" :class="$style.messagesList">
          <article
            v-for="draft in displayedDraftItems"
            :key="draft.id"
            :class="[$style.messageCard, $style.clickable]"
            @click.stop="openDraftForEditing(draft.id)"
          >
            <div :class="$style.cardHeader">
              <div :class="$style.cardMain">
                <span :class="$style.icon" @click.stop="openDraftForEditing(draft.id)">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M11 4H4C3.46957 4 2.96086 4.21071 2.58579 4.58579C2.21071 4.96086 2 5.46957 2 6V20C2 20.5304 2.21071 21.0391 2.58579 21.4142C2.96086 21.7893 3.46957 22 4 22H18C18.5304 22 19.0391 21.7893 19.4142 21.4142C19.7893 21.0391 20 20.5304 20 20V13" stroke="#A17D23" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                    <path d="M18.5 2.50001C18.8978 2.10219 19.4374 1.87869 20 1.87869C20.5626 1.87869 21.1022 2.10219 21.5 2.50001C21.8978 2.89784 22.1213 3.43741 22.1213 4.00001C22.1213 4.56262 21.8978 5.10219 21.5 5.50001L12 15L8 16L9 12L18.5 2.50001Z" stroke="#A17D23" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                  </svg>
                </span>
                <div :class="$style.textBlock">
                  <h2 :class="$style.messageTitle">{{ draft.subject }}</h2>
                  <p :class="$style.messageSubtitle">
                    {{ draft.draft_name || 'مسودة بدون اسم' }}
                  </p>
                  <p :class="$style.messageBody">
                    {{ draft.send_type === 'ANNOUNCEMENT' ? '📢 إعلان عام' : '📧 رسالة محددة' }}
                  </p>
                </div>
              </div>
              <div :class="$style.meta">
                <button
                  type="button"
                  :class="$style.deleteButton"
                  @click.stop="handleDeleteDraft(draft.id, draft.draft_name)"
                  title="حذف المسودة"
                >
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M2.5 5H4.16667H17.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                    <path d="M6.66797 5.00016V3.3335C6.66797 2.89147 6.84356 2.46754 7.15612 2.15498C7.46868 1.84242 7.89261 1.66683 8.33464 1.66683H11.668C12.11 1.66683 12.5339 1.84242 12.8465 2.15498C13.159 2.46754 13.3346 2.89147 13.3346 3.3335V5.00016M15.8346 5.00016V16.6668C15.8346 17.1089 15.659 17.5328 15.3465 17.8454C15.0339 18.1579 14.61 18.3335 14.168 18.3335H5.83464C5.39261 18.3335 4.96868 18.1579 4.65612 17.8454C4.34356 17.5328 4.16797 17.1089 4.16797 16.6668V5.00016H15.8346Z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                    <path d="M8.33203 9.16683V14.1668" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                    <path d="M11.668 9.16683V14.1668" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                  </svg>
                </button>
                <span>{{ formatTime(draft.updated_at) }}</span>
                <span>{{ formatDate(draft.updated_at) }}</span>
              </div>
            </div>
          </article>
        </div>
        <div v-else :class="$style.emptyState">
          <i class="fas fa-file-alt" style="font-size: 32px;"></i>
          <p>لا توجد مسودات.</p>
        </div>
      </template>

      <!-- Transactions/History Tab -->
      <template v-else-if="activeTab === 'history'">
        <div
          v-if="displayedTransactionItems.length"
          :class="$style.historyTableContainer"
          :data-theme="currentTheme"
        >
          <div :class="$style.historyTableScroll">
            <table :class="$style.historyTable">
              <thead>
                <tr>
                  <th :class="$style.historyHeadCell">المستخدم</th>
                  <th :class="$style.historyHeadCell">النوع</th>
                  <th :class="$style.historyHeadCell">الموضوع</th>
                  <th :class="$style.historyHeadCell">مركز التكلفة</th>
                  <th :class="$style.historyHeadCell">عدد المستلمين</th>
                  <th :class="$style.historyHeadCell">الحالة</th>
                  <th :class="$style.historyHeadCell">التاريخ</th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="transaction in displayedTransactionItems"
                  :key="transaction.id"
                  :class="$style.historyRow"
                >
                  <td :class="$style.historyCell">
                    {{ transaction.user?.first_name }} {{ transaction.user?.last_name }}
                  </td>
                  <td :class="$style.historyCell">
                    {{ transaction.email_type === 'SENT' ? '📤 مرسل' : '📬 مستلم' }}
                  </td>
                  <td :class="$style.historyCell">
                    <div :class="$style.subjectCell">
                      <span :class="$style.subjectTitle">{{ transaction.subject }}</span>
                      <span :class="$style.subjectMeta">
                        {{ transaction.send_type === 'ANNOUNCEMENT' ? '📢 إعلان عام' : '📧 رسالة محددة' }}
                      </span>
                    </div>
                  </td>
                  <td :class="$style.historyCell">
                    {{ transaction.cost_center?.cost_center_name || 'الكل' }}
                  </td>
                  <td :class="$style.historyCell">{{ transaction.recipient_count }}</td>
                  <td :class="[$style.historyCell, $style.statusCell]">
                    <span
                      :class="[$style.statusBadge, $style[historyStatusClassKey[transaction.email_status]]]"
                    >
                      {{ historyStatusLabel[transaction.email_status] }}
                    </span>
                  </td>
                  <td :class="$style.historyCell">
                    {{ formatHistoryMeta(transaction.sent_at) }}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
        <div v-else :class="$style.emptyState">
          <i class="fas fa-database" style="font-size: 32px;"></i>
          <p>لا توجد معاملات.</p>
        </div>
      </template>

      <!-- Pagination -->
      <div v-if="!loading && totalCount > 0" :class="$style.pagination">
                <button
          :class="$style.paginationButton"
          :disabled="currentPage >= totalPages"
          @click="goToNextPage"
        >
          التالي →
        </button>

        <span :class="$style.paginationInfo">
          صفحة {{ currentPage }} من {{ totalPages }} ({{ totalCount }} عنصر)
        </span>
        <button
          :class="$style.paginationButton"
          :disabled="currentPage === 1"
          @click="goToPreviousPage"
        >
          ← السابق
        </button>
            </div>
    </div>

    <teleport to="body">
      <div v-if="composeModalVisible" :class="$style.modalOverlay">
        <section
          :class="$style.modalContainer"
          role="dialog"
          aria-modal="true"
          aria-labelledby="compose-modal-title"
        >
          <header :class="$style.modalHeader">
            <h2 id="compose-modal-title" :class="$style.modalTitle">
              {{ editingDraftId ? 'تعديل المسودة' : 'إنشاء رسالة جديدة' }}
            </h2>
            <button
              type="button"
              :class="$style.closeButton"
              @click="closeComposeModal"
              aria-label="إغلاق النافذة"
            >
              <span aria-hidden="true">&times;</span>
            </button>
          </header>

          <div :class="$style.modalBody">
            <!-- Send Type -->
            <div :class="$style.formField">
              <label :class="$style.fieldLabel" for="sendType">نوع الإرسال *</label>
              <select
                id="sendType"
                v-model="composeForm.sendType"
                :class="$style.fieldSelect"
                :disabled="sendingEmail"
              >
                <option value="ANNOUNCEMENT">📢 إعلان عام (جميع مراكز التكلفة)</option>
                <option value="SPECIFIC">📧 إعلان محدد (مراكز تكلفة معينة)</option>
              </select>
            </div>

            <!-- Cost Centers Selection (only for SPECIFIC type) -->
            <div v-if="isSpecificSend" :class="$style.formField">
              <label :class="$style.fieldLabel" for="costCenters">مراكز التكلفة *</label>
              <div v-if="loadingCostCenters" :class="$style.loadingText">
                <i class="fas fa-spinner fa-spin"></i> جاري التحميل...
              </div>
              <select
                v-else
                id="costCenters"
                v-model="composeForm.costCenterIds"
                :class="$style.fieldSelect"
                :disabled="sendingEmail"
                multiple
                size="6"
              >
                <option
                  v-for="center in costCenters"
                  :key="center.id"
                  :value="center.id"
                >
                  {{ center.cost_center_code }} - {{ center.cost_center_name }}
                  ({{ center.recipient_count }} مستلمين، {{ center.cc_count }} نسخ)
                </option>
              </select>
              <small :class="$style.fieldHint">
                اضغط Ctrl (أو Cmd على Mac) لاختيار عدة مراكز تكلفة
              </small>
            </div>

            <!-- Template Selection -->
            <div :class="$style.formField">
              <label :class="$style.fieldLabel" for="templateSelect">اختيار قالب (اختياري)</label>
              <div v-if="loadingTemplates" :class="$style.loadingText">
                <i class="fas fa-spinner fa-spin"></i> جاري التحميل...
              </div>
              <select
                v-else
                id="templateSelect"
                v-model="composeForm.templateId"
                :class="$style.fieldSelect"
                :disabled="sendingEmail"
              >
                <option :value="null">-- اختر قالباً --</option>
                <option
                  v-for="template in templates"
                  :key="template.id"
                  :value="template.id"
                >
                  {{ template.name }} ({{ template.category }})
                </option>
              </select>
              <small :class="$style.fieldHint">
                القوالب توفر نقطة انطلاق. يمكنك تعديل المحتوى قبل الإرسال.
              </small>
            </div>

            <!-- Subject -->
            <div :class="$style.formField">
              <label :class="$style.fieldLabel" for="subject">الموضوع *</label>
              <input
                id="subject"
                v-model="composeForm.subject"
                type="text"
                :class="$style.fieldInput"
                placeholder="أدخل موضوع الرسالة"
                :disabled="sendingEmail"
                maxlength="500"
              />
            </div>

            <!-- Email Body (Rich Text Editor) -->
            <div :class="$style.formField">
              <label :class="$style.fieldLabel">محتوى البريد الإلكتروني *</label>
              <QuillEditor
                v-model:content="composeForm.templateContent"
                contentType="html"
                :options="editorOptions"
                :class="$style.richTextEditor"
                :enable="!sendingEmail"
              />
              <small :class="$style.fieldHint">
                استخدم شريط الأدوات لتنسيق النص، إضافة روابط، ومرفقات
              </small>

              <!-- Attachments -->
              <EmailAttachments
                ref="composeAttachmentsRef"
                v-model="composeAttachments"
                :disabled="sendingEmail"
              />
            </div>
          </div>

          <footer :class="$style.modalActions">
            <button 
              type="button" 
              :class="$style.sendButton" 
              @click="handleSendCompose"
              :disabled="sendingEmail"
            >
              <i v-if="sendingEmail" class="fas fa-spinner fa-spin"></i>
              {{ sendingEmail ? 'جاري الإرسال...' : '📤 إرسال' }}
            </button>
            <button 
              type="button" 
              :class="$style.draftButton" 
              @click="handleSaveAsDraft"
              :disabled="sendingEmail"
            >
              {{ editingDraftId ? '💾 تحديث المسودة' : '💾 حفظ كمسودة' }}
            </button>
            <button 
              type="button" 
              :class="$style.cancelButton" 
              @click="closeComposeModal"
              :disabled="sendingEmail"
            >
              إلغاء
            </button>
          </footer>
        </section>
      </div>
    </teleport>

    <!-- Draft Name Modal (appears above compose modal) -->
    <teleport to="body">
      <div v-if="draftNameModalVisible" :class="$style.modalOverlay" style="z-index: 1300;">
        <section
          :class="$style.draftModalContainer"
          role="dialog"
          aria-modal="true"
          aria-labelledby="draft-modal-title"
        >
          <header :class="$style.modalHeader">
            <h2 id="draft-modal-title" :class="$style.modalTitle">
              {{ editingDraftId ? 'تحديث المسودة' : 'حفظ كمسودة' }}
            </h2>
            <button
              type="button"
              :class="$style.closeButton"
              @click="closeDraftNameModal"
              aria-label="إغلاق النافذة"
            >
              <span aria-hidden="true">&times;</span>
            </button>
          </header>

          <div :class="$style.modalBody">
            <div :class="$style.formField">
              <label :class="$style.fieldLabel" for="draftName">اسم المسودة (اختياري)</label>
              <input
                id="draftName"
                v-model="draftNameInput"
                type="text"
                :class="$style.fieldInput"
                placeholder="أدخل اسماً مميزاً للمسودة"
                :disabled="sendingEmail"
                maxlength="200"
                @keyup.enter="confirmSaveDraft"
              />
              <small :class="$style.fieldHint">
                يمكنك ترك هذا الحقل فارغاً لحفظ المسودة بدون اسم محدد
              </small>
            </div>
          </div>

          <footer :class="$style.modalActions">
            <button 
              type="button" 
              :class="$style.sendButton" 
              @click="confirmSaveDraft"
              :disabled="sendingEmail"
            >
              <i v-if="sendingEmail" class="fas fa-spinner fa-spin"></i>
              {{ sendingEmail ? 'جاري الحفظ...' : '💾 حفظ' }}
            </button>
            <button 
              type="button" 
              :class="$style.cancelButton" 
              @click="closeDraftNameModal"
              :disabled="sendingEmail"
            >
              إلغاء
            </button>
          </footer>
        </section>
      </div>
    </teleport>

    <!-- Email Detail Modal (for viewing email details) -->
    <teleport to="body">
      <div v-if="emailDetailModalVisible" :class="$style.modalOverlay">
        <section
          :class="$style.modalContainer"
          role="dialog"
          aria-modal="true"
          aria-labelledby="email-detail-modal-title"
        >
          <header :class="$style.modalHeader">
            <h2 id="email-detail-modal-title" :class="$style.modalTitle">
              {{ activeTab === 'inbox' ? 'تفاصيل البريد الوارد' : 'تفاصيل البريد المرسل' }}
            </h2>
            <button
              type="button"
              :class="$style.closeButton"
              @click="closeEmailDetailModal"
              aria-label="إغلاق النافذة"
            >
              <span aria-hidden="true">&times;</span>
            </button>
          </header>

          <div v-if="loading && !selectedEmailDetail" :class="$style.modalBody">
            <div :class="$style.loadingState">
              <i class="fas fa-spinner fa-spin" style="font-size: 32px;"></i>
              <p>جاري التحميل...</p>
            </div>
          </div>

          <div v-else-if="selectedEmailDetail" :class="$style.modalBody">
            <!-- Email Info -->
            <div :class="$style.emailDetailInfo">
              <!-- Inbox-specific info -->
              <div v-if="selectedInboxDetail" :class="$style.detailRow">
                <strong>من:</strong>
                <span>
                  {{ selectedInboxDetail.sender.first_name }} {{ selectedInboxDetail.sender.last_name }}
                  ({{ selectedInboxDetail.sender.email }})
                  {{ selectedInboxDetail.is_to ? '' : ' - نسخة (CC)' }}
                </span>
              </div>

              <div v-if="selectedInboxDetail" :class="$style.detailRow">
                <strong>الحالة:</strong>
                <span>
                  {{ selectedInboxDetail.is_read ? '✓ مقروء' : '● غير مقروء' }}
                  <span v-if="selectedInboxDetail.is_starred" style="margin-inline-start: 8px;">⭐</span>
                  <span v-if="selectedInboxDetail.is_archived" style="margin-inline-start: 8px;">📦 مؤرشف</span>
                </span>
              </div>

              <div v-if="selectedInboxDetail && selectedInboxDetail.read_at" :class="$style.detailRow">
                <strong>تاريخ القراءة:</strong>
                <span>{{ formatDate(selectedInboxDetail.read_at) }} - {{ formatTime(selectedInboxDetail.read_at) }}</span>
              </div>

              <div :class="$style.detailRow">
                <strong>الموضوع:</strong>
                <span>{{ selectedEmailDetail.subject }}</span>
              </div>

              <div :class="$style.detailRow">
                <strong>النوع:</strong>
                <span>
                  {{ selectedEmailDetail.send_type === 'ANNOUNCEMENT' ? '📢 إعلان عام' : '📧 رسالة محددة' }}
                </span>
              </div>

              <div :class="$style.detailRow">
                <strong>حالة الإرسال:</strong>
                <span :class="[$style.statusBadge, $style[historyStatusClassKey[selectedEmailDetail.email_status]]]">
                  {{ historyStatusLabel[selectedEmailDetail.email_status] }}
                </span>
              </div>


              <div :class="$style.detailRow">
                <strong>تاريخ الإرسال:</strong>
                <span>{{ formatDate(selectedEmailDetail.sent_at) }} - {{ formatTime(selectedEmailDetail.sent_at) }}</span>
              </div>

              <div v-if="selectedEmailDetail.cost_center" :class="$style.detailRow">
                <strong>مركز التكلفة:</strong>
                <span>{{ selectedEmailDetail.cost_center.cost_center_name }}</span>
              </div>

              <div v-if="selectedEmailDetail.template" :class="$style.detailRow">
                <strong>القالب المستخدم:</strong>
                <span>{{ selectedEmailDetail.template.name }}</span>
              </div>

              <div v-if="selectedEmailDetail.email_error" :class="$style.detailRow">
                <strong style="color: #dc3545;">رسالة الخطأ:</strong>
                <span style="color: #dc3545;">{{ selectedEmailDetail.email_error }}</span>
              </div>
            </div>

            <!-- Email Body -->
            <div v-if="selectedEmailDetail.body_html" :class="$style.emailBodySection">
              <h3 :class="$style.sectionTitle">محتوى البريد:</h3>
              <div :class="$style.emailBodyContent" v-html="selectedEmailDetail.body_html"></div>
            </div>

            <!-- Attachments -->
            <div v-if="selectedEmailDetail.attachments && selectedEmailDetail.attachments.length" :class="$style.recipientsSection">
              <h3 :class="$style.sectionTitle">المرفقات ({{ selectedEmailDetail.attachments.length }}):</h3>
              <ul :class="$style.detailAttachmentList">
                <li
                  v-for="att in selectedEmailDetail.attachments"
                  :key="att.id"
                  :class="$style.detailAttachmentItem"
                  @click="downloadDetailAttachment(att)"
                >
                  <span :class="$style.detailAttachmentName">📎 {{ att.original_filename }}</span>
                  <span :class="$style.detailAttachmentSize">{{ formatFileSize(att.file_size) }}</span>
                </li>
              </ul>
            </div>

            <!-- Recipients List -->
            <div v-if="selectedEmailDetail.recipient_emails && selectedEmailDetail.recipient_emails.length" :class="$style.recipientsSection">
              <h3 :class="$style.sectionTitle">المستلمون ({{ selectedEmailDetail.recipient_emails.length }}):</h3>
              <div :class="$style.recipientsList">
                <span
                  v-for="(email, index) in selectedEmailDetail.recipient_emails"
                  :key="index"
                  :class="$style.recipientTag"
                >
                  {{ email }}
                </span>
              </div>
            </div>

            <!-- CC List -->
            <div v-if="selectedEmailDetail.cc_emails && selectedEmailDetail.cc_emails.length" :class="$style.recipientsSection">
              <h3 :class="$style.sectionTitle">CC ({{ selectedEmailDetail.cc_emails.length }}):</h3>
              <div :class="$style.recipientsList">
                <span
                  v-for="(email, index) in selectedEmailDetail.cc_emails"
                  :key="index"
                  :class="$style.recipientTag"
                >
                  {{ email }}
                </span>
              </div>
            </div>
          </div>

          <footer :class="$style.modalActions">
            <button 
              type="button" 
              :class="$style.cancelButton" 
              @click="closeEmailDetailModal"
            >
              إغلاق
            </button>
          </footer>
        </section>
      </div>
    </teleport>
  </section>
</template>

<style module src="./Communication.module.css"></style>
