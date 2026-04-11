import { useState, useEffect } from 'react'
import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ResponsiveContainer,
  Tooltip,
} from 'recharts'
import api from '../services/api'

const MOCK_DATA = {
  ploScores: [
    { plo: 'PLO 1', name: 'Engineering Knowledge', score: 85, max: 100 },
    { plo: 'PLO 2', name: 'Problem Analysis', score: 78, max: 100 },
    { plo: 'PLO 3', name: 'Design/Development', score: 82, max: 100 },
    { plo: 'PLO 4', name: 'Investigation', score: 70, max: 100 },
    { plo: 'PLO 5', name: 'Modern Tool Usage', score: 88, max: 100 },
    { plo: 'PLO 6', name: 'Engineer & Society', score: 75, max: 100 },
    { plo: 'PLO 7', name: 'Environment & Sustainability', score: 65, max: 100 },
    { plo: 'PLO 8', name: 'Ethics', score: 90, max: 100 },
    { plo: 'PLO 9', name: 'Individual & Team Work', score: 72, max: 100 },
    { plo: 'PLO 10', name: 'Communication', score: 80, max: 100 },
    { plo: 'PLO 11', name: 'Project Management', score: 68, max: 100 },
    { plo: 'PLO 12', name: 'Lifelong Learning', score: 77, max: 100 },
  ],
  mapping: [
    { plo: 'PLO 1', course: 'CS3001 - Software Engineering', assessment: 'Midterm, Final', attainment: 85 },
    { plo: 'PLO 2', course: 'CS3002 - Database Systems', assessment: 'Assignments, Project', attainment: 78 },
    { plo: 'PLO 3', course: 'CS3001 - Software Engineering', assessment: 'Project, Lab', attainment: 82 },
    { plo: 'PLO 4', course: 'CS3003 - Operating Systems', assessment: 'Lab, Assignment', attainment: 70 },
    { plo: 'PLO 5', course: 'CS3002 - Database Systems', assessment: 'Lab, Project', attainment: 88 },
    { plo: 'PLO 6', course: 'HS3006 - Technical Writing', assessment: 'Report, Presentation', attainment: 75 },
    { plo: 'PLO 7', course: 'HS3006 - Technical Writing', assessment: 'Essay', attainment: 65 },
    { plo: 'PLO 8', course: 'HS3006 - Technical Writing', assessment: 'Case Study', attainment: 90 },
    { plo: 'PLO 9', course: 'CS3001 - Software Engineering', assessment: 'Group Project', attainment: 72 },
    { plo: 'PLO 10', course: 'HS3006 - Technical Writing', assessment: 'Presentation', attainment: 80 },
    { plo: 'PLO 11', course: 'CS3001 - Software Engineering', assessment: 'Project Plan', attainment: 68 },
    { plo: 'PLO 12', course: 'CS3003 - Operating Systems', assessment: 'Research Paper', attainment: 77 },
  ],
}

function MarksPLO() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await api.get('/marks/plo')
        setData(res.data)
      } catch {
        setData(MOCK_DATA)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-accent"></div>
      </div>
    )
  }

  const ploScores = data?.ploScores || []
  const mapping = data?.mapping || []

  const strengths = ploScores
    .filter((p) => (p?.score ?? 0) >= 80)
    .sort((a, b) => (b?.score ?? 0) - (a?.score ?? 0))
  const weaknesses = ploScores
    .filter((p) => (p?.score ?? 0) < 75)
    .sort((a, b) => (a?.score ?? 0) - (b?.score ?? 0))

  const avgScore = ploScores.length > 0
    ? (ploScores.reduce((s, p) => s + (p?.score ?? 0), 0) / ploScores.length).toFixed(1)
    : '0.0'

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded shadow p-4 text-center">
          <div className="text-3xl font-bold text-accent">
            {avgScore}%
          </div>
          <div className="text-sm text-gray-500 mt-1">Overall PLO Attainment</div>
        </div>
        <div className="bg-white rounded shadow p-4">
          <div className="text-sm font-semibold text-green-700 mb-2">Strengths</div>
          {strengths.slice(0, 3).map((p) => (
            <div key={p?.plo} className="flex justify-between text-xs text-gray-600 py-0.5">
              <span>{p?.plo}: {p?.name}</span>
              <span className="font-bold text-green-600">{p?.score ?? 0}%</span>
            </div>
          ))}
        </div>
        <div className="bg-white rounded shadow p-4">
          <div className="text-sm font-semibold text-red-700 mb-2">Areas for Improvement</div>
          {weaknesses.slice(0, 3).map((p) => (
            <div key={p?.plo} className="flex justify-between text-xs text-gray-600 py-0.5">
              <span>{p?.plo}: {p?.name}</span>
              <span className="font-bold text-red-600">{p?.score ?? 0}%</span>
            </div>
          ))}
        </div>
      </div>

      {/* Radar Chart */}
      <div className="rounded shadow overflow-hidden">
        <div className="card-header">PLO Attainment Radar Chart</div>
        <div className="card-body">
          <div className="h-[400px]">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={ploScores}>
                <PolarGrid />
                <PolarAngleAxis dataKey="plo" tick={{ fontSize: 11 }} />
                <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fontSize: 10 }} />
                <Radar
                  name="Score"
                  dataKey="score"
                  stroke="#3498db"
                  fill="#3498db"
                  fillOpacity={0.3}
                  strokeWidth={2}
                />
                <Tooltip
                  formatter={(value, name, props) => [
                    `${value}%`,
                    props?.payload?.name || '',
                  ]}
                />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* PLO Mapping Table */}
      <div className="rounded shadow overflow-hidden">
        <div className="card-header">PLO Mapping Details</div>
        <div className="bg-white overflow-x-auto">
          <table className="w-full text-sm table-striped">
            <thead>
              <tr className="bg-gray-100 text-gray-600">
                <th className="px-4 py-2 text-left font-medium">PLO</th>
                <th className="px-4 py-2 text-left font-medium">Course</th>
                <th className="px-4 py-2 text-left font-medium">Assessment</th>
                <th className="px-4 py-2 text-center font-medium">Attainment</th>
              </tr>
            </thead>
            <tbody>
              {mapping.map((row, i) => (
                <tr key={i} className="border-t border-gray-100">
                  <td className="px-4 py-2 font-semibold">{row?.plo ?? ''}</td>
                  <td className="px-4 py-2">{row?.course ?? ''}</td>
                  <td className="px-4 py-2 text-gray-600">{row?.assessment ?? ''}</td>
                  <td className="px-4 py-2 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-20 bg-gray-200 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full ${
                            (row?.attainment ?? 0) >= 80
                              ? 'bg-green-500'
                              : (row?.attainment ?? 0) >= 70
                              ? 'bg-yellow-500'
                              : 'bg-red-500'
                          }`}
                          style={{ width: `${row?.attainment ?? 0}%` }}
                        ></div>
                      </div>
                      <span className="text-xs font-medium">{row?.attainment ?? 0}%</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

export default MarksPLO
