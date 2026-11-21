
/* BLENDORA - SHOPPING CART */

function getCart() {
    try {
        return JSON.parse(localStorage.getItem("blendoraCart") || "[]");
    } catch (error) {
        return [];
    }
}

function saveCart(cart) {
    localStorage.setItem("blendoraCart", JSON.stringify(cart));
}

function addToCart(product) {

    const cart = getCart();

    const existing = cart.find(item =>
        item.id === product.id
    );

    if (existing) {
        existing.quantity = (existing.quantity || 1) + 1;
    } else {
        cart.push({
            ...product,
            quantity: 1
        });
    }

    saveCart(cart);

    alert("Product added to cart!");
}

function removeFromCart(productId) {

    const cart = getCart().filter(item =>
        String(item.id) !== String(productId)
    );

    saveCart(cart);
    displayCart();
}

function changeCartQuantity(productId, quantity) {

    const cart = getCart();

    const item = cart.find(item =>
        String(item.id) === String(productId)
    );

    if (!item) return;

    item.quantity = Math.max(1, Number(quantity) || 1);

    saveCart(cart);
    displayCart();
}

function calculateCartTotal() {

    return getCart().reduce(function(total, item) {
        return total + Number(item.price || 0) *
            Number(item.quantity || 1);
    }, 0);
}

function displayCart() {

    const container =
        document.getElementById("cartItems") ||
        document.getElementById("cartContainer");

    const totalElement = document.getElementById("cartTotal");

    if (!container) return;

    const cart = getCart();

    container.innerHTML = "";

    if (cart.length === 0) {
        container.textContent = "Your cart is empty.";
        if (totalElement) totalElement.textContent = "₹0.00";
        return;
    }

    cart.forEach(function(item) {

        const row = document.createElement("div");
        row.className = "cart-item";

        const name = document.createElement("h3");
        name.textContent = item.name || "Product";

        const price = document.createElement("p");
        price.textContent = "₹" + Number(item.price || 0).toFixed(2);

        const quantity = document.createElement("input");
        quantity.type = "number";
        quantity.min = "1";
        quantity.value = item.quantity || 1;

        quantity.addEventListener("change", function() {
            changeCartQuantity(item.id, quantity.value);
        });

        const removeButton = document.createElement("button");
        removeButton.textContent = "Remove";

        removeButton.addEventListener("click", function() {
            removeFromCart(item.id);
        });

        row.append(name, price, quantity, removeButton);
        container.appendChild(row);
    });

    if (totalElement) {
        totalElement.textContent =
            "₹" + calculateCartTotal().toFixed(2);
    }
}

// Add-to-cart buttons using data attributes
document.addEventListener("click", function(event) {

    const button = event.target.closest("[data-add-to-cart]");

    if (!button) return;

    const product = {
        id: button.dataset.id,
        name: button.dataset.name,
        price: Number(button.dataset.price)
    };

    if (!product.id || !product.name || !Number.isFinite(product.price)) {
        alert("Product information is missing.");
        return;
    }

    addToCart(product);
});

document.addEventListener("DOMContentLoaded", displayCart);
