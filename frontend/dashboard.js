// Check admin status and load data on page load
document.addEventListener('DOMContentLoaded', function() {
    checkAdminStatus();
    loadStats();
    initializeCharts();
    setupEventListeners();
});

// Setup Event Listeners
function setupEventListeners() {
    // Sidebar Toggle
    document.getElementById('openNav').addEventListener('click', function() {
        document.getElementById('sidebar').classList.toggle('active');
        
        // Resize charts when sidebar is toggled
        setTimeout(() => {
            window.dispatchEvent(new Event('resize'));
        }, 300);
    });

    // Close sidebar when clicking outside on mobile
    document.addEventListener('click', function(event) {
        const sidebar = document.getElementById('sidebar');
        const openBtn = document.getElementById('openNav');
        
        if (window.innerWidth <= 768 && 
            !sidebar.contains(event.target) && 
            event.target !== openBtn && 
            !openBtn.contains(event.target)) {
            sidebar.classList.remove('active');
            window.dispatchEvent(new Event('resize'));
        }
    });
}

// Load Stats from API
async function loadStats() {
    try {
        // Get overview stats (teams/matches)
        const overviewRes = await fetch('http://localhost:5000/api/stats/overview');
        const overviewData = await overviewRes.json();
        
        // Get general stats (goals/assists)
        const statsRes = await fetch('http://localhost:5000/api/stats');
        const statsData = await statsRes.json();
        
        // Update DOM
        document.getElementById('total-teams').textContent = overviewData.total_teams || 'N/A';
        document.getElementById('total-matches').textContent = overviewData.total_matches || 'N/A';
        document.getElementById('total-goals').textContent = statsData.total_goals || 'N/A';
        document.getElementById('total-assists').textContent = statsData.total_assists || 'N/A';
        
    } catch (error) {
        console.error("Failed to load stats:", error);
        showError('Failed to load statistics');
    }
}

// Initialize Charts
function initializeCharts() {
    // Age Distribution Chart
    const ageChart = new Chart(document.getElementById('ageChart'), {
        type: 'bar',
        data: {
            labels: ['18-20', '21-23', '24-26', '27-29', '30+'],
            datasets: [{
                label: 'Number of Players',
                data: [25, 68, 94, 52, 31],
                backgroundColor: 'rgba(54, 162, 235, 0.7)',
                borderColor: 'rgba(54, 162, 235, 1)',
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true
                }
            }
        }
    });

    // Position Distribution Chart
    const positionChart = new Chart(document.getElementById('positionChart'), {
        type: 'doughnut',
        data: {
            labels: ['Forwards', 'Midfielders', 'Defenders', 'Goalkeepers'],
            datasets: [{
                data: [72, 108, 72, 20],
                backgroundColor: [
                    'rgba(255, 99, 132, 0.7)',
                    'rgba(54, 162, 235, 0.7)',
                    'rgba(255, 206, 86, 0.7)',
                    'rgba(75, 192, 192, 0.7)'
                ],
                borderColor: [
                    'rgba(255, 99, 132, 1)',
                    'rgba(54, 162, 235, 1)',
                    'rgba(255, 206, 86, 1)',
                    'rgba(75, 192, 192, 1)'
                ],
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false
        }
    });

    // Goals vs Assists Chart
    const goalsAssistsChart = new Chart(document.getElementById('goalsAssistsChart'), {
        type: 'scatter',
        data: {
            datasets: [{
                label: 'Forwards',
                data: [
                    {x: 12, y: 4}, {x: 8, y: 2}, {x: 15, y: 3}, 
                    {x: 7, y: 5}, {x: 10, y: 1}, {x: 18, y: 2}
                ],
                backgroundColor: 'rgba(255, 99, 132, 0.7)'
            }, {
                label: 'Midfielders',
                data: [
                    {x: 5, y: 12}, {x: 3, y: 8}, {x: 2, y: 15}, 
                    {x: 6, y: 10}, {x: 4, y: 9}, {x: 1, y: 14}
                ],
                backgroundColor: 'rgba(54, 162, 235, 0.7)'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
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

    // Pass Accuracy Chart
    const accuracyChart = new Chart(document.getElementById('accuracyChart'), {
        type: 'bar',
        data: {
            labels: ['Forwards', 'Midfielders', 'Defenders', 'Goalkeepers'],
            datasets: [{
                label: 'Pass Accuracy %',
                data: [72, 86, 89, 65],
                backgroundColor: [
                    'rgba(255, 99, 132, 0.7)',
                    'rgba(54, 162, 235, 0.7)',
                    'rgba(255, 206, 86, 0.7)',
                    'rgba(75, 192, 192, 0.7)'
                ],
                borderColor: [
                    'rgba(255, 99, 132, 1)',
                    'rgba(54, 162, 235, 1)',
                    'rgba(255, 206, 86, 1)',
                    'rgba(75, 192, 192, 1)'
                ],
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true,
                    max: 100
                }
            }
        }
    });

    // Store chart instances for later use
    window.charts = {
        ageChart,
        positionChart,
        goalsAssistsChart,
        accuracyChart
    };

    // Resize charts when window is resized
    window.addEventListener('resize', function() {
        Object.values(window.charts).forEach(chart => {
            if (chart.resize) chart.resize();
        });
    });
}

// Admin Authentication Functions
function showLoginModal() {
    const loginModal = new bootstrap.Modal(document.getElementById('loginModal'));
    loginModal.show();
}

async function adminLogin() {
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;

    try {
        const response = await fetch('http://localhost:5000/api/admin/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ username, password }),
            credentials: 'include'
        });

        const data = await response.json();
        if (response.ok) {
            bootstrap.Modal.getInstance(document.getElementById('loginModal')).hide();
            showAdminControls();
            showSuccess('Login successful');
        } else {
            showError(data.error);
        }
    } catch (error) {
        showError('Login failed: ' + error.message);
    }
}

async function adminLogout() {
    try {
        const response = await fetch('http://localhost:5000/api/admin/logout', {
            method: 'POST',
            credentials: 'include'
        });

        if (response.ok) {
            hideAdminControls();
            showSuccess('Logout successful');
        }
    } catch (error) {
        showError('Logout failed: ' + error.message);
    }
}

async function checkAdminStatus() {
    try {
        const response = await fetch('http://localhost:5000/api/admin/check', {
            credentials: 'include'
        });
        const data = await response.json();
        
        if (data.is_admin) {
            showAdminControls();
        } else {
            hideAdminControls();
        }
    } catch (error) {
        console.error('Failed to check admin status:', error);
    }
}

// Admin UI Functions
function showAdminControls() {
    document.querySelector('.admin-section').style.display = 'block';
    document.getElementById('adminLoginBtn').style.display = 'none';
    document.getElementById('adminLogoutBtn').style.display = 'block';
}

function hideAdminControls() {
    document.querySelector('.admin-section').style.display = 'none';
    document.getElementById('adminLoginBtn').style.display = 'block';
    document.getElementById('adminLogoutBtn').style.display = 'none';
}

function toggleAdminDropdown() {
    const dropdown = document.getElementById('adminDropdown');
    dropdown.style.display = dropdown.style.display === 'none' ? 'block' : 'none';
}

// Player Management Functions
function showAddPlayerForm() {
    const modal = new bootstrap.Modal(document.getElementById('addPlayerModal'));
    modal.show();
}

async function addPlayer() {
    const form = document.getElementById('addPlayerForm');
    const formData = {
        Player: document.getElementById('playerName').value,
        Pos: document.getElementById('position').value,
        // Add other fields as needed
    };

    try {
        const response = await fetch('http://localhost:5000/api/admin/players', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(formData),
            credentials: 'include'
        });

        const data = await response.json();
        if (response.ok) {
            bootstrap.Modal.getInstance(document.getElementById('addPlayerModal')).hide();
            showSuccess('Player added successfully');
            loadDashboardData(); // Refresh dashboard data
        } else {
            showError(data.error);
        }
    } catch (error) {
        showError('Failed to add player: ' + error.message);
    }
}

// Dashboard Data Loading
async function loadDashboardData() {
    try {
        const response = await fetch('http://localhost:5000/api/stats/overview');
        const data = await response.json();
        
        // Update charts with the new data
        updateGoalsByPositionChart(data.goalsByPosition);
        updateTeamPerformanceChart(data.teamPerformance);
    } catch (error) {
        showError('Failed to load dashboard data: ' + error.message);
    }
}

// Chart Functions
function updateGoalsByPositionChart(data) {
    const ctx = document.getElementById('goalsByPosition').getContext('2d');
    new Chart(ctx, {
        type: 'bar',
        data: {
            labels: Object.keys(data),
            datasets: [{
                label: 'Goals',
                data: Object.values(data),
                backgroundColor: 'rgba(52, 152, 219, 0.8)',
                borderColor: 'rgba(52, 152, 219, 1)',
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true,
                    grid: {
                        color: 'rgba(255, 255, 255, 0.1)'
                    },
                    ticks: {
                        color: 'white'
                    }
                },
                x: {
                    grid: {
                        color: 'rgba(255, 255, 255, 0.1)'
                    },
                    ticks: {
                        color: 'white'
                    }
                }
            },
            plugins: {
                legend: {
                    labels: {
                        color: 'white'
                    }
                }
            }
        }
    });
}

function updateTeamPerformanceChart(data) {
    const ctx = document.getElementById('teamPerformance').getContext('2d');
    new Chart(ctx, {
        type: 'line',
        data: {
            labels: data.labels,
            datasets: [{
                label: 'Goals',
                data: data.goals,
                borderColor: 'rgba(46, 204, 113, 1)',
                backgroundColor: 'rgba(46, 204, 113, 0.1)',
                fill: true
            }, {
                label: 'Assists',
                data: data.assists,
                borderColor: 'rgba(231, 76, 60, 1)',
                backgroundColor: 'rgba(231, 76, 60, 0.1)',
                fill: true
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true,
                    grid: {
                        color: 'rgba(255, 255, 255, 0.1)'
                    },
                    ticks: {
                        color: 'white'
                    }
                },
                x: {
                    grid: {
                        color: 'rgba(255, 255, 255, 0.1)'
                    },
                    ticks: {
                        color: 'white'
                    }
                }
            },
            plugins: {
                legend: {
                    labels: {
                        color: 'white'
                    }
                }
            }
        }
    });
}

// Utility Functions
function showSuccess(message) {
    const alertDiv = document.createElement('div');
    alertDiv.className = 'alert alert-success alert-dismissible fade show';
    alertDiv.innerHTML = `
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    `;
    document.querySelector('.main-content').prepend(alertDiv);
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