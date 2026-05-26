<template>
  <div>
    <v-subheader id="navigation">
      {{ $t('app.setting.title.navigation') }}
    </v-subheader>
    <v-card
      :elevation="5"
      dense
      class="mb-4"
    >
      <app-setting>
        <template #title>
          <v-switch
            v-model="confirmOnNavLink"
            :label="$t('app.setting.label.confirm_on_nav_link')"
            hide-details
            class="mt-0 pt-0"
            @click.native.stop
          />
        </template>
        <v-menu
          offset-y
          left
        >
          <template #activator="{ on, attrs }">
            <app-btn
              outlined
              small
              color="primary"
              class="mr-2"
              v-bind="attrs"
              v-on="on"
            >
              <v-icon
                small
                left
              >
                $menu
              </v-icon>
              {{ $t('app.setting.btn.import_export_links') }}
            </app-btn>
          </template>
          <v-list dense>
            <v-list-item @click="exportLinks">
              <v-list-item-icon>
                <v-icon>$download</v-icon>
              </v-list-item-icon>
              <v-list-item-content>
                <v-list-item-title>{{ $t('app.setting.btn.export_links') }}</v-list-item-title>
              </v-list-item-content>
            </v-list-item>
            <v-list-item @click="triggerImport">
              <v-list-item-icon>
                <v-icon>$fileUpload</v-icon>
              </v-list-item-icon>
              <v-list-item-content>
                <v-list-item-title>{{ $t('app.setting.btn.import_links') }}</v-list-item-title>
              </v-list-item-content>
            </v-list-item>
          </v-list>
        </v-menu>

        <app-btn
          outlined
          small
          color="primary"
          @click="openAddDialog"
        >
          <v-icon
            small
            left
          >
            $plus
          </v-icon>
          {{ $t('app.setting.btn.add_nav_link') }}
        </app-btn>

        <!-- Hidden file input for import -->
        <input
          ref="fileInput"
          type="file"
          accept=".json"
          style="display: none"
          @change="handleFileSelected"
        >
      </app-setting>

      <template v-if="themeLinks.length > 0">
        <v-divider />

        <template v-for="(link, i) in themeLinks">
          <app-setting
            :key="`theme-link${link.id}`"
            :r-cols="3"
          >
            <template #title>
              <app-nav-link-icon
                :icon="`$${link.icon}`"
                :custom-icon="link.customIcon"
                :custom-image="link.customImage"
                :color="resolveColor(link.color)"
                small
                class="mr-2"
              />
              {{ link.title }}
            </template>

            <template #sub-title>
              {{ link.url }}
            </template>

            <v-chip
              small
              class="mr-2"
              style="flex-shrink: 0"
            >
              {{ $t('app.setting.label.theme_nav_link') }}
            </v-chip>

            <app-btn
              icon
              @click.stop="toggleThemeLinkVisibility(link.id)"
            >
              <v-icon dense>
                {{ isThemeLinkHidden(link.id) ? '$eyeOff' : '$eye' }}
              </v-icon>
            </app-btn>
          </app-setting>

          <v-divider
            v-if="i < themeLinks.length - 1 || customLinks.length > 0"
            :key="`theme-divider${link.id}`"
          />
        </template>
      </template>

      <template v-if="customLinks.length > 0">
        <v-divider v-if="themeLinks.length === 0" />

        <template v-for="(link, i) in customLinks">
          <app-setting
            :key="`link${link.id}`"
            :r-cols="2"
          >
            <template #title>
              <app-nav-link-icon
                :icon="`$${link.icon}`"
                :custom-icon="link.customIcon"
                :custom-image="link.customImage"
                :color="resolveColor(link.color)"
                small
                class="mr-2"
              />
              {{ link.title }}
            </template>

            <template #sub-title>
              {{ link.url }}
            </template>

            <app-btn
              icon
              @click.stop="openEditDialog(link)"
            >
              <v-icon dense>
                $edit
              </v-icon>
            </app-btn>

            <app-btn
              icon
              @click.stop="handleRemoveLink(link)"
            >
              <v-icon dense>
                $delete
              </v-icon>
            </app-btn>
          </app-setting>

          <v-divider
            v-if="i < customLinks.length - 1"
            :key="`divider${link.id}`"
          />
        </template>
      </template>

      <nav-link-dialog
        v-if="dialogState.active"
        v-model="dialogState.active"
        :link="dialogState.link"
        @save="handleSaveLink"
      />

      <!-- Import mode selection dialog -->
      <v-dialog
        v-model="importDialogState.active"
        max-width="400"
      >
        <v-card>
          <v-card-title>{{ $t('app.setting.btn.import_links') }}</v-card-title>
          <v-card-text>
            <v-radio-group v-model="importDialogState.mode">
              <v-radio
                value="replace"
                :label="$t('app.setting.label.import_mode_replace')"
              />
              <v-radio
                value="merge"
                :label="$t('app.setting.label.import_mode_merge')"
              />
            </v-radio-group>
          </v-card-text>
          <v-card-actions>
            <v-spacer />
            <app-btn
              text
              @click="importDialogState.active = false"
            >
              {{ $t('app.general.btn.cancel') }}
            </app-btn>
            <app-btn
              color="primary"
              @click="confirmImport"
            >
              {{ $t('app.general.btn.save') }}
            </app-btn>
          </v-card-actions>
        </v-card>
      </v-dialog>
    </v-card>
  </div>
</template>

<script lang="ts">
import { Component, Ref, Vue } from 'vue-property-decorator'
import NavLinkDialog from './NavLinkDialog.vue'
import type { CustomNavLink, SvgIconPath } from '@/store/config/types'
import { EventBus } from '@/eventBus'
import { isSafeNavLinkUrl, isWithinNavLinkDataUriLimit } from '@/util/nav-link'

@Component({
  components: {
    NavLinkDialog
  }
})
export default class NavigationSettings extends Vue {
  @Ref('fileInput')
  readonly fileInput!: HTMLInputElement

  dialogState: { active: boolean; link: CustomNavLink | null } = {
    active: false,
    link: null
  }

  importDialogState = {
    active: false,
    mode: 'merge' as 'replace' | 'merge',
    links: [] as CustomNavLink[]
  }

  get customLinks (): CustomNavLink[] {
    return this.$typedGetters['config/getDbNavLinks']
  }

  get themeLinks (): CustomNavLink[] {
    return this.$typedGetters['config/getThemeNavLinks']
  }

  resolveColor (color?: string): string | undefined {
    return color === 'theme'
      ? this.$vuetify.theme.currentTheme.primary?.toString()
      : color
  }

  sanitizeImportedDataUri (value: unknown): string | undefined {
    return (typeof value === 'string' && value.startsWith('data:') && isWithinNavLinkDataUriLimit(value))
      ? value
      : undefined
  }

  sanitizeImportedCustomIcon (value: unknown): string | SvgIconPath[] | undefined {
    // Accept inline SVG path arrays, or data: URIs within the size limit. Reject arbitrary
    // strings (e.g. ".svg" filenames) that would be fetched and injected via <inline-svg>.
    if (Array.isArray(value)) {
      return value.every(p => p && typeof p === 'object' && typeof p.d === 'string')
        ? value as SvgIconPath[]
        : undefined
    }
    return this.sanitizeImportedDataUri(value)
  }

  get confirmOnNavLink (): boolean {
    return this.$typedState.config.uiSettings.navigation.confirmOnNavLink
  }

  set confirmOnNavLink (value: boolean) {
    this.$typedDispatch('config/saveByPath', {
      path: 'uiSettings.navigation.confirmOnNavLink',
      value,
      server: true
    })
  }

  openAddDialog () {
    // Calculate next position based on existing links
    const maxPosition = this.customLinks.reduce((max, link) => Math.max(max, link.position), -1)
    const link: CustomNavLink = {
      id: '',
      title: '',
      url: '',
      icon: 'openInNew',
      target: 'new-tab',
      position: maxPosition + 1
    }
    this.dialogState = {
      active: true,
      link
    }
  }

  openEditDialog (link: CustomNavLink) {
    this.dialogState = {
      active: true,
      link: { ...link }
    }
  }

  handleSaveLink (link: CustomNavLink) {
    this.$typedDispatch('config/updateCustomNavLink', link)
  }

  isThemeLinkHidden (id: string): boolean {
    return (this.$typedState.config.uiSettings.navigation.hiddenThemeLinks || []).includes(id)
  }

  toggleThemeLinkVisibility (id: string) {
    const hidden = new Set(this.$typedState.config.uiSettings.navigation.hiddenThemeLinks || [])
    if (hidden.has(id)) {
      hidden.delete(id)
    } else {
      hidden.add(id)
    }
    this.$typedDispatch('config/saveByPath', {
      path: 'uiSettings.navigation.hiddenThemeLinks',
      value: [...hidden],
      server: true
    })
  }

  async handleRemoveLink (link: CustomNavLink) {
    const result = await this.$confirm(
      this.$t('app.general.simple_form.msg.confirm_remove_nav_link', { name: link.title }).toString(),
      { title: this.$tc('app.general.label.confirm'), color: 'card-heading', icon: '$error' }
    )

    if (result) {
      this.$typedDispatch('config/removeCustomNavLink', { id: link.id })
    }
  }

  // --- Import/Export ---

  exportLinks () {
    const links = this.customLinks
    const exportData = {
      version: 1,
      exportedAt: new Date().toISOString(),
      links: links.map(link => ({
        title: link.title,
        url: link.url,
        icon: link.icon,
        customIcon: link.customIcon,
        customImage: link.customImage,
        color: link.color,
        target: link.target,
        position: link.position
      }))
    }

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `fluidd-nav-links-${new Date().toISOString().split('T')[0]}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  triggerImport () {
    this.fileInput.click()
  }

  handleFileSelected (event: Event) {
    const input = event.target as HTMLInputElement
    const file = input.files?.[0]
    if (!file) return

    const maxSize = 1024 * 1024 // 1 MB
    if (file.size > maxSize) {
      EventBus.$emit(this.$t('app.general.simple_form.error.file_too_large', { size: '1 MB' }).toString(), { type: 'error' })
      input.value = ''
      return
    }

    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string
        const data = JSON.parse(content) as { links?: any[] }

        // Validate the import data
        if (!data.links || !Array.isArray(data.links)) {
          throw new Error('Invalid import file: missing links array')
        }

        // Validate each link: require title + a safe URL, and drop oversized inline assets.
        // Import bypasses the dialog's field-level validation, so it is enforced here too.
        const allowedTargets = ['same-tab', 'new-tab']
        const validLinks: CustomNavLink[] = data.links
          .filter((link) => link.title && isSafeNavLinkUrl(link.url))
          .map((link, index) => ({
            id: '', // Will be assigned on save
            title: link.title as string,
            url: link.url as string,
            icon: (link.icon as string) || 'openInNew',
            customIcon: this.sanitizeImportedCustomIcon(link.customIcon),
            customImage: this.sanitizeImportedDataUri(link.customImage),
            color: typeof link.color === 'string' ? link.color : undefined,
            target: allowedTargets.includes(link.target) ? link.target : undefined,
            position: (link.position as number) ?? index
          }))

        if (validLinks.length === 0) {
          throw new Error('No valid links found in import file')
        }

        // Store the links and show the mode selection dialog
        this.importDialogState.links = validLinks
        this.importDialogState.mode = 'merge'
        this.importDialogState.active = true
      } catch (err) {
        console.error('Import error:', err)
        EventBus.$emit(err instanceof Error ? err.message : 'Failed to import links', { type: 'error' })
      }
    }
    reader.readAsText(file)

    // Reset the input so the same file can be selected again
    input.value = ''
  }

  async confirmImport () {
    const links = this.importDialogState.links
    const mode = this.importDialogState.mode

    // Show confirmation
    const confirmMsg = mode === 'replace'
      ? this.$t('app.general.simple_form.msg.confirm_import_links_replace', { count: links.length }).toString()
      : this.$t('app.general.simple_form.msg.confirm_import_links_merge', { count: links.length }).toString()

    const result = await this.$confirm(
      confirmMsg,
      { title: this.$tc('app.general.label.confirm'), color: 'card-heading', icon: '$info' }
    )

    if (!result) return

    this.importDialogState.active = false

    // Merge keeps existing links; replace starts from an empty set.
    const existing = mode === 'merge' ? this.customLinks : []
    const maxPosition = existing.reduce((max, link) => Math.max(max, link.position), -1)

    const imported = links.map((link, i) => ({
      ...link,
      id: '', // Force new ID (assigned in the mutation)
      position: maxPosition + 1 + i
    }))

    // Single batched write rather than N deletes + N adds, avoiding transient DB states.
    this.$typedDispatch('config/replaceCustomNavLinks', [...existing, ...imported])
  }
}
</script>
