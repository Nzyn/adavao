-- AlertDavao PostgreSQL Schema (Reference only)
-- Use this to create tables BEFORE importing CSVs

SET statement_timeout = 0;
SET lock_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SET check_function_bodies = false;
SET client_min_messages = warning;
SET row_security = off;

DROP TABLE IF EXISTS "admin_audit_log";
CREATE TABLE "admin_audit_log" (
  "id" BIGSERIAL PRIMARY KEY,
  "user_admin_id" bigint  DEFAULT NULL,
  "action" VARCHAR(255)  NOT NULL,
  "table_name" VARCHAR(100)  DEFAULT NULL,
  "record_id" bigint  DEFAULT NULL,
  "old_values" json DEFAULT NULL,
  "new_values" json DEFAULT NULL,
  "ip_address" VARCHAR(45)  DEFAULT NULL,
  "performed_at" timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP REFERENCES "user_admin" ("id") ON DELETE SET NULL
)    ;
DROP TABLE IF EXISTS "admin_login_attempts";
CREATE TABLE "admin_login_attempts" (
  "id" BIGSERIAL PRIMARY KEY,
  "user_admin_id" bigint  NOT NULL,
  "email" VARCHAR(100)  NOT NULL,
  "ip_address" VARCHAR(45)  DEFAULT NULL,
  "user_agent" text ,
  "status" VARCHAR(50)  DEFAULT 'failed',
  "attempted_at" timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP REFERENCES "user_admin" ("id") ON DELETE CASCADE
)     ;
DROP TABLE IF EXISTS "admin_permissions";
CREATE TABLE "admin_permissions" (
  "id" BIGSERIAL PRIMARY KEY,
  "permission_name" VARCHAR(100)   NOT NULL,
  "description" text  ,
  "category" VARCHAR(50)   DEFAULT NULL ,
  "created_at" timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
)     ;
DROP TABLE IF EXISTS "admin_role_permissions";
CREATE TABLE "admin_role_permissions" (
  "id" BIGSERIAL PRIMARY KEY,
  "role_id" bigint  NOT NULL,
  "permission_id" bigint  NOT NULL,
  "created_at" timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP REFERENCES "admin_permissions" ("id") ON DELETE CASCADE REFERENCES "admin_roles" ("id") ON DELETE CASCADE
)     ;
DROP TABLE IF EXISTS "admin_roles";
CREATE TABLE "admin_roles" (
  "id" BIGSERIAL PRIMARY KEY,
  "role_name" VARCHAR(100)   NOT NULL,
  "description" text  ,
  "level" int NOT NULL ,
  "created_at" timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
)     ;
DROP TABLE IF EXISTS "barangays";
CREATE TABLE "barangays" (
  "barangay_id" bigint  NOT NULL,
  "barangay_name" VARCHAR(100)  NOT NULL,
  "citymunCode" VARCHAR(10)  DEFAULT NULL ,
  "station_id" bigint  DEFAULT NULL,
  "latitude" double DEFAULT NULL,
  "longitude" double DEFAULT NULL,
  "boundary_polygon" text ,
  "osm_id" VARCHAR(50)  DEFAULT NULL,
  "ref" VARCHAR(50)  DEFAULT NULL,
  "created_at" timestamp NULL DEFAULT NULL,
  "updated_at" timestamp NULL DEFAULT NULL REFERENCES "police_stations" ("station_id") ON DELETE CASCADE
)    ;
DROP TABLE IF EXISTS "crime_analytics";
CREATE TABLE "crime_analytics" (
  "analytics_id" bigint  NOT NULL,
  "location_id" bigint  NOT NULL,
  "year" int DEFAULT NULL,
  "month" int DEFAULT NULL,
  "total_reports" int NOT NULL,
  "crime_rate" DOUBLE PRECISION NOT NULL,
  "last_updated" TIMESTAMP NOT NULL,
  "created_at" timestamp NULL DEFAULT NULL,
  "updated_at" timestamp NULL DEFAULT NULL REFERENCES "locations" ("location_id") ON DELETE CASCADE
)    ;
DROP TABLE IF EXISTS "crime_forecasts";
CREATE TABLE "crime_forecasts" (
  "forecast_id" bigint  NOT NULL,
  "location_id" bigint  NOT NULL,
  "forecast_date" date NOT NULL,
  "predicted_count" int NOT NULL,
  "model_used" VARCHAR(255)   NOT NULL,
  "confidence_score" DOUBLE PRECISION NOT NULL,
  "lower_ci" DOUBLE PRECISION DEFAULT NULL,
  "upper_ci" DOUBLE PRECISION DEFAULT NULL,
  "created_at" timestamp NULL DEFAULT NULL,
  "updated_at" timestamp NULL DEFAULT NULL REFERENCES "locations" ("location_id") ON DELETE CASCADE
)    ;
DROP TABLE IF EXISTS "locations";
CREATE TABLE "locations" (
  "location_id" bigint  NOT NULL,
  "barangay" VARCHAR(255)   NOT NULL,
  "reporters_address" text  ,
  "latitude" DOUBLE PRECISION NOT NULL,
  "longitude" DOUBLE PRECISION NOT NULL,
  "station_id" bigint  DEFAULT NULL,
  "created_at" timestamp NULL DEFAULT NULL,
  "updated_at" timestamp NULL DEFAULT NULL REFERENCES "police_stations" ("station_id") ON DELETE SET NULL
)    ;
DROP TABLE IF EXISTS "messages";
CREATE TABLE "messages" (
  "message_id" bigint  NOT NULL,
  "sender_id" bigint  NOT NULL,
  "receiver_id" bigint  NOT NULL,
  "report_id" bigint  DEFAULT NULL,
  "message" text   NOT NULL,
  "status" SMALLINT NOT NULL DEFAULT '0' ,
  "is_read" SMALLINT NOT NULL DEFAULT '0',
  "sent_at" TIMESTAMP NOT NULL,
  "created_at" timestamp NULL DEFAULT NULL,
  "updated_at" timestamp NULL DEFAULT NULL REFERENCES "reports" ("report_id") ON DELETE SET NULL
)    ;
DROP TABLE IF EXISTS "migrations";
CREATE TABLE "migrations" (
  "id" SERIAL PRIMARY KEY,
  "migration" VARCHAR(255)   NOT NULL,
  "batch" int NOT NULL
)    ;
DROP TABLE IF EXISTS "notification_reads";
CREATE TABLE "notification_reads" (
  "id" BIGSERIAL PRIMARY KEY,
  "user_id" bigint  NOT NULL,
  "notification_id" VARCHAR(100)  NOT NULL,
  "read_at" timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "created_at" timestamp NULL DEFAULT NULL,
  "updated_at" timestamp NULL DEFAULT NULL
)    ;
DROP TABLE IF EXISTS "notifications";
CREATE TABLE "notifications" (
  "id" BIGSERIAL PRIMARY KEY,
  "user_id" bigint  NOT NULL,
  "type" VARCHAR(255)   NOT NULL,
  "message" text   NOT NULL,
  "data" json DEFAULT NULL,
  "read" SMALLINT DEFAULT '0',
  "created_at" timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" timestamp NULL DEFAULT CURRENT_TIMESTAMP REFERENCES "users" ("id") ON DELETE CASCADE REFERENCES "users_public" ("id") ON DELETE CASCADE
)    ;
DROP TABLE IF EXISTS "otp_codes";
CREATE TABLE "otp_codes" (
  "id" SERIAL PRIMARY KEY,
  "phone" VARCHAR(64) NOT NULL,
  "otp_hash" VARCHAR(255) NOT NULL,
  "purpose" VARCHAR(64) NOT NULL,
  "user_id" int DEFAULT NULL,
  "expires_at" TIMESTAMP NOT NULL,
  "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
)    ;
DROP TABLE IF EXISTS "police_officers";
CREATE TABLE "police_officers" (
  "officer_id" bigint  NOT NULL,
  "user_id" bigint  NOT NULL ,
  "station_id" bigint  NOT NULL,
  "assigned_since" date NOT NULL ,
  "rank" VARCHAR(255)   DEFAULT NULL ,
  "status" VARCHAR(255)   NOT NULL DEFAULT 'active' ,
  "created_at" timestamp NULL DEFAULT NULL,
  "updated_at" timestamp NULL DEFAULT NULL REFERENCES "police_stations" ("station_id") ON DELETE CASCADE REFERENCES "users" ("id") ON DELETE CASCADE
)    ;
DROP TABLE IF EXISTS "police_stations";
CREATE TABLE "police_stations" (
  "station_id" bigint  NOT NULL,
  "station_name" VARCHAR(100)   NOT NULL,
  "address" VARCHAR(255)   DEFAULT NULL,
  "latitude" double DEFAULT NULL,
  "longitude" double DEFAULT NULL,
  "contact_number" VARCHAR(50)   DEFAULT NULL,
  "created_at" timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  "boundary_polygon" text 
)    ;
DROP TABLE IF EXISTS "report_ip_tracking";
CREATE TABLE "report_ip_tracking" (
  "id" BIGSERIAL PRIMARY KEY,
  "report_id" bigint  NOT NULL,
  "ip_address" VARCHAR(45) NOT NULL ,
  "user_agent" text ,
  "submitted_at" timestamp NULL DEFAULT CURRENT_TIMESTAMP  REFERENCES "reports" ("report_id") ON DELETE CASCADE
)     ;
DROP TABLE IF EXISTS "report_media";
CREATE TABLE "report_media" (
  "media_id" bigint  NOT NULL,
  "report_id" bigint  NOT NULL,
  "media_url" VARCHAR(255)   NOT NULL,
  "media_type" VARCHAR(255)   NOT NULL,
  "created_at" timestamp NULL DEFAULT NULL,
  "updated_at" timestamp NULL DEFAULT NULL REFERENCES "reports" ("report_id") ON DELETE CASCADE
)   ;
DROP TABLE IF EXISTS "report_reassignment_requests";
CREATE TABLE "report_reassignment_requests" (
  "request_id" bigint  NOT NULL,
  "report_id" bigint  NOT NULL,
  "requested_by_user_id" bigint  NOT NULL,
  "current_station_id" bigint  DEFAULT NULL,
  "requested_station_id" bigint  NOT NULL,
  "reason" VARCHAR(500)   DEFAULT NULL,
  "status" VARCHAR(50)   NOT NULL DEFAULT 'pending',
  "reviewed_by_user_id" bigint  DEFAULT NULL,
  "reviewed_at" timestamp NULL DEFAULT NULL,
  "created_at" timestamp NULL DEFAULT NULL,
  "updated_at" timestamp NULL DEFAULT NULL REFERENCES "police_stations" ("station_id") ON DELETE SET NULL REFERENCES "reports" ("report_id") ON DELETE CASCADE REFERENCES "users" ("id") ON DELETE CASCADE REFERENCES "police_stations" ("station_id") ON DELETE CASCADE REFERENCES "users" ("id") ON DELETE SET NULL
)   ;
DROP TABLE IF EXISTS "reports";
CREATE TABLE "reports" (
  "report_id" bigint  NOT NULL,
  "user_id" bigint  NOT NULL,
  "location_id" bigint  NOT NULL,
  "assigned_station_id" bigint  DEFAULT NULL ,
  "station_id" bigint  DEFAULT NULL ,
  "title" VARCHAR(255)   DEFAULT NULL ,
  "report_type" json NOT NULL,
  "description" text   NOT NULL,
  "date_reported" TIMESTAMP NOT NULL,
  "status" VARCHAR(255)   NOT NULL DEFAULT 'pending',
  "is_valid" VARCHAR(255)   NOT NULL DEFAULT 'checking_for_report_validity',
  "is_anonymous" SMALLINT NOT NULL DEFAULT '0' ,
  "created_at" timestamp NULL DEFAULT NULL,
  "updated_at" timestamp NULL DEFAULT NULL REFERENCES "police_stations" ("station_id") ON DELETE SET NULL REFERENCES "police_stations" ("station_id") ON DELETE SET NULL REFERENCES "locations" ("location_id") ON DELETE CASCADE REFERENCES "users_public" ("id") ON DELETE CASCADE
)    ;
DROP TABLE IF EXISTS "role_route";
CREATE TABLE "role_route" (
  "id" BIGSERIAL PRIMARY KEY,
  "role_id" bigint  NOT NULL,
  "route_id" bigint  NOT NULL,
  "created_at" timestamp NULL DEFAULT NULL,
  "updated_at" timestamp NULL DEFAULT NULL REFERENCES "roles" ("role_id") ON DELETE CASCADE REFERENCES "routes" ("route_id") ON DELETE CASCADE
)    ;
DROP TABLE IF EXISTS "roles";
CREATE TABLE "roles" (
  "role_id" bigint  NOT NULL,
  "role_name" VARCHAR(255)   NOT NULL ,
  "created_at" timestamp NULL DEFAULT NULL,
  "updated_at" timestamp NULL DEFAULT NULL
)    ;
DROP TABLE IF EXISTS "routes";
CREATE TABLE "routes" (
  "route_id" bigint  NOT NULL,
  "route_name" VARCHAR(255)   NOT NULL ,
  "created_at" timestamp NULL DEFAULT NULL,
  "updated_at" timestamp NULL DEFAULT NULL
)    ;
DROP TABLE IF EXISTS "user_admin";
CREATE TABLE "user_admin" (
  "id" BIGSERIAL PRIMARY KEY,
  "firstname" VARCHAR(50)   NOT NULL,
  "lastname" VARCHAR(50)   NOT NULL,
  "contact" VARCHAR(15)   NOT NULL,
  "email" VARCHAR(100)   NOT NULL,
  "email_verified_at" timestamp NULL DEFAULT NULL,
  "verification_token" VARCHAR(100)   DEFAULT NULL,
  "token_expires_at" timestamp NULL DEFAULT NULL,
  "reset_token" VARCHAR(100)   DEFAULT NULL,
  "reset_token_expires_at" timestamp NULL DEFAULT NULL,
  "password" VARCHAR(255)   NOT NULL,
  "address" VARCHAR(255)   DEFAULT NULL,
  "latitude" double DEFAULT NULL,
  "longitude" double DEFAULT NULL,
  "station_id" bigint  DEFAULT NULL,
  "is_verified" SMALLINT NOT NULL DEFAULT '0',
  "created_at" timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "total_flags" int DEFAULT '0',
  "false_report_count" int DEFAULT '0',
  "spam_count" int DEFAULT '0',
  "harassment_count" int DEFAULT '0',
  "inappropriate_content_count" int DEFAULT '0',
  "last_flag_date" TIMESTAMP DEFAULT NULL,
  "restriction_level" VARCHAR(50)   DEFAULT 'none',
  "trust_score" int DEFAULT '100',
  "remember_token" VARCHAR(100)   DEFAULT NULL,
  "failed_login_attempts" int NOT NULL DEFAULT '0',
  "lockout_until" timestamp NULL DEFAULT NULL,
  "last_failed_login" timestamp NULL DEFAULT NULL REFERENCES "police_stations" ("station_id") ON DELETE SET NULL
)     ;
DROP TABLE IF EXISTS "user_admin_roles";
CREATE TABLE "user_admin_roles" (
  "id" BIGSERIAL PRIMARY KEY,
  "user_admin_id" bigint  NOT NULL,
  "role_id" bigint  NOT NULL,
  "assigned_at" timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "assigned_by" bigint  DEFAULT NULL REFERENCES "user_admin" ("id") ON DELETE SET NULL REFERENCES "admin_roles" ("id") ON DELETE CASCADE REFERENCES "user_admin" ("id") ON DELETE CASCADE
)     ;
DROP TABLE IF EXISTS "user_flags";
CREATE TABLE "user_flags" (
  "id" SERIAL PRIMARY KEY,
  "user_id" int NOT NULL,
  "flagged_by" int NOT NULL DEFAULT '1' ,
  "violation_type" VARCHAR(50)   NOT NULL,
  "reason" text   ,
  "severity" VARCHAR(50)   DEFAULT 'minor',
  "description" text  ,
  "evidence" json DEFAULT NULL,
  "reported_by" int DEFAULT NULL,
  "related_report_id" int DEFAULT NULL,
  "status" VARCHAR(50)   DEFAULT 'pending',
  "duration_days" int DEFAULT NULL,
  "expires_at" TIMESTAMP DEFAULT NULL,
  "reviewed_by" bigint  DEFAULT NULL,
  "reviewed_at" TIMESTAMP DEFAULT NULL,
  "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP REFERENCES "user_admin" ("id") ON DELETE SET NULL
)    ;
DROP TABLE IF EXISTS "user_login_attempts";
CREATE TABLE "user_login_attempts" (
  "id" BIGSERIAL PRIMARY KEY,
  "user_id" bigint  NOT NULL,
  "email" VARCHAR(100)  NOT NULL,
  "ip_address" VARCHAR(45)  DEFAULT NULL,
  "user_agent" text ,
  "status" VARCHAR(50)  DEFAULT 'failed',
  "attempted_at" timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP REFERENCES "users_public" ("id") ON DELETE CASCADE
)    ;
DROP TABLE IF EXISTS "user_restrictions";
CREATE TABLE "user_restrictions" (
  "id" SERIAL PRIMARY KEY,
  "user_id" int NOT NULL,
  "restriction_type" VARCHAR(50)   NOT NULL,
  "reason" text  ,
  "restricted_by" bigint  DEFAULT NULL,
  "expires_at" TIMESTAMP DEFAULT NULL,
  "can_report" SMALLINT DEFAULT '1',
  "can_comment" SMALLINT DEFAULT '1',
  "can_upload" SMALLINT DEFAULT '1',
  "can_message" SMALLINT DEFAULT '1',
  "is_active" SMALLINT DEFAULT '1',
  "created_by" int DEFAULT NULL,
  "lifted_by" int DEFAULT NULL,
  "lifted_at" TIMESTAMP DEFAULT NULL,
  "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP REFERENCES "users" ("id") ON DELETE SET NULL REFERENCES "user_public" ("id") ON DELETE CASCADE
)    ;
DROP TABLE IF EXISTS "user_role";
CREATE TABLE "user_role" (
  "id" BIGSERIAL PRIMARY KEY,
  "user_id" bigint  NOT NULL,
  "role_id" bigint  NOT NULL,
  "created_at" timestamp NULL DEFAULT NULL,
  "updated_at" timestamp NULL DEFAULT NULL REFERENCES "roles" ("role_id") ON DELETE CASCADE REFERENCES "users" ("id") ON DELETE CASCADE
)    ;
DROP TABLE IF EXISTS "users_public";
CREATE TABLE "users_public" (
  "id" BIGSERIAL PRIMARY KEY,
  "firstname" VARCHAR(50)   NOT NULL,
  "lastname" VARCHAR(50)   NOT NULL,
  "contact" VARCHAR(15)   NOT NULL,
  "email" VARCHAR(100)   NOT NULL,
  "email_verified_at" timestamp NULL DEFAULT NULL,
  "verification_token" VARCHAR(100)   DEFAULT NULL,
  "token_expires_at" timestamp NULL DEFAULT NULL,
  "reset_token" VARCHAR(100)   DEFAULT NULL,
  "reset_token_expires_at" timestamp NULL DEFAULT NULL,
  "password" VARCHAR(255)   NOT NULL,
  "address" VARCHAR(255)   DEFAULT NULL,
  "latitude" double DEFAULT NULL,
  "longitude" double DEFAULT NULL,
  "station_id" bigint  DEFAULT NULL,
  "role" VARCHAR(255)  NOT NULL DEFAULT 'user',
  "is_verified" SMALLINT NOT NULL DEFAULT '0',
  "created_at" timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "total_flags" int DEFAULT '0',
  "false_report_count" int DEFAULT '0',
  "spam_count" int DEFAULT '0',
  "harassment_count" int DEFAULT '0',
  "inappropriate_content_count" int DEFAULT '0',
  "last_flag_date" TIMESTAMP DEFAULT NULL,
  "restriction_level" VARCHAR(50)   DEFAULT 'none',
  "trust_score" int DEFAULT '100',
  "remember_token" VARCHAR(100)   DEFAULT NULL,
  "failed_login_attempts" int NOT NULL DEFAULT '0',
  "lockout_until" timestamp NULL DEFAULT NULL,
  "last_failed_login" timestamp NULL DEFAULT NULL REFERENCES "police_stations" ("station_id") ON DELETE SET NULL
)     ;
DROP TABLE IF EXISTS "verifications";
CREATE TABLE "verifications" (
  "verification_id" bigint  NOT NULL,
  "user_id" bigint  NOT NULL,
  "otp_code" VARCHAR(255)   NOT NULL,
  "expiration" TIMESTAMP NOT NULL,
  "status" VARCHAR(255)   NOT NULL,
  "id_picture" VARCHAR(255)   DEFAULT NULL ,
  "id_selfie" VARCHAR(255)   DEFAULT NULL ,
  "billing_document" VARCHAR(255)   DEFAULT NULL ,
  "is_verified" SMALLINT NOT NULL DEFAULT '0' ,
  "created_at" timestamp NULL DEFAULT NULL,
  "updated_at" timestamp NULL DEFAULT NULL REFERENCES "users_public" ("id") ON DELETE CASCADE
)    ;
DROP TABLE IF EXISTS "verified_phones";
CREATE TABLE "verified_phones" (
  "id" SERIAL PRIMARY KEY,
  "phone" VARCHAR(64) NOT NULL,
  "verified" SMALLINT DEFAULT '1',
  "verified_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
)    ;