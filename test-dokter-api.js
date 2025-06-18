const axios = require('axios');

const API_BASE = 'http://localhost:3000/api';
let authToken = '';

// Test credentials
const testCredentials = {
  username: 'admin',
  password: 'Admin123!'
};

// Test dokter data
const testDokter = {
  nama_dokter: 'Dr. Ahmad Setiawan',
  spesialisasi: 'Dokter Umum',
  poli_id: 1,
  aktif: true
};

/**
 * Test authentication
 */
async function testAuth() {
  try {
    console.log('🔐 Testing authentication...');
    
    const response = await axios.post(`${API_BASE}/auth/login`, testCredentials);
    
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
 * Test create dokter
 */
async function testCreateDokter() {
  try {
    console.log('\n📝 Testing create dokter...');
    
    const response = await apiCall('POST', '/dokter', testDokter);
    
    if (response.data.status === 'success') {
      console.log('✅ Create dokter successful');
      console.log(`📋 Created dokter:`, response.data.data.dokter);
      return response.data.data.dokter;
    }
    
    console.log('❌ Create dokter failed');
    return null;
  } catch (error) {
    console.log('❌ Create dokter error:', error.response?.data || error.message);
    return null;
  }
}

/**
 * Test get all dokter
 */
async function testGetAllDokter() {
  try {
    console.log('\n📋 Testing get all dokter...');
    
    const response = await apiCall('GET', '/dokter');
    
    if (response.data.status === 'success') {
      console.log('✅ Get all dokter successful');
      console.log(`📊 Found ${response.data.data.length} dokter(s)`);
      console.log(`📄 Pagination:`, response.data.pagination);
      return response.data.data;
    }
    
    console.log('❌ Get all dokter failed');
    return [];
  } catch (error) {
    console.log('❌ Get all dokter error:', error.response?.data || error.message);
    return [];
  }
}

/**
 * Test get dokter by ID
 */
async function testGetDokterById(dokterId) {
  try {
    console.log(`\n👤 Testing get dokter by ID: ${dokterId}...`);
    
    const response = await apiCall('GET', `/dokter/${dokterId}?with_poli=true`);
    
    if (response.data.status === 'success') {
      console.log('✅ Get dokter by ID successful');
      console.log(`📋 Dokter data:`, response.data.data.dokter);
      return response.data.data.dokter;
    }
    
    console.log('❌ Get dokter by ID failed');
    return null;
  } catch (error) {
    console.log('❌ Get dokter by ID error:', error.response?.data || error.message);
    return null;
  }
}

/**
 * Test update dokter
 */
async function testUpdateDokter(dokterId) {
  try {
    console.log(`\n✏️ Testing update dokter: ${dokterId}...`);
    
    const updateData = {
      nama_dokter: 'Dr. Ahmad Setiawan, Sp.PD',
      spesialisasi: 'Spesialis Penyakit Dalam'
    };
    
    const response = await apiCall('PUT', `/dokter/${dokterId}`, updateData);
    
    if (response.data.status === 'success') {
      console.log('✅ Update dokter successful');
      console.log(`📋 Updated dokter:`, response.data.data.dokter);
      return response.data.data.dokter;
    }
    
    console.log('❌ Update dokter failed');
    return null;
  } catch (error) {
    console.log('❌ Update dokter error:', error.response?.data || error.message);
    return null;
  }
}

/**
 * Test search dokter
 */
async function testSearchDokter() {
  try {
    console.log('\n🔍 Testing search dokter...');
    
    const response = await apiCall('GET', '/dokter/search?q=Ahmad&active_only=true');
    
    if (response.data.status === 'success') {
      console.log('✅ Search dokter successful');
      console.log(`📊 Found ${response.data.data.total} result(s)`);
      console.log(`📋 Results:`, response.data.data.results);
      return response.data.data.results;
    }
    
    console.log('❌ Search dokter failed');
    return [];
  } catch (error) {
    console.log('❌ Search dokter error:', error.response?.data || error.message);
    return [];
  }
}

/**
 * Test get dokter by poli
 */
async function testGetDokterByPoli() {
  try {
    console.log('\n🏥 Testing get dokter by poli...');
    
    const response = await apiCall('GET', '/dokter/by-poli/1?active_only=true');
    
    if (response.data.status === 'success') {
      console.log('✅ Get dokter by poli successful');
      console.log(`📊 Found ${response.data.data.dokter.length} dokter(s) in poli`);
      console.log(`📋 Dokter:`, response.data.data.dokter);
      return response.data.data.dokter;
    }
    
    console.log('❌ Get dokter by poli failed');
    return [];
  } catch (error) {
    console.log('❌ Get dokter by poli error:', error.response?.data || error.message);
    return [];
  }
}

/**
 * Test get dokter statistics
 */
async function testGetDokterStatistics() {
  try {
    console.log('\n📊 Testing get dokter statistics...');
    
    const response = await apiCall('GET', '/dokter/statistics');
    
    if (response.data.status === 'success') {
      console.log('✅ Get dokter statistics successful');
      console.log(`📊 Statistics:`, response.data.data.statistics);
      return response.data.data.statistics;
    }
    
    console.log('❌ Get dokter statistics failed');
    return null;
  } catch (error) {
    console.log('❌ Get dokter statistics error:', error.response?.data || error.message);
    return null;
  }
}

/**
 * Test toggle dokter status
 */
async function testToggleDokterStatus(dokterId) {
  try {
    console.log(`\n🔄 Testing toggle dokter status: ${dokterId}...`);
    
    const response = await apiCall('PATCH', `/dokter/${dokterId}/toggle-status`);
    
    if (response.data.status === 'success') {
      console.log('✅ Toggle dokter status successful');
      console.log(`📋 Updated dokter:`, response.data.data.dokter);
      return response.data.data.dokter;
    }
    
    console.log('❌ Toggle dokter status failed');
    return null;
  } catch (error) {
    console.log('❌ Toggle dokter status error:', error.response?.data || error.message);
    return null;
  }
}

/**
 * Test check can delete
 */
async function testCheckCanDelete(dokterId) {
  try {
    console.log(`\n🗑️ Testing check can delete: ${dokterId}...`);
    
    const response = await apiCall('GET', `/dokter/${dokterId}/can-delete`);
    
    if (response.data.status === 'success') {
      console.log('✅ Check can delete successful');
      console.log(`📋 Can delete:`, response.data.data.canDelete);
      console.log(`📋 Message:`, response.data.data.message);
      return response.data.data.canDelete;
    }
    
    console.log('❌ Check can delete failed');
    return false;
  } catch (error) {
    console.log('❌ Check can delete error:', error.response?.data || error.message);
    return false;
  }
}

/**
 * Test delete dokter
 */
async function testDeleteDokter(dokterId) {
  try {
    console.log(`\n🗑️ Testing delete dokter: ${dokterId}...`);
    
    const response = await apiCall('DELETE', `/dokter/${dokterId}`);
    
    if (response.data.status === 'success') {
      console.log('✅ Delete dokter successful');
      console.log(`📋 Message:`, response.data.message);
      return true;
    }
    
    console.log('❌ Delete dokter failed');
    return false;
  } catch (error) {
    console.log('❌ Delete dokter error:', error.response?.data || error.message);
    return false;
  }
}

/**
 * Main test function
 */
async function runTests() {
  console.log('🧪 Starting Dokter API Tests...\n');
  
  // Test authentication
  const authSuccess = await testAuth();
  if (!authSuccess) {
    console.log('❌ Cannot proceed without authentication');
    return;
  }
  
  // Test create dokter
  const createdDokter = await testCreateDokter();
  if (!createdDokter) {
    console.log('❌ Cannot proceed without creating dokter');
    return;
  }
  
  const dokterId = createdDokter.id;
  
  // Test get all dokter
  await testGetAllDokter();
  
  // Test get dokter by ID
  await testGetDokterById(dokterId);
  
  // Test update dokter
  await testUpdateDokter(dokterId);
  
  // Test search dokter
  await testSearchDokter();
  
  // Test get dokter by poli
  await testGetDokterByPoli();
  
  // Test get dokter statistics
  await testGetDokterStatistics();
  
  // Test toggle status
  await testToggleDokterStatus(dokterId);
  
  // Test check can delete
  const canDelete = await testCheckCanDelete(dokterId);
  
  // Test delete dokter (only if can delete)
  if (canDelete) {
    await testDeleteDokter(dokterId);
  } else {
    console.log('⏭️ Skipping delete test (dokter cannot be deleted)');
  }
  
  console.log('\n🎉 All tests completed!');
}

// Run the tests
runTests().catch(error => {
  console.error('💥 Test runner error:', error.message);
});