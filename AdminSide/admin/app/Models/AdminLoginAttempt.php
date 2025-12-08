<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class AdminLoginAttempt extends Model
{
    use HasFactory;

    protected $table = 'admin_login_attempts';

    protected $fillable = [
        'user_admin_id',
        'email',
        'ip_address',
        'user_agent',
        'status',
    ];

    protected $casts = [
        'attempted_at' => 'datetime',
    ];

    public $timestamps = false;

    /**
     * Get the user admin
     */
    public function userAdmin()
    {
        return $this->belongsTo(UserAdmin::class, 'user_admin_id');
    }
}
