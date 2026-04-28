-- script para adicionar campos comerciais na tabela de configurações da loja
ALTER TABLE public.config_loja 
ADD COLUMN IF NOT EXISTS endereco TEXT,
ADD COLUMN IF NOT EXISTS telefone TEXT,
ADD COLUMN IF NOT EXISTS cnpj TEXT,
ADD COLUMN IF NOT EXISTS cidade TEXT;

-- Garantir que a tabela config_loja tenha RLS e políticas se necessário
-- (Assumindo que já existe baseada no código do service)
