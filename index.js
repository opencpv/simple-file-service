const express = require("express");
const fileUpload = require("express-fileupload");
const path = require("path");
const cors = require("cors"); // Add this line

const app = express();

// Enable CORS for all routes
app.use(cors()); // Add this line

// default options
app.use(fileUpload());

// Serve files from the 'files' directory
app.use("/files", express.static(path.join(__dirname, "files")));

app.post("/upload", function (req, res) {
  let sampleFile;
  let uploadPath;

  if (!req.files || Object.keys(req.files).length === 0) {
    return res.status(400).send("No files were uploaded.");
  }

  // The name of the input field (i.e. "sampleFile") is used to retrieve the uploaded file
  sampleFile = req.files.sampleFile;
  uploadPath = __dirname + "/files/" + sampleFile.name;

  // Use the mv() method to place the file somewhere on your server
  sampleFile.mv(uploadPath, function (err) {
    if (err) return res.status(500).send(err);

    // Generate the URL for the uploaded file
    const fileUrl = `${req.protocol}://${req.get("host")}/files/${
      sampleFile.name
    }`;
    res.json({ message: "File uploaded!", url: fileUrl });
  });
});

// Add a new route to serve files
app.get("/download/:filename", function (req, res) {
  const filename = req.params.filename;
  const filePath = path.join(__dirname, "files", filename);
  res.download(filePath, (err) => {
    if (err) {
      res.status(404).send("File not found");
    }
  });
});

const port = 5000; // You can change this to any port you prefer
app.listen(port, () => {
  console.log(`File upload server running on port ${port}`);
});
