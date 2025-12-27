import { db, auth, onAuthStateChanged } from "./firebase.js";
import { collection, addDoc, serverTimestamp, doc, getDoc } from "https://www.gstatic.com/firebasejs/10.14.0/firebase-firestore.js";

// DOM Elements
const form = document.getElementById("checkoutForm");
const summaryList = document.getElementById("summaryList");
const summaryTotal = document.getElementById("summaryTotal");
const msgEl = document.getElementById("orderMsg");

// Helper
function formatINR(n) { return "₹" + Number(n).toLocaleString("en-IN"); }
function loadCart() { return JSON.parse(localStorage.getItem("kalpnik_cart")) || []; }

// 1. Load Summary Immediately
function initSummary() {
  const cart = loadCart();
  if (cart.length === 0) {
    summaryList.innerHTML = "<p>Cart is empty.</p>";
    return;
  }

  let total = 0;
  let html = "";
  
  cart.forEach(item => {
    const itemTotal = item.price * item.quantity;
    total += itemTotal;
    html += `
      <div class="summary-row">
        <span>${item.quantity}x ${item.name}</span>
        <span>${formatINR(itemTotal)}</span>
      </div>
    `;
  });

  summaryList.innerHTML = html;
  summaryTotal.textContent = formatINR(total);
}

// 2. Auto-Fill User Data
onAuthStateChanged(auth, async (user) => {
  if (user) {
    document.getElementById("email").value = user.email;
    
    // Try to fetch saved profile
    try {
      const snap = await getDoc(doc(db, "users", user.uid));
      if (snap.exists()) {
        const data = snap.data();
        if(data.fullName) document.getElementById("fullName").value = data.fullName;
        if(data.phone) document.getElementById("phone").value = data.phone;
        if(data.address) document.getElementById("address").value = data.address;
      }
    } catch(e) { console.log("No profile data found"); }
  }
});

// 3. Handle Submit
form.addEventListener("submit", async (e) => {
  e.preventDefault();
  const cart = loadCart();
  
  if(cart.length === 0) {
    alert("Your cart is empty!");
    return;
  }

  msgEl.textContent = "Processing...";
  msgEl.style.color = "blue";

  const user = auth.currentUser;
  
  const orderData = {
    userId: user ? user.uid : "guest",
    email: form.email.value,
    fullName: form.fullName.value,
    phone: form.phone.value,
    address: form.address.value,
    notes: form.notes.value,
    items: cart,
    total: cart.reduce((sum, i) => sum + (i.price * i.quantity), 0),
    status: "pending",
    createdAt: serverTimestamp()
  };

  try {
    await addDoc(collection(db, "orders"), orderData);
    
    localStorage.removeItem("kalpnik_cart"); // Clear cart
    msgEl.textContent = "Order Placed Successfully!";
    msgEl.style.color = "green";
    
    setTimeout(() => {
      window.location.href = "shop.html";
    }, 2000);
    
  } catch (err) {
    console.error(err);
    msgEl.textContent = "Error placing order. Please try again.";
    msgEl.style.color = "red";
  }
});

// Initialize
initSummary();