<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Artisan;

class MaintenanceController extends Controller
{
    /**
     * Run cleanup commands via HTTP
     */
    public function cleanup(Request $request)
    {
        // Simple authentication - check for secret key
        $secret = $request->input('secret');
        if ($secret !== env('MAINTENANCE_SECRET', 'your-secret-key-here')) {
            return response()->json(['error' => 'Unauthorized'], 403);
        }
        
        $action = $request->input('action');
        
        switch ($action) {
            case 'delete-test-accounts':
                $pattern = $request->input('pattern', 'dansoypatrol');
                Artisan::call('cleanup:test-accounts', ['pattern' => $pattern]);
                $output = Artisan::output();
                
                return response()->json([
                    'success' => true,
                    'message' => 'Test accounts deleted',
                    'output' => $output
                ]);
                
            default:
                return response()->json(['error' => 'Invalid action'], 400);
        }
    }
}
