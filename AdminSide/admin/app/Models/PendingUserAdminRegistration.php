<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class PendingUserAdminRegistration extends Model
{
    protected $table = 'pending_user_admin_registrations';

    protected $fillable = [
        'firstname',
        'lastname',
        'contact',
        'email',
        'password',
        'user_role',
        'verification_token',
        'token_expires_at',
    ];

    protected $casts = [
        'token_expires_at' => 'datetime',
    ];
}
