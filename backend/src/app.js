require('dotenv').config();
const express = require('express');
const cors = require('cors');

const chatRoutes = require('./routes/chat.routes');

const app = express();
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/api', chatRoutes);

app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: '济小震后端服务运行正常',
    timestamp: new Date().toISOString()
  });
});

app.listen(port, () => {
  console.log(`🚀 济小震后端服务已启动，运行在 http://localhost:${port}`);
});