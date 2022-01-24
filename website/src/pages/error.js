import React from "react";
import { FiX } from "react-icons/fi";
import "../success.css";
import { Wrapper } from "./index";
import { Helmet } from "react-helmet";

/**@todo add email */
const Error = () => {
  return (
    <div>
      <Helmet>
        <body className="purple" />
      </Helmet>
      <Wrapper>
        <FiX size="20%" stroke="white" />
        <h1 style={{ color: "white" }}>
          <div>Whoops! An error occured :(</div>
          <div>
            Please click the link you recieved again and contact __email__ if it
            persists.
          </div>
        </h1>
      </Wrapper>
    </div>
  );
};

export default Error;
