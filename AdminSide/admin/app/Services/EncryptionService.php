<?php

namespace App\Services;

use Illuminate\Support\Facades\Crypt;
use Illuminate\Contracts\Encryption\DecryptException;
use Illuminate\Support\Facades\Log;

/**
 * AES-256-CBC Encryption Service
 * Provides encryption/decryption for sensitive data
 * Compatible with both Laravel and Node.js encryption formats
 */
class EncryptionService
{
    /**
     * Get the encryption key from Laravel's APP_KEY
     */
    private static function getEncryptionKey()
    {
        $key = config('app.key');
        
        // If key starts with "base64:", decode it
        if (str_starts_with($key, 'base64:')) {
            return base64_decode(substr($key, 7));
        }
        
        return $key;
    }

    /**
     * Encrypt sensitive text data
     * 
     * @param string|null $text
     * @return string|null
     */
    public static function encrypt($text)
    {
        if (empty($text)) {
            return $text;
        }

        try {
            // Laravel's Crypt::encryptString uses AES-256-CBC by default
            return Crypt::encryptString($text);
        } catch (\Exception $e) {
            Log::error('Encryption error: ' . $e->getMessage());
            throw new \Exception('Failed to encrypt data');
        }
    }

    /**
     * Decrypt data encrypted by Node.js encryptionService (simple format)
     * Format: base64(iv + encrypted_data)
     */
    private static function decryptNodeJsFormat($encryptedData)
    {
        try {
            // Decode the base64 data
            $combined = base64_decode($encryptedData, true);
            if ($combined === false) {
                return null;
            }
            
            // Check minimum length (16 bytes IV + at least 1 byte data)
            if (strlen($combined) < 17) {
                return null;
            }
            
            // Extract IV (first 16 bytes) and encrypted text
            $iv = substr($combined, 0, 16);
            $encrypted = substr($combined, 16);
            
            // Try with primary key first
            $key = self::getEncryptionKey();
            
            // Decrypt using AES-256-CBC
            $decrypted = openssl_decrypt(
                $encrypted,
                'aes-256-cbc',
                $key,
                OPENSSL_RAW_DATA,
                $iv
            );
            
            if ($decrypted !== false) {
                return $decrypted;
            }
            
            // Primary key failed — try Node.js hardcoded fallback key
            // (handles case where APP_KEY differs between Laravel and Node.js services)
            $fallbackKey = base64_decode('ciPqFYTQJ2bGZ0NUrfY7mvwODuOZ6zyUTlIh1D+pb+w=');
            if ($fallbackKey !== $key) {
                $decrypted = openssl_decrypt(
                    $encrypted,
                    'aes-256-cbc',
                    $fallbackKey,
                    OPENSSL_RAW_DATA,
                    $iv
                );
                
                if ($decrypted !== false) {
                    return $decrypted;
                }
            }
            
            // Clear any OpenSSL error queue silently
            while (openssl_error_string()) {}
            return null;
        } catch (\Exception $e) {
            return null;
        }
    }

    /**
     * Decrypt encrypted text data
     * Supports both Laravel and Node.js encryption formats
     * 
     * @param string|null $encryptedText
     * @return string|null
     */
    public static function decrypt($encryptedText)
    {
        if (empty($encryptedText) || !is_string($encryptedText)) {
            return $encryptedText;
        }
        
        try {
            // Recursively decrypt to handle multi-layered encryption
            // (caused by old isAlreadyEncrypted bug re-encrypting on every server restart)
            $current = $encryptedText;
            for ($i = 0; $i < 20; $i++) {  // max 20 layers
                $decrypted = self::decryptOnce($current);
                if ($decrypted === $current) break;  // no change = plaintext reached
                $current = $decrypted;
            }
            return $current;
        } catch (\Exception $e) {
            Log::error('Unexpected error during decryption', [
                'error' => $e->getMessage(),
                'data_preview' => substr($encryptedText, 0, 50)
            ]);
            return $encryptedText;
        }
    }

    /**
     * Single-pass decrypt — tries Laravel then Node.js format.
     * Returns original string if neither works.
     */
    private static function decryptOnce($encryptedText)
    {
        if (empty($encryptedText) || !is_string($encryptedText)) {
            return $encryptedText;
        }

        try {
            // First, try Laravel's default decryption (JSON format with MAC)
            try {
                return Crypt::decryptString($encryptedText);
            } catch (\Exception $e) {
                // Laravel format failed, try Node.js simple format
            }
            
            $decrypted = self::decryptNodeJsFormat($encryptedText);
            if ($decrypted !== null) {
                return $decrypted;
            }
            
            // Both formats failed — likely plaintext, return as-is
            return $encryptedText;
        } catch (\Exception $e) {
            return $encryptedText;
        }
    }

    /**
     * Encrypt multiple fields in an array
     * 
     * @param array $data
     * @param array $fields Fields to encrypt
     * @return array
     */
    public static function encryptFields(array $data, array $fields)
    {
        foreach ($fields as $field) {
            if (isset($data[$field]) && !empty($data[$field])) {
                $data[$field] = self::encrypt($data[$field]);
            }
        }

        return $data;
    }

    /**
     * Decrypt multiple fields in an array
     * 
     * @param array $data
     * @param array $fields Fields to decrypt
     * @return array
     */
    public static function decryptFields(array $data, array $fields)
    {
        foreach ($fields as $field) {
            if (isset($data[$field]) && !empty($data[$field])) {
                $data[$field] = self::decrypt($data[$field]);
            }
        }

        return $data;
    }

    /**
     * Decrypt an object/model's fields (for Eloquent models)
     * 
     * @param object $model
     * @param array $fields
     * @return object
     */
    public static function decryptModelFields($model, array $fields)
    {
        foreach ($fields as $field) {
            if (isset($model->$field) && !empty($model->$field)) {
                $model->$field = self::decrypt($model->$field);
            }
        }

        return $model;
    }

    /**
     * Check if user has permission to decrypt data
     * Only police and admin roles can decrypt sensitive data
     * 
     * @param string|null $userRole
     * @return bool
     */
    public static function canDecrypt($userRole)
    {
        $authorizedRoles = ['police', 'admin', 'super_admin'];
        return in_array($userRole, $authorizedRoles);
    }

    /**
     * Check if a string appears to be encrypted
     * Checks for Laravel encryption format (JSON with iv, value, mac)
     * or Node.js format (base64 encoded with specific length)
     * 
     * @param string|null $text
     * @return bool
     */
    public static function isEncrypted($text)
    {
        if (empty($text) || !is_string($text)) {
            return false;
        }

        // Check for Laravel encryption format (base64 JSON with iv, value, mac)
        try {
            $decoded = base64_decode($text, true);
            if ($decoded !== false) {
                $json = json_decode($decoded, true);
                if (is_array($json) && isset($json['iv']) && isset($json['value']) && isset($json['mac'])) {
                    return true;
                }
            }
        } catch (\Exception $e) {
            // Not Laravel format
        }

        // Check for Node.js simple format (base64 with minimum length for IV + data)
        // Minimum: 16 bytes IV + 16 bytes encrypted data (AES block size) = 32 bytes
        // Base64 of 32 bytes = at least 44 characters
        if (strlen($text) >= 44) {
            $decoded = base64_decode($text, true);
            if ($decoded !== false && strlen($decoded) >= 32) {
                // Check if it looks like binary data (has non-printable characters)
                $nonPrintable = preg_match('/[^\x20-\x7E]/', $decoded);
                if ($nonPrintable) {
                    return true;
                }
            }
        }

        return false;
    }
}
