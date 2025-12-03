# 🐾 Blockchain Pet Adoption DApp

<div align="center">

![Architecture Diagram](https://raw.githubusercontent.com/firas005/Pet-Shop/e88306efc12322164800436f0914c3f4b611d803/app.png)

A decentralized pet adoption platform built on the Ethereum blockchain.

![Solidity Badge](https://img.shields.io/badge/Solidity-0.5.0-363636?logo=solidity)
![Web3 Badge](https://img.shields.io/badge/Web3.js-1.5.0-F16822?logo=ethereum)
![Bootstrap Badge](https://img.shields.io/badge/Bootstrap-5.3.0-7952B3?logo=bootstrap)
![Truffle Badge](https://img.shields.io/badge/Truffle-Suite-5E464D?logo=truffle)

### 🎥 Demo Video
[![Watch Demo](https://img.youtube.com/vi/JUdRTMknOAo/0.jpg)](https://youtu.be/JUdRTMknOAo)

</div>

---

## 📋 Table of Contents
- ✨ Features  
- 🏗️ Architecture  
- 🚀 Quick Start  
- 📸 Demo & Interface  
- 🔧 Technical Details  
- 📁 Project Structure  
- 💡 Learning Outcomes  
- 🛠️ Development  
- 📄 License  

---

## ✨ Features

### 🎯 Core Functionality
- **Browse Pets**: View 16 pets with full profiles (breed, age, vaccination status, etc.)
- **Blockchain-Based Adoption**: All adoptions recorded on-chain.
- **Real-Time Dashboard**: Live metrics for total, adopted, and available pets.
- **Pet Details Modal**: Complete information with adoption actions.
- **Responsive UI** using Bootstrap 5.

### 🔄 Smart Features
- **Real-Time Adoption Updates**
- **MetaMask Integration** with account & network detection
- **Toast Notifications**
- **Robust Error Handling**
- **Gas Estimation** for transactions

### 🛡️ Security & UX Enhancements
- **Pet ID validation** (0–15)
- **Double-adoption protection**
- **Wallet state management**
- **Network switching detection**
- **Transaction locking**

---

## 🏗️ Architecture

![UI Screenshot](https://raw.githubusercontent.com/firas005/Pet-Shop/6ad5dfd9c6f1e573d0250ade28ed08ada68da694/ux.png)

---

## 🧰 Tech Stack

| **Layer**                 | **Technology**        | **Purpose**                               |
|--------------------------|------------------------|-------------------------------------------|
| Blockchain               | Ethereum (Ganache)     | Local development blockchain               |
| Smart Contracts          | Solidity 0.5.0         | Pet adoption business logic                |
| Dev Framework            | Truffle Suite          | Contract compilation & deployment          |
| Frontend Framework       | Bootstrap 5            | Responsive UI                              |
| Blockchain Interaction   | Web3.js 1.5.0          | Ethereum JavaScript API                    |
| Testing                  | Mocha / Chai           | Smart contract unit tests                  |
| Frontend                 | HTML5, CSS3, jQuery    | UI + logic                                 |

---

## 🚀 Quick Start

### **Prerequisites**
- Node.js 14+
- MetaMask extension
- Ganache (GUI or CLI)
- Git

---

### 1️⃣ Clone & Install

```bash
git clone https://github.com/yourusername/pet-adoption-dapp.git
cd pet-adoption-dapp
npm install


🚀 **Setup and Run**

Start Ganache:  
```bash
ganache-cli --port 7545

Deploy contracts:
truffle migrate --reset
Compile contracts:
truffle compile
Run tests:
truffle test
Start the frontend application:
npm run dev
!!Configure MetaMask: Select Localhost 7545 and import a Ganache private key.



📜 Smart Contract: Adoption.sol
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

⚙️ Truffle Deployment Configuration: truffle-config.js
module.exports = {
  networks: {
    development: {
      host: "127.0.0.1",
      port: 7545,
      network_id: "1337",
      gas: 6721975,
      gasPrice: 20000000000
    }
  },
  compilers: {
    solc: { version: "0.5.0" }
  }
};

🗂 Project Structure
pet-adoption-dapp/
├── contracts/
│   ├── Adoption.sol
│   └── Migrations.sol
├── migrations/
├── src/
│   ├── index.html
│   ├── css/
│   ├── js/
│   ├── data/
│   └── images/
├── test/
├── build/
├── README.md
├── package.json
└── truffle-config.js

💡 Learning Outcomes

🔹 Solidity development and gas optimization

🔹 Contract testing with Mocha/Chai

🔹 Truffle workflows

🔹 Web3.js frontend integration

🔹 MetaMask connection and real-time UI sync

🔹 Robust error handling

🔹 Decentralized workflows and state management

🔹 UX design for blockchain apps


