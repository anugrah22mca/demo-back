require('dotenv').config()
const express = require('express');
const mongoose = require('mongoose');
const multer = require('multer');
const AWS = require('aws-sdk');
const Upload = require('./models/upload');
const cors = require('cors');

const app = express();
const port = 3000;

mongoose.connect('mongodb+srv://22mp1941:FfDJ5oconjAniuPt@cluster0.g5nm7u3.mongodb.net/demo-app', { useNewUrlParser: true, useUnifiedTopology: true });

AWS.config.update({
  accessKeyId: 'AKIAR5DMD7NMRBLRBLHP',
  secretAccessKey: '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',
  region: 'ap-south-1',
});

const s3 = new AWS.S3();

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });
app.use(cors());
app.use(express.json());

app.get("/download/:filename", async (req, res) => {
  const filename = req.params.filename
  let x = await s3.getObject({ Bucket: "hackathonanugrah", Key: filename }).promise();
  console.log(x)
  res.json(x.Body)
})

app.get('/getfiles',async(req,res)=>{
  var bucketParams = {
    Bucket: 'hackathonanugrah',
  };
  s3.listObjects(bucketParams, function(err, data) {
    if (err) {
      console.log("Error", err);
    } else {
      console.log("Success", data);
    }
  });
})
app.post('/upload', upload.single('file'), async (req, res) => {
  const { originalname, buffer } = req.file;

  const params = {
    Bucket: 'hackathonanugrah',
    Key: originalname,
    Body: buffer,
  };

  try {
    await s3.upload(params).promise();

    const uploadData = {
      fileName: originalname,
      s3Url: `https://s3://hackathonanugrah/data/${originalname}`,
    };

    const uploadRecord = new Upload(uploadData);
    await uploadRecord.save();

    res.json(uploadData);
  } catch (error) {
    console.error(error);
    res.status(500).send('Internal Server Error');
  }
});

app.get('/files', async (req, res) => {
  try {
    const files = await Upload.find({}, 'fileName s3Url uploadDate');
    res.json(files);
  } catch (error) {
    console.error(error);
    res.status(500).send('Internal Server Error');
  }
});

app.get('/file/:fileName', async (req, res) => {
  const { fileName } = req.params;

  try {
    const fileData = await Upload.findOne({ fileName }, 'fileName s3Url uploadDate');
    if (fileData) {
      res.json(fileData);
    } else {
      res.status(404).send('File not found');
    }
  } catch (error) {
    console.error(error);
    res.status(500).send('Internal Server Error');
  }
});

app.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`);
});
