const ApiBuilder = require('claudia-api-builder');
const request = require('request-promise');

const googleApiKey = process.env.GOOGLE_API_KEY;
const sheetId = '174f0WBSVNSdcQ5_S6rWPGB3pNCsruyyM_ZRQ6QUhGmo';
const dataUrl = 'https://sheets.googleapis.com/v4/spreadsheets/' + sheetId + '/values/';

let api = new ApiBuilder();

module.exports = api;

function getData(url) {
  return request({
    url: `${dataUrl}${url}`,
    qs: {
      key: googleApiKey,
      valueRenderOption: 'FORMULA'
    },
    json: true
  });
}

api.get('/cta', function() {
  return getData('Weekly%20Call%20to%20Action').then(({ values }) => {
    let current = [];
    let previous = [];
    let active = current;
    values.slice(1).forEach(([ cta, script, notes ]) => {
      if (cta.indexOf('PREVIOUS CALLS') !== -1) {
        active = previous;
        return;
      }

      active.push({ cta, script, notes });
    });

    return { current, previous };
  }).catch((err) => {
    return { error: `Failed to get data: ${err}` };
  });
});
