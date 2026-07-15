# Ninja Registration System

A complete registration and administration system built with Node.js, Express, SQLite, and Socket.IO.

## Features

- **Two-step public registration** with terms enforcement
- **SQLite database** with automatic initialization
- **Secure admin login** with bcrypt and session authentication
- **Real-time dashboard** powered by Socket.IO
- **User moderation**: Approve, Ban, Remove (soft-delete), Restore
- **Responsive UI** with dark ninja theme and live notifications
- **Rate limiting**, Helmet security, and parameterized queries

## Folder Structure

```
ninja-registration/
├── server.js                  # Entry point
├── config/env.js              # Environment config
├── database/
│   ├── connection.js          # SQLite helpers
│   └── initialize.js         # Schema creation
├── routes/
│   ├── registration.routes.js
│   ├── admin-auth.routes.js
│   └── admin-users.routes.js
├── controllers/
│   ├── registration.controller.js
│   ├── admin-auth.controller.js
│   └── admin-users.controller.js
├── services/
│   ├── registration.service.js
│   ├── admin-user.service.js
│   └── socket.service.js
├── repositories/user.repository.js
├── middleware/
│   ├── admin-auth.js
│   ├── validation.js
│   ├── rate-limit.js
│   ├── not-found.js
│   └── error-handler.js
├── utils/
│   ├── phone.js
│   ├── responses.js
│   └── validation.js
├── public/
│   ├── index.html             # Step 1 registration
│   ├── terms.html             # Step 2 terms
│   ├── success.html           # Success confirmation
│   ├── admin/
│   │   ├── login.html
│   │   └── dashboard.html
│   ├── css/
│   │   ├── global.css
│   │   ├── form.css
│   │   └── dashboard.css
│   └── js/
│       ├── form.js
│       ├── terms.js
│       ├── admin-login.js
│       └── dashboard.js
└── tests/
    ├── registration.test.js
    ├── admin-auth.test.js
    └── admin-users.test.js
```

## Installation

```bash
cd ninja-registration
npm install
```

## Environment Setup

Copy `.env.example` to `.env` and update values:

```bash
cp .env.example .env
```

```env
PORT=3000
NODE_ENV=development
SESSION_SECRET=replace-with-a-long-random-secret-32-characters
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=ChangeMe123!
DATABASE_PATH=./database/application.db
TERMS_VERSION=1.0
```

## Commands

| Command | Description |
|---|---|
| `npm run dev` | Start with nodemon (auto-restart) |
| `npm start` | Start production server |
| `npm test` | Run automated test suite |

## URLs

| URL | Description |
|---|---|
| `http://localhost:3000` | Public registration Step 1 |
| `http://localhost:3000/terms.html` | Public registration Step 2 |
| `http://localhost:3000/success.html` | Registration success page |
| `http://localhost:3000/admin/login.html` | Admin login |
| `http://localhost:3000/admin/dashboard.html` | Admin dashboard (requires login) |

## Default Admin Credentials

| Field | Value |
|---|---|
| Email | `admin@example.com` |
| Password | `ChangeMe123!` |

> **Change these in `.env` before deploying to production.**

## Database

- Location: `./database/application.db`
- Auto-created on first start
- Uses SQLite with parameterized queries
- Soft-deletion for removed users (no permanent deletes)

## API Endpoints

| Method | Path | Auth | Description |
|---|---|---|---|
| `POST` | `/api/registrations` | No | Submit registration |
| `POST` | `/api/admin/login` | No | Admin login |
| `POST` | `/api/admin/logout` | Yes | Admin logout |
| `GET` | `/api/admin/session` | No | Check session status |
| `GET` | `/api/admin/users` | Yes | List users (paginated) |
| `GET` | `/api/admin/users/:id` | Yes | Get single user |
| `PATCH` | `/api/admin/users/:id/approve` | Yes | Approve user |
| `PATCH` | `/api/admin/users/:id/ban` | Yes | Ban user |
| `DELETE` | `/api/admin/users/:id` | Yes | Soft-delete user |
| `PATCH` | `/api/admin/users/:id/restore` | Yes | Restore removed user |
| `GET` | `/api/admin/stats` | Yes | Dashboard statistics |

## Query Parameters (GET /api/admin/users)

| Param | Type | Default | Description |
|---|---|---|---|
| `page` | number | `1` | Page number |
| `limit` | number | `20` | Records per page |
| `search` | string | `""` | Search name/phone |
| `status` | string | `""` | Filter by status |
| `joinType` | string | `""` | Filter by join type |
| `sort` | string | `created_at` | Sort field |
| `order` | string | `desc` | Sort direction |

## Security

- **Helmet** for HTTP security headers
- **Rate limiting** on registration and login endpoints
- **Session-based** admin authentication with secure cookies
- **bcrypt** password comparison
- **Parameterized SQL** queries — no SQL injection
- **Server-side validation** on all inputs
- **HTTP-only cookies** with SameSite policy
- **Admin Socket.IO** rooms authenticated via server session

## Live Synchronization

When a new registration is submitted, the server emits `new-user-joined` via Socket.IO to all authenticated admins in the `admin-room`. Admins see the new user appear instantly without refreshing the page. When moderation actions occur, the dashboard updates stats and rows in real time using:

- `new-user-joined`
- `user-approved`
- `user-banned`
- `user-removed`
- `user-restored`
- `stats-updated`
