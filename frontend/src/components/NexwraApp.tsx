import { useState, useRef, useEffect } from "react";

/* ── DATA ────────────────────────────────────────────────────────────────── */
const AGENTS = [
  { id: "researcher", role: "Senior Research Analyst", icon: "🔬", color: "#7c3aed", glow: "#7c3aed44", tag: "Research", desc: "Deep-dives into any domain with 94%+ confidence scoring. Aggregates 100+ sources in seconds.", skills: ["Market Intel", "Data Mining", "Trend Forecasting"] },
  { id: "writer", role: "Technical Writer", icon: "✍️", color: "#06b6d4", glow: "#06b6d444", tag: "Content", desc: "Transforms raw data into executive-grade documents, reports, and narratives that convert.", skills: ["Executive Briefs", "API Docs", "Storytelling"] },
  { id: "engineer", role: "Software Architect", icon: "⚡", color: "#a78bfa", glow: "#a78bfa44", tag: "Code", desc: "Designs scalable systems and writes production-ready code across 20+ languages and frameworks.", skills: ["System Design", "Code Review", "DevOps"] },
  { id: "strategist", role: "Business Strategist", icon: "🎯", color: "#f43f5e", glow: "#f43f5e44", tag: "Strategy", desc: "Ex-McKinsey level analysis. Builds frameworks, models, and go-to-market plans that win.", skills: ["GTM Strategy", "SWOT", "Financial Models"] },
  { id: "designer", role: "UX/Product Designer", icon: "🎨", color: "#34d399", glow: "#34d39944", tag: "Design", desc: "Ships pixel-perfect experiences. Obsessed with conversion, clarity and delight.", skills: ["User Research", "Prototyping", "Design Systems"] },
  { id: "analyst", role: "Data Scientist", icon: "📊", color: "#fb923c", glow: "#fb923c44", tag: "Analytics", desc: "Builds predictive models and extracts actionable insights from any dataset at scale.", skills: ["ML Models", "Statistical Analysis", "Visualization"] },
];

const TASKS = [
  "Create a comprehensive market analysis report for AI tools in 2025",
  "Build a Python microservice for real-time data processing pipeline",
  "Design a go-to-market strategy for a B2B SaaS product launch",
  "Research latest advances in quantum computing & write an executive summary",
  "Competitive analysis of top 10 LLM providers with pricing breakdown",
  "Design a full-stack architecture for a multi-tenant AI platform",
];

const MODES = [
  { id: "sequential", label: "Sequential", icon: "→", desc: "Agents run one after another" },
  { id: "hierarchical", label: "Hierarchical", icon: "⬡", desc: "Manager delegates to workers" },
  { id: "consensus", label: "Consensus", icon: "◉", desc: "All agents vote on decisions" },
];

const OUTPUTS: Record<string, string[]> = {
  researcher: [
    "🔬 RESEARCH COMPLETE — Confidence: 96.4%",
    "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━",
    "",
    "📌 KEY FINDINGS",
    "   Market size: $47.2B  │  YoY Growth: 34.2%",
    "   Adoption rate: 68%   │  Churn risk: 12.4%",
    "   Top segment: Enterprise (62% of revenue)",
    "",
    "📊 COMPETITIVE LANDSCAPE",
    "   Leader:    OpenAI    — 38% market share",
    "   Challenger: Anthropic — 22% market share",
    "   Disruptor:  Groq     — fastest inference",
    "",
    "⚡ OPPORTUNITY WINDOW",
    "   SMB segment: 84% underserved",
    "   Regulation gap: 18-month window",
    "   Recommendation: AGGRESSIVE expansion",
    "",
    "Sources: 142 papers  │  38 reports  │  12 interviews",
  ],
  writer: [
    "✍️  EXECUTIVE REPORT GENERATED",
    "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━",
    "",
    "EXECUTIVE SUMMARY",
    "The AI tooling landscape represents a once-in-a-decade",
    "transformational opportunity. Three vectors define success:",
    "",
    "   1. Proprietary data moats (defensibility)",
    "   2. Network effect flywheel (scalability)",
    "   3. Compliance-first architecture (trust)",
    "",
    "STRATEGIC RECOMMENDATION",
    "   Phase 1: Seed PLG motion — Q1 2025",
    "   Phase 2: Enterprise upsell — Q3 2025",
    "   Phase 3: Platform expansion — Q1 2026",
    "",
    "PROJECTED OUTCOME",
    "   ARR Target: $2.4M  │  Payback: 14 months",
    "   NRR Target: 128%   │  CAC Ratio: 3.2x",
  ],
  engineer: [
    "⚡ ARCHITECTURE DESIGN COMPLETE",
    "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━",
    "",
    "SYSTEM BLUEPRINT",
    "   API Layer:     FastAPI (async) + GraphQL",
    "   Orchestration: LangChain + LangGraph",
    "   Database:      PostgreSQL + Redis + Pinecone",
    "   Infra:         K8s + Terraform + AWS EKS",
    "",
    "CORE MODULES",
    "   ├─ agent_core/     — base agent framework",
    "   ├─ memory/         — short + long term memory",
    "   ├─ tools/          — 40+ tool integrations",
    "   └─ orchestrator/   — crew coordination",
    "",
    "PERFORMANCE TARGETS",
    "   Latency p99: <200ms  │  Throughput: 10K rps",
    "   Test coverage: 94%   │  Uptime SLA: 99.99%",
  ],
  strategist: [
    "🎯 STRATEGIC FRAMEWORK COMPLETE",
    "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━",
    "",
    "SWOT MATRIX",
    "   ✅ Strengths:  First-mover, proprietary tech",
    "   ⚠️  Weaknesses: Brand awareness, sales cycle",
    "   🚀 Opportunities: $12B TAM, regulation gap",
    "   🛡️  Threats: Big Tech entry, commoditization",
    "",
    "GO-TO-MARKET PLAYBOOK",
    "   Motion:   Product-Led Growth → Enterprise",
    "   ICP:      Series A-C startups, 50-500 emp",
    "   Channel:  Content SEO + Community + Outbound",
    "",
    "FINANCIAL PROJECTIONS",
    "   Year 1 ARR: $2.4M  │  Team Size: 18",
    "   Year 2 ARR: $8.9M  │  Team Size: 42",
    "   Year 3 ARR: $24M   │  Exit Multiple: 18x",
  ],
  designer: [
    "🎨 UX DESIGN SYSTEM COMPLETE",
    "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━",
    "",
    "USER RESEARCH INSIGHTS  (n=240)",
    "   Primary pain: cognitive overload (78%)",
    "   Desired: speed & clarity (91%)",
    "   Device split: 68% desktop / 32% mobile",
    "",
    "DESIGN PRINCIPLES",
    "   01  Clarity over cleverness",
    "   02  Speed as a core feature",
    "   03  Progressive disclosure UX",
    "   04  Delight in micro-interactions",
    "",
    "DELIVERABLES",
    "   Components: 48  │  Page templates: 6",
    "   Icon system: 240 icons  │  Tokens: 120",
    "   Figma file: 840 frames  │  Prototype: done",
  ],
  analyst: [
    "📊 DATA ANALYSIS COMPLETE",
    "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━",
    "",
    "DATASET SUMMARY",
    "   Records: 2.4M  │  Processed: 3.2s",
    "   Features: 84   │  Missing: 0.3%",
    "",
    "STATISTICAL INSIGHTS",
    "   Conversion mean: 3.7%  (σ = 0.82)",
    "   Top predictor: engagement_score (r=0.91)",
    "   Anomaly: +340% spike at T+14 days",
    "",
    "MODEL PERFORMANCE",
    "   Algorithm: XGBoost + LightGBM ensemble",
    "   AUC: 0.947  │  Precision: 0.891",
    "   Recall: 0.912  │  F1: 0.901",
    "",
    "RECOMMENDATION",
    "   Target high-engagement cohort first →",
    "   Expected uplift: +42% conversion rate",
  ],
};

type AgentData = typeof AGENTS[0];
interface OutputEntry { agentId: string; role: string; icon: string; color: string; lines: string[]; status: "waiting" | "running" | "done"; }

/* ── MAIN COMPONENT ─────────────────────────────────────────────────────── */
export default function NexwraApp() {
  const [tab, setTab] = useState<"build" | "config" | "logs">("build");
  const [selected, setSelected] = useState<AgentData[]>([]);
  const [task, setTask] = useState("");
  const [mode, setMode] = useState("sequential");
  const [crewName, setCrewName] = useState("Alpha Crew");
  const [running, setRunning] = useState(false);
  const [outputs, setOutputs] = useState<OutputEntry[]>([]);
  const [elapsed, setElapsed] = useState(0);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const logsEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const move = (e: MouseEvent) => setMousePos({ x: e.clientX, y: e.clientY });
    window.addEventListener("mousemove", move);
    return () => window.removeEventListener("mousemove", move);
  }, []);

  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [outputs]);

  const toggle = (a: AgentData) =>
    setSelected((p) => p.find((x) => x.id === a.id) ? p.filter((x) => x.id !== a.id) : [...p, a]);

  const deploy = async () => {
    if (!task || selected.length === 0) return;
    setRunning(true);
    setTab("logs");
    setOutputs(selected.map((a) => ({ agentId: a.id, role: a.role, icon: a.icon, color: a.color, lines: [], status: "waiting" })));
    const start = Date.now();
    const iv = setInterval(() => setElapsed(Math.floor((Date.now() - start) / 1000)), 500);

    for (let i = 0; i < selected.length; i++) {
      const ag = selected[i];
      setOutputs((p) => p.map((o, idx) => idx === i ? { ...o, status: "running" } : o));
      await new Promise((r) => setTimeout(r, 700 + Math.random() * 500));

      const fullLines = OUTPUTS[ag.id] || OUTPUTS.researcher;
      // Stream lines
      for (let l = 0; l < fullLines.length; l++) {
        await new Promise((r) => setTimeout(r, 40 + Math.random() * 30));
        setOutputs((p) => p.map((o, idx) => idx === i ? { ...o, lines: fullLines.slice(0, l + 1) } : o));
      }
      setOutputs((p) => p.map((o, idx) => idx === i ? { ...o, status: "done" } : o));
      await new Promise((r) => setTimeout(r, 200));
    }

    clearInterval(iv);
    setRunning(false);
  };

  return (
    <div style={{ minHeight: "100vh", background: "#06010f", color: "#e8e4ff", fontFamily: "'Segoe UI', system-ui, sans-serif", display: "flex", flexDirection: "column", position: "relative", overflow: "hidden" }}>

      {/* Mouse glow follower */}
      <div style={{
        position: "fixed", pointerEvents: "none", zIndex: 0,
        width: "600px", height: "600px",
        borderRadius: "50%",
        background: "radial-gradient(circle, rgba(124,58,237,0.06) 0%, transparent 70%)",
        left: mousePos.x - 300, top: mousePos.y - 300,
        transition: "left 0.4s ease, top 0.4s ease",
      }} />

      {/* Ambient orbs */}
      <div style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 0 }}>
        <div style={{ position: "absolute", top: "-200px", left: "-200px", width: "600px", height: "600px", borderRadius: "50%", background: "radial-gradient(circle, rgba(124,58,237,0.08) 0%, transparent 70%)", filter: "blur(40px)" }} />
        <div style={{ position: "absolute", bottom: "-200px", right: "-200px", width: "600px", height: "600px", borderRadius: "50%", background: "radial-gradient(circle, rgba(6,182,212,0.06) 0%, transparent 70%)", filter: "blur(40px)" }} />
        <div style={{ position: "absolute", top: "40%", right: "-100px", width: "400px", height: "400px", borderRadius: "50%", background: "radial-gradient(circle, rgba(244,63,94,0.05) 0%, transparent 70%)", filter: "blur(30px)" }} />
      </div>

      {/* ── HEADER ──────────────────────────────────────────────────────── */}
      <header style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "0 28px", height: "60px",
        borderBottom: "1px solid rgba(124,58,237,0.15)",
        backdropFilter: "blur(20px)",
        background: "rgba(6,1,15,0.7)",
        position: "sticky", top: 0, zIndex: 100,
      }}>
        {/* Logo */}
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <div style={{
            width: "34px", height: "34px", borderRadius: "10px",
            background: "linear-gradient(135deg, #7c3aed, #06b6d4)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: "16px", boxShadow: "0 0 20px rgba(124,58,237,0.4)",
          }}>⚡</div>
          <div>
            <div style={{
              fontWeight: 900, fontSize: "18px", letterSpacing: "-0.03em", lineHeight: 1,
              background: "linear-gradient(135deg, #fff 0%, #c4b5fd 40%, #06b6d4 100%)",
              WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text",
            }}>NEXWRA</div>
            <div style={{ fontSize: "8px", letterSpacing: "0.2em", color: "rgba(124,58,237,0.5)", textTransform: "uppercase", lineHeight: 1 }}>AI Workforce</div>
          </div>
          <div style={{ width: "1px", height: "24px", background: "rgba(124,58,237,0.2)", margin: "0 8px" }} />
          <div style={{ display: "flex", alignItems: "center", gap: "5px" }}>
            <div style={{ width: "5px", height: "5px", borderRadius: "50%", background: "#34d399", boxShadow: "0 0 8px #34d399", animation: "blink2 2s infinite" }} />
            <span style={{ fontSize: "10px", color: "rgba(52,211,153,0.7)", letterSpacing: "0.1em" }}>LIVE</span>
          </div>
        </div>

        {/* Nav */}
        <nav style={{ display: "flex", gap: "4px", background: "rgba(255,255,255,0.03)", padding: "4px", borderRadius: "12px", border: "1px solid rgba(124,58,237,0.12)" }}>
          {[
            { id: "build", label: "Build Crew", icon: "⚡" },
            { id: "config", label: "Configure", icon: "⚙️" },
            { id: "logs", label: "Mission Logs", icon: "📡" },
          ].map(({ id, label, icon }) => (
            <button key={id} onClick={() => setTab(id as typeof tab)} style={{
              padding: "7px 18px", borderRadius: "8px",
              border: tab === id ? "1px solid rgba(124,58,237,0.5)" : "1px solid transparent",
              background: tab === id ? "linear-gradient(135deg, rgba(124,58,237,0.2), rgba(6,182,212,0.1))" : "transparent",
              color: tab === id ? "#c4b5fd" : "rgba(167,139,250,0.4)",
              fontSize: "12px", cursor: "pointer", transition: "all 0.2s",
              display: "flex", alignItems: "center", gap: "6px", fontWeight: tab === id ? 600 : 400,
              boxShadow: tab === id ? "0 0 20px rgba(124,58,237,0.15)" : "none",
            }}>
              <span>{icon}</span>{label}
              {id === "logs" && outputs.length > 0 && (
                <span style={{ width: "16px", height: "16px", borderRadius: "50%", background: "rgba(124,58,237,0.4)", fontSize: "9px", display: "flex", alignItems: "center", justifyContent: "center", color: "#c4b5fd" }}>
                  {outputs.length}
                </span>
              )}
            </button>
          ))}
        </nav>

        {/* Right */}
        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: "9px", letterSpacing: "0.15em", color: "rgba(167,139,250,0.35)", textTransform: "uppercase" }}>developed by</div>
            <div style={{ fontSize: "12px", letterSpacing: "0.2em", color: "rgba(167,139,250,0.75)", textTransform: "uppercase", fontWeight: 700 }}>VedX</div>
          </div>
          <div style={{ width: "34px", height: "34px", borderRadius: "50%", background: "linear-gradient(135deg, rgba(124,58,237,0.3), rgba(6,182,212,0.2))", border: "1px solid rgba(124,58,237,0.3)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "14px" }}>V</div>
        </div>
      </header>

      {/* ── BUILD TAB ────────────────────────────────────────────────────── */}
      {tab === "build" && (
        <main style={{ flex: 1, display: "grid", gridTemplateColumns: "1fr 360px", gap: "0", overflow: "hidden", position: "relative", zIndex: 1 }}>

          {/* LEFT */}
          <div style={{ overflowY: "auto", padding: "32px", borderRight: "1px solid rgba(124,58,237,0.1)" }}>
            {/* Heading */}
            <div style={{ marginBottom: "28px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "6px" }}>
                <div style={{ width: "3px", height: "20px", background: "linear-gradient(180deg, #7c3aed, #06b6d4)", borderRadius: "2px" }} />
                <h2 style={{ fontSize: "22px", fontWeight: 700, color: "#fff", margin: 0 }}>Agent Library</h2>
                <span style={{ fontSize: "10px", padding: "2px 8px", borderRadius: "4px", background: "rgba(124,58,237,0.15)", border: "1px solid rgba(124,58,237,0.25)", color: "#a78bfa", letterSpacing: "0.1em" }}>
                  {AGENTS.length} AGENTS
                </span>
              </div>
              <p style={{ fontSize: "13px", color: "rgba(167,139,250,0.5)", margin: 0 }}>Select specialist agents to compose your AI workforce</p>
            </div>

            {/* Agent grid */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "16px" }}>
              {AGENTS.map((a) => {
                const sel = !!selected.find((x) => x.id === a.id);
                return (
                  <button key={a.id} onClick={() => toggle(a)} style={{
                    position: "relative", overflow: "hidden", textAlign: "left",
                    padding: "20px", borderRadius: "16px", cursor: "pointer",
                    border: `1px solid ${sel ? a.color + "55" : "rgba(124,58,237,0.12)"}`,
                    background: sel
                      ? `linear-gradient(135deg, ${a.color}12, ${a.color}06)`
                      : "rgba(255,255,255,0.018)",
                    boxShadow: sel ? `0 0 30px ${a.color}22, inset 0 0 20px ${a.color}08` : "none",
                    transition: "all 0.3s cubic-bezier(0.4,0,0.2,1)",
                    transform: sel ? "scale(1.01)" : "scale(1)",
                  }}>
                    {/* Glow top-right */}
                    {sel && <div style={{ position: "absolute", top: "-40px", right: "-40px", width: "120px", height: "120px", borderRadius: "50%", background: `radial-gradient(circle, ${a.color}30, transparent)`, pointerEvents: "none" }} />}

                    {/* Top row */}
                    <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "12px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                        <div style={{
                          width: "44px", height: "44px", borderRadius: "12px", fontSize: "22px",
                          display: "flex", alignItems: "center", justifyContent: "center",
                          background: `linear-gradient(135deg, ${a.color}22, ${a.color}0a)`,
                          border: `1px solid ${a.color}33`,
                          boxShadow: sel ? `0 0 16px ${a.color}44` : "none",
                        }}>{a.icon}</div>
                        <div>
                          <div style={{ fontSize: "13px", fontWeight: 700, color: sel ? "#fff" : "#d1c4ff", lineHeight: 1.2 }}>{a.role}</div>
                          <div style={{ fontSize: "10px", padding: "2px 6px", borderRadius: "4px", background: `${a.color}22`, color: a.color, marginTop: "4px", display: "inline-block", letterSpacing: "0.05em" }}>{a.tag}</div>
                        </div>
                      </div>
                      <div style={{
                        width: "22px", height: "22px", borderRadius: "50%",
                        border: `2px solid ${sel ? a.color : "rgba(124,58,237,0.3)"}`,
                        background: sel ? a.color : "transparent",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        fontSize: "11px", color: "#fff", flexShrink: 0,
                        transition: "all 0.2s",
                        boxShadow: sel ? `0 0 12px ${a.color}66` : "none",
                      }}>{sel ? "✓" : ""}</div>
                    </div>

                    <p style={{ fontSize: "12px", color: "rgba(167,139,250,0.6)", lineHeight: 1.6, marginBottom: "12px", margin: "0 0 12px 0" }}>{a.desc}</p>

                    {/* Skills */}
                    <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
                      {a.skills.map((s) => (
                        <span key={s} style={{ fontSize: "10px", padding: "3px 8px", borderRadius: "4px", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(124,58,237,0.15)", color: "rgba(167,139,250,0.6)" }}>{s}</span>
                      ))}
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Quick task examples */}
            <div style={{ marginTop: "36px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "14px" }}>
                <div style={{ width: "3px", height: "16px", background: "linear-gradient(180deg, #06b6d4, transparent)", borderRadius: "2px" }} />
                <h3 style={{ fontSize: "14px", fontWeight: 600, color: "#c4b5fd", margin: 0 }}>Quick Task Templates</h3>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
                {TASKS.map((t) => (
                  <button key={t} onClick={() => setTask(t)} style={{
                    padding: "10px 14px", borderRadius: "10px", textAlign: "left", cursor: "pointer",
                    border: task === t ? "1px solid rgba(124,58,237,0.4)" : "1px solid rgba(124,58,237,0.1)",
                    background: task === t ? "rgba(124,58,237,0.12)" : "rgba(255,255,255,0.02)",
                    color: task === t ? "#c4b5fd" : "rgba(167,139,250,0.5)",
                    fontSize: "11px", lineHeight: 1.5, transition: "all 0.2s",
                  }}>
                    {t}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* RIGHT PANEL */}
          <div style={{ overflowY: "auto", padding: "24px", display: "flex", flexDirection: "column", gap: "16px", background: "rgba(0,0,0,0.15)" }}>

            {/* Crew name */}
            <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(124,58,237,0.15)", borderRadius: "14px", padding: "18px" }}>
              <label style={{ fontSize: "10px", letterSpacing: "0.2em", color: "rgba(167,139,250,0.5)", textTransform: "uppercase", display: "block", marginBottom: "8px" }}>Crew Name</label>
              <input value={crewName} onChange={(e) => setCrewName(e.target.value)} style={{
                width: "100%", background: "rgba(124,58,237,0.08)", border: "1px solid rgba(124,58,237,0.2)",
                borderRadius: "8px", padding: "9px 12px", color: "#fff", fontSize: "14px", fontWeight: 600, outline: "none",
                boxSizing: "border-box",
              }} />
            </div>

            {/* Process mode */}
            <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(124,58,237,0.15)", borderRadius: "14px", padding: "18px" }}>
              <label style={{ fontSize: "10px", letterSpacing: "0.2em", color: "rgba(167,139,250,0.5)", textTransform: "uppercase", display: "block", marginBottom: "10px" }}>Process Mode</label>
              <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                {MODES.map((m) => (
                  <button key={m.id} onClick={() => setMode(m.id)} style={{
                    display: "flex", alignItems: "center", gap: "10px",
                    padding: "10px 12px", borderRadius: "8px", cursor: "pointer", textAlign: "left",
                    border: `1px solid ${mode === m.id ? "rgba(124,58,237,0.5)" : "rgba(124,58,237,0.1)"}`,
                    background: mode === m.id ? "rgba(124,58,237,0.15)" : "transparent",
                    transition: "all 0.2s",
                  }}>
                    <span style={{ fontSize: "16px", width: "24px", textAlign: "center", color: mode === m.id ? "#a78bfa" : "rgba(124,58,237,0.4)" }}>{m.icon}</span>
                    <div>
                      <div style={{ fontSize: "12px", fontWeight: 600, color: mode === m.id ? "#c4b5fd" : "rgba(167,139,250,0.5)" }}>{m.label}</div>
                      <div style={{ fontSize: "10px", color: "rgba(124,58,237,0.4)" }}>{m.desc}</div>
                    </div>
                    {mode === m.id && <div style={{ marginLeft: "auto", width: "6px", height: "6px", borderRadius: "50%", background: "#7c3aed", boxShadow: "0 0 8px #7c3aed" }} />}
                  </button>
                ))}
              </div>
            </div>

            {/* Selected agents */}
            <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(124,58,237,0.15)", borderRadius: "14px", padding: "18px", minHeight: "100px" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "10px" }}>
                <label style={{ fontSize: "10px", letterSpacing: "0.2em", color: "rgba(167,139,250,0.5)", textTransform: "uppercase" }}>Active Agents</label>
                <span style={{ fontSize: "11px", color: "#a78bfa", fontWeight: 700 }}>{selected.length}/6</span>
              </div>
              {selected.length === 0 ? (
                <div style={{ textAlign: "center", padding: "20px 0", color: "rgba(124,58,237,0.3)", fontSize: "12px" }}>← Select agents from library</div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                  {selected.map((a, idx) => (
                    <div key={a.id} style={{ display: "flex", alignItems: "center", gap: "8px", padding: "8px 10px", borderRadius: "8px", background: `${a.color}0e`, border: `1px solid ${a.color}28` }}>
                      <span style={{ fontSize: "12px", color: "rgba(167,139,250,0.4)", fontFamily: "monospace", width: "16px" }}>{String(idx + 1).padStart(2, "0")}</span>
                      <span style={{ fontSize: "16px" }}>{a.icon}</span>
                      <span style={{ fontSize: "12px", color: "#e8e4ff", flex: 1, fontWeight: 500 }}>{a.role}</span>
                      <button onClick={() => toggle(a)} style={{ background: "none", border: "none", color: "rgba(167,139,250,0.35)", cursor: "pointer", fontSize: "14px", lineHeight: 1, padding: "0 2px" }}>×</button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Task */}
            <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(124,58,237,0.15)", borderRadius: "14px", padding: "18px" }}>
              <label style={{ fontSize: "10px", letterSpacing: "0.2em", color: "rgba(167,139,250,0.5)", textTransform: "uppercase", display: "block", marginBottom: "8px" }}>Mission Brief</label>
              <textarea value={task} onChange={(e) => setTask(e.target.value)}
                placeholder="Describe the mission for your crew..."
                rows={4} style={{
                  width: "100%", background: "rgba(124,58,237,0.06)", border: "1px solid rgba(124,58,237,0.2)",
                  borderRadius: "8px", padding: "10px 12px", color: "#e8e4ff", fontSize: "13px",
                  resize: "none", outline: "none", fontFamily: "inherit", lineHeight: 1.6,
                  boxSizing: "border-box",
                }} />
            </div>

            {/* Deploy button */}
            <button onClick={deploy} disabled={running || selected.length === 0 || !task} style={{
              padding: "16px", borderRadius: "12px", border: "none", cursor: running || !task || selected.length === 0 ? "not-allowed" : "pointer",
              background: running || !task || selected.length === 0
                ? "rgba(124,58,237,0.15)"
                : "linear-gradient(135deg, #7c3aed 0%, #4f46e5 40%, #06b6d4 100%)",
              color: running || !task || selected.length === 0 ? "rgba(167,139,250,0.4)" : "#fff",
              fontWeight: 800, fontSize: "15px", letterSpacing: "0.08em",
              transition: "all 0.3s",
              boxShadow: running || !task || selected.length === 0 ? "none" : "0 4px 40px rgba(124,58,237,0.5), 0 0 80px rgba(6,182,212,0.15)",
              textTransform: "uppercase",
              position: "relative", overflow: "hidden",
            }}>
              {running ? (
                <span style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }}>
                  <span style={{ display: "inline-block", width: "14px", height: "14px", border: "2px solid rgba(167,139,250,0.4)", borderTopColor: "#a78bfa", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
                  Running Mission…
                </span>
              ) : "🚀 Deploy AI Crew"}
            </button>

            {/* Stats */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "8px" }}>
              {[
                { label: "Agents", val: selected.length || 0, color: "#7c3aed" },
                { label: "Tasks", val: task ? 1 : 0, color: "#06b6d4" },
                { label: "Mode", val: mode === "sequential" ? "SEQ" : mode === "hierarchical" ? "HIE" : "CON", color: "#f0abfc" },
              ].map(({ label, val, color }) => (
                <div key={label} style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(124,58,237,0.1)", borderRadius: "10px", padding: "12px", textAlign: "center" }}>
                  <div style={{ fontSize: "18px", fontWeight: 800, color, fontFamily: "monospace" }}>{val}</div>
                  <div style={{ fontSize: "9px", color: "rgba(167,139,250,0.4)", letterSpacing: "0.15em", textTransform: "uppercase", marginTop: "2px" }}>{label}</div>
                </div>
              ))}
            </div>
          </div>
        </main>
      )}

      {/* ── CONFIG TAB ───────────────────────────────────────────────────── */}
      {tab === "config" && (
        <main style={{ flex: 1, overflowY: "auto", padding: "32px", maxWidth: "760px", margin: "0 auto", width: "100%", position: "relative", zIndex: 1 }}>
          <div style={{ marginBottom: "28px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "6px" }}>
              <div style={{ width: "3px", height: "20px", background: "linear-gradient(180deg, #7c3aed, #06b6d4)", borderRadius: "2px" }} />
              <h2 style={{ fontSize: "22px", fontWeight: 700, color: "#fff", margin: 0 }}>Pipeline Configuration</h2>
            </div>
            <p style={{ fontSize: "13px", color: "rgba(167,139,250,0.5)", margin: 0 }}>Advanced settings and integrations for your AI orchestration engine</p>
          </div>

          {/* LLM Settings */}
          <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(124,58,237,0.15)", borderRadius: "16px", padding: "24px", marginBottom: "16px" }}>
            <h3 style={{ fontSize: "14px", fontWeight: 700, color: "#c4b5fd", marginBottom: "16px", display: "flex", alignItems: "center", gap: "8px" }}>
              <span>🧠</span> Language Model
            </h3>
            {[
              { l: "Model", v: "GPT-4o (Latest)", badge: "RECOMMENDED" },
              { l: "Temperature", v: "0.72", badge: "" },
              { l: "Max Tokens", v: "4,096", badge: "" },
              { l: "Context Window", v: "128K tokens", badge: "MAX" },
            ].map(({ l, v, badge }) => (
              <div key={l} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 0", borderBottom: "1px solid rgba(124,58,237,0.08)" }}>
                <span style={{ fontSize: "13px", color: "rgba(167,139,250,0.7)" }}>{l}</span>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  {badge && <span style={{ fontSize: "9px", padding: "2px 6px", borderRadius: "4px", background: "rgba(52,211,153,0.15)", color: "#34d399", letterSpacing: "0.1em" }}>{badge}</span>}
                  <span style={{ fontSize: "13px", color: "#c4b5fd", fontWeight: 600, fontFamily: "monospace" }}>{v}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Memory & Tools */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "16px" }}>
            {[
              { title: "🧩 Memory", items: [{ l: "Short-term", v: "Enabled" }, { l: "Long-term", v: "Vector DB" }, { l: "Shared", v: "Crew-wide" }] },
              { title: "🔧 Execution", items: [{ l: "Max Iterations", v: "15" }, { l: "Verbose", v: "On" }, { l: "Output Format", v: "MD + JSON" }] },
            ].map(({ title, items }) => (
              <div key={title} style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(124,58,237,0.15)", borderRadius: "16px", padding: "20px" }}>
                <h3 style={{ fontSize: "14px", fontWeight: 700, color: "#c4b5fd", marginBottom: "14px" }}>{title}</h3>
                {items.map(({ l, v }) => (
                  <div key={l} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0", borderBottom: "1px solid rgba(124,58,237,0.07)" }}>
                    <span style={{ fontSize: "12px", color: "rgba(167,139,250,0.6)" }}>{l}</span>
                    <span style={{ fontSize: "12px", color: "#a78bfa", fontFamily: "monospace" }}>{v}</span>
                  </div>
                ))}
              </div>
            ))}
          </div>

          {/* API Keys */}
          <div style={{ background: "linear-gradient(135deg, rgba(124,58,237,0.08), rgba(6,182,212,0.05))", border: "1px solid rgba(124,58,237,0.2)", borderRadius: "16px", padding: "24px" }}>
            <h3 style={{ fontSize: "14px", fontWeight: 700, color: "#c4b5fd", marginBottom: "8px" }}>🔌 API Integrations</h3>
            <p style={{ fontSize: "12px", color: "rgba(167,139,250,0.45)", marginBottom: "16px" }}>Connect your LLM providers for live execution</p>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
              {[
                { name: "OpenAI", status: "Connected", color: "#34d399" },
                { name: "Anthropic", status: "Available", color: "rgba(167,139,250,0.3)" },
                { name: "Groq", status: "Available", color: "rgba(167,139,250,0.3)" },
                { name: "Google Gemini", status: "Available", color: "rgba(167,139,250,0.3)" },
              ].map(({ name, status, color }) => (
                <div key={name} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 14px", borderRadius: "10px", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(124,58,237,0.12)" }}>
                  <span style={{ fontSize: "12px", color: "#c4b5fd" }}>{name}</span>
                  <span style={{ fontSize: "10px", color, letterSpacing: "0.1em" }}>{status}</span>
                </div>
              ))}
            </div>
          </div>
        </main>
      )}

      {/* ── LOGS TAB ─────────────────────────────────────────────────────── */}
      {tab === "logs" && (
        <main style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden", position: "relative", zIndex: 1 }}>
          {/* Mission status bar */}
          <div style={{
            padding: "14px 28px", borderBottom: "1px solid rgba(124,58,237,0.1)",
            background: "rgba(0,0,0,0.2)",
            display: "flex", alignItems: "center", justifyContent: "space-between",
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
              {running && <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#06b6d4", boxShadow: "0 0 10px #06b6d4", animation: "blink2 1s infinite" }} />
                <span style={{ fontSize: "12px", color: "#06b6d4", fontWeight: 600, letterSpacing: "0.05em" }}>MISSION ACTIVE</span>
              </div>}
              {!running && outputs.length > 0 && (
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#34d399", boxShadow: "0 0 10px #34d399" }} />
                  <span style={{ fontSize: "12px", color: "#34d399", fontWeight: 600 }}>MISSION COMPLETE</span>
                </div>
              )}
              <span style={{ fontSize: "13px", color: "rgba(167,139,250,0.6)" }}>{crewName}</span>
              {running && <span style={{ fontFamily: "monospace", fontSize: "12px", color: "rgba(124,58,237,0.6)" }}>{elapsed}s</span>}
            </div>
            <div style={{ display: "flex", gap: "8px" }}>
              {[
                { label: "Agents", val: selected.length },
                { label: "Done", val: outputs.filter((o) => o.status === "done").length },
                { label: "Running", val: outputs.filter((o) => o.status === "running").length },
              ].map(({ label, val }) => (
                <div key={label} style={{ padding: "4px 12px", borderRadius: "6px", background: "rgba(124,58,237,0.1)", border: "1px solid rgba(124,58,237,0.15)", fontSize: "11px", color: "#a78bfa" }}>
                  {val} {label}
                </div>
              ))}
            </div>
          </div>

          {outputs.length === 0 ? (
            <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "16px", color: "rgba(124,58,237,0.3)" }}>
              <div style={{ fontSize: "56px" }}>📡</div>
              <p style={{ fontSize: "16px", fontWeight: 600 }}>Awaiting Mission Deployment</p>
              <button onClick={() => setTab("build")} style={{ padding: "10px 24px", borderRadius: "8px", border: "1px solid rgba(124,58,237,0.3)", background: "transparent", color: "#a78bfa", cursor: "pointer", fontSize: "13px" }}>
                → Go to Build Crew
              </button>
            </div>
          ) : (
            <div style={{ flex: 1, overflowY: "auto", padding: "24px 28px", display: "flex", flexDirection: "column", gap: "20px" }}>
              {/* Task display */}
              <div style={{ padding: "14px 18px", borderRadius: "12px", background: "rgba(124,58,237,0.08)", border: "1px solid rgba(124,58,237,0.2)", display: "flex", gap: "12px", alignItems: "flex-start" }}>
                <span style={{ fontSize: "16px" }}>📋</span>
                <div>
                  <div style={{ fontSize: "10px", color: "rgba(167,139,250,0.5)", letterSpacing: "0.15em", textTransform: "uppercase", marginBottom: "4px" }}>Mission Brief</div>
                  <div style={{ fontSize: "13px", color: "#e8e4ff" }}>{task}</div>
                </div>
              </div>

              {outputs.map((out, idx) => (
                <div key={out.agentId} style={{
                  borderRadius: "16px",
                  border: `1px solid ${out.status === "running" ? out.color + "66" : out.status === "done" ? out.color + "33" : "rgba(124,58,237,0.1)"}`,
                  background: out.status === "done" ? `${out.color}08` : out.status === "running" ? `${out.color}0c` : "rgba(255,255,255,0.01)",
                  overflow: "hidden",
                  transition: "all 0.4s ease",
                  boxShadow: out.status === "running" ? `0 0 30px ${out.color}18` : "none",
                }}>
                  {/* Agent header */}
                  <div style={{ display: "flex", alignItems: "center", gap: "12px", padding: "14px 18px", borderBottom: `1px solid ${out.color}18`, background: `${out.color}08` }}>
                    <span style={{ fontFamily: "monospace", fontSize: "10px", color: "rgba(124,58,237,0.4)", width: "20px" }}>#{String(idx + 1).padStart(2, "0")}</span>
                    <span style={{ fontSize: "20px" }}>{out.icon}</span>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: "13px", fontWeight: 700, color: "#fff" }}>{out.role}</div>
                    </div>
                    {/* Status pill */}
                    <div style={{ display: "flex", alignItems: "center", gap: "6px", padding: "4px 10px", borderRadius: "20px", background: out.status === "done" ? "rgba(52,211,153,0.1)" : out.status === "running" ? `${out.color}18` : "rgba(124,58,237,0.08)", border: `1px solid ${out.status === "done" ? "rgba(52,211,153,0.3)" : out.status === "running" ? out.color + "44" : "rgba(124,58,237,0.15)"}` }}>
                      {out.status === "running" && <div style={{ width: "6px", height: "6px", borderRadius: "50%", background: out.color, animation: "blink2 1s infinite" }} />}
                      <span style={{ fontSize: "10px", fontWeight: 600, color: out.status === "done" ? "#34d399" : out.status === "running" ? out.color : "rgba(124,58,237,0.5)", letterSpacing: "0.1em", textTransform: "uppercase" }}>
                        {out.status === "done" ? "✓ Complete" : out.status === "running" ? "Processing" : "Waiting"}
                      </span>
                    </div>
                  </div>

                  {/* Output */}
                  {out.lines.length > 0 && (
                    <pre style={{ padding: "18px 20px", fontFamily: "'Courier New', monospace", fontSize: "12px", lineHeight: 1.9, color: "rgba(232,228,255,0.82)", whiteSpace: "pre-wrap", margin: 0, overflowX: "auto" }}>
                      {out.lines.join("\n")}
                    </pre>
                  )}

                  {out.status === "running" && out.lines.length === 0 && (
                    <div style={{ padding: "18px 20px", display: "flex", gap: "6px", alignItems: "center" }}>
                      {[0, 1, 2].map((d) => (
                        <div key={d} style={{ width: "6px", height: "6px", borderRadius: "50%", background: out.color, animation: `bounce3 1.2s ${d * 0.2}s infinite` }} />
                      ))}
                      <span style={{ fontSize: "11px", color: "rgba(167,139,250,0.4)", marginLeft: "8px", fontFamily: "monospace" }}>Agent processing task…</span>
                    </div>
                  )}
                </div>
              ))}

              {!running && outputs.length > 0 && outputs.every((o) => o.status === "done") && (
                <div style={{ borderRadius: "16px", background: "linear-gradient(135deg, rgba(52,211,153,0.08), rgba(6,182,212,0.05))", border: "1px solid rgba(52,211,153,0.25)", padding: "28px", textAlign: "center" }}>
                  <div style={{ fontSize: "40px", marginBottom: "12px" }}>✅</div>
                  <div style={{ fontSize: "20px", fontWeight: 800, color: "#34d399", marginBottom: "6px" }}>Mission Accomplished</div>
                  <div style={{ fontSize: "13px", color: "rgba(167,139,250,0.5)", marginBottom: "20px" }}>
                    {outputs.length} agents · {mode} · {elapsed}s total
                  </div>
                  <button onClick={() => { setOutputs([]); setTab("build"); }} style={{
                    padding: "12px 28px", borderRadius: "10px", border: "1px solid rgba(52,211,153,0.3)",
                    background: "rgba(52,211,153,0.08)", color: "#34d399", cursor: "pointer", fontSize: "13px", fontWeight: 600,
                  }}>
                    → Deploy Another Crew
                  </button>
                </div>
              )}
              <div ref={logsEndRef} />
            </div>
          )}
        </main>
      )}

      {/* FOOTER */}
      <footer style={{ padding: "10px 28px", borderTop: "1px solid rgba(124,58,237,0.08)", display: "flex", alignItems: "center", justifyContent: "space-between", background: "rgba(0,0,0,0.2)" }}>
        <span style={{ fontSize: "10px", color: "rgba(124,58,237,0.3)", letterSpacing: "0.15em", textTransform: "uppercase" }}>NEXWRA © 2025 — AI Workforce Platform</span>
        <span style={{ fontSize: "10px", color: "rgba(124,58,237,0.3)", letterSpacing: "0.15em" }}>Developed by VedX</span>
      </footer>

      <style>{`
        @keyframes blink2 { 0%,100%{opacity:1}50%{opacity:0.2} }
        @keyframes spin { to{transform:rotate(360deg)} }
        @keyframes bounce3 { 0%,100%{transform:translateY(0)}50%{transform:translateY(-8px)} }
        *{box-sizing:border-box}
        ::-webkit-scrollbar{width:3px;height:3px}
        ::-webkit-scrollbar-track{background:transparent}
        ::-webkit-scrollbar-thumb{background:rgba(124,58,237,0.25);border-radius:2px}
        textarea,input{box-sizing:border-box!important}
      `}</style>
    </div>
  );
}
