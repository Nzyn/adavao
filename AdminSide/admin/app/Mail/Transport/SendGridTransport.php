<?php

namespace App\Mail\Transport;

use Symfony\Component\Mailer\SentMessage;
use Symfony\Component\Mailer\Transport\AbstractTransport;
use Symfony\Component\Mime\MessageConverter;
use Symfony\Component\Mime\Part\AbstractPart;
use Symfony\Component\Mime\Part\TextPart;
use SendGrid;
use SendGrid\Mail\Mail;
use Psr\EventDispatcher\EventDispatcherInterface;
use Psr\Log\LoggerInterface;

class SendGridTransport extends AbstractTransport
{
    protected $apiKey;

    private function findTextPart(AbstractPart $part, string $wantedSubtype): ?TextPart
    {
        if ($part instanceof TextPart) {
            if (method_exists($part, 'getMediaSubtype') && $part->getMediaSubtype() === $wantedSubtype) {
                return $part;
            }
        }

        if (method_exists($part, 'getParts')) {
            foreach ($part->getParts() as $child) {
                $found = $this->findTextPart($child, $wantedSubtype);
                if ($found) {
                    return $found;
                }
            }
        }

        return null;
    }

    private function textPartBody(?TextPart $part): ?string
    {
        if (!$part) {
            return null;
        }

        $body = $part->getBody();
        if (is_resource($body)) {
            $body = stream_get_contents($body);
        }

        if (!is_string($body)) {
            return null;
        }

        return $body;
    }

    public function __construct(string $apiKey, EventDispatcherInterface $dispatcher = null, LoggerInterface $logger = null)
    {
        parent::__construct($dispatcher, $logger);
        $this->apiKey = $apiKey;
    }

    protected function doSend(SentMessage $message): void
    {
        $email = new Mail();
        $originalMessage = $message->getOriginalMessage();
        $originalEmail = MessageConverter::toEmail($originalMessage);
        
        // Set from
        $from = $originalEmail->getFrom()[0];
        $email->setFrom($from->getAddress(), $from->getName() ?? 'AlertDavao');

        // Set to
        foreach ($originalEmail->getTo() as $recipient) {
            $email->addTo($recipient->getAddress(), $recipient->getName() ?? '');
        }

        // Set subject
        $email->setSubject($originalEmail->getSubject());

        // Set content
        // IMPORTANT: don't use Part::toString() here; it includes MIME headers and quoted-printable encoding.
        // Extract the raw body from the relevant MIME parts.
        $bodyPart = $originalEmail->getBody();
        $textBody = $this->textPartBody($this->findTextPart($bodyPart, 'plain'));
        $htmlBody = $this->textPartBody($this->findTextPart($bodyPart, 'html'));

        if ($textBody !== null && $textBody !== '') {
            $email->addContent('text/plain', $textBody);
        }

        if ($htmlBody !== null && $htmlBody !== '') {
            $email->addContent('text/html', $htmlBody);
        }

        if (($htmlBody === null || $htmlBody === '') && ($textBody === null || $textBody === '')) {
            $email->addContent('text/plain', 'Email content could not be rendered.');
        }

        // Disable click tracking and open tracking to prevent URL wrapping
        $email->setClickTracking(false, false);
        $email->setOpenTracking(false);

        // Send via SendGrid
        $sendgrid = new SendGrid($this->apiKey);
        try {
            $response = $sendgrid->send($email);
            
            if ($response->statusCode() < 200 || $response->statusCode() >= 300) {
                $errorBody = $response->body();
                \Log::error('SendGrid API Error Details', [
                    'status' => $response->statusCode(),
                    'body' => $errorBody,
                    'from' => $from->getAddress(),
                ]);
                
                if ($response->statusCode() === 403) {
                    throw new \Exception('SendGrid 403: Sender email not verified. Please verify ' . $from->getAddress() . ' in SendGrid dashboard.');
                }
                
                throw new \Exception('SendGrid API error: ' . $response->statusCode() . ' - ' . $errorBody);
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
