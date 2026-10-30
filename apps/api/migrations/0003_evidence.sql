CREATE TABLE IF NOT EXISTS content_evidence (
  entity_type TEXT NOT NULL CHECK(entity_type IN ('description','relation','event','portrait')),
  entity_id TEXT NOT NULL,
  source_id TEXT NOT NULL REFERENCES sources(id),
  volume INTEGER NOT NULL,
  chapter INTEGER NOT NULL,
  excerpt TEXT NOT NULL,
  PRIMARY KEY (entity_type, entity_id)
);
