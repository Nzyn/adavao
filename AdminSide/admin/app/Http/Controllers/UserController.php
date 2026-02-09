<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Models\PoliceStation;
use App\Models\PoliceOfficer;
use App\Models\Notification;
use App\Events\UserFlagged;
use App\Services\EncryptionService;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Validation\ValidationException;
use Illuminate\Database\Eloquent\ModelNotFoundException;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Cache;

class UserController extends Controller
{
    /**
     * Display the specified user.
     */
    public function show(string $id): JsonResponse
    {
        try {
            $user = User::with('policeStation')->findOrFail($id);
            
            // contact & address are auto-decrypted by User model accessors
            return response()->json([
                'success' => true,
                'data' => [
                    'id' => $user->id,
                    'firstName' => $user->firstname,
                    'lastName' => $user->lastname,
                    'email' => $user->email,
                    'phone' => $user->contact,
                    'address' => $user->address,
                    'latitude' => $user->latitude,
                    'longitude' => $user->longitude,
                    'is_verified' => $user->is_verified,
                    'station_id' => $user->station_id,
                    'station' => $user->policeStation ? [
                        'station_id' => $user->policeStation->station_id,
                        'station_name' => $user->policeStation->station_name,
                        'address' => $user->policeStation->address,
                        'latitude' => $user->policeStation->latitude,
                        'longitude' => $user->policeStation->longitude,
                        'contact_number' => $user->policeStation->contact_number,
                    ] : null,
                ]
            ]);
        } catch (ModelNotFoundException $e) {
            return response()->json([
                'success' => false,
                'message' => 'User not found'
            ], 404);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'An error occurred while fetching user data'
            ], 500);
        }
    }

    /**
     * Update the specified user in storage.
     */
    public function update(Request $request, string $id): JsonResponse
    {
        try {
            $user = User::findOrFail($id);

            // Validate the incoming request data
            $validatedData = $request->validate([
                'firstname' => 'sometimes|required|string|max:50',
                'lastname' => 'sometimes|required|string|max:50',
                'email' => 'sometimes|required|email|max:100|unique:users_public,email,' . $id,
                'contact' => 'sometimes|nullable|string|max:20',
                'address' => 'sometimes|nullable|string|max:500',
                'latitude' => 'sometimes|nullable|numeric',
                'longitude' => 'sometimes|nullable|numeric',
            ]);

            // Update the user with the validated data
            $user->update($validatedData);
            
            // Invalidate user cache
            Cache::forget('users_list');

            // contact & address are auto-decrypted by User model accessors
            return response()->json([
                'success' => true,
                'message' => 'Profile updated successfully',
                'data' => [
                    'id' => $user->id,
                    'firstName' => $user->firstname,
                    'lastName' => $user->lastname,
                    'email' => $user->email,
                    'phone' => $user->contact,
                    'address' => $user->address,
                    'latitude' => $user->latitude,
                    'longitude' => $user->longitude,
                    'is_verified' => $user->is_verified,
                    'station_id' => $user->station_id,
                ]
            ]);

        } catch (ModelNotFoundException $e) {
            return response()->json([
                'success' => false,
                'message' => 'User not found'
            ], 404);
        } catch (ValidationException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $e->errors()
            ], 422);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'An error occurred while updating user data'
            ], 500);
        }
    }

    /**
     * Get all users (optional - for admin purposes)
     */
    public function index(): JsonResponse
    {
        try {
            $users = Cache::remember('users_list', 300, function() {
                return User::select('id', 'firstname', 'lastname', 'email', 'contact', 'address', 'latitude', 'longitude', 'is_verified', 'station_id', 'created_at')
                             ->orderBy('created_at', 'desc')
                             ->get()
                             ->map(function($user) {
                                return [
                                    'id' => $user->id,
                                    'firstName' => $user->firstname,
                                    'lastName' => $user->lastname,
                                    'email' => $user->email,
                                    'phone' => $user->contact,
                                    'address' => $user->address,
                                    'latitude' => $user->latitude,
                                    'longitude' => $user->longitude,
                                    'is_verified' => $user->is_verified,
                                    'station_id' => $user->station_id,
                                    'created_at' => $user->created_at,
                                ];
                             });
            });

            return response()->json([
                'success' => true,
                'data' => $users
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'An error occurred while fetching users'
            ], 500);
        }
    }
    
    /**
     * Flag a user
     */
    public function flagUser(Request $request, string $id): JsonResponse
    {
        try {
            $user = User::findOrFail($id);
            
            // Validate the request
            $validated = $request->validate([
                'violation_type' => 'required|in:false_report,prank_spam,harassment,offensive_content,impersonation,multiple_accounts,system_abuse,inappropriate_media,misleading_info,other',
                'reason' => 'nullable|string|max:500',
                'duration_days' => 'required|in:1,3,7,30' // 1 day, 3 days, 7 days, 1 month
            ]);
            
            // Check if user_flags table exists
            if (!\Illuminate\Support\Facades\Schema::hasTable('user_flags')) {
                return response()->json([
                    'success' => false,
                    'message' => 'User flags system is not set up. Please run migration.'
                ], 500);
            }
            
            // Calculate expiry date based on duration
            $expiresAt = now()->addDays($validated['duration_days']);
            
            // Insert flag record
            $flagRecord = DB::table('user_flags')->insertGetId([
                'user_id' => $id,
                'reported_by' => auth()->id() ?? 1,
                'violation_type' => $validated['violation_type'],
                'description' => $validated['reason'] ?? null,
                'status' => 'confirmed',
                'duration_days' => $validated['duration_days'],
                'expires_at' => $expiresAt,
                'created_at' => now(),
                'updated_at' => now()
            ]);
            
            // Get total flags for this user (count only confirmed/non-dismissed flags)
            $totalFlags = DB::table('user_flags')
                ->where('user_id', $id)
                ->whereIn('status', ['confirmed', 'appealed'])
                ->count();
            
            // Update user's total_flags count
            DB::table('users_public')
                ->where('id', $id)
                ->update([
                    'total_flags' => $totalFlags,
                    'updated_at' => now()
                ]);
            
            // Auto-apply restriction: apply restriction immediately on first flag
            $restrictionType = null;
            if ($totalFlags >= 1) {
                // Apply a warning restriction for the first flag. Change to 'suspended' or 'banned' if stricter action is desired.
                $restrictionType = 'warning';
            }
            
            if ($restrictionType) {
                // Check if active restriction exists
                $existingRestriction = DB::table('user_restrictions')
                    ->where('user_id', $id)
                    ->where('is_active', true)
                    ->first();
                
                if (!$existingRestriction) {
                    // Create new restriction with expiry
                    // Use null for restricted_by to avoid foreign key violations 
                    // (admin users are in user_admin table, not users_public)
                    DB::table('user_restrictions')->insert([
                        'user_id' => $id,
                        'restriction_type' => $restrictionType,
                        'reason' => "Flagged for {$validated['violation_type']} - {$validated['duration_days']} day(s)",
                        'restricted_by' => null,
                        'is_active' => true,
                        'expires_at' => $expiresAt,
                        'created_at' => now(),
                        'updated_at' => now()
                    ]);
                    
                    // Update user restriction level
                    DB::table('users_public')
                        ->where('id', $id)
                        ->update([
                            'restriction_level' => $restrictionType,
                            'updated_at' => now()
                        ]);
                }
            }
            
            // Create notification in database
            $notificationMessage = $this->generateNotificationMessage($validated['violation_type'], $restrictionType, $validated['duration_days']);
            Notification::create([
                'user_id' => $id,
                'type' => 'user_flagged',
                'message' => $notificationMessage,
                'data' => [
                    'flag_id' => $flagRecord,
                    'violation_type' => $validated['violation_type'],
                    'reason' => $validated['reason'] ?? null,
                    'total_flags' => $totalFlags,
                    'restriction_applied' => $restrictionType,
                    'duration_days' => $validated['duration_days'],
                    'expires_at' => $expiresAt->toIso8601String(),
                ]
            ]);
            
            // Broadcast real-time notification
            UserFlagged::dispatch(
                (int) $id,
                (int) $flagRecord,
                $validated['violation_type'],
                $validated['reason'] ?? null,
                $totalFlags,
                $restrictionType,
                now()->toIso8601String(),
                $validated['duration_days'],
                $expiresAt->toIso8601String()
            );
            
            // Invalidate cache
            Cache::forget('users_list');
            
            return response()->json([
                'success' => true,
                'message' => 'User has been flagged successfully',
                'data' => [
                    'total_flags' => $totalFlags,
                    'restriction_applied' => $restrictionType,
                    'duration_days' => $validated['duration_days'],
                    'expires_at' => $expiresAt->toIso8601String(),
                    'notification_sent' => true
                ]
            ]);
        } catch (ValidationException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Validation error',
                'errors' => $e->errors()
            ], 422);
        } catch (ModelNotFoundException $e) {
            return response()->json([
                'success' => false,
                'message' => 'User not found'
            ], 404);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'An error occurred while flagging the user: ' . $e->getMessage()
            ], 500);
        }
    }
    
    /**
     * Remove user restrictions and flags
     */
    public function unflagUser(Request $request, string $id): JsonResponse
    {
        try {
            \Log::info('unflagUser called', ['user_id' => $id, 'authenticated_user' => auth()->id()]);
            
            $user = User::findOrFail($id);
            
            // Mark all flags as dismissed
            $flagsUpdated = DB::table('user_flags')
                ->where('user_id', $id)
                ->whereIn('status', ['confirmed', 'appealed'])
                ->update([
                    'status' => 'dismissed',
                    'reviewed_by' => auth()->id() ?? 1,
                    'reviewed_at' => now(),
                    'updated_at' => now()
                ]);
            
            \Log::info('Flags marked as dismissed', ['user_id' => $id, 'rows_updated' => $flagsUpdated]);
            
            // Deactivate all restrictions
            $restrictionsUpdated = DB::table('user_restrictions')
                ->where('user_id', $id)
                ->where('is_active', true)
                ->update([
                    'is_active' => false,
                    'lifted_by' => auth()->id() ?? 1,
                    'lifted_at' => now(),
                    'updated_at' => now()
                ]);
            
            \Log::info('Restrictions deactivated', ['user_id' => $id, 'rows_updated' => $restrictionsUpdated]);
            
            // Update user record
            $userUpdated = DB::table('users_public')
                ->where('id', $id)
                ->update([
                    'total_flags' => 0,
                    'restriction_level' => 'none',
                    'updated_at' => now()
                ]);
            
            \Log::info('User record updated', ['user_id' => $id, 'rows_updated' => $userUpdated]);
            
            // Create unflag notification
            try {
                Notification::create([
                    'user_id' => $id,
                    'type' => 'user_unflagged',
                    'message' => 'Restrictions Lifted: Your account flags have been removed. You can now submit reports and access all features.',
                    'data' => [
                        'lifted_at' => now()->toIso8601String(),
                        'lifted_by_admin' => auth()->id() ?? 1
                    ],
                    'read' => false
                ]);
            } catch (\Exception $e) {
                \Log::error('Failed to create unflag notification: ' . $e->getMessage());
            }
            
            // Invalidate cache
            Cache::forget('users_list');

            return response()->json([
                'success' => true,
                'message' => 'User restrictions have been removed successfully'
            ]);
        } catch (ModelNotFoundException $e) {
            return response()->json([
                'success' => false,
                'message' => 'User not found'
            ], 404);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'An error occurred while unflagging the user: ' . $e->getMessage()
            ], 500);
        }
    }
    
    /**
     * Promote a user to officer
     */
    public function promoteToOfficer(Request $request, string $id): JsonResponse
    {
        try {
            $user = User::findOrFail($id);
            
            // Check if user is already an officer
            if ($user->station_id) {
                return response()->json([
                    'success' => false,
                    'message' => 'User is already an officer'
                ], 400);
            }
            
            // Get the first police station as default (in a real app, you would let the admin choose)
            $station = PoliceStation::first();
            
            if (!$station) {
                return response()->json([
                    'success' => false,
                    'message' => 'No police stations available'
                ], 400);
            }
            
            // Update user with station_id and role
            $user->station_id = $station->station_id;
            $user->role = 'police';
            $user->save();
            
            // Create police officer record
            PoliceOfficer::create([
                'user_id' => $user->id,
                'station_id' => $station->station_id,
                'assigned_since' => now(),
                'status' => 'active'
            ]);
            
            // Invalidate cache
            Cache::forget('users_list');
            
            return response()->json([
                'success' => true,
                'message' => 'User has been promoted to officer successfully'
            ]);
        } catch (ModelNotFoundException $e) {
            return response()->json([
                'success' => false,
                'message' => 'User not found'
            ], 404);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'An error occurred while promoting the user to officer: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Change a user's role
     */
    public function changeRole(Request $request, string $id): JsonResponse
    {
        try {
            \Log::info('changeRole called', ['user_id' => $id, 'request_data' => $request->all()]);
            
            $user = User::findOrFail($id);
            \Log::info('User found', ['user_id' => $user->id, 'current_role' => $user->role]);
            
            // Validate the role
            $validatedData = $request->validate([
                'role' => 'required|in:user,police,admin'
            ]);
            
            \Log::info('Validation passed', ['new_role' => $validatedData['role']]);
            
            // If changing to police, assign a station
            if ($validatedData['role'] === 'police' && !$user->station_id) {
                $station = PoliceStation::first();
                
                if (!$station) {
                    return response()->json([
                        'success' => false,
                        'message' => 'No police stations available'
                    ], 400);
                }
                
                $user->station_id = $station->station_id;
                
                // Create police officer record if not exists
                PoliceOfficer::firstOrCreate(
                    ['user_id' => $user->id],
                    [
                        'station_id' => $station->station_id,
                        'assigned_since' => now(),
                        'status' => 'active'
                    ]
                );
                
                \Log::info('Station assigned', ['station_id' => $station->station_id]);
            }
            
            // If changing from police to user, remove station
            if ($validatedData['role'] === 'user' && $user->station_id) {
                $user->station_id = null;
                // Optionally deactivate police officer record
                PoliceOfficer::where('user_id', $user->id)->update(['status' => 'inactive']);
                \Log::info('Station removed');
            }
            
            // Update the role
            $user->role = $validatedData['role'];
            $user->save();
            
            // Invalidate cache
            Cache::forget('users_list');
            
            \Log::info('Role updated successfully', ['user_id' => $user->id, 'new_role' => $user->role]);
            
            return response()->json([
                'success' => true,
                'message' => 'User role has been changed successfully',
                'user' => [
                    'id' => $user->id,
                    'role' => $user->role,
                    'station_id' => $user->station_id
                ]
            ]);
        } catch (ModelNotFoundException $e) {
            \Log::error('User not found', ['user_id' => $id]);
            return response()->json([
                'success' => false,
                'message' => 'User not found'
            ], 404);
        } catch (ValidationException $e) {
            \Log::error('Validation failed', ['errors' => $e->errors()]);
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $e->errors()
            ], 422);
        } catch (\Exception $e) {
            \Log::error('Exception in changeRole', ['error' => $e->getMessage(), 'trace' => $e->getTraceAsString()]);
            return response()->json([
                'success' => false,
                'message' => 'An error occurred while changing the user role: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Assign a police or admin user to a police station
     */
    /**
     * Assign a police or admin user to a police station
     */
    public function assignStation(Request $request, string $id): JsonResponse
    {
        try {
            \Log::info('assignStation called', ['user_id' => $id, 'request_data' => $request->all()]);
            
            // Personnel page shows UserAdmin users, so check UserAdmin FIRST
            $user = null;
            $userType = 'admin';
            
            try {
                $user = \App\Models\UserAdmin::findOrFail($id);
                $userType = 'admin';
            } catch (ModelNotFoundException $e) {
                // If not found in UserAdmin, try users_public
                try {
                    $user = User::findOrFail($id);
                    $userType = 'user';
                } catch (ModelNotFoundException $e2) {
                    throw $e; // Throw original exception if not found in either
                }
            }
            
            \Log::info('User found', ['user_id' => $user->id, 'type' => $userType, 'current_role' => $user->role ?? $user->user_role]);
            
            // Validate that user is police or admin
            // UserAdmin uses 'user_role' column OR adminRoles relation, User uses 'role' column
            $role = $user->role ?? $user->user_role ?? null;
            
            // For UserAdmin, also check adminRoles relation (RBAC)
            if ($userType === 'admin' && method_exists($user, 'adminRoles')) {
                $adminRoles = $user->adminRoles()->pluck('role_name')->toArray();
                \Log::info('AdminRoles found', ['roles' => $adminRoles]);
                
                if (in_array('super_admin', $adminRoles) || in_array('admin', $adminRoles)) {
                    $role = 'admin';
                } elseif (in_array('police', $adminRoles)) {
                    $role = 'police';
                } elseif (in_array('patrol_officer', $adminRoles)) {
                    $role = 'patrol_officer';
                }
            }
            
            // For admin users, 'admin' role should be allowed to assign stations
            if ($userType === 'admin' && empty($role)) {
                $role = 'admin'; // Default to admin for UserAdmin table users
            }
            
            \Log::info('Role check', ['role' => $role, 'userType' => $userType]);
            
            if ($role !== 'admin' && $role !== 'police' && $role !== 'patrol_officer' && $role !== 'staff') {
                return response()->json([
                    'success' => false,
                    'message' => 'Only police and admin users can be assigned to police stations'
                ], 400);
            }
            
            // Validate the station_id
            $validatedData = $request->validate([
                'station_id' => 'required|exists:police_stations,station_id'
            ]);
            
            \Log::info('Validation passed', ['station_id' => $validatedData['station_id']]);
            
            // Check if station exists
            $station = PoliceStation::where('station_id', $validatedData['station_id'])->first();
            if (!$station) {
                return response()->json([
                    'success' => false,
                    'message' => 'Police station not found'
                ], 404);
            }
            
            // Assign the user to the station
            $user->station_id = $validatedData['station_id'];
            $user->save();
            
            // Sync station assignment to users_public (patrol mobile app reads from this table)
            if ($userType === 'admin') {
                DB::table('users_public')
                    ->where(DB::raw('LOWER(TRIM(email))'), strtolower(trim($user->email)))
                    ->update([
                        'assigned_station_id' => $validatedData['station_id'],
                        'updated_at' => now()
                    ]);
                \Log::info('Synced station to users_public', ['email' => $user->email, 'station_id' => $validatedData['station_id']]);
            }
            
            // If police user, also update/create police officer record
            if ($role === 'police') {
                if ($userType === 'user') {
                     PoliceOfficer::updateOrCreate(
                        ['user_id' => $user->id],
                        [
                            'station_id' => $validatedData['station_id'],
                            'assigned_since' => now(),
                            'status' => 'active'
                        ]
                    );
                } elseif ($userType === 'admin') {
                    // For UserAdmin, ensure they have the 'police' role in RBAC system
                    $policeRoleCheck = DB::table('user_admin_roles')
                        ->join('roles', 'user_admin_roles.role_id', '=', 'roles.role_id')
                        ->where('user_admin_roles.user_admin_id', $user->id)
                        ->where('roles.role_name', 'police')
                        ->exists();

                    if (!$policeRoleCheck) {
                        $policeRole = DB::table('roles')->where('role_name', 'police')->first();
                        if ($policeRole) {
                            DB::table('user_admin_roles')->insert([
                                'user_admin_id' => $user->id,
                                'role_id' => $policeRole->role_id,
                                'assigned_at' => now(), // Assuming timestamp needed
                            ]);
                            \Log::info('Automatically assigned police role to user_admin', ['user_id' => $user->id]);
                        }
                    }
                }
            }
            
            \Log::info('User assigned to station', [
                'user_id' => $user->id,
                'user_type' => $userType,
                'station_id' => $validatedData['station_id'],
                'station_name' => $station->station_name
            ]);
            
            // Invalidate cache
            Cache::forget('users_list');
            Cache::forget('personnel_list');

            return response()->json([
                'success' => true,
                'message' => 'User has been assigned to the police station successfully',
                'user' => [
                    'id' => $user->id,
                    'role' => $role,
                    'station_id' => $user->station_id
                ]
            ]);
        } catch (ModelNotFoundException $e) {
            \Log::error('User not found', ['user_id' => $id]);
            return response()->json([
                'success' => false,
                'message' => 'User not found'
            ], 404);
        } catch (ValidationException $e) {
            \Log::error('Validation failed', ['errors' => $e->errors()]);
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $e->errors()
            ], 422);
        } catch (\Exception $e) {
            \Log::error('Exception in assignStation', ['error' => $e->getMessage(), 'trace' => $e->getTraceAsString()]);
            return response()->json([
                'success' => false,
                'message' => 'An error occurred while assigning the user to the station: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Unassign a user from their police station
     */
    public function unassignStation(Request $request, string $id): JsonResponse
    {
        try {
            \Log::info('unassignStation called', ['user_id' => $id]);
            
            // Personnel page shows UserAdmin users, so check UserAdmin FIRST
            $user = null;
            $userType = 'admin';
            
            try {
                $user = \App\Models\UserAdmin::findOrFail($id);
                $userType = 'admin';
            } catch (ModelNotFoundException $e) {
                try {
                    $user = User::findOrFail($id);
                    $userType = 'user';
                } catch (ModelNotFoundException $e2) {
                    throw $e;
                }
            }
            
            $previousStation = $user->station_id;
            $user->station_id = null;
            $user->save();
            
            // Sync station removal to users_public (patrol mobile app reads from this table)
            if ($userType === 'admin') {
                DB::table('users_public')
                    ->where(DB::raw('LOWER(TRIM(email))'), strtolower(trim($user->email)))
                    ->update([
                        'assigned_station_id' => null,
                        'updated_at' => now()
                    ]);
            }
            
            \Log::info('User unassigned from station', [
                'user_id' => $user->id,
                'user_type' => $userType,
                'previous_station_id' => $previousStation
            ]);
            
            // Invalidate cache
            Cache::forget('users_list');
            Cache::forget('personnel_list');

            return response()->json([
                'success' => true,
                'message' => 'User has been unassigned from their police station'
            ]);
        } catch (ModelNotFoundException $e) {
            return response()->json([
                'success' => false,
                'message' => 'User not found'
            ], 404);
        } catch (\Exception $e) {
            \Log::error('Exception in unassignStation', ['error' => $e->getMessage()]);
            return response()->json([
                'success' => false,
                'message' => 'An error occurred: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get flag status for a user (used by UserSide to show flagging info)
     * Also auto-expires flags that have passed their expiration date (on-demand)
     */
    public function getFlagStatus(string $id): JsonResponse
    {
        try {
            $user = User::findOrFail($id);
            
            // STEP 1: Auto-expire any flags that have passed their expiration date
            $expiredCount = $this->autoExpireFlags($id);
            if ($expiredCount > 0) {
                \Log::info("Auto-expired {$expiredCount} flag(s) for user {$id}");
            }
            
            // STEP 2: Get the most recent confirmed flag that hasn't expired
            $latestFlag = DB::table('user_flags')
                ->where('user_id', $id)
                ->where('status', 'confirmed')
                ->where(function($query) {
                    $query->whereNull('expires_at')
                          ->orWhere('expires_at', '>', now());
                })
                ->orderBy('created_at', 'desc')
                ->first();
            
            // Get active restrictions
            $restriction = DB::table('user_restrictions')
                ->where('user_id', $id)
                ->where('is_active', true)
                ->first();
            
            $isFlagged = !is_null($latestFlag);
            
            return response()->json([
                'success' => true,
                'is_flagged' => $isFlagged,
                'expired_in_this_check' => $expiredCount,
                'flag_info' => $isFlagged ? [
                    'id' => $latestFlag->id,
                    'violation_type' => $latestFlag->violation_type,
                    'reason' => $latestFlag->description,
                    'severity' => $latestFlag->severity ?? null,
                    'duration_days' => $latestFlag->duration_days ?? null,
                    'expires_at' => $latestFlag->expires_at,
                    'created_at' => $latestFlag->created_at
                ] : null,
                'restriction_info' => $restriction ? [
                    'type' => $restriction->restriction_type,
                    'reason' => $restriction->reason,
                    'expires_at' => $restriction->expires_at,
                    'can_report' => (bool)$restriction->can_report,
                    'can_message' => (bool)$restriction->can_message
                ] : null,
                'can_report' => $isFlagged ? false : true
            ]);
        } catch (ModelNotFoundException $e) {
            return response()->json([
                'success' => false,
                'message' => 'User not found'
            ], 404);
        } catch (\Exception $e) {
            \Log::error('Exception in getFlagStatus', ['error' => $e->getMessage()]);
            return response()->json([
                'success' => false,
                'message' => 'An error occurred while fetching flag status'
            ], 500);
        }
    }
    
    /**
     * Auto-expire flags that have passed their expiration date.
     * This runs on-demand when checking flag status.
     * 
     * @param string $userId
     * @return int Number of expired flags
     */
    private function autoExpireFlags(string $userId): int
    {
        try {
            // Find expired flags for this user
            $expiredFlags = DB::table('user_flags')
                ->where('user_id', $userId)
                ->where('status', 'confirmed')
                ->whereNotNull('expires_at')
                ->where('expires_at', '<=', now())
                ->get();
            
            if ($expiredFlags->isEmpty()) {
                return 0;
            }
            
            // Mark flags as expired
            DB::table('user_flags')
                ->where('user_id', $userId)
                ->where('status', 'confirmed')
                ->whereNotNull('expires_at')
                ->where('expires_at', '<=', now())
                ->update([
                    'status' => 'expired',
                    'updated_at' => now()
                ]);
            
            // Deactivate expired restrictions
            DB::table('user_restrictions')
                ->where('user_id', $userId)
                ->where('is_active', true)
                ->whereNotNull('expires_at')
                ->where('expires_at', '<=', now())
                ->update([
                    'is_active' => false,
                    'lifted_at' => now(),
                    'updated_at' => now()
                ]);
            
            // Count remaining active flags
            $remainingFlags = DB::table('user_flags')
                ->where('user_id', $userId)
                ->where('status', 'confirmed')
                ->where(function($query) {
                    $query->whereNull('expires_at')
                          ->orWhere('expires_at', '>', now());
                })
                ->count();
            
            // Update user record
            DB::table('users_public')
                ->where('id', $userId)
                ->update([
                    'total_flags' => $remainingFlags,
                    'restriction_level' => $remainingFlags > 0 ? 'warning' : 'none',
                    'updated_at' => now()
                ]);
            
            // Create notification for each expired flag
            foreach ($expiredFlags as $flag) {
                Notification::create([
                    'user_id' => $userId,
                    'type' => 'flag_expired',
                    'message' => 'Good news! Your account restriction has expired. You can now submit reports and access all features normally.',
                    'data' => [
                        'flag_id' => $flag->id,
                        'violation_type' => $flag->violation_type,
                        'expired_at' => now()->toIso8601String(),
                        'remaining_flags' => $remainingFlags,
                    ]
                ]);
            }
            
            // Invalidate cache
            Cache::forget('users_list');
            
            return $expiredFlags->count();
        } catch (\Exception $e) {
            \Log::error('Error in autoExpireFlags', ['error' => $e->getMessage()]);
            return 0;
        }
    }
    
    /**
     * Generate notification message based on violation type and restriction.
     *
     * @param string $violationType
     * @param string|null $restrictionType
     * @param int $durationDays
     * @return string
     */
    private function generateNotificationMessage(string $violationType, ?string $restrictionType, int $durationDays = null): string
    {
        $violationLabels = [
            'false_report' => 'False Report',
            'prank_spam' => 'Prank/Spam',
            'harassment' => 'Harassment',
            'offensive_content' => 'Offensive Content',
            'impersonation' => 'Impersonation',
            'multiple_accounts' => 'Multiple Accounts',
            'system_abuse' => 'System Abuse',
            'inappropriate_media' => 'Inappropriate Media',
            'misleading_info' => 'Misleading Information',
            'other' => 'Other Violation',
        ];

        $label = $violationLabels[$violationType] ?? 'Violation';
        
        $message = "Your account has been flagged for: {$label}";
        
        if ($restrictionType) {
            $durationText = $durationDays ? " for {$durationDays} day(s)" : '';
            $message .= ". A {$restrictionType} restriction has been applied to your account{$durationText}.";
        }

        return $message;
    }

    /**
     * Get flag history for a user.
     */
    public function getFlagHistory(string $id): JsonResponse
    {
        try {
            $user = User::findOrFail($id);
            
            // Get all flags for this user with reported_by user information
            $flags = DB::table('user_flags')
                ->leftJoin('user_admin as flaggers', 'user_flags.reported_by', '=', 'flaggers.id')
                ->where('user_flags.user_id', $id)
                ->select(
                    'user_flags.id',
                    'user_flags.violation_type',
                    'user_flags.description as reason',
                    'user_flags.status',
                    'user_flags.created_at',
                    'user_flags.severity',
                    DB::raw("CONCAT(flaggers.firstname, ' ', flaggers.lastname) as flagged_by_name"),
                    'flaggers.email as flagged_by_email'
                )
                ->orderBy('user_flags.created_at', 'desc')
                ->get();
            
            return response()->json([
                'success' => true,
                'flags' => $flags,
                'user' => [
                    'id' => $user->id,
                    'name' => $user->firstname . ' ' . $user->lastname,
                    'email' => $user->email,
                    'total_flags' => $user->total_flags,
                    'restriction_level' => $user->restriction_level
                ]
            ]);
        } catch (ModelNotFoundException $e) {
            return response()->json([
                'success' => false,
                'message' => 'User not found'
            ], 404);
        } catch (\Exception $e) {
            \Log::error('Exception in getFlagHistory', ['error' => $e->getMessage()]);
            return response()->json([
                'success' => false,
                'message' => 'An error occurred while fetching flag history'
            ], 500);
        }
    }
}