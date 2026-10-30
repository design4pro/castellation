CREATE TABLE IF NOT EXISTS sources (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  author TEXT NOT NULL,
  url TEXT NOT NULL UNIQUE,
  rights_verified INTEGER NOT NULL DEFAULT 0 CHECK(rights_verified IN (0,1)),
  status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','queued','processing','processed','failed')),
  last_error TEXT
);
