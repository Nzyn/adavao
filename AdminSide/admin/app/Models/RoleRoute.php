<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class RoleRoute extends Model
{
    use HasFactory;
    
    protected $table = 'role_route';
    
    protected $fillable = [
        'role_id',
        'route_id'
    ];
    
    public function role()
    {
        return $this->belongsTo(Role::class, 'role_id', 'role_id');
    }
    
    public function route()
    {
        return $this->belongsTo(Route::class, 'route_id', 'route_id');
    }
}
