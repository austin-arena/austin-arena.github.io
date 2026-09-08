/**
 * Austin Arena - Events Loader
 * Renders event cards from JSON, CSV or a published Google Sheet.
 * Configure the data source in js/config.js
 */
(function () {
    'use strict';

    const DEFAULTS = {
        source: 'json',
        url: 'data/events.json',
        sheetId: '',
        sheetName: 'Events',
        hidePastEvents: false,
        groupByStatus: true,
        sortOrder: 'asc'
    };

    const CONFIG = Object.assign(
        {},
        DEFAULTS,
        (window.ARENA_CONFIG && window.ARENA_CONFIG.events) || {}
    );

    const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
        'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

    document.addEventListener('DOMContentLoaded', () => {
        const grid = document.getElementById('events-grid');
        if (!grid) return;

        const status = document.getElementById('events-status');
        loadEvents()
            .then((events) => renderEvents(grid, status, prepare(events)))
            .catch((err) => {
                console.error('[Events] Failed to load data:', err);
                showStatus(status, 'error',
                    'Unable to load events right now. Please refresh the page or try again later.');
            });
    });

    /* ------------------------------------------------------------------ */
    /* Data loading                                                        */
    /* ------------------------------------------------------------------ */

    function loadEvents() {
        const source = String(CONFIG.source || 'json').toLowerCase();

        if (source === 'sheet') {
            if (!CONFIG.sheetId) {
                return Promise.reject(new Error('config.events.sheetId is empty'));
            }
            const url = 'https://docs.google.com/spreadsheets/d/' +
                encodeURIComponent(CONFIG.sheetId) +
                '/gviz/tq?tqx=out:csv&sheet=' +
                encodeURIComponent(CONFIG.sheetName || 'Events');
            return fetchText(url).then(parseCSV);
        }

        if (source === 'csv') {
            return fetchText(CONFIG.url).then(parseCSV);
        }

        return fetchText(CONFIG.url).then((text) => {
            const data = JSON.parse(text);
            return Array.isArray(data) ? data : (data.events || []);
        });
    }

    function fetchText(url) {
        return fetch(url, { cache: 'no-cache' }).then((res) => {
            if (!res.ok) throw new Error('HTTP ' + res.status + ' for ' + url);
            return res.text();
        });
    }

    /* ------------------------------------------------------------------ */
    /* CSV parsing (handles quoted fields, commas and newlines inside)     */
    /* ------------------------------------------------------------------ */

    function parseCSV(text) {
        const rows = [];
        let row = [];
        let field = '';
        let inQuotes = false;

        text = text.replace(/^\uFEFF/, '').replace(/\r\n/g, '\n').replace(/\r/g, '\n');

        for (let i = 0; i < text.length; i++) {
            const char = text[i];

            if (inQuotes) {
                if (char === '"') {
                    if (text[i + 1] === '"') { field += '"'; i++; }
                    else { inQuotes = false; }
                } else {
                    field += char;
                }
                continue;
            }

            if (char === '"') { inQuotes = true; }
            else if (char === ',') { row.push(field); field = ''; }
            else if (char === '\n') { row.push(field); rows.push(row); row = []; field = ''; }
            else { field += char; }
        }
        row.push(field);
        rows.push(row);

        const cleaned = rows.filter((r) => r.some((c) => String(c).trim() !== ''));
        if (!cleaned.length) return [];

        const headers = cleaned[0].map((h) => String(h).trim());
        return cleaned.slice(1).map((cells) => {
            const obj = {};
            headers.forEach((h, i) => { obj[h] = (cells[i] || '').trim(); });
            return obj;
        });
    }

    /* ------------------------------------------------------------------ */
    /* Normalise + status + sort + filter                                  */
    /* ------------------------------------------------------------------ */

    const STATUS = {
        ongoing:  { key: 'ongoing',  label: 'Happening Now', rank: 0 },
        upcoming: { key: 'upcoming', label: 'Upcoming',      rank: 1 },
        tba:      { key: 'tba',      label: 'Dates Awaited', rank: 2 },
        past:     { key: 'past',     label: 'Completed',     rank: 3 }
    };

    function prepare(rawEvents) {
        const today = startOfDay(new Date());

        let events = (rawEvents || [])
            .filter((e) => e && String(e.title || '').trim() !== '')
            .map((e) => {
                const start = parseDate(e.startDate || e.date);
                const end = parseDate(e.endDate) || start;
                const status = resolveStatus(start, end, today);

                return {
                    title: String(e.title || '').trim(),
                    description: String(e.description || '').trim(),
                    dateDisplay: String(e.dateDisplay || '').trim() ||
                        formatRange(start, end) ||
                        'To be announced',
                    day: String(e.day || '').trim(),
                    time: normalizeTime(e.time),
                    venue: String(e.venue || '').trim(),
                    // Optional free-text tag (Cultural, Sports, Community ...)
                    category: String(e.category || e.badge || '').trim(),
                    link: String(e.link || '').trim(),
                    linkLabel: String(e.linkLabel || '').trim() || 'View Details',
                    external: isTrue(e.external) || /^https?:\/\//i.test(String(e.link || '').trim()),
                    start: start,
                    end: end,
                    status: status,
                    note: statusNote(status, start, end, today)
                };
            });

        if (isTrue(CONFIG.hidePastEvents)) {
            events = events.filter((e) => e.status.key !== 'past');
        }

        const dir = String(CONFIG.sortOrder).toLowerCase() === 'desc' ? -1 : 1;
        const grouped = CONFIG.groupByStatus !== false;

        events.sort((a, b) => {
            if (grouped && a.status.rank !== b.status.rank) {
                return a.status.rank - b.status.rank;
            }
            if (!a.start && !b.start) return 0;
            if (!a.start) return 1;
            if (!b.start) return -1;
            // Completed events always read best newest-first
            if (grouped && a.status.key === 'past') return b.start - a.start;
            return (a.start - b.start) * dir;
        });

        return events;
    }

    /**
     * Status is derived purely from the dates:
     *   no startDate                  -> Dates Awaited
     *   today <  startDate            -> Upcoming
     *   startDate <= today <= endDate -> Happening Now
     *   today >  endDate              -> Completed
     */
    function resolveStatus(start, end, today) {
        if (!start) return STATUS.tba;
        const last = end || start;

        if (today < start) return STATUS.upcoming;
        if (today > last) return STATUS.past;
        return STATUS.ongoing;
    }

    /** Small human-friendly hint shown next to the status badge. */
    function statusNote(status, start, end, today) {
        const DAY_MS = 86400000;

        if (status.key === 'upcoming' && start) {
            const days = Math.round((start - today) / DAY_MS);
            if (days === 0) return 'Starts today';
            if (days === 1) return 'Starts tomorrow';
            if (days <= 30) return 'In ' + days + ' days';
            return '';
        }

        if (status.key === 'ongoing') {
            const last = end || start;
            if (!last) return '';
            const left = Math.round((last - today) / DAY_MS);
            if (left === 0) return 'Last day';
            if (left === 1) return '1 day left';
            return left + ' days left';
        }

        return '';
    }

    function parseDate(value) {
        if (!value) return null;
        const str = String(value).trim();

        // ISO: YYYY-MM-DD
        let m = str.match(/^(\d{4})-(\d{2})-(\d{2})/);
        if (m) return new Date(+m[1], +m[2] - 1, +m[3]);

        // Google Sheets sometimes exports DD/MM/YYYY or MM/DD/YYYY
        m = str.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})/);
        if (m) {
            const a = +m[1], b = +m[2];
            // If the first part can't be a month, treat it as the day
            return a > 12 ? new Date(+m[3], b - 1, a) : new Date(+m[3], a - 1, b);
        }

        const parsed = new Date(str);
        return isNaN(parsed.getTime()) ? null : startOfDay(parsed);
    }

    function startOfDay(d) {
        return new Date(d.getFullYear(), d.getMonth(), d.getDate());
    }

    /**
     * Google Sheets turns "6:30 PM" into a real time value and exports it as
     * "18:30:00" (or "6:30:00 PM"). Convert those back to a readable form.
     * Anything that isn't a bare time string is returned untouched.
     */
    function normalizeTime(value) {
        const str = String(value || '').trim();
        if (!str) return '';

        // "6:30:00 PM" / "6:30:00 am" -> "6:30 PM"
        let m = str.match(/^(\d{1,2}):(\d{2}):\d{2}\s*([AaPp])\.?[Mm]\.?$/);
        if (m) return +m[1] + ':' + m[2] + ' ' + m[3].toUpperCase() + 'M';

        // "18:30:00" or "18:30" -> "6:30 PM"
        m = str.match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?$/);
        if (m) {
            const h = +m[1];
            const min = m[2];
            if (h > 23 || +min > 59) return str;
            const suffix = h >= 12 ? 'PM' : 'AM';
            const hour12 = h % 12 === 0 ? 12 : h % 12;
            return hour12 + ':' + min + ' ' + suffix;
        }

        return str;
    }

    function formatRange(start, end) {
        if (!start) return '';
        const s = fmt(start);
        if (!end || start.getTime() === end.getTime()) return s;

        // Same month & year -> "14 - 24 Sep 2026"
        if (start.getFullYear() === end.getFullYear() && start.getMonth() === end.getMonth()) {
            return start.getDate() + ' - ' + fmt(end);
        }
        // Same year -> "28 Dec - 02 Jan 2027" style still reads fine with full parts
        return s + ' - ' + fmt(end);
    }

    function fmt(d) {
        return d.getDate() + ' ' + MONTHS[d.getMonth()] + ' ' + d.getFullYear();
    }

    function isTrue(v) {
        return v === true || /^(true|yes|y|1)$/i.test(String(v || '').trim());
    }

    /* ------------------------------------------------------------------ */
    /* Rendering                                                           */
    /* ------------------------------------------------------------------ */

    function renderEvents(grid, status, events) {
        grid.innerHTML = '';

        if (!events.length) {
            showStatus(status, 'empty', 'No events have been published yet. Please check back soon.');
            return;
        }

        const fragment = document.createDocumentFragment();
        events.forEach((e) => fragment.appendChild(buildCard(e)));
        grid.appendChild(fragment);

        hideStatus(status);
    }

    function buildCard(e) {
        const card = document.createElement('article');
        card.className = 'event-card is-' + e.status.key;

        const meta = [];
        if (e.dateDisplay) meta.push(metaRow('fa-calendar-day', 'Date', e.dateDisplay));
        if (e.day) meta.push(metaRow('fa-calendar-week', 'Day', e.day));
        if (e.time) meta.push(metaRow('fa-clock', 'Time', e.time));
        if (e.venue) meta.push(metaRow('fa-location-dot', 'Venue', e.venue));

        // Status badge (date-driven) + optional category tag
        const badges =
            '<div class="event-badges">' +
            '<span class="event-badge ' + e.status.key + '">' +
            (e.status.key === 'ongoing' ? '<span class="live-dot" aria-hidden="true"></span>' : '') +
            esc(e.status.label) + '</span>' +
            (e.category ? '<span class="event-tag">' + esc(e.category) + '</span>' : '') +
            (e.note ? '<span class="event-note">' + esc(e.note) + '</span>' : '') +
            '</div>';

        const action = e.link
            ? '<a href="' + esc(e.link) + '" class="card-btn"' +
              (e.external ? ' target="_blank" rel="noopener noreferrer"' : '') +
              ' aria-label="' + esc(e.linkLabel + ' for ' + e.title) +
              (e.external ? ' (opens in new tab)' : '') + '">' +
              esc(e.linkLabel) +
              ' <i class="fa-solid ' + (e.external ? 'fa-arrow-up-right-from-square' : 'fa-arrow-right') +
              '" aria-hidden="true"></i></a>'
            : '<span class="card-btn disabled">Details Coming Soon</span>';

        card.innerHTML =
            badges +
            '<h3 class="event-title">' + esc(e.title) + '</h3>' +
            (e.description ? '<p class="event-desc">' + esc(e.description) + '</p>' : '') +
            (meta.length ? '<ul class="event-meta">' + meta.join('') + '</ul>' : '') +
            action;

        return card;
    }

    function metaRow(icon, label, value) {
        return '<li><i class="fa-solid ' + icon + '" aria-hidden="true"></i>' +
            '<span><strong>' + label + ':</strong> ' + esc(value) + '</span></li>';
    }

    function showStatus(el, type, message) {
        if (!el) return;
        el.className = 'events-status ' + type;
        el.textContent = message;
        el.hidden = false;
    }

    function hideStatus(el) {
        if (el) el.hidden = true;
    }

    function esc(str) {
        return String(str)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }
})();

