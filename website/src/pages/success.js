import React from "react";
import { FiCheck } from "react-icons/fi";
import "../success.css";
import { Wrapper } from "./index";
import { Helmet } from "react-helmet";

const Success = () => {
  return (
    <div>
      <Helmet>
        <body className="purple" />
      </Helmet>
      <Wrapper>
        <FiCheck size="20%" stroke="white" />
        <h1 style={{ color: "white" }}>
          <div>Thank you!</div>
          <div>Your paper has been recevied. Please close this tab.</div>
        </h1>
      </Wrapper>
    </div>
  );
};

export default Success;
