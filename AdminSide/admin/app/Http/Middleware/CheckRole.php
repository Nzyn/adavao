<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class CheckRole
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     * @param  string  $roles
     * @return \Symfony\Component\HttpFoundation\Response
     */
    public function handle(Request $request, Closure $next, string $roles): Response
    {
        // Parse the roles parameter (e.g., "admin,police")
        $allowedRoles = explode(',', $roles);
        
        // Check if user is authenticated
        if (!auth()->check()) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthorized'
            ], 401);
        }
        
        $user = auth()->user();
        $hasPermission = false;
        
        // Handle UserAdmin (from separate table)
        // Dynamic RBAC Logic using role_route table
        
        $routeName = $request->route()->getName();
        
        // If route has no name, fallback to legacy check or allow? 
        // Safer to allow strict check, but for now we proceed with dynamic check only match found.
        if ($routeName) {
            // Check if this route is restricted in DB
            $routeExists = \App\Models\Route::where('route_name', $routeName)->exists();
            
            if ($routeExists) {
                 $hasDynamicPermission = false;
                 $userRoleNames = [];
                 
                 // Get User Role Names
                 if ($user instanceof \App\Models\UserAdmin) {
                     $userRoleNames = $user->adminRoles->pluck('role_name')->toArray();
                     // Map 'police_officer' to 'police' for compatibility
                     $userRoleNames = array_map(function($r) {
                         return $r === 'police_officer' ? 'police' : $r;
                     }, $userRoleNames);
                 } else {
                     // Regular User
                      $userRoleNames = $user->roles->pluck('role_name')->toArray();
                 }
                 
                 // Check DB for permission
                 $hasDynamicPermission = \App\Models\Role::whereIn('role_name', $userRoleNames)
                    ->whereHas('routes', function ($query) use ($routeName) {
                        $query->where('route_name', $routeName);
                    })
                    ->exists();
                    
                 if (!$hasDynamicPermission) {
                      // Fallback: If 'super_admin' is not in roles table but user has it, allow
                      if (in_array('super_admin', $userRoleNames)) {
                          $hasDynamicPermission = true;
                      } else {
                          // Allow legacy bypass if role matches the middleware parameter exactly (e.g. 'role:admin')
                          // This ensures we don't break routes that haven't been seeded yet
                          foreach ($allowedRoles as $role) {
                              if (in_array($role, $userRoleNames)) {
                                  $hasDynamicPermission = true;
                                  break;
                              }
                          }
                      }
                 }
                 
                 if (!$hasDynamicPermission) {
                      return response()->json([
                        'success' => false,
                        'message' => 'Forbidden: You do not have permission to access restricted route: ' . $routeName
                    ], 403);
                 }
                 
                 // If dynamic check passed, we are good.
                 return $next($request);
            }
        }
        
        // Fallback to original logic if route not restricted in DB or no name
        // (The original logic below is preserved for safety if dynamic check is skipped)
        $hasPermission = false;

        if ($user instanceof \App\Models\UserAdmin) {
            foreach ($allowedRoles as $role) {
                if ($role === 'admin') {
                    if ($user->hasRole('super_admin') || $user->hasRole('station_admin') || $user->hasRole('admin')) {
                        $hasPermission = true; break;
                    }
                } elseif ($role === 'police') {
                     if ($user->hasRole('police_officer') || $user->hasRole('police')) {
                        $hasPermission = true; break;
                     }
                } else {
                    if ($user->hasRole($role)) {
                        $hasPermission = true; break;
                    }
                }
            }
        } else {
             if ($user->hasAnyRole($allowedRoles)) {
                 $hasPermission = true;
             }
        }

        if (!$hasPermission) {
            return response()->json([
                'success' => false,
                'message' => 'Forbidden: insufficient permissions.'
            ], 403);
        }

        return $next($request);
    }
}
