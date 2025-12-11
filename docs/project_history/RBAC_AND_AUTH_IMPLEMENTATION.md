# RBAC and Authentication Separation Implementation

## Overview

The authentication system has been completely separated to provide enhanced security and isolation between UserSide app users and AdminSide admin/police users.

### Key Changes:
- **Two separate user tables**: `users_public` (app users) and `user_admin` (admin/police users)
- **RBAC system** for admin/police with roles and permissions
- **Authentication isolation**: Each side can only authenticate with their own table
- **Audit logging** for all admin actions
- **Enhanced login tracking** for security monitoring

---

## Database Schema

### New Tables Created

#### 1. `users_public` - App Users (UserSide)
```sql
- Users who register via the UserSide app
- Cannot access AdminSide
- Cannot log in to admin panel
```

#### 2. `user_admin` - Admin/Police Users (AdminSide)
```sql
- Police officers and administrators
- Can only access AdminSide
- Cannot log in to the UserSide app
- Has assigned roles for RBAC
```

#### 3. `admin_roles` - Roles for RBAC
```sql
Seeded with:
- police_officer (Level 1): View and manage reports
- station_admin (Level 2): Manage officers and reports
- super_admin (Level 3): Full system access
```

#### 4. `admin_permissions` - Permissions
```sql
Seeded with:
- view_reports
- create_report
- update_report
- delete_report
- assign_report
- manage_users
- view_analytics
- manage_officers
- system_settings
- view_audit_log
```

#### 5. `user_admin_roles` - User Role Assignment (Pivot)
```sql
Links user_admin to admin_roles for RBAC
Tracks who assigned the role and when
```

#### 6. `admin_role_permissions` - Role Permission Mapping (Pivot)
```sql
Defines which permissions each role has
```

#### 7. `admin_login_attempts` - Login Security Tracking
```sql
Tracks all login attempts (success/failed/locked)
IP address and user agent stored for security analysis
```

#### 8. `admin_audit_log` - Audit Trail
```sql
Records all admin actions:
- What action was performed
- On which table and record
- Old and new values (JSON)
- IP address and timestamp
```

---

## Backend Code Changes

### 1. New Models Created

#### `UserAdmin` (app/Models/UserAdmin.php)
The main authentication model for AdminSide users.

**Key Methods:**
```php
// RBAC Methods
$user->adminRoles()              // Get assigned roles
$user->permissions()              // Get all permissions through roles
$user->hasPermission('view_reports')  // Check specific permission
$user->hasRole('police_officer')      // Check if user has role
$user->isSuperAdmin()             // Is super admin?
$user->isStationAdmin()           // Is station admin?
$user->isPoliceOfficer()          // Is police officer?

// Relations
$user->policeStation()            // Get assigned station
$user->officer()                  // Get officer profile
$user->auditLogs()                // Get audit trail
$user->loginAttempts()            // Get login attempts
```

#### `AdminRole` (app/Models/AdminRole.php)
Manages roles for RBAC.

**Key Methods:**
```php
$role->users()                    // Get users with this role
$role->permissions()              // Get role permissions
$role->hasPermission('view_reports')  // Check if role has permission
```

#### `AdminPermission` (app/Models/AdminPermission.php)
Manages permissions.

**Relations:**
```php
$permission->roles()              // Get roles with this permission
```

#### `UserAdminRole` (app/Models/UserAdminRole.php)
Manages role assignments with audit trail.

#### `AdminLoginAttempt` (app/Models/AdminLoginAttempt.php)
Tracks login attempts for security.

#### `AdminAuditLog` (app/Models/AdminAuditLog.php)
Tracks all admin actions.

### 2. Updated AuthController

**Location:** `AdminSide/admin/app/Http/Controllers/AuthController.php`

**Changes:**
- Now uses `UserAdmin` model instead of `User`
- All database queries use `user_admin` table
- Uses 'admin' guard for authentication
- Tracks login attempts in `admin_login_attempts` table
- Validates that users can only access AdminSide

**Key Methods:**
```php
register()            // Register admin/police users
login()              // Login with admin guard
logout()             // Logout admin user
showForgotPassword() // Show forgot password form
sendResetLink()      // Send password reset email
resetPassword()      // Reset password for admin user
verifyEmail()        // Email verification
resendVerification() // Resend verification email
```

### 3. Updated auth.php Configuration

**Location:** `AdminSide/admin/config/auth.php`

**Changes:**
```php
'defaults' => [
    'guard' => 'admin',           // Default guard changed
    'passwords' => 'admin',       // Default password reset changed
],

'guards' => [
    'admin' => [                  // New admin guard
        'driver' => 'session',
        'provider' => 'admin',
    ],
],

'providers' => [
    'admin' => [                  // New admin provider
        'driver' => 'eloquent',
        'model' => App\Models\UserAdmin::class,
    ],
],

'passwords' => [
    'admin' => [                  // New admin password reset
        'provider' => 'admin',
        'table' => 'password_reset_tokens',
        'expire' => 60,
        'throttle' => 60,
    ],
],
```

---

## Authentication Flow

### AdminSide Login Flow
```
1. User enters credentials on login form
2. AuthController checks user_admin table ONLY
3. If user not found → Error (prevents UserSide users from accessing AdminSide)
4. If account locked → Show lockout message
5. If email not verified → Block login
6. If password incorrect → Increment attempts, apply lockout if needed
7. If password correct → Log in with 'admin' guard
8. Record successful login in admin_login_attempts
9. Redirect to dashboard
```

### Security Isolation
```
UserSide App:
- Can ONLY authenticate against users_public table
- Cannot authenticate with user_admin credentials

AdminSide Panel:
- Can ONLY authenticate against user_admin table
- Cannot authenticate with users_public credentials
- UserSide users are rejected at login
```

---

## RBAC Implementation

### Role Hierarchy
```
Level 1: Police Officer
  - view_reports
  - create_report
  - update_report
  - assign_report

Level 2: Station Admin
  - All Level 1 permissions
  - manage_officers
  - manage_users
  - view_analytics
  - view_audit_log

Level 3: Super Admin
  - All permissions including system_settings
```

### Checking Permissions in Code

**In Controllers:**
```php
// Check if user has permission
if (!Auth::guard('admin')->user()->hasPermission('manage_users')) {
    abort(403, 'Unauthorized');
}

// Check if user has role
if (!Auth::guard('admin')->user()->isSuperAdmin()) {
    abort(403, 'Super admin access required');
}
```

**In Views (Blade):**
```blade
@can('manage_users')
    <!-- Show user management controls -->
@endcan

@if(Auth::guard('admin')->user()->hasPermission('view_audit_log'))
    <!-- Show audit log link -->
@endif
```

**Using Policy (if needed):**
```php
if ($this->authorize('updateReport', $report)) {
    // Proceed
}
```

---

## Login Attempt Tracking

### Features
- Records all login attempts (success/failed/locked)
- Stores IP address and user agent
- Tracks login history per user
- Enables security auditing

### Query Examples
```php
// Get all failed login attempts for a user
$user->loginAttempts()->where('status', 'failed')->get();

// Get successful logins in last 7 days
$user->successfulLogins()
    ->where('attempted_at', '>=', Carbon::now()->subDays(7))
    ->get();

// Find suspicious login activity (multiple IPs)
AdminLoginAttempt::where('email', 'user@example.com')
    ->where('status', 'success')
    ->distinct()
    ->pluck('ip_address');
```

---

## Audit Logging

### Usage in Controllers
```php
// Log admin action
AdminAuditLog::create([
    'user_admin_id' => Auth::guard('admin')->id(),
    'action' => 'update_report',
    'table_name' => 'reports',
    'record_id' => $report->id,
    'old_values' => $oldValues,
    'new_values' => $newValues,
    'ip_address' => request()->ip(),
]);
```

### Query Examples
```php
// Get all actions by a specific admin
$user->auditLogs()->get();

// Get all modifications to a specific report
AdminAuditLog::where('table_name', 'reports')
    ->where('record_id', 1)
    ->orderBy('performed_at', 'desc')
    ->get();

// Track who deleted what
AdminAuditLog::where('action', 'delete')->get();
```

---

## Middleware Integration

### Creating RBAC Middleware

**Location:** `AdminSide/admin/app/Http/Middleware/CheckAdminPermission.php`

```php
<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;

class CheckAdminPermission
{
    public function handle(Request $request, Closure $next, $permission)
    {
        if (!Auth::guard('admin')->check()) {
            return redirect()->route('login');
        }

        if (!Auth::guard('admin')->user()->hasPermission($permission)) {
            abort(403, 'You do not have permission to perform this action');
        }

        return $next($request);
    }
}
```

**Register in Kernel.php:**
```php
protected $routeMiddleware = [
    // ...
    'admin.permission' => \App\Http\Middleware\CheckAdminPermission::class,
];
```

**Usage in Routes:**
```php
Route::middleware('admin.permission:manage_users')->group(function () {
    Route::get('/users', [UserController::class, 'index']);
    Route::post('/users', [UserController::class, 'store']);
});
```

---

## Migration Data

### Data Migration Results
- **Existing admin users** → Assigned `super_admin` role
- **Existing police users** → Assigned `police_officer` role
- **Existing app users** → Moved to `users_public` table
- **All user data** → Fully preserved during migration

---

## Important Notes

### For Developers

1. **Always use the correct guard:**
   - AdminSide: `Auth::guard('admin')`
   - UserSide: `Auth::guard('web')` or `Auth::user()`

2. **When checking user type:**
   ```php
   // AdminSide check
   if (!Auth::guard('admin')->check()) {
       // User not logged in to AdminSide
   }

   // Check if police officer
   if (Auth::guard('admin')->user()->isPoliceOfficer()) {
       // Do something
   }
   ```

3. **Foreign key relationships updated:**
   - `admin_actions.admin_id` → points to `user_admin.id`
   - `police_officers.user_id` → points to `user_admin.id`
   - `reports.user_id` → points to `users_public.id`
   - `verifications.user_id` → points to `users_public.id`

4. **Queries must reference correct table:**
   ```php
   // For admin/police
   $user = UserAdmin::where('email', $email)->first();

   // For app users
   $user = User::where('email', $email)->first();
   ```

### For Database

1. **Old users table still exists** as backup
   - After full testing, can be safely deleted
   - Or renamed to `users_old` for archival

2. **No data loss** - All user data preserved

3. **Indexes created** for performance on frequently queried fields

---

## Testing Checklist

- [ ] Admin user can login to AdminSide
- [ ] Police user can login to AdminSide
- [ ] UserSide user CANNOT login to AdminSide
- [ ] Admin user cannot login to UserSide
- [ ] Police user cannot login to UserSide
- [ ] UserSide user can login to app
- [ ] Login attempt tracking works
- [ ] Failed login attempts are logged
- [ ] Account lockout works
- [ ] Roles are assigned correctly
- [ ] Permissions are enforced
- [ ] Audit logs are created
- [ ] Email verification works for new admin/police users
- [ ] Password reset works for admin/police users

---

## Troubleshooting

### Issue: "Model not found" for UserAdmin

**Solution:** Ensure namespace is correct:
```php
use App\Models\UserAdmin;
```

### Issue: Login fails silently

**Check:**
1. User exists in `user_admin` table
2. Email is verified (`email_verified_at` is not null)
3. Account is not locked
4. Using `Auth::guard('admin')` in controller

### Issue: Permissions not working

**Check:**
1. User has role assigned in `user_admin_roles`
2. Role has permissions in `admin_role_permissions`
3. Using `hasPermission()` method correctly
4. Middleware is registered in `Kernel.php`

---

## Next Steps

1. **Update all admin/police login flows** to use new AuthController
2. **Update all queries** referencing users table to use correct table
3. **Implement RBAC middleware** on protected routes
4. **Add audit logging** to critical admin actions
5. **Test thoroughly** before deploying to production
6. **Monitor login attempts** for suspicious activity
7. **Remove old users table** after verification period (recommended 1-2 weeks)

