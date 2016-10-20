import * as Promise from "bluebird";
import * as Debug from "debug";
import * as fs from "fs";

const debug = Debug("app:utils");


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


export function fileRead(url: string): Promise<any> {
    return new Promise((resolve, reject) => {
        fs.readFile(url, (err, data) => {
                if (err) reject(err);
                debug("fileRead",data);
                resolve(data);
            }
        );
    });
}

export function testWork(secret_file: string, seneca: any){
    fileRead(secret_file)
        .then(data => {
            let hasNext: boolean = true;
            const answerSize= 10;
            const extensions= ["txt"];

            debug("file  data %s", data);

            // send to service credentials and list of extensions
            seneca.act({ cmd: "init", credentials: JSON.parse(data), extensions:extensions,size:answerSize},(err,res)=>{
                    if (err) return Promise.reject(err);
                    debug("cmd:init response",res);

                    // service save query params and return iterator (key of Map) for fork with file list
                    const iterator = res.iterator;
                    promiseWhile(() => {
                        return hasNext;
                    }, () => {
                        return new Promise(function(resolve, reject) {
                            seneca.act({ cmd: "list", key: iterator}, (err, res) => {
                                if (err) reject(err);
                                console.log("RESULT files: ",res)
                                // debug("RESULT files",res);
                                hasNext=res.hasNext;
                                resolve(res);
                            });
                        });
                    }).then(() => {
                        debug("READ ALL FILES");
                    });
                });

        }).catch(err => {
            console.error(err);
        });

}