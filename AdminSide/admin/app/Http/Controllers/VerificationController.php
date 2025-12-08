<?php

namespace App\Http\Controllers;

use App\Models\Verification;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class VerificationController extends Controller
{
    /**
     * Get all verification requests
     */
    public function getAllVerifications()
    {
        try {
            $verifications = Verification::with('user')
                ->orderBy('created_at', 'desc')
                ->get();
            
            // Debug log
            Log::info('getAllVerifications called', ['count' => $verifications->count()]);
            
            // Log the first few verifications for debugging
            if ($verifications->count() > 0) {
                $sampleData = $verifications->take(3)->map(function($v) {
                    return [
                        'verification_id' => $v->verification_id,
                        'user_id' => $v->user_id,
                        'user_exists' => $v->user ? true : false,
                        'user_firstname' => $v->user ? $v->user->firstname : null,
                        'user_lastname' => $v->user ? $v->user->lastname : null,
                        'status' => $v->status,
                        'created_at' => $v->created_at,
                    ];
                });
                Log::info('Sample verifications data', ['data' => $sampleData]);
            }
            
            return response()->json([
                'success' => true,
                'data' => $verifications
            ]);
        } catch (\Exception $e) {
            // Debug log
            Log::error('Error in getAllVerifications', [
                'message' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch verification requests',
                'error' => $e->getMessage()
            ], 500);
        }
    }
    
    /**
     * Get pending verification requests
     */
    public function getPendingVerifications()
    {
        try {
            $verifications = Verification::with('user')
                ->where('status', 'pending')
                ->orderBy('created_at', 'desc')
                ->get();
            
            return response()->json([
                'success' => true,
                'data' => $verifications
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch verification requests',
                'error' => $e->getMessage()
            ], 500);
        }
    }
    
    /**
     * Approve verification request
     */
    public function approveVerification(Request $request)
    {
        $request->validate([
            'verificationId' => 'required|exists:verifications,verification_id',
            'userId' => 'required|exists:users,id'
        ]);
        
        try {
            // Update verification status
            $verification = Verification::findOrFail($request->verificationId);
            $verification->status = 'verified';
            $verification->is_verified = true;
            $verification->save();
            
            // Update user's is_verified status
            $user = User::findOrFail($request->userId);
            $user->is_verified = true;
            $user->save();
            
            return response()->json([
                'success' => true,
                'message' => 'Verification approved successfully'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to approve verification',
                'error' => $e->getMessage()
            ], 500);
        }
    }
    
    /**
     * Reject verification request
     */
    public function rejectVerification(Request $request)
    {
        $request->validate([
            'verificationId' => 'required|exists:verifications,verification_id',
            'userId' => 'required|exists:users,id'
        ]);
        
        try {
            // Update verification status
            $verification = Verification::findOrFail($request->verificationId);
            $verification->status = 'rejected';
            $verification->is_verified = false;
            $verification->save();
            
            // Note: We don't update the user's is_verified status here because they should be able to resubmit
            
            return response()->json([
                'success' => true,
                'message' => 'Verification rejected successfully'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to reject verification',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}