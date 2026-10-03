/* run non-essential startup work after first paint */
window.__perf = { start: performance.now() };
const onIdle = (fn, ms) => ('requestIdleCallback' in window) ? requestIdleCallback(fn, { timeout: ms }) : setTimeout(fn, Math.min(ms, 1500));
const PIP_MAX = 3;
    const DEFAULT_TARGET = 1; // reproduces the old ">0 counts as done" behavior

    const I18N = {
      en: {
        appTitle: 'Habit Calendar',
        colorGuide: 'Color Guide',
        currentStreak: 'Current Streak',
        perfectDays: 'Perfect Days',
        pushupDays: 'Pushup Days',
        readingDays: 'Reading Days',
        weekdays: ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'],
        months: ['January','February','March','April','May','June',
                 'July','August','September','October','November','December'],
        settingsBtn: '⚙ Settings',
        dayModalTitle: 'Day',
        wakeUp: '⏰ Wake up at 5am',
        wakeUpDone: '⏰ Woke up at 5am ✓',
        titleSection: 'Title',
        titlePlaceholder: 'Give this day a title…',
        nonNegSection: 'Non-Negotiables',
        fitnessSection: 'Fitness',
        skillsSection: 'Skills',
        notesSection: 'Notes',
        filesSection: 'Files',
        nDayLabel: 'What productive did you do today',
        nDayPlaceholder: 'What did you get done today?',
        nReadLabel: 'What I read about',
        nReadPlaceholder: "What was today's reading about?",
        nExtraLabel: 'Anything else',
        nExtraPlaceholder: 'Free space for anything else…',
        addFiles: '+ Add files',
        uploadingFile: 'Uploading',
        maxFileSize: 'Max 500KB per file',
        noFilesForDay: 'No files for this day.',
        deleteThisFile: 'Delete this file',
        deleteConfirm: 'Delete "{name}"?',
        saveDay: 'Save Day',
        saving: 'Saving…',
        savedToast: 'Saved!',
        saveFailedToast: 'Failed to save — please try again.',
        deletedToast: 'Deleted.',
        deleteFailedToast: 'Delete failed.',
        uploadedToast: 'Uploaded.',
        uploadedMultiToast: '{n} files uploaded.',
        uploadFailedToast: 'Upload failed: {name}',
        tooBigToast: '{name}: too big ({size}, max 500KB)',
        dailyTargetsTitle: 'Daily Targets',
        editTargets: '⚙ Edit Daily Targets',
        newTargetValue: 'New target value',
        effectiveFrom: 'Effective from',
        save: 'Save',
        closeWithoutSaving: 'Close without saving',
        removeChange: 'Remove this target change',
        removedToast: 'Removed.',
        targetSavedToast: 'Target saved.',
        targetSaveFailedToast: 'Failed to save target.',
        birthdaySavedToast: '🎂 {name}\'s birthday added!',
        birthdaySaveFailedToast: 'Failed to save birthday — please try again.',
        enterValidTarget: 'Enter a valid target and date.',
        removeFailedToast: 'Failed to remove.',
        noCustomTargets: 'No custom targets set yet — default is {n}.',
        targetHistoryLabel: '{value} from {date}',
        settingsTitle: 'Settings',
        dailyTargetsLabel: 'Daily targets',
        dailyTargetsInfo: 'Shows a daily targets bar and lets you track progress toward goals you set for each day.',
        statsBarLabel: 'Stats bar',
        statsBarInfo: 'Shows a summary bar with stats about your month, like completion rates and streaks.',
        nightModeLabel: 'Night mode',
        nightModeInfo: 'Switches the app to a darker color scheme, easier on the eyes in low light.',
        warnUnsavedLabel: 'Unsaved warning',
        warnUnsavedInfo: 'Warns you before closing a day or leaving settings if you have unsaved changes.',
        disableZoomLabel: 'Disable zoom',
        disableZoomInfo: "Turns off pinch-to-zoom and double-tap zoom on phones, and Ctrl+scroll / Ctrl +/- zoom on PC. Applies to this website only, on every device you're synced to.",
        phoneChars: 'Phone chars:',
        phoneCharsInfo: 'Truncates day titles on phone screens once they pass this many characters.',
        pcChars: 'PC chars:',
        pcCharsInfo: 'Truncates day titles on desktop screens once they pass this many characters.',
        languageLabel: 'Language',
        languageInfo: 'Switches the app language. Syncs across all your devices, same as every other setting.',
        saveSettings: 'Save Settings',
        settingsSaved: 'Settings saved.',
        settingsSaveFailed: 'Failed to save settings — please try again.',
        unsavedSettingsMsg: 'You have unsaved settings changes. Save before closing?',
        unsavedDayMsg: 'You have unsaved changes for this day. Save before closing?',
        target: 'Target',
        pip: 'pip',
        pips: 'pips',
        fields: {
          pushupsCount: 'Pushups',
          readPagesCount: 'Pages',
          stretchPips: 'Stretch',
          lSitPips: 'L-sit',
          oneHandPushupsCount: 'One-hand pushups',
          pullupsCount: 'Pull-ups',
          breathHoldSeconds: 'Hold your breath for',
          productivePips: 'Do something productive',
          cardTrickPips: 'Practice a card trick',
        },
      },
      lt: {
        appTitle: 'Kalendorius',
        colorGuide: 'Spalvų Gidas',
        currentStreak: 'Dabartinė Serija',
        perfectDays: 'Tobulos Dienos',
        pushupDays: 'Atsispaudimų Dienos',
        readingDays: 'Skaitymo Dienos',
        weekdays: ['Pr','An','Tr','Kt','Pn','Št','Sk'],
        months: ['Sausis','Vasaris','Kovas','Balandis','Gegužė','Birželis',
                 'Liepa','Rugpjūtis','Rugsėjis','Spalis','Lapkritis','Gruodis'],
        settingsBtn: '⚙ Nustatymai',
        dayModalTitle: 'Diena',
        wakeUp: '⏰ Atsikelti 5 val. ryto',
        wakeUpDone: '⏰ Atsikėliau 5 val. ✓',
        titleSection: 'Pavadinimas',
        titlePlaceholder: 'Suteikite šiai dienai pavadinimą…',
        nonNegSection: 'Privalomi Dalykai',
        fitnessSection: 'Fizinis Aktyvumas',
        skillsSection: 'Įgūdžiai',
        notesSection: 'Pastabos',
        filesSection: 'Failai',
        nDayLabel: 'Ką produktyvaus nuveikei šiandien',
        nDayPlaceholder: 'Ką nuveikei šiandien?',
        nReadLabel: 'Apie ką skaičiau',
        nReadPlaceholder: 'Apie ką buvo šiandienos skaitymas?',
        nExtraLabel: 'Kas nors kita',
        nExtraPlaceholder: 'Laisva vieta bet kam kitam…',
        addFiles: '+ Pridėti failus',
        uploadingFile: 'Keliama',
        maxFileSize: 'Maks. 500KB vienam failui',
        noFilesForDay: 'Šiai dienai failų nėra.',
        deleteThisFile: 'Ištrinti šį failą',
        deleteConfirm: 'Ištrinti „{name}"?',
        saveDay: 'Išsaugoti Dieną',
        saving: 'Saugoma…',
        savedToast: 'Išsaugota!',
        saveFailedToast: 'Nepavyko išsaugoti — bandykite dar kartą.',
        deletedToast: 'Ištrinta.',
        deleteFailedToast: 'Ištrinti nepavyko.',
        uploadedToast: 'Įkelta.',
        uploadedMultiToast: 'Įkelta failų: {n}.',
        uploadFailedToast: 'Įkėlimas nepavyko: {name}',
        tooBigToast: '{name}: per didelis ({size}, maks. 500KB)',
        dailyTargetsTitle: 'Dienos Tikslai',
        editTargets: '⚙ Keisti Dienos Tikslus',
        newTargetValue: 'Nauja tikslo reikšmė',
        effectiveFrom: 'Galioja nuo',
        save: 'Išsaugoti',
        closeWithoutSaving: 'Uždaryti neišsaugant',
        removeChange: 'Pašalinti šį tikslo pakeitimą',
        removedToast: 'Pašalinta.',
        targetSavedToast: 'Tikslas išsaugotas.',
        targetSaveFailedToast: 'Nepavyko išsaugoti tikslo.',
        birthdaySavedToast: '🎂 {name} gimtadienis pridėtas!',
        birthdaySaveFailedToast: 'Nepavyko išsaugoti gimtadienio — bandykite dar kartą.',
        enterValidTarget: 'Įveskite galiojantį tikslą ir datą.',
        removeFailedToast: 'Pašalinti nepavyko.',
        noCustomTargets: 'Individualūs tikslai dar nenustatyti — numatytasis yra {n}.',
        targetHistoryLabel: '{value} nuo {date}',
        settingsTitle: 'Nustatymai',
        dailyTargetsLabel: 'Dienos tikslai',
        dailyTargetsInfo: 'Rodo dienos tikslų juostą ir leidžia sekti pažangą link kiekvienai dienai užsibrėžtų tikslų.',
        statsBarLabel: 'Statistikos juosta',
        statsBarInfo: 'Rodo suvestinės juostą su mėnesio statistika, pvz., įvykdymo rodikliais ir serijomis.',
        nightModeLabel: 'Nakties režimas',
        nightModeInfo: 'Perjungia programėlę į tamsesnę spalvų schemą, švelnesnę akims prastame apšvietime.',
        warnUnsavedLabel: 'Neišsaugotų perspėjimas',
        warnUnsavedInfo: 'Perspėja prieš uždarant dieną ar nustatymus, jei yra neišsaugotų pakeitimų.',
        disableZoomLabel: 'Išjungti mastelio keitimą',
        disableZoomInfo: 'Išjungia suspaudimo ir dvigubo bakstelėjimo mastelio keitimą telefone bei Ctrl+slinkties / Ctrl +/- mastelio keitimą kompiuteryje. Galioja tik šiai svetainei, visuose sinchronizuotuose įrenginiuose.',
        phoneChars: 'Telefono simboliai:',
        phoneCharsInfo: 'Sutrumpina dienos pavadinimus telefono ekranuose, kai jie viršija šį simbolių skaičių.',
        pcChars: 'Kompiuterio simboliai:',
        pcCharsInfo: 'Sutrumpina dienos pavadinimus kompiuterio ekranuose, kai jie viršija šį simbolių skaičių.',
        languageLabel: 'Kalba',
        languageInfo: 'Keičia programėlės kalbą. Sinchronizuojasi visuose jūsų įrenginiuose, kaip ir kiti nustatymai.',
        saveSettings: 'Išsaugoti Nustatymus',
        settingsSaved: 'Nustatymai išsaugoti.',
        settingsSaveFailed: 'Nepavyko išsaugoti nustatymų — bandykite dar kartą.',
        unsavedSettingsMsg: 'Turite neišsaugotų nustatymų pakeitimų. Išsaugoti prieš uždarant?',
        unsavedDayMsg: 'Turite neišsaugotų šios dienos pakeitimų. Išsaugoti prieš uždarant?',
        target: 'Tikslas',
        pip: 'taškas',
        pips: 'taškai',
        fields: {
          pushupsCount: 'Atsispaudimai',
          readPagesCount: 'Puslapiai',
          stretchPips: 'Tempimas',
          lSitPips: 'L-sit',
          oneHandPushupsCount: 'Atsispaudimai viena ranka',
          pullupsCount: 'Prisitraukimai',
          breathHoldSeconds: 'Sulaikyk kvėpavimą',
          productivePips: 'Padaryti ką nors produktyvaus',
          cardTrickPips: 'Pasipraktikuoti kortų triuką',
        },
      },
    };

    function t(key) {
      const dict = I18N[settings.language] || I18N.en;
      return (key in dict) ? dict[key] : I18N.en[key];
    }
    function tf(key, params) {
      let s = t(key);
      for (const k in params) s = s.split('{' + k + '}').join(params[k]);
      return s;
    }
    function fieldLabel(field) {
      const dict = I18N[settings.language] || I18N.en;
      return (dict.fields && dict.fields[field.key]) || field.label;
    }

    const DEFAULT_SETTINGS = {
      dailyTargetsEnabled:     true,
      showStatsBar:            true,
      mobileTitleLimitEnabled:  true,
      mobileTitleLimit:        35,
      desktopTitleLimitEnabled: false,
      desktopTitleLimit:       60,
      nightMode:               false,
      warnUnsavedChanges:      true,
      language:                'en',
      showBirthdays:           true,
      disableZoom:             false,
    };

    // Pulls the shared settings from D1 on every load. No local fallback —
    // if the fetch fails (offline etc.) we just keep the built-in defaults
    // for this session rather than showing a possibly-stale copy.
    async function loadSettingsFromServer() {
      try {
        const r = await fetch('/api/habits?resource=settings', { cache: 'no-store' });
        if (r.ok) {
          const server = await r.json();
          if (server && typeof server === 'object') {
            settings = { ...DEFAULT_SETTINGS, ...server };
            BootCache.set('settings', server);
          }
        }
      } catch { /* offline → keep defaults for this session */ }
    }

    // Pushes the full settings object to D1 so every device sees it.
    async function saveSettingsToServer() {
      const r = await fetch('/api/habits?resource=settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      });
      if (!r.ok) throw new Error('Save failed: ' + r.status);
    }

    let settings = { ...DEFAULT_SETTINGS }; // defaults until loadSettingsFromServer() resolves
    let pendingSettings = null; // staged edits while the Settings modal is open — only committed on Save

    function applyStatsBarVisibility() {
      const bar = document.querySelector('.stats-bar');
      if (bar) bar.style.display = settings.showStatsBar ? '' : 'none';
    }
    function applyNightMode() {
      document.body.classList.toggle('night-mode', !!settings.nightMode);
    }

    // Disable zoom setting — same switch, two mechanisms:
    //  - Phone: pinch/double-tap zoom is controlled by the viewport
    //    meta tag, so we swap maximum-scale/user-scalable in and out.
    //  - PC: there's no meta-tag equivalent for Ctrl+scroll or
    //    Ctrl +/-/0, so those are caught by the wheel/keydown
    //    listeners registered once below, which just check the live
    //    setting each time rather than being added/removed.
    function applyZoomSetting() {
      const vp = document.getElementById('viewportMetaTag');
      if (!vp) return;
      vp.setAttribute('content', settings.disableZoom
        ? 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no'
        : 'width=device-width, initial-scale=1.0');
    }
    window.addEventListener('wheel', (e) => {
      if (settings.disableZoom && e.ctrlKey) e.preventDefault();
    }, { passive: false });
    window.addEventListener('keydown', (e) => {
      if (!settings.disableZoom) return;
      if ((e.ctrlKey || e.metaKey) && ['=', '+', '-', '_', '0'].includes(e.key)) {
        e.preventDefault();
      }
    });

    function applySettingsEffects() {
      applyStatsBarVisibility();
      applyNightMode();
      applyZoomSetting();
      applyLanguage();
      renderCalendar();
    }

    // Repaints every piece of static chrome text in the current settings.language.
    // Never touches user-entered content (day titles, notes, file names).
    function applyLanguage() {
      document.documentElement.lang = settings.language === 'lt' ? 'lt' : 'en';
      document.getElementById('appTitleEl').textContent      = t('appTitle');
      document.title                                          = t('appTitle');
      document.getElementById('colorGuideEl').textContent    = t('colorGuide');
      document.getElementById('statStreakLabel').textContent  = t('currentStreak');
      document.getElementById('statPerfectLabel').textContent = t('perfectDays');
      document.getElementById('statPushupsLabel').textContent = t('pushupDays');
      document.getElementById('statReadingLabel').textContent = t('readingDays');

      const wdEls = document.querySelectorAll('#weekdaysRow .weekday');
      t('weekdays').forEach((label, i) => { if (wdEls[i]) wdEls[i].textContent = label; });

      document.getElementById('openSettingsBtn').textContent = t('settingsBtn');
      updateWakeBtn();

      document.getElementById('titleSectionEl').textContent   = t('titleSection');
      document.getElementById('dayTitle').placeholder         = t('titlePlaceholder');
      document.getElementById('nonNegSectionEl').textContent  = t('nonNegSection');
      document.getElementById('fitnessSectionEl').textContent = t('fitnessSection');
      document.getElementById('skillsSectionEl').textContent  = t('skillsSection');
      document.getElementById('notesSectionEl').textContent   = t('notesSection');
      document.getElementById('nDayLabelEl').textContent      = t('nDayLabel');
      document.getElementById('nDay').placeholder              = t('nDayPlaceholder');
      document.getElementById('nReadLabelEl').textContent     = t('nReadLabel');
      document.getElementById('nRead').placeholder             = t('nReadPlaceholder');
      document.getElementById('nExtraLabelEl').textContent    = t('nExtraLabel');
      document.getElementById('nExtra').placeholder            = t('nExtraPlaceholder');
      document.getElementById('filesSectionEl').textContent   = t('filesSection');
      document.getElementById('fileAddBtn').textContent       = t('addFiles');
      document.getElementById('filesHintEl').textContent      = t('maxFileSize');
      document.getElementById('saveBtn').textContent          = t('saveDay');

      document.getElementById('targetsModalTitleEl').textContent = t('dailyTargetsTitle');
      document.getElementById('editTargetsBtn').textContent      = t('editTargets');

      document.getElementById('settingsModalTitleEl').textContent = t('settingsTitle');
      document.getElementById('languageLabelEl').textContent      = t('languageLabel');
      document.getElementById('languageInfoBtn').dataset.info     = t('languageInfo');
      document.getElementById('dailyTargetsLabelEl').textContent  = t('dailyTargetsLabel');
      document.getElementById('dailyTargetsInfoBtn').dataset.info = t('dailyTargetsInfo');
      document.getElementById('statsBarLabelEl').textContent      = t('statsBarLabel');
      document.getElementById('statsBarInfoBtn').dataset.info     = t('statsBarInfo');
      document.getElementById('nightModeLabelEl').textContent     = t('nightModeLabel');
      document.getElementById('nightModeInfoBtn').dataset.info    = t('nightModeInfo');
      document.getElementById('warnUnsavedLabelEl').textContent   = t('warnUnsavedLabel');
      document.getElementById('warnUnsavedInfoBtn').dataset.info  = t('warnUnsavedInfo');
      document.getElementById('disableZoomLabelEl').textContent   = t('disableZoomLabel');
      document.getElementById('disableZoomInfoBtn').dataset.info  = t('disableZoomInfo');
      document.getElementById('phoneCharsLabelEl').textContent    = t('phoneChars');
      document.getElementById('phoneCharsInfoBtn').dataset.info   = t('phoneCharsInfo');
      document.getElementById('pcCharsLabelEl').textContent       = t('pcChars');
      document.getElementById('pcCharsInfoBtn').dataset.info      = t('pcCharsInfo');
      document.getElementById('settingsSaveBtn').textContent      = t('saveSettings');
      document.getElementById('confirmSaveBtn').textContent       = t('save');
      document.getElementById('confirmDiscardBtn').textContent    = t('closeWithoutSaving');
      document.querySelectorAll('.lang-btn').forEach(b => {
        b.classList.toggle('active', b.dataset.lang === settings.language);
      });

      // Re-render pieces that build their own markup from field labels
      renderSwipeSections();
      if (activeDate) { refreshAllCards(); updateWakeBtn(); }
      if (document.getElementById('targetsOverlay').classList.contains('open')) {
        renderTargetsFieldList();
      }
    }

    function loadSettingsFormFromPending() {
      document.getElementById('toggleDailyTargets').checked      = pendingSettings.dailyTargetsEnabled;
      document.getElementById('toggleStatsBar').checked           = pendingSettings.showStatsBar;
      document.getElementById('toggleMobileTitleLimit').checked   = pendingSettings.mobileTitleLimitEnabled;
      document.getElementById('mobileTitleLimitInput').value      = pendingSettings.mobileTitleLimit;
      document.getElementById('mobileTitleLimitInput').disabled   = !pendingSettings.mobileTitleLimitEnabled;
      document.getElementById('toggleDesktopTitleLimit').checked  = pendingSettings.desktopTitleLimitEnabled;
      document.getElementById('desktopTitleLimitInput').value     = pendingSettings.desktopTitleLimit;
      document.getElementById('desktopTitleLimitInput').disabled  = !pendingSettings.desktopTitleLimitEnabled;
      document.getElementById('toggleNightMode').checked          = pendingSettings.nightMode;
      document.getElementById('toggleWarnUnsaved').checked        = pendingSettings.warnUnsavedChanges;
      document.getElementById('toggleDisableZoom').checked        = pendingSettings.disableZoom;
      document.querySelectorAll('.lang-btn').forEach(b => {
        b.classList.toggle('active', b.dataset.lang === pendingSettings.language);
      });
    }

    function settingsIsDirty() {
      return JSON.stringify(pendingSettings) !== JSON.stringify(settings);
    }

    // Opens the Settings panel: stage a working copy so nothing is applied
    // or persisted until "Save Settings" is pressed.
    function applySettingsToUI() {
      pendingSettings = { ...settings };
      loadSettingsFormFromPending();
    }

    async function commitSettingsSave() {
      const btn = document.getElementById('settingsSaveBtn');
      btn.disabled = true;
      btn.textContent = t('saving');

      settings = { ...pendingSettings };
      let ok = true;
      try {
        await saveSettingsToServer();
        applySettingsEffects();
        document.getElementById('settingsOverlay').classList.remove('open');
        toast(t('settingsSaved'));
      } catch {
        toast(t('settingsSaveFailed'), true);
        ok = false;
      }

      btn.disabled = false;
      btn.textContent = t('saveSettings');
      return ok;
    }

    let confirmSaveAction = null;
    let confirmDiscardAction = null;

    function showUnsavedConfirm(onSave, onDiscard) {
      confirmSaveAction = onSave;
      confirmDiscardAction = onDiscard;
      document.getElementById('confirmOverlay').classList.add('open');
    }
    function hideUnsavedConfirm() {
      document.getElementById('confirmOverlay').classList.remove('open');
      confirmSaveAction = null;
      confirmDiscardAction = null;
    }
    document.getElementById('confirmSaveBtn').addEventListener('click', () => {
      if (confirmSaveAction) confirmSaveAction();
    });
    document.getElementById('confirmDiscardBtn').addEventListener('click', () => {
      if (confirmDiscardAction) confirmDiscardAction();
    });

    const FIELD_CONFIG = [
      // Non-negotiables
      { key: 'pushupsCount',        kind: 'counter', step: 10, section: 'nonNeg',  label: 'Pushups' },
      { key: 'readPagesCount',      kind: 'counter', step: 10, section: 'nonNeg',  label: 'Pages' },

      // Fitness
      { key: 'stretchPips',         kind: 'pip',                section: 'fitness', label: 'Stretch' },
      { key: 'lSitPips',            kind: 'pip',                section: 'fitness', label: 'L-sit' },
      { key: 'oneHandPushupsCount', kind: 'counter', step: 10, section: 'fitness', label: 'One-hand pushups' },
      { key: 'pullupsCount',        kind: 'counter', step: 5,  section: 'fitness', label: 'Pull-ups' },
      { key: 'breathHoldSeconds',   kind: 'counter', step: 10, section: 'fitness', label: 'Hold your breath for', unit: 's' },

      // Skills
      { key: 'productivePips',      kind: 'pip',                section: 'skills',  label: 'Do something productive' },
      { key: 'cardTrickPips',       kind: 'pip',                section: 'skills',  label: 'Practice a card trick' },
    ];

    let now       = new Date();
    let viewYear  = now.getFullYear();
    let viewMonth = now.getMonth();
    const BootCache = {
      KEY: 'habitcal_boot_v1',
      _d: null,
      _read() { if (!this._d) { try { this._d = JSON.parse(localStorage.getItem(this.KEY)) || {}; } catch (e) { this._d = {}; } } return this._d; },
      get(k) { return this._read()[k]; },
      set(k, v) {
        this._read()[k] = v;
        clearTimeout(this._t);
        this._t = setTimeout(() => { try { localStorage.setItem(this.KEY, JSON.stringify(this._d)); } catch (e) {} }, 400);
      },
    };
    let habitsData = {};
    let allFiles   = {};
    let activeDate = null;
    let initialFormSnapshot = null; // JSON snapshot of the day form taken at openModal, used to detect unsaved changes

    // Target history: raw rows from the API, plus a field → sorted-array index
    let targetsData    = [];
    let targetsByField = {};

    function defaultEntry(date) {
      const e = { date, title: '', wokeAt5: false, nDay: '', nRead: '', nExtra: '' };
      for (const f of FIELD_CONFIG) e[f.key] = 0;
      return e;
    }

    let formState = defaultEntry(null);

    const MAX_FILE_BYTES = 500 * 1024;

    function pad(n) { return String(n).padStart(2, '0'); }

    // English ordinal suffix for a day-of-month number (1st, 2nd, 3rd,
    // 4th... 11th/12th/13th are exceptions). Only used for the plain-
    // text locked-view date label when settings.language is 'en'.
    function ordinalSuffix(d) {
      const j = d % 10, k = d % 100;
      if (j === 1 && k !== 11) return 'st';
      if (j === 2 && k !== 12) return 'nd';
      if (j === 3 && k !== 13) return 'rd';
      return 'th';
    }
    function mondayIdx(dow) { return (dow + 6) % 7; }
    function todayStr() {
      const d = new Date();
      return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
    }


    function rebuildTargetsByField() {
      targetsByField = {};
      for (const row of targetsData) {
        if (!targetsByField[row.field]) targetsByField[row.field] = [];
        targetsByField[row.field].push(row);
      }
      for (const k in targetsByField) {
        targetsByField[k].sort((a, b) => a.effectiveFrom.localeCompare(b.effectiveFrom));
      }
    }

    // Returns the target value in effect for `fieldKey` on `dateStr`.
    // Walks the (date-sorted) history and keeps the last row whose
    // effectiveFrom is <= dateStr — later changes never affect earlier days.
    function getTargetForDate(fieldKey, dateStr) {
      const list = targetsByField[fieldKey];
      if (!list || !list.length) return DEFAULT_TARGET;
      let result = DEFAULT_TARGET;
      for (const entry of list) {
        if (entry.effectiveFrom <= dateStr) result = entry.value;
        else break;
      }
      return result;
    }

    async function loadTargets() {
      try {
        const r = await fetch('/api/habits?resource=targets', { cache: 'no-store' });
        if (r.ok) {
          targetsData = await r.json();
          BootCache.set('targets', targetsData);
          rebuildTargetsByField();
        }
      } catch { /* offline → defaults apply */ }
    }

    async function saveTarget(field, value, effectiveFrom) {
      const r = await fetch('/api/habits?resource=targets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ field, value, effectiveFrom }),
      });
      if (!r.ok) throw new Error('Save failed: ' + r.status);
      await loadTargets();
    }

    async function deleteTargetEntry(id) {
      const r = await fetch('/api/habits?resource=targets&id=' + encodeURIComponent(id), { method: 'DELETE' });
      if (!r.ok) throw new Error('Delete failed: ' + r.status);
      await loadTargets();
    }

    let birthdaysData = [];

    // Always re-fetched from D1 — no local cache to fall out of sync.
    async function loadBirthdays() {
      try {
        const r = await fetch('/api/habits?resource=birthdays', { cache: 'no-store' });
        if (r.ok) {
          birthdaysData = await r.json();
          BootCache.set('birthdays', birthdaysData);
        }
      } catch { /* offline → list stays empty for this session */ }
    }

    // One-time (non-yearly) birthdays only match the exact year they
    // were saved for; yearly ones (the default) match every year on
    // that month/day, same as before.
    function birthdaysForMonthDay(year, month, day) {
      return birthdaysData.filter((b) => {
        if (b.month !== month || b.day !== day) return false;
        if (b.repeatYearly === false) return b.year === year;
        return true;
      });
    }

    async function addBirthday(name, month, day, year, repeatYearly) {
      const r = await fetch('/api/habits?resource=birthdays', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, month, day, year, repeatYearly }),
      });
      if (!r.ok) throw new Error('Save failed: ' + r.status);
      await loadBirthdays();
    }

    async function deleteBirthday(id) {
      const r = await fetch('/api/habits?resource=birthdays&id=' + encodeURIComponent(id), { method: 'DELETE' });
      if (!r.ok) throw new Error('Delete failed: ' + r.status);
      await loadBirthdays();
    }

    const MONTH_SHORT = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

    function renderBirthdaysList() {
      const listEl = document.getElementById('birthdaysList');
      if (!listEl) return;
      listEl.innerHTML = '';
      if (!birthdaysData.length) {
        const empty = document.createElement('div');
        empty.className = 'birthdays-empty';
        empty.textContent = 'No birthdays added yet.';
        listEl.appendChild(empty);
        return;
      }
      // Sorted by month/day so the list reads in calendar order rather
      // than insertion order.
      const sorted = birthdaysData.slice().sort((a, b) => (a.month - b.month) || (a.day - b.day));
      sorted.forEach((b) => {
        const row = document.createElement('div');
        row.className = 'birthdays-row';

        const icon = document.createElement('span');
        icon.className = 'birthdays-row-icon';
        icon.textContent = '🎂';

        const name = document.createElement('span');
        name.className = 'birthdays-row-name';
        name.textContent = b.name;

        const date = document.createElement('span');
        date.className = 'birthdays-row-date';
        date.textContent = MONTH_SHORT[b.month - 1] + ' ' + b.day
          + (b.repeatYearly === false ? ', ' + b.year : '');

        const del = document.createElement('button');
        del.type = 'button';
        del.className = 'birthdays-row-del';
        del.textContent = '×';
        del.title = 'Delete';
        del.addEventListener('click', async () => {
          del.disabled = true;
          try {
            await deleteBirthday(b.id);
            renderBirthdaysList();
            renderCalendar();
          } catch {
            del.disabled = false;
          }
        });

        row.appendChild(icon);
        row.appendChild(name);
        row.appendChild(date);
        row.appendChild(del);
        listEl.appendChild(row);
      });
    }

    function wireBirthdaysPanel() {
      const openBtn = document.getElementById('birthdayAddOpenBtn');
      const toggle  = document.getElementById('birthdaysShowToggle');

      openBtn.addEventListener('click', () => {
        BirthdayPickerModal.open({
          async onSave(name, month, day, year, repeatYearly) {
            openBtn.disabled = true;
            try {
              await addBirthday(name, month, day, year, repeatYearly);
              renderBirthdaysList();
              renderCalendar();
              toast(tf('birthdaySavedToast', { name }));
            } catch {
              toast(t('birthdaySaveFailedToast'), true);
            } finally {
              openBtn.disabled = false;
            }
          },
        });
      });

      toggle.addEventListener('change', () => {
        settings.showBirthdays = toggle.checked;
        saveSettingsToServer().catch(() => { /* local cache already updated */ });
        renderCalendar();
      });
    }

    // A field "passes" for a day when its value meets or beats that day's target.
    // If daily targets are disabled in Settings, fall back to the simple ">0 counts as done" rule.
    function fieldIsActive(value, fieldKey, dateStr) {
      const target = settings.dailyTargetsEnabled ? getTargetForDate(fieldKey, dateStr) : DEFAULT_TARGET;
      return (value || 0) >= target;
    }

    function completionLevel(t) {
      if (!t) return null;
      let c = 0;
      for (const f of FIELD_CONFIG) {
        if (fieldIsActive(t[f.key], f.key, t.date)) c++;
      }
      if (t.nDay  && t.nDay.trim())  c++;
      if (t.nRead && t.nRead.trim()) c++;
      if (t.title && t.title.trim()) c++;
      return Math.min(c, 10);
    }

    function isFullyComplete(t) {
      if (!t) return false;
      for (const f of FIELD_CONFIG) {
        if (!fieldIsActive(t[f.key], f.key, t.date)) return false;
      }
      const notesFilled =
        !!(t.nDay  && t.nDay.trim())  &&
        !!(t.nRead && t.nRead.trim());
      return notesFilled;
    }

    function isImageFile(name, type) {
      if (type && type.startsWith('image/')) return true;
      return /\.(jpe?g|png|gif|webp|svg|bmp|avif)$/i.test(name);
    }
    function getExt(name) {
      const m = String(name).match(/\.([a-z0-9]+)$/i);
      return m ? m[1].toUpperCase().slice(0, 5) : 'FILE';
    }
    function fmtKB(bytes) {
      if (bytes < 1024) return bytes + 'B';
      return Math.round(bytes / 1024) + 'KB';
    }

    function computeMonthStats() {
      const yearPrefix = viewYear + '-';
      let perfect = 0, pushDays = 0, readDays = 0;

      for (const date in habitsData) {
        if (!date.startsWith(yearPrefix)) continue;
        const t = habitsData[date];
        const lvl = completionLevel(t);
        if (lvl === 10) perfect++;
        if (fieldIsActive(t.pushupsCount, 'pushupsCount', date))     pushDays++;
        if (fieldIsActive(t.readPagesCount, 'readPagesCount', date)) readDays++;
      }

      let streak = 0;
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todayKey = today.getFullYear() + '-' + pad(today.getMonth() + 1) + '-' + pad(today.getDate());
      let startOffset = (completionLevel(habitsData[todayKey]) || 0) >= 1 ? 0 : 1;
      for (let i = startOffset; i < 366; i++) {
        const d = new Date(today);
        d.setDate(today.getDate() - i);
        const key = d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
        const lvl = completionLevel(habitsData[key]);
        if (lvl !== null && lvl >= 1) streak++;
        else break;
      }

      document.getElementById('statStreak').textContent  = streak;
      document.getElementById('statPerfect').textContent = perfect;
      document.getElementById('statPushups').textContent = pushDays;
      document.getElementById('statReading').textContent = readDays;
    }

    let toastTimer;
    function toast(msg, isErr = false) {
      const el = document.getElementById('toast');
      el.textContent = msg;
      el.className = 'toast show' + (isErr ? ' err' : '');
      clearTimeout(toastTimer);
      toastTimer = setTimeout(() => el.classList.remove('show'), 3000);
    }

    // Always re-fetched from D1 on load — no local cache to go stale or
    // fall out of sync with what's actually on the server.
    async function loadAllHabits() {
      try {
        const r = await fetch('/api/habits', { cache: 'no-store' });
        if (r.ok) {
          habitsData = JSON.parse(await r.text());
          BootCache.set('habits', habitsData);
        }
      } catch { /* offline → habitsData stays whatever it already was this session */ }
    }

    async function saveHabitData(dateStr, payload) {
      const r = await fetch('/api/habits', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!r.ok) throw new Error('Save failed: ' + r.status);
      habitsData[dateStr] = payload;
    }

    async function loadAllFiles() {
      try {
        const r = await fetch('/api/files', { cache: 'no-store' });
        if (r.ok) { allFiles = await r.json(); BootCache.set('files', allFiles); }
      } catch { /* ignore */ }
    }

    function fileToBase64(file) {
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
          const s = reader.result;
          const comma = s.indexOf(',');
          resolve(comma >= 0 ? s.slice(comma + 1) : s);
        };
        reader.onerror = () => reject(reader.error);
        reader.readAsDataURL(file);
      });
    }

    async function uploadFile(file, dateStr) {
      if (file.size > MAX_FILE_BYTES) {
        toast(tf('tooBigToast', { name: file.name, size: fmtKB(file.size) }), true);
        return null;
      }
      const data = await fileToBase64(file);
      const r = await fetch('/api/files', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ date: dateStr, name: file.name, type: file.type || 'application/octet-stream', data }),
      });
      if (!r.ok) {
        const err = await r.json().catch(() => ({}));
        toast(tf('uploadFailedToast', { name: err.error || file.name }), true);
        return null;
      }
      return await r.json();
    }

    async function deleteFile(id) {
      const r = await fetch('/api/files?id=' + encodeURIComponent(id), { method: 'DELETE' });
      return r.ok;
    }

    function renderCalendar() {
      document.getElementById('monthLabel').textContent = t('months')[viewMonth] + ' ' + viewYear;
      const grid         = document.getElementById('daysGrid');
      const today        = new Date();
      const firstDow     = new Date(viewYear, viewMonth, 1).getDay();
      const firstMonIdx  = mondayIdx(firstDow);
      const daysInMonth  = new Date(viewYear, viewMonth + 1, 0).getDate();
      const gridKey      = viewYear + '-' + viewMonth;
      const expectedCount = firstMonIdx + daysInMonth;

      // Reuse the existing .day-cell elements when we're re-rendering
      // the SAME month (e.g. after checking off a habit) instead of
      // wiping the grid and recreating every cell from scratch. A
      // brand-new element has no "previous" box-shadow/border-color
      // for the browser to transition from, so it just appears already
      // at its final ring color/thickness — that's the snap. Reusing
      // the node means changing its classes is a real style change on
      // a persisted element, which the transitions on .day-cell can
      // actually animate.
      // We only take this path for the plain grid: if the mini-
      // calendar FLIP animation is mid-flight or a swipe card is being
      // dragged, fall back to the original full rebuild so we never
      // touch a cell whose identity/position something else currently
      // depends on.
      const canReuse = grid.dataset.gridKey === gridKey
        && grid.children.length === expectedCount
        && !grid.querySelector('.flip-animating, .settling, .is-dragging');

      // Any renderCalendar() call while the mini-calendar is LOCKED —
      // not just a month switch, but also e.g. saving a habit target,
      // uploading/deleting a file, or a background sync — rebuilds the
      // grid into plain, full-size square cells sitting at their
      // normal in-document position, because canReuse is always false
      // once cells carry .flip-animating (the check right above this
      // comment intentionally bails out of reuse for exactly that
      // state). Without re-parking them back into the mini layout
      // afterward, that plain rebuilt grid would just stay visible
      // that way — which reads as the ring "snapping to square" and
      // "flying up" from the mini position back to the full grid's
      // position. Hiding the grid for the duration and re-parking
      // every caller of renderCalendar(), not just navigateMonth,
      // fixes this at the source.
      // DayViewState is declared further down the script; on the very first
      // (early) render it is still in its temporal dead zone, so guard with try/catch.
      let isLocked = false;
      if (!canReuse) {
        try { isLocked = DayViewState.get() === DayViewState.STATES.LOCKED; } catch (e) { isLocked = false; }
      }
      if (isLocked) grid.style.visibility = 'hidden';

      if (!canReuse) {
        grid.innerHTML = '';
        for (let i = 0; i < firstMonIdx; i++) {
          const blank = document.createElement('div');
          blank.className = 'day-cell empty';
          grid.appendChild(blank);
        }
        for (let d = 1; d <= daysInMonth; d++) {
          grid.appendChild(document.createElement('div'));
        }
        grid.dataset.gridKey = gridKey;
      }

      for (let d = 1; d <= daysInMonth; d++) {
        fillDayCell(grid.children[firstMonIdx + (d - 1)], d, today);
      }

      if (isLocked && typeof LockedMonthNav !== 'undefined') {
        LockedMonthNav.snapCurrentCellsToMini();
      }
      if (isLocked) grid.style.visibility = '';

      computeMonthStats();
      applyMiniDaySelectionHighlight();
    }

    // Populates (or repopulates) a single day-cell element in place.
    // Used both for freshly-created cells and for cells being reused
    // across a same-month re-render (see renderCalendar above).
    function fillDayCell(cell, d, today) {
      const dateStr = viewYear + '-' + pad(viewMonth + 1) + '-' + pad(d);
      const entry   = habitsData[dateStr];
      const isToday = today.getFullYear() === viewYear &&
                      today.getMonth()    === viewMonth &&
                      today.getDate()     === d;

      cell.className = 'day-cell' + (isToday ? ' today' : '');
      cell.dataset.day = String(d);

      const lvl = completionLevel(entry);
      if (lvl !== null) cell.classList.add('lvl-' + lvl);
      if (isFullyComplete(entry)) cell.classList.add('fully-complete');

      cell.innerHTML = '';

      const num = document.createElement('div');
      num.className = 'day-num';
      num.textContent = d;
      cell.appendChild(num);

      const filesForDay = allFiles[dateStr] || [];
      if (filesForDay.length > 0) {
        const badge = document.createElement('div');
        badge.className = 'attach-badge';
        badge.innerHTML = '📎' + filesForDay.length;
        cell.appendChild(badge);
      }

      const rawTitle = entry && entry.title ? String(entry.title).trim() : '';
      const isMobileView = window.matchMedia('(max-width: 640px)').matches;
      const limitEnabled = isMobileView ? settings.mobileTitleLimitEnabled : settings.desktopTitleLimitEnabled;
      const limit        = isMobileView ? settings.mobileTitleLimit        : settings.desktopTitleLimit;
      const titleText = (limitEnabled && rawTitle.length > limit)
        ? rawTitle.slice(0, limit) + '…'
        : rawTitle;
      if (titleText) {
        const tEl = document.createElement('div');
        tEl.className = 'day-title';
        tEl.textContent = titleText;
        cell.appendChild(tEl);
      }

      if (entry && entry.wokeAt5) {
        const dot = document.createElement('div');
        dot.className = 'wake-5am-dot';
        dot.title = t('wakeUpDone');
        dot.textContent = '⏰';
        cell.appendChild(dot);
      }

      if (settings.showBirthdays) {
        const bdays = birthdaysForMonthDay(viewYear, viewMonth + 1, d);
        if (bdays.length) {
          const bBadge = document.createElement('div');
          bBadge.className = 'birthday-badge';
          bBadge.textContent = '🎂 ' + bdays.map((b) => b.name).join(', ');
          bBadge.title = bdays.map((b) => b.name + "'s birthday").join(', ');
          cell.appendChild(bBadge);
        }
      }

      // Bind the click handler once per element — on a reused cell it's
      // already bound from creation, and d/dateStr for a given grid
      // position never change while the month stays the same.
      if (!cell.dataset.clickBound) {
        cell.dataset.clickBound = '1';
        cell.addEventListener('click', () => {
          // While the mini-calendar (day-view) is showing, tapping a
          // day selects it instead of opening the habit-tracking
          // modal — see SelectedDayState + DayTimeGrid's reaction to
          // it. Mid-transition, do nothing (avoids acting on a cell
          // that's still mid-FLIP-animation).
          const state = DayViewState.get();
          if (state === DayViewState.STATES.LOCKED) {
            SelectedDayState.set(viewYear, viewMonth, d);
            return;
          }
          if (state === DayViewState.STATES.CALENDAR) {
            openModal(dateStr);
          }
        });
      }
    }

    // Puts the blue selection ring on whichever .day-cell matches
    // SelectedDayState — only meaningful when that selection falls in
    // the month currently being displayed (the mini-calendar never
    // shows more than one month at a time, so a selection in some
    // other month simply shows no ring here until you navigate to it).
    function applyMiniDaySelectionHighlight() {
      document.querySelectorAll('.day-cell.selected-mini-day').forEach((c) => {
        c.classList.remove('selected-mini-day');
      });
      const sel = SelectedDayState.get();
      if (sel.year !== viewYear || sel.month !== viewMonth) return;
      const grid = document.getElementById('daysGrid');
      const match = grid && grid.querySelector('.day-cell[data-day="' + sel.day + '"]');
      if (match) match.classList.add('selected-mini-day');
    }

    function autoSize(el) {
      el.style.height = 'auto';
      el.style.height = el.scrollHeight + 'px';
    }
    document.querySelectorAll('.auto-grow').forEach(ta => {
      ta.addEventListener('input', () => autoSize(ta));
    });

    function renderFilesList(dateStr) {
      const wrap = document.getElementById('filesList');
      wrap.innerHTML = '';
      const files = (allFiles[dateStr] || []).slice().sort(
        (a, b) => new Date(b.uploaded) - new Date(a.uploaded)
      );

      if (files.length === 0) {
        const empty = document.createElement('div');
        empty.className = 'files-empty';
        empty.textContent = t('noFilesForDay');
        wrap.appendChild(empty);
        return;
      }

      for (const f of files) {
        const card = document.createElement('div');
        const isImg = isImageFile(f.name, f.type);
        card.className = 'file-card ' + (isImg ? 'image' : 'other');
        card.title = f.name + ' (' + fmtKB(f.size) + ')';

        const fileUrl = '/api/files?id=' + encodeURIComponent(f.id);

        if (isImg) {
          const img = document.createElement('img');
          img.src = fileUrl;
          img.alt = f.name;
          img.loading = 'lazy';
          card.appendChild(img);
        } else {
          const icon = document.createElement('div');
          icon.className = 'file-icon';
          icon.textContent = getExt(f.name);
          card.appendChild(icon);
        }

        const nameEl = document.createElement('div');
        nameEl.className = 'file-name';
        nameEl.textContent = f.name;
        card.appendChild(nameEl);

        const del = document.createElement('button');
        del.className = 'file-delete';
        del.type = 'button';
        del.textContent = '×';
        del.title = t('deleteThisFile');
        del.addEventListener('click', async (e) => {
          e.stopPropagation();
          if (!confirm(tf('deleteConfirm', { name: f.name }))) return;
          del.disabled = true;
          const ok = await deleteFile(f.id);
          if (ok) {
            allFiles[dateStr] = (allFiles[dateStr] || []).filter(x => x.id !== f.id);
            renderFilesList(dateStr);
            renderCalendar();
            toast(t('deletedToast'));
          } else {
            del.disabled = false;
            toast(t('deleteFailedToast'), true);
          }
        });
        card.appendChild(del);

        card.addEventListener('click', () => window.open(fileUrl, '_blank'));
        wrap.appendChild(card);
      }
    }

    document.getElementById('fileAddBtn').addEventListener('click', () => {
      document.getElementById('fileInput').click();
    });

    document.getElementById('fileInput').addEventListener('change', async (e) => {
      const files = Array.from(e.target.files || []);
      e.target.value = '';
      if (!files.length || !activeDate) return;

      const btn = document.getElementById('fileAddBtn');
      btn.disabled = true;
      let uploadedCount = 0;

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        btn.textContent = t('uploadingFile') + ' ' + (i + 1) + '/' + files.length + ': ' + file.name;
        const res = await uploadFile(file, activeDate);
        if (res && res.ok) {
          if (!allFiles[activeDate]) allFiles[activeDate] = [];
          allFiles[activeDate].push({ id: res.id, name: res.name, type: res.type, size: res.size, uploaded: res.uploaded });
          uploadedCount++;
        }
      }

      btn.disabled = false;
      btn.textContent = t('addFiles');
      renderFilesList(activeDate);
      renderCalendar();
      if (uploadedCount > 0) toast(uploadedCount === 1 ? t('uploadedToast') : tf('uploadedMultiToast', { n: uploadedCount }));
    });

    function buildCounterCard(field) {
      const card = document.createElement('div');
      card.className = 'swipe-card';
      card.dataset.key = field.key;

      const inner = document.createElement('div');
      inner.className = 'swipe-card-inner';
      inner.innerHTML =
        '<div class="swipe-label-wrap">' +
          '<div class="swipe-label">' + fieldLabel(field) + '</div>' +
        '</div>' +
        '<div class="swipe-count"><span data-count></span><span class="swipe-target" data-target></span>' +
          (field.unit ? '<span class="swipe-unit">' + field.unit + '</span>' : '') +
        '</div>';
      card.appendChild(inner);

      wireGesture(card, field);
      return card;
    }

    function buildPipCard(field) {
      const card = document.createElement('div');
      card.className = 'pip-card';
      card.dataset.key = field.key;

      const inner = document.createElement('div');
      inner.className = 'pip-card-inner';
      let dotsHtml = '<div class="pip-dots" data-dots>';
      for (let i = 0; i < PIP_MAX; i++) dotsHtml += '<div class="pip-dot"></div>';
      dotsHtml += '</div>';
      inner.innerHTML =
        '<div class="pip-label-wrap">' +
          '<div class="pip-label">' + fieldLabel(field) + '</div>' +
          '<div class="pip-target" data-target></div>' +
        '</div>' + dotsHtml;
      card.appendChild(inner);

      wireGesture(card, field);
      return card;
    }

    function renderSwipeSections() {
      const grids = {
        nonNeg:  document.getElementById('nonNegotiablesGrid'),
        fitness: document.getElementById('fitnessGrid'),
        skills:  document.getElementById('skillsGrid'),
      };
      for (const k in grids) grids[k].innerHTML = '';

      for (const field of FIELD_CONFIG) {
        const card = field.kind === 'pip' ? buildPipCard(field) : buildCounterCard(field);
        grids[field.section].appendChild(card);
      }
    }

    function refreshCardVisual(field) {
      const card = document.querySelector('.swipe-card[data-key="' + field.key + '"], .pip-card[data-key="' + field.key + '"]');
      if (!card) return;
      const value  = formState[field.key] || 0;
      const target = getTargetForDate(field.key, activeDate || todayStr());
      const passed = value >= target;

      if (field.kind === 'counter') {
        const countEl = card.querySelector('[data-count]');
        countEl.textContent = value;
        const targetEl = card.querySelector('[data-target]');
        if (targetEl) targetEl.textContent = ' / ' + target;
        card.classList.toggle('pass', passed);
        card.classList.toggle('fail', !passed);
      } else {
        const dots = card.querySelectorAll('[data-dots] .pip-dot');
        dots.forEach((dot, i) => dot.classList.toggle('filled', i < value));
        const targetEl = card.querySelector('[data-target]');
        if (targetEl) targetEl.textContent = t('target') + ': ' + target + ' ' + (target === 1 ? t('pip') : t('pips'));
        card.classList.toggle('pass', passed);
        card.classList.toggle('fail', !passed);
      }
    }

    function refreshAllCards() {
      for (const field of FIELD_CONFIG) refreshCardVisual(field);
    }

    function shakeCard(card) {
      card.classList.remove('shake');
      void card.offsetWidth;
      card.classList.add('shake');
      setTimeout(() => card.classList.remove('shake'), 340);
    }

    const TICK_TOTAL_MS = 260; // total duration regardless of distance, so a +10 and +5 feel equally snappy

    function animateCounterTick(card, from, to) {
      const countEl = card.querySelector('[data-count]');
      if (!countEl) return;

      // cancel any in-flight tick on this card so rapid repeat swipes don't collide
      if (card._tickTimer) { clearInterval(card._tickTimer); card._tickTimer = null; }

      const distance = Math.abs(to - from);
      if (distance === 0) { countEl.textContent = to; card.classList.remove('ticking'); return; }

      const dir = to > from ? 1 : -1;
      const stepMs = Math.max(14, Math.min(45, TICK_TOTAL_MS / distance));
      let current = from;

      card.classList.add('ticking');
      card._tickTimer = setInterval(() => {
        current += dir;
        countEl.textContent = current;
        if (current === to) {
          clearInterval(card._tickTimer);
          card._tickTimer = null;
          card.classList.remove('ticking');
        }
      }, stepMs);
    }

    function animatePipTick(card, from, to) {
      const dots = card.querySelectorAll('[data-dots] .pip-dot');
      if (!dots.length) return;

      if (card._pipTickTimer) { clearInterval(card._pipTickTimer); card._pipTickTimer = null; }

      const distance = Math.abs(to - from);
      if (distance === 0) return;

      const dir = to > from ? 1 : -1;
      let current = from;
      const stepMs = 70;

      card._pipTickTimer = setInterval(() => {
        current += dir;
        dots.forEach((dot, i) => dot.classList.toggle('filled', i < current));
        if (current === to) { clearInterval(card._pipTickTimer); card._pipTickTimer = null; }
      }, stepMs);
    }

    function applyDelta(field, direction) {
      const card = document.querySelector('.swipe-card[data-key="' + field.key + '"], .pip-card[data-key="' + field.key + '"]');
      const current = formState[field.key] || 0;
      const target  = getTargetForDate(field.key, activeDate || todayStr());

      if (field.kind === 'counter') {
        if (direction < 0 && current <= 0) {
          if (card) shakeCard(card);
          return;
        }
        let next = current + direction * field.step;
        next = Math.max(0, next);
        formState[field.key] = next;
        if (card) {
          const countEl = card.querySelector('[data-count]');
          const displayedFrom = countEl ? (parseInt(countEl.textContent, 10) || 0) : current;
          animateCounterTick(card, displayedFrom, next);
          card.classList.toggle('pass', next >= target);
          card.classList.toggle('fail', next < target);
        }
        return;
      } else {
        if (direction < 0 && current <= 0) {
          if (card) shakeCard(card);
          return;
        }
        if (direction > 0 && current >= PIP_MAX) {
          if (card) shakeCard(card);
          return;
        }
        const next = Math.max(0, Math.min(PIP_MAX, current + direction));
        formState[field.key] = next;
        if (card) {
          const filledDots = card.querySelectorAll('[data-dots] .pip-dot.filled').length;
          animatePipTick(card, filledDots, next);
          card.classList.toggle('pass', next >= target);
          card.classList.toggle('fail', next < target);
        }
        return;
      }
    }

    const TAP_TOLERANCE = 6; // px of movement still considered "just a tap"

    function wireGesture(card, field) {
      let startX = 0;
      let dx = 0;
      let dragging = false;   // true once we've moved past TAP_TOLERANCE
      let pressed = false;
      let pointerId = null;

      function setTransform(x) {
        card.style.transform = x ? 'translateX(' + x + 'px)' : '';
      }

      function onDown(e) {
        pressed = true;
        dragging = false;
        pointerId = e.pointerId;
        startX = e.clientX;
        dx = 0;
        card.classList.add('is-dragging');
        card.setPointerCapture && card.setPointerCapture(pointerId);
      }

      function onMove(e) {
        if (!pressed) return;
        dx = e.clientX - startX;
        if (!dragging && Math.abs(dx) > TAP_TOLERANCE) {
          dragging = true;
        }
        if (dragging) {
          setTransform(dx);
        }
      }

      function settle(wasDragging) {
        card.classList.remove('is-dragging');
        if (!wasDragging) return; // plain tap never moved the card, nothing to spring back
        card.classList.add('settling');
        setTransform(0);
        card.addEventListener('transitionend', function onEnd() {
          card.classList.remove('settling');
          card.removeEventListener('transitionend', onEnd);
        }, { once: true });
        // fallback in case transitionend doesn't fire (e.g. transform was already 0)
        setTimeout(() => card.classList.remove('settling'), 400);
      }

      function onUp() {
        if (!pressed) return;
        pressed = false;

        if (dragging) {
          // committed by whichever side of center we released on,
          // any non-zero offset counts
          if (dx !== 0) {
            applyDelta(field, dx > 0 ? 1 : -1);
          }
        } else {
          // plain tap/click → add one step
          applyDelta(field, 1);
        }

        settle(dragging);
        dragging = false;
        dx = 0;
      }

      function onCancel() {
        if (!pressed) return;
        pressed = false;
        const wasDragging = dragging;
        dragging = false;
        dx = 0;
        settle(wasDragging);
      }

      card.addEventListener('pointerdown', onDown);
      card.addEventListener('pointermove', onMove);
      card.addEventListener('pointerup', onUp);
      card.addEventListener('pointercancel', onCancel);
    }

    function updateWakeBtn() {
      const btn = document.getElementById('wake5amBtn');
      if (formState.wokeAt5) {
        btn.textContent = t('wakeUpDone');
        btn.classList.add('active');
      } else {
        btn.textContent = t('wakeUp');
        btn.classList.remove('active');
      }
    }

    document.getElementById('wake5amBtn').addEventListener('click', () => {
      formState.wokeAt5 = !formState.wokeAt5;
      updateWakeBtn();
    });

    // Locks the background page in place while the day-entry modal is
    // open, so a scroll/swipe that misses the modal's own scrollable
    // content (e.g. lands on the backdrop, or chains past the top/
    // bottom of the modal) can't scroll the calendar behind it. The
    // scroll position is restored exactly on unlock rather than just
    // toggling overflow, since fixing body position resets scrollY.
    let lockedScrollY = 0;
    function lockBodyScroll() {
      lockedScrollY = window.scrollY || window.pageYOffset || 0;
      document.body.style.position = 'fixed';
      document.body.style.top = -lockedScrollY + 'px';
      document.body.style.left = '0';
      document.body.style.right = '0';
      document.body.style.width = '100%';
    }
    function unlockBodyScroll() {
      document.body.style.position = '';
      document.body.style.top = '';
      document.body.style.left = '';
      document.body.style.right = '';
      document.body.style.width = '';
      window.scrollTo(0, lockedScrollY);
    }

    function openModal(dateStr) {
      activeDate = dateStr;
      lockBodyScroll();

      const [y, m, d] = dateStr.split('-');
      document.getElementById('modalTitle').textContent =
        t('months')[parseInt(m) - 1] + ' ' + parseInt(d) + ', ' + y;

      const bdays = birthdaysForMonthDay(parseInt(y), parseInt(m), parseInt(d));
      const bBanner = document.getElementById('modalBirthdayBanner');
      if (bdays.length) {
        bBanner.textContent = '🎂 ' + bdays.map((b) => b.name).join(', ');
        bBanner.style.display = '';
      } else {
        bBanner.style.display = 'none';
      }

      formState = defaultEntry(dateStr);
      document.getElementById('dayTitle').value = '';
      document.getElementById('nDay').value   = '';
      document.getElementById('nRead').value  = '';
      document.getElementById('nExtra').value = '';

      const entry = habitsData[dateStr];
      if (entry) {
        for (const f of FIELD_CONFIG) {
          if (entry[f.key] !== undefined) formState[f.key] = entry[f.key];
        }
        formState.wokeAt5 = !!entry.wokeAt5;
        if (entry.title  !== undefined) document.getElementById('dayTitle').value = entry.title;
        if (entry.nDay   !== undefined) document.getElementById('nDay').value   = entry.nDay;
        if (entry.nRead  !== undefined) document.getElementById('nRead').value  = entry.nRead;
        if (entry.nExtra !== undefined) document.getElementById('nExtra').value = entry.nExtra;
      }

      refreshAllCards();
      updateWakeBtn();
      renderFilesList(dateStr);
      document.getElementById('overlay').classList.add('open');
      requestAnimationFrame(() => {
        document.querySelectorAll('.auto-grow').forEach(autoSize);
      });

      initialFormSnapshot = snapshotDayForm();
    }

    function snapshotDayForm() {
      return JSON.stringify({
        formState,
        title:  document.getElementById('dayTitle').value,
        nDay:   document.getElementById('nDay').value,
        nRead:  document.getElementById('nRead').value,
        nExtra: document.getElementById('nExtra').value,
      });
    }

    function dayFormIsDirty() {
      if (initialFormSnapshot === null) return false;
      return snapshotDayForm() !== initialFormSnapshot;
    }

    function closeModal() {
      document.getElementById('overlay').classList.remove('open');
      activeDate = null;
      initialFormSnapshot = null;
      unlockBodyScroll();
    }

    function attemptCloseModal() {
      if (settings.warnUnsavedChanges && dayFormIsDirty()) {
        document.getElementById('confirmMsg').textContent = t('unsavedDayMsg');
        showUnsavedConfirm(
          async () => {
            try {
              await saveDayEntry();
              toast(t('savedToast'));
            } catch {
              toast(t('saveFailedToast'), true);
              return;
            } finally {
              hideUnsavedConfirm();
            }
            closeModal();
          },
          () => { hideUnsavedConfirm(); closeModal(); }
        );
      } else {
        closeModal();
      }
    }

    async function saveDayEntry() {
      const dateStr = activeDate;
      const payload = {
        date:     dateStr,
        title:    document.getElementById('dayTitle').value.trim(),
        wokeAt5:  formState.wokeAt5,
        nDay:     document.getElementById('nDay').value,
        nRead:    document.getElementById('nRead').value,
        nExtra:   document.getElementById('nExtra').value,
      };
      for (const f of FIELD_CONFIG) payload[f.key] = formState[f.key] || 0;
      await saveHabitData(dateStr, payload);
      renderCalendar();
    }

    document.getElementById('saveBtn').addEventListener('click', async () => {
      const btn = document.getElementById('saveBtn');
      btn.disabled = true;
      btn.textContent = t('saving');

      try {
        await saveDayEntry();
        toast(t('savedToast'));
        setTimeout(closeModal, 600);
      } catch {
        toast(t('saveFailedToast'), true);
      }

      btn.disabled = false;
      btn.textContent = t('saveDay');
    });

    // Changes the visible month, whether the plain calendar or the
    // locked mini-calendar is showing. While locked, a month switch
    // has to: rebuild the grid's cells (new month = new day numbers),
    // then instantly re-park them at their mini-calendar targets
    // (LockedMonthNav.snapCurrentCellsToMini). Those freshly rebuilt
    // cells briefly exist as plain, full-size, square .day-cells sitting
    // at their normal in-document position before that re-park happens —
    // even though the actual re-park is synchronous and instant (0ms),
    // that in-between DOM state was visible for a frame, which is what
    // read as a "snap to square" + a "fly up" jump (the plain cells'
    // natural position is above/outside the mini target). Hiding the
    // grid for the duration of the rebuild+re-park removes that frame
    // entirely, so all a viewer ever sees is circular mini-cells before
    // and circular mini-cells after.
    function navigateMonth(delta) {
      viewMonth += delta;
      if (viewMonth < 0)  { viewMonth = 11; viewYear--; }
      if (viewMonth > 11) { viewMonth = 0;  viewYear++; }

      // renderCalendar() already handles the LOCKED case end-to-end:
      // it hides the grid, rebuilds the cells, snaps them into the
      // mini-calendar layout, then reveals the grid again. Doing any
      // of that again here would re-measure the already-snapped
      // (transformed) cells and stomp their transform based on that
      // stale-relative-to-itself math — see the comment on
      // LockedMonthNav.snapCurrentCellsToMini for why that snaps
      // them back to full size instead of leaving them alone.
      renderCalendar();
    }

    document.getElementById('prevMonth').addEventListener('click', () => navigateMonth(-1));
    document.getElementById('nextMonth').addEventListener('click', () => navigateMonth(1));

    (function wireWake5() {
      const YEAR = 2026, GOAL = 0.75;
      const btn = document.getElementById('wake5Btn'), panel = document.getElementById('wake5Panel'), body = document.getElementById('wake5Body');
      if (!btn || !panel || !body) return;
      const MN = ['January','February','March','April','May','June','July','August','September','October','November','December'];
      const key = (y, m, d) => y + '-' + pad(m + 1) + '-' + pad(d);
      const el = (tag, cls, text) => { const e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; };
      const pct = (n) => (Math.round(n * 10) / 10) + '%';

      function compute() {
        const today = todayStr();
        const months = [];
        let wins = 0, losses = 0, yearDays = 0;
        for (let m = 0; m < 12; m++) {
          const dim = new Date(YEAR, m + 1, 0).getDate();
          let w = 0, l = 0, pending = 0;
          for (let d = 1; d <= dim; d++) {
            const k = key(YEAR, m, d), won = !!(habitsData[k] && habitsData[k].wokeAt5);
            if (k > today || (k === today && !won)) pending++;   // future days, and today until it is marked
            else if (won) w++; else l++;
          }
          months.push({ m, dim, w, l, pending });
          wins += w; losses += l; yearDays += dim;
        }
        const counted = wins + losses;
        const required = Math.ceil(GOAL * yearDays - 1e-9);
        const maxLosses = yearDays - required;
        return { months, wins, losses, counted, yearDays, required, maxLosses,
                 left: maxLosses - losses, daysLeft: yearDays - counted, winsNeeded: Math.max(0, required - wins),
                 winPct: counted ? wins / counted * 100 : 0 };
      }

      function card(label, value, sub, wide, cls) {
        const c = el('div', 'w5-card' + (wide ? ' wide' : ''));
        c.append(el('div', 'w5-lbl', label), el('div', 'w5-val' + (cls ? ' ' + cls : ''), value));
        if (sub) c.appendChild(el('div', 'w5-sub', sub));
        return c;
      }

      function render() {
        const r = compute(), nowM = new Date().getFullYear() === YEAR ? new Date().getMonth() : -1;
        const ok = r.winPct >= GOAL * 100;
        body.innerHTML = '';
        const box = el('div', 'w5-box');

        const hero = el('div', 'w5-hero');
        hero.append(el('div', 'w5-pct ' + (ok ? 'ok' : 'bad'), pct(r.winPct)), el('div', 'w5-goal', 'win rate \u00B7 goal ' + (GOAL * 100) + '% of ' + r.yearDays + ' days'));
        const bar = el('div', 'w5-bar'), fill = el('div', 'w5-fill' + (ok ? '' : ' bad'));
        fill.style.width = Math.min(100, r.winPct) + '%';
        const mark = el('div', 'w5-mark'); mark.style.left = (GOAL * 100) + '%';
        bar.append(fill, mark);

        let status, color;
        if (r.left < 0 || r.winsNeeded > r.daysLeft) { status = 'Goal out of reach: ' + r.winsNeeded + ' more wins needed but only ' + r.daysLeft + ' days left.'; color = '#dc2626'; }
        else if (r.left === 0) { status = 'No losses left to spare \u2014 every remaining day must be a win.'; color = '#d97706'; }
        else { status = 'You can still afford ' + r.left + ' loss' + (r.left === 1 ? '' : 'es') + ' this year and hit ' + (GOAL * 100) + '%.'; color = '#16a34a'; }
        const st = el('div', 'w5-status', status); st.style.color = color;

        const grid = el('div', 'w5-grid');
        grid.append(card('Wins', String(r.wins), 'woke at 5am'), card('Losses', String(r.losses), 'missed days'), card('Days left', String(r.daysLeft), 'incl. today if unmarked'));
        grid.append(card('Affordable losses \u00B7 whole year', r.left < 0 ? '\u2212' + Math.abs(r.left) : String(r.left),
          'budget ' + r.maxLosses + ' (' + r.yearDays + ' \u2212 ' + r.required + ' wins needed) \u00B7 used ' + r.losses, true, r.left < 0 ? 'w5-over' : ''));
        grid.append(card('Wins still needed', String(r.winsNeeded), 'of ' + r.required + ' wins for the year'));
        grid.append(card('Wins so far', pct(r.wins / r.yearDays * 100), 'of the whole year'));
        grid.append(card('Pace needed', r.daysLeft ? pct(r.winsNeeded / r.daysLeft * 100) : '\u2014', 'wins on remaining days'));

        // this month / next month
        const mk = (idx, title) => {
          if (idx < 0 || idx > 11) return null;
          const mo = r.months[idx], budget = Math.floor(mo.dim * (1 - GOAL)), spare = budget - mo.l;
          const maxThis = Math.max(0, Math.min(r.left, mo.pending));
          return card(title + ' \u00B7 ' + MN[idx], spare < 0 ? '\u2212' + Math.abs(spare) : String(spare),
            'monthly 75% budget ' + budget + ' \u00B7 used ' + mo.l + '. Up to ' + maxThis + ' if every other day is a win.', true, spare < 0 ? 'w5-over' : '');
        };
        const cm = mk(nowM, 'This month'), nm = mk(nowM + 1, 'Next month');
        if (cm) grid.appendChild(cm); if (nm) grid.appendChild(nm);

        const tbl = el('table', 'w5-table');
        const hr = el('tr'); ['Month', 'Wins', 'Losses', 'Budget', 'Left'].forEach((h) => hr.appendChild(el('th', null, h))); tbl.appendChild(hr);
        r.months.forEach((mo) => {
          const budget = Math.floor(mo.dim * (1 - GOAL)), spare = budget - mo.l, tr = el('tr', mo.m === nowM ? 'cur' : '');
          tr.append(el('td', null, MN[mo.m].slice(0, 3)), el('td', null, String(mo.w)), el('td', null, String(mo.l)), el('td', null, String(budget)), el('td', spare < 0 ? 'over' : '', String(spare)));
          tbl.appendChild(tr);
        });
        const tot = el('tr'); tot.style.fontWeight = '800';
        tot.append(el('td', null, 'Year'), el('td', null, String(r.wins)), el('td', null, String(r.losses)), el('td', null, String(r.maxLosses)), el('td', r.left < 0 ? 'over' : '', String(r.left)));
        tbl.appendChild(tot);

        box.append(hero, bar, st, grid, el('div', 'w5-h', 'Every month'), tbl);
        body.appendChild(box);
      }

      btn.addEventListener('click', () => {
        const open = !panel.classList.contains('open');
        if (open) render();
        panel.classList.toggle('open', open);
        btn.setAttribute('aria-expanded', String(open));
      });
    })();

    (function wireMonthSwipe() {
      const main = document.querySelector('.calendar-main');
      const grid = document.getElementById('daysGrid');
      if (!main || !grid) return;
      const isPhone = () => window.innerWidth <= 760;
      let sx = 0, sy = 0, dx = 0, t0 = 0, mode = null, tracking = false, busy = false;

      const anim = (from, to, ms, easing, extra) => grid.animate(
        [Object.assign({ transform: 'translateX(' + from + 'px)' }, extra && extra.from),
         Object.assign({ transform: 'translateX(' + to + 'px)' }, extra && extra.to)],
        { duration: ms, easing, fill: 'forwards' });

      main.addEventListener('touchstart', (e) => {
        tracking = false; mode = null;
        if (!isPhone() || busy || e.touches.length !== 1) return;
        if (typeof DayViewState !== 'undefined' && DayViewState.get() !== DayViewState.STATES.CALENDAR) return;
        sx = e.touches[0].clientX; sy = e.touches[0].clientY; dx = 0; t0 = performance.now(); tracking = true;
      }, { passive: true });

      main.addEventListener('touchmove', (e) => {
        if (!tracking) return;
        const t = e.touches[0], mx = t.clientX - sx, my = t.clientY - sy;
        if (mode === null && (Math.abs(mx) > 8 || Math.abs(my) > 8)) mode = Math.abs(mx) > Math.abs(my) * 1.2 ? 'h' : 'v';
        if (mode !== 'h') return;
        e.preventDefault();               // horizontal drag = month swipe, not page scroll
        dx = mx;
        grid.style.transform = 'translateX(' + dx * 0.9 + 'px)';
      }, { passive: false });

      const finish = () => {
        if (!tracking) return; tracking = false;
        if (mode !== 'h') return;
        const w = grid.getBoundingClientRect().width || window.innerWidth;
        const v = Math.abs(dx) / Math.max(1, performance.now() - t0);   // px per ms
        const commit = Math.abs(dx) > w * 0.22 || (Math.abs(dx) > 40 && v > 0.5);
        const cur = dx * 0.9;
        busy = true;
        if (!commit) {                    // not far enough: spring back
          anim(cur, 0, 220, 'cubic-bezier(.2,.8,.2,1)').onfinish = function () { grid.style.transform = ''; this.cancel(); busy = false; };
          return;
        }
        const dir = dx < 0 ? 1 : -1;      // swipe left = next month, swipe right = previous
        anim(cur, -dir * w, 150, 'ease-in', { to: { opacity: 0.2 } }).onfinish = function () {
          this.cancel(); grid.style.transform = '';
          const ready = window.__moneyReady ? window.__moneyReady(dir) : Promise.resolve();
          ready.then(() => {
            window.__noCount = true;      // paint the new month fully filled in: no count-up, no fade-in
            document.getElementById(dir > 0 ? 'nextMonth' : 'prevMonth').click();   // renders the new month synchronously
            window.__noCount = false;
            anim(dir * w * 0.5, 0, 260, 'cubic-bezier(.2,.8,.2,1)', { from: { opacity: 0.2 }, to: { opacity: 1 } }).onfinish = function () {
              this.cancel(); grid.style.transform = ''; grid.style.opacity = ''; busy = false;
            };
          });
        };
      };
      main.addEventListener('touchend', finish, { passive: true });
      main.addEventListener('touchcancel', finish, { passive: true });
    })();

    document.getElementById('closeBtn').addEventListener('click', attemptCloseModal);
    document.getElementById('overlay').addEventListener('click', (e) => {
      if (e.target === document.getElementById('overlay')) attemptCloseModal();
    });


    function renderTargetsFieldList() {
      const wrap = document.getElementById('targetsFieldList');
      wrap.innerHTML = '';
      const today = todayStr();

      for (const field of FIELD_CONFIG) {
        const current = getTargetForDate(field.key, today);

        const row = document.createElement('div');
        row.className = 'target-row';
        row.innerHTML =
          '<div class="target-row-head" data-field="' + field.key + '">' +
            '<span class="target-row-label">' + fieldLabel(field) + '</span>' +
            '<span class="target-row-current">' + current + (field.unit || '') +
              '<span class="target-row-arrow">▾</span></span>' +
          '</div>' +
          '<div class="target-row-body" id="targetBody-' + field.key + '" style="display:none;">' +
            '<div class="target-edit-form">' +
              '<label>' + t('newTargetValue') + '</label>' +
              '<input type="number" min="0"' + (field.kind === 'pip' ? ' max="' + PIP_MAX + '"' : '') +
                ' id="targetValueInput-' + field.key + '" value="' + current + '" />' +
              '<label>' + t('effectiveFrom') + '</label>' +
              '<input type="date" id="targetDateInput-' + field.key + '" value="' + today + '" />' +
              '<button type="button" class="target-save-btn" data-field="' + field.key + '">' + t('save') + '</button>' +
            '</div>' +
            '<div class="target-history" id="targetHistory-' + field.key + '"></div>' +
          '</div>';
        wrap.appendChild(row);
      }

      wrap.querySelectorAll('.target-row-head').forEach(head => {
        head.addEventListener('click', () => {
          const f = head.dataset.field;
          const row = head.closest('.target-row');
          const body = document.getElementById('targetBody-' + f);
          const isOpen = body.style.display !== 'none';

          wrap.querySelectorAll('.target-row-body').forEach(b => b.style.display = 'none');
          wrap.querySelectorAll('.target-row').forEach(r => r.classList.remove('open'));

          if (!isOpen) {
            body.style.display = 'block';
            row.classList.add('open');
            renderTargetHistory(f);
          }
        });
      });

      wrap.querySelectorAll('.target-save-btn').forEach(btn => {
        btn.addEventListener('click', async () => {
          const f = btn.dataset.field;
          const valEl  = document.getElementById('targetValueInput-' + f);
          const dateEl = document.getElementById('targetDateInput-' + f);
          const value = parseInt(valEl.value, 10);
          const effectiveFrom = dateEl.value;

          if (!Number.isFinite(value) || value < 0 || !effectiveFrom) {
            toast(t('enterValidTarget'), true);
            return;
          }

          btn.disabled = true;
          btn.textContent = t('saving');
          try {
            await saveTarget(f, value, effectiveFrom);
            toast(t('targetSavedToast'));
            renderTargetsFieldList();
            renderCalendar();
            if (activeDate) refreshAllCards();
          } catch {
            toast(t('targetSaveFailedToast'), true);
          }
          btn.disabled = false;
          btn.textContent = t('save');
        });
      });
    }

    function renderTargetHistory(fieldKey) {
      const el = document.getElementById('targetHistory-' + fieldKey);
      const entries = (targetsByField[fieldKey] || [])
        .slice()
        .sort((a, b) => b.effectiveFrom.localeCompare(a.effectiveFrom));

      if (!entries.length) {
        el.innerHTML = '<div class="target-history-empty">' + tf('noCustomTargets', { n: DEFAULT_TARGET }) + '</div>';
        return;
      }

      el.innerHTML = '';
      for (const e of entries) {
        const row = document.createElement('div');
        row.className = 'target-history-row';

        const label = document.createElement('span');
        label.textContent = tf('targetHistoryLabel', { value: e.value, date: e.effectiveFrom });
        row.appendChild(label);

        const del = document.createElement('button');
        del.type = 'button';
        del.className = 'target-history-del';
        del.textContent = '×';
        del.title = t('removeChange');
        del.addEventListener('click', async () => {
          try {
            await deleteTargetEntry(e.id);
            toast(t('removedToast'));
            renderTargetsFieldList();
            renderCalendar();
            if (activeDate) refreshAllCards();
          } catch {
            toast(t('removeFailedToast'), true);
          }
        });
        row.appendChild(del);

        el.appendChild(row);
      }
    }

    document.getElementById('editTargetsBtn').addEventListener('click', () => {
      renderTargetsFieldList();
      document.getElementById('targetsOverlay').classList.add('open');
    });
    document.getElementById('targetsCloseBtn').addEventListener('click', () => {
      document.getElementById('targetsOverlay').classList.remove('open');
    });
    document.getElementById('targetsOverlay').addEventListener('click', (e) => {
      if (e.target === document.getElementById('targetsOverlay')) {
        document.getElementById('targetsOverlay').classList.remove('open');
      }
    });

    document.getElementById('openSettingsBtn').addEventListener('click', () => {
      applySettingsToUI();
      document.getElementById('settingsOverlay').classList.add('open');
    });
    function attemptCloseSettings() {
      if (settings.warnUnsavedChanges && settingsIsDirty()) {
        document.getElementById('confirmMsg').textContent = t('unsavedSettingsMsg');
        showUnsavedConfirm(
          async () => {
            const ok = await commitSettingsSave();
            if (ok) hideUnsavedConfirm();
          },
          () => { hideUnsavedConfirm(); document.getElementById('settingsOverlay').classList.remove('open'); }
        );
      } else {
        document.getElementById('settingsOverlay').classList.remove('open');
      }
    }

    document.getElementById('settingsCloseBtn').addEventListener('click', attemptCloseSettings);
    document.getElementById('settingsOverlay').addEventListener('click', (e) => {
      if (e.target === document.getElementById('settingsOverlay')) attemptCloseSettings();
    });

    document.getElementById('settingsSaveBtn').addEventListener('click', () => {
      commitSettingsSave();
    });

    // Fires a real push immediately (bypasses event timing entirely) so we
    // can see, right here in the UI, exactly what happens — including the
    // raw HTTP status Apple/the push service returned for each subscription.
    // This is a debugging tool: it does NOT depend on the cron/push-check
    // schedule at all, it just calls the same send logic directly.
    // payload === null -> plain test push (unchanged behaviour).
    // payload = {title, body} -> "force send": same pipeline, custom subject/text.
    async function runPushSend(btn, payload) {
      const out = document.getElementById('testPushResult');
      btn.disabled = true;
      out.textContent = 'Requesting notification permission...';
      try {
        const perm = await NotificationScheduler.requestPermission();
        out.textContent = 'Permission: ' + perm + '\nRegistering push subscription...';
        if (perm !== 'granted') {
          out.textContent += '\n\n❌ Notifications are not allowed for this app in your browser/OS settings. That alone would explain everything — fix that first.';
          btn.disabled = false;
          return;
        }
        const sub = await PushNotifications.ensureSubscribed();
        out.textContent += sub ? '\nSubscribed OK. Sending test push...' : '\n⚠ Could not create a subscription (unsupported browser or offline). Sending test push anyway...';

        const res = payload
          ? await fetch('/api/test-push', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ title: payload.title, body: payload.body, subject: payload.title, text: payload.body, force: true })
            })
          : await fetch('/api/test-push', { method: 'POST' });
        const data = await res.json().catch(() => ({ error: 'Non-JSON response, HTTP ' + res.status }));
        out.textContent = JSON.stringify(data, null, 2);
      } catch (err) {
        out.textContent = '❌ Error: ' + (err && err.message ? err.message : String(err));
      } finally {
        btn.disabled = false;
      }
    }

    document.getElementById('testPushBtn').addEventListener('click', () => {
      runPushSend(document.getElementById('testPushBtn'), null);
    });

    // ── Force Send: edit subject + text, fire instantly ──
    (() => {
      const FKEY = 'habitForcePushDraft';
      const panel = document.getElementById('forcePushPanel');
      const toggle = document.getElementById('forcePushToggleBtn');
      const subj = document.getElementById('forcePushSubject');
      const text = document.getElementById('forcePushText');
      const send = document.getElementById('forcePushSendBtn');
      try { const d = JSON.parse(localStorage.getItem(FKEY) || 'null'); if (d) { subj.value = d.title || ''; text.value = d.body || ''; } } catch (e) {}
      const saveDraft = () => { try { localStorage.setItem(FKEY, JSON.stringify({ title: subj.value, body: text.value })); } catch (e) {} };
      const counter = document.getElementById('forcePushCount');
      const MAXB = 3900;
      const updateCount = () => {
        const n = new TextEncoder().encode(JSON.stringify({ title: subj.value.trim() || 'Notification', body: text.value.trim() })).length;
        counter.textContent = n + ' / ' + MAXB + ' bytes' + (n > MAXB ? ' — too long, the end will be cut' : '');
        counter.classList.toggle('over', n > MAXB);
      };
      subj.addEventListener('input', () => { saveDraft(); updateCount(); });
      text.addEventListener('input', () => { saveDraft(); updateCount(); });
      updateCount();
      toggle.addEventListener('click', () => {
        const open = !panel.classList.contains('open');
        panel.classList.toggle('open', open);
        toggle.classList.toggle('on', open);
        toggle.setAttribute('aria-expanded', String(open));
        if (open) setTimeout(() => subj.focus(), 320);
      });
      send.addEventListener('click', () => {
        const title = subj.value.trim(), body = text.value.trim();
        if (!title && !body) { subj.focus(); document.getElementById('testPushResult').textContent = 'Type a subject or some text first.'; return; }
        saveDraft();
        runPushSend(send, { title: title || 'Notification', body });
      });
    })();

    // All of these only touch the staged pendingSettings copy — nothing is
    // applied to the live calendar or persisted until "Save Settings".
    document.getElementById('toggleDailyTargets').addEventListener('change', (e) => {
      pendingSettings.dailyTargetsEnabled = e.target.checked;
    });

    document.getElementById('toggleStatsBar').addEventListener('change', (e) => {
      pendingSettings.showStatsBar = e.target.checked;
    });

    document.getElementById('toggleMobileTitleLimit').addEventListener('change', (e) => {
      pendingSettings.mobileTitleLimitEnabled = e.target.checked;
      document.getElementById('mobileTitleLimitInput').disabled = !pendingSettings.mobileTitleLimitEnabled;
    });
    document.getElementById('mobileTitleLimitInput').addEventListener('input', (e) => {
      const n = parseInt(e.target.value, 10);
      pendingSettings.mobileTitleLimit = Number.isFinite(n) && n > 0 ? n : DEFAULT_SETTINGS.mobileTitleLimit;
    });

    document.getElementById('toggleDesktopTitleLimit').addEventListener('change', (e) => {
      pendingSettings.desktopTitleLimitEnabled = e.target.checked;
      document.getElementById('desktopTitleLimitInput').disabled = !pendingSettings.desktopTitleLimitEnabled;
    });
    document.getElementById('desktopTitleLimitInput').addEventListener('input', (e) => {
      const n = parseInt(e.target.value, 10);
      pendingSettings.desktopTitleLimit = Number.isFinite(n) && n > 0 ? n : DEFAULT_SETTINGS.desktopTitleLimit;
    });

    document.getElementById('toggleNightMode').addEventListener('change', (e) => {
      pendingSettings.nightMode = e.target.checked;
    });

    document.getElementById('toggleWarnUnsaved').addEventListener('change', (e) => {
      pendingSettings.warnUnsavedChanges = e.target.checked;
    });

    document.getElementById('toggleDisableZoom').addEventListener('change', (e) => {
      pendingSettings.disableZoom = e.target.checked;
    });

    document.querySelectorAll('.lang-btn').forEach(b => {
      b.addEventListener('click', () => {
        pendingSettings.language = b.dataset.lang;
        document.querySelectorAll('.lang-btn').forEach(x => x.classList.toggle('active', x === b));
      });
    });

    document.querySelectorAll('.info-btn').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        toast(btn.dataset.info);
      });
    });

    let resizeTimer;
    window.addEventListener('resize', () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => {
        renderCalendar();
        // renderCalendar() always rebuilds fresh, natural-size day
        // cells — fine in CALENDAR state, but while LOCKED those
        // fresh cells have no mini-calendar transform on them yet,
        // which is exactly what left them full-size and overlapping
        // the day-time-grid after a resize. Re-snap them onto the
        // (also freshly recomputed, resize-aware) mini targets right
        // after, same as month-nav clicks already do while locked.
        if (DayViewState.get() === DayViewState.STATES.LOCKED) {
          LockedMonthNav.snapCurrentCellsToMini();
        }
      }, 150);
    });

    wireBirthdaysPanel();

    (async () => {
      // 1) Hydrate from the last-known data so the very first paint is complete.
      try {
        const c = BootCache;
        if (c.get('habits')) habitsData = c.get('habits');
        if (c.get('files')) allFiles = c.get('files');
        if (c.get('targets')) { targetsData = c.get('targets'); rebuildTargetsByField(); }
        if (c.get('birthdays')) birthdaysData = c.get('birthdays');
        if (c.get('settings')) settings = { ...DEFAULT_SETTINGS, ...c.get('settings') };
      } catch (e) {}
      const paintAll = () => {
        applyStatsBarVisibility();
        applyNightMode();
        applyZoomSetting();
        applyLanguage();
        const birthdaysToggleEl = document.getElementById('birthdaysShowToggle');
        if (birthdaysToggleEl) birthdaysToggleEl.checked = settings.showBirthdays;
        renderBirthdaysList();
        try { renderCalendar(); } catch (e) {}
      };
      const hadCache = !!BootCache.get('habits');
      const snap = () => JSON.stringify([habitsData, allFiles, targetsData, birthdaysData, settings]);
      const before = snap();
      paintAll();
      window.__perf.painted = performance.now();
      // 2) Refresh from the server in the background.
      await Promise.all([loadAllHabits(), loadAllFiles(), loadTargets(), loadSettingsFromServer(), loadBirthdays()]);
      // 3) Repaint only if something actually changed (or there was no cache).
      if (!hadCache || snap() !== before) paintAll();
      window.__perf.fresh = performance.now();
      if (/[?&]perf=1/.test(location.search)) {
        const d = document.createElement('div');
        d.style.cssText = 'position:fixed;left:8px;bottom:8px;z-index:99999;background:#fff;color:#111;border:1px solid #ccc;border-radius:8px;padding:8px 10px;font:12px/1.4 monospace;white-space:pre';
        const r = (n) => Math.round(n);
        d.textContent = 'script started: ' + r(__perf.start) + ' ms\nfirst paint:    ' + r(__perf.painted) + ' ms\nserver synced:  ' + r(__perf.fresh) + ' ms\ncache hit: ' + hadCache;
        document.body.appendChild(d);
      }
    })();

    const DayViewState = (() => {
      const STATES = {
        CALENDAR:      'calendar',
        TRANSITIONING: 'transitioning',
        LOCKED:        'dayview-locked',
      };
      let current = STATES.CALENDAR;
      const listeners = [];

      function get() { return current; }

      function set(next, meta) {
        if (next === current) return;
        const prev = current;
        current = next;
        console.log('[DayViewState] ' + prev + ' -> ' + next);
        listeners.forEach((fn) => fn(next, prev, meta || {}));
      }

      // Anything (later sections) can subscribe to be told when the
      // state changes, instead of polling it.
      function onChange(fn) { listeners.push(fn); }

      return { STATES, get, set, onChange };
    })();

    // Frozen page-scroll baseline for the LOCKED (day-view) header/grid
    // overlays below (DayShowcase, LockedMonthNav, LockedHeaderCard,
    // DayTimeGrid). Those all position themselves with
    // `position:absolute` on <body>, converting a viewport-relative
    // rect into page coordinates via `+ window.scrollY` — which only
    // makes sense once, right when day view opens (DayViewScroll
    // already forces scrollTo(0,0) at that moment, so this is always
    // 0 in practice). Several of those modules also re-run their
    // render() from a `resize` listener while already LOCKED (e.g.
    // mobile browsers firing resize when the address bar collapses
    // mid-scroll). If that re-render read a *live* window.scrollY —
    // by then however far the user had scrolled down into the hour
    // grid — it would silently re-anchor the whole header + grid that
    // much further down the page. Scrolling up afterward then exposed
    // a huge blank gap above them, since nothing else in day view
    // occupies that reclaimed space. Reading this frozen value instead
    // keeps the header + grid pinned to where the day view actually
    // started, no matter when a later render() happens to run.
    const LockedViewAnchor = (() => {
      let y = 0;
      DayViewState.onChange((next, prev) => {
        if (next === DayViewState.STATES.LOCKED && prev !== DayViewState.STATES.LOCKED) {
          y = window.scrollY || window.pageYOffset || 0;
        }
      });
      return { get: () => y };
    })();

    const DayViewScroll = (() => {
      const cfg = {
        UNLOCK_THRESHOLD: 900,   // total downward wheel delta (in CALENDAR) to start locking in
        EXIT_THRESHOLD:   900,   // total upward wheel delta (in LOCKED) to start unlocking
        // On a phone, a "scroll" is a finger drag across a small
        // screen — 900px of accumulated drag feels like it never
        // triggers. These lower phone-only thresholds are used
        // instead whenever the viewport matches the same
        // max-width:640px phone breakpoint the rest of the app
        // already uses (see the title-limit check above).
        MOBILE_UNLOCK_THRESHOLD: 500,
        MOBILE_EXIT_THRESHOLD:   500,
        MAX_ACCUM:        1400,  // clamp so a single big scroll gesture can't overshoot wildly
        DECAY_IDLE_MS:    550,   // pause this long with no wheel input -> accumulator bleeds back to 0
        // How close to the very top of the page (in px) you need to be
        // scrolled for wheel/touch input to count toward the lock-in/
        // unlock gesture at all. Without this, ordinary scrolling while
        // editing further down the page (e.g. through the day-time-grid
        // hours) was accumulating toward this gesture and triggering the
        // animation unintentionally.
        NEAR_TOP_PX:       2,
        // Drives the actual lock-in/unlock (mini-calendar) animation
        // length everywhere it's read from below (section 4-8 FLIP code).
        TRANSITION_MS:    0,
      };

      function isNearTop() {
        return (window.scrollY || window.pageYOffset || 0) <= cfg.NEAR_TOP_PX;
      }

      function isPhoneViewport() {
        return window.matchMedia('(max-width: 640px)').matches;
      }
      function unlockThreshold() {
        return isPhoneViewport() ? cfg.MOBILE_UNLOCK_THRESHOLD : cfg.UNLOCK_THRESHOLD;
      }
      function exitThreshold() {
        return isPhoneViewport() ? cfg.MOBILE_EXIT_THRESHOLD : cfg.EXIT_THRESHOLD;
      }

      const { STATES } = DayViewState;
      let accum = 0;      // builds while in CALENDAR, scrolling down
      let exitAccum = 0;  // builds while in LOCKED, scrolling up
      let transitionTimer = null;
      let transitionDirection = null; // 'forward' | 'backward', only set while TRANSITIONING

      let idleTimer = null;
      function armIdleDecay() {
        clearTimeout(idleTimer);
        idleTimer = setTimeout(() => {
          accum = 0;
          exitAccum = 0;
        }, cfg.DECAY_IDLE_MS);
      }

      function startTransition(direction) {
        transitionDirection = direction;
        accum = 0;
        exitAccum = 0;
        // The touch/wheel listeners that drive this accumulator are
        // deliberately passive (see handleTouchMove above) so normal
        // page scrolling is never blocked. That means the real page
        // has likely already scrolled down some amount by the time
        // the drag/wheel distance crosses the lock-in threshold here.
        // HeaderCollapse (section 3 addendum) only closes the *gap*
        // left by the vacated header — it never resets scroll — so
        // without this, the collapsed/locked calendar ends up
        // wherever the page's current scrollY happens to be (often
        // mid-screen on phones) instead of pinned to the top. Only
        // do this going forward (into LOCKED); unlocking back to the
        // normal calendar doesn't have this problem since nothing
        // collapses on the way out.
        if (direction === 'forward' && (window.scrollY || window.pageYOffset)) {
          window.scrollTo(0, 0);
        }
        DayViewState.set(STATES.TRANSITIONING, { direction });
        clearTimeout(transitionTimer);
        transitionTimer = setTimeout(() => {
          const finalState = direction === 'forward' ? STATES.LOCKED : STATES.CALENDAR;
          transitionDirection = null;
          DayViewState.set(finalState, { direction });
        }, cfg.TRANSITION_MS);
      }

      function handleWheel(e) {
        // While the day-entry editor is open (e.g. typing in the
        // pushups counter), scrolling is meant for whatever's inside
        // that editor, not for the mini-calendar exit gesture. Bail
        // out completely — don't accumulate, don't decay, don't
        // touch DayViewState — so the scroll trigger only ever
        // counts when the person is back on the main menu with
        // nothing open. activeDate is non-null exactly while that
        // modal (openModal/closeModal, further down this file) is open.
        if (typeof activeDate !== 'undefined' && activeDate !== null) return;
        // Also skip while a day-time-grid box (a different, newer
        // editor) is open, for the same reason.
        if (typeof EventEditor !== 'undefined' && EventEditor.isOpen()) return;
        // And skip entirely while the week view (a separate, newer
        // full-screen overlay) is open — otherwise scrolling inside
        // it could accumulate toward this gesture and pop the mini-
        // calendar lock-in open/closed underneath it. The week view
        // must be closed first before this gesture can do anything.
        if (typeof WeekView !== 'undefined' && WeekView.isOpen()) return;

        const state = DayViewState.get();

        if (state === STATES.TRANSITIONING) {
          // The lock-in/unlock animation is time-driven, not scroll-driven —
          // per spec, once it starts it always finishes on its own.
          // Section 3 will also prevent-default real page scroll during
          // this state; for now we just ignore wheel input here.
          return;
        }

        if (state === STATES.CALENDAR) {
          // Near-top only gates the START of the gesture — once accum
          // has actually begun building, real page scroll naturally
          // carries scrollY away from 0, so re-checking this on every
          // tick would zero the accumulator constantly and the
          // gesture could never complete. Ordinary scrolling further
          // down the page (while accum is still 0) is what this is
          // meant to ignore.
          if (accum === 0 && !isNearTop()) { armIdleDecay(); return; }
          if (e.deltaY > 0) {
            accum = Math.min(cfg.MAX_ACCUM, accum + e.deltaY);
          } else if (e.deltaY < 0) {
            accum = Math.max(0, accum + e.deltaY);
          }
          if (accum >= unlockThreshold()) {
            startTransition('forward');
          }
        } else if (state === STATES.LOCKED) {
          // Same reasoning as the CALENDAR branch above — only the
          // start of the exit gesture needs to be near the top.
          if (exitAccum === 0 && !isNearTop()) { armIdleDecay(); return; }
          if (e.deltaY < 0) {
            exitAccum = Math.min(cfg.MAX_ACCUM, exitAccum + Math.abs(e.deltaY));
          } else if (e.deltaY > 0) {
            exitAccum = Math.max(0, exitAccum - e.deltaY);
          }
          if (exitAccum >= exitThreshold()) {
            startTransition('backward');
          }
        }

        armIdleDecay();
      }

      // Phones don't fire 'wheel' events — a finger drag on the
      // screen is the mobile equivalent of a mouse-wheel scroll, so
      // this feeds the exact same handleWheel()/accumulator path
      // with a synthetic { deltaY } built from touch movement.
      // Dragging the finger UP the screen (the normal "scroll down"
      // gesture) yields a positive deltaY, matching wheel's sign
      // convention; dragging down yields negative. Only one finger
      // is tracked, and passive:true is kept throughout so normal
      // page/touch scrolling is never prevented — same guarantee
      // section 3's comment makes for real wheel scrolling.
      let lastTouchY = null;

      function handleTouchStart(e) {
        if (!e.touches || e.touches.length !== 1) { lastTouchY = null; return; }
        lastTouchY = e.touches[0].clientY;
      }

      function handleTouchMove(e) {
        if (lastTouchY == null || !e.touches || e.touches.length !== 1) return;
        const currentY = e.touches[0].clientY;
        const deltaY = lastTouchY - currentY;
        lastTouchY = currentY;
        if (deltaY !== 0) handleWheel({ deltaY });
      }

      function handleTouchEnd() {
        lastTouchY = null;
      }

      // Scroll/swipe no longer drives the Month <-> Day transition —
      // that gesture is disabled outright (no listeners attached), so
      // the only way in or out of the day view is tapping the Day /
      // Month tabs in the GlobalTopBar (see their triggerForward()/
      // triggerBackward() calls below). Real page scrolling, the
      // day-time-grid's hour scroll, and the week view's day-to-day
      // swipe are all untouched — this only removes the wheel/touch
      // accumulator gesture that used to zoom you into/out of the
      // day view.
      function init() {}

      return {
        init,
        cfg,
        // Additive-only export for the week view (see "WEEK VIEW" near
        // the bottom of this file): lets it kick off the exact same
        // forward lock-in transition a real scroll gesture would,
        // instead of duplicating this module's timer/scroll-reset
        // logic elsewhere. Nothing above this line changed to add it.
        triggerForward: () => startTransition('forward'),
        // Same idea, opposite direction — lets the GlobalTopBar's
        // view tabs (near the end of the file) drop straight back to
        // the month calendar from day view without needing an actual
        // upward scroll/swipe gesture.
        triggerBackward: () => startTransition('backward'),
      };
    })();
    DayViewScroll.init();

    const CalendarInteractionLock = (() => {
      let calendarMainEl = null;

      function apply(state) {
        if (!calendarMainEl) return;
        const isCalendar = state === DayViewState.STATES.CALENDAR;
        calendarMainEl.style.pointerEvents = isCalendar ? '' : 'none';
        calendarMainEl.classList.toggle('day-view-locked', !isCalendar);
      }

      function init() {
        calendarMainEl = document.querySelector('.calendar-main');
        apply(DayViewState.get());
        DayViewState.onChange((next) => apply(next));
      }

      return { init };
    })();
    CalendarInteractionLock.init();

    const HeaderCollapse = (() => {
      let appHeaderEl = null;
      let appLayoutEl = null;
      let daysGridEl  = null;

      function collapse() {
        const monthNav = document.querySelector('.month-nav');
        if (!appHeaderEl || !appLayoutEl || !daysGridEl || !monthNav) return;

        // Gap 1: app-header ("Kalendorius" title) now fades away too —
        // pull the whole app-layout (legend + calendar) up to close it.
        const headerGap = appLayoutEl.getBoundingClientRect().top - appHeaderEl.getBoundingClientRect().top;
        appLayoutEl.style.marginTop = '-' + headerGap + 'px';

        // Gap 2: month-nav + stats-bar + weekdays (also now fading away)
        // reserve space above daysGrid — pull daysGrid up to right after
        // month-nav's own spot so the flying day-cells start collapsed.
        const gridGap = daysGridEl.getBoundingClientRect().top - monthNav.getBoundingClientRect().top;
        daysGridEl.style.marginTop = '-' + gridGap + 'px';
      }

      function restore() {
        if (appLayoutEl) appLayoutEl.style.marginTop = '';
        if (daysGridEl)  daysGridEl.style.marginTop  = '';
      }

      function init() {
        appHeaderEl = document.querySelector('.app-header');
        appLayoutEl = document.querySelector('.app-layout');
        daysGridEl  = document.getElementById('daysGrid');
        DayViewState.onChange((next, prev, meta) => {
          if (next === DayViewState.STATES.TRANSITIONING && meta.direction === 'forward') {
            collapse();
          } else if (next === DayViewState.STATES.TRANSITIONING && meta.direction === 'backward') {
            restore();
          }
        });
      }

      return { init };
    })();
    HeaderCollapse.init();

    const CalendarGeometry = (() => {
      let lastCapture = []; // [{ el, dateStr, dayNum, rect }]

      function captureFirst() {
        const grid = document.getElementById('daysGrid');
        const cells = Array.from(grid.querySelectorAll('.day-cell:not(.empty)'));
        lastCapture = cells.map((cell) => {
          const numEl = cell.querySelector('.day-num');
          return {
            el:     cell,
            dayNum: numEl ? numEl.textContent : '',
            rect:   cell.getBoundingClientRect(),
          };
        });
        console.log('[CalendarGeometry] captured First rects for', lastCapture.length, 'day cells');
        if (lastCapture.length) {
          const sample = lastCapture[0];
          console.log('[CalendarGeometry] sample (day ' + sample.dayNum + '):', sample.rect);
        }
        return lastCapture;
      }

      function getLastCapture() { return lastCapture; }

      function init() {
        DayViewState.onChange((next, prev, meta) => {
          if (next === DayViewState.STATES.TRANSITIONING && meta.direction === 'forward') {
            captureFirst();
          }
        });
      }

      // Exposed for section 5+ to consume without touching this block again.
      return { init, captureFirst, getLastCapture };
    })();
    CalendarGeometry.init();

    // Shared by every module below that needs to tell phones apart from
    // desktop/tablet (same 640px breakpoint the rest of the app already
    // uses for its mobile styles/thresholds) — one source of truth so
    // the locked mini-calendar block and its scroll thresholds never
    // disagree about what counts as "mobile".
    function isPhoneVP() {
      return window.matchMedia('(max-width: 640px)').matches;
    }

    const MiniCalendarLayout = (() => {
      const cfg = {
        top:        72,    // px from top of the page — clears the persistent
                            // .global-topbar (52px) plus a small breathing gap,
                            // then a little extra above the date pill (see
                            // LockedMonthNav.computeRect()). Safe to keep small
                            // otherwise since HeaderCollapse (section 3 addendum)
                            // fully retracts the app-header before LOCKED is ever
                            // reached, so nothing else occupies this corner once
                            // the day view is showing.
        topMobile:  62,    // phones: same idea, slightly tighter so the pill +
                            // hour grid still fit comfortably on a short viewport.
        showcaseSpace: 178, // reserved width for the day-showcase number + its gap
                            // (see DayShowcase's own cfg.gap:28 + ~150px for a bold
                            // 2-digit number), so the mini-calendar starts right after it
        width:      224,   // total mini-calendar width (max — shrinks on narrow screens, see computeContainerRect)
        horizontalMargin: 12, // min breathing room kept clear on either edge of the viewport
        rows:       6,     // fixed max weeks-per-month, so target size never shifts
        gap:        3,     // px gap between cells
        gapMobile:  2,     // tighter cell gap on phones, shaves a little more height off the grid
        cellAspect: 0.82,  // cell height = cell width * this (slightly short, like Google Calendar)
        cellAspectMobile: 0.74, // shorter cells on phones — trims total mini-calendar
                            // height so there's more clearance above the hour grid
        headerHeight: 14,  // px height of the Pr/An/Tr/... weekday label row
        headerGap:    4,   // px gap between the weekday labels and the day grid below
        headerGapMobile: 2, // tighter version of headerGap for phones (see topMobile)
      };

      function currentTop() {
        return isPhoneVP() ? cfg.topMobile : cfg.top;
      }
      function currentHeaderGap() {
        return isPhoneVP() ? cfg.headerGapMobile : cfg.headerGap;
      }

      function computeContainerRect() {
        // The day-showcase + mini-calendar are always centered together
        // as one group on the x-axis (never pinned to an edge). Shrink
        // the mini-calendar's width if the combined group wouldn't fit
        // with margin to spare on a narrow screen.
        const maxGroupWidth = cfg.showcaseSpace + cfg.width;
        const availableTotal = window.innerWidth - cfg.horizontalMargin * 2;
        const groupWidth = Math.min(maxGroupWidth, availableTotal);
        const width      = Math.max(140, groupWidth - cfg.showcaseSpace);
        const gap        = isPhoneVP() ? cfg.gapMobile : cfg.gap;
        const cellAspect = isPhoneVP() ? cfg.cellAspectMobile : cfg.cellAspect;
        const cellW  = (width - gap * 6) / 7;
        const cellH  = cellW * cellAspect;
        const height = cellH * cfg.rows + gap * (cfg.rows - 1);
        const groupLeft = (window.innerWidth - groupWidth) / 2; // centers the whole group
        const left   = groupLeft + cfg.showcaseSpace;
        const top    = currentTop() + cfg.headerHeight + currentHeaderGap(); // day grid starts below the weekday labels
        return { left, top, width, height, cellW, cellH };
      }

      // Uses the SAME weekday-offset logic as renderCalendar (mondayIdx),
      // so a given date always lands in the same relative grid cell as
      // it does in the full calendar — just scaled down.
      function computeTargets(year, month) {
        const container   = computeContainerRect();
        const gap          = isPhoneVP() ? cfg.gapMobile : cfg.gap;
        const firstDow     = new Date(year, month, 1).getDay();
        const firstMonIdx  = mondayIdx(firstDow);
        const daysInMonth  = new Date(year, month + 1, 0).getDate();

        const targets = {}; // dayNum -> { left, top, width, height }
        for (let d = 1; d <= daysInMonth; d++) {
          const idx = firstMonIdx + (d - 1);
          const col = idx % 7;
          const row = Math.floor(idx / 7);
          targets[d] = {
            left:   container.left + col * (container.cellW + gap),
            top:    container.top  + row * (container.cellH + gap),
            width:  container.cellW,
            height: container.cellH,
          };
        }
        return { container, targets };
      }

      let ghostEls = [];
      function clearGhost() {
        ghostEls.forEach((el) => el.remove());
        ghostEls = [];
      }

      function showGhost() {
        clearGhost();
        const { container, targets } = computeTargets(viewYear, viewMonth);

        const frame = document.createElement('div');
        frame.id = 'miniCalGhostFrame';
        frame.style.cssText =
          'position:fixed;left:' + container.left + 'px;top:' + container.top + 'px;' +
          'width:' + container.width + 'px;height:' + container.height + 'px;' +
          'border:1px dashed rgba(59,130,246,0.55);border-radius:8px;' +
          'z-index:99998;pointer-events:none;';
        document.body.appendChild(frame);
        ghostEls.push(frame);

        // Weekday abbreviation row (Pr/An/Tr/Kt/Pn/Št/Sk) sits just above
        // the day grid — since the full weekday row + day cells fade away
        // together now, this is the only weekday context left once locked.
        t('weekdays').forEach((label, col) => {
          const lbl = document.createElement('div');
          lbl.style.cssText =
            'position:fixed;' +
            'left:' + (container.left + col * (container.cellW + cfg.gap)) + 'px;' +
            'top:' + cfg.top + 'px;' +
            'width:' + container.cellW + 'px;height:' + cfg.headerHeight + 'px;' +
            'display:flex;align-items:center;justify-content:center;' +
            'font:700 8px sans-serif;letter-spacing:0.3px;color:rgba(120,120,120,0.9);' +
            'text-transform:uppercase;z-index:99998;pointer-events:none;';
          lbl.textContent = label;
          document.body.appendChild(lbl);
          ghostEls.push(lbl);
        });

        Object.keys(targets).forEach((dayNum) => {
          const r = targets[dayNum];
          const box = document.createElement('div');
          box.style.cssText =
            'position:fixed;left:' + r.left + 'px;top:' + r.top + 'px;' +
            'width:' + r.width + 'px;height:' + r.height + 'px;' +
            'border:1px solid rgba(59,130,246,0.35);border-radius:3px;' +
            'z-index:99998;pointer-events:none;display:flex;' +
            'align-items:center;justify-content:center;' +
            'font:8px monospace;color:rgba(59,130,246,0.8);';
          box.textContent = dayNum;
          document.body.appendChild(box);
          ghostEls.push(box);
        });
      }

      function init() {
        // Superseded once the FLIP animation (sections 6-7) exists: the
        // real day-cells fly to these exact targets and hold there
        // (numbers included), so this dashed debug preview is redundant
        // in normal use. Left as a no-op rather than deleted so nothing
        // above (sections 6-8, which call computeContainerRect/
        // computeTargets directly) has to change.
      }

      // Exposed for section 6+ to consume without touching this block again.
      return { init, computeContainerRect, computeTargets, cfg };
    })();
    MiniCalendarLayout.init();

    const FlipAnimator = (() => {
      const cfg = {
        easing: 'cubic-bezier(0.4, 0, 0.2, 1)', // smooth, decelerating — Google-Calendar-ish shrink feel
        zIndexWhileFlying: '500',
        dayNumBoost: 1.3, // how much bigger than its normal full-size the day
                           // number should render once the cell is shrunk down
                           // to mini-calendar size, so it stays easy to read
      };

      // The whole cell (including its .day-num child) gets visually shrunk
      // by the parent's own scale(scaleX, scaleY) transform below — that's
      // what makes the "1"/"2"/... numbers unreadably tiny by default, since
      // the parent transform scales everything painted inside it uniformly.
      // To counter that, .day-num gets its OWN scale transform applied on
      // top, sized so it cancels out (most of) the parent's shrink — leaving
      // the number rendering close to its full natural size (times the
      // boost above) regardless of how small the cell itself has become.
      function applyDayNumScale(cell, scaleX, scaleY, durationMs) {
        const numEl = cell.querySelector('.day-num');
        if (!numEl) return;
        const avgScale = (scaleX + scaleY) / 2;
        const counter  = cfg.dayNumBoost / avgScale;
        numEl.style.transformOrigin = '0 0';
        numEl.style.transition = durationMs
          ? ('transform ' + durationMs + 'ms ' + cfg.easing)
          : 'none';
        numEl.style.transform = 'scale(' + counter + ')';
      }

      // How far (in the cell's own untransformed pixel space, same space
      // .day-num's CSS top/left already live in) the number needs to move
      // from its normal corner spot to sit exactly in the middle of the
      // cell. Reads real box sizes so it stays correct regardless of any
      // dayNumBoost/breakpoint tuning elsewhere.
      function computeDayNumCenterOffset(numEl, cellW, cellH, finalNumScale) {
        const left = parseFloat(getComputedStyle(numEl).left) || 0;
        const top  = parseFloat(getComputedStyle(numEl).top)  || 0;
        // numEl is scaled up (by finalNumScale) about its own top-left corner
        // AFTER this translate is applied, so the box we need to center is
        // its size at that final scale — not its unscaled offsetWidth/Height.
        // This offset already lives in the same local coordinate space the
        // parent cell's scale(scaleX, scaleY) transform scales uniformly, so
        // no extra division by scaleX/scaleY is needed here.
        return {
          dx: (cellW - numEl.offsetWidth  * finalNumScale) / 2 - left,
          dy: (cellH - numEl.offsetHeight * finalNumScale) / 2 - top,
        };
      }

      // Layered on top of the cell's own translate/scale flight transform
      // (set by the caller just before this runs): morphs the cell into a
      // circle — number recentered and a touch smaller — and holds that
      // shape once it lands. Used for the forward flight (calendar -> mini)
      // and to keep the mini-calendar cells circular at rest.
      function animateToCircle(cell, scaleX, scaleY, durationMs) {
        const numEl = cell.querySelector('.day-num');
        const finalNumScale = cfg.dayNumBoost / ((scaleX + scaleY) / 2);
        cell.style.transition = 'transform ' + durationMs + 'ms ' + cfg.easing +
          ', border-radius ' + durationMs + 'ms ' + cfg.easing;
        cell.style.borderRadius = '50%';
        if (numEl) {
          const offset = computeDayNumCenterOffset(numEl, cell.offsetWidth, cell.offsetHeight, finalNumScale);
          numEl.style.transformOrigin = '0 0';
          numEl.style.transition = 'transform ' + durationMs + 'ms ' + cfg.easing;
          numEl.style.transform =
            'translate(' + offset.dx + 'px, ' + offset.dy + 'px) scale(' + finalNumScale + ')';
        }
      }

      // Mirror of the above for the backward flight (mini -> calendar):
      // the cell starts out circular (from the forward flight/rest above)
      // and morphs back to its normal rounded-square over the flight, with
      // the number un-centering back to its corner at normal (unboosted) size.
      function animateFromCircle(cell, finalNumScale, durationMs) {
        const numEl = cell.querySelector('.day-num');

        // The cell's own inline border-radius is currently '50%' (circle).
        // Briefly clear it to read the natural rounded-square radius the
        // CSS class defines (13px full-size / 9px on the narrow breakpoint),
        // then restore the circle so nothing visibly flashes before the
        // transition below picks it up.
        const prevRadius = cell.style.borderRadius;
        cell.style.borderRadius = '';
        const naturalRadius = getComputedStyle(cell).borderRadius;
        cell.style.borderRadius = prevRadius;

        cell.style.transition = 'transform ' + durationMs + 'ms ' + cfg.easing +
          ', border-radius ' + durationMs + 'ms ' + cfg.easing;
        cell.style.borderRadius = naturalRadius;
        if (numEl) {
          numEl.style.transformOrigin = '0 0';
          numEl.style.transition = 'transform ' + durationMs + 'ms ' + cfg.easing;
          numEl.style.transform = 'translate(0px, 0px) scale(' + finalNumScale + ')';
        }
      }

      function animateForward() {
        const firstCells = CalendarGeometry.getLastCapture(); // populated synchronously by section 4's listener, which runs before this one
        const { targets } = MiniCalendarLayout.computeTargets(viewYear, viewMonth);
        const durationMs = DayViewScroll.cfg.TRANSITION_MS;

        firstCells.forEach(({ el, dayNum, rect: firstRect }) => {
          const lastRect = targets[dayNum];
          if (!lastRect) return; // no matching target cell (shouldn't normally happen)
          flyTo(el, firstRect, lastRect, durationMs);
        });
      }

      function flyTo(el, firstRect, lastRect, durationMs) {
        const dx     = lastRect.left - firstRect.left;
        const dy     = lastRect.top  - firstRect.top;
        const scaleX = lastRect.width  / firstRect.width;
        const scaleY = lastRect.height / firstRect.height;

        el.classList.add('flip-animating');
        el.style.zIndex         = cfg.zIndexWhileFlying;
        el.style.transformOrigin = '0 0';
        el.style.willChange      = 'transform';

        // Make sure we're starting cleanly from identity before animating,
        // in case a previous (interrupted) animation left a transform on it.
        el.style.transition   = 'none';
        el.style.transform    = 'translate(0px, 0px) scale(1, 1)';
        el.style.borderRadius = '';
        void el.offsetWidth; // force the browser to commit the "from" state

        el.style.transition = 'transform ' + durationMs + 'ms ' + cfg.easing;
        el.style.transform  = 'translate(' + dx + 'px, ' + dy + 'px) scale(' + scaleX + ', ' + scaleY + ')';

        animateToCircle(el, scaleX, scaleY, durationMs);
      }

      function animateBackward() {
        const durationMs = DayViewScroll.cfg.TRANSITION_MS;
        const { targets } = MiniCalendarLayout.computeTargets(viewYear, viewMonth);
        const cells = document.querySelectorAll('#daysGrid .day-cell.flip-animating');

        cells.forEach((el) => {
          const numEl = el.querySelector('.day-num');
          const dayNum = numEl ? numEl.textContent : '';
          const currentRect = targets[dayNum]; // freshly recomputed mini-calendar position — not reused from section 4/5's old numbers
          if (!currentRect) return;

          // Recapture the natural (untransformed) grid position FRESH, right
          // now — not from section 4's original snapshot — so this is still
          // correct even if the window was resized while locked.
          const prevTransform = el.style.transform;
          el.style.transition = 'none';
          el.style.transform = 'none';
          const naturalRect = el.getBoundingClientRect();
          el.style.transform = prevTransform;

          flyBackToNatural(el, currentRect, naturalRect, durationMs);
        });
      }

      function flyBackToNatural(el, currentRect, naturalRect, durationMs) {
        const dx     = currentRect.left - naturalRect.left;
        const dy     = currentRect.top  - naturalRect.top;
        const scaleX = currentRect.width  / naturalRect.width;
        const scaleY = currentRect.height / naturalRect.height;

        el.classList.add('flip-animating');
        el.style.zIndex          = cfg.zIndexWhileFlying;
        el.style.transformOrigin = '0 0';
        el.style.willChange      = 'transform';

        // Re-assert the (freshly computed) current transform instantly —
        // self-corrects for any resize that happened while locked — then
        // animate it down to identity, which visually returns the cell to
        // its exact natural document position.
        el.style.transition   = 'none';
        el.style.transform    = 'translate(' + dx + 'px, ' + dy + 'px) scale(' + scaleX + ', ' + scaleY + ')';
        el.style.borderRadius = '50%'; // starts circular (that's the parked mini-cell shape now)
        applyDayNumScale(el, scaleX, scaleY, 0);
        void el.offsetWidth;

        el.style.transition = 'transform ' + durationMs + 'ms ' + cfg.easing;
        el.style.transform  = 'translate(0px, 0px) scale(1, 1)';
        animateFromCircle(el, 1, durationMs); // back to normal, un-boosted size
      }

      function settleAtTarget() {
        // Called once the state-machine timer completes (-> LOCKED).
        // Cells are already visually parked at the target from the
        // transition above; this just tidies the inline styles so
        // they hold steady (no dangling transition) until section 9's
        // real widget takes over. Border-radius is deliberately left
        // alone here — the parked mini-cells stay circular.
        document.querySelectorAll('.day-cell.flip-animating').forEach((el) => {
          el.style.transition = '';
        });
      }

      function resetToOriginal() {
        // Called once the reverse animation has finished playing
        // (state -> CALENDAR). By this point the transform has already
        // animated all the way back to identity, so this just clears
        // the inline styles/classes so the cell is fully back to its
        // untouched, original state — no lingering transform/z-index.
        document.querySelectorAll('.day-cell.flip-animating').forEach((el) => {
          el.style.transition   = '';
          el.style.transform    = '';
          el.style.zIndex       = '';
          el.style.willChange   = '';
          el.style.borderRadius = '';
          el.classList.remove('flip-animating');
          const numEl = el.querySelector('.day-num');
          if (numEl) {
            numEl.style.transition = '';
            numEl.style.transform  = '';
            numEl.style.transformOrigin = '';
          }
        });
      }

      function init() {
        DayViewState.onChange((next, prev, meta) => {
          // The mini-calendar no longer flies/shrinks into the corner —
          // #daysGrid is just hidden outright the instant we leave
          // CALENDAR (see the .calendar-main.day-view-locked CSS rule),
          // so there's nothing left to fly. animateForward()/
          // animateBackward() (the shrink/un-shrink flight) are
          // deliberately never called anymore. settleAtTarget()/
          // resetToOriginal() are kept as pure cleanup calls — they
          // only clear inline transition/transform/classList leftovers
          // (e.g. from LockedMonthNav.snapCurrentCellsToMini, which
          // still runs internally but is likewise invisible now) so
          // the real day-cells come back completely clean once the
          // grid is shown again.
          if (next === DayViewState.STATES.LOCKED) {
            settleAtTarget();
          } else if (next === DayViewState.STATES.CALENDAR) {
            resetToOriginal();
          }
        });
      }

      return { init, cfg, applyDayNumScale, animateToCircle };
    })();
    FlipAnimator.init();

    const TextFadeChoreography = (() => {
      function fadeChildren(el, opacity, durationMs, easing) {
        Array.from(el.children).forEach((child) => {
          if (child.classList.contains('day-num')) return; // stays visible — see note above
          child.style.transition = 'opacity ' + durationMs + 'ms ' + easing;
          child.style.opacity = String(opacity);
        });
      }

      function resetChildren(el) {
        Array.from(el.children).forEach((child) => {
          child.style.transition = '';
          child.style.opacity = '';
        });
      }

      function onForward() {
        const firstCells = CalendarGeometry.getLastCapture();
        const durationMs = DayViewScroll.cfg.TRANSITION_MS;
        const easing = FlipAnimator.cfg.easing; // same curve as the square's own movement
        firstCells.forEach(({ el }) => fadeChildren(el, 0, durationMs, easing));
      }

      function onBackward() {
        const durationMs = DayViewScroll.cfg.TRANSITION_MS;
        const easing = FlipAnimator.cfg.easing;
        document.querySelectorAll('#daysGrid .day-cell.flip-animating').forEach((el) => {
          fadeChildren(el, 1, durationMs, easing);
        });
      }

      function onCalendarReset() {
        // Animation has already finished fading back in by this point;
        // this just clears the inline styles so nothing lingers.
        document.querySelectorAll('.day-cell').forEach((el) => resetChildren(el));
      }

      function init() {
        DayViewState.onChange((next, prev, meta) => {
          if (next === DayViewState.STATES.TRANSITIONING && meta.direction === 'forward') {
            onForward();
          } else if (next === DayViewState.STATES.TRANSITIONING && meta.direction === 'backward') {
            onBackward();
          } else if (next === DayViewState.STATES.CALENDAR) {
            onCalendarReset();
          }
        });
      }

      return { init };
    })();
    TextFadeChoreography.init();

    const AuxPanelExit = (() => {
      const cfg = {
        exitDistancePx: 70, // how far up these panels travel while exiting
      };

      function getPanels() {
        const cards     = Array.from(document.querySelectorAll('.stats-bar .stat-card'));
        const legend    = document.querySelector('.legend-panel');
        const appHeader = document.querySelector('.app-header');
        const weekdays  = document.getElementById('weekdaysRow');
        const monthNav  = document.querySelector('.month-nav');
        const extras    = [legend, appHeader, weekdays, monthNav].filter(Boolean);
        return cards.concat(extras);
      }

      function exit() {
        const durationMs = DayViewScroll.cfg.TRANSITION_MS;
        const easing = FlipAnimator.cfg.easing;
        getPanels().forEach((el) => {
          el.style.transition = 'transform ' + durationMs + 'ms ' + easing + ', opacity ' + durationMs + 'ms ' + easing;
          el.style.transform = 'translateY(-' + cfg.exitDistancePx + 'px)';
          el.style.opacity = '0';
          el.style.pointerEvents = 'none';
        });
      }

      function enter() {
        const durationMs = DayViewScroll.cfg.TRANSITION_MS;
        const easing = FlipAnimator.cfg.easing;
        getPanels().forEach((el) => {
          el.style.transition = 'transform ' + durationMs + 'ms ' + easing + ', opacity ' + durationMs + 'ms ' + easing;
          el.style.transform = 'translateY(0px)';
          el.style.opacity = '1';
        });
      }

      function cleanup() {
        // Animation has already finished by the time we reach CALENDAR;
        // just clear inline styles so nothing lingers and pointer events
        // work normally again.
        getPanels().forEach((el) => {
          el.style.transition = '';
          el.style.transform = '';
          el.style.opacity = '';
          el.style.pointerEvents = '';
        });
      }

      function init() {
        DayViewState.onChange((next, prev, meta) => {
          if (next === DayViewState.STATES.TRANSITIONING && meta.direction === 'forward') {
            exit();
          } else if (next === DayViewState.STATES.TRANSITIONING && meta.direction === 'backward') {
            enter();
          } else if (next === DayViewState.STATES.CALENDAR) {
            cleanup();
          }
        });
      }

      return { init };
    })();
    AuxPanelExit.init();

    const LockedMonthNav = (() => {
      const cfg = { height: 26, gapBelowShowcase: 14, fadeMs: 0 };
      let el = null, dateLabelEl = null;

      function computeRect() {
        // Used to sit "showcase.top + showcase.height + gap" — i.e.
        // directly below the day-showcase number AND the mini-
        // calendar grid that used to hang below it. The mini-calendar
        // was later deleted from the LOCKED view entirely (#daysGrid
        // is just display:none now) and DayShowcase itself is never
        // shown either (see its own init() note) — but DayShowcase.
        // computeRect() still returned a "totalHeight" sized for that
        // whole deleted panel, so this nav kept reserving 150px+ of
        // blank space above itself for a mini-calendar nobody sees
        // anymore. This pill is the only thing actually visible up
        // here now, so it just sits at the same small top-of-page
        // offset the mini-calendar used to start at, full stop.
        // rightEdge (horizontal position only, unaffected by the
        // height bug above) still comes from DayShowcase's geometry.
        const layoutCfg = MiniCalendarLayout.cfg;
        const showcase  = DayShowcase.computeRect();
        return {
          top:       isPhoneVP() ? layoutCfg.topMobile : layoutCfg.top,
          height:    cfg.height,
          rightEdge: showcase.rightEdge,
        };
      }

      // Jumps straight to an arbitrary picked date: switches the
      // underlying month/year if needed (reusing the exact same
      // renderCalendar() path navigateMonth already relies on, so the
      // LOCKED-state rebuild+re-snap handles itself), then selects the
      // day exactly like clicking a mini-calendar cell would.
      function goToPickedDate(y, m, d) {
        if (y !== viewYear || m !== viewMonth) {
          viewYear = y;
          viewMonth = m;
          renderCalendar();
        }
        SelectedDayState.set(y, m, d);
      }

      // Now just the plain-text date readout (e.g. "August 3rd"),
      // living inside the persistent GlobalTopBar's merged Select-Day
      // button (id="lockedDateLabel" span inside #globalSelectDayBtn)
      // instead of a separately-positioned floating pill — so there's
      // nothing to build or position here anymore, just a reference
      // to grab. The button itself always opens the day picker,
      // whatever text it's currently showing.
      function ensureBuilt() {
        if (el) return;
        el = document.getElementById('lockedDateLabel');
        dateLabelEl = el;
      }

      function render() {
        ensureBuilt();
        if (!el) return;

        // "August 3rd" — plain text, no ordinal suffix for non-English
        // languages (see ordinalSuffix's own comment).
        const sel       = SelectedDayState.get();
        const dict      = I18N[settings.language] || I18N.en;
        const monthName = (dict.months || I18N.en.months)[sel.month];
        const suffix    = settings.language === 'lt' ? '' : ordinalSuffix(sel.day);
        dateLabelEl.textContent = monthName + ' ' + sel.day + suffix;
      }

      // Runs right after the existing prevMonth/nextMonth handlers'
      // renderCalendar() call. Those fresh cells have no FLIP
      // transform on them yet — this instantly (no transition) parks
      // each one on its mini-calendar target, exactly like
      // FlipAnimator.flyTo() but with duration 0, so a month switch
      // while LOCKED never shows a full-size flash.
      function snapCurrentCellsToMini() {
        const grid = document.getElementById('daysGrid');
        if (!grid) return;
        const cells = Array.from(grid.querySelectorAll('.day-cell:not(.empty)'));
        const { targets } = MiniCalendarLayout.computeTargets(viewYear, viewMonth);

        cells.forEach((cell) => {
          const numEl  = cell.querySelector('.day-num');
          const dayNum = numEl ? numEl.textContent : '';
          const lastRect = targets[dayNum];
          if (!lastRect) return;

          const firstRect = cell.getBoundingClientRect(); // fresh cell, still at its natural position
          const dx = lastRect.left - firstRect.left;
          const dy = lastRect.top  - firstRect.top;
          const scaleX = lastRect.width  / firstRect.width;
          const scaleY = lastRect.height / firstRect.height;

          cell.classList.add('flip-animating');
          cell.style.zIndex          = FlipAnimator.cfg.zIndexWhileFlying;
          cell.style.transformOrigin = '0 0';
          cell.style.transition      = 'none';
          cell.style.transform       = 'translate(' + dx + 'px, ' + dy + 'px) scale(' + scaleX + ', ' + scaleY + ')';
          FlipAnimator.animateToCircle(cell, scaleX, scaleY, 0);

          // Same "keep .day-num, hide everything else" rule as section 7's
          // TextFadeChoreography — applied instantly here since this is a
          // snap, not a flight.
          Array.from(cell.children).forEach((child) => {
            if (child.classList.contains('day-num')) return;
            child.style.transition = 'none';
            child.style.opacity = '0';
          });
        });

        render(); // keep the label in sync with the new month too
      }

      function init() {
        // Keep the "August 3rd" pill in sync with whichever day is
        // actually selected. render() (which sets dateLabelEl's text)
        // used to only get re-run from show() (entering LOCKED) and
        // snapCurrentCellsToMini() (switching months) — so picking a
        // different day within the SAME month, whether from the old
        // mini-calendar or the new DayPickerModal, changed
        // SelectedDayState but never re-ran render(), leaving the pill
        // stuck on whatever day it last showed. Now the button shows
        // the selected date in every view (Day, Week, and Month), not
        // just while LOCKED into the day view, so this re-runs render()
        // unconditionally on every change instead of gating it.
        //
        // SelectedDayState itself isn't declared until further down
        // the file, and this whole init() runs synchronously the
        // instant LockedMonthNav.init() is called (right after this
        // module's own IIFE, a few lines below) — so referencing
        // SelectedDayState directly here hits it mid-declaration
        // (TDZ) and throws "Cannot access 'SelectedDayState' before
        // initialization" the moment ANY event fires afterward.
        // Deferring the subscription itself (not what it does once
        // subscribed) past the current synchronous script run — a
        // plain setTimeout 0 — lets the rest of the script, including
        // SelectedDayState's own declaration, finish first. That same
        // deferral is also used to paint the button's initial text
        // (today's date) as soon as the page loads, instead of it
        // sitting on the static "Select Day" markup until the day
        // view is first opened.
        setTimeout(() => {
          render();
          SelectedDayState.onChange(render);
        }, 0);

        DayViewState.onChange((next) => {
          if (next === DayViewState.STATES.LOCKED) {
            requestAnimationFrame(() => requestAnimationFrame(() => {
              // The day-cells have already been correctly flown into
              // their mini-calendar targets by FlipAnimator (sections
              // 4-8) by the time we get here — that's the whole point
              // of the FLIP animation. Rebuilding the grid from scratch
              // (renderCalendar) and re-snapping was only ever meant as
              // a fallback for cases where the cells AREN'T already in
              // place (e.g. this LOCKED handler firing without a flight
              // having happened first) — doing it unconditionally every
              // time meant swapping in brand-new, plain DOM cells right
              // after the real ones had already settled, which showed
              // up as a quick flash back to the normal calendar before
              // snapping again. Only rebuild+snap when there's nothing
              // already flown to preserve.
              const alreadyFlown = document.querySelectorAll('#daysGrid .day-cell.flip-animating').length > 0;
              if (!alreadyFlown) {
                renderCalendar();
                snapCurrentCellsToMini();
              }
              render();
            }));
          }
        });


      }

      return { init, computeRect, snapCurrentCellsToMini, goToPickedDate };
    })();
    LockedMonthNav.init();
    // Back-compat alias — LockedHeaderCard (section 12) reads the nav's
    // target rect via this name.
    const MonthNavRelocate = { computeTarget: LockedMonthNav.computeRect };

    const DayPickerModal = (() => {
      let overlayEl = null;
      let calMonthLabel = null, calGridEl = null;
      let calYear = 0, calMonth = 0;

      function ensureBuilt() {
        if (overlayEl) return;

        overlayEl = document.createElement('div');
        overlayEl.className = 'repeat-days-overlay';

        const card = document.createElement('div');
        card.className = 'repeat-days-card';

        const title = document.createElement('div');
        title.className = 'repeat-days-title';
        title.textContent = 'Select Day';

        const calNav = document.createElement('div');
        calNav.className = 'repeat-days-cal-nav';

        const prevBtn = document.createElement('button');
        prevBtn.type = 'button';
        prevBtn.className = 'repeat-days-cal-nav-btn';
        prevBtn.setAttribute('aria-label', 'Previous month');
        prevBtn.textContent = '\u2039';
        prevBtn.addEventListener('click', () => navigate(-1));

        calMonthLabel = document.createElement('div');
        calMonthLabel.className = 'repeat-days-cal-month';

        const nextBtn = document.createElement('button');
        nextBtn.type = 'button';
        nextBtn.className = 'repeat-days-cal-nav-btn';
        nextBtn.setAttribute('aria-label', 'Next month');
        nextBtn.textContent = '\u203a';
        nextBtn.addEventListener('click', () => navigate(1));

        calNav.appendChild(prevBtn);
        calNav.appendChild(calMonthLabel);
        calNav.appendChild(nextBtn);

        const calWeekdays = document.createElement('div');
        calWeekdays.className = 'repeat-days-cal-weekdays';
        (t('weekdays') || ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']).forEach((label) => {
          const wd = document.createElement('div');
          wd.className = 'repeat-days-cal-weekday';
          wd.textContent = label;
          calWeekdays.appendChild(wd);
        });

        calGridEl = document.createElement('div');
        calGridEl.className = 'repeat-days-cal-grid';

        const actions = document.createElement('div');
        actions.className = 'repeat-days-actions';
        const cancelBtn = document.createElement('button');
        cancelBtn.type = 'button';
        cancelBtn.textContent = 'Cancel';
        cancelBtn.addEventListener('click', close);
        actions.appendChild(cancelBtn);

        card.appendChild(title);
        card.appendChild(calNav);
        card.appendChild(calWeekdays);
        card.appendChild(calGridEl);
        card.appendChild(actions);
        overlayEl.appendChild(card);
        document.body.appendChild(overlayEl);

        // Tapping the dimmed backdrop (not the card itself) cancels,
        // same convention as the repeat-days modal's own overlay.
        overlayEl.addEventListener('click', (e) => { if (e.target === overlayEl) close(); });
      }

      function navigate(delta) {
        calMonth += delta;
        if (calMonth < 0) { calMonth = 11; calYear--; }
        if (calMonth > 11) { calMonth = 0; calYear++; }
        render();
      }

      function render() {
        const dict = I18N[settings.language] || I18N.en;
        const monthName = (dict.months || I18N.en.months)[calMonth];
        calMonthLabel.textContent = monthName + ' ' + calYear;

        calGridEl.innerHTML = '';

        const todayDt    = new Date();
        const todayKey   = EventStore.dateKeyFor(todayDt.getFullYear(), todayDt.getMonth(), todayDt.getDate());
        const sel        = SelectedDayState.get();
        const selectedKey = EventStore.dateKeyFor(sel.year, sel.month, sel.day);

        const firstDow    = new Date(calYear, calMonth, 1).getDay();
        const firstIdx    = mondayIdx(firstDow);
        const daysInMonth = new Date(calYear, calMonth + 1, 0).getDate();

        for (let i = 0; i < firstIdx; i++) {
          const filler = document.createElement('div');
          filler.className = 'repeat-days-cal-cell empty';
          calGridEl.appendChild(filler);
        }

        for (let d = 1; d <= daysInMonth; d++) {
          const dateKey = EventStore.dateKeyFor(calYear, calMonth, d);
          const cell = document.createElement('div');
          cell.className = 'repeat-days-cal-cell';
          cell.textContent = String(d);
          if (dateKey === todayKey) cell.classList.add('today');
          if (dateKey === selectedKey) cell.classList.add('selected');
          const y = calYear, m = calMonth; // capture for the closure below
          cell.addEventListener('click', () => {
            close();
            // Behavior depends on whichever view was active when the
            // picker was opened:
            //  - Week view: just slides that week's scroll over to
            //    center the picked date (like "Go to current day")
            //    and leaves the week view open.
            //  - Day view: routed through GlobalTopBar.goToDay(),
            //    which lands you in the day view (a no-op transition-
            //    wise since you're already there).
            //  - Month view: routed through goToDateInMonthView()
            //    instead — navigates the grid to the picked month if
            //    it's different from what's showing, and shakes the
            //    picked day's cell, but never locks into the day view.
            if (typeof WeekView !== 'undefined' && WeekView.isOpen()) {
              WeekView.goToDate(y, m, d);
            } else if (typeof DayViewState !== 'undefined' && DayViewState.get() === DayViewState.STATES.LOCKED) {
              GlobalTopBar.goToDay(y, m, d);
            } else {
              GlobalTopBar.goToDateInMonthView(y, m, d);
            }
          });
          calGridEl.appendChild(cell);
        }
      }

      function open() {
        ensureBuilt();
        const sel = SelectedDayState.get();
        calYear  = sel.year;
        calMonth = sel.month;
        render();
        overlayEl.classList.add('open');
      }

      function close() {
        if (overlayEl) overlayEl.classList.remove('open');
      }

      return { open, close };
    })();

    const BirthdayPickerModal = (() => {
      let overlayEl = null;
      let calMonthLabel = null, calGridEl = null, yearlyToggle = null;
      let nameTextarea = null, saveBtn = null;
      let calYear = 0, calMonth = 0, selectedDay = null;
      let onSaveCb = null;

      function ensureBuilt() {
        if (overlayEl) return;

        overlayEl = document.createElement('div');
        overlayEl.className = 'repeat-days-overlay';

        const card = document.createElement('div');
        card.className = 'repeat-days-card birthday-picker-card';

        const title = document.createElement('div');
        title.className = 'repeat-days-title';
        title.textContent = 'Add Birthday';

        // Big name field up top — "a huge typing bar" — auto-grows as
        // you type (see autosizeName below), same idea as the sidebar
        // field it replaces, just with real room to breathe now that
        // it isn't squeezed next to a date field in a narrow sidebar.
        const nameLabel = document.createElement('div');
        nameLabel.className = 'birthday-name-label';
        nameLabel.textContent = 'Name';

        nameTextarea = document.createElement('textarea');
        nameTextarea.className = 'birthday-name-textarea';
        nameTextarea.placeholder = "e.g. Ben's birthday";
        nameTextarea.maxLength = 40;
        nameTextarea.rows = 1;
        nameTextarea.addEventListener('input', () => {
          autosizeName();
          refreshSaveEnabled();
        });
        // Enter submits instead of inserting a newline — names don't
        // need multiple lines.
        nameTextarea.addEventListener('keydown', (e) => {
          if (e.key === 'Enter') { e.preventDefault(); save(); }
        });

        const calNav = document.createElement('div');
        calNav.className = 'repeat-days-cal-nav';

        const prevBtn = document.createElement('button');
        prevBtn.type = 'button';
        prevBtn.className = 'repeat-days-cal-nav-btn';
        prevBtn.setAttribute('aria-label', 'Previous month');
        prevBtn.textContent = '\u2039';
        prevBtn.addEventListener('click', () => navigate(-1));

        calMonthLabel = document.createElement('div');
        calMonthLabel.className = 'repeat-days-cal-month';

        const nextBtn = document.createElement('button');
        nextBtn.type = 'button';
        nextBtn.className = 'repeat-days-cal-nav-btn';
        nextBtn.setAttribute('aria-label', 'Next month');
        nextBtn.textContent = '\u203a';
        nextBtn.addEventListener('click', () => navigate(1));

        calNav.appendChild(prevBtn);
        calNav.appendChild(calMonthLabel);
        calNav.appendChild(nextBtn);

        const calWeekdays = document.createElement('div');
        calWeekdays.className = 'repeat-days-cal-weekdays';
        (t('weekdays') || ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']).forEach((label) => {
          const wd = document.createElement('div');
          wd.className = 'repeat-days-cal-weekday';
          wd.textContent = label;
          calWeekdays.appendChild(wd);
        });

        calGridEl = document.createElement('div');
        calGridEl.className = 'repeat-days-cal-grid';

        const yearlyRow = document.createElement('div');
        yearlyRow.className = 'repeat-days-yearly-row';
        const yearlyLabel = document.createElement('div');
        yearlyLabel.className = 'repeat-days-yearly-label';
        yearlyLabel.textContent = 'Repeats every year';
        const yearlyToggleLabel = document.createElement('label');
        yearlyToggleLabel.className = 'birthdays-toggle';
        yearlyToggle = document.createElement('input');
        yearlyToggle.type = 'checkbox';
        yearlyToggle.checked = true;
        const yearlyToggleSlider = document.createElement('span');
        yearlyToggleSlider.className = 'birthdays-toggle-slider';
        yearlyToggleLabel.appendChild(yearlyToggle);
        yearlyToggleLabel.appendChild(yearlyToggleSlider);
        yearlyRow.appendChild(yearlyLabel);
        yearlyRow.appendChild(yearlyToggleLabel);

        const actions = document.createElement('div');
        actions.className = 'repeat-days-actions';
        const cancelBtn = document.createElement('button');
        cancelBtn.type = 'button';
        cancelBtn.textContent = 'Cancel';
        cancelBtn.addEventListener('click', close);
        saveBtn = document.createElement('button');
        saveBtn.type = 'button';
        saveBtn.className = 'primary';
        saveBtn.textContent = 'Add Birthday';
        saveBtn.disabled = true;
        saveBtn.addEventListener('click', save);
        actions.appendChild(cancelBtn);
        actions.appendChild(saveBtn);

        card.appendChild(title);
        card.appendChild(nameLabel);
        card.appendChild(nameTextarea);
        card.appendChild(calNav);
        card.appendChild(calWeekdays);
        card.appendChild(calGridEl);
        card.appendChild(yearlyRow);
        card.appendChild(actions);
        overlayEl.appendChild(card);
        document.body.appendChild(overlayEl);

        overlayEl.addEventListener('click', (e) => { if (e.target === overlayEl) close(); });
      }

      function autosizeName() {
        nameTextarea.style.height = 'auto';
        nameTextarea.style.height = nameTextarea.scrollHeight + 'px';
      }

      function refreshSaveEnabled() {
        saveBtn.disabled = !(nameTextarea.value.trim() && selectedDay);
      }

      function navigate(delta) {
        calMonth += delta;
        if (calMonth < 0) { calMonth = 11; calYear--; }
        if (calMonth > 11) { calMonth = 0; calYear++; }
        render();
      }

      function render() {
        const dict = I18N[settings.language] || I18N.en;
        const monthName = (dict.months || I18N.en.months)[calMonth];
        calMonthLabel.textContent = monthName + ' ' + calYear;

        calGridEl.innerHTML = '';

        const todayDt  = new Date();
        const isTodayMonth = todayDt.getFullYear() === calYear && todayDt.getMonth() === calMonth;

        const firstDow    = new Date(calYear, calMonth, 1).getDay();
        const firstIdx    = mondayIdx(firstDow);
        const daysInMonth = new Date(calYear, calMonth + 1, 0).getDate();

        for (let i = 0; i < firstIdx; i++) {
          const filler = document.createElement('div');
          filler.className = 'repeat-days-cal-cell empty';
          calGridEl.appendChild(filler);
        }

        for (let d = 1; d <= daysInMonth; d++) {
          const cell = document.createElement('div');
          cell.className = 'repeat-days-cal-cell';
          cell.textContent = String(d);
          if (isTodayMonth && d === todayDt.getDate()) cell.classList.add('today');
          if (selectedDay === d) cell.classList.add('selected');
          cell.addEventListener('click', () => {
            selectedDay = d;
            render();
            refreshSaveEnabled();
          });
          calGridEl.appendChild(cell);
        }
      }

      // Opens fresh every time (this is now always "add", not "edit" —
      // the sidebar's "+ Add Birthday" button is the only caller).
      function open({ onSave } = {}) {
        ensureBuilt();
        const now = new Date();
        calYear  = now.getFullYear();
        calMonth = now.getMonth();
        selectedDay = null;
        yearlyToggle.checked = true;
        nameTextarea.value = '';
        onSaveCb = onSave || null;
        render();
        autosizeName();
        refreshSaveEnabled();
        overlayEl.classList.add('open');
        // Focus after the open transition starts so mobile keyboards
        // don't fight the popup's entrance animation.
        setTimeout(() => nameTextarea.focus(), 50);
      }

      function save() {
        const name = nameTextarea.value.trim();
        if (!name || !selectedDay) return; // require both a name and a day pick
        const repeatYearly = yearlyToggle.checked;
        const month = calMonth + 1, day = selectedDay, year = calYear;
        close();
        if (onSaveCb) onSaveCb(name, month, day, year, repeatYearly);
      }

      function close() {
        if (overlayEl) overlayEl.classList.remove('open');
      }

      return { open, close };
    })();


    const SelectedDayState = (() => {
      const now = new Date();
      let year  = now.getFullYear();
      let month = now.getMonth();
      let day   = now.getDate();
      const listeners = [];

      function get() { return { year, month, day }; }

      function set(y, m, d) {
        if (y === year && m === month && d === day) return;
        year = y; month = m; day = d;
        listeners.forEach((fn) => fn(get()));
      }

      function onChange(fn) { listeners.push(fn); }

      return { get, set, onChange };
    })();

    // Registered here (rather than back in renderCalendar, where the
    // function itself lives) because SelectedDayState doesn't exist
    // yet at that point in the script — this runs after its const
    // declaration above, so the reference is safe.
    SelectedDayState.onChange(applyMiniDaySelectionHighlight);
    applyMiniDaySelectionHighlight(); // apply once for the initial render too

    const DayShowcase = (() => {
      const cfg = {
        gap:        28,   // px gap between the number's right edge and the mini-calendar's left edge
        heightFrac: 0.82, // number's font-size as a fraction of the mini-calendar's total height
        fadeMs:     0,
      };

      let el = null;
      let resizeHandler = null;
      let measureCanvas = null;

      // Width (px) of the widest a day number can ever be at the given
      // font size — i.e. two digits ("00".."99"), not whatever day
      // happens to be selected right now. Used to give the element a
      // fixed width instead of shrink-to-fit, so it (and anything sized
      // off of it, like LockedHeaderCard's white box) never has to grow
      // after the fact when the day changes from single- to double-digit.
      function maxDigitsWidth(fontSizePx) {
        if (!measureCanvas) measureCanvas = document.createElement('canvas');
        const ctx = measureCanvas.getContext('2d');
        ctx.font = '800 ' + fontSizePx + 'px -apple-system, BlinkMacSystemFont, "Segoe UI", system-ui, sans-serif';
        // Widest 2-digit pair — digit widths are equal in most system
        // sans fonts (tabular figures), but measure the actual widest
        // one rather than assume, since that varies by font.
        let widest = 0;
        for (let d = 0; d <= 9; d++) {
          widest = Math.max(widest, ctx.measureText(String(d) + String(d)).width);
        }
        return widest;
      }

      // Pure geometry, no DOM required — lets other modules (section 11's
      // month-nav) position themselves relative to the showcase without
      // depending on whether its element has actually been built/shown yet.
      function computeRect() {
        const layoutCfg   = MiniCalendarLayout.cfg;
        const container   = MiniCalendarLayout.computeContainerRect();
        const headerGap   = isPhoneVP() ? layoutCfg.headerGapMobile : layoutCfg.headerGap;
        const totalHeight = layoutCfg.headerHeight + headerGap + container.height;
        return {
          top:       isPhoneVP() ? layoutCfg.topMobile : layoutCfg.top,
          height:    totalHeight,
          rightEdge: container.left - cfg.gap, // showcase's own right boundary, viewport-left-relative px
        };
      }

      function ensureBuilt() {
        if (el) return;
        el = document.createElement('div');
        el.id = 'dayShowcase';
        el.style.cssText =
          'position:absolute;z-index:520;pointer-events:none;opacity:0;' +
          'transition:opacity ' + cfg.fadeMs + 'ms ease;' +
          'display:flex;align-items:center;justify-content:flex-end;' +
          'font-weight:800;line-height:1;letter-spacing:-1px;' +
          'font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",system-ui,sans-serif;';
        document.body.appendChild(el);
      }

      // Reads the same weekday-row + day-grid dimensions the
      // mini-calendar itself uses, so "the exact size of the
      // mini-calendar" (per the spec) stays true even if
      // MiniCalendarLayout.cfg is ever tuned later.
      function render() {
        ensureBuilt();
        const rect     = computeRect();
        const isNight  = document.body.classList.contains('night-mode');
        const fontSize = rect.height * cfg.heightFrac;

        el.style.top      = (rect.top + LockedViewAnchor.get()) + 'px';
        el.style.height   = rect.height + 'px';
        el.style.right    = (window.innerWidth - rect.rightEdge) + 'px';
        el.style.width    = maxDigitsWidth(fontSize) + 'px'; // fixed, not shrink-to-fit — see maxDigitsWidth
        el.style.fontSize = fontSize + 'px';
        el.style.color    = isNight ? '#f5f5f5' : '#111';
        el.textContent    = String(SelectedDayState.get().day);
      }

      function show() {
        render();
        requestAnimationFrame(() => { if (el) el.style.opacity = '1'; });
        if (!resizeHandler) {
          // Same resize-safe pattern as the rest of this feature — only
          // re-renders while actually visible.
          resizeHandler = () => { if (el && el.style.opacity === '1') render(); };
          window.addEventListener('resize', resizeHandler);
        }
      }

      function hide() {
        if (!el) return;
        el.style.opacity = '0';
      }

      function init() {
        DayViewState.onChange((next) => {
          if (next === DayViewState.STATES.LOCKED) {
            show();
          } else {
            hide();
          }
        });
        // Keeps the number in sync if it's already showing when the
        // selection changes (only matters once section 12 exists —
        // harmless no-op cost until then, since nothing calls .set()
        // besides this module's own default yet).
        SelectedDayState.onChange(() => {
          if (el && el.style.opacity === '1') render();
        });
      }

      // Live bounding box of the actual rendered element (only meaningful
      // once ensureBuilt()/render() have run) — more reliable than
      // re-deriving the number's true width from computeRect() alone.
      // The box has a fixed width (see maxDigitsWidth — always room for
      // two digits, single digits just right-align within it via flex
      // justify-end), pinned via `right`, so this rect is stable across
      // day changes rather than needing to be re-measured each time.
      function getRect() { return el ? el.getBoundingClientRect() : null; }

      return { init, computeRect, getRect };
    })();
    // NOT calling DayShowcase.init() anymore — the giant single-digit
    // number it used to show/hide has been replaced by the plain-text
    // date label built into LockedMonthNav, directly above the Select
    // Day button. Left un-initialized (rather than deleted) because
    // LockedHeaderCard and LockedMonthNav still call DayShowcase.getRect()
    // / .computeRect() as their geometry source for the white card box
    // and panel width — with el never built, getRect() always returns
    // null and both callers already fall back to the pure computeRect()
    // prediction, so removing the visible showcase doesn't change their
    // math at all.

    const LockedHeaderCard = (() => {
      const cfg = { padding: 20, fadeMs: 0 };
      let el = null;

      function ensureBuilt() {
        if (el) return;
        el = document.createElement('div');
        el.id = 'lockedHeaderCard';
        el.className = 'locked-header-card';
        document.body.appendChild(el);
      }

      function computeRect() {
        const container  = MiniCalendarLayout.computeContainerRect();
        const showcaseBox = DayShowcase.getRect();
        const navTarget   = MonthNavRelocate.computeTarget();

        const gridRight  = container.left + container.width;

        // Prefer the REAL rendered bottom of the last day-cell over
        // the theoretical one MiniCalendarLayout predicts. This card
        // (and DayTimeGrid, which builds its own top from this card's
        // bottom edge) exists to reserve space for whatever's
        // actually on screen — a small prediction/reality mismatch
        // here (font metrics, sub-pixel rounding, etc. can differ by
        // device) is exactly what let the hour grid start overlapping
        // the mini-calendar's last rows. Falls back to the prediction
        // if the cells haven't rendered yet.
        let gridBottom = container.top + container.height;
        const cells = document.querySelectorAll('#daysGrid .day-cell:not(.empty)');
        if (cells.length) {
          let measuredBottom = 0;
          cells.forEach((c) => {
            measuredBottom = Math.max(measuredBottom, c.getBoundingClientRect().bottom);
          });
          if (measuredBottom > 0) gridBottom = measuredBottom;
        }

        const navBottom  = navTarget.top + navTarget.height;
        // Fallback estimate for the showcase's left edge in case it
        // hasn't rendered yet (shouldn't normally happen — DayShowcase
        // is shown before this card, see init() below).
        const showcaseLeft = showcaseBox ? showcaseBox.left : (container.left - 28 - 150);

        const top    = isPhoneVP() ? MiniCalendarLayout.cfg.topMobile : MiniCalendarLayout.cfg.top;
        const bottom = Math.max(gridBottom, navBottom);

        return {
          left:   showcaseLeft - cfg.padding,
          top:    top - cfg.padding,
          width:  (gridRight - showcaseLeft) + cfg.padding * 2,
          height: (bottom - top) + cfg.padding * 2,
        };
      }

      function render() {
        ensureBuilt();
        const r = computeRect();
        const isNight = document.body.classList.contains('night-mode');
        el.style.left   = r.left + 'px';
        el.style.top    = (r.top + LockedViewAnchor.get()) + 'px';
        el.style.width  = r.width + 'px';
        el.style.height = r.height + 'px';
        el.classList.toggle('night', isNight);
      }

      let resizeHandler = null;
      function show() {
        render();
        requestAnimationFrame(() => { if (el) el.style.opacity = '1'; });
        if (!resizeHandler) {
          resizeHandler = () => { if (el && el.style.opacity === '1') render(); };
          window.addEventListener('resize', resizeHandler);
        }
      }

      function hide() {
        if (el) el.style.opacity = '0';
      }

      function init() {
        DayViewState.onChange((next) => {
          if (next === DayViewState.STATES.LOCKED) {
            // Double rAF: wait a frame so DayShowcase/MonthNavRelocate
            // have already rendered/settled at their real positions
            // (both also react to the same LOCKED transition) before
            // this measures them.
            requestAnimationFrame(() => requestAnimationFrame(show));
          } else {
            hide();
          }
        });
      }

      return { init, computeRect };
    })();
    // NOT calling LockedHeaderCard.init() anymore — this white rounded
    // box was sized to wrap the old giant-number + mini-calendar panel.
    // Now that the giant number is gone (replaced by the small plain-
    // text date label in LockedMonthNav), that same box is mostly empty
    // dead space sitting behind a small line of text and a button —
    // the "fatass box" complaint. Leaving el un-built means it's never
    // shown at all now. computeRect() is left untouched and still
    // callable on its own (it doesn't read `el`) since DayTimeGrid
    // (section below) still positions itself off this card's bottom edge.

    const SyncIndicator = (() => {
      let el = null, textEl = null, undoBtn = null;
      let hideTimer = null;
      function ensure() {
        if (!el) {
          el = document.getElementById('syncIndicator');
          textEl = document.getElementById('syncIndicatorText');
          undoBtn = document.getElementById('syncUndoBtn');
        }
      }
      function hideUndo() {
        if (!undoBtn) return;
        undoBtn.classList.remove('show');
        el.classList.remove('with-undo');
      }
      function syncing() {
        ensure(); if (!el) return;
        clearTimeout(hideTimer);
        el.className = 'sync-indicator show syncing';
        textEl.textContent = 'Syncing…';
        hideUndo();
      }
      // Shows "Synced" for 1 second (2.5s when there's an Undo pill
      // riding along with it, so there's actually time to read and
      // tap it), then fades itself back out — a fresh syncing()/
      // synced() call before that timer fires just restarts it, so
      // back-to-back batches never get cut off mid-display. The Undo
      // pill is tied to this same hideTimer so they always disappear
      // together — it surviving past its sync message would be
      // confusing about what it's undoing.
      function synced(canUndo) {
        ensure(); if (!el) return;
        clearTimeout(hideTimer);
        el.className = 'sync-indicator show synced' + (canUndo ? ' with-undo' : '');
        textEl.textContent = 'Synced';
        if (canUndo && undoBtn) undoBtn.classList.add('show');
        else hideUndo();
        hideTimer = setTimeout(() => {
          el.classList.remove('show');
          hideUndo();
        }, canUndo ? 2500 : 1000);
      }
      function error() {
        ensure(); if (!el) return;
        clearTimeout(hideTimer);
        el.className = 'sync-indicator show error';
        textEl.textContent = 'Sync failed — retrying';
        hideUndo();
      }
      function bindUndo(handler) {
        ensure(); if (!undoBtn) return;
        undoBtn.addEventListener('click', () => {
          hideUndo();
          clearTimeout(hideTimer);
          el.classList.remove('show');
          handler();
        });
      }
      return { syncing, synced, error, bindUndo };
    })();

    const EventStore = (() => {
      const SYNC_IDLE_MS = 1000; // wait 1s of no further edits anywhere before syncing,
                                  // so a change doesn't fire a request the instant it
                                  // happens — still short enough that a fresh syncTimer
                                  // from the next edit is what keeps pushing it back.
      const byDate = new Map();  // dateKey -> array of live record objects (with .el once rendered)
      const dirtyDates = new Set();
      let serverCache = null;    // dateKey -> array of plain (serialized) events, once loaded
      let loadPromise = null;
      let syncTimer = null;
      let lastUndo = null;       // { dates: [dateKey...], previous: {dateKey: [plain events]} } for the most recent synced batch

      function genId() {
        if (window.crypto && crypto.randomUUID) return crypto.randomUUID();
        return 'ev_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 8);
      }

      function dateKeyFor(year, month, day) {
        return year + '-' + String(month + 1).padStart(2, '0') + '-' + String(day).padStart(2, '0');
      }

      function selectedDateKey() {
        const sel = SelectedDayState.get();
        return dateKeyFor(sel.year, sel.month, sel.day);
      }

      // Strips the DOM element (and anything else non-persistable)
      // before sending it out — `el` is rebuilt fresh whenever a
      // day's events get rendered (step 15), never itself serialized.
      function serialize(record) {
        return {
          id: record.id,
          startMinutes: record.startMinutes,
          durationMinutes: record.durationMinutes,
          type: record.type || '',
          color: record.color || '',
          description: record.description || '',
          manualLeftUnits: record.manualLeftUnits != null ? record.manualLeftUnits : null,
          manualWidthUnits: record.manualWidthUnits != null ? record.manualWidthUnits : null,
          notify: !!record.notify,
          locked: !!record.locked,
        };
      }

      // Kicked off once, immediately, the moment this module loads —
      // by the time the person actually scrolls into the mini-
      // calendar (the 1-2s lock-in animation), this has almost
      // always already resolved.
      function loadFromServer() {
        if (loadPromise) return loadPromise;
        loadPromise = (async () => {
          try {
            const r = await fetch('/api/events', { cache: 'no-store' });
            serverCache = r.ok ? await r.json() : {};
          } catch {
            serverCache = {};
          }
        })();
        return loadPromise;
      }
      setTimeout(loadFromServer, 1500); // idempotent: whenReady() triggers it sooner if needed

      // Resolves once the initial server load has finished (or
      // failed) — used only by the notification-restore step below,
      // which needs every date up front rather than lazily per-date.
      function whenReady() {
        return loadPromise || loadFromServer();
      }

      // Throws away every in-memory record (detaching any DOM box
      // still attached to one first, so nothing orphaned is left
      // sitting in the page) and re-fetches everything from the
      // server from scratch — used by Day/Week view every time they
      // open, so what's on screen is never trusting anything already
      // sitting in memory from a previous render. Flushes any pending
      // unsynced edit first so a change made just before switching
      // views never gets silently discarded by the reload.
      async function reloadFromServer() {
        await flushNow();
        byDate.forEach((list) => list.forEach((record) => {
          if (record.el) { record.el.remove(); record.el = null; }
        }));
        byDate.clear();
        serverCache = null;
        loadPromise = null;
        return loadFromServer();
      }

      // Everything currently known, server dates merged with
      // whatever's live in memory (covers dates touched this session
      // that haven't necessarily round-tripped yet).
      function getAllSnapshot() {
        const out = Object.assign({}, serverCache || {});
        byDate.forEach((list, dateKey) => { out[dateKey] = list.map(serialize); });
        return out;
      }

      // Hydrates the in-memory list for a date from the server
      // snapshot the first time it's touched, then hands back that
      // same live array on every subsequent call — callers push/
      // splice it directly rather than going through setters.
      function getForDate(dateKey) {
        if (!byDate.has(dateKey)) {
          const cached = (serverCache && serverCache[dateKey]) || [];
          byDate.set(dateKey, cached.map((c) => Object.assign({ dateKey, el: null }, c)));
        }
        return byDate.get(dateKey);
      }

      function markDirty(dateKey) {
        dirtyDates.add(dateKey);
        clearTimeout(syncTimer);
        syncTimer = setTimeout(flushDirty, SYNC_IDLE_MS);
      }

      async function flushDirty() {
        if (dirtyDates.size === 0) return;
        const dates = Array.from(dirtyDates);
        dirtyDates.clear();

        const entries = {};
        dates.forEach((dk) => { entries[dk] = getForDate(dk).map(serialize); });

        // Snapshot what these dates looked like *before* this batch,
        // straight from serverCache (the last state we actually
        // confirmed with D1) — that's exactly what "undo" needs to
        // restore to. Taken before the try block so a failed sync
        // never clobbers the previous undo point.
        const previous = {};
        dates.forEach((dk) => { previous[dk] = (serverCache && serverCache[dk]) || []; });

        SyncIndicator.syncing();
        try {
          const r = await fetch('/api/events', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ entries }),
          });
          if (!r.ok) throw new Error('Sync failed: ' + r.status);

          serverCache = serverCache || {};
          dates.forEach((dk) => { serverCache[dk] = entries[dk]; });
          lastUndo = { dates, previous };
          SyncIndicator.synced(true);
        } catch {
          // Put the dates back so the next edit (or this retry) picks
          // them up again instead of silently losing the change.
          dates.forEach((dk) => dirtyDates.add(dk));
          SyncIndicator.error();
          clearTimeout(syncTimer);
          syncTimer = setTimeout(flushDirty, SYNC_IDLE_MS);
        }
      }

      // Reverts the most recently synced batch: pushes the pre-batch
      // state back to D1, swaps it into serverCache/byDate, then asks
      // DayTimeGrid to repaint whichever of those dates is currently
      // open so the boxes visually snap back right away.
      //
      // The network revert and the on-screen repaint are handled as
      // two separate steps on purpose: once the server has confirmed
      // the revert, that's a *done* undo no matter what — a hiccup
      // repainting the day view must never be reported back as a
      // failed sync (it isn't one), so it's caught and logged on its
      // own instead of falling into the same catch as the fetch.
      async function undoLast() {
        const undo = lastUndo;
        if (!undo) return;
        lastUndo = null;
        clearTimeout(syncTimer); // a pending debounced flush from an in-progress edit could otherwise fire right after and re-apply what we're about to undo

        const entries = {};
        undo.dates.forEach((dk) => { entries[dk] = undo.previous[dk] || []; });

        SyncIndicator.syncing();

        let r;
        try {
          r = await fetch('/api/events', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ entries }),
          });
        } catch {
          r = null;
        }

        if (!r || !r.ok) {
          lastUndo = undo; // put it back so the person can retry
          SyncIndicator.error();
          return;
        }

        serverCache = serverCache || {};
        undo.dates.forEach((dk) => {
          const prevList = undo.previous[dk] || [];
          serverCache[dk] = prevList;
          byDate.set(dk, prevList.map((c) => Object.assign({ dateKey: dk, el: null }, c)));
          dirtyDates.delete(dk);
        });

        try {
          // An editor box open on a record that just got reverted out
          // from under it would otherwise keep writing through a now-
          // stale reference — drop it before repainting.
          if (typeof EventEditor !== 'undefined' && EventEditor.forgetCurrent) EventEditor.forgetCurrent();
          if (typeof DayTimeGrid !== 'undefined' && DayTimeGrid.forceRerenderDate) {
            undo.dates.forEach((dk) => DayTimeGrid.forceRerenderDate(dk));
          }
          if (typeof renderCalendar === 'function') renderCalendar();
        } catch (uiErr) {
          // The undo itself is already confirmed and correct at this
          // point — only the repaint hiccuped. Log it rather than
          // hide it, but don't tell the person the undo failed.
          console.error('Undo succeeded but repainting the view failed:', uiErr);
        }

        SyncIndicator.synced(false);
      }

      // Sends whatever's dirty right away, skipping the 4s wait —
      // used when the mini-calendar is exited so a change made just
      // before closing it doesn't sit unsynced.
      function flushNow() {
        clearTimeout(syncTimer);
        return flushDirty();
      }

      function create(dateKey, startMinutes, durationMinutes) {
        const record = {
          id: genId(),
          dateKey,
          startMinutes,
          durationMinutes,
          type: '',
          color: '',
          description: '',
          manualLeftUnits: null,
          manualWidthUnits: null,
          notify: false,
          locked: false,
          el: null,
        };
        getForDate(dateKey).push(record);
        markDirty(dateKey);
        return record;
      }

      // Marks the record's date dirty and (re)starts the SYNC_IDLE_MS
      // timer — every edit, discrete or continuous, waits out the
      // same 1s idle window before actually syncing.
      function save(record) {
        if (!record || !record.dateKey) return;
        markDirty(record.dateKey);
      }

      function remove(record) {
        if (!record || !record.dateKey) return;
        const list = getForDate(record.dateKey);
        const idx = list.indexOf(record);
        if (idx !== -1) list.splice(idx, 1);
        markDirty(record.dateKey);
      }

      return {
        dateKeyFor, selectedDateKey, getForDate, create, save, remove,
        whenReady, getAllSnapshot, flushNow, undoLast, reloadFromServer,
      };
    })();

    SyncIndicator.bindUndo(() => EventStore.undoLast());

    // A record only ever has ONE live box in the DOM at a time — but
    // that box can be mounted by either DayTimeGrid (the single-day
    // mini calendar) or the week view, and nothing was clearing
    // record.el when a record handed off from one to the other. The
    // result: after a box got created/rendered in the week view,
    // opening that same day in the mini calendar saw record.el
    // already set (pointing at the week view's now-hidden box) and
    // skipped painting anything at all — the event silently
    // disappeared from the day view. Both renderers now call this
    // first, whenever they're about to mount a record's box
    // themselves, so a box left over from the OTHER renderer gets
    // torn down (and its cached inline editor, which is just as
    // stale since it's built as a child of that old box) before the
    // new one goes up.
    function detachRecordBox(record) {
      if (!record || !record.el) return;
      record.el.remove();
      record.el = null;
      record._editor = null;
    }

    // The debounced sync only ever fires from mini-calendar edits, so
    // make sure any pending batch goes out the instant the mini-
    // calendar (LOCKED) is left, rather than possibly waiting up to
    // 4s in a state where nothing left will prompt another edit to
    // naturally trigger it.
    DayViewState.onChange((next, prev) => {
      if (prev === DayViewState.STATES.LOCKED && next !== DayViewState.STATES.LOCKED) {
        EventStore.flushNow();
      }
    });

    const BoxClipboard = (() => {
      let copied = null;

      function set(record) {
        if (!record) return;
        copied = {
          type: record.type || '',
          color: record.color || '',
          description: record.description || '',
          durationMinutes: record.durationMinutes,
          manualLeftUnits: record.manualLeftUnits != null ? record.manualLeftUnits : null,
          manualWidthUnits: record.manualWidthUnits != null ? record.manualWidthUnits : null,
          notify: !!record.notify,
          locked: !!record.locked,
        };
      }

      function get() { return copied; }
      function has() { return !!copied; }

      return { set, get, has };
    })();

    const DayTimeGrid = (() => {
      const cfg = {
        hourHeight: 76,  // px per hour — roughly 2cm, per feedback (was 38 / ~1cm)
        fadeMs:     420, // must match the CSS transform transition duration below
      };

      let el = null;
      let innerEl = null;
      let resizeHandler = null;
      let nowLineEl = null;
      let nowDotEl = null;
      let nowTimer = null;
      let holdIndicatorEl = null;
      let hourLineEls = [];
      let hourLabelEls = [];

      // Builds the 24 hour lines + labels ONCE — this is static
      // content (00:00–24:00 never changes), so there's no reason to
      // rebuild it on every render()/resize like the rect-based
      // pieces above do.
      function buildHours() {
        innerEl = document.createElement('div');
        innerEl.className = 'day-time-grid-inner';
        innerEl.style.height = (cfg.hourHeight * 24) + 'px';

        // CSS (-webkit-touch-callout / user-select: none) handles this
        // on most browsers, but some mobile browsers still fire a
        // native text-selection/context callout on a long-press
        // regardless — these two are a belt-and-suspenders JS backstop
        // so the hold-to-create/drag gesture never gets hijacked into
        // "Select / Copy / Share".
        innerEl.addEventListener('selectstart', (e) => e.preventDefault());

        const frag = document.createDocumentFragment();
        hourLineEls = [];  // index h -> the line element at hour h (0..24)
        hourLabelEls = []; // index h -> the label element at hour h (0..23)
        for (let h = 0; h <= 24; h++) {
          const y = h * cfg.hourHeight;

          // Line at every hour, including a final one at 24:00 so the
          // last hour (23:00) is visibly bounded too.
          const line = document.createElement('div');
          line.className = 'day-time-grid-hour-line';
          line.style.top = y + 'px';
          frag.appendChild(line);
          hourLineEls[h] = line;

          // No label on the trailing 24:00 line — 23 is the last hour
          // that needs a number.
          if (h < 24) {
            const label = document.createElement('div');
            label.className = 'day-time-grid-hour-label';
            label.style.top = y + 'px';
            label.textContent = String(h).padStart(2, '0');
            frag.appendChild(label);
            hourLabelEls[h] = label;
          }
        }
        innerEl.appendChild(frag);

        // Current-time indicator (step 3) — built once here alongside
        // the static hour lines, but its top/visibility are dynamic
        // (see updateNowLine) rather than set at build time.
        nowLineEl = document.createElement('div');
        nowLineEl.className = 'day-time-grid-now-line';
        nowDotEl = document.createElement('div');
        nowDotEl.className = 'day-time-grid-now-dot';
        innerEl.appendChild(nowLineEl);
        innerEl.appendChild(nowDotEl);

        holdIndicatorEl = document.createElement('div');
        holdIndicatorEl.className = 'day-time-grid-hold-indicator';
        innerEl.appendChild(holdIndicatorEl);

        el.appendChild(innerEl);
      }

      // Only meaningful while the grid is actually showing today's
      // date — SelectedDayState (see section 12, already in the file)
      // is the single source of truth for which date is locked open,
      // so that's what decides whether the red bar should be visible
      // at all, same as real Google Calendar only drawing it on the
      // current day's column.
      function isViewingToday() {
        const sel = SelectedDayState.get();
        const now = new Date();
        return sel.year === now.getFullYear() &&
               sel.month === now.getMonth() &&
               sel.day === now.getDate();
      }

      function updateNowLine() {
        if (!nowLineEl || !nowDotEl) return;
        if (!isViewingToday()) {
          nowLineEl.style.display = 'none';
          nowDotEl.style.display = 'none';
          return;
        }
        const now = new Date();
        const minutesIntoDay = now.getHours() * 60 + now.getMinutes() + now.getSeconds() / 60;
        const y = (minutesIntoDay / 60) * cfg.hourHeight;
        nowLineEl.style.top = y + 'px';
        nowDotEl.style.top = y + 'px';
        nowLineEl.style.display = 'block';
        nowDotEl.style.display = 'block';
      }

      function startNowTimer() {
        stopNowTimer();
        updateNowLine();
        // 30s is frequent enough that the bar never looks stale, cheap
        // enough not to matter while the grid is visible.
        nowTimer = setInterval(updateNowLine, 30000);
      }

      // Mirrors WeekView's scrollToRelevantHour(): only meaningful when
      // the locked day is actually today (see isViewingToday) — there's
      // no red bar to line up with on any other date, so this is a
      // no-op then and the page just opens at its default scroll spot.
      // Computes the grid's real top the same way render() does
      // (computeRect() + LockedViewAnchor.get()) rather than reading
      // el.getBoundingClientRect(), because show() still has the
      // slide-up transform applied at the moment this needs to run —
      // that transform would throw off a getBoundingClientRect() read.
      function scrollToNow() {
        if (!isViewingToday()) return;
        const r = computeRect();
        const gridTop = r.top + LockedViewAnchor.get();
        const now = new Date();
        // Same "2 hours of headroom above the current time" convention
        // as the week view, so Day and Week open on a consistent spot.
        const targetHour = Math.max(0, now.getHours() - 2);
        window.scrollTo(0, gridTop + targetHour * cfg.hourHeight);
      }

      function stopNowTimer() {
        if (nowTimer) { clearInterval(nowTimer); nowTimer = null; }
      }

      const holdCfg = {
        HOLD_MS:        420,  // press duration required to commit
        MOVE_CANCEL_PX: 10,   // pointer drift past this cancels the hold
        SNAP_MIN:       60,   // start time snaps to the nearest hour
        CONFIRM_MS:     260,  // how long the "confirmed" flash stays before fading
      };
      let holdTimer     = null;
      let holdPointerId = null;
      let holdStartX    = 0;
      let holdStartY    = 0;
      const createListeners = [];
      function onHoldCreate(fn) { createListeners.push(fn); }

      function minutesFromClientY(clientY) {
        const rect = innerEl.getBoundingClientRect();
        const localY = clientY - rect.top;
        const rawMinutes = (localY / cfg.hourHeight) * 60;
        const snapped = Math.round(rawMinutes / holdCfg.SNAP_MIN) * holdCfg.SNAP_MIN;
        return Math.max(0, Math.min(24 * 60 - holdCfg.SNAP_MIN, snapped));
      }

      // Paste position gets its own 15-minute snap, independent of
      // holdCfg.SNAP_MIN (which is 60 — hourly — and is only meant
      // for the hold-to-create gesture's indicator box). Reusing that
      // constant here made right-click paste jump to the nearest
      // hour instead of landing under the cursor.
      const PASTE_SNAP_MIN = 15;
      function pasteMinutesFromClientY(clientY) {
        const rect = innerEl.getBoundingClientRect();
        const localY = clientY - rect.top;
        const rawMinutes = (localY / cfg.hourHeight) * 60;
        const snapped = Math.round(rawMinutes / PASTE_SNAP_MIN) * PASTE_SNAP_MIN;
        return Math.max(0, Math.min(24 * 60 - PASTE_SNAP_MIN, snapped));
      }

      function positionHoldIndicator(minutes) {
        const top    = (minutes / 60) * cfg.hourHeight;
        const height = (holdCfg.SNAP_MIN / 60) * cfg.hourHeight;
        holdIndicatorEl.style.top    = top + 'px';
        holdIndicatorEl.style.height = height + 'px';
      }

      let pasteMenuEl = null;
      let pasteMenuMinutes = 0;

      function buildPasteMenu() {
        pasteMenuEl = document.createElement('div');
        pasteMenuEl.className = 'day-time-grid-paste-menu';

        const item = document.createElement('button');
        item.type = 'button';
        item.className = 'day-time-grid-paste-menu-item';
        item.textContent = 'Paste';
        item.addEventListener('click', (e) => {
          e.stopPropagation();
          hidePasteMenu();
          pasteBoxAt(pasteMenuMinutes);
        });

        const closeBtn = document.createElement('button');
        closeBtn.type = 'button';
        closeBtn.className = 'day-time-grid-paste-menu-close';
        closeBtn.setAttribute('aria-label', 'Close');
        closeBtn.textContent = '\u2715';
        closeBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          hidePasteMenu();
        });

        pasteMenuEl.appendChild(item);
        pasteMenuEl.appendChild(closeBtn);
        document.body.appendChild(pasteMenuEl);
      }

      function hidePasteMenu() {
        if (pasteMenuEl) pasteMenuEl.classList.remove('open');
        document.removeEventListener('pointerdown', onOutsidePasteMenu, true);
        window.removeEventListener('scroll', hidePasteMenu, true);
      }

      function onOutsidePasteMenu(e) {
        if (pasteMenuEl && !pasteMenuEl.contains(e.target)) hidePasteMenu();
      }

      function showPasteMenu(clientX, clientY, minutes) {
        if (!pasteMenuEl) buildPasteMenu();
        pasteMenuMinutes = minutes;
        pasteMenuEl.style.left = clientX + 'px';
        pasteMenuEl.style.top  = clientY + 'px';
        pasteMenuEl.classList.add('open');

        // Width/height are unknown until it's actually laid out, so
        // the on-screen clamp (keeps it from running off a narrow
        // phone screen near the right/bottom edge) happens next frame.
        requestAnimationFrame(() => {
          if (!pasteMenuEl) return;
          const rect = pasteMenuEl.getBoundingClientRect();
          const maxLeft = window.innerWidth - rect.width - 8;
          const maxTop  = window.innerHeight - rect.height - 8;
          if (rect.left > maxLeft) pasteMenuEl.style.left = Math.max(8, maxLeft) + 'px';
          if (rect.top  > maxTop)  pasteMenuEl.style.top  = Math.max(8, maxTop) + 'px';
        });

        // Deferred so the very pointerdown that opened this (a right-
        // click can fire one on some browsers) doesn't instantly
        // count as "outside" and close it again.
        setTimeout(() => {
          document.addEventListener('pointerdown', onOutsidePasteMenu, true);
          window.addEventListener('scroll', hidePasteMenu, true);
        }, 0);
      }

      function handleGridContextMenu(e) {
        // Right-clicking directly on an existing box is left alone —
        // its own controls (or a future box-specific menu) should
        // get that click, not the grid's paste popup. Everywhere
        // else on the grid (empty track, hour lines, hour labels,
        // the now-line, etc.) is fair game.
        if (e.target.closest && e.target.closest('.day-time-grid-event-box')) return;
        // Nothing copied yet — the browser's own menu is still
        // swallowed (that always happens, see the listener above),
        // there's just nothing of ours to show instead.
        if (!BoxClipboard.has()) return;
        const minutes = pasteMinutesFromClientY(e.clientY);
        showPasteMenu(e.clientX, e.clientY, minutes);
      }

      // Drops a full copy of BoxClipboard's saved box onto the
      // currently-open day at `startMinutes` — mirrors paintEventBox
      // further down (used for persisted/AI-created boxes) rather
      // than spawnEventBox just below, since a pasted box already has
      // all its content and shouldn't pop the editor open the way a
      // brand-new blank box does.
      function pasteBoxAt(startMinutes) {
        const copied = BoxClipboard.get();
        if (!copied) return;

        const dateKey = EventStore.selectedDateKey();
        const durationMinutes = copied.durationMinutes || holdCfg.SNAP_MIN;
        const record = EventStore.create(dateKey, startMinutes, durationMinutes);
        record.type              = copied.type;
        record.color             = copied.color;
        record.description       = copied.description;
        record.manualLeftUnits   = copied.manualLeftUnits;
        record.manualWidthUnits  = copied.manualWidthUnits;
        record.notify            = copied.notify;
        record.locked            = copied.locked;

        paintEventBox(record, { animate: true });
        recomputeOverlapLayout();
        if (record.notify) NotificationScheduler.schedule(record);
        toast('Pasted.');
      }

      function beginHoldVisual(minutes) {
        holdIndicatorEl.classList.remove('confirmed');
        positionHoldIndicator(minutes);
        // No transition yet on this frame, so the jump to opacity:0
        // (in case a previous hold left it fading) is instant...
        holdIndicatorEl.style.transition = 'none';
        holdIndicatorEl.style.opacity = '0';
        // eslint-disable-next-line no-unused-expressions
        holdIndicatorEl.offsetHeight; // force reflow
        // ...then the fill-in to opacity:1 is animated over exactly
        // the hold duration, so the indicator itself IS the progress
        // cue — no separate progress bar needed.
        holdIndicatorEl.style.transition = 'opacity ' + holdCfg.HOLD_MS + 'ms linear';
        holdIndicatorEl.style.opacity = '1';
      }

      function cancelHoldVisual() {
        holdIndicatorEl.style.transition = 'opacity 140ms ease';
        holdIndicatorEl.style.opacity = '0';
        holdIndicatorEl.classList.remove('confirmed');
      }

      function confirmHoldVisual() {
        holdIndicatorEl.style.transition = 'opacity 120ms ease';
        holdIndicatorEl.style.opacity = '1';
        holdIndicatorEl.classList.add('confirmed');
        setTimeout(() => {
          holdIndicatorEl.style.transition = 'opacity 220ms ease';
          holdIndicatorEl.style.opacity = '0';
          holdIndicatorEl.classList.remove('confirmed');
        }, holdCfg.CONFIRM_MS);
      }

      function clearHoldState() {
        if (holdTimer) { clearTimeout(holdTimer); holdTimer = null; }
        holdPointerId = null;
        document.removeEventListener('pointermove', onHoldPointerMove);
        document.removeEventListener('pointerup', onHoldPointerEnd);
        document.removeEventListener('pointercancel', onHoldPointerEnd);
      }

      function onHoldPointerMove(e) {
        if (e.pointerId !== holdPointerId) return;
        const dx = e.clientX - holdStartX;
        const dy = e.clientY - holdStartY;
        if (Math.hypot(dx, dy) > holdCfg.MOVE_CANCEL_PX) {
          cancelHoldVisual();
          clearHoldState();
        }
      }

      function onHoldPointerEnd(e) {
        if (e.pointerId !== holdPointerId) return;
        // Timer already fired and completed the hold — leave the
        // confirm flash alone, just drop pointer tracking.
        if (!holdTimer) { clearHoldState(); return; }
        cancelHoldVisual();
        clearHoldState();
      }

      function onHoldPointerDown(e) {
        // Only the primary pointer/button, and only when nothing else
        // is mid-hold already.
        if (holdPointerId !== null) return;
        if (e.button !== undefined && e.button !== 0) return;
        // Ignore presses on anything other than the empty grid track
        // itself (later steps add real event boxes as children here —
        // those must handle their own press behavior instead of also
        // starting a create-hold underneath them).
        if (e.target !== innerEl && e.target !== holdIndicatorEl &&
            !e.target.classList.contains('day-time-grid-hour-line')) return;

        holdPointerId = e.pointerId;
        holdStartX = e.clientX;
        holdStartY = e.clientY;
        const minutes = minutesFromClientY(e.clientY);
        beginHoldVisual(minutes);

        document.addEventListener('pointermove', onHoldPointerMove);
        document.addEventListener('pointerup', onHoldPointerEnd);
        document.addEventListener('pointercancel', onHoldPointerEnd);

        holdTimer = setTimeout(() => {
          holdTimer = null;
          confirmHoldVisual();
          createListeners.forEach((fn) => fn(minutes));
        }, holdCfg.HOLD_MS);
      }

      function initHoldGesture() {
        innerEl.addEventListener('pointerdown', onHoldPointerDown);
      }

      const boxCreateListeners = [];
      function onBoxCreated(fn) { boxCreateListeners.push(fn); }

      // Step 20 — polish. The type line + box padding/gap take up a
      // fixed ~19px regardless of box height; whatever vertical room
      // is left over is how many description lines we can afford to
      // show before clamping. Recomputed on every resize/reposition
      // so dragging a box taller reveals more of a long description
      // instead of it staying stuck at one clipped line forever.
      function updateDescLines(boxEl, heightPx) {
        const FIXED_CHROME = 30; // padding (2*2) + time line (~10.35) + type line (~13.75) + gaps (2*1), rounded up
        const DESC_LINE_H  = 12; // matches .day-time-grid-event-box-desc line-height (10px * 1.2)
        const lines = Math.max(1, Math.floor((heightPx - FIXED_CHROME) / DESC_LINE_H));
        boxEl.style.setProperty('--desc-lines', lines);
      }

      function positionEventBox(boxEl, startMinutes, durationMinutes) {
        const top    = (startMinutes / 60) * cfg.hourHeight;
        const height = (durationMinutes / 60) * cfg.hourHeight;
        boxEl.style.top    = top + 'px';
        boxEl.style.height = Math.max(height, 15) + 'px';
        updateDescLines(boxEl, Math.max(height, 15));
      }

      // Every box, however it's created, gets this same fixed
      // skeleton: a top handle, the text content wrapper, a bottom
      // handle. renderBoxFace (EventEditor) only ever touches the
      // content wrapper, so the handles are permanent — they're
      // never at risk of being wiped by a text re-render.
      function buildBoxSkeleton(boxEl) {
        const topHandle = document.createElement('div');
        topHandle.className = 'day-time-grid-event-box-handle top';
        const leftHandle = document.createElement('div');
        leftHandle.className = 'day-time-grid-event-box-handle left';
        const contentEl = document.createElement('div');
        contentEl.className = 'day-time-grid-event-box-content';
        contentEl.textContent = 'New Event';
        const rightHandle = document.createElement('div');
        rightHandle.className = 'day-time-grid-event-box-handle right';
        const bottomHandle = document.createElement('div');
        bottomHandle.className = 'day-time-grid-event-box-handle bottom';

        // Permanent bell badge — lives directly on boxEl (not inside
        // the editor or the content wrapper), so it survives every
        // editing-open/close cycle and stays visible on the compact
        // face too. Visibility is purely a CSS class, toggled by
        // setNotifyBadge() below whenever record.notify changes.
        const notifyBadge = document.createElement('div');
        notifyBadge.className = 'day-time-grid-event-box-notify-badge';
        notifyBadge.innerHTML =
          '<svg viewBox="0 0 24 24" width="7" height="7" fill="none" stroke="currentColor" ' +
          'stroke-width="3" stroke-linecap="round" stroke-linejoin="round">' +
          '<path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9"></path>' +
          '<path d="M13.73 21a2 2 0 0 1-3.46 0"></path></svg>';

        // Permanent padlock badge — same idea as the bell badge above,
        // opposite corner. Shown via setLockedState() whenever
        // record.locked changes.
        const lockBadge = document.createElement('div');
        lockBadge.className = 'day-time-grid-event-box-lock-badge';
        lockBadge.innerHTML =
          '<svg viewBox="0 0 24 24" width="7" height="7" fill="none" stroke="currentColor" ' +
          'stroke-width="3" stroke-linecap="round" stroke-linejoin="round">' +
          '<rect x="4" y="10" width="16" height="10" rx="2"></rect>' +
          '<path d="M7 10V7a5 5 0 0 1 10 0v3"></path></svg>';

        boxEl.appendChild(topHandle);
        boxEl.appendChild(leftHandle);
        boxEl.appendChild(contentEl);
        boxEl.appendChild(rightHandle);
        boxEl.appendChild(bottomHandle);
        boxEl.appendChild(notifyBadge);
        boxEl.appendChild(lockBadge);
        return { topHandle, leftHandle, contentEl, rightHandle, bottomHandle, notifyBadge, lockBadge };
      }

      // Toggles the compact-face bell badge for a record. Safe to
      // call any time (editor open, closed, or never built yet)
      // since the badge lives on boxEl itself, not inside the editor.
      function setNotifyBadge(record, on) {
        if (!record || !record.el) return;
        const badge = record.el.querySelector('.day-time-grid-event-box-notify-badge');
        if (badge) badge.classList.toggle('visible', !!on);
      }

      // Toggles the compact-face padlock badge AND the box's own
      // .locked class (which is what actually disables the resize
      // handles visually — attachBoxDrag/attachBoxResize check
      // record.locked directly, independent of this class).
      function setLockedState(record, on) {
        if (!record || !record.el) return;
        record.el.classList.toggle('locked', !!on);
        const badge = record.el.querySelector('.day-time-grid-event-box-lock-badge');
        if (badge) badge.classList.toggle('visible', !!on);
      }

      function spawnEventBox(startMinutes) {
        const durationMinutes = holdCfg.SNAP_MIN; // default length — step 17 lets it be resized after
        const dateKey = EventStore.selectedDateKey();
        const record  = EventStore.create(dateKey, startMinutes, durationMinutes);

        const boxEl = document.createElement('div');
        boxEl.className = 'day-time-grid-event-box';
        const handles = buildBoxSkeleton(boxEl);
        positionEventBox(boxEl, startMinutes, durationMinutes);
        innerEl.appendChild(boxEl);
        record.el = boxEl;
        setNotifyBadge(record, record.notify);
        setLockedState(record, record.locked);
        attachBoxDrag(record);
        attachBoxResize(record, handles);
        attachBoxWidthResize(record, handles);

        boxCreateListeners.forEach((fn) => fn(record));
        recomputeOverlapLayout();
        return record;
      }

      let renderedDateKey = null;

      function detachRenderedBoxes(dateKey) {
        if (!dateKey) return;
        EventStore.getForDate(dateKey).forEach((record) => {
          if (record.el) {
            record.el.remove();
            record.el = null;
          }
        });
      }

      // Builds and mounts the DOM box for a single record. Shared by
      // the full-date render below and by renderNewEventsForDate,
      // which paints just the freshly-added record(s) into a date
      // that's already showing — e.g. right after the talk-to-AI
      // widget saves a new event while you're looking at that day.
      // `animate: true` plays a pop-in flourish so a box that
      // appeared on its own (nobody tapped anything) still reads as
      // "something just happened" rather than silently existing.
      function paintEventBox(record, { animate = false } = {}) {
        const boxEl = document.createElement('div');
        boxEl.className = 'day-time-grid-event-box';
        const handles = buildBoxSkeleton(boxEl);
        positionEventBox(boxEl, record.startMinutes, record.durationMinutes);
        innerEl.appendChild(boxEl);
        record.el = boxEl;
        setNotifyBadge(record, record.notify);
        setLockedState(record, record.locked);
        attachBoxDrag(record);
        attachBoxResize(record, handles);
        attachBoxWidthResize(record, handles);
        EventEditor.renderBoxFace(record);
        if (animate) {
          boxEl.classList.add('ai-pop-in');
          boxEl.addEventListener('animationend', () => boxEl.classList.remove('ai-pop-in'), { once: true });
        }
      }

      function renderEventsForDate(dateKey) {
        if (dateKey === renderedDateKey) {
          // Same date as last time, so normally nothing to do — but
          // other code (chiefly WeekView, which "steals" a record's
          // box element to paint it into its own columns — see
          // detachRecordBox) can yank boxes out from under this grid
          // without ever telling it, leaving renderedDateKey
          // pointing at a date that looks cached but is actually
          // sitting empty. Verify every record for this date still
          // has a box actually mounted here before trusting the
          // cache; if anything's missing, fall through to a real
          // repaint instead of silently showing nothing.
          const stillMounted = EventStore.getForDate(dateKey)
            .every((record) => record.el && record.el.parentElement === innerEl);
          if (stillMounted) return;
        }
        detachRenderedBoxes(renderedDateKey);

        EventStore.getForDate(dateKey).forEach((record) => {
          if (record.el && record.el.parentElement === innerEl) return; // already correctly mounted here
          detachRecordBox(record); // steal it back if it's mounted somewhere else (e.g. the week view)
          paintEventBox(record);
        });

        renderedDateKey = dateKey;
        recomputeOverlapLayout();
      }

      // Blows away every currently-mounted box for `dateKey` (by
      // querying the DOM directly rather than through EventStore's
      // records, since callers like undo swap those records out for
      // fresh ones first) and repaints from whatever EventStore has
      // for that date right now. No-ops if `dateKey` isn't the date
      // actually open, since there's nothing on screen to fix.
      function forceRerenderDate(dateKey) {
        if (dateKey !== renderedDateKey) return;
        innerEl.querySelectorAll('.day-time-grid-event-box').forEach((box) => box.remove());
        renderedDateKey = null;
        renderEventsForDate(dateKey);
      }

      // Paints just the given records (skipping any that already have
      // a box) into the date currently showing, with the pop-in
      // animation. No-ops if `dateKey` isn't the date actually locked
      // open right now — renderEventsForDate already handles painting
      // everything the normal way whenever the open date changes, so
      // this only needs to cover the "already looking at this day
      // when new records land" case.
      function renderNewEventsForDate(dateKey, records) {
        if (dateKey !== renderedDateKey) return;
        records.forEach((record) => {
          if (record.el && record.el.parentElement === innerEl) return;
          detachRecordBox(record);
          paintEventBox(record, { animate: true });
        });
        recomputeOverlapLayout();
      }

      // Counterpart to renderNewEventsForDate, for records that
      // already have a box and just had some fields changed (color,
      // lock, alert, time, title/description) — e.g. right after the
      // talk-to-AI widget applies an edit while you're looking at
      // that day. The box itself was never touched when the record
      // was mutated in saveEventEdits, so without this the change is
      // correct in memory/on the server but invisible until you leave
      // the day and come back. Re-applies every visual bit that can
      // change and plays the same flash used for a brand-new box,
      // minus the grow-from-nothing part (see .ai-edit-flash above).
      function refreshEditedRecords(dateKey, records) {
        if (dateKey !== renderedDateKey) return;
        records.forEach((record) => {
          if (!record.el) return; // no box painted for it — nothing to flash
          positionEventBox(record.el, record.startMinutes, record.durationMinutes);
          setNotifyBadge(record, record.notify);
          setLockedState(record, record.locked);
          EventEditor.renderBoxFace(record);

          record.el.classList.remove('ai-edit-flash');
          void record.el.offsetWidth; // force reflow so back-to-back edits restart the animation
          record.el.classList.add('ai-edit-flash');
          setTimeout(() => { if (record.el) record.el.classList.remove('ai-edit-flash'); }, 500);
        });
        recomputeOverlapLayout();
      }

      const overlapCfg = {
        trackLeft:     34, // must match .day-time-grid-event-box's CSS left
        trackRightGap: 6,  // must match .day-time-grid-event-box's CSS right
        colGap:        2,  // px gap between side-by-side columns
      };

      const widthResizeCfg = {
        MIN_WIDTH_PX: 20,
        // Horizontal size/position is stored as this many discrete
        // steps (1-10 for width, 0-10 for left) of the track's OWN
        // width, not raw pixels. Raw pixels broke across devices: a
        // box dragged to "full width" on a narrow phone track saved
        // some small px number, and that same px number is only a
        // sliver of a wider desktop track when opened there. Storing
        // a unit count and multiplying it by *today's* track width
        // at render time keeps "10x" meaning "full width" everywhere.
        UNITS: 10,
      };

      function trackWidthPx() {
        return innerEl.clientWidth - overlapCfg.trackLeft - overlapCfg.trackRightGap;
      }

      // Width of one horizontal unit on the current device/track.
      function unitPx(tw) {
        return tw / widthResizeCfg.UNITS;
      }

      // Clamped read helpers — a record that's never been manually
      // resized just gets the full track (10 units), same as before.
      function readWidthUnits(record) {
        return record.manualWidthUnits != null
          ? Math.max(1, Math.min(widthResizeCfg.UNITS, record.manualWidthUnits))
          : widthResizeCfg.UNITS;
      }
      function readLeftUnits(record, widthUnits) {
        const maxLeftUnits = widthResizeCfg.UNITS - widthUnits;
        return record.manualLeftUnits != null
          ? Math.max(0, Math.min(maxLeftUnits, record.manualLeftUnits))
          : 0;
      }

      // Applies a record's own saved width/left-offset (stored as
      // unit counts, converted to px against whatever room actually
      // exists right now) — so the box is always sized proportionally
      // to the device it's currently being viewed on.
      function applyManualBoxPosition(record) {
        const boxEl = record.el;
        if (!boxEl) return;
        const tw = trackWidthPx();
        const uPx = unitPx(tw);
        const widthUnits = readWidthUnits(record);
        const leftUnits  = readLeftUnits(record, widthUnits);
        const leftPx  = leftUnits * uPx;
        const widthPx = widthUnits * uPx;
        boxEl.style.left  = (overlapCfg.trackLeft + leftPx) + 'px';
        boxEl.style.width = Math.max(widthPx, widthResizeCfg.MIN_WIDTH_PX) + 'px';
      }

      function positionEventBoxColumn(record, colIndex, colCount) {
        const boxEl = record.el;
        if (colCount <= 1) {
          applyManualBoxPosition(record);
          return;
        }
        const trackWidth = trackWidthPx();
        const slice       = trackWidth / colCount;
        const left        = overlapCfg.trackLeft + slice * colIndex + (colIndex > 0 ? overlapCfg.colGap / 2 : 0);
        const width        = slice - (colIndex > 0 && colIndex < colCount - 1
          ? overlapCfg.colGap
          : overlapCfg.colGap / 2);
        boxEl.style.left  = left + 'px';
        boxEl.style.width = Math.max(width, 20) + 'px';
      }

      function recomputeOverlapLayout() {
        // DISABLED: no more automatic column-splitting when boxes
        // land on the same time slot. Boxes just keep whatever
        // position/width they already have — full track width by
        // default, or their own manually-resized width/position —
        // and dragging/resizing is never overridden by collision
        // handling. Overlapping boxes are simply allowed to overlap.
        if (!renderedDateKey) return;
        EventStore.getForDate(renderedDateKey)
          .filter((r) => r.el)
          .forEach((record) => applyManualBoxPosition(record));
      }

      const expandCfg = {
        fadeMs:  220, // slide/zoom transition duration
        holdMs:  600, // must hold still on the same slot this long before it expands
        extraPx: 54,  // extra vertical room opened up inside the expanded hour
      };
      let expandedHour = null;           // integer hour currently expanded, or null
      let expandEls = [];                // the extra quarter tick/label elements
      let shiftedEls = [];                // hour lines/labels currently slid down to make room
      let expandHoldTimer = null;
      let expandCandidateMinutes = null; // the minute value the pending hold timer is waiting on

      function collapseExpandedHour() {
        clearTimeout(expandHoldTimer);
        expandHoldTimer = null;
        expandCandidateMinutes = null;
        if (expandedHour === null && !expandEls.length) return;
        expandedHour = null;

        const dyingQuarters = expandEls;
        expandEls = [];
        dyingQuarters.forEach((el) => {
          el.classList.remove('visible');
          setTimeout(() => el.remove(), expandCfg.fadeMs);
        });

        const dyingShift = shiftedEls;
        shiftedEls = [];
        dyingShift.forEach((el) => { el.style.transform = ''; });
      }

      // Actually performs the expand: slides every hour line/label
      // after `hour` down by extraPx (real, layout-affecting motion —
      // not just a visual overlay), then zooms in the three quarter
      // marks spread evenly across the now-larger hour slot.
      function triggerExpandedHour(hour) {
        const baseY = hour * cfg.hourHeight;
        const expandedHeight = cfg.hourHeight + expandCfg.extraPx;

        const toShift = [];
        for (let h = hour + 1; h <= 24; h++) {
          if (hourLineEls[h]) toShift.push(hourLineEls[h]);
          if (hourLabelEls[h]) toShift.push(hourLabelEls[h]);
        }
        toShift.forEach((lineOrLabel) => {
          lineOrLabel.style.transition = 'transform ' + expandCfg.fadeMs + 'ms ease';
          lineOrLabel.style.transform = 'translateY(' + expandCfg.extraPx + 'px)';
        });
        shiftedEls = toShift;

        const els = [];
        [0.25, 0.5, 0.75].forEach((frac) => {
          const y  = baseY + frac * expandedHeight;
          const mm = Math.round(frac * 60);
          const labelText = String(hour).padStart(2, '0') + ':' + String(mm).padStart(2, '0');

          const line = document.createElement('div');
          line.className = 'day-time-grid-hour-line day-time-grid-quarter-line';
          line.style.top = y + 'px';
          line.style.transition = 'opacity ' + expandCfg.fadeMs + 'ms ease, top ' + expandCfg.fadeMs + 'ms ease';
          innerEl.appendChild(line);
          els.push(line);

          const label = document.createElement('div');
          label.className = 'day-time-grid-hour-label day-time-grid-quarter-label';
          label.style.top = y + 'px';
          label.style.transition = 'opacity ' + expandCfg.fadeMs + 'ms ease, transform ' + expandCfg.fadeMs + 'ms ease, top ' + expandCfg.fadeMs + 'ms ease';
          label.textContent = labelText;
          innerEl.appendChild(label);
          els.push(label);
        });

        requestAnimationFrame(() => els.forEach((el) => el.classList.add('visible')));
        expandEls = els;
        expandedHour = hour;
      }

      // Called on every drag/resize move with whichever minute value
      // is actively changing. DISABLED: this used to (re)start a hold
      // timer that, after holdMs with no movement, slid every later
      // hour line down and zoomed in quarter-marks (triggerExpandedHour)
      // — that's the "auto correction" that was glitching out whenever
      // two events landed in the same spot. Left as a no-op rather than
      // deleted so collapseExpandedHour()/triggerExpandedHour() below
      // (still called elsewhere) stay harmless no-ops too.
      function requestExpandForMinutes(minutes) {
        return;
      }

      const dragCfg = {
        SNAP_MIN:                15,
        MOVE_THRESHOLD_PX:       10, // mouse / pen — small and precise
        TOUCH_MOVE_THRESHOLD_PX: 20, // a finger wobbles more than this on a plain tap
      };

      // Manual double-tap detection, shared by the drag/resize/width-
      // resize pointerup handlers below. Native 'dblclick' (still
      // wired separately in attachBoxDrag) is unreliable on touch —
      // some mobile browsers won't synthesize it once touch-action:
      // none and pointer capture are involved the way they are here —
      // so this is the one that actually has to carry phones. Keyed
      // by the box element itself (not by which handle/edge caught
      // the second tap), so two quick taps that land on, say, the box
      // body then a resize handle still count as a double-tap on the
      // SAME box.
      const DOUBLE_TAP_MS = 350;
      const lastTapAt = new WeakMap();
      function isDoubleTap(boxEl) {
        const now = Date.now();
        const prev = lastTapAt.get(boxEl) || 0;
        lastTapAt.set(boxEl, now);
        return (now - prev) < DOUBLE_TAP_MS;
      }

      function clampStartMinutes(startMinutes, durationMinutes) {
        const max = 24 * 60 - durationMinutes;
        return Math.max(0, Math.min(max, startMinutes));
      }

      function attachBoxDrag(record) {
        const boxEl = record.el;
        let dragPointerId   = null;
        let dragPointerType = 'mouse';
        let dragging        = false;
        let startClientX    = 0;
        let startClientY    = 0;
        let startMinutesAt  = 0;
        let startLeftPx     = 0; // horizontal offset (px from track's own left edge) at drag start

        function onMove(e) {
          if (e.pointerId !== dragPointerId) return;
          if (record.locked) return; // locked boxes don't move — a plain
                                      // tap still reaches onEnd below and
                                      // opens the editor as normal.
          const dx = e.clientX - startClientX;
          const dy = e.clientY - startClientY;

          if (!dragging) {
            const threshold = dragPointerType === 'touch'
              ? dragCfg.TOUCH_MOVE_THRESHOLD_PX
              : dragCfg.MOVE_THRESHOLD_PX;
            if (Math.hypot(dx, dy) < threshold) return;
            dragging = true;
            boxEl.classList.add('dragging');
          }

          const deltaMinutes = (dy / cfg.hourHeight) * 60;
          const rawStart     = startMinutesAt + deltaMinutes;
          const snapped      = Math.round(rawStart / dragCfg.SNAP_MIN) * dragCfg.SNAP_MIN;
          record.startMinutes = clampStartMinutes(snapped, record.durationMinutes);
          positionEventBox(boxEl, record.startMinutes, record.durationMinutes);

          // Horizontal — slide sideways within the track, snapped to
          // the same 1/10th-of-track units the width-resize handles
          // use, so the offset stays proportionally correct no matter
          // which device the box is opened on.
          const tw     = trackWidthPx();
          const uPx    = unitPx(tw);
          const widthUnits = readWidthUnits(record);
          const widthPx    = widthUnits * uPx;
          const rawLeft       = startLeftPx + dx;
          const snappedLeft   = Math.round(rawLeft / uPx) * uPx;
          const clampedLeftPx = Math.max(0, Math.min(snappedLeft, tw - widthPx));
          record.manualLeftUnits = Math.round(clampedLeftPx / uPx);
          applyManualBoxPosition(record);

          EventEditor.updateTimeLabel(record);
          EventEditor.updateFaceTime(record);
          requestExpandForMinutes(record.startMinutes);
        }

        function onEnd(e) {
          if (e.pointerId !== dragPointerId) return;
          document.removeEventListener('pointermove', onMove);
          document.removeEventListener('pointerup', onEnd);
          document.removeEventListener('pointercancel', onEnd);
          dragPointerId = null;
          collapseExpandedHour();

          const wasDragging = dragging;
          dragging = false;
          boxEl.classList.remove('dragging');

          // Two taps within DOUBLE_TAP_MS always opens the editor,
          // full stop — even if this second pointer sequence moved
          // enough to register as a drag along the way. Checked
          // before the wasDragging branch below so it can override it.
          if (e.type === 'pointerup' && isDoubleTap(boxEl)) {
            EventEditor.open(record);
            return;
          }

          if (wasDragging) {
            EventStore.save(record);
            if (record.notify) NotificationScheduler.schedule(record);
            recomputeOverlapLayout();
          } else if (e.type === 'pointerup') {
            // No meaningful movement happened between down and up —
            // that's a tap, not a drag. Step 18: reopen the editor
            // on the record as it currently stands (pointercancel is
            // excluded here — an interrupted gesture, e.g. a scroll
            // stealing the pointer, shouldn't pop the editor open).
            EventEditor.open(record);
          }
        }

        boxEl.addEventListener('pointerdown', (e) => {
          if (dragPointerId !== null) return;
          if (e.button !== undefined && e.button !== 0) return;
          // Don't let this bubble up into the grid's own hold-to-
          // create listener on innerEl.
          e.stopPropagation();

          // While this box is in its inline-edit state, clicks on its
          // own editor controls (textarea, type/color buttons,
          // dropdowns) should behave like normal form interactions —
          // not get hijacked into a drag-move or a tap-to-reopen.
          if (boxEl.classList.contains('editing') && e.target.closest('.day-time-grid-event-box-editor')) {
            return;
          }

          const tw = trackWidthPx();
          const uPx = unitPx(tw);
          const widthUnits = readWidthUnits(record);
          const leftUnits  = readLeftUnits(record, widthUnits);

          dragPointerId   = e.pointerId;
          dragPointerType = e.pointerType || 'mouse';
          startClientX    = e.clientX;
          startClientY    = e.clientY;
          startMinutesAt  = record.startMinutes;
          startLeftPx     = leftUnits * uPx;

          document.addEventListener('pointermove', onMove);
          document.addEventListener('pointerup', onEnd);
          document.addEventListener('pointercancel', onEnd);
        });

        // A double-click always means "open this," full stop — even if
        // the two taps that made it up jittered past the move/resize
        // threshold (a real risk on trackpads/touch, where a "tap" is
        // rarely 100% still) and got read as a tiny drag or resize on
        // one or both clicks. Listening at the box level (rather than
        // only on the box's own pointerdown) means this also fires for
        // dblclicks that land on a resize handle: handles only
        // stopPropagation() on pointerdown (to claim the gesture ahead
        // of attachBoxDrag), not on click/dblclick, so this still sees
        // it. Bypasses the tap-vs-drag heuristic entirely instead of
        // trying to out-guess it.
        boxEl.addEventListener('dblclick', (e) => {
          e.stopPropagation();
          e.preventDefault();
          dragPointerId = null;
          dragging = false;
          boxEl.classList.remove('dragging', 'resizing');
          EventEditor.open(record);
        });
      }

      const resizeCfg = {
        SNAP_MIN:     15,
        MIN_DURATION: 15,
      };

      function attachBoxResize(record, handles) {
        const boxEl = record.el;
        let resizePointerId = null;
        let edge             = null; // 'top' | 'bottom'
        let startClientY     = 0;
        let fixedMinutes      = 0;    // the edge that does NOT move
        let ownMinutesAtStart = 0;    // the edge that DOES move, before drag

        function onMove(e) {
          if (e.pointerId !== resizePointerId) return;
          const dy = e.clientY - startClientY;
          const deltaMinutes = (dy / cfg.hourHeight) * 60;
          const rawMoving = ownMinutesAtStart + deltaMinutes;
          const snapped   = Math.round(rawMoving / resizeCfg.SNAP_MIN) * resizeCfg.SNAP_MIN;

          if (edge === 'bottom') {
            const newEnd = Math.max(fixedMinutes + resizeCfg.MIN_DURATION, Math.min(24 * 60, snapped));
            record.durationMinutes = newEnd - fixedMinutes;
          } else {
            const newStart = Math.min(fixedMinutes - resizeCfg.MIN_DURATION, snapped);
            const clampedStart = Math.max(0, newStart);
            record.startMinutes    = clampedStart;
            record.durationMinutes = fixedMinutes - clampedStart;
          }
          positionEventBox(boxEl, record.startMinutes, record.durationMinutes);
          EventEditor.updateTimeLabel(record);
          EventEditor.updateFaceTime(record);
          // Only the edge actually being dragged is what should
          // drive which hour expands — the fixed edge doesn't move.
          requestExpandForMinutes(edge === 'bottom' ? (fixedMinutes + record.durationMinutes) : record.startMinutes);
        }

        function onEnd(e) {
          if (e.pointerId !== resizePointerId) return;
          document.removeEventListener('pointermove', onMove);
          document.removeEventListener('pointerup', onEnd);
          document.removeEventListener('pointercancel', onEnd);
          resizePointerId = null;
          boxEl.classList.remove('resizing');
          collapseExpandedHour();

          // Two quick taps on a resize handle (top or bottom strip),
          // same as two taps on the box body, always opens the
          // editor — this is what actually carries the "double-tap
          // to edit" gesture on phones, where the resize handles are
          // often the easiest/only place to land a precise tap.
          if (e.type === 'pointerup' && isDoubleTap(boxEl)) {
            EventEditor.open(record);
            return;
          }

          EventStore.save(record);
          if (record.notify) NotificationScheduler.schedule(record);
          recomputeOverlapLayout();
        }

        function startResize(e, whichEdge) {
          if (resizePointerId !== null) return;
          if (record.locked) return;
          if (e.button !== undefined && e.button !== 0) return;
          e.stopPropagation();

          resizePointerId = e.pointerId;
          edge            = whichEdge;
          startClientY    = e.clientY;

          if (whichEdge === 'bottom') {
            fixedMinutes      = record.startMinutes;
            ownMinutesAtStart = record.startMinutes + record.durationMinutes;
          } else {
            fixedMinutes      = record.startMinutes + record.durationMinutes;
            ownMinutesAtStart = record.startMinutes;
          }

          boxEl.classList.add('resizing');
          document.addEventListener('pointermove', onMove);
          document.addEventListener('pointerup', onEnd);
          document.addEventListener('pointercancel', onEnd);
        }

        handles.topHandle.addEventListener('pointerdown', (e) => startResize(e, 'top'));
        handles.bottomHandle.addEventListener('pointerdown', (e) => startResize(e, 'bottom'));
      }

      function attachBoxWidthResize(record, handles) {
        const boxEl = record.el;
        let pointerId    = null;
        let edge         = null; // 'left' | 'right'
        let startClientX = 0;
        let fixedPx      = 0; // the edge (px from track's left) that stays put
        let ownPxAtStart = 0; // the edge (px from track's left) that moves

        function onMove(e) {
          if (e.pointerId !== pointerId) return;
          const tw  = trackWidthPx();
          const uPx = unitPx(tw);
          const dx  = e.clientX - startClientX;
          const rawMoving = ownPxAtStart + dx;
          const snapped   = Math.round(rawMoving / uPx) * uPx;

          if (edge === 'right') {
            const newRight = Math.max(fixedPx + uPx, Math.min(tw, snapped));
            record.manualLeftUnits  = Math.round(fixedPx / uPx);
            record.manualWidthUnits = Math.max(1, Math.round((newRight - fixedPx) / uPx));
          } else {
            const newLeft = Math.min(fixedPx - uPx, snapped);
            const clampedLeft = Math.max(0, newLeft);
            record.manualLeftUnits  = Math.round(clampedLeft / uPx);
            record.manualWidthUnits = Math.max(1, Math.round((fixedPx - clampedLeft) / uPx));
          }
          applyManualBoxPosition(record);
        }

        function onEnd(e) {
          if (e.pointerId !== pointerId) return;
          document.removeEventListener('pointermove', onMove);
          document.removeEventListener('pointerup', onEnd);
          document.removeEventListener('pointercancel', onEnd);
          pointerId = null;
          boxEl.classList.remove('resizing');

          // Same phone-friendly double-tap override as the top/bottom
          // resize handles — two fast taps on a left/right handle
          // opens the editor instead of just re-saving the width.
          if (e.type === 'pointerup' && isDoubleTap(boxEl)) {
            EventEditor.open(record);
            return;
          }

          EventStore.save(record);
        }

        function startResize(e, whichEdge) {
          if (pointerId !== null) return;
          if (record.locked) return;
          if (e.button !== undefined && e.button !== 0) return;
          e.stopPropagation();

          const tw = trackWidthPx();
          const uPx = unitPx(tw);
          const widthUnits = readWidthUnits(record);
          const leftUnits  = readLeftUnits(record, widthUnits);
          const leftPx  = leftUnits * uPx;
          const widthPx = widthUnits * uPx;

          pointerId    = e.pointerId;
          edge         = whichEdge;
          startClientX = e.clientX;

          if (whichEdge === 'right') {
            fixedPx      = leftPx;
            ownPxAtStart = leftPx + widthPx;
          } else {
            fixedPx      = leftPx + widthPx;
            ownPxAtStart = leftPx;
          }

          boxEl.classList.add('resizing');
          document.addEventListener('pointermove', onMove);
          document.addEventListener('pointerup', onEnd);
          document.addEventListener('pointercancel', onEnd);
        }

        handles.leftHandle.addEventListener('pointerdown', (e) => startResize(e, 'left'));
        handles.rightHandle.addEventListener('pointerdown', (e) => startResize(e, 'right'));
      }

      function ensureBuilt() {
        if (el) return;
        el = document.createElement('div');
        el.id = 'dayTimeGrid';
        el.className = 'day-time-grid';
        document.body.appendChild(el);
        buildHours();
        initHoldGesture();

        // Right-click anywhere on the grid: always swallow the
        // browser's own context menu (capture phase, so this runs
        // before anything else and can't be beaten by a child
        // stopping propagation), then show our own tiny "Paste"
        // popup instead — see handleGridContextMenu below for what
        // it does and doesn't fire on.
        el.addEventListener('contextmenu', (e) => {
          e.preventDefault();
          handleGridContextMenu(e);
        }, true);
      }

      // Sits directly under the locked header card (day-number +
      // month-nav + mini-calendar panel), same left edge as the
      // page, same right edge as that card. No fixed/viewport-
      // clamped height and no inner scrollbar — its height is just
      // its real content height (24 hours), so it grows the actual
      // page and pushes anything below it down, and scrolling to an
      // hour is real page scroll rather than a scrollbar inside a box.
      function computeRect() {
        // Used to hang this off LockedHeaderCard.computeRect() — a
        // box sized to wrap the day-number + nav + mini-calendar
        // panel that USED to be visible up there. That panel (and
        // LockedHeaderCard itself — see its own init() note, it's
        // never actually shown) is gone, but its computeRect() still
        // reserved a mini-calendar's worth of height, so this grid
        // kept starting 150px+ further down the page than the one
        // thing that's actually visible above it now: the date pill
        // (LockedMonthNav). Anchoring off that pill's real rect
        // instead removes the leftover blank gap.
        const nav       = LockedMonthNav.computeRect();
        const container = MiniCalendarLayout.computeContainerRect();
        const clearance = isPhoneVP() ? 44 : 28; // gap below the date pill
        const top       = nav.top + nav.height + clearance;
        return {
          left:   0,
          top:    top,
          width:  container.left + container.width,
          height: cfg.hourHeight * 24,
        };
      }

      function render() {
        ensureBuilt();
        const r = computeRect();
        const isNight = document.body.classList.contains('night-mode');
        el.style.left   = r.left + 'px';
        el.style.top    = (r.top + LockedViewAnchor.get()) + 'px';
        el.style.width  = r.width + 'px';
        el.style.height = r.height + 'px';
        el.classList.toggle('night', isNight);
        updateNowLine();
      }

      let hideTimer = null;

      async function show() {
        clearTimeout(hideTimer);
        ensureBuilt();
        // Start parked below its resting position (see the base
        // .day-time-grid transform in CSS) so display:block commits
        // that as the "from" state before the rAF below moves it —
        // same forced-commit pattern used by FlipAnimator elsewhere
        // in this file.
        el.style.transform = 'translateY(60px)';
        el.style.display = 'block';
        void el.offsetHeight; // force the browser to commit the "from" state
        render();
        // Always do a hard, from-scratch repaint every time Day view
        // opens, instead of trusting that whatever's already mounted
        // from a previous open — or a previous EventStore fetch — is
        // still good. Re-fetches straight from the server every time
        // rather than reusing anything already in memory.
        detachRenderedBoxes(renderedDateKey);
        renderedDateKey = null;
        await EventStore.reloadFromServer();
        renderEventsForDate(EventStore.selectedDateKey());
        requestAnimationFrame(() => {
          if (!el) return;
          el.style.opacity = '1';
          el.style.transform = 'translateY(0)'; // slides up into place
        });
        if (!resizeHandler) {
          resizeHandler = () => { if (el && el.style.opacity === '1') { render(); recomputeOverlapLayout(); } };
          window.addEventListener('resize', resizeHandler);
        }
        // Only ticking while the grid is actually on screen — no point
        // updating a bar nobody can see.
        startNowTimer();
        // Land the page scrolled to right around the current time (the
        // red bar), same idea as the week view's own opening scroll —
        // only takes effect when the locked day is actually today.
        scrollToNow();
      }

      function hide() {
        if (!el) return;
        el.style.opacity = '0';
        el.style.transform = 'translateY(60px)'; // slides back down as it leaves
        // Only fully removed from layout (display:none) AFTER the slide
        // finishes, so it slides away instead of hard-cutting. But it
        // MUST end up display:none once hidden: while still
        // `display:block` (even at opacity 0) it's a ~2000px-tall
        // absolutely-positioned box that still occupies scrollable page
        // space — exactly what was pushing the settings button/header
        // out of place in the normal CALENDAR view.
        clearTimeout(hideTimer);
        hideTimer = setTimeout(() => { if (el) el.style.display = 'none'; }, cfg.fadeMs);
        stopNowTimer();
      }

      function init() {
        DayViewState.onChange((next) => {
          if (next === DayViewState.STATES.LOCKED) {
            // Double rAF: wait for LockedHeaderCard/MiniCalendarLayout
            // to have settled at their real positions first, same
            // pattern used elsewhere in this file.
            requestAnimationFrame(() => requestAnimationFrame(show));
          } else {
            hide();
          }
        });
        // If the locked day changes while the grid is already open
        // (e.g. a future section wires mini-calendar clicks while
        // LOCKED), keep the red bar's visibility in sync immediately
        // rather than waiting for the next 30s tick.
        SelectedDayState.onChange(() => {
          if (el && el.style.display === 'block') {
            updateNowLine();
            renderEventsForDate(EventStore.selectedDateKey());
          }
        });
        // A completed hold (step 5) now actually produces a box
        // (step 6) rather than just flashing the indicator.
        onHoldCreate(spawnEventBox);
      }

      // Counterpart to renderNewEventsForDate/refreshEditedRecords for
      // deletions — the record's already been spliced out of
      // EventStore's array by the time this runs; this only tears
      // down the DOM box that's still sitting there so it doesn't
      // linger until the day is left and re-opened.
      function removeRecordsFromDate(dateKey, records) {
        if (dateKey !== renderedDateKey) return;
        records.forEach((record) => {
          if (record.el) { record.el.remove(); record.el = null; }
        });
        recomputeOverlapLayout();
      }

      // Live hour-row-spacing control (topbar slider, desktop only).
      // Safe to call before the grid has ever been built — it just
      // updates cfg.hourHeight so whenever ensureBuilt()/buildHours()
      // does run, it picks up the new spacing from the start. If the
      // grid already exists, reposition every hour line/label plus
      // the current-day's event boxes in place (positionEventBox
      // reads cfg.hourHeight live, so forceRerenderDate is enough —
      // no need to touch EventStore or any record data).
      function setHourHeight(px) {
        cfg.hourHeight = px;
        if (!innerEl) return;
        innerEl.style.height = (cfg.hourHeight * 24) + 'px';
        for (let h = 0; h <= 24; h++) {
          const y = h * cfg.hourHeight;
          if (hourLineEls[h]) hourLineEls[h].style.top = y + 'px';
          if (hourLabelEls[h]) hourLabelEls[h].style.top = y + 'px';
        }
        if (el && el.style.display === 'block') render();
        if (renderedDateKey) forceRerenderDate(renderedDateKey);
      }

      return { init, computeRect, onHoldCreate, onBoxCreated, recomputeOverlapLayout, setNotifyBadge, setLockedState, positionEventBox, renderEventsForDate, renderNewEventsForDate, refreshEditedRecords, removeRecordsFromDate, forceRerenderDate, setHourHeight, getHourHeight: () => cfg.hourHeight, refresh: show };
    })();
    DayTimeGrid.init();

    const PUSH_VAPID_PUBLIC_KEY = 'BMqpwoCoNaGwdsEnw65lrraMy2rtf3pDTwUz5P3E31KsxJdsvAr8fKX5CTHyb1x_FJwVIsfjBZShd0gQ8eONdBk';

    const PushNotifications = (() => {
      function urlBase64ToUint8Array(base64String) {
        const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
        const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
        const raw = atob(base64);
        const out = new Uint8Array(raw.length);
        for (let i = 0; i < raw.length; i++) out[i] = raw.charCodeAt(i);
        return out;
      }

      function bytesToBase64Url(bytes) {
        let bin = '';
        for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
        return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
      }

      async function init() {
        if (!('serviceWorker' in navigator)) return;
        try {
          // always register the SW (app-shell cache); push is optional on top of it
          const reg = await navigator.serviceWorker.register('/sw.js');
          if ('PushManager' in window && typeof Notification !== 'undefined' && Notification.permission === 'granted') await ensureSubscribed(reg);
        } catch (err) { /* not supported in this browser, ignore */ }
      }

      async function ensureSubscribed(reg) {
        if (!('serviceWorker' in navigator) || !('PushManager' in window)) return null;
        reg = reg || await navigator.serviceWorker.ready;
        let sub = await reg.pushManager.getSubscription();

        // A subscription can exist but have been created under an OLD
        // VAPID key (e.g. after rotating keys server-side). That old
        // subscription is permanently unusable — the push service will
        // reject every send with a key-mismatch error — but the browser
        // has no way to know that on its own, so we compare keys
        // ourselves and force a real re-subscribe when they differ.
        if (sub) {
          try {
            const currentKeyBuf = sub.options && sub.options.applicationServerKey;
            const currentKey = currentKeyBuf ? bytesToBase64Url(new Uint8Array(currentKeyBuf)) : null;
            if (currentKey && currentKey !== PUSH_VAPID_PUBLIC_KEY) {
              await sub.unsubscribe();
              sub = null;
            }
          } catch (err) { /* if we can't tell, fall through and reuse what we have */ }
        }

        if (!sub) {
          sub = await reg.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: urlBase64ToUint8Array(PUSH_VAPID_PUBLIC_KEY),
          });
        }
        try {
          await fetch('/api/push-subscribe', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(sub.toJSON()),
          });
        } catch (err) { /* offline — will retry next time notify is toggled on */ }
        return sub;
      }

      return { init, ensureSubscribed };
    })();
    onIdle(() => PushNotifications.init(), 3000);

    const NotificationScheduler = (() => {
      const timers = new Map(); // record.id -> setTimeout id
      const MAX_DELAY_MS = 20 * 24 * 60 * 60 * 1000; // setTimeout delay overflow guard

      function supported() {
        return typeof Notification !== 'undefined';
      }

      function permissionGranted() {
        return supported() && Notification.permission === 'granted';
      }

      function requestPermission() {
        if (!supported()) return Promise.resolve('unsupported');
        if (Notification.permission === 'granted' || Notification.permission === 'denied') {
          return Promise.resolve(Notification.permission);
        }
        return Notification.requestPermission();
      }

      // record.dateKey is "YYYY-MM-DD"; combine with startMinutes to
      // get the real local Date the event starts at.
      function eventDateTime(record) {
        const [y, m, d] = record.dateKey.split('-').map(Number);
        const dt = new Date(y, m - 1, d);
        dt.setMinutes(dt.getMinutes() + record.startMinutes);
        return dt;
      }

      function fire(record) {
        timers.delete(record.id);
        if (!permissionGranted()) return;
        const title = record.type || 'Event reminder';
        const body = record.description || 'Starting now';
        try {
          new Notification(title, { body, tag: 'habitcal-' + record.id });
        } catch { /* ignore — some browsers reject Notification() outside a user gesture in edge cases */ }
      }

      function unschedule(record) {
        if (!record) return;
        const id = timers.get(record.id);
        if (id != null) { clearTimeout(id); timers.delete(record.id); }
      }

      // (Re)schedules a single record. Called whenever notify is
      // turned on, and whenever a notify-on record's time changes
      // (drag/resize) so the reminder always tracks the current
      // start time rather than firing at a stale one.
      function schedule(record) {
        unschedule(record);
        if (!record || !record.notify || !permissionGranted()) return;
        const delay = eventDateTime(record).getTime() - Date.now();
        if (delay <= 0 || delay > MAX_DELAY_MS) return; // already past, or too far out to time reliably
        const id = setTimeout(() => fire(record), delay);
        timers.set(record.id, id);
      }

      return { requestPermission, schedule, unschedule, permissionGranted, supported };
    })();

    const EventEditor = (() => {
      let currentRecord = null;

      // Prefixed label set, same three defaults as before, plus the
      // custom-name field appended below them in the same dropdown.
      const PREFIXED_TYPES = ['Important', 'Task', 'Personal'];

      // Default swatch palette for the color picker.
      const COLOR_SWATCHES = [
        '#3b82f6', '#e6362a', '#f59e0b', '#10b981', '#14b8a6',
        '#8b5cf6', '#ec4899', '#64748b', '#78350f', '#111827',
      ];

      // Below this box width, the top row can no longer fit the type
      // field alongside time/lock/notify/color/delete without things
      // clipping or wrapping — so those five collapse into a single
      // "…" button instead. One shared ResizeObserver (rather than
      // one per box) watches every open editor's box and flips
      // .compact-options on/off as it's dragged/resized or as the
      // overlap layout changes its width.
      const COMPACT_WIDTH_PX = 270;

      // How long a press on the notify bell has to be held before it
      // counts as "hold" (opens the repeat-across-days modal) instead
      // of a quick tap (toggles notify on/off).
      const REPEAT_HOLD_MS = 450;
      const compactRecordByEl = new WeakMap();
      const compactObserver = (typeof ResizeObserver !== 'undefined')
        ? new ResizeObserver((entries) => {
            entries.forEach((entry) => {
              const record = compactRecordByEl.get(entry.target);
              if (record) applyCompactState(record, entry.contentRect.width);
            });
          })
        : null;

      // Moves the collapsible controls (time, lock, notify, color,
      // delete) between the top row and the "…" menu. Reparenting the
      // real nodes — rather than cloning them — means every listener,
      // and the color menu's own nested dropdown, keep working
      // untouched no matter which side of the toggle they're
      // currently living on.
      function applyCompactState(record, width) {
        const ed = record._editor;
        if (!ed) return;
        const isCompact = width < COMPACT_WIDTH_PX;
        if (ed.isCompact === isCompact) return;
        ed.isCompact = isCompact;

        if (isCompact) {
          ed.moreMenu.appendChild(ed.optionsGroup);
          ed.moreWrap.style.display = 'flex';
        } else {
          ed.moreMenu.classList.remove('open');
          ed.topRow.insertBefore(ed.optionsGroup, ed.moreWrap);
          ed.moreWrap.style.display = 'none';
        }
      }

      // Builds the editor sub-tree for one record and appends it into
      // that record's own box element. Runs once per record — later
      // opens just reuse record._editor.
      function buildInlineEditor(record) {
        const boxEl = record.el;

        const editorEl = document.createElement('div');
        editorEl.className = 'day-time-grid-event-box-editor';

        const topRow = document.createElement('div');
        topRow.className = 'day-time-grid-event-box-editor-toprow';

        const typeWrap = document.createElement('div');
        typeWrap.className = 'day-time-grid-event-box-type-wrap';

        const typeBtn = document.createElement('button');
        typeBtn.type = 'button';
        typeBtn.className = 'day-time-grid-event-box-type-btn';
        typeBtn.innerHTML = '<span></span>';
        const typeLabelEl = typeBtn.querySelector('span');
        typeBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          typeMenu.classList.toggle('open');
        });

        const typeMenu = document.createElement('div');
        typeMenu.className = 'day-time-grid-event-box-type-menu';
        PREFIXED_TYPES.forEach((label) => {
          const opt = document.createElement('button');
          opt.type = 'button';
          opt.className = 'day-time-grid-event-box-type-option';
          opt.textContent = label;
          opt.addEventListener('click', (e) => {
            e.stopPropagation();
            selectType(record, label);
            customInput.value = '';
            typeMenu.classList.remove('open');
          });
          typeMenu.appendChild(opt);
        });

        const typeDivider = document.createElement('div');
        typeDivider.className = 'day-time-grid-event-box-type-divider';
        typeMenu.appendChild(typeDivider);

        // Custom label — types anything and it becomes the selected
        // label. Commits on Enter or on blur, same as a normal field.
        const customInput = document.createElement('input');
        customInput.type = 'text';
        customInput.className = 'day-time-grid-event-box-type-custom-input';
        customInput.placeholder = 'Custom label…';
        customInput.addEventListener('click', (e) => e.stopPropagation());
        const commitCustom = () => {
          const val = customInput.value.trim();
          if (val) {
            selectType(record, val);
            typeMenu.classList.remove('open');
          }
        };
        customInput.addEventListener('keydown', (e) => {
          if (e.key === 'Enter') { e.preventDefault(); commitCustom(); }
        });
        customInput.addEventListener('blur', commitCustom);
        typeMenu.appendChild(customInput);

        typeWrap.appendChild(typeBtn);
        typeWrap.appendChild(typeMenu);
        topRow.appendChild(typeWrap);

        // Holds time/lock/notify/color/delete. In the top row it's
        // `display: contents` (see CSS) so it's invisible as a box —
        // its children just sit in the row exactly as if they'd been
        // appended directly. When the box gets too narrow, this same
        // group gets moved wholesale into the "…" menu instead, where
        // a different CSS rule turns it into a real flex column.
        const optionsGroup = document.createElement('div');
        optionsGroup.className = 'day-time-grid-event-box-options-group';

        // Time-range readout — sits to the right of the type field,
        // shows "start – end" for whatever this box is currently set
        // to. Tapping it swaps in exact HH:MM inputs (timeEditEl,
        // below) so you can type a precise time instead of only
        // getting whatever drag/resize's 15-minute snap lands on.
        // Kept in sync by updateTimeLabel() below, called from open()
        // and whenever a drag/resize changes
        // record.startMinutes/durationMinutes.
        const timeLabelEl = document.createElement('div');
        timeLabelEl.className = 'day-time-grid-event-box-time-label';
        optionsGroup.appendChild(timeLabelEl);

        // Exact-time editor — hidden until the label above is tapped.
        // Two native <input type="time"> fields; committing either one
        // (Enter or blur) sets record.startMinutes/durationMinutes to
        // the EXACT value typed, with no 15-minute snapping at all —
        // that snapping only ever applies to dragging/resizing the
        // box itself (see attachBoxDrag/attachBoxResize's SNAP_MIN),
        // which is untouched by this.
        const timeEditEl = document.createElement('div');
        timeEditEl.className = 'day-time-grid-event-box-time-edit';
        timeEditEl.style.display = 'none';
        const startInput = document.createElement('input');
        startInput.type = 'time';
        startInput.step = '60'; // 1-minute granularity (no seconds field)
        const sep = document.createElement('span');
        sep.className = 'day-time-grid-event-box-time-edit-sep';
        sep.textContent = '–';
        const endInput = document.createElement('input');
        endInput.type = 'time';
        endInput.step = '60';
        [startInput, endInput].forEach((inp) => {
          inp.addEventListener('click', (e) => e.stopPropagation());
          inp.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') { e.preventDefault(); commitExactTime(record); }
            if (e.key === 'Escape') { e.preventDefault(); closeExactTimeEdit(record); }
          });
          inp.addEventListener('blur', () => {
            // Let a click on the *other* time input (or the sep) through
            // without closing/committing mid-edit; only commit once
            // focus actually leaves both fields.
            setTimeout(() => {
              const ed = record._editor;
              if (!ed) return;
              const active = document.activeElement;
              if (active !== ed.startInput && active !== ed.endInput) {
                commitExactTime(record);
              }
            }, 0);
          });
        });
        timeEditEl.appendChild(startInput);
        timeEditEl.appendChild(sep);
        timeEditEl.appendChild(endInput);
        optionsGroup.appendChild(timeEditEl);

        timeLabelEl.addEventListener('click', (e) => {
          e.stopPropagation();
          openExactTimeEdit(record);
        });

        const descEl = document.createElement('textarea');
        descEl.className = 'day-time-grid-event-box-desc-input';
        descEl.placeholder = 'Describe your goal or task…';
        descEl.addEventListener('input', () => {
          record.description = descEl.value;
          EventStore.save(record);
          syncEditingHeight(record);
        });

        // Color badge — now lives in the row itself (type → time →
        // color → trash), not tucked away in the box's corner.
        // Clicking it still opens the swatch grid below it.
        const colorWrap = document.createElement('div');
        colorWrap.className = 'day-time-grid-event-box-color-wrap';

        const colorBtn = document.createElement('button');
        colorBtn.type = 'button';
        colorBtn.className = 'day-time-grid-event-box-color-btn';
        colorBtn.setAttribute('aria-label', 'Color');
        colorBtn.title = 'Pick a color';
        colorBtn.innerHTML =
          '<svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" ' +
          'stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' +
          '<path d="M18.5 2.5a2.12 2.12 0 0 1 3 3L19 8l-3-3 2.5-2.5z"></path>' +
          '<path d="M16 5l3 3"></path>' +
          '<path d="M9.5 12.5L4 18c-1 1-1 3-2 4 1-1 3-1 4-2l5.5-5.5"></path>' +
          '<path d="M6.5 15.5l2 2"></path>' +
          '<path d="M13 8l3 3"></path></svg>';
        colorBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          colorMenu.classList.toggle('open');
        });

        const colorMenu = document.createElement('div');
        colorMenu.className = 'day-time-grid-event-box-color-menu';

        const colorGrid = document.createElement('div');
        colorGrid.className = 'day-time-grid-event-box-color-grid';
        COLOR_SWATCHES.forEach((hex) => {
          const sw = document.createElement('button');
          sw.type = 'button';
          sw.className = 'day-time-grid-event-box-color-swatch';
          sw.style.background = hex;
          sw.dataset.hex = hex;
          sw.setAttribute('aria-label', hex);
          sw.addEventListener('click', (e) => {
            e.stopPropagation();
            selectColor(record, hex);
            colorMenu.classList.remove('open');
          });
          colorGrid.appendChild(sw);
        });
        colorMenu.appendChild(colorGrid);

        colorWrap.appendChild(colorBtn);
        colorWrap.appendChild(colorMenu);

        // Trash icon — sits right after the color picker in the row,
        // always visible instead of buried inside a dropdown.
        const deleteBtn = document.createElement('button');
        deleteBtn.type = 'button';
        deleteBtn.className = 'day-time-grid-event-box-delete-inline-btn';
        deleteBtn.setAttribute('aria-label', 'Delete event');
        deleteBtn.title = 'Delete event';
        deleteBtn.innerHTML =
          '<svg viewBox="0 0 24 24" width="13" height="13" fill="none" ' +
          'stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">' +
          '<polyline points="3 6 5 6 21 6"></polyline>' +
          '<path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"></path>' +
          '<path d="M10 11v6"></path><path d="M14 11v6"></path>' +
          '<path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"></path></svg>';
        deleteBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          deleteRecord(record);
        });

        // Lock button — sits directly to the left of the notify bell
        // (type → time → lock → bell → color → trash). Toggling it on
        // freezes the box in place: attachBoxDrag/attachBoxResize/
        // attachBoxWidthResize (DayTimeGrid) all check record.locked
        // and refuse to start a move/resize while it's set, so the
        // box can no longer be dragged or have its edges dragged —
        // tapping it to reopen the editor (like this) still works.
        const lockBtn = document.createElement('button');
        lockBtn.type = 'button';
        lockBtn.className = 'day-time-grid-event-box-lock-btn';
        lockBtn.setAttribute('aria-label', 'Lock in place');
        lockBtn.title = 'Lock this box in place';
        lockBtn.innerHTML =
          '<svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" ' +
          'stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">' +
          '<rect x="4" y="10" width="16" height="10" rx="2"></rect>' +
          '<path d="M7 10V7a5 5 0 0 1 10 0v3"></path></svg>';
        lockBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          toggleLocked(record);
        });
        optionsGroup.appendChild(lockBtn);

        // Notify bell — sits right before the color picker (type →
        // time → bell → color → trash). Toggling it on requests
        // browser notification permission (if not already granted)
        // and schedules a local reminder for this event's start
        // time; toggling off cancels that reminder. See
        // NotificationScheduler above for the "tab must stay open"
        // caveat.
        const notifyBtn = document.createElement('button');
        notifyBtn.type = 'button';
        notifyBtn.className = 'day-time-grid-event-box-notify-btn';
        notifyBtn.setAttribute('aria-label', 'Notify me');
        notifyBtn.title = 'Tap to toggle · hold to repeat across multiple days';
        notifyBtn.innerHTML =
          '<svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" ' +
          'stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">' +
          '<path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9"></path>' +
          '<path d="M13.73 21a2 2 0 0 1-3.46 0"></path></svg>';

        // Holding the bell (instead of a quick tap) opens the
        // "repeat across days" modal, which copies this box — same
        // time, color, title, description, everything — onto each of
        // the next N days. Once a hold has actually fired and opened
        // the modal, the click that follows on release is suppressed
        // so it doesn't also toggle notify on/off underneath it.
        let notifyHoldTimer = null;
        let notifyHoldFired = false;
        function clearNotifyHold() {
          clearTimeout(notifyHoldTimer);
          notifyHoldTimer = null;
        }
        notifyBtn.addEventListener('pointerdown', (e) => {
          if (e.button !== undefined && e.button !== 0) return;
          notifyHoldFired = false;
          clearNotifyHold();
          notifyHoldTimer = setTimeout(() => {
            notifyHoldFired = true;
            RepeatDaysModal.open(record);
          }, REPEAT_HOLD_MS);
        });
        notifyBtn.addEventListener('pointerup', clearNotifyHold);
        notifyBtn.addEventListener('pointerleave', clearNotifyHold);
        notifyBtn.addEventListener('pointercancel', clearNotifyHold);
        notifyBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          if (notifyHoldFired) { notifyHoldFired = false; return; } // hold already handled it
          toggleNotify(record);
        });
        optionsGroup.appendChild(notifyBtn);

        // Copy button — one tap, right in the toolbar, instead of
        // reaching for Ctrl/Cmd+C or holding the notify bell open
        // the repeat-across-days modal just to get to its "Copy".
        // Same BoxClipboard.set(record) as those two paths use.
        //
        // Holding it instead does the reverse: whatever's currently in
        // BoxClipboard gets pasted INTO this box, overwriting its
        // type/color/description/duration/notify/locked in place —
        // same fields BoxClipboard.set() captures, applied here rather
        // than spawning a brand-new box the way the grid's right-click
        // "Paste" (pasteBoxAt) does. This box's own id/dateKey/
        // startMinutes are left alone, so it stays put in time; only
        // its content and duration are replaced. Mirrors the notify
        // bell's tap-vs-hold split just above, including suppressing
        // the click that follows a fired hold.
        const copyInlineBtn = document.createElement('button');
        copyInlineBtn.type = 'button';
        copyInlineBtn.className = 'day-time-grid-event-box-copy-btn';
        copyInlineBtn.setAttribute('aria-label', 'Copy this box');
        copyInlineBtn.title = 'Tap to copy · hold to paste the copied box here';
        copyInlineBtn.innerHTML =
          '<svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" ' +
          'stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">' +
          '<rect x="9" y="9" width="12" height="12" rx="2"></rect>' +
          '<path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>';
        let copyFlashTimer = null;
        function flashCopyBtn() {
          copyInlineBtn.classList.add('flash');
          clearTimeout(copyFlashTimer);
          copyFlashTimer = setTimeout(() => copyInlineBtn.classList.remove('flash'), 260);
        }

        function pasteClipboardIntoBox() {
          const copied = BoxClipboard.get();
          if (!copied) { toast('Nothing copied yet.'); return; }
          record.type             = copied.type;
          record.color            = copied.color;
          record.description      = copied.description;
          record.durationMinutes  = copied.durationMinutes;
          record.manualLeftUnits  = copied.manualLeftUnits;
          record.manualWidthUnits = copied.manualWidthUnits;
          record.notify           = copied.notify;
          record.locked           = copied.locked;
          EventStore.save(record);

          // Same direct record.el-touching calls commitExactTime uses
          // above for a duration change — these only touch record.el
          // itself (not a cached "which grid" reference), so they're
          // correct whether this box's editor was opened from the day
          // grid or from Week view.
          if (record.el) {
            DayTimeGrid.positionEventBox(record.el, record.startMinutes, record.durationMinutes);
            DayTimeGrid.setNotifyBadge(record, record.notify);
            DayTimeGrid.setLockedState(record, record.locked);
            DayTimeGrid.recomputeOverlapLayout();
          }
          renderBoxFace(record);
          updateTimeLabel(record);

          if (record.notify) NotificationScheduler.schedule(record);
          else NotificationScheduler.unschedule(record);
          syncNotifyUI(record);
          if (lockBtn) lockBtn.classList.toggle('active', !!record.locked);
          flashCopyBtn();
          toast('Pasted into box.');
        }

        let copyHoldTimer = null;
        let copyHoldFired = false;
        function clearCopyHold() {
          clearTimeout(copyHoldTimer);
          copyHoldTimer = null;
        }
        copyInlineBtn.addEventListener('pointerdown', (e) => {
          if (e.button !== undefined && e.button !== 0) return;
          copyHoldFired = false;
          clearCopyHold();
          copyHoldTimer = setTimeout(() => {
            copyHoldFired = true;
            pasteClipboardIntoBox();
          }, REPEAT_HOLD_MS);
        });
        copyInlineBtn.addEventListener('pointerup', clearCopyHold);
        copyInlineBtn.addEventListener('pointerleave', clearCopyHold);
        copyInlineBtn.addEventListener('pointercancel', clearCopyHold);
        copyInlineBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          if (copyHoldFired) { copyHoldFired = false; return; } // hold already handled it
          BoxClipboard.set(record);
          toast('Box copied — right-click the grid to paste it, or hold another box\'s copy button.');
          flashCopyBtn();
        });
        optionsGroup.appendChild(copyInlineBtn);

        optionsGroup.appendChild(colorWrap);
        optionsGroup.appendChild(deleteBtn);
        topRow.appendChild(optionsGroup);

        // "…" button — only ever shown once the box is too narrow to
        // hold the full row (applyCompactState above flips this on).
        // Sits after optionsGroup in the DOM so that when the group
        // gets moved out into moreMenu, this is the one thing left
        // behind in the top row next to the type field.
        const moreWrap = document.createElement('div');
        moreWrap.className = 'day-time-grid-event-box-more-wrap';
        moreWrap.style.display = 'none';

        const moreBtn = document.createElement('button');
        moreBtn.type = 'button';
        moreBtn.className = 'day-time-grid-event-box-more-btn';
        moreBtn.setAttribute('aria-label', 'More options');
        moreBtn.title = 'Time, lock, notify, color, copy, delete';
        moreBtn.innerHTML =
          '<svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor">' +
          '<circle cx="5" cy="12" r="2.1"></circle>' +
          '<circle cx="12" cy="12" r="2.1"></circle>' +
          '<circle cx="19" cy="12" r="2.1"></circle></svg>';
        moreBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          moreMenu.classList.toggle('open');
        });

        const moreMenu = document.createElement('div');
        moreMenu.className = 'day-time-grid-event-box-more-menu';

        moreWrap.appendChild(moreBtn);
        moreWrap.appendChild(moreMenu);
        topRow.appendChild(moreWrap);

        editorEl.appendChild(topRow);
        editorEl.appendChild(descEl);
        boxEl.appendChild(editorEl);

        record._editor = {
          editorEl, topRow, typeWrap, typeBtn, typeLabelEl, typeMenu, customInput,
          descEl, colorWrap, colorBtn, colorMenu, timeLabelEl, timeEditEl, startInput, endInput,
          deleteBtn, notifyBtn, lockBtn,
          optionsGroup, moreWrap, moreBtn, moreMenu, isCompact: false,
        };

        // Wire this box into the shared ResizeObserver so its "…"
        // state tracks its actual rendered width — width changes
        // whenever it's dragged/resized or the overlap layout gives
        // it more or less room, not just on initial open.
        if (compactObserver) {
          compactRecordByEl.set(boxEl, record);
          compactObserver.observe(boxEl);
        }
      }

      // Formats a minutes-since-midnight value as "9:05 AM" style text.
      function formatClockTime(totalMinutes) {
        let h = Math.floor(totalMinutes / 60) % 24;
        const m = Math.round(totalMinutes % 60);
        const period = h >= 12 ? 'PM' : 'AM';
        let h12 = h % 12;
        if (h12 === 0) h12 = 12;
        return h12 + ':' + String(m).padStart(2, '0') + ' ' + period;
      }

      // "9:05 AM" style is nice to read but <input type="time"> needs
      // 24-hour "HH:MM" for both its value and its parsed input.
      function minutesToHHMM(totalMinutes) {
        const h = Math.floor(totalMinutes / 60) % 24;
        const m = Math.round(totalMinutes % 60);
        return String(h).padStart(2, '0') + ':' + String(m).padStart(2, '0');
      }
      function hhmmToMinutes(hhmm) {
        const parts = String(hhmm).split(':');
        const h = parseInt(parts[0], 10);
        const m = parseInt(parts[1], 10);
        if (Number.isNaN(h) || Number.isNaN(m)) return null;
        return h * 60 + m;
      }

      // Swaps the plain "start – end" label for the two live <input
      // type="time"> fields, pre-filled with the record's current
      // exact values (down to the minute, whatever they are —
      // there's nothing to snap here, this just mirrors what's
      // already stored).
      function openExactTimeEdit(record) {
        const ed = record._editor;
        if (!ed) return;
        ed.startInput.value = minutesToHHMM(record.startMinutes);
        ed.endInput.value   = minutesToHHMM(record.startMinutes + record.durationMinutes);
        ed.timeLabelEl.style.display = 'none';
        ed.timeEditEl.style.display  = 'flex';
        ed.startInput.focus();
        // .focus() alone doesn't reliably pop the native wheel picker on
        // iOS Safari — showPicker() is the explicit call that forces it
        // open (iOS 16.4+ / modern Chrome). Wrapped defensively since
        // showPicker isn't universal everywhere and can throw if called
        // outside a direct user-gesture stack.
        try { ed.startInput.showPicker && ed.startInput.showPicker(); } catch (err) {}
      }

      function closeExactTimeEdit(record) {
        const ed = record._editor;
        if (!ed) return;
        ed.timeEditEl.style.display  = 'none';
        ed.timeLabelEl.style.display = '';
      }

      // Commits whatever's typed in the two fields EXACTLY as entered
      // — no rounding to a 15-minute grid. That snapping only applies
      // to dragging/resizing the box itself (attachBoxDrag/
      // attachBoxResize's own SNAP_MIN, untouched by this); typing an
      // exact time here is the deliberate way to land on a minute
      // in-between those steps.
      function commitExactTime(record) {
        const ed = record._editor;
        if (!ed) return;
        const startMin = hhmmToMinutes(ed.startInput.value);
        const endMin   = hhmmToMinutes(ed.endInput.value);

        if (startMin !== null) {
          let duration = record.durationMinutes;
          if (endMin !== null) {
            duration = endMin - startMin;
            // End before/equal to start (e.g. typed backwards, or an
            // overnight span this app doesn't otherwise support) —
            // rather than silently accepting a negative/zero length,
            // just hold the box's existing duration.
            if (duration <= 0) duration = record.durationMinutes;
          }
          record.startMinutes    = Math.max(0, Math.min(24 * 60 - 5, startMin));
          record.durationMinutes = Math.max(5, duration);

          if (record.el) {
            DayTimeGrid.positionEventBox(record.el, record.startMinutes, record.durationMinutes);
            DayTimeGrid.recomputeOverlapLayout();
          }
          EventStore.save(record);
        }

        updateTimeLabel(record);
        closeExactTimeEdit(record);
      }

      // Keeps the "when" readout next to the type field in sync with
      // whatever the box is currently set to — called once when the
      // editor opens, and again on every drag/resize move so it live-
      // updates as the box is repositioned or resized.
      // Measures how tall the editor's actual content needs — the
      // top row of controls plus whatever the description really
      // wraps to — and only grows the box past its own time-slot
      // height when that content genuinely doesn't fit. An empty
      // description with a short event never gets pushed to some
      // flat "big enough for anything" size; it only grows exactly
      // as much as the text in it requires.
      function syncEditingHeight(record) {
        const boxEl = record && record.el;
        const ed = record && record._editor;
        if (!boxEl || !ed || !boxEl.classList.contains('editing')) return;

        const topRow = ed.editorEl.querySelector('.day-time-grid-event-box-editor-toprow');
        const topRowH = topRow ? topRow.getBoundingClientRect().height : 0;
        const TOPROW_MARGIN_BOTTOM = 4; // matches .day-time-grid-event-box-editor-toprow
        const EDITOR_PADDING_V     = 6 + 8; // matches .day-time-grid-event-box-editor padding

        // Measure the textarea's real wrapped content height —
        // temporarily take it out of the flex layout so scrollHeight
        // reflects the text itself, not whatever space flex handed it.
        const desc = ed.descEl;
        const prevFlex   = desc.style.flex;
        const prevHeight = desc.style.height;
        desc.style.flex   = 'none';
        desc.style.height = 'auto';
        const descContentH = desc.scrollHeight;
        desc.style.flex   = prevFlex;
        desc.style.height = prevHeight;

        const MIN_DESC_H = 16; // just enough room for one line, even when empty
        const neededDescH = Math.max(descContentH, MIN_DESC_H);

        const requiredTotal = EDITOR_PADDING_V + topRowH + TOPROW_MARGIN_BOTTOM + neededDescH;

        // Never shrink below the height this box already has for its
        // actual time slot — only grow past it, and only as far as
        // the content genuinely needs.
        const naturalHeight = parseFloat(boxEl.style.height) || 0;
        const finalHeight = Math.max(naturalHeight, requiredTotal);

        boxEl.style.minHeight = finalHeight + 'px';
      }

      function updateTimeLabel(record) {
        if (!record || !record._editor || !record._editor.timeLabelEl) return;
        const start = record.startMinutes;
        const end = record.startMinutes + record.durationMinutes;
        record._editor.timeLabelEl.textContent = formatClockTime(start) + ' – ' + formatClockTime(end);
      }

      // Cheap per-frame update for the compact box's time line — unlike
      // renderBoxFace() (which rebuilds the whole content wrapper) this
      // only touches the one text node, so it's safe to call on every
      // pointermove while dragging/resizing without any extra churn.
      function updateFaceTime(record) {
        if (!record || !record.el) return;
        const timeEl = record.el.querySelector('.day-time-grid-event-box-facetime');
        if (!timeEl) return;
        timeEl.textContent =
          formatClockTime(record.startMinutes) + ' – ' + formatClockTime(record.startMinutes + record.durationMinutes);
      }

      function selectType(record, label) {
        record.type = label;
        EventStore.save(record);
        const ed = record._editor;
        if (!ed) return;
        ed.typeLabelEl.textContent = label;
        Array.from(ed.typeMenu.querySelectorAll('.day-time-grid-event-box-type-option')).forEach((opt) => {
          opt.classList.toggle('selected', opt.textContent === label);
        });
      }

      function selectColor(record, hex) {
        record.color = hex;
        record.el.style.background = hex;
        EventStore.save(record);
        const ed = record._editor;
        if (!ed) return;
        Array.from(ed.colorMenu.querySelectorAll('.day-time-grid-event-box-color-swatch')).forEach((sw) => {
          sw.classList.toggle('selected', sw.dataset.hex === hex);
        });
      }

      // Reflects record.notify onto both the editor's bell button
      // (filled amber when on) and the always-visible badge on the
      // box's own corner (so it still reads once the editor closes).
      function syncNotifyUI(record) {
        const ed = record._editor;
        if (ed && ed.notifyBtn) ed.notifyBtn.classList.toggle('active', !!record.notify);
        DayTimeGrid.setNotifyBadge(record, record.notify);
      }

      // Turning the bell on asks for browser notification permission
      // the first time (a no-op if already granted/denied); if the
      // person denies it, the toggle stays off rather than silently
      // pretending it's on. Turning it off just cancels whatever
      // reminder was scheduled.
      // The bell is a plain on/off checkbox first — it flips and the
      // badge appears immediately, no matter what. Browser
      // notification permission is requested in the background
      // *in addition to* that (so the reminder can actually fire),
      // but a slow/blocked/unsupported permission response no longer
      // holds the checkbox itself hostage — that was the bug where
      // clicking the bell looked like it did nothing.
      function toggleNotify(record) {
        record.notify = !record.notify;
        EventStore.save(record);
        syncNotifyUI(record);

        // Click feedback — a quick ring wiggle so pressing the bell
        // visibly does something even in the split second before the
        // permission prompt (if any) shows up.
        const ed = record._editor;
        if (ed && ed.notifyBtn) {
          const btn = ed.notifyBtn;
          btn.classList.remove('ringing');
          void btn.offsetWidth; // force reflow so repeated clicks restart the animation
          btn.classList.add('ringing');
          setTimeout(() => btn.classList.remove('ringing'), 420);
        }

        if (record.notify) {
          NotificationScheduler.requestPermission().then((permission) => {
            if (permission === 'granted') {
              NotificationScheduler.schedule(record);
              PushNotifications.ensureSubscribed();
            }
          });
        } else {
          NotificationScheduler.unschedule(record);
        }
      }

      // Locking a box just flips a flag: attachBoxDrag/attachBoxResize/
      // attachBoxWidthResize (in DayTimeGrid) all check record.locked
      // directly and bail out of the actual drag before anything
      // moves, so this function itself only needs to persist the
      // flag and refresh the button + corner badge + handle styling.
      function toggleLocked(record) {
        record.locked = !record.locked;
        EventStore.save(record);
        const ed = record._editor;
        if (ed && ed.lockBtn) ed.lockBtn.classList.toggle('active', !!record.locked);
        DayTimeGrid.setLockedState(record, record.locked);
      }

      // Paints a record's current type/description/color onto its
      // compact box face. Pure rendering, no side effects — used both
      // when editing ends AND when DayTimeGrid repaints persisted
      // events on open (nothing to "just save" there, it's already
      // sitting in storage).
      //
      // Only ever touches .day-time-grid-event-box-content, never
      // record.el directly — record.el also carries the resize
      // handles and (once built) the editor, as siblings of that
      // wrapper, and those must never get wiped by a text re-render.
      function renderBoxFace(record) {
        if (!record || !record.el) return;
        const contentEl = record.el.querySelector('.day-time-grid-event-box-content');
        if (!contentEl) return;
        const desc = (record.description || '').trim();

        contentEl.textContent = ''; // clear whatever was there (incl. the initial "New Event")

        // Always-visible time line — sits above the type/label, on
        // both the compact box and while editing, so the "when" is
        // never hidden away inside the popup.
        const timeLine = document.createElement('div');
        timeLine.className = 'day-time-grid-event-box-facetime';
        timeLine.textContent =
          formatClockTime(record.startMinutes) + ' – ' + formatClockTime(record.startMinutes + record.durationMinutes);
        contentEl.appendChild(timeLine);

        const typeLine = document.createElement('div');
        typeLine.className = 'day-time-grid-event-box-type';
        typeLine.textContent = record.type || 'New Event';
        contentEl.appendChild(typeLine);

        if (desc) {
          const descLine = document.createElement('div');
          descLine.className = 'day-time-grid-event-box-desc';
          descLine.textContent = desc;
          contentEl.appendChild(descLine);
        }

        if (record.color) record.el.style.background = record.color;
      }

      // The actual "collapse back to a compact box" step, run whenever
      // editing ends (data's already been saved live field-by-field —
      // this repaints the compact face and plays the settle pulse so
      // closing the editor visibly reads as the box locking shut).
      function commitRecordToBox(record) {
        if (!record || !record.el) return;
        EventStore.save(record);
        renderBoxFace(record);

        record.el.classList.remove('just-saved');
        // Force reflow so re-triggering the animation on repeated
        // edits actually restarts it instead of being a no-op because
        // the class never left.
        void record.el.offsetWidth;
        record.el.classList.add('just-saved');
        setTimeout(() => {
          if (record.el) record.el.classList.remove('just-saved');
        }, 320);
      }

      function open(record) {
        if (currentRecord && currentRecord !== record) close();
        if (!record._editor) buildInlineEditor(record);
        currentRecord = record;
        const ed = record._editor;

        // Reopening an existing box has to show what's actually saved
        // on it, not wipe it back to defaults. A brand-new box simply
        // has no type/color/description yet, so this still lands on
        // the same first-option defaults it always did.
        ed.descEl.value = record.description || '';

        const initialType = record.type || PREFIXED_TYPES[0];
        selectType(record, initialType);
        ed.customInput.value = PREFIXED_TYPES.includes(initialType) ? '' : initialType;
        ed.typeMenu.classList.remove('open');

        selectColor(record, record.color || COLOR_SWATCHES[0]);
        ed.colorMenu.classList.remove('open');
        ed.moreMenu.classList.remove('open');

        syncNotifyUI(record);
        if (ed.lockBtn) ed.lockBtn.classList.toggle('active', !!record.locked);

        updateTimeLabel(record);

        record.el.classList.add('editing');
        syncEditingHeight(record);
        // Let the box-create confirm-flash finish before stealing
        // focus — avoids the keyboard popping up mid-animation on
        // mobile.
        setTimeout(() => ed.descEl.focus(), 260);
      }

      function close() {
        if (!currentRecord) return;
        const record = currentRecord;
        if (record._editor && record._editor.timeEditEl.style.display !== 'none') {
          commitExactTime(record);
        }
        commitRecordToBox(record);
        if (record.el) {
          record.el.classList.remove('editing');
          record.el.style.minHeight = '';
        }
        if (record._editor) {
          record._editor.typeMenu.classList.remove('open');
          record._editor.colorMenu.classList.remove('open');
          record._editor.moreMenu.classList.remove('open');
        }
        currentRecord = null;
      }

      // Removes the record from EventStore (synced straight to the
      // server, no local copy), detaches the box from the grid, then
      // asks DayTimeGrid to relayout whatever's left — deleting an
      // event can free up column space for whatever it used to
      // overlap with.
      function deleteRecord(record) {
        if (!record) return;
        const wasCurrent = record === currentRecord;
        NotificationScheduler.unschedule(record);
        EventStore.remove(record);
        if (record.el) {
          if (compactObserver) compactObserver.unobserve(record.el);
          record.el.remove();
          record.el = null;
        }
        DayTimeGrid.recomputeOverlapLayout();
        if (wasCurrent) currentRecord = null;
      }

      // Tapping anywhere outside the currently-open box closes it
      // (committing whatever was typed). Tapping inside the box but
      // outside an open dropdown closes just that dropdown, same
      // convention as every other menu in this file.
      document.addEventListener('click', (e) => {
        if (!currentRecord || !currentRecord._editor) return;
        const ed = currentRecord._editor;
        if (ed.typeMenu.classList.contains('open') && !ed.typeWrap.contains(e.target)) {
          ed.typeMenu.classList.remove('open');
        }
        if (ed.colorMenu.classList.contains('open') && !ed.colorWrap.contains(e.target)) {
          ed.colorMenu.classList.remove('open');
        }
        if (ed.moreMenu.classList.contains('open') && !ed.moreWrap.contains(e.target)) {
          ed.moreMenu.classList.remove('open');
        }
        if (ed.timeEditEl.style.display !== 'none' && !ed.timeEditEl.contains(e.target)) {
          commitExactTime(currentRecord);
        }
        if (currentRecord.el && !currentRecord.el.contains(e.target)) {
          close();
        }
      });

      // Escape backs out one layer at a time: an open dropdown closes
      // first, and only a second Escape (or a first one with nothing
      // open) closes the editor itself.
      document.addEventListener('keydown', (e) => {
        if (e.key !== 'Escape' || !currentRecord || !currentRecord._editor) return;
        const ed = currentRecord._editor;
        if (ed.typeMenu.classList.contains('open')) {
          ed.typeMenu.classList.remove('open');
          return;
        }
        if (ed.colorMenu.classList.contains('open')) {
          ed.colorMenu.classList.remove('open');
          return;
        }
        if (ed.moreMenu.classList.contains('open')) {
          ed.moreMenu.classList.remove('open');
          return;
        }
        close();
      });

      // Ctrl/Cmd+C copies the currently-open box's appearance into
      // BoxClipboard — the same thing the "Copy" button in the
      // repeat-across-days modal does (RepeatDaysModal.copyBox,
      // below), just reachable straight from the keyboard while a
      // box is open for editing. Skipped whenever focus is inside
      // one of the editor's own text fields (title/description) so
      // normal text-copy still works there — otherwise selecting
      // text inside the box and pressing Ctrl+C would silently copy
      // the whole box instead of just the selected text.
      document.addEventListener('keydown', (e) => {
        if (e.key !== 'c' && e.key !== 'C') return;
        if (!(e.ctrlKey || e.metaKey)) return;
        if (!currentRecord || !currentRecord._editor) return;
        const active = document.activeElement;
        const isTextField = active && (
          active.tagName === 'INPUT' ||
          active.tagName === 'TEXTAREA' ||
          active.isContentEditable
        );
        if (isTextField) return; // let the browser's normal text copy happen
        e.preventDefault();
        BoxClipboard.set(currentRecord);
        toast('Box copied — right-click the grid to paste it.');
      });

      function isOpen() { return !!currentRecord; }

      // Drops the open-editor reference without saving/committing
      // anything — used only when EventStore.undoLast() has just
      // pulled the record's data (and its whole date's boxes) out
      // from under whatever's currently open, so this editor doesn't
      // keep writing through a now-stale object.
      function forgetCurrent() { currentRecord = null; }

      return { open, close, renderBoxFace, updateTimeLabel, updateFaceTime, isOpen, forgetCurrent };
    })();

    const RepeatDaysModal = (() => {
      const cfg = { MIN_DAYS: 1, MAX_DAYS: 90, DEFAULT_DAYS: 7 };
      const MODES = { COUNT: 'count', SPECIFIC: 'specific' };
      let overlayEl = null;
      let countInput = null;
      let currentRecord = null;
      let mode = MODES.COUNT;

      // Mode-tab elements + the two body sections they toggle between.
      let countTab = null, specificTab = null;
      let stepperWrap = null, calendarWrap = null;
      let subEl = null;

      // Calendar-picker state — its own little month view, independent
      // of the main app calendar's viewYear/viewMonth.
      let calYear = 0, calMonth = 0;
      let calMonthLabel = null, calGridEl = null, selectedCountEl = null;
      const selectedDates = new Set(); // dateKeys, e.g. "2026-09-14"

      function ensureBuilt() {
        if (overlayEl) return;

        overlayEl = document.createElement('div');
        overlayEl.className = 'repeat-days-overlay';

        const card = document.createElement('div');
        card.className = 'repeat-days-card';

        const title = document.createElement('div');
        title.className = 'repeat-days-title';
        title.textContent = 'Repeat this alert';

        subEl = document.createElement('div');
        subEl.className = 'repeat-days-sub';

        // --- Mode tabs ---
        const tabs = document.createElement('div');
        tabs.className = 'repeat-days-mode-tabs';

        countTab = document.createElement('button');
        countTab.type = 'button';
        countTab.className = 'repeat-days-mode-tab';
        countTab.textContent = 'Next N days';
        countTab.addEventListener('click', () => setMode(MODES.COUNT));

        specificTab = document.createElement('button');
        specificTab.type = 'button';
        specificTab.className = 'repeat-days-mode-tab';
        specificTab.textContent = 'Specific days';
        specificTab.addEventListener('click', () => setMode(MODES.SPECIFIC));

        tabs.appendChild(countTab);
        tabs.appendChild(specificTab);

        // --- Mode 1: stepper (original behavior) ---
        stepperWrap = document.createElement('div');
        stepperWrap.className = 'repeat-days-stepper-wrap';

        const stepper = document.createElement('div');
        stepper.className = 'repeat-days-stepper';

        const minusBtn = document.createElement('button');
        minusBtn.type = 'button';
        minusBtn.className = 'repeat-days-stepper-btn';
        minusBtn.setAttribute('aria-label', 'Fewer days');
        minusBtn.textContent = '\u2212';
        minusBtn.addEventListener('click', () => setCount(currentCount() - 1));

        const countWrap = document.createElement('div');
        countWrap.className = 'repeat-days-count-wrap';

        countInput = document.createElement('input');
        countInput.type = 'number';
        countInput.className = 'repeat-days-count';
        countInput.min = String(cfg.MIN_DAYS);
        countInput.max = String(cfg.MAX_DAYS);
        countInput.value = String(cfg.DEFAULT_DAYS);
        countInput.addEventListener('input', () => setCount(currentCount()));

        const countLabel = document.createElement('div');
        countLabel.className = 'repeat-days-count-label';
        countLabel.textContent = 'days';

        countWrap.appendChild(countInput);
        countWrap.appendChild(countLabel);

        const plusBtn = document.createElement('button');
        plusBtn.type = 'button';
        plusBtn.className = 'repeat-days-stepper-btn';
        plusBtn.setAttribute('aria-label', 'More days');
        plusBtn.textContent = '+';
        plusBtn.addEventListener('click', () => setCount(currentCount() + 1));

        stepper.appendChild(minusBtn);
        stepper.appendChild(countWrap);
        stepper.appendChild(plusBtn);
        stepperWrap.appendChild(stepper);

        // --- Mode 2: pick specific days off a small calendar ---
        calendarWrap = document.createElement('div');
        calendarWrap.className = 'repeat-days-calendar-wrap';

        const calNav = document.createElement('div');
        calNav.className = 'repeat-days-cal-nav';

        const calPrevBtn = document.createElement('button');
        calPrevBtn.type = 'button';
        calPrevBtn.className = 'repeat-days-cal-nav-btn';
        calPrevBtn.setAttribute('aria-label', 'Previous month');
        calPrevBtn.textContent = '\u2039';
        calPrevBtn.addEventListener('click', () => navigateCalMonth(-1));

        calMonthLabel = document.createElement('div');
        calMonthLabel.className = 'repeat-days-cal-month';

        const calNextBtn = document.createElement('button');
        calNextBtn.type = 'button';
        calNextBtn.className = 'repeat-days-cal-nav-btn';
        calNextBtn.setAttribute('aria-label', 'Next month');
        calNextBtn.textContent = '\u203a';
        calNextBtn.addEventListener('click', () => navigateCalMonth(1));

        calNav.appendChild(calPrevBtn);
        calNav.appendChild(calMonthLabel);
        calNav.appendChild(calNextBtn);

        const calWeekdays = document.createElement('div');
        calWeekdays.className = 'repeat-days-cal-weekdays';
        (t('weekdays') || ['Mon','Tue','Wed','Thu','Fri','Sat','Sun']).forEach((label) => {
          const wd = document.createElement('div');
          wd.className = 'repeat-days-cal-weekday';
          wd.textContent = label;
          calWeekdays.appendChild(wd);
        });

        calGridEl = document.createElement('div');
        calGridEl.className = 'repeat-days-cal-grid';

        selectedCountEl = document.createElement('div');
        selectedCountEl.className = 'repeat-days-selected-count';

        calendarWrap.appendChild(calNav);
        calendarWrap.appendChild(calWeekdays);
        calendarWrap.appendChild(calGridEl);
        calendarWrap.appendChild(selectedCountEl);

        const actions = document.createElement('div');
        actions.className = 'repeat-days-actions';

        // Copies this box's appearance (title, color, description,
        // duration, size/position, notify/lock) into BoxClipboard —
        // see the module right above DayTimeGrid. Doesn't touch the
        // count/specific-days pickers above it at all; it's a fully
        // separate action from "Save".
        const copyBtn = document.createElement('button');
        copyBtn.type = 'button';
        copyBtn.className = 'copy';
        copyBtn.textContent = 'Copy';
        copyBtn.addEventListener('click', copyBox);

        const cancelBtn = document.createElement('button');
        cancelBtn.type = 'button';
        cancelBtn.textContent = 'Cancel';
        cancelBtn.addEventListener('click', close);

        const saveBtn = document.createElement('button');
        saveBtn.type = 'button';
        saveBtn.className = 'primary';
        saveBtn.textContent = 'Save';
        saveBtn.addEventListener('click', save);

        actions.appendChild(copyBtn);
        actions.appendChild(cancelBtn);
        actions.appendChild(saveBtn);

        card.appendChild(title);
        card.appendChild(subEl);
        card.appendChild(tabs);
        card.appendChild(stepperWrap);
        card.appendChild(calendarWrap);
        card.appendChild(actions);
        overlayEl.appendChild(card);
        document.body.appendChild(overlayEl);

        // Tapping the dimmed backdrop (not the card itself) cancels,
        // same convention as the day-detail modal's own overlay.
        overlayEl.addEventListener('click', (e) => { if (e.target === overlayEl) close(); });
      }

      function currentCount() {
        const n = parseInt(countInput.value, 10);
        return isNaN(n) ? cfg.DEFAULT_DAYS : n;
      }

      function setCount(n) {
        const clamped = Math.max(cfg.MIN_DAYS, Math.min(cfg.MAX_DAYS, n));
        countInput.value = String(clamped);
      }

      function setMode(next) {
        mode = next;
        countTab.classList.toggle('active', mode === MODES.COUNT);
        specificTab.classList.toggle('active', mode === MODES.SPECIFIC);
        stepperWrap.classList.toggle('hidden', mode !== MODES.COUNT);
        calendarWrap.classList.toggle('visible', mode === MODES.SPECIFIC);
        subEl.textContent = mode === MODES.COUNT
          ? 'Copies this box — same time, title, color and everything — onto each of the next however many days.'
          : 'Copies this box onto each day you pick below. Tap a day to select or deselect it.';
      }

      // Parses a "YYYY-MM-DD" dateKey and returns the dateKey that's
      // `offset` days later — routed through a real Date object so
      // month/year rollovers (end of month, leap years) are handled
      // correctly instead of hand-rolled.
      function dateKeyPlusDays(dateKey, offset) {
        const [y, m, d] = dateKey.split('-').map(Number);
        const dt = new Date(y, m - 1, d);
        dt.setDate(dt.getDate() + offset);
        return EventStore.dateKeyFor(dt.getFullYear(), dt.getMonth(), dt.getDate());
      }

      function navigateCalMonth(delta) {
        calMonth += delta;
        if (calMonth < 0) { calMonth = 11; calYear--; }
        if (calMonth > 11) { calMonth = 0; calYear++; }
        renderCalendar();
      }

      function renderCalendar() {
        if (!calGridEl) return;
        const dict = I18N[settings.language] || I18N.en;
        const monthName = (dict.months || I18N.en.months)[calMonth];
        calMonthLabel.textContent = monthName + ' ' + calYear;

        calGridEl.innerHTML = '';

        const todayDt   = new Date();
        const todayKey  = EventStore.dateKeyFor(todayDt.getFullYear(), todayDt.getMonth(), todayDt.getDate());
        const firstDow  = new Date(calYear, calMonth, 1).getDay();
        const firstIdx  = mondayIdx(firstDow);
        const daysInMonth = new Date(calYear, calMonth + 1, 0).getDate();

        for (let i = 0; i < firstIdx; i++) {
          const filler = document.createElement('div');
          filler.className = 'repeat-days-cal-cell empty';
          calGridEl.appendChild(filler);
        }

        for (let d = 1; d <= daysInMonth; d++) {
          const dateKey = EventStore.dateKeyFor(calYear, calMonth, d);
          const cell = document.createElement('div');
          cell.className = 'repeat-days-cal-cell';
          cell.textContent = String(d);
          if (dateKey === todayKey) cell.classList.add('today');
          if (selectedDates.has(dateKey)) cell.classList.add('selected');
          cell.addEventListener('click', () => {
            if (selectedDates.has(dateKey)) selectedDates.delete(dateKey);
            else selectedDates.add(dateKey);
            cell.classList.toggle('selected');
            updateSelectedCount();
          });
          calGridEl.appendChild(cell);
        }

        updateSelectedCount();
      }

      function updateSelectedCount() {
        if (!selectedCountEl) return;
        const n = selectedDates.size;
        selectedCountEl.textContent = n === 0
          ? 'No days selected yet'
          : n + ' day' + (n === 1 ? '' : 's') + ' selected';
      }

      function open(record) {
        if (!record) return;
        ensureBuilt();
        currentRecord = record;
        setCount(cfg.DEFAULT_DAYS);
        selectedDates.clear();
        const [y, m] = record.dateKey.split('-').map(Number);
        calYear = y;
        calMonth = m - 1;
        renderCalendar();
        // Holding the notify bell is how this modal gets opened at
        // all, so it should land straight on the "Specific days"
        // calendar instead of the "Next N days" stepper — that's
        // almost always what a hold-to-open is reaching for.
        setMode(MODES.SPECIFIC);
        overlayEl.classList.add('open');
      }

      function close() {
        if (overlayEl) overlayEl.classList.remove('open');
        currentRecord = null;
      }

      // Copies the held box's whole appearance — title, color,
      // description, duration, size/position, notify/lock — into
      // BoxClipboard, ready to paste onto any hour slot on the day
      // grid via right-click. Only the start time/day is left out,
      // since paste always picks that fresh from wherever's clicked.
      function copyBox() {
        if (!currentRecord) return;
        BoxClipboard.set(currentRecord);
        toast('Box copied — right-click the grid to paste it.');
        close();
      }

      // Shared by both modes — pushes a fresh independent copy of
      // `record` onto `dateKey`, same as the original stepper save()
      // always did.
      function copyRecordOnto(record, dateKey, touchedDates, newRecordsByDate) {
        const newRecord = {
          id: (window.crypto && crypto.randomUUID) ? crypto.randomUUID()
              : 'ev_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 8),
          dateKey,
          startMinutes: record.startMinutes,
          durationMinutes: record.durationMinutes,
          type: record.type || '',
          color: record.color || '',
          description: record.description || '',
          manualLeftUnits: record.manualLeftUnits != null ? record.manualLeftUnits : null,
          manualWidthUnits: record.manualWidthUnits != null ? record.manualWidthUnits : null,
          notify: !!record.notify,
          locked: !!record.locked,
          el: null,
        };
        // Straight into EventStore's own live array for this date —
        // the date is correctly cached the instant we confirm, not
        // just once it happens to be the day currently open.
        EventStore.getForDate(dateKey).push(newRecord);
        touchedDates.add(dateKey);
        (newRecordsByDate[dateKey] = newRecordsByDate[dateKey] || []).push(newRecord);
        if (newRecord.notify) NotificationScheduler.schedule(newRecord);
      }

      async function save() {
        const record = currentRecord;
        if (!record) return;

        // Specific-days mode: require at least one pick instead of
        // silently closing with nothing copied.
        if (mode === MODES.SPECIFIC && selectedDates.size === 0) {
          toast('Pick at least one day first.', true);
          return;
        }

        const dateKeys = mode === MODES.COUNT
          ? Array.from({ length: currentCount() }, (_, i) => dateKeyPlusDays(record.dateKey, i + 1))
          // The original day already has this event — copying it onto
          // itself again would just duplicate the box, so it's skipped
          // even if picked.
          : Array.from(selectedDates).filter((k) => k !== record.dateKey);

        close();

        if (!dateKeys.length) return;

        // Same reasoning as saveEvents (talk-ai.js) above — wait for
        // the initial server load so getForDate()/getAllSnapshot()
        // merge with what's already there instead of wiping it.
        await EventStore.whenReady();

        const openDateKey = (() => {
          try {
            if (DayViewState.get() !== DayViewState.STATES.LOCKED) return null;
            const sel = SelectedDayState.get();
            return EventStore.dateKeyFor(sel.year, sel.month, sel.day);
          } catch { return null; }
        })();

        const touchedDates = new Set();
        const newRecordsByDate = {}; // just this call's new boxes, for the pop-in paint below

        dateKeys.forEach((dateKey) => copyRecordOnto(record, dateKey, touchedDates, newRecordsByDate));

        if (!touchedDates.size) return;

        const snapshot = EventStore.getAllSnapshot();
        const entries = {};
        touchedDates.forEach((dateKey) => { entries[dateKey] = snapshot[dateKey] || []; });

        try {
          await fetch('/api/events', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ entries }),
          });
          const n = touchedDates.size;
          toast('Copied to ' + n + (n === 1 ? ' day.' : ' days.'));
        } catch {
          toast('Save failed — try again.', true);
        }

        // If the day currently open is one we just added to, paint in
        // the new box with the same pop-in animation new AI-created
        // boxes get — see renderNewEventsForDate's own comment.
        if (openDateKey && newRecordsByDate[openDateKey] && typeof DayTimeGrid !== 'undefined' && DayTimeGrid.renderNewEventsForDate) {
          DayTimeGrid.renderNewEventsForDate(openDateKey, newRecordsByDate[openDateKey]);
        }
        // Same idea, but for the week view: any of the copied-to dates
        // (not just a single "open" day) might currently be showing
        // as one of its visible columns, so check every touched date
        // rather than just one.
        if (typeof WeekView !== 'undefined' && WeekView.isOpen() && WeekView.renderNewEventsForDate) {
          Object.keys(newRecordsByDate).forEach((dateKey) => {
            WeekView.renderNewEventsForDate(dateKey, newRecordsByDate[dateKey]);
          });
        }
      }

      return { open, close };
    })();

    // Every newly-created box (step 6) immediately opens the editor —
    // matches the spec: hold -> box appears -> popup opens to name/
    // style it.
    DayTimeGrid.onBoxCreated((record) => EventEditor.open(record));

    const SettingsButtonFade = (() => {
      let btnEl = null;
      function apply(state) {
        if (!btnEl) return;
        const isCalendar = state === DayViewState.STATES.CALENDAR;
        btnEl.style.opacity = isCalendar ? '' : '0';
        btnEl.style.pointerEvents = isCalendar ? '' : 'none';
        btnEl.style.transition = 'opacity 220ms ease';
      }
      function init() {
        btnEl = document.getElementById('openSettingsBtn');
        apply(DayViewState.get());
        DayViewState.onChange((next) => apply(next));
      }
      return { init };
    })();
    SettingsButtonFade.init();

    onIdle(function restoreScheduledNotifications() {
      if (!NotificationScheduler.supported() || !NotificationScheduler.permissionGranted()) return;
      try {
        const all = JSON.parse(localStorage.getItem('habitcal_events_cache') || '{}');
        Object.keys(all).forEach((dateKey) => {
          (all[dateKey] || []).forEach((rec) => {
            if (rec && rec.notify) NotificationScheduler.schedule(Object.assign({ dateKey }, rec));
          });
        });
      } catch { /* ignore malformed/missing storage */ }
    }, 2500);

    (async function autoLockYesterday() {
      await EventStore.whenReady();

      const now = new Date();
      const y = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      y.setDate(y.getDate() - 1);
      const yesterdayKey = EventStore.dateKeyFor(y.getFullYear(), y.getMonth(), y.getDate());

      const records = EventStore.getForDate(yesterdayKey);
      if (!records.length) return; // nothing on the board — nothing to lock, no toast

      const allAlreadyLocked = records.every((r) => r.locked);
      if (allAlreadyLocked) return; // already fully locked — leave it alone, no toast

      toast('Locking yesterday\u2019s boxes\u2026');

      records.forEach((r) => {
        r.locked = true;
        EventStore.save(r);
      });

      // If yesterday happens to already be painted on screen (the day
      // view left open on it, or the week view spanning it), repaint
      // so the padlocks show up right away rather than waiting for
      // some unrelated redraw to catch up.
      if (typeof DayTimeGrid !== 'undefined' && DayTimeGrid.forceRerenderDate) {
        DayTimeGrid.forceRerenderDate(yesterdayKey);
      }

      EventStore.flushNow().then(() => {
        toast('All of yesterday\u2019s boxes are locked!');
      });
    })();

    const TalkAI = (() => {
      const btn = document.getElementById('talkAiBtn');
      const statusEl = document.getElementById('talkAiStatus');
      const confirmEl = document.getElementById('talkAiConfirm');
      const confirmBody = document.getElementById('talkAiConfirmBody');
      const confirmBtn = document.getElementById('talkAiConfirmBtn');
      const cancelBtn = document.getElementById('talkAiCancelBtn');
      const textFallbackEl = document.getElementById('talkAiTextFallback');
      const textInputEl = document.getElementById('talkAiTextInput');
      const textSendBtn = document.getElementById('talkAiTextSendBtn');
      const textCancelBtn = document.getElementById('talkAiTextCancelBtn');
      const liveEl = document.getElementById('talkAiLiveTranscript');
      const liveTextEl = document.getElementById('talkAiLiveTranscriptText');
      const liveDoneBtn = document.getElementById('talkAiLiveDoneBtn');
      const liveCancelBtn = document.getElementById('talkAiLiveCancelBtn');

      let recognition = null;
      let listening = false;
      let userStopped = false;   // true only once the person taps the widget/Done/Cancel — controls whether onend restarts or finalizes
      let cancelledListen = false; // true when Cancel was tapped — discard on end instead of sending
      let finalTranscript = '';  // accumulates across auto-restarts so a browser-side silence timeout never loses anything
      let pendingItems = null; // items awaiting confirmation

      const COUNTER_FIELDS = FIELD_CONFIG.filter((f) => f.kind === 'counter').map((f) => f.key);
      const PIP_FIELDS = FIELD_CONFIG.filter((f) => f.kind === 'pip').map((f) => f.key);
      const FIELD_LABELS = Object.assign(
        { wokeAt5: 'Woke at 5am', nDay: 'Day note', nRead: 'Reading note', nExtra: 'Note', title: 'Title' },
        Object.fromEntries(FIELD_CONFIG.map((f) => [f.key, f.label]))
      );

      function setStatus(text, show) {
        if (!statusEl) return;
        statusEl.textContent = text || '';
        statusEl.classList.toggle('show', !!show);
      }

      function supported() {
        return !!(window.SpeechRecognition || window.webkitSpeechRecognition);
      }


      function openLiveTranscript() {
        if (!liveEl) return;
        liveTextEl.textContent = finalTranscript.trim();
        liveEl.classList.add('open');
      }

      function setLiveTranscript(text) {
        if (!liveTextEl) return;
        liveTextEl.textContent = text;
        liveTextEl.scrollTop = liveTextEl.scrollHeight;
      }

      function closeLiveTranscript() {
        if (liveEl) liveEl.classList.remove('open');
      }

      // Errors that mean the mic/session is genuinely dead and
      // shouldn't be silently retried (permission denial, no mic
      // hardware). Everything else (no-speech, network blips, aborted)
      // is treated as "browser paused it, keep going".
      const FATAL_ERRORS = ['not-allowed', 'service-not-allowed', 'audio-capture'];

      function startListening() {
        const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SR) { setStatus('Voice input not supported on this browser.', true); return; }
        closeConfirm();
        closeTextFallback();
        userStopped = false;
        cancelledListen = false;
        finalTranscript = '';
        beginRecognitionSession();
      }

      // Creates and starts one SpeechRecognition instance. Called
      // again automatically from onend whenever the session stopped
      // for a reason other than the person tapping stop/cancel.
      function beginRecognitionSession() {
        recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
        recognition.lang = 'en-US';
        recognition.interimResults = true;
        recognition.continuous = true;
        recognition.maxAlternatives = 1;

        recognition.onstart = () => {
          listening = true;
          btn.classList.add('listening');
          setStatus('Listening…', true);
          openLiveTranscript();
        };
        recognition.onerror = (e) => {
          if (FATAL_ERRORS.includes(e.error)) {
            userStopped = true; // stop the auto-restart loop too
            listening = false;
            btn.classList.remove('listening');
            closeLiveTranscript();
            setStatus('Mic error: ' + e.error, true);
            setTimeout(() => setStatus('', false), 3000);
          }
          // Non-fatal errors: do nothing here — onend fires right
          // after and handles the restart-or-finalize decision.
        };
        recognition.onend = () => {
          if (!userStopped) {
            // Browser ended the session on its own (silence timeout,
            // transient error) but the person never asked to stop —
            // restart transparently and keep the popup open. `listening`
            // stays true throughout so a tap during this handoff still
            // reads as "stop", not "start a new session".
            try { beginRecognitionSession(); } catch { /* retry on next tick if start() races */
              setTimeout(() => { if (!userStopped) beginRecognitionSession(); }, 250);
            }
            return;
          }
          listening = false;
          btn.classList.remove('listening');
          closeLiveTranscript();
          setStatus('', false);
          const transcript = finalTranscript.trim();
          if (!cancelledListen && transcript) handleTranscript(transcript);
        };
        recognition.onresult = (e) => {
          let interim = '';
          for (let i = e.resultIndex; i < e.results.length; i++) {
            const res = e.results[i];
            if (res.isFinal) finalTranscript += res[0].transcript + ' ';
            else interim += res[0].transcript;
          }
          setLiveTranscript((finalTranscript + interim).trim());
        };

        recognition.start();
      }

      // Stops listening for good and lets the (already-heard)
      // transcript go on to be parsed — used by the widget button and
      // the "Done" button.
      function stopListening() {
        userStopped = true;
        if (recognition && listening) recognition.stop();
      }

      // Stops listening for good and discards whatever was heard —
      // used by the live-transcript popup's Cancel button.
      function cancelListening() {
        userStopped = true;
        cancelledListen = true;
        if (recognition && listening) recognition.stop();
        else closeLiveTranscript();
      }

      async function handleTranscript(transcript) {
        btn.classList.add('working');
        setStatus('Thinking…', true);
        try {
          const nowISO = new Date().toISOString();
          // nowISO alone is a bare UTC instant — the model has no way
          // to know what "today"/"the past hour"/"3pm" mean in the
          // person's own day without also knowing their offset from
          // UTC. Reuse whatever TimezoneModal already has (the
          // person's explicit pick, or their device's offset if they
          // never touched it) rather than introducing a second source
          // of truth for "what timezone is this person in."
          const tzOffsetMinutes = (typeof TimezoneModal !== 'undefined') ? TimezoneModal.getSelected() : -new Date().getTimezoneOffset();
          const tzLabel = (typeof TimezoneModal !== 'undefined') ? TimezoneModal.label(tzOffsetMinutes) : null;
          const existingEvents = await gatherExistingEventsContext();
          const r = await fetch('/api/talk-ai', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ transcript, nowISO, tzOffsetMinutes, tzLabel, existingEvents }),
          });
          if (!r.ok) throw new Error('talk-ai request failed: ' + r.status);
          const { items } = await r.json();
          if (!Array.isArray(items) || !items.length) {
            setStatus("Didn't catch anything to add.", true);
            setTimeout(() => setStatus('', false), 3000);
            return;
          }
          openConfirm(items);
          setStatus('', false);
        } catch (err) {
          setStatus('Something went wrong — try again.', true);
          setTimeout(() => setStatus('', false), 3000);
        } finally {
          btn.classList.remove('working');
        }
      }


      const EXISTING_EVENTS_WINDOW_DAYS = 14;

      function gatherExistingEventsContext() {
        return EventStore.whenReady().then(() => {
          const snapshot = EventStore.getAllSnapshot();
          const now = new Date();
          const minDate = new Date(now); minDate.setDate(minDate.getDate() - EXISTING_EVENTS_WINDOW_DAYS);
          const maxDate = new Date(now); maxDate.setDate(maxDate.getDate() + EXISTING_EVENTS_WINDOW_DAYS);
          // Local date-key, not toISOString().slice(0,10) — that reads
          // the date in UTC, which quietly clips off the local
          // "today" (or duplicates yesterday) for anyone not at
          // UTC+00:00, worst right around their own midnight.
          const minKey = EventStore.dateKeyFor(minDate.getFullYear(), minDate.getMonth(), minDate.getDate());
          const maxKey = EventStore.dateKeyFor(maxDate.getFullYear(), maxDate.getMonth(), maxDate.getDate());

          const out = {};
          Object.keys(snapshot).forEach((dateKey) => {
            if (dateKey < minKey || dateKey > maxKey) return;
            const list = snapshot[dateKey] || [];
            if (!list.length) return;
            out[dateKey] = list.map((ev) => ({
              id: ev.id,
              title: (ev.type || '').slice(0, 60),
              color: ev.color || '#3b82f6',
              locked: !!ev.locked,
              notify: !!ev.notify,
              startMinutes: ev.startMinutes,
              durationMinutes: ev.durationMinutes,
            }));
          });
          return out;
        });
      }


      const COLOR_NAMES = {
        '#3b82f6': 'blue', '#e6362a': 'red', '#f59e0b': 'orange', '#10b981': 'green',
        '#14b8a6': 'teal', '#8b5cf6': 'purple', '#ec4899': 'pink', '#64748b': 'gray',
        '#78350f': 'brown', '#111827': 'black',
      };

      function fieldValueLabel(item) {
        const label = FIELD_LABELS[item.field] || item.field;
        if (COUNTER_FIELDS.includes(item.field) || PIP_FIELDS.includes(item.field)) {
          const sign = item.value > 0 ? '+' : '';
          return `${sign}${item.value} ${label}`;
        }
        if (item.field === 'wokeAt5') return item.value ? label : `Not ${label.toLowerCase()}`;
        return `${label}: "${item.value}"`;
      }

      // Looks up the event's current title (for display only) from
      // whatever EventStore already has loaded for that date, so the
      // confirm card can say "Edit Gym session" rather than just an id.
      function currentEventTitle(id, dateKey) {
        try {
          const rec = EventStore.getForDate(dateKey).find((r) => r.id === id);
          return (rec && rec.type) ? rec.type : 'that event';
        } catch { return 'that event'; }
      }

      function eventEditSummary(item) {
        const changes = [];
        if (item.color) changes.push((COLOR_NAMES[item.color] || item.color));
        if (item.locked !== undefined) changes.push(item.locked ? 'locked' : 'unlocked');
        if (item.notify !== undefined) changes.push(item.notify ? 'alert on' : 'alert off');
        if (item.title) changes.push(`renamed to "${item.title}"`);
        if (item.startMinutes !== undefined) {
          const h = String(Math.floor(item.startMinutes / 60)).padStart(2, '0');
          const m = String(item.startMinutes % 60).padStart(2, '0');
          changes.push(`moved to ${h}:${m}`);
        }
        if (item.durationMinutes !== undefined) changes.push(`${item.durationMinutes}m long`);
        if (item.description) changes.push('description updated');
        const title = currentEventTitle(item.id, item.dateKey);
        return `${title} → ${changes.join(', ') || 'no change'}`;
      }

      function openConfirm(items) {
        pendingItems = items;
        const eventsByDate = {};
        const editsByDate = {};
        const deletesByDate = {};
        const habitsByDate = {};
        items.forEach((it) => {
          if (it.kind === 'event') {
            (eventsByDate[it.dateKey] = eventsByDate[it.dateKey] || []).push(it.title);
          } else if (it.kind === 'event_edit') {
            (editsByDate[it.dateKey] = editsByDate[it.dateKey] || []).push(eventEditSummary(it));
          } else if (it.kind === 'event_delete') {
            (deletesByDate[it.dateKey] = deletesByDate[it.dateKey] || []).push(currentEventTitle(it.id, it.dateKey));
          } else if (it.kind === 'habit') {
            (habitsByDate[it.dateKey] = habitsByDate[it.dateKey] || []).push(fieldValueLabel(it));
          }
        });

        let html = '';
        Object.keys(eventsByDate).sort().forEach((dateKey) => {
          html += `<div class="talk-ai-confirm-section">Add to <b>${dateKey}</b>: ${eventsByDate[dateKey].join(', ')}</div>`;
        });
        Object.keys(editsByDate).sort().forEach((dateKey) => {
          html += `<div class="talk-ai-confirm-section">Edit on <b>${dateKey}</b>: ${editsByDate[dateKey].join('; ')}</div>`;
        });
        Object.keys(deletesByDate).sort().forEach((dateKey) => {
          html += `<div class="talk-ai-confirm-section">Delete from <b>${dateKey}</b>: ${deletesByDate[dateKey].join(', ')}</div>`;
        });
        Object.keys(habitsByDate).sort().forEach((dateKey) => {
          html += `<div class="talk-ai-confirm-section">Checklist <b>(${dateKey})</b>: ${habitsByDate[dateKey].join(', ')}</div>`;
        });
        confirmBody.innerHTML = html || '<div class="talk-ai-confirm-section">Nothing recognized.</div>';
        confirmEl.classList.add('open');
      }

      function closeConfirm() {
        confirmEl.classList.remove('open');
        pendingItems = null;
      }

      async function confirmPending() {
        if (!pendingItems) return;
        const items = pendingItems;
        closeConfirm();
        btn.classList.add('working');
        setStatus('Saving…', true);
        try {
          const events = items.filter((it) => it.kind === 'event');
          const eventEdits = items.filter((it) => it.kind === 'event_edit');
          const eventDeletes = items.filter((it) => it.kind === 'event_delete');
          const habitOps = items.filter((it) => it.kind === 'habit');
          if (events.length) await saveEvents(events);
          if (eventEdits.length) await saveEventEdits(eventEdits);
          if (eventDeletes.length) await saveEventDeletes(eventDeletes);
          if (habitOps.length) await saveHabitOps(habitOps);
          const didOnlyDelete = eventDeletes.length && !events.length && !eventEdits.length && !habitOps.length;
          setStatus(didOnlyDelete ? 'Deleted.' : 'Added.', true);
        } catch {
          setStatus('Save failed — try again.', true);
        } finally {
          btn.classList.remove('working');
          setTimeout(() => setStatus('', false), 3000);
        }
      }


      // Groups by dateKey (the shape /api/events already expects),
      // POSTs once, and also live-injects into EventStore for
      // whichever date is currently open in the day-time-grid.
      async function saveEvents(events) {
        // EventStore's serverCache loads asynchronously on page load;
        // if the widget is used before that fetch resolves,
        // getForDate()/getAllSnapshot() below would see an empty
        // cache for any date not yet touched and the merge would
        // wipe existing events for that date instead of merging with
        // them. Wait for it first — this is a no-op once loaded.
        await EventStore.whenReady();

        const touchedDates = new Set();
        const newRecordsByDate = {}; // just the ones created this call, for the pop-in paint below
        const openDateKey = (() => {
          try {
            if (DayViewState.get() !== DayViewState.STATES.LOCKED) return null;
            const sel = SelectedDayState.get();
            return EventStore.dateKeyFor(sel.year, sel.month, sel.day);
          } catch { return null; }
        })();

        events.forEach((ev) => {
          const record = {
            id: (window.crypto && crypto.randomUUID) ? crypto.randomUUID()
                : 'ev_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 8),
            dateKey: ev.dateKey,
            startMinutes: ev.startMinutes,
            durationMinutes: ev.durationMinutes,
            type: ev.title || '',
            color: ev.color || '#3b82f6',
            description: ev.description || '',
            manualLeftUnits: null,
            manualWidthUnits: null,
            notify: false,
            locked: false,
            el: null,
          };
          // Push straight into EventStore's own live array for this
          // date — the SAME array everything else in the app reads
          // from (getForDate lazily hydrates it from serverCache on
          // first touch, then hands back that live array every call
          // after). Doing it this way, instead of building a separate
          // local list, means the date is correctly cached the moment
          // we confirm — not just when it happens to be the day
          // currently open — so navigating there later (even without
          // a reload) already shows the new event.
          EventStore.getForDate(ev.dateKey).push(record);
          touchedDates.add(ev.dateKey);
          (newRecordsByDate[ev.dateKey] = newRecordsByDate[ev.dateKey] || []).push(record);
        });

        // getAllSnapshot() serializes every date currently held in
        // EventStore (server-loaded dates plus whatever's live in
        // memory), so pulling the touched dates back out of it gives
        // us the already-merged, deduped list /api/events expects —
        // it DELETEs-then-inserts per date it receives.
        const snapshot = EventStore.getAllSnapshot();
        const entries = {};
        touchedDates.forEach((dateKey) => { entries[dateKey] = snapshot[dateKey] || []; });

        await fetch('/api/events', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ entries }),
        });

        // If the day currently open is one we just added to, paint
        // in only the new box(es) with the pop-in animation — using
        // renderNewEventsForDate rather than renderEventsForDate,
        // since the date is already the one rendered and a plain
        // re-render would no-op instead of showing the new box at
        // all.
        if (openDateKey && newRecordsByDate[openDateKey] && typeof DayTimeGrid !== 'undefined' && DayTimeGrid.renderNewEventsForDate) {
          DayTimeGrid.renderNewEventsForDate(openDateKey, newRecordsByDate[openDateKey]);
        }
        if (typeof WeekView !== 'undefined' && WeekView.isOpen() && WeekView.renderNewEventsForDate) {
          Object.keys(newRecordsByDate).forEach((dateKey) => {
            WeekView.renderNewEventsForDate(dateKey, newRecordsByDate[dateKey]);
          });
        }
      }


      async function saveEventEdits(edits) {
        await EventStore.whenReady();

        const openDateKey = (() => {
          try {
            if (DayViewState.get() !== DayViewState.STATES.LOCKED) return null;
            const sel = SelectedDayState.get();
            return EventStore.dateKeyFor(sel.year, sel.month, sel.day);
          } catch { return null; }
        })();

        const touchedDates = new Set();
        const editedRecordsForOpenDate = [];

        edits.forEach((ed) => {
          const list = EventStore.getForDate(ed.dateKey);
          const record = list.find((r) => r.id === ed.id);
          if (!record) return; // event may have been deleted client-side since talk-ai.js was called
          if (ed.color !== undefined) record.color = ed.color;
          if (ed.locked !== undefined) record.locked = !!ed.locked;
          if (ed.notify !== undefined) record.notify = !!ed.notify;
          if (ed.title !== undefined) record.type = ed.title; // "type" is the box's title field in the record model
          if (ed.description !== undefined) record.description = ed.description;
          if (ed.startMinutes !== undefined) record.startMinutes = ed.startMinutes;
          if (ed.durationMinutes !== undefined) record.durationMinutes = ed.durationMinutes;
          touchedDates.add(ed.dateKey);
          if (ed.dateKey === openDateKey) editedRecordsForOpenDate.push(record);
        });

        if (!touchedDates.size) return;

        // Reuse EventStore's own serialization (via getAllSnapshot, which
        // re-derives from the live records we just mutated above) so the
        // POST body always matches whatever shape /api/events expects,
        // rather than hand-rebuilding it here and risking drift.
        const snapshot = EventStore.getAllSnapshot();
        const entries = {};
        touchedDates.forEach((dateKey) => { entries[dateKey] = snapshot[dateKey] || []; });

        await fetch('/api/events', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ entries }),
        });

        // Repaint just the edited box(es) on the open day and flash
        // them — using refreshEditedRecords rather than
        // renderEventsForDate, since the date is already the one
        // rendered and a plain re-render would no-op instead of
        // picking up the changed fields at all.
        if (editedRecordsForOpenDate.length && typeof DayTimeGrid !== 'undefined' && DayTimeGrid.refreshEditedRecords) {
          DayTimeGrid.refreshEditedRecords(openDateKey, editedRecordsForOpenDate);
        }
      }


      async function saveEventDeletes(deletes) {
        await EventStore.whenReady();

        const openDateKey = (() => {
          try {
            if (DayViewState.get() !== DayViewState.STATES.LOCKED) return null;
            const sel = SelectedDayState.get();
            return EventStore.dateKeyFor(sel.year, sel.month, sel.day);
          } catch { return null; }
        })();

        const touchedDates = new Set();
        const removedRecordsForOpenDate = [];

        deletes.forEach((del) => {
          const list = EventStore.getForDate(del.dateKey);
          const idx = list.findIndex((r) => r.id === del.id);
          if (idx === -1) return; // already gone client-side since talk-ai.js was called
          const [record] = list.splice(idx, 1);
          touchedDates.add(del.dateKey);
          if (del.dateKey === openDateKey) removedRecordsForOpenDate.push(record);
        });

        if (!touchedDates.size) return;

        const snapshot = EventStore.getAllSnapshot();
        const entries = {};
        touchedDates.forEach((dateKey) => { entries[dateKey] = snapshot[dateKey] || []; });

        await fetch('/api/events', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ entries }),
        });

        // Tear down the box(es) on the open day immediately, rather
        // than leaving them sitting there until the day is left and
        // re-opened.
        if (removedRecordsForOpenDate.length && typeof DayTimeGrid !== 'undefined' && DayTimeGrid.removeRecordsFromDate) {
          DayTimeGrid.removeRecordsFromDate(openDateKey, removedRecordsForOpenDate);
        }
      }


      async function saveHabitOps(habitOps) {
        const byDate = {};
        habitOps.forEach((op) => { (byDate[op.dateKey] = byDate[op.dateKey] || []).push(op); });

        for (const dateKey of Object.keys(byDate)) {
          const base = habitsData[dateKey]
            ? Object.assign({}, habitsData[dateKey])
            : defaultEntry(dateKey);

          byDate[dateKey].forEach((op) => {
            if (COUNTER_FIELDS.includes(op.field)) {
              base[op.field] = Math.max(0, (Number(base[op.field]) || 0) + op.value);
            } else if (PIP_FIELDS.includes(op.field)) {
              base[op.field] = Math.max(0, Math.min(3, (Number(base[op.field]) || 0) + op.value));
            } else if (op.field === 'wokeAt5') {
              base.wokeAt5 = !!op.value;
            } else {
              // free-text fields: append to any existing note rather than overwrite
              base[op.field] = base[op.field] ? (base[op.field] + '; ' + op.value) : op.value;
            }
          });

          await saveHabitData(dateKey, base);
        }

        // Refresh the month grid glow colors right away.
        if (typeof renderCalendar === 'function') renderCalendar();
      }


      function openTextFallback() {
        closeConfirm();
        textInputEl.value = '';
        textFallbackEl.classList.add('open');
        textInputEl.focus();
      }

      function closeTextFallback() {
        textFallbackEl.classList.remove('open');
      }

      function submitTextFallback() {
        const text = textInputEl.value.trim();
        closeTextFallback();
        if (text) handleTranscript(text);
      }

      function init() {
        if (!btn) return;
        const voiceSupported = supported();
        btn.title = voiceSupported
          ? 'Tap: money calendar \u00B7 Hold 1 second: talk to add events'
          : 'Tap: money calendar \u00B7 Hold 1 second: type to add events';

        // TAP  -> flips the month calendar between normal and Money (see MoneyMode.tapToggle).
        // HOLD (a full second) -> the voice feature (or the type-it box where voice isn't supported).
        // While a voice session is listening, a tap still stops it, like before.
        const HOLD_MS = 1000;
        let holdTimer = 0, holdFired = false, hx = 0, hy = 0;
        function startVoice() {
          if (!voiceSupported) { openTextFallback(); return; }
          if (!listening) startListening();
        }
        function clearHold() { clearTimeout(holdTimer); holdTimer = 0; btn.classList.remove('holding'); }
        btn.addEventListener('pointerdown', (ev) => {
          if (ev.pointerType === 'mouse' && ev.button !== 0) return;
          clearHold();
          holdFired = false; hx = ev.clientX; hy = ev.clientY;
          btn.classList.add('holding');
          holdTimer = setTimeout(() => {
            holdTimer = 0; holdFired = true;
            btn.classList.remove('holding');
            startVoice();
          }, HOLD_MS);
        });
        btn.addEventListener('pointermove', (ev) => {
          if (holdTimer && Math.hypot(ev.clientX - hx, ev.clientY - hy) > 14) clearHold(); // finger slid away: not a hold
        });
        ['pointerup', 'pointercancel', 'pointerleave'].forEach((t) => btn.addEventListener(t, clearHold));
        btn.addEventListener('contextmenu', (ev) => ev.preventDefault()); // no long-press menu on the button
        btn.addEventListener('click', (ev) => {
          if (holdFired) {
            // this click is only the finger lifting after a hold - the voice feature is already open
            holdFired = false; ev.preventDefault();
            if (textFallbackEl.classList.contains('open')) textInputEl.focus(); // iOS only raises the keyboard inside a tap
            return;
          }
          if (listening) { stopListening(); return; }
          if (typeof MoneyMode !== 'undefined') MoneyMode.tapToggle();
        });
        confirmBtn.addEventListener('click', confirmPending);
        cancelBtn.addEventListener('click', closeConfirm);
        textSendBtn.addEventListener('click', submitTextFallback);
        textCancelBtn.addEventListener('click', closeTextFallback);
        liveDoneBtn.addEventListener('click', stopListening);
        liveCancelBtn.addEventListener('click', cancelListening);
        textInputEl.addEventListener('keydown', (e) => {
          if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) submitTextFallback();
        });
      }

      return { init };
    })();
    TalkAI.init();

    const WeekView = (() => {
      const cfg = {
        hourHeight: 60,   // px per hour in the scrollable grid
        colWidth:   108,  // px width of each day column (desktop is recomputed per-open — see computeColWidth)
        colWidthOverride: null, // set by DayWidthControl once the user drags the day-width slider; when present, computeColWidth uses this instead of auto-fitting visibleDaysDesktop
        visibleDaysDesktop: 5, // how many full day columns should fit on screen at once, desktop only
        windowDays: 30,   // the day range the grid gets trimmed back down to once scrolling is let go — see settleWindow()
        pageDays:   14,   // how many extra days get loaded ahead of you as you scroll near an edge, so an active drag/swipe never hits a hard wall before windowDays kicks back in
        edgeThresholdCols: 3, // start loading more once you're within this many columns of an edge
        maxDays:    120,  // safety valve only, in case one continuous scroll never goes idle — the real cap is windowDays, applied on let-go
        settleIdleMs: 220, // how long scrolling must be silent (AND the pointer must already be up) before we treat it as "let go" and re-trim to windowDays
        appExitMs:  320,  // must match .app.week-view-exiting transition
        slideMs:    420,  // must match .week-view-overlay transition
        gotoTodayThresholdDays: 2, // show the "go to current day" button once the centered day is this many days from today
      };

      const WEEKDAY_ABBR = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      const MONTH_ABBR = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

      const appEl      = document.querySelector('.app');
      const overlayEl  = document.getElementById('weekViewOverlay');
      const gridEl     = document.getElementById('weekViewGrid');
      const scrollEl   = document.getElementById('weekViewScroll');
      const closeBtn   = document.getElementById('weekViewCloseBtn');
      const openBtn    = document.getElementById('weekViewBtn');
      const gotoTodayBtn = document.getElementById('weekViewGotoTodayBtn');
      const backToWeekBtn = document.getElementById('backToWeekBtn');

      let isOpen = false;
      let gutterPinRafId = null; // rAF handle for the continuous gutter-pin loop, running the whole time the week view is open — see open()/close()
      let currentVisibleIdx = 0; // index within `dates` of whichever day updateForScroll last considered "current" — used to seed the date picker
      let isSelectingDay = false; // guards against a double-click firing this twice
      let scrollRafPending = false;
      let cameFromWeek = false; // true only when the day currently locked-in was clicked from inside the week view
      // Whether a mouse button/finger/pen is currently down anywhere on
      // the scroll area. Used only to gate settleWindow() — see
      // scheduleSettleCheck() — so hitting the physical edge of the
      // loaded days while still holding the gesture down (no more
      // scroll events fire, since there's nowhere further to go) is
      // never mistaken for "let go".
      let pointerDown = false;

      // `dates[i]` always corresponds to grid-column `i + 2` (column 1
      // is the fixed hour gutter) — every header/day cell gets that
      // column index assigned explicitly (see reindexColumns), so
      // nothing here ever depends on the browser's own CSS Grid
      // auto-placement guessing the right order.
      let dates = [];
      let headerEls = [];
      let colEls = [];
      let cornerEl = null, gutterBodyEl = null; // gutterBodyEl is pinned via applyGutterPin's JS transform, see there
      let selectedIdx = 0; // index within `dates` of the originally-selected day, so open() can center on it

      function formatClock(totalMinutes) {
        let h = Math.floor(totalMinutes / 60) % 24;
        const m = Math.round(totalMinutes % 60);
        const period = h >= 12 ? 'PM' : 'AM';
        let h12 = h % 12;
        if (h12 === 0) h12 = 12;
        return h12 + ':' + String(m).padStart(2, '0') + ' ' + period;
      }

      function isSameDate(a, b) {
        return a.getFullYear() === b.getFullYear() &&
               a.getMonth() === b.getMonth() &&
               a.getDate() === b.getDate();
      }

      function addDays(d, n) {
        return new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);
      }

      function titleForDate(d) {
        return WEEKDAY_ABBR[d.getDay()] + ', ' + MONTH_ABBR[d.getMonth()] + ' ' + d.getDate();
      }

      function toISODate(d) {
        return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
      }

      function makeHeaderCell(d) {
        const today = new Date();
        const header = document.createElement('div');
        header.className = 'week-view-daycol-header' + (isSameDate(d, today) ? ' is-today' : '');
        const wd = document.createElement('div');
        wd.className = 'week-view-daycol-weekday';
        wd.textContent = WEEKDAY_ABBR[d.getDay()];
        const num = document.createElement('div');
        num.className = 'week-view-daycol-num';
        num.textContent = String(d.getDate());
        header.appendChild(wd);
        header.appendChild(num);
        // Clicking the day header (weekday + date number) always
        // drops you into that day's editor, on every viewport — the
        // press-and-hold gesture on the grid body below is a separate,
        // additional way to schedule something without leaving the
        // week view.
        header.addEventListener('click', () => selectDayAndLockIn(d));
        return header;
      }

      function makeDayCell(d) {
        const today = new Date();
        const nowMinutes = today.getHours() * 60 + today.getMinutes();

        const col = document.createElement('div');
        col.className = 'week-view-daycol';
        col.style.height = (cfg.hourHeight * 24) + 'px';
        for (let h = 0; h <= 24; h++) {
          const line = document.createElement('div');
          line.className = 'week-view-hour-line';
          line.style.top = (h * cfg.hourHeight) + 'px';
          col.appendChild(line);
        }

        if (isSameDate(d, today)) {
          const y = (nowMinutes / 60) * cfg.hourHeight;
          const nowLine = document.createElement('div');
          nowLine.className = 'week-view-now-line';
          nowLine.style.top = y + 'px';
          const nowDot = document.createElement('div');
          nowDot.className = 'week-view-now-dot';
          nowDot.style.top = y + 'px';
          col.appendChild(nowLine);
          col.appendChild(nowDot);
        }

        const dateKey = EventStore.dateKeyFor(d.getFullYear(), d.getMonth(), d.getDate());
        EventStore.getForDate(dateKey).forEach((record) => {
          buildWeekEventBox(record, col);
        });

        // Same story as the header click above: on desktop, a plain
        // click on the grid itself is now a no-op — only a completed
        // hold creates anything or navigates anywhere.
        col.addEventListener('click', () => { if (isPhoneVP()) selectDayAndLockIn(d); });
        // Press-and-hold to schedule, desktop only (see weekHoldCfg
        // block below) — mirrors the single-day grid's own
        // hold-to-create gesture so any visible date in the week can
        // get a timed event without first locking into that day.
        if (!isPhoneVP()) {
          col.addEventListener('pointerdown', (e) => onWeekHoldPointerDown(col, d, e));
        }
        return col;
      }

      // Assigns every header/day cell the exact grid-column that
      // matches its current index in `dates`, and updates the grid's
      // column-track count to match. DOM order no longer matters —
      // this is what the earlier overlapping/duplicated-looking
      // render was missing.
      function reindexColumns() {
        gridEl.style.setProperty('--week-view-days', dates.length);
        for (let i = 0; i < dates.length; i++) {
          const col = String(i + 2);
          headerEls[i].style.gridColumn = col;
          colEls[i].style.gridColumn = col;
        }
      }

      // Loads `n` more days onto the front, purely to keep an active
      // scroll/drag from hitting a hard wall before it lets go. Only a
      // safety-valve cap (cfg.maxDays) applies here — the real
      // windowDays limit is enforced afterwards, by settleWindow().
      function prependDays(n) {
        const newDates = [];
        const newHeaders = [];
        const newCols = [];
        for (let i = n; i >= 1; i--) {
          const d = addDays(dates[0], -i);
          newDates.push(d);
          const h = makeHeaderCell(d);
          const c = makeDayCell(d);
          gridEl.appendChild(h);
          gridEl.appendChild(c);
          newHeaders.push(h);
          newCols.push(c);
        }
        dates = newDates.concat(dates);
        headerEls = newHeaders.concat(headerEls);
        colEls = newCols.concat(colEls);

        // Everything just shifted `n` slots to the right within the
        // `dates` array too, so any index pointing at a specific day
        // (selectedIdx = "today", set once when the week view opens)
        // has to shift by the same amount.
        selectedIdx += n;
        currentVisibleIdx += n;

        while (dates.length > cfg.maxDays) {
          headerEls.pop().remove();
          colEls.pop().remove();
          dates.pop();
        }

        // Must run BEFORE the scrollLeft compensation below — see
        // appendDays for why (same reasoning, mirrored).
        reindexColumns();
        scrollEl.scrollLeft += n * cfg.colWidth;
      }

      // Loads `n` more days onto the end — the forward-scroll
      // counterpart to prependDays above, same purpose.
      function appendDays(n) {
        const last = dates[dates.length - 1];
        for (let i = 1; i <= n; i++) {
          const d = addDays(last, i);
          const h = makeHeaderCell(d);
          const c = makeDayCell(d);
          gridEl.appendChild(h);
          gridEl.appendChild(c);
          dates.push(d);
          headerEls.push(h);
          colEls.push(c);
        }

        let removed = 0;
        while (dates.length > cfg.maxDays) {
          headerEls.shift().remove();
          colEls.shift().remove();
          dates.shift();
          removed++;
        }
        if (removed) scrollEl.scrollLeft -= removed * cfg.colWidth;
        reindexColumns();
      }

      // Rebuilds the grid from scratch to exactly cfg.windowDays days
      // centered on `centerDate`, discarding every previously-loaded
      // day outside that range. This is the one place the visible day
      // range gets set, used both to open the view and to re-center
      // it after scrolling settles (see settleWindow) — so the loaded
      // window can never grow past cfg.windowDays no matter what got
      // scrolled through to reach it. Returns the index of centerDate
      // within the freshly-built `dates` array.
      function buildWindowCentered(centerDate) {
        const half = Math.floor(cfg.windowDays / 2);
        const dateList = [];
        for (let i = -half; i < cfg.windowDays - half; i++) dateList.push(addDays(centerDate, i));
        buildInitial(dateList);
        return half;
      }

      function buildInitial(dateList) {
        gridEl.innerHTML = '';
        gridEl.style.setProperty('--week-view-col-w', cfg.colWidth + 'px');
        gridEl.style.setProperty('--week-view-hour-h', cfg.hourHeight + 'px');

        // Gutter (column of hour labels), spanning the full 24h
        // height so it lines up with every day column. Plain grid
        // item, pinned to the left edge via a JS transform kept in
        // sync every frame (see applyGutterPin / the rAF loop started
        // in open()) rather than CSS position:sticky — sticky was
        // tried twice here and both versions either lagged or
        // stopped rendering, so this keeps it simple and just drives
        // the transform directly.
        const gutterBody = document.createElement('div');
        gutterBody.className = 'week-view-gutter-body';
        gutterBody.style.height = (cfg.hourHeight * 24) + 'px';
        for (let h = 0; h < 24; h++) {
          const label = document.createElement('div');
          label.className = 'week-view-hour-label';
          label.style.top = (h * cfg.hourHeight) + 'px';
          label.textContent = String(h).padStart(2, '0');
          gutterBody.appendChild(label);
        }
        gridEl.appendChild(gutterBody);
        gutterBodyEl = gutterBody;

        dates = dateList.slice();
        headerEls = [];
        colEls = [];
        dates.forEach((d) => {
          const h = makeHeaderCell(d);
          const c = makeDayCell(d);
          gridEl.appendChild(h);
          gridEl.appendChild(c);
          headerEls.push(h);
          colEls.push(c);
        });
        reindexColumns();
        applyGutterPin();
      }

      // Desktop shows a fixed number of full day columns at once
      // (5, so the week doesn't feel as cramped as showing all 7) —
      // computed from the actual viewport width each time the week
      // view opens, rather than a flat pixel value, so exactly 5
      // whole columns fit no matter how wide the window is. Phones
      // keep the original fixed 108px column (narrower columns there
      // are the point, since you're meant to swipe/scroll through
      // days one at a time on a small screen).
      function computeColWidth() {
        if (isPhoneVP()) return 108;
        if (cfg.colWidthOverride) return cfg.colWidthOverride; // manual slider pick wins over the auto-fit-5-columns default
        const gutterW = 34;
        const available = scrollEl.clientWidth - gutterW;
        const desired = Math.floor(available / cfg.visibleDaysDesktop);
        return Math.max(108, desired); // never narrower than the phone width, even on a tiny window
      }

      // Deliberately NOT SelectedDayState here. That state updates
      // the moment you click into any day (a week-view header, a
      // month-view cell, etc.) and then just sits there — so basing
      // the week view's opening center on it meant only the very
      // first-ever open (before SelectedDayState had been touched)
      // actually landed on today; every later open just re-showed
      // whichever day you'd last clicked into. The week view should
      // always open centered on the real current day, no matter what
      // was clicked or scrolled last time it was open.
      function render() {
        cfg.colWidth = computeColWidth();
        const today = new Date();
        const todayMid = new Date(today.getFullYear(), today.getMonth(), today.getDate());
        selectedIdx = buildWindowCentered(todayMid);
      }

      // Keeps the title in sync with whichever day column currently
      // sits at the left edge of the visible area, and grows the
      // rendered range in either direction once you scroll near its
      // current edge, so browsing days feels endless in both
      // directions rather than being capped at the initial batch.
      // Pins the hour gutter to the left edge by mirroring scrollLeft
      // onto it as a transform. Called both from the 'scroll' event
      // (onScroll, below) and from the continuous rAF loop started in
      // open()/stopped in close() (gutterPinLoop) — the loop is what
      // actually keeps it glued during fast/momentum scrolling, since
      // 'scroll' events alone can be throttled by the browser; calling
      // it here too just means the very first frame after any scroll
      // is already correct instead of waiting one tick for the loop.
      function applyGutterPin() {
        if (gutterBodyEl) gutterBodyEl.style.transform = 'translateX(' + scrollEl.scrollLeft + 'px)';
      }

      function updateForScroll() {
        if (!dates.length) return;
        const idx = Math.round(scrollEl.scrollLeft / cfg.colWidth);
        const clamped = Math.max(0, Math.min(dates.length - 1, idx));
        currentVisibleIdx = clamped;

        applyGutterPin();

        // Keep loading a bit further ahead as you approach an edge —
        // purely so an active drag/swipe never hits a hard physical
        // wall. This is allowed to push dates.length above windowDays
        // during the gesture; settleWindow() is what trims it back
        // down to windowDays once you actually let go.
        const edge = cfg.edgeThresholdCols * cfg.colWidth;
        if (scrollEl.scrollLeft < edge) {
          prependDays(cfg.pageDays);
        } else if (scrollEl.scrollLeft + scrollEl.clientWidth > scrollEl.scrollWidth - edge) {
          appendDays(cfg.pageDays);
        }

        updateGotoTodayVisibility();
      }

      // Shows the floating "Go to current day" button once whatever
      // day is centered in the viewport is more than a couple days
      // away from today — computed off the real calendar date (via
      // dates[0] + an offset), not off the `dates` array bounds, so
      // it still reads correctly even once today has scrolled out of
      // the currently-loaded window entirely.
      function updateGotoTodayVisibility() {
        if (!dates.length || !gotoTodayBtn) return;
        const today = new Date();
        const todayMid = new Date(today.getFullYear(), today.getMonth(), today.getDate());
        const gutterW = 34; // must match the 34px first grid-template-columns track
        const centerX = scrollEl.scrollLeft + (scrollEl.clientWidth - gutterW) / 2;
        const centerIdx = Math.round((centerX - cfg.colWidth / 2) / cfg.colWidth);
        const centerDate = addDays(dates[0], centerIdx);
        const diffDays = Math.round((centerDate - todayMid) / 86400000);
        gotoTodayBtn.classList.toggle('visible', Math.abs(diffDays) > cfg.gotoTodayThresholdDays);
      }

      // Shared math: the scrollLeft that lands the day column at
      // `idx` centered in the visible (non-gutter) part of the
      // scroll area.
      function centeredScrollLeftFor(idx) {
        const gutterW = 34;
        const target = idx * cfg.colWidth + cfg.colWidth / 2 - (scrollEl.clientWidth - gutterW) / 2;
        return Math.max(0, target);
      }

      // Scrolls (smoothly) so the day column at `idx` lands centered
      // in the visible (non-gutter) part of the scroll area.
      function scrollToIndexCentered(idx) {
        scrollEl.scrollTo({ left: centeredScrollLeftFor(idx), behavior: 'smooth' });
      }

      // Animates scrollLeft from wherever it is now to `targetLeft`
      // over `durationMs`, eased in/out. Used for the goToToday
      // "flight" below instead of the native scrollTo({behavior:
      // 'smooth'}) — native smooth-scroll duration/feel varies a lot
      // by browser and distance, and over a 50-day trip that can look
      // either instant or jerky. This keeps it a slow, consistent
      // drift no matter how far the trip is. Every frame it just
      // writes scrollLeft, which fires real 'scroll' events, so all
      // the usual machinery (gutter pin, edge-loading, settle timer)
      // keeps working exactly as if the user had scrolled it by hand.
      function animateScrollTo(targetLeft, durationMs) {
        const startLeft = scrollEl.scrollLeft;
        const delta = targetLeft - startLeft;
        if (Math.abs(delta) < 1) { scrollEl.scrollLeft = targetLeft; return; }
        const startTime = performance.now();
        function ease(t) { return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; }
        function step(now) {
          const t = Math.min(1, (now - startTime) / durationMs);
          scrollEl.scrollLeft = startLeft + delta * ease(t);
          if (t < 1) requestAnimationFrame(step);
        }
        requestAnimationFrame(step);
      }

      // Jumps the week/day scroll to an arbitrary picked date: if it's
      // still within the loaded window, just slide over to it; if it's
      // out of range, rebuild a fresh window centered on it first —
      // same approach as goToToday, just for any target date.
      function goToDate(y, m, d) {
        if (!dates.length) return;
        const target = new Date(y, m, d);
        let idx = Math.round((target - dates[0]) / 86400000);

        if (idx < 0 || idx >= dates.length) {
          idx = buildWindowCentered(target);
        }

        currentVisibleIdx = idx;
        scrollToIndexCentered(idx);
        updateGotoTodayVisibility();
      }

      // "Go to current day": loads a wide 50-days-either-side window
      // centered on today, drops the view back at whichever day was
      // actually on screen (same absolute date, no visual jump), then
      // slowly drifts across that window to today — so the trip there
      // reads as an actual flight over the calendar instead of a
      // teleport. Once the drift finishes and scrolling goes idle,
      // the normal settleWindow() idle-timer (see scheduleSettleCheck
      // above) trims the window straight back down to the usual
      // cfg.windowDays (30), same as after any other scroll — nothing
      // special needed here to "revert" it.
      function goToToday() {
        if (!dates.length) return;
        const today = new Date();
        const todayMid = new Date(today.getFullYear(), today.getMonth(), today.getDate());

        // Whichever day is actually centered right now — the flight
        // should start from there, not from wherever the rebuilt
        // grid happens to default to.
        const gutterW = 34;
        const centerX = scrollEl.scrollLeft + (scrollEl.clientWidth - gutterW) / 2;
        const centerIdxNow = Math.max(0, Math.min(dates.length - 1, Math.round((centerX - cfg.colWidth / 2) / cfg.colWidth)));
        const centerDateNow = dates[centerIdxNow];

        // Build the wide 50-each-side window around today. Bump
        // cfg.windowDays only for this one call — buildWindowCentered
        // reads it synchronously, so restoring it right after leaves
        // every other windowDays reference (settleWindow included)
        // back at the normal 30.
        const flightHalf = 50;
        const savedWindowDays = cfg.windowDays;
        cfg.windowDays = flightHalf * 2 + 1;
        buildWindowCentered(todayMid);
        cfg.windowDays = savedWindowDays;

        // Land instantly (no animation) on the day that was showing
        // before — clamped into the new window if the old position
        // was more than 50 days out, since that's as far back as this
        // window reaches.
        let startIdx = Math.round((centerDateNow - dates[0]) / 86400000);
        startIdx = Math.max(0, Math.min(dates.length - 1, startIdx));
        scrollEl.scrollLeft = centeredScrollLeftFor(startIdx);
        currentVisibleIdx = startIdx;
        applyGutterPin();

        const todayIdx = Math.round((todayMid - dates[0]) / 86400000);
        const distCols = Math.abs(todayIdx - startIdx);
        const durationMs = Math.max(700, Math.min(1800, distCols * 26));
        animateScrollTo(centeredScrollLeftFor(todayIdx), durationMs);

        gotoTodayBtn.classList.remove('visible');
      }

      function onScroll() {
        // Sync the gutter immediately too, not just on the next rAF
        // tick of the loop in open()/close() — cheap, and means the
        // very first paint after a scroll event is already correct.
        applyGutterPin();

        // Every scroll event (from any input — scrollbar drag, touch
        // swipe, trackpad, keyboard) restarts this idle timer. Once it
        // actually fires, scrolling has been silent for settleIdleMs,
        // i.e. the user has "let go" — see settleWindow() below.
        scheduleSettleCheck();

        if (scrollRafPending) return;
        scrollRafPending = true;
        requestAnimationFrame(() => {
          scrollRafPending = false;
          updateForScroll();
        });
      }

      let settleTimer = null;

      // Restarts the "has scrolling stopped?" timer. Called on every
      // scroll event, so it only ever actually fires settleWindow()
      // once motion has been fully idle for settleIdleMs — that's true
      // whether the motion was a mouse-dragged scrollbar, a touch
      // swipe's momentum, a trackpad flick, or arrow keys, so this one
      // path enforces the day limit no matter how the user scrolled.
      // Never arms while a pointer is still down: hitting the edge of
      // the loaded days mid-drag stops scroll events firing even
      // though the gesture hasn't ended, and that must NOT count as a
      // "let go" — see onScrollAreaPointerUp, which is what actually
      // arms the timer once the gesture truly ends.
      function scheduleSettleCheck() {
        if (settleTimer) clearTimeout(settleTimer);
        if (pointerDown) { settleTimer = null; return; }
        settleTimer = setTimeout(settleWindow, cfg.settleIdleMs);
      }

      function onScrollAreaPointerDown() {
        pointerDown = true;
        // A fresh drag/touch just started — nothing should reset out
        // from under it before this one is let go.
        if (settleTimer) { clearTimeout(settleTimer); settleTimer = null; }
      }

      function onScrollAreaPointerUp() {
        if (!pointerDown) return;
        pointerDown = false;
        // The gesture just ended — arm the idle timer now. If there's
        // leftover momentum still scrolling, every further scroll
        // event re-arms it via scheduleSettleCheck as usual, so it
        // only actually fires once that momentum has also settled.
        scheduleSettleCheck();
      }

      // The actual fix for "it lets me scroll way past the limit":
      // rather than trying to intercept and cap every possible way of
      // scrolling (mouse-drag, touch, trackpad all behave differently
      // and a mouse-only clamp simply never saw touch input at all),
      // this rebuilds the grid down to exactly cfg.windowDays days,
      // centered on wherever the view actually settled, every time
      // scrolling goes idle. Days outside that freshly-centered window
      // are discarded outright — not just visually scrolled away from —
      // so the grid can never hold more than cfg.windowDays days, and
      // the native scrollbar thumb can never represent more range than
      // that either (which is what was making it look "way smaller").
      function settleWindow() {
        settleTimer = null;
        if (!dates.length) return;

        const half = Math.floor(cfg.windowDays / 2);
        // Which day is actually centered in the visible area right
        // now — same math as updateGotoTodayVisibility, not just
        // whichever day happens to sit at the scroll container's left
        // edge (that's currentVisibleIdx, a coarser approximation).
        const gutterW = 34;
        const centerX = scrollEl.scrollLeft + (scrollEl.clientWidth - gutterW) / 2;
        const centerIdx = Math.max(0, Math.min(dates.length - 1, Math.round((centerX - cfg.colWidth / 2) / cfg.colWidth)));

        // Already a full, correctly-centered window? Nothing to trim.
        if (dates.length === cfg.windowDays && centerIdx === half) return;

        const centerDate = dates[centerIdx];
        buildWindowCentered(centerDate);
        scrollEl.scrollLeft = centeredScrollLeftFor(half);
        currentVisibleIdx = half;
        applyGutterPin();
        updateGotoTodayVisibility();
      }

      function scrollToRelevantHour() {
        const today = new Date();
        const targetHour = Math.max(0, today.getHours() - 2);
        scrollEl.scrollTop = targetHour * cfg.hourHeight;
        scrollEl.scrollLeft = centeredScrollLeftFor(selectedIdx); // the selected day opens instantly centered
        applyGutterPin();
      }

      const weekHoldCfg = {
        HOLD_MS:        420,
        MOVE_CANCEL_PX: 10,
        SNAP_MIN:       60,
        CONFIRM_MS:     260,
      };
      let weekHoldTimer      = null;
      let weekHoldPointerId  = null;
      let weekHoldStartX     = 0;
      let weekHoldStartY     = 0;
      let weekHoldIndicatorEl = null;

      // Builds the SAME kind of box + full inline editor that the
      // single-day grid uses (day-time-grid-event-box +
      // EventEditor.open), just mounted directly inside this week
      // column instead of DayTimeGrid's own grid — so every field
      // (type, time, description, color, notify, lock, delete) is
      // available right here without leaving the week view. Position
      // is computed with THIS module's own cfg.hourHeight (60), not
      // DayTimeGrid's (76) — the two grids run at different scales.
      // Vertical drag-resize for week-view boxes — a self-contained
      // version of DayTimeGrid's attachBoxResize. It can't reuse that
      // one directly: it closes over DayTimeGrid's OWN cfg.hourHeight
      // (76px/hr, for the single-day grid) plus single-day-only
      // machinery (hour auto-expand, that grid's own overlap layout),
      // none of which applies to these narrow week columns, which run
      // at this module's cfg.hourHeight (60px/hr) instead. Dragging
      // the top or bottom strip changes duration; the opposite edge
      // stays put.
      const weekResizeCfg = { SNAP_MIN: 15, MIN_DURATION: 15 };

      // Drag-to-move for week-view boxes — a self-contained version of
      // DayTimeGrid's attachBoxDrag, adapted for a week of side-by-side
      // day columns instead of one wide single-day track. Vertical
      // movement changes time-of-day exactly like the single-day grid;
      // horizontal movement snaps the box over to whichever day column
      // the pointer is currently over, moving the record itself out of
      // its original date's EventStore array and into the new one —
      // that's what lets a box get dragged clean out of the day it was
      // created on (yesterday, tomorrow, any other day still loaded in
      // this window).
      const weekDragCfg = {
        SNAP_MIN:                15,
        MOVE_THRESHOLD_PX:       10, // mouse / pen — small and precise
        TOUCH_MOVE_THRESHOLD_PX: 20, // a finger wobbles more than this on a plain tap
      };

      function attachWeekBoxDrag(record) {
        const boxEl = record.el;
        let dragPointerId   = null;
        let dragPointerType = 'mouse';
        let dragging        = false;
        let startClientX    = 0;
        let startClientY    = 0;
        let startMinutesAt  = 0;
        let startColIndex   = 0;    // index into dates/colEls this box started in
        let originalDateKey = null; // record.dateKey at drag start — onEnd needs this to know whether the day actually changed

        function onMove(e) {
          if (e.pointerId !== dragPointerId) return;
          if (record.locked) return; // locked boxes don't move — a plain
                                      // tap still reaches onEnd below and
                                      // opens the editor as normal.
          const dx = e.clientX - startClientX;
          const dy = e.clientY - startClientY;

          if (!dragging) {
            const threshold = dragPointerType === 'touch'
              ? weekDragCfg.TOUCH_MOVE_THRESHOLD_PX
              : weekDragCfg.MOVE_THRESHOLD_PX;
            if (Math.hypot(dx, dy) < threshold) return;
            dragging = true;
            boxEl.classList.add('dragging');
          }

          // Vertical — time of day, same math as the single-day grid's
          // own drag, just at this module's own hourHeight.
          const deltaMinutes = (dy / cfg.hourHeight) * 60;
          const rawStart      = startMinutesAt + deltaMinutes;
          const snapped        = Math.round(rawStart / weekDragCfg.SNAP_MIN) * weekDragCfg.SNAP_MIN;
          record.startMinutes = Math.max(0, Math.min(24 * 60 - record.durationMinutes, snapped));
          boxEl.style.top = ((record.startMinutes / 60) * cfg.hourHeight) + 'px';

          // Horizontal — snap over to whichever day column the pointer
          // has moved past, clamped to whatever's currently loaded.
          const deltaCols = Math.round(dx / cfg.colWidth);
          const targetIdx = Math.max(0, Math.min(dates.length - 1, startColIndex + deltaCols));
          if (colEls[targetIdx] && boxEl.parentElement !== colEls[targetIdx]) {
            colEls[targetIdx].appendChild(boxEl);
            const oldList = EventStore.getForDate(record.dateKey);
            const idx = oldList.indexOf(record);
            if (idx !== -1) oldList.splice(idx, 1);
            const d = dates[targetIdx];
            record.dateKey = EventStore.dateKeyFor(d.getFullYear(), d.getMonth(), d.getDate());
            EventStore.getForDate(record.dateKey).push(record);
          }

          if (typeof EventEditor !== 'undefined') {
            EventEditor.updateTimeLabel(record);
            EventEditor.updateFaceTime(record);
          }
        }

        function onEnd(e) {
          if (e.pointerId !== dragPointerId) return;
          document.removeEventListener('pointermove', onMove);
          document.removeEventListener('pointerup', onEnd);
          document.removeEventListener('pointercancel', onEnd);
          dragPointerId = null;

          const wasDragging = dragging;
          dragging = false;
          boxEl.classList.remove('dragging');

          if (wasDragging) {
            EventStore.save(record);
            // The day it started on also needs a sync if it's no
            // longer there, or the server keeps a stale copy on the
            // old date forever.
            if (record.dateKey !== originalDateKey) EventStore.save({ dateKey: originalDateKey });
            if (record.notify) NotificationScheduler.schedule(record);
          } else if (e.type === 'pointerup') {
            if (boxEl.classList.contains('editing') && e.target.closest('.day-time-grid-event-box-editor')) return;
            if (typeof EventEditor !== 'undefined') EventEditor.open(record);
          }
        }

        boxEl.addEventListener('pointerdown', (e) => {
          if (dragPointerId !== null) return;
          if (e.button !== undefined && e.button !== 0) return;
          // Don't let this bubble up into the column's own hold-to-
          // create listener (onWeekHoldPointerDown).
          e.stopPropagation();

          // While this box is in its inline-edit state, clicks on its
          // own editor controls (textarea, type/color buttons,
          // dropdowns) should behave like normal form interactions —
          // not get hijacked into a drag-move or a tap-to-reopen.
          if (boxEl.classList.contains('editing') && e.target.closest('.day-time-grid-event-box-editor')) {
            return;
          }

          dragPointerId   = e.pointerId;
          dragPointerType = e.pointerType || 'mouse';
          startClientX    = e.clientX;
          startClientY    = e.clientY;
          startMinutesAt  = record.startMinutes;
          startColIndex   = colEls.indexOf(boxEl.parentElement);
          originalDateKey = record.dateKey;

          document.addEventListener('pointermove', onMove);
          document.addEventListener('pointerup', onEnd);
          document.addEventListener('pointercancel', onEnd);
        });
      }

      function attachWeekBoxResize(record, handles) {
        const boxEl = record.el;
        let resizePointerId  = null;
        let edge              = null; // 'top' | 'bottom'
        let startClientY      = 0;
        let fixedMinutes       = 0; // the edge that does NOT move
        let ownMinutesAtStart  = 0; // the edge that DOES move, before drag

        function onMove(e) {
          if (e.pointerId !== resizePointerId) return;
          const dy = e.clientY - startClientY;
          const deltaMinutes = (dy / cfg.hourHeight) * 60;
          const rawMoving = ownMinutesAtStart + deltaMinutes;
          const snapped   = Math.round(rawMoving / weekResizeCfg.SNAP_MIN) * weekResizeCfg.SNAP_MIN;

          if (edge === 'bottom') {
            const newEnd = Math.max(fixedMinutes + weekResizeCfg.MIN_DURATION, Math.min(24 * 60, snapped));
            record.durationMinutes = newEnd - fixedMinutes;
          } else {
            const newStart = Math.min(fixedMinutes - weekResizeCfg.MIN_DURATION, snapped);
            const clampedStart = Math.max(0, newStart);
            record.startMinutes    = clampedStart;
            record.durationMinutes = fixedMinutes - clampedStart;
          }

          const top    = (record.startMinutes / 60) * cfg.hourHeight;
          const height = (record.durationMinutes / 60) * cfg.hourHeight;
          boxEl.style.top    = top + 'px';
          boxEl.style.height = Math.max(height, 15) + 'px';
          if (typeof EventEditor !== 'undefined') {
            EventEditor.updateTimeLabel(record);
            EventEditor.updateFaceTime(record);
          }
        }

        function onEnd(e) {
          if (e.pointerId !== resizePointerId) return;
          document.removeEventListener('pointermove', onMove);
          document.removeEventListener('pointerup', onEnd);
          document.removeEventListener('pointercancel', onEnd);
          resizePointerId = null;
          boxEl.classList.remove('resizing');
          EventStore.save(record);
          if (record.notify) NotificationScheduler.schedule(record);
        }

        function startResize(e, whichEdge) {
          if (resizePointerId !== null) return;
          if (record.locked) return;
          if (e.button !== undefined && e.button !== 0) return;
          e.stopPropagation();

          resizePointerId = e.pointerId;
          edge            = whichEdge;
          startClientY    = e.clientY;

          if (whichEdge === 'bottom') {
            fixedMinutes      = record.startMinutes;
            ownMinutesAtStart = record.startMinutes + record.durationMinutes;
          } else {
            fixedMinutes      = record.startMinutes + record.durationMinutes;
            ownMinutesAtStart = record.startMinutes;
          }

          boxEl.classList.add('resizing');
          document.addEventListener('pointermove', onMove);
          document.addEventListener('pointerup', onEnd);
          document.addEventListener('pointercancel', onEnd);
        }

        handles.topHandle.addEventListener('pointerdown', (e) => startResize(e, 'top'));
        handles.bottomHandle.addEventListener('pointerdown', (e) => startResize(e, 'bottom'));
      }

      function buildWeekEventBox(record, colEl) {
        // This record may already have a box mounted somewhere else —
        // the single-day mini calendar, or a week column from an
        // earlier open() of this same overlay (buildInitial wipes and
        // rebuilds gridEl from scratch every time the week view
        // opens, which detaches any old box from the document without
        // ever clearing record.el). Tear that stale one down first so
        // there's only ever one live box for this record, and so its
        // cached inline editor (built as a child of the old box) gets
        // rebuilt fresh against the new one instead of silently doing
        // nothing.
        detachRecordBox(record);

        const boxEl = document.createElement('div');
        boxEl.className = 'day-time-grid-event-box';
        // Overrides the 34px/6px gutter offsets baked into the base
        // class (sized for DayTimeGrid's own wide single-day grid) so
        // the box actually fits this narrow week column.
        boxEl.style.left = '2px';
        boxEl.style.right = '2px';

        const topHandle = document.createElement('div');
        topHandle.className = 'day-time-grid-event-box-handle top';
        const bottomHandle = document.createElement('div');
        bottomHandle.className = 'day-time-grid-event-box-handle bottom';
        boxEl.appendChild(topHandle);
        boxEl.appendChild(bottomHandle);

        const contentEl = document.createElement('div');
        contentEl.className = 'day-time-grid-event-box-content';
        contentEl.textContent = 'New Event';
        boxEl.appendChild(contentEl);
        // Press-and-drag (or a plain tap) on the box is handled by
        // attachWeekBoxDrag below — it stops the pointerdown from
        // bubbling into the column's own hold-to-create listener,
        // moves the box (time and/or day) while dragging, and reopens
        // the editor on a plain tap that never turns into a drag.

        const notifyBadge = document.createElement('div');
        notifyBadge.className = 'day-time-grid-event-box-notify-badge';
        notifyBadge.innerHTML =
          '<svg viewBox="0 0 24 24" width="7" height="7" fill="none" stroke="currentColor" ' +
          'stroke-width="3" stroke-linecap="round" stroke-linejoin="round">' +
          '<path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9"></path>' +
          '<path d="M13.73 21a2 2 0 0 1-3.46 0"></path></svg>';
        boxEl.appendChild(notifyBadge);

        const lockBadge = document.createElement('div');
        lockBadge.className = 'day-time-grid-event-box-lock-badge';
        lockBadge.innerHTML =
          '<svg viewBox="0 0 24 24" width="7" height="7" fill="none" stroke="currentColor" ' +
          'stroke-width="3" stroke-linecap="round" stroke-linejoin="round">' +
          '<rect x="4" y="10" width="16" height="10" rx="2"></rect>' +
          '<path d="M7 10V7a5 5 0 0 1 10 0v3"></path></svg>';
        boxEl.appendChild(lockBadge);

        colEl.appendChild(boxEl);
        const top    = (record.startMinutes / 60) * cfg.hourHeight;
        const height = (record.durationMinutes / 60) * cfg.hourHeight;
        boxEl.style.top    = top + 'px';
        boxEl.style.height = Math.max(height, 15) + 'px';

        record.el = boxEl;
        if (typeof EventEditor !== 'undefined') EventEditor.renderBoxFace(record);
        if (typeof DayTimeGrid !== 'undefined') {
          DayTimeGrid.setNotifyBadge(record, record.notify);
          DayTimeGrid.setLockedState(record, record.locked);
        }
        attachWeekBoxDrag(record);
        attachWeekBoxResize(record, { topHandle, bottomHandle });
        return boxEl;
      }

      let weekPasteMenuEl = null;
      let weekPasteMenuMinutes = 0;
      let weekPasteMenuDateKey = '';
      let weekPasteMenuColEl = null;

      function buildWeekPasteMenu() {
        weekPasteMenuEl = document.createElement('div');
        weekPasteMenuEl.className = 'day-time-grid-paste-menu';

        const item = document.createElement('button');
        item.type = 'button';
        item.className = 'day-time-grid-paste-menu-item';
        item.textContent = 'Paste';
        item.addEventListener('click', (e) => {
          e.stopPropagation();
          hideWeekPasteMenu();
          pasteWeekBoxAt(weekPasteMenuDateKey, weekPasteMenuMinutes, weekPasteMenuColEl);
        });

        const closeBtn2 = document.createElement('button');
        closeBtn2.type = 'button';
        closeBtn2.className = 'day-time-grid-paste-menu-close';
        closeBtn2.setAttribute('aria-label', 'Close');
        closeBtn2.textContent = '\u2715';
        closeBtn2.addEventListener('click', (e) => {
          e.stopPropagation();
          hideWeekPasteMenu();
        });

        weekPasteMenuEl.appendChild(item);
        weekPasteMenuEl.appendChild(closeBtn2);
        document.body.appendChild(weekPasteMenuEl);
      }

      function hideWeekPasteMenu() {
        if (weekPasteMenuEl) weekPasteMenuEl.classList.remove('open');
        document.removeEventListener('pointerdown', onOutsideWeekPasteMenu, true);
        scrollEl.removeEventListener('scroll', hideWeekPasteMenu, true);
      }

      function onOutsideWeekPasteMenu(e) {
        if (weekPasteMenuEl && !weekPasteMenuEl.contains(e.target)) hideWeekPasteMenu();
      }

      function showWeekPasteMenu(clientX, clientY, dateKey, minutes, colEl) {
        if (!weekPasteMenuEl) buildWeekPasteMenu();
        weekPasteMenuDateKey = dateKey;
        weekPasteMenuMinutes = minutes;
        weekPasteMenuColEl = colEl;
        weekPasteMenuEl.style.left = clientX + 'px';
        weekPasteMenuEl.style.top  = clientY + 'px';
        weekPasteMenuEl.classList.add('open');

        requestAnimationFrame(() => {
          if (!weekPasteMenuEl) return;
          const rect = weekPasteMenuEl.getBoundingClientRect();
          const maxLeft = window.innerWidth - rect.width - 8;
          const maxTop  = window.innerHeight - rect.height - 8;
          if (rect.left > maxLeft) weekPasteMenuEl.style.left = Math.max(8, maxLeft) + 'px';
          if (rect.top  > maxTop)  weekPasteMenuEl.style.top  = Math.max(8, maxTop) + 'px';
        });

        // Deferred for the same reason as DayTimeGrid's version — the
        // right-click's own pointerdown shouldn't instantly count as
        // "outside" and close this again. Also closes on scrolling
        // the week grid horizontally/vertically, since the popup is
        // positioned in viewport coordinates and would otherwise
        // drift away from the cell it was opened next to.
        setTimeout(() => {
          document.addEventListener('pointerdown', onOutsideWeekPasteMenu, true);
          scrollEl.addEventListener('scroll', hideWeekPasteMenu, true);
        }, 0);
      }

      function handleWeekGridContextMenu(e) {
        // Same rule as DayTimeGrid: leave an existing box's own
        // right-click alone rather than popping the paste menu over
        // it.
        if (e.target.closest && e.target.closest('.day-time-grid-event-box')) return;
        // Only fire inside an actual day column body — not the
        // header row or the fixed hour gutter.
        const colEl = e.target.closest && e.target.closest('.week-view-daycol');
        if (!colEl) return;
        if (!BoxClipboard.has()) return;
        const idx = colEls.indexOf(colEl);
        if (idx === -1 || !dates[idx]) return;
        const dateKey = EventStore.dateKeyFor(dates[idx].getFullYear(), dates[idx].getMonth(), dates[idx].getDate());
        const minutes = weekPasteMinutesFromClientY(colEl, e.clientY);
        showWeekPasteMenu(e.clientX, e.clientY, dateKey, minutes, colEl);
      }

      // Drops a full copy of BoxClipboard's saved box onto the given
      // week column at `startMinutes` — mirrors DayTimeGrid.pasteBoxAt,
      // just targeting whichever date/column was actually
      // right-clicked instead of "the currently locked-in day".
      function pasteWeekBoxAt(dateKey, startMinutes, colEl) {
        const copied = BoxClipboard.get();
        if (!copied || !colEl) return;

        const durationMinutes = copied.durationMinutes || weekHoldCfg.SNAP_MIN;
        const record = EventStore.create(dateKey, startMinutes, durationMinutes);
        record.type              = copied.type;
        record.color             = copied.color;
        record.description       = copied.description;
        record.manualLeftUnits   = copied.manualLeftUnits;
        record.manualWidthUnits  = copied.manualWidthUnits;
        record.notify            = copied.notify;
        record.locked            = copied.locked;

        buildWeekEventBox(record, colEl);
        if (record.notify) NotificationScheduler.schedule(record);
        toast('Pasted.');
      }

      // Counterpart to DayTimeGrid.renderNewEventsForDate, for the
      // week grid: paints freshly-created records straight into
      // whichever visible day column matches dateKey, so a "copy to
      // other days" (or AI-created event) that lands on a date
      // already showing in this week view appears immediately —
      // without this, the box only exists in EventStore until the
      // week view is closed/reopened (or the page is refreshed) and
      // buildInitial() re-reads EventStore from scratch.
      function renderNewEventsForDate(dateKey, records) {
        const idx = dates.findIndex((d) => EventStore.dateKeyFor(d.getFullYear(), d.getMonth(), d.getDate()) === dateKey);
        if (idx === -1 || !colEls[idx]) return;
        records.forEach((record) => buildWeekEventBox(record, colEls[idx]));
      }

      function weekMinutesFromClientY(colEl, clientY) {
        const rect = colEl.getBoundingClientRect();
        const localY = clientY - rect.top;
        const rawMinutes = (localY / cfg.hourHeight) * 60;
        const snapped = Math.round(rawMinutes / weekHoldCfg.SNAP_MIN) * weekHoldCfg.SNAP_MIN;
        return Math.max(0, Math.min(24 * 60 - weekHoldCfg.SNAP_MIN, snapped));
      }

      // Same fix as DayTimeGrid's pasteMinutesFromClientY: paste
      // needs its own 15-minute snap instead of weekHoldCfg.SNAP_MIN
      // (60/hourly), which is only meant for the hold-to-create
      // indicator.
      const WEEK_PASTE_SNAP_MIN = 15;
      function weekPasteMinutesFromClientY(colEl, clientY) {
        const rect = colEl.getBoundingClientRect();
        const localY = clientY - rect.top;
        const rawMinutes = (localY / cfg.hourHeight) * 60;
        const snapped = Math.round(rawMinutes / WEEK_PASTE_SNAP_MIN) * WEEK_PASTE_SNAP_MIN;
        return Math.max(0, Math.min(24 * 60 - WEEK_PASTE_SNAP_MIN, snapped));
      }

      function weekPositionHoldIndicator(minutes) {
        if (!weekHoldIndicatorEl) return;
        const top    = (minutes / 60) * cfg.hourHeight;
        const height = (weekHoldCfg.SNAP_MIN / 60) * cfg.hourHeight;
        weekHoldIndicatorEl.style.top    = top + 'px';
        weekHoldIndicatorEl.style.height = height + 'px';
      }

      function weekBeginHoldVisual(colEl, minutes) {
        weekHoldIndicatorEl = document.createElement('div');
        weekHoldIndicatorEl.className = 'week-view-hold-indicator';
        colEl.appendChild(weekHoldIndicatorEl);
        weekPositionHoldIndicator(minutes);
        weekHoldIndicatorEl.style.transition = 'none';
        weekHoldIndicatorEl.style.opacity = '0';
        // eslint-disable-next-line no-unused-expressions
        weekHoldIndicatorEl.offsetHeight; // force reflow
        weekHoldIndicatorEl.style.transition = 'opacity ' + weekHoldCfg.HOLD_MS + 'ms linear';
        weekHoldIndicatorEl.style.opacity = '1';
      }

      function weekCancelHoldVisual() {
        if (!weekHoldIndicatorEl) return;
        const el = weekHoldIndicatorEl;
        weekHoldIndicatorEl = null;
        el.style.transition = 'opacity 140ms ease';
        el.style.opacity = '0';
        setTimeout(() => el.remove(), 160);
      }

      function weekConfirmHoldVisual() {
        if (!weekHoldIndicatorEl) return;
        const el = weekHoldIndicatorEl;
        weekHoldIndicatorEl = null;
        el.style.transition = 'opacity 120ms ease';
        el.style.opacity = '1';
        el.classList.add('confirmed');
        setTimeout(() => {
          el.style.transition = 'opacity 220ms ease';
          el.style.opacity = '0';
          setTimeout(() => el.remove(), 240);
        }, weekHoldCfg.CONFIRM_MS);
      }

      function weekClearHoldState() {
        if (weekHoldTimer) { clearTimeout(weekHoldTimer); weekHoldTimer = null; }
        weekHoldPointerId = null;
        document.removeEventListener('pointermove', onWeekHoldPointerMove);
        document.removeEventListener('pointerup', onWeekHoldPointerEnd);
        document.removeEventListener('pointercancel', onWeekHoldPointerEnd);
      }

      function onWeekHoldPointerMove(e) {
        if (e.pointerId !== weekHoldPointerId) return;
        const dx = e.clientX - weekHoldStartX;
        const dy = e.clientY - weekHoldStartY;
        if (Math.hypot(dx, dy) > weekHoldCfg.MOVE_CANCEL_PX) {
          weekCancelHoldVisual();
          weekClearHoldState();
        }
      }

      function onWeekHoldPointerEnd(e) {
        if (e.pointerId !== weekHoldPointerId) return;
        // Timer already fired and handed off to the lock-in flow —
        // nothing left to cancel, just drop pointer tracking.
        if (!weekHoldTimer) { weekClearHoldState(); return; }
        weekCancelHoldVisual();
        weekClearHoldState();
      }

      function onWeekHoldPointerDown(colEl, d, e) {
        if (weekHoldPointerId !== null) return;
        if (e.button !== undefined && e.button !== 0) return;
        // Only the empty grid track itself — not an existing event
        // box, which handles its own click/drag.
        if (e.target !== colEl && !e.target.classList.contains('week-view-hour-line')) return;

        weekHoldPointerId = e.pointerId;
        weekHoldStartX = e.clientX;
        weekHoldStartY = e.clientY;
        const minutes = weekMinutesFromClientY(colEl, e.clientY);
        weekBeginHoldVisual(colEl, minutes);

        document.addEventListener('pointermove', onWeekHoldPointerMove);
        document.addEventListener('pointerup', onWeekHoldPointerEnd);
        document.addEventListener('pointercancel', onWeekHoldPointerEnd);

        weekHoldTimer = setTimeout(() => {
          weekHoldTimer = null;
          weekConfirmHoldVisual();
          const dateKey = EventStore.dateKeyFor(d.getFullYear(), d.getMonth(), d.getDate());
          const record = EventStore.create(dateKey, minutes, weekHoldCfg.SNAP_MIN);
          buildWeekEventBox(record, colEl);
          if (typeof EventEditor !== 'undefined') EventEditor.open(record);
        }, weekHoldCfg.HOLD_MS);
      }

      // Clicking a day here: select it the same way the mini calendar
      // does, then teleport straight into that day's hourly view —
      // instant close (no slide-out), instant lock-in (no scroll/FLIP
      // wait), so there's no gap between "clicked" and "day view is
      // showing" the way there used to be during the close animation.
      function selectDayAndLockIn(d) {
        if (!isOpen || isSelectingDay) return;
        isSelectingDay = true;
        cameFromWeek = true;
        SelectedDayState.set(d.getFullYear(), d.getMonth(), d.getDate());
        close(true);
        if (typeof DayViewScroll !== 'undefined' &&
            typeof DayViewState !== 'undefined' &&
            DayViewState.get() === DayViewState.STATES.CALENDAR) {
          DayViewScroll.triggerForward();
        }
        isSelectingDay = false;
      }

      // Runs applyGutterPin() every single animation frame, the whole
      // time the week view is open — started in open(), stopped in
      // close(). This is deliberately simple: no throttling, no
      // pointer-state checks, no "settled" detection, just an
      // unconditional per-frame sync, so the gutter can never be more
      // than one frame out of date no matter how the view is
      // scrolled (touch, trackpad, scrollbar drag, arrow keys,
      // programmatic scrollTo). The cost is one scrollLeft read and
      // one transform write per frame, which is negligible.
      function gutterPinLoop() {
        applyGutterPin();
        gutterPinRafId = requestAnimationFrame(gutterPinLoop);
      }

      async function open() {
        if (isOpen) return;
        isOpen = true;
        // Same hard reload as Day view — never trust whatever's
        // already in memory (or already mounted in a column from a
        // previous open), always re-fetch fresh from the server first.
        await EventStore.reloadFromServer();
        render();
        lockBodyScroll();
        // Teleport in — skip both the app-fade-out phase (used to be
        // appExitMs, sequenced before the overlay even started moving)
        // and the overlay's own slide-in transition. Same reasoning as
        // close(instant): nothing needs to be seen mid-flight, so don't
        // make the user wait through it just to watch it happen.
        overlayEl.style.transition = 'none';
        appEl.style.transition = 'none';
        appEl.classList.add('week-view-exiting');
        overlayEl.classList.add('open');
        scrollToRelevantHour();
        updateGotoTodayVisibility();
        void overlayEl.offsetWidth; // force layout before restoring transitions
        overlayEl.style.transition = '';
        appEl.style.transition = '';
        document.addEventListener('keydown', onKeydown);
        if (gutterPinRafId == null) gutterPinRafId = requestAnimationFrame(gutterPinLoop);
      }

      // `instant`: skip the slide-down/fade-back-in transitions entirely
      // and snap straight to closed. Used whenever this close is really
      // just the first half of a Week -> Day teleport (top-bar Day tab,
      // or picking a day from inside the week grid) — playing the normal
      // 420ms/320ms exit animation there just delays the day view
      // appearing for no visual benefit, since nothing needs to be seen
      // mid-flight when the destination is going to snap in anyway.
      function close(instant) {
        if (!isOpen) return;
        isOpen = false;
        if (instant) {
          overlayEl.style.transition = 'none';
          appEl.style.transition = 'none';
          overlayEl.classList.remove('open');
          appEl.classList.remove('week-view-exiting');
          unlockBodyScroll();
          // Force layout so the 'none' transition actually takes hold
          // before handing control back to the normal CSS transitions
          // (otherwise the next real open/close could inherit 'none').
          void overlayEl.offsetWidth;
          overlayEl.style.transition = '';
          appEl.style.transition = '';
        } else {
          overlayEl.classList.remove('open');
          setTimeout(() => {
            appEl.classList.remove('week-view-exiting');
            unlockBodyScroll();
          }, cfg.slideMs);
        }
        document.removeEventListener('keydown', onKeydown);
        if (gutterPinRafId != null) { cancelAnimationFrame(gutterPinRafId); gutterPinRafId = null; }
      }

      function onKeydown(e) {
        if (e.key === 'Escape') close();
      }

      // Shows/labels the floating button while locked into a single
      // day: "Back to week" if that day was opened by clicking it in
      // the week view, or plain "Week" if the lock-in happened any
      // other way (matches the normal .month-nav Week button's
      // behavior — either way, clicking it opens the week view).
      function updateBackToWeekBtn(state) {
        if (!backToWeekBtn || typeof DayViewState === 'undefined') return;
        if (state === DayViewState.STATES.LOCKED) {
          backToWeekBtn.textContent = cameFromWeek ? 'Back to week' : 'Week';
          backToWeekBtn.classList.add('visible');
        } else if (state === DayViewState.STATES.CALENDAR) {
          backToWeekBtn.classList.remove('visible');
          cameFromWeek = false;
        }
      }

      function init() {
        if (!overlayEl) return;
        if (openBtn) openBtn.addEventListener('click', open);
        closeBtn.addEventListener('click', close);
        scrollEl.addEventListener('scroll', onScroll, { passive: true });
        // Passive, state-only tracking — never preventDefault'd, so
        // native scrolling (mouse-drag, touch swipe, trackpad) behaves
        // exactly as the browser normally does. This just tells
        // scheduleSettleCheck whether a gesture is still in progress,
        // so it can tell "hit the edge while still holding" apart from
        // an actual "let go".
        scrollEl.addEventListener('pointerdown', onScrollAreaPointerDown, { passive: true });
        document.addEventListener('pointerup', onScrollAreaPointerUp, { passive: true });
        document.addEventListener('pointercancel', onScrollAreaPointerUp, { passive: true });
        window.addEventListener('blur', onScrollAreaPointerUp); // safety net if the pointer is released outside the window
        if (gotoTodayBtn) gotoTodayBtn.addEventListener('click', goToToday);
        if (backToWeekBtn) backToWeekBtn.addEventListener('click', open);
        if (typeof DayViewState !== 'undefined') {
          DayViewState.onChange((next) => updateBackToWeekBtn(next));
        }

        // Right-click anywhere on the week grid: swallow the browser's
        // own context menu (capture phase, same reasoning as
        // DayTimeGrid's own listener — see ensureBuilt there), then
        // show our own "Paste" popup when it makes sense to (see
        // handleWeekGridContextMenu above for what that requires).
        // Attached once to gridEl itself rather than per-column,
        // since gridEl is never replaced — only its children are, as
        // days scroll in and out — so this survives every rebuild.
        gridEl.addEventListener('contextmenu', (e) => {
          e.preventDefault();
          handleWeekGridContextMenu(e);
        }, true);
      }

      // Live hour-row-spacing control (topbar slider, desktop only),
      // counterpart to DayTimeGrid.setHourHeight. The week grid isn't
      // rebuilt on every open the way DayTimeGrid's is lazy-built —
      // buildInitial() already ran by the time anyone can reach this
      // slider — so rather than a full rebuild (which would reset
      // scroll position) this just repositions everything already in
      // the DOM in place: the gutter labels, each column's hour
      // lines, the current-time indicator, and every mounted event
      // box (read back from EventStore per date, same source
      // buildWeekEventBox used to place them originally).
      function setHourHeight(px) {
        cfg.hourHeight = px;
        if (!gutterBodyEl) return; // week view never opened yet — cfg change alone is enough
        gridEl.style.setProperty('--week-view-hour-h', cfg.hourHeight + 'px');
        if (gutterBodyEl) gutterBodyEl.style.height = (cfg.hourHeight * 24) + 'px';
        gutterBodyEl.querySelectorAll('.week-view-hour-label').forEach((label, h) => {
          label.style.top = (h * cfg.hourHeight) + 'px';
        });

        const today = new Date();
        const nowMinutes = today.getHours() * 60 + today.getMinutes();

        colEls.forEach((col, i) => {
          col.style.height = (cfg.hourHeight * 24) + 'px';
          let h = 0;
          col.querySelectorAll('.week-view-hour-line').forEach((line) => {
            line.style.top = (h * cfg.hourHeight) + 'px';
            h++;
          });

          const nowLine = col.querySelector('.week-view-now-line');
          const nowDot = col.querySelector('.week-view-now-dot');
          if (nowLine && nowDot) {
            const y = (nowMinutes / 60) * cfg.hourHeight;
            nowLine.style.top = y + 'px';
            nowDot.style.top = y + 'px';
          }

          const d = dates[i];
          if (!d) return;
          const dateKey = EventStore.dateKeyFor(d.getFullYear(), d.getMonth(), d.getDate());
          EventStore.getForDate(dateKey).forEach((record) => {
            if (!record.el || record.el.parentElement !== col) return;
            const top = (record.startMinutes / 60) * cfg.hourHeight;
            const height = (record.durationMinutes / 60) * cfg.hourHeight;
            record.el.style.top = top + 'px';
            record.el.style.height = Math.max(height, 15) + 'px';
          });
        });
      }

      // Live day-column-width control (topbar slider, desktop only),
      // the horizontal counterpart to setHourHeight above. Unlike the
      // hour grid (absolutely-positioned lines/events that each need
      // repositioning), the day columns are real CSS Grid tracks sized
      // off the --week-view-col-w variable (see .week-view-grid), so
      // updating that one variable resizes every column — header,
      // body, and everything inside it — in place with no rebuild.
      // cfg.colWidth is kept in sync too since scroll-position math
      // (paging, snapping, drag-reorder) reads it directly.
      function setColWidth(px) {
        cfg.colWidth = px;
        cfg.colWidthOverride = px;
        if (gridEl) gridEl.style.setProperty('--week-view-col-w', px + 'px');
      }

      // Precise "which day is actually centered right now" — same math
      // as updateGotoTodayVisibility above, computed live off scroll
      // position rather than off currentVisibleIdx (which is only a
      // coarser approximation kept for edge-loading, and being off by
      // even one day here was enough to make Day view think it wasn't
      // showing today and hide the current-time red bar).
      function currentCenteredDate() {
        if (!dates.length) return null;
        const gutterW = 34;
        const centerX = scrollEl.scrollLeft + (scrollEl.clientWidth - gutterW) / 2;
        const centerIdx = Math.round((centerX - cfg.colWidth / 2) / cfg.colWidth);
        return addDays(dates[0], centerIdx);
      }

      return { init, open, close, isOpen: () => isOpen, goToDate, renderNewEventsForDate, setHourHeight, getHourHeight: () => cfg.hourHeight, setColWidth, getColWidth: () => cfg.colWidth, getCurrentDate: currentCenteredDate };
    })();
    WeekView.init();

    const HourGapControl = (() => {
      const STORAGE_KEY = 'nb_hourGapPx';
      const slider = document.getElementById('globalHourGapSlider');

      function apply(px) {
        if (typeof DayTimeGrid !== 'undefined') DayTimeGrid.setHourHeight(px);
        if (typeof WeekView !== 'undefined') WeekView.setHourHeight(px);
      }

      function init() {
        if (!slider) return;
        const saved = parseInt(localStorage.getItem(STORAGE_KEY), 10);
        if (!Number.isNaN(saved)) {
          slider.value = saved;
          apply(saved);
        }
        // 'input' fires continuously while dragging, so both grids
        // track the handle live rather than only snapping once on
        // release.
        slider.addEventListener('input', () => {
          const px = parseInt(slider.value, 10);
          apply(px);
          localStorage.setItem(STORAGE_KEY, String(px));
        });
      }

      return { init };
    })();
    HourGapControl.init();

    const DayWidthControl = (() => {
      const STORAGE_KEY = 'nb_dayColWidthPx';
      const slider = document.getElementById('globalDayWidthSlider');

      function apply(px) {
        if (typeof WeekView !== 'undefined') WeekView.setColWidth(px);
      }

      function init() {
        if (!slider) return;
        const saved = parseInt(localStorage.getItem(STORAGE_KEY), 10);
        if (!Number.isNaN(saved)) {
          slider.value = saved;
          apply(saved);
        }
        // 'input' fires continuously while dragging, so the grid
        // tracks the handle live rather than only snapping once on
        // release.
        slider.addEventListener('input', () => {
          const px = parseInt(slider.value, 10);
          apply(px);
          localStorage.setItem(STORAGE_KEY, String(px));
        });
      }

      return { init };
    })();
    DayWidthControl.init();

    const TimezoneModal = (() => {
      const STORAGE_KEY = 'habitcal_tz_offset_min';
      // Every half-hour offset from UTC-12:00 to UTC+14:00 — covers
      // every real-world zone except the rare :45 outliers (Nepal,
      // Chatham Islands), which aren't worth the extra list noise here.
      const OPTIONS = [];
      for (let m = -12 * 60; m <= 14 * 60; m += 30) OPTIONS.push(m);

      function label(offsetMin) {
        const sign = offsetMin < 0 ? '-' : '+';
        const abs  = Math.abs(offsetMin);
        const h    = String(Math.floor(abs / 60)).padStart(2, '0');
        const m    = String(abs % 60).padStart(2, '0');
        return 'GMT' + sign + h + ':' + m;
      }

      function deviceOffsetMinutes() {
        return -new Date().getTimezoneOffset();
      }

      function getSelected() {
        try {
          const raw = localStorage.getItem(STORAGE_KEY);
          if (raw !== null) {
            const n = parseInt(raw, 10);
            if (Number.isFinite(n)) return n;
          }
        } catch { /* ignore */ }
        return deviceOffsetMinutes();
      }

      function updateButtonLabel() {
        const labelEl = document.getElementById('globalTzLabel');
        if (labelEl) labelEl.textContent = label(getSelected());
      }

      function setSelected(offsetMin) {
        try { localStorage.setItem(STORAGE_KEY, String(offsetMin)); } catch { /* ignore */ }
        updateButtonLabel();
      }

      let overlayEl = null, listEl = null;

      function ensureBuilt() {
        if (overlayEl) return;

        overlayEl = document.createElement('div');
        overlayEl.className = 'repeat-days-overlay';

        const card = document.createElement('div');
        card.className = 'repeat-days-card';

        const title = document.createElement('div');
        title.className = 'repeat-days-title';
        title.textContent = 'Select Timezone';

        listEl = document.createElement('div');
        listEl.className = 'tz-picker-list';
        OPTIONS.forEach((offsetMin) => {
          const opt = document.createElement('button');
          opt.type = 'button';
          opt.className = 'tz-picker-option';
          opt.textContent = label(offsetMin);
          opt.dataset.offset = String(offsetMin);
          opt.addEventListener('click', () => {
            setSelected(offsetMin);
            render();
            close();
          });
          listEl.appendChild(opt);
        });

        const actions = document.createElement('div');
        actions.className = 'repeat-days-actions';
        const closeBtn = document.createElement('button');
        closeBtn.type = 'button';
        closeBtn.textContent = 'Close';
        closeBtn.addEventListener('click', close);
        actions.appendChild(closeBtn);

        card.appendChild(title);
        card.appendChild(listEl);
        card.appendChild(actions);
        overlayEl.appendChild(card);
        document.body.appendChild(overlayEl);

        // Tapping the dimmed backdrop (not the card itself) closes it,
        // same convention as the other popups in the app.
        overlayEl.addEventListener('click', (e) => { if (e.target === overlayEl) close(); });
      }

      function render() {
        const current = getSelected();
        listEl.querySelectorAll('.tz-picker-option').forEach((opt) => {
          opt.classList.toggle('selected', parseInt(opt.dataset.offset, 10) === current);
        });
      }

      function open() {
        ensureBuilt();
        render();
        overlayEl.classList.add('open');
        const sel = listEl.querySelector('.tz-picker-option.selected');
        if (sel) sel.scrollIntoView({ block: 'center' });
      }

      function close() {
        if (overlayEl) overlayEl.classList.remove('open');
      }

      // Exposed so other modules (TalkAI) can tell the backend which
      // offset the person is actually looking at — getSelected()
      // already falls back to the device's own offset when nothing's
      // been explicitly picked, and label() turns either into the
      // same "GMT+03:00" string shown on the top-bar button.
      return { open, close, updateButtonLabel, getSelected, label };
    })();
    TimezoneModal.updateButtonLabel();

    const GlobalTopBar = (() => {
      const dayTab       = document.getElementById('globalTabDay');
      const weekTab      = document.getElementById('globalTabWeek');
      const monthTab     = document.getElementById('globalTabMonth');
      const selectDayBtn = document.getElementById('globalSelectDayBtn');
      const tzBtn        = document.getElementById('globalTzBtn');
      const weekOverlayEl = document.getElementById('weekViewOverlay');

      function setActiveTab(view) {
        if (dayTab)   dayTab.classList.toggle('active', view === 'day');
        if (weekTab)  weekTab.classList.toggle('active', view === 'week');
        if (monthTab) monthTab.classList.toggle('active', view === 'month');
      }

      // Reads the ACTUAL current view straight from the two things
      // that determine it (WeekView's overlay + DayViewState), rather
      // than tracking a separate "which tab is active" flag of its
      // own — the week/day view can also be opened from several other
      // buttons that predate this top bar (month-nav's own Week
      // button, backToWeekBtn, a day-cell click), so a self-tracked
      // flag would drift out of sync the moment one of those was used
      // instead of a tab.
      function currentView() {
        if (weekOverlayEl && weekOverlayEl.classList.contains('open')) return 'week';
        if (typeof DayViewState !== 'undefined' && DayViewState.get() === DayViewState.STATES.LOCKED) return 'day';
        return 'month';
      }

      function refreshActiveTab() { setActiveTab(currentView()); }

      function goToDayView() {
        // Going from Week view: sync SelectedDayState to whatever day
        // is actually centered in the week grid first. Without this,
        // Day view opens for whatever day was last selected via Month
        // view (often not what you were just looking at in Week view),
        // which is why it could look "empty" — it wasn't rendering the
        // wrong thing, it was correctly showing a different, genuinely
        // empty day.
        if (typeof WeekView !== 'undefined' && WeekView.isOpen()) {
          const d = WeekView.getCurrentDate && WeekView.getCurrentDate();
          if (d) SelectedDayState.set(d.getFullYear(), d.getMonth(), d.getDate());
          WeekView.close(true); // instant — no slide-out before teleporting into Day
        }
        if (typeof DayViewState !== 'undefined' && DayViewState.get() !== DayViewState.STATES.LOCKED) {
          DayViewScroll.triggerForward();
        } else if (typeof DayTimeGrid !== 'undefined' && DayTimeGrid.refresh) {
          // DayViewState was already LOCKED underneath Week view —
          // opening Week view never changes it, so the LOCKED
          // transition (and the fetch/repaint it drives) never re-fires
          // on its own here. Force that same refresh directly instead.
          DayTimeGrid.refresh();
        }
      }

      function goToWeekView() {
        if (typeof WeekView !== 'undefined' && !WeekView.isOpen()) WeekView.open();
      }

      function goToMonthView() {
        if (typeof WeekView !== 'undefined' && WeekView.isOpen()) WeekView.close(true);
        if (typeof DayViewState !== 'undefined' && DayViewState.get() === DayViewState.STATES.LOCKED) {
          DayViewScroll.triggerBackward();
        }
      }

      // Called from DayPickerModal's date cells (see its own comment)
      // instead of LockedMonthNav.goToPickedDate directly — always
      // ends up showing the picked day's own detail view, no matter
      // which view the picker happened to be opened from.
      function goToDay(y, m, d) {
        LockedMonthNav.goToPickedDate(y, m, d);
        goToDayView();
      }

      // Only used when the picker was opened from the Month view
      // (see DayPickerModal's cell click handler). Doesn't care what
      // day was previously selected — it only checks whether the
      // picked date falls in a different month than what's currently
      // shown, and navigates the grid there if so. Never locks into
      // the day view; instead it just briefly shakes the picked
      // day's own cell so it's easy to spot in the grid.
      function goToDateInMonthView(y, m, d) {
        if (y !== viewYear || m !== viewMonth) {
          viewYear = y;
          viewMonth = m;
          renderCalendar();
        }
        SelectedDayState.set(y, m, d);

        // Wait a frame so a just-rebuilt grid (month changed) has its
        // fresh cells in the DOM before we go looking for the target.
        requestAnimationFrame(() => {
          const grid = document.getElementById('daysGrid');
          if (!grid) return;
          const cells = grid.querySelectorAll('.day-cell:not(.empty)');
          for (const cell of cells) {
            const numEl = cell.querySelector('.day-num');
            if (numEl && parseInt(numEl.textContent, 10) === d) {
              // Remove + force a reflow before re-adding, so picking
              // the same day twice in a row still restarts the shake
              // instead of it being a no-op (class already present).
              cell.classList.remove('daycell-shake');
              void cell.offsetWidth;
              cell.classList.add('daycell-shake');
              cell.addEventListener('animationend', () => cell.classList.remove('daycell-shake'), { once: true });

              // SelectedDayState.set() above also puts the persistent
              // blue "selected-mini-day" ring on this cell (via
              // applyMiniDaySelectionHighlight, elsewhere in the
              // file) — that ring is meant to last indefinitely when
              // it's marking the day locked into the day view, but
              // here it's just part of this one-off "here's the day
              // you picked" callout, so fade it back out after a few
              // seconds instead of leaving it on forever.
              setTimeout(() => cell.classList.remove('selected-mini-day'), 2200);
              break;
            }
          }
        });
      }

      function init() {
        if (dayTab)   dayTab.addEventListener('click', goToDayView);
        if (weekTab)  weekTab.addEventListener('click', goToWeekView);
        if (monthTab) monthTab.addEventListener('click', goToMonthView);
        if (selectDayBtn) selectDayBtn.addEventListener('click', () => DayPickerModal.open());
        if (tzBtn) tzBtn.addEventListener('click', () => TimezoneModal.open());

        if (typeof DayViewState !== 'undefined') DayViewState.onChange(refreshActiveTab);
        // Week view has no onChange hook of its own (unlike
        // DayViewState) and can be opened/closed from several older
        // buttons besides this bar's own Week tab — watching its
        // overlay's own open/close class directly catches all of them.
        if (weekOverlayEl && typeof MutationObserver !== 'undefined') {
          new MutationObserver(refreshActiveTab)
            .observe(weekOverlayEl, { attributes: true, attributeFilter: ['class'] });
        }
        refreshActiveTab();
      }

      return { init, goToDay, goToDateInMonthView, currentView, goToMonthView };
    })();
    GlobalTopBar.init();

    const ZoomBanner = (() => {
      const bannerEl = document.getElementById('zoomBanner');
      const btnEl    = document.getElementById('zoomBannerBtn');
      const vv       = window.visualViewport;
      // A little slack above 1.0 so ordinary sub-pixel rounding from
      // the browser doesn't flicker the banner on/off at rest.
      const THRESHOLD = 1.05;

      function isZoomed() {
        return !!vv && vv.scale > THRESHOLD;
      }

      function update() {
        if (!bannerEl) return;
        bannerEl.classList.toggle('show', isZoomed());
      }

      // There's no direct JS API to reset pinch-zoom. The standard
      // cross-browser workaround is to briefly force the viewport's
      // own maximum-scale/user-scalable down (which snaps the browser
      // back to 1x) and then restore the page's normal viewport meta
      // right after, so pinch/double-tap zoom keeps working normally
      // afterward instead of being permanently disabled.
      function unzoom() {
        const meta = document.querySelector('meta[name="viewport"]');
        if (!meta) return;
        const original = meta.getAttribute('content');
        meta.setAttribute('content', original + ', maximum-scale=1.0, user-scalable=no');
        setTimeout(() => {
          meta.setAttribute('content', original);
          update();
        }, 260);
      }

      function init() {
        if (!vv || !bannerEl) return;
        vv.addEventListener('resize', update);
        vv.addEventListener('scroll', update);
        if (btnEl) btnEl.addEventListener('click', unzoom);
        update();
      }

      return { init };
    })();
    ZoomBanner.init();

  
    const MoneyMode = (() => {
      let on = false;
      const $ = (id) => document.getElementById(id);
      const monthTab = $('globalTabMonth');
      const REDUCED = !!(window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches);
      const CACHE_KEY = 'moneyCache.v2';
      const BIG_DAY = 50; // days with |net| above this (€) get the colored tint + glow
      const SRC = { 'apple pay': 'Apple Pay', manual: 'Manual', cash: 'Cash', import: 'Imported', screenshot: 'Scanned' };

      // "2026-10" -> entries[]  (kept in memory + localStorage so the numbers show instantly)
      let months = {}, maps = {}, fetchedAt = {}, failed = false;
      const loading = new Set();
      try { months = JSON.parse(localStorage.getItem(CACHE_KEY)) || {}; } catch (e) { months = {}; }
      function persist() {
        try {
          const keys = Object.keys(months).sort();
          while (keys.length > 18) delete months[keys.shift()];
          localStorage.setItem(CACHE_KEY, JSON.stringify(months));
        } catch (e) {}
      }

      const fmt = (n) => {
        const a = Math.abs(n), r = Number(a.toFixed(2));
        const s = Number.isInteger(r) ? r.toFixed(0) : a.toFixed(2);
        return (n < -0.004 ? '\u2212' : '+') + '\u20AC' + s;
      };
      // Money-calendar cell display options. Saved on THIS device (localStorage), and only
      // applied on PC-width screens (> 760px); phones always use the compact format.
      const MOPT_KEY = 'moneyCellOpts.v1';
      let mopt = { sign: false, euro: false, full: false };
      try { mopt = { ...mopt, ...(JSON.parse(localStorage.getItem(MOPT_KEY)) || {}) }; } catch (e) {}
      const isPC = () => window.innerWidth > 760;
      const fmtCell = (n) => {
        const a = Math.abs(n), pc = isPC();
        const full = pc && mopt.full;
        let core;
        if (!full && a >= 10000) core = (a / 1000).toFixed(1).replace(/\.0$/, '') + 'k';
        else if (!full && a >= 100) core = String(Math.trunc(a));
        else { const r = Number(a.toFixed(2)); core = Number.isInteger(r) ? r.toFixed(0) : a.toFixed(2); }
        const sign = pc && mopt.sign ? (n < -0.004 ? '\u2212' : '+') : '';
        const euro = pc && mopt.euro ? '\u20AC' : '';
        return sign + euro + core;
      };
      [['toggleMoneySign', 'sign'], ['toggleMoneyEuro', 'euro'], ['toggleMoneyFull', 'full']].forEach(([id, key]) => {
        const el = document.getElementById(id); if (!el) return;
        el.checked = !!mopt[key];
        el.addEventListener('change', () => {
          mopt[key] = el.checked;
          try { localStorage.setItem(MOPT_KEY, JSON.stringify(mopt)); } catch (e) {}
          if (typeof on !== 'undefined' && on) paintAll();
        });
      });
      const mkey = (y, m) => y + '-' + pad(m + 1);
      const viewKey = () => mkey(viewYear, viewMonth);
      const dateKey = (d) => viewKey() + '-' + pad(d);
      const todayKey = () => { const t = new Date(); return t.getFullYear() + '-' + pad(t.getMonth() + 1) + '-' + pad(t.getDate()); };
      const setStatus = (s) => { $('moneyStatus').textContent = s; };

      // day -> entries for one month (cached until that month changes)
      function dayOf(mk) {
        if (!maps[mk]) {
          const map = {}; let max = 0;
          (months[mk] || []).forEach((e) => { (map[e.date] = map[e.date] || []).push(e); });
          Object.keys(map).forEach((k) => { const n = Math.abs(map[k].reduce((s, e) => s + e.amount, 0)); if (n > max) max = n; });
          maps[mk] = { map, max };
        }
        return maps[mk];
      }
      const netOf = (list) => list.reduce((s, e) => s + e.amount, 0);

      // smooth number count-up (cancels itself if called again)
      function countTo(el, to, fmtFn, dur) {
        const from = el._v || 0; el._v = to;
        cancelAnimationFrame(el._raf);
        if (REDUCED || from === to || window.__noCount) { el._v = to; el.textContent = fmtFn(to); return; }
        const t0 = performance.now(); dur = dur || 700;
        const step = (t) => {
          const p = Math.min(1, (t - t0) / dur), e = 1 - Math.pow(1 - p, 4);
          el.textContent = fmtFn(from + (to - from) * e);
          if (p < 1) el._raf = requestAnimationFrame(step); else el.textContent = fmtFn(to);
        };
        el._raf = requestAnimationFrame(step);
      }

      // ---- data (one month per request, cached, refreshed in the background) ----
      async function fetchMonth(mk) {
        if (loading.has(mk)) return false;
        loading.add(mk);
        try {
          const r = await fetch('/api/money?month=' + mk, { cache: 'no-store' });
          if (!r.ok) throw new Error('status ' + r.status);
          const data = (await r.json()).entries || [];
          const changed = JSON.stringify(data) !== JSON.stringify(months[mk]);
          months[mk] = data; delete maps[mk]; fetchedAt[mk] = Date.now(); persist();
          if (failed) { failed = false; setStatus(''); }
          return changed;
        } catch (e) {
          failed = true; setStatus('Could not load \u2014 tap to retry');
          return false;
        } finally { loading.delete(mk); }
      }
      function ensure(mk, force) {
        const had = !!months[mk];
        if (!force && had && Date.now() - (fetchedAt[mk] || 0) < 8000) return;
        fetchMonth(mk).then((changed) => {
          if (!on || viewKey() !== mk) return;
          if (changed || !had || failed) { paintAll(); renderSummary(); }
          prefetch();
        });
      }
      // Used by the phone swipe: resolves as soon as the month next to the current one is loaded
      // (instantly if prefetch already did it), so the new month appears with its numbers in place.
      window.__moneyReady = function (delta) {
        if (!on) return Promise.resolve();
        const d = new Date(viewYear, viewMonth + delta, 1), mk = mkey(d.getFullYear(), d.getMonth());
        return new Promise((res) => {
          if (!months[mk] && !loading.has(mk)) fetchMonth(mk);
          const t0 = Date.now();
          (function wait() { if (months[mk] || Date.now() - t0 > 1500) res(); else setTimeout(wait, 40); })();
        });
      };
      function prefetch() {
        const go = () => [-1, 1, -2, 2].forEach((dlt) => {
          const d = new Date(viewYear, viewMonth + dlt, 1), mk = mkey(d.getFullYear(), d.getMonth());
          if (!months[mk] && !loading.has(mk)) fetchMonth(mk);
        });
        setTimeout(go, 0);
      }
      async function load() { await fetchMonth(viewKey()); if (on) { paintAll(); renderSummary(); } }
      function invalidateMonth(mk) { delete maps[mk]; persist(); }

      // ---- painting: the grid always exists, numbers are layered on top ----
      function decorate(cell, d) {
        const mk = viewKey(), data = months[mk];
        cell.classList.remove('money-pos', 'money-neg', 'money-zero', 'money-small', 'money-future', 'money-loading');
        cell.style.removeProperty('--tint');
        cell.querySelectorAll('.money-amt, .money-skel').forEach((n) => n.remove());
        if (!cell._ms) { cell._ms = true; cell.style.setProperty('--i', d); if (!window.__noCount) cell.classList.add('money-enter'); }
        const k = dateKey(d);
        if (!data) {
          if (!failed) { cell.classList.add('money-loading'); const s = document.createElement('div'); s.className = 'money-skel'; cell.appendChild(s); }
          return;
        }
        const { map, max } = dayOf(mk), list = map[k] || [], net = netOf(list);
        if (!list.length) { cell.classList.add(k > todayKey() ? 'money-future' : 'money-zero'); cell._mk = mk; cell._net = 0; return; }
        if (Math.abs(net) > BIG_DAY) {
          cell.classList.add(net > 0 ? 'money-pos' : 'money-neg');
          cell.style.setProperty('--tint', (0.12 + 0.2 * Math.min(1, (Math.abs(net) - BIG_DAY) / Math.max(1, (max || BIG_DAY) - BIG_DAY))).toFixed(3));
        } else {
          cell.classList.add(net > 0 ? 'money-pos' : 'money-neg'); // small days still glow green/red, just softer
          cell.style.setProperty('--tint', '0.05');
        }
        const a = document.createElement('div');
        a.className = 'money-amt ' + (net < -0.004 ? 'neg' : 'pos');
        a._v = cell._mk === mk && cell._net != null ? cell._net : 0;
        cell.appendChild(a);
        countTo(a, net, fmtCell, 650);
        cell._mk = mk; cell._net = net;
      }
      function paintAll() {
        document.querySelectorAll('#daysGrid .day-cell:not(.empty)').forEach((c) => decorate(c, parseInt(c.dataset.day, 10)));
      }

      const origFill = fillDayCell;
      fillDayCell = function (cell, d, today) {
        origFill(cell, d, today);
        if (!on) return;
        cell.className = cell.className.replace(/\blvl-\d+\b|\bfully-complete\b/g, '').trim();
        const num = cell.querySelector('.day-num');
        cell.innerHTML = '';
        if (num) cell.appendChild(num);
        decorate(cell, d);
      };

      const origRender = renderCalendar;
      renderCalendar = function () {
        origRender.apply(this, arguments);
        if (!on) return;
        renderSummary();
        ensure(viewKey());
      };

      function ensureStats() {
        const box = $('moneySummary');
        if (box.dataset.ready) return;
        box.dataset.ready = '1';
        box.innerHTML = '<div class="mstat pos"><span class="lbl">In</span><span class="val" data-k="in">\u2014</span></div>'
          + '<div class="mstat neg"><span class="lbl">Out</span><span class="val" data-k="out">\u2014</span></div>'
          + '<div class="mstat"><span class="lbl">Net</span><span class="val" data-k="net">\u2014</span></div>';
      }
      function renderSummary() {
        ensureStats();
        const mk = viewKey(), data = months[mk];
        $('moneyMonthTitle').textContent = new Date(viewYear, viewMonth, 1).toLocaleString('en', { month: 'long', year: 'numeric' });
        const q = (k) => $('moneySummary').querySelector('[data-k="' + k + '"]');
        if (!data) { ['in', 'out', 'net'].forEach((k) => { q(k).textContent = '\u2014'; q(k)._v = 0; }); return; }
        let inc = 0, out = 0;
        data.forEach((e) => { if (e.amount >= 0) inc += e.amount; else out += e.amount; });
        const net = inc + out;
        countTo(q('in'), inc, fmt, 800); countTo(q('out'), out, fmt, 800); countTo(q('net'), net, fmt, 800);
        const nc = q('net').parentNode; nc.classList.toggle('neg', net < -0.004); nc.classList.toggle('pos', net > 0.004);
      }

      function toggle() {
        on = !on;
        document.body.classList.toggle('money-mode', on);
        monthTab.textContent = on ? 'Money' : 'Month';
        $('moneyPanel').hidden = !on;
        document.querySelectorAll('#daysGrid .day-cell').forEach((c) => { c._ms = false; c._net = null; c.classList.remove('money-enter'); });
        if (on && !$('moneyDate').value) $('moneyDate').value = todayKey();
        renderCalendar();           // grid appears immediately; numbers fill in when they arrive
        if (on) ensure(viewKey(), true);
      }

      function parseAmt(s) {
        if (s == null) return null;
        const n = parseFloat(String(s).replace(/[€\s]/g, '').replace(',', '.'));
        return Number.isFinite(n) ? n : null;
      }
      function normDate(s) {
        s = (s || '').trim(); let m;
        if ((m = s.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/))) return m[1] + '-' + pad(+m[2]) + '-' + pad(+m[3]);
        if ((m = s.match(/^(\d{1,2})[./](\d{1,2})[./](\d{4})/))) return m[3] + '-' + pad(+m[2]) + '-' + pad(+m[1]);
        return null;
      }
      async function post(rows) {
        const r = await fetch('/api/money', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(rows) });
        if (!r.ok) throw new Error('save failed ' + r.status);
      }

      async function addOne() {
        let amt = parseAmt($('moneyAmount').value);
        const date = $('moneyDate').value || todayKey();
        if (amt === null || amt === 0) { setStatus('Enter an amount'); return; }
        const type = $('moneyType').value;
        amt = Math.abs(amt) * (type === 'expense' ? -1 : 1);
        const note = $('moneyNote').value.trim() || (type === 'cash' ? 'Cash' : '');
        try {
          await post({ date, amount: amt, note, source: type === 'cash' ? 'cash' : 'manual' });
          $('moneyAmount').value = ''; $('moneyNote').value = '';
          setStatus('Saved ' + fmt(amt) + ' on ' + date);
          await load();
        } catch (e) { setStatus('Save failed'); }
      }

      async function importFile(file) {
        const text = await file.text(), rows = [];
        text.split(/\r?\n/).forEach((line) => {
          line = line.trim(); if (!line) return;
          const p = line.split(line.includes(';') ? ';' : ',').map((s) => s.trim().replace(/^"|"$/g, ''));
          const date = normDate(p[0]), amt = parseAmt(p[1]);
          if (date && amt !== null) rows.push({ date, amount: amt, note: p.slice(2).join(' '), source: 'import' });
        });
        if (!rows.length) { setStatus('No valid rows found'); return; }
        try { await post(rows); setStatus('Imported ' + rows.length + ' rows'); await load(); }
        catch (e) { setStatus('Import failed'); }
      }

      // ---- day sheet ----
      let sheetOpen = false, toastEl = null, toastT = 0;
      const h = (tag, cls, text) => { const e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; };
      const raf2 = (fn) => requestAnimationFrame(() => requestAnimationFrame(fn));

      function toast(msg, label, onAction) {
        if (toastEl) toastEl.remove(); clearTimeout(toastT);
        const t = h('div', 'mp-toast'); t.appendChild(h('span', null, msg));
        const hide = () => { t.classList.remove('show'); setTimeout(() => t.remove(), 500); };
        if (label) { const b = h('button', null, label); b.onclick = () => { clearTimeout(toastT); hide(); onAction(); }; t.appendChild(b); }
        document.body.appendChild(t); toastEl = t; raf2(() => t.classList.add('show'));
        toastT = setTimeout(hide, 5000);
      }

      // Splits one entry into the structured fields shown in the sheet
      function entryParts(e) {
        const apple = e.source === 'apple pay';
        let store = e.store || '', note = '';
        if (apple && !store) { const b = String(e.note || '').split(' \u2014 '); store = b[0]; note = b.slice(1).join(' \u2014 '); } // older Apple Pay rows
        else if (!apple && store) note = e.note && e.note !== store ? e.note : '';
        const title = store || (!apple ? e.note : '') || SRC[e.source] || 'Entry';
        let time = '';
        if (apple && e.created_at) {
          const t = new Date(String(e.created_at).replace(' ', 'T') + 'Z');
          if (!isNaN(t)) time = t.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        }
        return { apple, title, street: e.street || '', item: e.item || '', note, time };
      }

      function openPopup(day) {
        if (sheetOpen) return;
        sheetOpen = true;
        const mk = viewKey(), k = dateKey(day);
        const list = (dayOf(mk).map[k] || []).slice();
        const when = new Date(viewYear, viewMonth, day);

        const ov = h('div', 'mp-overlay'), sheet = h('div', 'mp-sheet');
        const head = h('div', 'mp-head');
        head.appendChild(h('div', 'mp-grab'));
        head.appendChild(h('div', 'mp-date', when.toLocaleDateString('en', { weekday: 'long', day: 'numeric', month: 'long' })));
        const tot = h('div', 'mp-total', fmt(0)); head.appendChild(tot);
        // Edit toggle: pencil + x on the cards only show while this is on
        const editBtn = h('button', 'mp-editbtn', 'Edit'); editBtn.type = 'button';
        editBtn.onclick = () => { const on = sheet.classList.toggle('editing'); editBtn.textContent = on ? 'Done' : 'Edit'; };
        head.appendChild(editBtn);
        const sub = h('div', 'mp-sub'); head.appendChild(sub);
        const body = h('div', 'mp-body');

        function refreshHead(animate) {
          const net = netOf(list), spent = list.filter((e) => e.amount < 0).reduce((s, e) => s - e.amount, 0), got = list.filter((e) => e.amount > 0).reduce((s, e) => s + e.amount, 0);
          tot.style.color = net < -0.004 ? '#dc2626' : net > 0.004 ? '#16a34a' : '';
          if (animate) countTo(tot, net, fmt, 600); else { tot._v = net; tot.textContent = fmt(net); }
          sub.innerHTML = '';
          const bit = (label, val) => { const s = h('span'); s.append(label + ' '); s.appendChild(h('b', null, val)); sub.appendChild(s); };
          bit(list.length === 1 ? 'Entry' : 'Entries', String(list.length));
          if (spent) bit('Spent', '\u20AC' + Number(spent.toFixed(2)));
          if (got) bit('Received', '\u20AC' + Number(got.toFixed(2)));
        }
        function showEmpty() { if (!list.length) body.appendChild(h('div', 'mp-empty', 'No entries on this day yet.')); }

        async function remove(e, card) {
          card.style.height = card.offsetHeight + 'px'; void card.offsetHeight; card.classList.add('out');
          setTimeout(() => card.remove(), 450);
          list.splice(list.indexOf(e), 1);
          months[mk] = (months[mk] || []).filter((x) => x.id !== e.id); invalidateMonth(mk);
          refreshHead(true); paintAll(); renderSummary(); setTimeout(showEmpty, 460);
          try {
            const r = await fetch('/api/money?id=' + e.id, { method: 'DELETE' });
            if (!r.ok) throw new Error('delete failed');
          } catch (err) { setStatus('Delete failed'); ensure(mk, true); return; }
          toast('Entry deleted', 'Undo', async () => {
            try {
              await post({ date: e.date, amount: e.amount, note: e.note, source: e.source, store: e.store, street: e.street, item: e.item });
              await fetchMonth(mk); paintAll(); renderSummary();
              if (sheetOpen) { close(); setTimeout(() => openPopup(day), 520); }
            } catch (err) { setStatus('Undo failed'); }
          });
        }

        async function saveEdit(e, v) {
          const apple = e.source === 'apple pay';
          let amt = parseAmt(v.amount);
          if (amt === null || amt === 0) { setStatus('Enter an amount'); return false; }
          // typed without a sign -> keep the original expense/income direction
          if (!/^\s*[-+\u2212]/.test(v.amount)) amt = Math.abs(amt) * (e.amount < 0 ? -1 : 1);
          else amt = parseAmt(String(v.amount).replace('\u2212', '-'));
          const title = v.title.trim(), noteVal = v.note.trim();
          const needsStore = apple || !!e.store || !!noteVal;
          const row = {
            date: e.date, amount: amt, source: e.source,
            store: needsStore ? title : '',
            note: noteVal || (needsStore ? (apple ? (e.note || '') : title) : title),
            street: v.street.trim(), item: v.item.trim()
          };
          if (e.created_at) row.created_at = e.created_at;
          try {
            await post(row); // save the new version first, so nothing is lost if the delete fails
            const r = await fetch('/api/money?id=' + e.id, { method: 'DELETE' });
            if (!r.ok) throw new Error('delete failed');
          } catch (err) { setStatus('Edit failed'); ensure(mk, true); return false; }
          await fetchMonth(mk); paintAll(); renderSummary();
          setStatus('Entry updated');
          close(); setTimeout(() => openPopup(day), 520);
          return true;
        }

        const cards = []; // { card, more, inner } - used by the drag-up expand
        list.forEach((e, i) => {
          const p = entryParts(e), card = h('div', 'mp-card');
          card.style.setProperty('--i', i);
          const top = h('div', 'mp-top');
          const chev = h('span', 'mp-chev', '\u25B6');
          const ed = h('button', 'mp-ed', '\u270E'); ed.title = 'Edit'; ed.setAttribute('aria-label', 'Edit entry');
          const x = h('button', 'mp-x', '\u00D7'); x.title = 'Delete'; x.setAttribute('aria-label', 'Delete entry');
          x.onclick = (ev) => { ev.stopPropagation(); remove(e, card); };
          top.append(chev, h('div', 'mp-store', p.title), h('div', 'mp-amt ' + (e.amount < 0 ? 'neg' : 'pos'), fmt(e.amount)), ed, x);

          // collapsed by default; everything lives in the expandable part, empty ones show "----"
          const more = h('div', 'mp-more'), inner = h('div'); more.appendChild(inner);
          const dl = h('dl', 'mp-fields');
          const row = (label, val) => { dl.appendChild(h('dt', null, label)); dl.appendChild(h('dd', val ? null : 'none', val || '----')); };
          row('Street', p.street);
          row('Purchase', p.item);
          row('Time', p.time);
          dl.appendChild(h('dt', null, 'Paid with'));
          const dd = h('dd'); dd.appendChild(h('span', 'mp-badge' + (p.apple ? ' apple' : ''), SRC[e.source] || e.source || 'Manual')); dl.appendChild(dd);
          inner.appendChild(dl);

          // Tap ANYWHERE on the box - the top bar or the opened details - to open/close it.
          // Buttons (pencil / x) and the edit form keep their own behaviour.
          card.addEventListener('click', (ev) => {
            if (ev.target.closest('button, input, textarea, select, label, .mp-form')) return;
            const sel = window.getSelection && window.getSelection();
            if (sel && !sel.isCollapsed && card.contains(sel.anchorNode)) return; // selecting text to copy it
            card.classList.toggle('open');
          });

          ed.onclick = (ev) => {
            ev.stopPropagation();
            if (inner.querySelector('.mp-form')) return;
            card.classList.add('open');
            const form = h('div', 'mp-form'), inputs = {};
            const field = (key, label, val, mode) => {
              form.appendChild(h('label', null, label));
              const inp = h('input'); inp.type = 'text'; inp.value = val || ''; if (mode) inp.inputMode = mode;
              inputs[key] = inp; form.appendChild(inp);
            };
            const raw = Number((e.amount).toFixed(2)).toString();
            field('title', 'Name', p.title);
            field('amount', 'Amount', raw, 'decimal');
            field('street', 'Street', p.street);
            field('item', 'Purchase', p.item);
            const btns = h('div', 'mp-formbtns');
            const sv = h('button', 'money-btn', 'Save'), cn = h('button', 'money-btn alt', 'Cancel');
            sv.onclick = async () => {
              sv.disabled = true;
              const ok = await saveEdit(e, { title: inputs.title.value, amount: inputs.amount.value, street: inputs.street.value, item: inputs.item.value, note: p.note });
              if (!ok) sv.disabled = false;
            };
            cn.onclick = () => { form.remove(); dl.style.display = ''; };
            btns.append(sv, cn); form.appendChild(btns);
            dl.style.display = 'none'; inner.appendChild(form);
            inputs.title.focus();
            form.addEventListener('keydown', (k) => { if (k.key === 'Enter') sv.click(); });
          };

          card.append(top, more); body.appendChild(card); cards.push({ card, more, inner });
        });
        showEmpty();

        const bar = h('div', 'mp-bar');
        const add = h('button', 'money-btn', 'Add to this day');
        add.onclick = () => { $('moneyDate').value = k; close(); window.scrollTo({ top: 0, behavior: 'smooth' }); setTimeout(() => $('moneyAmount').focus(), 350); };
        const cl = h('button', 'money-btn alt', 'Close'); cl.onclick = () => close();
        bar.append(add, cl);

        sheet.append(head, body, bar); ov.appendChild(sheet);
        refreshHead(false);
        document.body.appendChild(ov);
        document.body.style.overflow = 'hidden';
        raf2(() => { ov.classList.add('open'); setTimeout(() => refreshHead(true), 260); });

        function close(fromDrag) {
          if (!sheetOpen) return; sheetOpen = false;
          // dragged shut: keep sliding from where the finger left it (no jump back to the top first)
          if (fromDrag === true) sheet.style.transform = 'translate3d(0,105%,0)';
          ov.classList.remove('open'); document.removeEventListener('keydown', onKey);
          document.body.style.overflow = '';
          setTimeout(() => ov.remove(), 480);
        }
        const onKey = (ev) => { if (ev.key === 'Escape') close(); };
        document.addEventListener('keydown', onKey);
        ov.addEventListener('click', (ev) => { if (ev.target === ov) close(); });

        // drag the grey handle (phones):
        //   up   -> the sheet grows to ~82% of the screen (empty space stays white). If EVERY card fits open
        //           without scrolling they all open; if not, they stay collapsed and open only when tapped.
        //   down -> a short pull down closes the sheet completely, from the tall or the normal state.
        const autoOpen = new Set();
        let full = false, settle = 0;
        const liveCards = () => cards.filter((c) => c.card.isConnected && !c.card.classList.contains('out'));
        const fullH = () => Math.round(ov.clientHeight * 0.82);
        // sheet height needed if the cards matching isOpen(c) are open and the rest collapsed
        function sheetNeeds(isOpen) {
          const live = liveCards(), bcs = getComputedStyle(body);
          let need = head.offsetHeight + bar.offsetHeight + (parseFloat(getComputedStyle(sheet).paddingBottom) || 0)
            + (parseFloat(bcs.paddingTop) || 0) + (parseFloat(bcs.paddingBottom) || 0);
          if (!live.length) return need + 90;
          need += (parseFloat(getComputedStyle(live[0].card).marginTop) || 0) * (live.length + 1);
          live.forEach((c) => { const base = c.card.offsetHeight - c.more.offsetHeight; need += isOpen(c) ? base + c.inner.scrollHeight : base; });
          return need;
        }
        function settleHeight() { clearTimeout(settle); settle = setTimeout(() => { if (!full) sheet.style.height = ''; }, 580); }
        function goFull() {
          clearTimeout(settle); full = true;
          const target = fullH(), cur = sheet.offsetHeight;
          if (sheetNeeds(() => true) <= target) {
            liveCards().forEach((c) => { if (!c.card.classList.contains('open')) { c.card.classList.add('open'); autoOpen.add(c.card); } });
          }
          sheet.style.height = Math.max(target, cur) + 'px';
        }
        function goPeek() {
          full = false;
          const natural = Math.min(Math.ceil(sheetNeeds((c) => c.card.classList.contains('open') && !autoOpen.has(c.card))), Math.round(ov.clientHeight * 0.88));
          autoOpen.forEach((c) => c.classList.remove('open')); autoOpen.clear();
          sheet.style.height = natural + 'px';
          settleHeight();
        }
        // Gesture handling (touch events on the whole overlay, so it works from anywhere on screen):
        //   pull DOWN anywhere (sheet body only when it is scrolled to the top) -> sheet follows the finger;
        //        let go past a short distance (or flick) and it closes completely, also from the tall state.
        //   drag the handle UP -> sheet grows. All per-frame work is batched into one requestAnimationFrame.
        const isMobile = () => window.innerWidth < 640;
        let dg = null;
        function dgApply() {
          if (!dg) return; dg.raf = 0;
          if (dg.mode === 'down') sheet.style.transform = 'translate3d(0,' + Math.max(0, dg.dy) + 'px,0)';
          else if (dg.mode === 'up') { const t = fullH(); if (dg.startH < t) sheet.style.height = Math.max(dg.startH, Math.min(t, dg.startH - dg.dy)) + 'px'; }
        }
        function dgStart(y, target) {
          if (!sheetOpen || dg || !isMobile()) return;
          const now = performance.now();
          dg = { y0: y, mode: null, startH: sheet.offsetHeight, inBody: body.contains(target), inHead: head.contains(target), dy: 0, last: y, lastT: now, v: 0, raf: 0 };
        }
        function dgMove(y, ev) {
          if (!dg) return;
          const now = performance.now();
          if (now > dg.lastT) dg.v = 0.7 * ((y - dg.last) / (now - dg.lastT)) + 0.3 * dg.v;
          dg.last = y; dg.lastT = now;
          if (dg.mode === null) {
            const d = y - dg.y0; if (Math.abs(d) < 3) return;
            if (d > 0 && !(dg.inBody && body.scrollTop > 0)) dg.mode = 'down';
            else if (d < 0 && dg.inHead && !full) dg.mode = 'up';
            else dg.mode = 'scroll';
            if (dg.mode !== 'scroll') { dg.y0 = y; clearTimeout(settle); sheet.style.transition = 'none'; dg.startH = sheet.offsetHeight; }
          }
          if (dg.mode === 'scroll') return;
          if (ev.cancelable) ev.preventDefault();
          dg.dy = y - dg.y0;
          if (!dg.raf) dg.raf = requestAnimationFrame(dgApply);
        }
        function dgEnd(cancelled) {
          if (!dg) return;
          const g = dg; dg = null; cancelAnimationFrame(g.raf);
          if (g.mode !== 'down' && g.mode !== 'up') return;
          sheet.style.transition = '';
          if (g.mode === 'down') {
            const dy = Math.max(0, g.dy);
            if (!cancelled && (dy > (full ? 45 : 110) || (g.v > 0.55 && dy > 20))) close(true);
            else sheet.style.transform = ''; // springs back
          } else {
            if (!cancelled && (-g.dy > 40 || g.v < -0.5)) goFull();
            else { sheet.style.height = g.startH + 'px'; if (!full) settleHeight(); }
          }
        }
        ov.addEventListener('touchstart', (ev) => { if (ev.touches.length === 1) dgStart(ev.touches[0].clientY, ev.target); else dgEnd(true); }, { passive: true });
        ov.addEventListener('touchmove', (ev) => { if (ev.touches.length === 1) dgMove(ev.touches[0].clientY, ev); }, { passive: false });
        ov.addEventListener('touchend', () => dgEnd(false));
        ov.addEventListener('touchcancel', () => dgEnd(true));
        // mouse in a narrow desktop window: drag the handle
        head.addEventListener('pointerdown', (ev) => { if (ev.pointerType !== 'mouse') return; dgStart(ev.clientY, ev.target); if (dg) head.setPointerCapture(ev.pointerId); });
        head.addEventListener('pointermove', (ev) => { if (ev.pointerType === 'mouse' && dg) dgMove(ev.clientY, ev); });
        head.addEventListener('pointerup', (ev) => { if (ev.pointerType === 'mouse') dgEnd(false); });
        head.addEventListener('pointercancel', (ev) => { if (ev.pointerType === 'mouse') dgEnd(true); });
      }

      function shrink(file) {
        return new Promise((res, rej) => {
          const img = new Image(), url = URL.createObjectURL(file);
          img.onload = () => {
            const sc = Math.min(1, 1600 / Math.max(img.width, img.height));
            const c = document.createElement('canvas');
            c.width = Math.round(img.width * sc); c.height = Math.round(img.height * sc);
            c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
            URL.revokeObjectURL(url); res(c.toDataURL('image/jpeg', 0.85));
          };
          img.onerror = () => rej(new Error('bad image')); img.src = url;
        });
      }

      const TEXT_LIMIT = 40000;
      const loadScript = (src) => new Promise((res, rej) => {
        const sc = document.createElement('script'); sc.src = src; sc.onload = res;
        sc.onerror = () => rej(new Error('could not load file reader')); document.head.appendChild(sc);
      });
      const PDFJS = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/';

      // Turns any file into { images: [dataUrl...], text, filename } for /api/money-scan
      async function fileToPayload(file) {
        const name = file.name || 'file', ext = (name.split('.').pop() || '').toLowerCase();
        const p = { images: [], text: '', filename: name };

        if ((file.type || '').startsWith('image/') || /^(png|jpe?g|webp|gif|bmp|heic|heif)$/.test(ext)) {
          p.images = [await shrink(file)]; return p;
        }

        if (ext === 'pdf' || file.type === 'application/pdf') {
          if (!window.pdfjsLib) await loadScript(PDFJS + 'pdf.min.js');
          pdfjsLib.GlobalWorkerOptions.workerSrc = PDFJS + 'pdf.worker.min.js';
          const pdf = await pdfjsLib.getDocument({ data: await file.arrayBuffer() }).promise;
          let txt = '';
          for (let i = 1; i <= Math.min(pdf.numPages, 20) && txt.length < TEXT_LIMIT; i++) {
            const c = await (await pdf.getPage(i)).getTextContent();
            txt += c.items.map((t) => t.str + (t.hasEOL ? '\n' : ' ')).join('') + '\n';
          }
          if (txt.trim().length > 50) { p.text = txt; return p; }
          // scanned PDF (no text layer) -> render first pages as images
          for (let i = 1; i <= Math.min(pdf.numPages, 5); i++) {
            const page = await pdf.getPage(i), v0 = page.getViewport({ scale: 1 });
            const vp = page.getViewport({ scale: Math.min(2, 1600 / Math.max(v0.width, v0.height)) });
            const c = document.createElement('canvas'); c.width = vp.width; c.height = vp.height;
            await page.render({ canvasContext: c.getContext('2d'), viewport: vp }).promise;
            p.images.push(c.toDataURL('image/jpeg', 0.8));
          }
          return p;
        }

        if (/^(xlsx|xls|xlsm|ods)$/.test(ext)) {
          if (!window.XLSX) await loadScript('https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js');
          const wb = XLSX.read(await file.arrayBuffer());
          p.text = wb.SheetNames.map((n) => '## ' + n + '\n' + XLSX.utils.sheet_to_csv(wb.Sheets[n])).join('\n\n');
          return p;
        }

        if (ext === 'docx') {
          if (!window.mammoth) await loadScript('https://cdnjs.cloudflare.com/ajax/libs/mammoth/1.6.0/mammoth.browser.min.js');
          p.text = (await mammoth.extractRawText({ arrayBuffer: await file.arrayBuffer() })).value;
          return p;
        }

        // everything else: csv, txt, json, html, xml, md ... anything that is plain text
        const t = await file.text(), head = t.slice(0, 2000);
        if (head.indexOf('\u0000') !== -1 || (head.match(/\uFFFD/g) || []).length > 20) throw new Error("can't read ." + ext + ' files');
        p.text = t; return p;
      }

      async function scanShot(file) {
        setStatus('Reading file…');
        try {
          const p = await fileToPayload(file);
          p.text = p.text.slice(0, TEXT_LIMIT);
          if (!p.images.length && !p.text.trim()) throw new Error('nothing readable in that file');
          const r = await fetch('/api/money-scan', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...p, today: todayKey() }) });
          const data = await r.json();
          if (!r.ok) throw new Error(data.error || r.status);
          if (!data.entries.length) { setStatus('Nothing found in that file'); return; }
          setStatus('Review the results');
          reviewScan(data.entries);
        } catch (e) { setStatus('Scan failed: ' + e.message); }
      }

      function reviewScan(list) {
        const ov = document.createElement('div'); ov.className = 'money-overlay';
        const pop = document.createElement('div'); pop.className = 'money-pop';
        const h = document.createElement('h3'); h.textContent = 'Found ' + list.length + ' entries — check them';
        pop.appendChild(h);
        const boxes = list.map((e) => {
          const row = document.createElement('label'); row.className = 'money-item';
          const cb = document.createElement('input'); cb.type = 'checkbox'; cb.checked = true;
          const n = document.createElement('div'); n.className = 'n'; n.textContent = e.date + ' · ' + (e.note || '—');
          const a = document.createElement('b'); a.textContent = fmt(e.amount); a.style.color = e.amount < 0 ? '#dc2626' : '#16a34a';
          row.append(cb, n, a); pop.appendChild(row); return cb;
        });
        const bar = document.createElement('div'); bar.className = 'money-row'; bar.style.marginTop = '12px';
        const ok = document.createElement('button'); ok.className = 'money-btn'; ok.textContent = 'Add selected';
        ok.onclick = async () => {
          const rows = list.filter((_, i) => boxes[i].checked).map((e) => ({ ...e, source: 'screenshot' }));
          ov.remove(); if (!rows.length) return;
          try { await post(rows); setStatus('Added ' + rows.length + ' from file'); await load(); } catch (err) { setStatus('Save failed'); }
        };
        const no = document.createElement('button'); no.className = 'money-btn alt'; no.textContent = 'Cancel'; no.onclick = () => { ov.remove(); setStatus(''); };
        bar.append(ok, no); pop.appendChild(bar); ov.appendChild(pop); document.body.appendChild(ov);
      }

      function init() {
        monthTab.style.touchAction = 'manipulation';
        $('daysGrid').addEventListener('click', (e) => {
          if (!on) return;
          const cell = e.target.closest('.day-cell:not(.empty)');
          if (!cell) return;
          e.stopImmediatePropagation(); e.preventDefault();
          openPopup(parseInt(cell.dataset.day, 10));
        }, true);
        $('moneyAddBtn').addEventListener('click', addOne);
        $('moneyStatus').addEventListener('click', () => { if (failed) { setStatus('Retrying…'); ensure(viewKey(), true); } });
        $('moneyAmount').addEventListener('keydown', (e) => { if (e.key === 'Enter') addOne(); });
        $('moneyShot').addEventListener('change', (e) => { const f = e.target.files[0]; if (f) scanShot(f); e.target.value = ''; });
        $('moneyFile').addEventListener('change', (e) => { const f = e.target.files[0]; if (f) importFile(f); e.target.value = ''; });
      }
      init();

      // Mic-button TAP: flips the month calendar between normal and Money.
      // From Day / Week view it first jumps to the month calendar and makes sure Money is on.
      function tapToggle() {
        const gt = typeof GlobalTopBar !== 'undefined' ? GlobalTopBar : null;
        if (gt && gt.currentView && gt.currentView() !== 'month') {
          gt.goToMonthView();
          if (!on) setTimeout(() => { if (!on) toggle(); }, 60);
        } else toggle();
      }
      return { toggle, tapToggle, isOn: () => on };
    })();
  ;

    (() => {
      const HKEY = 'habitTimerHistory', AKEY = 'habitTimerActive';
      const dayTab = document.getElementById('globalTabDay');
      if (!dayTab) return;
      const REDUCED = !!(window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches);
      const EASE = 'cubic-bezier(.2,.8,.2,1)';
      let ov = null, raf = 0, active = null, fullOn = false, busy = false, shown = '', wake = null, audio = null;

      const load = (k, d) => { try { const v = JSON.parse(localStorage.getItem(k)); return v == null ? d : v; } catch (e) { return d; } };
      const save = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} };
      const drop = (k) => { try { localStorage.removeItem(k); } catch (e) {} };
      const p2 = (n) => String(n).padStart(2, '0');
      const wait = (ms) => new Promise((r) => setTimeout(r, ms));
      const frames = (n) => new Promise((r) => { const f = () => (--n <= 0 ? r() : requestAnimationFrame(f)); requestAnimationFrame(f); });
      const $ = (sel) => ov && ov.querySelector(sel);

      function nextTarget(hhmm) {
        const [h, m] = hhmm.split(':').map(Number);
        const t = new Date(); t.setHours(h, m, 0, 0);
        if (t.getTime() <= Date.now()) t.setDate(t.getDate() + 1);
        return t.getTime();
      }
      function fmtLeft(ms) {
        const s = Math.max(0, Math.ceil(ms / 1000));
        const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), sec = s % 60;
        return h > 0 ? h + ':' + p2(m) + ':' + p2(sec) : m + ':' + p2(sec);
      }
      function fmtShort(ms) {
        const mins = Math.max(1, Math.round(ms / 60000));
        const h = Math.floor(mins / 60), m = mins % 60;
        return 'in ' + (h ? h + 'h ' : '') + (m || !h ? m + 'm' : '');
      }

      async function lockScreen() { try { if (navigator.wakeLock && !wake) { wake = await navigator.wakeLock.request('screen'); wake.addEventListener('release', () => { wake = null; }); } } catch (e) {} }
      function unlockScreen() { try { if (wake) wake.release(); } catch (e) {} wake = null; }
      function beep() {
        try {
          audio = audio || new (window.AudioContext || window.webkitAudioContext)();
          [0, .35, .7].forEach((t) => {
            const o = audio.createOscillator(), g = audio.createGain();
            o.frequency.value = 880; o.connect(g); g.connect(audio.destination);
            const at = audio.currentTime + t;
            g.gain.setValueAtTime(0.0001, at); g.gain.exponentialRampToValueAtTime(0.25, at + .03); g.gain.exponentialRampToValueAtTime(0.0001, at + .28);
            o.start(at); o.stop(at + .3);
          });
        } catch (e) {}
      }

      function addHistory(hhmm) {
        const list = load(HKEY, []).filter((x) => x.time !== hhmm);
        list.unshift({ time: hhmm, used: Date.now() });
        save(HKEY, list.slice(0, 20));
      }
      function start(hhmm) {
        if (!hhmm) return;
        active = { time: hhmm, start: Date.now(), end: nextTarget(hhmm), done: false };
        save(AKEY, active);
        addHistory(hhmm);
        ov.classList.remove('done');
        setTitle(hhmm);
        renderHistory();
        lockScreen();
        render(true);
      }
      function stop() {
        active = null; drop(AKEY); unlockScreen();
        if (ov) ov.classList.remove('done');
        render(true);
      }

      const R = 110, C = 2 * Math.PI * R;
      function render(force) {
        if (!ov) return;
        const fg = $('.tmr-ring-fg'), tm = $('.tmr-time'), sub = $('.tmr-sub');
        fg.style.strokeDasharray = C;
        if (!active) {
          fg.style.strokeDashoffset = C;
          if (force || shown !== '0:00') { tm.textContent = '0:00'; tm.classList.remove('hrs'); shown = '0:00'; }
          sub.textContent = 'No timer running';
          return;
        }
        const now = Date.now(), left = active.end - now, total = active.end - active.start;
        if (left <= 0) {
          if (!active.done) {
            active.done = true; drop(AKEY); unlockScreen();
            ov.classList.add('done');
            if (navigator.vibrate) try { navigator.vibrate([300, 150, 300, 150, 300]); } catch (e) {}
            beep();
          }
          fg.style.strokeDashoffset = 0;
          tm.textContent = '0:00'; tm.classList.remove('hrs'); shown = '0:00';
          sub.textContent = "Time's up!";
          return;
        }
        fg.style.strokeDashoffset = C * (1 - Math.min(1, Math.max(0, (now - active.start) / total)));
        const txt = fmtLeft(left);
        if (txt !== shown || force) { tm.textContent = txt; tm.classList.toggle('hrs', txt.length > 5); shown = txt; }
        const when = new Date(active.end);
        sub.textContent = 'Until ' + p2(when.getHours()) + ':' + p2(when.getMinutes()) + (when.toDateString() === new Date().toDateString() ? '' : ' (tomorrow)');
      }
      function loop() { render(); raf = requestAnimationFrame(loop); }

      function setTitle(hhmm) { const t = $('.tmr-title'); if (t) t.innerHTML = 'Set a timer till <b>' + (hhmm || '--:--') + '</b>'; }

      function renderHistory() {
        if (!ov) return;
        const box = $('.tmr-hlist'); box.innerHTML = '';
        const list = load(HKEY, []);
        if (!list.length) { const e = document.createElement('div'); e.className = 'tmr-empty'; e.textContent = 'No previous timers yet.'; box.appendChild(e); return; }
        list.forEach((it, i) => {
          const row = document.createElement('div'); row.className = 'tmr-h-item'; row.style.animationDelay = (i * 30) + 'ms';
          const t = document.createElement('span'); t.textContent = it.time;
          const s = document.createElement('span'); s.className = 's'; s.textContent = fmtShort(nextTarget(it.time) - Date.now());
          const x = document.createElement('button'); x.className = 'x'; x.type = 'button'; x.textContent = '×'; x.title = 'Remove';
          x.onclick = (e) => { e.stopPropagation(); save(HKEY, load(HKEY, []).filter((y) => y.time !== it.time)); renderHistory(); };
          row.onclick = () => { $('.tmr-input').value = it.time; start(it.time); toggleHistory(false); };
          row.append(t, s, x); box.appendChild(row);
        });
      }
      function toggleHistory(force) {
        const h = $('.tmr-history'), open = typeof force === 'boolean' ? force : !h.classList.contains('open');
        if (open) renderHistory();
        h.classList.toggle('open', open);
        $('.tmr-hist').classList.toggle('on', open);
      }

      const ringRect = () => $('.tmr-ring-wrap').getBoundingClientRect();
      function flip(el, from, to) {
        if (REDUCED || !el.animate) return;
        const dx = (from.left + from.width / 2) - (to.left + to.width / 2), dy = (from.top + from.height / 2) - (to.top + to.height / 2);
        el.animate([{ transform: 'translate(' + dx + 'px,' + dy + 'px) scale(' + (from.width / to.width) + ')' }, { transform: 'none' }], { duration: 480, easing: EASE });
      }
      function nativeFs(on) {
        try {
          if (on) {
            const r = ov.requestFullscreen || ov.webkitRequestFullscreen;
            if (!r) return Promise.resolve();
            const p = r.call(ov);
            return p && p.then ? p.catch(() => {}) : wait(250);
          }
          const fsEl = document.fullscreenElement || document.webkitFullscreenElement;
          if (fsEl) { const x = document.exitFullscreen || document.webkitExitFullscreen; const p = x.call(document); return p && p.then ? p.catch(() => {}) : wait(250); }
        } catch (e) {}
        return Promise.resolve();
      }
      async function enterFull() {
        if (busy || fullOn || !ov) return; busy = true;
        const fs = nativeFs(true);
        ov.classList.add('tmr-fading');
        await Promise.race([Promise.all([fs, wait(REDUCED ? 0 : 200)]), wait(900)]);
        await frames(2);
        const from = ringRect();
        ov.classList.add('full'); fullOn = true;
        const to = ringRect();
        flip($('.tmr-ring-wrap'), from, to);
        await wait(REDUCED ? 0 : 480);
        busy = false;
      }
      async function leaveFull(skipNative) {
        if (busy || !fullOn || !ov) return; busy = true;
        const fs = skipNative ? Promise.resolve() : nativeFs(false);
        await Promise.race([fs, wait(900)]);
        await frames(2);
        const from = ringRect();
        ov.classList.remove('full'); fullOn = false;
        const to = ringRect();
        flip($('.tmr-ring-wrap'), from, to);
        await wait(REDUCED ? 0 : 200);
        if (ov) ov.classList.remove('tmr-fading');
        await wait(REDUCED ? 0 : 250);
        busy = false;
      }

      function close() {
        if (!ov || busy) return;
        if (fullOn) { leaveFull(); return; }
        busy = true;
        cancelAnimationFrame(raf); raf = 0;
        const el = ov; ov.classList.add('closing');
        setTimeout(() => { el.remove(); if (ov === el) ov = null; busy = false; unlockScreen(); }, REDUCED ? 0 : 230);
      }

      function open() {
        if (ov) return;
        active = load(AKEY, null);
        if (active && active.end <= Date.now()) { active = null; drop(AKEY); }
        ov = document.createElement('div'); ov.className = 'tmr-overlay';
        ov.innerHTML =
          '<div class="tmr-card">' +
            '<button class="tmr-x" type="button" title="Close" aria-label="Close">&times;</button>' +
            '<div class="tmr-title tmr-fade"></div>' +
            '<div class="tmr-set tmr-fade"><input class="tmr-input" type="time" step="60" aria-label="Timer end time"><button class="tmr-btn tmr-go" type="button">Start</button></div>' +
            '<div class="tmr-ring-wrap"><svg viewBox="0 0 240 240"><circle class="tmr-ring-bg" cx="120" cy="120" r="110"></circle><circle class="tmr-ring-fg" cx="120" cy="120" r="110"></circle></svg><div class="tmr-time">0:00</div></div>' +
            '<div class="tmr-sub tmr-fade"></div>' +
            '<div class="tmr-actions tmr-fade"><button class="tmr-btn alt tmr-hist" type="button">History</button><button class="tmr-btn alt tmr-full" type="button">Fullscreen</button><button class="tmr-btn alt tmr-stop" type="button">Stop</button></div>' +
            '<div class="tmr-history tmr-fade"><div class="tmr-history-inner"><h4>Previous timers</h4><div class="tmr-hlist"></div></div></div>' +
          '</div>';
        const inp = ov.querySelector('.tmr-input'), now = new Date();
        inp.value = active ? active.time : p2(now.getHours()) + ':' + p2(now.getMinutes());
        ov.addEventListener('click', (e) => { if (e.target === ov && !fullOn) close(); });
        ov.querySelector('.tmr-x').onclick = () => (fullOn ? leaveFull() : close());
        inp.addEventListener('input', () => setTitle(inp.value));
        inp.addEventListener('keydown', (e) => { if (e.key === 'Enter') start(inp.value); });
        ov.querySelector('.tmr-go').onclick = () => start(inp.value);
        ov.querySelector('.tmr-stop').onclick = stop;
        ov.querySelector('.tmr-full').onclick = enterFull;
        ov.querySelector('.tmr-hist').onclick = () => toggleHistory();
        document.body.appendChild(ov);
        setTitle(inp.value);
        if (active) lockScreen();
        render(true);
        raf = requestAnimationFrame(loop);
      }

      // Esc in the browser's own fullscreen leaves timer fullscreen too
      const onFsChange = () => { if (!document.fullscreenElement && !document.webkitFullscreenElement && fullOn && !busy) leaveFull(true); };
      document.addEventListener('fullscreenchange', onFsChange);
      document.addEventListener('webkitfullscreenchange', onFsChange);
      document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && ov && !busy) (fullOn ? leaveFull() : close()); });
      document.addEventListener('visibilitychange', () => { if (!document.hidden && ov && active && !active.done) lockScreen(); });

      // Double-tap Day (same pattern as Month -> Money). Single tap still opens the day view.
      let last = 0;
      dayTab.style.touchAction = 'manipulation';
      dayTab.addEventListener('click', () => { const n = Date.now(); if (n - last < 400) { last = 0; open(); } else last = n; });
    })();
