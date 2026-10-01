import type { InfoContent } from "./types"

export const ferramentasContent: Record<string, InfoContent> = {
  "/ferramentas": {
    title: "Ferramentas",
    description:
      "Central de ferramentas auxiliares do sistema para cálculos e operações do dia a dia.",
    rules: [
      "Cada ferramenta é independente e não afeta dados do sistema.",
      "Ferramentas estão disponíveis para todos os usuários autenticados.",
    ],
  },
  "/ferramentas/conversores": {
    title: "Numeração de Fio",
    description:
      "Conversor entre diferentes sistemas de numeração de fios: Ne, Nm, Tex, Dtex e Denier.",
    rules: [
      "A conversão é feita em tempo real conforme você digita.",
      "Os valores são aproximados devido a diferenças nos sistemas de medida.",
      "Ne (Cotton) é o sistema mais comum no Brasil para fios de algodão.",
    ],
  },
  "/ferramentas/regra-de-tres": {
    title: "Calculadora de Regra de Três",
    description:
      "Resolve regra de três simples (direta ou inversa) e composta para cálculos rápidos do dia a dia.",
    rules: [
      "Regra direta: grandezas que variam na mesma proporção.",
      "Regra inversa: grandezas que variam em proporção inversa.",
      "Regra composta: três ou mais grandezas relacionadas.",
    ],
  },
  "/ferramentas/consulta-cnpj": {
    title: "Consulta CNPJ",
    description: "Consulta dados de empresas na base da Receita Federal através do CNPJ.",
    rules: [
      "A consulta é feita em tempo real via API pública da Receita Federal.",
      "Os dados exibidos incluem razão social, endereço, CNAE, situação cadastral e sócios.",
      "A ferramenta é apenas para consulta — não altera nenhum dado no sistema.",
    ],
    fields: [
      { name: "CNPJ", desc: "Número do CNPJ a consultar (apenas dígitos)" },
      { name: "Resultado", desc: "Dados completos da empresa retornados pela Receita Federal" },
    ],
  },
  "/ferramentas/nfe-cte": {
    title: "NF-e → CT-e por Período",
    description:
      "Relatório que lista todas as NF-e que possuem CT-e em um período, com razão social da transportadora, do tomador e do fornecedor, e o percentual de cada NF-e no total do CT-e.",
    rules: [
      "A granularidade é NF-e: cada linha é uma nota, e os dados do CT-e são repetidos em suas linhas.",
      "O período filtra pela data de emissão da NF-e. Sem cabeçalho de NF-e, vale a data do CT-e.",
      "O percentual fecha em 100% por CT-e; arredondamento de centavos pode gerar 99,99% ou 100,01%.",
      "O total do CT-e é o valor do frete, não o valor da carga — por isso o percentual costuma ser baixo.",
      "NF-e sem cabeçalho aparece com data, valor e situação vazios, mas continua na lista.",
      "Nome de fornecedor pode vir vazio quando o CNPJ não está cadastrado no ERP de origem.",
      "A ferramenta é somente de leitura — não altera nenhum dado no sistema.",
    ],
    fields: [
      { name: "Período", desc: "Intervalo de datas (padrão: últimos 2 meses)" },
      { name: "CT-e", desc: "Número, série, emissão, frete, transportadora e tomador" },
      { name: "NF-e", desc: "Número, série, emissão, valor, frete rateado e fornecedor" },
      { name: "% do CT-e", desc: "Peso da nota no total do CT-e" },
      { name: "% CT-e sobre a nota", desc: "Frete sobre a mercadoria, com a faixa colorida" },
      { name: "Frete sobre a mercadoria", desc: "Total do CT-e ÷ soma das NF-e do CT-e" },
      { name: "Frete médio", desc: "Média do frete % por CT-e do grupo" },
    ],
    examples: [
      {
        title: "Regra de faixa de frete",
        desc: "O frete deve ficar entre 1,5% e 2,0% da mercadoria. Até 1,5% fica verde, entre 1,5% e 2,0% fica laranja (é a faixa esperada) e acima de 2,0% fica vermelho.",
      },
      {
        title: "Por que a média e não o ratio total",
        desc: "O frete médio é a média do percentual CT-e a CT-e. Somar todo o frete e dividir por toda a mercadoria distorce, porque uma única NF-e muito grande puxa o resultado para baixo e mascara CT-es fora da faixa.",
      },
      {
        title: "Região do cliente",
        desc: "O agrupamento por região usa a região do cliente da ordem de despacho (nf_od_regiao), não a origem ou o destino do CT-e. CT-es sem essa informação aparecem como “Sem região”.",
      },
    ],
  },
}

/**
 * Ajuda do "X% do CT-e" que aparece embaixo do valor de rateio na grade de NF-e.
 * Não é uma tela, é um campo: fica fora do mapa de pathnames e é importado
 * direto pelo componente. Texto em linguagem de leigo, porque quem lê esse
 * número não é da área fiscal.
 */
export const rateioCteInfoContent: InfoContent = {
  title: "O que é o “% do CT-e” embaixo do rateio",
  description:
    "O rateio é a parte do conhecimento que foi vinculada a cada nota. O número embaixo do valor diz quanto do CT-e inteiro aquela nota representa. Ele vem do próprio CT-e, e não da nota — por isso, quando o CT-e tem uma nota só, o número é 100,00%: não é erro, é a nota carregando o conhecimento inteiro.",
  rules: [
    "100,00% nesta linha significa que a nota levou todo o rateio do CT-e. É o caso normal de CT-e com uma nota só.",
    "Se o CT-e tiver duas ou mais notas, os percentuais das linhas somam 100%: cada nota leva a sua cota.",
    "Abaixo de 100% significa que a soma dos itens rateados não bate com o total do CT-e no cadastro do ERP. A tela marca esses CT-es com “rateio não fecha” para facilitar a conferência.",
    "Este número NÃO é o frete. O frete sobre a mercadoria é a coluna “% CT-e sobre a nota” e o selo colorido no cabeçalho do CT-e.",
    "A coluna “% do CT-e” conta a mesma divisão pelo outro lado: o peso do VALOR DA NOTA dentro do CT-e.",
  ],
  fields: [
    { name: "Rateio", desc: "Valor que o CT-e separou para esta nota (soma dos itens rateados)" },
    { name: "% do CT-e", desc: "Esse rateio dividido pelo total do CT-e" },
    { name: "% CT-e sobre a nota", desc: "Total do CT-e (frete) dividido pelo valor da nota (mercadoria)" },
  ],
  examples: [
    {
      title: "CT-e com uma nota só",
      desc: "O rateio mostra 100,00% do CT-e e a coluna “% do CT-e” mostra 100,00%. É o mesmo CT-e visto pelas duas colunas, e é o esperado.",
    },
    {
      title: "CT-e com duas notas",
      desc: "Se a nota A leva 60% da mercadoria e a nota B leva 40%, a coluna “% do CT-e” mostra 60,00% e 40,00%. No rateio, os percentuais também somam 100%, mas os números podem ser diferentes se os itens rateados não estiverem na mesma proporção das notas.",
    },
  ],
}
