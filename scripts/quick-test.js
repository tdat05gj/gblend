const hre = require("hardhat");

async function main() {
  console.log("🧪 Simple Contract Test...");

  const [deployer] = await hre.ethers.getSigners();
  
  // Get contract instance
  const FeedbackSystem = await hre.ethers.getContractFactory("FeedbackSystem");
  const feedback = FeedbackSystem.attach("0x2Eb7e8f39fd440a7c2bb0015d2DDe1aA7f5bfA87");

  console.log("📍 Contract:", feedback.address);
  console.log("👤 Account:", deployer.address);

  try {
    // Check if contract exists
    const code = await hre.ethers.provider.getCode(feedback.address);
    console.log("📝 Contract code length:", code.length);
    
    if (code === "0x") {
      console.log("❌ Contract not found!");
      return;
    }

    // Test simple functions first
    console.log("\n🔍 Testing simple getters...");
    try {
      const nextTopicId = await feedback.nextTopicId();
      console.log("✅ nextTopicId:", nextTopicId.toNumber());
    } catch (e) {
      console.log("❌ nextTopicId failed:", e.message);
    }

    try {
      const topicCount = await feedback.topicCount();
      console.log("✅ topicCount:", topicCount.toNumber());
    } catch (e) {
      console.log("❌ topicCount failed:", e.message);
    }

    // Now test getStats
    console.log("\n🔍 Testing getStats()...");
    const stats = await feedback.getStats();
    console.log("✅ Stats raw:", stats);
    console.log("✅ Stats array length:", stats.length);
    if (stats.length >= 4) {
      console.log("   - topicCount:", stats[0].toNumber());
      console.log("   - commentCount:", stats[1].toNumber());
      console.log("   - nextTopic:", stats[2].toNumber());
      console.log("   - nextComment:", stats[3].toNumber());
    }

    console.log("\n🔍 Testing getAllTopics()...");
    const topics = await feedback.getAllTopics();
    console.log("✅ Topics:", topics.length);

    console.log("\n🎉 Contract is working!");

  } catch (error) {
    console.error("❌ Error:", error.message);
    console.error("Full error:", error);
  }
}

main().catch(console.error);
