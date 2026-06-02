import React from 'react'
import { DashboardStats } from '@/types'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts'

interface StudentStatsProps {
  stats: DashboardStats
}

const COLORS = ['#3b82f6', '#ec4899', '#22c55e', '#f59e0b', '#8b5cf6', '#ef4444']

export function StudentStatsCharts({ stats }: StudentStatsProps) {
  const genderData = stats.students_by_gender?.map((g) => ({
    name: g.gender === 'M' ? 'Garçons' : 'Filles',
    value: g.count,
  })) || []

  const levelData = stats.students_by_level?.map((l) => ({
    name: l.level_name,
    effectif: l.count,
  })) || []

  const sectionData = stats.students_by_section?.map((s) => ({
    name: s.section_name,
    value: s.count,
  })) || []

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
      <Card>
        <CardHeader>
          <CardTitle>Répartition par sexe</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie
                data={genderData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={80}
                paddingAngle={5}
                dataKey="value"
                label={({ name, value }) => `${name}: ${value}`}
              >
                {genderData.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle>Effectifs par niveau</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={levelData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="effectif" fill="#3b82f6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  )
}
