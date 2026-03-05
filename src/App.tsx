import React, { useState, useEffect } from 'react';
import {
  Activity,
  Cpu,
  Database,
  Globe,
  Shield,
  Zap,
  Search,
  Settings,
  Bell,
  BarChart3,
  Clock,
  Terminal,
  Server,
  Layers,
  CheckCircle2,
  AlertCircle,
  TrendingUp,
  CreditCard
} from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area
} from 'recharts';
import { motion, AnimatePresence } from 'framer-motion';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Mock Data Generators
const generateLogs = () => [
  { id: 1, time: '18:02:11', type: 'info', msg: '系统核心初始化成功' },
  { id: 2, time: '18:02:15', type: 'success', msg: '已成功建立与 OpenAI API 网关的连接' },
  { id: 3, time: '18:03:01', type: 'info', msg: '机器人 "Claw-01" 开始执行任务: "深度数据分析"' },
  { id: 4, time: '18:04:22', type: 'warning', msg: '检测到 B 区会话集群延迟异常增加' },
  { id: 5, time: '18:05:10', type: 'info', msg: '后台内存清理程序定期维护完成' },
];

const generateStats = () => [
  { name: '18:00', cpu: 32, ram: 45, latency: 120 },
  { name: '18:01', cpu: 45, ram: 48, latency: 150 },
  { name: '18:02', cpu: 28, ram: 46, latency: 110 },
  { name: '18:03', cpu: 55, ram: 52, latency: 180 },
  { name: '18:04', cpu: 42, ram: 55, latency: 140 },
  { name: '18:05', cpu: 38, ram: 53, latency: 130 },
];

const App = () => {
  const [logs, setLogs] = useState(generateLogs());
  const [stats, setStats] = useState(generateStats());
  const [currentTime, setCurrentTime] = useState(new Date().toLocaleTimeString('zh-CN'));

  // UI States
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isNotifyOpen, setIsNotifyOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  // Config States (Persistent)
  const [config, setConfig] = useState(() => {
    const saved = localStorage.getItem('openclaw-config');
    return saved ? JSON.parse(saved) : {
      serverUrl: 'http://localhost:2026',
      token: '',
      isLive: false
    };
  });

  useEffect(() => {
    localStorage.setItem('openclaw-config', JSON.stringify(config));
  }, [config]);

  const notifications = [
    { id: 1, text: '检测到新的机器人实例: Claw-05', time: '5分钟前', unread: true },
    { id: 2, text: 'API 调用额度已消耗 80%', time: '12分钟前', unread: true },
    { id: 3, text: '系统于 18:00 完成版本更新', time: '30分钟前', unread: false },
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date().toLocaleTimeString('zh-CN'));

      if (!config.isLive) {
        setLogs(prev => {
          const next = [...prev];
          if (next.length > 8) next.shift();
          return next;
        });

        setStats(prev => {
          const last = prev[prev.length - 1];
          const newTime = new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
          return [...prev.slice(1), {
            name: newTime,
            cpu: Math.min(100, Math.max(10, last.cpu + (Math.random() - 0.5) * 15)),
            ram: Math.min(100, Math.max(10, last.ram + (Math.random() - 0.5) * 5)),
            latency: Math.min(500, Math.max(50, last.latency + (Math.random() - 0.5) * 40)),
          }];
        });
      }
    }, 3000);
    return () => clearInterval(timer);
  }, [config.isLive]);

  return (
    <div className="min-h-screen p-4 md:p-8 max-w-[1400px] mx-auto relative overflow-x-hidden">
      {/* Header */}
      <nav className="flex items-center justify-between mb-8 relative z-50">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center shadow-[0_0_20px_rgba(88,101,242,0.5)]">
            <Zap className="text-white fill-white" size={24} />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">OpenClaw <span className="text-primary">监测中心</span></h1>
            <p className="text-xs text-text-muted">v2026.3.2 • 企业版</p>
          </div>
        </div>

        <div className="hidden md:flex items-center gap-6 glass px-6 py-2">
          <div className="flex items-center gap-2">
            <div className={cn("w-2 h-2 rounded-full animate-pulse", config.isLive ? "bg-success" : "bg-warning")} />
            <span className="text-sm font-medium">状态: {config.isLive ? '生产后端' : '演示模式'}</span>
          </div>
          <div className="w-px h-4 bg-border" />
          <div className="flex items-center gap-2 text-text-muted">
            <Clock size={16} />
            <span className="text-sm font-mono">{currentTime}</span>
          </div>
        </div>

        <div className="flex items-center gap-3 relative">
          <div className="relative">
            <button
              onClick={() => { setIsNotifyOpen(!isNotifyOpen); setIsSettingsOpen(false); setIsProfileOpen(false); }}
              className={cn("p-2 hover:bg-white/5 rounded-lg transition-colors border-none bg-transparent relative", isNotifyOpen && "bg-white/10")}
            >
              <Bell size={20} className={cn("text-text-muted", isNotifyOpen && "text-primary")} />
              {notifications.some(n => n.unread) && <span className="absolute top-2 right-2 w-2 h-2 bg-danger rounded-full border-2 border-background" />}
            </button>
            <AnimatePresence>
              {isNotifyOpen && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }} className="absolute right-0 mt-3 w-80 glass p-4 shadow-2xl z-[100] border border-white/10">
                  <h3 className="font-bold text-sm mb-4">最新通知</h3>
                  <div className="space-y-3">
                    {notifications.map(n => (
                      <div key={n.id} className="p-2 hover:bg-white/5 rounded-lg cursor-pointer">
                        <p className="text-xs font-medium">{n.text}</p>
                        <p className="text-[10px] text-text-muted mt-1">{n.time}</p>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <button
            onClick={() => { setIsSettingsOpen(!isSettingsOpen); setIsNotifyOpen(false); setIsProfileOpen(false); }}
            className={cn("p-2 hover:bg-white/5 rounded-lg transition-colors border-none bg-transparent", isSettingsOpen && "bg-white/10")}
          >
            <Settings size={20} className={cn("text-text-muted", isSettingsOpen && "text-primary")} />
          </button>

          <div className="relative">
            <button onClick={() => { setIsProfileOpen(!isProfileOpen); setIsSettingsOpen(false); setIsNotifyOpen(false); }} className="w-8 h-8 rounded-full bg-gradient-to-tr from-primary to-purple-500 overflow-hidden border border-white/20 hover:scale-105 transition-transform">
              <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=OpenClaw" alt="Avatar" />
            </button>
            <AnimatePresence>
              {isProfileOpen && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }} className="absolute right-0 mt-3 w-48 glass p-2 shadow-2xl z-[100]">
                  <div className="px-3 py-2 border-b border-white/5 mb-1">
                    <p className="text-xs font-bold">管理员账号</p>
                    <p className="text-[10px] text-text-muted">admin@openclaw.local</p>
                  </div>
                  <button className="w-full text-left px-3 py-2 text-xs hover:bg-white/5 rounded transition-colors text-danger">退出登录</button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </nav>

      {/* Main Grid */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 relative">
        {/* Settings Drawer */}
        <AnimatePresence>
          {isSettingsOpen && (
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} className="absolute right-0 top-0 w-80 h-full glass p-6 z-[60] shadow-[-20px_0_40px_rgba(0,0,0,0.5)] flex flex-col gap-6">
              <div className="flex items-center justify-between">
                <h2 className="font-bold flex items-center gap-2 underline decoration-primary decoration-2 underline-offset-4"><Database size={18} />环境配置</h2>
                <button onClick={() => setIsSettingsOpen(false)} className="text-text-muted hover:text-white">✕</button>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="text-[10px] uppercase font-bold text-text-muted mb-1 block">服务器地址</label>
                  <input type="text" value={config.serverUrl} onChange={(e) => setConfig({ ...config, serverUrl: e.target.value })} placeholder="http://127.0.0.1:2026" className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary transition-colors text-white" />
                </div>
                <div>
                  <label className="text-[10px] uppercase font-bold text-text-muted mb-1 block">API 访问令牌</label>
                  <input type="password" value={config.token} onChange={(e) => setConfig({ ...config, token: e.target.value })} placeholder="请输入密钥" className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary transition-colors text-white" />
                </div>
                <div className="flex items-center justify-between pt-2">
                  <span className="text-xs text-text-main">连接生产环境</span>
                  <button onClick={() => setConfig({ ...config, isLive: !config.isLive })} className={cn("w-12 h-6 rounded-full transition-colors relative", config.isLive ? "bg-success" : "bg-white/10")}>
                    <div className={cn("absolute top-1 w-4 h-4 bg-white rounded-full transition-all", config.isLive ? "left-7" : "left-1")} />
                  </button>
                </div>
              </div>
              <div className="mt-auto bg-primary/10 p-3 rounded-lg border border-primary/20">
                <p className="text-[10px] text-primary font-bold mb-1 italic">提示:</p>
                <p className="text-[10px] text-text-muted leading-relaxed">参数将立即应用于 API 请求。关闭生产环境连接将自动切回演示模式。</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <StatCard icon={<Cpu className="text-blue-400" />} label="CPU 使用率" value={`${Math.round(stats[stats.length - 1].cpu)}%`} trend="+2.4%" sub="4核 集群节点" className="md:col-span-3" />
        <StatCard icon={<Layers className="text-purple-400" />} label="内存 占用" value={`${Math.round(stats[stats.length - 1].ram)}%`} trend="-0.5%" sub="12.4GB / 24GB" className="md:col-span-3" />
        <StatCard icon={<Activity className="text-green-400" />} label="平均延迟" value={`${Math.round(stats[stats.length - 1].latency)}ms`} trend="稳定" sub="华东边缘节点" className="md:col-span-3" />
        <StatCard icon={<CreditCard className="text-amber-400" />} label="当日支出" value="¥84.50" trend="+12%" sub="预计本月 ¥2,450" className="md:col-span-3" />

        <div className="md:col-span-8 glass p-6 min-h-[400px]">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2"><TrendingUp className="text-primary" size={20} /><h2 className="font-semibold text-lg">性能指标趋势</h2></div>
            <div className="flex gap-2">
              <button className="text-xs px-3 py-1 bg-primary/20 text-primary border border-primary/30 rounded-full">实时</button>
              <button className="text-xs px-3 py-1 hover:bg-white/5 text-text-muted rounded-full">1h</button>
            </div>
          </div>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={stats}>
                <defs><linearGradient id="colorCpu" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#5865F2" stopOpacity={0.3} /><stop offset="95%" stopColor="#5865F2" stopOpacity={0} /></linearGradient></defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                <XAxis dataKey="name" stroke="#64748b" fontSize={10} tickLine={false} axisLine={false} />
                <YAxis stroke="#64748b" fontSize={10} tickLine={false} axisLine={false} tickFormatter={(v) => `${v}%`} />
                <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }} itemStyle={{ color: '#fff' }} />
                <Area type="monotone" dataKey="cpu" name="CPU 使用率" stroke="#5865F2" strokeWidth={2} fillOpacity={1} fill="url(#colorCpu)" />
                <Area type="monotone" dataKey="ram" name="内存占用" stroke="#8b5cf6" strokeWidth={2} fillOpacity={0} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="md:col-span-4 glass p-6 flex flex-col">
          <div className="flex items-center gap-2 mb-6"><Terminal className="text-success" size={20} /><h2 className="font-semibold text-lg">系统实时日志</h2></div>
          <div className="flex-1 space-y-4 overflow-y-auto max-h-[300px] pr-2">
            <AnimatePresence mode="popLayout">
              {logs.map((log) => (
                <motion.div key={log.id} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="p-3 rounded-lg bg-black/20 border border-white/5 flex gap-3">
                  <span className="text-[10px] font-mono text-text-muted mt-1">{log.time}</span>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      {log.type === 'success' && <CheckCircle2 size={12} className="text-success" />}
                      {log.type === 'warning' && <AlertCircle size={12} className="text-warning" />}
                      {log.type === 'info' && <div className="w-1.5 h-1.5 rounded-full bg-primary/60" />}
                      <span className={cn("text-[10px] font-bold uppercase tracking-wider", log.type === 'success' ? "text-success" : log.type === 'warning' ? "text-warning" : "text-primary/80")}>
                        {log.type === 'success' ? '正常' : log.type === 'warning' ? '警告' : '提示'}
                      </span>
                    </div>
                    <p className="text-xs text-text-main/90 leading-relaxed">{log.msg}</p>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>

        <div className="md:col-span-12 glass p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2"><Server className="text-primary" size={20} /><h2 className="font-semibold text-lg">AI 机器人实例列表</h2></div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <RobotCard name="Claw-观察者-01" status="running" type="GPT-4o" tasks={12} />
            <RobotCard name="Research-Bot-研学" status="running" type="Claude 3.5 Sonnet" tasks={8} />
            <RobotCard name="Legacy-后台任务" status="paused" type="GPT-3.5-Turbo" tasks={0} />
          </div>
        </div>
      </div>
    </div>
  );
};

const StatCard = ({ icon, label, value, trend, sub, className }: any) => (
  <div className={cn("glass p-5 flex flex-col gap-3", className)}>
    <div className="flex items-start justify-between">
      <div className="p-2 bg-white/5 rounded-lg border border-white/5">{icon}</div>
      <span className={cn("text-[10px] font-bold px-2 py-0.5 rounded-full border", trend.includes('+') ? "bg-success/10 text-success border-success/20" : trend === "稳定" ? "bg-blue-500/10 text-blue-400 border-blue-500/20" : "bg-danger/10 text-danger border-danger/20")}>{trend}</span>
    </div>
    <div>
      <p className="text-xs text-text-muted font-medium mb-1">{label}</p>
      <p className="text-2xl font-bold tracking-tight glow-text">{value}</p>
      <p className="text-[10px] text-text-muted mt-1">{sub}</p>
    </div>
  </div>
);

const RobotCard = ({ name, status, type, tasks }: any) => (
  <div className="p-4 rounded-xl border border-white/5 bg-white/[0.02] hover:bg-white/[0.05] transition-all cursor-pointer group">
    <div className="flex items-center justify-between mb-4">
      <div className="flex items-center gap-3">
        <div className={cn("w-3 h-3 rounded-full", status === 'running' ? "bg-success animate-pulse" : "bg-text-muted")} />
        <span className="font-semibold text-sm group-hover:text-primary transition-colors">{name}</span>
      </div>
      <span className="text-[10px] text-text-muted bg-white/5 px-2 py-0.5 rounded uppercase font-bold">{type}</span>
    </div>
    <div className="flex items-center justify-between">
      <div className="flex -space-x-2">
        {[1, 2, 3].map(i => <div key={i} className="w-5 h-5 rounded-full border border-background bg-slate-700 flex items-center justify-center text-[8px]">{i}</div>)}
      </div>
      <div className="text-right">
        <p className="text-[10px] text-text-muted uppercase">已处理任务</p>
        <p className="text-xs font-bold">{tasks}</p>
      </div>
    </div>
  </div>
);

export default App;
