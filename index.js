require("dotenv").config();
const express = require("express");
const cors = require("cors");
const app = express();
const { MongoClient, ServerApiVersion } = require("mongodb");
const cookieParser = require("cookie-parser");
const jwt = require("jsonwebtoken");
const port = process.env.POST || 3000;

const corsOptions = {
  origin: ["http://localhost:5173"],
  credentials: true,
  optionSuccessStatus: 200,
};

app.use(cors(corsOptions));
app.use(express.json());
app.use(cookieParser());

// Verify Token Middleware
const verifyToken = async (req, res, next) => {
  const token = req.cookies?.token;
  if (!token) {
    return res.status(401).send({ message: "unauthorized access" });
  }
  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
    if (err) {
      console.log(err);
      return res.status(401).send({ message: "unauthorized access" });
    }
    req.user = decoded;
    next();
  });
};

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

    // auth related api
    app.post("/jwt", async (req, res) => {
      const user = req.body;
      const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, {
        expiresIn: "365d",
      });
      console.log(token);
      res
        .cookie("token", token, {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: process.env.NODE_ENV === "production" ? "none" : "strict",
        })
        .send({ success: true });
    });

    // get All products with pagination
    app.get("/product", verifyToken, async (req, res) => {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;
      const searchQuery = req.query.search || "";
      const category = req.query.category || "";
      const brand = req.query.brand || "";
      const priceRange = req.query.priceRange || "";
      const sortOption = req.query.sort || "";
      const skip = (page - 1) * limit;

      let filter = {};
      if (searchQuery) {
        filter.name = { $regex: searchQuery, $options: "i" };
      }
      if (category) {
        filter.category = category;
      }
      if (brand) {
        filter.brand = brand;
      }
      if (priceRange) {
        const [min, max] = priceRange.split("-").map(Number);
        filter.price = { $gte: min, $lte: max || Infinity };
      }

      let sort = {};
      if (sortOption === "price-asc") {
        sort.price = 1;
      } else if (sortOption === "price-desc") {
        sort.price = -1;
      } else if (sortOption === "date-desc") {
        sort.createdAt = -1;
      }

      const result = await productCollection
        .find(filter)
        .sort(sort)
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
