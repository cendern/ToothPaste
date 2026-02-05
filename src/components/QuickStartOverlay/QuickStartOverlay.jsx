import React, { useState, useEffect } from 'react';
import { Button, Typography } from "@material-tailwind/react";

const steps = [
  {
    title: 'Welcome to ToothPaste',
    description: 'A tool to quickly capture and send clipboard data via BLE to your paired devices without compromising security.',
    targetSelector: null,
    position: 'center',
  },
  {
    title: 'Navigation Menu',
    description: 'Toggle the menu to switch between Live Capture, Bulk Send, and other features.',
    targetSelector: '.navbar-toggle, [class*="Bars3Icon"]',
    position: 'top',
  },
  {
    title: 'Live Capture',
    description: 'Capture keyboard and mouse input in real-time. Type in the input area to capture commands.',
    targetSelector: 'main',
    position: 'top',
  },
  {
    title: 'Connection Status',
    description: 'Connect to a ToothPaste device via BLE to start sending clipboard data securely. Once connected, hold this button to rename the connected device.',
    targetSelector: '[class*="ConnectionButton"], .connection-status',
    position: 'top-right',
  },
];

function Spotlight({ target, padding = 10 }) {
  if (!target) return null;

  const rect = target.getBoundingClientRect();
  return (
    <div
      className="absolute border-2 border-primary"
      style={{
        top: rect.top - padding,
        left: rect.left - padding,
        width: rect.width + padding * 2,
        height: rect.height + padding * 2,
        boxShadow: 'inset 0 0 0 9999px rgba(0, 0, 0, 0.8)',
        pointerEvents: 'none',
        borderRadius: '8px',
        animation: 'pulse 2s infinite',
      }}
    />
  );
}

export default function QuickStartOverlay({ onChangeOverlay }) {
  const [currentStep, setCurrentStep] = useState(0);
  const [targetElement, setTargetElement] = useState(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      const selector = steps[currentStep].targetSelector;
      if (selector) {
        const element = document.querySelector(selector);
        setTargetElement(element);
      } else {
        setTargetElement(null);
      }
    }, 100);

    return () => clearTimeout(timer);
  }, [currentStep]);

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleComplete();
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleComplete = () => {
    localStorage.setItem('quickstart_completed', 'true');
    onChangeOverlay(null);
  };

  const handleSkip = () => {
    localStorage.setItem('quickstart_skipped', 'true');
    onChangeOverlay(null);
  };

  const step = steps[currentStep];
  const isLastStep = currentStep === steps.length - 1;

  return (
    <div className="fixed inset-0 z-[9999]">
      {/* Overlay */}
      <div
        className="absolute inset-0 bg-hover/60"
        onClick={handleSkip}
      />

      {/* Spotlight */}
      {targetElement && (
        <Spotlight target={targetElement} />
      )}

      {/* Tooltip Card */}
      <div
        className="fixed bg-shelf p-5 rounded-lg shadow-lg z-[10001] w-11/12 max-w-sm"
        style={{
          ...(currentStep === 0
            ? {
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
              }
            : {
                top: targetElement ? targetElement.getBoundingClientRect().top + targetElement.getBoundingClientRect().height + 40 : '50%',
                left: targetElement ? Math.max(20, targetElement.getBoundingClientRect().left + 20) : 'auto',
              }),
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-start mb-3">
          <Typography variant="h5" className="text-text font-sans normal-case font-semibold">
            {step.title}
          </Typography>
          <span className="text-xs font-semibold text-primary ml-2">
            {currentStep + 1} / {steps.length}
          </span>
        </div>

        <Typography className="text-text mb-4 text-sm leading-relaxed">
          {step.description}
        </Typography>

        <div className="flex gap-3">
          {currentStep > 0 && (
            <Button
              onClick={handlePrevious}
              variant="outline"
              className="flex-1 h-10 border-hover text-text hover:bg-hover font-sans normal-case"
            >
              Previous
            </Button>
          )}
          <Button
            onClick={handleSkip}
            variant="outline"
            className="flex-1 h-10 border-hover text-text hover:bg-hover font-sans normal-case"
          >
            Skip
          </Button>
          <Button
            onClick={handleNext}
            className="flex-1 h-10 bg-primary text-text hover:bg-primary font-sans normal-case"
          >
            {isLastStep ? 'Done' : 'Next'}
          </Button>
        </div>
      </div>
    </div>
  );
}
