/**
 * Parse platform server
 * @author: Thanh Vu <jwtrs512@gmail.com>
 */
const enableFirebase = process.env.FIREBASE_SERVICE_ACCOUNT_KEY && process.env.FIREBASE_DATABASE_URL;

const http = require('http');
const express = require('express');
const ParseServer = require('parse-server').ParseServer;
const S3Adapter = require('parse-server').S3Adapter;
let firebaseAuthAdapter;
if (enableFirebase) {
  firebaseAuthAdapter = require('parse-server-firebase-auth-adapter');
}
const path = require('path');

global.FirebaseAdmin = require('firebase-admin');

const app = express();

const databaseUri = process.env.DATABASE_URI || process.env.MONGODB_URI;

if (!databaseUri) {
  throw new Error('DATABASE_URI is not specified.');
}

let apiConfig = {
  databaseURI: databaseUri || 'mongodb://USER:PASSWORD@DOMAIN:27017/DB_NAME?ssl=true',
  cloud: process.env.CLOUD_CODE_MAIN || __dirname + '/cloud/main.js',
  appId: process.env.APP_ID || 'YOUR_KEY',
  masterKey: process.env.MASTER_KEY || 'YOUR_KEY',
  serverURL: process.env.SERVER_URL || 'http://localhost:1337/parse',
};

const push = {};

if (process.env.ANDROID_PUSH_NOTIFICATION_API_KEY) {
  push.android = {
    apiKey: process.env.ANDROID_PUSH_NOTIFICATION_API_KEY,
  }
}

if (process.env.IOS_PUSH_NOTIFICATION_CERT_DEV && process.env.IOS_PUSH_NOTIFICATION_CERT) {
  push.ios = [{
    pfx: process.env.IOS_PUSH_NOTIFICATION_CERT_DEV,
    passphrase: process.env.IOS_PUSH_NOTIFICATION_CERT_PASSWORD_DEV || '', // optional password to your p12/PFX
    topic: process.env.IOS_BUNDLE_IDENTIFIER_DEV || '',
    production: false,
  },
  {
    pfx: process.env.IOS_PUSH_NOTIFICATION_CERT,
    passphrase: process.env.IOS_PUSH_NOTIFICATION_CERT_PASSWORD || '', // optional password to your p12/PFX
    topic: process.env.IOS_BUNDLE_IDENTIFIER || '',
    production: true,
  }];
}

if (push.android || push.ios) {
  apiConfig.push = push;
}

const auth = {};

if (process.env.FACEBOOK_APP_ID && process.env.FB_ACCOUNTKIT_SECRET) {
  auth.facebookaccountkit = {
    appIds: [process.env.FACEBOOK_APP_ID],
    appSecret: process.env.FB_ACCOUNTKIT_SECRET
  }
}

if (enableFirebase) {
  FirebaseAdmin.initializeApp({
    credential: FirebaseAdmin.credential.cert(require(process.env.FIREBASE_SERVICE_ACCOUNT_KEY)),
    databaseURL: process.env.FIREBASE_DATABASE_URL,
  });
  auth.firebase = firebaseAuthAdapter;
}

apiConfig.auth = auth;

if (process.env.S3_BUCKET) {
  apiConfig.filesAdapter = new S3Adapter(
    process.env.S3_ACCESS_KEY,
    process.env.S3_SECRET_KEY,
    process.env.S3_BUCKET,
    {
      directAccess: true,
      region: process.env.S3_REGION || 'us-east-1',
    }
  );
}

const api = new ParseServer(apiConfig);

// Serve static assets from the /public folder
app.use('/public', express.static(path.join(__dirname, '/public')));

// Serve the Parse API on the / URL prefix
const mountPath = process.env.PARSE_MOUNT || '/';
app.use(mountPath, api);

// Serve the Parse API on the /
const port = process.env.PORT || 1337;

const httpServer = http.createServer(app);

httpServer.listen(port, function() {
  console.log('parse-server running on port ' + port + '.');
});
