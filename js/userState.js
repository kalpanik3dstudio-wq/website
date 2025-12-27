// public/js/userState.js
import { auth } from "./firebase.js";
import {
  onAuthStateChanged,
  signOut
} from "https://www.gstatic.com/firebasejs/10.14.0/firebase-auth.js";

const userBadge = document.querySelector("[data-user-badge]");
const authActionBtn = document.querySelector("[data-auth-action]");

function setLoggedOut() {
  if (userBadge) {
    userBadge.textContent = "Guest";
    userBadge.classList.remove("logged-in");
  }
  if (authActionBtn) {
    authActionBtn.textContent = "Login";
    authActionBtn.onclick = () => (window.location.href = "login.html");
  }
}

function setLoggedIn(user) {
  if (userBadge) {
    userBadge.textContent = user.email || "Account";
    userBadge.classList.add("logged-in");
  }
  if (authActionBtn) {
    authActionBtn.textContent = "Logout";
    authActionBtn.onclick = async () => {
      try {
        await signOut(auth);
        window.location.href = "index.html";
      } catch (err) {
        console.error(err);
      }
    };
  }
}

onAuthStateChanged(auth, user => {
  if (user) setLoggedIn(user);
  else setLoggedOut();
});
