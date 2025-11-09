# HARVIS — Health-JARVIS

<p align="center">
  <strong>Track food and workouts with text or voice</strong>
</p>

<p align="center">
  HARVIS computes calories, macros, and burned energy—organized in a simple, mobile‑first dashboard.
</p>

<p align="center">
  <a href="#features"><strong>Features</strong></a> ·
  <a href="#tech-stack"><strong>Tech Stack</strong></a> ·
  <a href="#getting-started"><strong>Getting Started</strong></a> ·
  <a href="#project-structure"><strong>Project Structure</strong></a>
</p>

---

## Features

- **Unified Logging**: Add entries via text or voice. HARVIS automatically classifies entries as food, workout, or sleep
- **AI-Powered Parsing**: Uses Google Gemini AI to extract nutrition data, workout details, and sleep information from natural language
- **Macros & Calories**: Get best-effort macro estimates for meals and calories burned for workouts
- **Daily Dashboard**: View your daily totals for calories consumed, macros (protein, carbs, fat), calories burned, and sleep
- **AI Chat Assistant**: Chat with HARVIS about your health data, get insights, trends, and personalized recommendations
- **Target Tracking**: Set and track daily calorie and macro targets
- **Reminders**: Set reminders for meals, workouts, or other health-related tasks
- **Mobile-First UI**: Clean interface designed for fast logging and quick daily summaries
- **Voice Input**: Record audio logs that are automatically transcribed and parsed
- **Dark Mode**: Built-in theme switcher for light/dark mode

## Tech Stack

- **Framework**: [Next.js](https://nextjs.org) (App Router) with React 19
- **Database & Auth**: [Supabase](https://supabase.com) (PostgreSQL + Authentication)
- **AI**: [Google Gemini](https://ai.google.dev) (Gemini 2.0 Flash & 2.5 Flash)
- **Styling**: [Tailwind CSS](https://tailwindcss.com)
- **UI Components**: [shadcn/ui](https://ui.shadcn.com)
- **AI SDK**: [Vercel AI SDK](https://sdk.vercel.ai) with `@ai-sdk/react`
- **Type Safety**: TypeScript
- **Icons**: [Lucide React](https://lucide.dev)

## Getting Started

### Prerequisites

- Node.js 18+ and npm/yarn/pnpm
- A [Supabase](https://supabase.com) account and project
- A [Google AI API key](https://ai.google.dev) (for Gemini)

### Installation

1. **Clone the repository**

   ```bash
   git clone <your-repo-url>
   cd harvis
   ```

2. **Install dependencies**

   ```bash
   npm install
   # or
   yarn install
   # or
   pnpm install
   ```

3. **Set up environment variables**

   Create a `.env.local` file in the root directory:

   ```env
   # Supabase
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
   NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your_supabase_anon_key
   
   # Google AI (Gemini)
   GOOGLE_API_KEY=your_google_api_key
   ```

   You can find your Supabase credentials in your [Supabase project settings](https://supabase.com/dashboard/project/_/settings/api).

   Get your Google API key from the [Google AI Studio](https://aistudio.google.com/app/apikey).

4. **Set up the database**

   You'll need to create the following tables in your Supabase database:

   - `logs` - Stores food, workout, and sleep entries
   - `user_profiles` - Stores user target calories and macros
   - `reminders` - Stores user reminders (optional)

   See the `migrations/` directory or your Supabase dashboard for the schema.

5. **Generate TypeScript types** (optional)

   ```bash
   npm run supabase:generate
   ```

   This generates TypeScript types from your Supabase schema.

6. **Run the development server**

   ```bash
   npm run dev
   ```

   Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```
harvis/
├── app/                          # Next.js App Router
│   ├── (protected)/             # Protected routes (require auth)
│   │   ├── chat/                # AI chat interface
│   │   ├── dashboard/           # Main dashboard
│   │   └── layout.tsx           # Protected layout with nav
│   ├── api/                     # API routes
│   │   ├── chat/                # Chat API (Gemini streaming)
│   │   ├── logs/
│   │   │   ├── history/         # Fetch log history
│   │   │   └── ingest/          # Parse and save logs
│   │   └── user/
│   │       └── targets/          # User profile/targets
│   ├── auth/                    # Auth pages (login, signup, etc.)
│   ├── layout.tsx               # Root layout
│   ├── page.tsx                 # Landing page
│   └── globals.css              # Global styles
├── components/                   # React components
│   ├── ai-elements/             # AI chat UI components
│   ├── ui/                      # shadcn/ui components
│   ├── add-log-sheet.tsx        # Log entry modal (text/voice)
│   ├── reminders.tsx            # Reminders component
│   ├── target-setup.tsx         # Initial target setup
│   └── ...
├── lib/                          # Utilities and helpers
│   ├── gemini.ts                # Gemini AI parsing logic
│   ├── supabase/                # Supabase client setup
│   ├── types.ts                 # TypeScript types
│   └── utils.ts                 # Utility functions
├── middleware.ts                 # Auth middleware
└── package.json
```

## Usage

### Logging Entries

1. **Text Input**: Click the "+" button on the dashboard, select "Text", and type your entry:
   - Food: "Paneer rice bowl with vegetables"
   - Workout: "Bench press 5×5 @ 80kg, incline press 4×8"
   - Sleep: "Slept 7 hours"

2. **Voice Input**: Click the "+" button, select "Voice", and record your entry. The audio is transcribed and parsed automatically.

3. **Multiple Entries**: You can log multiple meals, workouts, or sleep in a single entry. HARVIS will separate them automatically.

### Dashboard

The dashboard shows:
- **Today's Totals**: Calories consumed, macros (protein, carbs, fat), calories burned, and sleep
- **Diet Logs**: Recent food entries with macro breakdowns
- **Workout Logs**: Recent workout entries with duration and calories burned
- **Reminders**: Your health-related reminders

### AI Chat

Navigate to `/chat` to ask HARVIS questions about your health data:
- "How many calories did I consume today?"
- "What's my protein intake this week?"
- "Give me recommendations based on my diet"

### Setting Targets

On first login, you'll be prompted to set your daily calorie and macro targets. You can update these later from your profile.

## Development

### Available Scripts

- `npm run dev` - Start development server with Turbopack
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run supabase:generate` - Generate TypeScript types from Supabase schema

### Key Features Implementation

- **Log Parsing**: Uses Gemini 2.5 Flash to parse natural language into structured data
- **Chat**: Uses Gemini 2.0 Flash Exp for streaming chat responses with health data context
- **Authentication**: Supabase Auth with cookie-based sessions
- **Real-time Updates**: Dashboard refreshes after logging new entries

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase project URL | Yes |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Your Supabase anon/publishable key | Yes |
| `GOOGLE_API_KEY` | Google AI API key for Gemini | Yes |

## License

This project is private and proprietary.

---

Built with ❤️ using Next.js, Supabase, and Google Gemini
