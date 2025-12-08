<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class AccountLockoutNotification extends Notification
{
    use Queueable;

    private $attemptCount;

    /**
     * Create a new notification instance.
     */
    public function __construct($attemptCount)
    {
        $this->attemptCount = $attemptCount;
    }

    /**
     * Get the notification's delivery channels.
     */
    public function via($notifiable): array
    {
        return ['mail'];
    }

    /**
     * Get the mail representation of the notification.
     */
    public function toMail($notifiable): MailMessage
    {
        return (new MailMessage)
            ->subject('Security Alert: Account Locked - AlertDavao')
            ->greeting('Hello ' . $notifiable->firstname . '!')
            ->line('This is a security alert regarding your AlertDavao account.')
            ->line("Your account has been temporarily locked due to {$this->attemptCount} consecutive failed login attempts.")
            ->line('**Account Status:** Locked for 15 minutes')
            ->line('**Security Recommendations:**')
            ->line('• If this was you, please wait 15 minutes and try again with the correct password')
            ->line('• If this was not you, someone may be trying to access your account')
            ->line('• Consider changing your password after regaining access')
            ->line('• Enable two-factor authentication if available')
            ->line('If you did not attempt to log in, please contact AlertDavao support immediately.')
            ->action('Reset Password', url('/forgot-password'))
            ->line('For security assistance, contact: support@alertdavao.com')
            ->salutation('Stay safe, AlertDavao Security Team');
    }

    /**
     * Get the array representation of the notification.
     */
    public function toArray($notifiable): array
    {
        return [
            'attempt_count' => $this->attemptCount,
            'locked_until' => now()->addMinutes(15)->toDateTimeString()
        ];
    }
}
