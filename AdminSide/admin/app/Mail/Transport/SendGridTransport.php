<?php

namespace App\Mail\Transport;

use Illuminate\Mail\Transport\Transport;
use Swift_Mime_SimpleMessage;
use SendGrid;
use SendGrid\Mail\Mail;

class SendGridTransport extends Transport
{
    protected $apiKey;

    public function __construct($apiKey)
    {
        $this->apiKey = $apiKey;
    }

    public function send(Swift_Mime_SimpleMessage $message, &$failedRecipients = null)
    {
        $this->beforeSendPerformed($message);

        $email = new Mail();
        
        // Set from
        $from = array_keys($message->getFrom())[0];
        $fromName = array_values($message->getFrom())[0] ?? 'AlertDavao';
        $email->setFrom($from, $fromName);

        // Set to
        foreach ($message->getTo() as $address => $name) {
            $email->addTo($address, $name);
        }

        // Set subject
        $email->setSubject($message->getSubject());

        // Set content
        $body = $message->getBody();
        if ($message->getBodyContentType() === 'text/html') {
            $email->addContent("text/html", $body);
        } else {
            $email->addContent("text/plain", $body);
        }

        // Send via SendGrid
        $sendgrid = new SendGrid($this->apiKey);
        try {
            $response = $sendgrid->send($email);
            
            if ($response->statusCode() >= 200 && $response->statusCode() < 300) {
                $this->sendPerformed($message);
                return $this->numberOfRecipients($message);
            } else {
                throw new \Exception('SendGrid API error: ' . $response->statusCode());
            }
        } catch (\Exception $e) {
            throw new \Exception('Failed to send email via SendGrid: ' . $e->getMessage());
        }
    }
}
