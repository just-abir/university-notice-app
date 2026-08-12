# 🎓 University CSE Department Notice Management System

A full-stack mobile application for the Department of Computer Science & Engineering to manage and distribute academic notices from teachers to students.

---

## 📁 Project Structure

```
university-notice-app/
├── server/           # Express.js + MongoDB REST API
└── client/           # Expo React Native mobile app
```

---

## 🖥️ Server

### Tech Stack
| Layer | Technology |
|---|---|
| Runtime | Node.js (Express.js) |
| Database | MongoDB (Mongoose) |
| Auth | JWT (Access + Refresh tokens) |
| File Upload | Multer + Cloudinary (PDFs) |
| Email | Nodemailer + Gmail SMTP |
| Push Notifications | Expo Push Notification Service |
| Excel Import | `xlsx` |

### Setup

```bash
cd server
npm install

# Configure environment
cp .env.example .env
# Edit .env with your MongoDB URI, JWT secrets, Cloudinary keys, Gmail credentials
```

### Environment Variables (`.env`)

```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/cse_notice_db

JWT_SECRET=your_super_secret_jwt_key_here
JWT_EXPIRES_IN=15m
JWT_REFRESH_SECRET=your_super_secret_refresh_key_here
JWT_REFRESH_EXPIRES_IN=7d

CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

EMAIL_FROM_NAME=CSE Notice System
EMAIL_FROM_ADDRESS=your_gmail@gmail.com
GMAIL_USER=your_gmail@gmail.com
GMAIL_APP_PASSWORD=your_gmail_app_password
```

> **Gmail App Password**: Go to Google Account → Security → 2-Step Verification → App Passwords → Generate a password for "Mail"

### Start Server

```bash
npm run dev   # Development with nodemon
npm start     # Production
```

### API Endpoints

| Method | Route | Access | Description |
|---|---|---|---|
| POST | `/api/auth/login` | Public | Login with email/password |
| POST | `/api/auth/refresh` | Public | Refresh access token |
| GET | `/api/auth/me` | Auth | Get current user |
| PUT | `/api/auth/me` | Auth | Update profile / push token |
| PUT | `/api/auth/change-password` | Auth | Change password |
| POST | `/api/auth/forgot-password` | Public | Send reset email |
| POST | `/api/auth/reset-password` | Public | Reset with token |
| POST | `/api/auth/logout` | Auth | Invalidate refresh token |
| **Notices** | | | |
| GET | `/api/notices` | Teacher | My notices (paginated) |
| POST | `/api/notices` | Teacher | Create notice (TEXT/PDF) |
| GET | `/api/notices/feed` | Student | Student notice feed |
| GET | `/api/notices/:id` | Both | Notice detail |
| PUT | `/api/notices/:id` | Teacher | Edit own notice |
| DELETE | `/api/notices/:id` | Teacher | Soft-delete notice |
| POST | `/api/notices/:id/read` | Student | Mark as read |
| GET | `/api/notices/:id/read-status` | Teacher | Read/unread breakdown |
| **Comments** | | | |
| GET | `/api/notices/:id/comments` | Both | Get comments |
| POST | `/api/notices/:id/comments` | Student | Add comment |
| DELETE | `/api/notices/:id/comments/:cid` | Both | Delete comment |
| **Students** | | | |
| GET | `/api/students/search` | Teacher | Search students |
| POST | `/api/students/resolve-audience` | Teacher | Preview recipient count |
| **Admin** | | | |
| POST | `/api/admin/import/students` | Admin | Bulk import via Excel |
| POST | `/api/admin/import/teachers` | Admin | Bulk import via Excel |
| GET | `/api/admin/users` | Admin | List all users |
| GET | `/api/admin/groups` | Teacher/Admin | List groups |
| POST | `/api/admin/groups` | Teacher | Create group |
| PUT | `/api/admin/groups/:id` | Teacher | Update group |
| DELETE | `/api/admin/groups/:id` | Teacher | Delete group |

### Admin: Excel Import Format

**Students Excel** columns (case-insensitive):
`Name, Email, Roll, RegistrationNo, Year, Semester, Batch, Gender`

**Teachers Excel** columns:
`Name, Email, Designation, Gender`

---

## 📱 Client

### Tech Stack

| Layer | Technology |
|---|---|
| Framework | Expo SDK 51 (React Native) |
| Navigation | Expo Router (file-based) |
| State | Zustand |
| HTTP | Axios (with token refresh interceptor) |
| Storage | Expo SecureStore |
| Push Notifications | Expo Notifications |
| File Picker | Expo Document Picker |
| Animations | React Native Animated |

### Setup

```bash
cd client
npm install
```

> Update `constants/api.ts` with your server IP:
> - Android Emulator: `http://10.0.2.2:5000/api`
> - iOS Simulator: `http://localhost:5000/api`
> - Physical Device: `http://YOUR_LOCAL_IP:5000/api`

### Run

```bash
npx expo start
# Press `a` for Android, `i` for iOS
```

---

## 🧩 Target Audience Types

| Type | Description |
|---|---|
| `SPECIFIC_ROLL` | One or more specific roll numbers |
| `ROLL_RANGE` | All students between roll A and roll B |
| `YEAR_ALL` | All students of a specific year (1–5) |
| `YEAR_FEMALE` | Female students of a specific year |
| `ALL_CSE` | Every active CSE student |
| `ALL_CSE_FEMALE` | All female CSE students |
| `CUSTOM_GROUP` | A teacher-defined named group |

---

## 👤 User Roles

| Role | Can Do |
|---|---|
| **Teacher** | Create/Edit/Delete notices, view read status, manage custom groups |
| **Student** | View assigned notices, mark as read, comment/reply |
| **Admin** | Import users via Excel (Admin module — future) |

---

## 🔐 Auth Flow

1. Admin imports users via Excel → system creates accounts with temporary passwords
2. System emails credentials to each user
3. On first login, user is forced to change their password
4. Access token (15m) + Refresh token (7d) issued
5. Client auto-refreshes tokens via Axios interceptor

---

## ✨ Features

- 🌙 **Dark theme** throughout — premium dark UI
- 📊 **Read status** with progress bar and per-student tracking
- 📄 **PDF notices** uploaded to Cloudinary, linked in-app
- 🔔 **Push notifications** (Expo) + **Email fallback** for students without the app
- 👥 **Custom groups** — teachers can define reusable audience groups
- 🔍 **Student search** with name, roll, year, batch filters
- 📱 **Infinite scroll + pull-to-refresh** on all lists
- 💬 **Flat comments** (one-level replies) on notices
- 🔒 **JWT refresh** — seamless token renewal, no re-login
