'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { DollarSign, TrendingUp, AlertCircle, CheckCircle2, Loader2, ListOrdered, Activity } from 'lucide-react';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';

interface CostSummary {
  totalCost: number;
  budgetUsed: number;
  budgetRemaining: number;
  monthlyBudget: number;
  byService: Array<{
    service: string;
    cost: number;
    calls: number;
  }>;
  byDay: Array<{
    date: string;
    cost: number;
  }>;
}

interface BudgetHealth {
  status: 'healthy' | 'warning' | 'critical';
  message: string;
  percentage: number;
}

interface ProcessLog {
  id: number;
  process_type: string;
  status: 'success' | 'error';
  details: string;
  cost: number;
  created_at: string;
}

export default function DashboardPage() {
  const [summary, setSummary] = useState<CostSummary | null>(null);
  const [budgetHealth, setBudgetHealth] = useState<BudgetHealth | null>(null);
  const [logs, setLogs] = useState<ProcessLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const [costRes, logsRes] = await Promise.all([
        fetch('/api/costs/summary'),
        fetch('/api/logs?limit=20')
      ]);
      
      const costData = await costRes.json();
      const logsData = await logsRes.json();

      if (costData.success) {
        setSummary(costData.summary);
        setBudgetHealth(costData.budgetHealth);
      }
      
      if (logsData.success) {
        setLogs(logsData.logs);
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-transparent">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <Link href="/" className="text-sm text-gray-400 hover:text-white mb-2 inline-block transition-colors">
            ← Back to Home
          </Link>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-[oklch(0.65_0.2_50)] bg-clip-text text-transparent drop-shadow-[0_2px_10px_rgba(126,211,33,0.3)]">
            Cost Dashboard
          </h1>
          <p className="text-gray-300 mt-2">
            Monitor your API usage and budget
          </p>
        </div>

        {/* Budget Health Alert */}
        {budgetHealth && (
          <Card className={`mb-6 border bg-card/60 backdrop-blur-sm ${
            budgetHealth.status === 'critical' ? 'border-red-500/50' :
            budgetHealth.status === 'warning' ? 'border-[oklch(0.65_0.2_50)]/50' :
            'border-primary/50'
          }`}>
            <CardHeader>
              <div className="flex items-center gap-2">
                {budgetHealth.status === 'healthy' ? (
                  <CheckCircle2 className="w-5 h-5 text-primary" />
                ) : (
                  <AlertCircle className="w-5 h-5 text-[oklch(0.65_0.2_50)]" />
                )}
                <CardTitle className={
                  budgetHealth.status === 'critical' ? 'text-red-400' :
                  budgetHealth.status === 'warning' ? 'text-[oklch(0.65_0.2_50)]' :
                  'text-primary'
                }>
                  Budget Status: {budgetHealth.status.charAt(0).toUpperCase() + budgetHealth.status.slice(1)}
                </CardTitle>
              </div>
              <CardDescription className="text-gray-300">
                {budgetHealth.message}
              </CardDescription>
            </CardHeader>
          </Card>
        )}

        {/* Main Stats */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <Card className="bg-card/60 backdrop-blur-md border-white/5">
            <CardHeader className="pb-2">
              <CardDescription className="flex items-center gap-2 text-gray-400">
                <DollarSign className="w-4 h-4 text-primary" />
                Total Spent (This Month)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-white">
                ${summary?.totalCost.toFixed(2) || '0.00'}
              </div>
              <p className="text-sm text-gray-400 mt-1">
                of ${summary?.monthlyBudget.toFixed(2)} budget
              </p>
            </CardContent>
          </Card>

          <Card className="bg-card/60 backdrop-blur-md border-white/5">
            <CardHeader className="pb-2">
              <CardDescription className="flex items-center gap-2 text-gray-400">
                <TrendingUp className="w-4 h-4 text-primary" />
                Budget Used
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-white">
                {summary?.budgetUsed.toFixed(1)}%
              </div>
              <div className="w-full bg-white/10 rounded-full h-2 mt-3">
                <div
                  className={`h-2 rounded-full transition-all ${
                    (summary?.budgetUsed || 0) >= 100 ? 'bg-red-500' :
                    (summary?.budgetUsed || 0) >= 80 ? 'bg-[oklch(0.65_0.2_50)]' :
                    'bg-primary'
                  }`}
                  style={{ width: `${Math.min(summary?.budgetUsed || 0, 100)}%` }}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardDescription className="flex items-center gap-2">
                <DollarSign className="w-4 h-4" />
                Remaining Budget
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-600">
                ${summary?.budgetRemaining.toFixed(2) || '0.00'}
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                ~{Math.floor((summary?.budgetRemaining || 0) / 0.05)} posts left
              </p>
            </CardContent>
          </Card>
        </div>

        {/* By Service */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Cost by Service</CardTitle>
            <CardDescription>
              API usage breakdown by service
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {summary?.byService.map((service) => (
                <div key={service.service} className="flex items-center justify-between">
                  <div>
                    <div className="font-medium capitalize">{service.service}</div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      {service.calls} API calls
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold">${service.cost.toFixed(3)}</div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      ${(service.cost / service.calls).toFixed(4)}/call
                    </div>
                  </div>
                </div>
              ))}
              {(!summary?.byService || summary.byService.length === 0) && (
                <p className="text-center text-gray-500 py-8">
                  No API usage yet. Start by creating a post!
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Daily Breakdown */}
        <div className="grid lg:grid-cols-2 gap-8">
          <Card className="bg-card/60 backdrop-blur-md border-white/5">
            <CardHeader>
              <CardTitle className="text-white">Daily Spending</CardTitle>
              <CardDescription className="text-gray-400">
                Cost breakdown by day (last 10 entries)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {summary?.byDay.slice(0, 10).map((day) => (
                  <div key={day.date} className="flex items-center justify-between py-2 border-b border-white/5">
                    <div className="text-sm text-gray-300">{day.date}</div>
                    <div className="font-medium text-white">${day.cost.toFixed(3)}</div>
                  </div>
                ))}
                {(!summary?.byDay || summary.byDay.length === 0) && (
                  <p className="text-center text-gray-500 py-8">
                    No spending data yet
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Activity Logs */}
          <Card className="bg-card/60 backdrop-blur-md border-white/5">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Activity className="w-5 h-5 text-primary" />
                <CardTitle className="text-white">Recent Activity</CardTitle>
              </div>
              <CardDescription className="text-gray-400">
                Log of recent AI processes and costs
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {logs.map((log) => (
                  <div key={log.id} className="flex items-start gap-3 py-3 border-b border-white/5 last:border-0">
                    <div className={`mt-1 w-2 h-2 rounded-full ${log.status === 'success' ? 'bg-primary' : 'bg-red-500'}`} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-bold uppercase tracking-wider text-gray-500">
                          {log.process_type.replace('_', ' ')}
                        </span>
                        <span className="text-[10px] text-gray-600">
                          {new Date(log.created_at).toLocaleString()}
                        </span>
                      </div>
                      <p className="text-sm text-gray-300 line-clamp-2">{log.details}</p>
                      {log.cost > 0 && (
                        <div className="mt-1">
                          <Badge variant="outline" className="text-[10px] py-0 border-primary/20 text-primary">
                            Cost: ${log.cost.toFixed(4)}
                          </Badge>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
                {logs.length === 0 && (
                  <p className="text-center text-gray-500 py-8">
                    No activity recorded yet
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
