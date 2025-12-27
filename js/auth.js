import { auth, db, onAuthStateChanged } from "./firebase.js";
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut } from "https://www.gstatic.com/firebasejs/10.14.0/firebase-auth.js";
import { collection, query, where, getDocs, orderBy } from "https://www.gstatic.com/firebasejs/10.14.0/firebase-firestore.js";

// UI Elements
const loadingEl = document.getElementById("authLoading");
const formsEl = document.getElementById("authForms");
const dashboardEl = document.getElementById("userDashboard");
const ordersListEl = document.getElementById("myOrdersList");
const emailDisplay = document.getElementById("userEmailDisplay");
const msgEl = document.getElementById("authMsg");

// 1. Monitor Auth State
onAuthStateChanged(auth, async (user) => {
  loadingEl.style.display = "none";
  if (user) {
    // User is Logged In
    formsEl.style.display = "none";
    dashboardEl.style.display = "block";
    emailDisplay.textContent = user.email;
    loadUserOrders(user.email);
  } else {
    // User is Guest
    dashboardEl.style.display = "none";
    formsEl.style.display = "block";
  }
});

// 2. Load User's Personal Orders
async function loadUserOrders(email) {
  ordersListEl.innerHTML = "<p>Scanning records...</p>";
  try {
    // Query orders where 'email' matches logged in user
    const q = query(collection(db, "orders"), where("email", "==", email), orderBy("createdAt", "desc"));
    const snap = await getDocs(q);

    if (snap.empty) {
      ordersListEl.innerHTML = "<p>You haven't placed any orders yet.</p><a href='/shop.html' class='btn btn-primary'>Start Shopping</a>";
      return;
    }

    let html = "";
    snap.forEach(doc => {
      const o = doc.data();
      const date = o.createdAt ? o.createdAt.toDate().toLocaleDateString() : "Recent";
      const statusColor = o.status === 'shipped' ? '#dcfce7' : '#fee2e2';
      const statusText = o.status === 'shipped' ? 'Shipped 🚚' : 'Processing ⏳';
      
      html += `
        <div style="border-bottom:1px solid #eee; padding:1rem 0; display:flex; justify-content:space-between; align-items:center;">
          <div>
            <div style="font-weight:600;">₹${o.total}</div>
            <div style="font-size:0.85rem; color:grey;">${date} • ${o.items.length} items</div>
          </div>
          <div style="background:${statusColor}; padding:4px 12px; border-radius:20px; font-size:0.8rem; font-weight:600;">
            ${statusText}
          </div>
        </div>
      `;
    });
    ordersListEl.innerHTML = html;
  } catch (err) {
    console.error("Order fetch error:", err);
    // Usually happens if index is missing. Firestore will log a link in console to fix it.
    ordersListEl.innerHTML = "<p>Could not load orders. (First time setup may require indexing)</p>";
  }
}

// 3. Login Logic
const loginForm = document.getElementById("loginForm");
loginForm?.addEventListener("submit", async (e) => {
  e.preventDefault();
  const email = document.getElementById("loginEmail").value;
  const pass = document.getElementById("loginPassword").value;
  
  try {
    msgEl.textContent = "Verifying...";
    await signInWithEmailAndPassword(auth, email, pass);
    // onAuthStateChanged will handle the rest
  } catch (err) {
    msgEl.textContent = "Error: " + err.message.replace("Firebase: ", "");
  }
});

// 4. Register Logic
const regForm = document.getElementById("registerForm");
regForm?.addEventListener("submit", async (e) => {
  e.preventDefault();
  const email = document.getElementById("regEmail").value;
  const pass = document.getElementById("regPassword").value;
  
  try {
    msgEl.textContent = "Creating Account...";
    await createUserWithEmailAndPassword(auth, email, pass);
  } catch (err) {
    msgEl.textContent = "Error: " + err.message;
  }
});

// 5. Logout
document.getElementById("logoutBtn")?.addEventListener("click", () => {
  signOut(auth);
  window.location.reload();
});