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

