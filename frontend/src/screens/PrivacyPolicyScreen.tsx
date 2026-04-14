import React from 'react';
import PolicyLayout, { PolicySection } from './PolicyLayout';

const SECTIONS: PolicySection[] = [
  {
    heading: 'Scope of This Policy',
    body:
      'This Privacy Policy applies to the ClubX mobile application (iOS and Android), the associated backend services, and any related support channels (collectively, the "Service"). The Service is operated by the ClubX team (the "Operator", "we", "us"). This Policy is drafted to comply with the Personal Information Protection Act of the Republic of Korea (PIPA), the Act on Promotion of Information and Communications Network Utilization and Information Protection, and Apple App Store and Google Play policies.',
  },
  {
    heading: 'Personal Information We Collect',
    body:
      'We collect the minimum personal information necessary to provide the Service. Categories are grouped below by the moment of collection.',
    items: [
      {
        label: 'At account creation (required)',
        content:
          'Username, legal name, email address, password (stored only as a salted hash, never in plain text), and agreement records for these Terms and this Privacy Policy, including the timestamp of agreement.',
      },
      {
        label: 'During profile completion (optional)',
        content:
          'Profile image (JPEG, PNG, WebP, or GIF; up to 5 MB), nationality, and gender. You may leave these blank and still use the Service.',
      },
      {
        label: 'When joining a club that requires verification',
        content:
          'Student ID or equivalent affiliation identifier, supplied at the time you request to join a specific club. Club administrators review this information to approve or reject your membership request. ClubX itself does not verify student IDs against any external registry.',
      },
      {
        label: 'When you register a settlement account',
        content:
          'Bank name, bank account number, and account holder name. This information is used only to display your account details to other users inside peer-to-peer settlement flows and to pre-fill deep links into external payment apps (Toss, KakaoPay). It is never transmitted to any payment processor by ClubX.',
      },
      {
        label: 'When you use chat or create events',
        content:
          'Message content (text and image attachments), payment request metadata (amount, participants, status), event posters, event titles, descriptions, times, and event locations (including latitude and longitude you enter when creating an event).',
      },
      {
        label: 'Automatically collected',
        content:
          'Expo push notification token (if you grant notification permission), device model and OS version for crash diagnostics, IP address and request timestamps in server access logs, and app version. A refresh token and short-lived access token are stored on-device in AsyncStorage to keep you signed in.',
      },
      {
        label: 'Location data',
        content:
          'Approximate device location (while the app is in use only) when you open event discovery features that display nearby events or sort by distance. Precise location is not stored on our servers; it is used ephemerally on your device and discarded.',
      },
      {
        label: 'Camera data',
        content:
          'The camera is activated only when you tap a scan action (event check-in, group invite). The camera feed is processed locally on-device to decode the QR or barcode. No raw images or video frames are uploaded to our servers.',
      },
    ],
  },
  {
    heading: 'Purpose of Processing',
    body:
      'Your personal information is processed only for the purposes listed below. We will not use it for any other purpose without obtaining your separate consent.',
    bullets: [
      'Creating and authenticating your account and keeping you signed in across sessions.',
      'Displaying your profile (username, image, and, if provided, nationality) to members of clubs and chat rooms you have joined.',
      'Enabling club administrators to review membership applications and verify affiliation.',
      'Delivering chat messages, event updates, friend-request notifications, and payment-status updates through push notifications you have opted into.',
      'Generating rotating CODE128 barcodes (OnePass) that serve as your event entry ticket, and recording check-in timestamps when an administrator scans your pass.',
      'Facilitating peer-to-peer settlement between users through deep links to Toss and KakaoPay; ClubX displays amounts and statuses only and does not process funds.',
      'Preventing abuse, investigating reports of prohibited content or conduct, and enforcing our Terms of Service.',
      'Complying with legal obligations (tax, accounting, law-enforcement cooperation under valid orders).',
      'Diagnosing crashes and improving reliability using aggregated, non-identifying technical metrics.',
    ],
  },
  {
    heading: 'Legal Basis',
    body:
      'We process personal information under the following legal bases defined by PIPA and, where applicable, the GDPR: (a) your informed consent, given at sign up and, separately, before we send marketing messages; (b) performance of the contract between you and ClubX (the Terms of Service); (c) compliance with legal obligations; and (d) our legitimate interests in securing the Service and preventing abuse, provided those interests are not overridden by your fundamental rights.',
  },
  {
    heading: 'Retention and Deletion',
    items: [
      {
        label: 'While your account is active',
        content:
          'We retain your profile, messages, event registrations, and settlement records for as long as your account exists, so the Service can function.',
      },
      {
        label: 'When you delete your account',
        content:
          'You can delete your account at any time from Settings → Delete Account. Upon deletion, we remove personal identifiers (username, email, legal name, profile image, nationality, gender, student ID, bank information, push token) within 30 days. Messages you sent in group chats are replaced with an anonymized placeholder and an "Unknown User" label instead of being hard-deleted, to preserve conversation context for other participants.',
      },
      {
        label: 'Records retained for legal reasons',
        content:
          'Payment-related event records (amount, timestamps, bank account last four digits) are retained for five years to comply with the Commercial Act of Korea and electronic-finance record-keeping obligations. Server access logs are retained for up to three months for security analysis, then deleted.',
      },
      {
        label: 'Backups',
        content:
          'Personal data may persist in encrypted backups for up to 30 days after deletion from the primary database, after which backups are overwritten in the normal rotation.',
      },
    ],
  },
  {
    heading: 'Third-Party Sharing and Processors',
    body:
      'We do not sell personal information. We share information with the following processors and service providers solely to operate the Service. Each processor is bound by a data-processing agreement and limited to the purposes below.',
    items: [
      {
        label: 'Railway (infrastructure)',
        content:
          'Hosts our backend application and PostgreSQL database. Receives all information you submit to the Service. Servers are located in the region configured by Railway for our project.',
      },
      {
        label: 'Expo (push notifications)',
        content:
          'Delivers push notifications through the Expo Push Notification Service, which relays to Apple Push Notification service (APNs) and Firebase Cloud Messaging (FCM). The push token and notification payload (title, body, deep-link data) are transmitted.',
      },
      {
        label: 'Naver Cloud Platform (maps)',
        content:
          'Renders map tiles and geocodes event locations inside the app. Receives map view coordinates and event location strings. Naver does not receive your account identifiers.',
      },
      {
        label: 'Apple / Google (app distribution)',
        content:
          'Receive crash diagnostics and app update delivery telemetry under each store’s own privacy policy.',
      },
      {
        label: 'Toss and KakaoPay (deep links)',
        content:
          'When you tap "Open Toss" or "Open KakaoPay" inside a settlement flow, the app launches the external payment app with the amount and recipient bank information pre-filled. The payment itself occurs entirely within the external app under that provider’s privacy policy. ClubX does not transmit your credentials or financial account data to those providers.',
      },
    ],
  },
  {
    heading: 'Overseas Transfer',
    body:
      'Expo Push Notification Service and its downstream providers (Apple APNs in the United States, Google FCM in the United States) operate servers outside the Republic of Korea. By using notifications, you consent to the transfer of your push token and the notification payload to those servers. You may revoke this consent at any time by disabling notifications in Settings or in your device settings.',
  },
  {
    heading: 'Security Measures',
    bullets: [
      'Passwords are stored as salted, iterated hashes (bcrypt); we cannot recover your plain-text password.',
      'All network traffic between the app and the backend uses HTTPS/TLS 1.2 or higher.',
      'Access to the production database is restricted to authorized operators and protected by multi-factor authentication.',
      'Uploaded files are validated for type (JPEG, PNG, WebP, GIF) and size (5 MB limit) to reduce malicious-upload risk.',
      'Access and refresh tokens stored on-device are scoped to the app sandbox and invalidated at logout or account deletion.',
      'We monitor unusual login patterns and notify you of material security incidents as required by PIPA.',
    ],
  },
  {
    heading: 'Your Rights',
    body:
      'Under PIPA, and where applicable the GDPR and CCPA, you have the following rights with respect to your personal information.',
    bullets: [
      'Access — request a copy of the personal information we hold about you.',
      'Correction — update information that is inaccurate or incomplete (directly via Edit Profile, or by contacting us).',
      'Deletion — delete your account and associated personal identifiers (Settings → Delete Account).',
      'Restriction — ask us to pause processing while a dispute is being resolved.',
      'Withdrawal of consent — disable notifications or revoke location/camera permissions at any time; doing so may limit related features.',
      'Objection — object to processing based on legitimate interests.',
      'Portability — request export of the information you provided in a structured, machine-readable format.',
      'Lodging a complaint — file a complaint with the Personal Information Protection Commission of Korea (privacy.go.kr) or your local supervisory authority.',
    ],
  },
  {
    heading: 'Children',
    body:
      'The Service is intended for users aged 14 and older. We do not knowingly collect personal information from children under 14. If you are a parent or guardian and believe your child has created an account, please contact us and we will remove the account.',
  },
  {
    heading: 'Automatic Data-Collection Tools',
    body:
      'The Service does not use advertising identifiers, third-party advertising SDKs, or cross-site tracking. We do not embed analytics providers such as Firebase Analytics, Mixpanel, or Amplitude at this time. If we add analytics tooling in the future, we will update this Policy in advance and, where required, request your consent.',
  },
  {
    heading: 'Data Breach Notification',
    body:
      'If we become aware of a personal-information breach that is likely to result in harm to you, we will notify you in the app and by email within 72 hours, describe the nature of the breach and the categories of data affected, the measures we have taken, and the steps you can take. We will also notify the Personal Information Protection Commission of Korea when required by law.',
  },
  {
    heading: 'Data Protection Officer',
    body:
      'For any privacy-related inquiries, to exercise your rights, or to report a suspected incident, contact the ClubX Data Protection contact listed below. We will respond within 10 business days.',
  },
  {
    heading: 'Changes to This Policy',
    body:
      'We may update this Privacy Policy from time to time. Material changes (such as adding a new category of collected data or a new processor) will be announced inside the app at least 7 days before the effective date, or 30 days in advance if the change is materially unfavorable to you. The effective date at the top of this page always reflects the latest version.',
  },
];

export default function PrivacyPolicyScreen() {
  return (
    <PolicyLayout
      title="Privacy Policy"
      effectiveDate="2026-04-14"
      intro="ClubX is a mobile service that helps university clubs and student organizations run events, manage memberships, chat, share photos and tickets, and coordinate peer-to-peer settlements between members. This Privacy Policy describes what personal information ClubX collects, why we collect it, how long we keep it, with whom we share it, and the choices you have."
      sections={SECTIONS}
      contactEmail="hi.danleedev@gmail.com"
    />
  );
}
