-- Summaries and relationships are limited to Stave One of https://www.gutenberg.org/files/46/46-h/46-h.htm.
-- This source record does not assert rights verification for automated republication.
INSERT OR IGNORE INTO sources (id, title, author, url, rights_verified, status)
VALUES ('dickens-carol-gutenberg-46', 'A Christmas Carol', 'Charles Dickens', 'https://www.gutenberg.org/files/46/46-h/46-h.htm', 0, 'pending');
INSERT OR IGNORE INTO books (id, slug, title, author, published)
VALUES ('christmas-carol', 'a-christmas-carol', 'A Christmas Carol', 'Charles Dickens', 0);
INSERT OR IGNORE INTO chapters (book_id, volume, chapter, title)
VALUES ('christmas-carol', 1, 1, 'Marley''s Ghost');
INSERT OR IGNORE INTO characters (id, book_id, slug, name, volume, chapter) VALUES
('carol-scrooge', 'christmas-carol', 'ebenezer-scrooge', 'Ebenezer Scrooge', 1, 1),
('carol-marley', 'christmas-carol', 'jacob-marley', 'Jacob Marley', 1, 1),
('carol-nephew', 'christmas-carol', 'scrooges-nephew', 'Scrooge''s nephew', 1, 1);
INSERT OR IGNORE INTO descriptions (id, character_id, volume, chapter, text) VALUES
('carol-scrooge-1', 'carol-scrooge', 1, 1, 'A hard-hearted businessman who dismisses Christmas cheer.'),
('carol-marley-1', 'carol-marley', 1, 1, 'Scrooge''s late business partner, who returns as a ghost.'),
('carol-nephew-1', 'carol-nephew', 1, 1, 'Scrooge''s cheerful nephew, who invites his uncle to Christmas dinner.');
INSERT OR IGNORE INTO relations (id, book_id, source_id, target_id, volume, chapter, label) VALUES
('carol-scrooge-marley', 'christmas-carol', 'carol-scrooge', 'carol-marley', 1, 1, 'Was partners with'),
('carol-nephew-scrooge', 'christmas-carol', 'carol-nephew', 'carol-scrooge', 1, 1, 'Invites to dinner');
INSERT OR IGNORE INTO events (id, book_id, volume, chapter, title, description) VALUES
('carol-nephew-visit', 'christmas-carol', 1, 1, 'A Christmas invitation', 'Scrooge''s nephew visits his office and invites him to Christmas dinner.'),
('carol-marley-visit', 'christmas-carol', 1, 1, 'Marley''s warning', 'The ghost of Scrooge''s former partner visits him with a warning.');
INSERT OR IGNORE INTO content_evidence (entity_type, entity_id, source_id, volume, chapter, excerpt) VALUES
('description', 'carol-scrooge-1', 'dickens-carol-gutenberg-46', 1, 1, 'a squeezing, wrenching, grasping, scraping, clutching, covetous, old sinner!'),
('description', 'carol-marley-1', 'dickens-carol-gutenberg-46', 1, 1, 'Scrooge and he were partners'),
('description', 'carol-nephew-1', 'dickens-carol-gutenberg-46', 1, 1, 'Will you come and dine with us to-morrow?'),
('relation', 'carol-scrooge-marley', 'dickens-carol-gutenberg-46', 1, 1, 'Scrooge and he were partners'),
('relation', 'carol-nephew-scrooge', 'dickens-carol-gutenberg-46', 1, 1, 'Will you come and dine with us to-morrow?'),
('event', 'carol-nephew-visit', 'dickens-carol-gutenberg-46', 1, 1, 'Will you come and dine with us to-morrow?'),
('event', 'carol-marley-visit', 'dickens-carol-gutenberg-46', 1, 1, 'I am here to-night to warn you');
UPDATE books SET published = 1 WHERE id = 'christmas-carol' AND withdrawn = 0;
