import { Pool } from 'pg'
import dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })

const pool = new Pool({ connectionString: process.env.DATABASE_URL })

const NOVO_CONTEUDO = `## 📅 Visitas — O Coração do Relacionamento Comercial

Cada visita registrada é um passo a mais na construção do relacionamento com o cliente. Este guia mostra **tudo** que você pode fazer com visitas no CRM.

---

### 🎯 Entendendo as Entidades

Antes de agendar, você precisa saber **quem** vai visitar:

| Entidade | O que é | Quando usar |
| :--- | :--- | :--- |
| 🏢 **Cliente** | Empresa já cadastrada no sistema (com CNPJ) | Clientes ativos, fechamentos, pós-venda |
| 👤 **Pessoa (Negócio)** | Prospect/futuro cliente (sem CNPJ obrigatório) | Feiras, prospecção, contatos iniciais |

> 💡 Ao clicar em **Nova Visita**, o sistema pergunta "Quem você vai visitar?" — escolha **Cliente** ou **Pessoa** antes de prosseguir.

---

### 📋 Criando uma Nova Visita

**Caminho:** CRM → Visitas → **Nova Visita**

#### Passo 1: Escolher a entidade

O formulário começa com duas opções:
- **Cliente** → sistema mostra lista de clientes cadastrados
- ** Pessoa** → sistema mostra lista de pessoas/negócios do CRM

#### Passo 2: Preencher os dados

| Campo | Obrigatório | Descrição |
| :--- | :---: | :--- |
| **Pessoa ou Cliente** | ✅ | Quem você vai visitar |
| **Data da Visita** | ✅ | Quando será a visita |
| **Tipo** | Padrão: PRESENCIAL | Presencial, Vídeo ou Telefone |
| **Oportunidade** | Não | Vincular a um negócio específico (só para Pessoa) |
| **Contato** | Não | Pessoa de contato dentro da empresa |
| **Endereço** | Não | Local da visita (pode copiar do negócio com 1 clique) |
| **Relato / Ata** | Não | Descrição do que aconteceu (preencha DEPOIS) |
| **Fotos** | Não | URLs de fotos da visita |

> 🔗 **Dica:** Clique em **"Copiar endereço do negócio"** para preencher o endereço automaticamente.

#### Passo 3: Salvar

Ao salvar, o sistema:
1. Cria a visita com status **AGENDADA**
2. Registra no log do sistema
3. Adiciona evento no timeline da pessoa/cliente
4. Envia notificação in-app

---

### 🔄 Fluxo Completo da Visita

\`\`\`
📅 CRIADA (AGENDADA)
   │
   ├──► ✅ REALIZADA
   │       ├── Relato preenchido
   │       ├── Fotos adicionadas
   │       ├── Check-in/out registrados
   │       └── 🔔 Pesquisa de satisfação enviada AUTOMATICAMENTE
   │
   └──► ❌ CANCELADA
           └── Motivo do cancelamento obrigatório
\`\`\`

---

### 📍 Check-in e Check-out com GPS

O sistema permite registrar a **localização GPS** em cada visita.

#### Como fazer Check-in:

1. Na listagem (tabela, kanban ou dashboard), clique no ícone 📍 ao lado da visita
2. No modal que abre, clique em **"Check-in"**
3. O sistema pede permissão de localização do navegador
4. Ao autorizar, salva automaticamente:
   - 🕐 Hora do check-in
   - 📍 Latitude e Longitude
   - O registro fica salvo como tipo **CHECK_IN**

#### Como fazer Check-out:

1. No mesmo modal, clique em **"Check-out"**
2. O sistema captura a localização atual
3. Salva como tipo **CHECK_OUT** com hora e coordenadas

#### Adicionando localizações extras:

No mesmo modal, você pode adicionar **localizações manuais**:
- Latitude / Longitude
- Endereço
- Observação
- Foto (URL)

> 📊 Todas as localizações ficam registradas e aparecem no **relatório PDF** da visita com links para Google Maps.

---

### 📊 Dashboard de Visitas

**Caminho:** CRM → Visitas → Dashboard

O dashboard oferece uma visão completa com:

| Métrica | O que mostra |
| :--- | :--- |
| **Total de Visitas** | Quantidade geral |
| **Realizadas** | Visitas concluídas |
| **Canceladas** | Visitas canceladas |
| **Agendadas** | Visitas pendentes |
| **Visitas Hoje** | Agenda do dia |
| **Este Mês** | Produção mensal |
| **Pesquisas Respondidas** | Satisfação dos clientes |

#### Gráficos interativos:

- **Pizza:** Distribuição por Tipo (Presencial, Vídeo, Telefone)
- **Barras:** Distribuição por Status (Agendada, Realizada, Cancelada)
- **Ranking:** Performance por Representante (quem faz mais visitas)

> 🖱️ Passe o mouse sobre os gráficos para ver detalhes. Os gráficos são interativos com tooltips.

---

### 📋 Três Formas de Visualizar suas Visitas

#### 1. Tabela (padrão)
- Grid com todas as visitas
- Busca por pessoa, cliente ou oportunidade
- Ícone 📅 para gerenciar localizações
- Clique na linha para ver detalhes

#### 2. Calendário
- Visualização mensal/diária
- Veja as visitas agendadas por data
- Clique em um dia para ver detalhes

#### 3. Kanban
- Colunas por status (Agendada, Realizada, Cancelada)
- **Arraste e solte** para mudar o status
- Acesse direto pelo link: \`/comercial/crm/visitas?view=kanban\`

---

### ✏️ Editando uma Visita

No detalhe da visita, clique em **"Editar"** para alterar:

- **Status:** AGENDADA → REALIZADA ou CANCELADA
- **Tipo:** Presencial, Vídeo ou Telefone
- **Data:** Data da visita
- **Endereço:** Local completo
- **Relato:** Descrição detalhada (Rich Text)
- **Fotos:** Adicionar ou remover URLs

> ⚠️ Ao mudar o status para **REALIZADA**, o sistema envia automaticamente a **Pesquisa de Satisfação** para o email da pessoa/cliente/contato.

---

### 🔔 Pesquisa de Satisfação

#### Envio automático:

Quando a visita é marcada como **REALIZADA**, o sistema:
1. Busca os emails vinculados (Pessoa, Cliente e/ou Contato)
2. Gera um link único de pesquisa
3. Envia email HTML com botão "Responder Pesquisa"

#### Envio manual:

No detalhe da visita, clique em **"Enviar Pesquisa"** para enviar manualmente.

#### O que o cliente recebe:

Um email profissional com:
- Saudação personalizada
- Data da visita
- Botão para responder
- Link direto para o formulário

#### Formulário público (\`/comercial/crm/pesquisa/[token]\`):

| Pergunta | Tipo |
| :--- | :--- |
| Avaliação geral | ⭐ Estrelas (1 a 5) |
| 5 perguntas de múltipla escolha | Alternativas |
| Sugestões/observações | Texto aberto |

> 📈 As respostas aparecem no Dashboard de Visitas no card **"Pesquisas Respondidas"**.

---

### 📄 Relatório PDF

No detalhe da visita, clique em **"Gerar PDF"** para criar um relatório completo:

| Seção | Conteúdo |
| :--- | :--- |
| **Cabeçalho** | Logo e dados da empresa |
| **Dados da Visita** | Entidade, data, tipo, status, criado por |
| **Check-in/out** | Hora + coordenadas GPS + link Google Maps |
| **Localizações** | Tabela com todas as localizações registradas |
| **Relato / Ata** | Texto completo formatado |
| **Fotos** | Lista de URLs |
| **Rodapé** | Paginação e data de geração |

---

### 🗑️ Excluindo uma Visita

- Apenas **ADMIN, SUDO, COMERCIAL e CRM** podem excluir
- Clique em **"Excluir"** no detalhe da visita
- Confirme no modal de confirmação

> ⚠️ A exclusão é permanente. Use apenas quando necessário.

---

### 💡 Dicas de Ouro

> **1. Nunca faça uma visita sem registrar no CRM antes.** O simples ato de agendar já organiza sua semana.

> **2. Sempre faça check-in e check-out.** A localização GPS prova que você esteve lá e ajuda no planejamento de rotas.

> **3. Escreva um relato completo.** O que o cliente disse? Qual o humor? Próximos passos? Seu relato é a prova do trabalho bem feito.

> **4. Use o Kanban para organizar.** Arraste as visitas entre colunas para manter tudo atualizado sem abrir cada uma.

> **5. A pesquisa de satisfação é automática.** Basta marcar como REALIZADA — o sistema cuida do resto.

> **6. Gere o PDF para apresentações.** O relatório é profissional e pode ser enviado ao cliente ou à gestão.`

const NOVO_TITULO = 'Agendando, Registrando e Gerenciando Visitas'
const NOVA_DESCRICAO = 'Domine todo o ciclo de visitas: agendamento com Cliente ou Pessoa, check-in/out com GPS, relato, fotos, pesquisa de satisfação automática, dashboard e relatório PDF.'
const NOVOS_PRE_REQUISITOS = 'Empresas (Clientes) ou Pessoas cadastradas no CRM'

async function main() {
  const client = await pool.connect()
  try {
    await client.query('BEGIN')

    // Find the module
    const { rows: modulos } = await client.query(
      "SELECT id FROM crm_treino_modulos WHERE ordem = 7"
    )

    if (modulos.length === 0) {
      console.error('Module with ordem=7 not found!')
      process.exit(1)
    }

    const moduloId = modulos[0].id
    console.log(`Found module 7: id=${moduloId}`)

    // Update the module description
    await client.query(
      "UPDATE crm_treino_modulos SET descricao = $1, titulo = $2 WHERE id = $3",
      [NOVA_DESCRICAO, 'Visitas — Relacionamento que Gera Negócio', moduloId]
    )
    console.log('Module description updated')

    // Delete old lessons for this module
    const { rowCount } = await client.query(
      "DELETE FROM crm_treino_licoes WHERE modulo_id = $1",
      [moduloId]
    )
    console.log(`Deleted ${rowCount} old lesson(s)`)

    // Insert new lesson
    await client.query(
      `INSERT INTO crm_treino_licoes (modulo_id, titulo, conteudo_md, pre_requisitos, pathname_relacionado, ordem)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [
        moduloId,
        NOVO_TITULO,
        NOVO_CONTEUDO,
        NOVOS_PRE_REQUISITOS,
        '/comercial/crm/visitas/novo',
        1,
      ]
    )
    console.log('New lesson inserted')

    await client.query('COMMIT')
    console.log('✅ Visit training module updated successfully!')
  } catch (err) {
    await client.query('ROLLBACK')
    console.error('❌ Error:', err.message)
    throw err
  } finally {
    client.release()
    await pool.end()
  }
}

main()
