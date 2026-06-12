import { Chart, registerables } from 'chart.js';
Chart.register(...registerables);

const charts: (Chart | null)[] = [null, null, null];

export function initCharts() {
    const dashboardContainer = document.querySelector('.dashboard-container') as HTMLElement | null;
    if (!dashboardContainer) return;

    charts.forEach(c => c?.destroy());

    const chart1_data = JSON.parse(dashboardContainer.dataset.chart1 as string);
    const chart2_data = JSON.parse(dashboardContainer.dataset.chart2 as string);
    const chart3_labels = JSON.parse(dashboardContainer.dataset.chart3Labels as string);
    const chart3_data = JSON.parse(dashboardContainer.dataset.chart3Values as string);

    const ctx = document.getElementById('exerciseDistributionChart') as HTMLCanvasElement | null;
    if (!ctx) return;
    charts[0] = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: ['PMG-X <= 1', 'PMG-X > 1', 'With Help', 'Single Attempt', 'Never Attempted'],
            datasets: [{
                label: '# of Exercises',
                data: chart1_data,
                backgroundColor: [
                    'rgba(22, 163, 74, 0.6)',   // Green #16a34a (Success/Correct)
                    'rgba(245, 158, 11, 0.6)',  // Amber #f59e0b (Warning/Partial)
                    'rgba(220, 38, 38, 0.6)',   // Red #dc2626 (Error/Incorrect)
                    'rgba(0, 0, 0, 0.6)',       // Black (Neutral/Single Attempt)
                    'rgba(156, 163, 175, 0.6)'  // Gray (Inactive)
                ],
                borderColor: [
                    'rgb(22, 163, 74)',
                    'rgb(245, 158, 11)',
                    'rgb(220, 38, 38)',
                    'rgb(0, 0, 0)',
                    'rgb(156, 163, 175)'
                ],
                borderWidth: 1.5
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false },
                title: {
                    display: true,
                    text: 'Exercise Distribution by Status',
                    font: { size: 14 },
                    color: 'rgb(0, 0, 0)' // Black for title
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    grid: { color: 'rgba(0, 0, 0, 0.05)' },
                    ticks: {
                        precision: 0
                    }
                },
                x: {
                    grid: { display: false }
                }
            }
        }
    });

    const ctx2 = document.getElementById('urgencyValueChart') as HTMLCanvasElement | null;
    if (!ctx2) return;
    charts[1] = new Chart(ctx2, {
        type: 'scatter',
        data: {
            datasets: [{
                label: 'Exercises',
                data: chart2_data,
                // Updated to Black
                backgroundColor: 'rgba(0, 0, 0, 0.6)',
                borderColor: 'rgb(0, 0, 0)',
                pointRadius: 6
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false },
                title: {
                    display: true,
                    text: 'Urgency (PMG-X) vs. Value (PMG-D)',
                    color: 'rgb(0, 0, 0)'
                },
                tooltip: {
                    callbacks: {
                        label: (context) => {
                            const point = context.raw as { x: number; y: number; id: number };
                            return [
                                `Exercise #${point.id}`,
                                `PMG-D: ${point.x}`,
                                `PMG-X: ${point.y}`
                            ];
                        }
                    }
                }
            },
            scales: {
                x: { title: { display: true, text: 'PMG-D' }, beginAtZero: true },
                y: {
                    title: { display: true, text: 'PMG-X' },
                    beginAtZero: true,
                    grid: {
                        // Updated to Red #dc2626 for consistency with error/threshold
                        color: (ctx) => ctx.tick.value === 1 ?
                            'rgba(220, 38, 38, 0.5)' : 'rgba(0, 0, 0, 0.05)',
                        lineWidth: (ctx) => ctx.tick.value === 1 ?
                            2 : 1
                    }
                }
            }
        }
    });

    const ctx3 = document.getElementById('tLamiIncreaseChart') as HTMLCanvasElement | null;
    if (!ctx3) return;
    charts[2] = new Chart(ctx3, {
        type: 'bar',
        data: {
            labels: chart3_labels,
            datasets: [{
                label: 'LaMI Increase',
                data: chart3_data,
                // Added Black
                backgroundColor: 'rgba(0, 0, 0, 0.6)',
                borderColor: 'rgb(0, 0, 0)',
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false },
                title: {
                    display: true,
                    text: 'Weekly LaMI Increase',
                    color: 'rgb(0, 0, 0)'
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    grid: { color: 'rgba(0, 0, 0, 0.05)' }
                },
                x: {
                    grid: { display: false }
                }
            }
        }
    });
}