import { auth, db, onAuthStateChanged } from "./firebase.js";
import { 
  collection, addDoc, getDocs, doc, deleteDoc, updateDoc, query, orderBy, serverTimestamp 
} from "https://www.gstatic.com/firebasejs/10.14.0/firebase-firestore.js";
import { signOut } from "https://www.gstatic.com/firebasejs/10.14.0/firebase-auth.js";

const ADMIN_EMAIL = "vinayjawai82@gmail.com"; 

// UI Elements
const gate = document.getElementById("adminGate");
const content = document.getElementById("adminContent");
const productForm = document.getElementById("productForm");
const productsList = document.getElementById("adminProductsList");
const ordersList = document.getElementById("ordersList");
const toast = document.getElementById("toast");
const cancelEditBtn = document.getElementById("cancelEditBtn");

// 1. Auth Check
onAuthStateChanged(auth, user => {
  if (user && user.email === ADMIN_EMAIL) {
    gate.style.display = "none";
    content.style.display = "block";
    loadProducts();
    loadOrders();
  } else {
    gate.innerHTML = "<h3>Access Denied</h3><p>You are not authorized.</p><a href='/login.html' class='btn btn-primary'>Go to Login</a>";
  }
});

// 2. Load Products
async function loadProducts() {
  productsList.innerHTML = "<p>Loading...</p>";
  const q = query(collection(db, "products"), orderBy("createdAt", "desc"));
  const snap = await getDocs(q);
  
  let html = "";
  snap.forEach(docSnap => {
    const p = docSnap.data();
    // Use the link directly
    const thumbSrc = p.imageUrl || "https://placehold.co/100x100?text=No+Img";

    html += `
      <div class="list-row">
        <div class="list-info">
          <img src="${thumbSrc}" class="list-thumb" style="object-fit:cover;">
          <div>
            <div style="font-weight:600;">${p.name}</div>
            <div style="font-size:0.85rem; color:grey;">₹${p.price} • ${p.category}</div>
          </div>
        </div>
        <div style="display:flex; gap:10px;">
          <button class="btn btn-outline" onclick="window.editProduct('${docSnap.id}', '${p.name}', '${p.price}', '${p.category}', '${p.imageUrl}', ${p.active})">Edit</button>
          <button class="btn btn-danger" onclick="window.deleteProduct('${docSnap.id}')">Delete</button>
        </div>
      </div>
    `;
  });
  productsList.innerHTML = html || "<p>No products yet.</p>";
}

// 3. Save / Update Product
productForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const id = productForm.docId.value;
  
  const payload = {
    name: productForm.name.value,
    price: Number(productForm.price.value),
    category: productForm.category.value,
    imageUrl: productForm.imageUrl.value,
    active: productForm.active.checked,
    updatedAt: serverTimestamp()
  };

  try {
    if (id) {
      await updateDoc(doc(db, "products", id), payload);
      showToast("Product Updated!");
    } else {
      payload.createdAt = serverTimestamp();
      await addDoc(collection(db, "products"), payload);
      showToast("Product Created!");
    }
    resetForm();
    loadProducts();
  } catch (err) {
    console.error(err);
    alert("Error saving product: " + err.message);
  }
});

// 4. Edit Logic
window.editProduct = (id, name, price, category, img, active) => {
  productForm.docId.value = id;
  productForm.name.value = name;
  productForm.price.value = price;
  productForm.category.value = category;
  productForm.imageUrl.value = (img === 'undefined') ? '' : img;
  productForm.active.checked = active; 
  
  document.getElementById("formTitle").textContent = "Edit Product";
  cancelEditBtn.style.display = "inline-block";
  window.scrollTo({ top: 0, behavior: 'smooth' });
};

// 5. Delete Logic
window.deleteProduct = async (id) => {
  if(!confirm("Are you sure? This cannot be undone.")) return;
  await deleteDoc(doc(db, "products", id));
  showToast("Product Deleted");
  loadProducts();
};

// 6. Reset Form
function resetForm() {
  productForm.reset();
  productForm.docId.value = "";
  document.getElementById("formTitle").textContent = "Add New Product";
  cancelEditBtn.style.display = "none";
}
cancelEditBtn.addEventListener("click", resetForm);

// 7. Load Orders
window.loadOrders = async () => {
  ordersList.innerHTML = "<p>Loading orders...</p>";
  try {
    const q = query(collection(db, "orders"), orderBy("createdAt", "desc"));
    const snap = await getDocs(q);
    
    if (snap.empty) {
      ordersList.innerHTML = "<p>No orders received yet.</p>";
      return;
    }

    let html = "";
    snap.forEach(docSnap => {
      const o = docSnap.data();
      const date = o.createdAt ? o.createdAt.toDate().toLocaleDateString() : "Unknown Date";
      let itemsHtml = o.items ? o.items.map(i => `<li>${i.quantity}x ${i.name}</li>`).join("") : "<li>Items unknown</li>";

      html += `
        <div class="order-card">
          <div class="order-header">
            <span>Order #${docSnap.id.slice(0,6)}</span>
            <span>${date}</span>
          </div>
          <div style="margin-bottom:0.5rem;">
            <strong>Customer:</strong> ${o.fullName} (${o.phone})<br>
            <span style="color:grey; font-size:0.9rem;">${o.email}</span>
          </div>
          <div style="background:#f9fafb; padding:0.5rem; border-radius:8px; font-size:0.9rem; margin-bottom:0.5rem;">
            <ul style="margin:0; padding-left:1.2rem;">${itemsHtml}</ul>
            <div style="text-align:right; font-weight:bold; margin-top:0.5rem;">Total: ₹${o.total}</div>
          </div>
          <div style="display:flex; justify-content:space-between; align-items:center;">
            <span class="status-badge ${o.status === 'shipped' ? 'shipped' : ''}">${o.status || 'Pending'}</span>
            ${o.status !== 'shipped' ? 
              `<button class="btn btn-primary" style="font-size:0.75rem; padding:4px 12px;" onclick="window.markShipped('${docSnap.id}')">Mark Shipped</button>` 
              : ''}
          </div>
        </div>
      `;
    });
    ordersList.innerHTML = html;
  } catch (err) {
    console.error(err);
    ordersList.innerHTML = "<p style='color:red'>Error loading orders. Check permissions.</p>";
  }
};

window.markShipped = async (id) => {
  if(!confirm("Mark this order as completed/shipped?")) return;
  await updateDoc(doc(db, "orders", id), { status: "shipped" });
  showToast("Order Updated");
  loadOrders();
};

document.getElementById("logoutBtn").addEventListener("click", () => {
  signOut(auth).then(() => window.location.href = "/login.html");
});

function showToast(msg) {
  toast.textContent = msg;
  toast.style.opacity = "1";
  setTimeout(() => toast.style.opacity = "0", 3000);
}