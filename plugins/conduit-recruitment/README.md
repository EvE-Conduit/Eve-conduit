# Recruitment

Application forms, a review queue, and accepting people into groups.

- **Applicants** (anyone who signs in, usually with a new EVE login) pick a form, answer its questions and follow
  their application: its progress and messages from the recruiters. They can withdraw and apply again later.
- **Recruiters** (permission `recruit.review_applications`) get a queue (open, mine, accepted, rejected,
  withdrawn) and a notification for each new application. An application shows the answers, every character of
  the applicant at a glance (corporation, skill points, wallet, age, security status, kills and losses, whether
  their login still works) and earlier applications. While it's open, recruiters can open the applicant's full
  character sheets. They write internal notes for each other or messages to the applicant, take the application,
  and accept or reject it with a message. Accepting adds the applicant to the form's groups.
- **Forms** (permission `recruit.manage_forms`): any number, e.g. one per corporation. Questions can be short or
  long answers, yes/no or pick-one, and required or not. Close a form to stop new applications.
- **Webhooks:** `recruit.application_submitted` and `recruit.application_decided` can be sent to Discord or Slack
  under Administration → Integrations.

Needs EvE Conduit 0.5.6 or newer. Give the two permissions to your recruiters' group under Administration → Groups.
