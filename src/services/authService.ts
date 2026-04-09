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

    // 2. Inserir na tabela usuarios (sem o campo senha)
    if (authData.user) {
      const { error: insertError } = await supabase
        .from('usuarios')
        .insert({
          username: username.toLowerCase(),
          email: email,
          role: 'user',
          ativo: true,
          comissao_percentual: 10.00
          // senha NÃO é enviada (será NULL)
        });

      if (insertError && insertError.code !== '23505') {
        console.error('Erro ao inserir usuario:', insertError);
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
      .select('id, username, role')
      .eq('email', email)
      .single();

    localStorage.setItem('user', JSON.stringify({
      id: userData?.id,
      username: userData?.username || data.user?.user_metadata?.username,
      email: data.user?.email,
      role: userData?.role || 'user'
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
  localStorage.removeItem('user');
  await supabase.auth.signOut();
}

export async function getCurrentUser() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: userData } = await supabase
    .from('usuarios')
    .select('id, username, role')
    .eq('email', user.email)
    .single();

  return {
    id: userData?.id,
    username: userData?.username || user.user_metadata?.username,
    email: user.email,
    role: userData?.role || 'user'
  };
}