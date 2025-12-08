<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Symfony\Component\Process\Process;

class ServeWithSarimax extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'serve:sarimax {--host=127.0.0.1} {--port=8000}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Start Laravel development server with SARIMAX API';

    /**
     * Execute the console command.
     *
     * @return int
     */
    public function handle()
    {
        $host = $this->option('host');
        $port = $this->option('port');

        $this->info('Starting SARIMAX API on port 8001...');
        
        // Start SARIMAX API in background
        // Correct path: base_path() is .../admin, so we go up one level to AdminSide/sarima_api
        $sarimaxPath = base_path('../sarima_api');
        $pythonCommand = "python main.py";
        
        // For Windows, use start command to run in background
        if (PHP_OS_FAMILY === 'Windows') {
            $sarimaxProcess = Process::fromShellCommandline(
                "start /B cmd /c \"cd /d {$sarimaxPath} && {$pythonCommand} > sarimax.log 2>&1\"",
                null,
                null,
                null,
                null
            );
        } else {
            // For Linux/Mac
            $sarimaxProcess = Process::fromShellCommandline(
                "cd {$sarimaxPath} && {$pythonCommand} > sarimax.log 2>&1 &",
                null,
                null,
                null,
                null
            );
        }
        
        $sarimaxProcess->start();
        
        // Wait a bit for SARIMAX to start
        $this->info('Waiting for SARIMAX API to initialize...');
        sleep(5);
        
        $this->info('✓ SARIMAX API started on http://localhost:8001');
        $this->info('✓ Logs available at: ' . $sarimaxPath . '/sarimax.log');
        $this->newLine();

        // Warm up Cache
        $this->info('🔥 Warming up statistics cache...');
        try {
            $controller = app()->make(\App\Http\Controllers\StatisticsController::class);
            if ($controller->warmUpCache()) {
                $this->info('✓ Cache warmed up successfully.');
            } else {
                $this->warn('⚠ Cache warm-up completed with issues. Check logs.');
            }
        } catch (\Exception $e) {
            $this->warn('⚠ Could not warm up cache: ' . $e->getMessage());
        }
        $this->newLine();
        
        $this->info("Starting Laravel development server on http://{$host}:{$port}...");
        $this->newLine();
        
        // Start Laravel server (this will block)
        $laravelProcess = Process::fromShellCommandline(
            "php -S {$host}:{$port} -t public",
            base_path(),
            null,
            null,
            null
        );
        
        $laravelProcess->setTimeout(null);
        
        // Handle Ctrl+C to stop both processes
        if (function_exists('pcntl_signal')) {
            pcntl_signal(SIGINT, function() use ($sarimaxProcess) {
                $this->info("\nShutting down servers...");
                $sarimaxProcess->stop();
                exit(0);
            });
        }
        
        try {
            $laravelProcess->run(function ($type, $buffer) {
                echo $buffer;
            });
        } catch (\Exception $e) {
            $this->error('Server stopped: ' . $e->getMessage());
            $sarimaxProcess->stop();
            return 1;
        }

        return 0;
    }
}
