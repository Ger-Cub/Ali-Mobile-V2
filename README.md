# Ali Mobile V2 📱⚡

**Ali Mobile V2** est une plateforme intégrée de gestion de crédit pour la vente de smartphones, de suivi des contrats et de pilotage des transactions d'utilités et de mobile money (Airtel Money, Vodacom M-Pesa, Voda-e).

Conçue pour un environnement opérationnel rapide, sécurisé et multi-utilisateurs, l'application propose un tableau de bord complet avec synchronisation en temps réel (Supabase Realtime), gestion des rôles (Administrateurs, Superviseurs, Opérateurs, Agents), suivi du recouvrement et simulateur de verrouillage Knox.

---

## 🚀 Fonctionnalités Clés

### 1. 💼 Gestion des Contrats de Crédit & Ventes
- **Souscription simplifiée** : Enregistrement des clients, validation d'identité, sélection du smartphone (IMEI) et affectation d'un agent.
- **Plans de paiement flexibles** : Échéancier hebdomadaire (8x) ou mensuel (2x) avec calcul automatique des acomptes et des soldes restants.
- **Génération & Impression de Contrats** : Export PDF haute résolution du contrat de vente officiel avec clauses légales et signataires.
- **Exportation Excel (.xlsx)** : Téléchargement instantané de l'état du portefeuille de contrats et des paiements.

### 2. 📲 Services d'Utilités & Telecom (Transactions)
- **Multi-opérateurs** : Prise en charge d'Airtel Money, Vodacom M-Pesa et **Voda-e (Unités)**.
- **Double Devise** : Enregistrement en **USD ($)** et **CDF (Francs Congolais)**.
- **Performances instantanées** : Soumission ultra-rapide optimisée avec mise à jour immédiate du flux sans rechargement lourd.
- **KPIs & Statistiques en direct** : Visualisation des volumes globaux, volumes par devise et volumes ventilés par opérateur.

### 3. 🛡️ Recouvrement, Alertes & Verrouillage Knox
- **Détection des retards** : Suivi automatisé des impayés et des clients en défaut d'échéance.
- **Simulateur Knox Guard** : Déclenchement de verrouillage / déverrouillage Knox pour la gestion des smartphones sous crédit en retard de paiement.
- **Journal d'incidents** : Traçabilité des actions entreprises pour la régularisation des dossiers.

### 4. 👥 Gestion des Rôles & Sécurité
- **Authentification sécurisée** basée sur Supabase Auth.
- **Contrôle d'accès basé sur les rôles (RBAC)** :
  - **Admin** : Accès total, gestion des utilisateurs, exportations et suppression.
  - **Supervisor / Agent** : Suivi des ventes, gestion des clients et recouvrement.
  - **Operator** : Dédié à la caisse et aux transactions d'utilités.
- **Sécurité au niveau des lignes (RLS)** pour garantir l'intégrité et la confidentialité des données.

---

## 🛠️ Stack Technique

- **Frontend** : [React 19](https://react.dev/), [TypeScript](https://www.typescriptlang.org/), [Vite](https://vitejs.dev/)
- **Styles & UI** : [Tailwind CSS v4](https://tailwindcss.com/), [Lucide React](https://lucide.dev/), [Framer Motion](https://www.framer.com/motion/)
- **Base de données & Temps réel** : [Supabase](https://supabase.com/) (PostgreSQL, Realtime, Row Level Security)
- **Documents & Exports** : [jsPDF](https://github.com/parallax/jsPDF), [html2canvas](https://html2canvas.hertzen.com/), [SheetJS (xlsx)](https://sheetjs.com/)

---

## 📦 Installation & Démarrage Local

### Prérequis
- [Node.js](https://nodejs.org/) (version 18 ou supérieure)
- Un compte et un projet [Supabase](https://supabase.com/)

### 1. Cloner le projet
```bash
git clone https://github.com/Ger-Cub/Ali-Mobile-V2.git
cd Ali-Mobile-V2
```

### 2. Installer les dépendances
```bash
npm install
```

### 3. Configuration des variables d'environnement
Créez un fichier `.env` à la racine du projet :

```env
VITE_SUPABASE_URL=https://votre-projet.supabase.co
VITE_SUPABASE_ANON_KEY=votre-cle-anon-publique
```

### 4. Lancer le serveur de développement
```bash
npm run dev
```
L'application est accessible sur `http://localhost:3000`.

---

## 🗄️ Schéma de Base de Données & Migrations

Les scripts SQL pour initialiser ou mettre à jour la base de données Supabase se trouvent à la racine :

| Fichier | Description |
|---|---|
| `supabase_schema.sql` | Schéma initial de base (agents, clients, smartphones, contrats, paiements). |
| `migration_v2_enhancements.sql` | Ajout de la table des transactions d'utilités, RLS et realtime. |
| `migration_v3_transactions_currency_and_password_fix.sql` | Prise en charge multi-devises (USD / CDF) et correction des politiques profils. |
| `migration_v4_perf_transactions_indexes.sql` | **Optimisations de performance** (index RLS et index d'accélération des requêtes sur les transactions). |

> **Pour appliquer une migration :** Ouvrez le **SQL Editor** sur votre dashboard Supabase, copiez-collez le contenu du fichier désiré et exécutez (`Run`).

---

## 🏗️ Commandes Utiles

- `npm run dev` : Lance l'environnement local avec rechargement à chaud.
- `npm run build` : Compile l'application TypeScript en assets de production optimisés dans `dist/`.
- `npm run preview` : Prévisualise localement le build de production.
- `npm run lint` : Vérification des types TypeScript sans émission de code (`tsc --noEmit`).

---

## 📄 Licence

Propriété exclusive de **Ali Mobile**. Tous droits réservés.
