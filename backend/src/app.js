require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const db = require('./models');

const chatRoutes = require('./routes/chat.routes');
const quizRoutes = require('./routes/quiz.routes');
const earthquakeRoutes = require('./routes/earthquake.routes');
const userRoutes = require('./routes/user.routes');
const knowledgeRoutes = require('./routes/knowledge.routes');

const app = express();
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 静态文件服务 — 前端页面通过 localhost:5000 访问
app.use('/frontend', express.static(path.join(__dirname, '..', '..', 'frontend')));

app.get('/', (req, res) => {
  res.redirect('/frontend/public/index.html');
});

app.use('/api/chat', chatRoutes);
app.use('/api/quiz', quizRoutes);
app.use('/api/earthquake', earthquakeRoutes);
app.use('/api/user', userRoutes);
app.use('/api/knowledge', knowledgeRoutes);

app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: '济小震后端服务运行正常',
    timestamp: new Date().toISOString(),
    services: ['chat', 'quiz', 'earthquake', 'user', 'knowledge']
  });
});

async function startServer() {
  // 尝试连接 MySQL（如果未配置则跳过，不影响 Supabase 功能）
  try {
    await db.sequelize.authenticate();
    console.log('✅ MySQL 数据库连接成功');
    await db.sequelize.sync({ force: false });
    console.log('✅ MySQL 数据库表同步完成');
  } catch (error) {
    console.warn('⚠️  MySQL 未连接，本地数据库功能不可用:', error.message);
    console.warn('⚠️  Supabase 用户认证和数据服务不受影响');
  }

  app.listen(port, () => {
    console.log(`🚀 济小震后端服务已启动，运行在 http://localhost:${port}`);
    console.log(`📡 已注册服务: /api/chat, /api/quiz, /api/earthquake, /api/user, /api/knowledge`);
  });
}

startServer();