# HMPI Water — Merged Working Full-Stack Version

A clean rebuild that combines the stronger UI from the improved frontend with the richer sample, CSV, calculation and data-management concepts from the original HMPI project.

## What is actually working

- Real Django + Django REST Framework backend
- SQLite for local development, PostgreSQL through `DATABASE_URL` for deployment
- Real database models for samples, metal readings, standards and HMPI results
- HMPI calculation API
- Sample CRUD API
- Dashboard statistics from real database records
- CSV import API + management command
- CSV export
- Token authentication for write operations
- Django admin
- Reference standards stored in the database
- Calculation details per metal
- React frontend with home, calculator, dashboard, samples, sample entry, CSV upload, login and about pages
- Automated backend tests
- Demo CSV included

## 1. Backend

```bash
cd backend
python -m venv .venv
# Windows:
.venv\Scripts\activate
# macOS/Linux:
source .venv/bin/activate

pip install -r requirements.txt
python manage.py migrate
python manage.py seed_standards
python manage.py createsuperuser
python manage.py runserver
```

Backend API: http://127.0.0.1:8000/api/  
Admin: http://127.0.0.1:8000/admin/  

## 2. Frontend development

Open a second terminal:

```bash
cd frontend
npm install
npm start
```

Frontend: http://localhost:3000

The React dev server proxies `/api` calls to Django.


## 2b. Single-server mode

This ZIP includes a production React build and its assets can be integrated into Django with:

```bash
python build_and_integrate.py
cd backend
python manage.py migrate
python manage.py seed_standards
python manage.py runserver
```

Then http://127.0.0.1:8000 serves the React application and `/api/` serves the Django API.

## 3. Load demo data

For the quickest demo:

```bash
cd backend
python manage.py import_samples ../data/sample_data.csv
```

Then open the Dashboard and Samples pages.

## 4. Authentication

The frontend Login page uses the Django token endpoint.

Create a user:

```bash
cd backend
python manage.py createsuperuser
```

Use that username/password in the React Login page.

Anonymous users can browse, use the calculator, view dashboard data and download CSV. Creating/editing/deleting samples and uploading CSV require authentication.

## HMPI method

This build uses a deliberately explicit `HMPI-v1` method:

- standard/reference limit: `S_i`
- ideal value: `I_i` (default `0`)
- weight: `W_i = 1 / (S_i - I_i)`
- sub-index: `Q_i = ((C_i - I_i) / (S_i - I_i)) × 100`
- HMPI: `Σ(W_i Q_i) / ΣW_i`

Quality bands are:
- `<= 25`: Excellent
- `<= 50`: Good
- `<= 75`: Poor
- `<= 100`: Very Poor
- `> 100`: Unsuitable

These defaults are application reference values, not a regulatory certification. Each reference record stores its source and version and can be edited from Django Admin.

## Production frontend build

```bash
python build_and_integrate.py
```

This builds React and copies the build output into Django's templates/static directories so the same Django process can serve the UI and `/api/`. Keep PostgreSQL as the durable production database.

## Tests

```bash
cd backend
python manage.py test
```

## Useful API endpoints

- `GET /api/health/`
- `GET /api/dashboard/`
- `GET /api/samples/`
- `GET /api/samples/<id>/`
- `POST /api/samples/`
- `POST /api/samples/<id>/recalculate/`
- `POST /api/calculate/`
- `POST /api/upload-csv/`
- `GET /api/export-csv/`
- `GET /api/standards/`
- `POST /api/auth/login/`
- `GET /api/auth/me/`

## Important

The old generated ZIP contained `venv/`, `node_modules/`, duplicate scripts and hardcoded demo analytics. This merged version intentionally removes those artifacts and keeps source code + lockfile only.
