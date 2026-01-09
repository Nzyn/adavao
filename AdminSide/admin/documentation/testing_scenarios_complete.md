# AlertDavao Complete Testing Scenarios Document

**Project:** AlertDavao Crime Reporting and Monitoring System  
**Date:** December 2025

---

## Table 36. Summary of User Functionality Testing

### 1. User Registration (6 Scenarios)
1. Validate that all required fields (firstname, lastname, email, password, contact) must be filled before submission.
2. Validate that email format follows correct pattern (e.g., user@domain.com).
3. Validate that password must be at least 6 characters long.
4. Validate that phone number follows Philippine format (e.g., 9XXXXXXXXX).
5. Validate that captcha verification must be completed before registration.
6. Validate that duplicate email addresses are rejected with appropriate error message.

### 2. Identity Verification (6 Scenarios)
1. Verify that camera/gallery permission is required before uploading documents.
2. Verify that ID picture upload functions correctly.
3. Verify that selfie with ID upload functions correctly.
4. Verify that billing document upload functions correctly.
5. Verify that already verified users cannot submit another verification request.
6. Verify that users with pending verification cannot submit duplicate requests.

### 3. Authentication/Login (10 Scenarios)
1. Validate that empty email and password fields show error message.
2. Validate that incorrect credentials display "Invalid credentials" error.
3. Validate that connection timeout shows appropriate timeout message.
4. Validate that network errors display user-friendly error message.
5. Validate that captcha verification is required before login.
6. Validate that admin/police accounts are redirected to use AdminSide.
7. Validate that session expiry logs out user automatically.
8. Validate that OTP verification is required for Google Sign-In.
9. Validate that invalid OTP shows verification failed message.
10. Validate that inactivity logout displays appropriate notification.

### 4. Incident Reporting (5 Scenarios)
1. Verify that restricted users cannot submit reports.
2. Verify that location outside Davao City geofence is rejected.
3. Verify that media permission is required before uploading evidence.
4. Verify that files larger than 25MB are rejected with size error.
5. Verify that report submission failure shows appropriate error message.

### 5. Phone/OTP Verification (4 Scenarios)
1. Validate that invalid phone number format shows error message.
2. Validate that OTP must be exactly 6 digits.
3. Validate that incorrect OTP shows verification failed message.
4. Validate that expired OTP codes are rejected.

### 6. Location Services/GPS (2 Scenarios)
1. Verify that GPS permission denied shows appropriate message.
2. Verify that location outside Davao City boundary is detected and rejected.

### 7. Real-time Chat/Messaging (4 Scenarios)
1. Verify that message send failure shows error notification.
2. Verify that message loading failure displays retry option.
3. Verify that missing officer ID shows "No officer available" message.
4. Verify that connection errors are handled gracefully.

### 8. Notification Receipt (3 Scenarios)
1. Verify that notification fetch errors display error message.
2. Verify that mark-as-read failures are handled gracefully.
3. Verify that background fetch errors do not crash the application.

### 9. Report History Viewing (1 Scenario)
1. Verify that report history loads and displays correctly for the logged-in user.

### 10. Media Upload (Photos/Videos) (3 Scenarios)
1. Verify that gallery/camera permission is required before upload.
2. Verify that files exceeding size limit show appropriate error.
3. Verify that upload failure displays retry option.

### 11. Google Sign-In (6 Scenarios)
1. Verify that Google user info fetch failure shows error message.
2. Verify that Google login failure displays appropriate error.
3. Verify that Google registration failure shows error message.
4. Verify that network timeout during Google auth shows timeout message.
5. Verify that network error during Google auth displays error.
6. Verify that phone number validation works for Google registration.

### 12. User Profile Update (5 Scenarios)
1. Verify that 404 error shows "User not found" message.
2. Verify that 422 error shows "Invalid data" message.
3. Verify that 500 error shows "Server error" message.
4. Verify that network error shows connection error message.
5. Verify that successful update shows confirmation message.

**TOTAL: 55 Scenarios**

---

## Table 37. Summary of Local Officer Functionality Testing

### 1. Local Enforcer Role Access (1 Scenario)
1. Verify that police officers can only access reports assigned to their station.

### 2. Update Reports (3 Scenarios)
1. Verify that officers can update report status (Pending, Valid, Invalid, Investigating, Resolved).
2. Verify that officers can add notes/remarks to reports.
3. Verify that report updates are logged with timestamp.

### 3. Request Re-assignment (2 Scenarios)
1. Verify that officers can request report reassignment to another station.
2. Verify that reassignment request includes reason field.

### 4. Report Status Management (2 Scenarios)
1. Verify that valid status values are enforced during update.
2. Verify that status changes trigger notifications to report owner.

### 5. User-to-Officer Messaging (2 Scenarios)
1. Verify that officers can send messages to report owners.
2. Verify that officers can view message history for each report.

### 6. User Flag/Moderation (4 Scenarios)
1. Verify that officers can flag users for violations.
2. Verify that violation type selection is required.
3. Verify that severity level can be specified.
4. Verify that reason/description is required for flagging.

### 7. User Restriction Management (3 Scenarios)
1. Verify that officers can apply restrictions (warning, temporary ban, permanent ban).
2. Verify that restriction duration can be specified.
3. Verify that restricted users receive notification.

### 8. View Reports by Station (1 Scenario)
1. Verify that reports are filtered by assigned police station.

### 9. Report Media Viewing (1 Scenario)
1. Verify that officers can view photos and videos attached to reports.

### 10. Notification Sending to Users (2 Scenarios)
1. Verify that officers can send notifications to specific users.
2. Verify that notifications are delivered to user's mobile app.

**TOTAL: 21 Scenarios**

---

## Table 38. Summary of Central Admin Functionality Testing

### 1. Enforcer Access Management (4 Scenarios)
1. Verify that admin can add new police officers to the system.
2. Verify that admin can assign officers to police stations.
3. Verify that admin can update officer roles (police, admin, superadmin).
4. Verify that admin can deactivate officer accounts.

### 2. Crime Report Oversight (3 Scenarios)
1. Verify that admin can view all reports across all stations.
2. Verify that admin can filter reports by status, station, or date range.
3. Verify that admin can override report status assignments.

### 3. Analytics Access (1 Scenario)
1. Verify that admin can access crime statistics and analytics dashboard.

### 4. Summary Reports Generation (1 Scenario)
1. Verify that admin can generate crime summary reports for specified periods.

### 5. Role-Based System Access (2 Scenarios)
1. Verify that different roles have appropriate access restrictions.
2. Verify that unauthorized access attempts are blocked and logged.

### 6. User Verification Approval/Rejection (3 Scenarios)
1. Verify that admin can view pending verification requests.
2. Verify that admin can approve user verification with document review.
3. Verify that admin can reject verification with reason provided.

### 7. Police Station Management (2 Scenarios)
1. Verify that admin can view all police station information.
2. Verify that admin can update station contact details.

### 8. Barangay Data Management (1 Scenario)
1. Verify that admin can view and manage barangay boundary data.

### 9. Crime Mapping/Visualization (1 Scenario)
1. Verify that admin can view crime map with all markers and layers.

### 10. SARIMA Forecasting (1 Scenario)
1. Verify that admin can view crime trend forecasts based on historical data.

### 11. OTP Management/Monitoring (2 Scenarios)
1. Verify that OTP codes are generated and sent correctly.
2. Verify that OTP expiration is enforced (10-minute validity).

### 12. Admin Role Assignment (2 Scenarios)
1. Verify that superadmin can assign admin roles to users.
2. Verify that role changes are effective immediately.

### 13. User Moderation Oversight (3 Scenarios)
1. Verify that admin can view all flagged users.
2. Verify that admin can review flag history.
3. Verify that admin can unflag users with justification.

### 14. System-wide Notification Broadcasting (1 Scenario)
1. Verify that admin can send broadcast notifications to all users.

### 15. CSV Data Import/Export (1 Scenario)
1. Verify that admin can import historical crime data from CSV files.

**TOTAL: 28 Scenarios**

---

## Table 47. Data Visualization Testing

### 1. Crime Map Display (1 Scenario)
1. Verify that crime map displays all report markers with correct latitude/longitude positions.

### 2. Crime Type Icons (1 Scenario)
1. Verify that each crime type (Robbery, Assault, Theft, Murder, etc.) displays its corresponding unique icon on the map.

### 3. Heatmap Visualization (1 Scenario)
1. Verify that heatmap layer accurately shows crime density with color gradients (red = high, green = low).

### 4. Statistics Charts Rendering (1 Scenario)
1. Verify that bar charts and line graphs on Statistics page render correctly with accurate data labels.

### 5. SARIMA Forecast Graph (1 Scenario)
1. Verify that forecast line graph displays predicted crime trends with confidence intervals.

### 6. Dashboard Cards Display (1 Scenario)
1. Verify that dashboard stat cards show correct counts for Total Reports, Pending, Valid, and Investigating.

### 7. Real-time Map Updates (1 Scenario)
1. Verify that new report markers appear on the map without requiring manual page refresh.

**TOTAL: 7 Scenarios**

---

## Table 39. Browser Compatibility Testing

### 1. Google Chrome Compatibility (1 Scenario)
1. Verify that system functions correctly on Google Chrome version 142.0.7390.55.

### 2. Mozilla Firefox Compatibility (1 Scenario)
1. Verify that system functions correctly on Mozilla Firefox version 143.0.4.

### 3. Microsoft Edge Compatibility (1 Scenario)
1. Verify that system functions correctly on Microsoft Edge version 141.0.3537.57.

### 4. Safari Compatibility (1 Scenario)
1. Verify that system functions correctly on Safari iOS 18.7.1.

**TOTAL: 4 Scenarios**

---

## Table 40. Screen Resolution Compatibility Testing (Web Application)

### 1. Desktop Resolution (1 Scenario)
1. Verify that layout displays correctly on 1920x1080 desktop resolution.

### 2. Laptop Resolution (1 Scenario)
1. Verify that layout displays correctly on 1366x768 laptop resolution.

### 3. Tablet Landscape Resolution (1 Scenario)
1. Verify that responsive layout works on 1024x768 tablet landscape.

### 4. Tablet Portrait Resolution (1 Scenario)
1. Verify that responsive layout works on 768x1024 tablet portrait.

### 5. Mobile Resolution (1 Scenario)
1. Verify that responsive layout works on 360x640 mobile resolution.

**TOTAL: 5 Scenarios**

---

## Table 41. Screen Resolution Compatibility Testing (Mobile Application)

### 1. Tablet Display (1 Scenario)
1. Verify that mobile app displays responsively on 600x1040 tablet resolution.

### 2. Modern iPhone Display (1 Scenario)
1. Verify that mobile app displays responsively on 390x844 iPhone resolution.

### 3. Standard Android Display (1 Scenario)
1. Verify that mobile app displays responsively on 360x720 Android resolution.

### 4. Small Android Display (1 Scenario)
1. Verify that mobile app displays responsively on 360x640 small Android resolution.

**TOTAL: 4 Scenarios**

---

## Table 48. Security Testing

### 1. Data Encryption (1 Scenario)
1. Verify that sensitive information is encrypted and not visible to unauthorized users.

### 2. OTP Verification (1 Scenario)
1. Verify that system blocks access until valid OTP is entered.

### 3. reCAPTCHA Protection (1 Scenario)
1. Verify that system prevents form submission without completing captcha.

### 4. Role-Based Access (1 Scenario)
1. Verify that accessing admin routes as regular user redirects to unauthorized page.

### 5. Session Timeout (1 Scenario)
1. Verify that system automatically logs out user after extended idle period.

### 6. Input Sanitization (1 Scenario)
1. Verify that system sanitizes input and prevents XSS attacks.

**TOTAL: 6 Scenarios**

---

## Table 49. Integration Testing

### 1. UserSide to AdminSide Sync (1 Scenario)
1. Verify that reports submitted from mobile app appear in AdminSide dashboard immediately.

### 2. Status Update Propagation (1 Scenario)
1. Verify that report status changes in AdminSide reflect on UserSide in real-time.

### 3. Verification Workflow (1 Scenario)
1. Verify that user's verified status updates across all pages after admin approval.

### 4. Messaging Integration (1 Scenario)
1. Verify that messages sent from UserSide chat appear in AdminSide messages page.

### 5. Notification Delivery (1 Scenario)
1. Verify that user receives notification on mobile app when flagged from AdminSide.

**TOTAL: 5 Scenarios**

---

## Grand Total Summary

| Testing Category | Total Scenarios |
|------------------|-----------------|
| User Functionality Testing | 55 |
| Local Officer Functionality Testing | 21 |
| Central Admin Functionality Testing | 28 |
| Data Visualization Testing | 7 |
| Browser Compatibility Testing | 4 |
| Screen Resolution Testing (Web) | 5 |
| Screen Resolution Testing (Mobile) | 4 |
| Security Testing | 6 |
| Integration Testing | 5 |
| **GRAND TOTAL** | **135 Scenarios** |

---

*End of Testing Scenarios Document*
