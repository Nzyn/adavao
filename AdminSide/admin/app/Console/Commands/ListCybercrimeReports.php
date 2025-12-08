<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\Report;

class ListCybercrimeReports extends Command
{
    protected $signature = 'list:cybercrime-reports';
    protected $description = 'List all reports containing cybercrime in their report_type field';

    public function handle()
    {
        $reports = Report::where('report_type', 'like', '%cybercrime%')->get();
        if ($reports->isEmpty()) {
            $this->info('No reports found with cybercrime in report_type.');
            return 0;
        }
        foreach ($reports as $report) {
            $this->line('Report ID: ' . $report->report_id . ' | Title: ' . $report->title . ' | Type: ' . $report->report_type);
        }
        $this->info('Total: ' . $reports->count() . ' report(s) found.');
        return 0;
    }
}
