# NeuraMind — AI Learning Assistant

NeuraMind is an open-access AI-powered learning companion designed to help students master academic concepts through step-by-step explanations, interactive tutoring, study schedules, and curated educational resources.

---

## Features

- **Open Access (No Sign-In Barrier)**: Jump straight into learning without cumbersome login forms. Chat history and student preferences are preserved locally in the browser.
- **AI Academic Tutor**: Powered directly by Google Gemini (`gemini-3.5-flash` with automatic fallback to `gemini-3.5-flash-lite`), providing rich explanations with Markdown formatting, LaTeX-style formulas, and code blocks.
- **Interactive Multi-Turn Conversations**: Supports conversation history, renaming chats, deleting past sessions, and suggested prompts across Computer Science, Mathematics, and Study Planning.
- **Curated Educational Resources**: Handpicked resources categorized by topic (Programming, Mathematics, Science, AI & Machine Learning) and skill level.
- **Personalized Student Profile**: Customize your academic level (Middle School to Lifelong Learner) and study focus with local persistence.

---

## Tech Stack

- **Frontend**: React 18, React Router v7, Vite
- **Styling**: Tailwind CSS, PostCSS, Lucide Icons
- **AI Integration**: Google Gemini API (`@google/genai` REST endpoints with multi-turn support and automatic fallback)
- **Local Persistence**: Browser `localStorage` for privacy, speed, and offline resilience

---

## Getting Started

### 1. Clone the repository
```bash
git clone https://github.com/ansar-lab/Neura_Mind.git
cd Neura_Mind
```

### 2. Install dependencies
```bash
npm install
```

### 3. Configure environment variables
Create a `.env.local` file in the project root:
```env
# Optional Supabase config
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here

# Google Gemini API key (https://aistudio.google.com/apikey)
VITE_GEMINI_API_KEY=your-gemini-api-key-here
VITE_GEMINI_MODEL=gemini-3.5-flash
```

> **Note**: You can also configure or override your Gemini API key directly in the UI under **AI Tutor > API Key**.

### 4. Run the development server
```bash
npm run dev
```

Visit `http://localhost:3000` to start learning!

---

## License

MIT License. Built for students and lifelong learners everywhere.
