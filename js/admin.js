// public/js/admin.js
import { auth, db } from "./firebase.js";
import {
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.14.0/firebase-auth.js";
import {
  doc,
  getDoc,
  setDoc,
  collection,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.14.0/firebase-firestore.js";

// 🔐 Admin emails – REPLACE with your email(s)
const ADMIN_EMAILS = [
  "vinayjawai82@gmail.com",  // <- put your login email here
  // "anotheradmin@example.com"
];

const gateEl = document.querySelector("[data-admin-gate]");
const gateMsgEl = document.querySelector("[data-admin-message]");
const contentEl = document.querySelector("[data-admin-content]");

// Settings form
const settingsForm = document.querySelector("[data-settings-form]");
const settingsStatus = document.querySelector("[data-settings-status]");

// Product form
const productForm = document.querySelector("[data-product-form]");
const productFormTitle = document.querySelector("[data-product-form-title]");
const productFormStatus = document.querySelector("[data-product-form-status]");
const cancelEditBtn = document.querySelector("[data-product-cancel-edit]");

// Product list
const productsListEl = document.querySelector("[data-admin-products-list]");
const productsEmptyEl = document.querySelector("[data-admin-products-empty]");
const refreshProductsBtn = document.querySelector("[data-refresh-products]");

let currentProducts = [];
let editingProductId = null;

function showGate(message) {
  if (gateEl) gateEl.style.display = "flex";
  if (contentEl) contentEl.style.display = "none";
  if (gateMsgEl && message) gateMsgEl.textContent = message;
}

function showAdmin() {
  if (gateEl) gateEl.style.display = "none";
  if (contentEl) contentEl.style.display = "block";
}

onAuthStateChanged(auth, async user => {
  if (!user) {
    showGate("You must be logged in to access the admin panel… redirecting.");
    setTimeout(() => (window.location.href = "login.html"), 1400);
    return;
  }

  const email = user.email || "";
  const isAdmin = ADMIN_EMAILS.includes(email);

  if (!isAdmin) {
    showGate("This account is not authorised for admin access.");
    return;
  }

  showAdmin();
  initAdmin();
});

// ---------- Settings ----------

async function loadSettings() {
  if (!settingsForm) return;
  try {
    const ref = doc(db, "settings", "shop");
    const snap = await getDoc(ref);
    if (snap.exists()) {
      const data = snap.data();
      settingsForm.title.value = data.title || "";
      settingsForm.subtitle.value = data.subtitle || "";
      settingsForm.bannerText.value = data.bannerText || "";
    }
  } catch (err) {
    console.error("Failed to load settings:", err);
    if (settingsStatus) {
      settingsStatus.textContent =
        "Failed to load settings. Check console for details.";
      settingsStatus.className = "checkout-status active error";
    }
  }
}

settingsForm?.addEventListener("submit", async e => {
  e.preventDefault();
  try {
    const payload = {
      title: settingsForm.title.value.trim(),
      subtitle: settingsForm.subtitle.value.trim(),
      bannerText: settingsForm.bannerText.value.trim(),
      updatedAt: serverTimestamp()
    };

    const ref = doc(db, "settings", "shop");
    if (settingsStatus) {
      settingsStatus.textContent = "Saving settings…";
      settingsStatus.className = "checkout-status active";
    }
    await setDoc(ref, payload, { merge: true });

    if (settingsStatus) {
      settingsStatus.textContent = "Settings updated.";
      settingsStatus.className = "checkout-status active success";
    }
  } catch (err) {
    console.error("Failed to save settings:", err);
    if (settingsStatus) {
      settingsStatus.textContent = "Failed to save settings.";
      settingsStatus.className = "checkout-status active error";
    }
  }
});

// ---------- Products ----------

function resetProductForm() {
  if (!productForm) return;
  editingProductId = null;
  productForm.reset();

  // default active = true
  const activeInput = productForm.querySelector("input[name='active']");
  if (activeInput) activeInput.checked = true;

  if (productFormTitle) productFormTitle.textContent = "Add new product";
  if (productFormStatus) {
    productFormStatus.textContent = "";
    productFormStatus.className = "checkout-status";
  }
}

function formatINR(value) {
  return `₹${Number(value || 0).toLocaleString("en-IN")}`;
}

async function loadAdminProducts() {
  if (!productsListEl || !productsEmptyEl) return;
  productsListEl.innerHTML = "";
  productsEmptyEl.style.display = "none";

  try {
    const snap = await getDocs(collection(db, "products"));
    currentProducts = [];
    snap.forEach(docSnap => {
      currentProducts.push({ id: docSnap.id, ...docSnap.data() });
    });

    if (!currentProducts.length) {
      productsEmptyEl.style.display = "flex";
      return;
    }

    renderProductsAdmin(currentProducts);
  } catch (err) {
    console.error("Failed to load products:", err);
    productsEmptyEl.style.display = "flex";
    productsEmptyEl.innerHTML = `
      <h3>Error loading products</h3>
      <p>Please check Firestore rules and console logs.</p>
    `;
  }
}

function renderProductsAdmin(list) {
  if (!productsListEl) return;
  productsListEl.innerHTML = "";

  list.forEach((p, index) => {
    const row = document.createElement("div");
    row.className = "admin-product-row fade-in-up";
    row.style.animationDelay = `${index * 40}ms`;

    const price = p.price ?? 0;
    const active = p.active !== false; // default true

    row.innerHTML = `
      <div class="admin-product-main">
        <div>
          <h4>${p.name || "Untitled product"}</h4>
          <p>
            ${p.category ? `<span class="admin-pill">${p.category}</span>` : ""}
            ${
              p.tagline
                ? `<span class="admin-pill accent">${p.tagline}</span>`
                : ""
            }
          </p>
        </div>
      </div>

      <div class="admin-product-meta">
        <span class="admin-price">${formatINR(price)}</span>
        <label class="toggle-switch">
          <input type="checkbox" data-toggle-active ${
            active ? "checked" : ""
          } />
          <span class="toggle-slider"></span>
        </label>
      </div>

      <div class="admin-product-actions">
        <button class="btn outline" type="button" data-edit>Edit</button>
        <button class="btn outline danger" type="button" data-delete>
          Delete
        </button>
      </div>
    `;

    const toggle = row.querySelector("[data-toggle-active]");
    const editBtn = row.querySelector("[data-edit]");
    const deleteBtn = row.querySelector("[data-delete]");

    toggle?.addEventListener("change", async e => {
      const checked = e.target.checked;
      try {
        await updateDoc(doc(db, "products", p.id), { active: checked });
      } catch (err) {
        console.error("Failed to update active:", err);
        e.target.checked = !checked;
        alert("Failed to update active state.");
      }
    });

    editBtn?.addEventListener("click", () => startEditProduct(p));
    deleteBtn?.addEventListener("click", () => confirmDeleteProduct(p));

    productsListEl.appendChild(row);
  });
}

function startEditProduct(p) {
  if (!productForm) return;
  editingProductId = p.id;

  if (productFormTitle) productFormTitle.textContent = "Edit product";

  productForm.name.value = p.name || "";
  productForm.price.value = p.price ?? "";
  productForm.imageUrl.value = p.imageUrl || "";
  productForm.category.value = p.category || "";
  productForm.tagline.value = p.tagline || "";

  const activeInput = productForm.querySelector("input[name='active']");
  if (activeInput) activeInput.checked = p.active !== false;

  if (productFormStatus) {
    productFormStatus.textContent = "Editing existing product.";
    productFormStatus.className = "checkout-status active";
  }
}

async function confirmDeleteProduct(p) {
  const ok = confirm(`Delete product "${p.name || "Unnamed"}"?`);
  if (!ok) return;
  try {
    await deleteDoc(doc(db, "products", p.id));
    await loadAdminProducts();
  } catch (err) {
    console.error("Failed to delete product:", err);
    alert("Failed to delete product. Check console.");
  }
}

productForm?.addEventListener("submit", async e => {
  e.preventDefault();
  if (!productForm) return;

  const name = productForm.name.value.trim();
  const price = Number(productForm.price.value || 0);
  const imageUrl = productForm.imageUrl.value.trim();
  const category = productForm.category.value.trim();
  const tagline = productForm.tagline.value.trim();
  const activeInput = productForm.querySelector("input[name='active']");
  const active = activeInput ? activeInput.checked : true;

  if (!name) {
    if (productFormStatus) {
      productFormStatus.textContent = "Name is required.";
      productFormStatus.className = "checkout-status active error";
    }
    return;
  }

  const payload = {
    name,
    price,
    imageUrl,
    category,
    tagline,
    active,
    updatedAt: serverTimestamp()
  };

  try {
    if (productFormStatus) {
      productFormStatus.textContent = editingProductId
        ? "Updating product…"
        : "Creating product…";
      productFormStatus.className = "checkout-status active";
    }

    if (editingProductId) {
      await updateDoc(doc(db, "products", editingProductId), payload);
    } else {
      await addDoc(collection(db, "products"), {
        ...payload,
        createdAt: serverTimestamp()
      });
    }

    if (productFormStatus) {
      productFormStatus.textContent = editingProductId
        ? "Product updated."
        : "Product created.";
      productFormStatus.className = "checkout-status active success";
    }

    resetProductForm();
    await loadAdminProducts();
  } catch (err) {
    console.error("Product save failed:", err);
    if (productFormStatus) {
      productFormStatus.textContent = "Failed to save product.";
      productFormStatus.className = "checkout-status active error";
    }
  }
});

cancelEditBtn?.addEventListener("click", () => {
  resetProductForm();
});

refreshProductsBtn?.addEventListener("click", () => {
  loadAdminProducts();
});

// ---------- Init ----------

function initAdmin() {
  resetProductForm();
  loadSettings();
  loadAdminProducts();
}

const shopName = document.getElementById("shopName").value.trim();
const shopTagline =
  document.getElementById("shopTagline").value.trim();
const heroImageUrl =
  document.getElementById("heroImageUrl").value.trim();

const isLive = document.getElementById("shopIsLive").checked;
const maintenanceTitle =
  document.getElementById("maintenanceTitle").value.trim();
const maintenanceMessage =
  document.getElementById("maintenanceMessage").value.trim();

const logoUrl =
  document.getElementById("shopLogoUrl").value.trim();
const faviconUrl =
  document.getElementById("shopFaviconUrl").value.trim();
