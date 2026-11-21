
/* Blendora Admin - Shared JavaScript */

// Check whether admin is logged in
function checkAdminLogin() {
    const isLoggedIn =
        sessionStorage.getItem("blendoraAdminLoggedIn");

    if (isLoggedIn !== "true") {
        window.location.replace("admin-login.html");
        return false;
    }

    return true;
}

// Logout admin
function adminLogout() {
    sessionStorage.removeItem("blendoraAdminLoggedIn");
    window.location.replace("admin-login.html");
}

// Read data from localStorage safely
function getAdminData(key) {
    try {
        return JSON.parse(localStorage.getItem(key) || "[]");
    } catch (error) {
        console.error("Unable to read data:", key, error);
        return [];
    }
}

// Save data to localStorage
function saveAdminData(key, data) {
    try {
        localStorage.setItem(key, JSON.stringify(data));
        return true;
    } catch (error) {
        console.error("Unable to save data:", key, error);
        alert("Unable to save data. Please check browser storage.");
        return false;
    }
}

// Dashboard statistics
function getAdminStatistics() {

    const products = getAdminData("blendoraProducts");
    const customers = getAdminData("blendoraProfiles");
    const orders = getAdminData("blendoraOrders");
    const requests = getAdminData("blendoraRequests");

    const revenue = orders.reduce(function(total, order) {
        return total + Number(
            order.total || order.totalAmount || 0
        );
    }, 0);

    return {
        totalProducts: products.length,
        totalCustomers: customers.length,
        totalOrders: orders.length,
        totalRequests: requests.length,
        totalRevenue: revenue
    };
}

// Update order status
function updateAdminOrderStatus(orderIndex, newStatus) {

    const orders = getAdminData("blendoraOrders");

    if (!orders[orderIndex]) {
        return false;
    }

    orders[orderIndex].status = newStatus;

    return saveAdminData("blendoraOrders", orders);
}

// Update blend request status
function updateBlendRequestStatus(requestIndex, newStatus) {

    const requests = getAdminData("blendoraRequests");

    if (!requests[requestIndex]) {
        return false;
    }

    requests[requestIndex].status = newStatus;

    return saveAdminData("blendoraRequests", requests);
}

// Delete a product
function deleteAdminProduct(productIndex) {

    const products = getAdminData("blendoraProducts");

    if (!products[productIndex]) {
        return false;
    }

    products.splice(productIndex, 1);

    return saveAdminData("blendoraProducts", products);
}

// Format currency
function formatAdminCurrency(amount) {

    return new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency: "INR"
    }).format(Number(amount) || 0);
}

// Format date
function formatAdminDate(dateValue) {

    if (!dateValue) {
        return "Not available";
    }

    const date = new Date(dateValue);

    if (Number.isNaN(date.getTime())) {
        return "Not available";
    }

    return date.toLocaleDateString("en-IN");
}
