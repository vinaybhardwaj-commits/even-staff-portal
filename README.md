# Even Hospital Staff Portal

Internal staff homepage for Even Hospital, Race Course Road. Designed to be set as the default browser page on all hospital computers.

**Live site:** https://vinaybhardwaj-commits.github.io/even-staff-portal/

## Features

- **Google Sheets CMS** — All content (announcements, educational resources, links, contacts, emergency banners) is managed via a Google Sheet. No coding required to update the portal.
- **Newest-first ordering** — New entries added to the bottom of any sheet tab automatically appear at the top of the page, so staff always see the latest content first.
- **"NEW" indicators** — A pulsing pink dot and "NEW" badge highlights recently added items. For announcements, items within the last 48 hours are flagged. For other sections, the most recently added row is flagged.
- **Today's date bar** — A prominent date display below the hero section so staff always know the current date at a glance.
- **Live clock** — Real-time clock in the header showing current time and date (IST).
- **Quick access links** — One-click access to KareXpert HIS, Pulse, UpToDate clinical reference, and Cureus Newsroom.
- **Emergency banner** — Controllable from the Google Sheet Settings tab. Set an `emergency_message` value to display a pink banner across the top of the page.
- **Smart image icons** — Links section supports image icons via URL. Google Drive sharing links, Dropbox, OneDrive, and Imgur links are automatically converted to direct image URLs.
- **Auto-refresh** — Page polls the Google Sheet every 5 minutes for updated content.
- **Even brand guidelines** — Follows the official Even color palette: `#0055ff` (blue), `#002054` (navy), `#fcfcfc` (off-white), `#f96eb1` (pink).
- **Responsive layout** — Works on desktop and tablet screens.

## Google Sheet Structure

**Sheet ID:** `1aFmsaZ9UVjHdM_lmj51Vnk3bdeo3RwAuDl0lOC8MTUQ`

The sheet must be published to the web (File > Share > Publish to web) and contain these 5 tabs:

| Tab | Columns | Notes |
|-----|---------|-------|
| **Announcements** | date, type, title, description, active | `type`: urgent, update, info, education. `active`: TRUE/FALSE |
| **Education** | title, description, category, link, active | `category`: protocol, training, safety, clinical, general |
| **Links** | name, url, description, icon, color | `icon`: paste an image URL (Google Drive, Imgur, etc.) |
| **Contacts** | name, number | Phone numbers or extensions |
| **Settings** | key, value | Supported key: `emergency_message` |

**Important:** Row 1 of each tab must contain the column headers listed above. Add new entries at the bottom of each tab — they will automatically appear first on the portal.

## Deployment

This is a single static HTML file hosted on GitHub Pages.

1. Edit `index.html` or the Google Sheet content as needed
2. Commit and push to the `main` branch
3. GitHub Pages automatically deploys from `main`

## Tech Stack

- Single-file HTML/CSS/JS (no build tools, no dependencies)
- Google Sheets Visualization API for data fetching
- GitHub Pages for hosting

## Changelog

### v3.0 — March 2026
- Added newest-first ordering across all sections
- Added "NEW" pulsing badge indicator for recent entries
- Added today's date bar below the hero section
- Updated to official Even color palette (#0055ff, #002054, #fcfcfc, #f96eb1)
- Added smart image URL conversion for link icons (Google Drive, Dropbox, etc.)

### v2.0 — February 2026
- Fixed Google Sheets header parsing (parsedNumHeaders:0 bug)
- Added Cureus Newsroom and UpToDate as styled link cards
- Even brand alignment with even.in design system
- Deployed to GitHub Pages

### v1.0 — February 2026
- Initial portal with announcements, education, links, contacts
- Google Sheets CMS integration
- Emergency banner support
- Live clock
