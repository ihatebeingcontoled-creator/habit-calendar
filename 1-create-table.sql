CREATE TABLE IF NOT EXISTS habits (
  date      TEXT PRIMARY KEY,
  pushups   INTEGER DEFAULT 0,
  readPages INTEGER DEFAULT 0,
  nDay      TEXT,
  nRead     TEXT
);
