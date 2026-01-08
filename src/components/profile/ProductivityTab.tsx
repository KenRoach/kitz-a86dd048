import { PomodoroTimer } from "@/components/autopilot/PomodoroTimer";
import { WeeklyReview } from "@/components/autopilot/WeeklyReview";
import { SwotAnalysis } from "@/components/autopilot/SwotAnalysis";
import { EisenhowerMatrix } from "@/components/autopilot/EisenhowerMatrix";

export function ProductivityTab() {
  return (
    <div className="space-y-6">
      {/* Pomodoro and Eisenhower side by side on desktop */}
      <div className="grid gap-6 lg:grid-cols-2">
        <PomodoroTimer />
        <WeeklyReview />
      </div>
      
      {/* Eisenhower Matrix - full width */}
      <EisenhowerMatrix />
      
      {/* SWOT Analysis */}
      <SwotAnalysis />
    </div>
  );
}
