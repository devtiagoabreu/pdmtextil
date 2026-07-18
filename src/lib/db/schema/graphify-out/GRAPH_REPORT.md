# Graph Report - src\lib\db\schema  (2026-07-16)

## Corpus Check
- Corpus is ~5,902 words - fits in a single context window. You may not need a graph.

## Summary
- 262 nodes · 329 edges · 26 communities (22 shown, 4 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- [[_COMMUNITY_Community 0|Community 0]]
- [[_COMMUNITY_Community 1|Community 1]]
- [[_COMMUNITY_Community 2|Community 2]]
- [[_COMMUNITY_Community 3|Community 3]]
- [[_COMMUNITY_Community 4|Community 4]]
- [[_COMMUNITY_Community 5|Community 5]]
- [[_COMMUNITY_Community 6|Community 6]]
- [[_COMMUNITY_Community 7|Community 7]]
- [[_COMMUNITY_Community 8|Community 8]]
- [[_COMMUNITY_Community 9|Community 9]]
- [[_COMMUNITY_Community 10|Community 10]]
- [[_COMMUNITY_Community 11|Community 11]]
- [[_COMMUNITY_Community 12|Community 12]]
- [[_COMMUNITY_Community 13|Community 13]]
- [[_COMMUNITY_Community 14|Community 14]]
- [[_COMMUNITY_Community 15|Community 15]]
- [[_COMMUNITY_Community 17|Community 17]]
- [[_COMMUNITY_Community 18|Community 18]]
- [[_COMMUNITY_Community 19|Community 19]]
- [[_COMMUNITY_Community 20|Community 20]]
- [[_COMMUNITY_Community 21|Community 21]]
- [[_COMMUNITY_Community 22|Community 22]]
- [[_COMMUNITY_Community 23|Community 23]]
- [[_COMMUNITY_Community 24|Community 24]]
- [[_COMMUNITY_Community 25|Community 25]]

## God Nodes (most connected - your core abstractions)
1. `usuarios` - 26 edges
2. `crmPessoas` - 10 edges
3. `crmContatos` - 4 edges
4. `crmOportunidades` - 4 edges
5. `representantes` - 4 edges
6. `clientes` - 3 edges
7. `fios` - 3 edges
8. `solicitacoes` - 3 edges
9. `basesUrdume` - 2 edges
10. `crmEquipes` - 2 edges

## Surprising Connections (you probably didn't know these)
- None detected - all connections are within the same source files.

## Communities (26 total, 4 thin omitted)

### Community 0 - "Community 0"
Cohesion: 0.5
Nodes (3): NewAcabamento, Acabamento, acabamentos

### Community 1 - "Community 1"
Cohesion: 0.5
Nodes (22): crmCampanhas, usuarios, sessions, requisicoesCorteItens, NewNotificacao, anexos, solicitacoes, NewLog (+14 more)

### Community 2 - "Community 2"
Cohesion: 0.5
Nodes (3): BancoDados, bancosDados, NewBancoDados

### Community 3 - "Community 3"
Cohesion: 0.5
Nodes (10): ChatLeitura, NewChat, chats, chatMensagens, chatLeituras, NewChatMensagem, chatParticipantes, ChatMensagem (+2 more)

### Community 4 - "Community 4"
Cohesion: 0.5
Nodes (16): PessoaRepresentante, Representante, NewCliente, ClienteRepresentante, pessoasRepresentantes, NewCrmEquipeMembro, clientes, crmEquipes (+8 more)

### Community 5 - "Community 5"
Cohesion: 0.5
Nodes (27): NewCrmPessoa, crmPropostas, crmOportunidades, crmPessoas, NewCrmOportunidade, crmTarefas, NewCrmTarefa, CrmTarefa (+19 more)

### Community 7 - "Community 7"
Cohesion: 0.5
Nodes (6): coresFundo, NewCorFundo, coresSolidas, CorFundo, CorSolida, NewCorSolida

### Community 8 - "Community 8"
Cohesion: 0.5
Nodes (16): NewCrmPais, NewCrmRegiao, crmEstados, NewCrmCidade, CrmRegiao, crmRegioes, NewCrmEstado, crmCidades (+8 more)

### Community 9 - "Community 9"
Cohesion: 0.5
Nodes (3): CrmNotificacao, crmNotificacoes, NewCrmNotificacao

### Community 11 - "Community 11"
Cohesion: 0.5
Nodes (6): NewCrmTreinoModulo, crmTreinoLicoes, NewCrmTreinoLicao, CrmTreinoLicao, CrmTreinoModulo, crmTreinoModulos

### Community 13 - "Community 13"
Cohesion: 0.5
Nodes (12): emailEnviados, NewEmailEnviado, emailListas, NewEmailListaContato, NewEmailLista, NewEmailClique, EmailLista, EmailClique (+4 more)

### Community 14 - "Community 14"
Cohesion: 0.5
Nodes (3): NewEmailModelo, EmailModelo, emailModelos

### Community 15 - "Community 15"
Cohesion: 0.5
Nodes (3): estampas, Estampa, NewEstampa

### Community 17 - "Community 17"
Cohesion: 0.5
Nodes (3): integracoes, Integracao, NewIntegracao

### Community 18 - "Community 18"
Cohesion: 0.5
Nodes (6): maquinas, Maquina, NewMaquina, Operacao, operacoes, NewOperacao

### Community 19 - "Community 19"
Cohesion: 0.5
Nodes (3): NotificacaoRegra, notificacaoRegras, NewNotificacaoRegra

### Community 20 - "Community 20"
Cohesion: 0.5
Nodes (33): produtosCru, NewBaseUrdume, NewProdutoCruAcabamentoAmostra, produtoCruComposicao, NewProdutoCru, NewProdutoCruAcabamento, FioFornecedor, NewProdutoCruComposicao (+25 more)

### Community 21 - "Community 21"
Cohesion: 0.5
Nodes (8): produtosQuimicos, produtoCruReceita, ProdutoQuimico, NewProdutoQuimico, produtoCruReceitaItem, NewProdutoCruReceitaItem, produtoCruAcabamentoAmostra, NewProdutoCruReceita

### Community 22 - "Community 22"
Cohesion: 0.5
Nodes (3): Role, NewRole, roles

### Community 23 - "Community 23"
Cohesion: 0.5
Nodes (6): NewRomaneio, NewRomaneioPeca, Romaneio, RomaneioPeca, romaneios, romaneioPecas

### Community 25 - "Community 25"
Cohesion: 0.5
Nodes (6): NewUserMenuItem, NewUserMenu, userMenus, UserMenuItem, UserMenu, userMenuItens

## Knowledge Gaps
- **184 isolated node(s):** `acabamentos`, `Acabamento`, `NewAcabamento`, `accounts`, `Account` (+179 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **4 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `usuarios` connect `Community 1` to `Community 3`, `Community 4`, `Community 5`, `Community 8`, `Community 20`, `Community 21`, `Community 25`?**
  _High betweenness centrality (0.175) - this node is a cross-community bridge._
- **Why does `crmPessoas` connect `Community 5` to `Community 4`?**
  _High betweenness centrality (0.006) - this node is a cross-community bridge._
- **What connects `acabamentos`, `Acabamento`, `NewAcabamento` to the rest of the system?**
  _184 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Community 1` be split into smaller, more focused modules?**
  _Cohesion score 0.09 - nodes in this community are weakly interconnected._
- **Should `Community 4` be split into smaller, more focused modules?**
  _Cohesion score 0.11 - nodes in this community are weakly interconnected._
- **Should `Community 5` be split into smaller, more focused modules?**
  _Cohesion score 0.09 - nodes in this community are weakly interconnected._
- **Should `Community 8` be split into smaller, more focused modules?**
  _Cohesion score 0.11 - nodes in this community are weakly interconnected._