<template>
  <app-dialog
    v-model="open"
    :title="isEdit ? $t('app.general.label.edit_nav_link') : $t('app.general.label.add_nav_link')"
    max-width="500"
    :save-button-text="isEdit ? $t('app.general.btn.save') : $t('app.general.btn.add')"
    @save="handleSave"
  >
    <v-card-text class="pa-0">
      <app-setting :title="$t('app.setting.label.name')">
        <v-text-field
          v-model="link.title"
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
          v-model="link.url"
          :rules="[$rules.required, urlSafe]"
          hide-details="auto"
          filled
          dense
        />
      </app-setting>

      <v-divider />

      <app-setting :title="$t('app.setting.label.icon')">
        <v-autocomplete
          v-model="link.icon"
          :items="iconItems"
          :rules="link.customIcon ? [] : [$rules.required]"
          :disabled="!!link.customIcon"
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

      <v-divider />

      <app-setting>
        <template #title>
          <span>{{ $t('app.setting.label.custom_icon') }}</span>
          <app-inline-help
            bottom
            small
            :tooltip="$t('app.setting.tooltip.nav_link_custom_icon')"
          />
        </template>
        <v-text-field
          v-model="link.customIcon"
          :placeholder="$t('app.setting.label.custom_icon_hint')"
          hide-details="auto"
          filled
          dense
        />
      </app-setting>

      <v-divider />

      <app-setting :title="$t('app.setting.label.link_icon_color')">
        <v-checkbox
          :input-value="link.color === 'theme'"
          :label="$t('app.setting.label.use_theme_color')"
          hide-details
          class="mr-2 mt-0 pt-0"
          @change="link.color = $event ? 'theme' : undefined"
        />
        <app-btn
          v-if="link.color && link.color !== 'theme'"
          icon
          @click="link.color = undefined"
        >
          <v-icon dense>
            $reset
          </v-icon>
        </app-btn>
        <app-color-picker
          :value="link.color && link.color !== 'theme' ? link.color : ''"
          :disabled="link.color === 'theme'"
          dot
          :title="$t('app.setting.label.link_icon_color')"
          @input="link.color = $event || undefined"
        />
      </app-setting>

      <v-divider />

      <app-setting>
        <template #title>
          <span>{{ $t('app.setting.label.position') }}</span>
          <app-inline-help
            bottom
            small
            :tooltip="$t('app.setting.tooltip.nav_link_position')"
          />
        </template>
        <v-text-field
          v-model.number="link.position"
          :rules="[$rules.required, $rules.numberValid]"
          hide-details="auto"
          type="number"
          filled
          dense
        />
      </app-setting>
    </v-card-text>
  </app-dialog>
</template>

<script lang="ts">
import { Component, Vue, Prop, VModel } from 'vue-property-decorator'
import type { CustomNavLink } from '@/store/config/types'
import { Icons } from '@/globals'

@Component({})
export default class NavLinkDialog extends Vue {
  @VModel({ type: Boolean })
  open?: boolean

  @Prop({ type: Object, required: true })
  readonly link!: CustomNavLink

  get isEdit (): boolean {
    return this.link.id !== ''
  }

  get iconItems () {
    return Object.keys(Icons)
      .sort()
      .map(key => ({
        text: key,
        value: key
      }))
  }

  get urlSafe () {
    return (v: string) => {
      const trimmed = v.trim().toLowerCase()
      if (/^(javascript|data|vbscript):/i.test(trimmed)) {
        return this.$t('app.general.simple_form.error.invalid_url')
      }
      return true
    }
  }

  handleSave () {
    this.$emit('save', this.link)
    this.open = false
  }
}
</script>
