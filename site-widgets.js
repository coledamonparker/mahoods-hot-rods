/* ==========================================================================
   Universal Business Template Runtime (site-widgets.js)
   Handles:
   1. Mobile Hamburger Navigation Drawer
   2. Interactive Before & After Image Comparison Sliders
   3. Filterable Photo Gallery & Fullscreen Lightbox Modal
   4. Products / Packages Storefront, Cart Drawer & Email/Stripe Checkout
   5. General Contact Form Submission (FormSubmit AJAX + mailto fallback)
   6. Dynamic Service-Specific Order Form (open-order.html with dropdown switcher)
   ========================================================================== */

document.addEventListener('DOMContentLoaded', function () {
  const CFG = window.SITE_CONFIG || {};
  const RECIPIENT_EMAIL = CFG.recipientEmail || 'orders@example.com';
  const BUSINESS_NAME = CFG.businessName || 'Our Team';
  const PHONE = CFG.phone || '';

  /* ------------------------------------------------------------------------
     1. Mobile Navigation Drawer
     ------------------------------------------------------------------------ */
  const menuToggle = document.getElementById('menuToggle');
  const mobileDrawer = document.getElementById('mobileDrawer');
  if (menuToggle && mobileDrawer) {
    function closeMenu() {
      menuToggle.setAttribute('aria-expanded', 'false');
      menuToggle.classList.remove('is-active');
      mobileDrawer.hidden = true;
    }
    menuToggle.addEventListener('click', function () {
      const expanded = menuToggle.getAttribute('aria-expanded') === 'true';
      if (expanded) {
        closeMenu();
      } else {
        menuToggle.setAttribute('aria-expanded', 'true');
        menuToggle.classList.add('is-active');
        mobileDrawer.hidden = false;
      }
    });
    document.querySelectorAll('.mobile-link').forEach(link => {
      link.addEventListener('click', closeMenu);
    });
  }

  /* ------------------------------------------------------------------------
     2. Interactive Before & After Sliders
     ------------------------------------------------------------------------ */
  document.querySelectorAll('.ba-viewport').forEach(viewport => {
    const rangeInput = viewport.querySelector('.ba-range-input');
    if (!rangeInput) return;
    const updateSlider = () => {
      viewport.style.setProperty('--pos', rangeInput.value + '%');
    };
    rangeInput.addEventListener('input', updateSlider);
    updateSlider();
  });

  /* ------------------------------------------------------------------------
     3. Filterable Photo Gallery & Lightbox Modal
     ------------------------------------------------------------------------ */
  const filterBtns = document.querySelectorAll('.filter-pill-btn');
  const galleryCards = document.querySelectorAll('.gallery-card');
  filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const cat = btn.getAttribute('data-filter');
      filterBtns.forEach(b => b.classList.toggle('active', b === btn));
      galleryCards.forEach(card => {
        const cardCat = card.getAttribute('data-category') || 'all';
        card.style.display = (cat === 'all' || cardCat === cat) ? '' : 'none';
      });
    });
  });

  const lightbox = document.getElementById('lightboxModal');
  if (lightbox) {
    const lbImg = document.getElementById('lightboxImg');
    const lbCap = document.getElementById('lightboxCaption');
    const lbClose = document.getElementById('lightboxClose');
    galleryCards.forEach(card => {
      card.addEventListener('click', () => {
        const img = card.querySelector('img');
        const cap = card.querySelector('figcaption');
        if (img && lbImg) {
          lbImg.src = img.src;
          lbImg.alt = img.alt;
          if (lbCap) lbCap.textContent = cap ? cap.textContent : img.alt;
          lightbox.hidden = false;
        }
      });
    });
    const closeLb = () => { lightbox.hidden = true; };
    if (lbClose) lbClose.addEventListener('click', closeLb);
    lightbox.addEventListener('click', e => {
      if (e.target === lightbox) closeLb();
    });
  }

  /* ------------------------------------------------------------------------
     4. Products / Packages Storefront & Slide-Over Checkout Cart
     ------------------------------------------------------------------------ */
  const cartDrawer = document.getElementById('cartDrawer');
  const cartBackdrop = document.getElementById('cartBackdrop');
  const cartTrigger = document.getElementById('cartTriggerBtn');
  const cartClose = document.getElementById('cartCloseBtn');
  const cartCountBadge = document.getElementById('cartCountBadge');
  const cartItemsList = document.getElementById('cartItemsList');
  const cartTotalValue = document.getElementById('cartTotalValue');
  const cartCheckoutForm = document.getElementById('cartCheckoutForm');

  let cart = [];

  function openCart() {
    if (cartDrawer && cartBackdrop) {
      cartDrawer.hidden = false;
      cartBackdrop.hidden = false;
    }
  }
  function closeCart() {
    if (cartDrawer && cartBackdrop) {
      cartDrawer.hidden = true;
      cartBackdrop.hidden = true;
    }
  }
  if (cartTrigger) cartTrigger.addEventListener('click', openCart);
  if (cartClose) cartClose.addEventListener('click', closeCart);
  if (cartBackdrop) cartBackdrop.addEventListener('click', closeCart);

  function renderCart() {
    const totalCount = cart.reduce((acc, item) => acc + item.qty, 0);
    const totalSum = cart.reduce((acc, item) => acc + item.price * item.qty, 0);
    if (cartCountBadge) cartCountBadge.textContent = String(totalCount);
    if (cartTotalValue) cartTotalValue.textContent = '$' + totalSum.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

    if (!cartItemsList) return;
    if (cart.length === 0) {
      cartItemsList.innerHTML = '<p style="color:var(--brand-muted);font-size:0.9rem;padding:1rem 0;">Your cart is empty. Select a package or product to get started.</p>';
      return;
    }
    cartItemsList.innerHTML = cart.map((item, idx) => `
      <div class="cart-item-row">
        <div>
          <div class="cart-item-title">${item.name}</div>
          <div class="cart-item-meta">$${item.price.toLocaleString()} each</div>
        </div>
        <div class="cart-qty-controls">
          <button type="button" class="cart-qty-btn" data-idx="${idx}" data-delta="-1">&minus;</button>
          <span>${item.qty}</span>
          <button type="button" class="cart-qty-btn" data-idx="${idx}" data-delta="1">+</button>
        </div>
      </div>
    `).join('');

    cartItemsList.querySelectorAll('.cart-qty-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const idx = parseInt(btn.getAttribute('data-idx'), 10);
        const delta = parseInt(btn.getAttribute('data-delta'), 10);
        if (cart[idx]) {
          cart[idx].qty += delta;
          if (cart[idx].qty <= 0) cart.splice(idx, 1);
          renderCart();
        }
      });
    });
  }

  document.querySelectorAll('.add-to-cart-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = btn.getAttribute('data-id');
      const name = btn.getAttribute('data-name');
      const price = parseFloat(btn.getAttribute('data-price') || '0');
      const checkoutUrl = btn.getAttribute('data-checkout-url') || '';

      if (checkoutUrl) {
        window.open(checkoutUrl, '_blank', 'noopener');
        return;
      }

      const existing = cart.find(i => i.id === id);
      if (existing) {
        existing.qty += 1;
      } else {
        cart.push({ id, name, price, qty: 1 });
      }
      renderCart();
      openCart();
    });
  });

  if (cartCheckoutForm) {
    cartCheckoutForm.addEventListener('submit', async function (e) {
      e.preventDefault();
      if (cart.length === 0) return;
      const fd = new FormData(cartCheckoutForm);
      const customerName = fd.get('Customer_Name') || '';
      const customerEmail = fd.get('Customer_Email') || '';
      const customerPhone = fd.get('Customer_Phone') || '';
      const customerNotes = fd.get('Order_Notes') || '';
      const totalSum = cart.reduce((acc, item) => acc + item.price * item.qty, 0);
      const itemSummary = cart.map(i => `${i.qty}x ${i.name} ($${(i.price * i.qty).toLocaleString()})`).join('; ');

      const payload = {
        '_subject': `NEW PURCHASE ORDER ($${totalSum.toLocaleString()}) - ${customerName}`,
        '_template': 'table',
        '_captcha': 'false',
        'Customer Name': customerName,
        'Customer Email': customerEmail,
        'Customer Phone': customerPhone,
        'Items Ordered': itemSummary,
        'Order Total': `$${totalSum.toLocaleString()}`,
        'Notes / Delivery Info': customerNotes
      };

      const statusBox = document.getElementById('cartCheckoutStatus');
      let delivered = false;
      try {
        const res = await fetch(`https://formsubmit.co/ajax/${RECIPIENT_EMAIL}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
          body: JSON.stringify(payload)
        });
        if (res.ok) delivered = true;
      } catch (err) {
        delivered = false;
      }

      const mailto = `mailto:${RECIPIENT_EMAIL}?subject=${encodeURIComponent(payload['_subject'])}&body=${encodeURIComponent(`Order Items: ${itemSummary}\nTotal: $${totalSum.toLocaleString()}\nCustomer: ${customerName} (${customerEmail}, ${customerPhone})\nNotes: ${customerNotes}`)}`;

      if (statusBox) {
        statusBox.hidden = false;
        statusBox.className = 'form-status success';
        statusBox.innerHTML = `<strong>Order Sent!</strong> Total: $${totalSum.toLocaleString()}. <a href="${mailto}" style="text-decoration:underline;font-weight:700;">Click here to confirm via email</a>.`;
      }
      if (!delivered) window.location.href = mailto;
      cart = [];
      renderCart();
      cartCheckoutForm.reset();
    });
  }

  /* ------------------------------------------------------------------------
     5. General Contact Form
     ------------------------------------------------------------------------ */
  const contactForm = document.getElementById('contactForm');
  if (contactForm) {
    const statusBox = document.getElementById('formStatus');
    contactForm.addEventListener('submit', async function (e) {
      e.preventDefault();
      const fd = new FormData(contactForm);
      const payload = { '_subject': `Website Inquiry - ${BUSINESS_NAME}`, '_template': 'table', '_captcha': 'false' };
      const lines = [];
      for (const [k, v] of fd.entries()) {
        const clean = String(v).trim();
        if (clean) {
          payload[k] = clean;
          lines.push(`${k}: ${clean}`);
        }
      }
      try {
        await fetch(`https://formsubmit.co/ajax/${RECIPIENT_EMAIL}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
          body: JSON.stringify(payload)
        });
      } catch (err) {}

      if (statusBox) {
        statusBox.hidden = false;
        statusBox.className = 'form-status success';
        statusBox.innerHTML = `<strong>Thank you!</strong> Your message has been sent to ${BUSINESS_NAME}. ${PHONE ? `For immediate assistance call <a href="tel:${PHONE.replace(/[^0-9]/g, '')}">${PHONE}</a>.` : ''}`;
      }
      contactForm.reset();
    });
  }

  /* ------------------------------------------------------------------------
     6. Dedicated Service Order Form Page (open-order.html)
     ------------------------------------------------------------------------ */
  const txSelect = document.getElementById('txTypeSelect');
  const orderForm = document.getElementById('serviceOrderForm');
  const dynamicFieldsMount = document.getElementById('dynamicServiceFieldsMount');
  const schemas = CFG.orderSchemas || {};

  if (txSelect && orderForm && dynamicFieldsMount) {
    function renderServiceFields(slug) {
      const schema = schemas[slug] || Object.values(schemas)[0];
      if (!schema) return;
      const helperEl = document.getElementById('txTypeHelper');
      if (helperEl) helperEl.textContent = schema.helper || '';

      dynamicFieldsMount.innerHTML = (schema.fields || []).map(f => {
        if (f.type === 'select') {
          return `
            <div class="form-group">
              <label for="fld_${f.name}">${f.label}${f.required ? ' *' : ''}</label>
              <select id="fld_${f.name}" name="${f.name}" ${f.required ? 'required' : ''}>
                ${(f.options || []).map(o => `<option value="${o}">${o}</option>`).join('')}
              </select>
            </div>
          `;
        }
        return `
          <div class="form-group">
            <label for="fld_${f.name}">${f.label}${f.required ? ' *' : ''}</label>
            <input type="${f.type || 'text'}" id="fld_${f.name}" name="${f.name}" ${f.required ? 'required' : ''} placeholder="${f.placeholder || ''}" />
          </div>
        `;
      }).join('');
    }

    const params = new URLSearchParams(window.location.search);
    const reqType = params.get('type');
    if (reqType && schemas[reqType]) {
      txSelect.value = reqType;
    }
    renderServiceFields(txSelect.value);
    txSelect.addEventListener('change', () => renderServiceFields(txSelect.value));

    orderForm.addEventListener('submit', async function (e) {
      e.preventDefault();
      const fd = new FormData(orderForm);
      const selectedSlug = txSelect.value;
      const schema = schemas[selectedSlug] || {};
      const serviceTitle = schema.title || selectedSlug;

      const payload = { 'Service / Order Type': serviceTitle };
      const lines = [`Service / Order Type: ${serviceTitle}`];
      for (const [k, v] of fd.entries()) {
        if (k === 'Service_Type') continue;
        const clean = String(v).trim();
        if (clean) {
          const label = k.replace(/_/g, ' ');
          payload[label] = clean;
          lines.push(`${label}: ${clean}`);
        }
      }

      const subj = `NEW ORDER [${serviceTitle}] - ${BUSINESS_NAME}`;
      payload['_subject'] = subj;
      payload['_template'] = 'table';
      payload['_captcha'] = 'false';

      const btn = document.getElementById('orderSubmitBtn');
      const statusEl = document.getElementById('orderFormStatus');
      if (btn) {
        btn.disabled = true;
        btn.textContent = 'Submitting Order...';
      }

      let delivered = false;
      try {
        const res = await fetch(`https://formsubmit.co/ajax/${RECIPIENT_EMAIL}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
          body: JSON.stringify(payload)
        });
        if (res.ok) delivered = true;
      } catch (err) {
        delivered = false;
      }

      const mailto = `mailto:${RECIPIENT_EMAIL}?subject=${encodeURIComponent(subj)}&body=${encodeURIComponent(lines.join('\n'))}`;
      if (statusEl) {
        statusEl.hidden = false;
        statusEl.className = 'form-status success';
        statusEl.innerHTML = `
          <strong>Order Routed to ${RECIPIENT_EMAIL}!</strong>
          <p style="margin-top:0.35rem;">We received your <em>${serviceTitle}</em> request. Need to attach a file or photo? <a href="${mailto}" style="font-weight:700;text-decoration:underline;">Click here to email attachments directly</a>.</p>
        `;
      }
      if (!delivered) window.location.href = mailto;
      if (btn) {
        btn.disabled = false;
        btn.textContent = 'Submit Order';
      }
    });
  }
});
