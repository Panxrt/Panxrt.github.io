V15 — fixed gallery jump + stable header compositor

Gallery:
- Preview and expanded gallery now have the exact same intrinsic grid width,
  padding, row layout and scrollHeight.
- VIEW ALL WORK / BACK no longer changes grid padding or entry padding.
- The old visual "gallery gets a little wider / lifts" effect is recreated with
  transform only, so cards do not repack or change scroll geometry.
- Exact scrollTop is kept even at the very bottom of the gallery.
- No anchor correction runs after BACK.
- This removes the empty-bottom flash and the forced jump upward.
- Side rails, matte veil, CTA, filters and BACK are overlay/transform effects only.

Header:
- One fixed global text header, two pixel-aligned colour layers.
- Only PANXRT shifts as side rails accumulate.
- WORK colour/matte region follows the same panel tween.
- CONTACTS masks the header progressively; no abrupt full-screen header state.
- Opening/closing Gallery also interpolates the header instead of switching it in frame 1.
- Matte recipe restored to V13 (#181818a6 + 20px blur).

Filters:
- Full-width matte second row.
- Active category = rounded pill; inactive categories = plain text.

Preserved:
- card sizes/crops/focal points
- hover/blur behavior
- grid configuration/content
- section timing/easing
- smart media preloading
