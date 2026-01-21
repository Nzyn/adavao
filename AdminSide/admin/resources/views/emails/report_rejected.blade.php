<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Report Rejected</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
    <div style="background-color: #f8f9fa; border-left: 4px solid #ef4444; padding: 20px; margin-bottom: 20px;">
        <h2 style="color: #ef4444; margin-top: 0;">Report Rejected</h2>
    </div>

    <p>Dear {{ $user->name }},</p>

    <p>We regret to inform you that your report <strong>#{{ $report->report_id }}</strong> has been marked as invalid by our review team.</p>

    <div style="background-color: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0;">
        <h3 style="margin-top: 0; color: #856404;">Reason for Rejection:</h3>
        <p style="margin-bottom: 0; color: #856404;">{{ $rejection_reason }}</p>
    </div>

    <div style="background-color: #f8f9fa; padding: 15px; margin: 20px 0; border-radius: 5px;">
        <h3 style="margin-top: 0;">Report Details:</h3>
        <p style="margin: 5px 0;"><strong>Report ID:</strong> #{{ $report->report_id }}</p>
        <p style="margin: 5px 0;"><strong>Title:</strong> {{ $report->title }}</p>
        <p style="margin: 5px 0;"><strong>Date Submitted:</strong> {{ $report->created_at->format('F d, Y h:i A') }}</p>
    </div>

    <p><strong>What you can do:</strong></p>
    <ul>
        <li>If you believe this rejection was made in error, you may submit a new report with additional evidence or clarification.</li>
        <li>For questions about this decision, please contact your local police station.</li>
        <li>Ensure future reports include clear evidence and accurate information.</li>
    </ul>

    <p style="margin-top: 30px;">Thank you for using AlertDavao.</p>

    <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;">

    <p style="font-size: 12px; color: #666;">
        <strong>AlertDavao</strong><br>
        Crime Reporting System<br>
        Davao City, Philippines
    </p>

    <p style="font-size: 11px; color: #999;">
        This is an automated message. Please do not reply to this email.
    </p>
</body>
</html>
