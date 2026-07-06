-- ============================================================
-- SEED: Módulos e Lições de Treinamento CRM — Telas Faltantes
-- Adiciona módulos 17, 18, 19 sem apagar os existentes
-- ============================================================

-- ============================================================
-- MÓDULO 17: Clientes — A Base Comercial
-- ============================================================
INSERT INTO crm_treino_modulos (titulo, descricao, icone, cor, ordem) VALUES
('Clientes — A Base Comercial', 'Clientes são as empresas que já compram da PDM Têxtil. Aprenda a gerenciar o cadastro, vincular representantes e acompanhar tudo que acontece com cada cliente.', 'BookOpen', '#f97316', 17);

WITH m AS (SELECT id FROM crm_treino_modulos WHERE ordem = 17)
INSERT INTO crm_treino_licoes (modulo_id, titulo, conteudo_md, pre_requisitos, pathname_relacionado, ordem) VALUES
((SELECT id FROM m), 'Gerenciando clientes cadastrados',
$$## 🏢 O que é um Cliente?

No CRM da PDM Têxtil, **Cliente** é uma empresa que já tem um relacionamento comercial ativo. Diferente de uma **Empresa** (que pode ser apenas um prospecto), o cliente está na base comercial e pode ter representantes vinculados.

### Diferença entre Empresas e Clientes

| Empresa (CRM) | Cliente (Comercial) |
|---|---|
| Qualquer empresa cadastrada | Empresa com relacionamento comercial |
| Pode ser prospecto | Já compra ou já comprou |
| Visão completa do CRM | Visão comercial com representantes |
| Cadastrada em CRM → Empresas | Gerenciada em Comercial → Clientes |

> 💡 **Na prática:** Toda empresa pode se tornar um cliente. Quando isso acontece, ela aparece na tela de Clientes com informações adicionais como representante vinculado.

### Acessando a lista de clientes

1. Vá em **Comercial → Clientes**
2. Veja a lista completa com:
   - Nome da empresa / razão social
   - CNPJ
   - Representante vinculado
   - Status
   - Última atividade

### Funcionalidades da tela

| Funcionalidade | Como usar |
|---|---|
| 🔍 Buscar | Digite nome, CNPJ ou representante |
| 📄 Ver detalhes | Clique no cliente para abrir |
| ✏️ Editar | Dentro do cliente, clique em Editar |
| 👥 Representantes | Veja e gerencie os representantes do cliente |

### Vinculando representantes

Dentro do cliente, você encontra a seção **Representantes**. Lá você pode:
- 👤 Ver quais representantes atendem este cliente
- ➕ Adicionar um representante (busca por nome)
- ❌ Remover um representante

> 🔑 **Importante:** Um cliente pode ter múltiplos representantes. Um representante pode atender múltiplos clientes. É um relacionamento de muitos-para-muitos.

### Dica de ouro 💛

> **Mantenha os clientes sempre atualizados!** Um cliente com dados corretos (CNPJ, endereço, contatos) é a base para um atendimento de qualidade. Revise seus clientes periodicamente.

$$, 'Empresas cadastradas no CRM', '/comercial/clientes', 1);

-- ============================================================
-- MÓDULO 18: Representantes — A Força de Vendas
-- ============================================================
INSERT INTO crm_treino_modulos (titulo, descricao, icone, cor, ordem) VALUES
('Representantes — A Força de Vendas', 'Representantes são os profissionais que atendem os clientes em campo. Cadastre, gerencie e vincule representantes a clientes e equipes.', 'Users', '#8b5cf6', 18);

WITH m AS (SELECT id FROM crm_treino_modulos WHERE ordem = 18)
INSERT INTO crm_treino_licoes (modulo_id, titulo, conteudo_md, pre_requisitos, pathname_relacionado, ordem) VALUES
((SELECT id FROM m), 'Cadastrando e gerenciando representantes',
$$## 👤 O que é um Representante?

O **Representante** é o profissional de vendas que atende os clientes em campo. Ele pode ser:
- Um vendedor interno da PDM Têxtil
- Um representante comercial autônomo
- Um gerente regional que supervisiona vendas

### Cadastrando um representante

1. Vá em **Comercial → Representantes → Novo Representante**
2. Ou em **Cadastros → Representantes**
3. Preencha os campos:

| Campo | Obrigatório? | Explicação |
|---|---|---|
| **Nome** | ✅ Sim | Nome completo |
| **CPF** | Não | CPF com pontuação |
| **RG** | Não | RG |
| **Email** | Não | E-mail para contato |
| **Telefone** | Não | Telefone fixo |
| **Celular** | Não | Celular / WhatsApp |
| **CEP** | Não | CEP do endereço |
| **Endereço** | Não | Logradouro |
| **Número** | Não | Número |
| **Complemento** | Não | Complemento |
| **Bairro** | Não | Bairro |
| **Cidade** | Não | Cidade |
| **UF** | Não | Estado |
| **Status** | ✅ (padrão ATIVO) | ATIVO, INATIVO |
| **Gerente** | Não | Usuário gerente responsável |

> 📋 **Representante segue o mesmo padrão de cadastro de Clientes** — os campos são idênticos, facilitando a manutenção.

### Lista de representantes

Em **Comercial → Representantes**, você vê:
- Nome
- Contato (email/celular)
- Cidade/UF
- Gerente responsável
- Status (ATIVO/INATIVO)
- Total de clientes vinculados

### Vinculando representantes a clientes

Um representante pode ser vinculado a um cliente de duas formas:

**Pelo cliente:**
1. Abra o cliente em **Comercial → Clientes**
2. Na seção **Representantes**, clique em **Adicionar**
3. Busque o representante pelo nome
4. Confirme

**Pelo representante:**
1. Abra o representante
2. Veja a lista de clientes vinculados
3. Gerencie os vínculos

### Representante em equipes

Representantes também podem ser organizados em **Equipes comerciais**. Para isso:
1. Vá em **CRM → Equipes**
2. Crie ou edite uma equipe
3. Adicione representantes como membros

> 💡 **Assim como clientes, o cadastro de representantes também gera registros na timeline da empresa.**

### Dica de ouro 💛

> **Representante bem cadastrado = gestão eficiente.** Com os dados corretos, você consegue gerar relatórios por representante, saber quem atende cada cliente e distribuir leads de forma inteligente.

$$, 'Clientes cadastrados (para vincular representantes)', '/comercial/representantes/novo', 1);

-- ============================================================
-- MÓDULO 19: Configurações — Estados, Cidades e Países
-- ============================================================
INSERT INTO crm_treino_modulos (titulo, descricao, icone, cor, ordem) VALUES
('Configurações — Estados, Cidades e Países', 'As tabelas de suporte do CRM: estados, cidades e países. Mantenha esses cadastros organizados para que os endereços fiquem sempre corretos.', 'Settings', '#6366f1', 19);

WITH m AS (SELECT id FROM crm_treino_modulos WHERE ordem = 19)
INSERT INTO crm_treino_licoes (modulo_id, titulo, conteudo_md, pre_requisitos, pathname_relacionado, ordem) VALUES
((SELECT id FROM m), 'Gerenciando estados',
$$## 🗺️ Estados no CRM

O CRM possui uma tabela de **Estados** que é usada em diversos cadastros:
- Endereço de empresas e clientes
- Endereço de representantes
- Regiões comerciais
- Filtros de relatórios

### Acessando

Vá em **CRM → Estados**

### O que você pode fazer

| Ação | Como fazer |
|---|---|
| 📋 Ver lista | Todos os estados com UF, nome e país |
| ➕ Adicionar | Preencha UF, nome e selecione o país |
| ✏️ Editar | Clique no nome ou UF para editar inline |
| ❌ Excluir | Só se nenhuma cidade estiver vinculada |

### Campos

| Campo | Obrigatório? | Explicação |
|---|---|---|
| **UF** | ✅ Sim | Sigla de 2 letras (ex: SP) |
| **Nome** | ✅ Sim | Nome completo (ex: São Paulo) |
| **País** | ✅ Sim | País ao qual pertence (ex: Brasil) |

> 🌎 **Atualmente todos os 27 estados brasileiros já estão cadastrados e vinculados ao Brasil.**

### Dica de ouro 💛

> **Não duplique estados!** Antes de cadastrar um novo estado, verifique se ele já existe na lista. Se estiver faltando algum estado, cadastre com a UF correta em maiúsculo.

$$, 'Nenhum. A lista de estados já vem pré-preenchida.', '/comercial/crm/configuracoes/estados', 1);

WITH m AS (SELECT id FROM crm_treino_modulos WHERE ordem = 19)
INSERT INTO crm_treino_licoes (modulo_id, titulo, conteudo_md, pre_requisitos, pathname_relacionado, ordem) VALUES
((SELECT id FROM m), 'Gerenciando cidades',
$$## 🏙️ Cidades no CRM

Assim como os estados, as **Cidades** são usadas nos endereços de toda a base:

### Acessando

Vá em **CRM → Cidades**

### Funcionalidades

| Funcionalidade | Como usar |
|---|---|
| 🔍 Buscar | Digite nome da cidade ou UF |
| ➕ Adicionar | Selecione o estado, digite o nome |
| 📊 Filtro por estado | Veja só as cidades de um estado específico |

### Como adicionar uma cidade

1. Clique em **Adicionar Cidade**
2. Selecione o **Estado** (ex: SP - São Paulo)
3. Digite o **Nome** da cidade
4. Confirme

> 💡 **Cidades com acento:** Cadastre exatamente como é escrito (ex: São Paulo, Belo Horizonte, Goiânia, Caxias do Sul).

### Por que manter as cidades organizadas?

Uma base de cidades bem organizada garante:
- ✅ Endereços consistentes em toda a base
- ✅ Relatórios por cidade/região precisos
- ✅ IA consegue sugerir ações baseadas em localização
- ✅ Facilita a criação de regiões comerciais

### Dica de ouro 💛

> **Se uma cidade não existir no cadastro, crie!** Um endereço sem cidade cadastrada corretamente não aparece nos relatórios geográficos. Cinco segundos de cadastro salvam horas de retrabalho.

$$, 'Estados cadastrados. As cidades dependem dos estados.', '/comercial/crm/configuracoes/cidades', 2);

WITH m AS (SELECT id FROM crm_treino_modulos WHERE ordem = 19)
INSERT INTO crm_treino_licoes (modulo_id, titulo, conteudo_md, pre_requisitos, pathname_relacionado, ordem) VALUES
((SELECT id FROM m), 'Países e códigos DDI',
$$## 🌍 Países no CRM

A tabela de **Países** contém todos os países do mundo com seus respectivos códigos DDI (Discagem Direta Internacional).

### Acessando

Vá em **CRM → Países**

### O que você encontra

| Coluna | Exemplo | Descrição |
|---|---|---|
| **Nome** | Brasil | Nome oficial do país |
| **Código** | +55 | Código DDI para ligações |
| **Total de Estados** | 27 | Quantos estados vinculados |

### Funcionalidades

| Ação | Como fazer |
|---|---|
| 📋 Ver lista | Todos os 217 países cadastrados |
| ➕ Adicionar | Preencha nome e código DDI |
| ✏️ Editar | Clique no botão de editar ao lado do país |
| ❌ Excluir | Só se nenhum estado estiver vinculado |

### Por que 217 países?

O CRM já vem com **todos os países reconhecidos pela ONU** pré-cadastrados, incluindo seus códigos DDI. Isso significa que:

- ✅ Você não precisa cadastrar país por país
- ✅ Códigos DDI já estão prontos para uso
- ✅ Se precisar cadastrar um estado de outro país (ex: Flórida - EUA), o país já existe

### Dica de ouro 💛

> **Raramente você precisará cadastrar um novo país** (a não ser que um novo país seja criado!). Mas se precisar, lembre-se de usar o código DDI correto — uma ligação internacional depende disso.

$$, 'Nenhum. Todos os países já vêm pré-cadastrados.', '/comercial/crm/configuracoes/paises', 3);

-- ============================================================
-- ATUALIZAÇÃO: Módulo 14 — corrigir pathname_relacionado
-- O módulo 14 (Regiões e Equipes) estava com path antigo
-- ============================================================
UPDATE crm_treino_licoes
SET pathname_relacionado = '/comercial/crm/regioes'
WHERE pathname_relacionado = '/comercial/crm/configuracoes';
