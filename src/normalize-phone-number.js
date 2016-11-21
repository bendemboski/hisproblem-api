const phoneFormatter = require('phone-formatter');

module.exports = function(phoneNumber) {
  if (!phoneNumber) {
    return phoneNumber;
  }
  return phoneFormatter.normalize(phoneNumber, 'NNN-NNN-NNNN');
};
