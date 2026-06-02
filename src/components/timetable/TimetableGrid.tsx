import React, { useState, useCallback } from 'react'
import { TimetableEntry, TimeSlot, DayOfWeek } from '@/types'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { cn } from '@/utils/cn'
import { Plus, X, Clock, MapPin, User } from 'lucide-react'

const DAYS: DayOfWeek[] = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi']

interface TimetableGridProps {
  entries: TimetableEntry[]
  timeSlots: TimeSlot[]
  onAddEntry: (day: DayOfWeek, startTime: string) => void
  onEditEntry: (entry: TimetableEntry) => void
  onDeleteEntry: (id: number) => void
  viewMode: 'class' | 'teacher' | 'room'
  filterId?: number
}

export function TimetableGrid({ entries, timeSlots, onAddEntry, onEditEntry, onDeleteEntry, viewMode, filterId }: TimetableGridProps) {
  const [hoveredCell, setHoveredCell] = useState<{ day: DayOfWeek; time: string } | null>(null)

  const getEntriesForCell = (day: DayOfWeek, startTime: string) => {
    return entries.filter((e) => e.day === day && e.start_time === startTime)
  }

  const filteredSlots = timeSlots.filter((s) => !s.is_break)

  return (
    <div className="overflow-x-auto">
      <div className="min-w-[800px]">
        {/* Header - Jours */}
        <div className="grid grid-cols-[100px_repeat(6,1fr)] gap-1 mb-1">
          <div className="p-2"></div>
          {DAYS.map((day) => (
            <div key={day} className="p-2 text-center font-semibold text-sm bg-gray-100 rounded-lg">
              {day}
            </div>
          ))}
        </div>

        {/* Body - Créneaux */}
        <div className="space-y-1">
          {filteredSlots.map((slot) => (
            <div key={slot.id} className="grid grid-cols-[100px_repeat(6,1fr)] gap-1">
              {/* Heure */}
              <div className="p-2 text-xs text-gray-600 flex flex-col items-center justify-center bg-gray-50 rounded-lg">
                <span className="font-medium">{slot.start_time}</span>
                <span className="text-gray-400">{slot.end_time}</span>
              </div>

              {/* Cellules par jour */}
              {DAYS.map((day) => {
                const cellEntries = getEntriesForCell(day, slot.start_time)
                const isHovered = hoveredCell?.day === day && hoveredCell?.time === slot.start_time

                return (
                  <div
                    key={`${day}-${slot.id}`}
                    className={cn(
                      'min-h-[80px] p-1 rounded-lg border-2 border-dashed transition-all cursor-pointer relative',
                      cellEntries.length > 0
                        ? 'border-solid bg-primary-50 border-primary-200'
                        : isHovered
                        ? 'border-primary-400 bg-primary-50/50'
                        : 'border-gray-200 hover:border-gray-300'
                    )}
                    onMouseEnter={() => setHoveredCell({ day, time: slot.start_time })}
                    onMouseLeave={() => setHoveredCell(null)}
                    onClick={() => {
                      if (cellEntries.length === 0) {
                        onAddEntry(day, slot.start_time)
                      }
                    }}
                  >
                    {cellEntries.map((entry) => (
                      <div
                        key={entry.id}
                        className="bg-white rounded-md p-2 shadow-sm border border-primary-200 mb-1 last:mb-0"
                        onClick={(e) => {
                          e.stopPropagation()
                          onEditEntry(entry)
                        }}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <Badge variant="primary" size="sm">{entry.subject_code || entry.subject_name}</Badge>
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              onDeleteEntry(entry.id)
                            }}
                            className="text-gray-400 hover:text-danger"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                        <div className="space-y-0.5 text-xs text-gray-600">
                          <div className="flex items-center gap-1">
                            <User className="w-3 h-3" />
                            <span className="truncate">{entry.teacher_name}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <MapPin className="w-3 h-3" />
                            <span>{entry.room_name || '-'}</span>
                          </div>
                        </div>
                      </div>
                    ))}

                    {cellEntries.length === 0 && isHovered && (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <Plus className="w-5 h-5 text-primary-400" />
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
