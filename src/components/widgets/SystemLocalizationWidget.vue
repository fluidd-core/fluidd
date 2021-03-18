<template>
  <div>
    <v-list-group
      no-action>
      <template v-slot:activator>
        <v-list-item-content>
          <v-list-item-title>{{ $t('i18n.title') }}</v-list-item-title>
        </v-list-item-content>
      </template>
    <template slot="prependIcon">
        <flag
        v-if="!(currentLocale === 'auto')"
        :iso="isoOf(currentLocale)"
        :size="24"
        />
        <v-icon v-else>
        language
        </v-icon>
    </template>

    <v-list-item>
          <v-list-item-content>
              <v-select
                :value="currentLocale"
                :items="selectableLocales"
                :label="$t('i18n.choose')"
                @change="saveI18n"
              >
                <template v-slot:selection="data">
                  <span v-if="data.item.value === 'auto' ">
                    {{ $t('i18n.auto') }}
                  </span>
                  <span v-else>
                    {{ data.item.text }}
                  </span>
                </template>
                <template v-slot:item="data">
                  <div v-if="data.item.value === 'auto' ">
                    <v-icon>
                      language
                    </v-icon>
                    <span>
                    {{ $t('i18n.auto') }}
                    </span>
                  </div>
                  <div v-else>
                    <flag
                      :iso="isoOf(data.item.value)"
                      :size="24"
                    />
                    <span>
                    {{ data.item.text }}
                    </span>
                  </div>
                </template>
              </v-select>
          </v-list-item-content>
    </v-list-item>
    </v-list-group>
  </div>
</template>

<script lang="ts">
import { Component, Mixins } from 'vue-property-decorator'
import { LoadedLocalization } from '@/localization'
import Flag from '@/components/Flag.vue'

function compareInt (a: number, b: number, desc: boolean) {
  if (desc) {
    if (a < b) return 1
    if (a > b) return -1
  } else {
    if (a < b) return -1
    if (a > b) return 1
  }
  return 0
}

@Component({
  components: {
    Flag
  }
})
export default class SystemLocalizationWidget extends Mixins() {
  get locales () {
    return LoadedLocalization
  }

  get selectableLocales () {
    let i = 1
    const list = this.locales.slice(0).map(
      (curLang) => {
        const obj = {
          pos: i,
          text: curLang.title,
          value: curLang.language
        }
        i++
        return obj
      }
    )
    list.push({
      pos: 0,
      text: '',
      value: 'auto'
    })
    return list.sort(
      (a, b) => {
        return compareInt(a.pos, b.pos, false)
      }
    )
  }

  get currentLocale () {
    return this.$store.state.config.uiSettings.general.locale
  }

  set currentLocale (locale: string) {
    this.$store.commit('config/setCurrentLocale', locale)
  }

  isoOf (locale: string) {
    for (const el of this.locales) {
      if (el.language === locale) {
        return el.flag
      }
    }
    return locale
  }

  saveI18n (value: string) {
    this.currentLocale = value
  }
}
</script>
