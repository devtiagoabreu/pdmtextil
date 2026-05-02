CREATE TABLE "anexos" (
	"id" serial PRIMARY KEY NOT NULL,
	"solicitacao_id" integer NOT NULL,
	"tipo" varchar(20) NOT NULL,
	"titulo" varchar(200) NOT NULL,
	"url" text NOT NULL,
	"metadados" jsonb DEFAULT '{}'::jsonb,
	"nome_arquivo" varchar(255),
	"tamanho" integer,
	"mime_type" varchar(100),
	"criado_por" integer,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "sessions" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"session_token" varchar(255) NOT NULL,
	"expires" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "sessions_session_token_unique" UNIQUE("session_token")
);
--> statement-breakpoint
CREATE TABLE "usuarios" (
	"id" serial PRIMARY KEY NOT NULL,
	"email" varchar(255) NOT NULL,
	"password" varchar(255),
	"name" varchar(255) NOT NULL,
	"role" varchar(50) DEFAULT 'COMERCIAL' NOT NULL,
	"ativo" boolean DEFAULT true,
	"ultimo_acesso" timestamp,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "usuarios_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "solicitacoes" (
	"id" serial PRIMARY KEY NOT NULL,
	"tipo" varchar(30) NOT NULL,
	"status" varchar(30) DEFAULT 'PENDENTE' NOT NULL,
	"solicitante_id" integer NOT NULL,
	"responsavel_id" integer,
	"cliente" varchar(200) NOT NULL,
	"cnpj" varchar(18),
	"projeto" varchar(200),
	"briefing" jsonb NOT NULL,
	"historico_comunicacao" jsonb DEFAULT '[]'::jsonb,
	"observacoes" text,
	"prazo_desejado" timestamp,
	"data_conclusao" timestamp,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "anexos" ADD CONSTRAINT "anexos_solicitacao_id_solicitacoes_id_fk" FOREIGN KEY ("solicitacao_id") REFERENCES "public"."solicitacoes"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "anexos" ADD CONSTRAINT "anexos_criado_por_usuarios_id_fk" FOREIGN KEY ("criado_por") REFERENCES "public"."usuarios"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_user_id_usuarios_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."usuarios"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "solicitacoes" ADD CONSTRAINT "solicitacoes_solicitante_id_usuarios_id_fk" FOREIGN KEY ("solicitante_id") REFERENCES "public"."usuarios"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "solicitacoes" ADD CONSTRAINT "solicitacoes_responsavel_id_usuarios_id_fk" FOREIGN KEY ("responsavel_id") REFERENCES "public"."usuarios"("id") ON DELETE no action ON UPDATE no action;