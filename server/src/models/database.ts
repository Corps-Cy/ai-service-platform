import Database from 'better-sqlite3';
import { join } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

let db: Database.Database | null = null;

export function initDatabase() {
  const dbPath = process.env.DATABASE_PATH || join(__dirname, '../../data/database.sqlite');
  db = new Database(dbPath);

  // 创建表
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      nickname TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS user_tokens (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      tokens INTEGER DEFAULT 0,
      expires_at DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS subscriptions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      plan TEXT NOT NULL,
      status TEXT NOT NULL,
      started_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      expires_at DATETIME,
      FOREIGN KEY (user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS orders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_no TEXT UNIQUE NOT NULL,
      user_id INTEGER NOT NULL,
      amount REAL NOT NULL,
      payment_method TEXT NOT NULL,
      status TEXT NOT NULL,
      product_type TEXT NOT NULL,
      product_id TEXT,
      description TEXT,
      transaction_id TEXT,
      refund_order_no TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      paid_at DATETIME,
      refunded_at DATETIME,
      FOREIGN KEY (user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS tasks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      task_id TEXT UNIQUE NOT NULL,
      user_id INTEGER NOT NULL,
      type TEXT NOT NULL,
      status TEXT NOT NULL,
      input TEXT,
      output TEXT,
      tokens_used INTEGER DEFAULT 0,
      cost REAL DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      completed_at DATETIME,
      FOREIGN KEY (user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS pricing (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      service TEXT NOT NULL,
      price REAL NOT NULL,
      description TEXT,
      is_active INTEGER DEFAULT 1
    );

    CREATE TABLE IF NOT EXISTS plans (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      type TEXT NOT NULL,
      price REAL NOT NULL,
      duration INTEGER NOT NULL,
      tokens INTEGER NOT NULL,
      features TEXT,
      is_active INTEGER DEFAULT 1
    );
  `);

  // 初始化定价数据
  const pricingStmt = db.prepare('SELECT COUNT(*) as count FROM pricing');
  const pricingCount = pricingStmt.get() as any;

  if (pricingCount.count === 0) {
    const insertPricing = db.prepare(`
      INSERT INTO pricing (service, price, description) VALUES (?, ?, ?)
    `);

    insertPricing.run('text_to_image', 2.00, '文生图（每次）');
    insertPricing.run('pdf_convert', 1.00, 'PDF转换（每页）');
    insertPricing.run('pdf_parse', 0.50, 'PDF解析（每页）');
    insertPricing.run('excel_generate', 3.00, 'Excel生成');
    insertPricing.run('excel_analyze', 2.00, 'Excel分析');
    insertPricing.run('text_generate', 0.50, '文本生成（每千字）');
    insertPricing.run('image_understand', 1.00, '图片理解');
    insertPricing.run('video_generate', 10.00, '视频生成（每次）');
  }

  // 初始化套餐数据
  const planStmt = db.prepare('SELECT COUNT(*) as count FROM plans');
  const planCount = planStmt.get() as any;

  if (planCount.count === 0) {
    const insertPlan = db.prepare(`
      INSERT INTO plans (name, type, price, duration, tokens, features) VALUES (?, ?, ?, ?, ?, ?)
    `);

    insertPlan.run('月卡', 'monthly', 29.00, 30, 1000, JSON.stringify({
      features: ['文生图100次', 'PDF处理500页', 'Excel操作50次', '文本生成不限']
    }));

    insertPlan.run('季卡', 'quarterly', 79.00, 90, 3000, JSON.stringify({
      features: ['文生图300次', 'PDF处理1500页', 'Excel操作150次', '文本生成不限', '优先处理']
    }));

    insertPlan.run('年卡', 'yearly', 299.00, 365, 12000, JSON.stringify({
      features: ['文生图1200次', 'PDF处理6000页', 'Excel操作600次', '文本生成不限', '优先处理', '专属客服']
    }));
  }

  console.log('✅ Database initialized');
}

export function getDatabase() {
  if (!db) {
    throw new Error('Database not initialized');
  }
  return db;
}
