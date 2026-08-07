const fs = require('fs');
let content = fs.readFileSync('app.js', 'utf8');

const target1 = `    if (allComparisonData.length === 0 && window.grammarComparisonData) {
        if (targetFilter === 'all') {
            allComparisonData = window.grammarComparisonData;
        } else {
            allComparisonData = window.grammarComparisonData.filter(d => 
                (d.level || '').toLowerCase().includes(targetFilter.toLowerCase())
            );
            if (allComparisonData.length === 0) allComparisonData = window.grammarComparisonData;
        }
    }`;

content = content.replace(target1, '');

const target2 = `    if (currentTab === 'theory') {
        let cardsHtml = '';
        allComparisonData.forEach((item) => {`;

const replacement2 = `    if (currentTab === 'theory') {
        let cardsHtml = '';
        if (allComparisonData.length === 0) {
            cardsHtml = \`<div style="text-align:center; padding: 40px; color: #64748b; font-size: 15px; background: white; border-radius: 18px; border: 1.5px dashed #bae6fd; margin-top: 20px;">Chưa có dữ liệu cho cấp độ này.</div>\`;
        } else {
        allComparisonData.forEach((item) => {`;

content = content.replace(target2, replacement2);

const target3 = `            \`;
        });
        tabMainContentHtml = \`<div id="comparison-cards-container">\${cardsHtml}</div>\`;
    } else {`;

const replacement3 = `            \`;
        });
        }
        tabMainContentHtml = \`<div id="comparison-cards-container">\${cardsHtml}</div>\`;
    } else {`;

content = content.replace(target3, replacement3);

fs.writeFileSync('app.js', content);
