import React, { useState, useEffect, useMemo } from 'react';
import {
  Activity, Cpu, Database, Zap, Search, Settings, Bell, Terminal, Server, Layers, CreditCard, BarChart, ChevronRight
} from 'lucide-react';
import {
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area, BarChart as RechartsBarChart, Bar, Legend
} from 'recharts';
import { motion, AnimatePresence } from 'framer-motion';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { format, subDays, startOfDay, startOfMonth, startOfYear } from 'date-fns';
import { db, type StatEntry, type TokenEntry, cleanupOldData } from './db';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

type Granularity = 'hour' | 'day' | 'month' | 'year';

const App = () => {
  // Config & UI States
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [config, setConfig] = useState(() => {
    const saved = localStorage.getItem('openclaw-config');
    return saved ? JSON.parse(saved) : { serverUrl: 'http://localhost:2026', token: '', isLive: false };
  });

  // Data States
  const [cpuStats, setCpuStats] = useState<StatEntry[]>([]);
  const [tokenStats, setTokenStats] = useState<TokenEntry[]>([]);
  const [robots, setRobots] = useState<any[]>([]);
  const [serviceStatus, setServiceStatus] = useState<string>('离线');
  const [logs, setLogs] = useState<{ id: number; time: string; type: string; msg: string }[]>([]);
  const [timeGranularity, setTimeGranularity] = useState<Granularity>('hour');
  const [currentTime, setCurrentTime] = useState(new Date().toLocaleTimeString('zh-CN'));

  // Load Initial Data
  useEffect(() => {
    const loadData = async () => {
      await cleanupOldData();
      const s = await db.stats.orderBy('timestamp').reverse().limit(50).toArray();
      const t = await db.tokens.orderBy('timestamp').reverse().toArray();
      setCpuStats(s.reverse());
      setTokenStats(t.reverse());
    };
    loadData();
  }, []);

  // Persistent storage of config
  useEffect(() => {
    localStorage.setItem('openclaw-config', JSON.stringify(config));
  }, [config]);

  // Real-time Update Loop (placeholder for real API)
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date().toLocaleTimeString('zh-CN'));
      if (config.isLive) {
        fetchRealData();
      } else {
        setServiceStatus('演示模式');
      }
    }, 3000);
    return () => clearInterval(timer);
  }, [config.isLive, config.serverUrl]);

  const fetchRealData = async () => {
    try {
      const response = await fetch(`${config.serverUrl}/api/v1/monitor`, {
        headers: { 'Authorization': `Bearer ${config.token}` }
      });

      if (response.ok) {
        const data = await response.json();
        const newStat = {
          timestamp: Date.now(),
          cpu: data.cpu,
          ram: data.ram,
          latency: data.latency
        };
        await db.stats.add(newStat);

        if (data.tokenUsage) {
          await db.tokens.add({
            timestamp: Date.now(),
            model: data.tokenUsage.model || 'Unknown',
            inputTokens: data.tokenUsage.input || 0,
            outputTokens: data.tokenUsage.output || 0,
            totalTokens: data.tokenUsage.total || 0,
            cost: data.tokenUsage.cost || 0
          });
        }

        setCpuStats(prev => [...prev.slice(-49), newStat]);
        setServiceStatus(data.serviceStatus || '正常');
        if (data.robots) setRobots(data.robots);

        if (data.newLog) {
          setLogs(prev => [{ id: Date.now(), time: new Date().toLocaleTimeString(), ...data.newLog }, ...prev.slice(0, 10)]);
        }
      } else {
        setServiceStatus('连接异常');
      }
    } catch (err) {
      setServiceStatus('无法连接');
    }
  };

  // Aggregated Data for Token Display
  const tokenChartData = useMemo(() => {
    const now = Date.now();
    let filterDate: number;

    switch (timeGranularity) {
      case 'day': filterDate = startOfDay(subDays(now, 7)).getTime(); break;
      case 'month': filterDate = startOfMonth(subDays(now, 30)).getTime(); break;
      case 'year': filterDate = startOfYear(now).getTime(); break;
      default: filterDate = now - (6 * 60 * 60 * 1000); // 最近 6 小时
    }

    const filtered = tokenStats.filter(t => t.timestamp > filterDate);

    // 按时间聚合 (根据粒度)
    const grouped: Record<string, any> = {};
    filtered.forEach(t => {
      let key: string;
      if (timeGranularity === 'hour') key = format(t.timestamp, 'HH:mm');
      else if (timeGranularity === 'day') key = format(t.timestamp, 'MM-dd');
      else if (timeGranularity === 'month') key = format(t.timestamp, 'yyyy-MM');
      else key = format(t.timestamp, 'yyyy');

      if (!grouped[key]) grouped[key] = { name: key, 输入: 0, 输出: 0, 总量: 0, 成本: 0 };
      grouped[key].输入 += t.inputTokens;
      grouped[key].输出 += t.outputTokens;
      grouped[key].总量 += t.totalTokens;
      grouped[key].成本 += t.cost;
    });

    return Object.values(grouped);
  }, [tokenStats, timeGranularity]);

  const lastTokenStat = tokenStats[tokenStats.length - 1] || { inputTokens: 0, outputTokens: 0, totalTokens: 0, cost: 0 };

  return (
    <div className="min-h-screen p-4 md:p-8 max-w-[1500px] mx-auto relative bg-[#0a0f1d] text-slate-100 font-sans">

      {/* 顶部导航 */}
      <nav className="flex items-center justify-between mb-10">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-gradient-to-br from-indigo-600 to-blue-500 rounded-2xl shadow-lg ring-4 ring-indigo-500/20">
            <Zap className="text-white fill-white" size={24} />
          </div>
          <div>
            <h1 className="text-2xl font-black bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400 tracking-tighter">OPENCLAW <span className="font-light">PRO MONITOR</span></h1>
            <div className="flex items-center gap-2 mt-1">
              <span className={cn("inline-block w-2 h-2 rounded-full", serviceStatus.includes('运行') || serviceStatus === '正常' ? 'bg-emerald-400 animate-pulse' : 'bg-red-500')} />
              <p className="text-[10px] text-slate-400 font-bold tracking-widest uppercase">服务状态: {serviceStatus}</p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden lg:flex items-center gap-6 glass px-6 py-2.5 rounded-full border border-white/5 bg-white/5 mr-4">
            <div className="flex flex-col">
              <span className="text-[9px] text-slate-500 font-bold uppercase tracking-widest">系统时钟</span>
              <span className="text-xs font-mono font-bold">{currentTime}</span>
            </div>
          </div>
          <IconButton icon={<Bell size={20} />} />
          <IconButton icon={<Settings size={20} />} onClick={() => setIsSettingsOpen(true)} active={isSettingsOpen} />
          <div className="w-10 h-10 rounded-2xl bg-indigo-500/20 p-1 border border-white/10 ml-2">
            <img src={`https://api.dicebear.com/7.x/bottts/svg?seed=OpenClaw&backgroundColor=b6e3f4,c0aede,d1d4f9`} className="rounded-xl" alt="avatar" />
          </div>
        </div>
      </nav>

      {/* 核心指标卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatItem
          icon={<Cpu className="text-indigo-400" />}
          label="实时 CPU"
          value={`${cpuStats[cpuStats.length - 1]?.cpu?.toFixed(1) || 0}%`}
          sub="多线程负载"
          color="indigo"
        />
        <StatItem
          icon={<Layers className="text-purple-400" />}
          label="内存占用"
          value={`${cpuStats[cpuStats.length - 1]?.ram?.toFixed(1) || 0}%`}
          sub="JVM / 容器限制"
          color="purple"
        />
        <StatItem
          icon={<Zap className="text-amber-400" />}
          label="Token 消耗 (今日)"
          value={lastTokenStat.totalTokens.toLocaleString()}
          sub="输入 + 输出总量"
          color="amber"
          trend="+5.2%"
        />
        <StatItem
          icon={<CreditCard className="text-emerald-400" />}
          label="预计成本"
          value={`¥${lastTokenStat.cost.toFixed(2)}`}
          sub="基于模型单价计算"
          color="emerald"
        />
      </div>

      {/* 机器人状态列表 - 顶部显眼位置 */}
      <div className="glass-card p-8 rounded-[2.5rem] border border-white/5 bg-[#141b2d]/50 mb-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-amber-500/10 rounded-xl text-amber-400"><Server size={20} /></div>
            <h2 className="text-xl font-bold">机器人实例实时监控</h2>
          </div>
          <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest bg-black/20 px-4 py-1.5 rounded-full border border-white/5">
            工作中: {robots.filter(r => r.status === 'working').length} / 总机: {robots.length}
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {robots.map((robot, i) => (
            <RobotCard key={i} {...robot} />
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

        {/* Token 消耗图表 (核心更新项) */}
        <section className="lg:col-span-8 space-y-8">
          <div className="glass-card p-8 rounded-[2.5rem] border border-white/5 bg-[#141b2d]/50 relative overflow-hidden">
            <div className="flex items-center justify-between mb-10 relative z-10">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-indigo-500/10 rounded-xl text-indigo-400"><BarChart size={20} /></div>
                <h2 className="text-xl font-bold">Token 消耗统计</h2>
              </div>
              <div className="flex items-center bg-black/30 p-1.5 rounded-2xl border border-white/5">
                {(['hour', 'day', 'month', 'year'] as Granularity[]).map(g => (
                  <button
                    key={g}
                    onClick={() => setTimeGranularity(g)}
                    className={cn(
                      "px-4 py-1.5 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all",
                      timeGranularity === g ? "bg-indigo-600 text-white shadow-lg" : "text-slate-500 hover:text-slate-300"
                    )}
                  >
                    {g === 'hour' ? '实时' : g === 'day' ? '日' : g === 'month' ? '月' : '年'}
                  </button>
                ))}
              </div>
            </div>

            <div className="h-[350px] w-full relative z-10">
              <ResponsiveContainer width="100%" height="100%">
                <RechartsBarChart data={tokenChartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#ffffff05" vertical={false} />
                  <XAxis dataKey="name" stroke="#64748b" fontSize={10} axisLine={false} tickLine={false} />
                  <YAxis stroke="#64748b" fontSize={10} axisLine={false} tickLine={false} />
                  <Tooltip cursor={{ fill: '#ffffff08' }} contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #ffffff10', borderRadius: '12px' }} />
                  <Legend />
                  <Bar dataKey="输入" fill="#6366f1" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="输出" fill="#a855f7" radius={[4, 4, 0, 0]} />
                </RechartsBarChart>
              </ResponsiveContainer>
            </div>
            <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-indigo-500/5 blur-[100px] -z-1" />
          </div>

          <div className="glass-card p-8 rounded-[2.5rem] border border-white/5 bg-[#141b2d]/50">
            <div className="flex items-center gap-3 mb-8">
              <div className="p-2.5 bg-blue-500/10 rounded-xl text-blue-400"><Activity size={20} /></div>
              <h2 className="text-xl font-bold">负载趋势</h2>
            </div>
            <div className="h-[250px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={cpuStats}>
                  <defs>
                    <linearGradient id="colorArea" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366f1" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#ffffff05" vertical={false} />
                  <XAxis dataKey="timestamp" hide />
                  <Tooltip contentStyle={{ backgroundColor: '#0f172a', border: 'none', borderRadius: '8px' }} labelStyle={{ display: 'none' }} />
                  <Area type="monotone" dataKey="cpu" stroke="#6366f1" strokeWidth={3} fillOpacity={1} fill="url(#colorArea)" />
                  <Area type="monotone" dataKey="ram" stroke="#a855f7" strokeWidth={2} fillOpacity={0} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </section>

        {/* 侧边日志 */}
        <aside className="lg:col-span-4 space-y-6">
          <div className="glass-card p-6 rounded-[2rem] border border-white/5 bg-[#141b2d]/50 flex flex-col h-full min-h-[500px]">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2 text-emerald-400">
                <Terminal size={18} />
                <span className="font-black text-xs uppercase tracking-widest">系统控制台</span>
              </div>
              <Search size={14} className="text-slate-500 cursor-pointer" />
            </div>
            <div className="flex-1 space-y-4 overflow-y-auto pr-2 custom-scrollbar">
              {logs.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-slate-600 opacity-40 py-20 text-center">
                  <Database size={40} className="mb-4" />
                  <p className="text-xs font-bold uppercase">在此处显示实时日志流<br />请配置后端连接</p>
                </div>
              ) : (
                logs.map(log => (
                  <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} key={log.id} className="p-3 bg-white/5 rounded-2xl border border-white/5">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-[10px] font-mono text-slate-500">{log.time}</span>
                      <span className={cn("text-[9px] font-black uppercase px-2 py-0.5 rounded", log.type === 'error' ? 'bg-red-500/20 text-red-400' : 'bg-indigo-500/20 text-indigo-400')}>
                        {log.type}
                      </span>
                    </div>
                    <p className="text-xs leading-relaxed text-slate-300">{log.msg}</p>
                  </motion.div>
                ))
              )}
            </div>
            <button className="w-full mt-6 py-4 bg-white/5 rounded-2xl text-[10px] font-bold uppercase text-slate-400 hover:text-white transition-all flex items-center justify-center gap-2">
              查看完整日志报告 <ChevronRight size={14} />
            </button>
          </div>
        </aside>

      </div>

      {/* 配置面板 */}
      <AnimatePresence>
        {isSettingsOpen && (
          <SettingsPanel
            config={config}
            setConfig={setConfig}
            onClose={() => setIsSettingsOpen(false)}
          />
        )}
      </AnimatePresence>

      <style>{`
        .glass-card { backdrop-filter: blur(40px); background: linear-gradient(145deg, rgba(31,41,55,0.4) 0%, rgba(17,24,39,0.5) 100%); }
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #334155; border-radius: 99px; }
      `}</style>
    </div>
  );
};

const StatItem = ({ icon, label, value, sub, color, trend }: any) => (
  <div className="glass-card p-6 rounded-[2rem] border border-white/5 bg-[#141b2d]/50 hover:border-indigo-500/30 transition-all cursor-default group overflow-hidden relative">
    <div className="flex items-start justify-between mb-4 relative z-10">
      <div className={cn("p-3 rounded-2xl bg-black/20 text-current transition-transform group-hover:scale-110", `text-${color}-400`)}>
        {icon}
      </div>
      {trend && (
        <span className="text-[10px] font-black text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-lg border border-emerald-500/10">{trend}</span>
      )}
    </div>
    <div className="relative z-10">
      <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-1">{label}</p>
      <p className="text-2xl font-black text-white glow-text">{value}</p>
      <p className="text-[10px] text-slate-500 mt-1 font-bold">{sub}</p>
    </div>
    <div className={cn("absolute -bottom-10 -right-10 w-32 h-32 blur-[60px] opacity-10 group-hover:opacity-20 transition-all", `bg-${color}-500`)} />
  </div>
);

const IconButton = ({ icon, onClick, active }: any) => (
  <button
    onClick={onClick}
    className={cn(
      "w-10 h-10 rounded-2xl flex items-center justify-center border transition-all",
      active ? "bg-indigo-600 border-indigo-500 text-white shadow-lg" : "bg-white/5 border-white/5 text-slate-400 hover:border-white/10 hover:text-white"
    )}
  >
    {icon}
  </button>
);

const SettingsPanel = ({ config, setConfig, onClose }: any) => (
  <motion.div
    initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
    className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-md flex items-center justify-center p-6"
    onClick={onClose}
  >
    <motion.div
      initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }}
      className="max-w-md w-full glass-card p-8 rounded-[3rem] border border-white/10 shadow-2xl relative"
      onClick={e => e.stopPropagation()}
    >
      <div className="flex items-center justify-between mb-8">
        <h2 className="text-xl font-black italic">DATABASE CONFIG</h2>
        <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-full transition-all">✕</button>
      </div>

      <div className="space-y-6">
        <div className="space-y-2">
          <label className="text-[10px] uppercase font-black text-slate-500 tracking-widest pl-1">Server Interface</label>
          <input
            type="text"
            value={config.serverUrl}
            onChange={(e) => setConfig({ ...config, serverUrl: e.target.value })}
            className="w-full bg-black/40 border border-white/5 rounded-2xl px-5 py-4 text-sm focus:border-indigo-500 outline-none"
            placeholder="http://1.1.1.1:2026"
          />
        </div>
        <div className="space-y-2">
          <label className="text-[10px] uppercase font-black text-slate-500 tracking-widest pl-1">Dashboard Token</label>
          <input
            type="password"
            value={config.token}
            onChange={(e) => setConfig({ ...config, token: e.target.value })}
            className="w-full bg-black/40 border border-white/5 rounded-2xl px-5 py-4 text-sm focus:border-indigo-500 outline-none"
            placeholder="********"
          />
        </div>

        <div className="pt-4">
          <button
            onClick={() => setConfig({ ...config, isLive: !config.isLive })}
            className={cn(
              "w-full py-5 rounded-[2rem] font-black uppercase tracking-[0.3em] text-xs transition-all",
              config.isLive ? "bg-emerald-500 text-black shadow-lg shadow-emerald-500/40" : "bg-indigo-600 text-white shadow-lg shadow-indigo-500/40"
            )}
          >
            {config.isLive ? 'ON SERVICE (LIVE)' : 'OFFLINE (SIM)'}
          </button>
        </div>
      </div>

      <p className="mt-8 text-[9px] text-slate-600 text-center leading-relaxed font-bold tracking-widest uppercase">所有数据已通过 IndexedDB 进行本地持久化存储，支持保存最近 30 天的历史负载与消耗数据。</p>
    </motion.div>
  </motion.div>
);

const RobotCard = ({ name, status, type, tasks }: any) => (
  <div className="p-5 rounded-[1.5rem] border border-white/5 bg-white/[0.03] hover:bg-white/[0.06] transition-all group relative overflow-hidden">
    <div className="flex items-center justify-between mb-4 relative z-10">
      <div className="flex items-center gap-3">
        <div className={cn(
          "w-2.5 h-2.5 rounded-full",
          status === 'working' ? "bg-emerald-400 animate-pulse" : status === 'paused' ? "bg-slate-600" : "bg-blue-400"
        )} />
        <span className="font-bold text-sm tracking-tight">{name}</span>
      </div>
      <span className="text-[9px] font-black text-slate-500 bg-black/20 px-2 py-0.5 rounded-lg border border-white/5 uppercase tracking-widest">{type}</span>
    </div>

    <div className="flex items-center justify-between relative z-10">
      <div className="flex flex-col">
        <span className="text-[10px] font-black text-slate-500 uppercase tracking-tighter">当前状态</span>
        <span className={cn(
          "text-xs font-bold",
          status === 'working' ? "text-emerald-400" : status === 'paused' ? "text-slate-500" : "text-blue-400"
        )}>
          {status === 'working' ? '工作中...' : status === 'paused' ? '已暂停' : '空闲'}
        </span>
      </div>
      <div className="text-right">
        <p className="text-[10px] font-black text-slate-500 uppercase tracking-tighter">累计处理</p>
        <p className="text-sm font-black text-white">{tasks}</p>
      </div>
    </div>

    {/* 背景装饰 */}
    <div className={cn(
      "absolute -bottom-10 -right-10 w-24 h-24 blur-[40px] opacity-10 transition-all",
      status === 'working' ? "bg-emerald-500" : status === 'paused' ? "bg-slate-500" : "bg-blue-500"
    )} />
  </div>
);

export default App;
