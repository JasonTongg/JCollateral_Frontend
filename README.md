<img width="1506" height="816" alt="image" src="https://github.com/user-attachments/assets/de0a7d1a-b117-449c-9675-5d90c8782360" />

# JCollateral Frontend

## Project Overview

This repository contains the **frontend** (client-side) application for **JCollateral**, a decentralized Web3 interface for managing crypto collateral positions and interacting with collateralized lending smart contracts.

The frontend’s primary goal is to provide a responsive, intuitive UI for users to connect wallets, view asset prices and parameter feeds, deposit collateral, and interact with protocol functions such as borrowing, repaying, and position management.

- **Live Product:** [JCollateral](https://jcollateral.vercel.app/)
- **Smart Contract using Foundry:** [JCollateral Smart Contract](https://github.com/JasonTongg/JCollateral)

## Features
- Connect Web3 wallets (e.g., MetaMask, Rainbow Kit)
- Display real-time asset pricing and risk metrics (e.g., collateral ratios)
- Deposit supported collateral tokens
- Borrow against posted collateral
- Repay borrowed tokens and withdraw collateral
- View active positions and protocol state
- Handle liquidations and risk notifications

## Technology Stack

- **Framework:** Next.js (React)
- **Language:** JavaScript (ES6+)
- **Styling:** Tailwind CSS / Material UI (or your actual style libraries)
- **Web3 Integration:** WalletConnect, Rainbow Kit, Wagmi or Ethers.js
- **Deployment:** Vercel

## Web3 & Contracts:
The frontend interfaces with on-chain smart contracts for collateral and lending. It uses Web3 libraries to send transactions and read state, facilitating user interaction with deployed contracts.

## Web3 Integration

The frontend integrates with Ethereum (or other EVM) wallets via Web3 connectors. Typical libraries include:
- Rainbow Kit (wallet UI & connectors)
- Wagmi (React hooks for Web3)
- Ethers.js (contract interaction)

Users connect wallets to:
- Read account balances
- Fetch collateral valuations
- Submit transactions (borrow, repay, deposit, withdraw)
  
Smart contract addresses and ABI definitions should be configured through environment variables.

## Author  

**Jason Tong**  

- **Product:** [JCollateral](https://jcollateral.vercel.app/)
- **GitHub:** [JasonTongg](https://github.com/JasonTongg).
- **Linkedin:** [Jason Tong](https://www.linkedin.com/in/jason-tong-42600319a/).
