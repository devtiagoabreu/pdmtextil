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


📦 BLOCO 1.3: Autenticação NextAuth e Layout Base 🎯 Objetivo: Inicializar componentes de interface essenciais via shadcn/ui e construir o provedor e a tela de login do NextAuth. ⏱️ Tempo estimado: 30 minutos

✅ Arquivos criados/modificados:

src/components/ui/* - Arquivos dos componentes UI instalados (button, input, label, card, tabs, select, dropdown-menu, popover, dialog, sonner).
src/components/providers.tsx - Componente Provider para injetar a sessão do NextAuth em toda a aplicação.
src/app/login/page.tsx - Nova tela de login seguindo o layout do projeto, conectada à função signIn do NextAuth (Credentials).
src/app/layout.tsx - RootLayout modificado para envolver os children com o <Providers> e também com o <Toaster> (do Sonner, para notificações).
components.json - Configurações geradas pela inicialização da CLI do shadcn.
📝 Instruções para o usuário:

A tela de login base agora está acessível. Se você estiver rodando o servidor (npm run dev), você pode tentar fazer login com comercial@promoda.com e a senha 123456.
O componente de notificação mudou de toast para sonner na versão mais recente do shadcn/ui.
🔧 Dependências:

Componentes shadcn foram injetados no código fonte (não são libs via npm, mas sim código em src/components/ui).
⚠️ Pontos de atenção:

O componente genérico form do shadcn não apareceu na lista final instalada. Eu criei a página de login usando um <form> nativo em conjunto com <Input> e <Label>, que atende perfeitamente à demanda. Verificaremos a instalação do <Form> do shadcn (usado com react-hook-form) antes do próximo bloco.
✅ Commit pronto:

feat: setup do layout base, provedores de sessão e tela de login NextAuth