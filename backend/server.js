
const express = require("express");
const cors = require("cors");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
    res.send("Blendora Backend is running successfully!");
});

app.get("/api/health", (req, res) => {
    res.json({
        success: true,
        message: "Blendora API is working!"
    });
});

app.get("/api/products", (req, res) => {
    res.json([
        {
            id: 1,
            name: "Custom Blended Foundation",
            price: 799
        },
        {
            id: 2,
            name: "Custom Blended Concealer",
            price: 499
        }
    ]);
});

app.listen(PORT, () => {
    console.log(`Blendora server running on port ${PORT}`);
});
