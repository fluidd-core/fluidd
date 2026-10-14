import { Component, Mixins } from 'vue-property-decorator'
import StateMixin from './state'
import type { WebcamConfig } from '@/store/webcams/types'
import { proMode } from '@/services/pro-mode'
import { slicerPresence } from '@/services/slicer-bridge/slicerUrl'
import { activeSlug } from '@/services/printer-pages'
import { pageOfRoute, scopedPath } from '@/router/printerPagePaths'
import {
  sectionOf,
  sectionPath,
  visiblePages,
  visibleSections,
  type Section,
  type SectionContext,
  type SectionPage
} from '@/router/printerSections'

/** What the rail, the header and the phone's tabs share: where you are and where you can go. */
@Component
export default class FrameMixin extends Mixins(StateMixin) {
  get pro (): boolean {
    return proMode.on
  }

  get sectionContext (): SectionContext {
    const cameras = this.$store.getters['webcams/getVisibleWebcams'] as WebcamConfig[]
    return {
      pro: proMode.on,
      slicer: slicerPresence.state === 'present',
      camera: cameras.length ? encodeURI(cameras[0].uid) : null,
      history: this.$store.getters['server/componentSupport']('history') as boolean,
      timelapse: this.$store.getters['server/componentSupport']('timelapse') as boolean,
      diagnostics: this.$store.state.config.uiSettings.general.enableDiagnostics as boolean
    }
  }

  /** A page of one printer, which the rail and the E-STOP belong to. */
  get printerFrame (): boolean {
    return !!this.$route.params.printer && this.$route.meta?.printerIndependent !== true
  }

  /** The page without its printer: /boxwood-367a/history is /history. */
  get currentPage (): string {
    return pageOfRoute(this.$route)
  }

  get currentSection (): Section | undefined {
    return this.printerFrame ? sectionOf(this.currentPage) : undefined
  }

  get sections (): Section[] {
    return visibleSections(this.sectionContext)
  }

  sectionTo (section: Section): string {
    return scopedPath(sectionPath(section, this.sectionContext), activeSlug())
  }

  pageTo (page: SectionPage): string {
    return scopedPath(page.path, activeSlug())
  }

  pagesOf (section: Section): SectionPage[] {
    return visiblePages(section, this.sectionContext)
  }
}
