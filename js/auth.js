// public/js/auth.js
// Handles login / register screen logic

import { auth } from "./firebase.js";
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
} from "https://www.gstatic.com/firebasejs/10.14.0/firebase-auth.js";

const loginForm = document.querySelector("#loginForm");
const registerForm = document.querySelector("#registerForm");
const authMessage = document.querySelector("#authMessage");

const loginTabBtn = document.querySelector("#loginTabBtn");
const registerTabBtn = document.querySelector("#registerTabBtn");
const loginPanel = document.querySelector("#loginPanel");
const registerPanel = document.querySelector("#registerPanel");

function setMessage(text, type = "info") {
  if (!authMessage) return;
  authMessage.textContent = text;
  authMessage.className = "auth-message";
  if (type === "success") authMessage.classList.add("success");
  if (type === "error") authMessage.classList.add("error");
}

function switchTab(tab) {
  if (!loginTabBtn || !registerTabBtn || !loginPanel || !registerPanel) return;

  if (tab === "login") {
    loginTabBtn.classList.add("active");
    registerTabBtn.classList.remove("active");
    loginPanel.classList.add("active");
    registerPanel.classList.remove("active");
  } else {
    registerTabBtn.classList.add("active");
    loginTabBtn.classList.remove("active");
    registerPanel.classList.add("active");
    loginPanel.classList.remove("active");
  }

  setMessage("");
}

// If user is already logged in and opens /login, push them to /shop
onAuthStateChanged(auth, (user) => {
  const path = window.location.pathname;
  const onLoginPage =
    path.endsWith("/login") || path.endsWith("/login.html");

  if (user && onLoginPage) {
    window.location.href = "/shop";
  }
});

// LOGIN HANDLER (uses explicit inputs instead of form.email)
if (loginForm) {
  const loginEmailInput = loginForm.querySelector("#loginEmail");
  const loginPasswordInput = loginForm.querySelector("#loginPassword");

  loginForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const email = loginEmailInput?.value.trim() || "";
    const password = loginPasswordInput?.value || "";

    if (!email || !password) {
      setMessage("Please enter email and password.", "error");
      return;
    }

    try {
      setMessage("Signing you in...");
      await signInWithEmailAndPassword(auth, email, password);
      setMessage("Signed in successfully.", "success");
      setTimeout(() => {
        window.location.href = "/shop";
      }, 400);
    } catch (error) {
      console.error("Login error", error);
      let msg = "Failed to sign in. Please try again.";

      if (error.code === "auth/user-not-found") {
        msg = "No user found with this email.";
      } else if (error.code === "auth/wrong-password") {
        msg = "Incorrect password.";
      } else if (error.code === "auth/too-many-requests") {
        msg = "Too many attempts. Please wait and try again.";
      }

      setMessage(msg, "error");
    }
  });
}

// REGISTER HANDLER (also uses explicit inputs)
if (registerForm) {
  const registerEmailInput = registerForm.querySelector("#registerEmail");
  const registerPasswordInput =
    registerForm.querySelector("#registerPassword");

  registerForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const email = registerEmailInput?.value.trim() || "";
    const password = registerPasswordInput?.value || "";

    if (!email || !password) {
      setMessage("Please enter email and password.", "error");
      return;
    }

    try {
      setMessage("Creating your account...");
      await createUserWithEmailAndPassword(auth, email, password);
      setMessage("Account created. You are now signed in.", "success");
      setTimeout(() => {
        window.location.href = "/shop";
      }, 400);
    } catch (error) {
      console.error("Sign-up error", error);
      let msg = "Failed to create account.";

      if (error.code === "auth/email-already-in-use") {
        msg = "This email is already in use.";
      } else if (error.code === "auth/weak-password") {
        msg = "Password should be at least 6 characters.";
      }

      setMessage(msg, "error");
    }
  });
}

// Tabs switching
if (loginTabBtn && registerTabBtn) {
  loginTabBtn.addEventListener("click", () => switchTab("login"));
  registerTabBtn.addEventListener("click", () => switchTab("register"));
}
