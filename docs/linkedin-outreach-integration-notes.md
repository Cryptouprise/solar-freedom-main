# LinkedIn Outreach Integration Notes

Last reviewed: August 25, 2026.

## Product Decision

The Attorney Pipeline may create and retain **research links, owner-verified public profile URLs, and review-only outreach drafts**. It must not scrape LinkedIn, silently send messages, or claim a contact is a qualified partner based on LinkedIn data.

The verified integration path is an owner-authorized Taplio connection. The currently configured Taplio connector is disabled and requires OAuth authorization. Its stated capabilities are LinkedIn content research, drafting, scheduling/publishing of owner content, and analytics. Its available tool set must be inspected after the owner completes authorization; it is not assumed to support prospect messaging.

## Official Sources

| Source | Finding | URL |
|---|---|---|
| LinkedIn API access documentation | Open permissions cover authenticated-member posting; sales/profile programs require approval, including Sales Navigator partner access for matched public profile data. | https://learn.microsoft.com/en-us/linkedin/shared/authentication/getting-access |
| LinkedIn API Terms | LinkedIn prohibits scraping/crawling non-official content and prohibits using LinkedIn content or APIs to generate mass messages, promotions, or offers. | https://www.linkedin.com/legal/l/api-terms-of-use |
| Taplio outreach guide | Taplio presents lead discovery, drafting, and outreach workflows, while warning against broad, impersonal outreach and account-limit abuse. | https://taplio.com/blog/linkedin-outreach |

## Sending Controls

1. A prospect must have direct public-source evidence and a completed quality review.
2. The owner must manually verify the profile and review the individual draft.
3. Approval records permission to send; it does not send anything.
4. Any actual publish or send action requires an authorized integration and an explicit confirmation at send time.
5. The integration must respect provider terms, rate limits, and applicable consent/privacy obligations.
