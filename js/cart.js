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
  window.updateNavBadge(); // Force update immediately
}

const cartList = document.querySelector("[data-cart-list]");
const cartEmpty = document.querySelector("[data-cart-empty]");
const cartSummaryShell = document.getElementById("cartSummaryShell");
const cartTotal = document.querySelector("[data-cart-total]");
const checkoutBtn = document.querySelector("[data-checkout-btn]");
const clearBtn = document.getElementById("clearCartBtn");

function formatINR(value) {
  return `₹${Number(value || 0).toLocaleString("en-IN")}`;
}

function updateSummary(cart) {
  const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  
  if (cartTotal) cartTotal.textContent = formatINR(total);
  
  // Toggle visibility of summary and clear button
  const isEmpty = cart.length === 0;
  if (cartSummaryShell) cartSummaryShell.style.display = isEmpty ? "none" : "block";
  if (clearBtn) clearBtn.style.display = isEmpty ? "none" : "block";
  if (cartEmpty) cartEmpty.style.display = isEmpty ? "block" : "none";
}

function renderCart() {
  const cart = loadCart();
  if (!cartList) return;

  cartList.innerHTML = "";
  
  if (!cart.length) {
    updateSummary(cart);
    return;
  }

  cart.forEach((item, index) => {
    const row = document.createElement("div");
    row.className = "cart-row fade-in-up";
    row.style.animationDelay = `${index * 50}ms`;

    // Modern layout
    row.innerHTML = `
      <div class="cart-item-main">
        <img src="${item.imageUrl || item.image || 'img/logo.png'}" alt="${item.name}" 
             style="width:70px; height:70px; object-fit:cover; border-radius:10px; background:#f0f0f0;">
        <div>
          <h4 style="margin:0 0 4px 0;">${item.name}</h4>
          <p class="cart-price" style="margin:0; color:#ff3502;">${formatINR(item.price)}</p>
        </div>
      </div>
      
      <div class="cart-item-actions">
        <div class="qty-control">
          <button type="button" data-qty-minus>-</button>
          <input type="number" value="${item.quantity}" min="1" readonly>
          <button type="button" data-qty-plus>+</button>
        </div>
        
        <div style="text-align:right;">
           <p style="margin:0; font-weight:600;">${formatINR(item.price * item.quantity)}</p>
           <button class="icon-btn" type="button" data-remove style="color:grey; font-size:0.8rem; text-decoration:underline; border:none; background:none; cursor:pointer; padding:0;">Remove</button>
        </div>
      </div>
    `;

    // Event Listeners
    const minusBtn = row.querySelector("[data-qty-minus]");
    const plusBtn = row.querySelector("[data-qty-plus]");
    const removeBtn = row.querySelector("[data-remove]");

    minusBtn.addEventListener("click", () => {
      let currentCart = loadCart();
      if (currentCart[index].quantity > 1) {
        currentCart[index].quantity -= 1;
        saveCart(currentCart);
        renderCart();
      }
    });

    plusBtn.addEventListener("click", () => {
      let currentCart = loadCart();
      currentCart[index].quantity += 1;
      saveCart(currentCart);
      renderCart();
    });

    removeBtn.addEventListener("click", () => {
      if(!confirm("Remove this item?")) return;
      let currentCart = loadCart();
      currentCart.splice(index, 1);
      saveCart(currentCart);
      renderCart();
    });

    cartList.appendChild(row);
  });

  updateSummary(cart);
}

// Clear Cart Logic
clearBtn?.addEventListener("click", () => {
  if(confirm("Are you sure you want to empty your cart?")) {
    localStorage.removeItem("kalpnik_cart");
    renderCart();
    window.updateNavBadge();
  }
});

checkoutBtn?.addEventListener("click", () => {
  window.location.href = "checkout.html";
});

// Global Badge Logic
window.updateNavBadge = function() {
  const cart = loadCart();
  const count = cart.reduce((sum, item) => sum + item.quantity, 0);
  
  const navLinks = document.querySelectorAll('.nav-links a');
  navLinks.forEach(link => {
    if (link.href.includes("cart.html")) {
      const badge = link.querySelector("span");
      if (badge) {
        if(count > 0) {
          badge.textContent = count;
          badge.style.display = "inline-block";
        } else {
          badge.style.display = "none";
        }
      }
    }
  });
};

// Init
document.addEventListener("DOMContentLoaded", () => {
  renderCart();
  window.updateNavBadge();
});