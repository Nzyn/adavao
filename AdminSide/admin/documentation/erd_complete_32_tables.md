# AlertDavao Complete Entity Relationship Diagram (ERD)

**Database:** alertdavao_f2ij (PostgreSQL)  
**Generated:** 2025-12-18  
**Total Tables:** 32 (All Included)

---

## Complete Visual ERD - All 32 Tables

![AlertDavao Complete ERD - All 32 Tables](erd_complete.png)

*This diagram shows all 32 tables organized by functional area with relationships.*

---

## Table Organization by Category

### 👥 User Management (5 tables)
1. **users_public** - Mobile app users (4 rows)
2. **user_admin** - Admin/police users (10 rows)
3. **roles** - User roles (6 rows)
4. **user_admin_roles** - Admin role assignments (3 rows)
5. **user_role** - User role assignments (0 rows - unused)

### 📋 Reports System (4 tables)
6. **reports** - Crime reports (15 rows)
7. **report_media** - Report photos/videos (12 rows)
8. **report_ip_tracking** - Spam prevention (15 rows)
9. **report_reassignment_requests** - Station transfers (0 rows)

### 🗺️ Location & Geography (4 tables)
10. **locations** - Crime locations (18,543 rows)
11. **barangays** - Geographic divisions (233 rows)
12. **police_stations** - Police station data (21 rows)
13. **police_officers** - Officer assignments (0 rows - unused)

### ✅ Verification System (3 tables)
14. **verifications** - ID verification requests (2 rows)
15. **verified_phones** - Phone verification (4 rows)
16. **otp_codes** - OTP codes (22 rows)

### 💬 Communication (3 tables)
17. **messages** - User-admin chat (13 rows)
18. **notifications** - User notifications (10 rows)
19. **notification_reads** - Read status tracking (23 rows)

### 🚫 User Moderation (3 tables)
20. **user_flags** - User violations (29 rows)
21. **user_restrictions** - User penalties (10 rows)
22. **flag_history** - Flag audit trail (0 rows)

### 📊 Analytics (2 tables)
23. **crime_analytics** - Crime statistics (0 rows)
24. **crime_forecasts** - SARIMA predictions (0 rows)

### ⚙️ Laravel System (5 tables)
25. **migrations** - Database version control (56 rows)
26. **failed_jobs** - Queue failures (0 rows)
27. **password_reset_tokens** - Password resets (0 rows)
28. **personal_access_tokens** - API tokens (0 rows)
29. **pending_users** - Registration queue (0 rows)

### 🔐 Permissions (3 tables)
30. **routes** - Route definitions (0 rows - unused)
31. **role_route** - Role-route mapping (0 rows - unused)
32. **admin_actions** - Admin audit trail (0 rows - unused)

---

## Complete ERD with All Relationships (Mermaid)

```mermaid
erDiagram
    %% USER MANAGEMENT
    users_public ||--o{ reports : "submits"
    users_public ||--o{ messages : "sends"
    users_public ||--o{ verifications : "requests"
    users_public ||--o{ user_flags : "receives"
    users_public ||--o{ user_restrictions : "has"
    users_public }o--|| police_stations : "assigned_to"
    users_public ||--o{ user_role : "has"
    
    user_admin ||--o{ messages : "sends"
    user_admin ||--o{ user_admin_roles : "has"
    user_admin }o--|| police_stations : "works_at"
    user_admin ||--o{ user_flags : "creates"
    user_admin ||--o{ admin_actions : "performs"
    
    roles ||--o{ user_admin_roles : "assigned_via"
    roles ||--o{ user_role : "assigned_via"
    roles ||--o{ role_route : "has"
    
    %% REPORTS SYSTEM
    reports }o--|| users_public : "created_by"
    reports }o--|| locations : "occurs_at"
    reports }o--|| police_stations : "assigned_to"
    reports ||--o{ report_media : "contains"
    reports ||--o{ report_ip_tracking : "tracked_by"
    reports ||--o{ report_reassignment_requests : "has"
    reports ||--o{ messages : "related_to"
    
    %% LOCATION & GEOGRAPHY
    locations }o--|| barangays : "within"
    locations }o--|| police_stations : "covered_by"
    locations ||--o{ crime_analytics : "analyzed_at"
    locations ||--o{ crime_forecasts : "predicted_for"
    
    barangays }o--|| police_stations : "covered_by"
    
    police_stations ||--o{ police_officers : "employs"
    police_officers }o--|| user_admin : "is"
    
    %% VERIFICATION SYSTEM
    verifications }o--|| users_public : "for_user"
    verified_phones ||--o{ users_public : "verifies"
    otp_codes ||--o{ users_public : "sent_to"
    
    %% COMMUNICATION
    messages }o--|| users_public : "from_user"
    messages }o--|| user_admin : "from_admin"
    
    notifications }o--|| users_public : "sent_to"
    notifications ||--o{ notification_reads : "read_by"
    notification_reads }o--|| users_public : "read_by_user"
    
    %% USER MODERATION
    user_flags }o--|| users_public : "flags"
    user_flags }o--|| user_admin : "created_by"
    user_flags ||--o{ flag_history : "has_history"
    
    user_restrictions }o--|| users_public : "restricts"
    user_restrictions }o--|| user_admin : "created_by"
    
    %% PERMISSIONS
    routes ||--o{ role_route : "accessible_via"
    
    %% SYSTEM TABLES (no relationships shown for clarity)

    %% ENTITY DEFINITIONS
    users_public {
        bigint id PK
        varchar firstname
        varchar lastname
        varchar email
        varchar contact
        bigint station_id FK
        boolean is_verified
        int total_flags
        int trust_score
    }
    
    user_admin {
        bigint id PK
        varchar firstname
        varchar lastname
        varchar email
        bigint station_id FK
        enum role
        int total_flags
    }
    
    roles {
        bigint role_id PK
        varchar role_name
    }
    
    user_admin_roles {
        int id PK
        bigint user_admin_id FK
        bigint role_id FK
    }
    
    user_role {
        bigint id PK
        bigint user_id FK
        bigint role_id FK
    }
    
    reports {
        bigint report_id PK
        bigint user_id FK
        bigint location_id FK
        bigint assigned_station_id FK
        varchar title
        json report_type
        varchar status
    }
    
    report_media {
        bigint media_id PK
        bigint report_id FK
        varchar media_url
        varchar media_type
    }
    
    report_ip_tracking {
        bigint id PK
        bigint report_id FK
        varchar ip_address
    }
    
    report_reassignment_requests {
        bigint request_id PK
        bigint report_id FK
        bigint requested_station_id FK
    }
    
    locations {
        bigint location_id PK
        varchar barangay
        float latitude
        float longitude
        bigint station_id FK
    }
    
    barangays {
        bigint barangay_id PK
        varchar barangay_name
        bigint station_id FK
        text boundary_polygon
    }
    
    police_stations {
        bigint station_id PK
        varchar station_name
        varchar address
        varchar contact_number
    }
    
    police_officers {
        bigint officer_id PK
        bigint user_id FK
        bigint station_id FK
        varchar rank
    }
    
    verifications {
        bigint verification_id PK
        bigint user_id FK
        varchar id_picture
        varchar id_selfie
        varchar status
    }
    
    verified_phones {
        int id PK
        varchar phone
        boolean verified
    }
    
    otp_codes {
        int id PK
        varchar phone
        varchar otp_hash
        varchar purpose
    }
    
    messages {
        bigint message_id PK
        bigint sender_id FK
        bigint receiver_id FK
        bigint report_id FK
        text message
    }
    
    notifications {
        bigint id PK
        bigint user_id FK
        varchar type
        text message
        boolean read
    }
    
    notification_reads {
        bigint id PK
        bigint user_id FK
        varchar notification_id FK
    }
    
    user_flags {
        int id PK
        int user_id FK
        int flagged_by FK
        enum violation_type
        enum severity
    }
    
    user_restrictions {
        int id PK
        int user_id FK
        enum restriction_type
        boolean can_report
        boolean is_active
    }
    
    flag_history {
        int id PK
        int flag_id FK
        enum action
        int performed_by FK
    }
    
    crime_analytics {
        bigint analytics_id PK
        bigint location_id FK
        int total_reports
        float crime_rate
    }
    
    crime_forecasts {
        bigint forecast_id PK
        bigint location_id FK
        int predicted_count
        float confidence_score
    }
    
    migrations {
        bigint id PK
        varchar migration
        int batch
    }
    
    failed_jobs {
        bigint id PK
        varchar uuid
        text payload
    }
    
    password_reset_tokens {
        varchar email PK
        varchar token
    }
    
    personal_access_tokens {
        bigint id PK
        varchar tokenable_type
        varchar token
    }
    
    pending_users {
        bigint id PK
    }
    
    routes {
        bigint route_id PK
        varchar route_name
    }
    
    role_route {
        bigint id PK
        bigint role_id FK
        bigint route_id FK
    }
    
    admin_actions {
        bigint action_id PK
        bigint admin_id FK
        varchar action_type
        text description
    }
```

---

## Summary Statistics

| Category | Tables | Active Tables | Total Rows |
|----------|--------|---------------|------------|
| User Management | 5 | 4 | 23 |
| Reports System | 4 | 3 | 42 |
| Location & Geography | 4 | 3 | 18,797 |
| Verification System | 3 | 3 | 28 |
| Communication | 3 | 3 | 46 |
| User Moderation | 3 | 2 | 39 |
| Analytics | 2 | 0 | 0 |
| Laravel System | 5 | 1 | 56 |
| Permissions | 3 | 0 | 0 |
| **TOTAL** | **32** | **22** | **19,031** |

---

## Unused Tables (0 rows)

These 10 tables exist but are currently unused:

1. **user_role** - Replaced by user_admin_roles
2. **police_officers** - Officers tracked via user_admin
3. **report_reassignment_requests** - Feature not implemented
4. **flag_history** - Audit trail not being used
5. **crime_analytics** - Analytics not yet generated
6. **crime_forecasts** - SARIMA forecasting not yet active
7. **failed_jobs** - No queue failures
8. **password_reset_tokens** - No password resets yet
9. **personal_access_tokens** - No API tokens issued
10. **pending_users** - Registration queue not used
11. **routes** - Route-based permissions not implemented
12. **role_route** - Route-based permissions not implemented
13. **admin_actions** - Admin audit trail not being used

**Recommendation:** Consider removing unused tables or implementing their intended features.

---

## Key Relationships Summary

### Core Data Flow
```
users_public → reports → locations → barangays → police_stations
```

### Verification Flow
```
users_public → verifications (ID documents)
users_public → verified_phones (phone verification)
```

### Communication Flow
```
users_public ↔ messages ↔ user_admin
users_public ← notifications
```

### Moderation Flow
```
user_admin → user_flags → users_public
user_admin → user_restrictions → users_public
```

---

## Database Health

✅ **Active Tables:** 22/32 (69%)  
⚠️ **Unused Tables:** 10/32 (31%)  
📊 **Total Records:** 19,031  
🗺️ **Largest Table:** locations (18,543 rows - 97% of data)
