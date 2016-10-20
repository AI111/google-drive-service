
import * as Debug from "debug";
const debug = Debug("app:main");
import * as Seneca from "seneca";
const seneca = Seneca();
import * as service from "./service";
import * as utils from  "./utils";
import * as Promise from "bluebird";
let act = Promise.promisify(seneca.act, {context: seneca});

let b: boolean = false

/** Create iterator for using in 'cmd:list' method
 * {credentials} JSON object from client_secret* file,
 * {extensions} string array of extensions
 * {size} count of file per request
 * curl -d '{"cmd":"init,"credentials":{...},"extensions":[string],"size":number}' http://localhost:3000/act
 *  return string iterator for work with 'cmd:init'
 */
seneca.add("cmd:init", service.initConnection);


/** Create iterator for using in 'cmd:list' method
 * {iterator}: string iterator (key of Map) for fork with file list,
 * curl -d '{"cmd":"init,"credentials":{...},"extensions":[string],"size":number}' http://localhost:3000/act
 * return  boolean value hasNext, if false readed all files of query
 */
seneca.add("cmd:list", service.getList);

// seneca.listen();
b
function promiseWhile(condition: any, action: any) {
    let resolver = Promise.defer();

    function loop(): Promise<any> {
        if (!condition()) return Promise.resolve();
        return Promise.cast(action())
            .then(loop)
            .catch(resolver.reject);
    };

    process.nextTick(loop);

    return resolver.promise;
};


//
utils.testWork("client_secret_1029260356342-2rgcb9kqulkf777lbg2t8stvks9gs7qd.apps.googleusercontent.com.json",seneca);