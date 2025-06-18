const axios = require('axios');

const API_BASE = 'http://localhost:3000/api';
let authToken = '';

// Test credentials
const adminCredentials = {
  username: 'admin',
  password: 'Admin123!'
};

/**
 * Test authentication
 */
async function testAuth() {
  try {
    console.log('🔐 Testing authentication...');
    
    const response = await axios.post(`${API_BASE}/auth/login`, adminCredentials);
    
    if (response.data.status === 'success') {
      authToken = response.data.data.token;
      console.log('✅ Authentication successful');
      console.log(`📝 Token: ${authToken.substring(0, 50)}...`);
      return true;
    }
    
    console.log('❌ Authentication failed');
    return false;
  } catch (error) {
    console.log('❌ Authentication error:', error.response?.data || error.message);
    return false;
  }
}

/**
 * Test API with authorization header
 */
async function apiCall(method, endpoint, data = null) {
  const config = {
    method,
    url: `${API_BASE}${endpoint}`,
    headers: {
      'Authorization': `Bearer ${authToken}`,
      'Content-Type': 'application/json'
    }
  };
  
  if (data) {
    config.data = data;
  }
  
  return await axios(config);
}

/**
 * Test get all settings
 */
async function testGetAllSettings() {
  try {
    console.log('\n📋 Testing get all settings...');
    
    const response = await apiCall('GET', '/settings');
    
    if (response.data.status === 'success') {
      console.log('✅ Get all settings successful');
      console.log(`📊 Found ${response.data.data.settings.length} setting(s)`);
      console.log(`📋 Settings:`, response.data.data.settings);
      return response.data.data.settings;
    }
    
    console.log('❌ Get all settings failed');
    return [];
  } catch (error) {
    console.log('❌ Get all settings error:', error.response?.data || error.message);
    return [];
  }
}

/**
 * Test get setting by key
 */
async function testGetSettingByKey(key) {
  try {
    console.log(`\n🔍 Testing get setting by key: ${key}...`);
    
    const response = await apiCall('GET', `/settings/${key}`);
    
    if (response.data.status === 'success') {
      console.log('✅ Get setting by key successful');
      console.log(`📋 Setting data:`, response.data.data.setting);
      return response.data.data.setting;
    }
    
    console.log('❌ Get setting by key failed');
    return null;
  } catch (error) {
    console.log('❌ Get setting by key error:', error.response?.data || error.message);
    return null;
  }
}

/**
 * Test update setting
 */
async function testUpdateSetting(key, value, description = null) {
  try {
    console.log(`\n✏️ Testing update setting: ${key}...`);
    
    const updateData = {
      value_setting: value,
      deskripsi: description
    };
    
    const response = await apiCall('PUT', `/settings/${key}`, updateData);
    
    if (response.data.status === 'success') {
      console.log('✅ Update setting successful');
      console.log(`📋 Updated setting:`, response.data.data.setting);
      return response.data.data.setting;
    }
    
    console.log('❌ Update setting failed');
    return null;
  } catch (error) {
    console.log('❌ Update setting error:', error.response?.data || error.message);
    return null;
  }
}

/**
 * Test batch update settings
 */
async function testBatchUpdateSettings(settingsArray) {
  try {
    console.log('\n🔄 Testing batch update settings...');
    
    const response = await apiCall('POST', '/settings/batch', settingsArray);
    
    if (response.data.status === 'success') {
      console.log('✅ Batch update settings successful');
      console.log(`📋 Updated settings:`, response.data.data.settings);
      return response.data.data.settings;
    }
    
    console.log('❌ Batch update settings failed');
    return null;
  } catch (error) {
    console.log('❌ Batch update settings error:', error.response?.data || error.message);
    return null;
  }
}

/**
 * Main test function
 */
async function runTests() {
  console.log('🧪 Starting Settings API Tests...\n');
  
  // Test authentication
  const authSuccess = await testAuth();
  if (!authSuccess) {
    console.log('❌ Cannot proceed without authentication');
    return;
  }
  
  // Test get all settings
  await testGetAllSettings();

  // Create new settings
  console.log('\nCreating new test settings...');
  const newSettings = [
    { key_setting: 'test_setting_1', value_setting: 'initial_value', deskripsi: 'This is a test setting' },
    { key_setting: 'test_setting_2', value_setting: 123, deskripsi: 'Another test setting' },
    { key_setting: 'test_setting_3', value_setting: true, deskripsi: 'Boolean test setting' },
    { key_setting: 'test_setting_4', value_setting: { "a": 1, "b": "hello" }, deskripsi: 'Object test setting' }
  ];

  for (const setting of newSettings) {
    try {
      await apiCall('POST', '/settings', setting);
      console.log(`✅ Setting '${setting.key_setting}' created.`);
    } catch (error) {
      if (error.response && error.response.status === 409) {
        console.log(`⚠️ Setting '${setting.key_setting}' already exists, skipping creation.`);
      } else {
        console.error(`❌ Failed to create setting '${setting.key_setting}':`, error.response?.data || error.message);
      }
    }
  }
  console.log('New test settings creation attempt completed.');
  
  // Test get all settings again
  const allSettings = await testGetAllSettings();
  
  // Test get setting by key
  if (allSettings.length > 0) {
    await testGetSettingByKey(allSettings[0].key_setting);
  }
  
  // Test update setting
  await testUpdateSetting('test_setting_1', 'updated_value', 'Updated description');
  await testUpdateSetting('test_setting_2', 456);
  await testUpdateSetting('test_setting_3', false);
  await testUpdateSetting('test_setting_4', { "c": 3, "d": "world" });

  // Test batch update settings
  await testBatchUpdateSettings([
    { key_setting: 'test_setting_1', value_setting: 'batch_updated_value' },
    { key_setting: 'test_setting_2', value_setting: 789, deskripsi: 'Batch updated description' }
  ]);

  console.log('\n🎉 All settings API tests completed!');
}

// Run the tests
runTests().catch(error => {
  console.error('💥 Test runner error:', error.message);
});