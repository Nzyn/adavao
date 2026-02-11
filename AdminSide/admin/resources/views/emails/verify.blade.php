<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Verify Your Email</title>
</head>
<body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f4;">
    <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f4f4; padding: 20px 0;">
        <tr>
            <td align="center">
                <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; overflow: hidden;">
                    <!-- Header -->
                    <tr>
                        <td style="background-color: #1D3557; padding: 30px; text-align: center;">
                            <h1 style="color: #ffffff; margin: 0; font-size: 28px;">AlertDavao</h1>
                        </td>
                    </tr>
                    
                    <!-- Body -->
                    <tr>
                        <td style="padding: 40px 30px;">
                            <h2 style="color: #333333; margin: 0 0 20px 0;">Hello {{ $userName }}!</h2>
                            
                            <p style="color: #666666; line-height: 1.6; margin: 0 0 20px 0;">
                                Thank you for registering with AlertDavao.
                            </p>
                            
                            <p style="color: #666666; line-height: 1.6; margin: 0 0 30px 0;">
                                Please click the button below to verify your email address and activate your account:
                            </p>
                            
                            <!-- Button -->
                            <table width="100%" cellpadding="0" cellspacing="0">
                                <tr>
                                    <td align="center" style="padding: 20px 0;">
                                        <a href="{{ $verificationUrl }}" style="background-color: #1D3557; color: #ffffff; padding: 15px 40px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">
                                            Verify Email Address
                                        </a>
                                    </td>
                                </tr>
                            </table>
                            
                            <p style="color: #666666; line-height: 1.6; margin: 20px 0;">
                                <strong>This verification link will expire in 24 hours.</strong>
                            </p>
                            
                            <p style="color: #666666; line-height: 1.6; margin: 0;">
                                If you did not create an account, please ignore this email.
                            </p>
                        </td>
                    </tr>
                    
                    <!-- Footer -->
                    <tr>
                        <td style="background-color: #f8f8f8; padding: 20px 30px; text-align: center; border-top: 1px solid #eeeeee;">
                            <p style="color: #999999; font-size: 12px; margin: 0 0 10px 0;">
                                If the button doesn't work, copy and paste this link into your browser:
                            </p>
                            <p style="color: #1D3557; font-size: 12px; margin: 0; word-break: break-all;">
                                {{ $verificationUrl }}
                            </p>
                            <p style="color: #999999; font-size: 12px; margin: 20px 0 0 0;">
                                © 2026 AlertDavao. All rights reserved.
                            </p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>
