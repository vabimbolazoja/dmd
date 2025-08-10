import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { apiRequest, queryClient } from "@/lib/queryClient";
import AdminLayout from "@/components/admin-layout";
import { Button } from "@/components/ui/button";
import type { Product } from "@shared/schema";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { base_url } from "../config";
import { Switch } from 'antd'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Plus, Package, Edit, Trash2 } from "lucide-react";
import MultiUpload from "../components/ui/multiupload"
interface Product {
  id: string;
  name: string;
  description: string;
  price: string;
  imageUrl: string;
  category: string;
  stock: number;
  isActive: boolean;
}

export default function Products() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading } = useAuth();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [imageUrlView,setImageurlView] = useState("")
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    priceUsd: "",
    priceNaira: "",
    category: "",
    status:false,
    moq: 0,
    nutritionalInfo:"",
    storageInstructions:"",
    imageUrls: [],
  });

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      price: "",
      category: "",
      stock: 0,
      imageUrls: "",
      status:false,
      nutritionalInfo:"",
      storageInstructions:"",
    });
  };


  // Redirect to home if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      toast({
        title: "Unauthorized",
        description: "You are logged out. Logging in again...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/login";
      }, 500);
      return;
    }
  }, [isAuthenticated, isLoading, toast]);

  const { data: products, isLoading: productsLoading, error } = useQuery<Product[]>({
    queryKey: [base_url + "/api/products"],
    retry: false,
  });

  const { data: categories, isLoading: categoryLoading, error: erroCats } = useQuery<Product[]>({
    queryKey: [base_url + "/api/admin/categories"],
    retry: false,
  });

  // Handle unauthorized errors
  useEffect(() => {
    if (error && isUnauthorizedError(error as Error)) {
      toast({
        title: "Unauthorized",
        description: "You are logged out. Logging in again...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/login";
      }, 500);
    }
  }, [error, toast]);

  useEffect(() => {
    if (isAddDialogOpen) {
      resetForm()
    }
  }, [isAddDialogOpen])



  const createMutation = useMutation({
    mutationFn: (data: typeof formData) => apiRequest("POST", base_url + "/api/admin/product", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [base_url + "/api/products"] });
      toast({
        title: "Success",
        description: "Product created successfully",
      });
      setIsAddDialogOpen(false);
      resetForm();

    },
    onError: (error) => {
      console.log(error)
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/login";
        }, 500);
        return;
      }

      toast({
        title: "Error",
        description: error?.message,
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<typeof formData> }) =>
      apiRequest("PUT", `${base_url}/api/admin/product/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [base_url + "/api/products"] });
      setEditingProduct(null);
      resetForm();
      toast({
        title: "Success",
        description: "Product updated successfully",
      });
    },
    onError: (error) => {

      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/login";
        }, 500);
        return;
      }
      toast({
        title: "Error",
        description: error?.message,
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `${base_url}/api/product/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [base_url + "/api/products"] });
      toast({
        title: "Success",
        description: "Product deleted successfully",
      });
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/login";
        }, 500);
        return;
      }
      toast({
        title: "Error",
        description: error?.message,
        variant: "destructive",
      });
    },
  });


  const switchChange = (val) => {
    setFormData({ ...formData, status: val})

  }


  const handleUploadComplete = (urls: string[]) => {
    setImageUrls(urls)
    setFormData({ ...formData, imageUrls: urls })
    setImageurlView([])
  };


  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingProduct) {
      updateMutation.mutate({ id: editingProduct._id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleEdit = (product: Product) => {
    setEditingProduct(product);
    setImageurlView(product?.imageUrls)
    setFormData({
      name: product.name,
      description: product.description,
      priceUsd: product.priceUsd,
      priceNaira: product?.priceNaira,
      nutritionalInfo:product?.nutritionalInfo,
      storageInstructions:product?.storageInstructions,
      category: product.category?._id,
      moq: product.moq,
      status:product?.status === 'Active' ? true : false ,
      imageUrls: product?.imageUrls
    });
  };

  const handleDelete = (id: string) => {
    if (confirm("Are you sure you want to delete this product?")) {
      deleteMutation.mutate(id);
    }
  };

  if (isLoading || !isAuthenticated) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }




  return (
    <AdminLayout>
      <div className="p-6">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Products</h2>
            <p className="text-gray-600">Manage your product catalog</p>
          </div>

          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-blue-600 hover:bg-blue-700">
                <Plus className="mr-2 h-4 w-4" />
                Add Product
              </Button>
            </DialogTrigger>
            <DialogContent customWidth="900px" className="max-h-[90vh] overflow-y-auto">
            <DialogHeader>
                <DialogTitle>Add New Product</DialogTitle>
                <DialogDescription>
                  Create a new product for your store.
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="name">Name</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  />
                </div>
                <div>
                <Label htmlFor="edit-description">Nutritional Information</Label>
                <Textarea
                  id="edit-description"
                  value={formData.nutritionalInfo}
                  onChange={(e) => setFormData({ ...formData, nutritionalInfo: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="edit-description">Storage Instruction</Label>
                <Textarea
                  id="edit-description"
                  value={formData.storageInstructions}
                  onChange={(e) => setFormData({ ...formData, storageInstructions: e.target.value })}
                />
              </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="price">Price in USD</Label>
                    <Input
                      id="priceUsd"
                      type="number"
                      value={formData.priceUsd}
                      onChange={(e) => setFormData({ ...formData, priceUsd: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="stock">Price in Naira</Label>
                    <Input
                      id="priceNaira"
                      type="number"
                      value={formData.priceNaira}
                      onChange={(e) => setFormData({ ...formData, priceNaira: parseInt(e.target.value) })}
                      required
                    />
                  </div>
                </div>
                <div>
                  <div>
                    <Label htmlFor="carrier">Category</Label>
                    <Select
                      value={formData.category}
                      onValueChange={(value) => setFormData({ ...formData, category: value })}
                      required
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select a category" />
                      </SelectTrigger>
                      <SelectContent>
                        {categories?.map((carrier) => (
                          <SelectItem key={carrier._id} value={carrier._id}>
                            {carrier.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div>
                  <Label htmlFor="category">MOQ</Label>
                  <Input
                    id="moq"
                    value={formData.moq}
                    onChange={(e) => setFormData({ ...formData, moq: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="imageUrl">Image URL</Label>
                  <MultiUpload onUploadComplete={handleUploadComplete} />



                </div>
                <DialogFooter>
                  <Button type="submit" disabled={createMutation.isPending}>
                    {createMutation.isPending ? "Creating..." : "Create Product"}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Products Table */}
        <Card>
          <CardHeader>
            <CardTitle>Product List</CardTitle>
          </CardHeader>
          <CardContent>
            {productsLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
              </div>
            ) : products?.products?.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Product</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Price(N)</TableHead>
                    <TableHead>Price($)</TableHead>
                    <TableHead>Moq</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {products?.products?.map((product: Product) => (
                    <TableRow key={product.id}>
                      <TableCell>
                        <div className="flex items-center space-x-3">
                          <img
                            src={product.imageUrls[0]}
                            alt={product.name}
                            className="w-12 h-12 rounded-lg object-cover"
                          />
                          <div>
                            <p className="font-medium text-gray-900">{product.name}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{product.category?.name}</TableCell>
                      <TableCell>N{product.priceNaira}</TableCell>
                      <TableCell>${product.priceUsd}</TableCell>
                      <TableCell>{product.moq}</TableCell>
                      <TableCell>
                        <Badge variant={product.status === 'Active' ? "default" : "secondary"}>
                          {product.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEdit(product)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDelete(product._id)}
                            disabled={deleteMutation.isPending}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>

                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <Package className="mx-auto mb-4" size={48} />
                <p>No products found</p>
                <p className="text-sm">Add your first product to get started</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Edit Dialog */}
        <Dialog open={!!editingProduct} onOpenChange={() => setEditingProduct(null)}>
        <DialogContent customWidth="900px" className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
              <DialogTitle>Edit Product</DialogTitle>
              <DialogDescription>
                Update product information.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="edit-name">Name</Label>
                <Input
                  id="edit-name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="edit-description">Description</Label>
                <Textarea
                  id="edit-description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="edit-description">Nutritional Information</Label>
                <Textarea
                  id="edit-description"
                  value={formData.nutritionalInfo}
                  onChange={(e) => setFormData({ ...formData, nutritionalInfo: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="edit-description">Storage Instruction</Label>
                <Textarea
                  id="edit-description"
                  value={formData.storageInstructions}
                  onChange={(e) => setFormData({ ...formData, storageInstructions: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="price">Price in USD</Label>
                  <Input
                    id="priceUsd"
                    type="number"
                    value={formData.priceUsd}
                    onChange={(e) => setFormData({ ...formData, priceUsd: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="stock">Price in Naira</Label>
                  <Input
                    id="priceNaira"
                    type="number"
                    value={formData.priceNaira}
                    onChange={(e) => setFormData({ ...formData, priceNaira: parseInt(e.target.value) })}
                    required
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="carrier">Category</Label>
                <Select
                  value={formData.category}
                  onValueChange={(value) => setFormData({ ...formData, category: value })}
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories?.map((carrier) => (
                      <SelectItem key={carrier._id} value={carrier._id}>
                        {carrier.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="imageUrl">Uploaded Image URL</Label>
                <MultiUpload onUploadComplete={handleUploadComplete} />
                {imageUrlView.length > 0 && (
                  <div style={{ display: "flex", gap: 10, marginTop: 10, flexWrap: "wrap" }}>
                    {imageUrlView.map((img, index) => (
                      <img
                        key={index}
                        src={img}
                        alt={`preview-${index}`}
                        width={100}
                        style={{ objectFit: "cover", borderRadius: 6 }}
                      />
                    ))}
                  </div>
                )}
              </div>
              <div>
                <div>
                <Label htmlFor="imageUrl">Product Status</Label>
                </div>
                <div>
                <Switch size="small" value={formData?.status} onChange={switchChange} />
                </div>

              </div>
              <DialogFooter>
                <Button type="submit" disabled={updateMutation.isPending}>
                  {updateMutation.isPending ? "Updating..." : "Update Product"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
}
