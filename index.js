const express = require('express');

const path = require("path");

const app = express();

const port = 3006;

const {
  mParser,
  mDownloader,
  mIndicator,
} = require("node-m3u8-to-mp4");

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
  });
  
  app.get('/stream', (req, res) => {
    // Set headers for Server-Sent Events
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('Access-Control-Allow-Origin', '*');

    res.writeHead(200, {
        Connection: 'keep-alive',
        'Content-Encoding': 'none',
        'Cache-Control': 'no-cache',
        'Content-Type': 'text/event-stream',
      });
  
    let data_loading = 0; // Initialize the data_loading variable
  
    // Function to update the progress
    function updateProgress(index, total) {
      const progress = ((index / total) * 100).toFixed(2) + "%";
      console.log("downloading:", progress, "index:", index, "total:", total);
      data_loading = ((index / total) * 100).toFixed(2);
  
      // Send the data_loading value as a SSE event to the client
      res.write(`data: ${data_loading}\n\n`);
    }
  
    // Function to send the final data_loading value after the download is complete
    function sendFinalDataLoading() {
      res.write(`data: ${data_loading}\n\n`);
      res.end();
    }
  
    // Force download m3u8 to ts file
    function force_download_m3u8(Link_, referer_) {
      // Set progress indicators
      mIndicator("downloading", updateProgress);
  
      // Parse the video resource list
      mParser(Link_, {
        referer: referer_,
      }).then((list) => {
        // Extract the URLs from the resource list
        const medias = list.map((item) => `${item.url}`);
        console.log("Extracted");
  
        // Download the media files
        mDownloader(medias, {
          targetPath: path.resolve(".target"),
          headers: {
            referer: referer_,
          },
        })
          .then(() => {
            console.log("load ts file success");
            sendFinalDataLoading(); // Send the final data_loading value to the client after the download is complete
          })
          .catch((e) => {
            console.log("Force Failed");
            res.status(500).send("Error occurred"); // Send an error response to the client if the download fails
          });
      });
    }
  
    // Call the function to start the download
    force_download_m3u8("https://live-par-2-abr.livepush.io/vod/bigbuckbunny/bigbuckbunny.840x480.mp4/tracks-v1a1/mono.m3u8", "https://livepush.io/");
  });
  
  

//download file
app.get('/download', (req, res) => {
    res.send("200")
});

app.listen(3009, () => {
    console.log('Server started on port 3009');
  });