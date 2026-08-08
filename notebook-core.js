/**
 * Core engine for Xueying Digital Hanzi Notebook (Vở Ghi Chép Luyện Viết Điện Tử Khổ A4)
 * Handled entirely via vector canvas drawings, HanziWriter animations, and high-performance overlays.
 */

(function() {
    // Escape HTML strings for safety
    function escapeHtml(str) {
        if (!str) return '';
        return String(str)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }

    // State managers
    window.notebookStrokes = [];
    window.notebookIsLandscape = false;
    window.notebookShowGuideText = true;
    window.notebookPenColor = '#1e293b'; // slate 800 - elegant ink
    window.notebookPenWidth = 4; // medium size

    let isFsAnimating = false;
    let isFsPaused = false;

    // Standard stroke names translation
    window.getStrokeNameVietnamese = function(name) {
        const map = {
            "横": "Ngang (Héng)",
            "竖": "Sổ (Shù)",
            "撇": "Phẩy (Piě)",
            "捺": "Mác (Nà)",
            "点": "Chấm (Diǎn)",
            "提": "Hất (Tí)",
            "折": "Gập (Zhé)",
            "钩": "Móc (Gōu)",
            "横折": "Ngang Gập (Héng Zhé)",
            "横钩": "Ngang Móc (Héng Gōu)",
            "竖折": "Sổ Gập (Shù Zhé)",
            "竖钩": "Sổ Móc (Shù Gōu)",
            "弯钩": "Cong Móc (Wān Gōu)",
            "斜钩": "Nghiêng Móc (Xié Gōu)",
            "撇点": "Phẩy Chấm (Piě Diǎn)",
            "竖提": "Sổ Hất (Shù Tí)",
            "横折钩": "Ngang Gập Móc (Héng Zhé Gōu)",
            "竖折折": "Sổ Gập Gập",
            "竖折折钩": "Sổ Gập Gập Móc",
            "横撇": "Ngang Phẩy",
            "横折弯钩": "Ngang Gập Cong Móc"
        };
        return map[name] || name;
    };

    // Main entry point for Tab Rendering inside Personal Profile
    window.renderNotebookTabCore = function(container, profile) {
        const user = (window.auth && window.auth.currentUser) ? window.auth.currentUser : null;
        const uid = user ? user.uid : 'guest';
        
        container.innerHTML = `
            <style>
            .nb-stats-grid {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
                gap: 16px;
                margin-bottom: 24px;
            }
            .nb-stats-card {
                background: white;
                border: 1.5px solid #e2e8f0;
                border-radius: 16px;
                padding: 18px 24px;
                display: flex;
                align-items: center;
                gap: 16px;
                box-shadow: 0 4px 10px rgba(0,0,0,0.01);
            }
            .nb-stats-num {
                font-size: 32px;
                font-weight: 800;
                color: #be185d;
                line-height: 1;
            }
            .nb-gallery-grid {
                display: grid;
                grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
                gap: 16px;
            }
            .nb-gallery-item {
                background: white;
                border: 1.5px solid #e2e8f0;
                border-radius: 14px;
                overflow: hidden;
                transition: all 0.2s ease;
                box-shadow: 0 2px 6px rgba(0,0,0,0.02);
            }
            .nb-gallery-item:hover {
                transform: translateY(-4px);
                box-shadow: 0 10px 20px rgba(190, 24, 93, 0.08);
                border-color: #fbcfe8;
            }
            </style>
            
            <div style="max-width: 1000px; margin: 0 auto; display: flex; flex-direction: column; gap: 24px; padding: 12px;">
                <!-- Branded Header -->
                <div style="background: white; border: 1.5px solid #e2e8f0; border-radius: 20px; padding: 20px 24px; display: flex; flex-wrap: wrap; justify-content: space-between; align-items: center; gap: 16px; box-shadow: 0 4px 12px rgba(0,0,0,0.01);">
                    <div style="display: flex; align-items: center; gap: 16px;">
                        <div style="background: linear-gradient(135deg, #be185d, #db2777); padding: 10px 16px; border-radius: 12px; border: 1.5px solid rgba(255,255,255,0.2); text-align: center; color: white;">
                            <span style="font-size: 15px; font-weight: 800; letter-spacing: 0.5px; display: block;">学赢中文</span>
                            <span style="font-size: 8px; opacity: 0.8; font-weight: 600; text-transform: uppercase; display: block; margin-top: 1px;">Xueying Chinese</span>
                        </div>
                        <div>
                            <h2 style="font-size: 18px; font-weight: 800; color: #1e293b; margin: 0; font-family:'Lexend',sans-serif;">Học Viên: ${escapeHtml(profile.name || 'Học Viên')}</h2>
                            <p style="font-size: 13px; color: #64748b; margin: 4px 0 0 0;">Trình độ: <span style="font-weight: 700; color: #be185d; text-transform: uppercase;">${escapeHtml((profile.level || 'hsk1').toUpperCase())}</span></p>
                        </div>
                    </div>
                    
                    <div class="nb-stats-grid" style="margin-bottom: 0;">
                        <div class="nb-stats-card" style="padding: 12px 20px; border-radius:12px;">
                            <div style="font-size: 26px;">📝</div>
                            <div>
                                <div class="nb-stats-num" id="nb-stats-completed">0</div>
                                <div style="font-size: 11px; font-weight: 700; color: #64748b; margin-top: 1px; text-transform: uppercase; letter-spacing: 0.5px;">Trang đã viết</div>
                            </div>
                        </div>
                    </div>
                </div>
                
                <!-- Launch Banner -->
                <div style="background: linear-gradient(135deg, #fdf2f8, #fce7f3); border: 1.5px solid #fbcfe8; border-radius: 20px; padding: 32px 24px; text-align: center; box-shadow: 0 4px 15px rgba(219, 39, 119, 0.04);">
                    <div style="font-size: 48px; margin-bottom: 12px; animation: pulse 2s infinite;">✍️</div>
                    <h3 style="font-size: 22px; font-weight: 800; color: #be185d; margin: 0 0 10px 0; font-family:'Lexend',sans-serif;">Vở Luyện Viết Chữ Hán Điện Tử (Toàn Màn Hình)</h3>
                    <p style="font-size: 14.5px; color: #475569; max-width: 620px; margin: 0 auto 24px auto; line-height: 1.6;">
                        Không gian luyện viết chữ Hán ngập tràn màn hình giả lập tỉ lệ khổ giấy A4 (Dọc/Ngang). Hỗ trợ viết liền mạch đa ô mễ bằng ngón tay hoặc chuột, tích hợp mô phỏng bút thuận HanziWriter chuyên nghiệp và tải xuống thành phẩm của bạn!
                    </p>
                    <button onclick="window.openFullScreenNotebook()" style="padding: 14px 32px; background: linear-gradient(135deg, #be185d, #db2777); color: white; border: none; border-radius: 14px; font-size: 15.5px; font-weight: 800; cursor: pointer; display: inline-flex; align-items: center; gap: 10px; box-shadow: 0 10px 20px rgba(190, 24, 93, 0.2); transition: all 0.2s; outline: none; font-family:'Lexend',sans-serif;">
                        <span>🚀 Mở Vở Tập Viết Toàn Màn Hình</span>
                    </button>
                </div>
                
                <!-- Saved sheets gallery list -->
                <div style="display: flex; flex-direction: column; gap: 16px; margin-top: 12px;">
                    <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1.5px solid #e2e8f0; padding-bottom: 10px;">
                        <h3 style="font-size: 16px; font-weight: 800; color: #1e293b; margin: 0; font-family:'Lexend',sans-serif; display: flex; align-items: center; gap: 6px;">
                            🎨 Các Trang Viết Đã Lưu
                        </h3>
                        <button id="nb-clear-gallery-btn" style="background: transparent; color: #e11d48; border: none; font-size: 13px; font-weight: 700; cursor: pointer; display: flex; align-items: center; gap: 4px;" onclick="window.clearNotebookGallery()">
                            🗑️ Xóa tất cả trang viết
                        </button>
                    </div>
                    
                    <div id="nb-gallery-loading" style="text-align: center; padding: 40px; color: #64748b;">
                        <div style="font-size: 24px; animation: spin 1s linear infinite; display: inline-block; margin-bottom: 8px;">⌛</div>
                        <div style="font-size: 14px; font-weight: 600;">Đang tải bộ sưu tập...</div>
                    </div>
                    
                    <div id="nb-gallery-empty" style="display: none; text-align: center; padding: 48px 24px; background: #f8fafc; border: 1.5px dashed #cbd5e1; border-radius: 16px; color: #64748b;">
                        <div style="font-size: 40px; margin-bottom: 12px;">📭</div>
                        <h4 style="font-size: 15px; font-weight: 700; color: #334155; margin: 0 0 6px 0;">Vở ghi chép trống</h4>
                        <p style="font-size: 13px; margin: 0; max-width: 320px; margin: 0 auto; line-height: 1.5;">Bạn chưa lưu trang viết nào. Hãy mở Vở Luyện Viết Toàn Màn Hình để bắt đầu!</p>
                    </div>
                    
                    <div id="nb-gallery-list" class="nb-gallery-grid"></div>
                </div>
            </div>
        `;
        
        // Render gallery on load
        window.renderNotebookGalleryCore();
    };

    // Load & display worksheets gallery
    window.renderNotebookGalleryCore = function() {
        const user = (window.auth && window.auth.currentUser) ? window.auth.currentUser : null;
        const uid = user ? user.uid : 'guest';
        const nbKey = 'xueying_hanzi_notebook_' + uid;
        
        let notebookItems = [];
        try {
            const saved = localStorage.getItem(nbKey);
            if (saved) notebookItems = JSON.parse(saved);
        } catch(e) {
            console.warn('Error parsing notebook gallery:', e);
        }
        
        // Update stats
        const statsNum = document.getElementById('nb-stats-completed');
        if (statsNum) statsNum.textContent = notebookItems.length;
        
        const loading = document.getElementById('nb-gallery-loading');
        const empty = document.getElementById('nb-gallery-empty');
        const list = document.getElementById('nb-gallery-list');
        
        if (!list) return;
        
        if (loading) loading.style.display = 'none';
        list.innerHTML = '';
        
        if (notebookItems.length === 0) {
            if (empty) empty.style.display = 'block';
            return;
        }
        
        if (empty) empty.style.display = 'none';
        
        // Render cards
        notebookItems.forEach((item, idx) => {
            const card = document.createElement('div');
            card.className = 'nb-gallery-item';
            
            const dateStr = item.dateStr || '--/--/----';
            const timeStr = item.timeStr || '--:--';
            const charLabel = item.char ? `Chữ mẫu: "${item.char}"` : 'Tập viết tự do';
            
            card.innerHTML = `
                <div style="position: relative; width: 100%; aspect-ratio: 800/1130; background: #fdfdfd; overflow: hidden; border-bottom: 1.5px solid #e2e8f0; display: flex; align-items: center; justify-content: center; cursor: pointer;" onclick="window.openLightboxNotebook(${idx})">
                    <img src="${item.image}" style="width: 100%; height: 100%; object-fit: contain; transition: all 0.3s;" />
                    <div style="position: absolute; inset:0; background:rgba(0,0,0,0.4); display:flex; align-items:center; justify-content:center; opacity:0; transition:all 0.2s;" onmouseover="this.style.opacity=1" onmouseout="this.style.opacity=0">
                        <span style="color:white; font-size:13px; font-weight:800; background:rgba(190,24,93,0.95); padding:8px 16px; border-radius:20px;">🔍 Xem phóng to</span>
                    </div>
                </div>
                <div style="padding: 12px 14px;">
                    <div style="font-size: 13.5px; font-weight: 800; color: #1e293b; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">${charLabel}</div>
                    <div style="font-size: 11px; color: #64748b; margin-top: 2px;">📅 ${dateStr} lúc ${timeStr}</div>
                    
                    <div style="display: flex; gap: 6px; margin-top: 12px;">
                        <button onclick="window.downloadNotebookItem(${idx})" style="flex:1; padding:7px; background:#f1f5f9; border:none; border-radius:8px; font-size:11.5px; font-weight:700; color:#475569; cursor:pointer; display:flex; align-items:center; justify-content:center; gap:4px; outline:none;">📥 Tải về</button>
                        <button onclick="window.deleteNotebookItem(${idx})" style="padding:7px 10px; background:#fff1f2; border:none; border-radius:8px; font-size:11.5px; font-weight:700; color:#e11d48; cursor:pointer; outline:none;" title="Xóa trang">🗑️</button>
                    </div>
                </div>
            `;
            list.appendChild(card);
        });
    };

    window.downloadNotebookItem = function(index) {
        const user = (window.auth && window.auth.currentUser) ? window.auth.currentUser : null;
        const uid = user ? user.uid : 'guest';
        const nbKey = 'xueying_hanzi_notebook_' + uid;
        
        try {
            const saved = localStorage.getItem(nbKey);
            if (!saved) return;
            const items = JSON.parse(saved);
            const item = items[index];
            if (!item) return;
            
            const link = document.createElement('a');
            link.download = `Xueying_Calligraphy_${item.char || 'worksheet'}_${Date.now()}.png`;
            link.href = item.image;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        } catch(e) {
            console.error('Error downloading notebook image:', e);
        }
    };

    window.deleteNotebookItem = function(index) {
        if (!confirm('Bạn có chắc chắn muốn xóa trang viết này không?')) return;
        
        const user = (window.auth && window.auth.currentUser) ? window.auth.currentUser : null;
        const uid = user ? user.uid : 'guest';
        const nbKey = 'xueying_hanzi_notebook_' + uid;
        
        try {
            const saved = localStorage.getItem(nbKey);
            if (!saved) return;
            const items = JSON.parse(saved);
            items.splice(index, 1);
            localStorage.setItem(nbKey, JSON.stringify(items));
            window.renderNotebookGalleryCore();
        } catch(e) {
            console.error('Error deleting notebook image:', e);
        }
    };

    window.clearNotebookGallery = function() {
        if (!confirm('⚠️ CẢNH BÁO: Bạn có chắc chắn muốn XÓA SẠCH toàn bộ trang viết đã lưu không? Hành động này không thể khôi phục.')) return;
        
        const user = (window.auth && window.auth.currentUser) ? window.auth.currentUser : null;
        const uid = user ? user.uid : 'guest';
        const nbKey = 'xueying_hanzi_notebook_' + uid;
        
        try {
            localStorage.removeItem(nbKey);
            window.renderNotebookGalleryCore();
        } catch(e) {
            console.error('Error clearing gallery:', e);
        }
    };

    window.openLightboxNotebook = function(index) {
        const user = (window.auth && window.auth.currentUser) ? window.auth.currentUser : null;
        const uid = user ? user.uid : 'guest';
        const nbKey = 'xueying_hanzi_notebook_' + uid;
        
        try {
            const saved = localStorage.getItem(nbKey);
            if (!saved) return;
            const items = JSON.parse(saved);
            const item = items[index];
            if (!item) return;
            
            let lightbox = document.getElementById('nb-lightbox-modal');
            if (!lightbox) {
                lightbox = document.createElement('div');
                lightbox.id = 'nb-lightbox-modal';
                lightbox.className = 'modal-overlay';
                lightbox.style.cssText = "position:fixed; inset:0; z-index:200000; background:rgba(15,23,42,0.85); backdrop-filter:blur(4px); display:none; align-items:center; justify-content:center; padding:20px;";
                document.body.appendChild(lightbox);
            }
            
            lightbox.innerHTML = `
                <div style="background:white; border-radius:20px; width:100%; max-width:640px; display:flex; flex-direction:column; overflow:hidden; box-shadow:0 25px 50px -12px rgba(0,0,0,0.5); animation: zoomIn 0.2s ease-out;">
                    <style>
                    @keyframes zoomIn {
                        from { transform: scale(0.95); opacity: 0; }
                        to { transform: scale(1); opacity: 1; }
                    }
                    </style>
                    <div style="padding:16px 20px; border-bottom:1px solid #f1f5f9; display:flex; justify-content:space-between; align-items:center; background:#f8fafc;">
                        <div>
                            <h3 style="margin:0; font-size:15px; font-weight:800; color:#1e293b; font-family:'Lexend',sans-serif;">Tác Phẩm Luyện Viết Chữ Hán</h3>
                            <p style="margin:2px 0 0 0; font-size:11.5px; color:#64748b;">📅 ${item.dateStr || '--'} lúc ${item.timeStr || '--'}</p>
                        </div>
                        <button onclick="document.getElementById('nb-lightbox-modal').style.display='none'" style="background:#f1f5f9; border:none; border-radius:50%; width:32px; height:32px; font-size:14px; cursor:pointer; color:#64748b; font-weight:bold; display:flex; align-items:center; justify-content:center; outline:none;">✕</button>
                    </div>
                    <div style="padding:24px; flex:1; overflow-y:auto; display:flex; justify-content:center; align-items:center; background:#eaeef3; max-height:calc(80vh - 120px);">
                        <img src="${item.image}" style="max-width:100%; max-height:100%; object-fit:contain; border-radius:4px; box-shadow:0 10px 25px rgba(0,0,0,0.15);" />
                    </div>
                    <div style="padding:16px 20px; background:white; border-top:1px solid #f1f5f9; display:flex; gap:12px;">
                        <button onclick="document.getElementById('nb-lightbox-modal').style.display='none'" style="flex:1; padding:10px 14px; background:#f1f5f9; border:none; border-radius:10px; font-size:13px; font-weight:700; color:#475569; cursor:pointer; outline:none; font-family:'Lexend',sans-serif;">Đóng lại</button>
                        <button onclick="window.downloadNotebookItem(${index})" style="flex:1; padding:10px 14px; background:linear-gradient(135deg,#3b82f6,#1d4ed8); color:white; border:none; border-radius:10px; font-size:13px; font-weight:700; cursor:pointer; box-shadow:0 4px 12px rgba(59,130,246,0.25); display:flex; align-items:center; justify-content:center; gap:6px; outline:none; font-family:'Lexend',sans-serif;">📥 Tải Ảnh PNG</button>
                    </div>
                </div>
            `;
            lightbox.style.display = 'flex';
        } catch(e) {
            console.error('Error opening lightbox:', e);
        }
    };

    // Open Fullscreen A4 Notebook
    window.openFullScreenNotebook = function() {
        const user = (window.auth && window.auth.currentUser) ? window.auth.currentUser : null;
        const uid = user ? user.uid : 'guest';
        const profile = window.getUserProfile ? window.getUserProfile(uid) : { name: 'Học Viên', level: 'hsk1' };
        
        const studentName = profile.name || 'Học Viên';
        const studentLvl = (profile.level || 'hsk1').toUpperCase();
        
        const now = new Date();
        const dateStr = now.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
        
        let overlay = document.getElementById('fs-notebook-overlay');
        if (overlay) {
            overlay.style.display = 'flex';
            document.body.style.overflow = 'hidden';
            window.initFsNotebookState(studentName, studentLvl, dateStr);
            return;
        }
        
        overlay = document.createElement('div');
        overlay.id = 'fs-notebook-overlay';
        overlay.style.cssText = "position:fixed; inset:0; z-index:999999; background:#eaeef3; display:flex; flex-direction:column; overflow:hidden; font-family:'Lexend',sans-serif;";
        document.body.appendChild(overlay);
        
        // Append CSS style once
        if (!document.getElementById('fs-notebook-styles')) {
            const style = document.createElement('style');
            style.id = 'fs-notebook-styles';
            style.innerHTML = `
                @media (min-width: 1024px) {
                    #fs-notebook-sidebar {
                        width: 450px !important; /* Increase sidebar width on desktop */
                    }
                    #fs-notebook-sidebar.collapsed {
                        width: 0px !important;
                        border-right-width: 0px !important;
                        overflow: hidden !important;
                        opacity: 0 !important;
                        pointer-events: none !important;
                    }
                    #fs-lesson-select {
                        display: none !important; /* Hide standard select dropdown on desktop */
                    }
                    #fs-lesson-chips {
                        display: flex !important; /* Show spread-out chips on desktop */
                    }
                }
                @media (max-width: 1023px) {
                    #fs-notebook-sidebar {
                        position: absolute;
                        top: 0;
                        left: 0;
                        width: 320px !important;
                        transform: translateX(-100%);
                        box-shadow: 5px 0 25px rgba(0,0,0,0.15);
                    }
                    #fs-notebook-sidebar.open {
                        transform: translateX(0);
                    }
                    #fs-sidebar-toggle-btn {
                        display: flex !important;
                    }
                    #fs-lesson-select {
                        display: block !important;
                    }
                    #fs-lesson-chips {
                        display: none !important;
                    }
                }
                .fs-lesson-chip-btn {
                    padding: 3px 8px;
                    border: 1.5px solid #cbd5e1;
                    border-radius: 12px;
                    font-size: 9px;
                    font-weight: 700;
                    color: #475569;
                    background: white;
                    cursor: pointer;
                    transition: all 0.15s ease;
                    outline: none;
                    white-space: nowrap;
                }
                .fs-lesson-chip-btn:hover {
                    border-color: #be185d;
                    color: #be185d;
                    background: #fff5f8;
                }
                .fs-char-btn {
                    width: 52px;
                    height: 52px;
                    border: 1.5px solid #e2e8f0;
                    background: white;
                    border-radius: 12px;
                    font-size: 24px;
                    font-weight: bold;
                    color: #334155;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    transition: all 0.15s ease;
                }
                .fs-char-btn:hover {
                    border-color: #be185d;
                    background: #fff5f8;
                    color: #be185d;
                }
                .fs-char-btn.active {
                    background: #be185d;
                    color: white;
                    border-color: #be185d;
                    box-shadow: 0 4px 10px rgba(190, 24, 93, 0.25);
                }
                .nb-stroke-badge {
                    display: inline-flex;
                    align-items: center;
                    background: #f8fafc;
                    border: 1.5px solid #e2e8f0;
                    padding: 4px 10px;
                    border-radius: 20px;
                    font-size: 11px;
                    font-weight: 700;
                    color: #475569;
                    white-space: nowrap;
                }
                .nb-stroke-badge.active {
                    background: #fdf2f8;
                    border-color: #fbcfe8;
                    color: #be185d;
                    box-shadow: 0 2px 4px rgba(190,24,93,0.05);
                }
                @keyframes spin {
                    to { transform: rotate(360deg); }
                }
            `;
            document.head.appendChild(style);
        }
        
        overlay.innerHTML = `
            <!-- FIXED HEADER -->
            <div style="background: linear-gradient(135deg, #be185d, #db2777); color: white; height: 75px; padding: 0 24px; display: flex; justify-content: space-between; align-items: center; box-shadow: 0 4px 15px rgba(190, 24, 93, 0.2); z-index: 1000;">
                <div style="display: flex; align-items: center; gap: 14px;">
                    <div style="background: rgba(255,255,255,0.15); padding: 6px 12px; border-radius: 10px; border: 1.5px solid rgba(255,255,255,0.25); text-align: center;">
                        <span style="font-size: 15px; font-weight: 800; letter-spacing: 0.5px; display: block;">学赢中文</span>
                        <span style="font-size: 8px; opacity: 0.8; font-weight: 600; text-transform: uppercase; display: block; margin-top: 1px;">Xueying Chinese</span>
                    </div>
                    <div>
                        <h2 style="font-size: 16px; font-weight: 800; margin: 0; color: white;">Vở Luyện Viết Chữ Hán Khổ A4</h2>
                        <p style="font-size: 11px; margin: 2px 0 0 0; opacity: 0.85;">Khung tập viết điện tử chuyên nghiệp tràn màn hình</p>
                    </div>
                </div>
                
                <!-- Center Avatar & Student Info -->
                <div style="display: flex; align-items: center; gap: 12px; background: rgba(0,0,0,0.12); padding: 6px 16px; border-radius: 50px; border: 1px solid rgba(255,255,255,0.15);">
                    <img src="images/avatar.png" onerror="this.src='https://cdn-icons-png.flaticon.com/512/3135/3135715.png'" style="width: 34px; height: 34px; border-radius: 50%; border: 1.5px solid white; object-fit: cover;" alt="Avatar" />
                    <div style="text-align: left;">
                        <div style="font-size: 13px; font-weight: 800; color: white;" id="fs-student-name">Học Viên</div>
                        <div style="font-size: 10.5px; opacity: 0.9; margin-top: 1px;" id="fs-writing-date">Luyện tập: --</div>
                    </div>
                </div>
                
                <!-- Right Action Controls -->
                <div style="display: flex; align-items: center; gap: 10px;">
                    <button onclick="window.toggleFsSidebar()" style="padding: 8px 14px; background: rgba(255,255,255,0.15); color: white; border: 1px solid rgba(255,255,255,0.25); border-radius: 10px; font-size: 12.5px; font-weight: 700; cursor: pointer; display: flex; align-items: center; gap: 6px; transition: all 0.2s; outline: none;">
                        📋 <span id="fs-sidebar-toggle-text">Ẩn Thanh Trái</span>
                    </button>
                    <button onclick="window.toggleNotebookOrientation()" style="padding: 8px 14px; background: rgba(255,255,255,0.15); color: white; border: 1px solid rgba(255,255,255,0.25); border-radius: 10px; font-size: 12.5px; font-weight: 700; cursor: pointer; display: flex; align-items: center; gap: 6px; transition: all 0.2s; outline: none;">
                        <span id="fs-orientation-icon">↔️</span> <span id="fs-orientation-text">Khổ Ngang</span>
                    </button>
                    <button onclick="window.closeFullScreenNotebook()" style="padding: 8px 14px; background: #fff; color: #be185d; border: none; border-radius: 10px; font-size: 12.5px; font-weight: 800; cursor: pointer; display: flex; align-items: center; gap: 6px; box-shadow: 0 4px 10px rgba(0,0,0,0.06); transition: all 0.2s; outline: none;">
                        🚪 Thoát Vở Viết
                    </button>
                </div>
            </div>
            
            <!-- MAIN WORKSPACE -->
            <div style="flex: 1; display: flex; position: relative; overflow: hidden;">
                <!-- LEFT SIDE PANEL (Character Search & Stroke Guide) -->
                <div id="fs-notebook-sidebar" style="width: 360px; background: white; border-right: 1.5px solid #e2e8f0; display: flex; flex-direction: column; transition: all 0.3s ease; z-index: 500; height: 100%;">
                    <!-- Header and selectors -->
                    <div style="padding: 16px; border-bottom: 1.5px solid #f1f5f9; display: flex; flex-direction: column; gap: 12px; background: #fafafa;">
                        <h3 style="margin: 0; font-size: 14.5px; font-weight: 800; color: #1e293b; display: flex; align-items: center; gap: 6px; font-family:'Lexend',sans-serif;">
                            🔍 Chọn Chữ & Bút Thuận
                        </h3>
                        
                        <!-- Filters -->
                        <div style="display: flex; flex-direction: column; gap: 8px;">
                            <div>
                                <label style="display:block; font-size:10.5px; font-weight:700; color:#64748b; text-transform:uppercase; margin-bottom:4px;">Nguồn chữ:</label>
                                <select id="fs-source-select" onchange="window.loadFsNotebookSource(this.value)" style="width:100%; padding:8px; border:1.5px solid #cbd5e1; border-radius:8px; font-size:11.5px; font-weight:700; color:#334155; background:white; cursor:pointer; outline:none;">
                                    <option value="hsk1">Chữ Hán HSK 1</option>
                                    <option value="hsk2">Chữ Hán HSK 2</option>
                                    <option value="mistakes">Từ làm sai & Flashcard</option>
                                    <option value="custom">Nhập từ tự do</option>
                                </select>
                            </div>
                            
                            <div id="fs-lesson-container">
                                <label style="display:block; font-size:10.5px; font-weight:700; color:#64748b; text-transform:uppercase; margin-bottom:4px;">Bài học:</label>
                                <select id="fs-lesson-select" onchange="window.filterFsCharactersByLesson(this.value)" style="width:100%; padding:8px; border:1.5px solid #cbd5e1; border-radius:8px; font-size:11.5px; font-weight:700; color:#334155; background:white; cursor:pointer; outline:none;">
                                </select>
                                <div id="fs-lesson-chips" style="display: none; flex-wrap: wrap; gap: 6px; max-height: 120px; overflow-y: auto; padding: 2px;">
                                </div>
                            </div>
                            
                            <div id="fs-custom-container" style="display:none;">
                                <label style="display:block; font-size:10.5px; font-weight:700; color:#64748b; text-transform:uppercase; margin-bottom:4px;">Nhập chữ Hán tự chọn:</label>
                                <div style="display:flex; gap:6px;">
                                    <input type="text" id="fs-custom-input" placeholder="Ví dụ: 学" maxlength="10" style="flex:1; padding:8px; border:1.5px solid #cbd5e1; border-radius:8px; font-size:11.5px; font-weight:700; color:#334155; outline:none;" />
                                    <button onclick="window.applyFsCustomInput()" style="padding:8px 14px; background:#be185d; color:white; border:none; border-radius:8px; font-size:12.5px; font-weight:700; cursor:pointer; outline:none;">Dùng</button>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <!-- Grid list of characters -->
                    <div style="flex: 1; overflow-y: auto; padding: 16px; border-bottom: 1.5px solid #f1f5f9; display: flex; flex-direction: column; gap: 10px;">
                        <div style="display: flex; justify-content: space-between; align-items: center; font-size: 12px; font-weight: 700; color: #475569;">
                            <span>Danh sách chữ Hán:</span>
                            <span id="fs-grid-count" style="color: #be185d;">0 chữ</span>
                        </div>
                        
                        <div id="fs-grid-loading" style="display:none; text-align:center; padding:24px; color:#64748b;">
                            <div style="font-size:20px; animation: spin 1s linear infinite; display:inline-block; margin-bottom:4px;">⌛</div>
                            <div style="font-size:12px;">Đang tải chữ Hán...</div>
                        </div>
                        
                        <div id="fs-grid-empty" style="display:none; text-align:center; padding:24px; color:#64748b;">
                            <div style="font-size:24px; margin-bottom:4px;">📭</div>
                            <div style="font-size:12px; font-weight:600;">Không tìm thấy chữ</div>
                        </div>
                        
                        <div id="fs-grid-chars" style="display:grid; grid-template-columns: repeat(auto-fill, minmax(52px, 1fr)); gap:6px;">
                        </div>
                    </div>
                    
                    <!-- Model Cell & Stroke Order Guide -->
                    <div style="padding: 16px; display: flex; flex-direction: column; gap: 12px; background: #fff5f8; border-top: 1px solid #fbcfe8;">
                        <div style="display: flex; gap: 14px; align-items: center;">
                            <!-- Model Cell TianZiGe with HanziWriter -->
                            <div style="width: 120px; height: 120px; background: white; border: 2px solid #be185d; border-radius: 12px; position: relative; box-shadow: 0 4px 10px rgba(0,0,0,0.05); overflow: hidden; display: flex; align-items: center; justify-content: center;">
                                <svg style="position: absolute; top:0; left:0; width:100%; height:100%; pointer-events:none; z-index:1;" viewBox="0 0 120 120">
                                    <line x1="0" y1="60" x2="120" y2="60" stroke="#fca5a5" stroke-width="1" stroke-dasharray="3,3" />
                                    <line x1="60" y1="0" x2="60" y2="120" stroke="#fca5a5" stroke-width="1" stroke-dasharray="3,3" />
                                    <line x1="0" y1="0" x2="120" y2="120" stroke="#fca5a5" stroke-width="1" stroke-dasharray="3,3" />
                                    <line x1="120" y1="0" x2="0" y2="120" stroke="#fca5a5" stroke-width="1" stroke-dasharray="3,3" />
                                </svg>
                                <div id="nb-fs-writer-container" style="width: 120px; height: 120px; z-index: 2; position: relative;"></div>
                            </div>
                            
                            <!-- Controls and Details -->
                            <div style="flex: 1; display: flex; flex-direction: column; gap: 8px;">
                                <div style="display: flex; justify-content: space-between; align-items: baseline;">
                                    <span id="fs-info-char" style="font-size: 24px; font-weight: 900; color: #be185d; font-family: 'Kaiti', serif;">我</span>
                                    <span id="fs-info-pinyin" style="font-size: 14.5px; font-weight: 700; color: #2563eb;">wǒ</span>
                                </div>
                                <div style="font-size: 12px; color: #475569; line-height: 1.4;">
                                    <div style="overflow: hidden; text-overflow: ellipsis; white-space: nowrap;"><strong>Nghĩa:</strong> <span id="fs-info-meaning" style="font-weight:600;">Tôi, ta</span></div>
                                    <div style="margin-top: 2px;"><strong>Số nét:</strong> <span id="fs-info-strokes">7 nét</span></div>
                                </div>
                                
                                <!-- HanziWriter controls -->
                                <div style="display: grid; grid-template-columns: 1fr; gap: 4px; margin-top: 2px;">
                                    <button id="nb-fs-play-btn" onclick="window.toggleFsStrokeAnimation()" style="padding: 5px 10px; background: linear-gradient(135deg, #be185d, #db2777); color: white; border: none; border-radius: 6px; font-size: 11px; font-weight: 700; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 4px; outline:none;">
                                        ▶️ Xem Bút Thuận
                                    </button>
                                    <button id="nb-fs-restart-btn" onclick="window.restartFsStrokeAnimation()" style="padding: 5px 10px; background: white; color: #be185d; border: 1px solid #fbcfe8; border-radius: 6px; font-size: 11px; font-weight: 700; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 4px; outline:none;">
                                        🔄 Chạy lại
                                    </button>
                                </div>
                            </div>
                        </div>
                        
                        <!-- Stroke order details list (hidden to lower the model cell and prioritize character selection) -->
                        <div style="display: none; max-height: 85px; overflow-y: auto; padding-right: 2px;">
                            <div id="nb-fs-stroke-badges-container" style="display: flex; flex-wrap: wrap; gap: 4px;">
                            </div>
                        </div>
                    </div>
                </div>
                
                <!-- SIDEBAR TOGGLE BUTTON FOR MOBILE -->
                <button id="fs-sidebar-toggle-btn" onclick="window.toggleFsSidebar()" style="position: absolute; top: 15px; left: 15px; z-index: 1001; width: 42px; height: 42px; border-radius: 50%; background: white; border: 1.5px solid #cbd5e1; box-shadow: 0 4px 12px rgba(0,0,0,0.1); font-size: 18px; cursor: pointer; display: none; align-items: center; justify-content: center; outline: none;">
                    🔍
                </button>
                
                <!-- WORKSPACE -->
                <div style="flex: 1; overflow: auto; display: flex; justify-content: center; align-items: flex-start; padding: 24px; box-sizing: border-box; background: #eaeef3;" id="fs-workspace">
                     <!-- A4 sheet paper mockup -->
                     <div id="fs-paper-sheet" style="position: relative; width: 100%; max-width: 800px; aspect-ratio: 800/1130; background: white; border-radius: 4px; box-shadow: 0 10px 40px rgba(0,0,0,0.08); transition: all 0.3s ease; margin: 0 auto;">
                          <canvas id="nb-grid-canvas" width="800" height="1130" style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; z-index: 1; pointer-events: none;"></canvas>
                          <canvas id="nb-draw-canvas" width="800" height="1130" style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; z-index: 2; cursor: crosshair; touch-action: none; background: transparent;"></canvas>
                     </div>
                </div>
            </div>
            
            <!-- FLOATING TOOLBAR -->
            <div id="fs-notebook-toolbar" style="position: absolute; bottom: 24px; left: 50%; transform: translateX(-50%); background: rgba(255, 255, 255, 0.96); backdrop-filter: blur(10px); padding: 12px 24px; border-radius: 100px; box-shadow: 0 10px 30px rgba(0,0,0,0.15); border: 1.5px solid rgba(229, 231, 235, 0.5); display: flex; align-items: center; gap: 20px; z-index: 1000; flex-wrap: wrap; max-width: 90%; justify-content: center; transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.3s cubic-bezier(0.4, 0, 0.2, 1);">
                <!-- Colors -->
                <div style="display: flex; align-items: center; gap: 8px;">
                    <span style="font-size: 11px; font-weight: 800; color: #64748b; text-transform: uppercase;">Mực:</span>
                    <button class="fs-color-btn active" data-color="#1e293b" onclick="window.setFsPenColor('#1e293b', this)" style="width: 26px; height: 26px; border-radius: 50%; border: 2.5px solid white; background: #1e293b; cursor: pointer; padding: 0; box-shadow: 0 0 0 1.5px #1e293b; outline: none; transition: all 0.15s;"></button>
                    <button class="fs-color-btn" data-color="#dc2626" onclick="window.setFsPenColor('#dc2626', this)" style="width: 26px; height: 26px; border-radius: 50%; border: 2.5px solid white; background: #dc2626; cursor: pointer; padding: 0; box-shadow: 0 0 0 1.5px transparent; outline: none; transition: all 0.15s;"></button>
                    <button class="fs-color-btn" data-color="#1d4ed8" onclick="window.setFsPenColor('#1d4ed8', this)" style="width: 26px; height: 26px; border-radius: 50%; border: 2.5px solid white; background: #1d4ed8; cursor: pointer; padding: 0; box-shadow: 0 0 0 1.5px transparent; outline: none; transition: all 0.15s;"></button>
                    <button class="fs-color-btn" data-color="#047857" onclick="window.setFsPenColor('#047857', this)" style="width: 26px; height: 26px; border-radius: 50%; border: 2.5px solid white; background: #047857; cursor: pointer; padding: 0; box-shadow: 0 0 0 1.5px transparent; outline: none; transition: all 0.15s;"></button>
                </div>
                
                <div style="width: 1.5px; height: 24px; background: #e2e8f0;"></div>
                
                <!-- Thickness -->
                <div style="display: flex; align-items: center; gap: 6px;">
                    <span style="font-size: 11px; font-weight: 800; color: #64748b; text-transform: uppercase;">Cỡ nét:</span>
                    <button id="fs-pen-thin" onclick="window.setFsPenWidth(2, 'thin')" style="padding: 4px 10px; background: #f1f5f9; border: 1.5px solid #cbd5e1; border-radius: 12px; font-size: 11px; font-weight: 700; color: #475569; cursor: pointer; outline: none; transition: all 0.2s;">Mảnh</button>
                    <button id="fs-pen-medium" onclick="window.setFsPenWidth(4, 'medium')" style="padding: 4px 10px; background: #be185d; border: 1.5px solid #be185d; border-radius: 12px; font-size: 11px; font-weight: 700; color: white; cursor: pointer; outline: none; transition: all 0.2s;">Vừa</button>
                    <button id="fs-pen-thick" onclick="window.setFsPenWidth(7, 'thick')" style="padding: 4px 10px; background: #f1f5f9; border: 1.5px solid #cbd5e1; border-radius: 12px; font-size: 11px; font-weight: 700; color: #475569; cursor: pointer; outline: none; transition: all 0.2s;">Dày</button>
                </div>
                
                <div style="width: 1.5px; height: 24px; background: #e2e8f0;"></div>
                
                <!-- Faint Guides toggle -->
                <div style="display: flex; align-items: center; gap: 8px;">
                    <button id="fs-toggle-guide-btn" onclick="window.toggleFsFaintGuide()" style="padding: 6px 14px; background: #fff1f2; border: 1.5px solid #fbcfe8; border-radius: 20px; font-size: 12px; font-weight: 700; color: #be185d; cursor: pointer; display: flex; align-items: center; gap: 6px; outline: none; transition: all 0.2s;">
                        ✨ Hiện Nét Mẫu: Bật
                    </button>
                </div>
                
                <div style="width: 1.5px; height: 24px; background: #e2e8f0;"></div>
                
                <!-- Page manipulation -->
                <div style="display: flex; align-items: center; gap: 8px;">
                    <button onclick="window.undoFsStroke()" style="padding: 6px 14px; background: #f1f5f9; border: 1.5px solid #cbd5e1; border-radius: 20px; font-size: 12px; font-weight: 700; color: #475569; cursor: pointer; display: flex; align-items: center; gap: 4px; outline: none;">
                        ↩️ Hoàn tác
                    </button>
                    <button onclick="window.clearFsCanvas()" style="padding: 6px 14px; background: #fff1f2; border: 1.5px solid #fecdd3; border-radius: 20px; font-size: 12px; font-weight: 700; color: #e11d48; cursor: pointer; display: flex; align-items: center; gap: 4px; outline: none;">
                        🗑️ Xóa trang
                    </button>
                    <button onclick="window.saveFsNotebook()" style="padding: 6px 16px; background: linear-gradient(135deg, #10b981, #059669); color: white; border: none; border-radius: 20px; font-size: 12px; font-weight: 800; cursor: pointer; display: flex; align-items: center; gap: 4px; box-shadow: 0 4px 12px rgba(16,185,129,0.2); outline: none;">
                        💾 Lưu trang vở
                    </button>
                    <button onclick="window.downloadFsWorksheet()" style="padding: 6px 16px; background: linear-gradient(135deg, #3b82f6, #1d4ed8); color: white; border: none; border-radius: 20px; font-size: 12px; font-weight: 800; cursor: pointer; display: flex; align-items: center; gap: 4px; box-shadow: 0 4px 12px rgba(59,130,246,0.2); outline: none;" title="Tải trang viết dảnh ảnh PNG về máy">
                        📥 Tải trang
                    </button>
                </div>
                
                <div style="width: 1.5px; height: 24px; background: #e2e8f0;"></div>
                <button onclick="window.toggleFsToolbar(true)" style="width: 32px; height: 32px; border-radius: 50%; background: #f1f5f9; border: 1.5px solid #cbd5e1; font-size: 11px; cursor: pointer; display: flex; align-items: center; justify-content: center; outline: none; transition: all 0.2s;" title="Thu gọn thanh công cụ">▼</button>
            </div>
            
            <!-- EXPAND TRIGGER BUTTON (floating when collapsed) -->
            <button id="fs-toolbar-expand-btn" onclick="window.toggleFsToolbar(false)" style="position: absolute; bottom: 24px; left: 50%; transform: translateX(-50%); background: linear-gradient(135deg, #be185d, #db2777); color: white; border: none; padding: 12px 28px; border-radius: 100px; font-size: 13px; font-weight: 800; cursor: pointer; display: none; align-items: center; gap: 8px; box-shadow: 0 10px 25px rgba(190, 24, 93, 0.35); z-index: 1001; outline: none; font-family:'Lexend',sans-serif; transition: all 0.2s;">
            Hiện Thanh Công Cụ
            </button>
        `;
        
        document.body.style.overflow = 'hidden';
        window.initFsNotebookState(studentName, studentLvl, dateStr);
    };

    window.initFsNotebookState = function(studentName, studentLvl, dateStr) {
        // Reset toolbar to expanded state
        window.toggleFsToolbar(false);

        // Reset sidebar state to default expanded
        const sidebar = document.getElementById('fs-notebook-sidebar');
        if (sidebar) {
            sidebar.classList.remove('collapsed');
            sidebar.classList.remove('open');
        }
        const toggleBtnText = document.getElementById('fs-sidebar-toggle-text');
        if (toggleBtnText) {
            toggleBtnText.textContent = 'Ẩn Thanh Trái';
        }

        const nameLbl = document.getElementById('fs-student-name');
        if (nameLbl) nameLbl.textContent = studentName;
        const dateLbl = document.getElementById('fs-writing-date');
        if (dateLbl) dateLbl.textContent = "Luyện tập: " + dateStr;
        
        window.notebookStrokes = [];
        window.notebookIsLandscape = false;
        window.notebookShowGuideText = true;
        window.notebookPenColor = '#1e293b';
        window.notebookPenWidth = 4;
        
        // Render initial background grid
        const gridCanvas = document.getElementById('nb-grid-canvas');
        if (gridCanvas) {
            const gridCtx = gridCanvas.getContext('2d');
            window.drawA4NotebookGrid(gridCtx, false, studentName, dateStr);
        }
        
        // Clear drawing layer
        const drawCanvas = document.getElementById('nb-draw-canvas');
        if (drawCanvas) {
            const drawCtx = drawCanvas.getContext('2d');
            drawCtx.clearRect(0, 0, drawCanvas.width, drawCanvas.height);
        }
        
        // Bind user interaction drawing events
        window.setupFsDrawingEvents();
        
        // Default select character source HSK1
        window.loadFsNotebookSource('hsk1');
    };

    // Vector calligraphy drawing mechanisms
    window.setupFsDrawingEvents = function() {
        const drawCanvas = document.getElementById('nb-draw-canvas');
        if (!drawCanvas) return;
        
        let isDrawing = false;
        let currentStroke = [];
        
        function getCoords(e, canvas) {
            const rect = canvas.getBoundingClientRect();
            let clientX, clientY;
            if (e.touches && e.touches.length > 0) {
                clientX = e.touches[0].clientX;
                clientY = e.touches[0].clientY;
            } else {
                clientX = e.clientX;
                clientY = e.clientY;
            }
            const x = (clientX - rect.left) * (canvas.width / rect.width);
            const y = (clientY - rect.top) * (canvas.height / rect.height);
            return { x, y };
        }
        
        // Overwrite standard events cleanly
        drawCanvas.onmousedown = function(e) {
            isDrawing = true;
            const coords = getCoords(e, drawCanvas);
            currentStroke = [{ x: coords.x, y: coords.y, color: window.notebookPenColor, width: window.notebookPenWidth }];
            window.notebookStrokes.push(currentStroke);
            window.redrawNotebookDrawing();
            e.preventDefault();
        };
        
        drawCanvas.onmousemove = function(e) {
            if (!isDrawing) return;
            const coords = getCoords(e, drawCanvas);
            currentStroke.push({ x: coords.x, y: coords.y, color: window.notebookPenColor, width: window.notebookPenWidth });
            window.redrawNotebookDrawing();
            e.preventDefault();
        };
        
        window.onmouseup = function(e) {
            if (isDrawing) {
                isDrawing = false;
                currentStroke = [];
            }
        };
        
        drawCanvas.onmouseup = window.onmouseup;
        
        drawCanvas.ontouchstart = function(e) {
            isDrawing = true;
            const coords = getCoords(e, drawCanvas);
            currentStroke = [{ x: coords.x, y: coords.y, color: window.notebookPenColor, width: window.notebookPenWidth }];
            window.notebookStrokes.push(currentStroke);
            window.redrawNotebookDrawing();
            e.preventDefault();
        };
        
        drawCanvas.ontouchmove = function(e) {
            if (!isDrawing) return;
            const coords = getCoords(e, drawCanvas);
            currentStroke.push({ x: coords.x, y: coords.y, color: window.notebookPenColor, width: window.notebookPenWidth });
            window.redrawNotebookDrawing();
            e.preventDefault();
        };
        
        drawCanvas.ontouchend = function(e) {
            if (isDrawing) {
                isDrawing = false;
                currentStroke = [];
            }
            e.preventDefault();
        };
    };

    window.redrawNotebookDrawing = function() {
        const drawCanvas = document.getElementById('nb-draw-canvas');
        if (!drawCanvas) return;
        
        const drawCtx = drawCanvas.getContext('2d');
        drawCtx.clearRect(0, 0, drawCanvas.width, drawCanvas.height);
        
        drawCtx.lineCap = 'round';
        drawCtx.lineJoin = 'round';
        
        window.notebookStrokes.forEach(stroke => {
            if (stroke.length < 1) return;
            drawCtx.strokeStyle = stroke[0].color || '#1e293b';
            drawCtx.lineWidth = stroke[0].width || 4;
            
            drawCtx.beginPath();
            drawCtx.moveTo(stroke[0].x, stroke[0].y);
            for (let i = 1; i < stroke.length; i++) {
                drawCtx.lineTo(stroke[i].x, stroke[i].y);
            }
            drawCtx.stroke();
        });
    };

    window.toggleNotebookOrientation = function() {
        if (window.notebookStrokes.length > 0) {
            if (!confirm("Thay đổi khổ giấy sẽ làm sạch các nét vẽ hiện có trên trang. Tiếp tục?")) {
                return;
            }
        }
        
        window.notebookIsLandscape = !window.notebookIsLandscape;
        
        const sheet = document.getElementById('fs-paper-sheet');
        const gridCanvas = document.getElementById('nb-grid-canvas');
        const drawCanvas = document.getElementById('nb-draw-canvas');
        const icon = document.getElementById('fs-orientation-icon');
        const text = document.getElementById('fs-orientation-text');
        
        if (!sheet || !gridCanvas || !drawCanvas) return;
        
        window.notebookStrokes = [];
        
        if (window.notebookIsLandscape) {
            // landscape (khổ ngang)
            sheet.style.maxWidth = '1000px';
            sheet.style.aspectRatio = '1130 / 800';
            
            gridCanvas.width = 1130;
            gridCanvas.height = 800;
            drawCanvas.width = 1130;
            drawCanvas.height = 800;
            
            if (icon) icon.textContent = '↕️';
            if (text) text.textContent = 'Khổ Dọc';
        } else {
            // portrait (khổ dọc)
            sheet.style.maxWidth = '800px';
            sheet.style.aspectRatio = '800 / 1130';
            
            gridCanvas.width = 800;
            gridCanvas.height = 1130;
            drawCanvas.width = 800;
            drawCanvas.height = 1130;
            
            if (icon) icon.textContent = '↔️';
            if (text) text.textContent = 'Khổ Ngang';
        }
        
        const user = (window.auth && window.auth.currentUser) ? window.auth.currentUser : null;
        const uid = user ? user.uid : 'guest';
        const profile = window.getUserProfile ? window.getUserProfile(uid) : { name: 'Học Viên' };
        const studentName = profile.name || 'Học Viên';
        
        const now = new Date();
        const dateStr = now.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
        
        const gridCtx = gridCanvas.getContext('2d');
        window.drawA4NotebookGrid(gridCtx, window.notebookIsLandscape, studentName, dateStr);
        
        const drawCtx = drawCanvas.getContext('2d');
        drawCtx.clearRect(0, 0, drawCanvas.width, drawCanvas.height);
    };

    // Draw the full red-ink calligraphy worksheet background
    window.drawA4NotebookGrid = function(gridCtx, isLandscape, studentName, dateStr) {
        const width = isLandscape ? 1130 : 800;
        const height = isLandscape ? 800 : 1130;
        
        gridCtx.clearRect(0, 0, width, height);
        gridCtx.fillStyle = '#fdfbf7'; // rich warm rice-paper cream tone
        gridCtx.fillRect(0, 0, width, height);
        
        // Classical borders
        gridCtx.strokeStyle = '#f87171'; // soft vermilion red
        gridCtx.lineWidth = 2.5;
        gridCtx.strokeRect(8, 8, width - 16, height - 16);
        
        gridCtx.lineWidth = 1;
        gridCtx.strokeRect(12, 12, width - 24, height - 24);
        
        const cellSize = 120;
        let leftMargin, topMargin, columns, rows;
        
        if (isLandscape) {
            leftMargin = 85;
            topMargin = 50;
            columns = 8;
            rows = 6;
        } else {
            leftMargin = 40;
            topMargin = 95;
            columns = 6;
            rows = 8;
        }
        
        // Draw grid
        for (let row = 0; row < rows; row++) {
            for (let col = 0; col < columns; col++) {
                const cellX = leftMargin + col * cellSize;
                const cellY = topMargin + row * cellSize;
                
                gridCtx.strokeStyle = '#fca5a5';
                gridCtx.lineWidth = 1.5;
                gridCtx.strokeRect(cellX, cellY, cellSize, cellSize);
                
                gridCtx.strokeStyle = '#fecdd3';
                gridCtx.lineWidth = 0.8;
                gridCtx.setLineDash([4, 4]);
                
                gridCtx.beginPath();
                // Crosshair
                gridCtx.moveTo(cellX + cellSize / 2, cellY);
                gridCtx.lineTo(cellX + cellSize / 2, cellY + cellSize);
                gridCtx.moveTo(cellX, cellY + cellSize / 2);
                gridCtx.lineTo(cellX + cellSize, cellY + cellSize / 2);
                
                // Diagonals
                gridCtx.moveTo(cellX, cellY);
                gridCtx.lineTo(cellX + cellSize, cellY + cellSize);
                gridCtx.moveTo(cellX + cellSize, cellY);
                gridCtx.lineTo(cellX, cellY + cellSize);
                gridCtx.stroke();
                gridCtx.setLineDash([]);
                
                // Tracing text if guide enabled
                if (window.notebookShowGuideText && window.currentNotebookCharacter && window.currentNotebookCharacter.hanzi) {
                    gridCtx.save();
                    gridCtx.fillStyle = 'rgba(225, 29, 72, 0.08)'; // extremely elegant light pink-red
                    gridCtx.font = "95px 'Kaiti', 'STKaiti', 'SimSun', serif, sans-serif";
                    gridCtx.textAlign = 'center';
                    gridCtx.textBaseline = 'middle';
                    gridCtx.fillText(window.currentNotebookCharacter.hanzi, cellX + cellSize/2, cellY + cellSize/2 + 5);
                    gridCtx.restore();
                }
            }
        }
        
        // Print classical branding headings onto sheet
        gridCtx.fillStyle = '#be185d';
        gridCtx.font = "bold 18px 'Lexend', sans-serif";
        gridCtx.fillText("学赢中文 XueYing Zhongwen", 40, 42);
        gridCtx.font = "12px 'Lexend', sans-serif";
        gridCtx.fillStyle = '#64748b';
        gridCtx.fillText("Vở Tập Viết Chữ Hán Điện Tử (A4)", 40, 60);
        
        gridCtx.textAlign = 'right';
        gridCtx.fillStyle = '#1e293b';
        gridCtx.font = "bold 13px 'Lexend', sans-serif";
        gridCtx.fillText("Học viên: " + studentName, width - 40, 42);
        gridCtx.font = "12px 'Lexend', sans-serif";
        gridCtx.fillStyle = '#64748b';
        gridCtx.fillText("Luyện viết ngày: " + dateStr, width - 40, 60);
        gridCtx.textAlign = 'left';
    };

    // Load Hanzi character database
    window.loadFsNotebookSource = async function(source) {
        const user = (window.auth && window.auth.currentUser) ? window.auth.currentUser : null;
        const uid = user ? user.uid : 'guest';
        
        const gridLoading = document.getElementById('fs-grid-loading');
        const gridEmpty = document.getElementById('fs-grid-empty');
        const gridChars = document.getElementById('fs-grid-chars');
        const lessonContainer = document.getElementById('fs-lesson-container');
        const customContainer = document.getElementById('fs-custom-container');
        const lessonSelect = document.getElementById('fs-lesson-select');
        
        if (!gridChars) return;
        
        gridChars.innerHTML = '';
        if (gridLoading) gridLoading.style.display = 'block';
        if (gridEmpty) gridEmpty.style.display = 'none';
        
        if (source === 'custom') {
            if (lessonContainer) lessonContainer.style.display = 'none';
            if (customContainer) customContainer.style.display = 'block';
            if (gridLoading) gridLoading.style.display = 'none';
            
            const basics = ['我', '你', '他', '她', 'sì', '是', '好', '爱', '天', '地', '人', '山', '水', '火', '风'];
            window.renderFsCharacterGrid(basics);
            return;
        }
        
        if (lessonContainer) lessonContainer.style.display = 'block';
        if (customContainer) customContainer.style.display = 'none';
        
        if (source === 'mistakes') {
            const profile = window.getUserProfile ? window.getUserProfile(uid) : {};
            const wrongList = profile.wrongExercises || [];
            const unmasteredList = profile.unmasteredFlashcards || [];
            
            const charsSet = new Set();
            unmasteredList.forEach(card => {
                if (card.cn) {
                    for (let i = 0; i < card.cn.length; i++) {
                        const code = card.cn.charCodeAt(i);
                        if (code >= 0x4e00 && code <= 0x9fa5) {
                            charsSet.add(card.cn[i]);
                        }
                    }
                }
            });
            
            wrongList.forEach(item => {
                if (item.hanzi) {
                    charsSet.add(item.hanzi);
                }
                if (item.q && typeof item.q === 'string') {
                    for (let i = 0; i < item.q.length; i++) {
                        const code = item.q.charCodeAt(i);
                        if (code >= 0x4e00 && code <= 0x9fa5) {
                            charsSet.add(item.q[i]);
                        }
                    }
                }
            });
            
            const chars = Array.from(charsSet);
            if (gridLoading) gridLoading.style.display = 'none';
            
            if (chars.length === 0) {
                if (gridEmpty) gridEmpty.style.display = 'block';
                const countSpan = document.getElementById('fs-grid-count');
                if (countSpan) countSpan.textContent = '0 chữ';
                window.renderFsCharacterGrid(['我', '你', '好', '是', '国', '中', '学', '习']);
            } else {
                window.renderFsCharacterGrid(chars);
            }
            return;
        }
        
        try {
            const data = await window.loadHanziData(source);
            window.currentLevelHanziData = data;
            
            const lessonsSet = new Set();
            data.forEach(item => {
                if (item.lessons) {
                    item.lessons.forEach(l => lessonsSet.add(l));
                }
            });
            
            const sortedLessons = Array.from(lessonsSet).sort((a, b) => a - b);
            
            if (lessonSelect) {
                lessonSelect.innerHTML = '';
                sortedLessons.forEach(l => {
                    const option = document.createElement('option');
                    option.value = l;
                    option.textContent = `Bài ${l}`;
                    lessonSelect.appendChild(option);
                });
                
                // Also populate the desktop spread-out lesson chips
                const lessonChips = document.getElementById('fs-lesson-chips');
                if (lessonChips) {
                    lessonChips.innerHTML = '';
                    sortedLessons.forEach(l => {
                        const chip = document.createElement('button');
                        chip.type = 'button';
                        chip.className = 'fs-lesson-chip-btn';
                        chip.textContent = `Bài ${l}`;
                        chip.onclick = () => {
                            document.querySelectorAll('.fs-lesson-chip-btn').forEach(btn => {
                                btn.style.background = 'white';
                                btn.style.color = '#475569';
                                btn.style.borderColor = '#cbd5e1';
                                btn.style.boxShadow = 'none';
                            });
                            chip.style.background = '#be185d';
                            chip.style.color = 'white';
                            chip.style.borderColor = '#be185d';
                            chip.style.boxShadow = '0 2px 6px rgba(190, 24, 93, 0.2)';
                            
                            lessonSelect.value = l;
                            window.filterFsCharactersByLesson(l);
                        };
                        lessonChips.appendChild(chip);
                    });
                }
                
                if (sortedLessons.length > 0) {
                    lessonSelect.value = sortedLessons[0];
                    // Trigger the first lesson chip click on desktop if it exists
                    if (lessonChips && lessonChips.firstChild) {
                        lessonChips.firstChild.click();
                    } else {
                        window.filterFsCharactersByLesson(sortedLessons[0]);
                    }
                } else {
                    if (gridLoading) gridLoading.style.display = 'none';
                    if (gridEmpty) gridEmpty.style.display = 'block';
                }
            }
        } catch (e) {
            console.error('Error loading full notebook source:', e);
            if (gridLoading) gridLoading.style.display = 'none';
            if (gridEmpty) gridEmpty.style.display = 'block';
        }
    };

    window.filterFsCharactersByLesson = function(lessonNum) {
        const data = window.currentLevelHanziData || [];
        const filtered = data.filter(item => item.lessons && item.lessons.includes(parseInt(lessonNum, 10)));
        const charStrings = filtered.map(item => item.hanzi);
        window.renderFsCharacterGrid(charStrings, filtered);
    };

    window.renderFsCharacterGrid = function(charsList, fullObjectsList = []) {
        const gridLoading = document.getElementById('fs-grid-loading');
        const gridEmpty = document.getElementById('fs-grid-empty');
        const gridChars = document.getElementById('fs-grid-chars');
        const countSpan = document.getElementById('fs-grid-count');
        
        if (!gridChars) return;
        
        if (gridLoading) gridLoading.style.display = 'none';
        gridChars.innerHTML = '';
        
        if (charsList.length === 0) {
            if (gridEmpty) gridEmpty.style.display = 'block';
            if (countSpan) countSpan.textContent = '0 chữ';
            return;
        }
        
        if (gridEmpty) gridEmpty.style.display = 'none';
        if (countSpan) countSpan.textContent = `${charsList.length} chữ`;
        
        charsList.forEach(char => {
            const btn = document.createElement('button');
            btn.className = 'fs-char-btn';
            btn.textContent = char;
            btn.onclick = () => {
                document.querySelectorAll('.fs-char-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                window.selectFsNotebookCharacter(char, fullObjectsList.find(o => o.hanzi === char));
            };
            gridChars.appendChild(btn);
        });
        
        if (gridChars.firstChild) {
            gridChars.firstChild.click();
        }
    };

    window.applyFsCustomInput = function() {
        const input = document.getElementById('fs-custom-input');
        if (!input) return;
        
        const txt = input.value.trim();
        if (txt.length === 0) return;
        
        const chars = [];
        for (let i = 0; i < txt.length; i++) {
            const code = txt.charCodeAt(i);
            if (code >= 0x4e00 && code <= 0x9fa5) {
                chars.push(txt[i]);
            }
        }
        if (chars.length === 0) {
            alert('Vui lòng nhập các chữ Hán hợp lệ!');
            return;
        }
        window.renderFsCharacterGrid(chars);
    };

    // Selecting a Hanzi character in the full-screen view
    window.selectFsNotebookCharacter = async function(char, optObject) {
        let details = optObject;
        
        if (!details) {
            const hsk1Data = window.cachedHanziData ? window.cachedHanziData['hsk1'] : null;
            const hsk2Data = window.cachedHanziData ? window.cachedHanziData['hsk2'] : null;
            
            if (hsk1Data) details = hsk1Data.find(o => o.hanzi === char);
            if (!details && hsk2Data) details = hsk2Data.find(o => o.hanzi === char);
            
            if (!details) {
                details = {
                    hanzi: char,
                    pinyin: '',
                    meaning: 'Chữ Hán tự chọn',
                    radical: '--',
                    structure: 'Liên kết',
                    strokes: char.length,
                    stroke_order: [],
                    story: 'Tập viết chữ Hán đều đặn giúp tăng cường trí nhớ dài hạn và cải thiện thẩm mỹ chữ viết!'
                };
            }
        }
        
        window.currentNotebookCharacter = details;
        
        const infoChar = document.getElementById('fs-info-char');
        if (infoChar) infoChar.textContent = details.hanzi;
        const infoPinyin = document.getElementById('fs-info-pinyin');
        if (infoPinyin) infoPinyin.textContent = details.pinyin || '';
        const infoMeaning = document.getElementById('fs-info-meaning');
        if (infoMeaning) infoMeaning.textContent = details.meaning || '';
        const infoStrokes = document.getElementById('fs-info-strokes');
        if (infoStrokes) infoStrokes.textContent = (details.strokes || '--') + ' nét';
        
        // Output detailed stroke names in Vietnamese
        const badgesContainer = document.getElementById('nb-fs-stroke-badges-container');
        if (badgesContainer) {
            badgesContainer.innerHTML = '';
            const order = details.stroke_order || [];
            
            if (order.length === 0) {
                badgesContainer.innerHTML = '<span style="font-size:11px;color:#94a3b8;font-style:italic;">Chưa có dữ liệu thứ tự nét chi tiết.</span>';
            } else {
                order.forEach((st, idx) => {
                    const b = document.createElement('span');
                    b.className = 'nb-stroke-badge';
                    b.id = `fsStrokeBadge-${idx}`;
                    const trans = window.getStrokeNameVietnamese(st);
                    b.innerHTML = `<strong>${idx + 1}</strong>. ${trans}`;
                    badgesContainer.appendChild(b);
                });
            }
        }
        
        // Re-draw background grid to update faint outlines instantly
        const gridCanvas = document.getElementById('nb-grid-canvas');
        if (gridCanvas) {
            const user = (window.auth && window.auth.currentUser) ? window.auth.currentUser : null;
            const uid = user ? user.uid : 'guest';
            const profile = window.getUserProfile ? window.getUserProfile(uid) : { name: 'Học Viên' };
            const studentName = profile.name || 'Học Viên';
            const now = new Date();
            const dateStr = now.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
            
            const gridCtx = gridCanvas.getContext('2d');
            window.drawA4NotebookGrid(gridCtx, window.notebookIsLandscape, studentName, dateStr);
        }
        
        // Re-initialize HanziWriter inside sidebar Model Cell
        window.initFsHanziWriter(char);
    };

    window.initFsHanziWriter = function(char) {
        const container = document.getElementById('nb-fs-writer-container');
        if (!container) return;
        
        container.innerHTML = '';
        
        try {
            window.fsHanziWriter = HanziWriter.create('nb-fs-writer-container', char, {
                width: 120,
                height: 120,
                padding: 5,
                showOutline: true,
                strokeColor: '#be185d', // elegant deep pink
                outlineColor: '#fecdd3', // soft blush pink
                strokeAnimationSpeed: 1.2,
                delayBetweenStrokes: 200
            });
            
            isFsAnimating = false;
            isFsPaused = false;
            
            const playBtn = document.getElementById('nb-fs-play-btn');
            if (playBtn) playBtn.innerHTML = '▶️ Xem Bút Thuận';
        } catch(e) {
            console.warn('Error creating HanziWriter instance:', e);
        }
    };

    // HanziWriter animation states play / pause / resume / restart
    window.toggleFsStrokeAnimation = function() {
        if (!window.fsHanziWriter) return;
        const playBtn = document.getElementById('nb-fs-play-btn');
        
        if (isFsAnimating && !isFsPaused) {
            window.fsHanziWriter.pauseAnimation();
            isFsPaused = true;
            if (playBtn) playBtn.innerHTML = '▶️ Tiếp tục';
        } else if (isFsPaused) {
            window.fsHanziWriter.resumeAnimation();
            isFsPaused = false;
            if (playBtn) playBtn.innerHTML = '⏸️ Tạm dừng';
        } else {
            isFsAnimating = true;
            isFsPaused = false;
            if (playBtn) playBtn.innerHTML = '⏸️ Tạm dừng';
            
            window.fsHanziWriter.animateCharacter({
                onComplete: () => {
                    isFsAnimating = false;
                    isFsPaused = false;
                    if (playBtn) playBtn.innerHTML = '▶️ Xem Bút Thuận';
                }
            });
        }
    };

    window.restartFsStrokeAnimation = function() {
        if (!window.fsHanziWriter) return;
        window.fsHanziWriter.cancelAnimation();
        
        isFsAnimating = true;
        isFsPaused = false;
        
        const playBtn = document.getElementById('nb-fs-play-btn');
        if (playBtn) playBtn.innerHTML = '⏸️ Tạm dừng';
        
        window.fsHanziWriter.animateCharacter({
            onComplete: () => {
                isFsAnimating = false;
                isFsPaused = false;
                if (playBtn) playBtn.innerHTML = '▶️ Xem Bút Thuận';
            }
        });
    };

    window.toggleFsToolbar = function(collapse) {
        const toolbar = document.getElementById('fs-notebook-toolbar');
        const expandBtn = document.getElementById('fs-toolbar-expand-btn');
        if (!toolbar) return;
        
        if (collapse) {
            toolbar.style.transform = 'translateX(-50%) translateY(150%)';
            toolbar.style.opacity = '0';
            toolbar.style.pointerEvents = 'none';
            if (expandBtn) expandBtn.style.display = 'flex';
        } else {
            toolbar.style.transform = 'translateX(-50%) translateY(0)';
            toolbar.style.opacity = '1';
            toolbar.style.pointerEvents = 'auto';
            if (expandBtn) expandBtn.style.display = 'none';
        }
    };

    // Pen manipulation
    window.setFsPenColor = function(color, btn) {
        window.notebookPenColor = color;
        document.querySelectorAll('.fs-color-btn').forEach(b => {
            b.classList.remove('active');
            b.style.boxShadow = '0 0 0 1.5px transparent';
        });
        if (btn) {
            btn.classList.add('active');
            btn.style.boxShadow = `0 0 0 1.5px ${color}`;
        }
    };

    window.setFsPenWidth = function(width, mode) {
        window.notebookPenWidth = width;
        ['thin', 'medium', 'thick'].forEach(m => {
            const b = document.getElementById(`fs-pen-${m}`);
            if (b) {
                b.style.background = '#f1f5f9';
                b.style.color = '#475569';
                b.style.borderColor = '#cbd5e1';
            }
        });
        const activeBtn = document.getElementById(`fs-pen-${mode}`);
        if (activeBtn) {
            activeBtn.style.background = '#be185d';
            activeBtn.style.color = 'white';
            activeBtn.style.borderColor = '#be185d';
        }
    };

    window.toggleFsFaintGuide = function() {
        window.notebookShowGuideText = !window.notebookShowGuideText;
        
        const btn = document.getElementById('fs-toggle-guide-btn');
        if (btn) {
            if (window.notebookShowGuideText) {
                btn.innerHTML = '✨ Hiện Nét Mẫu: Bật';
                btn.style.background = '#fff1f2';
                btn.style.color = '#be185d';
                btn.style.borderColor = '#fbcfe8';
            } else {
                btn.innerHTML = '✨ Hiện Nét Mẫu: Tắt';
                btn.style.background = '#f1f5f9';
                btn.style.color = '#475569';
                btn.style.borderColor = '#cbd5e1';
            }
        }
        
        const gridCanvas = document.getElementById('nb-grid-canvas');
        if (gridCanvas) {
            const user = (window.auth && window.auth.currentUser) ? window.auth.currentUser : null;
            const uid = user ? user.uid : 'guest';
            const profile = window.getUserProfile ? window.getUserProfile(uid) : { name: 'Học Viên' };
            const studentName = profile.name || 'Học Viên';
            const now = new Date();
            const dateStr = now.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
            
            const gridCtx = gridCanvas.getContext('2d');
            window.drawA4NotebookGrid(gridCtx, window.notebookIsLandscape, studentName, dateStr);
        }
    };

    window.undoFsStroke = function() {
        if (window.notebookStrokes.length > 0) {
            window.notebookStrokes.pop();
            window.redrawNotebookDrawing();
        }
    };

    window.clearFsCanvas = function() {
        if (confirm("Xác nhận xóa sạch toàn bộ các nét vẽ hiện tại trên trang?")) {
            window.notebookStrokes = [];
            window.redrawNotebookDrawing();
        }
    };

    window.closeFullScreenNotebook = function() {
        const overlay = document.getElementById('fs-notebook-overlay');
        if (overlay) {
            overlay.style.display = 'none';
        }
        document.body.style.overflow = '';
        
        // Refresh original profile tab
        window.renderNotebookGalleryCore();
    };

    // High fidelity save system
    window.saveFsNotebook = function() {
        const gridCanvas = document.getElementById('nb-grid-canvas');
        const drawCanvas = document.getElementById('nb-draw-canvas');
        
        if (!gridCanvas || !drawCanvas) return;
        
        const width = gridCanvas.width;
        const height = gridCanvas.height;
        
        const combined = document.createElement('canvas');
        combined.width = width;
        combined.height = height;
        const ctx = combined.getContext('2d');
        
        // Flatten layers
        ctx.drawImage(gridCanvas, 0, 0);
        ctx.drawImage(drawCanvas, 0, 0);
        
        const dataUrl = combined.toDataURL('image/png');
        
        const user = (window.auth && window.auth.currentUser) ? window.auth.currentUser : null;
        const uid = user ? user.uid : 'guest';
        const nbKey = 'xueying_hanzi_notebook_' + uid;
        
        let items = [];
        try {
            const saved = localStorage.getItem(nbKey);
            if (saved) items = JSON.parse(saved);
        } catch(e) {}
        
        const now = new Date();
        const dateStr = now.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
        const timeStr = now.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
        const activeChar = window.currentNotebookCharacter ? window.currentNotebookCharacter.hanzi : null;
        
        const newItem = {
            id: 'nb_' + Date.now(),
            char: activeChar,
            dateStr: dateStr,
            timeStr: timeStr,
            image: dataUrl
        };
        
        items.unshift(newItem);
        
        try {
            localStorage.setItem(nbKey, JSON.stringify(items));
            alert("🎉 Tuyệt vời! Trang vở luyện viết của bạn đã được lưu thành công vào bộ sưu tập.");
            
            // Sync & refresh gallery
            window.renderNotebookGalleryCore();
            
            // Return back
            window.closeFullScreenNotebook();
        } catch(e) {
            alert("Trình duyệt hết bộ nhớ lưu trữ do kích thước ảnh lớn. Hãy sử dụng nút 'Tải Trang' kế bên để lưu ảnh trực tiếp về thiết bị!");
            console.error('Local Storage Quota Exceeded:', e);
        }
    };

    // Direct local download
    window.downloadFsWorksheet = function() {
        const gridCanvas = document.getElementById('nb-grid-canvas');
        const drawCanvas = document.getElementById('nb-draw-canvas');
        
        if (!gridCanvas || !drawCanvas) return;
        
        const width = gridCanvas.width;
        const height = gridCanvas.height;
        
        const combined = document.createElement('canvas');
        combined.width = width;
        combined.height = height;
        const ctx = combined.getContext('2d');
        
        ctx.drawImage(gridCanvas, 0, 0);
        ctx.drawImage(drawCanvas, 0, 0);
        
        const dataUrl = combined.toDataURL('image/png');
        const activeChar = window.currentNotebookCharacter ? window.currentNotebookCharacter.hanzi : 'worksheet';
        
        const link = document.createElement('a');
        link.download = `Xueying_Worksheet_${activeChar}_${Date.now()}.png`;
        link.href = dataUrl;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    window.toggleFsSidebar = function() {
        const sidebar = document.getElementById('fs-notebook-sidebar');
        const toggleBtnText = document.getElementById('fs-sidebar-toggle-text');
        if (sidebar) {
            if (window.innerWidth >= 1024) {
                // Desktop
                sidebar.classList.toggle('collapsed');
                const isCollapsed = sidebar.classList.contains('collapsed');
                if (toggleBtnText) {
                    toggleBtnText.textContent = isCollapsed ? 'Hiện Thanh Trái' : 'Ẩn Thanh Trái';
                }
            } else {
                // Mobile
                sidebar.classList.toggle('open');
                const isOpen = sidebar.classList.contains('open');
                if (toggleBtnText) {
                    toggleBtnText.textContent = isOpen ? 'Đóng Thanh Trái' : 'Hiện Thanh Trái';
                }
            }
        }
    };

})();
