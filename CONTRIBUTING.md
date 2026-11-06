# Contributing to Last Arc: Tactics Analogue — Character Companion

First, thank you for your interest in contributing!

**Last Arc: Tactics Analogue — Character Companion** is an independent, community-driven application designed to enhance the tabletop roleplaying experience through accessible, reliable, and intuitive digital character management.

Whether you're fixing a bug, improving accessibility, implementing a feature, refining documentation, or helping with testing, your contributions are appreciated.

This project was originally designed and engineered by **Brian T Jamiel (6R3M)** and welcomes thoughtful collaboration from the community.

---

## Table of Contents

1. [Code of Conduct](#code-of-conduct)
2. [Ways to Contribute](#ways-to-contribute)
3. [Before You Begin](#before-you-begin)
4. [Development Environment](#development-environment)
5. [Project Architecture](#project-architecture)
6. [Development Guidelines](#development-guidelines)
7. [Reporting Bugs](#reporting-bugs)
8. [Suggesting Features](#suggesting-features)
9. [Pull Request Process](#pull-request-process)
10. [Testing and Quality Assurance](#testing-and-quality-assurance)
11. [Security](#security)
12. [Intellectual Property](#intellectual-property)
13. [Licensing](#licensing)
14. [Maintainer Responsibilities](#maintainer-responsibilities)
15. [Recognition](#recognition)

---

## Code of Conduct

All contributors must follow our [Code of Conduct](CODE_OF_CONDUCT.md).

We expect respectful communication, constructive feedback, inclusive collaboration, and professional behavior throughout the development process.

Harassment, discrimination, personal attacks, and deliberately disruptive behavior will not be tolerated.

---

## Ways to Contribute

Contributions are welcome in several areas.

### Bug Fixes

Help identify and resolve issues involving:

- Character creation and editing.
- Attribute and derived-stat calculations.
- HP, MP, and Break Gauge management.
- Skill validation and auditing.
- Equipment and inventory tracking.
- Data persistence and recovery.
- Foundry VTT import/export compatibility.
- PWA installation and offline functionality.
- Mobile responsiveness and accessibility.

### Feature Development

Potential contributions include:

- Character sheet usability improvements.
- Accessibility enhancements.
- Additional validation and error handling.
- Import/export improvements.
- Performance optimizations.
- Foundry VTT interoperability.
- Better offline support.
- Quality-of-life improvements.

Major features should be discussed with maintainers before implementation.

### Documentation

Documentation contributions are especially valuable.

Examples include:

- Improving setup instructions.
- Documenting application architecture.
- Adding examples for developers.
- Correcting outdated information.
- Improving accessibility documentation.
- Explaining data formats and integration behavior.

### Testing

Testing contributions may include:

- Reporting reproducible bugs.
- Writing automated tests.
- Validating character calculations.
- Testing browser compatibility.
- Verifying offline functionality.
- Testing exported character data.
- Identifying mobile usability issues.

---

## Before You Begin

Before starting development:

1. Review the [README](README.md).
2. Read the [Code of Conduct](CODE_OF_CONDUCT.md).
3. Search existing GitHub Issues and Pull Requests.
4. Check whether the proposed change is already being developed.
5. Open an issue to discuss significant changes.
6. Wait for maintainer feedback before undertaking major architectural work.

Small bug fixes, documentation corrections, and minor improvements generally do not require prior approval.

**Important:** Opening an issue or proposing a feature does not guarantee that the feature will be accepted.

---

## Development Environment

### Technology Stack

The application uses the following technologies:

| Technology | Purpose |
|---|---|
| React 19 | User interface |
| TypeScript | Type-safe application development |
| Vite | Development server and build tooling |
| Tailwind CSS v4 | Styling and responsive design |
| Zustand | Application state management |
| Zustand Persist | Local data persistence |
| Vite PWA | Progressive Web App functionality |
| Lucide React | Interface icons |
| Foundry VTT JSON | Character data interoperability |

### Prerequisites

Install:

- Node.js (a version compatible with the repository's configuration).
- npm.
- Git.
- A modern web browser.
- A code editor such as Visual Studio Code.

### Fork and Clone

Fork the repository using GitHub, then clone your fork:

```bash
git clone https://github.com/YOUR_USERNAME/REPOSITORY_NAME.git
cd REPOSITORY_NAME
```

Replace the placeholders with your actual GitHub username and repository name.

### Install Dependencies

```bash
npm install
```

For reproducible installations when a compatible `package-lock.json` is present, prefer:

```bash
npm ci
```

### Start the Development Server

```bash
npm run dev
```

Vite will display the local development URL in your terminal.

### Production Build

```bash
npm run build
```

This command should complete successfully before submitting a Pull Request.

### Additional Checks

Review the scripts available in `package.json`:

```bash
npm run
```

Run the repository's configured linting, type-checking, and testing scripts where available.

Do not assume that every project includes the same scripts.

---

## Project Architecture

Contributors should respect the application's existing architecture and avoid introducing unnecessary dependencies or complexity.

### React

- Prefer functional components.
- Use React hooks according to the Rules of Hooks.
- Keep rendering logic predictable.
- Avoid unnecessary effects and duplicated state.
- Extract reusable components when appropriate.
- Maintain clear separation between interface and business logic.

### TypeScript

- Use explicit, meaningful types.
- Avoid `any` unless there is a documented justification.
- Prefer type-safe interfaces for character data.
- Validate untrusted imported data at runtime.
- Preserve compatibility with existing serialized data.
- Avoid unsafe type assertions.

### Zustand

Zustand manages application state and persistence.

Contributors should:

- Keep state updates predictable.
- Avoid mutating state directly.
- Preserve existing character data.
- Avoid unnecessary store subscriptions.
- Keep derived calculations separate from persisted source values where appropriate.
- Consider migrations when modifying persisted schemas.

**Character data integrity is a project priority.**

Changes must not silently overwrite, corrupt, or discard existing user-created characters.

### Tailwind CSS

- Follow existing Tailwind CSS v4 conventions.
- Prefer reusable design patterns.
- Maintain consistent spacing and typography.
- Support responsive layouts.
- Preserve accessible contrast.
- Avoid unnecessary inline styles.

### Progressive Web App

The application supports PWA functionality.

Contributions affecting the service worker, manifest, caching, or application startup must consider:

- Offline availability.
- Update behavior.
- Existing locally stored character data.
- Mobile installation.
- Cache invalidation.
- Recovery from interrupted updates.

---

## Development Guidelines

### Code Quality

All contributions should prioritize:

1. **Correctness** — Features must behave as intended.
2. **Reliability** — Existing functionality must remain stable.
3. **Maintainability** — Code should be understandable and easy to modify.
4. **Accessibility** — Interfaces should support diverse users.
5. **Performance** — Avoid unnecessary rendering and expensive calculations.
6. **Compatibility** — Preserve supported browsers and integrations.
7. **Security** — Treat imported files and external data as untrusted.

### Naming Conventions

Follow existing repository conventions.

Recommended patterns:

| Element | Convention | Example |
|---|---|---|
| React components | PascalCase | `CharacterSheet.tsx` |
| Hooks | camelCase with `use` prefix | `useCharacterStore.ts` |
| Functions | camelCase | `calculateDefenses()` |
| Variables | camelCase | `currentBreakGauge` |
| Types and interfaces | PascalCase | `CharacterData` |
| Constants | UPPER_SNAKE_CASE where appropriate | `MAX_SKILL_RANK` |

Consistency with existing code takes precedence over introducing new naming patterns.

### Comments and Documentation

Comments should explain *why* a decision was made rather than merely restating what the code does.

Document:

- Complex game calculations.
- Non-obvious validation rules.
- Compatibility workarounds.
- Schema migration decisions.
- Integration assumptions.

Avoid excessive comments for self-explanatory code.

### Dependencies

Before introducing a dependency:

- Explain why it is needed.
- Consider existing alternatives.
- Evaluate maintenance and security implications.
- Check license compatibility.
- Consider bundle size and PWA performance.

New dependencies may be rejected when equivalent functionality can be implemented reasonably using the existing stack.

---

## Reporting Bugs

Before opening a bug report, search existing issues to avoid duplicates.

A useful bug report should include:

### Bug Report Template

**Description**

A clear explanation of the problem.

**Steps to Reproduce**

1. Open the application.
2. Navigate to the affected feature.
3. Perform the relevant actions.
4. Describe the unexpected result.

**Expected Behavior**

Explain what should have happened.

**Actual Behavior**

Explain what happened instead.

**Environment**

- Browser and version:
- Operating system:
- Application version:
- Installed PWA or browser tab:
- Online or offline:

**Additional Context**

Include relevant screenshots, logs, or sanitized example data.

Do not include passwords, private keys, personal information, or sensitive character data belonging to others.

---

## Suggesting Features

Feature requests are welcome.

Before submitting a proposal, consider:

- Does the feature improve the character management experience?
- Is it consistent with the project's purpose?
- Does it introduce unnecessary complexity?
- Can it be implemented without violating intellectual property rights?
- Will it work with the existing application architecture?
- Does it preserve offline functionality?

### Feature Request Template

**Feature Summary**

Describe the proposed feature.

**Problem Being Solved**

Explain the user need or limitation.

**Proposed Solution**

Describe how the feature might work.

**Alternatives Considered**

List other possible approaches.

**Technical Considerations**

Identify potential effects on:

- Character data.
- State management.
- User interface.
- Performance.
- Offline functionality.
- Foundry VTT compatibility.

---

## Pull Request Process

### 1. Create a Branch

Create a branch from the repository's current default branch.

```bash
git checkout -b feature/short-description
```

Suggested branch prefixes:

- `feature/` — New functionality.
- `fix/` — Bug fixes.
- `docs/` — Documentation.
- `refactor/` — Internal restructuring.
- `test/` — Testing improvements.
- `chore/` — Maintenance tasks.

### 2. Implement Your Changes

Keep changes focused and avoid unrelated modifications.

Follow existing conventions and update documentation when necessary.

### 3. Validate Your Changes

Before submitting:

- Run the production build.
- Run applicable automated checks.
- Verify affected functionality manually.
- Test mobile layouts when relevant.
- Verify persistence behavior when changing character data.
- Test offline functionality when changing PWA behavior.

### 4. Commit Your Changes

Use clear, descriptive commit messages.

Conventional Commit-style messages are encouraged.

Examples:

```text
feat: add character import validation
fix: correct break gauge calculation
docs: clarify local development setup
refactor: simplify character store selectors
test: add defense calculation coverage
```

### 5. Push Your Branch

```bash
git push origin feature/short-description
```

### 6. Open a Pull Request

Submit your Pull Request against the repository's default branch.

Include:

- A summary of the changes.
- The issue being addressed, if applicable.
- Testing performed.
- Screenshots for interface changes.
- Any compatibility considerations.
- Breaking changes, if any.

### 7. Code Review

Maintainers may request changes before merging.

Contributors should respond constructively and keep discussions focused on technical merit.

A Pull Request may be declined when it:

- Conflicts with project goals.
- Introduces unnecessary complexity.
- Compromises character data integrity.
- Creates security concerns.
- Violates licensing or intellectual property requirements.
- Does not meet maintainability expectations.

**Final merge decisions remain with authorized project maintainers.**

---

## Testing and Quality Assurance

Reliability is especially important because users may store substantial character information locally.

### Character Data

Changes affecting character data should verify:

- Existing saved characters remain accessible.
- Character updates persist correctly.
- Derived statistics remain accurate.
- Invalid inputs are handled safely.
- Import/export operations preserve expected information.
- Schema changes do not silently destroy existing data.

### Game Calculations

Changes affecting game mechanics should be tested against authorized reference material and documented expected outcomes.

Pay particular attention to:

- HP and MP calculations.
- Break Gauge behavior.
- Break Threshold.
- Defense calculations.
- Skill validation.
- Equipment modifiers.
- Character progression.

### Foundry VTT Compatibility

Changes affecting Foundry VTT integration should:

- Preserve documented export structures where possible.
- Validate imported JSON.
- Handle missing or malformed fields gracefully.
- Avoid silently dropping character information.
- Document compatibility limitations.
- Avoid claiming compatibility with untested Foundry versions or systems.

### Accessibility

Contributors should consider:

- Keyboard navigation.
- Visible focus indicators.
- Screen reader compatibility.
- Semantic HTML.
- Readable typography.
- Sufficient color contrast.
- Responsive layouts.
- Touch-friendly controls.

### PWA Testing

Where applicable, test:

- Browser-based usage.
- Installed PWA usage.
- Offline startup.
- Data persistence after reload.
- Application updates.
- Mobile browser behavior.

---

## Security

Security vulnerabilities should not be reported through public GitHub Issues.

Please follow the responsible disclosure instructions in [SECURITY.md](SECURITY.md).

Contributors must never commit:

- Passwords.
- API tokens.
- Private keys.
- Production secrets.
- Sensitive personal information.
- Unauthorized proprietary materials.

Imported character files, JSON payloads, and external integrations must be treated as untrusted inputs.

---

## Intellectual Property

**Last Arc: Tactics Analogue — Character Companion** is an independently developed community project.

The underlying *Last Arc: Tactics Analogue* tabletop game and associated protected intellectual property belong to their respective rights holders.

Contributors must not submit:

- Unauthorized copyrighted artwork.
- Substantial copied rulebook text without permission.
- Proprietary publisher assets without authorization.
- Materials falsely suggesting official publisher endorsement.
- Content that violates applicable intellectual property laws.

Compatibility features should be implemented responsibly and should not imply official authorization or endorsement.

This project is not officially affiliated with Succubus Publishing unless an authorized relationship is explicitly established.

---

## Licensing

By submitting a contribution, you agree that your contribution may be distributed under the repository's applicable open-source license.

Please review the repository's [LICENSE](LICENSE) file before contributing.

Contributors must have the legal right to submit their work and must comply with any applicable third-party license obligations.

Do not submit code, artwork, documentation, or other materials that you do not have permission to contribute.

Contributions do not automatically transfer copyright ownership to the project maintainer.

Any separate copyright assignment or contributor licensing arrangement must be explicitly established.

---

## Maintainer Responsibilities

The project maintainer is responsible for:

- Establishing the technical direction of the application.
- Reviewing proposed changes.
- Maintaining architectural consistency.
- Protecting user data integrity.
- Managing releases and compatibility.
- Enforcing project policies.
- Evaluating community feedback.
- Making final decisions regarding repository contributions.

Maintainers may delegate responsibilities as the project grows.

Contribution acceptance is based on project needs, technical quality, compatibility, and maintainability.

---

## Recognition

Community contributions are valued and appreciated.

Contributors may be recognized through:

- Git commit history.
- Pull Request attribution.
- Release notes.
- Repository acknowledgments.
- Project documentation.

The application's original authorship attribution remains:

**Designed, Engineered & Maintained by Brian T Jamiel (6R3M)**

This attribution recognizes the project's original creator and does not diminish the contributions or copyright rights of other participants.

As the project evolves, contributor acknowledgments may be expanded to recognize additional developers and community members.

---

## Final Thoughts

This project exists to make tabletop character management more approachable, reliable, and enjoyable.

Thoughtful contributions help improve the experience for everyone.

We value quality over quantity, collaboration over competition, and sustainable development over unnecessary complexity.

Thank you for helping build something meaningful for the community.

**Build with care. Contribute with respect. Create for the community.**

---

**Last Arc: Tactics Analogue — Character Companion**

*An independent, community-driven companion application.*

**Designed, Engineered & Maintained by Brian T Jamiel (6R3M)**
