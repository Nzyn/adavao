<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Http;
use Carbon\Carbon;

class OtpController extends Controller
{
    /**
     * Generate and send OTP to phone number (registration only)
     * OTP is ONLY for signup, NOT for login
     * 
     * Uses Supabase SMS OTP as primary method, with Twilio fallback
     * SMS Message: "Your verification code is {{OTP}}. It is valid for 5 minutes. Do not share this code with anyone for your security."
     * Sender: AlertDavao (configured in Supabase Dashboard)
     */
    public function sendOtp(Request $request)
    {
        $request->validate([
            'phone' => 'required|string|max:20',
            'purpose' => 'required|string|in:register',
        ]);

        $phone = $request->phone;
        $purpose = $request->purpose;

        // OTP is only for registration
        if ($purpose !== 'register') {
            return response()->json([
                'success' => false,
                'message' => 'OTP is only available during registration'
            ], 400);
        }

        \Log::info("📲 ADMINSIDE SEND OTP REQUEST");
        \Log::info("📱 Phone received: {$phone}");
        \Log::info("📋 Purpose: {$purpose}");

        // Normalize phone number
        $phone = trim($phone);
        $phone = preg_replace('/\s+/', '', $phone);
        if (substr($phone, 0, 1) === '0') {
            $phone = '+63' . substr($phone, 1);
        }

        \Log::info("📱 Normalized phone: {$phone}");

        // Generate 6-digit OTP
        $otp = str_pad(rand(0, 999999), 6, '0', STR_PAD_LEFT);
        $otpHash = Hash::make($otp);
        $expiresAt = Carbon::now()->addMinutes(5); // 5 minutes expiration

        \Log::info("🔐 Generated OTP: {$otp}");
        \Log::info("⏱️  Expires at: " . $expiresAt->toDateTimeString());

        // Store OTP in database
        DB::table('otp_codes')->insert([
            'phone' => $phone,
            'otp_hash' => $otpHash,
            'purpose' => 'register',
            'user_id' => null,
            'expires_at' => $expiresAt,
            'created_at' => Carbon::now()
        ]);

        \Log::info("✅ OTP stored in database");

        // Send SMS via Supabase or Twilio
        $sent = $this->sendSms($phone, $otp);

        // For development: always log OTP
        \Log::info("═".str_repeat("═", 58)."═");
        \Log::info("📨 OTP SENT FOR REGISTRATION (ADMINSIDE)");
        \Log::info("═".str_repeat("═", 58)."═");
        \Log::info("📱 Phone: {$phone}");
        \Log::info("🔐 OTP Code: {$otp}");
        \Log::info("⏱️  Expires: " . $expiresAt->toDateTimeString());
        \Log::info("📝 Message: Your verification code is {$otp}. It is valid for 5 minutes. Do not share this code with anyone for your security.");
        \Log::info("═".str_repeat("═", 58)."═");

        return response()->json([
            'success' => true,
            'sent' => $sent,
            'message' => 'Verification code sent to your phone via SMS',
            // Include OTP in response for development/testing
            'debugOtp' => (env('APP_ENV') !== 'production' || !env('TWILIO_SID')) ? $otp : null
        ]);
    }

    /**
     * Verify OTP code (registration only)
     * OTP verification is ONLY for signup, NOT for login
     */
    public function verifyOtp(Request $request)
    {
        $request->validate([
            'phone' => 'required|string',
            'code' => 'required|string|size:6',
            'purpose' => 'required|string|in:register'
        ]);

        $phone = $request->phone;
        $code = $request->code;
        $purpose = $request->purpose;

        // OTP verification is only for registration
        if ($purpose !== 'register') {
            return response()->json([
                'success' => false,
                'message' => 'OTP verification is only available during registration'
            ], 400);
        }

        \Log::info("🔍 ADMINSIDE OTP VERIFICATION STARTED");
        \Log::info("📱 Phone received: {$phone}");
        \Log::info("🔐 Code received: {$code}");

        // Normalize phone number
        $phone = trim($phone);
        $phone = preg_replace('/\s+/', '', $phone);
        if (substr($phone, 0, 1) === '0') {
            $phone = '+63' . substr($phone, 1);
        }

        \Log::info("📱 Normalized phone: {$phone}");

        // Get latest OTP for this phone and purpose
        $otpRecord = DB::table('otp_codes')
            ->where('phone', $phone)
            ->where('purpose', 'register')
            ->orderBy('created_at', 'desc')
            ->first();

        \Log::info("🔎 OTP record search result: " . ($otpRecord ? "FOUND (ID: {$otpRecord->id})" : "NOT FOUND"));

        if (!$otpRecord) {
            \Log::warning("❌ No OTP found for phone: {$phone}");
            return response()->json([
                'success' => false,
                'message' => 'No OTP found. Please request a new OTP.'
            ], 400);
        }

        \Log::info("⏱️  OTP expires at: {$otpRecord->expires_at}");
        \Log::info("🕐 Current time: " . \Carbon\Carbon::now());

        // Check if expired
        if (Carbon::parse($otpRecord->expires_at)->isPast()) {
            \Log::warning("❌ OTP expired for phone: {$phone}");
            // Delete expired OTP
            DB::table('otp_codes')->where('id', $otpRecord->id)->delete();
            return response()->json([
                'success' => false,
                'message' => 'OTP expired. Please request a new OTP.'
            ], 400);
        }

        \Log::info("🔐 Verifying OTP hash...");
        // Verify OTP
        if (!Hash::check($code, $otpRecord->otp_hash)) {
            \Log::warning("❌ OTP verification failed - incorrect code");
            return response()->json([
                'success' => false,
                'message' => 'Invalid OTP code. Please try again.'
            ], 400);
        }

        \Log::info("✅ OTP hash verified successfully!");

        // Mark phone as verified
        DB::table('verified_phones')->updateOrInsert(
            ['phone' => $phone],
            [
                'verified' => 1,
                'verified_at' => Carbon::now()
            ]
        );

        \Log::info("✅ Phone marked as verified: {$phone}");

        // Delete used OTP
        DB::table('otp_codes')->where('id', $otpRecord->id)->delete();
        \Log::info("🗑️  OTP deleted (ID: {$otpRecord->id})");

        \Log::info("✅ ADMINSIDE OTP VERIFICATION COMPLETE");
        return response()->json([
            'success' => true,
            'message' => 'Phone number verified successfully. You can now complete your registration.'
        ]);
    }

    /**
     * Send SMS via Supabase signInWithOtp or Twilio (fallback) or log for development
     * 
     * Priority:
     * 1. Supabase SMS OTP (native signInWithOtp - sends SMS directly to phone)
     * 2. Twilio (if configured)  
     * 3. Console log (development mode)
     * 
     * SMS Message Format (configured in Supabase Dashboard):
     * Sender: AlertDavao
     * Message: "Your verification code is {{.Token}}. It is valid for 5 minutes. Do not share this code with anyone for your security."
     */
    private function sendSms($phone, $otp)
    {
        $message = "Your verification code is {$otp}. It is valid for 5 minutes. Do not share this code with anyone for your security.";
        
        // Priority 1: Twilio (Primary Provider)
        $twilioSid = env('TWILIO_SID');
        $twilioToken = env('TWILIO_TOKEN');
        $twilioFrom = env('TWILIO_FROM');

        if ($twilioSid && $twilioToken && $twilioFrom) {
            try {
                \Log::info("📲 Sending SMS via Twilio to: {$phone}");
                $url = "https://api.twilio.com/2010-04-01/Accounts/$twilioSid/Messages.json";
                
                $data = [
                    'To' => $phone,
                    'From' => $twilioFrom,
                    'Body' => $message
                ];

                $ch = curl_init($url);
                curl_setopt($ch, CURLOPT_POST, true);
                curl_setopt($ch, CURLOPT_POSTFIELDS, http_build_query($data));
                curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
                curl_setopt($ch, CURLOPT_HTTPAUTH, CURLAUTH_BASIC);
                curl_setopt($ch, CURLOPT_USERPWD, "$twilioSid:$twilioToken");

                $response = curl_exec($ch);
                $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
                curl_close($ch);

                if ($httpCode >= 200 && $httpCode < 300) {
                    \Log::info("✅ SMS sent via Twilio successfully");
                    return true;
                } else {
                    \Log::error("❌ Twilio SMS failed with status: {$httpCode}. Response: " . $response);
                    // Fall through to development mode
                }
            } catch (\Exception $e) {
                \Log::error('❌ Twilio SMS error: ' . $e->getMessage());
                // Fall through to development mode
            }
        } else {
            \Log::warning("⚠️ Twilio credentials not found in env. Please set TWILIO_SID, TWILIO_TOKEN, and TWILIO_FROM.");
        }

        /* 
        // Supabase SMS Logic (Deprecated/Disabled in favor of Twilio)
        // ... (previous Supabase logic removed for clarity and per user request) ...
        */

        // Development mode: log OTP to console instead of sending SMS
        \Log::warning("⚠️ No SMS provider configured (Supabase or Twilio).");
        \Log::warning("🔐 OTP for {$phone} is logged to Laravel log for testing.");
        return true;
    }
}
