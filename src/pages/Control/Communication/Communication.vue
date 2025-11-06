<script setup lang="ts">
import { computed, reactive, ref, watch } from "vue";
import { useAppStore } from "../../../stores/useAppStore";

type TabKey = "inbox" | "outbox" | "drafts" | "history";
type MessageTab = Exclude<TabKey, "history">;

type Message = {
  id: number;
  tab: MessageTab;
  title: string;
  subtitle: string;
  description: string;
  timestamp: string;
  icon?: string;
};

type HistoryStatus = "sent" | "draft" | "failed";

type HistoryRecord = {
  id: number;
  subject: string;
  template: string;
  email: string;
  costCenter: string;
  timestamp: string;
  status: HistoryStatus;
};

const tabs: Array<{ id: TabKey; label: string }> = [
  { id: "inbox", label: "الصندوق الوارد" },
  { id: "outbox", label: "الصندوق الصادر" },
  { id: "drafts", label: "المسودات" },
  { id: "history", label: "سجل العمليات" },
];

const activeTab = ref<TabKey>("inbox");
const searchInput = ref("");
const searchQuery = ref("");
const selectedFilter = ref("");

const messages = ref<Message[]>([
  {
    id: 1,
    tab: "inbox",
    title: "طلب موافقة على الاستبيان السنوي",
    subtitle: "من: إدارة العمليات",
    description:
      "يرجى مراجعة الاستبيان السنوي الخاص بالإدارات وإرسال أي تعديلات مطلوبة قبل نهاية الأسبوع.",
    timestamp: "2024-05-18T09:30:00",
    icon: "fas fa-envelope",
  },
  {
    id: 2,
    tab: "inbox",
    title: "تذكير باجتماع لجنة الجودة",
    subtitle: "من: قسم الجودة",
    description:
      "سيعقد اجتماع لجنة الجودة يوم الاثنين القادم تمام الساعة 10 صباحاً بتوقيت أبوظبي.",
    timestamp: "2024-05-17T14:15:00",
    icon: "fas fa-calendar",
  },
  {
    id: 3,
    tab: "outbox",
    title: "إرسال نتائج استطلاع الموظفين",
    subtitle: "إلى: إدارة الموارد البشرية",
    description:
      "تمت مشاركة التقرير النهائي لنتائج استطلاع الموظفين مع إدارة الموارد البشرية مع التوصيات.",
    timestamp: "2024-05-16T16:45:00",
    icon: "fas fa-paper-plane",
  },
  {
    id: 4,
    tab: "drafts",
    title: "إعداد حملة تواصل داخلي",
    subtitle: "مسودة غير مكتملة",
    description:
      "المسودة تحتوي على الخطوط العريضة للحملة الجديدة، وبحاجة إلى مراجعة من فريق المحتوى.",
    timestamp: "2024-05-15T11:10:00",
    icon: "fas fa-pen-to-square",
  },
]);

const historyRecords = ref<HistoryRecord[]>([
  {
    id: 101,
    subject: "دعوة: استبيان الربع الرابع 2025",
    template: "قالب الدعوات الرسمية",
    email: "seif778811@gmail.com",
    costCenter: "مركز تكلفة التسويق",
    timestamp: "2025-11-04T08:00:00",
    status: "sent",
  },
  {
    id: 102,
    subject: "تذكير: آخر موعد للاستبيان",
    template: "قالب التذكير",
    email: "kareem@gmail.com",
    costCenter: "مركز تكلفة المبيعات",
    timestamp: "2025-11-04T20:00:00",
    status: "sent",
  },
  {
    id: 103,
    subject: "استبيان تقييم الأداء السنوي",
    template: "قالب التقييم السنوي",
    email: "se8811@gmail.com",
    costCenter: "مركز تكلفة المالية",
    timestamp: "2025-11-04T08:00:00",
    status: "sent",
  },
  {
    id: 104,
    subject: "إعلان: تحديث سياسات العمل",
    template: "قالب الإعلانات العامة",
    email: "saif778811@gmail.com",
    costCenter: "مركز تكلفة الموارد البشرية",
    timestamp: "2025-11-04T14:00:00",
    status: "sent",
  },
  {
    id: 105,
    subject: "استبيان رضا الموظفين - Q4",
    template: "قالب الإعلانات العامة",
    email: "fady@gmail.com",
    costCenter: "مركز تكلفة تقنية المعلومات",
    timestamp: "2025-11-04T08:00:00",
    status: "sent",
  },
  {
    id: 106,
    subject: "إعلان: تحديث سياسات العمل",
    template: "قالب الاستبيانات",
    email: "saif778811@gmail.com",
    costCenter: "مركز تكلفة تقنية المعلومات",
    timestamp: "2025-11-04T17:00:00",
    status: "draft",
  },
  {
    id: 107,
    subject: "تذكير: استبيان الربع الرابع 2025",
    template: "قالب التذكير",
    email: "mid778811@gmail.com",
    costCenter: "مركز تكلفة التسويق",
    timestamp: "2025-11-04T03:00:00",
    status: "sent",
  },
  {
    id: 108,
    subject: "دعوة: استبيان الربع الرابع 2025",
    template: "قالب الدعوات الرسمية",
    email: "saeif778811@gmail.com",
    costCenter: "مركز تكلفة المبيعات",
    timestamp: "2025-11-04T04:00:00",
    status: "sent",
  },
]);

const historyStatusLabel: Record<HistoryStatus, string> = {
  sent: "تم الإرسال",
  draft: "مسودة",
  failed: "فشل الإرسال",
};

const historyStatusClassKey: Record<HistoryStatus, string> = {
  sent: "statusSent",
  draft: "statusDraft",
  failed: "statusFailed",
};

const DEFAULT_TEMPLATE_HTML = `<div style="font-family: Cairo, sans-serif; padding: 20px; background: #fff; border-right: 4px solid #A17D23;"><h2 style="color: #A17D23; margin-bottom: 16px;">⚠️ تنبيه مهم</h2><p style="line-height: 1.8; margin-bottom: 12px;">عزيزي الموظف،</p><p style="line-height: 1.8; margin-bottom: 12px; background: #FFF9E6; padding: 12px; border-radius: 8px;">[اكتب المحتوى هنا]</p><p style="line-height: 1.8; margin-bottom: 12px;">شكراً لتفهمكم.</p><p style="line-height: 1.8; margin-top: 24px;">فريق العمل</p></div>`;

const TEMPLATE_OPTIONS = [
  {
    id: "alert",
    label: "تنبيه مهم",
    subject: "تنبيه جديد",
    content: DEFAULT_TEMPLATE_HTML,
  },
  {
    id: "reminder",
    label: "تذكير بالموعد",
    subject: "تذكير بموعد قادم",
    content:
      '<div style="font-family: Cairo, sans-serif; padding: 20px; background: #fff; border-right: 4px solid #1f3fbf;"><h2 style="color: #1f3fbf; margin-bottom: 16px;">⏰ تذكير هام</h2><p style="line-height: 1.8; margin-bottom: 12px;">نذكّركم بأن الموعد المحدد هو:</p><p style="line-height: 1.8; margin-bottom: 12px; background: #eef2ff; padding: 12px; border-radius: 8px;">[اكتب تفاصيل الموعد هنا]</p><p style="line-height: 1.8; margin-bottom: 12px;">شاكرين التزامكم.</p><p style="line-height: 1.8; margin-top: 24px;">فريق العمل</p></div>',
  },
];

const COST_CENTERS = [
  { id: "marketing", label: "مركز تكلفة التسويق" },
  { id: "sales", label: "مركز تكلفة المبيعات" },
  { id: "hr", label: "مركز تكلفة الموارد البشرية" },
  { id: "it", label: "مركز تكلفة تقنية المعلومات" },
];

const store = useAppStore();
const currentTheme = computed(() => store.currentTheme);
const isRTL = computed(() => store.isRTL);
const isHistoryTab = computed(() => activeTab.value === "history");
const composeModalVisible = ref(false);
const composeForm = reactive({
  sendType: "public",
  subject: "",
  templateId: "alert",
  templateContent: DEFAULT_TEMPLATE_HTML,
  costCenter: "",
});
const isSpecificSend = computed(() => composeForm.sendType === "specific");

const openComposeModal = () => {
  composeModalVisible.value = true;
};

const closeComposeModal = () => {
  composeModalVisible.value = false;
  resetComposeForm();
};

const resetComposeForm = () => {
  composeForm.sendType = "public";
  composeForm.subject = "";
  composeForm.templateId = "alert";
  composeForm.templateContent = DEFAULT_TEMPLATE_HTML;
  composeForm.costCenter = "";
};

const handleSendCompose = () => {
  // Placeholder: integrate with API call here
  console.info("Sending communication payload", {
    sendType: composeForm.sendType,
    subject: composeForm.subject,
    templateId: composeForm.templateId,
    templateContent: composeForm.templateContent,
    costCenter: composeForm.costCenter,
  });
  closeComposeModal();
  resetComposeForm();
};

watch(
  () => composeForm.templateId,
  (id) => {
    const selected = TEMPLATE_OPTIONS.find((option) => option.id === id);
    if (!selected) return;
    composeForm.templateContent = selected.content;
    if (!composeForm.subject) {
      composeForm.subject = selected.subject;
    }
  }
);

watch(
  () => composeForm.sendType,
  (type) => {
    if (type !== "specific") {
      composeForm.costCenter = "";
    }
  }
);

const applySearch = () => {
  searchQuery.value = searchInput.value.trim();
};

const filteredMessages = computed(() => {
  const normalizedQuery = searchQuery.value.toLowerCase();
  const base = messages.value.filter((message) => {
    if (message.tab !== activeTab.value) return false;
    if (!normalizedQuery) return true;
    const haystack = `${message.title} ${message.subtitle} ${message.description}`.toLowerCase();
    return haystack.includes(normalizedQuery);
  });

  const sorted = [...base];

  if (selectedFilter.value === "oldest") {
    sorted.sort((a, b) => a.timestamp.localeCompare(b.timestamp));
  } else {
    sorted.sort((a, b) => b.timestamp.localeCompare(a.timestamp));
  }

  return sorted;
});

const filteredHistoryRecords = computed(() => {
  const normalizedQuery = searchQuery.value.toLowerCase();
  const base = historyRecords.value.filter((record) => {
    if (!normalizedQuery) return true;
    const haystack = `${record.subject} ${record.template} ${record.email} ${record.costCenter} ${historyStatusLabel[record.status]}`.toLowerCase();
    return haystack.includes(normalizedQuery);
  });

  const sorted = [...base];

  if (selectedFilter.value === "oldest") {
    sorted.sort((a, b) => a.timestamp.localeCompare(b.timestamp));
  } else {
    sorted.sort((a, b) => b.timestamp.localeCompare(a.timestamp));
  }

  return sorted;
});

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
</script>

<template>
  <section :class="$style.page" :data-theme="currentTheme" :dir="isRTL ? 'rtl' : 'ltr'">
    <header :class="$style.header">
      <div :class="$style.titleBlock">
        <h1 :class="$style.title">التواصل</h1>
      </div>
      <button type="button" :class="$style.primaryAction" @click="openComposeModal">
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
        <select v-model="selectedFilter" :class="$style.filterSelect">
          <option value="">فرز حسب</option>
          <option value="newest">الأحدث أولاً</option>
          <option value="oldest">الأقدم أولاً</option>
        </select>
      </div>

      <template v-if="!isHistoryTab">
        <div v-if="filteredMessages.length" :class="$style.messagesList">
          <article
            v-for="message in filteredMessages"
            :key="message.id"
            :class="$style.messageCard"
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
                  <h2 :class="$style.messageTitle">{{ message.title }}</h2>
                  <p :class="$style.messageSubtitle">{{ message.subtitle }}</p>
                     <p :class="$style.messageBody">
              {{ message.description }}
            </p>
                </div>
              </div>
              <div :class="$style.meta">
                <span>{{ formatTime(message.timestamp) }}</span>
                <span>{{ formatDate(message.timestamp) }}</span>
              </div>
            </div>
         
          </article>
        </div>

        <div v-else :class="$style.emptyState">
          <i class="fas fa-inbox" style="font-size: 32px;"></i>
          <p>لا توجد رسائل مطابقة للمعايير الحالية.</p>
        </div>
      </template>

      <template v-else>
        <div
          v-if="filteredHistoryRecords.length"
          :class="$style.historyTableContainer"
          :data-theme="currentTheme"
        >
          <div :class="$style.historyTableScroll">
            <table :class="$style.historyTable">
              <thead>
                <tr>
                  <th :class="$style.historyHeadCell">مركز التكلفة</th>
                  <th :class="$style.historyHeadCell">البريد الإلكتروني</th>
                                    <th :class="$style.historyHeadCell">القالب المستخدم</th>

                       <th :class="$style.historyHeadCell">الموضوع</th>
                  <th :class="$style.historyHeadCell">الحالة</th>
             
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="record in filteredHistoryRecords"
                  :key="record.id"
                  :class="$style.historyRow"
                >
                                  <td :class="$style.historyCell">{{ record.costCenter }}</td>
                  <td :class="[$style.historyCell, $style.emailCell]">{{ record.email }}</td>
                  <td :class="$style.historyCell">{{ record.template }}</td>

               
                  <td :class="$style.historyCell">
                    <div :class="$style.subjectCell">
                      <span :class="$style.subjectTitle">{{ record.subject }}</span>
                      <span :class="$style.subjectMeta">{{ formatHistoryMeta(record.timestamp) }}</span>
                    </div>
                  </td>
                     <td :class="[$style.historyCell, $style.statusCell]">
                    <span
                      :class="[$style.statusBadge, $style[historyStatusClassKey[record.status]]]"
                    >
                      {{ historyStatusLabel[record.status] }}
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
        <div v-else :class="$style.emptyState">
          <i class="fas fa-database" style="font-size: 32px;"></i>
          <p>لا توجد عمليات مطابقة للمعايير الحالية.</p>
        </div>
      </template>
    </div>

    <teleport to="body">
      <div v-if="composeModalVisible" :class="$style.modalOverlay" @click.self="closeComposeModal">
        <section
          :class="$style.modalContainer"
          role="dialog"
          aria-modal="true"
          aria-labelledby="compose-modal-title"
        >
          <header :class="$style.modalHeader">
            <h2 id="compose-modal-title" :class="$style.modalTitle">إنشاء رسالة جديدة</h2>
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
            <div :class="$style.formField">
              <label :class="$style.fieldLabel" for="sendType">نوع الإرسال</label>
              <select
                id="sendType"
                v-model="composeForm.sendType"
                :class="$style.fieldSelect"
              >
                <option value="public">إعلان عام (جميع مراكز التكلفة)</option>
                <option value="specific">إعلان محدد - لمراكز تكلفة معينة</option>
              </select>
            </div>

            <div v-if="isSpecificSend" :class="$style.formField">
              <label :class="$style.fieldLabel" for="costCenter">اختر مركز التكلفة</label>
              <select
                id="costCenter"
                v-model="composeForm.costCenter"
                :class="$style.fieldSelect"
              >
                <option value="" disabled>اختر مركز التكلفة</option>
                <option
                  v-for="center in COST_CENTERS"
                  :key="center.id"
                  :value="center.id"
                >
                  {{ center.label }}
                </option>
              </select>
            </div>

            <div :class="$style.formField">
              <label :class="$style.fieldLabel" for="subject">الموضوع</label>
              <input
                id="subject"
                v-model="composeForm.subject"
                type="text"
                :class="$style.fieldInput"
                placeholder="أدخل موضوع الرسالة"
              />
            </div>

            <div :class="$style.formField">
              <label :class="$style.fieldLabel" for="templateSelect">اختيار القالب</label>
              <select
                id="templateSelect"
                v-model="composeForm.templateId"
                :class="$style.fieldSelect"
              >
                <option
                  v-for="option in TEMPLATE_OPTIONS"
                  :key="option.id"
                  :value="option.id"
                >
                  {{ option.label }}
                </option>
              </select>
            </div>

            <div :class="$style.formField">
              <label :class="$style.fieldLabel" for="templateContent">نص القالب</label>
              <textarea
                id="templateContent"
                v-model="composeForm.templateContent"
                :class="$style.templateTextarea"
                rows="8"
              ></textarea>
            </div>
          </div>

          <footer :class="$style.modalActions">
                 <button type="button" :class="$style.sendButton" @click="handleSendCompose">
              إرسال
            </button>
            <button type="button" :class="$style.cancelButton" @click="closeComposeModal">
              إلغاء
            </button>
       
          </footer>
        </section>
      </div>
    </teleport>
  </section>
</template>

<style module src="./Communication.module.css"></style>
