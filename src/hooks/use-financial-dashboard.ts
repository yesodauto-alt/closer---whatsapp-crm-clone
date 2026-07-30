import { useEffect, useMemo, useState } from 'react'
import { supabase } from '@/lib/supabase/client'
import { useOrganization } from './use-organization'

interface OpportunityRow {
  id: string
  stage: string
  created_at: string
  opportunity_items: Array<{
    total: number | string
    product_id: string | null
  }>
}

export function useFinancialDashboard() {
  const { organizationId, loading: organizationLoading } = useOrganization()
  const [opportunities, setOpportunities] = useState<OpportunityRow[]>([])
  const [productCount, setProductCount] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!organizationId) {
      if (!organizationLoading) setLoading(false)
      return
    }

    const load = async () => {
      setLoading(true)
      const [opportunityResult, productResult] = await Promise.all([
        (supabase as any)
          .from('opportunities')
          .select('id, stage, created_at, opportunity_items(total, product_id)')
          .eq('organization_id', organizationId),
        (supabase as any)
          .from('products')
          .select('id', { count: 'exact', head: true })
          .eq('organization_id', organizationId)
          .eq('is_active', true),
      ])
      setOpportunities((opportunityResult.data ?? []) as OpportunityRow[])
      setProductCount(productResult.count ?? 0)
      setLoading(false)
    }
    load()
  }, [organizationId, organizationLoading])

  return useMemo(() => {
    const valueOf = (opportunity: OpportunityRow) =>
      (opportunity.opportunity_items ?? []).reduce(
        (total, item) => total + Number(item.total || 0),
        0,
      )
    const pipelineValue = opportunities.reduce(
      (total, opportunity) => total + valueOf(opportunity),
      0,
    )
    const won = opportunities.filter((opportunity) =>
      ['won', 'ganho', 'closed_won'].includes(opportunity.stage.toLowerCase()),
    )
    const wonValue = won.reduce((total, opportunity) => total + valueOf(opportunity), 0)
    const ticketAverage = won.length > 0 ? wonValue / won.length : 0
    const conversionRate = opportunities.length > 0 ? (won.length / opportunities.length) * 100 : 0

    return {
      pipelineValue,
      wonValue,
      ticketAverage,
      conversionRate,
      opportunityCount: opportunities.length,
      productCount,
      loading,
    }
  }, [opportunities, productCount, loading])
}
