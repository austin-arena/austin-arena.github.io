/**
 * Austin Arena - Site Configuration
 * ---------------------------------
 * Change ONLY this file to switch where the events data comes from.
 *
 * events.source options:
 *   'json'   -> local/remote JSON file      (events.url = 'data/events.json')  [current]
 *   'csv'    -> local/remote CSV file       (events.url = 'data/events.csv')
 *   'sheet'  -> Google Sheet (published)    (events.sheetId + events.sheetName)
 *
 * Event status (Ongoing / Upcoming / Completed) is derived automatically from
 * startDate and endDate - you do not need to maintain it by hand.
 *
 * See README.md for the Google Sheet setup steps and column list.
 */
window.ARENA_CONFIG = {
    events: {
        // Active data source
        source: 'json',

        // Used when source is 'json' or 'csv'
        url: 'data/events.json',

        // Used when source is 'sheet'
        // Sheet ID is the long string in the sheet URL:
        // https://docs.google.com/spreadsheets/d/<SHEET_ID>/edit
        sheetId: '',
        sheetName: 'Events',

        // Hide events that have already finished
        hidePastEvents: false,

        // Show ongoing events first, then upcoming, then completed
        groupByStatus: true,

        // Sort by start date within each group: 'asc' (soonest first) or 'desc'
        sortOrder: 'asc'
    }
};

