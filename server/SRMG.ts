import type { SRMEEntry } from './SRME.schema';

export function generateSRMG(filteredEntries: SRMEEntry[]) {
    if (!filteredEntries || filteredEntries.length === 0) {
        console.log('No entries to process for SRMG generation.');
        return;
    }

    // First chart
    let pmg_x_smaller_equal_1_count = 0;
    let pmg_x_greater_1_count = 0;
    let las_equal_wh = 0;
    let single_attempts = 0;
    let never_attempted = 0;

    // Second chart
    let scatterData: { x: number, y: number, id: number }[] = [];

    filteredEntries.forEach(entry => {
        const pmgXValue = entry['SRME']['PMG-X'];

        // First chart
        if (typeof (pmgXValue) === 'number' && pmgXValue <= 1) pmg_x_smaller_equal_1_count++;
        else if (typeof (pmgXValue) === 'number' && pmgXValue > 1) pmg_x_greater_1_count++;
        if (entry['SRME']['LAS'] === 'With Help') las_equal_wh++;
        if (entry['SRME']['LAS'] === 'Without Help' && entry['SRME']['Total Attempts'] === 1) single_attempts++;
        if (entry['SRME']['Total Attempts'] === 0) never_attempted++;

        // Second chart
        const pmgDValue = entry['SRME']['PMG-D'];

        if (typeof (pmgXValue) === 'number' && typeof (pmgDValue) === 'number') {
            scatterData.push({ x: pmgDValue, y: pmgXValue, id: entry['ID'] });
        } else if (typeof (pmgDValue) === 'number') {
            scatterData.push({ x: pmgDValue, y: 0, id: entry['ID'] });
        } else {
            scatterData.push({ x: 0, y: 0, id: entry['ID'] });
        }
    });

    // --- Third chart: LaMI Change Calculation ---
    // Calculate the week labels of this and the last 5 weeks  based on the current date
    // e.g. const week_labels = ["2026-W3", "2026-W4", "2026-W5", "2026-W6", "2026-W7"]);
    // Calculate the sum of LaMI for all entries at the last day of the week before
    // Calculate the sum of LaMI for all entries today
    // Calculate the change in LaMI compared to the previous week and store it in the LaMI_change array
    // e.g. const LaMI_change = [5, 20, 12, 17, 15];

    const currentDate = new Date();
    const week_labels: string[] = [];
    const LaMI_change: number[] = [];

    // To calculate "change", we need to know where we started
    let previousWeeklyTotal = 0;

    // We iterate from i = 5 down to 0 to get 6 data points 
    // (the start point + 5 weeks of changes)
    for (let i = 5; i >= 0; i--) {
        const targetDate = new Date(currentDate);
        targetDate.setDate(currentDate.getDate() - (i * 7));

        const year = targetDate.getFullYear();
        const weekNumber = Math.ceil((((targetDate.getTime() - new Date(year, 0, 1).getTime()) / 86400000) + new Date(year, 0, 1).getDay() + 1) / 7);

        let currentWeeklyTotalLaMI = 0;

        filteredEntries.forEach(entry => {
            const relevantAttempts = entry['Attempts']
                .filter(a => new Date(a['Timestamp']) <= targetDate)
                .sort((a, b) => new Date(a['Timestamp']).getTime() - new Date(b['Timestamp']).getTime());

            if (relevantAttempts.length >= 2) {
                const lastAttempt = relevantAttempts[relevantAttempts.length - 1];
                const secondLastAttempt = relevantAttempts[relevantAttempts.length - 2];

                if (lastAttempt['Code'] === 1) {
                    const lastTs = new Date(lastAttempt['Timestamp']).getTime();
                    const secondLastTs = new Date(secondLastAttempt['Timestamp']).getTime();
                    const lami = Math.floor((lastTs - secondLastTs) / (1000 * 60 * 60 * 24));
                    currentWeeklyTotalLaMI += lami;
                }
            }
        });

        // The first iteration (i=5) sets our baseline. 
        // Subsequent iterations (i=4 to 0) calculate the delta.
        if (i < 5) {
            week_labels.push(`${year}-W${weekNumber}`);
            LaMI_change.push(currentWeeklyTotalLaMI - previousWeeklyTotal);
        }

        previousWeeklyTotal = currentWeeklyTotalLaMI;
    }

    return {
        pmg_x_smaller_equal_1_count,
        pmg_x_greater_1_count,
        las_equal_wh,
        single_attempts,
        never_attempted,
        scatterData,
        week_labels,
        LaMI_change
    };
}