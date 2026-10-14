<template>
  <v-tooltip
    right
    :disabled="!compact"
    open-delay="150"
  >
    <template #activator="{ on, attrs }">
      <router-link
        :to="to"
        class="app-rail-link"
        :class="{ 'app-rail-link--on': active, 'app-rail-link--compact': compact }"
        :aria-current="active ? 'page' : undefined"
        :aria-label="compact ? label : undefined"
        v-bind="attrs"
        v-on="on"
      >
        <frame-icon :name="icon" />
        <span
          v-if="!compact"
          class="app-rail-link__label"
        >{{ label }}</span>
        <span
          v-if="keys && !compact"
          class="app-rail-link__keys"
        >{{ keys }}</span>
      </router-link>
    </template>
    <span>{{ label }}<template v-if="keys"> · {{ keys }}</template></span>
  </v-tooltip>
</template>

<script lang="ts">
import { Component, Prop, Vue } from 'vue-property-decorator'

@Component({})
export default class AppRailLink extends Vue {
  @Prop({ type: String, required: true })
  readonly to!: string

  @Prop({ type: String, required: true })
  readonly icon!: string

  @Prop({ type: String, required: true })
  readonly label!: string

  @Prop({ type: String })
  readonly keys?: string

  @Prop({ type: Boolean })
  readonly active?: boolean

  @Prop({ type: Boolean })
  readonly compact?: boolean
}
</script>

<style lang="scss" scoped>
  .app-rail-link {
    display: flex;
    flex: none;
    align-items: center;
    gap: 12px;
    height: 42px;
    padding: 0 12px;
    border-radius: 12px;
    color: var(--m3d-text-muted) !important;
    font-size: 15px;
    font-weight: 500;
    text-decoration: none;
    white-space: nowrap;
    transition: background-color var(--m3d-duration-fast) var(--m3d-ease), color var(--m3d-duration-fast) var(--m3d-ease);

    &:hover {
      background: var(--m3d-hover);
      color: var(--m3d-text) !important;
    }
  }

  .app-rail-link--compact {
    justify-content: center;
    height: 44px;
    padding: 0;
  }

  .app-rail-link--on {
    background: var(--m3d-surface);
    color: var(--m3d-text) !important;

    .frame-icon {
      color: var(--m3d-accent);
    }
  }

  .app-rail-link__label {
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .app-rail-link__keys {
    margin-left: auto;
    color: var(--m3d-text-subtle);
    font-family: var(--m3d-font-mono);
    font-size: 11px;
    letter-spacing: 0.06em;
  }
</style>
