const fs = require('fs');
const { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType } = require('docx');

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
                text: "Complete Project Structure & File Breakdown",
                alignment: AlignmentType.CENTER,
                spacing: { after: 400 }
            }),

            // Project Structure Overview
            new Paragraph({
                text: "PROJECT STRUCTURE OVERVIEW",
                heading: HeadingLevel.HEADING_1,
                spacing: { before: 400, after: 200 }
            }),

            new Paragraph({
                text: "AlertDavao/",
                spacing: { after: 100 }
            }),
            new Paragraph({ text: "├── AdminSide/          (Web-based admin panel)" }),
            new Paragraph({ text: "│   ├── admin/          (Laravel application)" }),
            new Paragraph({ text: "│   └── sarima_api/     (Python SARIMA prediction API)" }),
            new Paragraph({ text: "└── UserSide/           (React Native mobile app)", spacing: { after: 300 } }),

            // AdminSide Detailed Structure
            new Paragraph({
                text: "1. ADMINSIDE - WEB APPLICATION",
                heading: HeadingLevel.HEADING_1,
                spacing: { before: 400, after: 200 }
            }),

            new Paragraph({
                text: "AdminSide/admin/ (Laravel 10 Framework)",
                heading: HeadingLevel.HEADING_2,
            }),

            new Paragraph({
                text: "Core Application Files:",
                heading: HeadingLevel.HEADING_3,
                spacing: { before: 200 }
            }),

            new Paragraph({ text: "app/Http/Controllers/" }),
            new Paragraph({ text: "  • AuthController.php - Handles admin/police login, OTP verification" }),
            new Paragraph({ text: "  • DashboardController.php - Displays statistics, charts, crime data" }),
            new Paragraph({ text: "  • ReportController.php - Manages crime reports (view, update, delete)" }),
            new Paragraph({ text: "  • UserController.php - User management, flagging, restrictions" }),
            new Paragraph({ text: "  • MapController.php - Crime mapping, heatmaps, CSV data processing" }),
            new Paragraph({ text: "  • VerificationController.php - User verification requests" }),
            new Paragraph({ text: "  • MessageController.php - Chat system between admin and users" }),
            new Paragraph({ text: "  • NotificationController.php - Push notifications management" }),
            new Paragraph({ text: "  • StatisticsController.php - Crime analytics and trends" }),
            new Paragraph({ text: "  • PersonnelController.php - Police personnel management", spacing: { after: 200 } }),

            new Paragraph({ text: "app/Services/" }),
            new Paragraph({ text: "  • EncryptionService.php - AES-256-CBC encryption/decryption" }),
            new Paragraph({ text: "    Location: AdminSide/admin/app/Services/EncryptionService.php" }),
            new Paragraph({ text: "    Function: Encrypts sensitive data (phone, address) using Laravel Crypt" }),
            new Paragraph({ text: "    Algorithm: AES-256-CBC with base64-encoded APP_KEY", spacing: { after: 200 } }),

            new Paragraph({ text: "app/Models/" }),
            new Paragraph({ text: "  • User.php - User model with authentication" }),
            new Paragraph({ text: "  • Report.php - Crime report model" }),
            new Paragraph({ text: "  • UserFlag.php - User flagging system" }),
            new Paragraph({ text: "  • UserRestriction.php - User restriction levels", spacing: { after: 200 } }),

            new Paragraph({ text: "resources/views/ (Blade Templates)" }),
            new Paragraph({ text: "  • dashboard.blade.php - Main admin dashboard" }),
            new Paragraph({ text: "  • reports.blade.php - Crime reports table" }),
            new Paragraph({ text: "  • users.blade.php - User management interface" }),
            new Paragraph({ text: "  • view-map.blade.php - Interactive crime map" }),
            new Paragraph({ text: "  • verification.blade.php - User verification queue" }),
            new Paragraph({ text: "  • flagged-users.blade.php - Flagged users management", spacing: { after: 200 } }),

            new Paragraph({ text: "database/migrations/" }),
            new Paragraph({ text: "  • SQL schema definitions for all tables" }),
            new Paragraph({ text: "  • User flags, restrictions, reports, messages", spacing: { after: 300 } }),

            // SARIMA API
            new Paragraph({
                text: "AdminSide/sarima_api/ (Python Flask API)",
                heading: HeadingLevel.HEADING_2,
            }),
            new Paragraph({ text: "  • app.py - Flask server for crime prediction" }),
            new Paragraph({ text: "  • sarima_model.pkl - Trained SARIMA model" }),
            new Paragraph({ text: "  • Function: Predicts future crime trends using time-series analysis", spacing: { after: 300 } }),

            // UserSide Detailed Structure
            new Paragraph({
                text: "2. USERSIDE - MOBILE APPLICATION",
                heading: HeadingLevel.HEADING_1,
                spacing: { before: 400, after: 200 }
            }),

            new Paragraph({
                text: "UserSide/ (React Native + Expo)",
                heading: HeadingLevel.HEADING_2,
            }),

            new Paragraph({
                text: "app/(tabs)/ - Main Application Screens:",
                heading: HeadingLevel.HEADING_3,
                spacing: { before: 200 }
            }),

            new Paragraph({ text: "  • index.tsx - Dashboard/Home screen with quick actions" }),
            new Paragraph({ text: "  • login.tsx - User login with Google OAuth, email/password" }),
            new Paragraph({ text: "  • register.tsx - User registration with OTP verification" }),
            new Paragraph({ text: "  • report.tsx - Crime report submission form" }),
            new Paragraph({ text: "  • history.tsx - User's submitted reports history" }),
            new Paragraph({ text: "  • profile.tsx - User profile management" }),
            new Paragraph({ text: "  • ChatScreen.tsx - Real-time chat with admin/police" }),
            new Paragraph({ text: "  • chatlist.tsx - List of chat conversations" }),
            new Paragraph({ text: "  • guidelines.tsx - Community guidelines and rules" }),
            new Paragraph({ text: "  • location.tsx - Police station locator", spacing: { after: 200 } }),

            new Paragraph({
                text: "backends/ - Node.js Express API:",
                heading: HeadingLevel.HEADING_3,
            }),

            new Paragraph({ text: "  • server.js - Main Express server entry point" }),
            new Paragraph({ text: "  • db.js - PostgreSQL database connection" }),
            new Paragraph({ text: "  • handleLogin.js - User authentication logic" }),
            new Paragraph({ text: "  • handleRegister.js - User registration with validation" }),
            new Paragraph({ text: "  • handleGoogleAuth.js - Google OAuth authentication" }),
            new Paragraph({ text: "  • handleReport.js - Crime report submission" }),
            new Paragraph({ text: "  • handleOtp.js - OTP generation and verification" }),
            new Paragraph({ text: "  • handleCheckFlagStatus.js - Flag auto-expiration logic" }),
            new Paragraph({ text: "  • handleNotifications.js - Push notification system" }),
            new Paragraph({ text: "  • handleUserProfile.js - Profile updates" }),
            new Paragraph({ text: "  • handlePasswordReset.js - Password reset flow", spacing: { after: 200 } }),

            new Paragraph({
                text: "components/ - Reusable UI Components:",
                heading: HeadingLevel.HEADING_3,
            }),

            new Paragraph({ text: "  • AnimatedButton.tsx - Button with press animation" }),
            new Paragraph({ text: "  • AnimatedInput.tsx - Input with focus effects" }),
            new Paragraph({ text: "  • FadeInView.tsx - Fade-in animation wrapper" }),
            new Paragraph({ text: "  • FlagStatusBadge.tsx - Flag status indicator" }),
            new Paragraph({ text: "  • FlagCountdown.tsx - Countdown timer for flag expiration" }),
            new Paragraph({ text: "  • UpdateSuccessDialog.tsx - Success modal with animation" }),
            new Paragraph({ text: "  • NotificationPopup.tsx - Notification toast" }),
            new Paragraph({ text: "  • PhoneInput.tsx - Philippine phone number input", spacing: { after: 200 } }),

            new Paragraph({
                text: "services/ - Business Logic:",
                heading: HeadingLevel.HEADING_3,
            }),

            new Paragraph({ text: "  • notificationService.ts - Notification polling and display" }),
            new Paragraph({ text: "  • messageService.ts - Chat message handling" }),
            new Paragraph({ text: "  • inactivityManager.ts - Auto-logout after 5 min inactivity" }),
            new Paragraph({ text: "  • debugService.ts - Flag status API calls" }),
            new Paragraph({ text: "  • policeStationService.ts - Station data sync", spacing: { after: 200 } }),

            new Paragraph({
                text: "config/ - Configuration:",
                heading: HeadingLevel.HEADING_3,
            }),
            new Paragraph({ text: "  • googleAuth.ts - Google OAuth client IDs" }),
            new Paragraph({ text: "  • backend.ts - API base URL configuration" }),
            new Paragraph({ text: "  • supabase.ts - Supabase client (if used)", spacing: { after: 300 } }),

            // AES-256 Encryption Details
            new Paragraph({
                text: "3. AES-256-CBC ENCRYPTION IMPLEMENTATION",
                heading: HeadingLevel.HEADING_1,
                spacing: { before: 400, after: 200 }
            }),

            new Paragraph({
                text: "Primary Encryption File:",
                heading: HeadingLevel.HEADING_2,
            }),
            new Paragraph({ text: "File: AdminSide/admin/app/Services/EncryptionService.php" }),
            new Paragraph({ text: "Line 45: return Crypt::encryptString($text);" }),
            new Paragraph({ text: "Line 117: $decrypted = Crypt::decryptString($encryptedText);", spacing: { after: 200 } }),

            new Paragraph({
                text: "Encryption Details:",
                heading: HeadingLevel.HEADING_2,
            }),
            new Paragraph({ text: "• Algorithm: AES-256-CBC (Advanced Encryption Standard)" }),
            new Paragraph({ text: "• Key Size: 256 bits (32 bytes)" }),
            new Paragraph({ text: "• Key Source: Laravel APP_KEY in .env file" }),
            new Paragraph({ text: "• Key Format: base64:xxxxx (base64-encoded 32-byte key)" }),
            new Paragraph({ text: "• IV: Randomly generated 16-byte initialization vector" }),
            new Paragraph({ text: "• MAC: Message Authentication Code for integrity", spacing: { after: 200 } }),

            new Paragraph({
                text: "Encrypted Data Fields:",
                heading: HeadingLevel.HEADING_2,
            }),
            new Paragraph({ text: "• User phone numbers (contact field)" }),
            new Paragraph({ text: "• User addresses" }),
            new Paragraph({ text: "• Sensitive report details (if applicable)", spacing: { after: 200 } }),

            new Paragraph({
                text: "Usage in Controllers:",
                heading: HeadingLevel.HEADING_2,
            }),
            new Paragraph({ text: "• UserController.php - Encrypts user data before storage" }),
            new Paragraph({ text: "• VerificationController.php - Decrypts for verification" }),
            new Paragraph({ text: "• ProfileController.php - Decrypts for display to authorized users", spacing: { after: 300 } }),

            // Key Files Summary
            new Paragraph({
                text: "4. CRITICAL FILES SUMMARY",
                heading: HeadingLevel.HEADING_1,
                spacing: { before: 400, after: 200 }
            }),

            new Paragraph({
                text: "Authentication & Security:",
                heading: HeadingLevel.HEADING_2,
            }),
            new Paragraph({ text: "• AdminSide/admin/app/Services/EncryptionService.php - AES-256 encryption" }),
            new Paragraph({ text: "• UserSide/app/(tabs)/login.tsx - User login UI" }),
            new Paragraph({ text: "• UserSide/backends/handleLogin.js - Login API" }),
            new Paragraph({ text: "• UserSide/backends/handleOtp.js - OTP verification", spacing: { after: 200 } }),

            new Paragraph({
                text: "Core Features:",
                heading: HeadingLevel.HEADING_2,
            }),
            new Paragraph({ text: "• UserSide/app/(tabs)/report.tsx - Crime reporting" }),
            new Paragraph({ text: "• AdminSide/admin/app/Http/Controllers/MapController.php - Crime mapping" }),
            new Paragraph({ text: "• AdminSide/sarima_api/app.py - Crime prediction" }),
            new Paragraph({ text: "• UserSide/backends/handleCheckFlagStatus.js - Flag management", spacing: { after: 200 } }),

            new Paragraph({
                text: "Database:",
                heading: HeadingLevel.HEADING_2,
            }),
            new Paragraph({ text: "• UserSide/backends/db.js - PostgreSQL connection" }),
            new Paragraph({ text: "• AdminSide/admin/config/database.php - Laravel DB config", spacing: { after: 400 } }),
        ]
    }]
});

Packer.toBuffer(doc).then(buffer => {
    fs.writeFileSync('AlertDavao_Project_Structure.docx', buffer);
    console.log('✅ Project structure documentation created: AlertDavao_Project_Structure.docx');
});
