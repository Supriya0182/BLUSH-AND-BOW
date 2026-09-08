/* =========================================================
   BLUSH & BOW — COMMON CART SYSTEM
   Uses localStorage so pages can share the same cart.
========================================================= */

const CART_KEY = "blushAndBowCart";

function getCart() {
  try {
    return JSON.parse(localStorage.getItem(CART_KEY)) || [];
  } catch {
    return [];
  }
}

function saveCart(cart) {
  localStorage.setItem(CART_KEY, JSON.stringify(cart));
}

function addToCart(product, quantity = 1, button = null) {
  const cart = getCart();
  const existing = cart.find(item => item.id === product.id);

  if (existing) {
    existing.quantity += quantity;
  } else {
    cart.push({ ...product, quantity });
  }

  saveCart(cart);
  updateCartCount();

  if (button) {
    const item = cart.find(item => item.id === product.id);
    button.textContent = "+" + item.quantity;
    button.classList.add("added");
  }

  showCartMessage(`✓ ${product.name} added to cart`);
}

function removeFromCart(id) {
  saveCart(getCart().filter(item => item.id !== id));
  renderCart();
  updateCartCount();
}

function changeQuantity(id, change) {
  const cart = getCart();
  const item = cart.find(product => product.id === id);

  if (!item) return;

  item.quantity += change;

  if (item.quantity <= 0) {
    removeFromCart(id);
    return;
  }

  saveCart(cart);
  renderCart();
  updateCartCount();
}

function cartSubtotal() {
  return getCart().reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );
}

function shippingCost() {
  const subtotal = cartSubtotal();
  if (subtotal === 0 || subtotal >= 499) return 0;
  return 49;
}

function cartTotal() {
  return cartSubtotal() + shippingCost();
}

function formatMoney(value) {
  return "₹" + Number(value).toLocaleString("en-IN");
}

function updateCartCount() {
  const count = getCart().reduce((sum, item) => sum + item.quantity, 0);

  document.querySelectorAll("[data-cart-count]").forEach(el => {
    el.textContent = count;
    el.classList.toggle("has-items", count > 0);
  });
}

function showCartMessage(message) {
  let toast = document.querySelector(".cart-toast");

  if (!toast) {
    toast = document.createElement("div");
    toast.className = "cart-toast";
    document.body.appendChild(toast);
  }

  toast.textContent = message;
  toast.classList.add("show");

  clearTimeout(window.bnbToastTimer);
  window.bnbToastTimer = setTimeout(() => {
    toast.classList.remove("show");
  }, 1800);
}

function renderCart() {
  const container = document.querySelector("#cartItems");
  if (!container) return;

  const cart = getCart();
  const empty = document.querySelector("#emptyCart");
  const summary = document.querySelector("#cartSummary");

  if (cart.length === 0) {
    container.innerHTML = "";
    if (empty) empty.classList.add("show");
    if (summary) summary.classList.add("hidden");
    return;
  }

  if (empty) empty.classList.remove("show");
  if (summary) summary.classList.remove("hidden");

  container.innerHTML = cart.map(item => `
    <article class="cart-item">
      <div class="cart-image">${item.shortName || "B&B"}</div>

      <div class="cart-product">
        <span class="tag">${item.tag || "B&B"}</span>
        <h2>${item.name}</h2>
        <p>${item.description || ""}</p>
        <button class="remove" type="button"
          onclick="removeFromCart('${item.id}')">Remove</button>
      </div>

      <div class="cart-qty">
        <button type="button" onclick="changeQuantity('${item.id}', -1)">−</button>
        <strong>${item.quantity}</strong>
        <button type="button" onclick="changeQuantity('${item.id}', 1)">+</button>
      </div>

      <strong class="item-total">
        ${formatMoney(item.price * item.quantity)}
      </strong>
    </article>
  `).join("");

  const subtotal = cartSubtotal();
  const shipping = shippingCost();

  const subtotalEl = document.querySelector("#subtotal");
  const shippingEl = document.querySelector("#shipping");
  const totalEl = document.querySelector("#total");

  if (subtotalEl) subtotalEl.textContent = formatMoney(subtotal);
  if (shippingEl) shippingEl.textContent = shipping === 0 ? "FREE" : formatMoney(shipping);
  if (totalEl) totalEl.textContent = formatMoney(cartTotal());
}

function productFromPage() {
  return {
    id: document.body.dataset.productId || "pink-pretty-hamper",
    name: document.body.dataset.productName || "Pink Pretty Hamper",
    price: Number(document.body.dataset.productPrice || 199),
    description: document.body.dataset.productDescription || "Pretty hair accessories hamper.",
    tag: "B&B BESTSELLER",
    shortName: "B&B"
  };
}

document.addEventListener("DOMContentLoaded", () => {
  updateCartCount();
  renderCart();

  const addButton = document.querySelector("[data-add-product]");

  if (addButton) {
    addButton.addEventListener("click", () => {
      const product = productFromPage();
      const quantity = Number(document.querySelector("#qty")?.textContent || 1);

      addToCart(product, quantity);
    });
  }

  const buyButton = document.querySelector("[data-buy-now]");

  if (buyButton) {
    buyButton.addEventListener("click", () => {
      const product = productFromPage();
      const quantity = Number(document.querySelector("#qty")?.textContent || 1);

      addToCart(product, quantity);
      setTimeout(() => {
        window.location.href = "cart.html";
      }, 300);
    });
  }

  document.querySelectorAll(".product-link").forEach(link => {
    link.addEventListener("click", event => {
      event.preventDefault();
      window.location.href = link.getAttribute("href");
    });
  });
});
