const { Document, Packer, Paragraph, TextRun, NumberFormat, AlignmentType, HeadingLevel } = require('docx');
const fs = require('fs');

// Helper to create a numbered item
function createNumberedItem(text, level = 0) {
    return new Paragraph({
        children: [new TextRun({ text: text, size: 22 })],
        indent: { left: 720 + (level * 360), hanging: 360 },
    });
}

// Helper to create a heading
function createHeading(text, level) {
    return new Paragraph({
        text: text,
        heading: level,
        spacing: { before: 200, after: 100 },
    });
}

// Create the document
const doc = new Document({
    sections: [{
        properties: {},
        children: [
            // Title
            new Paragraph({
                text: "AlertDavao Complete Testing Scenarios Document",
                heading: HeadingLevel.HEADING_1,
                alignment: AlignmentType.CENTER,
            }),
            new Paragraph({
                children: [
                    new TextRun({ text: "Project: ", bold: true }),
                    new TextRun("AlertDavao Crime Reporting and Monitoring System"),
                ],
            }),
            new Paragraph({
                children: [
                    new TextRun({ text: "Date: ", bold: true }),
                    new TextRun("December 2025"),
                ],
            }),
            new Paragraph({ text: "" }),

            // Table 36
            createHeading("Table 36. Summary of User Functionality Testing", HeadingLevel.HEADING_2),

            createHeading("1. User Registration (6 Scenarios)", HeadingLevel.HEADING_3),
            createNumberedItem("1. Validate that all required fields (firstname, lastname, email, password, contact) must be filled before submission."),
            createNumberedItem("2. Validate that email format follows correct pattern (e.g., user@domain.com)."),
            createNumberedItem("3. Validate that password must be at least 6 characters long."),
            createNumberedItem("4. Validate that phone number follows Philippine format (e.g., 9XXXXXXXXX)."),
            createNumberedItem("5. Validate that captcha verification must be completed before registration."),
            createNumberedItem("6. Validate that duplicate email addresses are rejected with appropriate error message."),

            createHeading("2. Identity Verification (6 Scenarios)", HeadingLevel.HEADING_3),
            createNumberedItem("1. Verify that camera/gallery permission is required before uploading documents."),
            createNumberedItem("2. Verify that ID picture upload functions correctly."),
            createNumberedItem("3. Verify that selfie with ID upload functions correctly."),
            createNumberedItem("4. Verify that billing document upload functions correctly."),
            createNumberedItem("5. Verify that already verified users cannot submit another verification request."),
            createNumberedItem("6. Verify that users with pending verification cannot submit duplicate requests."),

            createHeading("3. Authentication/Login (10 Scenarios)", HeadingLevel.HEADING_3),
            createNumberedItem("1. Validate that empty email and password fields show error message."),
            createNumberedItem("2. Validate that incorrect credentials display 'Invalid credentials' error."),
            createNumberedItem("3. Validate that connection timeout shows appropriate timeout message."),
            createNumberedItem("4. Validate that network errors display user-friendly error message."),
            createNumberedItem("5. Validate that captcha verification is required before login."),
            createNumberedItem("6. Validate that admin/police accounts are redirected to use AdminSide."),
            createNumberedItem("7. Validate that session expiry logs out user automatically."),
            createNumberedItem("8. Validate that OTP verification is required for Google Sign-In."),
            createNumberedItem("9. Validate that invalid OTP shows verification failed message."),
            createNumberedItem("10. Validate that inactivity logout displays appropriate notification."),

            createHeading("4. Incident Reporting (5 Scenarios)", HeadingLevel.HEADING_3),
            createNumberedItem("1. Verify that restricted users cannot submit reports."),
            createNumberedItem("2. Verify that location outside Davao City geofence is rejected."),
            createNumberedItem("3. Verify that media permission is required before uploading evidence."),
            createNumberedItem("4. Verify that files larger than 25MB are rejected with size error."),
            createNumberedItem("5. Verify that report submission failure shows appropriate error message."),

            createHeading("5. Phone/OTP Verification (4 Scenarios)", HeadingLevel.HEADING_3),
            createNumberedItem("1. Validate that invalid phone number format shows error message."),
            createNumberedItem("2. Validate that OTP must be exactly 6 digits."),
            createNumberedItem("3. Validate that incorrect OTP shows verification failed message."),
            createNumberedItem("4. Validate that expired OTP codes are rejected."),

            createHeading("6. Location Services/GPS (2 Scenarios)", HeadingLevel.HEADING_3),
            createNumberedItem("1. Verify that GPS permission denied shows appropriate message."),
            createNumberedItem("2. Verify that location outside Davao City boundary is detected and rejected."),

            createHeading("7. Real-time Chat/Messaging (4 Scenarios)", HeadingLevel.HEADING_3),
            createNumberedItem("1. Verify that message send failure shows error notification."),
            createNumberedItem("2. Verify that message loading failure displays retry option."),
            createNumberedItem("3. Verify that missing officer ID shows 'No officer available' message."),
            createNumberedItem("4. Verify that connection errors are handled gracefully."),

            createHeading("8. Notification Receipt (3 Scenarios)", HeadingLevel.HEADING_3),
            createNumberedItem("1. Verify that notification fetch errors display error message."),
            createNumberedItem("2. Verify that mark-as-read failures are handled gracefully."),
            createNumberedItem("3. Verify that background fetch errors do not crash the application."),

            createHeading("9. Report History Viewing (1 Scenario)", HeadingLevel.HEADING_3),
            createNumberedItem("1. Verify that report history loads and displays correctly for the logged-in user."),

            createHeading("10. Media Upload (Photos/Videos) (3 Scenarios)", HeadingLevel.HEADING_3),
            createNumberedItem("1. Verify that gallery/camera permission is required before upload."),
            createNumberedItem("2. Verify that files exceeding size limit show appropriate error."),
            createNumberedItem("3. Verify that upload failure displays retry option."),

            createHeading("11. Google Sign-In (6 Scenarios)", HeadingLevel.HEADING_3),
            createNumberedItem("1. Verify that Google user info fetch failure shows error message."),
            createNumberedItem("2. Verify that Google login failure displays appropriate error."),
            createNumberedItem("3. Verify that Google registration failure shows error message."),
            createNumberedItem("4. Verify that network timeout during Google auth shows timeout message."),
            createNumberedItem("5. Verify that network error during Google auth displays error."),
            createNumberedItem("6. Verify that phone number validation works for Google registration."),

            createHeading("12. User Profile Update (5 Scenarios)", HeadingLevel.HEADING_3),
            createNumberedItem("1. Verify that 404 error shows 'User not found' message."),
            createNumberedItem("2. Verify that 422 error shows 'Invalid data' message."),
            createNumberedItem("3. Verify that 500 error shows 'Server error' message."),
            createNumberedItem("4. Verify that network error shows connection error message."),
            createNumberedItem("5. Verify that successful update shows confirmation message."),

            new Paragraph({
                children: [new TextRun({ text: "TOTAL: 55 Scenarios", bold: true, size: 24 })],
                spacing: { before: 200 },
            }),

            // Table 37
            new Paragraph({ text: "" }),
            createHeading("Table 37. Summary of Local Officer Functionality Testing", HeadingLevel.HEADING_2),

            createHeading("1. Local Enforcer Role Access (1 Scenario)", HeadingLevel.HEADING_3),
            createNumberedItem("1. Verify that police officers can only access reports assigned to their station."),

            createHeading("2. Update Reports (3 Scenarios)", HeadingLevel.HEADING_3),
            createNumberedItem("1. Verify that officers can update report status (Pending, Valid, Invalid, Investigating, Resolved)."),
            createNumberedItem("2. Verify that officers can add notes/remarks to reports."),
            createNumberedItem("3. Verify that report updates are logged with timestamp."),

            createHeading("3. Request Re-assignment (2 Scenarios)", HeadingLevel.HEADING_3),
            createNumberedItem("1. Verify that officers can request report reassignment to another station."),
            createNumberedItem("2. Verify that reassignment request includes reason field."),

            createHeading("4. Report Status Management (2 Scenarios)", HeadingLevel.HEADING_3),
            createNumberedItem("1. Verify that valid status values are enforced during update."),
            createNumberedItem("2. Verify that status changes trigger notifications to report owner."),

            createHeading("5. User-to-Officer Messaging (2 Scenarios)", HeadingLevel.HEADING_3),
            createNumberedItem("1. Verify that officers can send messages to report owners."),
            createNumberedItem("2. Verify that officers can view message history for each report."),

            createHeading("6. User Flag/Moderation (4 Scenarios)", HeadingLevel.HEADING_3),
            createNumberedItem("1. Verify that officers can flag users for violations."),
            createNumberedItem("2. Verify that violation type selection is required."),
            createNumberedItem("3. Verify that severity level can be specified."),
            createNumberedItem("4. Verify that reason/description is required for flagging."),

            createHeading("7. User Restriction Management (3 Scenarios)", HeadingLevel.HEADING_3),
            createNumberedItem("1. Verify that officers can apply restrictions (warning, temporary ban, permanent ban)."),
            createNumberedItem("2. Verify that restriction duration can be specified."),
            createNumberedItem("3. Verify that restricted users receive notification."),

            createHeading("8. View Reports by Station (1 Scenario)", HeadingLevel.HEADING_3),
            createNumberedItem("1. Verify that reports are filtered by assigned police station."),

            createHeading("9. Report Media Viewing (1 Scenario)", HeadingLevel.HEADING_3),
            createNumberedItem("1. Verify that officers can view photos and videos attached to reports."),

            createHeading("10. Notification Sending to Users (2 Scenarios)", HeadingLevel.HEADING_3),
            createNumberedItem("1. Verify that officers can send notifications to specific users."),
            createNumberedItem("2. Verify that notifications are delivered to user's mobile app."),

            new Paragraph({
                children: [new TextRun({ text: "TOTAL: 21 Scenarios", bold: true, size: 24 })],
                spacing: { before: 200 },
            }),

            // Table 38
            new Paragraph({ text: "" }),
            createHeading("Table 38. Summary of Central Admin Functionality Testing", HeadingLevel.HEADING_2),

            createHeading("1. Enforcer Access Management (4 Scenarios)", HeadingLevel.HEADING_3),
            createNumberedItem("1. Verify that admin can add new police officers to the system."),
            createNumberedItem("2. Verify that admin can assign officers to police stations."),
            createNumberedItem("3. Verify that admin can update officer roles (police, admin, superadmin)."),
            createNumberedItem("4. Verify that admin can deactivate officer accounts."),

            createHeading("2. Crime Report Oversight (3 Scenarios)", HeadingLevel.HEADING_3),
            createNumberedItem("1. Verify that admin can view all reports across all stations."),
            createNumberedItem("2. Verify that admin can filter reports by status, station, or date range."),
            createNumberedItem("3. Verify that admin can override report status assignments."),

            createHeading("3. Analytics Access (1 Scenario)", HeadingLevel.HEADING_3),
            createNumberedItem("1. Verify that admin can access crime statistics and analytics dashboard."),

            createHeading("4. Summary Reports Generation (1 Scenario)", HeadingLevel.HEADING_3),
            createNumberedItem("1. Verify that admin can generate crime summary reports for specified periods."),

            createHeading("5. Role-Based System Access (2 Scenarios)", HeadingLevel.HEADING_3),
            createNumberedItem("1. Verify that different roles have appropriate access restrictions."),
            createNumberedItem("2. Verify that unauthorized access attempts are blocked and logged."),

            createHeading("6. User Verification Approval/Rejection (3 Scenarios)", HeadingLevel.HEADING_3),
            createNumberedItem("1. Verify that admin can view pending verification requests."),
            createNumberedItem("2. Verify that admin can approve user verification with document review."),
            createNumberedItem("3. Verify that admin can reject verification with reason provided."),

            createHeading("7. Police Station Management (2 Scenarios)", HeadingLevel.HEADING_3),
            createNumberedItem("1. Verify that admin can view all police station information."),
            createNumberedItem("2. Verify that admin can update station contact details."),

            createHeading("8. Barangay Data Management (1 Scenario)", HeadingLevel.HEADING_3),
            createNumberedItem("1. Verify that admin can view and manage barangay boundary data."),

            createHeading("9. Crime Mapping/Visualization (1 Scenario)", HeadingLevel.HEADING_3),
            createNumberedItem("1. Verify that admin can view crime map with all markers and layers."),

            createHeading("10. SARIMA Forecasting (1 Scenario)", HeadingLevel.HEADING_3),
            createNumberedItem("1. Verify that admin can view crime trend forecasts based on historical data."),

            createHeading("11. OTP Management/Monitoring (2 Scenarios)", HeadingLevel.HEADING_3),
            createNumberedItem("1. Verify that OTP codes are generated and sent correctly."),
            createNumberedItem("2. Verify that OTP expiration is enforced (10-minute validity)."),

            createHeading("12. Admin Role Assignment (2 Scenarios)", HeadingLevel.HEADING_3),
            createNumberedItem("1. Verify that superadmin can assign admin roles to users."),
            createNumberedItem("2. Verify that role changes are effective immediately."),

            createHeading("13. User Moderation Oversight (3 Scenarios)", HeadingLevel.HEADING_3),
            createNumberedItem("1. Verify that admin can view all flagged users."),
            createNumberedItem("2. Verify that admin can review flag history."),
            createNumberedItem("3. Verify that admin can unflag users with justification."),

            createHeading("14. System-wide Notification Broadcasting (1 Scenario)", HeadingLevel.HEADING_3),
            createNumberedItem("1. Verify that admin can send broadcast notifications to all users."),

            createHeading("15. CSV Data Import/Export (1 Scenario)", HeadingLevel.HEADING_3),
            createNumberedItem("1. Verify that admin can import historical crime data from CSV files."),

            new Paragraph({
                children: [new TextRun({ text: "TOTAL: 28 Scenarios", bold: true, size: 24 })],
                spacing: { before: 200 },
            }),

            // Table 47
            new Paragraph({ text: "" }),
            createHeading("Table 47. Data Visualization Testing", HeadingLevel.HEADING_2),

            createHeading("1. Crime Map Display (1 Scenario)", HeadingLevel.HEADING_3),
            createNumberedItem("1. Verify that crime map displays all report markers with correct latitude/longitude positions."),

            createHeading("2. Crime Type Icons (1 Scenario)", HeadingLevel.HEADING_3),
            createNumberedItem("1. Verify that each crime type (Robbery, Assault, Theft, Murder, etc.) displays its corresponding unique icon on the map."),

            createHeading("3. Heatmap Visualization (1 Scenario)", HeadingLevel.HEADING_3),
            createNumberedItem("1. Verify that heatmap layer accurately shows crime density with color gradients (red = high, green = low)."),

            createHeading("4. Statistics Charts Rendering (1 Scenario)", HeadingLevel.HEADING_3),
            createNumberedItem("1. Verify that bar charts and line graphs on Statistics page render correctly with accurate data labels."),

            createHeading("5. SARIMA Forecast Graph (1 Scenario)", HeadingLevel.HEADING_3),
            createNumberedItem("1. Verify that forecast line graph displays predicted crime trends with confidence intervals."),

            createHeading("6. Dashboard Cards Display (1 Scenario)", HeadingLevel.HEADING_3),
            createNumberedItem("1. Verify that dashboard stat cards show correct counts for Total Reports, Pending, Valid, and Investigating."),

            createHeading("7. Real-time Map Updates (1 Scenario)", HeadingLevel.HEADING_3),
            createNumberedItem("1. Verify that new report markers appear on the map without requiring manual page refresh."),

            new Paragraph({
                children: [new TextRun({ text: "TOTAL: 7 Scenarios", bold: true, size: 24 })],
                spacing: { before: 200 },
            }),

            // Security Testing
            new Paragraph({ text: "" }),
            createHeading("Table 48. Security Testing", HeadingLevel.HEADING_2),

            createHeading("1. Data Encryption (1 Scenario)", HeadingLevel.HEADING_3),
            createNumberedItem("1. Verify that sensitive information is encrypted and not visible to unauthorized users."),

            createHeading("2. OTP Verification (1 Scenario)", HeadingLevel.HEADING_3),
            createNumberedItem("1. Verify that system blocks access until valid OTP is entered."),

            createHeading("3. reCAPTCHA Protection (1 Scenario)", HeadingLevel.HEADING_3),
            createNumberedItem("1. Verify that system prevents form submission without completing captcha."),

            createHeading("4. Role-Based Access (1 Scenario)", HeadingLevel.HEADING_3),
            createNumberedItem("1. Verify that accessing admin routes as regular user redirects to unauthorized page."),

            createHeading("5. Session Timeout (1 Scenario)", HeadingLevel.HEADING_3),
            createNumberedItem("1. Verify that system automatically logs out user after extended idle period."),

            createHeading("6. Input Sanitization (1 Scenario)", HeadingLevel.HEADING_3),
            createNumberedItem("1. Verify that system sanitizes input and prevents XSS attacks."),

            new Paragraph({
                children: [new TextRun({ text: "TOTAL: 6 Scenarios", bold: true, size: 24 })],
                spacing: { before: 200 },
            }),

            // Integration Testing
            new Paragraph({ text: "" }),
            createHeading("Table 49. Integration Testing", HeadingLevel.HEADING_2),

            createHeading("1. UserSide to AdminSide Sync (1 Scenario)", HeadingLevel.HEADING_3),
            createNumberedItem("1. Verify that reports submitted from mobile app appear in AdminSide dashboard immediately."),

            createHeading("2. Status Update Propagation (1 Scenario)", HeadingLevel.HEADING_3),
            createNumberedItem("1. Verify that report status changes in AdminSide reflect on UserSide in real-time."),

            createHeading("3. Verification Workflow (1 Scenario)", HeadingLevel.HEADING_3),
            createNumberedItem("1. Verify that user's verified status updates across all pages after admin approval."),

            createHeading("4. Messaging Integration (1 Scenario)", HeadingLevel.HEADING_3),
            createNumberedItem("1. Verify that messages sent from UserSide chat appear in AdminSide messages page."),

            createHeading("5. Notification Delivery (1 Scenario)", HeadingLevel.HEADING_3),
            createNumberedItem("1. Verify that user receives notification on mobile app when flagged from AdminSide."),

            new Paragraph({
                children: [new TextRun({ text: "TOTAL: 5 Scenarios", bold: true, size: 24 })],
                spacing: { before: 200 },
            }),

            // Grand Total
            new Paragraph({ text: "" }),
            createHeading("Grand Total Summary", HeadingLevel.HEADING_2),
            new Paragraph({ text: "" }),
            new Paragraph({ children: [new TextRun({ text: "User Functionality Testing: 55 Scenarios", size: 22 })] }),
            new Paragraph({ children: [new TextRun({ text: "Local Officer Functionality Testing: 21 Scenarios", size: 22 })] }),
            new Paragraph({ children: [new TextRun({ text: "Central Admin Functionality Testing: 28 Scenarios", size: 22 })] }),
            new Paragraph({ children: [new TextRun({ text: "Data Visualization Testing: 7 Scenarios", size: 22 })] }),
            new Paragraph({ children: [new TextRun({ text: "Security Testing: 6 Scenarios", size: 22 })] }),
            new Paragraph({ children: [new TextRun({ text: "Integration Testing: 5 Scenarios", size: 22 })] }),
            new Paragraph({ text: "" }),
            new Paragraph({
                children: [new TextRun({ text: "GRAND TOTAL: 122 Scenarios", bold: true, size: 28 })],
                alignment: AlignmentType.CENTER,
            }),
        ],
    }],
});

// Save the document
Packer.toBuffer(doc).then((buffer) => {
    fs.writeFileSync('testing_scenarios_complete.docx', buffer);
    console.log('Document created successfully: testing_scenarios_complete.docx');
});
