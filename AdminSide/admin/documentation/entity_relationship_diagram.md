# AlertDavao Entity Relationship Diagram (ERD)

**Database:** alertdavao_f2ij (PostgreSQL)  
**Generated:** 2025-12-18

---

## Visual ERD Diagram

![AlertDavao Entity Relationship Diagram](erd_diagram.png)

---

## Entity Relationship Diagram (Mermaid)

```mermaid
erDiagram
    %% Core User Entities
    users_public ||--o{ reports : "submits"
    users_public ||--o{ messages : "sends/receives"
    users_public ||--o{ verifications : "requests"
    users_public ||--o{ user_flags : "receives"
    users_public ||--o{ user_restrictions : "has"
    users_public }o--|| police_stations : "assigned_to"
    
    user_admin ||--o{ reports : "reviews"
    user_admin ||--o{ messages : "sends/receives"
    user_admin ||--o{ user_admin_roles : "has"
    user_admin }o--|| police_stations : "works_at"
    user_admin ||--o{ user_flags : "creates"
    
    %% Report System
    reports }o--|| locations : "occurs_at"
    reports }o--|| police_stations : "assigned_to"
    reports ||--o{ report_media : "contains"
    reports ||--o{ report_ip_tracking : "tracked_by"
    reports ||--o{ report_reassignment_requests : "has"
    reports ||--o{ messages : "related_to"
    
    %% Location & Geography
    locations }o--|| barangays : "within"
    barangays }o--|| police_stations : "covered_by"
    locations ||--o{ crime_analytics : "analyzed_at"
    locations ||--o{ crime_forecasts : "predicted_for"
    
    %% Verification System
    verifications }o--|| users_public : "for_user"
    verified_phones ||--o{ users_public : "verifies"
    
    %% Roles & Permissions
    roles ||--o{ user_admin_roles : "assigned_to"
    user_admin_roles }o--|| user_admin : "belongs_to"
    
    %% Notifications
    notifications }o--|| users_public : "sent_to"
    notifications ||--o{ notification_reads : "read_by"
    
    %% User Moderation
    user_flags }o--|| users_public : "flags"
    user_restrictions }o--|| users_public : "restricts"
    user_flags ||--o{ flag_history : "has_history"

    %% Entity Definitions
    users_public {
        bigint id PK
        varchar firstname
        varchar lastname
        varchar contact
        varchar email
        varchar password
        varchar address
        float latitude
        float longitude
        bigint station_id FK
        boolean is_verified
        enum role
        int total_flags
        int trust_score
        timestamp created_at
    }
    
    user_admin {
        bigint id PK
        varchar firstname
        varchar lastname
        varchar contact
        varchar email
        varchar password
        bigint station_id FK
        enum role
        int total_flags
        int trust_score
        timestamp created_at
    }
    
    reports {
        bigint report_id PK
        bigint user_id FK
        bigint location_id FK
        bigint assigned_station_id FK
        varchar title
        json report_type
        text description
        timestamp date_reported
        varchar status
        varchar is_valid
        boolean is_anonymous
        timestamp created_at
    }
    
    locations {
        bigint location_id PK
        varchar barangay
        text reporters_address
        float latitude
        float longitude
        bigint station_id FK
        timestamp created_at
    }
    
    barangays {
        bigint barangay_id PK
        varchar barangay_name
        bigint station_id FK
        float latitude
        float longitude
        text boundary_polygon
        timestamp created_at
    }
    
    police_stations {
        bigint station_id PK
        varchar station_name
        varchar address
        float latitude
        float longitude
        varchar contact_number
        timestamp created_at
    }
    
    verifications {
        bigint verification_id PK
        bigint user_id FK
        varchar otp_code
        timestamp expiration
        varchar status
        varchar id_picture
        varchar id_selfie
        varchar billing_document
        boolean is_verified
        timestamp created_at
    }
    
    messages {
        bigint message_id PK
        bigint sender_id FK
        bigint receiver_id FK
        bigint report_id FK
        text message
        boolean status
        timestamp sent_at
    }
    
    user_flags {
        int id PK
        int user_id FK
        int flagged_by FK
        enum violation_type
        text reason
        enum severity
        enum status
        int reviewed_by FK
        timestamp created_at
    }
    
    user_restrictions {
        int id PK
        int user_id FK
        enum restriction_type
        text reason
        timestamp expires_at
        boolean can_report
        boolean can_comment
        boolean is_active
        timestamp created_at
    }
    
    report_media {
        bigint media_id PK
        bigint report_id FK
        varchar media_url
        varchar media_type
        timestamp created_at
    }
    
    roles {
        bigint role_id PK
        varchar role_name
        timestamp created_at
    }
    
    notifications {
        bigint id PK
        bigint user_id FK
        varchar type
        text message
        json data
        boolean read
        timestamp created_at
    }
```

---

## Key Relationships

### User Management
- **users_public** and **user_admin** are separate user types (mobile app users vs admin/police)
- Both can send/receive **messages** and are linked to **police_stations**
- **users_public** can submit **reports** and request **verifications**

### Report System
- **reports** are created by **users_public**
- Each report has a **location** (with coordinates)
- Reports are assigned to **police_stations** for investigation
- Reports can have multiple **report_media** (photos/videos)
- **report_ip_tracking** monitors submission metadata

### Geographic Hierarchy
- **locations** → **barangays** → **police_stations**
- Each barangay is covered by a police station
- Crime analytics and forecasts are tied to locations

### Moderation System
- **user_flags** track violations by users
- **user_restrictions** enforce penalties (can_report, can_comment, etc.)
- **flag_history** maintains audit trail

### Verification System
- **verifications** store encrypted ID documents
- **verified_phones** track phone number verification
- Links to **users_public** for identity confirmation

---

## Database Statistics

| Entity | Row Count | Purpose |
|--------|-----------|---------|
| locations | 18,543 | Crime incident coordinates |
| barangays | 233 | Davao City administrative divisions |
| police_stations | 21 | Police station coverage areas |
| reports | 15 | Active crime reports |
| user_admin | 10 | Admin and police accounts |
| users_public | 4 | Mobile app users |
| messages | 13 | User-admin communications |
| verifications | 2 | Pending ID verifications |
