// src/services/accessService.ts
import { supabase } from "./supabase"

export async function checkAccess(userId: number) {
  console.log("🔍 Verificando acesso para usuário:", userId)

  // Buscar usuário com loja_id
  const { data: user, error: userError } = await supabase
    .from("usuarios")
    .select("id, loja_id, role, created_at")
    .eq("id", userId)
    .single()

  if (userError || !user) {
    console.error("❌ Erro ao buscar usuário:", userError)
    return { hasAccess: false, reason: "USUARIO_NAO_ENCONTRADO", daysLeft: 0 }
  }

  // Master tem acesso total
  if (user.role === "master") {
    console.log("✅ Usuário master: acesso liberado")
    return { hasAccess: true, reason: "MASTER", daysLeft: -1 }
  }

  if (!user.loja_id) {
    console.error("❌ Usuário sem loja_id")
    return { hasAccess: false, reason: "SEM_LOJA", daysLeft: 0 }
  }

  const now = new Date()

  // ======================================================
  // 1. BUSCAR LOJA (DATA DE CRIAÇÃO PARA TRIAL)
  // ======================================================
  const { data: loja, error: lojaError } = await supabase
    .from("lojas")
    .select("created_at, plano, ativo")
    .eq("id", user.loja_id)
    .single()

  if (lojaError) {
    console.error("❌ Erro ao buscar loja:", lojaError)
    return { hasAccess: false, reason: "ERRO_LOJA", daysLeft: 0 }
  }

  // Calcular dias desde a criação da loja
  const createdAt = new Date(loja.created_at)
  const diffDays = (now.getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24)
  const trialDaysLeft = Math.max(0, 7 - diffDays)
  const isInTrial = diffDays <= 7

  console.log(`📅 Loja criada em: ${createdAt.toLocaleDateString()}`)
  console.log(`📅 Dias desde criação: ${diffDays.toFixed(2)}`)
  console.log(`🎁 Dias restantes de trial: ${trialDaysLeft.toFixed(0)}`)

  // ======================================================
  // 2. BUSCAR ASSINATURA ATIVA
  // ======================================================
  const { data: assinatura, error: assError } = await supabase
    .from("assinaturas")
    .select("*")
    .eq("user_id", userId)
    .in("status", ["active", "trialing"])
    .maybeSingle()

  if (assError) {
    console.error("❌ Erro ao buscar assinatura:", assError)
  }

  // ======================================================
  // 3. VERIFICAR ACESSO
  // ======================================================
  
  // Caso 1: Assinatura ativa
  if (assinatura?.status === "active") {
    if (assinatura.data_expiracao) {
      const exp = new Date(assinatura.data_expiracao)
      if (exp > now) {
        console.log("✅ Acesso liberado: assinatura ativa")
        return { hasAccess: true, reason: "ASSINATURA_ATIVA", daysLeft: -1 }
      }
    } else {
      console.log("✅ Acesso liberado: assinatura ativa (sem expiração)")
      return { hasAccess: true, reason: "ASSINATURA_ATIVA", daysLeft: -1 }
    }
  }

  // Caso 2: Período de teste (7 dias)
  if (isInTrial) {
    console.log(`✅ Acesso liberado: período de teste (${Math.ceil(trialDaysLeft)} dias restantes)`)
    return { 
      hasAccess: true, 
      reason: "TRIAL", 
      daysLeft: Math.ceil(trialDaysLeft),
      trialEndDate: new Date(createdAt.getTime() + 7 * 24 * 60 * 60 * 1000)
    }
  }

  // Caso 3: Assinatura em trial (stripe)
  if (assinatura?.status === "trialing") {
    if (assinatura.trial_end) {
      const trialEnd = new Date(assinatura.trial_end)
      if (trialEnd > now) {
        const stripeDaysLeft = Math.ceil((trialEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
        console.log(`✅ Acesso liberado: trial do Stripe (${stripeDaysLeft} dias restantes)`)
        return { hasAccess: true, reason: "STRIPE_TRIAL", daysLeft: stripeDaysLeft }
      }
    }
  }

  // Caso 4: Bloqueado
  console.log("❌ Acesso bloqueado: período de teste expirado")
  return { 
    hasAccess: false, 
    reason: "EXPIRADO", 
    daysLeft: 0,
    message: "Seu período de teste de 7 dias expirou. Assine um plano para continuar."
  }
}