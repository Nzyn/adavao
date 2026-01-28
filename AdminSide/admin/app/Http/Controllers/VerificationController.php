<?php

namespace App\Http\Controllers;

use App\Models\Verification;
use App\Models\User;
use App\Services\EncryptionService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Cache;

class VerificationController extends Controller
{
    /**
     * Get all verification requests
     */
    public function getAllVerifications()
    {
        try {
            $verifications = Cache::remember('verifications_all', 60, function() {
                return Verification::with('user')
                    ->orderBy('created_at', 'desc')
                    ->get();
            });
            
            // Debug log
            Log::info('getAllVerifications called', ['count' => $verifications->count()]);
            
            // Decrypt image paths for each verification
            $verifications = $verifications->map(function($v) {
                // Decrypt the image path fields using the EncryptionService
                $v->id_picture = EncryptionService::decrypt($v->id_picture);
                $v->id_selfie = EncryptionService::decrypt($v->id_selfie);
                $v->billing_document = EncryptionService::decrypt($v->billing_document);
                return $v;
            });
            
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
                        // Add image paths for debugging
                        'id_picture' => $v->id_picture,
                        'id_selfie' => $v->id_selfie,
                        'billing_document' => $v->billing_document,
                    ];
                });
                Log::info('Sample verifications data (decrypted)', ['data' => $sampleData]);
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
            $verifications = Cache::remember('verifications_pending', 60, function() {
                return Verification::with('user')
                    ->where('status', 'pending')
                    ->orderBy('created_at', 'desc')
                    ->get();
            });
            
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
            'userId' => 'required|exists:users_public,id'
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
            
            // Invalidate cache
            Cache::forget('verifications_all');
            Cache::forget('verifications_pending');

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
            'userId' => 'required|exists:users_public,id',
            'rejection_reason' => 'required|string|max:500'
        ]);
        
        try {
            // Update verification status
            $verification = Verification::findOrFail($request->verificationId);
            $verification->status = 'rejected';
            $verification->is_verified = false;
            $verification->rejection_reason = $request->rejection_reason;
            $verification->save();
            
            // Note: We don't update the user's is_verified status here because they should be able to resubmit
            
            // Invalidate cache
            Cache::forget('verifications_all');
            Cache::forget('verifications_pending');
            
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