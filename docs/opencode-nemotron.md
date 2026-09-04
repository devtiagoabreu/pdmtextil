# OpenCode + NVIDIA Nemotron — Configuração e Referência

Integração do **opencode** (agente de desenvolvimento) com os modelos **NVIDIA NIM** na nuvem.
Registrado em 2026-09-04 para uso futuro no PDM.

---

## Visão geral

- **Provedor**: NVIDIA NIM (nuvem) — `build.nvidia.com`
- **Base URL**: `https://integrate.api.nvidia.com/v1`
- **Autenticação**: Bearer token via `NVIDIA_API_KEY` (ou `apiKey` no config)
- **Compatibilidade**: OpenAI Chat Completions API (qualquer SDK OpenAI funciona mudando `base_url`)
- **Modelo principal**: `nvidia/nemotron-3-ultra-550b-a55b` (Nemotron 3 Ultra 550B-A55B)

---

## API Key (NVIDIA)

- Endpoint para gerar/settings: https://build.nvidia.com/settings
- Exemplo de key concedida (testing, válida por 6 meses): `nvapi-...`
- **Atenção**: a key NÃO vai para o repositório do PDM — usada apenas no config global da opencode (`~/.config/opencode/`).

---

## Configuração da opencode (config global)

O config fica em `~/.config/opencode/opencode.json` (global, fora do repositório).
Configurações são **mergeadas**, não substituídas — cada fonte define só o que precisa.

### Config mínimo (provider nativo `nvidia`)

A opencode tem suporte **nativo** ao provider `nvidia` (já aponta para
`https://integrate.api.nvidia.com/v1` e conhece os model ids do NIM).
Basta definir o modelo e a key:

```jsonc
{
  "$schema": "https://opencode.ai/config.json",
  "model": "nvidia:nvidia/nemotron-3-ultra-550b-a55b",
  "provider": {
    "nvidia": {
      "options": {
        "apiKey": "nvapi-SUA-KEY-AQUI"
      }
    }
  }
}
```

> **Onde fica cada config** (ordem de precedência, o último vence):
> `~/.config/opencode/opencode.json` → `OPENCODE_CONFIG` → `opencode.json` do projeto → `.opencode/`.
> Para alterar o modelo da opencode, edite o **global** (`C:\Users\tecno\.config\opencode\opencode.json`).

> **Reinício obrigatório**: a opencode carrega o config **uma vez no startup** — não há hot-reload.
> Após editar o config, reinicie a sessão da opencode.

### Alternativa (provider custom OpenAI-compatible)

Caso queira apontar para um NIM **local** (Docker) ou outro endpoint, use
`@ai-sdk/openai-compatible`:

```jsonc
{
  "$schema": "https://opencode.ai/config.json",
  "model": "local/nvidia-nemotron-3-ultra",
  "provider": {
    "local": {
      "npm": "@ai-sdk/openai-compatible",
      "name": "local_backend",
      "options": {
        "baseURL": "http://localhost:8000/v1",
        "apiKey": "EMPTY"
      },
      "models": {
        "nvidia-nemotron-3-ultra": {
          "name": "nvidia/nemotron-3-ultra",
          "limit": { "context": 1000000, "output": 32768 }
        }
      }
    }
  }
}
```

---

## Testando a API NVIDIA

### curl (Chat Completions)

```bash
curl https://integrate.api.nvidia.com/v1/chat/completions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $NVIDIA_API_KEY" \
  -d '{
    "model": "nvidia/nemotron-3-ultra-550b-a55b",
    "messages": [{"role": "user", "content": "Responda apenas: ok"}],
    "max_tokens": 16
  }'
```

### Python (OpenAI SDK)

```python
from openai import OpenAI

client = OpenAI(
    base_url="https://integrate.api.nvidia.com/v1",
    api_key="nvapi-SUA-KEY-AQUI",
)

completion = client.chat.completions.create(
    model="nvidia/nemotron-3-ultra-550b-a55b",
    messages=[{"role": "user", "content": "Write a limerick about the wonders of GPU computing."}],
    temperature=1,
    top_p=0.95,
    max_tokens=16384,
    extra_body={"chat_template_kwargs": {"enable_thinking": True}},
    stream=True,
)

for chunk in completion:
    if not chunk.choices:
        continue
    reasoning = getattr(chunk.choices[0].delta, "reasoning_content", None)
    if reasoning:
        print(reasoning, end="")
    if chunk.choices[0].delta.content is not None:
        print(chunk.choices[0].delta.content, end="")
```

> O **Nemotron 3** gera um *reasoning trace* antes da resposta final; disponível em
> `delta.reasoning_content` no streaming (controle via `chat_template_kwargs.enable_thinking`).

---

## Modelos NVIDIA NIM disponíveis

Lista completa via `opencode models` (o provider `nvidia` lista tudo nativamente).
Relevantes para agentic/tool-calling/código:

| Modelo (model id da API) | Tamanho | Uso |
|---|---|---|
| `nvidia/nemotron-3-ultra-550b-a55b` | 550B total / 55B ativo | Frontier — agente, raciocínio, código (heavy) |
| `nvidia/nemotron-3-super-120b-a12b` | 120B | Intermediário |
| `nvidia/nemotron-3-nano-30b-a3b` | 30B | Leve |
| `nvidia/nemotron-3-nano-omni-30b-a3b-reasoning` | 30B | Omni-modal (imagem/vídeo/áudio/texto) + raciocínio |
| `nvidia/nemotron-nano-9b-v2` | 9B | Muito leve, híbrido Mamba-Transformer, tool-calling |
| `nvidia/nvidia/nemotron-3.5-lightning-30b-a3b` | 30B | Rápido |

**Na opencode**, o model id é prefixado com o provider: `nvidia:nvidia/<model>`.
Ex.: `opencode models` lista `nvidia/nvidia/nemotron-3-ultra-550b-a55b`.

---

## Referência NIM local (Nemotron 3 Ultra, Docker)

O NIM expõe endpoints OpenAI-compatible **e** Anthropic-compatible. Para rodar local:

```bash
docker run --gpus=all \
  -e NGC_API_KEY=$NGC_API_KEY \
  -e NIM_PASSTHROUGH_ARGS="--reasoning-parser nemotron_v3" \
  -v "$LOCAL_NIM_CACHE:/opt/nim/.cache" \
  -p 8000:8000 \
  nvcr.io/nim/nvidia/nemotron-3-ultra-550b-a55b:2.0.5-variant
```

- Contexto nativo: **262.144 tokens (256K)** por padrão
- Chat Completions: `/v1/chat/completions` · Text: `/v1/completions` · Responses: `/v1/responses`
- Requer GPU pesada (550B; NVFP4 quantizado) — **não** recomendado para a opencode do dia a dia;
  preferir a nuvem (`integrate.api.nvidia.com`) ou o `nemotron-nano-9b-v2`.

---

## Notas de uso no PDM

- A opencode roda o modelo escolhido no config global — este doc é referência para trocar
  o modelo (ex.: alternar entre `nemotron-3-ultra` para tarefas pesadas e `nemotron-nano-9b-v2`
  para uso leve/custo baixo).
- Confirmado funcional (2026-09-04): key válida + `nemotron-3-ultra-550b-a55b` respondeu `ok` via API.
- Vírgula de segurança: guardar a key em variável de ambiente (`NVIDIA_API_KEY`) em vez de
  embutir no config; o config atual está embutido por conveniência do teste.
