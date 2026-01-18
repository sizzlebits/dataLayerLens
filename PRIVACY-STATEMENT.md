# Privacy Statement

## Overview

DataLayer Lens is committed to protecting your privacy. This statement explains how we handle your data when using the browser extension and associated applications.

## Data Storage

**All data is stored locally on your machine.** DataLayer Lens stores all monitoring data, settings, and event history exclusively on your personal device:

- **Browser Storage**: Settings, event history, and preferences are stored in your browser's local storage and IndexedDB
- **Extension Storage**: Configuration data is saved using the browser's extension storage APIs (Chrome Storage API, Firefox Storage, etc.)
- **No Cloud Sync**: Your data is never synchronized to cloud servers or remote services

## What Data is Collected

DataLayer Lens monitors and stores:

- **DataLayer Events**: The JavaScript events fired on websites you visit when the extension is active
- **Event Metadata**: Timestamps, event names, values, and trigger information
- **Extension Settings**: Your preferences for overlay position, filters, logging options, and per-domain configurations

## Data Not Collected

We **do not** collect, transmit, or store:

- **Personal Information**: Your name, email, IP address, or any personally identifiable information
- **Browsing History**: Which websites you visit (only monitoring dataLayer events on sites where you explicitly enable the extension)
- **Third-party Sharing**: Your data is never shared with external services, advertisers, or analytics platforms
- **Commercial Use**: Your data is never used for commercial purposes, profiling, or marketing
- **Telemetry**: We do not send usage statistics or crash reports (unless explicitly enabled by you)

## Your Control

You have complete control over your data:

- **Enable/Disable Per Domain**: Toggle the extension on or off for specific websites
- **Clear Data**: Delete event history and settings at any time through the extension interface
- **Selective Monitoring**: Filter which events are captured and stored
- **Full Ownership**: All data belongs to you and remains on your device

## Open Source

DataLayer Lens is open-source software. You can review the source code to verify exactly how data is handled:

- [GitHub Repository](https://github.com/sizzlebits/dataLayerLens)
- The code contains no hidden data collection or transmission

## No Third-Party Analytics

We do not integrate with:

- Google Analytics or similar tracking services
- Crash reporting tools (unless explicitly opted into during development)
- Advertisement networks
- Data brokers or information services

## Changes to This Statement

This privacy statement may be updated periodically. Changes will be noted in release notes and on this page.

## Questions?

If you have questions about how DataLayer Lens handles data, please open an issue on [GitHub](https://github.com/sizzlebits/dataLayerLens/issues).

---

**Last Updated**: January 18, 2026
