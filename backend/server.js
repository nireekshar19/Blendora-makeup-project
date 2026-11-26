
const express = require("express");
const cors = require("cors");
require("dotenv").config();

const { db, auth } = require("./firebase");

const app = express();

app.use(cors());
app.use(express.json());

// HOME
app.get("/", (req, res) => {
    res.send("Blendora Backend is Running!");
});

// FIREBASE HEALTH CHECK
app.get("/api/health", async (req, res) => {
    try {
        await db.collection("system").limit(1).get();

        res.json({
            success: true,
            message: "Blendora Backend and Firebase connected!"
        });
    } catch (error) {
        console.error(error);

        res.status(500).json({
            success: false,
            message: "Firebase connection failed"
        });
    }
});

// VERIFY FIREBASE LOGIN TOKEN
async function verifyUser(req, res, next) {
    try {
        const header = req.headers.authorization;

        if (!header || !header.startsWith("Bearer ")) {
            return res.status(401).json({
                success: false,
                message: "Authentication required"
            });
        }

        const token = header.split(" ")[1];

        req.user = await auth.verifyIdToken(token);

        next();
    } catch (error) {
        return res.status(401).json({
            success: false,
            message: "Invalid or expired login session"
        });
    }
}

// VERIFY SUPER ADMIN
async function verifySuperAdmin(req, res, next) {
    try {
        const adminDoc = await db.collection("users")
            .doc(req.user.uid)
            .get();

        if (!adminDoc.exists ||
            adminDoc.data().role !== "superadmin") {
            return res.status(403).json({
                success: false,
                message: "Super Admin access required"
            });
        }

        next();
    } catch (error) {
        console.error(error);

        res.status(500).json({
            success: false,
            message: "Unable to verify admin account"
        });
    }
}

// REGISTER CUSTOMER OR VENDOR
app.post("/api/account/register-role", verifyUser, async (req, res) => {
    try {
        const { role, name } = req.body;

        if (!["customer", "vendor"].includes(role)) {
            return res.status(400).json({
                success: false,
                message: "Invalid account role"
            });
        }

        if (!name || !name.trim()) {
            return res.status(400).json({
                success: false,
                message: "Name is required"
            });
        }

        const userRef = db.collection("users").doc(req.user.uid);
        const existingUser = await userRef.get();

        if (existingUser.exists) {
            return res.status(409).json({
                success: false,
                message: "Account profile already exists"
            });
        }

        await userRef.set({
            uid: req.user.uid,
            name: name.trim(),
            email: req.user.email || "",
            role,
            status: role === "vendor" ? "pending" : "active",
            createdAt: new Date().toISOString()
        });

        res.status(201).json({
            success: true,
            message: "Account profile created successfully",
            role
        });
    } catch (error) {
        console.error(error);

        res.status(500).json({
            success: false,
            message: "Unable to create account profile"
        });
    }
});

// GET PROFILE
app.get("/api/account/profile", verifyUser, async (req, res) => {
    try {
        const userDoc = await db.collection("users")
            .doc(req.user.uid)
            .get();

        if (!userDoc.exists) {
            return res.status(404).json({
                success: false,
                message: "Account profile not found"
            });
        }

        res.json({
            success: true,
            profile: userDoc.data()
        });
    } catch (error) {
        console.error(error);

        res.status(500).json({
            success: false,
            message: "Unable to load profile"
        });
    }
});

// CUSTOMER: PLACE ORDER
app.post("/api/orders", verifyUser, async (req, res) => {
    try {
        const customerUid = req.user.uid;

        const userDoc = await db.collection("users")
            .doc(customerUid)
            .get();

        if (!userDoc.exists ||
            userDoc.data().role !== "customer" ||
            userDoc.data().status !== "active") {
            return res.status(403).json({
                success: false,
                message: "Active customer account required"
            });
        }

        const { items, delivery } = req.body;

        if (!Array.isArray(items) || items.length === 0) {
            return res.status(400).json({
                success: false,
                message: "Cart is empty"
            });
        }

        if (!delivery ||
            !delivery.name ||
            !delivery.phone ||
            !delivery.address ||
            !delivery.city ||
            !delivery.pincode) {
            return res.status(400).json({
                success: false,
                message: "Complete delivery details are required"
            });
        }

        const vendorGroups = {};

        for (const cartItem of items) {
            const productId = cartItem.productId || cartItem.id;
            const quantity = Number(cartItem.quantity || 1);

            if (!productId ||
                !Number.isInteger(quantity) ||
                quantity < 1 ||
                quantity > 20) {
                return res.status(400).json({
                    success: false,
                    message: "Invalid cart item"
                });
            }

            const productDoc = await db.collection("products")
                .doc(productId)
                .get();

            if (!productDoc.exists) {
                return res.status(400).json({
                    success: false,
                    message: "A product in your cart no longer exists"
                });
            }

            const product = productDoc.data();
            const vendorUid = product.vendorUid;
            const price = Number(product.price);

            if (!vendorUid ||
                !Number.isFinite(price) ||
                price < 0) {
                return res.status(400).json({
                    success: false,
                    message: "Invalid product information"
                });
            }

            const vendorDoc = await db.collection("users")
                .doc(vendorUid)
                .get();

            if (!vendorDoc.exists ||
                vendorDoc.data().role !== "vendor" ||
                vendorDoc.data().status !== "approved") {
                return res.status(400).json({
                    success: false,
                    message: "A vendor in your cart is not approved"
                });
            }

            if (!vendorGroups[vendorUid]) {
                vendorGroups[vendorUid] = {
                    vendorUid,
                    vendorName: vendorDoc.data().name || "Vendor",
                    items: [],
                    total: 0
                };
            }

            const itemTotal = price * quantity;

            vendorGroups[vendorUid].items.push({
                productId,
                name: product.name || "Product",
                shade: product.shade || "",
                price,
                quantity,
                itemTotal
            });

            vendorGroups[vendorUid].total += itemTotal;
        }

        const batch = db.batch();
        const orderId = db.collection("orders").doc().id;
        const createdAt = new Date().toISOString();

        let grandTotal = 0;
        const vendorOrderIds = [];

        // CREATE VENDOR ORDERS
        for (const vendorUid of Object.keys(vendorGroups)) {
            const group = vendorGroups[vendorUid];

            grandTotal += group.total;

            const vendorOrderRef = db.collection("vendorOrders").doc();

            vendorOrderIds.push(vendorOrderRef.id);

            batch.set(vendorOrderRef, {
                orderId,
                vendorOrderId: vendorOrderRef.id,
                vendorUid: group.vendorUid,
                vendorName: group.vendorName,
                customerUid,
                customerName: delivery.name,
                customerEmail: req.user.email || "",
                customerPhone: delivery.phone,
                delivery: {
                    name: delivery.name,
                    phone: delivery.phone,
                    address: delivery.address,
                    city: delivery.city,
                    pincode: delivery.pincode
                },
                items: group.items,
                total: group.total,
                status: "Pending",
                paymentStatus: "demo_unpaid",
                createdAt
            });
        }

        // CREATE MAIN CUSTOMER ORDER
        const orderRef = db.collection("orders").doc(orderId);

        batch.set(orderRef, {
            orderId,
            customerUid,
            customerName: delivery.name,
            customerEmail: req.user.email || "",
            delivery,
            vendorOrderIds,
            total: grandTotal,
            status: "Pending",
            paymentStatus: "demo_unpaid",
            createdAt
        });

        await batch.commit();

        res.status(201).json({
            success: true,
            message: "Order placed successfully",
            orderId,
            total: grandTotal
        });

    } catch (error) {
        console.error("Place order error:", error);

        res.status(500).json({
            success: false,
            message: "Unable to place order"
        });
    }
});

// CUSTOMER: GET MY ORDER HISTORY
app.get("/api/orders/my", verifyUser, async (req, res) => {
    try {
        const customerUid = req.user.uid;

        const userDoc = await db.collection("users")
            .doc(customerUid)
            .get();

        if (!userDoc.exists ||
            userDoc.data().role !== "customer") {
            return res.status(403).json({
                success: false,
                message: "Customer account required"
            });
        }

        const snapshot = await db.collection("orders")
            .where("customerUid", "==", customerUid)
            .get();

        const orders = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));

        orders.sort((a, b) =>
            String(b.createdAt || "").localeCompare(
                String(a.createdAt || "")
            )
        );

        res.json({
            success: true,
            orders
        });

    } catch (error) {
        console.error("Order history error:", error);

        res.status(500).json({
            success: false,
            message: "Unable to load order history"
        });
    }
});

// VENDOR: GET OWN ORDERS
app.get("/api/vendor/orders", verifyUser, async (req, res) => {
    try {
        const vendorDoc = await db.collection("users")
            .doc(req.user.uid)
            .get();

        if (!vendorDoc.exists ||
            vendorDoc.data().role !== "vendor" ||
            vendorDoc.data().status !== "approved") {
            return res.status(403).json({
                success: false,
                message: "Approved vendor account required"
            });
        }

        const snapshot = await db.collection("vendorOrders")
            .where("vendorUid", "==", req.user.uid)
            .get();

        const orders = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));

        res.json({
            success: true,
            orders
        });
    } catch (error) {
        console.error(error);

        res.status(500).json({
            success: false,
            message: "Unable to load vendor orders"
        });
    }
});

// VENDOR: UPDATE OWN ORDER STATUS
app.patch("/api/vendor/orders/:orderId/status", verifyUser, async (req, res) => {
    try {
        const vendorDoc = await db.collection("users")
            .doc(req.user.uid)
            .get();

        if (!vendorDoc.exists ||
            vendorDoc.data().role !== "vendor" ||
            vendorDoc.data().status !== "approved") {
            return res.status(403).json({
                success: false,
                message: "Approved vendor account required"
            });
        }

        const allowedStatuses = [
            "Processing",
            "Shipped",
            "Delivered"
        ];

        const { status } = req.body;

        if (!allowedStatuses.includes(status)) {
            return res.status(400).json({
                success: false,
                message: "Invalid order status"
            });
        }

        const orderRef = db.collection("vendorOrders")
            .doc(req.params.orderId);

        const orderDoc = await orderRef.get();

        if (!orderDoc.exists ||
            orderDoc.data().vendorUid !== req.user.uid) {
            return res.status(404).json({
                success: false,
                message: "Order not found"
            });
        }

        await orderRef.update({
            status,
            updatedAt: new Date().toISOString()
        });

        res.json({
            success: true,
            message: "Order status updated",
            status
        });

    } catch (error) {
        console.error(error);

        res.status(500).json({
            success: false,
            message: "Unable to update order status"
        });
    }
});

// SUPER ADMIN: GET PENDING VENDORS
app.get(
    "/api/admin/vendors",
    verifyUser,
    verifySuperAdmin,
    async (req, res) => {
        try {
            const snapshot = await db.collection("users")
                .where("role", "==", "vendor")
                .where("status", "==", "pending")
                .get();

            const vendors = snapshot.docs.map(doc => ({
                uid: doc.id,
                ...doc.data()
            }));

            res.json({
                success: true,
                vendors
            });
        } catch (error) {
            console.error(error);

            res.status(500).json({
                success: false,
                message: "Unable to load vendor applications"
            });
        }
    }
);

// SUPER ADMIN: APPROVE OR REJECT VENDOR
app.patch(
    "/api/admin/vendors/:uid/status",
    verifyUser,
    verifySuperAdmin,
    async (req, res) => {
        try {
            const { status } = req.body;

            if (!["approved", "rejected"].includes(status)) {
                return res.status(400).json({
                    success: false,
                    message: "Status must be approved or rejected"
                });
            }

            const vendorRef = db.collection("users")
                .doc(req.params.uid);

            const vendorDoc = await vendorRef.get();

            if (!vendorDoc.exists ||
                vendorDoc.data().role !== "vendor") {
                return res.status(404).json({
                    success: false,
                    message: "Vendor not found"
                });
            }

            await vendorRef.update({
                status,
                updatedAt: new Date().toISOString()
            });

            res.json({
                success: true,
                message: `Vendor ${status} successfully`,
                status
            });
        } catch (error) {
            console.error(error);

            res.status(500).json({
                success: false,
                message: "Unable to update vendor status"
            });
        }
    }
);

// SUPER ADMIN: GET ALL CUSTOMER ORDERS
app.get(
    "/api/admin/orders",
    verifyUser,
    verifySuperAdmin,
    async (req, res) => {
        try {
            const snapshot = await db.collection("orders").get();

            const orders = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));

            orders.sort((a, b) =>
                String(b.createdAt || "").localeCompare(
                    String(a.createdAt || "")
                )
            );

            res.json({
                success: true,
                orders
            });

        } catch (error) {
            console.error("Admin orders error:", error);

            res.status(500).json({
                success: false,
                message: "Unable to load orders"
            });
        }
    }
);

// SUPER ADMIN: UPDATE ORDER STATUS
app.patch(
    "/api/admin/orders/:orderId/status",
    verifyUser,
    verifySuperAdmin,
    async (req, res) => {
        try {
            const { status } = req.body;

            const allowedStatuses = [
                "Pending",
                "Processing",
                "Shipped",
                "Delivered",
                "Cancelled"
            ];

            if (!allowedStatuses.includes(status)) {
                return res.status(400).json({
                    success: false,
                    message: "Invalid order status"
                });
            }

            const orderRef = db.collection("orders")
                .doc(req.params.orderId);

            const orderDoc = await orderRef.get();

            if (!orderDoc.exists) {
                return res.status(404).json({
                    success: false,
                    message: "Order not found"
                });
            }

            const batch = db.batch();

            batch.update(orderRef, {
                status,
                updatedAt: new Date().toISOString()
            });

            const vendorOrders = await db.collection("vendorOrders")
                .where("orderId", "==", req.params.orderId)
                .get();

            vendorOrders.docs.forEach(doc => {
                batch.update(doc.ref, {
                    status,
                    updatedAt: new Date().toISOString()
                });
            });

            await batch.commit();

            res.json({
                success: true,
                message: "Order status updated successfully",
                status
            });

        } catch (error) {
            console.error("Admin update order error:", error);

            res.status(500).json({
                success: false,
                message: "Unable to update order status"
            });
        }
    }
);

// START SERVER
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`Blendora server running on port ${PORT}`);
});
