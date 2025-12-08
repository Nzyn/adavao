<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class AdminAuditLog extends Model
{
    use HasFactory;

    protected $table = 'admin_audit_log';

    protected $fillable = [
        'user_admin_id',
        'action',
        'table_name',
        'record_id',
        'old_values',
        'new_values',
        'ip_address',
    ];

    protected $casts = [
        'old_values' => 'json',
        'new_values' => 'json',
        'performed_at' => 'datetime',
    ];

    public $timestamps = false;

    /**
     * Get the user admin who performed this action
     */
    public function userAdmin()
    {
        return $this->belongsTo(UserAdmin::class, 'user_admin_id');
    }
}
