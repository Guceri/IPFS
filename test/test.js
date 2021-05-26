const IPFS = artifacts.require('./IPFS.sol')

require('chai')
  .use(require('chai-as-promised'))
  .should()

contract('IPFS', ([deployer, author, tipper]) => {
  let ipfs

  before(async () => {
    ipfs = await IPFS.deployed()
  })

  describe('deployment', async () => {

    it('deploys successfully', async () => {
      const address = await ipfs.address
      assert.notEqual(address, 0x0)
      assert.notEqual(address, '')
      assert.notEqual(address, null)
      assert.notEqual(address, undefined)
    })

    it('has a name', async () => {
      const name = await ipfs.name()
      assert.equal(name, 'IPFS') 
    })

  })

  describe('images', async () => {
    let result, imageCount

    const hash = 'abc123'

    before (async () => {
      result = await ipfs.uploadImage(hash, 'Image description', { from: author })
      imageCount = await ipfs.imageCount()
    })
    //=======================================================================================================
    it ('creates images', async () => {
      assert.equal(imageCount, 1)
      const event = result.logs[0].args
      assert.equal(event.id.toNumber(), imageCount.toNumber(), 'id is correct')
      assert.equal(event.hash, hash, 'Hash is correct')
      assert.equal(event.description, 'Image description', 'description is correct')
      assert.equal(event.tipAmount, '0', 'tip amount is correct')
      assert.equal(event.author, author, 'author is correct')

      await ipfs.uploadImage('', 'Image description', { from: author }).should.be.rejected;
      await ipfs.uploadImage('Image hash', '', { from: author }).should.be.rejected;
    })
    //=======================================================================================================
    //pull image (above) from the Struct object to make sure it is being stored properly
    it('lists images', async () => {
      const image = await ipfs.images(imageCount)
      assert.equal(image.id.toNumber(), imageCount.toNumber(), 'id is correct') //image account is 1 in this case
      assert.equal(image.hash, hash, 'Hash is correct')
      assert.equal(image.description, 'Image description', 'description is correct')
      assert.equal(image.tipAmount, '0', 'tip amount is correct')
      assert.equal(image.author, author, 'author is correct')
    })
    //=======================================================================================================
    it('allows users to tip images', async () => {
      let oldAuthorBalance
      oldAuthorBalance = await web3.eth.getBalance(author)
      oldAuthorBalance = new web3.utils.BN(oldAuthorBalance)
      result = await ipfs.tipImageOwner(imageCount, { from: tipper, value: web3.utils.toWei('1', 'Ether') })

      // SUCCESS (use the event emitter to make sure everything is ok)
      const event = result.logs[0].args
      assert.equal(event.id.toNumber(), imageCount.toNumber(), 'id is correct')
      assert.equal(event.hash, hash, 'Hash is correct')
      assert.equal(event.description, 'Image description', 'description is correct')
      assert.equal(event.tipAmount, '1000000000000000000', 'tip amount is correct')
      assert.equal(event.author, author, 'author is correct')

      // Check that author received funds (just getting the balance for now)
      let newAuthorBalance
      newAuthorBalance = await web3.eth.getBalance(author)
      newAuthorBalance = new web3.utils.BN(newAuthorBalance)

      let tipImageOwner
      tipImageOwner = new web3.utils.BN(event.tipAmount)
      const expectedBalance = oldAuthorBalance.add(tipImageOwner)
      assert.equal(newAuthorBalance.toString(), expectedBalance.toString())
      await ipfs.tipImageOwner(99, { from: tipper, value: web3.utils.toWei('1', 'Ether')}).should.be.rejected;
    })
  })
})