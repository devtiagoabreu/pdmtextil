# Análise Geral do Sistema — Possíveis Melhorias

> Atualizado em 2026-07-17.

## 🔴 Críticas / Segurança

| #  | Problema | Status |
|----|----------|--------|
| 1  | SQL Injection — `sql.raw()` com strings do usuário | ✅ Falso positivo — colunas hardcoded |
| 2  | Open Proxy sem auth — SSRF | ✅ Corrigido |
| 3  | Rotas de clientes duplicadas sem auth | ✅ Corrigido |
| 4  | Endpoint de migration sem auth | ✅ Corrigido |
| 5  | Vazamento de detalhes internos — error.message | ✅ Corrigido — 16 rotas |
| 6  | Senha fraca hardcoded no seed | ✅ Corrigido — env var |

## 🟠 Arquitetura / Performance

| #  | Problema | Status |
|----|----------|--------|
| 7  | N+1 crítico — 25 queries para produto cru | ✅ Já otimizado (7 queries) |
| 8  | N+1 nos validadores de ownership | ✅ Corrigido — parallel queries |
| 9  | Dashboard 11+ queries individuais | ✅ Corrigido — 10→5 queries |
| 10 | Inserções em loop — sem batch insert | ✅ Corrigido — 10 arquivos |
| 11 | Ausência de transações — sem rollback | ✅ Corrigido — solicitacoes + produto-cru |
| 12 | Sistema de notificações ineficiente | Pendente |
| 13 | Ausência de índices explícitos | ✅ Corrigido — 14 indexes |
| 14 | Migration drift — 12 SQL, 2 rastreados | Pendente |

## 🟡 Código / Manutenibilidade

| #  | Problema | Status |
|----|----------|--------|
| 15 | Arquivos excessivamente grandes | ✅ Parcialmente — email-massa |
| 16 | info-content.ts gigante (383 linhas) | Pendente |
| 17 | Validação manual — sem Zod/Joi | ✅ Já existe para CRUDs principais |
| 18 | Error handling inconsistente | ✅ Corrigido — 11 rotas |
| 19 | Ausência total de testes | Pendente |
| 20 | params inconsistente — sync vs Promise | ✅ Corrigido — 10 rotas |
| 21 | Sem paginação — todas as listagens | Pendente |
| 22 | Sem Prettier/eslint-config-prettier | Pendente |

## 🔵 UI / UX

| #  | Problema | Status |
|----|----------|--------|
| 23 | Middleware matcher com rotas inexistentes | ✅ Corrigido |
| 24 | Loading state genérico | Pendente |
| 25 | Ausência de empty states | Pendente |
| 26 | `<img>` em vez de `next/image` | ✅ Corrigido |
| 27 | Ações destrutivas sem confirmação | Pendente |

## ⚪ Infraestrutura / DevOps

| #  | Problema | Status |
|----|----------|--------|
| 28 | Sem CI/CD | Pendente |
| 29 | Sem Docker | Pendente |
| 30 | Sem pre-commit hooks | Pendente |
| 31 | Sem monitoramento | Pendente |

---

# Resumo

| Categoria | Total | Resolvidos |
|-----------|-------|------------|
| 🔴 Segurança | 6 | 6 |
| 🟠 Arquitetura/Perf | 8 | 7 |
| 🟡 Código | 8 | 5 |
| 🔵 UI/UX | 5 | 2 |
| ⚪ Infra/DevOps | 4 | 0 |
| **Total** | **31** | **20** |

## Itens restantes (11)

| Prioridade | # | Problema |
|------------|---|----------|
| Média | 12 | Sistema de notificações ineficiente |
| Média | 14 | Migration drift |
| Média | 21 | Sem paginação |
| Baixa | 16 | info-content.ts gigante |
| Baixa | 19 | Ausência de testes |
| Baixa | 22 | Prettier |
| Baixa | 24 | Loading states |
| Baixa | 25 | Empty states |
| Baixa | 27 | Confirmação de ações |
| Baixa | 28-31 | CI/CD, Docker, hooks, monitoramento |
