<script setup lang="ts">
import {
  computed,
  onBeforeUnmount,
  onMounted,
  reactive,
  ref,
} from "vue";
import { useAppStore } from "../../../stores/useAppStore";

type TabKey = "all" | "mine" | "shared" | "favorites";
type ViewMode = "grid" | "list";
type UploadMode = "file" | "folder";
type PermissionLevel = "view" | "edit";

type FileEntry = {
  id: number;
  name: string;
  type: "file" | "folder";
  extension: string;
  size: string;
  updatedAt: string;
  ownedByMe: boolean;
  sharedWithMe: boolean;
  favorite: boolean;
  tagLabel: string;
};

const tabs: Array<{ id: TabKey; label: string }> = [
  { id: "all", label: "جميع الملفات" },
  { id: "mine", label: "ملفاتي" },
  { id: "shared", label: "تمت مشاركتها معي" },
  { id: "favorites", label: "المفضلة" },
];

const filterOptions = [
  { value: "", label: "فرز حسب" },
  { value: "folder", label: "المجلدات" },
  { value: "pdf", label: "ملفات PDF" },
  { value: "docx", label: "مستندات Word" },
  { value: "xlsx", label: "ملفات Excel" },
];

const files = ref<FileEntry[]>([
  {
    id: 1,
    name: "تقرير الربع الأول 2025",
    type: "folder",
    extension: "folder",
    size: "--",
    updatedAt: "2025-10-15",
    ownedByMe: true,
    sharedWithMe: false,
    favorite: false,
    tagLabel: "مجلد",
  },
  {
    id: 2,
    name: "ملخص البيانات المالية.xlsx",
    type: "file",
    extension: "xlsx",
    size: "2.7 MB",
    updatedAt: "2025-10-15",
    ownedByMe: true,
    sharedWithMe: true,
    favorite: true,
    tagLabel: "Excel",
  },
  {
    id: 3,
    name: "تحليل بيانات الاستبيان الشهري.pdf",
    type: "file",
    extension: "pdf",
    size: "2.7 MB",
    updatedAt: "2025-10-15",
    ownedByMe: false,
    sharedWithMe: true,
    favorite: false,
    tagLabel: "PDF",
  },
  {
    id: 4,
    name: "تحليل بيانات الاستبيان الشهري.docx",
    type: "file",
    extension: "docx",
    size: "2.7 MB",
    updatedAt: "2025-10-15",
    ownedByMe: true,
    sharedWithMe: false,
    favorite: true,
    tagLabel: "Word",
  },
  {
    id: 5,
    name: "تقارير الربع الأول 2025",
    type: "folder",
    extension: "folder",
    size: "--",
    updatedAt: "2025-10-15",
    ownedByMe: false,
    sharedWithMe: true,
    favorite: false,
    tagLabel: "مجلد",
  },
  {
    id: 6,
    name: "ملخص البيانات المالية - Q4.xlsx",
    type: "file",
    extension: "xlsx",
    size: "3.1 MB",
    updatedAt: "2025-09-22",
    ownedByMe: true,
    sharedWithMe: false,
    favorite: false,
    tagLabel: "Excel",
  },
  {
    id: 7,
    name: "تحليل بيانات الاستبيان الشهري.pdf",
    type: "file",
    extension: "pdf",
    size: "1.9 MB",
    updatedAt: "2025-09-10",
    ownedByMe: true,
    sharedWithMe: true,
    favorite: false,
    tagLabel: "PDF",
  },
  {
    id: 8,
    name: "قوالب الاستبيانات",
    type: "folder",
    extension: "folder",
    size: "--",
    updatedAt: "2025-08-01",
    ownedByMe: true,
    sharedWithMe: false,
    favorite: true,
    tagLabel: "مجلد",
  },
]);

const store = useAppStore();
const currentTheme = computed(() => store.currentTheme);
const isRTL = computed(() => store.isRTL);

const activeTab = ref<TabKey>("all");
const searchTerm = ref("");
const selectedFilter = ref("");
const viewMode = ref<ViewMode>("grid");

const dropdownOpen = ref(false);
const dropdownTrigger = ref<HTMLElement | null>(null);
const dropdownMenu = ref<HTMLElement | null>(null);
const fileMenuOpen = ref<number | null>(null);

const newFolderModalVisible = ref(false);
const uploadModalState = reactive<{ visible: boolean; mode: UploadMode }>(
  {
    visible: false,
    mode: "file",
  }
);

const newFolderName = ref("");
const uploadFileRef = ref<HTMLInputElement | null>(null);
const uploadFolderRef = ref<HTMLInputElement | null>(null);

const shareModalState = reactive<{
  visible: boolean;
  file: FileEntry | null;
  email: string;
  permission: PermissionLevel;
}>({
  visible: false,
  file: null,
  email: "",
  permission: "view",
});

type Collaborator = {
  id: number;
  name: string;
  email: string;
  permission: PermissionLevel;
};

const collaborators = ref<Collaborator[]>([
  {
    id: 1,
    name: "أمل الشامسي",
    email: "amal@domain.ae",
    permission: "edit",
  },
  {
    id: 2,
    name: "سارة المهيري",
    email: "sarah@domain.ae",
    permission: "view",
  },
  {
    id: 3,
    name: "ماجد الكعبي",
    email: "majid@domain.ae",
    permission: "view",
  },
]);

const shareLink = computed(() =>
  shareModalState.file
    ? `https://files.internal/doc/${shareModalState.file.id}`
    : ""
);

const shareCopyFeedback = ref<"idle" | "copied">("idle");

const deleteModalState = reactive<{ visible: boolean; file: FileEntry | null }>(
  {
    visible: false,
    file: null,
  }
);

const filteredFiles = computed(() => {
  let list = files.value.slice();

  if (activeTab.value === "mine") {
    list = list.filter((file) => file.ownedByMe);
  } else if (activeTab.value === "shared") {
    list = list.filter((file) => file.sharedWithMe);
  } else if (activeTab.value === "favorites") {
    list = list.filter((file) => file.favorite);
  }

  if (selectedFilter.value) {
    list = list.filter((file) => file.extension === selectedFilter.value);
  }

  if (searchTerm.value.trim()) {
    const normalized = searchTerm.value.trim().toLowerCase();
    list = list.filter((file) =>
      file.name.toLowerCase().includes(normalized)
    );
  }

  return list;
});

const FILE_ICONS: Record<string, string> = {
  docx: `<svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg"><g clip-path="url(#clip0_docx)"><path fill-rule="evenodd" clip-rule="evenodd" d="M7.65938 0H19.2031L28.8031 9.6V27.8341C28.8031 30.1369 26.8102 32 24.3554 32H7.65938C5.19604 32 3.20313 30.1369 3.20313 27.8341V4.1659C3.20308 1.86306 5.19599 0 7.65938 0Z" fill="#335CFF"/><path d="M7.65511 25.6H5.79886V20.3636H7.67045C8.19716 20.3636 8.65057 20.4684 9.03068 20.6781C9.4108 20.8861 9.70313 21.1852 9.90767 21.5755C10.1139 21.9659 10.217 22.4329 10.217 22.9767C10.217 23.5221 10.1139 23.9909 9.90767 24.3829C9.70313 24.775 9.40909 25.0758 9.02557 25.2855C8.64375 25.4951 8.18693 25.6 7.65511 25.6ZM6.90597 24.6514H7.60909C7.93636 24.6514 8.21165 24.5934 8.43494 24.4775C8.65994 24.3599 8.82869 24.1784 8.94119 23.9329C9.0554 23.6858 9.1125 23.367 9.1125 22.9767C9.1125 22.5897 9.0554 22.2736 8.94119 22.0281C8.82869 21.7826 8.6608 21.602 8.4375 21.4861C8.2142 21.3701 7.93892 21.3122 7.61165 21.3122H6.90597V24.6514ZM15.8491 22.9818C15.8491 23.5528 15.7408 24.0386 15.5244 24.4392C15.3096 24.8397 15.0164 25.1457 14.6448 25.3571C14.2749 25.5667 13.859 25.6716 13.3971 25.6716C12.9317 25.6716 12.5141 25.5659 12.1442 25.3545C11.7744 25.1432 11.482 24.8372 11.2673 24.4366C11.0525 24.0361 10.9451 23.5511 10.9451 22.9818C10.9451 22.4108 11.0525 21.925 11.2673 21.5244C11.482 21.1238 11.7744 20.8187 12.1442 20.6091C12.5141 20.3977 12.9317 20.292 13.3971 20.292C13.859 20.292 14.2749 20.3977 14.6448 20.6091C15.0164 20.8187 15.3096 21.1238 15.5244 21.5244C15.7408 21.925 15.8491 22.4108 15.8491 22.9818ZM14.7266 22.9818C14.7266 22.6119 14.6712 22.3 14.5604 22.046C14.4513 21.792 14.2971 21.5994 14.0977 21.4682C13.8982 21.3369 13.6647 21.2713 13.3971 21.2713C13.1295 21.2713 12.896 21.3369 12.6965 21.4682C12.4971 21.5994 12.342 21.792 12.2312 22.046C12.1221 22.3 12.0675 22.6119 12.0675 22.9818C12.0675 23.3517 12.1221 23.6636 12.2312 23.9176C12.342 24.1716 12.4971 24.3642 12.6965 24.4954C12.896 24.6267 13.1295 24.6923 13.3971 24.6923C13.6647 24.6923 13.8982 24.6267 14.0977 24.4954C14.2971 24.3642 14.4513 24.1716 14.5604 23.9176C14.6712 23.6636 14.7266 23.3517 14.7266 22.9818ZM21.2893 22.1969H20.1695C20.149 22.052 20.1072 21.9233 20.0442 21.8108C19.9811 21.6966 19.9001 21.5994 19.8013 21.5193C19.7024 21.4392 19.5882 21.3778 19.4587 21.3352C19.3308 21.2926 19.1919 21.2713 19.0419 21.2713C18.7709 21.2713 18.5348 21.3386 18.3337 21.4733C18.1325 21.6062 17.9766 21.8005 17.8658 22.0562C17.755 22.3102 17.6996 22.6187 17.6996 22.9818C17.6996 23.3551 17.755 23.6687 17.8658 23.9227C17.9783 24.1767 18.1351 24.3684 18.3362 24.498C18.5374 24.6275 18.77 24.6923 19.0342 24.6923C19.1825 24.6923 19.3197 24.6727 19.4459 24.6335C19.5737 24.5943 19.6871 24.5372 19.7859 24.4622C19.8848 24.3855 19.9666 24.2926 20.0314 24.1835C20.0979 24.0744 20.1439 23.95 20.1695 23.8102L21.2893 23.8153C21.2604 24.0557 21.1879 24.2875 21.072 24.5108C20.9578 24.7324 20.8036 24.9309 20.6092 25.1065C20.4166 25.2804 20.1865 25.4184 19.9189 25.5207C19.653 25.6213 19.3521 25.6716 19.0163 25.6716C18.5493 25.6716 18.1317 25.5659 17.7635 25.3545C17.397 25.1432 17.1072 24.8372 16.8942 24.4366C16.6828 24.0361 16.5771 23.5511 16.5771 22.9818C16.5771 22.4108 16.6845 21.925 16.8993 21.5244C17.1141 21.1238 17.4055 20.8187 17.7737 20.6091C18.1419 20.3977 18.5561 20.292 19.0163 20.292C19.3197 20.292 19.601 20.3346 19.8601 20.4199C20.1209 20.5051 20.3518 20.6295 20.553 20.7932C20.7541 20.9551 20.9178 21.1537 21.0439 21.3889C21.1717 21.6241 21.2536 21.8934 21.2893 22.1969ZM23.0088 20.3636L24.0648 22.1483H24.1057L25.1668 20.3636H26.417L24.819 22.9818L26.4528 25.6H25.1795L24.1057 23.8128H24.0648L22.9909 25.6H21.7227L23.3616 22.9818L21.7534 20.3636H23.0088Z" fill="white"/><path d="M19.2236 6.528V0L28.8031 9.6H22.4168C19.543 9.6 19.0906 7.552 19.2236 6.528Z" fill="white" fill-opacity="0.3"/></g><defs><clipPath id="clip0_docx"><rect width="32" height="32" fill="white"/></clipPath></defs></svg>`,
  pdf: `<svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg"><g clip-path="url(#clip0_pdf)"><path fill-rule="evenodd" clip-rule="evenodd" d="M7.75882 0H19.2031L28.8031 9.6V27.8341C28.8031 30.1369 26.8102 32 24.3554 32H7.65938C5.19604 32 3.20313 30.1369 3.20313 27.8341V4.16586C3.20308 1.86302 5.29544 0 7.75882 0Z" fill="#D44333"/><path d="M19.2236 6.528V0L28.8031 9.6H22.4168C19.543 9.6 19.0906 7.552 19.2236 6.528Z" fill="white" fill-opacity="0.3"/><path d="M9.40238 25.6V20.3636H11.4683C11.8654 20.3636 12.2038 20.4395 12.4833 20.5912C12.7629 20.7412 12.976 20.95 13.1225 21.2176C13.2708 21.4835 13.345 21.7903 13.345 22.138C13.345 22.4858 13.27 22.7926 13.12 23.0585C12.97 23.3244 12.7527 23.5315 12.468 23.6798C12.185 23.8281 11.8424 23.9022 11.4402 23.9022H10.1234V23.015H11.2612C11.4743 23.015 11.6498 22.9784 11.7879 22.9051C11.9277 22.8301 12.0316 22.727 12.0998 22.5957C12.1697 22.4628 12.2047 22.3102 12.2047 22.138C12.2047 21.9642 12.1697 21.8125 12.0998 21.6829C12.0316 21.5517 11.9277 21.4503 11.7879 21.3787C11.6481 21.3054 11.4708 21.2687 11.2561 21.2687H10.5095V25.6H9.40238ZM15.9203 25.6H14.0641V20.3636H15.9357C16.4624 20.3636 16.9158 20.4684 17.2959 20.6781C17.676 20.8861 17.9684 21.1852 18.1729 21.5755C18.3792 21.9659 18.4823 22.4329 18.4823 22.9767C18.4823 23.5221 18.3792 23.9909 18.1729 24.3829C17.9684 24.775 17.6743 25.0758 17.2908 25.2855C16.909 25.4951 16.4522 25.6 15.9203 25.6ZM15.1712 24.6514H15.8743C16.2016 24.6514 16.4769 24.5934 16.7002 24.4775C16.9252 24.3599 17.0939 24.1784 17.2064 23.9329C17.3206 23.6858 17.3777 23.367 17.3777 22.9767C17.3777 22.5897 17.3206 22.2736 17.2064 22.0281C17.0939 21.7826 16.926 21.602 16.7027 21.4861C16.4794 21.3701 16.2042 21.3122 15.8769 21.3122H15.1712V24.6514ZM19.3024 25.6V20.3636H22.7694V21.2764H20.4095V22.5241H22.5393V23.4369H20.4095V25.6H19.3024Z" fill="white"/></g><defs><clipPath id="clip0_pdf"><rect width="32" height="32" fill="white"/></clipPath></defs></svg>`,
  xlsx: `<svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg"><g clip-path="url(#clip0_xlsx)"><path fill-rule="evenodd" clip-rule="evenodd" d="M7.65938 0H19.2031L28.8031 9.6V27.8341C28.8031 30.1369 26.8102 32 24.3554 32H7.65938C5.19604 32 3.20313 30.1369 3.20313 27.8341V4.1659C3.20308 1.86306 5.19599 0 7.65938 0Z" fill="#079455"/><path d="M7.94787 20.3636L9.00384 22.1483H9.04474L10.1058 20.3636H11.3561L9.7581 22.9818L11.3919 25.6H10.1186L9.04474 23.8128H9.00384L7.92997 25.6H6.66179L8.30071 22.9818L6.69247 20.3636H7.94787ZM12.0567 25.6V20.3636H13.1638V24.6872H15.4087V25.6H12.0567ZM18.9825 21.8696C18.962 21.6633 18.8742 21.5031 18.7191 21.3889C18.564 21.2747 18.3535 21.2176 18.0876 21.2176C17.9069 21.2176 17.7543 21.2432 17.6299 21.2943C17.5055 21.3437 17.41 21.4128 17.3435 21.5014C17.2788 21.59 17.2464 21.6906 17.2464 21.8031C17.243 21.8969 17.2626 21.9787 17.3052 22.0486C17.3495 22.1184 17.41 22.179 17.4867 22.2301C17.5634 22.2795 17.6521 22.323 17.7526 22.3605C17.8532 22.3963 17.9606 22.427 18.0748 22.4525L18.5452 22.565C18.7737 22.6162 18.9833 22.6844 19.1742 22.7696C19.3651 22.8548 19.5305 22.9596 19.6702 23.0841C19.81 23.2085 19.9183 23.3551 19.995 23.5238C20.0734 23.6926 20.1134 23.8861 20.1151 24.1042C20.1134 24.4247 20.0316 24.7025 19.8697 24.9378C19.7094 25.1713 19.4776 25.3528 19.1742 25.4824C18.8725 25.6102 18.5086 25.6741 18.0825 25.6741C17.6597 25.6741 17.2915 25.6094 16.9779 25.4798C16.666 25.3503 16.4222 25.1585 16.2467 24.9045C16.0728 24.6488 15.9816 24.3326 15.9731 23.9559H17.0444C17.0563 24.1315 17.1066 24.2781 17.1952 24.3957C17.2856 24.5116 17.4058 24.5994 17.5558 24.6591C17.7075 24.717 17.8788 24.746 18.0697 24.746C18.2572 24.746 18.42 24.7187 18.558 24.6642C18.6978 24.6096 18.806 24.5338 18.8827 24.4366C18.9594 24.3395 18.9978 24.2278 18.9978 24.1017C18.9978 23.9841 18.9629 23.8852 18.893 23.8051C18.8248 23.725 18.7242 23.6568 18.5913 23.6005C18.46 23.5443 18.2989 23.4932 18.108 23.4471L17.5379 23.304C17.0964 23.1966 16.7478 23.0287 16.4921 22.8003C16.2364 22.5719 16.1094 22.2642 16.1112 21.8772C16.1094 21.5602 16.1938 21.2832 16.3643 21.0463C16.5364 20.8094 16.7725 20.6244 17.0725 20.4915C17.3725 20.3585 17.7134 20.292 18.0952 20.292C18.4839 20.292 18.8231 20.3585 19.1129 20.4915C19.4043 20.6244 19.631 20.8094 19.793 21.0463C19.9549 21.2832 20.0384 21.5576 20.0435 21.8696H18.9825ZM21.8979 20.3636L22.9538 22.1483H22.9947L24.0558 20.3636H25.3061L23.7081 22.9818L25.3419 25.6H24.0686L22.9947 23.8128H22.9538L21.88 25.6H20.6118L22.2507 22.9818L20.6425 20.3636H21.8979Z" fill="white"/><path d="M19.2236 6.528V0L28.8031 9.6H22.4168C19.543 9.6 19.0906 7.552 19.2236 6.528Z" fill="white" fill-opacity="0.3"/></g><defs><clipPath id="clip0_xlsx"><rect width="32" height="32" fill="white"/></clipPath></defs></svg>`,
  folder: `<svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M13.333 5.333H6.66634C5.19358 5.333 4.00065 6.52593 4.00065 7.9987V24.0013C4.00065 25.4741 5.19358 26.667 6.66634 26.667H25.333C26.8058 26.667 27.9987 25.4741 27.9987 24.0013V11.3346C27.9987 9.86185 26.8058 8.66892 25.333 8.66892H15.9997L13.333 5.333Z" fill="#A17D23"/></svg>`,
};

const getFileIcon = (file: FileEntry) => {
  const key = file.type === "folder" ? "folder" : file.extension.toLowerCase();
  return FILE_ICONS[key] || FILE_ICONS.folder;
};

const toggleDropdown = () => {
  dropdownOpen.value = !dropdownOpen.value;
};

const closeDropdown = () => {
  dropdownOpen.value = false;
};

const toggleFileMenu = (id: number) => {
  fileMenuOpen.value = fileMenuOpen.value === id ? null : id;
};

const closeFileMenu = () => {
  fileMenuOpen.value = null;
};

const handleDocumentClick = (event: MouseEvent) => {
  const target = event.target as HTMLElement | null;
  if (!target) return;
  if (
    dropdownOpen.value &&
    dropdownTrigger.value &&
    dropdownMenu.value &&
    !dropdownTrigger.value.contains(target) &&
    !dropdownMenu.value.contains(target)
  ) {
    closeDropdown();
  }

  if (fileMenuOpen.value !== null && !target.closest("[data-file-menu]")) {
    closeFileMenu();
  }
};

const openNewFolderModal = () => {
  newFolderName.value = "";
  newFolderModalVisible.value = true;
  closeDropdown();
};

const openUploadModal = (mode: UploadMode) => {
  uploadModalState.visible = true;
  uploadModalState.mode = mode;
  closeDropdown();
};

const closeNewFolderModal = () => {
  newFolderModalVisible.value = false;
};

const closeUploadModal = () => {
  uploadModalState.visible = false;
  if (uploadFileRef.value) {
    uploadFileRef.value.value = "";
  }
  if (uploadFolderRef.value) {
    uploadFolderRef.value.value = "";
  }
};

const handleCreateFolder = () => {
  if (!newFolderName.value.trim()) return;
  files.value.unshift({
    id: Date.now(),
    name: newFolderName.value.trim(),
    type: "folder",
    extension: "folder",
    size: "--",
    updatedAt: new Date().toISOString().slice(0, 10),
    ownedByMe: true,
    sharedWithMe: false,
    favorite: false,
    tagLabel: "مجلد",
  });
  closeNewFolderModal();
};

const handleUploadConfirm = () => {
  // Placeholder for upload integration
  closeUploadModal();
};

const toggleFavorite = (file: FileEntry) => {
  file.favorite = !file.favorite;
};

const setViewMode = (mode: ViewMode) => {
  viewMode.value = mode;
};

const openShareModal = (file: FileEntry) => {
  shareModalState.file = file;
  shareModalState.email = "";
  shareModalState.permission = "view";
  shareCopyFeedback.value = "idle";
  shareModalState.visible = true;
  closeFileMenu();
};

const closeShareModal = () => {
  shareModalState.visible = false;
  shareModalState.file = null;
  shareModalState.email = "";
  shareModalState.permission = "view";
  shareCopyFeedback.value = "idle";
};

const handleShareConfirm = () => {
  if (shareModalState.email.trim()) {
    collaborators.value.push({
      id: Date.now(),
      name: shareModalState.email.split("@")[0],
      email: shareModalState.email.trim(),
      permission: shareModalState.permission,
    });
  }
  closeShareModal();
};

const copyShareLink = async () => {
  if (!shareLink.value) return;
  try {
    await navigator.clipboard.writeText(shareLink.value);
    shareCopyFeedback.value = "copied";
    setTimeout(() => {
      shareCopyFeedback.value = "idle";
    }, 2000);
  } catch {
    shareCopyFeedback.value = "idle";
  }
};

const openDeleteModal = (file: FileEntry) => {
  deleteModalState.file = file;
  deleteModalState.visible = true;
  closeFileMenu();
};

const closeDeleteModal = () => {
  deleteModalState.visible = false;
  deleteModalState.file = null;
};

const handleDeleteConfirm = () => {
  if (!deleteModalState.file) return;
  files.value = files.value.filter((item) => item.id !== deleteModalState.file?.id);
  closeDeleteModal();
};

const handleDownload = (file: FileEntry) => {
  console.info("Downloading", file.name);
};

const handleMoreAction = (action: string, file: FileEntry) => {
  console.info("Action:", action, "for file:", file.name);
  closeFileMenu();
};

onMounted(() => {
  document.addEventListener("click", handleDocumentClick, true);
});

onBeforeUnmount(() => {
  document.removeEventListener("click", handleDocumentClick, true);
});
</script>

<template>
  <section
    :class="$style.page"
    :data-theme="currentTheme"
    :dir="isRTL ? 'rtl' : 'ltr'"
  >
    <header :class="$style.header">
      <div :class="$style.titleBlock">
        <h1 :class="$style.title">إدارة الملفات</h1>
      </div>

      <div :class="$style.actions">
        <div :class="$style.dropdown" ref="dropdownTrigger">
          <button
            type="button"
            :class="$style.primaryAction"
            @click.stop="toggleDropdown"
          >
            <i class="fas fa-plus"></i>
            إنشاء أو تحميل
            <i
              :class="[
                'fas fa-chevron-down',
                dropdownOpen ? $style.iconFlipped : '',
              ]"
            ></i>
          </button>

          <div
            v-if="dropdownOpen"
            :class="$style.dropdownMenu"
            ref="dropdownMenu"
          >
            <button type="button" @click="openNewFolderModal">
              <i class="fas fa-folder-plus"></i>
              مجلد جديد
            </button>
            <button type="button" @click="openUploadModal('file')">
              <i class="fas fa-upload"></i>
              تحميل ملف
            </button>
            <button type="button" @click="openUploadModal('folder')">
              <i class="fas fa-folder-open"></i>
              تحميل مجلد
            </button>
          </div>
        </div>
      </div>
    </header>

    <nav :class="$style.tabs" aria-label="Tabs">
      <button
        v-for="tab in tabs"
        :key="tab.id"
        type="button"
        :class="[
          $style.tabButton,
          activeTab === tab.id ? $style.tabActive : '',
        ]"
        @click="activeTab = tab.id"
      >
        {{ tab.label }}
      </button>
    </nav>

    <div :class="$style.contentArea">
      <div :class="$style.toolbar">
        <div :class="$style.searchGroup">
          <div :class="$style.searchControl">
            <input
              v-model="searchTerm"
              :class="$style.searchInput"
              type="search"
              placeholder="ابحث"
            />
            <i class="fas fa-search" :class="$style.searchIcon"></i>
          </div>

          <select v-model="selectedFilter" :class="$style.filterSelect">
            <option
              v-for="option in filterOptions"
              :key="option.value"
              :value="option.value"
            >
              {{ option.label }}
            </option>
          </select>
        </div>

        <div :class="$style.viewToggle">
          <button
            type="button"
            :class="[$style.toggleBtn, viewMode === 'list' ? $style.toggleActive : '']"
            @click="setViewMode('list')"
            :title="'عرض القائمة'"
          >
            <i class="fas fa-list"></i>
          </button>
          <button
            type="button"
            :class="[$style.toggleBtn, viewMode === 'grid' ? $style.toggleActive : '']"
            @click="setViewMode('grid')"
            :title="'عرض الشبكة'"
          >
            <i class="fas fa-th-large"></i>
          </button>
        </div>
      </div>

      <div v-if="viewMode === 'grid'" :class="$style.gridView">
        <article
          v-for="file in filteredFiles"
          :key="file.id"
          :class="$style.gridCard"
        >
          <header :class="$style.cardHeaderRow">
            <span :class="$style.fileTag">{{ file.tagLabel }}</span>
            <span :class="$style.fileBadge" v-html="getFileIcon(file)"></span>
          </header>

          <div :class="$style.cardBody">
            <h3 :class="$style.cardTitle">{{ file.name }}</h3>
            <div :class="$style.cardMeta">
              <span>{{ file.size }}</span>
              <span>{{ file.updatedAt }}</span>
            </div>
          </div>

          <footer :class="$style.cardActions">
            <div :class="$style.favoriteWrap">
              <button
                type="button"
                :class="[$style.actionPill, file.favorite ? $style.favoriteActive : '']"
                :title="'المفضلة'"
                @click="toggleFavorite(file)"
              >
                <i class="fas fa-star"></i>
              </button>
            </div>
            <button
              type="button"
              :class="$style.actionPill"
              @click="openShareModal(file)"
              :title="'مشاركة'"
            >
              <i class="fas fa-share-nodes"></i>
            </button>
            <button
              type="button"
              :class="$style.actionPill"
              @click="handleDownload(file)"
              :title="'تحميل'"
            >
              <i class="fas fa-download"></i>
            </button>
            <button
              type="button"
              :class="$style.actionPill"
              @click="openDeleteModal(file)"
              :title="'حذف'"
            >
              <i class="fas fa-trash-alt"></i>
            </button>
            <div :class="$style.menuWrapper" data-file-menu>
              <button
                type="button"
                :class="$style.actionPill"
                @click.stop="toggleFileMenu(file.id)"
                :title="'المزيد من الخيارات'"
              >
                <i class="fas fa-ellipsis-h"></i>
              </button>
              <div
                v-if="fileMenuOpen === file.id"
                :class="$style.cardMenu"
                data-file-menu
              >
                <button type="button" @click="handleMoreAction('rename', file)">
                  <i class="fas fa-i-cursor"></i>
                  إعادة تسمية
                </button>
                <button type="button" @click="handleMoreAction('move', file)">
                  <i class="fas fa-folder-open"></i>
                  نقل إلى مجلد
                </button>
                <button type="button" @click="handleMoreAction('duplicate', file)">
                  <i class="fas fa-clone"></i>
                  نسخ
                </button>
                <button type="button" @click="handleMoreAction('properties', file)">
                  <i class="fas fa-info-circle"></i>
                  الخصائص
                </button>
              </div>
            </div>
          </footer>
        </article>

        <div v-if="!filteredFiles.length" :class="$style.emptyState">
          <i class="fas fa-folder-open" style="font-size: 32px;"></i>
          <p>لا توجد ملفات مطابقة للمعايير الحالية.</p>
        </div>
      </div>

      <div v-else :class="$style.tableWrapper">
        <table :class="$style.table">
          <thead>
            <tr>
              <th>الاسم</th>
              <th>النوع</th>
              <th>الحجم</th>
              <th>تاريخ التعديل</th>
              <th>الحالة</th>
              <th>الإجراءات</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="file in filteredFiles" :key="file.id">
              <td :class="$style.nameCell">
                <span :class="$style.tableIcon">
                  <i
                    :class="[
                      file.type === 'folder'
                        ? 'fas fa-folder'
                        : file.extension === 'pdf'
                        ? 'fas fa-file-pdf'
                        : file.extension === 'docx'
                        ? 'fas fa-file-word'
                        : file.extension === 'xlsx'
                        ? 'fas fa-file-excel'
                        : 'fas fa-file',
                    ]"
                  ></i>
                </span>
                <span>{{ file.name }}</span>
              </td>
              <td>{{ file.tagLabel }}</td>
              <td>{{ file.size }}</td>
              <td>{{ file.updatedAt }}</td>
              <td>
                <span
                  :class="[
                    $style.statusBadge,
                    file.favorite ? $style.statusFavorite : $style.statusDefault,
                  ]"
                >
                  {{ file.favorite ? "مفضل" : "عادي" }}
                </span>
              </td>
              <td :class="$style.tableActions">
                <div :class="$style.menuWrapper" data-file-menu>
                  <button
                    type="button"
                    :class="$style.actionPill"
                    @click.stop="toggleFileMenu(file.id)"
                    :title="'المزيد من الخيارات'"
                  >
                    <i class="fas fa-ellipsis-h"></i>
                  </button>
                  <div
                    v-if="fileMenuOpen === file.id"
                    :class="$style.cardMenu"
                    data-file-menu
                  >
                    <button type="button" @click="handleMoreAction('rename', file)">
                      <i class="fas fa-i-cursor"></i>
                      إعادة تسمية
                    </button>
                    <button type="button" @click="handleMoreAction('move', file)">
                      <i class="fas fa-folder-open"></i>
                      نقل إلى مجلد
                    </button>
                    <button type="button" @click="handleMoreAction('duplicate', file)">
                      <i class="fas fa-clone"></i>
                      نسخ
                    </button>
                    <button type="button" @click="handleMoreAction('properties', file)">
                      <i class="fas fa-info-circle"></i>
                      الخصائص
                    </button>
                  </div>
                </div>
                <button
                  type="button"
                  :class="$style.actionPill"
                  @click="openDeleteModal(file)"
                  :title="'حذف'"
                >
                  <i class="fas fa-trash-alt"></i>
                </button>
                <button
                  type="button"
                  :class="$style.actionPill"
                  @click="handleDownload(file)"
                  :title="'تحميل'"
                >
                  <i class="fas fa-download"></i>
                </button>
                <button
                  type="button"
                  :class="$style.actionPill"
                  @click="openShareModal(file)"
                  :title="'مشاركة'"
                >
                  <i class="fas fa-share-nodes"></i>
                </button>
                <button
                  type="button"
                  :class="[$style.actionPill, file.favorite ? $style.favoriteActive : '']"
                  @click="toggleFavorite(file)"
                  :title="'المفضلة'"
                >
                  <i class="fas fa-star"></i>
                </button>
              </td>
            </tr>
            <tr v-if="!filteredFiles.length">
              <td :colspan="6" :class="$style.emptyRow">
                لا توجد ملفات مطابقة للمعايير الحالية.
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <teleport to="body">
      <div
        v-if="newFolderModalVisible"
        :class="$style.modalOverlay"
        @click.self="closeNewFolderModal"
      >
        <section :class="$style.modalContainer" role="dialog" aria-modal="true">
          <header :class="$style.modalHeader">
            <h2 :class="$style.modalTitle">إنشاء مجلد جديد</h2>
            <button
              type="button"
              :class="$style.closeButton"
              @click="closeNewFolderModal"
              aria-label="إغلاق النافذة"
            >
              <span aria-hidden="true">&times;</span>
            </button>
          </header>
          <div :class="$style.modalBody">
            <div :class="$style.formField">
              <label :class="$style.fieldLabel" for="new-folder-name">
                اسم المجلد
              </label>
              <input
                id="new-folder-name"
                v-model="newFolderName"
                type="text"
                :class="$style.fieldInput"
                placeholder="أدخل اسم المجلد"
              />
            </div>
          </div>
          <footer :class="$style.modalActions">
            <button type="button" :class="$style.cancelButton" @click="closeNewFolderModal">
              إلغاء
            </button>
            <button type="button" :class="$style.sendButton" @click="handleCreateFolder">
              إنشاء
            </button>
          </footer>
        </section>
      </div>
    </teleport>

    <teleport to="body">
      <div
        v-if="shareModalState.visible"
        :class="$style.modalOverlay"
        @click.self="closeShareModal"
      >
        <section :class="$style.modalContainer" role="dialog" aria-modal="true">
          <header :class="$style.modalHeader">
            <h2 :class="$style.modalTitle">
              مشاركة {{ shareModalState.file?.name || "" }}
            </h2>
            <button
              type="button"
              :class="$style.closeButton"
              @click="closeShareModal"
              aria-label="إغلاق النافذة"
            >
              <span aria-hidden="true">&times;</span>
            </button>
          </header>
          <div :class="$style.modalBody">
            <div :class="$style.formField">
              <label :class="$style.fieldLabel" for="share-email">إضافة مستخدم</label>
              <div :class="$style.shareInputRow">
                <input
                  id="share-email"
                  v-model="shareModalState.email"
                  type="email"
                  :class="$style.fieldInput"
                  placeholder="البريد الإلكتروني للمستخدم"
                />
                <select
                  v-model="shareModalState.permission"
                  :class="$style.permissionSelect"
                >
                  <option value="view">عرض فقط</option>
                  <option value="edit">وصول كامل</option>
                </select>
              </div>
            </div>

            <div :class="$style.collaboratorsList">
              <h3 :class="$style.listTitle">الوصول الحالي</h3>
              <div
                v-for="collaborator in collaborators"
                :key="collaborator.id"
                :class="$style.collaboratorRow"
              >
                <div :class="$style.collaboratorInfo">
                  <div :class="$style.initials">
                    {{ collaborator.name.charAt(0) }}
                  </div>
                  <div>
                    <div :class="$style.collaboratorName">{{ collaborator.name }}</div>
                    <div :class="$style.collaboratorEmail">{{ collaborator.email }}</div>
                  </div>
                </div>
                <select
                  v-model="collaborator.permission"
                  :class="$style.permissionSelect"
                >
                  <option value="view">عرض فقط</option>
                  <option value="edit">وصول كامل</option>
                </select>
              </div>
            </div>

            <div :class="$style.shareLinkRow">
              <div>
                <div :class="$style.linkLabel">رابط الوصول</div>
                <div :class="$style.linkValue">{{ shareLink }}</div>
              </div>
              <button type="button" :class="$style.copyLinkButton" @click="copyShareLink">
                <i class="fas fa-link"></i>
                {{ shareCopyFeedback === "copied" ? "تم النسخ" : "نسخ الرابط" }}
              </button>
            </div>
          </div>
          <footer :class="$style.modalActions">
            <button type="button" :class="$style.cancelButton" @click="closeShareModal">
              إلغاء
            </button>
            <button type="button" :class="$style.sendButton" @click="handleShareConfirm">
              مشاركة
            </button>
          </footer>
        </section>
      </div>
    </teleport>

    <teleport to="body">
      <div
        v-if="deleteModalState.visible"
        :class="$style.modalOverlay"
        @click.self="closeDeleteModal"
      >
        <section :class="$style.modalContainer" role="dialog" aria-modal="true">
          <header :class="$style.modalHeader">
            <h2 :class="$style.modalTitle">حذف العنصر</h2>
            <button
              type="button"
              :class="$style.closeButton"
              @click="closeDeleteModal"
              aria-label="إغلاق النافذة"
            >
              <span aria-hidden="true">&times;</span>
            </button>
          </header>
          <div :class="$style.modalBody">
            هل أنت متأكد من حذف
            <strong>{{ deleteModalState.file?.name }}</strong>
            ؟ لا يمكن التراجع عن هذا الإجراء.
          </div>
          <footer :class="$style.modalActions">
            <button type="button" :class="$style.cancelButton" @click="closeDeleteModal">
              إلغاء
            </button>
            <button type="button" :class="$style.dangerButton" @click="handleDeleteConfirm">
              حذف
            </button>
          </footer>
        </section>
      </div>
    </teleport>

    <teleport to="body">
      <div
        v-if="uploadModalState.visible"
        :class="$style.modalOverlay"
        @click.self="closeUploadModal"
      >
        <section :class="$style.modalContainer" role="dialog" aria-modal="true">
          <header :class="$style.modalHeader">
            <h2 :class="$style.modalTitle">
              {{
                uploadModalState.mode === "file"
                  ? "تحميل ملف"
                  : "تحميل مجلد"
              }}
            </h2>
            <button
              type="button"
              :class="$style.closeButton"
              @click="closeUploadModal"
              aria-label="إغلاق النافذة"
            >
              <span aria-hidden="true">&times;</span>
            </button>
          </header>
          <div :class="$style.modalBody">
            <div :class="$style.uploadArea">
              <i
                :class="[
                  uploadModalState.mode === 'file'
                    ? 'fas fa-file-upload'
                    : 'fas fa-folder-open',
                  $style.uploadIcon,
                ]"
              ></i>
              <p>
                {{
                  uploadModalState.mode === "file"
                    ? "اسحب الملف إلى هنا أو اختره من جهازك"
                    : "اسحب المجلد إلى هنا أو اختره من جهازك"
                }}
              </p>
              <label :class="$style.uploadButton">
                <input
                  v-if="uploadModalState.mode === 'file'"
                  ref="uploadFileRef"
                  type="file"
                  hidden
                />
                <input
                  v-else
                  ref="uploadFolderRef"
                  type="file"
                  hidden
                  webkitdirectory
                  directory
                />
                <span>اختر {{ uploadModalState.mode === "file" ? "ملفاً" : "مجلداً" }}</span>
              </label>
            </div>
          </div>
          <footer :class="$style.modalActions">
            <button type="button" :class="$style.cancelButton" @click="closeUploadModal">
              إلغاء
            </button>
            <button type="button" :class="$style.sendButton" @click="handleUploadConfirm">
              تحميل
            </button>
          </footer>
        </section>
      </div>
    </teleport>
  </section>
</template>

<style module src="./FileManagement.module.css"></style>
