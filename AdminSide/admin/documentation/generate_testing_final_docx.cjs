const { Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, WidthType, AlignmentType, HeadingLevel, BorderStyle, VerticalAlign } = require('docx');
const fs = require('fs');

const borders = {
    top: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
    bottom: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
    left: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
    right: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
};

function cell(text, width, opts = {}) {
    const { bold = false, center = false, shading, fontSize = 20 } = opts;
    return new TableCell({
        children: [new Paragraph({
            children: [new TextRun({ text: String(text), bold, size: fontSize, font: "Arial" })],
            alignment: center ? AlignmentType.CENTER : AlignmentType.LEFT,
        })],
        width: { size: width, type: WidthType.PERCENTAGE },
        borders,
        verticalAlign: VerticalAlign.CENTER,
        ...(shading ? { shading: { fill: shading } } : {}),
    });
}

function headerCell(text, width) {
    return cell(text, width, { bold: true, center: true, shading: "D9D9D9" });
}

function spacer() {
    return new Paragraph({ text: "", spacing: { before: 0, after: 0 } });
}

function heading(text, level) {
    return new Paragraph({ text, heading: level, spacing: { before: 300, after: 120 } });
}

function para(text, bold = false, size = 22) {
    return new Paragraph({
        children: [new TextRun({ text, bold, size, font: "Arial" })],
        spacing: { before: 80, after: 80 },
    });
}

function italicPara(text, size = 20) {
    return new Paragraph({
        children: [new TextRun({ text, italics: true, size, font: "Arial" })],
        spacing: { before: 60, after: 100 },
    });
}

// ===== SUMMARY TABLE (like Table 36 in the image) =====
function buildSummaryTable(title, rows, grandTotal) {
    const headerRow = new TableRow({
        children: [
            headerCell("No.", 7),
            headerCell("Test Case Name", 45),
            headerCell("Pass", 10),
            headerCell("Fail", 10),
            headerCell("Not Done", 14),
            headerCell("Total", 14),
        ],
        tableHeader: true,
    });

    const dataRows = rows.map((r, i) => new TableRow({
        children: [
            cell(String(i + 1), 7, { center: true }),
            cell(r.name, 45),
            cell(String(r.pass), 10, { center: true }),
            cell(String(r.fail), 10, { center: true }),
            cell(String(r.notDone), 14, { center: true }),
            cell(String(r.total), 14, { center: true }),
        ],
    }));

    const totalRow = new TableRow({
        children: [
            cell("TOTAL", 7, { bold: true, center: true }),
            cell("", 45),
            cell(String(rows.reduce((s, r) => s + r.pass, 0)), 10, { bold: true, center: true }),
            cell(String(rows.reduce((s, r) => s + r.fail, 0)), 10, { bold: true, center: true }),
            cell(String(rows.reduce((s, r) => s + r.notDone, 0)), 14, { bold: true, center: true }),
            cell(String(grandTotal), 14, { bold: true, center: true }),
        ],
    });

    return new Table({
        rows: [headerRow, ...dataRows, totalRow],
        width: { size: 100, type: WidthType.PERCENTAGE },
    });
}

// ===== DETAILED SUB-TABLE (specific test cases with expected outcomes) =====
function buildDetailTable(headers, rows) {
    const headerRow = new TableRow({
        children: headers.map(h => headerCell(h.text, h.width)),
        tableHeader: true,
    });

    const dataRows = rows.map(r => new TableRow({
        children: r.map((val, i) => cell(String(val), headers[i].width, { center: i > 0 })),
    }));

    return new Table({
        rows: [headerRow, ...dataRows],
        width: { size: 100, type: WidthType.PERCENTAGE },
    });
}

// ======================== DOCUMENT CONTENT ========================

const children = [
    new Paragraph({
        text: "AlertDavao Additional Testing Scenarios",
        heading: HeadingLevel.HEADING_1,
        alignment: AlignmentType.CENTER,
    }),
    new Paragraph({ children: [
        new TextRun({ text: "Project: ", bold: true }),
        new TextRun("AlertDavao Crime Reporting and Monitoring System"),
    ]}),
    new Paragraph({ children: [
        new TextRun({ text: "Date: ", bold: true }),
        new TextRun("December 2025"),
    ]}),
    spacer(),

    // =====================================================
    // TABLE 42: URGENCY SCORE CALCULATION TESTING
    // =====================================================
    heading("Table 42. Summary of Urgency Score Calculation Testing", HeadingLevel.HEADING_2),
    spacer(),
    buildSummaryTable("Urgency Score", [
        { name: "Crime Type Severity Scoring", pass: 0, fail: 0, notDone: 0, total: 8 },
        { name: "Multiple Crime Type Combination", pass: 0, fail: 0, notDone: 0, total: 4 },
        { name: "Bonus Modifiers", pass: 0, fail: 0, notDone: 0, total: 4 },
        { name: "Urgency Level Display", pass: 0, fail: 0, notDone: 0, total: 4 },
        { name: "Focus Crime Flag", pass: 0, fail: 0, notDone: 0, total: 3 },
        { name: "Information Sufficiency", pass: 0, fail: 0, notDone: 0, total: 2 },
        { name: "Urgency Sorting", pass: 0, fail: 0, notDone: 0, total: 3 },
        { name: "Admin Batch Recalculation", pass: 0, fail: 0, notDone: 0, total: 2 },
    ], 30),
    spacer(),
    italicPara("Table (42) shows urgency score calculation testing. This was conducted to verify that the system correctly assigns urgency scores to crime reports based on crime type severity tiers, evidence availability, and report recency."),
    spacer(),

    // Detailed: Crime Type → Score mapping
    heading("Table 42a. Crime Type Severity Score Test Cases", HeadingLevel.HEADING_3),
    spacer(),
    buildDetailTable(
        [
            { text: "No.", width: 6 },
            { text: "Crime Type Input", width: 25 },
            { text: "Expected Tier", width: 18 },
            { text: "Expected Score", width: 16 },
            { text: "Actual Score", width: 15 },
            { text: "Result", width: 10 },
            { text: "Status", width: 10 },
        ],
        [
            ["1", "Murder", "CRITICAL", "100", "", "", ""],
            ["2", "Homicide", "CRITICAL", "100", "", "", ""],
            ["3", "Rape", "CRITICAL", "100", "", "", ""],
            ["4", "Sexual Assault", "CRITICAL", "100", "", "", ""],
            ["5", "Robbery", "HIGH", "75", "", "", ""],
            ["6", "Physical Injury", "HIGH", "75", "", "", ""],
            ["7", "Domestic Violence", "HIGH", "75", "", "", ""],
            ["8", "Missing Person", "HIGH", "75", "", "", ""],
            ["9", "Harassment", "HIGH", "75", "", "", ""],
            ["10", "Theft", "MEDIUM", "50", "", "", ""],
            ["11", "Burglary", "MEDIUM", "50", "", "", ""],
            ["12", "Break-in", "MEDIUM", "50", "", "", ""],
            ["13", "Carnapping", "MEDIUM", "50", "", "", ""],
            ["14", "Motornapping", "MEDIUM", "50", "", "", ""],
            ["15", "Threats", "MEDIUM", "50", "", "", ""],
            ["16", "Fraud", "MEDIUM", "50", "", "", ""],
            ["17", "Cybercrime", "MEDIUM", "50", "", "", ""],
            ["18", "Other / Unrecognized", "LOW", "30", "", "", ""],
        ],
    ),
    spacer(),

    // Detailed: Multiple crime type combinations
    heading("Table 42b. Multiple Crime Type Combination Test Cases", HeadingLevel.HEADING_3),
    spacer(),
    buildDetailTable(
        [
            { text: "No.", width: 6 },
            { text: "Crime Types Submitted", width: 30 },
            { text: "Highest Tier", width: 15 },
            { text: "Expected Score", width: 15 },
            { text: "Actual Score", width: 14 },
            { text: "Result", width: 10 },
            { text: "Status", width: 10 },
        ],
        [
            ["1", "Murder + Theft", "CRITICAL", "100", "", "", ""],
            ["2", "Robbery + Fraud", "HIGH", "75", "", "", ""],
            ["3", "Rape + Domestic Violence", "CRITICAL", "100", "", "", ""],
            ["4", "Physical Injury + Missing Person", "HIGH", "75", "", "", ""],
            ["5", "Theft + Cybercrime", "MEDIUM", "50", "", "", ""],
            ["6", "Harassment + Threats", "HIGH", "75", "", "", ""],
            ["7", "Other + Other", "LOW", "30", "", "", ""],
        ],
    ),
    spacer(),

    // Detailed: Bonus modifiers
    heading("Table 42c. Urgency Bonus Modifier Test Cases", HeadingLevel.HEADING_3),
    spacer(),
    buildDetailTable(
        [
            { text: "No.", width: 5 },
            { text: "Crime Type", width: 17 },
            { text: "Base Score", width: 12 },
            { text: "Has Evidence", width: 13 },
            { text: "Within 1 Hour", width: 13 },
            { text: "Expected Score", width: 14 },
            { text: "Actual", width: 12 },
            { text: "Status", width: 14 },
        ],
        [
            ["1", "Other (LOW)", "30", "No", "No", "30", "", ""],
            ["2", "Other (LOW)", "30", "Yes", "No", "40", "", ""],
            ["3", "Other (LOW)", "30", "No", "Yes", "35", "", ""],
            ["4", "Other (LOW)", "30", "Yes", "Yes", "45", "", ""],
            ["5", "Theft (MED)", "50", "Yes", "Yes", "65", "", ""],
            ["6", "Robbery (HIGH)", "75", "Yes", "Yes", "90", "", ""],
            ["7", "Murder (CRIT)", "100", "Yes", "Yes", "100 (capped)", "", ""],
            ["8", "Rape (CRIT)", "100", "No", "Yes", "100 (capped)", "", ""],
        ],
    ),
    spacer(),

    // Detailed: Display thresholds
    heading("Table 42d. Urgency Display Level Test Cases", HeadingLevel.HEADING_3),
    spacer(),
    buildDetailTable(
        [
            { text: "No.", width: 6 },
            { text: "Urgency Score", width: 16 },
            { text: "Expected Badge", width: 18 },
            { text: "Expected Color", width: 18 },
            { text: "Expected Icon", width: 14 },
            { text: "Actual Display", width: 14 },
            { text: "Status", width: 14 },
        ],
        [
            ["1", "100", "CRITICAL", "#991b1b (red)", "🔴", "", ""],
            ["2", "90", "CRITICAL", "#991b1b (red)", "🔴", "", ""],
            ["3", "75", "HIGH", "#c2410c (orange)", "🟠", "", ""],
            ["4", "70", "HIGH", "#c2410c (orange)", "🟠", "", ""],
            ["5", "50", "MEDIUM", "#92400e (amber)", "🟡", "", ""],
            ["6", "45", "LOW", "#6b7280 (gray)", "⚪", "", ""],
            ["7", "30", "LOW", "#6b7280 (gray)", "⚪", "", ""],
            ["8", "0", "LOW", "#6b7280 (gray)", "⚪", "", ""],
        ],
    ),
    spacer(),

    // =====================================================
    // TABLE 43: MAP LOCATION ACCURACY TESTING
    // =====================================================
    heading("Table 43. Summary of Map Location Accuracy Testing", HeadingLevel.HEADING_2),
    spacer(),
    buildSummaryTable("Map Location", [
        { name: "GPS Auto-Detection", pass: 0, fail: 0, notDone: 0, total: 3 },
        { name: "Manual Map Pin Placement", pass: 0, fail: 0, notDone: 0, total: 3 },
        { name: "Address Autocomplete Search", pass: 0, fail: 0, notDone: 0, total: 3 },
        { name: "Davao City Geofence Validation", pass: 0, fail: 0, notDone: 0, total: 3 },
        { name: "Admin Map Pin Display Accuracy", pass: 0, fail: 0, notDone: 0, total: 5 },
        { name: "Map Interaction", pass: 0, fail: 0, notDone: 0, total: 2 },
    ], 19),
    spacer(),
    italicPara("Table (43) shows map location accuracy testing. This was conducted to verify that the map pin is placed at the actual reported location, and that the coordinates are accurately transmitted from the mobile app to the admin dashboard map."),
    spacer(),

    // Detailed: 5 report pin accuracy
    heading("Table 43a. Admin Map Pin Accuracy Test Cases (5 Reports)", HeadingLevel.HEADING_3),
    spacer(),
    buildDetailTable(
        [
            { text: "No.", width: 5 },
            { text: "Report Location Description", width: 25 },
            { text: "Submitted Lat/Lng", width: 20 },
            { text: "Pin on Admin Map", width: 20 },
            { text: "Pin Matches Location?", width: 15 },
            { text: "Status", width: 15 },
        ],
        [
            ["1", "Report #1 — User-selected location", "", "", "", ""],
            ["2", "Report #2 — GPS auto-detected location", "", "", "", ""],
            ["3", "Report #3 — Address search selected", "", "", "", ""],
            ["4", "Report #4 — Manual pin drag", "", "", "", ""],
            ["5", "Report #5 — Different barangay", "", "", "", ""],
        ],
    ),
    spacer(),
    italicPara("Note: For each report, compare the latitude/longitude submitted by the mobile app with the pin position displayed on the AdminSide Leaflet map (centered at [7.1907, 125.4553], zoom 11–18, using OpenStreetMap tiles with Esri satellite toggle)."),
    spacer(),

    // Detailed: Geofence test
    heading("Table 43b. Davao City Geofence Boundary Test Cases", HeadingLevel.HEADING_3),
    spacer(),
    buildDetailTable(
        [
            { text: "No.", width: 5 },
            { text: "Test Coordinates (Lat, Lng)", width: 25 },
            { text: "Location Description", width: 25 },
            { text: "Expected Result", width: 18 },
            { text: "Actual Result", width: 15 },
            { text: "Status", width: 12 },
        ],
        [
            ["1", "7.1907, 125.4553", "Davao City center", "ACCEPTED", "", ""],
            ["2", "7.0700, 125.6100", "Inside Davao boundary", "ACCEPTED", "", ""],
            ["3", "6.9000, 125.3000", "Outside Davao (south)", "REJECTED", "", ""],
            ["4", "14.5995, 120.9842", "Manila (far outside)", "REJECTED", "", ""],
            ["5", "7.4500, 125.8500", "Edge of Davao boundary", "ACCEPTED / REJECTED", "", ""],
        ],
    ),
    spacer(),

    // =====================================================
    // TABLE 44: AUTOMATIC STATION ASSIGNMENT TESTING
    // =====================================================
    heading("Table 44. Summary of Automatic Report Station Assignment Testing", HeadingLevel.HEADING_2),
    spacer(),
    buildSummaryTable("Station Assignment", [
        { name: "Polygon-Based Auto-Assignment", pass: 0, fail: 0, notDone: 0, total: 4 },
        { name: "Barangay-Based Assignment", pass: 0, fail: 0, notDone: 0, total: 2 },
        { name: "Cybercrime Special Assignment", pass: 0, fail: 0, notDone: 0, total: 2 },
        { name: "Unassigned Report Handling", pass: 0, fail: 0, notDone: 0, total: 3 },
        { name: "Assignment Priority Order", pass: 0, fail: 0, notDone: 0, total: 3 },
        { name: "Polygon Data Integrity", pass: 0, fail: 0, notDone: 0, total: 2 },
    ], 16),
    spacer(),
    italicPara("Table (44) shows automatic report station assignment testing. This was conducted to verify that the system correctly assigns reports to the appropriate police station based on the report location using the ray-casting point-in-polygon algorithm, or leaves them unassigned when outside all station jurisdictions."),
    spacer(),

    // Detailed: Assignment test cases
    heading("Table 44a. Station Assignment Scenario Test Cases", HeadingLevel.HEADING_3),
    spacer(),
    buildDetailTable(
        [
            { text: "No.", width: 5 },
            { text: "Scenario", width: 28 },
            { text: "Crime Type", width: 14 },
            { text: "Location", width: 17 },
            { text: "Expected Station", width: 18 },
            { text: "Actual Station", width: 10 },
            { text: "Status", width: 8 },
        ],
        [
            ["1", "Inside barangay with station", "Theft", "Inside polygon", "Auto-assigned to barangay's station", "", ""],
            ["2", "Outside all barangay polygons", "Robbery", "Outside all polygons", "UNASSIGNED (NULL)", "", ""],
            ["3", "Cybercrime report (any location)", "Cybercrime", "Any location", "Cybercrime Division", "", ""],
            ["4", "Report with explicit barangay_id", "Theft", "With barangay_id", "Barangay's station_id", "", ""],
            ["5", "Cybercrime + barangay_id (priority test)", "Cybercrime", "With barangay_id", "Cybercrime Division (highest priority)", "", ""],
            ["6", "Barangay_id + inside different polygon", "Theft", "Inside polygon A, barangay_id=B", "Station B (barangay_id priority)", "", ""],
            ["7", "No barangay_id, inside polygon", "Murder", "Inside polygon C", "Station C (auto-detect)", "", ""],
        ],
    ),
    spacer(),

    // =====================================================
    // TABLE 45: PATROL DISPATCH RESTRICTION TESTING
    // =====================================================
    heading("Table 45. Summary of Patrol Dispatch Restriction Testing", HeadingLevel.HEADING_2),
    spacer(),
    buildSummaryTable("Dispatch Restriction", [
        { name: "Per-Report Dispatch Restriction", pass: 0, fail: 0, notDone: 0, total: 3 },
        { name: "Dispatch Acceptance Race Condition", pass: 0, fail: 0, notDone: 0, total: 3 },
        { name: "Dispatch Status Lifecycle", pass: 0, fail: 0, notDone: 0, total: 6 },
        { name: "Response Time Tracking", pass: 0, fail: 0, notDone: 0, total: 3 },
        { name: "Admin Dispatch Creation", pass: 0, fail: 0, notDone: 0, total: 3 },
        { name: "Mobile App Dispatch UI", pass: 0, fail: 0, notDone: 0, total: 4 },
        { name: "Report Status Integration", pass: 0, fail: 0, notDone: 0, total: 2 },
    ], 24),
    spacer(),
    italicPara("Table (45) shows patrol dispatch restriction testing. This was conducted to verify that the system prevents duplicate dispatches on the same report, handles race conditions when multiple officers try to accept the same dispatch, and correctly tracks the dispatch status lifecycle from pending through completion."),
    spacer(),

    // Detailed: Dispatch lifecycle
    heading("Table 45a. Dispatch Status Lifecycle Test Cases", HeadingLevel.HEADING_3),
    spacer(),
    buildDetailTable(
        [
            { text: "No.", width: 5 },
            { text: "Action", width: 22 },
            { text: "Current Status", width: 14 },
            { text: "Expected New Status", width: 16 },
            { text: "Expected Timestamp", width: 17 },
            { text: "Actual Status", width: 14 },
            { text: "Status", width: 12 },
        ],
        [
            ["1", "Admin creates dispatch", "N/A", "pending", "dispatched_at", "", ""],
            ["2", "Admin assigns to officer", "N/A", "assigned", "dispatched_at", "", ""],
            ["3", "Officer accepts dispatch", "pending/assigned", "accepted", "accepted_at", "", ""],
            ["4", "Officer marks en route", "accepted", "en_route", "en_route_at", "", ""],
            ["5", "Officer marks arrived", "en_route", "arrived", "arrived_at", "", ""],
            ["6", "Officer verifies (valid)", "arrived", "completed", "completed_at", "", ""],
            ["7", "Officer verifies (invalid)", "arrived", "completed", "completed_at", "", ""],
            ["8", "Officer declines dispatch", "pending/assigned", "declined", "—", "", ""],
            ["9", "Admin cancels dispatch", "any active", "cancelled", "—", "", ""],
        ],
    ),
    spacer(),

    // Detailed: Restriction scenarios
    heading("Table 45b. Dispatch Restriction Scenario Test Cases", HeadingLevel.HEADING_3),
    spacer(),
    buildDetailTable(
        [
            { text: "No.", width: 5 },
            { text: "Scenario", width: 35 },
            { text: "Expected Result", width: 30 },
            { text: "Actual Result", width: 15 },
            { text: "Status", width: 15 },
        ],
        [
            ["1", "Dispatch a report that already has an active dispatch (pending)", "Error: \"This report already has an active dispatch\"", "", ""],
            ["2", "Dispatch a report that already has an active dispatch (en_route)", "Error: \"This report already has an active dispatch\"", "", ""],
            ["3", "Dispatch a report whose previous dispatch was completed", "New dispatch created successfully", "", ""],
            ["4", "Dispatch a report whose previous dispatch was cancelled", "New dispatch created successfully", "", ""],
            ["5", "Officer A accepts a dispatch, Officer B tries to accept same dispatch", "Officer B gets error: \"Dispatch already accepted by another officer\"", "", ""],
            ["6", "Officer accepts dispatch → report status check", "Report status changes to 'investigating'", "", ""],
            ["7", "Officer verifies valid → report status check", "Report status changes to 'valid'", "", ""],
        ],
    ),
    spacer(),

    // =====================================================
    // TABLE 46: USABILITY REQUIREMENTS TESTING
    // =====================================================
    heading("Table 46. Summary of Usability Requirements Testing", HeadingLevel.HEADING_2),
    spacer(),
    buildSummaryTable("Usability Requirements", [
        { name: "Input Validation Feedback", pass: 0, fail: 0, notDone: 0, total: 6 },
        { name: "Loading State Indicators", pass: 0, fail: 0, notDone: 0, total: 4 },
        { name: "User Feedback Dialogs", pass: 0, fail: 0, notDone: 0, total: 4 },
        { name: "Session and Inactivity Management", pass: 0, fail: 0, notDone: 0, total: 3 },
        { name: "Push Notification Delivery", pass: 0, fail: 0, notDone: 0, total: 3 },
        { name: "Responsive Design", pass: 0, fail: 0, notDone: 0, total: 4 },
        { name: "Real-time Data Updates", pass: 0, fail: 0, notDone: 0, total: 4 },
        { name: "Navigation and Auth Guard", pass: 0, fail: 0, notDone: 0, total: 3 },
        { name: "Progressive Login Lockout", pass: 0, fail: 0, notDone: 0, total: 3 },
        { name: "Rate Limiting", pass: 0, fail: 0, notDone: 0, total: 2 },
        { name: "Haptic and Animation Feedback", pass: 0, fail: 0, notDone: 0, total: 2 },
        { name: "Server Cold Start Handling", pass: 0, fail: 0, notDone: 0, total: 1 },
        { name: "Offline Data Availability", pass: 0, fail: 0, notDone: 0, total: 2 },
        { name: "Network Error Handling", pass: 0, fail: 0, notDone: 0, total: 3 },
        { name: "Media Upload Handling", pass: 0, fail: 0, notDone: 0, total: 3 },
    ], 47),
    spacer(),
    italicPara("Table (46) shows usability requirements testing. This was conducted to verify that the system provides appropriate user feedback, responsive design, real-time updates, session management, input validation, and error handling across both the mobile app and admin web application."),
    spacer(),

    // Detailed: Input Validation
    heading("Table 46a. Input Validation Test Cases", HeadingLevel.HEADING_3),
    spacer(),
    buildDetailTable(
        [
            { text: "No.", width: 5 },
            { text: "Input Field", width: 15 },
            { text: "Test Input", width: 22 },
            { text: "Validation Rule", width: 22 },
            { text: "Expected Result", width: 18 },
            { text: "Actual", width: 8 },
            { text: "Status", width: 10 },
        ],
        [
            ["1", "Name", "\"A\" (1 char)", "2–50 chars, letters/spaces/hyphens/apostrophes", "Error shown", "", ""],
            ["2", "Name", "\"Juan Dela Cruz\" (valid)", "2–50 chars", "Accepted", "", ""],
            ["3", "Email", "\"invalid-email\"", "Must contain @, max 100 chars", "Error shown", "", ""],
            ["4", "Email", "\"user@domain.com\"", "Valid format", "Accepted", "", ""],
            ["5", "Phone", "\"12345\" (5 chars)", "7–20 chars, digits/+/-/spaces/parens", "Error shown", "", ""],
            ["6", "Phone", "\"09171234567\" (valid PH)", "Philippine format", "Accepted", "", ""],
            ["7", "Password", "\"pass1\" (5 chars)", "Min 8 chars, 1 letter + 1 number + 1 symbol", "Error shown", "", ""],
            ["8", "Password", "\"Pass123!\" (valid)", "Meets all criteria", "Accepted", "", ""],
            ["9", "OTP", "\"12345\" (5 digits)", "Exactly 6 digits", "Error shown", "", ""],
            ["10", "OTP", "\"123456\" (6 digits)", "Valid OTP format", "Accepted", "", ""],
            ["11", "CAPTCHA", "Wrong code entered", "Must match displayed code", "Error shown", "", ""],
            ["12", "CAPTCHA", "Correct code entered", "Case-insensitive match", "Accepted", "", ""],
        ],
    ),
    spacer(),

    // Detailed: Session/Inactivity
    heading("Table 46b. Session and Inactivity Test Cases", HeadingLevel.HEADING_3),
    spacer(),
    buildDetailTable(
        [
            { text: "No.", width: 5 },
            { text: "Scenario", width: 30 },
            { text: "User Role", width: 14 },
            { text: "Expected Behavior", width: 25 },
            { text: "Actual Behavior", width: 14 },
            { text: "Status", width: 12 },
        ],
        [
            ["1", "User idle for 5 minutes", "Regular user", "Auto-logout with \"Session Expired\" alert, all storage cleared", "", ""],
            ["2", "User idle for 5 minutes", "Patrol officer", "No logout (exempt from timeout)", "", ""],
            ["3", "Touch activity during session", "Regular user", "Inactivity timer resets", "", ""],
            ["4", "Session expiry cleanup", "Regular user", "userData, userToken, pushToken, caches cleared from AsyncStorage", "", ""],
            ["5", "AdminSide session lifetime", "Admin", "Session valid for 120 minutes", "", ""],
        ],
    ),
    spacer(),

    // Detailed: Login Lockout
    heading("Table 46c. Progressive Login Lockout Test Cases (AdminSide)", HeadingLevel.HEADING_3),
    spacer(),
    buildDetailTable(
        [
            { text: "No.", width: 5 },
            { text: "Failed Attempts", width: 17 },
            { text: "Expected Lockout Duration", width: 22 },
            { text: "Expected Additional Action", width: 26 },
            { text: "Actual Result", width: 15 },
            { text: "Status", width: 15 },
        ],
        [
            ["1", "1–4 attempts", "No lockout", "Warning: \"X attempts remaining\"", "", ""],
            ["2", "5–9 attempts", "5-minute lockout", "Account temporarily locked", "", ""],
            ["3", "10–14 attempts", "10-minute lockout", "Account temporarily locked", "", ""],
            ["4", "15+ attempts", "15-minute lockout", "Email security alert sent (AccountLockoutNotification)", "", ""],
            ["5", "After lockout expires", "Lockout clears", "User can attempt login again", "", ""],
        ],
    ),
    spacer(),

    // Detailed: Responsive Design
    heading("Table 46d. Responsive Design Test Cases", HeadingLevel.HEADING_3),
    spacer(),
    buildDetailTable(
        [
            { text: "No.", width: 5 },
            { text: "Screen Width", width: 14 },
            { text: "Device Type", width: 14 },
            { text: "Expected Layout", width: 30 },
            { text: "Actual Layout", width: 20 },
            { text: "Status", width: 17 },
        ],
        [
            ["1", "< 375px", "Small phone", "1 column grid, 90% card width, 48px button height, 5% padding", "", ""],
            ["2", "375–767px", "Phone", "1 column grid, 90% card width, 48px button height, 5% padding", "", ""],
            ["3", "768–1023px", "Tablet", "2 column grid, 45% card width, 56px button height, 8% padding", "", ""],
            ["4", "≥ 1024px", "Large tablet", "3 column grid, scaled layout", "", ""],
            ["5", "≤ 768px", "AdminSide mobile", "Sidebar collapses / becomes toggleable", "", ""],
            ["6", "≥ 769px", "AdminSide desktop", "Sidebar fully visible, fixed position", "", ""],
        ],
    ),
    spacer(),

    // Detailed: Real-time
    heading("Table 46e. Real-time Data Updates Test Cases", HeadingLevel.HEADING_3),
    spacer(),
    buildDetailTable(
        [
            { text: "No.", width: 5 },
            { text: "Feature", width: 25 },
            { text: "Method", width: 15 },
            { text: "Interval / Trigger", width: 18 },
            { text: "Expected Behavior", width: 20 },
            { text: "Actual", width: 9 },
            { text: "Status", width: 8 },
        ],
        [
            ["1", "Admin dashboard new reports", "SSE / polling", "SSE live, fallback 15s poll", "New reports appear without refresh", "", ""],
            ["2", "Mobile notification check", "Polling", "Every 2 seconds", "New notifications appear in real-time", "", ""],
            ["3", "SSE reconnection", "SSE", "5s delay after error", "Auto-reconnects on connection loss", "", ""],
            ["4", "Patrol location tracking", "Polling", "Every 2 seconds", "Location updates sent to server", "", ""],
            ["5", "Mobile SSE fallback", "Polling", "Every 10 seconds", "Falls back to polling if SSE unavailable", "", ""],
            ["6", "Tab visibility reconnect", "SSE", "On tab focus", "AdminSide SSE reconnects when tab visible", "", ""],
        ],
    ),
    spacer(),

    // Detailed: Network/Offline
    heading("Table 46f. Network Error Handling and Offline Test Cases", HeadingLevel.HEADING_3),
    spacer(),
    buildDetailTable(
        [
            { text: "No.", width: 5 },
            { text: "Scenario", width: 30 },
            { text: "Expected Behavior", width: 30 },
            { text: "Actual Behavior", width: 20 },
            { text: "Status", width: 15 },
        ],
        [
            ["1", "API request with no internet connection", "\"Network error. Please check your internet connection\" message", "", ""],
            ["2", "API request exceeds 30-second timeout", "\"Request timeout\" error displayed to user", "", ""],
            ["3", "Police station lookup (offline)", "Data loads from local JSON file, shows \"available offline\" notice", "", ""],
            ["4", "Server cold start (Render free tier)", "App pings /health on launch every 5 min; 3 retries with exponential backoff", "", ""],
            ["5", "Duplicate concurrent API calls", "Request deduplication prevents duplicate calls", "", ""],
            ["6", "API response caching", "Cached responses served within 5s TTL, max 100 entries with LRU eviction", "", ""],
        ],
    ),
    spacer(),

    // Detailed: Media upload
    heading("Table 46g. Media Upload Handling Test Cases", HeadingLevel.HEADING_3),
    spacer(),
    buildDetailTable(
        [
            { text: "No.", width: 5 },
            { text: "Scenario", width: 28 },
            { text: "File Details", width: 22 },
            { text: "Expected Result", width: 22 },
            { text: "Actual", width: 12 },
            { text: "Status", width: 11 },
        ],
        [
            ["1", "Upload JPEG image evidence", "image/jpeg, < 50MB", "Upload succeeds", "", ""],
            ["2", "Upload MP4 video evidence", "video/mp4, < 50MB", "Upload succeeds", "", ""],
            ["3", "Upload file exceeding size limit", "Any type, > 50MB", "Error: \"max 50MB total\"", "", ""],
            ["4", "Upload without media permission", "No gallery/camera permission", "Permission request shown", "", ""],
            ["5", "Verification document upload (ID)", "Image via expo-image-picker", "Upload to /api/verification/upload succeeds", "", ""],
            ["6", "Supported file types", "jpeg, png, gif, webp, mp4, mov, avi, webm", "All accepted by multipart upload", "", ""],
        ],
    ),
    spacer(),

    // =====================================================
    // GRAND TOTAL SUMMARY
    // =====================================================
    heading("Additional Testing Grand Total Summary", HeadingLevel.HEADING_2),
    spacer(),
];

// Grand total summary table
const summaryHeader = new TableRow({
    children: [
        headerCell("Testing Category", 50),
        headerCell("Table No.", 20),
        headerCell("Total Scenarios", 30),
    ],
    tableHeader: true,
});

const summaryData = [
    ["Urgency Score Calculation Testing", "Table 42", "30"],
    ["Map Location Accuracy Testing", "Table 43", "19"],
    ["Automatic Report Station Assignment Testing", "Table 44", "16"],
    ["Patrol Dispatch Restriction Testing", "Table 45", "24"],
    ["Usability Requirements Testing", "Table 46", "47"],
];

const summaryRows = summaryData.map(([cat, tbl, cnt]) => new TableRow({
    children: [
        cell(cat, 50),
        cell(tbl, 20, { center: true }),
        cell(cnt, 30, { center: true }),
    ],
}));

const grandTotalRow = new TableRow({
    children: [
        cell("GRAND TOTAL", 50, { bold: true, shading: "D9D9D9" }),
        cell("", 20, { shading: "D9D9D9", center: true }),
        cell("136", 30, { bold: true, center: true, shading: "D9D9D9" }),
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
    fs.writeFileSync('testing_scenarios_final.docx', buffer);
    console.log('Document created: testing_scenarios_final.docx');
});
