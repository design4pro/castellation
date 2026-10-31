# The Bookshop: second series of 50 iterations

The user requests 50 new, individually deployed visual changes, with a bookshelf or old bookshop identity. The previous 50 Reading Atlas deployments remain in their original registry and must not be counted toward this run.

## Direction

Keep the existing catalog, reading boundaries, illustrations, links, authentication, English and Polish routes. Use the existing Astro application. New shared composition lives in `src/styles/bookshop.css`; a server-rendered Bookcase component uses actual catalog records, without a second catalog request or client JavaScript.

The entrance becomes a mahogany bookcase with readable leather-bound covers. Deeper pages reinterpret distinct bookshop objects: catalog drawers, bookplates, accession cards, a reading desk, folded leaves, and reference cabinets. Paper and forest colors connect the existing product to the new walnut, oxblood, and brass surfaces explicitly authorized by the old-bookshop brief.

Success means a visitor can identify the product and open a real story from the first viewport, on desktop and mobile, while existing reading journeys continue working. Conversion uplift is a hypothesis, not a measured claim.

## Inspiration inspected

- https://www.awwwards.com/websites/typography/: typography-led spatial hierarchy.
- https://www.awwwards.com/sites/spyker-cars and https://www.spykercars.com/: inspected the SOTD entry and live entrance; the transferable principle is to make the subject itself the entrance, then expose its next action.
- https://www.awwwards.com/sites/ondo-collective and https://ondocollective.jp/: a distinct world and deliberate spatial entrance. Its canvas implementation is not needed for a fast reading product.

The original dirty working tree is preserved. New records use separate bookshop filenames. Deployment records require a real Wrangler version, a successful live response, and a visible target at desktop and mobile widths; no record is marked complete before those checks.

## Cascade verification rule

When a composition changes its surface or layout model, explicitly check inherited foreground colors, positioned children, pseudo-elements, display, and higher-specificity state selectors. A screenshot is required because a successful build and overflow check cannot establish text contrast or image containment.
