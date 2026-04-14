// src/hooks/useLojaId.ts
import { useEffect, useState } from "react"
import { supabase } from "../lib/supabase"

export function useLojaId() {
  const [lojaId, setLojaId] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function carregarLojaId() {
      const userStr = sessionStorage.getItem("user")
      if (!userStr) {
        setLoading(false)
        return
      }

      const user = JSON.parse(userStr)
      
      // Se o usuário já tem loja_id no sessionStorage
      if (user.loja_id) {
        setLojaId(user.loja_id)
        setLoading(false)
        return
      }

      // Buscar no banco
      const { data, error } = await supabase
        .from("usuarios")
        .select("loja_id")
        .eq("id", user.id)
        .single()

      if (!error && data?.loja_id) {
        setLojaId(data.loja_id)
        // Atualizar sessionStorage
        user.loja_id = data.loja_id
        sessionStorage.setItem("user", JSON.stringify(user))
      }
      setLoading(false)
    }

    carregarLojaId()
  }, [])

  return { lojaId, loading }
}