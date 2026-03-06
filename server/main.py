import time
import psutil
import sqlite3
from fastapi import FastAPI, Header, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, List
import threading
import random

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

# --- 机器人状态模拟数据 ---
ROBOTS = [
    {"id": 1, "name": "Claw-观测者-01", "type": "GPT-4o", "tasks": 12},
    {"id": 2, "name": "Research-Bot-研学", "type": "Claude 3.5 Sonnet", "tasks": 8},
    {"id": 3, "name": "Legacy-后台任务", "type": "GPT-3.5-Turbo", "tasks": 0},
    {"id": 4, "name": "Data-Analyzer-架构", "type": "DeepSeek-V3", "tasks": 45},
]

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
    conn = sqlite3.connect(DB_FILE)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()
    
    # 获取最新的系统指标
    cursor.execute("SELECT cpu, ram, latency FROM metrics ORDER BY id DESC LIMIT 1")
    row = cursor.fetchone()
    
    # 获取最新的 Token 消耗
    token_usage = {
        "model": "GPT-4o",
        "input": 120 + random.randint(0, 50),
        "output": 350 + random.randint(0, 100),
        "total": 470 + random.randint(0, 150),
        "cost": 0.05 + random.uniform(0, 0.02)
    }

    # 处理机器人工作状态逻辑: 随机切换工作或空闲
    robots_status = []
    for r in ROBOTS:
        # 简单模拟：除了 ID 为 3 的暂停，其他随机工作/空闲
        if r["id"] == 3:
            status = "paused"
        else:
            status = random.choice(["working", "idle"])
            if status == "working":
                r["tasks"] += random.randint(0, 1) # 增加任务计数

        robots_status.append({
            "name": r["name"],
            "status": status,
            "type": r["type"],
            "tasks": r["tasks"]
        })

    log_messages = [
        "系统状态: AI 主节点连接稳定",
        "内存清理: 释放 150MB 冗余缓存",
        "任务调度: 派遣 {} 至对话池".format(random.choice(ROBOTS)["name"]),
        "API网关: 响应成功, 耗时 {}ms".format(int(row["latency"]) if row else 0)
    ]

    return {
        "serviceStatus": "运行中", # 固定的运行状态展示
        "cpu": row["cpu"] if row else 0,
        "ram": row["ram"] if row else 0,
        "latency": row["latency"] if row else 0,
        "tokenUsage": token_usage,
        "robots": robots_status,
        "newLog": {
            "type": "info",
            "msg": random.choice(log_messages)
        }
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=2026)
