# AlertDavao — Diagram Updates Needed

This document lists all the changes that need to be reflected in the **Conceptual Framework**, **ERD**, and **Use Case Diagram** to match the current state of the system after the dispatch overhaul and recent feature additions.

---

## 1. Conceptual Framework (Input → Process → Output)

### Current State (What the diagram shows)
- **Process**: MySQL Database, React Native Laravel, SARIMA, Route-based Access Control, HTML/CSS/JavaScript, Leaflet.js
- **Input**: User Data, Incident Reports, Law Enforcement Data, Historical Crime Data
- **Output**: Confirmations/report updates (Citizens), Dashboards/maps/alerts (Local Enforcers), Analytics/heatmaps/summaries (Admin)

### Updates Needed

#### Process Section
| Current | Update To | Reason |
|---------|-----------|--------|
| MySQL Database | **PostgreSQL Database** | System was migrated from MySQL to PostgreSQL (hosted on Render) |
| React Native Laravel | **React Native (Expo) + Laravel** | More accurate — Expo SDK 52 is used for the mobile app, Laravel for the admin panel |
| *(not shown)* | Add **Node.js / Express** | The backend API server is Node.js/Express, not just Laravel. It handles all mobile app API calls |
| *(not shown)* | Add **EAS Build (Expo Application Services)** | APK builds are done via EAS cloud, this is part of the process |

#### Input Section
| Current | Update To | Reason |
|---------|-----------|--------|
| *(not shown)* | Add **Patrol Dispatch Data** | Dispatches are now a major input — admin/police dispatch reports to patrol officers |
| *(not shown)* | Add **Chat/Messaging Data** | Real-time messaging between patrol officers and admin/police is now a feature |

#### Output Section
| Current | Update To | Reason |
|---------|-----------|--------|
| Dashboards, maps, alerts (Local Enforcers) | Add **Dispatch notifications, real-time dispatch status, chat messages** | Patrol officers now receive broadcast dispatch notifications and can chat with admin/police |
| *(not shown)* | Add **Response Time analytics** | Dispatch response time metrics are now tracked and displayed |

---

## 2. ERD (Entity Relationship Diagram)

### Current State (What the diagram shows)
The ERD shows the following table groups:
- **User Management**: `users_public`, `user_admin`, `user_admin_roles`, `roles`
- **Reports**: `reports`, `report_media`, `report_ip_tracking`, `dispatch_requests`
- **Location & Geography**: `locations`, `barangays`, `police_stations`, `boundary_polygons`, `patrol_officer`
- **Verification**: `verifications`, `verified_phones`, `otp_codes`
- **Communication**: `messages`, `notifications`, `notification_reads`
- **Moderation**: `user_flags`, `user_restrictions`
- **Analytics**: `crime_analytics`, `crime_forecasts`, `crime_rose`
- **System**: `migrations`, `failed_jobs`, `password_reset_tokens`, `personal_access_tokens`
- **Permissions**: `routes`, `role_route`, `admin_actions`

### Updates Needed

#### Tables to ADD (new tables not in the current ERD)
| New Table | Fields | Group | Reason |
|-----------|--------|-------|--------|
| `patrol_dispatches` | `dispatch_id` (PK), `report_id` (FK→reports), `station_id` (FK→police_stations), `patrol_officer_id` (FK→users_public, nullable), `status` (enum: pending/accepted/en_route/arrived/completed), `dispatched_at`, `accepted_at`, `en_route_at`, `arrived_at`, `completed_at`, `dispatched_by`, `notes`, `acceptance_time`, `response_time`, `completion_time`, `three_minute_rule_met`, `is_valid`, `validation_notes`, `validated_at`, `created_at`, `updated_at` | **Dispatch** (new group) | Core dispatch system — replaces the old `dispatch_requests` table. Tracks full lifecycle of patrol dispatches |

#### Tables to MODIFY
| Table | Change | Reason |
|-------|--------|--------|
| `users_public` | Add field: `user_role` (enum: user/patrol_officer/police), `push_token` (text), `assigned_station_id` (FK→police_stations) | Users now have explicit roles; patrol officers have push tokens for dispatch notifications and station assignments |
| `reports` | Add field: `is_valid` (enum: valid/invalid/pending), `validated_at` (timestamp) | Reports are now validated by patrol officers after on-site verification |
| `messages` | Add field: `is_read` (boolean, default false) | Read receipts are now tracked for chat messages |

#### Tables to REMOVE or RENAME
| Table | Action | Reason |
|-------|--------|--------|
| `dispatch_requests` | **Remove** or mark as deprecated | Replaced by `patrol_dispatches` which has a complete dispatch lifecycle |
| `patrol_officer` | **Remove** or merge into `users_public` | Patrol officer data is now stored directly in `users_public` with `user_role = 'patrol_officer'` |

#### New Relationships to ADD
| From | To | Type | Description |
|------|----|------|-------------|
| `patrol_dispatches.report_id` | `reports.report_id` | Many-to-One | Each dispatch is linked to one report |
| `patrol_dispatches.station_id` | `police_stations.station_id` | Many-to-One | Each dispatch is assigned to a station |
| `patrol_dispatches.patrol_officer_id` | `users_public.id` | Many-to-One (nullable) | Officer who accepted the dispatch (NULL until accepted — broadcast model) |
| `patrol_dispatches.dispatched_by` | `user_admin.id` | Many-to-One | Admin/police user who initiated the dispatch |
| `users_public.assigned_station_id` | `police_stations.station_id` | Many-to-One | Patrol officer's assigned police station |
| `messages.sender_id` | `users_public.id` | Many-to-One | Message sender |
| `messages.receiver_id` | `users_public.id` | Many-to-One | Message receiver |

---

## 3. Use Case Diagram

### Current State (What the diagram shows)
- **Citizen**: Log In → File Crime Report → Upload Evidence → View Report Status → Submit Verification
- **Central Admin**: Log In (Admin Portal) → Access Admin Panel → Manage All Reports → Assign to Station → Receive Verifications → View Statistics
- **Local Officer**: View Assigned Reports → Update Report Status → View Crime Map → Real-time Chat

### Updates Needed

#### New Actor
| Actor | Description |
|-------|-------------|
| **Patrol Officer** | Should be a separate actor from "Local Officer". Patrol officers are mobile field units who respond to dispatches, while Local Officers (police) manage station-level operations |

#### New Use Cases to ADD

**For Central Admin / Police:**
| Use Case | Description |
|----------|-------------|
| **Dispatch Report to Patrol** | Admin/police can dispatch a report to all patrol officers (broadcast) with optional notes |
| **Add Dispatch Notes** | Admin/police can add notes/instructions when dispatching |
| **Chat with Patrol Officer** | Real-time messaging with patrol officers in the field |
| **View Dispatch Status** | Monitor real-time status of active dispatches (pending → accepted → en route → arrived → completed) |
| **View Response Time Metrics** | View patrol officer response time analytics |

**For Patrol Officer (new actor):**
| Use Case | Description |
|----------|-------------|
| **Log In (Patrol App)** | Patrol officers log in via the mobile app with patrol-specific dashboard |
| **Receive Dispatch Notification** | Receive push notifications for new dispatch assignments |
| **View Available Dispatches** | See all broadcast dispatches available for acceptance |
| **Accept Dispatch** | Accept a pending dispatch (first-come-first-served) |
| **Update Status (En Route / Arrived)** | Update dispatch status as they respond |
| **Verify Report (Valid / Invalid)** | On-site verification — mark report as valid (real incident) or invalid (fake/false) with notes |
| **Chat with Admin / Police** | Real-time messaging with admin and police station officers |
| **View Dispatch History** | View history of past dispatches and verifications |

**For Citizen:**
| Use Case | Description |
|----------|-------------|
| **Receive Verification Result** | Citizens are notified when their report is verified as valid or invalid by patrol officers |

#### Use Cases to MODIFY
| Current Use Case | Change | Reason |
|------------------|--------|--------|
| "Assign to Station" | Rename to **"Dispatch to Patrol"** | The flow changed from assigning to a specific station/officer to broadcasting to all patrol officers |
| "Real-time Chat" (under Local Officer) | Move to **both Admin and Patrol Officer** | Chat is now between patrol officers and admin/police, not just local officers |
| "Update Report Status" | Split into **"Update Dispatch Status"** (for patrol) and **"Manage Report Status"** (for admin) | Different roles update status differently |

#### Suggested Updated Flow
```
Citizen                          System                        Admin/Police                  Patrol Officer
  │                                │                               │                              │
  ├── File Crime Report ──────────►│                               │                              │
  │                                ├── Notify Admin ──────────────►│                              │
  │                                │                               ├── Review Report              │
  │                                │                               ├── Dispatch to Patrol ───────►│ (broadcast)
  │                                │                               │   (with notes)               │
  │                                │                               │                              ├── Receive Notification
  │                                │                               │                              ├── Accept Dispatch
  │                                │                               │◄── Status: Accepted ─────────┤
  │                                │                               │                              ├── Mark En Route
  │                                │                               │◄── Status: En Route ─────────┤
  │                                │                               │                              ├── Mark Arrived
  │                                │                               │◄── Status: Arrived ──────────┤
  │                                │                               │                              ├── Verify Report
  │                                │                               │◄── Valid/Invalid ────────────┤
  │◄── Report Verified ───────────│                               │                              │
  │                                │                               │                              │
  │                                │         Chat ◄───────────────►│◄─────────────────────────────►│
```

---

## Summary of Key System Changes Since Original Diagrams

1. **Database**: MySQL → **PostgreSQL**
2. **Dispatch Model**: Direct officer assignment → **Broadcast to all patrol officers** (first-come-first-served)
3. **New Role**: `patrol_officer` as a distinct user role with dedicated mobile dashboard
4. **Chat System**: New real-time messaging between patrol officers and admin/police
5. **Report Verification**: Patrol officers verify reports on-site as valid/invalid
6. **Response Time Tracking**: Full dispatch lifecycle timing (acceptance time, response time, completion time, 3-minute rule)
7. **Push Notifications**: Patrol officers receive dispatch notifications via Expo push
8. **No AFK Logout for Patrol**: Patrol officers are exempt from the 5-minute inactivity logout
9. **Backend Split**: Laravel handles admin panel; **Node.js/Express** handles all mobile API endpoints
10. **Hosting**: Deployed on **Render** (Node.js backend + Laravel admin + PostgreSQL)
