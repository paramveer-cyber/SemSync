# SEMSYNC — Academic Tracker

A streamlined, minimalist tracker for college students to manage courses, deadlines, and deep-work sessions.

---

## Features

- **Dashboard** — A high-level weekly overview of all your courses, current grades vs. targets, and upcoming evaluations with urgency indicators (CRITICAL / OPERATIONAL / ROUTINE).
- **Course Management** — Add courses with credit weights and target grades. Track evaluations (quizzes, assignments, mid-sems, end-sems, labs, vivas, projects) with scores and weightages. The app automatically calculates your current grade and the average you need on remaining assessments.
- **Task Center** — A Kanban-style board (Upcoming → Active → Done) to manage tasks with priorities, due dates, and drag-and-drop reordering.
- **Academic Calendar** — Visual semester calendar mapping all your evaluation deadlines in one place.
- **Focus Timer** — A Pomodoro-style work timer with configurable focus/break durations. Link sessions to specific tasks or upcoming evaluations, and track your study history by category.
- **Themes & Settings** — Multiple built-in dark/light themes, custom theme builder, and notification preferences.

---

## Run Locally

**Prerequisites:** Node.js

1. Install dependencies:
   ```bash
   npm install
   ```

2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key

3. Run the app:
   ```bash
   npm run dev
   ```

> **Note:** The app is designed for desktop use only (minimum viewport width: 1024px).

---

## How to Use

### 1. Sign In
Navigate to the app and click **Login**. Authentication is handled via Google Sign-In. Your session token is stored locally and used to communicate with the backend at `https://semsyncbackend.vercel.app`.

### 2. Add Your Courses
From the **Dashboard**, click the **+** button to add a course. Enter the course name, credit hours, and your target grade. You can delete courses from the dashboard as well.

### 3. Track Evaluations
Open a course to view its detail page. Click **Add Evaluation** to log an assessment — choose the type (quiz, assignment, mid-sem, lab, project, viva, etc.), enter the weightage, date, and your score once results are out. The course page calculates your running grade and tells you the average required on remaining assessments to hit your target.

### 4. Manage Tasks
Go to **Task Center** to create tasks with a title, description, linked course, due date, and priority (low / medium / high). Drag cards between the **Upcoming**, **Active**, and **Done** columns as you make progress.

### 5. Use the Focus Timer
Head to **Focus Timer** to start a Pomodoro session. Set your focus and break durations, optionally link the session to a task or an upcoming evaluation, and pick a study category (Reading, Coding, Note Making, etc.). Completed sessions are saved to your local history.

### 6. View the Calendar
The **Calendar** page gives a month-by-month view of all evaluation dates across your courses so you can spot crunch periods at a glance.

### 7. Customize Settings
Under **Settings**, switch between built-in themes, create a custom theme, toggle desktop notifications, and replay the onboarding tutorial at any time.

---

## Tech Stack

- **Frontend:** React + TypeScript, Tailwind CSS, React Router
- **Backend:** REST API hosted on Vercel (`semsyncbackend.vercel.app`)
- **Auth:** Google OAuth (JWT stored in `localStorage`)
- **State:** React Context (Auth, Theme, Notifications) + `localStorage` for tasks and focus sessions