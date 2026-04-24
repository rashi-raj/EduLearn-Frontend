# EduLearn Frontend

EduLearn Frontend is the Angular-based user interface for the **EduLearn Online Learning Platform**. It provides role-based dashboards and smooth user interaction for Students, Instructors, and Admins.

---

## Project Overview

EduLearn is a full-stack e-learning platform where users can register, login, browse courses, enroll in courses, access lessons, track progress, attempt quizzes, and manage learning activities based on their role.

This frontend communicates with the backend microservices through the **API Gateway**.

---

## Tech Stack

| Technology | Purpose |
|---|---|
| Angular | Frontend framework |
| TypeScript | Application logic |
| HTML5 | Page structure |
| CSS3 | Styling and layout |
| Reactive Forms | Login, register, forms and validation |
| Angular Router | Page navigation |
| HTTP Client | API communication |
| JWT | Secured user session |
| Razorpay Test Mode | Payment testing |
| Kafka-connected Notification Flow | Notification handling through backend |

---

## Main Features

### Authentication

- User registration
- User login
- JWT token handling
- Role-based redirection
- Logout
- Protected routes
- Google OAuth login support, if enabled from backend

### Role-Based Access

| Role | Access |
|---|---|
| Student | Browse courses, enroll, view lessons, track progress, make payments, attempt quizzes |
| Instructor | Create/manage courses, add lessons, view enrolled students |
| Admin | Manage users, courses, platform data and overall system access |

---

## Frontend Flow

```text
User opens Angular App
        ↓
Angular Router loads page
        ↓
Component displays UI
        ↓
User performs action
        ↓
Angular Service calls backend API
        ↓
Request goes through API Gateway
        ↓
Backend microservice processes request
        ↓
Response comes back to frontend
        ↓
UI updates dynamically