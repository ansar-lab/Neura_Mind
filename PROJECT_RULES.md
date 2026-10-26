# NeuraMind — AI Coding Rules

## PROJECT IDENTITY

Project: NeuraMind
Type: AI Learning Assistant
Users: Students
Frontend: React
Backend: Supabase
AI: External AI API
Purpose: Real working student learning platform

---

# CORE RULE

Do not generate code, files, dependencies, database tables,
or features unless they are required by the approved project plan.

Always inspect the existing project before making changes.

Reuse existing code whenever possible.

---

# FILE MANAGEMENT

Before creating a file:

1. Search the existing project.
2. Check whether an existing file can be reused.
3. Create a new file only when necessary.

NEVER create:

- file-final
- file-final2
- file-new
- file-old
- file-copy
- backup files
- temporary files
- duplicate components
- unused test files

Never create random files in the project root.

---

# PROJECT STRUCTURE

Documentation:
docs/

React application:
src/

Static public assets:
public/

Tests:
tests/

Project rules:
PROJECT_RULES.md

Environment example:
.env.example

---

# REACT RULES

Use reusable React components.

Keep components focused on one responsibility.

Do not duplicate UI components.

Before creating a component, search for an existing component that can be reused.

Do not rewrite the entire application for a small feature.

---

# SUPABASE RULES

Use Supabase for:

- Authentication
- PostgreSQL database
- Storage where required

Database access must follow Row Level Security.

Students must only be able to access data belonging to their own account unless a feature explicitly requires public data.

Never disable RLS simply to make an error disappear.

---

# AI RULES

AI API credentials must never be placed directly in frontend code.

Never expose private API keys.

AI requests requiring secret credentials must use a secure server-side mechanism.

Do not send unnecessary personal student data to the AI service.

---

# ENVIRONMENT VARIABLES

Never hard-code secrets.

Use environment variables.

Never commit:

.env
.env.local

Keep:

.env.example

updated with required variable names only.

---

# DEPENDENCIES

Before installing a package:

1. Check package.json.
2. Check whether the functionality already exists.
3. Install only if genuinely required.

Do not install multiple libraries for the same purpose.

---

# DESIGN SYSTEM

Maintain a consistent NeuraMind visual identity.

Primary visual direction:

- modern
- educational
- trustworthy
- clean
- accessible
- responsive

Do not randomly change colors, fonts, spacing,
buttons, cards, or layouts between pages.

---

# RESPONSIVE DESIGN

The application must work on:

- Desktop
- Tablet
- Mobile

Do not implement desktop-only layouts.

---

# ACCESSIBILITY

Use semantic HTML.

Provide labels for form fields.

Maintain keyboard accessibility.

Use readable contrast.

Do not rely only on color to communicate information.

---

# ERROR HANDLING

Never hide errors.

When an error occurs:

1. Identify the root cause.
2. Fix the root cause.
3. Test the affected functionality.
4. Check for side effects.

---

# DEVELOPMENT PROCESS

Before implementation:

1. Inspect the relevant files.
2. Explain the implementation plan.
3. Identify files that will change.
4. Identify new dependencies if any.

Then implement only the approved scope.

---

# FINAL CHECK

Before completing a task verify:

[ ] No unnecessary files
[ ] No duplicate components
[ ] No temporary files
[ ] No unused imports
[ ] No unnecessary dependencies
[ ] No exposed secrets
[ ] Existing features still work
[ ] New feature works
[ ] Responsive behavior checked
[ ] Errors handled

---

# TASK REPORT

After completing a task report:

Files created:
Files modified:
Files deleted:
Dependencies added:
Tests performed:
Known issues:

Never claim a test was performed unless it was actually performed.

