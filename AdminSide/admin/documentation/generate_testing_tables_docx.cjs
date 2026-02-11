const { Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, WidthType, AlignmentType, HeadingLevel, BorderStyle, VerticalAlign } = require('docx');
const fs = require('fs');

// Shared border style
const borders = {
    top: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
    bottom: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
    left: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
    right: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
};

// Header cell (gray background, bold)
function headerCell(text, width) {
    return new TableCell({
        children: [new Paragraph({ children: [new TextRun({ text, bold: true, size: 20, font: "Arial" })], alignment: AlignmentType.CENTER })],
        width: { size: width, type: WidthType.PERCENTAGE },
        shading: { fill: "D9D9D9" },
        borders,
        verticalAlign: VerticalAlign.CENTER,
    });
}

// Data cell
function dataCell(text, width, center = false) {
    return new TableCell({
        children: [new Paragraph({ children: [new TextRun({ text, size: 20, font: "Arial" })], alignment: center ? AlignmentType.CENTER : AlignmentType.LEFT })],
        width: { size: width, type: WidthType.PERCENTAGE },
        borders,
        verticalAlign: VerticalAlign.CENTER,
    });
}

// Build a test table from an array of test case strings
function buildTestTable(testCases) {
    const headerRow = new TableRow({
        children: [
            headerCell("No.", 7),
            headerCell("Test Case Name", 61),
            headerCell("Pass", 10),
            headerCell("Fail", 10),
            headerCell("Not Done", 12),
        ],
        tableHeader: true,
    });

    const dataRows = testCases.map((tc, i) => new TableRow({
        children: [
            dataCell(String(i + 1), 7, true),
            dataCell(tc, 61),
            dataCell("", 10, true),
            dataCell("", 10, true),
            dataCell("", 12, true),
        ],
    }));

    return new Table({
        rows: [headerRow, ...dataRows],
        width: { size: 100, type: WidthType.PERCENTAGE },
    });
}

function heading(text, level) {
    return new Paragraph({ text, heading: level, spacing: { before: 240, after: 120 } });
}

function subheading(text) {
    return new Paragraph({ text, heading: HeadingLevel.HEADING_3, spacing: { before: 200, after: 80 } });
}

function totalLine(text) {
    return new Paragraph({ children: [new TextRun({ text, bold: true, size: 24, font: "Arial" })], spacing: { before: 160, after: 80 } });
}

function spacer() {
    return new Paragraph({ text: "", spacing: { before: 0, after: 0 } });
}

// ==================== DATA ====================

const data = [
    {
        tableTitle: "Table 42. Urgency Score Calculation Testing",
        total: 30,
        sections: [
            { title: "1. Crime Type Severity Scoring (8 Scenarios)", cases: [
                'Verify that a report with crime type "Murder" receives an urgency score of 100 (CRITICAL tier).',
                'Verify that a report with crime type "Rape" receives an urgency score of 100 (CRITICAL tier).',
                'Verify that a report with crime type "Robbery" receives an urgency score of 75 (HIGH tier).',
                'Verify that a report with crime type "Domestic Violence" receives an urgency score of 75 (HIGH tier).',
                'Verify that a report with crime type "Theft" receives an urgency score of 50 (MEDIUM tier).',
                'Verify that a report with crime type "Cybercrime" receives an urgency score of 50 (MEDIUM tier).',
                'Verify that a report with crime type "Other" receives a base urgency score of 30 (LOW tier).',
                'Verify that a report with an unrecognized crime type defaults to an urgency score of 30 (LOW tier).',
            ]},
            { title: "2. Multiple Crime Type Combination (4 Scenarios)", cases: [
                'Verify that a report with both "Murder" (CRITICAL=100) and "Theft" (MEDIUM=50) receives the highest score of 100.',
                'Verify that a report with both "Robbery" (HIGH=75) and "Fraud" (MEDIUM=50) receives the highest score of 75.',
                'Verify that a report with "Physical Injury" (HIGH=75) and "Missing Person" (HIGH=75) receives a score of 75.',
                'Verify that a report with multiple LOW-tier crime types receives a base score of 30.',
            ]},
            { title: "3. Bonus Modifiers (4 Scenarios)", cases: [
                'Verify that a report with evidence files (photos/videos) receives a +10 bonus to urgency score.',
                'Verify that a report submitted less than 1 hour ago receives a +5 recency bonus.',
                'Verify that a CRITICAL report (score 100) with evidence files does not exceed the maximum cap of 100.',
                'Verify that a LOW-tier report (score 30) with evidence (+10) and recency (+5) reaches a score of 45.',
            ]},
            { title: "4. Urgency Level Display (4 Scenarios)", cases: [
                'Verify that reports with urgency score >= 90 display a CRITICAL badge with red color (#991b1b) on the admin dashboard.',
                'Verify that reports with urgency score >= 70 and < 90 display a HIGH badge with orange color (#c2410c).',
                'Verify that reports with urgency score >= 50 and < 70 display a MEDIUM badge with amber color (#92400e).',
                'Verify that reports with urgency score < 50 display a LOW badge with gray color (#6b7280).',
            ]},
            { title: "5. Focus Crime Flag (3 Scenarios)", cases: [
                'Verify that DCPO Focus Crimes (Murder, Homicide, Physical Injury, Rape, Robbery, Theft, Carnapping, Motornapping) are flagged with is_focus_crime = true.',
                'Verify that non-focus crime types are flagged with is_focus_crime = false.',
                'Verify that the "Most Severe First" sort option prioritizes focus crimes (is_focus_crime DESC) before urgency score.',
            ]},
            { title: "6. Information Sufficiency (2 Scenarios)", cases: [
                'Verify that a report with description >= 20 characters and valid coordinates is flagged as has_sufficient_info = true.',
                'Verify that a report with description < 20 characters or missing coordinates is flagged as has_sufficient_info = false.',
            ]},
            { title: "7. Urgency Sorting (3 Scenarios)", cases: [
                'Verify that the "Most Urgent" sort option orders reports by urgency_score DESC, then created_at DESC.',
                'Verify that the "Most Severe" sort option orders reports by is_focus_crime DESC, urgency_score DESC, then created_at DESC.',
                'Verify that the "Needs Info" sort option orders reports by has_sufficient_info ASC, urgency_score DESC, then created_at DESC.',
            ]},
            { title: "8. Admin Batch Recalculation (2 Scenarios)", cases: [
                'Verify that admin can trigger batch recalculation of urgency scores via the recalculate-urgency route.',
                'Verify that batch recalculation updates urgency_score column in the database for all existing reports.',
            ]},
        ],
    },
    {
        tableTitle: "Table 43. Crime Type Severity Mapping Testing",
        total: 21,
        sections: [
            { title: "1. CRITICAL Tier Verification (4 Scenarios)", cases: [
                'Verify that "Murder" is classified as CRITICAL severity and assigned a score of 100.',
                'Verify that "Homicide" is classified as CRITICAL severity and assigned a score of 100.',
                'Verify that "Rape" is classified as CRITICAL severity and assigned a score of 100.',
                'Verify that "Sexual Assault" is classified as CRITICAL severity and assigned a score of 100.',
            ]},
            { title: "2. HIGH Tier Verification (5 Scenarios)", cases: [
                'Verify that "Robbery" is classified as HIGH severity and assigned a score of 75.',
                'Verify that "Physical Injury" is classified as HIGH severity and assigned a score of 75.',
                'Verify that "Domestic Violence" is classified as HIGH severity and assigned a score of 75.',
                'Verify that "Missing Person" is classified as HIGH severity and assigned a score of 75.',
                'Verify that "Harassment" is classified as HIGH severity and assigned a score of 75.',
            ]},
            { title: "3. MEDIUM Tier Verification (8 Scenarios)", cases: [
                'Verify that "Theft" is classified as MEDIUM severity and assigned a score of 50.',
                'Verify that "Burglary" is classified as MEDIUM severity and assigned a score of 50.',
                'Verify that "Break-in" is classified as MEDIUM severity and assigned a score of 50.',
                'Verify that "Carnapping" is classified as MEDIUM severity and assigned a score of 50.',
                'Verify that "Motornapping" is classified as MEDIUM severity and assigned a score of 50.',
                'Verify that "Threats" is classified as MEDIUM severity and assigned a score of 50.',
                'Verify that "Fraud" is classified as MEDIUM severity and assigned a score of 50.',
                'Verify that "Cybercrime" is classified as MEDIUM severity and assigned a score of 50.',
            ]},
            { title: "4. LOW Tier Verification (2 Scenarios)", cases: [
                'Verify that crime types not listed in CRITICAL, HIGH, or MEDIUM tiers default to LOW severity with a score of 30.',
                'Verify that an empty or null crime type defaults to LOW severity with a score of 30.',
            ]},
            { title: "5. Admin Display Consistency (2 Scenarios)", cases: [
                'Verify that urgency badge tooltip displays the raw numeric urgency score on hover.',
                'Verify that urgency badge icon color matches the correct severity tier color code.',
            ]},
        ],
    },
    {
        tableTitle: "Table 44. Map Location Accuracy Testing",
        total: 19,
        sections: [
            { title: "1. GPS Auto-Detection (3 Scenarios)", cases: [
                'Verify that the system captures the user\'s current GPS coordinates (latitude and longitude) via expo-location when permission is granted.',
                'Verify that the map pin automatically moves to the user\'s detected GPS location on report screen load.',
                'Verify that GPS permission denial displays an appropriate error message to the user.',
            ]},
            { title: "2. Manual Map Pin Placement (3 Scenarios)", cases: [
                'Verify that users can manually tap/drag the map pin to select a different incident location on the WebView Leaflet map.',
                'Verify that the selected pin coordinates (latitude and longitude) update in real-time as the pin is moved.',
                'Verify that the map pin placement sends a locationSelected message from the WebView to the React Native app.',
            ]},
            { title: "3. Address Autocomplete Search (3 Scenarios)", cases: [
                'Verify that typing an address in the search field calls the backend location search API (/api/location/search).',
                'Verify that selecting an autocomplete result moves the map pin to the corresponding coordinates.',
                'Verify that the barangay name auto-populates when a location is selected.',
            ]},
            { title: "4. Davao City Geofence Validation (3 Scenarios)", cases: [
                'Verify that coordinates inside the Davao City administrative boundary pass the geofence check (ray-casting algorithm).',
                'Verify that coordinates outside the Davao City boundary are rejected with an appropriate error message.',
                'Verify that the geofence uses the bounding box pre-check before running the full polygon ray-casting algorithm.',
            ]},
            { title: "5. Coordinates Sent to Backend (2 Scenarios)", cases: [
                'Verify that the submitted report data includes latitude, longitude, barangay, and barangay_id fields.',
                'Verify that a Location record is created in the database with the correct latitude and longitude values.',
            ]},
            { title: "6. Admin Map Pin Display (3 Scenarios)", cases: [
                'Verify that report markers are displayed at the correct latitude/longitude positions on the AdminSide Leaflet map.',
                'Verify that the map is bounded to the Davao City area (maxBounds) with center at [7.1907, 125.4553].',
                'Verify that each report marker popup shows the crime type, status, date, reporter, and description.',
            ]},
            { title: "7. Map Interaction (2 Scenarios)", cases: [
                'Verify that the admin map supports zoom levels between 11 (minimum) and 18 (maximum).',
                'Verify that marker clustering groups nearby markers when zoomed out and expands them when zoomed in.',
            ]},
        ],
    },
    {
        tableTitle: "Table 45. Automatic Report Station Assignment Testing",
        total: 16,
        sections: [
            { title: "1. Polygon-Based Auto-Assignment (4 Scenarios)", cases: [
                'Verify that a report submitted with coordinates inside a barangay polygon is automatically assigned to that barangay\'s police station.',
                'Verify that the ray-casting (point-in-polygon) algorithm correctly determines if coordinates fall within a barangay boundary.',
                'Verify that the system iterates through all barangay records with boundary_polygon data to find the matching barangay.',
                'Verify that when a matching barangay is found, the report\'s assigned_station_id is set to the barangay\'s station_id.',
            ]},
            { title: "2. Barangay-Based Assignment (2 Scenarios)", cases: [
                'Verify that when the report includes a barangay_id from the mobile app, the system uses that barangay\'s station_id for assignment.',
                'Verify that explicit barangay_id assignment takes priority over polygon-based auto-detection.',
            ]},
            { title: "3. Cybercrime Special Assignment (2 Scenarios)", cases: [
                'Verify that reports with crime type containing "Cybercrime" are automatically assigned to the Cybercrime Division station.',
                'Verify that cybercrime assignment takes the highest priority over barangay and polygon-based methods.',
            ]},
            { title: "4. Unassigned Report Handling (3 Scenarios)", cases: [
                'Verify that a report with coordinates outside all barangay polygons remains unassigned (assigned_station_id = NULL).',
                'Verify that unassigned reports log a warning with the report ID, latitude, and longitude.',
                'Verify that unassigned reports are visible only to Super Admin users and not to station-specific admins or police officers.',
            ]},
            { title: "5. Assignment Priority Order (3 Scenarios)", cases: [
                'Verify that the assignment follows priority: (1) Cybercrime check, (2) Explicit barangay_id, (3) Point-in-polygon auto-detection.',
                'Verify that the assignment occurs automatically during report creation (ReportController store method).',
                'Verify that the assigned_station_id foreign key references the police_stations table correctly.',
            ]},
            { title: "6. Polygon Data Integrity (2 Scenarios)", cases: [
                'Verify that barangay boundary_polygon data is stored in valid GeoJSON format in the database.',
                'Verify that polygons with fewer than 3 coordinate points return false for the containment check.',
            ]},
        ],
    },
    {
        tableTitle: "Table 46. Patrol Dispatch Restriction Testing",
        total: 24,
        sections: [
            { title: "1. Per-Report Dispatch Restriction (3 Scenarios)", cases: [
                'Verify that a report with an active dispatch (status: pending, accepted, en_route, or arrived) cannot be dispatched again.',
                'Verify that attempting to dispatch an already-dispatched report returns error message "This report already has an active dispatch."',
                'Verify that a report whose previous dispatch was completed or cancelled can be dispatched again.',
            ]},
            { title: "2. Dispatch Acceptance Race Condition (3 Scenarios)", cases: [
                'Verify that a pending dispatch can be accepted by a patrol officer.',
                'Verify that if a dispatch has already been accepted by one officer, another officer attempting to accept receives error "Dispatch already accepted by another officer."',
                'Verify that only dispatches with status \'pending\' or \'assigned\' can be accepted.',
            ]},
            { title: "3. Dispatch Status Lifecycle (6 Scenarios)", cases: [
                'Verify that a newly created dispatch starts with status \'pending\'.',
                'Verify that accepting a dispatch changes status to \'accepted\' and records the accepted_at timestamp.',
                'Verify that marking a dispatch as en route changes status to \'en_route\' and records the en_route_at timestamp.',
                'Verify that marking a dispatch as arrived changes status to \'arrived\' and records the arrived_at timestamp.',
                'Verify that verifying a report (valid/invalid) changes the dispatch status to \'completed\' and records the completed_at timestamp.',
                'Verify that a declined dispatch changes status to \'declined\'.',
            ]},
            { title: "4. Response Time Tracking (3 Scenarios)", cases: [
                'Verify that the system calculates response_time_seconds as the difference between dispatched_at and accepted_at.',
                'Verify that the system calculates travel_time_seconds as the difference between en_route_at and arrived_at.',
                'Verify that within_sla is set to true when response time is <= 180 seconds (3 minutes).',
            ]},
            { title: "5. Admin Dispatch Creation (3 Scenarios)", cases: [
                'Verify that admin can create a broadcast dispatch (status \'pending\') visible to all patrol officers.',
                'Verify that admin can create an assigned dispatch (status \'assigned\') targeting a specific patrol officer.',
                'Verify that dispatch creation sends Expo push notifications to patrol officers on the \'urgent_dispatch\' channel.',
            ]},
            { title: "6. Mobile App Dispatch UI (4 Scenarios)", cases: [
                'Verify that pending dispatches show an "Accept Dispatch" button to patrol officers.',
                'Verify that accepted dispatches show a "Mark En Route" button.',
                'Verify that en_route dispatches show a "Mark Arrived" button.',
                'Verify that arrived dispatches show "VALID" and "INVALID" verification buttons.',
            ]},
            { title: "7. Report Status Integration (2 Scenarios)", cases: [
                'Verify that accepting a dispatch automatically updates the linked report\'s status to \'investigating\'.',
                'Verify that verifying a dispatch as valid/invalid updates the linked report\'s status accordingly.',
            ]},
        ],
    },
    {
        tableTitle: "Table 50. Usability Requirements Testing",
        total: 39,
        sections: [
            { title: "1. Input Validation Feedback (6 Scenarios)", cases: [
                'Verify that name input validates 2-50 characters with letters, spaces, hyphens, and apostrophes only, showing inline error for invalid input.',
                'Verify that email input validates correct format with max 100 characters and must contain @ symbol, showing inline error.',
                'Verify that phone number input validates 7-20 characters with digits, +, -, spaces, and parentheses only.',
                'Verify that password input enforces minimum 8 characters with at least 1 letter, 1 number, and 1 symbol (@$!%*?&).',
                'Verify that OTP input validates exactly 6 digits with inline error for incorrect format.',
                'Verify that the ValidatedInput component shows real-time validation status while the user types.',
            ]},
            { title: "2. Loading State Indicators (4 Scenarios)", cases: [
                'Verify that the app displays an animated splash screen with letter-by-letter "AlertDavao" animation on startup.',
                'Verify that a LoadingOverlay modal with ActivityIndicator and customizable message appears during async operations.',
                'Verify that screen-level loading states display a spinner before content is fetched.',
                'Verify that the global LoadingContext (showLoading/hideLoading) provides consistent loading feedback across all screens.',
            ]},
            { title: "3. User Feedback Dialogs (4 Scenarios)", cases: [
                'Verify that the ConfirmationDialog component displays customizable title, message, and confirm/cancel buttons for destructive actions.',
                'Verify that a success dialog with animation appears after profile updates.',
                'Verify that the AdminSide custom alert system displays icon-based dialogs (success, error, info) replacing native alerts.',
                'Verify that the flag notification toast slides in with a countdown timer and auto-dismisses after 8 seconds.',
            ]},
            { title: "4. Session and Inactivity Management (3 Scenarios)", cases: [
                'Verify that regular users are automatically logged out after 5 minutes of inactivity with "Session Expired" alert.',
                'Verify that patrol officers are exempt from the inactivity timeout.',
                'Verify that on session expiry, all local storage (userData, userToken, pushToken, caches) is cleared and user is redirected to login.',
            ]},
            { title: "5. Push Notification Delivery (3 Scenarios)", cases: [
                'Verify that the app requests notification permission and registers Expo push token on launch.',
                'Verify that standard notifications use the \'default\' Android channel and urgent dispatches use the \'urgent_dispatch\' channel with MAX importance.',
                'Verify that foreground notifications are handled without interrupting the current screen.',
            ]},
            { title: "6. Responsive Design (4 Scenarios)", cases: [
                'Verify that the mobile app adapts layout for phone (< 768px), tablet (>= 768px), and large tablet (>= 1024px) screen widths.',
                'Verify that font sizes scale proportionally (e.g., xs=12 to 14, title=32 to 42) between phone and tablet breakpoints.',
                'Verify that card widths adjust from 90% on phone to 45% on tablet for grid layouts.',
                'Verify that the AdminSide sidebar becomes collapsible on screens <= 768px wide.',
            ]},
            { title: "7. Real-time Data Updates (4 Scenarios)", cases: [
                'Verify that new reports appear on the admin dashboard without manual page refresh via SSE or 10-second polling fallback.',
                'Verify that notification polling runs every 2 seconds to check for new notifications on the mobile app.',
                'Verify that the SSE service automatically reconnects after connection errors with a 5-second delay.',
                'Verify that patrol location updates are sent to the server every 2 seconds during active tracking.',
            ]},
            { title: "8. Navigation and Auth Guard (3 Scenarios)", cases: [
                'Verify that unauthenticated users are redirected to the login screen when accessing protected screens.',
                'Verify that the hardware back button is disabled on the login screen to prevent navigating back.',
                'Verify that the AdminSide navigation sidebar shows role-appropriate menu items (admin-only items hidden from police).',
            ]},
            { title: "9. Progressive Login Lockout (3 Scenarios)", cases: [
                'Verify that 10 failed login attempts trigger a 10-minute account lockout on AdminSide.',
                'Verify that 15 failed login attempts trigger a 15-minute lockout plus email security alert notification.',
                'Verify that failed login attempts are logged with timestamps in the admin_login_attempts table.',
            ]},
            { title: "10. Rate Limiting (2 Scenarios)", cases: [
                'Verify that the API enforces a general rate limit on all /api routes via express-rate-limit.',
                'Verify that report submissions have a dedicated rate limit to prevent abuse.',
            ]},
            { title: "11. Haptic and Animation Feedback (2 Scenarios)", cases: [
                'Verify that tab presses trigger haptic feedback on supported devices.',
                'Verify that screen transitions use smooth animations (slide_from_right, fade_from_bottom) with 200-300ms duration.',
            ]},
            { title: "12. Server Cold Start Handling (1 Scenario)", cases: [
                'Verify that the app pings the backend server on launch to warm up the Render free-tier instance and reduce cold-start delays.',
            ]},
        ],
    },
];

// ==================== BUILD DOCUMENT ====================

const children = [
    new Paragraph({
        text: "AlertDavao Additional Testing Scenarios",
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
    spacer(),
];

for (const table of data) {
    children.push(heading(table.tableTitle, HeadingLevel.HEADING_2));

    for (const section of table.sections) {
        children.push(subheading(section.title));
        children.push(buildTestTable(section.cases));
        children.push(spacer());
    }

    children.push(totalLine(`TOTAL: ${table.total} Scenarios`));
    children.push(spacer());
}

// Grand Total Summary Table
children.push(heading("Additional Testing Grand Total Summary", HeadingLevel.HEADING_2));
children.push(spacer());

const summaryHeader = new TableRow({
    children: [
        headerCell("Testing Category", 55),
        headerCell("Table No.", 20),
        headerCell("Total Scenarios", 25),
    ],
    tableHeader: true,
});

const summaryRows = [
    ["Urgency Score Calculation Testing", "Table 42", "30"],
    ["Crime Type Severity Mapping Testing", "Table 43", "21"],
    ["Map Location Accuracy Testing", "Table 44", "19"],
    ["Automatic Report Station Assignment Testing", "Table 45", "16"],
    ["Patrol Dispatch Restriction Testing", "Table 46", "24"],
    ["Usability Requirements Testing", "Table 50", "39"],
].map(([cat, tbl, cnt]) => new TableRow({
    children: [
        dataCell(cat, 55),
        dataCell(tbl, 20, true),
        dataCell(cnt, 25, true),
    ],
}));

const grandTotalRow = new TableRow({
    children: [
        new TableCell({
            children: [new Paragraph({ children: [new TextRun({ text: "GRAND TOTAL", bold: true, size: 22, font: "Arial" })], alignment: AlignmentType.RIGHT })],
            width: { size: 55, type: WidthType.PERCENTAGE },
            borders,
            shading: { fill: "D9D9D9" },
        }),
        new TableCell({
            children: [new Paragraph({ text: "", alignment: AlignmentType.CENTER })],
            width: { size: 20, type: WidthType.PERCENTAGE },
            borders,
            shading: { fill: "D9D9D9" },
        }),
        new TableCell({
            children: [new Paragraph({ children: [new TextRun({ text: "149", bold: true, size: 22, font: "Arial" })], alignment: AlignmentType.CENTER })],
            width: { size: 25, type: WidthType.PERCENTAGE },
            borders,
            shading: { fill: "D9D9D9" },
        }),
    ],
});

children.push(new Table({
    rows: [summaryHeader, ...summaryRows, grandTotalRow],
    width: { size: 100, type: WidthType.PERCENTAGE },
}));

const doc = new Document({
    sections: [{ properties: {}, children }],
});

Packer.toBuffer(doc).then((buffer) => {
    fs.writeFileSync('testing_scenarios_additional_tables.docx', buffer);
    console.log('Document created: testing_scenarios_additional_tables.docx');
});
