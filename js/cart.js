// public/js/cart.js

function loadCart() {
  try { return JSON.parse(localStorage.getItem("kalpnik_cart")) || []; } 
  catch { return []; }
}
function saveCart(cart) {
  localStorage.setItem("kalpnik_cart", JSON.stringify(cart));
  if(window.updateNavBadge) window.updateNavBadge();
}
function formatINR(val) {
  return "₹" + Number(val || 0).toLocaleString("en-IN");
}

const cartList = document.getElementById("cartList");
const cartEmpty = document.getElementById("cartEmpty");
const cartFooter = document.getElementById("cartFooter");
const totalDisplay = document.getElementById("cartTotalDisplay");
const checkoutBtn = document.getElementById("checkoutBtn");

function renderCart() {
  const cart = loadCart();
  
  if (cart.length === 0) {
    if(cartList) cartList.style.display = "none";
    if(cartFooter) cartFooter.style.display = "none";
    if(cartEmpty) cartEmpty.style.display = "block";
    return;
  }

  if(cartEmpty) cartEmpty.style.display = "none";
  if(cartList) cartList.style.display = "flex";
  if(cartFooter) cartFooter.style.display = "block";
  cartList.innerHTML = "";

  let total = 0;

  cart.forEach((item, index) => {
    // FIX: Safety check for bad data
    const price = Number(item.price) || 0;
    const qty = Number(item.quantity) || 1;
    const lineTotal = price * qty;
    total += lineTotal;

    const row = document.createElement("div");
    row.className = "list-row"; // Re-using list-row style
    row.innerHTML = `
      <div class="list-info">
        <img src="${item.imageUrl || 'img/logo.png'}" class="list-thumb">
        <div>
          <h4 style="margin:0 0 4px 0;">${item.name || 'Product'}</h4>
          <div style="color:var(--accent-orange); font-weight:600;">${formatINR(price)}</div>
        </div>
      </div>
      
      <div style="display:flex; flex-direction:column; align-items:flex-end; gap:5px;">
        <div style="display:flex; align-items:center; border:1px solid #ddd; border-radius:8px;">
          <button class="btn-qty" onclick="changeQty(${index}, -1)" style="padding:4px 8px; background:none; border:none; cursor:pointer;">-</button>
          <span style="padding:0 8px; font-weight:600;">${qty}</span>
          <button class="btn-qty" onclick="changeQty(${index}, 1)" style="padding:4px 8px; background:none; border:none; cursor:pointer;">+</button>
        </div>
        <button onclick="removeItem(${index})" style="font-size:0.8rem; color:red; background:none; border:none; cursor:pointer; text-decoration:underline;">Remove</button>
      </div>
    `;
    cartList.appendChild(row);
  });

  if(totalDisplay) totalDisplay.textContent = formatINR(total);
}

// Window functions for HTML onclick
window.changeQty = (idx, change) => {
  let cart = loadCart();
  if (cart[idx].quantity + change >= 1) {
    cart[idx].quantity += change;
    saveCart(cart);
    renderCart();
  }
};

window.removeItem = (idx) => {
  if(!confirm("Remove item?")) return;
  let cart = loadCart();
  cart.splice(idx, 1);
  saveCart(cart);
  renderCart();
};

if(checkoutBtn) {
  checkoutBtn.addEventListener("click", () => window.location.href = "checkout.html");
}

// Init
document.addEventListener("DOMContentLoaded", renderCart);