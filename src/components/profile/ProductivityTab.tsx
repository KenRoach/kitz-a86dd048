import { PomodoroTimer } from "@/components/autopilot/PomodoroTimer";
import { WeeklyReview } from "@/components/autopilot/WeeklyReview";
import { SwotAnalysis } from "@/components/autopilot/SwotAnalysis";
import { EisenhowerMatrix } from "@/components/autopilot/EisenhowerMatrix";
import { HabitTracker } from "@/components/autopilot/HabitTracker";

export function ProductivityTab() {
  return (
    <div className="space-y-6">
      {/* Pomodoro and Habits side by side on desktop */}
      <div className="grid gap-6 lg:grid-cols-2">
        <PomodoroTimer />
        <HabitTracker />
      </div>
      
      {/* Weekly Review */}
      <WeeklyReview />
      
      {/* Eisenhower Matrix - full width */}
      <EisenhowerMatrix />
      
      {/* SWOT Analysis */}
      <SwotAnalysis />
    </div>
  );
}
