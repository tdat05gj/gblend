require("@nomicfoundation/hardhat-toolbox");
require("@nomicfoundation/hardhat-verify");

const PRIVATE_KEY = "0x6e3d60925e2f4b7b0b8e9a7c2e7e7f3e9c9c9e9c9e9c9e9c9e9c9e9c9e9c9e9c";

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: {
    version: "0.8.19",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
    },
  },
  networks: {
    gblend: {
      url: "https://rpc.gblend.xyz/",
      accounts: [PRIVATE_KEY],
      chainId: 20994,
    },
  },
  etherscan: {
    apiKey: {
      gblend: "abc"
    },
    customChains: [
      {
        network: "gblend",
        chainId: 20994,
        urls: {
          apiURL: "https://scan.gblend.xyz/api",
          browserURL: "https://scan.gblend.xyz"
        }
      }
    ]
  }
};
