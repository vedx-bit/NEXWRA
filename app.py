import streamlit as st
import os, sys, importlib.util, time, json, base64
from pathlib import Path

BASE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, BASE)

def load_module(name, path):
    spec = importlib.util.spec_from_file_location(name, path)
    mod = importlib.util.module_from_spec(spec)
    sys.modules[name] = mod
    spec.loader.exec_module(mod)
    return mod

logger_mod = load_module("logger", os.path.join(BASE, "utils", "logger.py"))
llm_mod    = load_module("llm",    os.path.join(BASE, "utils", "llm.py"))
task_mod   = load_module("task",   os.path.join(BASE, "core",  "task.py"))
agent_mod  = load_module("agent",  os.path.join(BASE, "core",  "agent.py"))
crew_mod   = load_module("crew",   os.path.join(BASE, "core",  "crew.py"))

Agent   = agent_mod.Agent
Task    = task_mod.Task
Crew    = crew_mod.Crew
Process = crew_mod.Process

st.set_page_config(
    page_title="Nexwra — AI Workforce",
    page_icon="⚡",
    layout="wide",
    initial_sidebar_state="expanded"
)

# ── MEMORY helpers ────────────────────────────────────────────────────
if "memory" not in st.session_state:
    st.session_state.memory = []
if "lang" not in st.session_state:
    st.session_state.lang = "English"

def add_memory(mode, result):
    st.session_state.memory.insert(0, {
        "mode": mode,
        "result": str(result)[:300],
        "time": time.strftime("%H:%M")
    })
    if len(st.session_state.memory) > 5:
        st.session_state.memory.pop()

def get_memory_context():
    if not st.session_state.memory:
        return ""
    parts = [f"[{m['time']} — {m['mode']}]: {m['result']}" for m in st.session_state.memory]
    return "Previous session context:\n" + "\n".join(parts)

# ── CSS ───────────────────────────────────────────────────────────────
st.markdown("""
<style>
@import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;600&display=swap');

* { font-family: 'Space Grotesk', sans-serif !important; }
html, body, [data-testid="stAppViewContainer"] { background: #03030a !important; }
[data-testid="stAppViewContainer"] {
    background: radial-gradient(ellipse at 10% 20%, rgba(124,58,237,0.08) 0%, #03030a 50%),
                radial-gradient(ellipse at 90% 80%, rgba(96,165,250,0.05) 0%, transparent 50%) !important;
}
[data-testid="stSidebar"] { background: #07071a !important; border-right: 1px solid #1e1e3f !important; }
[data-testid="stSidebar"] * { color: #e2e8f0 !important; }

/* LANDING HERO */
.nexwra-hero {
    text-align: center;
    padding: 3rem 1rem 2rem;
    position: relative;
}
.nexwra-badge {
    display: inline-flex; align-items: center; gap: 8px;
    background: rgba(167,139,250,0.08); border: 1px solid rgba(167,139,250,0.25);
    color: #a78bfa; font-size: 0.7rem; font-weight: 600;
    padding: 5px 14px; border-radius: 999px;
    letter-spacing: 0.12em; text-transform: uppercase; margin-bottom: 1.5rem;
    animation: fadeUp 0.6s ease forwards;
}
.nexwra-badge .dot {
    width: 6px; height: 6px; background: #34d399; border-radius: 50%;
    animation: pulse 2s infinite;
}
@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.3} }
@keyframes fadeUp { from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:translateY(0)} }
@keyframes fadeIn { from{opacity:0} to{opacity:1} }

.nexwra-title {
    font-size: clamp(2.5rem, 6vw, 5rem);
    font-weight: 700; line-height: 1.05; letter-spacing: -0.03em;
    background: linear-gradient(135deg, #a78bfa 0%, #60a5fa 50%, #34d399 100%);
    -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;
    animation: fadeUp 0.8s ease 0.1s both;
}
.nexwra-sub {
    font-size: 1rem; color: #475569; max-width: 520px;
    margin: 1rem auto 0; line-height: 1.7;
    animation: fadeUp 0.8s ease 0.2s both;
}

/* PARTICLES */
.particles-wrap {
    position: absolute; inset: 0; overflow: hidden; pointer-events: none; z-index: 0;
}
.particle {
    position: absolute; border-radius: 50%; opacity: 0.15;
    animation: float linear infinite;
}
@keyframes float {
    0%   { transform: translateY(100vh) rotate(0deg); opacity: 0; }
    10%  { opacity: 0.15; }
    90%  { opacity: 0.15; }
    100% { transform: translateY(-100px) rotate(720deg); opacity: 0; }
}

/* MARQUEE */
.marquee-outer { overflow: hidden; border-top: 1px solid #1e1e3f; border-bottom: 1px solid #1e1e3f; background: rgba(13,13,42,0.4); padding: 0.8rem 0; margin-bottom: 2rem; }
.marquee-inner { display: flex; gap: 2.5rem; width: max-content; animation: marquee 20s linear infinite; }
@keyframes marquee { from{transform:translateX(0)} to{transform:translateX(-50%)} }
.m-item { white-space: nowrap; font-size: 0.72rem; font-weight: 600; color: #334155; letter-spacing: 0.08em; text-transform: uppercase; }
.m-item span { color: #a78bfa; margin-right: 6px; }

/* SIDEBAR */
.sidebar-title { font-size: 1.2rem !important; font-weight: 700 !important; background: linear-gradient(135deg,#a78bfa,#60a5fa); -webkit-background-clip:text; -webkit-text-fill-color:transparent; background-clip:text; margin-bottom: 0.5rem; }
.agent-chip { background: #0d0d2b; border: 1px solid #1e1e3f; border-radius: 10px; padding: 0.8rem 1rem; margin-bottom: 0.5rem; position: relative; overflow: hidden; }
.agent-chip::before { content:''; position:absolute; top:0;left:0;right:0; height:1px; background:linear-gradient(90deg,#a78bfa,#60a5fa); }
.agent-chip-role { font-size: 0.6rem; font-weight: 700; color: #a78bfa; letter-spacing:0.1em; text-transform:uppercase; }
.agent-chip-name { font-size: 0.85rem; font-weight: 600; color: #e2e8f0; }
.mem-card { background: #0d0d2b; border: 1px solid #1e1e3f; border-radius: 8px; padding: 0.7rem 0.9rem; margin-bottom: 0.4rem; font-size: 0.75rem; color: #64748b; }
.mem-mode { font-size: 0.65rem; color: #a78bfa; font-weight: 600; text-transform:uppercase; letter-spacing:0.08em; }

/* SECTION LABELS */
.sec-label { font-size: 0.65rem; font-weight: 700; color: #475569; letter-spacing: 0.2em; text-transform: uppercase; margin-bottom: 0.7rem; padding-bottom: 0.5rem; border-bottom: 1px solid #1e1e3f; }

/* MODE CARDS */
.mode-grid { display: grid; grid-template-columns: repeat(2,1fr); gap: 10px; margin-bottom: 1rem; }
.mode-btn { background: #0d0d2b; border: 1px solid #1e1e3f; border-radius: 12px; padding: 1rem; cursor: pointer; text-align: center; transition: all 0.2s; }
.mode-btn:hover, .mode-btn.active { border-color: #a78bfa; background: #13102a; }
.mode-btn-icon { font-size: 1.5rem; margin-bottom: 0.3rem; }
.mode-btn-label { font-size: 0.75rem; font-weight: 600; color: #e2e8f0; }

/* INPUTS */
div[data-testid="stTextInput"] > div > div,
div[data-testid="stTextArea"] > div > div,
div[data-testid="stSelectbox"] > div {
    background: #0d0d2b !important;
    border: 1px solid #1e1e3f !important;
    border-radius: 10px !important;
    color: #e2e8f0 !important;
}
div[data-testid="stTextInput"] > div > div:focus-within,
div[data-testid="stTextArea"] > div > div:focus-within {
    border-color: #a78bfa !important;
    box-shadow: 0 0 0 3px rgba(167,139,250,0.12) !important;
}
label { color: #64748b !important; font-size: 0.8rem !important; font-weight: 500 !important; }

/* BUTTONS */
.stButton > button {
    background: linear-gradient(135deg, #7c3aed, #4f46e5) !important;
    color: #fff !important; border: none !important;
    border-radius: 10px !important; font-weight: 600 !important;
    font-size: 0.9rem !important; width: 100% !important;
    padding: 0.65rem 1.5rem !important; transition: opacity 0.2s !important;
    font-family: 'Space Grotesk', sans-serif !important;
}
.stButton > button:hover { opacity: 0.85 !important; }

/* THINKING STEPS */
.thinking-box { background: #050508; border: 1px solid #1e1e3f; border-radius: 12px; padding: 1.2rem 1.5rem; margin: 0.5rem 0; }
.thinking-step { display: flex; align-items: center; gap: 10px; padding: 0.5rem 0; border-bottom: 1px solid #0d0d2b; }
.thinking-step:last-child { border-bottom: none; }
.t-dot { width: 8px; height: 8px; border-radius: 50%; min-width: 8px; }
.t-dot.done { background: #34d399; }
.t-dot.active { background: #a78bfa; animation: pulse 1s infinite; }
.t-dot.wait { background: #1e1e3f; }
.t-text { font-size: 0.8rem; font-family: 'JetBrains Mono', monospace; }
.t-text.done { color: #34d399; }
.t-text.active { color: #a78bfa; }
.t-text.wait { color: #334155; }

/* RESULT */
.result-box { background: #07071a; border: 1px solid #1e1e3f; border-left: 3px solid #a78bfa; border-radius: 12px; padding: 2rem; font-size: 0.9rem; line-height: 1.8; color: #cbd5e1; white-space: pre-wrap; }

/* FOOTER */
.nexwra-footer { text-align: center; padding: 2rem 0; border-top: 1px solid #1e1e3f; margin-top: 2rem; }
.nexwra-footer p { font-size: 0.7rem; color: #1e293b; font-family: 'JetBrains Mono', monospace; letter-spacing: 0.1em; }

hr { border-color: #1e1e3f !important; }
</style>
""", unsafe_allow_html=True)

# ── PARTICLES JS ─────────────────────────────────────────────────────
st.markdown("""
<div class="particles-wrap" id="particles"></div>
<script>
const wrap = document.getElementById('particles');
if(wrap){
  for(let i=0;i<35;i++){
    const p = document.createElement('div');
    p.className = 'particle';
    const size = Math.random()*4+2;
    const colors = ['#a78bfa','#60a5fa','#34d399','#f472b6'];
    p.style.cssText = `
      width:${size}px; height:${size}px;
      left:${Math.random()*100}%;
      background:${colors[Math.floor(Math.random()*colors.length)]};
      animation-duration:${Math.random()*15+8}s;
      animation-delay:${Math.random()*10}s;
    `;
    wrap.appendChild(p);
  }
}
</script>
""", unsafe_allow_html=True)

# ── SIDEBAR ───────────────────────────────────────────────────────────
with st.sidebar:
    st.markdown('<div class="sidebar-title">⚡ NEXWRA</div>', unsafe_allow_html=True)
    st.markdown('<div style="font-size:0.72rem;color:#334155;margin-bottom:1rem;font-family:monospace;letter-spacing:0.05em;">AUTONOMOUS AI WORKFORCE v1.0</div>', unsafe_allow_html=True)

    # Language
    st.markdown('<div class="sec-label">Language</div>', unsafe_allow_html=True)
    lang = st.selectbox("", ["English", "Hindi", "Hinglish"], label_visibility="collapsed", key="lang_sel")
    st.session_state.lang = lang

    st.markdown("---")

    # Mode select
    st.markdown('<div class="sec-label">Mission Type</div>', unsafe_allow_html=True)
    mode = st.selectbox("", [
        "🔬 Market Research",
        "💪 Gym Schedule",
        "📝 Content Writer",
        "🧠 Custom Mission"
    ], label_visibility="collapsed")

    st.markdown("---")

    # Active agents
    st.markdown('<div class="sec-label">Active Agents</div>', unsafe_allow_html=True)
    agent_map = {
        "🔬 Market Research": [("ANALYST","Market Researcher"),("WRITER","Report Writer")],
        "💪 Gym Schedule":    [("TRAINER","Fitness Expert"),("PLANNER","Schedule Architect")],
        "📝 Content Writer":  [("RESEARCHER","Topic Researcher"),("AUTHOR","Content Author")],
        "🧠 Custom Mission":  [("AGENT 01","Lead Executor"),("AGENT 02","Quality Reviewer")],
    }
    for role, name in agent_map[mode]:
        st.markdown(f'<div class="agent-chip"><div class="agent-chip-role">{role}</div><div class="agent-chip-name">{name}</div></div>', unsafe_allow_html=True)

    st.markdown("---")

    # Memory
    st.markdown('<div class="sec-label">Session Memory</div>', unsafe_allow_html=True)
    if st.session_state.memory:
        for m in st.session_state.memory:
            st.markdown(f'<div class="mem-card"><div class="mem-mode">{m["mode"]} · {m["time"]}</div>{m["result"][:80]}...</div>', unsafe_allow_html=True)
        if st.button("Clear Memory"):
            st.session_state.memory = []
            st.rerun()
    else:
        st.markdown('<div style="font-size:0.75rem;color:#1e293b;">No memory yet — run a mission!</div>', unsafe_allow_html=True)

# ── HERO ──────────────────────────────────────────────────────────────
st.markdown("""
<div class="nexwra-hero">
  <div class="nexwra-badge"><span class="dot"></span> LIVE — v1.0</div>
  <div class="nexwra-title">Deploy your AI Workforce</div>
  <div class="nexwra-sub">Autonomous agents that research, write, and execute — no prompting loops, just results.</div>
</div>
""", unsafe_allow_html=True)

# Marquee
items = ["Multi-Agent AI","Market Research","Autonomous Execution","ReAct Loop","Groq LLM","Content Generation","Custom Missions","Python Framework","Voice Input","Multi-Language","PDF Export","Agent Memory"]
marquee_html = '<div class="marquee-outer"><div class="marquee-inner">'
for _ in range(2):
    for item in items:
        marquee_html += f'<div class="m-item"><span>⚡</span>{item}</div>'
marquee_html += '</div></div>'
st.markdown(marquee_html, unsafe_allow_html=True)

# ── VOICE INPUT ───────────────────────────────────────────────────────
st.markdown('<div class="sec-label">Voice Input (Beta)</div>', unsafe_allow_html=True)
st.markdown("""
<div style="background:#07071a;border:1px solid #1e1e3f;border-radius:12px;padding:1rem 1.5rem;margin-bottom:1rem;">
  <div style="display:flex;align-items:center;gap:12px;flex-wrap:wrap;">
    <button onclick="startVoice()" style="background:linear-gradient(135deg,#7c3aed,#4f46e5);color:#fff;border:none;padding:8px 18px;border-radius:8px;cursor:pointer;font-size:0.82rem;font-weight:600;font-family:'Space Grotesk',sans-serif;">🎙 Start Speaking</button>
    <span id="voice-status" style="font-size:0.78rem;color:#475569;font-family:monospace;">Click to speak your mission...</span>
  </div>
  <div id="voice-result" style="margin-top:0.8rem;font-size:0.85rem;color:#a78bfa;font-family:monospace;min-height:1.2rem;"></div>
</div>
<script>
function startVoice(){
  const status = document.getElementById('voice-status');
  const result = document.getElementById('voice-result');
  if(!('webkitSpeechRecognition' in window||'SpeechRecognition' in window)){
    status.textContent='Speech not supported in this browser.';return;
  }
  const SR = window.SpeechRecognition||window.webkitSpeechRecognition;
  const rec = new SR();
  rec.lang='en-US'; rec.interimResults=true;
  status.style.color='#34d399';
  status.textContent='🔴 Listening...';
  rec.onresult=e=>{
    let t='';
    for(let i=e.resultIndex;i<e.results.length;i++) t+=e.results[i][0].transcript;
    result.textContent='Heard: '+t;
  };
  rec.onerror=()=>{status.textContent='Error — try again.';status.style.color='#f87171';};
  rec.onend=()=>{status.textContent='Done — paste the text above into the input field.';status.style.color='#475569';};
  rec.start();
}
</script>
""", unsafe_allow_html=True)

# ── MISSION INPUTS ────────────────────────────────────────────────────
st.markdown("---")
st.markdown('<div class="sec-label">Mission Parameters</div>', unsafe_allow_html=True)

lang_note = " (respond in Hindi)" if lang == "Hindi" else " (mix Hindi and English)" if lang == "Hinglish" else ""
mem_ctx = get_memory_context()

result_text = ""
run_mission = False

if mode == "🔬 Market Research":
    col1, col2 = st.columns([3,1])
    with col1: topic = st.text_input("Target Market", placeholder="e.g. Electric Vehicles, AI SaaS, Fintech...")
    with col2: depth = st.selectbox("Depth", ["Standard","Deep Dive"])
    if st.button("⚡ Launch Research Mission"):
        if topic:
            run_mission = True
            steps_placeholder = st.empty()
            steps = [
                ("Initializing research agents...", "done"),
                (f"Analyst scanning {topic} market data...", "active"),
                ("Writer compiling executive summary...", "wait"),
                ("Finalizing report...", "wait"),
            ]
            def show_steps(active_idx):
                html = '<div class="thinking-box">'
                for i,(txt,_) in enumerate(steps):
                    if i < active_idx: cls="done"; icon="✓"
                    elif i == active_idx: cls="active"; icon="●"
                    else: cls="wait"; icon="○"
                    html += f'<div class="thinking-step"><div class="t-dot {cls}"></div><div class="t-text {cls}">{icon} {txt}</div></div>'
                html += '</div>'
                steps_placeholder.markdown(html, unsafe_allow_html=True)

            show_steps(0); time.sleep(0.5)
            r = Agent(role="Senior Market Researcher", goal="Find accurate market data.", backstory="Elite market analyst 10 years experience.")
            w = Agent(role="Strategic Report Writer", goal="Transform research into executive reports.", backstory="Former consultant writing sharp market briefs.")
            t1 = Task(description=f"Research the {topic} market: size, top players, trends, forecast.{lang_note} {mem_ctx}", agent=r, expected_output="Comprehensive market intelligence.")
            show_steps(1); time.sleep(0.3)
            t2 = Task(description=f"Write a professional executive summary on {topic} market.{lang_note}", agent=w, expected_output="Polished executive report.", context=[t1])
            with st.spinner(""):
                crew = Crew(agents=[r,w], tasks=[t1,t2], process=Process.SEQUENTIAL)
                result = crew.kickoff()
            show_steps(3)
            result_text = str(result)
            add_memory(f"Market: {topic}", result_text)
        else:
            st.warning("Enter a target market!")

elif mode == "💪 Gym Schedule":
    c1,c2,c3 = st.columns(3)
    with c1: goal = st.selectbox("Goal", ["Muscle Gain","Weight Loss","Stay Fit","Strength","Endurance"])
    with c2: level = st.selectbox("Level", ["Beginner","Intermediate","Advanced"])
    with c3: days = st.slider("Days/Week", 2, 6, 4)
    extra = st.text_input("Injuries or preferences?", placeholder="e.g. bad knees, home workout...")
    if st.button("⚡ Generate My Schedule"):
        steps_placeholder = st.empty()
        def show_gym_steps(n):
            s=[("Setting up your fitness profile...",""),("Trainer designing workout plan...",""),("Planner building weekly schedule...",""),("Adding nutrition & recovery tips...","")]
            html='<div class="thinking-box">'
            for i,(t,_) in enumerate(s):
                if i<n: cls="done";ic="✓"
                elif i==n: cls="active";ic="●"
                else: cls="wait";ic="○"
                html+=f'<div class="thinking-step"><div class="t-dot {cls}"></div><div class="t-text {cls}">{ic} {t}</div></div>'
            html+='</div>'
            steps_placeholder.markdown(html,unsafe_allow_html=True)
        show_gym_steps(0); time.sleep(0.4)
        trainer = Agent(role="Elite Personal Trainer", goal="Design effective science-backed workout plans.", backstory="NSCA certified trainer, 500+ athletes coached.")
        planner = Agent(role="Wellness Schedule Architect", goal="Build practical sustainable weekly schedules.", backstory="Sports scientist specializing in recovery and habit design.")
        show_gym_steps(1)
        t1 = Task(description=f"Create a {goal} workout plan for {level}, {days} days/week.{' Consider: '+extra if extra else ''}{lang_note} {mem_ctx}", agent=trainer, expected_output="Complete workout plan.")
        show_gym_steps(2)
        t2 = Task(description=f"Create a clean 7-day schedule with warm-up, rest days, nutrition and sleep tips.{lang_note}", agent=planner, expected_output="Full weekly schedule.", context=[t1])
        with st.spinner(""):
            crew = Crew(agents=[trainer,planner], tasks=[t1,t2], process=Process.SEQUENTIAL)
            result = crew.kickoff()
        show_gym_steps(3)
        result_text = str(result)
        add_memory(f"Gym: {goal} {level}", result_text)

elif mode == "📝 Content Writer":
    c1,c2 = st.columns(2)
    with c1: ctopic = st.text_input("Topic", placeholder="e.g. Future of AI, Crypto in 2025...")
    with c2: ctype = st.selectbox("Type", ["Blog Post","LinkedIn Post","Twitter Thread","Essay"])
    tone = st.selectbox("Tone", ["Professional","Casual","Motivational","Technical"])
    if st.button("⚡ Generate Content"):
        if ctopic:
            steps_placeholder = st.empty()
            def show_content_steps(n):
                s=[("Initializing content agents...",""),("Researcher finding key angles...",""),("Author crafting content...",""),("Polishing final output...","")]
                html='<div class="thinking-box">'
                for i,(t,_) in enumerate(s):
                    if i<n: cls="done";ic="✓"
                    elif i==n: cls="active";ic="●"
                    else: cls="wait";ic="○"
                    html+=f'<div class="thinking-step"><div class="t-dot {cls}"></div><div class="t-text {cls}">{ic} {t}</div></div>'
                html+='</div>'
                steps_placeholder.markdown(html,unsafe_allow_html=True)
            show_content_steps(0); time.sleep(0.4)
            res = Agent(role="Content Researcher", goal="Find interesting angles and facts.", backstory="Journalist 8 years tech publications.")
            auth = Agent(role="Elite Content Creator", goal="Write scroll-stopping content.", backstory="Viral content strategist 10M+ views.")
            show_content_steps(1)
            t1 = Task(description=f"Research key facts and angles about: {ctopic}.{lang_note} {mem_ctx}", agent=res, expected_output="Key research points.")
            show_content_steps(2)
            t2 = Task(description=f"Write a {ctype} about {ctopic} in {tone.lower()} tone.{lang_note}", agent=auth, expected_output=f"Complete {ctype}.", context=[t1])
            with st.spinner(""):
                crew = Crew(agents=[res,auth], tasks=[t1,t2], process=Process.SEQUENTIAL)
                result = crew.kickoff()
            show_content_steps(3)
            result_text = str(result)
            add_memory(f"Content: {ctopic}", result_text)
        else:
            st.warning("Enter a topic!")

elif mode == "🧠 Custom Mission":
    a1r = st.text_input("Agent 1 — Role", placeholder="e.g. Legal Researcher")
    a1g = st.text_input("Agent 1 — Goal", placeholder="e.g. Find relevant legal precedents")
    a2r = st.text_input("Agent 2 — Role", placeholder="e.g. Legal Writer")
    a2g = st.text_input("Agent 2 — Goal", placeholder="e.g. Draft a legal brief")
    mission = st.text_area("Mission Brief", placeholder="Describe what you want agents to accomplish...", height=100)
    if st.button("⚡ Deploy Custom Agents"):
        if all([a1r,a1g,a2r,a2g,mission]):
            steps_placeholder = st.empty()
            def show_custom_steps(n):
                s=[("Spawning custom agents...",""),("Agent 1 executing phase 1...",""),("Agent 2 executing phase 2...",""),("Mission complete...","")]
                html='<div class="thinking-box">'
                for i,(t,_) in enumerate(s):
                    if i<n: cls="done";ic="✓"
                    elif i==n: cls="active";ic="●"
                    else: cls="wait";ic="○"
                    html+=f'<div class="thinking-step"><div class="t-dot {cls}"></div><div class="t-text {cls}">{ic} {t}</div></div>'
                html+='</div>'
                steps_placeholder.markdown(html,unsafe_allow_html=True)
            show_custom_steps(0); time.sleep(0.4)
            a1 = Agent(role=a1r, goal=a1g, backstory=f"Expert {a1r}.")
            a2 = Agent(role=a2r, goal=a2g, backstory=f"Expert {a2r}.")
            show_custom_steps(1)
            t1 = Task(description=f"Phase 1: {mission}{lang_note} {mem_ctx}", agent=a1, expected_output="Phase 1 output.")
            show_custom_steps(2)
            t2 = Task(description=f"Phase 2 — complete: {mission}{lang_note}", agent=a2, expected_output="Final output.", context=[t1])
            with st.spinner(""):
                crew = Crew(agents=[a1,a2], tasks=[t1,t2], process=Process.SEQUENTIAL)
                result = crew.kickoff()
            show_custom_steps(3)
            result_text = str(result)
            add_memory(f"Custom: {mission[:40]}", result_text)
        else:
            st.warning("Fill all fields!")

# ── RESULT OUTPUT ─────────────────────────────────────────────────────
if result_text:
    st.markdown("---")
    st.markdown('<div class="sec-label">Mission Output</div>', unsafe_allow_html=True)
    st.markdown(f'<div class="result-box">{result_text}</div>', unsafe_allow_html=True)

    st.markdown("<br>", unsafe_allow_html=True)
    col1, col2 = st.columns(2)

    with col1:
        st.download_button(
            "⬇ Download TXT",
            result_text,
            file_name="nexwra_output.txt",
            mime="text/plain"
        )

    with col2:
        # PDF via HTML print
        pdf_html = f"""
        <!DOCTYPE html><html><head>
        <style>
          body{{font-family:'Segoe UI',sans-serif;max-width:700px;margin:40px auto;color:#1e293b;line-height:1.8;}}
          h1{{font-size:1.5rem;color:#7c3aed;margin-bottom:0.5rem;}}
          .meta{{font-size:0.8rem;color:#94a3b8;margin-bottom:2rem;}}
          pre{{white-space:pre-wrap;font-size:0.9rem;}}
        </style></head><body>
        <h1>⚡ Nexwra — Mission Output</h1>
        <div class="meta">Generated by Nexwra AI Workforce · {time.strftime('%d %b %Y %H:%M')}</div>
        <pre>{result_text}</pre>
        </body></html>
        """
        b64 = base64.b64encode(pdf_html.encode()).decode()
        st.markdown(f"""
        <a href="data:text/html;base64,{b64}" download="nexwra_report.html"
           style="display:block;text-align:center;background:linear-gradient(135deg,#7c3aed,#4f46e5);color:#fff;padding:0.6rem;border-radius:10px;font-weight:600;font-size:0.9rem;text-decoration:none;">
           📄 Download HTML Report
        </a>
        """, unsafe_allow_html=True)

# ── FOOTER ────────────────────────────────────────────────────────────
st.markdown("""
<div class="nexwra-footer">
  <p>NEXWRA © 2025 — AUTONOMOUS AI WORKFORCE · PYTHON · GROQ · LLAMA 3.3</p>
</div>
""", unsafe_allow_html=True)
