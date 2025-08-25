const hre = require("hardhat");

async function main() {
  console.log("🚀 Deploying FeedbackSystem Contract...");

  const [deployer] = await hre.ethers.getSigners();
  console.log("👤 Deploying with account:", deployer.address);

  const balance = await deployer.getBalance();
  console.log("💰 Account balance:", hre.ethers.utils.formatEther(balance), "ETH");

  try {
    // Deploy contract
    console.log("\n📦 Compiling and deploying...");
    const FeedbackSystem = await hre.ethers.getContractFactory("FeedbackSystem");
    const feedbackSystem = await FeedbackSystem.deploy();
    
    console.log("⏳ Waiting for deployment...");
    await feedbackSystem.deployed();

    console.log("✅ FeedbackSystem deployed successfully!");
    console.log("📍 Contract Address:", feedbackSystem.address);
    console.log("🔗 Transaction Hash:", feedbackSystem.deployTransaction.hash);
    console.log("⛽ Gas Used:", feedbackSystem.deployTransaction.gasLimit.toString());

    // Verify deployment
    console.log("\n🔍 Verifying deployment...");
    const code = await hre.ethers.provider.getCode(feedbackSystem.address);
    console.log("📏 Contract code size:", code.length, "bytes");

    // Test basic functionality
    console.log("\n🧪 Testing basic functionality...");
    const stats = await feedbackSystem.getStats();
    console.log("📊 Initial stats:");
    console.log("   - Topics:", stats.topicCount.toNumber());
    console.log("   - Comments:", stats.commentCount.toNumber());
    console.log("   - Next Topic ID:", stats.nextTopic.toNumber());
    console.log("   - Next Comment ID:", stats.nextComment.toNumber());

    // Create test topic
    console.log("\n✏️ Creating test topic...");
    const createTx = await feedbackSystem.createTopic("Welcome Topic", "This is a welcome topic for testing the feedback system!");
    await createTx.wait();
    console.log("✅ Test topic created!");

    // Verify topic creation
    const newStats = await feedbackSystem.getStats();
    console.log("📊 Updated stats:");
    console.log("   - Topics:", newStats.topicCount.toNumber());
    console.log("   - Next Topic ID:", newStats.nextTopic.toNumber());

    // Get all topics
    const topics = await feedbackSystem.getAllTopics();
    console.log("📝 Topics in contract:", topics.length);
    if (topics.length > 0) {
      console.log("   - First topic:", topics[0].title);
    }

    console.log("\n🎉 Deployment and testing completed successfully!");
    console.log("\n📋 Contract Info:");
    console.log("   Contract: FeedbackSystem");
    console.log("   Address:", feedbackSystem.address);
    console.log("   Network: Gblend Testnet");
    console.log("   Deployer:", deployer.address);

    console.log("\n🔧 Frontend Configuration:");
    console.log(`   REACT_APP_FEEDBACK_ADDRESS=${feedbackSystem.address}`);

    return feedbackSystem.address;

  } catch (error) {
    console.error("❌ Deployment failed:", error);
    throw error;
  }
}

main()
  .then((address) => {
    console.log(`\n✨ Successfully deployed to: ${address}`);
    process.exit(0);
  })
  .catch((error) => {
    console.error("💥 Script failed:", error);
    process.exit(1);
  });
