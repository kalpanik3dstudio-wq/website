import { auth, db, onAuthStateChanged } from "./firebase.js";
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut } from "https://www.gstatic.com/firebasejs/10.14.0/firebase-auth.js";
import { doc, getDoc, setDoc, collection, query, where, getDocs, orderBy } from "https://www.gstatic.com/firebasejs/10.14.0/firebase-firestore.js";

// DOM Elements
const loader = document.getElementById("loader");
const guestView = document.getElementById("guestView");
const userView = document.getElementById("userView");
const welcomeText = document.getElementById("welcomeText");
const authMsg = document.getElementById("authMsg");

// 1. AUTH STATE LISTENER
onAuthStateChanged(auth, async (user) => {
  loader.style.display = "none";
  
  if (user) {
    guestView.style.display = "none";
    userView.style.display = "block";
    welcomeText.textContent = `Hello, ${user.email}`;
    
    // Load Data
    loadProfile(user);
    loadOrders(user);
  } else {
    guestView.style.display = "block";
    userView.style.display = "none";
  }
});

// 2. LOAD ORDERS (With Status Tracking)
async function loadOrders(user) {
  const list = document.getElementById("ordersList");
  list.innerHTML = "<p>Scanning for orders...</p>";

  try {
    const q = query(collection(db, "orders"), where("email", "==", user.email), orderBy("createdAt", "desc"));
    const snap = await getDocs(q);

    if (snap.empty) {
      list.innerHTML = `
        <div class="card-shell" style="text-align:center;">
          <h3>No orders yet</h3>
          <p style="color:grey;">Once you buy a miniature, it will show up here.</p>
          <a href="/shop.html" class="btn btn-primary" style="margin-top:10px;">Start Shopping</a>
        </div>
      `;
      return;
    }

    let html = "";
    snap.forEach(docSnap => {
      const o = docSnap.data();
      const date = o.createdAt ? o.createdAt.toDate().toDateString() : "Recent";
      const isShipped = o.status === "shipped";
      
      // Status Visual Logic
      const statusHTML = `
        <div class="status-timeline ${isShipped ? 'status-active' : ''}">
          <div class="status-active">
            <div class="status-dot" style="background:green;"></div>
            <span>Ordered</span>
          </div>
          <div class="status-line ${isShipped ? 'status-active' : ''}"></div>
          <div class="${isShipped ? 'status-active' : ''}">
            <div class="status-dot"></div>
            <span>Shipped</span>
          </div>
        </div>
      `;

      html += `
        <div class="card-shell" style="margin-bottom:1rem;">
          <div style="display:flex; justify-content:space-between; font-weight:600; margin-bottom:0.5rem;">
            <span>Order #${docSnap.id.slice(0, 6).toUpperCase()}</span>
            <span>${date}</span>
          </div>
          
          <div style="background:#f9f9f9; padding:10px; border-radius:8px; font-size:0.9rem; margin-bottom:1rem;">
            ${o.items.map(i => `<div>${i.quantity}x ${i.name}</div>`).join('')}
            <div style="text-align:right; font-weight:bold; margin-top:5px;">Total: ₹${o.total}</div>
          </div>

          <div style="background:white; border:1px solid #eee; padding:10px; border-radius:8px;">
            <strong>Status:</strong> <span style="color:${isShipped ? 'green' : 'orange'}">${isShipped ? 'Shipped via Courier 🚚' : 'Processing in Studio 🎨'}</span>
            ${statusHTML}
          </div>
        </div>
      `;
    });
    list.innerHTML = html;

  } catch (err) {
    console.error(err);
    list.innerHTML = "<p>Error loading orders.</p>";
  }
}

// 3. LOAD & SAVE PROFILE
async function loadProfile(user) {
  try {
    const snap = await getDoc(doc(db, "users", user.uid));
    if(snap.exists()) {
      const d = snap.data();
      document.getElementById("profName").value = d.fullName || "";
      document.getElementById("profPhone").value = d.phone || "";
      document.getElementById("profAddress").value = d.address || "";
    }
  } catch(e) { console.log("New user profile"); }
}

document.getElementById("profileForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  const user = auth.currentUser;
  const msg = document.getElementById("profMsg");
  msg.textContent = "Saving...";
  
  try {
    await setDoc(doc(db, "users", user.uid), {
      fullName: document.getElementById("profName").value,
      phone: document.getElementById("profPhone").value,
      address: document.getElementById("profAddress").value,
      email: user.email
    }, { merge: true });
    msg.textContent = "✅ Saved Successfully!";
    msg.style.color = "green";
  } catch(err) {
    msg.textContent = "Error saving.";
  }
});

// 4. LOGIN / REGISTER ACTIONS
document.getElementById("loginForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  authMsg.textContent = "Signing in...";
  try {
    await signInWithEmailAndPassword(auth, document.getElementById("loginEmail").value, document.getElementById("loginPass").value);
  } catch(err) { authMsg.textContent = "Error: " + err.message; }
});

document.getElementById("regForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  authMsg.textContent = "Creating account...";
  try {
    await createUserWithEmailAndPassword(auth, document.getElementById("regEmail").value, document.getElementById("regPass").value);
  } catch(err) { authMsg.textContent = "Error: " + err.message; }
});

document.getElementById("logoutBtn").addEventListener("click", () => signOut(auth));