-- ==============================================================================
-- MIGRATION V3 : ALI MOBILE - TRANSACTIONS DEVISE (USD/CDF), VODA-E & FIX AUTH SESSION
-- ==============================================================================

-- 1. AJOUT DE LA COLONNE 'currency' DANS LA TABLE TRANSACTIONS
ALTER TABLE public.transactions 
ADD COLUMN IF NOT EXISTS currency TEXT NOT NULL DEFAULT 'USD';

-- S'assurer de la contrainte CHECK sur currency ('USD' ou 'CDF')
DO $$
BEGIN
  ALTER TABLE public.transactions DROP CONSTRAINT IF EXISTS transactions_currency_check;
  ALTER TABLE public.transactions ADD CONSTRAINT transactions_currency_check CHECK (currency IN ('USD', 'CDF'));
EXCEPTION
  WHEN undefined_table THEN NULL;
END $$;

-- 2. MISE À JOUR DE LA CONTRAINTE SUR L'OPÉRATEUR POUR INCLURE 'Voda-e'
DO $$
BEGIN
  ALTER TABLE public.transactions DROP CONSTRAINT IF EXISTS transactions_operator_check;
  ALTER TABLE public.transactions ADD CONSTRAINT transactions_operator_check CHECK (operator IN ('Airtel', 'Vodacom', 'Voda-e'));
EXCEPTION
  WHEN undefined_table THEN NULL;
END $$;

-- 3. FONCTION RPC POUR DÉFINIR LE MOT DE PASSE SANS SESSION AUTH ACTIVE
-- Résout définitivement l'erreur "Auth session missing!" lors de la définition
-- du mot de passe initial ou réinitialisé par un employé
CREATE OR REPLACE FUNCTION public.set_user_password_by_email(
  target_email TEXT, 
  new_password TEXT
)
RETURNS VOID AS $$
DECLARE
  matched_user_id UUID;
BEGIN
  -- Nettoyage de l'email
  target_email := lower(trim(target_email));

  -- Vérifier la longueur minimale du mot de passe
  IF length(new_password) < 6 THEN
    RAISE EXCEPTION 'Le mot de passe doit comporter au moins 6 caractères.';
  END IF;

  -- Trouver l'utilisateur correspondant dans auth.users
  SELECT id INTO matched_user_id 
  FROM auth.users 
  WHERE lower(email) = target_email
  LIMIT 1;

  IF matched_user_id IS NULL THEN
    RAISE EXCEPTION 'Aucun compte utilisateur trouvé pour l''adresse email : %', target_email;
  END IF;

  -- Mettre à jour le mot de passe crypté et valider l'email
  UPDATE auth.users
  SET encrypted_password = crypt(new_password, gen_salt('bf')),
      email_confirmed_at = COALESCE(email_confirmed_at, now()),
      updated_at = now()
  WHERE id = matched_user_id;

END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Accorder l'exécution de la fonction au rôle anonyme et authentifié
GRANT EXECUTE ON FUNCTION public.set_user_password_by_email(TEXT, TEXT) TO anon, authenticated, service_role;
