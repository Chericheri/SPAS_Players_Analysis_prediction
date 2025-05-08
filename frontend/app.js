// Chart instances
let ageChart, positionChart, goalsAssistsChart, accuracyChart;

document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM loaded, initializing charts...');
    initializeCharts();
    fetchAndUpdateData();

    // Add event listeners for chart type changes
    document.getElementById('age-chart-type').addEventListener('change', function(e) {
        updateChartType('age', e.target.value);
    });

    document.getElementById('position-chart-type').addEventListener('change', function(e) {
        updateChartType('position', e.target.value);
    });

    document.getElementById('goals-assists-type').addEventListener('change', function(e) {
        updateChartType('goals-assists', e.target.value);
    });

    document.getElementById('accuracy-chart-type').addEventListener('change', function(e) {
        updateChartType('accuracy', e.target.value);
    });
});

function initializeCharts() {
    // Initialize Age Distribution Chart as Line Chart
    const ageCtx = document.getElementById('age-distribution').getContext('2d');
    ageChart = new Chart(ageCtx, {
        type: 'line',
        data: {
            labels: [],
            datasets: [{
                label: 'Players',
                data: [],
                borderColor: '#3498db',
                tension: 0.4,
                fill: false
            }]
        },
        options: {
            responsive: true,
            plugins: {
                title: {
                    display: true,
                    text: 'Age Distribution'
                }
            }
        }
    });

    // Initialize Position Distribution Chart as Pie Chart
    const positionCtx = document.getElementById('position-distribution').getContext('2d');
    positionChart = new Chart(positionCtx, {
        type: 'pie',
        data: {
            labels: [],
            datasets: [{
                data: [],
                backgroundColor: [
                    '#3498db',
                    '#e74c3c',
                    '#2ecc71',
                    '#f1c40f',
                    '#9b59b6'
                ]
            }]
        },
        options: {
            responsive: true,
            plugins: {
                title: {
                    display: true,
                    text: 'Position Distribution'
                }
            }
        }
    });

    // Initialize Goals vs Assists Chart as Scatter Plot
    const goalsAssistsCtx = document.getElementById('goals-assists').getContext('2d');
    goalsAssistsChart = new Chart(goalsAssistsCtx, {
        type: 'scatter',
        data: {
            datasets: [{
                label: 'Players',
                data: [],
                backgroundColor: '#3498db'
            }]
        },
        options: {
            responsive: true,
            plugins: {
                title: {
                    display: true,
                    text: 'Goals vs Assists'
                }
            },
            scales: {
                x: {
                    title: {
                        display: true,
                        text: 'Goals'
                    }
                },
                y: {
                    title: {
                        display: true,
                        text: 'Assists'
                    }
                }
            }
        }
    });

    // Initialize Accuracy by Position Chart as Bar Chart
    const accuracyCtx = document.getElementById('accuracy-by-position').getContext('2d');
    accuracyChart = new Chart(accuracyCtx, {
        type: 'bar',
        data: {
            labels: [],
            datasets: [{
                label: 'Pass Accuracy (%)',
                data: [],
                backgroundColor: '#3498db'
            }]
        },
        options: {
            responsive: true,
            plugins: {
                title: {
                    display: true,
                    text: 'Pass Accuracy by Position'
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    max: 100
                }
            }
        }
    });
}

async function fetchAndUpdateData() {
    try {
        console.log('Fetching data from API...');
        const response = await fetch('http://localhost:5000/api/players');
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const players = await response.json();
        console.log('Data received:', players);
        
        // Process data for charts
        const data = processPlayersData(players);
        
        // Update stats cards
        document.getElementById('total-teams').textContent = data.total_teams;
        document.getElementById('total-matches').textContent = data.total_matches;
        document.getElementById('total-goals').textContent = data.total_goals;
        document.getElementById('total-assists').textContent = data.total_assists;

        // Update Age Distribution Chart
        updateAgeDistribution(data.age_distribution);
        
        // Update Position Distribution Chart
        updatePositionDistribution(data.position_distribution);
        
        // Update Goals vs Assists Chart
        updateGoalsAssists(players);
        
        // Update Accuracy by Position Chart
        updateAccuracyByPosition(data.accuracy_by_position);

    } catch (error) {
        console.error('Error fetching data:', error);
        document.body.innerHTML += `
            <div class="alert alert-danger" role="alert">
                Error loading data: ${error.message}
                <br>
                Make sure the Flask backend is running at http://localhost:5000
            </div>
        `;
    }
}

function processPlayersData(players) {
    // Calculate age distribution
    const age_distribution = {};
    const age_bins = [[18, 20], [21, 23], [24, 26], [27, 29], [30, 100]];
    const age_labels = ['18-20', '21-23', '24-26', '27-29', '30+'];
    
    players.forEach(player => {
        const age = player.Age;
        const binIndex = age_bins.findIndex(([min, max]) => age >= min && age <= max);
        if (binIndex !== -1) {
            const label = age_labels[binIndex];
            age_distribution[label] = (age_distribution[label] || 0) + 1;
        }
    });

    // Calculate position distribution
    const position_distribution = {};
    players.forEach(player => {
        position_distribution[player.Pos] = (position_distribution[player.Pos] || 0) + 1;
    });

    // Calculate accuracy by position
    const accuracy_by_position = {};
    const position_accuracy = {};
    const position_count = {};
    
    players.forEach(player => {
        if (!position_accuracy[player.Pos]) {
            position_accuracy[player.Pos] = 0;
            position_count[player.Pos] = 0;
        }
        position_accuracy[player.Pos] += player['PasTotCmp%'] || 0;
        position_count[player.Pos]++;
    });

    Object.keys(position_accuracy).forEach(pos => {
        accuracy_by_position[pos] = position_accuracy[pos] / position_count[pos];
    });

    // Calculate totals
    const total_teams = new Set(players.map(p => p.Squad)).size;
    const total_matches = players.reduce((sum, p) => sum + p.MP, 0);
    const total_goals = players.reduce((sum, p) => sum + p.Goals, 0);
    const total_assists = players.reduce((sum, p) => sum + p.Assists, 0);

    return {
        age_distribution,
        position_distribution,
        accuracy_by_position,
        total_teams,
        total_matches,
        total_goals,
        total_assists
    };
}

function updateChartType(chartId, newType) {
    let chart;
    switch(chartId) {
        case 'age':
            chart = ageChart;
            break;
        case 'position':
            chart = positionChart;
            break;
        case 'goals-assists':
            chart = goalsAssistsChart;
            break;
        case 'accuracy':
            chart = accuracyChart;
            break;
    }

    if (chart) {
        const data = chart.data;
        const options = chart.options;
        chart.destroy();
        
        const ctx = chart.canvas.getContext('2d');
        chart = new Chart(ctx, {
            type: newType,
            data: data,
            options: options
        });
    }
}

function updateAgeDistribution(data) {
    ageChart.data.labels = Object.keys(data);
    ageChart.data.datasets[0].data = Object.values(data);
    ageChart.update();
}

function updatePositionDistribution(data) {
    positionChart.data.labels = Object.keys(data);
    positionChart.data.datasets[0].data = Object.values(data);
    positionChart.update();
}

function updateGoalsAssists(data) {
    const chartData = data.map(player => ({
        x: player.Goals,
        y: player.Assists
    }));
    goalsAssistsChart.data.datasets[0].data = chartData;
    goalsAssistsChart.update();
}

function updateAccuracyByPosition(data) {
    accuracyChart.data.labels = Object.keys(data);
    accuracyChart.data.datasets[0].data = Object.values(data);
    accuracyChart.update();
} 