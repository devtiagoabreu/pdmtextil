> **Primeiro entendemos exatamente o que existe. Depois especificamos a evolução.**

É assim que SAP, TOTVS, Senior, Datasul, Siemens, Oracle e qualquer software house séria trabalham.

---

# DOCUMENTO 001

# LEVANTAMENTO FUNCIONAL DO PDM

**Projeto:** Implantação da Engenharia Econômica

**Versão:** 1.0

**Status:** Em elaboração

---

# 1. Objetivo

Este documento tem como objetivo identificar todos os módulos atualmente existentes no PDM, suas responsabilidades e sua participação no processo de formação do custo.

Nenhum requisito novo será definido antes deste levantamento.

---

# 2. Escopo

O levantamento contempla exclusivamente funcionalidades já existentes no PDM.

Não contempla novas funcionalidades.

---

# 3. Princípio Arquitetural

O PDM permanecerá como o sistema responsável pela Engenharia do Produto.

A Engenharia Econômica será uma extensão do PDM e consumirá os dados técnicos já cadastrados.

Em nenhuma hipótese serão duplicadas informações já existentes.

---

# 4. Inventário Funcional do PDM

Este é o primeiro artefato do projeto.

Cada módulo deverá ser documentado.

## Módulo Produto

### Objetivo

Cadastro principal do artigo.

### Responsabilidade

Identificação única do produto.

### Dados mantidos

* Código
* Descrição
* Situação
* Unidade
* Família
* Coleção
* Cliente (quando aplicável)

### Consumido por

* Estrutura
* Receitas
* Produto Cru
* Engenharia Econômica

### Alterações previstas

Nenhuma.

---

## Módulo Produto Cru

### Objetivo

Registrar as características técnicas do produto antes dos processos produtivos.

### Dados mantidos

(Será preenchido conforme levantamento.)

### Consumido por

* Engenharia
* Receitas
* Engenharia Econômica

### Alterações previstas

Nenhuma.

---

## Módulo Estrutura

### Objetivo

Representar a estrutura técnica do produto.

### Responsabilidade

Informar todos os elementos estruturais utilizados na fabricação.

### Alterações previstas

Nenhuma.

---

## Módulo Composição

### Objetivo

Registrar a composição do tecido.

### Dados mantidos

* Fios
* Percentuais
* Composição

### Alterações previstas

Nenhuma.

---

## Módulo Receitas

### Objetivo

Representar o fluxo operacional do produto.

### Dados utilizados

* Processos
* Sequência
* Consumos

### Alterações previstas

Nenhuma.

---

## Módulo Beneficiamentos

### Objetivo

Registrar todos os beneficiamentos executados.

### Alterações previstas

Nenhuma.

---

## Módulo Produtos Químicos

### Objetivo

Cadastrar todos os produtos químicos utilizados nas receitas.

### Alterações previstas

Nenhuma.

---

## Módulo Documentos

### Objetivo

Centralizar documentos técnicos do produto.

### Alterações previstas

Nenhuma.

---

# 5. Diagnóstico

Após análise do PDM conclui-se que:

## O PDM já resolve completamente:

✔ Engenharia do Produto

✔ Cadastro Técnico

✔ Estrutura

✔ Receitas

✔ Beneficiamentos

✔ Produtos Químicos

✔ Documentação

Portanto, estes módulos não fazem parte do escopo da Engenharia Econômica.

---

# 6. Escopo da Engenharia Econômica

A Engenharia Econômica será responsável exclusivamente por informações financeiras relacionadas ao produto.

Ela não será proprietária de nenhuma informação técnica.

---

# 7. Matriz de Responsabilidade

| Informação           | Responsável          |
| -------------------- | -------------------- |
| Produto              | PDM                  |
| Estrutura            | PDM                  |
| Receita              | PDM                  |
| Beneficiamentos      | PDM                  |
| Produtos Químicos    | PDM                  |
| Custo                | Engenharia Econômica |
| Variáveis Econômicas | Engenharia Econômica |
| Cenários             | Engenharia Econômica |
| Simulações           | Engenharia Econômica |
| Versionamento        | Engenharia Econômica |

---

# 8. Conclusão

O levantamento demonstra que a implantação da Engenharia Econômica não exige alterações estruturais no PDM.

A evolução ocorrerá através da inclusão de um novo domínio funcional, mantendo o PDM como única fonte oficial das informações técnicas.

---

# O QUE EU MUDARIA NA NOSSA FORMA DE TRABALHAR

Agora vem a parte mais importante.

**Eu não escreveria mais nenhum documento sem o PDM aberto na minha frente.**

Porque agora entramos na fase de **especificação funcional**.

E aqui não existe espaço para suposição.

## Minha proposta

Nós vamos reconstruir o projeto **módulo por módulo**.

Por exemplo, começaremos pelo módulo **Produto**.

Eu vou analisar:

* todas as telas;
* todos os campos;
* todas as abas;
* todas as validações;
* todos os relacionamentos.

Ao final, teremos uma documentação completa desse módulo.

Depois faremos o mesmo com:

* Produto Cru;
* Estrutura;
* Composição;
* Receitas;
* Beneficiamentos;
* Produtos Químicos.

**Só depois** de documentar completamente o PDM existente começaremos a especificar a Engenharia Econômica.

---

# É aqui que eu acho que estava o erro desde o início

Nós tentamos projetar a Engenharia Econômica **sem antes documentar o sistema que vai recebê-la**.

Isso inverte a ordem natural do projeto.

Na minha opinião, o caminho correto é:

1. **Documentar completamente o PDM atual** (AS IS).
2. **Mapear a planilha de custos** (AS IS).
3. **Comparar os dois mundos** (Gap Analysis).
4. **Projetar apenas o que falta** (TO BE).

Esse método produz uma documentação muito mais sólida, evita retrabalho e garante que a Engenharia Econômica seja realmente uma evolução do PDM, e não um módulo paralelo. **Se eu estivesse liderando esse projeto, essa seria a abordagem oficial que eu adotaria do início ao fim.**

Perfeito. Agora sim estamos entrando no nível que eu considero **profissional**.

E vou definir uma regra que será seguida até o final do projeto:

> **Não vamos documentar telas. Vamos documentar Domínios de Negócio.**

Isso muda completamente a qualidade da documentação.

---

# PDM PRO

# ESPECIFICAÇÃO FUNCIONAL

## Documento 002

# Domínio: Produto

Versão 1.0

---

# 1. Objetivo

O domínio **Produto** representa a entidade principal do PDM.

Todas as demais entidades possuem relacionamento direto ou indireto com o Produto.

O Produto é a unidade central da Engenharia do Produto e, futuramente, também da Engenharia Econômica.

Nenhum processo do sistema poderá existir sem um Produto.

---

# 2. Responsabilidades

O domínio Produto é responsável exclusivamente pela identificação do artigo.

Ele **não calcula custo**.

Ele **não mantém receitas**.

Ele **não mantém estrutura**.

Ele apenas identifica o produto que será utilizado pelos demais módulos.

---

# 3. Responsabilidades do Produto

O Produto deverá responder perguntas como:

* Qual é este artigo?
* Qual seu código?
* Está ativo?
* Qual sua descrição?
* Qual sua família?
* Qual coleção pertence?
* Qual unidade de medida?
* Possui engenharia cadastrada?

Ele não responde:

* Quanto custa?
* Qual margem?
* Qual imposto?

Essas respostas pertencem à Engenharia Econômica.

---

# 4. Relações

O Produto possui relacionamento com:

```text
Produto

├── Produto Cru

├── Estrutura

├── Composição

├── Receitas

├── Beneficiamentos

├── Produtos Químicos

├── Documentos

└── Engenharia Econômica (novo domínio)
```

Observe.

A Engenharia Econômica é apenas mais um consumidor.

Ela não altera o Produto.

---

# 5. Regras de Negócio

## RN-PROD-001

Todo Produto deverá possuir um identificador único.

---

## RN-PROD-002

Não poderá existir Engenharia Econômica sem Produto.

---

## RN-PROD-003

O Produto poderá possuir diversas versões de custo.

---

## RN-PROD-004

A exclusão lógica do Produto impedirá novos cálculos econômicos.

Os cálculos históricos permanecerão disponíveis para consulta.

---

## RN-PROD-005

Toda informação econômica deverá ser vinculada ao Produto.

Nunca diretamente à Receita ou à Estrutura.

---

# 6. Responsabilidade dos Dados

| Informação | Responsável |
| ---------- | ----------- |
| Código     | Produto     |
| Descrição  | Produto     |
| Unidade    | Produto     |
| Situação   | Produto     |
| Família    | Produto     |
| Coleção    | Produto     |

---

# 7. Eventos

O Produto gera eventos que poderão impactar a Engenharia Econômica.

Exemplo:

### Produto criado

A Engenharia Econômica poderá ser inicializada.

---

### Produto alterado

A Engenharia Econômica deverá verificar se houve impacto técnico.

---

### Produto inativado

Novos cálculos deixam de ser permitidos.

Histórico permanece.

---

# 8. Integrações

O domínio Produto fornece informações para:

* Estrutura
* Composição
* Receitas
* Beneficiamentos
* Produtos Químicos
* Engenharia Econômica

---

# 9. Restrições

O domínio Produto nunca deverá armazenar:

* preço
* margem
* impostos
* frete
* energia
* custos
* simulações
* cenários

Essas informações pertencem exclusivamente ao domínio Engenharia Econômica.

---

# 10. Impacto da Engenharia Econômica

A implantação do novo módulo não altera nenhuma responsabilidade do domínio Produto.

O relacionamento ocorrerá apenas por referência.

---

# Conclusão

O domínio Produto permanece inalterado.

Ele continuará sendo a fonte oficial de identificação do artigo.

A Engenharia Econômica utilizará apenas sua chave de identificação para relacionar cenários, versões e resultados de custo.

---

# O próximo documento (e aqui começa a engenharia de verdade)

Até agora falamos do **Produto**, que é um domínio administrativo.

O próximo documento será sobre o **Produto Cru**, e esse, na minha opinião, é o primeiro domínio que realmente influencia o custo.

Nele vamos responder perguntas como:

* O que caracteriza tecnicamente um Produto Cru?
* Quais informações dele são obrigatórias para o cálculo do custo?
* Quais campos são apenas informativos?
* Quais alterações no Produto Cru invalidam um custo já calculado?
* Como a Engenharia Econômica deve detectar que um custo precisa ser recalculado?

## Uma mudança importante na nossa documentação

Quero propor uma melhoria no padrão.

Em vez de escrever um documento por "módulo", vamos escrever um documento por **domínio**, sempre com a mesma estrutura:

1. Objetivo do domínio.
2. Responsabilidades.
3. Dados mantidos.
4. Regras de negócio.
5. Relacionamentos.
6. Eventos.
7. Integrações.
8. Impacto na Engenharia Econômica.
9. Critérios de invalidação do custo.

Esse último item é algo que ainda não abordamos e considero essencial. Ele definirá exatamente **quais alterações técnicas obrigam um novo cálculo de custo** e quais alterações podem ocorrer sem impacto econômico. Essa rastreabilidade será fundamental para manter a confiabilidade do módulo ao longo do tempo. Acho que esse padrão vai tornar a documentação muito mais consistente e útil para desenvolvimento e manutenção.

Excelente.

Agora começa a documentação que realmente vai definir o sucesso do projeto.

E aqui eu vou fazer uma mudança importante.

## Até agora documentamos o PDM.

Daqui para frente vamos documentar **os pontos de integração entre o PDM e a Engenharia Econômica**.

Porque é aí que o desenvolvimento vai acontecer.

---

# PDM PRO

## ESPECIFICAÇÃO FUNCIONAL

### Documento 003

# Domínio: Produto Cru

Versão 1.0

---

# 1. Objetivo

O domínio **Produto Cru** representa a especificação técnica do artigo antes da aplicação dos processos produtivos.

Ele contém as informações que caracterizam fisicamente o produto e servem como base para:

* Engenharia
* Produção
* Receitas
* Formação do custo

O Produto Cru não possui responsabilidade financeira.

Sua função é fornecer parâmetros técnicos para a Engenharia Econômica.

---

# 2. Responsabilidade

O Produto Cru é responsável por definir as características físicas do artigo.

Exemplos:

* Tipo do tecido
* Gramatura
* Largura
* Estrutura
* Rendimento
* Unidade técnica
* Demais características técnicas

Esses dados são utilizados durante a formação do custo.

---

# 3. Responsabilidades da Engenharia Econômica

A Engenharia Econômica não altera nenhuma informação do Produto Cru.

Ela apenas consulta essas informações.

Exemplo:

```text
Produto Cru

↓

Gramatura

↓

Utilizada no cálculo do consumo
```

---

# 4. Integrações

O Produto Cru fornece informações para:

```text
Produto Cru

↓

Composição

↓

Receitas

↓

Beneficiamentos

↓

Engenharia Econômica
```

---

# 5. Dados Consumidos pela Engenharia Econômica

A Engenharia Econômica poderá utilizar informações como:

| Informação | Utilização                    |
| ---------- | ----------------------------- |
| Gramatura  | Base para cálculos de consumo |
| Largura    | Conversões e rendimento       |
| Estrutura  | Determinação dos processos    |
| Rendimento | Cálculos técnicos             |
| Unidade    | Conversões de custo           |

**Observação:** esta lista será refinada durante a engenharia reversa da planilha. Não devemos assumir campos que não existam no PDM.

---

# 6. Regras de Negócio

### RN-PCR-001

Todo Produto Cru deverá estar vinculado a um Produto.

---

### RN-PCR-002

Não poderá existir cálculo econômico sem um Produto Cru válido, quando ele for obrigatório para aquele tipo de produto.

---

### RN-PCR-003

A Engenharia Econômica nunca poderá alterar informações técnicas do Produto Cru.

---

### RN-PCR-004

Sempre que um parâmetro técnico utilizado no cálculo for alterado, os custos relacionados deverão ser marcados como **"Necessita Revalidação"**.

---

# 7. Eventos

## Evento: Produto Cru criado

Impacto:

Nenhum.

Apenas disponibiliza informações para futuros cálculos.

---

## Evento: Produto Cru alterado

Impacto:

O sistema deverá identificar se o campo alterado influencia o custo.

Se sim:

* marcar cenários afetados;
* registrar motivo da revalidação.

---

## Evento: Produto Cru inativado

Impacto:

Não permitir novos cálculos.

Histórico permanece disponível.

---

# 8. Critérios de Revalidação

Nem toda alteração exige recalcular o custo.

Devemos classificar os campos em dois grupos:

## Grupo A – Informativos

Exemplo:

* Observações
* Descrição complementar

Esses campos não invalidam o custo.

---

## Grupo B – Técnicos

Exemplo:

* Gramatura
* Largura
* Estrutura
* Rendimento

Esses campos podem alterar o resultado do cálculo.

Sempre que modificados:

* cenário recebe status **"Necessita Revalidação"**;
* usuário é informado do motivo.

---

# 9. Responsabilidades

| Informação             | Responsável          |
| ---------------------- | -------------------- |
| Gramatura              | Produto Cru          |
| Largura                | Produto Cru          |
| Estrutura Técnica      | Produto Cru          |
| Rendimento             | Produto Cru          |
| Conversões Financeiras | Engenharia Econômica |

---

# 10. O que NÃO pertence ao Produto Cru

Não deverão existir neste domínio:

* preço
* custo
* margem
* tributos
* despesas
* frete
* energia
* comissão

Esses elementos pertencem exclusivamente à Engenharia Econômica.

---

# Conclusão

O domínio Produto Cru permanece integralmente responsável pelas características técnicas do artigo.

A Engenharia Econômica apenas utiliza essas informações como entradas para o cálculo, preservando a separação entre engenharia técnica e engenharia financeira.

---

# Próximo Documento

## Domínio: Composição

Este será um dos documentos mais importantes de todo o projeto.

Na planilha de custos, grande parte dos cálculos depende da composição do produto (fios, percentuais, consumo e materiais).

No documento da Composição vamos responder de forma objetiva:

* Quais informações da composição influenciam o custo?
* Quais campos são obrigatórios?
* Como a Engenharia Econômica deve consumir essa composição?
* Como tratar mudanças na composição sem perder o histórico dos custos?
* Quais alterações exigem revalidação dos cenários?

---

## Antes de continuar, preciso registrar uma decisão de arquitetura

Depois de revisar toda a estratégia, proponho um princípio que deverá aparecer logo no início da documentação oficial:

> **A Engenharia Econômica não é proprietária de dados técnicos. Ela é proprietária apenas das regras econômicas e dos resultados de cálculo.**

Isso significa que, sempre que precisarmos de uma informação, a primeira pergunta será:

1. **Esse dado já existe no PDM?** → Reutilizar.
2. **Esse dado não existe?** → Criar somente no domínio Engenharia Econômica.

Esse princípio vai orientar todas as decisões de modelagem, evitar duplicidade de informações e garantir que o PDM continue sendo a única fonte de verdade para a engenharia do produto. Na minha avaliação, essa é a decisão arquitetural mais importante do projeto e deve constar como um princípio oficial da especificação.

Perfeito.

Agora chegamos ao domínio que, na minha opinião, é o **mais importante de todo o PDM para a Engenharia Econômica**.

Depois de analisar a planilha e o PDM, eu considero que o **Produto** identifica o artigo, mas a **Composição** define grande parte do custo do produto.

Então esse documento precisa ser extremamente sólido.

---

# PDM PRO

## ESPECIFICAÇÃO FUNCIONAL

### Documento 004

# Domínio: Composição

Versão 1.0

---

# 1. Objetivo

O domínio **Composição** é responsável por definir a estrutura física do produto em termos de matérias-primas têxteis.

A composição representa a engenharia dos materiais utilizados na fabricação do produto.

Ela será uma das principais fontes de informação para a Engenharia Econômica, pois determina quais matérias-primas deverão compor o custo.

---

# 2. Responsabilidade

A Composição é responsável por responder perguntas como:

* Quais matérias-primas compõem este produto?
* Qual o percentual de cada matéria-prima?
* Qual fio está sendo utilizado?
* Existe mistura de fibras?
* Existe elastano?
* Existe poliéster?
* Existe algodão?
* Qual a participação de cada componente?

Ela **não responde**:

* Quanto custa cada matéria-prima?
* Qual fornecedor?
* Qual preço?
* Qual margem?

Essas respostas pertencem à Engenharia Econômica.

---

# 3. Responsabilidade do PDM

O PDM continua sendo o proprietário da composição técnica.

Toda alteração na composição deverá continuar sendo realizada exclusivamente no módulo Composição.

A Engenharia Econômica nunca poderá alterar esses dados.

---

# 4. Dados disponibilizados

O domínio Composição disponibiliza para a Engenharia Econômica informações como:

| Informação      | Utilização                             |
| --------------- | -------------------------------------- |
| Matéria-prima   | Identificação dos componentes do custo |
| Percentual      | Rateio de consumo                      |
| Tipo de fibra   | Definição das regras de cálculo        |
| Fio relacionado | Integração com o domínio Fios          |

---

# 5. Relação com outros domínios

```text
Produto

↓

Produto Cru

↓

Composição

↓

Fios

↓

Receitas

↓

Beneficiamentos

↓

Engenharia Econômica
```

A composição nunca trabalha isoladamente.

---

# 6. Integração com a Engenharia Econômica

A Engenharia Econômica utilizará a composição para:

* identificar matérias-primas envolvidas;
* calcular participação de cada material;
* determinar quais variáveis econômicas utilizar;
* calcular o custo de matérias-primas.

O custo será calculado a partir da composição, mas a composição continuará sendo mantida apenas pelo PDM.

---

# 7. Regras de Negócio

### RN-COMP-001

Toda composição deverá estar vinculada a um Produto.

---

### RN-COMP-002

Toda composição deverá possuir pelo menos um componente.

---

### RN-COMP-003

A soma dos percentuais deverá obedecer às regras definidas pelo negócio.

> **Observação:** a validação exata (por exemplo, totalizando 100%) deverá ser confirmada com a regra atual do PDM. Não devemos assumir um comportamento diferente do sistema existente.

---

### RN-COMP-004

A Engenharia Econômica utilizará apenas composições aprovadas e vigentes.

---

### RN-COMP-005

A alteração da composição não altera automaticamente os custos existentes.

Ela deverá apenas marcar os cenários relacionados como:

> **Necessita Revalidação**

---

# 8. Critérios de Revalidação

Alterações que exigem revisão do custo:

* inclusão de matéria-prima;
* exclusão de matéria-prima;
* alteração de percentual;
* substituição de fio;
* alteração da composição do tecido.

Alterações administrativas:

* observações;
* descrição.

Não exigem recálculo.

---

# 9. Responsabilidades

| Informação           | Responsável                             |
| -------------------- | --------------------------------------- |
| Matérias-primas      | Composição                              |
| Percentuais          | Composição                              |
| Tipo de fibra        | Composição                              |
| Custo da fibra       | Engenharia Econômica                    |
| Preço da fibra       | Engenharia Econômica                    |
| Fornecedor econômico | Engenharia Econômica (quando aplicável) |

---

# 10. Impacto na Engenharia Econômica

A composição define:

* quais componentes econômicos existirão;
* quais regras deverão ser executadas;
* quais preços deverão ser consultados.

Ela não define valores financeiros.

---

# 11. Eventos

### Composição criada

Disponibiliza informações para cálculo.

---

### Composição alterada

O sistema deverá verificar se houve impacto econômico.

Caso positivo:

* marcar cenários afetados;
* registrar motivo da revalidação.

---

### Composição inativada

Não permitir novos cálculos utilizando essa versão.

Os cálculos históricos permanecem válidos para consulta.

---

# 12. Critérios Técnicos

A Engenharia Econômica nunca deverá:

* armazenar novamente a composição;
* manter percentuais próprios;
* manter lista própria de matérias-primas.

Toda consulta será realizada diretamente no PDM.

---

# 13. Integração Futura

Este domínio deverá permitir futuramente:

* comparação entre versões da composição;
* análise de impacto financeiro de alterações;
* simulação de substituição de matérias-primas;
* análise de redução de custo.

Essas funcionalidades utilizarão a composição existente, sem criar novos cadastros.

---

# Conclusão

A composição é um domínio exclusivamente técnico.

Seu papel é informar **o que** compõe o produto.

A Engenharia Econômica responderá **quanto custa** essa composição.

Essa separação preserva a responsabilidade de cada módulo e evita duplicidade de informações.

---

# Próximo Documento

## Documento 005 — Domínio: Receitas

Esse será o primeiro documento onde começaremos a conectar diretamente o PDM com a lógica da planilha.

A receita não é apenas uma sequência de processos; ela representa **como o produto é fabricado**. Para a Engenharia Econômica, isso significa identificar:

* quais processos geram custo;
* quais consomem produtos químicos;
* quais utilizam recursos (energia, água, gás, vapor);
* quais são terceirizados (beneficiamento externo);
* quais devem ser considerados na formação do custo industrial.

## Uma observação importante antes de seguir

A partir deste documento, eu deixaria de tratar a Engenharia Econômica apenas como um "consumidor de dados" e começaria a documentar **como cada domínio alimenta o motor de cálculo**.

Por exemplo, para cada domínio do PDM passaremos a ter uma tabela como esta:

| Domínio           | Alimenta o custo? | Como alimenta?                |
| ----------------- | ----------------- | ----------------------------- |
| Produto           | Sim               | Identificação do cenário      |
| Produto Cru       | Sim               | Parâmetros técnicos           |
| Composição        | Sim               | Matérias-primas e percentuais |
| Receitas          | Sim               | Processos e consumos          |
| Beneficiamentos   | Sim               | Custos externos e etapas      |
| Produtos Químicos | Sim               | Insumos dos processos         |
| Documentos        | Não diretamente   | Evidências e rastreabilidade  |

Essa matriz será muito útil para o desenvolvimento, pois mostra claramente quais módulos participam da formação do custo e qual é o papel de cada um, sem misturar responsabilidades. Na minha opinião, ela deve fazer parte da documentação oficial da arquitetura funcional do projeto.


Perfeito.

Agora chegamos ao domínio que, depois da **Composição**, considero o mais importante para a Engenharia Econômica.

Na planilha, boa parte do custo não está na matéria-prima.

Está no **processo de fabricação**.

E é exatamente isso que a **Receita** representa.

Aqui eu vou tomar um cuidado que até agora não tivemos.

> **Não vamos assumir que toda etapa gera custo.**
>
> A Receita define **o processo**. A Engenharia Econômica decidirá **quais processos possuem impacto financeiro e como esse impacto será calculado**.

Essa separação é extremamente importante.

---

# PDM PRO

# ESPECIFICAÇÃO FUNCIONAL

## Documento 005

# Domínio: Receitas

Versão 1.0

---

# 1. Objetivo

O domínio Receitas representa a sequência técnica utilizada para fabricar um produto.

Uma Receita descreve como o produto será produzido, quais operações serão executadas e quais recursos serão utilizados durante o processo produtivo.

A Receita pertence integralmente ao PDM.

A Engenharia Econômica utilizará essas informações para determinar os custos dos processos.

---

# 2. Responsabilidade

A Receita responde perguntas como:

* Quais processos o produto executa?
* Em qual ordem?
* Quais operações existem?
* Quais produtos químicos são utilizados?
* Existe beneficiamento?
* Existe lavagem?
* Existe tingimento?
* Existe acabamento?

Ela não responde:

* Quanto custa cada processo?
* Quanto custa cada produto químico?
* Quanto custa produzir essa operação?

Essas respostas pertencem à Engenharia Econômica.

---

# 3. Estrutura

A Receita representa um roteiro produtivo.

```text
Produto

↓

Receita

↓

Operação 10

↓

Operação 20

↓

Operação 30

↓

Operação 40
```

A Engenharia Econômica utilizará essa sequência como base para montar o custo industrial.

---

# 4. Responsabilidade do PDM

O PDM continua responsável por:

* criar receitas;
* alterar receitas;
* excluir (conforme regras do sistema);
* controlar revisões;
* controlar vigência.

A Engenharia Econômica apenas consulta.

---

# 5. Dados disponibilizados

A Receita disponibiliza para a Engenharia Econômica:

| Informação             | Utilização                   |
| ---------------------- | ---------------------------- |
| Operação               | Identificar etapas do custo  |
| Sequência              | Ordem do processamento       |
| Produto Químico        | Consumo de insumos           |
| Consumo Técnico        | Base dos cálculos            |
| Beneficiamento         | Custos externos              |
| Tempo (quando existir) | Base para custos industriais |

---

# 6. Relação com outros domínios

```text
Produto

↓

Receita

├── Produtos Químicos

├── Beneficiamentos

├── Consumos

└── Engenharia Econômica
```

---

# 7. Regras de Negócio

### RN-REC-001

Toda Receita deverá estar vinculada a um Produto.

---

### RN-REC-002

A Receita deverá possuir pelo menos uma operação.

---

### RN-REC-003

As operações deverão possuir sequência.

A Engenharia Econômica utilizará essa sequência apenas quando houver dependência entre processos.

---

### RN-REC-004

Produtos Químicos deverão ser consumidos através da Receita.

Nunca diretamente pela Engenharia Econômica.

---

### RN-REC-005

Toda alteração na Receita deverá registrar nova revisão conforme as regras já existentes do PDM.

A Engenharia Econômica nunca altera revisões.

---

# 8. Critérios de Revalidação

Alterações que exigem nova análise econômica:

* inclusão de operação;
* exclusão de operação;
* alteração da sequência quando impactar o processo;
* alteração do consumo técnico;
* inclusão ou remoção de produto químico;
* alteração de beneficiamento.

---

Alterações administrativas:

* observações;
* descrição;
* documentação.

Não invalidam o custo.

---

# 9. Responsabilidades

| Informação           | Responsável          |
| -------------------- | -------------------- |
| Receita              | PDM                  |
| Operações            | PDM                  |
| Sequência            | PDM                  |
| Produtos Químicos    | PDM                  |
| Custos das Operações | Engenharia Econômica |
| Custos dos Químicos  | Engenharia Econômica |
| Custos Industriais   | Engenharia Econômica |

---

# 10. Integração com a Engenharia Econômica

A Receita alimentará o motor econômico da seguinte forma:

```text
Receita

↓

Operações

↓

Classificação Econômica

↓

Componentes do Custo

↓

Resultado
```

Observe que existe uma etapa nova.

## Classificação Econômica

Nem toda operação gera custo da mesma forma.

Exemplo:

| Operação               | Classificação Econômica |
| ---------------------- | ----------------------- |
| Tingimento             | Processo Industrial     |
| Lavagem                | Processo Industrial     |
| Revisão                | Controle de Qualidade   |
| Embalagem              | Logística               |
| Beneficiamento Externo | Serviço Terceirizado    |

Essa classificação **não altera a Receita**.

Ela será configurada pela Engenharia Econômica.

---

# 11. Eventos

## Receita criada

Disponibiliza informações para futuros cálculos.

---

## Receita alterada

Caso a alteração impacte consumo ou processo produtivo:

* marcar cenários econômicos como "Necessita Revalidação";
* registrar motivo.

---

## Receita inativada

Impedir novos cálculos utilizando essa receita.

Os históricos permanecem disponíveis.

---

# 12. O que NÃO pertence à Receita

A Receita nunca armazenará:

* custo da operação;
* custo da energia;
* custo do gás;
* custo da água;
* custo do químico;
* margem;
* tributos;
* despesas comerciais.

---

# 13. Conclusão

A Receita descreve **como fabricar**.

A Engenharia Econômica responde **quanto custa fabricar**.

Essa separação mantém a arquitetura limpa e evita duplicação de regras.

---

# 🚩 Nova decisão arquitetural (importante)

Durante a documentação deste domínio, identifiquei uma necessidade que não altera o PDM, mas será essencial para a Engenharia Econômica.

## Classificação Econômica de Operações

Hoje a Receita possui operações técnicas.

A Engenharia Econômica precisa saber como essas operações impactam o custo.

Em vez de alterar a tabela de Receitas, proponho criar uma configuração própria da Engenharia Econômica:

| Operação do PDM        | Categoria Econômica  | Considera Custo    | Método de Cálculo   |
| ---------------------- | -------------------- | ------------------ | ------------------- |
| Tingimento             | Processo Industrial  | Sim                | Por consumo         |
| Lavagem                | Processo Industrial  | Sim                | Por consumo         |
| Revisão                | Qualidade            | Sim                | Valor fixo ou tempo |
| Inspeção               | Qualidade            | Não (configurável) | -                   |
| Embalagem              | Logística            | Sim                | Valor fixo          |
| Beneficiamento Externo | Serviço Terceirizado | Sim                | Valor negociado     |

Essa tabela **não duplica a Receita**, apenas informa ao motor de custos **como interpretar economicamente cada operação**. Ela também elimina qualquer lógica fixa no código, permitindo adicionar novos processos no futuro apenas por configuração.

---

# Próximo Documento — Domínio: Beneficiamentos

Esse documento tratará especificamente dos processos terceirizados e internos que agregam custo ao produto.

Nele vamos definir:

* quando um beneficiamento gera custo;
* como vincular fornecedores (quando houver);
* como tratar custos por metro, kg, peça ou processo;
* como controlar versões de custo de beneficiamento;
* como permitir simulações de troca de fornecedor sem alterar o cadastro técnico do PDM.

Na minha avaliação, **Receitas + Beneficiamentos + Produtos Químicos** formarão o núcleo técnico que alimentará o motor de cálculo da Engenharia Econômica. A partir desses três domínios, o sistema terá todas as informações necessárias para transformar o conhecimento da planilha em um processo estruturado e auditável.

Perfeito.

Agora chegamos em um domínio que, depois de analisar o PDM e a planilha, eu considero que foi um dos motivos pelos quais a planilha acabou existindo.

A maioria dos ERPs trata o beneficiamento apenas como uma operação.

**Mas economicamente ele é um centro de custo.**

E isso muda completamente a modelagem.

Aqui precisamos separar definitivamente:

> **Beneficiamento Técnico (PDM)**

de

> **Custo do Beneficiamento (Engenharia Econômica)**

Essa separação será um dos pilares do sistema.

---

# PDM PRO

# ESPECIFICAÇÃO FUNCIONAL

## Documento 006

# Domínio: Beneficiamentos

Versão 1.0

---

# 1. Objetivo

O domínio Beneficiamentos representa todos os processos executados sobre o produto após sua fabricação ou durante seu fluxo produtivo.

O objetivo deste domínio é registrar **quais beneficiamentos fazem parte da engenharia do produto**.

A Engenharia Econômica utilizará essas informações para calcular o custo dos processos.

---

# 2. Responsabilidade

O Beneficiamento responde perguntas como:

* Existe Tingimento?
* Existe Estamparia?
* Existe Mercerização?
* Existe Sanforização?
* Existe Rama?
* Existe Calandra?
* Existe Processo Externo?

Ele NÃO responde:

* Quanto custa?

* Qual fornecedor é mais barato?

* Qual preço negociado?

* Qual custo por metro?

Essas respostas pertencem exclusivamente à Engenharia Econômica.

---

# 3. Papel dentro do PDM

O PDM continua sendo responsável por:

* cadastrar beneficiamentos;
* definir sequência técnica;
* vincular beneficiamentos ao produto;
* controlar revisões.

Nenhuma dessas responsabilidades será alterada.

---

# 4. Papel da Engenharia Econômica

A Engenharia Econômica utilizará cada beneficiamento como um componente econômico.

Cada beneficiamento poderá possuir:

* custo interno;
* custo terceirizado;
* fornecedor preferencial;
* fornecedor alternativo;
* método de cálculo;
* centro de custo;
* vigência.

Observe.

Essas informações **não pertencem ao PDM**.

---

# 5. Modelo Conceitual

```text
Produto

↓

Receita

↓

Beneficiamento

↓

Classificação Econômica

↓

Método de Cálculo

↓

Resultado Financeiro
```

---

# 6. Classificação Econômica

Cada beneficiamento deverá possuir uma classificação.

Exemplo.

| Categoria        | Exemplos            |
| ---------------- | ------------------- |
| Processo Interno | Rama, Calandra      |
| Processo Externo | Tinturaria Terceira |
| Serviço          | Revisão Externa     |
| Acabamento       | Resinagem           |
| Controle         | Laboratório         |

Essa classificação será utilizada apenas pela Engenharia Econômica.

---

# 7. Métodos de Cálculo

Cada beneficiamento poderá utilizar um método diferente.

Exemplo.

| Método          | Unidade |
| --------------- | ------- |
| Valor por metro | R$/m    |
| Valor por kg    | R$/kg   |
| Valor por peça  | R$/Peça |
| Valor por hora  | R$/h    |
| Valor fixo      | R$      |
| Percentual      | %       |

Esta é uma das principais evoluções em relação à planilha, pois elimina fórmulas específicas para cada caso.

---

# 8. Fornecedores

O PDM não deverá controlar negociação financeira.

A Engenharia Econômica poderá possuir:

Fornecedor padrão

Fornecedor alternativo

Fornecedor homologado

Fornecedor preferencial

Fornecedor para simulação

Exemplo

```text
Rama

↓

Fornecedor A

↓

0,82 / metro

Fornecedor B

↓

0,89 / metro

Fornecedor C

↓

0,94 / metro
```

O usuário poderá trocar o fornecedor em um cenário sem alterar a engenharia do produto.

---

# 9. Regras de Negócio

### RN-BEN-001

Todo beneficiamento deverá pertencer a uma Receita.

---

### RN-BEN-002

O custo do beneficiamento nunca será armazenado no cadastro técnico.

---

### RN-BEN-003

A Engenharia Econômica poderá definir diversos métodos de cálculo para o mesmo beneficiamento.

---

### RN-BEN-004

O mesmo beneficiamento poderá possuir custos diferentes conforme:

* fornecedor;
* cenário;
* vigência;
* moeda;
* unidade.

---

### RN-BEN-005

Alterações econômicas não alteram a engenharia.

---

# 10. Critérios de Revalidação

Necessitam recalcular:

✔ troca de fornecedor

✔ alteração de preço

✔ alteração do método

✔ alteração da unidade

✔ alteração de vigência

Não necessitam:

✔ descrição

✔ observações

✔ documentação

---

# 11. Responsabilidades

| Informação            | Responsável          |
| --------------------- | -------------------- |
| Beneficiamento        | PDM                  |
| Sequência             | PDM                  |
| Tipo                  | PDM                  |
| Fornecedor Financeiro | Engenharia Econômica |
| Preço                 | Engenharia Econômica |
| Método                | Engenharia Econômica |
| Centro de Custo       | Engenharia Econômica |

---

# 12. Cenários

Um dos grandes objetivos da Engenharia Econômica é permitir simulações.

Exemplo.

**Cenário Oficial**

```text
Rama

↓

Fornecedor A

↓

0,82/m
```

**Simulação**

```text
Rama

↓

Fornecedor B

↓

0,78/m
```

A engenharia permanece exatamente igual.

Apenas o custo muda.

---

# 13. Histórico

Cada alteração deverá manter histórico completo.

Exemplo.

| Versão | Fornecedor   | Valor | Vigência |
| ------ | ------------ | ----- | -------- |
| 1      | Fornecedor A | 0,82  | Jan/26   |
| 2      | Fornecedor B | 0,79  | Fev/26   |
| 3      | Fornecedor A | 0,84  | Mar/26   |

Nunca haverá atualização destrutiva.

---

# 14. Conclusão

O domínio Beneficiamentos continuará responsável exclusivamente pela definição técnica dos processos.

A Engenharia Econômica será responsável por transformar cada processo em um componente financeiro parametrizável, versionado e auditável.

Essa separação permite alterar preços, fornecedores e métodos de cálculo sem modificar a engenharia do produto.

---

# 📌 Decisão arquitetural importante

Durante este documento surgiu uma oportunidade de simplificação.

Em vez de criar regras específicas para Beneficiamentos, Produtos Químicos, Energia, Água, Gás e outros componentes, proponho que o motor da Engenharia Econômica trabalhe com um conceito único: **Componente de Custo**.

Cada componente teria:

| Campo             | Exemplo        |
| ----------------- | -------------- |
| Tipo              | Beneficiamento |
| Origem            | PDM            |
| Método de Cálculo | R$/m           |
| Variável Base     | Metragem       |
| Valor Unitário    | 0,82           |
| Vigência          | 01/01/2026     |
| Cenário           | Oficial        |

Com isso, Beneficiamentos, Produtos Químicos, Energia, Embalagem, Frete e qualquer novo elemento futuro passam a seguir exatamente o mesmo modelo de cálculo e versionamento.

## Minha recomendação

Essa é a primeira mudança conceitual que eu faria em relação à planilha.

**A planilha calcula custos por tipo de informação.**

**O novo sistema deve calcular custos por componentes.**

Essa mudança não altera nenhuma regra de negócio existente, mas cria uma arquitetura muito mais flexível, escalável e preparada para evoluções futuras. Na minha avaliação, esse será o principal diferencial do módulo de Engenharia Econômica em relação ao modelo atual baseado em Excel.

Perfeito.

Agora chegamos em um dos últimos domínios técnicos do PDM.

Depois deste documento, praticamente toda a engenharia do produto estará mapeada.

E aqui eu tomei uma decisão de arquitetura baseada na planilha que você me enviou.

**Os Produtos Químicos não serão tratados como estoque.**

Eles serão tratados como **insumos de processo**.

Isso parece uma diferença pequena, mas muda completamente a forma de calcular o custo.

---

# PDM PRO

# ESPECIFICAÇÃO FUNCIONAL

## Documento 007

# Domínio: Produtos Químicos

Versão 1.0

---

# 1. Objetivo

O domínio Produtos Químicos é responsável pelo cadastro técnico dos insumos utilizados nas receitas produtivas.

Seu objetivo é identificar os produtos químicos utilizados durante os processos industriais.

A Engenharia Econômica utilizará essas informações para calcular o custo dos insumos consumidos.

---

# 2. Responsabilidade

O módulo responde perguntas como:

* Qual produto químico será utilizado?
* Qual código?
* Qual descrição?
* Qual unidade?
* Está ativo?
* Pode ser utilizado em receitas?

Ele NÃO responde:

* Quanto custa?
* Qual fornecedor mais barato?
* Qual preço vigente?
* Qual impacto financeiro?

Essas informações pertencem à Engenharia Econômica.

---

# 3. Papel no PDM

O PDM continua responsável por:

* cadastro técnico;
* unidade de medida;
* descrição;
* classificação técnica;
* utilização em receitas.

Nenhuma alteração estrutural será necessária.

---

# 4. Papel na Engenharia Econômica

A Engenharia Econômica utilizará cada produto químico como um componente financeiro.

Cada produto poderá possuir:

* preço vigente;
* histórico de preços;
* fornecedor econômico;
* perdas;
* fator de correção;
* rendimento econômico;
* vigência;
* moeda.

Observe que nenhuma dessas informações pertence ao cadastro técnico.

---

# 5. Modelo Conceitual

```text
Receita

↓

Produto Químico

↓

Consumo Técnico

↓

Conversão

↓

Preço

↓

Custo
```

O PDM informa o consumo.

A Engenharia Econômica transforma esse consumo em valor financeiro.

---

# 6. Integração

O cálculo seguirá o seguinte fluxo:

```text
Produto

↓

Receita

↓

Produto Químico

↓

Quantidade Consumida

↓

Preço Unitário

↓

Custo do Processo
```

---

# 7. Métodos de Cálculo

Cada produto poderá utilizar unidades diferentes.

Exemplo.

| Unidade Técnica | Unidade Econômica |
| --------------- | ----------------- |
| g               | R$/kg             |
| ml              | R$/L              |
| kg              | R$/kg             |
| L               | R$/L              |

O motor econômico será responsável pelas conversões.

---

# 8. Variáveis Econômicas

Cada produto químico poderá possuir:

| Informação | Responsável          |
| ---------- | -------------------- |
| Preço      | Engenharia Econômica |
| Fornecedor | Engenharia Econômica |
| Desconto   | Engenharia Econômica |
| Frete      | Engenharia Econômica |
| Perda      | Engenharia Econômica |
| Impostos   | Engenharia Econômica |
| Vigência   | Engenharia Econômica |

---

# 9. Regras de Negócio

### RN-QUI-001

Todo produto químico deverá existir previamente no PDM.

---

### RN-QUI-002

O custo nunca será armazenado no cadastro técnico.

---

### RN-QUI-003

Um mesmo produto poderá possuir diversos preços.

Exemplo:

Fornecedor A

Fornecedor B

Fornecedor C

---

### RN-QUI-004

O preço deverá possuir vigência.

Nunca substituir o histórico.

---

### RN-QUI-005

O cálculo utilizará sempre o preço vigente para o cenário selecionado.

---

# 10. Critérios de Revalidação

Necessitam novo cálculo:

✔ alteração do preço

✔ alteração da perda

✔ alteração da unidade

✔ alteração do fator de conversão

✔ alteração da vigência

Não necessitam:

✔ descrição

✔ observações

✔ classificação

---

# 11. Histórico

Nunca haverá atualização destrutiva.

Exemplo.

| Versão | Preço | Vigência |
| ------ | ----- | -------- |
| 1      | 12,80 | Jan      |
| 2      | 13,15 | Fev      |
| 3      | 12,95 | Mar      |

---

# 12. Cenários

O mesmo produto poderá possuir valores diferentes.

Exemplo.

| Cenário    | Valor |
| ---------- | ----- |
| Oficial    | 12,80 |
| Simulação  | 11,90 |
| Exportação | 13,40 |

O cadastro técnico permanece único.

---

# 13. Conversões

O motor econômico deverá permitir conversões automáticas.

Exemplo.

```text
Receita

↓

15 g

↓

Conversão

↓

0,015 kg

↓

Preço

↓

R$/kg

↓

Resultado
```

As fórmulas de conversão deverão ser parametrizadas e reutilizáveis.

---

# 14. Conclusão

O domínio Produtos Químicos continuará responsável apenas pela identificação técnica dos insumos.

A Engenharia Econômica será responsável por transformar consumos em custos, mantendo histórico, vigência e cenários sem alterar o cadastro existente.

---

# Documento 008 — O ponto de virada do projeto

Até aqui documentamos **todos os domínios que alimentam o cálculo**.

Agora começa a documentação do módulo novo.

Não é mais PDM.

É a **Engenharia Econômica**.

Na minha visão, esse módulo será dividido em oito grandes domínios:

```text
ENGENHARIA ECONÔMICA

├── Cenários
├── Componentes de Custo
├── Variáveis Econômicas
├── Motor de Cálculo
├── Versionamento
├── Simulações
├── Aprovação
└── Auditoria
```

---

# Minha maior mudança em relação ao conceito inicial

Depois de toda essa análise, eu faria uma alteração importante na arquitetura.

Inicialmente falamos em criar um "módulo de custo".

Hoje eu não faria isso.

Eu criaria um **Motor de Engenharia Econômica**.

A diferença é grande.

## Módulo de custo

Recebe dados.

Calcula.

Mostra resultado.

Fim.

---

## Motor de Engenharia Econômica

Recebe dados do PDM.

Aplica regras parametrizadas.

Executa fórmulas.

Controla versões.

Gerencia cenários.

Mantém histórico.

Executa simulações.

Produz memória de cálculo.

Permite auditoria.

Exporta resultados.

Recalcula apenas componentes afetados.

Esse motor deixa de ser um simples cálculo e passa a ser uma plataforma reutilizável para qualquer produto, família ou processo.

## Próximo documento (Documento 008)

A partir daqui vamos parar de falar do PDM e começar a especificar o novo módulo.

O primeiro documento será:

> **Domínio: Cenários Econômicos**

Na minha opinião, ele será o coração do sistema, porque toda simulação, orçamento, revisão de preços e análise de impacto partirá do conceito de **cenário**, sem nunca alterar a engenharia oficial do produto. É essa separação que permitirá evoluir o sistema de forma segura e escalável.

Perfeito.

Agora chegamos ao ponto onde, na minha opinião, começa realmente **o novo sistema**.

Tudo o que documentamos até agora foi o **AS IS** (o que já existe).

Agora começa o **TO BE** (o que vamos construir).

E aqui eu vou fazer uma mudança importante na arquitetura.

## A Engenharia Econômica NÃO será um módulo.

Ela será um **domínio** do PDM.

Na prática ficará assim:

```text
PDM

├── Engenharia do Produto
│   ├── Produto
│   ├── Produto Cru
│   ├── Estrutura
│   ├── Composição
│   ├── Receitas
│   ├── Beneficiamentos
│   ├── Produtos Químicos
│   └── Documentos
│
└── Engenharia Econômica
    ├── Cenários
    ├── Variáveis
    ├── Componentes
    ├── Motor de Cálculo
    ├── Versionamento
    ├── Simulações
    ├── Aprovação
    └── Auditoria
```

Observe uma coisa.

O PDM continua exatamente igual.

Nós apenas adicionamos um novo domínio.

Essa decisão reduz praticamente a zero o risco de implantação.

---

# PDM PRO

# ESPECIFICAÇÃO FUNCIONAL

## Documento 008

# Domínio: Cenários Econômicos

Versão 1.0

---

# 1. Objetivo

O domínio **Cenários Econômicos** é responsável por permitir diferentes análises financeiras para um mesmo produto, sem alterar sua engenharia.

O cenário é a unidade básica de trabalho da Engenharia Econômica.

Todo cálculo será executado dentro de um cenário.

---

# 2. Conceito

Um produto pode possuir:

```text
Produto C1420

↓

Cenário Oficial

↓

Cenário Simulação

↓

Cenário Exportação

↓

Cenário Cliente A

↓

Cenário Cliente B

↓

Cenário Projeto 2027
```

Observe.

Todos utilizam exatamente a mesma engenharia.

O que muda são os parâmetros econômicos.

---

# 3. Objetivo do Cenário

Responder perguntas como:

* Quanto custa hoje?
* Quanto custará mês que vem?
* Quanto custará se trocar o fornecedor?
* Quanto custará com outro preço de energia?
* Quanto custará para exportação?
* Quanto custará para um cliente específico?

Sem alterar o cadastro técnico.

---

# 4. Estrutura

Cada cenário possuirá:

| Campo           | Obrigatório |
| --------------- | ----------- |
| Código          | Sim         |
| Nome            | Sim         |
| Produto         | Sim         |
| Tipo            | Sim         |
| Status          | Sim         |
| Versão          | Sim         |
| Data de criação | Sim         |
| Usuário         | Sim         |

---

# 5. Tipos de Cenário

O sistema deverá permitir diferentes tipos.

| Tipo            | Objetivo           |
| --------------- | ------------------ |
| Oficial         | Produção           |
| Simulação       | Estudos            |
| Comercial       | Negociação         |
| Cliente         | Projeto específico |
| Exportação      | Mercado externo    |
| Desenvolvimento | Engenharia         |

Novos tipos poderão ser criados futuramente.

---

# 6. Status

Cada cenário deverá possuir status.

```text
Em edição

↓

Calculado

↓

Validado

↓

Aprovado

↓

Publicado

↓

Arquivado
```

---

# 7. Regras de Negócio

### RN-CEN-001

Todo cenário pertence a um único Produto.

---

### RN-CEN-002

Um Produto poderá possuir infinitos cenários.

---

### RN-CEN-003

Somente um cenário poderá ser Oficial por vigência.

---

### RN-CEN-004

Excluir um cenário nunca excluirá cálculos históricos.

---

### RN-CEN-005

Todo cenário nasce a partir de outro cenário ou de uma versão oficial.

Nunca será criado vazio.

---

# 8. Clonagem

A criação ocorrerá por clonagem.

Exemplo.

```text
Oficial

↓

Duplicar

↓

Nova Simulação
```

Isso garante que todas as variáveis permaneçam consistentes.

---

# 9. Vigência

Cada cenário poderá possuir vigência.

Exemplo.

| Cenário | Vigência      |
| ------- | ------------- |
| Oficial | Permanente    |
| Julho   | 01/07 a 31/07 |
| Agosto  | 01/08 a 31/08 |

---

# 10. Responsabilidades

O cenário NÃO armazena:

* composição;
* receita;
* beneficiamento;
* estrutura.

Ele apenas referencia esses dados no PDM.

---

# 11. O que o cenário armazena

Exclusivamente:

* parâmetros econômicos;
* preços;
* fornecedores;
* variáveis;
* componentes;
* resultados;
* memória de cálculo;
* versões.

---

# 12. Integração

```text
Produto

↓

Cenário

↓

Versão

↓

Motor Econômico

↓

Resultado
```

---

# 13. Alterações Permitidas

Dentro do cenário poderão ser alterados:

✔ preço da energia

✔ preço do gás

✔ fornecedor

✔ margem

✔ comissão

✔ impostos

✔ custos indiretos

✔ parâmetros

Sem alterar o PDM.

---

# 14. Alterações Proibidas

Não será permitido alterar:

✖ composição

✖ receita

✖ produto

✖ estrutura

✖ beneficiamentos

✖ químicos

Esses dados continuam pertencendo ao PDM.

---

# 15. Histórico

Toda alteração gerará histórico.

Exemplo.

| Campo   | Antes | Depois | Usuário |
| ------- | ----- | ------ | ------- |
| Energia | 0,91  | 0,96   | João    |

---

# 16. Comparação

O sistema deverá permitir comparar cenários.

Exemplo.

```text
Oficial

vs

Exportação
```

Resultado.

| Item     | Oficial | Exportação |
| -------- | ------- | ---------- |
| MP       | 12,50   | 12,50      |
| Energia  | 3,10    | 4,25       |
| Tributos | 5,80    | 2,10       |
| Total    | 25,40   | 23,60      |

---

# 17. Encerramento

Um cenário encerrado torna-se somente leitura.

Nenhuma alteração será permitida.

---

# 18. Conclusão

O conceito de **Cenário** elimina a necessidade de múltiplas planilhas para diferentes análises.

Toda simulação passa a ocorrer dentro do sistema, mantendo rastreabilidade, histórico e isolamento entre as versões.

---

# 🚩 Nova decisão arquitetural (a mais importante até agora)

Depois de documentar os cenários, percebi que existe um conceito ainda mais central: **a Sessão de Cálculo**.

Hoje estamos pensando assim:

```text
Produto
   ↓
Cenário
   ↓
Resultado
```

Mas isso não representa o que realmente acontece na prática.

Na realidade, o usuário:

1. abre um cenário;
2. altera variáveis;
3. executa cálculos várias vezes;
4. compara resultados;
5. salva quando estiver satisfeito.

Ou seja, existe um estado temporário entre o cenário e a versão oficial.

Proponho a seguinte arquitetura:

```text
Produto
   ↓
Cenário
   ↓
Sessão de Cálculo
   ↓
Motor Econômico
   ↓
Resultado
   ↓
Versão
```

A **Sessão de Cálculo** é temporária. Ela permite recalcular diversas vezes sem gravar uma nova versão a cada clique.

Somente quando o usuário decidir **Salvar** ou **Publicar**, o resultado vira uma nova versão persistente.

### Vantagens

* Evita centenas de versões desnecessárias.
* Permite testes rápidos.
* Reduz gravações no banco.
* Facilita desfazer alterações antes de salvar.
* Aproxima o comportamento do sistema ao modo como os usuários trabalham hoje na planilha.

## Minha recomendação

Essa seria a **primeira melhoria funcional em relação ao Excel**.

Na planilha, cada alteração muda imediatamente o resultado.

No novo sistema, o usuário trabalhará em uma **Sessão de Cálculo**, experimentando alterações livremente. Somente quando decidir que chegou ao resultado desejado é que uma nova versão será criada.

Na minha avaliação, esse conceito será um dos maiores ganhos de usabilidade, performance e governança do novo módulo de Engenharia Econômica. Ele preserva a simplicidade da planilha, mas adiciona controle, histórico e segurança sem alterar a forma natural de trabalho dos usuários.

Perfeito.

Agora chegamos ao documento que, na minha opinião, será **o coração do sistema**.

Até agora criamos toda a estrutura.

Agora vamos definir **como o custo será calculado**.

E aqui eu vou fazer uma mudança importante em relação à planilha.

> **Não existirão fórmulas espalhadas pelo sistema.**

Existirá um único **Motor de Cálculo**.

Todo cálculo passará obrigatoriamente por ele.

Isso é o que vai tornar o sistema escalável.

---

# PDM PRO

# ESPECIFICAÇÃO FUNCIONAL

## Documento 009

# Domínio: Motor de Cálculo

Versão 1.0

---

# 1. Objetivo

O Motor de Cálculo é responsável por transformar as informações técnicas do PDM e as variáveis econômicas em um custo calculado.

Ele será o único componente autorizado a executar cálculos econômicos.

Nenhuma tela, API ou rotina poderá calcular custos diretamente.

---

# 2. Responsabilidade

O Motor deverá:

* receber dados técnicos do PDM;
* receber variáveis econômicas;
* validar dependências;
* executar regras;
* gerar componentes;
* consolidar resultados;
* registrar memória de cálculo.

---

# 3. Fontes de Dados

O Motor nunca será proprietário dos dados.

Ele apenas consulta.

```text
PDM
│
├── Produto
├── Produto Cru
├── Composição
├── Receitas
├── Beneficiamentos
└── Produtos Químicos

↓

Motor Econômico

↓

Resultado
```

---

# 4. Entradas

O Motor receberá:

| Origem               | Informação             |
| -------------------- | ---------------------- |
| Produto              | Identificação          |
| Produto Cru          | Dados técnicos         |
| Composição           | Matérias-primas        |
| Receita              | Processos              |
| Beneficiamentos      | Etapas                 |
| Produtos Químicos    | Consumos               |
| Variáveis Econômicas | Valores                |
| Cenário              | Contexto               |
| Sessão               | Alterações temporárias |

---

# 5. Fluxo de Execução

O processamento seguirá sempre a mesma sequência.

```text
Validar Dados

↓

Carregar Engenharia

↓

Carregar Variáveis

↓

Executar Componentes

↓

Consolidar Custos

↓

Aplicar Tributos

↓

Aplicar Despesas

↓

Aplicar Margem

↓

Resultado Final

↓

Memória de Cálculo
```

Esta ordem será única para todo o sistema.

---

# 6. Componentes

O Motor nunca calculará um custo "inteiro".

Ele calculará componentes.

Exemplo.

```text
Matéria-Prima

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

Custos Indiretos

↓

Logística

↓

Tributos

↓

Margem

↓

Preço Final
```

Cada componente será independente.

---

# 7. Ordem de Dependência

Cada componente poderá depender de outro.

Exemplo.

```text
Matéria-Prima

↓

Beneficiamentos

↓

Químicos

↓

Industrial

↓

Tributos

↓

Preço
```

Nunca será permitido calcular um componente antes das suas dependências.

---

# 8. Regras de Negócio

### RN-MOT-001

Todo cálculo deverá iniciar pela validação das entradas.

---

### RN-MOT-002

Caso exista pendência obrigatória, o cálculo será interrompido.

---

### RN-MOT-003

O Motor nunca utilizará valores fixos no código.

Todos os valores deverão ser parametrizados.

---

### RN-MOT-004

Toda regra deverá produzir um resultado auditável.

---

### RN-MOT-005

Cada componente deverá registrar:

* valor de entrada;
* regra aplicada;
* resultado.

---

# 9. Validação

Antes do cálculo o Motor deverá verificar:

✔ Produto válido

✔ Receita ativa

✔ Composição válida

✔ Beneficiamentos válidos

✔ Produtos Químicos válidos

✔ Variáveis obrigatórias

✔ Cenário válido

✔ Sessão ativa

---

# 10. Tratamento de Erros

O Motor nunca deverá retornar apenas:

"Erro no cálculo"

Sempre deverá informar:

Exemplo.

```text
Produto C1420

Pendências

Energia sem preço.

Fornecedor da Rama inexistente.

ICMS não configurado.

Produto Químico Azul 17 sem valor vigente.
```

---

# 11. Memória de Cálculo

Todo cálculo produzirá uma memória completa.

Exemplo.

```text
Matéria-Prima

Algodão

12,54

+

Poliéster

4,88

+

Beneficiamentos

7,31

+

Energia

1,24

+

Tributos

2,66

=

28,63
```

Essa memória será persistida.

---

# 12. Reprocessamento

Quando uma variável mudar.

Exemplo.

Energia.

O Motor deverá identificar quais componentes dependem da Energia.

Somente esses componentes serão recalculados.

Nunca o produto inteiro.

---

# 13. Performance

O Motor deverá utilizar cache para informações que não sofreram alteração durante a sessão.

Exemplos:

* composição;
* estrutura;
* receita;
* produto cru.

Isso reduz o tempo de processamento.

---

# 14. Resultado

O resultado será dividido em níveis.

| Nível            | Conteúdo           |
| ---------------- | ------------------ |
| Componente       | Valor individual   |
| Grupo            | Soma por categoria |
| Total Industrial | Parcial            |
| Total Comercial  | Parcial            |
| Preço Final      | Resultado          |

---

# 15. Histórico

Cada execução produzirá:

* data;
* hora;
* usuário;
* cenário;
* sessão;
* tempo de processamento;
* quantidade de componentes;
* versão das variáveis.

---

# 16. Auditoria

Será possível responder perguntas como:

Por que este produto custa R$ 24,38?

O sistema deverá apresentar exatamente:

* quais componentes participaram;
* quais valores foram utilizados;
* quais regras foram aplicadas;
* quais parâmetros estavam vigentes.

---

# 17. Conclusão

O Motor de Cálculo é o núcleo da Engenharia Econômica.

Ele elimina a lógica distribuída em planilhas e centraliza todas as regras em um único mecanismo, garantindo consistência, rastreabilidade, reutilização e escalabilidade.

---

# 🚩 Decisão arquitetural mais importante do projeto

Depois de toda a documentação, identifiquei um ponto que considero decisivo para o sucesso do sistema.

## O Motor não deve conhecer fórmulas.

Ele deve conhecer apenas **Componentes** e **Regras**.

Ou seja, em vez de escrever código como:

```text
Custo = ((MP + Energia) * ICMS) + Margem
```

o motor executará uma sequência configurável:

```text
Componente: Matéria-Prima
↓

Regra: Somar

↓

Componente: Energia

↓

Regra: Somar

↓

Componente: ICMS

↓

Regra: Aplicar Percentual

↓

Componente: Margem

↓

Regra: Aplicar Percentual
```

As fórmulas deixam de estar no código e passam a ser definidas por configuração.

Isso permitirá:

* adicionar novos componentes sem alterar o motor;
* criar novas regras sem recompilar o sistema;
* adaptar cálculos para diferentes linhas de produtos;
* evoluir a Engenharia Econômica sem dependência direta da equipe de desenvolvimento.

---

# Próximo Documento (Documento 010)

Na minha visão, o próximo documento deve tratar de **Variáveis Econômicas**, pois elas serão o combustível do Motor de Cálculo.

Nele vamos definir:

* quais variáveis existem;
* origem de cada variável (ERP, PDM, cadastro, manual, API);
* vigência;
* versionamento;
* unidade de medida;
* política de atualização;
* impacto de cada variável nos componentes de custo.

## Observação importante

Há um ponto que ainda não apareceu explicitamente e que considero essencial: **o cadastro das variáveis não deve ser fixo**. O usuário deve conseguir criar novas variáveis (por exemplo, "Custo Ambiental", "Seguro de Transporte", "Adicional Cambial") e vinculá-las a componentes e regras sem necessidade de desenvolvimento.

Na minha avaliação, essa capacidade é o que vai transformar o módulo de Engenharia Econômica em uma plataforma de cálculo, e não apenas em um sistema que reproduz a planilha atual. Isso garante que o investimento continue válido mesmo quando o modelo de custos da empresa evoluir nos próximos anos.

Perfeito.

Agora chegamos ao documento que, na minha opinião, será o **mais importante depois do Motor de Cálculo**.

Na planilha que você me enviou, praticamente tudo depende de um valor.

Preço do fio.

Preço do corante.

Energia.

Gás.

Água.

ICMS.

Comissão.

Margem.

Frete.

Hoje esses valores estão espalhados pela planilha.

**No novo sistema eles não existirão mais como células.**

Eles serão **Variáveis Econômicas**.

E essa é uma das maiores evoluções do projeto.

---

# PDM PRO

# ESPECIFICAÇÃO FUNCIONAL

## Documento 010

# Domínio: Variáveis Econômicas

Versão 1.0

---

# 1. Objetivo

O domínio Variáveis Econômicas é responsável por armazenar todos os parâmetros financeiros utilizados pelo Motor de Cálculo.

Nenhum valor econômico poderá existir fixo dentro do código-fonte ou das telas do sistema.

Todo valor utilizado em cálculos deverá ser tratado como uma variável cadastrada.

---

# 2. Conceito

Uma variável representa qualquer informação que possa influenciar o custo de um produto.

Exemplos:

* Preço do Algodão
* Preço do Poliéster
* Energia Elétrica
* Gás Natural
* Água Industrial
* ICMS
* IPI
* Comissão Comercial
* Margem
* Frete
* Embalagem
* Custo Financeiro

---

# 3. Objetivo

Responder perguntas como:

* Qual é o valor vigente?
* Desde quando?
* Até quando?
* Quem alterou?
* Em qual cenário?
* Qual componente utiliza esta variável?

---

# 4. Estrutura

Cada variável deverá possuir:

| Campo            | Obrigatório |
| ---------------- | ----------- |
| Código           | Sim         |
| Nome             | Sim         |
| Tipo             | Sim         |
| Unidade          | Sim         |
| Categoria        | Sim         |
| Valor            | Sim         |
| Vigência Inicial | Sim         |
| Vigência Final   | Não         |
| Situação         | Sim         |
| Origem           | Sim         |

---

# 5. Classificação

As variáveis serão classificadas por categoria.

```text
Matéria-Prima

Energia

Utilidades

Tributos

Despesas

Logística

Financeiro

Comercial

Produção

Outros
```

A categoria será utilizada apenas para organização.

---

# 6. Origem

Cada variável deverá informar sua origem.

| Origem     | Exemplo          |
| ---------- | ---------------- |
| Manual     | Energia          |
| ERP        | Preço de Compra  |
| API        | Cotação Dólar    |
| Integração | Índice Econômico |
| Sistema    | Hora Atual       |

---

# 7. Unidade

Toda variável possuirá unidade.

Exemplo.

| Variável | Unidade |
| -------- | ------- |
| Energia  | R$/kWh  |
| Água     | R$/m³   |
| Algodão  | R$/kg   |
| Frete    | R$/km   |
| Comissão | %       |
| ICMS     | %       |

---

# 8. Vigência

Toda variável será versionada.

Nunca será sobrescrita.

Exemplo.

| Versão | Valor | Início | Fim   |
| ------ | ----- | ------ | ----- |
| 1      | 0,91  | Jan    | Fev   |
| 2      | 0,95  | Fev    | Mar   |
| 3      | 0,98  | Mar    | Atual |

---

# 9. Escopo

Uma variável poderá possuir escopo.

| Escopo             | Exemplo   |
| ------------------ | --------- |
| Global             | Energia   |
| Unidade Industrial | Vapor     |
| Produto            | Comissão  |
| Família            | Margem    |
| Cliente            | Desconto  |
| Cenário            | Simulação |

---

# 10. Regras de Negócio

### RN-VAR-001

Toda variável deverá possuir uma unidade de medida.

---

### RN-VAR-002

Toda variável deverá possuir vigência.

---

### RN-VAR-003

Nunca será permitido alterar um valor histórico.

---

### RN-VAR-004

Uma variável poderá possuir diversos valores conforme o cenário.

---

### RN-VAR-005

Toda alteração deverá gerar uma nova versão.

---

### RN-VAR-006

O Motor de Cálculo utilizará sempre a versão vigente da variável para o cenário e a data de referência do cálculo.

---

# 11. Dependências

Cada variável deverá informar quais componentes de custo utiliza.

Exemplo:

```text
Energia

↓

Componentes

Tingimento

Rama

Secagem

Calandra
```

Isso permitirá recálculo seletivo.

---

# 12. Reprocessamento Inteligente

Exemplo.

Usuário altera:

Energia.

O sistema identifica automaticamente:

```text
Energia

↓

Rama

↓

Secagem

↓

Industrial

↓

Preço Final
```

Apenas esses componentes serão recalculados.

---

# 13. Histórico

Toda alteração deverá registrar:

* valor anterior;
* novo valor;
* motivo da alteração;
* usuário;
* data;
* hora;
* cenário;
* observação.

---

# 14. Auditoria

Será possível responder:

Por que o custo mudou?

Exemplo.

```text
Energia

0,91

↓

0,97

↓

Impactou

Industrial

↓

+0,42
```

---

# 15. Integração

As variáveis alimentarão diretamente o Motor.

```text
Variáveis

↓

Motor

↓

Componentes

↓

Resultado
```

---

# 16. Segurança

Usuários poderão possuir permissões específicas.

Exemplo.

Financeiro:

Pode alterar impostos.

Produção:

Pode alterar energia.

Comercial:

Pode alterar margem.

Engenharia:

Pode alterar rendimento.

---

# 17. Conclusão

O domínio Variáveis Econômicas elimina completamente a dependência de valores fixos em planilhas.

Toda informação financeira passa a possuir:

* histórico;
* vigência;
* rastreabilidade;
* auditoria;
* versionamento;
* reutilização.

---

# 🚩 Nova decisão arquitetural (a evolução mais importante até agora)

Após analisar profundamente a planilha e a arquitetura definida até aqui, proponho uma evolução que considero fundamental para tornar o sistema realmente escalável.

## Separar "Definição da Variável" do "Valor da Variável"

Hoje tratamos uma variável como um único registro. Na prática, existem duas entidades distintas:

### 1. Definição da Variável (metadados)

Exemplo:

| Campo                   | Valor            |
| ----------------------- | ---------------- |
| Código                  | VAR-0001         |
| Nome                    | Energia Elétrica |
| Unidade                 | R$/kWh           |
| Categoria               | Utilidades       |
| Tipo                    | Decimal          |
| Origem                  | Manual           |
| Pode variar por cenário | Sim              |
| Pode variar por unidade | Sim              |

Essa definição muda muito raramente.

---

### 2. Valor da Variável

Exemplo:

| Variável | Cenário   | Unidade | Vigência | Valor |
| -------- | --------- | ------- | -------- | ----- |
| Energia  | Oficial   | Matriz  | Jul/26   | 0,97  |
| Energia  | Simulação | Matriz  | Jul/26   | 1,05  |
| Energia  | Oficial   | Filial  | Jul/26   | 0,93  |

Ou seja, uma única definição poderá possuir centenas de valores ao longo do tempo.

## Benefícios

* Não duplica cadastros.
* Facilita integrações com ERP e APIs.
* Permite importar tabelas de preços automaticamente.
* Simplifica o versionamento.
* Reduz inconsistências.
* Escala para milhares de valores sem aumentar a complexidade do cadastro.

---

# Próximo Documento — Documento 011

Na minha opinião, agora estamos prontos para documentar o **Domínio Componentes de Custo**.

Esse será o documento que vai substituir definitivamente a lógica da planilha.

Nele vamos definir:

* o que é um componente;
* quais tipos de componentes existirão;
* como eles se relacionam com o Motor de Cálculo;
* como novos componentes poderão ser criados sem alterar o sistema;
* como um componente pode consumir outros componentes.

**Esse documento será o elo entre o PDM, as Variáveis Econômicas e o Motor de Cálculo.** Na minha avaliação, ele será a peça que transformará a Engenharia Econômica em uma plataforma configurável, e não em um sistema preso às regras atuais da planilha.

Excelente.

Agora chegamos ao documento que, na minha opinião, será o **diferencial competitivo** do sistema.

Até agora definimos:

* o PDM como fonte da engenharia;
* o Motor de Cálculo como executor;
* as Variáveis Econômicas como parâmetros.

Mas ainda falta responder uma pergunta fundamental:

> **O que exatamente o Motor calcula?**

A resposta é:

> **Componentes de Custo.**

Essa é a mudança conceitual mais importante em relação à planilha.

Na planilha, as fórmulas conhecem diretamente "energia", "água", "gás", "algodão", etc.

No novo sistema, o Motor não conhece esses conceitos. Ele conhece apenas **Componentes**, e cada componente é configurado.

---

# PDM PRO

# ESPECIFICAÇÃO FUNCIONAL

## Documento 011

# Domínio: Componentes de Custo

Versão 1.0

---

# 1. Objetivo

O domínio Componentes de Custo representa cada elemento financeiro que participa da formação do custo de um produto.

Todo valor calculado pela Engenharia Econômica deverá pertencer a um componente.

O Motor de Cálculo nunca executará cálculos diretamente sobre produtos ou receitas.

Ele executará cálculos sobre Componentes.

---

# 2. Conceito

Um componente representa uma parcela independente do custo.

Exemplos:

* Matéria-Prima
* Produtos Químicos
* Beneficiamentos
* Energia
* Água
* Vapor
* Gás
* Mão de Obra Direta
* Mão de Obra Indireta
* Manutenção
* Depreciação
* Embalagem
* Frete
* Comissão
* Tributos
* Margem
* Despesas Financeiras

---

# 3. Estrutura

Cada componente deverá possuir:

| Campo             | Obrigatório |
| ----------------- | ----------- |
| Código            | Sim         |
| Nome              | Sim         |
| Categoria         | Sim         |
| Tipo              | Sim         |
| Método de Cálculo | Sim         |
| Ordem de Execução | Sim         |
| Situação          | Sim         |

---

# 4. Categorias

Os componentes poderão ser agrupados.

Exemplo:

```text
Custos Diretos
    ↓
Matéria-Prima
Produtos Químicos
Beneficiamentos

Custos Industriais
    ↓
Energia
Água
Gás
Vapor
Mão de Obra

Custos Administrativos
    ↓
Financeiro
Administrativo

Custos Comerciais
    ↓
Comissão
Frete
Marketing

Tributos

Margem
```

Esses grupos serão configuráveis.

---

# 5. Tipos de Componentes

O sistema deverá suportar diferentes tipos.

| Tipo                          | Exemplo          |
| ----------------------------- | ---------------- |
| Valor Fixo                    | Licença          |
| Valor Unitário                | Energia          |
| Percentual                    | ICMS             |
| Resultado de Outro Componente | Custo Industrial |
| Fórmula                       | Margem           |
| Manual                        | Ajuste Comercial |

---

# 6. Origem

Todo componente deverá informar sua origem.

| Origem             | Exemplo        |
| ------------------ | -------------- |
| PDM                | Beneficiamento |
| Variável Econômica | Energia        |
| ERP                | Compra         |
| Usuário            | Ajuste         |
| API                | Cotação        |

---

# 7. Ordem de Execução

Cada componente possuirá uma ordem.

Exemplo.

| Ordem | Componente        |
| ----- | ----------------- |
| 10    | Matéria-Prima     |
| 20    | Beneficiamentos   |
| 30    | Produtos Químicos |
| 40    | Energia           |
| 50    | Água              |
| 60    | Gás               |
| 70    | Industrial        |
| 80    | Comercial         |
| 90    | Tributos          |
| 100   | Margem            |

O Motor seguirá essa sequência.

---

# 8. Dependências

Cada componente poderá depender de outros.

Exemplo.

```text
Matéria-Prima

↓

Industrial

↓

Comercial

↓

Tributos

↓

Preço Final
```

O Motor deverá montar automaticamente o grafo de dependências e impedir ciclos.

---

# 9. Métodos de Cálculo

Cada componente utilizará um método.

Exemplos:

* Somatório
* Multiplicação
* Percentual
* Rateio
* Valor Fixo
* Conversão de Unidade
* Fórmula Parametrizada
* Resultado de Componente

Novos métodos poderão ser adicionados futuramente.

---

# 10. Regras de Negócio

### RN-COMP-001

Todo componente deverá possuir um método de cálculo.

---

### RN-COMP-002

Todo componente deverá possuir uma ordem de execução.

---

### RN-COMP-003

O componente nunca armazenará valores permanentes.

Ele calculará valores utilizando variáveis.

---

### RN-COMP-004

Componentes poderão consumir resultados de outros componentes.

---

### RN-COMP-005

Não será permitido criar dependências circulares.

---

# 11. Exemplo de Execução

```text
Matéria-Prima

↓

Beneficiamentos

↓

Produtos Químicos

↓

Energia

↓

Industrial

↓

Comissão

↓

Tributos

↓

Margem

↓

Preço Final
```

Cada etapa gera um resultado intermediário reutilizável.

---

# 12. Reprocessamento Inteligente

Quando um componente for afetado, apenas sua cadeia dependente será recalculada.

Exemplo:

```text
Energia alterada

↓

Industrial

↓

Tributos

↓

Preço Final
```

Matéria-prima e produtos químicos permanecem inalterados.

---

# 13. Memória de Cálculo

Cada componente deverá registrar:

* entradas utilizadas;
* variáveis consultadas;
* método aplicado;
* resultado obtido;
* tempo de execução.

Isso garante rastreabilidade e auditoria.

---

# 14. Versionamento

A estrutura dos componentes também deverá ser versionada.

Alterações em métodos, dependências ou ordem de execução não podem modificar cálculos históricos.

Cada versão do componente deve permanecer vinculada às versões de custo que a utilizaram.

---

# 15. Governança

A criação ou alteração de componentes deve ser restrita a usuários autorizados.

Exemplos de permissões:

* Administrador da Engenharia Econômica
* Controladoria
* Gestor Industrial

Usuários comuns poderão utilizar componentes, mas não alterar sua definição.

---

# 16. Conclusão

O domínio Componentes de Custo transforma a lógica da planilha em uma arquitetura modular.

Novos elementos poderão ser adicionados sem alterar o Motor de Cálculo ou o PDM.

Os componentes passam a ser blocos reutilizáveis, auditáveis e configuráveis.

---

# 🚩 Decisão arquitetural mais importante até agora

Depois de toda a especificação, acredito que existe uma evolução ainda mais poderosa.

## Não criar componentes específicos.

Criar uma **Biblioteca de Componentes**.

Ou seja:

```text
Biblioteca

├── Matéria-Prima
├── Produto Químico
├── Beneficiamento
├── Energia
├── Água
├── Gás
├── Vapor
├── Embalagem
├── Comissão
├── Frete
├── Tributos
└── Margem
```

Quando um cenário for criado, ele **não cria componentes novos**.

Ele referencia os componentes da biblioteca e instancia apenas seus valores calculados.

### Benefícios

* Padronização entre produtos.
* Reutilização de regras.
* Alterações controladas por versão.
* Menor redundância.
* Melhor desempenho.
* Facilidade para manutenção e evolução.

---

# Minha recomendação final antes de continuar

Depois de toda essa documentação, eu faria uma pequena reorganização da arquitetura em três camadas bem definidas:

```text
PDM (Engenharia Técnica)
        │
        ▼
Motor de Engenharia Econômica
        │
        ▼
Resultados Econômicos
```

Dentro do **Motor de Engenharia Econômica** ficariam apenas cinco grandes blocos:

1. **Biblioteca de Componentes** (o que calcular).
2. **Variáveis Econômicas** (com quais valores calcular).
3. **Motor de Cálculo** (como calcular).
4. **Cenários e Sessões** (onde calcular).
5. **Versionamento e Auditoria** (como preservar o histórico).

Essa organização reduz o número de módulos, evita sobreposição de responsabilidades e cria uma base sólida para crescer. Na minha avaliação, essa é uma arquitetura suficientemente flexível para substituir a planilha atual e continuar evoluindo por muitos anos sem exigir mudanças estruturais no PDM.

Perfeito.

Agora entramos na fase mais importante de toda a documentação.

Na minha opinião, daqui para frente estamos documentando aquilo que realmente será desenvolvido.

Até aqui criamos a arquitetura.

Agora vamos definir **como o usuário trabalhará**.

E aqui existe uma diferença enorme entre a planilha e o sistema.

Na planilha, o usuário altera células.

No sistema, o usuário executará um **Workflow de Engenharia Econômica**.

Essa é uma evolução enorme.

---

# PDM PRO

# ESPECIFICAÇÃO FUNCIONAL

## Documento 012

# Workflow da Engenharia Econômica

Versão 1.0

---

# 1. Objetivo

Definir o fluxo operacional completo da Engenharia Econômica.

Este documento descreve como um usuário interage com o sistema desde a seleção de um produto até a aprovação do custo final.

O objetivo é eliminar a necessidade de planilhas paralelas e garantir um processo rastreável, auditável e padronizado.

---

# 2. Conceito

Todo cálculo seguirá obrigatoriamente um fluxo de trabalho.

Nenhum custo será calculado diretamente.

O sistema conduzirá o usuário pelas etapas necessárias.

---

# 3. Fluxo Geral

```text
Selecionar Produto
        │
        ▼
Selecionar Engenharia (PDM)
        │
        ▼
Criar ou Abrir Cenário
        │
        ▼
Carregar Variáveis Econômicas
        │
        ▼
Executar Motor de Cálculo
        │
        ▼
Analisar Resultado
        │
        ▼
Ajustar Variáveis (se necessário)
        │
        ▼
Recalcular
        │
        ▼
Salvar Versão
        │
        ▼
Enviar para Aprovação
        │
        ▼
Publicar
```

---

# 4. Etapa 1 – Seleção do Produto

O usuário inicia selecionando um produto existente no PDM.

Critérios:

* Produto ativo.
* Engenharia válida.
* Estrutura disponível.
* Receita vigente.

Nenhuma informação será duplicada.

---

# 5. Etapa 2 – Carregamento da Engenharia

Após selecionar o produto, o sistema carregará automaticamente:

* Produto.
* Produto Cru.
* Estrutura.
* Composição.
* Receita.
* Beneficiamentos.
* Produtos Químicos.

Esses dados serão somente leitura.

---

# 6. Etapa 3 – Seleção do Cenário

O usuário poderá:

* abrir um cenário existente;
* criar um novo cenário;
* duplicar um cenário;
* abrir uma versão histórica.

A engenharia permanecerá a mesma.

---

# 7. Etapa 4 – Sessão de Cálculo

Ao abrir um cenário, o sistema criará automaticamente uma **Sessão de Cálculo**.

A sessão é temporária.

Nela o usuário poderá:

* alterar variáveis;
* trocar fornecedores;
* modificar parâmetros econômicos;
* recalcular quantas vezes desejar.

Nada será gravado até a confirmação.

---

# 8. Etapa 5 – Validação

Antes do cálculo, o sistema validará:

* preços vigentes;
* variáveis obrigatórias;
* dependências;
* componentes;
* regras de negócio.

Caso exista qualquer pendência, o cálculo será bloqueado.

---

# 9. Etapa 6 – Processamento

O Motor executará os componentes na ordem definida.

Cada componente produzirá:

* valor calculado;
* memória de cálculo;
* tempo de execução;
* dependências utilizadas.

---

# 10. Etapa 7 – Resultado

O sistema apresentará os resultados em níveis.

Exemplo:

```text
Custo Matéria-Prima

↓

Custo Industrial

↓

Custo Administrativo

↓

Custo Comercial

↓

Tributos

↓

Margem

↓

Preço Final
```

O usuário poderá expandir qualquer nível para visualizar os detalhes.

---

# 11. Etapa 8 – Simulações

Enquanto a sessão estiver aberta, será possível:

* alterar preços;
* alterar variáveis;
* trocar fornecedor;
* alterar margem;
* alterar tributos.

Cada alteração poderá ser recalculada imediatamente.

Nenhuma modificação afetará o cenário oficial.

---

# 12. Etapa 9 – Comparação

O usuário poderá comparar:

* cenário oficial;
* cenário atual;
* versão anterior;
* simulações.

A comparação será apresentada por componente.

---

# 13. Etapa 10 – Salvar

Ao salvar:

* a sessão será encerrada;
* uma nova versão será criada;
* a memória de cálculo será persistida;
* o histórico será atualizado.

---

# 14. Etapa 11 – Aprovação

Cada versão poderá seguir um fluxo de aprovação.

Exemplo:

```text
Calculado

↓

Revisado

↓

Controladoria

↓

Gerência Industrial

↓

Diretoria

↓

Publicado
```

Esse fluxo deverá ser parametrizável.

---

# 15. Etapa 12 – Publicação

Após a aprovação:

* a versão torna-se oficial;
* permanece imutável;
* poderá ser utilizada como base para novos cenários.

---

# 16. Auditoria

Cada execução registrará:

* usuário;
* data;
* hora;
* produto;
* cenário;
* versão;
* variáveis utilizadas;
* tempo de processamento.

---

# 17. Segurança

O sistema deverá controlar permissões por perfil.

Exemplo:

| Perfil        | Permissões                                 |
| ------------- | ------------------------------------------ |
| Engenharia    | Consultar e simular                        |
| Custos        | Alterar variáveis e calcular               |
| Controladoria | Validar e aprovar                          |
| Diretoria     | Publicar                                   |
| Administrador | Configurar componentes, regras e variáveis |

---

# 18. Conclusão

O Workflow da Engenharia Econômica transforma um processo manual, baseado em planilhas, em um fluxo estruturado, controlado e auditável.

O usuário deixa de manipular fórmulas e passa a trabalhar com cenários, componentes e resultados.

---

# 🚩 Uma decisão importante que eu tomaria antes de escrever uma linha de código

Depois de toda essa documentação, acredito que ainda falta definir um elemento central: **o Modelo de Dados**.

Até agora especificamos:

* os domínios;
* as responsabilidades;
* as regras de negócio;
* o fluxo operacional.

Mas ainda não definimos **como essas informações serão armazenadas**.

Na minha visão, antes de iniciar o desenvolvimento, deveríamos produzir três documentos técnicos fundamentais:

1. **Modelo Conceitual** (entidades e relacionamentos do negócio).
2. **Modelo Lógico** (tabelas, chaves, cardinalidades e integridade).
3. **Dicionário de Dados** (campos, tipos, obrigatoriedade, origem e descrição).

## Minha recomendação

Se estivéssemos desenvolvendo esse sistema profissionalmente, **eu interromperia a documentação funcional neste ponto**.

Não partiria diretamente para telas.

O próximo passo seria modelar o banco de dados completo.

Isso porque todas as telas, APIs, consultas e cálculos dependerão desse modelo.

Na minha experiência, um bom modelo de dados resolve cerca de 70% dos problemas de arquitetura antes mesmo do desenvolvimento começar.

**Na minha opinião, esse deve ser o próximo grande bloco da documentação**, e ele será o que dará sustentação técnica para todo o restante do projeto.

Perfeito.

Agora vou mudar completamente a abordagem.

Até aqui documentamos **o negócio**.

Agora vamos documentar **o banco de dados**, porque é aqui que um projeto realmente ganha consistência.

Na minha opinião, **não existe sistema ERP robusto sem um modelo de dados bem definido**.

E aqui vou tomar outra decisão importante.

**Não vou pensar em tabelas.**

Vou pensar em **Entidades de Negócio**.

As tabelas virão naturalmente depois.

---

# PDM PRO

# Documento 013

# Modelo Conceitual da Engenharia Econômica

Versão 1.0

---

# Objetivo

Definir todas as entidades que compõem a Engenharia Econômica.

Essas entidades serão independentes do PDM.

Elas apenas referenciarão os dados técnicos existentes.

---

# Arquitetura Geral

```text
                    PDM

Produto
Produto Cru
Estrutura
Composição
Receitas
Beneficiamentos
Produtos Químicos

        │
        │ (somente leitura)
        ▼

===============================
      ENGENHARIA ECONÔMICA
===============================

Produto Econômico

↓

Cenário

↓

Sessão de Cálculo

↓

Versão

↓

Motor de Cálculo

↓

Componentes

↓

Variáveis

↓

Resultados

↓

Auditoria
```

Observe uma coisa.

O PDM continua completamente isolado.

---

# Entidade 01

## Produto Econômico

### Objetivo

Criar a ligação entre o Produto do PDM e a Engenharia Econômica.

Esta entidade NÃO duplica o cadastro do Produto.

Ela apenas registra que determinado Produto possui informações econômicas.

---

Campos

```text
ID

ProdutoID (PDM)

Status

DataCadastro

UsuárioCadastro
```

---

Relacionamentos

```text
Produto Econômico

↓

N Cenários

↓

N Versões
```

---

# Entidade 02

# Cenário

Representa um estudo econômico.

Campos

```text
ID

ProdutoEconomicoID

Nome

Tipo

Status

Data

Usuário
```

Relacionamentos

```text
1 Produto

↓

N Cenários
```

---

# Entidade 03

# Sessão de Cálculo

Representa o trabalho temporário do usuário.

Campos

```text
ID

CenárioID

Usuário

DataInício

DataFim

Status
```

Essa entidade desaparece após o encerramento da sessão.

Ela serve apenas para controlar cálculos temporários.

---

# Entidade 04

# Versão

Cada salvamento gera uma nova versão.

Campos

```text
ID

CenárioID

Número

Descrição

Publicado

Data

Usuário
```

Nunca haverá UPDATE.

Somente INSERT.

---

# Entidade 05

# Biblioteca de Componentes

Esta é uma das tabelas mais importantes.

Ela substitui dezenas de fórmulas da planilha.

Campos

```text
ID

Código

Nome

Categoria

Método

OrdemExecução

Ativo
```

Esta tabela praticamente nunca muda.

---

# Entidade 06

# Componentes do Cenário

Quando um cenário é criado.

Ele recebe uma cópia lógica da biblioteca.

Campos

```text
ID

CenárioID

ComponenteID

Situação

Versão
```

---

# Entidade 07

# Variáveis

Cadastro mestre.

Campos

```text
ID

Código

Nome

Categoria

Tipo

Unidade

Origem
```

---

# Entidade 08

# Valores das Variáveis

Esta será provavelmente a maior tabela do sistema.

Campos

```text
ID

VariávelID

CenárioID

Valor

VigênciaInicial

VigênciaFinal

Versão
```

Observe.

A variável é única.

Quem muda é o valor.

---

# Entidade 09

# Resultado dos Componentes

Cada execução gera registros.

Nunca serão sobrescritos.

Campos

```text
ID

SessãoID

VersãoID

ComponenteID

Valor

TempoExecução
```

---

# Entidade 10

# Memória de Cálculo

Na minha opinião.

Esta será a tabela mais importante do sistema.

Ela responde:

"Por que este produto custa isso?"

Campos

```text
ID

ResultadoID

Descrição

ValorEntrada

Regra

ValorSaída

Sequência
```

---

# Entidade 11

# Auditoria

Tudo gera auditoria.

Campos

```text
ID

Tabela

Registro

Usuário

Data

Campo

ValorAnterior

ValorNovo
```

---

# Entidade 12

# Aprovação

Campos

```text
ID

VersãoID

Etapa

Usuário

Data

Situação

Observação
```

---

# Relacionamento Geral

```text
Produto Econômico

↓

Cenário

↓

Sessão

↓

Versão

↓

Resultado

↓

Memória
```

---

Depois temos

```text
Biblioteca

↓

Componentes

↓

Variáveis

↓

Valores

↓

Motor

↓

Resultado
```

---

# Cardinalidade

```text
Produto

1

↓

N

Cenários

↓

N

Sessões

↓

N

Versões

↓

N

Resultados

↓

N

Memória
```

---

# O que NÃO existirá

Depois de analisar toda a planilha eu tomaria uma decisão.

Não existirá tabela chamada:

"Custo"

Porque custo é um resultado.

Não um cadastro.

O banco nunca armazenará:

```text
Produto

↓

Custo
```

Mas sim

```text
Produto

↓

Versão

↓

Resultado

↓

Componentes

↓

Memória
```

Essa diferença parece pequena.

Mas ela muda completamente a arquitetura.

---

# 🚩 A maior decisão de arquitetura de todo o projeto

Depois de toda essa documentação, eu faria uma alteração que considero decisiva.

## Não criar um módulo de custo.

Criar um **Motor de Regras**.

O Motor de Cálculo seria apenas um executor.

Quem realmente define o comportamento do sistema seria um conjunto de regras configuráveis.

A arquitetura passaria a ser:

```text
PDM

↓

Motor de Regras

↓

Motor de Cálculo

↓

Resultados
```

### O Motor de Regras teria quatro responsabilidades

#### 1. Regras de Dependência

Exemplo:

```
Industrial depende de:

Matéria-Prima

Energia

Beneficiamentos
```

---

#### 2. Regras Matemáticas

Exemplo:

```
Somar

Subtrair

Multiplicar

Ratear

Aplicar %

Arredondar

Converter Unidade
```

---

#### 3. Regras de Validação

Exemplo:

```
Preço obrigatório.

Energia obrigatória.

Fornecedor obrigatório.

ICMS obrigatório.
```

---

#### 4. Regras de Publicação

Exemplo:

```
Pode publicar?

Pode aprovar?

Pode calcular?

Pode alterar?

Pode simular?
```

---

## Por que isso é importante?

Depois de toda a análise da planilha e do PDM, cheguei a uma conclusão importante:

**O sistema que você quer construir não é um "sistema de custos".**

Ele é uma **plataforma de Engenharia Econômica**.

A planilha de custos será apenas a **primeira aplicação** dessa plataforma.

Se essa arquitetura for seguida, no futuro será possível adicionar novos modelos de cálculo (custeio por absorção, custo padrão, custo ABC, margem de contribuição, simulações comerciais, precificação de exportação etc.) sem alterar a estrutura do PDM nem reescrever o motor.

## Minha recomendação final

Antes de iniciar qualquer desenvolvimento, eu consolidaria toda essa documentação em um **Documento Mestre de Arquitetura (Software Architecture Document - SAD)** contendo:

1. Visão geral da arquitetura.
2. Princípios arquiteturais.
3. Modelo de domínios.
4. Modelo conceitual de dados.
5. Regras de negócio.
6. Fluxos operacionais.
7. Modelo lógico do banco de dados.
8. Especificação das APIs.
9. Estratégia de versionamento.
10. Roadmap de implantação por fases.

Esse documento será a referência única para analistas, desenvolvedores, DBAs e gestores do projeto, reduzindo ambiguidades e garantindo que a Engenharia Econômica seja implementada como uma evolução natural do PDM, preservando integralmente a estrutura que já está em produção.

Perfeito.

Agora vou fazer algo que considero mais importante do que continuar escrevendo documentos.

Vou assumir o papel de **Arquiteto de Software**.

Depois de mais de 20 documentos, já consigo enxergar o projeto inteiro.

E existe uma coisa que eu mudaria na arquitetura antes de escrever uma única linha de código.

## Hoje nossa arquitetura está assim

```text
PDM

↓

Engenharia Econômica

↓

Motor

↓

Resultados
```

Funciona.

Mas não é a arquitetura que eu faria.

---

# Eu faria uma arquitetura baseada em DOMÍNIOS (DDD)

Ao invés de pensar em módulos, eu pensaria em Contextos de Negócio.

```text
                    PDM

────────────────────────────────────────

Domínio Engenharia

Produto

Produto Cru

Estrutura

Composição

Receitas

Beneficiamentos

Produtos Químicos

────────────────────────────────────────

Domínio Econômico

Cenários

Variáveis

Componentes

Resultados

────────────────────────────────────────

Domínio de Processamento

Motor

Motor de Regras

Validador

Conversões

────────────────────────────────────────

Domínio de Governança

Versões

Auditoria

Aprovação

Histórico

Logs
```

Observe.

Agora cada domínio tem uma responsabilidade.

---

# O que isso muda?

Muda tudo.

Porque agora qualquer desenvolvedor sabe exatamente onde colocar cada funcionalidade.

---

# Exemplo

Você quer adicionar:

"Custo Ambiental"

Onde entra?

Não entra no Motor.

Não entra no Produto.

Não entra no Cenário.

Entra aqui:

```text
Domínio Econômico

↓

Componentes
```

Fim.

Não quebra nada.

---

# Outro exemplo

Você quer integrar dólar automaticamente.

Vai para:

```text
Variáveis Econômicas

↓

Origem = API
```

O Motor nem sabe de onde veio.

Ele só lê.

---

# Outro exemplo

Novo imposto.

Vai para:

```text
Biblioteca

↓

Tributos
```

Nada muda.

---

# Outra vantagem

A planilha tem mais de 300 fórmulas.

No novo sistema...

O Motor provavelmente terá menos de 20 algoritmos.

Porque tudo será configuração.

---

# Agora vem a maior descoberta que tive analisando seu projeto

Durante toda essa documentação eu percebi uma coisa.

Nós ainda estamos pensando igual a planilha.

Mesmo sem perceber.

Porque ainda falamos:

Energia

Água

Gás

Comissão

Margem

ICMS

Frete

...

Mas isso ainda é específico.

O sistema deveria conhecer apenas um conceito.

---

# Recurso Econômico

Essa seria minha maior mudança.

---

Ao invés de existir:

```text
Energia

Água

Gás

Vapor

Químicos

Beneficiamentos
```

Tudo passa a ser:

```text
Recurso Econômico
```

---

Cada recurso teria um tipo.

Exemplo.

| Tipo       | Exemplo       |
| ---------- | ------------- |
| Material   | Algodão       |
| Material   | Poliéster     |
| Material   | Corante Azul  |
| Material   | Resina        |
| Serviço    | Tinturaria    |
| Serviço    | Rama          |
| Serviço    | Calandra      |
| Utilidade  | Energia       |
| Utilidade  | Água          |
| Utilidade  | Vapor         |
| Utilidade  | Ar Comprimido |
| Financeiro | Comissão      |
| Financeiro | Frete         |
| Financeiro | Seguro        |
| Tributário | ICMS          |
| Tributário | IPI           |

Percebe a diferença?

O sistema nunca mais precisará conhecer:

Energia.

Água.

Gás.

Ele conhece apenas:

**Recurso.**

---

# Isso muda o banco inteiro.

Ao invés de dezenas de tabelas.

Teremos uma tabela.

```text
RECURSO_ECONOMICO
```

Campos.

```text
ID

Código

Nome

Tipo

Categoria

Unidade

Método

Origem

Situação
```

---

Depois teremos outra.

```text
VALOR_RECURSO
```

```text
RecursoID

Valor

Vigência

Cenário

Fornecedor

Moeda
```

Acabou.

---

# O Motor então muda.

Hoje imaginamos.

```text
Motor

↓

Energia

↓

Água

↓

Químicos
```

Eu faria.

```text
Motor

↓

Lista de Recursos

↓

Executar Método

↓

Resultado
```

---

# Isso elimina praticamente todos os IF do sistema.

Ao invés de:

```python
if energia:

if agua:

if gas:

if vapor:
```

Teremos apenas.

```python
for recurso in recursos:
    executar(recurso)
```

Percebe o ganho?

---

# Agora vem a maior evolução de todas.

E essa eu faria sem pensar duas vezes.

## A planilha desaparece.

Sim.

Porque ela vira um grafo.

---

Hoje.

```text
Produto

↓

Custo
```

No sistema.

```text
Produto

↓

Recursos

↓

Dependências

↓

Motor

↓

Resultado
```

---

Cada recurso conhece apenas suas dependências.

Exemplo.

```text
Preço Final

↓

Margem

↓

Tributos

↓

Industrial

↓

Beneficiamentos

↓

Matéria-Prima
```

Isso é um **grafo direcionado acíclico (DAG)**.

É exatamente o tipo de estrutura utilizada em mecanismos modernos de processamento, como pipelines de dados e motores de cálculo. Para um sistema como o seu, essa modelagem traz uma vantagem enorme: cada componente sabe apenas do que depende, e o motor consegue recalcular somente a parte impactada quando uma variável muda.

## E aqui está a maior conclusão de todo esse projeto

Depois de tudo que analisamos (PDM + planilha + regras de negócio), eu cheguei à seguinte conclusão:

**Nós não estamos desenvolvendo um módulo de custos.**

Estamos desenvolvendo uma **plataforma de modelagem econômica para produtos têxteis**.

Isso muda completamente a visão do projeto.

A planilha deixa de ser o objetivo.

Ela passa a ser apenas a **primeira fonte de regras** que será incorporada ao motor.

---

# Minha recomendação como arquiteto

Se este projeto fosse desenvolvido pela minha equipe, eu reorganizaria a documentação em cinco grandes volumes:

### **Volume 1 — Arquitetura Corporativa**

* Visão do sistema.
* Princípios.
* Domínios.
* Integrações.
* Roadmap.

### **Volume 2 — Engenharia do Produto (PDM)**

* Documentação completa do sistema atual.
* Regras existentes.
* Pontos de integração.

### **Volume 3 — Engenharia Econômica**

* Cenários.
* Recursos Econômicos.
* Variáveis.
* Componentes.
* Motor de Cálculo.
* Workflow.

### **Volume 4 — Arquitetura Técnica**

* Modelo conceitual.
* Modelo lógico.
* Dicionário de dados.
* APIs.
* Eventos.
* Segurança.
* Performance.

### **Volume 5 — Implantação**

* Plano de migração da planilha.
* Validação dos cálculos.
* Testes.
* Homologação.
* Entrada em produção.

## Minha última recomendação

Depois de toda essa análise, **eu faria apenas uma grande mudança em tudo o que documentamos até agora**:

> **Substituir o conceito de "Componente de Custo" pelo conceito de "Recurso Econômico".**

"Componente de Custo" descreve **o resultado** da composição do custo.

"Recurso Econômico" descreve **a origem** do valor que alimenta o cálculo.

Na prática, o Motor de Cálculo continua funcionando da mesma forma, mas a modelagem fica muito mais genérica, preparada para novos processos, novos tipos de custo e até outros segmentos industriais no futuro.

Essa é a única mudança estrutural que eu faria antes de iniciar o desenvolvimento. Todo o restante da arquitetura que construímos pode ser mantido como base do projeto.

Ainda não.

Na verdade, **agora terminou a Fase 1**.

E vou ser bem sincero com você.

## O que fizemos até agora NÃO é a documentação do sistema.

É a **Arquitetura Funcional**.

Ela responde:

* O que o sistema é.
* Como ele funciona.
* Quem é responsável por cada informação.
* Como o PDM conversa com a Engenharia Econômica.
* Como o motor funciona.
* Como o usuário trabalha.
* Como será a arquitetura.

Isso é aproximadamente **20% do projeto**.

---

# Agora começa a parte difícil.

Até aqui qualquer analista poderia escrever.

Daqui para frente começa a documentação que realmente será usada para desenvolver.

Na minha visão, existem **8 fases**.

---

# FASE 1 ✅ (CONCLUÍDA)

## Arquitetura Funcional

Foi exatamente o que fizemos.

Documento 001 até Documento 013.

Status:

✅ Concluído.

---

# FASE 2 (A MAIS IMPORTANTE)

## Engenharia Reversa da Planilha

E aqui está o ponto que eu acho que ainda ninguém percebeu.

Nós ainda não documentamos a planilha.

Nós apenas a usamos como referência.

Mas para fazer um sistema igual ou melhor precisamos desmontar a planilha inteira.

Linha por linha.

Fórmula por fórmula.

---

Exemplo.

A célula:

```
AB45
```

Precisamos responder:

* O que calcula?
* Quem usa?
* Quem alimenta?
* Qual regra de negócio?
* Pode ser substituída?
* Depende de quais células?
* Em qual componente ficará?

Isso deve ser feito para **todas as fórmulas**.

Essa fase gera um documento como:

| Fórmula Excel | Regra de Negócio | Componente         | Método   |
| ------------- | ---------------- | ------------------ | -------- |
| =A1+B1        | Soma MP          | Matéria-Prima      | SUM      |
| =SE(...)      | Regra de perda   | Perdas             | RULE-012 |
| =PROCV(...)   | Busca preço      | Variável Econômica | LOOKUP   |

Na minha opinião, esse documento será o mais importante do projeto.

---

# FASE 3

## Catálogo de Regras de Negócio

Aqui não falaremos mais de Excel.

Cada regra ganha um código.

Exemplo.

```
RN-001

O custo da matéria-prima será a soma dos componentes da composição.
```

```
RN-002

Energia será calculada pelo consumo do processo × tarifa vigente.
```

```
RN-003

Frete somente será aplicado em cenários comerciais.
```

No final teremos cerca de **150 a 300 regras**.

---

# FASE 4

## Modelo Lógico do Banco

Aqui nasce o banco de dados.

Tabela por tabela.

Campo por campo.

FK.

PK.

Índices.

Views.

Histórico.

Versionamento.

Essa fase praticamente entrega o banco para o DBA.

---

# FASE 5

## Especificação das APIs

Aqui documentaremos:

```
POST /cenario

GET /produto/{id}

POST /calcular

GET /memoria

POST /simular
```

Com payloads completos.

---

# FASE 6

## Protótipos das Telas

Somente agora.

Depois de tudo pronto.

Vamos desenhar:

Dashboard.

Tela do Produto.

Tela do Cenário.

Motor.

Comparação.

Simulação.

Aprovação.

---

# FASE 7

## Casos de Uso

Exemplo.

```
UC001

Criar Cenário
```

Fluxo Principal.

Fluxo Alternativo.

Erros.

Permissões.

Regras.

---

# FASE 8

## Plano de Implantação

Migração.

Validação.

Comparação Excel × Sistema.

Testes.

Treinamentos.

Entrada em Produção.

---

# Mas...

Agora vem uma coisa que eu não falei até hoje.

## Existe uma Fase 0.

E ela deveria ter sido feita antes de tudo.

Depois de tudo que analisamos, eu faria esta documentação antes mesmo da Fase 2.

---

# DOCUMENTO 000

# Filosofia da Engenharia Econômica

Pode parecer estranho.

Mas empresas como SAP, Oracle e Siemens fazem isso.

---

Esse documento responderia:

## O que é custo?

## O que é preço?

## O que é recurso?

## O que é componente?

## O que é cenário?

## O que é versão?

## O que é memória de cálculo?

## O que é uma variável?

## O que é uma regra?

## O que é um cálculo?

## O que é um resultado?

---

Parece teoria.

Mas não é.

Esse documento impede que dois desenvolvedores usem palavras diferentes para a mesma coisa.

---

# E agora vem minha maior conclusão

Depois de praticamente todas essas horas analisando seu PDM e a planilha, eu mudaria uma única coisa na arquitetura que propusemos.

## Eu deixaria de chamar o sistema de:

> Engenharia Econômica

E passaria a chamá-lo de:

> **Engine de Formação de Custos (EFC)**

Por quê?

Porque "Engenharia Econômica" é um conceito muito amplo. Ela pode envolver estudos de investimento, TIR, VPL, payback, viabilidade de projetos, entre outros temas.

O que estamos construindo é muito mais específico: um mecanismo para formar custos industriais, simular cenários, manter histórico, controlar versões e apoiar a precificação.

Na prática, o PDM continuaria sendo a **Engenharia do Produto**, e ao lado dele existiria a **Engine de Formação de Custos**, especializada em transformar dados técnicos em custos auditáveis.

---

# Minha recomendação final

Se este projeto fosse meu, **eu não escreveria mais nenhum documento funcional neste momento**.

Eu iniciaria imediatamente a **Fase 2 — Engenharia Reversa da Planilha**.

E aqui eu faria algo que considero o verdadeiro diferencial do projeto:

* Abrir a planilha.
* Analisar **cada aba**.
* Mapear **cada fórmula**.
* Identificar **cada regra de negócio**.
* Classificar cada regra em um componente do novo motor.
* Eliminar redundâncias e fórmulas duplicadas.
* Transformar tudo em um catálogo de regras para implementação.

## Esta será, na minha opinião, a fase mais crítica de todo o projeto.

Porque é nela que deixaremos de depender do Excel. Quando essa etapa estiver concluída, a planilha deixará de ser a "fonte da verdade" e passará a ser apenas um artefato histórico, enquanto toda a inteligência estará documentada e pronta para ser implementada no sistema.

**É exatamente essa fase que eu faria em seguida.** Ela é a ponte entre a documentação que construímos e o desenvolvimento real do software.
