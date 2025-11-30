// src/modules/surveys/hooks/useSurveys.ts
import { useEffect, useState } from 'react'
import { supabase } from '../../../lib/supabaseClient'
import { useAuth } from '../../../context/AuthContext'

export interface SurveyRow {
  id: string
  owner_id: string | null
  title: string
  description: string | null
  public_slug: string | null
  is_active: boolean
  created_at: string
}

type Status = 'idle' | 'loading' | 'success' | 'error'

export function useSurveys(forceReload?: number) {
  const { user } = useAuth()
  const [status, setStatus] = useState<Status>('idle')
  const [data, setData] = useState<SurveyRow[]>([])
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!user) return

    let isMounted = true

    const load = async () => {
      console.log('🔄 useSurveys: Loading surveys...', { forceReload })
      setStatus('loading')
      setError(null)

      const { data, error } = await supabase
        .from('surveys')
        .select(
          'id, owner_id, title, description, public_slug, is_active, created_at'
        )
        .eq('owner_id', user.id)
        .order('created_at', { ascending: false })

      console.log('📡 Raw Supabase response:', { data, error, count: data?.length })
      if (data && data.length > 0) {
        data.forEach((survey, index) => {
          console.log(`📋 Survey ${index}:`, {
            id: survey.id,
            title: survey.title,
            slug: survey.public_slug,
            created: survey.created_at
          })
        })
      }

      if (!isMounted) return

      if (error) {
        setError(error.message)
        setStatus('error')
      } else {
        console.log('✅ useSurveys: Loaded surveys:', data)
        setData(data ?? [])
        setStatus('success')
      }
    }

    load()

    return () => {
      isMounted = false
    }
  }, [user, forceReload])

  return { status, data, error }
}