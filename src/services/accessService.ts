// src/services/accessService.ts
import { supabase } from "./supabase"

export async function checkAccess(userId: number) {
  console.log("🔍 Verificando acesso para usuário:", userId)

  // Buscar usuário com loja_id
  const { data: user, error: userError } = await supabase
    .from("usuarios")
    .select("id, loja_id, role")
    .eq("id", userId)
    .single()

  if (userError || !user) {
    console.error("❌ Erro ao buscar usuário:", userError)
    return { hasAccess: false, reason: "USUARIO_NAO_ENCONTRADO" }
  }

  // Master tem acesso total (super admin)
  if (user.role === "master") {
    console.log("✅ Usuário master: acesso liberado")
    return { hasAccess: true, reason: "MASTER", loja_id: user.loja_id }
  }

  // Se não tem loja_id, bloquear
  if (!user.loja_id) {
    console.error("❌ Usuário sem loja_id")
    return { hasAccess: false, reason: "SEM_LOJA" }
  }

  return { hasAccess: true, reason: "OK", loja_id: user.loja_id, role: user.role }
}