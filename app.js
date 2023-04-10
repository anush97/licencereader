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
app.post('/upload', upload.single('image'), async (req, res) => {
  const { path } = req.file;
  const s3 = new AWS.S3();
  const bucketName = 'readdl';

  const fileContent = fs.readFileSync(path);
  const params = {
    Bucket: bucketName,
    Key: req.file.originalname,
    Body: fileContent,
    ContentType: req.file.mimetype,
  };

  try {
    const data = await s3.upload(params).promise();
    console.log('Image uploaded to S3 successfully');

    const python = spawn('python', ['analyze_id.py', 'us-east-1', bucketName, data.Key]);

    let output = '';
    python.stdout.on('data', (data) => {
      output += data.toString();
    });

    python.stderr.on('data', (data) => {
      console.error(`stderr: ${data}`);
    });

    python.on('close', (code) => {
      console.log(`child process exited with code ${code}`);
      fs.unlinkSync(path);

      const extractedData = JSON.parse(output);

      res.send({ extractedData });
    });
  } catch (err) {
    console.error('Error:', err);
    res.status(500).send(err);
  }
});


// Start the server
const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Server started on port ${port}`);
});
