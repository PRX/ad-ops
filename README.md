# Ad-Ops

Repository for Ad Operations

## Description

This is the general repository for Ad Operations code.  The code is run inside of google scripts.  It creates spreadsheets with Inventory tracking by querying BigQuery, Feeder, and program.production.json.  To run follow instructions on Sheet.  Any additionaly functionality should be described on the Sheets file.

## Dependencies

- [Feeder](https://feeder.prx.org) to store podcast episode metadata.
- [BigQuery](https://bigquery.cloud.google.com/) to get downloads data.
- [Chrome Google Scripts Extension](https://chrome.google.com/webstore/detail/google-apps-script-github/lfjcgcmkmjjlieihflfhjopckgpelofo) to connect to GitHub.

## Installation

Upon running for the first time you will need to allow it to use your credentials for BigQuery.  No secrets should ever be written in a .gs file.  
