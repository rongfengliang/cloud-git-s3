const GitRepository = require('@fusebit/cloud-git/lib/GitRepository');
const S3Repository = require('./s3Storage')
const Protocol = require('@fusebit/cloud-git/lib/protocol');

class S3GitRepository extends GitRepository {
  constructor(storages) {
    super();
    // for cache
    this.S3GitRepositorys = {}
    // init  pixl-server-storage/standalone 
    this.storages = storages;
  }

  async init(repoName){
    // should cache 
      if(!this.S3GitRepositorys[repoName]){
        let s3Repository = new S3Repository(repoName, this.storages)
        await s3Repository.init()
        this.S3GitRepositorys[repoName] = s3Repository
      }
  }
  async getRefs(req) {
    let repoName = req.params.repo;
    await this.init(repoName)
    return this.S3GitRepositorys[repoName].getRefs()
    // req contains repo name so we can use it `req.params`
  }

  async getHeadRef(req) {
    let repoName = req.params.repo
    await this.init[repoName]
    // req contains repo name so we can use it `req.params`
    return this.S3GitRepositorys[repoName].getRefs()
  }

  async receivePack(req, commands, objects) {
    // req contains repo name so we can use it `req.params`
    let repoName = req.params.repo
    await this.init[repoName]
    return this.S3GitRepositorys[repoName].receivePack(commands,objects)
  }

  async getObject(req, sha) {
    // req contains repo name so we can use it `req.params`
    let repoName = req.params.repo
    await this.init[repoName]
    return this.S3GitRepositorys[repoName].getObject(sha)
  }
  createExpress(express) {
    const router = express.Router();
    router.get('/:repo/info/refs', this.authorize, Protocol.handleGetRefs(this));
    router.post('/:repo/git-upload-pack', this.authorize, Protocol.handlePost(this, 'git-upload-pack'));
    router.post('/:repo/git-receive-pack', this.authorize, Protocol.handlePost(this, 'git-receive-pack'));
    return router;
  }
}

module.exports = S3GitRepository
