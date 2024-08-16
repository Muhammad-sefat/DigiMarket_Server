require("dotenv").config();
const express = require("express");
const cors = require("cors");
const app = express();
const { MongoClient, ServerApiVersion } = require("mongodb");
const jwt = require("jsonwebtoken");
const port = process.env.POST || 3000;

app.use(cors());
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.dbn21dt.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();
    const productCollection = client.db("DigiMarket").collection("products");

    // get All products with pagination
    app.get("/product", async (req, res) => {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;
      const searchQuery = req.query.search || "";
      const category = req.query.category || "";
      const brand = req.query.brand || "";
      const priceRange = req.query.priceRange || "";
      const sortOption = req.query.sort || "";
      const skip = (page - 1) * limit;

      const filter = searchQuery
        ? { name: { $regex: searchQuery, $options: "i" } }
        : {};

      const result = await productCollection
        .find(filter)
        .skip(skip)
        .limit(limit)
        .toArray();

      const totalItems = await productCollection.countDocuments(filter);

      res.send({
        data: result,
        currentPage: page,
        totalPages: Math.ceil(totalItems / limit),
      });
    });

    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );
  } finally {
  }
}
run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("Server is Runing with Full speed");
});
app.listen(port, () => {
  console.log(`Server is runing from ${port}`);
});
