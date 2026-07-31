
        const MODULES = {
            vocab: { label: 'Từ vựng', icon: '📚', path: 'data/vocab/' },
            grammar: { label: 'Ngữ pháp', icon: '📝', path: 'data/grammar/' },
            hanzi: { label: 'Chữ Hán', icon: '🀄', path: 'data/hanzi/' },
            pronunciation: { label: 'Phát âm', icon: '🔊', path: 'data/pronunciation/' },
            translation: { label: 'Luyện dịch', icon: '🔤', path: 'data/translation/' },
            practice: { label: 'Luyện đề', icon: '📖', path: 'data/practice/' },
            dictation: { label: 'Nghe chép', icon: '🎧', path: 'data/dictation/' },
            shadowing: { label: 'Shadowing', icon: '🗣️', path: 'data/shadowing/' }
        };


        let currentModule = 'grammar';
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
                        const text = await response.text();
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
                                        title: `DANH MỤC CHỮ HÁN ${level.toUpperCase()}`,
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
    if (!module) {
        const activeFeature = document.querySelector('.feature-card.active');
        module = activeFeature ? activeFeature.dataset.module : 'grammar';
    }
    
    currentModule = module;
    currentLevel = level;
    
    saveState(module, level);

    document.querySelectorAll('.feature-card').forEach(el => el.classList.remove('active'));
    const activeCard = document.querySelector(`.feature-card[data-module="${module}"]`);
    if (activeCard) activeCard.classList.add('active');

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

        function escapeHtml(str) {
            if (!str) return '';
            return String(str)
                .replace(/&/g, "&amp;")
                .replace(/</g, "&lt;")
                .replace(/>/g, "&gt;")
                .replace(/"/g, "&quot;")
                .replace(/'/g, "&#039;");
        }

        function escapeQuotes(str) {
            if (!str) return '';
            return String(str).replace(/\\/g, "\\\\").replace(/'/g, "\\'").replace(/"/g, '&quot;');
        }

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
                const q = hanziState.searchQuery.toLowerCase().trim();
                list = list.filter(item => {
                    const hz = (item.hanzi || '').toLowerCase();
                    const py = (item.pinyin || '').toLowerCase();
                    const vi = (item.meaning || '').toLowerCase();
                    const rad = (item.radical || '').toLowerCase();
                    const rm = (item.radical_meaning || '').toLowerCase();
                    const st = (item.story || '').toLowerCase();
                    return hz.includes(q) || py.includes(q) || vi.includes(q) || rad.includes(q) || rm.includes(q) || st.includes(q);
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
                                    ✍️ MÔ PHỎNG & TẬP VIẾT TƯƠNG TÁC
                                </div>
                                <div id="hanziQuizFeedback" style="font-size:12.5px;padding:8px 12px;border-radius:10px;background:#f8fafc;border:1px solid #e2e8f0;color:#475569;line-height:1.4;">
                                    💡 <b>Hướng dẫn:</b> Nhấn <b>"🎬 Xem mô phỏng"</b> để xem thứ tự nét viết, hoặc <b>"✍️ Bắt đầu tập viết"</b> để tự viết đè lên ô.
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
                        feedback.innerHTML = `✅ <b>VIẾT ĐÚNG!</b> Nét <b>${strokeData.strokeNum + 1}/${strokeData.totalStrokes}</b> đã hiển thị. Tiếp tục viết nét kế tiếp...`;
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
layout.className = 'lesson-wrapper';  // ← THÊM DÒNG NÀY
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

        // Lesson content
        const lessonDiv = document.createElement('div');
        lessonDiv.id = `vocab-lesson-${level}-${lesson.id}`;
        lessonDiv.className = 'lesson';
        if (index === 0) lessonDiv.classList.add('active');

        // Header banner bài học với nút Đánh dấu đã học
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

        // Tab nav
        const tabNav = document.createElement('div');
        tabNav.className = 'tab-nav';

        // Tab 1: Từ vựng
        const vocabTabBtn = document.createElement('button');
        vocabTabBtn.className = 'tab-btn active';
        vocabTabBtn.dataset.tab = 'vocab';
        vocabTabBtn.textContent = 'Từ vựng';
        vocabTabBtn.onclick = () => switchVocabTab(level, lesson.id, 'vocab');
        tabNav.appendChild(vocabTabBtn);

        // Tab 2: Bài tập (nếu có)
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

        // ===== TAB 1: TỪ VỰNG =====
        const vocabPane = document.createElement('div');
        vocabPane.id = `vocab-tab-${level}-${lesson.id}-vocab`;
        vocabPane.className = 'tab-pane active';

        const vocabCard = document.createElement('div');
        vocabCard.className = 'card';

        let words = [];
        if (lesson.tabs && lesson.tabs.length > 0) {
            const firstTab = lesson.tabs[0];
            if (firstTab.subcards && firstTab.subcards.length > 0) {
                const subcard = firstTab.subcards[0];
                if (subcard.type === 'vocab_list' && subcard.words) {
                    words = subcard.words;
                }
            }
        }

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
                        <button class="audio-btn" onclick="event.stopPropagation();playAudio('${(word.hanzi || word.cn || '').replace(/'/g, "\\'")}')" style="margin-left:auto;padding:4px 12px;border:none;border-radius:14px;background:#fce7f3;color:#be185d;font-weight:700;font-size:13px;cursor:pointer;display:inline-flex;align-items:center;gap:4px;" title="Nghe phát âm từ vựng">🔊</button>
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
                            <div class="example-label" style="font-weight:700;color:#db2777;margin-bottom:8px;font-size:13.5px;">💬 Ví dụ minh họa:</div>
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

        // ===== TAB 2: BÀI TẬP (NẾU CÓ) =====
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

// ================================================================
// RENDER EXERCISE ITEM (Hỗ trợ Multiple Choice, Fill Blank, Translation, Flashcard, Drag & Drop, Match)
// ================================================================
function renderExerciseItem(ex, idx, level, lessonId, totalCount, prefix = 'ex') {
    const exDiv = document.createElement('div');
    exDiv.className = 'exercise-item';
    exDiv.style.cssText = `
        margin-bottom: 20px;
        padding: 18px;
        background: #ffffff;
        border-radius: 12px;
        border: 1px solid #fce7f3;
        border-left: 5px solid #ec4899;
        box-shadow: 0 2px 8px rgba(212, 165, 255, 0.1);
    `;

    // 1. Xử lý nhận diện loại bài tập
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
        'drag_drop': '🧩 Kéo thả / Sắp xếp',
        'match': '🔗 Nối từ / Ghép đôi'
    };
    const typeLabel = typeLabels[exerciseType] || 'Bài tập';

    const headerDiv = document.createElement('div');
    headerDiv.style.cssText = `
        display:flex;justify-content:space-between;align-items:center;
        margin-bottom:12px;flex-wrap:wrap;gap:4px;
    `;
    headerDiv.innerHTML = `
        <span style="font-size:12px;background:#fce7f3;padding:3px 12px;border-radius:12px;color:#be185d;font-weight:700;">${typeLabel}</span>
        <span style="font-size:13px;color:#64748b;font-weight:500;">Câu ${idx + 1}/${totalCount || 1}</span>
    `;
    exDiv.appendChild(headerDiv);

    if (ex.question) {
        const qDiv = document.createElement('div');
        qDiv.style.cssText = 'font-weight:700;margin-bottom:12px;font-size:16px;color:#1e293b;line-height:1.4;';
        qDiv.textContent = ex.question;
        exDiv.appendChild(qDiv);
    }

    // ===== 1. TRẮC NGHIỆM (MULTIPLE CHOICE) =====
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
                            explanation: ex.explanation || ''
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

    // ===== 2. FLASHCARD =====
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

    // ===== 3. FILL IN THE BLANK (ĐIỀN TỪ) =====
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
                            explanation: ex.explanation || ''
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

    // ===== 4. TRANSLATION (DỊCH CÂU) =====
    else if (exerciseType === 'translation' && ex.items) {
        const transContainer = document.createElement('div');
        transContainer.style.cssText = 'display:flex;flex-direction:column;gap:10px;margin-top:8px;';
        ex.items.forEach((item, itemIdx) => {
            const itemDiv = document.createElement('div');
            itemDiv.className = 'trans-item';
            itemDiv.style.cssText = 'background:white;padding:12px 14px;border-radius:8px;border:1px solid #f0f0f0;';
            
            const sentenceDiv = document.createElement('div');
            sentenceDiv.style.cssText = 'font-size:15px;margin-bottom:6px;font-weight:600;color:#1e293b;';
            sentenceDiv.textContent = item.chinese || item.cn || '';
            itemDiv.appendChild(sentenceDiv);

            const inputRow = document.createElement('div');
            inputRow.style.cssText = 'display:flex;gap:8px;align-items:center;flex-wrap:wrap;';
            
            const inputId = `trans-input-${prefix}-${level}-${lessonId}-${idx}-${itemIdx}`;
            const input = document.createElement('input');
            input.type = 'text';
            input.id = inputId;
            input.style.cssText = 'flex:1;min-width:150px;border:1px solid #ddd;border-radius:6px;padding:6px 12px;font-size:14px;';
            input.placeholder = 'Nhập bản dịch tiếng Việt...';
            inputRow.appendChild(input);

            const checkBtn = document.createElement('button');
            checkBtn.textContent = '✅ Kiểm tra';
            checkBtn.style.cssText = 'padding:6px 16px;border:none;border-radius:12px;background:#ec4899;color:white;font-size:12px;font-weight:600;cursor:pointer;';
            
            checkBtn.onclick = function(e) {
                e.preventDefault();
                const inputEl = document.getElementById(inputId);
                const resultDiv = itemDiv.querySelector('.trans-result');
                const userAnswer = (inputEl ? inputEl.value : '').trim();
                const correctAnswer = item.vietnamese || item.vi || '';
                const isCorrect = userAnswer.toLowerCase() === correctAnswer.toLowerCase();
                if (isCorrect) {
                    resultDiv.innerHTML = `✅ Đúng! (${correctAnswer})`;
                    resultDiv.style.color = '#16a34a';
                    resultDiv.style.background = '#e8f5e9';
                    resultDiv.style.border = '1px solid #86efac';
                } else {
                    resultDiv.innerHTML = `
                        <div>❌ Chưa chính xác. Đáp án mẫu: <b>${correctAnswer}</b></div>
                        <div style="font-size:11px;margin-top:4px;color:#991b1b;font-weight:normal;">📌 Đã tự động lưu vào câu hỏi làm sai trong Trang cá nhân.</div>
                    `;
                    resultDiv.style.color = '#dc2626';
                    resultDiv.style.background = '#ffebee';
                    resultDiv.style.border = '1px solid #fca5a5';

                    if (typeof window.recordWrongExercise === 'function') {
                        window.recordWrongExercise({
                            level: level,
                            lessonTitle: 'Bài ' + lessonId,
                            question: item.chinese || item.cn || ex.question || 'Dịch câu',
                            type: 'translation',
                            userAnswer: userAnswer || 'Chưa nhập',
                            correctAnswer: correctAnswer,
                            explanation: ex.explanation || ''
                        });
                    }
                }
                resultDiv.style.display = 'block';
            };
            inputRow.appendChild(checkBtn);
            itemDiv.appendChild(inputRow);

            const resultDiv = document.createElement('div');
            resultDiv.className = 'trans-result';
            resultDiv.style.cssText = 'margin-top:8px;font-weight:600;font-size:13px;display:none;padding:6px 12px;border-radius:6px;';
            itemDiv.appendChild(resultDiv);
            transContainer.appendChild(itemDiv);
        });
        exDiv.appendChild(transContainer);
    }

    // ===== 5. DRAG AND DROP / SẮP XẾP TỪ (DRAG_DROP) =====
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
                        explanation: ex.explanation || ''
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

    // ===== 6. MATCHING / NỐI TỪ (MATCH) =====
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
                        explanation: ex.explanation || ''
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

    // ===== 7. UNKNOWN =====
    else {
        const unknownDiv = document.createElement('div');
        unknownDiv.style.cssText = 'color:#999;font-size:13px;padding:8px 0;';
        unknownDiv.textContent = `📌 Bài tập: ${JSON.stringify(ex).substring(0, 200)}...`;
        exDiv.appendChild(unknownDiv);
    }

    return exDiv;
}

// ================================================================
// SHOW VOCAB LESSON - GIỮ TAB HIỆN TẠI
// ================================================================
let currentVocabTab = 'vocab'; // Mặc định là tab từ vựng

function showVocabLesson(level, lessonNum, tabId) {
    if (tabId) {
        currentVocabTab = tabId;
    }
    
    // Ẩn tất cả lesson
    document.querySelectorAll('.lesson').forEach(el => el.classList.remove('active'));
    
    // Reset sidebar items
    document.querySelectorAll('.lesson-item').forEach(el => {
        el.classList.remove('active');
        el.style.cssText = 'padding:10px 20px;cursor:pointer;transition:all 0.3s ease;font-size:14px;color:#4a5568;border-left:3px solid transparent;display:flex;align-items:center;gap:8px;';
        const numSpan = el.querySelector('.lesson-num');
        if (numSpan) {
            numSpan.style.background = '#fce7f3';
            numSpan.style.color = '#be185d';
        }
    });
    
    // Hiển thị lesson được chọn
    const lessonEl = document.getElementById(`vocab-lesson-${level}-${lessonNum}`);
    if (lessonEl) {
        lessonEl.classList.add('active');
        lessonEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
    
    // Cập nhật active trong sidebar
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
    
    // Chuyển tab
    if (currentVocabTab) {
        switchVocabTab(level, lessonNum, currentVocabTab);
    }
}
// ================================================================
// SWITCH VOCAB TAB
// ================================================================
function switchVocabTab(level, lessonNum, tabId) {
    const lesson = document.getElementById(`vocab-lesson-${level}-${lessonNum}`);
    if (!lesson) return;

    // Tắt toàn bộ tab-btn
    lesson.querySelectorAll(".tab-btn").forEach(btn => {
        btn.classList.remove("active");
    });

    // Tắt toàn bộ tab-pane
    lesson.querySelectorAll(".tab-pane").forEach(pane => {
        pane.classList.remove("active");
    });

    // Bật button được chọn
    const targetBtn = lesson.querySelector(`.tab-btn[data-tab="${tabId}"]`);
    if (targetBtn) {
        targetBtn.classList.add("active");
    }

    // Bật pane tương ứng
    const pane = document.getElementById(`vocab-tab-${level}-${lessonNum}-${tabId}`);
    if (pane) {
        pane.classList.add("active");
    }
}
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
        // ================================================================
        // RENDER GRAMMAR LESSONS
        // ================================================================
        function renderGrammarLessons(level, data) {
            cachedData['grammar-' + level] = data;
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
                <div style="display:inline-block;background:rgba(255,255,255,0.6);padding:4px 16px;border-radius:20px;font-size:12px;font-weight:700;color:#be185d;border:1px solid rgba(236,72,153,0.2);margin-bottom:8px;">${data.badge || level.toUpperCase()}</div>
                <h1 style="font-family:'Lexend',sans-serif;font-size:28px;color:#be185d;">${data.title}</h1>
                ${data.subtitle ? `<div style="font-size:16px;color:#db2777;font-weight:500;">${data.subtitle}</div>` : ''}
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

                    if (tab.subcards) {
                        tab.subcards.forEach(sc => {
                            const subcard = document.createElement('div');
                            subcard.className = 'subcard';
                            if (sc.type === 'vocab_grid') {
                                const labelSpan = document.createElement('span');
                                labelSpan.className = 'label';
                                labelSpan.textContent = sc.label;
                                subcard.appendChild(labelSpan);
                                const gridDiv = document.createElement('div');
                                gridDiv.className = 'vocab-grid';
                                sc.items.forEach(item => {
                                    const itemDiv = document.createElement('div');
                                    itemDiv.className = 'vocab-item';
                                    itemDiv.innerHTML = `
                                        <span class="cn">${item.cn}</span>
                                        <span class="py">${item.py}</span>
                                    `;
                                    gridDiv.appendChild(itemDiv);
                                });
                                subcard.appendChild(gridDiv);
                            } else {
                                subcard.innerHTML = `
                                    <span class="label">${sc.label}</span>
                                    <p>${sc.text.replace(/\n/g, '<br>')}</p>
                                `;
                            }
                            grammarDiv.appendChild(subcard);
                        });
                    }

                    if (tab.examples) {
                        const exampleDiv = document.createElement('div');
                        exampleDiv.className = 'example';
                        tab.examples.forEach((ex, idx) => {
                            const label = document.createElement('span');
                            label.className = 'example-label';
                            label.innerHTML = `<b>例句${idx + 1}：</b>`;
                            exampleDiv.appendChild(label);

                            const audioDiv = document.createElement('div');
                            audioDiv.className = 'example-with-audio';
                            audioDiv.innerHTML = `
                                <div class="text-group">
                                    <div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap;">
                                        <span class="cn">${ex.cn}</span>
                                        <button onclick="togglePinyinForThis(event)" style="padding:3px 12px;border:none;border-radius:12px;background:#ec4899;color:white;font-size:11px;font-weight:600;cursor:pointer;">Phiên âm</button>
                                        <button onclick="toggleNghiaForThis(event)" style="padding:3px 12px;border:none;border-radius:12px;background:#8b5cf6;color:white;font-size:11px;font-weight:600;cursor:pointer;">Nghĩa</button>
                                    </div>
                                    <span class="py" style="display:none;">${ex.py}</span>
                                    <span class="vi" style="display:none;">${ex.vi}</span>
                                </div>
                                <button class="audio-btn" onclick="event.stopPropagation();playAudio('${ex.cn}')">🔊</button>
                            `;
                            exampleDiv.appendChild(audioDiv);
                            if (idx < tab.examples.length - 1) exampleDiv.appendChild(document.createElement('br'));
                        });
                        grammarDiv.appendChild(exampleDiv);
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
                    submitBtn.onclick = () => window.submitLessonExercises(level, lesson.id, exContainer, lesson.exercises, lesson.title || ('Bài ' + lesson.id));
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
                    if (ex.type === 'drag_drop' || ex.type === 'match' || ex.type === 'drag_and_drop' || ex.type === 'matching' || ex.pairs || ex.words || ex.left) {
                        const exItem = renderExerciseItem(ex, idx, 'practice', 1, data.exercises.length, 'practice-ex');
                        block.appendChild(exItem);
                    } else {
                        const qDiv = document.createElement('div');
                        qDiv.className = 'exercise-item';
                        qDiv.style.cssText = 'padding:16px 0;border-bottom:1px solid #fce7f3;';
                        qDiv.innerHTML = `
                            <div style="font-weight:600;color:#1e1e2a;margin-bottom:10px;font-size:15px;">${idx + 1}. ${ex.question}</div>
                            <div style="display:flex;flex-direction:column;gap:5px;padding-left:10px;">
                                ${ex.options ? ex.options.map((opt, oi) => `
                                    <label style="display:flex;align-items:center;gap:12px;padding:5px 12px;border-radius:8px;cursor:pointer;font-size:14px;">
                                        <input type="radio" name="q${idx}" value="${oi}" style="accent-color:#ec4899;width:16px;height:16px;cursor:pointer;" />
                                        ${opt}
                                    </label>
                                `).join('') : ''}
                            </div>
                        `;
                        block.appendChild(qDiv);
                    }
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
        window.submitLessonExercises = function(level, lessonId, containerEl, exercises, lessonTitle) {
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
                            explanation: ex.explanation || ''
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
            `;

            resultBanner.scrollIntoView({ behavior: 'smooth', block: 'center' });
        };

        // ================================================================
        // SWITCH TAB - ĐÃ SỬA
        // ================================================================
        function switchTab(level, lessonNum, tabId) {
    const lesson = document.getElementById(`lesson-${level}-${lessonNum}`);
    if (!lesson) return;

    // Tắt toàn bộ tab-btn
    lesson.querySelectorAll(".tab-btn").forEach(btn => {
        btn.classList.remove("active");
    });

    // Tắt toàn bộ tab-pane
    lesson.querySelectorAll(".tab-pane").forEach(pane => {
        pane.classList.remove("active");
    });

    // ✅ Chuyển tabId thành string để so sánh
    const tabIdStr = String(tabId);
    
    // Tìm button với data-tab khớp
    let targetBtn = null;
    lesson.querySelectorAll(".tab-btn").forEach(btn => {
        if (String(btn.dataset.tab) === tabIdStr) {
            targetBtn = btn;
        }
    });
    
    if (targetBtn) {
        targetBtn.classList.add("active");
    }

    // Bật pane tương ứng
    const pane = document.getElementById(`tab-${level}-${lessonNum}-${tabIdStr}`);
    if (pane) {
        pane.classList.add("active");
    }

    currentTab = tabIdStr;
}
        // ================================================================
        // SHOW LESSON
        // ================================================================
        function showLesson(level, lessonNum, tabId) {
            // Ẩn tất cả lesson
            document.querySelectorAll('.lesson').forEach(el => el.classList.remove('active'));
            
            // Ẩn tất cả lesson-item trong sidebar
            document.querySelectorAll('.lesson-item').forEach(el => {
                el.classList.remove('active');
                el.style.cssText = 'padding:10px 20px;cursor:pointer;transition:all 0.3s ease;font-size:14px;color:#4a5568;border-left:3px solid transparent;display:flex;align-items:center;gap:8px;';
                const numSpan = el.querySelector('.lesson-num');
                if (numSpan) {
                    numSpan.style.background = '#fce7f3';
                    numSpan.style.color = '#be185d';
                }
            });
            
            // Hiển thị lesson được chọn
            const lessonEl = document.getElementById(`lesson-${level}-${lessonNum}`);
            if (lessonEl) {
                lessonEl.classList.add('active');
                lessonEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
            
            // Cập nhật active trong sidebar - tìm bằng data attribute
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
            
            // Switch tab
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
            event.stopPropagation();
            const container = safeClosest(event.currentTarget, '.text-group');
            if (!container) return;
            const pyElement = container.querySelector('.py');
            const btn = event.currentTarget;
            if (pyElement.style.display === 'none') {
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
            event.stopPropagation();
            const container = safeClosest(event.currentTarget, '.text-group');
            if (!container) return;
            const viElement = container.querySelector('.vi');
            const btn = event.currentTarget;
            if (viElement.style.display === 'none') {
                viElement.style.display = 'block';
                btn.textContent = 'Ẩn nghĩa';
                btn.style.background = '#6d28d9';
            } else {
                viElement.style.display = 'none';
                btn.textContent = 'Nghĩa';
                btn.style.background = '#8b5cf6';
            }
        }

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
                        ${data.py ? `<div style="font-size:18px;color:#db2777;font-weight:700;">${escapeHtml(data.py)}</div>` : ''}
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
                backHtml += `<button onclick="event.stopPropagation();playAudio('${(data.cn || '').replace(/'/g, "\\'")}')" style="margin-top:10px;padding:6px 14px;border:none;border-radius:20px;background:#fce7f3;color:#be185d;font-weight:700;font-size:13px;cursor:pointer;">🔊 Nghe phát âm</button>`;
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
                        <button onclick="event.stopPropagation();playAudio('${(data.cn || '').replace(/'/g, "\\'")}')" style="margin-top:10px;padding:6px 14px;border:none;border-radius:20px;background:#fce7f3;color:#be185d;font-weight:700;font-size:13px;cursor:pointer;">🔊 Nghe phát âm</button>
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
    
    // Load tất cả dữ liệu
    (async function loadAllDataForSearch() {
        const modules = ['grammar', 'vocab', 'hanzi', 'practice', 'dictation', 'shadowing'];
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
        
        const modules = ['grammar', 'vocab', 'hanzi', 'practice', 'dictation', 'shadowing'];
        const levels = ['hsk1', 'hsk2', 'hsk3', 'hsk4', 'hsk5', 'hsk6'];
        
        // Module labels
        const moduleLabels = {
            grammar: '📝 Ngữ pháp',
            vocab: '📚 Từ vựng',
            hanzi: '🀄 Chữ Hán',
            practice: '📖 Luyện đề',
            dictation: '🎧 Nghe chép',
            shadowing: '🗣️ Shadowing'
        };
        
        const moduleColors = {
            grammar: '#EC4899',
            vocab: '#F59E0B',
            hanzi: '#8B5CF6',
            practice: '#10B981',
            dictation: '#06B6D4',
            shadowing: '#F472B6'
        };
        
        levels.forEach(levelId => {
            modules.forEach(moduleId => {
                const data = cachedData[`${moduleId}-${levelId}`];
                if (!data) return;
                
                // Tìm trong lessons (grammar, vocab)
                if (data.lessons) {
                    data.lessons.forEach(lesson => {
                        // Tìm trong lesson title
                        const lessonTitle = lesson.title || '';
                        if (lessonTitle.toLowerCase().includes(query)) {
                            const key = `${moduleId}-${levelId}-lesson-${lesson.id}`;
                            if (!resultsMap.has(key)) {
                                resultsMap.set(key, {
                                    module: moduleId,
                                    level: levelId,
                                    lessonId: lesson.id,
                                    title: lessonTitle,
                                    desc: `Bài ${lesson.id}: ${lessonTitle}`,
                                    moduleLabel: moduleLabels[moduleId] || moduleId,
                                    color: moduleColors[moduleId] || '#888'
                                });
                            }
                        }
                        
                        // Tìm trong tabs (grammar)
                        if (lesson.tabs) {
                            lesson.tabs.forEach(tab => {
                                let content = JSON.stringify(tab).toLowerCase();
                                if (content.includes(query)) {
                                    const key = `${moduleId}-${levelId}-lesson-${lesson.id}-tab-${tab.id}`;
                                    if (!resultsMap.has(key)) {
                                        // Lấy snippet từ examples hoặc subcards
                                        let snippet = '';
                                        if (tab.examples && tab.examples.length > 0) {
                                            snippet = tab.examples[0].cn || '';
                                        } else if (tab.subcards) {
                                            tab.subcards.forEach(sc => {
                                                if (sc.text) snippet = sc.text.substring(0, 80);
                                            });
                                        }
                                        
                                        resultsMap.set(key, {
                                            module: moduleId,
                                            level: levelId,
                                            lessonId: lesson.id,
                                            tabId: tab.id,
                                            title: `${lesson.title} - ${tab.title}`,
                                            desc: snippet ? '📝 ' + snippet : '',
                                            moduleLabel: moduleLabels[moduleId] || moduleId,
                                            color: moduleColors[moduleId] || '#888',
                                            isTab: true
                                        });
                                    }
                                }
                            });
                        }
                        
                        // Tìm trong exercises (grammar, vocab)
                        if (lesson.exercises) {
                            lesson.exercises.forEach((ex, idx) => {
                                let content = JSON.stringify(ex).toLowerCase();
                                if (content.includes(query)) {
                                    const key = `${moduleId}-${levelId}-lesson-${lesson.id}-ex-${idx}`;
                                    if (!resultsMap.has(key)) {
                                        resultsMap.set(key, {
                                            module: moduleId,
                                            level: levelId,
                                            lessonId: lesson.id,
                                            title: `${lesson.title} - Bài tập ${idx + 1}`,
                                            desc: ex.question ? '📝 ' + ex.question.substring(0, 80) : '',
                                            moduleLabel: moduleLabels[moduleId] || moduleId,
                                            color: moduleColors[moduleId] || '#888',
                                            isExercise: true
                                        });
                                    }
                                }
                            });
                        }
                    });
                }
                
                // Tìm trong chars (hanzi)
                const hanziList = data.chars || (Array.isArray(data) ? data : null);
                if (hanziList && Array.isArray(hanziList)) {
                    hanziList.forEach((charItem, idx) => {
                        let content = ((charItem.hanzi || charItem.cn || '') + ' ' + (charItem.pinyin || charItem.py || '') + ' ' + (charItem.meaning || charItem.vi || '') + ' ' + (charItem.story || '') + ' ' + (charItem.radical || '')).toLowerCase();
                        if (content.includes(query)) {
                            const charName = charItem.hanzi || charItem.cn || '';
                            const key = `${moduleId}-${levelId}-char-${charName || idx}`;
                            if (!resultsMap.has(key)) {
                                resultsMap.set(key, {
                                    module: 'hanzi',
                                    level: levelId,
                                    title: `Chữ Hán: ${charName} (${charItem.pinyin || charItem.py || ''})`,
                                    desc: charItem.meaning || charItem.vi ? `Nghĩa: ${charItem.meaning || charItem.vi}` : (charItem.story ? `Chiết tự: ${charItem.story}` : ''),
                                    moduleLabel: '🀄 Chữ Hán',
                                    color: '#8B5CF6',
                                    isHanzi: true,
                                    hanziChar: charName
                                });
                            }
                        }
                    });
                }

                // Tìm trong items (hanzi, practice, dictation, shadowing)
                if (data.items) {
                    data.items.forEach((item, idx) => {
                        let content = JSON.stringify(item).toLowerCase();
                        if (content.includes(query)) {
                            const key = `${moduleId}-${levelId}-item-${idx}`;
                            if (!resultsMap.has(key)) {
                                resultsMap.set(key, {
                                    module: moduleId,
                                    level: levelId,
                                    title: item.title || '',
                                    desc: item.desc || '',
                                    moduleLabel: moduleLabels[moduleId] || moduleId,
                                    color: moduleColors[moduleId] || '#888',
                                    isItem: true
                                });
                            }
                        }
                    });
                }
                
                // Tìm trong exercises (practice)
                if (data.exercises) {
                    data.exercises.forEach((ex, idx) => {
                        let content = JSON.stringify(ex).toLowerCase();
                        if (content.includes(query)) {
                            const key = `${moduleId}-${levelId}-ex-${idx}`;
                            if (!resultsMap.has(key)) {
                                resultsMap.set(key, {
                                    module: moduleId,
                                    level: levelId,
                                    title: `Bài tập ${idx + 1}`,
                                    desc: ex.question ? '📝 ' + ex.question.substring(0, 80) : '',
                                    moduleLabel: moduleLabels[moduleId] || moduleId,
                                    color: moduleColors[moduleId] || '#888',
                                    isPractice: true
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
    // Đóng dropdown
    document.getElementById('globalGrammarSearch').value = '';
    dropdown.style.display = 'none';
    
    // Lưu thông tin
    const targetModule = result.module;
    const targetLevel = result.level;
    const targetLessonId = result.lessonId || null;
    const targetTabId = result.tabId || null;
    const isTab = result.isTab || false;
    const isExercise = result.isExercise || false;
    
    // Cập nhật UI
    document.querySelectorAll('.hsk-item').forEach(el => el.classList.remove('active'));
    const levelBtn = document.querySelector(`.hsk-item[data-level="${targetLevel}"]`);
    if (levelBtn) levelBtn.classList.add('active');
    
    document.querySelectorAll('.feature-card').forEach(el => el.classList.remove('active'));
    const featureCard = document.querySelector(`.feature-card[data-module="${targetModule}"]`);
    if (featureCard) featureCard.classList.add('active');
    
    if (result.isHanzi && result.hanziChar) {
        (async function() {
            await showContent('hanzi', targetLevel);
            setTimeout(() => {
                if (typeof openHanziDetailModal === 'function') {
                    openHanziDetailModal(result.hanziChar);
                }
            }, 400);
        })();
        return;
    }

    // Gọi showContent (async) và đợi
    (async function() {
        await showContent(targetModule, targetLevel);
        
        // Đợi thêm 500ms để DOM render
        setTimeout(() => {
            if (isTab && targetLessonId && targetTabId) {
                if (targetModule === 'grammar') {
                    showLesson(targetLevel, targetLessonId, targetTabId);
                } else if (targetModule === 'vocab') {
                    showVocabLesson(targetLevel, targetLessonId, targetTabId);
                }
            } else if (isExercise && targetLessonId) {
                if (targetModule === 'grammar') {
                    showLesson(targetLevel, targetLessonId, '999');
                } else if (targetModule === 'vocab') {
                    showVocabLesson(targetLevel, targetLessonId, 'exercise');
                }
            }
            
            // Cuộn đến content
            setTimeout(() => {
                const contentArea = document.getElementById('contentArea');
                if (contentArea) {
                    contentArea.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }
            }, 300);
        }, 500);
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

    const sidebarItems = document.querySelectorAll('.lesson-sidebar .lesson-item');

    if (!q) {
        if (dropdown) dropdown.style.display = 'none';
        sidebarItems.forEach(item => item.style.display = 'flex');
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
        const itemLessonId = parseInt(item.dataset.lessonId);
        if (matchingLessonIds.has(itemLessonId)) {
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

                    showLesson(lvl, lid, tid);

                    setTimeout(() => {
                        const targetPane = document.getElementById(`tab-${lvl}-${lid}-${tid}`) || document.getElementById(`lesson-${lvl}-${lid}`);
                        if (targetPane) {
                            targetPane.scrollIntoView({ behavior: 'smooth', block: 'center' });
                            targetPane.style.transition = 'all 0.4s ease';
                            targetPane.style.outline = '3px solid #be185d';
                            targetPane.style.borderRadius = '12px';
                            setTimeout(() => {
                                targetPane.style.outline = 'none';
                            }, 3000);
                        }
                    }, 200);
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

    const sidebarItems = document.querySelectorAll('.lesson-sidebar .lesson-item');
    const wordCards = document.querySelectorAll('.vocab-word-card');

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

        let words = [];
        if (lesson.tabs && lesson.tabs.length > 0) {
            const firstTab = lesson.tabs[0];
            if (firstTab.subcards && firstTab.subcards.length > 0) {
                const subcard = firstTab.subcards[0];
                if (subcard.type === 'vocab_list' && subcard.words) {
                    words = subcard.words;
                }
            }
        }

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
        const itemLessonId = parseInt(item.dataset.lessonId);
        if (matchingLessonIds.has(itemLessonId)) {
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
                    const lid = parseInt(this.dataset.lessonId);
                    const hanzi = this.dataset.hanzi;
                    dropdown.style.display = 'none';

                    showVocabLesson(lvl, lid, 'vocab');

                    setTimeout(() => {
                        const targetCard = document.querySelector(`#vocab-lesson-${lvl}-${lid} .vocab-word-card[data-hanzi="${hanzi}"]`) ||
                                           document.querySelector(`#vocab-lesson-${lvl}-${lid} .vocab-word-card`);
                        if (targetCard) {
                            targetCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
                            targetCard.style.transition = 'all 0.4s ease';
                            targetCard.style.outline = '3px solid #ec4899';
                            targetCard.style.background = '#fff1f2';
                            setTimeout(() => {
                                targetCard.style.outline = 'none';
                                targetCard.style.background = '#f8f9fa';
                            }, 3000);
                        }
                    }, 200);
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
    currentLevel = 'hsk1';
    saveState('grammar', 'hsk1');
}

        // ================================================================
        // EVENT LISTENERS
        // ================================================================
        document.querySelectorAll('.feature-card').forEach(card => {
            card.addEventListener('click', function() {
                const module = this.dataset.module;
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
    currentLevel = savedState.level;
    
    // Cập nhật UI
    document.querySelectorAll('.feature-card').forEach(el => el.classList.remove('active'));
    const activeCard = document.querySelector(`.feature-card[data-module="${savedState.module}"]`);
    if (activeCard) activeCard.classList.add('active');
    
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
