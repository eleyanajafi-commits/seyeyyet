/**
 * فروشگاه استیچ | STITCH Store Core Script
 * مدیریت سبد خرید، سفارش تلگرام، پاپ‌آپ‌ها، فیلترها و اعلان‌ها
 * بدون نیاز به وابستگی، فریم‌ورک یا مرحله ساخت
 */

// پیکربندی آیدی و شماره تلگرام
const TELEGRAM_CONFIG = {
  orderUsername: 'Stitch_Support', // نام کاربری پشتیبانی تلگرام جهت دریافت سفارشات
  channelUsername: 'Stitch_Store',  // کانال رسمی تلگرام
  phoneNumber: '۰۹۱۲۳۴۵۶۷۸۹',
  supportText: 'پشتیبانی ۲۴ ساعته تلگرام'
};

// وضعیت سبد خرید با ماندگاری در LocalStorage
let cart = [];
let appliedCoupon = null;

// کدهای تخفیف معتبر
const COUPONS = {
  'STITCH20': 0.20, // ۲۰ درصد تخفیف
  'WELCOME': 0.10,  // ۱۰ درصد تخفیف
  'VIP50': 500000   // ۵۰۰ هزار تومان تخفیف ثابت
};

// تبدیل اعداد انگلیسی به فارسی با جداکننده هزارگان
function formatPrice(amount) {
  if (isNaN(amount)) return '۰ تومان';
  const parts = Math.round(amount).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  const persianDigits = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
  const formatted = parts.replace(/\d/g, d => persianDigits[parseInt(d, 10)]);
  return `${formatted} تومان`;
}

function toPersianDigits(str) {
  if (str === null || str === undefined) return '';
  const persianDigits = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
  return str.toString().replace(/\d/g, d => persianDigits[parseInt(d, 10)]);
}

// بارگذاری سبد خرید از حافظه محلی
function loadCart() {
  try {
    const saved = localStorage.getItem('stitch_cart');
    if (saved) {
      cart = JSON.parse(saved);
    }
  } catch (e) {
    cart = [];
  }
  updateCartBadge();
  renderCartDrawer();
}

// ذخیره سبد خرید در حافظه محلی
function saveCart() {
  try {
    localStorage.setItem('stitch_cart', JSON.stringify(cart));
  } catch (e) {
    console.error('Failed to save cart to localStorage', e);
  }
  updateCartBadge();
  renderCartDrawer();
}

// به‌روزرسانی نشانگر تعداد اقلام در هدر
function updateCartBadge() {
  const badges = document.querySelectorAll('.cart-badge');
  const totalCount = cart.reduce((sum, item) => sum + item.quantity, 0);
  badges.forEach(b => {
    b.textContent = toPersianDigits(totalCount);
    b.style.display = totalCount > 0 ? 'flex' : 'none';
  });
}

// افزودن کالا به سبد خرید
function addToCart(productId, quantity = 1) {
  const product = PRODUCTS_DATA.find(p => p.id === productId);
  if (!product) return;

  const existingItem = cart.find(item => item.id === productId);
  if (existingItem) {
    existingItem.quantity += quantity;
  } else {
    cart.push({
      id: product.id,
      code: product.code,
      title: product.title,
      price: product.price,
      image: product.image,
      quantity: quantity
    });
  }

  saveCart();
  showToast(`«${product.title}» به سبد خرید افزوده شد`, 'success');
  openCartDrawer();
}

// تغییر تعداد کالا
function updateItemQuantity(productId, delta) {
  const item = cart.find(i => i.id === productId);
  if (!item) return;

  item.quantity += delta;
  if (item.quantity <= 0) {
    removeFromCart(productId);
  } else {
    saveCart();
  }
}

// حذف کالا از سبد
function removeFromCart(productId) {
  const itemIndex = cart.findIndex(i => i.id === productId);
  if (itemIndex > -1) {
    const removedTitle = cart[itemIndex].title;
    cart.splice(itemIndex, 1);
    saveCart();
    showToast(`«${removedTitle}» از سبد حذف شد`, 'success');
  }
}

// خالی کردن کامل سبد خرید
function clearCart() {
  cart = [];
  appliedCoupon = null;
  saveCart();
  showToast('سبد خرید با موفقیت خالی شد', 'success');
}

// باز و بسته کردن کشوی سبد خرید
function openCartDrawer() {
  const drawer = document.getElementById('cartDrawer');
  const backdrop = document.getElementById('cartDrawerBackdrop');
  if (drawer && backdrop) {
    drawer.classList.add('active');
    backdrop.classList.add('active');
    document.body.style.overflow = 'hidden';
  }
}

function closeCartDrawer() {
  const drawer = document.getElementById('cartDrawer');
  const backdrop = document.getElementById('cartDrawerBackdrop');
  if (drawer && backdrop) {
    drawer.classList.remove('active');
    backdrop.classList.remove('active');
    document.body.style.overflow = '';
  }
}

// رندر محتویات کشوی سبد خرید
function renderCartDrawer() {
  const bodyEl = document.getElementById('cartDrawerBody');
  const footerEl = document.getElementById('cartDrawerFooter');
  if (!bodyEl) return;

  if (cart.length === 0) {
    bodyEl.innerHTML = `
      <div class="cart-empty">
        <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" style="color: var(--text-dim);">
          <circle cx="8" cy="21" r="1"></circle>
          <circle cx="19" cy="21" r="1"></circle>
          <path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12"></path>
        </svg>
        <p style="font-size: 1.1rem; font-weight: 700;">سبد خرید شما خالی است</p>
        <p style="font-size: 0.88rem; color: var(--text-muted);">از میان محصولات شیک و دست‌ساز استیچ انتخاب کنید.</p>
        <a href="products.html" class="btn-primary" style="margin-top: 10px;" onclick="closeCartDrawer()">
          مشاهده کاتالوگ محصولات
        </a>
      </div>
    `;
    if (footerEl) footerEl.style.display = 'none';
    return;
  }

  if (footerEl) footerEl.style.display = 'block';

  let itemsHtml = '';
  let subtotal = 0;

  cart.forEach(item => {
    const itemTotal = item.price * item.quantity;
    subtotal += itemTotal;
    itemsHtml += `
      <div class="cart-item">
        <div class="cart-item-thumb">
          <img src="${item.image}" alt="${item.title}">
        </div>
        <div class="cart-item-info">
          <h4>${item.title}</h4>
          <div class="cart-item-price">${formatPrice(item.price)}</div>
          <div class="cart-qty-control">
            <button class="qty-btn" onclick="updateItemQuantity(${item.id}, -1)">−</button>
            <span style="font-weight: 700; font-size: 0.95rem; min-width: 20px; text-align: center;">${toPersianDigits(item.quantity)}</span>
            <button class="qty-btn" onclick="updateItemQuantity(${item.id}, 1)">+</button>
          </div>
        </div>
        <button onclick="removeFromCart(${item.id})" style="color: var(--accent-rose); padding: 8px;" title="حذف">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="3 6 5 6 21 6"></polyline>
            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
          </svg>
        </button>
      </div>
    `;
  });

  bodyEl.innerHTML = itemsHtml;

  // محاسبه تخفیف
  let discountAmount = 0;
  if (appliedCoupon) {
    if (typeof appliedCoupon.value === 'number' && appliedCoupon.value < 1) {
      discountAmount = subtotal * appliedCoupon.value;
    } else {
      discountAmount = appliedCoupon.value;
    }
  }

  const finalTotal = Math.max(0, subtotal - discountAmount);

  const subtotalEl = document.getElementById('cartSubtotal');
  const discountRowEl = document.getElementById('cartDiscountRow');
  const discountEl = document.getElementById('cartDiscount');
  const totalEl = document.getElementById('cartTotal');

  if (subtotalEl) subtotalEl.textContent = formatPrice(subtotal);
  if (discountRowEl && discountEl) {
    if (discountAmount > 0) {
      discountRowEl.style.display = 'flex';
      discountEl.textContent = `- ${formatPrice(discountAmount)}`;
    } else {
      discountRowEl.style.display = 'none';
    }
  }
  if (totalEl) totalEl.textContent = formatPrice(finalTotal);
}

// ثبت سفارش کالا تک به صورت مستقیم در تلگرام
function directTelegramOrder(productId) {
  const product = PRODUCTS_DATA.find(p => p.id === productId);
  if (!product) return;

  const text = `سلام و احترام! 👋
من متقاضی خرید این محصول از وبسایت استیچ هستم:

🏷️ *محصول:* ${product.title}
🔢 *کد محصول:* ${product.code}
💰 *قیمت:* ${formatPrice(product.price)}

لطفاً شرایط ارسال و هماهنگی پرداخت را اعلام فرمایید. سپاسگزارم.`;

  const url = `https://t.me/${TELEGRAM_CONFIG.orderUsername}?text=${encodeURIComponent(text)}`;
  window.open(url, '_blank');
  showToast('در حال انتقال به تلگرام جهت ثبت سفارش...', 'telegram');
}

// باز کردن مودال تکمیل اطلاعات سفارش تلگرام
function openTelegramCheckoutModal() {
  if (cart.length === 0) {
    showToast('ابتدا محصولی به سبد خرید اضافه کنید', 'success');
    return;
  }
  closeCartDrawer();
  const modal = document.getElementById('telegramOrderModal');
  if (modal) {
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
  }
}

function closeTelegramCheckoutModal() {
  const modal = document.getElementById('telegramOrderModal');
  if (modal) {
    modal.classList.remove('active');
    document.body.style.overflow = '';
  }
}

// ارسال فاکتور سبد خرید به تلگرام
function submitTelegramOrder(event) {
  if (event) event.preventDefault();

  const nameInput = document.getElementById('orderCustomerName');
  const phoneInput = document.getElementById('orderCustomerPhone');
  const addressInput = document.getElementById('orderCustomerAddress');
  const noteInput = document.getElementById('orderCustomerNote');

  const name = nameInput ? nameInput.value.trim() : '';
  const phone = phoneInput ? phoneInput.value.trim() : '';
  const address = addressInput ? addressInput.value.trim() : '';
  const note = noteInput ? noteInput.value.trim() : '';

  if (!name || !phone) {
    showToast('لطفاً نام و شماره تماس خود را وارد نمایید', 'success');
    return;
  }

  let subtotal = 0;
  let itemsListText = '';

  cart.forEach((item, index) => {
    const itemTotal = item.price * item.quantity;
    subtotal += itemTotal;
    itemsListText += `${toPersianDigits(index + 1)}. ${item.title} (کد: ${item.code})\n   تعداد: ${toPersianDigits(item.quantity)} عدد | فی: ${formatPrice(item.price)} | کل: ${formatPrice(item.itemTotal || itemTotal)}\n`;
  });

  let discountAmount = 0;
  if (appliedCoupon) {
    if (typeof appliedCoupon.value === 'number' && appliedCoupon.value < 1) {
      discountAmount = subtotal * appliedCoupon.value;
    } else {
      discountAmount = appliedCoupon.value;
    }
  }
  const finalTotal = Math.max(0, subtotal - discountAmount);

  let message = `🛍️ *سفارش جدید از وبسایت استیچ*\n`;
  message += `━━━━━━━━━━━━━━━━━━━━\n`;
  message += `👤 *مشخصات مشتری:*\n`;
  message += `• نام و نام خانوادگی: ${name}\n`;
  message += `• شماره تماس: ${phone}\n`;
  if (address) message += `• آدرس پستی: ${address}\n`;
  if (note) message += `• توضیحات تکمیلی: ${note}\n`;
  message += `━━━━━━━━━━━━━━━━━━━━\n`;
  message += `📦 *اقلام سفارش:*\n\n${itemsListText}\n`;
  message += `━━━━━━━━━━━━━━━━━━━━\n`;
  message += `💰 *جمع اقلام:* ${formatPrice(subtotal)}\n`;
  if (discountAmount > 0) {
    message += `🎁 *تخفیف (${appliedCoupon.code}):* ${formatPrice(discountAmount)}-\n`;
  }
  message += `💳 *مبلغ نهایی قابل پرداخت:* ${formatPrice(finalTotal)}\n`;
  message += `━━━━━━━━━━━━━━━━━━━━\n`;
  message += `✨ لطفاً جهت تایید فاکتور و شماره کارت پاسخ دهید.`;

  // کپی در کلیپ‌بورد به عنوان پشتیبان
  if (navigator.clipboard) {
    navigator.clipboard.writeText(message).catch(() => {});
  }

  const telegramUrl = `https://t.me/${TELEGRAM_CONFIG.orderUsername}?text=${encodeURIComponent(message)}`;
  window.open(telegramUrl, '_blank');

  closeTelegramCheckoutModal();
  showToast('متن سفارش تولید و به تلگرام ارسال شد!', 'telegram');
}

// اعمال کد تخفیف
function applyPromoCode() {
  const input = document.getElementById('promoCodeInput');
  if (!input) return;
  const code = input.value.trim().toUpperCase();

  if (!code) {
    showToast('لطفاً کد تخفیف را وارد کنید', 'success');
    return;
  }

  if (COUPONS[code]) {
    appliedCoupon = { code: code, value: COUPONS[code] };
    saveCart();
    showToast(`کد تخفیف ${code} با موفقیت اعمال شد`, 'success');
  } else {
    showToast('کد تخفیف وارد شده معتبر نیست', 'success');
  }
}

// نمایش پاپ‌آپ جزییات سریع محصول (Quick View)
function openQuickView(productId) {
  const product = PRODUCTS_DATA.find(p => p.id === productId);
  if (!product) return;

  const modal = document.getElementById('quickViewModal');
  const content = document.getElementById('quickViewContent');
  if (!modal || !content) return;

  let specsHtml = '';
  if (product.specs) {
    specsHtml = '<div style="margin: 20px 0; border-top: 1px solid var(--border-glass); padding-top: 15px;">';
    specsHtml += '<h5 style="font-weight: 700; margin-bottom: 10px; font-size: 0.95rem; color: var(--accent-cyan);">مشخصات تخصصی:</h5>';
    specsHtml += '<div style="display: grid; grid-template-columns: 1fr; gap: 8px;">';
    for (const [key, val] of Object.entries(product.specs)) {
      specsHtml += `<div style="display: flex; justify-content: space-between; font-size: 0.88rem; padding: 4px 0; border-bottom: 1px dashed rgba(255,255,255,0.06);"><span style="color: var(--text-muted);">${key}:</span><span style="font-weight: 600;">${val}</span></div>`;
    }
    specsHtml += '</div></div>';
  }

  content.innerHTML = `
    <div style="display: grid; grid-template-columns: 1fr 1.2fr; gap: 28px; align-items: start;">
      <div style="border-radius: var(--radius-md); overflow: hidden; border: 1px solid var(--border-glass-bright); aspect-ratio: 1/1;">
        <img src="${product.image}" alt="${product.title}" style="width: 100%; height: 100%; object-fit: cover;">
      </div>
      <div>
        <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 10px;">
          <span style="color: var(--accent-cyan); font-size: 0.85rem; font-weight: 700;">${product.categoryName}</span>
          <span style="background: rgba(255,255,255,0.08); padding: 4px 10px; border-radius: 20px; font-size: 0.8rem; color: var(--text-muted);">کد: ${product.code}</span>
        </div>
        <h3 style="font-size: 1.4rem; font-weight: 800; margin-bottom: 12px; line-height: 1.4;">${product.title}</h3>
        <p style="color: var(--text-muted); font-size: 0.92rem; line-height: 1.7; margin-bottom: 16px;">${product.description}</p>
        
        <div style="display: flex; align-items: baseline; gap: 14px; margin-bottom: 20px;">
          <span style="font-size: 1.5rem; font-weight: 900; color: #fff;">${formatPrice(product.price)}</span>
          ${product.oldPrice ? `<span style="font-size: 1rem; color: var(--text-dim); text-decoration: line-through;">${formatPrice(product.oldPrice)}</span>` : ''}
        </div>

        ${specsHtml}

        <div style="display: flex; gap: 12px; margin-top: 24px;">
          <button class="btn-primary" style="flex: 1;" onclick="addToCart(${product.id}); closeQuickView();">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="9" cy="21" r="1"></circle><circle cx="20" cy="21" r="1"></circle><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path></svg>
            افزودن به سبد
          </button>
          <button class="btn-checkout-telegram" style="width: auto; padding: 0 20px;" onclick="directTelegramOrder(${product.id}); closeQuickView();" title="سفارش سریع در تلگرام">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69a.2.2 0 00-.05-.18c-.06-.05-.14-.03-.21-.02-.09.02-1.49.95-4.22 2.79-.4.27-.76.41-1.08.4-.36-.01-1.04-.2-1.55-.37-.63-.2-1.12-.31-1.08-.66.02-.18.27-.36.74-.55 2.92-1.27 4.86-2.11 5.83-2.51 2.78-1.16 3.35-1.36 3.73-1.36.08 0 .27.02.39.12.1.08.13.19.14.27-.01.06.01.24 0 .38z"/></svg>
            سفارش تلگرام
          </button>
        </div>
      </div>
    </div>
  `;

  modal.classList.add('active');
  document.body.style.overflow = 'hidden';
}

function closeQuickView() {
  const modal = document.getElementById('quickViewModal');
  if (modal) {
    modal.classList.remove('active');
    document.body.style.overflow = '';
  }
}

// سیستم اعلان‌های توست
function showToast(message, type = 'success') {
  let container = document.getElementById('toastContainer');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toastContainer';
    container.className = 'toast-container';
    document.body.appendChild(container);
  }

  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;

  const iconSuccess = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="color: var(--accent-emerald);"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>`;
  const iconTelegram = `<svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" style="color: var(--telegram-color);"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69a.2.2 0 00-.05-.18c-.06-.05-.14-.03-.21-.02-.09.02-1.49.95-4.22 2.79-.4.27-.76.41-1.08.4-.36-.01-1.04-.2-1.55-.37-.63-.2-1.12-.31-1.08-.66.02-.18.27-.36.74-.55 2.92-1.27 4.86-2.11 5.83-2.51 2.78-1.16 3.35-1.36 3.73-1.36.08 0 .27.02.39.12.1.08.13.19.14.27-.01.06.01.24 0 .38z"/></svg>`;

  toast.innerHTML = `
    ${type === 'telegram' ? iconTelegram : iconSuccess}
    <span>${message}</span>
  `;

  container.appendChild(toast);
  setTimeout(() => toast.classList.add('show'), 10);

  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => toast.remove(), 400);
  }, 4000);
}

// منوی موبایل
function toggleMobileMenu() {
  const navLinks = document.querySelector('.nav-links');
  if (navLinks) {
    navLinks.classList.toggle('active');
  }
}

// فیلتر و جستجوی محصولات در صفحه products.html
let activeCategory = 'all';
let searchQuery = '';

function filterProducts() {
  const container = document.getElementById('productsGridContainer');
  const countEl = document.getElementById('productsFoundCount');
  if (!container) return;

  const filtered = PRODUCTS_DATA.filter(p => {
    const matchCategory = activeCategory === 'all' || p.category === activeCategory;
    const matchSearch = !searchQuery || 
      p.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
      p.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.code.toLowerCase().includes(searchQuery.toLowerCase());
    return matchCategory && matchSearch;
  });

  if (countEl) {
    countEl.textContent = `${toPersianDigits(filtered.length)} محصول`;
  }

  if (filtered.length === 0) {
    container.innerHTML = `
      <div style="grid-column: 1/-1; text-align: center; padding: 60px 20px; color: var(--text-muted);">
        <p style="font-size: 1.2rem; font-weight: 700; margin-bottom: 8px;">محصولی مطابق با فیلتر شما یافت نشد</p>
        <p style="font-size: 0.9rem;">لطفاً کلمه کلیدی دیگری جستجو کنید یا دسته‌بندی را تغییر دهید.</p>
      </div>
    `;
    return;
  }

  container.innerHTML = filtered.map(p => createProductCardHtml(p)).join('');
}

function setCategoryFilter(categoryId, btn) {
  activeCategory = categoryId;
  const buttons = document.querySelectorAll('.filter-btn');
  buttons.forEach(b => b.classList.remove('active'));
  if (btn) btn.classList.add('active');
  filterProducts();
}

function handleSearchInput(e) {
  searchQuery = e.target.value.trim();
  filterProducts();
}

// تولید کد HTML کارت محصول
function createProductCardHtml(product) {
  let badgeHtml = '';
  if (product.badge) {
    badgeHtml = `<span class="badge badge-${product.badgeType}">${product.badge}</span>`;
  }

  return `
    <div class="glass-card product-card">
      <div class="product-img-wrapper">
        <div class="product-badges">
          ${badgeHtml}
        </div>
        <img src="${product.image}" alt="${product.title}" loading="lazy">
        <button class="product-quick-btn" onclick="openQuickView(${product.id})">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
          مشاهده جزییات
        </button>
      </div>
      <div class="product-info">
        <div class="product-category">${product.categoryName}</div>
        <h3 class="product-title">${product.title}</h3>
        <div class="product-rating">
          ★ ★ ★ ★ ★
          <span>(${toPersianDigits(product.reviewsCount)})</span>
        </div>
        <div class="product-price-row">
          <span class="price-current">${formatPrice(product.price)}</span>
          ${product.oldPrice ? `<span class="price-old">${formatPrice(product.oldPrice)}</span>` : ''}
        </div>
        <div class="product-actions">
          <button class="btn-add-cart" onclick="addToCart(${product.id})">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="9" cy="21" r="1"></circle><circle cx="20" cy="21" r="1"></circle><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path></svg>
            افزودن به سبد
          </button>
          <button class="btn-order-telegram" onclick="directTelegramOrder(${product.id})" title="سفارش سریع این محصول در تلگرام">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69a.2.2 0 00-.05-.18c-.06-.05-.14-.03-.21-.02-.09.02-1.49.95-4.22 2.79-.4.27-.76.41-1.08.4-.36-.01-1.04-.2-1.55-.37-.63-.2-1.12-.31-1.08-.66.02-.18.27-.36.74-.55 2.92-1.27 4.86-2.11 5.83-2.51 2.78-1.16 3.35-1.36 3.73-1.36.08 0 .27.02.39.12.1.08.13.19.14.27-.01.06.01.24 0 .38z"/></svg>
          </button>
        </div>
      </div>
    </div>
  `;
}

// مقداردهی اولیه پس از بارگذاری صفحه
document.addEventListener('DOMContentLoaded', () => {
  loadCart();

  // تنظیم لینک فعال در نوار ناوبری
  const currentPath = window.location.pathname.split('/').pop() || 'index.html';
  const navLinks = document.querySelectorAll('.nav-link');
  navLinks.forEach(link => {
    const href = link.getAttribute('href');
    if (href === currentPath || (currentPath === '' && href === 'index.html')) {
      link.classList.add('active');
    } else {
      link.classList.remove('active');
    }
  });

  // بارگذاری محصولات ویژه در صفحه اصلی
  const featuredContainer = document.getElementById('featuredProductsGrid');
  if (featuredContainer && typeof PRODUCTS_DATA !== 'undefined') {
    const featuredList = PRODUCTS_DATA.filter(p => p.featured);
    featuredContainer.innerHTML = featuredList.map(p => createProductCardHtml(p)).join('');
  }

  // بارگذاری کاتالوگ در صفحه محصولات
  const productsContainer = document.getElementById('productsGridContainer');
  if (productsContainer && typeof PRODUCTS_DATA !== 'undefined') {
    filterProducts();
  }

  // بستن با کلید ESC
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      closeCartDrawer();
      closeTelegramCheckoutModal();
      closeQuickView();
    }
  });
});
