const express = require("express");
const cors = require("cors");
const jwt = require("jsonwebtoken");

require("dotenv").config();
require("./db")();

const port = process.env.PORT || "3030";

// importing the controllers
const {
  getSingleCode,
  addCode,
  editCode,
  deleteCode,
  downloadCode,
  generateFile
} = require("./controllers/code_controller");

const {
  addPrediction,
 
} = require("./controllers/prediction_controller");

const {
  getAllProjects,
  getSingleProject,
  addProject,
  editProject,
  deleteProject,
} = require("./controllers/project_controller");


const {
  register,
  login,
  loginRequired,
} = require("./controllers/user_controller");
const {
  getAllComponents,
  getSingleComponent,
  addComponent,
  editComponent,
  deleteComponent,
} = require("./controllers/component_controller");
const {
  getSingleUser,
  getAllUsers,
  editUser,
} = require("./controllers/user_controller");

const {
  predict
} = require("./controllers/prediction_controller");

const {
  getCode
} = require("./controllers/project_controller");

const app = express();
app.use(cors());
app.use(express.json());

// acquiring json token from headers for authentication
app.use((req, res, next) => {
  if (
    req.headers &&
    req.headers.authorization &&
    req.headers.authorization.split(" ")[0] === "Bearer"
  ) {
    jwt.verify(
      req.headers.authorization.split(" ")[1],
      "azure_jwt_api",
      (err, decode) => {
        if (err) req.user = undefined;
        req.user = decode;
        next();
      }
    );
  } else {
    req.user = undefined;
    next();
  }
});

// users
app.post("/register", register);
app.post("/login", login);
// app.post('/editUser', editUser)

// projects
app.get("/projects", loginRequired, getAllProjects);
app.get("/projects/:id", loginRequired, getSingleProject);
app.post("/projects", addProject);
app.put("/projects/:id", editProject);
app.delete("/projects/:id", deleteProject);


// components
app.get("/components", getAllComponents);
app.get("/components/:id", getSingleComponent);
app.post("/components", addComponent);
app.put("/components/:id", editComponent);
app.delete("/components/:id", deleteComponent);

// code gen
app.get("/code/:id/frameworks/:framework/projects/:container/user/:user/sketch/:blobName", downloadCode);

//prediction
app.get("/predict/:blobName/container/:containerName/user/:user", predict)
// app.get("/download/:blobName/container/:containerName", generateFile)

// users
app.get("/users/", getAllUsers);
app.get("/users/:id", getSingleUser);

// DEV

app.get("/code/:framework", getSingleCode);
// app.get("/projects/:id", loginRequired, getSingleProject);
app.post("/code", addCode);
// app.put("/code/:id", editCode);
app.delete("/code/:id", deleteCode);





app.listen(port, () => {
  console.log(`Listening on port${port}`);
});
