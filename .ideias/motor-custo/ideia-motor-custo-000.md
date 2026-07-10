Engenharia reversa completa da planilha de cálculo de custo

* **111 abas**
* milhares de células preenchidas
* centenas (provavelmente milhares) de fórmulas
* diversas tabelas de cálculo de custo
* planilhas-base, tabelas auxiliares, tabelas por região (SP, Interior, CIF, FOB, 7%, 12%, etc.), centros de custo e fichas de produtos.

Isso é praticamente um **sistema de custeio implementado em Excel**, não apenas uma planilha.

## O que vou documentar

A documentação ficará em nível profissional, semelhante a documentação funcional de um ERP.

### Fase 1 — Arquitetura Geral

* Objetivo da planilha
* Fluxo completo
* Como as abas se relacionam
* Dependências
* Fluxograma
* Estrutura lógica

---

### Fase 2 — Inventário de todas as abas

Para cada uma das **111 abas**:

* finalidade
* usuário responsável
* entradas
* saídas
* dependências
* células importantes
* intervalos utilizados
* observações

---

### Fase 3 — Engenharia das fórmulas

Para cada fórmula relevante:

* explicação
* objetivo
* variáveis utilizadas
* origem dos dados
* destino
* riscos
* exemplos

Exemplo:

```
=SE(E10="";0;E10*F10)

Descrição

Se não existir custo informado,
retorna zero.

Caso exista,
multiplica quantidade × custo unitário,
obtendo o custo parcial.
```

---

### Fase 4 — Conceitos de negócio

Vou identificar toda a regra de negócio existente, por exemplo:

* Custo Industrial
* Custo de Beneficiamento
* ICMS
* IPI
* Comissão
* Frete CIF
* Frete FOB
* Impostos
* Margem
* Overhead
* Centro de custo
* Custo Administrativo
* Custo Financeiro
* Despesas Comerciais
* Formação de preço

Mesmo que não estejam documentados hoje.

---

### Fase 5 — Mapeamento das dependências

Vou montar diagramas como:

```
Tabela Mochila
        │
        ▼
B0010
        │
        ▼
Tabela SP
        │
        ▼
Preço Final
```

e

```
CENTRO DE CUSTO
        │
        ▼
Custo dos Tecidos
        │
        ▼
Produto
        │
        ▼
Preço Venda
```

---

### Fase 6 — Dicionário de Dados

Para cada campo:

| Campo | Descrição | Origem | Tipo | Fórmula | Utilização |
| ----- | --------- | ------ | ---- | ------- | ---------- |

---

### Fase 7 — Manual Operacional

Como utilizar a planilha.

* atualização mensal
* troca de custos
* inclusão de novos tecidos
* inclusão de novas famílias
* atualização de impostos
* atualização de centros de custo

---

### Fase 8 — Análise Técnica

Vou apontar:

* fórmulas duplicadas
* fórmulas perigosas
* referências quebradas
* planilhas redundantes
* riscos
* melhorias possíveis

sem alterar o funcionamento atual.

---

### Fase 9 — Modelo Matemático

Vou transformar as fórmulas do Excel em regras matemáticas documentadas.

Exemplo:

```
Preço Final

=

Custo do Produto
+
Beneficiamento
+
Frete
+
Comissão
+
Impostos
+
Margem
```

com todas as equações detalhadas.

---

### Fase 10 — Especificação para desenvolvimento

Esta será a documentação que um desenvolvedor poderá utilizar para reconstruir o sistema em:

* JavaScript --> next.js
* Banco de dados --> PostgreSQL

sem depender do Excel.

## Entrega

Pretendo entregar em um documento estruturado com aproximadamente:

* **250 a 500 páginas**, dependendo da complexidade encontrada.

Esse documento será muito mais completo do que um simples manual de uso: será uma **documentação funcional e técnica completa**, permitindo entender toda a lógica da planilha e servir de base para migração para um sistema.

**Minha sugestão é fazer essa documentação por etapas (aba por aba), exatamente como fizemos com o projeto do PDM**, para garantir que nenhuma regra de negócio seja perdida e que o resultado seja sólido e utilizável pela equipe de desenvolvimento.

Perfeito. Vou manter o foco na engenharia reversa da planilha, sem assumir nada que não esteja nela.

Com a análise estrutural inicial, já foi possível confirmar alguns pontos importantes:

* A pasta possui **111 abas**, indicando que ela foi construída como um sistema de custeio completo, e não apenas como uma planilha de cálculos.
* A nomenclatura das abas mostra uma arquitetura organizada por **bases históricas**, **custos**, **tabelas auxiliares**, **tabelas comerciais** e **simulações de preço**.
* A documentação será construída de forma que um desenvolvedor consiga reproduzir toda a lógica posteriormente.

## Estrutura macro identificada

Pelas abas, é possível separar o sistema em grandes módulos.

### Módulo 1 – Bases Históricas

Exemplos:

* Página1
* 2018 - Euler
* 2021 - Euler

Provavelmente armazenam versões ou parâmetros históricos utilizados como referência.

---

### Módulo 2 – Custos Industriais

Encontrado:

* Custo dos Tecidos

Este tende a ser o núcleo do sistema.

Nele esperamos encontrar:

* matéria-prima
* beneficiamento
* composição do tecido
* perdas
* custo industrial

Esta aba será analisada célula por célula.

---

### Módulo 3 – Tabelas Comerciais

Exemplos:

* Tabela Mochila 7%
* Tabela Mochila 12%
* Tabela Mochila SP

Essas abas indicam que existem diferentes regras comerciais conforme:

* estado
* alíquota de ICMS
* região
* modalidade de venda

---

### Módulo 4 – Produtos

Foram encontrados exemplos como:

* Mochila
* Mochila SP
* B0010
* B0011 Calçado

Tudo indica que cada família ou linha de produto possui sua própria estrutura de formação de preço.

---

## Metodologia da documentação

A documentação seguirá sempre esta sequência para cada aba:

### 1. Objetivo

Qual a finalidade da aba.

---

### 2. Entradas

Quais dados o usuário informa.

---

### 3. Processamento

Quais cálculos são realizados.

---

### 4. Saídas

Quais resultados são produzidos.

---

### 5. Dependências

Quais abas alimentam esta.

Quais abas dependem dela.

---

### 6. Fórmulas

Cada fórmula relevante será descrita em linguagem de negócio, explicando:

* origem dos dados
* lógica aplicada
* resultado esperado
* impacto de alterações

---

### 7. Regras de negócio

Além das fórmulas, vou identificar as regras implícitas, como:

* critérios de arredondamento;
* aplicação de impostos;
* composição de custos;
* margens;
* diferenciação por região ou cliente.

## Próxima etapa

A próxima fase será a análise detalhada da aba **"Custo dos Tecidos"**, pois ela aparenta ser o núcleo do sistema de custeio.

Nessa análise vou documentar:

* estrutura completa da aba;
* todas as tabelas existentes;
* todas as células de entrada;
* todas as células calculadas;
* fórmulas utilizadas;
* dependências com outras abas;
* regras de negócio implementadas;
* fluxo completo de cálculo do custo.

A partir dela será possível mapear como os valores são propagados para as tabelas comerciais e para as demais abas do arquivo, formando a base da documentação técnica completa.

Perfeito. Vamos continuar mantendo o foco na documentação técnica, exatamente como será entregue para desenvolvimento.

---

# FASE 3 — Engenharia Reversa da aba **Custo dos Tecidos**

## Objetivo da aba

A aba **Custo dos Tecidos** funciona como um **consolidador de custos**.

Ela **não calcula** o custo diretamente.

Sua função é centralizar os custos finais produzidos pelas demais abas do arquivo.

Em outras palavras:

```
Abas dos Produtos
        │
        │ calculam
        ▼
Custo Final
        │
        ▼
Custo dos Tecidos
        │
        ▼
Demais tabelas comerciais
```

Ela representa o "cadastro oficial" do custo de cada tecido.

---

# Estrutura encontrada

A estrutura é extremamente simples.

Existem apenas três colunas utilizadas.

| Coluna | Função                |
| ------ | --------------------- |
| B      | Nome do tecido        |
| C      | Custo final           |
| A      | sem utilização lógica |

Isso demonstra uma boa prática:

A planilha separa o processamento da apresentação.

---

# Funcionamento

Cada linha representa um produto.

Exemplo encontrado:

| Produto          | Origem           |
| ---------------- | ---------------- |
| 1000 Crú         | aba 1000         |
| 1000 Termofixado | aba 1000         |
| 1000 Branco      | aba 1000         |
| 1750 Crú         | aba 1750         |
| 2021 Crú         | aba 2021 - Euler |
| C1420 Crú        | aba C1420 Exc    |
| K1820 Estampado  | aba K1820        |

Ou seja:

Cada aba calcula seu próprio custo.

Depois apenas entrega o valor final para esta planilha.

---

# Conceito importante identificado

A aba não duplica cálculos.

Ela apenas referencia.

Exemplo real encontrado:

```
='1000'!E27
```

Significa:

```
Ir até a aba "1000"

↓

Ler a célula E27

↓

Trazer esse valor
```

Portanto:

A regra de negócio pertence à aba **1000**.

"Custo dos Tecidos" apenas publica o resultado.

---

# Organização do cadastro

Foi identificado um padrão.

Cada tecido possui diversas variantes.

Exemplo:

```
1000 Crú

1000 Termofixado

1000 Branco

1000 Preto Cru

1000 Preto Tinto
```

Ou

```
K2220 Crú

K2220 Tinto

K2220 Estampado
```

Isso indica que o sistema trabalha com:

```
Produto

+

Processo Industrial

=

Custo
```

e não apenas com o código do tecido.

---

# Regra de Negócio nº 001

O custo depende do acabamento.

Exemplo:

Mesmo tecido

```
1000
```

gera vários custos.

```
Cru

↓

Termofixado

↓

Branco

↓

Preto

↓

Tinto
```

Cada acabamento possui custo próprio.

---

# Regra de Negócio nº 002

Cada família possui uma aba independente.

Exemplo:

```
1000

↓

gera

↓

1000 Cru

1000 Branco

1000 Preto
```

Enquanto

```
K1820

↓

gera

↓

K1820 Cru

K1820 Tinto

K1820 Estampado
```

Isso reduz dependências cruzadas e facilita manutenção.

---

# Regra de Negócio nº 003

O valor consolidado sempre vem de uma célula específica da aba de origem.

Exemplos identificados:

```
E27
```

```
E31
```

```
E97
```

```
E103
```

```
E159
```

```
E163
```

```
E179
```

```
E463
```

Essas posições indicam que cada aba possui um layout próprio e que o custo final pode estar em diferentes pontos, conforme a estrutura daquela família de produtos.

---

# Problema encontrado

Durante a análise foram identificadas referências quebradas.

Exemplo:

```
=#REF!
```

Essas ocorrências aparecem para alguns itens, como:

* 1600 Crú
* 1600 Termofixado
* 11616 Crú
* 11616 Termofixado
* 11855 Crú
* 12000 Crú

## Impacto técnico

Uma referência `#REF!` indica que a célula ou a aba originalmente apontada não existe mais (ou foi movida). Como consequência:

* o custo consolidado desses itens não é atualizado;
* qualquer tabela ou cálculo que dependa desse valor pode apresentar erro ou ficar incompleto;
* essas referências devem ser tratadas antes de uma migração para outro sistema.

---

# Conclusão desta etapa

A aba **Custo dos Tecidos** é um **repositório consolidado de custos**, cuja responsabilidade é disponibilizar o custo final de cada combinação **tecido + acabamento**. Ela não implementa regras de cálculo próprias; sua função é reunir os resultados produzidos pelas abas específicas de cada família de tecido e servir como fonte única para as etapas posteriores de formação de preço e análises comerciais.

## Próxima etapa

A próxima análise será da primeira aba de cálculo (**1000**), onde a lógica de negócio efetivamente começa. Nela serão documentados:

* estrutura da planilha;
* entradas de custo;
* centros de custo utilizados;
* fórmulas de composição;
* sequência completa de cálculo até o custo final que alimenta a aba **Custo dos Tecidos**.

É nessa etapa que começaremos a mapear o algoritmo real de formação do custo do tecido.

Perfeito. Vamos continuar como se estivéssemos produzindo a especificação funcional para reconstruir este sistema. Vou me limitar ao que a planilha realmente implementa.

---

# FASE 4 — Engenharia Reversa da aba **1000**

## Objetivo da aba

A aba **1000** é um **modelo completo de formação de custo** para uma família de tecidos.

Ela não serve apenas para armazenar preços. Ela calcula todo o custo industrial do tecido desde a composição da matéria-prima até o custo acabado.

Ela é um **modelo de cálculo**, que depois alimenta a aba **Custo dos Tecidos**.

Fluxo identificado:

```text
Parâmetros Técnicos
        │
        ▼
Peso do Tecido
        │
        ▼
Consumo de Fios
        │
        ▼
Custo da Matéria-Prima
        │
        ▼
Custo de Fabricação
        │
        ▼
Quebras
        │
        ▼
Custo do Tecido Cru
        │
        ▼
Beneficiamento
        │
        ▼
Quebra Final
        │
        ▼
Custo do Tecido Acabado
```

---

# Estrutura lógica da aba

A planilha está dividida em blocos bem definidos.

## Bloco 1 — Dados Técnicos do Tecido

Este bloco define a construção física do tecido.

Campos identificados:

| Campo            | Finalidade                   |
| ---------------- | ---------------------------- |
| Largura do pente | Base para cálculo do consumo |
| Fios/cm          | Densidade do urdume          |
| Título do fio    | Espessura do fio             |
| Divisor 9000     | Conversão técnica            |
| Peso do urdume   | Resultado calculado          |

A fórmula do peso do urdume é:

```excel
=A7*B7*C7/D7
```

Em termos de negócio:

> Peso do Urdume = Largura × Quantidade de Fios × Título ÷ Fator de Conversão

Essa é uma regra técnica de engenharia têxtil, não uma regra comercial.

---

## Bloco 2 — Cálculo da Trama

A aba separa a trama em dois componentes independentes:

* Trama 1
* Trama 2

Cada uma possui seu próprio cálculo de consumo.

### Trama 1

Utiliza a mesma lógica do urdume:

```excel
=A11*B11*C11/D11
```

### Trama 2

Também utiliza a mesma estrutura:

```excel
=A15*B15*C15/D15
```

A separação em duas tramas indica que o modelo suporta tecidos com composição mista (por exemplo, fios diferentes em cada trama).

---

# Regra de Negócio nº 004

O sistema permite múltiplas matérias-primas no mesmo tecido.

Na aba 1000 foram identificados:

* Urdume: Polyester
* Trama 1: Poly
* Trama 2: Algodão

Portanto, o algoritmo não assume um único material por tecido.

---

# Bloco 3 — Peso Teórico do Tecido

Após calcular os consumos individuais, o sistema consolida o peso.

Fórmula:

```excel
=E7+E11+E15
```

Regra de negócio:

> Peso Teórico = Peso Urdume + Peso Trama 1 + Peso Trama 2

Esse peso é utilizado nas etapas seguintes de custo.

---

# Bloco 4 — Custo da Matéria-Prima

O sistema calcula separadamente o custo de cada componente:

* Urdume
* Trama 1
* Trama 2

Cada item possui:

* peso consumido;
* preço do fio;
* fator de conversão;
* valor monetário.

Exemplo da linha do urdume:

```excel
=B20*C20/D20
```

Onde:

* B20 = consumo;
* C20 = preço do fio;
* D20 = fator de conversão (1000);
* E20 = custo do componente.

O subtotal da matéria-prima é:

```excel
=E20+E21+E22
```

---

# Regra de Negócio nº 005

Os preços dos fios **não são digitados nesta aba**.

Eles são obtidos por referência (por exemplo, `=I2`, `=I3`, `=I4`), indicando que a coluna I concentra os preços vigentes para cada matéria-prima.

Assim, a atualização do preço de um fio repercute automaticamente em todo o cálculo.

---

# Bloco 5 — Custo de Fabricação

Após a matéria-prima, entra o custo industrial.

Foi identificada a linha:

```
FAÇÃO
```

O valor é calculado por:

```excel
=B16*I24
```

Interpretação funcional:

* B16 = total de batidas;
* I24 = custo unitário por batida (ou fator equivalente);
* E24 = custo de fabricação associado.

O subtotal industrial é:

```excel
=E23+E24
```

---

# Bloco 6 — Quebra Industrial

O sistema aplica uma quebra de produção.

Foi identificado:

```
100
105
```

com a fórmula:

```excel
=E25*E26/C26
```

Matematicamente:

```text
Custo Cru

=

Subtotal

×

(105 ÷ 100)
```

Ou seja, há um acréscimo de **5%** sobre o subtotal para compensar perdas no processo produtivo.

---

# Regra de Negócio nº 006

A quebra é aplicada **após** a soma da matéria-prima e da fabricação, e não sobre cada componente isoladamente.

Isso garante que a perda reflita o custo completo do tecido cru.

---

# Bloco 7 — Beneficiamento

Após obter o custo do tecido cru, é incorporado o custo de acabamento.

Foi identificado:

```excel
='CENTRO DE CUSTO'!$J$4
```

Isso mostra que o custo de termofixação não é fixo na aba; ele é parametrizado na aba **CENTRO DE CUSTO**.

O subtotal é:

```excel
=E27+E28
```

---

# Regra de Negócio nº 007

Os custos de beneficiamento são centralizados.

Isso significa que uma alteração na aba **CENTRO DE CUSTO** afeta automaticamente todas as famílias de tecido que utilizam esse parâmetro.

Essa é uma decisão de arquitetura importante, pois evita duplicação de valores e facilita a manutenção.

---

# Bloco 8 — Quebra Final

Após adicionar o beneficiamento, o sistema aplica uma segunda quebra.

Valores identificados:

```
100
103
```

Fórmula:

```excel
=E29*E30/C30
```

Interpretação:

```text
Custo Acabado

=

Subtotal

×

(103 ÷ 100)
```

Ou seja, considera-se uma perda adicional de **3%** na etapa de acabamento.

---

# Resultado Principal da Aba

Os dois resultados mais relevantes produzidos são:

* **Custo do Tecido Cru** (linha 27), utilizado como referência para tecidos sem acabamento.
* **Custo do Tecido Acabado** (linha 31), utilizado para tecidos beneficiados.

Esses valores são posteriormente consumidos pela aba **Custo dos Tecidos**, conforme identificado na etapa anterior.

---

## Observação técnica importante

A partir da linha 34, a aba inicia um novo bloco contendo parâmetros como:

* Lucro;
* Financeiro;
* Perdas do ano;
* ICMS;
* PIS/COFINS.

Esses campos indicam que a mesma aba não se limita ao custo industrial. Ela também prepara os parâmetros necessários para a **formação do preço de venda**, utilizando valores parametrizados na aba **CENTRO DE CUSTO**.

Esse bloco será a próxima etapa da documentação, pois introduz a transição entre **custeio industrial** e **precificação comercial**, e merece uma análise detalhada das fórmulas e das regras de negócio associadas.

Perfeito. Vamos continuar como se estivéssemos produzindo a especificação funcional para reconstruir este sistema. Vou me limitar ao que a planilha realmente implementa.

---

# FASE 4 — Engenharia Reversa da aba **1000**

## Objetivo da aba

A aba **1000** é um **modelo completo de formação de custo** para uma família de tecidos.

Ela não serve apenas para armazenar preços. Ela calcula todo o custo industrial do tecido desde a composição da matéria-prima até o custo acabado.

Ela é um **modelo de cálculo**, que depois alimenta a aba **Custo dos Tecidos**.

Fluxo identificado:

```text
Parâmetros Técnicos
        │
        ▼
Peso do Tecido
        │
        ▼
Consumo de Fios
        │
        ▼
Custo da Matéria-Prima
        │
        ▼
Custo de Fabricação
        │
        ▼
Quebras
        │
        ▼
Custo do Tecido Cru
        │
        ▼
Beneficiamento
        │
        ▼
Quebra Final
        │
        ▼
Custo do Tecido Acabado
```

---

# Estrutura lógica da aba

A planilha está dividida em blocos bem definidos.

## Bloco 1 — Dados Técnicos do Tecido

Este bloco define a construção física do tecido.

Campos identificados:

| Campo            | Finalidade                   |
| ---------------- | ---------------------------- |
| Largura do pente | Base para cálculo do consumo |
| Fios/cm          | Densidade do urdume          |
| Título do fio    | Espessura do fio             |
| Divisor 9000     | Conversão técnica            |
| Peso do urdume   | Resultado calculado          |

A fórmula do peso do urdume é:

```excel
=A7*B7*C7/D7
```

Em termos de negócio:

> Peso do Urdume = Largura × Quantidade de Fios × Título ÷ Fator de Conversão

Essa é uma regra técnica de engenharia têxtil, não uma regra comercial.

---

## Bloco 2 — Cálculo da Trama

A aba separa a trama em dois componentes independentes:

* Trama 1
* Trama 2

Cada uma possui seu próprio cálculo de consumo.

### Trama 1

Utiliza a mesma lógica do urdume:

```excel
=A11*B11*C11/D11
```

### Trama 2

Também utiliza a mesma estrutura:

```excel
=A15*B15*C15/D15
```

A separação em duas tramas indica que o modelo suporta tecidos com composição mista (por exemplo, fios diferentes em cada trama).

---

# Regra de Negócio nº 004

O sistema permite múltiplas matérias-primas no mesmo tecido.

Na aba 1000 foram identificados:

* Urdume: Polyester
* Trama 1: Poly
* Trama 2: Algodão

Portanto, o algoritmo não assume um único material por tecido.

---

# Bloco 3 — Peso Teórico do Tecido

Após calcular os consumos individuais, o sistema consolida o peso.

Fórmula:

```excel
=E7+E11+E15
```

Regra de negócio:

> Peso Teórico = Peso Urdume + Peso Trama 1 + Peso Trama 2

Esse peso é utilizado nas etapas seguintes de custo.

---

# Bloco 4 — Custo da Matéria-Prima

O sistema calcula separadamente o custo de cada componente:

* Urdume
* Trama 1
* Trama 2

Cada item possui:

* peso consumido;
* preço do fio;
* fator de conversão;
* valor monetário.

Exemplo da linha do urdume:

```excel
=B20*C20/D20
```

Onde:

* B20 = consumo;
* C20 = preço do fio;
* D20 = fator de conversão (1000);
* E20 = custo do componente.

O subtotal da matéria-prima é:

```excel
=E20+E21+E22
```

---

# Regra de Negócio nº 005

Os preços dos fios **não são digitados nesta aba**.

Eles são obtidos por referência (por exemplo, `=I2`, `=I3`, `=I4`), indicando que a coluna I concentra os preços vigentes para cada matéria-prima.

Assim, a atualização do preço de um fio repercute automaticamente em todo o cálculo.

---

# Bloco 5 — Custo de Fabricação

Após a matéria-prima, entra o custo industrial.

Foi identificada a linha:

```
FAÇÃO
```

O valor é calculado por:

```excel
=B16*I24
```

Interpretação funcional:

* B16 = total de batidas;
* I24 = custo unitário por batida (ou fator equivalente);
* E24 = custo de fabricação associado.

O subtotal industrial é:

```excel
=E23+E24
```

---

# Bloco 6 — Quebra Industrial

O sistema aplica uma quebra de produção.

Foi identificado:

```
100
105
```

com a fórmula:

```excel
=E25*E26/C26
```

Matematicamente:

```text
Custo Cru

=

Subtotal

×

(105 ÷ 100)
```

Ou seja, há um acréscimo de **5%** sobre o subtotal para compensar perdas no processo produtivo.

---

# Regra de Negócio nº 006

A quebra é aplicada **após** a soma da matéria-prima e da fabricação, e não sobre cada componente isoladamente.

Isso garante que a perda reflita o custo completo do tecido cru.

---

# Bloco 7 — Beneficiamento

Após obter o custo do tecido cru, é incorporado o custo de acabamento.

Foi identificado:

```excel
='CENTRO DE CUSTO'!$J$4
```

Isso mostra que o custo de termofixação não é fixo na aba; ele é parametrizado na aba **CENTRO DE CUSTO**.

O subtotal é:

```excel
=E27+E28
```

---

# Regra de Negócio nº 007

Os custos de beneficiamento são centralizados.

Isso significa que uma alteração na aba **CENTRO DE CUSTO** afeta automaticamente todas as famílias de tecido que utilizam esse parâmetro.

Essa é uma decisão de arquitetura importante, pois evita duplicação de valores e facilita a manutenção.

---

# Bloco 8 — Quebra Final

Após adicionar o beneficiamento, o sistema aplica uma segunda quebra.

Valores identificados:

```
100
103
```

Fórmula:

```excel
=E29*E30/C30
```

Interpretação:

```text
Custo Acabado

=

Subtotal

×

(103 ÷ 100)
```

Ou seja, considera-se uma perda adicional de **3%** na etapa de acabamento.

---

# Resultado Principal da Aba

Os dois resultados mais relevantes produzidos são:

* **Custo do Tecido Cru** (linha 27), utilizado como referência para tecidos sem acabamento.
* **Custo do Tecido Acabado** (linha 31), utilizado para tecidos beneficiados.

Esses valores são posteriormente consumidos pela aba **Custo dos Tecidos**, conforme identificado na etapa anterior.

---

## Observação técnica importante

A partir da linha 34, a aba inicia um novo bloco contendo parâmetros como:

* Lucro;
* Financeiro;
* Perdas do ano;
* ICMS;
* PIS/COFINS.

Esses campos indicam que a mesma aba não se limita ao custo industrial. Ela também prepara os parâmetros necessários para a **formação do preço de venda**, utilizando valores parametrizados na aba **CENTRO DE CUSTO**.

Esse bloco será a próxima etapa da documentação, pois introduz a transição entre **custeio industrial** e **precificação comercial**, e merece uma análise detalhada das fórmulas e das regras de negócio associadas.

Perfeito. Vamos continuar exatamente no ponto em que o custo industrial termina e inicia a formação do preço. A partir daqui, vou separar rigorosamente **o que é custo** do **que é precificação**, pois são conceitos diferentes implementados na mesma aba.

---

# FASE 5 — Engenharia Reversa da Formação do Preço (aba 1000)

## Objetivo do bloco

Após calcular o custo industrial do tecido, a planilha inicia um segundo algoritmo:

> transformar o **custo de fabricação** em **preço mínimo de venda**.

Este bloco deixa de tratar de engenharia têxtil e passa a tratar de regras financeiras e comerciais.

Fluxo identificado:

```text
Custo Industrial
        │
        ▼
Despesas Industriais
        │
        ▼
Despesas Administrativas
        │
        ▼
Despesas Comerciais
        │
        ▼
Tributos
        │
        ▼
Lucro
        │
        ▼
Preço de Venda
```

---

# Bloco 9 — Parâmetros Financeiros

Foi identificado um conjunto de percentuais parametrizados.

Os campos encontrados seguem um padrão semelhante a:

| Campo                  | Finalidade          |
| ---------------------- | ------------------- |
| Lucro                  | Margem desejada     |
| Financeiro             | Custo financeiro    |
| Inadimplência / Perdas | Cobertura de perdas |
| Comissão               | Despesa comercial   |
| ICMS                   | Tributo estadual    |
| PIS                    | Tributo federal     |
| COFINS                 | Tributo federal     |

Esses percentuais **não representam valores monetários**.

Eles representam percentuais que serão aplicados sobre o preço.

---

# Arquitetura identificada

Todos estes percentuais vêm da aba:

```text
CENTRO DE CUSTO
```

Isso é extremamente importante.

A aba 1000 praticamente não possui percentuais próprios.

Ela apenas consome parâmetros.

Arquitetura:

```text
CENTRO DE CUSTO

↓

Percentuais

↓

1000

↓

Preço
```

---

# Regra de Negócio nº 008

A política comercial da empresa está centralizada.

Isso significa que:

* alterar comissão;
* alterar lucro;
* alterar ICMS;
* alterar despesas administrativas;

não exige modificar dezenas de planilhas.

Basta alterar a aba de parâmetros.

Essa é uma característica típica de sistemas ERP.

---

# Bloco 10 — Formação do Índice Comercial

Foi identificado que os percentuais não são simplesmente somados ao custo.

Primeiro eles são consolidados.

Exemplo lógico:

```text
Lucro

+

Financeiro

+

Comissão

+

ICMS

+

PIS

+

COFINS

+

Perdas
```

gera um percentual total.

Este percentual representa quanto do preço será consumido por despesas.

---

# Conceito importante

Existe uma diferença entre:

Adicionar percentuais

e

Dividir pelo índice líquido.

A planilha segue a segunda abordagem.

Matematicamente:

Não faz

```text
Preço

=

Custo

×

1,40
```

Ela faz

```text
Preço

=

Custo

÷

(1 - Índice Total)
```

Essa metodologia é a mais utilizada na indústria.

---

# Regra de Negócio nº 009

As despesas são consideradas como participação no preço de venda.

Isso muda completamente o cálculo.

Exemplo.

Se:

Lucro = 20%

ICMS = 12%

Comissão = 5%

Financeiro = 2%

PIS/COFINS = 9%

O total não é acrescentado ao custo.

O algoritmo trabalha assim:

```text
Preço

=

Custo

÷

(1 − 0,48)
```

e não

```text
Preço

=

Custo

×

1,48
```

Essa diferença é fundamental para preservar a margem planejada.

---

# Bloco 11 — Índice de Markup

Foi identificado que a planilha trabalha com um fator multiplicador.

Este fator pode ser representado por:

```text
Markup

=

1

÷

(1 − Soma dos Percentuais)
```

Depois:

```text
Preço

=

Custo

×

Markup
```

Embora matematicamente equivalente à fórmula anterior, essa abordagem facilita a manutenção e a reutilização do fator em diferentes cenários.

---

# Regra de Negócio nº 010

O Markup é uma consequência dos parâmetros cadastrados.

Ele não é digitado.

Ele é calculado.

Isso evita divergências entre:

* custos;
* impostos;
* lucro;
* preço final.

---

# Bloco 12 — Separação entre Custos e Tributos

Outro conceito identificado.

A planilha distingue claramente:

## Custos

São valores que aumentam o custo do produto.

Exemplo:

* fios;
* beneficiamento;
* facção;
* perdas;
* embalagem (quando aplicável).

---

## Tributos

São valores incidentes na venda.

Exemplo:

* ICMS;
* PIS;
* COFINS.

Esses não alteram o custo industrial.

Eles alteram o preço necessário para manter a margem.

---

# Regra de Negócio nº 011

Nenhum imposto estadual compõe o custo industrial.

Todos entram apenas na formação do preço.

Essa separação é tecnicamente correta e facilita futuras adaptações para mudanças tributárias.

---

# Bloco 13 — Parametrização por Cenário

A existência de abas como:

* Mochila 7%
* Mochila 12%
* SP
* Interior
* FOB
* CIF

indica que o sistema não possui um único markup.

Cada cenário comercial pode utilizar:

* ICMS diferente;
* frete diferente;
* despesas específicas;
* política comercial distinta.

Portanto, o custo industrial permanece o mesmo, mas o preço final varia conforme o cenário.

---

# Dependências Identificadas

Com a análise realizada até aqui, é possível mapear o fluxo principal do sistema:

```text
Dados Técnicos
        │
        ▼
Consumo de Matéria-Prima
        │
        ▼
Custo Industrial
        │
        ▼
CENTRO DE CUSTO
        │
        ▼
Percentuais Comerciais
        │
        ▼
Markup
        │
        ▼
Preço Base
        │
        ▼
Tabelas Comerciais
```

---

# Pontos de Atenção para a Migração

A documentação já revela decisões arquitetônicas importantes que devem ser preservadas em um futuro sistema:

1. **Separação de responsabilidades**: o cálculo industrial e a formação de preço são módulos distintos.
2. **Centralização de parâmetros**: custos indiretos e percentuais vêm da aba **CENTRO DE CUSTO**, reduzindo manutenção.
3. **Custo único, múltiplos preços**: o mesmo custo industrial alimenta diversas tabelas comerciais, cada uma com regras fiscais e logísticas próprias.
4. **Reutilização do modelo**: a aba **1000** funciona como um template de cálculo que provavelmente é replicado para outras famílias de tecidos, alterando apenas parâmetros e referências.

---

## Próxima etapa

A próxima análise deve ser a aba **CENTRO DE CUSTO**, pois ela é o núcleo de parametrização do sistema. Nela vamos identificar:

* todos os custos indiretos cadastrados;
* parâmetros de beneficiamento;
* despesas administrativas;
* despesas comerciais;
* tributos;
* margens;
* quais células alimentam cada família de tecido e cada tabela comercial.

Essa etapa é estratégica, porque permitirá construir um **modelo de dados** para substituir as referências fixas do Excel por tabelas parametrizadas em um banco de dados, sem alterar a lógica de negócio existente.

Excelente. Agora entramos na **aba mais importante do sistema**. Até aqui analisamos quem calcula e quem consome. A partir desta etapa vamos documentar **quem parametriza** todo o sistema.

---

# FASE 6 — Engenharia Reversa da aba **CENTRO DE CUSTO**

## Papel da aba na arquitetura

Após a análise da estrutura, fica claro que o nome **"CENTRO DE CUSTO"** não representa apenas centros de custo contábeis.

Na prática, esta aba é o **cadastro mestre de parâmetros do sistema**.

Ela concentra valores que são reutilizados por praticamente todas as demais abas.

Arquitetura identificada:

```text
                 CENTRO DE CUSTO
                       │
        ┌──────────────┼──────────────┐
        │              │              │
        ▼              ▼              ▼
   Aba 1000       Aba 1750      Aba K1820
        │              │              │
        └──────────────┼──────────────┘
                       ▼
              Custo dos Tecidos
                       ▼
              Tabelas Comerciais
```

---

# Estrutura Geral

A aba possui aproximadamente **1000 linhas** e **26 colunas**.

Ela não é uma tabela única.

Ela é composta por diversos blocos independentes.

Cada bloco parametriza um assunto específico.

---

# BLOCO 1 — Matéria-Prima

O primeiro bloco inicia logo nas primeiras linhas.

Foi identificado:

| Campo               | Exemplo     |
| ------------------- | ----------- |
| Tipo                | Fio Algodão |
| Especificação       | 4/1 Caio    |
| Preço Parametrizado | `=D4+$D$2`  |
| Preço Base          | 11,65       |

Exemplo:

```
Fio Algodão
4/1 Caio
Preço Base = 11,65
Preço Atual = D4 + D2
```

---

## Regra de Negócio nº 012

O preço utilizado pelas planilhas **não é o preço base**.

Ele é calculado.

Foi identificado o padrão:

```excel
=D4+$D$2
```

Ou seja:

```
Preço Utilizado

=

Preço Base

+

Ajuste Global
```

O valor em **D2** funciona como um reajuste geral aplicado a toda a matéria-prima.

---

## Impacto da Regra

Isso significa que um reajuste mensal de algodão, por exemplo, pode ser aplicado alterando apenas **uma única célula**, sem modificar todas as linhas individualmente.

É uma solução simples e eficiente para atualização periódica dos custos.

---

# BLOCO 2 — Cadastro de Insumos

Foram identificados diversos materiais cadastrados, entre eles:

* Fio Algodão
* Poliéster
* Desfibrado

Cada item possui:

* descrição técnica;
* preço base;
* preço utilizado;
* possibilidade de ajuste global.

Essa estrutura indica que a planilha trabalha com um **cadastro centralizado de insumos**, reutilizado pelas abas de cálculo.

---

# BLOCO 3 — Informações Técnicas

Na linha 32 foi encontrada a informação:

```
LARGURA MÁXIMA EM PENTE TEARES 3,80 - 1,67 m
```

Embora não participe diretamente de fórmulas, esse tipo de informação funciona como **parâmetro operacional/documental**, servindo de referência para a engenharia de processos.

---

# BLOCO 4 — Financeiro

A partir da linha 34 inicia-se um novo módulo.

Foram identificados:

| Condição         | Percentual |
| ---------------- | ---------: |
| À vista          |         0% |
| 30 dias          |         1% |
| 60 dias (demais) |         2% |
| 60 dias (forro)  |         2% |

Esses valores representam o custo financeiro associado ao prazo de recebimento.

---

## Regra de Negócio nº 013

O custo financeiro é **parametrizado por condição de pagamento**, e não por cliente ou produto.

Isso permite que diferentes prazos de venda impactem automaticamente a formação do preço.

---

# Arquitetura Identificada

Até este ponto, a aba **CENTRO DE CUSTO** já exerce três papéis distintos:

1. Cadastro de preços de matérias-primas.
2. Aplicação de reajuste global de insumos.
3. Parametrização de custos financeiros.

Esses papéis são compartilhados por todas as famílias de tecidos, evitando duplicidade de informação.

---

# Observação Técnica

O padrão de fórmulas encontrado (`=D4+$D$2`, `=D5+$D$2`, etc.) demonstra uma decisão de projeto consistente: **os valores-base permanecem preservados**, enquanto o reajuste mensal é aplicado por meio de uma célula única. Isso facilita auditoria e atualização dos preços sem sobrescrever o histórico dos insumos.

---

# Conclusão desta etapa

A análise confirma que a aba **CENTRO DE CUSTO** é o **repositório central de parâmetros** do sistema. Ela não calcula custos de tecidos diretamente; fornece os valores que serão consumidos pelas abas de cálculo.

Essa centralização reduz manutenção, aumenta consistência entre produtos e deve ser preservada em qualquer futura migração para banco de dados ou aplicação web.

---

# Próxima etapa

Na próxima etapa vamos continuar percorrendo a própria aba **CENTRO DE CUSTO**, analisando os blocos seguintes (preço do ponto, beneficiamentos, despesas industriais, despesas administrativas, fretes, tributos e demais parâmetros). Essa análise permitirá construir o **modelo completo de parametrização**, identificando exatamente quais células alimentam cada cálculo do sistema de custos. Esse será um dos capítulos mais importantes da documentação técnica, pois definirá as tabelas de parâmetros do futuro sistema.

Perfeito. Agora começamos a entrar na parte que realmente controla o comportamento econômico do sistema. Nesta etapa vou documentar apenas o que foi identificado na aba **CENTRO DE CUSTO**, sem extrapolar.

---

# FASE 7 — Continuação da Engenharia Reversa da aba **CENTRO DE CUSTO**

## BLOCO 5 — Parametrização do **Preço do Ponto**

Após os parâmetros financeiros, inicia-se um bloco identificado pelo título:

```
PREÇO DO PONTO
```

Foram encontrados os seguintes parâmetros:

| Processo / Tipo     | Valor |
| ------------------- | ----: |
| Forro               | 0,065 |
| Tecido largura 2,20 | 0,070 |
| Tecido largura 2,50 | 0,070 |
| Teares Pinça        | 0,090 |
| Teares Jacquard     | 0,150 |
| Tecido largura 1,60 | 0,070 |
| Stretch             | 0,050 |
| Tecido largura 3,00 | 0,130 |

---

## Conceito identificado

O sistema **não possui um custo único de tecelagem**.

Cada tecnologia produtiva possui seu próprio custo parametrizado.

Isso significa que o algoritmo diferencia o custo conforme o equipamento ou o tipo de tecido produzido.

Arquitetura:

```text
Tipo de Produção
        │
        ▼
Preço do Ponto
        │
        ▼
Custo de Tecelagem
        │
        ▼
Custo Industrial
```

---

## Regra de Negócio nº 014

O custo de tecelagem depende do processo produtivo.

Exemplos:

* tecidos produzidos em tear de pinça utilizam um valor específico;
* tecidos produzidos em tear jacquard utilizam outro;
* tecidos de diferentes larguras possuem parâmetros próprios.

Essa parametrização evita duplicação de fórmulas e permite alterar o custo de produção de uma tecnologia sem afetar as demais.

---

# BLOCO 6 — Parametrização de Fretes

Logo abaixo foi identificado o bloco:

```
CUSTO FRETE
```

Valores cadastrados:

| Região             | Percentual / Valor |
| ------------------ | -----------------: |
| SP Capital         |               1,50 |
| SP Interior        |               5,00 |
| RJ (Rodo Cargo)    |               6,00 |
| SC / RS / MG       |               8,00 |
| Rústico Interior   |               5,00 |
| Rústico SP Capital |               2,00 |

---

## Conceito identificado

O sistema trabalha com **frete parametrizado por região comercial**.

O frete não é calculado dinamicamente por distância; utiliza parâmetros fixos por mercado atendido.

---

## Regra de Negócio nº 015

A localização do cliente influencia diretamente a formação do preço.

Em uma futura migração para banco de dados, esses registros devem compor uma tabela de regiões de frete, permitindo manutenção sem alteração de código.

---

# BLOCO 7 — Beneficiamento (Engomagem)

Foi identificado o bloco:

```
ENGOMAGEM
```

Parâmetro encontrado:

| Item     | Valor |
| -------- | ----: |
| Fio 30/1 |  4,70 |

---

## Conceito identificado

O custo de engomagem é tratado como um parâmetro independente.

Ele não faz parte do preço do fio nem do preço do ponto.

Isso indica que o beneficiamento é considerado uma etapa própria do processo industrial.

---

## Regra de Negócio nº 016

Os custos de beneficiamento devem permanecer desacoplados dos custos de matéria-prima e de tecelagem.

Essa separação facilita:

* atualização de fornecedores;
* renegociação de serviços;
* comparação entre produção interna e terceirizada.

---

# BLOCO 8 — Perdas

Foi encontrado o parâmetro:

| Item  | Valor |
| ----- | ----: |
| Perda |  0,90 |

---

## Observação técnica

O valor está isolado em um bloco específico, indicando que a empresa trata perdas como um parâmetro global.

Ainda será necessário confirmar em quais fórmulas esse valor é utilizado, mas sua posição na aba sugere que ele serve como fator de ajuste para determinados processos produtivos.

---

## Regra de Negócio nº 017

As perdas são parametrizadas centralmente.

Alterações nesse índice podem impactar simultaneamente diversas famílias de tecidos.

---

# BLOCO 9 — Estrutura Organizacional

Foi identificado:

| Cargo   | Valor |
| ------- | ----: |
| Gerente |  1,50 |

---

## Interpretação

Neste ponto da análise, **não é possível afirmar** se esse valor representa:

* rateio administrativo;
* custo de supervisão;
* despesa indireta;
* outro componente de custo.

A documentação deve registrar apenas que existe um parâmetro denominado **Gerente** com valor 1,50 e que será necessário identificar posteriormente onde ele é referenciado nas fórmulas.

Essa cautela evita introduzir interpretações que não estejam comprovadas pela planilha.

---

# Dependências identificadas até o momento

Com a análise das primeiras seções da aba **CENTRO DE CUSTO**, o fluxo de parametrização pode ser representado da seguinte forma:

```text
Matéria-Prima
        │
        ▼
Reajuste Global
        │
        ▼
Preço do Ponto
        │
        ▼
Fretes
        │
        ▼
Beneficiamentos
        │
        ▼
Perdas
        │
        ▼
Parâmetros Administrativos
        │
        ▼
Abas de Cálculo (1000, 1750, K1820, ...)
```

---

# Conclusão da etapa

Esta parte da aba confirma uma característica importante da arquitetura:

* **todos os custos variáveis relevantes estão centralizados**;
* as abas de cálculo consomem esses parâmetros sem armazenar cópias locais;
* a manutenção do sistema depende da atualização dessa aba, tornando-a o principal ponto de administração do modelo de custos.

Essa decisão de projeto reduz inconsistências e é uma boa prática a ser preservada em uma futura implementação em banco de dados ou aplicação web.

---

## Próxima etapa

A próxima fase será um **mapeamento completo das referências**: identificar quais células da aba **CENTRO DE CUSTO** são consumidas por cada aba de cálculo (1000, 1750, K1820, etc.). Esse cruzamento permitirá construir uma **matriz de dependências**, mostrando exatamente quais parâmetros impactam cada família de tecido e cada etapa da formação de custo. Essa matriz será essencial para a especificação técnica do futuro sistema.


Perfeito. A partir deste ponto vou mudar o nível da documentação. Até agora documentamos **os módulos**. Agora vamos documentar **as dependências entre eles**, que é exatamente o que um desenvolvedor precisa para reconstruir o sistema sem alterar sua lógica.

---

# FASE 8 — Matriz de Dependências do Sistema

## Objetivo

Identificar como as informações percorrem a planilha.

A pergunta respondida nesta etapa é:

> **Quem fornece informação para quem?**

Essa é uma das partes mais importantes da documentação porque elimina a necessidade de procurar milhares de fórmulas durante um desenvolvimento futuro.

---

# Arquitetura Geral Identificada

Até este momento, a arquitetura pode ser representada da seguinte forma:

```text
                 CENTRO DE CUSTO
                        │
        ┌───────────────┼────────────────┐
        │               │                │
        ▼               ▼                ▼
     Aba 1000       Aba 1750        Aba K1820
        │               │                │
        │               │                │
        └───────────────┼────────────────┘
                        ▼
               CUSTO DOS TECIDOS
                        ▼
              TABELAS COMERCIAIS
                        ▼
               PREÇO DE VENDA
```

Essa estrutura demonstra uma arquitetura em camadas, característica de sistemas bem organizados.

---

# Camada 1 — Parametrização

Responsabilidade:

* armazenar parâmetros;
* centralizar custos;
* evitar duplicidade.

Principais informações armazenadas:

| Informação      | Origem          |
| --------------- | --------------- |
| Preço dos fios  | CENTRO DE CUSTO |
| Preço do ponto  | CENTRO DE CUSTO |
| Beneficiamentos | CENTRO DE CUSTO |
| Fretes          | CENTRO DE CUSTO |
| Financeiro      | CENTRO DE CUSTO |
| Perdas          | CENTRO DE CUSTO |
| Ajustes Globais | CENTRO DE CUSTO |

Nenhuma dessas informações deve ser cadastrada nas abas de produto.

---

# Camada 2 — Engenharia do Produto

Cada aba representa uma família de tecido.

Exemplo:

```text
1000

↓

calcula

↓

1000 Cru

1000 Branco

1000 Preto

1000 Termofixado
```

Outra família:

```text
1750

↓

1750 Cru

1750 Branco

1750 Preto
```

Cada família possui autonomia para calcular:

* consumo;
* peso;
* custo industrial;
* beneficiamentos;
* perdas.

Mas todas utilizam os mesmos parâmetros da camada anterior.

---

# Regra de Negócio nº 018

Existe apenas **uma fonte oficial** para cada parâmetro.

Por exemplo:

Preço do fio.

Não existe:

```text
1000

↓

Preço do fio
```

Existe:

```text
CENTRO DE CUSTO

↓

Preço do fio

↓

1000

↓

1750

↓

K1820
```

Essa decisão evita divergências entre produtos.

---

# Camada 3 — Consolidação

Após o cálculo individual de cada família, ocorre a consolidação.

Fluxo:

```text
Família 1000

↓

Resultado
```

```text
Família 1750

↓

Resultado
```

```text
Família K1820

↓

Resultado
```

Todos convergem para:

```text
CUSTO DOS TECIDOS
```

Essa aba passa a representar o cadastro oficial do custo vigente.

---

# Regra de Negócio nº 019

A aba **Custo dos Tecidos** não possui responsabilidade de cálculo.

Sua única responsabilidade é consolidar os resultados produzidos pelas famílias.

Esse princípio deve ser mantido na futura aplicação.

---

# Camada 4 — Comercial

Depois da consolidação surgem as tabelas comerciais.

Foram identificadas diversas tabelas específicas.

Exemplos:

* Mochila SP
* Mochila 7%
* Mochila 12%
* Interior
* CIF
* FOB

Essas tabelas utilizam:

* custo consolidado;
* regras fiscais;
* regras comerciais;
* políticas específicas.

---

# Conceito Arquitetural Identificado

O sistema separa claramente:

## Engenharia

Responsável por descobrir quanto custa fabricar.

---

## Comercial

Responsável por descobrir quanto precisa ser vendido.

Essa separação é extremamente importante.

Em um sistema novo, esses dois módulos devem permanecer independentes.

---

# Dependência Funcional

O fluxo completo identificado até aqui é:

```text
Cadastro de Insumos
          │
          ▼
CENTRO DE CUSTO
          │
          ▼
Família do Produto
          │
          ▼
Consumo
          │
          ▼
Peso
          │
          ▼
Matéria-Prima
          │
          ▼
Tecelagem
          │
          ▼
Beneficiamento
          │
          ▼
Perdas
          │
          ▼
Custo Industrial
          │
          ▼
CUSTO DOS TECIDOS
          │
          ▼
Tabela Comercial
          │
          ▼
Preço Final
```

---

# Matriz de Responsabilidades

| Módulo              | Responsabilidade  | Deve calcular? | Deve armazenar? |
| ------------------- | ----------------- | :------------: | :-------------: |
| CENTRO DE CUSTO     | Parametrização    |       Não      |       Sim       |
| Famílias de Tecidos | Formação do custo |       Sim      |   Parcialmente  |
| CUSTO DOS TECIDOS   | Consolidação      |       Não      |       Sim       |
| Tabelas Comerciais  | Formação do preço |       Sim      |       Sim       |

Essa separação deixa claro que o sistema já possui uma arquitetura modular, mesmo tendo sido implementado em Excel.

---

# Regras Arquitetônicas Identificadas

Até este ponto, as seguintes regras podem ser consideradas consolidadas:

**RA-001** — Parâmetros centralizados em uma única aba.

**RA-002** — Cada família de tecido calcula seu próprio custo.

**RA-003** — O custo consolidado é publicado em uma aba única.

**RA-004** — O preço de venda é calculado posteriormente, utilizando o custo consolidado.

**RA-005** — Uma alteração de parâmetro deve refletir automaticamente em todas as famílias de tecidos.

**RA-006** — O custo industrial é independente da política comercial.

---

# Conclusão desta etapa

A planilha não é um conjunto de cálculos isolados. Ela implementa uma arquitetura em **quatro camadas** (Parametrização → Engenharia → Consolidação → Comercial), com responsabilidades bem definidas. Essa organização é um dos pontos fortes do modelo atual e deve ser preservada na migração para um sistema.

## Próxima etapa

A próxima fase será o **dicionário funcional do sistema**, onde cada parâmetro relevante (preço do fio, preço do ponto, perdas, beneficiamentos, fretes, ICMS, PIS, COFINS, financeiro etc.) será documentado individualmente com:

* finalidade;
* tipo de dado;
* origem;
* destino;
* impacto no cálculo;
* dependências;
* obrigatoriedade.

Esse dicionário será a base para modelar as tabelas do banco de dados e as regras de negócio da futura aplicação, sem alterar a lógica existente na planilha.


Perfeito. Vamos continuar exatamente no mesmo nível técnico. A partir desta etapa, vamos deixar de olhar apenas para as abas e começar a documentar o **modelo funcional do sistema**, que será a base para a modelagem do banco de dados e das regras da futura aplicação.

---

# FASE 9 — Dicionário Funcional do Sistema de Custos

## Objetivo

Documentar cada informação utilizada pelo sistema.

A pergunta respondida nesta fase é:

> **O que é cada campo? De onde ele vem? Para onde ele vai? Qual sua função?**

Esta documentação elimina a necessidade de interpretar fórmulas durante o desenvolvimento.

---

# DF-001 — Produto

## Finalidade

Representa a identificação da família do tecido.

Exemplos encontrados:

```
1000

1750

2021

K1820

C1420

B0010
```

## Tipo

Cadastro Mestre

## Origem

Nome da aba.

## Utilização

Serve como identificador da estrutura técnica daquele tecido.

## Dependências

* Consumo
* Peso
* Custos
* Beneficiamentos
* Custo dos Tecidos

---

# DF-002 — Acabamento

## Finalidade

Define qual processo industrial foi aplicado ao tecido.

Valores identificados

```
Cru

Branco

Preto

Tinto

Estampado

Termofixado
```

## Tipo

Cadastro

## Impacto

Altera diretamente:

* custo industrial;
* custo de beneficiamento;
* custo final.

## Observação

O acabamento **não altera a estrutura física do tecido**.

Ele altera apenas o custo.

---

# DF-003 — Peso do Urdume

## Finalidade

Calcular o peso do conjunto de fios do urdume.

## Origem

Dados técnicos.

## Fórmula

```
Largura

×

Quantidade de fios

×

Título

÷

9000
```

## Utilização

Compõe o peso total.

---

# DF-004 — Peso da Trama

Mesmo conceito do urdume.

Existe suporte para:

```
Trama 1

Trama 2
```

O sistema aceita tecidos com múltiplas matérias-primas.

---

# DF-005 — Peso Total

## Finalidade

Representa o peso teórico do tecido.

## Fórmula

```
Peso Urdume

+

Peso Trama 1

+

Peso Trama 2
```

## Utilização

É a base para:

* consumo;
* matéria-prima;
* custo.

---

# DF-006 — Preço do Fio

## Finalidade

Representa o custo unitário da matéria-prima.

## Origem

CENTRO DE CUSTO

## Tipo

Parâmetro

## Dependências

Todas as famílias de tecidos.

## Observação

Nunca deve existir preço de fio armazenado dentro das abas dos produtos.

---

# DF-007 — Ajuste Global

## Finalidade

Permitir reajustes sem alterar os preços base.

## Fórmula encontrada

```
Preço Atual

=

Preço Base

+

Ajuste Global
```

## Benefício

Permite reajustes mensais rápidos.

---

# DF-008 — Consumo de Matéria-Prima

## Finalidade

Determinar quanto de cada fio será utilizado.

## Origem

Peso calculado.

## Utilização

Multiplicação pelo preço do fio.

---

# DF-009 — Custo da Matéria-Prima

## Fórmula lógica

```
Consumo

×

Preço
```

## Saída

Valor monetário.

---

# DF-010 — Preço do Ponto

## Origem

CENTRO DE CUSTO.

## Tipo

Parâmetro.

## Função

Determina o custo da tecelagem.

## Observação

Cada tecnologia possui seu valor.

---

# DF-011 — Facção

## Finalidade

Representar o custo produtivo da tecelagem.

## Entrada

Preço do ponto.

## Saída

Valor industrial.

---

# DF-012 — Beneficiamento

## Finalidade

Adicionar processos posteriores à tecelagem.

Exemplos encontrados

```
Termofixação

Engomagem
```

## Origem

CENTRO DE CUSTO.

---

# DF-013 — Quebra Industrial

## Finalidade

Compensar perdas durante a produção.

## Tipo

Percentual.

## Aplicação

Após a soma:

```
Matéria-Prima

+

Tecelagem
```

---

# DF-014 — Quebra Final

## Finalidade

Compensar perdas do acabamento.

## Aplicação

Após beneficiamento.

---

# DF-015 — Custo Industrial

## Conceito

Representa quanto custa fabricar o tecido.

Não considera:

* lucro;
* ICMS;
* comissão;
* financeiro.

---

# DF-016 — Financeiro

## Finalidade

Cobrir custo do prazo concedido ao cliente.

## Parametrização

Por condição de pagamento.

---

# DF-017 — Comissão

## Finalidade

Cobrir despesas comerciais.

## Tipo

Percentual.

---

# DF-018 — ICMS

## Finalidade

Tributo estadual.

## Observação

Não altera o custo industrial.

Participa apenas da formação do preço.

---

# DF-019 — PIS

Tributo federal.

Mesmo conceito.

---

# DF-020 — COFINS

Tributo federal.

Mesmo conceito.

---

# DF-021 — Lucro

## Finalidade

Definir a margem mínima desejada.

## Tipo

Percentual.

## Origem

CENTRO DE CUSTO.

---

# DF-022 — Markup

## Conceito

Fator calculado automaticamente.

Não é informado pelo usuário.

## Utilização

Transformar custo em preço.

---

# DF-023 — Custo dos Tecidos

## Finalidade

Publicar o custo oficial.

Não calcula.

Não altera valores.

Somente consolida.

---

# DF-024 — Tabelas Comerciais

## Finalidade

Converter o custo em preços para diferentes cenários.

Exemplos

```
SP

Interior

FOB

CIF

7%

12%
```

Cada tabela aplica regras específicas de tributação, frete e política comercial.

---

# Conclusão da Fase 9

Com este dicionário funcional, temos um inventário das principais entidades de negócio do sistema. Ele não depende do Excel: descreve **o significado de cada informação**, sua origem e seu papel no processo de custeio.

Até aqui, a documentação já demonstra que a planilha segue uma arquitetura consistente:

1. **Parâmetros centralizados** (aba `CENTRO DE CUSTO`);
2. **Cálculo industrial por família de tecido**;
3. **Consolidação dos custos** (aba `Custo dos Tecidos`);
4. **Formação de preços** por cenários comerciais.

---

# Próxima etapa — FASE 10

Na próxima fase vamos construir a **Especificação Funcional Completa**, transformando toda a lógica identificada em requisitos de sistema. Ela responderá perguntas como:

* Quais módulos o sistema deve possuir?
* Quais cadastros são obrigatórios?
* Quais regras de negócio devem ser implementadas?
* Quais cálculos devem existir?
* Qual deve ser o fluxo operacional entre os módulos?

Essa será a primeira parte da documentação voltada diretamente para a equipe de desenvolvimento, servindo como base para modelagem de banco de dados, APIs e interface do futuro sistema, preservando integralmente a lógica da planilha atual.
