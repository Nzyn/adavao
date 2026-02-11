<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\Report;
use App\Models\ReportMedia;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\File;

class CheckReportMedia extends Command
{
    protected $signature = 'check:report-media {--fix : Attempt to fix issues} {--report-id= : Check specific report ID}';
    protected $description = 'Check report media files and verify they are accessible';

    public function handle()
    {
        $this->line('=== Report Media Verification Tool ===\n');

        // Check storage configuration
        $this->checkStorageConfig();

        // Check for reports with media
        $this->checkReportMedia();

        // Check physical file existence
        $this->checkPhysicalFiles();

        if ($this->option('fix')) {
            $this->fixIssues();
        }

        $this->info('\n✓ Check completed');
    }

    private function checkStorageConfig()
    {
        $this->line('📋 Storage Configuration:');
        
        $publicDiskRoot = storage_path('app/public');
        $publicWebPath = public_path('storage');
        
        $this->info("  Public Disk Root: {$publicDiskRoot}");
        $this->info("  Public Web Path: {$publicWebPath}");
        $this->info("  APP_URL: " . config('app.url'));
        $this->info("  Filesystem Disk: " . config('filesystems.default'));
        
        if (is_link($publicWebPath)) {
            $this->info("  ✓ Storage symlink exists");
        } else {
            $this->warn("  ✗ Storage symlink MISSING - images may not be accessible!");
            if ($this->option('fix')) {
                $this->line("    Creating symlink...");
                $this->call('storage:link');
            }
        }
        
        $this->line('');
    }

    private function checkReportMedia()
    {
        $this->line('📊 Report Media Analysis:');
        
        $query = Report::with('media');
        
        if ($this->option('report-id')) {
            $query->where('report_id', $this->option('report-id'));
        }
        
        $reports = $query->get();
        
        if ($reports->isEmpty()) {
            $this->warn("  No reports found");
            return;
        }
        
        $totalReports = $reports->count();
        $reportsWithMedia = 0;
        $mediaCount = 0;
        $missingFiles = 0;
        
        foreach ($reports as $report) {
            if ($report->media && count($report->media) > 0) {
                $reportsWithMedia++;
                foreach ($report->media as $media) {
                    $mediaCount++;
                    
                    $exists = Storage::disk('public')->exists($media->media_url);
                    
                    if (!$exists) {
                        $missingFiles++;
                        $this->warn("  Report #{$report->report_id}: Missing file - {$media->media_url}");
                    } else {
                        $size = Storage::disk('public')->size($media->media_url);
                        $this->info("  Report #{$report->report_id}: ✓ {$media->media_url} ({$size} bytes)");
                    }
                }
            }
        }
        
        $this->line("\n  Summary:");
        $this->info("    Total Reports: {$totalReports}");
        $this->info("    Reports with Media: {$reportsWithMedia}");
        $this->info("    Total Media Files: {$mediaCount}");
        if ($missingFiles > 0) {
            $this->warn("    Missing Files: {$missingFiles}");
        } else {
            $this->info("    Missing Files: 0");
        }
        
        $this->line('');
    }

    private function checkPhysicalFiles()
    {
        $this->line('🔍 Physical File Check:');
        
        $publicPath = storage_path('app/public');
        $reportsPath = $publicPath . '/reports';
        
        if (!File::isDirectory($reportsPath)) {
            $this->warn("  Reports directory does not exist: {$reportsPath}");
            if ($this->option('fix')) {
                File::makeDirectory($reportsPath, 0755, true);
                $this->info("  ✓ Created reports directory");
            }
            return;
        }
        
        $files = File::files($reportsPath);
        $this->info("  Files in {$reportsPath}: " . count($files));
        
        if (count($files) === 0) {
            $this->warn("  ⚠ No files found in reports directory");
        } else {
            foreach ($files as $file) {
                $relativePath = str_replace($publicPath . '/', '', $file->getRealPath());
                $this->info("  ✓ {$relativePath}");
            }
        }
        
        $this->line('');
    }

    private function fixIssues()
    {
        $this->line('🔧 Attempting to fix issues...\n');
        
        // 1. Create storage link if missing
        if (!is_link(public_path('storage'))) {
            $this->info('Creating storage symlink...');
            $this->call('storage:link');
        }
        
        // 2. Create reports directory if missing
        $reportsPath = storage_path('app/public/reports');
        if (!File::isDirectory($reportsPath)) {
            File::makeDirectory($reportsPath, 0755, true);
            $this->info("✓ Created reports directory");
        }
        
        // 3. Check and fix database entries
        $this->info('Verifying database entries...');
        $brokenReferences = 0;
        
        $media = ReportMedia::all();
        foreach ($media as $item) {
            $exists = Storage::disk('public')->exists($item->media_url);
            if (!$exists) {
                $brokenReferences++;
                $this->warn("Broken reference: Report #{$item->report_id}, Media ID: {$item->media_id}");
            }
        }
        
        if ($brokenReferences === 0) {
            $this->info("✓ All media references are valid");
        }
        
        $this->info('✓ Fix attempt completed');
    }
}
