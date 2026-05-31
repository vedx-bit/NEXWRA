import { useState } from "react";
import CinematicIntro from "./components/CinematicIntro";
import NexwraApp from "./components/NexwraApp";

export default function App() {
  const [introComplete, setIntroComplete] = useState(false);

  return (
    <>
      {!introComplete && (
        <CinematicIntro onComplete={() => setIntroComplete(true)} />
      )}
      <div
        style={{
          opacity: introComplete ? 1 : 0,
          transition: "opacity 0.8s cubic-bezier(0.4, 0, 0.2, 1)",
          pointerEvents: introComplete ? "auto" : "none",
        }}
      >
        <NexwraApp />
      </div>
    </>
  );
}
