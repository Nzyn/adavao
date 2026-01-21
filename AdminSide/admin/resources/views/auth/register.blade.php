<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>AlertDavao - Register</title>
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
            max-width: 1000px;
            width: 100%;
            min-height: 600px;
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

        .form-row {
            display: flex;
            gap: 1rem;
            margin-bottom: 1rem;
        }

        .form-group {
            flex: 1;
        }

        .form-group.full-width {
            width: 100%;
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
            padding: 0.75rem 1rem;
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

        .password-row {
            margin-bottom: 0;
        }

        .confirm-password {
            margin-top: 1rem;
            margin-bottom: 1rem;
        }

        .checkbox-container {
            display: flex;
            align-items: center;
            margin-bottom: 1.5rem;
            font-size: 0.75rem;
            color: #6b7280;
        }

        .checkbox-container input[type="checkbox"] {
            margin-right: 0.5rem;
            accent-color: #3b82f6;
        }

        .checkbox-container a {
            color: #3b82f6;
            text-decoration: none;
        }

        .checkbox-container a:hover {
            text-decoration: underline;
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
            margin-bottom: 1rem;
        }

        .submit-btn:hover {
            background: #0f172a;
        }

        .submit-btn:disabled {
            background: #9ca3af;
            cursor: not-allowed;
        }

        .login-link {
            text-align: center;
            font-size: 0.875rem;
            color: #6b7280;
        }

        .login-link a {
            color: #3b82f6;
            text-decoration: none;
            font-weight: 500;
        }

        .login-link a:hover {
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
            }

            .form-row {
                flex-direction: column;
                gap: 0;
            }

            .form-group {
                margin-bottom: 1rem;
            }
        }
    </style>
</head>
<body>
    <div class="auth-container">
        <div class="auth-image">
            <img src="{{ asset('dcpo.jpg') }}" alt="DCPO" style="width:100%;height:100%;object-fit:cover;display:block;" />
        </div>
        <div class="auth-form">
            <h1 class="auth-title">Welcome Back AlertDavao!</h1>
            <p class="auth-subtitle">Sign into your account</p>

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

            <form id="registerForm" action="{{ route('register') }}" method="POST">
                @csrf
                
                <div class="form-row">
                    <div class="form-group">
                        <label for="firstname" class="form-label">First Name <span style="color: red;">*</span></label>
                        <input 
                            type="text" 
                            id="firstname" 
                            name="firstname" 
                            class="form-input @error('firstname') error @enderror" 
                            value="{{ old('firstname') }}"
                            pattern="[a-zA-Z\s'\-]{2,50}"
                            placeholder="e.g., Juan"
                            maxlength="50"
                            title="Only letters, spaces, hyphens and apostrophes (2-50 characters)"
                            required
                        >
                        <small style="color: #666; font-size: 12px; display: block; margin-top: 4px;">
                            Letters only, 2-50 characters
                        </small>
                        @error('firstname')
                            <span class="error-message">{{ $message }}</span>
                        @enderror
                    </div>
                    <div class="form-group">
                        <label for="lastname" class="form-label">Last Name <span style="color: red;">*</span></label>
                        <input 
                            type="text" 
                            id="lastname" 
                            name="lastname" 
                            class="form-input @error('lastname') error @enderror" 
                            value="{{ old('lastname') }}"
                            pattern="[a-zA-Z \-']{2,50}"
                            placeholder="e.g., Dela Cruz"
                            maxlength="50"
                            title="Only letters, spaces, hyphens and apostrophes (2-50 characters)"
                            required
                        >
                        <small style="color: #666; font-size: 12px; display: block; margin-top: 4px;">
                            Letters only, 2-50 characters
                        </small>
                        @error('lastname')
                            <span class="error-message">{{ $message }}</span>
                        @enderror
                    </div>
                </div>

                <div class="form-row">
                    <div class="form-group">
                        <label for="email" class="form-label">Email <span style="color: red;">*</span></label>
                        <input 
                            type="email" 
                            id="email" 
                            name="email" 
                            class="form-input @error('email') error @enderror" 
                            value="{{ old('email') }}"
                            pattern="[a-zA-Z0-9._\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}"
                            title="Please enter a valid email address (e.g., example@gmail.com)"
                            required
                        >
                        <small style="color: #666; font-size: 12px; display: block; margin-top: 4px;">
                            Must include @ and domain (e.g., user@gmail.com, admin@yahoo.com)
                        </small>
                        @error('email')
                            <span class="error-message">{{ $message }}</span>
                        @enderror
                    </div>
                    <div class="form-group">
                         <label for="contact" class="form-label">Contact Number <span style="color: red;">*</span></label>
                         <input 
                             type="tel" 
                             id="contact" 
                             name="contact" 
                             class="form-input @error('contact') error @enderror" 
                             value="{{ old('contact') }}"
                             pattern="^[0-9\+]{10,15}$"
                             placeholder="e.g., +639123456789 or 09123456789"
                             maxlength="15"
                             inputmode="numeric"
                             title="Valid phone number (10-15 digits, numbers only with optional + prefix)"
                             required
                         >
                         <small style="color: #666; font-size: 12px; display: block; margin-top: 4px;">
                             Philippine mobile: 09XXXXXXXXX or +639XXXXXXXXX
                         </small>
                         @error('contact')
                             <span class="error-message">{{ $message }}</span>
                         @enderror
                     </div>
                </div>

                <div class="form-group full-width" style="margin-bottom: 1rem;">
                    <label for="user_role" class="form-label">Officer Type <span style="color: red;">*</span></label>
                    <select 
                        id="user_role" 
                        name="user_role" 
                        class="form-input @error('user_role') error @enderror" 
                        required
                        style="cursor: pointer;"
                    >
                        <option value="">-- Select Officer Type --</option>
                        <option value="police" selected>Station Officer (Desk/Office Duty)</option>
                        <option value="patrol_officer">Patrol Officer (Mobile/Field Duty)</option>
                    </select>
                    <small style="color: #666; font-size: 12px; display: block; margin-top: 4px;">
                        Station Officers work at police stations. Patrol Officers respond to field dispatches.
                    </small>
                    @error('user_role')
                        <span class="error-message">{{ $message }}</span>
                    @enderror
                </div>

                <div class="form-group full-width password-row">
                    <label for="password" class="form-label">Password <span style="color: red;">*</span></label>
                    <input 
                        type="password" 
                        id="password" 
                        name="password" 
                        class="form-input @error('password') error @enderror" 
                        pattern="^(?=.*[a-zA-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$"
                        title="Min 8 characters with letter, number & symbol"
                        required
                    >
                    <small style="color: #666; font-size: 12px; display: block; margin-top: 4px;">
                        Min. 8 characters with at least one letter, number & symbol (@$!%*?&)
                    </small>
                    @error('password')
                        <span class="error-message">{{ $message }}</span>
                    @enderror
                </div>

                <div class="form-group full-width confirm-password">
                    <label for="password_confirmation" class="form-label">Confirm Password <span style="color: red;">*</span></label>
                    <input 
                        type="password" 
                        id="password_confirmation" 
                        name="password_confirmation" 
                        class="form-input @error('password_confirmation') error @enderror" 
                        required
                    >
                    @error('password_confirmation')
                        <span class="error-message">{{ $message }}</span>
                    @enderror
                </div>

                <input type="hidden" name="recaptcha_token" id="recaptcha_token">
                @if(config('services.recaptcha.site_key'))
                    <script src="https://www.google.com/recaptcha/api.js?render={{ config('services.recaptcha.site_key') }}"></script>
                    <script>
                        function refreshRecaptcha() {
                            grecaptcha.ready(function() {
                                grecaptcha.execute('{{ config('services.recaptcha.site_key') }}', {action: 'register'})
                                .then(function(token) {
                                    document.getElementById('recaptcha_token').value = token;
                                });
                            });
                        }
                        refreshRecaptcha();
                        setInterval(refreshRecaptcha, 90000);
                    </script>
                    <div style="font-size: 11px; color: #6b7280; margin: 10px 0; text-align: center;">
                        This site is protected by reCAPTCHA and the Google 
                        <a href="https://policies.google.com/privacy" style="color:#3b82f6;">Privacy Policy</a> and 
                        <a href="https://policies.google.com/terms" style="color:#3b82f6;">Terms of Service</a> apply.
                    </div>
                @endif

                <div class="checkbox-container">
                    <input type="checkbox" id="terms" name="terms" required>
                    <label for="terms">
                        By clicking this you agree to accept our <a href="#" target="_blank">Terms & Conditions</a>, that you are not from a 
                        <br>government investigating position
                    </label>
                </div>

                <button type="button" class="google-btn" onclick="window.location.href='{{ route('auth.google') }}'" style="width: 100%; display: flex; align-items: center; justify-content: center; gap: 10px; background: #fff; color: #333; border: 1px solid #ddd; padding: 0.875rem 1rem; border-radius: 6px; font-size: 0.875rem; font-weight: 600; cursor: pointer; transition: all 0.2s ease; margin-bottom: 1rem;">
                    <svg width="18" height="18" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48">
                        <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
                        <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
                        <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
                        <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
                    </svg>
                    Sign Up with Google
                </button>
                <button type="submit" class="submit-btn" id="registerBtn">Sign Up</button>

                <div class="login-link">
                    Already have an account? <a href="{{ route('login') }}">Login</a>
                </div>
            </form>


        </div>
    </div>

    <script>
        document.addEventListener('DOMContentLoaded', function() {
            const registerBtn = document.getElementById('registerBtn');
            const registerForm = document.getElementById('registerForm');
            const termsCheckbox = document.getElementById('terms');

            console.log('🔐 AdminSide Register page loaded');

        // Sanitization Functions
        function sanitizeText(text) {
            // Remove dangerous characters, keep letters, spaces, hyphens, apostrophes
            return text.trim().replace(/[^a-zA-Z\s'-]/g, '').slice(0, 50);
        }

        function sanitizeEmail(email) {
            // Basic email sanitization - trim whitespace
            return email.trim().toLowerCase().slice(0, 100);
        }

        function sanitizePhone(phone) {
            // Keep only digits and + symbol for international format
            return phone.replace(/[^0-9\+]/g, '').trim();
        }

        function sanitizePassword(password) {
            // Passwords should not be modified, only validated
            return password;
        }

        // Real-time input sanitization event listeners
        const firstnameInput = document.getElementById('firstname');
        const lastnameInput = document.getElementById('lastname');
        const emailInput = document.getElementById('email');
        const contactInput = document.getElementById('contact');

        // Sanitize name inputs in real-time
        firstnameInput.addEventListener('input', function() {
            const sanitized = sanitizeText(this.value);
            if (this.value !== sanitized) {
                this.value = sanitized;
            }
        });

        lastnameInput.addEventListener('input', function() {
            const sanitized = sanitizeText(this.value);
            if (this.value !== sanitized) {
                this.value = sanitized;
            }
        });

        // Sanitize email in real-time
        emailInput.addEventListener('input', function() {
            const sanitized = sanitizeEmail(this.value);
            if (this.value !== sanitized) {
                this.value = sanitized;
            }
        });

        // Sanitize phone in real-time
        contactInput.addEventListener('input', function() {
            const sanitized = sanitizePhone(this.value);
            if (this.value !== sanitized) {
                this.value = sanitized;
            }
        });





        // Update button state based on terms - REMOVED to prevent button lock issues
        // Validation handles terms check on submit
        /*
        function updateRegisterButton() {
            const termsChecked = termsCheckbox.checked;
            registerBtn.disabled = !termsChecked;
        }

        termsCheckbox.addEventListener('change', function() {
            console.log('🔘 Terms checkbox changed:', this.checked);
            updateRegisterButton();
        });
        */



        // Handle register form submission - DIRECT submission without OTP
        registerForm.addEventListener('submit', async function(e) {
            e.preventDefault();

            try {
                // Validate terms checkbox
                if (!termsCheckbox.checked) {
                    alert('❌ Error\n\nPlease accept the Terms & Conditions to proceed.');
                    termsCheckbox.focus();
                    return false;
                }

                // Get and sanitize form inputs
                const firstnameInput = document.getElementById('firstname');
                const firstnameValue = sanitizeText(firstnameInput.value);
                
                const lastnameInput = document.getElementById('lastname');
                const lastnameValue = sanitizeText(lastnameInput.value);
                
                const emailInput = document.getElementById('email');
                const emailValue = sanitizeEmail(emailInput.value);
                
                const contactInput = document.getElementById('contact');
                const contactValue = sanitizePhone(contactInput.value);
                
                const passwordInput = document.getElementById('password');
                const passwordValue = passwordInput.value;
                
                const passwordConfirmInput = document.getElementById('password_confirmation');
                const passwordConfirmValue = passwordConfirmInput.value;



                // Validate first name
                if (!firstnameValue || firstnameValue.length < 2) {
                    alert('❌ Invalid First Name\n\nFirst name must be 2-50 characters.\nOnly letters, spaces, hyphens, and apostrophes allowed.\nExample: Juan');
                    firstnameInput.focus();
                    return false;
                }

                const nameRegex = /^[a-zA-Z\s'-]{2,50}$/;
                if (!nameRegex.test(firstnameValue)) {
                    alert('❌ Invalid First Name\n\nOnly letters, spaces, hyphens, and apostrophes allowed.');
                    firstnameInput.focus();
                    return false;
                }

                // Validate last name
                if (!lastnameValue || lastnameValue.length < 2) {
                    alert('❌ Invalid Last Name\n\nLast name must be 2-50 characters.\nOnly letters, spaces, hyphens, and apostrophes allowed.\nExample: Dela Cruz');
                    lastnameInput.focus();
                    return false;
                }

                if (!nameRegex.test(lastnameValue)) {
                    alert('❌ Invalid Last Name\n\nOnly letters, spaces, hyphens, and apostrophes allowed.');
                    lastnameInput.focus();
                    return false;
                }

                // Validate email
                if (!emailValue.includes('@')) {
                    alert('❌ Invalid Email Format\n\nEmail must contain @ symbol.\nExample: user@gmail.com');
                    emailInput.focus();
                    return false;
                }

                const emailRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
                if (!emailRegex.test(emailValue)) {
                    alert('❌ Invalid Email Address\n\nPlease enter a valid email.\nExamples:\n• user@gmail.com\n• admin@yahoo.com\n• police@outlook.com');
                    emailInput.focus();
                    return false;
                }

                // Validate email domain - block disposable/fake email providers
                const emailDomain = emailValue.toLowerCase().split('@')[1];
                const disposableEmailDomains = [
                    'anymail.com', '10minutemail.com', 'guerrillamail.com', 'mailinator.com',
                    'tempmail.com', 'throwaway.email', 'getnada.com', 'trashmail.com',
                    'fakeinbox.com', 'temp-mail.org', 'dispostable.com', 'yopmail.com',
                    'maildrop.cc', 'emailondeck.com', 'sharklasers.com'
                ];
                if (emailDomain && disposableEmailDomains.includes(emailDomain)) {
                    alert('❌ Invalid Email Domain\n\nPlease use a valid email address.\nTemporary or disposable email addresses are not allowed.\n\nAccepted providers: Gmail, Yahoo, Outlook, etc.');
                    emailInput.focus();
                    return false;
                }

                // Validate phone number
                if (!contactValue || contactValue.length < 7) {
                    alert('❌ Invalid Phone Number\n\nPhone must be 7-20 characters.\nExamples:\n• 09123456789\n• +639123456789');
                    contactInput.focus();
                    return false;
                }

                const phoneRegex = /^[0-9\+\-\s()]{7,20}$/;
                if (!phoneRegex.test(contactValue)) {
                    alert('❌ Invalid Phone Number\n\nOnly digits, +, -, spaces, and parentheses allowed.\nExample: 09123456789');
                    contactInput.focus();
                    return false;
                }

                // Validate password
                if (!passwordValue) {
                    alert('❌ Password Required\n\nPlease enter a password.');
                    passwordInput.focus();
                    return false;
                }

                const passwordRegex = /^(?=.*[a-zA-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
                if (!passwordRegex.test(passwordValue)) {
                    alert('❌ Weak Password\n\nPassword must contain:\n• Minimum 8 characters\n• At least one letter\n• At least one number\n• At least one symbol (@$!%*?&)');
                    passwordInput.focus();
                    return false;
                }

                // Validate password confirmation
                if (passwordValue !== passwordConfirmValue) {
                    alert('❌ Passwords Do Not Match\n\nPlease ensure both password fields are identical.');
                    passwordConfirmInput.focus();
                    return false;
                }

                /* Captcha validation removed for v3 */

                // All validations passed - submit registration directly
                registerBtn.disabled = true;
                registerBtn.innerHTML = '<span class="spinner" style="margin-right:8px;width:18px;height:18px;display:inline-block;border:2px solid #fff;border-top:2px solid #1D3557;border-radius:50%;animation:spin 1s linear infinite;"></span>Signing Up...';

                // Submit registration directly without OTP
                const formData = new FormData();
                formData.append('_token', document.querySelector('input[name="_token"]').value);
                formData.append('firstname', firstnameValue);
                formData.append('lastname', lastnameValue);
                formData.append('email', emailValue);
                formData.append('contact', contactValue);
                formData.append('password', passwordValue);
                formData.append('password_confirmation', passwordConfirmValue);
                formData.append('user_role', document.getElementById('user_role').value);
                formData.append('terms', termsCheckbox.checked ? 'on' : '');
                formData.append('recaptcha_token', document.getElementById('recaptcha_token').value);

                const response = await fetch('{{ route("register") }}', {
                    method: 'POST',
                    body: formData
                });

                if (response.ok) {
                    const text = await response.text();
                    if (text.includes('success') || response.status === 302 || response.status === 200) {
                        alert('Registration Successful!\n\nYour account has been created.\n\nPlease login with your credentials.');
                        window.location.href = '{{ route("login") }}';
                    } else {
                        alert('❌ Registration failed. Please try again.');
                        registerBtn.disabled = false;
                        registerBtn.innerHTML = 'Sign Up';
                    }
                } else {
                    alert('❌ Registration failed. Please try again.');
                    registerBtn.disabled = false;
                    registerBtn.innerHTML = 'Sign Up';
                }
            } catch (err) {
                console.error('❌ Error in form submission:', err);
                alert('❌ An error occurred. Please try again.');
                registerBtn.disabled = false;
                registerBtn.innerHTML = 'Sign Up';
            }
        }

        // Spinner animation
        const style = document.createElement('style');
        style.innerHTML = '@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }';
        document.head.appendChild(style);

        // Override the captcha component's validateCaptcha after the captcha component has loaded
        // This ensures captchaValid is set when the user enters the correct captcha
        // updateRegisterButton();
    </script>
</body>
</html>