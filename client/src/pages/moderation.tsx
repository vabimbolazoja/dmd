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
        deliveryPriceInKg: "",
    });

    const resetForm = () => {
        setFormData({
            country: "",
            deliveryPriceInKg: "",
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
        queryKey: [base_url + `/api/moderations/config`],
        retry: false,
    });



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
        mutationFn: (data: typeof formData) => apiRequest("PUT", base_url + `/api/moderations/${data?.country}`, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: [base_url + "/api/moderations/config"] });
            toast({
                title: "Success",
                description: "Moderation created successfully",
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
            apiRequest("PUT", `${base_url}/api/moderations/${data?.country}`, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: [base_url + "/api/moderations/config"] });
            setEditingProduct(null);
            resetForm();
            toast({
                title: "Success",
                description: "Moderation updated successfully",
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
            price: product.deliveryPriceInKg,
        });
    };



    return (
        <AdminLayout>
            <div className="p-6">
                {/* Header */}
                <div className="flex justify-between items-center mb-8">
                    <div>
                        <h2 className="text-2xl font-bold text-gray-900">Moderation</h2>
                        <p className="text-gray-600">Manage your moderations</p>
                    </div>

                    <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                        <DialogTrigger asChild>
                            <Button className="bg-blue-600 hover:bg-blue-700">
                                <Plus className="mr-2 h-4 w-4" />
                                Add Config
                            </Button>
                        </DialogTrigger>
                        <DialogContent customWidth="900px" className="max-h-[90vh] overflow-y-auto">
                            <DialogHeader>
                                <DialogTitle>Add New Moderation</DialogTitle>
                                <DialogDescription>
                                    Create a new moderation config
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
                                        <Label htmlFor="price">Price</Label>
                                        <Input
                                            id="price"
                                            type="number"
                                            value={formData.price}
                                            onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                                            required
                                        />
                                    </div>

                                </div>

                                <DialogFooter>
                                    <Button type="submit" disabled={createMutation.isPending}>
                                        {createMutation.isPending ? "Creating..." : "Create Moderation"}
                                    </Button>
                                </DialogFooter>
                            </form>
                        </DialogContent>
                    </Dialog>
                </div>

                {/* Products Table */}
                <Card>
                    <CardHeader>
                        <CardTitle>Moderation Setup</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {productsLoading ? (
                            <div className="flex items-center justify-center py-8">
                                <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
                            </div>
                        ) : products?.length > 0 ? (
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Country</TableHead>
                                        <TableHead>Delivery Price in 0.01gram - 1kg</TableHead>
                                        <TableHead>Date Created</TableHead>
                                        <TableHead>Last Updated</TableHead>

                                        <TableHead>Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {products?.map((product: Product) => (
                                        <TableRow key={product.id}>

                                            <TableCell>{product.country}</TableCell>
                                            <TableCell>{product?.country?.includes("Nigeria") ? "N" : "$"}{product.deliveryPriceInKg}</TableCell>
                                            <TableCell>{product.createdAt ? moment(product.createdAt).format(
                                                "DD-MMM-YYYY h:mm A"
                                            ) : ""}</TableCell>
                                            <TableCell>{product.updatedAt ? moment(product.updatedAt).format(
                                                "DD-MMM-YYYY h:mm A"
                                            ) : ""}</TableCell>
                                            <TableCell>
                                                <div className="flex items-center space-x-2">
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() => handleEdit(product)}
                                                    >
                                                        <Edit className="h-4 w-4" />
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
                                <p>No moderations found</p>
                                <p className="text-sm">Add your first moderation to get started</p>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Edit Dialog */}
                <Dialog open={!!editingProduct} onOpenChange={() => setEditingProduct(null)}>
                    <DialogContent customWidth="900px" className="max-h-[90vh] overflow-y-auto">
                        <DialogHeader>
                            <DialogTitle>Edit Moderation</DialogTitle>
                            <DialogDescription>
                                Update moderation information.
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


                            <div>
                                <div>
                                    <Label htmlFor="price">Price</Label>
                                    <Input
                                        id="price"
                                        type="number"
                                        value={formData.price}
                                        onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                                        required
                                    />
                                </div>

                            </div>
                            <DialogFooter>
                                <Button type="submit" disabled={updateMutation.isPending}>
                                    {updateMutation.isPending ? "Updating..." : "Update Moderation"}
                                </Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>
        </AdminLayout >
    );
}
