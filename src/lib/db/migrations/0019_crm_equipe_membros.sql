CREATE TABLE IF NOT EXISTS crm_equipe_membros (
  id SERIAL PRIMARY KEY,
  equipe_id INTEGER NOT NULL REFERENCES crm_equipes(id) ON DELETE CASCADE,
  representante_id INTEGER NOT NULL REFERENCES representantes(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(equipe_id, representante_id)
);
