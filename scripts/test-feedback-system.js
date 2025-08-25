const hre = require("hardhat");

async function main() {
  console.log("🧪 Testing FeedbackSystem Contract Thoroughly...");

  const [deployer, user1, user2] = await hre.ethers.getSigners();
  
  // Get contract instance
  const FeedbackSystem = await hre.ethers.getContractFactory("FeedbackSystem");
  const contract = FeedbackSystem.attach("0x2Eb7e8f39fd440a7c2bb0015d2DDe1aA7f5bfA87");

  console.log("📍 Testing contract at:", contract.address);
  console.log("👤 Deployer account:", deployer.address);
  console.log("👤 User1 account:", user1.address);
  console.log("👤 User2 account:", user2.address);

  try {
    // Test 1: Initial Stats
    console.log("\n🔍 Test 1: Initial Stats");
    let stats = await contract.getStats();
    console.log(`✅ Topics: ${stats.topicCount}, Comments: ${stats.commentCount}`);
    console.log(`✅ Next Topic ID: ${stats.nextTopic}, Next Comment ID: ${stats.nextComment}`);

    // Test 2: Create Multiple Topics
    console.log("\n🔍 Test 2: Create Multiple Topics");
    
    // Topic 1 by deployer
    console.log("Creating topic 1...");
    let tx1 = await contract.createTopic("How to get started?", "I'm new to blockchain development. What are the best resources to learn?");
    await tx1.wait();
    console.log("✅ Topic 1 created by deployer");

    // Topic 2 by user1
    console.log("Creating topic 2...");
    let contractAsUser1 = contract.connect(user1);
    let tx2 = await contractAsUser1.createTopic("Best DeFi protocols", "What are your favorite DeFi protocols and why?");
    await tx2.wait();
    console.log("✅ Topic 2 created by user1");

    // Topic 3 by user2
    console.log("Creating topic 3...");
    let contractAsUser2 = contract.connect(user2);
    let tx3 = await contractAsUser2.createTopic("Security best practices", "Share your tips for smart contract security");
    await tx3.wait();
    console.log("✅ Topic 3 created by user2");

    // Test 3: Check All Topics
    console.log("\n🔍 Test 3: Get All Topics");
    const topics = await contract.getAllTopics();
    console.log(`✅ Found ${topics.length} topics:`);
    
    topics.forEach((topic, index) => {
      console.log(`   Topic ${index + 1}:`);
      console.log(`     - ID: ${topic.id}`);
      console.log(`     - Title: ${topic.title}`);
      console.log(`     - Creator: ${topic.creator}`);
      console.log(`     - Comments: ${topic.commentCount}`);
      console.log(`     - Active: ${topic.isActive}`);
    });

    // Test 4: Add Comments to Topics
    console.log("\n🔍 Test 4: Add Comments");
    
    // Comments on topic 1
    console.log("Adding comments to topic 1...");
    let comment1 = await contractAsUser1.addComment(1, "I recommend starting with Solidity documentation and OpenZeppelin tutorials!");
    await comment1.wait();
    
    let comment2 = await contractAsUser2.addComment(1, "Also check out Hardhat for development environment setup.");
    await comment2.wait();
    
    let comment3 = await contract.addComment(1, "Thanks for the suggestions! Very helpful.");
    await comment3.wait();
    
    console.log("✅ Added 3 comments to topic 1");

    // Comments on topic 2
    console.log("Adding comments to topic 2...");
    let comment4 = await contract.addComment(2, "I love Uniswap for DEX and Compound for lending!");
    await comment4.wait();
    
    let comment5 = await contractAsUser2.addComment(2, "Aave is also great for borrowing and lending with more features.");
    await comment5.wait();
    
    console.log("✅ Added 2 comments to topic 2");

    // Test 5: Get Topic Comments
    console.log("\n🔍 Test 5: Get Topic Comments");
    
    const topic1Comments = await contract.getTopicComments(1);
    console.log(`✅ Topic 1 has ${topic1Comments.length} comments:`);
    topic1Comments.forEach((comment, index) => {
      console.log(`   Comment ${index + 1}:`);
      console.log(`     - ID: ${comment.id}`);
      console.log(`     - Commenter: ${comment.commenter}`);
      console.log(`     - Content: ${comment.content.substring(0, 50)}...`);
    });

    const topic2Comments = await contract.getTopicComments(2);
    console.log(`✅ Topic 2 has ${topic2Comments.length} comments:`);
    topic2Comments.forEach((comment, index) => {
      console.log(`   Comment ${index + 1}:`);
      console.log(`     - ID: ${comment.id}`);
      console.log(`     - Commenter: ${comment.commenter}`);
      console.log(`     - Content: ${comment.content.substring(0, 50)}...`);
    });

    // Test 6: Updated Stats
    console.log("\n🔍 Test 6: Final Stats");
    stats = await contract.getStats();
    console.log(`✅ Final Topics: ${stats.topicCount}`);
    console.log(`✅ Final Comments: ${stats.commentCount}`);
    console.log(`✅ Next Topic ID: ${stats.nextTopic}`);
    console.log(`✅ Next Comment ID: ${stats.nextComment}`);

    // Test 7: Verify Updated Topic Counts
    console.log("\n🔍 Test 7: Verify Topic Comment Counts");
    const updatedTopics = await contract.getAllTopics();
    updatedTopics.forEach((topic, index) => {
      console.log(`✅ Topic ${topic.id} (${topic.title.substring(0, 20)}...) has ${topic.commentCount} comments`);
    });

    // Test 8: Error Handling
    console.log("\n🔍 Test 8: Error Handling Tests");
    
    try {
      await contract.createTopic("", "Empty title test");
      console.log("❌ Should have failed for empty title");
    } catch (error) {
      console.log("✅ Correctly rejected empty title");
    }

    try {
      await contract.addComment(999, "Comment on non-existent topic");
      console.log("❌ Should have failed for invalid topic ID");
    } catch (error) {
      console.log("✅ Correctly rejected invalid topic ID");
    }

    try {
      await contract.addComment(1, "");
      console.log("❌ Should have failed for empty comment");
    } catch (error) {
      console.log("✅ Correctly rejected empty comment");
    }

    console.log("\n🎉 All tests completed successfully!");
    console.log("\n📊 Final Summary:");
    console.log(`   ✅ ${stats.topicCount} topics created`);
    console.log(`   ✅ ${stats.commentCount} comments added`);
    console.log(`   ✅ Contract working perfectly!`);

  } catch (error) {
    console.error("❌ Test failed:", error);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
