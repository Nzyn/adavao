<?php

namespace App\Mail\Transport;

use Symfony\Component\Mailer\SentMessage;
use Symfony\Component\Mailer\Transport\AbstractTransport;
use Symfony\Component\Mime\MessageConverter;
use SendGrid;
use SendGrid\Mail\Mail;
use Psr\EventDispatcher\EventDispatcherInterface;
use Psr\Log\LoggerInterface;

class SendGridTransport extends AbstractTransport
{
    protected $apiKey;

    public function __construct(string $apiKey, EventDispatcherInterface $dispatcher = null, LoggerInterface $logger = null)
    {
        parent::__construct($dispatcher, $logger);
        $this->apiKey = $apiKey;
    }

    protected function doSend(SentMessage $message): void
    {
        $email = new Mail();
        $originalMessage = $message->getOriginalMessage();
        
        // Set from
        $from = $originalMessage->getFrom()[0];
        $email->setFrom($from->getAddress(), $from->getName() ?? 'AlertDavao');

        // Set to
        foreach ($originalMessage->getTo() as $recipient) {
            $email->addTo($recipient->getAddress(), $recipient->getName() ?? '');
        }

        // Set subject
        $email->setSubject($originalMessage->getSubject());

        // Set content
        $body = $originalMessage->getBody()->toString();
        if (str_contains($originalMessage->getHeaders()->get('Content-Type')->getBodyAsString(), 'text/html')) {
            $email->addContent("text/html", $body);
        } else {
            $email->addContent("text/plain", $body);
        }

        // Send via SendGrid
        $sendgrid = new SendGrid($this->apiKey);
        try {
            $response = $sendgrid->send($email);
            
            if ($response->statusCode() < 200 || $response->statusCode() >= 300) {
                throw new \Exception('SendGrid API error: ' . $response->statusCode());
            }
        } catch (\Exception $e) {
            throw new \Exception('Failed to send email via SendGrid: ' . $e->getMessage());
        }
    }

    public function __toString(): string
    {
        return 'sendgrid';
    }
}
