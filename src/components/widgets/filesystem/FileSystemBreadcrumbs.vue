<template>
  <v-breadcrumbs
    class="pa-0"
    :items="breadcrumbItems"
  >
    <template #item="{ item }">
      <v-breadcrumbs-item
        :disabled="item.disabled"
        :aria-label="`${root}${item.fullPath}`"
        :tabindex="item.disabled ? -1 : 0"
        :role="item.disabled ? undefined : 'link'"
        @click="handleBreadcrumbItemClick(item)"
        @keydown.enter.prevent="handleBreadcrumbItemClick(item)"
        @keydown.space.prevent="handleBreadcrumbItemClick(item)"
      >
        <v-tooltip bottom>
          <template #activator="{ on, attrs }">
            <v-icon
              v-if="!item.fullPath"
              v-bind="attrs"
              :disabled="item.disabled"
              :small="dense"
              v-on="on"
            >
              {{ item.disabled ? '$folder' : '$folderOpen' }}
            </v-icon>
            <span
              v-else
              v-bind="attrs"
              v-on="on"
            >
              {{ item.text }}
            </span>
          </template>
          <span>{{ item.fullPath || "/" }}</span>
        </v-tooltip>
      </v-breadcrumbs-item>
    </template>
  </v-breadcrumbs>
</template>

<script lang="ts">
import { Component, Prop, Vue } from 'vue-property-decorator'

type BreadcrumbItem = {
  text?: string
  fullPath: string
  disabled: boolean
}

@Component({})
export default class FileSystemBreadcrumbs extends Vue {
  @Prop({ type: String, required: true })
  readonly root!: string

  @Prop({ type: String, required: true })
  readonly path!: string

  @Prop({ type: Boolean })
  readonly dense?: boolean

  get breadcrumbItems (): BreadcrumbItem[] {
    const segments = this.path
      .split('/')
      .filter(Boolean)

    return [
      {
        fullPath: '',
        disabled: segments.length === 0
      },
      ...segments
        .map((segment, index) => ({
          text: segment,
          fullPath: `/${segments.slice(0, index + 1).join('/')}`,
          disabled: index === segments.length - 1
        }))
    ]
  }

  handleBreadcrumbItemClick (item: BreadcrumbItem) {
    if (!item.disabled) {
      this.$emit('navigate-to', `${this.root}${item.fullPath}`)
    }
  }
}
</script>

<style lang="scss" scoped>
:deep(.v-breadcrumbs__item:not(.v-breadcrumbs__item--disabled)) {
  cursor: pointer;

  &:hover {
    text-decoration: underline;
  }
}
</style>
