// public/js/userState.js
import { auth } from "./firebase.js";
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.14.0/firebase-auth.js";

// 1. Auth UI Logic
const userBadge = document.querySelector("[data-user-badge]");
const authActionBtn = document.querySelector("[data-auth-action]");

function setLoggedOut() {
  if (userBadge) { userBadge.textContent = "Guest"; userBadge.classList.remove("logged-in"); }
  if (authActionBtn) {
    authActionBtn.textContent = "Login";
    authActionBtn.onclick = () => (window.location.href = "login.html");
  }
}

function setLoggedIn(user) {
  if (userBadge) { userBadge.textContent = user.email || "Account"; userBadge.classList.add("logged-in"); }
  if (authActionBtn) {
    authActionBtn.textContent = "Logout";
    authActionBtn.onclick = async () => {
      try { await signOut(auth); window.location.href = "index.html"; } 
      catch (err) { console.error(err); }
    };
  }
}

onAuthStateChanged(auth, user => {
  if (user) setLoggedIn(user);
  else setLoggedOut();
});

// 2. GLOBAL CART BADGE LOGIC (Added this!)
window.updateNavBadge = function() {
  try {
    const raw = localStorage.getItem("kalpnik_cart");
    const cart = raw ? JSON.parse(raw) : [];
    const count = cart.reduce((sum, item) => sum + (item.quantity || 1), 0);

    // Find all 'Cart' links in the nav
    const navLinks = document.querySelectorAll('.nav-links a');
    navLinks.forEach(link => {
      if (link.textContent.includes("Cart")) {
        // Reset text
        link.innerHTML = "Cart"; 
        // Add badge if items exist
        if (count > 0) {
          link.innerHTML = `Cart <span style="background:#ff3502; color:white; padding:2px 6px; border-radius:10px; font-size:0.75rem; margin-left:5px;">${count}</span>`;
        }
      }
    });
  } catch (err) {
    console.error("Badge update error", err);
  }
};

// Run badge update on every page load
document.addEventListener("DOMContentLoaded", window.updateNavBadge);