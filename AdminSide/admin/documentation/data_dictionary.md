# AlertDavao Database Data Dictionary

**Database:** alertdavao_w07v (PostgreSQL)  
**Generated:** 2025-12-18T05:01:02.948Z  
**Total Tables:** 32

---

## Table of Contents

- [admin_actions](#admin-actions) (0 rows)
- [barangays](#barangays) (233 rows)
- [crime_analytics](#crime-analytics) (0 rows)
- [crime_forecasts](#crime-forecasts) (0 rows)
- [failed_jobs](#failed-jobs) (0 rows)
- [flag_history](#flag-history) (0 rows)
- [locations](#locations) (18543 rows)
- [messages](#messages) (13 rows)
- [migrations](#migrations) (56 rows)
- [notification_reads](#notification-reads) (23 rows)
- [notifications](#notifications) (10 rows)
- [otp_codes](#otp-codes) (22 rows)
- [password_reset_tokens](#password-reset-tokens) (0 rows)
- [pending_users](#pending-users) (0 rows)
- [personal_access_tokens](#personal-access-tokens) (0 rows)
- [police_officers](#police-officers) (0 rows)
- [police_stations](#police-stations) (21 rows)
- [report_ip_tracking](#report-ip-tracking) (15 rows)
- [report_media](#report-media) (12 rows)
- [report_reassignment_requests](#report-reassignment-requests) (0 rows)
- [reports](#reports) (15 rows)
- [role_route](#role-route) (0 rows)
- [roles](#roles) (6 rows)
- [routes](#routes) (0 rows)
- [user_admin](#user-admin) (10 rows)
- [user_admin_roles](#user-admin-roles) (3 rows)
- [user_flags](#user-flags) (29 rows)
- [user_restrictions](#user-restrictions) (10 rows)
- [user_role](#user-role) (0 rows)
- [users_public](#users-public) (4 rows)
- [verifications](#verifications) (2 rows)
- [verified_phones](#verified-phones) (4 rows)

---

## admin_actions

**Row Count:** 0

| Column | Data Type | Nullable | Default |
|--------|-----------|----------|----------|
| action_id | bigint | No | nextval('admin_actions_acti... |
| admin_id | bigint | No | - |
| action_type | character varying(255) | No | - |
| description | text | No | - |
| date_performed | timestamp without time zone | Yes | - |
| created_at | timestamp with time zone | Yes | - |
| updated_at | timestamp with time zone | Yes | - |

## barangays

**Row Count:** 233

| Column | Data Type | Nullable | Default |
|--------|-----------|----------|----------|
| barangay_id | bigint | No | nextval('barangays_barangay... |
| barangay_name | character varying(100) | No | - |
| citymuncode | character varying(10) | Yes | - |
| station_id | bigint | No | - |
| latitude | double precision | Yes | - |
| longitude | double precision | Yes | - |
| boundary_polygon | text | Yes | - |
| osm_id | character varying(50) | Yes | - |
| ref | character varying(50) | Yes | - |
| created_at | timestamp with time zone | Yes | - |
| updated_at | timestamp with time zone | Yes | - |

## crime_analytics

**Row Count:** 0

| Column | Data Type | Nullable | Default |
|--------|-----------|----------|----------|
| analytics_id | bigint | No | nextval('crime_analytics_an... |
| location_id | bigint | No | - |
| year | integer | Yes | - |
| month | integer | Yes | - |
| total_reports | integer | No | - |
| crime_rate | double precision | No | - |
| last_updated | timestamp without time zone | Yes | - |
| created_at | timestamp with time zone | Yes | - |
| updated_at | timestamp with time zone | Yes | - |

## crime_forecasts

**Row Count:** 0

| Column | Data Type | Nullable | Default |
|--------|-----------|----------|----------|
| forecast_id | bigint | No | nextval('crime_forecasts_fo... |
| location_id | bigint | No | - |
| forecast_date | date | Yes | - |
| predicted_count | integer | No | - |
| model_used | character varying(255) | No | - |
| confidence_score | double precision | No | - |
| lower_ci | double precision | Yes | - |
| upper_ci | double precision | Yes | - |
| created_at | timestamp with time zone | Yes | - |
| updated_at | timestamp with time zone | Yes | - |

## failed_jobs

**Row Count:** 0

| Column | Data Type | Nullable | Default |
|--------|-----------|----------|----------|
| id | bigint | No | nextval('failed_jobs_id_seq... |
| uuid | character varying(255) | No | - |
| connection | text | No | - |
| queue | text | No | - |
| payload | text | No | - |
| exception | text | No | - |
| failed_at | timestamp with time zone | No | CURRENT_TIMESTAMP |

## flag_history

**Row Count:** 0

| Column | Data Type | Nullable | Default |
|--------|-----------|----------|----------|
| id | integer | No | - |
| flag_id | integer | No | - |
| action | USER-DEFINED | No | - |
| performed_by | integer | Yes | - |
| notes | text | Yes | - |
| created_at | timestamp without time zone | Yes | - |

## locations

**Row Count:** 18543

| Column | Data Type | Nullable | Default |
|--------|-----------|----------|----------|
| location_id | bigint | No | nextval('locations_location... |
| barangay | character varying(255) | No | - |
| reporters_address | text | Yes | - |
| latitude | double precision | No | - |
| longitude | double precision | No | - |
| station_id | bigint | Yes | - |
| created_at | timestamp with time zone | Yes | - |
| updated_at | timestamp with time zone | Yes | - |

## messages

**Row Count:** 13

| Column | Data Type | Nullable | Default |
|--------|-----------|----------|----------|
| message_id | bigint | No | nextval('messages_message_i... |
| sender_id | bigint | No | - |
| receiver_id | bigint | No | - |
| report_id | bigint | Yes | - |
| message | text | No | - |
| status | boolean | No | false |
| sent_at | timestamp without time zone | Yes | - |
| created_at | timestamp with time zone | Yes | - |
| updated_at | timestamp with time zone | Yes | - |

## migrations

**Row Count:** 56

| Column | Data Type | Nullable | Default |
|--------|-----------|----------|----------|
| id | bigint | No | nextval('migrations_id_seq'... |
| migration | character varying(255) | No | - |
| batch | integer | No | - |

## notification_reads

**Row Count:** 23

| Column | Data Type | Nullable | Default |
|--------|-----------|----------|----------|
| id | bigint | No | nextval('notification_reads... |
| user_id | bigint | No | - |
| notification_id | character varying(255) | No | - |
| read_at | timestamp with time zone | Yes | CURRENT_TIMESTAMP |

## notifications

**Row Count:** 10

| Column | Data Type | Nullable | Default |
|--------|-----------|----------|----------|
| id | bigint | No | nextval('notifications_id_s... |
| user_id | bigint | No | - |
| type | character varying(255) | No | - |
| message | text | No | - |
| data | json | Yes | - |
| read | boolean | Yes | false |
| created_at | timestamp with time zone | Yes | CURRENT_TIMESTAMP |
| updated_at | timestamp with time zone | Yes | CURRENT_TIMESTAMP |

## otp_codes

**Row Count:** 22

| Column | Data Type | Nullable | Default |
|--------|-----------|----------|----------|
| id | integer | No | nextval('otp_codes_id_seq':... |
| phone | character varying(64) | No | - |
| otp_hash | character varying(255) | No | - |
| purpose | character varying(64) | No | - |
| user_id | integer | Yes | - |
| expires_at | timestamp without time zone | Yes | - |
| created_at | timestamp without time zone | Yes | - |

## password_reset_tokens

**Row Count:** 0

| Column | Data Type | Nullable | Default |
|--------|-----------|----------|----------|
| email | character varying(255) | No | - |
| token | character varying(255) | No | - |
| created_at | timestamp with time zone | Yes | - |

## pending_users

**Row Count:** 0

| Column | Data Type | Nullable | Default |
|--------|-----------|----------|----------|
| id | bigint | No | nextval('pending_users_id_s... |
| created_at | timestamp with time zone | Yes | - |
| updated_at | timestamp with time zone | Yes | - |

## personal_access_tokens

**Row Count:** 0

| Column | Data Type | Nullable | Default |
|--------|-----------|----------|----------|
| id | bigint | No | nextval('personal_access_to... |
| tokenable_type | character varying(255) | No | - |
| tokenable_id | bigint | No | - |
| name | character varying(255) | No | - |
| token | character varying(64) | No | - |
| abilities | text | Yes | - |
| last_used_at | timestamp with time zone | Yes | - |
| expires_at | timestamp with time zone | Yes | - |
| created_at | timestamp with time zone | Yes | - |
| updated_at | timestamp with time zone | Yes | - |

## police_officers

**Row Count:** 0

| Column | Data Type | Nullable | Default |
|--------|-----------|----------|----------|
| officer_id | bigint | No | nextval('police_officers_of... |
| user_id | bigint | No | - |
| station_id | bigint | No | - |
| assigned_since | date | Yes | - |
| rank | character varying(255) | Yes | - |
| status | character varying(255) | No | 'active'::character varying |
| created_at | timestamp with time zone | Yes | - |
| updated_at | timestamp with time zone | Yes | - |

## police_stations

**Row Count:** 21

| Column | Data Type | Nullable | Default |
|--------|-----------|----------|----------|
| station_id | bigint | No | nextval('police_stations_st... |
| station_name | character varying(100) | No | - |
| address | character varying(255) | Yes | - |
| latitude | double precision | Yes | - |
| longitude | double precision | Yes | - |
| contact_number | character varying(50) | Yes | - |
| created_at | timestamp with time zone | Yes | CURRENT_TIMESTAMP |
| updated_at | timestamp with time zone | Yes | CURRENT_TIMESTAMP |

## report_ip_tracking

**Row Count:** 15

| Column | Data Type | Nullable | Default |
|--------|-----------|----------|----------|
| id | bigint | No | nextval('report_ip_tracking... |
| report_id | bigint | No | - |
| ip_address | character varying(45) | No | - |
| user_agent | text | Yes | - |
| submitted_at | timestamp with time zone | Yes | CURRENT_TIMESTAMP |

## report_media

**Row Count:** 12

| Column | Data Type | Nullable | Default |
|--------|-----------|----------|----------|
| media_id | bigint | No | nextval('report_media_media... |
| report_id | bigint | No | - |
| media_url | character varying(255) | No | - |
| media_type | character varying(255) | No | - |
| created_at | timestamp with time zone | Yes | - |
| updated_at | timestamp with time zone | Yes | - |

## report_reassignment_requests

**Row Count:** 0

| Column | Data Type | Nullable | Default |
|--------|-----------|----------|----------|
| request_id | bigint | No | nextval('report_reassignmen... |
| report_id | bigint | No | - |
| requested_by_user_id | bigint | No | - |
| current_station_id | bigint | Yes | - |
| requested_station_id | bigint | No | - |
| reason | character varying(500) | Yes | - |
| status | USER-DEFINED | No | 'pending'::report_reassignm... |
| reviewed_by_user_id | bigint | Yes | - |
| reviewed_at | timestamp with time zone | Yes | - |
| created_at | timestamp with time zone | Yes | - |
| updated_at | timestamp with time zone | Yes | - |

## reports

**Row Count:** 15

| Column | Data Type | Nullable | Default |
|--------|-----------|----------|----------|
| report_id | bigint | No | nextval('reports_report_id_... |
| user_id | bigint | No | - |
| location_id | bigint | No | - |
| assigned_station_id | bigint | Yes | - |
| station_id | bigint | Yes | - |
| title | character varying(255) | Yes | - |
| report_type | json | No | - |
| description | text | No | - |
| date_reported | timestamp without time zone | Yes | - |
| status | character varying(255) | No | 'pending'::character varying |
| is_valid | character varying(255) | No | 'checking_for_report_validi... |
| is_anonymous | boolean | No | false |
| created_at | timestamp with time zone | Yes | - |
| updated_at | timestamp with time zone | Yes | - |

## role_route

**Row Count:** 0

| Column | Data Type | Nullable | Default |
|--------|-----------|----------|----------|
| id | bigint | No | nextval('role_route_id_seq'... |
| role_id | bigint | No | - |
| route_id | bigint | No | - |
| created_at | timestamp with time zone | Yes | - |
| updated_at | timestamp with time zone | Yes | - |

## roles

**Row Count:** 6

| Column | Data Type | Nullable | Default |
|--------|-----------|----------|----------|
| role_id | bigint | No | nextval('roles_role_id_seq'... |
| role_name | character varying(255) | No | - |
| created_at | timestamp with time zone | Yes | - |
| updated_at | timestamp with time zone | Yes | - |

## routes

**Row Count:** 0

| Column | Data Type | Nullable | Default |
|--------|-----------|----------|----------|
| route_id | bigint | No | nextval('routes_route_id_se... |
| route_name | character varying(255) | No | - |
| created_at | timestamp with time zone | Yes | - |
| updated_at | timestamp with time zone | Yes | - |

## user_admin

**Row Count:** 10

| Column | Data Type | Nullable | Default |
|--------|-----------|----------|----------|
| id | bigint | No | nextval('user_admin_id_seq'... |
| firstname | character varying(50) | No | - |
| lastname | character varying(50) | No | - |
| contact | character varying(15) | No | - |
| email | character varying(100) | No | - |
| email_verified_at | timestamp with time zone | Yes | - |
| verification_token | character varying(100) | Yes | - |
| token_expires_at | timestamp with time zone | Yes | - |
| reset_token | character varying(100) | Yes | - |
| reset_token_expires_at | timestamp with time zone | Yes | - |
| password | character varying(255) | No | - |
| address | character varying(255) | Yes | - |
| latitude | double precision | Yes | - |
| longitude | double precision | Yes | - |
| station_id | bigint | Yes | - |
| is_verified | boolean | No | false |
| role | USER-DEFINED | No | 'user'::users_role |
| created_at | timestamp with time zone | No | CURRENT_TIMESTAMP |
| updated_at | timestamp with time zone | No | CURRENT_TIMESTAMP |
| total_flags | integer | Yes | 0 |
| false_report_count | integer | Yes | 0 |
| spam_count | integer | Yes | 0 |
| harassment_count | integer | Yes | 0 |
| inappropriate_content_count | integer | Yes | 0 |
| last_flag_date | timestamp without time zone | Yes | - |
| restriction_level | USER-DEFINED | Yes | 'none'::users_restriction_l... |
| trust_score | integer | Yes | 100 |
| remember_token | character varying(100) | Yes | - |
| failed_login_attempts | integer | No | 0 |
| lockout_until | timestamp with time zone | Yes | - |
| last_failed_login | timestamp with time zone | Yes | - |

## user_admin_roles

**Row Count:** 3

| Column | Data Type | Nullable | Default |
|--------|-----------|----------|----------|
| id | integer | No | nextval('user_admin_roles_i... |
| user_admin_id | bigint | No | - |
| role_id | bigint | No | - |
| created_at | timestamp without time zone | Yes | now() |
| updated_at | timestamp without time zone | Yes | now() |

## user_flags

**Row Count:** 29

| Column | Data Type | Nullable | Default |
|--------|-----------|----------|----------|
| id | integer | No | nextval('user_flags_id_seq'... |
| user_id | integer | No | - |
| flagged_by | integer | No | 1 |
| violation_type | USER-DEFINED | No | - |
| reason | text | Yes | - |
| severity | USER-DEFINED | Yes | 'minor'::user_flags_severity |
| description | text | Yes | - |
| evidence | json | Yes | - |
| reported_by | integer | Yes | - |
| related_report_id | integer | Yes | - |
| status | USER-DEFINED | Yes | 'pending'::user_flags_status |
| reviewed_by | integer | Yes | - |
| reviewed_at | timestamp without time zone | Yes | - |
| created_at | timestamp without time zone | Yes | - |
| updated_at | timestamp without time zone | Yes | - |
| duration_days | integer | Yes | - |
| expires_at | timestamp without time zone | Yes | - |

## user_restrictions

**Row Count:** 10

| Column | Data Type | Nullable | Default |
|--------|-----------|----------|----------|
| id | integer | No | nextval('user_restrictions_... |
| user_id | integer | No | - |
| restriction_type | USER-DEFINED | No | - |
| reason | text | Yes | - |
| restricted_by | bigint | Yes | - |
| expires_at | timestamp without time zone | Yes | - |
| can_report | boolean | Yes | true |
| can_comment | boolean | Yes | true |
| can_upload | boolean | Yes | true |
| can_message | boolean | Yes | true |
| is_active | boolean | Yes | true |
| created_by | integer | Yes | - |
| lifted_by | integer | Yes | - |
| lifted_at | timestamp without time zone | Yes | - |
| created_at | timestamp without time zone | Yes | - |
| updated_at | timestamp without time zone | Yes | - |

## user_role

**Row Count:** 0

| Column | Data Type | Nullable | Default |
|--------|-----------|----------|----------|
| id | bigint | No | nextval('user_role_id_seq':... |
| user_id | bigint | No | - |
| role_id | bigint | No | - |
| created_at | timestamp with time zone | Yes | - |
| updated_at | timestamp with time zone | Yes | - |

## users_public

**Row Count:** 4

| Column | Data Type | Nullable | Default |
|--------|-----------|----------|----------|
| id | bigint | No | nextval('users_public_id_se... |
| firstname | character varying(50) | No | - |
| lastname | character varying(50) | No | - |
| contact | character varying(15) | No | - |
| email | character varying(100) | No | - |
| email_verified_at | timestamp with time zone | Yes | - |
| verification_token | character varying(100) | Yes | - |
| token_expires_at | timestamp with time zone | Yes | - |
| reset_token | character varying(100) | Yes | - |
| reset_token_expires_at | timestamp with time zone | Yes | - |
| password | character varying(255) | No | - |
| address | character varying(255) | Yes | - |
| latitude | double precision | Yes | - |
| longitude | double precision | Yes | - |
| station_id | bigint | Yes | - |
| is_verified | boolean | No | false |
| role | USER-DEFINED | No | 'user'::users_role |
| created_at | timestamp with time zone | No | CURRENT_TIMESTAMP |
| updated_at | timestamp with time zone | No | CURRENT_TIMESTAMP |
| total_flags | integer | Yes | 0 |
| false_report_count | integer | Yes | 0 |
| spam_count | integer | Yes | 0 |
| harassment_count | integer | Yes | 0 |
| inappropriate_content_count | integer | Yes | 0 |
| last_flag_date | timestamp without time zone | Yes | - |
| restriction_level | USER-DEFINED | Yes | 'none'::users_restriction_l... |
| trust_score | integer | Yes | 100 |
| remember_token | character varying(100) | Yes | - |
| failed_login_attempts | integer | No | 0 |
| lockout_until | timestamp with time zone | Yes | - |
| last_failed_login | timestamp with time zone | Yes | - |

## verifications

**Row Count:** 2

| Column | Data Type | Nullable | Default |
|--------|-----------|----------|----------|
| verification_id | bigint | No | nextval('verifications_veri... |
| user_id | bigint | No | - |
| otp_code | character varying(255) | No | - |
| expiration | timestamp without time zone | Yes | - |
| status | character varying(255) | No | - |
| id_picture | character varying(255) | Yes | - |
| id_selfie | character varying(255) | Yes | - |
| billing_document | character varying(255) | Yes | - |
| is_verified | boolean | No | false |
| created_at | timestamp with time zone | Yes | - |
| updated_at | timestamp with time zone | Yes | - |

## verified_phones

**Row Count:** 4

| Column | Data Type | Nullable | Default |
|--------|-----------|----------|----------|
| id | integer | No | - |
| phone | character varying(64) | No | - |
| verified | boolean | Yes | true |
| verified_at | timestamp without time zone | Yes | - |

