<?php

namespace App\Events;

use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PresenceChannel;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class UserFlagged implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public $userId;
    public $flagId;
    public $violationType;
    public $reason;
    public $totalFlags;
    public $restrictionApplied;
    public $flaggedAt;
    public $durationDays;
    public $expiresAt;

    /**
     * Create a new event instance.
     */
    public function __construct(
        int $userId,
        int $flagId,
        string $violationType,
        ?string $reason,
        int $totalFlags,
        ?string $restrictionApplied,
        string $flaggedAt,
        ?int $durationDays = null,
        ?string $expiresAt = null
    ) {
        $this->userId = $userId;
        $this->flagId = $flagId;
        $this->violationType = $violationType;
        $this->reason = $reason;
        $this->totalFlags = $totalFlags;
        $this->restrictionApplied = $restrictionApplied;
        $this->flaggedAt = $flaggedAt;
        $this->durationDays = $durationDays;
        $this->expiresAt = $expiresAt;
    }

    /**
     * Get the channels the event should broadcast on.
     *
     * @return array<int, \Illuminate\Broadcasting\Channel>
     */
    public function broadcastOn(): array
    {
        return [
            new PrivateChannel('user.' . $this->userId),
        ];
    }

    /**
     * Get the data to broadcast.
     *
     * @return array<string, mixed>
     */
    public function broadcastWith(): array
    {
        return [
            'flag_id' => $this->flagId,
            'violation_type' => $this->violationType,
            'reason' => $this->reason,
            'total_flags' => $this->totalFlags,
            'restriction_applied' => $this->restrictionApplied,
            'flagged_at' => $this->flaggedAt,
            'duration_days' => $this->durationDays,
            'expires_at' => $this->expiresAt,
            'message' => $this->getNotificationMessage(),
        ];
    }

    /**
     * Get the event name for broadcasting.
     *
     * @return string
     */
    public function broadcastAs(): string
    {
        return 'user.flagged';
    }

    /**
     * Generate notification message based on violation type.
     *
     * @return string
     */
    private function getNotificationMessage(): string
    {
        $violationLabels = [
            'false_report' => 'False Report',
            'prank_spam' => 'Prank/Spam',
            'harassment' => 'Harassment',
            'offensive_content' => 'Offensive Content',
            'impersonation' => 'Impersonation',
            'multiple_accounts' => 'Multiple Accounts',
            'system_abuse' => 'System Abuse',
            'inappropriate_media' => 'Inappropriate Media',
            'misleading_info' => 'Misleading Information',
            'other' => 'Other Violation',
        ];

        $label = $violationLabels[$this->violationType] ?? 'Violation';
        
        $message = "Your account has been flagged for: {$label}";
        
        if ($this->restrictionApplied) {
            $durationText = $this->durationDays ? " for {$this->durationDays} day(s)" : '';
            $message .= ". Restriction applied: {$this->restrictionApplied}{$durationText}";
        }

        return $message;
    }
}
