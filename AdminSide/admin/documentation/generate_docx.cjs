const { Document, Packer, Paragraph, Table, TableRow, TableCell, TextRun, HeadingLevel, BorderStyle, WidthType, AlignmentType, VerticalAlign } = require('docx');
const fs = require('fs');

// Data dictionary with descriptions
const tables = [
    {
        name: "admin_actions",
        tableDescription: "Logs administrative actions taken on reports or users, including approvals, deletions, and reassignments.",
        columns: [
            { field: "action_id", type: "integer (PK)", nullable: "No", description: "Unique action record" },
            { field: "admin_id", type: "integer (FK)", nullable: "No", description: "Performing admin" },
            { field: "action_type", type: "varchar", nullable: "No", description: "Type of action: 'approve', 'delete', etc." },
            { field: "report_id", type: "integer (FK)", nullable: "Yes", description: "Linked report (if applicable)" },
            { field: "timestamp", type: "timestamp", nullable: "No", description: "Date and time of action" },
            { field: "created_at", type: "timestamp", nullable: "Yes", description: "Record creation timestamp" },
            { field: "updated_at", type: "timestamp", nullable: "Yes", description: "Record update timestamp" }
        ]
    },
    {
        name: "barangays",
        tableDescription: "Contains the list of all 182 barangays in Davao City, including geographic boundaries and assigned police station mappings.",
        columns: [
            { field: "barangay_id", type: "integer (PK)", nullable: "No", description: "Unique barangay identifier" },
            { field: "barangay_name", type: "varchar(100)", nullable: "No", description: "Official barangay name" },
            { field: "citymuncode", type: "varchar(10)", nullable: "Yes", description: "City/municipality code (PSA)" },
            { field: "station_id", type: "integer (FK)", nullable: "No", description: "Assigned police station" },
            { field: "latitude", type: "double", nullable: "Yes", description: "Center latitude coordinate" },
            { field: "longitude", type: "double", nullable: "Yes", description: "Center longitude coordinate" },
            { field: "boundary_polygon", type: "text", nullable: "Yes", description: "GeoJSON boundary polygon" },
            { field: "osm_id", type: "varchar(50)", nullable: "Yes", description: "OpenStreetMap reference ID" },
            { field: "created_at", type: "timestamp", nullable: "Yes", description: "Record creation timestamp" },
            { field: "updated_at", type: "timestamp", nullable: "Yes", description: "Record update timestamp" }
        ]
    },
    {
        name: "crime_analytics",
        tableDescription: "Stores aggregated crime statistics per location and time period for dashboard analytics and trend visualization.",
        columns: [
            { field: "analytics_id", type: "integer (PK)", nullable: "No", description: "Unique analytics record ID" },
            { field: "location_id", type: "integer (FK)", nullable: "No", description: "Reference to location" },
            { field: "year", type: "integer", nullable: "Yes", description: "Year of statistics" },
            { field: "month", type: "integer", nullable: "Yes", description: "Month of statistics (1-12)" },
            { field: "total_reports", type: "integer", nullable: "No", description: "Total crime reports count" },
            { field: "crime_rate", type: "double", nullable: "No", description: "Calculated crime rate" },
            { field: "last_updated", type: "timestamp", nullable: "Yes", description: "Last calculation timestamp" },
            { field: "created_at", type: "timestamp", nullable: "Yes", description: "Record creation timestamp" },
            { field: "updated_at", type: "timestamp", nullable: "Yes", description: "Record update timestamp" }
        ]
    },
    {
        name: "crime_forecasts",
        tableDescription: "Stores machine learning predictions for future crime occurrences, including confidence intervals for predictive policing features.",
        columns: [
            { field: "forecast_id", type: "integer (PK)", nullable: "No", description: "Unique forecast record ID" },
            { field: "location_id", type: "integer (FK)", nullable: "No", description: "Reference to location" },
            { field: "forecast_date", type: "date", nullable: "Yes", description: "Target forecast date" },
            { field: "predicted_count", type: "integer", nullable: "No", description: "Predicted crime count" },
            { field: "model_used", type: "varchar", nullable: "No", description: "ML model name" },
            { field: "confidence_score", type: "double", nullable: "No", description: "Prediction confidence (0-1)" },
            { field: "lower_ci", type: "double", nullable: "Yes", description: "Lower confidence interval" },
            { field: "upper_ci", type: "double", nullable: "Yes", description: "Upper confidence interval" },
            { field: "created_at", type: "timestamp", nullable: "Yes", description: "Record creation timestamp" },
            { field: "updated_at", type: "timestamp", nullable: "Yes", description: "Record update timestamp" }
        ]
    },
    {
        name: "failed_jobs",
        tableDescription: "Laravel framework table for tracking failed background queue jobs, used for debugging and retry operations.",
        columns: [
            { field: "id", type: "integer (PK)", nullable: "No", description: "Unique failed job ID" },
            { field: "uuid", type: "varchar", nullable: "No", description: "Unique job identifier" },
            { field: "connection", type: "text", nullable: "No", description: "Queue connection used" },
            { field: "queue", type: "text", nullable: "No", description: "Queue name" },
            { field: "payload", type: "text", nullable: "No", description: "Serialized job payload" },
            { field: "exception", type: "text", nullable: "No", description: "Exception/error message" },
            { field: "failed_at", type: "timestamp", nullable: "No", description: "Failure timestamp" }
        ]
    },
    {
        name: "flag_history",
        tableDescription: "Maintains an audit trail of all actions taken on user flags, including when flags are created, reviewed, or lifted by administrators.",
        columns: [
            { field: "id", type: "integer (PK)", nullable: "No", description: "Unique history record ID" },
            { field: "flag_id", type: "integer (FK)", nullable: "No", description: "Reference to user_flags" },
            { field: "action", type: "enum", nullable: "No", description: "Action: 'created', 'reviewed', 'lifted'" },
            { field: "performed_by", type: "integer (FK)", nullable: "Yes", description: "Admin who performed action" },
            { field: "notes", type: "text", nullable: "Yes", description: "Additional notes or comments" },
            { field: "created_at", type: "timestamp", nullable: "Yes", description: "Action timestamp" }
        ]
    },
    {
        name: "locations",
        tableDescription: "Stores precise geographic coordinates and address information for each crime report, enabling map visualization and spatial analysis.",
        columns: [
            { field: "location_id", type: "integer (PK)", nullable: "No", description: "Unique location ID" },
            { field: "barangay", type: "varchar", nullable: "No", description: "Barangay where incident occurred" },
            { field: "reporters_address", type: "text", nullable: "Yes", description: "Full street address" },
            { field: "latitude", type: "double", nullable: "No", description: "GPS latitude coordinate" },
            { field: "longitude", type: "double", nullable: "No", description: "GPS longitude coordinate" },
            { field: "station_id", type: "integer (FK)", nullable: "Yes", description: "Nearest police station" },
            { field: "created_at", type: "timestamp", nullable: "Yes", description: "Record creation timestamp" },
            { field: "updated_at", type: "timestamp", nullable: "Yes", description: "Record update timestamp" }
        ]
    },
    {
        name: "messages",
        tableDescription: "Stores real-time chat messages between public users and police officers/admins, enabling communication about specific crime reports.",
        columns: [
            { field: "message_id", type: "integer (PK)", nullable: "No", description: "Unique message ID" },
            { field: "sender_id", type: "integer (FK)", nullable: "No", description: "User who sent message" },
            { field: "receiver_id", type: "integer (FK)", nullable: "No", description: "Message recipient" },
            { field: "report_id", type: "integer (FK)", nullable: "Yes", description: "Related crime report" },
            { field: "message", type: "text", nullable: "No", description: "Message content" },
            { field: "status", type: "boolean", nullable: "No", description: "Read status (true=read)" },
            { field: "sent_at", type: "timestamp", nullable: "Yes", description: "Time message was sent" },
            { field: "created_at", type: "timestamp", nullable: "Yes", description: "Record creation timestamp" },
            { field: "updated_at", type: "timestamp", nullable: "Yes", description: "Record update timestamp" }
        ]
    },
    {
        name: "migrations",
        tableDescription: "Laravel framework table tracking database schema migrations that have been executed, ensuring database version control.",
        columns: [
            { field: "id", type: "integer (PK)", nullable: "No", description: "Unique migration ID" },
            { field: "migration", type: "varchar", nullable: "No", description: "Migration filename" },
            { field: "batch", type: "integer", nullable: "No", description: "Batch number for rollback" }
        ]
    },
    {
        name: "notification_reads",
        tableDescription: "Tracks which notifications have been read by each user, supporting unread notification counts and read receipts.",
        columns: [
            { field: "id", type: "integer (PK)", nullable: "No", description: "Unique record ID" },
            { field: "user_id", type: "integer (FK)", nullable: "No", description: "User who read notification" },
            { field: "notification_id", type: "varchar", nullable: "No", description: "Reference to notification" },
            { field: "read_at", type: "timestamp", nullable: "Yes", description: "Timestamp when read" }
        ]
    },
    {
        name: "notifications",
        tableDescription: "Stores system-generated notifications for users about report updates, verification status changes, and important alerts.",
        columns: [
            { field: "id", type: "integer (PK)", nullable: "No", description: "Unique notification ID" },
            { field: "user_id", type: "integer (FK)", nullable: "No", description: "Target user" },
            { field: "type", type: "varchar", nullable: "No", description: "Notification type/category" },
            { field: "message", type: "text", nullable: "No", description: "Notification message text" },
            { field: "data", type: "json", nullable: "Yes", description: "Additional JSON data" },
            { field: "read", type: "boolean", nullable: "Yes", description: "Read status flag" },
            { field: "created_at", type: "timestamp", nullable: "Yes", description: "When notification was created" },
            { field: "updated_at", type: "timestamp", nullable: "Yes", description: "Record update timestamp" }
        ]
    },
    {
        name: "otp_codes",
        tableDescription: "Stores one-time password codes used for phone number verification during login and registration via WhatsApp.",
        columns: [
            { field: "id", type: "integer (PK)", nullable: "No", description: "Unique OTP record ID" },
            { field: "phone", type: "varchar", nullable: "No", description: "Phone number receiving OTP" },
            { field: "otp_hash", type: "varchar", nullable: "No", description: "Hashed OTP code" },
            { field: "purpose", type: "varchar", nullable: "No", description: "Purpose: 'login', 'register'" },
            { field: "user_id", type: "integer (FK)", nullable: "Yes", description: "Associated user (if exists)" },
            { field: "expires_at", type: "timestamp", nullable: "Yes", description: "OTP expiration time" },
            { field: "created_at", type: "timestamp", nullable: "Yes", description: "When OTP was generated" }
        ]
    },
    {
        name: "password_reset_tokens",
        tableDescription: "Stores temporary tokens for password reset functionality, allowing users to securely reset their passwords via email.",
        columns: [
            { field: "email", type: "varchar (PK)", nullable: "No", description: "User email address" },
            { field: "token", type: "varchar", nullable: "No", description: "Secure reset token" },
            { field: "created_at", type: "timestamp", nullable: "Yes", description: "Token creation time" }
        ]
    },
    {
        name: "pending_users",
        tableDescription: "Temporary storage for users who have started registration but not yet completed verification or approval process.",
        columns: [
            { field: "id", type: "integer (PK)", nullable: "No", description: "Unique pending user ID" },
            { field: "created_at", type: "timestamp", nullable: "Yes", description: "Registration start time" },
            { field: "updated_at", type: "timestamp", nullable: "Yes", description: "Last update timestamp" }
        ]
    },
    {
        name: "personal_access_tokens",
        tableDescription: "Laravel Sanctum API tokens for authenticating mobile app users and external API access with configurable abilities.",
        columns: [
            { field: "id", type: "integer (PK)", nullable: "No", description: "Unique token ID" },
            { field: "tokenable_type", type: "varchar", nullable: "No", description: "Model class name" },
            { field: "tokenable_id", type: "integer (FK)", nullable: "No", description: "Model ID (user ID)" },
            { field: "name", type: "varchar", nullable: "No", description: "Token name/device" },
            { field: "token", type: "varchar", nullable: "No", description: "Hashed API token" },
            { field: "abilities", type: "text", nullable: "Yes", description: "Permitted actions JSON" },
            { field: "last_used_at", type: "timestamp", nullable: "Yes", description: "Last API call time" },
            { field: "expires_at", type: "timestamp", nullable: "Yes", description: "Token expiration" },
            { field: "created_at", type: "timestamp", nullable: "Yes", description: "Token creation time" },
            { field: "updated_at", type: "timestamp", nullable: "Yes", description: "Record update timestamp" }
        ]
    },
    {
        name: "police_officers",
        tableDescription: "Stores police officer profiles and their station assignments, linking user accounts to specific police stations and ranks.",
        columns: [
            { field: "officer_id", type: "integer (PK)", nullable: "No", description: "Unique officer ID" },
            { field: "user_id", type: "integer (FK)", nullable: "No", description: "Linked user account" },
            { field: "station_id", type: "integer (FK)", nullable: "No", description: "Assigned police station" },
            { field: "assigned_since", type: "date", nullable: "Yes", description: "Assignment start date" },
            { field: "rank", type: "varchar", nullable: "Yes", description: "Police rank/title" },
            { field: "status", type: "varchar", nullable: "No", description: "Status: 'active', 'inactive'" },
            { field: "created_at", type: "timestamp", nullable: "Yes", description: "Record creation timestamp" },
            { field: "updated_at", type: "timestamp", nullable: "Yes", description: "Record update timestamp" }
        ]
    },
    {
        name: "police_stations",
        tableDescription: "Contains all 21 police stations in Davao City with their locations, contact information, and geographic coordinates for report routing.",
        columns: [
            { field: "station_id", type: "integer (PK)", nullable: "No", description: "Unique station ID" },
            { field: "station_name", type: "varchar", nullable: "No", description: "Official station name" },
            { field: "address", type: "varchar", nullable: "Yes", description: "Physical address" },
            { field: "latitude", type: "double", nullable: "Yes", description: "GPS latitude" },
            { field: "longitude", type: "double", nullable: "Yes", description: "GPS longitude" },
            { field: "contact_number", type: "varchar", nullable: "Yes", description: "Phone number" },
            { field: "created_at", type: "timestamp", nullable: "Yes", description: "Record creation timestamp" },
            { field: "updated_at", type: "timestamp", nullable: "Yes", description: "Record update timestamp" }
        ]
    },
    {
        name: "report_ip_tracking",
        tableDescription: "Records IP addresses and device information for each report submission, supporting fraud detection and abuse prevention.",
        columns: [
            { field: "id", type: "integer (PK)", nullable: "No", description: "Unique tracking record ID" },
            { field: "report_id", type: "integer (FK)", nullable: "No", description: "Associated report" },
            { field: "ip_address", type: "varchar", nullable: "No", description: "Submitter's IP address" },
            { field: "user_agent", type: "text", nullable: "Yes", description: "Browser/device info" },
            { field: "submitted_at", type: "timestamp", nullable: "Yes", description: "Submission timestamp" }
        ]
    },
    {
        name: "report_media",
        tableDescription: "Stores URLs and metadata for images, videos, and other media files attached to crime reports as evidence.",
        columns: [
            { field: "media_id", type: "integer (PK)", nullable: "No", description: "Unique media ID" },
            { field: "report_id", type: "integer (FK)", nullable: "No", description: "Parent report" },
            { field: "media_url", type: "varchar", nullable: "No", description: "Cloud storage URL" },
            { field: "media_type", type: "varchar", nullable: "No", description: "Type: 'image', 'video'" },
            { field: "created_at", type: "timestamp", nullable: "Yes", description: "Upload timestamp" },
            { field: "updated_at", type: "timestamp", nullable: "Yes", description: "Record update timestamp" }
        ]
    },
    {
        name: "report_reassignment_requests",
        tableDescription: "Manages requests to transfer report jurisdiction between police stations, with approval workflow and audit trail.",
        columns: [
            { field: "request_id", type: "integer (PK)", nullable: "No", description: "Unique request ID" },
            { field: "report_id", type: "integer (FK)", nullable: "No", description: "Report to transfer" },
            { field: "requested_by_user_id", type: "integer (FK)", nullable: "No", description: "Requesting officer" },
            { field: "current_station_id", type: "integer (FK)", nullable: "Yes", description: "Current station" },
            { field: "requested_station_id", type: "integer (FK)", nullable: "No", description: "Target station" },
            { field: "reason", type: "varchar", nullable: "Yes", description: "Transfer justification" },
            { field: "status", type: "enum", nullable: "No", description: "Status: pending/approved/rejected" },
            { field: "reviewed_by_user_id", type: "integer (FK)", nullable: "Yes", description: "Reviewing admin" },
            { field: "reviewed_at", type: "timestamp", nullable: "Yes", description: "Review timestamp" },
            { field: "created_at", type: "timestamp", nullable: "Yes", description: "Request timestamp" },
            { field: "updated_at", type: "timestamp", nullable: "Yes", description: "Record update timestamp" }
        ]
    },
    {
        name: "reports",
        tableDescription: "Core table storing all crime reports submitted by citizens, including incident details, status tracking, and validation state.",
        columns: [
            { field: "report_id", type: "integer (PK)", nullable: "No", description: "Unique report ID" },
            { field: "user_id", type: "integer (FK)", nullable: "No", description: "Submitting user" },
            { field: "location_id", type: "integer (FK)", nullable: "No", description: "Incident location" },
            { field: "assigned_station_id", type: "integer (FK)", nullable: "Yes", description: "Handling station" },
            { field: "title", type: "varchar", nullable: "Yes", description: "Report title/summary" },
            { field: "report_type", type: "json", nullable: "No", description: "Crime categories array" },
            { field: "description", type: "text", nullable: "No", description: "Incident description" },
            { field: "date_reported", type: "timestamp", nullable: "Yes", description: "Incident date/time" },
            { field: "status", type: "varchar", nullable: "No", description: "Status: pending/investigating/resolved" },
            { field: "is_valid", type: "varchar", nullable: "No", description: "Validation: valid/invalid/checking" },
            { field: "is_anonymous", type: "boolean", nullable: "No", description: "Anonymous report flag" },
            { field: "created_at", type: "timestamp", nullable: "Yes", description: "Submission timestamp" },
            { field: "updated_at", type: "timestamp", nullable: "Yes", description: "Last update timestamp" }
        ]
    },
    {
        name: "role_route",
        tableDescription: "Many-to-many junction table linking roles to accessible routes for fine-grained permission control.",
        columns: [
            { field: "id", type: "integer (PK)", nullable: "No", description: "Unique mapping ID" },
            { field: "role_id", type: "integer (FK)", nullable: "No", description: "Reference to role" },
            { field: "route_id", type: "integer (FK)", nullable: "No", description: "Reference to route" },
            { field: "created_at", type: "timestamp", nullable: "Yes", description: "Mapping creation time" },
            { field: "updated_at", type: "timestamp", nullable: "Yes", description: "Record update timestamp" }
        ]
    },
    {
        name: "roles",
        tableDescription: "Defines user roles in the system such as 'admin', 'officer', 'user' for role-based access control (RBAC).",
        columns: [
            { field: "role_id", type: "integer (PK)", nullable: "No", description: "Unique role ID" },
            { field: "role_name", type: "varchar", nullable: "No", description: "Role name: admin/officer/user" },
            { field: "created_at", type: "timestamp", nullable: "Yes", description: "Role creation time" },
            { field: "updated_at", type: "timestamp", nullable: "Yes", description: "Record update timestamp" }
        ]
    },
    {
        name: "routes",
        tableDescription: "Stores application route definitions for the permission system, allowing dynamic route-based access control.",
        columns: [
            { field: "route_id", type: "integer (PK)", nullable: "No", description: "Unique route ID" },
            { field: "route_name", type: "varchar", nullable: "No", description: "Route path/identifier" },
            { field: "created_at", type: "timestamp", nullable: "Yes", description: "Route creation time" },
            { field: "updated_at", type: "timestamp", nullable: "Yes", description: "Record update timestamp" }
        ]
    },
    {
        name: "user_admin",
        tableDescription: "Stores administrator and police officer accounts with authentication credentials, profile information, and trust scoring for the admin panel.",
        columns: [
            { field: "id", type: "integer (PK)", nullable: "No", description: "Unique admin user ID" },
            { field: "firstname", type: "varchar", nullable: "No", description: "First name" },
            { field: "lastname", type: "varchar", nullable: "No", description: "Last name" },
            { field: "contact", type: "varchar", nullable: "No", description: "Phone number" },
            { field: "email", type: "varchar", nullable: "No", description: "Email address (unique)" },
            { field: "password", type: "varchar", nullable: "No", description: "Hashed password" },
            { field: "station_id", type: "integer (FK)", nullable: "Yes", description: "Assigned station" },
            { field: "is_verified", type: "boolean", nullable: "No", description: "Email verified flag" },
            { field: "role", type: "enum", nullable: "No", description: "Role: admin/officer/user" },
            { field: "trust_score", type: "integer", nullable: "Yes", description: "Trust score (0-100)" },
            { field: "total_flags", type: "integer", nullable: "Yes", description: "Total violation flags" },
            { field: "restriction_level", type: "enum", nullable: "Yes", description: "Restriction: none/warning/limited/banned" },
            { field: "failed_login_attempts", type: "integer", nullable: "No", description: "Login failure count" },
            { field: "lockout_until", type: "timestamp", nullable: "Yes", description: "Account lockout expiry" },
            { field: "created_at", type: "timestamp", nullable: "No", description: "Account creation time" },
            { field: "updated_at", type: "timestamp", nullable: "No", description: "Last update timestamp" }
        ]
    },
    {
        name: "user_admin_roles",
        tableDescription: "Many-to-many junction table linking admin users to their assigned roles for flexible permission management.",
        columns: [
            { field: "id", type: "integer (PK)", nullable: "No", description: "Unique mapping ID" },
            { field: "user_admin_id", type: "integer (FK)", nullable: "No", description: "Reference to admin" },
            { field: "role_id", type: "integer (FK)", nullable: "No", description: "Reference to role" },
            { field: "created_at", type: "timestamp", nullable: "Yes", description: "Assignment timestamp" },
            { field: "updated_at", type: "timestamp", nullable: "Yes", description: "Record update timestamp" }
        ]
    },
    {
        name: "user_flags",
        tableDescription: "Records user violations such as false reports, spam, harassment, with severity levels, evidence, and review workflow for moderation.",
        columns: [
            { field: "id", type: "integer (PK)", nullable: "No", description: "Unique flag ID" },
            { field: "user_id", type: "integer (FK)", nullable: "No", description: "Flagged user" },
            { field: "flagged_by", type: "integer (FK)", nullable: "No", description: "Flagging admin" },
            { field: "violation_type", type: "enum", nullable: "No", description: "Type: false_report/spam/harassment" },
            { field: "severity", type: "enum", nullable: "Yes", description: "Severity: minor/moderate/severe" },
            { field: "reason", type: "text", nullable: "Yes", description: "Violation reason" },
            { field: "evidence", type: "json", nullable: "Yes", description: "Supporting evidence" },
            { field: "status", type: "enum", nullable: "Yes", description: "Status: pending/reviewed/lifted" },
            { field: "reviewed_by", type: "integer (FK)", nullable: "Yes", description: "Reviewing admin" },
            { field: "reviewed_at", type: "timestamp", nullable: "Yes", description: "Review timestamp" },
            { field: "duration_days", type: "integer", nullable: "Yes", description: "Restriction duration" },
            { field: "expires_at", type: "timestamp", nullable: "Yes", description: "Expiration date" },
            { field: "created_at", type: "timestamp", nullable: "Yes", description: "Flag creation time" },
            { field: "updated_at", type: "timestamp", nullable: "Yes", description: "Last update timestamp" }
        ]
    },
    {
        name: "user_restrictions",
        tableDescription: "Tracks active restrictions on user accounts, controlling which actions users can perform based on their violation history.",
        columns: [
            { field: "id", type: "integer (PK)", nullable: "No", description: "Unique restriction ID" },
            { field: "user_id", type: "integer (FK)", nullable: "No", description: "Restricted user" },
            { field: "restriction_type", type: "enum", nullable: "No", description: "Type: warning/limited/banned" },
            { field: "reason", type: "text", nullable: "Yes", description: "Restriction reason" },
            { field: "restricted_by", type: "integer (FK)", nullable: "Yes", description: "Admin who applied" },
            { field: "expires_at", type: "timestamp", nullable: "Yes", description: "Expiration timestamp" },
            { field: "can_report", type: "boolean", nullable: "Yes", description: "Allow report submission" },
            { field: "can_comment", type: "boolean", nullable: "Yes", description: "Allow commenting" },
            { field: "can_upload", type: "boolean", nullable: "Yes", description: "Allow media upload" },
            { field: "can_message", type: "boolean", nullable: "Yes", description: "Allow messaging" },
            { field: "is_active", type: "boolean", nullable: "Yes", description: "Currently enforced" },
            { field: "lifted_by", type: "integer (FK)", nullable: "Yes", description: "Admin who lifted" },
            { field: "lifted_at", type: "timestamp", nullable: "Yes", description: "When lifted" },
            { field: "created_at", type: "timestamp", nullable: "Yes", description: "Creation timestamp" },
            { field: "updated_at", type: "timestamp", nullable: "Yes", description: "Last update timestamp" }
        ]
    },
    {
        name: "user_role",
        tableDescription: "Many-to-many junction table linking public users to their assigned roles for authorization.",
        columns: [
            { field: "id", type: "integer (PK)", nullable: "No", description: "Unique mapping ID" },
            { field: "user_id", type: "integer (FK)", nullable: "No", description: "Reference to user" },
            { field: "role_id", type: "integer (FK)", nullable: "No", description: "Reference to role" },
            { field: "created_at", type: "timestamp", nullable: "Yes", description: "Assignment timestamp" },
            { field: "updated_at", type: "timestamp", nullable: "Yes", description: "Record update timestamp" }
        ]
    },
    {
        name: "users_public",
        tableDescription: "Stores citizen/public user accounts who use the mobile app to submit crime reports, with profile data and trust metrics.",
        columns: [
            { field: "id", type: "integer (PK)", nullable: "No", description: "Unique user ID" },
            { field: "firstname", type: "varchar", nullable: "No", description: "First name" },
            { field: "lastname", type: "varchar", nullable: "No", description: "Last name" },
            { field: "contact", type: "varchar", nullable: "No", description: "Phone number" },
            { field: "email", type: "varchar", nullable: "No", description: "Email address (unique)" },
            { field: "password", type: "varchar", nullable: "No", description: "Hashed password" },
            { field: "address", type: "varchar", nullable: "Yes", description: "Home address" },
            { field: "latitude", type: "double", nullable: "Yes", description: "GPS latitude" },
            { field: "longitude", type: "double", nullable: "Yes", description: "GPS longitude" },
            { field: "station_id", type: "integer (FK)", nullable: "Yes", description: "Nearest station" },
            { field: "is_verified", type: "boolean", nullable: "No", description: "Account verified flag" },
            { field: "trust_score", type: "integer", nullable: "Yes", description: "Trust score (0-100)" },
            { field: "total_flags", type: "integer", nullable: "Yes", description: "Total violation flags" },
            { field: "restriction_level", type: "enum", nullable: "Yes", description: "Restriction level" },
            { field: "created_at", type: "timestamp", nullable: "No", description: "Registration time" },
            { field: "updated_at", type: "timestamp", nullable: "No", description: "Last update timestamp" }
        ]
    },
    {
        name: "verifications",
        tableDescription: "Stores identity verification submissions with uploaded documents (ID photo, selfie, proof of address) for user authentication.",
        columns: [
            { field: "verification_id", type: "integer (PK)", nullable: "No", description: "Unique verification ID" },
            { field: "user_id", type: "integer (FK)", nullable: "No", description: "User being verified" },
            { field: "status", type: "varchar", nullable: "No", description: "Status: pending/approved/rejected" },
            { field: "id_picture", type: "varchar", nullable: "Yes", description: "ID photo URL" },
            { field: "id_selfie", type: "varchar", nullable: "Yes", description: "Selfie with ID URL" },
            { field: "billing_document", type: "varchar", nullable: "Yes", description: "Proof of address URL" },
            { field: "is_verified", type: "boolean", nullable: "No", description: "Verification approved" },
            { field: "created_at", type: "timestamp", nullable: "Yes", description: "Submission time" },
            { field: "updated_at", type: "timestamp", nullable: "Yes", description: "Review timestamp" }
        ]
    },
    {
        name: "verified_phones",
        tableDescription: "Tracks phone numbers that have been verified via OTP, preventing duplicate accounts and enabling phone-based authentication.",
        columns: [
            { field: "id", type: "integer (PK)", nullable: "No", description: "Unique record ID" },
            { field: "phone", type: "varchar", nullable: "No", description: "Phone number (unique)" },
            { field: "verified", type: "boolean", nullable: "Yes", description: "Verification status" },
            { field: "verified_at", type: "timestamp", nullable: "Yes", description: "When verified" }
        ]
    }
];

// Simple border style
const simpleBorder = {
    top: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
    bottom: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
    left: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
    right: { style: BorderStyle.SINGLE, size: 1, color: "000000" }
};

// Helper function to create a table row
function createTableRow(cells, isHeader = false) {
    return new TableRow({
        children: cells.map(cell => new TableCell({
            children: [new Paragraph({
                children: [new TextRun({
                    text: cell,
                    bold: isHeader,
                    size: 20,
                    font: "Times New Roman"
                })],
                alignment: AlignmentType.LEFT
            })],
            borders: simpleBorder,
            margins: { top: 40, bottom: 40, left: 80, right: 80 },
            verticalAlign: VerticalAlign.CENTER
        }))
    });
}

// Create document sections
const docChildren = [];

// Title Page
docChildren.push(
    new Paragraph({
        children: [new TextRun({
            text: "AlertDavao Database",
            bold: true,
            size: 56,
            font: "Times New Roman"
        })],
        alignment: AlignmentType.CENTER,
        spacing: { before: 2000, after: 200 }
    }),
    new Paragraph({
        children: [new TextRun({
            text: "Data Dictionary",
            bold: true,
            size: 48,
            font: "Times New Roman"
        })],
        alignment: AlignmentType.CENTER,
        spacing: { after: 800 }
    }),
    new Paragraph({
        children: [new TextRun({
            text: "Database: alertdavao_w07v (PostgreSQL)",
            size: 24,
            font: "Times New Roman"
        })],
        alignment: AlignmentType.CENTER,
        spacing: { after: 100 }
    }),
    new Paragraph({
        children: [new TextRun({
            text: `Generated: ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}`,
            size: 24,
            font: "Times New Roman"
        })],
        alignment: AlignmentType.CENTER,
        spacing: { after: 100 }
    }),
    new Paragraph({
        children: [new TextRun({
            text: "Total Tables: 32",
            size: 24,
            font: "Times New Roman"
        })],
        alignment: AlignmentType.CENTER,
        spacing: { after: 800 }
    })
);

// Page break
docChildren.push(new Paragraph({ pageBreakBefore: true }));

// Table of Contents Header
docChildren.push(
    new Paragraph({
        children: [new TextRun({
            text: "Table of Contents",
            bold: true,
            size: 32,
            font: "Times New Roman"
        })],
        alignment: AlignmentType.CENTER,
        spacing: { after: 400 }
    })
);

// Table of Contents entries
tables.forEach((table, index) => {
    docChildren.push(
        new Paragraph({
            children: [new TextRun({
                text: `Table ${index + 1}. ${table.name}`,
                size: 22,
                font: "Times New Roman"
            })],
            spacing: { after: 80 }
        })
    );
});

// Each table section
tables.forEach((table, index) => {
    // Page break before each table
    docChildren.push(new Paragraph({ pageBreakBefore: true }));

    // Table header - matching the image format "Table X. tablename table"
    docChildren.push(
        new Paragraph({
            children: [new TextRun({
                text: `Table ${index + 1}. ${table.name} table`,
                bold: true,
                size: 24,
                font: "Times New Roman"
            })],
            alignment: AlignmentType.CENTER,
            spacing: { after: 300 }
        })
    );

    // Create table with columns matching the image: Field Name, Data Type, Null, Description
    const tableRows = [
        createTableRow(["Field Name", "Data Type", "Null", "Description"], true)
    ];

    table.columns.forEach(col => {
        tableRows.push(createTableRow([
            col.field,
            col.type,
            col.nullable,
            col.description
        ]));
    });

    docChildren.push(
        new Table({
            rows: tableRows,
            width: { size: 100, type: WidthType.PERCENTAGE }
        })
    );

    // Add table description paragraph below the table (italicized)
    if (table.tableDescription) {
        docChildren.push(
            new Paragraph({
                children: [new TextRun({
                    text: table.tableDescription,
                    italics: true,
                    size: 22,
                    font: "Times New Roman"
                })],
                spacing: { before: 200, after: 200 }
            })
        );
    }
});

// Create document
const doc = new Document({
    sections: [{
        properties: {
            page: {
                margin: {
                    top: 1440, // 1 inch
                    right: 1440,
                    bottom: 1440,
                    left: 1440
                }
            }
        },
        children: docChildren
    }]
});

// Generate and save
Packer.toBuffer(doc).then(buffer => {
    fs.writeFileSync('d:/Codes/alertdavao/alertdavao/AdminSide/admin/documentation/data_dictionary_v3.docx', buffer);
    console.log('✅ Data dictionary saved to data_dictionary_v3.docx');
}).catch(err => {
    console.error('Error generating document:', err);
});
