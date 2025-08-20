require("@nomiclabs/hardhat-ethers");

const PRIVATE_KEY = "gblend";

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
      url: "https://rpc.testnet.fluent.xyz/",
      accounts: [PRIVATE_KEY],
      chainId: 20994,
    },
  },
};
