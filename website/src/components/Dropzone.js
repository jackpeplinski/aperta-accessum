import { navigate } from "gatsby";
import React, { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import styled from "styled-components";
import { FiUpload } from "react-icons/fi";
import { Button } from "@mui/material";
const env = require("../../../config.env");
var Dropbox = require("dropbox");

const Dropzone = (props) => {
  const [file, setFile] = useState({});

  const onDrop = useCallback((acceptedFiles) => {
    setFile(acceptedFiles[0]);
  }, []);

  /**
   * @todo add is drag active
   */
  const { acceptedFiles, getRootProps, getInputProps } = useDropzone({
    accept: "application/pdf",
    onDrop,
  });

  function changeDOIToName(DOI) {
    if (DOI) {
      var name = DOI.replace(/\//g, ":");
      return name;
    }
  }

  const path = "/" + changeDOIToName(props.DOI) + ".pdf";

  function handleSubmit(e) {
    e.preventDefault();

    alert(
      "You're submission is being processed! After closing this alert, please do not refresh or click submit again—wait for a new page to load."
    );

    // from https://github.com/dropbox/dropbox-sdk-js/blob/main/examples/javascript/upload/index.html
    var dbx = new Dropbox.Dropbox({
      accessToken: env.DROPBOX,
    });

    const UPLOAD_FILE_SIZE_LIMIT = 150 * 1024 * 1024;
    if (file.size < UPLOAD_FILE_SIZE_LIMIT) {
      // File is smaller than 150 Mb - use filesUpload API
      dbx
        .filesUpload({ path: path, autorename: true, contents: file }) // path is where Dropbox will put and name the file
        .then(function (response) {
          navigate("/success");
        })
        .catch(function (error) {
          console.error(error);
          navigate("/error");
        });
    } else {
      // File is bigger than 150 Mb - use filesUploadSession* API
      const maxBlob = 8 * 1000 * 1000; // 8Mb - Dropbox JavaScript API suggested max file / chunk size

      var workItems = [];

      var offset = 0;

      while (offset < file.size) {
        var chunkSize = Math.min(maxBlob, file.size - offset);
        workItems.push(file.slice(offset, offset + chunkSize));
        offset += chunkSize;
      }

      const task = workItems.reduce((acc, blob, idx, items) => {
        if (idx == 0) {
          // Starting multipart upload of file
          return acc.then(function () {
            return dbx
              .filesUploadSessionStart({ close: false, contents: blob })
              .then((response) => response.session_id);
          });
        } else if (idx < items.length - 1) {
          // Append part to the upload session
          return acc.then(function (sessionId) {
            var cursor = { session_id: sessionId, offset: idx * maxBlob };
            return dbx
              .filesUploadSessionAppendV2({
                cursor: cursor,
                close: false,
                contents: blob,
              })
              .then(() => sessionId);
          });
        } else {
          // Last chunk of data, close session
          return acc.then(function (sessionId) {
            var cursor = {
              session_id: sessionId,
              offset: file.size - blob.size,
            };
            var commit = {
              path: path,
              mode: "add",
              autorename: true,
              mute: false,
            };
            return dbx.filesUploadSessionFinish({
              cursor: cursor,
              commit: commit,
              contents: blob,
            });
          });
        }
      }, Promise.resolve());

      task
        .then(function (result) {
          navigate("/success");
        })
        .catch(function (error) {
          console.error(error);
        });
    }
    return false;
  }

  const fileConfirmation = acceptedFiles.map((file) => (
    <div>
      <p>
        You have uploaded <FileName>{file.path}</FileName>.
      </p>
      <p>
        If this is the correct file, submit; if not, upload the correct file
        using the above upload area.
      </p>
    </div>
  ));

  return (
    <form onSubmit={handleSubmit}>
      <div {...getRootProps()}>
        <input {...getInputProps()} />
        <UploadArea>
          <FiUpload size="20%" stroke="white" />
          <p>
            <strong>Drag 'n' drop</strong> or{" "}
            <strong>click to browse files</strong>
          </p>
        </UploadArea>
      </div>
      {acceptedFiles ? fileConfirmation : null}
      <Button type="submit" variant="contained">
        Submit
      </Button>
    </form>
  );
};

export default Dropzone;

const UploadArea = styled.section`
  background-color: rgba(64, 26, 118, 0.51);
  border-radius: 4px;
  color: #401a76;
  padding: 40px;
  margin-bottom: 10px;
  cursor: pointer;
`;

const FileName = styled.div`
  font-family: monospace;
  border: 1px solid #bcbec0;
  border-radius: 4px;
  font-weight: bold;
  display: inline;
  padding: 4px;
  line-height: 2;
`;
