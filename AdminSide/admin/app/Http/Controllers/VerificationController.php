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
            
            // Decrypt image paths on a cloned collection to avoid mutating cached models
            $decrypted = $verifications->map(function($v) {
                $clone = clone $v;
                $clone->id_picture = EncryptionService::decrypt($clone->id_picture);
                $clone->id_selfie = EncryptionService::decrypt($clone->id_selfie);
                $clone->billing_document = EncryptionService::decrypt($clone->billing_document);
                return $clone;
            });
            
            // Log the first few verifications for debugging
            if ($decrypted->count() > 0) {
                $sampleData = $decrypted->take(3)->map(function($v) {
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
                'data' => $decrypted
            ]);
        } catch (\Exception $e) {
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
            
            // Decrypt image paths on cloned models
            $decrypted = $verifications->map(function($v) {
                $clone = clone $v;
                $clone->id_picture = EncryptionService::decrypt($clone->id_picture);
                $clone->id_selfie = EncryptionService::decrypt($clone->id_selfie);
                $clone->billing_document = EncryptionService::decrypt($clone->billing_document);
                return $clone;
            });
            
            return response()->json([
                'success' => true,
                'data' => $decrypted
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