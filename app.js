/* ============================================================
   GTM Process Survey (Greenly)
   Bilingual (EN/FR), role/team capture, per-process questions,
   POSTs the collected answers to a Clay webhook.
   ============================================================ */

// >>> Paste the Clay webhook URL here when ready. Leave "" to test locally. <<<
const CLAY_WEBHOOK_URL = "https://api.clay.com/v3/sources/webhook/pull-in-data-from-a-webhook-85591784-59f9-4594-a89b-20e59f384a62";

/* ---------- Static UI strings ---------- */
const T = {
  eyebrow:   { en: "GTM enablement", fr: "GTM enablement" },
  title:     { en: "GTM process survey", fr: "Enquête sur les process GTM" },
  intro:     {
    en: "5 minutes. For each GTM tool below, tell us if you know it, how often you use it, and whether it's useful. Your honest feedback shapes what we build, fix, or retire.",
    fr: "5 minutes. Pour chaque outil GTM ci-dessous, dis-nous si tu le connais, à quelle fréquence tu l'utilises et s'il est utile. Tes réponses honnêtes décident de ce qu'on améliore, corrige ou abandonne."
  },
  youTitle:  { en: "About you", fr: "À propos de toi" },
  roleLabel: { en: "Your role", fr: "Ton rôle" },
  teamLabel: { en: "Your team", fr: "Ton équipe" },
  teamPh:    { en: "Select your team…", fr: "Choisis ton équipe…" },
  whereFind: { en: "Where to find it", fr: "Où le trouver" },

  qKnow:     { en: "Do you know this process?", fr: "Connais-tu ce process ?" },
  qFreq:     { en: "How often do you use it?", fr: "À quelle fréquence l'utilises-tu ?" },
  qUseful:   { en: "Do you think it's useful?", fr: "Le trouves-tu utile ?" },
  qWhyNot:   { en: "If you don't use it, why not?", fr: "Si tu ne l'utilises pas, pourquoi ?" },
  qWhyNotHint:{ en: "select all that apply", fr: "plusieurs choix possibles" },
  qComment:  { en: "Anything to add? (bugs, ideas, what would make it better)", fr: "Un commentaire ? (bugs, idées, ce qui l'améliorerait)" },
  commentPh: { en: "Optional…", fr: "Optionnel…" },

  magicTitle:{ en: "One last thing 🪄", fr: "Une dernière chose 🪄" },
  magicQ:    { en: "If you had a magic wand, what would you want us to build, automate or fix next? Tell us your biggest day-to-day pains. What slows you down, what data you wish you had, what you do manually today.", fr: "Si tu avais une baguette magique, qu'est-ce que tu voudrais qu'on construise, automatise ou corrige en priorité ? Dis-nous tes plus grosses galères au quotidien. Ce qui te ralentit, les données qui te manquent, ce que tu fais à la main aujourd'hui." },
  magicPh:   { en: "Dream big. No idea is too small or too crazy…", fr: "Vois grand. Aucune idée n'est trop petite ou trop folle…" },
  submit:    { en: "Submit survey", fr: "Envoyer l'enquête" },
  sending:   { en: "Sending…", fr: "Envoi…" },
  progress:  { en: (d,t)=>`${d} of ${t} sections complete`, fr: (d,t)=>`${d} section(s) sur ${t} complétée(s)` },
  needRole:  { en: "Please select your role first.", fr: "Merci de sélectionner ton rôle d'abord." },
  needAll:   { en: "Please answer every question before submitting. See the sections marked in red.", fr: "Merci de répondre à toutes les questions avant d'envoyer. Voir les sections en rouge." },
  requiredMark:{ en: "required", fr: "obligatoire" },
  ok:        { en: "Thanks, your answers were recorded.", fr: "Merci, tes réponses ont été enregistrées." },
  err:       { en: "Couldn't reach the server. Your answers were saved locally, please try again.", fr: "Serveur injoignable. Réponses sauvegardées localement, réessaie." },
  thanksT:   { en: "Thank you!", fr: "Merci !" },
  thanksP:   { en: "Your feedback has been sent to the GTM team.", fr: "Ton feedback a bien été transmis à l'équipe GTM." },
  placeholder:{ en: "Screenshot to be added", fr: "Capture à ajouter" },
};

/* ---------- Answer option sets (value keys are language-independent) ---------- */
const KNOW = [{v:"yes",en:"Yes",fr:"Oui"},{v:"no",en:"No",fr:"Non"}];
const ROLE = [{v:"sdr",en:"SDR",fr:"SDR"},{v:"ae",en:"AE",fr:"AE"},{v:"teamlead",en:"Team Lead",fr:"Team Lead"},{v:"other",en:"Other",fr:"Autre"}];
const TEAM = [
  {v:"europe",        en:"Europe",        fr:"Europe"},
  {v:"france",        en:"France",        fr:"France"},
  {v:"uk",            en:"UK",            fr:"UK"},
  {v:"international", en:"International", fr:"International"},
];
const FREQ = [
  {v:"daily",   en:"Daily",   fr:"Quotidiennement"},
  {v:"weekly",  en:"Weekly",  fr:"Chaque semaine"},
  {v:"monthly", en:"Monthly", fr:"Chaque mois"},
  {v:"rarely",  en:"Rarely",  fr:"Rarement"},
  {v:"never",   en:"Never",   fr:"Jamais"},
];
const USEFUL = [
  {v:"very",     en:"Very useful",     fr:"Très utile"},
  {v:"somewhat", en:"Somewhat useful", fr:"Plutôt utile"},
  {v:"not",      en:"Not useful",      fr:"Pas utile"},
  {v:"unsure",   en:"Not sure",        fr:"Je ne sais pas"},
];
const WHYNOT = [
  {v:"unaware",   en:"I didn't know it existed",      fr:"Je ne savais pas que ça existait"},
  {v:"noproblem", en:"It's not a problem I have",     fr:"Ce n'est pas un besoin pour moi"},
  {v:"quality",   en:"I doubt the data quality",      fr:"Je doute de la qualité des données"},
  {v:"howto",     en:"I don't know how to use it",    fr:"Je ne sais pas comment l'utiliser"},
  {v:"complex",   en:"Too time-consuming / complex",  fr:"Trop long / complexe"},
  {v:"othertool", en:"I use another tool for this",   fr:"J'utilise un autre outil"},
  {v:"other",     en:"Other",                         fr:"Autre"},
];

/* ---------- The 9 GTM processes ---------- */
const PROCESSES = [
  {
    id: "phone_enrichment",
    name: { en: "Phone enrichment", fr: "Enrichissement téléphone" },
    desc: {
      en: "Finds and fills the phone & mobile number on a HubSpot contact so you can call without leaving the record.",
      fr: "Trouve et renseigne le téléphone fixe & mobile d'un contact HubSpot pour appeler sans quitter la fiche."
    },
    where: { en: "HubSpot contact record → <b>“Need a Phone Number?”</b> card", fr: "Fiche contact HubSpot → carte <b>« Need a Phone Number? »</b>" },
    shots: [ { src: "assets/img/phone-enrichment.png", cap: { en: "Contact record, phone card", fr: "Fiche contact, carte téléphone" } } ],
  },
  {
    id: "contact_sourcing",
    name: { en: "Contact sourcing", fr: "Sourcing de contacts" },
    desc: {
      en: "Finds net-new ICP contacts at a target company and pushes them into HubSpot, ready to work.",
      fr: "Trouve de nouveaux contacts ICP dans une entreprise cible et les pousse dans HubSpot, prêts à travailler."
    },
    where: { en: "HubSpot record, <b>“Get More Prospect”</b> card", fr: "Fiche HubSpot, carte <b>« Get More Prospect »</b>" },
    shots: [ { src: "assets/img/contact-sourcing.png", cap: { en: "Get More Prospect card", fr: "Carte Get More Prospect" } } ],
  },
  {
    id: "decision_maker_sourcing",
    name: { en: "Decision maker sourcing", fr: "Sourcing des décideurs" },
    desc: {
      en: "Identifies the right decision-makers (senior Sustainability / ESG / CSR personas) at an account.",
      fr: "Identifie les bons décideurs (personas Sustainability / ESG / RSE seniors) sur un compte."
    },
    where: { en: "HubSpot record, <b>“Get More Prospect”</b> card (Is there a Decision Maker?)", fr: "Fiche HubSpot, carte <b>« Get More Prospect »</b> (Is there a Decision Maker?)" },
    shots: [ { src: "assets/img/decision-maker-sourcing.png", cap: { en: "Get More Prospect card", fr: "Carte Get More Prospect" } } ],
  },
  {
    id: "gtm_insight_generator",
    name: { en: "GTM Insight generator", fr: "Générateur de GTM Insight" },
    desc: {
      en: "AI-generated ESG intel on a company (last ADEME/BEGES report, scopes covered, maturity), plus a GTM fit score, surfaced right on the record.",
      fr: "Intel ESG généré par IA sur une entreprise (dernier bilan ADEME/BEGES, scopes couverts, maturité), plus un GTM Score, directement sur la fiche."
    },
    where: { en: "Contact record <b>“GTM Insight”</b> card, company record <b>“IA Insight by GTM”</b>, and <b>GTM Score</b> under GTM Tools", fr: "Carte <b>« GTM Insight »</b> (contact), <b>« IA Insight by GTM »</b> (entreprise) et <b>GTM Score</b> dans GTM Tools" },
    shots: [
      { src: "assets/img/gtm-insight.png", cap: { en: "IA Insight by GTM (record)", fr: "IA Insight by GTM (fiche)" } },
      { src: "assets/img/gtm-score.png",   cap: { en: "GTM Score (fit score)", fr: "GTM Score (fit score)" } },
    ],
  },
  {
    id: "auto_leadgen_sdr",
    name: { en: "Auto LeadGen for SDRs", fr: "Auto LeadGen pour SDR" },
    desc: {
      en: "Automated lead-generation flows (Apollo / SalesNav) that build prospect lists for SDRs on demand.",
      fr: "Flux de lead-gen automatisés (Apollo / SalesNav) qui construisent des listes de prospects pour les SDR à la demande."
    },
    where: { en: "Slack <b>#ask-your-gtm</b> → <b>Apollo LeadGen</b> / <b>SalesNav LeadGen</b>", fr: "Slack <b>#ask-your-gtm</b> → <b>Apollo LeadGen</b> / <b>SalesNav LeadGen</b>" },
    shots: [ { src: "assets/img/leadgen-buttons.png", cap: { en: "LeadGen buttons in #ask-your-gtm", fr: "Boutons LeadGen dans #ask-your-gtm" } } ],
  },
  {
    id: "auto_leadgen_ae",
    name: { en: "Auto LeadGen for AEs", fr: "Auto LeadGen pour AE" },
    desc: {
      en: "The same lead-gen engine tuned for AE pipeline generation and account expansion.",
      fr: "Le même moteur de lead-gen, calibré pour la génération de pipe et l'expansion de comptes des AE."
    },
    where: { en: "Slack <b>#ask-your-gtm</b> → <b>Apollo LeadGen</b> / <b>SalesNav LeadGen</b>", fr: "Slack <b>#ask-your-gtm</b> → <b>Apollo LeadGen</b> / <b>SalesNav LeadGen</b>" },
    shots: [ { src: "assets/img/leadgen-buttons.png", cap: { en: "LeadGen buttons in #ask-your-gtm", fr: "Boutons LeadGen dans #ask-your-gtm" } } ],
  },
  {
    id: "influ2_automation",
    name: { en: "Influ2 campaign automation", fr: "Automatisation des campagnes Influ2" },
    desc: {
      en: "Pushes targeted contacts into Influ2 ABM ad campaigns automatically, so decision-makers see Greenly ads before you reach out.",
      fr: "Pousse automatiquement les contacts ciblés dans les campagnes ABM Influ2, pour que les décideurs voient les pubs Greenly avant ton approche."
    },
    where: { en: "Slack <b>#ask-your-gtm</b> → <b>Influ2 Leads</b>", fr: "Slack <b>#ask-your-gtm</b> → <b>Influ2 Leads</b>" },
    shots: [ { src: "assets/img/influ2-leads.png", cap: { en: "Influ2 Leads in #ask-your-gtm", fr: "Influ2 Leads dans #ask-your-gtm" } } ],
  },
  {
    id: "company_size_refresh",
    name: { en: "Company size refreshment automation", fr: "Rafraîchissement de la taille d'entreprise" },
    desc: {
      en: "Keeps the company headcount / size fields up to date in HubSpot automatically, so segmentation and routing stay accurate.",
      fr: "Maintient à jour automatiquement les champs effectif / taille d'entreprise dans HubSpot, pour une segmentation et un routage justes."
    },
    where: { en: "Runs in the background on the HubSpot company record", fr: "Tourne en arrière-plan sur la fiche entreprise HubSpot" },
    shots: [ { src: "assets/img/company-size-refresh.png", cap: { en: "Company record, Company Size Refresh", fr: "Fiche entreprise, Company Size Refresh" } } ],
  },
  {
    id: "vertical_mapping",
    name: { en: "Vertical mapping automation", fr: "Mapping vertical automatisé" },
    badge: true,
    desc: {
      en: "Automatically maps a company to its Greenly vertical / sector taxonomy, driving relevant messaging, references and playbooks.",
      fr: "Mappe automatiquement une entreprise à son vertical / secteur Greenly, pour un message, des références et des playbooks pertinents."
    },
    where: { en: "HubSpot company record (sector / vertical field)", fr: "Fiche entreprise HubSpot (champ secteur / vertical)" },
    shots: [ { src: "assets/img/vertical-mapping.png", cap: { en: "Company record, Sub-Vertical Check", fr: "Fiche entreprise, Sub-Vertical Check" } } ],
  },
];

/* ---------- State ---------- */
let lang = "en";
const state = {
  role: null,
  team: "",
  magicWand: "",
  showErrors: false, // set true after a blocked submit, to highlight what's missing
  answers: {}, // id -> { know, freq, useful, whynot:[], comment }
};
PROCESSES.forEach(p => state.answers[p.id] = { know:null, freq:null, useful:null, whynot:[], comment:"" });

/* ---------- Helpers ---------- */
const app = document.getElementById("app");
const tr = (obj) => (typeof obj === "function" ? obj : obj[lang]);
const L = (item) => item[lang];

function el(tag, cls, html) {
  const n = document.createElement(tag);
  if (cls) n.className = cls;
  if (html != null) n.innerHTML = html;
  return n;
}

/* single-select pill group */
function pillGroup(options, selected, onSelect, multi=false) {
  const wrap = el("div", "opts");
  options.forEach(o => {
    const isSel = multi ? selected.includes(o.v) : selected === o.v;
    const lab = el("label", "opt" + (multi ? " multi" : "") + (isSel ? " checked" : ""));
    const input = el("input");
    input.type = multi ? "checkbox" : "radio";
    input.checked = isSel;
    lab.appendChild(input);
    lab.appendChild(document.createTextNode(L(o)));
    lab.addEventListener("click", (e) => { e.preventDefault(); onSelect(o.v); });
    wrap.appendChild(lab);
  });
  return wrap;
}

function questionBlock(labelText, node, hint, missing) {
  const q = el("div", "q" + (missing ? " missing" : ""));
  const flag = missing ? ` <span class="miss-flag">(${L(T.requiredMark)})</span>` : "";
  const lab = el("div", "label", labelText + (hint ? ` <span class="hint">(${hint})</span>` : "") + flag);
  q.appendChild(lab);
  q.appendChild(node);
  return q;
}

/* which required answers are missing for a process */
function sectionMissing(p) {
  const a = state.answers[p.id];
  const m = [];
  if (!a.know) m.push("know");
  if (a.know === "yes") {
    if (!a.freq) m.push("freq");
    if (!a.useful) m.push("useful");
    if ((a.freq === "rarely" || a.freq === "never") && a.whynot.length === 0) m.push("whynot");
  }
  if (a.know === "no" && a.whynot.length === 0) m.push("whynot");
  return m;
}
function allComplete() {
  return !!state.role && PROCESSES.every(p => sectionMissing(p).length === 0);
}

/* ---------- Render ---------- */
function render() {
  app.innerHTML = "";

  // hero
  const hero = el("div", "hero");
  hero.appendChild(el("div", "eyebrow", L(T.eyebrow)));
  hero.appendChild(el("h1", null, L(T.title)));
  hero.appendChild(el("p", null, L(T.intro)));
  app.appendChild(hero);

  // respondent card
  const rc = el("div", "card");
  rc.appendChild(el("h2", null, L(T.youTitle)));
  const roleField = el("div", "field");
  roleField.style.marginTop = "16px";
  roleField.appendChild(el("div", "label", L(T.roleLabel)));
  roleField.appendChild(pillGroup(ROLE, state.role, v => { state.role = v; render(); }));
  rc.appendChild(roleField);

  const teamField = el("div", "field");
  teamField.appendChild(el("div", "label", L(T.teamLabel)));
  const sel = el("select", "gy-select");
  const ph = el("option", null, L(T.teamPh));
  ph.value = ""; ph.disabled = true; ph.selected = !state.team;
  sel.appendChild(ph);
  TEAM.forEach(t => {
    const o = el("option", null, L(t));
    o.value = t.v; o.selected = state.team === t.v;
    sel.appendChild(o);
  });
  sel.addEventListener("change", e => { state.team = e.target.value; render(); });
  teamField.appendChild(sel);
  rc.appendChild(teamField);
  app.appendChild(rc);

  // process cards
  PROCESSES.forEach((p, i) => app.appendChild(processCard(p, i + 1)));

  // magic-wand card
  const mw = el("div", "card");
  mw.appendChild(el("h2", null, L(T.magicTitle)));
  mw.appendChild(el("p", "desc", L(T.magicQ)));
  const mwTa = el("textarea");
  mwTa.style.marginTop = "14px";
  mwTa.style.minHeight = "110px";
  mwTa.placeholder = L(T.magicPh);
  mwTa.value = state.magicWand;
  mwTa.addEventListener("input", e => state.magicWand = e.target.value);
  mw.appendChild(mwTa);
  app.appendChild(mw);

  // footer actions
  const foot = el("div", "footer-actions");
  const btn = el("button", "btn btn-primary");
  btn.id = "submitBtn";
  btn.textContent = L(T.submit);
  btn.addEventListener("click", submit);
  foot.appendChild(btn);
  const done = PROCESSES.filter(p => sectionMissing(p).length === 0).length;
  foot.appendChild(el("span", "progress-note tnum", tr(T.progress)(done, PROCESSES.length)));
  app.appendChild(foot);
}

function processCard(p, idx) {
  const a = state.answers[p.id];
  const miss = state.showErrors ? sectionMissing(p) : [];
  const isMissing = k => miss.includes(k);
  const card = el("div", "card" + (miss.length ? " card-missing" : ""));

  // head
  const head = el("div", "card-head");
  head.appendChild(el("span", "idx tnum", String(idx)));
  const headText = el("div");
  const badge = p.badge ? ` <span class="badge-new">${lang === "fr" ? "Nouveau" : "New"}</span>` : "";
  headText.appendChild(el("h2", null, L(p.name) + badge));
  head.appendChild(headText);
  card.appendChild(head);

  card.appendChild(el("p", "desc", L(p.desc)));
  card.appendChild(el("p", "where", `<b>${L(T.whereFind)}:</b> ${L(p.where)}`));

  // screenshots: collapse cleanly if the file isn't there yet
  if (p.shots && p.shots.length) {
    const shots = el("div", "shots");
    p.shots.forEach(s => {
      const shot = el("div", "shot");
      const img = el("img");
      img.src = s.src;
      img.alt = L(s.cap);
      img.addEventListener("error", () => {
        // no screenshot yet: drop this slot, and the whole strip if it's now empty
        shot.remove();
        if (!shots.children.length) shots.remove();
      });
      shot.appendChild(img);
      shot.appendChild(el("div", "cap", L(s.cap)));
      shots.appendChild(shot);
    });
    card.appendChild(shots);
  }

  // Q1: know
  card.appendChild(questionBlock(
    `${L(T.qKnow)}<span class="req">*</span>`,
    pillGroup(KNOW, a.know, v => { a.know = v; render(); }),
    null, isMissing("know")
  ));

  // Q2: frequency (only if known)
  if (a.know === "yes") {
    card.appendChild(questionBlock(
      L(T.qFreq),
      pillGroup(FREQ, a.freq, v => { a.freq = v; render(); }),
      null, isMissing("freq")
    ));
  }

  // Q3: usefulness (once they've answered know)
  if (a.know) {
    card.appendChild(questionBlock(
      L(T.qUseful),
      pillGroup(USEFUL, a.useful, v => { a.useful = v; render(); }),
      null, isMissing("useful")
    ));
  }

  // Q4: why not (if unknown, or known but rarely/never)
  const showWhy = a.know === "no" || (a.know === "yes" && (a.freq === "rarely" || a.freq === "never"));
  if (showWhy) {
    card.appendChild(questionBlock(
      L(T.qWhyNot),
      pillGroup(WHYNOT, a.whynot, v => {
        const i = a.whynot.indexOf(v);
        if (i >= 0) a.whynot.splice(i, 1); else a.whynot.push(v);
        render();
      }, true),
      L(T.qWhyNotHint), isMissing("whynot")
    ));
  }

  // Q5: comment
  if (a.know) {
    const ta = el("textarea");
    ta.placeholder = L(T.commentPh);
    ta.value = a.comment;
    ta.addEventListener("input", e => a.comment = e.target.value);
    card.appendChild(questionBlock(L(T.qComment), ta));
  }

  return card;
}

/* ---------- Submit ---------- */
function toast(msg, isErr) {
  const t = el("div", "toast" + (isErr ? " error" : ""), msg);
  document.body.appendChild(t);
  setTimeout(() => t.remove(), 4500);
}

function buildPayload() {
  return {
    submitted_at: new Date().toISOString(),
    language: lang,
    role: state.role,
    team: state.team,
    magic_wand: state.magicWand.trim(),
    responses: PROCESSES.map(p => {
      const a = state.answers[p.id];
      return {
        process_id: p.id,
        process_name: p.name.en,
        knows_it: a.know,
        frequency: a.know === "yes" ? a.freq : null,
        usefulness: a.useful,
        reasons_not_using: a.whynot,
        comment: a.comment.trim(),
      };
    }),
  };
}

async function submit() {
  if (!state.role) { toast(L(T.needRole), true); window.scrollTo({ top: 0, behavior: "smooth" }); return; }

  // block until every section is fully answered
  if (!allComplete()) {
    state.showErrors = true;
    render();
    toast(L(T.needAll), true);
    const firstBad = document.querySelector(".card-missing");
    if (firstBad) firstBad.scrollIntoView({ behavior: "smooth", block: "center" });
    return;
  }

  const btn = document.getElementById("submitBtn");
  const payload = buildPayload();
  // always keep a local copy in case the webhook fails
  try { localStorage.setItem("gtm_survey_last", JSON.stringify(payload)); } catch (e) {}

  btn.disabled = true;
  btn.textContent = L(T.sending);

  try {
    if (CLAY_WEBHOOK_URL) {
      // Clay's webhook doesn't return CORS headers, so we send a "simple" request
      // (text/plain body, no-cors) that skips the preflight. The response is opaque
      // and can't be read, but a resolved promise means the POST was delivered.
      // Clay parses the JSON body regardless of the text/plain content type.
      await fetch(CLAY_WEBHOOK_URL, {
        method: "POST",
        mode: "no-cors",
        headers: { "Content-Type": "text/plain;charset=UTF-8" },
        body: JSON.stringify(payload),
      });
    } else {
      // local test mode: no webhook configured yet
      console.log("[GTM survey] no webhook set. Payload:", payload);
      await new Promise(r => setTimeout(r, 500));
    }
    showThanks();
  } catch (err) {
    console.error(err);
    toast(L(T.err), true);
    btn.disabled = false;
    btn.textContent = L(T.submit);
  }
}

function showThanks() {
  app.innerHTML = "";
  const box = el("div", "thanks");
  box.appendChild(el("div", "check", "✓"));
  box.appendChild(el("h1", null, L(T.thanksT)));
  box.appendChild(el("p", null, L(T.thanksP)));
  app.appendChild(box);
  window.scrollTo({ top: 0, behavior: "smooth" });
}

/* ---------- Language toggle ---------- */
document.getElementById("langToggle").addEventListener("click", (e) => {
  const b = e.target.closest("button");
  if (!b) return;
  lang = b.dataset.lang;
  document.documentElement.lang = lang;
  [...e.currentTarget.children].forEach(c => c.classList.toggle("active", c === b));
  render();
});

/* ---------- Go ---------- */
render();
