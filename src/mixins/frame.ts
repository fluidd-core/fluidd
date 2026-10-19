import { Component, Mixins } from 'vue-property-decorator'
import StateMixin from './state'
import type { WebcamConfig } from '@/store/webcams/types'
import { hasProSwitch, proMode } from '@/services/pro-mode'
import { slicerPresence } from '@/services/slicer-bridge/slicerUrl'
import { activeSlug, isForeignSlug } from '@/services/printer-pages'
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

  /** Whether this page offers the Pro switch: not on a page with no mode (Slice). */
  get proSwitchShown (): boolean {
    return hasProSwitch(this.$route)
  }

  get sectionContext (): SectionContext {
    if (isForeignSlug(this.$route.params.printer)) {
      return { pro: false, slicer: false, camera: null, history: false, timelapse: false, diagnostics: false, foreign: true }
    }
    const cameras = this.$store.getters['webcams/getVisibleWebcams'] as WebcamConfig[]
    return {
      pro: proMode.on,
      slicer: slicerPresence.state === 'present',
      camera: cameras.length ? encodeURI(cameras[0].uid) : null,
      history: this.$store.getters['server/componentSupport']('history') as boolean,
      timelapse: this.$store.getters['server/componentSupport']('timelapse') as boolean,
      diagnostics: this.$store.state.config.uiSettings.general.enableDiagnostics as boolean,
      foreign: isForeignSlug(this.$route.params.printer)
    }
  }

  /**
   * A page of one printer, which the rail and the E-STOP belong to. A page
   * that needs no printer to work (Slice) can still be drawn as the
   * printer's, with meta.frame 'printer'.
   */
  get printerFrame (): boolean {
    if (!this.$route.params.printer) return false
    return this.$route.meta?.frame === 'printer' || this.$route.meta?.printerIndependent !== true
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
    return scopedPath(sectionPath(section, this.sectionContext), this.sectionContext.foreign ? this.$route.params.printer : activeSlug())
  }

  pageTo (page: SectionPage): string {
    return scopedPath(page.path, this.sectionContext.foreign ? this.$route.params.printer : activeSlug())
  }

  pagesOf (section: Section): SectionPage[] {
    return visiblePages(section, this.sectionContext)
  }
}
