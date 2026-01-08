import { useState, useEffect, useRef, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useLanguage } from "@/hooks/useLanguage";
import { Timer, Play, Pause, RotateCcw, Coffee, Brain } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

type SessionType = "work" | "shortBreak" | "longBreak";

const SESSION_TIMES: Record<SessionType, number> = {
  work: 25 * 60,
  shortBreak: 5 * 60,
  longBreak: 15 * 60,
};

export function PomodoroTimer() {
  const { language } = useLanguage();
  const [sessionType, setSessionType] = useState<SessionType>("work");
  const [timeLeft, setTimeLeft] = useState(SESSION_TIMES.work);
  const [isRunning, setIsRunning] = useState(false);
  const [completedPomodoros, setCompletedPomodoros] = useState(0);
  const intervalRef = useRef<number | null>(null);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const progress = ((SESSION_TIMES[sessionType] - timeLeft) / SESSION_TIMES[sessionType]) * 100;

  const handleSessionComplete = useCallback(() => {
    setIsRunning(false);
    
    if (sessionType === "work") {
      const newCount = completedPomodoros + 1;
      setCompletedPomodoros(newCount);
      
      toast.success(
        language === "es" 
          ? `¡Pomodoro #${newCount} completado! 🍅` 
          : `Pomodoro #${newCount} completed! 🍅`
      );
      
      // Every 4 pomodoros, take a long break
      if (newCount % 4 === 0) {
        setSessionType("longBreak");
        setTimeLeft(SESSION_TIMES.longBreak);
      } else {
        setSessionType("shortBreak");
        setTimeLeft(SESSION_TIMES.shortBreak);
      }
    } else {
      toast.success(
        language === "es" 
          ? "¡Descanso terminado! Hora de enfocarse 💪" 
          : "Break complete! Time to focus 💪"
      );
      setSessionType("work");
      setTimeLeft(SESSION_TIMES.work);
    }
  }, [sessionType, completedPomodoros, language]);

  useEffect(() => {
    if (isRunning && timeLeft > 0) {
      intervalRef.current = window.setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (timeLeft === 0) {
      handleSessionComplete();
    }

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isRunning, timeLeft, handleSessionComplete]);

  const toggleTimer = () => setIsRunning(!isRunning);

  const resetTimer = () => {
    setIsRunning(false);
    setTimeLeft(SESSION_TIMES[sessionType]);
  };

  const switchSession = (type: SessionType) => {
    setIsRunning(false);
    setSessionType(type);
    setTimeLeft(SESSION_TIMES[type]);
  };

  const getSessionLabel = () => {
    switch (sessionType) {
      case "work":
        return language === "es" ? "Enfoque" : "Focus";
      case "shortBreak":
        return language === "es" ? "Descanso Corto" : "Short Break";
      case "longBreak":
        return language === "es" ? "Descanso Largo" : "Long Break";
    }
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <Timer className="w-5 h-5 text-primary" />
          <CardTitle className="text-base">
            {language === "es" ? "Pomodoro" : "Pomodoro Timer"}
          </CardTitle>
        </div>
        <CardDescription>
          {language === "es"
            ? "Técnica de enfoque: 25 min trabajo, 5 min descanso"
            : "Focus technique: 25 min work, 5 min break"}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Session Type Buttons */}
        <div className="flex gap-2">
          <Button
            variant={sessionType === "work" ? "default" : "outline"}
            size="sm"
            className="flex-1 gap-1"
            onClick={() => switchSession("work")}
          >
            <Brain className="w-3 h-3" />
            {language === "es" ? "Trabajo" : "Work"}
          </Button>
          <Button
            variant={sessionType === "shortBreak" ? "default" : "outline"}
            size="sm"
            className="flex-1 gap-1"
            onClick={() => switchSession("shortBreak")}
          >
            <Coffee className="w-3 h-3" />
            {language === "es" ? "Corto" : "Short"}
          </Button>
          <Button
            variant={sessionType === "longBreak" ? "default" : "outline"}
            size="sm"
            className="flex-1 gap-1"
            onClick={() => switchSession("longBreak")}
          >
            <Coffee className="w-3 h-3" />
            {language === "es" ? "Largo" : "Long"}
          </Button>
        </div>

        {/* Timer Display */}
        <div className="text-center py-4">
          <Badge variant="outline" className="mb-2">
            {getSessionLabel()}
          </Badge>
          <div
            className={cn(
              "text-5xl font-mono font-bold tabular-nums",
              sessionType === "work" ? "text-primary" : "text-green-600"
            )}
          >
            {formatTime(timeLeft)}
          </div>
          <Progress value={progress} className="mt-4 h-2" />
        </div>

        {/* Controls */}
        <div className="flex gap-2 justify-center">
          <Button
            variant={isRunning ? "outline" : "default"}
            size="lg"
            className="gap-2"
            onClick={toggleTimer}
          >
            {isRunning ? (
              <>
                <Pause className="w-4 h-4" />
                {language === "es" ? "Pausar" : "Pause"}
              </>
            ) : (
              <>
                <Play className="w-4 h-4" />
                {language === "es" ? "Iniciar" : "Start"}
              </>
            )}
          </Button>
          <Button variant="outline" size="lg" onClick={resetTimer}>
            <RotateCcw className="w-4 h-4" />
          </Button>
        </div>

        {/* Completed Count */}
        <div className="text-center text-sm text-muted-foreground">
          <span className="font-medium text-primary">{completedPomodoros}</span>{" "}
          {language === "es" ? "pomodoros hoy" : "pomodoros today"} 🍅
        </div>
      </CardContent>
    </Card>
  );
}
