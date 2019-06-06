/**
 * Parse platform server
 * @author: Thanh Vu <jwtrs512@gmail.com>
 */

import http from 'http';
import express from 'express';
import { ParseServer } from 'parse-server';
import firebaseAuthAdapter from 'parse-server-firebase-auth-adapter';

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

const auth = {};

if (process.env.FACEBOOK_APP_ID && process.env.FB_ACCOUNTKIT_SECRET) {
  auth.facebookaccountkit = {
    appIds: [process.env.FACEBOOK_APP_ID],
    appSecret: process.env.FB_ACCOUNTKIT_SECRET
  }
}

if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY && process.env.FIREBASE_DATABASE_URL) {
  auth.firebase = firebaseAuthAdapter;
}

apiConfig.auth = auth;

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
