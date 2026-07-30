import { useCallback, useEffect, useState } from 'react'
import { toast } from 'sonner'
import { supabase } from '@/lib/supabase/client'
import { useAuth } from './use-auth'
import { useOrganization } from './use-organization'
import type { Product } from '@/lib/types'

export type ProductInput = Pick<
  Product,
  'item_type' | 'sku' | 'name' | 'description' | 'category' | 'unit' | 'cost' | 'price' | 'currency'
>

export function useProducts() {
  const { user } = useAuth()
  const { organizationId, canConfigure, loading: organizationLoading } = useOrganization()
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)

  const fetchProducts = useCallback(async () => {
    if (!organizationId) {
      if (!organizationLoading) setLoading(false)
      return
    }

    setLoading(true)
    const { data, error } = await (supabase as any)
      .from('products')
      .select('*')
      .eq('organization_id', organizationId)
      .order('is_active', { ascending: false })
      .order('name')

    if (error) {
      console.error('Error loading products:', error)
      toast.error('Não foi possível carregar os produtos')
    } else {
      setProducts((data ?? []) as Product[])
    }
    setLoading(false)
  }, [organizationId, organizationLoading])

  useEffect(() => {
    fetchProducts()
  }, [fetchProducts])

  const saveProduct = async (input: ProductInput, id?: string) => {
    if (!user || !organizationId || !canConfigure) {
      throw new Error('Você não tem permissão para alterar produtos')
    }

    const payload = {
      ...input,
      sku: input.sku?.trim() || null,
      description: input.description?.trim() || null,
      category: input.category?.trim() || null,
      organization_id: organizationId,
      updated_at: new Date().toISOString(),
    }

    const query = id
      ? (supabase as any).from('products').update(payload).eq('id', id)
      : (supabase as any).from('products').insert({ ...payload, created_by: user.id })

    const { error } = await query
    if (error) throw error

    toast.success(id ? 'Produto atualizado' : 'Produto cadastrado')
    await fetchProducts()
  }

  const toggleProduct = async (product: Product) => {
    if (!canConfigure) return
    const { error } = await (supabase as any)
      .from('products')
      .update({ is_active: !product.is_active, updated_at: new Date().toISOString() })
      .eq('id', product.id)
    if (error) throw error
    await fetchProducts()
  }

  return { products, loading, canConfigure, saveProduct, toggleProduct, refetch: fetchProducts }
}
