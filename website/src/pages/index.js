import React, { useState } from "react";
import styled from "@emotion/styled";
import Dropzone from "../components/Dropzone";
import { createTheme, ThemeProvider } from "@mui/material/styles";

const theme = createTheme({
  palette: {
    primary: {
      main: "#401A76",
    },
  },
});

const IndexPage = ({ location }) => {
  const params = new URLSearchParams(location.search);
  const DOI = params.get("doi");
  const articleTitle = params.get("title");

  const Confirmation = () => {
    return (
      <h1>
        <div
          style={{
            fontWeight: "normal",
            fontStyle: "oblique",
            marginBottom: "10px",
          }}
        >
          {articleTitle}
        </div>
        <div>{DOI}</div>
      </h1>
    );
  };

  return (
    <ThemeProvider theme={theme}>
      <Wrapper>
        <h2 style={{ fontWeight: "normal" }}>
          Confirm the title and DOI of the article you are uploading is:
        </h2>
        <Confirmation />
        <h3>Please upload a PDF of your article and select the closest category.</h3>
        <Dropzone DOI={DOI} articleTitle={articleTitle} />
      </Wrapper>
    </ThemeProvider>
  );
};

export default IndexPage;

export const Wrapper = styled("div")`
  position: absolute;
  left: 50%;
  top: 50%;
  -webkit-transform: translate(-50%, -50%);
  transform: translate(-50%, -50%);
  font-family: helvetica;
  text-align: center;
`;
