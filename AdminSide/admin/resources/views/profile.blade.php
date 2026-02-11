@extends('layouts.app')

@section('title', 'My Profile')

@section('content')
<div class="content-header">
    <div class="header-left">
        <h1 class="page-title">My Profile</h1>
        <p class="page-subtitle">View and manage your profile information</p>
    </div>
</div>

<div class="content-body">
    @if (session('success'))
        <div class="alert alert-success">
            {{ session('success') }}
        </div>
    @endif

    <div class="profile-container">
        <!-- Profile Information Section -->
        <div class="profile-card">
            <div class="card-header">
                <h2 class="card-title">Profile Information</h2>
                <p class="card-subtitle">Update your account's profile information and email address</p>
            </div>
            <div class="card-body">
                <form method="POST" action="{{ route('profile.update') }}" class="profile-form">
                    @csrf
                    @method('PUT')

                    <div class="form-row">
                        <div class="form-group">
                            <label for="firstname">First Name</label>
                            <input 
                                type="text" 
                                id="firstname" 
                                name="firstname" 
                                class="form-input @error('firstname') input-error @enderror" 
                                value="{{ old('firstname', $user->firstname) }}" 
                                required
                            >
                            @error('firstname')
                                <span class="error-message">{{ $message }}</span>
                            @enderror
                        </div>

                        <div class="form-group">
                            <label for="lastname">Last Name</label>
                            <input 
                                type="text" 
                                id="lastname" 
                                name="lastname" 
                                class="form-input @error('lastname') input-error @enderror" 
                                value="{{ old('lastname', $user->lastname) }}" 
                                required
                            >
                            @error('lastname')
                                <span class="error-message">{{ $message }}</span>
                            @enderror
                        </div>
                    </div>

                    <div class="form-row">
                        <div class="form-group">
                            <label for="email">Email Address</label>
                            <input 
                                type="email" 
                                id="email" 
                                name="email" 
                                class="form-input @error('email') input-error @enderror" 
                                value="{{ old('email', $user->email) }}" 
                                required
                            >
                            @error('email')
                                <span class="error-message">{{ $message }}</span>
                            @enderror
                        </div>

                        <div class="form-group">
                            <label for="contact">Contact Number</label>
                            <input 
                                type="text" 
                                id="contact" 
                                name="contact" 
                                class="form-input @error('contact') input-error @enderror" 
                                value="{{ old('contact', $user->contact) }}" 
                                required
                            >
                            @error('contact')
                                <span class="error-message">{{ $message }}</span>
                            @enderror
                        </div>
                    </div>

                    <div class="form-group">
                        <label for="address">Address</label>
                        <textarea 
                            id="address" 
                            name="address" 
                            rows="3" 
                            class="form-input @error('address') input-error @enderror"
                            placeholder="Enter your address (optional)"
                        >{{ old('address', $user->address) }}</textarea>
                        @error('address')
                            <span class="error-message">{{ $message }}</span>
                        @enderror
                    </div>

                    <div class="form-actions">
                        <button type="submit" class="btn btn-primary">
                            Save Changes
                        </button>
                    </div>
                </form>
            </div>
        </div>

        <!-- Update Password Section -->
        <div class="profile-card">
            <div class="card-header">
                <h2 class="card-title">Update Password</h2>
                <p class="card-subtitle">Ensure your account is using a long, random password to stay secure</p>
            </div>
            <div class="card-body">
                <form method="POST" action="{{ route('profile.password') }}" class="profile-form">
                    @csrf
                    @method('PUT')

                    <div class="form-group">
                        <label for="current_password">Current Password</label>
                        <input 
                            type="password" 
                            id="current_password" 
                            name="current_password" 
                            class="form-input @error('current_password') input-error @enderror" 
                            required
                        >
                        @error('current_password')
                            <span class="error-message">{{ $message }}</span>
                        @enderror
                    </div>

                    <div class="form-group">
                        <label for="new_password">New Password</label>
                        <input 
                            type="password" 
                            id="new_password" 
                            name="new_password" 
                            class="form-input @error('new_password') input-error @enderror" 
                            required
                        >
                        <small class="help-text">Must be at least 8 characters with letters, numbers, and symbols</small>
                        @error('new_password')
                            <span class="error-message">{{ $message }}</span>
                        @enderror
                    </div>

                    <div class="form-group">
                        <label for="new_password_confirmation">Confirm New Password</label>
                        <input 
                            type="password" 
                            id="new_password_confirmation" 
                            name="new_password_confirmation" 
                            class="form-input @error('new_password_confirmation') input-error @enderror" 
                            required
                        >
                        @error('new_password_confirmation')
                            <span class="error-message">{{ $message }}</span>
                        @enderror
                    </div>

                    <div class="form-actions">
                        <button type="submit" class="btn btn-primary">
                            Update Password
                        </button>
                    </div>
                </form>
            </div>
        </div>

        <!-- Account Information (Read-only) -->
        <div class="profile-card">
            <div class="card-header">
                <h2 class="card-title">Account Information</h2>
                <p class="card-subtitle">Account details and system information</p>
            </div>
            <div class="card-body">
                <div class="info-grid">
                    <div class="info-item">
                        <span class="info-label">Role:</span>
                        <span class="info-value">{{ ucfirst($user->role) }}</span>
                    </div>
                    <div class="info-item">
                        <span class="info-label">Email Status:</span>
                        <span class="info-value">
                            @if($user->email_verified_at)
                                <span class="badge badge-success">Verified</span>
                            @else
                                <span class="badge badge-warning">Not Verified</span>
                            @endif
                        </span>
                    </div>
                    <div class="info-item">
                        <span class="info-label">Member Since:</span>
                        <span class="info-value">{{ $user->created_at->format('F d, Y') }}</span>
                    </div>
                </div>
            </div>
        </div>
    </div>
</div>

<style>
    .profile-container {
        max-width: 900px;
        margin: 0 auto;
    }

    .profile-card {
        background: white;
        border-radius: 8px;
        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
        margin-bottom: 24px;
        overflow: hidden;
    }

    .card-header {
        padding: 24px;
        border-bottom: 1px solid #e5e7eb;
    }

    .card-title {
        font-size: 18px;
        font-weight: 600;
        color: #1D3557;
        margin: 0 0 4px 0;
    }

    .card-subtitle {
        font-size: 14px;
        color: #6b7280;
        margin: 0;
    }

    .card-body {
        padding: 24px;
    }

    .profile-form {
        max-width: 100%;
    }

    .form-row {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 16px;
        margin-bottom: 16px;
    }

    .form-group {
        margin-bottom: 16px;
    }

    .form-group label {
        display: block;
        font-size: 14px;
        font-weight: 500;
        color: #374151;
        margin-bottom: 6px;
    }

    .form-input {
        width: 100%;
        padding: 10px 12px;
        border: 1px solid #d1d5db;
        border-radius: 6px;
        font-size: 14px;
        font-family: 'Inter', sans-serif;
        transition: all 0.2s;
        box-sizing: border-box;
    }

    .form-input:focus {
        outline: none;
        border-color: #3b82f6;
        box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
    }

    .form-input.input-error {
        border-color: #ef4444;
    }

    .form-input.input-error:focus {
        box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.1);
    }

    .help-text {
        display: block;
        font-size: 13px;
        color: #6b7280;
        margin-top: 4px;
    }

    .error-message {
        display: block;
        color: #ef4444;
        font-size: 13px;
        margin-top: 4px;
    }

    .form-actions {
        margin-top: 24px;
        padding-top: 16px;
        border-top: 1px solid #e5e7eb;
    }

    .btn {
        padding: 10px 20px;
        border-radius: 6px;
        font-size: 14px;
        font-weight: 500;
        cursor: pointer;
        transition: all 0.2s;
        border: none;
        font-family: 'Inter', sans-serif;
    }

    .btn-primary {
        background-color: #3b82f6;
        color: white;
    }

    .btn-primary:hover {
        background-color: #2563eb;
        transform: translateY(-1px);
        box-shadow: 0 4px 6px rgba(59, 130, 246, 0.2);
    }

    .alert {
        padding: 12px 16px;
        border-radius: 6px;
        margin-bottom: 24px;
        font-size: 14px;
    }

    .alert-success {
        background-color: #d1fae5;
        color: #065f46;
        border-left: 4px solid #10b981;
    }

    .info-grid {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 20px;
    }

    .info-item {
        display: flex;
        flex-direction: column;
        gap: 4px;
    }

    .info-label {
        font-size: 13px;
        color: #6b7280;
        font-weight: 500;
    }

    .info-value {
        font-size: 14px;
        color: #1f2937;
        font-weight: 500;
    }

    .badge {
        display: inline-block;
        padding: 4px 12px;
        border-radius: 12px;
        font-size: 12px;
        font-weight: 600;
    }

    .badge-success {
        background-color: #d1fae5;
        color: #065f46;
    }

    .badge-warning {
        background-color: #fef3c7;
        color: #92400e;
    }

    @media (max-width: 768px) {
        .form-row,
        .info-grid {
            grid-template-columns: 1fr;
        }
    }
</style>
@endsection
