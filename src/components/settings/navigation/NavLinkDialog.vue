<template>
  <app-dialog
    v-model="open"
    max-width="500"
    :save-button-text="isEdit ? $t('app.general.btn.save') : $t('app.general.btn.add')"
    @save="handleSave"
  >
    <template #title>
      <app-nav-link-icon
        :icon="localLink.icon ? `$${localLink.icon}` : undefined"
        :custom-icon="localLink.customIcon"
        :custom-image="localLink.customImage"
        :color="resolvedPreviewColor"
        small
        class="mr-2"
      />
      <span class="focus--text">
        {{ isEdit ? $t('app.general.label.edit_nav_link') : $t('app.general.label.add_nav_link') }}
      </span>
    </template>
    <v-card-text class="pa-0">
      <app-setting :title="$t('app.setting.label.name')">
        <v-text-field
          v-model="localLink.title"
          :rules="[$rules.required]"
          hide-details="auto"
          filled
          dense
        />
      </app-setting>

      <v-divider />

      <app-setting>
        <template #title>
          <span>{{ $t('app.setting.label.url') }}</span>
          <app-inline-help
            bottom
            small
            :tooltip="$t('app.setting.tooltip.nav_link_url')"
          />
        </template>
        <v-text-field
          v-model="localLink.url"
          :rules="[$rules.required, urlSafe]"
          :messages="urlWarning"
          :class="{ 'warning-hint': urlWarning }"
          hide-details="auto"
          filled
          dense
        />
      </app-setting>

      <v-divider />

      <app-setting>
        <template #title>
          <span>{{ $t('app.setting.label.nav_link_target') }}</span>
          <app-inline-help
            bottom
            small
            :tooltip="$t('app.setting.tooltip.nav_link_target')"
          />
        </template>
        <v-select
          v-model="linkTarget"
          :items="targetItems"
          hide-details
          filled
          dense
        />
      </app-setting>

      <v-divider />

      <app-setting>
        <template #title>
          <span>{{ $t('app.setting.label.icon_type') }}</span>
          <app-inline-help
            bottom
            small
            :tooltip="$t('app.setting.tooltip.icon_type')"
          />
        </template>
        <v-select
          v-model="selectedIconMode"
          :items="iconModeItems"
          hide-details
          filled
          dense
          @change="handleIconModeChange"
        />
      </app-setting>

      <v-divider />

      <app-setting
        v-if="selectedIconMode === 'icon'"
        :title="$t('app.setting.label.icon')"
      >
        <v-autocomplete
          v-model="localLink.icon"
          :items="iconItems"
          :rules="[$rules.required]"
          hide-details="auto"
          filled
          dense
        >
          <template #item="{ item }">
            <v-icon
              class="mr-2"
              small
            >
              ${{ item.value }}
            </v-icon>
            {{ item.text }}
          </template>
          <template #selection="{ item }">
            <v-icon
              class="mr-2"
              small
            >
              ${{ item.value }}
            </v-icon>
            {{ item.text }}
          </template>
        </v-autocomplete>
      </app-setting>

      <app-setting v-if="selectedIconMode === 'svg'">
        <template #title>
          <span>{{ $t('app.setting.label.custom_svg_icon') }}</span>
          <app-inline-help
            bottom
            small
            :tooltip="$t('app.setting.tooltip.nav_link_custom_icon')"
          />
        </template>
        <div class="d-flex align-center">
          <app-btn
            outlined
            small
            color="primary"
            @click="triggerSvgUpload"
          >
            {{ $t('app.setting.label.upload_svg') }}
          </app-btn>
          <img
            v-if="isCustomIconDataUrl"
            :src="String(localLink.customIcon)"
            class="ml-2"
            style="width: 24px; height: 24px; object-fit: contain;"
          >
          <app-btn
            v-if="localLink.customIcon"
            icon
            small
            class="ml-1"
            @click="clearCustomIcon"
          >
            <v-icon small>
              $close
            </v-icon>
          </app-btn>
        </div>
        <input
          ref="svgFileInput"
          type="file"
          accept="image/svg+xml"
          style="display: none;"
          @change="handleSvgUpload"
        >
        <div
          v-if="imageError"
          class="error--text text-caption mt-1"
        >
          {{ imageError }}
        </div>
      </app-setting>

      <app-setting v-if="selectedIconMode === 'image'">
        <template #title>
          <span>{{ $t('app.setting.label.custom_image') }}</span>
          <app-inline-help
            bottom
            small
            :tooltip="$t('app.setting.tooltip.nav_link_custom_image')"
          />
        </template>
        <div class="d-flex align-center">
          <app-btn
            outlined
            small
            color="primary"
            @click="triggerFileUpload"
          >
            {{ $t('app.setting.label.upload_image') }}
          </app-btn>
          <img
            v-if="localLink.customImage"
            :src="localLink.customImage"
            class="ml-2"
            style="width: 24px; height: 24px; object-fit: contain;"
          >
          <app-btn
            v-if="localLink.customImage"
            icon
            small
            class="ml-1"
            @click="clearCustomImage"
          >
            <v-icon small>
              $close
            </v-icon>
          </app-btn>
        </div>
        <input
          ref="fileInput"
          type="file"
          accept="image/png,image/jpeg"
          style="display: none;"
          @change="handleFileUpload"
        >
        <div
          v-if="imageError"
          class="error--text text-caption mt-1"
        >
          {{ imageError }}
        </div>
      </app-setting>

      <v-divider />

      <template v-if="selectedIconMode === 'icon' || selectedIconMode === 'svg'">
        <app-setting
          :r-cols="12"
          class="color-setting"
        >
          <div class="d-flex justify-space-between align-center full-width">
            <v-menu
              bottom
              right
              :close-on-content-click="false"
            >
              <template #activator="{ on, attrs }">
                <span
                  class="d-inline-flex align-center"
                  v-bind="attrs"
                  v-on="on"
                >
                  <v-icon
                    :color="customColorDisplay"
                    class="mr-2"
                  >
                    $circle
                  </v-icon>
                  <span class="v-label">{{ $t('app.setting.label.custom_color') }}</span>
                </span>
              </template>
              <v-color-picker
                :value="customColorDisplay"
                hide-mode-switch
                mode="hexa"
                @update:color="handleCustomColorUpdate"
              />
            </v-menu>
            <v-switch
              v-if="selectedIconMode === 'svg'"
              :input-value="colorMode === 'file'"
              :label="$t('app.setting.label.file')"
              hide-details
              class="mt-0 pt-0"
              @change="handleFileColorsToggle"
            />
            <v-switch
              :input-value="colorMode === 'theme'"
              :label="$t('app.setting.label.theme')"
              hide-details
              class="mt-0 pt-0"
              @change="handleThemeColorToggle"
            />
          </div>
        </app-setting>
        <v-divider />
      </template>
    </v-card-text>
  </app-dialog>
</template>

<script lang="ts">
import { Component, Vue, Prop, VModel, Ref } from 'vue-property-decorator'
import type { CustomNavLink } from '@/store/config/types'
import type { NavLinkTarget } from '@/util/nav-link'
import { isSafeNavLinkUrl } from '@/util/nav-link'
import { Icons } from '@/globals'

const MAX_IMAGE_SIZE = 64 * 1024 // 64 KB

@Component({})
export default class NavLinkDialog extends Vue {
  @VModel({ type: Boolean })
  open?: boolean

  @Prop({ type: Object, required: true })
  readonly link!: CustomNavLink

  @Ref('fileInput')
  readonly fileInput!: HTMLInputElement

  @Ref('svgFileInput')
  readonly svgFileInput!: HTMLInputElement

  localLink: CustomNavLink = {} as CustomNavLink
  imageError = ''
  selectedIconMode = 'icon'
  savedCustomColor = ''
  colorMode: 'file' | 'theme' | 'custom' = 'custom'

  created () {
    this.localLink = { ...this.link }
    this.selectedIconMode = this.getIconMode()
    if (this.localLink.color && this.localLink.color !== 'theme') {
      this.savedCustomColor = this.localLink.color
    }
    // Initialize colorMode based on current link state
    this.colorMode = this.getInitialColorMode()
  }

  getInitialColorMode (): 'file' | 'theme' | 'custom' {
    if (this.selectedIconMode === 'svg' && !this.localLink.color) {
      return 'file'
    }
    if (this.localLink.color === 'theme') {
      return 'theme'
    }
    return 'custom'
  }

  getIconMode (): string {
    if (this.localLink.customImage) return 'image'
    if (this.localLink.customIcon && typeof this.localLink.customIcon === 'string' && this.localLink.customIcon.startsWith('data:')) {
      return 'svg'
    }
    return 'icon'
  }

  handleFileColorsToggle (checked: boolean) {
    if (checked) {
      // Save current color before clearing
      if (this.localLink.color && this.localLink.color !== 'theme') {
        this.savedCustomColor = this.localLink.color
      }
      this.colorMode = 'file'
      this.$set(this.localLink, 'color', undefined)
    } else {
      // Switch to custom color mode
      this.colorMode = 'custom'
      this.$set(this.localLink, 'color', this.savedCustomColor || undefined)
    }
  }

  handleThemeColorToggle (checked: boolean) {
    if (checked) {
      if (this.localLink.color && this.localLink.color !== 'theme') {
        this.savedCustomColor = this.localLink.color
      }
      this.colorMode = 'theme'
      this.$set(this.localLink, 'color', 'theme')
    } else {
      // Switch to custom color mode (or file colors for SVG)
      if (this.selectedIconMode === 'svg') {
        this.colorMode = 'file'
        this.$set(this.localLink, 'color', undefined)
      } else {
        this.colorMode = 'custom'
        this.$set(this.localLink, 'color', this.savedCustomColor || undefined)
      }
    }
  }

  handleCustomColorUpdate (color: { hex: string }) {
    const value = color.hex
    this.colorMode = 'custom'
    this.$set(this.localLink, 'color', value || undefined)
    if (value) {
      this.savedCustomColor = value
    }
  }

  handleIconModeChange (mode: string) {
    switch (mode) {
      case 'icon':
        this.$set(this.localLink, 'customIcon', undefined)
        this.$set(this.localLink, 'customImage', undefined)
        this.imageError = ''
        // Reset to theme or custom color mode (no file colors for built-in icons)
        if (this.colorMode === 'file') {
          this.colorMode = 'theme'
          this.$set(this.localLink, 'color', 'theme')
        }
        break
      case 'svg':
        this.$set(this.localLink, 'customIcon', undefined)
        this.$set(this.localLink, 'customImage', undefined)
        this.imageError = ''
        // Default to file colors for new SVG uploads
        this.colorMode = 'file'
        this.$set(this.localLink, 'color', undefined)
        break
      case 'image':
        this.$set(this.localLink, 'customIcon', undefined)
        this.imageError = ''
        break
    }
  }

  get iconModeItems () {
    return [
      { text: this.$t('app.setting.label.built_in_icon'), value: 'icon' },
      { text: this.$t('app.setting.label.custom_svg_icon'), value: 'svg' },
      { text: this.$t('app.setting.label.custom_image'), value: 'image' }
    ]
  }

  get linkTarget (): NavLinkTarget {
    return this.localLink.target ?? 'new-tab'
  }

  set linkTarget (value: NavLinkTarget) {
    this.$set(this.localLink, 'target', value)
  }

  get targetItems () {
    return [
      { text: this.$t('app.setting.label.nav_link_target_new_tab'), value: 'new-tab' },
      { text: this.$t('app.setting.label.nav_link_target_same_tab'), value: 'same-tab' }
    ]
  }

  get resolvedPreviewColor (): string | undefined {
    if (this.localLink.color === 'theme') {
      return this.$vuetify.theme.currentTheme.primary?.toString()
    }
    return this.localLink.color
  }

  get customColorDisplay (): string {
    return this.localLink.color && this.localLink.color !== 'theme'
      ? this.localLink.color
      : this.savedCustomColor || '#FFFFFF'
  }

  get isCustomIconDataUrl (): boolean {
    return typeof this.localLink.customIcon === 'string' && this.localLink.customIcon.startsWith('data:')
  }

  get isEdit (): boolean {
    return this.localLink.id !== ''
  }

  get iconItems () {
    return Object.keys(Icons)
      .sort()
      .map(key => ({
        text: key,
        value: key
      }))
  }

  get urlWarning (): string {
    const url = this.localLink.url?.trim() || ''
    if (/^www\./i.test(url) || /\.(?:com|org|net|io|dev|xyz|edu|gov)/i.test(url)) {
      if (!/^[a-z][a-z\d+\-.]*:\/\//i.test(url)) {
        return this.$t('app.setting.tooltip.nav_link_url_warning').toString()
      }
    }
    return ''
  }

  get urlSafe () {
    return (v: string) => {
      if (!isSafeNavLinkUrl(v)) {
        return this.$t('app.general.simple_form.error.invalid_url')
      }
      return true
    }
  }

  triggerSvgUpload () {
    this.svgFileInput.click()
  }

  handleSvgUpload (e: Event) {
    const input = e.target as HTMLInputElement
    const file = input.files?.[0]
    if (!file) return

    if (file.size > MAX_IMAGE_SIZE) {
      this.imageError = this.$t('app.general.simple_form.error.file_too_large', { size: '64 KB' }).toString()
      input.value = ''
      return
    }

    this.imageError = ''
    const reader = new FileReader()
    reader.onload = () => {
      this.$set(this.localLink, 'customIcon', reader.result as string)
    }
    reader.readAsDataURL(file)
    input.value = ''
  }

  clearCustomIcon () {
    this.$set(this.localLink, 'customIcon', undefined)
    this.imageError = ''
  }

  triggerFileUpload () {
    this.fileInput.click()
  }

  handleFileUpload (e: Event) {
    const input = e.target as HTMLInputElement
    const file = input.files?.[0]
    if (!file) return

    if (file.size > MAX_IMAGE_SIZE) {
      this.imageError = this.$t('app.general.simple_form.error.file_too_large', { size: '64 KB' }).toString()
      input.value = ''
      return
    }

    this.imageError = ''
    const reader = new FileReader()
    reader.onload = () => {
      this.$set(this.localLink, 'customImage', reader.result as string)
    }
    reader.readAsDataURL(file)
    input.value = ''
  }

  clearCustomImage () {
    this.$set(this.localLink, 'customImage', undefined)
    this.imageError = ''
  }

  handleSave () {
    this.$emit('save', this.localLink)
    this.open = false
  }
}
</script>

<style lang="scss" scoped>
.warning-hint ::v-deep {
  .v-input__slot {
    background-color: rgba(255, 235, 59, 0.15) !important;
    border: 1px solid rgba(255, 235, 59, 0.5);
  }

  .v-text-field__details .v-messages__message {
    color: var(--v-warning-base);
  }
}

.full-width {
  width: 100%;
}

.color-setting {
  min-height: auto !important;
}

.color-setting ::v-deep .sc-label {
  display: none;
}

.color-setting ::v-deep .sc-content {
  padding-top: 12px;
  padding-bottom: 12px;
}
</style>
