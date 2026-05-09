# Austin Hardware Prospecting Map

A Google Apps Script web app for Austin Hardware & Supply sales reps to find, vet, map, and save OEM / industrial prospects that are good targets for fasteners, industrial hardware, chemicals, engineering services, and VMI.

This app uses Google Sheets as the database, Google Apps Script as the server layer, and a no-framework HTML/CSS/JavaScript frontend with Google Maps.

## What This App Does

- Uses the rep's browser location as a search center.
- Searches Google Places Text Search for industrial/OEM-style companies near the rep.
- Rejects obvious consumer businesses such as restaurants, salons, retail, medical offices, banks, apartments, schools, churches, and similar non-OEM targets.
- Scores candidates for OEM fit, VMI fit, fastener fit, hardware fit, chemical fit, and engineering-service fit.
- Treats VMI-fit prospects as Hot Targets.
- Lets reps review candidates before saving them.
- Lets reps manually add prospects and geocode the address.
- Saves vetted prospects into a Google Sheet tab named `Prospects`.
- Lets reps update status, update notes, delete prospects, and view saved prospects on the map.

Google Places results are candidates only. They are not guaranteed customers and should be vetted by the sales rep before outreach.

## Required Google APIs

Enable these APIs in the Google Cloud project attached to the Apps Script project:

1. Maps JavaScript API
2. Geocoding API
3. Places API

The server-side prospect search uses the Places API Text Search endpoint:

`https://places.googleapis.com/v1/places:searchText`

## Required Apps Script Script Properties

Open Apps Script > Project Settings > Script Properties and add:

| Property | Required | Purpose |
| --- | --- | --- |
| `GOOGLE_MAPS_API_KEY` | Yes | Used for Maps JavaScript, browser geocoding, and Places Text Search. |
| `AUSTIN_LOGO_URL` | No | Optional public URL for the Austin Hardware logo shown in the header. |

Do not hardcode API keys or private secrets in the source files.

## Repo Layout

```text
.
├── README.md
├── .gitignore
├── appsscript.json
├── Code.js
├── Config.js
├── Prospects.js
├── Places.js
├── Scoring.js
└── Index.html
```

## GitHub / Codespaces Workflow

1. Clone or open this repository.
2. Install clasp if you plan to push from a workstation or Codespace:

   ```bash
   npm install -g @google/clasp
   ```

3. Log in to clasp:

   ```bash
   clasp login
   ```

4. Create a `.clasp.json` file in the repo root. This file is intentionally ignored by git.

   ```json
   {
     "scriptId": "YOUR_APPS_SCRIPT_ID_HERE",
     "rootDir": "."
   }
   ```

5. Push files to Apps Script:

   ```bash
   clasp push
   ```

## Create the Google Sheet

1. Create a Google Sheet for the prospect database.
2. Recommended name: `Austin Hardware Prospecting Map`.
3. Use a container-bound Apps Script project from this sheet when possible:
   - Open the Sheet.
   - Go to Extensions > Apps Script.
   - Connect this repo/clasp project to that script ID.

The manifest uses the `spreadsheets.currentonly` scope, so the app is intended to operate on the active container-bound spreadsheet.

## Create or Connect the Apps Script Project

Option A: Container-bound script, recommended:

1. Open the Google Sheet.
2. Go to Extensions > Apps Script.
3. Copy the script ID from Project Settings.
4. Add that script ID to `.clasp.json`.
5. Run `clasp push`.

Option B: Existing Apps Script project:

1. Open the Apps Script project.
2. Confirm it is connected to the correct Google Sheet.
3. Set `.clasp.json` to that script ID.
4. Run `clasp push`.

If you use a standalone script instead of a container-bound script, `SpreadsheetApp.getActiveSpreadsheet()` may not find a spreadsheet. In that case, adjust the storage code and OAuth scopes intentionally before deployment.

## Run Sheet Setup

After pushing the code:

1. Open Apps Script.
2. Select the function `setupAustinHardwareProspectingSheet`.
3. Click Run.
4. Approve permissions.
5. Confirm a sheet tab named `Prospects` exists with the required headers.

The setup function creates or clears the `Prospects` tab and writes this exact header row:

- ID
- Company Name
- Contact Name
- Industry
- Address
- City
- State
- ZIP
- Phone
- Email
- Website
- Product Interest
- Status
- Notes
- Latitude
- Longitude
- Created Date
- Last Updated
- Sales Rep
- Rep Latitude
- Rep Longitude
- Distance Miles
- OEM Fit
- VMI Fit
- Hardware Fit
- Fastener Fit
- Chemical Fit
- Engineering Fit
- Lead Score
- Target Priority
- Vetting Status
- Source

It also styles the header row, freezes row 1, and auto-resizes columns.

## Deploy as a Web App

1. Open Apps Script.
2. Click Deploy > New deployment.
3. Select Web app.
4. Description: `Austin Hardware Prospecting Map`.
5. Execute as: `Me` / user deploying.
6. Who has access: your Google Workspace domain, matching the manifest setting.
7. Deploy.
8. Open the web app URL.

## How to Use the App

1. Enter the Sales Rep Name.
2. Select a search radius: 10, 25, or 50 miles.
3. Click `Use My Current Location`.
4. Click `Find OEM / VMI Targets Near Me`.
5. Review returned candidates in the left sidebar.
6. Use `View on Map` to inspect the location.
7. Use `Add to Prospect List` only when the candidate looks like a good Austin Hardware target.
8. Use Manual Prospect Entry for known prospects that are not discovered through Places.
9. Use Saved Prospects to filter by status, update status, update notes, delete a prospect, or view it on the map.

## Business Rules

The app prioritizes:

- OEM manufacturers
- Industrial manufacturers
- Machine shops
- Metal fabricators
- Equipment builders
- Trailer and truck body builders
- Specialty vehicle manufacturers
- Production and MRO-heavy companies
- Industrial maintenance and manufacturing plants

The app excludes obvious consumer/non-OEM targets such as:

- Restaurants
- Cafes and bars
- Salons and spas
- Churches and schools
- Apartments and real estate
- Insurance, banks, and law offices
- Medical offices and clinics
- Retail, grocery, hotels, gyms, and similar consumer businesses

Lead scoring:

- OEM / industrial fit: +40
- Fastener fit: +20
- Hardware fit: +15
- Chemical fit: +10
- Engineering services fit: +10
- VMI fit: +35
- Within 10 miles of rep: +10
- Within 25 miles of rep: +5

Priority rules:

- Excluded keyword found: Reject
- VMI fit: Hot
- Score >= 80: Hot
- Score >= 50: Warm
- Otherwise: Cold
- Weak/no OEM fit and no VMI fit: rejected from returned candidates

VMI Fit always sets Target Priority to `Hot`.

## Limitations

- Google Places can return imperfect business categories. The app vets results, but reps still need to review candidates before saving.
- The app does not auto-save Places results. A rep must click `Add to Prospect List`.
- The app does not use a local database. Google Sheets is the database.
- Scanned/image PDFs and unrelated customer-file workflows are not part of this app.
- No external frontend framework is used.
- API quota, billing, and restrictions should be managed in Google Cloud.

## Security Notes

- Keep `.clasp.json`, `.clasprc.json`, `.env`, and API secrets out of git.
- Restrict the Google Maps API key by HTTP referrer and API where possible.
- Use a Workspace-domain deployment when appropriate.
- The frontend escapes user-visible values before rendering dynamic cards.
