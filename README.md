# GTM Process Survey (SDR / AE)

Bilingual (EN/FR) single-page survey covering the 9 GTM processes. Role/team capture,
per-process questions, POSTs all answers to a Clay webhook. Greenly-branded.

## Run locally

```bash
cd ~/gtm-survey
python3 -m http.server 8752
# open http://localhost:8752/
```

## 1. Drop the real screenshots

Save each screenshot as a PNG in `assets/img/` with the **exact filename** below.
Any missing file shows an on-brand "screenshot to be added" placeholder — the survey
still works without them.

| Filename | Process | What it shows | Source |
|---|---|---|---|
| `phone-enrichment.png` | Phone enrichment | "Need a Phone Number?" card | Image #3 |
| `contact-sourcing.png` | Contact sourcing | #ask-your-gtm | to grab |
| `decision-maker-sourcing.png` | Decision maker sourcing | #ask-your-gtm | to grab |
| `gtm-insight-contact.png` | GTM Insight generator | "GTM Insight" card (contact) | Image #2 |
| `gtm-insight-company.png` | GTM Insight generator | "IA Insight by GTM" (company) | Image #5 |
| `gtm-score.png` | GTM Insight generator | "GTM Score" fit score | Image #4 |
| `leadgen-buttons.png` | Auto LeadGen SDR **and** AE | Apollo / SalesNav / Influ2 buttons | Image #6 |
| `influ2-leads.png` | Influ2 campaign automation | "Influ2 Leads" button | Image #6 (crop) |
| `company-size-refresh.png` | Company size refreshment | Company size field | to grab |
| `vertical-mapping.png` | Vertical mapping (NEW) | Company vertical field | to grab |

No rebuild needed — just refresh the page after adding files.

## 2. Wire the Clay webhook

Open `app.js`, set the first line:

```js
const CLAY_WEBHOOK_URL = "https://api.clay.com/v3/sources/webhook/pull-in-data-from-a-webhook-...";
```

With no URL set, submitting logs the payload to the browser console (local test mode)
and still shows the thank-you screen. A copy of every submission is also saved to
`localStorage["gtm_survey_last"]` as a fallback.

### Payload shape sent to Clay

```json
{
  "submitted_at": "2026-09-30T09:24:00.000Z",
  "language": "en",
  "role": "sdr",
  "team": "Outbound FR",
  "responses": [
    {
      "process_id": "phone_enrichment",
      "process_name": "Phone enrichment",
      "knows_it": "yes",
      "frequency": "daily",
      "usefulness": "very",
      "reasons_not_using": [],
      "comment": ""
    }
    // ...one object per process (9 total)
  ]
}
```

## Question logic (per process)

1. **Do you know this process?** (Yes / No) — required
2. **How often do you use it?** — shown only if "Yes"
3. **Do you think it's useful?** — shown once known
4. **If you don't use it, why not?** (multi-select) — shown if "No", or "Yes" + Rarely/Never
5. **Free-text comment** — optional

Only role + at least the "know it?" answers are needed to submit; everything else is optional.

## Files

- `index.html` — shell + language toggle
- `styles.css` — Greenly design tokens (Pangea/Inter, brand green, hairline cards)
- `app.js` — content, rendering, state, webhook submit (edit process copy here)
- `assets/` — fonts, logos, and `img/` screenshots
