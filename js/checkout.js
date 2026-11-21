
/* BLENDORA - CHECKOUT */

function getCheckoutCart() {
    try {
        return JSON.parse(localStorage.getItem("blendoraCart") || "[]");
    } catch (error) {
        return [];
    }
}

function getCheckoutTotal(cart) {
    return cart.reduce(function(total, item) {
        return total + Number(item.price || 0) *
            Number(item.quantity || 1);
    }, 0);
}

document.addEventListener("DOMContentLoaded", function() {

    const checkoutForm = document.getElementById("checkoutForm");

    const cart = getCheckoutCart();

    const totalElement = document.getElementById("checkoutTotal");

    if (totalElement) {
        totalElement.textContent =
            "₹" + getCheckoutTotal(cart).toFixed(2);
    }

    if (!checkoutForm) return;

    checkoutForm.addEventListener("submit", function(event) {

        event.preventDefault();

        if (cart.length === 0) {
            alert("Your cart is empty.");
            return;
        }

        const name = document.getElementById("name")?.value.trim();
        const email = document.getElementById("email")?.value.trim();
        const phone = document.getElementById("phone")?.value.trim();
        const address = document.getElementById("address")?.value.trim();

        if (!name || !email || !phone || !address) {
            alert("Please complete all delivery details.");
            return;
        }

        const order = {
            id: "ORD" + Date.now(),
            name: name,
            email: email,
            phone: phone,
            address: address,
            items: cart,
            total: getCheckoutTotal(cart),
            paymentMethod: "Cash on Delivery",
            status: "Pending",
            date: new Date().toISOString()
        };

        let orders = [];

        try {
            orders = JSON.parse(
                localStorage.getItem("blendoraOrders") || "[]"
            );
        } catch (error) {
            orders = [];
        }

        if (!Array.isArray(orders)) orders = [];

        orders.push(order);

        localStorage.setItem("blendoraOrders", JSON.stringify(orders));

        localStorage.setItem(
            "blendoraLastOrder",
            JSON.stringify(order)
        );

        localStorage.removeItem("blendoraCart");

        window.location.href = "order.html";
    });

});
