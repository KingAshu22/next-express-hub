import { useState } from "react"
import Link from "next/link"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export default function AWBTable({ awbData, onEdit, onDelete }) {
    const [editingAWB, setEditingAWB] = useState(null)

    const handleEdit = (awb) => {
        setEditingAWB(awb)
    }

    const handleSave = (updatedAWB) => {
        onEdit(updatedAWB)
        setEditingAWB(null)
    }

    const handleDelete = (trackingNumber) => {
        if (window.confirm("Are you sure you want to delete this AWB?")) {
            onDelete(trackingNumber)
        }
    }

    return (
        <div className="w-full overflow-x-auto">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Tracking Number</TableHead>
                        <TableHead>Sender</TableHead>
                        <TableHead>Recipient</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Actions</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {awbData.map((awb) => (
                        <TableRow key={awb.trackingNumber}>
                            <TableCell>{awb.trackingNumber}</TableCell>
                            <TableCell>{awb.senderName}</TableCell>
                            <TableCell>{awb.recipientName}</TableCell>
                            <TableCell>{awb.status}</TableCell>
                            <TableCell>
                                <div className="flex space-x-2">
                                    <Link href={`/awb/${awb.trackingNumber}`}>
                                        <Button variant="outline" size="sm">
                                            View
                                        </Button>
                                    </Link>
                                    <Dialog>
                                        <DialogTrigger asChild>
                                            <Button variant="outline" size="sm" onClick={() => handleEdit(awb)}>
                                                Edit
                                            </Button>
                                        </DialogTrigger>
                                        <DialogContent>
                                            <DialogHeader>
                                                <DialogTitle>Edit AWB</DialogTitle>
                                            </DialogHeader>
                                            <EditAWBForm awb={editingAWB} onSave={handleSave} />
                                        </DialogContent>
                                    </Dialog>
                                    <Button variant="destructive" size="sm" onClick={() => handleDelete(awb.trackingNumber)}>
                                        Delete
                                    </Button>
                                </div>
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </div>
    )
}

function EditAWBForm({ awb, onSave }) {
    const [formData, setFormData] = useState(awb)

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value })
    }

    const handleSubmit = (e) => {
        e.preventDefault()
        onSave(formData)
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div>
                <Label htmlFor="senderName">Sender Name</Label>
                <Input id="senderName" name="senderName" value={formData.senderName} onChange={handleChange} />
            </div>
            <div>
                <Label htmlFor="recipientName">Recipient Name</Label>
                <Input id="recipientName" name="recipientName" value={formData.recipientName} onChange={handleChange} />
            </div>
            <div>
                <Label htmlFor="status">Status</Label>
                <Input id="status" name="status" value={formData.status} onChange={handleChange} />
            </div>
            <Button type="submit">Save Changes</Button>
        </form>
    )
}

