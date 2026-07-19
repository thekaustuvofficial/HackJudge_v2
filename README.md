<div align="center">
  <img src="./public/favicon.svg" alt="HackJudge Logo" width="120" height="120" />
  <h1>HackJudge</h1>
  <p><strong>The High-Performance Evaluation Engine for Hackathons & Pitch Competitions</strong></p>
  <p>
    <a href="https://hackjudge.vercel.app/">Live Demo</a> ·
    <a href="#features">Features</a> ·
    <a href="#tech-stack">Tech Stack</a> ·
    <a href="#getting-started">Getting Started</a>
  </p>
</div>

<hr />

HackJudge is a premium, high-contrast judging platform designed to replace the friction of spreadsheets with a seamless, digital evaluation experience. Whether you're running a high-stakes hackathon, a startup pitch competition, or an academic case study, HackJudge gives organisers total control and judges a frictionless scoring experience.

## Features

- **Frictionless UI/UX**: Ultra-fast, dual-theme (Light/Dark) interface with smooth micro-animations.
- **Magic Link Authentication**: Judges don't need to remember passwords. One click and they're in.
- **Dynamic Round Builder**: Create customized scoring criteria with weighted averages mapped to specific rounds.
- **Intelligent Panel Management**: Assign specific tracks and teams to targeted judging panels.
- **Real-Time Leaderboards**: Instantly generate results and export them as CSVs.
- **Enterprise-Grade Security**: Full Supabase Row Level Security (RLS) policies guaranteeing strict data access limits.
- **Bulk Data Handling**: Drag-and-drop CSV uploads to import hundreds of teams in seconds.

## Tech Stack

- **Frontend**: React 18, Vite, CSS (Vanilla + CSS Variables for theming)
- **State Management**: React Query (`@tanstack/react-query`)
- **Backend & Auth**: Supabase (PostgreSQL, GoTrue Auth, Edge Functions)
- **Icons**: Lucide React
- **Deployment**: Optimized for Vercel

## Getting Started

### Prerequisites

Ensure you have [Node.js](https://nodejs.org/) installed, and a [Supabase](https://supabase.com/) project set up.

### 1. Clone the repository

```bash
git clone https://github.com/YOUR_USERNAME/hackjudge.git
cd hackjudge
```

### 2. Install dependencies

```bash
npm install
```

### 3. Setup Environment Variables

Copy the example environment file and fill in your Supabase credentials:

```bash
cp .env.example .env
```
Inside `.env`:
```env
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-public-key
```

### 4. Database Schema Setup

You will need to run the SQL schema migrations to set up the tables and RLS policies.
Copy the contents of `hackjudge-schema.sql` (if provided in the repo) into the Supabase SQL Editor and execute it. 

*Note: Ensure "Email Confirmations" are disabled in your Supabase Auth settings if you want judges to log in immediately without verifying.*

### 5. Run the Development Server

```bash
npm run dev
```

The app will be available at `http://localhost:5173`.

## Deployment

HackJudge is pre-configured for Vercel. 
1. Push your code to GitHub.
2. Import the repository in Vercel.
3. Add the `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` to the Vercel Environment Variables.
4. Deploy! The included `vercel.json` will automatically handle SPA routing.

## Contributing

Contributions, issues, and feature requests are welcome! Feel free to check the [issues page](https://github.com/YOUR_USERNAME/hackjudge/issues).

---

<div align="center">
  Built with precision. Designed for scale.
</div>
