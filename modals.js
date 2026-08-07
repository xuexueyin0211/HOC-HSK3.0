(function() {
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = `
    <div id="login-overlay" style="display:flex;">
        <div class="login-landing-card">
            <div class="login-left-panel">
                <div class="login-box-header">
                    <span class="welcome-badge">✨ CHÀO MỪNG HỌC VIÊN</span>
                    <h2 class="login-title">Đăng Nhập Học Tập</h2>
                    <p class="login-desc">Chọn phương thức đăng nhập để theo dõi tiến độ & lưu giữ thành tích học tập cá nhân</p>
                </div>

                <div class="login-actions">
                    <button class="google-btn" onclick="loginWithGoogle()">
                        <svg width="22" height="22" viewBox="0 0 24 24">
                            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/>
                            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                        </svg>
                        <span>Đăng nhập bằng Google</span>
                    </button>
                </div>

                <div class="login-benefits">
                    <div class="benefit-item">✓ Lưu tiến độ bài học & điểm số tự động</div>
                    <div class="benefit-item">✓ Quản lý danh sách Flashcard chưa thuộc</div>
                    <div class="benefit-item">✓ Xem & ôn tập lại các câu làm sai</div>
                    <div class="benefit-item">✓ Tổng hợp đề HSK theo các cấp độ</div>
                </div>
            </div>

            <div class="login-right-panel">
                <div class="brand-logo-wrapper">
                    <img src="images/avatar.png" alt="XueYing Chinese Logo" class="brand-avatar" />
                </div>

                <h1 class="brand-name">学赢中文</h1>
                <div class="brand-subname">XueYing Zhongwen</div>

                <div class="slogan-badge">
                    🌟 HỆ THỐNG HỌC TIẾNG TRUNG TOÀN DIỆN
                </div>

                <div class="brand-slogan">
                    <div style="font-size:16.5px;font-weight:800;color:#be185d;margin-bottom:6px;letter-spacing:0.5px;font-style:normal;">学得快乐，赢得轻松</div>
                    <div style="font-size:13.5px;font-weight:600;color:#475569;font-style:normal;">Học trong mê say - Bứt phá mỗi ngày</div>
                </div>

                <div class="brand-stats">
                    <div class="stat-pill">📖 HSK 1 - 6</div>
                    <div class="stat-pill">📝 Ngữ pháp</div>
                    <div class="stat-pill">🀄 Chữ Hán</div>
                    <div class="stat-pill">🔊 Phát âm</div>
                </div>
            </div>
        </div>
    </div>

    <button id="toggleToolbarBtn" onclick="toggleToolbar()">✏️</button>
   <div class="highlight-toolbar" id="highlightToolbar">
    <div class="toolbar-row" style="display:flex;align-items:center;gap:6px;justify-content:center;width:100%;">
        <button onclick="toggleHighlightMode()" id="highlightToggle" style="padding:4px 10px;border:none;border-radius:12px;background:#ec4899;color:white;font-size:11px;font-weight:600;cursor:pointer;">Highlight</button>
        <button onclick="clearAllHighlights()" style="padding:4px 10px;border:none;border-radius:12px;background:#f44336;color:white;font-size:11px;font-weight:600;cursor:pointer;">Xóa tất cả</button>
    </div>
        <div class="toolbar-row" style="display:flex;align-items:center;gap:6px;justify-content:center;width:100%;margin-top:6px;">
        <button onclick="openFlashcardSelector()" style="padding:4px 10px;border:none;border-radius:12px;background:#9c27b0;color:white;font-size:11px;font-weight:600;cursor:pointer;">📚 Ôn tập</button>
        <button onclick="reviewUndefinedWords()" id="toolbarUnmasteredBtn" style="padding:4px 10px;border:none;border-radius:12px;background:#e91e63;color:white;font-size:11px;font-weight:600;cursor:pointer;">⏳ Chưa nắm (0)</button>
    </div>
</div>

    <div id="highlightMenu" class="highlight-menu">
        <button class="delete-option" onclick="deleteSingleHighlight()">Xóa</button>
    </div>
<div id="flashcardSelectorModal" style="display:none;position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.5);z-index:9999;justify-content:center;align-items:center;">
    <div style="background:white;border-radius:18px;padding:22px;max-width:360px;width:90%;box-shadow:0 10px 40px rgba(0,0,0,0.25);">
        <h3 style="font-size:18px;font-weight:800;margin-bottom:16px;color:#1e293b;text-align:center;">🎯 Chọn loại Flashcard ôn tập</h3>
        <div style="display:flex;flex-direction:column;gap:10px;">
            <button onclick="startVocabFlashcard();closeSelectorModal()" style="padding:12px 16px;border:none;border-radius:12px;background:linear-gradient(135deg, #f59e0b, #d97706);color:white;font-weight:700;cursor:pointer;transition:all 0.2s;display:flex;align-items:center;gap:10px;font-size:14px;box-shadow:0 4px 12px rgba(245, 158, 11, 0.2);">
                <span style="font-size:18px;">📚</span>
                <span>Flashcard Từ Vựng</span>
            </button>
            <button onclick="startHanziFlashcards();closeSelectorModal()" style="padding:12px 16px;border:none;border-radius:12px;background:linear-gradient(135deg, #8b5cf6, #7c3aed);color:white;font-weight:700;cursor:pointer;transition:all 0.2s;display:flex;align-items:center;gap:10px;font-size:14px;box-shadow:0 4px 12px rgba(139, 92, 246, 0.2);">
                <span style="font-size:18px;">🀄</span>
                <span>Flashcard Chữ Hán</span>
            </button>

        </div>
        <button onclick="closeSelectorModal()" style="width:100%;margin-top:14px;padding:9px;border:1px solid #cbd5e1;border-radius:10px;background:#f8fafc;cursor:pointer;color:#64748b;font-weight:600;">Đóng</button>
    </div>
</div>
    
    <div class="flashcard-modal" id="flashcardModal">
        <div class="flashcard-box" style="background:white;border-radius:24px;padding:24px 28px;max-width:540px;width:92%;box-shadow:0 20px 60px rgba(0,0,0,0.3);position:relative;border:1px solid #fbcfe8;">
            
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;padding-bottom:10px;border-bottom:1px solid #fce7f3;flex-wrap:wrap;gap:8px;">
                <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;">
                    <span id="flashcardTitle" style="font-weight:700;font-size:16px;color:#be185d;">📚 Flashcard Ôn tập</span>
                    <span id="flashcardStatusBadge" style="font-size:11px;font-weight:700;padding:2px 8px;border-radius:10px;background:#e2e8f0;color:#475569;">--</span>
                </div>
                <button onclick="closeFlashcard()" style="border:none;background:#fce7f3;color:#be185d;width:32px;height:32px;border-radius:50%;font-weight:700;cursor:pointer;display:flex;align-items:center;justify-content:center;font-size:16px;">✕</button>
            </div>

            <div id="flashcardModeToolbar" style="display:flex;gap:8px;justify-content:space-between;margin-bottom:14px;background:#fdf2f8;padding:8px 12px;border-radius:12px;border:1px solid #fbcfe8;align-items:center;flex-wrap:wrap;">
                <span style="font-size:12px;font-weight:600;color:#94a3b8;" id="flashcardProgressSummary">Tiến độ: 1/10</span>
                <div style="display:flex;gap:6px;">
                    <button onclick="resumeFlashcards()" style="padding:4px 10px;border:1px solid #fbcfe8;border-radius:8px;background:white;color:#db2777;font-size:12px;font-weight:700;cursor:pointer;" title="Tiếp tục vị trí học gần nhất">▶️ Tiếp tục</button>
                    <button onclick="restartFlashcards()" style="padding:4px 10px;border:1px solid #cbd5e1;border-radius:8px;background:white;color:#475569;font-size:12px;font-weight:600;cursor:pointer;" title="Học lại từ thẻ đầu tiên">🔄 Học lại từ đầu</button>
                </div>
            </div>

            <div class="card-count" id="flashcardCount" style="text-align:center;font-size:12px;color:#db2777;font-weight:700;margin-bottom:6px;">1/10</div>
            
            <div class="flashcard-face" id="flashcardFace" style="cursor:pointer;min-height:210px;display:flex;align-items:center;justify-content:center;background:#fff8fa;border:1.5px solid #fbcfe8;border-radius:16px;padding:16px 20px;box-shadow:inset 0 2px 8px rgba(236,72,153,0.04);" onclick="document.getElementById('flashcardFace')?.classList.toggle('flipped')">
                <div class="flashcard-front" id="flashcardFront">
                    <span class="cn" style="font-size:56px;font-weight:bold;color:#1e293b;">你好</span>
                </div>
                <div class="flashcard-back" id="flashcardBack">
                    <div class="cn" style="font-size:32px;font-weight:bold;margin-bottom:8px;"></div>
                    <div class="py" style="color:#db2777;font-size:16px;margin-bottom:6px;"></div>
                    <div class="vi" style="color:#64748b;font-size:16px;"></div>
                </div>
            </div>         

            <div style="display:flex;gap:6px;justify-content:center;margin-top:10px;flex-wrap:wrap;align-items:center;">
                <button onclick="prevFlashcard()" style="padding:4px 9px;border:1px solid #cbd5e1;border-radius:8px;background:#f8fafc;color:#334155;font-weight:600;font-size:11.5px;cursor:pointer;">⏮️ Thẻ trước</button>
                <button class="btn-show" onclick="document.getElementById('flashcardFace')?.classList.toggle('flipped')" style="padding:5px 11px;border:none;border-radius:8px;background:linear-gradient(135deg, #ec4899, #db2777);color:white;font-weight:700;font-size:11.5px;cursor:pointer;box-shadow:0 2px 6px rgba(236,72,153,0.25);">🔄 Lật thẻ xem đáp án</button>
                <button onclick="nextFlashcard()" style="padding:4px 9px;border:1px solid #cbd5e1;border-radius:8px;background:#f8fafc;color:#334155;font-weight:600;font-size:11.5px;cursor:pointer;">⏭️ Thẻ sau</button>
                <button onclick="shuffleFlashcards()" style="padding:4px 9px;border:none;border-radius:8px;background:#3b82f6;color:white;font-weight:600;font-size:11.5px;cursor:pointer;">🔀 Xáo trộn</button>
            </div>

            <div style="display:flex;gap:10px;margin-top:10px;justify-content:center;border-top:1px solid #f1f5f9;padding-top:10px;">
                <button onclick="markAsUnderstood()" style="flex:1;max-width:180px;padding:6px 12px;border:none;border-radius:8px;background:#16a34a;color:white;font-weight:700;font-size:12px;cursor:pointer;box-shadow:0 2px 6px rgba(22,163,74,0.2);">✅ Đã nắm được</button>
                <button onclick="markAsNotUnderstood()" style="flex:1;max-width:180px;padding:6px 12px;border:none;border-radius:8px;background:#f59e0b;color:white;font-weight:700;font-size:12px;cursor:pointer;box-shadow:0 2px 6px rgba(245,158,11,0.2);">⏳ Chưa nắm được</button>
            </div>

            <div style="margin-top:16px;padding-top:12px;border-top:1px dashed #f1f5f9;text-align:left;">
                <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;">
                    <label style="font-size:12.5px;font-weight:700;color:#be185d;display:flex;align-items:center;gap:4px;">
                        📝 Ghi chú cá nhân cho thẻ này:
                    </label>
                    <span id="flashcardNoteSavedHint" style="font-size:11px;color:#16a34a;font-weight:700;display:none;">✓ Đã lưu ghi chú</span>
                </div>
                <textarea id="flashcardUserNote" rows="2" placeholder="Nhập ghi chú hoặc mẹo nhớ cá nhân..." style="width:100%;padding:8px 12px;border:1px solid #fbcfe8;border-radius:10px;font-size:13px;outline:none;resize:vertical;box-sizing:border-box;font-family:inherit;color:#334155;background:#fffdfa;" oninput="window.saveCurrentFlashcardNote()"></textarea>
            </div>
        </div>
    </div>

    <div id="registrationModal" class="modal-overlay" style="display:none;">
        <div style="background:white;border-radius:24px;padding:32px 28px;max-width:450px;width:100%;box-shadow:0 25px 60px rgba(0,0,0,0.3);border:1px solid #fbcfe8;animation:fadeInModal 0.3s ease-out;">
            <div style="text-align:center;margin-bottom:24px;">
                <div style="width:64px;height:64px;background:#fdf2f8;border-radius:50%;display:flex;align-items:center;justify-content:center;margin:0 auto 14px;font-size:32px;border:2px solid #fbcfe8;">📝</div>
                <h2 style="font-size:22px;color:#be185d;font-weight:700;margin-bottom:8px;">Đăng Ký Tài Khoản</h2>
                <p style="font-size:14px;color:#64748b;line-height:1.5;">Vui lòng cập nhật Tên và Tuổi của bạn để hệ thống lưu hồ sơ và ghi nhận tiến độ học tập cá nhân.</p>
            </div>
            
            <form id="registrationForm" onsubmit="handleRegistrationSubmit(event)">
                <div style="margin-bottom:18px;">
                    <label style="display:block;font-size:13px;font-weight:700;color:#1e293b;margin-bottom:6px;">Email Google</label>
                    <input type="email" id="regEmail" readonly style="width:100%;padding:12px 14px;border:1px solid #e2e8f0;background:#f8fafc;border-radius:12px;font-size:14px;color:#64748b;cursor:not-allowed;box-sizing:border-box;" />
                </div>

                <div style="margin-bottom:18px;">
                    <label style="display:block;font-size:13px;font-weight:700;color:#1e293b;margin-bottom:6px;">Họ và Tên / Tên gọi <span style="color:#dc2626;">*</span></label>
                    <input type="text" id="regName" required placeholder="Nhập tên của bạn (Ví dụ: Nguyễn Văn A)" style="width:100%;padding:12px 14px;border:1px solid #fbcfe8;border-radius:12px;font-size:14px;outline:none;box-sizing:border-box;" />
                </div>

                <div style="margin-bottom:24px;">
                    <label style="display:block;font-size:13px;font-weight:700;color:#1e293b;margin-bottom:6px;">Tuổi <span style="color:#dc2626;">*</span></label>
                    <input type="number" id="regAge" min="1" max="120" required placeholder="Nhập tuổi của bạn (Ví dụ: 20)" style="width:100%;padding:12px 14px;border:1px solid #fbcfe8;border-radius:12px;font-size:14px;outline:none;box-sizing:border-box;" />
                </div>

                <button type="submit" style="width:100%;padding:14px;background:linear-gradient(135deg,#ec4899,#db2777);color:white;border:none;border-radius:12px;font-weight:700;font-size:15px;cursor:pointer;box-shadow:0 4px 15px rgba(236,72,153,0.35);transition:all 0.2s;">
                    💾 Hoàn Tất Đăng Ký & Bắt Đầu Học
                </button>
            </form>
        </div>
    </div>

    <div id="inlineLookupPopover" style="display:none;position:fixed;bottom:24px;left:50%;transform:translateX(-50%);z-index:999999;width:92%;max-width:450px;background:white;border-radius:20px;padding:18px 22px;box-shadow:0 15px 40px rgba(0,0,0,0.25);border:1.5px solid #fbcfe8;animation:slideUpInline 0.25s ease-out;">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px;padding-bottom:8px;border-bottom:1px solid #fce7f3;">
            <div style="display:flex;align-items:center;gap:8px;font-weight:800;font-size:13px;color:#be185d;">
                <span>🔍 TRA CỨU TỪ VỰNG TRỰC TIẾP</span>
                <span id="inlineLookupBadge" style="background:#fdf2f8;color:#be185d;border:1px solid #fbcfe8;font-size:10px;padding:2px 8px;border-radius:8px;font-weight:800;text-transform:uppercase;">HSK</span>
            </div>
            <button onclick="window.closeInlineLookup()" style="background:#fce7f3;border:none;color:#be185d;border-radius:50%;width:28px;height:28px;font-weight:700;font-size:14px;cursor:pointer;display:flex;align-items:center;justify-content:center;">✕</button>
        </div>
        
        <div style="display:flex;align-items:baseline;gap:10px;flex-wrap:wrap;margin-bottom:6px;">
            <span id="inlineLookupWord" style="font-size:32px;font-weight:800;color:#be185d;font-family:'Kaiti','SimSun',serif,sans-serif;line-height:1.2;">--</span>
            <span id="inlineLookupPinyin" style="font-size:18px;font-weight:700;color:#db2777;">--</span>
            <button onclick="playAudio(document.getElementById('inlineLookupWord').textContent)" style="background:#fce7f3;border:none;border-radius:12px;padding:4px 12px;font-size:12.5px;font-weight:700;color:#be185d;cursor:pointer;display:inline-flex;align-items:center;gap:4px;">🔊 Nghe</button>
        </div>

        <div id="inlineLookupMeaning" style="font-size:15px;font-weight:600;color:#1e293b;line-height:1.5;margin-bottom:10px;background:#fdf2f8;padding:10px 14px;border-radius:12px;border:1px solid #fbcfe8;">
            Đang tra cứu nghĩa...
        </div>

        <div id="inlineLookupExtra" style="display:none;font-size:12.5px;color:#92400e;background:#fffbeb;border:1px solid #fde68a;padding:8px 12px;border-radius:10px;margin-bottom:12px;line-height:1.4;"></div>

        <div style="display:flex;gap:8px;">
            <button onclick="window.saveInlineLookupToFlashcards()" style="flex:1;padding:9px 14px;background:linear-gradient(135deg, #ec4899, #db2777);color:white;border:none;border-radius:12px;font-size:13px;font-weight:700;cursor:pointer;box-shadow:0 3px 10px rgba(236,72,153,0.3);display:flex;align-items:center;justify-content:center;gap:6px;">
                🃏 Lưu vào Flashcard chưa thuộc
            </button>
        </div>
    </div>

    <div id="personalProfileModal" class="modal-overlay" style="display:none;">
        <div style="background:white;border-radius:24px;max-width:880px;width:100%;max-height:90vh;display:flex;flex-direction:column;box-shadow:0 25px 60px rgba(0,0,0,0.3);overflow:hidden;border:1px solid #fbcfe8;">
            
            <!-- Modal Header -->
            <div style="background:linear-gradient(135deg, #fdf2f8, #fce7f3);padding:18px 24px;border-bottom:1px solid #fbcfe8;display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:12px;flex-shrink:0;">
                <div style="display:flex;align-items:center;gap:14px;">
                    <div style="width:48px;height:48px;background:#be185d;color:white;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:20px;font-weight:700;box-shadow:0 4px 12px rgba(190,24,93,0.3);" id="profileAvatar">👤</div>
                    <div>
                        <h2 style="font-size:20px;font-weight:700;color:#be185d;margin:0;" id="profileDisplayName">Tên Người Dùng</h2>
                        <div style="font-size:12px;color:#db2777;display:flex;gap:10px;align-items:center;margin-top:2px;flex-wrap:wrap;">
                            <span id="profileDisplayAge" style="background:rgba(255,255,255,0.7);padding:2px 8px;border-radius:12px;font-weight:600;">Tuổi: --</span>
                            <span id="profileDisplayEmail" style="color:#64748b;">email@gmail.com</span>
                        </div>
                    </div>
                </div>
                <div style="display:flex;gap:8px;align-items:center;">
                    <button onclick="openRegistrationModal(window.auth ? window.auth.currentUser : null)" style="padding:6px 14px;background:white;border:1px solid #fbcfe8;border-radius:10px;color:#be185d;font-size:12px;font-weight:600;cursor:pointer;transition:all 0.2s;">✏️ Sửa thông tin</button>
                    <button onclick="closePersonalProfileModal()" style="padding:6px 12px;background:#fce7f3;border:none;border-radius:10px;color:#be185d;font-size:15px;font-weight:700;cursor:pointer;">✕</button>
                </div>
            </div>

            <!-- Quick Stats Bar (Compact) -->
            <div style="display:grid;grid-template-columns:repeat(auto-fit, minmax(130px, 1fr));gap:8px;padding:8px 16px;background:#fff5f9;border-bottom:1px solid #fce7f3;flex-shrink:0;">
                <div class="stat-card" id="statCard-learned" onclick="switchProfileTab('learned')" style="background:white;padding:6px 10px;border-radius:12px;border:1.5px solid #fce7f3;text-align:center;box-shadow:0 1px 3px rgba(0,0,0,0.02);cursor:pointer;transition:all 0.2s;min-height:48px;display:flex;flex-direction:column;justify-content:center;">
                    <div style="font-size:11.5px;color:#64748b;font-weight:700;">📚 Bài Đã Học</div>
                    <div style="font-size:19px;font-weight:800;color:#be185d;margin-top:1px;" id="statLearnedCount">0</div>
                </div>
                <div class="stat-card" id="statCard-scores" onclick="switchProfileTab('scores')" style="background:white;padding:6px 10px;border-radius:12px;border:1.5px solid #fce7f3;text-align:center;box-shadow:0 1px 3px rgba(0,0,0,0.02);cursor:pointer;transition:all 0.2s;min-height:48px;display:flex;flex-direction:column;justify-content:center;">
                    <div style="font-size:11.5px;color:#64748b;font-weight:700;">📊 Điểm TB Làm Bài</div>
                    <div style="font-size:19px;font-weight:800;color:#16a34a;margin-top:1px;" id="statAverageScore">0%</div>
                </div>
                <div class="stat-card" id="statCard-mistakes" onclick="switchProfileTab('mistakes')" style="background:white;padding:6px 10px;border-radius:12px;border:1.5px solid #fce7f3;text-align:center;box-shadow:0 1px 3px rgba(0,0,0,0.02);cursor:pointer;transition:all 0.2s;min-height:48px;display:flex;flex-direction:column;justify-content:center;">
                    <div style="font-size:11.5px;color:#64748b;font-weight:700;">❌ Bài Tập Làm Sai</div>
                    <div style="font-size:19px;font-weight:800;color:#dc2626;margin-top:1px;" id="statMistakesCount">0</div>
                </div>
                <div class="stat-card" id="statCard-flashcards" onclick="switchProfileTab('flashcards')" style="background:white;padding:6px 10px;border-radius:12px;border:1.5px solid #fce7f3;text-align:center;box-shadow:0 1px 3px rgba(0,0,0,0.02);cursor:pointer;transition:all 0.2s;min-height:48px;display:flex;flex-direction:column;justify-content:center;">
                    <div style="font-size:11.5px;color:#64748b;font-weight:700;">🃏 Flashcard Chưa Thuộc</div>
                    <div style="font-size:19px;font-weight:800;color:#9c27b0;margin-top:1px;" id="statUnmasteredCount">0</div>
                </div>
                <div class="stat-card" id="statCard-notebook" onclick="switchProfileTab('notebook')" style="background:white;padding:6px 10px;border-radius:12px;border:1.5px solid #fce7f3;text-align:center;box-shadow:0 1px 3px rgba(0,0,0,0.02);cursor:pointer;transition:all 0.2s;min-height:48px;display:flex;flex-direction:column;justify-content:center;">
                    <div style="font-size:11.5px;color:#64748b;font-weight:700;">✍️ Chữ Đã Luyện</div>
                    <div style="font-size:19px;font-weight:800;color:#0284c7;margin-top:1px;" id="statNotebookCount">0</div>
                </div>
            </div>

            <div style="display:flex;border-bottom:2px solid #cbd5e1;background:#f1f5f9;padding:10px 16px;overflow-x:auto;gap:8px;align-items:center;flex-wrap:wrap;flex-shrink:0;z-index:5;">
                <button class="profile-nav-btn active" onclick="switchProfileTab('learned')" id="pNav-learned" style="padding:10px 18px;border:none;background:linear-gradient(135deg, #be185d, #db2777);border-radius:12px;color:white;font-weight:800;font-size:14px;cursor:pointer;white-space:nowrap;min-height:44px;box-shadow:0 4px 14px rgba(190,24,93,0.35);transition:all 0.2s;">
                    📚 Bài Đã Học
                </button>
                <button class="profile-nav-btn" onclick="switchProfileTab('scores')" id="pNav-scores" style="padding:10px 18px;border:none;background:white;border-radius:12px;color:#334155;font-weight:700;font-size:14px;cursor:pointer;white-space:nowrap;min-height:44px;box-shadow:0 2px 4px rgba(0,0,0,0.04);transition:all 0.2s;">
                    📊 Điểm TB Làm Bài
                </button>
                <button class="profile-nav-btn" onclick="switchProfileTab('mistakes')" id="pNav-mistakes" style="padding:10px 18px;border:none;background:white;border-radius:12px;color:#334155;font-weight:700;font-size:14px;cursor:pointer;white-space:nowrap;min-height:44px;box-shadow:0 2px 4px rgba(0,0,0,0.04);transition:all 0.2s;">
                    ❌ Bài Tập Làm Sai
                </button>
                <button class="profile-nav-btn" onclick="switchProfileTab('flashcards')" id="pNav-flashcards" style="padding:10px 18px;border:none;background:white;border-radius:12px;color:#334155;font-weight:700;font-size:14px;cursor:pointer;white-space:nowrap;min-height:44px;box-shadow:0 2px 4px rgba(0,0,0,0.04);transition:all 0.2s;">
                    🃏 Flashcard Chưa Thuộc
                </button>
                <button class="profile-nav-btn" onclick="switchProfileTab('notebook')" id="pNav-notebook" style="padding:10px 18px;border:none;background:white;border-radius:12px;color:#334155;font-weight:700;font-size:14px;cursor:pointer;white-space:nowrap;min-height:44px;box-shadow:0 2px 4px rgba(0,0,0,0.04);transition:all 0.2s;">
                    ✍️ Vở Tập Viết
                </button>
                <button class="profile-nav-btn" onclick="switchProfileTab('admin')" id="pNav-admin" style="display:none;padding:10px 18px;border:none;background:#f3e8ff;border-radius:12px;color:#7e22ce;font-weight:800;font-size:14px;cursor:pointer;white-space:nowrap;min-height:44px;transition:all 0.2s;">
                    👑 Quản lý Học viên (Admin)
                </button>
            </div>

            <div style="padding:18px 20px;overflow-y:auto;flex:1;min-height:0;" id="profileTabContainer">
            </div>

        </div>
    </div>

    <div id="retryQuestionModal" class="modal-overlay" style="display:none;">
        <div style="background:white;border-radius:20px;padding:28px;max-width:550px;width:100%;box-shadow:0 25px 60px rgba(0,0,0,0.3);border:1px solid #fbcfe8;">
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;">
                <h3 style="margin:0;font-size:18px;color:#be185d;font-weight:700;">🎯 Luyện Tập Lại Câu Sai</h3>
                <button onclick="document.getElementById('retryQuestionModal').style.display='none'" style="border:none;background:#fce7f3;color:#be185d;border-radius:8px;padding:4px 10px;font-weight:700;cursor:pointer;">✕</button>
            </div>
            <div id="retryQuestionBody">
            </div>
        </div>
    </div>

    <div id="unauthorizedDomainModal" class="modal-overlay" style="display:none;position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.6);z-index:1000001;justify-content:center;align-items:center;padding:20px;box-sizing:border-box;">
        <div style="background:white;border-radius:24px;padding:30px 26px;max-width:560px;width:100%;box-shadow:0 25px 70px rgba(190,24,93,0.25);border:2px solid #fbcfe8;position:relative;">
            <button onclick="document.getElementById('unauthorizedDomainModal').style.display='none'" style="position:absolute;top:18px;right:18px;border:none;background:#fce7f3;color:#be185d;border-radius:50%;width:32px;height:32px;font-size:16px;font-weight:700;cursor:pointer;">✕</button>
            
            <div style="display:flex;align-items:center;gap:12px;margin-bottom:16px;">
                <div style="width:48px;height:48px;background:#fff1f2;border:1px solid #fecdd3;border-radius:14px;display:flex;align-items:center;justify-content:center;font-size:24px;">🌐</div>
                <div>
                    <h3 style="margin:0;font-size:17.5px;color:#be185d;font-weight:800;">Cần ủy quyền tên miền trên Firebase</h3>
                    <span style="font-size:12px;color:#94a3b8;font-weight:600;">Firebase Authentication Domain Notice</span>
                </div>
            </div>

            <div style="background:#fff7ed;border:1px solid #fde68a;border-radius:14px;padding:14px;margin-bottom:18px;">
                <div style="font-size:12.5px;color:#9a3412;font-weight:700;margin-bottom:6px;">Tên miền xem trước hiện tại của ứng dụng:</div>
                <div style="display:flex;align-items:center;gap:8px;background:white;padding:8px 12px;border-radius:10px;border:1px solid #fed7aa;">
                    <code id="currentHostnameDisplay" style="font-size:12.5px;color:#c2410c;font-weight:700;flex:1;word-break:break-all;"></code>
                    <button onclick="window.copyCurrentDomain()" style="padding:6px 12px;background:#ea580c;color:white;border:none;border-radius:8px;font-size:11.5px;font-weight:700;cursor:pointer;white-space:nowrap;">📋 Sao chép</button>
                </div>
            </div>

            <div style="font-size:13px;color:#475569;line-height:1.6;margin-bottom:20px;">
                <p style="margin:0 0 8px 0;font-weight:600;color:#334155;">Hướng dẫn thêm tên miền vào Firebase Console:</p>
                <ol style="margin:0;padding-left:20px;display:flex;flex-direction:column;gap:5px;font-size:12.5px;">
                    <li>Mở <b>Firebase Console</b> → Dự án <code>hsk-grammar-9362c</code></li>
                    <li>Vào <b>Authentication</b> → Thẻ <b>Settings</b> → <b>Authorized domains</b></li>
                    <li>Nhấn <b>Add domain</b> và dán tên miền ở trên vào.</li>
                </ol>
            </div>

            <div style="display:flex;flex-direction:column;gap:10px;">
                <button onclick="window.continueAsGuest();document.getElementById('unauthorizedDomainModal').style.display='none';" style="width:100%;padding:13px 20px;background:linear-gradient(135deg,#be185d,#db2777);color:white;border:none;border-radius:14px;font-size:14px;font-weight:800;cursor:pointer;box-shadow:0 4px 14px rgba(190,24,93,0.3);display:flex;align-items:center;justify-content:center;gap:8px;">
                    <span>🚀 Tiếp tục học tập bằng Tài khoản Demo (Vào web ngay)</span>
                </button>
                <button onclick="document.getElementById('unauthorizedDomainModal').style.display='none'" style="width:100%;padding:9px;background:#f8fafc;color:#64748b;border:1px solid #e2e8f0;border-radius:12px;font-size:12.5px;font-weight:600;cursor:pointer;">
                    Đóng cửa sổ
                </button>
            </div>
        </div>
    </div>


    <!-- INFORMED CONSENT MODAL -->
    <div id="informedConsentModal" class="modal-overlay" style="display:none; z-index: 1000000; background: rgba(15, 23, 42, 0.85); backdrop-filter: blur(8px);">
        <div id="informedConsentModalBox" style="background: white; width: 92%; max-width: 580px; padding: 28px; border-radius: 24px; box-shadow: 0 20px 40px rgba(0,0,0,0.25); border: 2px solid #e9d5ff; font-family: 'Plus Jakarta Sans', sans-serif;">
            <div style="text-align: center; margin-bottom: 20px;">
                <div style="font-size: 48px; margin-bottom: 8px;">🔬📜</div>
                <h2 style="font-size: 22px; font-weight: 800; color: #6b21a8; margin: 0 0 6px 0;">Góc nhỏ minh bạch & Cam kết từ Admin 🤝</h2>
            </div>
            
            <div style="background: #faf5ff; border: 1px solid #e9d5ff; padding: 18px 20px; border-radius: 16px; margin-bottom: 24px; font-size: 14px; line-height: 1.6; color: #334155;">
                Trang web này giúp bạn học tiếng Trung bài bản và hoàn toàn miễn phí. Tuy nhiên, mình xin phép dùng dữ liệu học tập ẩn danh của bạn để phục vụ mục đích nghiên cứu khoa học.<br><br>
                Mình xin cam đoan không để lộ các thông tin cá nhân như tên, địa chỉ email của bạn. Các dữ liệu khác (như thời gian học, danh sách lỗi sai) chỉ dùng thuần túy cho nghiên cứu. Khi bạn bấm <b>"Đồng ý & Tiếp tục"</b>, có nghĩa là bạn đồng ý cho phép mình sử dụng dữ liệu này.<br><br>
                <b>Mình xin chân thành cảm ơn!</b>
            </div>

            <div style="display: flex; gap: 12px; justify-content: flex-end;">
                <button onclick="window.declineInformedConsent()" style="padding: 12px 20px; background: #f1f5f9; color: #64748b; border: 1px solid #cbd5e1; border-radius: 12px; font-size: 14px; font-weight: 700; cursor: pointer; transition: all 0.2s;">
                    ✕ Từ chối
                </button>
                <button onclick="window.acceptInformedConsent()" style="padding: 12px 24px; background: linear-gradient(135deg, #7e22ce, #9333ea); color: white; border: none; border-radius: 12px; font-size: 14px; font-weight: 800; cursor: pointer; box-shadow: 0 4px 14px rgba(126,34,206,0.35); transition: all 0.2s;">
                    🚀 Đồng ý & Tiếp tục
                </button>
            </div>
        </div>
    </div>

    <!-- PLACEMENT TEST MODAL -->
    <div id="placementTestModal" class="modal-overlay" style="display:none; z-index: 1000000; background: rgba(15, 23, 42, 0.85); backdrop-filter: blur(8px);">
        <div style="background: white; width: 92%; max-width: 680px; padding: 28px; border-radius: 24px; box-shadow: 0 20px 40px rgba(0,0,0,0.25); border: 2px solid #cbd5e1; font-family: 'Plus Jakarta Sans', sans-serif; position: relative; max-height: 90vh; overflow-y: auto;">
            <div style="margin-bottom: 20px; border-bottom: 1px solid #f1f5f9; padding-bottom: 16px;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
                    <span id="placementTestBadge" style="font-size: 12px; font-weight: 800; background: #e0e7ff; color: #3730a3; padding: 4px 12px; border-radius: 20px;">📝 PLACEMENT TEST RÚT GỌN</span>
                    <span id="placementTestLevelBadge" style="font-size: 12px; font-weight: 800; background: #be185d; color: white; padding: 4px 12px; border-radius: 20px;">HSK 1</span>
                </div>
                <h2 style="font-size: 20px; font-weight: 800; color: #0f172a; margin: 6px 0 4px 0;">Bài Kiểm Tra Đánh Giá Trình Độ Rút Gọn</h2>
                <p style="font-size: 13.5px; color: #64748b; margin: 0; line-height: 1.5;">Vui lòng hoàn thành 5 câu hỏi nhanh để xác nhận trình độ thực tế và tự động điều hướng đến cây bài học HSK tương ứng.</p>
            </div>

            <form id="placementTestForm" onsubmit="window.handlePlacementTestSubmit(event)">
                <div id="placementTestQuestionsContainer" style="display: flex; flex-direction: column; gap: 20px;">
                    <!-- Injected dynamically in JS -->
                </div>

                <div style="display: flex; justify-content: flex-end; margin-top: 24px; padding-top: 16px; border-top: 1px solid #f1f5f9;">
                    <button type="submit" style="padding: 12px 28px; background: linear-gradient(135deg, #2563eb, #1d4ed8); color: white; border: none; border-radius: 12px; font-size: 14.5px; font-weight: 800; cursor: pointer; box-shadow: 0 4px 14px rgba(37,99,235,0.35); transition: all 0.2s;">
                        🚀 Nộp bài & Điều hướng Lộ trình
                    </button>
                </div>
            </form>
        </div>
    </div>

    <!-- ONBOARDING INPUT SURVEY MODAL -->
    <div id="onboardingSurveyModal" class="modal-overlay" style="display:none; z-index: 1000000; background: rgba(15, 23, 42, 0.85); backdrop-filter: blur(8px);">
        <div style="background: white; width: 92%; max-width: 640px; padding: 28px; border-radius: 24px; box-shadow: 0 20px 40px rgba(0,0,0,0.25); border: 2px solid #fbcfe8; font-family: 'Plus Jakarta Sans', sans-serif; position: relative; max-height: 90vh; overflow-y: auto;">
            
            <!-- HEADER & PROGRESS BAR -->
            <div style="margin-bottom: 20px;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                    <span style="font-size: 13px; font-weight: 800; color: #be185d; text-transform: uppercase; letter-spacing: 0.5px;">📋 Khảo Sát Đầu Vào Cá Nhân Hóa</span>
                    <span id="surveyStepBadge" style="font-size: 12px; font-weight: 800; background: #fdf2f8; color: #be185d; padding: 4px 12px; border-radius: 20px; border: 1px solid #fbcfe8;">Bước 1 / 4 (25%)</span>
                </div>
                <div style="width: 100%; height: 8px; background: #f1f5f9; border-radius: 10px; overflow: hidden;">
                    <div id="surveyProgressBar" style="width: 25%; height: 100%; background: linear-gradient(90deg, #ec4899, #be185d); transition: width 0.3s ease;"></div>
                </div>
            </div>

            <form id="onboardingSurveyForm" onsubmit="window.handleSurveySubmit(event)">
                <!-- STEP 1: DEMOGRAPHICS -->
                <div id="surveyStep1" class="survey-step-content">
                    <h3 style="font-size: 17px; font-weight: 800; color: #0f172a; margin: 0 0 16px 0; padding-bottom: 8px; border-bottom: 1px solid #f1f5f9;">Màn hình 1: Thông tin Cơ bản</h3>
                    
                    <div style="margin-bottom: 16px;">
                        <label style="display: block; font-size: 13.5px; font-weight: 700; color: #334155; margin-bottom: 6px;">1. Mình có thể gọi bạn là gì? <span style="color: #e11d48;">*</span></label>
                        <input type="text" id="survey_nickname" required placeholder="Nhập tên/biệt danh của bạn..." style="width: 100%; padding: 11px 14px; border: 1.5px solid #cbd5e1; border-radius: 10px; font-size: 14px; outline: none; box-sizing: border-box;" />
                    </div>

                    <div style="margin-bottom: 16px;">
                        <label style="display: block; font-size: 13.5px; font-weight: 700; color: #334155; margin-bottom: 6px;">2. Bạn thuộc độ tuổi nào dưới đây? <span style="color: #e11d48;">*</span></label>
                        <select id="survey_age_group" required style="width: 100%; padding: 11px 14px; border: 1.5px solid #cbd5e1; border-radius: 10px; font-size: 14px; outline: none; box-sizing: border-box; background: white;">
                            <option value="">-- Chọn độ tuổi --</option>
                            <option value="under18">Dưới 18 tuổi</option>
                            <option value="18-22">18 - 22 tuổi</option>
                            <option value="23-30">23 - 30 tuổi</option>
                            <option value="over30">Trên 30 tuổi</option>
                        </select>
                    </div>

                    <div style="margin-bottom: 16px;">
                        <label style="display: block; font-size: 13.5px; font-weight: 700; color: #334155; margin-bottom: 6px;">3. Bạn có phải là học sinh/sinh viên chuyên ngành tiếng Trung không? <span style="color: #e11d48;">*</span></label>
                        <div style="display: flex; gap: 20px; margin-top: 6px;">
                            <label style="display: flex; align-items: center; gap: 8px; font-size: 14px; cursor: pointer; padding: 8px 16px; border: 1px solid #cbd5e1; border-radius: 8px; flex: 1;">
                                <input type="radio" name="survey_major" value="Có" required style="accent-color: #be185d; width: 18px; height: 18px;" /> Có
                            </label>
                            <label style="display: flex; align-items: center; gap: 8px; font-size: 14px; cursor: pointer; padding: 8px 16px; border: 1px solid #cbd5e1; border-radius: 8px; flex: 1;">
                                <input type="radio" name="survey_major" value="Không" required style="accent-color: #be185d; width: 18px; height: 18px;" /> Không
                            </label>
                        </div>
                    </div>

                    <div style="margin-bottom: 16px;">
                        <label style="display: block; font-size: 13.5px; font-weight: 700; color: #334155; margin-bottom: 6px;">4. Bạn đã học tiếng Trung được bao lâu? <span style="color: #e11d48;">*</span></label>
                        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-top: 6px;">
                            <label style="padding: 8px 12px; border: 1px solid #e2e8f0; border-radius: 8px; font-size: 13px; cursor: pointer; display: flex; align-items: center; gap: 6px;">
                                <input type="radio" name="survey_tenure" value="Mới bắt đầu (0 tháng)" required style="accent-color: #be185d;" /> Mới bắt đầu (0 tháng)
                            </label>
                            <label style="padding: 8px 12px; border: 1px solid #e2e8f0; border-radius: 8px; font-size: 13px; cursor: pointer; display: flex; align-items: center; gap: 6px;">
                                <input type="radio" name="survey_tenure" value="Dưới 6 tháng" required style="accent-color: #be185d;" /> Dưới 6 tháng
                            </label>
                            <label style="padding: 8px 12px; border: 1px solid #e2e8f0; border-radius: 8px; font-size: 13px; cursor: pointer; display: flex; align-items: center; gap: 6px;">
                                <input type="radio" name="survey_tenure" value="6 tháng - 1 năm" required style="accent-color: #be185d;" /> 6 tháng - 1 năm
                            </label>
                            <label style="padding: 8px 12px; border: 1px solid #e2e8f0; border-radius: 8px; font-size: 13px; cursor: pointer; display: flex; align-items: center; gap: 6px;">
                                <input type="radio" name="survey_tenure" value="1 - 2 năm" required style="accent-color: #be185d;" /> 1 - 2 năm
                            </label>
                            <label style="padding: 8px 12px; border: 1px solid #e2e8f0; border-radius: 8px; font-size: 13px; cursor: pointer; display: flex; align-items: center; gap: 6px; grid-column: 1/-1;">
                                <input type="radio" name="survey_tenure" value="Trên 2 năm" required style="accent-color: #be185d;" /> Trên 2 năm
                            </label>
                        </div>
                    </div>
                </div>

                <!-- STEP 2: PROFICIENCY & GOALS -->
                <div id="surveyStep2" class="survey-step-content" style="display:none;">
                    <h3 style="font-size: 17px; font-weight: 800; color: #0f172a; margin: 0 0 16px 0; padding-bottom: 8px; border-bottom: 1px solid #f1f5f9;">Màn hình 2: Trình độ & Mục tiêu</h3>

                    <div style="margin-bottom: 16px;">
                        <label style="display: block; font-size: 13.5px; font-weight: 700; color: #334155; margin-bottom: 6px;">5. Bạn muốn bắt đầu học với HSK mấy? <span style="color: #e11d48;">*</span></label>
                        <select id="survey_hsk_level" required style="width: 100%; padding: 11px 14px; border: 1.5px solid #cbd5e1; border-radius: 10px; font-size: 14px; outline: none; box-sizing: border-box; background: white;">
                            <option value="hsk1">HSK 1</option>
                            <option value="hsk2">HSK 2</option>
                            <option value="hsk3">HSK 3</option>
                            <option value="hsk4">HSK 4</option>
                            <option value="hsk5">HSK 5</option>
                            <option value="hsk6">HSK 6</option>
                        </select>
                    </div>

                    <div style="margin-bottom: 16px;">
                        <label style="display: block; font-size: 13.5px; font-weight: 700; color: #334155; margin-bottom: 6px;">6. Theo bạn, đâu là điểm khó khăn lớn nhất (kỹ năng yếu nhất) của bạn khi học tiếng Trung? <span style="color: #e11d48;">*</span></label>
                        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-top: 6px;">
                            <label style="padding: 10px; border: 1.5px solid #e2e8f0; border-radius: 10px; font-size: 13px; cursor: pointer; display: flex; align-items: center; gap: 8px; background: #fff8fa;">
                                <input type="radio" name="survey_weakness" value="pronunciation" required style="accent-color: #be185d;" /> 🔊 Phát âm & Thanh điệu
                            </label>
                            <label style="padding: 10px; border: 1.5px solid #e2e8f0; border-radius: 10px; font-size: 13px; cursor: pointer; display: flex; align-items: center; gap: 8px; background: #fff8fa;">
                                <input type="radio" name="survey_weakness" value="hanzi" required style="accent-color: #be185d;" /> 🀄 Nhớ mặt chữ Hán & Bút thuận
                            </label>
                            <label style="padding: 10px; border: 1.5px solid #e2e8f0; border-radius: 10px; font-size: 13px; cursor: pointer; display: flex; align-items: center; gap: 8px; background: #fff8fa;">
                                <input type="radio" name="survey_weakness" value="vocab" required style="accent-color: #be185d;" /> 📚 Nhớ Từ vựng
                            </label>
                            <label style="padding: 10px; border: 1.5px solid #e2e8f0; border-radius: 10px; font-size: 13px; cursor: pointer; display: flex; align-items: center; gap: 8px; background: #fff8fa;">
                                <input type="radio" name="survey_weakness" value="grammar" required style="accent-color: #be185d;" /> 📝 Ngữ pháp & Cấu trúc câu
                            </label>
                            <label style="padding: 10px; border: 1.5px solid #e2e8f0; border-radius: 10px; font-size: 13px; cursor: pointer; display: flex; align-items: center; gap: 8px; background: #fff8fa;">
                                <input type="radio" name="survey_weakness" value="speaking" required style="accent-color: #be185d;" /> 🎙️ Phản xạ Nghe-Nói
                            </label>
                            <label style="padding: 10px; border: 1.5px solid #e2e8f0; border-radius: 10px; font-size: 13px; cursor: pointer; display: flex; align-items: center; gap: 8px; background: #fff8fa;">
                                <input type="radio" name="survey_weakness" value="writing" required style="accent-color: #be185d;" /> ✍️ Dịch & Viết
                            </label>
                        </div>
                    </div>

                    <div style="margin-bottom: 16px;">
                        <label style="display: block; font-size: 13.5px; font-weight: 700; color: #334155; margin-bottom: 6px;">7. Mục đích lớn nhất của bạn khi học tiếng Trung là gì? <span style="color: #e11d48;">*</span></label>
                        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-top: 6px;">
                            <label style="padding: 8px 12px; border: 1px solid #e2e8f0; border-radius: 8px; font-size: 13px; cursor: pointer; display: flex; align-items: center; gap: 6px;">
                                <input type="radio" name="survey_goal" value="Thi chứng chỉ HSK" required style="accent-color: #be185d;" /> Thi lấy chứng chỉ HSK
                            </label>
                            <label style="padding: 8px 12px; border: 1px solid #e2e8f0; border-radius: 8px; font-size: 13px; cursor: pointer; display: flex; align-items: center; gap: 6px;">
                                <input type="radio" name="survey_goal" value="Du học / Công việc" required style="accent-color: #be185d;" /> Du học / Phục vụ công việc
                            </label>
                            <label style="padding: 8px 12px; border: 1px solid #e2e8f0; border-radius: 8px; font-size: 13px; cursor: pointer; display: flex; align-items: center; gap: 6px;">
                                <input type="radio" name="survey_goal" value="Sở thích & Giao tiếp" required style="accent-color: #be185d;" /> Sở thích, xem phim, giao tiếp
                            </label>
                            <label style="padding: 8px 12px; border: 1px solid #e2e8f0; border-radius: 8px; font-size: 13px; cursor: pointer; display: flex; align-items: center; gap: 6px;">
                                <input type="radio" name="survey_goal" value="Khác" required style="accent-color: #be185d;" /> Khác
                            </label>
                        </div>
                    </div>

                    <div style="margin-bottom: 16px;">
                        <label style="display: block; font-size: 13.5px; font-weight: 700; color: #334155; margin-bottom: 6px;">8. Mục tiêu cụ thể trong 1-2 tháng tới của bạn trên web? <span style="color: #e11d48;">*</span></label>
                        <input type="text" id="survey_target" required placeholder="Ví dụ: Đạt 250 điểm HSK 4, thuộc 500 từ vựng..." style="width: 100%; padding: 11px 14px; border: 1.5px solid #cbd5e1; border-radius: 10px; font-size: 14px; outline: none; box-sizing: border-box;" />
                    </div>
                </div>

                <!-- STEP 3: LEARNER BEHAVIOR -->
                <div id="surveyStep3" class="survey-step-content" style="display:none;">
                    <h3 style="font-size: 17px; font-weight: 800; color: #0f172a; margin: 0 0 16px 0; padding-bottom: 8px; border-bottom: 1px solid #f1f5f9;">Màn hình 3: Hành vi Học tập</h3>

                    <div style="margin-bottom: 20px;">
                        <label style="display: block; font-size: 13.5px; font-weight: 700; color: #334155; margin-bottom: 6px;">9. Trung bình mỗi ngày bạn dành bao nhiêu thời gian học tiếng Trung? <span style="color: #e11d48;">*</span></label>
                        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-top: 6px;">
                            <label style="padding: 10px; border: 1px solid #e2e8f0; border-radius: 8px; font-size: 13px; cursor: pointer; display: flex; align-items: center; gap: 6px;">
                                <input type="radio" name="survey_total_time" value="Dưới 30 phút" required style="accent-color: #be185d;" /> Dưới 30 phút
                            </label>
                            <label style="padding: 10px; border: 1px solid #e2e8f0; border-radius: 8px; font-size: 13px; cursor: pointer; display: flex; align-items: center; gap: 6px;">
                                <input type="radio" name="survey_total_time" value="30 - 60 phút" required style="accent-color: #be185d;" /> 30 - 60 phút
                            </label>
                            <label style="padding: 10px; border: 1px solid #e2e8f0; border-radius: 8px; font-size: 13px; cursor: pointer; display: flex; align-items: center; gap: 6px;">
                                <input type="radio" name="survey_total_time" value="1 - 2 tiếng" required style="accent-color: #be185d;" /> 1 - 2 tiếng
                            </label>
                            <label style="padding: 10px; border: 1px solid #e2e8f0; border-radius: 8px; font-size: 13px; cursor: pointer; display: flex; align-items: center; gap: 6px;">
                                <input type="radio" name="survey_total_time" value="Trên 2 tiếng" required style="accent-color: #be185d;" /> Trên 2 tiếng
                            </label>
                        </div>
                    </div>

                    <div style="margin-bottom: 20px;">
                        <label style="display: block; font-size: 13.5px; font-weight: 700; color: #334155; margin-bottom: 6px;">10. Bạn dự định dành bao nhiêu thời gian MỖI NGÀY để học trên trang web này? <span style="color: #e11d48;">*</span></label>
                        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-top: 6px;">
                            <label style="padding: 10px; border: 1.5px solid #fbcfe8; border-radius: 8px; font-size: 13px; cursor: pointer; display: flex; align-items: center; gap: 6px; background: #fdf2f8;">
                                <input type="radio" name="survey_site_time" value="15 phút" required style="accent-color: #be185d;" /> 15 phút
                            </label>
                            <label style="padding: 10px; border: 1.5px solid #fbcfe8; border-radius: 8px; font-size: 13px; cursor: pointer; display: flex; align-items: center; gap: 6px; background: #fdf2f8;">
                                <input type="radio" name="survey_site_time" value="30 phút" required style="accent-color: #be185d;" /> 30 phút
                            </label>
                            <label style="padding: 10px; border: 1.5px solid #fbcfe8; border-radius: 8px; font-size: 13px; cursor: pointer; display: flex; align-items: center; gap: 6px; background: #fdf2f8;">
                                <input type="radio" name="survey_site_time" value="45 phút" required style="accent-color: #be185d;" /> 45 phút
                            </label>
                            <label style="padding: 10px; border: 1.5px solid #fbcfe8; border-radius: 8px; font-size: 13px; cursor: pointer; display: flex; align-items: center; gap: 6px; background: #fdf2f8;">
                                <input type="radio" name="survey_site_time" value="60 phút+" required style="accent-color: #be185d;" /> 60 phút+
                            </label>
                        </div>
                    </div>
                </div>

                <!-- STEP 4: ATTITUDE & SELF-REGULATION -->
                <div id="surveyStep4" class="survey-step-content" style="display:none;">
                    <h3 style="font-size: 17px; font-weight: 800; color: #0f172a; margin: 0 0 16px 0; padding-bottom: 8px; border-bottom: 1px solid #f1f5f9;">Màn hình 4: Tâm lý & Thái độ</h3>

                    <div style="margin-bottom: 20px;">
                        <label style="display: block; font-size: 13.5px; font-weight: 700; color: #334155; margin-bottom: 6px;">11. Mức độ tự duy trì thói quen học tập của bạn? (Thang 1-5) <span style="color: #e11d48;">*</span></label>
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 8px; background: #faf5ff; padding: 12px; border-radius: 12px; border: 1px solid #e9d5ff;">
                            <span style="font-size: 12px; color: #64748b; font-weight: 600; width: 80px;">1 - Rất dễ bỏ dở</span>
                            <div style="display: flex; gap: 14px;">
                                <label style="display: flex; flex-direction: column; align-items: center; gap: 4px; font-size: 12px; font-weight: 700; cursor: pointer;">
                                    <input type="radio" name="survey_regulation" value="1" required style="accent-color: #be185d;" /> 1
                                </label>
                                <label style="display: flex; flex-direction: column; align-items: center; gap: 4px; font-size: 12px; font-weight: 700; cursor: pointer;">
                                    <input type="radio" name="survey_regulation" value="2" required style="accent-color: #be185d;" /> 2
                                </label>
                                <label style="display: flex; flex-direction: column; align-items: center; gap: 4px; font-size: 12px; font-weight: 700; cursor: pointer;">
                                    <input type="radio" name="survey_regulation" value="3" required style="accent-color: #be185d;" /> 3
                                </label>
                                <label style="display: flex; flex-direction: column; align-items: center; gap: 4px; font-size: 12px; font-weight: 700; cursor: pointer;">
                                    <input type="radio" name="survey_regulation" value="4" required style="accent-color: #be185d;" /> 4
                                </label>
                                <label style="display: flex; flex-direction: column; align-items: center; gap: 4px; font-size: 12px; font-weight: 700; cursor: pointer;">
                                    <input type="radio" name="survey_regulation" value="5" required style="accent-color: #be185d;" /> 5
                                </label>
                            </div>
                            <span style="font-size: 12px; color: #64748b; font-weight: 600; width: 80px; text-align: right;">5 - Rất kỷ luật</span>
                        </div>
                    </div>

                    <div style="margin-bottom: 20px;">
                        <label style="display: block; font-size: 13.5px; font-weight: 700; color: #334155; margin-bottom: 6px;">12. Cảm xúc khi gặp bài tập khó hoặc làm sai? <span style="color: #e11d48;">*</span></label>
                        <div style="display: flex; flex-direction: column; gap: 8px; margin-top: 6px;">
                            <label style="padding: 10px 14px; border: 1px solid #e2e8f0; border-radius: 8px; font-size: 13px; cursor: pointer; display: flex; align-items: center; gap: 8px;">
                                <input type="radio" name="survey_attitude" value="Rất lo nản lòng, muốn bỏ qua" required style="accent-color: #be185d;" /> 😓 Rất lo nản lòng, dễ có tâm lý muốn bỏ qua
                            </label>
                            <label style="padding: 10px 14px; border: 1px solid #e2e8f0; border-radius: 8px; font-size: 13px; cursor: pointer; display: flex; align-items: center; gap: 8px;">
                                <input type="radio" name="survey_attitude" value="Bình thường" required style="accent-color: #be185d;" /> 😐 Bình thường, làm tiếp các câu khác
                            </label>
                            <label style="padding: 10px 14px; border: 1px solid #e2e8f0; border-radius: 8px; font-size: 13px; cursor: pointer; display: flex; align-items: center; gap: 8px;">
                                <input type="radio" name="survey_attitude" value="Thích thú, quyết tâm tìm đáp án" required style="accent-color: #be185d;" /> 🔥 Thích thú, tò mò tìm cách giải bằng được
                            </label>
                        </div>
                    </div>
                </div>

                <!-- BUTTONS NAVIGATION -->
                <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 24px; padding-top: 16px; border-top: 1px solid #f1f5f9;">
                    <button type="button" id="surveyPrevBtn" onclick="window.prevSurveyStep()" style="display:none; padding: 10px 18px; background: #f1f5f9; color: #475569; border: 1px solid #cbd5e1; border-radius: 10px; font-size: 13.5px; font-weight: 700; cursor: pointer;">
                        ◀ Quay lại
                    </button>
                    <div style="margin-left: auto; display: flex; gap: 10px;">
                        <button type="button" id="surveyNextBtn" onclick="window.nextSurveyStep()" style="padding: 10px 22px; background: linear-gradient(135deg, #be185d, #db2777); color: white; border: none; border-radius: 10px; font-size: 13.5px; font-weight: 800; cursor: pointer; box-shadow: 0 4px 12px rgba(190,24,93,0.3);">
                            Tiếp theo ▶
                        </button>
                        <button type="submit" id="surveySubmitBtn" style="display:none; padding: 10px 24px; background: linear-gradient(135deg, #16a34a, #15803d); color: white; border: none; border-radius: 10px; font-size: 13.5px; font-weight: 800; cursor: pointer; box-shadow: 0 4px 12px rgba(22,163,74,0.3);">
                            🎉 Hoàn thành & Nhận Lộ trình
                        </button>
                    </div>
                </div>
            </form>
        </div>
    </div>

    <!-- MODAL XÁC NHẬN CHUYỂN BẬC HSK -->
    <div id="hskSwitchConfirmModal" class="modal-overlay" style="display:none; position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(15,23,42,0.75); backdrop-filter:blur(6px); z-index:999999; justify-content:center; align-items:center; animation:fadeInModal 0.25s ease-out;">
        <div style="background:white; border-radius:24px; padding:28px 26px; max-width:440px; width:90%; box-shadow:0 25px 50px rgba(0,0,0,0.3); border:1.5px solid #fbcfe8; text-align:center;">
            <div style="width:60px; height:60px; background:#fdf2f8; border-radius:50%; display:flex; align-items:center; justify-content:center; margin:0 auto 16px; font-size:28px; border:2px solid #fbcfe8; box-shadow:0 4px 12px rgba(236,72,153,0.15);">
                🔄
            </div>
            <h3 style="font-size:20px; font-weight:800; color:#1e293b; margin:0 0 10px 0; font-family:'Lexend',sans-serif;">
                Xác Nhận Chuyển Lộ Trình
            </h3>
            <p id="hskSwitchConfirmMessage" style="font-size:14.5px; color:#475569; line-height:1.6; margin:0 0 24px 0;">
                Bạn có chắc chắn muốn chuyển lộ trình từ <strong id="hskSwitchFromSpan" style="color:#be185d; text-decoration:underline;">HSK 1</strong> sang <strong id="hskSwitchToSpan" style="color:#0284c7; text-decoration:underline;">HSK 2</strong> không?
            </p>
            <div style="display:flex; gap:12px; justify-content:center;">
                <button onclick="window.closeHskSwitchConfirmModal()" style="flex:1; padding:12px 18px; background:#f1f5f9; color:#475569; border:1px solid #cbd5e1; border-radius:12px; font-size:14px; font-weight:700; cursor:pointer; transition:all 0.2s;">
                    Hủy
                </button>
                <button id="hskSwitchConfirmBtn" style="flex:1; padding:12px 18px; background:linear-gradient(135deg, #be185d, #9d174d); color:white; border:none; border-radius:12px; font-size:14px; font-weight:800; cursor:pointer; box-shadow:0 4px 14px rgba(190,24,93,0.35); transition:all 0.2s;">
                    Xác nhận chuyển
                </button>
            </div>
        </div>
    </div>
`;
    while (tempDiv.firstChild) {
        document.body.appendChild(tempDiv.firstChild);
    }
})();
