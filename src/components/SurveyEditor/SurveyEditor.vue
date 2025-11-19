<template>
  <div :class="$style.editorContainer" :data-theme="currentTheme" :dir="isRTL ? 'rtl' : 'ltr'">
    <!-- Header -->
    <div :class="$style.editorHeader">
      <div :class="$style.headerContent">
        <button :class="$style.backButton" @click="handleBack">
          <i class="fas fa-arrow-right"></i>
          <span>{{ isRTL ? 'رجوع' : 'Back' }}</span>
        </button>
        <div :class="$style.headerTitle">
          <i class="fas fa-poll-h"></i>
          <span>{{ isRTL ? 'تصميم الاستطلاع' : 'Survey Builder' }}</span>
        </div>
        <div :class="$style.headerActions">
          <!-- Button 1: Scheduling Settings -->
          <button :class="[$style.headerButton, $style.iconButton]" @click="openSchedulingModal" :title="isRTL ? 'تحديد المدة' : 'Scheduling Settings'">
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M1.5 9C1.5 6.17157 1.5 4.75736 2.37868 3.87868C3.25736 3 4.67157 3 7.5 3H10.5C13.3284 3 14.7426 3 15.6213 3.87868C16.5 4.75736 16.5 6.17157 16.5 9V10.5C16.5 13.3284 16.5 14.7426 15.6213 15.6213C14.7426 16.5 13.3284 16.5 10.5 16.5H7.5C4.67157 16.5 3.25736 16.5 2.37868 15.6213C1.5 14.7426 1.5 13.3284 1.5 10.5V9Z" stroke="currentColor" stroke-width="1.125"/>
              <path d="M5.25 3V1.875" stroke="currentColor" stroke-width="1.125" stroke-linecap="round"/>
              <path d="M12.75 3V1.875" stroke="currentColor" stroke-width="1.125" stroke-linecap="round"/>
              <path d="M6.75 10.875L7.875 9.75V12.75" stroke="currentColor" stroke-width="1.125" stroke-linecap="round" stroke-linejoin="round"/>
              <path d="M9.75 12V10.5C9.75 10.0858 10.0858 9.75 10.5 9.75C10.9142 9.75 11.25 10.0858 11.25 10.5V12C11.25 12.4142 10.9142 12.75 10.5 12.75C10.0858 12.75 9.75 12.4142 9.75 12Z" stroke="currentColor" stroke-width="1.125" stroke-linecap="round"/>
              <path d="M1.875 6.75H16.125" stroke="currentColor" stroke-width="1.125" stroke-linecap="round"/>
            </svg>
            <span>{{ isRTL ? 'تحديد المدة' : 'Schedule' }}</span>
          </button>

          <!-- Button 2: Preview -->
          <button :class="[$style.headerButton, $style.iconButton]" @click="togglePreview" :title="isRTL ? 'معاينة' : 'Preview'">
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
              <g clip-path="url(#clip0_219_10368)">
                <path d="M1.54688 9.26103C1.48437 9.09264 1.48437 8.90741 1.54688 8.73903C2.15565 7.26292 3.18902 6.00081 4.51596 5.1127C5.8429 4.22459 7.40366 3.75049 9.00038 3.75049C10.5971 3.75049 12.1579 4.22459 13.4848 5.1127C14.8117 6.00081 15.8451 7.26292 16.4539 8.73903C16.5164 8.90741 16.5164 9.09264 16.4539 9.26103C15.8451 10.7371 14.8117 11.9992 13.4848 12.8874C12.1579 13.7755 10.5971 14.2496 9.00038 14.2496C7.40366 14.2496 5.8429 13.7755 4.51596 12.8874C3.18902 11.9992 2.15565 10.7371 1.54688 9.26103Z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                <path d="M9 11.25C10.2426 11.25 11.25 10.2426 11.25 9C11.25 7.75736 10.2426 6.75 9 6.75C7.75736 6.75 6.75 7.75736 6.75 9C6.75 10.2426 7.75736 11.25 9 11.25Z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
              </g>
              <defs>
                <clipPath id="clip0_219_10368">
                  <rect width="18" height="18" fill="white"/>
                </clipPath>
              </defs>
            </svg>
            <span>{{ isRTL ? 'معاينة' : 'Preview' }}</span>
          </button>

          <!-- Button 3: Survey Settings -->
          <button :class="[$style.headerButton, $style.iconButton]" @click="openSurveySettingsModal" :title="isRTL ? 'الإعدادات' : 'Settings'">
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M7.25177 3.10211C7.29309 2.66737 7.49502 2.26365 7.8181 1.96982C8.14117 1.676 8.56219 1.51318 8.99889 1.51318C9.4356 1.51318 9.85662 1.676 10.1797 1.96982C10.5028 2.26365 10.7047 2.66737 10.746 3.10211C10.7709 3.38295 10.863 3.65368 11.0146 3.89137C11.1662 4.12906 11.3729 4.32672 11.6171 4.46762C11.8613 4.60852 12.1359 4.68851 12.4175 4.70083C12.6992 4.71314 12.9797 4.65742 13.2353 4.53836C13.6321 4.3582 14.0818 4.33213 14.4968 4.46523C14.9118 4.59833 15.2624 4.88108 15.4804 5.25844C15.6984 5.63581 15.7682 6.08079 15.6763 6.50679C15.5843 6.93279 15.3371 7.30933 14.9828 7.56311C14.7521 7.725 14.5637 7.94007 14.4337 8.19013C14.3037 8.4402 14.2358 8.71789 14.2358 8.99974C14.2358 9.28158 14.3037 9.55928 14.4337 9.80934C14.5637 10.0594 14.7521 10.2745 14.9828 10.4364C15.3371 10.6902 15.5843 11.0667 15.6763 11.4927C15.7682 11.9187 15.6984 12.3637 15.4804 12.741C15.2624 13.1184 14.9118 13.4011 14.4968 13.5342C14.0818 13.6673 13.6321 13.6413 13.2353 13.4611C12.9797 13.3421 12.6992 13.2863 12.4175 13.2986C12.1359 13.311 11.8613 13.391 11.6171 13.5319C11.3729 13.6728 11.1662 13.8704 11.0146 14.1081C10.863 14.3458 10.7709 14.6165 10.746 14.8974C10.7047 15.3321 10.5028 15.7358 10.1797 16.0297C9.85662 16.3235 9.4356 16.4863 8.99889 16.4863C8.56219 16.4863 8.14117 16.3235 7.8181 16.0297C7.49502 15.7358 7.29309 15.3321 7.25177 14.8974C7.22698 14.6164 7.13484 14.3456 6.98317 14.1078C6.83149 13.87 6.62475 13.6723 6.38044 13.5314C6.13614 13.3905 5.86147 13.3105 5.5797 13.2983C5.29794 13.2861 5.01737 13.3419 4.76177 13.4611C4.36494 13.6413 3.91526 13.6673 3.50027 13.5342C3.08527 13.4011 2.73465 13.1184 2.51663 12.741C2.29862 12.3637 2.22881 11.9187 2.32079 11.4927C2.41277 11.0667 2.65997 10.6902 3.01427 10.4364C3.24498 10.2745 3.43332 10.0594 3.56334 9.80934C3.69335 9.55928 3.76123 9.28158 3.76123 8.99974C3.76123 8.71789 3.69335 8.4402 3.56334 8.19013C3.43332 7.94007 3.24498 7.725 3.01427 7.56311C2.66047 7.3092 2.41371 6.93281 2.32195 6.5071C2.23018 6.08139 2.29998 5.63677 2.51776 5.25965C2.73554 4.88253 3.08575 4.59985 3.50034 4.46654C3.91492 4.33324 4.36426 4.35884 4.76102 4.53836C5.01659 4.65742 5.29708 4.71314 5.57874 4.70083C5.86041 4.68851 6.13497 4.60852 6.37917 4.46762C6.62338 4.32672 6.83004 4.12906 6.98167 3.89137C7.1333 3.65368 7.22543 3.38295 7.25027 3.10211" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
              <path d="M9 11.25C10.2426 11.25 11.25 10.2426 11.25 9C11.25 7.75736 10.2426 6.75 9 6.75C7.75736 6.75 6.75 7.75736 6.75 9C6.75 10.2426 7.75736 11.25 9 11.25Z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
            <span>{{ isRTL ? 'الإعدادات' : 'Settings' }}</span>
          </button>

          <!-- Button 4 & 5: Draft and Publish (conditional) -->
          <template v-if="props.isCreatingPredefinedTemplate">
            <button :class="[$style.headerButton, $style.publishButton]" @click="handleSaveTemplate" :disabled="!canPublish">
              <i class="fas fa-save"></i>
              <span>{{ isRTL ? 'حفظ القالب' : 'Save Template' }}</span>
            </button>
          </template>
          <template v-else>
            <button :class="[$style.headerButton, $style.draftButton]" @click="handleSaveAsDraft" :disabled="!canPublish">
              <span>{{ isRTL ? 'حفظ كمسودة' : 'Save as Draft' }}</span>
            </button>
            <button :class="[$style.headerButton, $style.publishButton]" @click="handlePublish" :disabled="!canPublish">
              <span>{{ isRTL ? 'نشر' : 'Publish' }}</span>
            </button>
          </template>
        </div>
      </div>
    </div>

    <!-- Main Content -->
    <div :class="$style.editorMain">
      <div :class="$style.editorGrid">
          <!-- Right Content: Editor (col-span-9) -->
        <div :class="$style.editorContent">
          <!-- Info Banner for Template Creation -->
          <div v-if="isCreatingTemplate" :class="$style.infoBanner">
            <i class="fas fa-info-circle"></i>
            <div :class="$style.infoContent">
              <strong>{{ isRTL ? 'إنشاء قالب جديد' : 'Creating New Template' }}</strong>
              <p>{{ isRTL ? 'قم بإنشاء الاستطلاع الخاص بك، وعند النشر يمكنك حفظه كقالب لاستخدامه لاحقاً.' : 'Create your survey, and when you publish it, you can save it as a template for future use.' }}</p>
            </div>
          </div>
          
          <!-- Survey Header Section -->
          <div :class="$style.surveyHeaderSection">
        <div :class="$style.surveyHeaderCard">
          <input
            type="text"
            :class="$style.surveyTitle"
            v-model="surveyData.title"
            :placeholder="isRTL ? 'عنوان الاستطلاع' : 'Survey Title'"
            @blur="validateTitle"
          />
          <div v-if="errors.title" :class="$style.errorMessage">
            {{ errors.title }}
          </div>
          <textarea
            :class="$style.surveyDescription"
            v-model="surveyData.description"
            :placeholder="isRTL ? 'وصف الاستطلاع (اختياري)' : 'Survey Description (optional)'"
            rows="3"
          ></textarea>
        </div>
      </div>

      <!-- Questions Section -->
      <div 
        :class="$style.questionsSection"
        @dragover="handleQuestionsSectionDragOver($event)"
        @drop="handleQuestionsSectionDrop($event)"
      >
        <!-- Empty State / Drop Zone -->
        <div 
          v-if="surveyData.questions.length === 0" 
          :class="$style.emptyDropZone"
        >
          <i class="fas fa-hand-pointer"></i>
          <h3>{{ isRTL ? 'ابدأ بإضافة سؤال' : 'Start by adding a question' }}</h3>
          <p>{{ isRTL ? 'انقر على نوع السؤال أو اسحبه إلى هنا من القائمة اليمنى' : 'Click on a question type or drag it here from the left panel' }}</p>
        </div>

        <div
          v-for="(question, index) in surveyData.questions"
          :key="question.tempId"
          :class="[$style.questionCard, { 
            [$style.dragging]: draggedQuestionIndex === index,
            [$style.dragOver]: dragOverIndex === index
          }]"
          @dragover="handleQuestionDragOver(index, $event)"
          @dragleave="handleQuestionDragLeave"
          @drop="handleQuestionDrop(index, $event)"
        >
          <!-- Question Header -->
          <div :class="$style.questionHeader">
            <div :class="$style.questionNumber">{{ index + 1 }}</div>
            <div
              :class="$style.questionDragHandle"
              draggable="true"
              @dragstart="handleDragStart(index, $event)"
              @dragend="handleDragEnd"
            >
              <i class="fas fa-grip-vertical" style="pointer-events: none;"></i>
            </div>
          </div>

          <!-- Question Content -->
          <div :class="$style.questionContent">
            <!-- Question Text Input -->
            <div :class="$style.questionTextRow">
              <input
                type="text"
                :class="$style.questionTextInput"
                v-model="question.text"
                :placeholder="isRTL ? 'نص السؤال' : 'Question Text'"
                @focus="setActiveQuestion(index)"
              />
              
              <!-- Question Type Dropdown -->
              <div :class="$style.questionTypeDropdown">
                <select 
                  v-model="question.question_type" 
                  :class="$style.typeSelect"
                  @change="clearInvalidAnalyticsFlags(question)"
                >
                  <option value="text">{{ isRTL ? 'نص قصير' : 'Short Text' }}</option>
                  <option value="textarea">{{ isRTL ? 'نص طويل' : 'Long Text' }}</option>
                  <option value="single_choice">{{ isRTL ? 'اختيار واحد' : 'Single Choice' }}</option>
                  <option value="multiple_choice">{{ isRTL ? 'اختيار متعدد' : 'Multiple Choice' }}</option>
                  <option value="rating">{{ isRTL ? 'تقييم' : 'Rating' }}</option>
                  <option value="yes_no">{{ isRTL ? 'نعم/لا' : 'Yes/No' }}</option>
                </select>
                <i class="fas fa-chevron-down" :class="$style.dropdownIcon"></i>
              </div>
            </div>

            <!-- Validation Type Section (for text questions only) -->
            <div v-if="question.question_type === 'text'" :class="$style.validationSection">
              <div :class="$style.validationHeader">
                <i class="fas fa-shield-alt"></i>
                <span>{{ isRTL ? 'التحقق من صحة الإدخال' : 'Input Validation' }}</span>
              </div>
              <div :class="$style.validationControl">
                <label :class="$style.validationLabel">
                  <i class="fas fa-check-circle"></i>
                  <span>{{ isRTL ? 'نوع التحقق' : 'Validation Type' }}</span>
                </label>
                <div :class="$style.validationTypeDropdown">
                  <select 
                    v-model="question.validation_type" 
                    :class="$style.validationSelect"
                  >
                    <option value="none">{{ isRTL ? 'بدون تحقق' : 'No Validation' }}</option>
                    <option value="email">{{ isRTL ? 'بريد إلكتروني' : 'Email Address' }}</option>
                    <option value="phone">{{ isRTL ? 'رقم هاتف' : 'Phone Number' }}</option>
                    <option value="number">{{ isRTL ? 'رقم' : 'Number' }}</option>
                    <option value="url">{{ isRTL ? 'رابط موقع' : 'Website URL' }}</option>
                  </select>
                  <i class="fas fa-chevron-down" :class="$style.validationDropdownIcon"></i>
                </div>
              </div>
              
              <!-- Validation Info Box -->
              <div v-if="question.validation_type !== 'none'" :class="$style.validationInfoBox">
                <i class="fas fa-info-circle"></i>
                <div :class="$style.validationInfoContent">
                  <template v-if="question.validation_type === 'email'">
                    <strong>{{ isRTL ? 'مثال:' : 'Example:' }}</strong>
                    <span>example@domain.com</span>
                  </template>
                  <template v-else-if="question.validation_type === 'phone'">
                    <strong>{{ isRTL ? 'مثال:' : 'Example:' }}</strong>
                    <span>+971501234567</span>
                  </template>
                  <template v-else-if="question.validation_type === 'number'">
                    <strong>{{ isRTL ? 'مثال:' : 'Example:' }}</strong>
                    <span>123 {{ isRTL ? 'أو' : 'or' }} 123.45</span>
                  </template>
                  <template v-else-if="question.validation_type === 'url'">
                    <strong>{{ isRTL ? 'مثال:' : 'Example:' }}</strong>
                    <span>https://example.com</span>
                  </template>
                </div>
              </div>
            </div>

            <!-- Options Section (for choice-based questions) -->
            <div v-if="needsOptions(question.question_type)" :class="$style.optionsSection">
              <div
                v-for="(_option, optIndex) in getQuestionOptions(question)"
                :key="optIndex"
                :class="$style.optionRow"
              >
                <div :class="$style.optionBullet">
                  <i :class="getOptionIcon(question.question_type)"></i>
                </div>
                <input
                  type="text"
                  :class="$style.optionInput"
                  v-model="getQuestionOptions(question)[optIndex]"
                  :placeholder="`${isRTL ? 'خيار' : 'Option'} ${optIndex + 1}`"
                  @input="updateQuestionOptions(question, getQuestionOptions(question))"
                />
                <button
                  v-if="getQuestionOptions(question).length > 1"
                  :class="$style.removeOptionButton"
                  @click="removeOption(question, optIndex)"
                >
                  <i class="fas fa-times"></i>
                </button>
              </div>
              <button :class="$style.addOptionButton" @click="addOption(question)">
                <i class="fas fa-plus"></i>
                <span>{{ isRTL ? 'إضافة خيار' : 'Add Option' }}</span>
              </button>
            </div>

            <!-- Rating Preview (for rating questions) -->
            <div v-if="question.question_type === 'rating'" :class="$style.ratingPreview">
              <div :class="$style.ratingStars">
                <i v-for="n in 5" :key="n" class="fas fa-star" :class="$style.ratingStar"></i>
              </div>
            </div>

            <!-- Analytics Settings - Only show when applicable -->
            <div v-if="canEnableNPS(question.question_type) || canEnableCSAT(question.question_type)" :class="$style.analyticsSection">
              <div :class="$style.analyticsHeader">
                <i class="fas fa-chart-line"></i>
                <span>{{ isRTL ? 'إعدادات التحليلات' : 'Analytics Settings' }}</span>
              </div>
              
              <!-- NPS Toggle (Rating questions only) -->
              <div v-if="canEnableNPS(question.question_type)" :class="$style.analyticsCard">
                <div :class="$style.analyticsCardHeader">
                  <div :class="$style.analyticsCardTitle">
                    <i class="fas fa-tachometer-alt"></i>
                    <span>{{ isRTL ? 'صافي نقاط الترويج (NPS)' : 'Net Promoter Score (NPS)' }}</span>
                  </div>
                  <label :class="$style.modernToggle">
                    <input 
                      type="checkbox" 
                      v-model="question.NPS_Calculate"
                    />
                    <span :class="$style.toggleSlider"></span>
                  </label>
                </div>
                <p :class="$style.analyticsCardDescription">
                  {{ isRTL ? 'تتبع ولاء العملاء من خلال حساب NPS التلقائي' : 'Track customer loyalty with automatic NPS calculation' }}
                </p>
                
                <!-- Scale Settings (show when NPS enabled) -->
                <div v-if="question.NPS_Calculate" :class="$style.scaleSettings">
                  <div :class="$style.scaleInfoBox">
                    <div :class="$style.scaleInfoHeader">
                      <i class="fas fa-info-circle"></i>
                      <span>{{ isRTL ? 'مقياس NPS الافتراضي (0-5 نجوم)' : 'Default NPS Scale (0-5 Stars)' }}</span>
                    </div>
                    <div :class="$style.scaleRanges">
                      <div :class="$style.scaleRange">
                        <span :class="$style.rangeLabel">
                          <i class="fas fa-frown" :class="$style.detractorIcon"></i>
                          {{ isRTL ? 'المنتقدون (0-2 نجوم)' : 'Detractors (0-2 stars)' }}
                        </span>
                        <span :class="$style.rangeDescription">
                          {{ isRTL ? 'عملاء غير راضين قد يضرون بعلامتك التجارية' : 'Unhappy customers who can harm your brand' }}
                        </span>
                      </div>
                      <div :class="$style.scaleRange">
                        <span :class="$style.rangeLabel">
                          <i class="fas fa-meh" :class="$style.passiveIcon"></i>
                          {{ isRTL ? 'المحايدون (3-4 نجوم)' : 'Passives (3-4 stars)' }}
                        </span>
                        <span :class="$style.rangeDescription">
                          {{ isRTL ? 'عملاء راضون لكن غير متحمسين' : 'Satisfied but unenthusiastic customers' }}
                        </span>
                      </div>
                      <div :class="$style.scaleRange">
                        <span :class="$style.rangeLabel">
                          <i class="fas fa-smile" :class="$style.promoterIcon"></i>
                          {{ isRTL ? 'المروجون (5 نجوم)' : 'Promoters (5 stars)' }}
                        </span>
                        <span :class="$style.rangeDescription">
                          {{ isRTL ? 'مؤيدون مخلصون يوصون بعلامتك التجارية' : 'Loyal advocates who recommend your brand' }}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <!-- CSAT Toggle (Single choice, Rating, Yes/No questions) -->
              <div v-if="canEnableCSAT(question.question_type)" :class="$style.analyticsCard">
                <div :class="$style.analyticsCardHeader">
                  <div :class="$style.analyticsCardTitle">
                    <i class="fas fa-smile"></i>
                    <span>{{ isRTL ? 'درجة رضا العملاء (CSAT)' : 'Customer Satisfaction (CSAT)' }}</span>
                  </div>
                  <label :class="$style.modernToggle">
                    <input 
                      type="checkbox" 
                      v-model="question.CSAT_Calculate"
                    />
                    <span :class="$style.toggleSlider"></span>
                  </label>
                </div>
                <p :class="$style.analyticsCardDescription">
                  {{ isRTL ? 'قياس رضا العملاء وتتبع الاتجاهات بمرور الوقت' : 'Measure customer satisfaction and track trends over time' }}
                </p>

                <!-- Satisfaction Mapping (for single_choice with CSAT enabled) -->
                <div v-if="question.question_type === 'single_choice' && question.CSAT_Calculate" :class="$style.satisfactionMapping">
                  <div :class="$style.satisfactionHeader">
                    <i class="fas fa-sliders-h"></i>
                    <span>{{ isRTL ? 'تعيين مستوى الرضا' : 'Map Satisfaction Levels' }}</span>
                  </div>
                  <div 
                    v-for="(option, optIndex) in getQuestionOptions(question)" 
                    :key="`satisfaction-${optIndex}`"
                    :class="$style.satisfactionRow"
                  >
                    <span :class="$style.satisfactionOptionText">{{ option }}</span>
                    <div :class="$style.satisfactionButtons">
                      <button
                        type="button"
                        :class="[$style.satisfactionButton, { [$style.active]: getSatisfactionValue(question, optIndex) === 2 }]"
                        @click="setSatisfactionValue(question, optIndex, 2)"
                        :title="isRTL ? 'راضٍ' : 'Satisfied'"
                      >
                        <i class="fas fa-smile"></i>
                      </button>
                      <button
                        type="button"
                        :class="[$style.satisfactionButton, { [$style.active]: getSatisfactionValue(question, optIndex) === 1 }]"
                        @click="setSatisfactionValue(question, optIndex, 1)"
                        :title="isRTL ? 'محايد' : 'Neutral'"
                      >
                        <i class="fas fa-meh"></i>
                      </button>
                      <button
                        type="button"
                        :class="[$style.satisfactionButton, { [$style.active]: getSatisfactionValue(question, optIndex) === 0 }]"
                        @click="setSatisfactionValue(question, optIndex, 0)"
                        :title="isRTL ? 'غير راضٍ' : 'Dissatisfied'"
                      >
                        <i class="fas fa-frown"></i>
                      </button>
                    </div>
                  </div>
                </div>

                <!-- Yes/No Satisfaction Mapping (for yes_no with CSAT enabled) -->
                <div v-if="question.question_type === 'yes_no' && question.CSAT_Calculate" :class="$style.satisfactionMapping">
                  <div :class="$style.satisfactionHeader">
                    <i class="fas fa-sliders-h"></i>
                    <span>{{ isRTL ? 'تعيين مستوى الرضا للإجابات' : 'Map Satisfaction for Answers' }}</span>
                  </div>
                  <div :class="$style.yesNoMappingInfo">
                    <i class="fas fa-info-circle"></i>
                    <span>{{ isRTL ? 'حدد كيفية تصنيف كل إجابة (نعم/لا) بناءً على سياق سؤالك' : 'Define how each answer (Yes/No) should be classified based on your question context' }}</span>
                  </div>
                  
                  <!-- YES mapping -->
                  <div :class="$style.yesNoMappingRow">
                    <div :class="$style.yesNoLabel">
                      <i class="fas fa-check-circle" :class="$style.yesIcon"></i>
                      <span>{{ isRTL ? 'إذا أجاب المستجيب بـ "نعم"، تصنف كـ:' : 'If respondent answers "YES", classify as:' }}</span>
                    </div>
                    <select 
                      :value="getYesNoSatisfactionValue(question, 'yes')"
                      @change="setYesNoSatisfactionValue(question, 'yes', Number(($event.target as HTMLSelectElement).value) as 0 | 1 | 2)"
                      :class="$style.yesNoSelect"
                    >
                      <option :value="2">{{ isRTL ? '😊 راضٍ' : '😊 Satisfied' }}</option>
                      <option :value="1">{{ isRTL ? '😐 محايد' : '😐 Neutral' }}</option>
                      <option :value="0">{{ isRTL ? '☹️ غير راضٍ' : '☹️ Dissatisfied' }}</option>
                    </select>
                  </div>
                  
                  <!-- NO mapping -->
                  <div :class="$style.yesNoMappingRow">
                    <div :class="$style.yesNoLabel">
                      <i class="fas fa-times-circle" :class="$style.noIcon"></i>
                      <span>{{ isRTL ? 'إذا أجاب المستجيب بـ "لا"، تصنف كـ:' : 'If respondent answers "NO", classify as:' }}</span>
                    </div>
                    <select 
                      :value="getYesNoSatisfactionValue(question, 'no')"
                      @change="setYesNoSatisfactionValue(question, 'no', Number(($event.target as HTMLSelectElement).value) as 0 | 1 | 2)"
                      :class="$style.yesNoSelect"
                    >
                      <option :value="2">{{ isRTL ? '😊 راضٍ' : '😊 Satisfied' }}</option>
                      <option :value="1">{{ isRTL ? '😐 محايد' : '😐 Neutral' }}</option>
                      <option :value="0">{{ isRTL ? '☹️ غير راضٍ' : '☹️ Dissatisfied' }}</option>
                    </select>
                  </div>

                </div>
              </div>
            </div>

            <!-- Conditional Logic Section -->
            <div :class="$style.conditionalSection">
              <div :class="$style.conditionalHeader">
                <i class="fas fa-project-diagram"></i>
                <span>{{ isRTL ? 'منطق الشرط' : 'Conditional Logic' }}</span>
                <button 
                  type="button"
                  :class="$style.toggleConditionalButton"
                  @click="toggleConditionalBuilder(index)"
                  :title="isRTL ? 'إضافة شرط' : 'Add Condition'"
                >
                  <i :class="hasConditions(question) ? 'fas fa-edit' : 'fas fa-plus'"></i>
                  <span>{{ hasConditions(question) ? (isRTL ? 'تعديل الشروط' : 'Edit Conditions') : (isRTL ? 'إضافة شرط' : 'Add Condition') }}</span>
                </button>
              </div>
              
              <!-- Show existing conditions summary -->
              <div v-if="hasConditions(question)" :class="$style.conditionsSummary">
                <div :class="$style.conditionSummaryItem">
                  <i class="fas fa-info-circle"></i>
                  <span>
                    {{ isRTL ? 'يظهر هذا السؤال عندما:' : 'This question shows when:' }}
                  </span>
                </div>
                <div 
                  v-for="(condition, condIdx) in getQuestionConditions(question)" 
                  :key="condIdx"
                  :class="$style.conditionBadge"
                >
                  <span :class="$style.conditionText">
                    {{ getConditionDisplayText(condition, index) }}
                  </span>
                  <button
                    type="button"
                    :class="$style.removeConditionBadgeButton"
                    @click="removeConditionFromQuestion(index, condIdx)"
                    :title="isRTL ? 'حذف الشرط' : 'Remove condition'"
                  >
                    <i class="fas fa-times"></i>
                  </button>
                </div>
                <div v-if="getQuestionConditions(question).length > 1" :class="$style.orLogicNote">
                  <i class="fas fa-code-branch"></i>
                  <span>{{ isRTL ? '(منطق OR: يظهر إذا تحقق أي شرط)' : '(OR logic: shows if ANY condition is met)' }}</span>
                </div>
              </div>
              
              <!-- Condition Builder (shown when toggled) -->
              <div v-if="activeConditionBuilder === index" :class="$style.conditionBuilder">
                <div :class="$style.conditionBuilderHeader">
                  <i class="fas fa-magic"></i>
                  <span>{{ isRTL ? 'إضافة شرط جديد' : 'Add New Condition' }}</span>
                </div>
                
                <!-- Check if there are eligible trigger questions -->
                <div v-if="getEligibleTriggerQuestions(index).length === 0" :class="$style.noTriggersMessage">
                  <i class="fas fa-exclamation-circle"></i>
                  <p>{{ isRTL ? 'لا توجد أسئلة مؤهلة لتكون محفزات' : 'No eligible trigger questions available' }}</p>
                  <small>{{ isRTL ? 'يمكن فقط لأسئلة "نعم/لا" و"اختيار واحد" التي تظهر قبل هذا السؤال أن تكون محفزات' : 'Only Yes/No and Single Choice questions that appear before this question can be triggers' }}</small>
                </div>
                
                <div v-else :class="$style.conditionForm">
                  <div :class="$style.conditionFormRow">
                    <label :class="$style.conditionLabel">
                      {{ isRTL ? 'عندما' : 'When' }}
                    </label>
                    <select 
                      v-model="newConditionForm.trigger_question_tempId"
                      :class="$style.conditionSelect"
                      @change="onTriggerQuestionChange"
                    >
                      <option value="">{{ isRTL ? '-- اختر السؤال المحفز --' : '-- Select trigger question --' }}</option>
                      <option 
                        v-for="q in getEligibleTriggerQuestions(index)" 
                        :key="q.tempId" 
                        :value="q.tempId"
                      >
                        {{ isRTL ? `س${q.order}: ${q.text || 'سؤال بدون عنوان'}` : `Q${q.order}: ${q.text || 'Untitled question'}` }}
                      </option>
                    </select>
                  </div>
                  
                  <div v-if="newConditionForm.trigger_question_tempId" :class="$style.conditionFormRow">
                    <label :class="$style.conditionLabel">
                      {{ isRTL ? 'يساوي' : 'Equals' }}
                    </label>
                    <select 
                      v-model="newConditionForm.trigger_answer_value"
                      :class="$style.conditionSelect"
                    >
                      <option value="">{{ isRTL ? '-- اختر الإجابة --' : '-- Select answer --' }}</option>
                      <option 
                        v-for="option in getSelectedTriggerOptions()" 
                        :key="option" 
                        :value="option"
                      >
                        {{ option }}
                      </option>
                    </select>
                  </div>
                  
                  <div :class="$style.conditionFormActions">
                    <button
                      type="button"
                      :class="[$style.conditionButton, $style.addConditionButton]"
                      @click="addConditionToQuestion(index)"
                      :disabled="!canAddCondition"
                    >
                      <i class="fas fa-plus"></i>
                      <span>{{ isRTL ? 'إضافة شرط' : 'Add Condition' }}</span>
                    </button>
                    <button
                      type="button"
                      :class="[$style.conditionButton, $style.cancelConditionButton]"
                      @click="cancelConditionBuilder"
                    >
                      <span>{{ isRTL ? 'إلغاء' : 'Cancel' }}</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Question Actions -->
          <div :class="$style.questionActions">
            <button
              :class="$style.actionButton"
              @click="duplicateQuestion(index)"
              :title="isRTL ? 'تكرار السؤال' : 'Duplicate'"
            >
              <i class="fas fa-copy"></i>
            </button>
            <button
              :class="$style.actionButton"
              @click="deleteQuestion(index)"
              :title="isRTL ? 'حذف السؤال' : 'Delete'"
            >
              <i class="fas fa-trash"></i>
            </button>
            <div :class="$style.actionDivider"></div>
            <label :class="$style.requiredToggle">
              <input type="checkbox" v-model="question.is_required" />
              <span>{{ isRTL ? 'مطلوب' : 'Required' }}</span>
            </label>
          </div>
        </div>

        <!-- Add Question Button -->
        <div v-if="surveyData.questions.length > 0" :class="$style.addQuestionSection">
          <button :class="$style.addQuestionButton" @click="addQuestion">
            <i class="fas fa-plus-circle"></i>
            <span>{{ isRTL ? 'إضافة سؤال' : 'Add Question' }}</span>
          </button>
        </div>
        
        <!-- Drop Hint (Optional: can be shown as additional hint below the button) -->
        <div v-if="surveyData.questions.length > 0" :class="$style.addQuestionSection">
          <div :class="$style.dropHint">
            <i class="fas fa-info-circle"></i>
            <span>{{ isRTL ? 'انقر على نوع السؤال أو اسحبه لإضافة المزيد من الأسئلة' : 'Click or drag a question type to add more questions' }}</span>
          </div>
        </div>
      </div>
        </div>
        <!-- Left Sidebar: Question Palette (col-span-3) -->
        <div :class="$style.questionPalette">
          <div :class="$style.paletteHeader">
            <i class="fas fa-puzzle-piece"></i>
            <h3>{{ isRTL ? 'أنواع الأسئلة' : 'Question Types' }}</h3>
          </div>
          
          <div :class="$style.paletteItems">
            <!-- Short Text -->
            <div 
              :class="$style.paletteItem" 
              draggable="true" 
              @dragstart="handlePaletteDragStart('text', $event)"
              @click="handlePaletteClick('text')"
            >
              <div :class="$style.paletteIcon" style="pointer-events: none;">
                <i class="fas fa-font"></i>
              </div>
              <div :class="$style.paletteContent" style="pointer-events: none;">
                <h4>{{ isRTL ? 'نص قصير' : 'Short Text' }}</h4>
                <p>{{ isRTL ? 'إجابة نصية قصيرة' : 'Single line text' }}</p>
              </div>
            </div>

            <!-- Long Text -->
            <div 
              :class="$style.paletteItem" 
              draggable="true" 
              @dragstart="handlePaletteDragStart('textarea', $event)"
              @click="handlePaletteClick('textarea')"
            >
              <div :class="$style.paletteIcon" style="pointer-events: none;">
                <i class="fas fa-align-left"></i>
              </div>
              <div :class="$style.paletteContent" style="pointer-events: none;">
                <h4>{{ isRTL ? 'نص طويل' : 'Long Text' }}</h4>
                <p>{{ isRTL ? 'نص متعدد الأسطر' : 'Multi-line text' }}</p>
              </div>
            </div>

            <!-- Single Choice -->
            <div 
              :class="$style.paletteItem" 
              draggable="true" 
              @dragstart="handlePaletteDragStart('single_choice', $event)"
              @click="handlePaletteClick('single_choice')"
            >
              <div :class="$style.paletteIcon" style="pointer-events: none;">
                <i class="far fa-circle"></i>
              </div>
              <div :class="$style.paletteContent" style="pointer-events: none;">
                <h4>{{ isRTL ? 'اختيار واحد' : 'Single Choice' }}</h4>
                <p>{{ isRTL ? 'خيار واحد فقط' : 'Select one option' }}</p>
              </div>
            </div>

            <!-- Multiple Choice -->
            <div 
              :class="$style.paletteItem" 
              draggable="true" 
              @dragstart="handlePaletteDragStart('multiple_choice', $event)"
              @click="handlePaletteClick('multiple_choice')"
            >
              <div :class="$style.paletteIcon" style="pointer-events: none;">
                <i class="far fa-square"></i>
              </div>
              <div :class="$style.paletteContent" style="pointer-events: none;">
                <h4>{{ isRTL ? 'اختيار متعدد' : 'Multiple Choice' }}</h4>
                <p>{{ isRTL ? 'عدة خيارات' : 'Select multiple' }}</p>
              </div>
            </div>

            <!-- Rating -->
            <div 
              :class="$style.paletteItem" 
              draggable="true" 
              @dragstart="handlePaletteDragStart('rating', $event)"
              @click="handlePaletteClick('rating')"
            >
              <div :class="$style.paletteIcon" style="pointer-events: none;">
                <i class="fas fa-star"></i>
              </div>
              <div :class="$style.paletteContent" style="pointer-events: none;">
                <h4>{{ isRTL ? 'تقييم' : 'Rating' }}</h4>
                <p>{{ isRTL ? 'تقييم بالنجوم' : 'Star rating' }}</p>
              </div>
            </div>

            <!-- Yes/No -->
            <div 
              :class="$style.paletteItem" 
              draggable="true" 
              @dragstart="handlePaletteDragStart('yes_no', $event)"
              @click="handlePaletteClick('yes_no')"
            >
              <div :class="$style.paletteIcon" style="pointer-events: none;">
                <i class="fas fa-check-circle"></i>
              </div>
              <div :class="$style.paletteContent" style="pointer-events: none;">
                <h4>{{ isRTL ? 'نعم/لا' : 'Yes/No' }}</h4>
                <p>{{ isRTL ? 'سؤال بنعم أو لا' : 'Binary choice' }}</p>
              </div>
            </div>
          </div>
        </div>

      
      </div>
    </div>

    <!-- Preview Modal -->
    <div v-if="showPreview" :class="$style.previewOverlay" @click="togglePreview">
      <div :class="$style.previewModal" @click.stop>
        <div :class="$style.previewHeader">
          <h2>{{ isRTL ? 'معاينة الاستطلاع' : 'Survey Preview' }}</h2>
          <button :class="$style.closePreview" @click="togglePreview">
            <i class="fas fa-times"></i>
          </button>
        </div>
        <div :class="$style.previewContent">
          <div :class="$style.previewSurveyHeader">
            <h1>{{ surveyData.title || (isRTL ? 'عنوان الاستطلاع' : 'Survey Title') }}</h1>
            <p v-if="surveyData.description">{{ surveyData.description }}</p>
          </div>
          <div :class="$style.previewQuestions">
            <div v-for="(question, index) in surveyData.questions" :key="index" :class="$style.previewQuestion">
              <div :class="$style.previewQuestionText">
                {{ index + 1 }}. {{ question.text || (isRTL ? 'نص السؤال' : 'Question Text') }}
                <span v-if="question.is_required" :class="$style.requiredMark">*</span>
              </div>
              <div :class="$style.previewAnswer">
                <div v-if="question.question_type === 'text'" :class="$style.previewInput">
                  {{ isRTL ? 'إجابة نصية قصيرة' : 'Short text answer' }}
                </div>
                <div v-else-if="question.question_type === 'textarea'" :class="$style.previewTextarea">
                  {{ isRTL ? 'إجابة نصية طويلة' : 'Long text answer' }}
                </div>
                <div v-else-if="question.question_type === 'yes_no'" :class="$style.previewOptions">
                  <div :class="$style.previewOption">○ {{ isRTL ? 'نعم' : 'Yes' }}</div>
                  <div :class="$style.previewOption">○ {{ isRTL ? 'لا' : 'No' }}</div>
                </div>
                <div v-else-if="needsOptions(question.question_type)" :class="$style.previewOptions">
                  <div
                    v-for="(option, optIndex) in getQuestionOptions(question)"
                    :key="optIndex"
                    :class="$style.previewOption"
                  >
                    {{ question.question_type === 'multiple_choice' ? '☐' : '○' }} {{ option }}
                  </div>
                </div>
                <div v-else-if="question.question_type === 'rating'" :class="$style.previewRating">
                  <i v-for="n in 5" :key="n" class="fas fa-star"></i>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Scheduling Settings Modal -->
    <Teleport to="body">
      <div v-if="showSchedulingModal" :class="$style.modalOverlay" @click="closeSchedulingModal">
        <div :class="$style.modalContainer" @click.stop :data-theme="currentTheme" :dir="isRTL ? 'rtl' : 'ltr'">
          <div :class="$style.modalHeader">
            <h3>
              <i class="fas fa-calendar-alt"></i>
              {{ isRTL ? 'إعدادات الجدولة' : 'Scheduling Settings' }}
            </h3>
            <button :class="$style.closeButton" @click="closeSchedulingModal">
              <i class="fas fa-times"></i>
            </button>
          </div>
          <div :class="$style.modalBody">
            <p :class="$style.helpText">{{ isRTL ? 'حدد متى سيكون الاستطلاع نشطًا. اترك الحقول فارغة للبدء فورًا والاستمرار إلى أجل غير مسمى.' : 'Set when the survey will be active. Leave fields empty to start immediately and run indefinitely.' }}</p>
            
            <div :class="$style.formGrid">
              <div :class="$style.formGroup">
                <label :class="$style.formLabel">
                  <i class="fas fa-play" :class="$style.labelIcon"></i>
                  {{ isRTL ? 'تاريخ البداية' : 'Start Date' }}
                </label>
                <FlatPickr
                  v-model="schedulingSettings.start_date"
                  :config="fpConfig"
                  :class="$style.formInput"
                  :placeholder="isRTL ? 'اختر تاريخ ووقت البداية' : 'Select start date and time'"
                />
                <div :class="$style.fieldHelp">
                  {{ isRTL ? 'متى سيكون الاستطلاع متاحًا للمستجيبين' : 'When the survey will become available to respondents' }}
                </div>
              </div>
              
              <div :class="$style.formGroup">
                <label :class="$style.formLabel">
                  <i class="fas fa-stop" :class="$style.labelIcon"></i>
                  {{ isRTL ? 'تاريخ النهاية' : 'End Date' }}
                </label>
                <FlatPickr
                  v-model="schedulingSettings.end_date"
                  :config="fpConfig"
                  :class="$style.formInput"
                  :placeholder="isRTL ? 'اختر تاريخ ووقت النهاية' : 'Select end date and time'"
                />
                <div :class="$style.fieldHelp">
                  {{ isRTL ? 'متى سيتوقف الاستطلاع عن قبول الردود' : 'When the survey will stop accepting responses' }}
                </div>
              </div>
            </div>

            <!-- Scheduling Preview -->
            <div v-if="schedulingPreview" :class="$style.schedulingPreview">
              <div :class="[$style.previewItem, $style[schedulingPreview.status]]">
                <i :class="[schedulingPreview.icon, $style.previewIcon]"></i>
                <div :class="$style.previewContent">
                  <h4 :class="$style.previewTitle">{{ schedulingPreview.title }}</h4>
                  <p :class="$style.previewDescription">{{ schedulingPreview.description }}</p>
                </div>
              </div>
            </div>
          </div>
          <div :class="$style.modalFooter">
            <button :class="[$style.modalButton, $style.cancelButton]" @click="closeSchedulingModal">
              {{ isRTL ? 'إلغاء' : 'Cancel' }}
            </button>
            <button :class="[$style.modalButton, $style.saveButton]" @click="saveSchedulingSettings">
              <i class="fas fa-check"></i>
              {{ isRTL ? 'حفظ' : 'Save' }}
            </button>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- Survey Settings Modal -->
    <Teleport to="body">
      <div v-if="showSurveySettingsModal" :class="$style.modalOverlay" @click="closeSurveySettingsModal">
        <div :class="$style.modalContainer" @click.stop :data-theme="currentTheme" :dir="isRTL ? 'rtl' : 'ltr'">
          <div :class="$style.modalHeader">
            <h3>
              <i class="fas fa-cog"></i>
              {{ isRTL ? 'إعدادات الاستطلاع' : 'Survey Settings' }}
            </h3>
            <button :class="$style.closeButton" @click="closeSurveySettingsModal">
              <i class="fas fa-times"></i>
            </button>
          </div>
          <div :class="$style.modalBody">
            <div :class="$style.settingItem">
              <div :class="$style.settingContent">
                <h4 :class="$style.settingTitle">
                  <i class="fas fa-toggle-on"></i>
                  {{ isRTL ? 'حالة الاستطلاع' : 'Survey Status' }}
                </h4>
                <p :class="$style.settingDescription">
                  {{ isRTL ? 'تفعيل أو تعطيل الاستطلاع' : 'Activate or deactivate the survey' }}
                </p>
              </div>
              <label :class="$style.modernToggle">
                <input 
                  type="checkbox" 
                  v-model="surveySettings.is_active"
                />
                <span :class="$style.toggleSlider"></span>
              </label>
            </div>
          </div>
          <div :class="$style.modalFooter">
            <button :class="[$style.modalButton, $style.cancelButton]" @click="closeSurveySettingsModal">
              {{ isRTL ? 'إلغاء' : 'Cancel' }}
            </button>
            <button :class="[$style.modalButton, $style.saveButton]" @click="saveSurveySettings">
              <i class="fas fa-check"></i>
              {{ isRTL ? 'حفظ' : 'Save' }}
            </button>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch, onUnmounted } from 'vue'
import { useAppStore } from '../../stores/useAppStore'
import type { PredefinedTemplate, SurveyTemplate, RecentSurvey, Survey, QuestionType } from '../../types/survey.types'
import FlatPickr from 'vue-flatpickr-component'
import 'flatpickr/dist/flatpickr.css'
import Swal from 'sweetalert2'

// Props
interface Props {
  template?: PredefinedTemplate | SurveyTemplate | RecentSurvey | Survey | null
  mode?: 'create' | 'edit'
  surveyId?: string
  isCreatingPredefinedTemplate?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  template: null,
  mode: 'create',
  surveyId: undefined,
  isCreatingPredefinedTemplate: false
})

// Emits
const emit = defineEmits<{
  back: []
  publish: [surveyData: any]
  saveDraft: [surveyData: any]
  saveTemplate: [surveyData: any]
}>()

// Store
const store = useAppStore()

// Computed
const currentTheme = computed(() => store.currentTheme)
const isRTL = computed(() => store.currentLanguage === 'ar')

// Check if we're creating a template (no template prop provided)
const isCreatingTemplate = computed(() => !props.template)

// Check if we can add a condition
const canAddCondition = computed(() => {
  return newConditionForm.value.trigger_question_tempId !== '' && 
         newConditionForm.value.trigger_answer_value !== ''
})

// State
const surveyData = ref<{
  title: string
  description: string
  questions: Array<{
    tempId: string
    text: string
    question_type: QuestionType
    options?: string[]
    is_required: boolean
    order: number
    // Analytics fields
    NPS_Calculate?: boolean
    CSAT_Calculate?: boolean
    min_scale?: number | null
    max_scale?: number | null
    semantic_tag?: 'none' | 'nps' | 'csat'
    options_satisfaction_values?: (0 | 1 | 2 | null)[]
    // Validation field
    validation_type?: 'none' | 'email' | 'phone' | 'number' | 'url'
    // Conditional logic fields
    id?: string // For existing questions from backend
    set_conditional_on?: Array<{
      trigger_question_id: string
      trigger_answer_value: string
    }>
    conditional_on?: Array<{
      trigger_question_id: string
      trigger_question_order: number
      trigger_question_text: string
      trigger_answer_value: string
      condition_id: string
    }>
  }>
}>({
  title: '',
  description: '',
  questions: []
})

const errors = ref<Record<string, string>>({})
const activeQuestionIndex = ref<number | null>(null)
const showPreview = ref(false)
const draggedQuestionIndex = ref<number | null>(null)
const dragOverIndex = ref<number | null>(null)

// Conditional logic state
const activeConditionBuilder = ref<number | null>(null)
const newConditionForm = ref<{
  trigger_question_tempId: string
  trigger_answer_value: string
}>({
  trigger_question_tempId: '',
  trigger_answer_value: ''
})

// Scheduling and Settings State
const showSchedulingModal = ref(false)
const showSurveySettingsModal = ref(false)
const schedulingSettings = ref({
  start_date: null as string | null,
  end_date: null as string | null
})
const surveySettings = ref({
  is_active: true
})

// Computed
const canPublish = computed(() => {
  // Basic validation
  if (surveyData.value.title.trim().length === 0 || 
      surveyData.value.questions.length === 0 ||
      !surveyData.value.questions.every(q => q.text.trim().length > 0)) {
    return false
  }

  // Validate analytics requirements (only CSAT needs user input)
  for (const question of surveyData.value.questions) {
    // CSAT validation for single_choice
    if (question.question_type === 'single_choice' && question.CSAT_Calculate) {
      // Must have satisfaction values mapped for all options
      if (!question.options_satisfaction_values || 
          !question.options ||
          question.options_satisfaction_values.length !== question.options.length) {
        return false
      }
      // Check that all values are set (not undefined/null)
      if (question.options_satisfaction_values.some(v => v === undefined || v === null)) {
        return false
      }
    }

    // CSAT validation for yes_no
    if (question.question_type === 'yes_no' && question.CSAT_Calculate) {
      // Must have satisfaction values for both yes and no
      if (!question.options_satisfaction_values || 
          question.options_satisfaction_values.length < 2 ||
          question.options_satisfaction_values[0] === undefined ||
          question.options_satisfaction_values[1] === undefined) {
        return false
      }
    }

    // NPS validation removed - NPS values are automatically calculated by the system
  }

  return true
})

// Flatpickr configuration
const fpConfig = computed(() => ({
  enableTime: true,
  time_24hr: true,              // Force 24-hour UI (no AM/PM)
  altInput: true,               // Show a nice 24h value to the user
  altFormat: 'Y-m-d H:i',       // UI display format (24h)
  dateFormat: "Y-m-d\\TH:i:S",  // Backend value format (unchanged)
  allowInput: true,
  minuteIncrement: 1
}))

// Scheduling preview
const schedulingPreview = computed(() => {
  const now = new Date()
  const startDate = schedulingSettings.value.start_date ? new Date(schedulingSettings.value.start_date) : null
  const endDate = schedulingSettings.value.end_date ? new Date(schedulingSettings.value.end_date) : null

  // Scenario 1: No dates
  if (!startDate && !endDate) {
    return {
      status: 'active',
      icon: 'fas fa-play-circle',
      title: isRTL.value ? 'يبدأ فورًا ويستمر إلى أجل غير مسمى' : 'Starts immediately, runs indefinitely',
      description: isRTL.value ? 'الاستطلاع سيكون نشطًا فور الإنشاء ولن ينتهي حتى يتم إيقافه يدوياً' : 'Survey will be active immediately after creation and won\'t expire until manually deactivated'
    }
  }

  // Scenario 2: Start only
  if (startDate && !endDate) {
    const isScheduled = startDate > now
    return {
      status: isScheduled ? 'scheduled' : 'active',
      icon: isScheduled ? 'fas fa-clock' : 'fas fa-play-circle',
      title: isRTL.value 
        ? (isScheduled ? `مجدول للبدء ${startDate.toLocaleDateString('ar', { calendar: 'gregory' })}` : 'يبدأ فورًا ويستمر إلى أجل غير مسمى')
        : (isScheduled ? `Scheduled to start ${startDate.toLocaleDateString()}` : 'Starts immediately, runs indefinitely'),
      description: isRTL.value 
        ? (isScheduled ? 'الاستطلاع سيبدأ في التاريخ المحدد ويستمر حتى يتم إيقافه يدوياً' : 'الاستطلاع نشط حالياً ويستمر حتى يتم إيقافه يدوياً')
        : (isScheduled ? 'Survey will start on the specified date and run indefinitely until manually deactivated' : 'Survey is active now and will run indefinitely until manually deactivated')
    }
  }

  // Scenario 3: End only
  if (!startDate && endDate) {
    const isExpired = endDate < now
    return {
      status: isExpired ? 'expired' : 'active',
      icon: isExpired ? 'fas fa-stop-circle' : 'fas fa-play-circle',
      title: isRTL.value 
        ? (isExpired ? 'منتهي الصلاحية' : `يبدأ الآن، ينتهي ${endDate.toLocaleDateString('ar', { calendar: 'gregory' })}`)
        : (isExpired ? 'Expired' : `Starts now, expires ${endDate.toLocaleDateString()}`),
      description: isRTL.value 
        ? (isExpired ? 'انتهت صلاحية الاستطلاع' : 'الاستطلاع نشط حالياً وسينتهي في التاريخ المحدد')
        : (isExpired ? 'Survey has expired' : 'Survey is active now and will expire on the specified date')
    }
  }

  // Scenario 4: Both dates
  if (startDate && endDate) {
    const isScheduled = startDate > now
    const isExpired = endDate < now
    const isActive = startDate <= now && endDate > now
    
    let status: string, icon: string, title: string, description: string

    if (isExpired) {
      status = 'expired'
      icon = 'fas fa-stop-circle'
      title = isRTL.value ? 'منتهي الصلاحية' : 'Expired'
      description = isRTL.value ? 'انتهت صلاحية الاستطلاع' : 'Survey has expired'
    } else if (isScheduled) {
      status = 'scheduled'
      icon = 'fas fa-clock'
      title = isRTL.value 
        ? `مجدول من ${startDate.toLocaleDateString('ar', { calendar: 'gregory' })} إلى ${endDate.toLocaleDateString('ar', { calendar: 'gregory' })}`
        : `Scheduled from ${startDate.toLocaleDateString()} to ${endDate.toLocaleDateString()}`
      description = isRTL.value ? 'الاستطلاع سيعمل خلال النافذة الزمنية المحددة' : 'Survey will run within the specified time window'
    } else if (isActive) {
      status = 'active'
      icon = 'fas fa-play-circle'
      title = isRTL.value 
        ? `نشط حتى ${endDate.toLocaleDateString('ar', { calendar: 'gregory' })}`
        : `Active until ${endDate.toLocaleDateString()}`
      description = isRTL.value ? 'الاستطلاع نشط حالياً وسينتهي في التاريخ المحدد' : 'Survey is currently active and will expire on the specified date'
    } else {
      status = 'inactive'
      icon = 'fas fa-pause-circle'
      title = isRTL.value ? 'غير نشط' : 'Inactive'
      description = isRTL.value ? 'حالة غير متوقعة' : 'Unexpected state'
    }

    return { status, icon, title, description }
  }

  return null
})

// Watch for modal state changes to prevent body scroll
watch([showPreview, showSchedulingModal, showSurveySettingsModal], ([preview, scheduling, settings]) => {
  const anyModalOpen = preview || scheduling || settings
  
  if (anyModalOpen) {
    // Prevent body scroll when any modal is open
    document.body.style.overflow = 'hidden'
  } else {
    // Restore body scroll when all modals are closed
    document.body.style.overflow = ''
  }
})

// Cleanup on unmount
onUnmounted(() => {
  document.body.style.overflow = ''
})

// Methods
const initializeSurvey = () => {
  console.log('🔧 Initializing Survey Editor with template:', props.template)
  
  if (props.template) {
    // Check if it's a full Survey object
    if ('questions' in props.template && Array.isArray(props.template.questions)) {
      console.log('✅ Loading survey data from template')
      
      surveyData.value = {
        title: (props.template as any).name || (props.template as any).title || '',
        description: (props.template as any).description || '',
        questions: props.template.questions.map((q: any, index: number) => {
          // Parse options - handle string, array, or null/undefined
          let parsedOptions: string[] = []
          if (q.options) {
            if (typeof q.options === 'string') {
              try {
                parsedOptions = JSON.parse(q.options)
              } catch {
                parsedOptions = []
              }
            } else if (Array.isArray(q.options)) {
              parsedOptions = q.options
            }
          }
          
          // Parse satisfaction values - handle string, array, or null/undefined
          let parsedSatisfactionValues: (0 | 1 | 2 | null)[] = []
          if (q.options_satisfaction_values) {
            if (typeof q.options_satisfaction_values === 'string') {
              try {
                parsedSatisfactionValues = JSON.parse(q.options_satisfaction_values)
              } catch {
                parsedSatisfactionValues = []
              }
            } else if (Array.isArray(q.options_satisfaction_values)) {
              parsedSatisfactionValues = q.options_satisfaction_values
            }
          }
          
          return {
            tempId: `temp-${Date.now()}-${index}`,
            text: q.text || '',
            question_type: q.question_type,
            options: parsedOptions,
            is_required: q.is_required !== undefined ? q.is_required : false,
            order: q.order !== undefined ? q.order : index + 1,
            // Analytics fields
            NPS_Calculate: q.NPS_Calculate || false,
            CSAT_Calculate: q.CSAT_Calculate || false,
            min_scale: q.min_scale !== undefined && q.min_scale !== null ? q.min_scale : 0,
            max_scale: q.max_scale !== undefined && q.max_scale !== null ? q.max_scale : 5,
            semantic_tag: q.semantic_tag || 'none',
            options_satisfaction_values: parsedSatisfactionValues,
            // Validation field
            validation_type: q.validation_type || 'none',
            // Keep ID for existing questions
            id: q.id,
            // Conditional logic - convert conditional_on to set_conditional_on for editing
            set_conditional_on: q.conditional_on ? q.conditional_on.map((cond: any) => ({
              trigger_question_id: cond.trigger_question_id,
              trigger_answer_value: cond.trigger_answer_value
            })) : (q.set_conditional_on || [])
          }
        })
      }
      
      console.log('📝 Initialized surveyData:', surveyData.value)
      
      // Load scheduling settings if available
      schedulingSettings.value = {
        start_date: (props.template as any).start_date || null,
        end_date: (props.template as any).end_date || null
      }
      console.log('📅 Scheduling settings:', schedulingSettings.value)
      
      // Load survey settings if available
      surveySettings.value = {
        is_active: (props.template as any).is_active !== undefined ? (props.template as any).is_active : true
      }
      console.log('⚙️ Survey settings:', surveySettings.value)
    }
  } else {
    console.log('➕ No template provided, adding default question')
    // Start with empty survey and one default question
    addQuestion()
  }
}

const validateTitle = () => {
  if (!surveyData.value.title.trim()) {
    errors.value.title = isRTL.value ? 'العنوان مطلوب' : 'Title is required'
  } else {
    delete errors.value.title
  }
}

const setActiveQuestion = (index: number) => {
  activeQuestionIndex.value = index
}

const needsOptions = (questionType: QuestionType): boolean => {
  return ['single_choice', 'multiple_choice'].includes(questionType)
}

const getQuestionOptions = (question: any): string[] => {
  if (!question.options) {
    question.options = [isRTL.value ? 'خيار 1' : 'Option 1']
  }
  return question.options
}

const updateQuestionOptions = (question: any, newOptions: string[]) => {
  question.options = newOptions
}

const addOption = (question: any) => {
  const options = getQuestionOptions(question)
  const newOptionNumber = options.length + 1
  options.push(isRTL.value ? `خيار ${newOptionNumber}` : `Option ${newOptionNumber}`)
  
  // Initialize satisfaction values array if needed
  if (!question.options_satisfaction_values) {
    question.options_satisfaction_values = []
  }
  // Add null for new option
  question.options_satisfaction_values.push(null)
}

const removeOption = (question: any, optionIndex: number) => {
  const options = getQuestionOptions(question)
  if (options.length > 1) {
    options.splice(optionIndex, 1)
    // Also remove from satisfaction values if it exists
    if (question.options_satisfaction_values && question.options_satisfaction_values.length > optionIndex) {
      question.options_satisfaction_values.splice(optionIndex, 1)
    }
  }
}

const getOptionIcon = (questionType: QuestionType): string => {
  return questionType === 'multiple_choice' ? 'far fa-square' : 'far fa-circle'
}

// Validation for analytics flags
const canEnableNPS = (questionType: QuestionType): boolean => {
  return questionType === 'rating'
}

const canEnableCSAT = (questionType: QuestionType): boolean => {
  return ['single_choice', 'rating', 'yes_no'].includes(questionType)
}

// Clear invalid analytics flags when question type changes
const clearInvalidAnalyticsFlags = (question: any) => {
  // Clear NPS if not rating question
  if (!canEnableNPS(question.question_type)) {
    question.NPS_Calculate = false
    question.min_scale = null
    question.max_scale = null
  }
  
  // Clear CSAT if not eligible question type
  if (!canEnableCSAT(question.question_type)) {
    question.CSAT_Calculate = false
    question.options_satisfaction_values = []
  }
  
  // Initialize satisfaction values for single_choice CSAT questions
  if (question.question_type === 'single_choice' && question.CSAT_Calculate) {
    if (!question.options_satisfaction_values || question.options_satisfaction_values.length !== (question.options?.length || 0)) {
      const length = question.options?.length || 0
      question.options_satisfaction_values = Array.from({ length }, () => null)
    }
  }
}

const getSatisfactionValue = (question: any, optIndex: number): 0 | 1 | 2 | null => {
  if (!question.options_satisfaction_values) {
    const length = question.options?.length || 0
    question.options_satisfaction_values = Array.from({ length }, () => null)
  }
  return question.options_satisfaction_values[optIndex] ?? null
}

const setSatisfactionValue = (question: any, optIndex: number, value: 0 | 1 | 2 | null) => {
  if (!question.options_satisfaction_values) {
    const length = question.options?.length || 0
    question.options_satisfaction_values = Array.from({ length }, () => null)
  }
  question.options_satisfaction_values[optIndex] = value
}

// Yes/No CSAT mapping helpers
const getYesNoSatisfactionValue = (question: any, answer: 'yes' | 'no'): 0 | 1 | 2 => {
  // Initialize options_satisfaction_values for yes/no questions
  // Index 0 = "yes", Index 1 = "no"
  if (!question.options_satisfaction_values || question.options_satisfaction_values.length < 2) {
    question.options_satisfaction_values = [2, 0] // Default: Yes=Satisfied, No=Dissatisfied
  }
  
  const index = answer === 'yes' ? 0 : 1
  return question.options_satisfaction_values[index] ?? (answer === 'yes' ? 2 : 0)
}

const setYesNoSatisfactionValue = (question: any, answer: 'yes' | 'no', value: 0 | 1 | 2) => {
  // Initialize options_satisfaction_values for yes/no questions
  if (!question.options_satisfaction_values || question.options_satisfaction_values.length < 2) {
    question.options_satisfaction_values = [2, 0] // Default: Yes=Satisfied, No=Dissatisfied
  }
  
  const index = answer === 'yes' ? 0 : 1
  question.options_satisfaction_values[index] = value
}

const addQuestion = () => {
  const newQuestion = {
    tempId: `temp-${Date.now()}`,
    text: '',
    question_type: 'text' as QuestionType,
    options: [],
    is_required: false,
    order: surveyData.value.questions.length + 1,
    // Analytics fields
    NPS_Calculate: false,
    CSAT_Calculate: false,
    min_scale: 0,
    max_scale: 5,
    semantic_tag: 'none' as 'none' | 'nps' | 'csat',
    options_satisfaction_values: [],
    // Validation field
    validation_type: 'none' as 'none' | 'email' | 'phone' | 'number' | 'url'
  }
  surveyData.value.questions.push(newQuestion)
  
  // Auto-focus on the new question
  setTimeout(() => {
    setActiveQuestion(surveyData.value.questions.length - 1)
  }, 100)
}

const duplicateQuestion = (index: number) => {
  const originalQuestion = surveyData.value.questions[index]
  const duplicatedQuestion = {
    ...originalQuestion,
    tempId: `temp-${Date.now()}`,
    order: index + 2
  }
  surveyData.value.questions.splice(index + 1, 0, duplicatedQuestion)
  
  // Update order for subsequent questions
  updateQuestionOrders()
}

const deleteQuestion = async (index: number) => {
  if (surveyData.value.questions.length === 1) {
    Swal.fire({
      icon: 'warning',
      title: isRTL.value ? 'تحذير' : 'Warning',
      text: isRTL.value ? 'يجب أن يحتوي الاستطلاع على سؤال واحد على الأقل' : 'Survey must have at least one question',
      confirmButtonText: isRTL.value ? 'موافق' : 'OK'
    })
    return
  }

  const result = await Swal.fire({
    icon: 'warning',
    title: isRTL.value ? 'تأكيد الحذف' : 'Confirm Delete',
    text: isRTL.value ? 'هل تريد حذف هذا السؤال؟' : 'Do you want to delete this question?',
    showCancelButton: true,
    confirmButtonText: isRTL.value ? 'حذف' : 'Delete',
    cancelButtonText: isRTL.value ? 'إلغاء' : 'Cancel',
    confirmButtonColor: '#d33'
  })

  if (result.isConfirmed) {
    surveyData.value.questions.splice(index, 1)
    updateQuestionOrders()
  }
}

const updateQuestionOrders = () => {
  surveyData.value.questions.forEach((question, index) => {
    question.order = index + 1
  })
}

// Drag and Drop handlers - NEW ROBUST IMPLEMENTATION
const handlePaletteDragStart = (questionType: QuestionType, event: DragEvent) => {
  if (event.dataTransfer) {
    event.dataTransfer.effectAllowed = 'copy'
    event.dataTransfer.setData('application/json', JSON.stringify({ type: 'palette', questionType }))
  }
}

// Click handler for palette items
const handlePaletteClick = (questionType: QuestionType) => {
  // Create new question and add to the end
  const newQuestion = {
    tempId: `temp-${Date.now()}`,
    text: '',
    question_type: questionType,
    options: needsOptions(questionType) ? [isRTL.value ? 'خيار 1' : 'Option 1'] : [],
    is_required: false,
    order: surveyData.value.questions.length + 1,
    NPS_Calculate: false,
    CSAT_Calculate: false,
    min_scale: 0,
    max_scale: 5,
    semantic_tag: 'none' as 'none' | 'nps' | 'csat',
    options_satisfaction_values: [],
    validation_type: 'none' as 'none' | 'email' | 'phone' | 'number' | 'url'
  }
  
  // Add to end
  surveyData.value.questions.push(newQuestion)
  updateQuestionOrders()
  
  // Auto-focus on the new question
  setTimeout(() => {
    setActiveQuestion(surveyData.value.questions.length - 1)
  }, 100)
}

const handleDragStart = (index: number, event: DragEvent) => {
  draggedQuestionIndex.value = index
  if (event.dataTransfer) {
    event.dataTransfer.effectAllowed = 'move'
    event.dataTransfer.setData('application/json', JSON.stringify({ type: 'reorder', index }))
    // Add visual feedback
    if (event.target instanceof HTMLElement) {
      event.target.style.opacity = '0.5'
    }
  }
}

const handleDragEnd = (event: DragEvent) => {
  draggedQuestionIndex.value = null
  dragOverIndex.value = null
  // Reset visual feedback
  if (event.target instanceof HTMLElement) {
    event.target.style.opacity = '1'
  }
}

const handleQuestionDragOver = (index: number, event: DragEvent) => {
  event.preventDefault()
  event.stopPropagation()
  
  if (event.dataTransfer) {
    const data = event.dataTransfer.types.includes('application/json')
    if (data) {
      event.dataTransfer.dropEffect = 'move'
    }
  }
  
  dragOverIndex.value = index
}

const handleQuestionDragLeave = () => {
  dragOverIndex.value = null
}

// Handler for dropping on the questions section (adds to end)
const handleQuestionsSectionDragOver = (event: DragEvent) => {
  event.preventDefault()
  if (event.dataTransfer) {
    event.dataTransfer.dropEffect = 'copy'
  }
}

const handleQuestionsSectionDrop = (event: DragEvent) => {
  event.preventDefault()
  
  try {
    const jsonData = event.dataTransfer?.getData('application/json')
    if (jsonData) {
      const data = JSON.parse(jsonData)
      
      if (data.type === 'palette' && data.questionType) {
        // Adding new question from palette at the end
        const newQuestion = {
          tempId: `temp-${Date.now()}`,
          text: '',
          question_type: data.questionType,
          options: needsOptions(data.questionType) ? [isRTL.value ? 'خيار 1' : 'Option 1'] : [],
          is_required: false,
          order: surveyData.value.questions.length + 1,
          NPS_Calculate: false,
          CSAT_Calculate: false,
          min_scale: 0,
          max_scale: 5,
          semantic_tag: 'none' as 'none' | 'nps' | 'csat',
          options_satisfaction_values: [],
          validation_type: 'none' as 'none' | 'email' | 'phone' | 'number' | 'url'
        }
        
        // Add to end
        surveyData.value.questions.push(newQuestion)
        updateQuestionOrders()
      }
    }
  } catch (error) {
    console.error('Error handling drop:', error)
  }
}

const handleQuestionDrop = (dropIndex: number, event: DragEvent) => {
  event.preventDefault()
  event.stopPropagation()
  
  dragOverIndex.value = null
  
  try {
    const jsonData = event.dataTransfer?.getData('application/json')
    if (!jsonData) return
    
    const data = JSON.parse(jsonData)
    
    // Handle palette drop (adding new question)
    if (data.type === 'palette' && data.questionType) {
      const newQuestion = {
        tempId: `temp-${Date.now()}`,
        text: '',
        question_type: data.questionType,
        options: needsOptions(data.questionType) ? [isRTL.value ? 'خيار 1' : 'Option 1'] : [],
        is_required: false,
        order: dropIndex + 1,
        NPS_Calculate: false,
        CSAT_Calculate: false,
        min_scale: 0,
        max_scale: 5,
        semantic_tag: 'none' as 'none' | 'nps' | 'csat',
        options_satisfaction_values: [],
        validation_type: 'none' as 'none' | 'email' | 'phone' | 'number' | 'url'
      }
      
      // Insert at drop position
      surveyData.value.questions.splice(dropIndex, 0, newQuestion)
      updateQuestionOrders()
      return
    }
    
    // Handle reorder (moving existing question)
    if (data.type === 'reorder' && data.index !== undefined) {
      const draggedIndex = data.index
      
      if (draggedIndex === dropIndex) {
        return
      }
      
      const questions = [...surveyData.value.questions]
      const [draggedItem] = questions.splice(draggedIndex, 1)
      
      // Adjust drop index if dragging from before to after
      const adjustedDropIndex = draggedIndex < dropIndex ? dropIndex - 1 : dropIndex
      
      questions.splice(adjustedDropIndex, 0, draggedItem)
      
      surveyData.value.questions = questions
      updateQuestionOrders()
    }
  } catch (error) {
    console.error('Error handling question drop:', error)
  } finally {
    draggedQuestionIndex.value = null
  }
}

const togglePreview = () => {
  showPreview.value = !showPreview.value
}

// Scheduling Modal Methods
const openSchedulingModal = () => {
  showSchedulingModal.value = true
}

const closeSchedulingModal = () => {
  showSchedulingModal.value = false
}

const saveSchedulingSettings = () => {
  closeSchedulingModal()
  Swal.fire({
    icon: 'success',
    title: isRTL.value ? 'تم الحفظ' : 'Saved',
    text: isRTL.value ? 'تم حفظ إعدادات الجدولة بنجاح' : 'Scheduling settings saved successfully',
    timer: 1500,
    showConfirmButton: false
  })
}

// Survey Settings Modal Methods
const openSurveySettingsModal = () => {
  showSurveySettingsModal.value = true
}

const closeSurveySettingsModal = () => {
  showSurveySettingsModal.value = false
}

const saveSurveySettings = () => {
  closeSurveySettingsModal()
  Swal.fire({
    icon: 'success',
    title: isRTL.value ? 'تم الحفظ' : 'Saved',
    text: isRTL.value ? 'تم حفظ إعدادات الاستطلاع بنجاح' : 'Survey settings saved successfully',
    timer: 1500,
    showConfirmButton: false
  })
}

// Conditional Logic Methods
const hasConditions = (question: any): boolean => {
  return (question.set_conditional_on && question.set_conditional_on.length > 0) ||
         (question.conditional_on && question.conditional_on.length > 0)
}

const getQuestionConditions = (question: any): any[] => {
  // Return set_conditional_on (for new questions) or conditional_on (for existing questions from backend)
  return question.set_conditional_on || question.conditional_on || []
}

const getEligibleTriggerQuestions = (currentIndex: number): any[] => {
  // Only questions before the current one can be triggers
  // Only yes_no and single_choice can be triggers
  return surveyData.value.questions
    .slice(0, currentIndex)
    .filter(q => q.question_type === 'yes_no' || q.question_type === 'single_choice')
}

const getSelectedTriggerOptions = (): string[] => {
  if (!newConditionForm.value.trigger_question_tempId) return []
  
  const triggerQuestion = surveyData.value.questions.find(
    q => q.tempId === newConditionForm.value.trigger_question_tempId
  )
  
  if (!triggerQuestion) return []
  
  if (triggerQuestion.question_type === 'yes_no') {
    return [isRTL.value ? 'نعم' : 'Yes', isRTL.value ? 'لا' : 'No']
  }
  
  if (triggerQuestion.question_type === 'single_choice') {
    return triggerQuestion.options || []
  }
  
  return []
}

const onTriggerQuestionChange = () => {
  // Reset answer value when trigger question changes
  newConditionForm.value.trigger_answer_value = ''
}

const toggleConditionalBuilder = (questionIndex: number) => {
  if (activeConditionBuilder.value === questionIndex) {
    activeConditionBuilder.value = null
    resetConditionForm()
  } else {
    activeConditionBuilder.value = questionIndex
    resetConditionForm()
  }
}

const cancelConditionBuilder = () => {
  activeConditionBuilder.value = null
  resetConditionForm()
}

const resetConditionForm = () => {
  newConditionForm.value = {
    trigger_question_tempId: '',
    trigger_answer_value: ''
  }
}

const addConditionToQuestion = (questionIndex: number) => {
  const question = surveyData.value.questions[questionIndex]
  
  if (!canAddCondition.value) {
    Swal.fire({
      icon: 'warning',
      title: isRTL.value ? 'تحذير' : 'Warning',
      text: isRTL.value ? 'يرجى اختيار السؤال المحفز والإجابة' : 'Please select trigger question and answer',
      confirmButtonText: isRTL.value ? 'موافق' : 'OK'
    })
    return
  }
  
  const triggerQuestion = surveyData.value.questions.find(
    q => q.tempId === newConditionForm.value.trigger_question_tempId
  )
  
  if (!triggerQuestion) return
  
  // Check for duplicate condition
  const conditions = question.set_conditional_on || []
  const isDuplicate = conditions.some(c => 
    c.trigger_question_id === (triggerQuestion.id || triggerQuestion.tempId) &&
    c.trigger_answer_value === newConditionForm.value.trigger_answer_value
  )
  
  if (isDuplicate) {
    Swal.fire({
      icon: 'warning',
      title: isRTL.value ? 'تحذير' : 'Warning',
      text: isRTL.value ? 'هذا الشرط موجود بالفعل' : 'This condition already exists',
      confirmButtonText: isRTL.value ? 'موافق' : 'OK'
    })
    return
  }
  
  // Initialize set_conditional_on if needed
  if (!question.set_conditional_on) {
    question.set_conditional_on = []
  }
  
  // Add new condition
  question.set_conditional_on.push({
    trigger_question_id: triggerQuestion.id || triggerQuestion.tempId,
    trigger_answer_value: newConditionForm.value.trigger_answer_value
  })
  
  // Reset form and close builder
  resetConditionForm()
  activeConditionBuilder.value = null
  
  Swal.fire({
    icon: 'success',
    title: isRTL.value ? 'تمت الإضافة' : 'Added',
    text: isRTL.value ? 'تمت إضافة الشرط بنجاح' : 'Condition added successfully',
    timer: 1500,
    showConfirmButton: false
  })
}

const removeConditionFromQuestion = async (questionIndex: number, conditionIndex: number) => {
  const result = await Swal.fire({
    icon: 'warning',
    title: isRTL.value ? 'تأكيد الحذف' : 'Confirm Delete',
    text: isRTL.value ? 'هل تريد حذف هذا الشرط؟' : 'Do you want to delete this condition?',
    showCancelButton: true,
    confirmButtonText: isRTL.value ? 'حذف' : 'Delete',
    cancelButtonText: isRTL.value ? 'إلغاء' : 'Cancel',
    confirmButtonColor: '#d33'
  })
  
  if (result.isConfirmed) {
    const question = surveyData.value.questions[questionIndex]
    
    if (question.set_conditional_on && question.set_conditional_on.length > conditionIndex) {
      question.set_conditional_on.splice(conditionIndex, 1)
      
      // If no conditions left, remove the array
      if (question.set_conditional_on.length === 0) {
        delete question.set_conditional_on
      }
    }
    
    Swal.fire({
      icon: 'success',
      title: isRTL.value ? 'تم الحذف' : 'Deleted',
      text: isRTL.value ? 'تم حذف الشرط بنجاح' : 'Condition deleted successfully',
      timer: 1500,
      showConfirmButton: false
    })
  }
}

const getConditionDisplayText = (condition: any, _questionIndex: number): string => {
  // Find the trigger question
  let triggerQuestion
  
  // Try to find by ID first (for existing questions)
  if (condition.trigger_question_id) {
    triggerQuestion = surveyData.value.questions.find(
      q => q.id === condition.trigger_question_id || q.tempId === condition.trigger_question_id
    )
  }
  
  if (!triggerQuestion) return isRTL.value ? 'شرط غير صالح' : 'Invalid condition'
  
  const questionNumber = triggerQuestion.order || (surveyData.value.questions.indexOf(triggerQuestion) + 1)
  const answerValue = condition.trigger_answer_value
  
  return isRTL.value 
    ? `س${questionNumber} = "${answerValue}"`
    : `Q${questionNumber} = "${answerValue}"`
}

const handleBack = async () => {
  const result = await Swal.fire({
    icon: 'warning',
    title: isRTL.value ? 'تأكيد الخروج' : 'Confirm Exit',
    text: isRTL.value ? 'هل تريد الخروج؟ لن يتم حفظ التغييرات.' : 'Do you want to exit? Changes will not be saved.',
    showCancelButton: true,
    confirmButtonText: isRTL.value ? 'نعم، اخرج' : 'Yes, Exit',
    cancelButtonText: isRTL.value ? 'إلغاء' : 'Cancel',
    confirmButtonColor: '#d33'
  })

  if (result.isConfirmed) {
    emit('back')
  }
}

const prepareSurveyData = () => {
  return {
    title: surveyData.value.title,
    description: surveyData.value.description,
    visibility: 'AUTH',
    is_active: surveySettings.value.is_active,
    start_date: schedulingSettings.value.start_date,
    end_date: schedulingSettings.value.end_date,
    questions: surveyData.value.questions.map(q => {
      const questionData: any = {
        // CRITICAL: Always include ID field FIRST (for both updates and creation)
        // - For updates (PATCH): Use real UUID to preserve existing questions
        // - For creation (POST): Use tempId to enable conditional logic in single request
        // Without IDs, questions get deleted and recreated, breaking conditional logic!
        id: q.id || q.tempId,  // ✅ Always include ID (real UUID or temp ID)
        
        text: q.text,
        question_type: q.question_type,
        options: needsOptions(q.question_type) ? JSON.stringify(q.options) : undefined,
        is_required: q.is_required,
        order: q.order,
        // Analytics fields
        NPS_Calculate: q.NPS_Calculate || false,
        CSAT_Calculate: q.CSAT_Calculate || false,
        min_scale: q.min_scale !== undefined ? q.min_scale : 0,
        max_scale: q.max_scale !== undefined ? q.max_scale : 5,
        options_satisfaction_values: q.options_satisfaction_values && q.options_satisfaction_values.length > 0 
          ? JSON.stringify(q.options_satisfaction_values) 
          : undefined,
        // Validation field
        validation_type: q.validation_type || 'none'
      }
      
      // CRITICAL: Handle conditional logic carefully
      // - If set_conditional_on exists (array with items or empty array): Always send it
      // - If undefined/null: Omit field to preserve existing conditions during PATCH
      // - Empty array [] explicitly clears conditions
      if (q.set_conditional_on !== undefined && q.set_conditional_on !== null) {
        questionData.set_conditional_on = q.set_conditional_on.map(cond => {
          // Find the trigger question to get its actual ID or tempId
          const triggerQuestion = surveyData.value.questions.find(
            tq => tq.tempId === cond.trigger_question_id || tq.id === cond.trigger_question_id
          )
          
          // Use real ID if available, otherwise use tempId (for creation with conditional logic)
          const triggerId = triggerQuestion?.id || triggerQuestion?.tempId || cond.trigger_question_id
          
          return {
            trigger_question_id: triggerId,
            trigger_answer_value: cond.trigger_answer_value
          }
        })
      }
      
      return questionData
    })
  }
}

// Validate and get specific error message
const getValidationError = (): string | null => {
  if (surveyData.value.title.trim().length === 0) {
    return isRTL.value ? 'عنوان الاستطلاع مطلوب' : 'Survey title is required'
  }

  if (surveyData.value.questions.length === 0) {
    return isRTL.value ? 'يجب إضافة سؤال واحد على الأقل' : 'At least one question is required'
  }

  // Check for empty question texts
  for (let i = 0; i < surveyData.value.questions.length; i++) {
    const q = surveyData.value.questions[i]
    if (q.text.trim().length === 0) {
      return isRTL.value 
        ? `السؤال رقم ${i + 1} يحتاج إلى نص` 
        : `Question ${i + 1} needs text`
    }
  }

  // Check analytics requirements (only CSAT needs user input)
  for (let i = 0; i < surveyData.value.questions.length; i++) {
    const q = surveyData.value.questions[i]
    const questionNum = i + 1

    // CSAT validation for single_choice
    if (q.question_type === 'single_choice' && q.CSAT_Calculate) {
      if (!q.options_satisfaction_values || 
          !q.options ||
          q.options_satisfaction_values.length !== q.options.length ||
          q.options_satisfaction_values.some(v => v === undefined || v === null)) {
        return isRTL.value 
          ? `السؤال رقم ${questionNum}: يرجى تعيين مستوى الرضا لجميع الخيارات` 
          : `Question ${questionNum}: Please map satisfaction levels for all options`
      }
    }

    // CSAT validation for yes_no
    if (q.question_type === 'yes_no' && q.CSAT_Calculate) {
      if (!q.options_satisfaction_values || 
          q.options_satisfaction_values.length < 2 ||
          q.options_satisfaction_values[0] === undefined ||
          q.options_satisfaction_values[1] === undefined) {
        return isRTL.value 
          ? `السؤال رقم ${questionNum}: يرجى تعيين مستوى الرضا لإجابات نعم/لا` 
          : `Question ${questionNum}: Please map satisfaction levels for Yes/No answers`
      }
    }

    // NPS validation removed - NPS values are automatically calculated by the system
  }

  return null
}

const handleSaveAsDraft = () => {
  validateTitle()
  
  const validationError = getValidationError()
  if (validationError) {
    Swal.fire({
      icon: 'error',
      title: isRTL.value ? 'خطأ في التحقق' : 'Validation Error',
      text: validationError,
      confirmButtonText: isRTL.value ? 'موافق' : 'OK'
    })
    return
  }

  const draftData = prepareSurveyData()
  emit('saveDraft', draftData)
}

const handlePublish = () => {
  validateTitle()
  
  const validationError = getValidationError()
  if (validationError) {
    Swal.fire({
      icon: 'error',
      title: isRTL.value ? 'خطأ في التحقق' : 'Validation Error',
      text: validationError,
      confirmButtonText: isRTL.value ? 'موافق' : 'OK'
    })
    return
  }

  const publishData = prepareSurveyData()
  emit('publish', publishData)
}

const handleSaveTemplate = () => {
  validateTitle()
  
  const validationError = getValidationError()
  if (validationError) {
    Swal.fire({
      icon: 'error',
      title: isRTL.value ? 'خطأ في التحقق' : 'Validation Error',
      text: validationError,
      confirmButtonText: isRTL.value ? 'موافق' : 'OK'
    })
    return
  }

  const templateData = prepareSurveyData()
  emit('saveTemplate', templateData)
}

// Lifecycle
onMounted(() => {
  console.log('🎬 SurveyEditor mounted')
  console.log('📦 Initial props.template:', props.template)
  initializeSurvey()
  console.log('✅ After initialization, surveyData:', surveyData.value)
})

// Watch for template changes (when loading existing survey)
watch(() => props.template, (newTemplate, oldTemplate) => {
  console.log('👀 Template prop changed!')
  console.log('   Old:', oldTemplate)
  console.log('   New:', newTemplate)
  if (newTemplate) {
    console.log('🔄 Re-initializing survey with new template data')
    initializeSurvey()
    console.log('✅ After re-initialization, surveyData:', surveyData.value)
  }
}, { immediate: false, deep: true })
</script>

<style module src="./SurveyEditor.module.css">
/* CSS Module styles are imported from SurveyEditor.module.css */
</style>
