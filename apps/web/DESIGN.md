---
name: Castellation
description: An old bookshop entrance with paper reading tools and a retained literary atlas.
colors:
  shop-walnut: "#38271f"
  shop-wood: "#614332"
  shop-brass: "#dfbd7f"
  shop-paper: "#f3ead9"
  shop-burgundy: "#642e35"
  atlas-paper: "#f6f4ed"
  atlas-ink: "#27352f"
  atlas-forest: "#263e33"
  atlas-rust: "#87452c"
  atlas-peach: "#f0c3a5"
  atlas-sage: "#e1e9dd"
  atlas-parchment: "#eee4d9"
  atlas-muted: "#405448"
  atlas-rule: "#9cad9e"
  atlas-dark-rule: "#789181"
  button-forest: "#283e34"
  button-hover: "#3d5a49"
  button-white: "#fff"
  secondary-ink: "#273b30"
  field-border: "#aab8a8"
  focus-rust: "#bc6f42"
typography:
  display:
    fontFamily: "Playfair Display, serif"
    fontSize: "clamp(46px, 5.8vw, 82px)"
    fontWeight: 500
    lineHeight: 1.02
    letterSpacing: "-0.04em"
  headline:
    fontFamily: "Playfair Display, serif"
    fontSize: "clamp(34px, 4vw, 52px)"
    fontWeight: 500
    lineHeight: 1.1
  title:
    fontFamily: "Playfair Display, serif"
    fontSize: "28px"
    fontWeight: 500
    lineHeight: 1.15
  body:
    fontFamily: "DM Sans, sans-serif"
    fontSize: "17px"
    lineHeight: 1.7
  label:
    fontFamily: "DM Sans, sans-serif"
    fontSize: "13px"
    fontWeight: 600
rounded:
  square: "0"
  bound-book: "5px 12px 3px 3px"
  folded-slip: "0 0 12px 0"
  invitation: "0 0 16px 0"
  folio: "6px 16px 6px 6px"
  control: "3px"
  select: "4px"
  graph: "5px"
spacing:
  step-12: "12px"
  step-16: "16px"
  step-20: "20px"
  step-24: "24px"
  step-26: "26px"
  step-30: "30px"
  step-32: "32px"
  step-40: "40px"
  step-50: "50px"
  step-60: "60px"
components:
  button-primary:
    backgroundColor: "{colors.button-forest}"
    textColor: "{colors.button-white}"
    rounded: "{rounded.control}"
    padding: "18px 22px"
    typography: "{typography.label}"
  button-primary-hover:
    backgroundColor: "{colors.button-hover}"
  button-secondary:
    backgroundColor: "transparent"
    textColor: "{colors.secondary-ink}"
    rounded: "{rounded.control}"
    padding: "16px 20px"
  account-input:
    backgroundColor: "{colors.atlas-paper}"
    rounded: "{rounded.square}"
    padding: "13px"
  navigation-tab:
    backgroundColor: "transparent"
    textColor: "{colors.shop-walnut}"
    padding: "14px 12px"
  cast-card:
    backgroundColor: "{colors.shop-paper}"
    rounded: "{rounded.folded-slip}"
    padding: "0"
  chapter-current:
    backgroundColor: "{colors.shop-burgundy}"
    textColor: "{colors.shop-paper}"
    rounded: "{rounded.folded-slip}"
    padding: "26px"
  entrance-action:
    backgroundColor: "{colors.shop-brass}"
    textColor: "{colors.shop-walnut}"
    rounded: "{rounded.control}"
    padding: "18px 22px"
  bound-book:
    backgroundColor: "{colors.atlas-forest}"
    textColor: "{colors.shop-paper}"
    rounded: "{rounded.bound-book}"
    padding: "30px 20px 22px 28px"
  bound-book-alternate:
    backgroundColor: "{colors.shop-burgundy}"
  catalog-drawer:
    backgroundColor: "{colors.shop-wood}"
    textColor: "{colors.shop-paper}"
    padding: "24px"
---

# Design System: Castellation

## Overview

**Creative North Star: "The Old Bookshop and Its Reading Desk"**

Castellation welcomes readers through a mahogany bookcase of readable bound volumes. Walnut, brass, burgundy, paper, existing story artwork, and literary titles give the catalog a tactile old-bookshop character. The first shelf contains real catalog titles and native story links, rendered without client JavaScript.

Deeper surfaces reinterpret catalog drawers, accession slips, bookplates, folded leaves, reference cabinets, and reading desks. The literary atlas remains part of the implementation: routes and surfaces without a bookshop override retain its paper, forest, sage, rust, and peach vocabulary. Reading maps remain working tools with chapter controls and inspection rails.

**Key Characteristics:**
- A readable mahogany bookshelf as the first entrance.
- Paper catalog objects within wood and clothbound surfaces.
- Playfair Display literary titles and DM Sans interface text.
- Native reading links, responsive tools, and visible keyboard focus.

This record merges the implemented bookshop layer with the retained atlas system. The shared layout loads `global.css`, then `reading-atlas.css`, then `bookshop.css`. Bookshop overrides are explicitly scoped beneath `#page` inside screen media rules; they do not redefine the printed character card.

## Colors

The bookshop palette overlays selected atlas surfaces. Frontmatter values are normative; the names below refer to those tokens.

### Primary

- **Shop Walnut / Shop Wood:** the bookcase, cabinet frames, reading desks, and shelf ledges.
- **Shop Burgundy:** alternate bindings, reading actions, selected chapter choices, and literary emphasis on paper.
- **Shop Brass:** binding details, dark-surface accents, and the entrance action.
- **Atlas Forest:** structural dark panels, reading desks, active chapter backgrounds, and the main navigation tab.
- **Atlas Rust:** emphasis within paper-based titles, contextual text links, and selected focus treatments.
- **Button Forest / Button Hover:** the retained primary-button default and hover pair; these differ from atlas panels.

### Secondary

- **Atlas Sage:** cast initials, discovery panels, map canvas, and account-form surroundings.
- **Atlas Peach:** emphasized words, small reading details, and focus indicators on selected dark surfaces.
- **Atlas Parchment:** chapter shelves, annotations, event panels, and alternating editorial surfaces.

### Neutral

- **Shop Paper:** catalog slips, bookplates, chapter leaves, and the storefront fascia. This is distinct from retained atlas paper.
- **Atlas Paper:** page canvas and light surfaces within dark reading panels.
- **Atlas Ink / Atlas Muted:** main copy and supporting text on light surfaces.
- **Atlas Rule / Atlas Dark Rule:** index dividers and separators on their respective light and dark surfaces.
- **Button White / Secondary Ink / Field Border / Focus Rust:** retained control-specific colors from the global stylesheet.

**The Material Pairing Rule.** On bookshop wood and burgundy surfaces, use shop paper for copy and brass for selected details. Retained forest panels keep their atlas paper, sage, and peach pairings.

## Typography

**Display Font:** Playfair Display, with serif fallback.
**Body Font:** DM Sans, with sans-serif fallback.

Literary headings carry the expressive scale; interface text stays compact and direct. The shared layout loads both families at weights 400, 500, 600, and 700. The frontmatter records representative reused roles, not a universal scale imposed on every page.

### Hierarchy

- **Display:** home entrance titles; tight leading and negative tracking. At the mobile breakpoint, the bookshop entrance title changes to `clamp(43px, 10vw, 68px)`. Bound-volume titles use their own smaller fluid scale.
- **Headline:** recurring chapter, source, and section headings; other editorial headings use context-specific fluid sizes.
- **Title:** map character entries and smaller literary titles.
- **Body:** representative introductory copy. Interface and supporting copy also use observed sizes from 13px to 18px; long prose retains page-specific measures and leading.
- **Label:** primary-action text. Other navigation and field labels use weights 600 or 700 according to their component.

**The Literary Hierarchy Rule.** Use Playfair Display for literary titles and DM Sans for controls and supporting interface copy.

## Layout

The shared wrapper is `min(1320px, calc(100% - 96px))`; at 760px and below it becomes `calc(100% - 40px)`. Selected illustrated home spreads extend to a maximum of 1600px. Editorial layouts pair unequal columns with gaps commonly expressed as 6-8%; dense tools use bounded rails and smaller fixed gaps.

The bookshop entrance places copy beside a working bookcase in unequal columns, without the earlier paper overlap. At 760px and below, major compositions become one reading sequence; the two entrance volumes remain side by side until widths of 359px and below, where they stack and lose their rotation. Library volumes stack at 760px; selected cast and relationship-slip grids stack at 900px. Titles and actions remain visible instead of being replaced by decorative spines.

The retained map workspace uses a 290px inspection rail beside its canvas and moves it below on mobile. Its bookshop frame changes the surrounding material, while graph geometry and chapter controls retain their functional roles. Other atlas routes keep their own compositions.

Spacing values in the frontmatter are observed repeated steps, not a strict arithmetic grid. Broad section intervals commonly use 50-100px; inset panels commonly use 24-40px or fluid padding. Mobile panels often reduce to 24px or 26px. The main responsive switch is 760px; additional component breakpoints are recorded in the sidecar.

## Elevation & Depth

Bookshop depth is structural: inset binding shadows, wood shelf shadows, double-rule plates, and paper layers identify objects. The bound-volume specimen retains a small alternating rotation; its hover underlines the title rather than moving the volume. Cabinet and folio shadows suggest recesses or hinges.

Retained atlas spreads derive depth primarily from tonal surfaces, image overlays, ruled divisions, and the home paper overlap. Cast-register rows and map zoom controls explicitly remove shadows. This is not a universal shadow ban: the retained mobile navigation dropdown uses `0 12px 20px #27352f18` to separate its overlay from the page.

Image gradients preserve text readability over existing story artwork. The home story image scales to 1.04 on hover with a half-second easing transition; its transition is disabled for reduced motion. Global smooth scrolling is also disabled under the reduced-motion preference. These treatments do not define a universal animation system.

## Shapes

Bookshop bindings use asymmetric small corners; folded slips round only their lower-right corner. The frontmatter distinguishes the binding, folded-slip, invitation, and outer-folio silhouettes. Shelves, relationship frames, and service trays remain square. Thin brass-toned rules and double borders identify labels and plates, rather than a uniform rounded-card treatment.

The atlas extension favors square editorial panels, full-bleed rectangular illustration, and tall rectangular initial blocks. Primary and secondary controls retain small rounded corners; account inputs become square. Native chapter selects and the graph container retain their own modest radii. Circular graph nodes remain meaningful map geometry, while older arched motifs still exist in the incumbent styles and are not a requirement for new atlas spreads.

Use thin rules for indexes and source divisions. Keep graphic initial blocks subordinate to names and reading information.

## Components

### Buttons

Primary buttons retain a forest fill, white text, a small corner radius, and their global hover fill. Secondary buttons retain a transparent fill with a thin dark-rule border. The entrance action uses brass on walnut; reading-entry and selected map actions use burgundy on paper. These contextual variants do not replace every retained button.

Keyboard focus remains visible. The global outline is 3px with a 4px offset; some form controls use a 3px offset. Selected dark atlas regions switch the outline color to peach, while selected paper regions use atlas rust. Do not flatten these surface-specific treatments into one color.

### Inputs / Fields

Account fields use paper fill, a field-border stroke, square corners, and a minimum height of 52px. The account form now sits on a shop-paper folio; the inputs themselves retain atlas paper. Search fields and reading-boundary selects have their own size and padding; the map boundary select has a minimum height of 54px. Native labels and input semantics remain part of these patterns.

### Navigation

The storefront fascia combines a serif wordmark with transparent DM Sans destinations on shop paper. Burgundy text and a bottom rule identify hover and current-page states; existing current-page underlining remains. At the main mobile breakpoint a native disclosure menu and a quick-section row replace desktop destinations. The quick row retains its atlas sage selected surface and rust underline. The locale switch remains a compact segmented control with a dark current-language segment.

### Cards / Containers

Cast cards now use paper bodies, wood headers, framed initials, and a folded-slip corner; alternate rows share the paper treatment. Library titles stand as forest and burgundy clothbound volumes with existing illustration, visible titles, and reading links. Chapter navigation sits in a walnut sorting tray with paper previous/next leaves and a burgundy current chapter. The sidecar's current-chapter specimen is a status surface, not an interactive card.

### Bookcase and Catalog Drawers

The entrance bookcase is a semantic navigation region generated from the existing catalog. Each whole volume is a native link with an author, literary title, existing artwork when available, and explicit reading action. Artwork is decorative within the already named link. A wood ledge anchors the volumes. Hover underlines the title; keyboard focus uses a brass outline with an offset.

Author drawers and guide drawers place paper-colored names inside wood compartments. Search occupies a wood cabinet with a framed serif label, paper input area, and burgundy action. Keep labels, actions, and reading boundaries usable independently of the material metaphor.

### Reading Indexes and Map Workspace

Author indexes, cast registers, and relationship lists use thin rules and generous vertical spacing instead of uniform card grids. Their typography and row geometry follow the kind of information presented; in chapter relationship lists, the list item owns the row grid while character links remain within the relationship content. The map keeps native chapter controls near its graph and inspection rail. Its boundary ruler uses shop-paper fill, walnut labels, burgundy supporting details, and a light native select; surrounding map controls retain context-specific atlas states. The interactive graph geometry is functional content.

## Do's and Don'ts

### Do:
- **Do** make catalog titles and native reading actions readable on the entrance bookshelf.
- **Do** use bookshop materials on the implemented surfaces and retain atlas treatments where no override exists.
- **Do** pair literary serif titles with sans-serif interface labels and supporting text.
- **Do** collapse editorial columns and the map rail into a single reading sequence at the implemented mobile breakpoint.
- **Do** preserve reading boundaries, native form controls, focus indicators, and reduced-motion handling.

### Don't:
- **Don't** apply the entrance bookshelf to every page; maps, chapter briefings, and account forms have their own layouts.
- **Don't** let material decoration conceal titles, reading controls, or keyboard focus.
- **Don't** replace existing story artwork with generic decoration.
- **Don't** infer a universal radius, body size, or button color from a single surface.
