# MoodLift Documentation

This document describes the current implementation in this repository. It is intended to be a practical reference for development, local setup, and deployment.

## 1. Project Summary

MoodLift is a full-stack wellbeing application with:

- a React + Vite frontend in `frontend/`
- an Express API in `backend/`
- MongoDB as the primary database
- Redis for caching and token/session support
- Docker-based local and production-style orchestration

The app includes authentication, mood tracking, journaling, insights, coaching, playbooks, challenges, notifications, file storage, and admin/privacy-related endpoints.

## 2. Primary Use Cases

The current application supports these main user journeys:

- Daily emotional check-ins where a user records mood, energy, sleep, anxiety, activities, and notes.
- Reflective journaling for capturing thoughts over time and building a searchable personal history.
- Trend discovery through dashboards and insight views that surface averages, streaks, mood distribution, and time-based patterns.
- In-the-moment emotional support through the AI Coach, including conversation history and risk-aware responses.
- Guided self-improvement through structured multi-day playbooks with lesson-by-lesson progress.
- Community accountability through challenges that users can browse, join, create, and track on a leaderboard.
- Personalized nudges through recommendations, quotes, reminders, and trigger-based interventions.
- Account and data management through profile editing, notification preferences, data export, and account deletion.
- Admin and safety workflows for reviewing risk signals, viewing platform stats, and moderating user access.

## 3. Feature Overview

These are the core product features reflected in the current codebase:

- Authentication: register, login, logout, token refresh, current-user session lookup, password reset flow.
- Profile management: view and update profile details, change password, update notification preferences, view achievements, deactivate account.
- Mood tracking: create mood entries, fetch today's entry, review history, update/delete entries, and inspect mood summaries.
- Journal: create, edit, delete, filter, and review journal entries, plus daily prompt retrieval.
- Insights and analytics: dashboard summaries, mood trends, mood distribution, day-of-week and time-of-day patterns, and top-activity style insights.
- AI Coach: create conversations, revisit past threads, send messages, receive assistant responses, and surface flagged risk messages.
- Playbooks: browse guided programs, enroll, inspect lesson flow, complete daily lessons, track progress, and leave a playbook.
- Challenges: browse/filter challenges, create new ones, join active challenges, update progress, view rank and leaderboard, and abandon participation.
- Recommendations and interventions: fetch personalized next actions, mark recommendations complete or dismissed, and connect suggestions to interventions.
- Notifications and triggers: reminder and nudge delivery, unread tracking, mark-read flows, and context-based trigger generation.
- Search: search interventions and playbooks from a shared endpoint.
- Quotes: retrieve daily quotes, browse quote collections, like quotes, and save favorites.
- File storage: upload, list, and delete user files through authenticated endpoints.
- Privacy and compliance: request data export, monitor export status, and delete an account through privacy routes.
- Admin operations: view dashboard stats, review crisis/risk flags, inspect user stats, and change user status.

## 4. Repository Layout

```text
moodlift/
|- frontend/                  React client
|  |- src/
|  |  |- components/          Layout and feature components
|  |  |- hooks/               Data hooks
|  |  |- pages/               Route-level pages
|  |  |- services/            API clients
|  |  |- store/               Zustand auth store
|  |  `- types/               Shared frontend types
|  |- Dockerfile
|  `- .dockerignore
|- backend/                   Express API
|  |- src/
|  |  |- config/              MongoDB and Redis setup
|  |  |- controllers/         Route handlers
|  |  |- database/            Migration/seed scripts
|  |  |- middleware/          Auth, validation, safety, errors
|  |  |- models/              Data models
|  |  |- routes/              API route definitions
|  |  |- services/            Domain services
|  |  |- utils/               Logger, JWT, helpers
|  |  `- server.js            App bootstrap
|  |- scripts/
|  |- Dockerfile
|  `- .env.example
|- docker-compose.yml         Multi-service local stack
|- nginx.conf                 Reverse-proxy configuration
|- README.md                  Existing overview document
`- DOCUMENTATION.md           This file
```

## 5. Technology Stack

### Frontend

- React 18
- TypeScript
- Vite
- Tailwind CSS
- Zustand
- TanStack Query
- Axios

### Backend

- Node.js
- Express
- Mongoose
- Redis
- JWT authentication
- Nodemailer
- Winston logging

### Infrastructure

- Docker and Docker Compose
- Nginx for serving the frontend
- MongoDB 7
- Redis 7

## 6. Frontend Routing

Public routes:

- `/`
- `/login`
- `/register`

Protected routes:

- `/dashboard`
- `/check-in`
- `/journal`
- `/journal/new`
- `/journal/:id`
- `/insights`
- `/coach`
- `/playbooks`
- `/challenges`
- `/profile`

Authentication state is handled with Zustand, and unauthenticated users are redirected to `/login`.

## 7. Backend API Areas

The API base path is:

```text
/api/v1
```

Mounted route groups:

- `/auth`
- `/moods`
- `/journal`
- `/users`
- `/profile`
- `/quotes`
- `/insights`
- `/notifications`
- `/analytics`
- `/coach`
- `/playbooks`
- `/challenges`
- `/interventions`
- `/recommendations`
- `/triggers`
- `/search`
- `/files`
- `/privacy`
- `/admin`

Health endpoint:

```text
/health
```

## 8. Runtime Behavior

- MongoDB is required for primary application data.
- Redis is used when available, but the backend can fall back to an in-memory store in development-style setups.
- API rate limiting is enabled globally, with a stricter limiter on authentication endpoints.
- CORS allows the configured frontend URL plus common local development origins.
- The frontend defaults to `VITE_API_URL=/api/v1`, which works cleanly behind the Docker/Nginx setup.

## 9. Local Development

### Backend

1. Copy `backend/.env.example` to `backend/.env`.
2. Update secrets and connection settings.
3. Install dependencies with `npm install`.
4. Start the API with `npm run dev`.

Default backend port:

```text
5000
```

### Frontend

1. Install dependencies in `frontend/` with `npm install`.
2. Start the dev server with `npm run dev`.

Default frontend port:

```text
5173
```

## 10. Docker Setup

`docker-compose.yml` defines four services:

- `mongodb`
- `redis`
- `backend`
- `frontend`

Default exposed ports:

- MongoDB: `27017`
- Redis: `6379`
- Backend: `5000`
- Frontend: `80`

Useful behavior:

- The backend container waits for MongoDB and Redis health checks.
- The frontend build injects `VITE_API_URL=/api/v1`.
- Uploaded files and backend logs are mounted from the host into the backend container.

## 11. Important Environment Variables

Backend configuration is driven mainly by:

- `NODE_ENV`
- `PORT`
- `API_VERSION`
- `MONGODB_URI`
- `REDIS_HOST`
- `REDIS_PORT`
- `REDIS_PASSWORD`
- `REDIS_DISABLED`
- `JWT_SECRET`
- `JWT_REFRESH_SECRET`
- `FRONTEND_URL`
- `SMTP_HOST`
- `SMTP_PORT`
- `SMTP_USER`
- `SMTP_PASS`
- `UPLOAD_PATH`

## 12. Notes and Current Observations

- The current codebase uses MongoDB, not PostgreSQL.
- Redis is optional in some development flows because the backend includes an in-memory fallback.
- The root `README.md` appears to contain older or mixed project details, so this file should be treated as the implementation-aligned reference unless the README is updated.
