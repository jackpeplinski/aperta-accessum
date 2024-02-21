var axios = require("axios");
const XMLWriter = require("xml-writer");
var fs = require("fs");
const env = require("../config.env");

function getFileNames() {
  console.log(`🔎 Getting file names from generated alreadyOpenAccess.json...`);
  fs.readFile("../output/alreadyOpenAccess.json", "utf8", (err, data) => {
    if (err) {
      console.error(`Error reading file from disk: ${err}`);
    } else {
      const entries = JSON.parse(data);
      createXML(entries);
    }
  });
}

async function createXML(entries) {
  // https://stackoverflow.com/questions/11488014/asynchronous-process-inside-a-javascript-for-loop

  xw = new XMLWriter();

  xw.startDocument("1.0", "UTF-8");
  xw.startElement("documents");

  for (let i = 0; i < entries.length; i++) {
    // I think `i` NEEDS to defined with `let` because the function is async
    const entry = entries[i];
    console.log(entry.DOI);
    var fullTextURL = entry.openAccessURL;
    var metadata = await getMetadata(entry.DOI);

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
    xw.writeElement("document-type", "article");
    xw.writeElement("embargo", "FALSE");
    xw.writeElement("create_openurl", "TRUE");
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
      { name: "doi", value: entry.DOI },
      { name: "volnum", value: metadata?.volume || "" },
      {
        name: "source_publication",
        value: metadata?.["container-title"].toString(),
      },
      { name: "keywords", value: (metadata?.subject || "").toString() },
      { name: "create_openurl", value: "TRUE", type: "boolean" },
      { name: "embargo_date", value: "FALSE", type: "date" },
    ];
    xw.startElement("fields");
    for (field of fields) {
      xw.startElement("field");

      xw.writeAttribute("type", field.type ? field.type : "string");
      xw.writeAttribute("name", field.name);

      xw.writeElement("value", field?.value);

      xw.endElement();
    }

    xw.endElement();

    xw.endElement();
  }

  xw.endElement();
  xw.endDocument();

  fs.writeFileSync("../output/upload2.xml", xw.output, function (err) {
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

getFileNames();
