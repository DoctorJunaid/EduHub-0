export const getResetPasswordTemplate = (resetLink) => `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Set Up Your Account | EduHub</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
            line-height: 1.6;
            color: #18181b;
            background-color: #f4f4f5;
            margin: 0;
            padding: 0;
            -webkit-font-smoothing: antialiased;
        }
        .email-wrapper {
            width: 100%;
            background-color: #f4f4f5;
            padding: 40px 16px;
            box-sizing: border-box;
        }
        .email-container {
            max-width: 580px;
            margin: 0 auto;
            background-color: #ffffff;
            border-radius: 12px;
            overflow: hidden;
            border: 1px solid #e4e4e7;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
        }
        .header {
            background-color: #09090b;
            padding: 36px 30px;
            text-align: center;
        }
        .brand-badge {
            display: inline-block;
            background-color: #18181b;
            color: #d4d4d8;
            font-size: 11px;
            font-weight: 700;
            letter-spacing: 0.12em;
            text-transform: uppercase;
            padding: 4px 12px;
            border-radius: 9999px;
            border: 1px solid #27272a;
            margin-bottom: 12px;
        }
        .header h1 {
            color: #ffffff;
            margin: 0;
            font-size: 24px;
            font-weight: 700;
            letter-spacing: -0.02em;
        }
        .content {
            padding: 36px 32px;
            color: #27272a;
        }
        .content p {
            margin: 0 0 16px 0;
            font-size: 15px;
            line-height: 1.65;
            color: #3f3f46;
        }
        .greeting {
            font-size: 17px !important;
            font-weight: 600;
            color: #09090b !important;
        }
        .btn-wrapper {
            text-align: center;
            margin: 32px 0;
        }
        .btn {
            display: inline-block;
            padding: 14px 34px;
            background-color: #09090b;
            color: #ffffff !important;
            text-decoration: none;
            border-radius: 8px;
            font-size: 15px;
            font-weight: 600;
            letter-spacing: 0.01em;
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.12);
        }
        .btn:hover {
            background-color: #27272a;
        }
        .notice-box {
            background-color: #fafafa;
            border: 1px solid #e4e4e7;
            border-radius: 8px;
            padding: 16px;
            margin: 24px 0;
        }
        .notice-box p {
            margin: 0 0 8px 0;
            font-size: 13px;
            color: #71717a;
        }
        .fallback-link {
            font-size: 13px;
            color: #09090b;
            word-break: break-all;
            font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
            background-color: #ffffff;
            padding: 10px 12px;
            border-radius: 6px;
            border: 1px solid #e4e4e7;
        }
        .expiry-text {
            font-size: 13px !important;
            color: #71717a !important;
            margin-top: 20px !important;
            text-align: center;
        }
        .footer {
            background-color: #fafafa;
            padding: 24px;
            text-align: center;
            font-size: 12px;
            color: #71717a;
            border-top: 1px solid #e4e4e7;
            line-height: 1.6;
        }
        .footer p {
            margin: 0 0 4px 0;
        }
    </style>
</head>
<body>
    <div class="email-wrapper" style="width: 100%; background-color: #f4f4f5; padding: 40px 16px; box-sizing: border-box;">
        <div class="email-container" style="max-width: 580px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; border: 1px solid #e4e4e7;">
            <div class="header" style="background-color: #09090b; padding: 36px 30px; text-align: center;">
                <div class="brand-badge" style="display: inline-block; background-color: #18181b; color: #d4d4d8; font-size: 11px; font-weight: 700; letter-spacing: 0.12em; text-transform: uppercase; padding: 4px 12px; border-radius: 9999px; border: 1px solid #27272a; margin-bottom: 12px;">EduHub</div>
                <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 700; letter-spacing: -0.02em;">Welcome to EduHub</h1>
            </div>
            <div class="content" style="padding: 36px 32px; color: #27272a;">
                <p class="greeting" style="font-size: 17px; font-weight: 600; color: #09090b; margin: 0 0 16px 0;">Hello,</p>
                <p style="margin: 0 0 16px 0; font-size: 15px; line-height: 1.65; color: #3f3f46;">Your educational institute has been successfully registered on the EduHub platform.</p>
                <p style="margin: 0 0 16px 0; font-size: 15px; line-height: 1.65; color: #3f3f46;">To access your Institute Admin dashboard, please click the button below to securely set up your password.</p>
                
                <div class="btn-wrapper" style="text-align: center; margin: 32px 0;">
                    <a href="${resetLink}" class="btn" style="display: inline-block; padding: 14px 34px; background-color: #09090b; color: #ffffff !important; text-decoration: none; border-radius: 8px; font-size: 15px; font-weight: 600; letter-spacing: 0.01em;">Set Up My Password</a>
                </div>
                
                <div class="notice-box" style="background-color: #fafafa; border: 1px solid #e4e4e7; border-radius: 8px; padding: 16px; margin: 24px 0;">
                    <p style="margin: 0 0 8px 0; font-size: 13px; color: #71717a;">If you're having trouble clicking the button, copy and paste the URL below into your web browser:</p>
                    <div class="fallback-link" style="font-size: 13px; color: #09090b; word-break: break-all; font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace; background-color: #ffffff; padding: 10px 12px; border-radius: 6px; border: 1px solid #e4e4e7;">
                        ${resetLink}
                    </div>
                </div>
                
                <p class="expiry-text" style="font-size: 13px; color: #71717a; margin-top: 20px; text-align: center;">This link will expire in 24 hours for security reasons.</p>
            </div>
            <div class="footer" style="background-color: #fafafa; padding: 24px; text-align: center; font-size: 12px; color: #71717a; border-top: 1px solid #e4e4e7; line-height: 1.6;">
                <p style="margin: 0 0 4px 0;">This is an automated message from EduHub. Please do not reply to this email.</p>
                <p style="margin: 0;">&copy; ${new Date().getFullYear()} EduHub Platform. All rights reserved.</p>
            </div>
        </div>
    </div>
</body>
</html>
`;

export const sendVerificationTemplate = (verificationLink) => `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Verify Your Email | EduHub</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
            line-height: 1.6;
            color: #18181b;
            background-color: #f4f4f5;
            margin: 0;
            padding: 0;
            -webkit-font-smoothing: antialiased;
        }
        .email-wrapper {
            width: 100%;
            background-color: #f4f4f5;
            padding: 40px 16px;
            box-sizing: border-box;
        }
        .email-container {
            max-width: 580px;
            margin: 0 auto;
            background-color: #ffffff;
            border-radius: 12px;
            overflow: hidden;
            border: 1px solid #e4e4e7;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
        }
        .header {
            background-color: #09090b;
            padding: 36px 30px;
            text-align: center;
        }
        .brand-badge {
            display: inline-block;
            background-color: #18181b;
            color: #d4d4d8;
            font-size: 11px;
            font-weight: 700;
            letter-spacing: 0.12em;
            text-transform: uppercase;
            padding: 4px 12px;
            border-radius: 9999px;
            border: 1px solid #27272a;
            margin-bottom: 12px;
        }
        .header h1 {
            color: #ffffff;
            margin: 0;
            font-size: 24px;
            font-weight: 700;
            letter-spacing: -0.02em;
        }
        .content {
            padding: 36px 32px;
            color: #27272a;
        }
        .content p {
            margin: 0 0 16px 0;
            font-size: 15px;
            line-height: 1.65;
            color: #3f3f46;
        }
        .greeting {
            font-size: 17px !important;
            font-weight: 600;
            color: #09090b !important;
        }
        .btn-wrapper {
            text-align: center;
            margin: 32px 0;
        }
        .btn {
            display: inline-block;
            padding: 14px 34px;
            background-color: #09090b;
            color: #ffffff !important;
            text-decoration: none;
            border-radius: 8px;
            font-size: 15px;
            font-weight: 600;
            letter-spacing: 0.01em;
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.12);
        }
        .btn:hover {
            background-color: #27272a;
        }
        .notice-box {
            background-color: #fafafa;
            border: 1px solid #e4e4e7;
            border-radius: 8px;
            padding: 16px;
            margin: 24px 0;
        }
        .notice-box p {
            margin: 0 0 8px 0;
            font-size: 13px;
            color: #71717a;
        }
        .fallback-link {
            font-size: 13px;
            color: #09090b;
            word-break: break-all;
            font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
            background-color: #ffffff;
            padding: 10px 12px;
            border-radius: 6px;
            border: 1px solid #e4e4e7;
        }
        .expiry-text {
            font-size: 13px !important;
            color: #71717a !important;
            margin-top: 20px !important;
            text-align: center;
        }
        .footer {
            background-color: #fafafa;
            padding: 24px;
            text-align: center;
            font-size: 12px;
            color: #71717a;
            border-top: 1px solid #e4e4e7;
            line-height: 1.6;
        }
        .footer p {
            margin: 0 0 4px 0;
        }
    </style>
</head>
<body>
    <div class="email-wrapper" style="width: 100%; background-color: #f4f4f5; padding: 40px 16px; box-sizing: border-box;">
        <div class="email-container" style="max-width: 580px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; border: 1px solid #e4e4e7;">
            <div class="header" style="background-color: #09090b; padding: 36px 30px; text-align: center;">
                <div class="brand-badge" style="display: inline-block; background-color: #18181b; color: #d4d4d8; font-size: 11px; font-weight: 700; letter-spacing: 0.12em; text-transform: uppercase; padding: 4px 12px; border-radius: 9999px; border: 1px solid #27272a; margin-bottom: 12px;">EduHub</div>
                <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 700; letter-spacing: -0.02em;">Email Verification</h1>
            </div>
            <div class="content" style="padding: 36px 32px; color: #27272a;">
                <p class="greeting" style="font-size: 17px; font-weight: 600; color: #09090b; margin: 0 0 16px 0;">Hello,</p>
                <p style="margin: 0 0 16px 0; font-size: 15px; line-height: 1.65; color: #3f3f46;">Thank you for registering with EduHub. To complete your sign-up, please verify your email address.</p>
                
                <div class="btn-wrapper" style="text-align: center; margin: 32px 0;">
                    <a href="${verificationLink}" class="btn" style="display: inline-block; padding: 14px 34px; background-color: #09090b; color: #ffffff !important; text-decoration: none; border-radius: 8px; font-size: 15px; font-weight: 600; letter-spacing: 0.01em;">Verify Email Address</a>
                </div>
                
                <div class="notice-box" style="background-color: #fafafa; border: 1px solid #e4e4e7; border-radius: 8px; padding: 16px; margin: 24px 0;">
                    <p style="margin: 0 0 8px 0; font-size: 13px; color: #71717a;">If you're having trouble clicking the button, copy and paste the URL below into your web browser:</p>
                    <div class="fallback-link" style="font-size: 13px; color: #09090b; word-break: break-all; font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace; background-color: #ffffff; padding: 10px 12px; border-radius: 6px; border: 1px solid #e4e4e7;">
                        ${verificationLink}
                    </div>
                </div>
            </div>
            <div class="footer" style="background-color: #fafafa; padding: 24px; text-align: center; font-size: 12px; color: #71717a; border-top: 1px solid #e4e4e7; line-height: 1.6;">
                <p style="margin: 0 0 4px 0;">This is an automated message from EduHub. Please do not reply to this email.</p>
                <p style="margin: 0;">&copy; ${new Date().getFullYear()} EduHub Platform. All rights reserved.</p>
            </div>
        </div>
    </div>
</body>
</html>
`;

