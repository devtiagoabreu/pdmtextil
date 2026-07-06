-- ============================================================
-- SEED: Lição extra no Módulo 14 — Dinâmica de Equipes
-- Adiciona lição 2 sobre equipes no módulo "Regiões e Equipes"
-- ============================================================

WITH m AS (SELECT id FROM crm_treino_modulos WHERE ordem = 14)
INSERT INTO crm_treino_licoes (modulo_id, titulo, conteudo_md, pre_requisitos, pathname_relacionado, ordem) VALUES
((SELECT id FROM m), 'Equipes: criando, editando e gerenciando membros',
$$## 👥 O que são Equipes?

Equipes são **grupos de representantes** organizados para atender uma região ou mercado. Diferente de uma região (que é geográfica), a equipe é operacional — quem faz o trabalho de vendas no dia a dia.

```
┌─────────────────────┐
│     REGIÃO          │  ← Ex: São Paulo (geográfico)
│  ┌───────────────┐  │
│  │  EQUIPE ALPHA │  │  ← Grupo de representantes
│  │  ┌─────────┐  │  │
│  │  │ João    │  │  │  ← Representante (membro)
│  │  │ Maria   │  │  │
│  │  │ Pedro   │  │  │
│  │  └─────────┘  │  │
│  └───────────────┘  │
│  ┌───────────────┐  │
│  │  EQUIPE BETA  │  │
│  │  ┌─────────┐  │  │
│  │  │ Ana     │  │  │
│  │  │ Carlos  │  │  │
│  │  └─────────┘  │  │
│  └───────────────┘  │
└─────────────────────┘
```

### Acessando

Vá em **CRM → Equipes**

### Criando uma equipe

1. Clique em **"Nova Equipe"**
2. Preencha:

| Campo | Obrigatório? | Explicação |
|---|---|---|
| **Nome** | ✅ Sim | Nome da equipe (ex: Equipe Alpha SP) |
| **Região** | Não | Região geográfica vinculada (ex: São Paulo) |
| **Responsável** | Sim (padrão: você) | Quem lidera a equipe (usuário do sistema) |

> 💡 **Região é opcional!** Uma equipe pode existir sem região definida. Isso é útil para equipes especiais, temporárias ou que atuam em múltiplas regiões.

### Gerenciando membros da equipe

Depois de criar a equipe, **clique nela** para abrir o detalhe. Lá você gerencia os membros:

#### Adicionando um representante

1. No campo **"Buscar representante"**, digite pelo menos 2 letras do nome
2. Uma lista de representantes disponíveis aparece
3. Clique em **"Adicionar"** ao lado do representante desejado
4. Pronto! O representante agora é membro da equipe

> 🔍 **A busca filtra automaticamente** os representantes que já são membros — eles não aparecem na lista de resultados.

#### Removendo um representante

1. Na lista de membros, identifique o representante
2. Clique no botão **"Remover"** (ícone de X)
3. Confirme a exclusão

> ⚠️ **Remover um membro não exclui o representante do sistema** — apenas desvincula ele da equipe. Ele continua existindo e pode ser adicionado a outra equipe depois.

### Visualizando informações dos membros

A lista de membros mostra:

| Informação | Detalhe |
|---|---|
| 👤 **Nome** | Nome completo do representante |
| 📍 **Cidade/UF** | Localização |
| 📞 **Celular** | Telefone para contato |
| 📧 **Email** | E-mail |

### Editando uma equipe

1. Na lista de equipes, clique no **lápis (✏️)** ao lado da equipe
2. Altere nome, região ou responsável
3. Salve

### Excluindo uma equipe

1. Clique no **lixeira (🗑️)** ao lado da equipe
2. Confirme a exclusão

> 🔒 **Apenas ADMIN/SUDO** podem excluir equipes. A exclusão remove também todos os vínculos de membros (mas não exclui os representantes).

### Dica de ouro 💛

> **Organize as equipes por critérios claros:** região geográfica, tipo de cliente (confecção vs lavanderia), ou porte de cliente. Uma boa organização de equipes permite gerar relatórios precisos e distribuir leads de forma inteligente. Revise a composição das equipes periodicamente — representantes mudam de região, entram e saem. Mantenha tudo atualizado!

$$, 'Regiões cadastradas (opcional). Representantes cadastrados.', '/comercial/crm/equipes', 2);
