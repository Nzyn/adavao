<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Message extends Model
{
    use HasFactory;

    protected $primaryKey = 'message_id';

    protected $fillable = [
        'sender_id',
        'receiver_id',
        'report_id',
        'message',
        'status',
        'sent_at',
    ];

    protected $casts = [
        'status' => 'boolean',
        'sent_at' => 'datetime',
    ];

    /**
     * Get the sender (user) of the message
     */
    public function sender()
    {
        return $this->belongsTo(User::class, 'sender_id');
    }

    /**
     * Get the receiver (user) of the message
     */
    public function receiver()
    {
        return $this->belongsTo(User::class, 'receiver_id');
    }

    /**
     * Get the report associated with the message
     */
    public function report()
    {
        return $this->belongsTo(Report::class, 'report_id');
    }
}
