$(document).ready(function() {
    let searchTimeout;
    const $searchInput = $("#search-input");
    const $resetButton = $("#reset-search");
    const $categorySelect = $("#category-select");
    const $platformSelect = $("#platform-select");
    const $results = $("#results");

    const RIVEN_DATA_URLS = {
        'pc': 'https://www-static.warframe.com/repos/weeklyRivensPC.json',
        'ps4': 'https://www-static.warframe.com/repos/weeklyRivensPS4.json',
        'xb1': 'https://www-static.warframe.com/repos/weeklyRivensXB1.json',
        'swi': 'https://www-static.warframe.com/repos/weeklyRivensSWI.json'
    };

    function showLoadingIndicator() {
        $("#loading-overlay").removeClass("hidden");
    }

    function hideLoadingIndicator() {
        $("#loading-overlay").addClass("hidden");
    }


    function initSearch() {
        $searchInput.on('input', handleSearchInput);
        $categorySelect.on('change', handleCategoryChange);
        $platformSelect.on('change', handlePlatformChange);
        $resetButton.on('click', resetSearch);

        $("#show-prime").on('change', searchItems);
        $("#show-wiki").on('change', searchItems);
    }

    function handleSearchInput() {
        clearTimeout(searchTimeout);
        const searchTerm = $searchInput.val().trim();

        if (searchTerm.length > 0 || $categorySelect.val() !== '') {
            $resetButton.show();
            searchTimeout = setTimeout(searchItems, 300);
        } else {
            $resetButton.hide();
            $results.empty();
        }
    }

    function handleCategoryChange() {
        $resetButton.show();
        togglePlatformSelect();
        searchItems();
    }

    function handlePlatformChange() {
        if ($categorySelect.val() === 'rivens') {
            searchItems();
        }
    }

    function togglePlatformSelect() {
        $platformSelect.toggle($categorySelect.val() === 'rivens');
    }

    function resetSearch() {
        $searchInput.val('');
        $categorySelect.val('');
        $platformSelect.val('pc').hide();
        $resetButton.hide();
        $results.empty();
    }

    function searchItems() {
        const searchTerm = $searchInput.val().trim();
        const category = $categorySelect.val();
        const platform = $platformSelect.val();
        const showPrime = $("#show-prime").prop('checked');
        const showWiki = $("#show-wiki").prop('checked');

        showLoadingIndicator();
        $results.html("<p>Searching...</p>");

        if (searchTerm.length === 0 && category === '') {
            $results.empty();
            hideLoadingIndicator();
            return;
        }

        let apiUrl;
        if (category === 'rivens') {
            apiUrl = RIVEN_DATA_URLS[platform];
        } else {
            apiUrl = searchTerm
                ? `https://api.warframestat.us/${category}/search/${encodeURIComponent(searchTerm)}`
                : `https://api.warframestat.us/${category}`;
        }

        $.ajax({
            url: apiUrl,
            type: 'GET',
            dataType: 'json',
            success: function(data) {
                console.log("API Data:", data);
                let allResults = [];

                if (category === 'rivens') {
                    allResults = processRivenData(data, searchTerm, showWiki);
                } else {
                    if (Array.isArray(data) && data.length > 0) {
                        data.forEach(item => {
                            let processedItem = processItem(item, category, showPrime, showWiki);
                            if (processedItem) allResults.push(processedItem);
                        });
                    } else if (typeof data === 'object' && Object.keys(data).length > 0) {
                        let processedItem = processItem(data, category, showPrime, showWiki);
                        if (processedItem) allResults.push(processedItem);
                    }
                }

                displayResults(allResults);
                hideLoadingIndicator();
            },
            error: function(jqXHR, textStatus, errorThrown) {
                console.error("API request failed", textStatus, errorThrown);
                $results.html(`
                    <p>Error occurred while searching. Please try again later.</p>
                    <p>Error details: ${textStatus} - ${errorThrown}</p>
                `);
                hideLoadingIndicator();
            }
        });
    }

    function displayResults(results) {
        if (!results || results.length === 0) {
            $results.html("<p>No results found for the search term.</p>");
        } else {
            $results.html(results.join(''));
        }
    }

    function loadMoreResults() {
        displayResults();
    }

    function handleScroll() {
        if ($(this).scrollTop() > 300) {
            $scrollToTopButton.addClass('visible');
        } else {
            $scrollToTopButton.removeClass('visible');
        }
    }

    function scrollToTop() {
        $('html, body').animate({scrollTop : 0}, 800);
        return false;
    }

    function processRivenData(data, searchTerm, showWiki) {
        let processedResults = [];
        const filteredData = searchTerm
            ? data.filter(item => item.compatibility && item.compatibility.toLowerCase().includes(searchTerm.toLowerCase()))
            : data;

        filteredData.forEach(item => {
            let htmlContent = `
                <div class="result-card">
                    <div class="result-title">${item.compatibility || item.itemType} Riven Mod</div>
                    <div>Type: ${item.itemType}</div>
                    <h3>Riven Information:</h3>
                    <p><strong>Rerolled:</strong> ${item.rerolled ? 'Yes' : 'No'}</p>
                    <p><strong>Average Price:</strong> ${item.avg.toFixed(2)}</p>
                    <p><strong>Standard Deviation:</strong> ${item.stddev.toFixed(2)}</p>
                    ${item.min !== undefined ? `<p><strong>Minimum Price:</strong> ${item.min}</p>` : ''}
                    ${item.max !== undefined ? `<p><strong>Maximum Price:</strong> ${item.max}</p>` : ''}
                    ${item.pop !== undefined ? `<p><strong>Popularity:</strong> ${item.pop}</p>` : ''}
            `;

            if (showWiki && item.compatibility) {
                let wikiUrl = `https://warframe.fandom.com/wiki/${encodeURIComponent(item.compatibility.replace(/ /g, '_'))}`;
                htmlContent += `<a href="${wikiUrl}" target="_blank" class="wiki-link">Wiki Page</a>`;
            }

            htmlContent += '</div>';
            processedResults.push(htmlContent);
        });

        return processedResults;
    }

    function processItem(item, category, showPrime, showWiki) {
        const itemName = item.name || item.item || 'Unknown';
        const isPrime = itemName.toLowerCase().includes('prime');

        if ((category === 'items' || category === 'warframes') &&
            ((showPrime && !isPrime) || (!showPrime && isPrime))) {
            return '';
        }

        let wikiUrl = item.wikiaUrl || `https://warframe.fandom.com/wiki/${encodeURIComponent(itemName.replace(/ /g, '_'))}`;
        let imageUrl = item.wikiaThumbnail ? fixImageUrl(item.wikiaThumbnail) : '';

        let htmlContent = `
            <div class="result-card">
                ${imageUrl ? `<img src="${imageUrl}" alt="${itemName}" class="result-image" onerror="this.style.display='none';">` : ''}
                <div class="result-title">${itemName}</div>
                <div>Type: ${item.type || category}</div>
                ${item.description ? `<div>${item.description}</div>` : ''}
        `;

        if (category === 'drops') {
            htmlContent += getDropInfo(item);
        } else {
            switch(category) {
                case 'items':
                case 'warframes':
                case 'weapons':
                    htmlContent += getItemInfo(item);
                    break;
                case 'mods':
                    htmlContent += getModInfo(item);
                    break;
                case 'arcanes':
                    htmlContent += getArcaneInfo(item);
                    break;
                case 'rivens':
                    htmlContent += getRivenInfo(item);
                    break;
                default:
                    htmlContent += getGenericInfo(item);
            }
        }

        htmlContent += `
                ${showWiki ? `<a href="${wikiUrl}" target="_blank" class="wiki-link">Wiki Page</a>` : ''}
            </div>
        `;

        return htmlContent;
    }

    function fixImageUrl(url) {
        return url.replace(/\/revision\/latest.*$/, '');
    }

    function getDropInfo(item) {
        let dropInfoHtml = '<div class="drop-info">';
        dropInfoHtml += `<p><strong>Location:</strong> ${item.place || 'Unknown'}</p>`;
        dropInfoHtml += `<p><strong>Rarity:</strong> ${item.rarity || 'Unknown'}</p>`;
        dropInfoHtml += `<p><strong>Chance:</strong> ${item.chance ? item.chance.toFixed(2) + '%' : 'Unknown'}</p>`;
        dropInfoHtml += '</div>';
        return dropInfoHtml;
    }

    function getItemInfo(item) {
        let infoHtml = '';

        if (item.components) {
            infoHtml += '<h3>Components:</h3><ul>';
            item.components.forEach(component => {
                infoHtml += `<li>${component.name}`;
                if (component.itemCount) {
                    infoHtml += ` (x${component.itemCount})`;
                }
                infoHtml += '</li>';
            });
            infoHtml += '</ul>';
        }

        if (item.drops) {
            infoHtml += '<h3>Drop Locations:</h3><ul>';
            item.drops.forEach(drop => {
                infoHtml += `<li>${drop.location}: ${drop.chance ? (drop.chance * 100).toFixed(2) + '%' : 'Unknown'}</li>`;
            });
            infoHtml += '</ul>';
        }

        if (item.components) {
            infoHtml += getRelicInfo(item);
        }

        return infoHtml;
    }

    function getModInfo(mod) {
        let modInfoHtml = '<h3>Mod Statistics:</h3>';

        if (mod.levelStats) {
            modInfoHtml += '<table class="stats-table"><tr><th>Rank</th><th>Effect</th></tr>';
            mod.levelStats.forEach((stat, index) => {
                modInfoHtml += `<tr><td>${index}</td><td>${Array.isArray(stat.stats) ? stat.stats.join(', ') : stat.stats}</td></tr>`;
            });
            modInfoHtml += '</table>';
        }

        if (mod.polarity) {
            modInfoHtml += `<p><strong>Polarity:</strong> ${mod.polarity}</p>`;
        }

        if (mod.rarity) {
            modInfoHtml += `<p><strong>Rarity:</strong> ${mod.rarity}</p>`;
        }

        if (mod.fusionLimit) {
            modInfoHtml += `<p><strong>Max Rank:</strong> ${mod.fusionLimit}</p>`;
        }

        return modInfoHtml;
    }

    function getArcaneInfo(arcane) {
        let arcaneInfoHtml = '<h3>Arcane Effects:</h3>';

        if (arcane.levelStats) {
            arcaneInfoHtml += '<table class="stats-table"><tr><th>Rank</th><th>Effect</th></tr>';
            arcane.levelStats.forEach((stat, index) => {
                arcaneInfoHtml += `<tr><td>${index}</td><td>${Array.isArray(stat.stats) ? stat.stats.join(', ') : stat.stats}</td></tr>`;
            });
            arcaneInfoHtml += '</table>';
        }

        if (arcane.rarity) {
            arcaneInfoHtml += `<p><strong>Rarity:</strong> ${arcane.rarity}</p>`;
        }

        return arcaneInfoHtml;
    }

    function getRivenInfo(riven) {
        let rivenInfoHtml = '<h3>Riven Mod Information:</h3>';

        if (riven.attributes) {
            rivenInfoHtml += '<h4>Attributes:</h4><ul>';
            riven.attributes.forEach(attr => {
                rivenInfoHtml += `<li>${attr.name}: ${attr.value}${attr.units || ''}</li>`;
            });
            rivenInfoHtml += '</ul>';
        }

        if (riven.weaponType) {
            rivenInfoHtml += `<p><strong>Weapon Type:</strong> ${riven.weaponType}</p>`;
        }

        if (riven.compatibility) {
            rivenInfoHtml += `<p><strong>Compatible with:</strong> ${riven.compatibility}</p>`;
        }

        if (riven.mastery) {
            rivenInfoHtml += `<p><strong>Mastery Requirement:</strong> ${riven.mastery}</p>`;
        }

        if (riven.rerolls) {
            rivenInfoHtml += `<p><strong>Rerolls:</strong> ${riven.rerolls}</p>`;
        }

        return rivenInfoHtml;
    }

function getGenericInfo(item) {
        let infoHtml = '';
        for (let key in item) {
            if (item.hasOwnProperty(key) && typeof item[key] !== 'object') {
                infoHtml += `<p><strong>${key}:</strong> ${item[key]}</p>`;
            }
        }
        return infoHtml;
    }

    function getRelicInfo(item) {
        let relicInfoHtml = '';
        if (item.components) {
            let relicDrops = {};

            item.components.forEach(component => {
                if (component.drops) {
                    component.drops.forEach(drop => {
                        if (drop.location.includes('Relic')) {
                            let [relicName, refinement] = drop.location.split(' ');
                            if (refinement) refinement = `(${refinement})`;
                            else refinement = '(Intact)';

                            if (!relicDrops[component.name]) relicDrops[component.name] = {};
                            if (!relicDrops[component.name][relicName]) relicDrops[component.name][relicName] = {};
                            relicDrops[component.name][relicName][refinement] = drop.chance;
                        }
                    });
                }
            });

            relicInfoHtml += '<div class="relic-info"><h3>Relic Drops:</h3>';

            for (let component in relicDrops) {
                relicInfoHtml += `<h4>${component}</h4><ul>`;
                for (let relic in relicDrops[component]) {
                    relicInfoHtml += `<li>${relic}:`;
                    let chances = [];
                    for (let refinement in relicDrops[component][relic]) {
                        let chance = relicDrops[component][relic][refinement];
                        let rarity = getRarityClass(chance);
                        chances.push(`<span class="${rarity}">${refinement}: ${chance.toFixed(2)}%</span>`);
                    }
                    relicInfoHtml += ` ${chances.join(', ')}</li>`;
                }
                relicInfoHtml += '</ul>';
            }

            relicInfoHtml += '</div>';
        }
        return relicInfoHtml;
    }

    function getRarityClass(chance) {
        if (chance <= 2) return 'rare';
        if (chance <= 11) return 'uncommon';
        return 'common';
    }

    // Inicializálás
    initSearch();
});