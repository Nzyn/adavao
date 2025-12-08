<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\UserController;
use App\Http\Controllers\ReportController;
use App\Http\Controllers\PoliceStationController;
// use App\Http\Controllers\BarangayController;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
|
| Here is where you can register API routes for your application. These
| routes are loaded by the RouteServiceProvider and all of them will
| be assigned to the "api" middleware group. Make something great!
|
*/

Route::middleware('auth:sanctum')->get('/user', function (Request $request) {
    return $request->user();
});

// User management routes
Route::get('/users', [UserController::class, 'index']);
Route::get('/users/{id}', [UserController::class, 'show']);
Route::put('/users/{id}', [UserController::class, 'update']);

// Report management routes
Route::post('/reports', [ReportController::class, 'store']);
Route::get('/reports', [ReportController::class, 'index']);
Route::get('/reports/user/{userId}', [ReportController::class, 'getUserReports']);
Route::get('/reports/count', [ReportController::class, 'getReportCounts']);

// Barangay management routes (commented out - controller missing)
// Route::get('/barangays', [BarangayController::class, 'getAll']);
// Route::post('/barangays/{barangayId}/assign-station', [BarangayController::class, 'assignStation']);
// Route::post('/barangays/find-by-coordinates', [BarangayController::class, 'findByCoordinates']);

// Police station and barangay routes (for offline support in mobile app)
Route::get('/police-stations-with-barangays', [PoliceStationController::class, 'getAllWithBarangays']);
Route::get('/barangays-with-stations', [PoliceStationController::class, 'getBarangaysWithStations']);
Route::get('/police-station-search', [PoliceStationController::class, 'searchByBarangay']);

// For debugging/testing - remove in production
Route::get('/test', function () {
    return response()->json([
        'success' => true,
        'message' => 'API is working',
        'timestamp' => now()
    ]);
});
