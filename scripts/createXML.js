var axios = require("axios");
const XMLWriter = require("xml-writer");
var fs = require("fs");
const env = require("../config.env");

function getFileNames() {
  var data = JSON.stringify({
    path: "",
    recursive: false,
    include_media_info: false,
    include_deleted: false,
    include_has_explicit_shared_members: false,
    include_mounted_folders: false,
    include_non_downloadable_files: true,
  });

  var config = {
    method: "post",
    url: "https://api.dropboxapi.com/2/files/list_folder",
    headers: {
      Authorization: `Bearer ${env.DROPBOX}`,
      "Content-Type": "application/json",
    },
    data: data,
  };

  console.log(`🔎 Getting file names from Dropbox...`);
  axios(config)
    .then(function (response) {
      if (response.data.entries) {
        var entries = response.data.entries;
        var names = [];

        for (var i = 0; i < entries.length; i++) {
          var name = entries[i].name;
          console.log(name);
          names.push(name);
        }

        createXML(names);
      } else {
        console.log(response.data.entries);
      }
    })
    .catch(function (error) {
      console.log(error);
    });
}

function changeNameToDOI(name) {
  var DOI = name.replace(/:/g, "/").slice(0, -4);

  return DOI;
}

async function createXML(names) {
  // https://stackoverflow.com/questions/11488014/asynchronous-process-inside-a-javascript-for-loop

  xw = new XMLWriter();

  xw.startDocument("1.0", "UTF-8");
  xw.startElement("documents");

  for (let i = 0; i < names.length; i++) {
    // I think `i` NEEDS to defined with `let` because the function is async
    var fullTextURL = await getFullTextURL(names[i]);

    var DOI = changeNameToDOI(names[i]);
    var metadata = await getMetadata(DOI);

    xw.startElement("document");

    xw.writeElement("title", metadata.title[0]);

    const dateParts = metadata.created["date-parts"][0];
    for (var j = 1; j < dateParts.length; j++) {
      if (dateParts[j].toString().length == 1) {
        dateParts[j] = "0" + dateParts[j];
      }
    }

    xw.writeElement(
      "publication-date",
      dateParts[0] + "-" + dateParts[1] + "-" + dateParts[2]
    );

    xw.writeElement("fulltext-url", fullTextURL);
    xw.writeElement("document-type", "article")
    xw.writeElement("embargo", "FALSE");

    xw.startElement("authors");
    const authorsArr = metadata.author;
    for (var j = 0; j < authorsArr.length; j++) {
      xw.startElement("author");
      xw.writeElement("lname", authorsArr[j].family);
      xw.writeElement("fname", authorsArr[j].given);
      xw.endElement();
    }
    xw.endElement();

    const fields = [
      { name: "doi", value: DOI },
      { name: "volnum", value: metadata?.volume },
      {
        name: "source_publication",
        value: metadata?.["container-title"].toString(),
      },
      { name: "keywords", value: metadata?.subject.toString() },
    ];
    xw.startElement("fields");
    for (field of fields) {
      xw.startElement("field");

      xw.writeAttribute("type", "string");
      xw.writeAttribute("name", field.name);

      xw.writeElement("value", field.value);

      xw.endElement();
    }
    
    xw.endElement();

    xw.endElement();
  }

  xw.endElement();
  xw.endDocument();

  fs.writeFileSync("../output/upload.xml", xw.output, function (err) {
    if (err) throw err;
    console.log("Saved!");
  });
}

function getMetadata(DOI) {
  var config = {
    method: "get",
    url: `https://api.crossref.org/works/${DOI}`,
    headers: {},
  };

  return new Promise(function (resolve, reject) {
    axios(config)
      .then(function (response) {
        resolve(response.data.message);
      })
      .catch(function (error) {
        console.log(error);
        resolve(error);
      });
  });
}

function getFullTextURL(name) {
  var data = JSON.stringify({
    path: `/${name}`,
  });

  var config = {
    method: "post",
    url: "https://api.dropboxapi.com/2/files/get_temporary_link",
    headers: {
      Authorization: `Bearer ${env.DROPBOX}`,
      "Content-Type": "application/json",
    },
    data: data,
  };

  return new Promise(function (resolve, reject) {
    axios(config)
      .then(function (response) {
        resolve(response.data.link);
      })
      .catch(function (error) {
        console.log(error);
        resolve(error);
      });
  });
}

getFileNames();
