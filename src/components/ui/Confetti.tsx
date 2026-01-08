import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

interface ConfettiPiece {
  id: number;
  left: number;
  delay: number;
  duration: number;
  color: string;
  size: number;
  rotation: number;
}

interface ConfettiProps {
  show: boolean;
  onComplete?: () => void;
  className?: string;
}

const COLORS = [
  "hsl(var(--primary))",
  "hsl(45, 100%, 50%)", // gold
  "hsl(280, 100%, 65%)", // purple
  "hsl(160, 100%, 45%)", // green
  "hsl(350, 100%, 65%)", // pink
  "hsl(200, 100%, 55%)", // blue
];

export function Confetti({ show, onComplete, className }: ConfettiProps) {
  const [pieces, setPieces] = useState<ConfettiPiece[]>([]);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (show) {
      const newPieces: ConfettiPiece[] = Array.from({ length: 50 }, (_, i) => ({
        id: i,
        left: Math.random() * 100,
        delay: Math.random() * 0.5,
        duration: 2 + Math.random() * 2,
        color: COLORS[Math.floor(Math.random() * COLORS.length)],
        size: 6 + Math.random() * 8,
        rotation: Math.random() * 360,
      }));
      setPieces(newPieces);
      setVisible(true);

      const timeout = setTimeout(() => {
        setVisible(false);
        onComplete?.();
      }, 4000);

      return () => clearTimeout(timeout);
    }
  }, [show, onComplete]);

  if (!visible) return null;

  return (
    <div className={cn("fixed inset-0 pointer-events-none z-50 overflow-hidden", className)}>
      {pieces.map((piece) => (
        <div
          key={piece.id}
          className="absolute animate-confetti-fall"
          style={{
            left: `${piece.left}%`,
            top: "-20px",
            animationDelay: `${piece.delay}s`,
            animationDuration: `${piece.duration}s`,
          }}
        >
          <div
            className="animate-confetti-spin"
            style={{
              width: piece.size,
              height: piece.size * 0.6,
              backgroundColor: piece.color,
              transform: `rotate(${piece.rotation}deg)`,
              borderRadius: "2px",
            }}
          />
        </div>
      ))}
    </div>
  );
}

interface CelebrationProps {
  show: boolean;
  message?: string;
  subMessage?: string;
  onComplete?: () => void;
}

export function Celebration({ show, message, subMessage, onComplete }: CelebrationProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (show) {
      setVisible(true);
      const timeout = setTimeout(() => {
        setVisible(false);
        onComplete?.();
      }, 3500);
      return () => clearTimeout(timeout);
    }
  }, [show, onComplete]);

  if (!visible) return null;

  return (
    <>
      <Confetti show={show} />
      <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none">
        <div className="animate-celebration-pop bg-background/95 backdrop-blur-sm rounded-2xl p-8 shadow-2xl border-2 border-primary/30 text-center max-w-sm mx-4">
          <div className="text-6xl mb-4 animate-bounce">🎉</div>
          <h2 className="text-2xl font-bold text-foreground mb-2">
            {message || "Goal Achieved!"}
          </h2>
          {subMessage && (
            <p className="text-muted-foreground text-sm">{subMessage}</p>
          )}
        </div>
      </div>
    </>
  );
}
