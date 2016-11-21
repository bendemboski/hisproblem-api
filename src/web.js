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

api.get('/calls', function() {
  return getSheet('Weekly Call to Action').then(({ values }) => {
    let calls = [];
    let isCurrent = true;
    // Skip header
    values.slice(1).forEach(([ title, content, notes ]) => {
      if (title.indexOf('PREVIOUS CALLS') !== -1) {
        isCurrent = false;
        return;
      }

      calls.push({ title, content, notes, isCurrent });
    });

    return {
      data: calls.map((attributes, id) => {
        return { type: 'calls', id, attributes };
      })
    };
  }).catch((err) => {
    return { error: `Failed to get data: ${err}` };
  });
});

api.get('/leaders', function() {
  return getSheet('Contact Info Party Leadership ').then(({ values }) => {
    return {
      // Skip header
      data: values.slice(1).map(([ title, party, name, districtNum, dcNum ], id) => {
        return {
          type: 'leaders',
          id,
          attributes: {
            title,
            party,
            name,
            districtNum: normalizePhoneNumber(districtNum),
            dcNum: normalizePhoneNumber(dcNum)
          }
        };
      })
    };
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
    return {
      data: values.map((row, id) => {
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
          type: 'senators',
          id,
          attributes: {
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
          }
        };
      })
    };
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
    return {
      data: values.map((row, id) => {
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
          type: 'reps',
          id,
          attributes: {
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
          }
        };
      })
    };
  }).catch((err) => {
    return { error: `Failed to get data: ${err}` };
  });
});
