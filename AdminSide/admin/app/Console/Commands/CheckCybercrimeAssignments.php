<?php
namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\User;
use App\Models\Report;

class CheckCybercrimeAssignments extends Command
{
    protected $signature = 'check:cybercrime-assignments {user_id} {report_id=968}';
    protected $description = 'Check police user and report assignments for Cybercrime Division';

    public function handle()
    {
        $userId = $this->argument('user_id');
        $reportId = $this->argument('report_id');

        $user = User::find($userId);
        $report = Report::find($reportId);

        if (!$user) {
            $this->error("User with ID $userId not found.");
            return 1;
        }
        if (!$report) {
            $this->error("Report with ID $reportId not found.");
            return 1;
        }

        $this->info("User ID: $userId, Station ID: " . ($user->station_id ?? 'NULL'));
        $this->info("Report ID: $reportId, Assigned Station ID: " . ($report->assigned_station_id ?? 'NULL'));

        if ($user->station_id == 40 && $report->assigned_station_id == 40) {
            $this->info('✅ Both user and report are correctly assigned to Cybercrime Division (Station ID: 40).');
        } else {
            $this->warn('❌ Assignment mismatch detected.');
        }
        return 0;
    }
}
