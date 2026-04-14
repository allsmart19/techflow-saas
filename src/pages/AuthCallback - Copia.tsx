// src/pages/AuthCallback.tsx
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Loader2 } from 'lucide-react';

export default function AuthCallback() {
  const navigate = useNavigate();

  useEffect(() => {
    const handleCallback = async () => {
      const { data: { user }, error } = await supabase.auth.getUser();
      
      if (error || !user) {
        navigate('/login');
        return;
      }

      // Verificar se usuário já existe na tabela usuarios
      const { data: existingUser } = await supabase
        .from('usuarios')
        .select('id, username, role, loja_id')
        .eq('email', user.email)
        .single();

      let userId = existingUser?.id;
      let userRole = existingUser?.role || 'user';
      let userLojaId = existingUser?.loja_id;

      if (!existingUser) {
        // Criar novo usuário na tabela
        const username = user.user_metadata?.full_name || user.email?.split('@')[0] || 'user';
        
        // Obter uma loja_id padrão (ou criar uma nova loja para o usuário)
        const { data: lojaPadrao } = await supabase
          .from('lojas')
          .select('id')
          .eq('id', 2)
          .single();

        const lojaId = lojaPadrao?.id || 1;

        const { data: newUser, error: insertError } = await supabase
          .from('usuarios')
          .insert({
            username: username.toLowerCase(),
            email: user.email,
            role: 'user',
            ativo: true,
            comissao_percentual: 10.00,
            loja_id: lojaId
          })
          .select()
          .single();

        if (insertError) {
          console.error('Erro ao criar usuário:', insertError);
          navigate('/login');
          return;
        }

        userId = newUser.id;
        userRole = newUser.role;
        userLojaId = newUser.loja_id;
      }

      // Salvar no sessionStorage (em vez de localStorage)
      sessionStorage.setItem('user', JSON.stringify({
        id: userId,
        username: existingUser?.username || user.user_metadata?.username,
        email: user.email,
        role: userRole,
        loja_id: userLojaId
      }));

      navigate('/dashboard');
    };

    handleCallback();
  }, [navigate]);

  return (
    <div className="flex items-center justify-center h-screen bg-gray-50 dark:bg-gray-900">
      <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
      <span className="ml-2 text-gray-600 dark:text-gray-400">Autenticando...</span>
    </div>
  );
}