import { supabase } from '../config/supabase';
import { getOptimalBackendUrl } from '../config/backend';

export interface OtpResult {
  success: boolean;
  message: string;
  error?: any;
  debugOtp?: string; // For fallback development mode
}

/**
 * Send OTP to phone number via Supabase SMS
 * NOTE: OTP is currently disabled - this function is not in use
 * OTP is only sent during signup for phone number verification
 * Uses Supabase's native signInWithOtp which sends SMS directly to user's phone
 * 
 * @param phone - Phone number in international format (e.g., +639123456789)
 * @returns Promise with result
 */
export async function sendSupabaseOtp(phone: string): Promise<OtpResult> {
  try {
    // Normalize phone number
    const normalizedPhone = normalizePhoneNumber(phone);
    console.log('📱 Sending OTP via Supabase SMS to:', normalizedPhone);
    
    // Check if Supabase client is available
    if (supabase) {
      try {
        // Use Supabase native OTP sending via signInWithOtp
        // This sends SMS directly to the user's phone number
        const { data, error } = await supabase.auth.signInWithOtp({
          phone: normalizedPhone,
          options: {
            channel: 'sms',
          },
        });

        if (error) {
          console.error('❌ Supabase OTP send error:', error);
          // Fall through to backend fallback
          throw error;
        }

        console.log('✅ Supabase OTP sent successfully via SMS');
        return {
          success: true,
          message: 'Verification code sent to your phone via SMS',
        };
      } catch (supabaseError: any) {
        console.warn('⚠️ Supabase SMS failed, trying backend fallback:', supabaseError.message);
        // Fall through to backend fallback
      }
    }

    // Fallback to backend OTP if Supabase is not configured or fails
    console.log('📲 Using backend fallback for OTP...');
    const backendUrl = await getOptimalBackendUrl();
    const response = await fetch(`${backendUrl}/api/send-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone: normalizedPhone, purpose: 'register' })
    });
    
    const responseData = await response.json();
    
    if (!response.ok) {
      return {
        success: false,
        message: responseData.message || 'Failed to send OTP',
      };
    }
    
    // For development: log OTP to console if SMS provider not configured
    if (responseData.debugOtp) {
      console.log('🔐🔐🔐 DEVELOPMENT OTP CODE:', responseData.debugOtp, '🔐🔐🔐');
    }
    
    return {
      success: true,
      message: 'Verification code sent to your phone',
      debugOtp: responseData.debugOtp,
    };
  } catch (err: any) {
    console.error('❌ Exception sending OTP:', err);
    return {
      success: false,
      message: err.message || 'Failed to send OTP',
      error: err,
    };
  }
}

/**
 * Verify OTP code via Supabase
 * Uses Supabase's native verifyOtp for SMS verification
 * 
 * @param phone - Phone number in international format
 * @param token - 6-digit OTP code
 * @returns Promise with result
 */
export async function verifySupabaseOtp(phone: string, token: string): Promise<OtpResult> {
  try {
    // Normalize phone number
    const normalizedPhone = normalizePhoneNumber(phone);
    console.log('🔐 Verifying OTP for:', normalizedPhone);
    
    // Check if Supabase client is available
    if (supabase) {
      try {
        // Use Supabase native OTP verification
        const { data, error } = await supabase.auth.verifyOtp({
          phone: normalizedPhone,
          token: token,
          type: 'sms',
        });

        if (error) {
          console.error('❌ Supabase OTP verify error:', error);
          return {
            success: false,
            message: error.message || 'Invalid verification code',
          };
        }

        console.log('✅ Supabase OTP verified successfully');
        
        // Sign out immediately since we're only using this for phone verification
        // We don't want to create a Supabase session, just verify the phone
        await supabase.auth.signOut();
        
        return {
          success: true,
          message: 'Phone number verified successfully',
        };
      } catch (supabaseError: any) {
        console.warn('⚠️ Supabase verification failed, trying backend fallback:', supabaseError.message);
        // Fall through to backend fallback
      }
    }

    // Fallback to backend verification
    console.log('📲 Using backend fallback for OTP verification...');
    const backendUrl = await getOptimalBackendUrl();
    const response = await fetch(`${backendUrl}/api/verify-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone: normalizedPhone, code: token, purpose: 'register' })
    });
    
    const responseData = await response.json();
    
    if (!response.ok) {
      return {
        success: false,
        message: responseData.message || 'Invalid verification code',
      };
    }

    console.log('✅ OTP verified successfully via backend');
    return {
      success: true,
      message: 'Phone number verified successfully',
    };
  } catch (err: any) {
    console.error('❌ Exception verifying OTP:', err);
    return {
      success: false,
      message: err.message || 'Failed to verify OTP',
      error: err,
    };
  }
}

/**
 * Normalize phone number to international format
 * Converts Philippine numbers starting with 0 to +63 format
 * @param phone - Phone number
 * @returns Normalized phone number
 */
export function normalizePhoneNumber(phone: string): string {
  let normalized = phone.trim().replace(/\s+/g, '');
  
  // If starts with 0, replace with +63
  if (normalized.startsWith('0')) {
    normalized = '+63' + normalized.slice(1);
  }
  
  // If doesn't start with +, assume it's Philippine and add +63
  if (!normalized.startsWith('+')) {
    normalized = '+63' + normalized;
  }
  
  return normalized;
}
