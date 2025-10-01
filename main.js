/**
 * Main Dashboard Logic
 * Handles navigation, UI updates, and data visualization.
 */

document.addEventListener('DOMContentLoaded', () => {
    // Initialize all dashboard components. Each is wrapped in a try...catch
    // to ensure that a failure in one part does not break the entire application,
    // especially the navigation.

    try {
        setupNavigation(); // CRITICAL: This makes the menu work.
    } catch (error) {
        console.error("Error setting up navigation:", error);
        alert("Fatal Error: Could not set up page navigation.");
    }

    try {
        updateTimeMetrics();
    } catch (error) {
        console.error("Error updating time metrics:", error);
    }

    try {
        // This function will eventually fetch live data from Firestore.
        // For now, it uses mock data for display.
        initializeMetrics();
    } catch (error) {
        console.error("Error initializing metrics:", error);
    }
});


// --- Core Navigation ---

/**
 * Sets up the single-page navigation for the dashboard sections.
 * This is the fix for the user's issue where menus were not working.
 */
function setupNavigation() {
    const navLinks = document.querySelectorAll(".sub-nav a");

    navLinks.forEach(link => {
        link.addEventListener("click", function(e) {
            const targetHref = this.getAttribute("href");

            // Allow links to other pages (like admin.html) to work normally
            if (targetHref.endsWith('.html')) {
                return;
            }

            e.preventDefault(); // Prevent default for #hash links

            // Update active link in the navigation bar
            navLinks.forEach(navLink => navLink.classList.remove("active"));
            this.classList.add("active");

            // Hide all dashboard sections
            document.querySelectorAll(".dashboard-section").forEach(section => {
                section.classList.add("hidden");
            });

            // Show the target section
            const targetSection = document.querySelector(targetHref);
            if (targetSection) {
                targetSection.classList.remove("hidden");
            }
        });
    });
}

// --- Data and Metric Initialization ---

// Mock data is used for display purposes until live data is integrated.
const mockDashboardState = {
    salesData: {
        'this-month': {
            monthlyTarget: 240, mtdActual: 1, dailyTarget: 7, yesterdaySales: 0, todaySales: 1,
            chartData: [0, 0, 0, 1, 1, 1, 1]
        },
        'last-month': {
            monthlyTarget: 200, mtdActual: 180, dailyTarget: 6.5, yesterdaySales: 10, todaySales: 0,
            chartData: [5, 10, 15, 30, 75, 120, 180]
        }
    },
    stock: { inHand: 98, sold: 2, noPackage: 1 },
    currentFilter: 'this-month',
    charts: {}
};

/**
 * Initializes and updates all visible metrics and charts.
 */
function initializeMetrics() {
    const state = mockDashboardState; // Will be replaced with live data

    // Setup month filter buttons
    document.querySelectorAll('.month-filter-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            state.currentFilter = this.getAttribute('data-month');
            updateSalesMetrics(state);

            // Update active button style
            document.querySelectorAll('.month-filter-btn').forEach(b => b.classList.remove('active-filter-btn'));
            this.classList.add('active-filter-btn');
        });
    });

    // Initial render
    updateSalesMetrics(state);
    initStockBreakdownChart(state);
}

/**
 * Updates all sales-related cards and charts based on the current state.
 * @param {object} state - The dashboard's current state.
 */
function updateSalesMetrics(state) {
    const sales = state.salesData[state.currentFilter];

    document.getElementById('monthly-label').textContent = state.currentFilter === 'this-month' ? "This Month's" : "Last Month's";
    document.getElementById('yesterday-sales').textContent = sales.yesterdaySales;
    document.getElementById('today-sales').textContent = sales.todaySales;
    document.getElementById('daily-target').textContent = sales.dailyTarget;
    document.getElementById('monthly-target').textContent = sales.monthlyTarget;
    document.getElementById('mtd-actual').textContent = sales.mtdActual;

    const performance = sales.mtdActual / (sales.monthlyTarget / 30 * (new Date().getDate())) * 100 || 0;
    document.getElementById('mtd-target-vs-actual-percent').textContent = `${performance.toFixed(0)}%`;
    document.getElementById('mtd-performance-bar').style.width = `${Math.min(performance, 100)}%`;

    updateSalesGrowthChart(state);
}

// --- UI Update Functions ---

/**
 * Updates time-related metrics (Date, Working Days).
 */
function updateTimeMetrics() {
    const now = new Date();
    document.getElementById('date').textContent = now.toLocaleDateString('en-US', {
        weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
    });

    const year = now.getFullYear();
    const month = now.getMonth();
    const today = now.getDate();
    let daysWorked = 0;
    for (let i = 1; i < today; i++) {
        if (new Date(year, month, i).getDay() % 6 !== 0) daysWorked++;
    }
    document.getElementById('days-worked').textContent = daysWorked;
}


// --- Charting Functions ---

/**
 * Initializes or updates the Sales Growth Line Chart.
 * @param {object} state - The dashboard's current state.
 */
function updateSalesGrowthChart(state) {
    const sales = state.salesData[state.currentFilter];
    const ctx = document.getElementById('salesGrowthChart').getContext('2d');

    if (state.charts.salesGrowth) {
        state.charts.salesGrowth.data.datasets[0].data = sales.chartData;
        state.charts.salesGrowth.update();
    } else {
        state.charts.salesGrowth = new Chart(ctx, {
            type: 'line',
            data: {
                labels: Array.from({ length: sales.chartData.length }, (_, i) => `Day ${i + 1}`),
                datasets: [{
                    label: 'Actual MTD Sales',
                    data: sales.chartData,
                    borderColor: '#10b981',
                    backgroundColor: 'rgba(16, 185, 129, 0.1)',
                    tension: 0.4,
                    fill: true,
                }]
            },
            options: {
                responsive: true, maintainAspectRatio: false,
                plugins: { legend: { labels: { color: '#9ca3af' } } },
                scales: {
                    y: { beginAtZero: true, grid: { color: '#374151' }, ticks: { color: '#9ca3af' } },
                    x: { grid: { display: false }, ticks: { color: '#9ca3af' } }
                }
            }
        });
    }
}

/**
 * Initializes the Stock Breakdown Doughnut Chart.
 * @param {object} state - The dashboard's current state.
 */
function initStockBreakdownChart(state) {
    const stock = state.stock;
    const ctx = document.getElementById('stockBreakdownChart').getContext('2d');

    if (!state.charts.stockBreakdown) {
        state.charts.stockBreakdown = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: ['Stock In Hand', 'Stock Sold', 'No Package Stock'],
                datasets: [{
                    data: [stock.inHand, stock.sold, stock.noPackage],
                    backgroundColor: ['#10b981', '#f59e0b', '#ef4444'],
                    borderWidth: 0
                }]
            },
            options: {
                responsive: true, maintainAspectRatio: false, cutout: '70%',
                plugins: { legend: { position: 'right', labels: { color: '#9ca3af' } } }
            }
        });
    }
}