# aperta-accessum
An open-source toolkit for automating the upload of research articles into institutional repositories.
Read the paper here (coming soon).

## Quick Start
### Prerequisites
 - Basic understanding of UNIX commands.
 - Git, Node.js LTS, and a code editor (e.g., VSCode)  installed.
 - An understanding of API keys, folders,  

 ### Steps
 1. Clone this repository to your device.
 2. Add a file named `config.env.js` to the `aperta-accessum` folder.
 3. Retrieve bepress and dropbox API keys and add them to `config.env.js` in the following form:
```
module.exports = {
	BEPRESS:  "YOUR-BEPRESS-API-KEY",
	DROPBOX:  "YOUR-DROPBOX-API-KEY"
};
```
4. Navigate into the `aperta-accessum` directory and then run `cd scripts`, `npm i`.
5. Configure `sendEmail.js` using the file's comments to meet your needs (e.g., what data you want to scrape) and then run `node sendEmail.js` to run the file.