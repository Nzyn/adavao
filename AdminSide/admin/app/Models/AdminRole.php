<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class AdminRole extends Model
{
    use HasFactory;

    protected $table = 'roles';
    protected $primaryKey = 'role_id';

    protected $fillable = [
        'role_name',
        'description',
        'level',
    ];

    protected $casts = [
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    /**
     * Get all users assigned this role
     */
    public function users()
    {
        return $this->belongsToMany(
            UserAdmin::class,
            'user_admin_roles',
            'role_id',
            'user_admin_id'
        );
    }

    /**
     * Get all permissions assigned to this role
     */
    public function permissions()
    {
        return $this->belongsToMany(
            AdminPermission::class,
            'admin_role_permissions',
            'role_id',
            'permission_id'
        );
    }

    /**
     * Check if this role has a specific permission
     */
    public function hasPermission($permissionName)
    {
        return $this->permissions()
            ->where('permission_name', $permissionName)
            ->exists();
    }
}
