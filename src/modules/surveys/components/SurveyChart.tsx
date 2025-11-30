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
      console.log('📊 SurveyChart: Starting loadData for surveyId:', surveyId)
      setLoading(true)
      setError(null)

      try {
        // 1. Obtener preguntas de la encuesta
        console.log('📝 Step 1: Fetching questions for survey:', surveyId)
        const { data: questions, error: questionsError } = await supabase
          .from('questions')
          .select('id, question_text, options')
          .eq('survey_id', surveyId)
          .order('order', { ascending: true })

        console.log('📝 Questions result:', { questions, error: questionsError?.message })

        if (questionsError) throw questionsError

        if (!questions || questions.length === 0) {
          console.log('⚠️ No questions found for survey:', surveyId)
          setChartData([])
          setLoading(false)
          return
        }

        console.log(`✅ Found ${questions.length} questions`)

        // 2. Obtener respuestas
        console.log('💬 Step 2: Fetching responses for survey:', surveyId)
        const { data: responses, error: responsesError } = await supabase
          .from('responses')
          .select('id')
          .eq('survey_id', surveyId)

        console.log('💬 Responses result:', { count: responses?.length, error: responsesError?.message })

        if (responsesError) throw responsesError

        if (!responses || responses.length === 0) {
          console.log('⚠️ No responses found, showing empty chart')
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
        console.log('✅ Found responses, IDs:', responseIds)

        // 3. Obtener las respuestas individuales
        console.log('🎯 Step 3: Fetching answers for response_ids:', responseIds)
        const { data: answers, error: answersError } = await supabase
          .from('response_answers')
          .select('question_id, answer_value')
          .in('response_id', responseIds)

        console.log('🎯 Answers result:', { count: answers?.length, error: answersError?.message, answers })

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

        console.log('📈 Step 4: Processed chart data:', processedData)
        setChartData(processedData)
        console.log('✅ SurveyChart: Load complete, chart data set')
      } catch (err) {
        console.error('💥 Error loading chart data:', err)
        setError(
          err instanceof Error ? err.message : 'Error cargando datos'
        )
      } finally {
        setLoading(false)
      }
    }

    console.log('🔄 SurveyChart useEffect triggered, calling loadData()')
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
      <h3 style={{ fontSize: 18, marginBottom: 16, color: '#1f2937', fontWeight: 600 }}>
        Resultados de la encuesta
      </h3>

      {chartData.map((item, index) => (
        <div
          key={index}
          style={{
            marginBottom: 32,
            padding: 20,
            background: '#f9fafb',
            borderRadius: 12,
            border: '1px solid #e5e7eb',
          }}
        >
          <h4 style={{ fontSize: 15, marginBottom: 16, color: '#667eea', fontWeight: 600 }}>
            {item.question}
          </h4>

          {item.data.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={item.data}>
                <CartesianGrid strokeDasharray="3 3" stroke="#d1d5db" />
                <XAxis
                  dataKey="option"
                  stroke="#6b7280"
                  tick={{ fill: '#4b5563', fontSize: 12 }}
                />
                <YAxis
                  stroke="#6b7280"
                  tick={{ fill: '#4b5563', fontSize: 12 }}
                  allowDecimals={false}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#ffffff',
                    border: '1px solid #e5e7eb',
                    borderRadius: 8,
                    color: '#1f2937',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                  }}
                  labelStyle={{ color: '#667eea', fontWeight: 600 }}
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
            <p style={{ color: '#6b7280', fontSize: 12 }}>
              No hay opciones para esta pregunta.
            </p>
          )}
        </div>
      ))}
    </div>
  )
}
