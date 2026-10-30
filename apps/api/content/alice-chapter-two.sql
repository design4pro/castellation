-- Source: https://www.gutenberg.org/cache/epub/28885/pg28885-images.html (chapter II).
-- The source is recorded for the paraphrased summaries; no claim of rights verification is made.
INSERT OR IGNORE INTO sources (id, title, author, url, rights_verified, status)
VALUES ('alice-gutenberg-28885', 'Alice''s Adventures in Wonderland', 'Lewis Carroll', 'https://www.gutenberg.org/cache/epub/28885/pg28885-images.html', 0, 'pending');
INSERT OR IGNORE INTO relations (id, book_id, source_id, target_id, volume, chapter, label)
VALUES ('alice-meets-mouse', 'alice', 'alice-character', 'mouse', 1, 2, 'Asks for help');
INSERT OR IGNORE INTO events (id, book_id, volume, chapter, title, description)
VALUES ('alice-pool-of-tears', 'alice', 1, 2, 'The pool of tears', 'Alice finds herself swimming in the pool she made with her own tears.');
INSERT OR IGNORE INTO events (id, book_id, volume, chapter, title, description)
VALUES ('alice-meets-mouse-event', 'alice', 1, 2, 'A meeting in the pool', 'Alice meets a Mouse and asks how to get out of the pool.');
INSERT OR IGNORE INTO content_evidence (entity_type, entity_id, source_id, volume, chapter, excerpt)
VALUES ('relation', 'alice-meets-mouse', 'alice-gutenberg-28885', 1, 2, 'O Mouse, do you know the way out of this pool?');
INSERT OR IGNORE INTO content_evidence (entity_type, entity_id, source_id, volume, chapter, excerpt)
VALUES ('event', 'alice-pool-of-tears', 'alice-gutenberg-28885', 1, 2, 'the pool of tears which she had wept');
INSERT OR IGNORE INTO content_evidence (entity_type, entity_id, source_id, volume, chapter, excerpt)
VALUES ('event', 'alice-meets-mouse-event', 'alice-gutenberg-28885', 1, 2, 'a mouse that had slipped in like herself');
