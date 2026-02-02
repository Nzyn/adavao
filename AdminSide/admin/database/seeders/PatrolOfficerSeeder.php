<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Carbon\Carbon;

class PatrolOfficerSeeder extends Seeder
{
    /**
     * Seed test patrol officer accounts.
     * Safe to re-run - uses insertOrIgnore.
     */
    public function run(): void
    {
        $now = Carbon::now();
        
        // Test patrol officer accounts
        $patrolOfficers = [
            [
                'firstname' => 'Test',
                'lastname' => 'Patrol',
                'email' => 'tpatrol@mailsac.com',
                'contact' => '+639123456789',
                'password' => Hash::make('patrol123'),
                'user_role' => 'patrol_officer',
                'email_verified_at' => $now,
                'created_at' => $now,
                'updated_at' => $now,
            ],
            [
                'firstname' => 'Patrol',
                'lastname' => 'Officer1',
                'email' => 'patrol1@mailsac.com',
                'contact' => '+639123456790',
                'password' => Hash::make('patrol123'),
                'user_role' => 'patrol_officer',
                'email_verified_at' => $now,
                'created_at' => $now,
                'updated_at' => $now,
            ],
        ];

        foreach ($patrolOfficers as $officer) {
            // Check if already exists
            $exists = DB::table('user_admin')->where('email', $officer['email'])->exists();
            
            if (!$exists) {
                DB::table('user_admin')->insert($officer);
                $this->command->info("✅ Created patrol officer: {$officer['email']}");
            } else {
                // Update to ensure role and verification
                DB::table('user_admin')
                    ->where('email', $officer['email'])
                    ->update([
                        'user_role' => 'patrol_officer',
                        'email_verified_at' => $now,
                        'updated_at' => $now,
                    ]);
                $this->command->info("🔄 Updated existing patrol officer: {$officer['email']}");
            }
        }

        // Also sync to users_public for mobile app access
        foreach ($patrolOfficers as $officer) {
            $existsPublic = DB::table('users_public')->where('email', $officer['email'])->exists();
            
            if (!$existsPublic) {
                DB::table('users_public')->insert([
                    'firstname' => $officer['firstname'],
                    'lastname' => $officer['lastname'],
                    'email' => $officer['email'],
                    'contact' => $officer['contact'],
                    'password' => $officer['password'],
                    'user_role' => 'patrol_officer',
                    'is_on_duty' => false,
                    'email_verified_at' => $now,
                    'created_at' => $now,
                    'updated_at' => $now,
                ]);
                $this->command->info("✅ Synced to users_public: {$officer['email']}");
            } else {
                DB::table('users_public')
                    ->where('email', $officer['email'])
                    ->update([
                        'user_role' => 'patrol_officer',
                        'email_verified_at' => $now,
                        'updated_at' => $now,
                    ]);
                $this->command->info("🔄 Updated users_public: {$officer['email']}");
            }
        }
    }
}
