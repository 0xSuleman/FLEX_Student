# FLEX Student Portal — FAST NUCES Clone

A full-stack clone of the FAST NUCES FLEX Student Portal built with React, Spring Boot, and MySQL. Covers all 14 portal modules with a pixel-accurate UI and a fully connected REST backend.

---

## Tech Stack

| Layer    | Technology                              |
|----------|-----------------------------------------|
| Frontend | React 18, Vite, Tailwind CSS, Recharts  |
| Backend  | Java 17, Spring Boot 3.2, Spring Security (JWT) |
| Database | MySQL 8+                                |

---

## Prerequisites

Before you start, make sure the following are installed:

| Tool | Version | Download |
|------|---------|----------|
| Node.js | 18+ | https://nodejs.org |
| Java JDK | 17+ | https://adoptium.net or `winget install Microsoft.OpenJDK.17` |
| MySQL | 8+ | https://dev.mysql.com/downloads/mysql/ |
| Maven | 3.9+ | https://maven.apache.org/download.cgi or `winget install Apache.Maven` |
| Git | any | https://git-scm.com |

---

## Project Structure

```
FLEX_Student/
├── frontend/          # React + Vite app
│   ├── src/
│   │   ├── pages/     # 14 portal module pages
│   │   ├── components/# Layout, Sidebar, Navbar, ProtectedRoute
│   │   ├── context/   # AuthContext (JWT state)
│   │   └── services/  # Axios API client
│   └── package.json
│
└── backend/           # Spring Boot app
    ├── src/main/java/com/flex/student/
    │   ├── controller/  # REST controllers
    │   ├── service/     # Business logic
    │   ├── model/       # JPA entities
    │   ├── repository/  # Spring Data repos
    │   ├── dto/         # Request/Response DTOs
    │   └── config/      # Security, JWT, CORS
    └── pom.xml
```

---

## Setup & Running

### Step 1 — MySQL Database

Open MySQL and run:

```sql
CREATE DATABASE flex_student_db;
```

### Step 2 — Backend Configuration

Open `backend/src/main/resources/application.properties` and set your MySQL password:

```properties
spring.datasource.url=jdbc:mysql://localhost:3306/flex_student_db
spring.datasource.username=root
spring.datasource.password=your_mysql_password
```

Or set the environment variable `DB_PASSWORD` before running.

### Step 3 — Start the Backend

```bash
cd backend
mvn spring-boot:run
```

The backend starts on **http://localhost:8080**.

On first run, Hibernate auto-creates all tables and the `DataInitializer` seeds a complete student profile:

| Field    | Value        |
|----------|--------------|
| Roll No  | `24L-3072`   |
| Password | `password123`|

### Step 4 — Start the Frontend

Open a **new terminal**:

```bash
cd frontend
npm install
npm run dev
```

The frontend starts on **http://localhost:5173**.

---

## Portal Modules

| Module | Description |
|--------|-------------|
| Home | University info, academic calendar, personal & family details |
| Attendance | Per-course lecture-by-lecture attendance with P/A/L status |
| Marks | Accordion evaluations — Quizzes, Assignments, Sessionals, Midterms, Finals |
| Marks PLO Report | CLO/PLO attainment radar & bar charts |
| Transcript | Semester-by-semester SGPA/CGPA and full grade tables |
| Course Registration | Must-take rules, core/elective tabs, credit-hour validation |
| Tentative Study Plan | 8-semester course grid |
| Grade Report | Semester cards with Theory (C) and Lab (L) grades |
| Fee Challan | Challan generation, KuickPay / Faysal Bank payment instructions |
| Fee Details | Consolidated ledger with transaction history |
| Course Feedback | Star-rating evaluation forms per course |
| Retake Exam Request | PDF upload (max 3 MB), 3-day window, 2000 Rs/paper fee note |
| Course Withdraw | Image upload (max 650 KB), download form, initiate request |
| Grade Change | 2-week window enforcement, checkbox selection |

---

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/auth/login` | Login — returns JWT |
| GET | `/api/dashboard` | Home page data |
| GET | `/api/attendance` | Attendance records |
| GET | `/api/marks` | Marks & evaluations |
| GET | `/api/transcript` | Semester transcripts |
| GET | `/api/enrollments` | Course registration |
| GET | `/api/fees/challans` | Fee challans |
| GET | `/api/fees/details` | Fee ledger |
| GET | `/api/feedback` | Course feedback |
| GET | `/api/requests/retake` | Retake requests |
| GET | `/api/study-plan` | Tentative study plan |
| GET | `/api/grade-report` | Grade report |

All endpoints except `/api/auth/**` require `Authorization: Bearer <token>`.

---

## Default Credentials

```
Roll No:  24L-3072
Password: password123
```
