# 🚀 Academic Productivity & Evaluation Tracker

A full-stack web application designed to help students manage **courses, evaluations, tasks, and focused study sessions** in a structured and efficient way.

This system combines **course tracking, evaluation management, and productivity tools** into a single unified platform.

---

## ✨ Features

### 📚 Course Management

* Create and manage multiple courses
* Track course-specific evaluations and tasks
* Organized course-wise dashboard

### 📝 Evaluation System

* Add, edit, and delete evaluations (quizzes, exams, assignments)
* Track scores and performance
* Structured evaluation records per course

### ⏱️ Focus Timer

* Dedicated focus timer for deep work sessions
* Link sessions to tasks or use general categories:

  * Reading
  * Note Making
  * Question Solving
  * Coding
  * Debugging
  * etc.

### 📅 Calendar View

* Visualize upcoming evaluations and tasks
* Time-based planning and tracking

### 📊 Dashboard

* Overview of:

  * Courses
  * Evaluations
  * Tasks
  * Productivity insights

### 🔐 Authentication

* Secure user authentication system
* Token-based session management

### 🔔 Notifications

* Toast-based UI feedback
* Real-time updates for actions

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
│   ├── context/           # Global state (Auth, Notifications)
│   ├── lib/               # API + data services
│   ├── pages/             # Application pages
│   └── main.tsx           # Entry point
```

---

## ⚙️ Setup Instructions

### 1️⃣ Clone the repository

```bash
git clone <your-repo-url>
cd project
```

---

### 2️⃣ Backend Setup

```bash
cd backend
npm install
```

#### Configure Environment Variables

Create a `.env` file:

```env
DATABASE_URL=your_postgres_connection
JWT_SECRET=your_secret_key
PORT=5000
```

#### Run migrations

```bash
npx drizzle-kit push
```

#### Start server

```bash
npm run dev
```

---

### 3️⃣ Frontend Setup

```bash
cd frontend
npm install
npm run dev
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

---

## 🧠 Design Decisions

* **Modular backend architecture** for scalability
* **Separation of concerns** (controllers, services, routes)
* **Drizzle ORM** for type-safe database queries
* **Context API** instead of Redux (lighter, sufficient)
* **Component-driven UI** for reusability
* **Session caching** for performance optimization

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


