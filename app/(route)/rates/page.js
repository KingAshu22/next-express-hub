"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Eye, Plus, Upload, Download, Users, Globe, Lock, MoreHorizontal, Edit, Trash2 } from "lucide-react"
import { toast } from "@/hooks/use-toast"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

// Helper to get styling for status badges
const getStatusBadge = (status) => {
  switch (status) {
    case "live":
      return (
        <Badge variant="outline" className="bg-green-100 dark:bg-green-950 text-green-700 dark:text-green-400 border-green-300 dark:border-green-800">
          <Globe className="w-3 h-3 mr-1" />
          Live
        </Badge>
      )
    case "unlisted":
      return (
        <Badge variant="outline" className="bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-400 border-blue-300 dark:border-blue-800">
          <Users className="w-3 h-3 mr-1" />
          Unlisted
        </Badge>
      )
    case "hidden":
    default:
      return (
        <Badge variant="outline" className="bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-400 border-gray-300 dark:border-gray-700">
          <Lock className="w-3 h-3 mr-1" />
          Hidden
        </Badge>
      )
  }
}

export default function RatesPage() {
  const [rates, setRates] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchRates()
  }, [])

  const fetchRates = async () => {
    setLoading(true)
    try {
      const response = await fetch("/api/rates")
      if (response.ok) {
        const data = await response.json()
        setRates(data)
      } else {
        toast({
          title: "Error",
          description: "Failed to fetch rates",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error fetching rates:", error)
      toast({
        title: "Error",
        description: "An error occurred while fetching rates.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }
  
  const handleDelete = async (rateId) => {
    try {
        const response = await fetch(`/api/rates/${rateId}`, {
            method: 'DELETE',
        });

        if (response.ok) {
            toast({
                title: "Success",
                description: "Rate sheet deleted successfully.",
            });
            // Refresh the list of rates
            fetchRates();
        } else {
            const error = await response.json();
            toast({
                title: "Error",
                description: error.message || "Failed to delete rate sheet.",
                variant: "destructive",
            });
        }
    } catch (error) {
        console.error("Error deleting rate:", error);
        toast({
            title: "Error",
            description: "An unexpected error occurred.",
            variant: "destructive",
        });
    }
  }

  const downloadTemplate = () => {
    let csvContent = "data:text/csv;charset=utf-8,"
    csvContent += "RATES SHEET (Example)\n"
    csvContent += "kg,zone1,zone2,zone3\n0.5,1092,1085,1228\n1,1315,1296,1491\n\n"
    csvContent += "ZONES SHEET (Example)\n"
    csvContent += "zone,countries,extraChargeName,extraChargeValue\n"
    csvContent += '1,"Bangladesh,Bhutan,Maldives",Fuel,20\n'
    csvContent += '2,"Hong Kong,Malaysia,Singapore",Remote Area,15\n'

    const encodedUri = encodeURI(csvContent)
    const link = document.createElement("a")
    link.setAttribute("href", encodedUri)
    link.setAttribute("download", "rates_template.csv")
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        Loading rates...
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Shipping Rates</h1>
          <p className="text-muted-foreground">Manage visibility and assignments for all your shipping rates.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={downloadTemplate}>
            <Download className="w-4 h-4 mr-2" />
            Template
          </Button>
          <Link href="/rates/upload">
            <Button>
              <Upload className="w-4 h-4 mr-2" />
              Upload New Rate
            </Button>
          </Link>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Rate Sheets</CardTitle>
        </CardHeader>
        <CardContent>
          {rates.length === 0 ? (
            <div className="text-center py-12">
              <h3 className="text-lg font-medium text-muted-foreground">No rates found</h3>
              <p className="text-sm text-muted-foreground mb-4">Get started by uploading your first rate sheet.</p>
              <Link href="/rates/upload">
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  Add First Rate
                </Button>
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Service</TableHead>
                    <TableHead>Original Name</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Assigned To</TableHead>
                    <TableHead>Zones</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TooltipProvider>
                    {rates.map((rate) => (
                      <TableRow key={rate._id}>
                        <TableCell className="font-medium">{rate.service}</TableCell>
                        <TableCell>{rate.originalName}</TableCell>
                        <TableCell>{getStatusBadge(rate.status)}</TableCell>
                        <TableCell>
                          {rate.status === "unlisted" && rate.assignedTo?.length > 0 ? (
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Badge variant="outline">{rate.assignedTo.length} assigned</Badge>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p className="max-w-xs">{rate.assignedTo.join(", ")}</p>
                              </TooltipContent>
                            </Tooltip>
                          ) : (
                            <span className="text-muted-foreground text-sm">—</span>
                          )}
                        </TableCell>
                        <TableCell>{rate.zones?.length || 0}</TableCell>
                        <TableCell className="text-right">
                          <AlertDialog>
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" className="h-8 w-8 p-0">
                                        <span className="sr-only">Open menu</span>
                                        <MoreHorizontal className="h-4 w-4" />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                    <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                    <DropdownMenuItem asChild>
                                        <Link href={`/rates/${rate._id}`}>
                                            <Eye className="mr-2 h-4 w-4" />
                                            View Details
                                        </Link>
                                    </DropdownMenuItem>
                                    <DropdownMenuItem asChild>
                                        <Link href={`/rates/edit/${rate._id}`}>
                                            <Edit className="mr-2 h-4 w-4" />
                                            Edit
                                        </Link>
                                    </DropdownMenuItem>
                                    <DropdownMenuSeparator />
                                    <AlertDialogTrigger asChild>
                                        <DropdownMenuItem className="text-red-600 focus:text-red-600 focus:bg-red-50 dark:focus:bg-red-900/50">
                                            <Trash2 className="mr-2 h-4 w-4" />
                                            Delete
                                        </DropdownMenuItem>
                                    </AlertDialogTrigger>
                                </DropdownMenuContent>
                            </DropdownMenu>
                            <AlertDialogContent>
                                <AlertDialogHeader>
                                    <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                                    <AlertDialogDescription>
                                        This action cannot be undone. This will permanently delete the 
                                        <span className="font-semibold"> {rate.service} - {rate.originalName} </span> 
                                        rate sheet.
                                    </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction 
                                        onClick={() => handleDelete(rate._id)}
                                        className="bg-red-600 hover:bg-red-700"
                                    >
                                        Delete
                                    </AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TooltipProvider>
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}