import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Sheet, 
  SheetContent, 
  SheetHeader, 
  SheetTitle,
  SheetTrigger 
} from "@/components/ui/sheet";
import { Sparkles, Send, Loader2, TrendingUp, Mic, MicOff, Volume2, VolumeX } from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useLanguage } from "@/hooks/useLanguage";
import { useElevenLabs } from "@/hooks/useElevenLabs";
import { useAICredits } from "@/hooks/useAICredits";
import { AiFloatingButton } from "./AiFloatingButton";
import { AIEmptyBanner } from "@/components/ai/AIEmptyBanner";

type Message = {
  role: "user" | "assistant";
  content: string;
};

const SUGGESTIONS_EN = [
  "How can I increase my revenue this month?",
  "Which products should I promote more?",
  "Who are my best customers?",
  "How can I convert my pending orders?",
  "What pricing changes would improve my margins?",
];

const SUGGESTIONS_ES = [
  "¿Cómo puedo aumentar mis ingresos este mes?",
  "¿Qué productos debería promocionar más?",
  "¿Quiénes son mis mejores clientes?",
  "¿Cómo puedo convertir mis pedidos pendientes?",
  "¿Qué cambios de precio mejorarían mis márgenes?",
];

export function BusinessAdvisor() {
  const { language, t } = useLanguage();
  const { hasCredits, consume } = useAICredits();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [autoSpeak, setAutoSpeak] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleTranscript = (text: string) => {
    setInput(text);
    // Auto-send after voice input
    setTimeout(() => sendMessage(text), 300);
  };

  const { 
    isPlaying: isSpeaking, 
    isRecording: isListening, 
    isTranscribing,
    speak, 
    stopSpeaking,
    startRecording: startListening,
    stopRecording: stopListening,
  } = useElevenLabs({
    onTranscript: handleTranscript
  });

  const suggestions = language === "es" ? SUGGESTIONS_ES : SUGGESTIONS_EN;

  // Auto-speak completed assistant messages
  const lastMessageRef = useRef<string>("");
  useEffect(() => {
    if (messages.length > 0 && autoSpeak && !isLoading) {
      const lastMsg = messages[messages.length - 1];
      if (lastMsg.role === "assistant" && lastMsg.content && lastMsg.content !== lastMessageRef.current) {
        lastMessageRef.current = lastMsg.content;
        speak(lastMsg.content);
      }
    }
  }, [messages, isLoading, autoSpeak, speak]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const sendMessage = async (messageText: string) => {
    if (!messageText.trim() || isLoading) return;

    // Gate AI usage
    if (!hasCredits) {
      toast.error(language === "es" ? "Sin créditos IA. Recarga para continuar." : "No AI credits. Recharge to continue.");
      return;
    }
    const ok = await consume();
    if (!ok) return;

    const userMessage: Message = { role: "user", content: messageText.trim() };
    setMessages(prev => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    let assistantContent = "";

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error("Please sign in to use the advisor");
        setIsLoading(false);
        return;
      }

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/business-advisor`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({ 
            messages: [...messages, userMessage],
            language
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        if (response.status === 402 || errorData.code === "INSUFFICIENT_CREDITS") {
          toast.error(language === "es" ? "Sin créditos IA. Recarga para continuar." : "No AI credits. Recharge to continue.");
          setIsLoading(false);
          return;
        }
        throw new Error(errorData.error || `Error: ${response.status}`);
      }

      if (!response.body) {
        throw new Error("No response body");
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      // Add assistant message placeholder
      setMessages(prev => [...prev, { role: "assistant", content: "" }]);

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });

        let newlineIndex: number;
        while ((newlineIndex = buffer.indexOf("\n")) !== -1) {
          let line = buffer.slice(0, newlineIndex);
          buffer = buffer.slice(newlineIndex + 1);

          if (line.endsWith("\r")) line = line.slice(0, -1);
          if (line.startsWith(":") || line.trim() === "") continue;
          if (!line.startsWith("data: ")) continue;

          const jsonStr = line.slice(6).trim();
          if (jsonStr === "[DONE]") break;

          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content;
            if (content) {
              assistantContent += content;
              setMessages(prev => {
                const updated = [...prev];
                updated[updated.length - 1] = { 
                  role: "assistant", 
                  content: assistantContent 
                };
                return updated;
              });
            }
          } catch {
            // Incomplete JSON, will be handled in next chunk
          }
        }
      }
    } catch (error) {
      console.error("Advisor error:", error);
      toast.error(error instanceof Error ? error.message : "Failed to get advice");
      // Remove the empty assistant message if there was an error
      if (!assistantContent) {
        setMessages(prev => prev.slice(0, -1));
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(input);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <div>
          <AiFloatingButton onClick={() => setOpen(true)} />
        </div>
      </SheetTrigger>
      
      <SheetContent 
        side="right" 
        className="w-full sm:max-w-md p-0 flex flex-col"
      >
        <SheetHeader className="p-4 border-b bg-gradient-to-r from-primary/10 to-primary/5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-primary" />
            </div>
            <div>
              <SheetTitle className="text-left">
                {t.businessAdvisor}
              </SheetTitle>
              <p className="text-xs text-muted-foreground">
                {t.aiInsights}
              </p>
            </div>
          </div>
        </SheetHeader>

        <ScrollArea className="flex-1 p-4" ref={scrollRef}>
          {!hasCredits && (
            <div className="mb-4">
              <AIEmptyBanner />
            </div>
          )}
          {messages.length === 0 ? (
            <div className="space-y-4">
              <div className="text-center py-6">
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                  <Sparkles className="w-8 h-8 text-primary" />
                </div>
                <h3 className="font-semibold text-lg mb-2">
                  {t.yourAiAdvisor}
                </h3>
                <p className="text-sm text-muted-foreground max-w-xs mx-auto">
                  {t.advisorIntro}
                </p>
              </div>
              
              <div className="space-y-2">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  {t.quickQuestions}
                </p>
                {suggestions.map((suggestion, i) => (
                  <button
                    key={i}
                    onClick={() => sendMessage(suggestion)}
                    className="w-full text-left p-3 rounded-xl bg-muted/50 hover:bg-muted text-sm transition-colors"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {messages.map((message, i) => (
                <div
                  key={i}
                  className={cn(
                    "flex",
                    message.role === "user" ? "justify-end" : "justify-start"
                  )}
                >
                  <div
                    className={cn(
                      "max-w-[85%] rounded-2xl px-4 py-2.5 text-sm",
                      message.role === "user"
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted"
                    )}
                  >
                    <p className="whitespace-pre-wrap leading-relaxed">
                      {message.content || (
                        <span className="flex items-center gap-2 text-muted-foreground">
                          <Loader2 className="w-4 h-4 animate-spin" />
                          {t.analyzingData}
                        </span>
                      )}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>

        <form onSubmit={handleSubmit} className="p-4 border-t bg-background">
          {/* Voice controls - ElevenLabs powered */}
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Button
                type="button"
                size="sm"
                variant={isListening ? "destructive" : "outline"}
                onClick={isListening ? stopListening : startListening}
                disabled={isLoading || isTranscribing}
                className="gap-2"
              >
                {isListening ? (
                  <>
                    <MicOff className="w-4 h-4" />
                    {t.stop}
                  </>
                ) : isTranscribing ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    {language === "es" ? "Transcribiendo..." : "Transcribing..."}
                  </>
                ) : (
                  <>
                    <Mic className="w-4 h-4" />
                    {t.speak}
                  </>
                )}
              </Button>
              {isListening && (
                <span className="text-xs text-muted-foreground animate-pulse">
                  {t.listening}
                </span>
              )}
            </div>
            <Button
              type="button"
              size="sm"
              variant="ghost"
              onClick={() => {
                if (isSpeaking) {
                  stopSpeaking();
                }
                setAutoSpeak(!autoSpeak);
              }}
              className="gap-2"
            >
            {autoSpeak ? (
                <>
                  <Volume2 className="w-4 h-4" />
                  {isSpeaking && <span className="text-xs">{t.speaking}</span>}
                </>
              ) : (
                <VolumeX className="w-4 h-4" />
              )}
            </Button>
          </div>
          
          <div className="flex gap-2">
            <Textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={t.askAboutBusiness}
              className="min-h-[44px] max-h-32 resize-none"
              rows={1}
              disabled={isLoading || isListening}
            />
            <Button 
              type="submit" 
              size="icon" 
              disabled={!input.trim() || isLoading}
              className="shrink-0"
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
            </Button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  );
}
