import { useMemo, useState } from 'react'
import { Edit2, Loader2, PackagePlus, Search } from 'lucide-react'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import { useProducts, type ProductInput } from '@/hooks/use-products'
import type { Product } from '@/lib/types'

const EMPTY_FORM: ProductInput = {
  item_type: 'product',
  sku: '',
  name: '',
  description: '',
  category: '',
  unit: 'un',
  cost: 0,
  price: 0,
  currency: 'BRL',
}

const money = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
})

export default function Products() {
  const { products, loading, canConfigure, saveProduct, toggleProduct } = useProducts()
  const [search, setSearch] = useState('')
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<Product | null>(null)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState<ProductInput>(EMPTY_FORM)

  const visibleProducts = useMemo(() => {
    const query = search.trim().toLocaleLowerCase('pt-BR')
    if (!query) return products
    return products.filter((product) =>
      [product.name, product.sku, product.category]
        .filter(Boolean)
        .some((value) => value!.toLocaleLowerCase('pt-BR').includes(query)),
    )
  }, [products, search])

  const openForm = (product?: Product) => {
    setEditing(product ?? null)
    setForm(
      product
        ? {
            item_type: product.item_type,
            sku: product.sku ?? '',
            name: product.name,
            description: product.description ?? '',
            category: product.category ?? '',
            unit: product.unit,
            cost: Number(product.cost),
            price: Number(product.price),
            currency: product.currency,
          }
        : EMPTY_FORM,
    )
    setOpen(true)
  }

  const submit = async (event: React.FormEvent) => {
    event.preventDefault()
    setSaving(true)
    try {
      await saveProduct(form, editing?.id)
      setOpen(false)
    } catch (error: any) {
      toast.error(error?.message || 'Não foi possível salvar o produto')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="mx-auto min-h-full max-w-7xl space-y-8 p-6 md:p-10">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Produtos e serviços</h1>
          <p className="mt-1 text-muted-foreground">
            Cadastre o catálogo usado nas oportunidades e dashboards financeiros.
          </p>
        </div>
        {canConfigure && (
          <Button className="rounded-full" onClick={() => openForm()}>
            <PackagePlus className="mr-2 h-4 w-4" />
            Novo item
          </Button>
        )}
      </div>

      <Card className="rounded-3xl border-border/60">
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Buscar por nome, SKU ou categoria"
              className="h-12 rounded-2xl pl-11"
            />
          </div>
        </CardContent>
      </Card>

      {loading ? (
        <div className="flex justify-center py-24">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : visibleProducts.length === 0 ? (
        <Card className="rounded-3xl border-dashed">
          <CardContent className="py-20 text-center text-muted-foreground">
            Nenhum produto ou serviço encontrado.
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {visibleProducts.map((product) => (
            <Card key={product.id} className="rounded-3xl border-border/60">
              <CardContent className="space-y-4 p-6">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant={product.item_type === 'service' ? 'secondary' : 'outline'}>
                        {product.item_type === 'service' ? 'Serviço' : 'Produto'}
                      </Badge>
                      {!product.is_active && <Badge variant="destructive">Inativo</Badge>}
                    </div>
                    <h2 className="mt-3 truncate text-lg font-bold">{product.name}</h2>
                    <p className="text-sm text-muted-foreground">
                      {[product.sku, product.category].filter(Boolean).join(' · ') || 'Sem categoria'}
                    </p>
                  </div>
                  {canConfigure && (
                    <Button variant="ghost" size="icon" onClick={() => openForm(product)}>
                      <Edit2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-3 rounded-2xl bg-muted/40 p-4">
                  <div>
                    <p className="text-xs font-semibold uppercase text-muted-foreground">Custo</p>
                    <p className="mt-1 font-semibold">{money.format(Number(product.cost))}</p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase text-muted-foreground">Preço</p>
                    <p className="mt-1 font-bold">{money.format(Number(product.price))}</p>
                  </div>
                </div>
                {canConfigure && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Disponível para venda</span>
                    <Switch
                      checked={product.is_active}
                      onCheckedChange={() =>
                        toggleProduct(product).catch(() =>
                          toast.error('Não foi possível alterar o status'),
                        )
                      }
                    />
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto rounded-3xl sm:max-w-2xl">
          <form onSubmit={submit}>
            <DialogHeader>
              <DialogTitle>{editing ? 'Editar item' : 'Cadastrar item'}</DialogTitle>
              <DialogDescription>
                Produtos e serviços podem ser vinculados às oportunidades comerciais.
              </DialogDescription>
            </DialogHeader>

            <div className="grid gap-5 py-6 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Tipo</Label>
                <Select
                  value={form.item_type}
                  onValueChange={(value: 'product' | 'service') =>
                    setForm((current) => ({ ...current, item_type: value }))
                  }
                >
                  <SelectTrigger className="h-11 rounded-xl">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="product">Produto</SelectItem>
                    <SelectItem value="service">Serviço</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>SKU/código</Label>
                <Input
                  value={form.sku ?? ''}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, sku: event.target.value }))
                  }
                  className="h-11 rounded-xl"
                />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label>Nome</Label>
                <Input
                  required
                  value={form.name}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, name: event.target.value }))
                  }
                  className="h-11 rounded-xl"
                />
              </div>
              <div className="space-y-2">
                <Label>Categoria</Label>
                <Input
                  value={form.category ?? ''}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, category: event.target.value }))
                  }
                  className="h-11 rounded-xl"
                />
              </div>
              <div className="space-y-2">
                <Label>Unidade</Label>
                <Input
                  required
                  value={form.unit}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, unit: event.target.value }))
                  }
                  className="h-11 rounded-xl"
                />
              </div>
              <div className="space-y-2">
                <Label>Custo</Label>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.cost}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, cost: Number(event.target.value) }))
                  }
                  className="h-11 rounded-xl"
                />
              </div>
              <div className="space-y-2">
                <Label>Preço de venda</Label>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.price}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, price: Number(event.target.value) }))
                  }
                  className="h-11 rounded-xl"
                />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label>Descrição</Label>
                <Textarea
                  value={form.description ?? ''}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, description: event.target.value }))
                  }
                  className="min-h-24 rounded-xl"
                />
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={saving}>
                {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Salvar
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
