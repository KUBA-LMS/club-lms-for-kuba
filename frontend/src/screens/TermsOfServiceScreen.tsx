import React from 'react';
import PolicyLayout, { PolicySection } from './PolicyLayout';

const SECTIONS: PolicySection[] = [
  {
    heading: 'Agreement',
    body:
      'These Terms of Service (the "Terms") form a binding agreement between you ("User", "you") and the ClubX team (the "Operator", "we", "us") governing your use of the ClubX mobile application and related backend services (together, the "Service"). By creating an account, signing in, or otherwise using the Service, you confirm that you have read, understood, and accepted these Terms and the Privacy Policy.',
  },
  {
    heading: 'Description of the Service',
    body:
      'ClubX is a mobile application for university clubs and student organizations. It provides tools to discover and manage clubs, publish and register for events, generate rotating barcode tickets (OnePass) for event entry, run group chats, share photos and payment requests inside those chats, maintain a profile, and coordinate peer-to-peer settlements between members through deep links to external payment apps. The Service itself does not process money, issue securities, lend, or provide any regulated financial service.',
  },
  {
    heading: 'Eligibility',
    bullets: [
      'You must be at least 14 years of age to create an account. If local law requires a higher age for data-processing consent, the higher age applies.',
      'Each account is for a single individual. Sharing credentials is prohibited.',
      'You must provide accurate information at sign up and keep it up to date.',
      'Users who have been previously banned for violating these Terms may not create a new account without written permission from the Operator.',
    ],
  },
  {
    heading: 'Account Security',
    body:
      'You are responsible for preserving the confidentiality of your credentials and for all activity under your account. Notify us immediately at the contact email below if you suspect unauthorized access. We may require you to reset your password if we detect anomalous activity.',
  },
  {
    heading: 'Acceptable Use',
    body:
      'You agree not to use the Service, or allow anyone else to use the Service, in any of the following ways:',
    bullets: [
      'Post content that is illegal, infringing, defamatory, harassing, threatening, hateful, discriminatory, sexually explicit, or that exploits or endangers minors.',
      'Impersonate any person, misrepresent your affiliation, or use someone else’s student ID.',
      'Solicit, promote, or conduct gambling, multi-level marketing, unlicensed sale of alcohol, tobacco, e-cigarettes, narcotics, firearms, replica or counterfeit goods, or any other activity prohibited by Korean law.',
      'Use the Service to lend money, issue securities, operate a virtual asset exchange, offer investment advice, or perform any regulated financial activity.',
      'Circumvent club admission controls, access administrative features you have not been granted, or interfere with other users’ use of the Service.',
      'Upload malware, attempt unauthorized access, reverse-engineer the client or the API, or scrape data outside the rate limits and terms of the public API.',
      'Transmit unsolicited commercial messages or spam via chat, event postings, or notifications.',
      'Use automated means to create accounts, register for events, or send messages.',
    ],
  },
  {
    heading: 'User-Generated Content',
    items: [
      {
        label: 'Ownership',
        content:
          'You retain ownership of the text, images, event posters, and other content you post. By posting, you grant ClubX a worldwide, non-exclusive, royalty-free license to host, reproduce, display, and transmit that content solely to operate the Service, including to members of clubs and chats where you chose to post.',
      },
      {
        label: 'Your representations',
        content:
          'You represent that you own or have the necessary rights to any content you post and that your content does not violate third-party rights, any law, or these Terms.',
      },
      {
        label: 'Removal',
        content:
          'We may remove or restrict access to content that we determine, in good faith, violates these Terms or applicable law, without prior notice where the violation is severe (for example, CSAM, threats of violence, or clear impersonation). For less severe violations, we will aim to notify you first and give you an opportunity to correct the issue.',
      },
    ],
  },
  {
    heading: 'Reporting, Blocking, and Moderation',
    body:
      'We take objectionable content and abusive behavior seriously. The app provides in-product tools that let every user:',
    bullets: [
      'Report individual messages, events, or profiles that violate these Terms.',
      'Block another user, which hides their messages and profile from you and prevents them from initiating chats or friend requests with you.',
      'Leave any chat or club at any time.',
    ],
    items: [
      {
        label: 'Review service-level target',
        content:
          'Reports are triaged within 24 hours. Content that clearly violates these Terms is removed, and the responsible account may be warned, suspended, or permanently banned depending on severity and history. Repeat or severe offenses (harassment, CSAM, threats) result in an immediate permanent ban and, where required, a report to law-enforcement authorities.',
      },
      {
        label: 'Appeal',
        content:
          'If your content is removed or your account is restricted, you may appeal by contacting the Operator within 30 days. We will respond within 10 business days.',
      },
    ],
  },
  {
    heading: 'Events, Tickets, and Check-In',
    bullets: [
      'Club administrators publish events, which may be free, prepaid, or 1/N-split.',
      'Upon registration, you may receive a OnePass, a rotating CODE128 barcode that refreshes every 120 seconds and serves as your entry ticket.',
      'Administrators scan the barcode at the venue to mark your attendance. We record a check-in timestamp and registration status transition.',
      'The Operator is not a party to the events. Event organizers are responsible for venue safety, refund policies, and accurate event information.',
    ],
  },
  {
    heading: 'Peer-to-Peer Settlement',
    body:
      'Certain events and chat features support 1/N settlement requests between users. The Service calculates the split amount and displays status markers ("Pending", "Sent", "Confirmed"). When you tap a payment action, the app launches an external payment app (Toss or KakaoPay) with the bank and amount information pre-filled, or copies the bank account details to your clipboard. The actual transfer occurs entirely within the external app or your own banking channel.',
    bullets: [
      'ClubX is not a licensed payment institution and does not custody funds.',
      'ClubX is not liable for failed transfers, wrong-amount transfers, or disputes between users regarding payment. You should resolve such disputes directly, or through the external payment provider.',
      'Marking "Sent" or "Confirmed" in the app is a courtesy indicator between users and is not a legal receipt.',
    ],
  },
  {
    heading: 'Club Membership and Administration',
    bullets: [
      'Any verified user may create a club. Creators become the club administrators.',
      'Clubs may require applicants to submit verification information (such as a student ID) before admission.',
      'Club administrators may approve, reject, suspend, or remove members at their discretion in accordance with the club’s own rules and these Terms.',
      'Administrators have access to the student ID, nationality, and profile information of members who submitted those fields, strictly for running the club.',
      'Administrators are responsible for processing member data in accordance with PIPA and these Terms.',
    ],
  },
  {
    heading: 'Notifications and Communications',
    body:
      'With your permission, the Service sends push notifications for new chat messages, friend-request status changes, event registration updates, and payment-status updates. You can disable each category in Settings, or revoke notification permission in your device settings. Transactional emails related to account security (password changes, account deletion) may be sent regardless of push settings.',
  },
  {
    heading: 'Intellectual Property',
    body:
      'The Service, including its source code, design, logos, and documentation, is owned by the Operator and protected by Korean and international intellectual-property laws. You may not copy, modify, distribute, or create derivative works of any part of the Service without prior written permission. Nothing in these Terms transfers any ownership rights from the Operator to you.',
  },
  {
    heading: 'Third-Party Services',
    body:
      'The Service relies on third-party providers (Railway for hosting, Expo for push delivery, Naver Maps for map rendering, Toss and KakaoPay for external payment deep links, Apple App Store and Google Play for distribution). Your use of those services is subject to their own terms and privacy policies. The Operator is not responsible for outages, changes, or behavior of those third parties.',
  },
  {
    heading: 'Suspension and Termination',
    items: [
      {
        label: 'By you',
        content:
          'You may terminate your account at any time from Settings → Delete Account. Deletion is effective immediately; residual data is removed in accordance with the Retention section of the Privacy Policy.',
      },
      {
        label: 'By us',
        content:
          'We may suspend or terminate your access if you violate these Terms, if required by law, if we receive a valid legal demand, or if continued access creates material risk to other users or to the Service. For non-severe violations we will attempt to notify you and allow 7 days to cure. For severe violations, suspension may be immediate.',
      },
      {
        label: 'Effect of termination',
        content:
          'Upon termination, your right to use the Service ceases immediately. Sections of these Terms that by their nature should survive (Intellectual Property, Disclaimer, Limitation of Liability, Governing Law) will survive termination.',
      },
    ],
  },
  {
    heading: 'Refunds',
    body:
      'The Service is currently provided free of charge to end users. If ClubX introduces paid features in the future, the refund policy and the right of withdrawal under the Act on the Consumer Protection in Electronic Commerce of Korea will apply and will be presented to you at the time of purchase.',
  },
  {
    heading: 'Disclaimer of Warranties',
    body:
      'The Service is provided on an "as is" and "as available" basis. To the maximum extent permitted by applicable law, the Operator disclaims all warranties, express or implied, including warranties of merchantability, fitness for a particular purpose, non-infringement, and uninterrupted or error-free operation. The Operator does not warrant the accuracy of user-generated content, event information, or settlement status displayed in the app.',
  },
  {
    heading: 'Limitation of Liability',
    body:
      'To the maximum extent permitted by law, the Operator, its affiliates, and its contributors shall not be liable for any indirect, incidental, special, consequential, or punitive damages, or for loss of profits, data, goodwill, or other intangible losses, arising out of or in connection with your use of the Service. The Operator’s aggregate liability for direct damages, where liability cannot be excluded by law, is limited to the greater of (a) fees you paid to the Operator in the twelve months before the claim, or (b) KRW 100,000.',
  },
  {
    heading: 'Indemnification',
    body:
      'You agree to indemnify and hold harmless the Operator and its affiliates from any third-party claim arising out of your content, your violation of these Terms, or your violation of any law or third-party right, to the extent permitted by applicable law.',
  },
  {
    heading: 'Governing Law and Venue',
    body:
      'These Terms are governed by the laws of the Republic of Korea, without regard to its conflict-of-laws rules. Any dispute arising out of or relating to these Terms or the Service that cannot be resolved informally shall be brought in the Seoul Central District Court, unless mandatory consumer-protection law of your residence requires otherwise.',
  },
  {
    heading: 'Changes to the Terms',
    body:
      'We may modify these Terms from time to time. Material changes will be announced inside the app at least 7 days before the effective date, or 30 days in advance if the change is materially unfavorable to users. If you do not agree to the revised Terms, you may terminate your account before the effective date; continued use after the effective date constitutes acceptance.',
  },
  {
    heading: 'Miscellaneous',
    bullets: [
      'If any provision of these Terms is held unenforceable, the remainder will remain in full force.',
      'Our failure to enforce a provision is not a waiver of that provision.',
      'You may not assign or transfer these Terms without our prior written consent. We may assign these Terms to an affiliate or a successor entity as part of a corporate reorganization.',
      'These Terms, together with the Privacy Policy, constitute the entire agreement between you and the Operator regarding the Service.',
    ],
  },
];

export default function TermsOfServiceScreen() {
  return (
    <PolicyLayout
      title="Terms of Service"
      effectiveDate="2026-04-14"
      intro="These Terms of Service govern your use of the ClubX mobile application and related services. Please read them carefully before you create an account or use the Service."
      sections={SECTIONS}
      contactEmail="hi.danleedev@gmail.com"
    />
  );
}
