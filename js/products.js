// public/js/products.js
// Modern Kalpnik3D shop loader – Firestore + filters + animations

import { db } from "./firebase.js";
import {
  collection,
  getDocs,
  query,
  where
} from "https://www.gstatic.com/firebasejs/10.14.0/firebase-firestore.js";

const gridEl = document.getElementById("productsGrid");
const skeletonEl = document.getElementById("productSkeleton");
const emptyEl = document.getElementById("emptyState");
const errorEl = document.getElementById("shopError");

const searchInput = document.getElementById("searchInput");
const categorySelect = document.getElementById("categoryFilter");
const sortSelect = document.getElementById("sortSelect");

let allProducts = [];

// --------- UI helpers ---------

function showSkeleton(show) {
  if (!skeletonEl) return;
  skeletonEl.style.display = show ? "grid" : "none";
}

function showGrid(show) {
  if (!gridEl) return;
  gridEl.hidden = !show;
}

function showEmpty(show) {
  if (!emptyEl) return;
  emptyEl.style.display = show ? "flex" : "none";
}

function setError(message) {
  if (!errorEl) return;
  errorEl.textContent = message || "";
  errorEl.style.display = message ? "block" : "none";
}

// --------- Render logic ---------

function formatINR(amount) {
  if (!amount && amount !== 0) return "—";
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0
  }).format(amount);
}

function buildProductCard(p) {
  const priceLabel = formatINR(p.price);

  return `
    <article class="product-card" data-category="${p.category || "other"}">
      <div class="product-image-wrap">
        <img
          src="${p.image || "/img/product-placeholder.jpg"}"
          alt="${p.name || "Kalpnik3D product"}"
          loading="lazy"
        />
        ${p.tag ? `<span class="product-badge">${p.tag}</span>` : ""}
      </div>
      <div class="product-body">
        <h3>${p.name || "Untitled piece"}</h3>
        <p class="product-category">
          ${p.category ? p.category.toUpperCase() : "MINIATURE"}
        </p>
        <p class="product-price">${priceLabel}</p>
        <p class="product-desc">
          ${p.desc || "Hand-crafted 3D miniature from Kalpnik3D Studio."}
        </p>
        <button
          class="btn primary btn-add-cart"
          data-id="${p.id}"
          data-name="${p.name}"
          data-price="${p.price}"
          data-image="${p.image || ""}"
        >
          Add to cart
        </button>
      </div>
    </article>
  `;
}

function applyFilters() {
  if (!gridEl) return;

  const searchTerm = (searchInput?.value || "").toLowerCase();
  const category = categorySelect?.value || "all";
  const sort = sortSelect?.value || "featured";

  let filtered = [...allProducts];

  // text search
  if (searchTerm) {
    filtered = filtered.filter((p) => {
      const text = `${p.name || ""} ${p.category || ""} ${p.desc || ""}`.toLowerCase();
      return text.includes(searchTerm);
    });
  }

  // category filter
  if (category !== "all") {
    filtered = filtered.filter((p) => (p.category || "").toLowerCase() === category);
  }

  // sort
  if (sort === "price-asc") {
    filtered.sort((a, b) => (a.price || 0) - (b.price || 0));
  } else if (sort === "price-desc") {
    filtered.sort((a, b) => (b.price || 0) - (a.price || 0));
  } else if (sort === "latest") {
    filtered.sort((a, b) => {
      const aT = a.createdAt?.seconds || 0;
      const bT = b.createdAt?.seconds || 0;
      return bT - aT;
    });
  }

  // render
  if (!filtered.length) {
    gridEl.innerHTML = "";
    showGrid(false);
    showEmpty(true);
    return;
  }

  const html = filtered.map(buildProductCard).join("");
  gridEl.innerHTML = html;
  showEmpty(false);
  showGrid(true);

  // attach “Add to cart” handlers
  wireAddToCartButtons();
}

// --------- Cart bridge (localStorage for now) ---------

function wireAddToCartButtons() {
  const buttons = gridEl.querySelectorAll(".btn-add-cart");
  buttons.forEach((btn) => {
    btn.addEventListener("click", () => {
      const item = {
        id: btn.dataset.id,
        name: btn.dataset.name,
        price: Number(btn.dataset.price || 0),
        image: btn.dataset.image || "",
        qty: 1
      };

      const raw = localStorage.getItem("kalpnik_cart");
      const cart = raw ? JSON.parse(raw) : [];

      const existing = cart.find((c) => c.id === item.id);
      if (existing) {
        existing.qty += 1;
      } else {
        cart.push(item);
      }

      localStorage.setItem("kalpnik_cart", JSON.stringify(cart));

      // simple toast – you can replace with your global toast later
      const toast = document.querySelector(".toast");
      if (toast) {
        toast.textContent = `${item.name} added to cart`;
        toast.classList.add("show");
        setTimeout(() => toast.classList.remove("show"), 2000);
      }
    });
  });
}

// --------- Firestore load ---------

async function loadProducts() {
  try {
    setError("");
    showSkeleton(true);
    showGrid(false);
    showEmpty(false);

    // Only “active” products
    const baseRef = collection(db, "products");
    const qRef = query(baseRef, where("active", "==", true));
    const snap = await getDocs(qRef);

    allProducts = [];
    snap.forEach((docSnap) => {
      const data = docSnap.data();
      allProducts.push({
        id: docSnap.id,
        ...data
      });
    });

    // if no products yet, at least show empty state
    if (!allProducts.length) {
      showSkeleton(false);
      applyFilters();
      return;
    }

    showSkeleton(false);
    applyFilters();
  } catch (err) {
    console.error("Failed to load products", err);
    showSkeleton(false);
    setError("Failed to load products. Please try again in a bit.");
    showGrid(false);
    showEmpty(false);
  }
}

// --------- Events ---------

if (searchInput) searchInput.addEventListener("input", () => applyFilters());
if (categorySelect) categorySelect.addEventListener("change", () => applyFilters());
if (sortSelect) sortSelect.addEventListener("change", () => applyFilters());

// Kick off once DOM is ready
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", loadProducts);
} else {
  loadProducts();
}
