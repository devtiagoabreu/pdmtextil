# OpenCNPJ — Documentação da API

API pública e gratuita para consulta de dados cadastrais de empresas brasileiras (CNPJ).
**Sem token, sem cadastro, sem limites de requisição.**

- Site oficial: https://opencnpj.org
- Base URL: `https://api.opencnpj.org`
- Repositório: https://github.com/Hitmasu/opencnpj

---

## Endpoints

### `GET /{cnpj}` — Consultar empresa por CNPJ

Retorna todos os dados cadastrais de uma empresa.

**Parâmetros**

| Nome | Tipo | Obrigatório | Descrição |
|------|------|-------------|-----------|
| `cnpj` | `string` | Sim | CNPJ com ou sem pontuação (apenas números, ou no formato `00.000.000/0000-00`) |

**Exemplos**

```
GET https://api.opencnpj.org/00000000000191
GET https://api.opencnpj.org/00.000.000/0001-91
```

**Status HTTP**

| Código | Significado |
|--------|-------------|
| `200` | Sucesso — retorna o JSON da empresa |
| `404` | CNPJ não encontrado |
| `429` | Rate limit excedido |

---

### `GET /info` — Informações da base de dados

Retorna metadados sobre a base de dados OpenCNPJ: data da última atualização, quantidade de registros, shards, datasets disponíveis para download, etc.

**Exemplo**

```
GET https://api.opencnpj.org/info
```

**Resposta**

```json
{
  "total": 71862830,
  "last_updated": "2026-06-17T22:10:55.4758486Z",
  "shard_prefix_length": 3,
  "shard_count": 987,
  "storage_release_id": "9e3b1bba2f0905b2",
  "datasets": {
    "receita": {
      "storage_release_id": "9e3b1bba2f0905b2",
      "updated_at": "2026-06-17T22:10:55.4758486Z",
      "record_count": 71862830,
      "zip_available": true,
      "zip_size": 14008519064,
      "zip_url": "https://file.opencnpj.org/releases/receita/data.zip",
      "zip_md5checksum": "ec7570329ce42ce922713d23eb9b879f"
    },
    "cno": { ... },
    "rntrc": { ... }
  },
  "shard_index_distribution": "r2",
  "shard_format": "ndjson+binary-index",
  "zip_layout": "per-dataset-shards-v1",
  "cnpj_type": "string"
}
```

---

## Formato da Resposta (`GET /{cnpj}`)

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `cnpj` | `string` | CNPJ apenas números |
| `razao_social` | `string` | Razão social |
| `nome_fantasia` | `string` | Nome fantasia |
| `situacao_cadastral` | `string` | Situação cadastral (ex: "Ativa", "Inapta", "Baixada") |
| `data_situacao_cadastral` | `string` | Data da situação cadastral (`YYYY-MM-DD`) |
| `matriz_filial` | `string` | "MATRIZ" ou "FILIAL" |
| `data_inicio_atividade` | `string` | Data de início de atividade (`YYYY-MM-DD`) |
| `cnae_principal` | `string` | CNAE principal (código numérico) |
| `cnae_principal_descricao` | `string` | Descrição do CNAE principal |
| `cnaes_secundarios` | `array[string]` | Lista de CNAEs secundários |
| `cnaes_secundarios_count` | `number` | Quantidade de CNAEs secundários |
| `natureza_juridica` | `string` | Natureza jurídica (ex: "Sociedade Empresária Limitada") |
| `logradouro` | `string` | Logradouro |
| `numero` | `string` | Número |
| `complemento` | `string` | Complemento |
| `bairro` | `string` | Bairro |
| `cep` | `string` | CEP |
| `uf` | `string` | Unidade Federativa (sigla) |
| `municipio` | `string` | Município |
| `email` | `string` | E-mail |
| `telefones` | `array[object]` | Lista de telefones |
| `capital_social` | `string` | Capital social (formato: `"1000,00"`) |
| `porte_empresa` | `string` | Porte da empresa (ex: "Microempresa (ME)", "Demais") |
| `opcao_simples` | `string` | Optante pelo Simples Nacional ("S" ou "N") |
| `data_opcao_simples` | `string` | Data da opção pelo Simples |
| `opcao_mei` | `string` | Optante pelo MEI ("S" ou "N") |
| `data_opcao_mei` | `string` | Data da opção pelo MEI |
| `qsa` | `array[object]` | Quadro de Sócios e Administradores |
| `cno` | `array[object]` | Cadastro Nacional de Obras (se houver) |
| `rntrc` | `array[object]` | Registro Nacional de Transporte Rodoviário de Cargas (se houver) |

### Objeto `telefones`

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `ddd` | `string` | DDD |
| `numero` | `string` | Número do telefone |
| `tipo` | `string` | Tipo (ex: "Fone", "Fax") |

### Objeto `qsa` (sócios)

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `cnpj_cpf` | `string` | CNPJ/CPF do sócio |
| `nome` | `string` | Nome do sócio |
| `qualificacao` | `string` | Qualificação do sócio (ex: "Sócio-Administrador") |
| `pais_origem` | `string` | País de origem |
| `nome_representante_legal` | `string` | Nome do representante legal (se houver) |
| `qualificacao_representante_legal` | `string` | Qualificação do representante legal |
| `faixa_etaria` | `string` | Faixa etária |
| `data_entrada` | `string` | Data de entrada na sociedade (`YYYY-MM-DD`) |
| `pessoa_fisica` | `boolean` | É pessoa física? |
| `socio_admin` | `boolean` | É sócio administrador? |

### Objeto `cno`

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `cno` | `string` | Número do CNO |
| `nome` | `string` | Nome da obra |
| `nome_empresarial` | `string` | Nome empresarial do responsável |
| `situacao.codigo` | `string` | Código da situação |
| `situacao.descricao` | `string` | Descrição da situação |
| `data_inicio` | `string` | Data de início |
| `data_inicio_responsabilidade` | `string` | Data de início da responsabilidade |
| `data_registro` | `string` | Data de registro |
| `data_situacao` | `string` | Data da situação |
| `cep` | `string` | CEP da obra |
| `uf` | `string` | UF da obra |
| `codigo_municipio` | `string` | Código do município (IBGE) |
| `municipio` | `string` | Nome do município |
| `tipo_logradouro` | `string` | Tipo do logradouro |
| `logradouro` | `string` | Logradouro |
| `numero` | `string` | Número |
| `bairro` | `string` | Bairro |
| `complemento` | `string` | Complemento |
| `unidade_medida` | `string` | Unidade de medida da área |
| `area_total` | `string` | Área total |
| `cno_vinculado` | `string` | CNO vinculado (se houver) |
| `codigo_pais` | `string` | Código do país |
| `pais` | `string` | Nome do país |
| `qualificacao_responsavel.codigo` | `string` | Código da qualificação do responsável |
| `qualificacao_responsavel.descricao` | `string` | Descrição da qualificação |
| `codigo_localizacao` | `string` | Código de localização geográfica |

---

## Exemplo de uso com curl

```bash
# Apenas números
curl -s https://api.opencnpj.org/00000000000191

# Com pontuação
curl -s "https://api.opencnpj.org/00.000.000/0001-91"

# Informações da base
curl -s https://api.opencnpj.org/info
```

## Exemplo de resposta (resumido)

```json
{
  "cnpj": "00000000000191",
  "razao_social": "BANCO DO BRASIL S.A.",
  "nome_fantasia": "BANCO DO BRASIL",
  "situacao_cadastral": "Ativa",
  "data_situacao_cadastral": "2004-04-01",
  "matriz_filial": "MATRIZ",
  "data_inicio_atividade": "1966-01-13",
  "cnae_principal": "6422100",
  "cnae_principal_descricao": "Banco Múltiplo",
  "cnaes_secundarios": ["6491300", "6493600", "6611801"],
  "natureza_juridica": "Sociedade de Economia Mista",
  "logradouro": "SBS QUADRA 1 BLOCO A LOTE 31",
  "numero": "S/N",
  "complemento": "ED. SEDE III",
  "bairro": "ASA SUL",
  "cep": "70073901",
  "uf": "DF",
  "municipio": "BRASÍLIA",
  "capital_social": "135000000000,00",
  "porte_empresa": "Demais",
  "opcao_simples": "N",
  "opcao_mei": "N",
  "telefones": [{ "ddd": "61", "numero": "34931234", "tipo": "Fone" }],
  "qsa": [
    {
      "cnpj_cpf": "***000860**",
      "nome": "TARCIO GOMES DE FREITAS",
      "qualificacao": "Administrador",
      "data_entrada": "2025-04-25",
      "pessoa_fisica": true,
      "socio_admin": true
    }
  ]
}
```

---

## Uso no CRM (integração)

Para enriquecer leads do tipo **PJ** com dados da Receita Federal, faça uma requisição ao buscar/converter o lead:

1. Ao criar ou editar um lead com `tipoPessoa = "PJ"`, capture o CNPJ do campo `empresaNome` (ou campo de documento específico).
2. Faça `GET https://api.opencnpj.org/{cnpj}` para obter:
   - `razao_social` → preencher nome do lead ou razão social
   - `nome_fantasia` → exibição no grid
   - `situacao_cadastral` → validar se a empresa está ativa
   - `logradouro`, `numero`, `bairro`, `cep`, `uf`, `municipio` → endereço
   - `cnae_principal_descricao` → segmento
   - `porte_empresa` → porte
   - `telefones` → contatos adicionais
   - `email` → e-mail
   - `qsa` → sócios (para identificar contato direto)
3. Caso o CNPJ não seja encontrado, a API retorna `404`.

### Considerações

- A API **não exige token nem cadastro** — pode ser chamada diretamente do frontend ou backend.
- Os dados são atualizados diariamente a partir da base da Receita Federal.
- Para ambientes serverless (Vercel), recomenda-se chamar a API pelo backend para evitar expor o esquema de dados e permitir caching.
- Para consultas em lote, utilize os datasets disponíveis em https://opencnpj.org (download de ZIP com NDJSON sharded).
