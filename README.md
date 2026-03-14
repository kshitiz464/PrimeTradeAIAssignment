# Task Management API

A scalable REST API built with FastAPI, PostgreSQL, and JWT authentication.

## Tech Stack
| Layer | Technology |
|---|---|
| Framework | FastAPI |
| Database | PostgreSQL |
| ORM | SQLAlchemy 2.x + Alembic |
| Auth | JWT (python-jose) + bcrypt |
| Frontend | Vanilla JS |

## Prerequisites
- Python 3.11+
- PostgreSQL 18

## Setup

### 1. Clone the repo
```bash
git clone <your-repo-url>
cd <project-folder>
```

### 2. Create virtual environment
```bash
python -m venv venv
venv\Scripts\activate
```

### 3. Install dependencies
```bash
pip install -r requirements.txt
```

### 4. Configure environment
```bash
cp .env.example .env
# Edit .env with your DB password and generated secret key
```

### 5. Create database
Create a PostgreSQL database named `taskapi`

### 6. Run migrations
```bash
alembic upgrade head
```

### 7. Start server
```bash
uvicorn app.main:app --reload
```

### 8. Open
- API Docs: http://localhost:8000/docs
- Frontend: http://localhost:8000

## API Endpoints

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | /api/v1/auth/register | None | Register new user |
| POST | /api/v1/auth/login | None | Login, get JWT |
| GET | /api/v1/auth/me | User | Get own profile |
| GET | /api/v1/users/ | Admin | List all users |
| GET | /api/v1/tasks/ | User | List tasks |
| POST | /api/v1/tasks/ | User | Create task |
| PUT | /api/v1/tasks/{id} | User | Update task |
| DELETE | /api/v1/tasks/{id} | User | Delete task |

## Security
- Passwords hashed with bcrypt (cost factor 12)
- JWT tokens expire in 30 minutes
- Role-based access: user vs admin
- Input validation via Pydantic
- SQL injection prevented via SQLAlchemy ORM

## Scalability Notes
- **Stateless auth:** JWT means any server instance handles any request — horizontal scaling ready
- **Connection pooling:** SQLAlchemy pools DB connections automatically
- **Modular structure:** auth, tasks are isolated modules — extract to microservices when needed
- **Indexing:** email and owner_id columns are indexed for fast queries
- **Docker ready:** Dockerfile + docker-compose.yml included for containerized deployment
- **Caching path:** Redis integration point exists — add cache-aside pattern on GET /tasks for high traffic