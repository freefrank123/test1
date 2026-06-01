require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });
const { Client } = require('pg');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Supabase 配置未设置');
  process.exit(1);
}

const urlParts = new URL(supabaseUrl);
const dbConfig = {
  host: `db.${urlParts.hostname.split('.')[0]}.supabase.co`,
  port: 5432,
  database: 'postgres',
  user: 'postgres',
  password: supabaseKey,
  ssl: { rejectUnauthorized: false }
};

console.log('🔧 连接配置:');
console.log(`   主机: ${dbConfig.host}`);
console.log(`   数据库: ${dbConfig.database}`);
console.log(`   用户: ${dbConfig.user}`);

const quizData = [
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

async function createTables() {
  const client = new Client(dbConfig);
  
  try {
    console.log('\n🔌 正在连接 PostgreSQL...');
    await client.connect();
    console.log('✅ PostgreSQL 连接成功');

    console.log('\n🔧 正在创建 quizzes 表...');
    const createTableSQL = `
      CREATE TABLE IF NOT EXISTS public.quizzes (
        id BIGSERIAL PRIMARY KEY,
        title TEXT NOT NULL,
        options JSONB NOT NULL,
        answer INTEGER NOT NULL CHECK (answer >= 0),
        explanation TEXT,
        category TEXT DEFAULT 'earthquake',
        created_at TIMESTAMPTZ DEFAULT now(),
        updated_at TIMESTAMPTZ DEFAULT now()
      );
      
      CREATE INDEX IF NOT EXISTS idx_quizzes_category ON public.quizzes(category);
      
      ALTER TABLE public.quizzes ENABLE ROW LEVEL SECURITY;
      
      DROP POLICY IF EXISTS "Anyone can read quizzes" ON public.quizzes;
      CREATE POLICY "Anyone can read quizzes" ON public.quizzes
        FOR SELECT USING (true);
    `;

    await client.query(createTableSQL);
    console.log('✅ quizzes 表创建成功');

    console.log('\n📊 检查现有数据...');
    const countResult = await client.query('SELECT COUNT(*) FROM public.quizzes');
    const count = parseInt(countResult.rows[0].count);

    if (count === 0) {
      console.log('📥 正在插入测验题目数据...');
      
      for (const quiz of quizData) {
        const insertSQL = `
          INSERT INTO public.quizzes (title, options, answer, explanation, category, created_at, updated_at)
          VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
        `;
        await client.query(insertSQL, [
          quiz.title,
          JSON.stringify(quiz.options),
          quiz.answer,
          quiz.explanation,
          quiz.category
        ]);
      }
      
      console.log('✅ 测验题目数据插入成功');
    } else {
      console.log(`ℹ️ 测验表已有 ${count} 条数据，跳过插入`);
    }

    await client.end();
    console.log('\n🔌 连接已关闭');
    console.log('\n🎉 表创建和数据导入完成！');
    
  } catch (error) {
    console.error('\n❌ 操作失败:', error.message);
    console.log('\n📋 如果连接失败，请手动在 Supabase Dashboard > SQL Editor 中执行 supabase_migration.sql 文件');
    if (client) {
      try { await client.end(); } catch (e) {}
    }
    process.exit(1);
  }
}

createTables();