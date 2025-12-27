import { auth, db, onAuthStateChanged } from "./firebase.js";
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut } from "https://www.gstatic.com/firebasejs/10.14.0/firebase-auth.js";
import { collection, query, where, getDocs, orderBy, doc, getDoc, setDoc } from "https://www.gstatic.com/firebasejs/10.14.0/firebase-firestore.js";

// UI Elements
const loadingEl = document.getElementById("authLoading");
const formsEl = document.getElementById("authForms");
const dashboardEl = document.getElementById("userDashboard");
const ordersListEl = document.getElementById("myOrdersList");
const emailDisplay = document.getElementById("userEmailDisplay");
const msgEl = document.getElementById("authMsg");

// Profile Elements
const profName = document.getElementById("profName");
const profPhone = document.getElementById("profPhone");
const profAddress = document.getElementById("profAddress");
const profileForm = document.getElementById("profileForm");
const profileMsg = document.getElementById("profileMsg");

// 1. Monitor Auth State
onAuthStateChanged(auth, async (user) => {
  loadingEl.style.display = "none";
  if (user) {
    formsEl.style.display = "none";
    dashboardEl.style.display = "block";
    emailDisplay.textContent = user.email;
    
    // Load Data
    loadUserProfile(user.uid);
    loadUserOrders(user.email);
  } else {
    dashboardEl.style.display = "none";
    formsEl.style.display = "block";
  }
});

// 2. Load Profile (Name, Phone, Address)
async function loadUserProfile(uid) {
  try {
    const docRef = doc(db, "users", uid);
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      const data = snap.data();
      profName.value = data.fullName || "";
      profPhone.value = data.phone || "";
      profAddress.value = data.address || "";
    }
  } catch (err) {
    console.error("Profile load error:", err);
  }
}

// 3. Save Profile
profileForm?.addEventListener("submit", async (e) => {
  e.preventDefault();
  const user = auth.currentUser;
  if (!user) return;

  profileMsg.textContent = "Saving...";
  try {
    await setDoc(doc(db, "users", user.uid), {
      fullName: profName.value,
      phone: profPhone.value,
      address: profAddress.value,
      email: user.email
    }, { merge: true });

    profileMsg.textContent = "Details saved successfully!";
    setTimeout(() => profileMsg.textContent = "", 3000);
  } catch (err) {
    console.error(err);
    profileMsg.textContent = "Error saving details.";
    profileMsg.style.color = "red";
  }
});

// 4. Load Orders
async function loadUserOrders(email) {
  ordersListEl.innerHTML = "<p>Scanning records...</p>";
  try {
    const q = query(collection(db, "orders"), where("email", "==", email), orderBy("createdAt", "desc"));
    const snap = await getDocs(q);

    if (snap.empty) {
      ordersListEl.innerHTML = "<p>No orders yet.</p><a href='/shop.html' class='btn btn-primary' style='font-size:0.8rem; margin-top:10px;'>Start Shopping</a>";
      return;
    }

    let html = "";
    snap.forEach(docSnap => {
      const o = docSnap.data();
      const date = o.createdAt ? o.createdAt.toDate().toLocaleDateString() : "Recent";
      const statusColor = o.status === 'shipped' ? '#dcfce7' : '#fff7ed';
      const statusText = o.status === 'shipped' ? 'Shipped 🚚' : 'Processing ⏳';
      
      // Items preview
      const itemNames = o.items.map(i => `${i.quantity}x ${i.name}`).join(", ");

      html += `
        <div style="border:1px solid #eee; padding:1rem; border-radius:12px; margin-bottom:1rem; background:white;">
          <div style="display:flex; justify-content:space-between; margin-bottom:0.5rem;">
            <span style="font-weight:700;">₹${o.total}</span>
            <span style="background:${statusColor}; padding:2px 10px; border-radius:99px; font-size:0.75rem; font-weight:600;">${statusText}</span>
          </div>
          <div style="font-size:0.85rem; color:grey; margin-bottom:0.5rem;">${date}</div>
          <div style="font-size:0.85rem; color:#444; background:#f9f9f9; padding:8px; border-radius:6px;">
            ${itemNames}
          </div>
        </div>
      `;
    });
    ordersListEl.innerHTML = html;
  } catch (err) {
    console.error("Order fetch error:", err);
    ordersListEl.innerHTML = "<p>Could not load orders.</p>";
  }
}

// 5. Auth Handlers
const loginForm = document.getElementById("loginForm");
loginForm?.addEventListener("submit", async (e) => {
  e.preventDefault();
  const email = document.getElementById("loginEmail").value;
  const pass = document.getElementById("loginPassword").value;
  try {
    msgEl.textContent = "Verifying...";
    await signInWithEmailAndPassword(auth, email, pass);
  } catch (err) {
    msgEl.textContent = "Error: " + err.message.replace("Firebase: ", "");
  }
});

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

document.getElementById("logoutBtn")?.addEventListener("click", () => {
  signOut(auth);
  window.location.reload();
});