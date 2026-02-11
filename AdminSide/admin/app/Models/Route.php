<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Route extends Model
{
    use HasFactory;
    
    protected $primaryKey = 'route_id';
    
    protected $fillable = [
        'route_name'
    ];
    
    public function roles()
    {
        return $this->belongsToMany(Role::class, 'role_route', 'route_id', 'role_id');
    }
}
