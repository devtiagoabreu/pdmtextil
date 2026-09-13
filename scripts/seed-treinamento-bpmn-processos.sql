-- ============================================================
-- SEED: Lições novas no Módulo 5 (Diagramas) — Editor BPMN/Visual
-- Adiciona lições sobre estilos no editor BPMN, fundo claro/escuro
-- e o par Modelo semântico x Texto Mermaid. Idempotente: só insere
-- se a lição ainda não existir no módulo.
-- ============================================================

-- Lição 5.3
WITH m AS (SELECT id FROM proc_treino_modulos WHERE ordem = 5)
INSERT INTO proc_treino_licoes (modulo_id, titulo, conteudo_md, pre_requisitos, pathname_relacionado, ordem)
SELECT
  (SELECT id FROM m),
  'Editor BPMN: estilos de formas e de texto',
  $$## Editor BPMN: estilos de formas e de texto

A aba **BPMN** do editor de diagramas é um canvas interativo (bpmn-js). Você arrasta formas, liga conexões e **estiliza cada elemento** para deixar o fluxo mais claro.

### Selecionando um elemento

Clique em uma **forma** (atividade, decisão) ou em uma **conexão** (seta) do canvas. O painel **Estilos** abre automaticamente ao lado — é nele que você personaliza o elemento selecionado.

> 💡 **Não selecionou nada?** Clique no espaço vazio do canvas para fechar o painel, ou use o botão **Estilos** para abrir/fechar manualmente.

### O que dá para estilizar

| Estilo | O que faz |
|---|---|
| **Preenchimento** | Cor de fundo da forma |
| **Borda** | Cor do contorno da forma |
| **Cor do texto** | Cor do rótulo (texto) do elemento |
| **Família da fonte** | Tipo de fonte aplicada ao texto |
| **Tamanho da fonte** | Tamanho do texto (ex: 12, 14, 16) |
| **Peso** | Normal ou **negrito** |
| **Estilo** | Normal ou *itálico* |

### Como aplicar

1. Selecione o elemento no canvas.
2. Ajuste os controles de cor e fonte no painel **Estilos**.
3. Nada de botão "salvar" — as mudanças são aplicadas na hora e **persistidas no XML do diagrama**.

### Os estilos persistem!

Quando a lição é sobre confiança no documento, saiba: as cores de **preenchimento** e **borda** são salvas no XML do diagrama (padrão BPMN), e os estilos de **texto** são gravados com um namespace próprio (`pdm:`). Ao **exportar/reimportar** ou **reabrir** o diagrama, os estilos voltam como você deixou.

> ⚠️ **Bom uso:** use poucas cores com significado (ex: vermelho para pendências, verde para concluído). Estilo demais polui a leitura do fluxo — o objetivo é **comunicar**, não decorar.

### Dica rápida

O painel de estilos só exibe o elemento **selecionado**. Para estilizar outro elemento, basta clicar nele — o painel troca de alvo na hora.

$$,
  'Processo mapeado. Módulo 5 L1 (Entendendo o modelo semântico).',
  '/processos/visual',
  3
WHERE NOT EXISTS (
  SELECT 1 FROM proc_treino_licoes l JOIN proc_treino_modulos m2 ON m2.id = l.modulo_id
  WHERE m2.ordem = 5 AND l.titulo = 'Editor BPMN: estilos de formas e de texto'
);

-- Lição 5.4
WITH m AS (SELECT id FROM proc_treino_modulos WHERE ordem = 5)
INSERT INTO proc_treino_licoes (modulo_id, titulo, conteudo_md, pre_requisitos, pathname_relacionado, ordem)
SELECT
  (SELECT id FROM m),
  'Fundo claro e escuro no editor BPMN',
  $$## Fundo claro e escuro no editor BPMN

O canvas do editor BPMN tem um botão para alternar o **fundo** entre **claro** (branco) e **escuro** (azul-ardósia).

### Onde está o botão

No canto superior direito do editor, no botão **Escuro/Claro** (ícone de lua ou sol).

### O que ele muda

- O **fundo** do canvas muda de cor.
- As **paletas, menus e rótulos** do próprio editor se adaptam ao tema para continuarem legíveis.
- Os **estilos que você aplicou** nos elementos não mudam — eles são seus dados e valem nos dois temas.

### Para que serve

| Situação | Tema sugerido |
|---|---|
| Uso no dia a dia com o app em tema claro | Claro |
| Você usa o app em tema escuro (dark mode) | Escuro |
| Projeção em apresentação com luz controlada | Escuro |
| Impressão/demonstração com fundo branco | Claro |

> 💡 O editor **começa seguindo o tema do sistema**: se o PDM está em modo escuro, o canvas abre escuro. O botão serve para você ajustar conforme a ocasião, sem mudar o tema do app inteiro.

### Regra de ouro

O tema do canvas é **só visual da tela** — não interfere no diagrama salvo nem nos estilos dos elementos. É um ajuste de conforto, não de conteúdo.

$$,
  'Módulo 5 L3 (Editor BPMN: estilos de formas e de texto).',
  '/processos/visual',
  4
WHERE NOT EXISTS (
  SELECT 1 FROM proc_treino_licoes l JOIN proc_treino_modulos m2 ON m2.id = l.modulo_id
  WHERE m2.ordem = 5 AND l.titulo = 'Fundo claro e escuro no editor BPMN'
);

-- Lição 5.5
WITH m AS (SELECT id FROM proc_treino_modulos WHERE ordem = 5)
INSERT INTO proc_treino_licoes (modulo_id, titulo, conteudo_md, pre_requisitos, pathname_relacionado, ordem)
SELECT
  (SELECT id FROM m),
  'Modelo semântico e Texto Mermaid na prática',
  $$## Modelo semântico e Texto Mermaid na prática

O editor tem duas formas de descrever o fluxo: a aba **Modelo semântico** e a aba **Texto Mermaid**. Elas não competem — são **duas visões do mesmo diagrama**.

### Modelo semântico — a fonte da verdade

A aba **Modelo semântico** é um formulário estruturado onde você descreve o processo: **objetivo**, **atividades**, **decisões** e **fluxos** entre eles.

- É o que **de fato é salvo** no banco.
- É a base das outras representações: Mermaid, BPMN e Canvas são gerados/derivados dele.
- Ideal quando você quer **dados organizados** (cada atividade com nome, cada decisão com pergunta) que podem ser reutilizados e auditados.

### Texto Mermaid — o fluxo em texto

A aba **Texto Mermaid** mostra o mesmo fluxo como **texto em sintaxe Mermaid** (`flowchart` ou `mindmap`). É um texto que **vira gráfico** ao ser renderizado.

- Ótimo para **compartilhar** o fluxo (cole em docs, e-mails, wikis).
- Bom para **editar rápido**: mudou uma seta? É uma linha de texto.
- É abertamente compatível com o padrão Mermaid usado em GitLab/GitHub/MkDocs.

### A via de mão dupla

```
Modelo semântico  ──salva──▶  gera Mermaid automaticamente
Modelo semântico  ◀─importar─  Texto Mermaid editado (botão "Importar texto")
```

- **Modelo → Mermaid:** toda alteração no modelo semântico deriva automaticamente o texto Mermaid.
- **Mermaid → Modelo:** edite o texto Mermaid e clique em **Importar texto** para reconstruir o modelo semântico a partir dele.

> 💡 Regra prática: use o **modelo semântico** quando o foco é cadastro estruturado e auditoria; use o **texto Mermaid** quando o foco é compartilhar e iterar rápido. Os dois caminhos se conversam.

### Erro comum

**Editar a representação direto como se fosse a fonte.** Mermaid, BPMN e Canvas são representações — o modelo semântico (e o que você salva) é a base. Para mudanças estruturais no fluxo, prefira ajustar o modelo e deixar as representações acompanharem.

$$,
  'Módulo 5 L1 (Entendendo o modelo semântico).',
  '/processos/visual',
  5
WHERE NOT EXISTS (
  SELECT 1 FROM proc_treino_licoes l JOIN proc_treino_modulos m2 ON m2.id = l.modulo_id
  WHERE m2.ordem = 5 AND l.titulo = 'Modelo semântico e Texto Mermaid na prática'
);