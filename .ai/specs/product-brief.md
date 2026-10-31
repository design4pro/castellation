# Castellation - product brief

- Date: 2026-10-31
- Mode: existing prototype; Owner: Product owner (session participant); Pass: full.
- Evidence basis: one owner's design assessment and confirmed preferences; repository implementation and internal reports share project provenance. No reader research or current independent visual audit.
- Coverage: 13 claims — 11 sourced (interview 0, data 0, document 6, product 5, benchmark 0), 0 synthetic, 2 assumed; 0 entries on the collection plan
- Synthetic hypotheses outside Coverage: 0
- Definition of Ready signed by: not signed for implementation; Product owner approved the visual direction in D03 only.
- Sources: [owner record](research/decisions/2026-10-31-web-design-direction.md), [product](../../apps/web/PRODUCT.md), [design](../../apps/web/DESIGN.md), [compatibility](../../BACKWARD_COMPATIBILITY.md), [previous direction](../../.agent/bookshop-direction.md). Repository paths below are relative to its root.

## Decision summary

The owner chose a contemporary website with an old-library atmosphere, centered on characters and relationship graphs (D01), then approved the Relationship Atlas direction with prominent character portraits inside the graph (D03). The graph is Castellation's main visual motif; typography and color evoke the old library. The owner rejects the current visual quality; this is a stakeholder assessment, not evidence of reader demand or usability. The brainstorm ended at direction approval. Detailed styling, acceptance criteria, and the proposed concept review remain unresolved (D02, Q01); no screen production or implementation was authorized.

## Vision

Give Castellation a modern, professional old-library identity with characters and their connections as its visual subject. This is the owner's intended direction. [DOCUMENT] Owner record.

## Target group and stakeholders

- Intended user role: a reader exploring chapter-bounded character connections; no validated audience segment or payer has been established. [PRODUCT] README.md; apps/web/PRODUCT.md.
- Scope decider: Product owner, who supplied and owns D01. [DOCUMENT] Owner record.

## Problems, with evidence

- The owner assesses the whole website as insufficiently modern and professional, generic AI-generated design and reminiscent of the 1990s. Frequency, reader impact, and a reader workaround are unknown. [DOCUMENT] Owner record.
- The recorded bookshop direction emphasizes a mahogany bookcase and bound volumes; this differs from the owner's newly stated priority. This is a direction mismatch, not proof that existing navigation fails. [PRODUCT] .agent/bookshop-direction.md.

## Product and how it stands out

- The prototype exposes characters and relationships at selected chapter boundaries. [PRODUCT] apps/web/src/pages/books/[slug]/map.astro; apps/api/src/api.js.

| reference | what it does well | where it falls short for our users | checked on | link |
|---|---|---|---|---|

Competitive differentiation is deferred; no comparison was checked for this decision.

## Goals and success criteria

- Business goal: no commercial target agreed; this decision concerns visual direction.
- User outcome: see A01; reader benefit remains untested.
- Primary metric, baseline today, threshold, date: unset; Q01 concerns design acceptance, not invented conversion targets.
- What must not get worse: see R01 and existing compatibility policy.

## Scope

- **Now:** record the approved Relationship Atlas direction with prominent portraits inside the graph (D03); visual exploration is concluded at this stage.
- **Later:** representative concepts for the entrance, character discovery/detail, and relationship-map workspace remain a proposal (D02). Detailed tokens, components, page designs, and implementation require further approval.
- **Not doing:** see N01.

## Domain glossary

| Term | Meaning | Owned by | Visible to |
|---|---|---|---|
| Old-library atmosphere | Contemporary interface evoking an old library; not a literal interior as navigation | Product owner | Visitors |
| Relationship graph | Chapter-bounded connections between literary characters | Existing product | Readers |

## Key flows

- Current state: a visitor can enter through characters, open a character, and explore a book-scoped map with chapter controls and character details. This is implemented behavior, not an observed reader session. [PRODUCT] apps/web/src/pages/characters.astro; apps/web/src/pages/books/[slug]/map.astro.
- Future state: concept review should make character and graph discovery prominent while retaining book context and chapter boundaries; navigation changes are not yet specified (D02).

## Business rules

| Id | Rule | Applies to | Source | Status | Review by | Required path to change | Owner | Supersedes |
|---|---|---|---|---|---|---|---|---|
| R01 | Preserve server-side reveal boundaries, account/guest progress separation, existing links, language choice, responsive behavior and keyboard access; target WCAG 2.2 | Any subsequent redesign | [PRODUCT] AGENTS.md; BACKWARD_COMPATIBILITY.md | active | Before implementation | Maintainer-approved compatibility change; owner confirms product effects | Maintainer | none |

## Non-goals

| Id | We are not building | Why | Owner | Status | Review by | Required path to change | Source | Supersedes |
|---|---|---|---|---|---|---|---|---|
| N01 | A literal library-interior interface or a book/content-led identity | Owner selected a contemporary interface and character/graph priority | Product owner | active | Concept review | Owner-approved superseding row | [DOCUMENT] Owner record | none |

## Decisions

| Id | Date | Decision | Why | Owner | Status | Review by | Required path to change | Source | Supersedes |
|---|---|---|---|---|---|---|---|---|---|
| D01 | 2026-10-31 | Contemporary old-library identity; characters and graphs first | Owner rejected current visual quality; selected contemporary atmosphere over literal interior in agent-provided alternatives | Product owner | active | Concept review | Owner-approved superseding row | [DOCUMENT] Owner record | none |
| D02 | 2026-10-31 | Review representative visual concepts before changing code | Agent proposal to evaluate direction across discovery and graph use; no new screens authorized here | Product owner, approval pending | proposal | Before implementation | Owner confirms or replaces | [ASSUMPTION] Agent proposal | none |
| D03 | 2026-10-31 | Adopt Relationship Atlas with prominent character portraits inside the graph; make the graph the main visual motif and evoke an old library through typography and color | Owner selected this direction from the brainstorm alternatives, explicitly prioritized portraits in the graph, and confirmed ending the brainstorm at direction approval | Product owner | active | Concept review | Owner-approved superseding row | [DOCUMENT] Owner record, Approved visual direction | none; refines D01 |

## Riskiest assumptions

| Id | Assumption | Importance | Evidence today | If false | Smallest test | Owner | By when | Result |
|---|---|---|---|---|---|---|---|---|
| A01 | The proposed hierarchy helps readers find characters and understand graph controls and reading boundaries [ASSUMPTION] Agent inference from owner intent | high | Owner preference only; dense-graph readability with prominent portraits and portrait consistency remain unverified | Revise hierarchy or visual language | Reader walkthrough of a representative graph on desktop and mobile; observe character identification, relationship reading, and chapter-boundary understanding; treat aesthetic owner sign-off separately | Research owner unassigned | Before claiming reader benefit | untested |

## Kill criteria

No product cancellation criterion is justified by this styling decision. Proposed concept rejection: the owner still sees generic or dated design, or the concept obscures characters, graph controls, or reading boundaries. Criteria await Q01.

## Hypotheses to test

No synthetic walkthrough was performed.

## Open questions

| Id | Question | Blocking | Who can answer | Status |
|---|---|---|---|---|
| Q01 | Within the approved Relationship Atlas direction (D03), which detailed visual treatment and acceptance criteria should guide implementation? | yes, implementation; not this direction brief | Product owner | open; direction selected, details unresolved |

## Definition of Ready addendum (existing)

The owner approved the visual direction (D03), not implementation-ready stories or claims of reader validation. Owner feedback supports the design concern; Problems and Target group lack independent reader evidence. Q01 remains open for detailed styling and acceptance criteria. Existing behavior and compatibility constraints, including chapter-bounded portrait visibility, require verification when designs change. No follow-up skill or implementation was authorized by closing the brainstorm.

## Collection plan

No additional material request is necessary to record this owner-led direction. Reader research is needed before claiming the benefit in A01; its scheduling is deferred.
