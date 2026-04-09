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
        .select('id, username, role')
        .eq('email', user.email)
        .single();

      if (!existingUser) {
        // Criar novo usuário na tabela
        const username = user.user_metadata?.full_name || user.email?.split('@')[0] || 'user';
        
        await supabase
          .from('usuarios')
          .insert({
            username: username.toLowerCase(),
            email: user.email,
            role: 'user',
            ativo: true,
            comissao_percentual: 10.00
          });
      }

      // Buscar dados atualizados
      const { data: userData } = await supabase
        .from('usuarios')
        .select('id, username, role')
        .eq('email', user.email)
        .single();

      localStorage.setItem('user', JSON.stringify({
        id: userData?.id,
        username: userData?.username,
        email: user.email,
        role: userData?.role || 'user'
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