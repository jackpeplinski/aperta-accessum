# aperta-accessum

An open-source toolkit for automating the upload of research articles into institutional repositories.
Read the paper [here](https://www.iastatedigitalpress.com/jlsc/article/id/14421/).

## Quick Start

### Prerequisites

- Basic understanding of UNIX commands.
- Git, Node.js LTS, and a code editor (e.g., VSCode) installed.
- An understanding of how APIs work.

### Steps

1.  Clone this repository to your device.
2.  Add a file named `config.env.js` to the `aperta-accessum` folder.
3.  Retrieve bepress and Dropbox API keys and add them to `config.env.js` in the following form:

```
module.exports = {
	BEPRESS:  "YOUR-BEPRESS-API-KEY",
	DROPBOX:  "YOUR-DROPBOX-REFRESH-KEY"
};
```

_Note: bepress keys need to be obtained by emailing them; Dropbox keys need to be obtained by [creating a Dropbox App](https://www.dropbox.com/developers/reference/getting-started#app%20console)._

4. Navigate into the `aperta-accessum` directory and then run `cd scripts`, `npm i`.
5. Configure `sendEmail.js` using the file's comments to meet your needs (e.g., what data you want to scrape) and then run `node sendEmail.js` to run the file.
6. Deploy the website. [Netlify can be used](https://www.netlify.com/blog/2016/09/29/a-step-by-step-guide-deploying-on-netlify/), among many hosting options. Run `npm build` in the `website` folder, and then upload the build folder to Netlify.
