const pify = require('pify');
const Protocol = require('@fusebit/cloud-git/lib/protocol');

function _findAndRemoveRefs({ storage, repo, ref }, cb) {
    storage.hashDelete(`${repo}/refs`, ref, function (err) {
        if (err) {
            cb(err)
        } else {
            cb(null)
        }
    });
}

function _findUpdateRefs({ storage, repo, ref, data }, cb) {
    storage.hashPut(`${repo}/refs`, ref, data, function (err) {
        if (err) {
            cb(err)
        } else {
            cb(null)
        }
    });
}


function _createRepoRefs({ storage, repo}, cb) {
    storage.hashCreate(`${repo}/objects`, function (err) {
        if (err) {
            cb(err)
        } else {
            cb(null)
        }
    });
}

function _createRepoObjects({ storage, repo}, cb) {
    storage.hashCreate(`${repo}/objects`, function (err) {
        if (err) {
            cb(err)
        } else {
            cb(null)
        }
    });
}

function _findUpdateObject({ storage, repo, sha, newObject }, cb) {
    storage.hashPut(`${repo}/objects`, sha, newObject, function (err) {
        if (err) {
            cb(err)
        } else {
            cb(null)
        }
    });
}

function _findRepoRefs({ storage, repo }, cb) {
    storage.hashGetAll(`${repo}/refs`, function (err, items) {
        if (err) {
            cb(err)
        } else {
            cb(null, items)
        }
    });
}

function _findRepoObjects({ storage, repo }, cb) {
    storage.hashGetAll(`${repo}/objects`, function (err, items) {
        if (err) {
            cb(err)
        } else {
            cb(null, items)
        }
    });
}

const pFindAndRemoveRefs = pify(_findAndRemoveRefs);

const pFindUpdateRefs = pify(_findUpdateRefs)

const pFindUpdateObject = pify(_findUpdateObject)

const pFindRepoRefs = pify(_findRepoRefs)

const pFindRepoObjects = pify(_findRepoObjects)

const pCreateRepoObjects = pify(_createRepoObjects)

const pCreateRepoRefs = pify(_createRepoRefs)


class S3Repository {
    constructor(name, storage) {
        this.repoName = name;
        this.refs = {}; // use hash  type 
        this.storage = storage
        this.refsList = [];
        this.objects = {}; // use hash  type
        this.headRef = undefined;
        this.initable = false;
    }
    isZeroId(id) {
        return id === Protocol.ZeroIdStr;
    }
    async init() {

        // create hash if not exits 
        // init refs
        let refs = await pFindRepoRefs({ storage: this.storage, repo: this.repoName })
        this.refs = refs;

        // init objects

        let objects = await pFindRepoObjects({ storage: this.storage, repo: this.repoName })
        this.objects = objects;

        // set head refs
        if (!this.refs['HEAD']) {
            ['master', 'main'].forEach(
                (b) => (this.headRef = this.refs[`refs/heads/${b}`] ? `refs/heads/${b}` : this.headRef)
            );
            if (this.headRef) {
                this.refs['HEAD'] = this.refs[this.headRef];
                this.refsList.unshift({ ref: 'HEAD', sha: this.refs['HEAD'] });
            }
        }
        // sort
        this.refsList = Object.keys(this.refs)
            .sort()
            .map((ref) => ({ ref, sha: this.refs[ref] }));
        this.initable = true;
    }
    async getRefs() {
        // req contains repo name so we can use it `req.params`
        if (!this.initable) {
            await this.init()
        }
        return this.refsList;
    }

    async getHeadRef() {
        // req contains repo name so we can use it `req.params`
        // this can do some check 
        if (!this.initable) {
            await this.init()
        }
        return this.headRef;
    }
    async receivePack(commands, objects) {
        // first do  init then store after call init again 
        // this.init()
        for (let i = 0; i < commands.length; i++) {
            if (this.isZeroId(commands[i].destId)) {
                // do remove 
                await pFindAndRemoveRefs({ storage: this.storage, repo: this.repoName, ref: commands[i].ref })
            } else {
                // do update 
                await pFindUpdateRefs({ storage: this.storage, repo: this.repoName, ref: commands[i].ref, data: commands[i].destId })
            }
        }
        // do update 

        for (let index = 0; index < objects.length; index++) {
            await pFindUpdateObject({
                storage: this.storage, 
                repo: this.repoName, 
                sha: `${objects[index].sha.toString('hex')}`, 
                newObject: {
                    objectType: objects[index].objectType,
                    data: objects[index].data,
                }
            })
        }
        // every time re call init fun
        await this.init()
    }

    async getObject(sha) {
        // req contains repo name so we can use it `req.params`
        if (!this.objects[sha]) {
            throw new Error(`Object ${sha} not found.`);
        }
        let object =  this.objects[sha];
        return {
            objectType:object.objectType,
            data:Buffer.from(object.data)
        };
    }
}


module.exports = S3Repository