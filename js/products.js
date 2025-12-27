// public/js/products.js
import { db } from "./firebase.js";
import { collection, getDocs, query, where } from "https://www.gstatic.com/firebasejs/10.14.0/firebase-firestore.js";

const gridEl = document.getElementById("productsGrid");
const skeletonEl = document.getElementById("productSkeleton"); // If exists in HTML
const emptyEl = document.getElementById("emptyState");
const errorEl = document.getElementById("shopError");
const searchInput = document.getElementById("searchInput");
const categorySelect = document.getElementById("categoryFilter");
const sortSelect = document.getElementById("sortSelect");

let allProducts = [];

// --- Helpers ---
function formatINR(amount) {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(amount);
}

// --- Render Card ---
function buildProductCard(p) {
  // FIX: Ensure price is a number for display
  const priceVal = Number(p.price) || 0;
  const priceLabel = formatINR(priceVal);
  const imageSrc = p.imageUrl || p.image || "https://placehold.co/400x400?text=No+Image";

  return `
    <article class="product-card" data-category="${p.category || "other"}">
      <div class="product-img-wrap">
        <img src="${imageSrc}" alt="${p.name}" loading="lazy" />
        ${p.tag ? `<span class="product-badge">${p.tag}</span>` : ""}
      </div>
      <div class="product-info">
        <h3>${p.name || "Untitled"}</h3>
        <p class="product-cat">${p.category || "Miniature"}</p>
        <p class="product-price">${priceLabel}</p>
        
        <button 
          class="btn btn-primary btn-add-cart"
          data-id="${p.id}"
          data-name="${p.name}"
          data-price="${priceVal}" 
          data-image="${imageSrc}"
        >
          Add to Cart
        </button>
      </div>
    </article>
  `;
}

// --- Filter Logic ---
function applyFilters() {
  if (!gridEl) return;
  const term = (searchInput?.value || "").toLowerCase();
  const cat = categorySelect?.value || "all";
  const sort = sortSelect?.value || "featured";

  let filtered = [...allProducts];

  if (term) filtered = filtered.filter(p => (p.name || "").toLowerCase().includes(term));
  if (cat !== "all") filtered = filtered.filter(p => (p.category || "").toLowerCase() === cat);

  if (sort === "price-asc") filtered.sort((a, b) => (Number(a.price) || 0) - (Number(b.price) || 0));
  if (sort === "price-desc") filtered.sort((a, b) => (Number(b.price) || 0) - (Number(a.price) || 0));

  if (!filtered.length) {
    gridEl.innerHTML = "";
    if (emptyEl) emptyEl.style.display = "block";
    return;
  }
  
  if (emptyEl) emptyEl.style.display = "none";
  gridEl.innerHTML = filtered.map(buildProductCard).join("");
  
  // Re-attach listeners
  wireAddToCart();
}

// --- Add to Cart Logic (CRITICAL FIX) ---
function wireAddToCart() {
  const buttons = gridEl.querySelectorAll(".btn-add-cart");
  buttons.forEach(btn => {
    btn.onclick = () => {
      // FIX: FORCE NUMBERS HERE
      const price = parseFloat(btn.dataset.price); 
      
      const item = {
        id: btn.dataset.id,
        name: btn.dataset.name,
        price: isNaN(price) ? 0 : price, // Safety check
        imageUrl: btn.dataset.image,
        quantity: 1
      };

      const raw = localStorage.getItem("kalpnik_cart");
      const cart = raw ? JSON.parse(raw) : [];

      const existing = cart.find(c => c.id === item.id);
      if (existing) {
        existing.quantity += 1;
      } else {
        cart.push(item);
      }

      localStorage.setItem("kalpnik_cart", JSON.stringify(cart));
      
      // Update badge globally
      if(window.updateNavBadge) window.updateNavBadge();

      // Simple Toast
      const toast = document.querySelector(".toast");
      if(toast) {
        toast.style.opacity = "1";
        setTimeout(() => toast.style.opacity = "0", 2000);
      }
    };
  });
}

// --- Load from Firebase ---
async function loadProducts() {
  try {
    const q = query(collection(db, "products"), where("active", "==", true));
    const snap = await getDocs(q);
    allProducts = [];
    snap.forEach(doc => allProducts.push({ id: doc.id, ...doc.data() }));
    applyFilters();
  } catch (err) {
    console.error(err);
    if (gridEl) gridEl.innerHTML = "<p style='text-align:center'>Failed to load products.</p>";
  }
}

// Events
if (searchInput) searchInput.addEventListener("input", applyFilters);
if (categorySelect) categorySelect.addEventListener("change", applyFilters);
if (sortSelect) sortSelect.addEventListener("change", applyFilters);

document.addEventListener("DOMContentLoaded", loadProducts);