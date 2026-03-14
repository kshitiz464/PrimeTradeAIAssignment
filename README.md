# Task Management API

A scalable REST API built with FastAPI, PostgreSQL, and JWT authentication with role-based access control.

## Tech Stack

| Layer | Technology | Why |
|---|---|---|
| Framework | FastAPI | Auto Swagger docs, async-ready, Pydantic validation built-in |
| Database | PostgreSQL | Relational, ACID-compliant, supports enums and foreign keys |
| ORM | SQLAlchemy 2.x | Industry standard, prevents SQL injection, migration support |
| Migrations | Alembic | Version-controlled schema changes |
| Auth | JWT (python-jose) | Stateless, scalable across multiple server instances |
| Hashing | passlib[bcrypt] | bcrypt is deliberately slow — resists brute-force attacks |
| Validation | Pydantic v2 | Type-safe, auto-generates OpenAPI schema |
| Frontend | Vanilla JS | Single-page app, no build tools required |

## Prerequisites

- Python 3.11+
- PostgreSQL 18

## Getting Started

### 1. Clone the repository
```bash
git clone <repo-url>
cd PrimeTradeAIAssignment
```

### 2. Create virtual environment
```bash
python -m venv venv
venv\Scripts\activate        # Windows
source venv/bin/activate     # Mac/Linux
```

### 3. Install dependencies
```bash
pip install -r requirements.txt
```

### 4. Configure environment
```bash
cp .env.example .env
# Open .env and fill in your DATABASE_URL and SECRET_KEY
```

Generate a secret key:
```bash
python -c "import secrets; print(secrets.token_hex(32))"
```

### 5. Create PostgreSQL database
```sql
CREATE DATABASE taskapi;
```

### 6. Run migrations
```bash
alembic upgrade head
```

### 7. Start the server
```bash
uvicorn app.main:app --reload
```

### 8. Open in browser
- **Frontend UI:** http://localhost:8000
- **Swagger Docs:** http://localhost:8000/docs
- **ReDoc:** http://localhost:8000/redoc

## API Endpoints

| Method | Endpoint | Auth Required | Description |
|---|---|---|---|
| POST | /api/v1/auth/register | None | Register new user |
| POST | /api/v1/auth/login | None | Login, receive JWT token |
| GET | /api/v1/auth/me | User | Get own profile |
| GET | /api/v1/users/ | Admin only | List all users |
| GET | /api/v1/tasks/ | User | List tasks (admin sees all) |
| POST | /api/v1/tasks/ | User | Create a task |
| GET | /api/v1/tasks/{id} | User | Get single task |
| PUT | /api/v1/tasks/{id} | User | Update task |
| DELETE | /api/v1/tasks/{id} | User | Delete task |

## Project Structure
```
app/
├── main.py              # FastAPI app, CORS, exception handlers
├── core/
│   ├── config.py        # Environment-based settings
│   ├── database.py      # Engine, session, Base
│   ├── security.py      # JWT + bcrypt
│   └── dependencies.py  # get_current_user, require_admin
├── models/              # SQLAlchemy ORM models (DB tables)
├── schemas/             # Pydantic schemas (API contracts)
├── crud/                # Data access layer
└── api/v1/              # Route handlers
    ├── auth.py
    ├── users.py
    └── tasks.py
frontend/
├── index.html
├── app.js
└── style.css
```

## Security Measures

- Passwords hashed with **bcrypt** (cost factor 12) — never stored in plaintext
- **JWT tokens** expire in 30 minutes — limits exposure if token is stolen
- **Role-based access control** — users can only access their own data, admins see all
- **Input validation** via Pydantic — invalid data rejected before hitting business logic
- **SQL injection prevention** — SQLAlchemy ORM parameterizes all queries
- **Ownership checks** — every task operation verifies the requesting user owns the task
- Secrets managed via `.env` file — never committed to source control

## Scalability Notes

### Horizontal Scaling
JWT authentication is **stateless** — no server-side sessions. Any number of server instances behind a load balancer (Nginx / AWS ALB) can validate any token independently. Just run multiple `uvicorn` instances with Gunicorn as the process manager.

### Database Scaling
- **Connection pooling** — SQLAlchemy pools connections automatically. Tune `pool_size` and `max_overflow` for production load.
- **Indexed columns** — `users.email` and `tasks.owner_id` are indexed. These are the hot query paths.
- **Read replicas** — Route GET endpoints to PostgreSQL read replicas, writes to primary.

### Caching (Redis — next step)
Add a cache-aside pattern on `GET /tasks/` using Redis. Check cache first, fall back to DB on miss, write result to cache with TTL. The `crud/` layer makes this a clean insertion point.

### Microservices Path
The modular structure (auth, tasks as isolated modules with their own models, schemas, CRUD, and routes) means each can be extracted into its own service with its own database with minimal refactoring. The `schemas/` layer provides the inter-service API contract.

### Docker
`Dockerfile` and `docker-compose.yml` included — spins up PostgreSQL + FastAPI together. Run with:
```bash
docker-compose up --build
```

## API Documentation

- **Swagger UI:** http://localhost:8000/docs (interactive, login with Authorize button)
- **ReDoc:** http://localhost:8000/redoc (clean readable format)
- **Postman Collection:** `postman_collection.json` in repo root