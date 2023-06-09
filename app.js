const express = require('express');
const multer = require('multer');
const fs = require('fs');
const { spawn } = require('child_process');
const AWS = require('aws-sdk');

const app = express();
app.use(express.static('public')); // Serve static files from the public directory
const upload = multer({ dest: 'uploads/' });

// Configure the AWS SDK
AWS.config.update({
  region: 'us-east-1',
});

// Define an endpoint to upload an image
app.post('/upload', upload.single('image'), (req, res) => {
  const { path } = req.file;
  const s3 = new AWS.S3();
  const bucketName = 'readdl';

  // Upload the image to the S3 bucket
  const fileContent = fs.readFileSync(path);
  const params = {
    Bucket: bucketName,
    Key: req.file.originalname,
    Body: fileContent,
    ContentType: req.file.mimetype,
  };

  s3.upload(params, (err, data) => {
    if (err) {
      res.status(500).send(err);
    } else {
      // Call the Python script to analyze the image
      const python = spawn('python', ['analyze_id.py', 'us-east-1', bucketName, data.Key]);
      console.log('Image uploaded to S3 successfully');
      let output = '';
      python.stdout.on('data', (data) => {
        output += data.toString();
      });

      python.stderr.on('data', (data) => {
        console.error(`stderr: ${data}`);
      });

      python.on('close', async (code) => {
        console.log(`child process exited with code ${code}`);
        // Delete the local file
        fs.unlinkSync(path);

        // Parse the JSON output from the Python script
        const extractedData = JSON.parse(output);
        res.send({ extractedData });
        // Return the output to the client
        res.json(extractedData); // Send the JSON data to the client

        

      });
    }
  });
});

// Start the server
const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Server started on port ${port}`);
});