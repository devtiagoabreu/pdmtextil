# Aprendizados de Desenvolvimento - PDM Pro Têxtil

Este arquivo contém todos os aprendizados do desenvolvimento do projeto PDM Pro Têxtil, consolidados desde o início do projeto até o momento atual.

---

 ## 1. Imports Não Utilizados

 ### Problema
 Imports de módulos que não existem ou não exportam o membro especificado.

 ### Exemplo de Erro
 ```
 Type error: Module '"drizzle-orm"' has no exported member 'limit'.
 ```

 ### Como Evitar
 - **NUNCA** importar funções que serão usadas apenas como métodos chaining (`.limit()`, `.orderBy()`, etc.)
 - Esses métodos já estão disponíveis no objeto retornado pelo builder de queries
 - Sempre remova imports não utilizados antes de fazer commit
 - Ao adicionar um novo import, verificar se ele realmente existe no módulo

 ### Exemplos Corretos
 ```typescript
 // ERRADO - limit não existe em drizzle-orm
 import { eq, and, desc, limit } from "drizzle-orm"

 // CORRETO - só importa o que realmente precisa
 import { eq, and, desc } from "drizzle-orm"
 ```

 ---

 ## 2. Tipos em Arrow Functions (Parâmetro Implicit Any)

 ### Problema
 Arrow functions dentro de JSX/TSX que usam `.map()` sem tipar o parâmetro causam erro em strict mode.

 ### Exemplo de Erro
 ```
 Type error: Parameter 'f' implicitly has an 'any' type.
 Type error: Parameter 't' implicitly has an 'any' type.
 ```

 ### Como Evitar
 - **SEMPRE** tipar os parâmetros em arrow functions dentro de maps
 - Usar `: string` ou o tipo adequado para o parâmetro

 ### Exemplos Corretos
 ```typescript
 // ERRADO
 briefing.requisitosTecnicos.tipoFibra.map(f => TIPO_FIBRA_LABELS[f] || f)

 // CORRETO
 briefing.requisitosTecnicos.tipoFibra.map((f: string) => TIPO_FIBRA_LABELS[f] || f)

 // ERRADO
 segmentos.map(s => SEGMENTOS_LABELS[s] || s)

 // CORRETO
 segmentos.map((s: string) => SEGMENTOS_LABELS[s] || s)
 ```

 ### Onde Procurar
 Buscar por todos os `.map(` no código e verificar se os parâmetros estão tipados, especialmente:
 - Dentro de JSX/TSX
 - Em render functions
 - Em qualquer lugar que o TypeScript não conseguir inferir o tipo

 ---

 ## 3. Warnings de ESLint em useEffect

 ### Problema
 O ESLint detecta dependências faltantes em useEffect, causando warning que pode virar erro em alguns setups.

 ### Exemplo de Erro
 ```
 Warning: React Hook useEffect has missing dependencies: 'router' and 'setValue'.
 ```

 ### Como Evitar
 - **PREFERÊVEL**: Incluir todas as dependências necessárias no array de dependências
 - **SE NÃO FOR POSSÍVEL**: Usar comentário para desabilitar o warning específico

 ### Opção 1: Incluir todas dependências (Recomendado)
 ```typescript
 useEffect(() => {
   // código que usa setValue
 }, [setValue]) // incluir setValue
 ```

 ### Opção 2: Desabilitar o warning (Quando necessário)
 ```typescript
 useEffect(() => {
   // código
   // eslint-disable-next-line react-hooks/exhaustive-deps
 }, [id]) // só o id é necessário, router causa re-renders infinitos
 ```

 ### Quando Usar Option 2
 - Quando `router` é usado mas causa re-renders infinitos (objeto instável)
 - Quando `setValue` muda a cada render mas não deveria acionar o efeito
 - Quando você tem certeza que o efeito só deve rodar em mudanças do ID

 ---

 ## 4. Tipos de Colunas no Drizzle ORM

 ### Problema
 O Drizzle ORM não aceita todos os tipos do PostgreSQL da mesma forma que outras ORMs. Alguns tipos precisam de tratamento especial.

 ### Tipos Numéricos

 **ERRADO**: Usar `decimal`
 ```typescript
 import { pgTable, serial, decimal } from "drizzle-orm/pg-core"

 // NÃO FUNCIONA - causa erro de tipo
 resistencia: decimal("resistencia", { precision: 10, scale: 2 })
 ```

 **CORRETO**: Usar `numeric`
 ```typescript
 import { pgTable, serial, numeric } from "drizzle-orm/pg-core"

 // FUNCIONA
 resistencia: numeric("resistencia", { precision: 10, scale: 2 })
 ```

 ### Inserção de Valores Numéricos

 O Drizzle não aceita `number` diretamente para colunas `numeric`. Você deve passar como string ou usar `.sql()`.

 **ERRADO**: Converter para number
 ```typescript
 resistencia: body.resistencia ? parseFloat(body.resistencia) : null
 ```

 **CORRETO**: Passar como string
 ```typescript
 resistencia: body.resistencia || null
 ```

 ### Campos de Texto

 Sempre verificar se o import está presente:
 ```typescript
 // Needed for text columns
 import { pgTable, serial, text } from "drizzle-orm/pg-core"
 ```

 ---

 ## 5. Formulários com Campos Numéricos

 ### Problema
 Input type="number" retorna string no React Hook Form, mas o schema Zod pode expecting number.

 ### Solução
 Para campos que são salvos como numeric no banco, usar input tipo texto:
 ```tsx
 // ERRADO - retorna number que causa erro no Drizzle
 <Input type="number" {...register("resistencia")} />

 // CORRETO - retorna string que o Drizzle aceita
 <Input type="text" placeholder="Ex: 350.00" {...register("resistencia")} />
 ```

 ---

 ## 6. Ícones do lucide-react

 ### Problema
 Nem todos os ícones disponíveis no seu IDE existem no pacote lucide-react. O build falha com "is not exported".

 ### Exemplos de Erro
 ```
 Attempted import error: 'Thread' is not exported from 'lucide-react'
 Type error: Module '"lucide-react"' has no exported member 'Thread_Cutter'
 Type error: Module '"lucide-react"' has no exported member 'Bobbin'
 ```

 ### Como Evitar
 - **NUNCA** assumir que um ícone existe sem verificar
 - Usar apenas ícones conhecidos do lucide-react:
   - `Building2`, `Package`, `Settings`, `Users`, `Search`, `Plus`, `Trash2`, `Pencil`, `Loader2`, `ArrowLeft`, `Check`, `X`, `Home`, `Factory`, `Calendar`, `FileText`, `Download`, `Upload`, `Save`, `Edit`, `Eye`, `EyeOff`, `PlusCircle`, `MoreVertical`
 - Se precisar de um ícone específico, verificar primeiro na documentação do lucide-react ou usar um ícone genérico

 ### Exemplos Corretos
 ```typescript
 // ERRADO - Thread não existe
 import { Thread, Building2 } from "lucide-react"
 icon: Thread

 // CORRETO - usar Package ou outro ícone disponível
 import { Package, Building2 } from "lucide-react"
 icon: Package
 ```

 ---

 ## 7. Campos em Schemas vs APIs

 ### Problema
 Quando você remove um campo do schema do banco (ex: remover coluna `fornecedor` da tabela `fios`), as APIs que tentam inserir/atualizar esse campo falham no build porque o tipo não corresponde.

 ### Exemplo de Erro
 ```
 Type error: Object literal may only specify known properties, and 'fornecedor' does not exist in type...
 ```

 ### Como Evitar
 - Ao remover uma coluna do schema, remover对应的 INSERT/UPDATE nas APIs
 - Sempre verificar se os campos enviados no body correspondem às colunas definidas no schema
 - Schema está em: `src/lib/db/schema/*.ts`
 - APIs estão em: `src/app/api/*/route.ts`

 ### Exemplo de Correção
 ```typescript
 // schema.ts - coluna removida
 // export const fios = pgTable("fios", {
 //   ...
 //   // fornecedor removido
 // })

 // route.ts - também remover
 .values({
   resistencia: body.resistencia || null,
   alongamento: body.alongamento || null,
   // fornecedor removido
   observacoes: body.observacoes || null,
 })
 ```

 ---

 ## 8. Interfaces TypeScript vs API Response

 ### Problema
 O frontend define uma interface para dados da API, mas pode estar faltando campos que a API retorna. O TypeScript não reclama, mas na hora de usar o campo pode dar erro em runtime ou no build.

 ### Exemplo de Erro
 ```
 Type error: Property 'ativo' does not exist on type 'Fornecedor'.
 ```

 ### Como Evitar
 - Ao criar interfaces para dados de API, incluir campos opcionais (`?`) para flexibilidade
 - Verificar se todos os campos que a API retorna estão na interface
 - Campos como `ativo`, `createdAt`, `updatedAt` frequentemente são esquecidos

 ### Exemplo de Correção
 ```typescript
 // ERRADO - faltando campo ativo
 interface Fornecedor {
   id: number
   nome: string
   cnpj?: string
 }

 // CORRETO - incluir campo ativo
 interface Fornecedor {
   id: number
   nome: string
   cnpj?: string
   ativo?: boolean
 }
 ```

 ---

 ## 9. Landing Page com Animação Canvas

 ### Estrutura da Página Raiz

 A página inicial (`/`) deve ser a landing page, não redirecionar para login diretamente.

 ### Criando Animação de Fundo

 Para criar animações abstratas (tipo matrix/tear):
 - Usar `<canvas>` com `useRef` e `useEffect`
 - Preferir "use client" para usar hooks do React
 - Manter código simples para evitar complexidade desnecessária

 ### Exemplo: Animação de Tear

 ```typescript
 "use client"

 import { useEffect, useRef, useState } from "react"

 export default function LandingPage() {
   const canvasRef = useRef<HTMLCanvasElement>(null)

   useEffect(() => {
     const canvas = canvasRef.current
     if (!canvas) return

     const ctx = canvas.getContext("2d")
     if (!ctx) return

     // Configurar canvas
     canvas.width = window.innerWidth
     canvas.height = window.innerHeight

     // Desenhar animação no requestAnimationFrame
     const draw = () => {
       // Limpar canvas
       ctx.fillStyle = "#0a0a0f"
       ctx.fillRect(0, 0, canvas.width, canvas.height)

       // Desenhar fios verticais e horizontais
       // Usar Math.sin/cos para animações
     }

     draw()
   }, [])

   return (
     <div className="relative min-h-screen">
       <canvas ref={canvasRef} className="absolute inset-0 z-0" />
       <div className="relative z-10">...</div>
     </div>
   )
 }
 ```

 ### Tooltip com Balão

 Para implementar tooltip que aparece ao passar mouse:
 - Usar state `useState(false)` para contrôler visibilidad
 - `onMouseEnter` e `onMouseLeave` no elemento pai
 - Posicionar com `absolute bottom-full` para aparecer acima

 ```tsx
 <div className="relative inline-block">
   <h1 onMouseEnter={() => setShowTooltip(true)}
       onMouseLeave={() => setShowTooltip(false)}>
     PDM Pro Moda Têxtil
   </h1>
   {showTooltip && (
     <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 px-4 py-3 bg-slate-900/90 border border-slate-700 text-white text-sm rounded-lg max-w-md">
       {PDM_TOOLTIP}
     </div>
   )}
 </div>
 ```

 ---

 ## 10. Criando Módulo de Cadastros com Índice

 ### Estrutura de Arquivos

 Para adicionar um novo módulo de cadastros:

 1. **Criar página índice** em `src/app/(dashboard)/cadastros/page.tsx`
 2. **Criar páginas de lista e formulário** em subdiretórios
 3. **Atualizar sidebar** para apontar para `/cadastros` ao invés de página específica

 ### Página Índice de Cadastros

 ```tsx
 import Link from "next/link"
 import { Package, Building2, Users } from "lucide-react"

 const modulos = [
   { titulo: "Fios", descricao: "Cadastro de fios têxteis", href: "/cadastros/fios", icon: Package },
   { titulo: "Fornecedores", descricao: "Cadastro de fornecedores", href: "/cadastros/fornecedores", icon: Building2 },
   { titulo: "Clientes", descricao: "Cadastro de clientes", href: "/comercial/clientes", icon: Users },
 ]

 export default function CadastrosPage() {
   return (
     <div className="space-y-6">
       <h1>Cadastros</h1>
       <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
         {modulos.map(modulo => (
           <Link key={modulo.href} href={modulo.href} className="...">
             <modulo.icon />
             <h2>{modulo.titulo}</h2>
             <p>{modulo.descricao}</p>
           </Link>
         ))}
       </div>
     </div>
   )
 }
 ```

 ---

 ## 11. Relacionamento N:N entre Fios e Fornecedores

 ### Schema Drizzle

 Para criar relação muitos-para-muitos:

 ```typescript
 // Tabela principal
 export const fios = pgTable("fios", { ... })

 // Tabela de fornecedores
 export const fornecedores = pgTable("fornecedores", { ... })

 // Tabela de junção (N:N)
 export const fiosFornecedores = pgTable("fios_fornecedores", {
   id: serial("id").primaryKey(),
   fioId: integer("fio_id").references(() => fios.id).onDelete("CASCADE"),
   fornecedorId: integer("fornecedor_id").references(() => fornecedores.id).onDelete("CASCADE"),
   codigoFornecedor: varchar("codigo_fornecedor", { length: 50 }),
   observacoes: text("observacoes"),
   createdAt: timestamp("created_at").defaultNow(),
 })
 ```

 ### API para Gerenciar Relacionamento

 ```typescript
 // GET - listar fornecedores de um fio
 // POST - adicionar fornecedor ao fio
 // DELETE - remover fornecedor do fio

 export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
   const resultado = await db
     .select({
       id: fiosFornecedores.id,
       fornecedorNome: fornecedores.nome,
     })
     .from(fiosFornecedores)
     .leftJoin(fornecedores, eq(fiosFornecedores.fornecedorId, fornecedores.id))
     .where(eq(fiosFornecedores.fioId, parseInt(id)))

   return NextResponse.json(resultado)
 }
 ```

 ### Formulário de Fio com Fornecedores

 A seção de fornecedores só aparece em modo edição (fio existente):
 - Ao criar novo fio, redirecionar para página de edição após salvar
 - Na página de edição, permitir adicionar/remover fornecedores

 ```typescript
 // Após criar novo fio
 const novoFio = await res.json()
 if (!isEditing) {
   router.push(`/cadastros/fios/${novoFio.id}`)
 }
 ```

 ---

 ## 12. Padrão Simples (Sem Zod/RHF)

 ### Problema
 Zod com React Hook Form pode causar complexidade desnecessária em cadastros simples.

 ### Solução
 Usar padrão simples:
 - Sem Zod - usar validação manual com JS
 - Sem RHF - usar `useState` puro
 - submit com fetch API

 ### Exemplo
 ```typescript
 const [dados, setDados] = useState({ nome: "", cnpj: "" })
 const [erros, setErros] = useState({})

 function validar() {
   const novosErros = {}
   if (!dados.nome.trim()) novosErros.nome = "Nome é obrigatório"
   if (!dados.cnpj.trim()) novosErros.cnpj = "CNPJ é obrigatório"
   setErros(novosErros)
   return Object.keys(novosErros).length === 0
 }

 async function handleSubmit(e) {
   e.preventDefault()
   if (!validar()) return
   
   const res = await fetch("/api/fornecedores", {
     method: "POST",
     body: JSON.stringify(dados),
   })
   
   if (res.ok) router.push("/cadastros/fornecedores")
 }
 ```

 ---

 ## 13. Validação Zod com z.coerce.boolean

 ### Problema
 Checkbox retorna string "on" ao invés de boolean, causando erro em validação Zod.

 ### Solução
 Usar `z.coerce.boolean()` para converter automaticamente.

 ```typescript
 const schema = z.object({
   ativo: z.coerce.boolean(),
   opcional: z.string().optional(),
 })
 ```

 ---

 ## 14. Toast Duration Curto

 ### Problema
 Toast太快 desaparece, usuário não consegue ler.

 ### Solução
 Duração de 1 segundo muito curta. Usar 3-5 segundos.

 ```typescript
 toast.success("Fornecedor criado!", { duration: 3000 })
 toast.error("Erro ao salvar", { duration: 5000 })
 ```

 ---

 ## 15. CSS Modo Escuro

 ### Problema
 Componentes com background conditional não funcionam bem no modo escuro.

 ### Solução
 Usar classes Tailwind com suporte a dark mode:
 ```tsx
 <div className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100">
 ```

 ---

 ## 16. Modal para Criar Entidade

 ### Problema
 Ao adicionar fornecedor a um fio, não tinha como criar novo fornecedor.

 ### Solução
 Criar modal inline com formulário simples:
 ```tsx
 <Dialog open={showModal} onOpenChange={setShowModal}>
   <DialogContent>
     <DialogTitle>Criar Fornecedor</DialogTitle>
     <form onSubmit={handleSubmit}>
       <Input label="Nome" value={nome} onChange={e => setNome(e.target.value)} />
       <Button type="submit">Salvar</Button>
     </form>
   </DialogContent>
 </Dialog>
 ```

 ---

 ## 17. Rota DELETE Separada

 ### Problema
 DELETE com body não funciona bem em alguns setups.

 ### Solução
 Criar rota DELETE separada para operações específicas:
 ```
 /api/fios/[id]/fornecedores/[fornecedorId]/route.ts
 ```

 ```typescript
 // ERRADO
 DELETE /api/fios/route.ts com body { fioId, fornecedorId }

 // CORRETO
 DELETE /api/fios/[fioId]/fornecedores/[fornecedorId]/route.ts
 ```

 ---

 ## 18. Type Error no Catch da API

 ### Problema
 Erro em catch pode causar type error se não for tratado.

 ### Solução
 Usar erro como unknown e fazer type guard:
 ```typescript
 } catch (erro) {
   const mensagem = erro instanceof Error ? erro.message : "Erro desconhecido"
   return NextResponse.json({ error: mensagem }, { status: 500 })
 }
 ```

 ---

 ## 19. Debug com Console Log

 ### Problema
 Dificuldade de debugar comportamento em produção.

 ### Solução
 Adicionar logs no submit e na API:
 ```typescript
 // No submit
 console.log("[FiosSubmit] Dados:", dados)

 // Na API
 console.log("[FiosAPI] Body:", body)
 ```

 ---

 ## Checklist Antes de Commit

 1. **Verificar imports**: Execute uma busca por imports novos e confirme que existem
 2. **Verificar tipos em maps**: Procure todos os `.map(` e certifique-se que os parâmetros estão tipados
 3. **Verificar useEffect**: Se adicionou useEffect, verifique as dependências
 4. **Verificar ícones**: Ícones do lucide-react existem? Use nomes conhecidos
 5. **Verificar schema vs API**: Campos que existem no schema correspondem aos campos enviados na API?
 6. **Teste local**: Execute `npm run build` ou `npm run lint` localmente antes de fazer push

 ---

 ## Comandos Úteis para Debug

 ```bash
 # Verificar erros de lint
 npm run lint

 # Verificar erros de build
 npm run build

 # Verificar tipos sem build completo
 npx tsc --noEmit

 # Verificar erros em arquivo específico
 npx tsc --noEmit src/app/api/dashboard/atividades/route.ts
 ```

 ---

 ## Histórico de Erros

 | Data | Erro | Solução |
 |------|------|---------|
 | 06/05/2026 | `limit` não existe em drizzle-orm | Remover import não utilizado |
 | 06/05/2026 | `Parameter 'f' implicitly has an 'any' type` | Adicionar tipagem `: string` |
 | 06/05/2026 | `Parameter 't' implicitly has an 'any' type` | Adicionar tipagem `: string` |
 | 06/05/2026 | `React Hook useEffect has missing dependencies` | Adicionar eslint-disable ou corrigir dependências |
 | 06/05/2026 | `decimal` não é tipo válido no Drizzle | Usar `numeric` ao invés de `decimal` |
 | 06/05/2026 | `Type 'number | null' is not assignable to type...` (numeric) | Usar string para campos numeric no Drizzle |
 | 06/05/2026 | `Cannot find name 'text'` | Adicionar import de `text` do drizzle-orm/pg-core |
 | 06/05/2026 | `'Thread' is not exported` | Usar Package ao invés de Thread |
 | 06/05/2026 | `Module has no exported member 'Bobbin'` | Usar Package ao invés de Bobbin |
 | 06/05/2026 | `'fornecedor' does not exist in type` | Remover campo fornecedor das APIs (schema não tem mais) |
 | 06/05/2026 | `Property 'ativo' does not exist on type 'Fornecedor'` | Adicionar campo ativo na interface |

 ---

 ## Histórico de Atualizações

 | Data | Alteração |
 |------|-----------|
| 17/05/2026 | Adicionadas sessões 5-10 no histórico + documentação da refatoração produtos químicos |
| 13/05/2026 | Adicionadas seções 35-43 sobre importação CSV/JSON, validação duplicados, UI |
| 07/05/2026 | Consolidados arquivos 009 e 009_009 em um único arquivo |
| 06/05/2026 | Adicionadas seções 9-11 sobre landing page, módulos de cadastros e relacionamentos N:N |
| 06/05/2026 | Adicionados aprendizados sobre ícones lucide-react (Thread, Bobbin, Package) |
| 06/05/2026 | Adicionado aprendizado sobre campos em schemas vs APIs (fornecedor obsoleto) |
| 06/05/2026 | Adicionado aprendizado sobre interfaces TypeScript vs API Response (ativo) |

---

## Histórico de Sessões do Projeto

### Sessão 1: Inicialização do Projeto (05/05/2026)

**Agente:** opencode/minimax-m2.5-free
**Status:** Em andamento

#### Contextualização

O usuário solicitou que fossem lidos todos os arquivos da pasta .agent/skills e que todas as ações fossem registradas no arquivo sessions.md para criar um histórico das sessões.

#### Ações Realizadas

1. Leitura completa da pasta .agent/ com 15 arquivos de todas as subpastas
2. Verificação do histórico de commits com últimos 20 commits analisados
3. Análise dos campos do briefing em src/types/briefing.ts

#### Problemas Identificados

- Campos "projeto" e "prazoDesejado" não estavam salvando corretamente no banco
- Verificação needed de todos os campos do briefing no JSON

---

### Sessão 2: Correções de Formulário (05/05/2026)

#### Alterações Realizadas

1. **Campos adicionados no formulário de briefing:**
   - tipoFibra - seleção de fibras
   - outrasPerformances - texto livre
   - lavabilidadeCores - texto livre

2. **Correções na página de edição:**
   - Adicionado toast de aviso quando a solicitação tem links anexados

3. **Correções na página de visualização:**
   - Adicionado staleTime: 0 para garantir dados sempre atualizados

#### Commits Realizados
- fdcbbe7 docs: atualiza commits.md com correção de sincronização em tempo real
- 9c9e735 fix: sincroniza comercialData com RHF em tempo real
- 09810f9 fix: adiciona fallback para prazoDesejado no payload
- cb65571 fix: refatora PUT com mapeamento explícito de campos

---

### Sessão 3: Correção de Build (06/05/2026)

#### Problema
Build falhando com erro de sintaxe JSX: "Unexpected token `<`"

#### Causa Identificada
Duplicação da declaração useForm no arquivo BriefingTecelagemForm.tsx

#### Correção Aplicada
Removida a segunda declaração duplicada, consolidada em uma única chamada com getValues

---

### Sessão 4: Consolidação de Arquivos (07/05/2026)

#### Ações Realizadas
1. Consolidados arquivos de aprendizado (009 e 009_009)
2. Consolidados arquivos de prompts
3. Criado arquivo prompts.md unificado

---

### Sessão 5: Dashboard Dados Reais + Cadastros Base (05-07/05/2026)

**Agente:** opencode/minimax-m2.5-free
**Status:** Completo

#### Ações Realizadas
1. Dashboard passa a consumir dados reais do banco
2. CRUD completo de Fios, Fornecedores, Cores, Estampas, Bases de Urdume
3. Relação N:N Fios-Fornecedores com tabela de junção
4. Landing page com animação canvas de tear e tooltip
5. Adoção de padrão simples (sem Zod/RHF) para formulários de cadastro
6. Script de migration manual via Node.js (devido a PowerShell restrito)

---

### Sessão 6: idIntegracao + Importação CSV/JSON (07-08/05/2026)

**Agente:** opencode/minimax-m2.5-free
**Status:** Completo

#### Ações Realizadas
1. Campo `idIntegracao` adicionado em todas as tabelas (varchar 100)
2. API de migração manual via Node.js/postgres driver
3. Importação CSV/JSON em massa para todos os cadastros
4. Componentes modais `ImportarX.tsx` para cada entidade
5. Validação de duplicados (campos únicos + idIntegracao + CNPJ)
6. Logs de debug no servidor para troubleshooting na Vercel

---

### Sessão 7: Módulo Produto Cru (09-13/05/2026)

**Agente:** opencode/minimax-m2.5-free
**Status:** Completo

#### Ações Realizadas
1. Schema completo de Produto Cru (7 tabelas)
2. Páginas de cadastro com formulário completo
3. Seletor de status nas amostras (tecido cru e acabamento)
4. Motivo obrigatório ao aprovar/reprovar amostras com restrição por role
5. Vinculação de produtos cru na solicitação
6. Correções de JSX e Drizzle type inference

---

### Sessão 8: Notificações, Email e Admin (13/05/2026)

**Agente:** opencode/minimax-m2.5-free
**Status:** Completo

#### Ações Realizadas
1. Sistema de notificações intra-sistema via polling
2. Sino no header com badge de não lidas
3. Configuração SMTP no admin
4. Disparo de email em massa
5. Gerenciamento de usuários e roles (CRUD completo)
6. Correção nodemailer@7 para compatibilidade com @auth/core

---

### Sessão 9: Produtos Químicos + Receitas de Beneficiamento (13-17/05/2026)

**Agente:** opencode/minimax-m2.5-free
**Status:** Completo

#### Ações Realizadas
1. Schema e CRUD de `produtos_quimicos` com idIntegracao
2. API de importação CSV/JSON para produtos químicos
3. Schema `produto_cru_receita` e `produto_cru_receita_item`
4. Modal `ReceitaDialog` para criar/editar receitas por amostra
5. Correções de build Vercel: Next.js 14.2.0, Drizzle type inference, JSX

---

### Sessão 10: Refatoração Produtos Químicos (17/05/2026)

**Agente:** opencode/big-pickle (atual)
**Status:** Completo

#### Ações Realizadas
1. Criado componente `ImportarProdutosQuimicos.tsx` seguindo o padrão de `ImportarFios.tsx`
2. Substituído botão import inline por modal-componente com upload de arquivo e feedback visual
3. Reescrita da página de listagem de produtos químicos para usar `useQuery` e estilo idêntico ao de fios (tabela com ações, busca, dark mode)
4. Adicionado Delete com confirmação e toast
5. Commit e push para main

---

## Referências

 - [Drizzle ORM - PostgreSQL Types](https://orm.drizzle.team/docs/column-types/pg)
 - [Drizzle - Numeric/Decimal](https://orm.drizzle.team/docs/kit-docs/sql)
 - [Lucide React - Icons](https://lucide.dev/icons/)
 - [Zod.coerce](https://zod.dev/v3/api#coerce)
 - [TanStack Table - Modo Escuro](https://tanstack.com/table/latest/docs/framework/react/examples/dark-mode)

---

## Seção 25: Análise e Decisões de Design

### Tópico 25.1: Skills do Projeto

#### Arquivos de Skills Identificados
1. **001_project_overview.md** - Documentação técnica e funcional completa do sistema
2. **002_skill_pdmprotextil_01.md** - Skill principal de implementação da Sprint 1 (MVP)
3. **003_skill_commit.md** - Protocolo de desenvolvimento incremental com 67 blocos
4. **004_neon_connectionstring.md** - Diretrizes para conexão dinâmica de banco de dados
5. **005_system_screens.md** - Layouts em design ASCII de todas as telas

### Tópico 25.2: Decisão de Design - Campo Cliente

#### Contexto
O campo Cliente na solicitação era texto livre (varchar), não um cadastro rela cional.

#### Justificativa
Para o MVP, texto livre é mais simples e rápido de implementar.

| Aspecto | MVP (Texto Livre) | Com Cadastro |
|---------|------------------|--------------|
| Criar solicitação | Digita o nome | Busca/seleciona |
| Consistência | Pode variar (typo) | Padronizado |
| Histórico por cliente | Busca por texto | FK relacional |
| Complexidade | Baixa | Alta |
| Tempo | Zero | +1 sprint |

#### Quando Adicionar Cadastro de Clientes
- Sistema tiver mais de ~50 clientes
- Necessitar relatórios por cliente
- Necessitar histórico de solicitações por cliente

### Tópico 25.3: Problemas Técnicos Observados

#### Problema 1: Lockdown Install
```
SES Removing unpermitted intrinsics
```
- Origem: Biblioteca de React em modo de produção
- Solução: Não afetar o funcionamento

#### Problema 2: Deprecated Export
```
[DEPRECATED] Default export is deprecated. Instead use `import { create } from 'zustand'`.
```
- Origem: Zustand store
- Ação: Atualizar import no código

#### Problema 3: Failed to Load Resource 404
```
Failed to load resource: the server responded with a status of 404 ()
```
- Origem: Rota não encontrada
- Ação: Verificar existência da rota

#### Problema 4: Campo Cliente Obrigatório
O Cliente estava sendo requerido mesmo quando preenchido.
- Causa: Problema de validação no formulário
- Solução: Verificar name do campo no register()

---

## Seção 26: Plano de Implementação do Sistema

### Tópico 26.1: MVP (Sprint 1) - 15 Blocos

| Bloco | Nome | Descrição | Estimativa |
|------|------|-----------|------------|
| 1.1 | Setup Inicial | Estrutura Next.js, dependências, Tailwind | 30 min |
| 1.2 | Banco de Dados | Schemas Drizzle, conexão, migrations | 30 min |
| 1.3 | Autenticação | Login, middleware, rotas protegidas | 30 min |
| 1.4 | Nova Solicitação | Dados comerciais (primeiro passo) | 20 min |
| 1.5 | Briefing (8 seções) | Formulário completo com validações | 45 min |
| 1.6 | Upload de Arquivos | Drag-drop e links externos | 30 min |
| 1.7 | API de Solicitações | CRUD RESTful | 30 min |
| 1.8 | Integração Form-API | Front-end com API | 20 min |
| 1.9 | Lista de Solicitações | Tabela com filtros | 30 min |
| 1.10 | Detalhe da Solicitação | Abas e histórico | 30 min |
| 1.11 | Dashboard Principal | Cards e métricas | 20 min |
| 1.12 | Tecelagem/Beneficiamento | Vistas por departamento | 30 min |
| 1.13 | Status e Comentários | Chat e transição | 30 min |
| 1.14 | Correções Finais | Polimento e testes | 30 min |
| 1.15 | Deploy Vercel | Domínio e variáveis | 20 min |

**Total MVP:** ~7,5 horas

### Tópico 26.2: Pós-MVP (Sprints 2-6) - 52 Blocos

| Sprint | Blocos | Descrição |
|--------|--------|-----------|
| Sprint 2 | 12 | Cadastros Base: Fios, Bases, Produtos químicos, Operações, Cores, Gerador de códigos Systêxtil |
| Sprint 3 | 10 | Produtos: Fichas Técnicas (Cru e Beneficiado), Fluxo hierárquico, Aprovações |
| Sprint 4 | 12 | Receitas: Tinturaria, Estamparia, Termofixação, Roteiros de Produção |
| Sprint 5 | 10 | PCP: Amostra e Produção, Validação de estoque, Relatórios Systêxtil |
| Sprint 6 | 8 | Testes E2E, Unitários, Documentação, Launch final |

### Tópico 26.3: fluxo de Desenvolvimento incremental

#### Protocolo de Pausas
1. Implementar bloco na íntegra
2. Gerar mensagem de commit pronta
3. Pausar aguardando confirmação
4. Ao receber aprovação, continuar para próximo блок

#### Caso de Erros
1. Analisar erros relatados
2. Corrigir e aplicar nova solução
3. Aguardar nova aprovação

---

## Seção 27: Compreensão do Sistema

### 27.1: Visão Geral
O PDM Pro Têxtil é um sistema web para gestão de desenvolvimento de produtos têxteis, conectando os departamentos Comercial, Tecelagem, Beneficiamento e PCP.

### 27.2: Substituição de Fluxos Antigos
O sistema substitui fluxos baseados em e-mail e planilhas por plataforma centralizada.

### 27.3: Funcionalidades Principais
- Briefing estruturado de desenvolvimento
- Acompanhamento de status
- Fichas técnicas (cru e beneficiados)
- Roteiros de produção
- Geração de códigos Systêxtil

### 27.4: Stack Tecnológica
- Next.js 14 (App Router)
- TypeScript
- Tailwind CSS + shadcn/ui
- Drizzle ORM + Neon PostgreSQL
- NextAuth.js
- react-hook-form + Zod
- TanStack Query & Table
- Vercel + Vercel Blob

---

## Seção 28: Campo de Integração entre Sistemas

### Tópico 28.1: Definição do Campo idIntegracao

Para permitir integração futura com outros sistemas (ERP, CRM, WMS), todos os cadastros devem ter um campo `idIntegracao`.

#### Estrutura do Campo
```typescript
idIntegracao: varchar("id_integracao", { length: 100 })
```
-Tipo: String
- Tamanho: 100 caracteres
- Obrigatório: Não (campo opcional)
- Finalidade: Contain a chave primária do sistema externo (ERP, CRM, WMS, etc)

#### Regras de Uso
1. Campo não é obrigatório
2. Usado para vincular cadastros locais com sistemas externos
3. Permite carga de dados bidirectional
4. Cada sistema externo terá seu próprio ID salvo neste campo
5. Todos os novos cadastros devem seguir esta estrutura

### Tópico 28.2: Tabelas Atualizadas

| Tabela | Campo Adicionado |
|--------|---------------|
| fornecedores | idIntegracao |
| fios | idIntegracao |
| fios_fornecedores | idIntegracao |
| bases_urdume | idIntegracao |
| cores_solidas | idIntegracao |
| cores_fundo | idIntegracao |
| estampas | idIntegracao |
| clientes | idIntegracao |
| usuarios | idIntegracao |
| maquinas | idIntegracao |
| operacoes | idIntegracao |
| solicitacoes | idIntegracao |
| anexos | idIntegracao |
| acabamentos | idIntegracao |

### Tópico 28.3: Exemplo de Uso

```typescript
// Ao sincronizar com ERP Systêxtil
const newFio = await db.insert(fios).values({
  codigoCompleto: "FI0001",
  nome: "Fio Algodão",
  idIntegracao: "12345", // ID do Systêxtil
})

// Ao buscar por ID externo
const fio = await db.query.fios.findFirst({
  where: eq(fios.idIntegracao, "12345")
})
```

---

## Seção 29: Problemas com Migration Drizzle

### Tópico 29.1: Migration CREATE TABLE vs ALTER TABLE

O comando `drizzle-kit generate` criou migration com `CREATE TABLE` ao invés de `ALTER TABLE`, o que sobrescreu as tabelas e apagou os dados.

#### Solução: Executar SQL manualmente no Neon

```sql
-- Executar no Neon SQL Editor
ALTER TABLE fornecedores ADD COLUMN IF NOT EXISTS "id_integracao" varchar(100);
ALTER TABLE fios ADD COLUMN IF NOT EXISTS "id_integracao" varchar(100);
ALTER TABLE fios_fornecedores ADD COLUMN IF NOT EXISTS "id_integracao" varchar(100);
ALTER TABLE bases_urdume ADD COLUMN IF NOT EXISTS "id_integracao" varchar(100);
ALTER TABLE cores_solidas ADD COLUMN IF NOT EXISTS "id_integracao" varchar(100);
ALTER TABLE cores_fundo ADD COLUMN IF NOT EXISTS "id_integracao" varchar(100);
ALTER TABLE estampas ADD COLUMN IF NOT EXISTS "id_integracao" varchar(100);
ALTER TABLE clientes ADD COLUMN IF NOT EXISTS "id_integracao" varchar(100);
ALTER TABLE maquinas ADD COLUMN IF NOT EXISTS "id_integracao" varchar(100);
ALTER TABLE operacoes ADD COLUMN IF NOT EXISTS "id_integracao" varchar(100);
ALTER TABLE acabamentos ADD COLUMN IF NOT EXISTS "id_integracao" varchar(100);
ALTER TABLE solicitacoes ADD COLUMN IF NOT EXISTS "id_integracao" varchar(100);
ALTER TABLE anexos ADD COLUMN IF NOT EXISTS "id_integracao" varchar(100);
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS "id_integracao" varchar(100);
```

### Tópico 29.2: Script SQL Pronto

O arquivo `src/lib/db/migrations/0003_add_id_integracao_colunas.sql` contém o script pronto para execução no Neon.

### Tópico 29.3: Dados Perdidos

Os dados dos cadastros foram perdidos devido à migration incorreta. Os dados precisarão ser recadastrados ou restaurados de backup.

---

## Seção 30: Aprendizados de Migration no Neon

### Tópico 30.1: String de Conexão do Neon

A connection string do Neon deve sempre conter `-pooler` no hostname:

```bash
# ❌ Errado - Sem pooler
ep-delicate-dew-acaz6kqb.sa-east-1.aws.neon.tech

# ✅ Correto - Com pooler
ep-delicate-dew-acaz6kqb-pooler.sa-east-1.aws.neon.tech
```

**Por quê?**
- Sem o pooler, a migration pode timeout após 30 segundos
- Pode estourar limite de conexões (Neon free tier = 20 conexões)
- Pode falhar no cold start do compute

### Tópico 30.2: Comandos para Migrate no Neon

```bash
# Usando DATABASE_URL com pooler
DATABASE_URL="postgresql://neondb_owner:TOKEN@ep-xxx-pooler.sa-east-1.aws.neon.tech/dbname?sslmode=require" npx drizzle-kit migrate

# Usando .env local
source .env && npx drizzle-kit migrate
```

### Tópico 30.3: Script de Migration Node.js

Para rodar migration via Node.js (quando npx não funciona):

```javascript
const postgres = require("postgres")
require("dotenv").config({ path: ".env.local" })

async function migration() {
  const sql = postgres(process.env.DATABASE_URL)
  
  for (const table of tables) {
    await sql`ALTER TABLE ${sql(table)} ADD COLUMN IF NOT EXISTS id_integracao varchar(100)`.execute()
  }
  
  await sql.end()
}
```

### Tópico 30.4: Problemas com Drizzle Generate

O `drizzle-kit generate` pode criar migration com `CREATE TABLE` ao invés de `ALTER TABLE` se não existir snapshot anterior.

**Solução:**
1. Usar SQL manual com `IF NOT EXISTS`
2. Usar API de migration no Next.js
3. Usar script Node.js com driver postgres

### Tópico 30.5: Driver postgres vs neon

- **postgres** (driver): Funciona como tagged template e suporta queries normais
- **neon** (driver): Só funciona como tagged template, não suporta `.execute()` normal

```javascript
// ❌ neon como função normal
await sql("ALTER TABLE...")

// ✅ postgres como normal
await sql`ALTER TABLE...`.execute()
```

---

## Seção 31: Estrutura do Sistema PDM Pro Têxtil

### Tópico 31.1: Módulos do Sistema

| Módulo | Rota | Descrição |
|--------|-----|----------|
| Comercial | /comercial/solicitacoes | Solicitações de desenvolvimento |
| Cadastros | /cadastros/* | Fios, Fornecedores, Bases, Cores, Estampas |
| Dashboard | /dashboard | Métricas e atividades |

### Tópico 31.2: Tabelas do Banco

| Tabela | Arquivo Schema | Campos Principais |
|--------|-------------|-------------|
| usuarios | usuarios.ts | email, name, role |
| solicitacoes | solicitacoes.ts | tipo, status, cliente, briefing |
| fios | fios.ts | codigoFio, nome, composicao |
| fornecedores | fios.ts | nome, cnpj, razaoSocial |
| bases_urdume | bases-urdume.ts | codigoBase, nome |
| cores_solidas | cores.ts | codigo, nome, pantone |
| estampas | estampas.ts | codigoDesenho, nome |
| clientes | clientes.ts | nome, cnpj |
| anexos | anexos.ts | titulo, url |
| maquinas | maqoper.ts | codigo, nome |
| operacoes | maqoper.ts | codigo, nome |

### Tópico 31.3: APIs de Cadastros

```
/api/cadastros/fios           - GET, POST
/api/cadastros/fios/[id]      - GET, PUT, DELETE
/api/cadastros/fornecedores  - GET, POST
/api/cadastros/fornecedores/[id] - GET, PUT, DELETE
/api/cadastros/bases-urdume  - GET, POST
/api/cadastros/cores       - GET, POST
/api/cadastros/estampas    - GET, POST
```

### Tópico 31.4: Campo idIntegracao

**Estrutura:**
```typescript
idIntegracao: varchar("id_integracao", { length: 100 })
```

**Finalidade:** Vincular cadastros com sistemas externos (ERP, CRM, WMS)

**Regras:**
- Campo opcional (não obrigatório)
- Usado para carga de dados bidirecional
- Cada sistema externo tem seu próprio ID neste campo

### Tópico 30.5: Dificuldades e Soluções

#### Problema 1: PowerShell Restrito (.ps1 não assinado)
- **Sintoma:** "O arquivo npm.ps1 não pode ser carregado" / "não é reconhecido como nome de cmdlet"
- **Causa:** Windows com políticas de segurança bloqueando scripts .ps1
- **Tentativas falhadas:** npx drizzle-kit push, npx tsx, npm install
- **Solução:** Criar script Node.js (.cjs) usando require()

#### Problema 2: Módulos TypeScript (.ts)
- **Sintoma:** "Cannot find module './lib/db'" ou "./src/lib/db"
- **Causa:** Node.js não consegue resolver caminhos relativos de arquivos TypeScript
- **Tentativas falhadas:** caminhos relativos, path.resolve, __dirname
- **Solução:** Usar driver postgres diretamente com require("postgres")

#### Problema 3: neon vs postgres (driver)
- **Sintoma:** "This function can now be called only as a tagged-template"
- **Causa:** Driver neon só funciona como tagged template
- **Tentativas falhadas:** sql("SELECT..."), sql.select()
- **Solução:** Usar driver postgres com tagged template + .execute()
```javascript
const postgres = require("postgres")
const sql = postgres(process.env.DATABASE_URL)
await sql`ALTER TABLE ${sql(table)} ADD COLUMN IF NOT EXISTS id_integracao varchar(100)`.execute()
```

#### Problema 4: drizzle-kit generate
- **Sintoma:** Migration cria CREATE TABLE, sobrescreve tabelas e perde dados
- **Causa:** Não tinha snapshot do estado anterior do banco
- **Solução:** Script manual com IF NOT EXISTS
```sql
ALTER TABLE fornecedores ADD COLUMN IF NOT EXISTS "id_integracao" varchar(100);
```

#### Problema 5: psql não instalado
- **Sintoma:** "psql não é reconhecido"
- **Causa:** PostgreSQL client não instalado no sistema
- **Solução:** Usar driver postgres via Node.js

---

**Solução Final que Funcionou:**
```javascript
require("dotenv").config({ path: ".env.local" })
const postgres = require("postgres")

async function migration() {
  const sql = postgres(process.env.DATABASE_URL)
  const tables = ["fornecedores", "fios", "fios_fornecedores", ...]
  
  for (const table of tables) {
    await sql`ALTER TABLE ${sql(table)} ADD COLUMN IF NOT EXISTS id_integracao varchar(100)`.execute()
    console.log("OK: " + table)
  }
  
  await sql.end()
}

migration().then(() => process.exit(0))
```

### Nome do Projeto
PDM Pro Têxtil - Sistema de Gestão de Desenvolvimento de Produtos Têxteis

### Domínio de Produção
pdmprotextil.vercel.app

### Stack Tecnológico
- Next.js 14 (App Router)
- TypeScript
- Drizzle ORM + Neon PostgreSQL
- NextAuth.js
- Tailwind CSS + shadcn/ui
- Vercel (hospedagem)

### Estrutura do Projeto
- Pasta raiz: pdmtextil
- Skills disponíveis: .agent/skills/
- Histórico de sessões: .agent/sessions/

### Módulos do Sistema

| Módulo | Status | Descrição |
|--------|--------|-----------|
| Autenticação NextAuth | Completo | Login com NextAuth |
| Solicitações MVP | Completo | CRUD completo |
| Briefings (8 seções) | Completo | Formulário de briefing |
| Cadastros | Em Andamento | Fios, Fornecedores, Bases |
| Dashboard dados reais | Completo | Dados do banco |
| Landing Page | Completo | Página inicial com animação |

---

## Seção 20: Fluxo de Desenvolvimento do Projeto

### Fase 1: Inicialização
Estabelecimento de comunicação inicial com o agente de IA, definições de regras e estrutura do projeto.

### Fase 2: Correções de Build (05/05/2026)
Correção de estados faltantes, tipos não carregando, campos de formulário não salvando, loops infinitos.

### Fase 3: Análise e Correções (06/05/2026)
Correção de ciclo de re-renders infinitos, implementação de exportação PDF, ajustes de layout.

### Fase 4: Análise Completa (07/05/2026)
Leitura completa da estrutura, comparação com commits git, análise do estado atual.

### Fase 5: Consolidação (07/05/2026)
Unificação de arquivos de aprendizado e prompts em único arquivo.

---

## Seção 21: Regras de Desenvolvimento

### Regras Principais
1. O agente não deve iniciar nenhum código sem aprovação prévia do usuário
2. O agente deve seguir uma ordem estabelecida de blocos de implementação
3. O agente deve registrar todas as sessões no arquivo de aprendizado
4. O agente deve reescrever prompts em português formal ao salvar

### Regras de Arquivo
1. Sempre consolidar arquivos similares em único arquivo
2.Sempre registrar erros e soluções no histórico
3. Todo novo aprendizado deve ser adicionado ao arquivo principal
4. Remover arquivos antigos após consolidação

---

## Seção 22: Commits Importantes do Projeto

| Data | Commit | Descrição |
|------|--------|-----------|
| 06/05/2026 | eea23bb | Autenticação NextAuth |
| 06/05/2026 | 51d6705 a f662a22 | Layout + Solicitação |
| 06/05/2026 | 7377793 | API + Lista |
| 07/05/2026 | 96afe63 | Módulo fornecedores |
| 07/05/2026 | 374a1c5 | Dashboard dados reais |
| 07/05/2026 | 4582d13 | Landing page tooltip |
| 08/05/2026 | 0c67ca0 | Importação CSV/JSON em massa |
| 08/05/2026 | 51cc67a | idIntegracao em todos CRUDs |
| 09/05/2026 | 4f2a067 | Módulo Produto Cru |
| 13/05/2026 | fbd87a7 | Notificações + Email + Admin |
| 13/05/2026 | 4c7b333 | Receitas + Produtos Químicos |
| 17/05/2026 | 53b6aa3 | Refatoração página produtos químicos |

---

## Seção 23: Estrutura da Landing Page

### Componentes Criados
1. Animação canvas com fios verticais e horizontais
2. Tooltip que aparece ao passar mouse acima do título
3. Significado completo do PDM

### Código da Animação Canvas
Ver Seção 9 deste arquivo.

### Código do Tooltip
Ver Seção 9 deste arquivo.

---

## Seção 24: Estrutura de Cadastros

### Módulos de Cadastro Implementados
1. Fios - Cadastro de fios têxteis com resistência e alongamento
2. Fornecedores - Cadastro de fornecedores com CNPJ
3. Bases de Urdume - Cadastro de bases
4. Cores Sólidas - Cadastro de cores
5. Estampas - Cadastro de estampas

### Estrutura de Arquivos
Ver Seção 10 deste arquivo.

### Relacionamento N:N Fios-Fornecedores
Ver Seção 11 deste arquivo.

---

**Última atualização:** 09/05/2026
**Versão:** 2.1 (Aprendizado Crítico Adicionado)
**Total de seções:** 32

---

## Seção 32: Operação Drástica no Repositório - APOSTAR NUNCA FAZER

### Tópico 32.1: O Que Aconteceu (09/05/2026)

O agente de IA (opencode/minimax-m2.5-free) executou uma operação que **apagou todo o conteúdo da pasta .agent/** do repositório local e **apagou todos os arquivos do repositório GitHub remoto**, deixando apenas 2 arquivos no remote.

### Impacto

1. **Perda de trabalho:** Uma semana de trabalho (skills, aprendizados, documentação) foi perdida
2. **Recuperação necessária:** O usuário precisou recuperar do último commit válido
3. **Repositório remoto divergido:** Remote ficou 123 commits atrás do local
4. **Força bruta requerida:** Foi necessário `git push --force` para sincronizar

### Tópico 32.2: Lições Aprendidas

#### REGRA 1: NUNCA Apagar Pastas Inteiras
- **ANTES** de apagar qualquer arquivo/pasta, perguntar ao usuário
- **EXCEÇÃO:** Apenas se o usuário explicitamente solicitar e confirmar
- **VERIFICAÇÃO:** Listar o que será afetado antes de qualquer exclusão

#### REGRA 2: Nunca Fazer Operações Destrutivas sem Confirmação
Operações destrutivas incluem:
- `git rm -rf`
- `rm -rf`
- `git push --force`
- DELETE em tabelas do banco
- DROP TABLE
- Qualquer comando que não pode ser desfeito facilmente

#### REGRA 3: Sempre Fazer Backup Antes de Operações Grandes
Antes de qualquer operação que afete múltiplos arquivos:
1. Verificar estado atual com `git status`
2. Verificar diferenças com `git diff`
3. Verificar histórico com `git log`
4. Confirmar com usuário antes de prosseguir

#### REGRA 4: Regra dos 3 "Você Tem Certeza?"
Se a ação:
1. Vai apagar mais de 1 arquivo
2. Vai afetar o histórico do git
3. É irreversível

Então **PARAR** e perguntar ao usuário pelo menos 3 vezes.

### Tópico 32.3: Protocolo de Emergência

Se algo der errado:

1. **Não entrar em pânico**
2. **Verificar** `git status` para ver o que mudou
3. **Recuperar** do último commit válido:
   ```bash
   git log --oneline -10
   git reset --hard <commit_valido>
   ```
4. **Sincronizar** remote se necessário:
   ```bash
   git push --force origin main
   ```

### Tópico 32.4: Comandos de Verificação (SEMPRE Executar Antes)

```bash
# Ver estado atual
git status

# Ver diferenças não commitadas
git diff

# Ver últimos commits
git log --oneline -5

# Listar arquivos que serão afetados
ls -la
```

### Tópico 32.5: Responsabilidade do Agente

O agente DEVE:
- [ ] Perguntar antes de operações destrutivas
- [ ] Listar o que será afetado
- [ ] Explicar o risco da operação
- [ ] Aguardar confirmação explícita
- [ ] Parar e pedir ajuda se não tiver certeza

O agente NÃO DEVE:
- [ ] Apagar pastas inteiras sem perguntar
- [ ] Fazer `git push --force` sem autorização
- [ ] Executar comandos destrutivos automaticamente
- [ ] Assumir que o usuário quer prosseguir

### Tópico 32.6: Aviso para Futuras Sessões

**⚠️ AVISO CRÍTICO:** Esta sessão foi marcada após uma falha grave onde o agente apagou todo o trabalho de uma semana. Em todas as sessões futuras, o agente DEVE:

1. **LER este arquivo de aprendizado ANTES de qualquer ação destrutiva**
2. **NUNCA apagar a pasta .agent/** - ela contém skills e configurações essenciais
3. **SEMPRE perguntar** antes de fazer qualquer exclusão
4. **Usar o protocolo de confirmação** para operações de risco

### Tópico 32.7: Recuperação do Desastre

**Data do incidente:** 09/05/2026

**O que foi perdido:**
- Pasta .agent/ completa (recuperada do último commit)
- Histórico de sessões anterior
- Skills personalizados

**O que foi feito para recuperar:**
1. Identificado último commit válido: `46d5d6db`
2. Resetado para esse commit
3. Sincronizado com remote via force push
4. Recriados os skills manualmente

**Comando usado para sincronizar:**
```bash
git push --force origin main
```

---

## Seção 33: Padrão de Commits do Projeto

### Tópico 33.1: Prefixos de Commit

| Prefixo | Uso |
|---------|-----|
| `feat:` | Nova funcionalidade |
| `fix:` | Correção de bug |
| `docs:` | Documentação |
| `refactor:` | Refatoração |
| `style:` | Estilo (CSS, formatação) |
| `perf:` | Performance |
| `test:` | Testes |
| `chore:` | Tarefas diversas |

### Tópico 33.2: Como Fazer Commit

1. Sempre verificar `git status` antes
2. Usar `git add` para arquivos específicos (evitar `git add .`)
3. Escrever mensagem descritiva
4. push após cada commit (ou agrupar commits relacionados)

---

## Seção 34: Implementação de Importação CSV/JSON (PDM Pro Têxtil)

### Tópico 34.1: Problema do camelCase vs lowercase

O CSV gerado pelo modelo usa camelCase nos cabeçalhos:
```
codigoFio;nome;nomeComercial;...
```

Mas quando o JavaScript faz `.toLowerCase()`, eles se tornam:
```
codigofio;nome;nomecomercial;...
```

Isso causa erro na validação porque `item.codigoFio` é undefined (existe só `item.codigofio`).

#### Solução: Mapa de Conversão

```typescript
const campoMap: Record<string, keyof FioImport> = {
  codigofio: "codigoFio",
  nome: "nome",
  nomecomercial: "nomeComercial",
  composicao: "composicao",
  titulo: "titulo",
  torcao: "torcao",
  resistencia: "resistencia",
  alongamento: "alongamento",
  idintegracao: "idIntegracao",
  ativo: "ativo",
}

function parseCSV(texto: string): FioImport[] {
  // ... código ...
  
  for (let j = 0; j < cabecalhoLower.length; j++) {
    const campoOriginal = cabecalhoLower[j]
    const campoNormalizado = campoMap[campoOriginal]
    const valor = valores[j]
    
    if (campoNormalizado && valor !== undefined && valor.length > 0) {
      (item as any)[campoNormalizado] = valor
    }
  }
}
```

### Tópico 34.2: Estrutura de Importação de Fios

#### Arquivos Criados:

| Arquivo | Descrição |
|---------|-----------|
| `api/cadastros/fios/modelo/route.ts` | Baixa modelo CSV ou JSON |
| `api/cadastros/fios/importar/route.ts` | Processa arquivo CSV/JSON |
| `components/importar/ImportarFios.tsx` | Modal de importação com UI |
| `cadastros/fios/page.tsx` | Adicionado botão "Importar" |

#### API Modelo (`/api/cadastros/fios/modelo`)

**GET** com parâmetro `formato=csv` ou `formato=json`

Retorna arquivo CSV com separador `;` (padrão brasileiro):
```csv
codigoFio;nome;nomeComercial;composicao;titulo;torcao;resistencia;alongamento;idIntegracao;ativo
AL20;Fio Algodão 20/1;Fio Premium;100% Algodão;20/1;Z;120.50;8.5;SYS001;true
```

#### API Importar (`/api/cadastros/fios/importar`)

**POST** com `FormData` contendo arquivo

Aceita CSV e JSON, detecta separador automaticamente (`;` ou `,`).

Retorna:
```json
{
  "success": true,
  "mensagem": "1 de 1 registros importados",
  "total": 1,
  "importados": 1,
  "erros": []
}
```

### Tópico 34.3: Componente ImportarFios

**Localização:** `src/components/importar/ImportarFios.tsx`

**Funcionalidades:**
1. Modal com botões para baixar modelos (CSV e JSON)
2. Upload de arquivo (drag & drop ou clique)
3. Preview do arquivo selecionado
4. Feedback visual do resultado (importados/erros)
5. Callback `onImportado` para atualizar lista

**Interface:**
```typescript
interface ResultadoImport {
  total: number
  importados: number
  erros: { linha: number; erro: string }[]
}
```

### Tópico 34.4: Parsing CSV Robusto

#### Regras de Implementação

1. **Normalizar line endings:** `texto.replace(/\r\n/g, "\n").replace(/\r/g, "\n")`
2. **Detectar separador:** Se texto contém `;`, usar `;` senão `,`
3. **Mapeamento de campos:** Sempre usar mapa para converter lowercase → camelCase
4. **Filtrar linhas vazias:** `.filter(l => l.trim())`
5. **Tratar valores undefined:** Verificar `valor !== undefined && valor.length > 0`

```typescript
function parseCSV(texto: string): FioImport[] {
  const textoNormalizado = texto.replace(/\r\n/g, "\n").replace(/\r/g, "\n")
  const linhas = textoNormalizado.split("\n").filter(l => l.trim())
  
  const separador = texto.includes(";") ? ";" : ","
  const cabecalho = linhas[0].split(separador).map(c => c.trim().toLowerCase())
  
  const dados: FioImport[] = []
  
  for (let i = 1; i < linhas.length; i++) {
    const valores = linhas[i].split(separador).map(v => v.trim())
    const item: FioImport = {}
    
    for (let j = 0; j < cabecalho.length; j++) {
      const campoNormalizado = campoMap[cabecalho[j]]
      const valor = valores[j]
      if (campoNormalizado && valor !== undefined && valor.length > 0) {
        (item as any)[campoNormalizado] = valor
      }
    }
    
    if (item.codigoFio || item.nome) {
      dados.push(item)
    }
  }
  
  return dados
}
```

### Tópico 34.5: Validação e Importação

```typescript
for (let i = 0; i < registros.length; i++) {
  const reg = registros[i]

  // Verificar campos obrigatórios
  if (!reg.codigoFio || !reg.nome) {
    resultados.erros.push({ linha: i + 2, erro: "Código e Nome são obrigatórios" })
    continue
  }

  // Verificar duplicado
  const existente = await db
    .select()
    .from(fios)
    .where(eq(fios.codigoFio, reg.codigoFio!))
    .limit(1)

  if (existente[0]) {
    resultados.erros.push({ linha: i + 2, erro: `Fio com código ${reg.codigoFio} já existe` })
    continue
  }

  // Inserir
  await db.insert(fios).values({
    codigoCompleto: `7.${reg.codigoFio}.XXX.000001`,
    codigoFio: reg.codigoFio!,
    nome: reg.nome!,
    // ... outros campos
  })

  resultados.importados++
}
```

### Tópico 34.6: Debugging de Importação

#### Logs no Browser (Cliente)

```typescript
const handleFileChange = async (e) => {
  const file = e.target.files?.[0]
  if (file) {
    console.log("[ImportarFios] Arquivo selecionado:", file.name, file.size)
    
    const texto = await file.text()
    console.log("[ImportarFios] Conteúdo:", texto.substring(0, 500))
  }
}

const handleImportar = async () => {
  const res = await fetch("/api/cadastros/fios/importar", {
    method: "POST",
    body: formData,
  })
  
  const dados = await res.json()
  console.log("[ImportarFios] Resposta:", dados)
}
```

#### Logs no Servidor (API)

```typescript
function parseCSV(texto: string): FioImport[] {
  console.log("[parseCSV] Total de linhas:", linhas.length)
  console.log("[parseCSV] Separador:", JSON.stringify(separador))
  console.log("[parseCSV] Cabeçalho:", cabecalho)
  
  for (let i = 1; i < linhas.length; i++) {
    console.log(`[parseCSV] Linha ${i + 1} (raw):`, JSON.stringify(linha))
    console.log(`[parseCSV] Item ${i + 1}:`, item)
  }
}
```

---

## Seção 35: Aprendizados de Desenvolvimento - PDM Pro Têxtil

### Tópico 35.1: Lições da Sessão

| Problema | Causa | Solução |
|----------|-------|---------|
| Importação retornava 0 registros | camelCase vs lowercase | Mapa de conversão campoMap |
| Line endings Windows não funcionavam | `\r\n` não tratado | Regex `/\r?\n/` para split |
| Logs no servidor essenciais | Console do browser não mostrava API | Adicionar logs no servidor |

### Tópico 35.2: Regras para Implementações Futuras

1. **Sempre mapear campos** quando o CSV usa camelCase:
   ```typescript
   const campoMap = { campominusculo: "campoMinusculo" }
   ```

2. **Normalizar line endings** antes de fazer split:
   ```typescript
   texto.replace(/\r\n/g, "\n").replace(/\r/g, "\n")
   ```

3. **Adicionar logs tanto no cliente quanto no servidor** para debugar problemas

4. **Separador CSV padrão brasileiro** é `;` (não `,`)

5. **Interface de importação deve incluir**:
   - Botões para baixar modelos (CSV e JSON)
   - Upload de arquivo
   - Preview do arquivo selecionado
   - Feedback de resultado (importados/erros)

### Tópico 35.3: Checklist para Implementar Importação

- [ ] Criar API modelo (`/api/cadastros/[entidade]/modelo`)
  - [ ] GET com parâmetro `formato=csv` ou `formato=json`
  - [ ] Retornar CSV com `;` como separador
  - [ ] Incluir exemplo preenchido

- [ ] Criar API importar (`/api/cadastros/[entidade]/importar`)
  - [ ] POST com FormData
  - [ ] Parser CSV com mapa de campos
  - [ ] Parser JSON
  - [ ] Validação de duplicados
  - [ ] Retornar resultados com erros por linha

- [ ] Criar componente `ImportarX.tsx`
  - [ ] Modal com botões CSV/JSON
  - [ ] Upload de arquivo
  - [ ] Feedback visual

- [ ] Adicionar botão na página da lista

---

## Seção 36: Campo idIntegracao - Implementação Completa

### Tópico 36.1: Schema - Campo idIntegracao

Todas as tabelas devem ter o campo `idIntegracao`:
```typescript
idIntegracao: varchar("id_integracao", { length: 100 })
```

**Tabela do Learning:**
```
fornecedores     ✅
fios             ✅
fios_fornecedores ✅
bases_urdume     ✅
cores_solidas    ✅
cores_fundo      ✅
estampas         ✅
acabamentos      ✅
clientes         ✅
maquinas         ✅
operacoes        ✅
solicitacoes     ✅
```

### Tópico 36.2: Label Genérico

O label deve ser **genérico** para permitir integração com qualquer sistema:
```
ID Integração (ERP/WMS/CRM/OUTROS)
```

**NÃO usar** referências específicas como `(ERP/Systêxtil)`.

### Tópico 36.3: Arquivos que Precisam Ser Modificados

Para cada cadastro, modificar:

1. **Schema:** ✅ Já tem `idIntegracao` no banco
2. **TypeScript type:** Adicionar ao tipo
3. **useState inicial:** Adicionar ao estado
4. **useEffect carregamento:** Carregar do dados
5. **Input no formulário:** Adicionar campo
6. **API POST:** Adicionar `idIntegracao: body.idIntegracao || null`
7. **API PUT:** Adicionar `idIntegracao: body.idIntegracao || null`

### Tópico 36.4: Cadastros com idIntegracao Implementado

| Cadastro | Formulário | API POST | API PUT |
|----------|------------|----------|---------|
| Fios | ✅ | ✅ | ✅ |
| Fornecedores | ✅ | ✅ | ✅ |
| Cores | ✅ | ✅ | ✅ |
| Estampas | ✅ | ✅ | ✅ |
| Bases de Urdume | ✅ | ✅ | ✅ |
| Clientes | ✅ | ✅ | ✅ |

---

**Última atualização:** 13/05/2026
**Versão:** 2.2 (Importação CSV/JSON + idIntegracao)
**Total de seções:** 36

---

## Seção 37: Implementação Completa de Importação CSV/JSON em Massa

### Tópico 37.1: Visão Geral da Implementação

Esta sessão implementou importação em massa via CSV/JSON para todos os cadastros do sistema PDM Pro Têxtil.

**Cadastros implementados:**
- Fios ✅
- Fornecedores ✅
- Clientes ✅
- Cores ✅
- Estampas ✅
- Bases de Urdume ✅

### Tópico 37.2: Arquitetura de Arquivos

Para cada cadastro, a estrutura de arquivos segue este padrão:

```
src/app/api/cadastros/[entidade]/
├── modelo/route.ts       # Download do modelo CSV/JSON
├── importar/route.ts     # Processamento do arquivo
└── [id]/route.ts         # CRUD (GET, PUT, DELETE)

src/app/(dashboard)/cadastros/[entidade]/
└── page.tsx              # Lista com botão "Importar"

src/components/importar/
└── Importar[Entidade].tsx # Modal de importação UI
```

### Tópico 37.3: API Modelo (Download)

**Arquivo:** `src/app/api/cadastros/[entidade]/modelo/route.ts`

**Funcionalidades:**
- GET com parâmetro `formato=csv` ou `formato=json`
- Retorna CSV com separador `;` (padrão brasileiro)
- Inclui linha de exemplo preenchida
- Valida sessão do usuário

**Exemplo de resposta CSV:**
```csv
codigoFio;nome;nomeComercial;composicao;ativo
AL20;Fio Algodão 20/1;Fio Premium;100% Algodão;true
```

**Exemplo de resposta JSON:**
```json
{
  "modelo": "Fios",
  "versao": "1.0",
  "separador": ";",
  "campos": [...],
  "exemplo": [...]
}
```

---

## Seção 38: Problema Crítico - camelCase vs lowercase no CSV

### Tópico 38.1: O Problema

O CSV gerado pelo modelo usa camelCase nos cabeçalhos:
```
codigoFio;nome;nomeComercial;...
```

Mas quando o JavaScript faz `.toLowerCase()`, eles se tornam:
```
codigofio;nome;nomecomercial;...
```

Isso causa erro na validação porque `item.codigoFio` é undefined.

### Tópico 38.2: Solução - Mapa de Conversão (campoMap)

```typescript
const campoMap: Record<string, keyof EntidadeImport> = {
  // key lowercase do CSV → value camelCase do TypeScript
  codigofio: "codigoFio",
  nome: "nome",
  nomecomercial: "nomeComercial",
  composicao: "composicao",
  idintegracao: "idIntegracao",
  ativo: "ativo",
}
```

**Regras importantes:**
1. Sempre criar o mapa mesmo para campos simples
2. Mapear TODOS os campos do CSV
3. Usar nomes lowercase no mapa, camelCase na interface

### Tópico 38.3: Código Completo do parseCSV

```typescript
function parseCSV(texto: string): EntidadeImport[] {
  // 1. Normalizar line endings (Windows)
  const textoNormalizado = texto.replace(/\r\n/g, "\n").replace(/\r/g, "\n")
  const linhas = textoNormalizado.split("\n").filter(l => l.trim())

  console.log("[parseCSV] Total de linhas:", linhas.length)

  if (linhas.length < 2) {
    console.log("[parseCSV] Linhas insuficientes:", linhas.length)
    return []
  }

  // 2. Detectar separador
  const separador = texto.includes(";") ? ";" : ","
  const primeiraLinha = linhas[0]
  const cabecalhoLower = primeiraLinha.split(separador).map(c => c.trim().toLowerCase())

  const dados: EntidadeImport[] = []

  // 3. Iterar sobre as linhas
  for (let i = 1; i < linhas.length; i++) {
    const linha = linhas[i]
    if (!linha.trim()) continue

    const valores = linha.split(separador).map(v => v.trim())
    const item: EntidadeImport = {}

    // 4. Mapear campos usando campoMap
    for (let j = 0; j < cabecalhoLower.length; j++) {
      const campoOriginal = cabecalhoLower[j]
      const campoNormalizado = campoMap[campoOriginal]
      const valor = valores[j]

      if (campoNormalizado && valor !== undefined && valor.length > 0) {
        (item as any)[campoNormalizado] = valor
      }
    }

    console.log(`[parseCSV] Item ${i + 1}:`, item)

    // 5. Filtrar registros válidos
    if (item.campoObrigatorio) {
      dados.push(item)
    }
  }

  console.log("[parseCSV] Total de registros:", dados.length)
  return dados
}
```

---

## Seção 39: Validação de Duplicados

### Tópico 39.1: Campos que Precisam Ser Únicos

Cada tabela pode ter diferentes campos únicos:

| Cadastro | Campos Únicos |
|----------|--------------|
| Fios | `codigoFio`, `idIntegracao` |
| Fornecedores | `nome`, `cnpj`, `idIntegracao` |
| Clientes | `cnpj`, `idIntegracao` |
| Cores | `codigo`, `idIntegracao` |
| Estampas | `codigoDesenho`, `idIntegracao` |
| Bases Urdume | `codigoBase`, `codigoCompleto`, `idIntegracao` |

### Tópico 39.2: Validação na Importação

**Regra:** Verificar TODOS os campos únicos ANTES de inserir.

```typescript
// Para cada registro na importação
for (let i = 0; i < registros.length; i++) {
  const reg = registros[i]

  // 1. Verificar campo único 1
  if (reg.campoUnico) {
    const existente1 = await db
      .select()
      .from(tabela)
      .where(eq(tabela.campoUnico, reg.campoUnico))
      .limit(1)

    if (existente1[0]) {
      resultados.erros.push({
        linha: i + 2,
        erro: `Campo ${reg.campoUnico} já existe`
      })
      continue
    }
  }

  // 2. Verificar idIntegracao (se fornecido)
  if (reg.idIntegracao) {
    const existenteIdInt = await db
      .select()
      .from(tabela)
      .where(eq(tabela.idIntegracao, reg.idIntegracao))
      .limit(1)

    if (existenteIdInt[0]) {
      resultados.erros.push({
        linha: i + 2,
        erro: `ID Integração ${reg.idIntegracao} já existe`
      })
      continue
    }
  }

  // 3. Inserir se passou em todas as validações
  await db.insert(tabela).values({ ... })
  resultados.importados++
}
```

### Tópico 39.3: Validação no UPDATE

**Regra:** Verificar duplicados IGNORANDO o registro atual.

```typescript
export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const body = await req.json()

  // CNPJ duplicado?
  if (body.cnpj) {
    const cnpjLimpo = body.cnpj.replace(/\D/g, "")
    const existenteCNPJ = await db
      .select()
      .from(fornecedores)
      .where(eq(fornecedores.cnpj, cnpjLimpo))
      .limit(1)

    // IGNORAR o registro atual (id !== parseInt(id))
    if (existenteCNPJ[0] && existenteCNPJ[0].id !== parseInt(id)) {
      return NextResponse.json(
        { error: "CNPJ já cadastrado em outro fornecedor" },
        { status: 409 }
      )
    }
  }

  // idIntegracao duplicado?
  if (body.idIntegracao) {
    const existenteIdInt = await db
      .select()
      .from(fornecedores)
      .where(eq(fornecedores.idIntegracao, body.idIntegracao))
      .limit(1)

    if (existenteIdInt[0] && existenteIdInt[0].id !== parseInt(id)) {
      return NextResponse.json(
        { error: "ID Integração já cadastrado em outro fornecedor" },
        { status: 409 }
      )
    }
  }

  // Executar update...
}
```

### Tópico 39.4: Tratamento de Erro 409 Conflict

No catch do UPDATE, tratar erro de constraint única:

```typescript
} catch (error: any) {
  console.error("[PUT ...]", error)
  if (error.code === "23505") {
    return NextResponse.json({ error: "CNPJ já cadastrado" }, { status: 409 })
  }
  return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
}
```

---

## Seção 40: Logs de Debug para Vercel

### Tópico 40.1: Por Que Logs São Essenciais

Na Vercel, não há acesso ao console do browser. Os logs de servidor são a única forma de debugar erros de importação.

### Tópico 40.2: Logs a Adicionar nas APIs

**Na função parseCSV:**
```typescript
console.log("[parseCSV] Total de linhas:", linhas.length)
console.log("[parseCSV] Separador:", separador)
console.log(`[parseCSV] Item ${i + 1}:`, JSON.stringify(item))
console.log("[parseCSV] Total de registros:", dados.length)
```

**Na API POST:**
```typescript
console.log("[POST /api/cadastros/[entidade]/importar] Arquivo:", nomeArquivo)
console.log("[POST /api/cadastros/[entidade]/importar] Texto (primeiros 500 chars):", texto.substring(0, 500))
console.log("[POST /api/cadastros/[entidade]/importar] Resultados:", resultados)
```

**No catch:**
```typescript
console.error(`Erro na linha ${i + 2}:`, err)
```

### Tópico 40.3: Acesso aos Logs

1. Acesse https://vercel.com/dashboard
2. Selecione o projeto
3. Clique em "Logs" no menu lateral
4. Filtre por função/serverless se necessário

---

## Seção 41: Componente UI de Importação

### Tópico 41.1: Estrutura do Componente

**Arquivo:** `src/components/importar/ImportarEntidade.tsx`

**Props:**
```typescript
interface ImportarEntidadeProps {
  onImportado?: () => void
}
```

**Estado:**
```typescript
const [modalAberto, setModalAberto] = useState(false)
const [importando, setImportando] = useState(false)
const [resultado, setResultado] = useState<ResultadoImport | null>(null)
const [arquivoSelecionado, setArquivoSelecionado] = useState<File | null>(null)
```

### Tópico 41.2: ResultadoImport Interface

```typescript
interface ResultadoImport {
  total: number
  importados: number
  erros: { linha: number; erro: string }[]
}
```

### Tópico 41.3: Exibir Erros na UI

O componente DEVE exibir a lista de erros para o usuário:

```tsx
{resultado.erros.length > 0 && (
  <div className="mt-2 max-h-32 overflow-y-auto text-xs">
    {resultado.erros.slice(0, 10).map((erro, i) => (
      <p key={i} className="text-red-500">
        Linha {erro.linha}: {erro.erro}
      </p>
    ))}
    {resultado.erros.length > 10 && (
      <p className="text-slate-500 mt-1">
        ... e mais {resultado.erros.length - 10} erros
      </p>
    )}
  </div>
)}
```

### Tópico 41.4: Botão Importar na Página

Adicionar ao lado do botão "Novo":

```tsx
<div className="flex gap-2">
  <ImportarEntidade onImportado={() => refetch()} />
  <Link href="/cadastros/entidade/novo">
    <Button className="gap-2">
      <PlusCircle size={16} />
      Novo
    </Button>
  </Link>
</div>
```

---

## Seção 42: Erros Comuns e Soluções

### Tópico 42.1: TypeScript - Campos numeric/numeric

**Erro:**
```
Type 'number | null' is not assignable to type 'string | null'
```

**Solução:** Campos `numeric` no Drizzle aceitam string no banco. Não usar `parseFloat()`:

```typescript
// ERRADO
densidade: parseFloat(reg.densidade)  // retorna number

// CORRETO
densidade: reg.densidade || null  // mantém string
```

### Tópico 42.2: TypeScript - NewTypeImport

**Erro:**
```
Object literal may only specify known properties
```

**Solução:** Usar o tipo inferido do schema:

```typescript
import type { NewEntidade } from "@/lib/db/schema/entidade"

const valores: NewEntidade = {
  campo1: reg.campo1,
  campo2: reg.campo2,
  // ...
}
```

### Tópico 42.3: CNPJ com Formatação

**Problema:** CNPJ pode vir formatado (12.345.678/0001-90) ou limpo (12345678000190)

**Solução:** Limpar sempre antes de salvar:

```typescript
const cnpjLimpo = reg.cnpj.replace(/\D/g, "")

// Na validação
.where(eq(tabela.cnpj, cnpjLimpo))

// Na inserção
cnpj: cnpjLimpo,
```

### Tópico 42.4: Line Endings Windows

**Problema:** Arquivos CSV do Excel (Windows) usam `\r\n`

**Solução:** Normalizar antes do split:

```typescript
const textoNormalizado = texto.replace(/\r\n/g, "\n").replace(/\r/g, "\n")
```

---

## Seção 43: Checklist para Implementar Importação

### Tópico 43.1: Checklist Completo

- [ ] Criar `modelo/route.ts`
  - [ ] GET com parâmetro `formato=csv` e `formato=json`
  - [ ] Definir campos com exemplos
  - [ ] Criar mapa de campos (campoMap)
  - [ ] Retornar CSV com `;`

- [ ] Criar `importar/route.ts`
  - [ ] Interface de importação
  - [ ] função parseCSV com campoMap
  - [ ] função parseJSON
  - [ ] Validação de campos obrigatórios
  - [ ] Validação de TODOS os campos únicos
  - [ ] Inserção no banco
  - [ ] Tratamento de erros
  - [ ] Logs de debug

- [ ] Criar `ImportarEntidade.tsx`
  - [ ] Modal com botões CSV/JSON
  - [ ] Upload de arquivo
  - [ ] Exibir resultado com erros
  - [ ] Callback `onImportado`

- [ ] Adicionar botão na página
  - [ ] Importar ao lado de Novo
  - [ ] Passar `onImportado={() => refetch()}`

- [ ] Testar
  - [ ] Download modelo CSV
  - [ ] Importar modelo exemplo
  - [ ] Importar com erro (duplicado)
  - [ ] Verificar logs na Vercel

- [ ] Adicionar ao learning.md

---

**Última atualização:** 29/05/2026
**Versão:** 3.0 (Módulo de Integrações + Importação via API)
**Total de seções:** 45

---

## Seção 44: Progresso Atual - Snapshot da Sessão

### Tópico 44.1: Contexto da Sessão

Data: 23/05/2026

Esta sessão foi dedicada à **revisão e alinhamento** do projeto PDM Pro Têxtil. Não houve implementação de novas funcionalidades ou correções de código. O documento de aprendizado (`learning.md`) foi lido e verificado na íntegra (2371 linhas, 43 seções) para garantir que o contexto do projeto está completo e atualizado.

### Tópico 44.2: Estado Atual do Projeto (atualizado em 29/05/2026)

**Status Geral:** Funcionalidades principais implementadas e operacionais. Módulo de Integrações com APIs externas concluído.

**O que está implementado e funcionando:**
- Schema completo com +27 tabelas no Neon (Drizzle + postgres-js)
- Migrations executadas via `scripts/migrate.js` (script reativado com CREATE TABLE + ALTER TABLE)
- API CRUD para todos os cadastros (fios, fornecedores, clientes, cores, estampas, bases-urdume, produtos-químicos, produto-cru, solicitações, integrações, requisições-corte)
- Páginas de listagem e formulário para todos os cadastros
- Seção "Receitas de Beneficiamento" por amostra com versionamento e PDF
- Sistema de notificações com polling 30s + admin de regras por tipo
- Admin: SMTP, usuários, roles, permissões, email em massa
- Dashboard com gráficos Recharts
- Importação CSV/JSON em massa para 6 cadastros (fios, fornecedores, clientes, cores, estampas, bases-urdume)
- Importação via API para Clientes (modal com grid, checkboxes, dedup, campo de busca)
- Fluxo de solicitações completo (criar, desenvolver, aprovar produto, concluir)
- Controle de permissões por role (COMERCIAL, DESENVOLVIMENTO, ADMIN, SUDO)
- Sistema de logs e notificações de erro para SUDO
- Ficha Técnica como JSONB em produto-cru
- Links (JSONB) em produtos-cru, amostras, acabamentos, fios
- Dark mode padrão obrigatório
- Módulo de Integrações completo (cadastro, autenticação OAuth2/Basic/Bearer/API Key, teste, mapeamento de campos)
- Requisições de Corte (header + itens) com dashboard e indicadores
- Campo quantidadeProduzida em amostras de tecido cru e acabamento

**Próximos passos discutidos (não iniciados):**
- Novas funcionalidades (ordens de produção, agendamento, etc.)
- Melhorias de UI/UX e performance
- Correções de bugs reportados
- Verificação de build e deploy na Vercel

### Tópico 44.3: Observações Importantes

- Build local não funciona (node_modules ausentes) — build apenas na Vercel
- `scripts/migrate.js` mantido ativo com CREATE TABLE + ALTER TABLE IF NOT EXISTS — rodar localmente antes de deploy
- `learning.md` consolidado com 45 seções de aprendizado acumulado
- Próximas ações dependem de definição do usuário

---

**Fim do Documento**

---

## Seção 45: Módulo de Integrações com APIs Externas

### Tópico 45.1: Contexto e Motivação

**Data:** 28-29/05/2026

O módulo de Integrações foi criado para permitir que o PDM se conecte com sistemas externos (ERP Systêxtil, APIs, WMS) sem necessidade de desenvolvimento específico para cada integração. O usuário administrador cadastra a integração, configura a autenticação, testa a conexão, mapeia os campos do retorno da API para os campos do PDM, e utiliza a importação nas telas cadastradas.

### Tópico 45.2: Arquitetura do Módulo

O módulo é composto por quatro camadas:

| Camada | Descrição |
|--------|-----------|
| **Cadastro de Integrações** | Configuração base: nome, base_url, tipo de auth, auth_config (JSON), telas, mapping |
| **Proxy de Teste** | Endpoint server-side que monta a requisição com autenticação e executa contra a API externa |
| **Mapeamento de Campos** | Editor visual que relaciona campos do retorno da API → campos do PDM |
| **Importação via API** | Modal genérico que consome a API, exibe grid com seleção e importa com dedup |

### Tópico 45.3: Schema da Tabela integracoes

```sql
CREATE TABLE integracoes (
  id SERIAL PRIMARY KEY,
  nome VARCHAR(100) NOT NULL,
  base_url VARCHAR(500) NOT NULL,
  tipo_auth VARCHAR(30) NOT NULL DEFAULT 'bearer',
  auth_config JSON DEFAULT '{}',
  telas JSON DEFAULT '[]',
  mapping JSON DEFAULT '{}',
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `nome` | VARCHAR | Nome amigável (ex: "ERP Systêxtil") |
| `base_url` | VARCHAR | URL completa do endpoint da API |
| `tipo_auth` | VARCHAR | Enum: oauth2, basic, api_key, bearer |
| `auth_config` | JSON | Configuração de autenticação (varia por tipo) |
| `telas` | JSON | Array de telas onde a integração aparece (ex: ["clientes", "fios"]) |
| `mapping` | JSON | Objeto `{ fields: { apiField: pdmField }, uniqueKey: "apiField" }` |

### Tópico 45.4: Autenticação Suportada

Cada tipo de auth utiliza um `auth_config` JSON diferente:

**Bearer Token:**
```json
{ "token": "abc123xyz" }
```
→ Header: `Authorization: Bearer abc123xyz`

**Basic Auth:**
```json
{ "username": "admin", "password": "123456" }
```
→ Header: `Authorization: Basic base64(admin:123456)`

**API Key:**
```json
{ "key": "abc123", "key_name": "x-api-key", "in": "header" }
```
→ Header: `x-api-key: abc123` ou Query param (se `in: "query"`)

**OAuth2 Client Credentials:**
```json
{
  "grant_type": "client_credentials",
  "client_id": "xxx",
  "client_secret": "xxx",
  "token_url": "https://...",
  "scope": "read"
}
```
→ POST no `token_url` com Basic Auth (client_id:client_secret) + body `grant_type=client_credentials`
→ Usa `access_token` retornado como Bearer na requisição principal

### Tópico 45.5: Teste de Integração

O botão ▶ (Play) em cada card de integração chama o endpoint **`GET /api/admin/integracoes/[id]/testar`** que:

1. Lê a configuração do banco
2. Monta os headers de autenticação conforme `tipo_auth` + `auth_config`
3. Executa GET na `base_url` com timeout de 15s
4. Retorna: status code, tempo de resposta, response body, request headers (mascarados), request URL

**Aprendizado:** O OAuth2 da API Systêxtil exige que `client_id:client_secret` sejam enviados via **Basic Auth header** (não no body do POST). O body contém apenas `grant_type=client_credentials` (e opcionalmente `scope`).

### Tópico 45.6: Mapeamento de Campos (De-Para)

O editor visual substitui o campo JSON textarea por uma interface amigável:

1. **Botão "Carregar campos da API"** — chama o endpoint de teste, extrai os nomes dos campos do primeiro item do array `items` da resposta
2. **Tabela de mapeamento** — cada campo da API vira uma linha com dropdown ao lado para selecionar o campo PDM correspondente
3. **Chave única (dedup)** — dropdown separado para selecionar qual campo da API é o identificador único (usado para comparar com registros existentes)
4. **Auto-mapeamento** — campos com o mesmo nome (case-insensitive) são automaticamente vinculados
5. **Auto-detect uniqueKey** — tenta `idintegracao` → `cnpj` → `id`

O JSON gerado é armazenado no campo `mapping` da tabela:
```json
{
  "fields": { "nome": "nome", "cnpj": "cnpj", "idintegracao": "idIntegracao" },
  "uniqueKey": "idintegracao"
}
```

### Tópico 45.7: Fluxo de Importação via API

O modal `ImportarApiModal` é um componente genérico reutilizável localizado em `src/components/integracao/ImportarApiModal.tsx`.

**Fluxo completo:**

1. **Botão "Importar via API"** na tela de Clientes abre o modal
2. **Seleção de integração** — lista as integrações ativas configuradas para a tela "clientes"
3. **Executar** — chama o proxy de teste, recebe os dados da API
4. **Grid com checkboxes** — exibe os itens em tabela, cada linha com checkbox
5. **Dedup automático** — itens cujo `uniqueKey` já existe no PDM ficam com checkbox desabilitado e opacidade reduzida
6. **Campo de busca** — filtra os resultados da grid em tempo real (qualquer coluna)
7. **Select All** — funciona apenas sobre os itens filtrados (não inclui duplicatas)
8. **Importar** — envia os itens selecionados para a API de importação

### Tópico 45.8: API de Importação de Clientes

**`POST /api/cadastros/clientes/importar-api`**

Recebe: `{ fieldMapping, uniqueKey, items }`

Fluxo:
1. Para cada item, aplica o fieldMapping (apiField → pdmField)
2. Traduz `uniqueKey` (nome do campo da API) para o campo PDM correspondente usando o `fieldMapping`
3. Verifica duplicata por `idIntegracao` OU `cnpj` no banco
4. Se existir, incrementa contador de duplicatas e pula
5. Se não existir, faz INSERT com os campos mapeados

**Aprendizado crítico:** O `uniqueKey` armazenado no mapping é o **nome do campo da API** (ex: `idintegracao`), mas o objeto `mapped` usa **nomes de campos PDM** como chaves (ex: `idIntegracao`). É obrigatório traduzir via `fieldMapping[uniqueKey]` antes de buscar o valor. Esse bug causou "1 duplicata ignorada" para todos os itens até ser corrigido.

### Tópico 45.9: Registro do De-Para no Configurações

Na página **Configurações → Integrações**, o formulário de edição agora possui:

- **Nome** — nome da integração
- **Base URL** — URL completa do endpoint
- **Tipo de Autenticação** — seleção visual entre Bearer, Basic, API Key, OAuth2
- **Auth Config (JSON)** — textarea com botão mostrar/esconder
- **Telas** — campo texto separado por vírgula (ex: `clientes, fios`)
- **Mapeamento de Campos** — editor visual com:
  - Botão "Carregar campos da API" (requer integração salva)
  - Tabela API field → dropdown PDM field
  - Seletor de chave única

### Tópico 45.10: Estrutura de Arquivos Criados

```
src/
├── app/
│   ├── api/
│   │   └── admin/
│   │       └── integracoes/
│   │           ├── route.ts                    # CRUD (GET, POST, PUT, DELETE)
│   │           └── [id]/
│   │               └── testar/
│   │                   └── route.ts            # Proxy de teste com autenticação
│   └── (dashboard)/
│       └── admin/
│           └── configuracoes/
│               └── integracoes/
│                   └── page.tsx                # Página de gestão de integrações
├── components/
│   └── integracao/
│       └── ImportarApiModal.tsx                # Modal genérico de importação via API
└── lib/
    └── db/
        └── schema/
            ├── integracoes.ts                  # Schema Drizzle da tabela integracoes
            └── index.ts                        # Export adicionado
```

### Tópico 45.11: Próximos Passos Possíveis

- Adicionar suporte a **endpoints** (múltiplos endpoints por integração, cada um com seu path/método)
- Adicionar **logs de execução** de importações (tabela log_integracao)
- Estender importação via API para outras telas (fios, bases-urdume, etc.)
- Agendar execução automática de importações (cron)
- Suporte a mais tipos de autenticação (AWS Signature, digest, etc.)
- Mapeamento reverso (exportar dados do PDM para API externa)

---

## Seção 46: Chat Corporativo

### Tópico 46.1: Estrutura do Banco

```typescript
// chats - entidade principal
chats: pgTable("chats", {
  id, titulo, criadoPor, createdAt, updatedAt,
  entidadeTipo,  // 'SOLICITACAO' | 'PRODUTO_CRU' etc
  entidadeId,    // FK polimórfica
})

// chat_mensagens - mensagens do chat
chatMensagens: pgTable("chat_mensagens", {
  id, chatId, remetenteId, mensagem, createdAt,
})

// chat_participantes - participantes
chatParticipantes: pgTable("chat_participantes", {
  id, chatId, usuarioId, lidoAte, createdAt,
})

// chat_leituras - controle de leitura por mensagem
chatLeituras: pgTable("chat_leituras", {
  id, chatId, mensagemId, usuarioId, lidaEm,
})
```

### Tópico 46.2: API Routes

```
GET    /api/chats                    - Listar chats do usuário
POST   /api/chats                    - Criar novo chat
GET    /api/chats/[id]               - Detalhe do chat
DELETE /api/chats/[id]               - Excluir chat (owner/SUDO)
GET    /api/chats/[id]/mensagens     - Listar mensagens (com remetenteNome via JOIN usuarios)
POST   /api/chats/[id]/mensagens     - Enviar mensagem
PUT    /api/chats/[id]/ler           - Marcar mensagens como lidas (JSON body: { mensagensIds })
GET    /api/chats/entidade           - Buscar chat por entidade (?tipo=X&id=Y)
GET    /api/chats/nao-lidas          - Contagem de não lidas
```

### Tópico 46.3: Regras de Negócio

1. Chat é 1:1 com entidade (SOLICITACAO, PRODUTO_CRU etc.) — se já existe, reabre
2. Participantes são adicionados automaticamente ao criar chat com `destinatarios: "todos"`
3. Polling de mensagens a cada 3 segundos (otimizado de 10s)
4. Marcação de leitura via batch (envia array de IDs em vez de 1 por 1)
5. Chat vazio não quebra (early return em vez de JOIN em tabela vazia)
6. remetenteNome obtido via JOIN com tabela usuarios (não apenas user ID)

### Tópico 46.4: Emoji Picker

Componente inline (sem dependência externa):
- 80 emojis em grid de 16 colunas
- Insere na posição do cursor (textarea)
- Fecha ao clicar fora (onClickOutside com ref)

```tsx
const insertAtCursor = (textarea: HTMLTextAreaElement, text: string) => {
  const start = textarea.selectionStart
  const end = textarea.selectionEnd
  textarea.setRangeText(text, start, end, "end")
  // disparar evento input para React
  textarea.dispatchEvent(new Event("input", { bubbles: true }))
}
```

### Tópico 46.5: EntityChatButton

Componente reutilizável que:
1. Busca chat existente via `GET /api/chats/entidade?tipo=X&id=Y`
2. Se existir, redireciona para `/chat?chatId=N`
3. Se não existir, cria via `POST /api/chats` com entidadeTipo/entidadeId
4. Aceita props: `entidadeTipo`, `entidadeId`, `titulo`, `mensagem`, variant, size

**Uso:** `<EntityChatButton entidadeTipo="SOLICITACAO" entidadeId={sol.id} titulo="..." />`

---

## Seção 47: Dashboard com Dados Globais

### Tópico 47.1: Cards de Total

Os cards do dashboard agora mostram totais **globais** (todos os registros), não apenas do mês atual:

```typescript
// ANTES (filtrava por mês atual)
const mesAtual = new Date().toLocaleDateString("pt-BR", { month: "long" })

// DEPOIS (sem filtro de data)
const stats = await db.execute(sql`
  SELECT
    (SELECT COUNT(*) FROM solicitacoes) as total,
    (SELECT COUNT(*) FROM solicitacoes WHERE status IN ('PENDENTE','AGUARDANDO_INFO','REPROVADO','EM_PRODUCAO')) as pendentes,
    ...
`)
```

### Tópico 47.2: Comparação Mensal Corrigida

Usar `toISOString().slice(0, 7)` (YYYY-MM) em vez de `toLocaleDateString()` para evitar problemas de locale:

```typescript
// ERRADO: depende do locale
const mesKey = new Date(item.createdAt).toLocaleDateString("pt-BR", { year: "numeric", month: "long" })

// CORRETO: sempre YYYY-MM
const mesKey = new Date(item.createdAt).toISOString().slice(0, 7)
```

### Tópico 47.3: Legend Buttons (em vez de Pie onClick)

Pie chart do Recharts com Cell onClick não funcionou consistentemente. Solução: buttons clicáveis ao lado do gráfico:

```tsx
{stats.statusDistribuicao.map((item) => (
  <button key={item.status} onClick={() => handleStatusFilter(item.status)}>
    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.cor }} />
    <span>{item.label}: {item.total}</span>
  </button>
))}
```

---

## Seção 48: ERP Field em Amostras (idIntegracaoErpCru)

### Tópico 48.1: Migration

```sql
ALTER TABLE produto_cru_amostra ADD COLUMN IF NOT EXISTS id_integracao_erp_cru varchar(100);
```

### Tópico 48.2: Schema Drizzle

```typescript
idIntegracaoErpCru: varchar("id_integracao_erp_cru", { length: 100 }),
```

### Tópico 48.3: API

POST e PUT em `/api/cadastros/produto-cru/[id]/amostras` aceitam e retornam `idIntegracaoErpCru`.

---

## Seção 49: Testes com Vitest + jsdom

### Tópico 49.1: Configuração

```typescript
// vitest.config.ts
import { defineConfig } from "vitest/config"
import react from "@vitejs/plugin-react"

export default defineConfig({
  plugins: [react({ jsxRuntime: "automatic" })],
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./src/test/setup.ts"],
  },
})
```

### Tópico 49.2: Oxc JSX Parser

Vitest 4.1.7 requer configuração específica para parse .tsx. Usar `@vitejs/plugin-react` com `jsxRuntime: "automatic"` (Oxc).

### Tópico 49.3: Padrões de Teste

- Testes de validação: testar cada schema Zod individualmente (42 testes)
- Testes de componente: render + find + assert (38 testes)
- ConfirmModal: testar backdrop click, cancel, confirm callbacks
- LinksEditor: testar add/remove/edit links
- Button: testar variantes (default, outline, ghost) e disabled state

---

## Seção 50: Aprendizados Gerais (Período Recente)

### Tópico 50.1: Native `<option>` em Windows + Dark Mode

O elemento `<option>` dentro de `<select>` não aceita `background-color` no Windows. Solução: criar dropdown customizado com `<div>` e estado visível/invisível, ou usar componente shadcn `<Select>`.

### Tópico 50.2: JSON.parse/stringify para evitar referências no React

Quando modificar arrays do React (e.g. adicionar emoji ao textarea), usar `JSON.parse(JSON.stringify(...))` ou `structuredClone` para evitar mutação direta do estado.

### Tópico 50.3: COALESCE com JSONB

Para extrair campos de JSONB com fallback para coluna:
```sql
COALESCE(tabela.coluna_texto, tabela.jsonb_column->>'campo', 'default')
```

### Tópico 50.4: Drizzle SELECT explícito vs SELECT *

Quando adicionar subquery (chatExists), usar `.select({ col1: tabela.col1, ... })` em vez de `.select()` para evitar conflito de tipos com o join implícito.

### Tópico 50.5: Validar existência da migration antes de usar tabela

Erro 500 se a migration não foi executada mas o código já referencia a tabela. Sempre rodar `node scripts/migrate.js` antes de fazer deploy de código que usa novas tabelas.

---

## Seção 52: Padronização de Nomes nas Telas (26/06/2026)

### Tópico 52.1: Contexto

Para suportar futuros tipos de solicitação e amostra (ex: Amostra Comercial com produto PDM vinculado), padronizamos os nomes de todas as telas, menus, páginas e relatórios com o sufixo explícito **"de Desenvolvimento"**.

### Tópico 52.2: Nomenclatura Padrão

| Antes | Depois |
|-------|--------|
| Solicitação | Solicitação de Desenvolvimento |
| Amostra (cru/acab.) | Amostra de Desenvolvimento |
| Dashboard Solicitações | Dashboard Solicitações de Desenvolvimento |
| Dashboard Amostras | Dashboard Amostras de Desenvolvimento |
| Kanban — Solicitações | Kanban — Solicitações de Desenvolvimento |
| Kanban — Amostras | Kanban — Amostras de Desenvolvimento |
| Minhas Solicitações | Minhas Solicitações de Desenvolvimento |

### Tópico 52.3: Abrangência

**Source code (14 arquivos):**
- `search-registry.ts` — labels usados no dropdown de Telas (admin) e busca global
- `info-content/dashboard.ts` e `outros.ts` — títulos dos info buttons
- `dashboard/page.tsx` — título da página
- `dashboard/amostras/page.tsx` — título da página
- `comercial/solicitacoes/page.tsx` — título da página
- `comercial/solicitacoes/kanban/page.tsx` — título da página
- `amostras/page.tsx` — título da página
- `amostras/kanban/page.tsx` — título da página
- `kanban-standalone/page.tsx` — título da página standalone
- `kanban-amostras-standalone/page.tsx` — título da página standalone
- `page.tsx` (hub relatórios) — 6 cards renomeados
- 7 páginas de relatórios: titles e subtitles atualizados
- `mobile-bottom-nav.tsx` — labels da navegação mobile
- `seed-perfil-menus.sql` — 9 grupos de menu + itens renomeados

**Database (via script `rename-menus-desenvolvimento.cjs`):**
- `user_menu_itens` com url `/comercial/solicitacoes` → 10 itens
- `user_menu_itens` com url `/comercial/solicitacoes/nova` → 3 itens
- `user_menu_itens` com url `/amostras` → 6 itens
- `user_menu_itens` com url `/dashboard` → 11 itens (user-specific)
- `user_menu_itens` com url `/dashboard/amostras` → 11 itens (user-specific)
- `user_menu_itens` com url Kanban — Solicitações → 2 itens
- `user_menu_itens` com url Kanban — Amostras → 3 itens
- `user_menus` grupo "Solicitações" → 9 grupos
- `user_menus` grupo "Amostras" → 6 grupos

### Tópico 52.4: Scripts de Atualização

| Arquivo | Descrição |
|---------|-----------|
| `scripts/seed-perfil-menus.sql` | Seed atualizado com nomes novos |
| `scripts/rename-menus-desenvolvimento.sql` | SQL puro para UPDATE manual |
| `scripts/rename-menus-desenvolvimento.cjs` | CJS com postgres driver (funciona no Windows) |
| `scripts/rename-menus-desenvolvimento.ts` | TS with Drizzle ORM |

### Tópico 52.5: Commits

| Commit | Descrição |
|--------|-----------|
| `5089b80` | rename: relatorios com nomes explicitos (10 files) |
| `3d2a6fe` | rename: menus do sidebar, info-content e mobile-nav (5 files) |
| `d692428` | chore: scripts de rename dos menus (SQL, TS, CJS) |
| `87f7ef8` | fix: isNull no lugar de eq(null) no script TS |
| `1a9e729` | rename: Dashboard, Kanban e page titles com nomes explicitos (14 files) |

---

## Histórico de Sessões do Projeto (continuação)

### Sessão 11: Chat Corporativo + Correções (01/06/2026)

**Agente:** opencode/big-pickle
**Status:** Completo

#### Ações Realizadas
1. Módulo Chat Corporativo completo (schema, API, UI)
2. EntityChatButton reutilizável
3. Emoji picker inline
4. Correções: polling 3s, marcarLidas com JSON body, participantes array vs number
5. Custom dropdown em NovoChatDialog (dark mode fix)

#### Problemas Resolvidos
- Native select não funciona com dark mode no Windows → dropdown custom
- chatExists dava 500 (tabela não migrada) → adicionado ao migration script
- Marcar lidas sem body dava 500 → JSON body adicionado

---

### Sessão 12: Dashboard Global + Legend Buttons + ERP Field (01/06/2026)

**Agente:** opencode/big-pickle
**Status:** Completo

#### Ações Realizadas
1. Dashboard cards com totais globais
2. Legend buttons substituem Pie onClick
3. Comparação mensal YYYY-MM
4. idIntegracaoErpCru em amostras (schema, migration, API, UI)
5. EntityChatButton adicionado em solicitacoes detail + produto-cru detail
6. Chat indicator na lista de produto-cru
7. Fix rota clientes (row click 404)

---

## Referências Adicionais

- [Vitest 4.x Migration Guide](https://vitest.dev/guide/migration)
- [jsdom - JavaScript implementation of web standards](https://github.com/jsdom/jsdom)
- [Recharts PieChart Legend](https://recharts.org/en-US/api/PieChart)
- [Drizzle Subquery with sql tag](https://orm.drizzle.team/docs/sql)

---

## Seção 51: Kanban Amostras + Dashboard + Telas (26/06/2026)

### Tópico 51.1: Navegação de Cards Kanban para Produto Cru

**Problema:** Clicar em um card do kanban não fazia nada. O usuário precisava ir manualmente até o produto e achar a amostra.

**Solução:** Adicionar `onClick` com `router.push` no `DraggableAmostraCard`:

```tsx
const scrollId = amostra.tipo === "tecido_cru"
  ? `amostra-${amostra.id}`
  : `amostra-acab-${amostra.acabamentoId}-${amostra.id}`

const handleClick = () => {
  if (amostra.produtoCruId) {
    router.push(`/cadastros/produto-cru/${amostra.produtoCruId}?tab=amostras&amostraId=${scrollId}`)
  }
}
```

**Regra:** O `onClick` funciona junto com `@dnd-kit/core` `listeners` porque a constraint `distance: 5` impede que um clique simples (sem movimento) acione o drag.

### Tópico 51.2: Links e Quantidade nos Cards do Kanban

Adicionar `quantidadeProduzida` e `links` ao `AmostraCard`:

```typescript
interface AmostraCard {
  // ...campos existentes
  links?: AmostraLink[] | null
  quantidadeProduzida?: number | null
}
```

- Quantidade exibida como badge roxo com ícone `Package`
- Links exibidos ao final do card com `stopPropagation` no clique para não navegar nem arrastar
- Links abrem em nova aba (`target="_blank"`)

### Tópico 51.3: Hash `#amostras` vs Query Param `?tab=amostras`

**Problema:** Vários links usavam `#amostras` (hash) para navegar à aba de amostras do produto. O código da página de produto só lia `?tab=...` e `?amostraId=...` do `URLSearchParams`, ignorando a hash.

**Solução:** Substituir `#amostras` por `?tab=amostras` em todos os lugares:

```tsx
// ERRADO - hash não ativa a aba
router.push(`/cadastros/produto-cru/${item.produtoId}#amostras`)

// CORRETO - query param ativa a aba via useEffect
router.push(`/cadastros/produto-cru/${item.produtoId}?tab=amostras`)
```

**Regra:** Sempre usar `?tab=amostras&amostraId=...` (query params) em vez de `#amostras` (hash) para navegação interna com tabs.

### Tópico 51.4: Dashboard Modal Filtrado por Status

**Problema:** A API `/api/dashboard/amostras-lista` recebia `filtro = "status-PENDENTE"` dos cards dinâmicos, mas só tratava `"total-geral"`, `"tecido-cru"`, etc. Caía no `else` e retornava **todas** as amostras.

**Solução:** Adicionar tratamento para `status-*`:

```typescript
} else if (filtro.startsWith("status-")) {
  const statusNome = filtro.slice(7)
  whereCru = sql`AND am.status = ${statusNome}`
  whereAcab = sql`AND aam.status = ${statusNome}`
}
```

**Regra:** Parâmetros dinâmicos como `status-*` precisam ser tratados explicitamente na API.

### Tópico 51.5: searchRegistry - Lista de Telas para Criação de Menus

**Problema:** A API `/api/user/menus/todas-telas` retorna os itens do `searchRegistry`, mas faltavam muitas telas (24 de 63 páginas). Novas telas não aparecem automaticamente.

**Regras:**
1. **Não é automático** — o `searchRegistry` é manual. Toda nova tela precisa ser registrada lá.
2. **Ordenação** — fazer `.sort((a, b) => a.label.localeCompare(b.label, "pt-BR"))` na API.
3. **20 novas telas adicionadas** nesta sessão:
   - Kanban Solicitações, Detalhe/Editar Solicitação, Detalhe Cliente
   - Clientes (Cadastros)
   - Notificações, Banco de Dados, Empresa, Integrações, SMTP, Status, Telas
   - Meus Menus
   - Relatórios (Dashboard)
   - Ferramentas hub, Conversores, Regra de Três
   - Documentos hub, Romaneios
   - Chat

### Tópico 51.6: Status REPROVADO vs REPROVADA

**Commit:** `d3dccfc` padronizou amostras de `REPROVADO` (masculino) para `REPROVADA` (feminino).

**Problema investigado:** Amostras antigas com `REPROVADO` não apareciam no kanban porque o kanban faz `a.status === col.nome` (igualdade estrita). O script `scripts/migrar-reprovado.mjs` foi criado para migrar mas já foi removido.

**Verificação:** Query no banco confirmou que não existem mais registros com `REPROVADO` em nenhuma das tabelas de amostra. A migração já foi executada.

**Regra:** Ao padronizar valores de coluna no código, criar script de migração e **executá-lo** antes de remover o script.

### Tópico 51.7: Commits desta Sessão

| Commit | Descrição |
|--------|-----------|
| `a48fcc3` | Kanban amostras + dashboard dinâmico + API status unificada |
| `5a7f67b` | Kanban cards navegam para amostra, modal dashboard filtrado, +20 telas no registry, ordenação A-Z |

---

**Última atualização:** 26/06/2026
**Versão:** 3.2 (Padronização de Nomes: Solicitação de Desenvolvimento / Amostra de Desenvolvimento)
**Total de seções:** 52