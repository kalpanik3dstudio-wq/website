// public/js/checkout.js
import { db } from "./firebase.js";
import {
  collection,
  addDoc,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.14.0/firebase-firestore.js";

function loadCart() {
  try {
    return JSON.parse(localStorage.getItem("kalpnik_cart")) || [];
  } catch {
    return [];
  }
}

function clearCart() {
  localStorage.removeItem("kalpnik_cart");
}

const summaryList = document.querySelector("[data-checkout-list]");
const summaryTotal = document.querySelector("[data-checkout-total]");
const summaryItems = document.querySelector("[data-checkout-items]");
const checkoutForm = document.querySelector("[data-checkout-form]");
const checkoutStatus = document.querySelector("[data-checkout-status]");

function formatINR(value) {
  return `₹${Number(value || 0).toLocaleString("en-IN")}`;
}

function renderSummary() {
  const cart = loadCart();
  if (!summaryList) return;

  summaryList.innerHTML = "";

  if (!cart.length) {
    summaryList.innerHTML = `<p>Your cart is empty.</p>`;
    if (checkoutForm) checkoutForm.style.display = "none";
    return;
  }

  let total = 0;
  let count = 0;
  cart.forEach(item => {
    total += item.price * item.quantity;
    count += item.quantity;

    const row = document.createElement("div");
    row.className = "checkout-row";
    row.innerHTML = `
      <span>${item.name} × ${item.quantity}</span>
      <span>${formatINR(item.price * item.quantity)}</span>
    `;
    summaryList.appendChild(row);
  });

  if (summaryTotal) summaryTotal.textContent = formatINR(total);
  if (summaryItems) summaryItems.textContent = count;
}

checkoutForm?.addEventListener("submit", async e => {
  e.preventDefault();
  const cart = loadCart();
  if (!cart.length) {
    alert("Your cart is empty.");
    return;
  }

  const formData = new FormData(checkoutForm);
  const payload = {
    name: formData.get("name"),
    email: formData.get("email"),
    phone: formData.get("phone"),
    address: formData.get("address"),
    note: formData.get("note"),
    items: cart,
    total: cart.reduce((sum, i) => sum + i.price * i.quantity, 0),
    createdAt: serverTimestamp(),
    status: "pending"
  };

  try {
    if (checkoutStatus) {
      checkoutStatus.textContent = "Placing your order…";
      checkoutStatus.className = "checkout-status active";
    }
    await addDoc(collection(db, "orders"), payload);
    clearCart();
    if (checkoutStatus) {
      checkoutStatus.textContent = "Order placed successfully!";
      checkoutStatus.className = "checkout-status active success";
    }
    checkoutForm.reset();
  } catch (err) {
    console.error(err);
    if (checkoutStatus) {
      checkoutStatus.textContent = "Failed to place order. Try again.";
      checkoutStatus.className = "checkout-status active error";
    }
  }
});

renderSummary();
