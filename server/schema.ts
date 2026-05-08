/** PostgreSQL DDL — keep in sync with client types in postgresDatabase.ts */
export const INIT_SQL = `
  CREATE TABLE IF NOT EXISTS questions (
    id SERIAL PRIMARY KEY,
    question TEXT NOT NULL,
    options JSONB NOT NULL,
    correct TEXT NOT NULL,
    question_set_id TEXT NOT NULL,
    difficulty TEXT,
    category TEXT,
    image_url TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  );

  CREATE INDEX IF NOT EXISTS idx_questions_set_id ON questions(question_set_id);

  DO $$
  BEGIN
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_name = 'questions' AND column_name = 'image_url'
    ) THEN
      ALTER TABLE questions ADD COLUMN image_url TEXT;
    END IF;
  END $$;

  CREATE TABLE IF NOT EXISTS students (
    user_id TEXT PRIMARY KEY,
    total_games INTEGER DEFAULT 0,
    total_waves INTEGER DEFAULT 0,
    total_enemies_killed INTEGER DEFAULT 0,
    total_money_earned INTEGER DEFAULT 0,
    highest_wave INTEGER DEFAULT 0,
    credits INTEGER DEFAULT 0,
    unlocked_towers JSONB DEFAULT '[]',
    encountered_enemies JSONB DEFAULT '[]',
    tower_exp JSONB DEFAULT '{}',
    display_name TEXT DEFAULT '',
    last_played TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  );

  DO $$
  BEGIN
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_name = 'students' AND column_name = 'encountered_enemies'
    ) THEN
      ALTER TABLE students ADD COLUMN encountered_enemies JSONB DEFAULT '[]';
    END IF;
  END $$;

  DO $$
  BEGIN
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_name = 'students' AND column_name = 'tower_exp'
    ) THEN
      ALTER TABLE students ADD COLUMN tower_exp JSONB DEFAULT '{}';
    END IF;
  END $$;

  DO $$
  BEGIN
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_name = 'students' AND column_name = 'display_name'
    ) THEN
      ALTER TABLE students ADD COLUMN display_name TEXT DEFAULT '';
    END IF;
  END $$;

  CREATE TABLE IF NOT EXISTS question_sets (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    name_zh TEXT,
    description TEXT,
    description_zh TEXT,
    created_by TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS settings (
    key TEXT PRIMARY KEY,
    value JSONB NOT NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  );
`;
