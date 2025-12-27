// public/js/cart.js

function loadCart() {
  try {
    return JSON.parse(localStorage.getItem("kalpnik_cart")) || [];
  } catch {
    return [];
  }
}

function saveCart(cart) {
  localStorage.setItem("kalpnik_cart", JSON.stringify(cart));
}

const cartList = document.querySelector("[data-cart-list]");
const cartEmpty = document.querySelector("[data-cart-empty]");
const cartTotal = document.querySelector("[data-cart-total]");
const cartCount = document.querySelectorAll("[data-cart-count]");
const checkoutBtn = document.querySelector("[data-checkout-btn]");

function formatINR(value) {
  return `₹${Number(value || 0).toLocaleString("en-IN")}`;
}

function updateSummary(cart) {
  const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const count = cart.reduce((sum, item) => sum + item.quantity, 0);
  if (cartTotal) cartTotal.textContent = formatINR(total);
  cartCount.forEach(el => (el.textContent = count));
  if (checkoutBtn) checkoutBtn.disabled = cart.length === 0;
  
  // Also update the global Nav badge
  if(window.updateNavBadge) window.updateNavBadge();
}

function renderCart() {
  const cart = loadCart();
  if (!cartList) return;

  cartList.innerHTML = "";
  if (!cart.length) {
    cartEmpty.style.display = "flex";
    updateSummary(cart);
    return;
  }
  cartEmpty.style.display = "none";

  cart.forEach((item, index) => {
    const row = document.createElement("div");
    row.className = "cart-row fade-in-up";
    row.style.animationDelay = `${index * 70}ms`;

    // FIX: Uses 'imageUrl' matching the new products.js
    const imgSrc = item.imageUrl || item.image || "https://placehold.co/80x80?text=No+Img";

    row.innerHTML = `
      <div class="cart-item-main">
        <img src="${imgSrc}" alt="${item.name}">
        <div>
          <h4>${item.name}</h4>
          <p class="cart-price">${formatINR(item.price)}</p>
        </div>
      </div>
      <div class="cart-item-actions">
        <div class="qty-control">
          <button type="button" data-qty-minus>-</button>
          <input type="number" value="${item.quantity}" min="1">
          <button type="button" data-qty-plus>+</button>
        </div>
        <p class="cart-line">${formatINR(item.price * item.quantity)}</p>
        <button class="icon-btn" type="button" data-remove>&times;</button>
      </div>
    `;

    const minusBtn = row.querySelector("[data-qty-minus]");
    const plusBtn = row.querySelector("[data-qty-plus]");
    const qtyInput = row.querySelector("input[type='number']");
    const removeBtn = row.querySelector("[data-remove]");

    minusBtn.addEventListener("click", () => {
      let cart = loadCart();
      if (cart[index].quantity > 1) {
        cart[index].quantity -= 1;
      }
      saveCart(cart);
      renderCart();
    });

    plusBtn.addEventListener("click", () => {
      let cart = loadCart();
      cart[index].quantity += 1;
      saveCart(cart);
      renderCart();
    });

    qtyInput.addEventListener("change", () => {
      let cart = loadCart();
      let value = parseInt(qtyInput.value || "1", 10);
      if (Number.isNaN(value) || value < 1) value = 1;
      cart[index].quantity = value;
      saveCart(cart);
      renderCart();
    });

    removeBtn.addEventListener("click", () => {
      let cart = loadCart();
      cart.splice(index, 1);
      saveCart(cart);
      renderCart();
    });

    cartList.appendChild(row);
  });

  updateSummary(cart);
}

checkoutBtn?.addEventListener("click", () => {
  window.location.href = "checkout.html";
});

// Add to global scope so products.js can call it
window.updateNavBadge = function() {
  const cart = loadCart();
  const count = cart.reduce((sum, item) => sum + item.quantity, 0);
  
  const navLinks = document.querySelectorAll('.nav-links a');
  navLinks.forEach(link => {
    if (link.textContent.includes("Cart")) {
      if (count > 0) {
        link.innerHTML = `Cart <span style="background:#ff3502; color:white; padding:2px 6px; border-radius:10px; font-size:0.75rem; margin-left:5px;">${count}</span>`;
      } else {
        link.textContent = "Cart";
      }
    }
  });
};

document.addEventListener("DOMContentLoaded", () => {
  renderCart();
  window.updateNavBadge();
});