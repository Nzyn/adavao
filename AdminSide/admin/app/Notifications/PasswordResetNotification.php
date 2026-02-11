<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class PasswordResetNotification extends Notification
{
    use Queueable;

    private $resetUrl;
    private $userName;

    /**
     * Create a new notification instance.
     */
    public function __construct($resetUrl, $userName)
    {
        $this->resetUrl = $resetUrl;
        $this->userName = $userName;
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
            ->subject('Reset Your Password - AlertDavao')
            ->greeting('Hello ' . $this->userName . '!')
            ->line('You are receiving this email because we received a password reset request for your account.')
            ->action('Reset Password', $this->resetUrl)
            ->line('This password reset link will expire in 1 hour.')
            ->line('If you did not request a password reset, no further action is required.')
            ->salutation('Best regards, AlertDavao Team');
    }

    /**
     * Get the array representation of the notification.
     */
    public function toArray($notifiable): array
    {
        return [
            'reset_url' => $this->resetUrl
        ];
    }
}
