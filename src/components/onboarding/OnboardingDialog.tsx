import { useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Store, Share2, DollarSign, ArrowRight, Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface OnboardingDialogProps {
  open: boolean;
  onComplete: () => void;
}

const steps = [
  {
    icon: Store,
    title: "Create Storefronts",
    description: "Build shareable product pages in seconds. Add your item, set a price, and you're ready to sell.",
    tip: "Use Quick Create for instant links"
  },
  {
    icon: Share2,
    title: "Share with Customers",
    description: "Send links via WhatsApp, email, or generate a QR code. Customers can order directly from the link.",
    tip: "Works on any device, no app needed"
  },
  {
    icon: DollarSign,
    title: "Get Paid & Track",
    description: "Mark orders as paid and track your earnings. Your customer list builds automatically.",
    tip: "AI helps with pricing and descriptions"
  }
];

export function OnboardingDialog({ open, onComplete }: OnboardingDialogProps) {
  const [currentStep, setCurrentStep] = useState(0);

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      onComplete();
    }
  };

  const handleSkip = () => {
    onComplete();
  };

  const step = steps[currentStep];
  const Icon = step.icon;
  const isLastStep = currentStep === steps.length - 1;

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent className="sm:max-w-md p-0 overflow-hidden" hideClose>
        {/* Progress bar */}
        <div className="flex gap-1.5 p-4 pb-0">
          {steps.map((_, index) => (
            <div
              key={index}
              className={cn(
                "h-1 flex-1 rounded-full transition-all duration-300",
                index <= currentStep ? "bg-primary" : "bg-muted"
              )}
            />
          ))}
        </div>

        {/* Content */}
        <div className="p-6 pt-4 text-center">
          {/* Icon */}
          <div className="relative w-20 h-20 mx-auto mb-6">
            <div className="absolute inset-0 rounded-2xl bg-primary/10 blur-xl animate-pulse" />
            <div className="relative w-20 h-20 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/20 flex items-center justify-center">
              <Icon className="w-10 h-10 text-primary" strokeWidth={1.5} />
            </div>
            {/* Step number */}
            <div className="absolute -top-2 -right-2 w-7 h-7 rounded-full bg-primary text-primary-foreground text-xs font-bold flex items-center justify-center">
              {currentStep + 1}
            </div>
          </div>

          {/* Text */}
          <h2 className="text-xl font-semibold text-foreground mb-2">{step.title}</h2>
          <p className="text-muted-foreground text-sm leading-relaxed mb-4">
            {step.description}
          </p>

          {/* Tip */}
          <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-primary/10 rounded-full text-xs text-primary font-medium">
            <Check className="w-3.5 h-3.5" />
            {step.tip}
          </div>
        </div>

        {/* Actions */}
        <div className="p-4 pt-0 flex gap-3">
          <Button
            variant="ghost"
            onClick={handleSkip}
            className="flex-1 text-muted-foreground"
          >
            Skip
          </Button>
          <Button onClick={handleNext} className="flex-1 gap-2">
            {isLastStep ? "Get Started" : "Next"}
            <ArrowRight className="w-4 h-4" />
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
