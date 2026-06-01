# Déploiement Cloudflare Pages — ChadGPT Admin

Ce document décrit la configuration pour publier le panneau admin Next.js (`chadgpt-admin`) et le brancher sur le backend Render déjà en ligne.

## Références utiles

| Ressource | URL |
|-----------|-----|
| Backend API (health racine) | [https://sayibi-backend.onrender.com](https://sayibi-backend.onrender.com) |
| Préfixe API applicative | **`https://sayibi-backend.onrender.com/api/v1`** |
| Dépôt backend (branche `admin-router`) | [github.com/faycalhabibahmatalbachar/sayibiai_backend](https://github.com/faycalhabibahmatalbachar/sayibiai_backend/tree/admin-router) |
| Dépôt admin (exemple de remote GitHub) | [github.com/issarozisoukaya/ChadGpt](https://github.com/issarozisoukaya/ChadGpt) |

Le client axios utilise `NEXT_PUBLIC_API_URL` comme base (voir `src/lib/api/client.ts`). Les routes admin sont donc du type  
`{NEXT_PUBLIC_API_URL}/admin/...` (ex. `GET .../admin/users`).

## Variables d’environnement (Production)

À définir dans **Cloudflare Pages → Project → Settings → Environment variables** (Production). Cocher **Encrypt** pour les secrets si besoin.

| Variable | Obligatoire | Exemple / valeur |
|----------|-------------|------------------|
| `NEXT_PUBLIC_API_URL` | **Oui** | `https://sayibi-backend.onrender.com/api/v1` |
| `NEXT_PUBLIC_APP_URL` | Recommandé | `https://<votre-projet>.pages.dev` puis votre domaine custom |
| `NEXT_PUBLIC_APP_NAME` | Non | `ChadGPT Admin` |
| `NEXT_PUBLIC_WS_URL` | Si temps réel utilisé | `wss://sayibi-backend.onrender.com/ws` (à valider côté backend) |
| `NEXT_PUBLIC_POSTHOG_KEY` | Non | (vide si non utilisé) |
| `NEXT_PUBLIC_SENTRY_DSN` | Non | (vide si non utilisé) |

Copie locale : dupliquer `.env.example` vers `.env.local` et renseigner les mêmes clés pour tester contre Render depuis votre machine.

### Pourquoi la liste utilisateurs est vide en prod

Si `NEXT_PUBLIC_API_URL` pointe encore vers `http://localhost:8000`, le navigateur appelle votre machine, pas Render : la grille reste vide ou affiche une erreur réseau. Corrigez la variable sur Cloudflare **et** redeployez (les variables `NEXT_PUBLIC_*` sont injectées au **build**).

### CORS

Le backend utilise `CORS_ORIGINS` (voir `core/config.py`) ; par défaut `*` autorise toutes les origines. En production restreinte, ajoutez l’URL exacte de votre site Pages, par exemple `https://chadgpt.pages.dev`.

## Base de données (Supabase)

L’admin parle au **backend** ; la base PostgreSQL est celle configurée sur Render pour `sayibi-backend` (URL interne au service). Vous n’exposez pas la connection string dans le front.

Migrations SQL à exécuter dans l’éditeur SQL Supabase, **dans l’ordre** adapté à votre schéma existant :  
`007` → … → **`011_retention_ai_enriched_view.sql`** puis **`012_seed_engagement_series_from_usage.sql`**.

- **011** : inclut `DROP VIEW IF EXISTS public.v_admin_users_full CASCADE` avant recréation de la vue (évite l’erreur PostgreSQL 42P16 sur renommage de colonnes).
- **012** : autonome ; crée `user_ml_profiles` si besoin puis remplit `engagement_series`.

## Cloudflare Pages — création du projet

1. **Workers & Pages** → **Create** → **Pages** → **Connect to Git**.
2. Sélectionner le dépôt GitHub (ex. `issarozisoukaya/ChadGpt`), branche `main`.
3. **Root directory** : laisser `/` si le dépôt à la racine est uniquement `chadgpt-admin`. Si le monorepo contient plusieurs apps, indiquer le sous-dossier (ex. `chadgpt-admin`).
4. **Build settings** :
   - **Framework preset** : Next.js (si proposé).
   - **Build command** : `npm ci && npm run build` (ou `npm install && npm run build`).
   - **Build output directory** : pour un déploiement Next **classique** sur Pages, Cloudflare attend souvent une intégration **OpenNext** ou l’assistant « Next.js » qui mappe la sortie. Si le preset Next.js n’est pas disponible, utilisez la [documentation officielle Cloudflare pour Next.js](https://developers.cloudflare.com/pages/framework-guides/nextjs/) (adaptateur `@opennextjs/cloudflare` ou équivalent selon la version).
5. Ajouter les variables d’environnement ci-dessus **avant** le premier build réussi.
6. Déployer ; noter l’URL `*.pages.dev` et la reporter dans `NEXT_PUBLIC_APP_URL` pour les redirections et liens absolus.

**Note.** L’écran « Build : `npm run build` · Deploy : `npx wrangler deploy` » correspond plutôt à un **Worker** Wrangler qu’à Pages Git-first. Pour **Pages** branché à GitHub, le déploiement est déclenché par **push** sur la branche configurée ; Wrangler n’est pas obligatoire sauf si vous basculez vers un flux Workers/Pages manuel.

## Check-list post-déploiement

- [ ] `GET https://sayibi-backend.onrender.com/health` répond OK.
- [ ] Connexion admin (`/login`) avec un compte `admin_users` valide.
- [ ] Après login, `GET .../api/v1/admin/users` (via l’app) retourne des données.
- [ ] Migrations 011 / 012 appliquées si vous utilisez les vues ML / séries d’engagement.

## Script d’automatisation (push GitHub)

Le dépôt distant typique est `https://github.com/issarozisoukaya/ChadGpt.git` sur la branche `main`. Après `git push`, Cloudflare Pages redéploie si le projet est connecté.

Voir `scripts/deploy-push-main.ps1` à la racine de ce projet : commit et push en une commande.
