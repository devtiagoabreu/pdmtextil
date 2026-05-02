📦 BLOCO 1.2: Banco de Dados e Schemas (MVP) 🎯 Objetivo: Criação das tabelas base (usuários, sessões, solicitações, anexos), geração de migrações e seed do banco de dados com usuários iniciais. ⏱️ Tempo estimado: 30 minutos

✅ Arquivos criados/modificados:

src/lib/db/schema/usuarios.ts - Schema da tabela de usuários e sessões do sistema.
src/lib/db/schema/solicitacoes.ts - Schema central do MVP para as solicitações do Comercial.
src/lib/db/schema/anexos.ts - Schema para gerenciar os arquivos das solicitações.
src/lib/db/schema/index.ts - Arquivo de exportação dos schemas.
src/lib/db/seed.ts - Script para popular os usuários de teste.
src/lib/db/migrations/* - Arquivos de migração gerados automaticamente pelo Drizzle Kit.
📝 Instruções para o usuário:

Você pode verificar se as tabelas foram criadas com sucesso usando o painel do Neon DB.
O banco já possui os seguintes usuários configurados (senha para todos é 123456):

comercial@promoda.com
 (COMERCIAL)

tecelagem@promoda.com
 (TECELAGEM)

beneficiamento@promoda.com
 (BENEFICIAMENTO)

admin@promoda.com
 (ADMIN)
🔧 Dependências:

Nenhuma nova dependência adicionada neste bloco.
⚠️ Pontos de atenção:

Ajustei o arquivo drizzle.config.ts criado no Bloco 1.1 para utilizar o parâmetro dialect: "postgresql", alinhado com a versão v0.31+ do Drizzle Kit atual.
As migrações já foram aplicadas no banco de dados e o script de seed já foi executado. O ambiente está 100% pronto para conectarmos as telas e lógica.
✅ Commit pronto:

feat: implementação dos schemas de bd para o mvp e configuração do drizzle orm