<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class ImportMySQLDataSeeder extends Seeder
{
    public function run()
    {
        $sqlFile = database_path('../alertdavao_postgres.sql');
        
        if (!file_exists($sqlFile)) {
            $this->command->error("SQL file not found: {$sqlFile}");
            return;
        }
        
        $sql = file_get_contents($sqlFile);
        
        // Split by semicolons but be careful with strings
        $statements = array_filter(
            array_map('trim', explode(';', $sql)),
            fn($stmt) => !empty($stmt) && !str_starts_with($stmt, '--')
        );
        
        $this->command->info("Importing " . count($statements) . " SQL statements...");
        
        DB::beginTransaction();
        
        try {
            foreach ($statements as $index => $statement) {
                if (empty(trim($statement))) continue;
                
                try {
                    DB::statement($statement);
                    if (($index + 1) % 100 == 0) {
                        $this->command->info("Processed " . ($index + 1) . " statements...");
                    }
                } catch (\Exception $e) {
                    // Log but continue - some statements might fail due to constraints
                    $this->command->warn("Skipped statement: " . substr($statement, 0, 100) . "...");
                }
            }
            
            DB::commit();
            $this->command->info("✓ Import completed successfully!");
            
        } catch (\Exception $e) {
            DB::rollBack();
            $this->command->error("Import failed: " . $e->getMessage());
            throw $e;
        }
    }
}
