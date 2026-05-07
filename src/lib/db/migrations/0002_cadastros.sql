-- Migration: Create tables for bases_urdume and estampas
-- Run this on your Neon database

-- Table: bases_urdume (Level 4)
CREATE TABLE IF NOT EXISTS bases_urdume (
  id SERIAL PRIMARY KEY,
  codigo_completo VARCHAR(30) NOT NULL UNIQUE,
  codigo_base VARCHAR(10) NOT NULL UNIQUE,
  nome VARCHAR(200) NOT NULL,
  descricao TEXT,
  composicao_fios JSONB,
  densidade NUMERIC(6,2),
  tratamento_encolagem VARCHAR(100),
  tensao_urdume NUMERIC(6,2),
  largura NUMERIC(6,2),
  observacoes TEXT,
  ativo BOOLEAN DEFAULT true,
  criado_por INTEGER REFERENCES usuarios(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Table: estampas
CREATE TABLE IF NOT EXISTS estampas (
  id SERIAL PRIMARY KEY,
  codigo_desenho VARCHAR(4) NOT NULL,
  variante VARCHAR(2) NOT NULL,
  nome VARCHAR(200) NOT NULL,
  tipo VARCHAR(50),
  imagem_url VARCHAR(500),
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Add columns to cores_solidas if not exists
ALTER TABLE cores_solidas ADD COLUMN IF NOT EXISTS familia VARCHAR(50);
ALTER TABLE cores_solidas ADD COLUMN IF NOT EXISTS ativo BOOLEAN DEFAULT true;

-- Seed some initial data (optional)

-- Insert bases_urdume:
INSERT INTO bases_urdume (codigo_completo, codigo_base, nome, descricao, densidade, ativo) VALUES
('4.UR001.CRU.000001', 'UR001', 'Base Algodão 30/1', 'Base de urdume 100% algodão', '30', true),
('4.UR002.CRU.000001', 'UR002', 'Base Poliester 68', 'Base de urdume polyester', '24', true)
ON CONFLICT (codigo_base) DO NOTHING;

-- Insert cores_solidas:
INSERT INTO cores_solidas (codigo, nome, pantone, familia, ativo) VALUES
('0001A1', 'Azul Marinho', '2955C', 'AZUL', true),
('0002R1', 'Vermelho', '186C', 'VERMELHO', true),
('0003B1', 'Branco', 'WHITE', 'BRANCO', true)
ON CONFLICT (codigo) DO NOTHING;

-- Insert estampas:
INSERT INTO estampas (codigo_desenho, variante, nome, tipo, ativo) VALUES
('5001', '01', 'Floral Botanico', 'FLORAL', true),
('6001', '01', 'Lista Grosso', 'LISTRADO', true),
('7001', '01', 'Poa Pequeno', 'POA', true)
ON CONFLICT (codigo_desenho) DO NOTHING;