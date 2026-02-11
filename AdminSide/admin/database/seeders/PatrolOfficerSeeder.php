<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\Log;

class PatrolOfficerSeeder extends Seeder
{
    /**
     * Seed test patrol officer accounts.
     * Safe to re-run - handles existing records.
     */
    public function run(): void
    {
        $this->command->info("🔄 Starting PatrolOfficerSeeder...");
        
        $password = Hash::make('patrol123');
        
        // Test patrol officer accounts
        $patrolOfficers = [
            [
                'firstname' => 'Test',
                'lastname' => 'Patrol',
                'email' => 'tpatrol@mailsac.com',
                'contact' => '+639123456789',
            ],
            [
                'firstname' => 'Patrol',
                'lastname' => 'Officer1',
                'email' => 'patrol1@mailsac.com',
                'contact' => '+639123456790',
            ],
        ];

        foreach ($patrolOfficers as $officer) {
            // Insert into user_admin
            try {
                $exists = DB::table('user_admin')->where('email', $officer['email'])->exists();
                
                if (!$exists) {
                    $data = [
                        'firstname' => $officer['firstname'],
                        'lastname' => $officer['lastname'],
                        'email' => $officer['email'],
                        'contact' => $officer['contact'],
                        'password' => $password,
                        'created_at' => now(),
                        'updated_at' => now(),
                    ];
                    
                    // Add optional columns if they exist
                    if (Schema::hasColumn('user_admin', 'user_role')) {
                        $data['user_role'] = 'patrol_officer';
                    }
                    if (Schema::hasColumn('user_admin', 'email_verified_at')) {
                        $data['email_verified_at'] = now();
                    }
                    
                    DB::table('user_admin')->insert($data);
                    $this->command->info("✅ Created user_admin: {$officer['email']}");
                } else {
                    // Update existing
                    $update = ['updated_at' => now()];
                    if (Schema::hasColumn('user_admin', 'user_role')) {
                        $update['user_role'] = 'patrol_officer';
                    }
                    if (Schema::hasColumn('user_admin', 'email_verified_at')) {
                        $update['email_verified_at'] = now();
                    }
                    DB::table('user_admin')->where('email', $officer['email'])->update($update);
                    $this->command->info("🔄 Updated user_admin: {$officer['email']}");
                }
            } catch (\Exception $e) {
                $this->command->error("❌ user_admin error for {$officer['email']}: " . $e->getMessage());
                Log::error("PatrolOfficerSeeder user_admin error: " . $e->getMessage());
            }

            // Insert into users_public
            try {
                $existsPublic = DB::table('users_public')->where('email', $officer['email'])->exists();
                
                if (!$existsPublic) {
                    $dataPublic = [
                        'firstname' => $officer['firstname'],
                        'lastname' => $officer['lastname'],
                        'email' => $officer['email'],
                        'contact' => $officer['contact'],
                        'password' => $password,
                        'created_at' => now(),
                        'updated_at' => now(),
                    ];
                    
                    // Add optional columns if they exist
                    if (Schema::hasColumn('users_public', 'user_role')) {
                        $dataPublic['user_role'] = 'patrol_officer';
                    }
                    if (Schema::hasColumn('users_public', 'role')) {
                        $dataPublic['role'] = 'patrol_officer';
                    }
                    if (Schema::hasColumn('users_public', 'is_on_duty')) {
                        $dataPublic['is_on_duty'] = false;
                    }
                    if (Schema::hasColumn('users_public', 'email_verified_at')) {
                        $dataPublic['email_verified_at'] = now();
                    }
                    
                    DB::table('users_public')->insert($dataPublic);
                    $this->command->info("✅ Created users_public: {$officer['email']}");
                } else {
                    // Update existing
                    $updatePublic = ['updated_at' => now()];
                    if (Schema::hasColumn('users_public', 'user_role')) {
                        $updatePublic['user_role'] = 'patrol_officer';
                    }
                    if (Schema::hasColumn('users_public', 'role')) {
                        $updatePublic['role'] = 'patrol_officer';
                    }
                    if (Schema::hasColumn('users_public', 'email_verified_at')) {
                        $updatePublic['email_verified_at'] = now();
                    }
                    DB::table('users_public')->where('email', $officer['email'])->update($updatePublic);
                    $this->command->info("🔄 Updated users_public: {$officer['email']}");
                }
            } catch (\Exception $e) {
                $this->command->error("❌ users_public error for {$officer['email']}: " . $e->getMessage());
                Log::error("PatrolOfficerSeeder users_public error: " . $e->getMessage());
            }
        }
        
        $this->command->info("✅ PatrolOfficerSeeder completed!");
    }
}

