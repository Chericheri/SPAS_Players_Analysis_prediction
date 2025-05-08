// Chart instances
let performanceRadarChart, timelineChart, comparisonRadarChart, comparisonBarChart;
let playersTable;
let allPlayers = [];

document.addEventListener('DOMContentLoaded', function() {
    initializeDataTable();
    setup
    EventListeners();
    loadPlayers(); // Automatically load players when page loads
    // Hide player stats, comparison details, and charts initially
    document.getElementById('player-stats-section').style.display = 'none';
    document.getElementById('comparison-details').classList.remove('active');
    document.getElementById('comparison-charts').style.display = 'none';
});

function setupEventListeners() {
    // Sidebar Toggle
    document.getElementById('openNav').addEventListener('click', function() {
        document.getElementById('sidebar').classList.toggle('active');
    });

    // Compare Players Link
    document.getElementById('compare-link').addEventListener('click', function(e) {
        e.preventDefault();
        showComparisonSection();
    });

    // Back to Table Link
    document.getElementById('back-to-table').addEventListener('click', function(e) {
        e.preventDefault();
        showTableSection();
    });

    // Player Selection Change
    document.getElementById('player1-select').addEventListener('change', updateComparison);
    document.getElementById('player2-select').addEventListener('change', updateComparison);

    // Only trigger comparison on button click
    document.getElementById('compare-btn').addEventListener('click', handleCompareClick);
}

function initializeDataTable() {
    $('#players-table').DataTable({
        responsive: true,
        pageLength: 10,
        order: [[4, 'desc']], // Sort by goals by default
        dom: 'Bfrtip',
        buttons: [
            'copy', 'csv', 'excel', 'pdf', 'print'
        ]
    });
}

async function loadPlayers() {
    try {
        const response = await fetch('http://localhost:5000/api/players');
        const players = await response.json();
        
        // Update DataTable
        const table = $('#players-table').DataTable();
        table.clear();
        
        players.forEach(player => {
            table.row.add([
                player.Player,
                player.Pos,
                player.Squad,
                player.Age,
                player.Goals,
                player.Assists,
                player.MP,
                `<button class="btn btn-sm btn-primary" onclick="showPlayerDetails('${player.Player}')">Details</button>`
            ]);
        });
        
        table.draw();

        // Update player select dropdowns
        updatePlayerSelects(players);
    } catch (error) {
        console.error('Failed to load players:', error);
        showError('Failed to load players data');
    }
}

function updatePlayerSelects(players) {
    const player1Select = document.getElementById('player1-select');
    const player2Select = document.getElementById('player2-select');
    
    // Clear existing options
    player1Select.innerHTML = '<option value="">Select Player 1</option>';
    player2Select.innerHTML = '<option value="">Select Player 2</option>';
    
    // Add player options
    players.forEach(player => {
        const option = `<option value="${player.Player}">${player.Player} (${player.Squad})</option>`;
        player1Select.innerHTML += option;
        player2Select.innerHTML += option;
    });
}

function showComparisonSection() {
    document.getElementById('players-table-section').style.display = 'none';
    document.getElementById('comparison-section').style.display = 'block';
    document.getElementById('back-to-table').style.display = 'block';
    document.getElementById('compare-link').style.display = 'none';
    document.getElementById('comparison-details').classList.remove('active');
    document.getElementById('comparison-charts').style.display = 'none';
}

function showTableSection() {
    document.getElementById('players-table-section').style.display = 'block';
    document.getElementById('player-stats-section').style.display = 'none';
    document.getElementById('comparison-section').style.display = 'none';
    document.getElementById('back-to-table').style.display = 'none';
    document.getElementById('comparison-charts').style.display = 'none';
    document.getElementById('comparison-details').classList.remove('active');
}

function handleCompareClick() {
    const player1 = document.getElementById('player1-select').value;
    const player2 = document.getElementById('player2-select').value;
    if (!player1 || !player2) {
        showError('Please select two players to compare.');
        document.getElementById('comparison-details').classList.remove('active');
        document.getElementById('comparison-charts').style.display = 'none';
        return;
    }
    updateComparison(player1, player2);
}

async function updateComparison(player1, player2) {
    try {
        // Fetch player data from the database
        const [player1Data, player2Data] = await Promise.all([
            fetch(`http://localhost:5000/api/stats/player/${encodeURIComponent(player1)}`).then(res => res.json()),
            fetch(`http://localhost:5000/api/stats/player/${encodeURIComponent(player2)}`).then(res => res.json())
        ]);
        // Only show table and charts if both players are valid and have names
        if (!player1Data || !player2Data || !player1Data.Player || !player2Data.Player) {
            document.getElementById('comparison-details').classList.remove('active');
            document.getElementById('comparison-charts').style.display = 'none';
            showError('Could not fetch both players from the database.');
            return;
        }
        // Update comparison table and charts
        updateComparisonTable(player1Data, player2Data);
        updateComparisonCharts(player1Data, player2Data);
        // Show comparison details and charts
        document.getElementById('comparison-details').classList.add('active');
        document.getElementById('comparison-charts').style.display = 'block';
    } catch (error) {
        console.error('Failed to update comparison:', error);
        showError('Failed to update player comparison');
        document.getElementById('comparison-details').classList.remove('active');
        document.getElementById('comparison-charts').style.display = 'none';
    }
}

function updateComparisonTable(player1, player2) {
    // Only show the table if both player objects are valid and have names
    if (!player1 || !player2 || !player1.Player || !player2.Player) {
        document.getElementById('comparison-details').classList.remove('active');
        return;
    }
    const comparisonDetails = document.getElementById('comparison-details');
    comparisonDetails.innerHTML = `
        <div class="mt-4">
            <h4>Detailed Comparison</h4>
            <table class="table table-striped table-hover">
                <thead class="table-dark">
                    <tr>
                        <th>Metric</th>
                        <th>${player1.Player}</th>
                        <th>${player2.Player}</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td>Position</td>
                        <td>${player1.Pos}</td>
                        <td>${player2.Pos}</td>
                    </tr>
                    <tr>
                        <td>Team</td>
                        <td>${player1.Squad}</td>
                        <td>${player2.Squad}</td>
                    </tr>
                    <tr>
                        <td>Age</td>
                        <td>${player1.Age}</td>
                        <td>${player2.Age}</td>
                    </tr>
                    <tr>
                        <td>Goals</td>
                        <td>${player1.Goals}</td>
                        <td>${player2.Goals}</td>
                    </tr>
                    <tr>
                        <td>Assists</td>
                        <td>${player1.Assists}</td>
                        <td>${player2.Assists}</td>
                    </tr>
                    <tr>
                        <td>Matches Played</td>
                        <td>${player1.MP}</td>
                        <td>${player2.MP}</td>
                    </tr>
                    <tr>
                        <td>Pass Completion %</td>
                        <td>${player1.PasTotCmp_percent}%</td>
                        <td>${player2.PasTotCmp_percent}%</td>
                    </tr>
                    <tr>
                        <td>Shot Accuracy</td>
                        <td>${((player1.SoT / player1.Shots) * 100).toFixed(1)}%</td>
                        <td>${((player2.SoT / player2.Shots) * 100).toFixed(1)}%</td>
                    </tr>
                </tbody>
            </table>
        </div>
    `;
}

function updateComparisonCharts(player1, player2) {
    // Destroy previous charts if they exist
    if (window.comparisonGoalsAssistsChart) window.comparisonGoalsAssistsChart.destroy();
    if (window.comparisonPassingChart) window.comparisonPassingChart.destroy();
    if (window.comparisonShotsChart) window.comparisonShotsChart.destroy();
    if (window.comparisonMinutesChart) window.comparisonMinutesChart.destroy();

    // Goals vs Assists Chart
    window.comparisonGoalsAssistsChart = new Chart(document.getElementById('comparison-goals-assists'), {
        type: 'bar',
        data: {
            labels: ['Goals', 'Assists'],
            datasets: [
                {
                    label: player1.Player,
                    data: [player1.Goals, player1.Assists],
                    backgroundColor: '#1f1d47',
                    borderColor: '#1f1d47',
                    borderWidth: 2
                },
                {
                    label: player2.Player,
                    data: [player2.Goals, player2.Assists],
                    backgroundColor: '#26cc35',
                    borderColor: '#26cc35',
                    borderWidth: 2
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { labels: { color: '#1f1d47', font: { weight: 'bold' } } }
            },
            scales: {
                x: { ticks: { color: '#1f1d47' } },
                y: { beginAtZero: true, ticks: { color: '#1f1d47' } }
            }
        }
    });

    // Passing Accuracy Chart
    window.comparisonPassingChart = new Chart(document.getElementById('comparison-passing'), {
        type: 'bar',
        data: {
            labels: [player1.Player, player2.Player],
            datasets: [
                {
                    label: 'Passing Accuracy (%)',
                    data: [player1.PasTotCmp_percent, player2.PasTotCmp_percent],
                    backgroundColor: ['#1f1d47', '#26cc35'],
                    borderColor: ['#1f1d47', '#26cc35'],
                    borderWidth: 2
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { labels: { color: '#1f1d47', font: { weight: 'bold' } } }
            },
            scales: {
                x: { ticks: { color: '#1f1d47' } },
                y: { beginAtZero: true, max: 100, ticks: { color: '#1f1d47' } }
            }
        }
    });

    // Shots on Target Chart
    window.comparisonShotsChart = new Chart(document.getElementById('comparison-shots'), {
        type: 'bar',
        data: {
            labels: [player1.Player, player2.Player],
            datasets: [
                {
                    label: 'Shots on Target',
                    data: [player1.SoT, player2.SoT],
                    backgroundColor: ['#1f1d47', '#26cc35'],
                    borderColor: ['#1f1d47', '#26cc35'],
                    borderWidth: 2
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { labels: { color: '#1f1d47', font: { weight: 'bold' } } }
            },
            scales: {
                x: { ticks: { color: '#1f1d47' } },
                y: { beginAtZero: true, ticks: { color: '#1f1d47' } }
            }
        }
    });

    // Minutes Played Chart
    window.comparisonMinutesChart = new Chart(document.getElementById('comparison-minutes'), {
        type: 'bar',
        data: {
            labels: [player1.Player, player2.Player],
            datasets: [
                {
                    label: 'Minutes Played',
                    data: [player1.Min, player2.Min],
                    backgroundColor: ['#1f1d47', '#26cc35'],
                    borderColor: ['#1f1d47', '#26cc35'],
                    borderWidth: 2
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { labels: { color: '#1f1d47', font: { weight: 'bold' } } }
            },
            scales: {
                x: { ticks: { color: '#1f1d47' } },
                y: { beginAtZero: true, ticks: { color: '#1f1d47' } }
            }
        }
    });
}

async function showPlayerDetails(playerName) {
    try {
        const response = await fetch(`http://localhost:5000/api/stats/player/${playerName}`);
        const playerData = await response.json();
        
        // Show player details in a modal or dedicated section
        // Implementation depends on your requirements
    } catch (error) {
        console.error('Failed to load player details:', error);
        showError('Failed to load player details');
    }
}

function showError(message) {
    const alertDiv = document.createElement('div');
    alertDiv.className = 'alert alert-danger alert-dismissible fade show';
    alertDiv.innerHTML = `
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    `;
    document.querySelector('.main-content').prepend(alertDiv);
}

// Add new function to calculate estimated market value
function calculateMarketValue(player) {
    // Base value starts at 1 million
    let baseValue = 1000000;
    
    // Age factor (players between 23-28 get bonus, others get reduction)
    const ageFactor = player.Age >= 23 && player.Age <= 28 ? 1.5 : 
                     player.Age < 23 ? 1.2 : 
                     Math.max(0.5, 1 - ((player.Age - 28) * 0.1));

    // Performance factor based on goals and assists per match
    const goalsPerMatch = player.Goals / player.MP;
    const assistsPerMatch = player.Assists / player.MP;
    const performanceFactor = 1 + (goalsPerMatch * 2) + assistsPerMatch;

    // Position factor
    const positionFactor = player.Pos === 'FW' ? 1.3 :
                          player.Pos === 'MF' ? 1.2 :
                          player.Pos === 'DF' ? 1.1 : 1;

    // Calculate final value
    const marketValue = baseValue * ageFactor * performanceFactor * positionFactor;

    return Math.round(marketValue);
}

function formatMarketValue(value) {
    if (value >= 1000000) {
        return `€${(value / 1000000).toFixed(1)}M`;
    } else if (value >= 1000) {
        return `€${(value / 1000).toFixed(1)}K`;
    }
    return `€${value}`;
}

function showMarketValueSection() {
    // Hide other sections
    document.getElementById('players-table-section').style.display = 'none';
    document.getElementById('player-stats-section').style.display = 'none';
    document.getElementById('comparison-section').style.display = 'none';
    document.getElementById('back-to-table').style.display = 'block';

    // Create market value section if it doesn't exist
    let marketValueSection = document.getElementById('market-value-section');
    if (!marketValueSection) {
        marketValueSection = document.createElement('div');
        marketValueSection.id = 'market-value-section';
        marketValueSection.className = 'chart-container';
        document.querySelector('.main-content').appendChild(marketValueSection);
    }

    // Calculate market values for all players
    const playersWithValue = allPlayers.map(player => ({
        ...player,
        marketValue: calculateMarketValue(player)
    })).sort((a, b) => b.marketValue - a.marketValue);

    // Create content for market value section
    const topPlayers = playersWithValue.slice(0, 10);
    
    const marketValueHtml = `
        <h3 class="mb-4">Player Market Values</h3>
        <div class="row mb-4">
            <div class="col-md-6">
                <div class="chart-container">
                    <h4>Top 10 Market Values</h4>
                    <canvas id="market-value-chart"></canvas>
                </div>
            </div>
            <div class="col-md-6">
                <div class="chart-container">
                    <h4>Market Value Distribution</h4>
                    <canvas id="value-distribution-chart"></canvas>
                </div>
            </div>
        </div>
        <div class="table-responsive">
            <table class="table table-striped table-hover">
                <thead class="table-dark">
                    <tr>
                        <th>Rank</th>
                        <th>Player</th>
                        <th>Position</th>
                        <th>Team</th>
                        <th>Age</th>
                        <th>Market Value</th>
                    </tr>
                </thead>
                <tbody>
                    ${topPlayers.map((player, index) => `
                        <tr>
                            <td>${index + 1}</td>
                            <td>${player.Player}</td>
                            <td>${player.Pos}</td>
                            <td>${player.Squad}</td>
                            <td>${player.Age}</td>
                            <td>${formatMarketValue(player.marketValue)}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>
    `;

    marketValueSection.innerHTML = marketValueHtml;

    // Create bar chart for top 10 market values
    const marketValueCtx = document.getElementById('market-value-chart').getContext('2d');
    new Chart(marketValueCtx, {
        type: 'bar',
        data: {
            labels: topPlayers.map(p => p.Player),
            datasets: [{
                label: 'Market Value',
                data: topPlayers.map(p => p.marketValue / 1000000), // Convert to millions
                backgroundColor: 'rgba(52, 152, 219, 0.8)',
                borderColor: 'rgba(52, 152, 219, 1)',
                borderWidth: 1,
                borderRadius: 5
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            indexAxis: 'y',
            plugins: {
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return `€${context.raw.toFixed(1)}M`;
                        }
                    }
                }
            },
            scales: {
                x: {
                    title: {
                        display: true,
                        text: 'Market Value (Millions €)',
                        font: {
                            weight: 'bold'
                        }
                    }
                }
            }
        }
    });

    // Create distribution chart
    const valueRanges = [
        { min: 0, max: 1000000, label: '0-1M' },
        { min: 1000000, max: 5000000, label: '1-5M' },
        { min: 5000000, max: 10000000, label: '5-10M' },
        { min: 10000000, max: 20000000, label: '10-20M' },
        { min: 20000000, max: Infinity, label: '20M+' }
    ];

    const distribution = valueRanges.map(range => ({
        range: range.label,
        count: playersWithValue.filter(p => p.marketValue >= range.min && p.marketValue < range.max).length
    }));

    const distributionCtx = document.getElementById('value-distribution-chart').getContext('2d');
    new Chart(distributionCtx, {
        type: 'pie',
        data: {
            labels: distribution.map(d => d.range),
            datasets: [{
                data: distribution.map(d => d.count),
                backgroundColor: [
                    'rgba(52, 152, 219, 0.8)',
                    'rgba(46, 204, 113, 0.8)',
                    'rgba(155, 89, 182, 0.8)',
                    'rgba(231, 76, 60, 0.8)',
                    'rgba(241, 196, 15, 0.8)'
                ]
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'right'
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const value = context.raw;
                            const percentage = ((value / playersWithValue.length) * 100).toFixed(1);
                            return `${value} players (${percentage}%)`;
                        }
                    }
                }
            }
        }
    });
}

function showPlayerStats(playerData) {
    // Hide other sections
    document.getElementById('players-table-section').style.display = 'none';
    document.getElementById('comparison-section').style.display = 'none';
    document.getElementById('player-stats-section').style.display = 'block';
    document.getElementById('back-to-table').style.display = 'block';
    // ... rest of your showPlayerStats logic ...
} 