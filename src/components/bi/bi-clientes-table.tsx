export function ClientesTable({ clientes }: { clientes: any[] }) {
  if (clientes.length === 0) {
    return <p className="text-sm text-slate-500 py-4 text-center">Nenhum cliente encontrado.</p>
  }
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-xs">
        <thead className="border-b border-slate-200 dark:border-slate-700">
          <tr>
            <th className="text-left py-2 px-2 font-medium text-slate-500">Cliente</th>
            <th className="text-left py-2 px-2 font-medium text-slate-500">Cidade/UF</th>
            <th className="text-right py-2 px-2 font-medium text-slate-500">Última Compra</th>
            <th className="text-right py-2 px-2 font-medium text-slate-500">Total Faturado</th>
            <th className="text-right py-2 px-2 font-medium text-slate-500">Ticket Médio</th>
            <th className="text-right py-2 px-2 font-medium text-slate-500">Quantidade</th>
            <th className="text-left py-2 px-2 font-medium text-slate-500">Última NF</th>
          </tr>
        </thead>
        <tbody>
          {clientes.map((c) => (
            <tr key={c.razaoSocial} className="border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50">
              <td className="py-2 px-2 font-medium text-slate-800 dark:text-slate-200">{c.razaoSocial}</td>
              <td className="py-2 px-2 text-slate-500">{c.cidade}/{c.uf}</td>
              <td className="py-2 px-2 text-right text-slate-700 dark:text-slate-300">
                {c.ultimaData ? new Date(c.ultimaData).toLocaleDateString("pt-BR") : "—"}
              </td>
              <td className="py-2 px-2 text-right font-medium text-slate-800 dark:text-slate-200">
                R$ {c.totalFaturado.toLocaleString("pt-BR", { maximumFractionDigits: 2 })}
              </td>
              <td className="py-2 px-2 text-right text-slate-500">
                R$ {c.ticketMedio.toLocaleString("pt-BR", { maximumFractionDigits: 2 })}
              </td>
              <td className="py-2 px-2 text-right text-slate-500">
                {c.quantidadeTotal.toLocaleString("pt-BR")}
              </td>
              <td className="py-2 px-2 text-slate-500">{c.ultimaNF}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
