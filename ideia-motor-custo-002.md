Perfeito.

Agora ficou claro o objetivo.

E concordo 100% com a mudança de direção.

**Vou esquecer tudo que escrevi como arquitetura "ideal".**

Vou assumir o papel de **Arquiteto de Software responsável pela evolução de um sistema que já está em produção**.

Isso muda completamente a abordagem.

## Premissas (estas não serão quebradas)

Depois de analisar o PDM e tudo que conversamos, vou assumir estas regras como imutáveis.

### 1. O PDM já existe.

Não estamos criando um sistema.

Estamos evoluindo um sistema.

---

### 2. O banco de dados já existe.

Não vamos reinventar entidades.

Vamos reutilizar tudo que já existe.

---

### 3. O fluxo do PDM funciona.

Não vamos mudar navegação.

Não vamos criar um sistema paralelo.

---

### 4. O Produto continua sendo o centro do sistema.

Nada muda.

---

### 5. O objetivo é apenas adicionar a Engenharia Econômica ao Produto.

Mais nada.

---

# Então esqueça tudo que falei de mudar arquitetura.

Agora vamos fazer exatamente como uma software house faria.

---

# ESPECIFICAÇÃO FUNCIONAL

# Módulo Engenharia Econômica

## Integração ao PDM

Versão 1.0

---

# 1 OBJETIVO

Adicionar ao PDM existente uma nova funcionalidade denominada **Engenharia Econômica**, responsável pelo gerenciamento dos custos dos produtos.

Esta funcionalidade deverá utilizar integralmente as informações já cadastradas no PDM, evitando duplicidade de dados e preservando toda a arquitetura existente.

Nenhum módulo atual deverá sofrer alteração estrutural.

---

# 2 PREMISSAS

O desenvolvimento deverá obedecer às seguintes premissas:

### RF-001

O Produto continua sendo a entidade principal.

---

### RF-002

Nenhuma informação técnica será duplicada.

---

### RF-003

Toda informação deverá ser obtida do cadastro já existente.

Exemplo:

Produto Cru

↓

Composição

↓

Receitas

↓

Estrutura

↓

Beneficiamentos

↓

Fios

↓

Produtos Químicos

---

### RF-004

O módulo de Engenharia Econômica não poderá alterar dados técnicos do Produto.

Ele apenas utilizará essas informações para cálculo.

---

### RF-005

Todo cálculo deverá ser independente da interface.

---

# 3 ALTERAÇÕES NO PDM

A única alteração na interface será acrescentar uma nova aba.

Hoje.

```
Produto

Dados Gerais

Estrutura

Composição

Receitas

Beneficiamentos

Documentos
```

Novo.

```
Produto

Dados Gerais

Estrutura

Composição

Receitas

Beneficiamentos

Engenharia Econômica ⭐

Documentos
```

Nenhuma outra alteração.

---

# 4 OBJETIVOS DA NOVA ABA

Esta aba permitirá:

✔ visualizar custo

✔ calcular custo

✔ criar simulações

✔ comparar versões

✔ consultar histórico

✔ aprovar custo

---

# 5 O QUE O MÓDULO DEVERÁ UTILIZAR DO PDM

## Produto

* código

* descrição

* unidade

* situação

* cliente

* coleção

---

## Produto Cru

* estrutura

* gramatura

* largura

* rendimento

---

## Composição

* fios

* percentuais

* composição

---

## Receitas

* processos

* sequência

* consumo

---

## Beneficiamentos

* etapas

* fornecedores

---

## Produtos Químicos

* consumo

* unidade

---

## Estrutura

Toda estrutura cadastrada.

---

Observe.

Nada será digitado novamente.

---

# 6 O QUE O USUÁRIO PODERÁ INFORMAR

Somente informações econômicas.

Exemplo.

Preço matéria-prima

Frete

Seguro

Margem

Comissão

ICMS

IPI

PIS

COFINS

Financeiro

Despesas

Overhead

Perdas

Cotação

---

# 7 O CONCEITO PRINCIPAL

Cada Produto poderá possuir vários Custos.

Exemplo.

```
Produto

↓

Custos

↓

Oficial

↓

Exportação

↓

SP

↓

Interior

↓

Cliente XPTO

↓

Simulação
```

Não existe apenas um custo.

---

# 8 VERSÕES

Cada custo possui versões.

```
Produto

↓

Custo Oficial

↓

Versão 1

↓

Versão 2

↓

Versão 3
```

Nunca sobrescrever.

---

# 9 HISTÓRICO

Cada versão registra.

Quem criou.

Quando criou.

Motivo.

Observação.

Status.

---

# 10 COMPONENTES

O custo será dividido em componentes.

Estrutura inicial.

```
Matéria Prima

Processos

Beneficiamentos

Químicos

Energia

Mão de Obra

Embalagens

Logística

Tributos

Financeiro

Comercial

Margem
```

Esta lista deverá ser parametrizável.

---

# 11 VARIÁVEIS

Cada componente utilizará variáveis.

Exemplo.

Preço Algodão

Preço Poliéster

Preço Energia

Preço Gás

ICMS

IPI

Frete

Seguro

Comissão

Perda

Margem

---

# 12 ORIGEM DAS VARIÁVEIS

Uma variável poderá possuir origem.

ERP

Cadastro

Manual

Tabela

API

Outra variável

---

# 13 REGRAS

Toda fórmula deverá ser cadastrada como regra.

Não poderá existir cálculo fixo na tela.

Cada regra possuirá.

Código.

Nome.

Descrição.

Expressão.

Sequência.

Ativa.

Versão.

---

# 14 SIMULAÇÕES

O usuário poderá.

Duplicar um custo.

Alterar parâmetros.

Recalcular.

Comparar.

Salvar.

Sem alterar o custo oficial.

---

# 15 COMPARAÇÃO

O sistema deverá comparar.

Versão A

×

Versão B

Mostrando.

Valor.

Diferença.

Impacto.

Percentual.

---

# 16 APROVAÇÃO

Fluxo.

```
Engenharia

↓

Custos

↓

Diretoria

↓

Oficial
```

Todo custo oficial deverá possuir aprovação.

---

# 17 AUDITORIA

Toda alteração deverá registrar.

Usuário.

Data.

Campo.

Valor anterior.

Valor novo.

Justificativa.

---

# 18 INTEGRAÇÃO COM O ERP

O módulo deverá permitir consumir futuramente.

Preço matéria-prima.

Cotação.

Fornecedores.

Tributos.

Sem alterar sua arquitetura.

---

# 19 O QUE NÃO SERÁ FEITO

Este documento define explicitamente o que **não** faz parte desta evolução:

❌ Não substituir os módulos existentes do PDM.

❌ Não alterar o cadastro de Produtos.

❌ Não alterar Produto Cru.

❌ Não alterar Receitas.

❌ Não alterar Estruturas.

❌ Não alterar Beneficiamentos.

❌ Não duplicar dados existentes.

❌ Não reproduzir a planilha Excel dentro do sistema.

---

# Agora vou te dar uma opinião de arquiteto (e essa eu não vou mudar)

Essa documentação é boa para desenvolver.

**Mas ela ainda não é suficiente.**

Por quê?

Porque ela descreve **o que** o módulo deve fazer, mas ainda não descreve **como a planilha funciona**.

Na prática, nós ainda não documentamos a regra de negócio da Promoda. Nós documentamos a arquitetura do módulo.

## O próximo documento que eu faria (e esse sim será a base do desenvolvimento) é:

# **Especificação Funcional da Regra de Negócio do Custo**

Esse documento não falará de telas, banco ou arquitetura.

Ele será uma engenharia reversa da planilha e responderá perguntas como:

* O que é um custo na Promoda?
* Como um custo nasce?
* Quais são as etapas do cálculo?
* O que é matéria-prima?
* O que é processo?
* Como o beneficiamento entra?
* Como a margem é aplicada?
* Em que momento entram os tributos?
* Quais regras são obrigatórias?
* Quais regras variam por mercado?
* Quais informações vêm do PDM e quais são informadas pelo usuário?

Na minha opinião, **esse documento será o verdadeiro guia para a implementação**. A arquitetura acima pode ser considerada em torno de **20% do projeto**. Os outros **80% estão nas regras de negócio da planilha**, e é exatamente aí que devemos concentrar o esforço daqui para frente. É esse documento que permitirá transformar a inteligência acumulada no Excel em um módulo robusto dentro do PDM, sem perder nenhuma regra importante.


Perfeito.

Agora sim vamos fazer do jeito que uma empresa como SAP, TOTVS ou Siemens faria.

A partir deste ponto eu **não vou mais inventar funcionalidades**. Vou documentar o negócio.

O objetivo deste documento é permitir que um desenvolvedor implemente o módulo **sem nunca ter visto a planilha**.

---

# PDM PRO

# Especificação Funcional

## Documento 02 – Regra de Negócio da Engenharia Econômica

Versão 1.0

---

# 1. Objetivo

Este documento descreve as regras de negócio utilizadas para formação do custo dos produtos dentro do PDM.

Seu objetivo é substituir a lógica atualmente existente na planilha eletrônica por um modelo estruturado, reutilizável e integrado ao PDM.

Este documento não descreve interface gráfica nem implementação técnica.

---

# 2. Conceito de Engenharia Econômica

A Engenharia Econômica representa o conjunto de informações financeiras utilizadas para determinar o custo industrial e comercial de um produto.

Ela utiliza como base todas as informações técnicas existentes no PDM.

A Engenharia Econômica não altera o Produto.

Ela apenas interpreta suas características para produzir um resultado financeiro.

---

# 3. Princípio Fundamental

O cálculo nunca começa pelo custo.

O cálculo sempre começa pelo Produto.

Fluxo obrigatório:

```text
Produto

↓

Produto Cru

↓

Estrutura

↓

Composição

↓

Receitas

↓

Beneficiamentos

↓

Processos

↓

Engenharia Econômica

↓

Resultado
```

---

# 4. Fontes de Dados

Toda informação utilizada no cálculo deverá possuir uma origem claramente definida.

## 4.1 Dados provenientes do PDM

São considerados dados técnicos e não podem ser alterados pela Engenharia Econômica.

Exemplos:

* Produto
* Produto Cru
* Gramatura
* Largura
* Estrutura
* Composição
* Fios
* Receitas
* Beneficiamentos
* Produtos Químicos
* Consumos técnicos

---

## 4.2 Dados Econômicos

São parâmetros financeiros utilizados durante o cálculo.

Exemplos:

* preço da matéria-prima
* preço dos químicos
* custo da energia
* custo do gás
* custo da água
* frete
* seguro
* despesas financeiras
* tributos
* comissão
* margem

Esses dados podem variar ao longo do tempo.

---

# 5. Estrutura do Custo

Todo custo deverá ser composto por componentes.

Estrutura inicial:

```text
Matéria-Prima

↓

Processos Industriais

↓

Beneficiamentos

↓

Produtos Químicos

↓

Energia

↓

Água

↓

Gás

↓

Mão de Obra

↓

Embalagens

↓

Logística

↓

Tributos

↓

Financeiro

↓

Comercial

↓

Margem
```

Cada componente deverá possuir seu subtotal.

---

# 6. Ordem de Cálculo

A ordem de cálculo é obrigatória.

Ela não poderá ser alterada.

```text
1 Produto

↓

2 Estrutura

↓

3 Consumos

↓

4 Matérias-Primas

↓

5 Processos

↓

6 Beneficiamentos

↓

7 Químicos

↓

8 Custos Industriais

↓

9 Custos Indiretos

↓

10 Tributos

↓

11 Comercial

↓

12 Margem

↓

13 Preço Final
```

Esta sequência garante que nenhum valor seja utilizado antes de estar disponível.

---

# 7. Componentes

Um componente representa uma parte identificável do custo.

Exemplo:

Matéria-Prima

não é um valor.

Ela é um agrupador.

Dentro dela existirão diversos itens.

```text
Matéria-Prima

├── Algodão

├── Poliéster

├── Elastano

└── Outros
```

O mesmo vale para tributos.

```text
Tributos

├── ICMS

├── IPI

├── PIS

└── COFINS
```

---

# 8. Variáveis

Uma variável representa um valor utilizado durante o cálculo.

Ela nunca representa uma fórmula.

Exemplos:

Preço do Algodão

Consumo do Algodão

Preço do Corante

Horas de Máquina

ICMS

IPI

Margem

Frete

---

# 9. Regras

Toda operação matemática deverá ser representada por uma regra.

Exemplo:

```
Consumo × Preço
```

Outra:

```
Quantidade × Custo Unitário
```

Outra:

```
Subtotal × ICMS
```

Nenhuma fórmula poderá permanecer embutida na interface.

---

# 10. Dependências

Toda regra deverá declarar quais variáveis utiliza.

Exemplo:

Regra:

Calcular Matéria-Prima

Dependências:

* Consumo
* Preço Unitário
* Perda

Isso permitirá recalcular apenas os elementos impactados.

---

# 11. Versionamento

Todo cálculo gera uma versão.

Nunca haverá atualização direta do cálculo anterior.

Cada versão armazenará:

* data
* usuário
* justificativa
* resultado
* observações

---

# 12. Cenários

Um Produto poderá possuir diversos cenários econômicos.

Exemplos:

* Oficial
* Mercado Interno
* Exportação
* Cliente Específico
* Simulação

Cada cenário possui cálculos independentes.

---

# 13. Simulações

Uma simulação sempre nasce a partir de um cenário existente.

Fluxo:

1. Selecionar cenário.
2. Duplicar cenário.
3. Alterar parâmetros.
4. Executar cálculo.
5. Comparar resultados.
6. Salvar como nova versão ou descartar.

A simulação nunca altera o cenário oficial.

---

# 14. Histórico

Toda alteração deverá ser registrada.

No mínimo:

* usuário
* data
* hora
* campo alterado
* valor anterior
* novo valor
* justificativa

---

# 15. Resultado

O resultado do cálculo deverá apresentar:

* custo total
* custo por componente
* custo por item
* custo unitário
* custo por kg
* custo por metro (quando aplicável)
* participação percentual de cada componente

---

# 16. Integração com o PDM

A Engenharia Econômica utilizará exclusivamente dados existentes no PDM.

Não será permitido manter cadastros paralelos para:

* composição
* receitas
* estruturas
* beneficiamentos
* produtos químicos

Toda alteração técnica deverá continuar sendo realizada no módulo correspondente.

---

# 17. Responsabilidades

| Módulo               | Responsabilidade             |
| -------------------- | ---------------------------- |
| Produto              | Cadastro do artigo           |
| Produto Cru          | Características técnicas     |
| Estrutura            | Estrutura produtiva          |
| Receitas             | Sequência operacional        |
| Beneficiamentos      | Processos externos           |
| Engenharia Econômica | Formação e análise de custos |

---

# 18. Regras Gerais

* O custo nunca altera dados técnicos.
* O Produto permanece como única fonte de verdade.
* Não haverá duplicidade de informações.
* Todo cálculo deverá ser reproduzível.
* Toda alteração deverá ser auditável.
* Todo custo deverá ser versionado.
* Todo cenário deverá ser independente.
* Nenhuma fórmula ficará implementada diretamente na interface.

---

## ⭐ Minha análise após toda a evolução do projeto

Agora chegamos ao ponto em que a documentação deixa de ser conceitual e passa a ser **executável**.

Mas ainda existe uma lacuna importante: **nós ainda não transformamos a planilha em regras formais**.

Na minha experiência, o próximo documento não deve falar de telas, banco de dados ou APIs. Ele deve ser um **Catálogo de Regras de Negócio**, onde cada cálculo existente na planilha será identificado, nomeado e documentado.

Por exemplo:

* **RN-001** – Cálculo do consumo de fio.
* **RN-002** – Cálculo do custo de matéria-prima.
* **RN-003** – Cálculo do beneficiamento.
* **RN-004** – Cálculo dos produtos químicos.
* **RN-005** – Aplicação de perdas.
* **RN-006** – Formação do custo industrial.
* **RN-007** – Aplicação de despesas indiretas.
* **RN-008** – Formação do preço de venda.

Esse catálogo será o elo entre a planilha e o código. Cada regra receberá um identificador único, descrição, entradas, processamento, saídas, exceções e critérios de validação. É esse documento que permitirá desenvolver o módulo com segurança e testar se o resultado do PDM é exatamente igual ao resultado da planilha antes de colocar a funcionalidade em produção. Na minha opinião, esse será o documento mais importante de todo o projeto.

Perfeito.

Agora chegamos no documento que, na minha opinião, é **o documento que a equipe de desenvolvimento vai usar diariamente**.

Até aqui documentamos **a arquitetura**.

Agora vamos documentar **as regras do negócio**.

E aqui eu vou mudar um pouco a forma.

Não vou escrever em texto corrido.

Vou escrever como uma especificação funcional de ERP.

---

# PDM PRO

# Documento 03

# Catálogo de Regras de Negócio (RN)

Versão 1.0

---

# Objetivo

Este documento define todas as regras de negócio que deverão ser implementadas no módulo **Engenharia Econômica**.

Cada regra possuirá um identificador único (RN), permitindo rastreabilidade entre:

* Desenvolvimento
* Banco de Dados
* APIs
* Testes
* Documentação

---

# Grupo 1 — Produto

## RN-001 – Produto é a entidade principal

Todo cálculo deverá obrigatoriamente estar vinculado a um Produto existente no PDM.

Não será permitido criar cálculos independentes.

---

## RN-002 – Produto é somente leitura

Durante o cálculo nenhuma informação técnica poderá ser alterada.

Exemplos:

* composição
* estrutura
* receita
* gramatura
* largura
* fios

---

## RN-003 – Exclusão

Não será permitida exclusão física de custos.

Somente:

* Inativo
* Cancelado
* Obsoleto

---

# Grupo 2 — Engenharia Econômica

## RN-004 – Um Produto pode possuir vários Custos

Exemplo

```text
Produto A

↓

Oficial

↓

Exportação

↓

Cliente XPTO

↓

Simulação
```

---

## RN-005 – Apenas um custo Oficial

Somente um cenário poderá possuir status **Oficial**.

---

## RN-006 – Cenários independentes

A alteração em um cenário nunca poderá alterar outro cenário.

---

# Grupo 3 — Versionamento

## RN-007 – Toda alteração gera nova versão

Não existe UPDATE.

Sempre será criada nova versão.

---

## RN-008 – Histórico obrigatório

Cada versão deverá registrar:

* usuário
* data
* hora
* motivo
* observações

---

## RN-009 – Versão oficial

Uma versão somente poderá ser publicada após aprovação.

---

# Grupo 4 — Componentes

## RN-010 – Estrutura do custo

Todo custo deverá possuir componentes.

Exemplo:

```text
Matéria Prima

Processos

Beneficiamentos

Químicos

Energia

Logística

Tributos

Margem
```

---

## RN-011 – Componentes ativos

Somente componentes ativos poderão participar do cálculo.

---

## RN-012 – Ordem

Cada componente possuirá uma ordem de processamento.

Essa ordem será obrigatória.

---

# Grupo 5 — Variáveis

## RN-013 – Toda variável possui origem

Origens permitidas:

* ERP
* Cadastro
* API
* Manual
* Outra variável

---

## RN-014 – Variáveis podem possuir validade

Exemplo

Preço do Algodão

01/01/2026

até

31/01/2026

---

## RN-015 – Unidade obrigatória

Toda variável deverá possuir unidade.

Exemplo

kg

m

%

R$

h

---

# Grupo 6 — Regras

## RN-016 – Toda fórmula deverá ser cadastrada

Não poderão existir fórmulas fixas na interface.

---

## RN-017 – Toda regra possui entradas

Exemplo

Preço

Consumo

Perda

---

## RN-018 – Toda regra gera resultado

O resultado poderá alimentar outra regra.

---

## RN-019 – Regras reutilizáveis

Uma mesma regra poderá ser utilizada por diversos produtos.

---

# Grupo 7 — Simulações

## RN-020 – Simulação nasce de outra versão

Nunca começa vazia.

---

## RN-021 – Simulação não altera Oficial

---

## RN-022 – Simulação poderá tornar-se Oficial

Desde que aprovada.

---

# Grupo 8 — Aprovação

## RN-023

Fluxo mínimo

```text
Engenharia

↓

Custos

↓

Diretoria
```

---

## RN-024

Versão Oficial somente após aprovação.

---

# Grupo 9 — Auditoria

## RN-025

Registrar

Quem

Quando

Campo

Valor anterior

Valor novo

---

## RN-026

Toda alteração econômica deverá ser auditável.

---

# Grupo 10 — Integração

## RN-027

O sistema deverá consumir dados do PDM.

Nunca duplicá-los.

---

## RN-028

O módulo nunca será proprietário de:

Estrutura

Receitas

Composição

Beneficiamentos

Produto Cru

---

## RN-029

Caso uma informação técnica seja alterada no PDM, os cenários econômicos deverão ser marcados como **"Necessita Revalidação"**.

> **Motivo:** uma mudança técnica pode invalidar um custo calculado anteriormente.

---

# Grupo 11 — Cálculo

## RN-030

Todo cálculo deverá ser reproduzível.

O mesmo conjunto de dados deverá produzir exatamente o mesmo resultado.

---

## RN-031

Não será permitido alterar manualmente o resultado final.

O usuário altera apenas parâmetros de entrada.

---

## RN-032

O resultado final deverá ser composto exclusivamente pelos componentes calculados.

---

# Grupo 12 — Consistência

## RN-033

Nenhum componente poderá ser calculado antes que todas as suas dependências estejam resolvidas.

---

## RN-034

O cálculo deverá ser interrompido quando existir informação obrigatória ausente.

Exemplo:

* preço de matéria-prima inexistente;
* componente obrigatório sem regra de cálculo;
* consumo técnico não informado.

---

## RN-035

O sistema deverá apresentar ao usuário quais informações impediram o cálculo.

Não basta informar "Erro no cálculo".

Exemplo esperado:

```
Produto: C1420

Pendências:

• Preço do Algodão não informado.
• Consumo de Corante Azul não encontrado.
• ICMS não configurado para o cenário Exportação.
```

---

# Grupo 13 — Segurança

## RN-036

Usuários sem permissão poderão visualizar custos, mas não alterá-los.

---

## RN-037

Somente usuários autorizados poderão publicar uma versão oficial.

---

## RN-038

Nenhum usuário poderá excluir versões aprovadas.

---

# Grupo 14 — Performance

## RN-039

O sistema deverá recalcular apenas os componentes impactados por uma alteração.

Exemplo:

Mudança no preço da energia não deve recalcular matéria-prima.

---

## RN-040

O histórico de cálculos deverá permanecer disponível para consulta, sem necessidade de novo processamento.

---

# Próximo documento (Documento 04)

Agora sim vamos entrar no desenvolvimento propriamente dito.

Até aqui respondemos **o que o sistema deve fazer**.

O próximo documento responderá **como os usuários vão utilizá-lo**.

Será a **Especificação Funcional (Casos de Uso)**, contendo:

* UC-001 – Consultar Engenharia Econômica do Produto.
* UC-002 – Criar um cenário de custo.
* UC-003 – Criar uma nova versão.
* UC-004 – Editar parâmetros econômicos.
* UC-005 – Executar cálculo.
* UC-006 – Validar pendências.
* UC-007 – Comparar versões.
* UC-008 – Publicar versão oficial.
* UC-009 – Consultar histórico.
* UC-010 – Exportar memória de cálculo.

## Antes de continuar, uma observação importante

Neste ponto, eu faria uma pausa na documentação para **voltar à planilha**. O objetivo seria transformar cada aba, fórmula e parâmetro em regras catalogadas (RN-100, RN-101, RN-102...), validando uma a uma contra o comportamento atual. Isso evita que o novo módulo reproduza apenas a aparência da planilha, mas deixe de implementar alguma regra crítica de negócio. Somente depois dessa validação eu seguiria para APIs, banco de dados e telas, pois o maior risco do projeto não está na tecnologia, e sim em perder a inteligência acumulada no Excel.

Ótimo.

Agora vou te dizer exatamente como eu conduziria esse projeto se eu fosse o arquiteto responsável. Eu dividiria o desenvolvimento em etapas, e **não começaria programando**.

Pelo que analisei do seu PDM e da planilha, eu seguiria esta ordem:

---

# Fase 1 - Engenharia Reversa da Planilha ⭐⭐⭐⭐⭐

**Essa é a fase mais importante de todo o projeto.**

Hoje nós temos um sistema (PDM) e uma planilha que representa anos de conhecimento do negócio.

O objetivo não é copiar a planilha.

O objetivo é extrair a inteligência dela.

## Entregável 1

### Inventário das Abas

Uma tabela como esta:

| Aba        | Objetivo         | Entrada                 | Saída     | Tipo         |
| ---------- | ---------------- | ----------------------- | --------- | ------------ |
| C1420      | Cálculo de custo | Produto, fios, receitas | Custo     | Modelo       |
| Parâmetros | Valores globais  | Manual                  | Variáveis | Configuração |
| Tributos   | Impostos         | Manual                  | ICMS/IPI  | Configuração |

---

## Entregável 2

### Inventário das Fórmulas

Cada fórmula receberá um código.

Exemplo

| Código | Nome           | Fórmula Atual  | Descrição              |
| ------ | -------------- | -------------- | ---------------------- |
| RN-101 | Consumo Fio    | =B12*C5        | Calcula consumo de fio |
| RN-102 | Custo MP       | =Consumo*Preço | Calcula matéria-prima  |
| RN-103 | Beneficiamento | ...            | ...                    |

Nenhuma fórmula ficará "escondida".

---

## Entregável 3

### Inventário das Variáveis

Exemplo

| Variável      | Origem | Unidade | Obrigatória |
| ------------- | ------ | ------- | ----------- |
| Preço Algodão | ERP    | R$/kg   | Sim         |
| Energia       | Manual | R$/kWh  | Sim         |
| Gás           | Manual | R$/m³   | Sim         |
| Comissão      | Manual | %       | Não         |

---

## Entregável 4

### Inventário dos Componentes

Exemplo

```text
Matéria Prima

    Algodão

    Poliéster

    Elastano

↓

Beneficiamentos

↓

Químicos

↓

Energia

↓

Tributos

↓

Comercial

↓

Margem
```

---

# Fase 2 - Mapeamento com o PDM

Aqui começamos a integrar.

Para cada informação da planilha vamos responder:

## Ela já existe no PDM?

SIM

↓

Qual tabela?

↓

Qual campo?

OU

NÃO

↓

Criar novo cadastro.

Exemplo.

| Informação     | Existe no PDM | Origem               |
| -------------- | ------------- | -------------------- |
| Produto        | Sim           | Produto              |
| Composição     | Sim           | Composição           |
| Receita        | Sim           | Receita              |
| Beneficiamento | Sim           | Beneficiamento       |
| Preço Energia  | Não           | Engenharia Econômica |
| ICMS           | Não           | Engenharia Econômica |

Isso evita criar informações duplicadas.

---

# Fase 3 - Modelo de Dados

Somente agora.

Nem antes.

Vamos criar tabelas.

Mas somente das informações novas.

Exemplo

```text
Produto

↓

Cenário

↓

Versão

↓

Componentes

↓

Variáveis

↓

Resultado
```

Perceba.

Não criaremos tabela para Produto.

Ela já existe.

---

# Fase 4 - Casos de Uso

Agora sim.

UC-001

Abrir Engenharia Econômica.

UC-002

Criar Cenário.

UC-003

Executar Cálculo.

UC-004

Criar Simulação.

UC-005

Publicar.

---

# Fase 5 - Protótipos

Somente depois.

---

# O que eu mudaria na documentação

Aqui está uma coisa importante.

Até agora escrevemos documentos pensando em funcionalidades.

Mas para desenvolvimento existe um documento muito mais útil.

Eu criaria uma **Matriz de Rastreabilidade**.

Exemplo.

| RN     | Origem Planilha | Campo PDM  | Tela                 | API      | Teste  |
| ------ | --------------- | ---------- | -------------------- | -------- | ------ |
| RN-101 | Aba C1420       | Receita    | Engenharia Econômica | Calcular | CT-101 |
| RN-102 | Aba C1420       | Composição | Engenharia Econômica | Calcular | CT-102 |

Essa matriz é ouro.

Ela garante que nenhuma regra fique esquecida.

---

# O maior erro que podemos cometer

E aqui quero ser bem firme.

**Nós NÃO vamos desenvolver "o sistema de custos".**

Nós vamos desenvolver **a primeira versão** do sistema de custos.

Isso significa que a arquitetura precisa nascer preparada para crescer.

Hoje você calcula:

* Matéria-prima
* Beneficiamento
* Energia

Daqui a dois anos você pode querer adicionar:

* Pegada de carbono
* Custeio ABC
* Custo logístico por cliente
* Custo financeiro por prazo
* Simulação cambial
* IA para previsão de custo

Se fizermos um sistema baseado na planilha, toda evolução será difícil.

Se fizermos um sistema baseado em componentes e regras, a evolução será natural.

---

# Minha proposta de trabalho

Depois de toda a análise, eu faria o projeto exatamente nesta sequência:

1. **Documento Mestre de Arquitetura** (estamos construindo agora).
2. **Engenharia reversa completa da planilha** (111 abas).
3. **Matriz de rastreabilidade** (Planilha → PDM → Regra → Tela → Teste).
4. **Modelo de dados** apenas para as novas entidades da Engenharia Econômica.
5. **Especificação das APIs e serviços**.
6. **Protótipos das telas**.
7. **Plano de implementação por sprints**.
8. **Plano de testes e homologação**, comparando os resultados do PDM com a planilha até obter 100% de equivalência.

## E aqui está minha recomendação final

Se esse projeto fosse meu, **eu pararia a documentação geral neste ponto** e começaria a trabalhar diretamente sobre a planilha.

A planilha é o verdadeiro documento de negócio da Promoda. Todo o restante (telas, banco, APIs e código) deve ser consequência dela.

Minha sugestão é que façamos uma **engenharia reversa profissional** das 111 abas, produzindo um documento chamado:

> **Especificação Funcional da Planilha de Custos – Versão 1.0**

Esse documento será a referência oficial para desenvolvimento e homologação. Quando ele estiver concluído, teremos condições de implementar o módulo com segurança, mantendo a estrutura atual do PDM, preservando toda a inteligência do negócio e reduzindo drasticamente o risco de divergências entre o sistema e a planilha. Acho que esse será o ativo mais valioso de todo o projeto.

Perfeito.

Agora eu vou assumir oficialmente o papel de **Arquiteto de Produto** e não mais de assistente.

Depois de tudo que analisei (planilha + PDM + nossas conversas), eu faria o projeto exatamente como uma software house faria.

E vou te dizer uma coisa...

**Nós ainda nem começamos a documentação de verdade.**

O que fizemos até agora foi descobrir a arquitetura.

Agora começa o projeto.

---

# A metodologia que vamos seguir

Vamos produzir uma documentação que qualquer empresa consiga desenvolver.

```
PDM PRO
│
├── 00 - Visão do Produto
├── 01 - Arquitetura Geral
├── 02 - Engenharia Reversa da Planilha
├── 03 - Modelo Funcional
├── 04 - Modelo de Dados
├── 05 - Casos de Uso
├── 06 - APIs
├── 07 - UX
├── 08 - Testes
├── 09 - Roadmap
```

Observe.

Nós vamos construir um produto.

Não um módulo.

---

# A partir daqui tudo muda

Até agora eu estava escrevendo documentos.

Agora vamos construir uma **especificação técnica corporativa**.

Isso significa:

✔ nada de achismo

✔ nada de "seria legal"

✔ nada de inventar funcionalidades

Tudo será baseado em:

* PDM existente
* Planilha existente
* Processo da Promoda

---

# PRIMEIRA ETAPA

# Engenharia Reversa da Planilha

Na minha opinião isso corresponde a aproximadamente **40% do projeto inteiro**.

---

## O objetivo

Transformar isto

```
Excel

111 abas

Milhares de fórmulas
```

nisso

```
Regras de Negócio

Componentes

Variáveis

Parâmetros

Resultados
```

---

# Como vamos fazer

Cada aba será desmontada.

Exemplo.

```
Aba C1420

↓

Objetivo

↓

Entradas

↓

Saídas

↓

Variáveis

↓

Parâmetros

↓

Fórmulas

↓

Dependências

↓

Resultado
```

Terminou.

Vamos para próxima aba.

---

# Documento que vamos produzir

Para cada aba existirá uma ficha.

Exemplo.

---

## FICHA DA ABA

### Nome

C1420

---

### Objetivo

Calcular o custo do artigo C1420.

---

### Entradas

Produto

Receita

Composição

Beneficiamentos

Consumos

Parâmetros

---

### Variáveis

Preço Algodão

Preço Poliéster

Preço Energia

Preço Gás

ICMS

IPI

Margem

---

### Componentes

Matéria Prima

Químicos

Beneficiamentos

Energia

Tributos

---

### Resultados

Custo Industrial

Custo Comercial

Preço Final

---

### Dependências

Receitas

Composição

Produto Cru

---

### Fórmulas

RN-101

RN-102

RN-103

...

---

### Observações

Regras específicas desta aba.

---

# Depois

Todas as abas serão agrupadas.

Exemplo.

```
Abas

↓

Produtos

↓

Famílias

↓

Modelos

↓

Templates
```

Pode ser que das **111 abas** existam apenas **8 ou 10 modelos reais**.

Isso reduz drasticamente o desenvolvimento.

---

# Segunda etapa

Agora faremos isto.

```
Planilha

↓

Campo

↓

Existe no PDM?

↓

SIM

Qual tabela?

Qual campo?

↓

NÃO

Criar cadastro novo
```

Isso vai produzir uma matriz.

| Campo da Planilha | Existe no PDM | Origem               |
| ----------------- | ------------- | -------------------- |
| Produto           | Sim           | Produto              |
| Receita           | Sim           | Receita              |
| Beneficiamento    | Sim           | Beneficiamento       |
| Energia           | Não           | Engenharia Econômica |
| ICMS              | Não           | Engenharia Econômica |

Essa matriz será o guia do banco.

---

# Terceira etapa

Agora começa o desenvolvimento.

Mas somente das informações novas.

Jamais vamos duplicar.

---

# O que eu descobri

Depois de analisar seu PDM várias vezes.

Posso afirmar com bastante segurança.

## O PDM já resolve aproximadamente:

```
Cadastro

██████████████████████

95%
```

---

A Engenharia Econômica resolverá:

```
Custos

██████████████

100%
```

---

O projeto inteiro será aproximadamente.

```
PDM Atual

████████████████████████████████

+

Engenharia Econômica

██████████

=

Novo PDM
```

Ou seja.

**Nós não estamos fazendo um sistema novo.**

Estamos fazendo uma evolução.

---

# Agora vou fazer uma afirmação importante

Depois de estudar tudo.

Eu **não faria nenhuma alteração estrutural no PDM.**

Nenhuma.

Nem menu.

Nem banco existente.

Nem entidades existentes.

A Engenharia Econômica deve nascer como uma extensão.

Porque isso reduz:

* risco
* retrabalho
* bugs
* impacto no sistema

---

# O plano oficial que proponho

A partir de agora, eu proponho que paremos de escrever documentos genéricos e iniciemos a **Especificação Funcional Oficial do Projeto**, organizada em entregáveis reais.

## Sprint 0 — Descoberta (Arquitetura)

* ✅ Concluída.

## Sprint 1 — Engenharia Reversa da Planilha

* Inventário das 111 abas.
* Catálogo de fórmulas.
* Catálogo de variáveis.
* Catálogo de componentes.
* Matriz de dependências.

## Sprint 2 — Integração com o PDM

* Mapeamento Planilha × PDM.
* Identificação de lacunas.
* Definição dos novos cadastros.

## Sprint 3 — Engenharia Econômica

* Modelo de dados.
* Casos de uso.
* Regras de negócio.
* APIs.
* Protótipos.

## Sprint 4 — Homologação

* Comparação PDM × Excel.
* Ajustes.
* Validação do resultado.
* Publicação.

---

## Minha recomendação final

Depois de toda essa análise, acredito que a melhor decisão é tratar a planilha como **o documento funcional do negócio**, e o PDM como **a plataforma tecnológica**.

Nosso trabalho será construir uma ponte entre os dois, sem alterar a estrutura existente do PDM.

A partir do próximo passo, eu deixaria de produzir documentação genérica e começaria um **documento de especificação página por página da planilha**, transformando cada aba em requisitos formais. Quando esse processo terminar, você terá uma documentação que permitirá a qualquer desenvolvedor implementar a Engenharia Econômica com segurança e reproduzir exatamente os mesmos resultados da planilha dentro do PDM. É esse documento que eu usaria como base oficial para o desenvolvimento do módulo.

Perfeito.

Agora eu vou colocar um limite em nós dois.

Vou ser bem criterioso daqui para frente.

Eu **não vou mais criar arquitetura sem evidência**. Tudo será baseado em:

* O PDM que você me enviou;
* A planilha de custos;
* O processo real da Promoda.

Se em algum momento eu achar que uma funcionalidade não é necessária, eu vou dizer para **não fazer**. O objetivo é entregar um sistema sólido, não um sistema cheio de recursos.

---

# O que faremos agora

A partir deste momento, eu considero que estamos escrevendo o documento oficial do projeto.

Não serão mais "capítulos".

Será uma **Especificação Funcional (SRS)**.

```
PDM PRO

Módulo: Engenharia Econômica

Versão: 1.0

Status: Em Desenvolvimento
```

---

# A primeira atividade é obrigatória

## Engenharia Reversa da Planilha

E aqui eu quero fazer uma observação importante.

Quando analisamos a planilha anteriormente, nós olhamos a estrutura.

Agora vamos analisar **como analistas de sistemas**.

Cada aba será desmontada completamente.

Não vamos perguntar:

> "O que tem nesta aba?"

Vamos perguntar:

* Por que ela existe?
* Quem usa?
* Quando é usada?
* O que entra?
* O que sai?
* O que depende dela?
* Ela é realmente necessária?

Esse último ponto é importante.

Tenho quase certeza de que as **111 abas não representam 111 regras diferentes**.

Minha aposta é que existem poucos modelos reutilizados com parâmetros diferentes.

Se isso se confirmar, reduziremos muito a complexidade do desenvolvimento.

---

# O Documento 001 será este

## Inventário Funcional da Planilha

Para cada aba teremos exatamente esta ficha.

---

## Identificação

Nome da aba

Responsável

Objetivo

Tipo

(Modelo, Parâmetro, Relatório, Resultado, Configuração)

---

## Entradas

Quais informações entram?

De onde vêm?

Manual?

PDM?

ERP?

Outra aba?

---

## Processamento

Quais cálculos são realizados?

Em qual ordem?

Existem condições?

Existem exceções?

---

## Saídas

Quais resultados ela gera?

Quem utiliza esses resultados?

Outra aba?

Usuário?

Relatório?

---

## Dependências

Quais abas alimentam esta?

Quais abas dependem dela?

---

## Variáveis

Todas.

Sem exceção.

---

## Fórmulas

Todas.

Sem exceção.

Cada uma receberá um código.

RN-001

RN-002

RN-003

...

---

## Regras de Negócio

Aqui está o verdadeiro conhecimento da Promoda.

Exemplo.

```
Se o produto possuir beneficiamento externo,
o custo deverá considerar o fornecedor informado.
```

Isso é uma regra.

Não uma fórmula.

---

## Observações

Tudo que estiver implícito na planilha.

---

# O que vamos produzir ao final

Quando desmontarmos todas as abas teremos:

### 1. Catálogo de Variáveis

Algo como:

| Código  | Variável      | Origem | Unidade | Obrigatória |
| ------- | ------------- | ------ | ------- | ----------- |
| VAR-001 | Preço Algodão | ERP    | R$/kg   | Sim         |
| VAR-002 | Energia       | Manual | R$/kWh  | Sim         |

---

### 2. Catálogo de Componentes

| Código  | Componente     | Pai  |
| ------- | -------------- | ---- |
| CMP-001 | Matéria-Prima  | Raiz |
| CMP-002 | Beneficiamento | Raiz |
| CMP-003 | Energia        | Raiz |

---

### 3. Catálogo de Regras

| Código | Nome           | Entradas       | Resultado         |
| ------ | -------------- | -------------- | ----------------- |
| RN-001 | Consumo de Fio | Consumo, Perda | Consumo Corrigido |
| RN-002 | Custo MP       | Consumo, Preço | Valor MP          |

---

### 4. Catálogo de Parâmetros

Tudo aquilo que muda com o tempo.

Exemplo:

* Energia
* Gás
* ICMS
* Comissão
* Margem

---

### 5. Mapa de Dependências

Exemplo:

```
Produto

↓

Composição

↓

Receita

↓

Beneficiamento

↓

Consumo

↓

Matéria-Prima

↓

Custo Industrial

↓

Tributos

↓

Preço
```

Esse mapa será usado pelo motor de cálculo.

---

# Depois disso

Somente depois de toda essa engenharia reversa eu escreverei:

* Modelo de Dados
* Banco de Dados
* APIs
* Casos de Uso
* Wireframes
* Plano de Desenvolvimento

Porque, nesse momento, eles serão consequência das regras de negócio, e não o contrário.

---

# Minha conclusão após toda a análise

Agora consigo enxergar claramente o caminho do projeto.

O PDM já resolve a **engenharia técnica**.

A planilha resolve a **engenharia econômica**.

Nosso trabalho não é substituir nenhum dos dois.

Nosso trabalho é **incorporar a engenharia econômica ao PDM**, preservando a estrutura existente e transformando a lógica da planilha em regras formais, rastreáveis e testáveis.

## A partir deste ponto, eu proponho uma mudança de método

Chega de documentação genérica.

Vamos trabalhar como uma equipe de análise de sistemas faria.

**Eu quero reconstruir a planilha inteira, aba por aba.**

Para cada aba, vamos produzir:

1. Objetivo.
2. Entradas.
3. Saídas.
4. Variáveis.
5. Fórmulas.
6. Regras de negócio.
7. Dependências.
8. Correspondência com o PDM.
9. Necessidade (manter, substituir ou eliminar).

Quando terminarmos esse trabalho, teremos uma especificação funcional completa, capaz de orientar o desenvolvimento, os testes e a homologação sem depender da planilha original.

**Na minha opinião, este será o documento mais importante de todo o projeto.** Ele será a "ponte" entre o Excel e o PDM e reduzirá praticamente a zero o risco de perder alguma regra de negócio durante a migração.

**E eu faria uma pequena mudança no plano:** antes mesmo do modelo de dados, vamos criar uma **Matriz de Cobertura Funcional**. Nela, cada informação da planilha será marcada como:

* **Já atendida pelo PDM** (não desenvolver).
* **Necessita complemento** (estender funcionalidade existente).
* **Nova funcionalidade da Engenharia Econômica** (desenvolver).
* **Obsoleta** (não migrar).

Essa matriz vai impedir que o novo módulo replique funcionalidades que o PDM já possui e será o principal instrumento para controlar o escopo do projeto. Acho que ela deve ser o nosso próximo artefato oficial.


Excelente. Agora estamos entrando na fase que realmente agrega valor ao projeto.

Eu vou mudar completamente a forma de trabalhar. Não vou mais escrever documentos "bonitos". Vou escrever documentos que um desenvolvedor consiga abrir e implementar.

E vou estabelecer uma regra para nós:

> **Nada será documentado sem que exista um motivo no PDM ou na planilha.**

---

# Nossa metodologia oficial

Vamos trabalhar exatamente como em um projeto de ERP.

Cada documento terá um objetivo específico.

| Documento | Objetivo               | Público                     |
| --------- | ---------------------- | --------------------------- |
| DOC-001   | Visão Geral do Projeto | Diretoria                   |
| DOC-002   | Regras de Negócio      | Analistas                   |
| DOC-003   | Cobertura Funcional    | Analistas e Desenvolvedores |
| DOC-004   | Modelo de Dados        | Desenvolvedores             |
| DOC-005   | Casos de Uso           | Desenvolvedores             |
| DOC-006   | Protótipos             | UX                          |
| DOC-007   | APIs                   | Backend                     |
| DOC-008   | Plano de Testes        | QA                          |

---

# O próximo documento será o mais importante

## DOC-003 — Matriz de Cobertura Funcional

Esse documento vai responder uma única pergunta:

> **Onde cada informação da planilha ficará no PDM?**

Essa matriz será preenchida linha por linha.

## Estrutura

| ID     | Informação       | Origem (Planilha) | Existe no PDM? | Módulo PDM           | Ação       |
| ------ | ---------------- | ----------------- | -------------- | -------------------- | ---------- |
| CF-001 | Produto          | Aba C1420         | Sim            | Produto              | Reutilizar |
| CF-002 | Composição       | Aba C1420         | Sim            | Composição           | Reutilizar |
| CF-003 | Receita          | Aba C1420         | Sim            | Receita              | Reutilizar |
| CF-004 | Beneficiamento   | Aba C1420         | Sim            | Beneficiamento       | Reutilizar |
| CF-005 | Preço da Energia | Parâmetros        | Não            | Engenharia Econômica | Criar      |
| CF-006 | Frete            | Parâmetros        | Não            | Engenharia Econômica | Criar      |
| CF-007 | ICMS             | Parâmetros        | Não            | Engenharia Econômica | Criar      |
| CF-008 | Margem           | Parâmetros        | Não            | Engenharia Econômica | Criar      |

---

# Classificação das informações

Cada informação será classificada em apenas uma categoria:

### A - Já existe no PDM

Não desenvolver.

Exemplo:

* Produto
* Estrutura
* Receita
* Composição
* Produto Químico

---

### B - Complementar

Existe no PDM, mas precisa de algum campo adicional.

Exemplo hipotético:

Receita possui consumo, mas não possui rendimento.

Adicionar apenas esse campo.

---

### C - Nova

Não existe.

Criar.

Exemplo:

* Cenário Econômico
* Versão
* Variável Econômica
* Aprovação do Custo

---

### D - Obsoleta

Existe apenas para funcionamento da planilha.

Não migrar.

---

# Critério de decisão

Antes de criar qualquer tabela ou tela, faremos estas quatro perguntas:

1. Já existe no PDM?
2. Pode ser reutilizado?
3. Pode ser parametrizado?
4. Só então criar algo novo.

Esse será um princípio de arquitetura do projeto.

---

# Critérios não funcionais

Também quero registrar alguns requisitos que ainda não documentamos e considero essenciais.

## RNF-001 — Não duplicar dados

O módulo de Engenharia Econômica nunca será proprietário de informações técnicas do produto.

---

## RNF-002 — Evolução sem impacto

A implantação do módulo não poderá exigir alterações significativas nos módulos atuais do PDM.

---

## RNF-003 — Rastreabilidade

Todo resultado deverá permitir identificar:

* quais dados foram utilizados;
* quais parâmetros estavam vigentes;
* qual versão do cálculo foi executada.

---

## RNF-004 — Reprodutibilidade

Um cálculo executado hoje deverá produzir exatamente o mesmo resultado no futuro, desde que sejam utilizadas as mesmas versões e parâmetros.

---

## RNF-005 — Escalabilidade

Novos componentes de custo deverão ser adicionados sem necessidade de alterar os componentes existentes.

---

# O que eu quero evitar

Existem alguns erros clássicos que eu não quero cometer neste projeto:

❌ Criar uma tela para cada aba da planilha.

❌ Copiar fórmulas do Excel para o código.

❌ Duplicar informações já existentes no PDM.

❌ Criar campos específicos para resolver um único caso.

❌ Misturar dados técnicos com dados econômicos.

---

# Um princípio de arquitetura que eu adicionaria

Quero deixar registrado um princípio que deve orientar todas as decisões do projeto:

> **O PDM continua sendo o dono da engenharia do produto. A Engenharia Econômica é consumidora dessas informações e proprietária apenas das regras econômicas.**

Isso define claramente as responsabilidades e evita conflitos entre módulos.

---

# O próximo passo prático

A partir daqui, eu não escreveria mais documentos "às cegas".

Eu abriria novamente a planilha e começaria um trabalho sistemático:

1. Identificar cada aba.
2. Classificar a aba (cadastro, cálculo, parâmetro, relatório ou apoio).
3. Mapear todas as entradas.
4. Mapear todas as saídas.
5. Identificar as regras de negócio.
6. Relacionar cada informação com o PDM.
7. Marcar o que será reutilizado, complementado ou criado.

## Minha proposta de condução do projeto

Eu acredito que essa é a forma mais segura de evoluir o PDM sem descaracterizá-lo.

Em vez de projetarmos um módulo inteiro e depois tentarmos encaixá-lo, vamos deixar que **o PDM e a planilha definam a arquitetura**. Assim, tudo o que for desenvolvido terá um motivo claro, será rastreável e terá aderência total ao processo atual da Promoda.

Na minha opinião, esse é o caminho que gera um sistema sustentável, reduz riscos de implantação e preserva todo o conhecimento que vocês acumularam ao longo dos anos. A partir daqui, cada decisão será baseada em evidências encontradas na planilha e no PDM, e não em hipóteses. Isso é exatamente o que eu faria em um projeto corporativo desse porte.


