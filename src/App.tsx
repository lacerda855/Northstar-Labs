import { useEffect, useMemo, useState } from 'react'
import type { FormEvent } from 'react'
import {
  Activity, AlertOctagon, ArrowDownRight, ArrowUpRight, Bell, Check, ChevronDown,
  CircleDollarSign, CircleHelp, Clock3, Crosshair, Download, Ellipsis, Fingerprint,
  Globe2, LayoutDashboard, Menu, Search, Server, Shield,
  ShieldAlert, ShieldCheck, SlidersHorizontal, Terminal, TrendingUp, UsersRound, Wallet, X,
} from 'lucide-react'

type Severity = 'Crítica' | 'Alta' | 'Média' | 'Baixa'
type AlertItem = { id: string; title: string; asset: string; source: string; time: string; severity: Severity; status: 'Investigando' | 'Aberto' | 'Contido' }
type LogLine = { id: number; time: string; level: 'INFO' | 'WARN' | 'CRIT' | 'AUTH'; source: string; message: string; ip: string }
type BusinessMetrics = { mrr: number; customers: number; newCustomers: number; retention: number; churn: number; cacPayback: number; nps: number; cash: number; burn: number }
type FeedStatus = 'connecting' | 'live' | 'demo' | 'offline'

const initialBusiness: BusinessMetrics = { mrr: 148200, customers: 342, newCustomers: 27, retention: 98.2, churn: 1.8, cacPayback: 7.2, nps: 72, cash: 2560000, burn: 142000 }
const demoSources = ['IDS-EDGE-03', 'AUTH-SVC-01', 'WAF-PROD-02', 'EDR-FIN-08']

const initialAlerts: AlertItem[] = [
  { id: 'ALT-2849', title: 'Múltiplas tentativas de login', asset: 'auth-gateway-01', source: '185.220.101.42', time: 'há 2 min', severity: 'Crítica', status: 'Investigando' },
  { id: 'ALT-2848', title: 'Exfiltração de dados detectada', asset: 'db-prod-east-2', source: '10.24.8.19', time: 'há 8 min', severity: 'Alta', status: 'Aberto' },
  { id: 'ALT-2847', title: 'Port scan em andamento', asset: 'edge-firewall-03', source: '91.240.118.172', time: 'há 14 min', severity: 'Alta', status: 'Aberto' },
  { id: 'ALT-2846', title: 'Execução fora do padrão', asset: 'workstation-fin-08', source: '10.24.16.203', time: 'há 31 min', severity: 'Média', status: 'Investigando' },
]

const seedLogs: LogLine[] = [
  { id: 1, time: '14:32:08.421', level: 'WARN', source: 'IDS-EDGE-03', message: 'Tráfego anômalo detectado na porta 443', ip: '185.220.101.42' },
  { id: 2, time: '14:32:07.189', level: 'AUTH', source: 'AUTH-SVC-01', message: 'Falha de autenticação · usuário admin', ip: '185.220.101.42' },
  { id: 3, time: '14:32:05.773', level: 'CRIT', source: 'WAF-PROD-02', message: 'SQL injection bloqueada · /api/v2/users', ip: '45.155.205.233' },
  { id: 4, time: '14:32:03.012', level: 'INFO', source: 'EDR-FIN-08', message: 'Verificação de integridade concluída', ip: '10.24.16.203' },
  { id: 5, time: '14:32:01.551', level: 'WARN', source: 'FW-EAST-03', message: 'Varredura de portas · 23 portas em 4s', ip: '91.240.118.172' },
]

function createSeedLogs() {
  const now = Date.now()
  return seedLogs.map((log, index) => {
    const timestamp = new Date(now - index * 1700)
    return { ...log, time: `${timestamp.toLocaleTimeString('pt-BR', { hour12: false })}.${String(timestamp.getMilliseconds()).padStart(3, '0')}` }
  })
}

const chartValues = [18, 14, 17, 13, 16, 12, 19, 23, 18, 15, 12, 17, 20, 16, 14, 12, 18, 20, 29, 24, 19, 16, 22, 18, 15, 19, 34, 49, 38, 25, 21, 18, 20, 16, 22, 18, 16, 24, 31, 25, 21, 26, 18, 20, 17, 21, 28, 22]
const hours = ['15:00', '18:00', '21:00', '00:00', '03:00', '06:00', '09:00', '12:00', '15:00']
const severityClass: Record<Severity, string> = { Crítica: 'critical', Alta: 'high', Média: 'medium', Baixa: 'low' }
const logLevels: LogLine['level'][] = ['INFO', 'WARN', 'AUTH', 'CRIT']
const logMessages = ['Conexão TLS estabelecida com sucesso', 'Tentativa de acesso bloqueada pela política', 'Tráfego acima do baseline detectado', 'Heartbeat recebido · integridade verificada', 'Atividade suspeita em endpoint monitorada']
const ips = ['10.24.8.19', '185.220.101.42', '91.240.118.172', '10.24.16.203', '45.155.205.233']

function createDemoLog(): LogLine {
  const now = new Date()
  const level = logLevels[Math.random() < .08 ? 3 : Math.floor(Math.random() * 3)]
  return {
    id: Date.now(),
    time: `${now.toLocaleTimeString('pt-BR', { hour12: false })}.${String(now.getMilliseconds()).padStart(3, '0')}`,
    level,
    source: demoSources[Math.floor(Math.random() * demoSources.length)],
    message: level === 'CRIT' ? 'Atividade suspeita bloqueada pela política de segurança' : logMessages[Math.floor(Math.random() * logMessages.length)],
    ip: ips[Math.floor(Math.random() * ips.length)],
  }
}

function toSafeLog(value: unknown): LogLine | null {
  if (!value || typeof value !== 'object') return null
  const item = value as Record<string, unknown>
  if (!logLevels.includes(item.level as LogLine['level'])) return null
  const fields = ['time', 'source', 'message', 'ip'] as const
  if (fields.some(field => typeof item[field] !== 'string')) return null
  const bounded = (field: typeof fields[number], max: number) => String(item[field]).replace(/[\u0000-\u001F\u007F]/g, '').slice(0, max)
  return { id: typeof item.id === 'number' && Number.isFinite(item.id) ? item.id : Date.now(), level: item.level as LogLine['level'], time: bounded('time', 32), source: bounded('source', 64), message: bounded('message', 240), ip: bounded('ip', 64) }
}

function toSafeMetrics(value: unknown): Partial<BusinessMetrics> | null {
  if (!value || typeof value !== 'object') return null
  const item = value as Record<string, unknown>
  const safe: Partial<BusinessMetrics> = {}
  const limits: Record<keyof BusinessMetrics, [number, number]> = {
    mrr: [0, 1_000_000_000], customers: [0, 10_000_000], newCustomers: [0, 10_000_000], retention: [0, 100], churn: [0, 100],
    cacPayback: [0, 240], nps: [-100, 100], cash: [0, 100_000_000_000], burn: [0, 100_000_000_000],
  }
  for (const key of Object.keys(limits) as (keyof BusinessMetrics)[]) {
    const candidate = item[key]
    if (typeof candidate === 'number' && Number.isFinite(candidate) && candidate >= limits[key][0] && candidate <= limits[key][1]) safe[key] = candidate
  }
  return Object.keys(safe).length ? safe : null
}

function connectRealtimeFeed(handlers: {
  onLog: (log: LogLine) => void
  onMetrics: (metrics: Partial<BusinessMetrics>) => void
  onStatus: (status: FeedStatus) => void
}) {
  const endpoint = import.meta.env.VITE_SOC_WEBSOCKET_URL
  let closed = false
  let socket: WebSocket | undefined
  let reconnectTimer = 0
  let demoTimer = 0
  let metricsTimer = 0
  let retryDelay = 1000

  if (!endpoint) {
    handlers.onStatus('demo')
    let demoMrr = initialBusiness.mrr
    let demoCustomers = initialBusiness.customers
    demoTimer = window.setInterval(() => handlers.onLog(createDemoLog()), 5000)
    metricsTimer = window.setInterval(() => {
      demoMrr = Math.max(100000, demoMrr + Math.round((Math.random() - .43) * 450))
      if (Math.random() > .76) demoCustomers += 1
      handlers.onMetrics({ mrr: demoMrr, customers: demoCustomers, newCustomers: Math.max(0, demoCustomers - initialBusiness.customers + initialBusiness.newCustomers) })
    }, 15000)
  } else {
    const open = () => {
      if (closed) return
      handlers.onStatus('connecting')
      try {
        socket = new WebSocket(endpoint)
      } catch {
        scheduleReconnect()
        return
      }
      socket.onopen = () => { retryDelay = 1000; handlers.onStatus('live') }
      socket.onmessage = event => {
        try {
          const payload: unknown = JSON.parse(String(event.data))
          if (!payload || typeof payload !== 'object') return
          const packet = payload as Record<string, unknown>
          const log = toSafeLog(packet.type === 'log' ? packet.data : payload)
          const metrics = packet.type === 'metrics' ? toSafeMetrics(packet.data) : null
          if (log) handlers.onLog(log)
          if (metrics) handlers.onMetrics(metrics)
        } catch { /* Invalid frames are ignored; no untrusted payload reaches the UI. */ }
      }
      socket.onclose = scheduleReconnect
      socket.onerror = () => socket?.close()
    }
    function scheduleReconnect() {
      if (closed) return
      handlers.onStatus('offline')
      window.clearTimeout(reconnectTimer)
      reconnectTimer = window.setTimeout(open, retryDelay)
      retryDelay = Math.min(retryDelay * 2, 30000)
    }
    open()
  }

  return () => {
    closed = true
    window.clearInterval(demoTimer)
    window.clearInterval(metricsTimer)
    window.clearTimeout(reconnectTimer)
    if (socket && socket.readyState < WebSocket.CLOSING) socket.close()
  }
}

const formatCompactMoney = (amount: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', notation: 'compact', maximumFractionDigits: 1 }).format(amount)

function sanitizeSearch(value: string) {
  // Search is always rendered as text. Remove markup delimiters and control characters before matching.
  return value.replace(/[<>]/g, '').replace(/[\u0000-\u001F\u007F]/g, '').slice(0, 100)
}

function NetworkChart() {
  const [range, setRange] = useState('24h')
  const [hovered, setHovered] = useState<number | null>(null)
  const visibleValues = useMemo(() => range === '1h' ? chartValues.slice(-8) : range === '6h' ? chartValues.slice(-16) : range === '7d' ? chartValues.map((value, i) => Math.max(8, Math.round(value + Math.sin(i * 1.7) * 9))) : chartValues, [range])
  const points = useMemo(() => visibleValues.map((value, i) => `${40 + (i * 720) / (visibleValues.length - 1)},${184 - value * 2.7}`).join(' '), [visibleValues])
  const area = `40,184 ${points} 760,184`
  const selected = Math.min(hovered ?? Math.round((visibleValues.length - 1) * .58), visibleValues.length - 1)
  const rangeLabel = range === '1h' ? 'última hora' : range === '6h' ? 'últimas 6 horas' : range === '7d' ? 'últimos 7 dias' : 'últimas 24 horas'
  const labels = range === '1h' ? ['14:00','14:08','14:15','14:23','14:30'] : range === '6h' ? ['09:00','10:30','12:00','13:30','15:00'] : range === '7d' ? ['11 nov','12 nov','13 nov','14 nov','15 nov','16 nov','17 nov'] : hours
  return <section className="panel chart-panel" aria-labelledby="traffic-title">
    <div className="panel-heading chart-heading">
      <div><div className="eyebrow"><span className="live-dot" /> ANÁLISE DE TRÁFEGO</div><h2 id="traffic-title">Tráfego suspeito</h2><p className="panel-subtitle">Volume de conexões sinalizadas nas {rangeLabel}</p></div>
      <div className="chart-actions"><div className="segmented" role="group" aria-label="Período do gráfico">{['1h', '6h', '24h', '7d'].map(item => <button key={item} aria-pressed={range === item} className={range === item ? 'selected' : ''} onClick={() => setRange(item)}>{item}</button>)}</div><button className="icon-button" aria-label="Mais opções do gráfico"><Ellipsis size={18} /></button></div>
    </div>
    <div className="chart-summary"><strong>2.481</strong><span> eventos suspeitos</span><span className="trend-down"><ArrowDownRight size={14} /> 12,8%</span><span className="muted">vs. período anterior</span></div>
    <div className="chart-wrap" role="group" aria-label="Gráfico interativo do tráfego suspeito nas últimas 24 horas. Pico às 04 horas com 49 eventos por intervalo.">
        <svg viewBox="0 0 800 220" className="traffic-chart" preserveAspectRatio="none" role="slider" tabIndex={0} aria-label="Explorar tráfego suspeito por intervalo" aria-valuemin={0} aria-valuemax={visibleValues.length - 1} aria-valuenow={selected} aria-valuetext={`${visibleValues[selected]} eventos suspeitos`} onKeyDown={e => { if (e.key === 'ArrowRight') { e.preventDefault(); setHovered(Math.min(visibleValues.length - 1, selected + 1)) } if (e.key === 'ArrowLeft') { e.preventDefault(); setHovered(Math.max(0, selected - 1)) } }} onMouseMove={e => { const rect = e.currentTarget.getBoundingClientRect(); const ratio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width)); setHovered(Math.round(ratio * (visibleValues.length - 1))) }} onMouseLeave={() => setHovered(null)}>
        <defs><linearGradient id="areaFill" x1="0" x2="0" y1="0" y2="1"><stop offset="0%" stopColor="#34d399" stopOpacity=".22" /><stop offset="100%" stopColor="#34d399" stopOpacity="0" /></linearGradient></defs>
        {[40, 82, 124, 166, 184].map(y => <line key={y} x1="40" x2="760" y1={y} y2={y} className="grid-line" />)}
        <polygon points={area} fill="url(#areaFill)" />
        <polyline points={points} fill="none" stroke="#34d399" strokeWidth="2.2" strokeLinejoin="round" strokeLinecap="round" />
        {visibleValues.map((value, i) => value > 32 && <circle key={i} cx={40 + (i * 720) / (visibleValues.length - 1)} cy={184 - value * 2.7} r="3" fill="#34d399" opacity=".58" />)}
        <line x1={40 + (selected * 720) / (visibleValues.length - 1)} x2={40 + (selected * 720) / (visibleValues.length - 1)} y1="25" y2="184" stroke="#64748b" strokeDasharray="4 5" />
        <circle cx={40 + (selected * 720) / (visibleValues.length - 1)} cy={184 - visibleValues[selected] * 2.7} r="5" fill="#0c131c" stroke="#6ee7b7" strokeWidth="2.5" />
      </svg>
      <div className="chart-tooltip" style={{ left: `${9 + (selected / (visibleValues.length - 1)) * 81}%` }}><span>{labels[Math.round(selected / (visibleValues.length - 1) * (labels.length - 1))]} BRT</span><strong>{visibleValues[selected]} eventos</strong></div>
      <div className="chart-y-labels"><span>60</span><span>45</span><span>30</span><span>15</span><span>0</span></div>
    </div>
    <div className="chart-x-labels">{labels.map(hour => <span key={hour}>{hour}</span>)}</div>
    <div className="chart-legend"><span><i className="legend-line" /> Conexões suspeitas</span><span><i className="legend-spike" /> Pico de atividade · 04:00</span><button className="text-button" onClick={() => setHovered((selected + 1) % visibleValues.length)}>Explorar dados <ArrowUpRight size={14} /></button></div>
  </section>
}

function App() {
  const [alerts, setAlerts] = useState(initialAlerts)
  const [logs, setLogs] = useState(createSeedLogs)
  const [business, setBusiness] = useState(initialBusiness)
  const [query, setQuery] = useState('')
  const [activeNav, setActiveNav] = useState('Visão geral')
  const [toast, setToast] = useState('')
  const [menuOpen, setMenuOpen] = useState(false)
  const [tick, setTick] = useState(0)
  const [streamRunning, setStreamRunning] = useState(true)
  const [feedStatus, setFeedStatus] = useState<FeedStatus>('connecting')
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null)
  const [filtersOpen, setFiltersOpen] = useState(false)
  const [selectedLevels, setSelectedLevels] = useState<LogLine['level'][]>(logLevels)
  const [rulesEnabled, setRulesEnabled] = useState([true, true, false])
  const [investigations, setInvestigations] = useState([
    { id: 'INV-091', title: 'Tentativas de acesso · auth-gateway-01', owner: 'Marina Costa', status: 'Em andamento', time: 'há 2 min' },
    { id: 'INV-090', title: 'Análise de tráfego · db-prod-east-2', owner: 'Rafael Lima', status: 'Aguardando evidências', time: 'há 26 min' },
  ])

  useEffect(() => {
    if (!streamRunning) { setFeedStatus('offline'); return }
    return connectRealtimeFeed({
      onLog: log => {
        setTick(n => n + 1)
        setLastUpdate(new Date())
        setLogs(current => [log, ...current].slice(0, 50))
      },
      onMetrics: metrics => {
        setBusiness(current => ({ ...current, ...metrics }))
        setLastUpdate(new Date())
      },
      onStatus: setFeedStatus,
    })
  }, [streamRunning])

  useEffect(() => {
    const onShortcut = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault()
        const input = document.getElementById('log-search-input') ?? document.getElementById('explorer-search-input')
        input?.focus()
      }
    }
    window.addEventListener('keydown', onShortcut)
    return () => window.removeEventListener('keydown', onShortcut)
  }, [])

  useEffect(() => { if (!toast) return; const timer = window.setTimeout(() => setToast(''), 2800); return () => window.clearTimeout(timer) }, [toast])

  const cleanQuery = sanitizeSearch(query)
  const filteredLogs = logs.filter(log => selectedLevels.includes(log.level) && `${log.time} ${log.level} ${log.source} ${log.message} ${log.ip}`.toLowerCase().includes(cleanQuery.toLowerCase()))
  const mitigate = (id: string) => {
    setAlerts(current => current.map(alert => alert.id === id ? { ...alert, status: 'Contido' } : alert))
    setToast(`Alerta ${id} contida com sucesso`)
  }
  const submitSearch = (event: FormEvent) => { event.preventDefault(); setQuery(sanitizeSearch(query)) }
  const exportReport = () => {
    const report = { generatedAt: new Date().toISOString(), alerts, logs, streamMessages: tick }
    const file = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(file)
    const link = document.createElement('a')
    link.href = url
    link.download = `sentinel-relatorio-${new Date().toISOString().slice(0, 10)}.json`
    link.click()
    window.setTimeout(() => URL.revokeObjectURL(url), 1000)
    setToast('Relatório JSON exportado')
  }
  const createInvestigation = () => {
    const id = `INV-${String(90 + investigations.length).padStart(3, '0')}`
    setInvestigations(current => [{ id, title: 'Nova investigação · triagem manual', owner: 'Marina Costa', status: 'Em andamento', time: 'agora' }, ...current])
    setActiveNav('Investigações')
    setToast(`Investigação ${id} criada`)
  }

  const pageDescriptions: Record<string, string> = {
    'Alertas': 'Triagem e contenção das ameaças detectadas no ambiente.',
    'Investigações': 'Casos em andamento e contexto para resposta a incidentes.',
    'Ativos': 'Inventário dos dispositivos monitorados pela equipe SOC.',
    'Inteligência': 'Indicadores de comprometimento e contexto de ameaças.',
    'Log Explorer': 'Pesquise eventos recentes no stream de segurança.',
    'Regras de detecção': 'Gerencie as regras que monitoram o ambiente.',
  }
  const dateLabel = new Intl.DateTimeFormat('pt-BR', {
    weekday: 'long', day: '2-digit', month: 'long', year: 'numeric', timeZone: 'America/Sao_Paulo',
  }).format(new Date()).toLocaleUpperCase('pt-BR')
  const feedLabel: Record<FeedStatus, string> = { connecting: 'Conectando ao feed', live: 'Dados ao vivo', demo: 'Modo demonstração', offline: 'Feed pausado / indisponível' }

  return <div className="app-shell">
    <a className="skip-link" href="#main-content">Pular para o conteúdo</a>
    <aside className={`sidebar ${menuOpen ? 'sidebar-open' : ''}`} aria-label="Navegação principal">
      <div className="brand"><div className="brand-mark"><Shield size={19} strokeWidth={2.4} /></div><div><strong>sentinel<span>.</span></strong><small>SECURITY OPERATIONS</small></div><button className="mobile-close icon-button" aria-label="Fechar menu" onClick={() => setMenuOpen(false)}><X size={18} /></button></div>
      <div className="workspace-switch"><div className="workspace-avatar">N</div><div><strong>Northstar Labs</strong><span>Workspace principal</span></div><ChevronDown size={15} /></div>
      <div className="nav-label">WORKSPACE</div>
      <nav className="main-nav" aria-label="Seções do SOC">{[
        { label: 'Visão geral', icon: LayoutDashboard, count: null }, { label: 'Alertas', icon: ShieldAlert, count: '12' }, { label: 'Investigações', icon: Crosshair, count: '3' }, { label: 'Ativos', icon: Server, count: null }, { label: 'Inteligência', icon: Globe2, count: null },
      ].map(({ label, icon: Icon, count }) => <button key={label} className={`nav-item ${activeNav === label ? 'active' : ''}`} aria-current={activeNav === label ? 'page' : undefined} onClick={() => { setActiveNav(label); setMenuOpen(false) }}><Icon size={17} /><span>{label}</span>{count && <span className="nav-count">{count}</span>}</button>)}</nav>
      <div className="nav-label tools-label">FERRAMENTAS</div>
      <nav className="main-nav" aria-label="Ferramentas">{[{ label: 'Log Explorer', icon: Terminal }, { label: 'Regras de detecção', icon: SlidersHorizontal }].map(({ label, icon: Icon }) => <button key={label} className={`nav-item ${activeNav === label ? 'active' : ''}`} aria-current={activeNav === label ? 'page' : undefined} onClick={() => { setActiveNav(label); setMenuOpen(false) }}><Icon size={17} /><span>{label}</span></button>)}</nav>
      <div className="sidebar-bottom"><div className="plan-card"><div className="plan-icon"><Activity size={15} /></div><div><strong>Proteção ativa</strong><span>Todos os sistemas operacionais</span></div><span className="live-dot" /></div><button className="nav-item help-link"><CircleHelp size={17} /><span>Central de ajuda</span></button><div className="profile"><div className="profile-avatar">MC</div><div className="profile-info"><strong>Marina Costa</strong><span>Analista SOC · Nível 2</span></div><Ellipsis size={17} /></div></div>
    </aside>

    <div className="main-column">
      <header className="topbar"><button className="mobile-menu icon-button" aria-label="Abrir menu" onClick={() => setMenuOpen(true)}><Menu size={19} /></button><div className="breadcrumb"><span>Workspace</span><span className="crumb-slash">/</span><strong>{activeNav}</strong></div><div className="topbar-right"><div className="system-status" role="status"><span className={`live-dot feed-dot-${feedStatus}`} /> {feedLabel[feedStatus]}</div><span className="topbar-divider" /><button className="icon-button notification-button" aria-label="Notificações, 3 não lidas"><Bell size={18} /><i /></button><div className="top-avatar" aria-label="Perfil de Marina Costa">MC</div></div></header>
      <main id="main-content" className="main-content">
        <div className="page-intro"><div><div className="date-line"><span>{dateLabel}</span><span className="date-dot" /> <span>AMÉRICA / SÃO PAULO</span></div><h1>{activeNav}</h1><p>{activeNav === 'Visão geral' ? 'Bom dia, Marina. Acompanhe a saúde do negócio e a segurança da operação.' : pageDescriptions[activeNav]}</p></div><div className="intro-actions"><button className="button-secondary" onClick={exportReport}><Download size={15} /> Exportar relatório</button><button className="button-primary" onClick={createInvestigation}><Crosshair size={15} /> Nova investigação</button></div></div>

        {activeNav === 'Visão geral' ? <>
        <section className="business-section" aria-labelledby="business-title">
          <div className="business-heading"><div><span className="eyebrow">NORTHSTAR LABS · VISÃO DE NEGÓCIO</span><h2 id="business-title">Saúde da startup</h2></div><span className={`feed-badge feed-${feedStatus}`}><i />{feedLabel[feedStatus]}{lastUpdate && <span> · {lastUpdate.toLocaleTimeString('pt-BR')}</span>}</span></div>
          <div className="business-grid">
            <article className="business-card"><div className="business-card-top"><span className="metric-label">RECEITA RECORRENTE</span><span className="business-icon revenue-icon"><CircleDollarSign size={16} /></span></div><div className="business-value">{formatCompactMoney(business.mrr)}</div><div className="business-card-foot"><span>MRR · ARR {formatCompactMoney(business.mrr * 12)}</span><span className="business-positive"><TrendingUp size={12} /> 12,4%</span></div><div className="business-progress"><i style={{width:`${Math.min(100, 40 + business.mrr / 10000)}%`}} /></div></article>
            <article className="business-card"><div className="business-card-top"><span className="metric-label">CLIENTES ATIVOS</span><span className="business-icon customers-icon"><UsersRound size={16} /></span></div><div className="business-value">{business.customers.toLocaleString('pt-BR')}</div><div className="business-card-foot"><span>{business.newCustomers} novos neste mês</span><span className="business-positive"><TrendingUp size={12} /> 8,6%</span></div><div className="business-spark" aria-hidden="true"><i style={{height:'35%'}}/><i style={{height:'49%'}}/><i style={{height:'44%'}}/><i style={{height:'61%'}}/><i style={{height:'57%'}}/><i style={{height:'76%'}}/><i style={{height:'68%'}}/><i style={{height:'92%'}}/></div></article>
            <article className="business-card"><div className="business-card-top"><span className="metric-label">RETENÇÃO & EFICIÊNCIA</span><span className="business-icon retention-icon"><TrendingUp size={16} /></span></div><div className="business-value">{business.retention.toFixed(1).replace('.', ',')}<span className="business-unit">%</span></div><div className="business-card-foot"><span>Churn {business.churn.toFixed(1).replace('.', ',')}% · CAC {business.cacPayback.toFixed(1).replace('.', ',')}m</span><span className="business-positive">NPS {Math.round(business.nps)}</span></div><div className="business-progress retention-progress"><i style={{width:`${Math.min(100, business.retention)}%`}} /></div></article>
            <article className="business-card"><div className="business-card-top"><span className="metric-label">CAIXA & RUNWAY</span><span className="business-icon cash-icon"><Wallet size={16} /></span></div><div className="business-value">{business.burn > 0 ? Math.floor(business.cash / business.burn) : '∞'} <span className="business-unit">meses</span></div><div className="business-card-foot"><span>Caixa {formatCompactMoney(business.cash)} · burn {formatCompactMoney(business.burn)}/mês</span><span className="runway-indicator">SAUDÁVEL</span></div><div className="business-progress runway-progress"><i style={{width:`${Math.min(100, business.burn > 0 ? (business.cash / business.burn) * 4 : 100)}%`}} /></div></article>
          </div>
        </section>
        <section className="metric-grid" aria-label="Indicadores de segurança">
          <article className="metric-card"><div className="metric-top"><span className="metric-label">ALERTAS ATIVOS</span><span className="metric-icon metric-red"><AlertOctagon size={16} /></span></div><div className="metric-value">12 <span className="metric-change up"><ArrowUpRight size={13} /> 3</span></div><div className="metric-foot"><span className="metric-note">vs. 9 ontem</span><span className="mini-bars red-bars" aria-hidden="true">▂ ▃ ▂ ▅ ▃ ▄ ▆ ▅ ▇</span></div></article>
          <article className="metric-card"><div className="metric-top"><span className="metric-label">AMEAÇAS BLOQUEADAS</span><span className="metric-icon metric-green"><ShieldCheck size={16} /></span></div><div className="metric-value">248 <span className="metric-change down"><ArrowUpRight size={13} /> 18,4%</span></div><div className="metric-foot"><span className="metric-note">nas últimas 24 horas</span><span className="mini-bars green-bars" aria-hidden="true">▂ ▃ ▂ ▅ ▃ ▄ ▆ ▅ ▇</span></div></article>
          <article className="metric-card"><div className="metric-top"><span className="metric-label">TEMPO MÉDIO DE RESPOSTA</span><span className="metric-icon metric-blue"><Clock3 size={16} /></span></div><div className="metric-value">4<span className="metric-unit">m</span> 32<span className="metric-unit">s</span> <span className="metric-change down"><ArrowDownRight size={13} /> 8,2%</span></div><div className="metric-foot"><span className="metric-note">meta: abaixo de 5 min</span><span className="mini-bars blue-bars" aria-hidden="true">▂ ▃ ▂ ▅ ▃ ▄ ▆ ▅ ▇</span></div></article>
          <article className="metric-card"><div className="metric-top"><span className="metric-label">DISPOSITIVOS PROTEGIDOS</span><span className="metric-icon metric-purple"><Fingerprint size={16} /></span></div><div className="metric-value">1.284 <span className="metric-total">/ 1.310</span></div><div className="metric-foot device-foot"><span className="progress-track"><i /></span><span className="metric-note">98,0% de cobertura</span></div></article>
        </section>

        <NetworkChart />

        <section className="panel alerts-panel" aria-labelledby="alerts-title">
          <div className="panel-heading table-heading"><div><div className="eyebrow">ATENÇÃO NECESSÁRIA <span className="eyebrow-count">12</span></div><h2 id="alerts-title">Alertas prioritários</h2><p className="panel-subtitle">Ameaças que precisam da sua atenção</p></div><button className="text-button" onClick={() => { setActiveNav('Alertas'); setToast('Exibindo todos os alertas') }}>Ver todos os alertas <ArrowUpRight size={14} /></button></div>
          <div className="table-scroll"><table><thead><tr><th scope="col">ALERTA</th><th scope="col">ATIVO / ORIGEM</th><th scope="col">SEVERIDADE</th><th scope="col">STATUS</th><th scope="col">DETECTADO</th><th scope="col"><span className="sr-only">Ações</span></th></tr></thead><tbody>{alerts.map(alert => <tr key={alert.id}>
            <td><div className="alert-title"><span className={`severity-marker ${severityClass[alert.severity]}`} /><div><strong>{alert.title}</strong><span>{alert.id}</span></div></div></td><td><div className="asset-cell"><strong>{alert.asset}</strong><span>{alert.source}</span></div></td><td><span className={`severity-pill ${severityClass[alert.severity]}`}><i />{alert.severity}</span></td><td><span className={`status-label ${alert.status === 'Contido' ? 'contained' : ''}`}><i />{alert.status}</span></td><td className="time-cell">{alert.time}</td><td className="action-cell">{alert.status !== 'Contido' ? <button className="mitigate-button" onClick={() => mitigate(alert.id)} aria-label={`Conter alerta ${alert.id}`}>Conter</button> : <span className="contained-check" aria-label="Alerta contida"><Check size={15} /></span>}</td>
          </tr>)}</tbody></table></div>
        </section>

        <section className="panel logs-panel" aria-labelledby="logs-title">
          <div className="panel-heading logs-heading"><div><div className="eyebrow"><span className={`live-dot feed-dot-${feedStatus}`} /> {feedStatus === 'live' ? 'WEBSOCKET AO VIVO' : feedStatus === 'demo' ? 'SIMULAÇÃO LOCAL' : feedStatus === 'connecting' ? 'CONECTANDO' : 'STREAM INDISPONÍVEL'}</div><h2 id="logs-title">Log stream</h2><p className="panel-subtitle">Eventos recentes de segurança <span className="stream-updated">{lastUpdate ? `· atualizado às ${lastUpdate.toLocaleTimeString('pt-BR')}` : '· aguardando primeiro evento'}</span></p></div><div className="logs-controls"><span className={`stream-state ${feedStatus !== 'live' ? 'paused-state' : ''}`}><i /> {feedStatus === 'live' ? 'CONECTADO' : feedStatus === 'demo' ? 'DEMO' : feedStatus === 'connecting' ? 'CONECTANDO' : 'OFFLINE'}</span><button className="filter-button" onClick={() => setStreamRunning(value => !value)}>{streamRunning ? 'Pausar' : 'Retomar'}</button></div></div>
          <div className="log-toolbar"><form className="log-search" role="search" onSubmit={submitSearch}><Search size={15} aria-hidden="true" /><label htmlFor="log-search-input" className="sr-only">Buscar nos logs</label><input id="log-search-input" type="search" value={query} onChange={event => setQuery(sanitizeSearch(event.target.value))} placeholder="Buscar por IP, evento ou serviço..." autoComplete="off" maxLength={100} /><kbd>⌘ K</kbd></form><div className="filter-wrap"><button className="filter-button" aria-expanded={filtersOpen} aria-controls="log-filters" onClick={() => setFiltersOpen(value => !value)}><SlidersHorizontal size={14} /> Filtros</button>{filtersOpen && <div className="filter-popover" id="log-filters" role="group" aria-label="Filtrar por nível de log">{logLevels.map(level => <label key={level}><input type="checkbox" checked={selectedLevels.includes(level)} onChange={() => setSelectedLevels(current => current.includes(level) ? current.filter(item => item !== level) : [...current, level])} />{level}</label>)}<button onClick={() => setSelectedLevels(logLevels)}>Limpar filtros</button></div>}</div><span className="event-count">{filteredLogs.length} eventos</span></div>
          <div className="logs-table-wrap"><table className="logs-table"><thead><tr><th scope="col">HORÁRIO</th><th scope="col">NÍVEL</th><th scope="col">ORIGEM</th><th scope="col">EVENTO</th><th scope="col">ENDEREÇO IP</th></tr></thead><tbody>{filteredLogs.slice(0, 6).map(log => <tr key={log.id}><td className="log-time">{log.time}</td><td><span className={`log-level level-${log.level.toLowerCase()}`}>{log.level}</span></td><td className="log-source">{log.source}</td><td className="log-message">{log.message}</td><td className="log-ip">{log.ip}</td></tr>)}</tbody></table>{filteredLogs.length === 0 && <div className="empty-logs">Nenhum evento corresponde à busca.</div>}</div>
          <div className="logs-footer"><span><span className={`live-dot feed-dot-${feedStatus}`} /> {feedStatus === 'demo' ? 'Demonstração local · intervalo de 5s' : feedStatus === 'live' ? 'Conexão WebSocket ativa' : feedStatus === 'connecting' ? 'Conectando ao servidor de eventos' : 'Stream pausado ou servidor indisponível'} <span className="footer-separator">·</span> {tick} eventos nesta sessão</span><button className="text-button" onClick={() => setLogs([])}>Limpar stream <X size={13} /></button></div>
        </section>
        </> : <section className="panel secondary-panel" aria-live="polite">
          {activeNav === 'Alertas' && <><div className="secondary-heading"><div><div className="eyebrow">TRIAGEM DE INCIDENTES</div><h2>Todos os alertas</h2><p className="panel-subtitle">{alerts.filter(alert => alert.status !== 'Contido').length} alertas ativos · ações aplicadas atualizam o status local</p></div><span className="secondary-total">{alerts.length} registros</span></div><div className="secondary-list">{alerts.map(alert => <article className="secondary-row" key={alert.id}><span className={`severity-marker ${severityClass[alert.severity]}`} /><div className="secondary-row-main"><strong>{alert.title}</strong><span>{alert.id} · {alert.asset} · {alert.source}</span></div><span className={`severity-pill ${severityClass[alert.severity]}`}><i />{alert.severity}</span><span className={`status-label ${alert.status === 'Contido' ? 'contained' : ''}`}>{alert.status}</span>{alert.status !== 'Contido' && <button className="mitigate-button" onClick={() => mitigate(alert.id)}>Conter</button>}</article>)}</div></>}
          {activeNav === 'Investigações' && <><div className="secondary-heading"><div><div className="eyebrow">RESPOSTA A INCIDENTES</div><h2>Investigações</h2><p className="panel-subtitle">Acompanhe a triagem e a coleta de evidências.</p></div><button className="button-primary" onClick={createInvestigation}><Crosshair size={14} /> Criar investigação</button></div><div className="secondary-list">{investigations.map(item => <article className="secondary-row" key={item.id}><span className="investigation-icon"><Crosshair size={16} /></span><div className="secondary-row-main"><strong>{item.title}</strong><span>{item.id} · responsável: {item.owner}</span></div><span className="status-label">{item.status}</span><span className="time-cell">{item.time}</span></article>)}</div></>}
          {activeNav === 'Ativos' && <><div className="secondary-heading"><div><div className="eyebrow">INVENTÁRIO DE ENDPOINTS</div><h2>Ativos monitorados</h2><p className="panel-subtitle">Visibilidade da infraestrutura conectada ao SOC.</p></div><span className="secondary-total">1.284 protegidos</span></div><div className="secondary-list">{[['auth-gateway-01','Servidor de autenticação','10.24.2.11','Protegido'],['db-prod-east-2','Banco de dados · Produção','10.24.8.19','Atenção'],['edge-firewall-03','Firewall de borda','10.24.0.3','Protegido'],['workstation-fin-08','Estação financeira','10.24.16.203','Protegido']].map(([name,kind,ip,status]) => <article className="secondary-row" key={name}><span className="asset-icon"><Server size={16} /></span><div className="secondary-row-main"><strong>{name}</strong><span>{kind} · {ip}</span></div><span className={`asset-state ${status === 'Atenção' ? 'asset-warning' : ''}`}><i />{status}</span><button className="text-button" onClick={() => setToast(`Detalhes do ativo ${name}`)}>Detalhes <ArrowUpRight size={13} /></button></article>)}</div></>}
          {activeNav === 'Inteligência' && <><div className="secondary-heading"><div><div className="eyebrow">THREAT INTELLIGENCE</div><h2>Indicadores de ameaça</h2><p className="panel-subtitle">Indicadores correlacionados com alertas observados neste ambiente.</p></div><span className="secondary-total">Feed atualizado agora</span></div><div className="secondary-list">{[['185.220.101.42','IP · Rede Tor de saída','Tentativas de força bruta','Crítica'],['91.240.118.172','IP · Scanner automatizado','Varredura de portas','Alta'],['45.155.205.233','IP · Atividade exploratória','Tentativa de SQL injection','Alta']].map(([indicator,type,context,severity]) => <article className="secondary-row" key={indicator}><span className="intel-icon"><Globe2 size={16} /></span><div className="secondary-row-main"><strong className="mono-text">{indicator}</strong><span>{type} · {context}</span></div><span className={`severity-pill ${severityClass[severity as Severity]}`}><i />{severity}</span><button className="text-button" onClick={() => setToast(`Indicador ${indicator} copiado para análise`)}>Analisar <ArrowUpRight size={13} /></button></article>)}</div></>}
          {activeNav === 'Log Explorer' && <><div className="secondary-heading"><div><div className="eyebrow">CONSULTA DE EVENTOS</div><h2>Log Explorer</h2><p className="panel-subtitle">Use a busca e os filtros para localizar eventos recebidos nesta sessão.</p></div><span className="secondary-total">{filteredLogs.length} resultados</span></div><form className="log-search explorer-search" role="search" onSubmit={submitSearch}><Search size={15} /><label htmlFor="explorer-search-input" className="sr-only">Buscar eventos</label><input id="explorer-search-input" value={query} onChange={event => setQuery(sanitizeSearch(event.target.value))} placeholder="IP, serviço ou mensagem" maxLength={100} /><button className="text-button" type="button" onClick={() => setQuery('')}>Limpar</button></form><div className="secondary-list">{filteredLogs.map(log => <article className="secondary-row" key={log.id}><span className={`log-level level-${log.level.toLowerCase()}`}>{log.level}</span><div className="secondary-row-main"><strong>{log.message}</strong><span>{log.time} · {log.source} · {log.ip}</span></div></article>)}</div></>}
          {activeNav === 'Regras de detecção' && <><div className="secondary-heading"><div><div className="eyebrow">POLÍTICAS DE MONITORAMENTO</div><h2>Regras de detecção</h2><p className="panel-subtitle">Ative ou pause regras de monitoramento locais.</p></div><span className="secondary-total">{rulesEnabled.filter(Boolean).length} ativas</span></div><div className="secondary-list">{[['Força bruta em autenticação','Detecta tentativas repetidas de login por origem.','Alta'],['Exfiltração de dados','Sinaliza volume de saída fora do comportamento esperado.','Crítica'],['Execução suspeita em endpoint','Correlaciona processos raros e mudanças no sistema.','Média']].map(([name,description,severity],index) => <article className="secondary-row" key={name}><span className="rule-icon"><SlidersHorizontal size={16} /></span><div className="secondary-row-main"><strong>{name}</strong><span>{description}</span></div><span className={`severity-pill ${severityClass[severity as Severity]}`}><i />{severity}</span><label className="switch-control"><input type="checkbox" checked={rulesEnabled[index]} onChange={() => setRulesEnabled(current => current.map((enabled,i) => i === index ? !enabled : enabled))} /><span className="switch-track" /><span className="sr-only">Ativar regra {name}</span></label></article>)}</div></>}
        </section>}
        <footer className="page-footer"><span><Activity size={12} /> {feedStatus === 'demo' ? 'Dados locais demonstrativos' : feedStatus === 'live' ? 'Feed conectado via WebSocket' : 'Conecte um feed para dados atualizados'}</span><span>Northstar Labs <b>·</b> Painel executivo</span></footer>
      </main>
    </div>
    {menuOpen && <button className="sidebar-scrim" aria-label="Fechar menu" onClick={() => setMenuOpen(false)} />}
    {toast && <div className="toast" role="status" aria-live="polite"><span><Check size={15} /></span>{toast}<button onClick={() => setToast('')} aria-label="Dispensar notificação"><X size={14} /></button></div>}
    <div className="sr-only" aria-live="polite" aria-atomic="true">{tick > 0 ? `Stream atualizado. ${tick} novos eventos recebidos.` : ''}</div>
  </div>
}

export default App
