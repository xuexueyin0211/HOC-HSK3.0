import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getAuth, signInWithPopup, GoogleAuthProvider, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { getAnalytics, logEvent } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-analytics.js";
import { getFirestore, doc, setDoc, getDoc, updateDoc, collection, getDocs } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyCo-0u_rd_bpsQU3BIU7-mlQbGtZXmWqZ4",
  authDomain: "hoc-tieng-trung-cung-co-ngan.firebaseapp.com",
  projectId: "hoc-tieng-trung-cung-co-ngan",
  storageBucket: "hoc-tieng-trung-cung-co-ngan.firebasestorage.app",
  messagingSenderId: "424872958198",
  appId: "1:424872958198:web:18259878cbe38b806cb4d7"
};

// 1. Khởi tạo Firebase App & Auth
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
window.auth = auth;
const provider = new GoogleAuthProvider();

// 2. Khởi tạo Firestore
let db = null;
try {
    db = getFirestore(app, "xueyingzhongwen");
    window.db = db;
} catch (e) {
    console.warn("Firestore init failed:", e);
    window.db = null;
}

// 3. Khởi tạo Google Analytics 4
let analytics = null;
try {
    analytics = getAnalytics(app);
    window.analytics = analytics;
} catch (e) {
    console.warn("GA4 Analytics init warning:", e);
}

// 4. Helper giới hạn thời gian chờ Firestore (Timeout 2.5s tránh treo app)
function withTimeout(promise, ms = 2500) {
    return new Promise((resolve, reject) => {
        const timer = setTimeout(() => {
            reject(new Error("Firestore operation timed out"));
        }, ms);
        promise.then(
            res => { clearTimeout(timer); resolve(res); },
            err => { clearTimeout(timer); reject(err); }
        );
    });
}

// 5. Hàm lưu Tiến Độ Học Tập lên Firestore (Hybrid Sync)
window.saveUserProgressToCloud = async function(userData) {
    // Mặc định lưu vào localStorage trước cho phản hồi nhanh
    localStorage.setItem('xueying_user_progress', JSON.stringify(userData));
    
    // Nếu có đăng nhập và Firestore sẵn sàng -> Đồng bộ lên Cloud
    if (auth.currentUser && db) {
        try {
            const userRef = doc(db, "users_progress", auth.currentUser.uid);
            await withTimeout(setDoc(userRef, {
                ...userData,
                updatedAt: new Date().toISOString(),
                email: auth.currentUser.email,
                displayName: auth.currentUser.displayName
            }, { merge: true }));
            console.log("☁️ Đã đồng bộ tiến độ lên Cloud Firestore!");
        } catch (error) {
            console.warn("⚠️ Không thể lưu lên Cloud (App vẫn hoạt động với LocalStorage):", error.message);
        }
    }
};

// New Sync functions
window.syncAllDataToFirestore = async function() {
    if (!auth.currentUser || !db) return;
    const uid = auth.currentUser.uid;
    
    // Identify keys to sync
    const keysToSync = [];
    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key.includes('xueying') || key.includes('hsk') || key.includes('flashcard') || key === 'appState' || key === 'undefinedWords') {
            keysToSync.push(key);
        }
    }

    for (const key of keysToSync) {
        const val = localStorage.getItem(key);
        try {
            await setDoc(doc(db, "users", uid, "localStorageData", key), { value: val }, { merge: true });
        } catch(e) { console.error("Error syncing key", key, e); }
    }
    console.log("☁️ Synced all relevant localStorage data to Firestore");
};

window.loadAllDataFromFirestore = async function() {
    if (!auth.currentUser || !db) return;
    const uid = auth.currentUser.uid;
    
    try {
        const snapshot = await getDocs(collection(db, "users", uid, "localStorageData"));
        snapshot.forEach((doc) => {
            localStorage.setItem(doc.id, doc.data().value);
        });
        console.log("📥 Loaded all relevant data from Firestore to localStorage");
    } catch(e) { console.error("Error loading data from Firestore", e); }
};

// 6. Theo dõi trạng thái đăng nhập người dùng (Auth State Listener)
onAuthStateChanged(auth, async (user) => {
    if (user) {
        console.log("👤 Đã đăng nhập:", user.displayName || user.email);
        
        // 1. Load all data from Firestore to localStorage first
        await window.loadAllDataFromFirestore();
        
        // 2. Sync progress (Existing)
        if (db) {
            try {
                const userRef = doc(db, "users_progress", user.uid);
                const docSnap = await withTimeout(getDoc(userRef));
                if (docSnap.exists()) {
                    const cloudData = docSnap.data();
                    localStorage.setItem('xueying_user_progress', JSON.stringify(cloudData));
                    console.log("📥 Đã tải tiến độ học tập từ Cloud Firestore về máy!");
                }
            } catch (e) {
                console.warn("⚠️ Không thể tải tiến độ từ Cloud, dùng LocalStorage tạm thời:", e.message);
            }
        }
        
        // 3. Trigger sync to ensure cloud has latest (e.g. if localStorage had more recent changes)
        await window.syncAllDataToFirestore();
        
        // Trigger reload UI nếu có hàm render
        if (typeof window.renderGuidedPathSidebar === 'function') {
            window.renderGuidedPathSidebar();
        }
        
        // Suggest refresh to user if data was loaded? Maybe not necessary for now.
    } else {
        console.log("👤 Chưa đăng nhập (Guest Mode)");
    }
});

// 7. Hàm Log Sự Kiện GA4
window.logAnalyticsEvent = function(eventName, eventParams = {}) {
    console.log(`[GA4 Event Logged]: ${eventName}`, eventParams);
    if (window.analytics && typeof logEvent === 'function') {
        try {
            logEvent(window.analytics, eventName, eventParams);
        } catch (e) {
            console.warn("GA4 logEvent notice:", e);
        }
    } else if (typeof window.gtag === 'function') {
        try {
            window.gtag('event', eventName, eventParams);
        } catch (e) {
            console.warn("gtag fallback notice:", e);
        }
    }
};

// 8. Các hàm Modal & Đăng nhập Google
window.showUnauthorizedDomainModal = () => {
    const domain = window.location.hostname || window.location.host;
    const hostEl = document.getElementById('currentHostnameDisplay');
    if (hostEl) hostEl.innerText = domain;
    const modal = document.getElementById('unauthorizedDomainModal');
    if (modal) modal.style.display = 'flex';
};

// Auto-sync localStorage to Firestore
const originalSetItem = localStorage.setItem;
localStorage.setItem = function(key, value) {
    originalSetItem.apply(this, arguments);
    
    // Sync to Firestore if Firebase is initialized and user is logged in
    if (window.auth && window.auth.currentUser && window.db && 
        (key.includes('xueying') || key.includes('hsk') || key.includes('flashcard') || key === 'appState' || key === 'undefinedWords')) {
        
        const uid = window.auth.currentUser.uid;
        // Use a background call to sync, do not await to avoid performance issues
        setDoc(doc(window.db, "users", uid, "localStorageData", key), { value: value }, { merge: true })
            .catch(e => console.error("Error syncing key", key, e));
    }
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
        .then(result => console.log("✅ Đã đăng nhập thành công:", result.user.displayName))
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

window.logoutGoogle = () => {
    signOut(auth).then(() => {
        console.log("👋 Đã đăng xuất.");
        alert("Đã đăng xuất tài khoản!");
        location.reload();
    });
};
        const ADMIN_EMAILS = ["xueyinlaoshi@gmail.com"];
        window.ADMIN_EMAILS = ADMIN_EMAILS;

        window.isAdminEmail = function(email) {
            if (!email) return false;
            return ADMIN_EMAILS.map(e => e.toLowerCase()).includes(email.toLowerCase().trim());
        };

        window.checkIsAdmin = function() {
            try {
                const user = (window.auth && window.auth.currentUser) ? window.auth.currentUser : (typeof auth !== 'undefined' ? auth.currentUser : null);
                const email = user ? (user.email || '').toLowerCase() : '';
                if (email && window.isAdminEmail && window.isAdminEmail(email)) return true;

                const uid = user ? user.uid : 'guest';
                const profile = window.getUserProfile ? window.getUserProfile(uid) : null;
                if (profile) {
                    if (profile.role === 'admin') return true;
                    if (profile.email && window.isAdminEmail && window.isAdminEmail(profile.email)) return true;
                }
            } catch(e) {}
            return false;
        };

        let isGuestMode = false;

        window.continueAsGuest = () => {
            alert('⚠️ Yêu cầu đăng nhập tài khoản Google để tham gia học tập!');
            const loginOverlay = document.getElementById('login-overlay');
            if (loginOverlay) loginOverlay.style.display = 'flex';
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

            // Sync to Firestore Database (db) if available
            if (window.db && profile.uid && profile.uid !== 'guest') {
                try {
                    const userDocRef = doc(window.db, "users", profile.uid);
                    withTimeout(setDoc(userDocRef, {
                        uid: profile.uid,
                        email: profile.email || (user ? user.email : ''),
                        name: profile.name || '',
                        age: profile.age || '',
                        role: profile.role || 'student',
                        registered: profile.registered || false,
                        registeredAt: profile.registeredAt || null,
                        consentAccepted: profile.consentAccepted || false,
                        isProfileCompleted: profile.isProfileCompleted || false,
                        onboardingSurvey: profile.onboardingSurvey || null,
                        placementTestResult: profile.placementTestResult || null,
                        streak: profile.streak || 1,
                        lastActiveDate: profile.lastActiveDate || new Date().toISOString().split('T')[0],
                        activeTimer: profile.activeTimer || 0,
                        wrongExercises: profile.wrongExercises || [],
                        learnedLessons: profile.learnedLessons || [],
                        lessonScores: profile.lessonScores || [],
                        researchLogs: profile.researchLogs || [],
                        updatedAt: new Date().toISOString()
                    }, { merge: true }), 2500).catch(err => {
                        console.info("Firestore sync notice (using LocalStorage fallback):", err ? err.message : '');
                        window.db = null;
                    });
                } catch (e) {
                    window.db = null;
                    console.warn("Firestore save error:", e);
                }
            }
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
            alert('🎉 Cập nhật thông tin thành công! Chào mừng ' + name + ' (' + age + ' tuổi) đến với XueYing Zhongwen.');
        };

        // --- HEADER UI & WIDGET UPDATER ---
        window.updateUserHeaderUI = function(profile, user) {
            // Xóa tất cả các nút/ô hiển thị trôi nổi cũ nếu có
            document.querySelectorAll('.user-info').forEach(el => el.remove());
            document.querySelectorAll('.profile-btn').forEach(el => el.remove());
            document.querySelectorAll('.logout-btn').forEach(el => el.remove());

            const headerAdminBtn = document.getElementById('headerAdminBtn');
            const headerProfileBtn = document.getElementById('headerProfileBtn');
            const headerLogoutBtn = document.getElementById('headerLogoutBtn');
            const pNavAdmin = document.getElementById('pNav-admin');
            const adminWidget = document.getElementById('adminPanelWidget');

            const email = (user && user.email) ? user.email.toLowerCase() : (profile && profile.email ? profile.email.toLowerCase() : '');
            const isAdmin = window.isAdminEmail(email) || (profile && profile.role === 'admin');

            if (headerAdminBtn) {
                headerAdminBtn.style.display = isAdmin ? 'inline-flex' : 'none';
            }
            if (pNavAdmin) {
                pNavAdmin.style.display = isAdmin ? 'inline-block' : 'none';
            }

            // Show Admin Control Panel widget if Admin
            if (adminWidget) {
                adminWidget.style.display = isAdmin ? 'block' : 'none';
                const mode = localStorage.getItem('admin_recommendation_mode') || 'intervention';
                const isIntervention = mode === 'intervention';
                if (typeof window.updateAdminToggleUI === 'function') {
                    window.updateAdminToggleUI(isIntervention);
                }
            }

            if (headerProfileBtn) {
                headerProfileBtn.style.display = 'inline-flex';
                headerProfileBtn.innerHTML = `👤 Trang cá nhân`;
            }

            if (headerLogoutBtn) {
                headerLogoutBtn.style.display = 'inline-flex';
            }

            // Update Dynamic Streak & Progress Bar Widget
            if (typeof window.updateStreakAndProgressWidget === 'function') {
                window.updateStreakAndProgressWidget(profile);
            }
        };

        // --- STREAK & HSK PROGRESS WIDGET UPDATER ---
        window.updateStreakAndProgressWidget = function(profile, level) {
            if (!profile) {
                const user = (window.auth && window.auth.currentUser) ? window.auth.currentUser : null;
                const uid = user ? user.uid : 'guest';
                profile = window.getUserProfile(uid);
            }
            const currentLvl = (level || window.currentLevel || 'hsk1').toLowerCase();

            // 1. Streak Counter
            const streakEl = document.getElementById('widgetStreakText');
            if (streakEl) {
                streakEl.textContent = `${profile.streak || 1} Ngày`;
            }

            // 2. Net Active Study Timer
            const activeTimerEl = document.getElementById('widgetActiveTimerText');
            if (activeTimerEl) {
                const sec = profile.activeTimer || 0;
                const m = Math.floor(sec / 60);
                const s = sec % 60;
                activeTimerEl.textContent = `${m} phút ${s} giây`;
            }

            // 3. Progress Bar % for Current HSK Level
            const labelEl = document.getElementById('widgetProgressLabel');
            const percentEl = document.getElementById('widgetProgressPercent');
            const innerBar = document.getElementById('widgetProgressBarInner');
            const detailEl = document.getElementById('widgetProgressDetailText');

            const learnedList = profile.learnedLessons || [];
            const scoreList = profile.lessonScores || [];
            const learnedForLvl = learnedList.filter(item => (item.level || '').toLowerCase() === currentLvl);
            const passedForLvl = scoreList.filter(item => (item.level || '').toLowerCase() === currentLvl && (item.percentage >= 60 || item.score >= 3));

            const uniqueLessons = new Set();
            learnedForLvl.forEach(item => uniqueLessons.add(item.lessonId || item.lessonTitle));
            passedForLvl.forEach(item => uniqueLessons.add(item.lessonId || item.lessonTitle));

            const totalLessonsEstimate = {
                hsk1: 15, hsk2: 15, hsk3: 20, hsk4: 20, hsk5: 25, hsk6: 25
            }[currentLvl] || 15;

            const doneCount = uniqueLessons.size;
            const pct = Math.min(100, Math.round((doneCount / totalLessonsEstimate) * 100));

            if (labelEl) labelEl.textContent = `📊 Tiến độ ${currentLvl.toUpperCase()}`;
            if (percentEl) percentEl.textContent = `${pct}%`;
            if (innerBar) innerBar.style.width = `${pct}%`;
            if (detailEl) detailEl.textContent = `Đã học: ${doneCount}/${totalLessonsEstimate} bài`;

            // 4. Mistake Log Quick Action Button Text
            const mistakesBtn = document.getElementById('widgetMistakesReviewBtn');
            if (mistakesBtn) {
                const mistakeCount = (profile.wrongExercises || []).length;
                mistakesBtn.textContent = `📝 Danh sách lỗi (${mistakeCount})`;
            }
        };

        window.updateAdminToggleUI = function(isIntervention) {
            const toggleInput = document.getElementById('adminRecommendationToggle');
            const label = document.getElementById('adminRecommendationModeLabel');
            const slider = document.getElementById('adminToggleSlider');
            const knob = document.getElementById('adminToggleKnob');

            if (toggleInput) toggleInput.checked = isIntervention;
            if (label) {
                label.textContent = isIntervention ? 'Bật (Cá nhân hóa AI)' : 'Tắt (Chế độ Nền)';
                label.style.color = isIntervention ? '#22c55e' : '#cbd5e1';
            }
            if (slider) {
                slider.style.backgroundColor = isIntervention ? '#10b981' : '#64748b';
            }
            if (knob) {
                knob.style.transform = isIntervention ? 'translateX(22px)' : 'translateX(0px)';
            }
        };

        // --- ADMIN PANEL CONTROL FUNCTIONS ---
        window.toggleAdminRecommendationMode = function(isIntervention) {
            const mode = isIntervention ? 'intervention' : 'baseline';
            localStorage.setItem('admin_recommendation_mode', mode);
            window.updateAdminToggleUI(isIntervention);

            if (typeof window.logAnalyticsEvent === 'function') {
                window.logAnalyticsEvent('admin_toggle_mode', { mode });
            }

            const user = (window.auth && window.auth.currentUser) ? window.auth.currentUser : null;
            const uid = user ? user.uid : 'guest';
            const profile = window.getUserProfile(uid);
            if (typeof window.renderPersonalizedRecommendation === 'function') {
                window.renderPersonalizedRecommendation(profile);
            }
        };

        window.exportAdminDataCSV = function() {
            try {
                const user = (window.auth && window.auth.currentUser) ? window.auth.currentUser : null;
                const uid = user ? user.uid : 'guest';
                const currentProfile = window.getUserProfile(uid);

                const profiles = [currentProfile];
                for (let i = 0; i < localStorage.length; i++) {
                    const k = localStorage.key(i);
                    if (k && k.startsWith('profile_') && !k.endsWith('guest')) {
                        try {
                            const p = JSON.parse(localStorage.getItem(k));
                            if (p && p.uid !== currentProfile.uid) profiles.push(p);
                        } catch(e) {}
                    }
                }

                let csvRows = [];
                csvRows.push([
                    'UID', 'Họ tên', 'Email', 'Vai trò', 'Bậc HSK', 'Chuỗi Streak (ngày)',
                    'Thời gian học Net (giây)', 'Số câu làm sai', 'Số bài đã học',
                    'Điểm Placement Test (%)', 'Điểm yếu Onboarding', 'Mục tiêu học tập', 'Cập nhật cuối'
                ].map(v => `"${v}"`).join(','));

                profiles.forEach(p => {
                    const survey = p.onboardingSurvey || {};
                    const pt = p.placementTestResult || {};
                    const sec = p.activeTimer || 0;
                    const wrongCount = (p.wrongExercises || []).length;
                    const learnedCount = (p.learnedLessons || []).length;
                    const ptScore = pt.percentage !== undefined ? pt.percentage : (pt.score ? Math.round((pt.score / (pt.total || 1)) * 100) : '--');

                    csvRows.push([
                        p.uid || '',
                        p.name || survey.nickname || 'Chưa đặt tên',
                        p.email || '',
                        p.role || 'student',
                        (survey.self_reported_hsk || 'HSK 1').toUpperCase(),
                        p.streak || 1,
                        sec,
                        wrongCount,
                        learnedCount,
                        ptScore,
                        survey.baseline_weakness || '',
                        survey.primary_goal || '',
                        p.updatedAt || new Date().toISOString()
                    ].map(v => `"${String(v).replace(/"/g, '""')}"`).join(','));
                });

                // UTF-8 BOM byte order mark for correct Vietnamese formatting in Excel
                const csvContent = '\uFEFF' + csvRows.join('\n');
                const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
                const url = URL.createObjectURL(blob);
                const link = document.createElement('a');
                link.setAttribute('href', url);
                const dateStr = new Date().toISOString().split('T')[0];
                link.setAttribute('download', `Xueying_Research_Data_Export_${dateStr}.csv`);
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);

                if (typeof window.logAnalyticsEvent === 'function') {
                    window.logAnalyticsEvent('admin_export_csv', { count: profiles.length });
                }

                alert(`✅ Đã xuất thành công dữ liệu báo cáo CSV gồm ${profiles.length} hồ sơ người dùng!`);
            } catch (e) {
                console.error("Export CSV error:", e);
                alert("❌ Đã xảy ra lỗi khi xuất dữ liệu CSV: " + e.message);
            }
        };

        // --- PERSONAL PROFILE DASHBOARD ---
        window.openPersonalProfileModal = function() {
            const user = auth.currentUser;
            const uid = user ? user.uid : 'guest';
            const profile = window.getUserProfile(uid);

            const email = (user && user.email) ? user.email.toLowerCase() : (profile && profile.email ? profile.email.toLowerCase() : '');
            const isAdmin = window.isAdminEmail(email);
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

            const nbKey = 'xueying_hanzi_notebook_' + uid;
            const nbSaved = localStorage.getItem(nbKey);
            const nbList = nbSaved ? JSON.parse(nbSaved) : [];
            const notebookCount = nbList.length;

            let gpaObj = (typeof window.calculateStudentGPA === 'function') ? window.calculateStudentGPA(profile) : { overallGPA: 0 };
            const avgScore = profile.overallGPA !== undefined ? profile.overallGPA : gpaObj.overallGPA;

            document.getElementById('statLearnedCount').textContent = learnedCount;
            document.getElementById('statAverageScore').textContent = avgScore + '%';
            document.getElementById('statMistakesCount').textContent = mistakesCount;
            document.getElementById('statUnmasteredCount').textContent = unmasteredCount;
            const statNb = document.getElementById('statNotebookCount');
            if (statNb) statNb.textContent = notebookCount;

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
            else if (tabName === 'notebook') window.renderNotebookTab(container, profile);
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
            const gpaObj = (typeof window.calculateStudentGPA === 'function') ? window.calculateStudentGPA(profile) : { overallGPA: 0, exerciseAvg: 0, progressTestAvg: 0 };
            
            const overallGPA = gpaObj.overallGPA;
            const exerciseAvg = gpaObj.exerciseAvg;
            const progressTestAvg = gpaObj.progressTestAvg;

            let html = `
                <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:16px;padding:16px 20px;margin-bottom:18px;">
                    <div style="display:flex;align-items:center;gap:8px;color:#0f172a;font-weight:700;font-size:15px;margin-bottom:6px;">
                        📊 Cơ chế tính điểm trung bình toàn khóa (Overall GPA)
                    </div>
                    <div style="font-size:13px;color:#475569;line-height:1.6;">
                        • <b>Công thức tính:</b> <span style="color:#be185d;font-weight:700;">Overall GPA = [(TBC Bài tập lẻ x 1) + (TBC Kiểm tra định kỳ x 2)] / 3 = ${overallGPA}%</span>.<br>
                        • <b>Trung bình bài tập lẻ (Hệ số 1):</b> <span style="color:#2563eb;font-weight:700;">${exerciseAvg}%</span> (${list.length} bài đã nộp).<br>
                        • <b>Trung bình kiểm tra định kỳ (Hệ số 2):</b> <span style="color:#16a34a;font-weight:700;">${progressTestAvg}%</span> (Các mốc Progress Test).<br>
                        • Bạn có thể làm lại bài tập hoặc bài kiểm tra định kỳ bất kỳ lúc nào để cải thiện điểm số TB Toàn khóa.
                    </div>
                </div>

                <div style="display:grid;grid-template-columns:repeat(auto-fit, minmax(130px, 1fr));gap:12px;margin-bottom:18px;">
                    <div style="background:#fdf2f8;border:1px solid #fbcfe8;border-radius:14px;padding:12px;text-align:center;">
                        <div style="font-size:11px;color:#db2777;font-weight:700;">OVERALL GPA TOÀN KHÓA</div>
                        <div style="font-size:24px;font-weight:800;color:#be185d;margin-top:2px;">${overallGPA}%</div>
                    </div>
                    <div style="background:#eff6ff;border:1px solid #bfdbfe;border-radius:14px;padding:12px;text-align:center;">
                        <div style="font-size:11px;color:#2563eb;font-weight:700;">TBC BÀI TẬP LẺ (x1)</div>
                        <div style="font-size:24px;font-weight:800;color:#1d4ed8;margin-top:2px;">${exerciseAvg}%</div>
                    </div>
                    <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:14px;padding:12px;text-align:center;">
                        <div style="font-size:11px;color:#16a34a;font-weight:700;">TBC KIỂM TRA ĐỊNH KỲ (x2)</div>
                        <div style="font-size:24px;font-weight:800;color:#15803d;margin-top:2px;">${progressTestAvg}%</div>
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
                            <span style="background:#fee2e2;color:#dc2626;font-size:10.5px;font-weight:700;padding:2px 8px;border-radius:6px;">${item.module === 'vocab' ? '📘 Từ vựng' : '📕 Ngữ pháp'} - ${item.lessonTitle || 'Bài tập'} (${(item.level||'HSK').toUpperCase()})</span>
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
            const user = (window.auth && window.auth.currentUser) ? window.auth.currentUser : (typeof auth !== 'undefined' ? auth.currentUser : null);
            const uid = user ? user.uid : 'guest';
            const profile = window.getUserProfile(uid);

            if (!profile.learnedLessons) profile.learnedLessons = [];
            const exists = profile.learnedLessons.some(item => 
                String(item.id) === String(lessonId) && 
                (!level || !item.level || String(item.level).toLowerCase() === String(level).toLowerCase())
            );
            if (!exists) {
                profile.learnedLessons.push({
                    id: String(lessonId),
                    level: String(level || 'hsk1').toLowerCase(),
                    title: title || ('Bài ' + lessonId),
                    category: category || 'Ngữ pháp',
                    date: new Date().toISOString()
                });
                window.saveUserProfile(profile);
                if (typeof window.refreshLearnedStatusUI === 'function') {
                    window.refreshLearnedStatusUI();
                }
            }
        };

        window.updateLessonCardCompletedUI = function(cardContainer, isCompleted) {
            if (!cardContainer) return;

            if (isCompleted) {
                cardContainer.classList.add('is-completed');
                cardContainer.style.background = '#ecfdf5';
                cardContainer.style.borderColor = '#a7f3d0';
                cardContainer.style.boxShadow = '0 4px 16px rgba(16, 185, 129, 0.14)';

                const h2 = cardContainer.querySelector('h2');
                if (h2) h2.style.color = '#065f46';

                let checkBadge = cardContainer.querySelector('.completed-check-badge');
                if (!checkBadge) {
                    checkBadge = document.createElement('span');
                    checkBadge.className = 'completed-check-badge';
                    checkBadge.innerHTML = '✓ Đã hoàn thành';
                    const titleBox = cardContainer.querySelector('div');
                    if (titleBox) {
                        titleBox.appendChild(checkBadge);
                    } else {
                        cardContainer.appendChild(checkBadge);
                    }
                }
            } else {
                cardContainer.classList.remove('is-completed');
                cardContainer.style.background = 'white';
                cardContainer.style.borderColor = '#fce7f3';
                cardContainer.style.boxShadow = '0 2px 6px rgba(0,0,0,0.02)';

                const h2 = cardContainer.querySelector('h2');
                if (h2) h2.style.color = '#1e293b';

                const checkBadge = cardContainer.querySelector('.completed-check-badge');
                if (checkBadge) checkBadge.remove();
            }
        };

        window.toggleLessonLearned = function(level, lessonId, title, category, btnElement) {
            const user = (window.auth && window.auth.currentUser) ? window.auth.currentUser : (typeof auth !== 'undefined' ? auth.currentUser : null);
            const uid = user ? user.uid : 'guest';
            const profile = window.getUserProfile(uid);

            if (!profile.learnedLessons) profile.learnedLessons = [];
            const normLevel = String(level || 'hsk1').toLowerCase();
            const normLessonId = String(lessonId);

            const idx = profile.learnedLessons.findIndex(item => 
                String(item.id) === normLessonId && 
                (!item.level || String(item.level).toLowerCase() === normLevel)
            );

            let isNowLearned = false;
            if (idx > -1) {
                profile.learnedLessons.splice(idx, 1);
                isNowLearned = false;
            } else {
                profile.learnedLessons.push({
                    id: normLessonId,
                    level: normLevel,
                    title: title || ('Bài ' + normLessonId),
                    category: category === 'vocab' || category === 'Từ vựng' ? 'Từ vựng' : 'Ngữ pháp',
                    date: new Date().toISOString()
                });
                isNowLearned = true;
            }
            window.saveUserProfile(profile);

            if (btnElement) {
                if (isNowLearned) {
                    btnElement.innerHTML = '✅ Đã hoàn thành';
                    btnElement.style.background = '#10b981';
                    btnElement.style.color = 'white';
                    btnElement.style.border = 'none';
                    btnElement.style.boxShadow = '0 2px 8px rgba(16, 185, 129, 0.3)';
                } else {
                    btnElement.innerHTML = '📌 Đánh dấu đã học';
                    btnElement.style.background = 'white';
                    btnElement.style.color = '#be185d';
                    btnElement.style.border = '1px solid #fbcfe8';
                    btnElement.style.boxShadow = 'none';
                }

                const cardHeader = btnElement.closest('.lessonHeader, .lesson-card, .card');
                if (cardHeader) {
                    window.updateLessonCardCompletedUI(cardHeader, isNowLearned);
                }
            }

            // Sync all matching sidebar items in DOM
            const sidebarItems = document.querySelectorAll(`.lesson-item[data-lesson-id="${normLessonId}"]`);
            sidebarItems.forEach(item => {
                const itemLevel = (item.dataset.level || '').toLowerCase();
                if (!itemLevel || itemLevel === normLevel) {
                    let badge = item.querySelector('.learned-badge');
                    if (isNowLearned) {
                        if (!badge) {
                            badge = document.createElement('span');
                            badge.className = 'learned-badge';
                            badge.style.cssText = 'margin-left:auto;font-size:12px;font-weight:bold;color:#10b981;';
                            badge.textContent = '✅';
                            item.appendChild(badge);
                        }
                    } else {
                        if (badge) badge.remove();
                    }
                }
            });

            if (typeof window.updateStreakAndProgressWidget === 'function') {
                window.updateStreakAndProgressWidget(profile, normLevel);
            }
        };

        window.isLessonLearned = function(level, lessonId) {
            try {
                const user = (window.auth && window.auth.currentUser) ? window.auth.currentUser : (typeof auth !== 'undefined' ? auth.currentUser : null);
                const uid = user ? user.uid : 'guest';
                const profile = window.getUserProfile(uid);
                if (!profile || !profile.learnedLessons) return false;
                const targetId = String(lessonId);
                const targetLvl = level ? String(level).toLowerCase() : null;
                return profile.learnedLessons.some(item => {
                    const sameId = String(item.id) === targetId;
                    if (!sameId) return false;
                    if (!targetLvl || !item.level) return true;
                    return String(item.level).toLowerCase() === targetLvl;
                });
            } catch(e) { return false; }
        };

        window.refreshLearnedStatusUI = function() {
            try {
                const user = (window.auth && window.auth.currentUser) ? window.auth.currentUser : (typeof auth !== 'undefined' ? auth.currentUser : null);
                const uid = user ? user.uid : 'guest';
                const profile = window.getUserProfile(uid);
                if (!profile) return;

                const isAdmin = (typeof window.checkIsAdmin === 'function' && window.checkIsAdmin());

                // 1. Refresh all sidebar items (Lessons)
                document.querySelectorAll('.lesson-item:not(.milestone-sidebar-item)').forEach(item => {
                    const lvl = item.dataset.level || window.currentLevel || 'hsk1';
                    const lid = item.dataset.lessonId;
                    if (!lid) return;
                    const cat = item.dataset.category || 'Ngữ pháp';
                    
                    const isLearned = window.isLessonLearned(lvl, lid);
                    const isUnlocked = (typeof window.isLessonUnlocked === 'function') ? window.isLessonUnlocked(lvl, cat, lid) : true;

                    if (!isUnlocked && !isAdmin) {
                        item.classList.add('locked');
                        item.style.opacity = '0.65';
                        item.style.cursor = 'not-allowed';
                    } else {
                        item.classList.remove('locked');
                        item.style.opacity = '1';
                        item.style.cursor = 'pointer';
                    }

                    let badge = item.querySelector('.learned-badge');
                    if (isLearned) {
                        if (!badge) {
                            badge = document.createElement('span');
                            badge.className = 'learned-badge';
                            badge.style.cssText = 'margin-left:auto;font-size:12px;font-weight:bold;color:#10b981;';
                            badge.textContent = '✅';
                            item.appendChild(badge);
                        }
                    } else {
                        if (badge) badge.remove();
                    }
                });

                // 2. Refresh milestone sidebar items (Progress Tests)
                document.querySelectorAll('.milestone-sidebar-item').forEach(item => {
                    const cat = item.dataset.category || 'Ngữ pháp';
                    const lvl = item.dataset.level || window.currentLevel || 'hsk1';
                    const startId = parseInt(item.dataset.startId, 10);
                    const endId = parseInt(item.dataset.endId, 10);
                    if (isNaN(startId) || isNaN(endId)) return;

                    const msRes = (typeof window.getMilestoneTestResult === 'function') ? window.getMilestoneTestResult(cat, lvl, startId, endId) : null;
                    const isUnlocked = (typeof window.isMilestoneTestUnlocked === 'function') ? window.isMilestoneTestUnlocked(cat, lvl, startId, endId) : (isAdmin);

                    if (msRes) {
                        item.style.cssText = `
                            padding:10px 20px; cursor:pointer; transition:all 0.3s ease;
                            font-size:13px; font-weight:700; color:#15803d; background:#f0fdf4;
                            border-left:3.5px solid #10b981; display:flex; align-items:center; gap:8px; margin:6px 0; border-radius:0 10px 10px 0;
                        `;
                        item.innerHTML = `
                            <span>✅</span>
                            <span style="flex:1;">Bài Kiểm Tra Mốc ${startId}-${endId} (${msRes.score}%)</span>
                        `;
                    } else if (isUnlocked || isAdmin) {
                        item.style.cssText = `
                            padding:10px 20px; cursor:pointer; transition:all 0.3s ease;
                            font-size:13px; font-weight:700; color:#be185d; background:#fdf2f8;
                            border-left:3.5px solid #ec4899; display:flex; align-items:center; gap:8px; margin:6px 0; border-radius:0 10px 10px 0;
                        `;
                        item.innerHTML = `
                            <span>🎯</span>
                            <span style="flex:1;">Bài Kiểm Tra Mốc ${startId}-${endId}${isAdmin ? ' (Admin)' : ''}</span>
                        `;
                    } else {
                        item.style.cssText = `
                            padding:10px 20px; cursor:not-allowed; transition:all 0.3s ease; opacity:0.7;
                            font-size:13px; font-weight:700; color:#94a3b8; background:#f8fafc;
                            border-left:3.5px solid #cbd5e1; display:flex; align-items:center; gap:8px; margin:6px 0; border-radius:0 10px 10px 0;
                        `;
                        item.innerHTML = `
                            <span>🔒</span>
                            <span style="flex:1;">Bài Kiểm Tra Mốc ${startId}-${endId}</span>
                        `;
                    }
                });

                // 3. Refresh mark-learned buttons
                document.querySelectorAll('.mark-learned-btn').forEach(btn => {
                    const onclickAttr = btn.getAttribute('onclick') || '';
                    const match = onclickAttr.match(/toggleLessonLearned\s*\(\s*['"]([^'"]+)['"]\s*,\s*['"]([^'"]+)['"]/);
                    if (match) {
                        const lvl = match[1];
                        const lid = match[2];
                        const isLearned = window.isLessonLearned(lvl, lid);
                        if (isLearned) {
                            btn.innerHTML = '✅ Đã hoàn thành';
                            btn.style.background = '#10b981';
                            btn.style.color = 'white';
                            btn.style.border = 'none';
                            btn.style.boxShadow = '0 2px 8px rgba(16, 185, 129, 0.3)';
                        } else {
                            btn.innerHTML = '📌 Đánh dấu đã học';
                            btn.style.background = 'white';
                            btn.style.color = '#be185d';
                            btn.style.border = '1px solid #fbcfe8';
                            btn.style.boxShadow = 'none';
                        }
                        const cardHeader = btn.closest('.lessonHeader, .lesson-card-header, .lesson-card, .card');
                        if (cardHeader) {
                            window.updateLessonCardCompletedUI(cardHeader, isLearned);
                        }
                    }
                });
            } catch(e) {
                console.warn('refreshLearnedStatusUI error:', e);
            }
        };

        window.removeLearnedLesson = function(lessonId, level) {
            const user = (window.auth && window.auth.currentUser) ? window.auth.currentUser : (typeof auth !== 'undefined' ? auth.currentUser : null);
            const uid = user ? user.uid : 'guest';
            const profile = window.getUserProfile(uid);
            if (profile && profile.learnedLessons) {
                const targetId = String(lessonId);
                const targetLvl = level ? String(level).toLowerCase() : null;
                profile.learnedLessons = profile.learnedLessons.filter(item => !(
                    String(item.id) === targetId &&
                    (!targetLvl || !item.level || String(item.level).toLowerCase() === targetLvl)
                ));
                window.saveUserProfile(profile);
            }
            if (typeof window.refreshLearnedStatusUI === 'function') {
                window.refreshLearnedStatusUI();
            }
            if (typeof window.openPersonalProfileModal === 'function') {
                window.openPersonalProfileModal();
                if (typeof window.switchProfileTab === 'function') {
                    window.switchProfileTab('learned');
                }
            }
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

                // GA4 Event: quiz_wrong_answer
                if (typeof window.logAnalyticsEvent === 'function') {
                    window.logAnalyticsEvent('quiz_wrong_answer', {
                        question: exObj.question,
                        level: exObj.level || 'hsk1',
                        module: exObj.module || 'grammar',
                        lesson_id: exObj.lessonId || ''
                    });
                }
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
                if (node.id) {
                    const nid = String(node.id).toLowerCase();
                    if (
                        nid === 'retryquestionmodal' ||
                        nid === 'retryquestionbody' ||
                        nid === 'hskexamcontainer' ||
                        nid === 'activehskexam' ||
                        nid === 'quizresult' ||
                        nid.endsWith('-999') ||
                        nid.endsWith('-exercise')
                    ) {
                        return true;
                    }
                }
                if (node.classList && node.classList.length > 0) {
                    const classes = Array.from(node.classList);
                    for (const cls of classes) {
                        const lower = cls.toLowerCase();
                        if (lower.includes('example')) continue;
                        if (
                            lower.includes('exercise') ||
                            lower.includes('quiz') ||
                            lower.includes('practice') ||
                            lower.includes('retry') ||
                            lower.includes('question') ||
                            (lower.includes('exam') && !lower.includes('example'))
                        ) {
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
                    if (key === 'lessons' || key === 'items' || key === 'chars' || key === 'words' || key === 'examples' || !isNaN(key)) {
                        if (typeof obj[key] === 'object' && obj[key] !== null) {
                            const res = findWordInData(obj[key], text);
                            if (res) return res;
                        }
                    }
                }
            }
            return null;
        }

        function triggerInlineLookup(cleanText, targetElement) {
            if (!cleanText) return;
            const txt = cleanText.trim();
            if (!txt || txt.length > 50) return;

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

            const datasetSources = [window.cachedData, window.hskData];
            for (let source of datasetSources) {
                if (!source) continue;
                for (let k in source) {
                    const levelStr = k.split('-')[1] || k || 'hsk1';
                    const data = source[k];
                    if (data) {
                        foundItem = findWordInData(data, txt);
                        if (foundItem) {
                            foundLevel = levelStr.toUpperCase();
                            break;
                        }
                    }
                }
                if (foundItem) break;
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
                        if (data && data[0] && Array.isArray(data[0])) {
                            let fullTrans = data[0].map(part => (part && part[0]) ? part[0] : '').join('');
                            viEl.textContent = fullTrans || 'Chưa tìm thấy nghĩa.';
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

        window.triggerInlineLookup = triggerInlineLookup;

        function handleSelectionLookup(targetHint) {
            const sel = window.getSelection ? window.getSelection() : null;
            if (!sel) return;
            const clean = sel.toString().trim();
            if (!clean || clean.length > 50) return;

            const focusNode = sel.focusNode;
            const target = targetHint || (focusNode ? focusNode.parentElement : document.activeElement);

            if (isInsideExerciseArea(target)) {
                window.closeInlineLookup();
                return;
            }

            const containsChinese = /[\u4e00-\u9fa5]/.test(clean);
            if (containsChinese) {
                triggerInlineLookup(clean, target);
            }
        }

        document.addEventListener('mouseup', function(e) {
            setTimeout(() => {
                handleSelectionLookup(e.target);
            }, 80);
        });

        document.addEventListener('touchend', function(e) {
            setTimeout(() => {
                handleSelectionLookup(e.target);
            }, 180);
        });

        document.addEventListener('dblclick', function(e) {
            handleSelectionLookup(e.target);
        });

        let inlineSelTimeout = null;
        document.addEventListener('selectionchange', function() {
            if (inlineSelTimeout) clearTimeout(inlineSelTimeout);
            inlineSelTimeout = setTimeout(() => {
                handleSelectionLookup();
            }, 300);
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

        /* ==========================================================================
           RESEARCH LOGGING, ONBOARDING & PERSONALIZED RECOMMENDATIONS ENGINE
           ========================================================================== */

        window.logResearchEvent = function(eventName, eventParams = {}) {
            console.log(`[Research Event Logged]: ${eventName}`, eventParams);
            
            // 1. Log to GA4
            if (typeof window.gtag === 'function') {
                try {
                    window.gtag('event', eventName, eventParams);
                } catch (e) {
                    console.warn('GA4 dispatch warning:', e);
                }
            }
            
            // 2. Persist in local profile research log history
            try {
                const user = (window.auth && window.auth.currentUser) ? window.auth.currentUser : null;
                const uid = user ? user.uid : 'guest';
                const profile = window.getUserProfile(uid);
                if (!profile.researchLogs) profile.researchLogs = [];
                profile.researchLogs.push({
                    eventName: eventName,
                    eventParams: eventParams,
                    timestamp: new Date().toISOString()
                });
                window.saveUserProfile(profile);
            } catch (e) {
                console.warn('Local research log save warning:', e);
            }
        };

        window.acceptInformedConsent = function() {
            const user = (window.auth && window.auth.currentUser) ? window.auth.currentUser : null;
            const uid = user ? user.uid : 'guest';
            const profile = window.getUserProfile(uid);
            profile.consentAccepted = true;
            profile.consentAcceptedAt = new Date().toISOString();
            window.saveUserProfile(profile);

            // Log event
            window.logResearchEvent('consent_accepted', {
                user_id: uid,
                email: user ? user.email : 'guest'
            });

            // Hide consent modal
            const modal = document.getElementById('informedConsentModal');
            if (modal) modal.style.display = 'none';

            // Check if admin bypass or student flow
            const userEmail = (user && user.email) ? user.email.toLowerCase().trim() : '';
            if (window.isAdminEmail(userEmail)) {
                profile.role = "admin";
                profile.isProfileCompleted = true;
                window.saveUserProfile(profile);
                window.updateUserHeaderUI(profile, user);
                window.renderPersonalizedRecommendation(profile);
            } else if (!profile.isProfileCompleted) {
                if (profile.onboardingSurvey && profile.onboardingSurvey.self_reported_hsk && !profile.placementTestResult) {
                    window.openPlacementTestModal(profile.onboardingSurvey.self_reported_hsk);
                } else {
                    window.openOnboardingSurveyModal();
                }
            } else {
                window.updateUserHeaderUI(profile, user);
                window.renderPersonalizedRecommendation(profile);
            }
        };

        window.declineInformedConsent = function() {
            const box = document.getElementById('informedConsentModalBox');
            if (box) {
                box.innerHTML = `
                    <div style="text-align: center; padding: 20px 10px; font-family: 'Plus Jakarta Sans', sans-serif;">
                        <div style="font-size: 54px; margin-bottom: 12px;">🛑</div>
                        <h2 style="font-size: 20px; font-weight: 800; color: #dc2626; margin-bottom: 12px;">Cần chấp thuận cam kết để tham gia thực nghiệm</h2>
                        <p style="font-size: 14px; color: #475569; line-height: 1.6; margin-bottom: 24px;">
                            Hệ thống yêu cầu học viên đọc và chấp thuận Cam kết Đạo đức Nghiên cứu để tiếp tục trải nghiệm và học tập trên nền tảng.
                        </p>
                        <div style="display: flex; gap: 12px; justify-content: center; flex-wrap: wrap;">
                            <button onclick="window.reopenConsentForm()" style="padding: 12px 20px; background: linear-gradient(135deg, #7e22ce, #9333ea); color: white; border: none; border-radius: 12px; font-size: 14px; font-weight: 800; cursor: pointer; box-shadow: 0 4px 14px rgba(126,34,206,0.35);">
                                🔄 Xem lại cam kết & Đồng ý
                            </button>
                            <button onclick="window.logout()" style="padding: 12px 20px; background: #fee2e2; color: #dc2626; border: 1px solid #fca5a5; border-radius: 12px; font-size: 14px; font-weight: 800; cursor: pointer;">
                                🚪 Đăng xuất
                            </button>
                        </div>
                    </div>
                `;
            } else {
                alert('⚠️ Cần chấp thuận cam kết để tham gia thực nghiệm!');
                if (typeof window.logout === 'function') window.logout();
            }
        };

        window.reopenConsentForm = function() {
            const box = document.getElementById('informedConsentModalBox');
            if (box) {
                box.innerHTML = `
                    <div style="text-align: center; margin-bottom: 20px;">
                        <div style="font-size: 48px; margin-bottom: 8px;">🔬📜</div>
                        <h2 style="font-size: 22px; font-weight: 800; color: #6b21a8; margin: 0 0 6px 0;">Góc nhỏ minh bạch & Cam kết từ Admin 🤝</h2>
                    </div>
                    
                    <div style="background: #faf5ff; border: 1px solid #e9d5ff; padding: 18px 20px; border-radius: 16px; margin-bottom: 24px; font-size: 14px; line-height: 1.6; color: #334155;">
                        Trang web này giúp bạn học tiếng Trung bài bản và hoàn toàn miễn phí. Tuy nhiên, mình xin phép dùng dữ liệu học tập ẩn danh của bạn để phục vụ mục đích nghiên cứu khoa học.<br><br>
                        Mình xin cam đoan không để lộ các thông tin cá nhân như tên, địa chỉ email của bạn. Các dữ liệu khác (như thời gian học, log lỗi sai) chỉ dùng thuần túy cho nghiên cứu. Khi bạn bấm <b>"Đồng ý & Tiếp tục"</b>, có nghĩa là bạn đồng ý cho phép mình sử dụng dữ liệu này.<br><br>
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
                `;
            }
        };

        window.currentSurveyStep = 1;

        window.openOnboardingSurveyModal = function() {
            const user = (window.auth && window.auth.currentUser) ? window.auth.currentUser : null;
            const uid = user ? user.uid : 'guest';
            const profile = window.getUserProfile(uid);

            const nickInput = document.getElementById('survey_nickname');
            if (nickInput && !nickInput.value) {
                nickInput.value = profile.name || (user ? user.displayName : '') || '';
            }

            window.currentSurveyStep = 1;
            window.updateSurveyStepUI();

            const modal = document.getElementById('onboardingSurveyModal');
            if (modal) modal.style.display = 'flex';
        };

        window.updateSurveyStepUI = function() {
            const step = window.currentSurveyStep;
            const totalSteps = 4;

            for (let i = 1; i <= totalSteps; i++) {
                const stepEl = document.getElementById(`surveyStep${i}`);
                if (stepEl) {
                    stepEl.style.display = (i === step) ? 'block' : 'none';
                }
            }

            const pct = Math.round((step / totalSteps) * 100);
            const bar = document.getElementById('surveyProgressBar');
            if (bar) bar.style.width = pct + '%';

            const badge = document.getElementById('surveyStepBadge');
            if (badge) badge.textContent = `Bước ${step} / ${totalSteps} (${pct}%)`;

            const prevBtn = document.getElementById('surveyPrevBtn');
            const nextBtn = document.getElementById('surveyNextBtn');
            const submitBtn = document.getElementById('surveySubmitBtn');

            if (prevBtn) prevBtn.style.display = (step > 1) ? 'block' : 'none';
            if (nextBtn) nextBtn.style.display = (step < totalSteps) ? 'block' : 'none';
            if (submitBtn) submitBtn.style.display = (step === totalSteps) ? 'block' : 'none';
        };

        window.validateCurrentSurveyStep = function() {
            const step = window.currentSurveyStep;
            if (step === 1) {
                const nick = document.getElementById('survey_nickname')?.value.trim();
                const age = document.getElementById('survey_age_group')?.value;
                const major = document.querySelector('input[name="survey_major"]:checked');
                const tenure = document.querySelector('input[name="survey_tenure"]:checked');

                if (!nick) { alert('Vui lòng nhập tên/biệt danh của bạn!'); return false; }
                if (!age) { alert('Vui lòng chọn độ tuổi!'); return false; }
                if (!major) { alert('Vui lòng chọn thông tin chuyên ngành!'); return false; }
                if (!tenure) { alert('Vui lòng chọn thời gian đã học!'); return false; }
            } else if (step === 2) {
                const hsk = document.getElementById('survey_hsk_level')?.value;
                const weakness = document.querySelector('input[name="survey_weakness"]:checked');
                const goal = document.querySelector('input[name="survey_goal"]:checked');
                const target = document.getElementById('survey_target')?.value.trim();

                if (!hsk) { alert('Vui lòng chọn cấp độ HSK tự đánh giá!'); return false; }
                if (!weakness) { alert('Vui lòng chọn kỹ năng yếu nhất!'); return false; }
                if (!goal) { alert('Vui lòng chọn mục đích chính khi học!'); return false; }
                if (!target) { alert('Vui lòng nhập mục tiêu cụ thể!'); return false; }
            } else if (step === 3) {
                const totalTime = document.querySelector('input[name="survey_total_time"]:checked');
                const siteTime = document.querySelector('input[name="survey_site_time"]:checked');

                if (!totalTime) { alert('Vui lòng chọn tổng thời gian học hàng ngày!'); return false; }
                if (!siteTime) { alert('Vui lòng chọn thời gian dự định học trên trang web!'); return false; }
            } else if (step === 4) {
                const regulation = document.querySelector('input[name="survey_regulation"]:checked');
                const attitude = document.querySelector('input[name="survey_attitude"]:checked');

                if (!regulation) { alert('Vui lòng chọn mức độ tự duy trì thói quen!'); return false; }
                if (!attitude) { alert('Vui lòng chọn cảm xúc khi gặp bài tập khó!'); return false; }
            }
            return true;
        };

        window.nextSurveyStep = function() {
            if (window.validateCurrentSurveyStep()) {
                if (window.currentSurveyStep < 4) {
                    window.currentSurveyStep++;
                    window.updateSurveyStepUI();
                }
            }
        };

        window.prevSurveyStep = function() {
            if (window.currentSurveyStep > 1) {
                window.currentSurveyStep--;
                window.updateSurveyStepUI();
            }
        };

        /* Step 1 -> Step 2 -> Step 3 Flow Handler */
        window.handleSurveySubmit = function(e) {
            if (e) e.preventDefault();

            if (!window.validateCurrentSurveyStep()) return;

            const user = (window.auth && window.auth.currentUser) ? window.auth.currentUser : null;
            const uid = user ? user.uid : 'guest';
            const profile = window.getUserProfile(uid);

            const surveyData = {
                nickname: document.getElementById('survey_nickname')?.value.trim() || 'Học viên',
                age_group: document.getElementById('survey_age_group')?.value || '',
                is_chinese_major: document.querySelector('input[name="survey_major"]:checked')?.value || '',
                learning_tenure: document.querySelector('input[name="survey_tenure"]:checked')?.value || '',
                self_reported_hsk: document.getElementById('survey_hsk_level')?.value || 'hsk1',
                baseline_weakness: document.querySelector('input[name="survey_weakness"]:checked')?.value || 'vocab',
                primary_goal: document.querySelector('input[name="survey_goal"]:checked')?.value || '',
                specific_target: document.getElementById('survey_target')?.value.trim() || '',
                total_daily_study_time: document.querySelector('input[name="survey_total_time"]:checked')?.value || '',
                platform_committed_time: document.querySelector('input[name="survey_site_time"]:checked')?.value || '',
                self_regulation_score: document.querySelector('input[name="survey_regulation"]:checked')?.value || '3',
                anxiety_attitude_score: document.querySelector('input[name="survey_attitude"]:checked')?.value || ''
            };

            profile.name = surveyData.nickname;
            profile.age = surveyData.age_group;
            profile.registered = true;
            profile.consentAccepted = true;
            profile.onboardingSurvey = surveyData;

            window.saveUserProfile(profile);

            // Sync with registered users list for admin view
            if (typeof window.getRegisteredUsersList === 'function') {
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
                if (existingIdx !== -1) users[existingIdx] = newRecord;
                else users.unshift(newRecord);
                if (typeof window.saveRegisteredUsersList === 'function') {
                    window.saveRegisteredUsersList(users);
                }
            }

            // Research Log Event & GA4 Onboarding Complete
            window.logResearchEvent('onboarding_completed', {
                user_id: uid,
                hsk_level: surveyData.self_reported_hsk,
                weakness: surveyData.baseline_weakness,
                nickname: surveyData.nickname,
                age_group: surveyData.age_group,
                is_major: surveyData.is_chinese_major,
                goal: surveyData.primary_goal
            });
            if (typeof window.logAnalyticsEvent === 'function') {
                window.logAnalyticsEvent('onboarding_complete', {
                    user_id: uid,
                    hsk_level: surveyData.self_reported_hsk,
                    weakness: surveyData.baseline_weakness,
                    step: 'survey'
                });
            }

            // Close Step 1 survey modal
            const surveyModal = document.getElementById('onboardingSurveyModal');
            if (surveyModal) surveyModal.style.display = 'none';

            // Step 2: Open Placement Test Modal directly for selected HSK level!
            window.openPlacementTestModal(surveyData.self_reported_hsk);
        };

        /* PLACEMENT TEST ENGINE */
        window.placementTestQuestions = {
            hsk1: [
                { q: "1. Từ nào dưới đây có nghĩa là 'Xin chào'?", opts: ["谢谢 (Xièxie)", "你好 (Nǐ hǎo)", "再见 (Zàijiàn)", "对不起 (Duìbuqǐ)"], ans: "1" },
                { q: "2. Điền từ thích hợp vào chỗ trống: 我___学生 (Tôi là học sinh).", opts: ["是 (shì)", "有 (yǒu)", "在 (zài)", "很 (hěn)"], ans: "0" },
                { q: "3. Nghĩa của từ '苹果' (píngguǒ) là gì?", opts: ["Quả táo", "Quả chuối", "Nước lọc", "Quả dưa hấu"], ans: "0" },
                { q: "4. Chọn câu dịch đúng: 'Tôi thích ăn món ăn Trung Quốc.'", opts: ["我喜欢吃中国菜。(Wǒ xǐhuān chī Zhōngguó cài.)", "我是吃中国菜。(Wǒ shì chī Zhōngguó cài.)", "我在中国菜。", "我中国菜吃。"], ans: "0" },
                { q: "5. Từ '明天' (míngtiān) có nghĩa là:", opts: ["Hôm nay", "Ngày mai", "Hôm qua", "Sang năm"], ans: "1" }
            ],
            hsk2: [
                { q: "1. Từ '准备' (zhǔnbèi) có nghĩa là gì?", opts: ["Bắt đầu", "Chuẩn bị", "Hoàn thành", "Tiếp tục"], ans: "1" },
                { q: "2. Điền từ thích hợp: 外面___下雨了，你带伞吧。(Bên ngoài đang mưa...)", opts: ["正在 (zhèngzài)", "已经 (yǐjīng)", "经常 (jīngcháng)", "准备 (zhǔnbèi)"], ans: "0" },
                { q: "3. Điền từ: 我___过中国。(Tôi đã từng đi Trung Quốc)", opts: ["了 (le)", "过 (guò)", "着 (zhe)", "会 (huì)"], ans: "1" },
                { q: "4. Nghĩa của từ '跑步' (pǎobù) là:", opts: ["Đi bộ", "Bơi lội", "Chạy bộ", "Đá bóng"], ans: "2" },
                { q: "5. Từ trái nghĩa với '便宜' (piányi - rẻ) là:", opts: ["贵 (guì - đắt)", "高 (gāo)", "大 (dà)", "多 (duō)"], ans: "0" }
            ],
            hsk3: [
                { q: "1. Nghĩa của từ '舒服' (shūfu) là gì?", opts: ["Dễ chịu, thoải mái", "Khó khăn", "Nhàn rỗi", "Vui vẻ"], ans: "0" },
                { q: "2. Điền từ: 他___说___笑，非常开心。(Anh ấy vừa nói vừa cười...)", opts: ["一边...一边...", "虽然...但是...", "因为...所以...", "不但...而且..."], ans: "0" },
                { q: "3. Câu sử dụng cấu trúc '把' đúng là:", opts: ["他把作业做完了。(Tā bǎ zuòyè zuò wán le.)", "他做作业把完了。", "他作业把做完了。", "把作业他做完了。"], ans: "0" },
                { q: "4. Từ '提高' (tígāo) có nghĩa là:", opts: ["Tăng cường, nâng cao", "Giảm bớt", "Thay đổi", "Bảo vệ"], ans: "0" },
                { q: "5. Cặp liên từ '虽然...但是...' có nghĩa là:", opts: ["Tuy... nhưng...", "Vì... nên...", "Nếu... thì...", "Không những... mà còn..."], ans: "0" }
            ],
            hsk4: [
                { q: "1. Nghĩa của từ '适合' (shìhé) là gì?", opts: ["Thích hợp, phù hợp", "Thích ứng", "Kết hợp", "Hài hòa"], ans: "0" },
                { q: "2. Điền từ: 只要坚持，___能成功。(Chỉ cần kiên trì thì nhất định có thể thành công)", opts: ["就 (jiù)", "才 (cái)", "又 (yòu)", "还 (hái)"], ans: "0" },
                { q: "3. Từ '按时' (ànshí) có nghĩa là:", opts: ["Đúng giờ, theo thời gian quy định", "Tạm thời", "Thỉnh thoảng", "Quá hạn"], ans: "0" },
                { q: "4. Cấu trúc câu bị động '被' nào chuẩn xác?", opts: ["苹果被他吃了。(Píngguǒ bèi tā chī le.)", "他被苹果吃了。", "被苹果他吃了。", "苹果吃了被他。"], ans: "0" },
                { q: "5. Từ nào đồng nghĩa với '完全' (wánquán)?", opts: ["彻底 (chèdǐ)", "部分 (bùfen)", "稍微 (shāowēi)", "几乎 (jīhū)"], ans: "0" }
            ],
            hsk5: [
                { q: "1. Từ '概括' (gàikuò) có nghĩa là:", opts: ["Tóm tắt, khái quát", "Chi tiết, phân tích", "Mở rộng, giải thích", "Tranh luận"], ans: "0" },
                { q: "2. Điền từ thích hợp: 无论是生活还是工作，___需要保持积极的心态。", opts: ["都 (dōu)", "就 (jiù)", "才 (cái)", "却 (què)"], ans: "0" },
                { q: "3. Nghĩa của từ '避免' (bìmiǎn) là:", opts: ["Tránh, bãi bỏ", "Duy trì", "Khuyến khích", "Phát triển"], ans: "0" },
                { q: "4. Từ '深刻' (shēnkè) dùng để mô tả:", opts: ["Sâu sắc, ấn tượng sâu đậm", "Nông cạn, hời hợt", "Ngắn hạn", "Phức tạp"], ans: "0" },
                { q: "5. Chọn câu sử dụng đúng từ '竟然' (jìngrán):", opts: ["这么难的题，他竟然做出来了！", "他竟然去买苹果， because he likes it.", "竟然我是学生。", "他竟然明天来。"], ans: "0" }
            ],
            hsk6: [
                { q: "1. Từ '蕴含' (yùnhán) có nghĩa là gì?", opts: ["Chứa đựng, tiềm ẩn bên trong", "Bộc lộ ra ngoài", "Xóa bỏ hoàn toàn", "Xung đột"], ans: "0" },
                { q: "2. Thành ngữ '循序渐进' (xún xù jiàn jìn) có ý nghĩa:", opts: ["Làm theo thứ tự, tiến bộ dần dần", "Nóng vội muốn thành công nhanh", "Do dự không quyết định", "Dậm chân tại chỗ"], ans: "0" },
                { q: "3. Điền từ: 这篇论文观点明确，论据充分，___具有较高的学术价值。", opts: ["从而 (cóng'ér)", "反之 (fǎnzhī)", "哪怕 (nǎpà)", "固然 (gùrán)"], ans: "0" },
                { q: "4. Từ nào đồng nghĩa với '阐述' (chǎnshù)?", opts: ["详细说明 (Giải thích, trình bày chi tiết)", "隐瞒 (Che giấu)", "怀疑 (Nghi ngờ)", "否定 (Phủ định)"], ans: "0" },
                { q: "5. Chọn câu chuẩn xác nhất không có lỗi ngữ pháp (病句):", opts: ["这次培训使我的业务水平有了显著提高。", "通过 night...", "使我的业务水平 speech...", "业务水平使我的 speech..."], ans: "0" }
            ]
        };

        window.loadPlacementQuestions = async function() {
            try {
                const res = await fetch('/data/placement_test.json');
                if (res.ok) {
                    const data = await res.json();
                    if (data && typeof data === 'object') {
                        window.placementTestQuestions = data;
                    }
                }
            } catch (e) {
                console.warn('Could not load /data/placement_test.json, using fallback placementTestQuestions:', e);
            }
        };

        window.currentPlacementHskLevel = 'hsk1';

        window.openPlacementTestModal = async function(hskLevel) {
            await window.loadPlacementQuestions();
            const level = (hskLevel || 'hsk1').toLowerCase();
            window.currentPlacementHskLevel = level;

            const levelBadge = document.getElementById('placementTestLevelBadge');
            if (levelBadge) levelBadge.textContent = level.toUpperCase();

            const questions = window.placementTestQuestions[level] || window.placementTestQuestions.hsk1;
            const container = document.getElementById('placementTestQuestionsContainer');
            if (container) {
                container.innerHTML = questions.map((item, idx) => `
                    <div style="background: #f8fafc; border: 1.5px solid #cbd5e1; border-radius: 16px; padding: 18px; box-shadow: 0 2px 4px rgba(0,0,0,0.02);">
                        <div style="font-size: 14.5px; font-weight: 700; color: #1e293b; margin-bottom: 12px; line-height: 1.5;">
                            ${escapeHtml(item.q)}
                        </div>
                        <div style="display: flex; flex-direction: column; gap: 8px;">
                            ${item.opts.map((opt, oIdx) => `
                                <label style="padding: 10px 14px; border: 1px solid #cbd5e1; border-radius: 10px; font-size: 13.5px; cursor: pointer; display: flex; align-items: center; gap: 10px; background: white; transition: all 0.2s;">
                                    <input type="radio" name="pt_q_${idx}" value="${oIdx}" required style="accent-color: #2563eb;" />
                                    <span>${escapeHtml(opt)}</span>
                                </label>
                            `).join('')}
                        </div>
                    </div>
                `).join('');
            }

            const modal = document.getElementById('placementTestModal');
            if (modal) modal.style.display = 'flex';
        };

        /* Step 3: Handle Placement Test Submission & Auto-Routing */
        window.handlePlacementTestSubmit = function(e) {
            if (e) e.preventDefault();

            const level = window.currentPlacementHskLevel || 'hsk1';
            const questions = window.placementTestQuestions[level] || window.placementTestQuestions.hsk1;

            let correctCount = 0;
            questions.forEach((item, idx) => {
                const selected = document.querySelector(`input[name="pt_q_${idx}"]:checked`);
                if (selected && selected.value === item.ans) {
                    correctCount++;
                }
            });

            const total = questions.length;
            const pct = Math.round((correctCount / total) * 100);

            const user = (window.auth && window.auth.currentUser) ? window.auth.currentUser : null;
            const uid = user ? user.uid : 'guest';
            const profile = window.getUserProfile(uid);

            profile.placementTestResult = {
                level: level,
                score: correctCount,
                total: total,
                percentage: pct,
                completedAt: new Date().toISOString()
            };
            profile.isProfileCompleted = true;
            profile.currentHskLevel = level;
            window.saveUserProfile(profile);

            // Save to lessonScores history for stats tracking
            if (!profile.lessonScores) profile.lessonScores = [];
            profile.lessonScores.push({
                lessonTitle: `Placement Test ${level.toUpperCase()}`,
                percentage: pct,
                score: correctCount,
                total: total,
                date: new Date().toLocaleDateString('vi-VN')
            });
            window.saveUserProfile(profile);

            window.logResearchEvent('placement_test_completed', {
                user_id: uid,
                hsk_level: level,
                score: pct,
                correct_answers: correctCount,
                total_questions: total
            });
            if (typeof window.logAnalyticsEvent === 'function') {
                window.logAnalyticsEvent('onboarding_complete', {
                    user_id: uid,
                    hsk_level: level,
                    score: pct,
                    step: 'placement_test'
                });
            }

            const modal = document.getElementById('placementTestModal');
            if (modal) modal.style.display = 'none';

            window.updateUserHeaderUI(profile, user);
            window.renderPersonalizedRecommendation(profile);

            alert(`🎉 Chúc mừng bạn đã hoàn thành Bài Placement Test ${level.toUpperCase()}!\n📊 Kết quả: ${correctCount}/${total} câu đúng (${pct}%).\n\n🚀 Đang tự động chuyển hướng bạn đến Không Gian Học Tập ${level.toUpperCase()}...`);

            // Automatic Routing (Redirect) into the specific HSK Level space displaying 4 content blocks!
            if (typeof window.selectDashboardHskLevel === 'function') {
                window.selectDashboardHskLevel(level);
            }

            const fs = document.getElementById('featuresSection');
            if (fs) {
                fs.style.display = 'block';
                fs.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
            const ca = document.getElementById('contentArea');
            if (ca) ca.classList.remove('show');
            const nav = document.getElementById('hskNavWrapper');
            if (nav) nav.classList.remove('show');
        };

        window.renderPersonalizedRecommendation = function(profile) {
            const container = document.getElementById('personalizedRecommendationContainer');
            if (!container) return;

            if (!profile || !profile.onboardingSurvey) {
                container.style.display = 'none';
                return;
            }

            const survey = profile.onboardingSurvey || {};
            const weakness = survey.baseline_weakness || 'vocab';
            
            // Check saved appState in localStorage as fallback
            let savedAppStateLvl = null;
            try {
                const saved = localStorage.getItem('appState');
                if (saved) {
                    const parsed = JSON.parse(saved);
                    if (parsed && parsed.level) savedAppStateLvl = parsed.level.toLowerCase();
                }
            } catch(e) {}

            const targetHsk = (profile.currentHskLevel || profile.selectedHskLevel || savedAppStateLvl || survey.self_reported_hsk || 'hsk1').toLowerCase();
            const hskLabel = targetHsk.toUpperCase();
            const studentName = profile.name || survey.nickname || 'Bạn';

            // Check Admin Recommendation Mode (Baseline vs Intervention)
            const mode = localStorage.getItem('admin_recommendation_mode') || 'intervention';

            // Sync Dashboard active HSK level to student's HSK level
            if (typeof window.selectDashboardHskLevel === 'function') {
                window.selectDashboardHskLevel(targetHsk);
            }

            if (mode === 'baseline') {
                // Baseline mode: Standard, non-personalized HSK recommendation
                container.innerHTML = `
                    <div style="background: linear-gradient(135deg, #1e293b 0%, #334155 100%); color: white; padding: 22px 26px; border-radius: 20px; box-shadow: 0 10px 25px rgba(0,0,0,0.15); border: 1.5px solid #94a3b8; display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 16px;">
                        <div style="flex: 1; min-width: 280px;">
                            <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 6px;">
                                <span style="background: #64748b; color: white; padding: 3px 10px; border-radius: 12px; font-size: 11.5px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.5px;">📌 CHẾ ĐỘ NỀN MẶC ĐỊNH</span>
                                <span style="background: rgba(255,255,255,0.15); color: #cbd5e1; padding: 3px 10px; border-radius: 12px; font-size: 11.5px; font-weight: 700;">${hskLabel}</span>
                            </div>
                            <h3 style="font-size: 18px; font-weight: 800; color: white; margin: 4px 0 6px 0;">
                                Lộ trình học tập HSK tiêu chuẩn theo thứ tự
                            </h3>
                            <p style="font-size: 13.5px; color: #cbd5e1; margin: 0; line-height: 1.4;">
                                Học tập theo các danh mục Từ vựng, Ngữ pháp, Phát âm và Luyện dịch tiêu chuẩn của ${hskLabel}.
                            </p>
                        </div>
                        <div style="display: flex; gap: 10px; align-items: center;">
                            <button onclick="if(typeof window.showContent==='function') window.showContent('vocab', '${targetHsk}')" style="padding: 11px 20px; background: linear-gradient(135deg, #475569, #334155); color: white; border: 1px solid #94a3b8; border-radius: 12px; font-size: 13.5px; font-weight: 800; cursor: pointer; box-shadow: 0 4px 14px rgba(0,0,0,0.2);">
                                📚 Truy cập bài học
                            </button>
                        </div>
                    </div>
                `;
                container.style.display = 'block';
                return;
            }

            // Intervention Mode: AI Personalized Recommendation targeting student weakness
            const weaknessMap = {
                pronunciation: {
                    code: 'pronunciation',
                    title: 'Phát âm & Thanh điệu',
                    module: 'pronunciation',
                    moduleLabel: 'Luyện Phát Âm',
                    icon: '🔊',
                    desc: 'Tập trung luyện đọc thanh điệu, biến điệu và chuẩn hóa phát âm Pinyin.'
                },
                hanzi: {
                    code: 'hanzi',
                    title: 'Nhớ mặt chữ Hán & Bút thuận',
                    module: 'hanzi',
                    moduleLabel: 'Chữ Hán & Chiết tự',
                    icon: '🀄',
                    desc: 'Luyện tập tra cứu chiết tự, mô phỏng thứ tự nét viết và nhớ bộ thủ.'
                },
                vocab: {
                    code: 'vocab',
                    title: 'Nhớ Từ vựng',
                    module: 'vocab',
                    moduleLabel: 'Từ vựng & Flashcards',
                    icon: '📚',
                    desc: 'Ghi nhớ vốn từ vựng HSK cốt lõi thông qua thẻ Flashcard thông minh.'
                },
                grammar: {
                    code: 'grammar',
                    title: 'Ngữ pháp & Cấu trúc câu',
                    module: 'grammar',
                    moduleLabel: 'Ngữ pháp & So sánh',
                    icon: '📝',
                    desc: 'Nắm vững các mẫu câu, liên từ và phân biệt cặp từ dễ nhầm lẫn.'
                },
                speaking: {
                    code: 'speaking',
                    title: 'Phản xạ Nghe-Nói',
                    module: 'speaking_ai',
                    moduleLabel: 'Luyện nói AI & Shadowing',
                    icon: '🎙️',
                    desc: 'Luyện tập hội thoại tương tác với AI, nghe chép và phát âm nhại giọng.'
                },
                writing: {
                    code: 'writing',
                    title: 'Dịch & Viết',
                    module: 'writing_ai',
                    moduleLabel: 'Luyện viết AI & Dịch',
                    icon: '✍️',
                    desc: 'Luyện tập dịch Việt-Trung và nhận nhận xét, chấm điểm bài viết tự động từ AI.'
                }
            };

            const rec = weaknessMap[weakness] || weaknessMap.vocab;

            container.innerHTML = `
                <div style="background: linear-gradient(135deg, #0f172a 0%, #1e1b4b 100%); color: white; padding: 22px 26px; border-radius: 20px; box-shadow: 0 10px 25px rgba(0,0,0,0.18); border: 1.5px solid #a855f7; display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 16px;">
                    <div style="flex: 1; min-width: 280px;">
                        <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 6px;">
                            <span style="background: #10b981; color: white; padding: 3px 10px; border-radius: 12px; font-size: 11.5px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.5px;">🎯 LỘ TRÌNH ĐỀ XUẤT CÁ NHÂN HÓA (CAN THIỆP AI)</span>
                            <span style="background: rgba(255,255,255,0.15); color: #e9d5ff; padding: 3px 10px; border-radius: 12px; font-size: 11.5px; font-weight: 700;">${hskLabel}</span>
                        </div>
                        <h3 style="font-size: 18px; font-weight: 800; color: white; margin: 4px 0 6px 0; display: flex; align-items: center; gap: 8px; flex-wrap: wrap;">
                            <span>Dành riêng cho ${escapeHtml(studentName)}</span>
                            <span style="color: #cbd5e1; font-weight: 500; font-size: 13.5px;">(Khắc phục điểm yếu: <b style="color: #f472b6;">${rec.title}</b>)</span>
                        </h3>
                        <p style="font-size: 13.5px; color: #cbd5e1; margin: 0; line-height: 1.4;">
                            ${rec.desc} Hãy bắt đầu ngay với <b>Module ${rec.moduleLabel}</b> cấp độ <b>${hskLabel}</b>.
                        </p>
                    </div>

                    <div style="display: flex; gap: 10px; align-items: center; flex-wrap: wrap;">
                        <button onclick="window.acceptRecommendation('${rec.code}', '${rec.module}', '${targetHsk}')" style="padding: 11px 20px; background: linear-gradient(135deg, #ec4899, #db2777); color: white; border: none; border-radius: 12px; font-size: 13.5px; font-weight: 800; cursor: pointer; box-shadow: 0 4px 14px rgba(236,72,153,0.35); display: flex; align-items: center; gap: 6px; transition: all 0.2s;">
                            <span>${rec.icon} Học ngay bây giờ</span>
                        </button>
                        <button onclick="window.skipRecommendation('${rec.code}')" style="padding: 11px 16px; background: rgba(255,255,255,0.1); color: #cbd5e1; border: 1px solid rgba(255,255,255,0.2); border-radius: 12px; font-size: 13px; font-weight: 600; cursor: pointer; transition: all 0.2s;">
                            ✕ Bỏ qua / Tự chọn
                        </button>
                    </div>
                </div>
            `;
            container.style.display = 'block';
        };

        window.acceptRecommendation = function(ruleId, moduleName, targetLevel) {
            window.logResearchEvent('recommendation_clicked', {
                rule_id: ruleId,
                skill_tag: moduleName,
                level: targetLevel
            });

            if (typeof window.showContent === 'function') {
                window.showContent(moduleName, targetLevel);
            }
        };

        window.skipRecommendation = function(ruleId) {
            window.logResearchEvent('recommendation_skipped', {
                rule_id: ruleId
            });

            const container = document.getElementById('personalizedRecommendationContainer');
            if (container) container.style.display = 'none';
        };

        /* AUTH STATE LISTENER WITH ADMIN BYPASS & MANDATORY LOGIN / CONSENT FLOW */
        onAuthStateChanged(auth, async (user) => {
            const loginOverlay = document.getElementById('login-overlay');
            if (user) {
                isGuestMode = false;
                if (loginOverlay) loginOverlay.style.display = 'none';
                
                const userEmail = (user.email || '').toLowerCase().trim();
                let profile = window.getUserProfile(user.uid);
                profile.email = user.email || profile.email;

                // Sync Firestore Data
                if (window.db) {
                    try {
                        const userDocRef = doc(window.db, "users", user.uid);
                        const docSnap = await withTimeout(getDoc(userDocRef), 2500);
                        if (docSnap && docSnap.exists()) {
                            const dbData = docSnap.data();
                            profile = { ...profile, ...dbData, uid: user.uid };
                        }
                    } catch (err) {
                        console.info("Firestore unavailable or timed out. Falling back to LocalStorage mode.");
                        window.db = null;
                    }
                }

                // Calculate Daily Streak
                const today = new Date().toISOString().split('T')[0];
                const lastActive = profile.lastActiveDate;
                if (!lastActive) {
                    profile.streak = 1;
                } else if (lastActive !== today) {
                    const lastDate = new Date(lastActive);
                    const todayDate = new Date(today);
                    const diffDays = Math.round((todayDate - lastDate) / (1000 * 60 * 60 * 24));
                    if (diffDays === 1) {
                        profile.streak = (profile.streak || 0) + 1;
                    } else if (diffDays > 1) {
                        profile.streak = 1;
                    }
                }
                profile.lastActiveDate = today;

                // Rule 2: ADMIN BYPASS MODE
                if (window.isAdminEmail(userEmail)) {
                    profile.role = "admin";
                    profile.isProfileCompleted = true;
                    profile.consentAccepted = true;
                    profile.registered = true;
                    if (!profile.name) profile.name = user.displayName || "Admin XueYing";
                    window.saveUserProfile(profile);

                    // Hide any consent / survey / placement modals
                    const consentModal = document.getElementById('informedConsentModal');
                    if (consentModal) consentModal.style.display = 'none';
                    const surveyModal = document.getElementById('onboardingSurveyModal');
                    if (surveyModal) surveyModal.style.display = 'none';
                    const ptModal = document.getElementById('placementTestModal');
                    if (ptModal) ptModal.style.display = 'none';

                    window.updateUserHeaderUI(profile, user);
                    window.renderPersonalizedRecommendation(profile);
                } else {
                    // Rule 1 & Rule 3: Student Flow
                    window.saveUserProfile(profile);
                    if (!profile.consentAccepted) {
                        window.updateUserHeaderUI(profile, user);
                        const consentModal = document.getElementById('informedConsentModal');
                        if (consentModal) consentModal.style.display = 'flex';
                    } else if (!profile.isProfileCompleted) {
                        window.updateUserHeaderUI(profile, user);
                        if (profile.onboardingSurvey && profile.onboardingSurvey.self_reported_hsk && !profile.placementTestResult) {
                            window.openPlacementTestModal(profile.onboardingSurvey.self_reported_hsk);
                        } else {
                            window.openOnboardingSurveyModal();
                        }
                    } else {
                        window.updateUserHeaderUI(profile, user);
                        window.renderPersonalizedRecommendation(profile);
                    }
                }
                if (typeof window.refreshLearnedStatusUI === 'function') {
                    window.refreshLearnedStatusUI();
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

        // ===== NET ACTIVE STUDY TIMER INTERACTION TRACKER =====
        window.lastUserActivityTime = Date.now();
        ['mousemove', 'mousedown', 'keydown', 'touchstart', 'scroll', 'click'].forEach(evtName => {
            window.addEventListener(evtName, () => {
                window.lastUserActivityTime = Date.now();
            }, { passive: true });
        });

        // Background Active Study Timer Accumulation (10 seconds interval)
        if (!window.activeTimerInterval) {
            window.activeTimerInterval = setInterval(() => {
                const user = (window.auth && window.auth.currentUser) ? window.auth.currentUser : null;
                const uid = user ? user.uid : 'guest';

                // Net Active Study Constraint: Only accumulate timer if user had activity in the last 30 seconds
                const isUserActive = (Date.now() - (window.lastUserActivityTime || 0)) < 30000;

                if (uid && uid !== 'guest' && isUserActive) {
                    const profile = window.getUserProfile(uid);
                    profile.activeTimer = (profile.activeTimer || 0) + 10;
                    localStorage.setItem(window.getProfileKey(uid), JSON.stringify(profile));

                    if (typeof window.updateStreakAndProgressWidget === 'function') {
                        window.updateStreakAndProgressWidget(profile);
                    }

                    if (window.db) {
                        try {
                            const userDocRef = doc(window.db, "users", uid);
                            withTimeout(updateDoc(userDocRef, {
                                activeTimer: profile.activeTimer,
                                updatedAt: new Date().toISOString()
                            }), 2500).catch(() => {
                                window.db = null;
                            });
                        } catch (e) {
                            window.db = null;
                        }
                    }
                }
            }, 10000);
        }

        // =========================================================================
        // ===== SỔ TAY TẬP VIẾT CHỮ HÁN ĐIỆN TỬ (DIGITAL HANZI NOTEBOOK) =====
        // =========================================================================

        window.renderNotebookTab = function(container, profile) {
            if (window.renderNotebookTabCore) {
                return window.renderNotebookTabCore(container, profile);
            }
            const user = (window.auth && window.auth.currentUser) ? window.auth.currentUser : null;
            const uid = user ? user.uid : 'guest';
            
            // Render basic template with optimized CSS variables and layouts
            container.innerHTML = `
                <style>
                @media (min-width: 768px) {
                    .nb-grid-layout {
                        grid-template-columns: 320px 1fr !important;
                    }
                }
                .nb-char-btn {
                    width: 48px;
                    height: 48px;
                    background: white;
                    border: 1.5px solid #e2e8f0;
                    border-radius: 12px;
                    font-family: 'Kaiti', 'SimSun', 'STKaiti', serif, sans-serif;
                    font-size: 24px;
                    font-weight: 800;
                    color: #1e293b;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    cursor: pointer;
                    transition: all 0.15s ease;
                    user-select: none;
                    outline: none;
                }
                .nb-char-btn:hover {
                    border-color: #ec4899;
                    background: #fff5f9;
                    transform: translateY(-2px);
                }
                .nb-char-btn.active {
                    background: #be185d;
                    color: white;
                    border-color: #be185d;
                    box-shadow: 0 4px 10px rgba(190,24,93,0.3);
                }
                .nb-color-btn.active {
                    border-color: #ec4899 !important;
                    transform: scale(1.15);
                    box-shadow: 0 0 8px rgba(236,72,153,0.4);
                }
                .nb-stroke-badge {
                    background: white;
                    border: 1px solid #fbcfe8;
                    color: #be185d;
                    font-size: 11.5px;
                    font-weight: 700;
                    padding: 4px 10px;
                    border-radius: 18px;
                    display: inline-flex;
                    align-items: center;
                    gap: 4px;
                    box-shadow: 0 1px 3px rgba(0,0,0,0.02);
                    transition: all 0.2s ease;
                }
                .nb-stroke-badge.active {
                    background: #be185d;
                    color: white;
                    border-color: #be185d;
                    box-shadow: 0 3px 6px rgba(190,24,93,0.2);
                }
                .nb-gallery-card {
                    background: white;
                    border-radius: 14px;
                    border: 1.5px solid #e2e8f0;
                    overflow: hidden;
                    position: relative;
                    box-shadow: 0 2px 4px rgba(0,0,0,0.02);
                    transition: all 0.2s ease;
                    cursor: pointer;
                    display: flex;
                    flex-direction: column;
                }
                .nb-gallery-card:hover {
                    transform: translateY(-4px);
                    box-shadow: 0 8px 16px rgba(0,0,0,0.06);
                    border-color: #fbcfe8;
                }
                .nb-subtab-btn {
                    flex: 1; 
                    padding: 10px; 
                    border: none; 
                    background: transparent; 
                    border-radius: 8px; 
                    font-size: 13px; 
                    font-weight: 700; 
                    color: #475569; 
                    cursor: pointer; 
                    transition: all 0.2s;
                    outline: none;
                }
                .nb-subtab-btn.active {
                    background: white; 
                    color: #be185d; 
                    font-weight: 800;
                    box-shadow: 0 2px 6px rgba(0,0,0,0.04);
                }
                </style>

                <div class="notebook-wrapper" style="display:flex; flex-direction:column; gap:20px; font-family:'Lexend',sans-serif; color:#334155; width:100%; box-sizing:border-box;">
                    
                    <!-- 1. BRANDED FIXED CANVAS HEADER -->
                    <div style="background: linear-gradient(135deg, #be185d, #db2777); color:white; padding:18px 24px; border-radius:18px; box-shadow:0 8px 20px rgba(190,24,93,0.15); display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:16px;">
                        <div style="display:flex; align-items:center; gap:16px;">
                            <div style="background: rgba(255,255,255,0.15); padding:8px 12px; border-radius:12px; border:1px solid rgba(255,255,255,0.2); text-align:center;">
                                <span style="font-size:16px; font-weight:800; letter-spacing:1px; display:block; font-family:'Lexend',sans-serif;">学赢中文</span>
                                <span style="font-size:9px; opacity:0.8; font-weight:600; text-transform:uppercase; display:block; margin-top:2px;">Xueying Zhongwen</span>
                            </div>
                            <div style="height:40px; width:1px; background:rgba(255,255,255,0.3);"></div>
                            <div>
                                <div style="display:flex; align-items:center; gap:8px;">
                                    <span style="font-size:16px; font-weight:800;" id="nb-user-name">Học Viên</span>
                                    <span style="background:white; color:#be185d; font-size:11px; font-weight:800; padding:2px 8px; border-radius:12px;" id="nb-hsk-level">HSK --</span>
                                </div>
                                <div style="font-size:12px; opacity:0.9; margin-top:4px;" id="nb-datetime">
                                    📅 Ngày luyện tập: --
                                </div>
                            </div>
                        </div>
                        <div style="background: rgba(255,255,255,0.2); padding:8px 16px; border-radius:12px; border:1px solid rgba(255,255,255,0.25); text-align:right;">
                            <div style="font-size:11px; font-weight:700; text-transform:uppercase; opacity:0.8; font-family:'Lexend',sans-serif;">Tổng chữ đã viết</div>
                            <div style="font-size:24px; font-weight:900;" id="nb-total-stats">0</div>
                        </div>
                    </div>

                    <!-- 2. MAIN LAYOUT: Split into Left (Canvas) and Right (Materials & Gallery) -->
                    <div style="display:grid; grid-template-columns: 1fr; gap:24px; width:100%; box-sizing:border-box;" class="nb-grid-layout">
                        
                        <!-- LEFT: DRAWING CANVAS & DETAILS -->
                        <div style="display:flex; flex-direction:column; gap:16px; align-items:center; width:100%;">
                            
                            <!-- CANVAS CONTAINER FRAME -->
                            <div style="position:relative; width:304px; height:304px; background:#fff; border-radius:18px; box-shadow:0 10px 30px rgba(0,0,0,0.06); border:2px solid #fecdd3; overflow:hidden;" id="mizige-frame">
                                <!-- Grid background lines canvas -->
                                <canvas id="nb-grid-canvas" width="300" height="300" style="position:absolute; top:2px; left:2px; z-index:1; pointer-events:none;"></canvas>
                                <!-- Stroke character guide in background -->
                                <div id="nb-stroke-guide" style="position:absolute; top:2px; left:2px; width:300px; height:300px; display:flex; align-items:center; justify-content:center; font-family:'Kaiti', 'SimSun', 'STKaiti', serif, sans-serif; font-size:180px; color:#94a3b8; opacity:0.25; z-index:2; pointer-events:none; user-select:none; line-height:300px; text-align:center;">我</div>
                                <!-- Interactive Drawing Canvas -->
                                <canvas id="nb-draw-canvas" width="300" height="300" style="position:absolute; top:2px; left:2px; z-index:3; cursor:crosshair; touch-action:none; background:transparent;"></canvas>
                            </div>

                            <!-- CANVAS TOOLBAR CONTROLS -->
                            <div style="width:100%; max-width:304px; background:white; padding:12px; border-radius:14px; border:1px solid #fce7f3; box-shadow:0 4px 12px rgba(0,0,0,0.02); display:flex; flex-direction:column; gap:12px;">
                                <!-- Color Selector & Stroke Guide -->
                                <div style="display:flex; justify-content:space-between; align-items:center;">
                                    <div style="display:flex; gap:8px; align-items:center;">
                                        <span style="font-size:11px; font-weight:700; color:#64748b; text-transform:uppercase; font-family:'Lexend',sans-serif;">Nét bút:</span>
                                        <button class="nb-color-btn active" data-color="#000000" style="width:24px; height:24px; border-radius:50%; border:2px solid #e2e8f0; background:#000; cursor:pointer; padding:0; transition:all 0.15s; outline:none;" id="nbColor-black"></button>
                                        <button class="nb-color-btn" data-color="#dc2626" style="width:24px; height:24px; border-radius:50%; border:2px solid transparent; background:#dc2626; cursor:pointer; padding:0; transition:all 0.15s; outline:none;" id="nbColor-red"></button>
                                        <button class="nb-color-btn" data-color="#2563eb" style="width:24px; height:24px; border-radius:50%; border:2px solid transparent; background:#2563eb; cursor:pointer; padding:0; transition:all 0.15s; outline:none;" id="nbColor-blue"></button>
                                    </div>
                                    <div>
                                        <button id="nb-toggle-guide-btn" style="background:#f1f5f9; border:none; color:#475569; font-size:11px; font-weight:700; padding:4px 8px; border-radius:8px; cursor:pointer; transition:all 0.2s; outline:none; font-family:'Lexend',sans-serif;">Ẩn nét mờ</button>
                                    </div>
                                </div>

                                <!-- Action Button Grid -->
                                <div style="display:grid; grid-template-columns: 1fr 1fr; gap:8px;">
                                    <button id="nb-undo-btn" style="padding:8px; background:#f8fafc; border:1px solid #e2e8f0; border-radius:10px; font-size:12px; font-weight:700; color:#475569; cursor:pointer; display:flex; align-items:center; justify-content:center; gap:6px; transition:all 0.2s; outline:none; font-family:'Lexend',sans-serif;">
                                        ↩️ Hoàn tác
                                    </button>
                                    <button id="nb-clear-btn" style="padding:8px; background:#fef2f2; border:1px solid #fecdd3; border-radius:10px; font-size:12px; font-weight:700; color:#dc2626; cursor:pointer; display:flex; align-items:center; justify-content:center; gap:6px; transition:all 0.2s; outline:none; font-family:'Lexend',sans-serif;">
                                        🗑️ Xóa ô
                                    </button>
                                </div>

                                <div style="display:grid; grid-template-columns: 1fr 1fr; gap:8px;">
                                    <button id="nb-demo-btn" style="padding:10px; background:#faf5ff; border:1px solid #e9d5ff; border-radius:10px; font-size:12px; font-weight:800; color:#7e22ce; cursor:pointer; display:flex; align-items:center; justify-content:center; gap:6px; transition:all 0.2s; outline:none; font-family:'Lexend',sans-serif;">
                                        👁️ Mẫu Bút Thuận
                                    </button>
                                    <button id="nb-save-btn" style="padding:10px; background:linear-gradient(135deg, #10b981, #059669); border:none; border-radius:10px; font-size:12px; font-weight:800; color:white; cursor:pointer; display:flex; align-items:center; justify-content:center; gap:6px; box-shadow:0 3px 10px rgba(16,185,129,0.25); transition:all 0.2s; outline:none; font-family:'Lexend',sans-serif;">
                                        💾 Lưu vào Vở
                                    </button>
                                </div>
                            </div>

                            <!-- CHARACTER INFO PANEL -->
                            <div style="width:100%; max-width:304px; background:#fdf2f8; padding:16px; border-radius:16px; border:1px solid #fbcfe8; display:flex; flex-direction:column; gap:10px;" id="nb-char-info">
                                <div style="display:flex; justify-content:space-between; align-items:baseline;">
                                    <span style="font-size:28px; font-weight:900; color:#be185d; font-family:'Kaiti', serif;" id="nbInfo-char">我</span>
                                    <span style="font-size:16px; font-weight:700; color:#db2777;" id="nbInfo-pinyin">wǒ</span>
                                </div>
                                <div style="height:1px; background:#fbcfe8; width:100%;"></div>
                                <div style="font-size:13px; line-height:1.4; color:#334155;">
                                    <div><strong>Nghĩa:</strong> <span id="nbInfo-meaning" style="font-weight:600;">Tôi, ta, bản thân</span></div>
                                    <div style="margin-top:6px;"><strong>Bộ thủ:</strong> <span id="nbInfo-radical">戈 (Qua)</span></div>
                                    <div style="margin-top:6px;"><strong>Cấu trúc:</strong> <span id="nbInfo-structure">Độc thể</span></div>
                                    <div style="margin-top:6px;"><strong>Số nét:</strong> <span id="nbInfo-strokes">7 nét</span></div>
                                </div>
                                <div style="background:white; padding:10px; border-radius:10px; border:1px solid #fce7f3; font-size:11.5px; color:#475569; line-height:1.4; margin-top:4px;" id="nbInfo-story">
                                    Mẹo nhớ: Chữ 我 gồm bộ 手 (Tay) ghép với bộ 戈 (Qua - vũ khí thương), cầm binh khí để bảo vệ "bản thân" mình.
                                </div>
                            </div>

                        </div>

                        <!-- RIGHT: SELECTOR & WORKBOOK GALLERY -->
                        <div style="display:flex; flex-direction:column; gap:20px; min-height:0; width:100%;">
                            
                            <!-- GALLERY/SELECTOR TAB CONTROLS -->
                            <div style="display:flex; background:#f1f5f9; padding:4px; border-radius:12px; gap:4px; flex-shrink:0;">
                                <button id="nbSubTab-select" class="nb-subtab-btn active">
                                    🀄 Chọn Chữ Hán
                                </button>
                                <button id="nbSubTab-gallery" class="nb-subtab-btn">
                                    📓 Vở Ghi Chép Điện Tử
                                </button>
                            </div>

                            <!-- SUB-TAB CONTENT 1: CHOOSE HANZI -->
                            <div id="nbContent-select" class="nb-subtab-content" style="display:flex; flex-direction:column; gap:16px;">
                                <!-- Filter bar -->
                                <div style="display:grid; grid-template-columns: 1fr 1.2fr; gap:12px; align-items:center; background:white; padding:12px; border-radius:14px; border:1px solid #e2e8f0;">
                                    <div>
                                        <label style="display:block; font-size:11px; font-weight:700; color:#64748b; text-transform:uppercase; margin-bottom:4px; font-family:'Lexend',sans-serif;">Nguồn chữ:</label>
                                        <select id="nb-source-select" style="width:100%; padding:8px; border:1px solid #cbd5e1; border-radius:8px; font-size:13px; outline:none; font-weight:600; color:#334155; background:white; cursor:pointer;">
                                            <option value="hsk1">Chữ Hán HSK 1</option>
                                            <option value="hsk2">Chữ Hán HSK 2</option>
                                            <option value="mistakes">Từ làm sai & Flashcard</option>
                                            <option value="custom">Nhập từ bàn phím</option>
                                        </select>
                                    </div>
                                    <div id="nb-filter-lesson-container">
                                        <label style="display:block; font-size:11px; font-weight:700; color:#64748b; text-transform:uppercase; margin-bottom:4px; font-family:'Lexend',sans-serif;">Bài học:</label>
                                        <select id="nb-lesson-select" style="width:100%; padding:8px; border:1px solid #cbd5e1; border-radius:8px; font-size:13px; outline:none; font-weight:600; color:#334155; background:white; cursor:pointer;">
                                            <!-- populated dynamically -->
                                        </select>
                                    </div>
                                    <div id="nb-custom-input-container" style="display:none; width:100%;">
                                        <label style="display:block; font-size:11px; font-weight:700; color:#64748b; text-transform:uppercase; margin-bottom:4px; font-family:'Lexend',sans-serif;">Nhập chữ Hán tự do:</label>
                                        <div style="display:flex; gap:6px;">
                                            <input type="text" id="nb-custom-input" placeholder="Ví dụ: 爱" maxlength="10" style="width:100%; padding:8px 12px; border:1px solid #cbd5e1; border-radius:8px; font-size:13px; outline:none; font-weight:700; color:#334155;" />
                                            <button id="nb-custom-apply-btn" style="padding:8px 12px; background:#be185d; color:white; border:none; border-radius:8px; font-size:12px; font-weight:700; cursor:pointer; outline:none; font-family:'Lexend',sans-serif;">Dùng</button>
                                        </div>
                                    </div>
                                </div>

                                <!-- Character Selection Grid -->
                                <div style="background:white; padding:16px; border-radius:16px; border:1px solid #e2e8f0; min-height:220px; display:flex; flex-direction:column; gap:12px;">
                                    <div style="display:flex; justify-content:space-between; align-items:center;">
                                        <span style="font-size:13px; font-weight:700; color:#475569;" id="nb-grid-title">Danh Sách Chữ Hán:</span>
                                        <span style="font-size:11px; font-weight:600; color:#94a3b8;" id="nb-grid-count">0 chữ</span>
                                    </div>
                                    <!-- Loading state -->
                                    <div id="nb-grid-loading" style="display:none; text-align:center; padding:40px; color:#64748b;">
                                        <div style="font-size:24px; animation: spin 1s linear infinite; display:inline-block; margin-bottom:8px;">⌛</div>
                                        <div style="font-size:13px;">Đang tải dữ liệu chữ Hán...</div>
                                    </div>
                                    <!-- Empty state -->
                                    <div id="nb-grid-empty" style="display:none; text-align:center; padding:40px; color:#64748b;">
                                        <div style="font-size:32px; margin-bottom:8px;">📭</div>
                                        <div style="font-size:13px; font-weight:600;">Không có chữ Hán nào</div>
                                    </div>
                                    <!-- Characters Box -->
                                    <div id="nb-grid-chars" style="display:grid; grid-template-columns: repeat(auto-fill, minmax(48px, 1fr)); gap:8px; max-height:260px; overflow-y:auto; padding-right:4px;">
                                        <!-- characters buttons populated here -->
                                    </div>
                                </div>

                                <!-- Stroke Order Steps display -->
                                <div style="background:#f8fafc; border-radius:14px; padding:14px; border:1px solid #e2e8f0;" id="nb-stroke-names-panel">
                                    <h5 style="margin:0 0 10px 0; font-size:12.5px; font-weight:800; color:#475569; text-transform:uppercase; display:flex; align-items:center; gap:6px; font-family:'Lexend',sans-serif;">
                                        📝 Thứ Tự Viết Nét Chữ (Bút Thuận):
                                    </h5>
                                    <div id="nb-stroke-badges-container" style="display:flex; flex-wrap:wrap; gap:6px;">
                                        <!-- dynamically populated stroke names -->
                                    </div>
                                </div>
                            </div>

                            <!-- SUB-TAB CONTENT 2: DIGITAL NOTEBOOK GALLERY -->
                            <div id="nbContent-gallery" class="nb-subtab-content" style="display:none; flex-direction:column; gap:16px;">
                                <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:8px;">
                                    <span style="font-size:13.5px; font-weight:800; color:#334155; font-family:'Lexend',sans-serif;">Thư viện trang chữ đã viết</span>
                                    <button id="nb-clear-gallery-btn" style="background:#fff1f2; border:none; color:#e11d48; font-size:11px; font-weight:700; padding:4px 8px; border-radius:8px; cursor:pointer; outline:none; font-family:'Lexend',sans-serif;">🗑️ Xóa hết vở</button>
                                </div>

                                <!-- Gallery Empty State -->
                                <div id="nb-gallery-empty" style="text-align:center; padding:60px 20px; background:white; border-radius:18px; border:1px dashed #cbd5e1; color:#64748b;">
                                    <div style="font-size:48px; margin-bottom:12px;">📓</div>
                                    <h4 style="font-size:14.5px; color:#334155; margin-bottom:6px; font-weight:700;">Vở Ghi Chép Của Bạn Còn Trống</h4>
                                    <p style="font-size:12px; line-height:1.4; max-width:320px; margin:0 auto;">Chọn một chữ Hán, tập viết trực tiếp lên bảng vẽ bên trái và nhấn "Lưu vào Vở" để ghi lại thành quả học tập nhé!</p>
                                </div>

                                <!-- Gallery Items Grid -->
                                <div id="nb-gallery-grid" style="display:grid; grid-template-columns: repeat(auto-fill, minmax(120px, 1fr)); gap:12px; max-height:460px; overflow-y:auto; padding-right:4px;">
                                    <!-- populated dynamically -->
                                </div>
                            </div>

                        </div>

                    </div>
                </div>
            `;
            
            // Wait for DOM to load, then initialize everything
            setTimeout(() => {
                window.initNotebookLogic(uid, profile);
            }, 60);
        };

        window.initNotebookLogic = function(uid, profile) {
            // Set user profile headers
            const userNameSpan = document.getElementById('nb-user-name');
            if (userNameSpan) userNameSpan.textContent = profile.name || 'Học Viên';
            const hskLevelSpan = document.getElementById('nb-hsk-level');
            if (hskLevelSpan) hskLevelSpan.textContent = 'HSK ' + (profile.currentHskLevel || '1');
            
            // Set date & time
            const datetimeSpan = document.getElementById('nb-datetime');
            if (datetimeSpan) {
                const now = new Date();
                const dStr = now.toLocaleDateString('vi-VN', { weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric' });
                datetimeSpan.textContent = `📅 Luyện tập: ${dStr}`;
            }

            // Canvas initialization
            const drawCanvas = document.getElementById('nb-draw-canvas');
            const gridCanvas = document.getElementById('nb-grid-canvas');
            if (!drawCanvas || !gridCanvas) return;
            
            const drawCtx = drawCanvas.getContext('2d');
            const gridCtx = gridCanvas.getContext('2d');
            
            // Draw Mizige on grid canvas
            window.drawMizige = function(ctx, w, h) {
                ctx.clearRect(0, 0, w, h);
                ctx.strokeStyle = '#fca5a5'; // Soft red
                ctx.lineWidth = 1.5;
                
                // Outer red box
                ctx.strokeRect(0, 0, w, h);
                
                // Cross lines dashed
                ctx.strokeStyle = '#fda4af';
                ctx.setLineDash([5, 5]);
                ctx.beginPath();
                ctx.moveTo(w / 2, 0);
                ctx.lineTo(w / 2, h);
                ctx.moveTo(0, h / 2);
                ctx.lineTo(w, h / 2);
                ctx.stroke();
                
                // Diagonal lines dashed
                ctx.beginPath();
                ctx.moveTo(0, 0);
                ctx.lineTo(w, h);
                ctx.moveTo(w, 0);
                ctx.lineTo(0, h);
                ctx.stroke();
                
                ctx.setLineDash([]); // reset
            };
            
            window.drawMizige(gridCtx, gridCanvas.width, gridCanvas.height);

            // Drawing State
            window.notebookStrokes = [];
            let isDrawing = false;
            let currentPenColor = '#000000';

            // Get Coordinates Helper
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

            // Redraw drawing canvas function
            window.redrawNotebookCanvas = function() {
                drawCtx.clearRect(0, 0, drawCanvas.width, drawCanvas.height);
                drawCtx.lineCap = 'round';
                drawCtx.lineJoin = 'round';
                drawCtx.lineWidth = 6;
                
                window.notebookStrokes.forEach(stroke => {
                    if (stroke.length < 1) return;
                    drawCtx.strokeStyle = stroke[0].color || '#000000';
                    drawCtx.beginPath();
                    drawCtx.moveTo(stroke[0].x, stroke[0].y);
                    for (let i = 1; i < stroke.length; i++) {
                        drawCtx.lineTo(stroke[i].x, stroke[i].y);
                    }
                    drawCtx.stroke();
                });
            };

            // Drawing Listeners (Mouse)
            drawCanvas.onmousedown = function(e) {
                isDrawing = true;
                const pt = getCoords(e, drawCanvas);
                window.notebookStrokes.push([{ x: pt.x, y: pt.y, color: currentPenColor }]);
                window.redrawNotebookCanvas();
            };

            drawCanvas.onmousemove = function(e) {
                if (!isDrawing) return;
                const pt = getCoords(e, drawCanvas);
                const activeStroke = window.notebookStrokes[window.notebookStrokes.length - 1];
                if (activeStroke) {
                    activeStroke.push({ x: pt.x, y: pt.y });
                    window.redrawNotebookCanvas();
                }
            };

            const endDrawing = function() {
                isDrawing = false;
            };
            drawCanvas.onmouseup = endDrawing;
            drawCanvas.onmouseleave = endDrawing;

            // Touch Listeners
            drawCanvas.ontouchstart = function(e) {
                e.preventDefault();
                isDrawing = true;
                const pt = getCoords(e, drawCanvas);
                window.notebookStrokes.push([{ x: pt.x, y: pt.y, color: currentPenColor }]);
                window.redrawNotebookCanvas();
            };

            drawCanvas.ontouchmove = function(e) {
                e.preventDefault();
                if (!isDrawing) return;
                const pt = getCoords(e, drawCanvas);
                const activeStroke = window.notebookStrokes[window.notebookStrokes.length - 1];
                if (activeStroke) {
                    activeStroke.push({ x: pt.x, y: pt.y });
                    window.redrawNotebookCanvas();
                }
            };

            drawCanvas.ontouchend = function(e) {
                e.preventDefault();
                endDrawing();
            };

            // Hook up Color Selectors
            const colorButtons = document.querySelectorAll('.nb-color-btn');
            colorButtons.forEach(btn => {
                btn.onclick = () => {
                    colorButtons.forEach(b => {
                        b.classList.remove('active');
                    });
                    btn.classList.add('active');
                    currentPenColor = btn.getAttribute('data-color');
                };
            });

            // Undo & Clear Button
            const undoBtn = document.getElementById('nb-undo-btn');
            if (undoBtn) {
                undoBtn.onclick = () => {
                    window.notebookStrokes.pop();
                    window.redrawNotebookCanvas();
                };
            }

            const clearBtn = document.getElementById('nb-clear-btn');
            if (clearBtn) {
                clearBtn.onclick = () => {
                    window.notebookStrokes = [];
                    window.redrawNotebookCanvas();
                };
            }

            // Toggle Guide Button
            const toggleGuideBtn = document.getElementById('nb-toggle-guide-btn');
            const guideDiv = document.getElementById('nb-stroke-guide');
            if (toggleGuideBtn && guideDiv) {
                toggleGuideBtn.onclick = () => {
                    if (guideDiv.style.display === 'none') {
                        guideDiv.style.display = 'flex';
                        toggleGuideBtn.textContent = 'Ẩn nét mờ';
                        toggleGuideBtn.style.background = '#f1f5f9';
                        toggleGuideBtn.style.color = '#475569';
                    } else {
                        guideDiv.style.display = 'none';
                        toggleGuideBtn.textContent = 'Hiện nét mờ';
                        toggleGuideBtn.style.background = '#be185d';
                        toggleGuideBtn.style.color = 'white';
                    }
                };
            }

            // Sub Tab switching logic
            const tabSelect = document.getElementById('nbSubTab-select');
            const tabGallery = document.getElementById('nbSubTab-gallery');
            const contentSelect = document.getElementById('nbContent-select');
            const contentGallery = document.getElementById('nbContent-gallery');

            if (tabSelect && tabGallery && contentSelect && contentGallery) {
                tabSelect.onclick = () => {
                    tabSelect.classList.add('active');
                    tabGallery.classList.remove('active');
                    contentSelect.style.display = 'flex';
                    contentGallery.style.display = 'none';
                };
                tabGallery.onclick = () => {
                    tabGallery.classList.add('active');
                    tabSelect.classList.remove('active');
                    contentGallery.style.display = 'flex';
                    contentSelect.style.display = 'none';
                    window.renderNotebookGallery();
                };
            }

            // Load character selector sources
            const sourceSelect = document.getElementById('nb-source-select');
            const lessonSelect = document.getElementById('nb-lesson-select');
            const customInput = document.getElementById('nb-custom-input');
            const customApplyBtn = document.getElementById('nb-custom-apply-btn');

            if (sourceSelect) {
                sourceSelect.onchange = () => {
                    window.loadNotebookSource(sourceSelect.value);
                };
            }

            if (lessonSelect) {
                lessonSelect.onchange = () => {
                    window.filterCharactersByLesson(lessonSelect.value);
                };
            }

            if (customApplyBtn && customInput) {
                customApplyBtn.onclick = () => {
                    const txt = customInput.value.trim();
                    if (txt.length === 0) return;
                    
                    const chars = [];
                    for (let i = 0; i < txt.length; i++) {
                        const code = txt.charCodeAt(i);
                        // Filter standard CJK characters
                        if (code >= 0x4e00 && code <= 0x9fa5) {
                            chars.push(txt[i]);
                        }
                    }
                    if (chars.length === 0) {
                        alert('Vui lòng chỉ nhập các chữ Hán hợp lệ!');
                        return;
                    }
                    window.renderCharacterGrid(chars);
                };
                customInput.onkeydown = (e) => {
                    if (e.key === 'Enter') customApplyBtn.click();
                };
            }

            // Load Gallery on init
            window.renderNotebookGallery();

            // Load first source HSK 1
            window.loadNotebookSource('hsk1');

            // Hook up Save button
            const saveBtn = document.getElementById('nb-save-btn');
            if (saveBtn) {
                saveBtn.onclick = () => {
                    window.saveNotebookCharacter();
                };
            }

            // Clear Notebook Gallery Button
            const clearGalleryBtn = document.getElementById('nb-clear-gallery-btn');
            if (clearGalleryBtn) {
                clearGalleryBtn.onclick = () => {
                    if (confirm('⚠️ Bạn có chắc chắn muốn XÓA TOÀN BỘ vở ghi chép tập viết không? Hành động này không thể hoàn tác.')) {
                        const nbKey = 'xueying_hanzi_notebook_' + uid;
                        localStorage.removeItem(nbKey);
                        window.renderNotebookGallery();
                    }
                };
            }

            // Hook up Demo Button (Xem Mẫu Bút Thuận)
            const demoBtn = document.getElementById('nb-demo-btn');
            if (demoBtn) {
                demoBtn.onclick = () => {
                    window.runStrokeDemo();
                };
            }
        };

        // --- SOURCE LOADING LOGIC ---
        window.loadHanziData = async function(level) {
            if (window.cachedHanziData && window.cachedHanziData[level]) {
                return window.cachedHanziData[level];
            }
            window.cachedHanziData = window.cachedHanziData || {};
            try {
                const response = await fetch(`./data/hanzi/${level}.json`);
                const data = await response.json();
                window.cachedHanziData[level] = data;
                return data;
            } catch (e) {
                console.error('Error loading Hanzi data:', e);
                return [];
            }
        };

        window.loadNotebookSource = async function(source) {
            const user = (window.auth && window.auth.currentUser) ? window.auth.currentUser : null;
            const uid = user ? user.uid : 'guest';
            
            const gridLoading = document.getElementById('nb-grid-loading');
            const gridEmpty = document.getElementById('nb-grid-empty');
            const gridChars = document.getElementById('nb-grid-chars');
            const lessonContainer = document.getElementById('nb-filter-lesson-container');
            const customContainer = document.getElementById('nb-custom-input-container');
            const lessonSelect = document.getElementById('nb-lesson-select');
            
            if (!gridChars) return;
            
            gridChars.innerHTML = '';
            gridLoading.style.display = 'block';
            gridEmpty.style.display = 'none';
            
            if (source === 'custom') {
                if (lessonContainer) lessonContainer.style.display = 'none';
                if (customContainer) customContainer.style.display = 'block';
                gridLoading.style.display = 'none';
                
                const basics = ['我', '你', '他', '她', '它', '是', '好', '爱', '天', '地', '人', '山', '水', '火', '风'];
                window.renderCharacterGrid(basics);
                return;
            }
            
            if (lessonContainer) lessonContainer.style.display = 'block';
            if (customContainer) customContainer.style.display = 'none';
            
            if (source === 'mistakes') {
                const profile = window.getUserProfile(uid);
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
                gridLoading.style.display = 'none';
                
                if (chars.length === 0) {
                    gridEmpty.style.display = 'block';
                    const countSpan = document.getElementById('nb-grid-count');
                    if (countSpan) countSpan.textContent = '0 chữ';
                    window.renderCharacterGrid(['我', '你', '好', '是', '国', '中', '学', '习']);
                } else {
                    window.renderCharacterGrid(chars);
                }
                return;
            }
            
            // HSK1 and HSK2
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
                    
                    if (sortedLessons.length > 0) {
                        lessonSelect.value = sortedLessons[0];
                        window.filterCharactersByLesson(sortedLessons[0]);
                    } else {
                        gridLoading.style.display = 'none';
                        gridEmpty.style.display = 'block';
                    }
                }
                
            } catch (e) {
                console.error('Error loading source:', e);
                gridLoading.style.display = 'none';
                gridEmpty.style.display = 'block';
            }
        };

        window.filterCharactersByLesson = function(lessonNum) {
            const data = window.currentLevelHanziData || [];
            const filtered = data.filter(item => item.lessons && item.lessons.includes(parseInt(lessonNum, 10)));
            const charStrings = filtered.map(item => item.hanzi);
            window.renderCharacterGrid(charStrings, filtered);
        };

        window.renderCharacterGrid = function(charsList, fullObjectsList = []) {
            const gridLoading = document.getElementById('nb-grid-loading');
            const gridEmpty = document.getElementById('nb-grid-empty');
            const gridChars = document.getElementById('nb-grid-chars');
            const countSpan = document.getElementById('nb-grid-count');
            
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
                btn.className = 'nb-char-btn';
                btn.textContent = char;
                btn.onclick = () => {
                    document.querySelectorAll('.nb-char-btn').forEach(b => b.classList.remove('active'));
                    btn.classList.add('active');
                    window.selectNotebookCharacter(char, fullObjectsList.find(o => o.hanzi === char));
                };
                gridChars.appendChild(btn);
            });
            
            // Select first character
            if (gridChars.firstChild) {
                gridChars.firstChild.click();
            }
        };

        window.selectNotebookCharacter = async function(char, optObject) {
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
                        story: 'Tập viết chữ Hán giúp ghi nhớ hình khối cấu trúc mặt chữ và tăng phản xạ ngôn ngữ hiệu quả!'
                    };
                }
            }
            
            window.currentNotebookCharacter = details;
            
            const guideDiv = document.getElementById('nb-stroke-guide');
            if (guideDiv) {
                guideDiv.textContent = char;
            }
            
            const infoChar = document.getElementById('nbInfo-char');
            if (infoChar) infoChar.textContent = details.hanzi;
            const infoPinyin = document.getElementById('nbInfo-pinyin');
            if (infoPinyin) infoPinyin.textContent = details.pinyin || '';
            const infoMeaning = document.getElementById('nbInfo-meaning');
            if (infoMeaning) infoMeaning.textContent = details.meaning || '';
            const infoRadical = document.getElementById('nbInfo-radical');
            if (infoRadical) infoRadical.textContent = (details.radical || '--') + (details.radical_vietnamese ? ` (${details.radical_vietnamese})` : '');
            const infoStructure = document.getElementById('nbInfo-structure');
            if (infoStructure) infoStructure.textContent = details.structure || 'Liên kết';
            const infoStrokes = document.getElementById('nbInfo-strokes');
            if (infoStrokes) infoStrokes.textContent = (details.strokes || '--') + ' nét';
            const infoStory = document.getElementById('nbInfo-story');
            if (infoStory) infoStory.textContent = details.story || 'Hãy tập viết đều đặn để nét bút mềm mại!';
            
            window.stopStrokeDemo();
            
            const badgesContainer = document.getElementById('nb-stroke-badges-container');
            if (badgesContainer) {
                badgesContainer.innerHTML = '';
                const order = details.stroke_order || [];
                
                if (order.length === 0) {
                    badgesContainer.innerHTML = '<span style="font-size:11.5px;color:#94a3b8;font-style:italic;">Chưa có dữ liệu thứ tự nét cho chữ này. Sử dụng "Mẫu Bút Thuận" để xem mô phỏng viết nét cơ bản.</span>';
                } else {
                    order.forEach((st, idx) => {
                        const b = document.createElement('span');
                        b.className = 'nb-stroke-badge';
                        b.id = `nbStrokeBadge-${idx}`;
                        const trans = window.getStrokeNameVietnamese(st);
                        b.innerHTML = `<strong>${idx + 1}</strong>. ${trans}`;
                        badgesContainer.appendChild(b);
                    });
                }
            }
            
            window.notebookStrokes = [];
            window.redrawNotebookCanvas();
        };

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

        // --- STROKE ORDER DEMO SIMULATOR ---
        let strokeDemoInterval = null;
        let strokeDemoIndex = -1;

        window.stopStrokeDemo = function() {
            if (strokeDemoInterval) {
                clearInterval(strokeDemoInterval);
                strokeDemoInterval = null;
            }
            strokeDemoIndex = -1;
            
            const gridCanvas = document.getElementById('nb-grid-canvas');
            if (gridCanvas) {
                const ctx = gridCanvas.getContext('2d');
                window.drawMizige(ctx, gridCanvas.width, gridCanvas.height);
            }
            
            document.querySelectorAll('.nb-stroke-badge').forEach(b => b.classList.remove('active'));
        };

        window.runStrokeDemo = function() {
            window.stopStrokeDemo();
            
            const details = window.currentNotebookCharacter;
            if (!details || !details.stroke_order || details.stroke_order.length === 0) {
                window.runGeneralStrokesDemo();
                return;
            }
            
            const order = details.stroke_order;
            strokeDemoIndex = 0;
            
            const gridCanvas = document.getElementById('nb-grid-canvas');
            if (!gridCanvas) return;
            const ctx = gridCanvas.getContext('2d');
            
            window.highlightStrokeBadge(0);
            window.drawStrokeArrow(ctx, order[0]);
            
            strokeDemoInterval = setInterval(() => {
                strokeDemoIndex++;
                if (strokeDemoIndex >= order.length) {
                    clearInterval(strokeDemoInterval);
                    strokeDemoInterval = null;
                    setTimeout(() => {
                        window.stopStrokeDemo();
                    }, 1500);
                    return;
                }
                
                window.drawMizige(ctx, gridCanvas.width, gridCanvas.height);
                window.highlightStrokeBadge(strokeDemoIndex);
                window.drawStrokeArrow(ctx, order[strokeDemoIndex]);
            }, 1800);
        };

        window.highlightStrokeBadge = function(index) {
            document.querySelectorAll('.nb-stroke-badge').forEach(b => b.classList.remove('active'));
            const b = document.getElementById(`nbStrokeBadge-${index}`);
            if (b) {
                b.classList.add('active');
                b.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'nearest' });
            }
        };

        window.drawStrokeArrow = function(ctx, strokeName) {
            const strokeMap = {
                "横": { path: [{x: 60, y: 120}, {x: 240, y: 120}] },
                "竖": { path: [{x: 150, y: 50}, {x: 150, y: 250}] },
                "撇": { path: [{x: 220, y: 70}, {x: 80, y: 230}] },
                "捺": { path: [{x: 80, y: 80}, {x: 240, y: 240}] },
                "点": { path: [{x: 200, y: 90}, {x: 230, y: 120}] },
                "提": { path: [{x: 80, y: 220}, {x: 140, y: 170}] },
                "折": { path: [{x: 80, y: 120}, {x: 220, y: 120}, {x: 220, y: 220}] },
                "钩": { path: [{x: 150, y: 220}, {x: 150, y: 250}, {x: 110, y: 220}] },
                "横折": { path: [{x: 70, y: 90}, {x: 220, y: 90}, {x: 220, y: 220}] },
                "横钩": { path: [{x: 70, y: 90}, {x: 230, y: 90}, {x: 190, y: 130}] },
                "竖折": { path: [{x: 90, y: 60}, {x: 90, y: 180}, {x: 220, y: 180}] },
                "竖钩": { path: [{x: 150, y: 60}, {x: 150, y: 240}, {x: 110, y: 210}] },
                "弯钩": { path: [{x: 140, y: 60}, {x: 170, y: 150}, {x: 140, y: 240}, {x: 100, y: 210}] },
                "斜钩": { path: [{x: 100, y: 80}, {x: 220, y: 230}, {x: 240, y: 190}] },
                "撇点": { path: [{x: 180, y: 60}, {x: 120, y: 120}, {x: 220, y: 220}] },
                "竖提": { path: [{x: 100, y: 60}, {x: 100, y: 200}, {x: 150, y: 160}] },
                "横折钩": { path: [{x: 70, y: 90}, {x: 210, y: 90}, {x: 210, y: 230}, {x: 170, y: 200}] },
                "竖折折": { path: [{x: 90, y: 70}, {x: 90, y: 160}, {x: 210, y: 160}, {x: 210, y: 240}] },
                "竖折折钩": { path: [{x: 90, y: 70}, {x: 90, y: 160}, {x: 210, y: 160}, {x: 210, y: 240}, {x: 170, y: 210}] },
                "横撇": { path: [{x: 70, y: 90}, {x: 220, y: 90}, {x: 100, y: 210}] },
                "横折弯钩": { path: [{x: 70, y: 90}, {x: 170, y: 90}, {x: 170, y: 150}, {x: 240, y: 150}, {x: 240, y: 220}, {x: 200, y: 190}] }
            };
            
            const info = strokeMap[strokeName];
            if (!info) return;
            
            const path = info.path;
            if (path.length < 2) return;
            
            ctx.strokeStyle = '#dc2626';
            ctx.lineWidth = 4;
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';
            
            ctx.beginPath();
            ctx.moveTo(path[0].x, path[0].y);
            for (let i = 1; i < path.length; i++) {
                ctx.lineTo(path[i].x, path[i].y);
            }
            ctx.stroke();
            
            const lastPt = path[path.length - 1];
            const prevPt = path[path.length - 2];
            const angle = Math.atan2(lastPt.y - prevPt.y, lastPt.x - prevPt.x);
            
            ctx.fillStyle = '#dc2626';
            ctx.beginPath();
            ctx.moveTo(lastPt.x, lastPt.y);
            ctx.lineTo(lastPt.x - 14 * Math.cos(angle - Math.PI / 6), lastPt.y - 14 * Math.sin(angle - Math.PI / 6));
            ctx.lineTo(lastPt.x - 14 * Math.cos(angle + Math.PI / 6), lastPt.y - 14 * Math.sin(angle + Math.PI / 6));
            ctx.closePath();
            ctx.fill();
            
            ctx.fillStyle = '#991b1b';
            ctx.font = 'bold 13px sans-serif';
            ctx.fillText("Vẽ theo hướng này ➔", 20, 280);
        };

        window.runGeneralStrokesDemo = function() {
            const gridCanvas = document.getElementById('nb-grid-canvas');
            if (!gridCanvas) return;
            const ctx = gridCanvas.getContext('2d');
            
            let step = 0;
            strokeDemoInterval = setInterval(() => {
                window.drawMizige(ctx, gridCanvas.width, gridCanvas.height);
                
                ctx.strokeStyle = '#dc2626';
                ctx.lineWidth = 4;
                ctx.lineCap = 'round';
                
                if (step === 0) {
                    ctx.beginPath();
                    ctx.moveTo(60, 150);
                    ctx.lineTo(240, 150);
                    ctx.stroke();
                    ctx.beginPath();
                    ctx.moveTo(240, 150);
                    ctx.lineTo(228, 142);
                    ctx.lineTo(228, 158);
                    ctx.closePath();
                    ctx.fill();
                    ctx.fillStyle = '#991b1b';
                    ctx.font = 'bold 12px sans-serif';
                    ctx.fillText("Nét 1: Ngang (Héng) - Trái sang Phải", 40, 280);
                } else if (step === 1) {
                    ctx.beginPath();
                    ctx.moveTo(150, 60);
                    ctx.lineTo(150, 240);
                    ctx.stroke();
                    ctx.beginPath();
                    ctx.moveTo(150, 240);
                    ctx.lineTo(142, 228);
                    ctx.lineTo(158, 228);
                    ctx.closePath();
                    ctx.fill();
                    ctx.fillStyle = '#991b1b';
                    ctx.font = 'bold 12px sans-serif';
                    ctx.fillText("Nét 2: Sổ (Shù) - Trên xuống Dưới", 40, 280);
                } else {
                    clearInterval(strokeDemoInterval);
                    strokeDemoInterval = null;
                    setTimeout(() => {
                        window.stopStrokeDemo();
                    }, 1000);
                    return;
                }
                step++;
            }, 1800);
        };

        // --- NOTEBOOK STORAGE LOGIC ---
        window.renderNotebookGallery = function() {
            if (typeof window.renderNotebookGalleryCore === 'function') {
                return window.renderNotebookGalleryCore();
            }
            const user = (window.auth && window.auth.currentUser) ? window.auth.currentUser : null;
            const uid = user ? user.uid : 'guest';
            
            const galleryGrid = document.getElementById('nb-gallery-grid');
            const galleryEmpty = document.getElementById('nb-gallery-empty');
            if (!galleryGrid) return;
            
            galleryGrid.innerHTML = '';
            
            const nbKey = 'xueying_hanzi_notebook_' + uid;
            const nbSaved = localStorage.getItem(nbKey);
            const nbList = nbSaved ? JSON.parse(nbSaved) : [];
            
            const statsCount = document.getElementById('nb-total-stats');
            if (statsCount) statsCount.textContent = nbList.length;
            const statNavCount = document.getElementById('statNotebookCount');
            if (statNavCount) statNavCount.textContent = nbList.length;
            
            if (nbList.length === 0) {
                if (galleryEmpty) galleryEmpty.style.display = 'block';
                return;
            }
            
            if (galleryEmpty) galleryEmpty.style.display = 'none';
            
            const sorted = [...nbList].reverse();
            
            sorted.forEach(item => {
                const card = document.createElement('div');
                card.className = 'nb-gallery-card';
                card.style.cssText = "background:white; border-radius:14px; border:1.5px solid #e2e8f0; overflow:hidden; position:relative; box-shadow:0 2px 5px rgba(0,0,0,0.02); cursor:pointer; display:flex; flex-direction:column;";
                
                const imgWrapper = document.createElement('div');
                imgWrapper.style.cssText = "width:100%; height:120px; background:#fafafa; border-bottom:1px solid #f1f5f9; display:flex; align-items:center; justify-content:center; padding:6px; box-sizing:border-box; overflow:hidden; position:relative;";
                
                const img = document.createElement('img');
                img.src = item.image;
                img.style.cssText = "max-width:100%; max-height:100%; object-fit:contain; border-radius:4px;";
                imgWrapper.appendChild(img);
                
                const delBtn = document.createElement('button');
                delBtn.innerHTML = '✕';
                delBtn.style.cssText = "position:absolute; top:6px; right:6px; width:22px; height:22px; background:rgba(239,68,68,0.9); color:white; border:none; border-radius:50%; font-size:11px; font-weight:bold; cursor:pointer; display:flex; align-items:center; justify-content:center; z-index:10; box-shadow:0 1px 3px rgba(0,0,0,0.1); outline:none;";
                delBtn.onclick = (e) => {
                    e.stopPropagation();
                    if (confirm(`Bạn có chắc chắn muốn xóa bài luyện chữ Hán "${item.char}" này khỏi vở ghi chép không?`)) {
                        window.deleteNotebookItem(item.id);
                    }
                };
                imgWrapper.appendChild(delBtn);
                
                const infoDiv = document.createElement('div');
                infoDiv.style.cssText = "padding:10px; display:flex; flex-direction:column; gap:4px; flex:1;";
                
                const charTitle = document.createElement('div');
                charTitle.style.cssText = "font-size:16px; font-weight:800; color:#334155; display:flex; justify-content:space-between; align-items:center;";
                charTitle.innerHTML = `<span style="font-family:'Kaiti',serif; font-size:18px; color:#be185d;">${item.char}</span> <span style="font-size:12px; color:#db2777; font-weight:700;">${item.pinyin || ''}</span>`;
                infoDiv.appendChild(charTitle);
                
                const dateSpan = document.createElement('div');
                dateSpan.style.cssText = "font-size:11px; color:#64748b; margin-top:2px;";
                dateSpan.textContent = `📅 ${item.dateStr || ''} - ${item.timeStr || ''}`;
                infoDiv.appendChild(dateSpan);
                
                card.appendChild(imgWrapper);
                card.appendChild(infoDiv);
                
                card.onclick = () => {
                    window.openNotebookLightbox(item);
                };
                
                galleryGrid.appendChild(card);
            });
        };

        window.deleteNotebookItem = function(id) {
            const user = (window.auth && window.auth.currentUser) ? window.auth.currentUser : null;
            const uid = user ? user.uid : 'guest';
            
            const nbKey = 'xueying_hanzi_notebook_' + uid;
            const nbSaved = localStorage.getItem(nbKey);
            let nbList = nbSaved ? JSON.parse(nbSaved) : [];
            
            nbList = nbList.filter(item => item.id !== id);
            localStorage.setItem(nbKey, JSON.stringify(nbList));
            
            window.renderNotebookGallery();
        };

        window.saveNotebookCharacter = function() {
            const user = (window.auth && window.auth.currentUser) ? window.auth.currentUser : null;
            const uid = user ? user.uid : 'guest';
            
            const details = window.currentNotebookCharacter;
            if (!details) {
                alert('Vui lòng chọn một chữ Hán trước khi lưu!');
                return;
            }
            
            const drawCanvas = document.getElementById('nb-draw-canvas');
            if (!drawCanvas) return;
            
            const tempCanvas = document.createElement('canvas');
            tempCanvas.width = 300;
            tempCanvas.height = 300;
            const ctx = tempCanvas.getContext('2d');
            
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(0, 0, 300, 300);
            
            window.drawMizige(ctx, 300, 300);
            
            ctx.strokeStyle = '#fca5a5';
            ctx.lineWidth = 2;
            ctx.strokeRect(0, 0, 300, 300);
            
            const showGuide = document.getElementById('nb-stroke-guide').style.display !== 'none';
            if (showGuide) {
                ctx.fillStyle = '#e2e8f0';
                ctx.font = "180px 'Kaiti', 'SimSun', 'STKaiti', serif";
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText(details.hanzi, 150, 150);
            }
            
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';
            ctx.lineWidth = 6;
            
            window.notebookStrokes.forEach(stroke => {
                if (stroke.length < 1) return;
                ctx.strokeStyle = stroke[0].color || '#000000';
                ctx.beginPath();
                ctx.moveTo(stroke[0].x, stroke[0].y);
                for (let i = 1; i < stroke.length; i++) {
                    ctx.lineTo(stroke[i].x, stroke[i].y);
                }
                ctx.stroke();
            });
            
            const dataUrl = tempCanvas.toDataURL('image/png');
            
            const now = new Date();
            const dateStr = now.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
            const timeStr = now.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
            
            const nbKey = 'xueying_hanzi_notebook_' + uid;
            const nbSaved = localStorage.getItem(nbKey);
            const nbList = nbSaved ? JSON.parse(nbSaved) : [];
            
            const newItem = {
                id: 'nb_' + Date.now(),
                char: details.hanzi,
                pinyin: details.pinyin,
                meaning: details.meaning,
                dateStr: dateStr,
                timeStr: timeStr,
                image: dataUrl
            };
            
            nbList.push(newItem);
            localStorage.setItem(nbKey, JSON.stringify(nbList));
            
            alert(`🎉 Tuyệt vời! Đã lưu chữ "${details.hanzi}" vào Vở Ghi Chép Điện Tử.`);
            
            window.renderNotebookGallery();
            
            const btnGallery = document.getElementById('nbSubTab-gallery');
            if (btnGallery) btnGallery.click();
        };

        window.openNotebookLightbox = function(item) {
            let lightbox = document.getElementById('nb-lightbox-modal');
            if (!lightbox) {
                lightbox = document.createElement('div');
                lightbox.id = 'nb-lightbox-modal';
                lightbox.className = 'modal-overlay';
                lightbox.style.cssText = "position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.85); z-index:9999999; display:none; align-items:center; justify-content:center; padding:16px; box-sizing:border-box;";
                lightbox.onclick = () => { lightbox.style.display = 'none'; };
                document.body.appendChild(lightbox);
            }
            
            lightbox.innerHTML = `
                <div style="background:white; border-radius:24px; max-width:400px; width:100%; box-shadow:0 20px 50px rgba(0,0,0,0.5); overflow:hidden; animation:fadeInModal 0.25s ease-out; position:relative;" onclick="event.stopPropagation();">
                    <div style="position:absolute; top:12px; right:12px; z-index:10;">
                        <button onclick="document.getElementById('nb-lightbox-modal').style.display='none'" style="background:rgba(0,0,0,0.5); color:white; border:none; width:32px; height:32px; border-radius:50%; font-size:16px; font-weight:bold; cursor:pointer; display:flex; align-items:center; justify-content:center; outline:none;">✕</button>
                    </div>
                    
                    <div style="background:linear-gradient(135deg, #fdf2f8, #fce7f3); padding:16px 20px; border-bottom:1px solid #fbcfe8;">
                        <span style="font-size:11px; background:#be185d; color:white; padding:2px 8px; border-radius:10px; font-weight:800; text-transform:uppercase; display:inline-block; margin-bottom:6px; font-family:'Lexend',sans-serif;">Vở Ghi Chép Điện Tử</span>
                        <h3 style="margin:0; font-size:20px; font-weight:800; color:#be185d; display:flex; align-items:baseline; gap:8px;">
                            <span style="font-family:'Kaiti',serif; font-size:24px;">${item.char}</span>
                            <span style="font-size:14px; color:#db2777;">${item.pinyin || ''}</span>
                        </h3>
                        <p style="margin:4px 0 0 0; font-size:12px; color:#64748b;">
                            📅 Ngày lưu: ${item.dateStr} lúc ${item.timeStr}
                        </p>
                    </div>
                    
                    <div style="padding:20px; display:flex; align-items:center; justify-content:center; background:#faf5f7;">
                        <div style="border:4px solid #fca5a5; border-radius:18px; overflow:hidden; box-shadow:0 10px 25px rgba(0,0,0,0.05); background:white;">
                            <img src="${item.image}" style="width:280px; height:280px; display:block; object-fit:contain;" />
                        </div>
                    </div>
                    
                    <div style="padding:16px 20px; background:white; border-top:1px solid #f1f5f9; text-align:center;">
                        <p style="margin:0; font-size:14px; font-weight:700; color:#334155;">"${item.meaning || ''}"</p>
                        <div style="display:flex; gap:10px; margin-top:14px;">
                            <button onclick="document.getElementById('nb-lightbox-modal').style.display='none'" style="flex:1; padding:10px; background:#f1f5f9; border:none; border-radius:10px; font-size:13px; font-weight:700; color:#475569; cursor:pointer; outline:none; font-family:'Lexend',sans-serif;">Đóng</button>
                            <button onclick="window.reloadNotebookItemToCanvas('${item.char}'); document.getElementById('nb-lightbox-modal').style.display='none';" style="flex:1; padding:10px; background:#be185d; color:white; border:none; border-radius:10px; font-size:13px; font-weight:700; cursor:pointer; box-shadow:0 3px 8px rgba(190,24,93,0.25); outline:none; font-family:'Lexend',sans-serif;">✏️ Viết lại</button>
                        </div>
                    </div>
                </div>
            `;
            
            lightbox.style.display = 'flex';
        };

        window.reloadNotebookItemToCanvas = function(char) {
            const btnSelect = document.getElementById('nbSubTab-select');
            if (btnSelect) btnSelect.click();
            
            const sourceSelect = document.getElementById('nb-source-select');
            if (sourceSelect) {
                sourceSelect.value = 'custom';
                window.loadNotebookSource('custom');
                
                const customInput = document.getElementById('nb-custom-input');
                if (customInput) {
                    customInput.value = char;
                    const customApplyBtn = document.getElementById('nb-custom-apply-btn');
                    if (customApplyBtn) customApplyBtn.click();
                }
            }
        };
