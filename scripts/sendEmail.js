var axios = require("axios");
const jsdom = require("jsdom"); // `jsdom` is needed because Node.js does not have `DOMParser`
const { JSDOM } = jsdom;
const dom = new jsdom.JSDOM("");
global.DOMParser = dom.window.DOMParser;
const parser = new DOMParser();
var fs = require("fs");
const env = require("../config.env");
const { Url } = require("url");

// @todo could refactor .then
async function start(scrapeURL, institution, uploadBaseURL) {
  console.time();
  console.log("🏁 Starting script...");
  try {
    const people = await getEmailsAndNames(scrapeURL);
    var ORCIDIDsCount = 0,
      DOIsCount = 0;
    // people = [
    //   { email: "jack@test.com", fName: "jack", lName: "pepl" },
    //   { email: "jack@test.com", fName: "jack", lName: "pepl" },
    // ];
    // const people = [{ email: "test", fName: "Luiz", lName: "Capretz" }];
    if (people) {
      for (person of people) {
        console.log(
          `🔎 Searching ORCID for ID of: ${person?.lName.toUpperCase()}, ${person?.fName.toUpperCase()}...`
        );
        const ORCIDIDs = await getORCIDID(
          person.fName,
          person.lName,
          institution
        );

        // Can add ORCIDIDs below
        // ORCIDIDs.push("ENTER NUMBER")

        ORCIDIDsCount += ORCIDIDs?.length;
        if (ORCIDIDs && ORCIDIDs?.length != 0) {
          for (ORCIDID of ORCIDIDs) {
            console.log(ORCIDID);
            console.log(`🔎 Searching for DOIs of ORCHIDID: ${ORCIDID}...`);
            const DOIs = await getDOIs(ORCIDID);
            DOIsCount += DOIs?.length;
            if (DOIs && DOIs?.length != 0) {
              for (DOI of DOIs) {
                await forDOI(DOI);
              }
            }
          }
        } else {
          console.log(
            `❌ No ORCIDID found for ${person?.lName.toUpperCase()}, ${person?.fName.toUpperCase()}.`
          );
        }
      }
      writeOAJSON(alreadyOpenAccess);
      writeEmailCSV(emails);
      console.log("📈 Run Log");
      console.log(`${people.length} people`);
      console.log(`${ORCIDIDsCount} ORCIDIDs`);
      console.log(`${DOIsCount} DOIs`);
      console.log(`${alreadyOpenAccess.length} DOIs already open access.`);
      console.log(`${emails.length} DOIs ready for email.`);
    }
  } catch (error) {
    console.log(error?.message);
  } finally {
    console.timeEnd();
  }
}

const emails = [];
async function forDOI(DOI) {
  // @todo could see if there's a way to cancel other API calls when one returns false
  console.log(`🔎 Checking status of ${DOI} ...`);

  // FYI, using Promise.all versus checking for each status did not make a material difference
  const statuses = await Promise.all([
    getPermissionsStatus(DOI),
    getOpenAccessStatus(DOI),
    getDuplicateDOIStatus(DOI),
    getTitle(DOI),
  ]);
  if (!(statuses.includes(false) || statuses.includes(undefined))) {
    const title = statuses[3];
    const duplicateTitleStatus = await getDuplicateTitleStatus(title);
    if (duplicateTitleStatus) {
      const uploadLink = getUploadLink(uploadBaseURL, DOI, title);
      console.log("  📧 Added to email list.");
      emails.push({
        fName: person.fName,
        lName: person.lName,
        articleTitle: title,
        DOI: DOI,
        uploadLink: uploadLink,
        email: person.email,
      });
    } else {
      console.log("  🟧 Not eligible to archive.");
    }
  } else {
    console.log("  🟧 Not eligible to archive.");
  }
}

async function getEmailsAndNames(scrapeURL) {
  return new Promise(function (resolve, reject) {
    axios
      .get(scrapeURL)
      .then((response) => {
        const { document } = new JSDOM(response.data).window;
        // customize the selection here on `document` as needed
        const people = [];
        const infoLeft = document?.querySelectorAll(".infoleft");
        for (var i = 0; i < infoLeft?.length; i++) {
          const names = infoLeft[i]?.childNodes[0]?.textContent
            .split(",")[0]
            ?.split(" ");

          // only store the first and last names
          const name = [names[0], names[names.length - 1]];

          const email =
            document?.querySelectorAll(".inforight")[i]?.childNodes[4]?.text;
          const person = { fName: name[0], lName: name[1], email: email };
          people.push(person);
        }
        resolve(people);
      })
      .catch((error) => {
        console.log(error?.response?.data?.message || error?.message);
        resolve([]);
      });
  });
}

async function getORCIDID(fName, lName, institution) {
  var config = {
    method: "get",
    url: `https://pub.orcid.org/v3.0/search/?q=family-name:${lName}+AND+given-names:${fName}+AND+current-institution-affiliation-name:("Western University" OR "University of Western Ontario")`,
    headers: {},
  };

  return new Promise(function (resolve, reject) {
    axios(config)
      .then(function (response) {
        const parsedResponse = parser?.parseFromString(
          response?.data,
          "text/xml"
        );
        const pathTags = parsedResponse?.getElementsByTagName("common:path");

        const ORCIDIDs = [];
        for (const tag of pathTags) {
          const ORCIDID = tag?.childNodes[0]?.data;
          ORCIDIDs.push(ORCIDID);
        }
        resolve(ORCIDIDs);
      })
      .catch(function (error) {
        console.log(error?.response?.data?.message || error?.message);
        resolve([]);
      });
  });
}

async function getDOIs(ORCIDID) {
  var config = {
    method: "get",
    url: `https://pub.orcid.org/v3.0/${ORCIDID}/works`,
    headers: {},
  };

  return new Promise(function (resolve, reject) {
    axios(config)
      .then(function (response) {
        const parsedResponse = parser.parseFromString(
          response.data,
          "text/xml"
        );
        const externalIdValueTags = parsedResponse.getElementsByTagName(
          "common:external-id-value"
        );
        const DOIs = new Set(); // there are two tags with the same info, so a set is needed to only add new DOIs
        for (var tag of externalIdValueTags) {
          var DOI = tag?.childNodes[0]?.data;
          if (!DOIs.has(DOI)) {
            DOIs.add(DOI);
            console.log(DOI);
          }
        }
        resolve(Array.from(DOIs));
      })
      .catch(function (error) {
        console.log(error?.response?.data?.message || error?.message);
        resolve([]);
      });
  });
}

async function getDuplicateDOIStatus(DOI) {
  var config = {
    method: "get",
    url: `https://content-out.bepress.com/v2/ir.lib.uwo.ca/query?doi=${DOI}`,
    headers: {
      Authorization: env.BEPRESS,
    },
  };

  return new Promise(function (resolve, reject) {
    axios(config)
      .then(function (response) {
        if (response?.data?.query_meta?.total_hits == 0) {
          // there are no results with the DOI
          resolve(false);
        } else {
          // if there are result with the DOI, the article IS in the db
          resolve(true);
        }
      })
      .catch(function (error) {
        console.log(error?.response?.data?.message || error?.message);
        resolve(true);
      });
  });
}

function getDuplicateTitleStatus(title) {
  var title = title?.replace(/[^a-zA-Z ]/g, ""); // need to remove special characters for bepress... ugh
  var config = {
    method: "get",
    url: `https://content-out.bepress.com/v2/ir.lib.uwo.ca/query?title="${title}"`,
    headers: {
      Authorization: env.BEPRESS,
    },
  };

  return new Promise(function (resolve, reject) {
    axios(config)
      .then(async function (response) {
        if (response?.data?.query_meta?.total_hits == 0) {
          // if there is NO result with the title, the article is NOT in th db
          resolve(false);
        } else {
          resolve(true);
        }
      })
      .catch(function (error) {
        console.log(error?.response?.data?.message || error?.message);
        resolve(true);
      });
  });
}

// getPermissionsStatus("10.1109/MITP.2020.3031862")
function getPermissionsStatus(DOI) {
  var config = {
    method: "get",
    url: `https://api.openaccessbutton.org/permissions/${DOI}`,
    headers: {},
  };

  return new Promise(function (resolve, reject) {
    axios(config)
      .then(async function (response) {
        if (response?.data?.best_permission?.can_archive) {
          resolve(true);
        } else {
          resolve(false);
        }
      })
      .catch(function (error) {
        console.log(error?.response?.data?.message || error?.message);
        resolve(false);
      });
  });
}

const alreadyOpenAccess = [];
// @todo could refactor this to reduce scope
function getOpenAccessStatus(DOI) {
  const unpaywallEmail = "jpeplin2@uwo.ca"; // required for unpaywall @todo move to more obvious place?

  var config = {
    method: "get",
    url: `http://api.unpaywall.org/${DOI}?email=${unpaywallEmail}`,
    headers: {},
  };

  // @todo refactor here
  return new Promise(function (resolve, reject) {
    axios(config)
      .then(function (response) {
        const resp = response?.data;
        if (resp?.is_oa) {
          if (resp?.best_oa_location?.url_for_pdf) {
            const publication = {
              DOI: DOI,
              openAccessURL: resp?.best_oa_location?.url_for_pdf,
            };
            alreadyOpenAccess.push(publication);
          }
          resolve(false);
        } else {
          resolve(true);
        }
      })
      .catch(function (error) {
        console.log(error?.response?.data?.message || error?.message);
        resolve(false);
      });
  });
}

//Similar to get metadata
function getTitle(DOI) {
  var config = {
    method: "get",
    url: `https://api.crossref.org/works/${DOI}`,
    headers: {},
  };

  return new Promise(function (resolve, reject) {
    axios(config)
      .then(async function (response) {
        resolve(response?.data?.message?.title[0]);
      })
      .catch(function (error) {
        console.log(error?.response?.data?.message || error?.message);
        resolve(false);
      });
  });
}

function getUploadLink(uploadBaseURL, DOI, title) {
  return new URL(uploadBaseURL.concat(`?doi=${DOI}&title=${title}`))?.href;
}

function writeEmailCSV(emails) {
  const csv = [
    "fName,lName,articleTitle,DOI,uploadLink,email",
    // "Luiz,Capretz,test,123,www,test@.com",
    // "Jack,Pep,test1,345,http,test2@com",
  ];
  // const emails = [
  //   {
  //     fName: "fName",
  //     lName: "lName",
  //     articleTitle: "title",
  //     DOI: "123",
  //     uploadLink: "link",
  //     email: "email",
  //   },
  //   {
  //     fName: "fName",
  //     lName: "lName",
  //     articleTitle: "title",
  //     DOI: "123",
  //     uploadLink: "link",
  //     email: "email",
  //   },
  // ];
  for (email of emails) {
    csv.push(
      `${email.fName}, ${email.lName}, ${email.articleTitle}, ${email.DOI}, ${email.uploadLink}, ${email.email}`
    );
  }

  fs.writeFile("../output/toSend.csv", csv.join("\r\n"), (err) => {
    console.log(err || "📮 Email list CSV ready!");
  });
}

function writeOAJSON(alreadyOpenAccess) {
  const stringAlreadyOpenAccess = JSON.stringify(alreadyOpenAccess);
  fs.writeFile(
    "../output/alreadyOpenAccess.json",
    stringAlreadyOpenAccess,
    "utf-8",
    function (error, result) {
      if (error) {
        console.log(error?.message);
      } else {
        console.log("📝 Already open-access JSON ready!");
      }
    }
  );
}

const institution = ""; // using AND or OR complicates this so need to add directly
const scrapeURL = "https://www.eng.uwo.ca/electrical/people/faculty/index.html";
const uploadBaseURL = "https://aperta-accessum.netlify.app/";
start(scrapeURL, institution, uploadBaseURL);