import type { Metadata } from "next"
import Link from "next/link"
import { ArrowRight, CheckCircle2 } from "lucide-react"
import {
  BENEFICIOS,
  CRIADORES,
  MODULOS_APRESENTACAO,
  NO_ERP,
  NO_PDM,
  PASSOS,
  POSICIONAMENTO,
} from "@/lib/apresentacao"

export const metadata: Metadata = {
  title: "Sobre o PDM Pro Têxtil",
  description:
    "O PDM Pro Têxtil é uma ferramenta de integração para a indústria têxtil: conecta ferramentas legadas às tecnologias atuais e foca no desenvolvimento de produtos, sem substituir o ERP comercial. Criado por Tiago de Abreu e Sérgio Costa.",
}

const DORES = [
  "Informações espalhadas em papéis, planilhas e conversas de WhatsApp",
  "Retrabalho porque cada área preenche a mesma coisa de novo",
  "Produtos, amostras e pedidos difíceis de encontrar quando preciso",
  "Falta de controle sobre prazos, chamados e manutenção de máquinas",
  "Números desatualizados na hora de decidir",
]

export default function SobrePage() {
  return (
    <div className="min-h-screen bg-[#0a0a0f] text-slate-300">
      <header className="sticky top-0 z-30 border-b border-slate-900 bg-[#0a0a0f]/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4 md:px-8">
          <Link href="/" className="text-lg font-bold tracking-wide text-white">
            PDM·PRO·TÊXTIL
          </Link>
          <nav className="flex items-center gap-3">
            <Link href="/" className="hidden text-sm text-slate-400 transition-colors hover:text-white sm:block">
              Início
            </Link>
            <Link
              href="/login"
              className="inline-flex items-center gap-2 rounded-lg bg-white px-5 py-2 text-sm font-medium text-black transition-colors hover:bg-slate-200"
            >
              Acessar Sistema
              <ArrowRight size={16} />
            </Link>
          </nav>
        </div>
      </header>

      <main>
        <section className="border-b border-slate-900 px-6 py-20 md:px-8">
          <div className="mx-auto max-w-4xl text-center">
            <p className="text-sm font-semibold uppercase tracking-widest text-blue-400">
              Sobre o PDM Pro Têxtil
            </p>
            <h1 className="mt-4 text-4xl font-bold leading-tight text-white md:text-6xl">
              Integração entre o que você já tem e o que há de mais atual
            </h1>
            <p className="mx-auto mt-6 max-w-3xl text-lg font-light leading-relaxed text-slate-400">
              O PDM Pro Têxtil é uma ferramenta de integração para a indústria têxtil. Ele faz as
              ferramentas legadas da empresa — como o ERP e as planilhas — convergirem com as
              tecnologias mais atuais, por APIs e integrações. O foco é o desenvolvimento de produtos,
              que precisa ser gerenciado, e, com ele, vêm módulos satélites que muitas vezes não
              existem no seu ERP. A parte de vendas é o CRM, que trabalha junto com o seu ERP
              comercial sem substituí-lo.
            </p>
            <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Link
                href="/login"
                className="inline-flex items-center gap-2 rounded-lg bg-white px-8 py-4 font-medium text-black transition-colors hover:bg-slate-200"
              >
                Acessar Sistema
                <ArrowRight size={18} />
              </Link>
              <Link
                href="/"
                className="inline-flex items-center gap-2 rounded-lg border border-slate-600 px-8 py-4 font-medium text-white transition-colors hover:border-slate-400 hover:bg-slate-900/50"
              >
                Voltar ao início
              </Link>
            </div>
          </div>
        </section>

        <section className="border-b border-slate-900 px-6 py-16 md:px-8">
          <div className="mx-auto grid max-w-5xl gap-10 md:grid-cols-2 md:items-center">
            <div>
              <h2 className="text-3xl font-bold text-white">O problema que ele resolve</h2>
              <p className="mt-4 text-base leading-relaxed text-slate-400">
                Quando a informação não está organizada, o dia a dia vira uma corrida atrás de dados.
                O PDM existe para acabar com isso:
              </p>
            </div>
            <ul className="space-y-3">
              {DORES.map((dor) => (
                <li
                  key={dor}
                  className="flex items-start gap-3 rounded-lg border border-slate-800 bg-slate-900/50 p-4 text-sm text-slate-300"
                >
                  <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-red-400" />
                  {dor}
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section className="border-b border-slate-900 px-6 py-16 md:px-8">
          <div className="mx-auto max-w-5xl">
            <div className="mb-10 text-center">
              <h2 className="text-3xl font-bold text-white md:text-4xl">O PDM e o seu ERP</h2>
              <p className="mx-auto mt-4 max-w-3xl text-base text-slate-400">{POSICIONAMENTO}</p>
            </div>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="rounded-xl border border-blue-900/60 bg-blue-950/20 p-6">
                <h3 className="text-lg font-semibold text-white">No PDM</h3>
                <p className="mt-1 text-sm text-slate-400">
                  Tudo o que acontece antes do lançamento do pedido.
                </p>
                <ul className="mt-4 space-y-3">
                  {NO_PDM.map((item) => (
                    <li key={item} className="flex items-start gap-3 text-sm text-slate-300">
                      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-blue-400" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-6">
                <h3 className="text-lg font-semibold text-white">No seu ERP (integrado)</h3>
                <p className="mt-1 text-sm text-slate-400">
                  O que continua no ERP e fica visível no PDM por integração.
                </p>
                <ul className="mt-4 space-y-3">
                  {NO_ERP.map((item) => (
                    <li key={item} className="flex items-start gap-3 text-sm text-slate-300">
                      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-slate-500" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </section>

        <section className="border-b border-slate-900 px-6 py-16 md:px-8">
          <div className="mx-auto max-w-6xl">
            <div className="mb-10 text-center">
              <h2 className="text-3xl font-bold text-white md:text-4xl">O que o PDM faz por você</h2>
              <p className="mx-auto mt-4 max-w-2xl text-base text-slate-400">
                Tudo em linguagem simples. Cada recurso existe para facilitar um pedaço do seu
                trabalho.
              </p>
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {MODULOS_APRESENTACAO.map((modulo) => (
                <div
                  key={modulo.titulo}
                  className="rounded-xl border border-slate-800 bg-slate-900/50 p-6 transition-colors hover:border-slate-600"
                >
                  <modulo.icone className="mb-4 h-7 w-7 text-blue-400" />
                  <h3 className="text-base font-semibold text-white">{modulo.titulo}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-slate-400">{modulo.resumo}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="border-b border-slate-900 px-6 py-16 md:px-8">
          <div className="mx-auto max-w-6xl">
            <div className="mb-10 text-center">
              <h2 className="text-3xl font-bold text-white md:text-4xl">Por que escolher o PDM</h2>
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {BENEFICIOS.map((beneficio) => (
                <div key={beneficio.titulo} className="rounded-xl border border-slate-800 p-6">
                  <CheckCircle2 className="mb-4 h-6 w-6 text-emerald-400" />
                  <h3 className="text-base font-semibold text-white">{beneficio.titulo}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-slate-400">{beneficio.resumo}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="border-b border-slate-900 px-6 py-16 md:px-8">
          <div className="mx-auto max-w-5xl">
            <div className="mb-10 text-center">
              <h2 className="text-3xl font-bold text-white md:text-4xl">Como começar</h2>
            </div>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              {PASSOS.map((passo, i) => (
                <div key={passo.titulo} className="rounded-xl border border-slate-800 bg-slate-900/50 p-6">
                  <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-full bg-blue-600 text-base font-bold text-white">
                    {i + 1}
                  </div>
                  <h3 className="text-base font-semibold text-white">{passo.titulo}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-slate-400">{passo.resumo}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="border-b border-slate-900 px-6 py-16 md:px-8">
          <div className="mx-auto max-w-4xl text-center">
            <h2 className="text-3xl font-bold text-white md:text-4xl">Quem criou o PDM</h2>
            <p className="mx-auto mt-4 max-w-2xl text-base text-slate-400">
              O PDM Pro Têxtil foi idealizado e desenvolvido por quem entende, de perto, a rotina da
              indústria têxtil.
            </p>
            <div className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-2">
              {CRIADORES.map((criador) => (
                <div key={criador.nome} className="rounded-xl border border-slate-800 bg-slate-900/50 p-8">
                  <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-slate-800 text-xl font-bold text-white">
                    {criador.nome
                      .split(" ")
                      .map((parte) => parte[0])
                      .slice(0, 2)
                      .join("")}
                  </div>
                  <h3 className="text-lg font-semibold text-white">{criador.nome}</h3>
                  <p className="mt-1 text-sm text-slate-400">{criador.papel}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="px-6 py-20 md:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="text-3xl font-bold text-white md:text-4xl">
              Pronto para organizar a sua fábrica?
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-base text-slate-400">
              Acesse o sistema com o seu usuário e veja o PDM trabalhando por você.
            </p>
            <Link
              href="/login"
              className="mt-8 inline-flex items-center gap-2 rounded-lg bg-white px-8 py-4 font-medium text-black transition-colors hover:bg-slate-200"
            >
              Acessar Sistema
              <ArrowRight size={18} />
            </Link>
          </div>
        </section>
      </main>

      <footer className="border-t border-slate-900 px-6 py-8 text-center md:px-8">
        <p className="text-xs text-slate-600">
          © 2026 PDM·PRO·TÊXTIL · Criado por Tiago de Abreu e Sérgio Costa · Todos os direitos
          reservados
        </p>
      </footer>
    </div>
  )
}
