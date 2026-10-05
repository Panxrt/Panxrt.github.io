V20 — targeted fixes only

Fixed:
- One WORK matte layer, placed in the deck below ABOUT/INTRO and above WORK artwork.
- Matte right edge follows the physical WORK panel edge; CONTACTS mask no longer cuts it early.
- Main WORK matte and filter submenu use the same rgba(24,24,24,.58) + blur(20px) saturate(125%) recipe.
- Gallery-mode header reveal is interpolated instead of jumping instantly to full dark.
- Side INTRO/ABOUT/WORK labels no longer fade/pop; they stay opaque and glide with the panels.
- Filter tray opens/closes more slowly and slides behind the main menu.

Untouched:
- card sizes/crop/grid
- hover/blur on work cards
- page content and cases
- exact gallery scroll preservation logic
- V18/V19 loader and media preloading
