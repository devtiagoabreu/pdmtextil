-- Tabela de menus personalizados do usuário
CREATE TABLE IF NOT EXISTS user_menus (
  id SERIAL PRIMARY KEY,
  usuario_id INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  titulo VARCHAR(100) NOT NULL,
  icone VARCHAR(50),
  ordem INTEGER NOT NULL DEFAULT 0,
  ativo BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Tabela de itens dentro de cada menu
CREATE TABLE IF NOT EXISTS user_menu_itens (
  id SERIAL PRIMARY KEY,
  user_menu_id INTEGER NOT NULL REFERENCES user_menus(id) ON DELETE CASCADE,
  titulo VARCHAR(100) NOT NULL,
  url VARCHAR(255) NOT NULL,
  ordem INTEGER NOT NULL DEFAULT 0,
  ativo BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Adicionar coluna pagina_inicial na tabela usuarios
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS pagina_inicial VARCHAR(255);
