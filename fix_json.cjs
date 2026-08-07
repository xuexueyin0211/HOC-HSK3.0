const fs = require('fs');
let content = fs.readFileSync('app.js', 'utf8');

content = content.replace(
    /const res = await fetch\('data\/comparison\/exercises\.json'\);\s*if \(res\.ok\) \{\s*window\.comparisonPracticeExercises = await res\.json\(\);\s*\}/,
    `const res = await fetch('data/comparison/exercises.json');
            if (res.ok) {
                const contentType = res.headers.get('content-type');
                if (contentType && contentType.includes('application/json')) {
                    window.comparisonPracticeExercises = await res.json();
                }
            }`
);

content = content.replace(
    /const res = await fetch\(`data\/comparison\/\$\{lvl\}\.json`\);\s*if \(res\.ok\) \{\s*const data = await res\.json\(\);\s*if \(Array\.isArray\(data\)\) \{\s*window\.grammarComparisonData\.push\(\.\.\.data\);\s*\}\s*\}/,
    `const res = await fetch(\`data/comparison/\${lvl}.json\`);
                if (res.ok) {
                    const contentType = res.headers.get('content-type');
                    if (contentType && contentType.includes('application/json')) {
                        const data = await res.json();
                        if (Array.isArray(data)) {
                            window.grammarComparisonData.push(...data);
                        }
                    }
                }`
);

content = content.replace(
    /const res = await fetch\(`data\/comparison\/\$\{l\}\.json`\);\s*if \(res\.ok\) \{\s*const data = await res\.json\(\);\s*if \(Array\.isArray\(data\)\) \{\s*data\.forEach\(item => \{\s*if \(!item\.level\) item\.level = l\.toUpperCase\(\);\s*\}\);\s*allComparisonData\.push\(\.\.\.data\);\s*\}\s*\}/,
    `const res = await fetch(\`data/comparison/\${l}.json\`);
            if (res.ok) {
                const contentType = res.headers.get('content-type');
                if (contentType && contentType.includes('application/json')) {
                    const data = await res.json();
                    if (Array.isArray(data)) {
                        data.forEach(item => {
                            if (!item.level) item.level = l.toUpperCase();
                        });
                        allComparisonData.push(...data);
                    }
                }
            }`
);

fs.writeFileSync('app.js', content);
