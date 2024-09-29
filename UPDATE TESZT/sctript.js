// Fetch data from Warframe API (PC platform)
fetch('https://api.warframestat.us/pc')
    .then(response => response.json())
    .then(data => {
        // Log the data to the console for inspection
        console.log(data);

        // Display bounty rewards
        displayBountyRewards(data.syndicateMissions);
    })
    .catch(error => {
        console.error("Error occurred while fetching data:", error);
    });

function displayBountyRewards(syndicateMissions) {
    const bountyContainer = document.getElementById('bounty-container');

    // Clear existing content
    bountyContainer.innerHTML = '';

    // Check if 'syndicateMissions' is an array
    if (Array.isArray(syndicateMissions)) {
        syndicateMissions.forEach(bounty => {
            const bountyDiv = document.createElement('div');
            bountyDiv.classList.add('bounty');

            // Identify bounty type based on ID
            const bountyType = identifyBountyType(bounty.id);

            // Check if jobs exist
            if (Array.isArray(bounty.jobs) && bounty.jobs.length > 0) {
                // Create HTML structure for each job, grouping enemy levels and rewards
                const rewardText = bounty.jobs.map(job => {
                    return `
                        <div class="job">
                            <p><strong>Enemy Levels:</strong> ${job.enemyLevels ? job.enemyLevels.join(' - ') : 'Unknown'}</p>
                            <p><strong>Rewards:</strong> ${job.rewardPool ? job.rewardPool.join(', ') : 'No rewards available'}</p>
                        </div>
                    `;
                }).join('');

                // Insert into the bounty div
                bountyDiv.innerHTML = `
                    <h2>${bounty.syndicate} - ${bountyType}</h2>
                    ${rewardText}
                `;

                bountyContainer.appendChild(bountyDiv);
            } else {
                // Handle case where no jobs are present
                bountyDiv.innerHTML = `
                    <h2>${bounty.syndicate} - ${bountyType}</h2>
                    <p>No bounties available at this time.</p>
                `;
                bountyContainer.appendChild(bountyDiv);
            }
        });
    } else {
        console.error("'syndicateMissions' is not an array:", syndicateMissions);
    }
}

// Function to determine bounty type based on "id"
function identifyBountyType(id) {
    if (id.includes('AttritionBounty')) {
        return 'Attrition Bounty';
    } else if (id.includes('ReclamationBounty')) {
        return 'Reclamation Bounty';
    } else if (id.includes('DeimosAssassinateBounty')) {
        return 'Deimos Assassinate Bounty';
    } else {
        return 'Unknown Bounty';
    }
}
