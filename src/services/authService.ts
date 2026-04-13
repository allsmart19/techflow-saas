// src/services/authService.ts
import { supabase } from '../lib/supabase';

export interface UsuarioAuth {
  id: number;
  username: string;
  email: string;
  role: string;
  avatar_url?: string;
}

export async function signUpWithEmail(email: string, password: string, username: string) {
  try {
    // 1. Criar usuário no Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { username }
      }
    });

    if (authError) throw authError;

    if (authData.user) {
      // 2. Criar uma nova loja para o usuário
      const slug = username.toLowerCase().replace(/\s/g, '-') + '-' + Date.now();
      const { data: lojaData, error: lojaError } = await supabase
        .from('lojas')
        .insert({
          nome_loja: `${username} - TechFlow`,
          slug: slug,
          plano: 'pro',
          ativo: true
        })
        .select()
        .single();

      if (lojaError) {
        console.error('Erro ao criar loja:', lojaError);
        // Se falhar ao criar loja, usar loja padrão (id=2)
        const { data: lojaPadrao } = await supabase
          .from('lojas')
          .select('id')
          .eq('id', 2)
          .single();
        
        // 3. Inserir na tabela usuarios como admin_loja
        const { error: insertError } = await supabase
          .from('usuarios')
          .insert({
            username: username.toLowerCase(),
            email: email,
            role: 'admin_loja',  // 🔥 ADMINISTRADOR DA LOJA
            ativo: true,
            comissao_percentual: 10.00,
            loja_id: lojaPadrao?.id || 2
          });
        
        if (insertError) console.error('Erro ao inserir usuario:', insertError);
      } else {
        // 3. Inserir na tabela usuarios como admin_loja com a loja criada
        const { error: insertError } = await supabase
          .from('usuarios')
          .insert({
            username: username.toLowerCase(),
            email: email,
            role: 'admin_loja',  // 🔥 ADMINISTRADOR DA LOJA
            ativo: true,
            comissao_percentual: 10.00,
            loja_id: lojaData.id
          });
        
        if (insertError) console.error('Erro ao inserir usuario:', insertError);
      }
    }

    return { success: true, data: authData };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function signInWithEmail(email: string, password: string) {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) throw error;

    // Buscar dados do usuário na tabela usuarios
    const { data: userData } = await supabase
      .from('usuarios')
      .select('id, username, role, loja_id')
      .eq('email', email)
      .single();

    sessionStorage.setItem('user', JSON.stringify({
      id: userData?.id,
      username: userData?.username || data.user?.user_metadata?.username,
      email: data.user?.email,
      role: userData?.role || 'user',
      loja_id: userData?.loja_id
    }));

    return { success: true, data };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function signInWithGoogle() {
  try {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`
      }
    });

    if (error) throw error;
    return { success: true, url: data.url };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function signOut() {
  sessionStorage.removeItem("user");
  await supabase.auth.signOut();
}

export async function getCurrentUser() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: userData } = await supabase
    .from('usuarios')
    .select('id, username, role, loja_id')
    .eq('email', user.email)
    .single();

  return {
    id: userData?.id,
    username: userData?.username || user.user_metadata?.username,
    email: user.email,
    role: userData?.role || 'user',
    loja_id: userData?.loja_id
  };
}
