require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Supabase 配置未设置，请在 .env 中配置 SUPABASE_URL 和 SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const initialQuizzes = [
  {
    title: '地震按成因主要分为哪几类？',
    options: ['构造地震、火山地震、塌陷地震、人工诱发地震', '浅源地震、中源地震、深源地震', '强震、中震、弱震', '天然地震、人工地震'],
    answer: 0,
    explanation: '根据成因，地震主要分为构造地震、火山地震、塌陷地震和人工诱发地震。构造地震是由于板块运动、断层错动引起的，约占全球地震总数的90%以上。',
    category: 'earthquake'
  },
  {
    title: '震级和烈度的区别是什么？',
    options: ['震级衡量能量大小，烈度衡量破坏程度', '震级衡量破坏程度，烈度衡量能量大小', '两者没有区别', '震级是主观的，烈度是客观的'],
    answer: 0,
    explanation: '震级是衡量地震释放能量大小的指标，通常用里氏震级表示，一次地震只有一个震级。烈度则是描述地震对地表及建筑物破坏程度的指标，同一地震在不同地区的烈度不同。',
    category: 'earthquake'
  },
  {
    title: '以下哪种地震波传播速度最快？',
    options: ['纵波(P波)', '横波(S波)', '面波', '瑞利波'],
    answer: 0,
    explanation: '纵波(P波)是地震发生时产生的一种体波，它的传播速度最快，可以在固体、液体和气体中传播，引起地面上下振动。',
    category: 'earthquake'
  },
  {
    title: '我国采用的地震烈度表最高是多少度？',
    options: ['12度', '10度', '8度', '15度'],
    answer: 0,
    explanation: '我国采用12度烈度表，烈度越高表示破坏越严重。12度烈度对应的是毁灭性的破坏。',
    category: 'earthquake'
  },
  {
    title: '建筑抗震设计的基本原则是什么？',
    options: ['小震不坏、中震可修、大震不倒', '越坚固越好', '越高越好', '越轻越好'],
    answer: 0,
    explanation: '建筑抗震设计的基本原则是"小震不坏、中震可修、大震不倒"。这意味着在小地震下建筑应保持完好，中等地震下可以修复，大地震下不致倒塌。',
    category: 'earthquake'
  },
  {
    title: '地震发生时，在室内应该怎么做？',
    options: ['躲在坚固家具下', '立即跳楼逃生', '乘坐电梯逃生', '跑到阳台呼救'],
    answer: 0,
    explanation: '地震发生时，在室内应迅速躲在坚固的家具下或墙角，保护好头部。切勿跳楼或乘坐电梯。',
    category: 'earthquake'
  },
  {
    title: '减隔震技术的主要作用是什么？',
    options: ['减少地震能量传递', '增加建筑高度', '美化建筑外观', '降低建筑成本'],
    answer: 0,
    explanation: '减隔震技术通过在建筑底部设置隔震层或阻尼器，延长建筑周期，减少地震能量传递，从而提高建筑的抗震性能。',
    category: 'earthquake'
  },
  {
    title: '以下哪种属于人工诱发地震？',
    options: ['水库蓄水引起的地震', '板块运动引起的地震', '火山活动引起的地震', '地下溶洞塌陷引起的地震'],
    answer: 0,
    explanation: '人工诱发地震包括水库蓄水、核试验、采矿等人类活动引起的地震。其他选项都属于天然地震。',
    category: 'earthquake'
  },
  {
    title: '地震后被困时，应该怎么做？',
    options: ['保持冷静，保存体力', '大声呼救', '盲目挖掘', '使用明火照明'],
    answer: 0,
    explanation: '地震后被困时，应保持冷静，尽量保存体力，用敲击物体的方式发出求救信号，等待救援。',
    category: 'earthquake'
  },
  {
    title: '环太平洋地震带是世界上地震活动最频繁的区域吗？',
    options: ['是的', '不是', '不确定', '只有在特定季节'],
    answer: 0,
    explanation: '环太平洋地震带是世界上地震活动最频繁、最强烈的区域，约占全球地震总数的80%。',
    category: 'earthquake'
  }
];

const initialKnowledge = [
  {
    title: '地震的成因与类型',
    content: '地震是地球内部能量释放的一种自然现象。根据成因，地震主要分为构造地震、火山地震、塌陷地震和人工诱发地震。构造地震是由于板块运动、断层错动引起的，约占全球地震总数的90%以上。火山地震是火山活动引起的，塌陷地震则是由于地下溶洞或矿坑塌陷造成的。人工诱发地震包括水库蓄水、核试验等人类活动引起的地震。',
    category: 'def',
    summary: '介绍地震的基本成因和主要类型',
    keywords: '地震成因,构造地震,火山地震,板块运动,断层',
    author: '地震科普中心',
    source: '中国地震台网'
  },
  {
    title: '震级与烈度的区别',
    content: '震级和烈度是描述地震强度的两个重要概念，但含义不同。震级是衡量地震释放能量大小的指标，通常用里氏震级表示，一次地震只有一个震级。烈度则是描述地震对地表及建筑物破坏程度的指标，同一地震在不同地区的烈度不同。我国采用12度烈度表，烈度越高表示破坏越严重。',
    category: 'def',
    summary: '解释震级和烈度的区别及应用',
    keywords: '震级,烈度,里氏震级,地震破坏,12度烈度表',
    author: '地震科普中心',
    source: '中国地震局'
  },
  {
    title: '地震波的传播原理',
    content: '地震发生时会产生两种主要地震波：纵波(P波)和横波(S波)。纵波速度较快，可以在固体、液体和气体中传播，引起地面上下振动。横波速度较慢，只能在固体中传播，引起地面水平振动。横波是造成建筑物破坏的主要原因。此外，地震波在传播过程中还会发生反射、折射等现象。',
    category: 'def',
    summary: '介绍地震波的类型、传播特性和影响',
    keywords: '地震波,纵波,横波,P波,S波,地震传播',
    author: '地震科普中心',
    source: '中国地震学会'
  },
  {
    title: '2024年全球地震活动趋势分析',
    content: '根据全球地震监测数据，2024年全球地震活动处于正常水平。环太平洋地震带和地中海-喜马拉雅地震带是地震活动最频繁的区域。专家指出，虽然无法准确预测具体地震发生时间，但加强地震监测预警和抗震设防是减轻地震灾害的关键。各国应加强国际合作，共享地震数据和研究成果。',
    category: 'mag',
    summary: '分析2024年全球地震活动趋势',
    keywords: '全球地震,地震趋势,环太平洋地震带,地震监测',
    author: '张教授',
    source: '地震学报'
  },
  {
    title: '人工智能在地震预测中的应用',
    content: '近年来，人工智能技术在地震预测领域取得了显著进展。机器学习算法可以分析大量地震数据，识别地震发生前的异常信号。深度学习模型能够提高地震震级预测的准确性，并缩短地震预警时间。然而，专家强调，AI辅助预测仍需与传统地震学方法相结合，才能提高预测的可靠性。',
    category: 'mag',
    summary: '探讨人工智能技术在地震预测中的最新应用',
    keywords: '人工智能,机器学习,深度学习,地震预测,地震预警',
    author: '李博士',
    source: '地震研究进展'
  },
  {
    title: '震后自救互救指南',
    content: '地震发生后，正确的自救互救方法至关重要。首先要保持冷静，判断所处环境是否安全。如果被掩埋，应尽量保存体力，用敲击物体的方式发出求救信号。救助他人时，应先确定被困者位置，避免盲目挖掘造成二次伤害。优先救助生命体征明显的幸存者，并及时拨打求救电话。',
    category: 'firstaid',
    summary: '震后自救和救助他人的实用指南',
    keywords: '震后自救,互救,求救信号,幸存者救助',
    author: '急救专家团队',
    source: '中国红十字会'
  },
  {
    title: '地震伤员转运原则',
    content: '地震伤员转运需要遵循科学的原则。首先要对伤员进行初步检伤分类，优先转运重伤员。转运过程中要保持伤员身体稳定，避免加重伤势。对于脊柱损伤患者，必须使用硬板担架，并保持脊柱直线。同时，要做好伤员的生命体征监测和记录，确保转运过程安全。',
    category: 'firstaid',
    summary: '地震伤员转运的基本原则和注意事项',
    keywords: '伤员转运,检伤分类,脊柱损伤,生命体征监测',
    author: '急救专家团队',
    source: '国家卫生健康委员会'
  },
  {
    title: '震后心理疏导指南',
    content: '地震灾害不仅造成身体伤害，还会对人们的心理造成影响。常见的心理反应包括恐惧、焦虑、失眠等。心理疏导应及时介入，帮助受灾群众缓解情绪。家人和朋友的支持、专业心理咨询师的帮助都非常重要。同时，政府和社会组织应提供必要的心理援助资源。',
    category: 'firstaid',
    summary: '震后心理疏导的方法和资源',
    keywords: '心理疏导,灾后心理,焦虑,心理咨询',
    author: '心理专家团队',
    source: '中国心理学会'
  },
  {
    title: '建筑抗震设计原理',
    content: '建筑抗震设计的基本原则是"小震不坏、中震可修、大震不倒"。抗震设计需要考虑场地条件、建筑结构类型和抗震设防烈度。常见的抗震措施包括设置抗震缝、采用延性结构、加强节点连接等。现代建筑还广泛采用隔震和消能减震技术，提高建筑的抗震性能。',
    category: 'building',
    summary: '建筑抗震设计的基本原则和方法',
    keywords: '抗震设计,小震不坏,延性结构,隔震技术',
    author: '建筑结构专家',
    source: '建筑学报'
  },
  {
    title: '减隔震技术应用指南',
    content: '减隔震技术是提高建筑抗震能力的有效手段。基础隔震技术通过在建筑底部设置隔震层，延长建筑周期，减少地震能量传递。消能减震技术则通过在结构中设置阻尼器，消耗地震能量。这些技术已在国内外大量工程中应用，显著提高了建筑的抗震安全性。',
    category: 'building',
    summary: '减隔震技术的原理和应用案例',
    keywords: '减隔震,隔震层,阻尼器,抗震技术',
    author: '结构工程师团队',
    source: '土木工程学报'
  },
  {
    title: '房屋抗震加固方法',
    content: '对于既有建筑，可以通过抗震加固提高其抗震能力。常见的加固方法包括加大截面法、粘钢加固法、碳纤维加固法等。加固设计需要根据建筑结构特点和抗震设防要求制定方案。加固施工应严格按照设计要求进行，确保加固效果。定期对老旧建筑进行抗震鉴定和加固是提高城市抗震能力的重要措施。',
    category: 'building',
    summary: '既有房屋抗震加固的常用方法',
    keywords: '抗震加固,加大截面,粘钢加固,碳纤维加固',
    author: '建筑加固专家',
    source: '建筑科学'
  }
];

async function initSupabase() {
  try {
    console.log('🔌 正在连接 Supabase...');
    
    const { data: { user }, error: authError } = await supabase.auth.admin.createUser({
      email: 'admin@example.com',
      password: 'temp123456'
    });
    
    if (authError && authError.code !== 'PGRST116') {
      console.log('ℹ️ 管理员用户可能已存在，继续...');
    }
    
    console.log('✅ Supabase 连接成功');

    const { count: quizCount, error: quizCountErr } = await supabase
      .from('quizzes')
      .select('*', { count: 'exact', head: true });
    
    if (quizCountErr) {
      console.error('❌ 查询测验表失败:', quizCountErr.message);
      process.exit(1);
    }

    if (quizCount === 0) {
      console.log('📥 正在插入测验题目数据...');
      const { error: quizError } = await supabase
        .from('quizzes')
        .insert(initialQuizzes.map(q => ({
          ...q,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })));
      
      if (quizError) {
        console.error('❌ 插入测验数据失败:', quizError.message);
        process.exit(1);
      }
      console.log('✅ 测验题目数据插入成功');
    } else {
      console.log(`ℹ️ 测验表已有 ${quizCount} 条数据，跳过初始化`);
    }

    const { count: knowledgeCount, error: knowledgeCountErr } = await supabase
      .from('knowledge_articles')
      .select('*', { count: 'exact', head: true });
    
    if (knowledgeCountErr) {
      console.error('❌ 查询知识表失败:', knowledgeCountErr.message);
      process.exit(1);
    }

    if (knowledgeCount === 0) {
      console.log('📥 正在插入知识文章数据...');
      const { error: knowledgeError } = await supabase
        .from('knowledge_articles')
        .insert(initialKnowledge.map(k => ({
          ...k,
          view_count: 0,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })));
      
      if (knowledgeError) {
        console.error('❌ 插入知识数据失败:', knowledgeError.message);
        process.exit(1);
      }
      console.log('✅ 知识文章数据插入成功');
    } else {
      console.log(`ℹ️ 知识表已有 ${knowledgeCount} 条数据，跳过初始化`);
    }

    console.log('\n🎉 Supabase 数据初始化完成！');
    process.exit(0);
  } catch (error) {
    console.error('❌ 初始化失败:', error.message);
    process.exit(1);
  }
}

initSupabase();