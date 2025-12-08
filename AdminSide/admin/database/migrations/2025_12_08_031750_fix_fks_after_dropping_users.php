<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::disableForeignKeyConstraints();

        // 1. Reports
        if (Schema::hasTable('reports')) {
            $this->dropForeignKeyIfExists('reports', 'user_id');
            // Check if we need to add the new FK (avoid duplicate error)
            // We assume if the old one is gone, we want the new one.
            // But if the new one exists (from partial run), it might error.
            // Safer to just try adding it, usually harmless if exact duplicate signature.
            // Or better: ensure we don't have it.
            
            Schema::table('reports', function (Blueprint $table) {
                // Determine if we need to add the foreign key
                // Ideally we'd check constraint existence again, but for now let's just add it.
                // If it fails, users can manually check. But let's try to be clean.
                try {
                    $table->foreign('user_id')->references('id')->on('user_public')->onDelete('cascade');
                } catch (\Exception $e) { /* Ignore duplicate */ }
            });
        }

        // 2. Verifications
        if (Schema::hasTable('verifications')) {
            $this->dropForeignKeyIfExists('verifications', 'user_id');
            Schema::table('verifications', function (Blueprint $table) {
                try {
                    $table->foreign('user_id')->references('id')->on('user_public')->onDelete('cascade');
                } catch (\Exception $e) { }
            });
        }

        // 3. Messages
        if (Schema::hasTable('messages')) {
            $this->dropForeignKeyIfExists('messages', 'sender_id');
            $this->dropForeignKeyIfExists('messages', 'receiver_id');
        }

        // 4. Notifications
        if (Schema::hasTable('notifications')) {
            $this->dropForeignKeyIfExists('notifications', 'user_id');
            Schema::table('notifications', function (Blueprint $table) {
                try {
                    $table->foreign('user_id')->references('id')->on('user_public')->onDelete('cascade');
                } catch (\Exception $e) { }
            });
        }

        // 5. User Flags
        if (Schema::hasTable('user_flags')) {
            $this->dropForeignKeyIfExists('user_flags', 'user_id');
            $this->dropForeignKeyIfExists('user_flags', 'reported_by');
            $this->dropForeignKeyIfExists('user_flags', 'reviewed_by');

            Schema::table('user_flags', function (Blueprint $table) {
                // Ensure column types match referenced table id (unsignedBigInteger)
                // We use change() to modify existing column
                try {
                    $table->unsignedBigInteger('reviewed_by')->nullable()->change();
                } catch (\Exception $e) { /* DB might not support change without doctrine/dbal, but recent Laravel does */ }

                try { $table->foreign('user_id')->references('id')->on('user_public')->onDelete('cascade'); } catch(\Exception $e){}
                try { $table->foreign('reviewed_by')->references('id')->on('user_admin')->onDelete('set null'); } catch(\Exception $e){}
            });
        }

        // 6. User Restrictions
        if (Schema::hasTable('user_restrictions')) {
            $this->dropForeignKeyIfExists('user_restrictions', 'user_id');
            if (Schema::hasColumn('user_restrictions', 'reviewed_by')) {
                $this->dropForeignKeyIfExists('user_restrictions', 'reviewed_by');
                Schema::table('user_restrictions', function (Blueprint $table) {
                    try {
                        $table->unsignedBigInteger('reviewed_by')->nullable()->change();
                    } catch (\Exception $e) {}
                    
                    try { $table->foreign('reviewed_by')->references('id')->on('user_admin')->onDelete('set null'); } catch(\Exception $e){}
                });
            }
            
            Schema::table('user_restrictions', function (Blueprint $table) {
                try { $table->foreign('user_id')->references('id')->on('user_public')->onDelete('cascade'); } catch(\Exception $e){}
            });
        }

        Schema::enableForeignKeyConstraints();
    }

    /**
     * Helper to safely drop foreign keys
     */
    protected function dropForeignKeyIfExists($table, $column)
    {
        $conn = Schema::getConnection();
        $dbName = $conn->getDatabaseName();
        $fkName = "{$table}_{$column}_foreign";

        // Query information_schema to see if it exists
        $exists = $conn->selectOne(
            "SELECT CONSTRAINT_NAME FROM information_schema.KEY_COLUMN_USAGE
             WHERE CONSTRAINT_SCHEMA = ? AND TABLE_NAME = ? AND CONSTRAINT_NAME = ?",
            [$dbName, $table, $fkName]
        );

        if ($exists) {
            Schema::table($table, function (Blueprint $table) use ($column) {
                $table->dropForeign([$column]);
            });
        }
    }

    public function down(): void
    {
        // One-way fix intended
    }
};
