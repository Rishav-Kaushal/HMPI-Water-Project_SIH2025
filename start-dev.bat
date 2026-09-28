@echo off
setlocal
cd /d "%~dp0"
if not exist "backend\.venv\Scripts\python.exe" (
  echo Creating Python virtual environment...
  python -m venv backend\.venv
)
echo Installing backend dependencies...
backend\.venv\Scripts\python.exe -m pip install -r backend\requirements.txt
echo Starting Django...
start "HMPI Django" cmd /k "cd /d %~dp0backend && .venv\Scripts\python.exe manage.py migrate && .venv\Scripts\python.exe manage.py seed_standards && .venv\Scripts\python.exe manage.py runserver"
echo Starting React...
start "HMPI React" cmd /k "cd /d %~dp0frontend && npm install && npm start"
echo Done. React: http://localhost:3000  Django API: http://127.0.0.1:8000/api/
