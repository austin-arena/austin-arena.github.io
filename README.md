# Austin Arena — Society Info Portal

Static website for **Austin Arena Co-operative Housing Society Limited**, Tathawade, Pune.

Plain HTML, CSS and vanilla JavaScript — no build step, no framework, no dependencies to install.
Event listings are **data-driven** and can be sourced from a JSON file, a CSV file, or a Google Sheet.

---

## Table of contents

- [Project structure](#project-structure)
- [Running locally](#running-locally)
- [Managing events data](#managing-events-data)
  - [Event fields](#event-fields)
  - [Option A — JSON file (default)](#option-a--json-file-default)
  - [Option B — CSV file](#option-b--csv-file)
  - [Option C — Google Sheet](#option-c--google-sheet)
- [Adding a new page](#adding-a-new-page)
- [Deploying to GitHub Pages](#deploying-to-github-pages)
- [Troubleshooting](#troubleshooting)

---

## Project structure

```
austin-arena/
├── index.html              # Home page (hero slider + portal cards)
├── society-info.html       # Society information (placeholder)
├── notices.html            # Notices & circulars (placeholder)
├── society-events.html     # Events page (cards rendered from data)
├── helpdesk.html           # Helpdesk & support (placeholder)
├── css/
│   └── style.css           # All site styles
├── js/
│   ├── config.js           # ⚙️  Data-source settings (edit this)
│   ├── main.js             # Hero slider + logo fallback
│   └── events.js           # Fetches + renders event cards
├── data/
│   ├── events.json         # Event data (default source)
│   └── events.csv          # Same data in CSV form (alternative source)
├── assets/
│   ├── images/             # Hero + gallery images
│   └── logo/               # Society logo
└── .github/workflows/
    └── deploy.yml          # GitHub Pages deployment
```

---

## Running locally

The events page uses `fetch()` to read the data file. Browsers block `fetch()` on `file://` URLs,
so **you must serve the folder over HTTP** — opening `index.html` by double-clicking will show
"Unable to load events".

Pick any one of these (run from the project root):

```bash
# Python 3 (pre-installed on macOS/Linux)
python3 -m http.server 8000

# Node.js
npx serve .

# PHP
php -S localhost:8000
```

Then open <http://localhost:8000>.

> VS Code / JetBrains users: the **Live Server** extension or the built-in JetBrains web server
> works too and gives auto-reload.

---

## Managing events data

All event cards on `society-events.html` are generated at runtime from the configured source.
**You never edit HTML to add an event** — just update the data.

The data source is selected in **`js/config.js`**:

```js
window.ARENA_CONFIG = {
    events: {
        source: 'json',            // 'json' | 'csv' | 'sheet'   <- currently JSON
        url: 'data/events.json',   // used by 'json' and 'csv'
        sheetId: '',               // used by 'sheet'
        sheetName: 'Events',       // used by 'sheet'
        hidePastEvents: false,     // true = hide events that already finished
        groupByStatus: true,       // ongoing first, then upcoming, then completed
        sortOrder: 'asc'           // 'asc' = soonest first, 'desc' = newest first
    }
};
```

### Event status is automatic

**You never set the status by hand.** It is calculated on every page load by comparing
`startDate` / `endDate` against today's date:

| Condition | Badge shown | Colour | Extra hint |
|---|---|---|---|
| `startDate` is empty | **Dates Awaited** | purple | Date row reads "To be announced" |
| today **before** `startDate` | **Upcoming** | green | "Starts today" / "Starts tomorrow" / "In 6 days" |
| today **between** start and end | **Happening Now** | red + pulsing dot | "6 days left" / "Last day" |
| today **after** `endDate` | **Completed** | grey | card is visually dimmed |

Single-day events (no `endDate`, or `endDate` = `startDate`) are **Happening Now** on the day
itself and **Completed** from the next day.

Cards are also grouped in that order — ongoing first, then upcoming, then dates-awaited, with
completed events last (newest first). Set `groupByStatus: false` to sort purely by date.

So for Ganeshotsav (`2026-09-14` → `2026-09-24`) the card shows **Upcoming · In 6 days** today,
flips to **Happening Now · 6 days left** on 18 Sep, shows **Last day** on 24 Sep, and becomes
**Completed** on 25 Sep — with no edits from anyone.

### Event fields

| Field         | Required | Example                                   | Notes |
|---------------|----------|-------------------------------------------|-------|
| `title`       | ✅ Yes   | `Ganeshotsav 2026`                        | Card heading. Rows without a title are skipped. |
| `description` | No       | `Eleven-day celebration with daily aarti…`| Card body text. |
| `startDate`   | No       | `2026-09-14`                              | `YYYY-MM-DD`. Drives status + sorting. Leave blank for "Dates Awaited". |
| `endDate`     | No       | `2026-09-24`                              | Omit for single-day events. |
| `day`         | No       | `Daily`                                   | Free text. |
| `time`        | No       | `All Day`                                 | Free text. |
| `venue`       | No       | `Ganesh Mandap, Austin Arena`             | Free text. |
| `category`    | No       | `Cultural` / `Sports` / `Community`       | Optional grey tag beside the status badge. (`badge` also accepted.) |
| `link`        | No       | `https://…/ganeshotsav-2026/`             | Blank → card shows a disabled "Details Coming Soon". |
| `linkLabel`   | No       | `Visit Event Page`                        | Defaults to `View Details`. |
| `external`    | No       | `true`                                    | Opens in a new tab. Auto-detected for `http(s)://` links. |
| `dateDisplay` | No       | `Second Sunday, monthly`                  | Overrides the auto-formatted date text. |
| `id`          | No       | `ganeshotsav-2026`                        | For your own reference only. |

Dates are formatted automatically, e.g. `2026-09-14` + `2026-09-24` → **14 - 24 Sep 2026**.

### Option A — JSON file (default, currently in use)

Edit **`data/events.json`** and add an object to the `events` array:

```json
{
  "events": [
    {
      "id": "ganeshotsav-2026",
      "title": "Ganeshotsav 2026",
      "description": "Eleven-day celebration with daily aarti and cultural performances.",
      "startDate": "2026-09-14",
      "endDate": "2026-09-24",
      "day": "Daily",
      "time": "All Day",
      "venue": "Ganesh Mandap, Austin Arena",
      "category": "Cultural",
      "link": "https://austin-arena.github.io/austin-arena-ganeshotsav-2026/",
      "linkLabel": "Visit Event Page",
      "external": true
    }
  ]
}
```

For an event whose dates aren't finalised, just leave the date fields as `""` — the card will
render with a **Dates Awaited** badge until you fill them in.

Commit and push — the site updates on the next deploy.

### Option B — CSV file

`data/events.csv` is kept in sync with `data/events.json` and uses the same field names, so it
works as a drop-in alternative **and** as the upload template for Google Sheets.

```csv
id,title,description,startDate,endDate,day,time,venue,badge,link,linkLabel,external
ganeshotsav-2026,Ganeshotsav 2026,"Our flagship eleven-day celebration…",2026-09-14,2026-09-24,Daily,All Day,"Ganesh Mandap, Austin Arena",Cultural,https://austin-arena.github.io/austin-arena-ganeshotsav-2026/,Visit Event Page,TRUE
navratri-2026,Navratri Garba Nights,"Nine nights of dandiya and garba…",,,,,,Cultural,,,
```

To use it, set in `js/config.js`:

```js
source: 'csv',
url: 'data/events.csv',
```

Rules:
- Row 1 must be the header row, using the exact field names above.
- Any value containing a **comma** must be wrapped in double quotes
  (e.g. `"Ganesh Mandap, Austin Arena"`). A literal `"` inside a quoted value is written as `""`.
- Leave date cells **empty** for events not yet scheduled — they render as *Dates Awaited*.
- `external` accepts `TRUE` / `true` / `yes` / `1`.

### Option C — Google Sheet

Best option if non-technical committee members need to update events **without touching the repo**.

1. **Create the sheet**
   - New Google Sheet → rename the tab to `Events`.
   - Easiest start: **File → Import → Upload → `data/events.csv`** → *Replace spreadsheet*.
     This gives you the correct headers and existing events in one step.
   - Or create the header row manually with these exact column names:
     ```
     id | title | description | startDate | endDate | day | time | venue | badge | link | linkLabel | external
     ```
   - Add one event per row. Do **not** add a status column — it is derived from the dates.

   > **Important — stop Sheets reformatting your data.** Select columns
   > `startDate`, `endDate` and `time`, then set
   > **Format → Number → Plain text** *before* typing/pasting.
   > If you forget, it still works: the site understands `9/14/2026`, `14/09/2026`,
   > `18:30:00` and `6:30:00 PM` and converts them back automatically.

2. **Publish it**
   - `File → Share → Publish to web`
   - Choose the **Events** sheet, format **Comma-separated values (.csv)**, click **Publish**.
   - (Also set `Share → General access → Anyone with the link → Viewer`.)

3. **Copy the Sheet ID** from the URL:
   ```
   https://docs.google.com/spreadsheets/d/1AbCdEfGhIjKlMnOpQrStUvWxYz1234567890/edit
                                          └────────────── Sheet ID ─────────────┘
   ```

4. **Update `js/config.js`**
   ```js
   window.ARENA_CONFIG = {
       events: {
           source: 'sheet',
           sheetId: '1AbCdEfGhIjKlMnOpQrStUvWxYz1234567890',
           sheetName: 'Events',
           hidePastEvents: false,
           sortOrder: 'asc'
       }
   };
   ```

5. Commit + push once. From then on, **editing the sheet updates the live site** — no deploy needed
   (Google caches published sheets for a few minutes).

> **Note:** the published sheet is public-readable. Don't put personal resident data in it.

---

## Adding a new page

Copy `society-info.html` as a template — it already contains the shared header, hero, breadcrumb and
footer. Then:

1. Update `<title>`, the breadcrumb, `<h1>` and the intro text.
2. Replace the `.content-panel` block with your content.
3. Link to it from `index.html` by pointing the relevant `.card-btn` `href` at your new file.

---

## Deploying to GitHub Pages

### One-time setup

```bash
cd austin-arena
git init
git add .
git commit -m "Initial commit: Austin Arena society portal"
git branch -M main
git remote add origin https://github.com/<your-username>/austin-arena.git
git push -u origin main
```

Then in the repository on GitHub:

**Settings → Pages → Build and deployment → Source → `GitHub Actions`**

That's it. The included workflow (`.github/workflows/deploy.yml`) publishes the site on every push
to `main`. No build step is required — the repo root is uploaded as-is.

Your site will be live at:

```
https://<your-username>.github.io/austin-arena/
```

### Subsequent updates

```bash
git add .
git commit -m "Add Navratri 2026 event"
git push
```

Watch progress under the repository's **Actions** tab (usually ~30 seconds).

### Alternative: deploy without Actions

**Settings → Pages → Source → Deploy from a branch → `main` / `(root)`** also works, since the site
is already plain static files. In that case you can delete `.github/workflows/deploy.yml`.

### Custom domain (optional)

1. Add a file named `CNAME` in the project root containing your domain, e.g. `austinarena.in`.
2. Add a `CNAME` DNS record at your registrar pointing to `<your-username>.github.io`.
3. **Settings → Pages → Custom domain** → enter the domain → tick **Enforce HTTPS**.

---

## Troubleshooting

| Symptom | Cause / Fix |
|---|---|
| "Unable to load events right now" locally | You opened the file directly. Serve over HTTP (`python3 -m http.server 8000`). |
| Events page shows "No events have been published yet" | Data file is empty, or every row is missing a `title`. Also check `hidePastEvents` isn't hiding everything. |
| Event shows the wrong status | Status comes only from `startDate`/`endDate`. Check they're `YYYY-MM-DD` and that `endDate` isn't earlier than `startDate`. |
| Event stuck on "Dates Awaited" | `startDate` is blank or unparseable — fill it in as `YYYY-MM-DD`. |
| Google Sheet changes not appearing | Google caches published CSV for a few minutes. Hard-refresh (`Cmd/Ctrl + Shift + R`) and confirm the sheet is still **Published to web**. |
| Sheet loads but cards are blank | Header row names must match exactly (case-sensitive) and the tab name must match `sheetName`. |
| Dates look wrong | Use `YYYY-MM-DD`. In Sheets, format date columns as **Plain text** to stop auto-reformatting. |
| Time shows as `18:30` or `6:30:00 PM` | Sheets converted the cell to a time value. It is auto-corrected to `6:30 PM`; to avoid it entirely, format the `time` column as **Plain text**. |
| A column is shifted / text split across cells | An unquoted comma in the CSV. Wrap that value in double quotes. |
| Logo missing | `assets/logo/arena_logo_white.svg` not found — the site automatically falls back to a text logo. |
| Slider images not showing | Check filenames in `assets/images/gallery/` match the `background-image` URLs in `index.html`. |
| 404 on GitHub Pages | Ensure Pages source is set, the workflow succeeded, and links use relative paths (`society-events.html`, not `/society-events.html`). |

---

## Accessibility & browser support

- Skip-to-content link, ARIA roles on the carousel, visible focus rings.
- Carousel auto-rotation pauses on hover, keyboard focus, when the tab is hidden, and is disabled
  entirely for users with `prefers-reduced-motion`.
- Works in all current versions of Chrome, Edge, Firefox and Safari (desktop + mobile).

---

© Austin Arena Co-operative Housing Society Limited. Registered under the Maharashtra Co-operative
Societies Act, 1960.

