import { supabase } from "./supabase"

export async function bootstrapNovaLoja(params: {
  nomeLoja: string
  userId: string
  username: string
  email?: string
}) {
  try {
    // ======================================================
    // 1. CRIAR LOJA
    // ======================================================
    const { data: loja, error: lojaError } = await supabase
      .from("lojas")
      .insert([
        {
          nome: params.nomeLoja,
          admin_user_id: params.userId
        }
      ])
      .select()
      .single()

    if (lojaError) {
      throw new Error("Erro ao criar loja: " + lojaError.message)
    }

    // ======================================================
    // 2. ATUALIZAR USUÁRIO COMO ADMIN DA LOJA
    // ======================================================
    const { error: userError } = await supabase
      .from("usuarios")
      .update({
        loja_id: loja.id,
        role: "admin_loja"
      })
      .eq("id", params.userId)

    if (userError) {
      throw new Error("Erro ao vincular usuário: " + userError.message)
    }

    // ======================================================
    // 3. CRIAR ASSINATURA TRIAL AUTOMÁTICA (7 DIAS)
    // ======================================================
    const now = new Date()
    const trialEnd = new Date()
    trialEnd.setDate(now.getDate() + 7)

    const { error: assinaturaError } = await supabase
      .from("assinaturas")
      .insert([
        {
          loja_id: loja.id,
          status: "trialing",
          trial_end: trialEnd.toISOString(),
          data_inicio: now.toISOString()
        }
      ])

    if (assinaturaError) {
      throw new Error("Erro ao criar assinatura: " + assinaturaError.message)
    }

    // ======================================================
    // 4. RETORNO FINAL
    // ======================================================
    return {
      success: true,
      lojaId: loja.id,
      message: "Loja criada com sucesso e trial ativado"
    }

  } catch (err: any) {
    console.error("Bootstrap error:", err)
    return {
      success: false,
      error: err.message
    }
  }
}