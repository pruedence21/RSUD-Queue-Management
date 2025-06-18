const axios = require('axios');

const API_BASE = 'http://localhost:3000/api';
let authToken = '';
let createdUserId = null;

// Test credentials
const adminCredentials = {
  username: 'admin',
  password: 'Admin123!'
};

const testUserData = {
  username: 'testuser',
  password: 'TestUser123!',
  nama_lengkap: 'Test User',
  role: 'petugas',
  aktif: true
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
 * Test create user
 */
async function testCreateUser() {
  try {
    console.log('\n📝 Testing create user...');
    
    const response = await apiCall('POST', '/users', testUserData);
    
    if (response.data.status === 'success') {
      console.log('✅ Create user successful');
      console.log(`📋 Created user:`, response.data.data.user);
      createdUserId = response.data.data.user.id;
      return response.data.data.user;
    }
    
    console.log('❌ Create user failed');
    return null;
  } catch (error) {
    console.log('❌ Create user error:', error.response?.data || error.message);
    return null;
  }
}

/**
 * Test get all users
 */
async function testGetAllUsers() {
  try {
    console.log('\n📋 Testing get all users...');
    
    const response = await apiCall('GET', '/users');
    
    if (response.data.status === 'success') {
      console.log('✅ Get all users successful');
      console.log(`📊 Found ${response.data.pagination.totalItems} user(s)`);
      console.log(`📄 Pagination:`, response.data.pagination);
      return response.data.data;
    }
    
    console.log('❌ Get all users failed');
    return [];
  } catch (error) {
    console.log('❌ Get all users error:', error.response?.data || error.message);
    return [];
  }
}

/**
 * Test get user by ID
 */
async function testGetUserById(userId) {
  try {
    console.log(`\n👤 Testing get user by ID: ${userId}...`);
    
    const response = await apiCall('GET', `/users/${userId}`);
    
    if (response.data.status === 'success') {
      console.log('✅ Get user by ID successful');
      console.log(`📋 User data:`, response.data.data.user);
      return response.data.data.user;
    }
    
    console.log('❌ Get user by ID failed');
    return null;
  } catch (error) {
    console.log('❌ Get user by ID error:', error.response?.data || error.message);
    return null;
  }
}

/**
 * Test update user
 */
async function testUpdateUser(userId) {
  try {
    console.log(`\n✏️ Testing update user: ${userId}...`);
    
    const updateData = {
      nama_lengkap: 'Test User Updated',
      aktif: false
    };
    
    const response = await apiCall('PUT', `/users/${userId}`, updateData);
    
    if (response.data.status === 'success') {
      console.log('✅ Update user successful');
      console.log(`📋 Updated user:`, response.data.data.user);
      return response.data.data.user;
    }
    
    console.log('❌ Update user failed');
    return null;
  } catch (error) {
    console.log('❌ Update user error:', error.response?.data || error.message);
    return null;
  }
}

/**
 * Test toggle user status
 */
async function testToggleUserStatus(userId) {
  try {
    console.log(`\n🔄 Testing toggle user status: ${userId}...`);
    
    const response = await apiCall('PATCH', `/users/${userId}/toggle-status`);
    
    if (response.data.status === 'success') {
      console.log('✅ Toggle user status successful');
      console.log(`📋 Updated user:`, response.data.data.user);
      return response.data.data.user;
    }
    
    console.log('❌ Toggle user status failed');
    return null;
  } catch (error) {
    console.log('❌ Toggle user status error:', error.response?.data || error.message);
    return null;
  }
}

/**
 * Test reset user password
 */
async function testResetUserPassword(userId) {
  try {
    console.log(`\n🔑 Testing reset user password: ${userId}...`);
    
    const resetData = {
      newPassword: 'NewTestPassword123!',
      confirmPassword: 'NewTestPassword123!'
    };
    
    const response = await apiCall('PATCH', `/users/${userId}/reset-password`, resetData);
    
    if (response.data.status === 'success') {
      console.log('✅ Reset user password successful');
      console.log(`📋 Message:`, response.data.message);
      return true;
    }
    
    console.log('❌ Reset user password failed');
    return false;
  } catch (error) {
    console.log('❌ Reset user password error:', error.response?.data || error.message);
    return false;
  }
}

/**
 * Test get user statistics
 */
async function testGetUserStatistics() {
  try {
    console.log('\n📊 Testing get user statistics...');
    
    const response = await apiCall('GET', '/users/statistics');
    
    if (response.data.status === 'success') {
      console.log('✅ Get user statistics successful');
      console.log(`📊 Statistics:`, response.data.data.statistics);
      return response.data.data.statistics;
    }
    
    console.log('❌ Get user statistics failed');
    return null;
  } catch (error) {
    console.log('❌ Get user statistics error:', error.response?.data || error.message);
    return null;
  }
}

/**
 * Test delete user
 */
async function testDeleteUser(userId) {
  try {
    console.log(`\n🗑️ Testing delete user: ${userId}...`);
    
    const response = await apiCall('DELETE', `/users/${userId}`);
    
    if (response.data.status === 'success') {
      console.log('✅ Delete user successful');
      console.log(`📋 Message:`, response.data.message);
      return true;
    }
    
    console.log('❌ Delete user failed');
    return false;
  } catch (error) {
    console.log('❌ Delete user error:', error.response?.data || error.message);
    return false;
  }
}

/**
 * Main test function
 */
async function runTests() {
  console.log('🧪 Starting User API Tests...\n');
  
  // Test authentication
  const authSuccess = await testAuth();
  if (!authSuccess) {
    console.log('❌ Cannot proceed without authentication');
    return;
  }
  
  // Test create user
  const createdUser = await testCreateUser();
  if (!createdUser) {
    console.log('❌ Cannot proceed without creating user');
    return;
  }
  
  // Test get all users
  await testGetAllUsers();
  
  // Test get user by ID
  await testGetUserById(createdUserId);
  
  // Test update user
  await testUpdateUser(createdUserId);
  
  // Test toggle user status
  await testToggleUserStatus(createdUserId); // Deactivate
  await testToggleUserStatus(createdUserId); // Reactivate
  
  // Test reset user password
  await testResetUserPassword(createdUserId);
  
  // Test get user statistics
  await testGetUserStatistics();
  
  // Test delete user
  await testDeleteUser(createdUserId);
  
  console.log('\n🎉 All user API tests completed!');
}

// Run the tests
runTests().catch(error => {
  console.error('💥 Test runner error:', error.message);
});