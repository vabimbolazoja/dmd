import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { apiRequest, queryClient } from "@/lib/queryClient";
import AdminLayout from "@/components/admin-layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import moment from 'moment'
import { base_url } from "../config";
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
import { Plus, Package, Edit } from "lucide-react";

interface ModerationConfig {
    _id?: string;
    id?: string;
    country: string;
    deliveryPriceInKg: number | string;
    increment_percentage: number | string;
    maxqty: number | string;
    createdAt?: string;
    updatedAt?: string;
}

type ModerationFormData = {
    country: string;
    deliveryPriceInKg: string;
    increment_percentage: string;
    maxqty: string;
};

const emptyFormData: ModerationFormData = {
    country: "",
    deliveryPriceInKg: "",
    increment_percentage: "",
    maxqty: "",
};

const COUNTRIES = ['NIGERIA', 'USA', 'CANADA', 'UNITED KINGDOM'] as const;

function toPayload(data: ModerationFormData) {
    return {
        country: data.country,
        deliveryPriceInKg: Number(data.deliveryPriceInKg),
        increment_percentage: Number(data.increment_percentage),
        maxqty: Number(data.maxqty),
    };
}

function ModerationFormFields({
    formData,
    setFormData,
    countryDisabled = false,
}: {
    formData: ModerationFormData;
    setFormData: React.Dispatch<React.SetStateAction<ModerationFormData>>;
    countryDisabled?: boolean;
}) {
    return (
        <>
            <div>
                <Label htmlFor="country">Select Country</Label>
                <Select
                    value={formData.country}
                    onValueChange={(value) => setFormData({ ...formData, country: value })}
                    required
                    disabled={countryDisabled}
                >
                    <SelectTrigger>
                        <SelectValue placeholder="Select a country" />
                    </SelectTrigger>
                    <SelectContent>
                        {COUNTRIES.map((cont) => (
                            <SelectItem key={cont} value={cont}>
                                {cont}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            <div>
                <Label htmlFor="deliveryPriceInKg">Delivery Price (0.01g – 1kg)</Label>
                <Input
                    id="deliveryPriceInKg"
                    type="number"
                    step="any"
                    value={formData.deliveryPriceInKg}
                    onChange={(e) => setFormData({ ...formData, deliveryPriceInKg: e.target.value })}
                    required
                />
            </div>

            <div>
                <Label htmlFor="increment_percentage">Increment Percentage</Label>
                <Input
                    id="increment_percentage"
                    type="number"
                    step="any"
                    value={formData.increment_percentage}
                    onChange={(e) => setFormData({ ...formData, increment_percentage: e.target.value })}
                    required
                />
            </div>

            <div>
                <Label htmlFor="maxqty">Max Quantity</Label>
                <Input
                    id="maxqty"
                    type="number"
                    step="1"
                    min="0"
                    value={formData.maxqty}
                    onChange={(e) => setFormData({ ...formData, maxqty: e.target.value })}
                    required
                />
            </div>
        </>
    );
}

export default function Moderations() {
    const { toast } = useToast();
    const { isAuthenticated, isLoading } = useAuth();
    const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
    const [editingProduct, setEditingProduct] = useState<ModerationConfig | null>(null);
    const [formData, setFormData] = useState<ModerationFormData>(emptyFormData);

    const resetForm = () => {
        setFormData(emptyFormData);
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

    const { data: products, isLoading: productsLoading, error } = useQuery<ModerationConfig[]>({
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
        mutationFn: (data: ModerationFormData) =>
            apiRequest("PUT", base_url + `/api/moderations/${data.country}`, toPayload(data)),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: [base_url + "/api/moderations/config"] });
            toast({
                title: "Success",
                description: "Delivery Cost Set up created successfully",
            });
            setIsAddDialogOpen(false);
            resetForm();
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

    const updateMutation = useMutation({
        mutationFn: ({ data }: { id: string; data: ModerationFormData }) =>
            apiRequest("PUT", `${base_url}/api/moderations/${data.country}`, toPayload(data)),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: [base_url + "/api/moderations/config"] });
            setEditingProduct(null);
            resetForm();
            toast({
                title: "Success",
                description: "Delivery Cost setup updated successfully",
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
            updateMutation.mutate({ id: editingProduct._id ?? editingProduct.id ?? "", data: formData });
        } else {
            createMutation.mutate(formData);
        }
    };

    const handleEdit = (product: ModerationConfig) => {
        setEditingProduct(product);
        setFormData({
            country: product.country ?? "",
            deliveryPriceInKg: String(product.deliveryPriceInKg ?? ""),
            increment_percentage: String(product.increment_percentage ?? ""),
            maxqty: String(product.maxqty ?? ""),
        });
    };

    const currencyPrefix = (country: string) =>
        country?.toUpperCase().includes("NIGERIA") ? "N" : "$";

    return (
        <AdminLayout>
            <div className="p-6">
                <div className="flex justify-between items-center mb-8">
                    <div>
                        <h2 className="text-2xl font-bold text-gray-900">Delivery Cost Setup</h2>
                        <p className="text-gray-600">Manage your delivery cost setup</p>
                    </div>

                    <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                        <DialogTrigger asChild>
                            <Button className="bg-blue-600 hover:bg-blue-700">
                                <Plus className="mr-2 h-4 w-4" />
                                Add Delivery Setup
                            </Button>
                        </DialogTrigger>
                        <DialogContent customWidth="900px" className="max-h-[90vh] overflow-y-auto">
                            <DialogHeader>
                                <DialogTitle>Add New Delivery Cost Setup</DialogTitle>
                                <DialogDescription>
                                    Create a new delivery cost setup
                                </DialogDescription>
                            </DialogHeader>
                            <form onSubmit={handleSubmit} className="space-y-4">
                                <ModerationFormFields formData={formData} setFormData={setFormData} />
                                <DialogFooter>
                                    <Button type="submit" disabled={createMutation.isPending}>
                                        {createMutation.isPending ? "Creating..." : "Create Delivery Setup"}
                                    </Button>
                                </DialogFooter>
                            </form>
                        </DialogContent>
                    </Dialog>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>Delivery Cost Setup</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {productsLoading ? (
                            <div className="flex items-center justify-center py-8">
                                <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
                            </div>
                        ) : products && products.length > 0 ? (
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Country</TableHead>
                                        <TableHead>Delivery Price (0.01g – 1kg)</TableHead>
                                        <TableHead>Increment %</TableHead>
                                        <TableHead>Max Qty</TableHead>
                                        <TableHead>Date Created</TableHead>
                                        <TableHead>Last Updated</TableHead>
                                        <TableHead>Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {products.map((product) => (
                                        <TableRow key={product._id ?? product.id ?? product.country}>
                                            <TableCell>{product.country}</TableCell>
                                            <TableCell>
                                                {currencyPrefix(product.country)}{product.deliveryPriceInKg}
                                            </TableCell>
                                            <TableCell>{product.increment_percentage}%</TableCell>
                                            <TableCell>{product.maxqty}</TableCell>
                                            <TableCell>
                                                {product.createdAt
                                                    ? moment(product.createdAt).format("DD-MMM-YYYY h:mm A")
                                                    : ""}
                                            </TableCell>
                                            <TableCell>
                                                {product.updatedAt
                                                    ? moment(product.updatedAt).format("DD-MMM-YYYY h:mm A")
                                                    : ""}
                                            </TableCell>
                                            <TableCell>
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => handleEdit(product)}
                                                >
                                                    <Edit className="h-4 w-4" />
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
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

                <Dialog open={!!editingProduct} onOpenChange={() => setEditingProduct(null)}>
                    <DialogContent customWidth="900px" className="max-h-[90vh] overflow-y-auto">
                        <DialogHeader>
                            <DialogTitle>Edit Delivery Cost setup</DialogTitle>
                            <DialogDescription>
                                Update delivery cost setup.
                            </DialogDescription>
                        </DialogHeader>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <ModerationFormFields
                                formData={formData}
                                setFormData={setFormData}
                                countryDisabled
                            />
                            <DialogFooter>
                                <Button type="submit" disabled={updateMutation.isPending}>
                                    {updateMutation.isPending ? "Updating..." : "Update Delivery Setup"}
                                </Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>
        </AdminLayout>
    );
}
