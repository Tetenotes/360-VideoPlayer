const express = require('express');
const path = require('path');
const fs = require('fs'); // Import the 'fs' module for file operations
const app = express();

// Serve static files from the 'public' directory
app.use(express.static(path.join(__dirname, 'public')));

// Route to serve the index.html file
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Endpoint to stream the 360-degree video
app.get('/video', (req, res) => {
  const videoPath = path.join(__dirname, 'public', 'video.mp4');
  const stat = fs.statSync(videoPath);
  const fileSize = stat.size;
  const range = req.headers.range;

  if (range) {
    const parts = range.replace(/bytes=/, "").split("-");
    const start = parseInt(parts[0], 10);
    const end = parts[1] 
      ? parseInt(parts[1], 10)
      : fileSize-1;
    const chunksize = (end-start)+1;
    const file = fs.createReadStream(videoPath, {start, end});
    const head = {
      'Content-Range': `bytes ${start}-${end}/${fileSize}`,
      'Accept-Ranges': 'bytes',
      'Content-Length': chunksize,
      'Content-Type': 'video/mp4',
    };

    res.writeHead(206, head);
    file.pipe(res);
  } else {
    const head = {
      'Content-Length': fileSize,
      'Content-Type': 'video/mp4',
    };
    res.writeHead(200, head);
    fs.createReadStream(videoPath).pipe(res);
  }
});

// Endpoint to fetch list of video files
app.get('/video-list', (req, res) => {
  const directoryPath = path.join(__dirname, 'public');
  fs.readdir(directoryPath, (err, files) => {
    if (err) {
      console.log('Error getting directory information:', err);
      res.status(500).send('Error getting directory information');
    } else {
      const videoFiles = files.filter(file => file.endsWith('.mp4'));
      res.json(videoFiles);
    }
  });
});

// Start server
const port = 3000;
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
