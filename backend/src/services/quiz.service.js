const quizData = [
  {
    id: 1,
    title: '地震发生时优先躲在哪里？',
    options: ['阳台', '桌子下', '电梯'],
    answer: 1,
    explanation: '地震发生时，应躲在坚固的桌子或家具下方，保护头部免受掉落物伤害。阳台和电梯都是危险区域。'
  },
  {
    id: 2,
    title: '高楼遇到地震应该？',
    options: ['跳楼', '走楼梯', '躲承重墙根'],
    answer: 2,
    explanation: '高楼遇到地震时，应躲在承重墙根或小开间内，等待地震结束后再有序撤离。切勿跳楼或使用电梯。'
  },
  {
    id: 3,
    title: '地震后被困首先要？',
    options: ['大声呼喊', '保持体力', '到处乱挖'],
    answer: 1,
    explanation: '地震后被困时，应保持体力，避免过度消耗。可以通过敲击墙壁等方式发出求救信号。'
  },
  {
    id: 4,
    title: '地震时在公共场所应该？',
    options: ['向出口拥挤', '就地躲避', '奔跑逃离'],
    answer: 1,
    explanation: '在公共场所遇到地震，应就地寻找安全位置躲避，待地震结束后听从工作人员指挥有序撤离。'
  },
  {
    id: 5,
    title: '地震发生后，下列哪种做法是正确的？',
    options: ['立即返回建筑物内取财物', '远离建筑物和危险物品', '使用电梯逃生'],
    answer: 1,
    explanation: '地震发生后，应远离建筑物和危险物品，避免余震造成二次伤害。切勿返回建筑或使用电梯。'
  },
  {
    id: 6,
    title: '地震的纵波和横波哪个先到达？',
    options: ['纵波', '横波', '同时到达'],
    answer: 0,
    explanation: '纵波（P波）速度较快，会先到达地表，引起上下震动；横波（S波）随后到达，引起水平摇晃。'
  },
  {
    id: 7,
    title: '地震预警系统可以提前多久预警？',
    options: ['几秒到几十秒', '几分钟', '几小时'],
    answer: 0,
    explanation: '地震预警系统利用电磁波比地震波传播快的原理，可提前几秒到几十秒发出预警。'
  },
  {
    id: 8,
    title: '地震发生时，在行驶的汽车内应该？',
    options: ['立即停车并下车', '加速行驶离开', '靠边停车并留在车内'],
    answer: 2,
    explanation: '在行驶的汽车内遇到地震，应立即靠边停车开启双闪，留在车内等待地震结束后再继续行驶。'
  },
  {
    id: 9,
    title: '家庭应急包应包含哪些物品？',
    options: ['零食和玩具', '水、食物、急救药品', '贵重物品'],
    answer: 1,
    explanation: '家庭应急包应包含水、非易腐食品、手电筒、急救药品、备用电池等生存必需品。'
  },
  {
    id: 10,
    title: '地震时，下列哪种做法是错误的？',
    options: ['护住头部', '远离窗户', '靠近玻璃幕墙'],
    answer: 2,
    explanation: '地震时应远离玻璃幕墙、窗户等易破碎的物体，选择坚固的遮挡物保护自己。'
  },
  {
    id: 11,
    title: '地震发生后，燃气泄漏应该怎么办？',
    options: ['点燃火柴检查', '关闭气源并开窗通风', '继续使用电器'],
    answer: 1,
    explanation: '发现燃气泄漏时，应立即关闭气源阀门，打开门窗通风，切勿使用明火或电器开关。'
  },
  {
    id: 12,
    title: '学校遇到地震时应该？',
    options: ['不听指挥乱跑', '听从老师安排有序疏散', '躲在楼道里'],
    answer: 1,
    explanation: '学校遇到地震时，应听从老师指挥，按照演练路线有序疏散到安全场地。'
  }
];

class QuizService {
  async getQuizList(limit = 10, shuffle = false) {
    let list = [...quizData];
    
    if (shuffle) {
      list = list.sort(() => Math.random() - 0.5);
    }
    
    return list.slice(0, limit);
  }

  async checkAnswer(quizId, userAnswer) {
    const quiz = quizData.find(q => q.id === parseInt(quizId));
    
    if (!quiz) {
      throw new Error('题目不存在');
    }
    
    const correct = parseInt(userAnswer) === quiz.answer;
    
    return {
      correct,
      correctAnswer: quiz.answer,
      explanation: quiz.explanation
    };
  }

  async getRandomQuiz() {
    const index = Math.floor(Math.random() * quizData.length);
    return quizData[index];
  }

  async getQuizById(id) {
    return quizData.find(q => q.id === parseInt(id));
  }
}

module.exports = new QuizService();