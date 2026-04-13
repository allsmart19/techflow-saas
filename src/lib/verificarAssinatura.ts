import { supabase } from "./supabase"

export async function verificarAssinatura(userId: string) {
  const { data } = await supabase
    .from("assinaturas")
    .select("status")
    .eq("user_id", userId)
    .in("status", ["active", "trialing"])
    .maybeSingle()

  return !!data
}