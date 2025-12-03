🐾 Blockchain Pet Adoption DApp
<br> <div align="center">

A decentralized pet adoption platform built on Ethereum blockchain
<br>








<br>

</div>
📋 Table of Contents

✨ Features

🏗️ Architecture

🧰 Tech Stack

🚀 Quick Start

📸 Demo & Interface

🔧 Technical Details

📁 Project Structure

💡 Learning Outcomes

🛠️ Development

📄 License

✨ Features
🎯 Core Functionality

Browse Pets: View 16 pets with complete profiles (breed, age, location, vaccination status).

On-Chain Adoption: Fully decentralized adoption using Ethereum smart contracts.

Live Dashboard: Real-time stats (total/adopted/available pets + progress bar).

Pet Details Modal: Detailed view of each pet and adoption status.

Responsive UI using Bootstrap 5.

🔄 Smart Features

Instant Blockchain Sync: UI updates immediately after transactions.

MetaMask Integration: Auto-detect wallet, account changes, and networks.

Toast Notifications: Clean success/error feedback system.

Robust Error Handling: Handles invalid inputs, transaction failures, and provider errors.

Gas Estimation: Smart gas calculation.

🛡️ Security & UX Enhancements

Pet ID Validation (0–15)

Double-Adoption Prevention

Wallet Connection Management

Network Change Detection

Transaction Locking to prevent double-spending

🏗️ Architecture
<div align="center">

</div>
🧰 Tech Stack
Layer	Technology	Purpose
Blockchain	Ethereum (Ganache)	Local development blockchain
Smart Contracts	Solidity 0.5.0	Pet adoption business logic
Dev Framework	Truffle Suite	Contract compilation & deployment
Frontend Framework	Bootstrap 5	Responsive UI components
Blockchain Interaction	Web3.js 1.5.0	Ethereum JavaScript API
Testing	Mocha / Chai	Smart contract unit testing
Frontend	HTML5, CSS3, jQuery	UI and interactions
🚀 Quick Start
Prerequisites

Node.js 14+

MetaMask

Ganache (GUI or CLI)

Git

1. Clone & Setup
git clone https://github.com/yourusername/pet-adoption-dapp.git
cd pet-adoption-dapp

# Install dependencies
npm install

2. Start Blockchain
ganache-cli --port 7545


Or open Ganache GUI → New Workspace.

3. Deploy Smart Contracts
truffle migrate --reset

4. Configure MetaMask

Network: Localhost 7545

Import a Ganache account

Ensure 100 ETH test balance

5. Launch Frontend
npx serve src


(or python -m http.server 8000, etc.)

6. Access DApp

Open: http://localhost:3000

Connect MetaMask → Start adopting pets!

📸 What the Demo Shows

Wallet connection

Browsing pets

Pet detail modal

Adoption on blockchain

Real-time dashboard updates

Network switch detection

Error-handling scenarios

🔧 Technical Details
Smart Contract — Adoption.sol
pragma solidity ^0.5.0;

contract Adoption {
    address[16] public adopters;

    function adopt(uint petId) public returns (uint) {
        require(petId >= 0 && petId <= 15, "Invalid pet ID");
        require(adopters[petId] == address(0), "Pet already adopted");

        adopters[petId] = msg.sender;
        return petId;
    }

    function getAdopters() public view returns (address[16] memory) {
        return adopters;
    }
}

Deployment Config — truffle-config.js
development: {
  host: "127.0.0.1",
  port: 7545,
  network_id: "1337",
  gas: 6721975,
  gasPrice: 20000000000
}

Frontend Integration Example
async adoptPet(petId) {
    const accounts = await web3.eth.getAccounts();
    return await this.contract.methods.adopt(petId).send({
        from: accounts[0],
        gas: 500000
    });
}

📁 Project Structure
pet-adoption-dapp/
├── contracts/              
│   ├── Adoption.sol
│   └── Migrations.sol
├── migrations/
│   ├── 1_initial_migration.js
│   └── 2_deploy_contracts.js
├── src/
│   ├── index.html
│   ├── css/style.css
│   ├── js/app.js
│   ├── js/web3.min.js
│   ├── data/pets.json
│   └── images/
├── test/
│   └── Adoption.test.js
├── build/
├── README.md
├── package.json
├── truffle-config.js
└── bs-config.json

💡 Learning Outcomes
Blockchain Development

Solidity (validation, storage, events)

Truffle deployment

Gas estimation / optimization

Smart contract testing

Frontend Integration

Web3.js interaction

MetaMask provider handling

Real-time UI sync with blockchain

Architecture & Testing

Decentralized app structure

State management

Mocha/Chai smart contract testing

Challenges Solved
Challenge	Solution
Transaction reliability	Retry + error handling
MetaMask issues	Provider fallbacks & monitoring
Real-time updates	Event listeners & polling
Gas errors	Manual gas limits
Network switching	Auto page reload
🛠️ Development Commands
truffle test
truffle compile
truffle migrate --reset
truffle develop
npm run lint

📄 License

Licensed under the MIT License.

<br> <div align="center">

Built with ❤️ for the blockchain community
⭐ Star this repo if you found it useful! ⭐
<br>
Contribute • Report Issues • Fork the Project

</div>
