# AlertDavao Additional Testing Scenarios Document

**Project:** AlertDavao Crime Reporting and Monitoring System  
**Date:** December 2025

---

## Table 42. Urgency Score Calculation Testing

### 1. Crime Type Severity Scoring (8 Scenarios)
1. Verify that a report with crime type "Murder" receives an urgency score of 100 (CRITICAL tier).
2. Verify that a report with crime type "Rape" receives an urgency score of 100 (CRITICAL tier).
3. Verify that a report with crime type "Robbery" receives an urgency score of 75 (HIGH tier).
4. Verify that a report with crime type "Domestic Violence" receives an urgency score of 75 (HIGH tier).
5. Verify that a report with crime type "Theft" receives an urgency score of 50 (MEDIUM tier).
6. Verify that a report with crime type "Cybercrime" receives an urgency score of 50 (MEDIUM tier).
7. Verify that a report with crime type "Other" receives a base urgency score of 30 (LOW tier).
8. Verify that a report with an unrecognized crime type defaults to an urgency score of 30 (LOW tier).

### 2. Multiple Crime Type Combination (4 Scenarios)
1. Verify that a report with both "Murder" (CRITICAL=100) and "Theft" (MEDIUM=50) receives the highest score of 100.
2. Verify that a report with both "Robbery" (HIGH=75) and "Fraud" (MEDIUM=50) receives the highest score of 75.
3. Verify that a report with "Physical Injury" (HIGH=75) and "Missing Person" (HIGH=75) receives a score of 75.
4. Verify that a report with multiple LOW-tier crime types receives a base score of 30.

### 3. Bonus Modifiers (4 Scenarios)
1. Verify that a report with evidence files (photos/videos) receives a +10 bonus to urgency score.
2. Verify that a report submitted less than 1 hour ago receives a +5 recency bonus.
3. Verify that a CRITICAL report (score 100) with evidence files does not exceed the maximum cap of 100.
4. Verify that a LOW-tier report (score 30) with evidence (+10) and recency (+5) reaches a score of 45.

### 4. Urgency Level Display (4 Scenarios)
1. Verify that reports with urgency score ≥ 90 display a CRITICAL badge with red color (#991b1b) on the admin dashboard.
2. Verify that reports with urgency score ≥ 70 and < 90 display a HIGH badge with orange color (#c2410c).
3. Verify that reports with urgency score ≥ 50 and < 70 display a MEDIUM badge with amber color (#92400e).
4. Verify that reports with urgency score < 50 display a LOW badge with gray color (#6b7280).

### 5. Focus Crime Flag (3 Scenarios)
1. Verify that DCPO Focus Crimes (Murder, Homicide, Physical Injury, Rape, Robbery, Theft, Carnapping, Motornapping) are flagged with is_focus_crime = true.
2. Verify that non-focus crime types are flagged with is_focus_crime = false.
3. Verify that the "Most Severe First" sort option prioritizes focus crimes (is_focus_crime DESC) before urgency score.

### 6. Information Sufficiency (2 Scenarios)
1. Verify that a report with description ≥ 20 characters and valid coordinates is flagged as has_sufficient_info = true.
2. Verify that a report with description < 20 characters or missing coordinates is flagged as has_sufficient_info = false.

### 7. Urgency Sorting (3 Scenarios)
1. Verify that the "Most Urgent" sort option orders reports by urgency_score DESC, then created_at DESC.
2. Verify that the "Most Severe" sort option orders reports by is_focus_crime DESC, urgency_score DESC, then created_at DESC.
3. Verify that the "Needs Info" sort option orders reports by has_sufficient_info ASC, urgency_score DESC, then created_at DESC.

### 8. Admin Batch Recalculation (2 Scenarios)
1. Verify that admin can trigger batch recalculation of urgency scores via the recalculate-urgency route.
2. Verify that batch recalculation updates urgency_score column in the database for all existing reports.

**TOTAL: 30 Scenarios**

---

## Table 43. Crime Type Severity Mapping Testing

### 1. CRITICAL Tier Verification (4 Scenarios)
1. Verify that "Murder" is classified as CRITICAL severity and assigned a score of 100.
2. Verify that "Homicide" is classified as CRITICAL severity and assigned a score of 100.
3. Verify that "Rape" is classified as CRITICAL severity and assigned a score of 100.
4. Verify that "Sexual Assault" is classified as CRITICAL severity and assigned a score of 100.

### 2. HIGH Tier Verification (5 Scenarios)
1. Verify that "Robbery" is classified as HIGH severity and assigned a score of 75.
2. Verify that "Physical Injury" is classified as HIGH severity and assigned a score of 75.
3. Verify that "Domestic Violence" is classified as HIGH severity and assigned a score of 75.
4. Verify that "Missing Person" is classified as HIGH severity and assigned a score of 75.
5. Verify that "Harassment" is classified as HIGH severity and assigned a score of 75.

### 3. MEDIUM Tier Verification (8 Scenarios)
1. Verify that "Theft" is classified as MEDIUM severity and assigned a score of 50.
2. Verify that "Burglary" is classified as MEDIUM severity and assigned a score of 50.
3. Verify that "Break-in" is classified as MEDIUM severity and assigned a score of 50.
4. Verify that "Carnapping" is classified as MEDIUM severity and assigned a score of 50.
5. Verify that "Motornapping" is classified as MEDIUM severity and assigned a score of 50.
6. Verify that "Threats" is classified as MEDIUM severity and assigned a score of 50.
7. Verify that "Fraud" is classified as MEDIUM severity and assigned a score of 50.
8. Verify that "Cybercrime" is classified as MEDIUM severity and assigned a score of 50.

### 4. LOW Tier Verification (2 Scenarios)
1. Verify that crime types not listed in CRITICAL, HIGH, or MEDIUM tiers default to LOW severity with a score of 30.
2. Verify that an empty or null crime type defaults to LOW severity with a score of 30.

### 5. Admin Display Consistency (2 Scenarios)
1. Verify that urgency badge tooltip displays the raw numeric urgency score on hover.
2. Verify that urgency badge icon color matches the correct severity tier color code.

**TOTAL: 21 Scenarios**

---

## Table 44. Map Location Accuracy Testing

### 1. GPS Auto-Detection (3 Scenarios)
1. Verify that the system captures the user's current GPS coordinates (latitude and longitude) via expo-location when permission is granted.
2. Verify that the map pin automatically moves to the user's detected GPS location on report screen load.
3. Verify that GPS permission denial displays an appropriate error message to the user.

### 2. Manual Map Pin Placement (3 Scenarios)
1. Verify that users can manually tap/drag the map pin to select a different incident location on the WebView Leaflet map.
2. Verify that the selected pin coordinates (latitude and longitude) update in real-time as the pin is moved.
3. Verify that the map pin placement sends a locationSelected message from the WebView to the React Native app.

### 3. Address Autocomplete Search (3 Scenarios)
1. Verify that typing an address in the search field calls the backend location search API (/api/location/search).
2. Verify that selecting an autocomplete result moves the map pin to the corresponding coordinates.
3. Verify that the barangay name auto-populates when a location is selected.

### 4. Davao City Geofence Validation (3 Scenarios)
1. Verify that coordinates inside the Davao City administrative boundary pass the geofence check (ray-casting algorithm).
2. Verify that coordinates outside the Davao City boundary are rejected with an appropriate error message.
3. Verify that the geofence uses the bounding box pre-check before running the full polygon ray-casting algorithm.

### 5. Coordinates Sent to Backend (2 Scenarios)
1. Verify that the submitted report data includes latitude, longitude, barangay, and barangay_id fields.
2. Verify that a Location record is created in the database with the correct latitude and longitude values.

### 6. Admin Map Pin Display (3 Scenarios)
1. Verify that report markers are displayed at the correct latitude/longitude positions on the AdminSide Leaflet map.
2. Verify that the map is bounded to the Davao City area (maxBounds) with center at [7.1907, 125.4553].
3. Verify that each report marker popup shows the crime type, status, date, reporter, and description.

### 7. Map Interaction (2 Scenarios)
1. Verify that the admin map supports zoom levels between 11 (minimum) and 18 (maximum).
2. Verify that marker clustering groups nearby markers when zoomed out and expands them when zoomed in.

**TOTAL: 19 Scenarios**

---

## Table 45. Automatic Report Station Assignment Testing

### 1. Polygon-Based Auto-Assignment (4 Scenarios)
1. Verify that a report submitted with coordinates inside a barangay polygon is automatically assigned to that barangay's police station.
2. Verify that the ray-casting (point-in-polygon) algorithm correctly determines if coordinates fall within a barangay boundary.
3. Verify that the system iterates through all barangay records with boundary_polygon data to find the matching barangay.
4. Verify that when a matching barangay is found, the report's assigned_station_id is set to the barangay's station_id.

### 2. Barangay-Based Assignment (2 Scenarios)
1. Verify that when the report includes a barangay_id from the mobile app, the system uses that barangay's station_id for assignment.
2. Verify that explicit barangay_id assignment takes priority over polygon-based auto-detection.

### 3. Cybercrime Special Assignment (2 Scenarios)
1. Verify that reports with crime type containing "Cybercrime" are automatically assigned to the Cybercrime Division station.
2. Verify that cybercrime assignment takes the highest priority over barangay and polygon-based methods.

### 4. Unassigned Report Handling (3 Scenarios)
1. Verify that a report with coordinates outside all barangay polygons remains unassigned (assigned_station_id = NULL).
2. Verify that unassigned reports log a warning with the report ID, latitude, and longitude.
3. Verify that unassigned reports are visible only to Super Admin users and not to station-specific admins or police officers.

### 5. Assignment Priority Order (3 Scenarios)
1. Verify that the assignment follows priority: (1) Cybercrime check → (2) Explicit barangay_id → (3) Point-in-polygon auto-detection.
2. Verify that the assignment occurs automatically during report creation (ReportController::store).
3. Verify that the assigned_station_id foreign key references the police_stations table correctly.

### 6. Polygon Data Integrity (2 Scenarios)
1. Verify that barangay boundary_polygon data is stored in valid GeoJSON format in the database.
2. Verify that polygons with fewer than 3 coordinate points return false for the containment check.

**TOTAL: 16 Scenarios**

---

## Table 46. Patrol Dispatch Restriction Testing

### 1. Per-Report Dispatch Restriction (3 Scenarios)
1. Verify that a report with an active dispatch (status: pending, accepted, en_route, or arrived) cannot be dispatched again.
2. Verify that attempting to dispatch an already-dispatched report returns error message "This report already has an active dispatch."
3. Verify that a report whose previous dispatch was completed or cancelled can be dispatched again.

### 2. Dispatch Acceptance Race Condition (3 Scenarios)
1. Verify that a pending dispatch can be accepted by a patrol officer.
2. Verify that if a dispatch has already been accepted by one officer, another officer attempting to accept receives error "Dispatch already accepted by another officer."
3. Verify that only dispatches with status 'pending' or 'assigned' can be accepted.

### 3. Dispatch Status Lifecycle (6 Scenarios)
1. Verify that a newly created dispatch starts with status 'pending'.
2. Verify that accepting a dispatch changes status to 'accepted' and records the accepted_at timestamp.
3. Verify that marking a dispatch as en route changes status to 'en_route' and records the en_route_at timestamp.
4. Verify that marking a dispatch as arrived changes status to 'arrived' and records the arrived_at timestamp.
5. Verify that verifying a report (valid/invalid) changes the dispatch status to 'completed' and records the completed_at timestamp.
6. Verify that a declined dispatch changes status to 'declined'.

### 4. Response Time Tracking (3 Scenarios)
1. Verify that the system calculates response_time_seconds as the difference between dispatched_at and accepted_at.
2. Verify that the system calculates travel_time_seconds as the difference between en_route_at and arrived_at.
3. Verify that within_sla is set to true when response time is ≤ 180 seconds (3 minutes).

### 5. Admin Dispatch Creation (3 Scenarios)
1. Verify that admin can create a broadcast dispatch (status 'pending') visible to all patrol officers.
2. Verify that admin can create an assigned dispatch (status 'assigned') targeting a specific patrol officer.
3. Verify that dispatch creation sends Expo push notifications to patrol officers on the 'urgent_dispatch' channel.

### 6. Mobile App Dispatch UI (4 Scenarios)
1. Verify that pending dispatches show an "Accept Dispatch" button to patrol officers.
2. Verify that accepted dispatches show a "Mark En Route" button.
3. Verify that en_route dispatches show a "Mark Arrived" button.
4. Verify that arrived dispatches show "VALID" and "INVALID" verification buttons.

### 7. Report Status Integration (2 Scenarios)
1. Verify that accepting a dispatch automatically updates the linked report's status to 'investigating'.
2. Verify that verifying a dispatch as valid/invalid updates the linked report's status accordingly.

**TOTAL: 24 Scenarios**

---

## Table 50. Usability Requirements Testing

### 1. Input Validation Feedback (6 Scenarios)
1. Verify that name input validates 2–50 characters with letters, spaces, hyphens, and apostrophes only, showing inline error for invalid input.
2. Verify that email input validates correct format with max 100 characters and must contain @ symbol, showing inline error.
3. Verify that phone number input validates 7–20 characters with digits, +, -, spaces, and parentheses only.
4. Verify that password input enforces minimum 8 characters with at least 1 letter, 1 number, and 1 symbol (@$!%*?&).
5. Verify that OTP input validates exactly 6 digits with inline error for incorrect format.
6. Verify that the ValidatedInput component shows real-time ✅/❌ validation status while the user types.

### 2. Loading State Indicators (4 Scenarios)
1. Verify that the app displays an animated splash screen with letter-by-letter "AlertDavao" animation on startup.
2. Verify that a LoadingOverlay modal with ActivityIndicator and customizable message appears during async operations.
3. Verify that screen-level loading states display a spinner before content is fetched.
4. Verify that the global LoadingContext (showLoading/hideLoading) provides consistent loading feedback across all screens.

### 3. User Feedback Dialogs (4 Scenarios)
1. Verify that the ConfirmationDialog component displays customizable title, message, and confirm/cancel buttons for destructive actions.
2. Verify that a success dialog with animation appears after profile updates.
3. Verify that the AdminSide custom alert system displays icon-based dialogs (✓ success, ✕ error, ℹ info) replacing native alerts.
4. Verify that the flag notification toast slides in with a countdown timer and auto-dismisses after 8 seconds.

### 4. Session and Inactivity Management (3 Scenarios)
1. Verify that regular users are automatically logged out after 5 minutes of inactivity with "Session Expired" alert.
2. Verify that patrol officers are exempt from the inactivity timeout.
3. Verify that on session expiry, all local storage (userData, userToken, pushToken, caches) is cleared and user is redirected to login.

### 5. Push Notification Delivery (3 Scenarios)
1. Verify that the app requests notification permission and registers Expo push token on launch.
2. Verify that standard notifications use the 'default' Android channel and urgent dispatches use the 'urgent_dispatch' channel with MAX importance.
3. Verify that foreground notifications are handled without interrupting the current screen.

### 6. Responsive Design (4 Scenarios)
1. Verify that the mobile app adapts layout for phone (< 768px), tablet (≥ 768px), and large tablet (≥ 1024px) screen widths.
2. Verify that font sizes scale proportionally (e.g., xs=12→14, title=32→42) between phone and tablet breakpoints.
3. Verify that card widths adjust from 90% on phone to 45% on tablet for grid layouts.
4. Verify that the AdminSide sidebar becomes collapsible on screens ≤ 768px wide.

### 7. Real-time Data Updates (4 Scenarios)
1. Verify that new reports appear on the admin dashboard without manual page refresh via SSE (Server-Sent Events) or 10-second polling fallback.
2. Verify that notification polling runs every 2 seconds to check for new notifications on the mobile app.
3. Verify that the SSE service automatically reconnects after connection errors with a 5-second delay.
4. Verify that patrol location updates are sent to the server every 2 seconds during active tracking.

### 8. Navigation and Auth Guard (3 Scenarios)
1. Verify that unauthenticated users are redirected to the login screen when accessing protected screens.
2. Verify that the hardware back button is disabled on the login screen to prevent navigating back.
3. Verify that the AdminSide navigation sidebar shows role-appropriate menu items (admin-only items hidden from police).

### 9. Progressive Login Lockout (3 Scenarios)
1. Verify that 10 failed login attempts trigger a 10-minute account lockout on AdminSide.
2. Verify that 15 failed login attempts trigger a 15-minute lockout plus email security alert notification.
3. Verify that failed login attempts are logged with timestamps in the admin_login_attempts table.

### 10. Rate Limiting (2 Scenarios)
1. Verify that the API enforces a general rate limit on all /api routes via express-rate-limit.
2. Verify that report submissions have a dedicated rate limit to prevent abuse.

### 11. Haptic and Animation Feedback (2 Scenarios)
1. Verify that tab presses trigger haptic feedback on supported devices.
2. Verify that screen transitions use smooth animations (slide_from_right, fade_from_bottom) with 200–300ms duration.

### 12. Server Cold Start Handling (1 Scenario)
1. Verify that the app pings the backend server on launch to warm up the Render free-tier instance and reduce cold-start delays.

**TOTAL: 39 Scenarios**

---

## Additional Testing Grand Total Summary

| Testing Category | Table No. | Total Scenarios |
|------------------|-----------|-----------------|
| Urgency Score Calculation Testing | Table 42 | 30 |
| Crime Type Severity Mapping Testing | Table 43 | 21 |
| Map Location Accuracy Testing | Table 44 | 19 |
| Automatic Report Station Assignment Testing | Table 45 | 16 |
| Patrol Dispatch Restriction Testing | Table 46 | 24 |
| Usability Requirements Testing | Table 50 | 39 |
| **GRAND TOTAL** | | **149 Scenarios** |

---

*End of Additional Testing Scenarios Document*
