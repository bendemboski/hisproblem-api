const ApiBuilder = require('claudia-api-builder');
const request = require('request-promise');
const normalizePhoneNumber = require('./normalize-phone-number');

const googleApiKey = process.env.GOOGLE_API_KEY;
const sheetId = '174f0WBSVNSdcQ5_S6rWPGB3pNCsruyyM_ZRQ6QUhGmo';
const dataUrl = 'https://sheets.googleapis.com/v4/spreadsheets/' + sheetId + '/values/';

let api = new ApiBuilder();

module.exports = api;

function getSheet(sheetName) {
  return request({
    url: `${dataUrl}${sheetName}/`,
    qs: { key: googleApiKey },
    json: true
  });
}

api.get('/cta', function() {
  return getSheet('Weekly Call to Action').then(({ values }) => {
    let current = [];
    let previous = [];
    let active = current;
    // Skip header
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

api.get('/leadership', function() {
  return getSheet('Contact Info Party Leadership ').then(({ values }) => {
    // Skip header
    return values.slice(1).map(([ title, party, name, districtNum, dcNum ]) => {
      return {
        title,
        party,
        name,
        districtNum: normalizePhoneNumber(districtNum),
        dcNum: normalizePhoneNumber(dcNum)
      };
    });
  }).catch((err) => {
    return { error: `Failed to get data: ${err}` };
  });
});

api.get('/senators', function() {
  return getSheet('Contact Your Senator (Incumbents)').then(({ values }) => {
    // There's a note at the top of the sheet that might get deleted sometime,
    // so we need to be a little smarter about how many rows to skip
    let headerIndex = values.find(([ state ]) => state === 'state');
    values = values.slice(headerIndex);
    return values.map((row) => {
      let [
        state,
        ,
        lastName,
        firstName,
        party,
        districtAddressLine1,
        districtAddressLine2,
        districtAddressLine3,
        districtPhone,
        dcAddress,
        dcPhone,
        email,
        website,
      ] = row;

      return {
        state,
        lastName,
        firstName,
        party,
        districtAddressLine1,
        districtAddressLine2,
        districtAddressLine3,
        districtPhone: normalizePhoneNumber(districtPhone),
        dcAddress,
        dcPhone: normalizePhoneNumber(dcPhone),
        email,
        website
      };
    });
  }).catch((err) => {
    return { error: `Failed to get data: ${err}` };
  });
});

api.get('/reps', function() {
  return getSheet('Contact Your Rep (Incumbents)').then(({ values }) => {
    // There's a note at the top of the sheet that might get deleted sometime,
    // so we need to be a little smarter about how many rows to skip
    let headerIndex = values.find(([ , prefix ]) => prefix === 'Prefix');
    values = values.slice(headerIndex);
    return values.map((row) => {
      let [
        ,
        firstName,
        middleName,
        lastName,
        suffix,
        website,
        districtAddressLine1,
        districtAddressLine2,
        districtAddressLine3,
        districtPhone,
        dcAddress,
        party
      ] = row;

      return {
        firstName,
        middleName,
        lastName,
        suffix,
        website,
        districtAddressLine1,
        districtAddressLine2,
        districtAddressLine3,
        districtPhone: normalizePhoneNumber(districtPhone),
        dcAddress,
        party
      };
    });
  }).catch((err) => {
    return { error: `Failed to get data: ${err}` };
  });
});
