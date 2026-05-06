-- Tabela de Fios (Nível 7)
CREATE TABLE IF NOT EXISTS "fios" (
	"id" serial PRIMARY KEY NOT NULL,
	"codigo_completo" varchar(30) NOT NULL,
	"codigo_fio" varchar(10) NOT NULL,
	"nome" varchar(200) NOT NULL,
	"nome_comercial" varchar(200),
	"composicao" varchar(200),
	"titulo" varchar(20),
	"torcao" varchar(20),
	"resistencia" numeric(10,2),
	"alongamento" numeric(5,2),
	"fornecedor" varchar(200),
	"observacoes" text,
	"ativo" boolean DEFAULT true,
	"criado_por" integer REFERENCES "usuarios"("id"),
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "fios_codigo_completo_unique" UNIQUE("codigo_completo"),
	CONSTRAINT "fios_codigo_fio_unique" UNIQUE("codigo_fio")
);

-- Tabela de Cores Sólidas
CREATE TABLE IF NOT EXISTS "cores_solidas" (
	"id" serial PRIMARY KEY NOT NULL,
	"codigo" varchar(6) NOT NULL,
	"nome" varchar(100) NOT NULL,
	"pantone" varchar(20),
	"familia" varchar(50),
	"ativo" boolean DEFAULT true,
	CONSTRAINT "cores_solidas_codigo_unique" UNIQUE("codigo")
);

-- Tabela de Cores de Fundo (para estampados)
CREATE TABLE IF NOT EXISTS "cores_fundo" (
	"id" serial PRIMARY KEY NOT NULL,
	"codigo" varchar(3) NOT NULL,
	"nome" varchar(100) NOT NULL,
	"descricao" text,
	"ativo" boolean DEFAULT true,
	CONSTRAINT "cores_fundo_codigo_unique" UNIQUE("codigo")
);

-- Tabela de Acabamentos
CREATE TABLE IF NOT EXISTS "acabamentos" (
	"id" serial PRIMARY KEY NOT NULL,
	"nome" varchar(100) NOT NULL,
	"descricao" text,
	"categoria" varchar(50),
	"ativo" boolean DEFAULT true
);

-- Tabela de Máquinas
CREATE TABLE IF NOT EXISTS "maquinas" (
	"id" serial PRIMARY KEY NOT NULL,
	"codigo" varchar(30) NOT NULL,
	"nome" varchar(100) NOT NULL,
	"tipo" varchar(50),
	"velocidade_maxima" numeric(10,2),
	"capacidade_carga" numeric(10,2),
	"disponivel" boolean DEFAULT true,
	"ativo" boolean DEFAULT true,
	CONSTRAINT "maquinas_codigo_unique" UNIQUE("codigo")
);

-- Tabela de Operações
CREATE TABLE IF NOT EXISTS "operacoes" (
	"id" serial PRIMARY KEY NOT NULL,
	"codigo" varchar(20) NOT NULL,
	"nome" varchar(100) NOT NULL,
	"tipo" varchar(50),
	"descricao" text,
	"ativo" boolean DEFAULT true,
	CONSTRAINT "operacoes_codigo_unique" UNIQUE("codigo")
);