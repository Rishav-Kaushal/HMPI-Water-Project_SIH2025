# 💧 HMPI Water — Water Quality Assessment Platform

> **A full-stack web application for Heavy Metal Pollution Index (HMPI) based water-quality assessment.**

HMPI Water is a full-stack platform for analysing water-quality samples using heavy-metal concentration data and the Heavy Metal Pollution Index (HMPI) method.

The application combines a React frontend with a Django REST Framework backend, database-driven sample management, HMPI calculations, CSV workflows, authentication, and an interactive map for visualising water-quality data.

🌐 **Live Demo:** https://hmpi-water-sih2025.vercel.app/

---

## ✨ Features

| Feature | Description |
|---|---|
| 🧪 **HMPI Calculator** | Calculate HMPI with per-metal calculation details |
| 📊 **Dashboard** | Statistics generated from stored database records |
| 💧 **Sample Management** | Create, view, update, and delete water-quality samples |
| 🗺️ **Interactive Map** | Visualise samples using real coordinates and HMPI values |
| 📁 **CSV Import** | Import multiple water samples through CSV |
| 📤 **CSV Export** | Export stored sample data |
| 🔐 **Authentication** | Token-based authentication for protected operations |
| ⚙️ **Django Admin** | Manage samples, standards, and application data |
| 📋 **Reference Standards** | Database-backed standards with source/version metadata |
| 🔎 **Sample Details** | HMPI classification and detailed calculation breakdown |
| 🧪 **Automated Tests** | Backend test suite for core functionality |
| 🐘 **PostgreSQL Support** | PostgreSQL through `DATABASE_URL` for deployment |
| 💻 **SQLite Support** | SQLite for local development |

---

## 🛠️ Tech Stack

### Frontend
- **React**
- **Create React App**
- **JavaScript / JSX**
- **Leaflet** — Interactive maps
- **CSS**

### Backend
- **Python**
- **Django**
- **Django REST Framework**
- **SQLite** — Local development
- **PostgreSQL** — Production deployment

### Development & Deployment
- Git / GitHub
- REST API
- Environment variables
- Docker support
- Automated backend tests

---

## 📸 Application

The platform includes:
- Home / Overview
- HMPI Calculator
- Dashboard
- Sample Management
- Sample Entry
- CSV Upload
- Interactive Map
- Sample Details
- Login
- About
- Django Admin

---

## 🚀 Getting Started

### Prerequisites
Make sure you have installed:
- Python 3.x
- Node.js (LTS recommended)
- npm
- Git

---

## ⚙️ Backend Setup

From the project root:

```bash
cd backend
