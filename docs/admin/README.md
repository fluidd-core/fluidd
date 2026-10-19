# Staff portal design

Jack accepted the screens and API outline on 15 October 2026 and requested
Control's look. Open `admin-portal.html` locally. It keeps all five accepted
screens and fixture interactions, with current develop's Muon tokens,
IBM Plex Sans/Krona type, rail/header spacing, shared button patterns and
light/dark themes. `admin-portal-v1.html` preserves the accepted earlier mock.

Run `python review_mock.py` with Python Playwright and its Chromium browser.
The check exercises navigation, theme switching, dialog/cancel and fixture
actions at desktop and phone sizes, with no page overflow or script errors.
Every action is a preview. This file has no live service credentials.

The next stacked draft implements only Accounts and Audit at `/admin`.
Queue, cases, reservations and account mutations stay in later milestones.
