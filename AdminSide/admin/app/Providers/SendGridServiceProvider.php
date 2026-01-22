<?php

namespace App\Providers;

use Illuminate\Support\ServiceProvider;
use Illuminate\Support\Facades\Mail;
use App\Mail\Transport\SendGridTransport;

class SendGridServiceProvider extends ServiceProvider
{
    public function register()
    {
        //
    }

    public function boot()
    {
        Mail::extend('sendgrid', function (array $config) {
            return new SendGridTransport($config['api_key']);
        });
    }
}
