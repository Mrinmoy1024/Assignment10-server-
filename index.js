const express = require("express");
const app = express();
const port = 3000;
require("dotenv").config();
const cors = require("cors");
app.use(
  cors({
    origin: ["http://localhost:5173"],
  }),
);
app.use(express.json());

const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.djs940x.mongodb.net/?appName=Cluster0`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    // await client.connect();

    const db = client.db("Habit");
    const habitCollection = db.collection("habits");
    const myHabitCollection = db.collection("my-habits");
    app.get("/habits", async (req, res) => {
      const result = await habitCollection.find().toArray();
      res.send(result);
    });

    app.get("/featured-habits", async (req, res) => {
      const limit = parseInt(req.query.limit) || 0;

      const habits = await habitCollection
        .find()
        .sort({ createdAt: -1 })
        .limit(6)
        .toArray();

      res.send(habits);
    });

    app.post("/users", async (req, res) => {
      const user = req.body;
      const { email, displayName, photoURL } = user;
      const query = { email: email };
      const usersCollection = db.collection("users");
      const existingUser = await usersCollection.findOne({ email: user.email });

      if (existingUser) {
        return res.send({ message: "User already exists" });
      } else {
        const result = await usersCollection.insertOne(user);
        res.send(result);
      }
    });
    app.post("/my-habits", async (req, res) => {
      const myHabit = req.body;

      const result = await myHabitCollection.insertOne(myHabit);
      res.send(result);
    });
    app.get("/my-habits", async (req, res) => {
      const email = req.query.email;

      const query = email ? { userEmail: email } : {};
      const result = await myHabitCollection.find(query).toArray();

      res.send(result);
    });
    // Delete a habit by ID
    app.delete("/my-habits/:id", async (req, res) => {
      const id = req.params.id;

      if (!ObjectId.isValid(id)) {
        return res.status(400).send({ message: "Invalid habit ID" });
      }

      try {
        const result = await myHabitCollection.deleteOne({
          _id: new ObjectId(id),
        });

        if (result.deletedCount === 1) {
          res.send({ deletedCount: 1, message: "Habit deleted successfully" });
        } else {
          res.status(404).send({ deletedCount: 0, message: "Habit not found" });
        }
      } catch (err) {
        console.error(err);
        res.status(500).send({ deletedCount: 0, message: "Server error" });
      }
    });
    // Connect the client to the server	(optional starting in v4.7)
    // await client.connect();
    // Send a ping to confirm a successful connection
    // await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!",
    );
  } finally {
  }
}
run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("Hello World!");
});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
