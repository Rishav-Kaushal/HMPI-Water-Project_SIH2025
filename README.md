# HMPI Water — Merged Working Full-Stack Version

A clean, working full-stack web application for Heavy Metal Pollution Index (HMPI) based water-quality assessment. This version combines the stronger React UI with the backend sample, CSV, calculation and data-management workflow, while keeping the calculation method and reference standards explicit.

## What is actually working

- Real Django + Django REST Framework backend
- SQLite for local development, PostgreSQL through `DATABASE_URL` for deployment
- Real database models for water samples, heavy-metal readings, reference standards and HMPI results
- HMPI calculation API with per-metal calculation details
- Sample CRUD API
- Dashboard statistics calculated from stored database records
- Interactive Leaflet map using real sample coordinates, HMPI values and quality filters
- CSV import API + management command with duplicate-safe sample import
- CSV export
- Token authentication for protected write operations
- Django admin
- Reference standards stored in the database with source/version fields
- React frontend with home, calculator, dashboard, samples, sample entry, CSV upload, login, map and about pages
- Sample-detail page with HMPI quality classification and calculation breakdown
- Automated backend tests
- Demo CSV included

## 1. Backend setup

```bash
cd backend
python -m venv .venv
```

### Windows

You can activate the environment:

```powershell
.venv\Scripts\activate
```

If PowerShell blocks script activation, you can skip activation and run the environment's Python directly:

```powershell
.\.venv\Scripts\python.exe -m pip install -r requirements.txt
```

### macOS/Linux

```bash
source .venv/bin/activate
pip install -r requirements.txt
```

Then run:

```bash
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

The React development server proxies `/api` calls to Django.

The project uses Create React App, so use `npm start` rather than `npm run dev`.

## 2b. Single-server mode

The project can also serve the React application from Django after building the frontend.

From the project root:

```bash
cd frontend
npm install
npm run build
cd ..
python build_and_integrate.py
```

Then start Django:

```bash
cd backend
python manage.py migrate
python manage.py seed_standards
python manage.py runserver
```

Open http://127.0.0.1:8000/.

In this mode Django serves the React UI and `/api/` from the same application.

## 3. Load demo data

For the quickest demo:

```bash
cd backend
python manage.py import_samples ../data/sample_data.csv
```

Then open the Dashboard, Samples and Map pages.

The importer creates new samples and skips an existing sample ID instead of creating a duplicate sample.

## 4. Authentication

The frontend Login page uses the Django token authentication endpoint.

Create a user:

```bash
cd backend
python manage.py createsuperuser
```

Use that username/password in the React Login page.

Anonymous users can browse public data, use the calculator, view dashboard/map data and access CSV export. Creating, editing and deleting samples, recalculating stored samples and uploading CSV files require authentication. Reference-standard management is restricted to admin users.

## HMPI method

This build uses an explicitly versioned `HMPI-v1` method:

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

These defaults are application reference values, not a regulatory certification. Reference records are stored in the database and include source/version metadata. They can be reviewed or edited through Django Admin.

## Interactive map

The Map page plots stored samples using their real latitude and longitude values.

The map supports:

- sample markers with HMPI and quality information
- quality-based filtering
- map legend
- sample popups
- direct navigation from a map marker to the sample-detail page

Map data is served by:

```text
GET /api/map-samples/
```

## Production frontend build

To rebuild the React frontend and integrate it into Django:

```bash
cd frontend
npm install
npm run build
cd ..
python build_and_integrate.py
```

The generated frontend assets are copied into Django's template/static locations so the same Django application can serve the UI and API.

For production, use PostgreSQL through `DATABASE_URL` and keep secrets such as `DJANGO_SECRET_KEY` in environment variables rather than committing them to Git.

## Tests

```bash
cd backend
python manage.py test
```

## Useful API endpoints

- `GET /api/health/`
- `GET /api/dashboard/`
- `GET /api/map-samples/`
- `GET /api/samples/`
- `GET /api/samples/<id>/`
- `POST /api/samples/`
- `PUT /api/samples/<id>/`
- `DELETE /api/samples/<id>/`
- `POST /api/samples/<id>/recalculate/`
- `POST /api/calculate/`
- `POST /api/upload-csv/`
- `GET /api/export-csv/`
- `GET /api/standards/`
- `POST /api/auth/login/`
- `GET /api/auth/me/`

## Project structure

```text
HMPI/
├── backend/
│   ├── analysis/
│   ├── hmpi_system/
│   ├── templates/
│   ├── static/
│   ├── manage.py
│   └── requirements.txt
├── frontend/
│   ├── public/
│   ├── src/
│   ├── package.json
│   └── package-lock.json
├── data/
│   └── sample_data.csv
├── docs/
├── build_and_integrate.py
├── docker-compose.yml
├── Dockerfile
├── docker-entrypoint.sh
├── .env.example
├── .gitignore
└── README.md
```

## Important

The older generated project contained environment folders, `node_modules`, duplicate/generated scripts and hardcoded demo analytics. This merged version intentionally keeps source code, migrations, configuration and lockfiles only. Local environments and runtime databases should remain untracked.
