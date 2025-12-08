<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Verification extends Model
{
    use HasFactory;

    protected $primaryKey = 'verification_id';

    protected $fillable = [
        'user_id',
        'otp_code',
        'expiration',
        'status',
        'id_picture',
        'id_selfie',
        'billing_document',
        'is_verified',
    ];

    protected $casts = [
        'expiration' => 'datetime',
        'is_verified' => 'boolean',
    ];
    
    public function user()
    {
        return $this->belongsTo(User::class, 'user_id', 'id');
    }
}