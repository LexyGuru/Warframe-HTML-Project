window.Localization.getTranslation('someKey')
window.Localization.formatTranslation('someKey', { placeholder: 'value' })

const WarframeData = (function() {
    let data = {};
    let lastFetchTimes = {};
    let logCount = 0;
    let lastLogMessage = '';
    let activeTimers = {};

    return {
        setData: function(key, value) {
            data[key] = value;
        },
        getData: function(key) {
            return data[key];
        },
        setTimer: function(key, value) {
            activeTimers[key] = value;
        },
        getTimer: function(key) {
            return activeTimers[key];
        },
        incrementLogCount: function() {
            logCount++;
        },
        getLogCount: function() {
            return logCount;
        },
        resetLogCount: function() {
            logCount = 0;
        },
        setLastLogMessage: function(message) {
            lastLogMessage = message;
        },
        getLastLogMessage: function() {
            return lastLogMessage;
        },
        setLastFetchTime: function(key, time) {
            lastFetchTimes[key] = time;
        },
        getLastFetchTime: function(key) {
            return lastFetchTimes[key];
        }
    };
})();

const CONFIG = {
    PLATFORM: 'pc',
    BASE_URL: 'https://api.warframestat.us/pc',
    ENDPOINTS: [
        'alerts', 'arbitration', 'archonHunt', 'conclaveChallenges', 'constructionProgress', 'dailyDeals',
        'darkSectors', 'events', 'fissures', 'flashSales', 'globalUpgrades', 'invasions', 'kuva', 'news',
        'nightwave', 'persistentEnemies', 'sentientOutposts', 'simaris', 'sortie', 'steelPath',
        'syndicateMissions', 'vaultTrader', 'voidTrader'
    ],
    CYCLE_ENDPOINTS: ['earthCycle', 'cetusCycle', 'vallisCycle', 'cambionCycle', 'zarimanCycle'],

    CUSTOM_MENU_ITEM: {
        name: 'Warframe search',
        url: 'search.html'
    }
};

const relevantFields = {
    arbitration: ['node', 'enemy', 'type', 'expiry'],
    invasions: ['node', 'desc', 'attackingFaction', 'defendingFaction', 'completion'],
    fissures: ['node', 'missionType', 'tier', 'expiry'],
    archonHunt: ['boss', 'faction', 'rewardPool', 'expiry', 'missions'],
    events: ['id', 'activation', 'expiry', 'description', 'node', 'rewards', 'interimSteps'],
    nightwave: ['activation', 'expiry', 'season', 'activeChallenges'],
    sortie: ['boss', 'faction', 'expiry', 'variants'],
    syndicateMissions: ['syndicate', 'nodes', 'expiry'],
    voidTrader: ['character', 'location', 'activation', 'expiry', 'inventory'],
    vaultTrader: ['activation', 'expiry', 'location', 'inventory', 'schedule'],
    earthCycle: ['state', 'timeLeft'],
    cetusCycle: ['state', 'timeLeft'],
    vallisCycle: ['state', 'timeLeft'],
    cambionCycle: ['state', 'timeLeft', 'active'],
    zarimanCycle: ['state', 'timeLeft', 'shortString'],
    flashSales: ['item', 'isShownInMarket', 'expiry'],
    steelPath: ['activation', 'expiry', 'remaining', 'rotation', 'evergreens'],
    conclaveChallenges: ['id', 'description', 'title', 'standing', 'endString', 'asString']
};

const dateCache = new Map();
const BASE_URL = CONFIG.BASE_URL;
const endpoints = CONFIG.ENDPOINTS;
const cycleEndpoints = CONFIG.CYCLE_ENDPOINTS;

function parseDate(dateString) {
    if (dateCache.has(dateString)) {
        return dateCache.get(dateString);
    }

    let result;
    if (!dateString) {
        result = null;
    } else if (typeof dateString === 'number') {
        result = new Date(dateString);
    } else if (typeof dateString === 'string') {
        // Először próbáljuk meg ISO formátumként értelmezni
        result = new Date(dateString);

        if (isNaN(result.getTime())) {
            // Ha nem sikerült, próbáljuk meg a korábbi módszerekkel
            const durationMatch = dateString.match(/(?:(\d+)d)?\s*(?:(\d+)h)?\s*(?:(\d+)m)?\s*(?:(\d+)s)?/);
            if (durationMatch) {
                const [, daysStr, hoursStr, minutesStr, secondsStr] = durationMatch;
                const totalSeconds =
                    (parseInt(daysStr) || 0) * 86400 +
                    (parseInt(hoursStr) || 0) * 3600 +
                    (parseInt(minutesStr) || 0) * 60 +
                    (parseInt(secondsStr) || 0);
                result = new Date(Date.now() + totalSeconds * 1000);
            } else {
                const formats = [
                    'YYYY. MM. DD. HH:mm:ss:SS',
                    'YYYY-MM-DDTHH:mm:ss.SSSZ',
                    'YYYY-MM-DD HH:mm:ss',
                    'YYYY-MM-DD'
                ];
                for (let format of formats) {
                    const parsed = moment(dateString, format);
                    if (parsed.isValid()) {
                        result = parsed.toDate();
                        break;
                    }
                }
            }
        }
    }

    if (!result || isNaN(result.getTime())) {
        console.warn(`Nem sikerült parse-olni a dátumot: ${dateString}`);
        result = null;
    } else {
        console.log(`Sikeresen parse-olt dátum: ${dateString} => ${result}`);
    }

    dateCache.set(dateString, result);
    return result;
}

function formatDate(date) {
    if (!date) return 'Érvénytelen idő';
    return moment(date).format('YYYY. MM. DD. HH:mm:ss');
}

// Függvény a "timeLeft" string feldolgozására és normalizálására
function normalizeTimeLeft(timeLeftString) {
    if (!timeLeftString) return "N/A";

    // Próbáljuk meg parse-olni különböző formátumokat
    const formats = [
        /(\d+)h (\d+)m (\d+)s/,  // pl. "3h 45m 30s"
        /(\d+)m (\d+)s/,         // pl. "45m 30s"
        /(\d+)s/,                // pl. "30s"
        /(\d+):(\d+):(\d+)/      // pl. "3:45:30"
    ];

    for (let format of formats) {
        const match = timeLeftString.match(format);
        if (match) {
            const parts = match.slice(1).map(Number);
            const [hours, minutes, seconds] = parts.length === 3 ? parts : [0, ...parts].slice(-3);
            return `${hours}h ${minutes}m ${seconds}s`;
        }
    }

    // Ha egyik formátum sem illik, adjuk vissza az eredeti stringet
    return timeLeftString;
}

function log(message) {
    if (message === WarframeData.getLastLogMessage()) return;
    WarframeData.setLastLogMessage(message);
    console.log(message);

    const logContent = document.getElementById('log-content');
    if (logContent) {
        const logMessage = document.createElement('p');
        logMessage.textContent = `${new Date().toLocaleTimeString()}: ${message}`;
        logContent.appendChild(logMessage);

        if (logContent.childElementCount > 50) {
            logContent.removeChild(logContent.firstChild);
        } else {
            WarframeData.incrementLogCount();
        }

        logContent.scrollTop = logContent.scrollHeight;
        updateLogSummary();
    }
}

function updateLogSummary() {
    const logSummary = document.getElementById('log-summary');
    if (logSummary) {
        logSummary.textContent = `${WarframeData.getLogCount()} log bejegyzés`;
    }
}

function resetLogCount() {
    WarframeData.resetLogCount();
    updateLogSummary();
    const logContent = document.getElementById('log-content');
    if (logContent) {
        logContent.innerHTML = '';
    }
}

function toggleLog() {
    const logElement = document.getElementById('log');
    const logToggle = document.getElementById('log-toggle');

    if (logElement && logToggle) {
        logElement.classList.toggle('collapsed');
        logToggle.textContent = logElement.classList.contains('collapsed') ? '▼' : 'X';
    }
}

function handleTraderTime(date, type) {
    const now = new Date();
    const countdownId = `${type.toLowerCase()}-${type === 'arrival' ? 'arrival' : 'departure'}-countdown`;
    if (date <= now) {
        return type === 'arrival' ? 'MEGÉRKEZETT!' : 'Eltávozott';
    } else {
        return createCountdown(countdownId, date, type === 'arrival' ? 'Érkezés' : 'Távozás');
    }
}

function updateDisplay(endpoint) {
    const activeElement = document.querySelector('#menu-items li.active');
    const selectedKey = activeElement ? activeElement.textContent.toLowerCase() : '';
    if (selectedKey === endpoint) {
        displaySelectedData(endpoint);
    }
}

function updateMenu() {
    log('Menü frissítése kezdődik');
    const menuItems = document.getElementById('menu-items');
    const activeItemText = document.querySelector('#menu-items li.active')?.textContent;
    menuItems.innerHTML = '';

    // Egyéni menüpont hozzáadása
    const customLi = document.createElement('li');
    customLi.textContent = CONFIG.CUSTOM_MENU_ITEM.name;
    customLi.addEventListener('click', (event) => {
        event.stopPropagation();
        document.querySelectorAll('#menu-items li').forEach(item => item.classList.remove('active'));
        customLi.classList.add('active');
        displayCustomContent();
        if (window.innerWidth <= 768) {
            toggleMenu();
        }
    });
    menuItems.appendChild(customLi);

    // Ciklusok menüpont
    const cyclesLi = document.createElement('li');
    cyclesLi.textContent = 'Ciklusok';
    cyclesLi.className = 'menu-category';
    menuItems.appendChild(cyclesLi);

    const cyclesSubmenu = document.createElement('ul');
    cyclesSubmenu.className = 'submenu';
    CONFIG.CYCLE_ENDPOINTS.forEach(cycle => {
        const li = createMenuItem(cycle, activeItemText);
        cyclesSubmenu.appendChild(li);
    });
    cyclesLi.appendChild(cyclesSubmenu);

    // Többi menüpont
    CONFIG.ENDPOINTS.forEach(endpoint => {
        if (!CONFIG.CYCLE_ENDPOINTS.includes(endpoint)) {
            const li = createMenuItem(endpoint, activeItemText);
            menuItems.appendChild(li);
        }
    });

    log('Menü frissítése befejezve');
}

function createMenuItem(key, activeItemText) {
    const li = document.createElement('li');
    li.textContent = key.charAt(0).toUpperCase() + key.slice(1);
    if (li.textContent === activeItemText) {
        li.classList.add('active');
    }
    li.addEventListener('click', (event) => {
        event.stopPropagation();
        document.querySelectorAll('#menu-items li').forEach(item => item.classList.remove('active'));
        li.classList.add('active');
        log(`Menüpont kiválasztva: ${key}`);
        displaySelectedData(key);
        if (window.innerWidth <= 768) {
            toggleMenu();
        }
    });
    return li;
}

function checkCountdowns() {
    const allEndpoints = [...CONFIG.ENDPOINTS, ...CONFIG.CYCLE_ENDPOINTS];

    allEndpoints.forEach(endpoint => {
        const data = WarframeData.getData(endpoint);
        console.log(`${endpoint}:`);
        if (data) {
            console.log(`  Adat: ${JSON.stringify(data).slice(0, 100)}...`);
            const countdownElements = document.querySelectorAll(`[id^="${endpoint}-"][id$="-countdown"]`);
            if (countdownElements.length > 0) {
                console.log(`  ${countdownElements.length} visszaszámláló található`);
                countdownElements.forEach(el => {
                    console.log(`    - ${el.id}: ${el.textContent}`);
                });
            } else {
                console.log(`  Nem található visszaszámláló`);
                console.log(`  HTML tartalom: ${document.getElementById('data-display').innerHTML.slice(0, 200)}...`);
            }
        } else {
            console.log(`  Nincs adat`);
        }
        console.log('---');
    });
}


/*****************************************************************************************************/
// Megjelenitesi dolgok
function displaySelectedData(selectedKey) {
    const displayArea = document.getElementById('data-display');
    displayArea.innerHTML = '';

    const data = WarframeData.getData(selectedKey);

    if (data === null || data === undefined || (Array.isArray(data) && data.length === 0)) {
        displayArea.innerHTML = `<div class="fade-in slide-in">${window.Localization.getTranslation('noAvailableData')}</div>`;
        return;
    }

    if (!data || (Array.isArray(data) && data.length === 0)) {
      displayArea.innerHTML = `
        <div class="data-card">
          <h2 class="card-title">${selectedKey}</h2>
          <div class="card-content">
            ${window.Localization.getTranslation('noAvailableData')}
          </div>
        </div>
      `;
      return;
    }

    try {
        let content = '';

        if (CONFIG.CYCLE_ENDPOINTS.includes(selectedKey)) {
            content = displayCycle(data, selectedKey, 0);
        } else if (selectedKey === 'news') {
            content = displayNews(data);
        } else if (selectedKey === 'conclaveChallenges') {
            content = `<div class="conclave-challenges-container">${displayConclaveChallenges(data)}</div>`;
        } else if (selectedKey === 'vaultTrader') {
            content = displayVaultTrader(data);
        } else if (selectedKey === 'voidTrader') {
            content = displayVoidTrader(data);
        } else if (selectedKey === 'dailyDeals') {
            content = displayDailyDeals(Array.isArray(data) ? data[0] : data);
        } else if (selectedKey === 'invasions') {
            content = displayInvasions(data);
        } else if (Array.isArray(data)) {
            content = data.map((item, index) => {
                const itemDiv = document.createElement('div');
                displayDataItem(item, selectedKey, itemDiv, index);
                return itemDiv.innerHTML;
            }).join('');
        } else {
            const itemDiv = document.createElement('div');
            displayDataItem(data, selectedKey, itemDiv, 0);
            content = itemDiv.innerHTML;
        }

        // Dupla szöveg törlese
        if (selectedKey === 'sentientOutposts') {
            content = displaySentientOutposts(data, 0);
        }

        if (selectedKey === 'archonHunt') {
            content = displayArchonHunt(data, 0);
        }

        if (selectedKey === 'flashSales') {
            content = displayFlashSales(data);
        }

        if (selectedKey === 'sortie') {
            content = displaySortie(data, 0);
        }

        if (selectedKey === 'simaris') {
            content = displaySimaris(data, 0);
        }

        if (selectedKey === 'simaris') {
            content = displaySimaris(data, 0);
        }

        // Animáció hozzáadása
        displayArea.innerHTML = `<div class="fade-in slide-in">${content}</div>`;

        // Visszaszámlálók inicializálása
        console.log('Initializing countdowns');
        const countdownElements = displayArea.querySelectorAll('.countdown');
        console.log(`Found ${countdownElements.length} countdown elements`);
        const now = new Date();
        countdownElements.forEach((el) => {
            const timeValue = el.dataset.time;
            if (timeValue) {
                const parsedDate = parseDate(timeValue);
                if (parsedDate && parsedDate > now) {
                    console.log(`Initializing countdown for ${el.id} with time ${timeValue}`);
                    updateEventCountdown(el.id, parsedDate, selectedKey);
                } else {
                    console.log(`Skipping countdown for past date or invalid date: ${el.id}: ${timeValue}`);
                    el.textContent = timeValue.includes('Ends in') ? timeValue : window.Localization.getTranslation('expired');
                }
            }
        });

        if (CONFIG.CYCLE_ENDPOINTS.includes(selectedKey)) {
            updateCycleCountdown(`${selectedKey}-countdown`, data.timeLeft);
        }
    } catch (error) {
        console.error(`Hiba történt a ${selectedKey} adatok megjelenítése közben:`, error);
        displayArea.innerHTML = `<div class="fade-in slide-in"><p>${window.Localization.getTranslation('errorDisplayingData')}: ${error.message}</p></div>`;
    }
}

function displayConstructionProgress(data) {
    const fomorianWidth = parseFloat(data.fomorianProgress);
    const razorbackWidth = parseFloat(data.razorbackProgress);
    const unknownWidth = parseFloat(data.unknownProgress);

    return `
        <div class="construction-progress">
            <h2>Construction Progress</h2>
            <div class="progress-bar">
                <div class="fomorian" style="width: ${fomorianWidth}%;" title="Fomorian: ${fomorianWidth}%">
                    <span>Fomorian</span>
                </div>
            </div>
            <div class="progress-bar">
                <div class="razorback" style="width: ${razorbackWidth}%;" title="Razorback: ${razorbackWidth}%">
                    <span>Razorback</span>
                </div>
            </div>
            <div class="progress-bar">
                <div class="unknown" style="width: ${unknownWidth}%;" title="Unknown: ${unknownWidth}%">
                    <span>Unknown</span>
                </div>
            </div>
            <div class="progress-details">
                <p>Fomorian: ${fomorianWidth}%</p>
                <p>Razorback: ${razorbackWidth}%</p>
                <p>Unknown: ${unknownWidth}%</p>
            </div>
        </div>
    `;
}

function displayVoidTrader(item) {
    const now = new Date();
    const activationDate = parseDate(item.activation);
    const expiryDate = parseDate(item.expiry);

    let content = `
        <div class="VoidTrader-container">
            <h2>${getTranslation('voidTraderTitle')}</h2>
            <p><strong>${getTranslation('voidTraderCharacter')}:</strong> ${item.character || 'N/A'}</p>
            <p><strong>${getTranslation('voidTraderLocation')}:</strong> ${item.location || 'N/A'}</p>
        </div>
    `;

    if (activationDate > now) {
        content += `<p><strong>${getTranslation('voidTraderArrival')}:</strong> <span id="voidtrader-arrival-countdown" class="countdown" data-time="${item.activation}">${formatDate(activationDate)}</span></p>`;
    } else if (expiryDate > now) {
        content += `<p><strong>${getTranslation('voidTraderDeparture')}:</strong> <span id="voidtrader-departure-countdown" class="countdown" data-time="${item.expiry}">${formatDate(expiryDate)}</span></p>`;
    } else {
        content += `<p><strong>${getTranslation('voidTraderStatus')}:</strong> ${getTranslation('voidTraderInactive')}</p>`;
    }

    if (item.inventory && item.inventory.length > 0) {
        content += `
            <h3>${getTranslation('voidTraderInventory')}:</h3>
            <ul>
                ${item.inventory.map(inv => `
                    <li><strong>${inv.item}</strong> Ducats: ${inv.ducats}, Kredit: ${inv.credits}</li>
                `).join('')}
            </ul>
        `;
    } else {
        content += `<p>${getTranslation('voidTraderEmptyInventory')}</p>`;
    }

    return content;
}

function displayArchonHunt(item, index) {
    console.log('Data received for', item); // Debug log
    return `
        <div class="ArchonHunt-container">
            <h2>${window.Localization.getTranslation('archonHuntTitle')}</h2>
            <p><strong>${window.Localization.getTranslation('archonHuntBoss')}:</strong> ${item.boss}</p>
            <p><strong>${window.Localization.getTranslation('archonHuntFaction')}:</strong> ${item.faction}</p>
            <p><strong>${window.Localization.getTranslation('archonHuntRewardPool')}:</strong> ${item.rewardPool}</p>
            <p><strong>${window.Localization.getTranslation('archonHuntExpiry')}:</strong> <span id="archonhunt-countdown-${index}" class="countdown" data-time="${item.expiry}" data-type="archonHunt">${item.expiry}</span></p>
            <h4>${window.Localization.getTranslation('archonHuntMissions')}:</h4>
            <ul>
                ${item.missions.map(mission => `
                    <li>${mission.node} - ${mission.type}</li>
                `).join('')}
            </ul>
        </div>
    `;
}

function displayDailyDeals(item) {
    const expiryDate = parseDate(item.expiry);
    return `
        <h2>${getTranslation('dailyDealsTitle')}</h2>
        <p><strong>${getTranslation('dailyDealsItem')}:</strong> ${item.item}</p>
        <p><strong>${getTranslation('dailyDealsOriginalPrice')}:</strong> ${item.originalPrice}</p>
        <p><strong>${getTranslation('dailyDealsSalePrice')}:</strong> ${item.salePrice}</p>
        <p><strong>${getTranslation('dailyDealsDiscount')}:</strong> ${item.discount}%</p>
        <p><strong>${getTranslation('dailyDealsTotal')}:</strong> ${item.total}</p>
        <p><strong>${getTranslation('dailyDealsSold')}:</strong> ${item.sold}</p>
        <p><strong>${getTranslation('dailyDealsExpiry')}:</strong> <span id="dailydeal-expiry-countdown" class="countdown" data-time="${item.expiry}">${formatDate(expiryDate)}</span></p>
    `;
}

function displaySentientOutposts(item, index) {
    console.log('Data received for', item); // Debug log
    return `
        <div class="sentient-outposts-container">
            <h3>${window.Localization.getTranslation('sentientOutpostsTitle')}</h3>
            <p><strong>${window.Localization.getTranslation('sentientOutpostsActivation')}:</strong> ${formatDate(parseDate(item.activation))}</p>
            <p><strong>${window.Localization.getTranslation('sentientOutpostsExpiry')}:</strong> <span id="sentientoutposts-countdown-${index}" class="countdown" data-time="${item.expiry}">${formatDate(parseDate(item.expiry))}</span></p>
            <p><strong>${window.Localization.getTranslation('sentientOutpostsActive')}:</strong> ${item.active ? 'Igen' : 'Nem'}</p>
        </div>
    `;
}

function displaySyndicateMissions(item, index) {
    console.log('Data received for', item); // Debug log
    return `
        <p><strong>Syndicate:</strong> ${item.syndicate}</p>
        <p><strong>Nodes:</strong> ${item.nodes.join(', ')}</p>
        <p><strong>Lejár:</strong> <span id="syndicatemission-countdown-${index}" class="countdown" data-time="${item.expiry}">${formatDate(parseDate(item.expiry))}</span></p>
    `;
}

function displayEvents(item, index) {
    return `
        <p><strong>Description:</strong> ${item.description}</p>
        <p><strong>Node:</strong> ${item.node}</p>
        <p><strong>Activation:</strong> ${formatDate(parseDate(item.activation))}</p>
        <p><strong>Expiry:</strong> <span id="event-countdown-${index}" class="countdown" data-time="${item.expiry}">${formatDate(parseDate(item.expiry))}</span></p>
        <h4>Rewards:</h4>
        <ul>
            ${item.rewards.map(reward => `<li>${reward.asString}</li>`).join('')}
        </ul>
    `;
}

function displayNightwave(item, index) {
    return `
        <p><strong>Season:</strong> ${item.season}</p>
        <p><strong>Activation:</strong> ${formatDate(parseDate(item.activation))}</p>
        <p><strong>Expiry:</strong> <span id="nightwave-countdown-${index}" class="countdown" data-time="${item.expiry}">${formatDate(parseDate(item.expiry))}</span></p>
        <h4>Active Challenges:</h4>
        <ul>
            ${item.activeChallenges.map(challenge => `
                <li>${challenge.title} - ${challenge.desc} (${challenge.reputation} reputation)</li>
            `).join('')}
        </ul>
    `;
}

function displaySortie(item, index) {
    return `
        <div class="sortie-container">
            <h2>${window.Localization.getTranslation('sortieTitle')}</h2>
            <p><strong>${window.Localization.getTranslation('sortieBoss')}:</strong> ${item.boss}</p>
            <p><strong>${window.Localization.getTranslation('sortieFaction')}:</strong> ${item.faction}</p>
            <p><strong>${window.Localization.getTranslation('sortieExpiry')}:</strong> <span id="sortie-countdown-${index}" class="countdown" data-time="${item.expiry}">${item.expiry}</span></p>
            <h4>${window.Localization.getTranslation('sortieVariants')}:</h4>
            <ul>
                ${item.variants.map(variant => `
                    <li>${variant.missionType} - ${variant.modifier} (${variant.node})</li>
                `).join('')}
            </ul>
        </div>
    `;
}

function displaySteelPath(item, index) {
    return `
        <p><strong>Activation:</strong> ${formatDate(parseDate(item.activation))}</p>
        <p><strong>Expiry:</strong> <span id="steelpath-countdown-${index}" class="countdown" data-time="${item.expiry}">${formatDate(parseDate(item.expiry))}</span></p>
        <h4>Current Reward:</h4>
        <p>${item.currentReward.name} - Cost: ${item.currentReward.cost}</p>
        <h4>Rotation:</h4>
        <ul>
            ${item.rotation.map(reward => `<li>${reward.name} - Cost: ${reward.cost}</li>`).join('')}
        </ul>
        <h4>Evergreen Rewards:</h4>
        <ul>
            ${item.evergreens.map(reward => `<li>${reward.name} - Cost: ${reward.cost}</li>`).join('')}
        </ul>
    `;
}

// Ciklus megjelenítés frissítése
function displayCycle(item, type) {
    let icon = '❓';  // Alapértelmezett ikon, ha nem tudjuk meghatározni
    let bgColor = 'rgba(128, 128, 128, 0.1)';  // Alapértelmezett szürke háttér
    let state = item.state || 'Unknown';  // Ha nincs state, akkor 'Unknown'-t használunk

    if (item && item.state) {
        const lowerState = item.state.toLowerCase();

        switch (type) {
            case 'earthCycle':
            case 'cetusCycle':
                icon = lowerState === 'day' ? '☀️' : '🌙';
                bgColor = lowerState === 'day' ? 'rgba(255, 165, 0, 0.1)' : 'rgba(0, 0, 255, 0.1)';
                break;
            case 'vallisCycle':
                icon = lowerState === 'warm' ? '🔥' : '❄️';
                bgColor = lowerState === 'warm' ? 'rgba(255, 0, 0, 0.1)' : 'rgba(0, 255, 255, 0.1)';
                break;
            case 'cambionCycle':
                icon = lowerState === 'vome' ? '🌊' : '🔥';
                bgColor = lowerState === 'vome' ? 'rgba(0, 0, 255, 0.1)' : 'rgba(255, 0, 0, 0.1)';
                break;
            case 'zarimanCycle':
                //icon = lowerState.includes('incarnon') ? '⚔️' : '🛡️';
                icon = lowerState.includes('incarnon') ? '<img src="https://static.wikia.nocookie.net/warframe/images/8/8a/IconGrineerOn.png" width="50" height="auto">' : '<img src="https://static.wikia.nocookie.net/warframe/images/b/b2/IconCorpusOn.png" width="50" height="auto">';
                bgColor = lowerState.includes('incarnon') ? 'rgba(255, 0, 0, 0.1)' : 'rgba(0, 255, 0, 0.1)';
                break;
        }
    }

    return `
        <div class="cycle-item" id="${type}-container" style="background-color: ${bgColor};">
            <h3>${type.charAt(0).toUpperCase() + type.slice(1)} ${icon}</h3>
            <p><strong>Állapot:</strong> ${state}</p>
            <p><strong>Hátralévő idő:</strong> <span id="${type}-countdown" class="countdown">${item.timeLeft || 'N/A'}</span></p>
        </div>
    `;
}

// Ciklus visszaszámláló frissítése
function updateCycleCountdown(elementId, timeLeft) {
    const element = document.getElementById(elementId);
    if (!element) return;

    function updateTime() {
        if (timeLeft === "Expired" || timeLeft === "N/A") {
            element.textContent = timeLeft === "Expired" ? "Lejárt" : "Nem elérhető";
            refreshCycleData(elementId.replace('-countdown', ''));
            return;
        }

        element.textContent = timeLeft;

        // Csökkentjük a hátralévő időt
        const timeParts = timeLeft.split(' ');
        let hours = parseInt(timeParts[0]) || 0;
        let minutes = parseInt(timeParts[1]) || 0;
        let seconds = parseInt(timeParts[2]) || 0;

        seconds -= 1;
        if (seconds < 0) {
            seconds = 59;
            minutes -= 1;
            if (minutes < 0) {
                minutes = 59;
                hours -= 1;
            }
        }

        timeLeft = `${hours}h ${minutes}m ${seconds}s`;

        setTimeout(updateTime, 1000);
    }

    updateTime();
}

function displayFlashSales(items) {
    if (!Array.isArray(items) || items.length === 0) {
        return `<p>${window.Localization.getTranslation('noAvailableFlashSales')}</p>`;
    }

    console.log('Data received for', items); // Debug log

    return `
        <div class="FlashSales-container">
            <h2>${window.Localization.getTranslation('flashSalesTitle')}</h2>
            ${items.map((item, index) => `
                <div class="flash-sale-item">
                    <p><strong>${window.Localization.getTranslation('flashSalesItem')}:</strong> ${item.item}</p>
                    <p><strong>${window.Localization.getTranslation('flashSalesExpiry')}:</strong> <span id="flashsale-expiry-countdown-${index}" class="countdown" data-time="${item.expiry}">${formatDate(parseDate(item.expiry))}</span></p>
                </div>
            `).join('')}
        </div>
    `;
}

function displayFissures(items, parentIndex) {
    if (!Array.isArray(items)) {
        console.warn('Fissures nem tömb formátumban érkezett:', items);
        items = [items];
    }

    if (items.length === 0) {
        return '<p>Nincs elérhető Fissure.</p>';
    }

    return items.map((fissure, index) => {
        const countdownId = `fissure-${parentIndex}-${index}-countdown`;
        return `
            <div class="fissure-item">
                <p><strong>Node:</strong> ${fissure.node || 'N/A'}</p>
                <p><strong>Küldetés típus:</strong> ${fissure.missionType || 'N/A'}</p>
                <p><strong>Tier:</strong> ${fissure.tier || 'N/A'}</p>
                <p><strong>Lejár:</strong> <span id="${countdownId}" class="countdown" data-time="${fissure.expiry}">${fissure.expiry || 'N/A'}</span></p>
            </div>
        `;
    }).join('');
}

function displayInvasions(items) {
    if (!Array.isArray(items) || items.length === 0) {
        return '<p>Nincs elérhető invázió.</p>';
    }

    return items.map((invasion, index) => {
        const progress = parseFloat(invasion.completion) || 0;
        const isDefenderWinning = progress < 0;
        const attackerWidth = isDefenderWinning ? 50 + progress/2 : 100 - Math.abs(progress)/2;
        const defenderWidth = 100 - attackerWidth;

        const attackerReward = invasion.attackerReward ? invasion.attackerReward.asString : 'N/A';
        const defenderReward = invasion.defenderReward ? invasion.defenderReward.asString : 'N/A';

        return `
        <div class="invasion-item">
            <h3>${invasion.node} - ${invasion.desc}</h3>
            <div class="invasion-progress">
                <div class="attacker" style="width: ${attackerWidth}%;">
                    <span>${invasion.attackingFaction} (${attackerReward})</span>
                </div>
                <div class="defender" style="width: ${defenderWidth}%;">
                    <span>${invasion.defendingFaction} (${defenderReward})</span>
                </div>
            </div>
            <p class="progress-text">
                ${Math.abs(progress).toFixed(2)}%
                ${isDefenderWinning ? 'Védő' : 'Támadó'} vezet
                - <span id="invasion-eta-${index}" class="countdown" data-time="${invasion.eta}">${invasion.eta}</span>
            </p>
        </div>
    `;
    }).join('');
}

function displayAlerts(items) {
    if (!Array.isArray(items) || items.length === 0) {
        console.warn('Alerts üres vagy nem tömb formátumban érkezett:', items);
        return '<p>Nincs elérhető riadó.</p>';
    }

    return items.map((alert, index) => `
        <div class="alert-item">
            <p><strong>Küldetés:</strong> ${alert.mission?.type} on ${alert.mission?.node}</p>
            <p><strong>Frakció:</strong> ${alert.mission?.faction}</p>
            <p><strong>Jutalom:</strong> ${alert.mission?.reward?.asString}</p>
            <p><strong>Lejár:</strong> <span id="alert-countdown-${index}" class="countdown" data-time="${alert.expiry}">${alert.expiry}</span></p>
        </div>
    `).join('');
}

function initializeCountdowns(container) {
    console.log('Initializing countdowns');
    const countdownElements = container.querySelectorAll('.countdown');
    console.log(`Found ${countdownElements.length} countdown elements`);
    const now = new Date();
    countdownElements.forEach((el) => {
        const timeValue = el.dataset.time;
        const elementId = el.id || 'unnamed-element';
        if (timeValue) {
            const parsedDate = parseDate(timeValue);
            console.log(`Parsing date for ${elementId}: ${timeValue} => ${parsedDate}`);
            if (parsedDate && parsedDate > now) {
                console.log(`Initializing countdown for ${elementId} with time ${timeValue}`);
                updateEventCountdown(elementId, parsedDate, el.dataset.type);
            } else {
                console.log(`Skipping countdown for past or invalid date: ${elementId}: ${timeValue}`);
                el.textContent = window.Localization.getTranslation('expired');
            }
        } else {
            console.warn(`No time value found for element: ${elementId}`);
        }
    });
}

function displayConclaveChallenges(items) {
    console.log('Received conclave challenges:', items);

    if (!items || !Array.isArray(items) || items.length === 0) {
        console.warn(window.Localization.getTranslation('warningConclaveFormat'), items);
        return `<p>${window.Localization.getTranslation('noAvailableConclave')}</p>`;
    }

    return items.map((challenge) => {
        const countdownId = `conclave-challenge-${challenge.id}-countdown`;
        const endTime = parseDate(challenge.endString);

        console.log(`Creating countdown element with ID: ${countdownId}, End time: ${endTime}`);

        return `
            <div class="challenge-item">
                <h2>${challenge.title || 'N/A'}</h2>
                <p>${challenge.description || 'N/A'}</p>
                <ul>
                    <li><strong>${window.Localization.getTranslation('conclaveChallengeCategory')}:</strong> ${challenge.category || 'N/A'}</li>
                    <li><strong>${window.Localization.getTranslation('conclaveChallengeAmount')}:</strong> ${challenge.amount || 'N/A'}</li>
                    <li><strong>${window.Localization.getTranslation('conclaveChallengeStanding')}:</strong> ${challenge.standing || 'N/A'}</li>
                    <li><strong>${window.Localization.getTranslation('conclaveChallengeExpiry')}:</strong> <span id="${countdownId}" class="countdown" data-time="${challenge.endString}">${challenge.endString || 'N/A'}</span></li>
                </ul>
            </div>
        `;
    }).join('');
}

function displayVaultTrader(item) {
    const now = new Date();
    const activationDate = parseDate(item.activation);
    const expiryDate = parseDate(item.expiry);


    let content = `
    <div class="VaultTrader-container">
        <h2>${window.Localization.getTranslation('vaultTraderTitle')}</h2>
        <p><strong>${window.Localization.getTranslation('vaultTraderLocation')}:</strong> ${item.location || 'N/A'}</p>
        <p><strong>${window.Localization.getTranslation('vaultTraderStatus')}:</strong> ${item.active ? window.Localization.getTranslation('vaultTraderActive') : window.Localization.getTranslation('vaultTraderInactive')}</p>

    `;

    if (activationDate > now) {
        content += `<p><strong>${window.Localization.getTranslation('vaultTraderActivation')}:</strong> <span id="vaulttrader-activation-countdown" class="countdown" data-time="${item.activation}">${formatDate(activationDate)}</span></p>`;
    }

    if (expiryDate > now) {
        content += `<p><strong>${window.Localization.getTranslation('vaultTraderExpiry')}:</strong> <span id="vaulttrader-expiry-countdown" class="countdown" data-time="${item.expiry}">${formatDate(expiryDate)}</span></p>`;
    }

    if (item.active) {
        content += `
            <h3>${window.Localization.getTranslation('vaultTraderCurrentInventory')}:</h3>
            <ul>
                ${item.inventory.map(inv => `
                    <li><strong>${inv.item}</strong> ${inv.ducats !== null ? `Ducats: ${inv.ducats},` : ''} ${inv.credits !== null ? `${window.Localization.getTranslation('credits')}: ${inv.credits}` : 'N/A'}</li>
                `).join('')}
            </ul>
        `;
    }

    content += `
        <h3>${window.Localization.getTranslation('vaultTraderFutureSchedule')}:</h3>
        <ul>
            ${item.schedule.filter(sch => parseDate(sch.expiry) > now).map((sch, index) => {
                const scheduleDate = parseDate(sch.expiry);
                return `
                    <li>
                        <strong>${sch.item || window.Localization.getTranslation('vaultTraderUnknownItem')}</strong> -
                        ${window.Localization.getTranslation('vaultTraderExpiry')}: <span id="vaulttrader-schedule-${index}-countdown" class="countdown" data-time="${sch.expiry}">${formatDate(scheduleDate)}</span>
                    </li>
                `;
            }).join('')}
        </ul>
    `;
    return content;
    }

function handleVoidTraderTime(date, type) {
    const now = new Date();
    const countdownId = type === 'arrival' ? 'voidtrader-arrival-countdown' : 'voidtrader-departure-countdown';
    if (date <= now) {
        return type === 'arrival' ? "MEGÉRKEZETT!" : "Eltávozott";
    } else {
        return createCountdown(countdownId, date, type === 'arrival' ? 'Érkezés' : 'Távozás');
    }
}

function displaySimaris(item) {
    return `
        <div class="Simaris-container">
            <h2>${window.Localization.getTranslation('simarisTitle')}</h2>
            <p><strong>${window.Localization.getTranslation('simarisTarget')}:</strong> ${item.target}</p>
            <p><strong>${window.Localization.getTranslation('simarisTargetActive')}:</strong> ${item.isTargetActive ? 'Yes' : 'No'}</p>
            <p><strong>${window.Localization.getTranslation('simarisStatus')}:</strong> ${item.asString}</p>
        </div>
    `;
}

function displayTrader(item, type) {
    const arrivalDate = parseDate(item.activation);
    const departureDate = parseDate(item.expiry);
    let content = `
        <p><strong>Karakter:</strong> ${item.character || 'N/A'}</p>
        <p><strong>Helyszín:</strong> ${item.location}</p>
        <p><strong>Érkezés:</strong> <span class="countdown" data-time="${item.activation}">${formatDate(arrivalDate)}</span></p>
        <p><strong>Távozás:</strong> <span class="countdown" data-time="${item.expiry}">${formatDate(departureDate)}</span></p>
        <h3>Készlet:</h3>
        <ul>
            ${item.inventory.slice().map(inv => `
                <li><strong>${inv.item}</strong> ${handleNullValue(inv.ducats, 'Ducats: ')} ${handleNullValue(inv.credits, 'Kredit: ')}</li>
            `).join('')}
        </ul>
    `;
    if (type === 'vaultTrader' && item.schedule) {
        content += `
            <h3>Ütemezés:</h3>
            <ul>
                ${item.schedule.slice(0, 5).map(sch => `
                    <li><strong>${sch.item}</strong> - Lejárat: ${formatDate(parseDate(sch.expiry))}</li>
                `).join('')}
            </ul>
        `;
    }
    return content;
}

function displayDataItem(item, type, container, index) {
    try {
        const itemDiv = document.createElement('div');
        itemDiv.className = 'data-item';

        let content = `<h2>${type.charAt(0).toUpperCase() + type.slice(1)}</h2>`;

        // Speciális típusok kezelése
        switch (type) {
            case 'constructionProgress':
                content += displayConstructionProgress(item);
                break;
            case 'voidTrader':
            case 'vaultTrader':
                content += displayTrader(item, type, index);
                break;
            case 'archonHunt':
                content += displayArchonHunt(item, index);
                break;
            case 'sortie':
                content += displaySortie(item, index);
                break;
            case 'events':
                content += displayEvents(item, index);
                break;
            case 'nightwave':
                content += displayNightwave(item, index);
                break;
            case 'steelPath':
                content += displaySteelPath(item, index);
                break;
            case 'alerts':
                content += displayAlerts(Array.isArray(item) ? item : [item], index);
                break;
            case 'invasions':
                content += displayInvasions(Array.isArray(item) ? item : [item], index);
                break;
            case 'fissures':
                content += displayFissures(Array.isArray(item) ? item : [item], index);
                break;
            case 'conclaveChallenges':
                content += displayConclaveChallenges(item, index);
                break;
            case 'syndicateMissions':
                content += displaySyndicateMissions(item, index);
                break;
            case 'flashSales':
                content += displayFlashSales(item, index);
                break;
            case 'news':
                content += displayNews(item, index);
                break;
            case 'sentientOutposts':
                content += displaySentientOutposts(item, index);
                break;
            case 'simaris':
                content += displaySimaris(item, index);
                break;
            default:
                if (CONFIG.CYCLE_ENDPOINTS.includes(type)) {
                    content += displayCycle(item, type, index);
                } else if (relevantFields[type]) {
                    content += displayRelevantFields(item, type, index);
                } else {
                    content += displayGenericData(item, type, index);
                }
        }

        itemDiv.innerHTML = content;
        container.appendChild(itemDiv);

        console.log(`Content added to DOM for ${type}`);

        // Inicializáljuk az összes visszaszámlálót
        itemDiv.querySelectorAll('.countdown').forEach(el => {
            const timeValue = el.dataset.time;
            if (timeValue) {
                const parsedDate = parseDate(timeValue);
                if (parsedDate && parsedDate > new Date()) {
                    console.log(`Setting up countdown for ${el.id} with time ${timeValue}`);
                    updateEventCountdown(el.id, parsedDate, type);
                } else if (parsedDate && parsedDate <= new Date()) {
                    console.log(`Date is in the past: ${timeValue} for element ${el.id}`);
                    el.textContent = window.Localization.getTranslation('expired');
                } else {
                    console.warn(`Érvénytelen dátum: ${timeValue} az elem ID-jához: ${el.id}`);
                    el.textContent = window.Localization.getTranslation('invalidDate');
                }
            }
        });
    } catch (error) {
        console.error(`Hiba történt a(z) ${type} megjelenítése közben:`, error);
        container.innerHTML += `<p>Hiba történt a(z) ${type} adatok megjelenítése közben: ${error.message}</p>`;
    }
}

function displayRelevantFields(item, type, index) {
    return relevantFields[type].map(field => {
        let displayValue = item[field];
        if (field === 'expiry' || field === 'activation') {
            const date = parseDate(item[field]);
            const countdownId = `${type}-${field}-countdown-${index}`;
            displayValue = createCountdown(countdownId, date, field.charAt(0).toUpperCase() + field.slice(1));
        } else if (typeof displayValue === 'object') {
            displayValue = JSON.stringify(displayValue, null, 2);
        }
        return `<p><strong>${field.charAt(0).toUpperCase() + field.slice(1)}:</strong> ${displayValue}</p>`;
    }).join('');
}

function displayGenericData(item) {
    return Object.entries(item).map(([key, value]) => {
        if (typeof value !== 'object') {
            return `<p><strong>${key.charAt(0).toUpperCase() + key.slice(1)}:</strong> ${value}</p>`;
        } else if (Array.isArray(value)) {
            return `
                <p><strong>${key.charAt(0).toUpperCase() + key.slice(1)}:</strong></p>
                <ul>
                    ${value.map(subItem => `<li>${JSON.stringify(subItem)}</li>`).join('')}
                </ul>
            `;
        }
        return '';
    }).join('');
}

function createCountdown(id, time, label, type) {
    if (!time) {
        return `<p><strong>${label}:</strong> Érvénytelen idő</p>`;
    }
    return `<p><strong>${label}:</strong> <span id="${id}" class="countdown" data-type="${type}">${formatDate(time)}</span></p>`;
}

function refreshDataForElement(elementId) {
    const type = elementId.split('-')[0];
    const activeElement = document.querySelector('#menu-items li.active');
    const selectedKey = activeElement ? activeElement.textContent.toLowerCase() : '';

    if (selectedKey === type) {
        fetchEndpoint(type)
            .then(() => displaySelectedData(type))
            .catch(error => handleError(error, `${type} refresh`));
    }
}

function startCycleCountdowns() {
    CONFIG.CYCLE_ENDPOINTS.forEach(cycleType => {
        const cycleData = WarframeData.getData(cycleType);
        if (cycleData) {
            const expiryDate = parseDate(cycleData.expiry);
            const countdownId = `${cycleType}-countdown-0`;
            updateEventCountdown(countdownId, expiryDate, cycleType);
        }
    });
}

// Módosítsuk az initCycles függvényt
function initCycles() {
    CONFIG.CYCLE_ENDPOINTS.forEach(cycleType => {
        refreshCycleData(cycleType);
        setInterval(() => refreshCycleData(cycleType), 60000); // Frissítés percenként
    });
}

function updateCycleDisplay(cycleType) {
    const activeElement = document.querySelector('#menu-items li.active');
    const selectedKey = activeElement ? activeElement.textContent.toLowerCase() : '';

    if (selectedKey === cycleType) {
        displaySelectedData(cycleType);
    }
}

function updateEventCountdown(elementId, endTime, type) {
    const element = document.getElementById(elementId);
    if (!element) {
        console.warn(`Nem található elem a következő ID-val: ${elementId}, Type: ${type}`);
        return;
    }

    if (!(endTime instanceof Date) || isNaN(endTime.getTime())) {
        console.warn(`Érvénytelen végidő: ${endTime}, ElementId: ${elementId}`);
        element.textContent = window.Localization.getTranslation('invalidDate');
        return;
    }

    function updateTime() {
        const now = new Date();
        const timeLeft = endTime.getTime() - now.getTime();

        if (timeLeft <= 0) {
            console.log(`Countdown expired for ${elementId}`);
            element.textContent = window.Localization.getTranslation('expired');
            if (type && typeof refreshEndpoint === 'function') {
                console.log(`Refreshing endpoint for ${type}`);
                refreshEndpoint(type);
            }
            return;
        }

        const days = Math.floor(timeLeft / (1000 * 60 * 60 * 24));
        const hours = Math.floor((timeLeft % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((timeLeft % (1000 * 60)) / 1000);

        element.textContent = `${days}n ${hours}ó ${minutes}p ${seconds}mp`;
        requestAnimationFrame(updateTime);
    }

    console.log(`Starting countdown for ${elementId}, End time: ${endTime}`);
    updateTime();
}

function displayNews(items) {
    console.log('Displaying news items:', items); // Naplózás ellenőrzéshez
    if (!Array.isArray(items) || items.length === 0) {
        console.warn(getTranslation('warningNoNewsItems'));
        return `<p>${getTranslation('noAvailableNews')}</p>`;
    }

    return items.map(item => `
        <div class="news-item">
            <h3>${item.message || getTranslation('titleNotAvailable')}</h3>
            <p><strong>${getTranslation('link')}:</strong> <a href="${item.link || '#'}" target="_blank">${getTranslation('readMore')}</a></p>
            ${item.imageLink ? `<img src="${item.imageLink}" alt="${getTranslation('newsImage')}" style="max-width: 100%; height: auto;">` : ''}
            <p><strong>${getTranslation('date')}:</strong> ${formatDate(parseDate(item.date)) || getTranslation('dateNotAvailable')}</p>
        </div>
    `).join('');
}

function toggleTheme() {
    document.body.classList.toggle('light-theme');
    log('Téma váltva');
}

function toggleMenu() {
    const sidebar = document.getElementById('sidebar');
    if (sidebar) {
        sidebar.classList.toggle('active');
        log('Menü állapota váltva');
    } else {
        console.error('Sidebar elem nem található');
    }
}

function startMainCountdown() {
    const countdownElement = document.getElementById('countdown');
    if (!countdownElement) return;

    let secondsLeft = 120;

    function updateCountdown() {
        countdownElement.textContent = formatTranslation('nextUpdate', { seconds: secondsLeft });
        secondsLeft--;

        if (secondsLeft < 0) {
            secondsLeft = 120;
            fetchAllData().catch(error => handleError(error, 'periodic refresh'));
        }
    }

    updateCountdown();
    setInterval(updateCountdown, 1000);
}

function showLoading() {
    const loadingOverlay = document.getElementById('loading-overlay');
    if (loadingOverlay) {
        loadingOverlay.classList.remove('hidden');
    }
}

function hideLoading() {
    const loadingOverlay = document.getElementById('loading-overlay');
    if (loadingOverlay) {
        loadingOverlay.classList.add('hidden');
    }
}

function handleError(error, context) {
    console.error(`Hiba a következő műveletben: ${context}`, error);
    log(`Hiba történt a következő műveletben: ${context} - ${error.message}`);

    const errorMessage = document.getElementById('error-message');
    if (errorMessage) {
        errorMessage.textContent = `Hiba: ${error.message}`;
        errorMessage.classList.remove('hidden');
        setTimeout(() => {
            errorMessage.classList.add('hidden');
        }, 5000);
    }
}

function handleNullValue(value, prefix = '') {
    return value !== null ? `${prefix}${value}` : 'N/A';
}

function init() {
    log('DOM betöltve, inicializálás kezdődik');
    try {
        const sidebar = document.getElementById('sidebar');
        const toggleSidebar = document.getElementById('toggle-sidebar');
        const themeToggle = document.getElementById('theme-toggle');
        const dataDisplay = document.getElementById('data-display');
        const menuItems = document.getElementById('menu-items');

        if (!sidebar || !toggleSidebar || !themeToggle || !dataDisplay || !menuItems) {
            throw new Error('Hiányzó DOM elemek');
        }

        toggleSidebar.addEventListener('click', toggleMenu);
        themeToggle.addEventListener('click', toggleTheme);

        updateMenu();
        fetchAllData()
            .then(() => {
                initCycles();
                startMainCountdown();
            })
            .catch(error => handleError(error, 'initial data fetch'));

        log('Inicializálás befejezve');
    } catch (error) {
        console.error('Hiba történt az inicializálás során:', error);
        log(`Hiba történt az inicializálás során: ${error.message}`);
    }
}

function initCycles() {
    CONFIG.CYCLE_ENDPOINTS.forEach(cycleType => {
        setInterval(() => refreshCycleData(cycleType), 60000); // Frissítés percenként
    });
}

function initMenu() {
    const menu = document.getElementById('sidebar');
    const menuToggle = document.getElementById('toggle-sidebar');
    if (menuToggle) {
        menuToggle.addEventListener('click', toggleMenu);
    } else {
        console.error('Menu toggle gomb nem található');
    }
    const menuClose = document.getElementById('menu-close');
    const menuSearch = document.querySelector('#menu-search input');
    const scrollToMain = document.getElementById('scroll-to-main');

    if (!menu || !menuToggle) {
        console.error('Hiányzó alapvető menüelemek');
        return;
    }

    menuToggle.addEventListener('click', () => {
        menu.classList.toggle('active');
    });

    if (menuClose) {
        menuClose.addEventListener('click', () => {
            menu.classList.remove('active');
        });
    }

    if (menuSearch) {
        menuSearch.addEventListener('input', (e) => {
            const searchTerm = e.target.value.toLowerCase();
            const menuItems = document.querySelectorAll('#menu-items li');

            menuItems.forEach(item => {
                const text = item.textContent.toLowerCase();
                item.style.display = text.includes(searchTerm) ? '' : 'none';
            });
        });
    }

    if (scrollToMain) {
        scrollToMain.addEventListener('click', () => {
            menu.classList.remove('active');
            document.querySelector('main')?.scrollIntoView({ behavior: 'smooth' });
        });
    }
}


/*****************************************************************************************************/
// async fügvenyek

async function loadAllData() {
  showLoadingIndicator();
  try {
    const dataPromises = CONFIG.ENDPOINTS.map(endpoint => fetchEndpoint(endpoint));
    const results = await Promise.all(dataPromises);
    results.forEach((data, index) => {
      WarframeData.setData(CONFIG.ENDPOINTS[index], data);
    });
    updateUI();
  } catch (error) {
    handleError(error);
  } finally {
    hideLoadingIndicator();
  }
}

async function fetchAllData() {
    showLoading();
    log('Összes adat lekérése kezdődik...');
    try {
        const fetchPromises = [...CONFIG.ENDPOINTS, ...CONFIG.CYCLE_ENDPOINTS].map(endpoint => fetchEndpoint(endpoint));
        await Promise.all(fetchPromises);

        // News külön kezelése
        const newsData = await fetchNews();
        WarframeData.setData('news', newsData);

        updateMenu();
        log('Összes adat sikeresen lekérve');

        // Frissítsük az aktuálisan kiválasztott nézetet
        const activeElement = document.querySelector('#menu-items li.active');
        if (activeElement) {
            const selectedKey = activeElement.textContent.toLowerCase();
            displaySelectedData(selectedKey);
        }
    } catch (error) {
        handleError(error, 'fetchAllData');
    } finally {
        hideLoading();
    }
}

async function refreshEndpoint(type) {
    try {
        const newData = await fetchEndpoint(type);
        if (newData) {
            WarframeData.setData(type, newData);
            const activeElement = document.querySelector('#menu-items li.active');
            const selectedKey = activeElement ? activeElement.textContent.toLowerCase() : '';
            if (selectedKey === type) {
                displaySelectedData(type);
            }
        }
        log(`${type} adatok automatikusan frissítve`);
    } catch (error) {
        handleError(error, `${type} auto refresh`);
    }
}

async function refreshCycleData(cycleType) {
    log(`${cycleType} adatok frissítése kezdődik...`);
    let retryCount = 0;
    const maxRetries = 3;
    const retryDelay = 30000; // 30 másodperc

    async function attemptRefresh() {
        try {
            const data = await fetchEndpoint(cycleType);
            if (data && data.timeLeft) {
                WarframeData.setData(cycleType, data);
                updateCycleDisplay(cycleType);
                log(`${cycleType} adatok sikeresen frissítve`);
            } else {
                throw new Error('Nincs adat');
            }
        } catch (error) {
            console.error(`Hiba a ${cycleType} frissítése során:`, error);
            log(`Hiba a ${cycleType} frissítése során: ${error.message}`);
            WarframeData.setData(cycleType, null);

            if (retryCount < maxRetries) {
                retryCount++;
                log(`Újrapróbálkozás ${retryCount}/${maxRetries} ${retryDelay / 1000} másodperc múlva...`);
                setTimeout(attemptRefresh, retryDelay);
            } else {
                log(`${cycleType} frissítése sikertelen ${maxRetries} próbálkozás után.`);
            }
        }
    }

    await attemptRefresh();
}

async function fetchNews() {
    try {
        const response = await fetch(`${BASE_URL}/news`);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        console.log('Fetched news data:', data); // Naplózás ellenőrzéshez
        if (!Array.isArray(data) || data.length === 0) {
            console.warn('News data is empty or not an array');
            return [];
        }
        WarframeData.setData('news', data);
        log('News adatok sikeresen frissítve');
        return data;
    } catch (error) {
        console.error('Hiba a news lekérése közben:', error);
        log(`Hiba a news lekérése közben: ${error.message}`);
        return [];
    }
}

async function fetchEndpoint(endpoint) {
    try {
        const now = Date.now();
        if (WarframeData.getLastFetchTime(endpoint) && now - WarframeData.getLastFetchTime(endpoint) < 60000) {
            console.log(`Skipping fetch for ${endpoint}, last fetch was recent.`);
            return WarframeData.getData(endpoint);
        }

        console.log(`Fetching data for ${endpoint}...`);
        const response = await fetch(`${BASE_URL}/${endpoint}`);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        console.log(`Data received for ${endpoint}:`, data);


        if (CONFIG.CYCLE_ENDPOINTS.includes(endpoint)) {
            // Ciklusok esetében csak a timeLeft és state értékeket tároljuk
            WarframeData.setData(endpoint, {
                state: data.state,
                timeLeft: normalizeTimeLeft(data.timeLeft)
            });
        } else {
            if (endpoint === 'sentientOutposts') {
                const dataDate = Math.max(
                    parseDate(data.activation)?.getTime() || 0,
                    parseDate(data.expiry)?.getTime() || 0
                );
                if (now - dataDate > 24 * 60 * 60 * 1000) {
                    log(`Figyelmeztetés: A SentientOutposts adatok elavultak lehetnek.`);
                }
            }
            WarframeData.setData(endpoint, data);
        }

        WarframeData.setLastFetchTime(endpoint, now);
        log(`${endpoint} adatok sikeresen frissítve`);
        return WarframeData.getData(endpoint);
    } catch (error) {
        console.error(`Error fetching ${endpoint}:`, error);
        log(`Hiba a(z) ${endpoint} adatok lekérése közben: ${error.message}`);
        return null;
    }
}

// Új függvény az egyéni tartalom megjelenítéséhez
async function displayCustomContent() {
    const displayArea = document.getElementById('data-display');
    displayArea.innerHTML = '<div class="loading-spinner"></div>';

    try {
        const response = await fetch(CONFIG.CUSTOM_MENU_ITEM.url);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const content = await response.text();
        displayArea.innerHTML = `<div class="fade-in slide-in">${content}</div>`;

        // Egyéni CSS betöltése
        const customCSS = document.createElement('link');
        customCSS.rel = 'stylesheet';
        customCSS.href = 'css/styles_search.css';
        document.head.appendChild(customCSS);

        // jQuery betöltése
        await new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = 'https://code.jquery.com/jquery-3.6.0.min.js';
            script.onload = resolve;
            script.onerror = reject;
            document.body.appendChild(script);
        });

        // Egyéni JavaScript betöltése
        const customJS = document.createElement('script');
        customJS.src = 'scripts/search.js';
        document.body.appendChild(customJS);
    } catch (error) {
        console.error('Hiba az egyéni tartalom betöltése közben:', error);
        displayArea.innerHTML = `<p>Hiba történt az egyéni tartalom betöltése közben: ${error.message}</p>`;
    }
}

/*****************************************************************************************************/

document.getElementById('toggle-sidebar').addEventListener('click', () => {
    toggleMenu();
    log('Menü állapota váltva');
});

document.addEventListener('DOMContentLoaded', function() {
    const footer = document.getElementById('menu-footer');
    if (footer) {
        console.log('Footer létezik');
        console.log('Footer láthatósága:', window.getComputedStyle(footer).display);
        console.log('Footer pozíciója:', footer.getBoundingClientRect());
    } else {
        console.log('Footer nem található');
    }
});

function updateUITranslations() {
    document.querySelectorAll('[data-translation-key]').forEach(element => {
        const key = element.getAttribute('data-translation-key');
        element.textContent = window.Localization.getTranslation(key);
    });
}

// Hívjuk meg ezt a függvényt az oldal betöltésekor és nyelvváltáskor
document.addEventListener('DOMContentLoaded', updateUITranslations);
document.addEventListener('DOMContentLoaded', init);
document.addEventListener('DOMContentLoaded', initMenu);
//document.documentElement.style.setProperty('--sentient-bg-color', 'rgba(255, 0, 0, 0.1)');




/*

<img src="https://static.wikia.nocookie.net/warframe/images/6/63/TennoIcon.png/revision/latest/scale-to-width-down/32?cb=20230104015820"></img>
<img src="https://static.wikia.nocookie.net/warframe/images/8/8a/IconGrineerOn.png/revision/latest/scale-to-width-down/32?cb=20221231002702"></img>
<img src="https://static.wikia.nocookie.net/warframe/images/b/b2/IconCorpusOn.png/revision/latest/scale-to-width-down/32?cb=20240906232445"></img>
<img src="https://static.wikia.nocookie.net/warframe/images/e/ea/Infestation_w.svg/revision/latest/scale-to-width-down/32?cb=20220401160938"></img>
<img src="https://static.wikia.nocookie.net/warframe/images/f/f8/SentientFactionIcon.png/revision/latest/scale-to-width-down/32?cb=20150805015325"></img>
<img src="https://static.wikia.nocookie.net/warframe/images/a/a1/StalkerSigil.png/revision/latest/scale-to-width-down/32?cb=20150101224351"></img>
<img src="https://static.wikia.nocookie.net/warframe/images/c/c6/IconNarmer.png/revision/latest/scale-to-width-down/32?cb=20220513060129"></img>
<img src="https://static.wikia.nocookie.net/warframe/images/b/b7/MurmurIcon.png/revision/latest/scale-to-width-down/32?cb=20240326045206"></img>
<img src="https://static.wikia.nocookie.net/warframe/images/2/2a/IconOrokinOn.png/revision/latest/scale-to-width-down/32?cb=20210826000807"></img>
<img src="https://static.wikia.nocookie.net/warframe/images/e/ef/ReputationLarge.png/revision/latest/scale-to-width-down/32?cb=20141029201704"></img>
<img src="https://static.wikia.nocookie.net/warframe/images/c/c0/IconWild.png/revision/latest/scale-to-width-down/32?cb=20210821074945"></img>



https://api.tenno.tools/worldstate/pc
*/

