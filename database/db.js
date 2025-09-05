const mongoose = require("mongoose");

const connect = () => {
  const MONGO_URL =
    process.env.MONGO_URL ||
    "mongodb+srv://krupalpatel3571:Krupal%231909@cluster0.xpeoqci.mongodb.net/chat-mern-stack";
  mongoose
    .connect(MONGO_URL, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    })
    .then(() => {
      console.log("Connected to MongoDB");
    })
    .catch((err) => {
      console.log("getting error while connecting to MongoDB", err);
    });
};

module.exports = connect;