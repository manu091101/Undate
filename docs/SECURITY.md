# Security

## Reporting a vulnerability

If you believe you've found a security issue in Lumin, please email **security@lumin.app**.

Please do **not** open a public GitHub issue.

You can expect:
- An acknowledgement within **2 business days**.
- A status update within **7 business days**.
- A coordinated disclosure timeline if the issue is confirmed.

We currently do not run a formal bug bounty, but we recognize responsible reporters publicly (with their consent) and may offer discretionary rewards for high-impact findings.

## Scope

In-scope:
- `*.lumin.app` web properties.
- Lumin iOS and Android apps (latest two versions).
- Public API endpoints under `api.lumin.app`.

Out-of-scope:
- Denial-of-service that requires excessive traffic.
- Findings from automated scanners without a proof-of-concept.
- Issues in third-party services we use (please report to that vendor).
- Social engineering of Lumin staff or members.
- Self-XSS or issues requiring physical access to an unlocked device.

## Safe-harbor

We will not pursue legal action against researchers who:
- Make a good-faith effort to avoid privacy violations, service disruption, or data destruction.
- Stop testing and report immediately if they encounter member PII.
- Do not exfiltrate any data beyond what is necessary to demonstrate the vulnerability.

## Our internal controls (summary)

- All production secrets live in AWS Secrets Manager, rotated quarterly.
- All access to production data is logged and reviewed monthly.
- PII columns are encrypted at rest (RDS KMS) and in transit (TLS 1.3).
- Photos are stored in private S3 buckets and served via signed CloudFront URLs.
- We run automated dependency scanning (Dependabot) and SAST (CodeQL) on every PR.
- Phone numbers are verified via Twilio Verify; we never store raw OTP codes.

## Data subject requests

Members can export or delete their data from in-app settings. For DSR requests via email, write to **privacy@lumin.app**. We respond within 30 days.
