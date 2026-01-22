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
import { Pagination } from "antd";
import { Badge } from "@/components/ui/badge";
import moment from 'moment'
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
    const [page, setPage] = useState(1)
    const [limit, setLimit] = useState(10)
    const [imageUrlView, setImageurlView] = useState("")
    const [imageUrls, setImageUrls] = useState<string[]>([]);
    const [editingProduct, setEditingProduct] = useState<Product | null>(null);
    const [formData, setFormData] = useState({
        country: "",
        name: "", state: "", address: "", postalcode: ""
    });

    const resetForm = () => {
        setFormData({
            country: "",
            name: "",
            postalcode: "",
            address: "",
            state: ""
        });
    };


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

    const { data: products, isLoading: productsLoading, error, refetch } = useQuery<Product[]>({
        queryKey: [base_url + `/api/admin/stores`],
        retry: false,
    });


      const handleDelete = (id: string) => {
    if (confirm("Are you sure you want to delete this location?")) {
      deleteMutation.mutate(id);
    }
  };




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
        mutationFn: (data: typeof formData) => apiRequest("POST", base_url + `/api/admin/create-store`, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: [base_url + "/api/admin/stores"] });
            toast({
                title: "Success",
                description: "Store created successfully",
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
            apiRequest("PUT", `${base_url}/api/admin/edit-store/${id}`, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: [base_url + "/api/admin/stores"] });
            setEditingProduct(null);
            resetForm();
            toast({
                title: "Success",
                description: "Store updated successfully",
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
        mutationFn: (id: string) => apiRequest("DELETE", `${base_url}/api/admin/delete-store/${id}`),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: [base_url + "/api/admin/stores"] });
            toast({
                title: "Success",
                description: "Store deleted successfully",
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
        setFormData({
            country: product.country,
            address: product.address,
            postalcode: product.postalcode,
            name: product.name,
            state: product.state,

        });
    };



    return (
        <AdminLayout>
            <div className="p-6">
                {/* Header */}
                <div className="flex justify-between items-center mb-8">
                    <div>
                        <h2 className="text-2xl font-bold text-gray-900">Store Locations </h2>
                        <p className="text-gray-600">Manage your store locations </p>
                    </div>

                    <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                        <DialogTrigger asChild>
                            <Button className="bg-blue-600 hover:bg-blue-700">
                                <Plus className="mr-2 h-4 w-4" />
                                Add Store Location
                            </Button>
                        </DialogTrigger>
                        <DialogContent customWidth="900px" className="max-h-[90vh] overflow-y-auto">
                            <DialogHeader>
                                <DialogTitle>Add New Store location</DialogTitle>
                                <DialogDescription>
                                    Create a new store location
                                </DialogDescription>
                            </DialogHeader>
                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div>
                                    <Label htmlFor="name">Select Country</Label>
                                    <Select
                                        value={formData.country}
                                        onValueChange={(value) => setFormData({ ...formData, country: value })}
                                        required
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select a country" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {['NIGERIA', 'USA', 'CANADA', 'NETHERLANDS', 'OTHERS']?.map((cont) => (
                                                <SelectItem key={cont} value={cont}>
                                                    {cont}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>


                                <div >
                                    <div>
                                        <Label htmlFor="price">Store Name</Label>
                                        <Input
                                            id="name"
                                            type="text"
                                            value={formData.name}
                                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                            required
                                        />
                                    </div>

                                </div>
                                <div >
                                    <div>
                                        <Label htmlFor="price">Store Address</Label>
                                        <Input
                                            id="address"
                                            type="text"
                                            value={formData.address}
                                            onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                                            required
                                        />
                                    </div>

                                </div>
                                <div >
                                    <div>
                                        <Label htmlFor="price">Postal Code</Label>
                                        <Input
                                            id="postalcode"
                                            type="text"
                                            value={formData.postalcode}
                                            onChange={(e) => setFormData({ ...formData, postalcode: e.target.value })}
                                            required
                                        />
                                    </div>

                                </div>
                                <div >
                                    <div>
                                        <Label htmlFor="price">State</Label>
                                        <Input
                                            id="state"
                                            type="text"
                                            value={formData.state}
                                            onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                                            required
                                        />
                                    </div>

                                </div>




                                <DialogFooter>
                                    <Button type="submit" disabled={createMutation.isPending}>
                                        {createMutation.isPending ? "Creating..." : "Create Store"}
                                    </Button>
                                </DialogFooter>
                            </form>
                        </DialogContent>
                    </Dialog>
                </div>

                {/* Products Table */}
                <Card>
                    <CardHeader>
                        <CardTitle>Store Locations </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {productsLoading ? (
                            <div className="flex items-center justify-center py-8">
                                <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
                            </div>
                        ) : products?.store?.length > 0 ? (
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Name</TableHead>
                                        <TableHead>Address</TableHead>
                                        <TableHead>State</TableHead>
                                        <TableHead>Postal Code</TableHead>
                                        <TableHead>Country</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead>Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {products?.store?.map((product: Product) => (
                                        <TableRow key={product.id}>

                                            <TableCell>{product.name}</TableCell>
                                            <TableCell>{product?.address}</TableCell>
                                            <TableCell>{product?.state}</TableCell>
                                            <TableCell>{product?.postalcode}</TableCell>
                                            <TableCell>{product?.country}</TableCell>
                                            <TableCell>{product?.status}</TableCell>


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
                                <br />

                            </Table>
                        ) : (
                            <div className="text-center py-8 text-gray-500">
                                <Package className="mx-auto mb-4" size={48} />
                                <p>No store locations found</p>
                                <p className="text-sm">Add your first store location to get started</p>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Edit Dialog */}
                <Dialog open={!!editingProduct} onOpenChange={() => setEditingProduct(null)}>
                    <DialogContent customWidth="900px" className="max-h-[90vh] overflow-y-auto">
                        <DialogHeader>
                            <DialogTitle>Edit Store Location </DialogTitle>
                            <DialogDescription>
                                Update Store Location  .
                            </DialogDescription>
                        </DialogHeader>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <Label htmlFor="name">Select Country</Label>
                                <Select
                                    value={formData.country}
                                    onValueChange={(value) => setFormData({ ...formData, country: value })}
                                    required
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select a country" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {['NIGERIA', 'USA', 'CANADA', 'NETHERLANDS', 'OTHERS']?.map((cont) => (
                                            <SelectItem key={cont} value={cont}>
                                                {cont}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>


                            <div >
                                <div>
                                    <Label htmlFor="price">Store Name</Label>
                                    <Input
                                        id="name"
                                        type="text"
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        required
                                    />
                                </div>

                            </div>
                            <div >
                                <div>
                                    <Label htmlFor="price">Store Address</Label>
                                    <Input
                                        id="address"
                                        type="text"
                                        value={formData.address}
                                        onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                                        required
                                    />
                                </div>

                            </div>
                            <div >
                                <div>
                                    <Label htmlFor="price">Postal Code</Label>
                                    <Input
                                        id="postalcode"
                                        type="text"
                                        value={formData.postalcode}
                                        onChange={(e) => setFormData({ ...formData, postalcode: e.target.value })}
                                        required
                                    />
                                </div>

                            </div>
                            <div >
                                <div>
                                    <Label htmlFor="price">State</Label>
                                    <Input
                                        id="state"
                                        type="text"
                                        value={formData.state}
                                        onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                                        required
                                    />
                                </div>

                            </div>


                            <DialogFooter>
                                <Button type="submit" disabled={updateMutation.isPending}>
                                    {updateMutation.isPending ? "Updating..." : "Update Store"}
                                </Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>
        </AdminLayout >
    );
}
