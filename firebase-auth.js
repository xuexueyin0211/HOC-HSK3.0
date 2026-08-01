        import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
        import { getAuth, signInWithPopup, GoogleAuthProvider, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";

        const firebaseConfig = {
            apiKey: "AIzaSyDCdhn_V1bHA3xLESUEtfihjOPii_Vf7ow",
            authDomain: "hsk-grammar-9362c.firebaseapp.com",
            projectId: "hsk-grammar-9362c",
            storageBucket: "hsk-grammar-9362c.firebasestorage.app",
            messagingSenderId: "461876969087",
            appId: "1:461876969087:web:b439e3edcea4a74a63c94a"
        };

        const app = initializeApp(firebaseConfig);
        const auth = getAuth(app);
        window.auth = auth;
        const provider = new GoogleAuthProvider();

        window.showUnauthorizedDomainModal = () => {
            const domain = window.location.hostname || window.location.host;
            const hostEl = document.getElementById('currentHostnameDisplay');
            if (hostEl) hostEl.innerText = domain;
            const modal = document.getElementById('unauthorizedDomainModal');
            if (modal) modal.style.display = 'flex';
        };

        window.closeUnauthorizedDomainModal = () => {
            const modal = document.getElementById('unauthorizedDomainModal');
            if (modal) modal.style.display = 'none';
        };

        window.copyCurrentDomain = () => {
            const domain = window.location.hostname || window.location.host;
            if (navigator.clipboard && navigator.clipboard.writeText) {
                navigator.clipboard.writeText(domain).then(() => {
                    alert("Đã sao chép tên miền: " + domain + "\nHãy dán tên miền này vào Firebase Console -> Authentication -> Settings -> Authorized domains.");
                }).catch(() => {
                    prompt("Hãy sao chép tên miền bên dưới:", domain);
                });
            } else {
                prompt("Hãy sao chép tên miền bên dưới:", domain);
            }
        };

        window.loginWithGoogle = () => {
            signInWithPopup(auth, provider)
                .then(result => console.log("✅ Đã đăng nhập:", result.user.displayName))
                .catch(error => {
                    console.warn("⚠️ Firebase Auth notice:", error.code || error.message);
                    if (error.code === 'auth/unauthorized-domain' || (error.message && error.message.includes('unauthorized-domain'))) {
                        window.showUnauthorizedDomainModal();
                    } else if (error.code === 'auth/popup-closed-by-user' || error.code === 'auth/cancelled-popup-request') {
                        console.log("ℹ️ Đã đóng cửa sổ đăng nhập.");
                    } else {
                        window.showUnauthorizedDomainModal();
                    }
                });
        };

        let isGuestMode = false;

        window.continueAsGuest = () => {
            isGuestMode = true;
            const loginOverlay = document.getElementById('login-overlay');
            if (loginOverlay) loginOverlay.style.display = 'none';
            const profile = window.getUserProfile('guest');
            if (!profile.name || !profile.age) {
                profile.name = 'Khách (Guest)';
                profile.age = 20;
                profile.registered = true;
                window.saveUserProfile(profile);
            }
            window.updateUserHeaderUI(profile, null);
        };

        window.logout = () => {
            isGuestMode = false;
            document.querySelectorAll('.user-info').forEach(el => el.remove());
            document.querySelectorAll('.profile-btn').forEach(el => el.remove());
            document.querySelectorAll('.logout-btn').forEach(el => el.remove());
            const headerProfileBtn = document.getElementById('headerProfileBtn');
            const headerLogoutBtn = document.getElementById('headerLogoutBtn');
            if (headerProfileBtn) headerProfileBtn.style.display = 'none';
            if (headerLogoutBtn) headerLogoutBtn.style.display = 'none';
            const a = window.auth || auth;
            if (a) {
                signOut(a);
            }
            const loginOverlay = document.getElementById('login-overlay');
            if (loginOverlay) loginOverlay.style.display = 'flex';
        };

        // ================================================================
        // HỆ THỐNG QUẢN LÝ TÀI KHOẢN & TRANG CÁ NHÂN (PROFILE & PROGRESS ENGINE)
        // ================================================================
        window.activeProfileTab = 'learned';
        window.currentAuthUser = null;

        window.getProfileKey = function(uid) {
            const user = (window.auth && window.auth.currentUser) ? window.auth.currentUser : (typeof auth !== 'undefined' ? auth.currentUser : null);
            const id = uid || (user ? user.uid : 'guest');
            return 'hsk_user_profile_' + id;
        };

        window.getUserProfile = function(uid) {
            const user = (window.auth && window.auth.currentUser) ? window.auth.currentUser : (typeof auth !== 'undefined' ? auth.currentUser : null);
            const targetUid = uid || (user ? user.uid : 'guest');
            const key = window.getProfileKey(targetUid);
            const saved = localStorage.getItem(key);
            if (saved) {
                try {
                    const parsed = JSON.parse(saved);
                    parsed.uid = parsed.uid || targetUid;
                    if (!parsed.learnedLessons) parsed.learnedLessons = [];
                    if (!parsed.lessonScores) parsed.lessonScores = [];
                    if (!parsed.wrongExercises) parsed.wrongExercises = [];
                    if (!parsed.unmasteredFlashcards) parsed.unmasteredFlashcards = [];
                    return parsed;
                } catch(e) { console.error('Error parsing user profile:', e); }
            }
            return {
                uid: targetUid,
                email: (user && user.email) ? user.email : '',
                name: '',
                age: '',
                registered: false,
                registeredAt: null,
                learnedLessons: [],
                lessonScores: [],
                wrongExercises: [],
                unmasteredFlashcards: []
            };
        };

        window.saveUserProfile = function(profile) {
            if (!profile) return;
            const user = (window.auth && window.auth.currentUser) ? window.auth.currentUser : (typeof auth !== 'undefined' ? auth.currentUser : null);
            if (!profile.uid) profile.uid = user ? user.uid : 'guest';
            const key = window.getProfileKey(profile.uid);
            localStorage.setItem(key, JSON.stringify(profile));
            window.syncFlashcardsWithProfile(profile);
        };

        window.syncFlashcardsWithProfile = function(profile) {
            if (!profile) profile = window.getUserProfile();
            if (profile.unmasteredFlashcards && Array.isArray(profile.unmasteredFlashcards)) {
                profile.unmasteredFlashcards.forEach(card => {
                    if (card && card.cn && typeof undefinedWords !== 'undefined') {
                        const exists = undefinedWords.some(w => w.cn === card.cn);
                        if (!exists) {
                            undefinedWords.push(card);
                        }
                    }
                });
            }
        };

        // --- ONBOARDING REGISTRATION FLOW ---
        window.openRegistrationModal = function(user) {
            window.currentAuthUser = user;
            const modal = document.getElementById('registrationModal');
            const regEmail = document.getElementById('regEmail');
            const regName = document.getElementById('regName');
            const regAge = document.getElementById('regAge');
            
            const uid = user ? user.uid : 'guest';
            const profile = window.getUserProfile(uid);

            if (regEmail) regEmail.value = user ? (user.email || 'guest@xueying.com') : 'guest@xueying.com';
            if (regName) regName.value = profile.name || (user ? user.displayName || '' : 'Khách');
            if (regAge) regAge.value = profile.age || '';

            if (modal) modal.style.display = 'flex';
        };

        window.closeRegistrationModal = function() {
            const modal = document.getElementById('registrationModal');
            if (modal) modal.style.display = 'none';
        };

        window.handleRegistrationSubmit = function(e) {
            e.preventDefault();
            const name = document.getElementById('regName').value.trim();
            const age = parseInt(document.getElementById('regAge').value, 10);
            
            if (!name) { alert('Vui lòng nhập Họ và Tên!'); return; }
            if (isNaN(age) || age < 1 || age > 120) { alert('Vui lòng nhập tuổi hợp lệ!'); return; }

            const user = window.currentAuthUser || auth.currentUser;
            const uid = user ? user.uid : 'guest';
            const profile = window.getUserProfile(uid);

            profile.name = name;
            profile.age = age;
            profile.email = user ? (user.email || profile.email) : (profile.email || 'guest@xueying.com');
            profile.registered = true;
            if (!profile.registeredAt) profile.registeredAt = new Date().toISOString();

            window.saveUserProfile(profile);

            // Cập nhật danh sách học viên quản lý bởi Admin
            if (window.getRegisteredUsersList) {
                let users = window.getRegisteredUsersList();
                const existingIdx = users.findIndex(u => u.uid === uid || (u.email && u.email === profile.email));
                const newRecord = {
                    uid: uid,
                    name: profile.name,
                    age: profile.age,
                    email: profile.email,
                    registeredAt: profile.registeredAt || new Date().toISOString(),
                    learnedCount: (profile.learnedLessons || []).length,
                    scoresCount: (profile.lessonScores || []).length
                };
                if (existingIdx !== -1) {
                    users[existingIdx] = newRecord;
                } else {
                    users.unshift(newRecord);
                }
                if (window.saveRegisteredUsersList) window.saveRegisteredUsersList(users);
            }

            window.closeRegistrationModal();

            window.updateUserHeaderUI(profile, user);
            alert('🎉 Cập nhật thông tin thành công! Chào mừng ' + name + ' (' + age + ' tuổi) đến với XueYing Chinese.');
        };

        // --- HEADER UI UPDATER ---
        window.updateUserHeaderUI = function(profile, user) {
            // Xóa tất cả các nút/ô hiển thị trôi nổi cũ nếu có
            document.querySelectorAll('.user-info').forEach(el => el.remove());
            document.querySelectorAll('.profile-btn').forEach(el => el.remove());
            document.querySelectorAll('.logout-btn').forEach(el => el.remove());

            const headerAdminBtn = document.getElementById('headerAdminBtn');
            const headerProfileBtn = document.getElementById('headerProfileBtn');
            const headerLogoutBtn = document.getElementById('headerLogoutBtn');
            const pNavAdmin = document.getElementById('pNav-admin');

            const email = (user && user.email) ? user.email.toLowerCase() : (profile && profile.email ? profile.email.toLowerCase() : '');
            const isAdmin = (email === 'xueyinlaoshi@gmail.com');

            if (headerAdminBtn) {
                headerAdminBtn.style.display = isAdmin ? 'inline-flex' : 'none';
            }
            if (pNavAdmin) {
                pNavAdmin.style.display = isAdmin ? 'inline-block' : 'none';
            }

            if (headerProfileBtn) {
                headerProfileBtn.style.display = 'inline-flex';
                headerProfileBtn.innerHTML = `👤 Trang cá nhân`;
            }

            if (headerLogoutBtn) {
                headerLogoutBtn.style.display = 'inline-flex';
            }
        };

        // --- PERSONAL PROFILE DASHBOARD ---
        window.openPersonalProfileModal = function() {
            const user = auth.currentUser;
            const uid = user ? user.uid : 'guest';
            const profile = window.getUserProfile(uid);

            const email = (user && user.email) ? user.email.toLowerCase() : (profile && profile.email ? profile.email.toLowerCase() : '');
            const isAdmin = (email === 'xueyinlaoshi@gmail.com');
            const pNavAdmin = document.getElementById('pNav-admin');
            if (pNavAdmin) {
                pNavAdmin.style.display = isAdmin ? 'inline-block' : 'none';
            }

            document.getElementById('profileDisplayName').textContent = profile.name || 'Chưa đặt tên';
            document.getElementById('profileDisplayAge').textContent = 'Tuổi: ' + (profile.age || '--');
            document.getElementById('profileDisplayEmail').textContent = profile.email || (user ? user.email : 'guest@xueying.com');

            const learnedCount = profile.learnedLessons ? profile.learnedLessons.length : 0;
            const mistakesCount = profile.wrongExercises ? profile.wrongExercises.length : 0;
            const unmasteredCount = profile.unmasteredFlashcards ? profile.unmasteredFlashcards.length : 0;

            let avgScore = 0;
            if (profile.lessonScores && profile.lessonScores.length > 0) {
                const totalPct = profile.lessonScores.reduce((acc, curr) => acc + (curr.percentage || 0), 0);
                avgScore = Math.round(totalPct / profile.lessonScores.length);
            }

            document.getElementById('statLearnedCount').textContent = learnedCount;
            document.getElementById('statAverageScore').textContent = avgScore + '%';
            document.getElementById('statMistakesCount').textContent = mistakesCount;
            document.getElementById('statUnmasteredCount').textContent = unmasteredCount;

            document.getElementById('personalProfileModal').style.display = 'flex';
            window.switchProfileTab(window.activeProfileTab || 'learned');
        };

        window.closePersonalProfileModal = function() {
            const modal = document.getElementById('personalProfileModal');
            if (modal) modal.style.display = 'none';
        };

        window.switchProfileTab = function(tabName) {
            window.activeProfileTab = tabName;
            document.querySelectorAll('.profile-nav-btn').forEach(btn => {
                btn.classList.remove('active');
                btn.style.background = 'white';
                btn.style.color = '#334155';
                btn.style.fontWeight = '700';
                btn.style.boxShadow = '0 2px 4px rgba(0,0,0,0.04)';
            });

            document.querySelectorAll('.stat-card').forEach(card => {
                card.style.borderColor = '#fce7f3';
                card.style.boxShadow = '0 1px 3px rgba(0,0,0,0.02)';
                card.style.transform = 'scale(1)';
            });

            const activeNavBtn = document.getElementById('pNav-' + tabName);
            if (activeNavBtn) {
                activeNavBtn.classList.add('active');
                if (tabName === 'admin') {
                    activeNavBtn.style.background = 'linear-gradient(135deg, #7e22ce, #6b21a8)';
                    activeNavBtn.style.color = 'white';
                    activeNavBtn.style.boxShadow = '0 4px 14px rgba(126,34,206,0.35)';
                } else {
                    activeNavBtn.style.background = 'linear-gradient(135deg, #be185d, #db2777)';
                    activeNavBtn.style.color = 'white';
                    activeNavBtn.style.boxShadow = '0 4px 14px rgba(190,24,93,0.35)';
                }
                activeNavBtn.style.fontWeight = '800';
            }

            const activeStatCard = document.getElementById('statCard-' + tabName);
            if (activeStatCard) {
                activeStatCard.style.borderColor = '#ec4899';
                activeStatCard.style.boxShadow = '0 6px 20px rgba(236,72,153,0.2)';
                activeStatCard.style.transform = 'scale(1.02)';
            }

            const container = document.getElementById('profileTabContainer');
            if (!container) return;

            const user = (window.auth && window.auth.currentUser) ? window.auth.currentUser : null;
            const uid = user ? user.uid : 'guest';
            const profile = window.getUserProfile(uid);

            if (tabName === 'learned') window.renderLearnedTab(container, profile);
            else if (tabName === 'scores') window.renderScoresTab(container, profile);
            else if (tabName === 'mistakes') window.renderMistakesTab(container, profile);
            else if (tabName === 'flashcards') window.renderFlashcardsTab(container, profile);
            else if (tabName === 'admin') window.renderAdminTab(container, profile);
        };

        window.openAdminModal = function() {
            window.openPersonalProfileModal();
            window.switchProfileTab('admin');
        };

        // --- TAB 1: BÀI ĐÃ HỌC ---
        window.renderLearnedTab = function(container, profile) {
            const list = profile.learnedLessons || [];
            if (list.length === 0) {
                container.innerHTML = `
                    <div style="text-align:center;padding:40px 20px;color:#64748b;">
                        <div style="font-size:48px;margin-bottom:12px;">📚</div>
                        <h4 style="font-size:16px;color:#334155;margin-bottom:6px;">Chưa có bài học nào hoàn thành</h4>
                        <p style="font-size:13px;">Hãy chọn các bài học trong chương trình HSK và nhấn nút "Đánh dấu đã học" hoặc hoàn thành bài tập để ghi nhận vào đây!</p>
                    </div>
                `;
                return;
            }

            let html = `
                <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;">
                    <div style="font-size:14px;font-weight:700;color:#334155;">Danh sách ${list.length} bài đã học:</div>
                    <button onclick="window.clearLearnedLessons()" style="padding:4px 10px;font-size:12px;background:#fff1f2;color:#e11d48;border:1px solid #fecdd3;border-radius:8px;cursor:pointer;">Xóa tất cả</button>
                </div>
                <div style="display:grid;grid-template-columns:repeat(auto-fill, minmax(260px, 1fr));gap:14px;">
            `;

            list.forEach(item => {
                const levelColor = { hsk1: '#22c55e', hsk2: '#f97316', hsk3: '#ec4899', hsk4: '#a855f7', hsk5: '#0284c7', hsk6: '#d946ef' }[item.level] || '#ec4899';
                const dateStr = item.date ? new Date(item.date).toLocaleDateString('vi-VN') : '';

                html += `
                    <div style="background:white;border:1px solid #fbcfe8;border-radius:16px;padding:16px;box-shadow:0 2px 8px rgba(0,0,0,0.03);display:flex;flex-direction:column;justify-content:space-between;">
                        <div>
                            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;">
                                <span style="background:${levelColor};color:white;font-size:10px;font-weight:800;padding:2px 8px;border-radius:10px;text-transform:uppercase;">${item.level || 'HSK'}</span>
                                <span style="font-size:11px;color:#94a3b8;">${dateStr}</span>
                            </div>
                            <h4 style="font-size:15px;color:#1e293b;font-weight:700;margin:0 0 4px 0;">${item.title || 'Bài học'}</h4>
                            <div style="font-size:12px;color:#db2777;font-weight:500;">${item.category || 'Ngữ pháp / Từ vựng'}</div>
                        </div>
                        <div style="display:flex;gap:8px;margin-top:14px;">
                            <button onclick="window.openLessonDirectly('${item.category === 'Từ vựng' ? 'vocab' : 'grammar'}', '${item.level}', '${item.id}')" style="flex:1;padding:8px;background:#fdf2f8;color:#be185d;border:1px solid #fbcfe8;border-radius:10px;font-size:12px;font-weight:700;cursor:pointer;">Học lại</button>
                            <button onclick="window.removeLearnedLesson('${item.id}')" style="padding:8px 12px;background:#fff1f2;color:#e11d48;border:1px solid #fecdd3;border-radius:10px;font-size:12px;cursor:pointer;">Xóa</button>
                        </div>
                    </div>
                `;
            });
            html += `</div>`;
            container.innerHTML = html;
        };

        // --- TAB 2: ĐIỂM SỐ BÀI HỌC ---
        window.renderScoresTab = function(container, profile) {
            const list = profile.lessonScores || [];
            
            let avgScore = 0;
            if (list.length > 0) {
                const totalPct = list.reduce((acc, curr) => acc + (curr.percentage || 0), 0);
                avgScore = Math.round(totalPct / list.length);
            }

            let html = `
                <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:16px;padding:16px 20px;margin-bottom:18px;">
                    <div style="display:flex;align-items:center;gap:8px;color:#0f172a;font-weight:700;font-size:15px;margin-bottom:6px;">
                        📊 Cơ chế tính điểm trung bình (TB) làm bài
                    </div>
                    <div style="font-size:13px;color:#475569;line-height:1.6;">
                        • <b>Công thức tính:</b> <span style="color:#be185d;font-weight:700;">(Tổng % điểm các lần làm bài tập) / (Tổng số lần đã nộp bài) = ${avgScore}%</span>.<br>
                        • Điểm số từng bài được hệ thống ghi nhận chính thức sau khi bạn làm xong 10 câu bài tập của bài đó và bấm <b>"Nộp bài & Chấm điểm"</b>.<br>
                        • Bạn có thể bấm "Làm lại" ở bất kỳ bài nào bên dưới để ôn tập lại và cải thiện điểm số TB.
                    </div>
                </div>

                <div style="display:grid;grid-template-columns:repeat(auto-fit, minmax(130px, 1fr));gap:12px;margin-bottom:18px;">
                    <div style="background:#fdf2f8;border:1px solid #fbcfe8;border-radius:14px;padding:12px;text-align:center;">
                        <div style="font-size:11px;color:#db2777;font-weight:700;">ĐIỂM TB TOÀN KHÓA</div>
                        <div style="font-size:24px;font-weight:800;color:#be185d;margin-top:2px;">${avgScore}%</div>
                    </div>
                    <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:14px;padding:12px;text-align:center;">
                        <div style="font-size:11px;color:#16a34a;font-weight:700;">SỐ LẦN ĐÃ CHẤM</div>
                        <div style="font-size:24px;font-weight:800;color:#15803d;margin-top:2px;">${list.length} bài</div>
                    </div>
                    <div style="background:#eff6ff;border:1px solid #bfdbfe;border-radius:14px;padding:12px;text-align:center;">
                        <div style="font-size:11px;color:#2563eb;font-weight:700;">TỶ LỆ ĐẠT (≥60%)</div>
                        <div style="font-size:24px;font-weight:800;color:#1d4ed8;margin-top:2px;">${list.length > 0 ? Math.round((list.filter(i => (i.percentage||0) >= 60).length / list.length) * 100) : 0}%</div>
                    </div>
                </div>
            `;

            if (list.length === 0) {
                html += `
                    <div style="text-align:center;padding:40px 20px;color:#64748b;background:white;border-radius:16px;border:1px solid #f1f5f9;">
                        <div style="font-size:48px;margin-bottom:12px;">📊</div>
                        <h4 style="font-size:16px;color:#334155;margin-bottom:6px;">Chưa có kết quả bài tập nào</h4>
                        <p style="font-size:13px;">Hãy vào các bài học, làm xong 10 câu bài tập và bấm "Nộp bài & Chấm điểm" để ghi nhận điểm số tại đây.</p>
                    </div>
                `;
                container.innerHTML = html;
                return;
            }

            html += `
                <div style="font-size:14px;font-weight:700;color:#334155;margin-bottom:12px;">Lịch sử ${list.length} lần chấm điểm:</div>
                <div style="display:flex;flex-direction:column;gap:12px;">
            `;

            list.forEach(item => {
                const pct = item.percentage || 0;
                let badgeBg = '#dcfce7', badgeColor = '#15803d', badgeText = '🌟 Xuất sắc';
                if (pct < 60) { badgeBg = '#fee2e2'; badgeColor = '#b91c1c'; badgeText = '⏳ Cần cố gắng'; }
                else if (pct < 80) { badgeBg = '#dbeafe'; badgeColor = '#1d4ed8'; badgeText = '👍 Đạt'; }

                const dateStr = item.date ? new Date(item.date).toLocaleString('vi-VN') : '';

                html += `
                    <div style="background:white;border:1px solid #f1f5f9;border-radius:16px;padding:16px;display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:12px;box-shadow:0 2px 6px rgba(0,0,0,0.02);">
                        <div>
                            <div style="display:flex;align-items:center;gap:8px;margin-bottom:4px;">
                                <span style="background:#be185d;color:white;font-size:10px;font-weight:700;padding:2px 6px;border-radius:6px;text-transform:uppercase;">${(item.level || 'HSK').toUpperCase()}</span>
                                <h4 style="font-size:15px;color:#1e293b;font-weight:700;margin:0;">${item.lessonTitle || 'Bài kiểm tra'}</h4>
                            </div>
                            <div style="font-size:12px;color:#64748b;">${dateStr}</div>
                        </div>
                        <div style="display:flex;align-items:center;gap:16px;">
                            <div style="text-align:right;">
                                <div style="font-size:18px;font-weight:800;color:#0f172a;">${item.score}/${item.total} câu</div>
                                <span style="background:${badgeBg};color:${badgeColor};font-size:11px;font-weight:700;padding:2px 8px;border-radius:10px;">${badgeText} (${pct}%)</span>
                            </div>
                            <button onclick="window.retryLessonMistakesDirectly('${item.level || 'hsk1'}', '${item.lessonId || ''}')" style="padding:8px 14px;background:linear-gradient(135deg,#ec4899,#db2777);color:white;border:none;border-radius:10px;font-size:12px;font-weight:700;cursor:pointer;box-shadow:0 3px 10px rgba(236,72,153,0.3);">🔄 Làm lại bài sai</button>
                        </div>
                    </div>
                `;
            });
            html += `</div>`;
            container.innerHTML = html;
        };

        // --- TAB 3: BÀI TẬP LÀM SAI ---
        window.renderMistakesTab = function(container, profile) {
            const list = profile.wrongExercises || [];
            if (list.length === 0) {
                container.innerHTML = `
                    <div style="text-align:center;padding:30px 20px;color:#64748b;background:white;border-radius:14px;border:1px solid #f1f5f9;">
                        <div style="font-size:36px;margin-bottom:8px;">🎉</div>
                        <h4 style="font-size:15px;color:#16a34a;margin-bottom:4px;">Tuyệt vời! Bạn không có câu bài tập làm sai nào</h4>
                        <p style="font-size:12.5px;color:#64748b;">Khi bạn chọn đáp án chưa chính xác trong các bài tập, câu hỏi sẽ tự động được lưu lại tại đây để bạn luyện tập lại.</p>
                    </div>
                `;
                return;
            }

            let html = `
                <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;flex-wrap:wrap;gap:8px;">
                    <div style="font-size:13px;font-weight:700;color:#334155;">Danh sách ${list.length} câu làm sai cần ôn lại:</div>
                    <button onclick="window.clearAllMistakes()" style="padding:5px 12px;font-size:12px;font-weight:700;background:#fff1f2;color:#e11d48;border:1px solid #fecdd3;border-radius:8px;cursor:pointer;box-shadow:0 1px 3px rgba(225,29,72,0.08);display:flex;align-items:center;gap:4px;">Xóa tất cả câu sai</button>
                </div>
                <div style="display:flex;flex-direction:column;gap:10px;">
            `;

            list.forEach((item, index) => {
                html += `
                    <div style="background:white;border:1px solid #fee2e2;border-radius:12px;padding:12px 14px;box-shadow:0 1px 4px rgba(220,38,38,0.03);">
                        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;">
                            <span style="background:#fee2e2;color:#dc2626;font-size:10.5px;font-weight:700;padding:2px 8px;border-radius:6px;">${item.lessonTitle || 'Bài tập'} (${(item.level||'HSK').toUpperCase()})</span>
                            <button onclick="window.removeMistakeQuestion('${item.id}')" style="border:none;background:transparent;color:#94a3b8;font-size:13px;cursor:pointer;padding:2px 6px;">✕ Xóa</button>
                        </div>
                        <div style="font-size:13.5px;font-weight:700;color:#1e293b;margin-bottom:8px;">${index + 1}. ${item.question || 'Câu hỏi'}</div>
                        <div style="background:#fef2f2;border:1px solid #fecdd3;border-radius:8px;padding:6px 10px;margin-bottom:6px;font-size:12.5px;color:#991b1b;">
                            ❌ <b>Bạn chọn:</b> ${item.userAnswer || 'Chưa chọn'}
                        </div>
                        <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:8px;padding:6px 10px;margin-bottom:8px;font-size:12.5px;color:#166534;">
                            ✅ <b>Đáp án đúng:</b> ${item.correctAnswer || ''}
                        </div>
                        ${item.explanation ? `<div style="font-size:11.5px;color:#475569;margin-bottom:8px;font-style:italic;">💡 <b>Giải thích:</b> ${item.explanation}</div>` : ''}
                        <button onclick="window.retryLessonMistakesDirectly('${item.level || 'hsk1'}', '${item.lessonId || ''}', '${item.module || 'grammar'}', '${item.id || ''}')" style="padding:6px 12px;background:linear-gradient(135deg,#ec4899,#db2777);color:white;border:none;border-radius:8px;font-size:12px;font-weight:700;cursor:pointer;box-shadow:0 2px 6px rgba(236,72,153,0.2);">
                            🎯 Dẫn đến câu bài tập này để làm lại
                        </button>
                    </div>
                `;
            });
            html += `</div>`;
            container.innerHTML = html;
        };

        // --- TAB 4: FLASHCARD CHƯA THUỘC (PHÂN CHIA TỪ VỰNG / HÁN TỰ VÀ HSK) ---
        window.activeFlashcardCategoryFilter = 'all';
        window.activeFlashcardLevelFilter = 'all';

        function getCardMeta(item) {
            let cat = item.type || item.category || '';
            if (!cat) {
                if (item.story || item.radical || item.strokes || (item.cn && item.cn.length === 1 && (!item.vi || !item.vi.includes(' ')))) {
                    cat = 'hanzi';
                } else {
                    cat = 'vocab';
                }
            }
            let lvl = (item.level || 'HSK 1').toString().toUpperCase();
            if (!lvl.startsWith('HSK')) lvl = 'HSK ' + lvl.replace('HSK', '').trim();
            return { cat, lvl };
        }

        window.renderFlashcardsTab = function(container, profile) {
            const list = profile.unmasteredFlashcards || [];
            if (list.length === 0) {
                container.innerHTML = `
                    <div style="text-align:center;padding:40px 20px;color:#64748b;">
                        <div style="font-size:48px;margin-bottom:12px;">🃏</div>
                        <h4 style="font-size:16px;color:#16a34a;margin-bottom:6px;">Không có từ vựng / flashcard chưa thuộc</h4>
                        <p style="font-size:13px;">Trong quá trình học và ôn tập, các thẻ bấm "Chưa nắm được" hoặc tra cứu sẽ hiển thị ở đây để bạn ôn lại.</p>
                    </div>
                `;
                return;
            }

            const catFilter = window.activeFlashcardCategoryFilter || 'all';
            const lvlFilter = window.activeFlashcardLevelFilter || 'all';

            const filteredList = list.filter(item => {
                const meta = getCardMeta(item);
                if (catFilter !== 'all' && meta.cat !== catFilter) return false;
                if (lvlFilter !== 'all' && meta.lvl.replace(/\s+/g, '') !== lvlFilter.toUpperCase().replace(/\s+/g, '')) return false;
                return true;
            });

            let html = `
                <div style="background:#fdf2f8;border:1px solid #fbcfe8;border-radius:12px;padding:8px 12px;margin-bottom:12px;">
                    <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:6px;margin-bottom:6px;">
                        <div style="font-size:12.5px;font-weight:700;color:#be185d;">
                            🗂️ Thẻ chưa thuộc: Total ${list.length} (Đang lọc: ${filteredList.length})
                        </div>
                        ${filteredList.length > 0 ? `
                            <button onclick="window.launchUnmasteredFlashcardReviewFiltered()" style="padding:4px 10px;background:linear-gradient(135deg,#9c27b0,#7b1fa2);color:white;border:none;border-radius:8px;font-weight:700;font-size:11.5px;cursor:pointer;box-shadow:0 2px 6px rgba(156,39,176,0.2);">
                                🚀 Ôn tập ${filteredList.length} thẻ đang chọn
                            </button>
                        ` : ''}
                    </div>

                    <div style="display:flex;flex-direction:column;gap:4px;">
                        <div style="display:flex;align-items:center;gap:6px;flex-wrap:wrap;">
                            <span style="font-size:11px;font-weight:700;color:#475569;min-width:60px;">Loại thẻ:</span>
                            <button onclick="window.setFlashcardCategoryFilter('all')" style="padding:2px 8px;border-radius:6px;font-size:11px;font-weight:700;cursor:pointer;${catFilter === 'all' ? 'background:#be185d;color:white;border:none;' : 'background:white;color:#475569;border:1px solid #cbd5e1;'}">Tất cả</button>
                            <button onclick="window.setFlashcardCategoryFilter('vocab')" style="padding:2px 8px;border-radius:6px;font-size:11px;font-weight:700;cursor:pointer;${catFilter === 'vocab' ? 'background:#be185d;color:white;border:none;' : 'background:white;color:#475569;border:1px solid #cbd5e1;'}">📖 Từ vựng</button>
                            <button onclick="window.setFlashcardCategoryFilter('hanzi')" style="padding:2px 8px;border-radius:6px;font-size:11px;font-weight:700;cursor:pointer;${catFilter === 'hanzi' ? 'background:#be185d;color:white;border:none;' : 'background:white;color:#475569;border:1px solid #cbd5e1;'}">🈲 Hán tự</button>
                        </div>
                        <div style="display:flex;align-items:center;gap:6px;flex-wrap:wrap;">
                            <span style="font-size:11px;font-weight:700;color:#475569;min-width:60px;">Level HSK:</span>
                            <button onclick="window.setFlashcardLevelFilter('all')" style="padding:2px 8px;border-radius:6px;font-size:11px;font-weight:700;cursor:pointer;${lvlFilter === 'all' ? 'background:#be185d;color:white;border:none;' : 'background:white;color:#475569;border:1px solid #cbd5e1;'}">Tất cả HSK</button>
                            ${['HSK1', 'HSK2', 'HSK3', 'HSK4', 'HSK5', 'HSK6'].map(lvl => `
                                <button onclick="window.setFlashcardLevelFilter('${lvl}')" style="padding:2px 8px;border-radius:6px;font-size:11px;font-weight:700;cursor:pointer;${lvlFilter.toUpperCase() === lvl ? 'background:#be185d;color:white;border:none;' : 'background:white;color:#475569;border:1px solid #cbd5e1;'}">${lvl.toUpperCase()}</button>
                            `).join('')}
                        </div>
                    </div>
                </div>
            `;

            if (filteredList.length === 0) {
                html += `
                    <div style="text-align:center;padding:30px 20px;color:#64748b;background:white;border-radius:16px;border:1px solid #f1f5f9;">
                        <div style="font-size:32px;margin-bottom:8px;">🔍</div>
                        <div style="font-size:14px;font-weight:600;">Không có thẻ nào phù hợp với bộ lọc này</div>
                        <div style="font-size:12px;margin-top:4px;color:#94a3b8;">Chọn loại thẻ hoặc cấp độ HSK khác ở trên.</div>
                    </div>
                `;
            } else {
                html += `<div style="display:grid;grid-template-columns:repeat(auto-fill, minmax(180px, 1fr));gap:14px;">`;
                filteredList.forEach(item => {
                    const meta = getCardMeta(item);
                    const catLabel = meta.cat === 'hanzi' ? '🈲 Hán tự' : (meta.cat === 'grammar' ? '📝 Ngữ pháp' : '📖 Từ vựng');
                    const catBg = meta.cat === 'hanzi' ? '#f3e8ff' : (meta.cat === 'grammar' ? '#fef3c7' : '#e0f2fe');
                    const catColor = meta.cat === 'hanzi' ? '#7e22ce' : (meta.cat === 'grammar' ? '#b45309' : '#0369a1');

                    html += `
                        <div style="background:white;border:1px solid #fbcfe8;border-radius:16px;padding:16px;text-align:center;box-shadow:0 2px 8px rgba(0,0,0,0.03);display:flex;flex-direction:column;justify-content:space-between;position:relative;">
                            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;">
                                <span style="background:${catBg};color:${catColor};font-size:10px;font-weight:800;padding:2px 6px;border-radius:6px;">${catLabel}</span>
                                <span style="background:#be185d;color:white;font-size:10px;font-weight:800;padding:2px 6px;border-radius:6px;">${meta.lvl}</span>
                            </div>
                            <div>
                                <div style="font-size:28px;font-weight:800;color:#be185d;margin:8px 0 4px 0;font-family:'Kaiti','SimSun',serif,sans-serif;">${item.cn || ''}</div>
                                <div style="font-size:13.5px;color:#db2777;font-weight:600;margin-bottom:6px;">${item.py || ''}</div>
                                <div style="font-size:13px;color:#475569;margin-bottom:12px;font-weight:500;">${item.vi || item.en || ''}</div>
                            </div>
                            <button onclick="window.markFlashcardMastered('${item.cn}')" style="width:100%;padding:8px;background:#f0fdf4;color:#16a34a;border:1px solid #bbf7d0;border-radius:10px;font-size:12.5px;font-weight:700;cursor:pointer;">✅ Đã thuộc</button>
                        </div>
                    `;
                });
                html += `</div>`;
            }

            container.innerHTML = html;
        };

        window.setFlashcardCategoryFilter = function(cat) {
            window.activeFlashcardCategoryFilter = cat;
            const user = (window.auth && window.auth.currentUser) ? window.auth.currentUser : null;
            const uid = user ? user.uid : 'guest';
            const profile = window.getUserProfile(uid);
            const container = document.getElementById('profileTabContainer');
            if (container) window.renderFlashcardsTab(container, profile);
        };

        window.setFlashcardLevelFilter = function(lvl) {
            window.activeFlashcardLevelFilter = lvl;
            const user = (window.auth && window.auth.currentUser) ? window.auth.currentUser : null;
            const uid = user ? user.uid : 'guest';
            const profile = window.getUserProfile(uid);
            const container = document.getElementById('profileTabContainer');
            if (container) window.renderFlashcardsTab(container, profile);
        };

        window.launchUnmasteredFlashcardReviewFiltered = function() {
            if (typeof window.closePersonalProfileModal === 'function') window.closePersonalProfileModal();
            const user = (window.auth && window.auth.currentUser) ? window.auth.currentUser : null;
            const uid = user ? user.uid : 'guest';
            const profile = window.getUserProfile(uid);

            const list = profile.unmasteredFlashcards || [];
            const catFilter = window.activeFlashcardCategoryFilter || 'all';
            const lvlFilter = window.activeFlashcardLevelFilter || 'all';

            const filtered = list.filter(item => {
                const meta = getCardMeta(item);
                if (catFilter !== 'all' && meta.cat !== catFilter) return false;
                if (lvlFilter !== 'all' && meta.lvl.replace(/\s+/g, '') !== lvlFilter.toUpperCase().replace(/\s+/g, '')) return false;
                return true;
            });

            if (filtered.length > 0) {
                flashcardData = [...filtered];
                flashcardIndex = 0;
                flashcardType = catFilter !== 'all' ? catFilter : 'vocab';
                flashcardShowing = false;
                const fcCard = document.getElementById('flashcardCard');
                if (fcCard) fcCard.classList.remove('flipped');
                const fcModal = document.getElementById('flashcardModal');
                if (fcModal) {
                    fcModal.classList.add('active');
                    fcModal.style.zIndex = '999999';
                }
                showFlashcard();
            } else {
                alert('Không có thẻ nào phù hợp để ôn tập!');
            }
        };

        // --- TAB 5: ADMIN QUẢN LÝ HỌC VIÊN ĐÃ ĐĂNG KÝ THỰC TẾ ---
        window.getRegisteredUsersList = function() {
            let list = [];
            try {
                const saved = localStorage.getItem('hsk_registered_users_list');
                if (saved) list = JSON.parse(saved);
            } catch(e) {}
            
            // Tự động quét và hợp nhất danh sách các tài khoản đã đăng ký thực tế từ localStorage
            try {
                for (let i = 0; i < localStorage.length; i++) {
                    const key = localStorage.key(i);
                    if (key && key.startsWith('hsk_user_profile_')) {
                        const pSaved = localStorage.getItem(key);
                        if (pSaved) {
                            const p = JSON.parse(pSaved);
                            if (p && p.registered && p.name && p.email) {
                                const exists = list.some(u => u.uid === p.uid || (u.email && p.email && u.email.toLowerCase() === p.email.toLowerCase()));
                                if (!exists) {
                                    list.push({
                                        uid: p.uid || ('u_' + Date.now()),
                                        name: p.name,
                                        age: p.age || '--',
                                        email: p.email,
                                        registeredAt: p.registeredAt || new Date().toISOString(),
                                        learnedCount: (p.learnedLessons || []).length,
                                        scoresCount: (p.lessonScores || []).length
                                    });
                                }
                            }
                        }
                    }
                }
            } catch(e) {}

            return list;
        };

        window.saveRegisteredUsersList = function(list) {
            try {
                localStorage.setItem('hsk_registered_users_list', JSON.stringify(list));
            } catch(e) {}
        };

        window.renderAdminTab = function(container, profile) {
            const user = (window.auth && window.auth.currentUser) ? window.auth.currentUser : null;
            const currentEmail = (user && user.email) ? user.email.toLowerCase() : (profile && profile.email ? profile.email.toLowerCase() : '');
            
            if (currentEmail !== 'xueyinlaoshi@gmail.com') {
                container.innerHTML = `
                    <div style="text-align:center;padding:40px 20px;color:#be185d;">
                        <div style="font-size:48px;margin-bottom:12px;">🔒</div>
                        <h3 style="font-size:18px;font-weight:800;color:#9d174d;margin-bottom:8px;">Khu Vực Quản Lý Học Viên (Chỉ dành cho Admin)</h3>
                        <p style="font-size:14px;color:#64748b;max-width:480px;margin:0 auto;line-height:1.5;">Quyền quản lý danh sách học viên mặc định dành riêng cho email giảng viên <b>xueyinlaoshi@gmail.com</b>.</p>
                    </div>
                `;
                return;
            }

            const users = window.getRegisteredUsersList();
            
            let html = `
                <div style="background:linear-gradient(135deg,#f3e8ff,#fae8ff);padding:20px;border-radius:18px;border:1px solid #e9d5ff;margin-bottom:20px;">
                    <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:12px;">
                        <div>
                            <h3 style="margin:0;font-size:18px;color:#6b21a8;font-weight:800;">👑 QUẢN LÝ TÀI KHOẢN HỌC VIÊN ĐÃ ĐĂNG KÝ THỰC TẾ</h3>
                            <p style="margin:4px 0 0 0;font-size:13px;color:#7e22ce;">Danh sách chi tiết Họ tên, Tuổi, Email Google thực tế của tất cả học viên đã tạo tài khoản thành công trên hệ thống.</p>
                        </div>
                        <div style="display:flex;gap:10px;">
                            <button onclick="window.exportAdminUsersCSV()" style="padding:8px 14px;background:#7e22ce;color:white;border:none;border-radius:10px;font-weight:700;font-size:13px;cursor:pointer;box-shadow:0 3px 10px rgba(126,34,206,0.25);">📥 Xuất CSV</button>
                        </div>
                    </div>
                    <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:12px;margin-top:16px;">
                        <div style="background:white;padding:12px 16px;border-radius:12px;border:1px solid #e9d5ff;">
                            <div style="font-size:12px;color:#6b21a8;font-weight:600;">👥 Tổng Học Viên Thực Tế</div>
                            <div style="font-size:22px;font-weight:800;color:#7e22ce;margin-top:2px;">${users.length}</div>
                        </div>
                        <div style="background:white;padding:12px 16px;border-radius:12px;border:1px solid #e9d5ff;">
                            <div style="font-size:12px;color:#6b21a8;font-weight:600;">🎂 Độ Tuổi Trung Bình</div>
                            <div style="font-size:22px;font-weight:800;color:#be185d;margin-top:2px;">${users.length ? Math.round(users.reduce((acc,u)=>acc+(parseInt(u.age)||0),0)/users.length) : 0} tuổi</div>
                        </div>
                        <div style="background:white;padding:12px 16px;border-radius:12px;border:1px solid #e9d5ff;">
                            <div style="font-size:12px;color:#6b21a8;font-weight:600;">📧 Email Đã Đăng Ký</div>
                            <div style="font-size:22px;font-weight:800;color:#16a34a;margin-top:2px;">${users.length} tài khoản</div>
                        </div>
                    </div>
                </div>

                <div style="margin-bottom:14px;">
                    <input type="text" id="adminSearchInput" oninput="window.filterAdminUsersList()" placeholder="🔍 Tìm kiếm học viên theo Tên, Email, Tuổi..." style="width:100%;padding:12px 16px;border:1.5px solid #e9d5ff;border-radius:12px;font-size:14px;outline:none;box-sizing:border-box;box-shadow:0 2px 6px rgba(0,0,0,0.02);" />
                </div>

                <div style="overflow-x:auto;border-radius:14px;border:1px solid #e2e8f0;box-shadow:0 4px 12px rgba(0,0,0,0.03);">
                    <table style="width:100%;border-collapse:collapse;text-align:left;background:white;font-size:13.5px;">
                        <thead>
                            <tr style="background:#f8fafc;border-bottom:1px solid #e2e8f0;color:#475569;font-weight:700;">
                                <th style="padding:12px 16px;">STT</th>
                                <th style="padding:12px 16px;">Họ và Tên</th>
                                <th style="padding:12px 16px;">Tuổi</th>
                                <th style="padding:12px 16px;">Email Google</th>
                                <th style="padding:12px 16px;">Ngày Đăng Ký</th>
                                <th style="padding:12px 16px;">Đã Học</th>
                                <th style="padding:12px 16px;text-align:center;">Thao Tác</th>
                            </tr>
                        </thead>
                        <tbody id="adminUsersTableBody">
            `;

            if (users.length === 0) {
                html += `<tr><td colspan="7" style="text-align:center;padding:30px;color:#94a3b8;font-weight:600;">Chưa có học viên nào đăng ký tài khoản thực tế trên hệ thống.</td></tr>`;
            } else {
                users.forEach((u, idx) => {
                    const dateStr = u.registeredAt ? new Date(u.registeredAt).toLocaleDateString('vi-VN') : 'Mới đây';
                    html += `
                        <tr style="border-bottom:1px solid #f1f5f9;transition:background 0.15s;" onmouseover="this.style.background='#faf5ff'" onmouseout="this.style.background='white'">
                            <td style="padding:12px 16px;font-weight:700;color:#94a3b8;">${idx + 1}</td>
                            <td style="padding:12px 16px;font-weight:700;color:#1e293b;">
                                ${escapeHtml(u.name || '')} ${u.email === 'xueyinlaoshi@gmail.com' ? '<span style="background:#f3e8ff;color:#7e22ce;font-size:10px;padding:2px 6px;border-radius:6px;margin-left:4px;">Giảng Viên / Admin</span>' : ''}
                            </td>
                            <td style="padding:12px 16px;font-weight:600;color:#db2777;">${u.age || '--'} tuổi</td>
                            <td style="padding:12px 16px;color:#0284c7;font-weight:500;">${escapeHtml(u.email || '')}</td>
                            <td style="padding:12px 16px;color:#64748b;">${dateStr}</td>
                            <td style="padding:12px 16px;font-weight:700;color:#16a34a;">${u.learnedCount || 0} bài</td>
                            <td style="padding:12px 16px;text-align:center;">
                                <button onclick="window.viewUserAdminDetail('${u.uid}')" style="padding:4px 10px;background:#f3e8ff;color:#7e22ce;border:none;border-radius:8px;font-weight:600;font-size:12px;cursor:pointer;margin-right:4px;">👁️ Chi tiết</button>
                                <button onclick="window.deleteUserAdmin('${u.uid}')" style="padding:4px 10px;background:#fff1f2;color:#e11d48;border:none;border-radius:8px;font-weight:600;font-size:12px;cursor:pointer;">Xóa</button>
                            </td>
                        </tr>
                    `;
                });
            }

            html += `
                        </tbody>
                    </table>
                </div>
            `;
            container.innerHTML = html;
        };

        window.filterAdminUsersList = function() {
            const query = (document.getElementById('adminSearchInput')?.value || '').toLowerCase().trim();
            const users = window.getRegisteredUsersList();
            const tbody = document.getElementById('adminUsersTableBody');
            if (!tbody) return;

            const filtered = users.filter(u => 
                (u.name || '').toLowerCase().includes(query) ||
                (u.email || '').toLowerCase().includes(query) ||
                (u.age || '').toString().includes(query)
            );

            let html = '';
            filtered.forEach((u, idx) => {
                const dateStr = u.registeredAt ? new Date(u.registeredAt).toLocaleDateString('vi-VN') : 'Mới đây';
                html += `
                    <tr style="border-bottom:1px solid #f1f5f9;" onmouseover="this.style.background='#faf5ff'" onmouseout="this.style.background='white'">
                        <td style="padding:12px 16px;font-weight:700;color:#94a3b8;">${idx + 1}</td>
                        <td style="padding:12px 16px;font-weight:700;color:#1e293b;">
                            ${escapeHtml(u.name || '')} ${u.email === 'xueyinlaoshi@gmail.com' ? '<span style="background:#f3e8ff;color:#7e22ce;font-size:10px;padding:2px 6px;border-radius:6px;margin-left:4px;">Giảng Viên / Admin</span>' : ''}
                        </td>
                        <td style="padding:12px 16px;font-weight:600;color:#db2777;">${u.age || '--'} tuổi</td>
                        <td style="padding:12px 16px;color:#0284c7;font-weight:500;">${escapeHtml(u.email || '')}</td>
                        <td style="padding:12px 16px;color:#64748b;">${dateStr}</td>
                        <td style="padding:12px 16px;font-weight:700;color:#16a34a;">${u.learnedCount || 0} bài</td>
                        <td style="padding:12px 16px;text-align:center;">
                            <button onclick="window.viewUserAdminDetail('${u.uid}')" style="padding:4px 10px;background:#f3e8ff;color:#7e22ce;border:none;border-radius:8px;font-weight:600;font-size:12px;cursor:pointer;margin-right:4px;">👁️ Chi tiết</button>
                            <button onclick="window.deleteUserAdmin('${u.uid}')" style="padding:4px 10px;background:#fff1f2;color:#e11d48;border:none;border-radius:8px;font-weight:600;font-size:12px;cursor:pointer;">Xóa</button>
                        </td>
                    </tr>
                `;
            });
            tbody.innerHTML = html || `<tr><td colspan="7" style="text-align:center;padding:24px;color:#94a3b8;">Không tìm thấy học viên nào phù hợp.</td></tr>`;
        };

        window.deleteUserAdmin = function(uid) {
            let users = window.getRegisteredUsersList();
            const target = users.find(u => u.uid === uid);
            if (!target) return;
            if (confirm(`Bạn có chắc chắn muốn xóa học viên ${target.name} (${target.email}) khỏi danh sách?`)) {
                users = users.filter(u => u.uid !== uid);
                window.saveRegisteredUsersList(users);
                const container = document.getElementById('profileTabContainer');
                if (container) window.renderAdminTab(container);
            }
        };

        window.viewUserAdminDetail = function(uid) {
            const users = window.getRegisteredUsersList();
            const u = users.find(item => item.uid === uid);
            if (u) {
                alert(`📋 THÔNG TIN HỌC VIÊN:\n\n- Họ và Tên: ${u.name}\n- Tuổi: ${u.age}\n- Email: ${u.email}\n- Ngày đăng ký: ${new Date(u.registeredAt).toLocaleString('vi-VN')}\n- Bài học đã hoàn thành: ${u.learnedCount || 0} bài\n- Lượt làm bài kiểm tra: ${u.scoresCount || 0} lần`);
            }
        };

        // --- PROFILE HELPER ACTIONS ---
        window.markLessonAsLearned = function(level, lessonId, title, category) {
            const user = auth.currentUser;
            const uid = user ? user.uid : 'guest';
            const profile = window.getUserProfile(uid);

            if (!profile.learnedLessons) profile.learnedLessons = [];
            const exists = profile.learnedLessons.some(item => item.id === lessonId);
            if (!exists) {
                profile.learnedLessons.push({
                    id: lessonId,
                    level: level,
                    title: title || ('Bài ' + lessonId),
                    category: category || 'Ngữ pháp',
                    date: new Date().toISOString()
                });
                window.saveUserProfile(profile);
            }
        };

        window.toggleLessonLearned = function(level, lessonId, title, category, btnElement) {
            const user = auth.currentUser;
            const uid = user ? user.uid : 'guest';
            const profile = window.getUserProfile(uid);

            if (!profile.learnedLessons) profile.learnedLessons = [];
            const idx = profile.learnedLessons.findIndex(item => item.id === lessonId);

            if (idx > -1) {
                profile.learnedLessons.splice(idx, 1);
                if (btnElement) {
                    btnElement.innerHTML = '📌 Đánh dấu đã học';
                    btnElement.style.background = 'white';
                    btnElement.style.color = '#be185d';
                    btnElement.style.borderColor = '#fbcfe8';
                }
            } else {
                profile.learnedLessons.push({
                    id: lessonId,
                    level: level,
                    title: title || ('Bài ' + lessonId),
                    category: category === 'vocab' ? 'Từ vựng' : 'Ngữ pháp',
                    date: new Date().toISOString()
                });
                if (btnElement) {
                    btnElement.innerHTML = '✅ Đã học';
                    btnElement.style.background = '#e8f5e9';
                    btnElement.style.color = '#15803d';
                    btnElement.style.borderColor = '#86efac';
                }
            }
            window.saveUserProfile(profile);
        };

        window.isLessonLearned = function(level, lessonId) {
            const user = (window.auth && window.auth.currentUser) ? window.auth.currentUser : (typeof auth !== 'undefined' ? auth.currentUser : null);
            const uid = user ? user.uid : 'guest';
            const profile = window.getUserProfile(uid);
            return profile.learnedLessons ? profile.learnedLessons.some(item => item.id === lessonId) : false;
        };

        window.removeLearnedLesson = function(lessonId) {
            const user = (window.auth && window.auth.currentUser) ? window.auth.currentUser : (typeof auth !== 'undefined' ? auth.currentUser : null);
            const uid = user ? user.uid : 'guest';
            const profile = window.getUserProfile(uid);
            profile.learnedLessons = (profile.learnedLessons || []).filter(item => item.id !== lessonId);
            window.saveUserProfile(profile);
            window.openPersonalProfileModal();
            window.switchProfileTab('learned');
        };

        window.clearLearnedLessons = function() {
            if (!confirm('Bạn có chắc chắn muốn xóa toàn bộ danh sách bài đã học?')) return;
            const user = (window.auth && window.auth.currentUser) ? window.auth.currentUser : (typeof auth !== 'undefined' ? auth.currentUser : null);
            const uid = user ? user.uid : 'guest';
            const profile = window.getUserProfile(uid);
            profile.learnedLessons = [];
            window.saveUserProfile(profile);
            window.openPersonalProfileModal();
            window.switchProfileTab('learned');
        };

        window.recordWrongExercise = function(exObj) {
            if (!exObj || !exObj.question) return;
            const user = auth.currentUser;
            const uid = user ? user.uid : 'guest';
            const profile = window.getUserProfile(uid);
            if (!profile.wrongExercises) profile.wrongExercises = [];

            const id = exObj.id || ('wrong_' + Date.now() + '_' + Math.random().toString(36).substr(2,4));
            const exists = profile.wrongExercises.some(item =>
                item.module === (exObj.module || 'grammar') &&
                String(item.lessonId || '') === String(exObj.lessonId || '') &&
                item.question === exObj.question
            );
            if (!exists) {
                profile.wrongExercises.push({
                    id: id,
                    level: exObj.level || 'hsk',
                    module: exObj.module || 'grammar',
                    lessonId: exObj.lessonId || '',
                    lessonTitle: exObj.lessonTitle || 'Bài tập',
                    question: exObj.question,
                    questionIdx: exObj.questionIdx || null,
                    questionKey: exObj.questionKey || exObj.question || '',
                    type: exObj.type || 'multiple_choice',
                    userAnswer: exObj.userAnswer || '',
                    correctAnswer: exObj.correctAnswer || '',
                    options: exObj.options || [],
                    explanation: exObj.explanation || '',
                    date: new Date().toISOString()
                });
                window.saveUserProfile(profile);
            }
        };

        window.removeMistakeQuestion = function(id) {
            const user = auth.currentUser;
            const uid = user ? user.uid : 'guest';
            const profile = window.getUserProfile(uid);
            profile.wrongExercises = (profile.wrongExercises || []).filter(item => item.id !== id);
            window.saveUserProfile(profile);
            window.openPersonalProfileModal();
        };

        window.clearAllMistakes = function() {
            const user = (window.auth && window.auth.currentUser) ? window.auth.currentUser : null;
            const uid = user ? user.uid : 'guest';
            const profile = window.getUserProfile(uid);
            profile.wrongExercises = [];
            window.saveUserProfile(profile);
            window.openPersonalProfileModal();
            window.switchProfileTab('mistakes');
        };

        window.markFlashcardMastered = function(cn) {
            const user = (window.auth && window.auth.currentUser) ? window.auth.currentUser : null;
            const uid = user ? user.uid : 'guest';
            const profile = window.getUserProfile(uid);
            profile.unmasteredFlashcards = (profile.unmasteredFlashcards || []).filter(item => item.cn !== cn);
            if (typeof undefinedWords !== 'undefined') {
                undefinedWords = undefinedWords.filter(item => item.cn !== cn);
            }
            window.saveUserProfile(profile);
            window.openPersonalProfileModal();
            window.switchProfileTab('flashcards');
        };

        window.launchUnmasteredFlashcardReview = function() {
            window.closePersonalProfileModal();
            const user = (window.auth && window.auth.currentUser) ? window.auth.currentUser : null;
            const uid = user ? user.uid : 'guest';
            const profile = window.getUserProfile(uid);

            if (profile.unmasteredFlashcards && profile.unmasteredFlashcards.length > 0) {
                flashcardData = [...profile.unmasteredFlashcards];
                flashcardIndex = 0;
                flashcardType = 'vocab';
                flashcardShowing = false;
                const fcCard = document.getElementById('flashcardCard');
                if (fcCard) fcCard.classList.remove('flipped');
                const fcModal = document.getElementById('flashcardModal');
                if (fcModal) {
                    fcModal.classList.add('active');
                    fcModal.style.zIndex = '999999';
                }
                if (typeof showFlashcard === 'function') showFlashcard();
            } else {
                alert('Không có thẻ flashcard chưa thuộc nào!');
            }
        };

        // ===== GOOGLE TRANSLATE SELECTION SYSTEM =====
        function isInsideExerciseArea(el) {
            if (window.currentModule === 'practice') return true;
            if (window.hskExamState && window.hskExamState.activeExam && !window.hskExamState.isSubmitted) return true;
            if (!el) return false;
            let node = el.nodeType === 3 ? el.parentElement : el;
            while (node && node !== document.body) {
                if (node.id === 'retryQuestionModal' || node.id === 'retryQuestionBody' || node.id === 'hskExamContainer' || node.id === 'activeHskExam') return true;
                if (node.classList) {
                    const classes = Array.from(node.classList);
                    for (const cls of classes) {
                        const lower = cls.toLowerCase();
                        if (lower.includes('exercise') || lower.includes('quiz') || lower.includes('test') || lower.includes('practice') || lower.includes('retry') || lower.includes('question') || lower.includes('exam') || lower.includes('hsk')) {
                            return true;
                        }
                    }
                }
                node = node.parentElement;
            }
            return false;
        }

        // ===== INLINE DICTIONARY LOOKUP SYSTEM =====
        window.closeInlineLookup = function() {
            const popover = document.getElementById('inlineLookupPopover');
            if (popover) popover.style.display = 'none';
        };

        window.saveInlineLookupToFlashcards = function() {
            const word = document.getElementById('inlineLookupWord').textContent;
            const py = document.getElementById('inlineLookupPinyin').textContent;
            const vi = document.getElementById('inlineLookupMeaning').textContent;
            const badge = document.getElementById('inlineLookupBadge').textContent;
            if (!word || word === '--') return;

            const user = (window.auth && window.auth.currentUser) ? window.auth.currentUser : null;
            const uid = user ? user.uid : 'guest';
            const profile = window.getUserProfile(uid);
            if (!profile.unmasteredFlashcards) profile.unmasteredFlashcards = [];

            if (!profile.unmasteredFlashcards.some(c => c.cn === word)) {
                profile.unmasteredFlashcards.push({
                    cn: word,
                    py: py !== '--' ? py : '',
                    vi: (vi !== 'Đang tra cứu nghĩa...' && vi !== 'Chưa tìm thấy nghĩa.') ? vi : '',
                    level: badge || 'HSK 1'
                });
                window.saveUserProfile(profile);
                alert('✅ Đã lưu từ "' + word + '" vào danh sách Flashcard chưa thuộc!');
            } else {
                alert('ℹ️ Từ "' + word + '" đã có trong danh sách Flashcard chưa thuộc!');
            }
        };

        function findWordInData(obj, text) {
            if (!obj || typeof obj !== 'object') return null;
            if (obj.cn === text || obj.hanzi === text || obj.word === text) return obj;
            if (Array.isArray(obj)) {
                for (let item of obj) {
                    const res = findWordInData(item, text);
                    if (res) return res;
                }
            } else {
                for (let key in obj) {
                    if (typeof obj[key] === 'object' && obj[key] !== null) {
                        const res = findWordInData(obj[key], text);
                        if (res) return res;
                    }
                }
            }
            return null;
        }

        function triggerInlineLookup(cleanText, targetElement) {
            if (!cleanText) return;
            const txt = cleanText.trim();
            if (!txt || txt.length > 40) return;

            if (isInsideExerciseArea(targetElement)) {
                window.closeInlineLookup();
                return;
            }

            const containsChinese = /[\u4e00-\u9fa5]/.test(txt);
            if (!containsChinese) return;

            const popover = document.getElementById('inlineLookupPopover');
            const wordEl = document.getElementById('inlineLookupWord');
            const pyEl = document.getElementById('inlineLookupPinyin');
            const viEl = document.getElementById('inlineLookupMeaning');
            const badgeEl = document.getElementById('inlineLookupBadge');
            const extraEl = document.getElementById('inlineLookupExtra');

            if (!popover || !wordEl) return;

            wordEl.textContent = txt;
            pyEl.textContent = '...';
            viEl.textContent = 'Đang tra cứu nghĩa...';
            badgeEl.textContent = 'TRA CỨU';
            extraEl.style.display = 'none';
            popover.style.display = 'block';

            let foundItem = null;
            let foundLevel = 'HSK 1';

            if (window.cachedData) {
                for (let k in window.cachedData) {
                    const levelStr = k.split('-')[1] || 'hsk1';
                    const data = window.cachedData[k];
                    if (data) {
                        foundItem = findWordInData(data, txt);
                        if (foundItem) {
                            foundLevel = levelStr.toUpperCase();
                            break;
                        }
                    }
                }
            }

            if (!foundItem && window.hanziState && window.hanziState.allChars) {
                const c = window.hanziState.allChars.find(x => (x.hanzi === txt || x.cn === txt));
                if (c) {
                    foundItem = {
                        cn: c.hanzi || c.cn,
                        py: c.pinyin || c.py,
                        vi: c.meaning || c.vi,
                        story: c.story || c.note || ''
                    };
                    foundLevel = (window.hanziState.level || 'hsk1').toUpperCase();
                }
            }

            if (foundItem) {
                wordEl.textContent = foundItem.cn || txt;
                pyEl.textContent = foundItem.py || foundItem.pinyin || '--';
                viEl.textContent = foundItem.vi || foundItem.meaning || foundItem.en || 'Từ vựng tiếng Trung';
                badgeEl.textContent = foundLevel;
                if (foundItem.story) {
                    extraEl.style.display = 'block';
                    extraEl.innerHTML = `💡 <b>Ghi chú / Chiết tự:</b> ${escapeHtml(foundItem.story)}`;
                } else {
                    extraEl.style.display = 'none';
                }
            } else {
                fetch(`https://translate.googleapis.com/translate_a/single?client=gtx&sl=zh-CN&tl=vi&dt=t&q=${encodeURIComponent(txt)}`)
                    .then(res => res.json())
                    .then(data => {
                        if (data && data[0] && data[0][0] && data[0][0][0]) {
                            viEl.textContent = data[0][0][0];
                            badgeEl.textContent = 'DỊCH TỰ ĐỘNG';
                        } else {
                            viEl.textContent = 'Chưa tìm thấy nghĩa.';
                        }
                    })
                    .catch(() => {
                        viEl.textContent = 'Không thể kết nối tra cứu trực tuyến.';
                    });
            }
        }

        document.addEventListener('dblclick', function(e) {
            if (isInsideExerciseArea(e.target)) {
                window.closeInlineLookup();
                return;
            }
            const sel = window.getSelection ? window.getSelection().toString() : '';
            const txt = (sel && sel.trim().length > 0) ? sel.trim() : (e.target && e.target.textContent ? e.target.textContent.trim() : '');

            if (txt && txt.length <= 40) {
                const containsChinese = /[\u4e00-\u9fa5]/.test(txt);
                if (containsChinese) {
                    triggerInlineLookup(txt, e.target);
                }
            }
        });

        let inlineSelTimeout = null;
        document.addEventListener('selectionchange', function(e) {
            if (inlineSelTimeout) clearTimeout(inlineSelTimeout);
            inlineSelTimeout = setTimeout(() => {
                const sel = window.getSelection ? window.getSelection().toString() : '';
                const clean = sel ? sel.trim() : '';
                const focusNode = window.getSelection ? window.getSelection().focusNode : null;
                const target = focusNode ? focusNode.parentElement : document.activeElement;

                if (!clean || isInsideExerciseArea(target) || clean.length > 40) {
                    return;
                }

                const containsChinese = /[\u4e00-\u9fa5]/.test(clean);
                if (containsChinese) {
                    triggerInlineLookup(clean, target);
                }
            }, 600);
        });

        window.retryWrongQuestionInline = function(id) {
            const user = (window.auth && window.auth.currentUser) ? window.auth.currentUser : null;
            const uid = user ? user.uid : 'guest';
            const profile = window.getUserProfile(uid);
            const questionObj = (profile.wrongExercises || []).find(item => item.id === id);

            if (!questionObj) return;

            const modal = document.getElementById('retryQuestionModal');
            const body = document.getElementById('retryQuestionBody');

            let optionsHtml = '';
            if (questionObj.options && questionObj.options.length > 0) {
                optionsHtml = questionObj.options.map((opt, i) => `
                    <label style="display:flex;align-items:center;gap:10px;padding:10px 14px;border:1px solid #cbd5e1;border-radius:10px;margin-bottom:8px;cursor:pointer;">
                        <input type="radio" name="retryOpt" value="${opt}" style="accent-color:#ec4899;width:18px;height:18px;" />
                        <span style="font-size:14px;color:#1e293b;">${opt}</span>
                    </label>
                `).join('');
            } else {
                optionsHtml = `<input type="text" id="retryTextInput" placeholder="Nhập câu trả lời của bạn..." style="width:100%;padding:10px 14px;border:1px solid #cbd5e1;border-radius:10px;font-size:14px;box-sizing:border-box;margin-bottom:12px;" />`;
            }

            body.innerHTML = `
                <div style="font-size:15px;font-weight:700;color:#1e293b;margin-bottom:14px;">${questionObj.question}</div>
                <form onsubmit="window.submitQuestionRetry(event, '${id}')">
                    ${optionsHtml}
                    <div id="retryResultMsg" style="margin-top:10px;"></div>
                    <button type="submit" style="width:100%;padding:12px;background:linear-gradient(135deg,#ec4899,#db2777);color:white;border:none;border-radius:10px;font-weight:700;margin-top:14px;cursor:pointer;">
                        🚀 Kiểm Tra Đáp Án
                    </button>
                </form>
            `;
            modal.style.display = 'flex';
        };

        window.submitQuestionRetry = function(e, id) {
            e.preventDefault();
            const user = auth.currentUser;
            const uid = user ? user.uid : 'guest';
            const profile = window.getUserProfile(uid);
            const questionObj = (profile.wrongExercises || []).find(item => item.id === id);

            if (!questionObj) return;

            let userVal = '';
            const selectedOpt = document.querySelector('input[name="retryOpt"]:checked');
            if (selectedOpt) userVal = selectedOpt.value;
            else {
                const txtInput = document.getElementById('retryTextInput');
                if (txtInput) userVal = txtInput.value.trim();
            }

            if (!userVal) { alert('Vui lòng chọn hoặc nhập đáp án!'); return; }

            const isCorrect = userVal.toLowerCase() === questionObj.correctAnswer.toLowerCase();
            const msgEl = document.getElementById('retryResultMsg');

            if (isCorrect) {
                if (msgEl) msgEl.innerHTML = `<div style="padding:10px;background:#dcfce7;color:#15803d;border-radius:8px;font-weight:700;">🎉 Chính xác! Bạn đã trả lời đúng câu này. Câu hỏi đã được xóa khỏi danh sách bài tập làm sai.</div>`;
                setTimeout(() => {
                    document.getElementById('retryQuestionModal').style.display = 'none';
                    window.removeMistakeQuestion(id);
                }, 1500);
            } else {
                if (msgEl) msgEl.innerHTML = `<div style="padding:10px;background:#fee2e2;color:#b91c1c;border-radius:8px;font-weight:700;">❌ Chưa chính xác. Vui lòng thử lại!</div>`;
            }
        };

        onAuthStateChanged(auth, (user) => {
            const loginOverlay = document.getElementById('login-overlay');
            if (user) {
                isGuestMode = false;
                if (loginOverlay) loginOverlay.style.display = 'none';
                
                const profile = window.getUserProfile(user.uid);
                
                if (!profile.registered || !profile.name || !profile.age) {
                    window.openRegistrationModal(user);
                } else {
                    window.updateUserHeaderUI(profile, user);
                }
            } else if (!isGuestMode) {
                if (loginOverlay) loginOverlay.style.display = 'flex';
                document.querySelectorAll('.user-info').forEach(el => el.remove());
                document.querySelectorAll('.logout-btn').forEach(el => el.remove());
                document.querySelectorAll('.profile-btn').forEach(el => el.remove());
                const headerProfileBtn = document.getElementById('headerProfileBtn');
                if (headerProfileBtn) headerProfileBtn.style.display = 'none';
                const headerLogoutBtn = document.getElementById('headerLogoutBtn');
                if (headerLogoutBtn) headerLogoutBtn.style.display = 'none';
            }
        });
