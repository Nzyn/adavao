<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Complete Registration - AlertDavao</title>
    <link rel="preconnect" href="https://fonts.bunny.net">
    <link href="https://fonts.bunny.net/css?family=inter:400,500,600,700&display=swap" rel="stylesheet" />
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
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
            width: 100%;
            max-width: 450px;
            padding: 2.5rem;
            border: 3px solid #3b82f6;
            text-align: center;
        }
        .icon-container {
            width: 80px;
            height: 80px;
            background: #e0e7ff;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            margin: 0 auto 1.5rem;
        }
        .icon-container svg {
            width: 40px;
            height: 40px;
            color: #3b82f6;
        }
        .auth-title {
            font-size: 1.5rem;
            font-weight: 700;
            color: #1f2937;
            margin-bottom: 0.5rem;
        }
        .auth-subtitle {
            color: #6b7280;
            font-size: 0.875rem;
            margin-bottom: 2rem;
            line-height: 1.5;
        }
        .form-group {
            margin-bottom: 1.5rem;
            text-align: left;
        }
        .form-label {
            display: block;
            font-size: 0.875rem;
            font-weight: 500;
            color: #374151;
            margin-bottom: 0.5rem;
        }
        .form-input {
            width: 100%;
            padding: 0.75rem 1rem;
            border: 1.5px solid #d1d5db;
            border-radius: 6px;
            font-size: 0.875rem;
            transition: all 0.2s ease;
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
        }
        .submit-btn:hover { background: #0f172a; }
        .error-message { color: #ef4444; font-size: 0.75rem; margin-top: 0.25rem; display: block; }
    </style>
</head>
<body>
    <div class="auth-container">
        <div class="icon-container">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
            </svg>
        </div>
        
        <h1 class="auth-title">Complete Registration</h1>
        <p class="auth-subtitle">Please enter your mobile number to complete your account setup and enable Two-Factor Authentication.</p>

        @if($errors->any())
            <div style="background-color: #fee2e2; border: 1px solid #fecaca; color: #991b1b; padding: 0.75rem; border-radius: 6px; margin-bottom: 1.5rem; text-align: left; font-size: 0.875rem;">
                {{ $errors->first() }}
            </div>
        @endif

        <form action="{{ route('auth.google.phone') }}" method="POST">
            @csrf
            <div class="form-group">
                <label for="contact" class="form-label">Mobile Number</label>
                <input 
                    type="tel" 
                    id="contact" 
                    name="contact" 
                    class="form-input" 
                    placeholder="e.g., 09123456789" 
                    pattern="^[0-9\+]{10,15}$"
                    required
                    autofocus
                >
                <small style="color: #6b7280; font-size: 0.75rem; margin-top: 4px; display: block;">
                    Format: 09XXXXXXXXX or +639XXXXXXXXX
                </small>
            </div>

            <button type="submit" class="submit-btn" id="submitBtn">Save & Continue</button>
        </form>
    </div>
</body>
</html>
