// Document schema
const mongoose = require("mongoose");

const DocumentSchema = new mongoose.Schema({
  documentId: String,
  content: Object
});

module.exports = mongoose.model("Document", DocumentSchema);
