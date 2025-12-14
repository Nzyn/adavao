<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>AlertDavao - Login</title>
    <link rel="preconnect" href="https://fonts.bunny.net">
    <link href="https://fonts.bunny.net/css?family=inter:400,500,600,700&display=swap" rel="stylesheet" />
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
        }

        .form-group {
            margin-bottom: 1rem;
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
            padding: 0.875rem 1rem;
            border: 1.5px solid #d1d5db;
            border-radius: 6px;
            font-size: 0.875rem;
            transition: all 0.2s ease;
            background-color: white;
        }

        .form-input:focus {
            outline: none;
            border-color: #3b82f6;
            box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
        }

        .form-input.error {
            border-color: #ef4444;
        }

        .error-message {
            color: #ef4444;
            font-size: 0.75rem;
            margin-top: 0.25rem;
            display: block;
        }

        .password-group {
            margin-bottom: 0;
        }

        .checkbox-container {
            display: flex;
            align-items: center;
            margin: 1.5rem 0;
            font-size: 0.875rem;
            color: #6b7280;
        }

        .checkbox-container input[type="checkbox"] {
            margin-right: 0.5rem;
            accent-color: #3b82f6;
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

        .submit-btn:disabled {
            background: #9ca3af;
            cursor: not-allowed;
        }

        .google-btn {
            width: 100%;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 10px;
            background: #fff;
            color: #333;
            border: 1px solid #ddd;
            padding: 0.875rem 1rem;
            border-radius: 6px;
            font-size: 0.875rem;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.2s ease;
            margin-bottom: 1rem;
        }

        .google-btn:hover {
            background: #f9fafb;
            border-color: #bbb;
            box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
        }

        .register-link {
            text-align: center;
            font-size: 0.875rem;
            color: #6b7280;
        }

        .register-link a {
            color: #3b82f6;
            text-decoration: none;
            font-weight: 500;
        }

        .register-link a:hover {
            text-decoration: underline;
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

        @media (min-width: 768px) {
            .auth-image {
                display: block;
            }
        }

        @media (max-width: 640px) {
            .auth-container {
                margin: 1rem;
                border-radius: 12px;
            }

            .auth-form {
                padding: 2rem 1.5rem;
                max-width: none;
            }
        }

        @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }
    </style>
</head>
<body>
    <div class="auth-container">
        <div class="auth-image">
            <img src="{{ asset('dcpo.jpg') }}" alt="DCPO" style="width:100%;height:100%;object-fit:cover;display:block;" />
        </div>
        <div class="auth-form">
            <h1 class="auth-title">Welcome Back to AlertDavao!</h1>
            <p class="auth-subtitle">Sign into your account</p>

            @if(session('success'))
                <div class="alert alert-success">
                    {{ session('success') }}
                </div>
            @endif

            @if($errors->any())
                <div class="alert alert-error">
                    @if($errors->has('role'))
                        <strong style="display: block; margin-bottom: 0.5rem;">⚠️ Access Denied</strong>
                        <p style="margin: 0;">{{ $errors->first('role') }}</p>
                    @else
                        <ul style="margin: 0; padding-left: 1rem;">
                            @foreach($errors->all() as $error)
                                <li>{{ $error }}</li>
                            @endforeach
                        </ul>
                    @endif
                </div>
            @endif

            <form id="loginForm" method="POST" action="{{ route('login') }}">
               @csrf
               
               <div id="emailPasswordForm">
                   <div class="form-group">
                       <label for="email" class="form-label">Your Email <span style="color: red;">*</span></label>
                       <input 
                           type="email" 
                           id="email" 
                           name="email" 
                           class="form-input" 
                           value="{{ old('email') }}"
                           required
                           placeholder="Enter your email address"
                       >
                       <span class="error-message" id="emailError" style="display:none;"></span>
                   </div>

                   <div class="form-group password-group">
                       <label for="password" class="form-label">Password <span style="color: red;">*</span></label>
                       <input 
                           type="password" 
                           id="password" 
                           name="password" 
                           class="form-input" 
                           required
                           placeholder="Enter your password"
                       >
                       <span class="error-message" id="passwordError" style="display:none;"></span>
                   </div>

                   <div class="checkbox-container">
                       <input type="checkbox" id="remember" name="remember">
                       <label for="remember">Remember Me</label>
                   </div>

                   <div style="text-align: right; margin-bottom: 1rem;">
                       <a href="{{ route('password.request') }}" style="color: #3b82f6; text-decoration: none; font-size: 0.875rem; font-weight: 500;">Forgot Password?</a>
                   </div>

                   <input type="hidden" name="recaptcha_token" id="recaptcha_token">
                   
                   @if(config('services.recaptcha.site_key'))
                   <script src="https://www.google.com/recaptcha/api.js?render={{ config('services.recaptcha.site_key') }}"></script>
                   <script>
                       // Refresh token every 90 seconds to prevent expiration
                       function refreshRecaptcha() {
                           grecaptcha.ready(function() {
                               grecaptcha.execute('{{ config('services.recaptcha.site_key') }}', {action: 'login'})
                               .then(function(token) {
                                   document.getElementById('recaptcha_token').value = token;
                               });
                           });
                       }
                       
                       // Initial load
                       refreshRecaptcha();
                       
                       // Refresh interval
                       setInterval(refreshRecaptcha, 90000);
                   </script>
                   <div style="font-size: 11px; color: #6b7280; margin: 10px 0; text-align: center;">
                       This site is protected by reCAPTCHA and the Google 
                       <a href="https://policies.google.com/privacy" style="color:#3b82f6;">Privacy Policy</a> and 
                       <a href="https://policies.google.com/terms" style="color:#3b82f6;">Terms of Service</a> apply.
                   </div>
                   @else
                       <div style="color: red; font-size: 12px;">ReCAPTCHA Configuration Missing</div>
                   @endif

                   <button type="submit" class="submit-btn" id="proceedBtn">Login</button>
               </div>

                <div style="display: flex; align-items: center; margin: 20px 0;">
                    <div style="flex: 1; height: 1px; background: #ddd;"></div>
                    <span style="padding: 0 15px; color: #666; font-size: 14px;">OR</span>
                    <div style="flex: 1; height: 1px; background: #ddd;"></div>
                </div>

                <button type="button" class="google-btn" id="googleSignInBtn">
                    <svg width="18" height="18" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48">
                        <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
                        <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
                        <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
                        <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
                    </svg>
                    Continue with Google
                </button>

                <div class="register-link">
                    Don't have an account? <a href="{{ route('register') }}">Register</a>
                </div>
            </form>
        </div>
    </div>

    <script>
        const loginForm = document.getElementById('loginForm');
        const emailInput = document.getElementById('email');
        const passwordInput = document.getElementById('password');
        const emailError = document.getElementById('emailError');
        const passwordError = document.getElementById('passwordError');
        const googleBtn = document.getElementById('googleSignInBtn');
        const proceedBtn = document.getElementById('proceedBtn');

        // Reset button state on page load to fix stuck "Logging in" state
        function resetLoginForm() {
            proceedBtn.disabled = false;
            proceedBtn.innerHTML = 'Login';
            proceedBtn.style.opacity = '1';
            proceedBtn.style.cursor = 'pointer';
        }
        
        // Reset on page load
        window.addEventListener('pageshow', resetLoginForm);
        document.addEventListener('DOMContentLoaded', resetLoginForm);

        // Handle Google Sign-In button click
        if (googleBtn) {
            googleBtn.addEventListener('click', function(e) {
                e.preventDefault();
                // Redirect to Google Auth route
                window.location.href = "{{ route('auth.google') }}";
            });
        }

        // Sanitization functions
        function sanitizeEmail(email) {
            return email.trim().toLowerCase().slice(0, 100);
        }

        // Real-time email validation
        emailInput.addEventListener('input', function() {
            try {
                const value = sanitizeEmail(this.value);
                this.value = value;
                
                if (!value) {
                    emailError.textContent = '';
                    emailError.style.display = 'none';
                    this.classList.remove('error');
                    return;
                }
                
                const emailRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
                if (!value.includes('@')) {
                    emailError.textContent = 'Email must contain @ symbol';
                    emailError.style.display = 'block';
                    this.classList.add('error');
                } else if (!emailRegex.test(value)) {
                    emailError.textContent = 'Please enter a valid email address';
                    emailError.style.display = 'block';
                    this.classList.add('error');
                } else {
                    emailError.textContent = '';
                    emailError.style.display = 'none';
                    this.classList.remove('error');
                    this.style.borderColor = '#22c55e';
                }
            } catch (error) {
                console.error('Error processing email input:', error);
            }
        });

        // Real-time password validation (removed length check for login)
        passwordInput.addEventListener('input', function() {
            try {
                const value = this.value;
                
                if (!value) {
                    passwordError.textContent = '';
                    passwordError.style.display = 'none';
                    this.classList.remove('error');
                    return;
                }
                
                // No validation on login, just clear errors if password is entered
                passwordError.textContent = '';
                passwordError.style.display = 'none';
                this.classList.remove('error');
                this.style.borderColor = '#22c55e';
            } catch (error) {
                console.error('Error processing password input:', error);
            }
        });

        // Handle login form submission - direct login without OTP
        loginForm.addEventListener('submit', function(e) {
            const email = sanitizeEmail(emailInput.value);
            const password = passwordInput.value;
            /* vars removed */

            let hasError = false;

            // Disable button and show loading state
            proceedBtn.disabled = true;
            proceedBtn.innerHTML = '<span class="spinner" style="margin-right:8px;width:18px;height:18px;display:inline-block;border:2px solid #fff;border-top:2px solid #1D3557;border-radius:50%;animation:spin 1s linear infinite;"></span>Logging in...';
            proceedBtn.style.opacity = '0.6';

            // Validate email
            if (!email) {
                e.preventDefault();
                emailError.textContent = 'Email is required';
                emailError.style.display = 'block';
                emailInput.classList.add('error');
                emailInput.focus();
                hasError = true;
            } else if (!email.includes('@')) {
                e.preventDefault();
                emailError.textContent = 'Email must contain @ symbol';
                emailError.style.display = 'block';
                emailInput.classList.add('error');
                emailInput.focus();
                hasError = true;
            }

            // Validate password (no length check on login)
            if (!password) {
                e.preventDefault();
                passwordError.textContent = 'Password is required';
                passwordError.style.display = 'block';
                passwordInput.classList.add('error');
                if (!hasError) passwordInput.focus();
                hasError = true;
            }

            /* Custom captcha validation removed for reCAPTCHA v3 */

            if (hasError) {
                // Re-enable button if validation failed
                proceedBtn.disabled = false;
                proceedBtn.innerHTML = 'Login';
                proceedBtn.style.opacity = '1';
                return false;
            }

            // Update email field with sanitized value
            emailInput.value = email;

            // Allow form submission
            return true;
        });
    </script>
</body>
</html>