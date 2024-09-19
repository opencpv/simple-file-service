const express = require("express");
const fileUpload = require("express-fileupload");
const path = require("path");
const cors = require("cors"); // Add this line
const ptp = require("pdf-to-printer");
const { exec } = require("child_process");
const bodyParser = require("body-parser"); // Add this import

const app = express();

// Enable CORS for all routes
app.use(cors()); // Add this line
app.use(bodyParser.json()); // Add this line to parse JSON request bodies

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

// Add a new route to get the list of connected printers using shell command
app.get("/printers", function (req, res) {
  exec("lpstat -p -d", (error, stdout, stderr) => {
    if (error) {
      return res.status(500).send("Error retrieving printers: " + stderr);
    }

    // Process the output to extract printer names, statuses, and enabled status
    const printers = stdout
      .split("\n")
      .filter((line) => line.startsWith("printer")) // Filter lines that start with 'printer'
      .map((line) => {
        const parts = line.split(" ");
        const name = parts[1]; // Printer name
        const status = parts.slice(3).join(" "); // Status message
        const enabled = status.includes("enabled"); // Check if printer is enabled
        return { name, status, enabled }; // Return an object with name, status, and enabled
      });

    res.json(printers);
  });
});

// Add a new route to initiate printing
app.post("/print", function (req, res) {
  console.log(req.body);
  const { filename, printerName } = req.body; // Get filename and printer name from request body
  const filePath = path.join(__dirname, "files", filename);
  // Command to print the file using the specified printer, escaping spaces in the file path
  const printCommand = `lp -d ${printerName} "${filePath}"`; // {{ edit_1 }}

  exec(printCommand, (error, stdout, stderr) => {
    if (error) {
      console.log(error);
      return res.status(500).send("Error printing file: " + stderr);
    }
    console.log(stdout);
    res.json({ message: "Print job initiated successfully!" });
  });
});

const port = 5000; // You can change this to any port you prefer
app.listen(port, () => {
  console.log(`File upload server running on port ${port}`);
});
