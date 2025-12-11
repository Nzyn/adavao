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
            
            // Get encryption key
            $key = self::getEncryptionKey();
            
            // Decrypt using AES-256-CBC
            $decrypted = openssl_decrypt(
                $encrypted,
                'aes-256-cbc',
                $key,
                OPENSSL_RAW_DATA,
                $iv
            );
            
            if ($decrypted === false) {
                 while ($msg = openssl_error_string()) {
                     Log::debug('OpenSSL Error: ' . $msg);
                 }
                return null;
            }
            
            return $decrypted;
        } catch (\Exception $e) {
            Log::debug('Node.js format decryption failed', [
                'error' => $e->getMessage()
            ]);
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
            // First, try Laravel's default decryption (JSON format with MAC)
            $decrypted = Crypt::decryptString($encryptedText);
            Log::debug('Successfully decrypted using Laravel format');
            return $decrypted;
        } catch (DecryptException $e) {
            // Laravel format failed, try Node.js simple format
            Log::debug('Laravel decryption failed, trying Node.js format', [
                'error' => $e->getMessage()
            ]);
            
            $decrypted = self::decryptNodeJsFormat($encryptedText);
            if ($decrypted !== null) {
                Log::debug('Successfully decrypted using Node.js format');
                return $decrypted;
            }
            
            // Both formats failed, return original data
             // This is expected for legacy plaintext data
             Log::debug('Decryption failed for both formats - returning original data (likely plaintext)', [
                 'data_preview' => substr($encryptedText, 0, 50)
             ]);
             return $encryptedText;
        } catch (\Exception $e) {
            Log::error('Unexpected error during decryption', [
                'error' => $e->getMessage(),
                'data_preview' => substr($encryptedText, 0, 50)
            ]);
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
}
