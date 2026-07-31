# Accessibility review

Phase 10 reviewed the application against WCAG 2.2 AA practices. This is an engineering review, not a third-party conformance certification.

- A skip link and semantic header, navigation, main, aside, article, section, form, table, and footer landmarks provide structure.
- Interactive topology nodes, tabs, filters, drawers, evidence controls, course steps, dialogs, and scenario-builder controls are native keyboard-operable elements with visible focus indicators.
- Service health and connection state include text/icons in addition to color. Critical alerts use live screen-reader announcements.
- Every simulated chart has a data-table alternative; traces have a hierarchical table; the service map has a textual topology view.
- Labels, fieldsets, legends, descriptions, error alerts, and validation issue lists identify form purpose and errors.
- Reduced-motion media queries stop decorative transitions and animations. Content reflows to one column on narrow viewports and does not disable browser zoom.
- Muted text and operational status colors were reviewed against their backgrounds; high-information state never relies on color alone.

Automated component tests cover navigation, labels, alternatives, keyboard controls, reduced motion, and alert semantics. Manual release checks should still cover keyboard-only completion, VoiceOver/NVDA landmarks, 200% and 400% zoom, forced colors, and light/dark contrast on real browsers.
