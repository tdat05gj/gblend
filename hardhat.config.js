require("@nomiclabs/hardhat-waffle");
require("@nomiclabs/hardhat-ethers");

const PRIVATE_KEY = "0xc77a6ae1580ac8301335fc154b7c0777d701b002f6c67f8a41090ceca750620e";

module.exports = {
  solidity: {
    version: "0.8.19",
    settings: {
      optimizer: {
        enabled: true,
        runs: 1000 // Higher runs for L2 optimization
      },
      viaIR: true // Enable Yul optimizer for better gas optimization
    }
  },
  networks: {
    gblend: {
      url: "https://rpc.testnet.fluent.xyz/",
      accounts: [PRIVATE_KEY],
      chainId: 20994,
      gasPrice: 1000000000, // 1 gwei - very low for L2
      gas: 8000000, // High gas limit for L2
    },
    localhost: {
      url: "http://127.0.0.1:8545",
      accounts: [PRIVATE_KEY]
    }
  },
  paths: {
    sources: "./contracts",
    tests: "./test",
    cache: "./cache",
    artifacts: "./artifacts"
  }
};
