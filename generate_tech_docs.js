const fs = require('fs');
const { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType, UnderlineType } = require('docx');

const doc = new Document({
    sections: [{
        properties: {},
        children: [
            // Title
            new Paragraph({
                text: "AlertDavao System",
                heading: HeadingLevel.TITLE,
                alignment: AlignmentType.CENTER,
            }),
            new Paragraph({
                text: "Technical Documentation for Defense",
                alignment: AlignmentType.CENTER,
                spacing: { after: 400 }
            }),

            // 1. System Architecture
            new Paragraph({
                text: "1. SYSTEM ARCHITECTURE",
                heading: HeadingLevel.HEADING_1,
                spacing: { before: 400, after: 200 }
            }),

            new Paragraph({
                text: "Architecture Type: Client-Server with MVC Pattern",
                heading: HeadingLevel.HEADING_2,
            }),
            new Paragraph({
                text: "The AlertDavao system follows a three-tier client-server architecture:",
                spacing: { after: 100 }
            }),
            new Paragraph({
                text: "• Presentation Layer: React Native mobile app (UserSide) and Laravel Blade web interface (AdminSide)",
                spacing: { after: 50 }
            }),
            new Paragraph({
                text: "• Application Layer: Node.js Express backend + Laravel PHP backend",
                spacing: { after: 50 }
            }),
            new Paragraph({
                text: "• Data Layer: PostgreSQL database hosted on Render",
                spacing: { after: 200 }
            }),

            // 2. Technology Stack
            new Paragraph({
                text: "2. TECHNOLOGY STACK",
                heading: HeadingLevel.HEADING_1,
                spacing: { before: 400, after: 200 }
            }),

            new Paragraph({
                text: "Frontend (UserSide Mobile App):",
                heading: HeadingLevel.HEADING_2,
            }),
            new Paragraph({ text: "• React Native 0.81.5" }),
            new Paragraph({ text: "• Expo SDK ~54.0.6" }),
            new Paragraph({ text: "• TypeScript 5.9.2" }),
            new Paragraph({ text: "• Expo Router 6.0.15 (file-based routing)" }),
            new Paragraph({ text: "• React Navigation 7.x", spacing: { after: 200 } }),

            new Paragraph({
                text: "Backend (AdminSide Web):",
                heading: HeadingLevel.HEADING_2,
            }),
            new Paragraph({ text: "• Laravel 10.10 (PHP 8.1)" }),
            new Paragraph({ text: "• Laravel Sanctum 3.3 (API authentication)" }),
            new Paragraph({ text: "• Blade templating engine", spacing: { after: 200 } }),

            new Paragraph({
                text: "Backend (UserSide API):",
                heading: HeadingLevel.HEADING_2,
            }),
            new Paragraph({ text: "• Node.js with Express 5.1.0" }),
            new Paragraph({ text: "• PostgreSQL driver (pg)" }),
            new Paragraph({ text: "• bcryptjs for password hashing", spacing: { after: 200 } }),

            new Paragraph({
                text: "Database:",
                heading: HeadingLevel.HEADING_2,
            }),
            new Paragraph({ text: "• PostgreSQL 16" }),
            new Paragraph({ text: "• Hosted on Render (cloud platform)" }),
            new Paragraph({ text: "• Reason: ACID compliance, relational integrity, JSON support, free tier with 90-day data retention", spacing: { after: 200 } }),

            // 3. APIs and Third-Party Services
            new Paragraph({
                text: "3. APIs AND THIRD-PARTY SERVICES",
                heading: HeadingLevel.HEADING_1,
                spacing: { before: 400, after: 200 }
            }),

            new Paragraph({ text: "• Google Maps API - Location services, geocoding, directions" }),
            new Paragraph({ text: "• Google OAuth 2.0 - Social authentication" }),
            new Paragraph({ text: "• Expo Location API - GPS coordinates" }),
            new Paragraph({ text: "• OpenStreetMap Overpass API - Barangay boundary data" }),
            new Paragraph({ text: "• Render API - Deployment and hosting", spacing: { after: 200 } }),

            // 4. Security Implementation
            new Paragraph({
                text: "4. SECURITY IMPLEMENTATION",
                heading: HeadingLevel.HEADING_1,
                spacing: { before: 400, after: 200 }
            }),

            new Paragraph({
                text: "Encryption (Laravel Crypt):",
                heading: HeadingLevel.HEADING_2,
            }),
            new Paragraph({ text: "• Algorithm: AES-256-CBC (Advanced Encryption Standard)" }),
            new Paragraph({ text: "• Location: AdminSide/admin/app/Services/EncryptionService.php" }),
            new Paragraph({ text: "• Used for: Sensitive user data (phone numbers, addresses)" }),
            new Paragraph({ text: "• Key: Stored in .env file (APP_KEY), 32-character base64 encoded", spacing: { after: 200 } }),

            new Paragraph({
                text: "Authentication:",
                heading: HeadingLevel.HEADING_2,
            }),
            new Paragraph({ text: "• Password Hashing: bcrypt (cost factor 10)" }),
            new Paragraph({ text: "• Session Management: AsyncStorage tokens (UserSide), Laravel sessions (AdminSide)" }),
            new Paragraph({ text: "• OTP Verification: 6-digit codes, 10-minute expiry" }),
            new Paragraph({ text: "• Google OAuth: Secure token exchange", spacing: { after: 200 } }),

            new Paragraph({
                text: "Input Validation:",
                heading: HeadingLevel.HEADING_2,
            }),
            new Paragraph({ text: "• Backend: Laravel validation rules, SQL parameterized queries" }),
            new Paragraph({ text: "• Frontend: TypeScript type checking, regex patterns" }),
            new Paragraph({ text: "• SQL Injection Prevention: Prepared statements ($1, $2 placeholders)", spacing: { after: 200 } }),

            // 5. Programming Languages
            new Paragraph({
                text: "5. PROGRAMMING LANGUAGES",
                heading: HeadingLevel.HEADING_1,
                spacing: { before: 400, after: 200 }
            }),

            new Paragraph({
                text: "TypeScript vs JavaScript:",
                heading: HeadingLevel.HEADING_2,
            }),
            new Paragraph({ text: "TypeScript is a superset of JavaScript that adds static typing:" }),
            new Paragraph({ text: "• Type Safety: Catches errors at compile-time, not runtime" }),
            new Paragraph({ text: "• IntelliSense: Better IDE autocomplete and documentation" }),
            new Paragraph({ text: "• Interfaces: Define data structure contracts" }),
            new Paragraph({ text: "• Example: interface User { id: string; email: string; }", spacing: { after: 200 } }),

            new Paragraph({
                text: "Languages Used:",
                heading: HeadingLevel.HEADING_2,
            }),
            new Paragraph({ text: "• TypeScript: UserSide mobile app (type-safe React Native)" }),
            new Paragraph({ text: "• JavaScript: Node.js backend APIs" }),
            new Paragraph({ text: "• PHP: Laravel AdminSide backend" }),
            new Paragraph({ text: "• SQL: Database queries and migrations", spacing: { after: 200 } }),

            // 6. System Limitations
            new Paragraph({
                text: "6. SYSTEM LIMITATIONS",
                heading: HeadingLevel.HEADING_1,
                spacing: { before: 400, after: 200 }
            }),

            new Paragraph({ text: "• Concurrent Users: ~100 simultaneous users (Render free tier limit)" }),
            new Paragraph({ text: "• Database Storage: 1GB limit on free tier" }),
            new Paragraph({ text: "• Image Upload: 5MB per image, 3 images per report" }),
            new Paragraph({ text: "• Offline Mode: Limited - requires internet for real-time features" }),
            new Paragraph({ text: "• Map Data: Dependent on Google Maps API quota (28,000 requests/month)", spacing: { after: 200 } }),

            // 7. Testing and Quality Assurance
            new Paragraph({
                text: "7. TESTING AND QUALITY ASSURANCE",
                heading: HeadingLevel.HEADING_1,
                spacing: { before: 400, after: 200 }
            }),

            new Paragraph({ text: "• Manual Testing: Functional testing on Android devices" }),
            new Paragraph({ text: "• Error Logging: Console logs, backend error tracking" }),
            new Paragraph({ text: "• Performance Monitoring: Page load time tracking (console timing)" }),
            new Paragraph({ text: "• Bug Reporting: User feedback system integrated" }),
            new Paragraph({ text: "• Code Review: Git version control with commit history", spacing: { after: 200 } }),

            // 8. Deployment and Hosting
            new Paragraph({
                text: "8. DEPLOYMENT AND HOSTING",
                heading: HeadingLevel.HEADING_1,
                spacing: { before: 400, after: 200 }
            }),

            new Paragraph({
                text: "Hosting Platform: Render (render.com)",
                heading: HeadingLevel.HEADING_2,
            }),
            new Paragraph({ text: "• Web Service: Laravel AdminSide (https://admin-alertdavao.onrender.com)" }),
            new Paragraph({ text: "• API Service: Node.js backend (https://node-server-gk1u.onrender.com)" }),
            new Paragraph({ text: "• Database: PostgreSQL managed instance" }),
            new Paragraph({ text: "• Auto-deploy: Connected to GitHub repository", spacing: { after: 200 } }),

            new Paragraph({
                text: "Mobile App Distribution:",
                heading: HeadingLevel.HEADING_2,
            }),
            new Paragraph({ text: "• Platform: Expo Application Services (EAS)" }),
            new Paragraph({ text: "• Build: Cloud-based APK generation" }),
            new Paragraph({ text: "• Distribution: Direct APK download link", spacing: { after: 200 } }),

            // 9. Backup and Recovery
            new Paragraph({
                text: "9. BACKUP AND RECOVERY",
                heading: HeadingLevel.HEADING_1,
                spacing: { before: 400, after: 200 }
            }),

            new Paragraph({ text: "• Database Backups: Automated daily backups by Render" }),
            new Paragraph({ text: "• Manual Backups: pg_dump SQL exports stored locally" }),
            new Paragraph({ text: "• Code Repository: GitHub with full version history" }),
            new Paragraph({ text: "• Recovery Time: ~15 minutes for database restore", spacing: { after: 200 } }),

            // 10. Performance and Reliability
            new Paragraph({
                text: "10. PERFORMANCE AND RELIABILITY",
                heading: HeadingLevel.HEADING_1,
                spacing: { before: 400, after: 200 }
            }),

            new Paragraph({
                text: "vs Manual Processes:",
                heading: HeadingLevel.HEADING_2,
            }),
            new Paragraph({ text: "• Report Submission: 2 minutes (app) vs 30+ minutes (in-person)" }),
            new Paragraph({ text: "• Data Accuracy: GPS coordinates vs manual address entry" }),
            new Paragraph({ text: "• Response Time: Real-time notifications vs delayed phone calls" }),
            new Paragraph({ text: "• Data Analysis: Automated statistics vs manual counting", spacing: { after: 200 } }),

            new Paragraph({
                text: "System Uptime:",
                heading: HeadingLevel.HEADING_2,
            }),
            new Paragraph({ text: "• Target: 99% uptime" }),
            new Paragraph({ text: "• Monitoring: Render health checks every 5 minutes" }),
            new Paragraph({ text: "• Auto-restart: On service failure", spacing: { after: 200 } }),

            // 11. Critical Bug Response
            new Paragraph({
                text: "11. CRITICAL BUG RESPONSE PROTOCOL",
                heading: HeadingLevel.HEADING_1,
                spacing: { before: 400, after: 200 }
            }),

            new Paragraph({ text: "1. User reports bug via in-app feedback or direct contact" }),
            new Paragraph({ text: "2. Reproduce bug in development environment" }),
            new Paragraph({ text: "3. Identify root cause through error logs and code review" }),
            new Paragraph({ text: "4. Implement fix and test locally" }),
            new Paragraph({ text: "5. Deploy fix to production (auto-deploy via GitHub push)" }),
            new Paragraph({ text: "6. Verify fix in production environment" }),
            new Paragraph({ text: "7. Notify affected users", spacing: { after: 200 } }),

            new Paragraph({
                text: "Response Time:",
                heading: HeadingLevel.HEADING_2,
            }),
            new Paragraph({ text: "• Critical bugs (security, data loss): <2 hours" }),
            new Paragraph({ text: "• Major bugs (feature broken): <24 hours" }),
            new Paragraph({ text: "• Minor bugs (UI issues): <1 week", spacing: { after: 400 } }),
        ]
    }]
});

Packer.toBuffer(doc).then(buffer => {
    fs.writeFileSync('AlertDavao_Technical_Documentation.docx', buffer);
    console.log('✅ Documentation created: AlertDavao_Technical_Documentation.docx');
});
