const hre = require("hardhat");

async function main() {
  console.log("🔍 Debugging FeedbackSystem Contract...");

  const [deployer] = await hre.ethers.getSigners();
  
  // Check contract address from previous deployment
  const contractAddress = "0x76A82cC1B2C6e2d9b40e64D0E8b7A9C8E3f4A5B6";
  
  console.log("📍 Contract address:", contractAddress);
  console.log("👤 Using account:", deployer.address);

  try {
    // Get contract code
    const code = await hre.ethers.provider.getCode(contractAddress);
    console.log("📝 Contract code length:", code.length);
    console.log("📝 Contract exists:", code !== "0x");

    if (code === "0x") {
      console.log("❌ Contract not found at this address!");
      
      // Try to redeploy
      console.log("\n🚀 Redeploying contract...");
      const FeedbackSystem = await hre.ethers.getContractFactory("FeedbackSystem");
      const feedback = await FeedbackSystem.deploy();
      await feedback.deployed();
      
      console.log("✅ New contract deployed at:", feedback.address);
      
      // Test new contract
      const stats = await feedback.getStats();
      console.log("✅ Stats:", {
        totalTopics: stats.totalTopics.toNumber(),
        totalComments: stats.totalComments.toNumber(),
        totalUsers: stats.totalUsers.toNumber()
      });
      
      const topics = await feedback.getAllTopics();
      console.log("✅ Topics:", topics.length);
      
      return feedback.address;
    } else {
      // Test existing contract
      const FeedbackSystem = await hre.ethers.getContractFactory("FeedbackSystem");
      const feedback = FeedbackSystem.attach(contractAddress);
      
      console.log("\n🧪 Testing existing contract...");
      
      try {
        const stats = await feedback.getStats();
        console.log("✅ Stats:", {
          totalTopics: stats.totalTopics.toNumber(),
          totalComments: stats.totalComments.toNumber(),
          totalUsers: stats.totalUsers.toNumber()
        });
      } catch (error) {
        console.log("❌ getStats() failed:", error.message);
      }
      
      try {
        const topics = await feedback.getAllTopics();
        console.log("✅ Topics:", topics.length);
      } catch (error) {
        console.log("❌ getAllTopics() failed:", error.message);
      }
      
      try {
        const topicCount = await feedback.topicCount();
        console.log("✅ Topic count:", topicCount.toNumber());
      } catch (error) {
        console.log("❌ topicCount() failed:", error.message);
      }
    }

  } catch (error) {
    console.error("❌ Debug failed:", error);
  }
}

main()
  .then((newAddress) => {
    if (newAddress) {
      console.log("\n📝 Update your contract address to:", newAddress);
    }
    process.exit(0);
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
