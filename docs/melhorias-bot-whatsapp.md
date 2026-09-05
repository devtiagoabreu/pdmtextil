# Bot WhatsApp — Rota de Melhorias (roadmap)

Este arquivo é a fonte de verdade da lista de melhorias do **bot de atendimento do WhatsApp CRM** (`crm_whatsapp_*`, processador em `src/lib/whatsapp/processador.ts`). Toda melhoria entregue ou planejada deve ser registrada aqui, na mesma entrega.

## Progresso geral

| Bloco | Descrição resumida |
|---|---|
| P0 — Fundação | Detecção de intenção com LLM barato, serialização por conversa (lock) |
| P1 — Robustez do fluxo | Validação da saída da IA, memória de conversas longas, status de envio, abandono em cron |
| P2 — Conversão e confiabilidade | Representantes via `usuarios`, limpeza da máquina de estados, testes de fluxo completo |
| P3 — Configuração (entregue) | Destinatários configuráveis por tipo (PF/PJ) + notificação por e-mail + monitoramento/log |

## Entregues

| Item | O que resolve | Commit |
|---|---|---|
| P0-1 | Detecta intenção do lead (escalar p/ humano, interesse em linhas) via LLM barato nos pontos críticos (`intencao.ts`) | `bff90c40` |
| P0-2 | Serializa mensagens por contato com lock de conversa (evita processamento duplicado/concorrente) | `128d0092` |
| P1-4 | Valida a saída JSON do LLM no `extrairDadosLead` (evita crash com resposta mal-formada) | `4c83f3b6` |
| P1-5 | Memória de conversas longas via resumo incremental (`resumo.ts`) | `83a60859` |
| P1-6 | Rastreia status de mensagens enviadas na Evolution (IDs externos) | `ce75b320` |
| P1-7 | Verifica conversas abandonadas em cron dedicado em vez do webhook (`abandon-checker`) | `30c40539` |
| P2-8 | Representantes passam a ser usuários ativos com `cel_whatsapp` (fallback env por PF/PJ) | `39af8937` |
| P2-9 | Remove estados mortos da máquina de estados e corrige `parseLinhas` | `21445df9` |
| P2-10 | Teste de fluxo completo do processador (funis PJ e PF), garantindo estabilidade | `8f7e999e` |
| P3-1 | Configuração de destinatários por tipo (PF/PJ) na tela admin + e-mail aos configurados | `6ac03d1a` |
| P3-2 | Monitoramento do bot (Evolution online?) com cron diário, alerta por e-mail/PDM aos admins e log de tudo | (este commit) |

## Em andamento / Próximos

### P3-1 — Configuração de destinatários do bot (admin)

**Problema:** hoje o bot encaminha o contato para **todos** os usuários ativos com `cel_whatsapp` (ou um fallback de ambiente). O time comercial não tem como escolher **quem** recebe o contato quando o lead é **PF** ou **PJ**, e **nenhum e-mail** é enviado (o time acredita que é notificado por e-mail, mas não é).

**Solução:**

1. Nova tabela `crm_whatsapp_destinatarios` (usuário + tipo de pessoa `PJ`/`PF`, único por par) — migration idempotente + syncdown do Neon.
2. Tela de admin `Admin → Config Bot WhatsApp` (`/admin/bot-config`): selecionar usuários por tipo (`PJ` e `PF`) e salvar.
3. `obterRepresentantes` passa a priorizar os destinatários configurados (fallback: comportamento legado).
4. Ao criar lead, além do aviso no WhatsApp para representantes, envia **e-mail** aos usuários configurados.
5. Testes: `representantes`, rota `api/admin/bot-config`, tela `admin/bot-config`, e atualização do `processador-fluxo`.

### P3-2 — Monitoramento e log do bot (admin)

**Problema:** o bot depende da instância da Evolution API. Se ela cair (celular deslogado, WhatsApp foi arrastado para outro provedor, API fora do ar), o atendimento para **silenciosamente** — o time não fica sabendo e não há histórico do que aconteceu.

**Solução:**

1. Nova tabela `crm_whatsapp_bot_logs` (eventos do bot: `OK`, `FALHA`, `ALERTA`, `FILA`, `FLUXO`, `ERRO`, `RETRY`) — migration idempotente + syncdown do Neon.
2. Módulo `src/lib/whatsapp/monitoramento.ts`: checa `/instance/connectionState/{instancia}` na Evolution e decide se o bot está `open` (online).
3. Cron da Vercel (`/api/crm/whatsapp/monitorar-bot`, `50 11 * * *` UTC) via `CRON_SECRET` ou sessão admin; também dá para **Verificar agora** na tela.
4. Alerta **só na transição para fora do ar** (anti-spam): e-mail para ADMIN/SUDO com a situação detalhada e/ou notificação interna no PDM (`WHATSAPP_BOT_MONITOR`), conforme a configuração.
5. Config em `config_geral` (`bot_monitoramento`): ativo, alerta por e-mail, notificação no PDM.
6. Tela `Admin → Config Bot WhatsApp`: card de monitoramento (badge de status, último check, verificar agora, toggles) + lista dos últimos eventos.
7. Logs no pipeline: fila (`FILA`), fluxo quando o lead é criado (`FLUXO`), erro do processador (`ERRO`) e retry (`RETRY`).
8. Testes: `monitoramento.test.ts` (saúde, config, alerta/dedup/recuperação), rota `monitorar-bot`, rota `api/admin/bot-config`, tela `admin/bot-config`.

### Propostas futuras (a definir)

- Conversa manual humana com hand-off para usuário específico por tipo de pessoa.
- Relatório de leads encaminhados por representante.
- Limite de horário para envio de notificações (WhatsApp/e-mail).
- Priorização de usuário por região/linha de interesse detectada.