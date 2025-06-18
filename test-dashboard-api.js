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
    console.log('\n🔐 Testing authentication...');
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
    console.error('❌ Authentication error:', error.response?.data || error.message);
    return false;
  }
}

/**
 * Helper function to make API calls
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
  return axios(config);
}

/**
 * Test Get General Stats
 */
async function testGetGeneralStats() {
  try {
    console.log('\n📊 Testing Get General Stats (/api/dashboard/stats)...');
    const response = await apiCall('GET', '/dashboard/stats');
    if (response.data.status === 'success' && response.data.data.statistics) {
      console.log('✅ Get General Stats successful');
      console.log('📋 Statistics:', response.data.data.statistics);
      if (response.data.data.statistics.totalPoli !== undefined && 
          response.data.data.statistics.totalDokter !== undefined &&
          response.data.data.statistics.totalUser !== undefined) {
        console.log('✅ Basic statistics (totalPoli, totalDokter, totalUser) are present.');
      } else {
        console.warn('⚠️ Basic statistics (totalPoli, totalDokter, totalUser) might be missing or undefined.');
      }
    } else {
      console.error('❌ Get General Stats failed:', response.data);
    }
  } catch (error) {
    console.error('❌ Error in Get General Stats:', error.response?.data || error.message);
  }
}

/**
 * Test Get Antrian Today Stats
 */
async function testGetAntrianTodayStats() {
  try {
    console.log('\n📅 Testing Get Antrian Today Stats (/api/dashboard/antrian-today)...');
    const response = await apiCall('GET', '/dashboard/antrian-today');
    if (response.data.status === 'success' && response.data.data && response.data.data.stats) {
      console.log('✅ Get Antrian Today Stats successful');
      const stats = response.data.data.stats;
      console.log('📋 Statistics for Today:', stats);

      // Validate basic structure
      if (typeof stats.totalAntrian === 'number' &&
          typeof stats.antrianSelesai === 'number' &&
          typeof stats.antrianMenunggu === 'number' &&
          Array.isArray(stats.antrianPerPoli)) {
        console.log('✅ Basic stats structure (totalAntrian, antrianSelesai, antrianMenunggu, antrianPerPoli) is correct.');

        // Validate antrianPerPoli structure if not empty
        if (stats.antrianPerPoli.length > 0) {
          const firstPoliStat = stats.antrianPerPoli[0];
          if (firstPoliStat.poli_id !== undefined &&
              firstPoliStat.nama_poli !== undefined &&
              firstPoliStat.kode_poli !== undefined &&
              typeof firstPoliStat.jumlah_antrian === 'number') {
            console.log('✅ Structure of antrianPerPoli elements is correct.');
          } else {
            console.warn('⚠️ Structure of antrianPerPoli elements might be incorrect or missing fields.');
          }
        } else {
          console.log('ℹ️ antrianPerPoli is empty, skipping element structure check.');
        }
      } else {
        console.error('❌ Basic stats structure is incorrect or missing fields.');
      }
      if (!response.data.data.lastUpdated) {
        console.warn('⚠️ lastUpdated field is missing in the response data.');
      }

    } else {
      console.error('❌ Get Antrian Today Stats failed or data format is incorrect:', response.data);
    }
  } catch (error) {
    console.error('❌ Error in Get Antrian Today Stats:', error.response?.data || error.message);
  }
}

/**
 * Test Get Antrian Week Stats
 */
async function testGetAntrianWeekStats() {
  try {
    console.log('\n🗓️ Testing Get Antrian Week Stats (/api/dashboard/antrian-week)...');
    const response = await apiCall('GET', '/dashboard/antrian-week');
    if (response.data.status === 'success') {
      console.log('✅ Get Antrian Week Stats endpoint reached successfully.');
      console.log('📋 Response:', response.data);
      if (response.data.message && response.data.message.includes('Not yet implemented')) {
        console.log('✅ Placeholder message confirmed (as expected for now).');
      }
    } else {
      console.error('❌ Get Antrian Week Stats failed:', response.data);
    }
  } catch (error) {
    console.error('❌ Error in Get Antrian Week Stats:', error.response?.data || error.message);
  }
}

/**
 * Test Get Activity Log
 */
async function testGetActivityLog() {
  try {
    console.log('\n📜 Testing Get Activity Log (/api/dashboard/activity-log)...');
    const response = await apiCall('GET', '/dashboard/activity-log');
    if (response.data.status === 'success') {
      console.log('✅ Get Activity Log endpoint reached successfully.');
      console.log('📋 Response:', response.data);
      if (response.data.message && response.data.message.includes('Not yet implemented')) {
        console.log('✅ Placeholder message confirmed (as expected for now).');
      }
    } else {
      console.error('❌ Get Activity Log failed:', response.data);
    }
  } catch (error) {
    console.error('❌ Error in Get Activity Log:', error.response?.data || error.message);
  }
}

/**
 * Test Get System Alerts
 */
async function testGetSystemAlerts() {
  try {
    console.log('\n🚨 Testing Get System Alerts (/api/dashboard/alerts)...');
    const response = await apiCall('GET', '/dashboard/alerts');
    if (response.data.status === 'success') {
      console.log('✅ Get System Alerts endpoint reached successfully.');
      console.log('📋 Response:', response.data);
      if (response.data.message && response.data.message.includes('Not yet implemented')) {
        console.log('✅ Placeholder message confirmed (as expected for now).');
      }
    } else {
      console.error('❌ Get System Alerts failed:', response.data);
    }
  } catch (error) {
    console.error('❌ Error in Get System Alerts:', error.response?.data || error.message);
  }
}

/**
 * Test Get System Performance
 */
async function testGetSystemPerformance() {
  try {
    console.log('\n⚙️ Testing Get System Performance (/api/dashboard/performance)...');
    const response = await apiCall('GET', '/dashboard/performance');
    if (response.data.status === 'success') {
      console.log('✅ Get System Performance endpoint reached successfully.');
      console.log('📋 Response:', response.data);
      if (response.data.message && response.data.message.includes('Not yet implemented')) {
        console.log('✅ Placeholder message confirmed (as expected for now).');
      }
    } else {
      console.error('❌ Get System Performance failed:', response.data);
    }
  } catch (error) {
    console.error('❌ Error in Get System Performance:', error.response?.data || error.message);
  }
}

/**
 * Main test function
 */
async function runTests() {
  console.log('🧪 Starting Dashboard API Tests...');

  const authSuccess = await testAuth();
  if (!authSuccess) {
    console.error('❌ Cannot proceed with Dashboard API tests without authentication.');
    return;
  }

  await testGetGeneralStats();
  await testGetAntrianTodayStats();
  await testGetAntrianWeekStats();
  await testGetActivityLog();
  await testGetSystemAlerts();
  await testGetSystemPerformance();

  console.log('\n🎉 All Dashboard API tests completed!');
  console.log('📢 Remember: Most dashboard endpoints currently return placeholder data.');
  console.log('📢 Implement the logic in dashboardController.js and update tests accordingly.');
}

runTests().catch(error => {
  console.error('💥 Unhandled error in test runner:', error);
});
