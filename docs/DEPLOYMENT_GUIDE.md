# EduNotify — Deployment Guide

## 1. Development Setup (Local)

### Prerequisites
- Node.js v18+
- npm v9+

### Steps

```bash
# 1. Install backend
cd backend
npm install

# 2. Configure environment
# Edit .env file (defaults work for local SQLite)
cp .env.example .env   # (or use existing .env)

# 3. Seed demo data
npm run seed

# 4. Start backend
npm start
# Server runs at http://localhost:5000

# 5. Install frontend
cd ../frontend
npm install

# 6. Start frontend dev server
npm run dev
# UI runs at http://localhost:5173
```

---

## 2. Production Deployment (PostgreSQL)

### 2.1 Database Setup

```sql
-- Create database
CREATE DATABASE edunotify;

-- Connect to database
\c edunotify

-- Run schema
\i backend/database/schema.sql
```

### 2.2 Environment Configuration

Update `backend/.env`:

```env
PORT=5000
NODE_ENV=production
JWT_SECRET=<generate-a-strong-64-char-secret>

DB_DIALECT=postgres
DATABASE_URL=postgresql://user:password@host:5432/edunotify
PGUSER=your_pg_user
PGPASSWORD=your_pg_password
PGHOST=your_db_host
PGPORT=5432
PGDATABASE=edunotify
```

### 2.3 Seed Production Data

```bash
cd backend
npm run seed
```

### 2.4 Start Production Server

```bash
# Using PM2 for process management
npm install -g pm2
pm2 start src/app.js --name edunotify-api

# Check status
pm2 status
pm2 logs edunotify-api
```

### 2.5 Frontend Production Build

```bash
cd frontend

# Update API base URL in src/utils/api.js
# Change: const BASE_URL = 'https://your-domain.com/api';

npm run build
# Output: frontend/dist/
```

Serve the `dist/` folder via Nginx, Vercel, or any static hosting.

---

## 3. Nginx Configuration (Recommended)

```nginx
server {
    listen 80;
    server_name edunotify.yourdomain.com;

    # Frontend (React SPA)
    location / {
        root /var/www/edunotify/frontend/dist;
        try_files $uri $uri/ /index.html;
    }

    # Backend API Proxy
    location /api {
        proxy_pass http://127.0.0.1:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_cache_bypass $http_upgrade;
    }
}
```

---

## 4. Docker Deployment (Optional)

### Dockerfile (Backend)

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY backend/package*.json ./
RUN npm ci --production
COPY backend/ .
EXPOSE 5000
CMD ["node", "src/app.js"]
```

### docker-compose.yml

```yaml
version: '3.8'
services:
  postgres:
    image: postgres:15-alpine
    environment:
      POSTGRES_DB: edunotify
      POSTGRES_USER: edunotify_user
      POSTGRES_PASSWORD: secure_password
    volumes:
      - pgdata:/var/lib/postgresql/data
      - ./backend/database/schema.sql:/docker-entrypoint-initdb.d/schema.sql
    ports:
      - "5432:5432"

  api:
    build:
      context: .
      dockerfile: Dockerfile
    environment:
      PORT: 5000
      NODE_ENV: production
      JWT_SECRET: your-production-jwt-secret
      DB_DIALECT: postgres
      DATABASE_URL: postgresql://edunotify_user:secure_password@postgres:5432/edunotify
    depends_on:
      - postgres
    ports:
      - "5000:5000"

volumes:
  pgdata:
```

---

## 5. Environment Variables Reference

| Variable        | Required | Default                  | Description                    |
|----------------|----------|--------------------------|--------------------------------|
| PORT           | No       | 5000                     | HTTP server port               |
| NODE_ENV       | No       | development              | Environment mode               |
| JWT_SECRET     | Yes      | (hardcoded fallback)     | JWT signing secret             |
| DB_DIALECT     | No       | sqlite                   | Database engine (sqlite/postgres)|
| DATABASE_URL   | PG only  | —                        | PostgreSQL connection string   |
| PGUSER         | PG only  | —                        | PostgreSQL username            |
| PGPASSWORD     | PG only  | —                        | PostgreSQL password            |
| PGHOST         | PG only  | —                        | PostgreSQL host                |
| PGPORT         | PG only  | 5432                     | PostgreSQL port                |
| PGDATABASE     | PG only  | —                        | PostgreSQL database name       |

---

## 6. Health Checks

| Check              | Endpoint           | Expected Response          |
|-------------------|--------------------|----------------------------|
| API Server        | GET `/`            | `{ status: "ONLINE" }`    |
| Database          | GET `/api/auth/me` | 200 (with valid token)     |
| Queue Processor   | Console logs       | "Starting background worker loop" |
| Cron Scheduler    | Console logs       | "Initializing Daily 12:00 PM Cron Job" |

---

## 7. Security Checklist

- [ ] Change `JWT_SECRET` to a strong random value (64+ chars)
- [ ] Set `NODE_ENV=production` to suppress error stack traces
- [ ] Use HTTPS in production (SSL/TLS certificate)
- [ ] Restrict CORS origins to your frontend domain
- [ ] Set up PostgreSQL with strong credentials
- [ ] Enable database backups (pg_dump cron)
- [ ] Review audit logs periodically
- [ ] Rate limit the login endpoint
- [ ] Update `api.js` BASE_URL to production domain
