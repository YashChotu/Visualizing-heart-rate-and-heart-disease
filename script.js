// Chart instances
let heartRateChart, ageRiskChart, timeSeriesChart, diseaseChart, liveChart, compareChart1, compareChart2;

// Global state
let allPatients = [];
let filteredPatients = [];
let previousDataset = null;
let monitorActive = false;
let monitorInterval = null;
let liveHeartRateData = [];
let snapshots = JSON.parse(localStorage.getItem('healthSnapshots') || '[]');
let soundEnabled = JSON.parse(localStorage.getItem('soundEnabled') || 'true');
let quickStatsCollapsed = false;

// Generate random patient data
function generatePatientData(count = 100) {
    const patients = [];
    for (let i = 1; i <= count; i++) {
        const age = Math.floor(Math.random() * 60) + 20; // 20-80 years
        const heartRate = Math.floor(Math.random() * 60) + 60; // 60-120 BPM
        const systolic = Math.floor(Math.random() * 60) + 100; // 100-160
        const diastolic = Math.floor(Math.random() * 30) + 60; // 60-90
        const cholesterol = Math.floor(Math.random() * 150) + 150; // 150-300
        
        // Calculate risk based on multiple factors
        let riskScore = 0;
        if (age > 60) riskScore += 2;
        else if (age > 45) riskScore += 1;
        if (heartRate > 100) riskScore += 2;
        else if (heartRate > 90) riskScore += 1;
        if (systolic > 140) riskScore += 2;
        else if (systolic > 130) riskScore += 1;
        if (cholesterol > 240) riskScore += 2;
        else if (cholesterol > 200) riskScore += 1;
        
        let riskLevel;
        if (riskScore >= 5) riskLevel = 'High';
        else if (riskScore >= 3) riskLevel = 'Medium';
        else riskLevel = 'Low';
        
        patients.push({
            id: i,
            age,
            heartRate,
            bloodPressure: `${systolic}/${diastolic}`,
            cholesterol,
            riskLevel
        });
    }
    return patients;
}

// Update statistics
function updateStats(patients) {
    const avgHeartRate = Math.round(
        patients.reduce((sum, p) => sum + p.heartRate, 0) / patients.length
    );
    const highRiskCount = patients.filter(p => p.riskLevel === 'High').length;
    const diseaseRiskPercent = Math.round((highRiskCount / patients.length) * 100);
    
    document.getElementById('avgHeartRate').textContent = avgHeartRate;
    document.getElementById('diseaseRisk').textContent = diseaseRiskPercent + '%';
    document.getElementById('totalPatients').textContent = patients.length;
    document.getElementById('highRisk').textContent = highRiskCount;
}

// Update patient table
function updateTable(patients) {
    const tbody = document.getElementById('tableBody');
    tbody.innerHTML = '';
    
    // Show first 10 patients
    patients.slice(0, 10).forEach(patient => {
        const row = tbody.insertRow();
        row.innerHTML = `
            <td>${patient.id}</td>
            <td>${patient.age}</td>
            <td>${patient.heartRate}</td>
            <td>${patient.bloodPressure}</td>
            <td>${patient.cholesterol}</td>
            <td class="risk-${patient.riskLevel.toLowerCase()}">${patient.riskLevel}</td>
            <td><button class="btn-action" onclick="viewPatientDetails(${patient.id})">View</button></td>
        `;
    });
    
    // Check for high-risk alerts
    const highRiskCount = patients.filter(p => p.riskLevel === 'High').length;
    if (highRiskCount > patients.length * 0.3) {
        showAlert(`High risk alert! ${highRiskCount} patients (${Math.round(highRiskCount/patients.length*100)}%) are in the high-risk category.`);
    }
}

// Create heart rate distribution chart
function createHeartRateChart(patients) {
    const ctx = document.getElementById('heartRateChart').getContext('2d');
    
    // Group heart rates into bins
    const bins = [0, 0, 0, 0, 0]; // <70, 70-80, 80-90, 90-100, >100
    patients.forEach(p => {
        if (p.heartRate < 70) bins[0]++;
        else if (p.heartRate < 80) bins[1]++;
        else if (p.heartRate < 90) bins[2]++;
        else if (p.heartRate < 100) bins[3]++;
        else bins[4]++;
    });
    
    if (heartRateChart) heartRateChart.destroy();
    
    heartRateChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: ['<70', '70-80', '80-90', '90-100', '>100'],
            datasets: [{
                label: 'Number of Patients',
                data: bins,
                backgroundColor: [
                    'rgba(75, 192, 192, 0.8)',
                    'rgba(54, 162, 235, 0.8)',
                    'rgba(255, 206, 86, 0.8)',
                    'rgba(255, 159, 64, 0.8)',
                    'rgba(255, 99, 132, 0.8)'
                ],
                borderColor: [
                    'rgba(75, 192, 192, 1)',
                    'rgba(54, 162, 235, 1)',
                    'rgba(255, 206, 86, 1)',
                    'rgba(255, 159, 64, 1)',
                    'rgba(255, 99, 132, 1)'
                ],
                borderWidth: 2
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        stepSize: 5
                    }
                }
            }
        }
    });
}

// Create age risk chart
function createAgeRiskChart(patients) {
    const ctx = document.getElementById('ageRiskChart').getContext('2d');
    
    const ageGroups = {
        '20-35': { low: 0, medium: 0, high: 0 },
        '36-50': { low: 0, medium: 0, high: 0 },
        '51-65': { low: 0, medium: 0, high: 0 },
        '66+': { low: 0, medium: 0, high: 0 }
    };
    
    patients.forEach(p => {
        let group;
        if (p.age <= 35) group = '20-35';
        else if (p.age <= 50) group = '36-50';
        else if (p.age <= 65) group = '51-65';
        else group = '66+';
        
        ageGroups[group][p.riskLevel.toLowerCase()]++;
    });
    
    if (ageRiskChart) ageRiskChart.destroy();
    
    ageRiskChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: Object.keys(ageGroups),
            datasets: [
                {
                    label: 'Low Risk',
                    data: Object.values(ageGroups).map(g => g.low),
                    backgroundColor: 'rgba(75, 192, 192, 0.8)'
                },
                {
                    label: 'Medium Risk',
                    data: Object.values(ageGroups).map(g => g.medium),
                    backgroundColor: 'rgba(255, 206, 86, 0.8)'
                },
                {
                    label: 'High Risk',
                    data: Object.values(ageGroups).map(g => g.high),
                    backgroundColor: 'rgba(255, 99, 132, 0.8)'
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            scales: {
                x: {
                    stacked: true
                },
                y: {
                    stacked: true,
                    beginAtZero: true
                }
            }
        }
    });
}

// Create time series chart
function createTimeSeriesChart() {
    const ctx = document.getElementById('timeSeriesChart').getContext('2d');
    
    // Generate time series data
    const hours = [];
    const heartRates = [];
    for (let i = 0; i < 24; i++) {
        hours.push(`${i}:00`);
        // Simulate circadian rhythm
        const base = 70;
        const variation = Math.sin((i - 6) * Math.PI / 12) * 15;
        heartRates.push(Math.round(base + variation + Math.random() * 10));
    }
    
    if (timeSeriesChart) timeSeriesChart.destroy();
    
    timeSeriesChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: hours,
            datasets: [{
                label: 'Average Heart Rate (BPM)',
                data: heartRates,
                borderColor: 'rgba(102, 126, 234, 1)',
                backgroundColor: 'rgba(102, 126, 234, 0.1)',
                fill: true,
                tension: 0.4,
                borderWidth: 3
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            scales: {
                y: {
                    beginAtZero: false,
                    min: 50,
                    max: 110
                }
            }
        }
    });
}

// Create disease prevalence chart
function createDiseaseChart(patients) {
    const ctx = document.getElementById('diseaseChart').getContext('2d');
    
    const riskCounts = {
        Low: patients.filter(p => p.riskLevel === 'Low').length,
        Medium: patients.filter(p => p.riskLevel === 'Medium').length,
        High: patients.filter(p => p.riskLevel === 'High').length
    };
    
    if (diseaseChart) diseaseChart.destroy();
    
    diseaseChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['Low Risk', 'Medium Risk', 'High Risk'],
            datasets: [{
                data: Object.values(riskCounts),
                backgroundColor: [
                    'rgba(75, 192, 192, 0.8)',
                    'rgba(255, 206, 86, 0.8)',
                    'rgba(255, 99, 132, 0.8)'
                ],
                borderColor: [
                    'rgba(75, 192, 192, 1)',
                    'rgba(255, 206, 86, 1)',
                    'rgba(255, 99, 132, 1)'
                ],
                borderWidth: 2
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: {
                    position: 'bottom'
                }
            }
        }
    });
}

// Initialize dashboard
function initializeDashboard() {
    const patients = generatePatientData(100);
    allPatients = patients;
    filteredPatients = patients;
    updateStats(patients);
    updateTable(patients);
    createHeartRateChart(patients);
    createAgeRiskChart(patients);
    createTimeSeriesChart();
    createDiseaseChart(patients);
    updateQuickStats(patients);
}

// Dark Mode Toggle
function toggleDarkMode() {
    document.body.classList.toggle('dark-mode');
    const isDark = document.body.classList.contains('dark-mode');
    document.getElementById('darkModeToggle').textContent = isDark ? '☀️' : '🌙';
    localStorage.setItem('darkMode', isDark);
}

// Export to CSV
function exportToCSV() {
    let csv = 'Patient ID,Age,Heart Rate,Blood Pressure,Cholesterol,Risk Level\\n';
    allPatients.forEach(p => {
        csv += `${p.id},${p.age},${p.heartRate},${p.bloodPressure},${p.cholesterol},${p.riskLevel}\\n`;
    });
    
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `heart_data_${Date.now()}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
}

// Export to PDF
function exportToPDF() {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    
    doc.setFontSize(20);
    doc.text('Heart Rate & Disease Report', 20, 20);
    
    doc.setFontSize(12);
    doc.text(`Date: ${new Date().toLocaleDateString()}`, 20, 35);
    doc.text(`Total Patients: ${allPatients.length}`, 20, 45);
    
    const avgHR = Math.round(allPatients.reduce((sum, p) => sum + p.heartRate, 0) / allPatients.length);
    const highRisk = allPatients.filter(p => p.riskLevel === 'High').length;
    
    doc.text(`Average Heart Rate: ${avgHR} BPM`, 20, 55);
    doc.text(`High Risk Patients: ${highRisk}`, 20, 65);
    
    doc.setFontSize(14);
    doc.text('Patient Data Sample:', 20, 80);
    
    let y = 90;
    doc.setFontSize(10);
    allPatients.slice(0, 20).forEach((p, i) => {
        doc.text(`${p.id}. Age: ${p.age}, HR: ${p.heartRate}, BP: ${p.bloodPressure}, Risk: ${p.riskLevel}`, 20, y);
        y += 8;
        if (y > 270) return;
    });
    
    doc.save(`heart_report_${Date.now()}.pdf`);
}

// Alert System
function showAlert(message) {
    const alertSystem = document.getElementById('alertSystem');
    const alertMessage = document.getElementById('alertMessage');
    alertMessage.textContent = message;
    alertSystem.style.display = 'block';
    
    setTimeout(() => {
        alertSystem.style.display = 'none';
    }, 10000);
}

// Real-time Heart Rate Monitor
function toggleMonitor() {
    monitorActive = !monitorActive;
    const btn = document.getElementById('toggleMonitor');
    
    if (monitorActive) {
        btn.textContent = 'Stop Monitor';
        btn.style.background = '#ff4444';
        btn.style.color = 'white';
        startLiveMonitor();
    } else {
        btn.textContent = 'Start Monitor';
        btn.style.background = 'white';
        btn.style.color = '#ff6b6b';
        stopLiveMonitor();
    }
}

function startLiveMonitor() {
    liveHeartRateData = Array(30).fill(75);
    createLiveChart();
    
    monitorInterval = setInterval(() => {
        const newRate = Math.floor(Math.random() * 40) + 60;
        liveHeartRateData.push(newRate);
        if (liveHeartRateData.length > 30) liveHeartRateData.shift();
        
        document.getElementById('liveBPM').textContent = newRate;
        updateLiveChart();
        
        if (newRate > 100) {
            showAlert(`Warning: Heart rate elevated to ${newRate} BPM!`);
        }
    }, 1000);
}

function stopLiveMonitor() {
    if (monitorInterval) {
        clearInterval(monitorInterval);
        monitorInterval = null;
    }
}

function createLiveChart() {
    const ctx = document.getElementById('liveChart').getContext('2d');
    if (liveChart) liveChart.destroy();
    
    liveChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: Array(30).fill(''),
            datasets: [{
                data: liveHeartRateData,
                borderColor: 'rgba(255, 255, 255, 0.9)',
                backgroundColor: 'rgba(255, 255, 255, 0.1)',
                fill: true,
                tension: 0.4,
                borderWidth: 2,
                pointRadius: 0
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: {
                x: { display: false },
                y: { display: false, min: 50, max: 120 }
            },
            animation: { duration: 0 }
        }
    });
}

function updateLiveChart() {
    if (liveChart) {
        liveChart.data.datasets[0].data = liveHeartRateData;
        liveChart.update('none');
    }
}

// Filter and Search
function filterPatients() {
    const searchTerm = document.getElementById('searchInput').value.toLowerCase();
    const riskFilter = document.getElementById('riskFilter').value;
    const ageFilter = document.getElementById('ageFilter').value;
    
    filteredPatients = allPatients.filter(p => {
        const matchSearch = searchTerm === '' || 
            p.id.toString().includes(searchTerm) ||
            p.age.toString().includes(searchTerm) ||
            p.riskLevel.toLowerCase().includes(searchTerm);
            
        const matchRisk = riskFilter === 'all' || p.riskLevel === riskFilter;
        
        let matchAge = true;
        if (ageFilter !== 'all') {
            if (ageFilter === '20-35') matchAge = p.age >= 20 && p.age <= 35;
            else if (ageFilter === '36-50') matchAge = p.age >= 36 && p.age <= 50;
            else if (ageFilter === '51-65') matchAge = p.age >= 51 && p.age <= 65;
            else if (ageFilter === '66+') matchAge = p.age >= 66;
        }
        
        return matchSearch && matchRisk && matchAge;
    });
    
    updateTable(filteredPatients);
    updateStats(filteredPatients);
}

// Patient Details Modal
function viewPatientDetails(patientId) {
    const patient = allPatients.find(p => p.id === patientId);
    if (!patient) return;
    
    const modal = document.getElementById('patientModal');
    const modalBody = document.getElementById('modalBody');
    
    modalBody.innerHTML = `
        <div class="patient-detail">
            <div class="detail-item"><strong>Patient ID:</strong> ${patient.id}</div>
            <div class="detail-item"><strong>Age:</strong> ${patient.age} years</div>
            <div class="detail-item"><strong>Heart Rate:</strong> ${patient.heartRate} BPM</div>
            <div class="detail-item"><strong>Blood Pressure:</strong> ${patient.bloodPressure}</div>
            <div class="detail-item"><strong>Cholesterol:</strong> ${patient.cholesterol} mg/dL</div>
            <div class="detail-item"><strong>Risk Level:</strong> <span class="risk-${patient.riskLevel.toLowerCase()}">${patient.riskLevel}</span></div>
        </div>
        <div style="margin-top: 20px;">
            <h3>Risk Assessment</h3>
            <p>${getRiskAssessment(patient)}</p>
        </div>
    `;
    
    modal.style.display = 'block';
}

function getRiskAssessment(patient) {
    let assessment = [];
    
    if (patient.age > 60) assessment.push('Advanced age increases cardiovascular risk');
    if (patient.heartRate > 100) assessment.push('Elevated resting heart rate detected');
    const [systolic] = patient.bloodPressure.split('/').map(Number);
    if (systolic > 140) assessment.push('High blood pressure (hypertension)');
    if (patient.cholesterol > 240) assessment.push('High cholesterol levels');
    
    if (assessment.length === 0) {
        return 'Patient shows normal vital signs with low cardiovascular risk.';
    }
    
    return 'Risk Factors: ' + assessment.join('. ') + '.';
}

// Data Comparison
function compareData() {
    if (!previousDataset) {
        previousDataset = allPatients;
        showAlert('First dataset saved. Generate new data and click Compare again.');
        return;
    }
    
    const modal = document.getElementById('compareModal');
    modal.style.display = 'block';
    
    createComparisonCharts();
}

function createComparisonCharts() {
    const ctx1 = document.getElementById('compareChart1').getContext('2d');
    const ctx2 = document.getElementById('compareChart2').getContext('2d');
    
    const getRiskCounts = (patients) => ({
        Low: patients.filter(p => p.riskLevel === 'Low').length,
        Medium: patients.filter(p => p.riskLevel === 'Medium').length,
        High: patients.filter(p => p.riskLevel === 'High').length
    });
    
    const currentRisk = getRiskCounts(allPatients);
    const previousRisk = getRiskCounts(previousDataset);
    
    if (compareChart1) compareChart1.destroy();
    if (compareChart2) compareChart2.destroy();
    
    const chartConfig = (data, title) => ({
        type: 'pie',
        data: {
            labels: ['Low Risk', 'Medium Risk', 'High Risk'],
            datasets: [{
                data: Object.values(data),
                backgroundColor: ['rgba(75, 192, 192, 0.8)', 'rgba(255, 206, 86, 0.8)', 'rgba(255, 99, 132, 0.8)']
            }]
        },
        options: {
            responsive: true,
            plugins: { title: { display: true, text: title } }
        }
    });
    
    compareChart1 = new Chart(ctx1, chartConfig(currentRisk, `Avg HR: ${Math.round(allPatients.reduce((s,p) => s + p.heartRate, 0) / allPatients.length)} BPM`));
    compareChart2 = new Chart(ctx2, chartConfig(previousRisk, `Avg HR: ${Math.round(previousDataset.reduce((s,p) => s + p.heartRate, 0) / previousDataset.length)} BPM`));
}

// Event listeners
document.getElementById('generateBtn').addEventListener('click', () => {
    previousDataset = allPatients;
    initializeDashboard();
});

document.getElementById('resetBtn').addEventListener('click', () => {
    initializeDashboard();
});

document.getElementById('darkModeToggle').addEventListener('click', toggleDarkMode);
document.getElementById('exportCSV').addEventListener('click', exportToCSV);
document.getElementById('exportPDF').addEventListener('click', exportToPDF);
document.getElementById('toggleMonitor').addEventListener('click', toggleMonitor);
document.getElementById('compareBtn').addEventListener('click', compareData);

document.getElementById('searchInput').addEventListener('input', filterPatients);
document.getElementById('riskFilter').addEventListener('change', filterPatients);
document.getElementById('ageFilter').addEventListener('change', filterPatients);

document.getElementById('closeAlert').addEventListener('click', () => {
    document.getElementById('alertSystem').style.display = 'none';
});

// Modal close handlers
document.querySelector('.modal-close').addEventListener('click', () => {
    document.getElementById('patientModal').style.display = 'none';
});

document.querySelector('.modal-close-compare').addEventListener('click', () => {
    document.getElementById('compareModal').style.display = 'none';
});

window.addEventListener('click', (e) => {
    const patientModal = document.getElementById('patientModal');
    const compareModal = document.getElementById('compareModal');
    if (e.target === patientModal) patientModal.style.display = 'none';
    if (e.target === compareModal) compareModal.style.display = 'none';
});

// Update Quick Stats Widget
function updateQuickStats(patients) {
    const lowRisk = patients.filter(p => p.riskLevel === 'Low').length;
    const medRisk = patients.filter(p => p.riskLevel === 'Medium').length;
    const highRisk = patients.filter(p => p.riskLevel === 'High').length;
    
    document.getElementById('quickLowRisk').textContent = lowRisk;
    document.getElementById('quickMedRisk').textContent = medRisk;
    document.getElementById('quickHighRisk').textContent = highRisk;
    
    // Calculate trend
    if (previousDataset) {
        const prevHighRisk = previousDataset.filter(p => p.riskLevel === 'High').length;
        const trend = highRisk > prevHighRisk ? '↑ Increasing' : highRisk < prevHighRisk ? '↓ Decreasing' : 'Stable';
        document.getElementById('quickTrend').textContent = trend;
    }
}

// Toggle Quick Stats Widget
document.getElementById('toggleQuickStats').addEventListener('click', () => {
    quickStatsCollapsed = !quickStatsCollapsed;
    const content = document.getElementById('quickStatsContent');
    const btn = document.getElementById('toggleQuickStats');
    
    if (quickStatsCollapsed) {
        content.classList.add('collapsed');
        btn.textContent = '+';
    } else {
        content.classList.remove('collapsed');
        btn.textContent = '−';
    }
});

// Print Dashboard
function printDashboard() {
    window.print();
}

// Download Charts as Images
async function downloadCharts() {
    const charts = document.querySelectorAll('.chart-container canvas');
    const zip = [];
    
    for (let i = 0; i < charts.length; i++) {
        const canvas = charts[i];
        const dataURL = canvas.toDataURL('image/png');
        const link = document.createElement('a');
        link.download = `chart_${i + 1}_${Date.now()}.png`;
        link.href = dataURL;
        link.click();
        
        await new Promise(resolve => setTimeout(resolve, 200));
    }
    
    showAlert('All charts downloaded successfully!');
}

// Fullscreen Mode
function toggleFullscreen() {
    if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen();
        document.body.classList.add('fullscreen-mode');
    } else {
        document.exitFullscreen();
        document.body.classList.remove('fullscreen-mode');
    }
}

// Sound Toggle
function toggleSound() {
    soundEnabled = !soundEnabled;
    localStorage.setItem('soundEnabled', soundEnabled);
    const btn = document.getElementById('soundToggle');
    btn.textContent = soundEnabled ? '🔔' : '🔕';
    showAlert(`Sound alerts ${soundEnabled ? 'enabled' : 'disabled'}`);
}

function playAlertSound() {
    if (soundEnabled) {
        const audio = document.getElementById('alertSound');
        audio.play().catch(() => {});
    }
}

// BMI Calculator
function openBMICalculator() {
    document.getElementById('bmiModal').style.display = 'block';
}

function calculateBMI() {
    const weight = parseFloat(document.getElementById('weightInput').value);
    const height = parseFloat(document.getElementById('heightInput').value) / 100; // cm to m
    
    if (!weight || !height || weight < 20 || weight > 300 || height < 1 || height > 2.5) {
        showAlert('Please enter valid weight (20-300 kg) and height (100-250 cm)');
        return;
    }
    
    const bmi = (weight / (height * height)).toFixed(1);
    let category, color, recommendations;
    
    if (bmi < 18.5) {
        category = 'Underweight';
        color = '#3498db';
        recommendations = [
            'Increase caloric intake with nutrient-rich foods',
            'Consider strength training exercises',
            'Consult a nutritionist for a personalized diet plan',
            'Regular health check-ups recommended'
        ];
    } else if (bmi < 25) {
        category = 'Normal Weight';
        color = '#2ecc71';
        recommendations = [
            'Maintain current healthy lifestyle',
            'Regular exercise (150 min/week)',
            'Balanced diet with fruits and vegetables',
            'Stay hydrated and get adequate sleep'
        ];
    } else if (bmi < 30) {
        category = 'Overweight';
        color = '#f39c12';
        recommendations = [
            'Reduce caloric intake by 500 calories/day',
            'Increase physical activity to 300 min/week',
            'Focus on whole foods and reduce processed foods',
            'Consider consulting a healthcare provider'
        ];
    } else {
        category = 'Obese';
        color = '#e74c3c';
        recommendations = [
            'Consult healthcare provider for personalized plan',
            'Start with low-impact exercises',
            'Work with nutritionist for diet modification',
            'Regular monitoring of blood pressure and glucose'
        ];
    }
    
    const resultDiv = document.getElementById('bmiResult');
    resultDiv.innerHTML = `
        <div class="bmi-value">${bmi}</div>
        <div class="bmi-category" style="background: ${color}; padding: 10px; border-radius: 8px; margin-top: 10px;">
            ${category}
        </div>
    `;
    resultDiv.style.background = `linear-gradient(135deg, ${color} 0%, ${color}dd 100%)`;
    resultDiv.classList.add('show');
    
    const recDiv = document.getElementById('healthRecommendations');
    recDiv.innerHTML = `
        <h4>Health Recommendations:</h4>
        <ul>
            ${recommendations.map(r => `<li>${r}</li>`).join('')}
        </ul>
    `;
    recDiv.classList.add('show');
}

// Snapshots Manager
function saveSnapshot() {
    const snapshot = {
        id: Date.now(),
        date: new Date().toLocaleString(),
        patients: allPatients,
        stats: {
            total: allPatients.length,
            avgHeartRate: Math.round(allPatients.reduce((sum, p) => sum + p.heartRate, 0) / allPatients.length),
            lowRisk: allPatients.filter(p => p.riskLevel === 'Low').length,
            mediumRisk: allPatients.filter(p => p.riskLevel === 'Medium').length,
            highRisk: allPatients.filter(p => p.riskLevel === 'High').length
        }
    };
    
    snapshots.unshift(snapshot);
    if (snapshots.length > 10) snapshots = snapshots.slice(0, 10); // Keep only 10 snapshots
    
    localStorage.setItem('healthSnapshots', JSON.stringify(snapshots));
    showAlert('📸 Snapshot saved successfully!');
    playAlertSound();
}

function viewSnapshots() {
    const modal = document.getElementById('snapshotsModal');
    const list = document.getElementById('snapshotsList');
    
    if (snapshots.length === 0) {
        list.innerHTML = '<p style="text-align: center; padding: 40px; color: #999;">No snapshots saved yet. Click "Save Snapshot" to create one!</p>';
    } else {
        list.innerHTML = snapshots.map(snap => `
            <div class="snapshot-card">
                <div class="snapshot-header">
                    <div class="snapshot-title">Snapshot #${snap.id}</div>
                    <div class="snapshot-date">${snap.date}</div>
                </div>
                <div class="snapshot-stats">
                    <div class="snapshot-stat">
                        <strong>${snap.stats.total}</strong><br>Total Patients
                    </div>
                    <div class="snapshot-stat">
                        <strong>${snap.stats.avgHeartRate}</strong><br>Avg Heart Rate
                    </div>
                    <div class="snapshot-stat">
                        <strong>${snap.stats.highRisk}</strong><br>High Risk
                    </div>
                </div>
                <div class="snapshot-actions">
                    <button class="btn-snapshot btn-load" onclick="loadSnapshot(${snap.id})">Load Snapshot</button>
                    <button class="btn-snapshot btn-delete" onclick="deleteSnapshot(${snap.id})">Delete</button>
                </div>
            </div>
        `).join('');
    }
    
    modal.style.display = 'block';
}

function loadSnapshot(id) {
    const snapshot = snapshots.find(s => s.id === id);
    if (snapshot) {
        previousDataset = allPatients;
        allPatients = snapshot.patients;
        filteredPatients = snapshot.patients;
        updateStats(allPatients);
        updateTable(allPatients);
        createHeartRateChart(allPatients);
        createAgeRiskChart(allPatients);
        createTimeSeriesChart();
        createDiseaseChart(allPatients);
        updateQuickStats(allPatients);
        document.getElementById('snapshotsModal').style.display = 'none';
        showAlert('Snapshot loaded successfully!');
    }
}

function deleteSnapshot(id) {
    if (confirm('Are you sure you want to delete this snapshot?')) {
        snapshots = snapshots.filter(s => s.id !== id);
        localStorage.setItem('healthSnapshots', JSON.stringify(snapshots));
        viewSnapshots();
        showAlert('Snapshot deleted');
    }
}

// Import CSV
function openImportModal() {
    document.getElementById('importModal').style.display = 'block';
}

function processCSVImport() {
    const fileInput = document.getElementById('csvFileInput');
    const statusDiv = document.getElementById('importStatus');
    
    if (!fileInput.files.length) {
        statusDiv.className = 'import-status error';
        statusDiv.textContent = 'Please select a CSV file first';
        return;
    }
    
    const file = fileInput.files[0];
    const reader = new FileReader();
    
    reader.onload = function(e) {
        try {
            const text = e.target.result;
            const lines = text.split('\\n');
            const patients = [];
            
            for (let i = 1; i < lines.length; i++) {
                const line = lines[i].trim();
                if (!line) continue;
                
                const [id, age, heartRate, bloodPressure, cholesterol, riskLevel] = line.split(',').map(v => v.trim());
                
                if (id && age && heartRate && bloodPressure && cholesterol && riskLevel) {
                    patients.push({
                        id: parseInt(id),
                        age: parseInt(age),
                        heartRate: parseInt(heartRate),
                        bloodPressure,
                        cholesterol: parseInt(cholesterol),
                        riskLevel
                    });
                }
            }
            
            if (patients.length === 0) {
                throw new Error('No valid patient data found');
            }
            
            allPatients = patients;
            filteredPatients = patients;
            updateStats(allPatients);
            updateTable(allPatients);
            createHeartRateChart(allPatients);
            createAgeRiskChart(allPatients);
            createTimeSeriesChart();
            createDiseaseChart(allPatients);
            updateQuickStats(allPatients);
            
            statusDiv.className = 'import-status success';
            statusDiv.textContent = `✓ Successfully imported ${patients.length} patient records!`;
            
            setTimeout(() => {
                document.getElementById('importModal').style.display = 'none';
                statusDiv.className = 'import-status';
                fileInput.value = '';
            }, 2000);
            
        } catch (error) {
            statusDiv.className = 'import-status error';
            statusDiv.textContent = `✗ Error: ${error.message}. Please check CSV format.`;
        }
    };
    
    reader.readAsText(file);
}

// Keyboard Shortcuts
function showKeyboardShortcuts() {
    document.getElementById('keyboardModal').style.display = 'block';
}

document.addEventListener('keydown', (e) => {
    if (e.ctrlKey || e.metaKey) {
        switch(e.key.toLowerCase()) {
            case 'd':
                e.preventDefault();
                toggleDarkMode();
                break;
            case 'e':
                e.preventDefault();
                exportToCSV();
                break;
            case 'p':
                e.preventDefault();
                printDashboard();
                break;
            case 'g':
                e.preventDefault();
                previousDataset = allPatients;
                initializeDashboard();
                break;
            case 'm':
                e.preventDefault();
                toggleMonitor();
                break;
            case 'f':
                e.preventDefault();
                document.getElementById('searchInput').focus();
                break;
            case 's':
                e.preventDefault();
                saveSnapshot();
                break;
        }
    } else if (e.key === 'F11') {
        e.preventDefault();
        toggleFullscreen();
    } else if (e.key === 'Escape') {
        document.querySelectorAll('.modal').forEach(modal => {
            modal.style.display = 'none';
        });
    }
});

// Additional Event Listeners
document.getElementById('printDashboard').addEventListener('click', printDashboard);
document.getElementById('downloadCharts').addEventListener('click', downloadCharts);
document.getElementById('fullscreenMode').addEventListener('click', toggleFullscreen);
document.getElementById('soundToggle').addEventListener('click', toggleSound);
document.getElementById('bmiCalculatorBtn').addEventListener('click', openBMICalculator);
document.getElementById('calculateBMI').addEventListener('click', calculateBMI);
document.getElementById('snapshotBtn').addEventListener('click', saveSnapshot);
document.getElementById('viewSnapshotsBtn').addEventListener('click', viewSnapshots);
document.getElementById('importCSV').addEventListener('click', openImportModal);
document.getElementById('uploadCSV').addEventListener('click', processCSVImport);
document.getElementById('showKeyboardShortcuts').addEventListener('click', showKeyboardShortcuts);

// Close modal handlers for new modals
document.querySelector('.modal-close-bmi').addEventListener('click', () => {
    document.getElementById('bmiModal').style.display = 'none';
});

document.querySelector('.modal-close-keyboard').addEventListener('click', () => {
    document.getElementById('keyboardModal').style.display = 'none';
});

document.querySelector('.modal-close-snapshots').addEventListener('click', () => {
    document.getElementById('snapshotsModal').style.display = 'none';
});

document.querySelector('.modal-close-import').addEventListener('click', () => {
    document.getElementById('importModal').style.display = 'none';
});

window.addEventListener('click', (e) => {
    const bmiModal = document.getElementById('bmiModal');
    const keyboardModal = document.getElementById('keyboardModal');
    const snapshotsModal = document.getElementById('snapshotsModal');
    const importModal = document.getElementById('importModal');
    
    if (e.target === bmiModal) bmiModal.style.display = 'none';
    if (e.target === keyboardModal) keyboardModal.style.display = 'none';
    if (e.target === snapshotsModal) snapshotsModal.style.display = 'none';
    if (e.target === importModal) importModal.style.display = 'none';
});

// Load preferences
if (localStorage.getItem('darkMode') === 'true') {
    document.body.classList.add('dark-mode');
    document.getElementById('darkModeToggle').textContent = '☀️';
}

if (!soundEnabled) {
    document.getElementById('soundToggle').textContent = '🔕';
}

// Override showAlert to include sound
const originalShowAlert = showAlert;
showAlert = function(message) {
    playAlertSound();
    const alertSystem = document.getElementById('alertSystem');
    const alertMessage = document.getElementById('alertMessage');
    alertMessage.textContent = message;
    alertSystem.style.display = 'block';
    
    setTimeout(() => {
        alertSystem.style.display = 'none';
    }, 10000);
};

// Initialize on page load
window.addEventListener('load', initializeDashboard);
