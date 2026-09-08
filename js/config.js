/**
 * Austin Arena - Site Configuration
 * =================================
 * This is the ONLY file you need to edit to change where events come from.
 *
 * -- Switching data source ---------------------------------------------
 *   source: 'json'   -> data/events.json          (committed to the repo)
 *   source: 'csv'    -> data/events.csv           (committed to the repo)
 *   source: 'sheet'  -> Google Sheet, live edits, no deploy needed
 *
 * -- Fallback chain ----------------------------------------------------
 * `fallback` lists sources to try, in order, if the primary one fails.
 * source 'sheet' + fallback ['json'] means the site keeps working (with
 * slightly older data) if the sheet is unshared or Google is unreachable.
 * Set `fallback: []` to disable and surface the error instead.
 *
 * Event status (Upcoming / Happening Now / Completed / Dates Awaited) is
 * always derived from startDate + endDate. Never maintain it by hand.
 *
 * See README.md -> "Managing events data" for full details.
 */
window.ARENA_CONFIG = {
    events: {
        /* ---- Where the data comes from ---------------------------------- */
        source: 'sheet',            // 'json' | 'csv' | 'sheet'
        fallback: ['json'],         // tried in order if `source` fails

        /* ---- Local file sources ----------------------------------------- */
        url: 'data/events.json',    // used by source/fallback 'json'
        csvUrl: 'data/events.csv',  // used by source/fallback 'csv'

        /* ---- Google Sheet source ---------------------------------------- */
        // From the sheet URL: docs.google.com/spreadsheets/d/<SHEET_ID>/edit
        sheetId: '1-NNSIvxGw5iPsZ3ykhiZHLgDFEG7y7ASoABRBbXnNFs',
        sheetName: 'Events',        // tab name (case-sensitive)
        sheetGid: '',               // optional: tab gid from '#gid=123456'.
                                    // Survives the tab being renamed. Wins if set.

        /* ---- Network reliability ---------------------------------------- */
        timeoutMs: 8000,            // give up on a source after this long
        retries: 1,                 // extra attempts per source before failing
        cacheBust: true,            // append a token so no stale copy is served

        /* ---- Display ----------------------------------------------------- */
        hidePastEvents: false,      // true = drop finished events entirely
        groupByStatus: true,        // ongoing -> upcoming -> TBA -> completed
        sortOrder: 'asc'            // 'asc' = soonest first, 'desc' = newest
    }
};
