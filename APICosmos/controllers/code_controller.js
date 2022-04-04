// const { FileSaver } = require("file-saver");
const Blob = require("buffer");
// const { DOMParser } = require("xmldom");
(fs = require("fs")), (path = require("path")), (util = require("util"));
// const axios = require("axios").default;
// const FormData = require("form-data"); // npm install --save form-data
const dotenv = require("dotenv");
// const intoStream = require("into-stream");
// const path = require("path");
const express = require("express");
// const fileUpload = require("express-fileupload");
const azure = require("@azure/storage-blob");

const { BlobServiceClient } = require("@azure/storage-blob");

// const res = require("express/lib/response");
const Code = require("../models/code_schema");
// const User = require("../models/user_schema");
const Prediction = require("../models/prediction_schema");
// const { append } = require("express/lib/response");
const blobName = "codeforContainer4";
const blobSasUrl =
  "https://sketch2codestoresc.blob.core.windows.net/?sv=2020-08-04&ss=bfqt&srt=sco&sp=rwdlacupitfx&se=2022-04-15T16:16:40Z&st=2022-03-31T08:16:40Z&spr=https&sig=UQvWQe5%2BbCMWl4vf5%2FJl5aOWH96O0lri0lwNBD7CkIs%3D";
const blobServiceClient = new BlobServiceClient(blobSasUrl);
// const containerName = "yurt";
let fileSaved = false;
let containerName = "";
let downloadedFile;
const instance = new express();

const checkTagName = (prediction, code) => {
  let value;
  // console.log(prediction);
  code.forEach((element, index) => {
    if (element.tagName === prediction.tagName) {
      value = element;
    }
  });
  return value;
};

const uploadFiles = async (html) => {
  const containerClient = blobServiceClient.getContainerClient(containerName);

  let content = html;
  try {
    console.log("Uploading files...");
    const promises = [];
    // blobName = "upload.html"
    if (content) {
      const blobOptions = {
        blobHTTPHeaders: { blobContentType: "text/html" },
      };

      const blockBlobClient = containerClient.getBlockBlobClient(blobName);
      const uploadBlobResponse = await blockBlobClient.upload(
        content,
        content.length,
        blobOptions
      );
      console.log(
        `Upload block blob ${blobName} successfully`,
        uploadBlobResponse.requestId
      );
    }
    await Promise.all(promises);
    console.log("Done.");
    // downloadCodeFromAzure();

    // listFiles();
  } catch (error) {
    console.log(error.message);
  }
};

const generateFile = async (prediction, code) => {
  let html = "";
  prediction.map((prediction, i) => {
    if (prediction.boundingBox.range === "nextRow") {
      html += `
       <div className="break flex"></div>
       <div
       key={'spacing-${i}'}
       className={'element ${prediction.boundingBox.pushLeft}  flex flexWidth'}
     >
     </div>
     <div
       key="object-${i}"
       className='${prediction.boundingBox.width} flex flexWidth'
     >
       
     ${checkTagName(prediction, code).code}
     </div>
       `;
    } else if (prediction.boundingBox.range === "firstElement") {
      html += `
          <div
            key={'first-${i}'}
            className={'${prediction.boundingBox.pushLeft}  flex flexWidth'}
          >
          </div>
          <div
            key={'same-${i}'} 
            className={'flex  ${prediction.boundingBox.width}'}
          >
            ${checkTagName(prediction, code).code}
          </div>
      `;
    } else {
      html += `
          <div
            key={'same-${i}'}
            className={'flex  ${prediction.boundingBox.width}'}
          >
            ${checkTagName(prediction).code}
          </div>
          `;
    }
  });

  // uploadFiles(html);
};

// save file in container as componentName.js
const createContainer = async (containerClient) => {
  try {
    console.log(`Creating container "${containerName}"...`);
    await containerClient.createIfNotExists();
    // reportStatus(`Done.`);
    console.log("Created container");
  } catch (error) {
    console.log(error.message);
  }
};

const downloadCode = async (req, res) => {
  let framework = req.params.framework;
  let code;
  let prediction;
  let file;
  containerName = req.params.container;

  const containerClient = blobServiceClient.getContainerClient(containerName);

  createContainer(containerClient);

  // step 1, mongoose get prediction by component id
  // step 2, get the code by framework

  let id = req.params.id;

  Prediction.findOne({ id })
    .then((data) => {
      if (data) {
        prediction = data.predictions;
        // console.log(prediction)
      } else {
        res.status(404).json("No Code not found");
      }
    })
    .then(() => {
      Code.find({ framework })
        .then((data) => {
          if (data) {
            code = data;
          } else {
            res.status(404).json("No Code not found");
          }
        })
        .then(async () => {
          file = await generateFile(prediction, code);
          await uploadFiles();

          await downloadCodeFromAzure();
          // if (fileSaved = true){
          //   // res.download(downloadedFile);
          // }
          let options = {
            root: path.join("./"),
          };

          console.log(path.join("./"));
          console.log(__basedir);

          let fileName = blobName + ".html";
          res.download(path.join("./") + fileName, fileName, (err) => {
            if (err) {
              console.log(err);
            } else {
              console.log("Sent:", fileName);
            }
          });
        })

        .catch((err) => {
          console.error(err);
          res.status(500).json(err);
        });
    })
    .catch((err) => {
      console.error(err);
      res.status(500).json(err);
    });

  // sends the componentName.js to the user
};

async function downloadCodeFromAzure() {
  const containerClient = blobServiceClient.getContainerClient(containerName);
  const blobClient = containerClient.getBlobClient(blobName);

  // Get blob content from position 0 to the end
  // In Node.js, get downloaded data by accessing downloadBlockBlobResponse.readableStreamBody
  const downloadBlockBlobResponse = await blobClient.download();
  const downloaded = (
    await streamToBuffer(downloadBlockBlobResponse.readableStreamBody)
  ).toString();
  console.log("Downloaded blob content");

  // console.log("Downloaded blob content:", downloaded);

  fs.writeFile(`${blobName}.html`, downloaded, function (err) {
    if (err) {
      return console.error(err);
    }
    console.log("File saved successfully!");
    fileSaved = true;
    downloadedFile = downloaded;

    // return downloadedFile;
  });

  // [Node.js only] A helper method used to read a Node.js readable stream into a Buffer
  async function streamToBuffer(readableStream) {
    return new Promise((resolve, reject) => {
      const chunks = [];
      readableStream.on("data", (data) => {
        chunks.push(data instanceof Buffer ? data : Buffer.from(data));
      });
      readableStream.on("end", () => {
        resolve(Buffer.concat(chunks));
      });
      readableStream.on("error", reject);
    });
  }
}

const getSingleCode = (req, res) => {
  let framework = req.params.framework;
  // Code.find({framework: req.params.framework})
  Code.find({ framework })
    // .populate("components")
    .then((data) => {
      if (data) {
        res.status(200).json(data);
      } else {
        res.status(404).json("No Code not found");
      }
    })
    .catch((err) => {
      console.error(err);
      res.status(500).json(err);
    });
};

const addCode = (req, res) => {
  let CodeData = req.body;
  Code.create(CodeData)
    .then((data) => {
      //   if (data) {
      //     User.findByIdAndUpdate(
      //       {
      //         _id: data.user_id,
      //       },
      //       {
      //         $push: { Code: data._id },
      //       },
      //       (error, success) => {
      //         if (error) {
      //           res.status(500).json(err);
      //         }
      //       }
      //     );
      res.status(201).json(data);
      //   }
    })
    .catch((err) => {
      if (err.name === "ValidationError") {
        res.status(422).json(err);
      } else {
        console.error(err);
        res.status(500).json(err);
      }
    });
};

const editCode = (req, res) => {
  let CodeData = req.body;
  Code.findByIdAndUpdate(req.params.id, CodeData, {
    new: true,
  })
    .then((data) => {
      if (data) {
        res.status(201).json(data);
      }
    })
    .catch((err) => {
      if (err.name === "Validation Error") {
        res.status(422).json(err);
      } else {
        console.error(err);
        res.status(500).json(err);
      }
    });
};

const deleteCode = (req, res) => {
  let CodeData = req.body;
  Code.findByIdAndDelete(req.params.id, {
    new: true,
  })
    .then((data) => {
      if (data) {
        res.status(201).json("Code deleted");
      } else {
        res
          .status(404)
          .json(
            `Code with id: ${req.params.id} not found & does not exist or must already be deleted`
          );
      }
    })
    .catch((err) => {
      if (err.name === "Validation Error") {
        res.status(422).json(err);
      } else {
        console.error(err);
        res.status(500).json(err);
      }
    });
};
module.exports = {
  //   getAllCode,
  generateFile,

  downloadCode,
  getSingleCode,
  addCode,
  editCode,
  deleteCode,
};
