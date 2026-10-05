V14

Based on V13 (the build where the core site/gallery behavior was almost correct).

Fixed:
- One global fixed header remains in one geometry.
- Only PANXRT shifts horizontally as side rails accumulate.
- Light/dark menu colour is still revealed by the physical WORK boundary.
- CONTACTS masks the same header smoothly; this also works when navigating there
  directly from expanded gallery mode.
- Gallery opening/closing no longer forces a special full-header state on frame 1.
- Filter row matches the supplied reference: full-width matte row, active pill,
  inactive filters as plain text.
- Restored smooth gallery-grid padding interpolation (V13 had transition:none
  inherited later in viewport.css, causing the visible snap).
- Removed the final anchor-based scroll correction that caused the last-frame
  vertical jerk on BACK.
- Exact WORK scrollTop is retained.
- Preview matte, View all work, BACK and filter tray all transition rather than pop.

Unchanged:
- card sizes / mosaic layout
- image and video crop/focal point
- blur/frosted visual language
- card hover behavior
- section timing/easing
- typography/colors
- case layout
- smart media preloading
