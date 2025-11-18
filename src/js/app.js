App = {
  web3Provider: null,
  contracts: {},
  account: '0x0',

  init: async function() {
    // Load pets from JSON
    const response = await fetch('../pets.json');
    const data = await response.json();

    const petsRow = $('#petsRow');
    const petTemplate = $('#petTemplate');

    for (let i = 0; i < data.length; i++) {
      petTemplate.find('.panel-title').text(data[i].name);
      petTemplate.find('img').attr('src', data[i].picture);
      petTemplate.find('.pet-breed').text(data[i].breed);
      petTemplate.find('.pet-age').text(data[i].age);
      petTemplate.find('.pet-location').text(data[i].location);
      petTemplate.find('.btn-adopt').attr('data-id', data[i].id);

      petsRow.append(petTemplate.html());
    }

    return await App.initWeb3();
  },

  initWeb3: async function() {
    // Modern dapp browsers
    if (window.ethereum) {
      App.web3Provider = window.ethereum;
      try {
        await window.ethereum.request({ method: 'eth_requestAccounts' });
      } catch (error) {
        console.error("User denied account access");
      }
    }
    // Legacy dapp browsers
    else if (window.web3) {
      App.web3Provider = window.web3.currentProvider;
    }
    // Ganache fallback
    else {
      App.web3Provider = new Web3.providers.HttpProvider('http://127.0.0.1:7545');
    }

    web3 = new Web3(App.web3Provider);

    // Get the first account
    const accounts = await web3.eth.getAccounts();
    if (accounts.length === 0) {
      alert("No accounts found. Make sure your Ethereum client is configured correctly.");
      return;
    }
    App.account = accounts[0];
    console.log("Using account:", App.account);

    return App.initContract();
  },

  initContract: async function() {
    try {
      const response = await fetch('../build/contracts/Adoption.json');
      const data = await response.json();

      const contractABI = data.abi;
      const contractAddress = "0x5D9FA9DBc02D79dAE18EBC4F929E5193034456d8"; // Replace with your deployed address

      App.contracts.Adoption = new web3.eth.Contract(contractABI, contractAddress);
      console.log("Contract instance created at address:", contractAddress);

      App.bindEvents();
      App.markAdopted();
    } catch (err) {
      console.error("Error loading contract:", err);
    }
  },

  bindEvents: function() {
    $(document).on('click', '.btn-adopt', App.handleAdopt);
  },

  markAdopted: async function() {
    if (!App.contracts.Adoption) {
      console.log("Contract not ready yet");
      return;
    }

    try {
      const adopters = await App.contracts.Adoption.methods.getAdopters().call();

      for (let i = 0; i < adopters.length; i++) {
        if (adopters[i] !== '0x0000000000000000000000000000000000000000') {
          $('.panel-pet').eq(i).find('button').text('Success').attr('disabled', true);
        }
      }
    } catch (err) {
      console.log("Error marking adopted pets:", err);
    }
  },

  handleAdopt: async function(event) {
    event.preventDefault();

    const petId = parseInt($(event.target).data('id'));

    try {
      const accounts = await web3.eth.getAccounts();
      const account = accounts[0];

      console.log("Adopting pet ID:", petId, "from account:", account);

      await App.contracts.Adoption.methods.adopt(petId).send({ from: account });

      App.markAdopted();
    } catch (err) {
      console.log("Adoption failed:", err);
    }
  }
};

$(function() {
  $(window).load(function() {
    App.init();
  });
});
