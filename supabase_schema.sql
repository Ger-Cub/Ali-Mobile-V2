-- ALI MOBILE - SUPABASE BACKEND DATABASE SCHEMA
-- Execute this script in your Supabase SQL Editor (https://supabase.com)

-- Enable pgcrypto extension for password hashing
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 1. Create AGENTS table
CREATE TABLE IF NOT EXISTS public.agents (
    id UUID PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    phone TEXT NOT NULL,
    code TEXT NOT NULL UNIQUE,
    role TEXT NOT NULL DEFAULT 'agent' CHECK (role IN ('admin', 'agent')),
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.agents ENABLE ROW LEVEL SECURITY;

-- 2. Create SMARTPHONES table
CREATE TABLE IF NOT EXISTS public.smartphones (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    brand TEXT NOT NULL,
    model TEXT NOT NULL,
    value_usd NUMERIC NOT NULL,
    imei TEXT NOT NULL UNIQUE,
    created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.smartphones ENABLE ROW LEVEL SECURITY;

-- 3. Create CLIENTS table
CREATE TABLE IF NOT EXISTS public.clients (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    last_name TEXT NOT NULL,
    middle_name TEXT,
    first_name TEXT NOT NULL,
    phone_whatsapp TEXT NOT NULL,
    phone_urgency TEXT NOT NULL,
    address_num TEXT NOT NULL,
    address_avenue TEXT NOT NULL,
    neighborhood TEXT NOT NULL,
    city_commune TEXT NOT NULL,
    identity_doc_type TEXT NOT NULL,
    identity_doc_num TEXT NOT NULL,
    registered_at DATE NOT NULL DEFAULT CURRENT_DATE,
    agent_id UUID NOT NULL REFERENCES public.agents(id) ON DELETE RESTRICT,
    identity_card_photo TEXT, -- base64 string
    created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;

-- 4. Create CONTRACTS table
CREATE TABLE IF NOT EXISTS public.contracts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    contract_number TEXT NOT NULL UNIQUE,
    client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
    smartphone_id UUID NOT NULL REFERENCES public.smartphones(id) ON DELETE RESTRICT,
    subscription_date DATE NOT NULL DEFAULT CURRENT_DATE,
    plan_type TEXT NOT NULL CHECK (plan_type IN ('hebdo', 'mensuel')),
    initial_deposit_usd NUMERIC NOT NULL,
    installment_amount_usd NUMERIC NOT NULL,
    total_installments INTEGER NOT NULL,
    payment_day TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'en_cours' CHECK (status IN ('en_cours', 'termine', 'en_retard', 'bloque')),
    agent_id UUID NOT NULL REFERENCES public.agents(id) ON DELETE RESTRICT,
    created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.contracts ENABLE ROW LEVEL SECURITY;

-- 5. Create PAYMENTS table
CREATE TABLE IF NOT EXISTS public.payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    contract_number TEXT NOT NULL REFERENCES public.contracts(contract_number) ON DELETE CASCADE,
    client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
    amount_usd NUMERIC NOT NULL,
    amount_cdf NUMERIC NOT NULL,
    date TIMESTAMPTZ NOT NULL DEFAULT now(),
    due_date DATE NOT NULL,
    payment_method TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'Terminé' CHECK (status IN ('Terminé', 'Échec', 'En attente')),
    transaction_ref TEXT NOT NULL UNIQUE,
    agent_id UUID NOT NULL REFERENCES public.agents(id) ON DELETE RESTRICT,
    created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

-- 6. Create DELAY_RECORDS table
CREATE TABLE IF NOT EXISTS public.delay_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    contract_number TEXT NOT NULL REFERENCES public.contracts(contract_number) ON DELETE CASCADE,
    client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
    due_date DATE NOT NULL,
    amount_usd NUMERIC NOT NULL,
    days_overdue INTEGER NOT NULL,
    status TEXT NOT NULL DEFAULT 'Actif' CHECK (status IN ('Actif', 'Résolu')),
    created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.delay_records ENABLE ROW LEVEL SECURITY;


--------------------------------------------------------------------------------
-- ROW LEVEL SECURITY POLICIES
--------------------------------------------------------------------------------

-- Agents Table Policies
CREATE POLICY "Allow read access to agents for all authenticated users"
ON public.agents FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Allow write access to agents for admins only"
ON public.agents FOR ALL
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.agents 
        WHERE agents.id = auth.uid() AND agents.role = 'admin'
    )
);

-- Smartphones Table Policies
CREATE POLICY "Allow read access to smartphones for all authenticated users"
ON public.smartphones FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Allow all access to smartphones for admins only"
ON public.smartphones FOR ALL
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.agents 
        WHERE agents.id = auth.uid() AND agents.role = 'admin'
    )
);

-- Clients Table Policies
CREATE POLICY "Allow read access to clients for all authenticated users"
ON public.clients FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Allow insert/update/delete to clients for all authenticated users"
ON public.clients FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- Contracts Table Policies
CREATE POLICY "Allow read access to contracts for all authenticated users"
ON public.contracts FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Allow insert/update/delete to contracts for all authenticated users"
ON public.contracts FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- Payments Table Policies
CREATE POLICY "Allow read access to payments for all authenticated users"
ON public.payments FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Allow insert/update/delete to payments for all authenticated users"
ON public.payments FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- Delay Records Table Policies
CREATE POLICY "Allow read access to delay records for all authenticated users"
ON public.delay_records FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Allow insert/update/delete to delay records for all authenticated users"
ON public.delay_records FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);


--------------------------------------------------------------------------------
-- SECURE FUNCTION TO CREATE AGENT USERS (FOR ADMIN USE ONLY)
--------------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.create_agent_user(
  email TEXT,
  password TEXT,
  name TEXT,
  phone TEXT,
  code TEXT,
  role TEXT
) RETURNS UUID AS $$
DECLARE
  new_user_id UUID;
BEGIN
  -- Check if caller is admin (skip check if executing as superuser/no authenticated context)
  IF auth.uid() IS NOT NULL AND NOT EXISTS (
    SELECT 1 FROM public.agents 
    WHERE agents.id = auth.uid() AND agents.role = 'admin'
  ) THEN
    RAISE EXCEPTION 'Only Administrators can create subordinate agent accounts.';
  END IF;

  -- Insert into auth.users using Security Definer
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
    jsonb_build_object('name', name, 'role', role, 'code', code),
    now(),
    now(),
    '',
    '',
    '',
    ''
  ) RETURNING id INTO new_user_id;

  -- Insert into public.agents
  INSERT INTO public.agents (
    id,
    name,
    email,
    phone,
    code,
    role
  ) VALUES (
    new_user_id,
    name,
    email,
    phone,
    code,
    role
  );

  RETURN new_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


--------------------------------------------------------------------------------
-- AUTOMATIC TRIGGER FOR PUBLIC AGENTS RECORD WHEN SIGNING UP THROUGH AUTH
--------------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.handle_new_agent()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.agents (id, name, email, phone, code, role)
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data->>'name', 'Agent de terrain'),
    new.email,
    COALESCE(new.raw_user_meta_data->>'phone', ''),
    COALESCE(new.raw_user_meta_data->>'code', 'AG-NEW'),
    COALESCE(new.raw_user_meta_data->>'role', 'agent')
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_agent();


--------------------------------------------------------------------------------
-- SCRIPT TO SEED SAMPLE DATA (Optional but highly recommended)
--------------------------------------------------------------------------------

-- Seed Smartphones
INSERT INTO public.smartphones (brand, model, value_usd, imei) VALUES
('Samsung', 'Galaxy A15', 180, '354892110298374'),
('Samsung', 'Galaxy A25 5G', 260, '356711220498321'),
('Samsung', 'Galaxy A35 5G', 340, '358901110587213'),
('Samsung', 'Galaxy A55 5G', 450, '359012340123456'),
('Samsung', 'Galaxy S24 FE', 680, '357123990887221')
ON CONFLICT (imei) DO NOTHING;
