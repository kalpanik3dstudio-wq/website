// js/sitesettings.js
import { db } from "./firebase.js";
import {
  doc,
  getDoc
} from "https://www.gstatic.com/firebasejs/10.14.0/firebase-firestore.js";

async function applySiteSettings() {
  if (!db) {
    console.warn("Firestore not available for site settings.");
    return;
  }

  try {
    const ref = doc(db, "site", "settings");
    const snap = await getDoc(ref);

    if (!snap.exists()) {
      console.log("No site settings document found.");
      return;
    }

    const settings = snap.data() || {};

    // --- NAV BRAND ---
    const brandNameEl = document.querySelector(".site-brand-name");
    const logoImgEl = document.querySelector(".site-logo-img");
    const fallbackLogoEl = document.querySelector(".nav-logo");

    if (brandNameEl && settings.title) {
      brandNameEl.textContent = settings.title;
    }

    if (logoImgEl && settings.logoUrl) {
      logoImgEl.src = settings.logoUrl;
      if (fallbackLogoEl) fallbackLogoEl.style.display = "none";
      logoImgEl.style.display = "block";
    }

    // --- HERO (only on index/home) ---
    const heroTitleEl = document.querySelector("[data-hero-title]");
    const heroSubtitleEl = document.querySelector("[data-hero-subtitle]");
    const heroTaglineEl = document.querySelector("[data-hero-tagline]");
    const heroImageEl = document.querySelector("[data-hero-image]");

    if (heroTitleEl && settings.heroTitle) {
      heroTitleEl.textContent = settings.heroTitle;
    }
    if (heroSubtitleEl && settings.heroSubtitle) {
      heroSubtitleEl.textContent = settings.heroSubtitle;
    }
    if (heroTaglineEl && settings.heroTagline) {
      heroTaglineEl.textContent = settings.heroTagline;
    }
    if (heroImageEl && settings.heroImageUrl) {
      heroImageEl.src = settings.heroImageUrl;
    }

    // --- SHOP STATE / MAINTENANCE (for shop page) ---
    const maintenanceBanner = document.getElementById("maintenance-banner");
    const maintenanceMessageEl = document.getElementById("maintenance-message");

    if (maintenanceBanner && maintenanceMessageEl) {
      const isMaintenance = !!settings.maintenanceMode;
      if (isMaintenance) {
        maintenanceBanner.style.display = "flex";
        maintenanceMessageEl.textContent =
          settings.maintenanceMessage ||
          "Our shop is temporarily offline for a short maintenance window.";
      } else {
        maintenanceBanner.style.display = "none";
      }
    }

    const shopStatusBadge = document.getElementById("shop-status-badge");
    if (shopStatusBadge) {
      if (settings.shopOpen === false || settings.maintenanceMode) {
        shopStatusBadge.textContent = "Closed for now";
        shopStatusBadge.classList.remove("badge-live");
        shopStatusBadge.classList.add("badge-maintenance");
      } else {
        shopStatusBadge.textContent = "Now accepting orders";
        shopStatusBadge.classList.remove("badge-maintenance");
        shopStatusBadge.classList.add("badge-live");
      }
    }

    // --- FOOTER (new) ---
    const footerMainTextEl = document.getElementById("footer-main-text");
    const footerPromoEl = document.getElementById("footer-promo");
    const footerPromoTextEl = document.getElementById("footer-promo-text");
    const footerPromoLinkEl = document.getElementById("footer-promo-link");

    if (footerMainTextEl && settings.footerMainText) {
      footerMainTextEl.textContent = settings.footerMainText;
    }

    const promoEnabled = !!settings.footerPromoEnabled;
    if (
      footerPromoEl &&
      promoEnabled &&
      (settings.footerPromoText || settings.footerPromoCtaLabel || settings.footerPromoUrl)
    ) {
      footerPromoEl.style.display = "inline-flex";

      if (footerPromoTextEl && settings.footerPromoText) {
        footerPromoTextEl.textContent = settings.footerPromoText;
      }

      if (footerPromoLinkEl) {
        footerPromoLinkEl.href = settings.footerPromoUrl || "#";
        footerPromoLinkEl.textContent =
          settings.footerPromoCtaLabel || "Know more →";
      }
    } else if (footerPromoEl) {
      footerPromoEl.style.display = "none";
    }
  } catch (err) {
    console.error("Failed to apply site settings:", err);
  }
}

document.addEventListener("DOMContentLoaded", applySiteSettings);
