-- ==============================================================================
-- MIGRATION V4 : OPTIMISATION PERFORMANCES TRANSACTIONS & RLS
-- ==============================================================================
-- Description:
-- Ajout d'index de performance pour accélérer la vérification des politiques RLS
-- (Row Level Security) sur les agents et accélérer les requêtes d'insertion/lecture
-- sur la table des transactions (Airtel, Vodacom, Voda-e).
-- ==============================================================================

-- 1. Index composite sur public.agents pour optimiser la vérification RLS (EXISTS ...)
-- Utilisé lors des politiques INSERT sur public.transactions
CREATE INDEX IF NOT EXISTS idx_agents_id_role 
ON public.agents(id, role);

-- 2. Index sur la date de création pour trier rapidement les transactions récentes
CREATE INDEX IF NOT EXISTS idx_transactions_created_at 
ON public.transactions(created_at DESC);

-- 3. Index sur l'opérateur pour filtrer rapidement par opérateur (Voda-e, Vodacom, Airtel)
CREATE INDEX IF NOT EXISTS idx_transactions_operator 
ON public.transactions(operator);

-- 4. Index sur la clé étrangère de l'opérateur/agent ayant enregistré la transaction
CREATE INDEX IF NOT EXISTS idx_transactions_operator_id 
ON public.transactions(operator_id);
