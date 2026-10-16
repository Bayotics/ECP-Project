# Membership application verification

Create Google reCAPTCHA v2 **I am not a robot checkbox** keys for your website domains in the [reCAPTCHA console](https://www.google.com/recaptcha/admin/create).

Set both environment variables locally and in your deployment:

```
NEXT_PUBLIC_RECAPTCHA_SITE_KEY=your-site-key
RECAPTCHA_SECRET_KEY=your-secret-key
```

Keep the secret server-side. Rebuild/redeploy after setting the public site key.
Applications require verification and return HTTP 503 while either key is missing. Tokens are verified on the server before database access; failed or expired tokens must be solved again. The widget is on the final review step, immediately before submission.

The supplied constitution is served at `/documents/ecp-constitution.pdf` and displayed at `/membership/constitution`. Replace the public PDF to publish an updated copy.

Public account sign-up has been removed. Member accounts continue to be created through administrator approval of membership applications.
