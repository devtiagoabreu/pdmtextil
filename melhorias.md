# Análise Geral do Sistema — Possíveis Melhorias

> Atualizado em 2026-07-16. Itens marcados como ✅ foram resolvidos.

## 🔴 Críticas / Segurança

| #  | Problema | Status |
|----|----------|--------|
| 1  | SQL Injection — `sql.raw()` com strings do usuário | ✅ Falso positivo — colunas são hardcoded (`sql.identifier("created_at")`), sem input do usuário |
| 2  | Open Proxy sem auth — SSRF | ✅ Corrigido — requireAuth + validação de host |
| 3  | Rotas de clientes duplicadas sem auth | ✅ Corrigido — requireAuth ADMIN/SUDO adicionado |
| 4  | Endpoint de migration sem auth | ✅ Corrigido — requireAuth ADMIN/SUDO adicionado |
| 5  | Vazamento de detalhes internos — error.message | ✅ Corrigido — 16 rotas migradas para handleApiError |
| 6  | Senha fraca hardcoded no seed | ✅ Corrigido — usa `process.env.SEED_PASSWORD` com fallback |

---

## 🟠 Arquitetura / Performance

| #  | Problema | Status |
|----|----------|--------|
| 7  | N+1 crítico — 25 queries para produto cru | Pendente |
| 8  | N+1 nos validadores de ownership | Pendente |
| 9  | Dashboard 11+ queries individuais | Pendente |
| 10 | Inserções em loop — sem batch insert | Pendente |
| 11 | Ausência de transações — sem rollback | Pendente |
| 12 | Sistema de notificações ineficiente | Pendente |
| 13 | Ausência de índices explícitos | Pendente |
| 14 | Migration drift — 12 SQL, 2 rastreados | Pendente |

---

## 🟡 Código / Manutenibilidade

| #  | Problema | Status |
|----|----------|--------|
| 15 | Arquivos excessivamente grandes (51KB, 44KB, 34KB) | ✅ Parcialmente — email-massa reduzido de 1567→1369 linhas |
| 16 | info-content.ts gigante (383 linhas) | Pendente |
| 17 | Validação manual — sem Zod/Joi | Pendente |
| 18 | Error handling inconsistente | ✅ Corrigido — 11 rotas migradas para handleApiError |
| 19 | Ausência total de testes | Pendente |
| 20 | params inconsistente — sync vs Promise | ✅ Corrigido — 10 rotas migradas para `(await params)` |
| 21 | Sem paginação — todas as listagens | Pendente |
| 22 | Sem Prettier/eslint-config-prettier | Pendente |

---

## 🔵 UI / UX

| #  | Problema | Status |
|----|----------|--------|
| 23 | Middleware matcher com rotas inexistentes | ✅ Corrigido |
| 24 | Loading state genérico — "Carregando..." | Pendente |
| 25 | Ausência de empty states | Pendente |
| 26 | `<img>` em vez de `next/image` | ✅ Corrigido — empresa/page.tsx |
| 27 | Ações destrutivas sem confirmação | Pendente |

---

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
| 🟠 Arquitetura/Perf | 8 | 0 |
| 🟡 Código | 8 | 3 |
| 🔵 UI/UX | 5 | 2 |
| ⚪ Infra/DevOps | 4 | 0 |
| **Total** | **31** | **11** |

## Próximos prioritários

1. **#7** N+1 do produto-cru (performance crítica)
2. **#8** N+1 do validate-ownership
3. **#11** Transações nas operações críticas
4. **#17** Validação com Zod
