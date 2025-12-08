<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class UserAdminRole extends Model
{
    use HasFactory;

    protected $table = 'user_admin_roles';

    protected $fillable = [
        'user_admin_id',
        'role_id',
        'assigned_by',
    ];

    protected $casts = [
        'assigned_at' => 'datetime',
    ];

    public $timestamps = false;

    /**
     * Get the admin user
     */
    public function user()
    {
        return $this->belongsTo(UserAdmin::class, 'user_admin_id');
    }

    /**
     * Get the role
     */
    public function role()
    {
        return $this->belongsTo(AdminRole::class, 'role_id');
    }

    /**
     * Get the user who assigned this role
     */
    public function assignedBy()
    {
        return $this->belongsTo(UserAdmin::class, 'assigned_by');
    }
}
