"use client";

import { useState, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useQueryState, parseAsInteger, parseAsString } from "nuqs";
import type { PropertyFormData } from "./property-form-schema";
import { PropertyForm } from "./property-form";

interface PropertyFormStepsProps {
  onSubmit: (data: PropertyFormData) => Promise<void>;
  initialData?: Partial<PropertyFormData>;
}

const TOTAL_STEPS = 8;

export function PropertyFormSteps({
  onSubmit,
  initialData,
}: PropertyFormStepsProps) {
  // URL-backed step so wizard position survives refresh
  const [currentStep, setCurrentStep] = useQueryState(
    "step",
    parseAsInteger.withDefault(1),
  );
  const [formData, setFormData] = useState<Partial<PropertyFormData>>(
    initialData || {},
  );
  const formRef = useRef<{ triggerSubmit: () => void }>(null);

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
    await onSubmit(data);
  };

  const handleNextClick = () => {
    if (formRef.current) {
      formRef.current.triggerSubmit();
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
        ) : null}
      </div>
    </div>
  );
}

