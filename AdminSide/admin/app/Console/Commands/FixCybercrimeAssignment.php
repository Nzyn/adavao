<?php
namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\Report;

class FixCybercrimeAssignment extends Command
{
    protected $signature = 'fix:cybercrime-assignment {report_id=968}';
    protected $description = 'Assign a report to Cybercrime Division (Station ID: 40) if missing.';

    public function handle()
    {
        $reportId = $this->argument('report_id');
        $report = Report::find($reportId);
        if (!$report) {
            $this->error("Report with ID $reportId not found.");
            return 1;
        }
        if ($report->assigned_station_id == 40) {
            $this->info('Report already assigned to Cybercrime Division.');
            return 0;
        }
        $report->assigned_station_id = 40;
        $report->save();
        $this->info("Report ID $reportId assigned to Cybercrime Division (Station ID: 40).");
        return 0;
    }
}
