require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });

const mysql = require('mysql2/promise');

async function initDatabase() {
  const { DB_HOST, DB_PORT, DB_USER, DB_PASSWORD, DB_NAME } = process.env;
  
  try {
    console.log('📦 正在连接MySQL服务器...');
    const connection = await mysql.createConnection({
      host: DB_HOST,
      port: parseInt(DB_PORT),
      user: DB_USER,
      password: DB_PASSWORD
    });

    console.log('✅ MySQL服务器连接成功');
    
    await connection.execute(`CREATE DATABASE IF NOT EXISTS ${DB_NAME} CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
    console.log(`✅ 数据库 ${DB_NAME} 创建成功`);
    
    await connection.end();
    console.log('🔌 数据库连接已关闭');
    
    console.log('\n📋 接下来运行:');
    console.log('   node src/config/init-knowledge.js');
    
  } catch (error) {
    console.error('❌ 数据库初始化失败:', error.message);
    process.exit(1);
  }
}

initDatabase();