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
      </app-setting>

      <template v-if="themeLinks.length > 0">
        <v-divider />

        <template v-for="(link, i) in themeLinks">
          <app-setting
            :key="`theme-link${link.id}`"
            :r-cols="2"
          >
            <template #title>
              <app-nav-link-icon
                :icon="`$${link.icon}`"
                :custom-icon="link.customIcon"
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
    </v-card>
  </div>
</template>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator'
import NavLinkDialog from './NavLinkDialog.vue'
import type { CustomNavLink } from '@/store/config/types'

@Component({
  components: {
    NavLinkDialog
  }
})
export default class NavigationSettings extends Vue {
  dialogState: any = {
    active: false,
    link: null
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
    const link: CustomNavLink = {
      id: '',
      title: '',
      url: '',
      icon: 'openInNew',
      position: 100
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
}
</script>
