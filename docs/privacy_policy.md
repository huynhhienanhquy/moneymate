# MoneyMate Privacy Policy Draft

> Draft for product and legal review. This document is not ready for publication until the controller identity, contact details, deployment providers, retention schedule, jurisdictions, and effective date are completed.

## Data MoneyMate processes

MoneyMate may process:

- account information such as name, email address, password hash, avatar URL, role, and account timestamps;
- financial records entered by the user, including wallets, categories, transactions, budgets, savings goals, recurring schedules, reports, notes, and attachments;
- session and device information such as hashed refresh-token records, device identifiers, platform, app version, locale, time zone, notification tokens, IP-derived rate-limit keys, and request IDs;
- receipt images and extracted OCR fields;
- AI or Copilot prompts, conversation content, UI context, and aggregate financial results required to answer a request;
- reliability and security events needed to operate and protect the service.

Raw passwords and raw refresh tokens are not stored in the database. The mobile app stores refresh credentials in the operating system's secure storage.

## Purposes

Data is used to:

- create and secure accounts and sessions;
- synchronize records across authorized devices;
- provide budgeting, reporting, savings, recurring-transaction, attachment, notification, OCR, AI, and Copilot features;
- detect replay, abuse, unauthorized access, conflicts, and duplicate writes;
- diagnose failures, maintain service reliability, and comply with applicable legal obligations.

MoneyMate does not sell personal financial data.

## Service providers

Depending on deployment configuration, data may be processed by hosting/database providers, S3-compatible object storage, OpenAI/CopilotKit services, OCR providers, Expo push services, Apple, and Google. The published policy must name the actual providers, purposes, processing locations, safeguards, and relevant retention terms.

AI and OCR features should send only the content necessary for the user-requested operation. Server API keys and authentication secrets are never included in model context.

## Retention

The production owner must define retention periods for active accounts, revoked sessions, request/security logs, notification tokens, attachments, backups, AI prompts, and processor-held data. Retention should be limited to operational, security, contractual, and legal needs.

Deleting an account removes relational account data through database cascades. Production deletion procedures must also address object-storage files, backups under the retention schedule, push tokens, logs, and data held by processors where applicable.

## Security

Current technical controls include TLS in production, bcrypt password hashing, short-lived access tokens, hashed and rotated refresh tokens, role and ownership checks, input validation, upload limits, rate limits, request IDs, idempotency records, secure mobile storage, and configurable origin restrictions.

No system can guarantee absolute security. Users should protect their devices and credentials and report suspected unauthorized access promptly.

## User choices and rights

Users can update profile information, manage sessions, revoke devices, delete individual records where supported, and request account deletion after confirming their password. The final policy must describe applicable access, correction, deletion, portability, restriction, objection, and complaint rights and how to exercise them.

Optional AI/Copilot and push-notification features can be disabled by deployment configuration. Device notification permissions can also be withdrawn through operating-system settings.

## Children

The service is not intended for children below the minimum age required by the deployment jurisdiction. The final policy must state the applicable age and parental-consent process.

## Changes and contact

The published policy must include an effective date, material-change notification process, controller/legal entity, postal address, privacy email, support channel, and supervisory-authority complaint information.
