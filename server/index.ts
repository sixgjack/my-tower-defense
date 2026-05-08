/**
 * REST API for Tower Defense app data (PostgreSQL via node-pg).
 * Never expose DATABASE_URL to the browser — only this process connects to Postgres.
 */
/* eslint-disable @typescript-eslint/no-explicit-any -- Express handlers use loose JSON bodies */
import 'dotenv/config';
import cors from 'cors';
import express from 'express';
import pg from 'pg';
import { INIT_SQL } from './schema.js';

const { Pool } = pg;

function createPool(): pg.Pool {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    console.error('FATAL: DATABASE_URL is not set. Example: postgresql://user:pass@host:5432/tower_defense');
    process.exit(1);
  }

  const ssl =
    process.env.PGSSLMODE === 'require' || process.env.DATABASE_SSL === 'true'
      ? {
          rejectUnauthorized: process.env.PG_SSL_REJECT_UNAUTHORIZED !== 'false',
        }
      : undefined;

  return new Pool({
    connectionString,
    ssl,
    max: Number(process.env.PG_POOL_MAX || 20),
  });
}

const pool = createPool();

async function initSchema(): Promise<void> {
  await pool.query(INIT_SQL);
}

function parseCorsOrigin(): boolean | string | RegExp | (string | RegExp)[] {
  const raw = process.env.CORS_ORIGIN;
  if (!raw || raw === '*') return true;
  const parts = raw.split(',').map((s) => s.trim()).filter(Boolean);
  return parts.length === 1 ? parts[0]! : parts;
}

const app = express();
app.use(express.json({ limit: '32mb' }));
app.use(
  cors({
    origin: parseCorsOrigin(),
    credentials: false,
  }),
);

app.get('/api/health', (_req, res) => {
  res.json({ ok: true });
});

function rowQuestion(row: any) {
  return {
    id: row.id,
    question: row.question,
    options: typeof row.options === 'string' ? JSON.parse(row.options) : row.options,
    correct: row.correct,
    questionSetId: row.question_set_id,
    difficulty: row.difficulty,
    category: row.category,
    imageUrl: row.image_url,
    createdAt: row.created_at,
  };
}

function rowStudent(row: any) {
  return {
    userId: row.user_id,
    displayName: row.display_name ?? '',
    totalGames: row.total_games ?? 0,
    totalWaves: row.total_waves ?? 0,
    totalEnemiesKilled: row.total_enemies_killed ?? 0,
    totalMoneyEarned: row.total_money_earned ?? 0,
    highestWave: row.highest_wave ?? 0,
    credits: row.credits ?? 0,
    unlockedTowers:
      typeof row.unlocked_towers === 'string'
        ? JSON.parse(row.unlocked_towers)
        : row.unlocked_towers || [],
    encounteredEnemies:
      typeof row.encountered_enemies === 'string'
        ? JSON.parse(row.encountered_enemies)
        : row.encountered_enemies || [],
    towerExp:
      typeof row.tower_exp === 'string'
        ? JSON.parse(row.tower_exp)
        : row.tower_exp || {},
    lastPlayed: row.last_played,
  };
}

// ----- Questions -----
app.post('/api/questions', async (req, res) => {
  try {
    const q = req.body;
    const result = await pool.query(
      `INSERT INTO questions (question, options, correct, question_set_id, difficulty, category, image_url)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING id`,
      [
        q.question,
        JSON.stringify(q.options),
        q.correct,
        q.questionSetId,
        q.difficulty ?? null,
        q.category ?? null,
        q.imageUrl ?? null,
      ],
    );
    res.json({ success: true, data: result.rows[0]?.id });
  } catch (e: any) {
    res.status(400).json({ success: false, error: e.message });
  }
});

// Static paths must be registered before /api/questions/:id
app.get('/api/questions', async (_req, res) => {
  try {
    const result = await pool.query('SELECT * FROM questions ORDER BY created_at DESC');
    res.json({
      success: true,
      data: result.rows.map(rowQuestion),
    });
  } catch (e: any) {
    res.status(400).json({ success: false, error: e.message });
  }
});

app.get('/api/questions/by-set/:questionSetId', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM questions WHERE question_set_id = $1 ORDER BY created_at DESC',
      [req.params.questionSetId],
    );
    res.json({ success: true, data: result.rows.map(rowQuestion) });
  } catch (e: any) {
    res.status(400).json({ success: false, error: e.message });
  }
});

app.get('/api/questions/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    const result = await pool.query('SELECT * FROM questions WHERE id = $1', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Question not found' });
    }
    res.json({ success: true, data: rowQuestion(result.rows[0]) });
  } catch (e: any) {
    res.status(400).json({ success: false, error: e.message });
  }
});

app.patch('/api/questions/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    const updates = req.body as Record<string, unknown>;
    const setClauses: string[] = [];
    const values: unknown[] = [];
    let paramIndex = 1;

    const map: [string, string][] = [
      ['question', 'question'],
      ['options', 'options'],
      ['correct', 'correct'],
      ['questionSetId', 'question_set_id'],
      ['difficulty', 'difficulty'],
      ['category', 'category'],
      ['imageUrl', 'image_url'],
    ];
    for (const [jsonKey, col] of map) {
      if (updates[jsonKey] !== undefined) {
        const v = updates[jsonKey];
        setClauses.push(`${col} = $${paramIndex++}`);
        values.push(jsonKey === 'options' ? JSON.stringify(v) : v);
      }
    }
    if (setClauses.length === 0) {
      return res.json({ success: true });
    }
    values.push(id);
    await pool.query(`UPDATE questions SET ${setClauses.join(', ')} WHERE id = $${paramIndex}`, values);
    res.json({ success: true });
  } catch (e: any) {
    res.status(400).json({ success: false, error: e.message });
  }
});

app.delete('/api/questions/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    await pool.query('DELETE FROM questions WHERE id = $1', [id]);
    res.json({ success: true });
  } catch (e: any) {
    res.status(400).json({ success: false, error: e.message });
  }
});

app.post('/api/questions/bulk-import', async (req, res) => {
  const questions = req.body?.questions as any[];
  if (!Array.isArray(questions)) {
    return res.status(400).json({ success: false, error: 'Expected { questions: [...] }' });
  }

  let success = 0;
  let failed = 0;
  const errors: string[] = [];
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    for (let i = 0; i < questions.length; i++) {
      const question = questions[i];
      if (!question.question || !question.options || !question.correct || !question.questionSetId) {
        failed++;
        errors.push(`Invalid question at index ${i}: Missing required fields`);
        continue;
      }
      if (!question.options.includes(question.correct)) {
        failed++;
        errors.push(
          `Invalid question at index ${i}: Correct answer "${question.correct}" not in options`,
        );
        continue;
      }
      try {
        await client.query(
          `INSERT INTO questions (question, options, correct, question_set_id, difficulty, category, image_url)
           VALUES ($1, $2, $3, $4, $5, $6, $7)`,
          [
            question.question,
            JSON.stringify(question.options),
            question.correct,
            question.questionSetId,
            question.difficulty || null,
            question.category || null,
            question.imageUrl || null,
          ],
        );
        success++;
      } catch (err: any) {
        failed++;
        errors.push(`Failed at index ${i}: ${err.message}`);
      }
    }
    await client.query('COMMIT');
  } catch (e: any) {
    await client.query('ROLLBACK');
    return res.status(400).json({
      success,
      failed: failed + (questions.length - success - failed),
      errors: [...errors, e.message],
    });
  } finally {
    client.release();
  }
  res.json({ success, failed, errors });
});

// ----- Students (static paths before /api/students/:userId) -----
app.get('/api/students/leaderboard/top', async (_req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM students ORDER BY highest_wave DESC, total_enemies_killed DESC LIMIT 50',
    );
    res.json({ success: true, data: result.rows.map(rowStudent) });
  } catch (e: any) {
    res.status(400).json({ success: false, error: e.message });
  }
});

app.get('/api/students/:userId', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM students WHERE user_id = $1', [
      req.params.userId,
    ]);
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Student not found' });
    }
    res.json({ success: true, data: rowStudent(result.rows[0]) });
  } catch (e: any) {
    res.status(400).json({ success: false, error: e.message });
  }
});

app.post('/api/students', async (req, res) => {
  try {
    const { userId, initialData = {} } = req.body;
    if (!userId) {
      return res.status(400).json({ success: false, error: 'userId required' });
    }
    const d = initialData as any;
    await pool.query(
      `INSERT INTO students (
        user_id, total_games, total_waves, total_enemies_killed,
        total_money_earned, highest_wave, credits, unlocked_towers, encountered_enemies, tower_exp, display_name
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      ON CONFLICT (user_id) DO NOTHING`,
      [
        userId,
        d.totalGames ?? 0,
        d.totalWaves ?? 0,
        d.totalEnemiesKilled ?? 0,
        d.totalMoneyEarned ?? 0,
        d.highestWave ?? 0,
        d.credits ?? 0,
        JSON.stringify(d.unlockedTowers || []),
        JSON.stringify(d.encounteredEnemies || []),
        JSON.stringify(d.towerExp || {}),
        d.displayName ?? '',
      ],
    );
    res.json({ success: true });
  } catch (e: any) {
    res.status(400).json({ success: false, error: e.message });
  }
});

app.patch('/api/students/:userId', async (req, res) => {
  try {
    const userId = req.params.userId;
    const { increment, ...regularUpdates } = req.body as any;

    if (increment) {
      const inc = increment;
      const incrementClauses: string[] = [];
      const values: unknown[] = [];
      let paramIndex = 1;

      if (inc.totalGames) {
        incrementClauses.push(`total_games = total_games + $${paramIndex++}`);
        values.push(inc.totalGames);
      }
      if (inc.totalWaves) {
        incrementClauses.push(`total_waves = total_waves + $${paramIndex++}`);
        values.push(inc.totalWaves);
      }
      if (inc.totalEnemiesKilled) {
        incrementClauses.push(`total_enemies_killed = total_enemies_killed + $${paramIndex++}`);
        values.push(inc.totalEnemiesKilled);
      }
      if (inc.totalMoneyEarned) {
        incrementClauses.push(`total_money_earned = total_money_earned + $${paramIndex++}`);
        values.push(inc.totalMoneyEarned);
      }
      if (inc.credits) {
        incrementClauses.push(`credits = credits + $${paramIndex++}`);
        values.push(inc.credits);
      }
      if (inc.highestWave) {
        incrementClauses.push(`highest_wave = GREATEST(highest_wave, $${paramIndex++})`);
        values.push(inc.highestWave);
      }

      if (incrementClauses.length > 0) {
        values.push(userId);
        await pool.query(
          `UPDATE students SET ${incrementClauses.join(', ')}, last_played = CURRENT_TIMESTAMP WHERE user_id = $${paramIndex}`,
          values,
        );
      }
    }

    if (Object.keys(regularUpdates).length > 0) {
      const setClauses: string[] = [];
      const values: unknown[] = [];
      let paramIndex = 1;

      if (regularUpdates.totalGames !== undefined) {
        setClauses.push(`total_games = $${paramIndex++}`);
        values.push(regularUpdates.totalGames);
      }
      if (regularUpdates.totalWaves !== undefined) {
        setClauses.push(`total_waves = $${paramIndex++}`);
        values.push(regularUpdates.totalWaves);
      }
      if (regularUpdates.totalEnemiesKilled !== undefined) {
        setClauses.push(`total_enemies_killed = $${paramIndex++}`);
        values.push(regularUpdates.totalEnemiesKilled);
      }
      if (regularUpdates.totalMoneyEarned !== undefined) {
        setClauses.push(`total_money_earned = $${paramIndex++}`);
        values.push(regularUpdates.totalMoneyEarned);
      }
      if (regularUpdates.highestWave !== undefined) {
        setClauses.push(`highest_wave = $${paramIndex++}`);
        values.push(regularUpdates.highestWave);
      }
      if (regularUpdates.credits !== undefined) {
        setClauses.push(`credits = $${paramIndex++}`);
        values.push(regularUpdates.credits);
      }
      if (regularUpdates.unlockedTowers !== undefined) {
        setClauses.push(`unlocked_towers = $${paramIndex++}`);
        values.push(JSON.stringify(regularUpdates.unlockedTowers));
      }
      if (regularUpdates.encounteredEnemies !== undefined) {
        setClauses.push(`encountered_enemies = $${paramIndex++}`);
        values.push(JSON.stringify(regularUpdates.encounteredEnemies));
      }
      if (regularUpdates.displayName !== undefined) {
        setClauses.push(`display_name = $${paramIndex++}`);
        values.push(regularUpdates.displayName);
      }
      if (regularUpdates.towerExp !== undefined) {
        setClauses.push(`tower_exp = $${paramIndex++}`);
        values.push(JSON.stringify(regularUpdates.towerExp));
      }

      if (setClauses.length > 0) {
        setClauses.push('last_played = CURRENT_TIMESTAMP');
        values.push(userId);
        await pool.query(
          `UPDATE students SET ${setClauses.join(', ')} WHERE user_id = $${paramIndex}`,
          values,
        );
      }
    }

    res.json({ success: true });
  } catch (e: any) {
    res.status(400).json({ success: false, error: e.message });
  }
});

// ----- Question sets -----
function rowQuestionSet(row: any) {
  return {
    id: row.id,
    name: row.name,
    nameZh: row.name_zh,
    description: row.description,
    descriptionZh: row.description_zh,
    createdBy: row.created_by,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

app.post('/api/question-sets', async (req, res) => {
  try {
    const q = req.body;
    const result = await pool.query(
      `INSERT INTO question_sets (name, name_zh, description, description_zh, created_by)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id`,
      [q.name, q.nameZh ?? null, q.description ?? null, q.descriptionZh ?? null, q.createdBy ?? null],
    );
    res.json({ success: true, data: result.rows[0]?.id });
  } catch (e: any) {
    res.status(400).json({ success: false, error: e.message });
  }
});

app.get('/api/question-sets', async (_req, res) => {
  try {
    const result = await pool.query('SELECT * FROM question_sets ORDER BY created_at DESC');
    res.json({ success: true, data: result.rows.map(rowQuestionSet) });
  } catch (e: any) {
    res.status(400).json({ success: false, error: e.message });
  }
});

app.patch('/api/question-sets/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    const updates = req.body as Record<string, unknown>;
    const setClauses: string[] = [];
    const values: unknown[] = [];
    let paramIndex = 1;

    const fields: [string, string][] = [
      ['name', 'name'],
      ['nameZh', 'name_zh'],
      ['description', 'description'],
      ['descriptionZh', 'description_zh'],
    ];
    for (const [jsonKey, col] of fields) {
      if (updates[jsonKey] !== undefined) {
        setClauses.push(`${col} = $${paramIndex++}`);
        values.push(updates[jsonKey]);
      }
    }
    if (setClauses.length === 0) {
      return res.json({ success: true });
    }
    setClauses.push('updated_at = CURRENT_TIMESTAMP');
    values.push(id);
    await pool.query(
      `UPDATE question_sets SET ${setClauses.join(', ')} WHERE id = $${paramIndex}`,
      values,
    );
    res.json({ success: true });
  } catch (e: any) {
    res.status(400).json({ success: false, error: e.message });
  }
});

app.delete('/api/question-sets/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    await pool.query('DELETE FROM question_sets WHERE id = $1', [id]);
    res.json({ success: true });
  } catch (e: any) {
    res.status(400).json({ success: false, error: e.message });
  }
});

// ----- Backup -----
app.get('/api/backup/export', async (_req, res) => {
  try {
    const [questions, students, questionSets] = await Promise.all([
      pool.query('SELECT * FROM questions ORDER BY created_at DESC'),
      pool.query('SELECT * FROM students'),
      pool.query('SELECT * FROM question_sets ORDER BY created_at DESC'),
    ]);

    const studentRows = students.rows.map((row: any) => ({
      userId: row.user_id,
      displayName: row.display_name ?? '',
      totalGames: row.total_games,
      totalWaves: row.total_waves,
      totalEnemiesKilled: row.total_enemies_killed,
      totalMoneyEarned: row.total_money_earned,
      highestWave: row.highest_wave,
      credits: row.credits,
      unlockedTowers:
        typeof row.unlocked_towers === 'string'
          ? JSON.parse(row.unlocked_towers)
          : row.unlocked_towers,
      encounteredEnemies:
        typeof row.encountered_enemies === 'string'
          ? JSON.parse(row.encountered_enemies)
          : row.encountered_enemies || [],
      towerExp:
        typeof row.tower_exp === 'string'
          ? JSON.parse(row.tower_exp)
          : row.tower_exp || {},
      lastPlayed: row.last_played,
    }));

    res.json({
      success: true,
      data: {
        questions: questions.rows.map(rowQuestion),
        students: studentRows,
        questionSets: questionSets.rows.map(rowQuestionSet),
        exportDate: new Date().toISOString(),
      },
    });
  } catch (e: any) {
    res.status(400).json({ success: false, error: e.message });
  }
});

app.post('/api/backup/import', async (req, res) => {
  const data = req.body?.data ?? req.body;
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query('TRUNCATE TABLE questions, students, question_sets RESTART IDENTITY CASCADE');

    if (data.questions && Array.isArray(data.questions)) {
      for (const question of data.questions) {
        const opts =
          typeof question.options === 'string' ? question.options : JSON.stringify(question.options);
        if (question.id != null && question.id !== '') {
          await client.query(
            `INSERT INTO questions (id, question, options, correct, question_set_id, difficulty, category, image_url, created_at)
             VALUES ($1, $2, $3::jsonb, $4, $5, $6, $7, $8, COALESCE($9::timestamp, CURRENT_TIMESTAMP))`,
            [
              question.id,
              question.question,
              opts,
              question.correct,
              question.questionSetId,
              question.difficulty ?? null,
              question.category ?? null,
              question.imageUrl ?? null,
              question.createdAt ?? null,
            ],
          );
        } else {
          await client.query(
            `INSERT INTO questions (question, options, correct, question_set_id, difficulty, category, image_url, created_at)
             VALUES ($1, $2::jsonb, $3, $4, $5, $6, $7, COALESCE($8::timestamp, CURRENT_TIMESTAMP))`,
            [
              question.question,
              opts,
              question.correct,
              question.questionSetId,
              question.difficulty ?? null,
              question.category ?? null,
              question.imageUrl ?? null,
              question.createdAt ?? null,
            ],
          );
        }
      }
      await client.query(
        `SELECT setval(
          pg_get_serial_sequence('questions','id'),
          COALESCE((SELECT MAX(id) FROM questions), 1)
        )`,
      );
    }

    if (data.students && Array.isArray(data.students)) {
      for (const student of data.students) {
        await client.query(
          `INSERT INTO students (
            user_id, total_games, total_waves, total_enemies_killed,
            total_money_earned, highest_wave, credits, unlocked_towers, encountered_enemies, tower_exp, display_name, last_played
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8::jsonb, $9::jsonb, $10::jsonb, $11, COALESCE($12::timestamp, CURRENT_TIMESTAMP))`,
          [
            student.userId,
            student.totalGames ?? 0,
            student.totalWaves ?? 0,
            student.totalEnemiesKilled ?? 0,
            student.totalMoneyEarned ?? 0,
            student.highestWave ?? 0,
            student.credits ?? 0,
            JSON.stringify(student.unlockedTowers || []),
            JSON.stringify(student.encounteredEnemies || []),
            JSON.stringify(student.towerExp || {}),
            student.displayName ?? '',
            student.lastPlayed ?? null,
          ],
        );
      }
    }

    if (data.questionSets && Array.isArray(data.questionSets)) {
      for (const set of data.questionSets) {
        if (set.id != null && set.id !== '') {
          await client.query(
            `INSERT INTO question_sets (id, name, name_zh, description, description_zh, created_by, created_at, updated_at)
             VALUES ($1, $2, $3, $4, $5, $6, COALESCE($7::timestamp, CURRENT_TIMESTAMP), COALESCE($8::timestamp, CURRENT_TIMESTAMP))`,
            [
              set.id,
              set.name,
              set.nameZh ?? null,
              set.description ?? null,
              set.descriptionZh ?? null,
              set.createdBy ?? null,
              set.createdAt ?? null,
              set.updatedAt ?? null,
            ],
          );
        } else {
          await client.query(
            `INSERT INTO question_sets (name, name_zh, description, description_zh, created_by, created_at, updated_at)
             VALUES ($1, $2, $3, $4, $5, COALESCE($6::timestamp, CURRENT_TIMESTAMP), COALESCE($7::timestamp, CURRENT_TIMESTAMP))`,
            [
              set.name,
              set.nameZh ?? null,
              set.description ?? null,
              set.descriptionZh ?? null,
              set.createdBy ?? null,
              set.createdAt ?? null,
              set.updatedAt ?? null,
            ],
          );
        }
      }
      await client.query(
        `SELECT setval(
          pg_get_serial_sequence('question_sets','id'),
          COALESCE((SELECT MAX(id) FROM question_sets), 1)
        )`,
      );
    }

    await client.query('COMMIT');
    res.json({ success: true });
  } catch (e: any) {
    await client.query('ROLLBACK');
    res.status(400).json({ success: false, error: e.message });
  } finally {
    client.release();
  }
});

const port = Number(process.env.API_PORT || 3001);
const host = process.env.API_HOST || '0.0.0.0';

async function main() {
  await initSchema();
  app.listen(port, host, () => {
    console.log(`Tower Defense API listening on http://${host}:${port}`);
    console.log(`PostgreSQL pool ready (DATABASE_URL host hidden)`);
  });
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
