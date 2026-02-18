import { useState, useRef, useCallback } from "react";
import { Mic, MicOff, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface VoiceInputButtonProps {
  onTranscript: (text: string) => void;
  disabled?: boolean;
  className?: string;
  /** If true, appends to existing text instead of replacing */
  append?: boolean;
}

export function VoiceInputButton({ onTranscript, disabled, className, append }: VoiceInputButtonProps) {
  const [recording, setRecording] = useState(false);
  const [transcribing, setTranscribing] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream, { mimeType: "audio/webm" });
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop());
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        if (blob.size < 100) {
          toast.error("No audio captured");
          return;
        }
        await transcribe(blob);
      };

      mediaRecorder.start();
      setRecording(true);
    } catch {
      toast.error("Microphone access denied");
    }
  }, []);

  const stopRecording = useCallback(() => {
    mediaRecorderRef.current?.stop();
    setRecording(false);
  }, []);

  const transcribe = async (blob: Blob) => {
    setTranscribing(true);
    try {
      const formData = new FormData();
      formData.append("audio", blob, "recording.webm");

      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/elevenlabs-stt`,
        {
          method: "POST",
          headers: {
            apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: formData,
        }
      );

      if (!res.ok) throw new Error("Transcription failed");
      const data = await res.json();
      const text = data.text?.trim();
      if (text) {
        onTranscript(text);
      } else {
        toast.error("Could not understand audio");
      }
    } catch {
      toast.error("Voice transcription failed");
    } finally {
      setTranscribing(false);
    }
  };

  const busy = recording || transcribing;

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      disabled={disabled || transcribing}
      onClick={recording ? stopRecording : startRecording}
      className={cn(
        "shrink-0 h-8 w-8 rounded-full transition-all",
        recording && "bg-destructive/10 text-destructive animate-pulse",
        className
      )}
      title={recording ? "Stop recording" : "Voice input"}
    >
      {transcribing ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : recording ? (
        <MicOff className="w-4 h-4" />
      ) : (
        <Mic className="w-4 h-4" />
      )}
    </Button>
  );
}
