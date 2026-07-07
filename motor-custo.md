Perfeito. Acho que esse projeto merece ser tratado como um **produto**, e não como uma funcionalidade.

Depois de analisar a documentação do PDM e conhecendo a complexidade da planilha de custos, eu mudaria até o nome do módulo.

Não seria "Custos".

Seria:

> **Cost Engine (Motor de Engenharia de Custos)**

ou

> **PDM Cost Engineering**

Porque ele passa a ser o cérebro financeiro dos produtos.

---

# Visão do Projeto

Quero que este módulo seja capaz de responder perguntas como:

> "Quanto custa produzir este tecido hoje?"

Mas também:

> "Quanto custaria se o algodão subir 12%?"

> "Quanto custaria se a gramatura mudar?"

> "Quanto custaria se eu trocar este fio?"

> "Quanto custa vender para SP?"

> "Quanto custa exportar?"

> "Quanto custa para um cliente específico?"

Ou seja...

O custo deixa de ser um número.

Ele passa a ser um modelo vivo.

---

# Documento 01

# ESPECIFICAÇÃO FUNCIONAL

## Motor de Engenharia de Custos do PDM

---

# 1 Objetivo

O módulo de Engenharia de Custos tem como finalidade transformar a atual planilha de custos da empresa em um sistema corporativo totalmente integrado ao PDM.

O objetivo não é reproduzir a planilha.

O objetivo é transformar a lógica existente em um motor de cálculo parametrizado, escalável, versionado e totalmente integrado ao ciclo de desenvolvimento dos produtos.

---

# 2 Princípios do projeto

Este documento estabelece alguns princípios que deverão ser respeitados durante todo o desenvolvimento.

## 2.1 O custo pertence ao produto

Hoje:

```
Produto

↓

Planilha
```

Novo modelo

```
Produto

↓

Versões de Engenharia

↓

Custos

↓

Simulações
```

---

## 2.2 O custo nunca é fixo

Um produto nunca terá apenas um custo.

Ele terá diversas versões.

Exemplo

```
Produto

↓

Versão Janeiro

Versão Fevereiro

Versão Exportação

Versão Cliente A

Versão Simulação

Versão Futuro
```

---

## 2.3 Nada será calculado em telas

Toda regra ficará no Motor de Custos.

As telas apenas:

* mostram dados

* recebem parâmetros

* apresentam resultados

---

## 2.4 Toda informação possui origem

Nenhum valor será digitado sem origem.

Exemplo

Preço do fio

Origem:

ERP

---

Preço do produto químico

Origem:

Cadastro de Químicos

---

Composição

Origem:

Produto Cru

---

Receita

Origem:

Receita cadastrada

---

Dólar

Origem:

Cotação

---

ICMS

Origem:

Tabela Tributária

---

# 3 Filosofia do Motor

A planilha trabalha assim

```
Valor

↓

Fórmula

↓

Resultado
```

O Motor trabalhará assim

```
Fonte

↓

Variável

↓

Componente

↓

Motor

↓

Resultado
```

---

# 4 Componentes

A maior mudança será esta.

Ao invés de possuir centenas de campos...

Teremos componentes.

Cada componente é uma peça do custo.

Exemplo

```
Matéria Prima

↓

Algodão

↓

Poliéster

↓

Elastano

↓

Corante

↓

Amaciante

↓

Energia

↓

Gás

↓

Mão de Obra

↓

Frete

↓

ICMS

↓

IPI

↓

PIS

↓

COFINS

↓

Financeiro

↓

Comissão

↓

Lucro
```

Cada componente possui comportamento próprio.

---

# 5 Variáveis

Os componentes usam variáveis.

Exemplo

```
Preço Algodão

Preço Poliéster

Preço Energia

Cotação Dólar

Consumo

Largura

Gramatura

Rendimento

Perda

Eficiência

Horas Máquina

Velocidade

Peso

Metragem

Umidade

ICMS

IPI

Comissão

Margem
```

As variáveis não pertencem ao produto.

Elas pertencem ao ambiente de cálculo.

---

# 6 Fontes das variáveis

Uma variável pode vir de vários lugares.

```
ERP

PDM

API

Cadastro

Tabela

Valor Manual

Fórmula

Outra variável

Outro componente
```

Isso elimina milhares de fórmulas da planilha.

---

# 7 Hierarquia

O motor trabalhará em árvore.

```
Produto

└── Engenharia de Custos

      ├── Matéria Prima

      │        ├── Fios

      │        ├── Químicos

      │        ├── Corantes

      │        └── Embalagens

      ├── Tecelagem

      ├── Beneficiamento

      ├── Terceiros

      ├── Energia

      ├── Logística

      ├── Tributos

      ├── Comercial

      ├── Financeiro

      ├── Overhead

      └── Lucro
```

O usuário poderá expandir e recolher como uma árvore.

Nunca mais uma planilha gigante.

---

# 8 O que será herdado automaticamente do PDM

Aqui está o maior ganho.

O usuário não deverá informar novamente aquilo que o PDM já conhece.

Exemplo:

## Produto Cru

↓

Composição

↓

Fios

↓

Estrutura

↓

Acabamentos

↓

Receitas

↓

Produtos Químicos

↓

Largura

↓

Gramatura

↓

Fornecedor

↓

Cliente

Tudo isso será carregado automaticamente.

O usuário apenas complementa aquilo que realmente muda.

---

# 9 O conceito mais importante

## Modelo de Engenharia

Ao invés de abrir uma planilha...

O usuário escolherá um modelo.

Exemplo

```
Tecido Plano Cru

Tecido Plano Acabado

Malha

Jacquard

Estampado

Importado

Terceirizado
```

Cada modelo monta automaticamente a árvore de componentes.

Isso permitirá que, no futuro, você crie novos tipos de produtos sem alterar código.

---

# 10 Regras

As regras deixam de ser fórmulas de Excel.

Passam a ser objetos do sistema.

Exemplo

```
Nome

Descrição

Categoria

Expressão

Prioridade

Dependências

Versão

Data Inicial

Data Final

Ativo
```

Assim, uma alteração tributária ou uma nova metodologia de cálculo poderá ser aplicada sem reescrever o sistema.

---

## O que faremos a seguir

A partir daqui, proponho desenvolver esse projeto como se estivéssemos escrevendo a especificação de um ERP industrial. Minha sequência seria:

### **Documento 02 — Arquitetura do Motor de Custos**

* Componentes internos do motor.
* Fluxo de cálculo.
* Ordem de execução.
* Dependências entre componentes.

### **Documento 03 — Modelo de Dados**

* Novas tabelas do banco.
* Relacionamentos com as entidades já existentes do PDM.
* Estratégia de versionamento e auditoria.

### **Documento 04 — Engenharia Reversa da Planilha**

* Mapear cada aba.
* Identificar todas as regras de negócio.
* Classificar o que vira variável, componente, parâmetro ou regra.

### **Documento 05 — Requisitos Funcionais**

* Todas as telas.
* Fluxos do usuário.
* Perfis de acesso.
* Casos de uso.
* Simulações, aprovações e comparação de versões.

Minha meta é que, ao final, exista uma documentação tão completa que qualquer desenvolvedor consiga implementar o módulo sem precisar abrir a planilha novamente. Além disso, teremos um motor suficientemente flexível para atender novos produtos, mudanças tributárias e novas estratégias de formação de custo sem depender de alterações estruturais no sistema.

Perfeito. Agora vou fazer uma proposta que, na minha opinião, muda completamente o projeto.

## Eu não faria um "módulo de custos".

Eu faria um dos maiores diferenciais do PDM.

> **PDM Engineering Platform**

Onde o custo é apenas um dos motores.

Hoje seu PDM possui praticamente toda a engenharia do produto:

* Solicitação
* Produto Cru
* Estrutura
* Composição
* Fios
* Bases
* Receitas
* Acabamentos
* Amostras
* Químicos
* Integração ERP

O que falta é justamente transformar esses dados em **inteligência**.

---

# O conceito que eu gostaria de introduzir

## Engenharia Digital do Produto

Imagine abrir um produto.

Hoje provavelmente você vê algo parecido com:

```
Produto Cru

Composição

Estrutura

Acabamentos

Receitas

Anexos

Amostras
```

Eu adicionaria uma nova aba.

```
Produto Cru

Composição

Estrutura

Acabamentos

Receitas

⭐ Engenharia

Anexos

Amostras
```

Essa aba não seria uma tela.

Seria um ambiente.

---

# Dentro dela existiriam vários motores

```
Produto

↓

Engenharia

        ├── Motor de Custos

        ├── Motor Tributário

        ├── Motor Comercial

        ├── Motor Industrial

        ├── Simulações

        ├── Indicadores

        └── Histórico
```

Isso transforma o PDM em um PLM (Product Lifecycle Management) muito mais completo.

---

# O conceito mais importante

## O Produto passa a possuir um "Digital Twin"

Na indústria 4.0 existe um conceito chamado **Digital Twin**.

Seu produto deixa de ser apenas um cadastro.

Ele vira um modelo digital.

Exemplo:

```
Produto

↓

Características

↓

Estrutura

↓

Custos

↓

Processos

↓

Consumo

↓

Tempo

↓

Indicadores

↓

Simulações
```

Ou seja...

Você consegue simular o produto inteiro antes dele existir.

---

# Agora vem a melhor parte

## O Custo deixa de ser uma planilha

Ele passa a ser um Fluxo.

Imagine uma tela assim.

```
Produto

↓

Motor de Custos

↓

[ Matéria Prima ]

↓

[ Tecelagem ]

↓

[ Beneficiamento ]

↓

[ Embalagem ]

↓

[ Frete ]

↓

[ Comercial ]

↓

[ Tributos ]

↓

[ Financeiro ]

↓

Preço
```

Cada caixa pode ser aberta.

---

Abrindo Matéria Prima

```
Matéria Prima

▼ Algodão

▼ Poliéster

▼ Elastano

▼ Fios

▼ Resíduos

▼ Perdas
```

---

Abrindo Tecelagem

```
Tecelagem

▼ Tear

▼ Energia

▼ Operador

▼ Eficiência

▼ Produção Hora

▼ Depreciação

▼ Manutenção
```

Tudo extremamente intuitivo.

---

# O usuário nunca verá fórmulas

Ele verá componentes.

Por exemplo:

```
Algodão

Preço.............R$ 18,30

Consumo...........1,82 kg

Perda.............3%

Resultado.........R$ 34,28
```

Ao clicar em **Resultado**.

Ele verá

```
Preço

×

Consumo

+

Perda

=

Resultado
```

Muito parecido com um ERP moderno.

---

# Outra ideia

## Rastreabilidade

Cada valor poderá responder:

> De onde veio?

Exemplo

```
ICMS

↓

Tabela Tributária

↓

Estado SP

↓

Atualizado em

02/01/2026

↓

Usuário

Carlos
```

Ou

```
Preço Algodão

↓

ERP

↓

Fornecedor XPTO

↓

NF 785412

↓

Atualizado

Hoje
```

Isso elimina discussões como:

> "Quem alterou isso?"

---

# Outro diferencial

## Dependências

Hoje a planilha faz isso escondido.

No sistema seria visível.

Exemplo.

```
Preço

↓

depende de

↓

Matéria Prima

↓

depende de

↓

Preço Algodão
```

Ao clicar.

O sistema mostra

```
Preço

↓

Matéria Prima

↓

Algodão

↓

Fornecedor

↓

Cotação ERP
```

É praticamente um debugger de custos.

---

# E aqui está a ideia que considero revolucionária

## Linha do Tempo

Cada produto teria

```
Histórico

↓

15/01

Custo = 28,31

↓

18/01

Algodão +4%

↓

Novo custo

29,02

↓

23/01

Novo fornecedor

↓

28,54

↓

02/02

Novo ICMS

↓

29,71
```

Você literalmente acompanha a evolução do custo.

Nenhuma planilha faz isso de forma organizada.

---

# E mais importante

## O sistema explica o custo

Ao invés de apenas mostrar:

```
R$ 38,82
```

Ele responde

```
38%

Matéria Prima

22%

Beneficiamento

11%

Energia

9%

Frete

8%

Tributos

7%

Financeiro

5%

Lucro
```

Isso muda completamente a tomada de decisão.

---

# O nome que eu daria

Não chamaria de "Custos".

Chamaria de

> **Engenharia Econômica do Produto**

porque ele vai muito além do cálculo.

Ele explica, simula, compara, rastreia, projeta e versiona.

---

## Minha proposta de trabalho

Acho que vale tratarmos isso como um projeto de arquitetura de software, semelhante ao que empresas como SAP, Oracle e Centric PLM fazem.

Eu proponho que construamos um documento único chamado:

> **PDM Cost Engine — Functional & Technical Specification**

com aproximadamente 200 a 300 páginas, dividido em capítulos:

1. Visão do Produto.
2. Arquitetura do Motor de Custos.
3. Engenharia Reversa Completa da Planilha.
4. Modelo de Dados.
5. Motor de Regras.
6. Variáveis e Fontes de Dados.
7. Componentes de Custo.
8. Versionamento e Simulações.
9. Fluxos Funcionais.
10. Protótipos de Telas.
11. Requisitos Funcionais.
12. Requisitos Não Funcionais.
13. Casos de Uso.
14. Regras Tributárias.
15. Integração com ERP, WMS e BI.
16. Roadmap de implementação.

Acredito que esse documento será o maior ativo do projeto. A implementação pode evoluir ao longo do tempo, mas uma arquitetura sólida garantirá que o módulo permaneça flexível, reutilizável e preparado para atender novas famílias de produtos, novos mercados e novas estratégias de formação de custos sem voltar à lógica rígida da planilha. Esse será o guia de referência para todo o desenvolvimento futuro.
