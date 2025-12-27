import { db, auth } from "./firebase.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.14.0/firebase-auth.js";
import {
  collection,
  addDoc,
  doc,
  getDoc,
  setDoc,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.14.0/firebase-firestore.js";

// --- Helpers ---
function loadCart() {
  try { return JSON.parse(localStorage.getItem("kalpnik_cart")) || []; } 
  catch { return []; }
}

function clearCart() {
  localStorage.removeItem("kalpnik_cart");
}

function formatINR(value) {
  return `₹${Number(value || 0).toLocaleString("en-IN")}`;
}

// --- UI Elements ---
const summaryList = document.querySelector("[data-checkout-list]");
const summaryTotal = document.querySelector("[data-checkout-total]");
const summaryItems = document.querySelector("[data-checkout-items]");
const checkoutForm = document.querySelector("[data-checkout-form]");
const checkoutStatus = document.querySelector("[data-checkout-status]");

// --- 1. SMART AUTO-FILL ---
onAuthStateChanged(auth, async (user) => {
  if (user) {
    // A. Lock email field (since they are logged in)
    const emailField = document.getElementById("email");
    if (emailField) {
      emailField.value = user.email;
      emailField.readOnly = true;
      emailField.style.background = "rgba(0,0,0,0.05)";
    }

    // B. Fetch saved address
    try {
      const docRef = doc(db, "users", user.uid);
      const snap = await getDoc(docRef);

      if (snap.exists()) {
        const data = snap.data();
        if (data.fullName) document.getElementById("fullName").value = data.fullName;
        if (data.phone) document.getElementById("phone").value = data.phone;
        if (data.address) document.getElementById("address").value = data.address;
        
        // Show a little toast or log
        console.log("Address auto-filled from profile.");
      }
    } catch (err) {
      console.log("New user - no saved address yet.");
    }
  }
});

// --- 2. RENDER SUMMARY ---
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

// --- 3. HANDLE ORDER SUBMIT ---
checkoutForm?.addEventListener("submit", async e => {
  e.preventDefault();
  const cart = loadCart();
  if (!cart.length) {
    alert("Your cart is empty.");
    return;
  }

  const formData = new FormData(checkoutForm);
  const user = auth.currentUser;

  const orderData = {
    uid: user ? user.uid : "guest", // Track who bought it
    fullName: formData.get("fullName"),
    email: formData.get("email"),
    phone: formData.get("phone"),
    address: formData.get("address"),
    notes: formData.get("notes"),
    items: cart,
    total: cart.reduce((sum, i) => sum + i.price * i.quantity, 0),
    createdAt: serverTimestamp(),
    status: "pending"
  };

  try {
    if (checkoutStatus) {
      checkoutStatus.textContent = "Processing order...";
      checkoutStatus.className = "checkout-status active";
    }

    // A. Save the Order
    await addDoc(collection(db, "orders"), orderData);

    // B. AUTO-SAVE ADDRESS (If logged in)
    if (user) {
      const userRef = doc(db, "users", user.uid);
      // 'merge: true' updates address without deleting other user data
      await setDoc(userRef, {
        fullName: orderData.fullName,
        phone: orderData.phone,
        address: orderData.address,
        email: user.email,
        lastUpdated: serverTimestamp()
      }, { merge: true });
    }

    // C. Cleanup
    clearCart();
    if (checkoutStatus) {
      checkoutStatus.textContent = "Order placed! Redirecting...";
      checkoutStatus.className = "checkout-status active success";
    }

    setTimeout(() => {
      // If logged in -> go to dashboard, else -> shop
      window.location.href = user ? "login.html" : "shop.html";
    }, 2000);

    checkoutForm.reset();

  } catch (err) {
    console.error("Order failed:", err);
    if (checkoutStatus) {
      checkoutStatus.textContent = "Error: " + err.message;
      checkoutStatus.className = "checkout-status active error";
    }
  }
});

renderSummary();