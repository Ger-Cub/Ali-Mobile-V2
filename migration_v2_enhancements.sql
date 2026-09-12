-- ============================================================================
-- ALI MOBILE V2 - SCRIPT DE MIGRATION DÉDIÉ : V2 ENHANCEMENTS
-- ============================================================================
-- Ce script contient uniquement les ajouts et modifications nécessaires pour
-- mettre à jour votre base de données existante sans perdre aucune donnée.
-- À exécuter dans le SQL Editor de Supabase (https://supabase.com).
-- ============================================================================

-- 1. AJOUT DU CHAMP VILLE POUR LES AGENTS
-- Permet de stocker la ville de l'agent (utilisée pour le lieu de signature du contrat)
ALTER TABLE public.agents ADD COLUMN IF NOT EXISTS city TEXT DEFAULT 'Goma';

-- 2. AJOUT DU RÔLE 'operator' EN PLUS DE 'admin' ET 'agent'
ALTER TABLE public.agents DROP CONSTRAINT IF EXISTS agents_role_check;
ALTER TABLE public.agents ADD CONSTRAINT agents_role_check 
  CHECK (role IN ('admin', 'agent', 'operator'));

-- 3. MISE À JOUR DE LA FONCTION DE CRÉATION D'UTILISATEURS (ADMIN)
-- Supporte désormais le rôle 'operator' et la ville d'affectation
CREATE OR REPLACE FUNCTION public.create_agent_user(
  email TEXT,
  password TEXT,
  name TEXT,
  phone TEXT,
  code TEXT,
  role TEXT,
  city TEXT DEFAULT 'Goma'
) RETURNS UUID AS $$
DECLARE
  new_user_id UUID;
BEGIN
  -- Vérification des privilèges administrateur
  IF auth.uid() IS NOT NULL AND NOT EXISTS (
    SELECT 1 FROM public.agents 
    WHERE agents.id = auth.uid() AND agents.role = 'admin'
  ) THEN
    RAISE EXCEPTION 'Seuls les administrateurs peuvent créer de nouveaux comptes.';
  END IF;

  -- Insertion sécurisée dans auth.users
  INSERT INTO auth.users (
    instance_id,
    id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    recovery_sent_at,
    last_sign_in_at,
    raw_app_meta_data,
    raw_user_meta_data,
    created_at,
    updated_at,
    confirmation_token,
    email_change,
    email_change_token_new,
    recovery_token
  ) VALUES (
    '00000000-0000-0000-0000-000000000000',
    gen_random_uuid(),
    'authenticated',
    'authenticated',
    email,
    crypt(password, gen_salt('bf')),
    now(),
    now(),
    now(),
    '{"provider":"email","providers":["email"]}',
    jsonb_build_object('name', name, 'role', role, 'code', code, 'phone', phone, 'city', city),
    now(),
    now(),
    '',
    '',
    '',
    ''
  ) RETURNING id INTO new_user_id;

  -- Insertion ou mise à jour dans public.agents
  INSERT INTO public.agents (
    id,
    name,
    email,
    phone,
    code,
    role,
    city
  ) VALUES (
    new_user_id,
    name,
    email,
    phone,
    code,
    role,
    city
  )
  ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    phone = EXCLUDED.phone,
    code = EXCLUDED.code,
    role = EXCLUDED.role,
    city = EXCLUDED.city;

  RETURN new_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. CRÉATION DE LA TABLE DES TRANSACTIONS D'UTILITÉS (AIRTEL / VODACOM)
CREATE TABLE IF NOT EXISTS public.transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_name TEXT NOT NULL,
    transaction_type TEXT NOT NULL CHECK (transaction_type IN ('dépôt', 'retrait')),
    phone_number TEXT NOT NULL,
    amount NUMERIC NOT NULL,
    operator TEXT NOT NULL CHECK (operator IN ('Airtel', 'Vodacom')),
    operator_transaction_number TEXT NOT NULL,
    reference_number TEXT NOT NULL,
    reason TEXT NOT NULL,
    operator_id UUID NOT NULL REFERENCES public.agents(id) ON DELETE RESTRICT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 5. ACTIVATION DE LA SÉCURITÉ ROW LEVEL SECURITY (RLS)
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

-- Supprimer les politiques existantes si elles existent déjà pour éviter les doublons
DROP POLICY IF EXISTS "Allow read transactions for all authenticated users" ON public.transactions;
DROP POLICY IF EXISTS "Allow insert transactions for authenticated operators and admins" ON public.transactions;

-- Lecture pour tous les utilisateurs authentifiés
CREATE POLICY "Allow read transactions for all authenticated users"
ON public.transactions FOR SELECT
TO authenticated
USING (true);

-- Écriture autorisée pour les administrateurs et les opérateurs
CREATE POLICY "Allow insert transactions for authenticated operators and admins"
ON public.transactions FOR INSERT
TO authenticated
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.agents 
        WHERE agents.id = auth.uid() AND agents.role IN ('admin', 'operator')
    )
);

-- 6. AJOUT À LA PUBLICATION REALTIME (optionnel mais recommandé pour synchronisation en direct)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.transactions;
  END IF;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;
