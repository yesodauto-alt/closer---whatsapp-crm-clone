import { useState } from 'react'
import { useLanguage } from '@/hooks/use-language'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog'
import { Plus, Package, DollarSign, Edit2, Trash2 } from 'lucide-react'

interface Product {
  id: string
  name: string
  description: string
  price: number
  category: string
  is_active: boolean
}

const mockProducts: Product[] = [
  {
    id: '1',
    name: 'Auto Insurance',
    description: 'Comprehensive vehicle insurance coverage tailored to your needs.',
    price: 299,
    category: 'Insurance',
    is_active: true,
  },
  {
    id: '2',
    name: 'Vehicle Inspection',
    description: 'Complete vehicle safety and mechanical inspection service.',
    price: 150,
    category: 'Service',
    is_active: true,
  },
  {
    id: '3',
    name: 'Financing Consultation',
    description: 'Expert consultation on vehicle financing options and rates.',
    price: 0,
    category: 'Consultation',
    is_active: true,
  },
  {
    id: '4',
    name: 'Extended Warranty',
    description: 'Extended warranty coverage for new and used vehicles.',
    price: 499,
    category: 'Warranty',
    is_active: false,
  },
  {
    id: '5',
    name: 'Fleet Management',
    description: 'Complete fleet management solution for businesses.',
    price: 1200,
    category: 'Enterprise',
    is_active: true,
  },
]

export default function Products() {
  const { t } = useLanguage()
  const [products, setProducts] = useState<Product[]>(mockProducts)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [formData, setFormData] = useState({ name: '', description: '', price: '0', category: '' })

  const handleOpenDialog = (product?: Product) => {
    if (product) {
      setEditingProduct(product)
      setFormData({
        name: product.name,
        description: product.description,
        price: String(product.price),
        category: product.category,
      })
    } else {
      setEditingProduct(null)
      setFormData({ name: '', description: '', price: '0', category: '' })
    }
    setIsDialogOpen(true)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const newProduct: Product = {
      id: editingProduct?.id || crypto.randomUUID(),
      name: formData.name,
      description: formData.description,
      price: parseFloat(formData.price) || 0,
      category: formData.category || 'General',
      is_active: editingProduct?.is_active ?? true,
    }
    if (editingProduct) {
      setProducts((prev) => prev.map((p) => (p.id === editingProduct.id ? newProduct : p)))
    } else {
      setProducts((prev) => [...prev, newProduct])
    }
    setIsDialogOpen(false)
  }

  const handleDelete = (id: string) => {
    setProducts((prev) => prev.filter((p) => p.id !== id))
  }

  return (
    <div className="max-w-7xl mx-auto space-y-10 p-6 md:p-12 animate-in fade-in slide-in-from-bottom-4 duration-700 ease-apple min-h-full bg-background">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h2 className="text-4xl font-bold tracking-tight text-foreground">
            {t('products_title') || 'Products & Services'}
          </h2>
          <p className="text-muted-foreground mt-2 font-medium text-base">
            {t('products_desc') || 'Manage your products and service offerings'}
          </p>
        </div>
        <Button
          onClick={() => handleOpenDialog()}
          className="rounded-full shadow-subtle px-6 h-12 font-semibold"
        >
          <Plus className="mr-2 h-5 w-5" />
          {t('add_product') || 'Add Product'}
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {products.map((product) => (
          <Card
            key={product.id}
            className="shadow-subtle border border-border/40 rounded-[2rem] overflow-hidden flex flex-col group transition-all duration-300 hover:shadow-elevation"
          >
            <CardHeader className="pb-4">
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-3">
                  <div className="bg-muted p-3 rounded-full">
                    <Package className="h-5 w-5 text-foreground" />
                  </div>
                  <div>
                    <CardTitle className="text-lg tracking-tight">{product.name}</CardTitle>
                    <CardDescription className="text-xs font-semibold mt-0.5 uppercase tracking-wider">
                      {product.category}
                    </CardDescription>
                  </div>
                </div>
                <Badge variant={product.is_active ? 'default' : 'secondary'} className="rounded-md">
                  {product.is_active ? t('active') || 'Active' : t('inactive') || 'Inactive'}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="flex-1 pb-6">
              <p className="text-sm text-muted-foreground leading-relaxed mb-4">
                {product.description}
              </p>
              <div className="flex items-center gap-2 text-2xl font-bold text-foreground">
                <DollarSign className="h-5 w-5 text-muted-foreground" />
                {product.price === 0 ? t('free') || 'Free' : product.price.toFixed(2)}
              </div>
            </CardContent>
            <div className="border-t border-border/40 bg-muted/10 p-4 flex justify-end gap-2 shrink-0">
              <Button
                variant="ghost"
                size="sm"
                className="rounded-full font-semibold"
                onClick={() => handleOpenDialog(product)}
              >
                <Edit2 className="h-4 w-4 mr-2" />
                {t('edit') || 'Edit'}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="rounded-full text-destructive hover:text-destructive hover:bg-destructive/10"
                onClick={() => handleDelete(product.id)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </Card>
        ))}
      </div>

      {products.length === 0 && (
        <Card className="border-dashed border-border bg-transparent shadow-none">
          <CardContent className="flex flex-col items-center justify-center p-20 text-center">
            <h3 className="text-xl font-bold text-foreground mb-2">
              {t('no_products') || 'No products yet'}
            </h3>
            <p className="text-muted-foreground max-w-sm mb-6">
              {t('no_products_desc') || 'Add your first product or service to get started.'}
            </p>
            <Button onClick={() => handleOpenDialog()} variant="outline" className="rounded-full">
              {t('add_product') || 'Add Product'}
            </Button>
          </CardContent>
        </Card>
      )}

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[500px] rounded-[2rem] p-0 overflow-hidden border-border/60">
          <form onSubmit={handleSubmit}>
            <DialogHeader className="p-6 md:p-8 pb-4 border-b border-border/40 bg-muted/20">
              <DialogTitle className="text-2xl">
                {editingProduct
                  ? t('edit_product') || 'Edit Product'
                  : t('add_product') || 'Add Product'}
              </DialogTitle>
              <DialogDescription>
                {t('product_dialog_desc') || 'Fill in the product details below.'}
              </DialogDescription>
            </DialogHeader>
            <div className="p-6 md:p-8 space-y-6">
              <div className="space-y-3">
                <Label htmlFor="name" className="font-semibold">
                  {t('product_name') || 'Product Name'}
                </Label>
                <Input
                  id="name"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Auto Insurance"
                  className="rounded-xl h-12"
                />
              </div>
              <div className="space-y-3">
                <Label htmlFor="description" className="font-semibold">
                  {t('description') || 'Description'}
                </Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Comprehensive coverage..."
                  className="rounded-xl min-h-[100px] resize-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-3">
                  <Label htmlFor="price" className="font-semibold">
                    {t('price') || 'Price'}
                  </Label>
                  <Input
                    id="price"
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    className="rounded-xl h-12"
                  />
                </div>
                <div className="space-y-3">
                  <Label htmlFor="category" className="font-semibold">
                    {t('category') || 'Category'}
                  </Label>
                  <Input
                    id="category"
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    placeholder="Insurance"
                    className="rounded-xl h-12"
                  />
                </div>
              </div>
            </div>
            <DialogFooter className="p-6 md:p-8 pt-4 border-t border-border/40 bg-muted/20">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setIsDialogOpen(false)}
                className="rounded-full"
              >
                {t('cancel') || 'Cancel'}
              </Button>
              <Button type="submit" className="rounded-full px-8 shadow-subtle">
                {editingProduct
                  ? t('save_changes') || 'Save Changes'
                  : t('add_product') || 'Add Product'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
