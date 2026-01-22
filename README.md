# AlertDavao - Crime Reporting & Monitoring System

A comprehensive crime reporting and monitoring system for Davao City with AdminSide (web) and UserSide (mobile app).

## Project Structure

```
alertdavao/
├── AdminSide/          # Laravel web application for admin/police
│   └── admin/          # Main Laravel app
├── UserSide/           # React Native mobile app for citizens
└── Documentation files (.docx)
```

## Quick Start

### AdminSide (Laravel)
```bash
cd AdminSide/admin
composer install
cp .env.example .env
php artisan key:generate
php artisan migrate
php artisan serve
```

### UserSide (React Native)
```bash
cd UserSide
npm install
npx expo start
```

## Documentation

- `AlertDavao_Project_Structure.docx` - Complete project architecture
- `AlertDavao_Technical_Documentation.docx` - Technical specifications
- `AlertDavao_SARIMA_Implementation.docx` - Crime forecasting implementation
- `AlertDavao_Testing_Scenarios.docx` - Testing procedures

## Deployment

See `AdminSide/admin/README.md` for deployment instructions.

## Key Features

- Real-time crime reporting
- Interactive crime mapping with hotspots
- SARIMA-based crime forecasting
- Patrol officer dispatch system
- Push notifications
- Email verification (SendGrid)
- Role-based access control
