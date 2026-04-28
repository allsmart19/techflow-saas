import { X, Printer, FileText, MessageCircle, Mail, Edit, CheckCircle2, AlertTriangle, Shield } from "lucide-react"

interface OrdemServicoModalProps {
  os: any;
  onClose: () => void;
  onEdit: (id: number) => void;
  lojaConfig?: { 
    nome: string; 
    logoUrl?: string;
    endereco?: string;
    telefone?: string;
    cnpj?: string;
    cidade?: string;
  };
}

const CHECKLIST_LABELS: Record<string, string> = {
  checklist_tela: "Tela / Display",
  checklist_traseira: "Tampa Traseira",
  checklist_carcaca: "Carcaça / Laterais",
  checklist_botoes: "Botões Físicos",
  checklist_cameras: "Câmeras",
  checklist_som: "Alto-falante / Mic",
  checklist_carregamento: "Carregamento",
  checklist_wifi: "Wi-Fi / Rede",
  checklist_biometria: "Biometria / FaceID",
}

export default function OrdemServicoModal({ os, onClose, onEdit, lojaConfig }: OrdemServicoModalProps) {
  if (!os) return null

  const nomeLoja = lojaConfig?.nome || "Store Tech"

  const getWhatsAppLink = () => {
    const phone = os.cliente_telefone?.replace(/\D/g, "")
    if (!phone) return "#"
    const isBrazil = phone.length >= 10 && phone.length <= 11
    const finalPhone = isBrazil ? `55${phone}` : phone
    const text = [
      `Olá *${os.cliente_nome}*! 👋`,
      ``,
      `Aqui é da *${nomeLoja}*.`,
      `Sua Ordem de Serviço *#${os.id}* foi registrada.`,
      ``,
      `📱 *Aparelho:* ${os.marca} ${os.modelo}${os.cor ? ` (${os.cor})` : ""}`,
      `📋 *Relato:* ${os.defeito_relatado || "A definir"}`,
      `🔖 *Status atual:* ${os.status}`,
      os.valor_orcamento ? `💰 *Orçamento:* R$ ${Number(os.valor_orcamento).toFixed(2)}` : "",
      os.data_previsao ? `📅 *Previsão:* ${new Date(os.data_previsao).toLocaleDateString("pt-BR")}` : "",
      os.garantia_dias ? `🛡️ *Garantia:* ${os.garantia_dias} dias` : "",
      ``,
      `Qualquer dúvida estamos à disposição!`,
    ].filter(Boolean).join("\n")
    return `https://wa.me/${finalPhone}?text=${encodeURIComponent(text)}`
  }

  const getEmailLink = () => {
    const subject = `Sua Ordem de Serviço #${os.id} - ${nomeLoja}`
    const body = [
      `Olá ${os.cliente_nome},`,
      ``,
      `Sua Ordem de Serviço #${os.id} foi registrada/atualizada.`,
      ``,
      `Aparelho: ${os.marca} ${os.modelo}`,
      `Status: ${os.status}`,
      `Defeito: ${os.defeito_relatado || "A definir"}`,
      os.valor_orcamento ? `Orçamento: R$ ${Number(os.valor_orcamento).toFixed(2)}` : "",
      os.data_previsao ? `Previsão de entrega: ${new Date(os.data_previsao).toLocaleDateString("pt-BR")}` : "",
      ``,
      `Atenciosamente,`,
      `Equipe ${nomeLoja}`,
    ].filter(Boolean).join("\n")
    return `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`
  }

  const imprimir = (tipo: "A4" | "TERMICA") => {
    const isTermica = tipo === "TERMICA"
    const width = isTermica ? 320 : 900

    const fmtBRL = (val: number) => `R$ ${Number(val).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`

    const checklistRows = Object.entries(CHECKLIST_LABELS)
      .map(([key, label]) => {
        const val = os[key] || "OK"
        const color = val === "OK" ? "#16a34a" : "#d97706"
        return `<tr><td style="padding:4px 8px;font-size:12px;">${label}</td><td style="padding:4px 8px;font-size:12px;color:${color};font-weight:bold;">${val}</td></tr>`
      }).join("")

    const acessorios = [
      os.acessorio_chip && "Chip SIM",
      os.acessorio_cartao_memoria && "Cartão de Memória",
      os.acessorio_carregador && "Carregador",
      os.acessorio_capinha && "Capinha/Case",
      os.acessorio_pelicula && "Película",
      os.acessorio_outros,
    ].filter(Boolean).join(", ") || "Nenhum"

    const printWindow = window.open("", "_blank", `width=${width},height=900`)
    if (!printWindow) return

    const html = `<!DOCTYPE html><html><head><title>OS #${os.id}</title>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; color: #1a1a1a; padding: ${isTermica ? "8px" : "30px"}; width: ${isTermica ? "80mm" : "100%"}; font-size: ${isTermica ? "11px" : "13px"}; }
  .header { text-align: center; border-bottom: 2px dashed #333; padding-bottom: 12px; margin-bottom: 12px; }
  .header h1 { font-size: ${isTermica ? "15px" : "22px"}; margin-bottom: 4px; }
  .header .os-num { font-size: ${isTermica ? "13px" : "16px"}; font-weight: bold; color: #7c3aed; }
  .section { margin-top: 14px; }
  .section-title { font-size: ${isTermica ? "11px" : "13px"}; font-weight: bold; text-transform: uppercase; letter-spacing: 1px; color: #7c3aed; border-bottom: 1px solid #e5e7eb; padding-bottom: 4px; margin-bottom: 8px; }
  .row { display: flex; justify-content: space-between; margin-bottom: 6px; flex-wrap: ${isTermica ? "wrap" : "nowrap"}; }
  .col { width: ${isTermica ? "100%" : "48%"}; margin-bottom: ${isTermica ? "6px" : "0"}; }
  .label { font-weight: 600; font-size: 0.85em; color: #6b7280; text-transform: uppercase; letter-spacing: 0.5px; }
  .val { font-size: 1em; margin-top: 1px; }
  table { width: 100%; border-collapse: collapse; }
  table td { border-bottom: 1px solid #f3f4f6; }
  .signature { margin-top: 40px; text-align: center; width: 55%; margin-left: auto; margin-right: auto; }
  .signature-line { border-top: 1px solid #333; margin-bottom: 4px; }
  .footer { margin-top: 20px; text-align: center; font-size: 0.85em; color: #9ca3af; border-top: 2px dashed #333; padding-top: 12px; }
  .garantia { background: #fef3c7; border: 1px solid #fbbf24; padding: 10px; border-radius: 6px; margin-top: 14px; font-size: 0.85em; color: #92400e; }
  @media print { body { padding: 0; } @page { margin: ${isTermica ? "0" : "8mm"}; } }
</style></head>
<body onload="window.print(); window.close();">
  <div class="header">
    ${lojaConfig?.logoUrl ? `<img src="${lojaConfig.logoUrl}" style="max-width:${isTermica ? "60px" : "120px"};max-height:${isTermica ? "40px" : "80px"};margin-bottom:${isTermica ? "2px" : "8px"};" />` : ""}
    <h1 style="margin-bottom: 2px;">${nomeLoja}</h1>
    ${lojaConfig?.cnpj ? `<div style="font-size:0.8em; font-weight: 500;">CNPJ: ${lojaConfig.cnpj}</div>` : ""}
    ${lojaConfig?.endereco ? `<div style="font-size:0.8em; margin-top: 1px;">${lojaConfig.endereco}${lojaConfig.cidade ? ` - ${lojaConfig.cidade}` : ""}</div>` : ""}
    ${lojaConfig?.telefone ? `<div style="font-size:0.85em; font-weight: bold; margin-top: 2px;">📞 ${lojaConfig.telefone}</div>` : ""}
    
    <div class="os-num" style="margin-top: 8px; border-top: 1px solid #eee; padding-top: 6px;">ORDEM DE SERVIÇO #${os.id}</div>
    <div style="font-size:0.85em;color:#6b7280;margin-top:2px;">Emissão: ${new Date(os.data_entrada).toLocaleString("pt-BR")}</div>
  </div>

  <div class="section">
    <div class="section-title">Dados do Cliente</div>
    <div class="row">
      <div class="col"><span class="label">Nome</span><div class="val">${os.cliente_nome}</div></div>
      <div class="col"><span class="label">Telefone</span><div class="val">${os.cliente_telefone || "-"}</div></div>
    </div>
  </div>

  <div class="section">
    <div class="section-title">Equipamento</div>
    <div class="row">
      <div class="col"><span class="label">Marca / Modelo</span><div class="val">${os.marca} ${os.modelo}${os.cor ? ` — ${os.cor}` : ""}</div></div>
      <div class="col"><span class="label">IMEI</span><div class="val">${os.imei || "Não informado"}</div></div>
    </div>
    <div class="row">
      <div class="col"><span class="label">Senha</span><div class="val">${os.senha || "Não informada"}</div></div>
      <div class="col"><span class="label">Liga?</span><div class="val">${os.aparelho_liga ? "Sim ✅" : "Não ❌"}</div></div>
    </div>
  </div>

  <div class="section">
    <div class="section-title">Checklist de Entrada</div>
    <table>${checklistRows}</table>
  </div>

  <div class="section">
    <div class="section-title">Acessórios Entregues</div>
    <p style="font-size:0.95em;">${acessorios}</p>
  </div>

  <div class="section">
    <div class="section-title">Defeito Relatado</div>
    <p style="font-size:0.95em;">${os.defeito_relatado || "Não informado"}</p>
  </div>

  <div class="section">
    <div class="section-title">Financeiro</div>
    <div class="row">
      <div class="col"><span class="label">Status</span><div class="val">${os.status}</div></div>
      <div class="col"><span class="label">Orçamento</span><div class="val" style="font-weight:bold;">${os.valor_orcamento ? fmtBRL(os.valor_orcamento) : "A combinar"}</div></div>
    </div>
    ${os.valor_pecas || os.valor_mao_obra ? `<div class="row"><div class="col"><span class="label">Peças</span><div class="val">${fmtBRL(os.valor_pecas || 0)}</div></div><div class="col"><span class="label">Mão de obra</span><div class="val">${fmtBRL(os.valor_mao_obra || 0)}</div></div></div>` : ""}
    ${os.forma_pagamento ? `<div class="row"><div class="col"><span class="label">Pagamento</span><div class="val">${os.forma_pagamento}</div></div></div>` : ""}
    ${os.data_previsao ? `<div class="row"><div class="col"><span class="label">Previsão entrega</span><div class="val">${new Date(os.data_previsao).toLocaleDateString("pt-BR")}</div></div></div>` : ""}
  </div>

  ${os.garantia_dias ? `<div class="garantia"><strong>🛡️ GARANTIA: ${os.garantia_dias} dias</strong><br/>${os.termo_garantia || "Garantia válida para o serviço realizado. Não cobre: mau uso, quedas, umidade/oxidação, violação de lacres por terceiros."}</div>` : ""}

  <div class="signature">
    <div class="signature-line"></div>
    <span style="font-size:0.85em;">Assinatura do Cliente</span>
  </div>

  <div class="footer">Obrigado pela preferência! — ${nomeLoja}</div>
</body></html>`

    printWindow.document.write(html)
    printWindow.document.close()
  }

  const fmtCurrency = (v: number) => `R$ ${Number(v).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

  const checklistEntries = Object.entries(CHECKLIST_LABELS).map(([key, label]) => ({
    label,
    value: os[key] || "OK",
  }))

  const acessoriosList = [
    os.acessorio_chip && "Chip SIM",
    os.acessorio_cartao_memoria && "Cartão de Memória",
    os.acessorio_carregador && "Carregador",
    os.acessorio_capinha && "Capinha/Case",
    os.acessorio_pelicula && "Película",
    os.acessorio_outros,
  ].filter(Boolean)

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-3xl w-full shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="p-5 border-b border-gray-100 dark:border-gray-700 bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-gray-800 dark:to-gray-800 flex justify-between items-start">
          <div>
            <div className="flex items-center gap-3 flex-wrap">
              <span className="bg-purple-600 text-white font-bold px-3 py-1 rounded-full text-xs shadow-sm">
                OS #{os.id}
              </span>
              <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${os.status === "Pronto" || os.status === "Entregue" ? "bg-emerald-50 border-emerald-200 text-emerald-700" : os.status === "Urgente" ? "bg-red-50 border-red-200 text-red-700" : "bg-gray-100 border-gray-200 text-gray-600 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-300"}`}>
                {os.status}
              </span>
              {os.prioridade === "Urgente" && (
                <span className="bg-red-100 text-red-700 text-[10px] font-bold px-2 py-0.5 rounded-full border border-red-200 animate-pulse">🔴 URGENTE</span>
              )}
            </div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mt-2 leading-tight">
              {os.marca} {os.modelo} {os.cor && <span className="text-gray-400 font-normal text-base">— {os.cor}</span>}
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Cliente: <b className="text-gray-700 dark:text-gray-200">{os.cliente_nome}</b>
              {os.cliente_telefone && <span className="ml-2 text-xs">📞 {os.cliente_telefone}</span>}
            </p>
          </div>
          <button onClick={onClose} className="p-2 bg-white/80 text-gray-500 hover:bg-white dark:bg-gray-700 dark:text-gray-400 dark:hover:bg-gray-600 rounded-full transition-colors shadow-sm">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 overflow-y-auto flex-1 space-y-5">
          {/* Info Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <InfoCard label="Entrada" value={new Date(os.data_entrada).toLocaleDateString("pt-BR")} />
            <InfoCard label="IMEI" value={os.imei || "—"} />
            <InfoCard label="Senha" value={os.senha || "—"} />
            <InfoCard label="Liga?" value={os.aparelho_liga === false ? "❌ Não" : "✅ Sim"} />
          </div>

          {/* Checklist */}
          <div>
            <h4 className="text-xs uppercase font-bold text-gray-400 tracking-wider mb-2 flex items-center gap-1.5">
              <Shield className="w-3.5 h-3.5" /> Checklist de Entrada
            </h4>
            <div className="grid grid-cols-3 gap-2">
              {checklistEntries.map(item => (
                <div key={item.label} className={`px-3 py-2 rounded-lg text-xs font-medium flex items-center justify-between border ${item.value === "OK" ? "bg-emerald-50 border-emerald-200 text-emerald-700 dark:bg-emerald-900/20 dark:border-emerald-800 dark:text-emerald-400" : "bg-amber-50 border-amber-200 text-amber-700 dark:bg-amber-900/20 dark:border-amber-800 dark:text-amber-400"}`}>
                  <span>{item.label}</span>
                  <span className="font-bold">{item.value === "OK" ? "✓" : item.value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Acessórios */}
          {acessoriosList.length > 0 && (
            <div>
              <h4 className="text-xs uppercase font-bold text-gray-400 tracking-wider mb-2">Acessórios Entregues</h4>
              <div className="flex flex-wrap gap-1.5">
                {acessoriosList.map((a, i) => (
                  <span key={i} className="bg-purple-50 text-purple-700 border border-purple-200 dark:bg-purple-900/20 dark:text-purple-400 dark:border-purple-800 px-2.5 py-1 rounded-full text-xs font-medium">{a}</span>
                ))}
              </div>
            </div>
          )}

          {/* Defeito */}
          <div>
            <h4 className="text-xs uppercase font-bold text-gray-400 tracking-wider mb-2">Defeito Relatado</h4>
            <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-xl text-gray-700 dark:text-gray-300 text-sm leading-relaxed border border-gray-100 dark:border-gray-700">
              {os.defeito_relatado || "Não informado"}
            </div>
          </div>

          {os.observacoes && (
            <div>
              <h4 className="text-xs uppercase font-bold text-gray-400 tracking-wider mb-2">Observações Internas</h4>
              <div className="bg-amber-50 dark:bg-amber-900/20 p-4 rounded-xl text-amber-800 dark:text-amber-200 text-sm border border-amber-100 dark:border-amber-800/50">
                {os.observacoes}
              </div>
            </div>
          )}

          {/* Financeiro */}
          <div>
            <h4 className="text-xs uppercase font-bold text-gray-400 tracking-wider mb-2">Financeiro</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <InfoCard label="Orçamento" value={os.valor_orcamento ? fmtCurrency(os.valor_orcamento) : "A combinar"} highlight />
              {os.valor_pecas > 0 && <InfoCard label="Peças" value={fmtCurrency(os.valor_pecas)} />}
              {os.valor_mao_obra > 0 && <InfoCard label="Mão de Obra" value={fmtCurrency(os.valor_mao_obra)} />}
              {os.forma_pagamento && <InfoCard label="Pagamento" value={os.forma_pagamento} />}
            </div>
          </div>

          {/* Garantia e Previsão */}
          <div className="grid grid-cols-2 gap-3">
            {os.data_previsao && <InfoCard label="Previsão de Entrega" value={new Date(os.data_previsao).toLocaleDateString("pt-BR")} />}
            {os.garantia_dias && <InfoCard label="Garantia" value={`${os.garantia_dias} dias`} />}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/80 flex flex-wrap gap-2 justify-center md:justify-between items-center">
          <div className="flex gap-2">
            {os.status === "Entregue" ? (
              <span className="flex items-center gap-1.5 px-4 py-2 bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-800 text-indigo-600 dark:text-indigo-400 rounded-lg text-sm font-semibold">
                🔒 Finalizada
              </span>
            ) : (
              <button onClick={() => onEdit(os.id)}
                className="flex items-center gap-1.5 px-4 py-2 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-200 rounded-lg text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-600 transition shadow-sm">
                <Edit className="w-4 h-4" /> Editar
              </button>
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            <a href={getWhatsAppLink()} target="_blank" rel="noreferrer"
              className="flex items-center gap-1.5 px-3 py-2 bg-[#25D366] hover:bg-[#128C7E] text-white rounded-lg text-sm font-medium transition shadow-sm">
              <MessageCircle className="w-4 h-4" /> WhatsApp
            </a>
            <a href={getEmailLink()}
              className="flex items-center gap-1.5 px-3 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg text-sm font-medium transition shadow-sm">
              <Mail className="w-4 h-4" /> E-mail
            </a>
            <button onClick={() => imprimir("TERMICA")} title="Bobina 80mm / 58mm"
              className="flex items-center gap-1.5 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition shadow-sm">
              <FileText className="w-4 h-4" /> Bobina
            </button>
            <button onClick={() => imprimir("A4")} title="Impressão A4 / PDF"
              className="flex items-center gap-1.5 px-3 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-sm font-medium transition shadow-sm">
              <Printer className="w-4 h-4" /> A4 / PDF
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

function InfoCard({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className={`rounded-xl p-3 border ${highlight ? "bg-purple-50 dark:bg-purple-900/20 border-purple-100 dark:border-purple-800" : "bg-gray-50 dark:bg-gray-900/50 border-gray-100 dark:border-gray-700"}`}>
      <span className={`text-[10px] uppercase tracking-wider block mb-1 ${highlight ? "text-purple-600 dark:text-purple-400" : "text-gray-500"}`}>{label}</span>
      <span className={`font-semibold text-sm ${highlight ? "text-purple-700 dark:text-purple-300" : "text-gray-900 dark:text-gray-100"}`}>{value}</span>
    </div>
  )
}
