import { collection, getDocs } from 
"https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

async function loadProducts() {
  const productGrid = document.getElementById("productGrid");
  const querySnapshot = await getDocs(collection(db, "products"));

  let html = "";
  querySnapshot.forEach((doc) => {
    const p = doc.data();
    html += `
      <div class="product-card">
        <img src="${p.image}">
        <h3>${p.name}</h3>
        <p class="price">₹${p.price}</p>
        <a href="product.html?id=${doc.id}" class="btn-secondary">View</a>
      </div>
    `;
  });

  productGrid.innerHTML = html;
}

window.onload = loadProducts;
