document.addEventListener('DOMContentLoaded', () => {
    const TIMEZONE = 'Asia/Karachi';

    let state = {
        personnel: { captains: [], des: [], teamLeaders: [] },
        salesLog: [],
        time: { allWorkingDays: 0, pastWorkingDays: 0, remainingWorkingDays: 0, todayStr: '' },
        ui: { currentDashboard: 'main-dashboard' },
        subscriptions: []
    };

    function init() {
        supabaseClient.auth.onAuthStateChange((event, session) => {
            updateUIBasedOnAuth(session?.user);
            if (session?.user) {
                startDataPipeline();
                setupNavigation();
                setupMobileMenu();
            } else {
                document.getElementById('dashboard-content').innerHTML = '<p class="p-4">Please log in to view the dashboard.</p>';
            }
        });
    }

    async function startDataPipeline() {
        await fetchAllData();
        setupRealtimeListeners();
        await loadDashboard(state.ui.currentDashboard);
    }

    function setupRealtimeListeners() {
        state.subscriptions.forEach(sub => supabaseClient.removeChannel(sub));
        state.subscriptions = [];

        const captainsChannel = supabaseClient
            .channel('captains-changes')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'captains' }, async () => {
                console.log('Change detected in captains. Rerunning data pipeline.');
                await fetchAllData();
                processAndRender();
            })
            .subscribe();

        const desChannel = supabaseClient
            .channel('des-changes')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'distribution_executives' }, async () => {
                console.log('Change detected in distribution_executives. Rerunning data pipeline.');
                await fetchAllData();
                processAndRender();
            })
            .subscribe();

        const teamLeadersChannel = supabaseClient
            .channel('teamleaders-changes')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'team_leaders' }, async () => {
                console.log('Change detected in team_leaders. Rerunning data pipeline.');
                await fetchAllData();
                processAndRender();
            })
            .subscribe();

        const salesLogChannel = supabaseClient
            .channel('saleslog-changes')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'sales_log' }, async () => {
                console.log('Change detected in sales_log. Rerunning data pipeline.');
                await fetchAllData();
                processAndRender();
            })
            .subscribe();

        state.subscriptions = [captainsChannel, desChannel, teamLeadersChannel, salesLogChannel];
    }

    async function fetchAllData() {
        try {
            const [captainsRes, desRes, teamLeadersRes, salesLogRes] = await Promise.all([
                supabaseClient.from('captains').select('*'),
                supabaseClient.from('distribution_executives').select('*'),
                supabaseClient.from('team_leaders').select('*'),
                supabaseClient.from('sales_log').select('*')
            ]);

            state.personnel.captains = captainsRes.data || [];
            state.personnel.des = desRes.data || [];
            state.personnel.teamLeaders = teamLeadersRes.data || [];
            state.salesLog = salesLogRes.data || [];

        } catch (error) {
            console.error("FATAL: Could not fetch critical data:", error);
        }
    }

    function processAndRender() {
        calculateTimeMetrics();
        const calculatedData = calculateAllMetrics();
        renderAllDashboards(calculatedData);
    }

    function calculateTimeMetrics() {
        const now = new Date();
        const todayStr = new Intl.DateTimeFormat('sv-SE', { timeZone: TIMEZONE }).format(now);
        const todayDate = now.getDate();
        const year = now.getFullYear();
        const month = now.getMonth();
        const totalDaysInMonth = new Date(year, month + 1, 0).getDate();

        let all = 0, past = 0, remaining = 0;
        for (let i = 1; i <= totalDaysInMonth; i++) {
            const loopDate = new Date(year, month, i);
            if (loopDate.getDay() !== 0) {
                all++;
                if (i <= todayDate) past++;
                else remaining++;
            }
        }
        state.time = { allWorkingDays: all, pastWorkingDays: past, remainingWorkingDays: remaining, todayStr };
    }

    function calculateAllMetrics() {
        const { captains, des, teamLeaders } = state.personnel;
        const { todayStr } = state.time;
        const yesterdayStr = new Intl.DateTimeFormat('sv-SE', { timeZone: TIMEZONE }).format(new Date(Date.now() - 86400000));
        const currentMonthStr = todayStr.substring(0, 7);

        const personnelMetrics = {};
        [...captains, ...des].forEach(p => {
            personnelMetrics[p.id] = {
                mtd_sales: 0,
                today_sales: 0,
                yesterday_sales: 0,
                ...p
            };
        });

        let totalMtdSales = 0, totalTodaySales = 0, totalYesterdaySales = 0;

        state.salesLog.forEach(logEntry => {
            const date = logEntry.sale_date;
            const monthOfDate = date.substring(0, 7);
            const personId = logEntry.person_id;
            const sale = Number(logEntry.sales_amount) || 0;

            if (personnelMetrics[personId]) {
                if (monthOfDate === currentMonthStr) {
                    personnelMetrics[personId].mtd_sales += sale;
                    totalMtdSales += sale;
                }
                if (date === todayStr) {
                    personnelMetrics[personId].today_sales += sale;
                    totalTodaySales += sale;
                }
                if (date === yesterdayStr) {
                    personnelMetrics[personId].yesterday_sales += sale;
                    totalYesterdaySales += sale;
                }
            }
        });

        const teamLeaderMetrics = teamLeaders.map(tl => {
            const clusterCaptains = captains.filter(c => c.cluster === tl.cluster);
            const clusterCaptainIds = clusterCaptains.map(c => c.id);

            const mtd_sales = clusterCaptainIds.reduce((sum, id) => sum + (personnelMetrics[id]?.mtd_sales || 0), 0);
            const yesterday_sales = clusterCaptainIds.reduce((sum, id) => sum + (personnelMetrics[id]?.yesterday_sales || 0), 0);
            const monthly_sales_target = clusterCaptains.reduce((sum, c) => sum + (c.monthly_sales_target || 0), 0);

            return { ...tl, mtd_sales, yesterday_sales, monthly_sales_target };
        });

        return { personnel: Object.values(personnelMetrics), teamLeaders: teamLeaderMetrics, totalMtdSales, totalTodaySales, totalYesterdaySales };
    }

    function renderAllDashboards(data) {
        const dashboard = state.ui.currentDashboard;
        if (dashboard === 'daily-sales') return;

        updateGlobalKPIs(state.time);

        const renderMap = {
            'main-dashboard': () => renderMainDashboard(data),
            'captain-dashboard': () => renderPersonnelDashboard('captain', data.personnel.filter(p => p.captain_name)),
            'de-dashboard': () => renderPersonnelDashboard('de', data.personnel.filter(p => p.de_name)),
            'dsr-dashboard': () => renderPersonnelDashboard('dsr', data.personnel.filter(p => p.de_name)),
            'teamleader-dashboard': () => renderPersonnelDashboard('teamleader', data.teamLeaders)
        };

        if (renderMap[dashboard]) {
            renderMap[dashboard]();
        }
    }

    function renderMainDashboard(data) {
        const { totalMtdSales, totalTodaySales, totalYesterdaySales } = data;
        const totalTarget = [...state.personnel.captains, ...state.personnel.des].reduce((sum, p) => sum + (p.monthly_sales_target || 0), 0);
        const { allWorkingDays, pastWorkingDays, remainingWorkingDays } = state.time;

        const dailyTarget = allWorkingDays > 0 ? totalTarget / allWorkingDays : 0;
        const mtdTarget = dailyTarget * pastWorkingDays;
        const performance = mtdTarget > 0 ? (totalMtdSales / mtdTarget) * 100 : 0;
        const gap = totalMtdSales - mtdTarget;
        const rrr = remainingWorkingDays > 0 ? (totalTarget - totalMtdSales) / remainingWorkingDays : 0;

        setElText('total-mtd-sales', totalMtdSales.toFixed(0));
        setElText('today-sales', totalTodaySales.toFixed(0));
        setElText('yesterday-sales', totalYesterdaySales.toFixed(0));
        setElText('total-monthly-target', totalTarget.toFixed(0));
        setElText('mtd-target', mtdTarget.toFixed(0));
        setElText('mtd-actual-vs-mtd-target', `${performance.toFixed(2)}%`);
        setElStyle('mtd-performance-bar', 'width', `${Math.min(performance, 100)}%`);
        setElText('gap-vs-mtd-target', gap.toFixed(0));
        setElText('required-running-rate', rrr.toFixed(0));
    }

    function renderPersonnelDashboard(type, personnelData) {
        const container = document.getElementById(`${type}-container`);
        if (!container) return;
        container.innerHTML = '';
        personnelData.forEach(p => container.appendChild(createPerformanceCard(p)));

        const totalMtd = personnelData.reduce((s, p) => s + (p.mtd_sales || 0), 0);
        const totalTarget = personnelData.reduce((s, p) => s + (p.monthly_sales_target || 0), 0);
        const { allWorkingDays, pastWorkingDays, remainingWorkingDays } = state.time;
        const dailyTarget = allWorkingDays > 0 ? totalTarget / allWorkingDays : 0;
        const mtdTarget = dailyTarget * pastWorkingDays;
        const perf = mtdTarget > 0 ? (totalMtd / mtdTarget) * 100 : 0;
        const rrr = remainingWorkingDays > 0 ? (totalTarget - totalMtd) / remainingWorkingDays : 0;
        const gap = totalMtd - mtdTarget;

        const safeType = type.replace(/s$/, '');
        setElText(`${safeType}-monthly-target`, totalTarget.toFixed(0));
        setElText(`${safeType}-mtd-sales`, totalMtd.toFixed(0));
        setElText(`${safeType}-rrr`, rrr.toFixed(0));
        setElText(`${safeType}-gap`, gap.toFixed(0));
        setElText(`${safeType}-performance`, `${perf.toFixed(2)}%`);
        setElStyle(`${safeType}-performance-bar`, 'width', `${Math.min(perf, 100)}%`);
        setElText(`${safeType}-mtd-target`, mtdTarget.toFixed(0));
    }

    function createPerformanceCard(pData) {
        const card = document.createElement('div');
        card.className = 'card';
        const name = pData.tl_name || pData.captain_name || pData.de_name || 'N/A';
        const mtd = pData.mtd_sales || 0;
        const target = pData.monthly_sales_target || 0;
        const ySales = pData.yesterday_sales || 0;
        const achievement = target > 0 ? (mtd / target) * 100 : 0;

        card.innerHTML = `
            <div class="card-header"><p class="font-bold">${name}</p><p class="text-sm text-gray-400">${pData.cluster || ''} | Yesterday: ${ySales.toFixed(0)}</p></div>
            <div class="kpi-grid-condensed">
                <div><p>Target:</p><p>${target.toFixed(0)}</p></div>
                <div><p>MTD:</p><p>${mtd.toFixed(0)}</p></div>
                <div><p>Ach%:</p><p>${achievement.toFixed(1)}%</p></div>
            </div>`;
        return card;
    }

    function updateGlobalKPIs({ allWorkingDays, remainingWorkingDays, todayStr }) {
        setElText('current-date', todayStr);
        setElText('working-days', allWorkingDays);
        setElText('remaining-days', remainingWorkingDays);
    }

    function getDailySalesHTML() {
        return `<div class="container mx-auto p-4"><div class="flex justify-between items-center mb-4"><h1 class="text-2xl font-bold">Daily Sales Log</h1><button id="save-sales-log-btn" class="btn-primary">Save Changes</button></div><div id="daily-sales-grid-container" class="overflow-x-auto"></div></div>`;
    }

    async function renderSalesGrid() {
        const container = document.getElementById('daily-sales-grid-container');
        const saveBtn = document.getElementById('save-sales-log-btn');
        if (!container || !saveBtn) return;

        const allPersonnel = [...state.personnel.captains, ...state.personnel.des];
        const dates = getDatesForCurrentMonth();

        const salesMap = {};
        state.salesLog.forEach(log => {
            if (!salesMap[log.sale_date]) salesMap[log.sale_date] = {};
            salesMap[log.sale_date][log.person_id] = log.sales_amount;
        });

        let head = `<thead><tr><th class="sticky left-0 bg-gray-800 z-10">Date</th>${allPersonnel.map(p => `<th class="px-4 py-2">${p.captain_name || p.de_name}</th>`).join('')}</tr></thead>`;
        let body = `<tbody>`;
        dates.forEach(date => {
            body += `<tr><td class="sticky left-0 bg-gray-700 z-10 px-4 py-2">${date}</td>`;
            allPersonnel.forEach(p => {
                const personType = p.captain_name ? 'captain' : 'de';
                const saleValue = salesMap[date]?.[p.id] || '';
                body += `<td class="px-2 py-1"><input type="number" class="sales-input" data-date="${date}" data-person-id="${p.id}" data-person-type="${personType}" value="${saleValue}"></td>`;
            });
            body += `</tr>`;
        });
        body += `</tbody>`;
        container.innerHTML = `<table class="min-w-full divide-y divide-gray-700">${head}${body}</table>`;

        saveBtn.addEventListener('click', manualSaveSalesLog);
        container.addEventListener('input', (e) => {
            if (e.target.classList.contains('sales-input')) {
                saveBtn.classList.add('pulse');
            }
        });
    }

    async function manualSaveSalesLog() {
        const saveBtn = document.getElementById('save-sales-log-btn');
        if (!saveBtn.classList.contains('pulse')) return alert("No changes to save.");
        saveBtn.disabled = true; saveBtn.textContent = 'Saving...';

        const salesToUpsert = [];
        const salesToDelete = [];

        document.querySelectorAll('.sales-input').forEach(input => {
            const { date, personId, personType } = input.dataset;
            const value = parseFloat(input.value.trim());

            if (!isNaN(value) && value > 0) {
                salesToUpsert.push({
                    sale_date: date,
                    person_id: personId,
                    person_type: personType,
                    sales_amount: value
                });
            } else if (input.value.trim() === '') {
                salesToDelete.push({ sale_date: date, person_id: personId });
            }
        });

        try {
            if (salesToUpsert.length > 0) {
                await supabaseClient
                    .from('sales_log')
                    .upsert(salesToUpsert, { onConflict: 'sale_date,person_id' });
            }

            if (salesToDelete.length > 0) {
                for (const entry of salesToDelete) {
                    await supabaseClient
                        .from('sales_log')
                        .delete()
                        .eq('sale_date', entry.sale_date)
                        .eq('person_id', entry.person_id);
                }
            }

            saveBtn.classList.remove('pulse');
            alert('Sales log saved successfully!');
        } catch (error) {
            console.error("Error saving sales log:", error);
            alert('Failed to save sales log: ' + error.message);
        } finally {
            saveBtn.disabled = false; saveBtn.textContent = 'Save Changes';
        }
    }

    async function loadDashboard(dashboardName) {
        state.ui.currentDashboard = dashboardName;
        const dashboardContent = document.getElementById('dashboard-content');
        let htmlContent;

        try {
            if (dashboardName === 'daily-sales') {
                htmlContent = getDailySalesHTML();
            } else {
                const response = await fetch(`${dashboardName}.html`);
                if (!response.ok) throw new Error(`HTML not found for ${dashboardName}`);
                htmlContent = await response.text();
            }
            dashboardContent.innerHTML = htmlContent;

            if (dashboardName === 'daily-sales') {
                await renderSalesGrid();
            } else {
                processAndRender();
            }
        } catch (error) {
            console.error("Error loading dashboard view:", error);
            dashboardContent.innerHTML = `<p class="text-red-500">Error: Dashboard content could not be loaded.</p>`;
        }
    }

    function setupNavigation() {
        document.querySelector('.sub-nav').addEventListener('click', async (e) => {
            if (e.target.tagName === 'A') {
                e.preventDefault();
                const dashboardName = e.target.dataset.dashboard;
                if (dashboardName && dashboardName !== state.ui.currentDashboard) {
                    document.querySelectorAll('.sub-nav a').forEach(l => l.classList.remove('active'));
                    e.target.classList.add('active');
                    await loadDashboard(dashboardName);
                }
            }
        });
    }

    function getDatesForCurrentMonth() {
        const dates = [];
        const today = new Date();
        const y = today.getFullYear();
        const m = today.getMonth();
        const daysInMonth = new Date(y, m + 1, 0).getDate();
        for (let i = 1; i <= daysInMonth; i++) {
            dates.push(`${y}-${String(m + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`);
        }
        return dates;
    }

    function setElText(id, text) {
        const el = document.getElementById(id);
        if (el) el.textContent = text || '0'; else console.warn(`Element with id '${id}' not found`);
    }

    function setElStyle(id, property, value) {
        const el = document.getElementById(id);
        if (el) el.style[property] = value; else console.warn(`Element with id '${id}' not found`);
    }

    function updateUIBasedOnAuth(user) {
        document.getElementById('login-btn').classList.toggle('hidden', !!user);
        document.getElementById('logout-btn').classList.toggle('hidden', !user);
    }

    function setupMobileMenu() {
        const menuBtn = document.getElementById('menu-btn');
        const subNav = document.querySelector('.sub-nav');
        if (menuBtn && subNav) {
            menuBtn.addEventListener('click', () => subNav.classList.toggle('show'));
        }
    }

    init();
});
