# AlertDavao Data Flow Diagram (DFD)

**System:** AlertDavao Crime Reporting Platform  
**Generated:** 2025-12-18

---

## Visual Diagrams

### Context Diagram (Level 0)

![DFD Context Diagram](dfd_context.png)

### Level 1 DFD - Main Processes

![DFD Level 1](dfd_level1.png)

---

## Context Diagram (Level 0) - Mermaid

```mermaid
graph TB
    subgraph External["External Entities"]
        User["👤 Mobile App User"]
        Admin["👮 Police/Admin"]
        Google["🔐 Google OAuth"]
        WhatsApp["📱 WhatsApp API<br/>(Twilio)"]
        Maps["🗺️ Map Services"]
    end
    
    System["🚨 AlertDavao<br/>Crime Reporting System"]
    
    User -->|Crime Reports<br/>Messages<br/>Verification Requests| System
    System -->|Report Status<br/>Notifications<br/>Messages| User
    
    Admin -->|Review Reports<br/>Manage Users<br/>View Analytics| System
    System -->|Dashboard Data<br/>Crime Statistics<br/>Alerts| Admin
    
    System -->|Authentication Request| Google
    Google -->|User Profile| System
    
    System -->|OTP Request| WhatsApp
    WhatsApp -->|OTP Code| User
    
    System -->|Location Data| Maps
    Maps -->|Map Tiles<br/>Geocoding| System
    
    style System fill:#e74c3c,color:#fff
    style User fill:#3498db,color:#fff
    style Admin fill:#2ecc71,color:#fff
```

---

## Level 1 DFD - Main Processes

```mermaid
graph TB
    subgraph Users["External Entities"]
        MobileUser["👤 Mobile User"]
        AdminUser["👮 Admin/Police"]
    end
    
    subgraph Processes["Core Processes"]
        P1["1.0<br/>User Authentication<br/>& Registration"]
        P2["2.0<br/>Crime Report<br/>Submission"]
        P3["3.0<br/>Report<br/>Management"]
        P4["4.0<br/>User<br/>Verification"]
        P5["5.0<br/>Messaging<br/>System"]
        P6["6.0<br/>Crime Analytics<br/>& Forecasting"]
        P7["7.0<br/>User Moderation<br/>& Flagging"]
    end
    
    subgraph DataStores["Data Stores"]
        D1[("D1: users_public<br/>user_admin")]
        D2[("D2: reports<br/>report_media")]
        D3[("D3: locations<br/>barangays")]
        D4[("D4: verifications")]
        D5[("D5: messages")]
        D6[("D6: crime_analytics<br/>crime_forecasts")]
        D7[("D7: user_flags<br/>user_restrictions")]
    end
    
    %% User Authentication Flow
    MobileUser -->|Login/Register<br/>Credentials| P1
    P1 -->|OTP Code| MobileUser
    P1 -.->|Store User Data| D1
    P1 -.->|Read User Data| D1
    
    %% Crime Report Flow
    MobileUser -->|Crime Report<br/>Location, Photos| P2
    P2 -.->|Store Report| D2
    P2 -.->|Store Location| D3
    P2 -->|Confirmation| MobileUser
    
    %% Report Management
    AdminUser -->|Review Request| P3
    P3 -.->|Read Reports| D2
    P3 -.->|Update Status| D2
    P3 -->|Report Details| AdminUser
    
    %% Verification Flow
    MobileUser -->|ID Documents| P4
    P4 -.->|Store Verification| D4
    AdminUser -->|Approve/Reject| P4
    P4 -->|Verification Status| MobileUser
    
    %% Messaging
    MobileUser -->|Send Message| P5
    AdminUser -->|Reply Message| P5
    P5 -.->|Store Messages| D5
    P5 -->|Notifications| MobileUser
    P5 -->|Notifications| AdminUser
    
    %% Analytics
    P6 -.->|Read Report Data| D2
    P6 -.->|Read Location Data| D3
    P6 -.->|Store Analytics| D6
    AdminUser -->|View Statistics| P6
    P6 -->|Charts & Forecasts| AdminUser
    
    %% Moderation
    AdminUser -->|Flag User| P7
    P7 -.->|Store Flags| D7
    P7 -.->|Update User Status| D1
    P7 -->|Restriction Notice| MobileUser
    
    style P1 fill:#3498db,color:#fff
    style P2 fill:#e74c3c,color:#fff
    style P3 fill:#2ecc71,color:#fff
    style P4 fill:#f39c12,color:#fff
    style P5 fill:#9b59b6,color:#fff
    style P6 fill:#1abc9c,color:#fff
    style P7 fill:#e67e22,color:#fff
```

---

## Level 2 DFD - Crime Report Submission (Process 2.0)

```mermaid
graph TB
    User["👤 Mobile User"]
    
    subgraph ReportProcess["2.0 Crime Report Submission"]
        P21["2.1<br/>Validate<br/>User Status"]
        P22["2.2<br/>Capture Crime<br/>Details"]
        P23["2.3<br/>Get Location<br/>& Assign Station"]
        P24["2.4<br/>Upload<br/>Media Files"]
        P25["2.5<br/>Store Report<br/>& Notify"]
    end
    
    D1[("D1: users_public")]
    D2[("D2: reports")]
    D3[("D3: locations")]
    D4[("D4: barangays")]
    D5[("D5: police_stations")]
    D6[("D6: report_media")]
    D7[("D7: report_ip_tracking")]
    D8[("D8: notifications")]
    
    User -->|Report Request| P21
    P21 -.->|Check Restrictions| D1
    P21 -->|User Validated| P22
    
    P22 -->|Crime Type<br/>Description<br/>Date/Time| P23
    
    P23 -.->|Read Barangay| D4
    P23 -.->|Find Station| D5
    P23 -.->|Store Location| D3
    P23 -->|Location & Station| P24
    
    P24 -->|Photos/Videos| P24
    P24 -.->|Store Media| D6
    P24 -->|Media Uploaded| P25
    
    P25 -.->|Create Report| D2
    P25 -.->|Log IP Address| D7
    P25 -.->|Create Notification| D8
    P25 -->|Report Confirmation| User
    
    style P21 fill:#3498db,color:#fff
    style P22 fill:#e74c3c,color:#fff
    style P23 fill:#2ecc71,color:#fff
    style P24 fill:#f39c12,color:#fff
    style P25 fill:#9b59b6,color:#fff
```

---

## Level 2 DFD - Report Management (Process 3.0)

```mermaid
graph TB
    Admin["👮 Admin/Police"]
    
    subgraph ReportMgmt["3.0 Report Management"]
        P31["3.1<br/>View Reports<br/>Dashboard"]
        P32["3.2<br/>Review Report<br/>Details"]
        P33["3.3<br/>Update Report<br/>Status"]
        P34["3.4<br/>Reassign<br/>Station"]
        P35["3.5<br/>Mark Validity<br/>& Notify User"]
    end
    
    D1[("D2: reports")]
    D2[("D3: locations")]
    D3[("D4: report_media")]
    D4[("D5: police_stations")]
    D5[("D6: report_reassignment_requests")]
    D6[("D8: notifications")]
    
    User["👤 Mobile User"]
    
    Admin -->|View Reports| P31
    P31 -.->|Read Reports| D1
    P31 -.->|Read Locations| D2
    P31 -->|Report List| Admin
    
    Admin -->|Select Report| P32
    P32 -.->|Read Report Details| D1
    P32 -.->|Read Media| D3
    P32 -->|Full Report| Admin
    
    Admin -->|Update Status<br/>(Pending/Investigating/Resolved)| P33
    P33 -.->|Update Report| D1
    P33 -->|Status Updated| P35
    
    Admin -->|Request Reassignment| P34
    P34 -.->|Create Request| D5
    P34 -.->|Update Station| D1
    P34 -.->|Read Stations| D4
    P34 -->|Reassigned| P35
    
    P35 -.->|Create Notification| D6
    P35 -->|Status Update| User
    
    style P31 fill:#3498db,color:#fff
    style P32 fill:#2ecc71,color:#fff
    style P33 fill:#f39c12,color:#fff
    style P34 fill:#9b59b6,color:#fff
    style P35 fill:#e74c3c,color:#fff
```

---

## Data Flow Summary

### Key Data Flows

1. **User Registration Flow**
   - User → Authentication → OTP Verification → User Database

2. **Crime Report Flow**
   - User → Report Submission → Location Assignment → Station Assignment → Database Storage → Admin Notification

3. **Report Review Flow**
   - Admin → View Reports → Review Details → Update Status → User Notification

4. **Verification Flow**
   - User → Upload Documents → Encryption → Admin Review → Approval/Rejection → User Notification

5. **Messaging Flow**
   - User/Admin → Message Composition → Database Storage → Recipient Notification

6. **Analytics Flow**
   - Report Data → Aggregation → Statistical Analysis → SARIMA Forecasting → Dashboard Display

7. **Moderation Flow**
   - Admin → Flag User → Restriction Application → User Database Update → User Notification

---

## External Integrations

| Service | Purpose | Data Flow |
|---------|---------|-----------|
| **Google OAuth** | User authentication | Bidirectional (auth request/profile) |
| **Twilio WhatsApp** | OTP delivery | Outbound (OTP codes) |
| **Leaflet Maps** | Crime mapping | Inbound (map tiles, geocoding) |
| **Node.js Backend** | File storage | Bidirectional (media upload/retrieval) |
| **PostgreSQL** | Data persistence | Bidirectional (CRUD operations) |
| **SARIMA API** | Crime forecasting | Bidirectional (historical data/predictions) |
