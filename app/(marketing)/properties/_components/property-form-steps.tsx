"use client";

import { useState, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ChevronLeft, ChevronRight, Save, Loader2, CheckCircle2 } from "lucide-react";
import { useQueryState, parseAsString } from "nuqs";
import type { PropertyFormData } from "./property-form-schema";
import { PropertyForm } from "./property-form";

interface PropertyFormStepsProps {
  onSubmit: (data: PropertyFormData) => Promise<void>;
  initialData?: Partial<PropertyFormData>;
  onSuccess?: () => void;
}

const TOTAL_STEPS = 9;

export function PropertyFormSteps({
  onSubmit,
  initialData,
  onSuccess,
}: PropertyFormStepsProps) {
  // URL-backed step so wizard position survives refresh
  const [stepQuery, setStepQuery] = useQueryState(
    "step",
    parseAsString.withDefault("1"),
  );
  const currentStep = Number(stepQuery) || 1;
  const setCurrentStep = (step: number) => setStepQuery(String(step));
  const [formData, setFormData] = useState<Partial<PropertyFormData>>(
    initialData || {},
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  const formRef = useRef<{ triggerSubmit: () => void; isUploading: boolean }>(null);

  // Read location from URL so we can show footer hint without prop drilling
  const [locLat] = useQueryState("locLat", parseAsString.withDefault("0"));
  const [locLng] = useQueryState("locLng", parseAsString.withDefault("0"));

  const handleNext = (data: Partial<PropertyFormData>) => {
    setFormData((prev) => ({ ...prev, ...data }));
    if (currentStep < TOTAL_STEPS) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = async (data: PropertyFormData) => {
    setIsSubmitting(true);
    try {
      await onSubmit(data);
      setShowSuccessDialog(true);
      // Call onSuccess callback if provided (for redirect)
      onSuccess?.();
    } catch (error) {
      console.error("Error submitting form:", error);
      setIsSubmitting(false);
      setShowSuccessDialog(false);
    }
  };

  const handleNextClick = () => {
    console.log("🖱️ Next button clicked");
    console.log("📍 Current step:", currentStep);
    console.log("📍 URL location state - locLat:", locLat, "locLng:", locLng);
    
    if (formRef.current) {
      console.log("✅ formRef.current exists, calling triggerSubmit");
      formRef.current.triggerSubmit();
    } else {
      console.log("❌ formRef.current is null!");
    }
  };

  const progress = (currentStep / TOTAL_STEPS) * 100;

  return (
    <div className="space-y-6">
      {/* Progress Indicator */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="font-medium">
            Step {currentStep} of {TOTAL_STEPS}
          </span>
          <span className="text-muted-foreground">
            {Math.round(progress)}% Complete
          </span>
        </div>
        <Progress value={progress} />
      </div>

      {/* Form Content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentStep}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.2 }}
        >
          <PropertyForm
            ref={formRef}
            step={currentStep}
            formData={formData}
            onNext={handleNext}
            onSubmit={handleSubmit}
            onPrevious={handlePrevious}
            canGoBack={currentStep > 1}
            isLastStep={currentStep === TOTAL_STEPS}
            onLoadingChange={setIsSubmitting}
          />
        </motion.div>
      </AnimatePresence>

      {/* Navigation Buttons */}
      <div className="flex items-center justify-between border-t pt-4">
        <Button
          type="button"
          variant="outline"
          onClick={handlePrevious}
          disabled={currentStep === 1}
        >
          <ChevronLeft className="mr-2 h-4 w-4" />
          Previous
        </Button>
        <div className="text-sm text-muted-foreground">
          {currentStep === 1 &&
            !(
              (locLat && locLat !== "0") ||
              (locLng && locLng !== "0")
            ) &&
            "Location selection is required"}
        </div>
        {currentStep < TOTAL_STEPS ? (
          <Button type="button" onClick={handleNextClick}>
            Next
            <ChevronRight className="ml-2 h-4 w-4" />
          </Button>
        ) : (
          <Button
            type="button"
            onClick={handleNextClick}
            disabled={isSubmitting || formRef.current?.isUploading}
          >
            {isSubmitting || formRef.current?.isUploading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {formRef.current?.isUploading ? "Uploading..." : "Submitting..."}
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Submit
              </>
            )}
          </Button>
        )}
      </div>

      {/* Success Dialog */}
      <Dialog
        open={showSuccessDialog}
        onOpenChange={(open) => {
          if (!open) {
            setShowSuccessDialog(false);
            setIsSubmitting(false);
          }
        }}
      >
        <DialogContent className="sm:max-w-md" showCloseButton={false}>
          <DialogHeader>
            <motion.div
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{
                type: "spring",
                stiffness: 200,
                damping: 15,
              }}
              className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/20"
            >
              <CheckCircle2 className="h-10 w-10 text-green-600 dark:text-green-400" />
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <DialogTitle className="text-center text-2xl">
                Property Listed Successfully!
              </DialogTitle>
              <DialogDescription className="text-center mt-2">
                Your property has been successfully listed. You will be redirected
                to view your property shortly.
              </DialogDescription>
            </motion.div>
          </DialogHeader>
        </DialogContent>
      </Dialog>
    </div>
  );
}

