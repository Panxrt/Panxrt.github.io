V16 — conservative recovery build

BASE:
- V13, because V13 preserved the original smooth horizontal page/deck movement,
  PANXRT shift, WORK colour-mask behavior, and WORK -> CONTACTS masking.

NOT CHANGED FROM V13:
- page/deck transition code
- panel/spine transition rules
- V13 header paintMenu/mask logic
- PANXRT motion logic
- CONTACTS header masking
- top-menu matte recipe
- grid/card sizes, crop, hover, blur
- case layout
- smart media preloading

ONLY CHANGED:
1) Gallery BACK scroll stability:
   - exact scrollTop is kept
   - no card-anchor correction after BACK
   - preview/full gallery now have identical intrinsic grid geometry/scrollHeight
   - preview's apparent narrow/lift state is transform-only, so MosaicLayout does not repack

2) Gallery controls:
   - View all work / BACK / matte transitions are softened
   - no new page/panel transform overrides were added

3) Filter tray:
   - full-width dark frosted second row
   - ALL = pill
   - other categories = plain text
   - tray slides vertically without changing main-header geometry
