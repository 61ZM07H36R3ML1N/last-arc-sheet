# Security Policy

## Overview

Security, privacy, and data integrity are important priorities for **Last Arc: Tactics Analogue — Character Companion**.

This application is an independent, community-driven Progressive Web App (PWA) designed to provide digital character management tools for *Last Arc: Tactics Analogue*.

The project aims to maintain a secure, reliable, and privacy-conscious experience for players, game masters, and contributors.

**Designed, Engineered & Maintained by Brian T Jamiel (6R3M)**

---

## Supported Versions

Security fixes are generally prioritized for the latest maintained release.

| Version | Supported |
|---|---|
| Latest stable release | Yes |
| Older stable releases | Best effort |
| Development and pre-release builds | Best effort |
| Deprecated versions | No |

Support status may change as the application evolves.

Users are encouraged to update to the latest stable release when security fixes become available.

Because this application supports offline functionality, installed versions may not immediately receive updates.

## Reporting a Vulnerability

**Please do not report security vulnerabilities through public GitHub Issues, Discussions, or Pull Requests.**

Public disclosure before a vulnerability has been investigated may expose users to unnecessary risk.

### Preferred Reporting Method

Use GitHub's private vulnerability reporting feature:

1. Navigate to the project's GitHub repository.
2. Select the **Security** tab.
3. Choose **Report a vulnerability**, if available.
4. Submit a detailed description of the issue.

Private vulnerability reporting must be enabled in the repository settings for this option to be available.

If private vulnerability reporting is unavailable, contact the maintainer through an established private project communication channel.

Do not disclose exploitable details publicly until a coordinated disclosure decision has been made.

### Information to Include

When submitting a vulnerability report, please provide:

- **Summary:** A clear description of the vulnerability.
- **Affected version:** The application version or commit where the issue occurs.
- **Affected component:** The relevant application feature or dependency.
- **Impact:** The potential security or privacy consequences.
- **Reproduction steps:** Instructions for reproducing the issue.
- **Proof of concept:** A minimal, non-destructive demonstration, if available.
- **Suggested remediation:** Potential fixes or mitigations, if known.
- **Environment:** Browser, operating system, and PWA installation status.

Please remove credentials, personal information, and sensitive user data from reports.

## Vulnerability Response Process

The maintainer will make reasonable efforts to:

1. Acknowledge receipt of a vulnerability report.
2. Review and reproduce the reported issue.
3. Assess its severity and potential impact.
4. Determine an appropriate remediation strategy.
5. Develop and test a fix.
6. Release an update when appropriate.
7. Coordinate public disclosure when necessary.

### Response Targets

The following are best-effort goals rather than guaranteed service-level agreements.

| Activity | Target |
|---|---|
| Initial acknowledgment | Within 7 calendar days |
| Preliminary assessment | Within 14 calendar days |
| Remediation plan | Based on severity and complexity |
| Security patch | As soon as reasonably practical |
| Public disclosure | Coordinated with remediation when possible |

Response times may vary based on maintainer availability, technical complexity, and the severity of the reported issue.

## Severity Classification

Reported vulnerabilities may be evaluated using the following general categories.

### Critical

Issues that could result in severe compromise of user data or application integrity with little or no user interaction.

Examples may include:

- Widespread exploitation of a deployed application.
- Malicious code execution affecting users.
- Compromise of application distribution infrastructure.
- Unauthorized access to sensitive data through a project-operated service.

### High

Issues that create substantial security or privacy risks.

Examples may include:

- Persistent cross-site scripting.
- Exploitable import processing vulnerabilities.
- Unauthorized modification or disclosure of application data.
- Compromised third-party dependencies with a practical exploitation path.

### Medium

Issues with meaningful but limited security impact.

Examples may include:

- Security weaknesses requiring specific user interaction.
- Insufficient validation of imported data.
- Unsafe handling of external links or content.
- Security misconfigurations with limited impact.

### Low

Issues presenting minimal immediate security risk.

Examples may include:

- Minor information disclosure.
- Defense-in-depth improvements.
- Non-exploitable security configuration weaknesses.

Final severity assessments depend on exploitability, impact, and the affected environment.

## Application Security Architecture

### Client-Side Application

The Character Companion is built primarily as a client-side application using:

- React 19
- TypeScript
- Vite
- Tailwind CSS v4
- Zustand
- Zustand Persist
- Vite PWA

The application currently uses browser-based persistence for character data.

Client-side architecture does not eliminate security risks.

Potential concerns include:

- Cross-site scripting.
- Malicious imported content.
- Dependency vulnerabilities.
- Browser storage exposure.
- Unsafe external integrations.
- Compromised application updates.

### Local Data Storage

Character data is persisted locally through browser storage mechanisms.

Users should understand that:

- Locally stored data is not automatically encrypted.
- Other scripts running within the same origin may be able to access browser storage.
- Browser extensions or compromised devices may expose stored information.
- Clearing browser data may permanently remove saved characters.
- Private browsing modes may discard saved data.
- Storage availability and persistence behavior vary by browser.

The application should not be treated as a secure storage system for passwords, financial information, medical records, or other sensitive personal data.

Users are encouraged to maintain backups of important character information through available export functionality.

### Data Integrity

Changes affecting character data must prioritize integrity and backward compatibility.

Contributors should:

- Validate imported character data.
- Avoid silently overwriting existing characters.
- Handle malformed data gracefully.
- Preserve compatibility with supported data formats.
- Consider schema migrations when changing persisted structures.
- Avoid destructive operations without appropriate confirmation.

Data corruption and unintended data loss may be considered security-relevant when they result from an exploitable vulnerability.

## Import and Export Security

The application supports character data import and export, including compatibility-oriented JSON structures for Foundry Virtual Tabletop.

Imported files must be treated as untrusted input.

### Required Security Practices

Contributors should:

- Validate imported JSON structures.
- Enforce expected data types.
- Reject or safely handle malformed records.
- Avoid executing imported content as code.
- Prevent unsafe object-property manipulation.
- Apply reasonable file size and complexity limits.
- Handle unexpected nested objects and arrays safely.
- Avoid rendering imported HTML without appropriate sanitization.
- Prevent imported data from modifying unrelated application state.

Import operations should fail safely without corrupting existing character information.

### Foundry VTT Compatibility

Foundry VTT import/export functionality should preserve data integrity and avoid unsafe assumptions about external data.

Compatibility with a particular Foundry VTT version or game system should not be assumed unless tested and documented.

Exported files should contain only the information necessary for their intended purpose.

## Progressive Web App Security

The application uses Progressive Web App functionality, including service worker caching and offline support.

Security considerations include:

- Service worker scope.
- Cache integrity.
- Application update behavior.
- Stale or compromised cached assets.
- Secure deployment.
- Safe handling of offline data.
- Cache invalidation during security updates.

### Service Worker Guidelines

Contributors modifying service worker behavior should:

- Avoid caching sensitive information unnecessarily.
- Restrict caching to appropriate resources.
- Ensure update mechanisms function correctly.
- Test offline and online transitions.
- Consider how security fixes reach installed applications.
- Avoid introducing untrusted third-party scripts into cached application resources.

A security fix deployed to the hosting platform may not immediately replace an older version running from a user's cache.

## Dependency Security

Third-party dependencies can introduce vulnerabilities into the application.

The project aims to:

- Maintain reasonably current dependencies.
- Review security advisories.
- Avoid unnecessary dependencies.
- Evaluate the security implications of new packages.
- Use lockfiles for reproducible installations.
- Apply security updates based on severity and compatibility.

Contributors should not introduce dependencies with known, unresolved, exploitable vulnerabilities without documented justification and maintainer approval.

### Dependency Auditing

Where applicable, contributors may use:

```bash
npm audit
```

To inspect outdated packages:

```bash
npm outdated
```

Audit findings should be evaluated in context.

Not every reported dependency advisory is exploitable within the application's actual deployment environment.

Avoid automatically applying breaking dependency upgrades without reviewing their effects.

## Deployment Security

The application is deployed using Cloudflare Pages.

Deployment-related security practices should include:

- HTTPS delivery.
- Secure management of deployment credentials.
- Appropriate repository access controls.
- Protection of production deployment workflows.
- Review of third-party integrations.
- Avoidance of secrets in client-side bundles.
- Careful handling of environment variables.

### Environment Variables

Variables exposed through Vite's client-side environment system, including variables prefixed with `VITE_`, may be included in publicly accessible application bundles.

**Never store passwords, private API keys, access tokens, or other secrets in client-exposed environment variables.**

Any future server-side functionality must implement appropriate server-side secret management and access controls.

## Secure Development Guidelines

Contributors are expected to follow secure development practices.

### Input Validation

- Validate data at trust boundaries.
- Treat imported files as untrusted.
- Reject unexpected data structures.
- Use safe parsing and rendering methods.
- Avoid executing dynamic code derived from user-controlled input.

### React Security

- Prefer React's default text escaping.
- Avoid `dangerouslySetInnerHTML` unless strictly necessary and appropriately protected.
- Validate external URLs before use.
- Avoid unsafe direct DOM manipulation.
- Do not trust data merely because it originated from browser storage.

### TypeScript Security

TypeScript provides compile-time checks but does not guarantee runtime safety.

Runtime validation remains necessary for:

- Imported JSON.
- Persisted browser data.
- External integrations.
- Third-party responses.
- Data crossing trust boundaries.

### Repository Security

Contributors must not commit:

- Credentials.
- API keys.
- Access tokens.
- Private certificates or keys.
- Sensitive environment files.
- Personal user information.
- Unauthorized proprietary assets.

Suspected credential exposure should be reported privately.

Exposed credentials should be revoked or rotated promptly.

Removing a secret from a later commit does not necessarily remove it from repository history.

## Responsible Security Research

Good-faith security research is welcome when conducted responsibly.

Researchers are expected to:

- Avoid accessing data belonging to other users.
- Avoid destructive testing.
- Avoid denial-of-service activity.
- Avoid social engineering or phishing.
- Avoid compromising third-party infrastructure.
- Use their own test data and environments.
- Report vulnerabilities privately.
- Allow reasonable time for investigation and remediation.

This policy does not authorize testing against infrastructure, accounts, or services that researchers do not own or have explicit permission to assess.

No monetary bug bounty or reward program is currently offered.

## Coordinated Disclosure

The project supports responsible, coordinated vulnerability disclosure.

When practical, public disclosure should occur after a fix or mitigation is available.

Maintainers may publish:

- Security advisories.
- Affected version information.
- Remediation instructions.
- Release notes.
- Recommended user actions.

Reporter attribution may be provided with the reporter's consent.

The project may disclose security information earlier when necessary to protect users.

## Out-of-Scope Reports

The following generally do not qualify as actionable security vulnerabilities unless a concrete security impact is demonstrated:

- Cosmetic interface issues.
- Ordinary feature requests.
- Expected browser storage behavior.
- Data loss caused solely by intentionally clearing browser storage.
- Vulnerabilities requiring an already fully compromised device.
- Theoretical concerns without a plausible exploitation path.
- Reports based solely on automated scanner output without supporting evidence.
- Issues affecting unsupported or deprecated versions without broader impact.

Reports will be evaluated individually.

## Privacy Considerations

The Character Companion is intended to support character management without requiring unnecessary collection of personal information.

Contributors should prioritize:

- Data minimization.
- Local-first functionality.
- Transparent handling of stored data.
- Avoidance of unnecessary tracking.
- User control over character information.
- Safe import and export behavior.

Any future introduction of cloud synchronization, user accounts, analytics, or external data services should undergo a separate security and privacy review.

This document does not replace a privacy policy.

## Policy Updates

This Security Policy may be revised as the project evolves.

Changes may reflect:

- New application features.
- Additional integrations.
- Changes in deployment infrastructure.
- New security requirements.
- Updated disclosure procedures.
- Lessons learned from reported vulnerabilities.

The latest version of this policy will be maintained in the repository.

---

## Maintainer

**Last Arc: Tactics Analogue — Character Companion**

**Designed, Engineered & Maintained by Brian T Jamiel (6R3M)**

Website: [brianjamiel.dev](https://brianjamiel.dev)

Project: [Last Arc Character Companion](https://last-arc.brianjamiel.dev)

For security vulnerabilities, use the repository's private vulnerability reporting mechanism rather than public issue tracking.

---

*Security is an ongoing process. Responsible disclosure, careful engineering, and community collaboration help protect the integrity of this project and its users.*

**Build with care. Contribute with respect. Create for the community.**
