V13 CLEAN REBUILD

Base: V4, the last visually stable/original gallery choreography.

Preserved:
- original View all work / BACK gallery transformation
- side rails/spines
- filter tray movement
- preview matte/blur and View all work
- card sizes, crop, grid, hover and blur
- section timing/easing

Changed:
- header is one fixed full-width shell; it never shifts or changes width
- light/dark header copies stay pixel-aligned and are only clipped by the physical section boundaries
- ABOUT -> WORK reveals the dark header exactly with WORK
- WORK -> CONTACTS masks the entire header smoothly right-to-left; CONTACTS ends with no header
- a matte backing extends slightly under ABOUT's rounded edge, so no rectangular gap can show
- loader logo hands off to the hidden header logo with no duplicate visible PANXRT
- WORK scroll is preserved when navigating away
- section text reveals only on first visit
- V10 smart media preloading is retained
- favicon has SVG/PNG/ICO/inline fallbacks
