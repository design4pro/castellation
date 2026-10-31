# Reading Atlas

## Scope and success criteria

Deliver 50 distinct visual iterations to the development Worker at https://castellation-web-dev.design4pro.workers.dev/. Publish every iteration separately. Preserve existing user edits, catalog data, reading boundaries, localization, authentication, and accessible navigation.

Conversion is defined here as opening a book, story map, character profile, or reading guide. The visual changes are conversion hypotheses; no measured conversion uplift is claimed.

## Direction contract

- THESIS: Make entering a story feel like opening an illustrated literary atlas.
- OWN-WORLD: Preserve Castellation's paper, forest, sage, rust, and peach palette; Playfair Display and DM Sans; existing story artwork. Use typography, image scale, and editorial composition for distinction.
- STORY: The visitor encounters a story, chooses an entry point, sets a reading boundary, and follows a character or connection.
- FIRST VIEWPORT: A panoramic illustration and an overlapping paper text panel introduce the product and expose the library action immediately.
- FORM: Illustrated spreads, title pages, cast rolls, indexes, chapter desks, and source annotations. Preserve functional controls instead of adding ornamental interaction.

Marketing and discovery surfaces use Persuade. Maps and account forms use Operate. Chapter briefings, method, and help use Read. No WebGL, tracking, artificial claims, or additional image downloads are required.

## Inspiration evidence

- https://www.awwwards.com/websites/storytelling/ - reviewed the storytelling collection and its live examples.
- https://www.awwwards.com/sites/stellar-management - reviewed its documented neighborhood map, gallery, navigation, and property-detail presentation, and opened the live site.
- https://www.awwwards.com/sites/peaches - reviewed its interaction-led entry and map concept, and opened the live site.

The useful transfer is a memorable entrance followed by deliberate navigation and content-specific presentation. Castellation keeps immediate access to reading actions.

## Verification

Each JSONL entry records a unique change, route, target selector, deployment version, and viewport checks. Screenshots live in apps/web/.impeccable/review/. Existing Playwright journeys verify preserved interactions.

Capture rule learned during this task: disable smooth scrolling and use instant scroll before a target capture. A screenshot made while scrolling is invalid evidence and must be recaptured before review.

## Incumbent-world extension exception

FORM provenance is the shipped Castellation implementation inspected before editing: existing story illustrations, Playfair Display and DM Sans, a paper/forest palette, character maps, reading boundaries, cast directories, and chapter navigation. The external references informed composition and navigation rather than a replacement identity. This work follows the Impeccable SCOPED_EXISTING_ALLOWED path for extensions and refinements. No new-world seed, rebrand comp, or invented product brief is claimed. PRODUCT.md was absent at intake and is not introduced as a side effect of this scoped design task. Product facts are evidenced by the existing routes and content; DESIGN.md records the actual final implementation.
