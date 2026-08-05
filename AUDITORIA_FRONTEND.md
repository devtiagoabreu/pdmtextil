# Auditoria Frontend — Checklist de Correções

> **Retomar esta sessão:**
> ```
> opencode --session ses_032d29217ffeGpbhWIS6XXw4cf
> ```
> (ou `opencode --continue` na mesma pasta do repositório)

Regra de trabalho: cada item corrigido = **commit + push** separado, para acompanhar se o sistema quebra.

---

## 1. Strings em inglês → pt-BR

- [x] `src/components/ui/dialog.tsx` — sr-only "Close" e botão "Close" → "Fechar" `210fb5ad`
- [x] `src/components/layout/mobile-bottom-nav.tsx` — label "Home" → "Início" `210fb5ad`
- [x] `src/app/(dashboard)/admin/whatsapp-monitor/page.tsx` — STEP_LABELS ("Auth", "Extract"...) → pt-BR `210fb5ad`
- [x] `src/app/(dashboard)/admin/configuracoes/empresa/page.tsx` — `alt="Preview"` → "Pré-visualização" `210fb5ad`

## 2. Acessibilidade — header e dropdowns

- [x] `header.tsx` — aria-label nos botões só-ícone (hamburger, busca mobile, sino, menu do perfil, chat) `4eede119`
- [x] `header.tsx` — `aria-expanded`/`aria-haspopup` no sino de notificações e no menu do perfil `4eede119`
- [x] `header.tsx` — fechar dropdowns com tecla `Escape` `4eede119`
- [x] `sidebar.tsx` — `aria-label` no botão fechar (drawer mobile) `4eede119`
- [x] `sidebar.tsx` — `aria-expanded` no accordion do submenu `4eede119`
- [x] `components/layout/chat/ChatButton.tsx` — aria-label/title no botão do chat `4eede119`

## 3. Acessibilidade — modais e botões só-ícone

- [x] Botões `<X>` de fechar modais sem label (confirm-modal, info-button, list-filters, ClienteAutocomplete, ImportarApiModal, buscar-cnpj, google-drive-picker, oportunidades-kanban, photo-upload, visit-location-modal, visitas-calendario, send-survey-button, ImportarEntidade, acabamento-receita-dialog) `790c051f`
- [x] `visitas-calendario.tsx` — aria-label nos chevrons de mês `790c051f`
- [x] `photo-upload.tsx` — aria-label no botão remover foto `790c051f`
- [x] `visit-location-modal.tsx` — aria-label no botão remover localização `790c051f`
- [x] `acabamento-receita-dialog.tsx` — aria-label no botão remover item `790c051f`
- [x] Modais custom: fechar com `Escape` + `role="dialog"`/`aria-modal` — hook `useEscapeClose` (`src/lib/use-escape-close.ts`) aplicado em confirm-modal, info-button, google-drive-picker, oportunidades-kanban, send-survey-button, visit-location-modal, visitas-calendario, buscar-cnpj-modal, ImportarApiModal, ImportarEntidade `790c051f`

## 4. Acessibilidade — combobox de busca

- [x] `command-search.tsx` — `role="combobox"`/`aria-expanded`/`aria-controls` no input de busca + `role="listbox"`/`role="option"`/`aria-activedescendant` no dropdown `2ad2a236`

## 5. `key={index}` → chave estável

- [x] `components/kanban/kanban-board.tsx` (:464 mensagens chat, :502 amostras, :542 pilotagem) `bf5c5905`
- [x] `components/bi/bi-dashboard-client.tsx` (:50, :158, :873 tabelas) `bf5c5905`
- [x] `components/crm/photo-upload.tsx` (:155 fotos) `bf5c5905`
- [x] `comercial/requisicoes-corte/nova/page.tsx` (:119 itens) `bf5c5905`
- [x] `comercial/requisicoes-corte/[id]/page.tsx` (:211 `id ?? index`) — já usava chave estável
- [x] `dashboard/relatorios/historico-solicitacao/page.tsx` (:472 timeline) `bf5c5905`/`64c7f7a6` e `historico-amostra` (:412) `bf5c5905`/`64c7f7a6`
- [x] `ferramentas/regra-de-tres/page.tsx` (:235) `bf5c5905` e `dashboard/relatorios/tempo-status/page.tsx` (:251) `bf5c5905`
- [x] `comercial/crm/visitas/[id]/page.tsx` (:759) `bf5c5905`
- [x] `cadastros/fios/[id]/page.tsx` (:404) `bf5c5905`
- [x] `comercial/solicitacoes/[id]/page.tsx` (:608,:613) `bf5c5905`
- [x] `requisicoes-amostra-comercial/[id]/page.tsx` (:174) `bf5c5905`
- [x] `treinamento/[id]/page.tsx` (:256,:279), `treinamento/admin/[id]` (:207,:221), `treinamento/admin/novo` (:177,:223) `bf5c5905`
- [x] `components/links/LinksEditor.tsx` (:39) `bf5c5905` (+ `ImportarEntidade.tsx`, `chat/page.tsx` extras)

## 6. Data fetching → TanStack Query (migração `fetch`/`useEffect`/`useState`)

- [x] `dashboard/page.tsx` — stats/atividades via `useQuery`; modal `solicitacoes-lista` via `useQuery` com `enabled` (+ Escape/role=dialog no modal) `1bd1d113`
- [x] `comercial/crm/visitas/dashboard/page.tsx` — modal `dashboard-lista` via `useQuery` com `enabled` (+ "Video"→"Vídeo", Escape/role=dialog) `3c449995`
- [x] `components/crm/visit-location-modal.tsx` — conferido (já usa useQuery/useMutation — manter) `aaa66928`
- [x] `components/forms/ClienteAutocomplete.tsx` — busca via useQuery (debounce) + ARIA combobox `3c294a20`
- [x] `components/crm/select-uf.tsx` / `select-cidade.tsx` — useQuery `44999745`
- [x] `components/kanban/kanban-board.tsx` / `kanban-amostras.tsx` — carregamento via useQuery `6ac82ef4`
- [x] `components/layout/sidebar.tsx`, `mobile-bottom-nav.tsx`, `header.tsx` (notificações), `ChatButton.tsx` — useQuery `53839adf`
- [x] `comercial/crm/visitas/[id]/page.tsx` e `novo/page.tsx` — useQuery `896c517a`
- [x] `comercial/solicitacoes/[id]/editar/page.tsx` — useQuery `25a6ad93`
- [x] Cluster `admin/*` — `usuarios/page.tsx`, `roles/page.tsx`, `usuarios/[id]/page.tsx`, `notificacoes/page.tsx`, `whatsapp-catalogos/page.tsx` via `useQuery` (`["admin-usuarios"]`, `["admin-roles"]`, `["admin-usuario", id]`, `["admin-notificacao-regras"]`, `["admin-whatsapp-linhas"]`, `["admin-whatsapp-catalogos"]`; mutações via `invalidateQueries`) `4cc35382`. `whatsapp-monitor`, `whatsapp-dashboard`, `whatsapp-chat` mantidos como polling com `setInterval` + `autoRefresh`/silent refresh (telas de tempo real — exceção documentada). `email-massa` e `configuracoes/*` tratados nos itens 7/9.
- [x] Cluster `cadastros/*/[id]` — `fios`, `cores`, `estampas`, `fornecedores`, `produto-cru`, `produtos-quimicos`, `bases-urdume`, `receitas` via `useQuery` (`["cadastro-fio", id]`, `["cadastro-fios"]`, `["cadastro-cor", id]`, `["cadastro-estampa", id]`, `["cadastro-fornecedor", id]`, `["cadastro-produto-cru", id]`, `["cadastro-produto-quimico", id]`, `["cadastro-base-urdume", id]`, `["cadastro-bases-urdume"]`, `["cadastro-fornecedores"]`, `["cadastro-fio-fornecedores", id]`, `["solicitacoes"]`, `["admin-status", tipo]`, `["receitas"]`) `bb62068c`
- [x] `documentos/romaneios/page.tsx` — useQuery `6edaa217`
- [x] `components/bi/bi-dashboard-client.tsx` — useQuery `74f88d1f`
- [x] `perfil/page.tsx`, `perfil/menus/page.tsx` — useQuery `1362a9a2`
- [x] `dashboard/amostras/page.tsx`, `dashboard/requisicoes-corte/page.tsx` — useQuery `104acec0`
- [x] `components/integracao/ImportarApiModal.tsx` — useQuery `1f784b4d`
- [x] `components/crm/*` (crm-pessoa-whatsapp, whatsapp-chat, vincular-visita-modal, quick-create-cliente/pessoa/contato) — useQuery `1f784b4d`; `google-drive-picker`, `visit-report-button`, kanbans e demais `quick-create-*` só fazem fetch em ações/navegação (mantidos)
- [x] `components/receita/acabamento-receita-dialog.tsx` — useQuery `1f784b4d`
- [x] `components/exportar/ExportarDados.tsx` — conferir (fetch só em ação de exportar — manter)

## 7. `useMemo`/`useCallback` preventivos

- [x] `admin/email-massa/page.tsx` — remover 20 `useCallback` desnecessários (migrar loaders para useQuery). Loaders `carregarModelos/Listas/Historico/Agendados` → useQuery + invalidateQueries (`dashboard-relatorio.tsx` também) `518265be`, `15519e68`; handlers do editor (`exec`, `saveSelection`, etc.) mantidos — event-handler-only, baixo risco
- [x] `components/crm/rich-text-editor.tsx` — avaliar 7 `useCallback` `08f81231`
- [x] `components/kanban/kanban-board.tsx` / `kanban-amostras.tsx` — remover useCallback só para dep de useEffect `6ac82ef4`
- [x] `components/layout/sidebar.tsx` — remover `isAtiva` preventivo `08f81231`
- [x] ~30 arquivos com "useCallback para dep de useEffect" — resolver junto da migração para useQuery `08f81231`, `c33db109`, `3238f8bc`, `fcc69ee7`, `518265be`. Migrados para useQuery: kanbans CRM (leads/tarefas/propostas/campanhas/pessoas/oportunidades + página oportunidades/kanban), notificacoes, conversas, clientes/pessoas (novo e [id]), amostra-comercial kanban-board, dashboard-relatorio, relatórios (12 páginas). Removidos imports não usados: chat, perfil/menus, AnexosUpload, visitas-kanban, requisicoes-corte-kanban. Restantes são legítimos: event handlers (openModal, handleGerarPdf, navigate, handleSearchChange), memoized loaders com params usados em effect+handler (loadFolder, fetchSheetData), stable ref-effect-deps (checkPosition), e ações complexas (buscar romaneios/por-romaneio)

## 8. Bundle — libs pesadas

- [x] `recharts` top-level → `next/dynamic ssr:false` (15 arquivos: dashboards, relatorios, `comercial/crm/page.tsx`, `crm/relatorios`, `visitas/dashboard`, `bi-dashboard-client`) `c0258907`. Extraídos charts para `charts.tsx` irmão em 12 páginas (relatorios, dashboards, crm, crm/relatorios, visitas/dashboard), `bi/page.tsx` importa `bi-dashboard-client` via dynamic, leafs `animated-line`/`staggered-bar-chart` só são importados por charts lazy. Nenhum import estático de recharts restante.
- [ ] `treinamento/exportar-pdf/page.tsx` — jspdf estático → dynamic import
- [ ] `admin/email-massa/page.tsx` — dompurify (sanitize.ts) → dynamic import no uso
- [ ] Wrappers `Importar*` com `"use client"` desnecessário (8 arquivos) — remover/reduzir boundary
- [ ] Migrar páginas de listagem/detalhe client → Server Component quando não precisam de estado

## 9. Quebrar arquivos gigantes em subcomponentes

- [ ] `admin/email-massa/page.tsx` (1766 linhas, 9 dialogs)
- [ ] `cadastros/produto-cru/[id]/page.tsx` (1350 linhas, 4 modais)
- [ ] `components/bi/bi-dashboard-client.tsx` (1066 linhas)
- [ ] `comercial/requisicoes-corte/por-romaneio/page.tsx` (1063 linhas)
- [ ] `documentos/romaneios/page.tsx` (945 linhas)
- [ ] `comercial/crm/visitas/[id]/page.tsx` (812 linhas)
- [ ] `comercial/crm/visitas/novo/page.tsx` (784 linhas)
- [ ] `perfil/menus/page.tsx` (720 linhas)
- [ ] `comercial/crm/pessoas/[id]/page.tsx` (701 linhas)
- [ ] `chat/page.tsx` (672 linhas)
- [ ] `comercial/solicitacoes/[id]/page.tsx` (657 linhas)
- [ ] `admin/configuracoes/integracoes/page.tsx` (613 linhas)
- [ ] `components/kanban/kanban-board.tsx` (589 linhas, 3 dialogs)
- [ ] `admin/configuracoes/banco-dados/page.tsx` (495 linhas, 3 dialogs)

## 10. Verificação final

- [ ] `tsc --noEmit` limpo
- [ ] `npm run build` limpo
- [ ] `npm run lint` limpo
- [ ] Revisão de contraste/foco/mobile nas telas alteradas (pdm-accessibility)
