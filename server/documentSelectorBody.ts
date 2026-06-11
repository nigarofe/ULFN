import ejs from 'ejs';
import fs from 'node:fs';

import { generateSRME } from './SRME';
import { generateSRMG } from './SRMG';
import type { SRMEEntry } from './SRME.schema';
import { DOCUMENT_CARD_TEMPLATE_PATH } from '../config';

interface RenderOptions {
    discipline: string;
    classification: string;
    orderBy: string;
    order: string;
}

export function getDocumentSelectorBodyHTML(options: RenderOptions): string {
    const templateStr = fs.readFileSync(DOCUMENT_CARD_TEMPLATE_PATH, 'utf-8');
    const SRME = generateSRME();

    const selectedDiscipline = options.discipline;
    const selectedClassification = options.classification;
    const selectedOrderBy = options.orderBy;
    const selectedOrder = options.order;

    let filteredEntries = SRME.filter((element: SRMEEntry) => {
        const disciplineMatch = selectedDiscipline === 'All' || element['Discipline'] === selectedDiscipline;
        const classificationMatch = selectedClassification === 'All' || element['Classification'] === selectedClassification;
        return disciplineMatch && classificationMatch;
    });

    filteredEntries.sort((a: SRMEEntry, b: SRMEEntry) => {
        let comparison = 0;
        if (selectedOrderBy === 'ID') {
            comparison = a['ID'] - b['ID'];
        } else if (selectedOrderBy === 'Total Attempts') {
            comparison = a['SRME']['Total Attempts'] - b['SRME']['Total Attempts'];
        } else if (selectedOrderBy === 'DSLA') {
            comparison = a['SRME']['DSLA'] !== null && b['SRME']['DSLA'] !== null ? a['SRME']['DSLA'] - b['SRME']['DSLA'] : 0;
        } else if (selectedOrderBy === 'PMG-D') {
            comparison = a['SRME']['PMG-D'] !== null && b['SRME']['PMG-D'] !== null ? a['SRME']['PMG-D'] - b['SRME']['PMG-D'] : 0;
        } else if (selectedOrderBy === 'PMG-X') {
            const aPMGX = typeof (a['SRME']['PMG-X']) === 'number' ? a['SRME']['PMG-X'] : -1;
            const bPMGX = typeof (b['SRME']['PMG-X']) === 'number' ? b['SRME']['PMG-X'] : -1;
            comparison = aPMGX - bPMGX;
        }
        return selectedOrder === 'Ascending' ? comparison : -comparison;
    });

    // 4. Generate Options (with 'selected' attribute logic)
    const possibleDisciplines = new Set<string>().add('All');
    const possibleClassifications = new Set<string>().add('All');
    SRME.forEach((item: SRMEEntry) => {
        possibleDisciplines.add(item['Discipline']);
        possibleClassifications.add(item['Classification']);
    });

    const createOptions = (items: Set<string>, selectedValue: string) => {
        let html = '';
        Array.from(items).sort().forEach(item => {
            const isSelected = item === selectedValue ? 'selected' : '';
            html += `<option value="${item}" ${isSelected}>${item}</option>`;
        });
        return html;
    };

    const selectDisciplineOptionsHtml = createOptions(possibleDisciplines, selectedDiscipline);
    const selectClassificationOptionsHtml = createOptions(possibleClassifications, selectedClassification);

    // Helper for static selects
    const isSelected = (val: string, current: string) => val === current ? 'selected' : '';

    let exerciseCardsSectionHTML = '';
    filteredEntries.forEach((entry: SRMEEntry) => {
        exerciseCardsSectionHTML += ejs.render(templateStr, {
            element: entry,
            hideMetadata: false
        });
    });

    const srgm = generateSRMG(filteredEntries);

    const data_chart1 = JSON.stringify(
        [srgm?.pmg_x_smaller_equal_1_count,
        srgm?.pmg_x_greater_1_count,
        srgm?.las_equal_wh,
        srgm?.single_attempts,
        srgm?.never_attempted]
    );
    const data_chart2 = JSON.stringify(srgm?.scatterData || []);
    const data_chart3_labels = JSON.stringify(srgm?.week_labels || []);
    const data_chart3_values = JSON.stringify(srgm?.LaMI_change || []);

    return /* html */ `
        <header class="double-line-around">
            <h1 style="text-align: center; margin: 0 0 1rem; padding: 0; font-size: 2.5rem;">Document Selector</h1>
            <span>Browse available documents</span>
        </header>

        <main>
            <section class="exercises-filters-section">
                <div>
                    <label for="discipline-select">Discipline</label>
                    <select id="discipline-select">${selectDisciplineOptionsHtml}</select>
                </div>

                <div>
                    <label for="classification-select">Classification</label>
                    <select id="classification-select">${selectClassificationOptionsHtml}</select>
                </div>

                <div>
                    <label for="order-by-select">Order by</label>
                    <select id="order-by-select">
                        <option ${isSelected('ID', selectedOrderBy)}>ID</option>
                        <option ${isSelected('Total Attempts', selectedOrderBy)}>Total Attempts</option> 
                        <option ${isSelected('DSLA', selectedOrderBy)}>DSLA</option>
                        <option ${isSelected('PMG-D', selectedOrderBy)}>PMG-D</option>
                        <option ${isSelected('PMG-X', selectedOrderBy)}>PMG-X</option>
                    </select>
                </div>

                <div>
                    <label for="order-select">Order</label>
                    <select id="order-select">
                        <option ${isSelected('Ascending', selectedOrder)}>Ascending</option>
                        <option ${isSelected('Descending', selectedOrder)}>Descending</option>
                    </select>
                </div>
            </section>

            <div class="dashboard-container" 
                data-chart1='${data_chart1}' 
                data-chart2='${data_chart2}' 
                data-chart3-labels='${data_chart3_labels}'
                data-chart3-values='${data_chart3_values}'>
                
                <div><canvas id="exerciseDistributionChart"></canvas></div>
                <div><canvas id="urgencyValueChart"></canvas></div>
                <div><canvas id="tLamiIncreaseChart"></canvas></div>
            </div>

            <section id="exercise-cards-section">
                ${exerciseCardsSectionHTML}
            </section>
        </main>
    `;
}