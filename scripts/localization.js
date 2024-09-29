const translations = {
    hu: {
        dashboardTitle: "Warframe Dashboard",
        searchPlaceholder: "Keresés a menüben...",
        copyright: "Copyright © Miklos Lekszikov",
        loading: 'Adatok betöltése...',
        dataUnavailable: 'Az adatok jelenleg nem elérhetők. Kérjük, próbálja újra később.',
        nextUpdate: 'Következő frissítés: {seconds}s',
        themeToggled: 'Téma váltva',
        menuToggled: 'Menü állapota váltva',
        logToggled: 'Log állapota váltva',
        initializationComplete: 'Inicializálás befejezve',
        initializationError: 'Hiba történt az inicializálás során: {error}',

        noAvailableNews: 'Nincs elérhető hír.',
        noAvailableInvasion: 'Nincs elérhető invázió.',
        noAvailableFissure: 'Nincs elérhető Fissure.',
        noAvailableAlert: 'Nincs elérhető riadó.',
        noAvailableConclave: 'Nincs elérhető Conclave kihívás.',
        noAvailableFlashSales: 'Nincs elérhető Villám Akciók.',

        invalidTime: 'Érvénytelen idő',
        arrived: 'MEGÉRKEZETT!',
        departed: 'Eltávozott',
        expired: 'Lejárt',
        unavailable: 'Nem elérhető',

        menuRefreshStart: 'Menü frissítése kezdődik',
        menuRefreshComplete: 'Menü frissítése befejezve',
        menuItemSelected: 'Menüpont kiválasztva: {key}',
        dataDisplayStart: 'Adatok megjelenítése: {key}',
        cycleRefreshStart: '{cycleType} adatok frissítése kezdődik...',
        cycleRefreshComplete: '{cycleType} adatok sikeresen frissítve',
        cycleRefreshError: 'Hiba a {cycleType} frissítése során: {error}',
        cycleRefreshRetry: 'Újrapróbálkozás {retryCount}/{maxRetries} {retryDelay} másodperc múlva...',
        cycleRefreshFailed: '{cycleType} frissítése sikertelen {maxRetries} próbálkozás után.',
        endpointRefreshComplete: '{type} adatok automatikusan frissítve',
        allDataFetchStart: 'Összes adat lekérése kezdődik...',
        allDataFetchComplete: 'Összes adat sikeresen lekérve',
        domLoadedInitStart: 'DOM betöltve, inicializálás kezdődik',
        newsRefreshComplete: 'News adatok sikeresen frissítve',
        errorFetchingNews: 'Hiba a news lekérése közben: {error}',
        errorFetchingEndpoint: 'Hiba a(z) {endpoint} adatok lekérése közben: {error}',
        warningDateParse: 'Nem sikerült parse-olni a dátumot: {dateString}',
        warningSentientOutposts: 'Figyelmeztetés: A SentientOutposts adatok elavultak lehetnek.',
        warningNewsData: 'News data is empty or not an array',
        warningNoNewsItems: 'No news items to display',
        warningFissuresFormat: 'Fissures nem tömb formátumban érkezett:',
        warningAlertsFormat: 'Alerts üres vagy nem tömb formátumban érkezett:',
        warningConclaveFormat: 'conclaveChallenges érvénytelen formátumban érkezett:',
        errorMenuInit: 'Hiba történt a menü inicializálása során:',
        errorMissingMenuElements: 'Hiányzó DOM elemek a menü inicializálásához',
        warningScrollToMainMissing: 'A "scroll-to-main" elem nem található a DOM-ban.',
        titleNotAvailable: 'Cím nem elérhető',
        link: 'Link',
        readMore: 'Bővebben',
        newsImage: 'Hír képe',
        date: 'Dátum',
        dateNotAvailable: 'Dátum nem elérhető',
        titleNotAvailable: 'Cím nem elérhető',
        noAvailableData: "Nincs lekérhető adat",
        invalidDate: "Érvénytelen dátum",
        voidTraderTitle: "Void Trader",
        voidTraderCharacter: "Karakter",
        voidTraderLocation: "Helyszín",
        voidTraderArrival: "Érkezés",
        voidTraderDeparture: "Távozás",
        voidTraderInventory: "Készlet",
        voidTraderStatus: "Státusz",
        voidTraderInactive: "Jelenleg nem aktív",
        voidTraderEmptyInventory: "A készlet jelenleg üres vagy nem elérhető.",
        dailyDealsTitle: "Daily Deals",
        dailyDealsItem: "Item",
        dailyDealsOriginalPrice: "Eredeti ár",
        dailyDealsSalePrice: "Akciós ár",
        dailyDealsDiscount: "Kedvezmény",
        dailyDealsTotal: "Összes",
        dailyDealsSold: "Eladva",
        dailyDealsExpiry: "Lejár",
        invasionsTitle: "Invasions",
        invasionsNode: "Node",
        invasionsDesc: "Description",
        invasionsAttacker: "Támadó",
        invasionsDefender: "Védő",
        invasionsReward: "Jutalom",
        invasionsProgress: "Haladás",
        invasionsEta: "Hátralévő idő",

        //fixed
        archonHuntTitle: "Archon Vadászat",
        archonHuntBoss: "Boss",
        archonHuntFaction: "Frakció",
        archonHuntRewardPool: "Jutalom készlet",
        archonHuntExpiry: "Lejárat",
        archonHuntMissions: "Küldetések",
        flashSalesTitle: "Villám Akciók",
        flashSalesItem: "Tárgy",
        flashSalesActivation: "Aktiválás",
        flashSalesExpiry: "Lejárat",
        sortieTitle: "Sortie",
        sortieBoss: "Boss",
        sortieFaction: "Frakció",
        sortieExpiry: "Lejárat",
        sortieVariants: "Variánsok",
        vaultTraderTitle: "Vault Trader",
        vaultTraderLocation: "Helyszín",
        vaultTraderStatus: "Állapot",
        vaultTraderActive: "Aktív",
        vaultTraderInactive: "Inaktív",
        vaultTraderActivation: "Aktiválás",
        vaultTraderExpiry: "Lejárat",
        vaultTraderCurrentInventory: "Jelenlegi készlet",
        vaultTraderFutureSchedule: "Jövőbeli ütemezés",
        vaultTraderUnknownItem: "Ismeretlen elem",

// Új fordítások a script.js-ből meg nincs hozzäadva a js-hez
        constructionProgressTitle: "Építési Folyamat",
        fomorian: "Fomorian",
        razorback: "Razorback",
        unknown: "Ismeretlen",


        sentientOutpostsTitle: "Sentient Támaszpontok",
        sentientOutpostsActivation: "Aktiválás",
        sentientOutpostsExpiry: "Lejárat",
        sentientOutpostsActive: "Aktív",
        syndicateMissionsTitle: "Szindikátus Küldetések",
        syndicateMissionsSyndicate: "Szindikátus",
        syndicateMissionsNodes: "Csomópontok",
        syndicateMissionsExpiry: "Lejárat",
        eventsTitle: "Események",
        eventsDescription: "Leírás",
        eventsNode: "Csomópont",
        eventsActivation: "Aktiválás",
        eventsExpiry: "Lejárat",
        eventsRewards: "Jutalmak",
        nightwaveTitle: "Nightwave",
        nightwaveSeason: "Évad",
        nightwaveActivation: "Aktiválás",
        nightwaveExpiry: "Lejárat",
        nightwaveActiveChallenges: "Aktív Kihívások",



        steelPathTitle: "Acél Ösvény",
        steelPathActivation: "Aktiválás",
        steelPathExpiry: "Lejárat",
        steelPathCurrentReward: "Jelenlegi Jutalom",
        steelPathRotation: "Forgás",
        steelPathEvergreenRewards: "Állandó Jutalmak",
        cycleState: "Állapot",
        cycleTimeLeft: "Hátralévő idő",



        fissuresTitle: "Hasadékok",
        fissuresNode: "Csomópont",
        fissuresMissionType: "Küldetés típus",
        fissuresTier: "Szint",
        fissuresExpiry: "Lejárat",
        alertsTitle: "Riasztások",
        alertsMission: "Küldetés",
        alertsFaction: "Frakció",
        alertsReward: "Jutalom",
        alertsExpiry: "Lejárat",
        conclaveTitle: "Conclave",
        conclaveChallengeTitle: "Kihívás címe",
        conclaveChallengeDescription: "Kihívás leírása",
        conclaveChallengeCategory: "Kategória",
        conclaveChallengeAmount: "Mennyiség",
        conclaveChallengeStanding: "Állás",
        conclaveChallengeExpiry: "Lejárat",
        simarisTitle: "Simaris",
        simarisTarget: "Célpont",
        simarisTargetActive: "Célpont aktív",
        simarisStatus: "Státusz"

    },
    en: {

    },
};

let currentLanguage = 'hu';

function setLanguage(lang) {
    if (translations[lang]) {
        currentLanguage = lang;
        updateUILanguage();
    }
}

function getTranslation(key) {
    return translations[currentLanguage][key] || key;
}

function formatTranslation(key, placeholders = {}) {
    let text = getTranslation(key);
    for (const [placeholder, value] of Object.entries(placeholders)) {
        text = text.replace(`{${placeholder}}`, value);
    }
    return text;
}

function updateUILanguage() {
    document.querySelectorAll('[data-translation-key]').forEach(element => {
        const key = element.getAttribute('data-translation-key');
        element.textContent = getTranslation(key);
    });

    // Frissítsd az aktív nézetet
    const activeMenuItem = document.querySelector('#menu-items li.active');
    if (activeMenuItem) {
        const selectedKey = activeMenuItem.textContent.toLowerCase();
        displaySelectedData(selectedKey);
    }

    // Frissítsd a placeholder szövegeket
    document.querySelectorAll('input[placeholder]').forEach(input => {
        const key = input.getAttribute('data-translation-key');
        if (key) {
            input.placeholder = getTranslation(key);
        }
    });
}

window.Localization = {
    getTranslation,
    formatTranslation,
    setLanguage,
    updateUILanguage
};