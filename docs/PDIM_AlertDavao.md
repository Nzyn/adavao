# AlertDavao Personal Data Inventory Map (PDIM)

## Overview
This document maps the personal data lifecycle within the AlertDavao Crime Reporting System, ensuring compliance with data protection regulations.

---

## 1. User Registration

| Attribute | Details |
|-----------|---------|
| **Process** | User Registration |
| **Data Subject** | AlertDavao Mobile App Users (Citizens) |
| **Personal Data Types** | • Full Name *<br>• Email Address *<br>• Phone Number *<br>• Password (hashed) *<br>• Barangay/Address |
| **Consent Collection** | Registration form with checkbox accepting Terms & Privacy Policy |
| **Data Classification** | Confidential |
| **Collection Purpose** | User account creation for crime reporting and verification |
| **Data Custodian** | System Administrator |
| **Collection Source** | Mobile App Registration Form |
| **Collection Medium** | Electronic (REST API) |
| **Electronic Storage** | PostgreSQL Database (Render Cloud) |
| **Third Party Storage** | Render.com (Cloud hosting) |
| **Users of Data** | System Admin for user management |
| **Transfer/Disclosure** | None - kept within system |
| **Retention Period** | Account lifetime + 1 year after deletion request |
| **Retention Reason** | Audit trail for report submissions |
| **Disposal Method** | Anonymization of user records in database |

---

## 2. User Verification (Identity Verification)

| Attribute | Details |
|-----------|---------|
| **Process** | User Identity Verification |
| **Data Subject** | AlertDavao Registered Users requesting verification |
| **Personal Data Types** | • Government ID Picture (encrypted at rest) *<br>• Selfie with ID (encrypted at rest) *<br>• Billing Document/Proof of Address (encrypted at rest) |
| **Consent Collection** | Verification submission form with consent checkbox |
| **Data Classification** | Highly Confidential (Sensitive PII) |
| **Collection Purpose** | Verify user identity to grant verified status for credible reporting |
| **Data Custodian** | System Administrator |
| **Collection Source** | Mobile App - Verification Upload Form |
| **Collection Medium** | Electronic (Encrypted file upload via API) |
| **Electronic Storage** | Node.js Backend `/verifications/` directory (AES-256-CBC encrypted) |
| **Third Party Storage** | Render.com (Cloud hosting - Singapore region) |
| **Users of Data** | Admin: Review and approve/reject verification<br>Police: View for identity confirmation |
| **Access Control** | Role-based access (Admin, Police only) |
| **Transfer/Disclosure** | None - kept within system, accessed only by authorized personnel |
| **Retention Period** | Until verification status is achieved + 30 days, then securely deleted |
| **Retention Reason** | Evidence for verification decision audit trail |
| **Disposal Method** | Secure electronic deletion of encrypted files |

---

## 3. Crime Report Submission

| Attribute | Details |
|-----------|---------|
| **Process** | Crime Report Submission |
| **Data Subject** | AlertDavao Users (Reporters - can be anonymous) |
| **Personal Data Types** | • Reporter identity (if not anonymous)<br>• GPS Location (encrypted) *<br>• Report description (encrypted) *<br>• Evidence photos/videos (encrypted at rest) *<br>• Crime type, date, time *<br>• Barangay location * |
| **Consent Collection** | Report submission form with Privacy Policy acknowledgment |
| **Data Classification** | Highly Confidential (Crime Evidence) |
| **Collection Purpose** | Crime documentation, evidence collection, police response coordination |
| **Data Custodian** | System Administrator / Assigned Police Station |
| **Collection Source** | Mobile App - Report Form |
| **Collection Medium** | Electronic (Encrypted data via REST API) |
| **Electronic Storage** | PostgreSQL Database (encrypted fields: AES-256-CBC)<br>Evidence files: `/evidence/` directory (encrypted) |
| **Third Party Storage** | Render.com (Cloud hosting) |
| **Users of Data** | Admin: Monitor all reports<br>Police: View assigned station reports<br>User: View own reports |
| **Access Control** | Role-based: Encrypted data only decrypted for authorized users |
| **Transfer/Disclosure Within Region** | Police stations (assigned based on barangay location) |
| **Transfer/Disclosure External** | None |
| **Retention Period** | 5 years from report submission |
| **Retention Reason** | Legal evidence retention, investigation support, crime analytics |
| **Disposal Method** | Anonymization of reporter data; evidence archived then securely deleted |

---

## 4. Anonymous Reporting

| Attribute | Details |
|-----------|---------|
| **Process** | Anonymous Crime Report Submission |
| **Data Subject** | Anonymous tipsters (no PII collected) |
| **Personal Data Types** | • GPS Location (encrypted) *<br>• Report description (encrypted) *<br>• Evidence photos/videos (encrypted at rest)<br>• Crime type, date, time * |
| **Consent Collection** | Anonymous submission acknowledgment |
| **Data Classification** | Confidential (No PII linkage) |
| **Collection Purpose** | Crime documentation without reporter identification |
| **Data Custodian** | System Administrator |
| **Collection Source** | Mobile App - Anonymous Report Form |
| **Collection Medium** | Electronic (Encrypted, no user ID linked) |
| **Electronic Storage** | PostgreSQL Database (user_id = null or anonymous marker) |
| **Users of Data** | Admin and Police only |
| **Transfer/Disclosure** | None |
| **Retention Period** | 5 years from report submission |
| **Retention Reason** | Crime pattern analysis, investigation support |
| **Disposal Method** | Permanent deletion of report and evidence |

---

## 5. In-App Messaging

| Attribute | Details |
|-----------|---------|
| **Process** | User-to-Admin/Police Communication |
| **Data Subject** | AlertDavao Users, Admin, Police Officers |
| **Personal Data Types** | • Sender/Receiver User IDs<br>• Message content<br>• Timestamps<br>• Read receipts |
| **Consent Collection** | Implicit consent through app usage and Terms of Service |
| **Data Classification** | Confidential |
| **Collection Purpose** | Communication regarding crime reports, verification status, updates |
| **Data Custodian** | System Administrator |
| **Collection Source** | Mobile App - Chat Feature |
| **Collection Medium** | Electronic (REST API) |
| **Electronic Storage** | PostgreSQL Database `messages` table |
| **Users of Data** | Sender and Receiver only |
| **Transfer/Disclosure** | None - P2P within system |
| **Retention Period** | 1 year from message date |
| **Retention Reason** | Communication audit trail |
| **Disposal Method** | Electronic deletion from database |

---

## 6. Admin/Police User Management

| Attribute | Details |
|-----------|---------|
| **Process** | AdminSide User Management |
| **Data Subject** | Admin Users, Police Officers |
| **Personal Data Types** | • Full Name *<br>• Email Address *<br>• Phone Number *<br>• Role/Permissions *<br>• Assigned Police Station (for police)<br>• OTP verification data |
| **Consent Collection** | Employment/appointment agreement |
| **Data Classification** | Confidential |
| **Collection Purpose** | System access management, role-based permissions |
| **Data Custodian** | Super Administrator |
| **Collection Source** | AdminSide Registration/User Management |
| **Collection Medium** | Electronic (Laravel Admin Panel) |
| **Electronic Storage** | PostgreSQL Database `user_admin` table |
| **Third Party Storage** | Render.com (Cloud hosting) |
| **Users of Data** | Super Admin for user management |
| **Transfer/Disclosure** | None |
| **Retention Period** | Employment duration + 2 years |
| **Retention Reason** | Access audit trail |
| **Disposal Method** | Account deactivation, then deletion after retention period |

---

## 7. Crime Analytics & Statistics

| Attribute | Details |
|-----------|---------|
| **Process** | Crime Data Analytics |
| **Data Subject** | Aggregated/Anonymized crime data (no PII) |
| **Personal Data Types** | • Crime types (aggregated counts)<br>• Barangay locations (aggregated)<br>• Time periods (aggregated)<br>• Trend analysis data |
| **Consent Collection** | N/A - Anonymized data |
| **Data Classification** | Internal Use |
| **Collection Purpose** | Crime pattern analysis, resource allocation, SARIMA forecasting |
| **Data Custodian** | System Administrator |
| **Collection Source** | Aggregation of submitted reports |
| **Collection Medium** | Automated data processing |
| **Electronic Storage** | CSV files, PostgreSQL aggregate tables, Redis cache |
| **Users of Data** | Admin: Dashboard analytics<br>Public: Anonymized crime heatmaps |
| **Transfer/Disclosure** | None (aggregated data only) |
| **Retention Period** | Indefinite (anonymized historical data) |
| **Retention Reason** | Crime trend analysis, forecasting accuracy |
| **Disposal Method** | N/A - Data is anonymized |

---

## 8. Email Verification & Notifications

| Attribute | Details |
|-----------|---------|
| **Process** | Email Communications |
| **Data Subject** | AlertDavao Registered Users |
| **Personal Data Types** | • Email Address *<br>• Full Name<br>• Verification tokens (temporary) |
| **Consent Collection** | Registration consent |
| **Data Classification** | Confidential |
| **Collection Purpose** | Account verification, password reset, security alerts |
| **Data Custodian** | System Administrator |
| **Collection Source** | User registration data |
| **Collection Medium** | Electronic (SendGrid API) |
| **Electronic Storage** | Temporary tokens in database (expire in 24 hours) |
| **Third Party Storage** | SendGrid (Email service provider) |
| **Users of Data** | Automated system only |
| **Transfer/Disclosure** | SendGrid (for email delivery only) |
| **Transfer Mode** | API (HTTPS encrypted) |
| **Retention Period** | Tokens: 24 hours<br>Email logs: 30 days |
| **Retention Reason** | Verification process, delivery confirmation |
| **Disposal Method** | Automatic expiration and deletion |

---

## 9. Google Sign-In Authentication

| Attribute | Details |
|-----------|---------|
| **Process** | OAuth 2.0 Authentication |
| **Data Subject** | Users signing in via Google |
| **Personal Data Types** | • Google Account Email *<br>• Google Display Name<br>• Google Profile Photo URL<br>• OAuth tokens (temporary) |
| **Consent Collection** | Google OAuth consent screen |
| **Data Classification** | Confidential |
| **Collection Purpose** | Simplified user authentication |
| **Data Custodian** | System Administrator |
| **Collection Source** | Google OAuth 2.0 API |
| **Collection Medium** | Electronic (OAuth flow) |
| **Electronic Storage** | User profile in PostgreSQL |
| **Third Party Storage** | Google (authentication only) |
| **Users of Data** | Automated system for authentication |
| **Transfer/Disclosure** | Google (limited to authentication) |
| **Retention Period** | Account lifetime |
| **Retention Reason** | Authentication continuity |
| **Disposal Method** | Account deletion removes OAuth link |

---

## 10. System Logs & Audit Trail

| Attribute | Details |
|-----------|---------|
| **Process** | System Activity Logging |
| **Data Subject** | All system users |
| **Personal Data Types** | • User IDs<br>• IP addresses<br>• Action timestamps<br>• Request/Response logs |
| **Consent Collection** | Terms of Service acceptance |
| **Data Classification** | Internal Use |
| **Collection Purpose** | Security monitoring, debugging, compliance |
| **Data Custodian** | System Administrator |
| **Collection Source** | Automated system logging |
| **Collection Medium** | Electronic (Server logs) |
| **Electronic Storage** | Render log storage, Application logs |
| **Users of Data** | System Administrator only |
| **Transfer/Disclosure** | None |
| **Retention Period** | 90 days |
| **Retention Reason** | Incident investigation, performance analysis |
| **Disposal Method** | Automatic log rotation and deletion |

---

## Data Security Measures

| Measure | Implementation |
|---------|----------------|
| **Encryption at Rest** | AES-256-CBC for sensitive fields and files |
| **Encryption in Transit** | HTTPS/TLS for all API communications |
| **Access Control** | Role-based access (User, Police, Admin) |
| **Authentication** | JWT tokens, OTP verification, Google OAuth |
| **Password Security** | bcrypt hashing with salt |
| **Session Management** | Token expiration, refresh token rotation |
| **Audit Logging** | All access to sensitive data logged |

---

## Data Subject Rights

| Right | Implementation |
|-------|----------------|
| **Right to Access** | Users can view their profile and reports via app |
| **Right to Rectification** | Users can update profile information |
| **Right to Erasure** | Account deletion request through app settings |
| **Right to Data Portability** | Export own data feature (future enhancement) |
| **Right to Withdraw Consent** | Account deletion removes all associated data |

---

*Document Version: 1.0*  
*Last Updated: December 2024*  
*Data Protection Officer: System Administrator*
