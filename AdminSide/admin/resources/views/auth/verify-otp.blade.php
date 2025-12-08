<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>AlertDavao - Security Verification</title>
    <link rel="preconnect" href="https://fonts.bunny.net">
    <link href="https://fonts.bunny.net/css?family=inter:400,500,600,700&display=swap" rel="stylesheet" />
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css" integrity="sha512-9usAa10IRO0HhonpyAIVpjrylPvoDwiPUiKdWk5t3PyolY1cOd4DSE0Ga+ri4AuTroPR5aQvXU9xC6qOPnzFeg==" crossorigin="anonymous" referrerpolicy="no-referrer" />
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: 'Inter', sans-serif;
            background-color: #f8fafc;
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 20px;
        }

        .auth-container {
            background: white;
            border-radius: 16px;
            box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
            overflow: hidden;
            display: flex;
            max-width: 900px;
            width: 100%;
            min-height: 500px;
            border: 3px solid #3b82f6;
        }

        .auth-image {
            flex: 1;
            background-image: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 400"><defs><linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" style="stop-color:%234f46e5;stop-opacity:0.8" /><stop offset="100%" style="stop-color:%236366f1;stop-opacity:0.9" /></linearGradient></defs><rect width="600" height="400" fill="url(%23bg)"/><rect x="50" y="50" width="500" height="150" fill="white" opacity="0.1" rx="8"/><rect x="70" y="220" width="460" height="130" fill="white" opacity="0.1" rx="8"/><circle cx="150" cy="120" r="15" fill="white" opacity="0.3"/><circle cx="200" cy="140" r="12" fill="white" opacity="0.3"/><circle cx="250" cy="110" r="18" fill="white" opacity="0.3"/><circle cx="300" cy="135" r="14" fill="white" opacity="0.3"/><circle cx="350" cy="115" r="16" fill="white" opacity="0.3"/><circle cx="400" cy="125" r="13" fill="white" opacity="0.3"/><circle cx="450" cy="105" r="15" fill="white" opacity="0.3"/></svg>');
            background-size: cover;
            background-position: center;
            position: relative;
            display: none;
        }

        .auth-form {
            flex: 1;
            padding: 3rem 2.5rem;
            display: flex;
            flex-direction: column;
            justify-content: center;
            max-width: 400px;
            margin: auto;
        }

        .auth-title {
            font-size: 1.5rem;
            font-weight: 700;
            color: #1f2937;
            margin-bottom: 0.5rem;
            text-align: center;
        }

        .auth-subtitle {
            color: #6b7280;
            font-size: 0.875rem;
            margin-bottom: 2rem;
            text-align: center;
        }

        .form-group {
            margin-bottom: 1.5rem;
        }

        .form-label {
            display: block;
            font-size: 0.875rem;
            font-weight: 500;
            color: #374151;
            margin-bottom: 0.5rem;
            text-align: center;
        }

        .form-input {
            width: 100%;
            padding: 0.875rem 1rem;
            border: 1.5px solid #d1d5db;
            border-radius: 6px;
            font-size: 1.5rem;
            transition: all 0.2s ease;
            background-color: white;
            text-align: center;
            letter-spacing: 0.5rem;
            font-weight: bold;
        }

        .form-input:focus {
            outline: none;
            border-color: #3b82f6;
            box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
        }

        .submit-btn {
            width: 100%;
            background: #1D3557;
            color: white;
            border: none;
            padding: 0.875rem 1rem;
            border-radius: 6px;
            font-size: 0.875rem;
            font-weight: 600;
            cursor: pointer;
            transition: background-color 0.2s ease;
            margin-bottom: 1.5rem;
        }

        .submit-btn:hover {
            background: #0f172a;
        }

        .alert {
            padding: 0.75rem 1rem;
            border-radius: 6px;
            margin-bottom: 1rem;
            font-size: 0.875rem;
        }

        .alert-success {
            background-color: #d1fae5;
            border: 1px solid #a7f3d0;
            color: #065f46;
        }

        .alert-error {
            background-color: #fee2e2;
            border: 1px solid #fecaca;
            color: #991b1b;
        }

        .back-link {
            text-align: center;
            font-size: 0.875rem;
        }
        
        .back-link a {
            color: #3b82f6;
            text-decoration: none;
        }

        @media (min-width: 768px) {
            .auth-image {
                display: block;
            }
        }

        @media (max-width: 640px) {
            .auth-container {
                margin: 1rem;
                display: block;
                height: auto;
            }
            .auth-form {
                padding: 2rem 1.5rem;
            }
             .auth-image {
                display: none;
            }
        }
    </style>
</head>
<body>
    <div class="auth-container">
        <!-- Reusing same image logic as login for consistency -->
        <div class="auth-image">
            <img src="{{ asset('dcpo.jpg') }}" alt="DCPO" style="width:100%;height:100%;object-fit:cover;display:block;" />
        </div>
        <div class="auth-form">
            <div class="text-center mb-4">
                <i class="fas fa-shield-alt fa-3x text-primary" style="color: #3b82f6; margin-bottom: 15px;"></i>
            </div>
            
            <h1 class="auth-title">Security Verification</h1>
            <p class="auth-subtitle">
                We've sent a 6-digit confirmation code to your phone ending in <strong>{{ $maskedPhone ?? '...' }}</strong>.
            </p>

            @if(session('success'))
                <div class="alert alert-success">
                    {{ session('success') }}
                </div>
            @endif

            @if($errors->any())
                <div class="alert alert-error">
                    <ul style="margin: 0; padding-left: 1rem;">
                        @foreach($errors->all() as $error)
                            <li>{{ $error }}</li>
                        @endforeach
                    </ul>
                </div>
            @endif

            <form method="POST" action="{{ route('otp.login.verify.post') }}">
                @csrf
                
                <div class="form-group">
                    <label class="form-label" for="otp">One-Time Password (OTP)</label>
                    <input class="form-input" 
                           id="otp" 
                           type="text" 
                           name="otp" 
                           maxlength="6" 
                           placeholder="000000" 
                           required 
                           autofocus 
                           autocomplete="one-time-code"
                    />
                </div>

                <button type="submit" class="submit-btn">Verify & Login</button>

                <div class="back-link">
                    <a href="{{ route('login') }}"><i class="fas fa-arrow-left me-1"></i> Back to Login</a>
                </div>
                <div class="back-link" style="margin-top: 10px;">
                    <a href="{{ route('login') }}" style="color: #6b7280; font-size: 0.8rem;">Didn't receive the code? Try logging in again.</a>
                </div>
            </form>
            
            <div class="mt-4" style="text-align: center; margin-top: 20px; padding: 10px; background: #fffbeb; border-radius: 6px; border: 1px solid #fcd34d;">
                <p style="font-size: 0.825rem; color: #92400e; margin-bottom: 5px; font-weight: 600;">
                    <i class="fas fa-exclamation-triangle me-1"></i> Trouble receiving code?
                </p>
                <p style="font-size: 0.8rem; color: #b45309;">
                    If using WhatsApp Sandbox, your session may have expired (72h limit).
                    <br>
                    <strong>Action:</strong> Send <code style="background: rgba(0,0,0,0.1); padding: 2px 4px; border-radius: 3px;">join clever-fox</code> (or your sandbox code) to <strong>+1 415 523 8886</strong> on WhatsApp to re-enable delivery.
                </p>
            </div>
            
            <div class="mt-4 text-center">
                <form method="POST" action="{{ route('otp.login.resend') }}" id="resend-form">
                    @csrf
                    <button type="submit" id="resend-btn" class="text-sm font-medium text-blue-500 hover:text-blue-700 disabled:opacity-50 disabled:cursor-not-allowed disabled:text-gray-400" disabled style="background:none; border:none; cursor:pointer; text-decoration:underline;">
                        Resend OTP <span id="timer">(60s)</span>
                    </button>
                    @if(session('error') && session('error') == 'Please wait before resending.')
                        <p class="text-xs text-red-500 mt-1">{{ session('error') }}</p>
                    @endif
                </form>
            </div>
        </div>
    </div>

    <script>
        // Auto-focus logic ... (keeping it simple or relying on html attribute)
        
        // Resend Timer Logic
        const resendBtn = document.getElementById('resend-btn');
        const timerSpan = document.getElementById('timer');
        
        // Retrieve remaining time from localStorage to persist across reloads (simple approach)
        // Or just reset to 60s on successful send (which reload usually implies if we flash success)
        
        let timeLeft = 60;
        
        // If there's a success message about sending, reset timer.
        // If just page load, maybe allow immediate? No, safety first.
        
        function updateTimer() {
            if (timeLeft > 0) {
                timerSpan.textContent = `(${timeLeft}s)`;
                resendBtn.disabled = true;
                timeLeft--;
                setTimeout(updateTimer, 1000);
            } else {
                timerSpan.textContent = '';
                resendBtn.disabled = false;
            }
        }

        // Start timer
        updateTimer();
    </script>
</body>
</html>
