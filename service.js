var fs = require('fs');
var readline = require('readline');
var google = require('googleapis');
var googleAuth = require('google-auth-library');
var debug  = require('debug')('service');
// If modifying these scopes, delete your previously saved credentials
// at ~/.credentials/drive-nodejs-quickstart.json
var SCOPES= ['https://www.googleapis.com/auth/drive.metadata.readonly'];
var TOKEN_DIR = (process.env.HOME || process.env.HOMEPATH ||
    process.env.USERPROFILE) + '/.credentials/';
var TOKEN_PATH = TOKEN_DIR + 'drive-nodejs-quickstart.json';
var map = new Map();
// Load client secrets from a local file.
fs.readFile('client_secret_1029260356342-2rgcb9kqulkf777lbg2t8stvks9gs7qd.apps.googleusercontent.com.json', function processClientSecrets(err, content) {
  if (err) {
    console.log('Error loading client secret file: ' + err);
    return;
  }
  // Authorize a client with the loaded credentials, then call the
  // Drive API.
  debug('authorize',content);
  authorize(JSON.parse(content), listFiles);
});

/**
 * Create an OAuth2 client with the given credentials, and then execute the
 * given callback function.
 *
 * @param {Object} credentials The authorization client credentials.
 * @param {function} callback The callback to call with the authorized client.
 */
function authorize(credentials, callback) {
  var clientSecret = credentials.installed.client_secret;
  var clientId = credentials.installed.client_id;
  var redirectUrl = credentials.installed.redirect_uris[0];
  var auth = new googleAuth();
  var oauth2Client = new auth.OAuth2(clientId, clientSecret, redirectUrl);
  // Check if we have previously stored a token.
  fs.readFile(TOKEN_PATH, function(err, token) {
    if (err) {
      getNewToken(oauth2Client, callback);
    } else {
      oauth2Client.credentials = JSON.parse(token);
      callback(oauth2Client);
    }
  });
}

/**
 * Get and store new token after prompting for user authorization, and then
 * execute the given callback with the authorized OAuth2 client.
 *
 * @param {google.auth.OAuth2} oauth2Client The OAuth2 client to get token for.
 * @param {getEventsCallback} callback The callback to call with the authorized
 *     client.
 */
function getNewToken(oauth2Client, callback) {
  var authUrl = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES
  });
  console.log('Authorize this app by visiting this url: ', authUrl);
  var rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });
  rl.question('Enter the code from that page here: ', function(code) {
    rl.close();
    oauth2Client.getToken(code, function(err, token) {
      if (err) {
        console.log('Error while trying to retrieve access token', err);
        return;
      }
      oauth2Client.credentials = token;
      storeToken(token);
      callback(oauth2Client);
    });
  });
}

/**
 * Store token to disk be used in later program executions.
 *
 * @param {Object} token The token to store to disk.
 */
function storeToken(token) {
  try {
    fs.mkdirSync(TOKEN_DIR);
  } catch (err) {
    if (err.code !== 'EEXIST') {
      throw err;
    }
  }
  fs.writeFile(TOKEN_PATH, JSON.stringify(token));
  console.log('Token stored to ' + TOKEN_PATH);
}

/**
 * Lists the names and IDs of up to 10 files.
 *
 * @param {google.auth.OAuth2} auth An authorized OAuth2 client.
 */
function listFiles(auth) {
  debug('listFiles ',auth);
  var query= "name contains '.epub'";
  let fields = "files(appProperties,contentHints/indexableText,createdTime,description,fileExtension,id,kind,mimeType,modifiedTime,name,properties),kind,nextPageToken"
  var service = google.drive('v3');
  service.files.list({
    auth: auth,
    pageSize: 10,
    // q:query,
    fields: fields//"nextPageToken, files(id, name)"
  }, function(err, response) {
    if (err) {
      console.log('The API returned an error: ' + err);
      return;
    }
    var files = response.files;
    if (files.length == 0) {
      console.log('No files found.');
    } else {
      console.log('Files:');
      for (var i = 0; i < files.length; i++) {
        var file = files[i];
        // console.log('%s (%s)', file.name, file.id);
        console.log(file);
      }
      console.log('next page token (%s)',response.nextPageToken);
    }
  });
}

//
// {
//   "transporter": {},
//   "clientId_": "1029260356342-2rgcb9kqulkf777lbg2t8stvks9gs7qd.apps.googleusercontent.com",
//     "clientSecret_": "quvuMOQmPMGzxUQ6EnZA1nyJ",
//     "redirectUri_": "urn:ietf:wg:oauth:2.0:oob",
//     "opts": {},
//   "credentials": {
//   "access_token": "ya29.Ci-AA00sLbsvSqJyYPxnssBBjD3ec6u3i77r3CCtZrjvH9Cmx3UeBlumfyjKfCYxjw",
//       "token_type": "Bearer",
//       "refresh_token": "1/uW-7ehVkd-EOVy3m6KZXD6ziRkQjetzwW2TqqSYpWbI",
//       "expiry_date": 1476820526590
// }
// }