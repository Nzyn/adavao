<?php
namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\Report;

class CheckLatestCybercrimeReport extends Command
{
    protected $signature = 'check:latest-cybercrime-report';
    protected $description = 'Check the latest report for cybercrime assignment.';

    public function handle()
    {
        $report = Report::orderBy('report_id', 'desc')->first();
        if (!$report) {
            $this->error('No reports found.');
            return 1;
        }
        $this->info('Latest Report ID: ' . $report->report_id);
        $this->info('Assigned Station ID: ' . ($report->assigned_station_id ?? 'NULL'));
        $this->info('Report Type: ' . $report->report_type);
        if ($report->assigned_station_id == 40) {
            $this->info('✅ Assigned to Cybercrime Division.');
        } else {
            $this->warn('❌ Not assigned to Cybercrime Division.');
        }
        return 0;
    }
}
