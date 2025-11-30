// src/modules/surveys/components/SurveyChart.tsx
import { useEffect, useState } from 'react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts'
import { supabase } from '../../../lib/supabaseClient'

type SurveyChartProps = {
  surveyId: string
}

type ChartData = {
  question: string
  data: {
    option: string
    count: number
  }[]
}

const COLORS = ['#22c55e', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899']

export function SurveyChart({ surveyId }: SurveyChartProps) {
  const [chartData, setChartData] = useState<ChartData[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const loadData = async () => {
      setLoading(true)
      setError(null)

      try {
        // 1. Obtener preguntas de la encuesta
        const { data: questions, error: questionsError } = await supabase
          .from('questions')
          .select('id, question_text, options')
          .eq('survey_id', surveyId)
          .order('order', { ascending: true })

        if (questionsError) throw questionsError

        if (!questions || questions.length === 0) {
          setChartData([])
          setLoading(false)
          return
        }

        // 2. Obtener respuestas
        const { data: responses, error: responsesError } = await supabase
          .from('responses')
          .select('id')
          .eq('survey_id', surveyId)

        if (responsesError) throw responsesError

        if (!responses || responses.length === 0) {
          // No hay respuestas aún, mostrar opciones con 0
          const emptyChartData = questions.map((q) => ({
            question: q.question_text,
            data:
              Array.isArray(q.options)
                ? q.options.map((opt) => ({
                    option: opt,
                    count: 0,
                  }))
                : [],
          }))
          setChartData(emptyChartData)
          setLoading(false)
          return
        }

        const responseIds = responses.map((r) => r.id)

        // 3. Obtener las respuestas individuales
        const { data: answers, error: answersError } = await supabase
          .from('response_answers')
          .select('question_id, answer_value')
          .in('response_id', responseIds)

        if (answersError) throw answersError

        // 4. Procesar datos para gráficos
        const processedData: ChartData[] = questions.map((q) => {
          const questionAnswers = answers?.filter(
            (a) => a.question_id === q.id
          ) || []

          const optionCounts: Record<string, number> = {}

          // Inicializar contadores
          if (Array.isArray(q.options)) {
            q.options.forEach((opt) => {
              optionCounts[opt] = 0
            })
          }

          // Contar respuestas
          questionAnswers.forEach((a) => {
            const value = String(a.answer_value || '')
            if (value in optionCounts) {
              optionCounts[value]++
            }
          })

          return {
            question: q.question_text,
            data: Object.entries(optionCounts).map(([option, count]) => ({
              option,
              count,
            })),
          }
        })

        setChartData(processedData)
      } catch (err) {
        console.error('Error loading chart data:', err)
        setError(
          err instanceof Error ? err.message : 'Error cargando datos'
        )
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [surveyId])

  if (loading) {
    return <p style={{ color: '#999', fontSize: 14 }}>Cargando gráficos...</p>
  }

  if (error) {
    return <p style={{ color: '#ff4444', fontSize: 14 }}>Error: {error}</p>
  }

  if (chartData.length === 0) {
    return (
      <p style={{ color: '#999', fontSize: 14 }}>
        Esta encuesta no tiene preguntas aún.
      </p>
    )
  }

  return (
    <div style={{ marginTop: 24 }}>
      <h3 style={{ fontSize: 16, marginBottom: 16, color: '#fff' }}>
        Resultados de la encuesta
      </h3>

      {chartData.map((item, index) => (
        <div
          key={index}
          style={{
            marginBottom: 32,
            padding: 16,
            background: '#0f0f1e',
            borderRadius: 8,
          }}
        >
          <h4 style={{ fontSize: 14, marginBottom: 16, color: '#22c55e' }}>
            {item.question}
          </h4>

          {item.data.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={item.data}>
                <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                <XAxis
                  dataKey="option"
                  stroke="#999"
                  tick={{ fill: '#999', fontSize: 12 }}
                />
                <YAxis
                  stroke="#999"
                  tick={{ fill: '#999', fontSize: 12 }}
                  allowDecimals={false}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1a1a2e',
                    border: '1px solid #333',
                    borderRadius: 4,
                    color: '#fff',
                  }}
                  labelStyle={{ color: '#22c55e' }}
                  formatter={(value: number) => [`${value} respuestas`, '']}
                />
                <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                  {item.data.map((_, idx) => (
                    <Cell key={idx} fill={COLORS[idx % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p style={{ color: '#999', fontSize: 12 }}>
              No hay opciones para esta pregunta.
            </p>
          )}
        </div>
      ))}
    </div>
  )
}
