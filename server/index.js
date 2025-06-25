// Importing required modules
const express = require("express");
const mongoose = require("mongoose");
const http = require("http");
const cors = require("cors");
const { Server } = require("socket.io");
const Document = require("./models/Document");

// Basic server setup
const app = express();
app.use(cors());
app.use(express.json());
const server = http.createServer(app);

// Socket.IO for real-time connection
const io = new Server(server, {
  cors: {
    origin: "*",
  }
});

// MongoDB connection
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});


// Real-time document collaboration logic
io.on("connection", socket => {
  socket.on("get-document", async documentId => {
    const document = await findOrCreateDocument(documentId);
    socket.join(documentId);
    socket.emit("load-document", document.content);

    socket.on("send-changes", delta => {
      socket.broadcast.to(documentId).emit("receive-changes", delta);
    });

    socket.on("save-document", async data => {
      await Document.findOneAndUpdate({ documentId }, { content: data });
    });
  });
});

// Helper function to find or create a document
async function findOrCreateDocument(id) {
  if (!id) return;

  const doc = await Document.findOne({ documentId: id });
  if (doc) return doc;

  return await Document.create({ documentId: id, content: "" });
}

// Start the server
server.listen(5000, () => {
  console.log("Server running on port 5000");
});
