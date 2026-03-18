# Welcome to your Lovable project

## Project info

**URL**: https://lovable.dev/projects/REPLACE_WITH_PROJECT_ID

## How can I edit this code?

There are several ways of editing your application.

**Use Lovable**

Simply visit the [Lovable Project](https://lovable.dev/projects/REPLACE_WITH_PROJECT_ID) and start prompting.

Changes made via Lovable will be committed automatically to this repo.

**Use your preferred IDE**

If you want to work locally using your own IDE, you can clone this repo and push changes. Pushed changes will also be reflected in Lovable.

The only requirement is having Node.js & npm installed - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)

Follow these steps:

```sh
# Step 1: Clone the repository using the project's Git URL.
git clone <YOUR_GIT_URL>

# Step 2: Navigate to the project directory.
cd <YOUR_PROJECT_NAME>

# Step 3: Install the necessary dependencies.
npm i

# Step 4: Start the development server with auto-reloading and an instant preview.
npm run dev
```

## Environment setup

Create a local `.env` file before testing Google sign-in:

```sh
VITE_SUPABASE_URL=https://flbdwuhoyqbbidbkrmmi.supabase.co
VITE_SUPABASE_ANON_KEY=your-public-anon-key
VITE_API_BASE_URL=https://marketscope-backend1.onrender.com
```

These values are required by the frontend auth flow. Do not commit real secrets.

## Supabase auth redirect setup

Configure Supabase Auth so the Google OAuth callback can return to the protected app route:

1. In Supabase, open Authentication -> URL Configuration.
2. Set Site URL to your frontend origin.
3. Add the app route as an allowed redirect URL for each environment:

```txt
http://localhost:5173/app
https://your-production-domain.com/app
```

4. In Authentication -> Providers -> Google, enable Google sign-in and use the same authorized redirect domain there.

The frontend redirect target is centralized at `/app` in `src/lib/authRoutes.ts` and used by the client OAuth flow.
Runtime auth code rejects Supabase dashboard URLs and only accepts project domains ending in `.supabase.co`.

## Backend membership enforcement

Status: pending.

Authenticated Supabase users can enter the app today, but backend entitlement or approved-user membership validation is not enforced yet. The placeholder hook for that future check lives in `src/auth/accessPolicy.ts`.

**Edit a file directly in GitHub**

- Navigate to the desired file(s).
- Click the "Edit" button (pencil icon) at the top right of the file view.
- Make your changes and commit the changes.

**Use GitHub Codespaces**

- Navigate to the main page of your repository.
- Click on the "Code" button (green button) near the top right.
- Select the "Codespaces" tab.
- Click on "New codespace" to launch a new Codespace environment.
- Edit files directly within the Codespace and commit and push your changes once you're done.

## What technologies are used for this project?

This project is built with:

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS

## How can I deploy this project?

Simply open [Lovable](https://lovable.dev/projects/REPLACE_WITH_PROJECT_ID) and click on Share -> Publish.

## Can I connect a custom domain to my Lovable project?

Yes, you can!

To connect a domain, navigate to Project > Settings > Domains and click Connect Domain.

Read more here: [Setting up a custom domain](https://docs.lovable.dev/features/custom-domain#custom-domain)
