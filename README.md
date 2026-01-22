# AlertDavao - Crime Reporting & Monitoring System

A comprehensive crime reporting and monitoring system for Davao City with AdminSide (web) and UserSide (mobile app).

## 📁 Project Structure

```
alertdavao/
├── AdminSide/admin/    # Laravel web application for admin/police
├── UserSide/           # React Native mobile app for citizens
├── docs/               # Project documentation (.docx files)
├── resources/          # Data files, boundaries, and assets
└── README.md           # This file
```

## 🚀 Quick Start

### AdminSide (Laravel Web App)
```bash
cd AdminSide/admin
composer install
cp .env.example .env
php artisan key:generate
php artisan migrate
php artisan serve
```

### UserSide (React Native Mobile App)
```bash
cd UserSide
npm install
npx expo start
```

## 📚 Documentation

Located in `docs/` folder:
- **Project_Structure.docx** - Complete project architecture
- **Technical_Documentation.docx** - Technical specifications
- **SARIMA_Implementation.docx** - Crime forecasting details
- **Testing_Scenarios.docx** - Testing procedures

## ✨ Key Features

- 🚨 Real-time crime reporting
- 🗺️ Interactive crime mapping with hotspots
- 📊 SARIMA-based crime forecasting
- 👮 Patrol officer dispatch system
- 📱 Push notifications
- ✉️ Email verification (SendGrid)
- 🔐 Role-based access control (RBAC)
- 🔒 End-to-end encryption for sensitive data

## 🛠️ Tech Stack

**AdminSide:**
- Laravel 11
- PostgreSQL
- Redis (caching)
- SendGrid (email)
- Leaflet.js (maps)

**UserSide:**
- React Native (Expo)
- Node.js backend
- PostgreSQL
- SendGrid (email)

## 📦 Deployment

- **Platform**: Render.com
- **AdminSide**: Docker container
- **UserSide Backend**: Node.js service
- **Database**: PostgreSQL

See deployment guide in `docs/` for detailed instructions.

## 📄 License

Proprietary - Davao City Police Office
