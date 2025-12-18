# System Testing Documentation - AlertDavao

This document outlines the testing scenarios to ensure that **AlertDavao** functions accurately, securely, and effectively for both the general public and law enforcement personnel.

## 2.9.5 System Functionality & Data Visualization Testing

| # | Test Scenario | Steps | Expected Result | Status |
|---|---------------|-------|-----------------|--------|
| 1 | **Role-Based Dashboard Visibility** | Log in as a specific Police Station officer; check dashboard stats. | Dashboard only displays reports assigned to the officer's specific station. | passed |
| 2 | **Super Admin Oversight** | Log in as Super Admin (`alertdavao.ph@gmail.com`); check dashboard. | Super Admin sees aggregated statistics for all stations and unassigned reports. | passed |
| 3 | **Verification Workflow** | Submit an ID for verification; navigate to Admin Verification page. | Admin can view the submitted document, then approve or reject the user status. | passed |
| 4 | **Report Validity Tracking** | Submit a report; mark it as "Valid" and "Investigating." | Report status updates across both AdminSide and UserSide in real-time. | passed |
| 5 | **Crime Map Display** | Open the Live Map; zoom into a dense area of reports. | Each crime report is displayed as an individual marker with its crime type icon. | passed |
| 6 | **Data Decryption Security** | View report details as a guest/unauthorized user vs. logged-in officer. | Sensitive info (names, descriptions) is encrypted for unauthorized users but decrypted for officers. | passed |
| 7 | **User Flagging Enforcement** | Flag a user for false reports; check their account status. | User receives a notification and their restriction level is updated automatically. | passed |
| 8 | **Analytics Forecast Accuracy** | View the Statistics page and check the SARIMA model forecasts. | System generates a crime trend forecast based on historical 5-year data. | passed |

