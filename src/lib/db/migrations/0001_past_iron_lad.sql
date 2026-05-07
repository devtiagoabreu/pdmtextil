CREATE TABLE "acabamentos" (
	"id" serial PRIMARY KEY NOT NULL,
	"nome" varchar(100) NOT NULL,
	"descricao" text,
	"categoria" varchar(50),
	"ativo" boolean DEFAULT true,
	"id_integracao" varchar(100)
);
--> statement-breakpoint
CREATE TABLE "bases_urdume" (
	"id" serial PRIMARY KEY NOT NULL,
	"codigo_completo" varchar(30) NOT NULL,
	"codigo_base" varchar(10) NOT NULL,
	"nome" varchar(200) NOT NULL,
	"descricao" text,
	"composicao_fios" jsonb,
	"densidade" numeric(6, 2),
	"tratamento_encolagem" varchar(100),
	"tensao_urdume" numeric(6, 2),
	"largura" numeric(6, 2),
	"observacoes" text,
	"ativo" boolean DEFAULT true,
	"id_integracao" varchar(100),
	"criado_por" integer,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "bases_urdume_codigo_completo_unique" UNIQUE("codigo_completo"),
	CONSTRAINT "bases_urdume_codigo_base_unique" UNIQUE("codigo_base")
);
--> statement-breakpoint
CREATE TABLE "clientes" (
	"id" serial PRIMARY KEY NOT NULL,
	"nome" varchar(200) NOT NULL,
	"cnpj" varchar(18) NOT NULL,
	"razao_social" varchar(250),
	"email" varchar(150),
	"telefone" varchar(20),
	"contato" varchar(100),
	"endereco" varchar(300),
	"cidade" varchar(100),
	"uf" varchar(2),
	"ativo" boolean DEFAULT true,
	"id_integracao" varchar(100),
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "clientes_cnpj_unique" UNIQUE("cnpj")
);
--> statement-breakpoint
CREATE TABLE "cores_fundo" (
	"id" serial PRIMARY KEY NOT NULL,
	"codigo" varchar(3) NOT NULL,
	"nome" varchar(100) NOT NULL,
	"descricao" text,
	"ativo" boolean DEFAULT true,
	"id_integracao" varchar(100),
	CONSTRAINT "cores_fundo_codigo_unique" UNIQUE("codigo")
);
--> statement-breakpoint
CREATE TABLE "cores_solidas" (
	"id" serial PRIMARY KEY NOT NULL,
	"codigo" varchar(6) NOT NULL,
	"nome" varchar(100) NOT NULL,
	"pantone" varchar(20),
	"familia" varchar(50),
	"ativo" boolean DEFAULT true,
	"id_integracao" varchar(100),
	CONSTRAINT "cores_solidas_codigo_unique" UNIQUE("codigo")
);
--> statement-breakpoint
CREATE TABLE "estampas" (
	"id" serial PRIMARY KEY NOT NULL,
	"codigo_desenho" varchar(4) NOT NULL,
	"variante" varchar(2) NOT NULL,
	"nome" varchar(200) NOT NULL,
	"tipo" varchar(50),
	"imagem_url" varchar(500),
	"ativo" boolean DEFAULT true,
	"id_integracao" varchar(100),
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "fios" (
	"id" serial PRIMARY KEY NOT NULL,
	"codigo_completo" varchar(30) NOT NULL,
	"codigo_fio" varchar(10) NOT NULL,
	"nome" varchar(200) NOT NULL,
	"nome_comercial" varchar(200),
	"composicao" varchar(200),
	"titulo" varchar(20),
	"torcao" varchar(20),
	"resistencia" numeric(10, 2),
	"alongamento" numeric(5, 2),
	"observacoes" text,
	"ativo" boolean DEFAULT true,
	"id_integracao" varchar(100),
	"criado_por" integer,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "fios_codigo_completo_unique" UNIQUE("codigo_completo"),
	CONSTRAINT "fios_codigo_fio_unique" UNIQUE("codigo_fio")
);
--> statement-breakpoint
CREATE TABLE "fios_fornecedores" (
	"id" serial PRIMARY KEY NOT NULL,
	"fio_id" integer NOT NULL,
	"fornecedor_id" integer NOT NULL,
	"codigo_fornecedor" varchar(50),
	"observacoes" text,
	"id_integracao" varchar(100),
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "fornecedores" (
	"id" serial PRIMARY KEY NOT NULL,
	"nome" varchar(200) NOT NULL,
	"cnpj" varchar(18),
	"razao_social" varchar(250),
	"email" varchar(150),
	"telefone" varchar(20),
	"contato" varchar(100),
	"endereco" varchar(300),
	"cidade" varchar(100),
	"uf" varchar(2),
	"ativo" boolean DEFAULT true,
	"id_integracao" varchar(100),
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "maquinas" (
	"id" serial PRIMARY KEY NOT NULL,
	"codigo" varchar(30) NOT NULL,
	"nome" varchar(100) NOT NULL,
	"tipo" varchar(50),
	"velocidade_maxima" numeric(10, 2),
	"capacidade_carga" numeric(10, 2),
	"disponivel" boolean DEFAULT true,
	"ativo" boolean DEFAULT true,
	"id_integracao" varchar(100),
	CONSTRAINT "maquinas_codigo_unique" UNIQUE("codigo")
);
--> statement-breakpoint
CREATE TABLE "operacoes" (
	"id" serial PRIMARY KEY NOT NULL,
	"codigo" varchar(20) NOT NULL,
	"nome" varchar(100) NOT NULL,
	"tipo" varchar(50),
	"descricao" text,
	"ativo" boolean DEFAULT true,
	"id_integracao" varchar(100),
	CONSTRAINT "operacoes_codigo_unique" UNIQUE("codigo")
);
--> statement-breakpoint
ALTER TABLE "anexos" ADD COLUMN "id_integracao" varchar(100);--> statement-breakpoint
ALTER TABLE "usuarios" ADD COLUMN "id_integracao" varchar(100);--> statement-breakpoint
ALTER TABLE "solicitacoes" ADD COLUMN "id_integracao" varchar(100);--> statement-breakpoint
ALTER TABLE "bases_urdume" ADD CONSTRAINT "bases_urdume_criado_por_usuarios_id_fk" FOREIGN KEY ("criado_por") REFERENCES "public"."usuarios"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fios" ADD CONSTRAINT "fios_criado_por_usuarios_id_fk" FOREIGN KEY ("criado_por") REFERENCES "public"."usuarios"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fios_fornecedores" ADD CONSTRAINT "fios_fornecedores_fio_id_fios_id_fk" FOREIGN KEY ("fio_id") REFERENCES "public"."fios"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fios_fornecedores" ADD CONSTRAINT "fios_fornecedores_fornecedor_id_fornecedores_id_fk" FOREIGN KEY ("fornecedor_id") REFERENCES "public"."fornecedores"("id") ON DELETE cascade ON UPDATE no action;