<template>
  <div :class="$style.modalOverlay">
    <div 
      :class="$style.modalContainer" 
      :data-theme="currentTheme" 
      :dir="isRTL ? 'rtl' : 'ltr'"
      @click.stop
    >
      <!-- Header -->
      <div :class="$style.modalHeader">
        <h2 :class="$style.modalTitle">
          <i class="fas fa-share-alt" :class="$style.modalIcon"></i>
          {{ getText('survey.access.title') }}
        </h2>
        <button :class="$style.closeButton" @click="$emit('cancel')">
          <i class="fas fa-times"></i>
        </button>
      </div>

      <!-- Body -->
      <div :class="$style.modalBody">
        <!-- Compact Access Level Selection -->
        <div :class="$style.accessSection">
          <div :class="$style.sectionHeader">
            <h3 :class="$style.sectionTitle">
              <i class="fas fa-key" :class="$style.sectionIcon"></i>
              {{ getText('survey.access.level') }}
            </h3>
          </div>
          
          <div :class="$style.accessOptions">
            <!-- Public Access -->
            <div 
              :class="[$style.accessOption, { [$style.selected]: selectedAccess === 'PUBLIC' }]"
              @click="handleAccessChange('PUBLIC')"
            >
              <div :class="$style.optionContent">
                <div :class="$style.optionLeft">
                  <!-- <i class="fas fa-globe" :class="[$style.optionIcon, $style.public]"></i> -->
                  <div :class="$style.optionText">
                    <span :class="$style.optionTitle">عام - (داخل و خارج دائرة القضاء)</span>
                    <small :class="$style.optionDescription">{{ getText('survey.access.public.description') }}</small>
                  </div>
                </div>
                <div :class="$style.optionRadio">
                </div>
              </div>
              
              <!-- Compact Public Link Management -->
              <div v-if="selectedAccess === 'PUBLIC'" :class="$style.publicLinkSection">
                <!-- Per-Device Access Option -->
                <div :class="$style.perDeviceAccessSection">
                  <div :class="$style.perDeviceAccessCard">
                    <div :class="$style.perDeviceAccessHeader">
                      <div :class="$style.perDeviceIconWrapper">
                        <i class="fas fa-mobile-alt"></i>
                      </div>
                      <div :class="$style.perDeviceTextContent">
                        <h4 :class="$style.perDeviceAccessTitle">
                          {{ getText('survey.access.perDeviceAccess') }}
                        </h4>
                        <p :class="$style.perDeviceDescription">
                          {{ getText('survey.access.perDeviceAccessDescription') }}
                        </p>
                      </div>
                      <div :class="$style.perDeviceToggleContainer">
                        <label :class="$style.toggleSwitch">
                          <input 
                            type="checkbox" 
                            v-model="perDeviceAccessEnabled"
                            :class="$style.toggleInput"
                          />
                          <span :class="$style.toggleSlider"></span>
                        </label>
                      </div>
                    </div>
                  </div>
                </div>

                <!-- Contact Method Selection - Hidden when password protection is enabled with specific email/phone OR per-device access is enabled -->
                <div 
                  v-if="!perDeviceAccessEnabled && (!passwordProtectionEnabled || passwordAccessMode === 'anyone')"
                  :class="$style.contactMethodSection"
                >
                  <div :class="$style.contactMethodHeader">
                    <h4 :class="$style.contactMethodTitle">
                      <i class="fas fa-address-book"></i>
                      {{ getText('survey.access.contactMethod') }}
                    </h4>
                    <p :class="$style.contactMethodDescription">
                      {{ getText('survey.access.contactMethodDescription') }}
                    </p>
                  </div>
                  
                  <div :class="$style.contactMethodOptions">
                    <!-- Email Contact Card -->
                    <div 
                      :class="[$style.contactMethodCard, { [$style.selected]: selectedContactMethod === 'email' }]"
                      @click="selectedContactMethod = 'email'"
                    >
                      <div :class="$style.contactMethodCardContent">
                        <div :class="$style.contactMethodIconWrapper">
                          <i class="fas fa-envelope"></i>
                        </div>
                        <div :class="$style.contactMethodTextContent">
                          <h5 :class="$style.contactMethodName">{{ getText('survey.access.emailContact') }}</h5>
                          <p :class="$style.contactMethodDesc">{{ getText('survey.access.emailDescription') }}</p>
                        </div>
                        <div :class="$style.contactMethodRadioContainer">
                          <div :class="$style.contactMethodRadio">
                            <div v-if="selectedContactMethod === 'email'" :class="$style.radioSelected"></div>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <!--Not ready to use Phone Contact Card -->
                    <!-- <div 
                      :class="[$style.contactMethodCard, { [$style.selected]: selectedContactMethod === 'phone' }]"
                      @click="selectedContactMethod = 'phone'"
                    >
                      <div :class="$style.contactMethodCardContent">
                        <div :class="$style.contactMethodIconWrapper">
                          <i class="fas fa-phone"></i>
                        </div>
                        <div :class="$style.contactMethodTextContent">
                          <h5 :class="$style.contactMethodName">{{ getText('survey.access.phoneContact') }}</h5>
                          <p :class="$style.contactMethodDesc">{{ getText('survey.access.phoneDescription') }}</p>
                        </div>
                        <div :class="$style.contactMethodRadioContainer">
                          <div :class="$style.contactMethodRadio">
                            <div v-if="selectedContactMethod === 'phone'" :class="$style.radioSelected"></div>
                          </div>
                        </div>
                      </div>
                    </div> -->
                  </div>
                </div>

                <!-- Password Protection Section - Hidden when per-device access is enabled -->
                <div v-if="!perDeviceAccessEnabled" :class="$style.passwordProtectionSection">
                  <!-- Password Protection Card -->
                  <div :class="$style.passwordProtectionCard">
                    <div :class="$style.passwordProtectionCardHeader">
                      <div :class="$style.passwordProtectionIconWrapper">
                        <i class="fas fa-shield-alt"></i>
                      </div>
                      <div :class="$style.passwordProtectionTextContent">
                        <h4 :class="$style.passwordProtectionTitle">
                          {{ getText('survey.access.passwordProtection') }}
                        </h4>
                        <p :class="$style.passwordProtectionSubtitle">
                          {{ getText('survey.access.passwordDescription') }}
                        </p>
                      </div>
                      <div :class="$style.passwordProtectionToggleContainer">
                        <label :class="$style.toggleSwitch">
                          <input 
                            type="checkbox" 
                            v-model="passwordProtectionEnabled"
                            :class="$style.toggleInput"
                          />
                          <span :class="$style.toggleSlider"></span>
                        </label>
                      </div>
                    </div>
                  </div>
                  
                  <!-- Password Protection Options -->
                  <div v-if="passwordProtectionEnabled" :class="$style.passwordOptions">
                    <!-- Access Control Options -->
                    <div :class="$style.accessControlSection">
                      <h5 :class="$style.accessControlTitle">
                        {{ getText('survey.access.whoCanAccess') }}
                      </h5>
                      
                      <div :class="$style.accessControlOptions">
                        <!-- Anyone with password -->
                        <div 
                          :class="[$style.accessControlCard, { [$style.selected]: passwordAccessMode === 'anyone' }]"
                          @click="passwordAccessMode = 'anyone'"
                        >
                          <div :class="$style.accessControlCardContent">
                            <div :class="$style.accessControlIconWrapper">
                              <i class="fas fa-users"></i>
                            </div>
                            <div :class="$style.accessControlTextContent">
                              <h5 :class="$style.accessControlName">{{ getText('survey.access.anyoneWithPassword') }}</h5>
                              <p :class="$style.accessControlDesc">{{ getText('survey.access.anyoneWithPasswordDesc') }}</p>
                            </div>
                            <div :class="$style.accessControlRadioContainer">
                              <div :class="$style.accessControlRadio">
                                <div v-if="passwordAccessMode === 'anyone'" :class="$style.radioSelected"></div>
                              </div>
                            </div>
                          </div>
                        </div>
                        
                        <!-- Specific email with password -->
                        <div 
                          :class="[$style.accessControlCard, { [$style.selected]: passwordAccessMode === 'email' }]"
                          @click="passwordAccessMode = 'email'"
                        >
                          <div :class="$style.accessControlCardContent">
                            <div :class="$style.accessControlIconWrapper">
                              <i class="fas fa-envelope-open"></i>
                            </div>
                            <div :class="$style.accessControlTextContent">
                              <h5 :class="$style.accessControlName">{{ getText('survey.access.specificEmail') }}</h5>
                              <p :class="$style.accessControlDesc">{{ getText('survey.access.specificEmailDesc') }}</p>
                            </div>
                            <div :class="$style.accessControlRadioContainer">
                              <div :class="$style.accessControlRadio">
                                <div v-if="passwordAccessMode === 'email'" :class="$style.radioSelected"></div>
                              </div>
                            </div>
                          </div>
                        </div>
                        
                        <!-- Specific phone with password -->
                        <div 
                          :class="[$style.accessControlCard, { [$style.selected]: passwordAccessMode === 'phone' }]"
                          @click="passwordAccessMode = 'phone'"
                        >
                          <div :class="$style.accessControlCardContent">
                            <div :class="$style.accessControlIconWrapper">
                              <i class="fas fa-phone-alt"></i>
                            </div>
                            <div :class="$style.accessControlTextContent">
                              <h5 :class="$style.accessControlName">{{ getText('survey.access.specificPhone') }}</h5>
                              <p :class="$style.accessControlDesc">{{ getText('survey.access.specificPhoneDesc') }}</p>
                            </div>
                            <div :class="$style.accessControlRadioContainer">
                              <div :class="$style.accessControlRadio">
                                <div v-if="passwordAccessMode === 'phone'" :class="$style.radioSelected"></div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      <!-- Email/Phone Multi-Input -->
                      <div v-if="passwordAccessMode === 'email'" :class="$style.contactInput">
                        <label :class="$style.inputLabel">
                          <i class="fas fa-envelope"></i>
                          {{ getText('survey.access.restrictToEmails') }}
                        </label>
                        <div :class="$style.multiInputContainer">
                          <!-- Email Tags -->
                          <div v-if="restrictedEmails.length > 0" :class="$style.contactTags">
                            <div 
                              v-for="(email, index) in restrictedEmails" 
                              :key="index"
                              :class="$style.contactTag"
                            >
                              <span :class="$style.tagText">{{ email }}</span>
                              <button 
                                type="button"
                                :class="$style.tagRemove"
                                @click="removeEmail(index)"
                                :title="getText('common.remove')"
                              >
                                <i class="fas fa-times"></i>
                              </button>
                            </div>
                          </div>
                          
                          <!-- Email Input -->
                          <div :class="$style.inputRow">
                            <input 
                              type="email" 
                              v-model="currentEmailInput"
                              :class="$style.textInput"
                              :placeholder="getText('survey.access.enterEmailPlaceholder')"
                              @keydown.enter.prevent="addEmail"
                              @keydown.comma.prevent="addEmail"
                            />
                            <button 
                              type="button"
                              :class="$style.addButton"
                              @click="addEmail"
                              :disabled="!currentEmailInput.trim()"
                              :title="getText('survey.access.addEmail')"
                            >
                              <i class="fas fa-plus"></i>
                            </button>
                          </div>
                          
                          <small :class="$style.inputHint">
                            {{ getText('survey.access.emailInputHint') }}
                          </small>
                        </div>
                      </div>
                      
                      <div v-if="passwordAccessMode === 'phone'" :class="$style.contactInput">
                        <label :class="$style.inputLabel">
                          <i class="fas fa-phone"></i>
                          {{ getText('survey.access.restrictToPhones') }}
                        </label>
                        <div :class="$style.multiInputContainer">
                          <!-- Phone Tags -->
                          <div v-if="restrictedPhones.length > 0" :class="$style.contactTags">
                            <div 
                              v-for="(phone, index) in restrictedPhones" 
                              :key="index"
                              :class="$style.contactTag"
                            >
                              <span :class="$style.tagText">{{ phone }}</span>
                              <button 
                                type="button"
                                :class="$style.tagRemove"
                                @click="removePhone(index)"
                                :title="getText('common.remove')"
                              >
                                <i class="fas fa-times"></i>
                              </button>
                            </div>
                          </div>
                          
                          <!-- Phone Input with Country Dropdown -->
                          <div :class="$style.inputRow">
                            <div :class="$style.phoneInputWrapper">
                              <!-- Fixed Country Code Display (UAE +971) -->
                              <div :class="$style.countrySelector">
                                <div :class="$style.countryButton">
                                  <span :class="$style.countryFlag">🇦🇪</span>
                                  <span :class="$style.countryCode">+971</span>
                                </div>
                              </div>
                              
                              <!-- Phone Number Input -->
                              <input 
                                type="tel" 
                                v-model="currentPhoneInput"
                                :class="$style.phoneInput"
                                :placeholder="getText('survey.access.enterPhonePlaceholder')"
                                @keydown.enter.prevent="addPhone"
                                @keydown.comma.prevent="addPhone"
                              />
                            </div>
                            
                            <button 
                              type="button"
                              :class="$style.addButton"
                              @click="addPhone"
                              :disabled="!currentPhoneInput.trim()"
                              :title="getText('survey.access.addPhone')"
                            >
                              <i class="fas fa-plus"></i>
                            </button>
                          </div>
                          
                          <small :class="$style.inputHint">
                            {{ getText('survey.access.phoneInputHint') }}
                          </small>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Authenticated Users Access -->
            <div 
              :class="[$style.accessOption, { [$style.selected]: selectedAccess === 'AUTH' }]"
              @click="handleAccessChange('AUTH')"
            >
              <div :class="$style.optionContent">
                <div :class="$style.optionLeft">
                  <!-- <i class="fas fa-users" :class="[$style.optionIcon, $style.auth]"></i> -->
                  <div :class="$style.optionText">
                    <span :class="$style.optionTitle">جميع إدارات دائرة القضاء</span>
                    <small :class="$style.optionDescription">{{ getText('survey.access.authenticated.description') }}</small>
                  </div>
                </div>
                <div :class="$style.optionRadio">
                </div>
              </div>
            </div>

            <!-- Selected (unified users + groups) -->
            <div
              :class="[$style.accessOption, { [$style.selected]: selectedAccess === 'GROUPS' || selectedAccess === 'PRIVATE' }]"
              @click="handleAccessChange('GROUPS')"
            >
              <div :class="$style.optionContent">
                <div :class="$style.optionLeft">
                  <div :class="$style.optionText">
                    <span :class="$style.optionTitle">{{ getText('access.visibility.selected') || 'أشخاص ومجموعات محددة' }}</span>
                    <small :class="$style.optionDescription">{{ getText('survey.access.groups.description') }}</small>
                  </div>
                </div>
                <div :class="$style.optionRadio">
                </div>
              </div>
              
              <!-- AccessPicker: unified user+group selector -->
              <div v-if="selectedAccess === 'GROUPS' || selectedAccess === 'PRIVATE'" :class="$style.groupsSection" @click.stop>
                <AccessPicker
                  :initial-users="pickerUsers"
                  :initial-groups="pickerGroups"
                  @change="onPickerChange"
                />
              </div>
            </div>
          </div>
        </div>

        <!-- Status Message -->
        <!-- <div v-if="statusMessage" :class="[$style.statusMessage, statusMessage.type]">
          <i :class="statusMessage.icon"></i>
          <span>{{ statusMessage.text }}</span>
        </div> -->
      </div>

      <!-- Footer -->
      <div :class="$style.modalFooter">
      
        <button
          type="button"
          :class="[$style.footerButton, $style.saveButton, { [$style.loading]: isSaving }]"
          @click="handleSave"
          :disabled="isSaveDisabled"
          :title="saveButtonTooltip"
        >
          <div v-if="isSaving" :class="$style.loadingSpinner"></div>
          <i v-else class="fas fa-save"></i>
          {{ getText('survey.access.saveChanges') }}
        </button>
          <button
          type="button"
          :class="[$style.footerButton, $style.cancelButton]"
          @click="$emit('cancel')"
        >
          {{ getText('common.cancel') }}
        </button>
        
      </div>
    </div>
  </div>

  <!-- Link Sharing Modal -->
  <LinkSharingModal
    :is-visible="isLinkSharingModalVisible"
    :survey="survey"
    :public-link="publicLink"
    :password-protected-link="passwordProtectedLink"
    @close="closeLinkSharingModal"
    @link-generated="handleLinkGenerated"
    @status-update="handleStatusUpdate"
  />
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { useAppStore } from '../../stores/useAppStore'
import { surveyService } from '../../services/surveyService'
import LinkSharingModal from '../LinkSharingModal/LinkSharingModal.vue'
import AccessPicker from '../Survey/AccessPicker.vue'
import type { SharedAudience } from '../../types/survey.types'
import type {
  Survey,
  SurveyVisibility,
  PublicLinkResponse,
  PasswordProtectedLinkResponse,
  PasswordProtectedLinkRequest,
  User,
  PublicContactMethod
} from '../../types/survey.types'

// Props
interface Props {
  survey: Survey
  isSubmissionFlow?: boolean
}

const props = defineProps<Props>()

// Emits
const emit = defineEmits<{
  save: [data: { visibility: SurveyVisibility; publicContactMethod?: PublicContactMethod; users: User[]; emails: string[]; groups?: AdminGroup[]; passwordProtected?: boolean; passwordOptions?: any; per_device_access?: boolean }]
  cancel: []
}>()

// Store
const store = useAppStore()

// Computed
const currentTheme = computed(() => store.currentTheme)
const isRTL = computed(() => store.currentLanguage === 'ar')
const currentLanguage = computed(() => store.currentLanguage)

// Check if save button should be disabled
const isSaveDisabled = computed(() => {
  if (isSaving.value) return true
  if (!selectedAccess.value) return true
  return false
})

// Tooltip text for disabled save button
const saveButtonTooltip = computed(() => {
  if (isSaving.value) return currentLanguage.value === 'ar' ? 'جاري الحفظ...' : 'Saving...'
  if (!selectedAccess.value) {
    return currentLanguage.value === 'ar' ? 'يرجى اختيار مستوى الوصول' : 'Please select an access level'
  }
  return currentLanguage.value === 'ar' ? 'حفظ التغييرات' : 'Save Changes'
})

// Inline translations
const translations = computed(() => {
  const translationsMap: Record<string, string> = currentLanguage.value === 'ar' ? {
    // Modal
    'survey.access.title': 'مشاركة الاستطلاع',
    'survey.access.level': 'مستوى الوصول',
    
    // Public Access
    'survey.access.public.title': 'عام',
    'survey.access.public.description': 'أي شخص لديه الرابط',
    'survey.access.contactMethod': 'طريقة التواصل',
    'survey.access.contactMethodDescription': 'اختر الطريقة المطلوبة للمشاركة المجهولة',
    'survey.access.emailContact': 'بريد إلكتروني',
    'survey.access.emailDescription': 'المشاركون يحتاجون بريد إلكتروني',
    'survey.access.phoneContact': 'هاتف',
    'survey.access.phoneDescription': 'المشاركون يحتاجون رقم هاتف',
    'survey.access.perDeviceAccess': 'وصول لكل جهاز',
    'survey.access.perDeviceAccessDescription': 'السماح بالوصول بدون متطلبات البريد الإلكتروني أو الهاتف',
    'survey.access.enablePerDeviceAccess': 'تمكين الوصول لكل جهاز',
    
    // Password Protection
    'survey.access.passwordProtection': 'الحماية بكلمة مرور',
    'survey.access.enablePasswordProtection': 'تفعيل الحماية بكلمة مرور',
    'survey.access.passwordDescription': 'سيتم إنشاء كلمة مرور تلقائياً لحماية الاستطلاع',
    'survey.access.whoCanAccess': 'من يمكنه الوصول؟',
    'survey.access.anyoneWithPassword': 'أي شخص لديه كلمة المرور',
    'survey.access.anyoneWithPasswordDesc': 'أي شخص يملك الرابط وكلمة المرور يمكنه الوصول',
    'survey.access.specificEmail': 'بريد إلكتروني محدد',
    'survey.access.specificEmailDesc': 'بريد إلكتروني محدد فقط + كلمة المرور',
    'survey.access.specificPhone': 'هاتف محدد',
    'survey.access.specificPhoneDesc': 'رقم هاتف محدد فقط + كلمة المرور',
    'survey.access.restrictToEmails': 'قصر الوصول على عناوين البريد الإلكتروني',
    'survey.access.restrictToPhones': 'قصر الوصول على أرقام الهاتف',
    'survey.access.enterEmailPlaceholder': 'أدخل البريد الإلكتروني',
    'survey.access.enterPhonePlaceholder': 'أدخل رقم الهاتف',
    'survey.access.addEmail': 'إضافة بريد إلكتروني',
    'survey.access.addPhone': 'إضافة رقم هاتف',
    'survey.access.emailInputHint': 'اضغط Enter أو الفاصلة لإضافة البريد الإلكتروني',
    'survey.access.phoneInputHint': 'اضغط Enter أو الفاصلة لإضافة رقم الهاتف',
    'common.remove': 'حذف',
    
    'survey.access.linkMode': 'رابط',
    'survey.access.qrMode': 'رمز QR',
    'survey.access.scanToAccess': 'امسح للوصول إلى الاستطلاع',
    'survey.access.generateLink': 'إنشاء رابط',
    'survey.access.regenerate': 'إعادة إنشاء',
    'survey.access.revoke': 'إلغاء',
    'survey.access.download': 'تحميل',
    'survey.access.copy': 'نسخ',
    'survey.access.downloadQR': 'تحميل رمز QR',
    'survey.access.copyQR': 'نسخ رمز QR',
    'survey.access.shareByEmail': 'مشاركة عبر البريد الإلكتروني',
    'survey.access.shareByWhatsApp': 'مشاركة عبر واتساب',
    'survey.access.shareBySMS': 'مشاركة عبر الرسائل النصية',
    'survey.access.email': 'بريد إلكتروني',
    'survey.access.whatsapp': 'واتساب',
    'survey.access.sms': 'رسائل نصية',
    'survey.access.downloadPackage': 'تحميل حزمة المشاركة',
    'survey.access.package': 'حزمة',
    'survey.access.confirmRegenerateLink': 'إعادة إنشاء الرابط العام؟',
    'survey.access.confirmRevokeLink': 'إلغاء الرابط العام؟',
    
    // Authenticated Access
    'survey.access.authenticated.title': 'مصدق',
    'survey.access.authenticated.description': 'المستخدمون المسجلون فقط',
    
    // Group Access
    'survey.access.groups.title': 'مجموعات',
    'survey.access.groups.description': 'مجموعات محددة فقط',
    'survey.access.groupsSelected': 'مجموعات محددة',
    'survey.access.loadingGroups': 'جاري تحميل المجموعات...',
    'survey.access.noGroups': 'لا توجد مجموعات متاحة للمشاركة',
    'survey.access.members': 'أعضاء',
    'survey.access.selectAll': 'تحديد الكل',
    'survey.access.clearAll': 'إلغاء الكل',
    
    // Private Access
    'survey.access.private.title': 'خاص',
    'survey.access.private.description': 'مستخدمون محددون فقط',
    'survey.access.searchUsers': 'البحث عن المستخدمين...',
    'survey.access.usersSelected': 'مستخدمين محددين',
    'access.visibility.selected': 'أشخاص ومجموعات محددة',
    
    // Common
    'common.cancel': 'إلغاء',
    'common.copy': 'نسخ',
    'survey.access.saveChanges': 'حفظ التغييرات',
    
    // Admin Levels
    'userManagement.adminLevel.admin': 'مدير',
    'userManagement.adminLevel.super_admin': 'مدير عام',
    'userManagement.adminLevel.moderator': 'مشرف'
  } : {
    // Modal
    'survey.access.title': 'Share Survey',
    'survey.access.level': 'Access Level',
    
    // Public Access
    'survey.access.public.title': 'Public',
    'survey.access.public.description': 'Anyone with link',
    'survey.access.contactMethod': 'Contact Method',
    'survey.access.contactMethodDescription': 'Choose required method for anonymous submissions',
    'survey.access.emailContact': 'Email',
    'survey.access.emailDescription': 'Participants need email address',
    'survey.access.phoneContact': 'Phone',
    'survey.access.phoneDescription': 'Participants need phone number',
    'survey.access.perDeviceAccess': 'Per-Device Access',
    'survey.access.perDeviceAccessDescription': 'Allow access without email or phone requirements',
    'survey.access.enablePerDeviceAccess': 'Enable per-device access',
    
    // Password Protection
    'survey.access.passwordProtection': 'Password Protection',
    'survey.access.enablePasswordProtection': 'Enable password protection',
    'survey.access.passwordDescription': 'A password will be automatically generated to protect the survey',
    'survey.access.whoCanAccess': 'Who can access?',
    'survey.access.anyoneWithPassword': 'Anyone with password',
    'survey.access.anyoneWithPasswordDesc': 'Anyone with the link and password can access',
    'survey.access.specificEmail': 'Specific email',
    'survey.access.specificEmailDesc': 'Specific email only + password',
    'survey.access.specificPhone': 'Specific phone',
    'survey.access.specificPhoneDesc': 'Specific phone number only + password',
    'survey.access.restrictToEmails': 'Restrict to email addresses',
    'survey.access.restrictToPhones': 'Restrict to phone numbers',
    'survey.access.enterEmailPlaceholder': 'Enter email address',
    'survey.access.enterPhonePlaceholder': 'Enter phone number',
    'survey.access.addEmail': 'Add email',
    'survey.access.addPhone': 'Add phone',
    'survey.access.emailInputHint': 'Press Enter or comma to add email',
    'survey.access.phoneInputHint': 'Press Enter or comma to add phone',
    'common.remove': 'Remove',
    
    'survey.access.linkMode': 'Link',
    'survey.access.qrMode': 'QR Code',
    'survey.access.scanToAccess': 'Scan to access survey',
    'survey.access.generateLink': 'Generate Link',
    'survey.access.regenerate': 'Regenerate',
    'survey.access.revoke': 'Revoke',
    'survey.access.download': 'Download',
    'survey.access.copy': 'Copy',
    'survey.access.downloadQR': 'Download QR Code',
    'survey.access.copyQR': 'Copy QR Code',
    'survey.access.shareByEmail': 'Share by Email',
    'survey.access.shareByWhatsApp': 'Share by WhatsApp',
    'survey.access.shareBySMS': 'Share by SMS',
    'survey.access.email': 'Email',
    'survey.access.whatsapp': 'WhatsApp',
    'survey.access.sms': 'SMS',
    'survey.access.downloadPackage': 'Download Share Package',
    'survey.access.package': 'Package',
    'survey.access.confirmRegenerateLink': 'Regenerate public link?',
    'survey.access.confirmRevokeLink': 'Revoke public link?',
    
    // Authenticated Access
    'survey.access.authenticated.title': 'Authenticated',
    'survey.access.authenticated.description': 'Logged in users only',
    
    // Group Access
    'survey.access.groups.title': 'Groups',
    'survey.access.groups.description': 'Specific groups only',
    'survey.access.groupsSelected': 'groups selected',
    'survey.access.loadingGroups': 'Loading groups...',
    'survey.access.noGroups': 'No groups available for sharing',
    'survey.access.members': 'members',
    'survey.access.selectAll': 'Select All',
    'survey.access.clearAll': 'Clear All',
    
    // Private Access
    'survey.access.private.title': 'Private',
    'survey.access.private.description': 'Specific users only',
    'survey.access.searchUsers': 'Search users...',
    'survey.access.usersSelected': 'users selected',
    'access.visibility.selected': 'Specific people and groups',
    
    // Common
    'common.cancel': 'Cancel',
    'common.copy': 'Copy',
    'survey.access.saveChanges': 'Save Changes',
    
    // Admin Levels
    'userManagement.adminLevel.admin': 'Admin',
    'userManagement.adminLevel.super_admin': 'Super Admin',
    'userManagement.adminLevel.moderator': 'Moderator'
  }
  return translationsMap
})

// Translation helper function
const getText = (key: string, fallback?: string) => {
  return translations.value[key] || fallback || key
}

// State — pre-select the survey's current visibility
const selectedAccess = ref<SurveyVisibility | ''>(props.survey.visibility || '')
const selectedContactMethod = ref<PublicContactMethod>(props.survey.public_contact_method || 'email')
const perDeviceAccessEnabled = ref(props.survey.per_device_access || false)
const publicLink = ref<PublicLinkResponse | null>(null)
const isSaving = ref(false)

// Link Sharing Modal State
const isLinkSharingModalVisible = ref(false)

// Status message for user feedback
const statusMessage = ref<{
  text: string
  type: 'success' | 'error' | 'warning' | 'info'
  icon: string
} | null>(null)

// User management
const selectedUsers = ref<User[]>([])
// Note: Email invitation variables kept for potential future enhancements
// const inviteEmail = ref('')
// const invitedEmails = ref<string[]>([])

// Access picker state (unified users + groups for SELECTED visibility)
const pickerUsers = ref<SharedAudience['users']>([])
const pickerGroups = ref<SharedAudience['groups']>([])

function onPickerChange(audience: { users: SharedAudience['users']; groups: SharedAudience['groups'] }) {
  pickerUsers.value = audience.users
  pickerGroups.value = audience.groups
}

// Password protection
const passwordProtectionEnabled = ref(false)
const passwordAccessMode = ref<'anyone' | 'email' | 'phone'>('anyone')
const restrictedEmails = ref<string[]>([])
const restrictedPhones = ref<string[]>([])
const currentEmailInput = ref('')
const currentPhoneInput = ref('')
const passwordProtectedLink = ref<PasswordProtectedLinkResponse | null>(null)

// Phone country code - Fixed to UAE
const selectedCountryCode = '+971' // Always UAE

const handleAccessChange = (access: SurveyVisibility) => {
  selectedAccess.value = access
  clearStatusMessage()
}

const setStatusMessage = (text: string, type: 'success' | 'error' | 'warning' | 'info') => {
  const iconMap = {
    success: 'fas fa-check-circle',
    error: 'fas fa-exclamation-triangle',
    warning: 'fas fa-exclamation-circle',
    info: 'fas fa-info-circle'
  }
  
  statusMessage.value = {
    text,
    type,
    icon: iconMap[type]
  }
  
  // Auto-clear after 5 seconds for success messages
  if (type === 'success') {
    setTimeout(() => {
      clearStatusMessage()
    }, 5000)
  }
}

const clearStatusMessage = () => {
  statusMessage.value = null
}

// LinkSharingModal Methods
const closeLinkSharingModal = () => {
  isLinkSharingModalVisible.value = false
  
  // Emit save when LinkSharingModal closes for PUBLIC access
  if (selectedAccess.value === 'PUBLIC') {
    const saveData = {
      visibility: selectedAccess.value,
      publicContactMethod: selectedContactMethod.value,
      users: selectedUsers.value,
      emails: [] as string[], // Email invitations removed from compact UI
      groups: [],
      passwordProtected: passwordProtectionEnabled.value,
      passwordOptions: passwordProtectionEnabled.value ? {
        passwordAccessMode: passwordAccessMode.value,
        restrictedEmails: [...restrictedEmails.value],
        restrictedPhones: [...restrictedPhones.value]
      } : undefined,
      per_device_access: perDeviceAccessEnabled.value
    }
    emit('save', saveData)
  }
}

const handleLinkGenerated = (link: PublicLinkResponse) => {
  publicLink.value = link
  setStatusMessage('Public link generated successfully', 'success')
}

const handleStatusUpdate = (message: string, type: 'success' | 'error' | 'warning' | 'info') => {
  setStatusMessage(message, type)
}

// Public Link Management - Only called when user explicitly saves
const loadPublicLink = async () => {
  try {
    if (!props.survey?.id) {
      throw new Error('Survey ID is required')
    }
    const surveyId = String(props.survey.id)
    const response = await surveyService.getPublicLink(surveyId)
    publicLink.value = response.data
    
  } catch (error: any) {
    // Logging removed for production
    if (error.response?.status !== 404) {
      setStatusMessage('Failed to load public link', 'error')
    }
  }
}

// Email and Phone Management
const addEmail = () => {
  const email = currentEmailInput.value.trim()
  if (!email) return
  
  // Basic email validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(email)) {
    setStatusMessage(
      currentLanguage.value === 'ar' 
        ? 'البريد الإلكتروني غير صالح'
        : 'Invalid email address',
      'error'
    )
    return
  }
  
  // Check for duplicates
  if (restrictedEmails.value.includes(email)) {
    setStatusMessage(
      currentLanguage.value === 'ar' 
        ? 'البريد الإلكتروني موجود بالفعل'
        : 'Email already added',
      'warning'
    )
    return
  }
  
  restrictedEmails.value.push(email)
  currentEmailInput.value = ''
  setStatusMessage(
    currentLanguage.value === 'ar' 
      ? 'تم إضافة البريد الإلكتروني بنجاح'
      : 'Email added successfully',
    'success'
  )
}

const removeEmail = (index: number) => {
  if (index >= 0 && index < restrictedEmails.value.length) {
    const removed = restrictedEmails.value.splice(index, 1)[0]
    setStatusMessage(
      currentLanguage.value === 'ar' 
        ? `تم حذف ${removed}`
        : `Removed ${removed}`,
      'success'
    )
  }
}

const addPhone = () => {
  const phoneNumber = currentPhoneInput.value.trim()
  if (!phoneNumber) return
  
  // Create full phone number with country code (always +971 for UAE)
  const fullPhone = selectedCountryCode + phoneNumber.replace(/^\+/, '')
  
  // Basic phone validation (allow international format)
  const phoneRegex = /^[+]?[1-9][\d]{0,15}$/
  if (!phoneRegex.test(fullPhone.replace(/[\s-()]/g, ''))) {
    setStatusMessage(
      currentLanguage.value === 'ar' 
        ? 'رقم الهاتف غير صالح'
        : 'Invalid phone number',
      'error'
    )
    return
  }
  
  // Check for duplicates
  if (restrictedPhones.value.includes(fullPhone)) {
    setStatusMessage(
      currentLanguage.value === 'ar' 
        ? 'رقم الهاتف موجود بالفعل'
        : 'Phone number already added',
      'warning'
    )
    return
  }
  
  restrictedPhones.value.push(fullPhone)
  currentPhoneInput.value = ''
  setStatusMessage(
    currentLanguage.value === 'ar' 
      ? 'تم إضافة رقم الهاتف بنجاح'
      : 'Phone number added successfully',
    'success'
  )
}

const removePhone = (index: number) => {
  if (index >= 0 && index < restrictedPhones.value.length) {
    const removed = restrictedPhones.value.splice(index, 1)[0]
    setStatusMessage(
      currentLanguage.value === 'ar' 
        ? `تم حذف ${removed}`
        : `Removed ${removed}`,
      'success'
    )
  }
}

// Save Changes using PATCH API
const handleSave = async () => {
  try {
    isSaving.value = true
    clearStatusMessage()

    // Validate that an access level is selected
    if (!selectedAccess.value) {
      const message = currentLanguage.value === 'ar' 
        ? 'يرجى اختيار مستوى الوصول'
        : 'Please select an access level'
      setStatusMessage(message, 'warning')
      return
    }

    // Validate survey ID is present
    if (!props.survey?.id) {
      const message = currentLanguage.value === 'ar' 
        ? 'معرف الاستطلاع مطلوب ولا يمكن أن يكون فارغاً'
        : 'Survey ID is required and cannot be undefined'
      setStatusMessage(message, 'error')
      return
    }

    // Map visibility to access level for the PATCH API
    let accessLevel: 'public' | 'authenticated' | 'private' | 'groups'
    switch (selectedAccess.value) {
      case 'PUBLIC':  accessLevel = 'public'; break
      case 'AUTH':    accessLevel = 'authenticated'; break
      case 'PRIVATE': accessLevel = 'private'; break
      case 'GROUPS':  accessLevel = 'groups'; break
      default:        accessLevel = 'private'
    }

    const contactMethod = selectedAccess.value === 'PUBLIC' && !perDeviceAccessEnabled.value ? selectedContactMethod.value : undefined
    const surveyId = String(props.survey.id)

    // SELECTED (GROUPS or PRIVATE): use audience endpoint — handles both users + groups in one call
    if (selectedAccess.value === 'GROUPS' || selectedAccess.value === 'PRIVATE') {
      await surveyService.setSurveyAudience(surveyId, {
        visibility: 'PRIVATE',
        user_ids: pickerUsers.value.map(u => u.id),
        group_ids: pickerGroups.value.map(g => g.id)
      })
    } else {
      // PUBLIC / AUTH: standard PATCH
      await surveyService.updateSurveyAccess(surveyId, accessLevel, contactMethod, perDeviceAccessEnabled.value)
    }
    
    // If this is a submission flow (draft -> submitted), also call the submit endpoint
    if (props.isSubmissionFlow && props.survey.status === 'draft') {
      await surveyService.submitSurvey(surveyId)
      setStatusMessage(
        currentLanguage.value === 'ar' 
          ? 'تم إرسال الاستطلاع بنجاح' 
          : 'Survey submitted successfully',
        'success'
      )
    } else {
      setStatusMessage('Survey access updated successfully', 'success')
    }
    
    // Show information about token invalidation if visibility changed from PUBLIC
    if (props.survey.visibility === 'PUBLIC' && selectedAccess.value !== 'PUBLIC') {
      setTimeout(() => {
        setStatusMessage('Public access tokens have been automatically invalidated for security', 'info')
      }, 2000)
    }

    // Open LinkSharingModal automatically if PUBLIC access is selected (but not in submission flow)
    if (selectedAccess.value === 'PUBLIC' && !props.isSubmissionFlow) {
      // Handle password protection
      if (passwordProtectionEnabled.value) {
        try {
          const passwordLinkOptions: PasswordProtectedLinkRequest = {
            days_to_expire: 30
          }
          
          
          if (passwordAccessMode.value === 'email' && restrictedEmails.value.length > 0) {
            // Convert reactive proxy to plain array and send the entire array of restricted emails
            passwordLinkOptions.restricted_email = [...restrictedEmails.value]
          } 
          
          if (passwordAccessMode.value === 'phone' && restrictedPhones.value.length > 0) {
            // Convert reactive proxy to plain array and send the entire array of restricted phones
            passwordLinkOptions.restricted_phone = [...restrictedPhones.value]
          }
          
          
          const passwordLinkResponse = await surveyService.generatePasswordProtectedLink(surveyId, passwordLinkOptions)
          passwordProtectedLink.value = passwordLinkResponse.data
          
          setStatusMessage(
            currentLanguage.value === 'ar' 
              ? 'تم إنشاء رابط محمي بكلمة مرور بنجاح'
              : 'Password-protected link generated successfully',
            'success'
          )
          
          // Show modal with password-protected link
          setTimeout(() => {
            isLinkSharingModalVisible.value = true
          }, 100)
        } catch (error: any) {
          const errorMessage = currentLanguage.value === 'ar' 
            ? 'فشل في إنشاء رابط محمي بكلمة مرور'
            : 'Failed to generate password-protected link'
          setStatusMessage(errorMessage, 'error')
        }
      } else {
        // Load regular public link when user explicitly saves, then open the modal
        await loadPublicLink()
        // Open the modal first, emit save later when modal closes
        setTimeout(() => {
          isLinkSharingModalVisible.value = true
        }, 100)
      }
      // Don't emit save immediately for PUBLIC access - let the modal handle it (unless in submission flow)
      if (props.isSubmissionFlow) {
        // In submission flow, emit save immediately even for PUBLIC access
        const saveData = {
          visibility: selectedAccess.value,
          publicContactMethod: selectedContactMethod.value,
          users: selectedUsers.value,
          emails: [] as string[],
          groups: [],
          passwordProtected: passwordProtectionEnabled.value,
          passwordOptions: passwordProtectionEnabled.value ? {
            passwordAccessMode: passwordAccessMode.value,
            restrictedEmails: [...restrictedEmails.value],
            restrictedPhones: [...restrictedPhones.value]
          } : undefined,
          per_device_access: perDeviceAccessEnabled.value
        }
        emit('save', saveData)
      }
    } else {
      // For non-PUBLIC access or submission flow, emit save immediately
      const saveData = {
        visibility: selectedAccess.value,
        publicContactMethod: selectedAccess.value === 'PUBLIC' ? selectedContactMethod.value : undefined,
        users: selectedUsers.value,
        emails: [] as string[], // Email invitations removed from compact UI
        groups: [],
        passwordProtected: selectedAccess.value === 'PUBLIC' ? passwordProtectionEnabled.value : false,
        passwordOptions: selectedAccess.value === 'PUBLIC' && passwordProtectionEnabled.value ? {
          passwordAccessMode: passwordAccessMode.value,
          restrictedEmails: [...restrictedEmails.value],
          restrictedPhones: [...restrictedPhones.value]
        } : undefined,
        per_device_access: selectedAccess.value === 'PUBLIC' ? perDeviceAccessEnabled.value : false
      }
      emit('save', saveData)
    }
  } catch (error: any) {
    // Logging removed for production
    
    // Enhanced error handling based on API response
    let errorMessage = 'Failed to save access settings'
    if (error.response?.data?.message) {
      errorMessage = error.response.data.message
    } else if (error.response?.data?.data) {
      // Handle validation errors
      const validationErrors = Object.values(error.response.data.data).flat()
      errorMessage = validationErrors.join(', ')
    } else if (error.message) {
      errorMessage = error.message
    }
    
    setStatusMessage(errorMessage, 'error')
  } finally {
    isSaving.value = false
  }
}

// Load existing shared users to pre-populate the picker
const loadSharedUsers = async () => {
  const vis = props.survey.visibility
  if (vis !== 'PRIVATE' && vis !== 'GROUPS') return
  try {
    if (!props.survey?.id) return
    const surveyId = String(props.survey.id)
    const response = await surveyService.getSharedUsers(surveyId)
    const users = response.data.shared_users || []
    selectedUsers.value = users
    pickerUsers.value = users.map(u => ({
      id: u.id,
      email: u.email,
      full_name: (u as any).full_name || (u as any).name || ''
    }))
  } catch {
    // non-critical — picker just starts empty
  }
}

// Watchers

// Watch password access mode to automatically set contact method
watch(() => passwordAccessMode.value, (newMode) => {
  if (passwordProtectionEnabled.value) {
    if (newMode === 'email') {
      selectedContactMethod.value = 'email'
    } else if (newMode === 'phone') {
      selectedContactMethod.value = 'phone'
    }
  }
})

// Watch password protection enabled state
watch(() => passwordProtectionEnabled.value, (isEnabled) => {
  if (isEnabled && passwordAccessMode.value !== 'anyone') {
    // Set contact method based on current password access mode
    if (passwordAccessMode.value === 'email') {
      selectedContactMethod.value = 'email'
    } else if (passwordAccessMode.value === 'phone') {
      selectedContactMethod.value = 'phone'
    }
  }
})

// Watch per-device access enabled state
watch(() => perDeviceAccessEnabled.value, (isEnabled) => {
  if (isEnabled) {
    // Disable password protection when per-device access is enabled
    passwordProtectionEnabled.value = false
  }
})

// Lifecycle
onMounted(() => {
  document.body.classList.add('modal-open')
  loadSharedUsers()
})

// Cleanup when component unmounts
onUnmounted(() => {
  // Restore body scroll
  document.body.classList.remove('modal-open')
})
</script>

<style module src="./SurveyAccessModal.module.css">
/* CSS Module styles are imported from SurveyAccessModal.module.css */
</style>
