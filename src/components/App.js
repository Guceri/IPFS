import IPFS from '../abis/IPFS.json'
import React, { Component } from 'react';
import Navbar from './Navbar'
import Main from './Main'
import Web3 from 'web3';
import './App.css';

//Declare IPFS
const ipfsClient = require('ipfs-http-client')
const ipfs_interface = ipfsClient({ host: 'ipfs.infura.io', port: 5001, protocol: 'https' }) // leaving out the arguments will default to these values

class App extends Component {

  async componentDidMount() {
    let web3, accounts, networkId, networkData, ipfs, imagesCount, image
    //Web3
    if (window.ethereum) {
      window.web3 = new Web3(window.ethereum) 
    }else {
      window.alert('Please install MetaMask')
      window.location.assign("https://metamask.io/")
    }
    web3 = window.web3
    //Accounts
    accounts = await window.ethereum.request({ method: 'eth_requestAccounts' }); 
    this.setState({ account: accounts[0] })
    //Network
    networkId = await window.ethereum.request({ method: 'net_version' })
    networkData = IPFS.networks[networkId]
    //check to make sure smart contract is on the network we are connected to
    if(networkData) {
      ipfs = new web3.eth.Contract(IPFS.abi, networkData.address)
      this.setState({ ipfs })
      imagesCount = await ipfs.methods.imageCount().call()
      this.setState({ imagesCount })
      // Load images
      for (var i = 1; i <= imagesCount; i++) {
        image = await ipfs.methods.images(i).call()
        this.setState({
          images: [...this.state.images, image]
        })
      }
      // Sort images
      this.setState({
        images: this.state.images.sort((a,b) => b.tipAmount - a.tipAmount )
      })
      this.setState({ loading: false})
    } else {
      window.alert('IPFS contract not deployed to detected network.')
    }
    //================================================================================================ 
    //Account Change
    window.ethereum.on('accountsChanged', async (accounts) => {
      console.log("change")
      this.setState({ account: accounts[0] })
    })
    //================================================================================================
    //Network Change
    window.ethereum.on('chainChanged', async (chainId) => {
      window.location.reload()
    })
  }

  captureFile = event => {
    event.preventDefault()
    //reads file off the html element
    const file = event.target.files[0]
    //native filereader for JS
    const reader = new window.FileReader()
    reader.readAsArrayBuffer(file)
    reader.onloadend = () => {
      this.setState({ buffer: Buffer(reader.result) })
      console.log('buffer', this.state.buffer)
    }
  }

  uploadImage = description => {
    console.log("Submitting file to IPFS...")
    //adding file to the IPFS
    ipfs_interface.add(this.state.buffer, (error, result) => {
      console.log('IPFS result', result)
      if(error) {
        console.error(error)
        return
      }
      this.setState({ loading: true })
      this.state.ipfs.methods.uploadImage(result[0].hash, description).send({ from: this.state.account }).on('transactionHash', (hash) => {
        this.setState({ loading: false })
      }).then ( async () => {
        window.location.reload()
      })
    })
  }

  tipImageOwner(id, tipAmount) {
    this.setState({ loading: true })
    this.state.ipfs.methods.tipImageOwner(id).send({ from: this.state.account, value: tipAmount }).on('transactionHash', (hash) => {
      this.setState({ loading: false })
    }).then ( async () => {
      window.location.reload()
    })
  }

  constructor(props) {
    super(props)
    this.state = {
      account: '',
      ipfs: null,
      images: [],
      loading: true
    }

    this.uploadImage = this.uploadImage.bind(this)
    this.tipImageOwner = this.tipImageOwner.bind(this)
    this.captureFile = this.captureFile.bind(this)
  }

  render() {
    return (
      <div>
        <Navbar account={this.state.account} />
        { this.state.loading
          ? <div id="loader" className="text-center mt-5"><p>Loading...</p></div>
          : <Main
              images={this.state.images}
              captureFile={this.captureFile}
              uploadImage={this.uploadImage}
              tipImageOwner={this.tipImageOwner}
            />
        }
      </div>
    );
  }
}

export default App;