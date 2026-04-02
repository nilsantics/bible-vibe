'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { Play, Trash2, BookOpen, ChevronRight, CheckCircle2 } from 'lucide-react'
import { PLAN_TEMPLATES, getTodayAssignment, type PlanTemplate } from '@/lib/reading-plans'

interface ActivePlan {
  id: string
  plan_type: string
  name: string
  start_date: string
  end_date: string
}

interface Props {
  templates: PlanTemplate[]
  activePlans: ActivePlan[]
}

export function PlansClient({ templates, activePlans: initialPlans }: Props) {
  const [activePlans, setActivePlans] = useState<ActivePlan[]>(initialPlans)
  const [starting, setStarting] = useState<string | null>(null)
  const [completing, setCompleting] = useState<string | null>(null)

  async function markDayComplete(plan: ActivePlan) {
    setCompleting(plan.id)
    // Advance start_date by 1 day so tomorrow's assignment becomes today's
    const newStart = new Date(plan.start_date)
    newStart.setDate(newStart.getDate() - 1)
    const res = await fetch('/api/plans', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: plan.id, start_date: newStart.toISOString().split('T')[0] }),
    })
    if (res.ok) {
      setActivePlans((prev) => prev.map((p) => p.id === plan.id ? { ...p, start_date: newStart.toISOString().split('T')[0] } : p))
      toast.success('Day marked complete!')
    } else {
      toast.error('Failed to mark complete')
    }
    setCompleting(null)
  }

  async function startPlan(template: PlanTemplate) {
    setStarting(template.id)
    const res = await fetch('/api/plans', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        plan_type: template.id,
        name: template.name,
        description: template.description,
        duration_days: template.durationDays,
      }),
    })
    const data = await res.json()
    if (data.plan) {
      setActivePlans((prev) => [data.plan, ...prev])
      toast.success(`Started: ${template.name}`)
    } else {
      toast.error('Failed to start plan')
    }
    setStarting(null)
  }

  async function stopPlan(id: string, name: string) {
    await fetch(`/api/plans?id=${id}`, { method: 'DELETE' })
    setActivePlans((prev) => prev.filter((p) => p.id !== id))
    toast.success(`Stopped: ${name}`)
  }

  return (
    <div className="space-y-8">
      {/* Active plans */}
      {activePlans.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold mb-3" style={{ fontFamily: 'system-ui' }}>
            Active Plans
          </h2>
          <div className="space-y-3">
            {activePlans.map((plan) => {
              const template = PLAN_TEMPLATES.find((t) => t.id === plan.plan_type)
              const start = new Date(plan.start_date)
              const end = new Date(plan.end_date)
              const today = new Date()
              const elapsed = Math.max(0, Math.floor((today.getTime() - start.getTime()) / 86400000))
              const total = Math.max(1, Math.floor((end.getTime() - start.getTime()) / 86400000))
              const progress = Math.min(100, Math.round((elapsed / total) * 100))
              const todayTask = template ? getTodayAssignment(template, plan.start_date) : null

              const isCompleted = elapsed >= total

              if (isCompleted) {
                return (
                  <Card key={plan.id} className="p-5 border-emerald-500/30 bg-gradient-to-br from-emerald-50/60 to-emerald-100/40 dark:from-emerald-950/30 dark:to-emerald-900/20">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3">
                        <span className="text-3xl">🎉</span>
                        <div>
                          <p className="font-semibold text-sm text-emerald-700 dark:text-emerald-400" style={{ fontFamily: 'system-ui' }}>
                            Plan complete!
                          </p>
                          <p className="font-medium text-sm mt-0.5" style={{ fontFamily: 'system-ui' }}>{plan.name}</p>
                          <p className="text-xs text-muted-foreground mt-1" style={{ fontFamily: 'system-ui' }}>
                            Finished in {total} days — well done.
                          </p>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="w-7 h-7 text-muted-foreground hover:text-destructive shrink-0"
                        onClick={() => stopPlan(plan.id, plan.name)}
                        title="Remove"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </Card>
                )
              }

              return (
                <Card key={plan.id} className="p-4 border-primary/20">
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-lg">{template?.icon ?? '📖'}</span>
                        <span className="font-medium text-sm" style={{ fontFamily: 'system-ui' }}>
                          {plan.name}
                        </span>
                        <Badge variant="secondary" className="text-xs">Day {elapsed + 1}</Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1" style={{ fontFamily: 'system-ui' }}>
                        {elapsed} of {total} days • {progress}% complete
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="w-7 h-7 text-muted-foreground hover:text-destructive shrink-0"
                      onClick={() => stopPlan(plan.id, plan.name)}
                      title="Stop plan"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                  <Progress value={progress} className="h-1.5 mb-3" />
                  {todayTask && (
                    <div className="flex gap-2">
                      <Link
                        href={`/dashboard/reading/${todayTask.bookName.toLowerCase().replace(/\s+/g, '-')}/${todayTask.chapters[0]}`}
                        className="flex-1"
                      >
                        <div className="flex items-center gap-2 text-xs bg-primary/5 hover:bg-primary/10 rounded-lg px-3 py-2 transition-colors">
                          <BookOpen className="w-3.5 h-3.5 text-primary shrink-0" />
                          <span style={{ fontFamily: 'system-ui' }}>
                            <span className="font-medium">Today: </span>
                            {todayTask.bookName} {todayTask.chapters.join(', ')}
                          </span>
                          <ChevronRight className="w-3.5 h-3.5 text-muted-foreground ml-auto shrink-0" />
                        </div>
                      </Link>
                      <button
                        onClick={() => markDayComplete(plan)}
                        disabled={completing === plan.id}
                        title="Mark today complete"
                        className="flex items-center justify-center w-9 h-9 rounded-lg bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:hover:bg-emerald-900/50 text-emerald-600 dark:text-emerald-400 transition-colors shrink-0"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </Card>
              )
            })}
          </div>
        </div>
      )}

      {/* Plan templates */}
      <div>
        <h2 className="text-sm font-semibold mb-3" style={{ fontFamily: 'system-ui' }}>
          {activePlans.length > 0 ? 'Add Another Plan' : 'Choose a Plan'}
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {templates.map((template) => {
            const isActive = activePlans.some((p) => p.plan_type === template.id)
            return (
              <Card key={template.id} className={`p-4 ${isActive ? 'opacity-60' : 'hover:border-primary/40'} transition-colors`}>
                <div className="flex items-start gap-3">
                  <span className="text-2xl">{template.icon}</span>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm mb-1" style={{ fontFamily: 'system-ui' }}>
                      {template.name}
                    </p>
                    <p className="text-xs text-muted-foreground mb-3" style={{ fontFamily: 'system-ui' }}>
                      {template.description}
                    </p>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs">
                        {template.durationDays} days
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        ~{template.chaptersPerDay} ch/day
                      </Badge>
                    </div>
                  </div>
                </div>
                <Button
                  size="sm"
                  className="w-full mt-3 gap-1.5 text-xs"
                  variant={isActive ? 'secondary' : 'default'}
                  disabled={isActive || starting === template.id}
                  onClick={() => !isActive && startPlan(template)}
                >
                  <Play className="w-3 h-3" />
                  {isActive ? 'Already active' : starting === template.id ? 'Starting…' : 'Start plan'}
                </Button>
              </Card>
            )
          })}
        </div>
      </div>
    </div>
  )
}
