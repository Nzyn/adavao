<?php

namespace App\Observers;

use App\Models\UserAdmin;
use Illuminate\Support\Facades\DB;

class UserAdminObserver
{
    /**
     * Handle the UserAdmin "created" event.
     */
    public function created(UserAdmin $userAdmin): void
    {
        // Auto-assign 'police' role to new UserAdmin accounts
        $policeRole = DB::table('roles')->where('role_name', 'police')->first();
        
        if ($policeRole) {
            // Check if role is not already assigned
            $exists = DB::table('user_admin_roles')
                ->where('user_admin_id', $userAdmin->id)
                ->where('role_id', $policeRole->role_id)
                ->exists();
            
            if (!$exists) {
                DB::table('user_admin_roles')->insert([
                    'user_admin_id' => $userAdmin->id,
                    'role_id' => $policeRole->role_id,
                    'assigned_at' => now(),
                    'assigned_by' => auth()->id() ?? 1,
                ]);
                
                \Log::info('Auto-assigned police role to new UserAdmin', [
                    'user_id' => $userAdmin->id,
                    'email' => $userAdmin->email
                ]);
            }
        }
    }
}
