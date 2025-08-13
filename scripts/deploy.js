const hre = require("hardhat");

async function main() {
  console.log("Deploying FluentMessaging contract to Fluent Testnet...");

  // Get the ContractFactory and Signers here.
  const [deployer] = await hre.ethers.getSigners();
  
  console.log("Deploying contracts with the account:", deployer.address);
  console.log("Account balance:", (await deployer.getBalance()).toString());

  // Deploy the contract
  const FluentMessaging = await hre.ethers.getContractFactory("FluentMessaging");
  const fluentMessaging = await FluentMessaging.deploy();

  await fluentMessaging.deployed();

  console.log("FluentMessaging deployed to:", fluentMessaging.address);
  
  // Save the contract address
  const fs = require('fs');
  const contractAddress = {
    FluentMessaging: fluentMessaging.address,
    network: "fluent-testnet",
    chainId: 20994
  };
  
  fs.writeFileSync('contract-address.json', JSON.stringify(contractAddress, null, 2));
  console.log("Contract address saved to contract-address.json");

  // Wait for a few block confirmations
  console.log("Waiting for block confirmations...");
  await fluentMessaging.deployTransaction.wait(5);
  
  console.log("Deployment completed successfully!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
