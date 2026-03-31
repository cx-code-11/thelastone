# TaskFlow — Multi-Tenant SaaS Todo App

A full-stack MERN application where each client gets an isolated workspace via subdomain.

```
client1.app.com  →  tenant: "client1"  →  sees only client1's data
team.app.com     →  tenant: "team"     →  sees only team's data
```

---

## Project Structure

```
multitenant-todo/
├── backend/
│   ├── server.js                   # Express entry point
│   ├── .env.example
│   ├── models/
│   │   ├── User.model.js           # name, email, password, role, tenant
│   │   └── Task.model.js           # title, desc, status, assigned_to, tenant
│   ├── middleware/
│   │   ├── tenant.middleware.js    # Extract subdomain → req.tenant
│   │   └── auth.middleware.js      # JWT verify + role guard
│   ├── controllers/
│   │   ├── auth.controller.js
│   │   ├── task.controller.js
│   │   ├── user.controller.js
│   │   └── tenant.controller.js
│   └── routes/
│       ├── auth.routes.js
│       ├── task.routes.js
│       ├── user.routes.js
│       └── tenant.routes.js
└── frontend/
    ├── index.html
    ├── vite.config.js
    ├── tailwind.config.js
    ├── .env.example
    └── src/
        ├── main.jsx
        ├── App.jsx                 # Routes + guards
        ├── index.css
        ├── utils/api.js            # Axios + tenant injector
        ├── context/AuthContext.jsx # Global auth state
        ├── components/Layout.jsx   # Sidebar nav
        └── pages/
            ├── LoginPage.jsx
            ├── DashboardPage.jsx
            ├── TasksPage.jsx
            ├── CreateTaskPage.jsx
            └── UsersPage.jsx
```

---

## Prerequisites

- Node.js 18+
- MongoDB (local or Atlas)
- npm

---

## Setup

### 1. Backend

```bash
cd backend
cp .env.example .env
# Edit .env:
#   MONGO_URI=mongodb://localhost:27017/multitenant_todo
#   JWT_SECRET=change_me_in_production
#   JWT_EXPIRES_IN=7d
#   PORT=4000

npm install
npm run dev
# Server running on http://localhost:4000
```

### 2. Frontend

```bash
cd frontend
cp .env.example .env
# Edit .env:
#   VITE_API_URL=http://localhost:4000

npm install
npm run dev
# App running on http://localhost:5173
```

---

## Environment Variables

### Backend `.env`
```env
PORT=4000
MONGO_URI=mongodb://localhost:27017/multitenant_todo
JWT_SECRET=your_super_secret_jwt_key_change_in_production
JWT_EXPIRES_IN=7d
```

### Frontend `.env`
```env
VITE_API_URL=http://localhost:4000
```

---

## First-time Setup: Create a Tenant

Use `X-Tenant` header to simulate subdomains locally.

```bash
# Create tenant "client1" with an admin user
curl -X POST http://localhost:4000/api/tenants \
  -H "Content-Type: application/json" \
  -H "X-Tenant: client1" \
  -d '{
    "tenantName": "client1",
    "adminName": "Alice Admin",
    "adminEmail": "alice@client1.com",
    "adminPassword": "secret123"
  }'
```

```bash
# Create a second tenant "team"
curl -X POST http://localhost:4000/api/tenants \
  -H "Content-Type: application/json" \
  -H "X-Tenant: team" \
  -d '{
    "tenantName": "team",
    "adminName": "Bob Admin",
    "adminEmail": "bob@team.com",
    "adminPassword": "secret123"
  }'
```

---

## API Reference

### Authentication

```bash
# Login
curl -X POST http://localhost:4000/api/auth/login \
  -H "Content-Type: application/json" \
  -H "X-Tenant: client1" \
  -d '{"email":"alice@client1.com","password":"secret123"}'
# → { token: "eyJ...", user: { id, name, email, role, tenant } }

# Get current user
curl http://localhost:4000/api/auth/me \
  -H "Authorization: Bearer <TOKEN>" \
  -H "X-Tenant: client1"
```

### Users (admin only)

```bash
# List users
curl http://localhost:4000/api/users \
  -H "Authorization: Bearer <TOKEN>" \
  -H "X-Tenant: client1"

# Create user
curl -X POST http://localhost:4000/api/users \
  -H "Authorization: Bearer <TOKEN>" \
  -H "X-Tenant: client1" \
  -H "Content-Type: application/json" \
  -d '{"name":"Carol","email":"carol@client1.com","password":"pass123","role":"team"}'

# Delete user
curl -X DELETE http://localhost:4000/api/users/<USER_ID> \
  -H "Authorization: Bearer <TOKEN>" \
  -H "X-Tenant: client1"
```

### Tasks

```bash
# List tasks (filtered by role)
curl http://localhost:4000/api/tasks \
  -H "Authorization: Bearer <TOKEN>" \
  -H "X-Tenant: client1"

# Create task (admin only)
curl -X POST http://localhost:4000/api/tasks \
  -H "Authorization: Bearer <TOKEN>" \
  -H "X-Tenant: client1" \
  -H "Content-Type: application/json" \
  -d '{"title":"Fix login bug","description":"Urgent","assigned_to":"<USER_ID>"}'

# Update task status (admin + team)
curl -X PATCH http://localhost:4000/api/tasks/<TASK_ID> \
  -H "Authorization: Bearer <TOKEN>" \
  -H "X-Tenant: client1" \
  -H "Content-Type: application/json" \
  -d '{"status":"in-progress"}'

# Delete task (admin only)
curl -X DELETE http://localhost:4000/api/tasks/<TASK_ID> \
  -H "Authorization: Bearer <TOKEN>" \
  -H "X-Tenant: client1"
```

---

## Role Permissions

| Action              | Admin | Team | Client |
|---------------------|-------|------|--------|
| Create tenant       | ✅    | ❌   | ❌     |
| Create users        | ✅    | ❌   | ❌     |
| View all tasks      | ✅    | ❌   | ❌     |
| View own tasks      | ✅    | ✅   | ✅     |
| Create tasks        | ✅    | ❌   | ❌     |
| Update task status  | ✅    | ✅   | ❌     |
| Delete tasks        | ✅    | ❌   | ❌     |

---

## Multi-Tenant Architecture

### How tenant isolation works:

1. **Request arrives** → `extractTenant` middleware reads `X-Tenant` header or parses subdomain from `Host`
2. **Auth check** → JWT is verified; token's `tenant` field must match `req.tenant`
3. **All DB queries** filter by `{ tenant: req.tenant }` — data from other tenants is never returned
4. **Compound index** on `(email, tenant)` means the same email can exist across tenants

### Subdomain setup for production (Nginx):

```nginx
server {
    listen 80;
    server_name *.app.com;

    location /api/ {
        proxy_pass http://localhost:4000;
        proxy_set_header Host $host;
    }

    location / {
        root /var/www/taskflow/dist;
        try_files $uri $uri/ /index.html;
    }
}
```

---

## Production Deployment

```bash
# Build frontend
cd frontend && npm run build
# Output in frontend/dist/ — serve with Nginx

# Backend with PM2
npm install -g pm2
cd backend && pm2 start server.js --name taskflow-api
```

---

## Frontend Pages

| Page | Route | Roles |
|------|-------|-------|
| Login | `/login` | Public |
| Dashboard | `/dashboard` | All |
| Task List | `/tasks` | All |
| Create Task | `/tasks/new` | Admin |
| User Management | `/users` | Admin |
