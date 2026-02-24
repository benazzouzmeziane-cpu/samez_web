Analyse complète — same'z (samez.fr)
1. Vue d'ensemble
Type : Site vitrine + back-office de facturation/devis + espace client
Stack : Next.js 16.1.6, React 19, TypeScript 5, Tailwind CSS 4, Supabase (Auth + DB), Framer Motion
Hébergement : Vercel
Domaine : samez.fr

L'application est un site professionnel pour un développeur freelance (Benazzouz Meziane / same'z) avec :

Un site public vitrine (homepage, services, réalisations, à propos, CGV, mentions légales)
Un panel admin (dashboard, gestion contacts, CRUD factures/devis, génération PDF)
Un espace client (login, dashboard avec consultation de ses devis/factures, téléchargement PDF)
2. Architecture & Routing
Route Groups
Groupe	Routes	Rôle
(site)	/, /services, /realisations, /a-propos, /cgv, /mentions-legales, /espace-client	Site public + espace client
admin	/admin/login, /admin, /admin/contacts, /admin/pieces/*	Console d'administration
api	/api/contact, /api/auth/*, /api/pieces/pdf/[id]	API backend
Layouts
Root : Police Inter (Google Fonts), Vercel Analytics, lang fr
Site : Header + Footer wrappant les pages publiques
Admin Dashboard : Sidebar + zone de contenu
3. Base de données (Supabase/PostgreSQL)
4 tables avec RLS (Row Level Security) bien configuré :

Table	Colonnes clés	Accès
contacts	name, email, phone, message, read	INSERT public (anon), SELECT/UPDATE admin
clients	name, email (unique), phone, address, access_token	CRUD admin, SELECT propre profil client
pieces	number (unique), type (facture/devis), status, client_id (FK), date, due_date, tva_rate, paid_date, payment_method	CRUD admin, SELECT propres pièces client
piece_lines	piece_id (FK cascade), description, quantity, unit_price, order_index	CRUD admin, SELECT propres lignes client
Politique de sécurité RLS : Le rôle est stocké dans user_metadata.role du JWT. Les clients ne voient que leurs propres données, les admins ont accès complet.

4. Authentification & Sécurité
Flux Auth
Admin : Login avec email/password via signInWithPassword → redirect /admin
Client : Login avec email/password → redirect /espace-client/dashboard
Création compte client : Via le formulaire de contact (checkbox "Créer mon compte client") → admin API crée l'utilisateur Supabase + envoie un magic link par email pour définir le mot de passe
Middleware (proxy.ts)
Le fichier proxy.ts contient la logique middleware mais n'est pas importé par un middleware.ts. C'est un problème potentiel grave : la protection des routes admin et espace client au niveau middleware ne fonctionne probablement pas si ce fichier n'est pas connecté.

Points d'attention sécurité
Aspect	Statut	Détail
RLS Supabase	OK	Bien configuré, séparation admin/client
Protection routes admin	A VERIFIER	proxy.ts existe mais pas de middleware.ts qui l'importe
Vérification PDF	OK	Vérifie auth + propriété si client
Rate limiting API resend	OK	Rate limit simple en mémoire (1 req/min/IP)
Validation inputs	OK	Zod sur toutes les API routes
CSRF	Partiel	Pas de token CSRF explicite, mais les mutations passent par Supabase client-side
Enumération utilisateurs	OK	L'API resend ne révèle pas si l'email existe
5. Fonctionnalités métier
Formulaire de contact
Validation Zod + react-hook-form
Insertion en base contacts
Envoi email notification vers l'admin (Hostinger SMTP via Nodemailer)
Option création compte client automatique (magic link)
Panel Admin
Dashboard : Stats globales (messages non lus, clients, devis, factures en attente)
Messages : Liste des contacts avec bouton "Marquer lu" et "Créer un devis" (upsert client + redirect)
Pièces commerciales : CRUD complet (factures + devis), formulaire riche avec :
Sélection/création client inline
Lignes de prestation dynamiques (ajout/suppression)
Calcul automatique HT/TVA/TTC
Gestion statuts (brouillon → envoyée → payée/annulée)
Détection retard d'échéance automatique
Génération de numéros automatique (FAC-YYYY-XXX / DEV-YYYY-XXX)
PDF : Génération côté serveur avec @react-pdf/renderer, document professionnel avec :
En-tête entreprise, infos légales, tableau prestations
Bandeau "Facture acquittée" si payée
Conditions légales adaptées (devis vs facture vs payée)
Mentions obligatoires (TVA, pénalités de retard, etc.)
Espace Client
Login email/password
Dashboard avec stats (nb documents, devis, factures, payées)
Vue détaillée de chaque pièce avec lignes, totaux, statuts
Téléchargement PDF
Flow reset mot de passe avec OTP verification + resend
6. Frontend & UI/UX
Design System
Palette : Accent emerald (#059669), fond blanc, textes noirs/gris
Typographie : Inter (Google Fonts), styles minimalistes type Apple-like
Components UI : CSS custom vars (--accent, --accent-dark, --accent-light), Tailwind utility classes
Animations : Framer Motion pour Hero (fade/slide), Stats (counter animé), ScrollReveal wrapper réutilisable
Responsive : Mobile-first avec burger menu, grilles adaptatives
Scrollbar : Customisée (fine, gris clair)
SEO
Metadata complète (Open Graph, Twitter Cards) par page
robots.ts : indexation autorisée sauf /admin/, /api/, /espace-client/
sitemap.ts : Toutes les pages publiques avec priorités
metadataBase : https://samez.fr
7. Points forts
Architecture propre : Bonne séparation des responsabilités (route groups, composants isolés, lib Supabase)
Sécurité RLS : Politiques bien pensées avec séparation admin/client au niveau base de données
Fonctionnalités complètes : Le cycle complet contact → client → devis → facture → PDF → paiement est couvert
Design cohérent : Identité visuelle minimaliste et professionnelle appliquée partout (site, admin, PDF)
SEO bien géré : Metadata, sitemap, robots, og tags présents
Code TypeScript strict : Typage fort, validation Zod, pas d'erreurs de compilation
PDF professionnel : Document conforme aux obligations légales françaises (mentions TVA, pénalités, RCS)
UX client soignée : Animations subtiles, feedback visuels, gestion des états (loading, error, success)
8. Points d'amélioration / Anomalies
Critique
Middleware non connecté : proxy.ts exporte proxy et config mais aucun fichier middleware.ts à la racine ne l'importe. La protection des routes admin/client côté serveur repose uniquement sur les vérifications en page (server components). Il faudrait créer un middleware.ts qui importe et exécute cette fonction.
Important
listUsers() non scalable : Dans route.ts et route.ts, adminClient.auth.admin.listUsers() récupère tous les utilisateurs pour en trouver un. Cela ne passera pas à l'échelle. Utiliser getUserByEmail() ou filtrer côté base de données.
Pas de pagination : Les listes contacts et pièces dans l'admin chargent tout sans pagination. Problématique si le volume augmente.
Pas de confirmation de suppression : Le formulaire de pièces ne propose pas de supprimer une pièce, ni de confirmation.
Numéro de pièce aléatoire : Le numéro généré (FAC-YYYY-XXX avec 3 chiffres aléatoires) peut créer des doublons et ne suit pas un ordre séquentiel. Pour la conformité comptable française, les factures doivent avoir un numéro séquentiel.
Mineur
Pas de tests : Aucun fichier de test unitaire ou e2e dans le projet.
Fichiers temp à la racine : tmpclaude-* files should be in .gitignore.
PiecePDFButton reçoit pieceNumber mais ne l'utilise pas : Le paramètre est passé mais non utilisé dans le composant.
Pas de gestion d'erreur utilisateur sur createServiceClient : Le createServiceClient utilise le service role key avec des cookies, ce qui est inattendu. Un simple createClient(url, service_key) sans cookies suffirait pour un service client.
Pas de middleware CORS sur les API routes (peu critique car déployé sur Vercel).
9. Variables d'environnement requises
10. Résumé
L'application est fonctionnelle et bien conçue pour un freelance. L'architecture Next.js 16 App Router avec Supabase est moderne et cohérente. Le flux métier complet (contact → devis → facture → paiement → PDF) est implementé de bout en bout. Les principaux points à corriger sont le middleware manquant (sécurité), la numérotation séquentielle des factures (conformité légale), et le remplacement de listUsers() par une requête ciblée.