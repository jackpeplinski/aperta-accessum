# aperta-accessum

An open-source toolkit for automating the upload of research articles into institutional repositories.
Read the paper [here](https://www.iastatedigitalpress.com/jlsc/article/id/14421/).

## Quick Start

### Prerequisites

- Basic understanding of UNIX commands.
- Git, Node.js LTS, and a code editor (e.g., VSCode) installed.
- An understanding of how APIs work.

### Setup

1.  Clone this repository to your device.
2.  Add an folder named `output` to the `aperta-accessum` folder.
3.  Add a file named `config.env.js` to the `aperta-accessum` folder.
4.  Retrieve bepress and Dropbox API keys and add them to `config.env.js` in the following form:

```
module.exports = {
	BEPRESS:  "YOUR-BEPRESS-API-KEY",
	DROPBOX:  "YOUR-DROPBOX-REFRESH-KEY",
};
```

Note: bepress keys need to be obtained by emailing them; Dropbox keys need to be obtained by [creating a Dropbox App](https://www.dropbox.com/developers/reference/getting-started#app%20console).

4. Navigate `aperta-accessum/scripts` directory and then run `npm i`.
5. Deploy the website. [Netlify can be used](https://www.netlify.com/blog/2016/09/29/a-step-by-step-guide-deploying-on-netlify/), among many hosting options. Run `npm build` in the `website` folder, and then upload the build folder to Netlify.

### Workflow

1. Complete setup instructions.
2. Create a CSV file of emails to send to professors and JSON file of articles that are already open access by navigating to `aperta-accessum/scripts` directory and running `node createEmailList.js`.
3. Use mail merge to send professors emails. Watch [this](https://www.youtube.com/watch?v=_Efb_oMgxEs&t=250s&ab_channel=KevinStratvert) YouTube video or a similar one.
4. Monitor your Dropbox for file uploads.
5. Create two XML files of data to upload to bepress by navigating to `aperta-accessum/scripts` directory and running `node createXMLForAlreadyOA.js` and then `node createXMLFromDropbox.js`.
6. Upload the XML files to bepress through bulk upload.
7. Once the files are published on bepress, delete the files from Dropbox.
