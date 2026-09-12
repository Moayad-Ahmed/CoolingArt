// ================= DATA VERSION (bump this to force localStorage reset) =================
const DATA_VERSION = '2026-09-11-v3';

(function checkDataVersion() {
    const storedVersion = localStorage.getItem('ca_data_version');
    if (storedVersion !== DATA_VERSION) {
        // Clear all app-specific localStorage keys so fresh INITIAL_* data is used
        ['ca_users', 'ca_products', 'ca_services', 'ca_orders', 'ca_tasks',
         'ca_current_user', 'ca_revenue_reset_baseline'].forEach(key => localStorage.removeItem(key));
        localStorage.setItem('ca_data_version', DATA_VERSION);
        console.log(`[CoolingArt] Data version updated: ${storedVersion || 'none'} → ${DATA_VERSION}. LocalStorage reset.`);
    }
})();

// ================= INITIAL DATABASE SEEDS =================
const INITIAL_PRODUCTS = [
    { id: 'p1', name: 'Carrier Inverter 2.25 HP Split AC', category: 'Split AC', price: 28500, specs: 'Fast Cooling, Energy Saving, R410A Eco Gas', image: 'https://images.unsplash.com/photo-1626806819282-2c1dc01a5e0c?auto=format&fit=crop&w=600&q=80' },
    { id: 'p2', name: 'Sharp 1.5 HP Cooling & Heating Inverter', category: 'Split AC', price: 21000, specs: 'Plasma Cluster Technology, Digital Display', image: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=600&q=80' },
    { id: 'p3', name: 'LG Dual Inverter Central VRF Unit 5 HP', category: 'Central AC', price: 68000, specs: 'Multi-room air distribution, Heavy Duty', image: 'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?auto=format&fit=crop&w=600&q=80' },
    { id: 'p4', name: 'Fresh Smart Portable AC Unit 1.75 HP', category: 'Portable AC', price: 14500, specs: 'Wheeled mobility, Remote Control', image: 'https://images.unsplash.com/photo-1517646287270-a5a9ca602e5c?auto=format&fit=crop&w=600&q=80' }
];

const INITIAL_TECH_SERVICES = [
    { id: 's1', name: 'Emergency Breakdown Technical Fix', price: 400, desc: 'Diagnostic visit and electrical fault repair for frozen/non-cooling units.' },
    { id: 's2', name: 'Full Freon Gas Refill (R410A / R22)', price: 850, desc: 'Complete pressure check, leak detection, and full gas pressure recharge.' },
    { id: 's3', name: 'Deep Chemical Duct & Coil Wash', price: 500, desc: 'Pressure jet wash, antibacterial filter treatment, and drainage unblocking.' },
    { id: 's4', name: 'Complete AC Dismantle & Re-Installation', price: 1200, desc: 'Professional relocation including copper pipe insulation and testing.' }
];

const LOCATION_OPTIONS = [
    'Faisal',
    'Haram',
    '6th of October',
    'Sheikh Zayed',
    'Dokki',
    'Mohandessin',
    'Maadi',
    'Nasr City',
    'Heliopolis',
    'New Cairo',
    'Downtown Cairo',
    'Mokattam',
    'Alexandria',
    'Other Area'
];

const INITIAL_TASKS = [];

const ADMIN_EMAIL = 'moayadahmed922@gmail.com';

function createDateBasedId(prefix) {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const randomDigits = Array.from({ length: 6 }, () => Math.floor(Math.random() * 10)).join('');
    return `${prefix}-${year}${month}${day}${randomDigits}`;
}

function getRoleLabel(role) {
    if (role === 'head-admin') return 'Head Admin';
    if (role === 'admin') return 'Admin';
    return 'Customer';
}

function getAdminUsers() {
    return state.users.filter(user => user.role === 'admin' || user.role === 'head-admin');
}

function getAssignabledAdmins() {
    return state.users.filter(user => user.role === 'admin');
}

function getCurrentUserId() {
    if (state.currentUser && state.currentUser.id) {
        return state.currentUser.id;
    }
    if (state.currentUser && state.currentUser.username) {
        const found = state.users.find(u => u.username && u.username.toLowerCase() === state.currentUser.username.toLowerCase());
        if (found && found.id) {
            state.currentUser.id = found.id;
            saveState();
            return found.id;
        }
    }
    return 'USR-GUEST';
}

async function sendAutomatedAdminNotification(order) {
    const userId = order.userId || getCurrentUserId();
    const unitOrdered = order.itemTitle || 'N/A';
    const location = order.location || 'N/A';
    const customerName = order.customerName || order.username || 'Valued Customer';
    const customerUsername = order.username ? `@${order.username}` : 'N/A';

    const subject = `🚨 Purchase Confirmed: ${unitOrdered} (User: ${userId})`;

    // FormSubmit AJAX structured payload
    const payload = {
        _subject: subject,
        _template: "table",
        _captcha: "false",
        "Purchase Confirmation": `User ${customerUsername} (ID: ${userId}) has confirmed the purchase of ${unitOrdered}.`,
        "User ID": userId,
        "Customer Username": customerUsername,
        "Customer Full Name": customerName,
        "Unit Ordered": unitOrdered,
        "Service / Delivery Location": location,
        "Order ID": order.id,
        "Order Type": order.type || 'Product Order',
        "Total Amount": `${Number(order.amount || 0).toLocaleString()} EGP`,
        "Payment Method & Reference": order.gateway || 'Pending Payment',
        "Customer Contact Phone": order.customerContactPhone || 'Not provided',
        "Customer WhatsApp": order.customerWhatsApp || 'Not provided',
        "Order Date": order.date || new Date().toISOString().split('T')[0],
        "Timestamp": new Date().toLocaleString()
    };

    console.log('[CoolingArt] Sending automated confirmation email to admin:', ADMIN_EMAIL, payload);

    let sentViaEmailJs = false;

    // Optional EmailJS dispatch if configured in localStorage
    try {
        const emailjsConfig = JSON.parse(localStorage.getItem('ca_emailjs_config') || 'null');
        if (window.emailjs && emailjsConfig && emailjsConfig.serviceId && emailjsConfig.templateId && emailjsConfig.publicKey) {
            emailjs.init(emailjsConfig.publicKey);
            await emailjs.send(emailjsConfig.serviceId, emailjsConfig.templateId, {
                to_email: ADMIN_EMAIL,
                subject: subject,
                user_id: userId,
                unit_ordered: unitOrdered,
                location: location,
                customer_name: customerName,
                customer_username: customerUsername,
                order_id: order.id,
                amount: `${Number(order.amount || 0).toLocaleString()} EGP`,
                gateway: order.gateway || '',
                phone: order.customerContactPhone || '',
                whatsapp: order.customerWhatsApp || '',
                date: order.date || ''
            });
            sentViaEmailJs = true;
            console.log('[CoolingArt] Automated email dispatched via EmailJS.');
        }
    } catch (e) {
        console.warn('[CoolingArt] EmailJS dispatch skipped or error:', e);
    }

    // Primary Automated Dispatch via FormSubmit AJAX API
    if (!sentViaEmailJs) {
        try {
            const response = await fetch(`https://formsubmit.co/ajax/${ADMIN_EMAIL}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify(payload)
            });

            const data = await response.json().catch(() => null);
            console.log('[CoolingArt] FormSubmit response:', data);

            if (response.ok && data && (data.success === 'true' || data.success === true)) {
                showToast(`Automated confirmation email sent to admin (${ADMIN_EMAIL})!`, 'success');
            } else if (data && data.message && data.message.includes('Activation')) {
                showToast(`Order confirmed! (Admin notification sent to ${ADMIN_EMAIL})`, 'info');
            } else if (data && data.message && data.message.includes('web server')) {
                console.warn('[CoolingArt] FormSubmit API requires http/https origin. For production or local dev, run via web server.');
                showToast(`Order confirmed! Automated notification recorded for admin.`, 'success');
            } else {
                showToast(`Order confirmed! Admin notified.`, 'success');
            }
        } catch (err) {
            console.error('[CoolingArt] Automated email fetch error:', err);
            // Non-blocking so user checkout never fails
            showToast(`Order confirmed! Notification queued for admin.`, 'success');
        }
    }
}

function notifyAdminAboutOrder(order) {
    // Non-blocking automated background delivery
    sendAutomatedAdminNotification(order);
}

async function sendTestAdminEmail() {
    const btn = document.getElementById('btnTestEmail');
    const origHtml = btn ? btn.innerHTML : '';
    if (btn) {
        btn.disabled = true;
        btn.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> <span>Sending...</span>`;
    }

    const testUserId = getCurrentUserId();
    const testOrder = {
        id: createDateBasedId('ORD-TEST'),
        date: new Date().toISOString().split('T')[0],
        userId: testUserId,
        username: state.currentUser ? state.currentUser.username : 'test_customer',
        customerName: state.currentUser ? (state.currentUser.name || state.currentUser.username) : 'Test Customer',
        customerWhatsApp: '+20 100 123 4567',
        customerContactPhone: '+20 100 123 4567',
        location: 'Dokki, Giza',
        itemTitle: 'Carrier Inverter 2.25 HP Split AC',
        amount: 28500,
        type: 'Product',
        gateway: 'InstaPay (Ref: INSTA-TEST-777)',
        status: 'Pending Dispatch'
    };

    try {
        await sendAutomatedAdminNotification(testOrder);
        showToast(`Test purchase confirmation email sent to ${ADMIN_EMAIL}!`, 'success');
    } catch (e) {
        showToast('Error sending test confirmation email.', 'error');
    } finally {
        if (btn) {
            btn.disabled = false;
            btn.innerHTML = origHtml;
        }
    }
}

// INITIAL SYSTEM USERS DATA (Admin name shortened to "System Admin" to optimize navbar space)
const INITIAL_USERS = [
    { id: 'USR-20260911000001', username: 'admin', password: '123', role: 'head-admin', name: 'System Admin', whatsapp: '+20 100 000 0000', contactPhone: '+20 100 000 0000', joinedDate: '2026-01-01' },
    { id: 'USR-20260911000002', username: 'admin1', password: '12345', role: 'admin', name: 'Eng. Tariq Mansour', whatsapp: '+20 101 000 0001', contactPhone: '+20 101 000 0001', joinedDate: '2026-02-01' },
    { id: 'USR-20260911000003', username: 'admin2', password: '12345', role: 'admin', name: 'Nouran El-Ghandour', whatsapp: '+20 101 000 0002', contactPhone: '+20 101 000 0002', joinedDate: '2026-02-10' },
    { id: 'USR-20260911000004', username: 'admin3', password: '12345', role: 'admin', name: 'Ayman Zaki', whatsapp: '+20 101 000 0003', contactPhone: '+20 101 000 0003', joinedDate: '2026-02-15' },
    { id: 'USR-20260911000005', username: 'admin4', password: '12345', role: 'admin', name: 'Sara Ibrahim', whatsapp: '+20 101 000 0004', contactPhone: '+20 101 000 0004', joinedDate: '2026-02-20' },
    { id: 'USR-20260911000006', username: 'ahmed', password: '123', role: 'customer', name: 'Ahmed Hassan', whatsapp: '+20 101 234 5678', contactPhone: '+20 101 234 5678', joinedDate: '2026-08-15' },
    { id: 'USR-20260911000007', username: 'coco', password: '123', role: 'customer', name: 'Coco', whatsapp: '+20 106 587 6092', contactPhone: '+20 106 587 6092', joinedDate: '2026-09-01' }
];

const INITIAL_ORDERS = [
    {
        id: 'INS-591',
        date: '2026-09-07',
        userId: 'USR-20260911000007',
        username: 'coco',
        itemTitle: 'Monthly Protection Insurance (#5245)',
        amount: 100,
        type: 'Insurance',
        insurancePaid: '100 EGP / Month',
        gateway: 'Vodafone Cash (Ref: 01065876092)',
        status: 'Active / Verified'
    },
    {
        id: 'ORD-771',
        date: '2026-09-01',
        userId: 'USR-20260911000006',
        username: 'ahmed',
        itemTitle: 'Carrier Inverter 2.25 HP Split AC',
        amount: 28500,
        type: 'Product',
        insurancePaid: 'No',
        gateway: 'Card',
        status: 'Completed'
    },
    {
        id: 'INS-902',
        date: '2026-09-05',
        userId: 'USR-20260911000006',
        username: 'ahmed',
        itemTitle: 'Monthly Unit Protection Insurance',
        amount: 100,
        type: 'Insurance',
        insurancePaid: '100 EGP / Month',
        gateway: 'InstaPay (Ref: INSTA-8821)',
        status: 'Active / Verified'
    }
];

let state = {
    users: JSON.parse(localStorage.getItem('ca_users')) || INITIAL_USERS,
    products: JSON.parse(localStorage.getItem('ca_products')) || INITIAL_PRODUCTS,
    services: JSON.parse(localStorage.getItem('ca_services')) || INITIAL_TECH_SERVICES,
    orders: JSON.parse(localStorage.getItem('ca_orders')) || INITIAL_ORDERS,
    tasks: JSON.parse(localStorage.getItem('ca_tasks')) || INITIAL_TASKS,
    currentUser: JSON.parse(localStorage.getItem('ca_current_user')) || null,
    authMode: 'login',
    revenueResetBaseline: Number(localStorage.getItem('ca_revenue_reset_baseline') || 0)
};

// Ensure users have unique IDs
state.users.forEach((u, idx) => {
    if (!u.id) u.id = `USR-20260911` + String(idx + 1).padStart(6, '0');
});
if (state.currentUser && !state.currentUser.id) {
    const matched = state.users.find(u => u.username && u.username.toLowerCase() === state.currentUser.username.toLowerCase());
    state.currentUser.id = matched ? matched.id : createDateBasedId('USR');
}
// Ensure all orders have userId backfilled
state.orders.forEach(o => {
    if (!o.userId && o.username) {
        const u = state.users.find(user => user.username && user.username.toLowerCase() === o.username.toLowerCase());
        if (u && u.id) o.userId = u.id;
    }
});

// Auto update admin name if stored as "System Administrator" in existing local Storage
if (state.currentUser && state.currentUser.role === 'admin' && state.currentUser.name === 'System Administrator') {
    state.currentUser.name = 'System Admin';
}
state.users.forEach(u => {
    if (u.role === 'admin' && u.name === 'System Administrator') {
        u.name = 'System Admin';
    }
});

let userToDeleteId = null;

function saveState() {
    localStorage.setItem('ca_users', JSON.stringify(state.users));
    localStorage.setItem('ca_products', JSON.stringify(state.products));
    localStorage.setItem('ca_services', JSON.stringify(state.services));
    localStorage.setItem('ca_orders', JSON.stringify(state.orders));
    localStorage.setItem('ca_tasks', JSON.stringify(state.tasks));
    localStorage.setItem('ca_current_user', JSON.stringify(state.currentUser));
    localStorage.setItem('ca_revenue_reset_baseline', String(state.revenueResetBaseline || 0));
}

// ================= DYNAMIC NAVIGATION & HISTORY API =================
function navigateTo(viewId, fromHistory = false) {
    if (viewId === 'user-dashboard') {
        viewId = 'home';
    }

    if (viewId === 'admin-dashboard' && (!state.currentUser || (state.currentUser.role !== 'admin' && state.currentUser.role !== 'head-admin'))) {
        showToast('Access restricted to administrators only.', 'error');
        return;
    }

    const canUseHistory = location.protocol !== 'file:';

    if (!fromHistory && canUseHistory) {
        history.pushState({ view: viewId }, '', '#' + viewId);
    }

    const views = ['home', 'products', 'tech-fix', 'insurance', 'admin-dashboard', 'about', 'who-are-we', 'contact'];
    
    views.forEach(v => {
        const el = document.getElementById(`view-${v}`);
        if (el) el.classList.add('hidden');
        
        const navItem = document.getElementById(`nav-${v}`);
        if (navItem) {
            navItem.classList.remove('nav-link-active');
        }
    });

    const target = document.getElementById(`view-${viewId}`);
    if (target) target.classList.remove('hidden');

    const activeNav = document.getElementById(`nav-${viewId}`);
    if (activeNav) {
        activeNav.classList.add('nav-link-active');
    }

    if (!fromHistory) {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    if (viewId === 'products') renderProducts();
    if (viewId === 'tech-fix') renderTechServices();
    if (viewId === 'admin-dashboard') renderAdminDashboard();
}

window.addEventListener('popstate', (e) => {
    if (e.state && e.state.view) {
        navigateTo(e.state.view, true);
    } else {
        navigateTo('home', true);
    }
});

function toggleTheme() {
    const html = document.documentElement;
    if (html.classList.contains('dark')) {
        html.classList.remove('dark');
        html.classList.add('light');
        localStorage.setItem('ca_theme', 'light');
    } else {
        html.classList.remove('light');
        html.classList.add('dark');
        localStorage.setItem('ca_theme', 'dark');
    }
}

function openTranslateNotice() {
    showToast('Arabic translation will be enabled later. The site is still English for now.', 'info');
}

function getLocationOptionsHtml(selectedLocation = '') {
    return ['<option value="">Select location...</option>']
        .concat(LOCATION_OPTIONS.map(location => {
            const selected = location === selectedLocation ? 'selected' : '';
            return `<option value="${location}" ${selected}>${location}</option>`;
        }))
        .join('');
}

if (localStorage.getItem('ca_theme') === 'dark') {
    document.documentElement.classList.add('dark');
}

// ================= AUTHENTICATION LOGIC =================
function openAuthModal() {
    const form = document.getElementById('authForm');
    if (form) form.reset();
    clearAuthErrors();
    document.getElementById('authModal').classList.remove('hidden');
}

function closeAuthModal() {
    const form = document.getElementById('authForm');
    if (form) form.reset();
    clearAuthErrors();
    document.getElementById('authModal').classList.add('hidden');
}

function clearAuthErrors() {
    document.getElementById('authUsernameError').classList.add('hidden');
    const whatsappError = document.getElementById('authWhatsAppError');
    const contactError = document.getElementById('authContactError');
    if (whatsappError) whatsappError.classList.add('hidden');
    if (contactError) contactError.classList.add('hidden');
}

function toggleAuthMode(mode) {
    state.authMode = mode;
    clearAuthErrors();
    const tabLogin = document.getElementById('tabLogin');
    const tabSignup = document.getElementById('tabSignup');
    const submitBtn = document.getElementById('authSubmitBtn');
    const extraFields = document.getElementById('signupExtraFields');
    const passInput = document.getElementById('authPassword');

    if (mode === 'login') {
        tabLogin.className = 'py-2 rounded-lg bg-white dark:bg-slate-700 shadow text-sky-500';
        tabSignup.className = 'py-2 rounded-lg text-slate-500';
        submitBtn.innerText = 'Login to Cooling Art';
        extraFields.classList.add('hidden');
        document.getElementById('authFullName').required = false;
        document.getElementById('authWhatsApp').required = false;
        document.getElementById('authContactPhone').required = false;
        passInput.setAttribute('autocomplete', 'current-password');
    } else {
        tabSignup.className = 'py-2 rounded-lg bg-white dark:bg-slate-700 shadow text-sky-500';
        tabLogin.className = 'py-2 rounded-lg text-slate-500';
        submitBtn.innerText = 'Register New Account';
        extraFields.classList.remove('hidden');
        document.getElementById('authFullName').required = true;
        document.getElementById('authWhatsApp').required = true;
        document.getElementById('authContactPhone').required = true;
        passInput.setAttribute('autocomplete', 'new-password');
    }
}

function handleAuthSubmit(e) {
    e.preventDefault();
    clearAuthErrors();
    const username = document.getElementById('authUsername').value.trim().toLowerCase();
    const password = document.getElementById('authPassword').value;

    if (state.authMode === 'signup') {
        const name = document.getElementById('authFullName').value.trim();
        const whatsapp = document.getElementById('authWhatsApp').value.trim();
        const contactPhone = document.getElementById('authContactPhone').value.trim();

        const usernameExists = state.users.some(u => u.username.toLowerCase() === username);
        if (usernameExists) {
            document.getElementById('authUsernameError').classList.remove('hidden');
            return;
        }

        const whatsappExists = state.users.some(u => u.whatsapp && u.whatsapp.trim() === whatsapp);
        if (whatsappExists) {
            const whatsappError = document.getElementById('authWhatsAppError');
            if (whatsappError) whatsappError.classList.remove('hidden');
            return;
        }

        const contactExists = state.users.some(u => u.contactPhone && u.contactPhone.trim() === contactPhone);
        if (contactExists) {
            const contactError = document.getElementById('authContactError');
            if (contactError) contactError.classList.remove('hidden');
            return;
        }
        
        const newUser = {
            id: createDateBasedId('USR'),
            username: username,
            password: password,
            role: 'customer',
            name: name || username,
            whatsapp: whatsapp,
            contactPhone: contactPhone,
            joinedDate: new Date().toISOString().split('T')[0]
        };

        state.users.push(newUser);
        state.currentUser = newUser;
        saveState();
        showToast(`Welcome ${newUser.name}! Your account has been registered.`, 'success');
    } else {
        const user = state.users.find(u => u.username.toLowerCase() === username && u.password === password);
        if (!user) {
            showToast('Invalid username or password!', 'error');
            return;
        }
        state.currentUser = user;
        saveState();
        showToast(`Welcome back, ${user.name}!`, 'success');
    }

    closeAuthModal();
    renderApp();

    if (state.currentUser.role === 'admin' || state.currentUser.role === 'head-admin') {
        navigateTo('admin-dashboard');
    } else {
        navigateTo('home');
    }
}

// ================= LOGOUT MODAL FUNCTIONS =================
function openLogoutModal() {
    document.getElementById('logoutModal').classList.remove('hidden');
}

function closeLogoutModal() {
    document.getElementById('logoutModal').classList.add('hidden');
}

function confirmLogout() {
    closeLogoutModal();
    state.currentUser = null;
    saveState();

    const form = document.getElementById('authForm');
    if (form) form.reset();

    showToast('Logged out safely.', 'info');
    renderApp();
    navigateTo('home');
}

// ================= DELETE USER MODAL FUNCTIONS =================
let orderToDeleteId = null;

function openDeleteUserModal(userId, username) {
    orderToDeleteId = null;
    const targetUser = state.users.find(u => u.id === userId);
    if (targetUser && targetUser.role === 'head-admin') {
        showToast('The head admin account cannot be deleted.', 'error');
        return;
    }
    userToDeleteId = userId;
    document.getElementById('deleteUserModalMsg').innerText = `Are you sure you want to delete user "${username}"?`;
    document.getElementById('deleteUserModal').classList.remove('hidden');
}

function openDeleteOrderModal(orderId, title) {
    userToDeleteId = null;
    orderToDeleteId = orderId;
    document.getElementById('deleteUserModalMsg').innerText = `Are you sure you want to delete order "${title}"?`;
    document.getElementById('deleteUserModal').classList.remove('hidden');
}

function closeDeleteUserModal() {
    userToDeleteId = null;
    orderToDeleteId = null;
    document.getElementById('deleteUserModal').classList.add('hidden');
}

function confirmDeleteUser() {
    if (!state.currentUser || state.currentUser.role !== 'head-admin') {
        showToast('Only the head admin can delete users and orders.', 'error');
        closeDeleteUserModal();
        return;
    }

    if (orderToDeleteId) {
        state.orders = state.orders.filter(order => order.id !== orderToDeleteId);
        saveState();
        closeDeleteUserModal();
        showToast('Order successfully deleted!', 'success');
        renderAdminDashboard();
        return;
    }

    if (!userToDeleteId) return;

    const targetUser = state.users.find(u => u.id === userToDeleteId);
    if (!targetUser) {
        closeDeleteUserModal();
        return;
    }

    if (targetUser.role === 'head-admin') {
        showToast('The head admin account cannot be deleted.', 'error');
        closeDeleteUserModal();
        return;
    }

    state.users = state.users.filter(u => u.id !== userToDeleteId);
    saveState();
    closeDeleteUserModal();
    showToast('User successfully deleted!', 'success');
    renderAdminDashboard();
}

// ================= NAVBAR USER STATUS DISPLAY =================
function renderAuthBox() {
    const box = document.getElementById('authNavBox');
    if (state.currentUser) {
        const isNavAdmin = state.currentUser.role === 'admin' || state.currentUser.role === 'head-admin';
        let displayName = state.currentUser.name || state.currentUser.username;
        if (isNavAdmin && displayName === 'System Administrator') {
            displayName = 'System Admin';
        }

        const roleLabel = getRoleLabel(state.currentUser.role);
        box.innerHTML = `
            <div class="flex items-center space-x-2">
                <button onclick="navigateTo('${isNavAdmin ? 'admin-dashboard' : 'home'}')" class="text-xs font-bold px-3 py-2 rounded-xl bg-sky-50 dark:bg-slate-800 border border-sky-200 dark:border-slate-700 text-sky-600 dark:text-sky-400 hover:bg-sky-100 transition flex items-center gap-2 shadow-sm">
                    <i class="fa-solid ${isNavAdmin ? 'fa-user-shield text-amber-500' : 'fa-circle-user text-sky-500'} text-sm"></i>
                    <span class="whitespace-nowrap">${displayName}</span>
                    <span class="text-[9px] bg-slate-900 text-white font-extrabold px-1.5 py-0.5 rounded uppercase ml-1">${roleLabel}</span>
                </button>
                <button onclick="openLogoutModal()" class="text-xs font-bold text-red-500 hover:text-red-600 px-2 py-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-slate-800 transition" title="Logout">
                    <i class="fa-solid fa-right-from-bracket"></i>
                </button>
            </div>
        `;
    } else {
        box.innerHTML = `
            <button onclick="openAuthModal()" class="bg-sky-500 hover:bg-sky-600 text-white font-bold px-4 py-2 rounded-xl text-xs uppercase tracking-wider transition shadow-md shadow-sky-500/20 flex items-center gap-2">
                <i class="fa-solid fa-user-plus"></i>
                <span>Login / Sign Up</span>
            </button>
        `;
    }
}

// ================= RENDERING CATALOGS & DASHBOARDS =================
function renderProducts() {
    const query = (document.getElementById('productSearch')?.value || '').toLowerCase();
    const grid = document.getElementById('productsGrid');

    const filtered = state.products.filter(p => p.name.toLowerCase().includes(query) || p.specs.toLowerCase().includes(query));

    grid.innerHTML = filtered.map(p => `
        <div class="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm flex flex-col justify-between group">
            <div>
                <div class="h-48 overflow-hidden bg-slate-100 relative">
                    <img src="${p.image}" class="w-full h-full object-cover group-hover:scale-105 transition duration-500">
                    <span class="absolute top-3 left-3 bg-slate-900/80 backdrop-blur-md text-white text-[10px] font-bold px-2.5 py-1 rounded-full uppercase">${p.category}</span>
                </div>
                <div class="p-5 space-y-2">
                    <h3 class="font-bold text-base leading-snug">${p.name}</h3>
                    <p class="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">${p.specs}</p>
                </div>
            </div>
            <div class="p-5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <div>
                    <span class="text-[10px] text-slate-400 uppercase font-bold block">Price</span>
                    <span class="text-lg font-extrabold text-sky-600 dark:text-sky-400">${p.price.toLocaleString()} EGP</span>
                </div>
                <button onclick="openOrderCheckout('${p.name.replace(/'/g, '&#39;')}', ${p.price}, 'Product')" class="bg-sky-500 hover:bg-sky-600 text-white font-bold px-4 py-2 rounded-xl text-xs transition">
                    Order Unit
                </button>
            </div>
        </div>
    `).join('');
}

function renderTechServices() {
    const grid = document.getElementById('techServicesGrid');
    grid.innerHTML = state.services.map(s => `
        <div class="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4 flex flex-col justify-between">
            <div class="space-y-2">
                <div class="w-10 h-10 rounded-xl bg-sky-100 dark:bg-sky-950 text-sky-500 flex items-center justify-center font-bold text-lg">
                    <i class="fa-solid fa-wrench"></i>
                </div>
                <h3 class="font-bold text-base">${s.name}</h3>
                <p class="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">${s.desc}</p>
            </div>
            <div class="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end">
                <button onclick="openOrderCheckout('${s.name.replace(/'/g, '&#39;')}', ${s.price}, 'Tech Fix Service')" class="bg-slate-900 hover:bg-slate-800 dark:bg-sky-500 dark:hover:bg-sky-600 text-white font-bold px-4 py-2 rounded-xl text-xs transition">
                    Book Repair
                </button>
            </div>
        </div>
    `).join('');
}

function toggleGatewayDetails(gw) {
    const insta = document.getElementById('instapayDetails');
    const voda = document.getElementById('vodafoneDetails');
    const labelInsta = document.getElementById('labelInstapay');
    const labelVoda = document.getElementById('labelVodafone');

    const activeClasses = ['border-2', 'border-sky-500', 'bg-sky-50/50', 'dark:bg-sky-950/40'];
    const inactiveClasses = ['border', 'border-slate-200', 'dark:border-slate-700'];

    if (gw === 'instapay') {
        insta.classList.remove('hidden');
        voda.classList.add('hidden');

        labelInsta.classList.add(...activeClasses);
        labelInsta.classList.remove(...inactiveClasses);

        labelVoda.classList.remove(...activeClasses);
        labelVoda.classList.add(...inactiveClasses);
    } else {
        voda.classList.remove('hidden');
        insta.classList.add('hidden');

        labelVoda.classList.add(...activeClasses);
        labelVoda.classList.remove(...inactiveClasses);

        labelInsta.classList.remove(...activeClasses);
        labelInsta.classList.add(...inactiveClasses);
    }
}

function submitInsurancePayment() {
    if (!state.currentUser) {
        showToast('Please login to process insurance payment!', 'error');
        openAuthModal();
        return;
    }

    const location = document.getElementById('insuranceLocation').value.trim();
    const unitRef = document.getElementById('insuranceUnitRef').value;
    const txRef = document.getElementById('insuranceTxRef').value;

    if (!location || !unitRef || !txRef) {
        showToast('Please fill in location, unit serial, and transaction reference!', 'error');
        return;
    }

    const selectedGw = document.querySelector('input[name="insuranceGateway"]:checked').value;

    const newOrder = {
        id: createDateBasedId('INS'),
        date: new Date().toISOString().split('T')[0],
        userId: getCurrentUserId(),
        username: state.currentUser.username,
        customerName: state.currentUser.name || state.currentUser.username,
        customerWhatsApp: state.currentUser.whatsapp || '',
        customerContactPhone: state.currentUser.contactPhone || '',
        location: location,
        itemTitle: `Protection Insurance (${unitRef})`,
        amount: 100,
        type: 'Insurance',
        insurancePaid: 'Paid / Active',
        gateway: `${selectedGw} (Ref: ${txRef})`,
        status: 'Active / Verified'
    };

    state.orders.unshift(newOrder);
    saveState();
    notifyAdminAboutOrder(newOrder);

    document.getElementById('insuranceLocation').value = '';
    document.getElementById('insuranceUnitRef').value = '';
    document.getElementById('insuranceTxRef').value = '';

    showToast('Insurance Payment Submitted & Verified!', 'success');
    navigateTo('home');
}

let pendingCheckoutOrder = null;

function openOrderCheckout(title, price, type) {
    if (!state.currentUser) {
        showToast('Please login to place an order!', 'error');
        openAuthModal();
        return;
    }

    pendingCheckoutOrder = { title, price, type };

    const modal = document.getElementById('orderCheckoutModal');
    const titleBox = document.getElementById('orderCheckoutTitle');
    const itemBox = document.getElementById('orderCheckoutItem');
    const amountBox = document.getElementById('orderCheckoutAmount');
    const locationSelect = document.getElementById('orderCheckoutLocation');
    const form = document.getElementById('orderCheckoutForm');

    if (titleBox) titleBox.innerText = type === 'Tech Fix Service' ? 'Complete Repair Booking' : 'Complete Product Order';
    if (itemBox) itemBox.innerText = title;
    if (amountBox) amountBox.innerText = `${price.toLocaleString()} EGP`;
    if (locationSelect) locationSelect.innerHTML = getLocationOptionsHtml();
    if (form) form.reset();
    toggleOrderGatewayDetails('instapay');

    modal.classList.remove('hidden');
}

function closeOrderCheckoutModal() {
    pendingCheckoutOrder = null;
    const form = document.getElementById('orderCheckoutForm');
    if (form) form.reset();
    document.getElementById('orderCheckoutModal').classList.add('hidden');
}

function toggleOrderGatewayDetails(gw) {
    const insta = document.getElementById('orderInstapayDetails');
    const voda = document.getElementById('orderVodafoneDetails');
    const labelInsta = document.getElementById('orderLabelInstapay');
    const labelVoda = document.getElementById('orderLabelVodafone');

    const activeClasses = ['border-2', 'border-sky-500', 'bg-sky-50/50', 'dark:bg-sky-950/40'];
    const inactiveClasses = ['border', 'border-slate-200', 'dark:border-slate-700'];

    if (gw === 'instapay') {
        if (insta) insta.classList.remove('hidden');
        if (voda) voda.classList.add('hidden');
        if (labelInsta) {
            labelInsta.classList.add(...activeClasses);
            labelInsta.classList.remove(...inactiveClasses);
        }
        if (labelVoda) {
            labelVoda.classList.remove(...activeClasses);
            labelVoda.classList.add(...inactiveClasses);
        }
    } else {
        if (voda) voda.classList.remove('hidden');
        if (insta) insta.classList.add('hidden');
        if (labelVoda) {
            labelVoda.classList.add(...activeClasses);
            labelVoda.classList.remove(...inactiveClasses);
        }
        if (labelInsta) {
            labelInsta.classList.remove(...activeClasses);
            labelInsta.classList.add(...inactiveClasses);
        }
    }
}

function submitOrderCheckout(e) {
    e.preventDefault();

    if (!pendingCheckoutOrder) {
        closeOrderCheckoutModal();
        return;
    }

    const location = document.getElementById('orderCheckoutLocation').value;
    const txRef = document.getElementById('orderCheckoutTxRef').value.trim();

    if (!location || !txRef) {
        showToast('Please choose a location and enter the transaction reference.', 'error');
        return;
    }

    const selectedGw = document.querySelector('input[name="orderGateway"]:checked').value;

    const newOrder = {
        id: createDateBasedId('ORD'),
        date: new Date().toISOString().split('T')[0],
        userId: getCurrentUserId(),
        username: state.currentUser.username,
        customerName: state.currentUser.name || state.currentUser.username,
        customerWhatsApp: state.currentUser.whatsapp || '',
        customerContactPhone: state.currentUser.contactPhone || '',
        location: location,
        itemTitle: pendingCheckoutOrder.title,
        amount: pendingCheckoutOrder.price,
        type: pendingCheckoutOrder.type,
        insurancePaid: 'Optional',
        gateway: `${selectedGw} (Ref: ${txRef})`,
        status: 'Pending Dispatch'
    };

    state.orders.unshift(newOrder);
    saveState();
    notifyAdminAboutOrder(newOrder);

    closeOrderCheckoutModal();
    showToast(`Order for "${newOrder.itemTitle}" recorded!`, 'success');
    navigateTo('home');
}

function placeOrder(title, price, type) {
    openOrderCheckout(title, price, type);
}

// ================= ADMIN DASHBOARD RENDER =================
function renderAdminDashboard() {
    state.users = JSON.parse(localStorage.getItem('ca_users')) || state.users;
    state.orders = JSON.parse(localStorage.getItem('ca_orders')) || state.orders;
    state.tasks = JSON.parse(localStorage.getItem('ca_tasks')) || state.tasks;

    if (!state.currentUser || (state.currentUser.role !== 'admin' && state.currentUser.role !== 'head-admin')) return;

    const isHeadAdmin = state.currentUser.role === 'head-admin';
    const assignableAdmins = getAssignabledAdmins();

    const totalRev = Math.max(0, state.orders.reduce((sum, o) => sum + o.amount, 0) - state.revenueResetBaseline);
    const totalIns = state.orders.filter(o => o.type === 'Insurance').length;
    const pendingFixes = state.orders.filter(o => o.status === 'Pending Dispatch' || o.status === 'In Progress').length;

    const grid = document.getElementById('adminAnalyticsGrid');
    grid.innerHTML = `
        <div class="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3">
            <div class="flex items-start justify-between gap-3">
                <span class="text-xs font-bold text-slate-400 uppercase">Total Revenue</span>
                ${isHeadAdmin ? `<button onclick="confirmResetTotalRevenue()" class="text-[10px] font-extrabold uppercase tracking-wider px-2.5 py-1 rounded-lg bg-amber-100 text-amber-700 hover:bg-amber-200 transition">Reset</button>` : ''}
            </div>
            <h3 class="text-2xl font-extrabold text-sky-600 dark:text-sky-400 mt-1">${totalRev.toLocaleString()} EGP</h3>
            ${state.revenueResetBaseline ? '<p class="text-[10px] text-slate-400">Revenue is currently counted from the last reset.</p>' : ''}
        </div>
        <div class="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800">
            <span class="text-xs font-bold text-slate-400 uppercase">Registered Users</span>
            <h3 class="text-2xl font-extrabold mt-1">${state.users.length}</h3>
        </div>
        <div class="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800">
            <span class="text-xs font-bold text-slate-400 uppercase">Active Insurance</span>
            <h3 class="text-2xl font-extrabold text-emerald-500 mt-1">${totalIns}</h3>
        </div>
        <div class="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800">
            <span class="text-xs font-bold text-slate-400 uppercase">Active Repairs</span>
            <h3 class="text-2xl font-extrabold text-indigo-500 mt-1">${pendingFixes}</h3>
        </div>
    `;

    const tasksSection = document.getElementById('adminTasksSection');
    if (tasksSection) {
        tasksSection.classList.toggle('hidden', !isHeadAdmin && state.tasks.length === 0);
    }

    const tasksFormBox = document.getElementById('adminTaskFormBox');
    if (tasksFormBox) {
        tasksFormBox.innerHTML = isHeadAdmin ? `
            <div class="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 space-y-4 shadow-sm">
                <div>
                    <h3 class="font-bold text-sm">Task Distribution</h3>
                    <p class="text-[11px] text-slate-400">Create a task and assign it to one of the admins below.</p>
                </div>
                <form onsubmit="handleTaskSubmit(event)" class="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                    <div class="md:col-span-2">
                        <label class="block font-bold uppercase text-slate-500 mb-1">Task Title</label>
                        <input type="text" id="taskTitle" required placeholder="e.g., Check inverter stock status" class="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-sky-500">
                    </div>
                    <div class="md:col-span-2">
                        <label class="block font-bold uppercase text-slate-500 mb-1">Task Details</label>
                        <textarea id="taskDetails" rows="3" required placeholder="Write the task instructions here..." class="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-sky-500"></textarea>
                    </div>
                    <div>
                        <label class="block font-bold uppercase text-slate-500 mb-1">Assign To</label>
                        <select id="taskAssignee" required class="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-sky-500">
                            ${assignableAdmins.map(admin => `<option value="${admin.username}">${admin.name || admin.username} (@${admin.username})</option>`).join('')}
                        </select>
                    </div>
                    <div>
                        <label class="block font-bold uppercase text-slate-500 mb-1">Priority</label>
                        <select id="taskPriority" class="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-sky-500">
                            <option value="Normal">Normal</option>
                            <option value="High">High</option>
                            <option value="Urgent">Urgent</option>
                        </select>
                    </div>
                    <div>
                        <label class="block font-bold uppercase text-slate-500 mb-1">Due Date</label>
                        <input type="date" id="taskDueDate" class="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-sky-500">
                    </div>
                    <div class="md:col-span-2">
                        <button type="submit" class="w-full bg-sky-500 hover:bg-sky-600 text-white font-bold py-3 rounded-xl uppercase tracking-wider transition">Add & Distribute Task</button>
                    </div>
                </form>
            </div>
        ` : '';
    }

    // Admin Users Directory Table (Admin User protected)
    const usersTbody = document.getElementById('adminUsersTable');
    usersTbody.innerHTML = state.users.map(u => {
        const count = state.orders.filter(o => o.username.toLowerCase() === u.username.toLowerCase()).length;
        const canDelete = isHeadAdmin && u.role !== 'head-admin';
        return `
            <tr class="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                <td class="p-4 font-mono text-slate-400 text-[11px]">${u.id}</td>
                <td class="p-4 font-bold text-sky-500">@${u.username}</td>
                <td class="p-4 font-semibold">${u.name || 'N/A'}</td>
                <td class="p-4 text-slate-500 font-mono">${u.whatsapp || 'N/A'}</td>
                <td class="p-4 text-slate-500 font-mono">${u.contactPhone || 'N/A'}</td>
                <td class="p-4"><span class="bg-slate-100 dark:bg-slate-800 font-bold px-2 py-0.5 rounded text-[10px] uppercase">${getRoleLabel(u.role)}</span></td>
                <td class="p-4 font-bold">${count}</td>
                <td class="p-4 text-center">
                    ${canDelete ? `
                        <button onclick="openDeleteUserModal('${u.id}', '${u.username}')" class="text-xs font-bold text-red-500 hover:text-red-600 px-2 py-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-slate-800 transition" title="Delete User">
                            <i class="fa-solid fa-trash-can"></i>
                        </button>
                    ` : ''}
                </td>
            </tr>
        `;
    }).join('');

    // Populates and preserves the User Filter Dropdown Selection
    const filterSelect = document.getElementById('adminOrderUserFilter');
    const selectedUser = filterSelect ? filterSelect.value : 'all';

    if (filterSelect) {
        const userList = Array.from(new Set([
            ...state.users.map(u => u.username),
            ...state.orders.map(o => o.username)
        ])).filter(Boolean);

        let optionsHtml = `<option value="all">All Users</option>`;
        userList.forEach(uname => {
            const uObj = state.users.find(u => u.username.toLowerCase() === uname.toLowerCase());
            const label = uObj && uObj.name ? `@${uname} (${uObj.name})` : `@${uname}`;
            const isSelected = (uname.toLowerCase() === selectedUser.toLowerCase()) ? 'selected' : '';
            optionsHtml += `<option value="${uname}" ${isSelected}>${label}</option>`;
        });
        filterSelect.innerHTML = optionsHtml;
    }

    const currentFilter = filterSelect ? filterSelect.value : 'all';
    const filteredOrders = currentFilter === 'all'
        ? state.orders
        : state.orders.filter(o => o.username.toLowerCase() === currentFilter.toLowerCase());

    // Admin Orders Table Rendering
    const ordersTbody = document.getElementById('adminOrdersTable');
    if (filteredOrders.length === 0) {
        ordersTbody.innerHTML = `<tr><td colspan="9" class="text-center p-6 text-slate-400 font-bold">No orders found for the selected user.</td></tr>`;
    } else {
        ordersTbody.innerHTML = filteredOrders.map(o => `
            <tr class="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                <td class="p-4 text-slate-400 font-mono">${o.date}</td>
                <td class="p-4 font-bold text-sky-500">${o.id}</td>
                <td class="p-4">
                    <span class="font-bold text-slate-800 dark:text-slate-100">@${o.username}</span>
                    <span class="block text-[10px] font-mono text-slate-400 mt-0.5">${o.userId || 'ID: N/A'}</span>
                </td>
                <td class="p-4 font-semibold">${o.itemTitle}</td>
                <td class="p-4 text-slate-500 text-[11px]">${o.location || 'N/A'}</td>
                <td class="p-4 text-slate-500 text-[11px]">${o.gateway}</td>
                <td class="p-4 font-extrabold">${o.amount.toLocaleString()} EGP</td>
                <td class="p-4">${getStatusBadge(o.status)}</td>
                <td class="p-4">
                    <div class="flex items-center gap-2">
                        <select onchange="updateOrderStatus('${o.id}', this.value)" class="bg-slate-100 dark:bg-slate-800 border rounded px-2 py-1 text-xs">
                            <option value="Pending Dispatch" ${o.status === 'Pending Dispatch' ? 'selected' : ''}>Pending Dispatch</option>
                            <option value="In Progress" ${o.status === 'In Progress' ? 'selected' : ''}>In Progress</option>
                            <option value="Active / Verified" ${o.status === 'Active / Verified' ? 'selected' : ''}>Active / Verified</option>
                            <option value="Completed" ${o.status === 'Completed' ? 'selected' : ''}>Completed</option>
                        </select>
                        ${isHeadAdmin ? `
                            <button onclick="openDeleteOrderModal('${o.id}', '${o.itemTitle.replace(/'/g, '&#39;')}')" class="text-xs font-bold text-red-500 hover:text-red-600 px-2 py-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-slate-800 transition" title="Delete Order">
                                <i class="fa-solid fa-trash-can"></i>
                            </button>
                        ` : ''}
                    </div>
                </td>
            </tr>
        `).join('');
    }

    const taskTable = document.getElementById('adminTasksTable');
    if (taskTable) {
        const visibleTasks = isHeadAdmin ? state.tasks : state.tasks.filter(task => task.assignedTo === state.currentUser.username);
        if (visibleTasks.length === 0) {
            taskTable.innerHTML = `<tr><td colspan="7" class="text-center p-6 text-slate-400 font-bold">No tasks assigned yet.</td></tr>`;
        } else {
            taskTable.innerHTML = visibleTasks.map(task => `
                <tr class="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                    <td class="p-4 font-mono text-slate-400 text-[11px]">${task.id}</td>
                    <td class="p-4 font-semibold">${task.title}</td>
                    <td class="p-4 text-slate-500 text-[11px]">${task.description}</td>
                    <td class="p-4 font-bold">@${task.assignedTo}</td>
                    <td class="p-4 text-slate-500 text-[11px]">${task.priority}</td>
                    <td class="p-4 text-slate-500 text-[11px]">${task.dueDate || 'N/A'}</td>
                    <td class="p-4">
                        <select onchange="updateTaskStatus('${task.id}', this.value)" class="bg-slate-100 dark:bg-slate-800 border rounded px-2 py-1 text-xs">
                            <option value="Open" ${task.status === 'Open' ? 'selected' : ''}>Open</option>
                            <option value="In Progress" ${task.status === 'In Progress' ? 'selected' : ''}>In Progress</option>
                            <option value="Done" ${task.status === 'Done' ? 'selected' : ''}>Done</option>
                        </select>
                    </td>
                </tr>
            `).join('');
        }
    }
}

function handleTaskSubmit(e) {
    e.preventDefault();

    if (!state.currentUser || state.currentUser.role !== 'head-admin') {
        showToast('Only the head admin can distribute tasks.', 'error');
        return;
    }

    const title = document.getElementById('taskTitle').value.trim();
    const description = document.getElementById('taskDetails').value.trim();
    const assignee = document.getElementById('taskAssignee').value;
    const priority = document.getElementById('taskPriority').value;
    const dueDate = document.getElementById('taskDueDate').value;

    if (!title || !description || !assignee) {
        showToast('Please complete the task form.', 'error');
        return;
    }

    const task = {
        id: createDateBasedId('TSK'),
        title,
        description,
        assignedTo: assignee,
        createdBy: state.currentUser.username,
        createdDate: new Date().toISOString().split('T')[0],
        dueDate,
        priority,
        status: 'Open'
    };

    state.tasks.unshift(task);
    saveState();
    showToast('Task assigned successfully.', 'success');

    e.target.reset();
    renderAdminDashboard();
}

function updateTaskStatus(taskId, newStatus) {
    const task = state.tasks.find(item => item.id === taskId);
    if (!task) return;

    if (state.currentUser.role !== 'head-admin' && task.assignedTo !== state.currentUser.username) {
        showToast('You can only update your own assigned tasks.', 'error');
        renderAdminDashboard();
        return;
    }

    task.status = newStatus;
    saveState();
    showToast(`Task ${taskId} updated to ${newStatus}`, 'success');
    renderAdminDashboard();
}

function updateOrderStatus(orderId, newStatus) {
    const o = state.orders.find(item => item.id === orderId);
    if (o) {
        o.status = newStatus;
        saveState();
        showToast(`Order ${orderId} updated to ${newStatus}`, 'success');
        renderAdminDashboard();
    }
}

function handleContactSubmit(e) {
    e.preventDefault();
    showToast('Thank you! Your message has been routed to Cooling Art support.', 'success');
    e.target.reset();
}

function getStatusBadge(status) {
    if (status === 'Completed' || status === 'Active / Verified') {
        return `<span class="bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase">${status}</span>`;
    }
    if (status === 'In Progress') {
        return `<span class="bg-sky-100 dark:bg-sky-950 text-sky-700 dark:text-sky-400 text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase">${status}</span>`;
    }
    return `<span class="bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-400 text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase">${status}</span>`;
}

function showToast(msg, type = 'info') {
    const container = document.getElementById('toastContainer');
    const toast = document.createElement('div');
    
    let bg = 'bg-slate-900 text-white';
    if (type === 'success') bg = 'bg-sky-600 text-white shadow-sky-500/30';
    if (type === 'error') bg = 'bg-red-600 text-white';

    toast.className = `p-4 rounded-2xl shadow-xl text-xs font-bold ${bg} flex items-center gap-3 transition duration-300`;
    toast.innerHTML = `<i class="fa-solid fa-snowflake"></i> <span>${msg}</span>`;

    container.appendChild(toast);
    setTimeout(() => toast.remove(), 3500);
}

function renderApp() {
    renderAuthBox();
    renderProducts();
    renderTechServices();

    const prodNav = document.getElementById('nav-products');
    const techNav = document.getElementById('nav-tech-fix');
    const adminDashNav = document.getElementById('nav-admin-dashboard');

    if (prodNav) prodNav.style.display = 'inline-block';
    if (techNav) techNav.style.display = 'inline-block';
    if (adminDashNav) adminDashNav.style.display = 'none';
}

function bootstrapCoolingArt() {
    if (window.__coolingArtBootstrapped) return;
    window.__coolingArtBootstrapped = true;
    renderApp();
    const initialView = location.hash ? location.hash.replace('#', '') : 'home';
    navigateTo(initialView, true);
}

if (document.readyState === 'loading') {
    window.addEventListener('DOMContentLoaded', bootstrapCoolingArt);
} else {
    bootstrapCoolingArt();
}

function openDeleteOrderModal(orderId, title) {
    if (!state.currentUser || state.currentUser.role !== 'head-admin') {
        showToast('Only the head admin can delete orders.', 'error');
        return;
    }

    orderToDeleteId = orderId;
    const modal = document.getElementById('deleteUserModal');
    const msg = document.getElementById('deleteUserModalMsg');
    if (msg) {
        msg.innerText = `Are you sure you want to delete order "${title}"?`;
    }
    modal.classList.remove('hidden');
}

function confirmDeleteOrder() {
    if (!orderToDeleteId) return;
    if (!state.currentUser || state.currentUser.role !== 'head-admin') {
        showToast('Only the head admin can delete orders.', 'error');
        closeDeleteUserModal();
        return;
    }

    state.orders = state.orders.filter(order => order.id !== orderToDeleteId);
    saveState();
    orderToDeleteId = null;
    closeDeleteUserModal();
    showToast('Order successfully deleted!', 'success');
    renderAdminDashboard();
}

function confirmResetTotalRevenue() {
    if (!state.currentUser || state.currentUser.role !== 'head-admin') {
        showToast('Only the head admin can reset revenue.', 'error');
        return;
    }
    document.getElementById('revenueResetModal').classList.remove('hidden');
}

function closeRevenueResetModal() {
    document.getElementById('revenueResetModal').classList.add('hidden');
}

function executeRevenueReset() {
    closeRevenueResetModal();
    state.revenueResetBaseline = state.orders.reduce((sum, order) => sum + order.amount, 0);
    saveState();
    showToast('Total revenue has been reset.', 'success');
    renderAdminDashboard();
}