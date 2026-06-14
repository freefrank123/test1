// 济小震 - 部署检查脚本
const http = require('http');

console.log('🧐 济小震部署检查工具\n');

// 检查后端服务是否运行
function checkBackend() {
  return new Promise((resolve) => {
    const options = {
      hostname: 'localhost',
      port: 5000,
      path: '/api/health',
      method: 'GET'
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        if (res.statusCode === 200) {
          console.log('✅ 后端服务运行正常');
          try {
            const json = JSON.parse(data);
            console.log('   服务列表:', json.services.join(', '));
          } catch (e) {}
          resolve(true);
        } else {
          console.log('❌ 后端服务响应异常，状态码:', res.statusCode);
          resolve(false);
        }
      });
    });

    req.on('error', (e) => {
      console.log('❌ 无法连接到后端服务:', e.message);
      console.log('   请确保后端服务已启动: cd backend && npm start');
      resolve(false);
    });

    req.setTimeout(3000, () => {
      req.destroy();
      console.log('❌ 连接超时');
      resolve(false);
    });

    req.end();
  });
}

// 检查前端文件
function checkFrontendFiles() {
  const fs = require('fs');
  const path = require('path');
  
  console.log('\n📁 检查前端文件...');
  
  const requiredFiles = [
    path.join(__dirname, 'frontend', 'public', 'index.html'),
    path.join(__dirname, 'frontend', 'assets', 'js', 'api.js'),
    path.join(__dirname, 'frontend', 'assets', 'js', 'user.js'),
    path.join(__dirname, 'frontend', 'assets', 'js', 'config.js'),
  ];
  
  let allExist = true;
  requiredFiles.forEach(file => {
    if (fs.existsSync(file)) {
      console.log(`   ✅ ${path.relative(__dirname, file)}`);
    } else {
      console.log(`   ❌ ${path.relative(__dirname, file)} (缺失)`);
      allExist = false;
    }
  });
  
  return allExist;
}

// 检查 user.js 配置
function checkUserJsConfig() {
  const fs = require('fs');
  const path = require('path');
  
  console.log('\n🔧 检查 API 配置...');
  
  const userJsPath = path.join(__dirname, 'frontend', 'assets', 'js', 'user.js');
  
  if (fs.existsSync(userJsPath)) {
    const content = fs.readFileSync(userJsPath, 'utf8');
    if (content.includes("'http://localhost:5000/api'")) {
      console.log('   ❌ user.js 中仍包含硬编码的 localhost 地址');
      return false;
    } else if (content.includes("window.JiXiaoZhen?.apiBaseUrl || '/api'")) {
      console.log('   ✅ user.js 配置正确（使用相对路径）');
      return true;
    }
  }
  return false;
}

// 主函数
async function main() {
  console.log('=' .repeat(50));
  
  const backendOk = await checkBackend();
  const filesOk = checkFrontendFiles();
  const configOk = checkUserJsConfig();
  
  console.log('\n' + '='.repeat(50));
  
  if (backendOk && filesOk && configOk) {
    console.log('🎉 所有检查通过！项目部署正常');
    console.log('\n📖 访问地址:');
    console.log('   首页: http://localhost:5000');
    console.log('   API健康检查: http://localhost:5000/api/health');
  } else {
    console.log('⚠️ 存在问题，请检查上述错误信息');
    console.log('\n📖 详细部署指南请查看: DEPLOYMENT.md');
  }
}

main();