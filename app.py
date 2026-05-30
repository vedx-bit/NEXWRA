import sys
import os

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from core.agent import Agent
from core.task import Task
from core.crew import Crew, Process

st.set_page_config(
    page_title="AgentCrew — AI Workforce",
    page_icon="⚡",
    layout="wide",
    initial_sidebar_state="expanded"
)

st.markdown("""
<style>
@import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;600&display=swap');

* { font-family: 'Space Grotesk', sans-serif; }

html, body, [data-testid="stAppViewContainer"] {
    background-color: #0a0a0f;
    color: #e2e8f0;
}

[data-testid="stAppViewContainer"] {
    background: radial-gradient(ellipse at 20% 50%, #0d0d1a 0%, #0a0a0f 60%);
}

[data-testid="stSidebar"] {
    background: #0d0d1a !important;
    border-right: 1px solid #1e1e3f;
}

[data-testid="stSidebar"] * { color: #e2e8f0 !important; }

h1, h2, h3 { font-family: 'Space Grotesk', sans-serif !important; }

.hero-title {
    font-size: 3.2rem;
    font-weight: 700;
    background: linear-gradient(135deg, #a78bfa, #60a5fa, #34d399);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
    line-height: 1.1;
    margin-bottom: 0.5rem;
}

.hero-sub {
    font-size: 1.1rem;
    color: #64748b;
    font-weight: 400;
    letter-spacing: 0.02em;
}

.badge {
    display: inline-block;
    background: #1e1e3f;
    border: 1px solid #a78bfa44;
    color: #a78bfa;
    font-size: 0.72rem;
    font-weight: 600;
    padding: 4px 12px;
    border-radius: 999px;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    margin-bottom: 1rem;
}

.agent-card {
    background: #0d0d1a;
    border: 1px solid #1e1e3f;
    border-radius: 16px;
    padding: 1.5rem;
    margin-bottom: 1rem;
    transition: border-color 0.2s;
    position: relative;
    overflow: hidden;
}

.agent-card::before {
    content: '';
    position: absolute;
    top: 0; left: 0; right: 0;
    height: 2px;
    background: linear-gradient(90deg, #a78bfa, #60a5fa);
}

.agent-card:hover { border-color: #a78bfa55; }

.agent-role {
    font-size: 0.7rem;
    font-weight: 600;
    color: #a78bfa;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    margin-bottom: 0.3rem;
}

.agent-name {
    font-size: 1rem;
    font-weight: 600;
    color: #e2e8f0;
}

.stat-card {
    background: #0d0d1a;
    border: 1px solid #1e1e3f;
    border-radius: 12px;
    padding: 1.2rem 1.5rem;
    text-align: center;
}

.stat-num {
    font-size: 2rem;
    font-weight: 700;
    color: #a78bfa;
    font-family: 'JetBrains Mono', monospace;
}

.stat-label {
    font-size: 0.75rem;
    color: #475569;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    margin-top: 0.2rem;
}

.result-box {
    background: #0d0d1a;
    border: 1px solid #1e1e3f;
    border-left: 3px solid #a78bfa;
    border-radius: 12px;
    padding: 2rem;
    font-size: 0.95rem;
    line-height: 1.8;
    color: #cbd5e1;
}

.terminal-box {
    background: #050508;
    border: 1px solid #1e1e3f;
    border-radius: 12px;
    padding: 1rem 1.5rem;
    font-family: 'JetBrains Mono', monospace;
    font-size: 0.8rem;
    color: #34d399;
    margin-top: 0.5rem;
}

.section-title {
    font-size: 0.7rem;
    font-weight: 600;
    color: #475569;
    letter-spacing: 0.15em;
    text-transform: uppercase;
    margin-bottom: 1rem;
    padding-bottom: 0.5rem;
    border-bottom: 1px solid #1e1e3f;
}

div[data-testid="stSelectbox"] > div,
div[data-testid="stTextInput"] > div > div,
div[data-testid="stTextArea"] > div > div {
    background: #0d0d1a !important;
    border: 1px solid #1e1e3f !important;
    border-radius: 10px !important;
    color: #e2e8f0 !important;
}

div[data-testid="stSelectbox"] > div:focus-within,
div[data-testid="stTextInput"] > div > div:focus-within {
    border-color: #a78bfa !important;
    box-shadow: 0 0 0 3px #a78bfa22 !important;
}

.stButton > button {
    background: linear-gradient(135deg, #7c3aed, #4f46e5) !important;
    color: white !important;
    border: none !important;
    border-radius: 10px !important;
    padding: 0.6rem 2rem !important;
    font-weight: 600 !important;
    font-size: 0.9rem !important;
    letter-spacing: 0.03em !important;
    width: 100% !important;
    transition: opacity 0.2s !important;
}

.stButton > button:hover { opacity: 0.85 !important; }

.stSlider > div > div > div { background: #a78bfa !important; }

label, .stSelectbox label, .stTextInput label, .stSlider label {
    color: #94a3b8 !important;
    font-size: 0.82rem !important;
    font-weight: 500 !important;
    letter-spacing: 0.03em !important;
}

.stSpinner > div { border-top-color: #a78bfa !important; }

hr { border-color: #1e1e3f !important; }

[data-testid="stMarkdownContainer"] p { color: #94a3b8; }

.mode-card {
    background: #0d0d1a;
    border: 1px solid #1e1e3f;
    border-radius: 14px;
    padding: 1.2rem;
    cursor: pointer;
    text-align: center;
}

.mode-active {
    border-color: #a78bfa;
    background: #13102a;
}

.mode-icon { font-size: 1.8rem; margin-bottom: 0.5rem; }
.mode-name { font-size: 0.85rem; font-weight: 600; color: #e2e8f0; }
.mode-desc { font-size: 0.72rem; color: #475569; margin-top: 0.2rem; }
</style>
""", unsafe_allow_html=True)


# ── Sidebar ──────────────────────────────────────────────────────────
with st.sidebar:
    st.markdown('<div class="badge">⚡ AgentCrew v1.0</div>', unsafe_allow_html=True)
    st.markdown("### Control Panel")
    st.markdown('<div class="section-title">Select Mode</div>', unsafe_allow_html=True)

    mode = st.selectbox(
        "Mission Type",
        ["🔬 Market Research", "💪 Gym Schedule", "📝 Content Writer", "🧠 Custom Mission"],
        label_visibility="collapsed"
    )

    st.markdown("---")
    st.markdown('<div class="section-title">Active Agents</div>', unsafe_allow_html=True)

    agents_info = {
        "🔬 Market Research": [("ANALYST", "Market Researcher"), ("WRITER", "Report Writer")],
        "💪 Gym Schedule":    [("TRAINER", "Fitness Expert"), ("PLANNER", "Schedule Planner")],
        "📝 Content Writer":  [("RESEARCHER", "Topic Researcher"), ("AUTHOR", "Content Author")],
        "🧠 Custom Mission":  [("AGENT 01", "Lead Executor"), ("AGENT 02", "Quality Reviewer")],
    }

    for role, name in agents_info[mode]:
        st.markdown(f"""
        <div class="agent-card">
            <div class="agent-role">{role}</div>
            <div class="agent-name">{name}</div>
        </div>
        """, unsafe_allow_html=True)

    st.markdown("---")
    st.markdown('<div class="section-title">System Stats</div>', unsafe_allow_html=True)
    col1, col2 = st.columns(2)
    with col1:
        st.markdown('<div class="stat-card"><div class="stat-num">2</div><div class="stat-label">Agents</div></div>', unsafe_allow_html=True)
    with col2:
        st.markdown('<div class="stat-card"><div class="stat-num">∞</div><div class="stat-label">Tasks</div></div>', unsafe_allow_html=True)


# ── Main Area ─────────────────────────────────────────────────────────
st.markdown('<div class="badge">Final Year Project — AI Systems</div>', unsafe_allow_html=True)
st.markdown('<div class="hero-title">AgentCrew</div>', unsafe_allow_html=True)
st.markdown('<div class="hero-sub">Autonomous AI agent workforce — deploy, orchestrate, execute.</div>', unsafe_allow_html=True)
st.markdown("<br>", unsafe_allow_html=True)


def run_crew(agents, tasks):
    crew = Crew(agents=agents, tasks=tasks, process=Process.SEQUENTIAL)
    return crew.kickoff()


# ── Market Research ───────────────────────────────────────────────────
if mode == "🔬 Market Research":
    st.markdown('<div class="section-title">Mission Parameters</div>', unsafe_allow_html=True)
    col1, col2 = st.columns([3, 1])
    with col1:
        topic = st.text_input("Target Market", placeholder="e.g. Electric Vehicles, AI SaaS, Fintech...")
    with col2:
        depth = st.selectbox("Depth", ["Standard", "Deep Dive"])

    if st.button("⚡ Launch Research Mission"):
        if topic:
            with st.spinner("Agents deployed — executing mission..."):
                researcher = Agent(
                    role="Senior Market Researcher",
                    goal="Find accurate market data, trends and competitive intelligence.",
                    backstory="Elite market analyst with 10 years of experience across tech sectors.",
                )
                writer = Agent(
                    role="Strategic Report Writer",
                    goal="Transform raw research into board-level executive reports.",
                    backstory="Former McKinsey consultant who writes razor-sharp market briefs.",
                )
                t1 = Task(
                    description=f"Research the {topic} market thoroughly. Cover: market size, top 5 players, recent trends, growth forecast, key opportunities and risks. {'Go very deep with statistics and data points.' if depth == 'Deep Dive' else ''}",
                    agent=researcher,
                    expected_output="Comprehensive market intelligence report with data.",
                )
                t2 = Task(
                    description=f"Write a professional executive summary report on the {topic} market using the research. Include an intro, market overview, competitive landscape, opportunities, and conclusion.",
                    agent=writer,
                    expected_output="Polished executive report ready for presentation.",
                    context=[t1],
                )
                result = run_crew([researcher, writer], [t1, t2])

            st.markdown("---")
            st.markdown('<div class="section-title">Mission Output</div>', unsafe_allow_html=True)
            st.markdown(f'<div class="result-box">{str(result)}</div>', unsafe_allow_html=True)
            st.download_button("⬇ Download Report", str(result), file_name=f"{topic}_report.txt")
        else:
            st.warning("Enter a target market to begin.")


# ── Gym Schedule ──────────────────────────────────────────────────────
elif mode == "💪 Gym Schedule":
    st.markdown('<div class="section-title">Mission Parameters</div>', unsafe_allow_html=True)
    col1, col2, col3 = st.columns(3)
    with col1:
        goal = st.selectbox("Primary Goal", ["Muscle Gain", "Weight Loss", "Stay Fit", "Strength", "Endurance"])
    with col2:
        level = st.selectbox("Fitness Level", ["Beginner", "Intermediate", "Advanced"])
    with col3:
        days = st.slider("Days / Week", 2, 6, 4)

    extra = st.text_input("Any injuries or preferences?", placeholder="e.g. bad knees, no equipment, home workout...")

    if st.button("⚡ Generate My Schedule"):
        with st.spinner("Agents building your personalized plan..."):
            trainer = Agent(
                role="Elite Personal Trainer",
                goal="Design the most effective science-backed workout plan.",
                backstory="NSCA certified trainer who has coached 500+ athletes.",
            )
            planner = Agent(
                role="Wellness Schedule Architect",
                goal="Build practical, sustainable weekly schedules people actually follow.",
                backstory="Sports scientist specializing in recovery, periodization and habit design.",
            )
            t1 = Task(
                description=f"Create a detailed {goal.lower()} workout plan for a {level.lower()} training {days} days/week. {'Consider: ' + extra if extra else ''} Include exercises, sets, reps, rest time, and muscle groups per day.",
                agent=trainer,
                expected_output="Complete workout plan with exercises, sets, reps per day.",
            )
            t2 = Task(
                description="Turn the workout plan into a clean 7-day schedule. Add warm-up, cool-down, rest days, nutrition tips, sleep advice, and weekly progression tips.",
                agent=planner,
                expected_output="Full weekly schedule with all lifestyle tips.",
                context=[t1],
            )
            result = run_crew([trainer, planner], [t1, t2])

        st.markdown("---")
        st.markdown('<div class="section-title">Your Personal Schedule</div>', unsafe_allow_html=True)
        st.markdown(f'<div class="result-box">{str(result)}</div>', unsafe_allow_html=True)
        st.download_button("⬇ Download Schedule", str(result), file_name="gym_schedule.txt")


# ── Content Writer ────────────────────────────────────────────────────
elif mode == "📝 Content Writer":
    st.markdown('<div class="section-title">Mission Parameters</div>', unsafe_allow_html=True)
    col1, col2 = st.columns(2)
    with col1:
        content_topic = st.text_input("Topic", placeholder="e.g. Future of AI, Crypto in 2025...")
    with col2:
        content_type = st.selectbox("Content Type", ["Blog Post", "LinkedIn Post", "Twitter Thread", "Essay"])

    tone = st.selectbox("Tone", ["Professional", "Casual", "Motivational", "Technical"])

    if st.button("⚡ Generate Content"):
        if content_topic:
            with st.spinner("Agents crafting your content..."):
                researcher = Agent(
                    role="Content Researcher",
                    goal="Find the most interesting angles and facts on any topic.",
                    backstory="Journalist with 8 years writing for top tech publications.",
                )
                author = Agent(
                    role="Elite Content Creator",
                    goal="Write scroll-stopping content that gets engagement.",
                    backstory="Viral content strategist with 10M+ total content views.",
                )
                t1 = Task(
                    description=f"Research key facts, angles, statistics and interesting points about: {content_topic}. Find what makes this topic compelling.",
                    agent=researcher,
                    expected_output="Key research points and content angles.",
                )
                t2 = Task(
                    description=f"Write a {content_type} about {content_topic} in a {tone.lower()} tone using the research. Make it engaging, well-structured and impactful.",
                    agent=author,
                    expected_output=f"Complete {content_type} ready to publish.",
                    context=[t1],
                )
                result = run_crew([researcher, author], [t1, t2])

            st.markdown("---")
            st.markdown('<div class="section-title">Generated Content</div>', unsafe_allow_html=True)
            st.markdown(f'<div class="result-box">{str(result)}</div>', unsafe_allow_html=True)
            st.download_button("⬇ Download Content", str(result), file_name=f"{content_topic}_content.txt")
        else:
            st.warning("Enter a topic to begin.")


# ── Custom Mission ────────────────────────────────────────────────────
elif mode == "🧠 Custom Mission":
    st.markdown('<div class="section-title">Define Your Mission</div>', unsafe_allow_html=True)

    agent1_role = st.text_input("Agent 1 — Role", placeholder="e.g. Legal Researcher")
    agent1_goal = st.text_input("Agent 1 — Goal", placeholder="e.g. Find relevant legal precedents")

    st.markdown("<br>", unsafe_allow_html=True)

    agent2_role = st.text_input("Agent 2 — Role", placeholder="e.g. Legal Writer")
    agent2_goal = st.text_input("Agent 2 — Goal", placeholder="e.g. Draft a legal brief")

    st.markdown("<br>", unsafe_allow_html=True)
    mission = st.text_area("Mission Brief", placeholder="Describe exactly what you want the agents to accomplish...", height=120)

    if st.button("⚡ Deploy Custom Agents"):
        if all([agent1_role, agent1_goal, agent2_role, agent2_goal, mission]):
            with st.spinner("Custom agents deployed..."):
                a1 = Agent(role=agent1_role, goal=agent1_goal, backstory=f"Expert {agent1_role} with years of experience.")
                a2 = Agent(role=agent2_role, goal=agent2_goal, backstory=f"Expert {agent2_role} with years of experience.")
                t1 = Task(description=f"Phase 1 of this mission: {mission}", agent=a1, expected_output="Detailed phase 1 output.")
                t2 = Task(description=f"Phase 2 — using the previous work, complete: {mission}", agent=a2, expected_output="Final completed mission output.", context=[t1])
                result = run_crew([a1, a2], [t1, t2])

            st.markdown("---")
            st.markdown('<div class="section-title">Mission Output</div>', unsafe_allow_html=True)
            st.markdown(f'<div class="result-box">{str(result)}</div>', unsafe_allow_html=True)
            st.download_button("⬇ Download Output", str(result), file_name="mission_output.txt")
        else:
            st.warning("Fill all fields to deploy agents.")


# ── Footer ────────────────────────────────────────────────────────────
st.markdown("---")
st.markdown("""
<div style="text-align:center; padding: 1rem 0;">
    <span style="font-size:0.75rem; color:#1e293b; font-family:'JetBrains Mono',monospace; letter-spacing:0.1em;">
        AGENTCREW © 2025 — AUTONOMOUS AI WORKFORCE PLATFORM
    </span>
</div>
""", unsafe_allow_html=True)
