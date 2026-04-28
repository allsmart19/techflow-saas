import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  Rocket,
  Zap,
  CheckCircle2,
  Phone,
  MessageCircle,
  BarChart,
  Users,
  Package,
  Wrench,
  TrendingUp,
  LayoutDashboard,
  ArrowRight,
  ClipboardList,
  Star,
  ShieldCheck,
  Smartphone,
  Coffee,
  Heart
} from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"

export default function LandingPage() {
  const navigate = useNavigate()
  const [email, setEmail] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [activeTab, setActiveTab] = useState(0)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email) return
    setIsSubmitting(true)
    setTimeout(() => {
      setIsSubmitting(false)
      navigate('/login')
    }, 800)
  }

  const phone = "48 991074867"
  const formattedPhone = "(48) 99107-4867"
  const wppLink = `https://wa.me/55${phone.replace(/\D/g, '')}?text=Olá,%20gostaria%20de%20saber%20mais%20sobre%20o%20Store%20Tech!`

  const beneficios = [
    { title: "Gestão de O.S. Moderna", text: "Lista vertical inteligente com filtros de data e KPIs de faturamento. Saiba exatamente quanto sua bancada produziu no dia, semana ou mês.", icon: <ClipboardList className="w-7 h-7" /> },
    { title: "Estoque Inteligente", text: "Controle de peças por categoria com alertas de estoque baixo. Saiba quando repor baterias, telas e conectores antes que acabem.", icon: <Package className="w-7 h-7" /> },
    { title: "Comissões e Lucro Real", text: "Cálculo automático de comissão dos técnicos e lucro líquido descontando peças e frete. Gestão financeira total.", icon: <TrendingUp className="w-7 h-7" /> },
  ]

  const prints = [
    {
      id: "ordens",
      title: "Nova Interface de O.S.",
      desc: "Adeus rolagem horizontal. Veja suas ordens em uma lista vertical moderna, filtre por período e acompanhe KPIs de faturamento.",
      image: "/print-ordens.png",
      icon: <ClipboardList className="w-6 h-6" />
    },
    {
      id: "estoque",
      title: "Controle de Estoque",
      desc: "Gerencie peças por categorias, receba alertas de estoque mínimo e mantenha seu laboratório sempre abastecido.",
      image: "/print-estoque.png",
      icon: <Package className="w-6 h-6" />
    },
    {
      id: "relatorios",
      title: "Consertos e Lucros",
      desc: "Histórico completo de atendimentos com detalhamento de custos, lucros e comissões integradas.",
      image: "/print-consertos.png",
      icon: <TrendingUp className="w-6 h-6" />
    },
    {
      id: "dashboard",
      title: "Dashboard em Tempo Real",
      desc: "Gráficos inteligentes de desempenho, principais serviços realizados e saúde financeira da sua assistência.",
      image: "/print-dashboard.png",
      icon: <LayoutDashboard className="w-6 h-6" />
    },
  ]

  const depoimentos = [
    {
      name: "Ricardo Silva",
      loja: "Fênix Assistência",
      text: "O controle de comissões me economizou horas de planilha no fim do mês. Agora tudo é automático e transparente para a equipe.",
      stars: 5
    },
    {
      name: "Amanda Costa",
      loja: "Tech Lab",
      text: "Finalmente um sistema que entende que a gente precisa ver o lucro bruto descontando as peças na hora. Mudou meu jogo financeiro.",
      stars: 5
    },
    {
      name: "Carlos Eduardo",
      loja: "Help Celulares",
      text: "A nova lista de O.S. vertical ficou sensacional. É muito mais rápido gerenciar o laboratório pelo tablet ou celular.",
      stars: 5
    }
  ]

  const diferenciais = [
    { title: "Segurança Total", desc: "Seus dados são protegidos e isolados. Backup diário automático.", icon: <ShieldCheck className="w-5 h-5" /> },
    { title: "Multidispositivo", desc: "Acesse do computador, tablet ou celular. Onde você estiver.", icon: <Smartphone className="w-5 h-5" /> },
    { title: "Sempre Evoluindo", desc: "Atualizações constantes com novas funções baseadas no seu feedback.", icon: <Zap className="w-5 h-5" /> },
    { title: "Suporte Amigo", desc: "Dúvidas? Nossa equipe está pronta para ajudar via WhatsApp.", icon: <Heart className="w-5 h-5" /> }
  ]

  useEffect(() => {
    const timer = setInterval(() => {
      setActiveTab((prev) => (prev + 1) % prints.length)
    }, 6000)
    return () => clearInterval(timer)
  }, [prints.length])

  return (
    <div className="min-h-screen bg-slate-50 text-gray-800 font-sans selection:bg-purple-200">

      {/* Botão Flutuante WhatsApp */}
      <a
        href={wppLink}
        target="_blank"
        rel="noreferrer"
        className="fixed bottom-6 right-6 z-[60] bg-[#25D366] hover:bg-[#1EBE5D] p-4 rounded-full shadow-lg shadow-green-500/30 transition-transform hover:scale-110 flex items-center justify-center text-white"
        aria-label="Contato WhatsApp"
      >
        <MessageCircle className="w-7 h-7" />
      </a>

      {/* Topbar / Navbar Simplificada */}
      <nav className="fixed w-full z-50 bg-white/80 backdrop-blur-xl border-b border-purple-100 py-4 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-600 to-purple-800 flex items-center justify-center shadow-md shadow-purple-500/30">
              <Zap className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-xl text-purple-950 tracking-tight">Store Tech</span>
            <span className="flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4 text-purple-600" /> Gestão de Pedidos e Consertos</span>
          </div>
          <div className="flex items-center gap-6">
            <a href={wppLink} target="_blank" rel="noreferrer" className="hidden sm:flex items-center gap-2 text-gray-500 hover:text-purple-600 transition-colors text-sm font-medium">
              <Phone className="w-4 h-4" /> {formattedPhone}
            </a>
            <Button onClick={() => navigate('/login')} className="bg-purple-50 text-purple-700 hover:bg-purple-100 border border-purple-200 rounded-xl px-6 shadow-sm font-semibold transition-all">
              Fazer Login
            </Button>
          </div>
        </div>
      </nav>

      {/* Hero Section Focada em Conversão - Tema Claro (Roxo/Branco) */}
      <section className="relative pt-32 pb-20 lg:pt-40 lg:pb-32 overflow-hidden bg-gradient-to-b from-white to-purple-50/50">
        <div className="absolute top-1/4 left-0 w-[500px] h-[500px] bg-purple-300/30 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute top-10 right-10 w-[400px] h-[400px] bg-indigo-300/20 rounded-full blur-[100px] pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 relative z-10">
          <div className="grid lg:grid-cols-2 gap-12 items-center">

            {/* Esquerda: Copywriting Impactante */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
              {/* Notificação Clicável: 7 Dias Grátis */}
              <button 
                 onClick={() => navigate('/login')} 
                 className="mb-8 inline-flex items-center gap-3 bg-gradient-to-r from-green-500 to-emerald-500 border border-green-400 p-1.5 pr-6 rounded-full shadow-lg shadow-green-500/30 hover:shadow-xl hover:shadow-green-500/40 hover:-translate-y-0.5 transition-all group focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
              >
                 <span className="flex items-center justify-center bg-white text-green-700 text-[11px] font-black px-3 py-1.5 rounded-full uppercase tracking-wider relative overflow-hidden shadow-sm">
                    <span className="absolute inset-0 bg-green-100/50 animate-pulse"></span>
                    <span className="relative">Presente</span>
                 </span>
                 <span className="text-sm md:text-base font-bold text-white flex items-center gap-1.5">
                    Faça um teste grátis de 7 dias <ArrowRight className="w-4 h-4 text-white group-hover:translate-x-1 transition-transform" />
                 </span>
              </button>

              <h1 className="text-5xl lg:text-6xl xl:text-[4rem] font-extrabold text-gray-900 mb-6 leading-[1.1] tracking-tight">
                Organize seu <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-purple-400">laboratório</span> de ponta a ponta.
              </h1>
              <p className="text-xl text-gray-600 mb-8 leading-relaxed max-w-[540px]">
                Gestão simplificada de Ordens de Serviço, Controle Inteligente de Estoque e Faturamento em tempo real para sua assistência técnica.
              </p>

              {/* Formulário de Conversão Direto no Hero */}
              <div className="bg-white border border-gray-200 rounded-2xl p-2 shadow-xl shadow-purple-900/5 mb-8 max-w-[540px]">
                <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-2">
                  <Input
                    type="email"
                    placeholder="Insira seu melhor e-mail..."
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="flex-1 bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-400 focus:ring-purple-500/50 focus:border-purple-500 h-14 text-base px-5 rounded-xl"
                  />
                  <Button
                    type="submit"
                    className="bg-purple-600 hover:bg-purple-700 text-white h-14 px-8 text-lg font-bold rounded-xl shadow-md transition-all group whitespace-nowrap"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? "Carregando..." : <span className="flex items-center gap-2">Testar 7 Dias Grátis <Rocket className="w-5 h-5 group-hover:-translate-y-1 group-hover:translate-x-1 transition-transform" /></span>}
                  </Button>
                </form>
              </div>
              <div className="flex flex-wrap items-center gap-4 text-sm font-medium text-gray-600">
                <span className="flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4 text-green-500" /> Sem cartão de crédito</span>
                <span className="flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4 text-purple-600" /> 100% focado em assistências</span>
              </div>
            </motion.div>

            {/* Direita: Print Real do Sistema c/ Efeito Hover */}
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.6, delay: 0.2 }} className="relative hidden lg:flex justify-center">
              <div className="absolute inset-0 bg-gradient-to-tr from-purple-200 to-indigo-100 rounded-3xl blur-2xl transform rotate-3" />
              <div className="relative rounded-2xl bg-white p-2 border border-purple-100 shadow-2xl shadow-purple-900/10 transform animate-float transition-all duration-500 group hover:-translate-y-2 hover:rotate-1">

                {/* Print Real */}
                <div className="rounded-xl overflow-hidden bg-slate-50 relative min-h-[300px] flex items-center justify-center border border-gray-100">
                  <img
                    src="/print-dashboard.png"
                    alt="Dashboard Store Tech"
                    className="w-full h-auto object-cover transition-opacity"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                      e.currentTarget.nextElementSibling?.classList.remove('hidden');
                      e.currentTarget.nextElementSibling?.classList.add('flex');
                    }}
                  />
                  <div className="hidden absolute inset-0 bg-purple-50 flex-col items-center justify-center p-8 text-center z-0 text-purple-800">
                    <LayoutDashboard className="w-12 h-12 mb-4 opacity-50 text-purple-600" />
                    <p className="font-bold text-lg">Local da Imagem: Dashboard</p>
                    <p className="text-sm mt-2 opacity-80">(Eu não tenho como baixar as imagens do chat pro seu PC. Você precisa copiar aquele print de dashboard que você mandou na pasta <b className="font-mono">public/</b> com o nome exato de <b className="font-mono bg-purple-100 text-purple-900 border border-purple-200 rounded px-1">print-dashboard.png</b>)</p>
                  </div>
                </div>

                {/* Badges Flutuantes */}
                <div className="absolute -bottom-6 -left-6 bg-white text-gray-900 p-4 rounded-2xl shadow-xl shadow-purple-900/5 flex items-center gap-4 border border-purple-50">
                  <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                    <TrendingUp className="w-5 h-5 text-purple-600" />
                  </div>
                  <div>
                    <p className="font-bold text-sm">Controle Exato</p>
                    <p className="text-xs text-gray-500">Custos vs. Frete vs. Lucro</p>
                  </div>
                </div>
              </div>
            </motion.div>

          </div>
        </div>
      </section>

      {/* Value Proposition Grid (Como o controle melhora) */}
      <section className="py-20 relative bg-white">
        <div className="max-w-7xl mx-auto px-4 relative z-10">
          <div className="grid md:grid-cols-3 gap-8">
            {beneficios.map((item, i) => (
              <div key={i} className="bg-white p-8 rounded-3xl border border-gray-100 hover:border-purple-200 hover:shadow-xl hover:shadow-purple-500/5 transition-all duration-300 hover:-translate-y-1 group">
                <div className="w-16 h-16 bg-purple-50 border border-purple-100 group-hover:bg-purple-600 rounded-2xl flex items-center justify-center mb-8 transition-colors duration-300 shadow-sm">
                  <div className="text-purple-600 group-hover:text-white transition-colors duration-300">
                    {item.icon}
                  </div>
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-4 tracking-tight">{item.title}</h3>
                <p className="text-gray-600 text-base leading-relaxed">{item.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Showcase Interativo (Navegando pelos Prints) */}
      <section className="py-24 bg-slate-50 border-y border-gray-200 relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 relative z-10">
          <div className="text-center mb-16 max-w-2xl mx-auto">
            <Badge className="mb-4 bg-purple-100 text-purple-700 hover:bg-purple-100 border-none">Visão Geral</Badge>
            <h2 className="text-3xl md:text-5xl font-extrabold text-gray-900 mb-6">Conheça o sistema por dentro</h2>
            <p className="text-gray-600 text-lg">
              Veja a interface limpa e feita sob medida para facilitar a gestão do laboratório.
              Registre tudo e veja os seus números de maneira clara e bonita.
            </p>
          </div>

          <div className="grid lg:grid-cols-12 gap-10 items-center">
            {/* Menu de Abas */}
            <div className="lg:col-span-4 flex flex-col gap-4">
              {prints.map((p, idx) => (
                <button
                  key={p.id}
                  onClick={() => setActiveTab(idx)}
                  className={`p-6 rounded-2xl text-left border transition-all duration-300 relative overflow-hidden group ${activeTab === idx
                    ? "bg-white border-purple-400 shadow-xl shadow-purple-500/10"
                    : "bg-transparent border-transparent hover:bg-white/60 hover:shadow-sm"
                    }`}
                >
                  <div className="flex items-center gap-3 mb-2">
                    <div className={`p-2 rounded-lg transition-colors ${activeTab === idx ? "bg-purple-600 text-white shadow-md shadow-purple-500/20" : "bg-purple-100 text-purple-600 group-hover:bg-purple-200"}`}>
                      {p.icon}
                    </div>
                    <h3 className={`text-xl font-bold ${activeTab === idx ? "text-purple-950" : "text-gray-700"}`}>
                      {p.title}
                    </h3>
                  </div>
                  <p className="text-sm text-gray-500 leading-relaxed font-medium pl-[52px]">{p.desc}</p>

                  {/* Efeito ativo indicador */}
                  {activeTab === idx && (
                    <motion.div layoutId="active-tab" className="absolute left-0 top-0 w-1 h-full bg-purple-600" />
                  )}
                </button>
              ))}
            </div>

            {/* Display de Imagem (Prints Reais) */}
            <div className="lg:col-span-8 relative">
              <div className="rounded-2xl border border-gray-200 bg-white p-2 lg:p-3 shadow-2xl shadow-purple-900/5 relative overflow-hidden min-h-[300px] lg:min-h-[500px] flex items-center justify-center">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={activeTab}
                    initial={{ opacity: 0, scale: 0.98, y: 10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 1.02, y: -10 }}
                    transition={{ duration: 0.4 }}
                    className="w-full h-full flex flex-col justify-center items-center"
                  >
                    <img
                      src={prints[activeTab].image}
                      alt={prints[activeTab].title}
                      className="w-full rounded-xl object-contain border border-gray-100 shadow-sm"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                        e.currentTarget.nextElementSibling?.classList.remove('hidden');
                        e.currentTarget.nextElementSibling?.classList.add('flex');
                      }}
                    />
                    {/* Fallback caso as imagens não estejam na pasta public */}
                    <div className="hidden border-2 border-dashed border-purple-200 rounded-xl py-20 px-8 text-purple-600 bg-purple-50 flex-col items-center justify-center text-center w-full max-w-lg">
                      <LayoutDashboard className="w-12 h-12 mb-4 text-purple-400" />
                      <p className="text-xl font-bold mb-2">📸 Print: {prints[activeTab].title}</p>
                      <p className="text-purple-700/80 mb-6">Infelizmente, como sou uma I.A., eu não consigo baixar imagens diretamente do nosso chat para a máquina.</p>

                      <div className="bg-white p-6 rounded-xl border border-purple-100 shadow-sm text-left">
                        <p className="font-bold text-gray-900 mb-2">Para ver a imagem aqui, siga esse passo:</p>
                        <ol className="list-decimal pl-4 text-sm text-gray-700 space-y-2">
                          <li>Salve o respectivo print que você colou no chat no seu computador.</li>
                          <li>Coloque-o dentro da pasta <strong>public</strong> do seu projeto <code>storetech-saas/public/</code>.</li>
                          <li>O nome do arquivo <strong>DEVE SER</strong>:<br />
                            <span className="bg-purple-100 text-purple-900 font-mono px-2 py-1 rounded inline-block mt-2">{prints[activeTab].image.replace('/', '')}</span>
                          </li>
                        </ol>
                      </div>
                    </div>
                  </motion.div>
                </AnimatePresence>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Seção Diferenciais */}
      <section className="py-20 bg-white border-t border-gray-100">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
            {diferenciais.map((d, i) => (
              <div key={i} className="flex flex-col items-center text-center p-6 rounded-2xl hover:bg-purple-50 transition-colors group">
                 <div className="w-12 h-12 bg-purple-100 text-purple-600 rounded-xl flex items-center justify-center mb-4 group-hover:bg-purple-600 group-hover:text-white transition-all">
                    {d.icon}
                 </div>
                 <h4 className="font-bold text-gray-900 mb-1">{d.title}</h4>
                 <p className="text-xs text-gray-500">{d.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Planos de Assinatura (Pricing) */}
      <section className="py-24 bg-slate-50 relative border-t border-gray-100">
        <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-purple-200 to-transparent" />
        <div className="max-w-7xl mx-auto px-4 relative z-10">
          <div className="text-center mb-16 max-w-2xl mx-auto">
            <Badge className="mb-4 bg-purple-100 text-purple-700 hover:bg-purple-100 border-none">Planos Inteligentes</Badge>
            <h2 className="text-3xl md:text-5xl font-extrabold text-gray-900 mb-6">Invista na sua bancada</h2>
            <p className="text-gray-600 text-lg">
              Sem taxas escondidas ou surpresas no fim do mês. Escolha o plano que melhor se adapta à sua assistência e libere todos os recursos.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto items-center">
            
            {/* Plano Mensal */}
            <div className="bg-white rounded-[2rem] p-8 md:p-10 border border-gray-200 shadow-xl shadow-purple-900/5 hover:border-purple-300 transition-all flex flex-col relative h-full">
              <div className="mb-6">
                 <h3 className="text-2xl font-bold text-gray-900 mb-2">Plano Pro <span className="text-gray-500 font-medium">Mensal</span></h3>
                 <p className="text-gray-500">Pague mês a mês, cancele quando quiser.</p>
              </div>
              <div className="mb-8 border-b border-gray-100 pb-8">
                 <span className="text-5xl font-extrabold text-gray-900">R$ 29,90</span>
                 <span className="text-gray-500 font-medium">/mês</span>
              </div>
              <ul className="space-y-5 mb-10 flex-1">
                 <li className="flex items-center gap-3 text-gray-700 font-medium"><CheckCircle2 className="w-5 h-5 text-purple-600" /> Ordens de serviço ilimitadas</li>
                 <li className="flex items-center gap-3 text-gray-700 font-medium"><CheckCircle2 className="w-5 h-5 text-purple-600" /> Controle total de comissões</li>
                 <li className="flex items-center gap-3 text-gray-700 font-medium"><CheckCircle2 className="w-5 h-5 text-purple-600" /> Relatórios de lucro e peças</li>
                 <li className="flex items-center gap-3 text-gray-700 font-medium"><CheckCircle2 className="w-5 h-5 text-purple-600" /> Dashboard completo e seguro</li>
              </ul>
              <Button onClick={() => navigate('/login')} className="w-full bg-purple-50 text-purple-700 hover:bg-purple-100 border border-purple-200 py-6 md:py-7 text-lg font-bold rounded-xl transition-all">
                 Assinar Mensal
              </Button>
            </div>

            {/* Plano Anual (Destaque) */}
            <div className="bg-gradient-to-br from-purple-700 to-purple-900 rounded-[2rem] p-8 md:p-10 border-2 border-purple-400 shadow-2xl shadow-purple-900/30 md:scale-105 flex flex-col relative overflow-hidden z-10 h-full">
              {/* Brilhos de Fundo */}
              <div className="absolute top-0 right-0 w-[200px] h-[200px] bg-white/10 rounded-full blur-[50px] pointer-events-none" />
              
              <div className="absolute top-0 right-10 bg-[#25D366] text-white font-bold text-xs px-4 py-1.5 rounded-b-lg uppercase tracking-wider shadow-md">
                 Mais Popular
              </div>
              
              <div className="mb-6 relative z-10">
                 <div className="flex flex-wrap items-center gap-3 mb-2">
                    <h3 className="text-2xl font-bold text-white">Plano Pro <span className="text-purple-300 font-medium">Anual</span></h3>
                    <Badge className="bg-green-500/20 text-green-300 border-green-500/30">15% OFF</Badge>
                 </div>
                 <p className="text-purple-200">2 meses totalmente grátis para você!</p>
              </div>
              <div className="mb-8 border-b border-purple-500/30 pb-8 relative z-10">
                 <span className="text-5xl font-extrabold text-white">R$ 299,90</span>
                 <span className="text-purple-300 font-medium">/ano</span>
                 <div className="mt-2 text-sm text-green-300 font-bold px-3 py-1.5 bg-green-500/10 rounded-md inline-block">O equivalente a apenas R$ 24,99 por mês</div>
              </div>
              <ul className="space-y-5 mb-10 flex-1 relative z-10">
                 <li className="flex items-center gap-3 text-purple-50 font-medium"><CheckCircle2 className="w-5 h-5 text-green-400" /> Todas as funções sem limites</li>
                 <li className="flex items-center gap-3 text-purple-50 font-medium"><CheckCircle2 className="w-5 h-5 text-green-400" /> Sem surpresas: pague só 1 vez ao ano</li>
                 <li className="flex items-center gap-3 font-bold text-white"><Zap className="w-5 h-5 text-green-400 fill-green-400" /> Economize R$ 58,90 nesta assinatura</li>
                 <li className="flex items-center gap-3 text-purple-50 font-medium"><CheckCircle2 className="w-5 h-5 text-green-400" /> Tranquilidade para evoluir seu laboratório</li>
              </ul>
              <Button onClick={() => navigate('/login')} className="w-full bg-white text-purple-800 hover:bg-gray-100 shadow-xl py-6 md:py-7 text-lg font-bold rounded-xl transition-all hover:scale-105 active:scale-95 relative z-10">
                 Assinar Anual com Desconto
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Depoimentos */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-extrabold text-gray-900 mb-4 tracking-tight">Quem usa, aprova</h2>
            <p className="text-gray-500 text-lg">Milhares de assistências já abandonaram o caderno e planilhas.</p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            {depoimentos.map((d, i) => (
              <div key={i} className="bg-slate-50 p-8 rounded-[2.5rem] border border-gray-100 relative shadow-sm hover:shadow-md transition-shadow">
                 <div className="flex gap-1 mb-6">
                    {[...Array(d.stars)].map((_, s) => (
                      <Star key={s} className="w-4 h-4 text-amber-500 fill-amber-500" />
                    ))}
                 </div>
                 <p className="text-gray-700 italic mb-8 relative z-10 leading-relaxed">"{d.text}"</p>
                 <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-purple-600 rounded-full flex items-center justify-center text-white font-bold text-xs">
                      {d.name.charAt(0)}
                    </div>
                    <div>
                       <p className="font-bold text-gray-900 text-sm">{d.name}</p>
                       <p className="text-[11px] text-purple-600 font-bold uppercase">{d.loja}</p>
                    </div>
                 </div>
                 <div className="absolute top-8 right-8 text-purple-100 italic font-serif text-6xl pointer-events-none opacity-50">“</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Final Foco Conversão Máxima */}
      <section className="py-24 relative overflow-hidden bg-white">
        <div className="max-w-5xl mx-auto px-4 text-center relative z-10">
          <div className="bg-gradient-to-br from-purple-700 to-purple-900 p-12 lg:p-24 rounded-[3rem] shadow-2xl shadow-purple-900/20 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-white/10 rounded-full blur-[100px] pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-[300px] h-[300px] bg-fuchsia-500/20 rounded-full blur-[80px] pointer-events-none" />

            <h2 className="text-4xl md:text-6xl font-extrabold text-white mb-6 tracking-tight relative z-10">
              Pronto para organizar<br />o seu laboratório?
            </h2>
            <p className="text-xl text-purple-100 mb-10 max-w-2xl mx-auto relative z-10 leading-relaxed font-medium">
              Tenha total controle sobre as peças, acompanhe o lucro real e gerencie sua equipe de técnicos de forma simples e livre de erros.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center relative z-10">
              <Button onClick={() => navigate('/login')} className="w-full sm:w-auto bg-white hover:bg-gray-50 text-purple-700 px-10 py-7 text-xl font-extrabold rounded-2xl shadow-xl hover:-translate-y-1 transition-transform">
                Criar conta grátis
              </Button>
              <a href={wppLink} target="_blank" rel="noreferrer" className="w-full sm:w-auto mt-4 sm:mt-0 flex items-center justify-center gap-2 text-white bg-purple-800/50 border border-purple-400/30 px-8 py-7 rounded-2xl hover:bg-purple-800 transition-all font-semibold text-lg hover:-translate-y-1 shadow-lg">
                <MessageCircle className="w-6 h-6" /> Falar no WhatsApp
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Footer Focado */}
      <footer className="bg-white py-12 border-t border-gray-100">
        <div className="max-w-7xl mx-auto px-4 flex flex-col md:flex-row justify-between items-center gap-6 text-sm text-gray-500">
          <div className="flex items-center gap-2 grayscale hover:grayscale-0 transition-all group">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-100 to-purple-200 group-hover:from-purple-600 group-hover:to-purple-800 flex items-center justify-center transition-colors">
              <Zap className="w-4 h-4 text-purple-600 group-hover:text-white transition-colors" />
            </div>
            <span className="font-bold text-gray-900 text-lg tracking-tight">Store Tech</span>
          </div>

          <div className="flex flex-col md:flex-row items-center gap-6">
            <span className="flex items-center gap-2 bg-slate-50 px-4 py-2 rounded-xl border border-gray-100 shadow-sm">
              <Phone className="w-4 h-4 text-purple-600" />
              <span className="text-gray-900 font-medium">{formattedPhone}</span>
            </span>
            <span className="flex items-center gap-2">
              Dúvidas? <a href={wppLink} target="_blank" rel="noreferrer" className="text-purple-600 font-bold hover:text-purple-800 hover:underline">Chame no WhatsApp</a>
            </span>
          </div>

          <div className="font-medium text-gray-400">
            &copy; {new Date().getFullYear()} Store Tech. Todos os direitos reservados.
          </div>
        </div>
      </footer>
    </div>
  )
}