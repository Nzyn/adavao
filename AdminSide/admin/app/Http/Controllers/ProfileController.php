<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Validator;
use App\Models\User;
use App\Services\EncryptionService;

class ProfileController extends Controller
{
    /**
     * Show the profile page
     */
    public function show()
    {
        $user = Auth::user();
        
        // Decrypt sensitive fields for display in form
        if ($user->address && EncryptionService::isEncrypted($user->address)) {
            $user->address = EncryptionService::decrypt($user->address);
        }
        if ($user->contact && EncryptionService::isEncrypted($user->contact)) {
            $user->contact = EncryptionService::decrypt($user->contact);
        }
        
        return view('profile', compact('user'));
    }

    /**
     * Update user profile
     */
    public function update(Request $request)
    {
        $user = Auth::user();

        $validator = Validator::make($request->all(), [
            'firstname' => 'required|string|max:50',
            'lastname' => 'required|string|max:50',
            'contact' => 'required|string|max:20',
            'email' => 'required|email|unique:users,email,' . $user->id,
            'address' => 'nullable|string|max:500',
        ]);

        if ($validator->fails()) {
            return back()->withErrors($validator)->withInput();
        }

        $user->update([
            'firstname' => $request->firstname,
            'lastname' => $request->lastname,
            'contact' => $request->contact ? EncryptionService::encrypt($request->contact) : null,
            'email' => $request->email,
            'address' => $request->address ? EncryptionService::encrypt($request->address) : null,
        ]);

        return back()->with('success', 'Profile updated successfully!');
    }

    /**
     * Update password
     */
    public function updatePassword(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'current_password' => 'required',
            'new_password' => [
                'required',
                'string',
                'min:8',
                'regex:/^(?=.*[a-zA-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]+$/',
                'different:current_password'
            ],
            'new_password_confirmation' => 'required|same:new_password',
        ], [
            'new_password.regex' => 'Password must contain at least one letter, one number, and one symbol (@$!%*?&)',
            'new_password.min' => 'Password must be at least 8 characters long',
            'new_password.different' => 'New password must be different from current password',
        ]);

        if ($validator->fails()) {
            return back()->withErrors($validator)->withInput();
        }

        $user = Auth::user();

        // Verify current password
        if (!Hash::check($request->current_password, $user->password)) {
            return back()->withErrors(['current_password' => 'Current password is incorrect']);
        }

        // Update password
        $user->update([
            'password' => Hash::make($request->new_password),
        ]);

        return back()->with('success', 'Password updated successfully!');
    }
}
