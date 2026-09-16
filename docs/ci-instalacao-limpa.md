# Instalação limpa e CI — procedimento verificado

## Por que isso existe

Critério técnico de entrada definido na auditoria: **o projeto deve ser reproduzível
com `npm ci` em um clone limpo** (sem reutilização de `node_modules`) e o CI deve
validar isso a cada push/pr. Este documento registra o procedimento e o estado verificado.

## Pré-requisitos

- **Node.js 20 LTS** (ou superior; ver `.nvmrc` e `engines` no `package.json`)
- npm compatível com `package-lock.json` (lockfileVersion 3)
- Git

## Procedimento de instalação limpa (local)

```bash
git clone https://github.com/devtiagoabreu/pdmtextil.git
cd pdmtextil

nvm use          # opcional: adota versão do .nvmrc (Node 20)
npm ci           # instalação limpa EXATA a partir do package-lock.json
                 # (apaga node_modules primeiro e falha se lockfile estiver fora de sincronia)

cp .env.example .env.local   # placeholders; preencha os valores reais para rodar localmente
```

Validação completa (mesmos passos que o CI):

```bash
npm run format:check   # Prettier
npx tsc --noEmit       # TypeScript
npm run test           # Vitest — 282 arquivos / 1.524 testes
npm run build          # build de produção (Next.js)
```

> Atenção: as variáveis de banco (`DATABASE_URL`, `DATABASE_URL_PDM_PRO_TEXTIL`,
> `DATABASE_URL_PDM_IBIRAPUERA`, `DATABASE_URL_NEON`) e as chaves (secret, OAuth,
> Evolution, Groq, `CRON_SECRET`) não devem ser commitadas — vivem em `.env.local`
> (ignorado pelo git) e nos secrets do deploy/CI.

## CI automatizado (`.github/workflows/ci.yml`)

A cada `push` na `main` (e em PRs), o GitHub Actions executa em runner vazio
(nenhum `node_modules` persistido entre execuções):

| Passo | Comando | Objetivo |
|---|---|---|
| Setup Node 20 + cache npm | `actions/setup-node@v4` | ferramenta correta; cache só do download do npm |
| Instalação limpa | `npm ci` | instalação exata do lockfile; falha se out of sync |
| `.env.local` a partir do `.env.example` | `cp .env.example .env.local` | testes/build com placeholders (sem segredos) |
| Formatação | `npm run format:check` | padrão Prettier |
| Tipos | `npx tsc --noEmit` | tipagem |
| Testes | `npm run test` | suíte Vitest |
| Build | `npm run build` | build de produção |

- `workflow_dispatch` permite rodar manualmente ("Run workflow" no GitHub).
- `concurrency` cancela execuções obsoletas do mesmo branch (PR atualizada).

## Estado do `package-lock.json` (atualizado em 16/09/2026)

1. **Consistência package.json ↔ lockfile**: 75 dependências em `package.json`,
   75 no root do lockfile — nenhuma faltando, nenhuma extra.
2. **Estado canônico**: em clone limpo, `npm install --package-lock-only` (com
   **npm 10**, mesmo do CI Node 20) regenera o arquivo com **hash SHA-256 idêntico**
   ao versionado: `2B05EA364B3F18462812A6F3E14B136EAD26F22814992DEA41DEE15F5881C6C2`.
3. **`npm ci` em clone novo**: passa com **npm@10.9.2 (Node 20 — padrão do CI)** e com
   **npm 11 (Node 24)** — `git clone` + `npm ci` → EXIT 0 (920 entradas de topo em
   `node_modules`). Suíte completa e build verdes após a correção (ver mais abaixo), sem
   reutilizar `node_modules`.
4. **Correção aplicada em 16/09/2026**: o lockfile anterior falhava `npm ci` com npm 10
   (CI roda Node 20 → npm 10) com erros de dependências **`Missing`** (`esbuild`,
   `sass`, `@parcel/watcher*`). O lockfile foi regenerado com
   `npx -y npm@10.9.2 install --package-lock-only --ignore-scripts` (diff +1.048/−230;
   +14 referências `@parcel/watcher*`, separação `node_modules/sass@1.51.0` e
   `node_modules/vitest/node_modules/sass@1.104.1`, `esbuild@0.25.12`). A partir daí,
   `npm ci` funciona com npm 10 e npm 11.

> Observação: a correção foi validada em **clones limpos** (drive rápido). Um `npm ci`
> no diretório de trabalho local (HD mecânico) ficou preso por lentidão de I/O e deixou
> `node_modules` parcial — re-execute `npm ci` em uma máquina/mídia rápida se precisar
> restaurar a instalação local (o resultado do CI vale como referência).

## Quando adicionar/remover uma dependência

```bash
npm install <pacote>          # atualiza package.json + package-lock.json
npm install -D <pacote>       # devDependency
npm run test                  # suíte continua verde
git add package.json package-lock.json
git commit -m "chore(deps): adiciona <pacote>"
```

Se o `package-lock.json` estiver fora de sincronia, `npm ci` falha no CI com:
`npm ci can only install packages when your package.json and package-lock.json are in sync`.
Nesse caso, rode `npm install` localmente e inclua ambos os arquivos no mesmo commit.

## Solução de problemas

- **`npm ci` falha por sync** → `npm install` local e commit do `package-lock.json`.
- **CI vermelho no build** → rode `npm run build` localmente com `.env.local` atualizado;
  se reproduzir, corrija em um branch e abra PR (o próprio CI valida).
- **Cache npm obsoleto** → `npm cache clean --force` (raro; o cache do CI é chaveado
  automaticamente pelo `lockfile`).