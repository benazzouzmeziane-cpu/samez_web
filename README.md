# same'z — Site & back-office

Site vitrine Next.js + espace client + console admin (factures / devis / contacts), branché sur Supabase.

## Stack

- Next.js 16 (App Router) + React 19 + TypeScript
- Supabase (Auth, Postgres, RLS)
- Tailwind CSS 4
- Nodemailer (SMTP Hostinger)
- `@react-pdf/renderer` (PDF factures/devis)

## Démarrage

```bash
npm install
npm run dev
```

## Variables d'environnement

Créer un fichier `.env.local` :

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

ADMIN_EMAILS=contact@samez.fr

SMTP_USER=
SMTP_PASSWORD=

# Création de compte client via formulaire public (#contact)
CONTACT_ALLOW_PUBLIC_ACCOUNT_CREATION=true
# CONTACT_ACCOUNT_CREATION_SECRET=...   # optionnel, chemin interne
```

Sur Vercel, ajouter aussi `CONTACT_ALLOW_PUBLIC_ACCOUNT_CREATION=true`.

## Sécurité / Supabase

1. Exécuter `supabase/schema.sql` (ou les migrations dans `supabase/migrations/`, dont storage + `replace_piece_lines`).
2. Attribuer le rôle admin aux comptes allowlistés :

```sql
UPDATE auth.users
SET raw_app_meta_data = COALESCE(raw_app_meta_data, '{}'::jsonb) || '{"role":"admin"}'::jsonb
WHERE email IN ('contact@samez.fr');
```

3. Se déconnecter / reconnecter pour rafraîchir le JWT (`/api/auth/ensure-admin` le fait aussi au login admin).

Les policies RLS exigent `app_metadata.role = 'admin'` (plus « tout utilisateur non-client »).

## Scripts

| Commande | Description |
|----------|-------------|
| `npm run dev` | Serveur de développement |
| `npm run build` | Build production |
| `npm run start` | Serveur production |
| `npm run lint` | ESLint |

## Structure

- `app/(site)` — pages publiques + espace client
- `app/admin` — console admin
- `app/api` — contact, auth, PDF
- `components/` — UI site / admin
- `lib/` — Supabase, email, helpers admin
- `supabase/` — schéma SQL + migrations
