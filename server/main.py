import time
import psutil
import sqlite3
from fastapi import FastAPI, Header, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional
import threading

# --- 数据库初始化 ---
DB_FILE = "openclaw.db"

def init_db():
    conn = sqlite3.connect(DB_FILE)
    cursor = conn.cursor()
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS metrics (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            timestamp REAL,
            cpu REAL,
            ram REAL,
            latency REAL
        )
    ''')
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS token_usage (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            timestamp REAL,
            model TEXT,
            input_tokens INTEGER,
            output_tokens INTEGER,
            total_tokens INTEGER,
            cost REAL
        )
    ''')
    conn.commit()
    conn.close()

init_db()

# --- 后台数据采集任务 ---
def collect_metrics():
    while True:
        cpu = psutil.cpu_percent(interval=1)
        ram = psutil.virtual_memory().percent
        # 模拟延迟 (ms)
        latency = 20 + (psutil.cpu_percent() * 0.5)
        
        conn = sqlite3.connect(DB_FILE)
        cursor = conn.cursor()
        cursor.execute(
            "INSERT INTO metrics (timestamp, cpu, ram, latency) VALUES (?, ?, ?, ?)",
            (time.time(), cpu, ram, latency)
        )
        conn.commit()
        conn.close()
        time.sleep(5)

# 启动后台线程
threading.Thread(target=collect_metrics, daemon=True).start()

# --- FastAPI 接口 ---
app = FastAPI(title="OpenClaw Backend")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/api/v1/monitor")
async def get_monitor_data(authorization: Optional[str] = Header(None)):
    # 简单的令牌校验 (可选)
    # if authorization != "Bearer your_token":
    #     raise HTTPException(status_code=401, detail="Unauthorized")

    conn = sqlite3.connect(DB_FILE)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()
    
    # 获取最新的系统指标
    cursor.execute("SELECT cpu, ram, latency FROM metrics ORDER BY id DESC LIMIT 1")
    row = cursor.fetchone()
    
    # 获取最新的 Token 消耗 (这里模拟一个随机消耗，真实情况由核心注入)
    # 为了演示，我们随机生成一点 Token 消耗
    token_usage = {
        "model": "GPT-4o",
        "input": 120,
        "output": 350,
        "total": 470,
        "cost": 0.05
    }

    log_messages = [
        "Backend bridge: 数据采集循环正常",
        "SQLite: 写入 1 条性能指标记录",
        "API: React 前端连接成功"
    ]
    import random

    return {
        "cpu": row["cpu"] if row else 0,
        "ram": row["ram"] if row else 0,
        "latency": row["latency"] if row else 0,
        "tokenUsage": token_usage,
        "newLog": {
            "type": "success",
            "msg": random.choice(log_messages)
        }
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=2026)
