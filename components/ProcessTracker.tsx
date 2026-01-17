'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle2, Circle, Loader2, XCircle, Clock } from 'lucide-react';

export interface ProcessStep {
  label: string;
  status: 'pending' | 'active' | 'done' | 'error';
  errorMsg?: string;
  details?: string;
  startTime?: number;
  endTime?: number;
}

interface ProcessTrackerProps {
  title: string;
  description: string;
  steps: ProcessStep[];
  currentProgress?: number;
}

export default function ProcessTracker({ title, description, steps, currentProgress }: ProcessTrackerProps) {
  const calculateDuration = (step: ProcessStep) => {
    if (step.startTime && step.endTime) {
      return ((step.endTime - step.startTime) / 1000).toFixed(2) + 's';
    }
    return null;
  };

  const getStepIcon = (step: ProcessStep) => {
    switch (step.status) {
      case 'done':
        return <CheckCircle2 className="w-5 h-5 text-primary" />;
      case 'active':
        return <Loader2 className="w-5 h-5 text-[oklch(0.65_0.2_50)] animate-spin" />;
      case 'error':
        return <XCircle className="w-5 h-5 text-red-500" />;
      default:
        return <Circle className="w-5 h-5 text-gray-600" />;
    }
  };

  const getProgressPercentage = () => {
    if (currentProgress !== undefined) return currentProgress;

    const completed = steps.filter(s => s.status === 'done').length;
    return Math.round((completed / steps.length) * 100);
  };

  const progress = getProgressPercentage();

  return (
    <Card className="border-primary/20 bg-card/60 backdrop-blur-md">
      <CardHeader>
        <CardTitle className="text-white">{title}</CardTitle>
        <CardDescription className="text-gray-400">{description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="font-medium text-primary">
              {steps.find(s => s.status === 'active')?.label || 'Processing...'}
            </span>
            <span className="text-gray-500">{progress}%</span>
          </div>
          <div className="w-full bg-white/10 rounded-full h-3 overflow-hidden">
            <div
              className="bg-gradient-to-r from-primary to-[oklch(0.65_0.2_50)] h-full transition-all duration-500 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Step List */}
        <div className="space-y-3">
          {steps.map((step, index) => (
            <div
              key={index}
              className={`flex items-start gap-3 p-3 rounded-lg transition-all ${
                step.status === 'active' ? 'bg-primary/10 border-2 border-primary/30' :
                step.status === 'done' ? 'bg-[oklch(0.6_0.2_300)]/10 border border-[oklch(0.6_0.2_300)]/20' :
                step.status === 'error' ? 'bg-red-900/20 border border-red-500/50' :
                'bg-white/5 border border-white/10'
              }`}
            >
              {/* Icon */}
              <div className="mt-0.5">
                {getStepIcon(step)}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <p className={`font-medium text-sm ${
                    step.status === 'active' ? 'text-white' :
                    step.status === 'done' ? 'text-[oklch(0.6_0.2_300)]' :
                    step.status === 'error' ? 'text-red-400' :
                    'text-gray-500'
                  }`}>
                    {step.label}
                  </p>
                  {calculateDuration(step) && (
                    <span className="text-xs text-gray-500 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {calculateDuration(step)}
                    </span>
                  )}
                </div>

                {/* Details */}
                {step.details && (
                  <p className="text-xs text-gray-400 mt-1">{step.details}</p>
                )}

                {/* Error Message */}
                {step.errorMsg && (
                  <p className="text-xs text-red-400 mt-1 font-medium">{step.errorMsg}</p>
                )}

                {/* Active Indicator */}
                {step.status === 'active' && (
                  <div className="flex items-center gap-2 mt-2">
                    <div className="flex gap-1">
                      <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                      <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                      <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                    </div>
                    <span className="text-xs text-primary">Processing...</span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Summary */}
        {steps.every(s => s.status === 'done') && (
          <div className="bg-primary/10 border-2 border-primary/30 rounded-lg p-3 flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-primary" />
            <p className="text-sm font-medium text-primary">
              All steps completed successfully!
            </p>
          </div>
        )}

        {steps.some(s => s.status === 'error') && (
          <div className="bg-red-900/20 border-2 border-red-500/50 rounded-lg p-3 flex items-center gap-2">
            <XCircle className="w-5 h-5 text-red-500" />
            <p className="text-sm font-medium text-red-400">
              Process failed. Please check the errors above.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
