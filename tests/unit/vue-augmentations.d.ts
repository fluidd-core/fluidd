import type dateTimeFormatters from '@/util/date-time-formatters'
import type stringFormatters from '@/util/string-formatters'

/**
 * The app declares `$filters` and `$colorset` by augmenting Vue from inside the
 * plugins that install them, and those plugins pull in the router and the app
 * entry - neither of which this project has any reason to compile. Store code
 * reached by the specs still calls them, so they are declared here instead.
 *
 * Deliberately loose: `tsconfig.app.json` is what type-checks their real shapes.
 * Only the formatters the specs actually exercise are typed precisely.
 */
type TestFilters =
  ReturnType<typeof dateTimeFormatters> &
  ReturnType<typeof stringFormatters> &
  Record<string, any>

declare module 'vue/types/vue' {
  interface Vue {
    $filters: TestFilters;
    $colorset: any;
  }

  interface VueConstructor {
    $filters: TestFilters;
    $colorset: any;
  }
}
