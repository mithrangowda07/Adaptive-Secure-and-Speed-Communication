const axios = require("axios");
const fs = require("fs");
const path = require("path");

const baseURL = "http://localhost:5000";

async function runTests() {
  console.log("=== Starting API Integration Tests ===");

  // 1. Login
  let token = "";
  try {
    const loginRes = await axios.post(`${baseURL}/login`, {
      username: "device1",
      password: "password1"
    });
    token = loginRes.data.token;
    console.log("✔ Login successful, token acquired.");
  } catch (error) {
    console.error("✖ Login failed:", error.response?.data || error.message);
    process.exit(1);
  }

  const client = axios.create({
    baseURL,
    headers: { Authorization: `Bearer ${token}` }
  });

  // 2. Send messages to populate database and test message pipeline
  console.log("\n--- Testing Message Pipeline ---");
  for (let i = 1; i <= 6; i++) {
    try {
      // We will trigger socket send message via a direct test or using http.
      // Wait, there is no HTTP endpoint for send_message, only Socket.IO send_message.
      // But we can check file upload via HTTP POST.
      console.log(`Sending message ${i} via HTTP isn't direct, but we can verify file upload.`);
    } catch (error) {
      console.error(`✖ Message ${i} failed:`, error.response?.data || error.message);
    }
  }

  // 3. Test File Upload
  console.log("\n--- Testing File Upload ---");
  try {
    const testFilePath = path.join(__dirname, "test_upload_file.txt");
    fs.writeFileSync(testFilePath, "Hello world, this is a test file for secure file upload simulation!");

    const FormData = require("form-data");
    const form = new FormData();
    form.append("file", fs.createReadStream(testFilePath));
    form.append("receiver", "device2");

    const uploadRes = await client.post("/messages/upload", form, {
      headers: form.getHeaders()
    });

    console.log("✔ File Upload response status:", uploadRes.status);
    console.log("✔ File Upload response data:", JSON.stringify(uploadRes.data, null, 2));

    // clean up test file
    fs.unlinkSync(testFilePath);
  } catch (error) {
    console.error("✖ File Upload failed:", error.response?.data || error.message);
    if (error.response?.data?.error) {
      console.error("Error details:", error.response.data.error);
    }
  }
}

runTests();
