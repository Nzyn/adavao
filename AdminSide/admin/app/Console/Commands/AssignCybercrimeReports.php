<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\Report;
use App\Models\PoliceStation;

class AssignCybercrimeReports extends Command
{
    protected $signature = 'assign:cybercrime-reports';
    protected $description = 'Assign all cybercrime reports to the Cybercrime Division police station';

    public function handle()
    {
        $cybercrimeStation = PoliceStation::where('station_name', 'Cybercrime Division')->first();
        if (!$cybercrimeStation) {
            $this->error('Cybercrime Division station not found.');
            return 1;
        }
        $updated = 0;
        $reports = Report::all();
        foreach ($reports as $report) {
            $types = [];
            if (is_array($report->report_type)) {
                $types = $report->report_type;
            } elseif (is_string($report->report_type)) {
                $decoded = json_decode($report->report_type, true);
                if (is_array($decoded)) {
                    $types = $decoded;
                }
            }
            if (in_array('cybercrime', $types)) {
                $report->assigned_station_id = $cybercrimeStation->station_id;
                $report->save();
                $updated++;
            }
        }
        $this->info("Updated $updated reports to Cybercrime Division.");
        return 0;
    }
}
