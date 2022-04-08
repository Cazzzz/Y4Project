import { Container, Grid, Button, TextField } from "@mui/material";
import * as React from "react";
import { MultiStepForm, Step } from "react-multi-form";
import { useState, useEffect } from "react";
import axios from "axios";

export default function CreateProject() {
  let UserID = localStorage.getItem("user_id");

  const [active, setActive] = React.useState(1);
  const [form, setForm] = useState({});

  const handleForm = (e) => {
    setForm((prevState) => ({
      ...prevState,
      [e.target.name]: e.target.value,
    }));
  };

  const submitForm = () => {
    console.log(form);

    // setSubmitFile((current) => true);
    // downloadCodeFromAzure()
    axios
      .post("http://localhost:3030/projects", {
        project_name: form.project_name,
        user_id: UserID,
        description: form.description,
        components: []
      })
      .then((response) => {
        console.log(response.data);
      })
      .catch((err) => console.log(err));
    // setActive(active + 1);
  };


  return (
    <Container>
      <MultiStepForm activeStep={active}>
        <Step label="Create Project">
        <div>
            <p className="purple-text-login">Create your project</p>
            <p className="primary-text-login">
              Fill in the details below. This can be changed later!
            </p>
          </div>
          <TextField
            className="col-8"
            onChange={handleForm}
            margin="normal"
            required
            fullWidth
            id="project_name"
            label="Name Your Project"
            name="project_name"
            autoComplete="project_name"
            autoFocus
          />
          <TextField
            className="col-8"
            onChange={handleForm}
            margin="normal"
            required
            fullWidth
            id="description"
            label="Describe Your Project"
            name="description"
            autoComplete="description"
            autoFocus
            sx={{mb:4}}
          />
        </Step>
        <Step label="Confirm"><Button onClick={submitForm}>Submit</Button></Step>
      </MultiStepForm>

      {active !== 1 && (
        <Button onClick={() => setActive(active - 1)}>Previous</Button>
      )}
      {active !== 5 && (
        <Button
          onClick={() => setActive(active + 1)}
          style={{ float: "right" }}
        >
          Next
        </Button>
      )}
    </Container>
  );
}
