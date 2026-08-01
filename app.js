
        const MODULES = {
            vocab: { label: 'Từ vựng', icon: '📚', path: 'data/vocab/' },
            grammar: { label: 'Ngữ pháp', icon: '📝', path: 'data/grammar/' },
            comparison: { label: 'So sánh và lưu ý lỗi sai thường gặp', icon: '⚖️', path: 'data/comparison/' },
            writing_ai: { label: 'Luyện viết AI', icon: '✍️', path: 'data/writing_ai/' },
            speaking_ai: { label: 'Luyện nói AI', icon: '🎙️', path: 'data/speaking_ai/' },
            hanzi: { label: 'Chữ Hán', icon: '🀄', path: 'data/hanzi/' },
            pronunciation: { label: 'Phát âm', icon: '🔊', path: 'data/pronunciation/' },
            translation: { label: 'Luyện dịch', icon: '🔤', path: 'data/translation/' },
            practice: { label: 'Luyện đề', icon: '📖', path: 'data/practice/' },
            dictation: { label: 'Nghe chép', icon: '🎧', path: 'data/dictation/' },
            shadowing: { label: 'Shadowing', icon: '🗣️', path: 'data/shadowing/' },
            entertainment: { label: 'Giải trí', icon: '🎭', path: 'data/entertainment/' }
        };


        let currentModule = 'grammar';
        window.currentModule = currentModule;
        let currentLevel = 'hsk1';
        let currentLesson = 1;
        let currentTab = 1;
        let cachedData = {};
        let highlightMode = false;
        let toolbarVisible = false;
        let currentHighlightElement = null;
        let flashcardData = [];
        let flashcardIndex = 0;
        let flashcardShowing = false;
        let undefinedWords = [];
        let hskData = {};
        let hskLevels = ['hsk1', 'hsk2', 'hsk3', 'hsk4', 'hsk5', 'hsk6'];
let flashcardType = ''; // 'vocab' hoặc 'grammar'

        function getFeaturesGrid() { return document.getElementById('featuresGrid'); }
        function getHskNavWrapper() { return document.getElementById('hskNavWrapper'); }
        function getContentArea() { return document.getElementById('contentArea'); }
        function getContentInner() { return document.getElementById('contentInner'); }
        function getBackHomeBtn() { return document.getElementById('backHomeBtn'); }
        function getFeaturesSection() { return document.getElementById('featuresSection'); }


        async function loadModuleData(module, level) {
            const key = `${module}-${level}`;
            if (cachedData[key]) return cachedData[key];

            const candidatePaths = [
                MODULES[module].path + level + '.json'
            ];
            if (module === 'hanzi') {
                candidatePaths.push(`hanzi/${level}.json`);
            }

            for (let path of candidatePaths) {
                try {
                    let response = await fetch(path);
                    const contentType = response.headers.get('content-type') || '';
                    if (response.ok && (!contentType || contentType.includes('application/json') || contentType.includes('text/plain'))) {
                        let text = await response.text();
                        text = text.replace(/^```json\s*/i, '').replace(/^```\s*/, '').replace(/```\s*$/, '');
                        const trimmed = text.trim();
                        if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
                            const data = JSON.parse(trimmed);
                            let innerData = data;
                            if (data[level]) innerData = data[level];
                            if (!innerData.lessons && !innerData.items && !innerData.chars) {
                                const keys = Object.keys(data);
                                for (const k of keys) {
                                    if (data[k] && (data[k].lessons || data[k].items || data[k].chars)) {
                                        innerData = data[k];
                                        break;
                                    }
                                }
                            }
                            if (module === 'hanzi') {
                                if (Array.isArray(innerData)) {
                                    innerData = {
                                        title: `TỔNG HỢP CHỮ HÁN ${level.toUpperCase()}`,
                                        chars: innerData
                                    };
                                } else if (innerData && !innerData.chars) {
                                    for (const k of Object.keys(innerData)) {
                                        if (innerData[k] && Array.isArray(innerData[k].chars)) {
                                            innerData = innerData[k];
                                            break;
                                        } else if (Array.isArray(innerData[k])) {
                                            innerData = {
                                                title: `DANH MỤC CHỮ HÁN ${level.toUpperCase()}`,
                                                chars: innerData[k]
                                            };
                                            break;
                                        }
                                    }
                                }
                            }
                            hskData[level] = innerData;
                            cachedData[key] = innerData;
                            return innerData;
                        }
                    }
                } catch (error) {
                    console.warn(`⚠️ Lỗi tải ${path}:`, error);
                }
            }

            console.warn(`⚠️ Không tìm thấy dữ liệu cho ${key}, dùng fallback`);
            const fallback = getFallbackData(module, level);
            hskData[level] = fallback;
            cachedData[key] = fallback;
            return fallback;
        }

        function getFallbackData(module, level) {
            const emptyData = {
                grammar: {
                    badge: `${level.toUpperCase()}`,
                    title: `Ngữ pháp ${level.toUpperCase()}`,
                    subtitle: 'Chưa có dữ liệu',
                    lessons: [{
                        id: 1,
                        title: `Bài 1: Chưa có dữ liệu`,
                        tabs: [{
                            id: '1',
                            title: '① Chưa có dữ liệu',
                            subcards: [{ label: '📌 Thông báo', text: 'Chưa có dữ liệu cho phần này.' }],
                            examples: [{ cn: '暂无数据', py: 'zàn wú shù jù', vi: 'Chưa có dữ liệu' }]
                        }],
                        exercises: [{ question: 'Chưa có bài tập', options: ['A', 'B', 'C', 'D'], answer: 0 }]
                    }]
                },
                vocab: {
                    badge: `📚 ${level.toUpperCase()}`,
                    title: `Từ vựng ${level.toUpperCase()}`,
                    subtitle: 'Chưa có dữ liệu',
                    items: [{ icon: '📖', title: 'Chưa có dữ liệu', desc: '', tag: '0 từ', likes: 0 }]
                },
                hanzi: {
                    badge: `🀄 ${level.toUpperCase()}`,
                    title: `Chữ Hán ${level.toUpperCase()}`,
                    subtitle: 'Chưa có dữ liệu',
                    items: [{ icon: '✍️', title: 'Chưa có dữ liệu', desc: '', tag: '0 bộ', likes: 0 }]
                },
                practice: {
                    badge: `📖 ${level.toUpperCase()}`,
                    title: `Luyện đề ${level.toUpperCase()}`,
                    subtitle: 'Chưa có dữ liệu',
                    exercises: [{ question: 'Chưa có câu hỏi', options: ['A', 'B', 'C', 'D'], answer: 0 }]
                },
                dictation: {
                    badge: `🎧 ${level.toUpperCase()}`,
                    title: `Nghe chép ${level.toUpperCase()}`,
                    subtitle: 'Chưa có dữ liệu',
                    items: [{ icon: '🎵', title: 'Chưa có dữ liệu', desc: '', tag: '0:00', likes: 0 }]
                },
                shadowing: {
                    badge: `🗣️ ${level.toUpperCase()}`,
                    title: `Shadowing ${level.toUpperCase()}`,
                    subtitle: 'Chưa có dữ liệu',
                    items: [{ icon: '🗣️', title: 'Chưa có dữ liệu', desc: '', tag: '0:00', likes: 0 }]
                }
            };
            return emptyData[module] || { title: 'Chưa có dữ liệu', subtitle: '', items: [] };
        }
window.removeAccents = function(str) {
    if (!str) return '';
    return String(str).normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
};

function saveState(module, level) {
    const state = { module, level };
    localStorage.setItem('appState', JSON.stringify(state));
}

function loadState() {
    const state = localStorage.getItem('appState');
    return state ? JSON.parse(state) : { module: 'grammar', level: 'hsk1' };
}

// ===== LƯU TIẾN ĐỘ FLASHCARD =====
function saveFlashcardProgress(level, lessonNum, currentIndex, isShuffled) {
    const key = `flashcard_progress_${level}_lesson${lessonNum}`;
    const progress = {
        currentIndex: currentIndex,
        isShuffled: isShuffled,
        timestamp: new Date().getTime()
    };
    localStorage.setItem(key, JSON.stringify(progress));
}

function loadFlashcardProgress(level, lessonNum) {
    const key = `flashcard_progress_${level}_lesson${lessonNum}`;
    const progress = localStorage.getItem(key);
    return progress ? JSON.parse(progress) : { currentIndex: 0, isShuffled: false };
}

function clearFlashcardProgress(level, lessonNum) {
    const key = `flashcard_progress_${level}_lesson${lessonNum}`;
    localStorage.removeItem(key);
}

        async function showContent(module, level) {
    window.showContent = showContent;
    if (!module) {
        const activeFeature = document.querySelector('.feature-card.active');
        module = activeFeature ? activeFeature.dataset.module : 'grammar';
    }
    
    currentModule = module;
    window.currentModule = module;
    if (module === 'practice' && typeof window.closeInlineLookup === 'function') {
        window.closeInlineLookup();
    }
    currentLevel = level;
    
    saveState(module, level);

    document.querySelectorAll('.feature-card').forEach(el => el.classList.remove('active'));
    const activeCard = document.querySelector(`.feature-card[data-module="${module}"]`);
    if (activeCard) {
        activeCard.classList.add('active');
        const parentGroup = activeCard.closest('.category-group');
        if (parentGroup) parentGroup.classList.add('expanded');
    }

    document.querySelectorAll('.hsk-item').forEach(el => el.classList.remove('active'));
    const activeHsk = document.querySelector(`.hsk-item[data-level="${level}"]`);
    if (activeHsk) activeHsk.classList.add('active');

    const ca = getContentArea();
    if (ca) ca.className = 'content-area show ' + level;
    const nav = getHskNavWrapper();
    if (nav) nav.classList.add('show');
    const fs = getFeaturesSection();
    if (fs) fs.style.display = 'none';

    const ci = getContentInner();
    if (ci) {
        ci.innerHTML = `
            <div id="loading">
                <div class="spinner"></div>
                <p style="color: #a0526a;">Đang tải dữ liệu...</p>
            </div>
        `;
    }

    if (module === 'comparison') {
        renderGrammarComparisonModule(level, level || 'hsk1');
        if (ca) ca.scrollIntoView({ behavior: 'smooth', block: 'start' });
        return;
    }
    if (module === 'writing_ai') {
        renderWritingAiModule(level);
        if (ca) ca.scrollIntoView({ behavior: 'smooth', block: 'start' });
        return;
    }
    if (module === 'speaking_ai') {
        renderSpeakingAiModule(level);
        if (ca) ca.scrollIntoView({ behavior: 'smooth', block: 'start' });
        return;
    }
    if (module === 'pronunciation') {
        renderPronunciationModule(level, null);
        if (ca) ca.scrollIntoView({ behavior: 'smooth', block: 'start' });
        return;
    }
    if (module === 'translation') {
        renderTranslationModule(level, null);
        if (ca) ca.scrollIntoView({ behavior: 'smooth', block: 'start' });
        return;
    }
    if (module === 'entertainment') {
        renderEntertainmentModule(level, null);
        if (ca) ca.scrollIntoView({ behavior: 'smooth', block: 'start' });
        return;
    }

    try {
        const data = await loadModuleData(module, level);
        renderContent(module, level, data);
    } catch (error) {
        if (ci) {
            ci.innerHTML = `
                <div style="text-align:center;padding:40px;color:#a0526a;">
                    <p style="font-size:24px;">😅</p>
                    <p>Không thể tải dữ liệu. Vui lòng thử lại sau.</p>
                </div>
            `;
        }
    }
    if (ca) ca.scrollIntoView({ behavior: 'smooth', block: 'start' });
}


       function renderContent(module, level, data) {
    contentInner.innerHTML = '';
    
    if (!data) {
        contentInner.innerHTML = `<p style="color:#a0526a;text-align:center;padding:40px;">Dữ liệu trống!</p>`;
        return;
    }
    
    if (module === 'hanzi' || (data && (data.chars || Array.isArray(data)))) {
        if (Array.isArray(data)) {
            data = { title: `DANH MỤC CHỮ HÁN ${level.toUpperCase()}`, chars: data };
        } else if (data && !data.chars) {
            let foundChars = null;
            for (let k in data) {
                if (Array.isArray(data[k])) { foundChars = data[k]; break; }
                if (data[k] && Array.isArray(data[k].chars)) { foundChars = data[k].chars; break; }
            }
            if (foundChars) data = { title: `DANH MỤC CHỮ HÁN ${level.toUpperCase()}`, chars: foundChars };
        }
        renderHanziModule(level, data);
    } else if (module === 'vocab' && data.lessons && data.lessons.length > 0) {
        // ✅ Gọi hàm riêng cho vocab
        renderVocabLessons(level, data);
    } else if (module === 'grammar' && data.lessons && data.lessons.length > 0) {
        renderGrammarLessons(level, data);
    } else if (data.exams && data.exams.length > 0) {
        renderPracticeExams(level, data);
    } else if (data.items && data.items.length > 0) {
        renderCardItems(module, data);
    } else if (data.exercises && data.exercises.length > 0) {
        renderPractice(data);
    } else {
        contentInner.innerHTML = `
            <p style="color:#a0526a;text-align:center;padding:40px;">
                Chưa có dữ liệu cho phần này.<br>
                Module: ${module} | Level: ${level}
            </p>
        `;
    }
}


        let hanziState = {
            allChars: [],
            filteredChars: [],
            currentPage: 1,
            perPage: 24,
            level: 'hsk1',
            data: null,
            searchQuery: '',
            strokeFilter: 'all',
            typeFilter: 'all',
            sortOrder: 'default'
        };

window.escapeHtml = function(str) {
    if (!str) return '';
    return String(str)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
};
const escapeHtml = window.escapeHtml;

window.escapeQuotes = function(str) {
    if (!str) return '';
    return String(str).replace(/\\/g, "\\\\").replace(/'/g, "\\'").replace(/"/g, '&quot;');
};
const escapeQuotes = window.escapeQuotes;

        function renderHanziModule(level, data) {
            hanziState.level = level;
            hanziState.data = data;
            hanziState.allChars = data.chars || [];
            hanziState.searchQuery = '';
            hanziState.strokeFilter = 'all';
            hanziState.typeFilter = 'all';
            hanziState.sortOrder = 'default';
            hanziState.currentPage = 1;

            filterAndRenderHanzi();
        }

        function filterAndRenderHanzi() {
            let list = [...hanziState.allChars];

            // 1. Search Query
            if (hanziState.searchQuery.trim()) {
                const rawQ = hanziState.searchQuery.trim();
                const qLower = rawQ.toLowerCase();
                const qNoAcc = window.removeAccents(rawQ);

                list = list.filter(item => {
                    const hz = (item.hanzi || item.char || item.character || '').toLowerCase();
                    const py = (item.pinyin || item.py || '').toLowerCase();
                    const pyNoAcc = window.removeAccents(py);
                    const vi = (item.meaning || item.meaning_vi || item.vietnamese || item.vi || '').toLowerCase();
                    const viNoAcc = window.removeAccents(vi);
                    const rad = (item.radical || '').toLowerCase();
                    const rm = (item.radical_vietnamese || item.radical_meaning || '').toLowerCase();
                    const rmNoAcc = window.removeAccents(rm);
                    const st = (item.story || '').toLowerCase();
                    const stNoAcc = window.removeAccents(st);

                    return hz.includes(qLower) || 
                           py.includes(qLower) || pyNoAcc.includes(qNoAcc) || 
                           vi.includes(qLower) || viNoAcc.includes(qNoAcc) || 
                           rad.includes(qLower) || 
                           rm.includes(qLower) || rmNoAcc.includes(qNoAcc) || 
                           st.includes(qLower) || stNoAcc.includes(qNoAcc);
                });
            }

            // 2. Stroke Filter
            if (hanziState.strokeFilter !== 'all') {
                if (hanziState.strokeFilter === '1-3') list = list.filter(i => (i.strokes || 0) <= 3);
                else if (hanziState.strokeFilter === '4-6') list = list.filter(i => (i.strokes || 0) >= 4 && (i.strokes || 0) <= 6);
                else if (hanziState.strokeFilter === '7-9') list = list.filter(i => (i.strokes || 0) >= 7 && (i.strokes || 0) <= 9);
                else if (hanziState.strokeFilter === '10+') list = list.filter(i => (i.strokes || 0) >= 10);
            }

            // 3. Type Filter
            if (hanziState.typeFilter !== 'all') {
                list = list.filter(i => {
                    const t = (i.type || i.structure || '').toLowerCase();
                    return t.includes(hanziState.typeFilter.toLowerCase());
                });
            }

            // 4. Sort Order
            if (hanziState.sortOrder === 'strokes-asc') {
                list.sort((a, b) => (a.strokes || 0) - (b.strokes || 0));
            } else if (hanziState.sortOrder === 'strokes-desc') {
                list.sort((a, b) => (b.strokes || 0) - (a.strokes || 0));
            } else if (hanziState.sortOrder === 'pinyin') {
                list.sort((a, b) => (a.pinyin || '').localeCompare(b.pinyin || ''));
            }

            hanziState.filteredChars = list;

            const totalPages = Math.ceil(list.length / hanziState.perPage) || 1;
            if (hanziState.currentPage > totalPages) hanziState.currentPage = totalPages;
            if (hanziState.currentPage < 1) hanziState.currentPage = 1;

            const startIndex = (hanziState.currentPage - 1) * hanziState.perPage;
            const pageItems = list.slice(startIndex, startIndex + hanziState.perPage);

            const wrapper = document.createElement('div');
            wrapper.className = 'hanzi-module-wrapper';

            const bannerTitle = hanziState.data.title || `TỔNG HỢP CHỮ HÁN HSK - ${hanziState.level.toUpperCase()}`;
            const totalCount = hanziState.allChars.length;

            wrapper.innerHTML = `
                <div class="hanzi-banner">
                    <div>
                        <div class="hanzi-banner-title">${escapeHtml(bannerTitle)}</div>
                                            </div>
                    <div class="hanzi-banner-actions">
                        <button class="hanzi-btn-action" onclick="startHanziFlashcards()">
                            🎴 Flashcard (${totalCount} chữ)
                        </button>
                        <button class="hanzi-btn-secondary" onclick="randomHanziModal()">
                            🎲 Chữ ngẫu nhiên
                        </button>
                    </div>
                </div>

                <div class="hanzi-filter-bar">
                    <input type="text" id="hanziSearchInput" class="hanzi-search-input" 
                        placeholder="🔍 Tìm kiếm chữ Hán trong cấp độ ${hanziState.level.toUpperCase()}..." 
                        value="${escapeHtml(hanziState.searchQuery)}"
                        oninput="onHanziSearchInput(this.value)" />

                    <select id="hanziStrokeSelect" class="hanzi-select-filter" onchange="onHanziStrokeChange(this.value)">
                        <option value="all" ${hanziState.strokeFilter === 'all' ? 'selected' : ''}>Tất cả số nét</option>
                        <option value="1-3" ${hanziState.strokeFilter === '1-3' ? 'selected' : ''}>1 - 3 nét</option>
                        <option value="4-6" ${hanziState.strokeFilter === '4-6' ? 'selected' : ''}>4 - 6 nét</option>
                        <option value="7-9" ${hanziState.strokeFilter === '7-9' ? 'selected' : ''}>7 - 9 nét</option>
                        <option value="10+" ${hanziState.strokeFilter === '10+' ? 'selected' : ''}>10+ nét</option>
                    </select>

                    <select id="hanziTypeSelect" class="hanzi-select-filter" onchange="onHanziTypeChange(this.value)">
                        <option value="all" ${hanziState.typeFilter === 'all' ? 'selected' : ''}>Tất cả loại chữ</option>
                        <option value="hình thanh" ${hanziState.typeFilter === 'hình thanh' ? 'selected' : ''}>Hình thanh</option>
                        <option value="hội ý" ${hanziState.typeFilter === 'hội ý' ? 'selected' : ''}>Hội ý</option>
                        <option value="chỉ sự" ${hanziState.typeFilter === 'chỉ sự' ? 'selected' : ''}>Chỉ sự</option>
                        <option value="tượng hình" ${hanziState.typeFilter === 'tượng hình' ? 'selected' : ''}>Tượng hình</option>
                    </select>

                    <select id="hanziSortSelect" class="hanzi-select-filter" onchange="onHanziSortChange(this.value)">
                        <option value="default" ${hanziState.sortOrder === 'default' ? 'selected' : ''}>Mặc định</option>
                        <option value="strokes-asc" ${hanziState.sortOrder === 'strokes-asc' ? 'selected' : ''}>Số nét (Ít ▶ Nhiều)</option>
                        <option value="strokes-desc" ${hanziState.sortOrder === 'strokes-desc' ? 'selected' : ''}>Số nét (Nhiều ▶ Ít)</option>
                        <option value="pinyin" ${hanziState.sortOrder === 'pinyin' ? 'selected' : ''}>Phiên âm (A - Z)</option>
                    </select>
                </div>

                <div class="hanzi-pagination-bar">
                    <div style="font-size:14px;color:#64748b;font-weight:600;">
                        Hiển thị <b>${list.length > 0 ? startIndex + 1 : 0} - ${Math.min(startIndex + hanziState.perPage, list.length)}</b> trên <b>${list.length}</b> chữ Hán
                    </div>
                    ${renderHanziPaginationButtons(hanziState.currentPage, totalPages)}
                </div>

                <div class="hanzi-grid">
                    ${pageItems.length === 0 ? `
                        <div style="grid-column:1/-1;text-align:center;padding:40px;background:white;border-radius:16px;color:#a0526a;">
                            🔍 Không tìm thấy chữ Hán phù hợp với từ khóa!
                        </div>
                    ` : pageItems.map(item => renderHanziCardHtml(item)).join('')}
                </div>

                ${list.length > hanziState.perPage ? `
                    <div class="hanzi-pagination-bar" style="margin-top:16px;justify-content:center;">
                        ${renderHanziPaginationButtons(hanziState.currentPage, totalPages)}
                    </div>
                ` : ''}
            `;

            contentInner.innerHTML = '';
            contentInner.appendChild(wrapper);

            const searchEl = document.getElementById('hanziSearchInput');
            if (searchEl && hanziState.searchQuery) {
                searchEl.focus();
                searchEl.setSelectionRange(searchEl.value.length, searchEl.value.length);
            }
        }

        function renderHanziPaginationButtons(current, total) {
            if (total <= 1) return '';
            let html = `<div style="display:flex;gap:6px;align-items:center;">`;

            html += `<button class="hanzi-page-btn" ${current === 1 ? 'disabled' : ''} onclick="changeHanziPage(${current - 1})">◀ Trước</button>`;

            let start = Math.max(1, current - 2);
            let end = Math.min(total, start + 4);
            if (end - start < 4) start = Math.max(1, end - 4);

            for (let i = start; i <= end; i++) {
                html += `<button class="hanzi-page-btn ${i === current ? 'active' : ''}" onclick="changeHanziPage(${i})">${i}</button>`;
            }

            html += `<button class="hanzi-page-btn" ${current === total ? 'disabled' : ''} onclick="changeHanziPage(${current + 1})">Tiếp ▶</button>`;
            html += `</div>`;
            return html;
        }

        function renderHanziCardHtml(item) {
            const ex = item.examples && item.examples.length > 0 ? item.examples[0] : null;
            const radMeaning = item.radical_vietnamese || item.radical_meaning || '';
            return `
                <div class="hanzi-card" onclick="openHanziDetailModal('${escapeQuotes(item.hanzi)}')">
                    <div class="hanzi-card-header">
                        <div class="tian-zi-ge" style="width:72px;height:72px;font-size:42px;font-weight:bold;">
                            ${escapeHtml(item.hanzi)}
                        </div>
                        <div class="hanzi-main-meta">
                            <div class="hanzi-pinyin-row">
                                <span class="hanzi-pinyin-text">${escapeHtml(item.pinyin || '')}</span>
                                <button class="audio-btn" style="background:#f3e8ff;border:none;border-radius:50%;width:28px;height:28px;cursor:pointer;font-size:12px;" 
                                    onclick="event.stopPropagation();playAudio('${escapeQuotes(item.hanzi)}')" title="Nghe đọc">🔊</button>
                                <span class="hanzi-strokes-tag">${item.strokes || '?'} nét</span>
                            </div>
                            <div class="hanzi-meaning-text">${escapeHtml(item.meaning || '')}</div>
                            <div style="display:flex;gap:6px;flex-wrap:wrap;margin-top:4px;">
                                ${item.radical ? `<span class="hanzi-radical-tag" title="Bộ thủ: ${escapeHtml(radMeaning)}">Bộ ${escapeHtml(item.radical)} ${radMeaning ? `(${escapeHtml(radMeaning)})` : ''}</span>` : ''}
                                ${item.type ? `<span class="hanzi-radical-tag" style="background:#fdf2f8;color:#be185d;border-color:#fbcfe8;">${escapeHtml(item.type)}</span>` : ''}
                            </div>
                        </div>
                    </div>

                    ${item.story ? `
                        <div class="hanzi-story-quote">
                            <span>💡</span>
                            <span><b>Chiết tự:</b> ${escapeHtml(item.story)}</span>
                        </div>
                    ` : ''}

                    ${ex ? `
                        <div class="hanzi-example-preview">
                            <span style="font-weight:700;color:#7e22ce;">${escapeHtml(ex.cn)}</span>
                            <span style="color:#64748b;">(${escapeHtml(ex.py)})</span>
                            <span style="color:#334155;">- ${escapeHtml(ex.vi)}</span>
                        </div>
                    ` : ''}

                    <div class="hanzi-card-actions">
                        <button class="btn-hanzi-detail" onclick="event.stopPropagation();openHanziDetailModal('${escapeQuotes(item.hanzi)}')">
                            📖 Chi tiết & Nét vẽ
                        </button>
                        <button class="btn-hanzi-fc" onclick="event.stopPropagation();addHanziToFlashcards('${escapeQuotes(item.hanzi)}')">
                            ⭐ Ôn tập
                        </button>
                    </div>
                </div>
            `;
        }

        function onHanziSearchInput(val) {
            hanziState.searchQuery = val;
            hanziState.currentPage = 1;
            filterAndRenderHanzi();
        }

        function onHanziStrokeChange(val) {
            hanziState.strokeFilter = val;
            hanziState.currentPage = 1;
            filterAndRenderHanzi();
        }

        function onHanziTypeChange(val) {
            hanziState.typeFilter = val;
            hanziState.currentPage = 1;
            filterAndRenderHanzi();
        }

        function onHanziSortChange(val) {
            hanziState.sortOrder = val;
            hanziState.currentPage = 1;
            filterAndRenderHanzi();
        }

        function changeHanziPage(p) {
            hanziState.currentPage = p;
            filterAndRenderHanzi();
            const contentArea = document.getElementById('contentArea');
            if (contentArea) contentArea.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }

        function translateStrokeNameToVietnamese(s) {
            if (!s) return '';
            const map = {
                '横': 'Nét ngang',
                '竖': 'Nét sổ',
                '撇': 'Nét phẩy',
                '捺': 'Nét mác',
                '点': 'Nét chấm',
                '提': 'Nét hất',
                '折': 'Nét gập',
                '钩': 'Nét móc',
                '弯': 'Nét cong',
                '斜': 'Nét xiên',
                '卧': 'Nét nằm',
                '横撇': 'Ngang phẩy',
                '横折': 'Ngang gập',
                '横钩': 'Ngang móc',
                '横折钩': 'Ngang gập móc',
                '横折提': 'Ngang gập hất',
                '横折折': 'Ngang gập gập',
                '横折折折': 'Ngang gập gập gập',
                '横折折折钩': 'Ngang gập gập gập móc',
                '横折弯钩': 'Ngang gập cong móc',
                '横撇弯钩': 'Ngang phẩy cong móc',
                '竖折': 'Sổ gập',
                '竖钩': 'Sổ móc',
                '竖提': 'Sổ hất',
                '竖弯': 'Sổ cong',
                '竖弯钩': 'Sổ cong móc',
                '竖折折': 'Sổ gập gập',
                '竖折撇': 'Sổ gập phẩy',
                '竖折折钩': 'Sổ gập gập móc',
                '撇折': 'Phẩy gập',
                '撇点': 'Phẩy chấm',
                '斜钩': 'Xiên móc',
                '卧钩': 'Nằm móc',
                '弯钩': 'Cong móc'
            };
            return map[s] ? `${map[s]} (${s})` : `${s}`;
        }

        let currentHanziWriter = null;
        let isOutlineVisible = true;

        function openHanziDetailModal(hanziChar) {
            const list = hanziState.allChars;
            const index = list.findIndex(i => i.hanzi === hanziChar);
            if (index === -1) return;
            const item = list[index];

            let modal = document.getElementById('hanziDetailModal');
            if (!modal) {
                modal = document.createElement('div');
                modal.id = 'hanziDetailModal';
                modal.className = 'modal-overlay';
                document.body.appendChild(modal);
            }

            const strokeOrderList = item.stroke_order || [];
            const strokeChipsHtml = strokeOrderList.map((s, idx) => `
                <span class="stroke-chip" style="background:#faf5ff;border:1px solid #d8b4fe;color:#7e22ce;">
                    <b>${idx + 1}.</b> ${escapeHtml(translateStrokeNameToVietnamese(s))}
                </span>
            `).join('');

            const examplesHtml = (item.examples || []).map(ex => `
                <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;padding:10px 14px;margin-bottom:8px;display:flex;justify-content:space-between;align-items:center;">
                    <div>
                        <div style="font-size:16px;font-weight:700;color:#7e22ce;">${escapeHtml(ex.cn)} <span style="font-size:14px;font-weight:600;color:#2563eb;">(${escapeHtml(ex.py)})</span></div>
                        <div style="font-size:13.5px;color:#334155;margin-top:2px;">${escapeHtml(ex.vi)}</div>
                    </div>
                    <button class="audio-btn" style="background:#f3e8ff;border:none;border-radius:50%;width:32px;height:32px;cursor:pointer;" onclick="playAudio('${escapeQuotes(ex.cn)}')">🔊</button>
                </div>
            `).join('');

            const prevChar = index > 0 ? list[index - 1].hanzi : null;
            const nextChar = index < list.length - 1 ? list[index + 1].hanzi : null;

            modal.innerHTML = `
                <div class="hanzi-modal-content">
                    <div class="hanzi-modal-header" style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:16px;padding-bottom:12px;border-bottom:1px solid #f1f5f9;">
                        <div>
                            <div style="display:flex;align-items:center;gap:10px;">
                                <span style="font-size:36px;font-weight:800;color:#6b21a8;">${escapeHtml(item.hanzi)}</span>
                                <span style="font-size:24px;font-weight:700;color:#2563eb;">${escapeHtml(item.pinyin || '')}</span>
                                <button class="audio-btn" style="background:#f3e8ff;border:none;border-radius:50%;width:34px;height:34px;cursor:pointer;font-size:16px;" onclick="playAudio('${escapeQuotes(item.hanzi)}')">🔊</button>
                            </div>
                            <div style="font-size:16px;font-weight:700;color:#1e293b;margin-top:4px;">Nghĩa: ${escapeHtml(item.meaning || '')}</div>
                        </div>
                        <button class="hanzi-modal-close" style="background:#f1f5f9;border:none;border-radius:50%;width:36px;height:36px;font-size:18px;cursor:pointer;color:#64748b;" onclick="closeHanziDetailModal()">✕</button>
                    </div>

                    <div class="hanzi-detail-body" style="display:flex;flex-direction:column;gap:16px;">
                        <!-- interactive stroke writer container -->
                        <div class="hanzi-canvas-section" id="hanziCanvasContainer">
                            <div id="tianZiGeWrapper" class="tian-zi-ge" style="width:180px;height:180px;position:relative;background:#fffdfa;transition:all 0.3s ease;overflow:hidden;border:2px solid #e11d48;border-radius:12px;box-shadow:inset 0 0 0 1px #fecdd3, 0 2px 6px rgba(225,29,72,0.08);">
                                <svg style="position:absolute;top:0;left:0;width:100%;height:100%;pointer-events:none;z-index:1;" viewBox="0 0 180 180">
                                    <rect x="0" y="0" width="180" height="180" fill="none" stroke="#f87171" stroke-width="2" />
                                    <line x1="0" y1="90" x2="180" y2="90" stroke="#fca5a5" stroke-width="1.5" stroke-dasharray="5,4" />
                                    <line x1="90" y1="0" x2="90" y2="180" stroke="#fca5a5" stroke-width="1.5" stroke-dasharray="5,4" />
                                    <line x1="0" y1="0" x2="180" y2="180" stroke="#fca5a5" stroke-width="1.5" stroke-dasharray="5,4" />
                                    <line x1="180" y1="0" x2="0" y2="180" stroke="#fca5a5" stroke-width="1.5" stroke-dasharray="5,4" />
                                </svg>
                                <div id="hanziWriterTarget" style="width:180px;height:180px;position:relative;z-index:2;background:transparent;"></div>
                            </div>
                            <div style="display:flex;flex-direction:column;gap:8px;flex:1;min-width:220px;">
                                <div style="font-size:14px;color:#7e22ce;font-weight:800;display:flex;align-items:center;gap:6px;">
                                    ✍️ MÔ PHỎNG & TẬP VIẾT
                                </div>
                                <div id="hanziQuizFeedback" style="font-size:12.5px;padding:8px 12px;border-radius:10px;background:#f8fafc;border:1px solid #e2e8f0;color:#475569;line-height:1.4;">
                                    💡 <b>Hướng dẫn:</b> Nhấn <b>"Xem mô phỏng"</b> để xem thứ tự nét viết, hoặc <b>"Bắt đầu tập viết"</b> để tự viết đè lên ô.
                                </div>
                                <div style="display:flex;flex-wrap:wrap;gap:8px;margin-top:4px;">
                                    <button onclick="animateCurrentHanzi()" style="background:linear-gradient(135deg,#9333ea,#7e22ce);color:white;border:none;padding:8px 14px;border-radius:10px;font-size:13px;font-weight:700;cursor:pointer;display:inline-flex;align-items:center;gap:5px;">
                                        🎬 Xem mô phỏng
                                    </button>
                                    <button onclick="startHanziQuiz('${escapeQuotes(item.hanzi)}')" style="background:#fef3c7;color:#b45309;border:1.5px solid #fde68a;padding:8px 14px;border-radius:10px;font-size:13px;font-weight:700;cursor:pointer;display:inline-flex;align-items:center;gap:5px;">
                                        ✍️ Bắt đầu tập viết
                                    </button>
                                    <button onclick="toggleHanziOutline()" style="background:white;color:#64748b;border:1px solid #cbd5e1;padding:8px 12px;border-radius:10px;font-size:12.5px;font-weight:600;cursor:pointer;">
                                        👁️ Ẩn/Hiện nét mờ
                                    </button>
                                </div>
                            </div>
                        </div>

                        <div style="background:#f8fafc;padding:14px;border-radius:12px;border:1px solid #e2e8f0;display:grid;grid-template-columns:1fr 1fr;gap:10px;font-size:13.5px;">
                            <div><b>Bộ thủ:</b> Bộ ${escapeHtml(item.radical || '')} ${(item.radical_vietnamese || item.radical_meaning) ? `(${escapeHtml(item.radical_vietnamese || item.radical_meaning)})` : ''}</div>
                            <div><b>Tổng số nét:</b> <span style="color:#9333ea;font-weight:800;">${item.strokes || '?'} nét</span></div>
                            <div><b>Cấu trúc:</b> ${escapeHtml(item.structure || '')}</div>
                            <div><b>Loại chữ:</b> ${escapeHtml(item.type || '')}</div>
                        </div>

                        ${strokeOrderList.length > 0 ? `
                            <div>
                                <div style="font-size:14px;font-weight:700;color:#6b21a8;margin-bottom:8px;display:flex;align-items:center;gap:6px;">
                                    ✍️ Thứ tự nét viết (${strokeOrderList.length} nét):
                                </div>
                                <div class="stroke-order-chips" style="display:flex;flex-wrap:wrap;gap:8px;">${strokeChipsHtml}</div>
                            </div>
                        ` : ''}

                        ${item.story ? `
                            <div style="background:#fffbeb;border:1px solid #fde68a;border-radius:12px;padding:12px 16px;color:#92400e;line-height:1.5;font-size:13.5px;">
                                <div style="font-weight:700;margin-bottom:4px;display:flex;align-items:center;gap:6px;">💡 CHIẾT TỰ & MẸO NHỚ CHỮ:</div>
                                <div>${escapeHtml(item.story)}</div>
                            </div>
                        ` : ''}

                        ${examplesHtml ? `
                            <div>
                                <div style="font-size:14px;font-weight:700;color:#6b21a8;margin-bottom:8px;">📝 Ví dụ câu & Từ vựng:</div>
                                ${examplesHtml}
                            </div>
                        ` : ''}

                        <div style="display:flex;justify-content:space-between;align-items:center;padding-top:12px;border-top:1px solid #f1f5f9;">
                            <button class="hanzi-page-btn" ${!prevChar ? 'disabled' : ''} onclick="openHanziDetailModal('${escapeQuotes(prevChar)}')">◀ Chữ trước</button>
                            <span style="font-size:13px;font-weight:700;color:#64748b;">${index + 1} / ${list.length}</span>
                            <button class="hanzi-page-btn" ${!nextChar ? 'disabled' : ''} onclick="openHanziDetailModal('${escapeQuotes(nextChar)}')">Chữ tiếp ▶</button>
                        </div>
                    </div>
                </div>
            `;

            modal.style.display = 'flex';
            setTimeout(() => initHanziWriter(item.hanzi), 50);
        }

        function closeHanziDetailModal() {
            const modal = document.getElementById('hanziDetailModal');
            if (modal) modal.style.display = 'none';
        }

        function initHanziWriter(hanziChar) {
            const container = document.getElementById('hanziWriterTarget');
            if (!container) return;
            container.innerHTML = '';
            isOutlineVisible = true;

            if (typeof HanziWriter !== 'undefined') {
                try {
                    currentHanziWriter = HanziWriter.create('hanziWriterTarget', hanziChar, {
                        width: 180,
                        height: 180,
                        padding: 10,
                        showOutline: true,
                        strokeAnimationSpeed: 1,
                        delayBetweenStrokes: 250,
                        strokeColor: '#7e22ce',
                        outlineColor: '#cbd5e1',
                        drawingWidth: 12,
                        drawingColor: '#9333ea',
                        showCharacter: true
                    });
                    // Automatically play stroke animation on open
                    currentHanziWriter.animateCharacter();
                } catch (e) {
                    console.error('HanziWriter init error:', e);
                    container.innerHTML = `<div style="font-size:80px;line-height:180px;text-align:center;color:#7e22ce;font-weight:bold;">${escapeHtml(hanziChar)}</div>`;
                }
            } else {
                container.innerHTML = `<div style="font-size:80px;line-height:180px;text-align:center;color:#7e22ce;font-weight:bold;">${escapeHtml(hanziChar)}</div>`;
            }
        }

        function animateCurrentHanzi() {
            if (!currentHanziWriter) return;
            const feedback = document.getElementById('hanziQuizFeedback');
            if (feedback) {
                feedback.className = '';
                feedback.style.background = '#f3e8ff';
                feedback.style.borderColor = '#d8b4fe';
                feedback.style.color = '#6b21a8';
                feedback.innerHTML = `🎬 <b>Đang mô phỏng nét viết...</b> Hãy quan sát kỹ thứ tự và hướng viết từng nét!`;
            }
            currentHanziWriter.showCharacter();
            currentHanziWriter.animateCharacter();
        }

        function toggleHanziOutline() {
            if (!currentHanziWriter) return;
            isOutlineVisible = !isOutlineVisible;
            if (isOutlineVisible) {
                currentHanziWriter.showOutline();
            } else {
                currentHanziWriter.hideOutline();
            }
        }

        function startHanziQuiz(hanziChar) {
            if (!currentHanziWriter) return;
            const wrapper = document.getElementById('tianZiGeWrapper');
            const feedback = document.getElementById('hanziQuizFeedback');

            if (feedback) {
                feedback.style.background = '#fef3c7';
                feedback.style.borderColor = '#fde68a';
                feedback.style.color = '#92400e';
                feedback.innerHTML = `✍️ <b>Chế độ Bắt đầu Tập viết:</b> Dùng chuột hoặc tay vẽ từng nét lên ô. <b>Viết ĐÚNG mới hiển thị nét!</b>`;
            }

            if (wrapper) {
                wrapper.style.borderColor = '#3b82f6';
                wrapper.style.boxShadow = '0 0 0 4px rgba(59,130,246,0.15)';
            }

            currentHanziWriter.quiz({
                onMistake: function(strokeData) {
                    if (wrapper) {
                        wrapper.style.borderColor = '#ef4444';
                        wrapper.style.boxShadow = '0 0 0 4px rgba(239,68,68,0.25)';
                        wrapper.style.animation = 'none';
                        setTimeout(() => wrapper.style.animation = 'shakeHanzi 0.35s ease-in-out', 10);
                    }
                    if (feedback) {
                        feedback.style.background = '#fef2f2';
                        feedback.style.borderColor = '#fca5a5';
                        feedback.style.color = '#991b1b';
                        feedback.innerHTML = `❌ <b>VIẾT SAI NÉT!</b> Sai nét số <b>${strokeData.strokeNum + 1}</b> (Còn lại ${strokeData.mistakesOnStroke} lần thử). Vui lòng quan sát thứ tự nét và vẽ lại!`;
                    }
                    if (navigator.vibrate) navigator.vibrate(150);
                },
                onCorrectStroke: function(strokeData) {
                    if (wrapper) {
                        wrapper.style.borderColor = '#22c55e';
                        wrapper.style.boxShadow = '0 0 0 4px rgba(34,197,94,0.2)';
                    }
                    if (feedback) {
                        feedback.style.background = '#f0fdf4';
                        feedback.style.borderColor = '#86efac';
                        feedback.style.color = '#166534';
                        feedback.innerHTML = `✅ <b>VIẾT ĐÚNG!</b> Nét <b>${strokeData.strokeNum + 1}</b> đã hiển thị. Tiếp tục viết nét kế tiếp...`;
                    }
                },
                onComplete: function(summaryData) {
                    if (wrapper) {
                        wrapper.style.borderColor = '#9333ea';
                        wrapper.style.boxShadow = '0 0 0 6px rgba(147,51,234,0.25)';
                    }
                    if (feedback) {
                        feedback.style.background = '#faf5ff';
                        feedback.style.borderColor = '#c084fc';
                        feedback.style.color = '#6b21a8';
                        feedback.innerHTML = `🎉 <b>XUẤT SẮC!</b> Bạn đã viết thành công toàn bộ chữ <b>"${escapeHtml(hanziChar)}"</b>! Số lần vẽ sai: ${summaryData.totalMistakes}.`;
                    }
                }
            });
        }

        function randomHanziModal() {
            if (!hanziState.allChars || hanziState.allChars.length === 0) return;
            const randomIndex = Math.floor(Math.random() * hanziState.allChars.length);
            const item = hanziState.allChars[randomIndex];
            if (item) openHanziDetailModal(item.hanzi);
        }

        async function startHanziFlashcards() {
            flashcardType = 'hanzi';
            
            const savedIndex = localStorage.getItem(`flashcard_index_hanzi_${currentLevel}`);
            if (savedIndex !== null && !confirm('Tiếp tục từ vị trí cũ hay học lại từ đầu?')) {
                flashcardIndex = parseInt(savedIndex);
            } else {
                flashcardIndex = 0;
            }

            let chars = [];
            if (hanziState && hanziState.allChars && hanziState.allChars.length > 0) {
                chars = hanziState.allChars;
            } else {
                const levelData = await loadModuleData('hanzi', currentLevel);
                if (levelData && levelData.chars) {
                    chars = levelData.chars;
                } else if (Array.isArray(levelData)) {
                    chars = levelData;
                }
            }

            if (!chars || chars.length === 0) {
                alert('Không có dữ liệu chữ Hán để ôn tập!');
                return;
            }

            flashcardData = chars.map(item => ({
                cn: item.hanzi || item.cn,
                py: item.pinyin || item.py || '',
                vi: item.meaning || item.vi || '',
                story: item.story || '',
                radical: item.radical || '',
                radical_meaning: item.radical_meaning || '',
                strokes: item.strokes || '',
                examples: item.examples || []
            }));

            flashcardShowing = false;
            const fcModal = document.getElementById('flashcardModal');
            if (fcModal) fcModal.classList.add('active');
            showFlashcard();
        }

        function addHanziToFlashcards(hanziChar) {
            const item = hanziState.allChars.find(i => i.hanzi === hanziChar);
            if (!item) return;
            const user = auth ? auth.currentUser : null;
            const uid = user ? user.uid : 'guest';
            const profile = window.getUserProfile(uid);
            if (!profile.unmasteredFlashcards) profile.unmasteredFlashcards = [];

            const exists = profile.unmasteredFlashcards.some(c => c.cn === item.hanzi);
            if (!exists) {
                profile.unmasteredFlashcards.push({
                    cn: item.hanzi,
                    py: item.pinyin,
                    vi: item.meaning,
                    story: item.story,
                    radical: item.radical,
                    radical_meaning: item.radical_meaning,
                    strokes: item.strokes
                });
                window.saveUserProfile(profile);
                alert(`✅ Đã thêm chữ "${item.hanzi}" (${item.pinyin}) vào danh sách ôn tập Flashcard!`);
            } else {
                alert(`⚠️ Chữ "${item.hanzi}" đã có trong danh sách ôn tập!`);
            }
        }

function renderVocabLessons(level, data) {
    cachedData['vocab-' + level] = data;
    const wrapper = document.createElement('div');
    wrapper.className = level;

    const layout = document.createElement('div');
layout.className = 'lesson-wrapper';  
layout.style.cssText = 'display:flex;gap:24px;align-items:flex-start;width:100%;max-width:100%;overflow:hidden;';

    // Sidebar
    const sidebar = document.createElement('div');
    sidebar.className = 'lesson-sidebar';
    sidebar.style.cssText = `
        width:300px;flex-shrink:0;background:white;border-radius:16px;
        border:1px solid #fce7f3;box-shadow:var(--shadow-sm);
        position:sticky;top:80px;max-height:calc(100vh - 120px);
        overflow-y:auto;overflow-x:hidden;padding:12px 0;
    `;

    const sidebarTitle = document.createElement('div');
    sidebarTitle.className = 'sidebar-title';
    sidebarTitle.textContent = 'Danh sách bài học';
    sidebar.appendChild(sidebarTitle);

    // Main content
    const mainContent = document.createElement('div');
    mainContent.className = 'lesson-main';
    mainContent.style.cssText = 'flex:1;min-width:0;';

    // Banner
    const banner = document.createElement('div');
    banner.style.cssText = `
        background: linear-gradient(135deg, #fdf2f8, #fce7f3);
        padding: 20px 30px; border-radius: 16px; margin-bottom: 25px;
        border: 1px solid #fbcfe8;
    `;
    banner.innerHTML = `
        <div style="display:inline-block;background:rgba(255,255,255,0.6);padding:4px 16px;border-radius:20px;font-size:12px;font-weight:700;color:#be185d;border:1px solid rgba(236,72,153,0.2);margin-bottom:8px;">${data.badge || level.toUpperCase()}</div>
        <h1 style="font-family:'Lexend',sans-serif;font-size:28px;color:#be185d;">${data.title}</h1>
        ${data.subtitle ? `<div style="font-size:16px;color:#db2777;font-weight:500;">${data.subtitle}</div>` : ''}
    `;
    mainContent.appendChild(banner);

    // Local Search Input cho Từ vựng
    const vocabSearchBox = document.createElement('div');
    vocabSearchBox.style.cssText = 'margin-bottom:20px;display:flex;gap:10px;align-items:center;position:relative;';
    vocabSearchBox.innerHTML = `
        <div style="position:relative;flex:1;display:flex;align-items:center;">
            <input type="text" class="vocab-local-search-input" placeholder="🔍 Tìm kiếm từ vựng trong cấp độ ${level.toUpperCase()}..." 
                   style="width:100%;padding:10px 16px 10px 38px;border:1.5px solid #fbcfe8;border-radius:12px;font-size:14px;outline:none;background:white;box-shadow:0 2px 8px rgba(245,158,11,0.08);transition:all 0.2s;" 
                   oninput="window.filterLocalVocab(this.value, '${level}')"
                   onfocus="window.filterLocalVocab(this.value, '${level}')" />
            <div id="vocabSearchDropdown" class="local-search-dropdown" style="display:none;position:absolute;top:calc(100% + 6px);left:0;right:0;z-index:999;background:white;border:1px solid #fbcfe8;border-radius:14px;box-shadow:0 12px 30px rgba(0,0,0,0.15);max-height:360px;overflow-y:auto;"></div>
        </div>
    `;
    mainContent.appendChild(vocabSearchBox);

    const lessonsContainer = document.createElement('div');

    data.lessons.forEach((lesson, index) => {
        // Sidebar item
        const lessonItem = document.createElement('div');
        lessonItem.className = 'lesson-item' + (index === 0 ? ' active' : '');
        lessonItem.style.cssText = `
            padding:10px 20px;cursor:pointer;transition:all 0.3s ease;
            font-size:14px;color:#4a5568;border-left:3px solid transparent;
            display:flex;align-items:center;gap:8px;
        `;
        if (index === 0) {
            lessonItem.style.cssText += 'background:#fdf2f8;color:#be185d;font-weight:600;border-left-color:#ec4899;';
        }
        const isLearned = window.isLessonLearned(level, lesson.id);
        lessonItem.innerHTML = `
            <span class="lesson-num" style="background:${index === 0 ? '#ec4899' : '#fce7f3'};color:${index === 0 ? 'white' : '#be185d'};font-size:10px;font-weight:700;padding:2px 8px;border-radius:10px;min-width:28px;text-align:center;">${lesson.id}</span>
            <span>${lesson.title}</span>
            ${isLearned ? '<span class="learned-badge" style="margin-left:auto;font-size:12px;">✅</span>' : ''}
        `;
        lessonItem.dataset.level = level;
        lessonItem.dataset.lessonId = lesson.id;
        lessonItem.onclick = function(e) {
            const lv = this.dataset.level;
            const lid = parseInt(this.dataset.lessonId);
            showVocabLesson(lv, lid);
        };
        sidebar.appendChild(lessonItem);

        const lessonDiv = document.createElement('div');
        lessonDiv.id = `vocab-lesson-${level}-${lesson.id}`;
        lessonDiv.className = 'lesson';
        if (index === 0) lessonDiv.classList.add('active');

        const lessonHeader = document.createElement('div');
        lessonHeader.style.cssText = 'display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;padding:14px 20px;background:white;border-radius:14px;border:1px solid #fce7f3;box-shadow:0 2px 6px rgba(0,0,0,0.02);';
        const isLearnedVocab = window.isLessonLearned(level, lesson.id);
        const safeTitleVocab = (lesson.title || ('Bài ' + lesson.id)).replace(/'/g, "\\'");
        lessonHeader.innerHTML = `
            <div>
                <span style="font-size:11px;font-weight:700;color:#db2777;background:#fdf2f8;padding:2px 8px;border-radius:10px;text-transform:uppercase;">${level.toUpperCase()} - Từ vựng Bài ${lesson.id}</span>
                <h2 style="font-size:20px;color:#1e293b;font-weight:700;margin:4px 0 0 0;font-family:'Lexend',sans-serif;">${lesson.title}</h2>
            </div>
            <button class="mark-learned-btn" onclick="window.toggleLessonLearned('${level}', '${lesson.id}', '${safeTitleVocab}', 'Từ vựng', this)" style="padding:8px 16px;font-size:13px;font-weight:700;border-radius:10px;cursor:pointer;transition:all 0.2s;display:flex;align-items:center;gap:6px;${isLearnedVocab ? 'background:#e8f5e9;color:#15803d;border:1px solid #86efac;' : 'background:white;color:#be185d;border:1px solid #fbcfe8;'}">
                ${isLearnedVocab ? '✅ Đã học' : '📌 Đánh dấu đã học'}
            </button>
        `;
        lessonDiv.appendChild(lessonHeader);

        const tabNav = document.createElement('div');
        tabNav.className = 'tab-nav';

        const vocabTabBtn = document.createElement('button');
        vocabTabBtn.className = 'tab-btn active';
        vocabTabBtn.dataset.tab = 'vocab';
        vocabTabBtn.textContent = 'Từ vựng';
        vocabTabBtn.onclick = () => switchVocabTab(level, lesson.id, 'vocab');
        tabNav.appendChild(vocabTabBtn);

        if (lesson.exercises && lesson.exercises.length > 0) {
            const exerciseTabBtn = document.createElement('button');
            exerciseTabBtn.className = 'tab-btn';
            exerciseTabBtn.dataset.tab = 'exercise';
            exerciseTabBtn.textContent = 'Bài Tập';
            exerciseTabBtn.onclick = () => switchVocabTab(level, lesson.id, 'exercise');
            tabNav.appendChild(exerciseTabBtn);
        }

        lessonDiv.appendChild(tabNav);

        const tabContent = document.createElement('div');
        tabContent.className = 'tab-content';

        const vocabPane = document.createElement('div');
        vocabPane.id = `vocab-tab-${level}-${lesson.id}-vocab`;
        vocabPane.className = 'tab-pane active';

        const vocabCard = document.createElement('div');
        vocabCard.className = 'card';

        let words = extractVocabWordsFromLesson(lesson);

        if (words.length > 0) {
            const levelColors = {
                hsk1: '#C8E6C9',
                hsk2: '#FED7AA',
                hsk3: '#FBCFE8',
                hsk4: '#E9D5FF',
                hsk5: '#BAE6FD',
                hsk6: '#F5AACE'
            };
            const borderColor = levelColors[level] || '#FED7AA';

            words.forEach((word) => {
                const wordDiv = document.createElement('div');
                wordDiv.className = 'vocab-word-card';
                wordDiv.dataset.hanzi = word.hanzi || word.cn || '';
                wordDiv.dataset.pinyin = word.pinyin || word.py || '';
                wordDiv.dataset.meaning = word.meaning || word.vi || '';
                wordDiv.style.cssText = `
                    background: #f8f9fa;
                    border-radius: 12px;
                    padding: 18px 20px;
                    margin-bottom: 16px;
                    border-left: 4px solid ${borderColor};
                    box-shadow: 0 2px 8px rgba(0,0,0,0.02);
                `;
                let examplesHtml = '';
                if (word.examples && word.examples.length > 0) {
                    examplesHtml = word.examples.map((ex) => {
                        const cnText = typeof ex === 'string' ? ex : (ex.cn || ex.hanzi || '');
                        const pyText = typeof ex === 'object' ? (ex.py || ex.pinyin || '') : '';
                        const viText = typeof ex === 'object' ? (ex.vi || ex.meaning || '') : '';
                        
                        return `
                            <div class="example-with-audio">
                                <div class="text-group">
                                    <div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap;margin-bottom:6px;">
                                        <span class="cn">${cnText}</span>
                                        <button onclick="togglePinyinForThis(event)" style="padding:3px 12px;border:none;border-radius:12px;background:#ec4899;color:white;font-size:11px;font-weight:600;cursor:pointer;">Phiên âm</button>
                                        <button onclick="toggleNghiaForThis(event)" style="padding:3px 12px;border:none;border-radius:12px;background:#8b5cf6;color:white;font-size:11px;font-weight:600;cursor:pointer;">Nghĩa</button>
                                    </div>
                                    <span class="py" style="display:none;">${pyText}</span>
                                    <span class="vi" style="display:none;">${viText}</span>
                                </div>
                                <button class="audio-btn" onclick="event.stopPropagation();playAudio('${cnText}')">🔊</button>
                            </div>
                        `;
                    }).join('');
                }
                wordDiv.innerHTML = `
                    <div style="display:flex;align-items:center;gap:14px;flex-wrap:wrap;margin-bottom:10px;">
                        <span style="font-size:24px;font-weight:700;color:#1e293b;font-family:'Kaiti','SimSun',serif,sans-serif;">${word.hanzi || word.cn || ''}</span>
                        <span style="color:#db2777;font-size:15px;font-weight:600;">${word.pinyin || word.py || ''}</span>
                        ${word.word_type ? `<span style="background:#fce7f3;padding:3px 12px;border-radius:12px;font-size:12px;font-weight:600;color:#be185d;">${word.word_type}</span>` : ''}
                        <button class="audio-btn" onclick="event.stopPropagation();playAudio('${(word.hanzi || word.cn || '').replace(/'/g, "\\'")}')" style="margin-left:auto;padding:4px 12px;border:none;border-radius:14px;background:#fce7f3;color:#be185d;font-weight:700;font-size:13px;cursor:pointer;display:inline-flex;align-items:center;gap:4px;" title="Nghe">🔊</button>
                    </div>
                    <div style="color:#475569;font-size:15px;margin-top:6px;line-height:1.6;font-weight:500;">${word.meaning || word.vi || ''}</div>
                    ${word.note ? `<div style="color:#854d0e;background:#fefce8;padding:6px 12px;border-radius:8px;font-size:13px;margin-top:8px;border:1px solid #fef08a;">💡 ${word.note}</div>` : ''}

                    ${(word.image || word.video) ? `
                        <div class="vocab-media-container">
                            ${word.image ? `
                                <div class="vocab-img-box">
                                    <div style="font-size:12px;font-weight:700;color:#0284c7;margin-bottom:6px;display:flex;align-items:center;gap:4px;">🖼️ Hình ảnh minh họa:</div>
                                    <img src="${word.image}" alt="${word.hanzi || 'Từ vựng'}" />
                                </div>
                            ` : ''}
                            ${word.video ? `
                                <div class="vocab-video-box">
                                    <div style="font-size:12px;font-weight:700;color:#be185d;margin-bottom:6px;display:flex;align-items:center;gap:4px;">🎬 Video phát âm / khẩu hình mẫu:</div>
                                    <div class="video-responsive-aspect">
                                        <iframe src="${word.video}" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>
                                    </div>
                                </div>
                            ` : ''}
                        </div>
                    ` : ''}

                    ${examplesHtml ? `
                        <div class="example" style="margin-top:14px;padding:14px 16px;border-radius:12px;background:#FFFAFC;border:1px solid #FFD1DC;">
                            <div class="example-label" style="font-weight:700;color:#db2777;margin-bottom:8px;font-size:13.5px;">Ví dụ:</div>
                            ${examplesHtml}
                        </div>
                    ` : ''}
                `;
                vocabCard.appendChild(wordDiv);
            });
        } else {
            vocabCard.innerHTML = `<p style="color:#999;text-align:center;padding:20px;">Chưa có từ vựng cho bài này.</p>`;
        }

        vocabPane.appendChild(vocabCard);
        tabContent.appendChild(vocabPane);

        if (lesson.exercises && lesson.exercises.length > 0) {
            const exercisePane = document.createElement('div');
            exercisePane.id = `vocab-tab-${level}-${lesson.id}-exercise`;
            exercisePane.className = 'tab-pane';

            const exerciseCard = document.createElement('div');
            exerciseCard.className = 'card';

            const exHeader = document.createElement('div');
            exHeader.style.cssText = 'background:#fdf2f8;border:1px solid #fbcfe8;border-radius:14px;padding:14px 18px;margin-bottom:18px;';
            exHeader.innerHTML = `
                <h4 style="margin:0 0 4px 0;color:#be185d;font-size:16px;font-weight:700;">📝 Bài tập ${lesson.exercises.length} câu - ${lesson.title || ('Bài ' + lesson.id)}</h4>
                <p style="margin:0;color:#64748b;font-size:12.5px;">Hoàn thành các câu hỏi bên dưới và bấm "Nộp bài & Chấm điểm" để ghi nhận điểm số vào Trang cá nhân.</p>
            `;
            exerciseCard.appendChild(exHeader);

            const exContainer = document.createElement('div');
            lesson.exercises.forEach((ex, idx) => {
                const exItem = renderExerciseItem(ex, idx, level, lesson.id, lesson.exercises.length, 'vocab-ex');
                exContainer.appendChild(exItem);
            });
            exerciseCard.appendChild(exContainer);

            const submitBtn = document.createElement('button');
            submitBtn.style.cssText = 'width:100%;margin-top:16px;padding:12px 20px;background:linear-gradient(135deg, #ec4899, #db2777);color:white;border:none;border-radius:12px;font-size:15px;font-weight:700;cursor:pointer;box-shadow:0 4px 12px rgba(236,72,153,0.3);';
            submitBtn.innerHTML = `📊 Nộp bài & Chấm điểm (${lesson.exercises.length} câu)`;
            submitBtn.onclick = () => window.submitLessonExercises(level, lesson.id, exContainer, lesson.exercises, lesson.title || ('Bài ' + lesson.id));
            exerciseCard.appendChild(submitBtn);

            exercisePane.appendChild(exerciseCard);
            tabContent.appendChild(exercisePane);
        }

        lessonDiv.appendChild(tabContent);

        const nav = document.createElement('div');
        nav.className = 'nav';
        nav.innerHTML = `
            <button onclick="prevVocabTab('${level}', ${lesson.id})">◀ Trước</button>
            <button onclick="nextVocabTab('${level}', ${lesson.id})">Tiếp ▶</button>
        `;
        lessonDiv.appendChild(nav);

        lessonsContainer.appendChild(lessonDiv);
    });

    mainContent.appendChild(lessonsContainer);

    layout.appendChild(sidebar);
    layout.appendChild(mainContent);
    wrapper.appendChild(layout);
    contentInner.appendChild(wrapper);

    document.querySelectorAll('.lesson').forEach(el => el.classList.remove('active'));
    const firstLesson = document.querySelector(`#vocab-lesson-${level}-1`);
    if (firstLesson) firstLesson.classList.add('active');
}

function renderExerciseItem(ex, idx, level, lessonId, totalCount, prefix = 'ex', exerciseModule = 'grammar') {
    const exDiv = document.createElement('div');
    exDiv.className = 'exercise-item';
    exDiv.dataset.exerciseIndex = idx;
    exDiv.dataset.exerciseLevel = level;
    exDiv.dataset.exerciseLessonId = lessonId;
    exDiv.dataset.exercisePrefix = prefix;
    exDiv.dataset.exerciseModule = exerciseModule;
    exDiv.dataset.exerciseTotal = totalCount || 1;
    exDiv.dataset.questionText = String(ex?.question || ex?.title || ex?.text || ex?.sentence || '').trim();
    exDiv.style.cssText = `
        margin-bottom: 20px;
        padding: 18px;
        background: #ffffff;
        border-radius: 12px;
        border: 1px solid #fce7f3;
        border-left: 5px solid #ec4899;
        box-shadow: 0 2px 8px rgba(212, 165, 255, 0.1);
    `;

    let exerciseType = ex.type || '';
    if (exerciseType === 'drag_and_drop' || exerciseType === 'ordering' || exerciseType === 'reorder' || exerciseType === 'sentence_ordering') {
        exerciseType = 'drag_drop';
    }
    if (exerciseType === 'matching' || exerciseType === 'pair_matching' || exerciseType === 'connect') {
        exerciseType = 'match';
    }

    if (!exerciseType) {
        if (ex.words || ex.tokens || ex.drag_words || (ex.question && (ex.question.toLowerCase().includes('sắp xếp') || ex.question.toLowerCase().includes('kéo thả')) && (ex.options || ex.words))) {
            exerciseType = 'drag_drop';
        } else if (ex.type === 'match' || ex.left || (ex.question && (ex.question.toLowerCase().includes('nối') || ex.question.toLowerCase().includes('ghép')) && (ex.pairs || ex.left))) {
            exerciseType = 'match';
        } else if (ex.options && ex.answer !== undefined) {
            exerciseType = 'multiple_choice';
        } else if (ex.pairs && Array.isArray(ex.pairs) && ex.pairs.length > 0) {
            exerciseType = 'flashcard';
        } else if (ex.items && Array.isArray(ex.items) && ex.items.length > 0) {
            if (ex.items[0].sentence !== undefined) {
                exerciseType = 'fill_blank';
            } else if (ex.items[0].vietnamese !== undefined) {
                exerciseType = 'translation';
            } else {
                exerciseType = 'unknown';
            }
        } else {
            exerciseType = 'unknown';
        }
    }

    const typeLabels = {
        'flashcard': '🃏 Thẻ ghi nhớ',
        'fill_blank': '✏️ Điền từ',
        'multiple_choice': '🔘 Trắc nghiệm',
        'translation': '🌐 Dịch câu',
        'drag_drop': '🧩 Sắp xếp',
        'match': '🔗 Ghép đôi'
    };
    const typeLabel = typeLabels[exerciseType] || 'Bài tập';
    const exerciseMeta = {
        module: exerciseModule || (prefix.includes('vocab') ? 'vocab' : 'grammar'),
        lessonId: String(lessonId || ''),
        questionIdx: idx,
        questionKey: String(ex?.question || ex?.title || ex?.text || ex?.sentence || '').trim()
    };

    const headerDiv = document.createElement('div');
    headerDiv.style.cssText = `
        display:flex;justify-content:space-between;align-items:center;
        margin-bottom:12px;flex-wrap:wrap;gap:4px;
    `;
    headerDiv.innerHTML = `
        <span style="font-size:12px;background:#fce7f3;padding:3px 12px;border-radius:12px;color:#be185d;font-weight:700;">${typeLabel}</span>
        <span style="font-size:13px;color:#64748b;font-weight:500;">Câu ${idx + 1}/${totalCount || 1}</span>
    `;
    exDiv.dataset.exerciseData = JSON.stringify(ex);
    exDiv.appendChild(headerDiv);

    if (ex.question) {
        const qDiv = document.createElement('div');
        qDiv.style.cssText = 'font-weight:700;margin-bottom:12px;font-size:16px;color:#1e293b;line-height:1.4;';
        qDiv.textContent = ex.question;
        exDiv.appendChild(qDiv);
    }

    if (exerciseType === 'multiple_choice' && ex.options) {
        const optionsDiv = document.createElement('div');
        optionsDiv.style.cssText = 'display:flex;flex-direction:column;gap:8px;padding-left:4px;';
        ex.options.forEach((opt, optIdx) => {
            const label = document.createElement('label');
            label.className = 'mc-option-label';
            label.style.cssText = 'display:flex;align-items:center;gap:10px;padding:8px 14px;border-radius:8px;border:1px solid #f1f5f9;cursor:pointer;transition:all 0.2s ease;font-size:15px;background:#f8fafc;';
            label.onmouseenter = function() { if (!this.classList.contains('disabled')) this.style.background = '#fdf2f8'; };
            label.onmouseleave = function() { if (!this.classList.contains('disabled')) this.style.background = '#f8fafc'; };

            const radio = document.createElement('input');
            radio.type = 'radio';
            radio.name = `${prefix}-${level}-${lessonId}-${idx}`;
            radio.value = optIdx;
            radio.style.cssText = 'accent-color:#ec4899;width:17px;height:17px;cursor:pointer;';

            radio.onchange = function() {
                const parent = safeClosest(this, '.exercise-item');
                if (!parent) return;

                // Lock options to prevent re-selection
                const allRadios = optionsDiv.querySelectorAll('input[type="radio"]');
                allRadios.forEach(r => {
                    r.disabled = true;
                    if (r.parentElement) {
                        r.parentElement.classList.add('disabled');
                        r.parentElement.style.cursor = 'default';
                    }
                });

                const userVal = parseInt(this.value);
                const isCorrect = userVal === ex.answer;
                const correctAnswer = ex.options[ex.answer];

                // Style labels
                const allLabels = optionsDiv.querySelectorAll('.mc-option-label');
                allLabels.forEach((lbl, i) => {
                    const badge = document.createElement('span');
                    badge.className = 'result-badge';
                    badge.style.cssText = 'margin-left:auto;font-size:12px;font-weight:700;';
                    if (i === ex.answer) {
                        lbl.style.background = '#e8f5e9';
                        lbl.style.borderColor = '#86efac';
                        lbl.style.color = '#15803d';
                        lbl.style.fontWeight = '700';
                        badge.style.color = '#16a34a';
                        badge.textContent = '✅ Đáp án đúng';
                        lbl.appendChild(badge);
                    } else if (i === userVal && !isCorrect) {
                        lbl.style.background = '#ffebee';
                        lbl.style.borderColor = '#fca5a5';
                        lbl.style.color = '#dc2626';
                        lbl.style.fontWeight = '700';
                        badge.style.color = '#dc2626';
                        badge.textContent = '❌ Bạn chọn';
                        lbl.appendChild(badge);
                    } else {
                        lbl.style.opacity = '0.6';
                    }
                });

                const resultDiv = parent.querySelector('.exercise-result');
                resultDiv.style.display = 'block';

                if (isCorrect) {
                    resultDiv.innerHTML = `✅ <b>Chính xác!</b> Bạn đã chọn đúng đáp án: ${correctAnswer}`;
                    resultDiv.style.color = '#16a34a';
                    resultDiv.style.borderColor = '#86efac';
                    resultDiv.style.background = '#e8f5e9';
                } else {
                    resultDiv.innerHTML = `
                        <div>❌ <b>Chưa chính xác!</b> Đáp án đúng là: <b>${correctAnswer}</b></div>
                        <div style="font-size:11px;margin-top:4px;color:#991b1b;font-weight:normal;">📌 Đã tự động lưu vào câu hỏi làm sai trong Trang cá nhân để bạn ôn lại.</div>
                    `;
                    resultDiv.style.color = '#dc2626';
                    resultDiv.style.borderColor = '#fca5a5';
                    resultDiv.style.background = '#ffebee';

                    if (typeof window.recordWrongExercise === 'function') {
                        window.recordWrongExercise({
                            level: level,
                            lessonTitle: 'Bài ' + lessonId,
                            question: ex.question || ('Câu ' + (idx + 1)),
                            type: 'multiple_choice',
                            userAnswer: opt,
                            correctAnswer: correctAnswer,
                            options: ex.options || [],
                            explanation: ex.explanation || '',
                            ...exerciseMeta
                        });
                    }
                }

                // Add retry button if user wants to re-test
                const retryBtn = document.createElement('button');
                retryBtn.textContent = '🔄 chọn lại';
                retryBtn.style.cssText = 'margin-top:8px;padding:4px 12px;font-size:12px;background:white;border:1px solid #cbd5e1;border-radius:6px;cursor:pointer;color:#475569;font-weight:600;display:block;';
                retryBtn.onclick = () => {
                    const liveLabels = optionsDiv.querySelectorAll('.mc-option-label');
                    liveLabels.forEach(lbl => {
                        lbl.classList.remove('disabled');
                        lbl.style.cursor = 'pointer';
                        lbl.style.background = '#f8fafc';
                        lbl.style.borderColor = '#f1f5f9';
                        lbl.style.color = '#1e293b';
                        lbl.style.fontWeight = 'normal';
                        lbl.style.opacity = '1';
                        lbl.querySelectorAll('.result-badge').forEach(b => b.remove());
                        const r = lbl.querySelector('input[type="radio"]');
                        if (r) {
                            r.disabled = false;
                            r.checked = false;
                        }
                    });
                    resultDiv.style.display = 'none';
                    resultDiv.innerHTML = '';
                };
                resultDiv.appendChild(retryBtn);
            };

            const textSpan = document.createElement('span');
            textSpan.textContent = opt;
            label.appendChild(radio);
            label.appendChild(textSpan);
            optionsDiv.appendChild(label);
        });
        exDiv.appendChild(optionsDiv);

        const resultDiv = document.createElement('div');
        resultDiv.className = 'exercise-result';
        resultDiv.style.cssText = 'margin-top:12px;font-weight:600;padding:8px 14px;border-radius:8px;background:white;border:1px solid #e0e0e0;font-size:14px;display:none;';
        exDiv.appendChild(resultDiv);
    }

    else if (exerciseType === 'flashcard' && ex.pairs) {
        const exerciseState = {
            pairs: ex.pairs.slice(),
            currentIndex: 0,
            showing: false
        };
        for (let i = exerciseState.pairs.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [exerciseState.pairs[i], exerciseState.pairs[j]] = [exerciseState.pairs[j], exerciseState.pairs[i]];
        }
        const flashcardContainer = document.createElement('div');
        flashcardContainer.style.cssText = 'background:linear-gradient(135deg,#fdf2f8,#f8f0fc);border-radius:12px;padding:20px;margin-top:8px;border:1px solid #fce7f3;text-align:center;';
        const countDiv = document.createElement('div');
        countDiv.style.cssText = 'color:#888;font-size:12px;margin-bottom:10px;';
        flashcardContainer.appendChild(countDiv);

        const cardDiv = document.createElement('div');
        cardDiv.style.cssText = 'background:white;border-radius:12px;padding:30px;cursor:pointer;min-height:150px;display:flex;align-items:center;justify-content:center;flex-direction:column;transition:all 0.3s ease;box-shadow:0 4px 12px rgba(236,72,153,0.15);margin-bottom:15px;';
        
        const updateCard = () => {
            const pair = exerciseState.pairs[exerciseState.currentIndex];
            countDiv.textContent = `${exerciseState.currentIndex + 1}/${exerciseState.pairs.length}`;
            exerciseState.showing = false;
            cardDiv.innerHTML = `
                <div style="font-size:28px;font-weight:700;color:#1e293b;margin-bottom:8px;">${pair.hanzi || pair.cn || pair.left || ''}</div>
                <div style="font-size:14px;color:#db2777;">${pair.pinyin || pair.py || ''}</div>
                <div style="font-size:11px;color:#888;margin-top:6px;">👆 Click để xem nghĩa</div>
            `;
        };
        cardDiv.onclick = () => {
            if (!exerciseState.showing) {
                const pair = exerciseState.pairs[exerciseState.currentIndex];
                cardDiv.innerHTML = `
                    <div style="font-size:16px;color:#64748b;font-weight:600;">${pair.meaning || pair.vi || pair.right || ''}</div>
                    <div style="font-size:11px;color:#888;margin-top:6px;">👆 Click để quay lại</div>
                `;
                exerciseState.showing = true;
            } else {
                updateCard();
            }
        };

        const buttonsDiv = document.createElement('div');
        buttonsDiv.style.cssText = 'display:flex;gap:8px;justify-content:center;flex-wrap:wrap;';
        const prevBtn = document.createElement('button');
        prevBtn.textContent = '◀ Trước';
        prevBtn.style.cssText = 'padding:8px 16px;border:none;border-radius:8px;background:#ec4899;color:white;font-weight:600;cursor:pointer;';
        prevBtn.onclick = () => { if (exerciseState.currentIndex > 0) { exerciseState.currentIndex--; updateCard(); } };
        buttonsDiv.appendChild(prevBtn);

        const shuffleBtn = document.createElement('button');
        shuffleBtn.textContent = '🔀 Xáo trộn';
        shuffleBtn.style.cssText = 'padding:8px 16px;border:none;border-radius:8px;background:#2196F3;color:white;font-weight:600;cursor:pointer;';
        shuffleBtn.onclick = () => {
            for (let i = exerciseState.pairs.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [exerciseState.pairs[i], exerciseState.pairs[j]] = [exerciseState.pairs[j], exerciseState.pairs[i]];
            }
            exerciseState.currentIndex = 0;
            updateCard();
        };
        buttonsDiv.appendChild(shuffleBtn);

        const nextBtn = document.createElement('button');
        nextBtn.textContent = 'Tiếp ▶';
        nextBtn.style.cssText = 'padding:8px 16px;border:none;border-radius:8px;background:#ec4899;color:white;font-weight:600;cursor:pointer;';
        nextBtn.onclick = () => {
            if (exerciseState.currentIndex < exerciseState.pairs.length - 1) {
                exerciseState.currentIndex++;
                updateCard();
            } else {
                alert('🎉 Đã học xong bộ thẻ này!');
            }
        };
        buttonsDiv.appendChild(nextBtn);

        flashcardContainer.appendChild(cardDiv);
        flashcardContainer.appendChild(buttonsDiv);
        exDiv.appendChild(flashcardContainer);
        updateCard();
    }

    else if (exerciseType === 'fill_blank' && ex.items) {
        const fillContainer = document.createElement('div');
        fillContainer.style.cssText = 'display:flex;flex-direction:column;gap:10px;margin-top:8px;';
        ex.items.forEach((item, itemIdx) => {
            const itemDiv = document.createElement('div');
            itemDiv.className = 'fill-item';
            itemDiv.style.cssText = 'background:white;padding:12px 14px;border-radius:8px;border:1px solid #f0f0f0;';
            
            const sentenceSpan = document.createElement('div');
            sentenceSpan.style.cssText = 'font-size:15px;margin-bottom:6px;color:#1e293b;';
            sentenceSpan.textContent = item.sentence;
            itemDiv.appendChild(sentenceSpan);

            const inputRow = document.createElement('div');
            inputRow.style.cssText = 'display:flex;gap:8px;align-items:center;flex-wrap:wrap;';
            
            const inputId = `fill-input-${prefix}-${level}-${lessonId}-${idx}-${itemIdx}`;
            const input = document.createElement('input');
            input.type = 'text';
            input.id = inputId;
            input.style.cssText = 'flex:1;min-width:150px;border:1px solid #ddd;border-radius:6px;padding:6px 12px;font-size:14px;';
            input.placeholder = 'Nhập từ thích hợp...';
            inputRow.appendChild(input);

            const checkBtn = document.createElement('button');
            checkBtn.textContent = '✅ Kiểm tra';
            checkBtn.style.cssText = 'padding:6px 16px;border:none;border-radius:12px;background:#ec4899;color:white;font-size:12px;font-weight:600;cursor:pointer;';
            
            checkBtn.onclick = function(e) {
                e.preventDefault();
                const inputEl = document.getElementById(inputId);
                const resultDiv = itemDiv.querySelector('.fill-result');
                const userAnswer = (inputEl ? inputEl.value : '').trim();
                const correctAnswer = item.answer || '';
                const isCorrect = userAnswer.toLowerCase() === correctAnswer.toLowerCase();
                if (isCorrect) {
                    resultDiv.innerHTML = `✅ Đúng! (${correctAnswer})`;
                    resultDiv.style.color = '#16a34a';
                    resultDiv.style.background = '#e8f5e9';
                    resultDiv.style.border = '1px solid #86efac';
                } else {
                    resultDiv.innerHTML = `
                        <div>❌ Chưa đúng. Đáp án: <b>${correctAnswer}</b></div>
                        <div style="font-size:11px;margin-top:4px;color:#991b1b;font-weight:normal;">📌 Đã tự động lưu vào câu hỏi làm sai trong Trang cá nhân.</div>
                    `;
                    resultDiv.style.color = '#dc2626';
                    resultDiv.style.background = '#ffebee';
                    resultDiv.style.border = '1px solid #fca5a5';

                    if (typeof window.recordWrongExercise === 'function') {
                        window.recordWrongExercise({
                            level: level,
                            lessonTitle: 'Bài ' + lessonId,
                            question: item.sentence || ex.question || 'Điền từ thích hợp',
                            type: 'fill_blank',
                            userAnswer: userAnswer || 'Chưa nhập',
                            correctAnswer: correctAnswer,
                            explanation: ex.explanation || '',
                            ...exerciseMeta
                        });
                    }
                }
                resultDiv.style.display = 'block';
            };
            inputRow.appendChild(checkBtn);
            itemDiv.appendChild(inputRow);

            const resultDiv = document.createElement('div');
            resultDiv.className = 'fill-result';
            resultDiv.style.cssText = 'margin-top:8px;font-weight:600;font-size:13px;display:none;padding:6px 12px;border-radius:6px;';
            itemDiv.appendChild(resultDiv);
            fillContainer.appendChild(itemDiv);
        });
        exDiv.appendChild(fillContainer);
    }

    else if (exerciseType === 'translation' && ex.items) {
        const transContainer = document.createElement('div');
        transContainer.style.cssText = 'display:flex;flex-direction:column;gap:12px;margin-top:8px;';
        ex.items.forEach((item, itemIdx) => {
            const itemDiv = document.createElement('div');
            itemDiv.className = 'trans-item';
            itemDiv.style.cssText = 'background:white;padding:14px;border-radius:12px;border:1px solid #fbcfe8;box-shadow:0 2px 6px rgba(0,0,0,0.02);';
            
            const sentenceDiv = document.createElement('div');
            sentenceDiv.style.cssText = 'font-size:16px;margin-bottom:4px;font-weight:700;color:#1e293b;';
            sentenceDiv.textContent = item.chinese || item.cn || '';
            itemDiv.appendChild(sentenceDiv);

            if (item.pinyin || item.py) {
                const pyDiv = document.createElement('div');
                pyDiv.style.cssText = 'font-size:13px;color:#db2777;font-weight:600;margin-bottom:8px;';
                pyDiv.textContent = item.pinyin || item.py;
                itemDiv.appendChild(pyDiv);
            }

            const inputRow = document.createElement('div');
            inputRow.style.cssText = 'display:flex;gap:8px;align-items:center;flex-wrap:wrap;';
            
            const inputId = `trans-input-${prefix}-${level}-${lessonId}-${idx}-${itemIdx}`;
            const input = document.createElement('input');
            input.type = 'text';
            input.id = inputId;
            input.style.cssText = 'flex:1;min-width:180px;border:1.5px solid #cbd5e1;border-radius:8px;padding:8px 12px;font-size:14px;outline:none;transition:all 0.2s;';
            input.placeholder = 'Nhập bản dịch tiếng Việt...';
            inputRow.appendChild(input);

            const checkBtn = document.createElement('button');
            checkBtn.textContent = '✅ Kiểm tra';
            checkBtn.style.cssText = 'padding:8px 18px;border:none;border-radius:10px;background:linear-gradient(135deg, #ec4899, #db2777);color:white;font-size:13px;font-weight:700;cursor:pointer;box-shadow:0 2px 8px rgba(236,72,153,0.25);';
            
            checkBtn.onclick = function(e) {
                e.preventDefault();
                const inputEl = document.getElementById(inputId);
                const resultDiv = itemDiv.querySelector('.trans-result');
                const rawUser = (inputEl ? inputEl.value : '').trim();
                const correctAnswer = item.vietnamese || item.vi || item.answer || '';
                
                const normUser = rawUser.toLowerCase().replace(/[.,?!;:""''`~]/g, '').replace(/\s+/g, ' ').trim();
                const normCorrect = correctAnswer.toLowerCase().replace(/[.,?!;:""''`~]/g, '').replace(/\s+/g, ' ').trim();

                let isCorrect = (normUser === normCorrect);
                if (!isCorrect && correctAnswer.includes('/')) {
                    const alts = correctAnswer.split('/');
                    isCorrect = alts.some(alt => normUser === alt.toLowerCase().replace(/[.,?!;:""''`~]/g, '').replace(/\s+/g, ' ').trim());
                }

                if (isCorrect) {
                    inputEl.style.borderColor = '#16a34a';
                    inputEl.style.background = '#f0fdf4';
                    resultDiv.style.color = '#15803d';
                    resultDiv.style.background = '#dcfce7';
                    resultDiv.style.border = '1.5px solid #86efac';
                    resultDiv.innerHTML = `✅ <b>Chính xác! (ĐÚNG)</b><br>Bản dịch của bạn rất tốt: <b>${correctAnswer}</b>`;
                } else {
                    inputEl.style.borderColor = '#dc2626';
                    inputEl.style.background = '#fef2f2';
                    resultDiv.style.color = '#991b1b';
                    resultDiv.style.background = '#fee2e2';
                    resultDiv.style.border = '1.5px solid #fca5a5';
                    resultDiv.innerHTML = `
                        <div>❌ <b>Chưa chính xác! (SAI)</b></div>
                        <div style="margin-top:4px;">Bản dịch của bạn: <span style="text-decoration:line-through;color:#b91c1c;">${rawUser || 'Chưa nhập'}</span></div>
                        <div style="margin-top:4px;color:#15803d;font-weight:700;">Đáp án chuẩn mẫu (ĐÚNG): <b>${correctAnswer}</b></div>
                        <div style="font-size:11px;margin-top:4px;color:#991b1b;font-weight:normal;">📌 Đã tự động lưu vào danh sách câu làm sai trong Trang cá nhân để ôn lại.</div>
                    `;

                    if (typeof window.recordWrongExercise === 'function') {
                        window.recordWrongExercise({
                            level: level,
                            lessonTitle: 'Bài ' + lessonId,
                            question: item.chinese || item.cn || ex.question || 'Dịch câu',
                            type: 'translation',
                            userAnswer: rawUser || 'Chưa nhập',
                            correctAnswer: correctAnswer,
                            explanation: ex.explanation || '',
                            ...exerciseMeta
                        });
                    }
                }
                resultDiv.style.display = 'block';
            };
            inputRow.appendChild(checkBtn);
            itemDiv.appendChild(inputRow);

            const resultDiv = document.createElement('div');
            resultDiv.className = 'trans-result';
            resultDiv.style.cssText = 'margin-top:10px;font-weight:600;font-size:13.5px;display:none;padding:10px 14px;border-radius:10px;line-height:1.5;';
            itemDiv.appendChild(resultDiv);
            transContainer.appendChild(itemDiv);
        });
        exDiv.appendChild(transContainer);
    }

    else if (exerciseType === 'drag_drop') {
        const dragDropContainer = document.createElement('div');
        dragDropContainer.className = 'drag-drop-container';
        dragDropContainer.style.cssText = 'background:#fdf2f8;border:1px solid #fbcfe8;border-radius:12px;padding:16px;margin-top:10px;';

        let originalWords = [];
        if (Array.isArray(ex.words)) originalWords = ex.words.slice();
        else if (Array.isArray(ex.tokens)) originalWords = ex.tokens.slice();
        else if (Array.isArray(ex.options)) originalWords = ex.options.slice();
        else if (typeof ex.sentence === 'string') originalWords = ex.sentence.split('');
        else if (typeof ex.answer === 'string') originalWords = ex.answer.split('');

        let wordObjects = originalWords.map((word, i) => ({
            id: `w-${prefix}-${level}-${lessonId}-${idx}-${i}-${Math.random().toString(36).substr(2, 5)}`,
            text: String(word)
        }));

        let bankWords = wordObjects.slice();
        for (let i = bankWords.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [bankWords[i], bankWords[j]] = [bankWords[j], bankWords[i]];
        }

        let selectedWords = [];

        const dropZoneLabel = document.createElement('div');
        dropZoneLabel.style.cssText = 'font-size:12px;font-weight:700;color:#db2777;margin-bottom:6px;display:flex;align-items:center;gap:6px;';
        dropZoneLabel.innerHTML = '<span>📥 Câu hoàn chỉnh:</span> <span style="font-size:11px;font-weight:400;color:#64748b;">(Click hoặc kéo thả từ vào đây)</span>';
        dragDropContainer.appendChild(dropZoneLabel);

        const targetBox = document.createElement('div');
        targetBox.className = 'drag-drop-target';
        targetBox.style.cssText = 'min-height:52px;background:white;border:2px dashed #ec4899;border-radius:10px;padding:8px 12px;display:flex;flex-wrap:wrap;gap:8px;align-items:center;margin-bottom:14px;transition:all 0.2s ease;';

        targetBox.ondragover = (e) => { e.preventDefault(); targetBox.style.borderColor = '#be185d'; targetBox.style.background = '#fcf0f7'; };
        targetBox.ondragleave = () => { targetBox.style.borderColor = '#ec4899'; targetBox.style.background = 'white'; };
        targetBox.ondrop = (e) => {
            e.preventDefault();
            targetBox.style.borderColor = '#ec4899';
            targetBox.style.background = 'white';
            const wordId = e.dataTransfer.getData('text/plain');
            if (wordId) moveToTarget(wordId);
        };

        const bankLabel = document.createElement('div');
        bankLabel.style.cssText = 'font-size:12px;font-weight:700;color:#db2777;margin-bottom:6px;';
        bankLabel.textContent = '🧩 Ngân hàng từ:';
        dragDropContainer.appendChild(bankLabel);

        const bankBox = document.createElement('div');
        bankBox.className = 'drag-drop-bank';
        bankBox.style.cssText = 'min-height:48px;background:#ffffff;border:1px solid #fbcfe8;border-radius:10px;padding:10px;display:flex;flex-wrap:wrap;gap:8px;align-items:center;margin-bottom:14px;';

        bankBox.ondragover = (e) => { e.preventDefault(); };
        bankBox.ondrop = (e) => {
            e.preventDefault();
            const wordId = e.dataTransfer.getData('text/plain');
            if (wordId) moveToBank(wordId);
        };

        function renderWordBoxes() {
            targetBox.innerHTML = '';
            bankBox.innerHTML = '';

            if (selectedWords.length === 0) {
                const emptyHint = document.createElement('span');
                emptyHint.style.cssText = 'color:#a1a1aa;font-size:13px;font-style:italic;';
                emptyHint.textContent = 'Click hoặc kéo thả các từ bên dưới vào đây...';
                targetBox.appendChild(emptyHint);
            } else {
                selectedWords.forEach(item => {
                    const chip = createWordChip(item, true);
                    targetBox.appendChild(chip);
                });
            }

            if (bankWords.length === 0) {
                const emptyBank = document.createElement('span');
                emptyBank.style.cssText = 'color:#a1a1aa;font-size:13px;font-style:italic;';
                emptyBank.textContent = 'Đã chọn hết các từ';
                bankBox.appendChild(emptyBank);
            } else {
                bankWords.forEach(item => {
                    const chip = createWordChip(item, false);
                    bankBox.appendChild(chip);
                });
            }
        }

        function createWordChip(item, inTarget) {
            const chip = document.createElement('div');
            chip.className = 'word-chip';
            chip.draggable = true;
            chip.style.cssText = `
                padding: 6px 14px;
                background: ${inTarget ? '#fce7f3' : '#ffffff'};
                color: ${inTarget ? '#be185d' : '#1e293b'};
                border: 1px solid ${inTarget ? '#ec4899' : '#cbd5e1'};
                border-radius: 8px;
                font-size: 15px;
                font-weight: 600;
                cursor: pointer;
                user-select: none;
                transition: all 0.2s ease;
                box-shadow: 0 2px 4px rgba(0,0,0,0.04);
                display: inline-flex;
                align-items: center;
            `;
            chip.innerHTML = `<span>${item.text}</span>`;

            chip.ondragstart = (e) => {
                e.dataTransfer.setData('text/plain', item.id);
                chip.style.opacity = '0.5';
            };
            chip.ondragend = () => { chip.style.opacity = '1'; };
            chip.onclick = () => { if (inTarget) moveToBank(item.id); else moveToTarget(item.id); };
            return chip;
        }

        function moveToTarget(wordId) {
            const idxInBank = bankWords.findIndex(w => w.id === wordId);
            if (idxInBank !== -1) {
                const [item] = bankWords.splice(idxInBank, 1);
                selectedWords.push(item);
                renderWordBoxes();
            }
        }

        function moveToBank(wordId) {
            const idxInTarget = selectedWords.findIndex(w => w.id === wordId);
            if (idxInTarget !== -1) {
                const [item] = selectedWords.splice(idxInTarget, 1);
                bankWords.push(item);
                renderWordBoxes();
            }
        }

        dragDropContainer.appendChild(targetBox);
        dragDropContainer.appendChild(bankBox);

        const actionRow = document.createElement('div');
        actionRow.style.cssText = 'display:flex;gap:10px;align-items:center;flex-wrap:wrap;';

        const checkBtn = document.createElement('button');
        checkBtn.textContent = '✅ Kiểm tra';
        checkBtn.style.cssText = 'padding:6px 18px;border:none;border-radius:20px;background:#ec4899;color:white;font-weight:600;font-size:13px;cursor:pointer;box-shadow:0 2px 8px rgba(236,72,153,0.3);';

        const resetBtn = document.createElement('button');
        resetBtn.textContent = '🔄 Làm lại';
        resetBtn.style.cssText = 'padding:6px 14px;border:1px solid #cbd5e1;border-radius:20px;background:white;color:#64748b;font-weight:600;font-size:13px;cursor:pointer;';

        const resultDiv = document.createElement('div');
        resultDiv.style.cssText = 'width:100%;margin-top:10px;font-weight:600;font-size:14px;padding:8px 14px;border-radius:8px;display:none;';

        checkBtn.onclick = () => {
            const userStr = selectedWords.map(w => w.text).join('').trim();
            let isCorrect = false;
            let correctStr = '';

            if (typeof ex.answer === 'string') {
                correctStr = ex.answer.trim();
                isCorrect = (userStr === correctStr || userStr.replace(/\s+/g, '') === correctStr.replace(/\s+/g, ''));
            } else if (Array.isArray(ex.answer)) {
                correctStr = ex.answer.join('');
                isCorrect = (userStr === correctStr || userStr.replace(/\s+/g, '') === correctStr.replace(/\s+/g, ''));
            } else if (Array.isArray(ex.correct_order)) {
                correctStr = ex.correct_order.map(i => typeof i === 'number' ? originalWords[i] : i).join('');
                isCorrect = (userStr === correctStr);
            } else if (typeof ex.correct === 'string') {
                correctStr = ex.correct.trim();
                isCorrect = (userStr === correctStr);
            } else {
                correctStr = originalWords.join('');
                isCorrect = (userStr === correctStr);
            }

            resultDiv.style.display = 'block';
            if (isCorrect) {
                resultDiv.innerHTML = `✅ Chính xác! (${userStr})`;
                resultDiv.style.background = '#e8f5e9';
                resultDiv.style.color = '#16a34a';
                resultDiv.style.border = '1px solid #86efac';
            } else {
                resultDiv.innerHTML = `
                    <div>❌ Chưa đúng. Đáp án đúng: <strong>${correctStr}</strong></div>
                    <div style="font-size:11px;margin-top:4px;color:#991b1b;font-weight:normal;">📌 Đã tự động lưu vào câu hỏi làm sai trong Trang cá nhân.</div>
                `;
                resultDiv.style.background = '#ffebee';
                resultDiv.style.color = '#dc2626';
                resultDiv.style.border = '1px solid #fca5a5';

                if (typeof window.recordWrongExercise === 'function') {
                    window.recordWrongExercise({
                        level: level,
                        lessonTitle: 'Bài ' + lessonId,
                        question: ex.question || 'Sắp xếp từ thành câu',
                        type: 'drag_drop',
                        userAnswer: userStr || 'Chưa chọn đủ từ',
                        correctAnswer: correctStr,
                        explanation: ex.explanation || '',
                        ...exerciseMeta
                    });
                }
            }
        };

        resetBtn.onclick = () => {
            bankWords = wordObjects.slice();
            for (let i = bankWords.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [bankWords[i], bankWords[j]] = [bankWords[j], bankWords[i]];
            }
            selectedWords = [];
            resultDiv.style.display = 'none';
            renderWordBoxes();
        };

        actionRow.appendChild(checkBtn);
        actionRow.appendChild(resetBtn);
        dragDropContainer.appendChild(actionRow);
        dragDropContainer.appendChild(resultDiv);

        renderWordBoxes();
        exDiv.appendChild(dragDropContainer);
    }

    else if (exerciseType === 'match') {
        const matchContainer = document.createElement('div');
        matchContainer.className = 'match-container';
        matchContainer.style.cssText = 'background:#fdf2f8;border:1px solid #fbcfe8;border-radius:12px;padding:16px;margin-top:10px;';

        let rawPairs = [];
        if (Array.isArray(ex.pairs)) {
            rawPairs = ex.pairs.map(p => ({
                left: String(p.left || p.cn || p.hanzi || p.chinese || p.word || ''),
                right: String(p.right || p.vi || p.meaning || p.vietnamese || p.pinyin || '')
            }));
        } else if (Array.isArray(ex.left) && Array.isArray(ex.right)) {
            rawPairs = ex.left.map((l, i) => ({
                left: String(l),
                right: String(ex.right[i] || '')
            }));
        }

        const leftItems = rawPairs.map((p, i) => ({ id: `l-${i}`, text: p.left, correctRight: p.right }));
        let rightItems = rawPairs.map((p, i) => ({ id: `r-${i}`, text: p.right }));
        for (let i = rightItems.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [rightItems[i], rightItems[j]] = [rightItems[j], rightItems[i]];
        }

        const pairColors = [
            { bg: '#fce7f3', border: '#ec4899', text: '#be185d' },
            { bg: '#e0f2fe', border: '#0284c7', text: '#0369a1' },
            { bg: '#fef3c7', border: '#d97706', text: '#b45309' },
            { bg: '#dcfce7', border: '#16a34a', text: '#15803d' },
            { bg: '#f3e8ff', border: '#9333ea', text: '#7e22ce' },
            { bg: '#ffedd5', border: '#ea580c', text: '#c2410c' }
        ];

        let selectedLeftId = null;
        let userMatches = {};
        let matchColorMap = {};

        const grid = document.createElement('div');
        grid.style.cssText = 'display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-bottom:14px;';

        const leftCol = document.createElement('div');
        leftCol.style.cssText = 'display:flex;flex-direction:column;gap:8px;';

        const rightCol = document.createElement('div');
        rightCol.style.cssText = 'display:flex;flex-direction:column;gap:8px;';

        function renderMatchGrid() {
            leftCol.innerHTML = '<div style="font-size:12px;font-weight:700;color:#db2777;margin-bottom:4px;">Cột A</div>';
            rightCol.innerHTML = '<div style="font-size:12px;font-weight:700;color:#db2777;margin-bottom:4px;">Cột B</div>';

            leftItems.forEach((lItem) => {
                const card = document.createElement('div');
                const isSelected = (selectedLeftId === lItem.id);
                const isMatched = !!userMatches[lItem.id];
                const colorIdx = matchColorMap[lItem.id];
                const colorScheme = isMatched ? pairColors[colorIdx % pairColors.length] : null;

                card.style.cssText = `
                    padding: 10px 14px;
                    background: ${isMatched ? colorScheme.bg : (isSelected ? '#fff1f2' : 'white')};
                    border: 2px solid ${isMatched ? colorScheme.border : (isSelected ? '#ec4899' : '#e2e8f0')};
                    color: ${isMatched ? colorScheme.text : '#1e293b'};
                    border-radius: 10px;
                    font-size: 15px;
                    font-weight: 600;
                    cursor: pointer;
                    transition: all 0.2s ease;
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    box-shadow: 0 2px 4px rgba(0,0,0,0.02);
                `;

                let badgeHtml = '';
                if (isMatched) {
                    badgeHtml = `<span style="font-size:11px;background:${colorScheme.border};color:white;padding:2px 8px;border-radius:10px;">🔗 Cặp ${colorIdx + 1}</span>`;
                } else if (isSelected) {
                    badgeHtml = `<span style="font-size:11px;background:#ec4899;color:white;padding:2px 8px;border-radius:10px;">Đang chọn</span>`;
                }

                card.innerHTML = `<span>${lItem.text}</span>${badgeHtml}`;

                card.onclick = () => {
                    if (userMatches[lItem.id]) {
                        delete userMatches[lItem.id];
                        delete matchColorMap[lItem.id];
                        selectedLeftId = null;
                    } else {
                        selectedLeftId = lItem.id;
                    }
                    renderMatchGrid();
                };

                leftCol.appendChild(card);
            });

            rightItems.forEach((rItem) => {
                const card = document.createElement('div');
                const matchedLeftId = Object.keys(userMatches).find(lId => userMatches[lId] === rItem.id);
                const isMatched = !!matchedLeftId;
                const colorIdx = isMatched ? matchColorMap[matchedLeftId] : null;
                const colorScheme = isMatched ? pairColors[colorIdx % pairColors.length] : null;

                card.style.cssText = `
                    padding: 10px 14px;
                    background: ${isMatched ? colorScheme.bg : 'white'};
                    border: 2px solid ${isMatched ? colorScheme.border : '#e2e8f0'};
                    color: ${isMatched ? colorScheme.text : '#1e293b'};
                    border-radius: 10px;
                    font-size: 15px;
                    font-weight: 600;
                    cursor: pointer;
                    transition: all 0.2s ease;
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    box-shadow: 0 2px 4px rgba(0,0,0,0.02);
                `;

                let badgeHtml = '';
                if (isMatched) {
                    badgeHtml = `<span style="font-size:11px;background:${colorScheme.border};color:white;padding:2px 8px;border-radius:10px;">🔗 Cặp ${colorIdx + 1}</span>`;
                }

                card.innerHTML = `<span>${rItem.text}</span>${badgeHtml}`;

                card.onclick = () => {
                    if (selectedLeftId) {
                        if (isMatched) {
                            delete userMatches[matchedLeftId];
                            delete matchColorMap[matchedLeftId];
                        }
                        userMatches[selectedLeftId] = rItem.id;
                        let freeColorIdx = 0;
                        const activeColorIndices = new Set(Object.values(matchColorMap));
                        while (activeColorIndices.has(freeColorIdx)) freeColorIdx++;
                        matchColorMap[selectedLeftId] = freeColorIdx;
                        selectedLeftId = null;
                        renderMatchGrid();
                    } else if (isMatched) {
                        delete userMatches[matchedLeftId];
                        delete matchColorMap[matchedLeftId];
                        renderMatchGrid();
                    }
                };

                rightCol.appendChild(card);
            });
        }

        grid.appendChild(leftCol);
        grid.appendChild(rightCol);
        matchContainer.appendChild(grid);

        const actionRow = document.createElement('div');
        actionRow.style.cssText = 'display:flex;gap:10px;align-items:center;flex-wrap:wrap;';

        const checkBtn = document.createElement('button');
        checkBtn.textContent = '✅ Kiểm tra';
        checkBtn.style.cssText = 'padding:6px 18px;border:none;border-radius:20px;background:#ec4899;color:white;font-weight:600;font-size:13px;cursor:pointer;box-shadow:0 2px 8px rgba(236,72,153,0.3);';

        const resetBtn = document.createElement('button');
        resetBtn.textContent = '🔄 Nối lại';
        resetBtn.style.cssText = 'padding:6px 14px;border:1px solid #cbd5e1;border-radius:20px;background:white;color:#64748b;font-weight:600;font-size:13px;cursor:pointer;';

        const resultDiv = document.createElement('div');
        resultDiv.style.cssText = 'width:100%;margin-top:10px;font-weight:600;font-size:14px;padding:8px 14px;border-radius:8px;display:none;';

        checkBtn.onclick = () => {
            let correctCount = 0;
            let totalCount = leftItems.length;
            let wrongDetails = [];

            leftItems.forEach(lItem => {
                const userRightId = userMatches[lItem.id];
                const userRightText = rightItems.find(r => r.id === userRightId)?.text;
                if (!userRightId) {
                    wrongDetails.push(`• <b>${lItem.text}</b>: <span style="color:#d97706;">Chưa nối</span> (Đáp án đúng: "<b>${lItem.correctRight}</b>")`);
                } else if (userRightText && userRightText.trim() === lItem.correctRight.trim()) {
                    correctCount++;
                } else {
                    wrongDetails.push(`• <b>${lItem.text}</b>: Bạn nối với "<b>${userRightText}</b>" ❌ (Đáp án đúng: "<b>${lItem.correctRight}</b>")`);
                }
            });

            resultDiv.style.display = 'block';
            if (correctCount === totalCount) {
                resultDiv.innerHTML = `🎉 <b>Tuyệt vời!</b> Bạn đã nối chính xác toàn bộ ${correctCount}/${totalCount} cặp!`;
                resultDiv.style.background = '#e8f5e9';
                resultDiv.style.color = '#16a34a';
                resultDiv.style.border = '1px solid #86efac';
            } else {
                resultDiv.innerHTML = `
                    <div style="font-size:15px;font-weight:700;margin-bottom:8px;color:#dc2626;">
                        ❌ Kết quả: Nối đúng ${correctCount}/${totalCount} cặp
                    </div>
                    <div style="font-size:13px;line-height:1.6;color:#991b1b;background:#fff5f5;padding:10px 14px;border-radius:8px;border:1px dashed #fca5a5;">
                        <div style="font-weight:700;margin-bottom:6px;color:#7f1d1d;">Chi tiết các cặp nối chưa đúng:</div>
                        ${wrongDetails.map(d => `<div>${d}</div>`).join('')}
                    </div>
                    <div style="font-size:11px;margin-top:8px;color:#991b1b;font-weight:normal;">📌 Đã tự động lưu bài tập này vào danh sách làm sai trong Trang cá nhân.</div>
                `;
                resultDiv.style.background = '#ffebee';
                resultDiv.style.color = '#dc2626';
                resultDiv.style.border = '1px solid #fca5a5';

                if (typeof window.recordWrongExercise === 'function') {
                    window.recordWrongExercise({
                        level: level,
                        lessonTitle: 'Bài ' + lessonId,
                        question: ex.question || 'Nối các từ thích hợp',
                        type: 'match',
                        userAnswer: `Nối đúng ${correctCount}/${totalCount} cặp`,
                        correctAnswer: leftItems.map(l => `${l.text} ➔ ${l.correctRight}`).join('; '),
                        explanation: ex.explanation || '',
                        ...exerciseMeta
                    });
                }
            }
        };

        resetBtn.onclick = () => {
            userMatches = {};
            matchColorMap = {};
            selectedLeftId = null;
            resultDiv.style.display = 'none';
            for (let i = rightItems.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [rightItems[i], rightItems[j]] = [rightItems[j], rightItems[i]];
            }
            renderMatchGrid();
        };

        actionRow.appendChild(checkBtn);
        actionRow.appendChild(resetBtn);
        matchContainer.appendChild(actionRow);
        matchContainer.appendChild(resultDiv);

        renderMatchGrid();
        exDiv.appendChild(matchContainer);
    }

    else {
        const unknownDiv = document.createElement('div');
        unknownDiv.style.cssText = 'color:#999;font-size:13px;padding:8px 0;';
        unknownDiv.textContent = `📌 Bài tập: ${JSON.stringify(ex).substring(0, 200)}...`;
        exDiv.appendChild(unknownDiv);
    }

    return exDiv;
}

let currentVocabTab = 'vocab';

function resolveLessonTabId(module, lessonEl, rawTabId) {
    const tabIdStr = String(rawTabId ?? '').trim();
    const buttons = lessonEl ? lessonEl.querySelectorAll('.tab-btn') : [];
    const availableTabs = Array.from(buttons).map(btn => String(btn.dataset.tab || '').trim()).filter(Boolean);

    if (module === 'vocab') {
        if (tabIdStr === '999' || tabIdStr === 'exercise' || tabIdStr === '2') return 'exercise';
        if (tabIdStr === '1' || tabIdStr === 'vocab' || tabIdStr === '' || tabIdStr === '0') return 'vocab';
    } else if (module === 'grammar') {
        if (tabIdStr === 'exercise' || tabIdStr === '999' || tabIdStr === '0') return '999';
    }

    if (availableTabs.includes(tabIdStr)) return tabIdStr;
    if (module === 'vocab' && availableTabs.includes('vocab')) return 'vocab';
    if (module === 'grammar' && availableTabs.includes('1')) return '1';
    if (availableTabs.length > 0) return availableTabs[0];
    return tabIdStr || '1';
}

function showVocabLesson(level, lessonNum, tabId) {
    const targetTab = resolveLessonTabId('vocab', document.getElementById(`vocab-lesson-${level}-${lessonNum}`), tabId);
    if (tabId) {
        currentVocabTab = targetTab;
    }

    const lessonEl = document.getElementById(`vocab-lesson-${level}-${lessonNum}`);
    if (!lessonEl) {
        if (typeof window.showContent === 'function') {
            window.showContent('vocab', level);
            setTimeout(() => showVocabLesson(level, lessonNum, targetTab), 350);
        }
        return;
    }

    document.querySelectorAll('.lesson').forEach(el => el.classList.remove('active'));

    document.querySelectorAll('.lesson-item').forEach(el => {
        el.classList.remove('active');
        el.style.cssText = 'padding:10px 20px;cursor:pointer;transition:all 0.3s ease;font-size:14px;color:#4a5568;border-left:3px solid transparent;display:flex;align-items:center;gap:8px;';
        const numSpan = el.querySelector('.lesson-num');
        if (numSpan) {
            numSpan.style.background = '#fce7f3';
            numSpan.style.color = '#be185d';
        }
    });

    lessonEl.classList.add('active');
    lessonEl.scrollIntoView({ behavior: 'smooth', block: 'start' });

    const sidebarItem = document.querySelector(`.lesson-item[data-level="${level}"][data-lesson-id="${lessonNum}"]`);
    if (sidebarItem) {
        sidebarItem.classList.add('active');
        sidebarItem.style.cssText = 'padding:10px 20px;cursor:pointer;transition:all 0.3s ease;font-size:14px;color:#be185d;font-weight:600;border-left:3px solid #ec4899;display:flex;align-items:center;gap:8px;background:#fdf2f8;';
        const numSpan = sidebarItem.querySelector('.lesson-num');
        if (numSpan) {
            numSpan.style.background = '#ec4899';
            numSpan.style.color = 'white';
        }
    }

    switchVocabTab(level, lessonNum, targetTab);
}
window.showVocabLesson = showVocabLesson;

function switchVocabTab(level, lessonNum, tabId) {
    const lesson = document.getElementById(`vocab-lesson-${level}-${lessonNum}`);
    if (!lesson) return;

    lesson.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('active');
    });

    lesson.querySelectorAll('.tab-pane').forEach(pane => {
        pane.classList.remove('active');
    });

    const resolvedTabId = resolveLessonTabId('vocab', lesson, tabId);
    currentVocabTab = resolvedTabId;

    const targetBtn = lesson.querySelector(`.tab-btn[data-tab="${resolvedTabId}"]`);
    if (targetBtn) {
        targetBtn.classList.add('active');
    }

    const pane = document.getElementById(`vocab-tab-${level}-${lessonNum}-${resolvedTabId}`);
    if (pane) {
        pane.classList.add('active');
    } else {
        const firstPane = lesson.querySelector('.tab-pane');
        if (firstPane) firstPane.classList.add('active');
    }
}
window.switchVocabTab = switchVocabTab;
        function nextVocabTab(hskLevel, lessonNum) {
    const data = cachedData[`vocab-${hskLevel}`];
    if (!data) return;
    if (lessonNum < data.lessons.length) {
        showVocabLesson(hskLevel, lessonNum + 1, currentVocabTab);
        return;
    }
    const idx = hskLevels.indexOf(hskLevel);
    if (idx < hskLevels.length - 1) {
        const nextLevel = hskLevels[idx + 1];
        showContent("vocab", nextLevel);
        setTimeout(() => {
            showVocabLesson(nextLevel, 1, 'vocab');
        }, 300);
    } else {
        alert("🎉 Bạn đã hoàn thành toàn bộ khóa học!");
    }
}

function prevVocabTab(hskLevel, lessonNum) {
    if (lessonNum > 1) {
        showVocabLesson(hskLevel, lessonNum - 1, currentVocabTab);
        return;
    }
    const idx = hskLevels.indexOf(hskLevel);
    if (idx > 0) {
        const prevLevel = hskLevels[idx - 1];
        const data = cachedData[`vocab-${prevLevel}`];
        if (data) {
            showContent("vocab", prevLevel);
            setTimeout(() => {
                showVocabLesson(prevLevel, data.lessons.length, 'vocab');
            }, 300);
        }
    }
}

        window.switchTab = function(level, lessonNum, tabId) {
            const lesson = document.getElementById(`lesson-${level}-${lessonNum}`);
            if (!lesson) return;

            lesson.querySelectorAll(".tab-btn").forEach(btn => btn.classList.remove("active"));
            lesson.querySelectorAll(".tab-pane").forEach(pane => pane.classList.remove("active"));

            const tabIdStr = String(tabId);
            let targetBtn = null;
            lesson.querySelectorAll(".tab-btn").forEach(btn => {
                if (String(btn.dataset.tab) === tabIdStr) targetBtn = btn;
            });
            if (targetBtn) targetBtn.classList.add("active");

            const pane = document.getElementById(`tab-${level}-${lessonNum}-${tabIdStr}`);
            if (pane) pane.classList.add("active");
        };

        window.showLesson = function(level, lessonNum, tabId) {
            document.querySelectorAll('.lesson').forEach(el => el.classList.remove('active'));
            document.querySelectorAll('.lesson-item').forEach(el => {
                el.classList.remove('active');
                el.style.cssText = 'padding:10px 20px;cursor:pointer;transition:all 0.3s ease;font-size:14px;color:#4a5568;border-left:3px solid transparent;display:flex;align-items:center;gap:8px;';
                const numSpan = el.querySelector('.lesson-num');
                if (numSpan) {
                    numSpan.style.background = '#fce7f3';
                    numSpan.style.color = '#be185d';
                }
            });

            const lessonEl = document.getElementById(`lesson-${level}-${lessonNum}`);
            if (lessonEl) {
                lessonEl.classList.add('active');
                lessonEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }

            const sidebarItem = document.querySelector(`.lesson-item[data-level="${level}"][data-lesson-id="${lessonNum}"]`);
            if (sidebarItem) {
                sidebarItem.classList.add('active');
                sidebarItem.style.cssText = 'padding:10px 20px;cursor:pointer;transition:all 0.3s ease;font-size:14px;color:#be185d;font-weight:600;border-left:3px solid #ec4899;display:flex;align-items:center;gap:8px;background:#fdf2f8;';
                const numSpan = sidebarItem.querySelector('.lesson-num');
                if (numSpan) {
                    numSpan.style.background = '#ec4899';
                    numSpan.style.color = 'white';
                }
            }

            if (typeof window.switchTab === 'function') {
                window.switchTab(level, lessonNum, tabId || '1');
            }
        };


window.formatGrammarContentToTable = function(label, text) {
    if (!text) return '';
    const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0);
    
    if (lines.length <= 1) {
        return `
            <div style="padding:12px 16px;background:#fff8fa;border:1px solid #fbcfe8;border-radius:12px;font-size:14px;color:#334155;line-height:1.6;margin-top:6px;">
                ${text.replace(/\n/g, '<br>')}
            </div>
        `;
    }

    let tableRows = '';
    let rowCount = 0;
    lines.forEach((line, idx) => {
        let category = `Quy tắc ${idx + 1}`;
        let details = line;
        let exampleNote = '';

        if (line.includes(':') || line.includes('：')) {
            const parts = line.split(/[:：]/);
            category = parts[0].trim();
            details = parts.slice(1).join(':').trim();
        } else if (line.includes('-') || line.includes('•') || line.includes('➔')) {
            const parts = line.split(/[-•➔]/);
            category = parts[0].trim() || `Mục ${idx + 1}`;
            details = parts.slice(1).join('-').trim();
        }

        const exMatch = details.match(/\((?:vd|ví dụ|lưu ý|chú ý)[:：]?\s*([^)]+)\)/i);
        if (exMatch) {
            exampleNote = exMatch[1];
            details = details.replace(exMatch[0], '').trim();
        }

        if (category || details) {
            rowCount++;
            tableRows += `
                <tr>
                    <td style="font-weight:700;color:#be185d;width:28%;">${category}</td>
                    <td style="color:#1e293b;font-weight:500;">${details}</td>
                    ${exampleNote ? `<td style="color:#0284c7;font-style:italic;font-size:12.5px;">💡 ${exampleNote}</td>` : '<td style="color:#94a3b8;font-size:12px;">—</td>'}
                </tr>
            `;
        }
    });

    if (rowCount <= 1) {
        return `
            <div style="padding:12px 16px;background:#fff8fa;border:1px solid #fbcfe8;border-radius:12px;font-size:14px;color:#334155;line-height:1.6;margin-top:6px;">
                ${text.replace(/\n/g, '<br>')}
            </div>
        `;
    }

    return `
        <div class="grammar-table-wrapper">
            <table class="grammar-table">
                <thead>
                    <tr>
                        <th>📌 Quy tắc</th>
                        <th>📖 Chi tiết cấu trúc & Hướng dẫn</th>
                    </tr>
                </thead>
                <tbody>
                    ${tableRows}
                </tbody>
            </table>
        </div>
    `;
};

// 2. Render hộp Cấu trúc / Công thức nổi bật
window.renderGrammarFormulaBox = function(label, text) {
    return `
        <div class="grammar-formula-box">
            <div class="grammar-formula-tag">⚡ ${label || 'Cấu trúc chuẩn'}</div>
            <div class="grammar-formula-text">${text.replace(/\n/g, '<br>')}</div>
        </div>
    `;
};

// 3. Render khối Lỗi sai thường gặp & Lưu ý
window.renderErrorComparisonBox = function(sc) {
    const text = sc.text || '';
    const label = sc.label || 'Lưu ý & Lỗi sai thường gặp';
    
    let wrongSentence = '';
    let correctSentence = '';
    let explanation = text;

    if (text.includes('❌') || text.includes('Sai:')) {
        const parts = text.split('\n');
        parts.forEach(p => {
            if (p.includes('❌') || p.includes('Sai:')) wrongSentence = p;
            else if (p.includes('✅') || p.includes('Đúng:')) correctSentence = p;
        });
    }

    return `
        <div class="error-comparison-box">
            <div class="error-title">
                <span>⚠️</span>
                <span>${label.replace(/[:：]/g, '')}</span>
            </div>
            <div style="font-size:13.5px;color:#334155;line-height:1.6;margin-bottom:8px;">
                ${explanation.replace(/\n/g, '<br>')}
            </div>
            ${(wrongSentence || correctSentence) ? `
                <div class="error-pair">
                    ${wrongSentence ? `<div class="wrong-badge-card"><span style="color:#dc2626;font-weight:700;">❌ Lỗi sai thường gặp:</span><br>${wrongSentence.replace(/❌|Sai:/g, '').trim()}</div>` : ''}
                    ${correctSentence ? `<div class="correct-badge-card"><span style="color:#16a34a;font-weight:700;">✅ Câu đúng chuẩn:</span><br>${correctSentence.replace(/✅|Đúng:/g, '').trim()}</div>` : ''}
                </div>
            ` : ''}
        </div>
    `;
};

window.grammarComparisonData = [];
window.comparisonPracticeExercises = null;

window.loadComparisonExercises = async function() {
    if (!window.comparisonPracticeExercises) {
        try {
            const res = await fetch('data/comparison/exercises.json');
            if (res.ok) {
                window.comparisonPracticeExercises = await res.json();
            }
        } catch (e) {
            console.error('Error loading comparison exercises:', e);
        }
    }
    return window.comparisonPracticeExercises;
};

window.openGrammarComparisonModal = async function() {
    const existing = document.getElementById('grammar-comparison-modal');
    if (existing) existing.remove();

    if (!window.grammarComparisonData || window.grammarComparisonData.length === 0) {
        window.grammarComparisonData = [];
        const levels = ['hsk1', 'hsk2', 'hsk3', 'hsk4', 'hsk5', 'hsk6'];
        for (const lvl of levels) {
            try {
                const res = await fetch(`data/comparison/${lvl}.json`);
                if (res.ok) {
                    const data = await res.json();
                    if (Array.isArray(data)) {
                        window.grammarComparisonData.push(...data);
                    }
                }
            } catch (e) {
                console.error('Error loading comparison data for modal:', lvl, e);
            }
        }
    }

    const modal = document.createElement('div');
    modal.id = 'grammar-comparison-modal';
    modal.className = 'grammar-comparison-modal';

    let listHtml = '';
    window.grammarComparisonData.forEach((item) => {
        let tableRows = '';
        if (item.table && Array.isArray(item.table)) {
            item.table.forEach(r => {
                tableRows += `
                    <tr>
                        <td style="font-weight:700;color:#be185d;width:25%;">${r.item}</td>
                        <td style="color:#0284c7;font-weight:600;width:37.5%;">${r.er}</td>
                        <td style="color:#d97706;font-weight:600;width:37.5%;">${r.liang}</td>
                    </tr>
                `;
            });
        }

        listHtml += `
            <div class="grammar-comparison-card" style="background:white;border:1.5px solid #fbcfe8;border-radius:18px;padding:20px;margin-bottom:18px;box-shadow:0 4px 16px rgba(0,0,0,0.03);">
                <div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:8px;margin-bottom:8px;">
                    <span style="background:#fdf2f8;color:#be185d;border:1px solid #fbcfe8;font-size:11px;font-weight:800;padding:3px 10px;border-radius:12px;">${item.level} • ${item.type || 'Phân biệt ngữ pháp'}</span>
                    <button onclick="playAudio('${(item.title || '').replace(/'/g, "\\'")}')" style="background:#f3e8ff;color:#7e22ce;border:none;padding:4px 12px;border-radius:12px;font-weight:700;font-size:12px;cursor:pointer;">🔊 Nghe</button>
                </div>
                <h3 style="font-size:20px;font-weight:800;color:#1e293b;margin:0 0 6px 0;font-family:'Lexend',sans-serif;">${item.title}</h3>
                <p style="font-size:13.5px;color:#475569;margin:0 0 14px 0;line-height:1.5;">${item.desc || ''}</p>

                ${tableRows ? `
                <div class="grammar-table-wrapper" style="margin-bottom:12px;">
                    <table class="grammar-table">
                        <thead>
                            <tr>
                                <th>📌 Tiêu chí</th>
                                <th>Từ / Cấu trúc A</th>
                                <th>Từ / Cấu trúc B</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${tableRows}
                        </tbody>
                    </table>
                </div>
                ` : ''}

                <div class="error-pair" style="margin-bottom:10px;">
                    ${item.wrong ? `<div class="wrong-badge-card"><span style="color:#dc2626;font-weight:700;">❌ Bẫy lỗi sai thường gặp:</span><br>${item.wrong}</div>` : ''}
                    ${item.correct ? `<div class="correct-badge-card"><span style="color:#16a34a;font-weight:700;">✅ Câu dùng đúng chuẩn:</span><br>${item.correct}</div>` : ''}
                </div>

                ${item.tip ? `
                <div style="padding:10px 14px;background:#f0f9ff;border:1px solid #bae6fd;border-radius:12px;font-size:12.5px;color:#0369a1;font-weight:600;">
                    ${item.tip}
                </div>
                ` : ''}
            </div>
        `;
    });

    modal.innerHTML = `
        <div class="grammar-comparison-content">
            <div style="background:linear-gradient(135deg, #fdf2f8, #fce7f3);padding:20px 24px;border-bottom:1.5px solid #fbcfe8;display:flex;align-items:center;justify-content:space-between;">
                <div>
                    <h2 style="font-size:20px;font-weight:800;color:#be185d;margin:0;font-family:'Lexend',sans-serif;">⚖️ So Sánh & Lưu Ý Từ Vựng/Ngữ Pháp Thường Sai (HSK 1 - 6)</h2>
                    <p style="font-size:12.5px;color:#9d174d;margin:4px 0 0 0;">Tổng hợp chi tiết các bẫy ngữ pháp, cặp từ dễ nhầm lẫn và tuyệt chiêu phân biệt nhanh</p>
                </div>
                <button onclick="document.getElementById('grammar-comparison-modal').remove()" style="background:white;color:#be185d;border:1.5px solid #fbcfe8;width:36px;height:36px;border-radius:50%;font-size:18px;font-weight:800;cursor:pointer;display:flex;align-items:center;justify-content:center;box-shadow:0 2px 8px rgba(0,0,0,0.05);">✕</button>
            </div>
            <div style="padding:20px;overflow-y:auto;flex:1;">
                ${listHtml}
            </div>
        </div>
    `;

    document.body.appendChild(modal);
};

window.comparisonUserAnswers = {};

window.selectComparisonAnswer = function(qId, selectedIdx, correctIdx, explanation) {
    window.comparisonUserAnswers[qId] = { selected: selectedIdx, correct: correctIdx, explanation: explanation };
    
    const card = document.getElementById(`practice_card_${qId}`);
    if (card) {
        const btns = card.querySelectorAll('.practice-opt-btn');
        btns.forEach((btn, idx) => {
            if (idx === selectedIdx) {
                btn.style.background = '#0284c7';
                btn.style.color = 'white';
                btn.style.borderColor = '#0284c7';
                btn.style.boxShadow = '0 2px 8px rgba(2,132,199,0.3)';
            } else {
                btn.style.background = 'white';
                btn.style.color = '#334155';
                btn.style.borderColor = '#cbd5e1';
                btn.style.boxShadow = 'none';
            }
        });
    }
};

window.gradeComparisonPractice = function() {
    const cards = document.querySelectorAll('.practice-q-card');
    let total = cards.length;
    if (total === 0) return;

    let correctCount = 0;

    cards.forEach(card => {
        const qId = card.getAttribute('data-qid');
        const userAns = window.comparisonUserAnswers[qId];
        const feedbackDiv = card.querySelector('.practice-feedback');
        
        if (!feedbackDiv) return;

        if (!userAns) {
            feedbackDiv.style.display = 'block';
            feedbackDiv.style.background = '#fff7ed';
            feedbackDiv.style.borderColor = '#fdba74';
            feedbackDiv.innerHTML = `<span style="color:#c2410c;font-weight:700;">⚠️ Bạn chưa chọn đáp án cho câu này!</span>`;
            return;
        }

        const isCorrect = userAns.selected === userAns.correct;
        if (isCorrect) correctCount++;

        feedbackDiv.style.display = 'block';
        feedbackDiv.style.background = isCorrect ? '#f0fdf4' : '#fef2f2';
        feedbackDiv.style.borderColor = isCorrect ? '#86efac' : '#fca5a5';
        feedbackDiv.innerHTML = `
            <div style="font-weight:800;font-size:14px;color:${isCorrect ? '#16a34a' : '#dc2626'};margin-bottom:4px;">
                ${isCorrect ? '✅ Chính xác! Bạn làm rất tốt.' : '❌ Chưa chính xác! Bẫy lỗi sai cần lưu ý:'}
            </div>
            <div style="font-size:13px;color:#334155;line-height:1.5;">
                💡 <b>Giải thích chi tiết:</b> ${userAns.explanation}
            </div>
        `;
    });

    const scorePct = Math.round((correctCount / total) * 100);
    const scoreResultDiv = document.getElementById('comparison-score-result');
    if (scoreResultDiv) {
        scoreResultDiv.style.display = 'block';
        let gradeBadge = '🌟 Xuất sắc!';
        if (scorePct < 50) gradeBadge = '💪 Cần ôn tập thêm!';
        else if (scorePct < 80) gradeBadge = '👍 Khá tốt!';

        scoreResultDiv.innerHTML = `
            <div style="background:linear-gradient(135deg, #f0f9ff, #e0f2fe);border:2px solid #0284c7;border-radius:16px;padding:22px;text-align:center;box-shadow:0 4px 16px rgba(2,132,199,0.15);margin-top:20px;">
                <div style="font-size:13px;font-weight:800;color:#0369a1;text-transform:uppercase;letter-spacing:0.5px;">KẾT QUẢ CHẤM ĐIỂM BÀI TẬP BẪY LỖI SAI (${scorePct}/100 ĐIỂM)</div>
                <div style="font-size:38px;font-weight:900;color:#0284c7;margin:8px 0;font-family:'Lexend',sans-serif;">${scorePct} / 100 Điểm</div>
                <div style="font-size:16px;font-weight:700;color:#0369a1;margin-bottom:12px;">Đúng ${correctCount} / ${total} câu • ${gradeBadge}</div>
                <p style="font-size:13px;color:#475569;margin:0 0 14px 0;">Đã ghi nhận kết quả làm bài tập phân biệt ngữ pháp & bẫy lỗi sai vào tài khoản học tập.</p>
                <button onclick="window.gradeComparisonPractice()" style="padding:9px 22px;background:#0284c7;color:white;border:none;border-radius:10px;font-weight:700;font-size:13.5px;cursor:pointer;box-shadow:0 2px 8px rgba(2,132,199,0.3);">🔄 Nộp bài / Chấm lại</button>
            </div>
        `;
        scoreResultDiv.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
};

window.renderComparisonPracticeTab = function(lvl, targetFilter, allComparisonData) {
    window.comparisonUserAnswers = {};
    const exercises = [];

    const curated = (window.comparisonPracticeExercises && window.comparisonPracticeExercises[targetFilter]) || [];
    curated.forEach(ex => exercises.push(ex));

    if (allComparisonData && Array.isArray(allComparisonData)) {
        allComparisonData.forEach((item, idx) => {
            if (item.wrong && item.correct) {
                const cleanWrong = item.wrong.replace(/❌|Sai:|Lỗi sai:/g, '').trim();
                const cleanCorrect = item.correct.replace(/✅|Đúng:|Chuẩn:/g, '').trim();
                exercises.push({
                    id: `dyn_${targetFilter}_${idx}`,
                    title: item.title,
                    question: `Trắc nghiệm bẫy lỗi sai: Trong hai câu dưới đây về <b>"${item.title}"</b>, câu nào dùng ĐÚNG ngữ pháp?`,
                    options: [`❌ ${cleanWrong}`, `✅ ${cleanCorrect}`],
                    correct: 1,
                    explanation: item.tip ? `${item.tip}` : `Câu đúng là "${cleanCorrect}". Lỗi sai cần tránh: "${cleanWrong}".`
                });
            }
        });
    }

    if (exercises.length === 0) {
        return `
            <div style="background:white;padding:30px;border-radius:16px;border:1px solid #bae6fd;text-align:center;color:#475569;">
                <span style="font-size:32px;">📝</span>
                <h3 style="font-size:18px;font-weight:800;color:#0284c7;margin:10px 0 6px 0;">Đang cập nhật bài tập cho ${targetFilter.toUpperCase()}</h3>
                <p style="font-size:13.5px;margin:0;">Dữ liệu bài tập thực hành bẫy lỗi sai đang được cập nhật thêm.</p>
            </div>
        `;
    }

    let qHtml = '';
    exercises.forEach((ex, qIdx) => {
        let optsHtml = '';
        ex.options.forEach((opt, optIdx) => {
            optsHtml += `
                <button class="practice-opt-btn" onclick="selectComparisonAnswer('${ex.id}', ${optIdx}, ${ex.correct}, '${(ex.explanation || '').replace(/'/g, "\\'").replace(/\n/g, ' ')}')" style="width:100%;text-align:left;padding:11px 16px;border:1.5px solid #cbd5e1;border-radius:12px;background:white;color:#334155;font-size:14px;font-weight:600;cursor:pointer;transition:all 0.2s ease;margin-bottom:8px;">
                    ${opt}
                </button>
            `;
        });

        qHtml += `
            <div class="practice-q-card" id="practice_card_${ex.id}" data-qid="${ex.id}" style="background:white;border:1.5px solid #bae6fd;border-radius:16px;padding:20px;margin-bottom:16px;box-shadow:0 2px 10px rgba(0,0,0,0.02);">
                <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px;">
                    <span style="font-size:12px;font-weight:800;color:#0284c7;background:#e0f2fe;padding:3px 10px;border-radius:10px;">Câu ${qIdx + 1} • ${ex.title || targetFilter.toUpperCase()}</span>
                </div>
                <div style="font-size:15px;font-weight:700;color:#0f172a;margin-bottom:12px;line-height:1.5;">${ex.question}</div>
                <div style="margin-bottom:10px;">
                    ${optsHtml}
                </div>
                <div class="practice-feedback" style="display:none;padding:12px 14px;border-radius:12px;border:1px solid #cbd5e1;margin-top:10px;"></div>
            </div>
        `;
    });

    return `
        <div>
            <div style="margin-bottom:16px;display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:10px;background:white;padding:14px 18px;border-radius:14px;border:1.5px solid #bae6fd;">
                <div>
                    <span style="font-size:15px;font-weight:800;color:#0284c7;">📝 Luyện Tập</span>
                    <p style="font-size:12.5px;color:#475569;margin:2px 0 0 0;">Chọn đáp án đúng cho mỗi câu và nhấn "Nộp Bài & Chấm Điểm" để kiểm tra kết quả</p>
                </div>
                <button onclick="gradeComparisonPractice()" style="padding:10px 22px;background:linear-gradient(135deg, #0284c7, #0369a1);color:white;border:none;border-radius:12px;font-weight:800;font-size:14px;cursor:pointer;box-shadow:0 4px 12px rgba(2,132,199,0.25);">
                    📊 Nộp Bài & Chấm Điểm
                </button>
            </div>
            ${qHtml}
            <div id="comparison-score-result" style="display:none;margin-top:20px;"></div>
        </div>
    `;
};

window.renderGrammarComparisonModule = async function(lvl, filterLevel, activeTab) {
    const ci = getContentInner();
    if (!ci) return;

    const targetFilter = filterLevel || 'all';
    const currentTab = activeTab || 'theory';

    ci.innerHTML = `
        <div id="loading">
            <div class="spinner"></div>
            <p style="color: #0284c7;">Đang tải dữ liệu so sánh ngữ pháp...</p>
        </div>
    `;

    await window.loadComparisonExercises();

    let allComparisonData = [];
    const levelsToLoad = (targetFilter === 'all') 
        ? ['hsk1', 'hsk2', 'hsk3', 'hsk4', 'hsk5', 'hsk6'] 
        : [targetFilter];

    for (const l of levelsToLoad) {
        try {
            const res = await fetch(`data/comparison/${l}.json`);
            if (res.ok) {
                const data = await res.json();
                if (Array.isArray(data)) {
                    data.forEach(item => {
                        if (!item.level) item.level = l.toUpperCase();
                    });
                    allComparisonData.push(...data);
                }
            }
        } catch (err) {
            console.error('Error loading comparison data for', l, err);
        }
    }

    if (allComparisonData.length === 0 && window.grammarComparisonData) {
        if (targetFilter === 'all') {
            allComparisonData = window.grammarComparisonData;
        } else {
            allComparisonData = window.grammarComparisonData.filter(d => 
                (d.level || '').toLowerCase().includes(targetFilter.toLowerCase())
            );
            if (allComparisonData.length === 0) allComparisonData = window.grammarComparisonData;
        }
    }

    let tabMainContentHtml = '';

    if (currentTab === 'theory') {
        let cardsHtml = '';
        allComparisonData.forEach((item) => {
            let tableRows = '';
            if (item.table && Array.isArray(item.table)) {
                item.table.forEach(r => {
                    tableRows += `
                        <tr>
                            <td style="font-weight:700;color:#0284c7;width:25%;">${r.item}</td>
                            <td style="color:#0369a1;font-weight:600;width:37.5%;">${r.er}</td>
                            <td style="color:#d97706;font-weight:600;width:37.5%;">${r.liang}</td>
                        </tr>
                    `;
                });
            }

            cardsHtml += `
                <div class="grammar-comparison-card" style="background:white;border:1.5px solid #bae6fd;border-radius:18px;padding:22px;margin-bottom:20px;box-shadow:0 4px 16px rgba(2,132,199,0.06);">
                    <div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:8px;margin-bottom:10px;">
                        <span style="background:#e0f2fe;color:#0284c7;border:1px solid #bae6fd;font-size:12px;font-weight:800;padding:4px 12px;border-radius:14px;">${item.level} • ${item.type || 'Lưu ý lỗi sai'}</span>
                    </div>
                    <h3 style="font-size:22px;font-weight:800;color:#0f172a;margin:0 0 8px 0;font-family:'Lexend',sans-serif;">${item.title}</h3>
                    <p style="font-size:14px;color:#475569;margin:0 0 16px 0;line-height:1.6;">${item.desc}</p>

                    ${tableRows ? `
                    <div class="grammar-table-wrapper" style="margin-bottom:14px;">
                        <table class="grammar-table">
                            <thead>
                                <tr>
                                    <th>Tiêu chí phân biệt</th>
                                    <th>Từ/ Cấu trúc A</th>
                                    <th>Từ/ Cấu trúc B</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${tableRows}
                            </tbody>
                        </table>
                    </div>` : ''}

                    <div class="error-pair" style="margin-bottom:12px;">
                        <div class="wrong-badge-card"><span style="color:#dc2626;font-weight:800;">❌ Bẫy lỗi sai thường gặp:</span><br>${item.wrong}</div>
                        <div class="correct-badge-card"><span style="color:#16a34a;font-weight:800;">✅ Câu dùng đúng chuẩn:</span><br>${item.correct}</div>
                    </div>

                    <div style="padding:12px 16px;background:#f0f9ff;border:1px solid #bae6fd;border-radius:12px;font-size:13px;color:#0369a1;font-weight:700;display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:10px;">
                        <div>${item.tip}</div>
                        <button onclick="renderGrammarComparisonModule('${lvl}', '${targetFilter}', 'practice')" style="padding:6px 14px;background:#0284c7;color:white;border:none;border-radius:10px;font-size:12px;font-weight:700;cursor:pointer;box-shadow:0 2px 8px rgba(2,132,199,0.25);">✍️ Luyện bài tập bẫy lỗi sai</button>
                    </div>
                </div>
            `;
        });
        tabMainContentHtml = `<div id="comparison-cards-container">${cardsHtml}</div>`;
    } else {
        tabMainContentHtml = window.renderComparisonPracticeTab(lvl, targetFilter, allComparisonData);
    }

    const titleText = targetFilter === 'all' ? 'TỔNG HỢP HSK 1 - HSK 6' : targetFilter.toUpperCase();

    ci.innerHTML = `
        <div style="background:linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%);padding:24px;border-radius:20px;border:1.5px solid #bae6fd;margin-bottom:20px;box-shadow:0 4px 16px rgba(2,132,199,0.08);">
            <div style="display:flex;align-items:center;gap:14px;margin-bottom:12px;">
                <span style="font-size:36px;">⚖️</span>
                <div>
                    <h2 style="font-size:22px;font-weight:800;color:#0284c7;margin:0;font-family:'Lexend',sans-serif;">Lưu Ý Lỗi Sai Thường Gặp (${titleText})</h2>
                </div>
            </div>

            <!-- Level Selector Bar -->
            <div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:14px;background:white;padding:8px 12px;border-radius:14px;border:1px solid #bae6fd;">
                <span style="font-size:13px;font-weight:700;color:#0369a1;display:flex;align-items:center;margin-right:4px;">Cấp độ:</span>
                <button onclick="renderGrammarComparisonModule('${lvl}', 'hsk1', '${currentTab}')" style="padding:6px 14px;border-radius:10px;font-size:12.5px;font-weight:800;cursor:pointer;${targetFilter === 'hsk1' ? 'background:#0284c7;color:white;border:none;box-shadow:0 2px 8px rgba(2,132,199,0.3);' : 'background:#f8fafc;color:#0369a1;border:1px solid #bae6fd;'}">HSK 1</button>
                <button onclick="renderGrammarComparisonModule('${lvl}', 'hsk2', '${currentTab}')" style="padding:6px 14px;border-radius:10px;font-size:12.5px;font-weight:800;cursor:pointer;${targetFilter === 'hsk2' ? 'background:#0284c7;color:white;border:none;box-shadow:0 2px 8px rgba(2,132,199,0.3);' : 'background:#f8fafc;color:#0369a1;border:1px solid #bae6fd;'}">HSK 2</button>
                <button onclick="renderGrammarComparisonModule('${lvl}', 'hsk3', '${currentTab}')" style="padding:6px 14px;border-radius:10px;font-size:12.5px;font-weight:800;cursor:pointer;${targetFilter === 'hsk3' ? 'background:#0284c7;color:white;border:none;box-shadow:0 2px 8px rgba(2,132,199,0.3);' : 'background:#f8fafc;color:#0369a1;border:1px solid #bae6fd;'}">HSK 3</button>
                <button onclick="renderGrammarComparisonModule('${lvl}', 'hsk4', '${currentTab}')" style="padding:6px 14px;border-radius:10px;font-size:12.5px;font-weight:800;cursor:pointer;${targetFilter === 'hsk4' ? 'background:#0284c7;color:white;border:none;box-shadow:0 2px 8px rgba(2,132,199,0.3);' : 'background:#f8fafc;color:#0369a1;border:1px solid #bae6fd;'}">HSK 4</button>
                <button onclick="renderGrammarComparisonModule('${lvl}', 'hsk5', '${currentTab}')" style="padding:6px 14px;border-radius:10px;font-size:12.5px;font-weight:800;cursor:pointer;${targetFilter === 'hsk5' ? 'background:#0284c7;color:white;border:none;box-shadow:0 2px 8px rgba(2,132,199,0.3);' : 'background:#f8fafc;color:#0369a1;border:1px solid #bae6fd;'}">HSK 5</button>
                <button onclick="renderGrammarComparisonModule('${lvl}', 'hsk6', '${currentTab}')" style="padding:6px 14px;border-radius:10px;font-size:12.5px;font-weight:800;cursor:pointer;${targetFilter === 'hsk6' ? 'background:#0284c7;color:white;border:none;box-shadow:0 2px 8px rgba(2,132,199,0.3);' : 'background:#f8fafc;color:#0369a1;border:1px solid #bae6fd;'}">HSK 6</button>
            </div>

            <!-- Tab Navigation -->
            <div style="display:flex;align-items:center;justify-content:space-between;gap:10px;margin:10px 0 0 0;border-bottom:1.5px solid #bae6fd;padding-bottom:12px;flex-wrap:wrap;">
                <div style="display:flex;gap:10px;flex-wrap:wrap;">
                    <button onclick="renderGrammarComparisonModule('${lvl}', '${targetFilter}', 'theory')" style="padding:9px 18px;border-radius:12px;font-size:13.5px;font-weight:700;cursor:pointer;display:inline-flex;align-items:center;gap:6px;${currentTab === 'theory' ? 'background:#0284c7;color:white;border:none;box-shadow:0 4px 12px rgba(2,132,199,0.25);' : 'background:white;color:#0369a1;border:1px solid #bae6fd;'}">
                        📖 Lý Thuyết
                    </button>
                    <button onclick="renderGrammarComparisonModule('${lvl}', '${targetFilter}', 'practice')" style="padding:9px 18px;border-radius:12px;font-size:13.5px;font-weight:700;cursor:pointer;display:inline-flex;align-items:center;gap:6px;${currentTab === 'practice' ? 'background:#0284c7;color:white;border:none;box-shadow:0 4px 12px rgba(2,132,199,0.25);' : 'background:white;color:#0369a1;border:1px solid #bae6fd;'}">
                        📝 Bài Tập & Chấm Điểm
                    </button>
                </div>
                ${currentTab === 'theory' ? `
                <input type="text" id="comparison-search-input" oninput="window.filterComparisonCards(this.value)" placeholder="🔍 Tìm kiếm lưu ý tổng hợp..." style="padding:8px 16px;border-radius:12px;border:1.5px solid #bae6fd;font-size:13.5px;width:290px;outline:none;background:white;">
                ` : ''}
            </div>
        </div>

        ${tabMainContentHtml}
    `;
};

function buildAiFeedbackPrompt(type, title, userText, sampleText) {
    const cleanedText = String(userText || '').trim();
    if (type === 'speaking') {
        return `Bạn là giáo viên tiếng Trung chuyên HSK. Hãy chấm câu trả lời nói của học viên cho chủ đề "${title}". Bài nói: "${cleanedText}". Hãy đưa ra: 1) điểm số 0-100, 2) nhận xét về phát âm và thanh điệu, 3) 3 lỗi cần sửa, 4) câu trả lời mẫu chuẩn, 5) cách luyện ngay trong 3 ngày.`;
    }
    if (type === 'exam-writing') {
        return `Bạn là giáo viên chấm HSK 6. Hãy chấm bài viết tóm tắt tiếng Trung của học viên cho đề "${title}". Bài viết: "${cleanedText}". Hãy đưa ra: 1) điểm số 0-100, 2) đánh giá về nội dung theo chuẩn HSK, 3) lỗi ngữ pháp và từ vựng cần sửa, 4) bản viết cải thiện ngắn gọn, 5) gợi ý cách nâng điểm.`;
    }
    return `Bạn là giáo viên tiếng Trung. Hãy chấm bài viết của học viên cho chủ đề "${title}". Bài viết: "${cleanedText}". Hãy đưa ra: 1) điểm số 0-100, 2) lỗi ngữ pháp, 3) sửa lỗi, 4) câu viết tốt hơn, 5) cách nói tự nhiên hơn.`;
}

window.requestAiGrading = async function(type, title, userText, sampleText) {
    try {
        const res = await fetch('/api/ai/grade', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ type, title, userText, sampleText })
        });
        const data = await res.json();
        if (data && data.evaluation) {
            return data.evaluation;
        }
    } catch (err) {
        console.error('Lỗi khi gửi yêu cầu chấm AI:', err);
    }
    return null;
};

window.renderAiEvaluationHtml = function(evalData) {
    if (!evalData) {
        return `
            <div style="background:#fff1f2;border:1px solid #fecdd3;padding:14px;border-radius:12px;color:#be123c;font-weight:600;font-size:13.5px;margin-top:12px;">
                ⚠️ Không thể lấy kết quả chấm từ AI. Vui lòng thử lại sau.
            </div>
        `;
    }
    const score = evalData.score || 85;
    const overall = evalData.overall_feedback || '';
    const corrections = evalData.detailed_corrections || [];
    const improved = evalData.improved_version || '';
    const tips = evalData.actionable_tips || [];

    let correctionsHtml = '';
    if (corrections.length > 0) {
        correctionsHtml = `
            <div style="margin-top:12px;margin-bottom:12px;">
                <div style="font-size:13px;font-weight:800;color:#9333ea;margin-bottom:6px;">✍️ Chi tiết sửa lỗi ngữ pháp & từ vựng:</div>
                <div style="display:flex;flex-direction:column;gap:8px;">
                    ${corrections.map(c => `
                        <div style="background:white;padding:10px 12px;border-radius:10px;border:1px solid #e9d5ff;">
                            <div style="font-size:13px;color:#dc2626;font-weight:700;">❌ Lỗi: "${escapeHtml(c.original || '')}"</div>
                            <div style="font-size:13.5px;color:#16a34a;font-weight:800;margin-top:2px;">✅ Sửa chuẩn: "${escapeHtml(c.correction || '')}"</div>
                            ${c.explanation ? `<div style="font-size:12px;color:#64748b;margin-top:3px;">💡 Giải thích: ${escapeHtml(c.explanation)}</div>` : ''}
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    }

    let tipsHtml = '';
    if (tips.length > 0) {
        tipsHtml = `
            <div style="margin-top:12px;padding:10px 12px;background:#f0fdf4;border:1px solid #86efac;border-radius:10px;">
                <div style="font-size:13px;font-weight:800;color:#15803d;margin-bottom:4px;">💡 Lời khuyên nâng điểm từ AI:</div>
                <ul style="margin:0;padding-left:18px;font-size:12.5px;color:#166534;line-height:1.6;">
                    ${tips.map(t => `<li>${escapeHtml(t)}</li>`).join('')}
                </ul>
            </div>
        `;
    }

    return `
        <div style="background:#fcf5ff;border:1.5px solid #d8b4fe;border-radius:14px;padding:16px;margin-top:14px;box-shadow:0 4px 12px rgba(147,51,234,0.06);">
            <div style="display:flex;align-items:center;justify-content:space-between;border-bottom:1px solid #e9d5ff;padding-bottom:10px;margin-bottom:10px;flex-wrap:wrap;gap:8px;">
                <span style="font-size:15px;font-weight:800;color:#7e22ce;">🤖 Kết Quả AI Chấm & Phân Tích Chi Tiết:</span>
                <span style="background:#dcfce7;color:#15803d;padding:4px 14px;border-radius:20px;font-weight:800;font-size:14px;border:1px solid #86efac;">Điểm AI: ${score}/100</span>
            </div>

            ${overall ? `
                <div style="margin-bottom:10px;font-size:13.5px;color:#334155;line-height:1.6;background:white;padding:10px 12px;border-radius:10px;border:1px solid #f3e8ff;">
                    <strong style="color:#6b21a8;">📌 Nhận xét tổng quan:</strong> ${escapeHtml(overall)}
                </div>
            ` : ''}

            ${correctionsHtml}

            ${improved ? `
                <div style="margin-bottom:10px;padding:10px 12px;background:white;border:1px solid #bae6fd;border-radius:10px;">
                    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:4px;">
                        <strong style="color:#0284c7;font-size:13px;">✨ Bản diễn đạt chuẩn & mượt mà hơn:</strong>
                        <button onclick="navigator.clipboard.writeText('${escapeQuotes(improved)}')" style="padding:2px 8px;background:#e0f2fe;color:#0369a1;border:none;border-radius:6px;font-size:11px;font-weight:700;cursor:pointer;">Sao chép</button>
                    </div>
                    <div style="font-size:14.5px;color:#0f172a;font-weight:700;line-height:1.6;">${escapeHtml(improved)}</div>
                </div>
            ` : ''}

            ${tipsHtml}
        </div>
    `;
};

window.gradeExamEssayInline = async function(btnEl, essayText) {
    const feedbackContainer = document.getElementById('exam-ai-feedback-container');
    if (!feedbackContainer) return;
    feedbackContainer.style.display = 'block';
    feedbackContainer.innerHTML = `
        <div style="display:flex;align-items:center;gap:10px;padding:14px;background:#f3e8ff;border-radius:12px;color:#7e22ce;font-weight:700;">
            <div class="spinner" style="width:20px;height:20px;border-width:2px;"></div>
            🤖 AI đang phân tích bài tóm tắt HSK 6 & đưa ra nhận xét chi tiết bên dưới...
        </div>
    `;
    const evalData = await window.requestAiGrading('exam-writing', 'HSK 6 - Viết tóm tắt', essayText, '');
    feedbackContainer.innerHTML = window.renderAiEvaluationHtml(evalData);
};

window.openAiFeedbackPrompt = function(type, title, userText, sampleText) {
    const activeBox = document.querySelector('.ai-feedback-box');
    if (activeBox) {
        activeBox.style.display = 'block';
        activeBox.innerHTML = `
            <div style="display:flex;align-items:center;gap:10px;padding:14px;background:#f3e8ff;border-radius:12px;color:#7e22ce;font-weight:700;">
                <div class="spinner" style="width:20px;height:20px;border-width:2px;"></div>
                🤖 AI đang chấm & nhận xét bài làm trực tiếp...
            </div>
        `;
        window.requestAiGrading(type, title, userText, sampleText).then(evalData => {
            activeBox.innerHTML = window.renderAiEvaluationHtml(evalData);
        });
    }
};

/* AI WRITING MODULE */
window.renderWritingAiModule = async function(lvl) {
    const ci = getContentInner();
    if (!ci) return;

    const levelStr = lvl || currentLevel || 'hsk1';
    ci.innerHTML = `
        <div id="loading">
            <div class="spinner"></div>
            <p style="color: #8b5cf6;">Đang tải bài tập Luyện viết AI (${levelStr.toUpperCase()})...</p>
        </div>
    `;

    let writingData = null;
    try {
        const res = await fetch(`data/writing_ai/${levelStr}.json`);
        if (res.ok) writingData = await res.json();
    } catch (e) {
        console.error('Error loading writing_ai', e);
    }

    if (!writingData || !writingData.topics || writingData.topics.length === 0) {
        ci.innerHTML = `
            <div class="ai-module-header">
                <h2>✍️ Luyện Viết Với AI (${levelStr.toUpperCase()})</h2>
                <p>Chưa có dữ liệu bài viết cho cấp độ này. Hãy thử chọn cấp độ HSK 1 - HSK 6!</p>
            </div>
        `;
        return;
    }

    let topicsHtml = '';
    writingData.topics.forEach((t, idx) => {
        const keywordsHtml = (t.keywords || []).map(k => `<span style="background:#f3e8ff;color:#7e22ce;padding:2px 8px;border-radius:6px;font-size:12px;font-weight:700;">${k}</span>`).join(' ');

        topicsHtml += `
            <div class="ai-practice-card" id="writing-card-${t.id}">
                <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:10px;">
                    <span style="background:#f3e8ff;color:#7e22ce;padding:4px 12px;border-radius:12px;font-size:12px;font-weight:800;">${writingData.level} • Bài tập ${idx + 1}</span>
                    <button onclick="playAudio('${(t.prompt || '').replace(/'/g, "\\'")}')" style="background:#e0f2fe;color:#0284c7;border:none;padding:4px 12px;border-radius:10px;font-weight:700;font-size:12px;cursor:pointer;">🔊 Đọc đề bài</button>
                </div>
                <h3 style="font-size:18px;font-weight:800;color:#1e293b;margin-bottom:6px;">${t.title}</h3>
                <p style="font-size:14px;color:#334155;line-height:1.6;margin-bottom:12px;font-weight:600;">📌 Đề bài: ${t.prompt}</p>

                <div style="margin-bottom:14px;display:flex;align-items:center;gap:8px;flex-wrap:wrap;">
                    <span style="font-size:12.5px;color:#6b21a8;font-weight:700;">Từ khóa gợi ý:</span>
                    ${keywordsHtml}
                </div>

                <div style="margin-bottom:12px;">
                    <label style="display:block;font-size:13px;font-weight:700;color:#475569;margin-bottom:6px;">Nhập đoạn văn tiếng Trung của bạn:</label>
                    <textarea id="writing-input-${t.id}" rows="4" placeholder="VD: 你好！我叫小明。我是越南人..." style="width:100%;padding:12px;border:1.5px solid #d8b4fe;border-radius:12px;font-size:15px;outline:none;font-family:'Be Vietnam Pro',sans-serif;resize:vertical;"></textarea>
                </div>

                <div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap;">
                    <button onclick="window.submitWritingToAi('${t.id}', '${(t.sample || '').replace(/'/g, "\\'")}', '${(t.sample_py || '').replace(/'/g, "\\'")}', '${(t.sample_vi || '').replace(/'/g, "\\'")}')" style="padding:8px 18px;background:#8b5cf6;color:white;border:none;border-radius:12px;font-weight:700;font-size:13.5px;cursor:pointer;display:flex;align-items:center;gap:6px;">✨ Gửi AI chấm & sửa lỗi</button>
                    <button onclick="window.toggleSampleWriting('${t.id}')" style="padding:8px 16px;background:#fdf2f8;color:#be185d;border:1px solid #fbcfe8;border-radius:12px;font-weight:700;font-size:13px;cursor:pointer;">📖 Xem bài mẫu chuẩn</button>
                </div>

                <div id="sample-box-${t.id}" style="display:none;margin-top:14px;padding:14px;background:#fff8fa;border:1px dashed #fbcfe8;border-radius:12px;">
                    <div style="font-size:12.5px;font-weight:800;color:#be185d;margin-bottom:6px;">📖 Bài viết mẫu tham khảo:</div>
                    <div style="font-size:16px;font-weight:800;color:#0f172a;margin-bottom:4px;">${t.sample}</div>
                    <div style="font-size:13px;color:#db2777;font-weight:600;margin-bottom:4px;">${t.sample_py}</div>
                    <div style="font-size:13px;color:#334155;font-weight:500;">${t.sample_vi}</div>
                </div>

                <div id="ai-feedback-${t.id}" class="ai-feedback-box" style="display:none;"></div>
            </div>
        `;
    });

    ci.innerHTML = `
        <div class="ai-module-header">
            <div style="display:flex;align-items:center;gap:12px;">
                <span style="font-size:36px;">✍️</span>
                <div>
                    <h2 style="font-size:22px;font-weight:800;color:#6b21a8;margin:0;">Luyện Viết Tiếng Trung Với Trí Tuệ Nhân Tạo (AI)</h2>
                    <p style="font-size:13.5px;color:#7e22ce;margin:4px 0 0 0;">Thực hành viết theo chủ đề ${levelStr.toUpperCase()}, AI sẽ sửa lỗi ngữ pháp, gợi ý từ vựng nâng cao & chấm điểm</p>
                </div>
            </div>
        </div>
        ${topicsHtml}
    `;
};

window.submitWritingToAi = async function(topicId, sample, samplePy, sampleVi) {
    const inputEl = document.getElementById(`writing-input-${topicId}`);
    const feedbackBox = document.getElementById(`ai-feedback-${topicId}`);
    if (!inputEl || !feedbackBox) return;

    const userText = inputEl.value.trim();
    if (!userText) {
        alert('Vui lòng nhập đoạn văn tiếng Trung của bạn trước khi gửi AI chấm!');
        return;
    }

    feedbackBox.style.display = 'block';
    feedbackBox.innerHTML = `
        <div style="display:flex;align-items:center;gap:10px;padding:16px;background:#f3e8ff;border-radius:12px;color:#7e22ce;font-weight:700;">
            <div class="spinner" style="width:20px;height:20px;border-width:2px;"></div>
            🤖 AI đang phân tích bài viết, sửa lỗi ngữ pháp & nhận xét trực tiếp bên dưới...
        </div>
    `;

    const topicCard = document.getElementById(`writing-card-${topicId}`);
    const topicTitle = topicCard ? (topicCard.querySelector('h3')?.textContent || 'Luyện viết tiếng Trung') : 'Luyện viết tiếng Trung';

    const evalData = await window.requestAiGrading('writing', topicTitle, userText, sample);
    feedbackBox.innerHTML = window.renderAiEvaluationHtml(evalData);
};

window.toggleSampleWriting = function(topicId) {
    const box = document.getElementById(`sample-box-${topicId}`);
    if (box) {
        box.style.display = (box.style.display === 'none') ? 'block' : 'none';
    }
};

/* AI SPEAKING MODULE */
window.renderSpeakingAiModule = async function(lvl) {
    const ci = getContentInner();
    if (!ci) return;

    const levelStr = lvl || currentLevel || 'hsk1';
    ci.innerHTML = `
        <div id="loading">
            <div class="spinner"></div>
            <p style="color: #06b6d4;">Đang tải bài tập Luyện nói AI (${levelStr.toUpperCase()})...</p>
        </div>
    `;

    let speakingData = null;
    try {
        const res = await fetch(`data/speaking_ai/${levelStr}.json`);
        if (res.ok) speakingData = await res.json();
    } catch (e) {
        console.error('Error loading speaking_ai', e);
    }

    if (!speakingData || !speakingData.topics || speakingData.topics.length === 0) {
        ci.innerHTML = `
            <div class="ai-module-header">
                <h2>🎙️ Luyện Nói Với AI (${levelStr.toUpperCase()})</h2>
                <p>Chưa có dữ liệu bài nói cho cấp độ này. Hãy thử chọn cấp độ HSK 1 - HSK 6!</p>
            </div>
        `;
        return;
    }

    let topicsHtml = '';
    speakingData.topics.forEach((t, idx) => {
        topicsHtml += `
            <div class="ai-practice-card" id="speaking-card-${t.id}" style="border-color:#a5f3fc;">
                <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:10px;">
                    <span style="background:#cffaff;color:#0891b2;padding:4px 12px;border-radius:12px;font-size:12px;font-weight:800;">${speakingData.level} • Bài luyện nói ${idx + 1}</span>
                    <button onclick="playAudio('${(t.question || '').replace(/'/g, "\\'")}')" style="background:#e0f2fe;color:#0284c7;border:none;padding:5px 14px;border-radius:10px;font-weight:700;font-size:12.5px;cursor:pointer;">🔊 Nghe câu hỏi mẫu</button>
                </div>
                <h3 style="font-size:18px;font-weight:800;color:#1e293b;margin-bottom:6px;">${t.title}</h3>
                
                <div style="background:#ecfeff;border:1px solid #a5f3fc;padding:14px;border-radius:14px;margin-bottom:14px;">
                    <div style="font-size:13px;font-weight:800;color:#0891b2;margin-bottom:4px;">❓ Câu hỏi giao tiếp AI:</div>
                    <div style="font-size:18px;font-weight:800;color:#0f172a;margin-bottom:2px;">${t.question}</div>
                    ${t.question_py ? `<div style="font-size:13px;color:#db2777;font-weight:600;">${t.question_py}</div>` : ''}
                    ${t.question_vi ? `<div style="font-size:13px;color:#334155;font-weight:500;">${t.question_vi}</div>` : ''}
                </div>

                <div style="margin-bottom:14px;">
                    <div style="display:flex;align-items:center;gap:12px;margin-bottom:10px;flex-wrap:wrap;">
                        <button id="mic-btn-${t.id}" onclick="window.toggleSpeechRecognition('${t.id}')" style="padding:10px 20px;background:#06b6d4;color:white;border:none;border-radius:14px;font-weight:800;font-size:14px;cursor:pointer;display:flex;align-items:center;gap:8px;box-shadow:0 4px 12px rgba(6,182,212,0.25);">🎙️ Bắt đầu nói (Microphone)</button>
                        <span id="speech-status-${t.id}" style="font-size:13px;color:#64748b;font-weight:600;">Sẵn sàng thu âm...</span>
                    </div>
                    <input type="text" id="speaking-input-${t.id}" placeholder="Hoặc gõ câu trả lời tiếng Trung tại đây..." style="width:100%;padding:10px 14px;border:1.5px solid #a5f3fc;border-radius:12px;font-size:14.5px;outline:none;">
                </div>

                <div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap;">
                    <button onclick="window.submitSpeakingToAi('${t.id}', '${(t.sample_answer || '').replace(/'/g, "\\'")}', '${(t.sample_py || '').replace(/'/g, "\\'")}', '${(t.sample_vi || '').replace(/'/g, "\\'")}')" style="padding:8px 18px;background:#0891b2;color:white;border:none;border-radius:12px;font-weight:700;font-size:13.5px;cursor:pointer;display:flex;align-items:center;gap:6px;">✨ AI Nhận diện & Chấm phát âm</button>
                    <button onclick="window.toggleSampleSpeaking('${t.id}')" style="padding:8px 16px;background:#fdf2f8;color:#be185d;border:1px solid #fbcfe8;border-radius:12px;font-weight:700;font-size:13px;cursor:pointer;">📖 Xem câu trả lời mẫu</button>
                </div>

                <div id="sample-speaking-box-${t.id}" style="display:none;margin-top:14px;padding:14px;background:#fff8fa;border:1px dashed #fbcfe8;border-radius:12px;">
                    <div style="font-size:12.5px;font-weight:800;color:#be185d;margin-bottom:6px;">📖 Câu trả lời mẫu phát âm chuẩn:</div>
                    <div style="font-size:16px;font-weight:800;color:#0f172a;margin-bottom:4px;">${t.sample_answer}</div>
                    <div style="font-size:13px;color:#db2777;font-weight:600;margin-bottom:4px;">${t.sample_py}</div>
                    <div style="font-size:13px;color:#334155;font-weight:500;">${t.sample_vi}</div>
                </div>

                <div id="ai-speaking-feedback-${t.id}" class="ai-feedback-box" style="display:none;border-color:#06b6d4;background:#ecfeff;"></div>
            </div>
        `;
    });

    ci.innerHTML = `
        <div class="ai-module-header" style="background:linear-gradient(135deg, #e0f2fe 0%, #cffaff 100%);border-color:#a5f3fc;">
            <div style="display:flex;align-items:center;gap:12px;">
                <span style="font-size:36px;">🎙️</span>
                <div>
                    <h2 style="font-size:22px;font-weight:800;color:#0891b2;margin:0;">Luyện Nói Tiếng Trung Với AI Trợ Lý (${levelStr.toUpperCase()})</h2>
                    <p style="font-size:13.5px;color:#0e7490;margin:4px 0 0 0;">Luyện thu âm phát âm tiếng Trung, AI phân biệt thanh điệu, nhận diện giọng nói & chấm phản xạ</p>
                </div>
            </div>
        </div>
        ${topicsHtml}
    `;
};

window.toggleSpeechRecognition = function(topicId) {
    const statusEl = document.getElementById(`speech-status-${topicId}`);
    const inputEl = document.getElementById(`speaking-input-${topicId}`);
    const micBtn = document.getElementById(`mic-btn-${topicId}`);

    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
        alert('Trình duyệt của bạn chưa hỗ trợ nhận diện giọng nói trực tiếp. Bạn có thể gõ câu trả lời vào ô văn bản!');
        return;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.lang = 'zh-CN';
    recognition.interimResults = false;

    if (micBtn.dataset.recording === 'true') {
        recognition.stop();
        micBtn.dataset.recording = 'false';
        micBtn.innerHTML = '🎙️ Bắt đầu nói (Microphone)';
        micBtn.style.background = '#06b6d4';
        if (statusEl) statusEl.textContent = 'Đã dừng thu âm.';
        return;
    }

    micBtn.dataset.recording = 'true';
    micBtn.innerHTML = '🔴 Đang nghe... Hãy nói tiếng Trung!';
    micBtn.style.background = '#dc2626';
    if (statusEl) statusEl.textContent = '🎧 AI đang lắng nghe giọng nói tiếng Trung của bạn...';

    recognition.onresult = function(event) {
        const transcript = event.results[0][0].transcript;
        if (inputEl) inputEl.value = transcript;
        if (statusEl) statusEl.textContent = `✅ Đã thu âm: "${transcript}"`;
        micBtn.dataset.recording = 'false';
        micBtn.innerHTML = '🎙️ Bắt đầu nói (Microphone)';
        micBtn.style.background = '#06b6d4';
    };

    recognition.onerror = function(e) {
        if (statusEl) statusEl.textContent = 'Lỗi thu âm hoặc từ chối quyền micro.';
        micBtn.dataset.recording = 'false';
        micBtn.innerHTML = '🎙️ Bắt đầu nói (Microphone)';
        micBtn.style.background = '#06b6d4';
    };

    recognition.start();
};

window.submitSpeakingToAi = async function(topicId, sampleAnswer, samplePy, sampleVi) {
    const inputEl = document.getElementById(`speaking-input-${topicId}`);
    const feedbackBox = document.getElementById(`ai-speaking-feedback-${topicId}`);
    if (!inputEl || !feedbackBox) return;

    const userText = inputEl.value.trim();
    if (!userText) {
        alert('Vui lòng nói qua micro hoặc gõ câu trả lời trước khi bấm AI chấm!');
        return;
    }

    feedbackBox.style.display = 'block';
    feedbackBox.innerHTML = `
        <div style="display:flex;align-items:center;gap:10px;padding:16px;background:#e0f2fe;border-radius:12px;color:#0891b2;font-weight:700;">
            <div class="spinner" style="width:20px;height:20px;border-width:2px;"></div>
            🤖 AI đang chấm phát âm, thanh điệu & nhận xét bài nói trực tiếp bên dưới...
        </div>
    `;

    const topicCard = document.getElementById(`speaking-card-${topicId}`);
    const topicTitle = topicCard ? (topicCard.querySelector('h3')?.textContent || 'Luyện nói tiếng Trung') : 'Luyện nói tiếng Trung';

    const evalData = await window.requestAiGrading('speaking', topicTitle, userText, sampleAnswer);
    feedbackBox.innerHTML = window.renderAiEvaluationHtml(evalData);
};

window.toggleSampleSpeaking = function(topicId) {
    const box = document.getElementById(`sample-speaking-box-${topicId}`);
    if (box) {
        box.style.display = (box.style.display === 'none') ? 'block' : 'none';
    }
};

window.filterComparisonCards = function(query) {
    const q = (query || '').trim();
    const qLower = q.toLowerCase();
    const qNoAcc = window.removeAccents(q);

    const cards = document.querySelectorAll('.grammar-comparison-card');
    cards.forEach(card => {
        const text = card.textContent;
        const textLower = text.toLowerCase();
        const textNoAcc = window.removeAccents(text);

        if (!q || textLower.includes(qLower) || textNoAcc.includes(qNoAcc)) {
            card.style.display = 'block';
        } else {
            card.style.display = 'none';
        }
    });
};

        function renderGrammarLessons(level, data) {
            cachedData['grammar-' + level] = data;
            window.showLesson = showLesson;
            window.switchTab = switchTab;
            const wrapper = document.createElement('div');
            wrapper.className = level;

const layout = document.createElement('div');
layout.className = 'lesson-layout';  // ← THÊM DÒNG NÀY
layout.style.cssText = 'display:flex;gap:24px;align-items:flex-start;width:100%;max-width:100%;overflow:hidden;';

// Sidebar - ĐƠN GIẢN VÀ CHẮC CHẮN
const sidebar = document.createElement('div');
sidebar.className = 'lesson-sidebar';
sidebar.style.cssText = `
    width:300px;flex-shrink:0;background:white;border-radius:16px;
    border:1px solid #fce7f3;box-shadow:var(--shadow-sm);
    position:sticky;top:80px;max-height:calc(100vh - 120px);
    overflow-y:auto;overflow-x:hidden;padding:12px 0;
`;

const sidebarTitle = document.createElement('div');
sidebarTitle.className = 'sidebar-title';
sidebarTitle.textContent = 'Danh sách bài học';
sidebar.appendChild(sidebarTitle);

// KHÔNG dùng scrollWrapper, thêm trực tiếp lesson-item vào sidebar
// Trong vòng lặp, dùng: sidebar.appendChild(lessonItem);
            // Main content
            const mainContent = document.createElement('div');
            mainContent.className = 'lesson-main';
            mainContent.style.cssText = 'flex:1;min-width:0;';

            const banner = document.createElement('div');
            banner.style.cssText = `
                background: linear-gradient(135deg, #fdf2f8, #fce7f3);
                padding: 20px 30px; border-radius: 16px; margin-bottom: 25px;
                border: 1px solid #fbcfe8;
            `;
            banner.innerHTML = `
                <div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:12px;">
                    <div>
                        <div style="display:inline-block;background:rgba(255,255,255,0.6);padding:4px 16px;border-radius:20px;font-size:12px;font-weight:700;color:#be185d;border:1px solid rgba(236,72,153,0.2);margin-bottom:8px;">${data.badge || level.toUpperCase()}</div>
                        <h1 style="font-family:'Lexend',sans-serif;font-size:28px;color:#be185d;margin:0;">${data.title}</h1>
                        ${data.subtitle ? `<div style="font-size:15px;color:#db2777;font-weight:500;margin-top:4px;">${data.subtitle}</div>` : ''}
                    </div>
                </div>
            `;
            mainContent.appendChild(banner);

            // Local Search Input cho Ngữ pháp
            const grammarSearchBox = document.createElement('div');
            grammarSearchBox.style.cssText = 'margin-bottom:20px;display:flex;gap:10px;align-items:center;position:relative;';
            grammarSearchBox.innerHTML = `
                <div style="position:relative;flex:1;display:flex;align-items:center;">
                    <input type="text" class="grammar-local-search-input" placeholder="🔍 Tìm kiếm ngữ pháp trong cấp độ ${level.toUpperCase()}..." 
                           style="width:100%;padding:10px 16px 10px 38px;border:1.5px solid #fbcfe8;border-radius:12px;font-size:14px;outline:none;background:white;box-shadow:0 2px 8px rgba(236,72,153,0.06);transition:all 0.2s;" 
                           oninput="window.filterLocalGrammar(this.value, '${level}')"
                           onfocus="window.filterLocalGrammar(this.value, '${level}')" />
                    <div id="grammarSearchDropdown" class="local-search-dropdown" style="display:none;position:absolute;top:calc(100% + 6px);left:0;right:0;z-index:999;background:white;border:1px solid #fbcfe8;border-radius:14px;box-shadow:0 12px 30px rgba(0,0,0,0.15);max-height:360px;overflow-y:auto;"></div>
                </div>
            `;
            mainContent.appendChild(grammarSearchBox);

            const lessonsContainer = document.createElement('div');

            data.lessons.forEach((lesson, index) => {
                // Sidebar item
                const lessonItem = document.createElement('div');
                lessonItem.className = 'lesson-item' + (index === 0 ? ' active' : '');
                lessonItem.style.cssText = `
                    padding:10px 20px;cursor:pointer;transition:all 0.3s ease;
                    font-size:14px;color:#4a5568;border-left:3px solid transparent;border-bottom:none;
                    display:flex;align-items:center;gap:8px;
                `;
                if (index === 0) {
                    lessonItem.style.cssText += 'background:#fdf2f8;color:#be185d;font-weight:600;border-left-color:#ec4899;';
                }
                const isLearned = window.isLessonLearned(level, lesson.id);
                lessonItem.innerHTML = `
    <span class="lesson-num" style="background:${index === 0 ? '#ec4899' : '#fce7f3'};color:${index === 0 ? 'white' : '#be185d'};font-size:10px;font-weight:700;padding:2px 8px;border-radius:10px;min-width:28px;text-align:center;">${lesson.id}</span>
    <span>${lesson.title}</span>
    ${isLearned ? '<span class="learned-badge" style="margin-left:auto;font-size:12px;">✅</span>' : ''}
    <div class="lesson-item-tooltip">
        <div class="tooltip-title">Các phần trong bài</div>
        ${lesson.tabs.map((tab, tabIdx) => `
            <div class="tooltip-item" data-level="${level}" data-lesson="${lesson.id}" data-tab="${tab.id}">
                ${tab.title}
            </div>
        `).join('')}
        <div class="tooltip-item" data-level="${level}" data-lesson="${lesson.id}" data-tab="999" style="border-top: 1px solid #fce7f3; margin-top: 4px; padding-top: 10px;">
            Bài Tập
        </div>
    </div>
`;
                
                // Gán data attribute để dễ tìm
                lessonItem.dataset.level = level;
                lessonItem.dataset.lessonId = lesson.id;
                
                lessonItem.onclick = function(e) {
                    // Ngăn chặn sự kiện từ tooltip
                    if (e.target.closest('.lesson-item-tooltip')) return;
                    
                    const lv = this.dataset.level;
                    const lid = parseInt(this.dataset.lessonId);
                    showLesson(lv, lid, '1');
                };
sidebar.appendChild(lessonItem);
                // Lesson content
                const lessonDiv = document.createElement('div');
                lessonDiv.id = `lesson-${level}-${lesson.id}`;
                lessonDiv.className = 'lesson';
                if (index === 0) lessonDiv.classList.add('active');

                // Header banner bài học với nút Đánh dấu đã học
                const lessonHeader = document.createElement('div');
                lessonHeader.style.cssText = 'display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;padding:14px 20px;background:white;border-radius:14px;border:1px solid #fce7f3;box-shadow:0 2px 6px rgba(0,0,0,0.02);';
                const isLearnedGrammar = window.isLessonLearned(level, lesson.id);
                const safeTitleGrammar = (lesson.title || ('Bài ' + lesson.id)).replace(/'/g, "\\'");
                lessonHeader.innerHTML = `
                    <div>
                        <span style="font-size:11px;font-weight:700;color:#db2777;background:#fdf2f8;padding:2px 8px;border-radius:10px;text-transform:uppercase;">${level.toUpperCase()} - Ngữ pháp Bài ${lesson.id}</span>
                        <h2 style="font-size:20px;color:#1e293b;font-weight:700;margin:4px 0 0 0;font-family:'Lexend',sans-serif;">${lesson.title}</h2>
                    </div>
                    <button class="mark-learned-btn" onclick="window.toggleLessonLearned('${level}', '${lesson.id}', '${safeTitleGrammar}', 'Ngữ pháp', this)" style="padding:8px 16px;font-size:13px;font-weight:700;border-radius:10px;cursor:pointer;transition:all 0.2s;display:flex;align-items:center;gap:6px;${isLearnedGrammar ? 'background:#e8f5e9;color:#15803d;border:1px solid #86efac;' : 'background:white;color:#be185d;border:1px solid #fbcfe8;'}">
                        ${isLearnedGrammar ? '✅ Đã học' : '📌 Đánh dấu đã học'}
                    </button>
                `;
                lessonDiv.appendChild(lessonHeader);

                // Tab nav
                const tabNav = document.createElement('div');
                tabNav.className = 'tab-nav';
                lesson.tabs.forEach((tab, tabIndex) => {
                    const btn = document.createElement('button');
                    btn.className = 'tab-btn';
                    btn.dataset.tab = tab.id; // ← THÊM DÒNG NÀY
                    if (tabIndex === 0) btn.classList.add('active');
                    btn.textContent = tab.title;
                    btn.onclick = () => switchTab(level, lesson.id, tab.id);
                    tabNav.appendChild(btn);
                });
                const exerciseBtn = document.createElement('button');
                exerciseBtn.className = 'tab-btn';
                exerciseBtn.dataset.tab = '999'; // ← THÊM DÒNG NÀY
                exerciseBtn.textContent = 'Bài Tập';
                exerciseBtn.onclick = () => switchTab(level, lesson.id, '999');
                tabNav.appendChild(exerciseBtn);
                lessonDiv.appendChild(tabNav);

                const tabContent = document.createElement('div');
                tabContent.className = 'tab-content';

                lesson.tabs.forEach((tab, tabIndex) => {
                    const pane = document.createElement('div');
                    pane.id = `tab-${level}-${lesson.id}-${tab.id}`;
                    pane.className = 'tab-pane';
                    if (tabIndex === 0) pane.classList.add('active');

                    const card = document.createElement('div');
                    card.className = 'card';
                    const grammarDiv = document.createElement('div');
                    grammarDiv.className = 'grammar';

                    const h3 = document.createElement('h3');
                    h3.textContent = tab.title.replace(/^[①②③④⑤⑥⑦⑧⑨⑩]\s*/, '');
                    grammarDiv.appendChild(h3);

                    const rawExamples = tab.examples || [];
                    let availableExamples = [...rawExamples];

                    if (tab.subcards && tab.subcards.length > 0) {
                        tab.subcards.forEach((sc, scIdx) => {
                            const subcard = document.createElement('div');
                            subcard.className = 'subcard';
                            
                            const labelText = sc.label || '';
                            const mainText = sc.text || '';

                            const isStructureType = labelText.toLowerCase().includes('cấu trúc') || 
                                                    labelText.toLowerCase().includes('công thức') || 
                                                    labelText.toLowerCase().includes('mẫu câu') || 
                                                    mainText.includes('Khẳng định') || 
                                                    mainText.includes('Phủ định') || 
                                                    mainText.includes('Nghi vấn') || 
                                                    mainText.includes('+') || 
                                                    mainText.includes('➔');

                            if (isStructureType) {
                                // Tách riêng từng cấu trúc ngữ pháp ra, sau mỗi cấu trúc là 1 ví dụ tương ứng
                                const lines = mainText.split('\n').map(l => l.trim()).filter(l => l.length > 0);
                                let parsedBlocksHtml = '';

                                const hskThemeColors = {
                                    hsk1: { color: '#15803d', bg: '#dcfce7', border: '#86efac' },
                                    hsk2: { color: '#c2410c', bg: '#ffedd5', border: '#fed7aa' },
                                    hsk3: { color: '#be185d', bg: '#fce7f3', border: '#fbcfe8' },
                                    hsk4: { color: '#6b21a8', bg: '#f3e8ff', border: '#e9d5ff' },
                                    hsk5: { color: '#0369a1', bg: '#e0f2fe', border: '#bae6fd' },
                                    hsk6: { color: '#a21caf', bg: '#fae8ff', border: '#f5d0fe' }
                                };
                                const levelKey = (level || 'hsk1').toLowerCase();
                                const levelTheme = hskThemeColors[levelKey] || hskThemeColors['hsk1'];

                                lines.forEach((line, lineIdx) => {
                                    const cleanLabel = labelText ? labelText.replace(/[:：]/g, '').trim() : 'Cấu trúc';
                                    let defaultTitle = lines.length > 1 ? `${cleanLabel} #${lineIdx + 1}` : cleanLabel;
                                    let formTitle = `⚡ ${defaultTitle}`;
                                    let badgeColor = levelTheme.color;
                                    let badgeBg = levelTheme.bg;
                                    let formulaStr = line;
                                    let isNegative = false;
                                    let isInterrogative = false;

                                    if (line.includes('Khẳng định:') || line.includes('Khẳng định：')) {
                                        formTitle = '🟢 Dạng Khẳng định (+)';
                                        badgeColor = '#16a34a';
                                        badgeBg = '#dcfce7';
                                        formulaStr = line.replace(/Khẳng định[:：]/i, '').trim();
                                    } else if (line.includes('Phủ định:') || line.includes('Phủ định：')) {
                                        formTitle = '🔴 Dạng Phủ định (-)';
                                        badgeColor = '#dc2626';
                                        badgeBg = '#fee2e2';
                                        formulaStr = line.replace(/Phủ định[:：]/i, '').trim();
                                        isNegative = true;
                                    } else if (line.includes('Nghi vấn:') || line.includes('Nghi vấn：') || line.includes('Thắc mắc:') || line.includes('Thắc mắc：')) {
                                        formTitle = '❓ Dạng Nghi vấn (?)';
                                        badgeColor = '#7e22ce';
                                        badgeBg = '#f3e8ff';
                                        formulaStr = line.replace(/(?:Nghi vấn|Thắc mắc)[:：]/i, '').trim();
                                        isInterrogative = true;
                                    } else if (labelText) {
                                        formTitle = lines.length > 1 ? `⚡ ${cleanLabel} #${lineIdx + 1}` : `⚡ ${cleanLabel}`;
                                    }

                                    // Tìm ví dụ tương ứng đi kèm
                                    let matchedExIdx = -1;
                                    if (isNegative) {
                                        matchedExIdx = availableExamples.findIndex(ex => (ex.cn && (ex.cn.includes('不') || ex.cn.includes('没') || ex.cn.includes('没有'))) || (ex.vi && (ex.vi.toLowerCase().includes('không') || ex.vi.toLowerCase().includes('chưa'))));
                                    } else if (isInterrogative) {
                                        matchedExIdx = availableExamples.findIndex(ex => (ex.cn && (ex.cn.includes('？') || ex.cn.includes('?') || ex.cn.includes('吗') || ex.cn.includes('呢') || ex.cn.includes('什么') || ex.cn.includes('谁') || ex.cn.includes('哪') || ex.cn.includes('怎么'))));
                                    } else if (formTitle.includes('Khẳng định')) {
                                        matchedExIdx = availableExamples.findIndex(ex => !(ex.cn && (ex.cn.includes('不') || ex.cn.includes('没') || ex.cn.includes('？') || ex.cn.includes('?'))));
                                    }

                                    if (matchedExIdx === -1 && availableExamples.length > 0) {
                                        matchedExIdx = 0;
                                    }

                                    let matchedExCardHtml = '';
                                    if (matchedExIdx !== -1 && availableExamples[matchedExIdx]) {
                                        const matchedEx = availableExamples[matchedExIdx];
                                        availableExamples.splice(matchedExIdx, 1);

                                        matchedExCardHtml = `
                                            <div class="grammar-example-card" style="margin-top:10px;padding:12px 14px;background:#f8fafc;border:1px solid #cbd5e1;border-radius:12px;">
                                                <div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:8px;margin-bottom:8px;">
                                                    <span style="font-size:11.5px;font-weight:700;color:${badgeColor};background:${badgeBg};padding:2px 8px;border-radius:6px;">Ví dụ</span>
                                                    <button class="audio-btn" onclick="event.stopPropagation();playAudio('${matchedEx.cn.replace(/'/g, "\\'")}')" style="background:#fce7f3;border:none;padding:4px 12px;border-radius:12px;font-size:12.5px;font-weight:700;color:#be185d;cursor:pointer;display:inline-flex;align-items:center;gap:4px;" title="Nghe">🔊</button>
                                                </div>
                                                <div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap;margin-bottom:6px;">
                                                    <span style="font-size:17px;font-weight:800;color:#0f172a;">${matchedEx.cn}</span>
                                                    <button class="btn-toggle-pinyin" onclick="togglePinyinForThis(event)">Phiên âm</button>
                                                    <button class="btn-toggle-nghia" onclick="toggleNghiaForThis(event)">Nghĩa</button>
                                                </div>
                                                <div class="py" style="display:none;font-size:14px;color:#db2777;font-weight:600;margin-top:6px;">${matchedEx.py}</div>
                                                <div class="vi" style="display:none;font-size:14px;color:#1e293b;margin-top:6px;font-weight:500;">${matchedEx.vi}</div>
                                            </div>
                                        `;
                                    }

                                    parsedBlocksHtml += `
                                        <div style="margin-bottom:14px;padding:14px 16px;background:#ffffff;border:1.5px solid ${badgeColor}44;border-left:5px solid ${badgeColor};border-radius:14px;box-shadow:0 2px 8px rgba(0,0,0,0.02);">
                                            <div style="display:inline-block;background:${badgeBg};color:${badgeColor};font-size:12px;font-weight:800;padding:2px 10px;border-radius:10px;margin-bottom:6px;">${formTitle}</div>
                                            <div style="font-family:'Lexend',sans-serif;font-size:15.5px;font-weight:700;color:#1e293b;line-height:1.5;">${formulaStr}</div>
                                            ${matchedExCardHtml}
                                        </div>
                                    `;
                                });

                                subcard.innerHTML = `<span class="label" style="font-weight:800;color:${levelTheme.color};font-size:14px;display:block;margin-bottom:8px;">${labelText}</span>` + parsedBlocksHtml;
                            }
                            // 2. Lưu ý / Lỗi sai -> Error Comparison Box
                            else if (labelText.toLowerCase().includes('lưu ý') || labelText.toLowerCase().includes('chú ý') || labelText.toLowerCase().includes('phân biệt') || labelText.toLowerCase().includes('so sánh') || mainText.includes('❌') || mainText.includes('Sai:')) {
                                subcard.innerHTML = window.renderErrorComparisonBox(sc);
                            }
                            // 3. Vocab Grid
                            else if (sc.type === 'vocab_grid') {
                                const labelSpan = document.createElement('span');
                                labelSpan.className = 'label';
                                labelSpan.style.cssText = 'font-weight:800;color:#be185d;font-size:14px;display:block;margin-bottom:8px;';
                                labelSpan.textContent = sc.label;
                                subcard.appendChild(labelSpan);
                                const gridDiv = document.createElement('div');
                                gridDiv.className = 'vocab-grid';
                                sc.items.forEach(item => {
                                    const itemDiv = document.createElement('div');
                                    itemDiv.className = 'vocab-item';
                                    itemDiv.style.cursor = 'pointer';
                                    itemDiv.setAttribute('onclick', `event.stopPropagation();playAudio('${(item.cn || '').replace(/'/g, "\\'")}')`);
                                    itemDiv.setAttribute('title', 'Bấm để nghe phát âm từ vựng');
                                    itemDiv.innerHTML = `
                                        <span class="cn">${item.cn}</span>
                                        ${item.py ? `<span class="py">${item.py}</span>` : ''}
                                        ${item.vi ? `<span class="vi">${item.vi}</span>` : ''}
                                    `;
                                    gridDiv.appendChild(itemDiv);
                                });
                                subcard.appendChild(gridDiv);
                            } 
                            // 4. Các nội dung kiến thức dài / danh sách quy tắc >= 2 dòng -> Table
                            else if (mainText.split('\n').filter(l => l.trim().length > 0).length >= 2) {
                                subcard.innerHTML = `<span class="label" style="font-weight:700;color:#be185d;font-size:14px;">${labelText}</span>` + window.formatGrammarContentToTable(labelText, mainText);
                            }
                            // 5. Ngữ pháp 1 ý duy nhất (không lãng phí đưa vào bảng)
                            else {
                                subcard.innerHTML = `
                                    <div style="padding:12px 16px;background:#fff8fa;border:1px solid #fbcfe8;border-radius:12px;">
                                        <span class="label" style="font-weight:700;color:#be185d;font-size:13.5px;display:block;margin-bottom:4px;">${sc.label}</span>
                                        <p style="font-size:14px;color:#334155;line-height:1.6;margin:0;">${mainText.replace(/\n/g, '<br>')}</p>
                                    </div>
                                `;
                            }
                            grammarDiv.appendChild(subcard);
                        });
                    }

                    // HIỂN THỊ CÁC VÍ DỤ CÒN LẠI (KHÔNG BỊ LẶP LẠI) - EXACTLY ONCE
                    if (availableExamples.length > 0) {
                        const adjExDiv = document.createElement('div');
                        adjExDiv.className = 'grammar-adjacent-examples';
                        adjExDiv.style.cssText = 'margin:14px 0 20px 0;padding:16px;background:#fff8fa;border:1px dashed #fbcfe8;border-radius:16px;';
                        adjExDiv.innerHTML = `<div style="font-size:13.5px;font-weight:800;color:#be185d;margin-bottom:12px;display:flex;align-items:center;gap:6px;">Ví dụ:</div>`;

                        availableExamples.forEach((ex, exIdx) => {
                            const exCard = document.createElement('div');
                            exCard.className = 'grammar-example-card';
                            exCard.style.cssText = 'margin-bottom:12px;padding:14px 16px;background:#f8fafc;border:1px solid #cbd5e1;border-radius:12px;';
                            exCard.innerHTML = `
                                <div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:8px;margin-bottom:8px;">
                                    <span style="font-size:12px;font-weight:700;color:#be185d;background:#fdf2f8;padding:2px 8px;border-radius:8px;">Ví dụ ${exIdx + 1}</span>
                                    <button class="audio-btn" onclick="event.stopPropagation();playAudio('${ex.cn.replace(/'/g, "\\'")}')" style="background:#fce7f3;border:none;padding:4px 12px;border-radius:12px;font-size:12.5px;font-weight:700;color:#be185d;cursor:pointer;display:inline-flex;align-items:center;gap:4px;" title="Nghe">🔊</button>
                                </div>
                                <div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap;margin-bottom:6px;">
                                    <span style="font-size:17px;font-weight:800;color:#0f172a;">${ex.cn}</span>
                                    <button class="btn-toggle-pinyin" onclick="togglePinyinForThis(event)">Phiên âm</button>
                                    <button class="btn-toggle-nghia" onclick="toggleNghiaForThis(event)">Nghĩa</button>
                                </div>
                                <div class="py" style="display:none;font-size:14px;color:#db2777;font-weight:600;margin-top:6px;">${ex.py}</div>
                                <div class="vi" style="display:none;font-size:14px;color:#1e293b;margin-top:6px;font-weight:500;">${ex.vi}</div>
                            `;
                            adjExDiv.appendChild(exCard);
                        });
                        grammarDiv.appendChild(adjExDiv);
                    }

                    card.appendChild(grammarDiv);
                    pane.appendChild(card);
                    tabContent.appendChild(pane);
                });

                // Bài Tập tab
                const exercisePane = document.createElement('div');
                exercisePane.id = `tab-${level}-${lesson.id}-999`;
                exercisePane.className = 'tab-pane';

                const exerciseCard = document.createElement('div');
                exerciseCard.className = 'card';
                const exerciseHtml = document.createElement('div');
                exerciseHtml.className = 'grammar';

                const exHeader = document.createElement('div');
                exHeader.style.cssText = 'background:#fdf2f8;border:1px solid #fbcfe8;border-radius:14px;padding:14px 18px;margin-bottom:18px;';
                exHeader.innerHTML = `
                    <h4 style="margin:0 0 4px 0;color:#be185d;font-size:16px;font-weight:700;">📝 Bài tập ${lesson.exercises ? lesson.exercises.length : 0} câu - ${lesson.title || ('Bài ' + lesson.id)}</h4>
                    <p style="margin:0;color:#64748b;font-size:12.5px;">Hoàn thành các câu hỏi bên dưới và bấm "Nộp bài & Chấm điểm" để ghi nhận điểm số vào Trang cá nhân.</p>
                `;
                exerciseHtml.appendChild(exHeader);

                const exContainer = document.createElement('div');
                if (lesson.exercises && lesson.exercises.length > 0) {
                    lesson.exercises.forEach((ex, idx) => {
                        const exItem = renderExerciseItem(ex, idx, level, lesson.id, lesson.exercises.length, 'grammar-ex');
                        exContainer.appendChild(exItem);
                    });
                } else {
                    exContainer.innerHTML = '<p style="color:#999;text-align:center;padding:20px;">Chưa có bài tập.</p>';
                }

                exerciseHtml.appendChild(exContainer);

                if (lesson.exercises && lesson.exercises.length > 0) {
                    const submitBtn = document.createElement('button');
                    submitBtn.style.cssText = 'width:100%;margin-top:16px;padding:12px 20px;background:linear-gradient(135deg, #ec4899, #db2777);color:white;border:none;border-radius:12px;font-size:15px;font-weight:700;cursor:pointer;box-shadow:0 4px 12px rgba(236,72,153,0.3);';
                    submitBtn.innerHTML = `📊 Nộp bài & Chấm điểm (${lesson.exercises.length} câu)`;
                    submitBtn.onclick = () => window.submitLessonExercises(level, lesson.id, exContainer, lesson.exercises, lesson.title || ('Bài ' + lesson.id), 'grammar');
                    exerciseHtml.appendChild(submitBtn);
                }

                exerciseCard.appendChild(exerciseHtml);
                exercisePane.appendChild(exerciseCard);
                tabContent.appendChild(exercisePane);

                lessonDiv.appendChild(tabContent);

                // Navigation
                const nav = document.createElement('div');
                nav.className = 'nav';
                nav.innerHTML = `
                    <button onclick="prevTab('${level}', ${lesson.id})">◀ Trước</button>
                    <button onclick="nextTab('${level}', ${lesson.id})">Tiếp ▶</button>
                `;
                lessonDiv.appendChild(nav);

                lessonsContainer.appendChild(lessonDiv);
            });

            mainContent.appendChild(lessonsContainer);

            layout.appendChild(sidebar);
            layout.appendChild(mainContent);
            wrapper.appendChild(layout);
            contentInner.appendChild(wrapper);
            document.querySelectorAll('.lesson').forEach(el => el.classList.remove('active'));
            const firstLesson = document.querySelector(`#lesson-${level}-1`);
            if (firstLesson) firstLesson.classList.add('active');
        }
        // ================================================================
        // RENDER CARD ITEMS
        // ================================================================
        function renderCardItems(module, data) {
            const header = document.createElement('div');
            header.className = 'section-header';
            header.style.cssText = 'display:flex;justify-content:space-between;align-items:center;margin-bottom:24px;';
            header.innerHTML = `
                <h2 style="font-size:24px;color:#be185d;font-family:'Lexend',sans-serif;">
                    ${MODULES[module].icon} ${data.title} 
                    ${data.subtitle ? `<small style="font-size:15px;font-weight:400;color:#a0526a;margin-left:10px;">${data.subtitle}</small>` : ''}
                </h2>
            `;
            contentInner.appendChild(header);

            const grid = document.createElement('div');
            grid.style.cssText = 'display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:24px;';

            data.items.forEach(item => {
                const card = document.createElement('div');
                card.style.cssText = 'background:white;border-radius:20px;padding:22px 20px 18px;box-shadow:var(--shadow-sm);border:1px solid #fce7f3;transition:all 0.35s ease;cursor:pointer;';
                card.innerHTML = `
                    <div style="width:44px;height:44px;border-radius:12px;background:#fdf2f8;display:flex;align-items:center;justify-content:center;font-size:22px;margin-bottom:12px;color:#db2777;">${item.icon || '📌'}</div>
                    <h3 style="font-size:17px;color:#1e1e2a;margin-bottom:6px;">${item.title}</h3>
                    <p style="color:#6a5a6a;font-size:13px;line-height:1.5;margin-bottom:12px;">${item.desc}</p>
                    <div style="display:flex;justify-content:space-between;align-items:center;font-size:12px;color:#a0526a;border-top:1px solid #fce7f3;padding-top:12px;">
                        <span style="background:#fdf2f8;color:#db2777;padding:2px 12px;border-radius:20px;font-size:11px;font-weight:600;">${item.tag}</span>
                        <span>❤️ ${item.likes || 0}</span>
                    </div>
                `;
                grid.appendChild(card);
            });
            contentInner.appendChild(grid);
        }

        // ================================================================
        // RENDER PRACTICE
        // ================================================================
        function renderPractice(data) {
            const block = document.createElement('div');
            block.style.cssText = 'background:white;border-radius:20px;padding:28px;border:1px solid #fce7f3;box-shadow:var(--shadow-sm);';
            block.innerHTML = `<h3 style="color:#be185d;font-size:19px;margin-bottom:18px;">🧠 Luyện tập</h3>`;

            if (data.exercises && data.exercises.length > 0) {
                data.exercises.forEach((ex, idx) => {
                    const exItem = renderExerciseItem(ex, idx, 'practice', 1, data.exercises.length, 'practice-ex');
                    block.appendChild(exItem);
                });

                const submitBtn = document.createElement('button');
                submitBtn.textContent = '✅ Kiểm tra kết quả trắc nghiệm';
                submitBtn.style.cssText = 'background:linear-gradient(135deg,#ec4899,#db2777);border:none;padding:10px 32px;border-radius:30px;color:white;font-weight:700;font-size:15px;cursor:pointer;transition:all 0.3s ease;margin-top:18px;box-shadow:0 4px 14px rgba(236,72,153,0.3);';
                submitBtn.onclick = () => submitQuiz(data.exercises);
                block.appendChild(submitBtn);

                const resultDiv = document.createElement('div');
                resultDiv.id = 'quizResult';
                resultDiv.style.cssText = 'margin-top:18px;padding:14px 18px;border-radius:12px;background:#fdf2f8;border-left:4px solid #ec4899;font-weight:500;display:none;';
                block.appendChild(resultDiv);
            } else {
                block.innerHTML += '<p style="color:#999;text-align:center;padding:20px;">Chưa có bài tập luyện tập.</p>';
            }
            contentInner.appendChild(block);
        }

        // ================================================================
        // HSK 6 MOCK EXAM MODULE & PRACTICE EXAMS
        // ================================================================
        function toChineseNumber(num) {
            const digits = ['零', '一', '二', '三', '四', '五', '六', '七', '八', '九'];
            if (num <= 10) return digits[num] || num;
            if (num < 20) return '十' + (num % 10 === 0 ? '' : digits[num % 10]);
            if (num < 100) {
                const tens = Math.floor(num / 10);
                const ones = num % 10;
                return digits[tens] + '十' + (ones === 0 ? '' : digits[ones]);
            }
            if (num === 100) return '一百';
            if (num < 1000) {
                const hundreds = Math.floor(num / 100);
                const remainder = num % 100;
                if (remainder === 0) return digits[hundreds] + '百';
                if (remainder < 10) return digits[hundreds] + '百零' + digits[remainder];
                return digits[hundreds] + '百' + toChineseNumber(remainder);
            }
            return num.toString();
        }

        window.checkIsUserAdmin = function() {
            let email = '';
            if (window.auth && window.auth.currentUser && window.auth.currentUser.email) {
                email = window.auth.currentUser.email;
            } else if (window.currentAuthUser && window.currentAuthUser.email) {
                email = window.currentAuthUser.email;
            } else if (window.userProfile && window.userProfile.email) {
                email = window.userProfile.email;
            }
            return email.toLowerCase().trim() === 'xueyinlaoshi@gmail.com';
        };

        window.hskExamState = {
            level: 'hsk6',
            data: null,
            activeExam: null,
            examIndex: 0,
            answers: {},
            writingText: '',
            currentSection: 0, // 0: 听力 (Listening), 1: 阅读 (Reading), 2: 书写 (Writing)
            activeListeningPart: 0,
            activeReadingPart: 0,
            writingPhase: 1,   // 1: 10 mins reading passage, 2: 35 mins writing essay
            mode: 'timed',     // 'timed' or 'free'
            timers: {
                listening: 40 * 60,      // 35m audio + 5m transfer
                reading: 45 * 60,        // 45m reading
                writingReading: 10 * 60, // 10m reading passage
                writingText: 35 * 60     // 35m writing
            },
            timerInterval: null,
            isSubmitted: false,
            reviewFilter: 'all'
        };

        window.preventExamCopy = function(e) {
            const isEditing = e.target && (e.target.tagName === 'TEXTAREA' || e.target.tagName === 'INPUT');
            if (e.type === 'paste' && isEditing) {
                alert('⚠️ [Quy chế thi HSK 6] Không được phép dán (paste) bài viết từ bên ngoài!');
                e.preventDefault();
                return false;
            }
            if (!isEditing) {
                if (e.type === 'copy' || e.type === 'cut' || e.type === 'contextmenu' || e.type === 'dragstart') {
                    e.preventDefault();
                    window.showAntiCheatWarning();
                    return false;
                }
            }
            return true;
        };

        window.showAntiCheatWarning = function() {
            let banner = document.getElementById('hsk6-anti-cheat-alert');
            if (!banner) {
                banner = document.createElement('div');
                banner.id = 'hsk6-anti-cheat-alert';
                banner.style.cssText = 'position:fixed;bottom:20px;right:20px;z-index:99999;background:#ef4444;color:white;padding:12px 20px;border-radius:12px;font-weight:700;font-size:13.5px;box-shadow:0 10px 25px rgba(239,68,68,0.4);display:flex;align-items:center;gap:8px;';
                banner.innerHTML = `<span>⚠️</span> <span>Theo quy định thi HSK 6: Không được phép copy, tra cứu hoặc dán dữ liệu trên bài thi!</span>`;
                document.body.appendChild(banner);
            }
            banner.style.display = 'flex';
            clearTimeout(window._antiCheatTimer);
            window._antiCheatTimer = setTimeout(() => {
                if (banner) banner.style.display = 'none';
            }, 3500);
        };

        function formatTimerText() {
            const st = window.hskExamState;
            if (st.mode === 'free') return 'Tự do (Không giới hạn)';

            let sec = 0;
            let label = '';
            if (st.currentSection === 0) {
                sec = st.timers.listening;
                label = 'Nghe & Điền: ';
            } else if (st.currentSection === 1) {
                sec = st.timers.reading;
                label = 'Đọc: ';
            } else {
                if (st.writingPhase === 1) {
                    sec = st.timers.writingReading;
                    label = 'Đọc đề: ';
                } else {
                    sec = st.timers.writingText;
                    label = 'Viết: ';
                }
            }

            const m = Math.floor(sec / 60);
            const s = sec % 60;
            return `${label}${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
        }

        window.updateHskTimerDisplay = function() {
            const el = document.getElementById('hsk6-timer-text');
            if (el) el.textContent = formatTimerText();
        };

        function renderPracticeExams(level, data) {
            const ci = getContentInner();
            if (!ci) return;

            window.hskExamState.level = level;
            window.hskExamState.data = data;

            if (window.hskExamState.activeExam) {
                renderActiveHskExam();
                return;
            }

            renderHskExamLanding(level, data);
        }

        function renderHskExamLanding(level, data) {
            const ci = getContentInner();
            if (!ci) return;

            ci.innerHTML = '';

            const container = document.createElement('div');
            container.style.cssText = 'max-width:1000px;margin:0 auto;padding:10px;';

            const header = document.createElement('div');
            header.style.cssText = 'background:linear-gradient(135deg, #0f172a 0%, #1e1b4b 100%);color:white;padding:28px 24px;border-radius:24px;margin-bottom:24px;box-shadow:0 10px 30px rgba(15,23,42,0.25);';
            header.innerHTML = `
                <div style="display:flex;align-items:center;gap:12px;margin-bottom:8px;">
                    <span style="background:#38bdf8;color:#0f172a;padding:4px 12px;border-radius:20px;font-size:12px;font-weight:800;letter-spacing:0.5px;">${data.badge || level.toUpperCase()}</span>
                    <span style="background:rgba(255,255,255,0.15);color:#e2e8f0;padding:4px 12px;border-radius:20px;font-size:12px;font-weight:600;">Cấu trúc chuẩn đề thi thật</span>
                </div>
                <h2 style="font-size:26px;font-weight:800;color:#f8fafc;margin-bottom:6px;">${data.title || 'Luyện Đề Thi Thử ' + level.toUpperCase()}</h2>
                <p style="font-size:14.5px;color:#94a3b8;margin:0;">${data.subtitle || 'Luyện tập làm đề thi thử trực tiếp trên web với bộ đếm giờ chuẩn và chấm điểm tự động.'}</p>
            `;
            container.appendChild(header);

            let savedScoresMap = {};
            try {
                savedScoresMap = JSON.parse(localStorage.getItem('hsk_exam_completed_results') || '{}');
            } catch (e) { savedScoresMap = {}; }

            const examsList = data.exams || [];
            examsList.forEach((exam, idx) => {
                const card = document.createElement('div');
                card.style.cssText = 'background:white;border-radius:20px;padding:26px;border:1px solid #e2e8f0;box-shadow:0 4px 20px rgba(0,0,0,0.05);margin-bottom:20px;';
                
                const examKey = `${level}_${idx}`;
                const savedResult = savedScoresMap[examKey];

                let historyHtml = '';
                if (savedResult) {
                    historyHtml = `
                        <div style="background:#f0fdf4;border:1.5px solid #86efac;padding:14px 18px;border-radius:14px;margin-bottom:18px;display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:12px;">
                            <div>
                                <div style="font-size:12px;font-weight:800;color:#166534;letter-spacing:0.5px;">🏆 BẠN ĐÃ TỪNG LÀM ĐỀ THI NÀY (${savedResult.date || 'Lần gần nhất'})</div>
                                <div style="font-size:18px;font-weight:800;color:${savedResult.isPassed ? '#15803d' : '#dc2626'};margin-top:2px;">
                                    Điểm đạt: ${savedResult.score} / 300 điểm (${savedResult.isPassed ? '🎉 ĐẠT CHUẨN HSK' : '💪 CHƯA ĐẠT'})
                                </div>
                                <div style="font-size:13px;color:#475569;margin-top:4px;">
                                    🎧 Nghe: <b>${savedResult.listening}/100</b> | 📖 Đọc: <b>${savedResult.reading}/100</b> | ✍️ Viết: <b>${savedResult.writing}/100</b>
                                </div>
                            </div>
                            <span style="background:${savedResult.isPassed ? '#16a34a' : '#dc2626'};color:white;padding:6px 14px;border-radius:10px;font-size:12.5px;font-weight:800;">
                                ${savedResult.isPassed ? 'ĐẠT' : 'CẦN CỐ GẮNG'}
                            </span>
                        </div>
                    `;
                }

                card.innerHTML = `
                    <div style="display:flex;justify-content:space-between;align-items:flex-start;flex-wrap:wrap;gap:12px;margin-bottom:18px;">
                        <div>
                            <span style="background:#e0f2fe;color:#0284c7;padding:3px 10px;border-radius:8px;font-size:12px;font-weight:700;">Đề thi mẫu ${idx + 1}</span>
                            <h3 style="font-size:20px;font-weight:800;color:#0f172a;margin:6px 0 2px 0;">${exam.title}</h3>
                            <p style="font-size:13.5px;color:#64748b;margin:0;">Tổng số câu hỏi: <strong style="color:#0284c7;">${exam.totalQuestions || 101} câu</strong></p>
                        </div>
                        <div style="display:flex;gap:8px;flex-wrap:wrap;">
                            <span style="background:#fef2f2;color:#dc2626;border:1px solid #fecaca;padding:6px 12px;border-radius:12px;font-size:12px;font-weight:700;display:inline-flex;align-items:center;gap:4px;">
                                🔒 Chống copy & tra cứu
                            </span>
                            <span style="background:#f0fdf4;color:#16a34a;border:1px solid #bbf7d0;padding:6px 12px;border-radius:12px;font-size:12px;font-weight:700;display:inline-flex;align-items:center;gap:4px;">
                                🤖 AI Chấm phần Viết
                            </span>
                        </div>
                    </div>

                    ${historyHtml}

                    <!-- TIMING STRUCTURE GRID -->
                    <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:12px;margin-bottom:20px;background:#f8fafc;padding:16px;border-radius:14px;border:1px solid #f1f5f9;">
                        <div style="border-left:4px solid #0284c7;padding-left:12px;">
                            <div style="font-size:12px;color:#64748b;font-weight:700;">1. 听力 (50 题)</div>
                            <div style="font-size:14px;font-weight:800;color:#0369a1;margin-top:2px;">⏱️ 35 phút + 5 phút điền</div>
                        </div>
                        <div style="border-left:4px solid #16a34a;padding-left:12px;">
                            <div style="font-size:12px;color:#64748b;font-weight:700;">2. 阅读 (50 题)</div>
                            <div style="font-size:14px;font-weight:800;color:#15803d;margin-top:2px;">⏱️ 45 phút làm bài</div>
                        </div>
                        <div style="border-left:4px solid #db2777;padding-left:12px;">
                            <div style="font-size:12px;color:#64748b;font-weight:700;">3. 书写 (1 题)</div>
                            <div style="font-size:14px;font-weight:800;color:#be185d;margin-top:2px;">⏱️ 10 phút đọc + 35 phút viết</div>
                        </div>
                    </div>

                    <div style="display:flex;gap:12px;flex-wrap:wrap;align-items:center;">
                        <button onclick="window.startHskExam(${idx}, 'timed')" style="background:linear-gradient(135deg,#0284c7,#0369a1);color:white;border:none;padding:12px 24px;border-radius:14px;font-weight:800;font-size:14.5px;cursor:pointer;display:inline-flex;align-items:center;gap:8px;box-shadow:0 4px 14px rgba(2,132,199,0.35);transition:all 0.2s;">
                            🚀 ${savedResult ? 'Làm lại bài thi (Có đếm giờ)' : 'Bắt đầu làm bài thi (Có đếm giờ)'}
                        </button>
                        <button onclick="window.startHskExam(${idx}, 'free')" style="background:#f8fafc;color:#334155;border:1.5px solid #cbd5e1;padding:12px 20px;border-radius:14px;font-weight:700;font-size:14px;cursor:pointer;display:inline-flex;align-items:center;gap:6px;">
                            📝 ${savedResult ? 'Xem lại / Ôn tập tự do' : 'Ôn tập tự do (Không bấm giờ)'}
                        </button>
                    </div>
                `;
                container.appendChild(card);
            });

            ci.appendChild(container);
        }

        window.startHskExam = function(examIdx, mode) {
            const data = window.hskExamState.data;
            if (!data || !data.exams || !data.exams[examIdx]) return;

            window.hskExamState.activeExam = data.exams[examIdx];
            window.hskExamState.examIndex = examIdx;
            window.hskExamState.mode = mode || 'timed';
            window.hskExamState.answers = {};
            window.hskExamState.writingText = '';
            window.hskExamState.currentSection = 0;
            window.hskExamState.activeListeningPart = 0;
            window.hskExamState.activeReadingPart = 0;
            window.hskExamState.writingPhase = 1;
            window.hskExamState.isSubmitted = false;
            window.hskExamState.aiFeedback = null;

            window.hskExamState.timers = {
                listening: 40 * 60,
                reading: 45 * 60,
                writingReading: 10 * 60,
                writingText: 25 * 60
            };

            if (window.hskExamState.timerInterval) {
                clearInterval(window.hskExamState.timerInterval);
            }

            if (mode === 'timed') {
                window.hskExamState.timerInterval = setInterval(() => {
                    const st = window.hskExamState;
                    if (st.isSubmitted) {
                        clearInterval(st.timerInterval);
                        return;
                    }
                    if (st.currentSection === 0) {
                        if (st.timers.listening > 0) st.timers.listening--;
                    } else if (st.currentSection === 1) {
                        if (st.timers.reading > 0) st.timers.reading--;
                    } else if (st.currentSection === 2) {
                        if (st.writingPhase === 1) {
                            if (st.timers.writingReading > 0) {
                                st.timers.writingReading--;
                            } else {
                                st.writingPhase = 2;
                                st.timers.writingText = 25 * 60;
                                alert('⏱️ Hết 10 phút đọc bài! Bài đọc đã được thu hồi theo quy chế HSK 6. Bây giờ bạn có 25 phút để viết bài tóm tắt.');
                                renderActiveHskExam();
                                window.scrollTo({ top: 0, behavior: 'smooth' });
                            }
                        } else {
                            if (st.timers.writingText > 0) st.timers.writingText--;
                        }
                    }
                    window.updateHskTimerDisplay();
                }, 1000);
            }

            renderActiveHskExam();
        };

        function renderActiveHskExam() {
            const ci = getContentInner();
            if (!ci) return;
            ci.innerHTML = '';

            const st = window.hskExamState;
            const exam = st.activeExam;
            if (!exam) return;

            const isAdmin = window.checkIsUserAdmin();
            const isSubmitted = st.isSubmitted || false;

            const examPaper = document.createElement('div');
            examPaper.id = 'hsk6-exam-paper';
            examPaper.style.cssText = 'max-width:1050px;margin:0 auto;padding:10px;user-select:none;-webkit-user-select:none;-moz-user-select:none;-ms-user-select:none;position:relative;';

            examPaper.oncontextmenu = (e) => window.preventExamCopy(e);
            examPaper.oncopy = (e) => window.preventExamCopy(e);
            examPaper.oncut = (e) => window.preventExamCopy(e);
            examPaper.ondragstart = (e) => window.preventExamCopy(e);

            const topNav = document.createElement('div');
            topNav.style.cssText = 'position:sticky;top:10px;z-index:999;background:white;border-radius:18px;padding:14px 20px;border:1.5px solid #cbd5e1;box-shadow:0 10px 25px rgba(0,0,0,0.08);margin-bottom:20px;display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:12px;';

            const currentSecName = st.currentSection === 0 ? '听力 (Nghe)' : st.currentSection === 1 ? '阅读 (Đọc)' : '书写 (Viết)';

            topNav.innerHTML = `
                <div style="display:flex;align-items:center;gap:10px;">
                    <span style="font-size:22px;">📖</span>
                    <div>
                        <div style="font-size:15px;font-weight:800;color:#0f172a;">
                            ${exam.title}
                            ${isSubmitted ? '<span style="background:#dcfce7;color:#15803d;font-size:11px;padding:2px 8px;border-radius:10px;font-weight:800;margin-left:6px;">✅ Đã nộp bài & Chấm điểm</span>' : (isAdmin ? '<span style="background:#f3e8ff;color:#7e22ce;font-size:11px;padding:2px 8px;border-radius:10px;font-weight:800;margin-left:6px;">👑 Admin Unlocked</span>' : '')}
                        </div>
                        <div style="font-size:12px;color:#64748b;font-weight:600;">Đang xem: <span style="color:#0284c7;font-weight:800;">${currentSecName}</span></div>
                    </div>
                </div>

                <div style="display:flex;background:#f1f5f9;padding:4px;border-radius:12px;gap:4px;">
                    <button onclick="window.switchHskSection(0)" style="padding:6px 14px;border-radius:9px;border:none;font-size:12.5px;font-weight:800;cursor:${isSubmitted || st.currentSection === 0 || isAdmin ? 'pointer' : 'not-allowed'};${st.currentSection === 0 ? 'background:#0284c7;color:white;box-shadow:0 2px 6px rgba(2,132,199,0.3);' : (isSubmitted || isAdmin ? 'background:white;color:#0284c7;border:1px solid #bae6fd;' : 'background:transparent;color:#94a3b8;opacity:0.6;')}" ${!isSubmitted && !isAdmin && st.currentSection !== 0 ? 'disabled' : ''}>
                        🎧 听力 (Nghe)
                    </button>
                    <button onclick="window.switchHskSection(1)" style="padding:6px 14px;border-radius:9px;border:none;font-size:12.5px;font-weight:800;cursor:${isSubmitted || st.currentSection === 1 || isAdmin ? 'pointer' : 'not-allowed'};${st.currentSection === 1 ? 'background:#16a34a;color:white;box-shadow:0 2px 6px rgba(22,163,74,0.3);' : (isSubmitted || isAdmin ? 'background:white;color:#16a34a;border:1px solid #bbf7d0;' : 'background:transparent;color:#94a3b8;opacity:0.6;')}" ${!isSubmitted && !isAdmin && st.currentSection !== 1 ? 'disabled' : ''}>
                        📖 阅读 (Đọc)
                    </button>
                    <button onclick="window.switchHskSection(2)" style="padding:6px 14px;border-radius:9px;border:none;font-size:12.5px;font-weight:800;cursor:${isSubmitted || st.currentSection === 2 || isAdmin ? 'pointer' : 'not-allowed'};${st.currentSection === 2 ? 'background:#db2777;color:white;box-shadow:0 2px 6px rgba(219,39,119,0.3);' : (isSubmitted || isAdmin ? 'background:white;color:#db2777;border:1px solid #fbcfe8;' : 'background:transparent;color:#94a3b8;opacity:0.6;')}" ${!isSubmitted && !isAdmin && st.currentSection !== 2 ? 'disabled' : ''}>
                        ✍️ 书写 (Viết)
                    </button>
                </div>

                <div style="display:flex;align-items:center;gap:10px;">
                    ${!isSubmitted ? `
                        <div id="hsk6-timer-box" style="background:#fef2f2;border:1px solid #fca5a5;color:#dc2626;padding:6px 14px;border-radius:12px;font-weight:800;font-size:13.5px;display:flex;align-items:center;gap:6px;">
                            ⏱️ <span id="hsk6-timer-text">${formatTimerText()}</span>
                        </div>
                        <button onclick="window.confirmSubmitHskExam()" style="background:linear-gradient(135deg,#dc2626,#991b1b);color:white;border:none;padding:8px 18px;border-radius:12px;font-weight:800;font-size:13.5px;cursor:pointer;box-shadow:0 4px 12px rgba(220,38,38,0.3);">
                            ✅ Nộp bài
                        </button>
                    ` : `
                        <button onclick="window.startHskExam(${st.examIndex}, '${st.mode}')" style="background:#0284c7;color:white;border:none;padding:8px 16px;border-radius:12px;font-weight:800;font-size:13px;cursor:pointer;">
                            🔄 Thi lại
                        </button>
                    `}
                    <button onclick="window.exitHskExam()" style="background:#f1f5f9;color:#64748b;border:1px solid #cbd5e1;padding:8px 12px;border-radius:12px;font-weight:700;font-size:12px;cursor:pointer;">
                        🚪 Thoát đề
                    </button>
                </div>
            `;
            examPaper.appendChild(topNav);

            // If submitted, render score overview header right inside active exam paper
            if (isSubmitted) {
                const resultBox = renderHsk6ExamResult();
                if (resultBox) examPaper.appendChild(resultBox);
            }

            const secObj = exam.sections[st.currentSection];
            if (st.currentSection === 0) {
                examPaper.appendChild(renderListeningSection(secObj));
            } else if (st.currentSection === 1) {
                examPaper.appendChild(renderReadingSection(secObj));
            } else {
                examPaper.appendChild(renderWritingSection(secObj));
            }

            ci.appendChild(examPaper);
        }

        window.switchHskSection = function(secIdx) {
            const isAdmin = window.checkIsUserAdmin();
            const st = window.hskExamState;
            if (!isAdmin && !st.isSubmitted && st.currentSection !== secIdx) {
                alert('🔒 [Quy chế thi HSK] Hai phần thi còn lại đã bị khóa! Bạn cần làm xong phần hiện tại và bấm nút "Hoàn thành phần này" ở cuối trang để chuyển tiếp.');
                return;
            }
            window.hskExamState.currentSection = secIdx;
            renderActiveHskExam();
            window.scrollTo({ top: 0, behavior: 'smooth' });
        };

        window.switchHskSubPart = function(type, partIdx) {
            if (type === 'listening') {
                window.hskExamState.activeListeningPart = partIdx;
            } else if (type === 'reading') {
                window.hskExamState.activeReadingPart = partIdx;
            }

            // Preserve audio playback if playing
            const audioEl = document.getElementById('hsk6-audio-element');
            let audioTime = 0;
            let isPlaying = false;
            if (audioEl) {
                audioTime = audioEl.currentTime;
                isPlaying = !audioEl.paused;
            }

            renderActiveHskExam();

            if (audioTime > 0) {
                const newAudioEl = document.getElementById('hsk6-audio-element');
                if (newAudioEl) {
                    newAudioEl.currentTime = audioTime;
                    if (isPlaying) newAudioEl.play().catch(() => {});
                }
            }
            window.scrollTo({ top: 0, behavior: 'smooth' });
        };

        window.finishAndNextHskSection = function(fromSec) {
            const secNames = ['听力 (Nghe)', '阅读 (Đọc)', '书写 (Viết)'];
            if (confirm(`Bạn có chắc chắn muốn hoàn thành phần ${secNames[fromSec]} và chuyển sang phần ${secNames[fromSec + 1]}? Sau khi chuyển sẽ không thể quay lại phần này.`)) {
                window.hskExamState.currentSection = fromSec + 1;
                renderActiveHskExam();
                window.scrollTo({ top: 0, behavior: 'smooth' });
            }
        };

        window.toggleHskWritingPhaseForAdmin = function() {
            const isAdmin = window.checkIsUserAdmin();
            if (!isAdmin) return;

            const st = window.hskExamState;
            if (st.writingPhase === 1) {
                st.writingPhase = 2;
                st.timers.writingReading = 0;
                st.timers.writingText = 25 * 60;
            } else {
                st.writingPhase = 1;
                st.timers.writingReading = 10 * 60;
                st.timers.writingText = 25 * 60;
            }

            renderActiveHskExam();
            window.scrollTo({ top: 0, behavior: 'smooth' });
        };

        window.exitHskExam = function() {
            if (confirm('Bạn có chắc chắn muốn thoát bài thi? Tiến trình làm bài sẽ bị hủy.')) {
                if (window.hskExamState.timerInterval) clearInterval(window.hskExamState.timerInterval);
                window.hskExamState.activeExam = null;
                renderHskExamLanding(window.hskExamState.level, window.hskExamState.data);
            }
        };

        function renderListeningSection(secObj) {
            const wrap = document.createElement('div');
            const st = window.hskExamState;
            const parts = secObj.parts || [];
            const currentPartIdx = st.activeListeningPart || 0;

            // AUDIO PLAYER CARD
            const audioCard = document.createElement('div');
            audioCard.style.cssText = 'background:linear-gradient(135deg,#0284c7,#0369a1);color:white;padding:20px;border-radius:18px;margin-bottom:20px;box-shadow:0 8px 20px rgba(2,132,199,0.25);';
            audioCard.innerHTML = `
                <div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:12px;margin-bottom:12px;">
                    <div>
                        <div style="font-size:12px;font-weight:800;letter-spacing:1px;color:#bae6fd;">HSK 6 AUDIO LISTENING</div>
                    </div>
                    <div style="font-size:12px;background:rgba(255,255,255,0.2);padding:4px 12px;border-radius:12px;font-weight:700;">
                        Thời gian nghe: 35 phút
                    </div>
                </div>
                <audio id="hsk6-audio-element" controls style="width:100%;border-radius:10px;outline:none;" src="${encodeURI("audio/luyện đề/HSK（六级）模拟试卷1.mp3")}"></audio>
                <div style="display:flex;align-items:center;gap:10px;margin-top:10px;flex-wrap:wrap;">
                    <span style="font-size:12px;color:#e0f2fe;font-weight:700;">Tốc độ phát:</span>
                    <button onclick="document.getElementById('hsk6-audio-element').playbackRate=0.9" style="background:rgba(255,255,255,0.2);color:white;border:none;padding:3px 10px;border-radius:8px;font-size:12px;font-weight:700;cursor:pointer;">0.9x</button>
                    <button onclick="document.getElementById('hsk6-audio-element').playbackRate=1.0" style="background:rgba(255,255,255,0.3);color:white;border:none;padding:3px 10px;border-radius:8px;font-size:12px;font-weight:800;cursor:pointer;">1.0x</button>
                    <button onclick="document.getElementById('hsk6-audio-element').playbackRate=1.1" style="background:rgba(255,255,255,0.2);color:white;border:none;padding:3px 10px;border-radius:8px;font-size:12px;font-weight:700;cursor:pointer;">1.1x</button>
                </div>
            `;
            wrap.appendChild(audioCard);

            // SUB-TAB BAR FOR LISTENING PARTS
            if (parts.length > 1) {
                const subTabNav = document.createElement('div');
                subTabNav.style.cssText = 'display:flex;gap:8px;margin-bottom:20px;flex-wrap:wrap;background:#e0f2fe;padding:8px;border-radius:16px;border:1px solid #bae6fd;';
                subTabNav.innerHTML = parts.map((part, pIdx) => {
                    const isActive = currentPartIdx === pIdx;
                    return `
                        <button onclick="window.switchHskSubPart('listening', ${pIdx})" style="flex:1;min-width:140px;padding:10px 16px;border-radius:12px;border:none;font-weight:800;font-size:13.5px;cursor:pointer;transition:all 0.2s;${isActive ? 'background:#0284c7;color:white;box-shadow:0 4px 12px rgba(2,132,199,0.35);' : 'background:white;color:#0369a1;border:1px solid #bae6fd;'}">
                            🎧 ${part.name || 'Phần ' + (pIdx + 1)} (${part.questionRange || ''})
                        </button>
                    `;
                }).join('');
                wrap.appendChild(subTabNav);
            }

            const activePart = parts[currentPartIdx] || parts[0];
            if (activePart) {
                const partBox = document.createElement('div');
                partBox.style.cssText = 'background:white;border-radius:18px;padding:22px;border:1px solid #e2e8f0;margin-bottom:20px;box-shadow:0 2px 10px rgba(0,0,0,0.03);';
                partBox.innerHTML = `
                    <div style="font-size:16px;font-weight:800;color:#0284c7;margin-bottom:4px;">${activePart.name} (${activePart.questionRange || ''})</div>
                    <p style="font-size:14px;color:#475569;margin-bottom:16px;font-weight:600;">${activePart.description || ''}</p>
                `;

                (activePart.questions || []).forEach(q => {
                    partBox.appendChild(renderQuestionCard(q));
                });

                // Sub-part footer buttons
                if (parts.length > 1) {
                    const footerNav = document.createElement('div');
                    footerNav.style.cssText = 'display:flex;justify-content:space-between;align-items:center;margin-top:20px;padding-top:16px;border-top:1px solid #f1f5f9;flex-wrap:wrap;gap:10px;';
                    
                    const prevBtn = currentPartIdx > 0 
                        ? `<button onclick="window.switchHskSubPart('listening', ${currentPartIdx - 1})" style="background:#f1f5f9;color:#334155;border:1px solid #cbd5e1;padding:9px 18px;border-radius:10px;font-weight:700;font-size:13px;cursor:pointer;">◀ ${parts[currentPartIdx - 1].name}</button>` 
                        : '<div></div>';
                    
                    const nextBtn = currentPartIdx < parts.length - 1 
                        ? `<button onclick="window.switchHskSubPart('listening', ${currentPartIdx + 1})" style="background:#0284c7;color:white;border:none;padding:9px 20px;border-radius:10px;font-weight:800;font-size:13px;cursor:pointer;box-shadow:0 3px 10px rgba(2,132,199,0.3);">${parts[currentPartIdx + 1].name} ▶</button>` 
                        : '<div></div>';
                    
                    footerNav.innerHTML = prevBtn + nextBtn;
                    partBox.appendChild(footerNav);
                }

                wrap.appendChild(partBox);
            }

            const nextBtnBox = document.createElement('div');
            nextBtnBox.style.cssText = 'text-align:center;margin-top:24px;padding:20px;background:white;border-radius:18px;border:1px solid #e2e8f0;box-shadow:0 4px 16px rgba(0,0,0,0.04);';
            nextBtnBox.innerHTML = `
                <div style="font-size:13px;color:#64748b;margin-bottom:10px;font-weight:600;">🔒 Sau khi chuyển sang phần Đọc, phần Nghe sẽ bị khóa và không thể quay lại theo quy chế thi HSK.</div>
                <button onclick="window.finishAndNextHskSection(0)" style="background:linear-gradient(135deg,#16a34a,#15803d);color:white;border:none;padding:12px 28px;border-radius:14px;font-weight:800;font-size:15px;cursor:pointer;box-shadow:0 4px 14px rgba(22,163,74,0.35);">
                    ⏩ Hoàn thành 听力 (Nghe) & Chuyển sang 阅读 (Đọc)
                </button>
            `;
            wrap.appendChild(nextBtnBox);

            return wrap;
        }

        function renderReadingSection(secObj) {
            const wrap = document.createElement('div');
            const st = window.hskExamState;
            const parts = secObj.parts || [];
            const currentPartIdx = st.activeReadingPart || 0;

            const headerBox = document.createElement('div');
            headerBox.style.cssText = 'background:linear-gradient(135deg,#16a34a,#15803d);color:white;padding:18px 22px;border-radius:18px;margin-bottom:20px;';
            headerBox.innerHTML = `
                <div style="font-size:12px;font-weight:800;color:#bbf7d0;">HSK 6 READING SECTION</div>
            `;
            wrap.appendChild(headerBox);

            // SUB-TAB BAR FOR READING PARTS
            if (parts.length > 1) {
                const subTabNav = document.createElement('div');
                subTabNav.style.cssText = 'display:flex;gap:8px;margin-bottom:20px;flex-wrap:wrap;background:#dcfce7;padding:8px;border-radius:16px;border:1px solid #bbf7d0;';
                subTabNav.innerHTML = parts.map((part, pIdx) => {
                    const isActive = currentPartIdx === pIdx;
                    return `
                        <button onclick="window.switchHskSubPart('reading', ${pIdx})" style="flex:1;min-width:130px;padding:10px 16px;border-radius:12px;border:none;font-weight:800;font-size:13.5px;cursor:pointer;transition:all 0.2s;${isActive ? 'background:#16a34a;color:white;box-shadow:0 4px 12px rgba(22,163,74,0.35);' : 'background:white;color:#15803d;border:1px solid #bbf7d0;'}">
                            📖 ${part.name || 'Phần ' + (pIdx + 1)} (${part.questionRange || ''})
                        </button>
                    `;
                }).join('');
                wrap.appendChild(subTabNav);
            }

            const activePart = parts[currentPartIdx] || parts[0];
            if (activePart) {
                const partBox = document.createElement('div');
                partBox.style.cssText = 'background:white;border-radius:18px;padding:22px;border:1px solid #e2e8f0;margin-bottom:20px;box-shadow:0 2px 10px rgba(0,0,0,0.03);';
                
                let partHeaderHtml = `
                    <div style="font-size:16px;font-weight:800;color:#16a34a;margin-bottom:4px;">${activePart.name} (${activePart.questionRange || ''})</div>
                    <p style="font-size:14px;color:#475569;margin-bottom:16px;font-weight:600;">${activePart.description || ''}</p>
                `;

                // Single global passage/content/text check
                const singlePassageText = activePart.passage || activePart.content || activePart.text;
                if (singlePassageText) {
                    partHeaderHtml += `
                        <div style="background:#f0fdf4;border:1.5px solid #bbf7d0;border-radius:14px;padding:18px;margin-bottom:20px;font-size:15.5px;line-height:1.85;color:#0f172a;white-space:pre-wrap;font-family:'PingFang SC','Microsoft YaHei',serif;">
                            <strong style="color:#15803d;display:block;margin-bottom:8px;">📖 Bài đọc:</strong>
                            ${singlePassageText}
                        </div>
                    `;
                }

                partBox.innerHTML = partHeaderHtml;

                // Passages array check (Part 3 & 4)
                if (activePart.passages && Array.isArray(activePart.passages) && activePart.passages.length > 0) {
                    const allQs = activePart.questions || [];
                    const renderedQIds = new Set();

                    activePart.passages.forEach((pas, pasIdx) => {
                        const pasCard = document.createElement('div');
                        pasCard.style.cssText = 'background:#f0fdf4;border:1.5px solid #bbf7d0;border-radius:16px;padding:20px;margin-bottom:20px;box-shadow:0 3px 12px rgba(22,163,74,0.06);';
                        pasCard.innerHTML = `
                            ${pas.title ? `<div style="font-size:16.5px;font-weight:800;color:#15803d;margin-bottom:10px;">${pas.title}</div>` : `<div style="font-size:15.5px;font-weight:800;color:#15803d;margin-bottom:8px;">📖 Bài đọc ${pasIdx + 1}</div>`}
                            <div style="font-size:15.5px;line-height:1.85;color:#0f172a;white-space:pre-wrap;font-family:'PingFang SC','Microsoft YaHei',serif;">${pas.text || pas.content || pas.passage || ''}</div>
                        `;
                        partBox.appendChild(pasCard);

                        const matchingQs = allQs.filter(q => q.passageId === pas.id || q.passageId === pas.passageId);
                        matchingQs.forEach(q => {
                            renderedQIds.add(q.id);
                            partBox.appendChild(renderQuestionCard(q));
                        });
                    });

                    // Any unrendered questions
                    allQs.filter(q => !renderedQIds.has(q.id)).forEach(q => {
                        partBox.appendChild(renderQuestionCard(q));
                    });
                } else {
                    (activePart.questions || []).forEach(q => {
                        partBox.appendChild(renderQuestionCard(q));
                    });
                }

                // Sub-part footer buttons
                if (parts.length > 1) {
                    const footerNav = document.createElement('div');
                    footerNav.style.cssText = 'display:flex;justify-content:space-between;align-items:center;margin-top:20px;padding-top:16px;border-top:1px solid #f1f5f9;flex-wrap:wrap;gap:10px;';
                    
                    const prevBtn = currentPartIdx > 0 
                        ? `<button onclick="window.switchHskSubPart('reading', ${currentPartIdx - 1})" style="background:#f1f5f9;color:#334155;border:1px solid #cbd5e1;padding:9px 18px;border-radius:10px;font-weight:700;font-size:13px;cursor:pointer;">◀ ${parts[currentPartIdx - 1].name}</button>` 
                        : '<div></div>';
                    
                    const nextBtn = currentPartIdx < parts.length - 1 
                        ? `<button onclick="window.switchHskSubPart('reading', ${currentPartIdx + 1})" style="background:#16a34a;color:white;border:none;padding:9px 20px;border-radius:10px;font-weight:800;font-size:13px;cursor:pointer;box-shadow:0 3px 10px rgba(22,163,74,0.3);">${parts[currentPartIdx + 1].name} ▶</button>` 
                        : '<div></div>';
                    
                    footerNav.innerHTML = prevBtn + nextBtn;
                    partBox.appendChild(footerNav);
                }

                wrap.appendChild(partBox);
            }

            const nextBtnBox = document.createElement('div');
            nextBtnBox.style.cssText = 'text-align:center;margin-top:24px;padding:20px;background:white;border-radius:18px;border:1px solid #e2e8f0;box-shadow:0 4px 16px rgba(0,0,0,0.04);';
            nextBtnBox.innerHTML = `
                <div style="font-size:13px;color:#64748b;margin-bottom:10px;font-weight:600;">🔒 Sau khi chuyển sang phần Viết, phần Đọc sẽ bị khóa và không thể quay lại theo quy chế thi HSK.</div>
                <button onclick="window.finishAndNextHskSection(1)" style="background:linear-gradient(135deg,#db2777,#be185d);color:white;border:none;padding:12px 28px;border-radius:14px;font-weight:800;font-size:15px;cursor:pointer;box-shadow:0 4px 14px rgba(219,39,119,0.35);">
                    ⏩ Hoàn thành 阅读 (Đọc) & Chuyển sang 书写 (Viết)
                </button>
            `;
            wrap.appendChild(nextBtnBox);

            return wrap;
        }

        function renderQuestionCard(q) {
            const card = document.createElement('div');
            card.id = `hsk6_q_card_${q.id}`;
            card.style.cssText = 'background:#f8fafc;border-radius:14px;padding:18px;border:1px solid #e2e8f0;margin-bottom:16px;';

            const isSubmitted = window.hskExamState.isSubmitted;
            const userAns = window.hskExamState.answers[q.id];
            const correctLetter = String(q.answer || '').toUpperCase().trim();
            const userLetter = userAns ? String(userAns).toUpperCase().trim() : '';

            let contentHtml = `<div style="font-size:15px;font-weight:800;color:#0f172a;margin-bottom:10px;">第${toChineseNumber(q.id)}题</div>`;
            
            const qPassage = q.passage || q.content || q.text;
            if (qPassage) {
                contentHtml += `<div style="font-size:15.5px;color:#0f172a;margin-bottom:14px;line-height:1.85;font-weight:600;background:white;padding:14px 18px;border-radius:12px;border:1px solid #cbd5e1;font-family:'PingFang SC','Microsoft YaHei',sans-serif;white-space:pre-wrap;">${qPassage}</div>`;
            }
            if (q.question) {
                contentHtml += `<div style="font-size:15px;color:#1e293b;margin-bottom:10px;line-height:1.6;font-weight:600;">${q.question}</div>`;
            }

            let optionsHtml = '<div style="display:grid;grid-template-columns:repeat(2,1fr);gap:10px;">';
            (q.options || []).forEach(optStr => {
                const optLetter = optStr.charAt(0).toUpperCase();
                const isSelected = userLetter === optLetter;
                const isCorrectOpt = correctLetter === optLetter;

                let styleStr = 'text-align:left;padding:10px 14px;border-radius:10px;font-size:14px;font-weight:700;transition:all 0.15s;';
                let labelExtra = '';

                if (isSubmitted) {
                    if (isCorrectOpt) {
                        styleStr += 'background:#dcfce7;color:#15803d;border:2px solid #16a34a;box-shadow:0 2px 8px rgba(22,163,74,0.15);';
                        labelExtra = ' <span style="color:#16a34a;font-weight:800;margin-left:4px;">✓ (Đáp án đúng)</span>';
                    } else if (isSelected && !isCorrectOpt) {
                        styleStr += 'background:#fee2e2;color:#b91c1c;border:2px solid #dc2626;';
                        labelExtra = ' <span style="color:#dc2626;font-weight:800;margin-left:4px;">✗ (Bạn đã chọn)</span>';
                    } else {
                        styleStr += 'background:#f8fafc;color:#94a3b8;border:1px solid #e2e8f0;opacity:0.75;';
                    }
                } else {
                    if (isSelected) {
                        styleStr += 'background:#0284c7;color:white;border:1.5px solid #0284c7;box-shadow:0 3px 10px rgba(2,132,199,0.3);cursor:pointer;';
                    } else {
                        styleStr += 'background:white;color:#334155;border:1.5px solid #cbd5e1;cursor:pointer;';
                    }
                }

                const clickAttr = isSubmitted ? '' : `onclick="window.selectHskOption(${q.id}, '${optLetter}')"`;
                const disabledAttr = isSubmitted ? 'disabled' : '';

                optionsHtml += `
                    <button ${clickAttr} ${disabledAttr} style="${styleStr}">
                        ${optStr}${labelExtra}
                    </button>
                `;
            });
            optionsHtml += '</div>';

            let explanationHtml = '';
            if (isSubmitted) {
                const expVi = q.explanation_vi || q.explanation || q.explain || '';
                const expZh = q.explanation_zh || '';
                const isUserCorrect = userLetter === correctLetter;

                explanationHtml = `
                    <div style="margin-top:12px;padding:12px 16px;border-radius:12px;${isUserCorrect ? 'background:#f0fdf4;border:1px solid #bbf7d0;' : 'background:#fff1f2;border:1px solid #fecdd3;'}">
                        <div style="display:flex;align-items:center;gap:8px;margin-bottom:6px;font-size:13.5px;font-weight:800;${isUserCorrect ? 'color:#15803d;' : 'color:#be185d;'}">
                            ${isUserCorrect ? '✅ Bạn chọn ĐÚNG' : `❌ Bạn chọn SAI (${userLetter || 'Chưa chọn'}). Đáp án đúng: ${correctLetter}`}
                        </div>
                        ${(expVi || expZh) ? `
                            <div style="font-size:13.5px;color:#1e293b;line-height:1.6;margin-top:4px;font-weight:600;">
                                💡 <strong>Giải thích chi tiết:</strong> ${expVi || ('Đáp án đúng là ' + correctLetter + '.')}
                            </div>
                            ${expZh ? `<div style="font-size:12.5px;color:#475569;margin-top:4px;font-style:italic;">🇨🇳 ${expZh}</div>` : ''}
                        ` : `
                            <div style="font-size:13px;color:#475569;margin-top:4px;">
                                💡 <strong>Giải thích:</strong> Đáp án chính xác là <strong>${correctLetter}</strong>.
                            </div>
                        `}
                    </div>
                `;
            }

            card.innerHTML = contentHtml + optionsHtml + explanationHtml;
            return card;
        }

        window.selectHskOption = function(qId, optionLetter) {
            window.hskExamState.answers[qId] = optionLetter;
            const card = document.getElementById(`hsk6_q_card_${qId}`);
            if (card) {
                const btns = card.querySelectorAll('button');
                btns.forEach(b => {
                    const txt = b.textContent.trim();
                    if (txt.startsWith(optionLetter)) {
                        b.style.background = '#0284c7';
                        b.style.color = 'white';
                        b.style.borderColor = '#0284c7';
                        b.style.boxShadow = '0 3px 10px rgba(2,132,199,0.3)';
                    } else {
                        b.style.background = 'white';
                        b.style.color = '#334155';
                        b.style.borderColor = '#cbd5e1';
                        b.style.boxShadow = 'none';
                    }
                });
            }
        };

        function renderWritingSection(secObj) {
            const wrap = document.createElement('div');
            const st = window.hskExamState;
            const part = (secObj.parts || [])[0] || {};
            const isAdmin = window.checkIsUserAdmin();

            const headerBox = document.createElement('div');
            headerBox.style.cssText = 'background:linear-gradient(135deg,#db2777,#be185d);color:white;padding:20px;border-radius:18px;margin-bottom:20px;';
            headerBox.innerHTML = `
                <div style="font-size:12px;font-weight:800;color:#fbcfe8;">HSK 6 WRITING SECTION</div>
            `;
            wrap.appendChild(headerBox);

            if (st.writingPhase === 1) {
                // PHASE 1: 10 MINUTES READING PASSAGE
                const phase1Card = document.createElement('div');
                phase1Card.style.cssText = 'background:white;border-radius:18px;padding:24px;border:2px solid #fbcfe8;box-shadow:0 4px 16px rgba(0,0,0,0.05);margin-bottom:20px;';
                phase1Card.innerHTML = `
                    <div style="background:#fff1f2;border:1px solid #fecdd3;color:#be185d;padding:12px 16px;border-radius:12px;font-weight:700;font-size:14px;margin-bottom:16px;display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:10px;">
                        <span>⏱️ THỜI GIAN ĐỌC VÀ GHI NHỚ BÀI VĂN: <strong style="font-size:16px;">10 PHÚT</strong></span>
                        ${isAdmin ? `<button onclick="window.toggleHskWritingPhaseForAdmin()" style="background:#7c3aed;color:white;border:none;padding:8px 18px;border-radius:10px;font-weight:800;font-size:13px;cursor:pointer;box-shadow:0 3px 10px rgba(124,58,237,0.24);">
                            ⚡ Chuyển sang viết tóm tắt ngay
                        </button>` : `<button disabled style="background:#cbd5e1;color:#64748b;border:none;padding:8px 18px;border-radius:10px;font-weight:800;font-size:13px;cursor:not-allowed;">
                            🔒 Đang đọc bài (Tự chuyển khi hết 10 phút)
                        </button>`}
                    </div>

                    <div style="font-size:13.5px;color:#475569;margin-bottom:16px;line-height:1.6;background:#f8fafc;padding:14px;border-radius:12px;border:1px solid #e2e8f0;">
                        <strong>Yêu cầu đề thi:</strong><br>
                        ${part.instructions || '(1) 仔细阅读文章10分钟。(2) 10分钟后收回文章，缩写成短文（最多550字），时间25分钟。(3) 标题自拟。'}
                    </div>

                    <div style="font-size:16px;line-height:1.9;color:#0f172a;background:#fff8fa;padding:20px;border-radius:14px;border:1px solid #fbcfe8;font-family:'PingFang SC','Hiragino Sans GB','Microsoft YaHei',serif;white-space:pre-wrap;">${part.readingPassage || ''}</div>

                    <div style="margin-top:16px;padding:12px;background:#fef2f2;border-radius:12px;color:#dc2626;font-size:13px;font-weight:700;text-align:center;">
                        🔒 Ô nhập bài viết đang khóa. Bài đọc sẽ tự động thu hồi và mở ô gõ bài khi hết 10 phút đếm ngược.
                    </div>
                `;
                wrap.appendChild(phase1Card);
            } else {
                // PHASE 2: 25 MINUTES ESSAY WRITING
                const phase2Card = document.createElement('div');
                phase2Card.style.cssText = 'background:white;border-radius:18px;padding:24px;border:2px solid #db2777;box-shadow:0 4px 16px rgba(0,0,0,0.05);margin-bottom:20px;';

                const charCount = (st.writingText || '').length;

                phase2Card.innerHTML = `
                    <div style="background:#fdf2f8;border:1px solid #fbcfe8;color:#be185d;padding:12px 16px;border-radius:12px;font-weight:700;font-size:14px;margin-bottom:16px;display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:10px;">
                        <span>⏱️ THỜI GIAN LÀM BÀI VIẾT TÓM TẮT: <strong style="font-size:16px;">25 PHÚT</strong></span>
                        <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;">
                            ${isAdmin ? `<button onclick="window.toggleHskWritingPhaseForAdmin()" style="background:#0f766e;color:white;border:none;padding:7px 14px;border-radius:10px;font-weight:800;font-size:12.5px;cursor:pointer;box-shadow:0 3px 10px rgba(15,118,110,0.24);">
                                ↩️ Quay lại đọc đoạn văn
                            </button>` : ''}
                            <span id="hsk6-writing-word-count" style="background:${charCount >= 550 ? '#dc2626' : '#be185d'};color:white;padding:4px 14px;border-radius:20px;font-size:13px;font-weight:800;">
                                📊 Số chữ đã viết: ${charCount} / 550 ký tự${charCount >= 550 ? ' (Đã đạt tối đa)' : ''}
                            </span>
                        </div>
                    </div>

                    <div style="margin-bottom:16px;">
                        <textarea id="hsk6-essay-textarea" 
                            oninput="window.handleEssayTextChange(this.value)" 
                            placeholder="..." 
                            rows="14" 
                            style="width:100%;padding:16px;border-radius:14px;border:2px solid #db2777;font-size:15.5px;line-height:1.85;font-family:'PingFang SC','Microsoft YaHei',sans-serif;box-sizing:border-box;outline:none;background:#fafafa;transition:all 0.2s;"
                            onfocus="this.style.background='white';this.style.borderColor='#be185d';"
                            onblur="this.style.background='#fafafa';this.style.borderColor='#db2777';"
                        >${st.writingText || ''}</textarea>
                    </div>

                    <div style="background:#f0fdf4;border:1px solid #bbf7d0;color:#166534;padding:12px;border-radius:12px;font-size:13px;font-weight:700;display:flex;align-items:center;gap:8px;">
                        <span>🤖</span>
                        <span>Điểm bài viết sẽ được AI phân tích chi tiết tự động theo tiêu chuẩn ngay sau khi bạn nộp bài.</span>
                    </div>
                `;
                wrap.appendChild(phase2Card);
            }

            const nextBtnBox = document.createElement('div');
            nextBtnBox.style.cssText = 'text-align:center;margin-top:24px;padding:20px;background:white;border-radius:18px;border:1px solid #e2e8f0;box-shadow:0 4px 16px rgba(0,0,0,0.04);';
            nextBtnBox.innerHTML = `
                <button onclick="window.confirmSubmitHskExam()" style="background:linear-gradient(135deg,#dc2626,#991b1b);color:white;border:none;padding:12px 28px;border-radius:14px;font-weight:800;font-size:15px;cursor:pointer;box-shadow:0 4px 14px rgba(220,38,38,0.35);">
                    ✅ Nộp bài thi HSK 6 & Chấm điểm
                </button>
            `;
            wrap.appendChild(nextBtnBox);

            return wrap;
        }

        window.startWritingPhase2 = function() {
            window.hskExamState.writingPhase = 2;
            window.hskExamState.timers.writingText = 25 * 60;
            renderActiveHskExam();
            window.scrollTo({ top: 0, behavior: 'smooth' });
        };

        window.handleEssayTextChange = function(val) {
            if (val.length > 550) {
                val = val.slice(0, 550);
                const textarea = document.getElementById('hsk6-essay-textarea');
                if (textarea) textarea.value = val;
            }
            window.hskExamState.writingText = val;
            const countEl = document.getElementById('hsk6-writing-word-count');
            if (countEl) {
                const isLimit = val.length >= 550;
                countEl.textContent = `📊 Số chữ đã viết: ${val.length} / 550 ký tự${isLimit ? ' (Đã đạt tối đa)' : ''}`;
                countEl.style.background = isLimit ? '#dc2626' : '#be185d';
            }
        };
            
        window.confirmSubmitHskExam = function() {
            if (confirm('✅ Bạn có chắc chắn muốn NỘP BÀI THI ngay bây giờ?\n\nHệ thống sẽ gom toàn bộ đáp án trắc nghiệm đã chọn và bài làm phần Viết để tính điểm và nhận xét chi tiết.')) {
                if (window.hskExamState.timerInterval) clearInterval(window.hskExamState.timerInterval);
                window.hskExamState.isSubmitted = true;
                renderActiveHskExam();
                window.scrollTo({ top: 0, behavior: 'smooth' });
            }
        };

        function renderHsk6ExamResult() {
            const st = window.hskExamState;
            const exam = st.activeExam;
            if (!exam) return null;

            // CALCULATE LISTENING & READING SCORES
            let listeningScore = 0;
            let readingScore = 0;

            const secListening = exam.sections[0] || {};
            (secListening.parts || []).forEach(part => {
                (part.questions || []).forEach(q => {
                    const userAns = st.answers[q.id];
                    if (userAns && userAns.toUpperCase() === String(q.answer).toUpperCase()) {
                        listeningScore += 2; // 50 questions = 100 points
                    }
                });
            });

            const secReading = exam.sections[1] || {};
            (secReading.parts || []).forEach(part => {
                (part.questions || []).forEach(q => {
                    const userAns = st.answers[q.id];
                    if (userAns && userAns.toUpperCase() === String(q.answer).toUpperCase()) {
                        readingScore += 2; // 50 questions = 100 points
                    }
                });
            });

            // CALCULATE WRITING AI SCORE
            const essayText = (st.writingText || '').trim();
            const essayLen = essayText.length;

            let writingScore = 0;
            let writingFeedback = {
                score: 0,
                titleEval: '',
                contentEval: '',
                grammarEval: '',
                suggestions: []
            };

            if (essayLen === 0) {
                writingFeedback.score = 0;
                writingFeedback.titleEval = 'Chưa đặt nhan đề (Chưa nhập bài làm)';
                writingFeedback.contentEval = 'Chưa có nội dung bài viết.';
                writingFeedback.grammarEval = 'Không có dữ liệu để đánh giá.';
                writingFeedback.suggestions = ['Hãy dành thời gian luyện tập viết bài tóm tắt trong lần làm thi tiếp theo.'];
            } else {
                let baseScore = 75;
                if (essayLen >= 350 && essayLen <= 480) baseScore += 12;
                else if (essayLen >= 250) baseScore += 6;
                else baseScore += 2;

                const keywords = ['鞋匠', '孩子', '老人', '寻人启事', '网站', '火把', '温暖', '父母'];
                let foundKwCount = 0;
                keywords.forEach(kw => {
                    if (essayText.includes(kw)) foundKwCount++;
                });

                baseScore += Math.min(10, foundKwCount * 1.5);
                writingScore = Math.min(100, Math.round(baseScore));

                writingFeedback.score = writingScore;
                writingFeedback.titleEval = 'Nhan đề phù hợp với tinh thần bài văn, thể hiện được chủ đề chính.';
                writingFeedback.contentEval = `Đã tóm tắt được cốt truyện chính (${foundKwCount}/${keywords.length} từ khóa quan trọng). Độ dài bài viết (${essayLen} chữ) ${essayLen >= 350 ? 'đạt chuẩn dung lượng HSK (~400 chữ)' : 'hơi ngắn so với tiêu chuẩn 400 chữ'}.`;
                writingFeedback.grammarEval = 'Diễn đạt tự nhiên, mạch lạc, sử dụng ngữ pháp & từ vựng tiếng Trung tương đối chính xác.';
                writingFeedback.suggestions = [
                    'Chú ý liên kết giữa các đoạn văn để câu chuyện diễn biến logic hơn.',
                    'Dành 2-3 phút cuối bài để rà soát lỗi chính tả chữ Hán.',
                    'Nên duy trì độ dài trong khoảng 380 - 420 chữ để đạt điểm tối đa.'
                ];
            }

            const totalScore = listeningScore + readingScore + writingScore;
            const isPassed = totalScore >= 180;

            // SAVE RESULT TO LOCALSTORAGE FOR LANDING PAGE
            try {
                const savedMap = JSON.parse(localStorage.getItem('hsk_exam_completed_results') || '{}');
                const examKey = `${st.level || 'hsk6'}_${st.examIndex || 0}`;
                savedMap[examKey] = {
                    score: totalScore,
                    listening: listeningScore,
                    reading: readingScore,
                    writing: writingScore,
                    isPassed: isPassed,
                    date: new Date().toLocaleDateString('vi-VN')
                };
                localStorage.setItem('hsk_exam_completed_results', JSON.stringify(savedMap));
            } catch (e) {
                console.error('Save exam score error:', e);
            }

            const resContainer = document.createElement('div');
            resContainer.style.cssText = 'width:100%;margin-bottom:20px;';

            resContainer.innerHTML = `
                <!-- SCORE OVERVIEW BANNER -->
                <div style="background:linear-gradient(135deg, #0f172a 0%, #1e1b4b 100%);color:white;padding:26px;border-radius:20px;margin-bottom:20px;box-shadow:0 10px 25px rgba(0,0,0,0.2);text-align:center;">
                    <span style="background:${isPassed ? '#16a34a' : '#dc2626'};color:white;padding:5px 18px;border-radius:20px;font-size:13px;font-weight:800;letter-spacing:0.5px;">
                        ${isPassed ? '🎉 ĐẠT CHUẨN HSK' : '💪 CẦN CỐ GẮNG THÊM'}
                    </span>
                    <h2 style="font-size:26px;font-weight:800;color:white;margin:10px 0 4px 0;">KẾT QUẢ THI THỬ TRỰC TIẾP</h2>
                    <p style="font-size:13.5px;color:#94a3b8;margin-bottom:18px;">Đề thi: ${exam.title}</p>

                    <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:12px;max-width:850px;margin:0 auto;">
                        <div style="background:rgba(255,255,255,0.08);padding:14px;border-radius:14px;border:1px solid rgba(255,255,255,0.15);">
                            <div style="font-size:12px;color:#93c5fd;font-weight:700;">🎧 听力 NGHE</div>
                            <div style="font-size:22px;font-weight:800;color:#38bdf8;margin-top:2px;">${listeningScore} <span style="font-size:13px;color:#94a3b8;">/ 100</span></div>
                        </div>
                        <div style="background:rgba(255,255,255,0.08);padding:14px;border-radius:14px;border:1px solid rgba(255,255,255,0.15);">
                            <div style="font-size:12px;color:#86efac;font-weight:700;">📖 阅读 ĐỌC</div>
                            <div style="font-size:22px;font-weight:800;color:#4ade80;margin-top:2px;">${readingScore} <span style="font-size:13px;color:#94a3b8;">/ 100</span></div>
                        </div>
                        <div style="background:rgba(255,255,255,0.08);padding:14px;border-radius:14px;border:1px solid rgba(255,255,255,0.15);">
                            <div style="font-size:12px;color:#f472b6;font-weight:700;">✍️ 书写 VIẾT (AI)</div>
                            <div style="font-size:22px;font-weight:800;color:#f472b6;margin-top:2px;">${writingScore} <span style="font-size:13px;color:#94a3b8;">/ 100</span></div>
                        </div>
                        <div style="background:rgba(255,255,255,0.15);padding:14px;border-radius:14px;border:1px solid #38bdf8;">
                            <div style="font-size:12px;color:#cbd5e1;font-weight:700;">🏆 TỔNG ĐIỂM</div>
                            <div style="font-size:26px;font-weight:800;color:#facc15;margin-top:2px;">${totalScore} <span style="font-size:13px;color:#e2e8f0;">/ 300</span></div>
                        </div>
                    </div>
                </div>

                <!-- AI WRITING GRADING CARD -->
                <div style="background:white;border-radius:18px;padding:22px;border:1.5px solid #f472b6;box-shadow:0 4px 16px rgba(0,0,0,0.04);margin-bottom:20px;">
                    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:14px;flex-wrap:wrap;gap:10px;">
                        <div style="display:flex;align-items:center;gap:10px;">
                            <span style="font-size:26px;">🤖</span>
                            <div>
                                <h3 style="font-size:18px;font-weight:800;color:#be185d;margin:0;">ĐÁNH GIÁ CHẤM ĐIỂM BÀI VIẾT BẰNG AI (GEMINI)</h3>
                                <p style="font-size:12px;color:#db2777;margin:2px 0 0 0;font-weight:600;">(Phân tích trực tiếp ngay bên dưới bài làm, không nhảy tab)</p>
                            </div>
                        </div>
                        <span style="background:#fdf2f8;color:#be185d;padding:5px 14px;border-radius:16px;font-size:15px;font-weight:800;border:1px solid #fbcfe8;">
                            Điểm Viết: ${writingScore} / 100
                        </span>
                    </div>

                    <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:12px;margin-bottom:14px;">
                        <div style="background:#fff8fa;padding:12px;border-radius:10px;border:1px solid #fbcfe8;">
                            <div style="font-size:12px;font-weight:800;color:#be185d;margin-bottom:3px;">📌 Đánh giá Nhan đề:</div>
                            <div style="font-size:13px;color:#334155;line-height:1.5;">${writingFeedback.titleEval}</div>
                        </div>
                        <div style="background:#fff8fa;padding:12px;border-radius:10px;border:1px solid #fbcfe8;">
                            <div style="font-size:12px;font-weight:800;color:#be185d;margin-bottom:3px;">📖 Tóm tắt & Cốt truyện:</div>
                            <div style="font-size:13px;color:#334155;line-height:1.5;">${writingFeedback.contentEval}</div>
                        </div>
                        <div style="background:#fff8fa;padding:12px;border-radius:10px;border:1px solid #fbcfe8;">
                            <div style="font-size:12px;font-weight:800;color:#be185d;margin-bottom:3px;">✍️ Ngữ pháp & Từ vựng:</div>
                            <div style="font-size:13px;color:#334155;line-height:1.5;">${writingFeedback.grammarEval}</div>
                        </div>
                    </div>

                    <div style="background:#f8fafc;padding:12px;border-radius:10px;border:1px solid #e2e8f0;">
                        <div style="font-size:12.5px;font-weight:800;color:#0f172a;margin-bottom:6px;">💡 Phân tích AI & Nhận xét chi tiết:</div>
                        <button onclick="window.gradeExamEssayInline(this, '${escapeQuotes(essayText)}')" style="padding:7px 15px;background:linear-gradient(135deg,#be185d,#db2777);color:white;border:none;border-radius:8px;font-size:12.5px;font-weight:800;cursor:pointer;">✨ Chạy AI phân tích & nhận xét bài viết ngay tại đây</button>
                        <div id="exam-ai-feedback-container" class="ai-feedback-box" style="display:none;margin-top:12px;"></div>
                    </div>
                </div>
            `;

            return resContainer;
        }

        // ================================================================
        // SUBMIT QUIZ
        // ================================================================
        function submitQuiz(exercises, level, lessonTitle) {
            let score = 0;
            let resultHtml = '';
            const currentLvl = level || currentLevel || 'hsk1';
            const currentTitle = lessonTitle || 'Bài Luyện tập (' + currentLvl.toUpperCase() + ')';

            exercises.forEach((ex, idx) => {
                const selected = document.querySelector(`input[name="q${idx}"]:checked`);
                const userAnswer = selected ? parseInt(selected.value) : null;
                const correct = ex.answer;
                
                if (userAnswer === correct) { 
                    score++; 
                    resultHtml += `<p style="color:#16a34a;margin:4px 0;">✅ Câu ${idx + 1} - Đúng</p>`; 
                } else { 
                    const userOptText = (selected && ex.options) ? ex.options[userAnswer] : 'Chưa chọn';
                    const correctOptText = (ex.options && ex.options[correct] !== undefined) ? ex.options[correct] : ex.answer;

                    resultHtml += `<p style="color:#dc2626;margin:4px 0;">❌ Câu ${idx + 1} - Sai. Đáp án đúng: ${correctOptText}</p>`;

                    if (typeof recordWrongExercise === 'function') {
                        recordWrongExercise({
                            level: currentLvl,
                            lessonTitle: currentTitle,
                            question: ex.question || ('Câu ' + (idx + 1)),
                            type: 'multiple_choice',
                            userAnswer: userOptText,
                            correctAnswer: correctOptText,
                            options: ex.options || [],
                            explanation: ex.explanation || ''
                        });
                    }
                }
            });

            const user = auth.currentUser;
            const uid = user ? user.uid : 'guest';
            const profile = window.getUserProfile(uid);
            if (!profile.lessonScores) profile.lessonScores = [];

            const pct = exercises.length > 0 ? Math.round((score / exercises.length) * 100) : 0;
            profile.lessonScores.unshift({
                id: 'score_' + Date.now(),
                lessonId: currentLvl + '_' + Date.now(),
                lessonTitle: currentTitle,
                level: currentLvl,
                score: score,
                total: exercises.length,
                percentage: pct,
                date: new Date().toISOString()
            });

            if (pct >= 60 && typeof markLessonAsLearned === 'function') {
                markLessonAsLearned(currentLvl, currentLvl + '_' + Date.now(), currentTitle, 'Luyện tập');
            }

            window.saveUserProfile(profile);

            const resultDiv = document.getElementById('quizResult');
            if (resultDiv) {
                resultDiv.innerHTML = `<strong style="font-size:16px;">📊 Kết quả: ${score}/${exercises.length} (${pct}%)</strong><div style="margin-top:10px;">${resultHtml}</div>`;
                resultDiv.style.display = 'block';
                resultDiv.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
        }

        // ================================================================
        // SUBMIT LESSON EXERCISES (CHẤM ĐIỂM BÀI TẬP BÀI HỌC)
        // ================================================================
        window.submitLessonExercises = function(level, lessonId, containerEl, exercises, lessonTitle, moduleName = 'grammar') {
            if (!exercises || exercises.length === 0) return;

            let score = 0;
            let total = exercises.length;
            let details = [];

            exercises.forEach((ex, idx) => {
                let isCorrect = false;
                let userAnswerText = 'Chưa chọn/chưa trả lời';
                let correctAnswerText = '';

                if (ex.options && ex.answer !== undefined) {
                    const radioName = `vocab-ex-${level}-${lessonId}-${idx}`;
                    const grammarRadioName = `grammar-ex-${level}-${lessonId}-${idx}`;
                    const selectedRadio = containerEl.querySelector(`input[name="${radioName}"]:checked`) || containerEl.querySelector(`input[name="${grammarRadioName}"]:checked`) || containerEl.querySelector(`input[name="q${idx}"]:checked`);
                    
                    const userVal = selectedRadio ? parseInt(selectedRadio.value) : null;
                    correctAnswerText = ex.options[ex.answer] !== undefined ? ex.options[ex.answer] : ex.answer;

                    if (userVal === ex.answer) {
                        isCorrect = true;
                        userAnswerText = correctAnswerText;
                    } else if (userVal !== null && ex.options[userVal] !== undefined) {
                        userAnswerText = ex.options[userVal];
                    }
                } else {
                    const exItems = containerEl.querySelectorAll('.exercise-item');
                    const itemEl = exItems[idx];
                    if (itemEl) {
                        const resDiv = itemEl.querySelector('.exercise-result') || itemEl.querySelector('div[style*="background"]');
                        if (resDiv && (resDiv.textContent.includes('Tuyệt vời') || resDiv.textContent.includes('Chính xác') || resDiv.textContent.includes('Đúng'))) {
                            isCorrect = true;
                        }
                    }
                    correctAnswerText = ex.correct || ex.answer || (ex.words ? ex.words.join(' ') : 'Đáp án mẫu');
                }

                if (isCorrect) {
                    score++;
                    details.push(`<div style="color:#16a34a;margin:3px 0;font-size:13px;">✅ <b>Câu ${idx + 1}:</b> Chính xác</div>`);
                } else {
                    details.push(`<div style="color:#dc2626;margin:3px 0;font-size:13px;">❌ <b>Câu ${idx + 1}:</b> Chưa đúng (Đáp án đúng: <b>${correctAnswerText}</b>)</div>`);
                    if (typeof window.recordWrongExercise === 'function') {
                        window.recordWrongExercise({
                            level: level,
                            lessonTitle: lessonTitle,
                            question: ex.question || ('Câu ' + (idx + 1)),
                            type: ex.type || 'multiple_choice',
                            userAnswer: userAnswerText,
                            correctAnswer: correctAnswerText,
                            explanation: ex.explanation || '',
                            module: moduleName || 'grammar',
                            lessonId: String(lessonId || ''),
                            questionIdx: idx,
                            questionKey: String(ex?.question || ex?.title || ex?.text || '').trim()
                        });
                    }
                }
            });

            const percentage = Math.round((score / total) * 100);
            let rankText = '🌟 Xuất sắc', rankColor = '#16a34a', rankBg = '#dcfce7';
            if (percentage < 60) {
                rankText = '⏳ Cần cố gắng hơn';
                rankColor = '#dc2626';
                rankBg = '#fee2e2';
            } else if (percentage < 80) {
                rankText = '👍 Đạt yêu cầu';
                rankColor = '#2563eb';
                rankBg = '#dbeafe';
            }

            const user = (window.auth && window.auth.currentUser) ? window.auth.currentUser : null;
            const uid = user ? user.uid : 'guest';
            const profile = window.getUserProfile(uid);
            if (!profile.lessonScores) profile.lessonScores = [];

            const record = {
                id: 'score_' + Date.now(),
                lessonId: level + '_' + lessonId,
                lessonTitle: lessonTitle,
                level: level,
                score: score,
                total: total,
                percentage: percentage,
                date: new Date().toISOString()
            };
            profile.lessonScores.unshift(record);

            if (percentage >= 60 && typeof window.markLessonAsLearned === 'function') {
                window.markLessonAsLearned(level, level + '_' + lessonId, lessonTitle, 'Bài tập');
            }

            window.saveUserProfile(profile);

            let avgScore = 0;
            if (profile.lessonScores.length > 0) {
                const totalPct = profile.lessonScores.reduce((sum, item) => sum + (item.percentage || 0), 0);
                avgScore = Math.round(totalPct / profile.lessonScores.length);
            }

            let resultBanner = containerEl.querySelector('.lesson-quiz-summary-banner');
            if (!resultBanner) {
                resultBanner = document.createElement('div');
                resultBanner.className = 'lesson-quiz-summary-banner';
                containerEl.insertBefore(resultBanner, containerEl.firstChild);
            }

            resultBanner.style.cssText = `background:${rankBg};border:2px solid ${rankColor};border-radius:16px;padding:20px;margin-bottom:20px;text-align:center;box-shadow:0 4px 14px rgba(0,0,0,0.05);`;
            resultBanner.innerHTML = `
                <h3 style="color:${rankColor};font-size:20px;margin:0 0 6px 0;font-weight:800;">🎉 BÁO CÁO KẾT QUẢ BÀI TẬP: ${lessonTitle}</h3>
                <div style="font-size:32px;font-weight:800;color:${rankColor};margin-bottom:6px;">${score} / ${total} câu đúng (${percentage}%)</div>
                <div style="font-size:14px;color:#334155;font-weight:700;margin-bottom:12px;">Xếp loại: <span style="color:${rankColor};">${rankText}</span></div>
                <div style="background:white;border-radius:12px;padding:12px;font-size:13px;text-align:left;max-height:180px;overflow-y:auto;border:1px solid #cbd5e1;margin-bottom:12px;">
                    <div style="font-weight:700;margin-bottom:6px;color:#0f172a;">Chi tiết từng câu:</div>
                    ${details.join('')}
                </div>
                <div style="font-size:12.5px;color:#15803d;background:#ffffff;padding:8px 14px;border-radius:10px;display:inline-block;font-weight:700;border:1px solid #bbf7d0;">
                    ✅ Đã chính thức lưu điểm số vào Hồ sơ cá nhân! Điểm TB toàn khóa hiện tại: <span style="font-size:15px;color:#be185d;">${avgScore}%</span>
                </div>
                <div style="margin-top:14px;display:flex;justify-content:center;gap:10px;">
                    <button onclick="window.resetLessonExercises(this.closest('.lesson-exercises-wrapper') || this.closest('.lesson-pane') || this.parentElement.parentElement)" 
                            style="padding:9px 22px;border:none;border-radius:20px;background:linear-gradient(135deg, #ec4899, #db2777);color:white;font-size:13.5px;font-weight:700;cursor:pointer;box-shadow:0 3px 10px rgba(236,72,153,0.3);transition:all 0.2s;">
                        Hãy vào trang cá nhân - mục Điểm TB làm bài để làm lại bài tập này
                    </button>
                </div>
            `;

            resultBanner.scrollIntoView({ behavior: 'smooth', block: 'center' });
        };

        // ================================================================
        // SWITCH TAB - ĐÃ SỬA
        // ================================================================
        function switchTab(level, lessonNum, tabId) {
    const lesson = document.getElementById(`lesson-${level}-${lessonNum}`);
    if (!lesson) return;

    lesson.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('active');
    });

    lesson.querySelectorAll('.tab-pane').forEach(pane => {
        pane.classList.remove('active');
    });

    const resolvedTabId = resolveLessonTabId('grammar', lesson, tabId);
    currentTab = resolvedTabId;

    let targetBtn = null;
    lesson.querySelectorAll('.tab-btn').forEach(btn => {
        if (String(btn.dataset.tab) === resolvedTabId) {
            targetBtn = btn;
        }
    });

    if (targetBtn) {
        targetBtn.classList.add('active');
    }

    const pane = document.getElementById(`tab-${level}-${lessonNum}-${resolvedTabId}`);
    if (pane) {
        pane.classList.add('active');
    } else {
        const firstPane = lesson.querySelector('.tab-pane');
        if (firstPane) firstPane.classList.add('active');
    }
}
        // ================================================================
        // SHOW LESSON
        // ================================================================
        function showLesson(level, lessonNum, tabId) {
            window.showLesson = showLesson;
            const lessonEl = document.getElementById(`lesson-${level}-${lessonNum}`);
            if (!lessonEl) {
                if (typeof window.showContent === 'function') {
                    window.showContent(window.currentModule || 'grammar', level);
                    setTimeout(() => showLesson(level, lessonNum, tabId), 350);
                }
                return;
            }

            document.querySelectorAll('.lesson').forEach(el => el.classList.remove('active'));

            document.querySelectorAll('.lesson-item').forEach(el => {
                el.classList.remove('active');
                el.style.cssText = 'padding:10px 20px;cursor:pointer;transition:all 0.3s ease;font-size:14px;color:#4a5568;border-left:3px solid transparent;display:flex;align-items:center;gap:8px;';
                const numSpan = el.querySelector('.lesson-num');
                if (numSpan) {
                    numSpan.style.background = '#fce7f3';
                    numSpan.style.color = '#be185d';
                }
            });

            lessonEl.classList.add('active');
            lessonEl.scrollIntoView({ behavior: 'smooth', block: 'start' });

            const sidebarItem = document.querySelector(`.lesson-item[data-level="${level}"][data-lesson-id="${lessonNum}"]`);
            if (sidebarItem) {
                sidebarItem.classList.add('active');
                sidebarItem.style.cssText = 'padding:10px 20px;cursor:pointer;transition:all 0.3s ease;font-size:14px;color:#be185d;font-weight:600;border-left:3px solid #ec4899;display:flex;align-items:center;gap:8px;background:#fdf2f8;';
                const numSpan = sidebarItem.querySelector('.lesson-num');
                if (numSpan) {
                    numSpan.style.background = '#ec4899';
                    numSpan.style.color = 'white';
                }
            }

            switchTab(level, lessonNum, tabId);
        }

        // ================================================================
        // NEXT / PREV TAB
        // ================================================================
        function nextTab(hskLevel, lessonNum) {
            const lesson = document.getElementById(`lesson-${hskLevel}-${lessonNum}`);
            if (!lesson) return;

            const tabs = [...lesson.querySelectorAll(".tab-btn")];
            let active = tabs.findIndex(tab => tab.classList.contains("active"));

            // còn tab tiếp
            if (active < tabs.length - 1) {
                tabs[active + 1].click();
                return;
            }

            // sang bài tiếp
            const data = cachedData[`grammar-${hskLevel}`];
            if (!data) return;

            if (lessonNum < data.lessons.length) {
                showLesson(hskLevel, lessonNum + 1, "1");
                return;
            }

            // sang HSK tiếp
            const idx = hskLevels.indexOf(hskLevel);
            if (idx < hskLevels.length - 1) {
                const nextLevel = hskLevels[idx + 1];
                showContent("grammar", nextLevel);
                setTimeout(() => {
                    showLesson(nextLevel, 1, "1");
                }, 300);
            } else {
                alert("🎉 Bạn đã hoàn thành toàn bộ khóa học!");
            }
        }

        function prevTab(hskLevel, lessonNum) {
            const lesson = document.getElementById(`lesson-${hskLevel}-${lessonNum}`);
            if (!lesson) return;

            const tabs = [...lesson.querySelectorAll(".tab-btn")];
            let active = tabs.findIndex(tab => tab.classList.contains("active"));

            // còn tab trước
            if (active > 0) {
                tabs[active - 1].click();
                return;
            }

            // về bài trước
            if (lessonNum > 1) {
showLesson(hskLevel, lessonNum - 1, "999");  // ✅ CHỈ ĐẾN TAB BÀI TẬP
                return;
            }

            // về HSK trước
            const idx = hskLevels.indexOf(hskLevel);
            if (idx > 0) {
                const prevLevel = hskLevels[idx - 1];
                const data = cachedData[`grammar-${prevLevel}`];
                showContent("grammar", prevLevel);
                setTimeout(() => {
showLesson(prevLevel, data.lessons[data.lessons.length - 1].id, "999");
                }, 300);
            }
        }
function goToTab(level, lessonId, tabId) {
    showLesson(level, lessonId, tabId);
}
        // ================================================================
        // AUDIO (PHÁT ÂM TIẾNG TRUNG CHUẨN)
        // ================================================================
        const pinyinToHanziMap = {
            'b': '波', 'p': '坡', 'm': '摸', 'f': '佛',
            'd': '得', 't': '特', 'n': '讷', 'l': '勒',
            'g': '哥', 'k': '科', 'h': '喝',
            'j': '基', 'q': '欺', 'x': '希',
            'zh': '知', 'ch': '吃', 'sh': '诗', 'r': '日',
            'z': '资', 'c': '雌', 's': '思',
            'y': '衣', 'w': '乌',
            'mā': '妈', 'má': '麻', 'mǎ': '马', 'mà': '骂',
            'a': '啊', 'o': '喔', 'e': '鹅', 'i': '衣', 'u': '乌', 'ü': '迂'
        };

        let cachedZhVoice = null;
        function findChineseVoice() {
            if (!('speechSynthesis' in window)) return null;
            const voices = window.speechSynthesis.getVoices();
            if (!voices || voices.length === 0) return null;

            // Priority search for Chinese voices
            const zhVoices = voices.filter(v => 
                v.lang === 'zh-CN' || v.lang === 'zh_CN' || 
                v.lang.startsWith('zh') || v.lang.includes('zh') ||
                v.name.includes('Chinese') || v.name.includes('Mandarin') ||
                v.name.includes('Tingting') || v.name.includes('Xiaoxiao') ||
                v.name.includes('Yunxi') || v.name.includes('Kangkang') ||
                v.name.includes('Huihui') || v.name.includes('Yaoyao') ||
                v.name.includes('Google 普通话')
            );

            if (zhVoices.length > 0) {
                const exactZh = zhVoices.find(v => v.lang === 'zh-CN' || v.lang === 'zh_CN');
                if (exactZh) return exactZh;
                return zhVoices[0];
            }
            return null;
        }

        if ('speechSynthesis' in window) {
            window.speechSynthesis.onvoiceschanged = () => {
                cachedZhVoice = findChineseVoice();
            };
            cachedZhVoice = findChineseVoice();
        }

        let currentAudioPlayer = null;

        function playAudio(rawText) {
            if (!rawText) return;
            let text = rawText.toString().trim();
            if (!text) return;

            // Strip HTML tags if present
            text = text.replace(/<[^>]*>/g, '').trim();

            // Map pinyin phonetic representation to Hanzi if applicable for clear Mandarin pronunciation
            const textToSpeak = pinyinToHanziMap[text.toLowerCase()] || text;

            // Stop any currently playing audio
            if (currentAudioPlayer) {
                currentAudioPlayer.pause();
                currentAudioPlayer = null;
            }

            // High-quality online Mandarin voice fallback (Youdao / Google Translate TTS)
            const youdaoUrl = `https://dict.youdao.com/dictvoice?audio=${encodeURIComponent(textToSpeak)}&le=zh`;
            const googleUrl = `https://translate.google.com/translate_tts?ie=UTF-8&q=${encodeURIComponent(textToSpeak)}&tl=zh-CN&client=tw-ob`;

            const audio = new Audio();
            currentAudioPlayer = audio;

            audio.src = youdaoUrl;
            audio.play().catch(err => {
                // Fallback to Google Translate TTS
                const fallbackAudio = new Audio(googleUrl);
                currentAudioPlayer = fallbackAudio;
                fallbackAudio.play().catch(e => {
                    // Fallback to Web Speech API with explicit Chinese voice
                    speakWithSpeechSynthesis(textToSpeak);
                });
            });
        }

        function speakWithSpeechSynthesis(text) {
            if (!('speechSynthesis' in window)) return;
            window.speechSynthesis.cancel();

            const utterance = new SpeechSynthesisUtterance(text);
            utterance.lang = 'zh-CN';
            utterance.rate = 0.85;

            const zhVoice = cachedZhVoice || findChineseVoice();
            if (zhVoice) {
                utterance.voice = zhVoice;
            }

            window.speechSynthesis.speak(utterance);
        }

        function togglePinyinForThis(event) {
            if (event) {
                event.stopPropagation();
                event.preventDefault();
            }
            const btn = event ? event.currentTarget : null;
            if (!btn) return;

            let container = btn.closest('.grammar-example-card, .text-group, .example-card, .subcard, .example-with-audio, .vocab-card, .sentence-card, .example-item, .dictation-item, .writing-card, .speaking-card');
            if (!container) container = btn.parentElement ? btn.parentElement : null;
            if (!container) return;

            let pyElement = container.querySelector('.py');
            if (!pyElement && container.parentElement) {
                pyElement = container.parentElement.querySelector('.py');
            }
            if (!pyElement) return;

            const isHidden = pyElement.style.display === 'none' || getComputedStyle(pyElement).display === 'none';
            if (isHidden) {
                pyElement.style.display = 'block';
                btn.textContent = 'Ẩn phiên âm';
                btn.style.background = '#be185d';
            } else {
                pyElement.style.display = 'none';
                btn.textContent = 'Phiên âm';
                btn.style.background = '#ec4899';
            }
        }

        function toggleNghiaForThis(event) {
            if (event) {
                event.stopPropagation();
                event.preventDefault();
            }
            const btn = event ? event.currentTarget : null;
            if (!btn) return;

            let container = btn.closest('.grammar-example-card, .text-group, .example-card, .subcard, .example-with-audio, .vocab-card, .sentence-card, .example-item, .dictation-item, .writing-card, .speaking-card');
            if (!container) container = btn.parentElement ? btn.parentElement : null;
            if (!container) return;

            let viElement = container.querySelector('.vi');
            if (!viElement && container.parentElement) {
                viElement = container.parentElement.querySelector('.vi');
            }
            if (!viElement) return;

            const isHidden = viElement.style.display === 'none' || getComputedStyle(viElement).display === 'none';
            if (isHidden) {
                viElement.style.display = 'block';
                btn.textContent = 'Ẩn nghĩa';
                btn.style.background = '#6d28d9';
            } else {
                viElement.style.display = 'none';
                btn.textContent = 'Nghĩa';
                btn.style.background = '#8b5cf6';
            }
        }
        window.togglePinyinForThis = togglePinyinForThis;
        window.toggleNghiaForThis = toggleNghiaForThis;

        // ================================================================
        // HIGHLIGHT
        // ================================================================

        function toggleHighlightMode() {
            highlightMode = !highlightMode;
            const btn = document.getElementById('highlightToggle');
            if (highlightMode) {
                btn.textContent = 'Tắt';
                btn.style.background = '#f44336';
                document.body.style.cursor = 'text';
            } else {
                btn.textContent = 'Highlight';
                btn.style.background = '#ec4899';
                document.body.style.cursor = 'default';
            }
        }

        function toggleToolbar() {
            const toolbar = document.getElementById('highlightToolbar');
            const btn = document.getElementById('toggleToolbarBtn');
            toolbarVisible = !toolbarVisible;
            if (toolbarVisible) {
                if (toolbar) toolbar.style.display = 'flex';
                if (btn) {
                    btn.textContent = '✖';
                    btn.style.background = '#f44336';
                    btn.style.transform = 'rotate(90deg)';
                }
            } else {
                if (toolbar) toolbar.style.display = 'none';
                if (btn) {
                    btn.textContent = '✏️';
                    btn.style.background = '#ec4899';
                    btn.style.transform = 'rotate(0deg)';
                }
            }
        }
        window.toggleToolbar = toggleToolbar;

                function processTextSelection() {
            if (!highlightMode) return;
            
            const selection = window.getSelection();
            if (!selection || selection.isCollapsed) return;
            
            const selectedText = selection.toString().trim();
            if (selectedText.length === 0) return;
            
            try {
                const range = selection.getRangeAt(0);
                const container = range.commonAncestorContainer;
                
                // Kiểm tra xem có đang trong vùng nội dung chính không
                const mainContent = document.querySelector('.content-inner, .lesson-main, .tab-content, .card, #contentInner');
                if (!mainContent || !mainContent.contains(container)) return;
                
                // Không highlight trong input, textarea, button
                let parentElement = container.nodeType === 3 ? container.parentElement : container;
                if (!parentElement) return;
                const tag = parentElement.tagName;
                if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'BUTTON' || parentElement.closest('button')) {
                    selection.removeAllRanges();
                    return;
                }
                
                const parentStyle = window.getComputedStyle(parentElement);
                const highlightId = 'hl_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6);
                
                // Tạo highlight - giữ nguyên font chữ & tối ưu hiển thị mobile
                const span = document.createElement('span');
                span.className = 'highlighted';
                span.dataset.highlightId = highlightId;
                span.style.backgroundColor = '#ffe0b2';
                span.style.font = parentStyle.font || 'inherit';
                span.style.fontFamily = parentStyle.fontFamily || 'inherit';
                span.style.fontSize = parentStyle.fontSize || 'inherit';
                span.style.fontWeight = parentStyle.fontWeight || 'inherit';
                span.style.color = parentStyle.color || 'inherit';
                span.style.borderRadius = '3px';
                span.style.padding = '0 2px';
                span.style.cursor = 'pointer';
                span.textContent = selectedText;
                
                range.deleteContents();
                range.insertNode(span);
                saveHighlights();
            } catch (error) {
                console.log('Lỗi highlight:', error);
            }
            
            selection.removeAllRanges();
        }

        document.addEventListener('mouseup', processTextSelection);
        let touchSelectionTimeout = null;
        document.addEventListener('touchend', function(e) {
            if (!highlightMode) return;
            clearTimeout(touchSelectionTimeout);
            touchSelectionTimeout = setTimeout(processTextSelection, 150);
        });

        function clearAllHighlights() {
            if (confirm('Xóa tất cả highlight?')) {
                document.querySelectorAll('.highlighted').forEach(el => {
                    const text = el.textContent;
                    const parent = el.parentNode;
                    const textNode = document.createTextNode(text);
                    parent.replaceChild(textNode, el);
                    parent.normalize();
                });
                localStorage.removeItem('hsk_highlights');
                // Không cần gọi attachHighlightClickListeners
            }
        }

        function saveHighlights() {
            const highlights = [];
            document.querySelectorAll('.highlighted').forEach(el => {
                highlights.push({
                    id: el.dataset.highlightId,
                    text: el.textContent,
                    color: el.style.backgroundColor || '#ffe0b2'
                });
            });
            try {
                localStorage.setItem('hsk_highlights', JSON.stringify(highlights));
            } catch (e) {
                console.warn('Không thể lưu highlight:', e);
            }
        }

        function loadHighlights() {
            const saved = localStorage.getItem('hsk_highlights');
            if (!saved) return;
            try {
                const highlights = JSON.parse(saved);
                setTimeout(() => {
                    const mainContent = document.querySelector('.lesson-main, .tab-content, .card');
                    if (!mainContent) return;
                    
                    const walker = document.createTreeWalker(
                        mainContent,
                        NodeFilter.SHOW_TEXT,
                        null,
                        false
                    );
                    let nodes = [];
                    let node;
                    while (node = walker.nextNode()) {
                        if (node.parentElement && !node.parentElement.classList.contains('highlighted')) {
                            nodes.push(node);
                        }
                    }
                    
                    highlights.forEach(h => {
                        nodes.forEach(textNode => {
                            const text = textNode.textContent;
                            if (text.includes(h.text)) {
                                try {
                                    const index = text.indexOf(h.text);
                                    if (index !== -1) {
                                        const range = document.createRange();
                                        range.setStart(textNode, index);
                                        range.setEnd(textNode, index + h.text.length);
                                        
                                        const span = document.createElement('span');
                                        span.className = 'highlighted';
                                        span.dataset.highlightId = h.id || 'hl_' + Date.now();
                                        span.style.backgroundColor = h.color || '#ffe0b2';
                                        span.textContent = h.text;
                                        
                                        range.deleteContents();
                                        range.insertNode(span);
                                    }
                                } catch (e) {
                                    console.warn('Lỗi restore highlight:', e);
                                }
                            }
                        });
                    });
                    // Không cần gọi attachHighlightClickListeners nữa
                }, 500);
            } catch (e) {
                console.log('Lỗi load highlight:', e);
            }
        }

        setTimeout(() => loadHighlights(), 600);

        function deleteSingleHighlight(targetEl) {
            const el = targetEl || currentHighlightElement;
            if (el) {
                const text = el.textContent;
                const highlightId = el.dataset.highlightId;
                const parent = el.parentNode;
                if (parent) {
                    const textNode = document.createTextNode(text);
                    parent.replaceChild(textNode, el);
                    parent.normalize();
                }
                
                let highlights = JSON.parse(localStorage.getItem('hsk_highlights') || '[]');
                highlights = highlights.filter(h => h.id !== highlightId && h.text !== text);
                try { 
                    localStorage.setItem('hsk_highlights', JSON.stringify(highlights)); 
                } catch (e) {}
                
                const menu = document.getElementById('highlightMenu');
                if (menu) menu.style.display = 'none';
                currentHighlightElement = null;
            }
        }

        // Sự kiện click để hiển thị nút xóa khi nhấn vào bất kỳ đoạn highlight nào
        document.addEventListener('click', function(e) {
            const highlightEl = e.target.closest('.highlighted');
            const menu = document.getElementById('highlightMenu');
            
            if (highlightEl) {
                e.stopPropagation();
                currentHighlightElement = highlightEl;
                
                if (menu) {
                    const rect = highlightEl.getBoundingClientRect();
                    menu.style.display = 'flex';
                    
                    let top = rect.top - 44;
                    if (top < 10) top = rect.bottom + 8;
                    let left = rect.left + (rect.width / 2) - 50;
                    if (left < 10) left = 10;
                    if (left + 110 > window.innerWidth) left = window.innerWidth - 120;
                    
                    menu.style.top = top + 'px';
                    menu.style.left = left + 'px';
                }
            } else if (menu && !e.target.closest('#highlightMenu')) {
                menu.style.display = 'none';
                currentHighlightElement = null;
            }
        });
        // ================================================================
        // FLASHCARDS & UNMASTERED WORDS SYSTEM
        // ================================================================
        
        function getUnmasteredList() {
            let words = [];
            const saved = localStorage.getItem('undefinedWords');
            if (saved) {
                try { words = JSON.parse(saved) || []; } catch(e){}
            }
            const user = (window.auth && window.auth.currentUser) ? window.auth.currentUser : null;
            const uid = user ? user.uid : 'guest';
            if (typeof window.getUserProfile === 'function') {
                const profile = window.getUserProfile(uid);
                if (profile && profile.unmasteredFlashcards && Array.isArray(profile.unmasteredFlashcards)) {
                    profile.unmasteredFlashcards.forEach(card => {
                        if (card && card.cn && !words.some(w => w.cn === card.cn)) {
                            words.push(card);
                        }
                    });
                }
            }
            return words;
        }

        function updateToolbarUnmasteredBtn() {
            const list = getUnmasteredList();
            const btn = document.getElementById('toolbarUnmasteredBtn');
            if (btn) {
                btn.innerHTML = `⏳ Chưa nắm (${list.length})`;
            }
        }

        async function startVocabFlashcard() {
            flashcardType = 'vocab';
            const savedIndex = localStorage.getItem(`flashcard_index_vocab_${currentLevel}`);
            flashcardIndex = savedIndex !== null ? parseInt(savedIndex) : 0;
            
            const words = [];
            const levelData = await loadModuleData('vocab', currentLevel);
            
            if (levelData && levelData.lessons) {
                levelData.lessons.forEach(lesson => {
                    if (lesson.tabs && lesson.tabs.length > 0) {
                        lesson.tabs.forEach(tab => {
                            if (tab.subcards && tab.subcards.length > 0) {
                                tab.subcards.forEach(subcard => {
                                    if (subcard.type === 'vocab_list' && subcard.words) {
                                        words.push(...subcard.words.map(w => ({
                                            cn: w.hanzi || w.cn,
                                            py: w.pinyin || w.py || '',
                                            vi: w.meaning || w.vi || ''
                                        })));
                                    }
                                });
                            }
                        });
                    }
                });
            }
            
            if (words.length === 0) {
                alert('Không có từ vựng để ôn tập!');
                return;
            }
            
            flashcardData = words;
            document.getElementById('flashcardModal')?.classList.add('active');
            showFlashcard();
        }

        async function startHanziFlashcards() {
            flashcardType = 'hanzi';
            const savedIndex = localStorage.getItem(`flashcard_index_hanzi_${currentLevel}`);
            flashcardIndex = savedIndex !== null ? parseInt(savedIndex) : 0;
            
            let chars = [];
            if (window.hanziState && window.hanziState.level === currentLevel && window.hanziState.allChars && window.hanziState.allChars.length > 0) {
                chars = window.hanziState.allChars;
            } else {
                const levelData = await loadModuleData('hanzi', currentLevel);
                if (levelData) {
                    if (Array.isArray(levelData)) {
                        chars = levelData;
                    } else if (Array.isArray(levelData.chars)) {
                        chars = levelData.chars;
                    } else {
                        for (let k in levelData) {
                            if (levelData[k] && Array.isArray(levelData[k].chars)) {
                                chars = levelData[k].chars;
                                break;
                            } else if (Array.isArray(levelData[k])) {
                                chars = levelData[k];
                                break;
                            }
                        }
                    }
                }
            }
            
            if (!chars || chars.length === 0) {
                alert('Chưa có danh sách chữ Hán để ôn tập!');
                return;
            }
            
            flashcardData = chars.map(c => ({
                cn: c.hanzi || c.cn || '',
                py: c.pinyin || c.py || '',
                vi: c.meaning || c.vi || '',
                radical: c.radical || '',
                radical_meaning: c.radical_vietnamese || c.radical_meaning || '',
                story: c.story || c.note || '',
                strokes: c.strokes || null,
                examples: c.examples || []
            }));

            document.getElementById('flashcardModal')?.classList.add('active');
            showFlashcard();
        }

        async function startFlashcard() {
            flashcardType = 'grammar';
            const savedIndex = localStorage.getItem(`flashcard_index_grammar_${currentLevel}`);
            flashcardIndex = savedIndex !== null ? parseInt(savedIndex) : 0;
            
            const words = [];
            const levelData = await loadModuleData('grammar', currentLevel);
            if (levelData && levelData.lessons) {
                levelData.lessons.forEach(lesson => {
                    if (lesson.tabs) {
                        lesson.tabs.forEach(tab => {
                            if (tab.examples) {
                                tab.examples.forEach(ex => {
                                    words.push({ cn: ex.cn, py: ex.py || '', vi: ex.vi || '' });
                                });
                            }
                        });
                    }
                });
            }
            if (words.length === 0) { alert('Không có ngữ pháp để ôn tập!'); return; }
            flashcardData = words;
            document.getElementById('flashcardModal')?.classList.add('active');
            showFlashcard();
        }

        function isWordUnmastered(cn) {
            const list = getUnmasteredList();
            return list.some(w => w.cn === cn);
        }

        function showFlashcard() {
            if (!flashcardData || flashcardData.length === 0) return;
            if (flashcardIndex < 0) flashcardIndex = 0;
            if (flashcardIndex >= flashcardData.length) flashcardIndex = flashcardData.length - 1;

            const data = flashcardData[flashcardIndex];
            if (!data) return;
            
            const countEl = document.getElementById('flashcardCount');
            if (countEl) countEl.textContent = `Thẻ ${flashcardIndex + 1} / ${flashcardData.length}`;
            
            const summary = document.getElementById('flashcardProgressSummary');
            if (summary) {
                summary.textContent = `Vị trí: ${flashcardIndex + 1}/${flashcardData.length}`;
            }

            const statusBadge = document.getElementById('flashcardStatusBadge');
            if (statusBadge) {
                const unmastered = isWordUnmastered(data.cn);
                if (unmastered) {
                    statusBadge.textContent = '⏳ Chưa nắm';
                    statusBadge.style.background = '#fef3c7';
                    statusBadge.style.color = '#d97706';
                } else {
                    statusBadge.textContent = '✅ Đã thuộc';
                    statusBadge.style.background = '#dcfce7';
                    statusBadge.style.color = '#15803d';
                }
            }

            const titleEl = document.getElementById('flashcardTitle');
            if (titleEl) {
                const typeTitles = {
                    vocab: `📚 Flashcard Từ vựng (${(currentLevel || 'HSK1').toUpperCase()})`,
                    hanzi: `🀄 Flashcard Chữ Hán (${(currentLevel || 'HSK1').toUpperCase()})`,
                    grammar: `📖 Flashcard Ngữ pháp (${(currentLevel || 'HSK1').toUpperCase()})`
                };
                titleEl.textContent = typeTitles[flashcardType] || '📚 Flashcard Ôn tập';
            }

            // Reset flip
            const face = document.getElementById('flashcardFace');
            if (face) face.classList.remove('flipped');
            
            const frontEl = document.getElementById('flashcardFront');
            const backEl = document.getElementById('flashcardBack');

            if (data.story || data.radical || flashcardType === 'hanzi') {
                if (frontEl) {
                    frontEl.innerHTML = `
                        <div class="tian-zi-ge" style="width:130px;height:130px;font-size:84px;margin:0 auto 10px;font-weight:bold;color:#be185d;font-family:'Kaiti','SimSun',serif,sans-serif;">
                            ${escapeHtml(data.cn)}
                        </div>
                        ${(data.py && flashcardType !== 'hanzi') ? `<div style="font-size:18px;color:#db2777;font-weight:700;">${escapeHtml(data.py)}</div>` : ''}
                        ${data.strokes ? `<div style="font-size:12px;color:#9333ea;font-weight:700;margin-top:4px;">${data.strokes} nét</div>` : ''}
                    `;
                }
                
                let backHtml = `
                    <div class="cn" style="font-size:36px;font-weight:bold;color:#be185d;margin-bottom:4px;font-family:'Kaiti','SimSun',serif,sans-serif;">${escapeHtml(data.cn)}</div>
                    <div class="py" style="font-size:18px;font-weight:600;color:#db2777;">${escapeHtml(data.py || '')}</div>
                    <div class="vi" style="font-size:16px;font-weight:bold;color:#1e293b;margin:6px 0;">${escapeHtml(data.vi || '')}</div>
                `;
                if (flashcardType !== 'hanzi') {
                    if (data.radical) {
                        backHtml += `<div style="font-size:13px;color:#64748b;margin-bottom:6px;">Bộ <b>${escapeHtml(data.radical)}</b> (${escapeHtml(data.radical_meaning || '')})</div>`;
                    }
                    if (data.story) {
                        backHtml += `<div style="font-size:12.5px;background:#fffbeb;border:1px solid #fde68a;padding:8px;border-radius:8px;color:#92400e;text-align:left;margin-top:8px;">💡 <b>Chiết tự:</b> ${escapeHtml(data.story)}</div>`;
                    }
                }
                backHtml += `<button onclick="event.stopPropagation();playAudio('${(data.cn || '').replace(/'/g, "\\'")}')" style="margin-top:10px;padding:6px 14px;border:none;border-radius:20px;background:#fce7f3;color:#be185d;font-weight:700;font-size:13px;cursor:pointer;">🔊 Nghe</button>`;
                if (backEl) backEl.innerHTML = backHtml;
            } else {
                if (frontEl) {
                    frontEl.innerHTML = `
                        <span class="cn" style="font-size:56px;font-weight:bold;color:#1e293b;font-family:'Kaiti','SimSun',serif,sans-serif;line-height:1.2;display:block;">${escapeHtml(data.cn)}</span>
                        <div style="font-size:12px;color:#94a3b8;margin-top:8px;">(Nhấn vào thẻ để lật xem đáp án)</div>
                    `;
                }
                if (backEl) {
                    backEl.innerHTML = `
                        <div class="cn" style="font-size:36px;font-weight:bold;color:#be185d;margin-bottom:4px;font-family:'Kaiti','SimSun',serif,sans-serif;">${escapeHtml(data.cn)}</div>
                        <div class="py" style="color:#db2777;font-size:17px;font-weight:600;margin-bottom:4px;">${escapeHtml(data.py || '')}</div>
                        <div class="vi" style="color:#334155;font-size:15px;font-weight:500;">${escapeHtml(data.vi || '')}</div>
                        <button onclick="event.stopPropagation();playAudio('${(data.cn || '').replace(/'/g, "\\'")}')" style="margin-top:10px;padding:6px 14px;border:none;border-radius:20px;background:#fce7f3;color:#be185d;font-weight:700;font-size:13px;cursor:pointer;">🔊 Nghe</button>
                    `;
                }
            }
            
            // Load personal note for this flashcard
            const user = (window.auth && window.auth.currentUser) ? window.auth.currentUser : null;
            const uid = user ? user.uid : 'guest';
            const profile = window.getUserProfile(uid);
            if (!profile.flashcardNotes) profile.flashcardNotes = {};
            const noteInput = document.getElementById('flashcardUserNote');
            if (noteInput) {
                noteInput.value = (data && data.cn) ? (profile.flashcardNotes[data.cn] || '') : '';
            }
            const noteHint = document.getElementById('flashcardNoteSavedHint');
            if (noteHint) noteHint.style.display = 'none';

            localStorage.setItem(`flashcard_index_${flashcardType}_${currentLevel}`, flashcardIndex);
        }

        window.saveCurrentFlashcardNote = function() {
            if (!flashcardData || !flashcardData[flashcardIndex]) return;
            const data = flashcardData[flashcardIndex];
            if (!data || !data.cn) return;
            const user = (window.auth && window.auth.currentUser) ? window.auth.currentUser : null;
            const uid = user ? user.uid : 'guest';
            const profile = window.getUserProfile(uid);
            if (!profile.flashcardNotes) profile.flashcardNotes = {};
            const noteInput = document.getElementById('flashcardUserNote');
            if (noteInput) {
                profile.flashcardNotes[data.cn] = noteInput.value;
                window.saveUserProfile(profile);
                const hint = document.getElementById('flashcardNoteSavedHint');
                if (hint) {
                    hint.style.display = 'inline';
                    setTimeout(() => { if (hint) hint.style.display = 'none'; }, 1500);
                }
            }
        };

        function resumeFlashcards() {
            const savedIndex = localStorage.getItem(`flashcard_index_${flashcardType}_${currentLevel}`);
            flashcardIndex = savedIndex !== null ? parseInt(savedIndex) : 0;
            showFlashcard();
        }

        function restartFlashcards() {
            flashcardIndex = 0;
            localStorage.setItem(`flashcard_index_${flashcardType}_${currentLevel}`, 0);
            showFlashcard();
        }

        function prevFlashcard() {
            if (flashcardIndex > 0) {
                flashcardIndex--;
                showFlashcard();
            } else {
                alert('Đây là thẻ đầu tiên!');
            }
        }

        function nextFlashcard() {
            if (flashcardData && flashcardIndex < flashcardData.length - 1) {
                flashcardIndex++;
                showFlashcard();
            } else {
                alert('🎉 Bạn đã đến thẻ cuối cùng của bộ này!');
            }
        }

        function shuffleFlashcards() {
            for (let i = flashcardData.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [flashcardData[i], flashcardData[j]] = [flashcardData[j], flashcardData[i]];
            }
            flashcardIndex = 0;
            showFlashcard();
            alert('✅ Đã xáo trộn danh sách thẻ!');
        }

        function closeFlashcard() { document.getElementById('flashcardModal')?.classList.remove('active'); }
        function openFlashcardSelector() { const m = document.getElementById('flashcardSelectorModal'); if (m) m.style.display = 'flex'; }
        function closeSelectorModal() { const m = document.getElementById('flashcardSelectorModal'); if (m) m.style.display = 'none'; }

        function markAsUnderstood() {
            if (!flashcardData || !flashcardData[flashcardIndex]) return;
            const data = flashcardData[flashcardIndex];

            let saved = localStorage.getItem('undefinedWords');
            let list = saved ? JSON.parse(saved) : [];
            list = list.filter(w => w.cn !== data.cn);
            localStorage.setItem('undefinedWords', JSON.stringify(list));
            undefinedWords = list;

            const user = (window.auth && window.auth.currentUser) ? window.auth.currentUser : null;
            const uid = user ? user.uid : 'guest';
            if (typeof window.getUserProfile === 'function') {
                const profile = window.getUserProfile(uid);
                if (profile) {
                    profile.unmasteredFlashcards = (profile.unmasteredFlashcards || []).filter(w => w.cn !== data.cn);
                    if (typeof window.saveUserProfile === 'function') window.saveUserProfile(profile);
                }
            }

            updateToolbarUnmasteredBtn();

            if (flashcardIndex < flashcardData.length - 1) { 
                flashcardIndex++; 
                showFlashcard(); 
            } else { 
                alert('🎉 Đã học xong bộ thẻ!'); 
                showFlashcard();
            }
        }

        function markAsNotUnderstood() {
            if (!flashcardData || !flashcardData[flashcardIndex]) return;
            const data = flashcardData[flashcardIndex];

            let saved = localStorage.getItem('undefinedWords');
            let list = saved ? JSON.parse(saved) : [];
            if (!list.some(w => w.cn === data.cn)) {
                list.push(data);
                localStorage.setItem('undefinedWords', JSON.stringify(list));
            }
            undefinedWords = list;

            const user = (window.auth && window.auth.currentUser) ? window.auth.currentUser : null;
            const uid = user ? user.uid : 'guest';
            if (typeof window.getUserProfile === 'function') {
                const profile = window.getUserProfile(uid);
                if (profile) {
                    if (!profile.unmasteredFlashcards) profile.unmasteredFlashcards = [];
                    if (!profile.unmasteredFlashcards.some(w => w.cn === data.cn)) {
                        profile.unmasteredFlashcards.push(data);
                        if (typeof window.saveUserProfile === 'function') window.saveUserProfile(profile);
                    }
                }
            }

            updateToolbarUnmasteredBtn();

            if (flashcardIndex < flashcardData.length - 1) { 
                flashcardIndex++; 
                showFlashcard(); 
            } else { 
                alert('🎉 Đã đến thẻ cuối cùng!'); 
                showFlashcard();
            }
        }

        function reviewUndefinedWords() {
            const words = getUnmasteredList();
            if (!words || words.length === 0) {
                alert('🎉 Bạn không có từ hay flashcard nào trong danh sách "Chưa nắm"! Tất cả đã thuộc.');
                return;
            }
            undefinedWords = words;
            flashcardData = words;
            flashcardIndex = 0;
            flashcardType = 'vocab';
            document.getElementById('flashcardModal')?.classList.add('active');
            showFlashcard();
        }

        window.addEventListener('DOMContentLoaded', () => {
            setTimeout(updateToolbarUnmasteredBtn, 500);
        });

       // ================================================================
// SEARCH - TÌM KIẾM TRONG TẤT CẢ MODULES
// ================================================================
window.generateAutoHints = function(cnText, pyText, viText) {
    if (!cnText) return [];
    const matches = cnText.match(/[\u4e00-\u9fa5]{2,4}/g) || [];
    const unique = Array.from(new Set(matches));
    if (unique.length > 0) {
        return unique.slice(0, 4).map(w => ({
            cn: w,
            py: '',
            vi: 'Từ gợi ý trong câu'
        }));
    }
    const chars = Array.from(new Set((cnText.match(/[\u4e00-\u9fa5]/g) || [])));
    return chars.slice(0, 3).map(c => ({
        cn: c,
        py: '',
        vi: 'Chữ Hán gợi ý'
    }));
};

function extractVocabWordsFromLesson(lesson) {
    const words = [];
    if (!lesson) return words;

    if (Array.isArray(lesson.words)) {
        words.push(...lesson.words);
    }

    if (Array.isArray(lesson.tabs)) {
        lesson.tabs.forEach((tab) => {
            if (!tab) return;
            if (Array.isArray(tab.words)) {
                words.push(...tab.words);
            }
            if (Array.isArray(tab.subcards)) {
                tab.subcards.forEach((subcard) => {
                    if (!subcard) return;
                    if (subcard.type === 'vocab_list' && Array.isArray(subcard.words)) {
                        words.push(...subcard.words);
                    } else if (Array.isArray(subcard.words)) {
                        words.push(...subcard.words);
                    } else if (subcard.hanzi || subcard.cn || subcard.pinyin || subcard.py || subcard.meaning || subcard.vi || subcard.word_type || subcard.note || subcard.examples) {
                        words.push(subcard);
                    }
                });
            }
        });
    }

    return words;
}

function focusVocabWordTarget(level, lessonId, wordHanzi, fallbackLabel) {
    const attempt = (remaining) => {
        const targetCard = document.querySelector(`#vocab-lesson-${level}-${lessonId} .vocab-word-card[data-hanzi="${wordHanzi || ''}"]`) ||
            document.querySelector(`#vocab-lesson-${level}-${lessonId} .vocab-word-card`);
        if (targetCard || remaining <= 0) {
            if (targetCard) {
                highlightAndScrollTarget(targetCard, fallbackLabel || 'Từ vựng');
            }
            return;
        }
        setTimeout(() => attempt(remaining - 1), 220);
    };
    attempt(8);
}

function findBestSearchTarget(rootEl, searchTerm) {
    if (!rootEl) return null;
    const normalized = String(searchTerm || '').trim().toLowerCase();
    if (!normalized) return null;

    const candidates = Array.from(rootEl.querySelectorAll('.vocab-card, .trans-mod-card, .trans-item, .exercise-card, .exercise-item, .fill-item, .grammar-tab-content, .subcard, .tab-pane, p, h3, h4, li'));
    const matched = candidates.find((cand) => {
        const text = String(cand.dataset.questionText || cand.textContent || '').toLowerCase();
        return text.includes(normalized);
    });

    if (!matched) return null;
    return matched.closest('.vocab-card, .trans-mod-card, .trans-item, .exercise-card, .exercise-item, .fill-item, .grammar-tab-content, .subcard, .tab-pane') || matched;
}

function highlightAndScrollTarget(targetEl, label) {
    if (!targetEl) return false;
    targetEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
    targetEl.style.transition = 'all 0.3s ease';
    targetEl.style.outline = '3px solid #ec4899';
    targetEl.style.outlineOffset = '4px';
    targetEl.style.boxShadow = '0 0 20px rgba(236,72,153,0.4)';

    setTimeout(() => {
        targetEl.style.outline = 'none';
        targetEl.style.boxShadow = 'none';
    }, 3500);

    if (label) {
        let toast = document.getElementById('search-detail-toast');
        if (!toast) {
            toast = document.createElement('div');
            toast.id = 'search-detail-toast';
            toast.style.cssText = 'position:fixed;bottom:24px;right:24px;z-index:9999;background:linear-gradient(135deg,#be185d,#9d174d);color:white;padding:12px 20px;border-radius:14px;font-weight:700;font-size:13.5px;box-shadow:0 8px 25px rgba(190,24,93,0.3);';
            document.body.appendChild(toast);
        }
        toast.innerHTML = `🔍 Chi tiết từ tìm kiếm: <b>${label}</b>`;
        toast.style.display = 'block';
        setTimeout(() => { toast.style.display = 'none'; }, 4000);
    }
    return true;
}

function universalSearch() {
    let query = document.getElementById('globalGrammarSearch').value.toLowerCase().trim();
    let dropdown = document.getElementById('searchDropdown');
    
    if (!dropdown) {
        dropdown = document.createElement('div');
        dropdown.id = 'searchDropdown';
        dropdown.className = 'search-results-dropdown';
        document.body.appendChild(dropdown);
    }
    
    if (query === '') {
        dropdown.style.display = 'none';
        return;
    }
    
    // Đặt vị trí dropdown
    const searchBox = document.querySelector('.search-box');
    if (searchBox) {
        const rect = searchBox.getBoundingClientRect();
        dropdown.style.top = (rect.bottom + 5) + 'px';
        dropdown.style.right = (window.innerWidth - rect.right) + 'px';
        dropdown.style.left = 'auto';
        dropdown.style.width = Math.min(400, window.innerWidth - 40) + 'px';
        dropdown.style.maxWidth = '400px';
        dropdown.style.minWidth = '280px';
    }
    
    dropdown.innerHTML = '<div style="padding:12px;text-align:center;color:#888;">🔍 Đang tìm kiếm...</div>';
    dropdown.style.display = 'block';
    
    // Load tất cả dữ liệu bài học
    (async function loadAllDataForSearch() {
        const modules = ['grammar', 'vocab', 'hanzi', 'dictation', 'shadowing'];
        const levels = ['hsk1', 'hsk2', 'hsk3', 'hsk4', 'hsk5', 'hsk6'];
        
        for (const module of modules) {
            for (const level of levels) {
                const key = `${module}-${level}`;
                if (!cachedData[key]) {
                    try {
                        await loadModuleData(module, level);
                    } catch (e) {
                        // Bỏ qua lỗi
                    }
                }
            }
        }
        performSearch();
    })();
    
    function performSearch() {
        dropdown.innerHTML = '';
        let resultsMap = new Map(); // Dùng Map để tránh trùng lặp
        
        const modules = ['grammar', 'vocab', 'hanzi'];
        const levels = ['hsk1', 'hsk2', 'hsk3', 'hsk4', 'hsk5', 'hsk6'];
        
        const moduleLabels = {
            grammar: '📝 Ngữ pháp',
            vocab: '📚 Từ vựng',
            hanzi: '🀄 Chữ Hán'
        };
        
        const moduleColors = {
            grammar: '#EC4899',
            vocab: '#F59E0B',
            hanzi: '#8B5CF6'
        };
        
        levels.forEach(levelId => {
            modules.forEach(moduleId => {
                const data = cachedData[`${moduleId}-${levelId}`];
                if (!data) return;
                
                // 1. TÌM NGỮ PHÁP LẺ HOẶC TỪ VỰNG LẺ TRONG BÀI HỌC
                if (data.lessons) {
                    data.lessons.forEach(lesson => {
                        // NẾU LÀ MODULE TỪ VỰNG: LẤY TỪNG TỪ VỰNG LẺ (Chỉ quét Tên từ vựng, Phiên âm, Nghĩa)
                        if (moduleId === 'vocab') {
                            const vocabWords = extractVocabWordsFromLesson(lesson);
                            vocabWords.forEach((word) => {
                                const hanzi = (word.hanzi || word.cn || '').toLowerCase();
                                const pinyin = (word.pinyin || word.py || '').toLowerCase();
                                const meaning = (word.meaning || word.vi || '').toLowerCase();

                                if (hanzi.includes(query) || pinyin.includes(query) || meaning.includes(query)) {
                                    const wordName = word.hanzi || word.cn || '';
                                    const key = `${moduleId}-${levelId}-word-${lesson.id}-${wordName || Math.random()}`;
                                    if (!resultsMap.has(key)) {
                                        resultsMap.set(key, {
                                            module: moduleId,
                                            level: levelId,
                                            lessonId: lesson.id,
                                            title: `Từ vựng: ${wordName} ${word.pinyin || word.py ? '(' + (word.pinyin || word.py) + ')' : ''}`,
                                            desc: `Nghĩa: ${word.meaning || word.vi || ''} • (Bài ${lesson.id})`,
                                            moduleLabel: '📚 Từ vựng',
                                            color: '#F59E0B',
                                            isVocabWord: true,
                                            wordHanzi: wordName,
                                            wordMeaning: word.meaning || word.vi || ''
                                        });
                                    }
                                }
                            });
                        }
                        
                        // NẾU LÀ MODULE NGỮ PHÁP: LẤY TỪNG ĐIỂM NGỮ PHÁP LẺ TRONG TABS (Chỉ quét Tên ngữ pháp, Cấu trúc, Nghĩa)
                        if (moduleId === 'grammar' && lesson.tabs) {
                            lesson.tabs.forEach(tab => {
                                // Bỏ qua tab bài tập
                                if (tab.id === 'exercise' || tab.id === '999' || (tab.title && tab.title.toLowerCase().includes('bài tập'))) {
                                    return;
                                }
                                const tabTitle = (tab.title || tab.name || '').toLowerCase();
                                const tabPattern = (tab.pattern || tab.structure || '').toLowerCase();
                                const tabSummary = (tab.summary || tab.definition || tab.meaning || tab.vi || '').toLowerCase();

                                if (tabTitle.includes(query) || tabPattern.includes(query) || tabSummary.includes(query)) {
                                    const displayTitle = tab.title || tab.name || 'Điểm ngữ pháp';
                                    const key = `${moduleId}-${levelId}-grammar-${lesson.id}-${tab.id}`;
                                    if (!resultsMap.has(key)) {
                                        let snippet = tab.pattern || tab.summary || '';
                                        
                                        resultsMap.set(key, {
                                            module: moduleId,
                                            level: levelId,
                                            lessonId: lesson.id,
                                            tabId: tab.id,
                                            title: `Ngữ pháp: ${displayTitle}`,
                                            desc: snippet ? `📌 ${snippet} • (Bài ${lesson.id})` : `Bài ${lesson.id}`,
                                            moduleLabel: '📝 Ngữ pháp',
                                            color: '#EC4899',
                                            isTab: true
                                        });
                                    }
                                }
                            });
                        }
                    });
                }
                
                // 2. TÌM TỪNG CHỮ HÁN LẺ (Chỉ quét Tên chữ Hán, Phiên âm, Nghĩa)
                const hanziList = data.chars || (Array.isArray(data) ? data : null);
                if (hanziList && Array.isArray(hanziList)) {
                    hanziList.forEach((charItem, idx) => {
                        const hanzi = (charItem.hanzi || charItem.cn || '').toLowerCase();
                        const pinyin = (charItem.pinyin || charItem.py || '').toLowerCase();
                        const meaning = (charItem.meaning || charItem.vi || '').toLowerCase();

                        if (hanzi.includes(query) || pinyin.includes(query) || meaning.includes(query)) {
                            const charName = charItem.hanzi || charItem.cn || '';
                            const key = `hanzi-${levelId}-char-${charName || idx}`;
                            if (!resultsMap.has(key)) {
                                resultsMap.set(key, {
                                    module: 'hanzi',
                                    level: levelId,
                                    title: `Chữ Hán: ${charName} ${charItem.pinyin || charItem.py ? '(' + (charItem.pinyin || charItem.py) + ')' : ''}`,
                                    desc: charItem.meaning || charItem.vi ? `Nghĩa: ${charItem.meaning || charItem.vi}` : '',
                                    moduleLabel: '🀄 Chữ Hán',
                                    color: '#8B5CF6',
                                    isHanzi: true,
                                    hanziChar: charName
                                });
                            }
                        }
                    });
                }
            });
        });
        
        // Hiển thị kết quả
        if (resultsMap.size === 0) {
            dropdown.innerHTML = `
                <div style="padding:16px;text-align:center;color:#888;">
                    <div style="font-size:24px;margin-bottom:8px;">🔍</div>
                    <div>Không tìm thấy kết quả cho "<strong>${query}</strong>"</div>
                    <div style="font-size:12px;color:#aaa;margin-top:4px;">Hãy thử từ khóa khác</div>
                </div>
            `;
        } else {
            // Hiển thị số lượng kết quả
            const countDiv = document.createElement('div');
            countDiv.style.cssText = 'padding:8px 16px;font-size:12px;color:#888;border-bottom:1px solid #f0f0f0;';
            countDiv.textContent = `Tìm thấy ${resultsMap.size} kết quả`;
            dropdown.appendChild(countDiv);
            
            // Hiển thị từng kết quả
            resultsMap.forEach((result) => {
                const item = document.createElement('div');
                item.className = 'search-item-result';
                item.style.cssText = `
                    padding:10px 16px;
                    border-bottom:1px solid #f0f0f0;
                    cursor:pointer;
                    transition:background 0.2s;
                `;
                item.onmouseenter = function() { this.style.background = '#fdf2f8'; };
                item.onmouseleave = function() { this.style.background = 'transparent'; };
                
                const levelLabel = result.level.toUpperCase();
                
                item.innerHTML = `
                    <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;margin-bottom:4px;">
                        <span class="hsk-tag" style="background:${result.color};color:white;padding:2px 10px;border-radius:4px;font-size:10px;font-weight:700;">${levelLabel}</span>
                        <span style="font-size:11px;color:#888;">${result.moduleLabel}</span>
                    </div>
                    <div class="title" style="font-size:13px;font-weight:600;color:#1e293b;">${result.title}</div>
                    ${result.desc ? `<div class="desc" style="font-size:12px;color:#64748b;margin-top:2px;">${result.desc}</div>` : ''}
                `;
                
item.onclick = function() {
    const searchInput = document.getElementById('globalGrammarSearch');
    const queryTerm = searchInput ? searchInput.value.trim() : '';
    if (searchInput) searchInput.value = '';
    dropdown.style.display = 'none';
    
    const targetModule = result.module;
    const targetLevel = result.level;
    const targetLessonId = result.lessonId || null;
    const targetTabId = result.tabId || null;
    const isExercise = result.isExercise || false;
    const searchTitle = result.title || '';
    
    // Cập nhật UI navigation
    document.querySelectorAll('.hsk-item').forEach(el => el.classList.remove('active'));
    const levelBtn = document.querySelector(`.hsk-item[data-level="${targetLevel}"]`);
    if (levelBtn) levelBtn.classList.add('active');
    
    document.querySelectorAll('.feature-card').forEach(el => el.classList.remove('active'));
    const featureCard = document.querySelector(`.feature-card[data-module="${targetModule}"]`);
    if (featureCard) {
        featureCard.classList.add('active');
        const parentGroup = featureCard.closest('.category-group');
        if (parentGroup) parentGroup.classList.add('expanded');
    }
    
    if (result.isHanzi && result.hanziChar) {
        (async function() {
            if (typeof window.showContent === 'function') await window.showContent('hanzi', targetLevel);
            setTimeout(() => {
                if (typeof openHanziDetailModal === 'function') {
                    openHanziDetailModal(result.hanziChar);
                }
            }, 400);
        })();
        return;
    }

    (async function() {
        if (typeof loadModuleData === 'function') {
            await loadModuleData(targetModule, targetLevel);
        }
        if (typeof window.showContent === 'function') await window.showContent(targetModule, targetLevel);

        setTimeout(() => {
            if (targetLessonId) {
                if (targetModule === 'grammar' && typeof window.showLesson === 'function') {
                    const tabToOpen = isExercise ? '999' : (targetTabId || 1);
                    window.showLesson(targetLevel, targetLessonId, tabToOpen);
                } else if (targetModule === 'vocab' && typeof window.showVocabLesson === 'function') {
                    const tabToOpen = isExercise ? 'exercise' : (targetTabId || 1);
                    window.showVocabLesson(targetLevel, targetLessonId, tabToOpen);
                }
            } else if (targetModule === 'entertainment' && typeof renderEntertainmentModule === 'function') {
                renderEntertainmentModule(targetLevel, 'all');
            } else if (targetModule === 'translation' && typeof renderTranslationModule === 'function') {
                renderTranslationModule(targetLevel, null);
            }

            setTimeout(() => {
                if (result.isVocabWord && targetModule === 'vocab' && targetLessonId) {
                    focusVocabWordTarget(targetLevel, targetLessonId, result.wordHanzi, searchTitle || 'Từ vựng');
                    return;
                }

                const lessonEl = (result.isTranslation && result.itemIdx !== undefined) ?
                                 document.getElementById(`trans-mod-item-${targetLevel}-${result.itemIdx}`) :
                                 (document.getElementById(`lesson-${targetLevel}-${targetLessonId}`) ||
                                  document.getElementById(`vocab-lesson-${targetLevel}-${targetLessonId}`) ||
                                  document.getElementById('contentArea'));
                if (lessonEl) {
                    const targetEl = findBestSearchTarget(lessonEl, (queryTerm || searchTitle || '').trim()) || lessonEl;
                    highlightAndScrollTarget(targetEl, searchTitle || 'Nội dung tìm kiếm');
                }
            }, 350);
        }, 400);
    })();
};

dropdown.appendChild(item);
            });
        }
        
        dropdown.style.display = 'block';
    }
}

window.filterLocalGrammar = function(query, level) {
    const q = (query || '').toLowerCase().trim();
    const dropdown = document.getElementById('grammarSearchDropdown');
    const lvl = (level || currentLevel || 'hsk1').toLowerCase();
    const key = `grammar-${lvl}`;
    const data = cachedData[key];

    const contentRoot = document.getElementById('contentInner') || document;
    const sidebarItems = contentRoot.querySelectorAll('.lesson-sidebar .lesson-item');
    const activeLessonEl = contentRoot.querySelector('.lesson.active');
    const activeLessonId = activeLessonEl ? parseInt((activeLessonEl.id || '').split('-').pop(), 10) : null;

    if (!q) {
        if (dropdown) dropdown.style.display = 'none';
        sidebarItems.forEach(item => {
            const itemLessonId = parseInt(item.dataset.lessonId, 10);
            item.style.display = (activeLessonId !== null && itemLessonId === activeLessonId) ? 'flex' : 'flex';
        });
        return;
    }

    if (!data || !data.lessons) {
        if (dropdown) dropdown.style.display = 'none';
        return;
    }

    const matches = [];
    const matchingLessonIds = new Set();

    data.lessons.forEach(lesson => {
        const lessonId = lesson.id;
        const lessonTitle = lesson.title || '';
        const lessonTitleMatches = lessonTitle.toLowerCase().includes(q);
        let lessonHasMatch = lessonTitleMatches;

        if (lessonTitleMatches) {
            matches.push({
                lessonId: lessonId,
                lessonTitle: lessonTitle,
                tabId: '1',
                tabTitle: lessonTitle,
                snippet: lessonTitle
            });
        }

        if (lesson.tabs && Array.isArray(lesson.tabs)) {
            lesson.tabs.forEach(tab => {
                const tabTitle = tab.title || '';
                let tabMatched = tabTitle.toLowerCase().includes(q);
                let snippet = '';

                if (tab.subcards && Array.isArray(tab.subcards)) {
                    tab.subcards.forEach(sc => {
                        const label = sc.label || '';
                        const text = sc.text || '';
                        if (label.toLowerCase().includes(q) || text.toLowerCase().includes(q)) {
                            tabMatched = true;
                            snippet = text.substring(0, 80);
                        }
                    });
                }

                if (tab.examples && Array.isArray(tab.examples)) {
                    tab.examples.forEach(ex => {
                        const cn = ex.cn || '';
                        const py = ex.py || '';
                        const vi = ex.vi || '';
                        if (cn.toLowerCase().includes(q) || py.toLowerCase().includes(q) || vi.toLowerCase().includes(q)) {
                            tabMatched = true;
                            snippet = cn + (vi ? ` (${vi})` : '');
                        }
                    });
                }

                if (tabMatched && !lessonTitleMatches) {
                    lessonHasMatch = true;
                    matches.push({
                        lessonId: lessonId,
                        lessonTitle: lessonTitle,
                        tabId: tab.id,
                        tabTitle: tabTitle,
                        snippet: snippet || tabTitle
                    });
                }
            });
        }

        if (lesson.exercises && Array.isArray(lesson.exercises)) {
            lesson.exercises.forEach((ex, idx) => {
                const question = ex.question || '';
                if (question.toLowerCase().includes(q)) {
                    lessonHasMatch = true;
                    matches.push({
                        lessonId: lessonId,
                        lessonTitle: lessonTitle,
                        tabId: '999',
                        tabTitle: `Bài tập ${idx + 1}`,
                        snippet: question
                    });
                }
            });
        }

        if (lessonHasMatch) {
            matchingLessonIds.add(lessonId);
        }
    });

    sidebarItems.forEach(item => {
        const itemLessonId = parseInt(item.dataset.lessonId, 10);
        const keepVisible = activeLessonId !== null && itemLessonId === activeLessonId;
        if (keepVisible || matchingLessonIds.has(itemLessonId)) {
            item.style.display = 'flex';
        } else {
            item.style.display = 'none';
        }
    });

    if (dropdown) {
        if (matches.length === 0) {
            dropdown.innerHTML = `
                <div style="padding:16px;text-align:center;color:#888;font-size:13px;">
                    🔍 Không tìm thấy điểm ngữ pháp phù hợp với "<strong>${escapeHtml(q)}</strong>"
                </div>
            `;
        } else {
            let html = `
                <div style="padding:8px 14px;font-size:11px;font-weight:700;color:#be185d;background:#fdf2f8;border-bottom:1px solid #fbcfe8;">
                    📝 TÌM THẤY ${matches.length} KẾT QUẢ NGỮ PHÁP (${lvl.toUpperCase()})
                </div>
            `;
            matches.forEach(m => {
                html += `
                    <div class="local-search-item" data-lesson-id="${m.lessonId}" data-tab-id="${m.tabId}"
                         style="padding:10px 14px;border-bottom:1px solid #f1f5f9;cursor:pointer;transition:background 0.2s;">
                        <div style="display:flex;align-items:center;gap:8px;margin-bottom:2px;">
                            <span style="background:#be185d;color:white;font-size:10px;font-weight:700;padding:2px 6px;border-radius:6px;">Bài ${m.lessonId}</span>
                            <span style="font-size:13.5px;font-weight:700;color:#1e293b;">${escapeHtml(m.tabTitle)}</span>
                        </div>
                        <div style="font-size:12.5px;color:#475569;">${escapeHtml(m.snippet)}</div>
                    </div>
                `;
            });
            dropdown.innerHTML = html;

            dropdown.querySelectorAll('.local-search-item').forEach(el => {
                el.onmouseenter = function() { this.style.background = '#fdf2f8'; };
                el.onmouseleave = function() { this.style.background = 'transparent'; };
                el.onclick = function() {
                    const lid = parseInt(this.dataset.lessonId);
                    const tid = this.dataset.tabId;
                    dropdown.style.display = 'none';

                    if (typeof window.showLesson === 'function') {
                        window.showLesson(lvl, lid, tid);
                    }

                    setTimeout(() => {
                        const targetPane = document.getElementById(`tab-${lvl}-${lid}-${tid}`) || document.getElementById(`lesson-${lvl}-${lid}`);
                        if (targetPane) {
                            const targetEl = findBestSearchTarget(targetPane, `${m.tabTitle || ''} ${m.snippet || ''}`) || targetPane;
                            highlightAndScrollTarget(targetEl, m.tabTitle || 'Nội dung tìm kiếm');
                        }
                    }, 250);
                };
            });
        }
        dropdown.style.display = 'block';
    }
};

window.filterLocalVocab = function(query, level) {
    const q = (query || '').toLowerCase().trim();
    const dropdown = document.getElementById('vocabSearchDropdown');
    const lvl = (level || currentLevel || 'hsk1').toLowerCase();
    const key = `vocab-${lvl}`;
    const data = cachedData[key];

    const contentRoot = document.getElementById('contentInner') || document;
    const sidebarItems = contentRoot.querySelectorAll('.lesson-sidebar .lesson-item');
    const wordCards = contentRoot.querySelectorAll('.vocab-word-card');
    const activeLessonEl = contentRoot.querySelector('.lesson.active');
    const activeLessonId = activeLessonEl ? parseInt((activeLessonEl.id || '').split('-').pop(), 10) : null;

    if (!q) {
        if (dropdown) dropdown.style.display = 'none';
        sidebarItems.forEach(item => item.style.display = 'flex');
        wordCards.forEach(card => card.style.display = 'block');
        return;
    }

    if (!data || !data.lessons) {
        if (dropdown) dropdown.style.display = 'none';
        return;
    }

    const matches = [];
    const matchingLessonIds = new Set();

    data.lessons.forEach(lesson => {
        const lessonId = lesson.id;
        const lessonTitle = lesson.title || '';
        const lessonTitleMatches = lessonTitle.toLowerCase().includes(q);
        let lessonHasMatch = lessonTitleMatches;

        let words = extractVocabWordsFromLesson(lesson);

        words.forEach(word => {
            const hanzi = word.hanzi || word.cn || '';
            const pinyin = word.pinyin || word.py || '';
            const meaning = word.meaning || word.vi || '';
            const wordType = word.word_type || '';
            const note = word.note || '';

            let matchedInExample = '';
            if (word.examples && Array.isArray(word.examples)) {
                word.examples.forEach(ex => {
                    const cnText = typeof ex === 'string' ? ex : (ex.cn || ex.hanzi || '');
                    const pyText = typeof ex === 'object' ? (ex.py || ex.pinyin || '') : '';
                    const viText = typeof ex === 'object' ? (ex.vi || ex.meaning || '') : '';
                    if (cnText.toLowerCase().includes(q) || pyText.toLowerCase().includes(q) || viText.toLowerCase().includes(q)) {
                        matchedInExample = cnText + (viText ? ` (${viText})` : '');
                    }
                });
            }

            if (
                lessonTitleMatches ||
                hanzi.toLowerCase().includes(q) ||
                pinyin.toLowerCase().includes(q) ||
                meaning.toLowerCase().includes(q) ||
                wordType.toLowerCase().includes(q) ||
                note.toLowerCase().includes(q) ||
                matchedInExample
            ) {
                lessonHasMatch = true;
                matches.push({
                    lessonId: lessonId,
                    lessonTitle: lessonTitle,
                    wordHanzi: hanzi,
                    wordPinyin: pinyin,
                    wordMeaning: meaning,
                    exampleMatch: matchedInExample
                });
            }
        });

        if (lessonHasMatch) {
            matchingLessonIds.add(lessonId);
        }
    });

    sidebarItems.forEach(item => {
        const itemLessonId = parseInt(item.dataset.lessonId, 10);
        const keepVisible = activeLessonId !== null && itemLessonId === activeLessonId;
        if (keepVisible || matchingLessonIds.has(itemLessonId)) {
            item.style.display = 'flex';
        } else {
            item.style.display = 'none';
        }
    });

    wordCards.forEach(card => {
        const hanzi = (card.dataset.hanzi || card.textContent || '').toLowerCase();
        const pinyin = (card.dataset.pinyin || card.textContent || '').toLowerCase();
        const meaning = (card.dataset.meaning || card.textContent || '').toLowerCase();
        const text = card.textContent.toLowerCase();

        if (text.includes(q) || hanzi.includes(q) || pinyin.includes(q) || meaning.includes(q)) {
            card.style.display = 'block';
        } else {
            card.style.display = 'none';
        }
    });

    if (dropdown) {
        if (matches.length === 0) {
            dropdown.innerHTML = `
                <div style="padding:16px;text-align:center;color:#888;font-size:13px;">
                    🔍 Không tìm thấy từ vựng phù hợp với "<strong>${escapeHtml(q)}</strong>"
                </div>
            `;
        } else {
            let html = `
                <div style="padding:8px 14px;font-size:11px;font-weight:700;color:#db2777;background:#fdf2f8;border-bottom:1px solid #fbcfe8;">
                    📚 TÌM THẤY ${matches.length} KẾT QUẢ TỪ VỰNG (${lvl.toUpperCase()})
                </div>
            `;
            matches.forEach(m => {
                html += `
                    <div class="local-search-item" data-lesson-id="${m.lessonId}" data-hanzi="${escapeQuotes(m.wordHanzi)}"
                         style="padding:10px 14px;border-bottom:1px solid #f1f5f9;cursor:pointer;transition:background 0.2s;">
                        <div style="display:flex;align-items:center;gap:8px;margin-bottom:2px;">
                            <span style="background:#ec4899;color:white;font-size:10px;font-weight:700;padding:2px 6px;border-radius:6px;">Bài ${m.lessonId}</span>
                            <span style="font-size:14px;font-weight:700;color:#1e293b;">${escapeHtml(m.wordHanzi)}</span>
                            <span style="font-size:12px;color:#db2777;font-weight:600;">${escapeHtml(m.wordPinyin)}</span>
                        </div>
                        <div style="font-size:12.5px;color:#475569;">${escapeHtml(m.wordMeaning)}</div>
                        ${m.exampleMatch ? `<div style="font-size:11.5px;color:#8b5cf6;margin-top:2px;">💬 ${escapeHtml(m.exampleMatch)}</div>` : ''}
                    </div>
                `;
            });
            dropdown.innerHTML = html;

            dropdown.querySelectorAll('.local-search-item').forEach(el => {
                el.onmouseenter = function() { this.style.background = '#fdf2f8'; };
                el.onmouseleave = function() { this.style.background = 'transparent'; };
                el.onclick = function() {
                    const lid = parseInt(this.dataset.lessonId, 10);
                    const hanzi = this.dataset.hanzi || '';
                    dropdown.style.display = 'none';

                    if (typeof window.showVocabLesson === 'function') {
                        window.showVocabLesson(lvl, lid, 'vocab');
                    }

                    focusVocabWordTarget(lvl, lid, hanzi, hanzi);
                };
            });
        }
        dropdown.style.display = 'block';
    }
};
        // ================================================================
// HELPER: SAFE CLOSEST (Phòng ngừa e.target không phải Element như Document/Window)
// ================================================================
function safeClosest(target, selector) {
    if (!target) return null;
    if (typeof target.closest === 'function') {
        return target.closest(selector);
    }
    if (target.parentElement && typeof target.parentElement.closest === 'function') {
        return target.parentElement.closest(selector);
    }
    return null;
}

// ================================================================
// XỬ LÝ CLICK TOOLTIP & HIGHLIGHT - DÙNG EVENT DELEGATION
// ================================================================
document.addEventListener('click', function(e) {
    const menu = document.getElementById('highlightMenu');
    
    // 1. XỬ LÝ CLICK HIGHLIGHT
    // XỬ LÝ CLICK HIGHLIGHT - ĐẶT MENU CẠNH HIGHLIGHT
const highlight = safeClosest(e.target, '.highlighted');
if (highlight) {
    e.stopPropagation();
    currentHighlightElement = highlight;
    const rect = highlight.getBoundingClientRect();
    const menu = document.getElementById('highlightMenu');
    if (menu) {
        let left = (rect.left + rect.width / 2) - 40;
        if (left < 10) left = 10;
        if (left + 90 > window.innerWidth) left = window.innerWidth - 100;
        let top = rect.bottom + 6;
        if (top + 45 > window.innerHeight) top = rect.top - 42;
        if (top < 10) top = 10;
        menu.style.left = left + 'px';
        menu.style.top = top + 'px';
        menu.style.display = 'flex';
        menu.style.zIndex = '100000';
    }
    return;
}
    
    // 2. XỬ LÝ CLICK TOOLTIP ITEM
    const tooltipItem = safeClosest(e.target, '.tooltip-item');
    if (tooltipItem) {
        const level = tooltipItem.dataset.level;
        const lessonId = tooltipItem.dataset.lesson;
        const tabId = tooltipItem.dataset.tab;
        
        if (level && lessonId && tabId) {
            e.stopPropagation();
            // Ẩn tooltip sau khi click
            const tooltip = safeClosest(tooltipItem, '.lesson-item-tooltip');
            if (tooltip) {
                tooltip.style.display = 'none';
            }
            // Chuyển đến bài học và tab
            goToTab(level, parseInt(lessonId), tabId);
        }
        return;
    }
    
    // 3. ẨN MENU HIGHLIGHT KHI CLICK RA NGOÀI
    if (menu && !menu.contains(e.target) && !safeClosest(e.target, '.highlighted')) {
        menu.style.display = 'none';
    }

    // 4. ẨN LOCAL SEARCH DROPDOWNS KHI CLICK RA NGOÀI
    const vocabDropdown = document.getElementById('vocabSearchDropdown');
    if (vocabDropdown && !safeClosest(e.target, '.vocab-local-search-input') && !vocabDropdown.contains(e.target)) {
        vocabDropdown.style.display = 'none';
    }
    const grammarDropdown = document.getElementById('grammarSearchDropdown');
    if (grammarDropdown && !safeClosest(e.target, '.grammar-local-search-input') && !grammarDropdown.contains(e.target)) {
        grammarDropdown.style.display = 'none';
    }
});

        // ================================================================
        // BACK HOME
        // ================================================================
        function backToHome() {
    const fs = getFeaturesSection();
    if (fs) {
        fs.style.display = 'block';
        fs.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
    const nav = getHskNavWrapper();
    if (nav) nav.classList.remove('show');
    const ca = getContentArea();
    if (ca) ca.classList.remove('show');
    // ✅ Reset về grammar khi về trang chủ
    currentModule = 'grammar';
    window.currentModule = 'grammar';
    currentLevel = 'hsk1';
    saveState('grammar', 'hsk1');
}

        // ================================================================
        // CATEGORY MENU ACCORDION TOGGLE
        // ================================================================
        window.toggleCategoryGroup = function(headerEl) {
            if (!headerEl) return;
            const group = headerEl.closest('.category-group');
            if (group) {
                group.classList.toggle('expanded');
            }
        };

        // ================================================================
        // EVENT LISTENERS
        // ================================================================
        document.querySelectorAll('.feature-card').forEach(card => {
            card.addEventListener('click', function() {
                const module = this.dataset.module;
                if (module === 'roadmap') {
                    if (typeof window.openPersonalProfileModal === 'function') {
                        window.openPersonalProfileModal();
                    }
                    return;
                }
                const level = document.querySelector('.hsk-item.active')?.dataset.level || 'hsk1';
                showContent(module, level);
            });
        });

     document.querySelectorAll('.hsk-item').forEach(item => {
    item.addEventListener('click', function() {
        const level = this.dataset.level;
        // Lấy module từ feature card đang active
        const activeFeature = document.querySelector('.feature-card.active');
        const module = activeFeature ? activeFeature.dataset.module : 'grammar';
        // Cập nhật currentModule
        currentModule = module;
        window.currentModule = module;
        showContent(module, level);
    });
});

        const btnBackHome = getBackHomeBtn();
        if (btnBackHome) btnBackHome.addEventListener('click', backToHome);

        // ================================================================
        // FIREBASE AUTH
        // ================================================================
        // window.loginWithGoogle initialized in auth script below

        // ================================================================
        // KHỞI TẠO
        // ================================================================
       document.addEventListener('DOMContentLoaded', function() {
    const fs = getFeaturesSection();
    if (fs) fs.style.display = 'block';
    const nav = getHskNavWrapper();
    if (nav) nav.classList.remove('show');
    const ca = getContentArea();
    if (ca) ca.classList.remove('show');
    
    // ✅ LOAD STATE TỪ LOCALSTORAGE
    const savedState = loadState();
    currentModule = savedState.module;
    window.currentModule = savedState.module;
    currentLevel = savedState.level;
    
    // Cập nhật UI
    document.querySelectorAll('.feature-card').forEach(el => el.classList.remove('active'));
    const activeCard = document.querySelector(`.feature-card[data-module="${savedState.module}"]`);
    if (activeCard) {
        activeCard.classList.add('active');
        const parentGroup = activeCard.closest('.category-group');
        if (parentGroup) parentGroup.classList.add('expanded');
    }
    
    document.querySelectorAll('.hsk-item').forEach(el => el.classList.remove('active'));
    const activeHsk = document.querySelector(`.hsk-item[data-level="${savedState.level}"]`);
    if (activeHsk) activeHsk.classList.add('active');
    
    setTimeout(() => {
        showContent(savedState.module, savedState.level);
    }, 300);
});
      
// ================================================================
// XỬ LÝ TOOLTIP - DÙNG MOUSEENTER/MOUSELEAVE - ĐÃ SỬA
// ================================================================
let currentTooltip = null;

document.addEventListener('mouseenter', function(e) {
    const lessonItem = safeClosest(e.target, '.lesson-item');
    if (!lessonItem) return;
    
    const tooltip = lessonItem.querySelector('.lesson-item-tooltip');
    if (!tooltip) return;
    document.querySelectorAll('.lesson-item-tooltip').forEach(t => {
        if (t !== tooltip) t.style.display = 'none';
    });
    currentTooltip = tooltip;
    
    // Khi hover vào lesson-item, hiển thị tooltip
    const rect = lessonItem.getBoundingClientRect();
    const tooltipWidth = 280;
    const spaceRight = window.innerWidth - rect.right;
    let left = rect.right + 8;
    let top = rect.top;
    
    if (spaceRight < tooltipWidth + 10) {
        left = rect.left - tooltipWidth - 8;
    }
    
    if (top + tooltip.offsetHeight > window.innerHeight) {
        top = window.innerHeight - tooltip.offsetHeight - 10;
    }
    if (top < 10) top = 10;
    
    tooltip.style.left = left + 'px';
    tooltip.style.top = top + 'px';
    tooltip.style.display = 'block';
}, true);

// ✅ KHÔNG ẨNNGAY KHI RỜI - CHỈ ẨNKHI HOVER VÀO LESSON-ITEM KHÁC
document.addEventListener('mouseleave', function(e) {
    const lessonItem = safeClosest(e.target, '.lesson-item');
    if (!lessonItem) return;
    
    const tooltip = lessonItem.querySelector('.lesson-item-tooltip');
    if (!tooltip) return;
    
    // Delay ẩn để cho phép hover vào tooltip
    setTimeout(() => {
        if (currentTooltip === tooltip) {
            tooltip.style.display = 'none';
            currentTooltip = null;
        }
    }, 100);
}, true);

// ✅ THÊM: Khi hover vào tooltip, giữ nó hiển thị
document.addEventListener('mouseenter', function(e) {
    const tooltip = safeClosest(e.target, '.lesson-item-tooltip');
    if (tooltip) {
        tooltip.style.display = 'block !important';
        clearTimeout(tooltip._hideTimeout);
    }
}, true);

document.addEventListener('mouseleave', function(e) {
    const tooltip = safeClosest(e.target, '.lesson-item-tooltip');
    if (tooltip) {
        tooltip._hideTimeout = setTimeout(() => {
            tooltip.style.display = 'none';
        }, 100);
    }
}, true);

// ================================================================
// (1) & (2) LUYỆN DỊCH MODULE WITH SUGGESTED VOCABULARY AND RED/GREEN FEEDBACK
// ================================================================
window.translationDataByLevel = {
    hsk1: [
        {
            chinese: '你好，请问你叫什么名字？',
            pinyin: 'Nǐ hǎo, qǐng wèn nǐ jiào shén me míng zi?',
            vietnamese: 'Xin chào, xin hỏi bạn tên là gì?',
            hints: [
                { cn: '请问', py: 'qǐngwèn', vi: 'xin hỏi' },
                { cn: '叫', py: 'jiào', vi: 'tên là, gọi là' },
                { cn: '名字', py: 'míngzi', vi: 'tên' }
            ]
        },
        {
            chinese: '我是留学生，我在中国学习汉语。',
            pinyin: 'Wǒ shì liúxuéshēng, wǒ zài Zhōngguó xuéxí Hànyǔ.',
            vietnamese: 'Tôi là du học sinh, tôi học tiếng Trung ở Trung Quốc.',
            hints: [
                { cn: '留学生', py: 'liúxuéshēng', vi: 'du học sinh' },
                { cn: '学习', py: 'xuéxí', vi: 'học tập' },
                { cn: '汉语', py: 'Hànyǔ', vi: 'tiếng Trung' }
            ]
        },
        {
            chinese: '今天天气很好，我们去商店买东西吧。',
            pinyin: 'Jīntiān tiānqì hěn hǎo, wǒmen qù shāngdiàn mǎi dōngxi ba.',
            vietnamese: 'Hôm nay thời tiết rất tốt, chúng ta đi cửa hàng mua đồ đi.',
            hints: [
                { cn: '天气', py: 'tiānqì', vi: 'thời tiết' },
                { cn: '商店', py: 'shāngdiàn', vi: 'cửa hàng' },
                { cn: '买东西', py: 'mǎi dōngxi', vi: 'mua đồ' }
            ]
        },
        {
            chinese: '你想喝茶还是喝咖啡？',
            pinyin: 'Nǐ xiǎng hē chá háishì hē kāfēi?',
            vietnamese: 'Bạn muốn uống trà hay là uống cà phê?',
            hints: [
                { cn: '想', py: 'xiǎng', vi: 'muốn, nghĩ' },
                { cn: '还是', py: 'háishì', vi: 'hay là' },
                { cn: '咖啡', py: 'kāfēi', vi: 'cà phê' }
            ]
        }
    ],
    hsk2: [
        {
            chinese: '虽然外面在下雨，但是他还是去跑步了。',
            pinyin: 'Suīrán wàimiàn zài xià yǔ, dànshì tā háishì qù pǎobù le.',
            vietnamese: 'Tuy bên ngoài đang mưa, nhưng anh ấy vẫn đi chạy bộ.',
            hints: [
                { cn: '虽然...但是...', py: 'suīrán...dànshì...', vi: 'tuy... nhưng...' },
                { cn: '下雨', py: 'xià yǔ', vi: 'mưa' },
                { cn: '跑步', py: 'pǎobù', vi: 'chạy bộ' }
            ]
        },
        {
            chinese: '我的手机不见了，你能帮我找找吗？',
            pinyin: 'Wǒ de shǒujī bù jiàn le, nǐ néng bāng wǒ zhǎozhao ma?',
            vietnamese: 'Điện thoại của tôi mất rồi, bạn có thể giúp tôi tìm một chút không?',
            hints: [
                { cn: '不见了', py: 'bù jiàn le', vi: 'mất rồi, không thấy nữa' },
                { cn: '帮', py: 'bāng', vi: 'giúp đỡ' },
                { cn: '找', py: 'zhǎo', vi: 'tìm' }
            ]
        },
        {
            chinese: '离这里不远有一个很大的图书馆。',
            pinyin: 'Lí zhèlǐ bù yuǎn yǒu yígè hěn dà de túshūguǎn.',
            vietnamese: 'Cách đây không xa có một thư viện rất lớn.',
            hints: [
                { cn: '离', py: 'lí', vi: 'cách (khoảng cách)' },
                { cn: '远', py: 'yuǎn', vi: 'xa' },
                { cn: '图书馆', py: 'túshūguǎn', vi: 'thư viện' }
            ]
        }
    ],
    hsk3: [
        {
            chinese: '为了提高汉语水平，我每天坚持听半个小时新闻。',
            pinyin: 'Wèile tígāo Hànyǔ shuǐpíng, wǒ měitiān jiānchí tīng bàn gè xiǎoshí xīnwén.',
            vietnamese: 'Để nâng cao trình độ tiếng Trung, tôi kiên trì nghe tin tức nửa tiếng mỗi ngày.',
            hints: [
                { cn: '为了', py: 'wèile', vi: 'để, nhằm mục đích' },
                { cn: '提高', py: 'tígāo', vi: 'nâng cao' },
                { cn: '坚持', py: 'jiānchí', vi: 'kiên trì' },
                { cn: '新闻', py: 'xīnwén', vi: 'tin tức' }
            ]
        },
        {
            chinese: '如果不及时解决这个问题，后果可能会非常严重。',
            pinyin: 'Rúguǒ bù jíshí jiějué zhè gè wèntí, hòuguǒ kěnéng huì fēicháng yánzhòng.',
            vietnamese: 'Nếu không giải quyết vấn đề này kịp thời, hậu quả có thể sẽ vô cùng nghiêm trọng.',
            hints: [
                { cn: '及时', py: 'jíshí', vi: 'kịp thời' },
                { cn: '解决', py: 'jiějué', vi: 'giải quyết' },
                { cn: '后果', py: 'hòuguǒ', vi: 'hậu quả' },
                { cn: '严重', py: 'yánzhòng', vi: 'nghiêm trọng' }
            ]
        }
    ],
    hsk4: [
        {
            chinese: '成功往往属于那些有准备并且不轻言放弃的人。',
            pinyin: 'Chénggōng wǎngwǎng shǔyú nàxiē yǒu zhǔnbèi bìngqiě bù qīngyán fàngqì de rén.',
            vietnamese: 'Thành công thường thuộc về những người có chuẩn bị và không dễ dàng từ bỏ.',
            hints: [
                { cn: '往往', py: 'wǎngwǎng', vi: 'thường hay' },
                { cn: '属于', py: 'shǔyú', vi: 'thuộc về' },
                { cn: '并且', py: 'bìngqiě', vi: 'và, đồng thời' },
                { cn: '放弃', py: 'fàngqì', vi: 'từ bỏ' }
            ]
        }
    ],
    hsk5: [
        {
            chinese: '随着经济的快速发展，人们的生活方式发生了巨大的变化。',
            pinyin: 'Suízhe jīngjì de kuàisù fāzhǎn, rénmen de shēnghuó fāngshì fāshēng le jùdà de biànhuà.',
            vietnamese: 'Cùng với sự phát triển nhanh chóng của kinh tế, lối sống của con người đã có những thay đổi to lớn.',
            hints: [
                { cn: '随着', py: 'suízhe', vi: 'cùng với, theo sự' },
                { cn: '快速', py: 'kuàisù', vi: 'nhanh chóng' },
                { cn: '方式', py: 'fāngshì', vi: 'phương thức, lối' },
                { cn: '巨大', py: 'jùdà', vi: 'to lớn, vĩ đại' }
            ]
        }
    ],
    hsk6: [
        {
            chinese: '在化解矛盾的过程中，沟通与理解起到了至关重要的作用。',
            pinyin: 'Zài huàjiě máodùn de guòchéng zhōng, gōutōng yǔ lǐjiě qǐdào le zhìguān zhòngyào de zuòyòng.',
            vietnamese: 'Trong quá trình hóa giải mâu thuẫn, giao tiếp và sự thấu hiểu đóng vai trò cực kỳ quan trọng.',
            hints: [
                { cn: '化解', py: 'huàjiě', vi: 'hóa giải' },
                { cn: '矛盾', py: 'máodùn', vi: 'mâu thuẫn' },
                { cn: '沟通', py: 'gōutōng', vi: 'giao tiếp, kết nối' },
                { cn: '至关重要', py: 'zhìguān zhòngyào', vi: 'cực kỳ quan trọng' }
            ]
        }
    ]
};

window.revealTranslationHint = function(lvl, idx) {
    const box = document.getElementById(`hints-box-${lvl}-${idx}`);
    const btn = document.getElementById(`hint-btn-${lvl}-${idx}`);
    if (!box || !btn) return;

    let current = parseInt(box.getAttribute('data-revealed') || '0', 10);
    const data = window.translationDataByLevel ? window.translationDataByLevel[lvl] : null;
    let hints = (data && data[idx]) ? (data[idx].hints || []) : [];
    if (!hints || hints.length === 0) {
        const item = data ? data[idx] : null;
        if (item) {
            hints = window.generateAutoHints(item.chinese, item.pinyin, item.vietnamese);
            item.hints = hints;
        }
    }

    const max = Math.min(3, hints.length);

    if (current < max) {
        current++;
        box.setAttribute('data-revealed', current);

        if (current === 1) {
            box.innerHTML = '';
        }

        const h = hints[current - 1];
        const badgeText = typeof h === 'object' ? `${h.cn || h.word || ''}${h.py ? ' (' + h.py + ')' : ''}: ${h.vi || h.meaning || ''}` : h;

        const badge = document.createElement('span');
        badge.style.cssText = 'background:#fdf2f8;color:#be185d;border:1px solid #fbcfe8;padding:3px 8px;border-radius:6px;font-weight:600;font-size:12px;animation:fadeIn 0.2s;';
        badge.textContent = badgeText;
        box.appendChild(badge);

        if (current < max) {
            btn.textContent = `💡 Hiển thị gợi ý từ vựng (${current}/${max})`;
        } else {
            btn.textContent = `💡 Hiển thị gợi ý từ vựng (${current}/${max} - Đã hết)`;
            btn.style.opacity = '0.7';
            btn.disabled = true;
        }
    }
};

// --- MODULE PHÁT ÂM (PRONUNCIATION) - CẤU TRÚC THEO VỠ LÒNG, CƠ BẢN, TRUNG CẤP, NÂNG CAO ---
window.playPronunciationAudio = function(category, soundKey) {
    if (!soundKey) return;
    let rawPath = '';
    const key = soundKey.trim();

    if (category === 'thanh_mau' || category === 'consonant') {
        rawPath = `/audio/thanh mẫu/${key}.mp3`;
    } else if (category === 'van_mau' || category === 'vowel') {
        if (key === 'a') {
            rawPath = `/audio/vận mẫu/a.m4a`;
        } else {
            rawPath = `/audio/vận mẫu/${key}.mp3`;
        }
    } else if (category === 'thanh_dieu' || category === 'tone') {
        rawPath = `/audio/thanh điệu/${key}.mp3`;
    }

    if (rawPath) {
        if (window.currentAudioPlayer) {
            try { window.currentAudioPlayer.pause(); } catch(e){}
            window.currentAudioPlayer = null;
        }
        const encodedUrl = encodeURI(rawPath);
        const audio = new Audio(encodedUrl);
        window.currentAudioPlayer = audio;
        audio.play().catch(err => {
            console.warn(`Local audio play failed for ${encodedUrl}, falling back to TTS:`, err);
            if (typeof playAudio === 'function') playAudio(key);
        });
    } else {
        if (typeof playAudio === 'function') playAudio(key);
    }
};

window.renderPronunciationModule = function(level, data) {
    const ci = getContentInner();
    if (!ci) return;

    let activePronLevel = window.currentPronLevel || 'volong';

    let html = `
        <div style="background:white;border-radius:24px;padding:28px;box-shadow:0 10px 30px rgba(0,0,0,0.05);border:1px solid #e9d5ff;">
            <!-- DANH MỤC CẤP ĐỘ PHÁT ÂM (PHÂN THEO CẤP ĐỘ TRÌNH ĐỘ LỘ TRÌNH) -->
            <div style="display:flex;gap:10px;justify-content:center;flex-wrap:wrap;margin-bottom:24px;">
                <button onclick="window.switchPronLevel('volong')" id="pronLvlBtn-volong" style="padding:10px 20px;border-radius:14px;border:none;background:${activePronLevel === 'volong' ? '#7e22ce' : '#f3e8ff'};color:${activePronLevel === 'volong' ? 'white' : '#6b21a8'};font-weight:700;font-size:14px;cursor:pointer;box-shadow:${activePronLevel === 'volong' ? '0 4px 12px rgba(126,34,206,0.3)' : 'none'};">🌱 Vỡ Lòng</button>
                <button onclick="window.switchPronLevel('coban')" id="pronLvlBtn-coban" style="padding:10px 20px;border-radius:14px;border:none;background:${activePronLevel === 'coban' ? '#7e22ce' : '#f3e8ff'};color:${activePronLevel === 'coban' ? 'white' : '#6b21a8'};font-weight:700;font-size:14px;cursor:pointer;box-shadow:${activePronLevel === 'coban' ? '0 4px 12px rgba(126,34,206,0.3)' : 'none'};">📘 Cơ Bản</button>
                <button onclick="window.switchPronLevel('trungcap')" id="pronLvlBtn-trungcap" style="padding:10px 20px;border-radius:14px;border:none;background:${activePronLevel === 'trungcap' ? '#7e22ce' : '#f3e8ff'};color:${activePronLevel === 'trungcap' ? 'white' : '#6b21a8'};font-weight:700;font-size:14px;cursor:pointer;box-shadow:${activePronLevel === 'trungcap' ? '0 4px 12px rgba(126,34,206,0.3)' : 'none'};">📙 Trung Cấp</button>
                <button onclick="window.switchPronLevel('nangcao')" id="pronLvlBtn-nangcao" style="padding:10px 20px;border-radius:14px;border:none;background:${activePronLevel === 'nangcao' ? '#7e22ce' : '#f3e8ff'};color:${activePronLevel === 'nangcao' ? 'white' : '#6b21a8'};font-weight:700;font-size:14px;cursor:pointer;box-shadow:${activePronLevel === 'nangcao' ? '0 4px 12px rgba(126,34,206,0.3)' : 'none'};">📕 Nâng Cao</button>
            </div>

            <div id="pronLevelContentContainer"></div>
        </div>
    `;

    ci.innerHTML = html;
    window.switchPronLevel(activePronLevel);
};

window.switchPronLevel = function(level) {
    window.currentPronLevel = level;
    
    ['volong', 'coban', 'trungcap', 'nangcao'].forEach(l => {
        const btn = document.getElementById('pronLvlBtn-' + l);
        if (btn) {
            if (l === level) {
                btn.style.background = '#7e22ce';
                btn.style.color = 'white';
                btn.style.boxShadow = '0 4px 12px rgba(126,34,206,0.3)';
            } else {
                btn.style.background = '#f3e8ff';
                btn.style.color = '#6b21a8';
                btn.style.boxShadow = 'none';
            }
        }
    });

    const container = document.getElementById('pronLevelContentContainer');
    if (!container) return;

    if (level === 'volong') {
        container.innerHTML = `
            <div style="display:flex;gap:8px;justify-content:center;flex-wrap:wrap;margin-bottom:20px;background:#faf5ff;padding:12px;border-radius:16px;border:1px solid #e9d5ff;">
                <button onclick="window.switchPronTab('consonants')" id="pronTab-consonants" style="padding:8px 16px;border-radius:12px;border:none;background:#7e22ce;color:white;font-weight:700;font-size:13px;cursor:pointer;">🗣️ Thanh Mẫu</button>
                <button onclick="window.switchPronTab('vowels')" id="pronTab-vowels" style="padding:8px 16px;border-radius:12px;border:none;background:#f3e8ff;color:#6b21a8;font-weight:700;font-size:13px;cursor:pointer;">🎵 Vận Mẫu</button>
                <button onclick="window.switchPronTab('tones')" id="pronTab-tones" style="padding:8px 16px;border-radius:12px;border:none;background:#f3e8ff;color:#6b21a8;font-weight:700;font-size:13px;cursor:pointer;">📈 Thanh Điệu</button>
                <button onclick="window.switchPronTab('rules')" id="pronTab-rules" style="padding:8px 16px;border-radius:12px;border:none;background:#f3e8ff;color:#6b21a8;font-weight:700;font-size:13px;cursor:pointer;">💡 Biến Điệu</button>
            </div>
            <div id="pronTabContentContainer"></div>
        `;
        window.switchPronTab('consonants');
    } else if (level === 'coban') {
        container.innerHTML = `
            <div style="background:#faf5ff;border:1px solid #e9d5ff;border-radius:18px;padding:24px;margin-bottom:20px;">
                <h3 style="font-size:18px;font-weight:800;color:#581c87;margin:0 0 8px 0;">📘 CƠ BẢN: LUYỆN ĐỌC MẪU CÂU NGẮN</h3>
                <div style="display:flex;flex-direction:column;gap:16px;">
                    ${[
                        { id: 1, cn: '你好！很高兴认识你。', py: 'Nǐ hǎo! Hěn gāoxìng rènshí nǐ.', vi: 'Xin chào! Rất vui được quen biết bạn.', note: 'Chú ý biến điệu 2 thanh 3: Nǐ hǎo ➔ Ní hǎo' },
                        { id: 2, cn: '请问，这本词典多少钱？', py: 'Qǐngwèn, zhè běn cídiǎn duōshao qián?', vi: 'Xin hỏi, cuốn từ điển này bao nhiêu tiền?', note: 'Hỏi giá tiền giao tiếp cơ bản' },
                        { id: 3, cn: '今天天气真好，我们去散步吧。', py: 'Jīntiān tiānqì zhēn hǎo, wǒmen qù sànbù ba.', vi: 'Hôm nay thời tiết thật đẹp, chúng ta đi dạo nhé.', note: 'Cụm từ 散步 (sànbù) hạ giọng thanh 4 dứt khoát' },
                        { id: 4, cn: '你什么时候去中国旅游？', py: 'Nǐ shénme shíhou qù Zhōngguó lǚyóu?', vi: 'Khi nào bạn đi du lịch Trung Quốc?', note: 'Chú ý phát âm tròn môi từ 旅游 (lǚyóu)' },
                        { id: 5, cn: '没关系，我们 salaried都是好朋友。', py: 'Méi guānxi, wǒmen dōu shì hǎo péngyou.', vi: 'Không sao đâu, chúng ta đều là bạn tốt.', note: 'Phát âm thanh nhẹ ở 关系 (guānxi) và 朋友 (péngyou)' }
                    ].map(item => `
                        <div style="background:white;border:1px solid #e9d5ff;border-radius:14px;padding:18px;box-shadow:0 2px 8px rgba(0,0,0,0.02);">
                            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;">
                                <span style="background:#7e22ce;color:white;font-size:11px;font-weight:800;padding:2px 8px;border-radius:6px;">MẪU CÂU ${item.id}</span>
                                <button onclick="playAudio('${item.cn.replace(/'/g, "\\'")}')" style="padding:6px 14px;background:#f3e8ff;border:none;color:#6b21a8;border-radius:10px;font-weight:700;font-size:12.5px;cursor:pointer;">🔊 Nghe & Luyện đọc</button>
                            </div>
                            <div style="font-size:22px;font-weight:800;color:#1e293b;margin-bottom:4px;font-family:'Kaiti','SimSun',serif,sans-serif;">${item.cn}</div>
                            <div style="font-size:14px;color:#7e22ce;font-weight:600;margin-bottom:6px;">${item.py}</div>
                            <div style="font-size:13.5px;color:#334155;margin-bottom:6px;">💡 Nghĩa: <b>${item.vi}</b></div>
                            <div style="font-size:11.5px;color:#6b21a8;background:#faf5ff;padding:4px 10px;border-radius:8px;display:inline-block;">📌 Mẹo phát âm: ${item.note}</div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    } else if (level === 'trungcap') {
        container.innerHTML = `
            <div style="background:#faf5ff;border:1px solid #e9d5ff;border-radius:18px;padding:24px;margin-bottom:20px;">
                <h3 style="font-size:18px;font-weight:800;color:#581c87;margin:0 0 8px 0;">📙 TRUNG CẤP: LUYỆN ĐỌC ĐOẠN VĂN</h3>
                <p style="font-size:13.5px;color:#6b21a8;margin:0 0 18px 0;">Luyện tập đọc trôi chảy các đoạn văn ngắn, rèn luyện nhịp điệu, ngắt câu và trọng âm tự nhiên.</p>
                
                <div style="display:flex;flex-direction:column;gap:20px;">
                    ${[
                        {
                            id: 'tc-1',
                            title: 'Đoạn văn 1: Giới thiệu bản thân (自我介绍)',
                            cn: '大家好！我叫王明，今年二十二岁，是大学三年级的学生。我的专业是汉语和国际贸易。我非常喜欢中国文化，特别是中国茶和京剧。',
                            py: 'Dàjiā hǎo! Wǒ jiào Wáng Míng, jīnnián èrshí’èr suì, shì dàxué sān niánjí de xuésheng. Wǒ de zhuānyè shì Hànyǔ hé guójì màoyì. Wǒ fēicháng xǐhuan Zhōngguó wénhuà, tèbié shì Zhōngguó chá hé Jīngjù.',
                            vi: 'Chào mọi người! Tôi tên là Vương Minh, năm nay 22 tuổi, là sinh viên năm 3 đại học. Chuyên ngành của tôi là Tiếng Trung và Thương mại quốc tế. Tôi rất thích văn hóa Trung Quốc, đặc biệt là trà Trung Quốc và Kinh kịch.'
                        },
                        {
                            id: 'tc-2',
                            title: 'Đoạn văn 2: Cuộc sống hàng ngày (我的日常生活)',
                            cn: '我每天早上七点起床，吃完早餐后骑自行车去学校。下午没有课的时候，我喜欢在图书馆看书或者和朋友一起去打羽毛球。',
                            py: 'Wǒ měitiān zǎoshang qī diǎn qǐchuáng, chī wán zǎocān hòu qí zìxíngchē qù xuéxiào. Xiàwǔ méiyǒu kè de shíhou, wǒ xǐhuan zài túshūguǎn kàn shū huòzhě hé péngyou yìqǐ qù dǎ yǔmáoqiú.',
                            vi: 'Mỗi ngày tôi thức dậy lúc 7 giờ sáng, ăn xong bữa sáng rồi đạp xe đến trường. Buổi chiều khi không có giờ học, tôi thích đọc sách ở thư viện hoặc cùng bạn bè đi đánh cầu lông.'
                        }
                    ].map(p => `
                        <div style="background:white;border:1px solid #e9d5ff;border-radius:16px;padding:20px;box-shadow:0 2px 10px rgba(0,0,0,0.02);">
                            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;border-bottom:1px dashed #e9d5ff;padding-bottom:10px;">
                                <h4 style="font-size:16px;font-weight:800;color:#581c87;margin:0;">${p.title}</h4>
                                <button onclick="playAudio('${p.cn.replace(/'/g, "\\'")}')" style="padding:6px 14px;background:#7e22ce;color:white;border:none;border-radius:10px;font-weight:700;font-size:12.5px;cursor:pointer;box-shadow:0 2px 8px rgba(126,34,206,0.25);">🔊 Nghe toàn đoạn</button>
                            </div>
                            <div style="font-size:18px;font-weight:700;color:#1e293b;line-height:1.7;margin-bottom:12px;font-family:'Kaiti','SimSun',serif,sans-serif;">${p.cn}</div>
                            
                            <div style="margin-bottom:10px;">
                                <button onclick="const el=document.getElementById('py-${p.id}'); el.style.display = el.style.display==='none' ? 'block' : 'none';" style="padding:4px 10px;background:#f3e8ff;border:none;color:#6b21a8;border-radius:8px;font-size:12px;font-weight:700;cursor:pointer;margin-right:8px;">🔤 Ẩn/Hiện Pinyin</button>
                                <button onclick="const el=document.getElementById('vi-${p.id}'); el.style.display = el.style.display==='none' ? 'block' : 'none';" style="padding:4px 10px;background:#f3e8ff;border:none;color:#6b21a8;border-radius:8px;font-size:12px;font-weight:700;cursor:pointer;">🌐 Ẩn/Hiện Dịch Việt</button>
                            </div>

                            <div id="py-${p.id}" style="font-size:13.5px;color:#7e22ce;line-height:1.6;margin-bottom:8px;background:#faf5ff;padding:10px;border-radius:10px;">
                                <b>Pinyin:</b> ${p.py}
                            </div>
                            <div id="vi-${p.id}" style="font-size:13.5px;color:#334155;line-height:1.6;background:#f8fafc;padding:10px;border-radius:10px;">
                                <b>Dịch nghĩa:</b> ${p.vi}
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    } else if (level === 'nangcao') {
        container.innerHTML = `
            <div style="background:#faf5ff;border:1px solid #e9d5ff;border-radius:18px;padding:24px;margin-bottom:20px;">
                <h3 style="font-size:18px;font-weight:800;color:#581c87;margin:0 0 8px 0;">📕 NÂNG CAO: LUYỆN ĐỌC ĐOẠN VĂN DÀI</h3>
                <p style="font-size:13.5px;color:#6b21a8;margin:0 0 18px 0;">Luyện đọc diễn cảm các bài văn dài, chú trọng ngữ điệu cảm xúc, phản xạ phát âm trôi chảy và tốc độ đọc tự nhiên.</p>
                
                <div style="display:flex;flex-direction:column;gap:20px;">
                    ${[
                        {
                            id: 'nc-1',
                            title: 'Bài văn dài 1: Mùa xuân và sức sống mới (春天的故事)',
                            cn: '春天是四季中最美好的季节。当温暖的春风吹过大地，冰雪开始融化，树木抽出了新的绿芽，各种各样的鲜花竞争相开放。小鸟在树枝上欢快地歌唱，人们也纷纷走出家门，去郊外踏青游玩。春天不仅带来了温暖与美丽，更赋予了 people 无限的希望与力量。',
                            py: 'Chūntiān shì sìjì zhōng zuì měihǎo de jìjié. Dāng wēnnuǎn de chūnfēng chuīguò dàdì, bīngxuě kāishǐ rónghuà, shùmù chōuchū le xīn de lǜyá, gèzhǒng gèyàng de xiānhuā jìngxiāng kāifàng. Xiǎoniǎo zài shùzhī shàng huānkuài de gēchàng, rénmen yě fēnfēn zǒuchū jiāmén, qù jiāowài tàqīng yóuwán. Chūntiān bùjǐn dàilái le wēnnuǎn yǔ měilì, gèng fùyǔ le rénmen wúxiàn de xīwàng yǔ lìliang.',
                            vi: 'Mùa xuân là mùa đẹp nhất trong bốn mùa. Khi làn gió xuân ấm áp thổi qua mặt đất, băng tuyết bắt đầu tan chảy, cây cối nhú ra những chồi non xanh tươi, đủ loại hoa tươi thi nhau nở rộ. Những chú chim nhỏ hót ca vui vẻ trên cành cây, mọi người cũng nô nức bước ra khỏi nhà đi du xuân ở ngoại thành. Mùa xuân không chỉ mang lại sự ấm áp và vẻ đẹp, mà còn ban tặng cho con người hy vọng và sức mạnh vô hạn.'
                        },
                        {
                            id: 'nc-2',
                            title: 'Bài văn dài 2: Công nghệ và cuộc sống hiện đại (科技与现代生活)',
                            cn: '随着科技快速发展，互联网和智能手机已经深入到 slowly 我们生活的方方面面。如今，人们不出家门就能在网上购物、学习、工作甚至看医生。科技不仅极大地提高了 our 生活效率，也拉近了人与人之间的距离。然而，在享受科技便利的同时， we 也应该注意保持健康的生活方式，多陪伴家人与朋友。',
                            py: 'Suízi kējì kuàisù fāzhǎn, hùliánwǎng hé zhìnéng shǒujī yǐjīng shēnrù dào wǒmen shēnghuó de fāngfāngmiàn. Rújīn, rénmen bù chū jiāmén jiù néng zài wǎngshàng gòuwù, xuéxí, gōngzuò shènzhì kàn yīshēng. Kējì bùjǐn jídà de tígāo le wǒmen de shēnghuó xiàolǜ, yě lājìn le rén zhījiān de jùlí. Rán’ér, zài xiǎngshòu kējì biànlì de tóngshí, wǒmen yě yīnggāi zhùyì bǎochí jiànkāng de shēnghuó fāngshì, duō péibàn jiārén yǔ péngyou.',
                            vi: 'Cùng với sự phát triển nhanh chóng của công nghệ, internet và điện thoại thông minh đã đi sâu vào mọi mặt trong cuộc sống của chúng ta. Ngày nay, mọi người không cần ra khỏi nhà cũng có thể mua sắm, học tập, làm việc và thậm chí khám bệnh trên mạng. Công nghệ không chỉ nâng cao hiệu suất cuộc sống mà còn thu hẹp khoảng cách giữa con người với nhau.'
                        }
                    ].map(p => `
                        <div style="background:white;border:1px solid #e9d5ff;border-radius:16px;padding:22px;box-shadow:0 2px 10px rgba(0,0,0,0.02);">
                            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;border-bottom:1px dashed #e9d5ff;padding-bottom:10px;">
                                <h4 style="font-size:16.5px;font-weight:800;color:#581c87;margin:0;">${p.title}</h4>
                                <button onclick="playAudio('${p.cn.replace(/'/g, "\\'")}')" style="padding:6px 14px;background:#7e22ce;color:white;border:none;border-radius:10px;font-weight:700;font-size:12.5px;cursor:pointer;box-shadow:0 2px 8px rgba(126,34,206,0.25);">🔊 Nghe đọc diễn cảm</button>
                            </div>
                            <div style="font-size:18px;font-weight:700;color:#1e293b;line-height:1.8;margin-bottom:14px;font-family:'Kaiti','SimSun',serif,sans-serif;">${p.cn}</div>
                            
                            <div style="margin-bottom:10px;">
                                <button onclick="const el=document.getElementById('py-${p.id}'); el.style.display = el.style.display==='none' ? 'block' : 'none';" style="padding:4px 10px;background:#f3e8ff;border:none;color:#6b21a8;border-radius:8px;font-size:12px;font-weight:700;cursor:pointer;margin-right:8px;">🔤 Ẩn/Hiện Pinyin</button>
                                <button onclick="const el=document.getElementById('vi-${p.id}'); el.style.display = el.style.display==='none' ? 'block' : 'none';" style="padding:4px 10px;background:#f3e8ff;border:none;color:#6b21a8;border-radius:8px;font-size:12px;font-weight:700;cursor:pointer;">🌐 Ẩn/Hiện Dịch Việt</button>
                            </div>

                            <div id="py-${p.id}" style="font-size:13.5px;color:#7e22ce;line-height:1.6;margin-bottom:8px;background:#faf5ff;padding:12px;border-radius:10px;">
                                <b>Pinyin:</b> ${p.py}
                            </div>
                            <div id="vi-${p.id}" style="font-size:13.5px;color:#334155;line-height:1.6;background:#f8fafc;padding:12px;border-radius:10px;">
                                <b>Dịch nghĩa:</b> ${p.vi}
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    }
};

window.switchPronTab = function(tab) {
    document.querySelectorAll('[id^="pronTab-"]').forEach(btn => {
        btn.style.background = '#f3e8ff';
        btn.style.color = '#6b21a8';
        btn.style.boxShadow = 'none';
    });
    const activeBtn = document.getElementById('pronTab-' + tab);
    if (activeBtn) {
        activeBtn.style.background = '#7e22ce';
        activeBtn.style.color = 'white';
        activeBtn.style.boxShadow = '0 4px 12px rgba(126,34,206,0.3)';
    }

    const container = document.getElementById('pronTabContentContainer');
    if (!container) return;

    if (tab === 'consonants') {
        const consonants = [
            { py: 'b', vi: 'Giống "p" tiếng Việt (pua)'},
            { py: 'p', vi: 'Âm "p" bật hơi mạnh (pua)'},
            { py: 'm', vi: 'Giống "m" tiếng Việt (mua)'},
            { py: 'f', vi: 'Giống "ph" tiếng Việt (fua)'},
            { py: 'd', vi: 'Giống "t" tiếng Việt (de)'},
            { py: 't', vi: 'Giống "th" bật hơi (te)'},
            { py: 'n', vi: 'Giống "n" tiếng Việt (ne)'},
            { py: 'l', vi: 'Giống "l" tiếng Việt (le)'},
            { py: 'g', vi: 'Giống "c" tiếng Việt (ge)'},
            { py: 'k', vi: 'Giống "kh" tiếng Việt kèm bật hơi/ khàn cổ họng (ke)'},
            { py: 'h', vi: 'Đọc giữa "h" và "kh" (he)'},
            { py: 'j', vi: 'Giống "ch" tiếng Việt (ji)'},
            { py: 'q', vi: 'Giống "ch" tiếng Việt kèm bật hơi mạnh (qi)'},
            { py: 'x', vi: 'Giống "x" tiếng Việt (xi)'},
            { py: 'zh', vi: 'Giống "tr" tiếng Việt (uốn lưỡi) (zhi)'},
            { py: 'ch', vi: 'Giống "tr" tiếng Việt (uốn lưỡi) kèm bật hơi (chi)'},
            { py: 'sh', vi: 'Giống "sh" tiếng Anh (uốn lưỡi) (shi)'},
            { py: 'r', vi: 'Giống "r" tiếng Việt (uốn lưỡi) (ri)'},
            { py: 'z', vi: 'Đặt lưỡi ở giữa 2 hàm răng, rút nhẹ lưỡi về và phát âm "ch" (lưu ý giữ thẳng lưỡi) (zi)'},
            { py: 'c', vi: 'Đặt lưỡi ở giữa 2 hàm răng, rút nhẹ lưỡi về và phát âm "ch" kèm bật hơi (lưu ý giữ thẳng lưỡi) (ci)'},
            { py: 's', vi: 'Giống "s" tiếng Việt (si)'}
        ];
        let html = `
            <div style="font-size:15px;font-weight:700;color:#581c87;margin-bottom:14px;">🗣️ BẢNG THANH MẪU</div>
            <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:14px;">
        `;
        consonants.forEach(c => {
            html += `
                <div onclick="window.playPronunciationAudio('thanh_mau', '${c.py}')" style="background:#faf5ff;border:1px solid #e9d5ff;border-radius:14px;padding:16px;text-align:center;cursor:pointer;transition:all 0.2s;" onmouseover="this.style.transform='translateY(-2px)'" onmouseout="this.style.transform='none'">
                    <div style="font-size:28px;font-weight:800;color:#7e22ce;">${c.py}</div>
                    <div style="font-size:12px;color:#6b21a8;font-weight:600;margin:4px 0;">${c.vi}</div>
                    <div style="font-size:12px;color:#a855f7;margin-top:8px;font-weight:700;">🔊 Nghe</div>
                </div>
            `;
        });
        html += `</div>`;
        container.innerHTML = html;
    } else if (tab === 'vowels') {
        const singleVowels = [
            { py: 'a', vi: 'Đọc giống "a" (miệng mở to)'},
            { py: 'o', vi: 'Đọc giống "ô/ô-ua" (môi tròn)'},
            { py: 'e', vi: 'Đọc giống "ơ" hoặc "ưa"'},
            { py: 'i', vi: 'Đọc giống "i"'},
            { py: 'u', vi: 'Đọc giống "u"'},
            { py: 'ü', vi: 'Đọc giữa "u" và "i" (tròn môi)'},
            { py: 'er', vi: 'Vận mẫu uốn lưỡi "ơ-r"'}
        ];
        const compoundVowels  = [
                    { py: 'ai', vi: 'Đọc giống "ai" tiếng Việt'},
                    { py: 'ei', vi: 'Đọc giống "ây" tiếng Việt'},
                    { py: 'ao', vi: 'Đọc giống "ao" tiếng Việt'},
                    { py: 'ou', vi: 'Đọc giống "âu" tiếng Việt'},
                    { py: 'an', vi: 'Đọc giống "an" tiếng Việt'},
                    { py: 'en', vi: 'Đọc giống "ân" tiếng Việt'},
                    { py: 'ang', vi: 'Đọc giống "ang" tiếng Việt'},
                    { py: 'eng', vi: 'Đọc giống "âng" tiếng Việt'},
                    { py: 'ong', vi: 'Đọc giống "ung" lai "ông"'}
                ];
        const iVowels   = [
                    { py: 'ia', vi: 'Đọc nối "i-a"'},
                    { py: 'ie', vi: 'Đọc nối "i-ê"'},
                    { py: 'iao', vi: 'Đọc nối "i-ao"'},
                    { py: 'iu', pySound: 'iou', vi: 'Đọc nối "i-âu"'},
                    { py: 'ian', vi: 'Đọc nối "i-ên"'},
                    { py: 'in', vi: 'Đọc giống "in"'},
                    { py: 'iang', vi: 'Đọc nối "i-ang"'},
                    { py: 'ing', vi: 'Đọc "ing" hoặc "iêng"'},
                    { py: 'iong', vi: 'Đọc nối "i-ung"'}
                ];
        const uVowels   = [
                    { py: 'ua', vi: 'Đọc "oa"'},
                    { py: 'uo', vi: 'Đọc "ua"'},
                    { py: 'uai', vi: 'Đọc "oai"'},
                    { py: 'ui', pySound: 'ui', vi: 'Đọc "uây"'},
                    { py: 'uan', vi: 'Đọc "oan"'},
                    { py: 'un', pySound: 'uen', vi: 'Đọc "uân"'},
                    { py: 'uang', vi: 'Đọc "oang"'},
                    { py: 'ueng', vi: 'Đọc "oâng"'}
                ];
        const ueVowels  = [
                    { py: 'üe', vi: 'Hơi mở tròn môi đọc "uê"'},
                    { py: 'üan', vi: 'Mở tròn môi đọc "oen"'},
                    { py: 'ün', vi: 'Chu môi đọc "uyn"'}
                ];
    let html = `
        <div style="font-size:15px;font-weight:700;color:#581c87;margin-bottom:12px;">🎵 1. BẢNG VẬN MẪU ĐƠN</div>
        <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(180px,1fr));gap:14px;margin-bottom:28px;">
    `;
    singleVowels.forEach(v => {
        const soundKey = v.pySound || v.py;
        html += `
            <div onclick="window.playPronunciationAudio('van_mau', '${soundKey}')" 
                 style="background:#fff5f9;border:1px solid #fbcfe8;border-radius:14px;padding:16px;text-align:center;cursor:pointer;transition:transform 0.15s;" 
                 onmouseover="this.style.transform='scale(1.02)'" 
                 onmouseout="this.style.transform='none'">
                <div style="font-size:30px;font-weight:800;color:#be185d;">${v.py}</div>
                <div style="font-size:12px;color:#db2777;margin:4px 0;font-weight:600;">${v.vi}</div>
                <div style="font-size:11px;color:#be185d;margin-top:8px;font-weight:700;">🔊 Nghe</div>
            </div>
        `;
    });
    
    html += `</div>`; 
    
    html += `
        <div style="font-size:16px;font-weight:800;color:#581c87;margin-bottom:16px;border-top:2px dashed #e9d5ff;padding-top:20px;">
            🎶 2. BẢNG VẬN MẪU KÉP
        </div>
        <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(180px,1fr));gap:14px;margin-bottom:28px;">
    `;
    
    const allVowels = [...compoundVowels, ...iVowels, ...uVowels, ...ueVowels];
    allVowels.forEach(v => {
        const soundKey = v.pySound || v.py;
        html += `
            <div onclick="window.playPronunciationAudio('van_mau', '${soundKey}')" 
                 style="background:#fff5f9;border:1px solid #fbcfe8;border-radius:14px;padding:16px;text-align:center;cursor:pointer;transition:transform 0.15s;" 
                 onmouseover="this.style.transform='scale(1.02)'" 
                 onmouseout="this.style.transform='none'">
                <div style="font-size:30px;font-weight:800;color:#be185d;">${v.py}</div>
                <div style="font-size:12px;color:#db2777;margin:4px 0;font-weight:600;">${v.vi}</div>
                <div style="font-size:11px;color:#be185d;margin-top:8px;font-weight:700;">🔊 Nghe</div>
            </div>
        `;
    });
    html += `</div>`;  
        container.innerHTML = html;
    } else if (tab === 'tones') {
        container.innerHTML = `
            <div style="font-size:15px;font-weight:700;color:#581c87;margin-bottom:14px;">📈 BẢNG 4 THANH ĐIỆU</div>
            <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:16px;">
                <div onclick="window.playPronunciationAudio('thanh_dieu', 'ā')" style="background:white;border:2px solid #22c55e;border-radius:16px;padding:20px;text-align:center;cursor:pointer;">
                    <span style="background:#dcfce7;color:#15803d;font-size:11px;font-weight:800;padding:4px 10px;border-radius:10px;">THANH 1 (55)</span>
                    <div style="font-size:36px;font-weight:800;color:#16a34a;margin:10px 0 4px 0;">ā</div>
                    <div style="font-size:13px;font-weight:600;color:#1e293b;">Cao và bằng phẳng ¯</div>
                    <button style="margin-top:10px;padding:6px 14px;background:#22c55e;color:white;border:none;border-radius:10px;font-weight:700;font-size:12px;">🔊 Nghe</button>
                </div>
                <div onclick="window.playPronunciationAudio('thanh_dieu', 'á')" style="background:white;border:2px solid #0284c7;border-radius:16px;padding:20px;text-align:center;cursor:pointer;">
                    <span style="background:#e0f2fe;color:#0369a1;font-size:11px;font-weight:800;padding:4px 10px;border-radius:10px;">THANH 2 (35)</span>
                    <div style="font-size:36px;font-weight:800;color:#0284c7;margin:10px 0 4px 0;">á</div>
                    <div style="font-size:13px;font-weight:600;color:#1e293b;">Kéo từ trung bình lên cao ˊ</div>
                    <button style="margin-top:10px;padding:6px 14px;background:#0284c7;color:white;border:none;border-radius:10px;font-weight:700;font-size:12px;">🔊 Nghe</button>
                </div>
                <div onclick="window.playPronunciationAudio('thanh_dieu', 'ǎ')" style="background:white;border:2px solid #eab308;border-radius:16px;padding:20px;text-align:center;cursor:pointer;">
                    <span style="background:#fef9c3;color:#854d0e;font-size:11px;font-weight:800;padding:4px 10px;border-radius:10px;">THANH 3 (214)</span>
                    <div style="font-size:36px;font-weight:800;color:#ca8a04;margin:10px 0 4px 0;">ǎ</div>
                    <div style="font-size:13px;font-weight:600;color:#1e293b;">Xuống thấp rồi lên cao ˇ</div>
                    <button style="margin-top:10px;padding:6px 14px;background:#ca8a04;color:white;border:none;border-radius:10px;font-weight:700;font-size:12px;">🔊 Nghe</button>
                </div>
                <div onclick="window.playPronunciationAudio('thanh_dieu', 'à')" style="background:white;border:2px solid #dc2626;border-radius:16px;padding:20px;text-align:center;cursor:pointer;">
                    <span style="background:#fee2e2;color:#991b1b;font-size:11px;font-weight:800;padding:4px 10px;border-radius:10px;">THANH 4 (51)</span>
                    <div style="font-size:36px;font-weight:800;color:#dc2626;margin:10px 0 4px 0;">à</div>
                    <div style="font-size:13px;font-weight:600;color:#1e293b;">Hạ rất dứt khoát ˋ</div>
                    <button style="margin-top:10px;padding:6px 14px;background:#dc2626;color:white;border:none;border-radius:10px;font-weight:700;font-size:12px;">🔊 Nghe</button>
                </div>
            </div>
        `;
    } else if (tab === 'rules') {
        container.innerHTML = `
            <div style="font-size:15px;font-weight:700;color:#581c87;margin-bottom:14px;">💡 CÁC QUY TẮC BIẾN ĐIỆU CẦN NẮM VỮNG:</div>
            <div style="display:flex;flex-direction:column;gap:14px;">
                <div style="background:#fdf4ff;border-left:4px solid #a855f7;padding:16px;border-radius:12px;">
                    <h4 style="margin:0 0 6px 0;color:#7e22ce;font-size:15px;">1. Biến điệu hai thanh 3 đi liền nhau (3 + 3 ➔ 2 + 3)</h4>
                    <p style="margin:0;font-size:13.5px;color:#334155;">Khi hai âm tiết mang thanh 3 đi liền nhau, âm tiết thứ nhất đọc thành thanh 2.<br>Ví dụ: <b>Nǐ hǎo</b> (你好) đọc là <b>Ní hǎo</b>.</p>
                </div>
                <div style="background:#eff6ff;border-left:4px solid #3b82f6;padding:16px;border-radius:12px;">
                    <h4 style="margin:0 0 6px 0;color:#1d4ed8;font-size:15px;">2. Biến điệu của chữ 不 (Bù)</h4>
                    <p style="margin:0;font-size:13.5px;color:#334155;">Chữ <b>不 (bù)</b> mang thanh 4. Khi đi trước một âm tiết mang thanh 4 khác, <b>bù</b> sẽ đổi thành thanh 2 (<b>bú</b>).<br>Ví dụ: <b>bù shì</b> ➔ <b>bú shì</b> (不是 - Không phải).</p>
                </div>
                <div style="background:#f0fdf4;border-left:4px solid #22c55e;padding:16px;border-radius:12px;">
                    <h4 style="margin:0 0 6px 0;color:#15803d;font-size:15px;">3. Biến điệu của chữ 一 (Yī)</h4>
                    <p style="margin:0;font-size:13.5px;color:#334155;">• Đọc riêng hoặc đứng cuối: <b>Yī</b> (thanh 1).<br>• Đứng trước thanh 4: đọc thành thanh 2 <b>Yí</b> (vd: <b>yí yàng</b> 一样).<br>• Đứng trước thanh 1, 2, 3: đọc thành thanh 4 <b>Yì</b> (vd: <b>yì tiān</b> 一天, <b>yì nǐan</b> 一年).</p>
                </div>
            </div>
        `;
    }
};

window.renderTranslationModule = function(level, data) {
    const lvl = level || 'hsk1';
    const ci = getContentInner();
    if (!ci) return;

    const items = window.translationDataByLevel[lvl] || window.translationDataByLevel.hsk1;

    let html = `
        <div style="background:linear-gradient(135deg,#fdf2f8,#fce7f3);padding:24px;border-radius:20px;margin-bottom:24px;border:2px solid #fbcfe8;box-shadow:0 8px 24px rgba(236,72,153,0.1);">
            <div style="display:flex;align-items:center;gap:12px;margin-bottom:8px;">
                <span style="font-size:32px;">🔤</span>
                <div>
                    <h2 style="font-size:22px;font-weight:800;color:#be185d;margin:0;">Luyện Dịch Trung - Việt & Việt - Trung (${lvl.toUpperCase()})</h2>
                    <p style="font-size:13.5px;color:#9d174d;margin:4px 0 0 0;">Thực hành dịch câu mẫu chuẩn HSK & chấm điểm Đúng (Xanh) - Sai (Đỏ) tức thì</p>
                </div>
            </div>
        </div>

        <div style="display:flex;flex-direction:column;gap:18px;">
    `;

    items.forEach((item, idx) => {
        const inputId = `trans-mod-input-${lvl}-${idx}`;

        html += `
            <div class="trans-mod-card" id="trans-mod-item-${lvl}-${idx}" style="background:white;padding:20px;border-radius:16px;border:1.5px solid #fbcfe8;box-shadow:0 4px 14px rgba(0,0,0,0.03);">
                <div style="display:flex;align-items:center;gap:8px;margin-bottom:4px;">
                    <span style="background:#ec4899;color:white;font-size:11px;font-weight:700;padding:2px 8px;border-radius:6px;">Câu ${idx + 1}</span>
                    <span style="font-size:18px;font-weight:800;color:#1e293b;">${item.chinese}</span>
                </div>
                <div style="font-size:13px;color:#db2777;font-weight:600;margin-bottom:12px;padding-left:2px;">
                    ${item.pinyin}
                </div>

                <!-- (2) NHẬP BẢN DỊCH VÀ NÚT KIỂM TRA ĐỒNG BỘ HOÀN TOÀN -->
                <div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap;">
                    <input type="text" id="${inputId}" placeholder="Nhập bản dịch tiếng Việt..." 
                           onkeydown="if(event.key==='Enter') window.checkTranslationModuleItem('${lvl}', ${idx})"
                           style="flex:1;min-width:180px;border:1.5px solid #cbd5e1;border-radius:8px;padding:8px 12px;font-size:14px;outline:none;transition:all 0.2s;">
                    <button onclick="window.checkTranslationModuleItem('${lvl}', ${idx})" 
                            style="padding:8px 18px;border:none;border-radius:10px;background:linear-gradient(135deg,#ec4899,#db2777);color:white;font-size:13px;font-weight:700;cursor:pointer;box-shadow:0 2px 8px rgba(236,72,153,0.25);">
                        ✅ Kiểm tra
                    </button>
                </div>

                <!-- KẾT QUẢ KIỂM TRA HIỂN THỊ ĐỒNG BỘ -->
                <div id="${inputId}-result" style="margin-top:10px;font-weight:600;font-size:13.5px;display:none;padding:10px 14px;border-radius:10px;line-height:1.5;"></div>
            </div>
        `;
    });

    html += `</div>`;
    ci.innerHTML = html;
};

window.checkTranslationModuleItem = function(lvl, idx) {
    const inputEl = document.getElementById(`trans-mod-input-${lvl}-${idx}`);
    const resultDiv = document.getElementById(`trans-mod-input-${lvl}-${idx}-result`);
    if (!inputEl || !resultDiv) return;

    const item = (window.translationDataByLevel[lvl] || window.translationDataByLevel.hsk1)[idx];
    if (!item) return;

    const rawUser = inputEl.value.trim();
    const correctAnswer = item.vietnamese || item.vi || item.answer || '';

    const normUser = rawUser.toLowerCase().replace(/[.,?!;:""''`~]/g, '').replace(/\s+/g, ' ').trim();
    const normCorrect = correctAnswer.toLowerCase().replace(/[.,?!;:""''`~]/g, '').replace(/\s+/g, ' ').trim();

    let isCorrect = (normUser === normCorrect);
    if (!isCorrect && correctAnswer.includes('/')) {
        const alts = correctAnswer.split('/');
        isCorrect = alts.some(alt => normUser === alt.toLowerCase().replace(/[.,?!;:""''`~]/g, '').replace(/\s+/g, ' ').trim());
    }

    if (isCorrect) {
        inputEl.style.borderColor = '#16a34a';
        inputEl.style.background = '#f0fdf4';
        resultDiv.style.color = '#15803d';
        resultDiv.style.background = '#dcfce7';
        resultDiv.style.border = '1.5px solid #86efac';
        resultDiv.innerHTML = `✅ <b>Chính xác! (ĐÚNG)</b><br>Bản dịch của bạn rất tốt: <b>${correctAnswer}</b>`;
    } else {
        inputEl.style.borderColor = '#dc2626';
        inputEl.style.background = '#fef2f2';
        resultDiv.style.color = '#991b1b';
        resultDiv.style.background = '#fee2e2';
        resultDiv.style.border = '1.5px solid #fca5a5';
        resultDiv.innerHTML = `
            <div>❌ <b>Chưa chính xác! (SAI)</b></div>
            <div style="margin-top:4px;">Bản dịch của bạn: <span style="text-decoration:line-through;color:#b91c1c;">${escapeHtml(rawUser || 'Chưa nhập')}</span></div>
            <div style="margin-top:4px;color:#15803d;font-weight:700;">Đáp án chuẩn mẫu (ĐÚNG): <b>${correctAnswer}</b></div>
            <div style="font-size:11px;margin-top:4px;color:#991b1b;font-weight:normal;">📌 Đã tự động lưu vào danh sách câu làm sai trong Trang cá nhân để ôn lại.</div>
        `;

        if (typeof window.recordWrongExercise === 'function') {
            window.recordWrongExercise({
                level: lvl,
                lessonTitle: 'Luyện dịch HSK ' + lvl.toUpperCase(),
                question: item.chinese,
                type: 'translation',
                userAnswer: rawUser || 'Chưa nhập',
                correctAnswer: correctAnswer,
                explanation: ''
            });
        }
    }
    resultDiv.style.display = 'block';

    const cardEl = document.getElementById(`trans-mod-item-${lvl}-${idx}`);
    if (cardEl) {
        const rect = cardEl.getBoundingClientRect();
        if (rect.top < 0 || rect.bottom > window.innerHeight) {
            cardEl.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
    }
};

// ================================================================
// (5) GIẢI TRÍ MODULE (NOVELS, COMICS, VIDEOS, MUSIC BY HSK & TOPICS)
// ================================================================
window.renderEntertainmentModule = function(level, categoryFilter) {
    const lvl = level || 'hsk1';
    const cat = categoryFilter || 'all';
    const ci = getContentInner();
    if (!ci) return;

    const entertainmentItems = [
        {
            id: 'peppa-pig-1',
            level: 'hsk1',
            category: 'video',
            categoryLabel: '🎥 Video & Phim',
            title: 'Peppa Pig Tiếng Trung (小猪佩奇)',
            chineseTitle: '小猪佩奇 - 泥坑 (Muddy Puddles)',
            synopsis: 'Hoạt hình Peppa Pig bản tiếng Trung giản thể, phát âm chuẩn, từ vựng siêu gần gũi và dễ học cho HSK 1-2.',
            embedUrl: 'https://www.youtube.com/embed/g2J0X794lV0',
            vocab: [
                { cn: '泥坑', py: 'níkēng', vi: 'vũng bùn' },
                { cn: '喜欢', py: 'xǐhuan', vi: 'thích' },
                { cn: '跳', py: 'tiào', vi: 'nhảy' },
                { cn: '靴子', py: 'xuēzi', vi: 'đôi ủng' }
            ],
            contentLines: [
                { cn: '佩奇喜欢在泥坑里跳。', py: 'Pèi qí xǐhuan zài níkēng lǐ tiào.', vi: 'Peppa thích nhảy trong vũng bùn.' },
                { cn: '如果你要在泥坑里跳，你必须穿上靴子。', py: 'Rúguǒ nǐ yào zài níkēng lǐ tiào, nǐ bìxū chuān shàng xuēzi.', vi: 'Nếu con muốn nhảy vào vũng bùn, con phải đi ủng vào.' }
            ]
        },
        {
            id: 'short-story-cats',
            level: 'hsk1',
            category: 'novel',
            categoryLabel: '📖 Tiểu thuyết & Truyện',
            title: 'Truyện Ngắn: Mèo Con Tìm Mẹ (小猫找妈妈)',
            chineseTitle: '小猫找妈妈 (Graded Reader HSK1)',
            synopsis: 'Truyện đọc giản yếu HSK1 về chú mèo nhỏ đi quanh trang trại tìm mẹ, học từ vựng về động vật và hỏi đường.',
            vocab: [
                { cn: '小猫', py: 'xiǎomāo', vi: 'mèo con' },
                { cn: '找到', py: 'zhǎodào', vi: 'tìm thấy' },
                { cn: '农场', py: 'nóngchǎng', vi: 'trang trại' }
            ],
            contentLines: [
                { cn: '一只小猫在路上走。', py: 'Yì zhī xiǎomāo zài lùshang zǒu.', vi: 'Một chú mèo con đang đi trên đường.' },
                { cn: '它问大牛：“请问，你看见我的妈妈了吗？”', py: 'Tā wèn dà niú: "Qǐngwèn, nǐ kànjiàn wǒ de māma le ma?"', vi: 'Nó hỏi bò lớn: "Xin hỏi, bác có nhìn thấy mẹ của cháu không?"' },
                { cn: '大牛说：“没有，你去前面问问小狗吧。”', py: 'Dà niú shuō: "Méiyǒu, nǐ qù qiánmiàn wènwen xiǎogǒu ba."', vi: 'Bò lớn nói: "Không có, cháu phía trước hỏi chú chó xem."' }
            ]
        },
        {
            id: 'song-wu-ren-zhi-dao',
            level: 'hsk2',
            category: 'music',
            categoryLabel: '🎵 Nhạc',
            title: 'Bài Hát: Đảo Không Người',
            chineseTitle: '无人之岛 (Wú rén zhī dǎo)',
            synopsis: 'Một trong những ca khúc tiếng Trung nổi tiếng với giai điệu nhẹ nhàng, sâu lắng.',
            embedUrl: 'https://www.youtube.com/watch?v=Q5cuZL30iao&list=RDQ5cuZL30iao&start_radio=1',
            vocab: [
                { cn: '甜蜜蜜', py: 'tiánmìmì', vi: 'ngọt ngào' },
                { cn: '笑', py: 'xiào', vi: 'cười' },
                { cn: '花朵', py: 'huāduǒ', vi: 'bông hoa' },
                { cn: '梦里', py: 'mènglǐ', vi: 'trong giấc mơ' }
            ],
            contentLines: [
                { cn: '甜蜜蜜，你笑得甜蜜蜜。', py: 'Tiánmìmì, nǐ xiào de tiánmìmì.', vi: 'Ngọt ngào làm sao, nụ cười em ngọt ngào làm sao.' },
                { cn: '好像花儿开在春风里。', py: 'Hǎoxiàng huāer kāi zài chūnfēng lǐ.', vi: 'Tựa như bông hoa nở trong gió xuân.' },
                { cn: '在哪里，在哪里见过你？', py: 'Zài nǎlǐ, zài nǎlǐ jiànguò nǐ?', vi: 'Ở đâu, em đã từng gặp anh ở đâu nhỉ?' }
            ]
        },
        {
            id: 'comic-fox-fairy',
            level: 'hsk3',
            category: 'comic',
            categoryLabel: '🎨 Truyện tranh & Manhua',
            title: 'Truyện Tranh HSK3: Cáo Nhỏ Đi Học (小狐狸上学记)',
            chineseTitle: '小狐狸上学记 (Manhua HSK3)',
            synopsis: 'Bộ truyện tranh hài hước lồng ghép đời sống học đường của các loài vật, phù hợp ôn tập ngữ pháp HSK3.',
            vocab: [
                { cn: '狐狸', py: 'húli', vi: 'con cáo' },
                { cn: '考试', py: 'kǎoshì', vi: 'thi cử' },
                { cn: '紧张', py: 'jǐnzhāng', vi: 'hồi hộp, căng thẳng' }
            ],
            contentLines: [
                { cn: '今天小狐狸第一天去动物学校。', py: 'Jīntiān xiǎohúli dì-yī tiān qù dòngwù xuéxiào.', vi: 'Hôm nay là ngày đầu tiên cáo nhỏ đến trường học động vật.' },
                { cn: '它心里非常紧张，因为今天有汉语听力测试。', py: 'Tā xīnlǐ fēicháng jǐnzhāng, yīnwèi jīntiān yǒu Hànyǔ tīnglì cèshì.', vi: 'Trong lòng nó vô cùng hồi hộp vì hôm nay có bài kiểm tra nghe tiếng Trung.' }
            ]
        },
        {
            id: 'video-scenery-guilin',
            level: 'hsk4',
            category: 'video',
            categoryLabel: '🎥 Video & Phim',
            title: 'Phim Ngắn Du Lịch: Sơn Thủy Quế Lâm (桂林山水)',
            chineseTitle: '桂林山水甲天下 (Vlog HSK4)',
            synopsis: 'Khám phá thắng cảnh Quế Lâm qua phim tư liệu ngắn có phụ đề Pinyin và từ vựng du lịch HSK4.',
            embedUrl: 'https://www.youtube.com/embed/7X8I-S6JpM0',
            vocab: [
                { cn: '山水', py: 'shānshuǐ', vi: 'sơn thủy, cảnh sông núi' },
                { cn: '风景', py: 'fēngjǐng', vi: 'phong cảnh' },
                { cn: '吸引', py: 'xīyǐn', vi: 'thu hút' }
            ],
            contentLines: [
                { cn: '人们常说：“桂林山水甲天下”。', py: 'Rénmen cháng shuō: "Guìlín shānshuǐ jiǎ tiānxià".', vi: 'Người ta thường nói: "Cảnh đẹp Quế Lâm nhất thiên hạ".' },
                { cn: '这里的江水清澈见底，吸引了世界各地的游客。', py: 'Zhèlǐ de jiāngshuǐ qīngchè jiàn dǐ, xīyǐn le shìjiè gèdì de yóukè.', vi: 'Nước sông ở đây trong veo nhìn thấy đáy, thu hút du khách từ khắp thế giới.' }
            ]
        },
        {
            id: 'novel-journey-to-the-west',
            level: 'hsk5',
            category: 'novel',
            categoryLabel: '📖 Tiểu thuyết & Truyện',
            title: 'Tiểu Thuyết Danh Tác: Tây Du Ký (西游记 - Đọc Chuyển Thể HSK5)',
            chineseTitle: '西游记 - 孙悟空大闹天宫',
            synopsis: 'Tóm tắt tác phẩm kinh điển Tây Du Ký được biên soạn lại theo từ vựng HSK5 giản yếu, giữ nguyên tinh thần văn học.',
            vocab: [
                { cn: '大闹', py: 'dànào', vi: 'làm náo loạn' },
                { cn: '本领', py: 'běnlǐng', vi: 'bản lĩnh, tài năng' },
                { cn: '佩服', py: 'pèifú', vi: 'bái phục, nể phục' }
            ],
            contentLines: [
                { cn: '孙悟空凭着高强的本领，在天宫打败了许多神将。', py: 'Sūn Wùkōng píng zhe gāoqiáng de běnlǐng, zài tiāngōng dǎbài le xǔduō shénjiàng.', vi: 'Tôn Ngộ Không dựa vào bản lĩnh cao cường đã đánh bại nhiều thần tướng ở thiên cung.' },
                { cn: '这个故事展现了勇敢与追求自由的精神。', py: 'Zhè gè gùshì zhǎnxiàn le yǒnggǎn yǔ zhuīqiú zìyóu de jīngshén.', vi: 'Câu chuyện này thể hiện tinh thần dũng cảm và đuổi theo sự tự do.' }
            ]
        }
    ];

    let filtered = entertainmentItems.filter(item => {
        const matchLevel = (lvl === 'all' || item.level === lvl);
        const matchCat = (cat === 'all' || item.category === cat);
        return matchLevel && matchCat;
    });

    if (filtered.length === 0) {
        filtered = entertainmentItems.filter(item => cat === 'all' || item.category === cat);
    }

    let html = `
        <div style="background:linear-gradient(135deg,#fef3c7,#fde68a);padding:24px;border-radius:20px;margin-bottom:24px;border:2px solid #fcd34d;box-shadow:0 8px 24px rgba(245,158,11,0.12);">
            <div style="display:flex;align-items:center;gap:12px;margin-bottom:8px;">
                <span style="font-size:36px;">🎬</span>
                <div>
                    <h2 style="font-size:22px;font-weight:800;color:#92400e;margin:0;">Góc Giải Trí Tiếng Trung (HSK Media & Reader)</h2>
                    <p style="font-size:13.5px;color:#b45309;margin:4px 0 0 0;">Tiểu thuyết, Truyện tranh, Video & Phim ngắn được phân loại theo HSK & Chủ đề</p>
                </div>
            </div>
            
            <div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:16px;">
                <button onclick="window.renderEntertainmentModule('${lvl}', 'all')" style="padding:7px 16px;border-radius:20px;border:none;font-weight:700;font-size:12.5px;cursor:pointer;${cat==='all'?'background:#d97706;color:white;':'background:white;color:#92400e;border:1px solid #fcd34d;'}">🌟 Tất cả</button>
                <button onclick="window.renderEntertainmentModule('${lvl}', 'novel')" style="padding:7px 16px;border-radius:20px;border:none;font-weight:700;font-size:12.5px;cursor:pointer;${cat==='novel'?'background:#d97706;color:white;':'background:white;color:#92400e;border:1px solid #fcd34d;'}">📖 Tiểu thuyết & Truyện</button>
                <button onclick="window.renderEntertainmentModule('${lvl}', 'comic')" style="padding:7px 16px;border-radius:20px;border:none;font-weight:700;font-size:12.5px;cursor:pointer;${cat==='comic'?'background:#d97706;color:white;':'background:white;color:#92400e;border:1px solid #fcd34d;'}">🎨 Truyện tranh & Manhua</button>
                <button onclick="window.renderEntertainmentModule('${lvl}', 'video')" style="padding:7px 16px;border-radius:20px;border:none;font-weight:700;font-size:12.5px;cursor:pointer;${cat==='video'?'background:#d97706;color:white;':'background:white;color:#92400e;border:1px solid #fcd34d;'}">🎥 Video & Phim</button>
                <button onclick="window.renderEntertainmentModule('${lvl}', 'music')" style="padding:7px 16px;border-radius:20px;border:none;font-weight:700;font-size:12.5px;cursor:pointer;${cat==='music'?'background:#d97706;color:white;':'background:white;color:#92400e;border:1px solid #fcd34d;'}">🎵 Nhạc</button>
            </div>
        </div>

        <div style="display:grid;grid-template-columns:repeat(auto-fill, minmax(320px, 1fr));gap:20px;">
    `;

    filtered.forEach(item => {
        let vocabTags = '';
        if (item.vocab) {
            vocabTags = item.vocab.map(v => 
                `<span style="background:#fffbeb;color:#b45309;border:1px solid #fde68a;font-size:11.5px;font-weight:600;padding:2px 6px;border-radius:6px;">${v.cn} (${v.py})</span>`
            ).join('');
        }

        html += `
            <div style="background:white;border-radius:18px;border:1.5px solid #fde68a;box-shadow:0 6px 18px rgba(0,0,0,0.04);display:flex;flex-direction:column;overflow:hidden;transition:transform 0.2s;" onmouseenter="this.style.transform='translateY(-3px)'" onmouseleave="this.style.transform='translateY(0)'">
                <div style="padding:18px;flex:1;display:flex;flex-direction:column;">
                    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px;">
                        <span style="background:#f59e0b;color:white;font-size:11px;font-weight:800;padding:3px 10px;border-radius:12px;text-transform:uppercase;">${item.level.toUpperCase()}</span>
                        <span style="font-size:12px;color:#d97706;font-weight:700;">${item.categoryLabel}</span>
                    </div>

                    <h3 style="font-size:16.5px;font-weight:800;color:#1e293b;margin:6px 0 2px 0;">${item.title}</h3>
                    <div style="font-size:13.5px;color:#db2777;font-weight:600;margin-bottom:10px;">${item.chineseTitle}</div>
                    
                    <p style="font-size:13px;color:#475569;line-height:1.5;margin:0 0 12px 0;flex:1;">${item.synopsis}</p>

                    ${vocabTags ? `
                    <div style="margin-bottom:14px;padding:8px 10px;background:#fefce8;border-radius:10px;border:1px dashed #fde68a;">
                        <div style="font-size:11px;font-weight:700;color:#b45309;margin-bottom:4px;">🔑 Từ vựng mấu chốt:</div>
                        <div style="display:flex;flex-wrap:wrap;gap:4px;">${vocabTags}</div>
                    </div>
                    ` : ''}

                    <button onclick="window.openEntertainmentModal('${item.id}')" 
                            style="width:100%;padding:11px;border:none;border-radius:12px;background:linear-gradient(135deg,#f59e0b,#d97706);color:white;font-weight:800;font-size:13.5px;cursor:pointer;box-shadow:0 4px 12px rgba(245,158,11,0.25);display:flex;align-items:center;justify-content:center;gap:6px;">
                        <span>📖 Đọc & Trải Nghiệm Ngay</span>
                    </button>
                </div>
            </div>
        `;
    });

    html += `</div>`;
    ci.innerHTML = html;

    window._entertainmentItemsCache = entertainmentItems;
};

window.openEntertainmentModal = function(itemId) {
    const items = window._entertainmentItemsCache || [];
    const item = items.find(i => i.id === itemId);
    if (!item) return;

    const modal = document.getElementById('entertainmentModal');
    const title = document.getElementById('entModalTitle');
    const badge = document.getElementById('entModalBadge');
    const body = document.getElementById('entModalBody');
    if (!modal || !body) return;

    if (title) title.textContent = item.title;
    if (badge) badge.textContent = item.level.toUpperCase() + ' - ' + item.categoryLabel;

    let bodyHtml = `
        <div style="margin-bottom:18px;">
            <h4 style="font-size:17px;color:#be185d;margin:0 0 4px 0;font-weight:800;">${item.chineseTitle}</h4>
            <p style="font-size:13.5px;color:#475569;margin:0;">${item.synopsis}</p>
        </div>
    `;

    if (item.embedUrl) {
        bodyHtml += `
            <div style="position:relative;padding-bottom:56.25%;height:0;overflow:hidden;border-radius:16px;margin-bottom:20px;box-shadow:0 4px 14px rgba(0,0,0,0.15);">
                <iframe src="${item.embedUrl}" style="position:absolute;top:0;left:0;width:100%;height:100%;border:none;border-radius:16px;" allowfullscreen></iframe>
            </div>
        `;
    }

    if (item.vocab && item.vocab.length > 0) {
        bodyHtml += `
            <div style="background:#fff7ed;border:1px solid #ffedd5;border-radius:14px;padding:14px;margin-bottom:20px;">
                <div style="font-weight:800;color:#c2410c;font-size:13.5px;margin-bottom:8px;">💡 Bảng Từ Vựng & Nghĩa:</div>
                <div style="display:grid;grid-template-columns:repeat(auto-fill, minmax(200px, 1fr));gap:8px;">
                    ${item.vocab.map(v => `
                        <div style="background:white;padding:8px 12px;border-radius:8px;border:1px solid #fed7aa;font-size:13px;">
                            <span style="font-weight:800;color:#1e293b;">${v.cn}</span> 
                            <span style="color:#db2777;font-size:12px;">(${v.py})</span>: 
                            <span style="color:#475569;">${v.vi}</span>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    }

    if (item.contentLines && item.contentLines.length > 0) {
        bodyHtml += `
            <div style="background:white;border-radius:16px;padding:18px;border:1.5px solid #fbcfe8;">
                <h4 style="font-size:15px;color:#be185d;font-weight:800;margin:0 0 14px 0;">📜 Nội dung bài đọc / Lời thoại song ngữ:</h4>
                <div style="display:flex;flex-direction:column;gap:14px;">
                    ${item.contentLines.map((line, idx) => `
                        <div style="padding:10px 14px;background:#fdf2f8;border-radius:10px;border-left:4px solid #ec4899;">
                            <div style="font-size:16.5px;font-weight:800;color:#1e293b;margin-bottom:2px;">${line.cn}</div>
                            <div style="font-size:13px;color:#db2777;font-weight:600;margin-bottom:4px;">${line.py}</div>
                            <div style="font-size:13.5px;color:#475569;">${line.vi}</div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    }

    body.innerHTML = bodyHtml;
    modal.style.display = 'flex';
};

window.closeEntertainmentModal = function() {
    const modal = document.getElementById('entertainmentModal');
    if (modal) modal.style.display = 'none';
};

// ================================================================
// (3) OPEN LESSON DIRECTLY & RESET EXERCISES HELPERS
// ================================================================
window.openLessonDirectly = async function(module, level, lessonId, tabId) {
    const targetMod = module || 'grammar';
    const targetLvl = level || 'hsk1';
    
    let cleanId = lessonId;
    if (typeof cleanId === 'string' && cleanId.includes('_')) {
        const parts = cleanId.split('_');
        cleanId = parts[parts.length - 1];
    }

    if (typeof window.showContent === 'function') {
        await window.showContent(targetMod, targetLvl);
    }

    setTimeout(() => {
        if (targetMod === 'grammar' && typeof window.showLesson === 'function') {
            window.showLesson(targetLvl, cleanId, tabId || 1);
        } else if (targetMod === 'vocab' && typeof window.showVocabLesson === 'function') {
            window.showVocabLesson(targetLvl, cleanId, tabId || 1);
        }

        const el = document.getElementById(`lesson-${targetLvl}-${cleanId}`) ||
                   document.getElementById(`vocab-lesson-${targetLvl}-${cleanId}`) ||
                   document.getElementById('contentArea');
        if (el) {
            el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    }, 450);
};

window.retryLessonMistakesDirectly = async function(level, lessonId, moduleName, mistakeId) {
    if (typeof window.closePersonalProfileModal === 'function') {
        window.closePersonalProfileModal();
    }

    let cleanId = String(lessonId || '1');
    if (cleanId.includes('_')) {
        const parts = cleanId.split('_');
        cleanId = parts[parts.length - 1];
    }

    const targetLvl = (level || 'hsk1').toLowerCase();
    const targetModule = (moduleName === 'vocab') ? 'vocab' : 'grammar';

    let mistakeData = null;
    const user = (window.auth && window.auth.currentUser) ? window.auth.currentUser : null;
    const uid = user ? user.uid : 'guest';
    const profile = (typeof window.getUserProfile === 'function') ? window.getUserProfile(uid) : null;

    if (profile && Array.isArray(profile.wrongExercises)) {
        if (mistakeId) {
            mistakeData = profile.wrongExercises.find(item => String(item.id) === String(mistakeId)) || null;
        }
        if (!mistakeData) {
            mistakeData = profile.wrongExercises.find(item => 
                (item.module === targetModule || item.module === moduleName) &&
                String(item.lessonId).replace(/.*_/, '') === cleanId &&
                (item.level || '').toLowerCase() === targetLvl
            ) || null;
        }
    }

    if (typeof window.showContent === 'function') {
        await window.showContent(targetModule, targetLvl);
    }

    const openAndHighlight = (attemptsRemaining = 5) => {
        if (targetModule === 'grammar' && typeof window.showLesson === 'function') {
            window.showLesson(targetLvl, cleanId, '999');
        } else if (targetModule === 'vocab' && typeof window.showVocabLesson === 'function') {
            window.showVocabLesson(targetLvl, cleanId, 'exercise');
        }

        setTimeout(() => {
            const lessonEl = document.getElementById(`lesson-${targetLvl}-${cleanId}`) ||
                             document.getElementById(`vocab-lesson-${targetLvl}-${cleanId}`) ||
                             document.querySelector(`.lesson[data-lesson-id="${cleanId}"]`) ||
                             document.getElementById('contentArea');

            if (!lessonEl && attemptsRemaining > 0) {
                setTimeout(() => openAndHighlight(attemptsRemaining - 1), 200);
                return;
            }

            if (!lessonEl) return;

            // Đảm bảo chuyển sang tab Bài Tập
            if (targetModule === 'grammar') {
                if (typeof window.switchTab === 'function') window.switchTab(targetLvl, cleanId, '999');
                const exBtn = lessonEl.querySelector('.tab-btn[data-tab="999"]');
                if (exBtn && !exBtn.classList.contains('active')) exBtn.click();
            } else {
                const exBtn = lessonEl.querySelector('.tab-btn[data-tab="exercise"]');
                if (exBtn && !exBtn.classList.contains('active')) exBtn.click();
            }

            // Reset trạng thái bài tập để học sinh làm lại tươi mới
            if (typeof window.resetLessonExercises === 'function') {
                window.resetLessonExercises(lessonEl, { skipScroll: true });
            }

            const activeTabPane = lessonEl.querySelector('.tab-pane.active') || lessonEl;
            let candidates = Array.from(activeTabPane.querySelectorAll('.exercise-item'));
            if (candidates.length === 0) {
                candidates = Array.from(lessonEl.querySelectorAll('.exercise-item'));
            }

            if (candidates.length === 0 && attemptsRemaining > 0) {
                setTimeout(() => openAndHighlight(attemptsRemaining - 1), 200);
                return;
            }

            let targetQuestion = null;
            const normalize = (str) => String(str || '').toLowerCase().replace(/^\d+[\.\:\s\-]+/, '').replace(/[^\w\s\u4e00-\u9fa5]/g, '').trim();

            if (mistakeData) {
                // 1. Khớp theo index câu hỏi
                if (mistakeData.questionIdx !== undefined && mistakeData.questionIdx !== null) {
                    targetQuestion = candidates.find(item => String(item.dataset.exerciseIndex) === String(mistakeData.questionIdx));
                }

                // 2. Khớp theo nội dung văn bản câu hỏi
                if (!targetQuestion && (mistakeData.question || mistakeData.questionKey)) {
                    const needle = normalize(mistakeData.question || mistakeData.questionKey);
                    targetQuestion = candidates.find(item => {
                        const itemText = normalize(item.dataset.questionText || item.textContent);
                        return itemText.includes(needle) || needle.includes(itemText);
                    });
                }

                // 3. Khớp theo đáp án người dùng chọn / đáp án đúng
                if (!targetQuestion && (mistakeData.userAnswer || mistakeData.correctAnswer)) {
                    const ansNeedle = normalize(mistakeData.userAnswer || mistakeData.correctAnswer);
                    targetQuestion = candidates.find(item => normalize(item.textContent).includes(ansNeedle));
                }
            }

            // Fallback: chọn theo index hoặc thẻ bài tập đầu tiên
            if (!targetQuestion) {
                if (mistakeData && typeof mistakeData.questionIdx === 'number' && candidates[mistakeData.questionIdx]) {
                    targetQuestion = candidates[mistakeData.questionIdx];
                } else {
                    targetQuestion = candidates[0] || activeTabPane.querySelector('.exercise-item, .exercise-card, .fill-item, .trans-item, .drag-drop-container, .match-container') || lessonEl;
                }
            }

            if (targetQuestion) {
                // Tự động cuộn màn hình tới đúng thẻ câu hỏi
                targetQuestion.scrollIntoView({ behavior: 'smooth', block: 'center' });

                // Viền hồng nổi bật thẻ câu hỏi
                targetQuestion.style.transition = 'all 0.3s ease';
                targetQuestion.style.outline = '4px solid #ec4899';
                targetQuestion.style.outlineOffset = '6px';
                targetQuestion.style.borderColor = '#ec4899';
                targetQuestion.style.boxShadow = '0 0 30px rgba(236,72,153,0.7)';
                targetQuestion.style.borderRadius = '14px';

                if (typeof targetQuestion.animate === 'function') {
                    targetQuestion.animate([
                        { transform: 'scale(1)', boxShadow: '0 0 10px rgba(236,72,153,0.3)' },
                        { transform: 'scale(1.03)', boxShadow: '0 0 35px rgba(236,72,153,0.9)' },
                        { transform: 'scale(1)', boxShadow: '0 0 10px rgba(236,72,153,0.3)' }
                    ], {
                        duration: 650,
                        iterations: 3
                    });
                }

                setTimeout(() => {
                    targetQuestion.style.outline = 'none';
                    targetQuestion.style.outlineOffset = '0px';
                    targetQuestion.style.boxShadow = 'none';
                    targetQuestion.style.borderColor = '#fce7f3';
                }, 5000);
            }

            let toast = document.getElementById('retry-mistake-toast');
            if (!toast) {
                toast = document.createElement('div');
                toast.id = 'retry-mistake-toast';
                toast.style.cssText = 'position:fixed;top:80px;right:20px;z-index:9999;background:linear-gradient(135deg,#be185d,#ec4899);color:white;padding:12px 20px;border-radius:12px;font-weight:700;font-size:13.5px;box-shadow:0 6px 20px rgba(0,0,0,0.2);';
                document.body.appendChild(toast);
            }
            toast.innerHTML = `🎯 Đã dẫn ra trực tiếp câu bài tập của Bài ${cleanId} (${targetLvl.toUpperCase()}) để bạn làm lại!`;
            toast.style.display = 'block';
            setTimeout(() => { toast.style.display = 'none'; }, 4000);
        }, 300);
    };

    setTimeout(() => openAndHighlight(), 200);
};

window.resetLessonExercises = function(containerEl, opts = {}) {
    if (!containerEl) return;
    const banner = containerEl.querySelector('.lesson-quiz-summary-banner') || containerEl.querySelector('.result-banner');
    if (banner) banner.remove();

    const lessonWrapper = containerEl.closest('.lesson') || containerEl.closest('.lesson-exercises-wrapper') || containerEl;
    const currentLevel = lessonWrapper.dataset.level || containerEl.dataset.level || '';
    const lessonId = lessonWrapper.dataset.lessonId || containerEl.dataset.lessonId || '';
    const lessonPrefix = lessonWrapper.dataset.module === 'vocab' ? 'vocab-ex' : 'grammar-ex';

    const exerciseItems = Array.from(containerEl.querySelectorAll('.exercise-item'));
    exerciseItems.forEach((item, idx) => {
        const parsed = item.dataset.exerciseData ? JSON.parse(item.dataset.exerciseData) : null;
        if (!parsed) return;
        const freshItem = renderExerciseItem(
            parsed,
            idx,
            currentLevel,
            lessonId,
            exerciseItems.length,
            lessonPrefix,
            lessonWrapper.dataset.module || 'grammar'
        );
        item.replaceWith(freshItem);
    });

    if (!opts || !opts.skipScroll) {
        containerEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
};
