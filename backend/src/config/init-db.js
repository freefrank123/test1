const db = require('../models');
const quizData = require('../services/quiz.service').quizData;

async function initDatabase() {
  try {
    await db.sequelize.authenticate();
    console.log('✅ 数据库连接成功');

    await db.sequelize.sync({ force: false });
    console.log('✅ 数据库表同步完成');

    const quizCount = await db.Quiz.count();
    if (quizCount === 0) {
      await db.Quiz.bulkCreate(quizData.map(item => ({
        title: item.title,
        options: item.options,
        answer: item.answer,
        explanation: item.explanation,
        category: 'earthquake'
      })));
      console.log('✅ 初始题库数据已导入');
    } else {
      console.log(`ℹ️ 已有 ${quizCount} 条题库数据`);
    }

    console.log('🎉 数据库初始化完成');
    process.exit(0);
  } catch (error) {
    console.error('❌ 数据库初始化失败:', error);
    process.exit(1);
  }
}

initDatabase();