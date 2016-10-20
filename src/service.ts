import * as Promise from "bluebird";
import * as fs from "fs";
import * as  readline from "readline";
import * as uuid from "node-uuid";
import {Query} from "./models";
import {fileRead} from "./utils";
import * as google from "googleapis";
import * as googleAuth from "google-auth-library";

import * as Debug from "debug";
// import * as bodyParser from "body-parser";
const debug = Debug("app:service");

interface Map<K, V> {
    clear(): void;
    delete(key: K): boolean;
    forEach(callbackfn: (value: V, index: K, map: Map<K, V>) => void, thisArg?: any): void;
    get(key: K): V;
    has(key: K): boolean;
    set(key: K, value: V): Map<K, V>;
    size: number;
}
declare var Map: {
    new <K, V>(): Map<K, V>;
    prototype: Map<any, any>;
}


let map = new Map<string, Query>();



// If modifying these scopes, delete your previously saved credentials
// at ~/.credentials/drive-nodejs-quickstart.json
const  SCOPES = ["https://www.googleapis.com/auth/drive.readonly"];
const TOKEN_DIR = (process.env.HOME || process.env.HOMEPATH ||
    process.env.USERPROFILE) + "/.credentials/";
const TOKEN_PATH = TOKEN_DIR + "drive-nodejs-quickstart.json";

export function initConnection(msg: any, reply: any): void {
    debug("init credentials: ", msg.credentials);

    authorize(msg.credentials)
        .then(oauth2Client => {
            let clienId = uuid.v1();
            let query: Query={
                limit: msg.size,
                fileExtensions: msg.extensions,
                nextPageToken:'',
                auth: oauth2Client,
                credentials: msg.credentials}
                map.set(clienId,query);
                return reply(null, {iterator:clienId});

        }).catch(err => {
        return reply(err, {});
    });

    debug("init options: ", msg.options);

}

export function getList(msg: any, reply: any): void {
    debug("getList msg: ", msg);
    let query = map.get(msg.key)
    if (!query){
        reply("key error", {});
    }

    listFiles(query)
        .then(res =>{
            // debug("answer",res);
            if (!res.hasNext){
                debug("iterator return all files");
                map.delete(msg.key);
                reply(null, {answer: "finish"});
            }
            return reply(null, res);
        }).catch(err =>{
        console.error(err)
        return reply(err, {});
    });
    debug("igetList: ", msg);
    // reply(null, {answer: "finish"});
}




/**
 * Create an OAuth2 client with the given credentials, and then execute the
 * given callback function.
 *
 * @param {Object} credentials The authorization client credentials.
 * @param {function} callback The callback to call with the authorized client.
 */
export function authorize(credentials: any): Promise<string> {
    let clientSecret = credentials.installed.client_secret;
    let clientId = credentials.installed.client_id;
    let redirectUrl = credentials.installed.redirect_uris[0];
    let auth = new googleAuth();
    let oauth2Client = new auth.OAuth2(clientId, clientSecret, redirectUrl);

    // Check if we have previously stored a token.
    return fileRead(TOKEN_PATH)
        .then( token => {
            oauth2Client.credentials = JSON.parse(token);
            return Promise.resolve(oauth2Client);
        })
        .catch(err => {
            // console.error(err);
            return getNewToken(oauth2Client);
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
function getNewToken(oauth2Client: any): Promise<any> {
    let authUrl = oauth2Client.generateAuthUrl({
        access_type: "offline",
        scope: SCOPES
    });
    console.log("Authorize this app by visiting this url: ", authUrl);
    let rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });

    return new Promise((resolve, reject) => {

        rl.question("Enter the code from that page here: ", function (code: string) {
            rl.close();
            oauth2Client.getToken(code, function (err: any, token: string) {
                if (err) {
                    console.log("Error while trying to retrieve access token", err);
                    reject(err);
                }
                oauth2Client.credentials = token;
                storeToken(token);
                resolve(oauth2Client);
            });
        });
    });
}

/**
 * Store token to disk be used in later program executions.
 *
 * @param {Object} token The token to store to disk.
 */
function storeToken(token: any) {
    try {
        fs.mkdirSync(TOKEN_DIR);
    } catch (err) {
        if (err.code !== "EEXIST") {
            throw err;
        }
    }
    fs.writeFile(TOKEN_PATH, JSON.stringify(token));
    console.log("Token stored to " + TOKEN_PATH);
}

/**
 * Lists of th files include text metadata and text .
 *
 * @param {Query} auth An authorized OAuth2 client.
 */
export function listFiles(cashed_query: Query): Promise<any> {
    debug("listFiles", cashed_query.auth.credentials);
    // field file retrieve available metadata
    const fields = "files,kind,nextPageToken"
    const query = convertAray(cashed_query.fileExtensions);
    debug("extensions",query);
    let promises= new Array<Promise<any>>();
    // noinspection TypeScriptUnresolvedFunction
    let service = google.drive("v3");
    return new Promise( (resolve, reject) =>{
        service.files.list({
            auth: cashed_query.auth,
            // files searching in subfolders to
            q:query,
            pageToken:cashed_query.nextPageToken,
            pageSize: cashed_query.limit,
            fields: fields
        },(err: any, response: any) => {
            if (err) {
                console.log("The API returned an error: " + err);
                reject(err)
            }
            const files = response.files;
            if (files.length === 0) {
                console.log("No files found.");
            } else {
                console.log("Files:");
                for (let i = 0; i < files.length; i++) {
                    let file = files[i];

                    //check if file is readable and retrieve file text
                    if (file.mimeType.includes("text")){
                        promises.push(addTextField(cashed_query.auth, file));
                    }
                }
            }
            Promise.all(promises).then(() => {
                debug("all file readed");
                if(cashed_query.limit>files.length){
                    // iteraor return all files
                    resolve({files: files,hasNext: false});

                }
                cashed_query.nextPageToken=response.nextPageToken;
                resolve({files: files,hasNext: true});
            });
        });
    });

}

function convertAray(extensions: [string]): string {
    return "fileExtension = '"+extensions.join("' or fileExtension = '")+"'"
}

function addTextField(auth: any, fileMeta: any): Promise<any>{
    return new Promise((resolve, reject) => {

        //noinspection TypeScriptUnresolvedFunction
        let service = google.drive("v3");
        service.files.get({
            auth:auth,
            fileId:fileMeta.id,
            alt:'media'

        },(err:any,res: any) => {
            if (err){
                reject(err);
            }
            fileMeta.text=res;
            console.log("in file id: %s - %s char ",fileMeta.id,res.length);
            resolve(res);
        });
    });
}