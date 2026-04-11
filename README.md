# 🎓 SemSync — Academic Productivity Tracker

A full-stack web application designed to help students manage **courses, evaluations, tasks, and focused study sessions** in a structured and efficient way.

SemSync combines **course tracking, evaluation management, Google Classroom integration, and productivity tools** into a single unified platform.

---

## ✨ Features

### 📚 Course Management

* Create and manage multiple courses
* Set target grades and track credits
* Live grade calculation with required-average projection
* Organized course-wise dashboard with evaluation breakdown

### 📝 Evaluation System

* Add, edit, and delete evaluations (quizzes, exams, assignments, labs, projects, vivas)
* Track scores, max scores, and weightages
* Automatic current grade and remaining weight calculation
* Structured evaluation records per course

### 🎓 Google Classroom Integration

* Connect your Google account with read-only access
* Auto-import all active courses, assignments, due dates, and grades
* Assignment status tracking: pending, due-soon, submitted, missing, graded
* Grades tab with score bars and percentages per course
* Announcements tab per course
* Auto-refresh every 5 minutes with manual refresh option
* Classroom assignments automatically synced to the Calendar view
* Calendar events are removed cleanly when you unlink your account

### ⏱️ Focus Timer

* Built-in Pomodoro engine for deep work sessions
* Configurable work and break intervals
* Link sessions to tasks or use general categories:

  * Reading, Note Making, Question Solving, Coding, Debugging, and more

* Audio and visual alerts between sessions
* Per-day and per-week focus time stats

### 📅 Calendar View

* Month grid view of all evaluations and tasks
* Colour-coded dots per course
* Classroom assignments appear automatically
* Visual deadline clustering to spot heavy weeks

### 📊 Dashboard

* Overview of all active courses with live grade status
* Urgency-tiered upcoming evaluations (Critical / Operational / Routine)
* Weekly focus section resets every Monday
* Upcoming panel updates instantly when a course is deleted

### 🔐 Authentication

* Secure user authentication system
* Token-based session management

### 🔔 Notifications

* Toast-based UI feedback
* Real-time updates for actions

### 🧭 Onboarding Tutorial

* Step-by-step interactive tutorial on first launch
* Covers Dashboard, Courses, Calendar, Classroom, Task Center, and Focus Timer

---

## 🏗️ Tech Stack

### Frontend

* **React + TypeScript**
* **Vite**
* **Tailwind CSS**
* Context API for state management

### Backend

* **Node.js + Express**
* Modular architecture
* Middleware-based request handling

### Database

* **PostgreSQL**
* **Drizzle ORM**

---

## 📂 Project Structure

### Backend

```
backend/
├── drizzle/                # Database migrations
├── src/
│   ├── common/            # Config, middlewares, utilities
│   ├── db/                # Database connection & schema
│   ├── modules/           # Feature modules
│   │   ├── auth/
│   │   ├── courses/
│   │   ├── evals/
│   └── index.js           # App entry point
```

### Frontend

```
frontend/
├── src/
│   ├── components/        # UI components & modals
│   │   └── modals/        # SyncCourseModal, AddCourseModal, etc.
│   ├── context/           # Global state (Auth, Notifications, Theme)
│   ├── lib/               # API client + data services + session cache
│   ├── pages/             # Application pages
│   │   ├── Dashboard.tsx
│   │   ├── ClassroomPage.tsx
│   │   ├── CoursePage.tsx
│   │   ├── CalendarPage.tsx
│   │   ├── TaskCenterPage.tsx
│   │   └── FocusTimerPage.tsx
│   └── main.tsx           # Entry point
```

---

## 🔌 API Overview

### Auth

* `POST /auth/register`
* `POST /auth/login`

### Courses

* `GET /courses`
* `POST /courses`
* `DELETE /courses/:id`

### Evaluations

* `GET /evals`
* `POST /evals`
* `PUT /evals/:id`
* `DELETE /evals/:id`

### Classroom (Google OAuth — client-side only)

* Token stored and retrieved via `/classroom/token` endpoints
* All Classroom data is fetched directly from the Google Classroom API on the client

---

## 🧠 Design Decisions

* **Modular backend architecture** for scalability
* **Separation of concerns** (controllers, services, routes)
* **Drizzle ORM** for type-safe database queries
* **Context API** instead of Redux (lighter, sufficient)
* **Component-driven UI** for reusability
* **Session caching** for performance optimization
* **localStorage-backed Classroom cache** so the page loads instantly from cache and refreshes in the background
* **`_fromClassroom` flag** on calendar items enables clean removal when unlinking

---

## ⚠️ Disclaimer

This project is intended for **demonstration and personal use only**.

---

## ⭐ Future Improvements

* Analytics dashboard (performance trends)
* Collaborative study groups
* Mobile responsiveness improvements
* Advanced scheduling system
* AI-based study recommendations