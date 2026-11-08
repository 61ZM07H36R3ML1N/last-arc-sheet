# Changelog

All notable changes to **Last Arc: Tactics Analogue — Character Companion** will be documented in this file.

This project follows the [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) format and uses [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---
## [0.4.16] - 2026-11-08
Added

- Added 10 automated component regression tests for CharacterEditorModal.

- Added React Testing Library, @testing-library/user-event, and @testing-library/jest-dom for UI interaction testing.

- Added jsdom support for React component tests in Vitest.

- Added shared test setup with automatic component cleanup.

- Added regression coverage for:

- Character creation and initialization.

- Character editing and saving.

- Cancellation without modifying character data.

- Rejected and confirmed character replacement.

- Unsaved changes being discarded when reopening the editor.

- Locked progression and ancestry controls in Edit mode.

- Equipment and inventory preservation during character editing.

### Improved

- Strengthened character lifecycle regression coverage using non-default character data.

- Verified preservation of HP, MP, temporary resources, Break Gauge state, Hero Points, and gold during character editing.

- Verified preservation of character identity, class progression, Technicks, talents, attributes, and ancestry.

- Added populated equipment fixtures covering weapons, armor, and accessories.

- Added inventory fixtures to verify item identity and collection integrity.

- Expanded Vitest test discovery to include .test.tsx files while maintaining existing engine tests.

### Testing

- 10 Character Editor component tests passing.

- 128 total automated tests expected, including 118 existing engine tests.

- Character Editor component suite completed successfully.

- Full test suite and production build passed during development; final release validation pending.

### Notes

No intentional changes to gameplay calculations or character progression rules.

This release focuses on automated testing, character data integrity, and regression prevention.
## [0.4.5] - Pending verification

The next development release will focus on mechanical accuracy, regression testing, and improvements to character combat calculations.

### In Progress
- Break Gauge calculation corrections.
- Weapon damage modifier improvements.
- Attack skill selection enhancements.

> Release notes will be finalized after implementation, testing, and release.

---

## Previous Development Milestones

The following capabilities have been implemented during the project's pre-1.0 development. Their original release versions and dates should be verified against Git history before assigning them to individual releases.

### Character Management
- Digital character sheet with persistent character data.
- Character attributes, skills, equipment, and derived statistics.
- Support for character options from the Last Arc Corebook and Atlas.
- Character notes and resource tracking.

### Combat and Game Mechanics
- HP and MP resource management.
- Break Gauge and Break Threshold tracking.
- Automated defense calculations.
- Exploding dice roller.
- Skill calculation and auditing.
- Equipment and weapon management.

### Foundry VTT Interoperability
- Character data import and export functionality.
- Foundry-compatible JSON export structures.
- Character attributes and equipment serialization.
- Foundation for future Foundry VTT integration.

### Progressive Web Application
- Installable Progressive Web App architecture.
- Offline-capable application functionality.
- Persistent local character storage.
- Responsive interface for desktop and mobile devices.
- Service worker and web application manifest configuration.

### Engineering and Infrastructure
- React 19 and TypeScript application architecture.
- Vite development and production build tooling.
- Tailwind CSS v4 styling.
- Zustand state management and persistence.
- Cloudflare Pages deployment.
- Automated regression testing.
- Git-based version control and development workflow.

### Repository and Community
- MIT License.
- Code of Conduct.
- Contribution guidelines.
- Security policy.
- Public project documentation.
- Project website and repository metadata.

---

## Versioning Policy

This project uses semantic version identifiers:

**MAJOR.MINOR.PATCH**

- **MAJOR:** Breaking changes to stable application behavior or compatibility.
- **MINOR:** New features and functionality.
- **PATCH:** Bug fixes, corrections, and maintenance updates.

During the `0.x.x` development phase, functionality and data structures may change before the first stable release.

## Release Process

For each release:

1. Update the Unreleased section with completed changes.
2. Categorize changes under Added, Changed, Fixed, Removed, Security, or Deprecated, as applicable.
3. Create a new version heading with the release date.
4. Verify regression tests and production build.
5. Update the application version.
6. Commit the changelog alongside the release changes.
7. Create the corresponding Git tag and GitHub release.

## Project Information

**Application:** [Last Arc Character Companion](https://last-arc.brianjamiel.dev)

**Maintainer:** Brian T Jamiel (6R3M)

**License:** MIT

**Status:** Active pre-1.0 development

---

*Last Arc: Tactics Analogue — Character Companion is an independent, community-focused companion application. It is not an official publication or endorsement of Succubus Publishing unless otherwise stated.*

**Designed, Engineered & Maintained by Brian T Jamiel (6R3M)**
