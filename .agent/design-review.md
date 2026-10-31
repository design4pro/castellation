## verdict

- Map inspection rail (#26): resolved. Both overwritten final captures show the position text, the Previous label, and the Next label on the paper panel. The disabled Previous control remains visibly distinct. The CSS now resets the panel foreground, button foregrounds, label color, and enabled hover state instead of retaining the former dark-surface colors.
- Relationship chronology (#36): resolved. Both overwritten final captures show character names and descriptions as separate readable blocks without collision. The White Rabbit is no longer forced into a narrow name column. The CSS now applies the ledger grid to `.relations-list > li`, preserves the inner person links, and stacks `.relations-pair` on mobile.
- Chapter navigation (#42): resolved. Both overwritten final captures show a readable previous-chapter destination against parchment and a distinct forest current-chapter panel. The CSS explicitly sets link, small-label, and metadata foregrounds and supplies appropriate hover/focus styling.
- Active Library masthead (#08): resolved. The desktop `/library` capture shows paper text on the forest active Library tab; mobile shows the separate readable sage/rust active state. The added first-child/current-page selector has sufficient specificity to preserve paper text against the later generic active rule.

## remaining

Clear for the four scored fixes. The eight required overwritten captures are present, nonblank, and show the requested surfaces at desktop/mobile dimensions. No material regression attributable to this correction batch was identified. This ship verdict covers these four scored fixes only, not a new review of the whole surface or the separate persistence/provenance workflow. The parent reports deployment `783a5f96-b319-4304-bb6b-44c7aa29c2ff`, 50/50 Playwright checks, and 96/96 responsive combinations passing; these are supporting evidence, while the visual verdict above is based on the recaptures and CSS.

disposition: ship
