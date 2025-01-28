import { useState } from "react";
import Link from "next/link";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function AWBTable({ awbData }) {
  return (
    <div className="w-full overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Tracking Number</TableHead>
            <TableHead>Sender</TableHead>
            <TableHead>Recipient</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Generate AWB</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {awbData.map((awb) => (
            <TableRow key={awb.trackingNumber}>
              <TableCell>{awb.trackingNumber}</TableCell>
              <TableCell>{awb.sender?.name}</TableCell>
              <TableCell>{awb.receiver?.name}</TableCell>
              <TableCell>
                {awb.parcelStatus
                  ? awb.parcelStatus[awb.parcelStatus.length - 1].status
                  : "Unknown"}
              </TableCell>
              <TableCell>
                <div className="flex space-x-2">
                  <Link href={`/awb/${awb.trackingNumber}`}>
                    <Button variant="outline" size="sm">
                      View
                    </Button>
                  </Link>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

function EditAWBForm({ awb, onSave }) {
  const [formData, setFormData] = useState(awb);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="senderName">Sender Name</Label>
        <Input
          id="senderName"
          name="senderName"
          value={formData.senderName}
          onChange={handleChange}
        />
      </div>
      <div>
        <Label htmlFor="recipientName">Recipient Name</Label>
        <Input
          id="recipientName"
          name="recipientName"
          value={formData.recipientName}
          onChange={handleChange}
        />
      </div>
      <div>
        <Label htmlFor="status">Status</Label>
        <Input
          id="status"
          name="status"
          value={formData.status}
          onChange={handleChange}
        />
      </div>
      <Button type="submit">Save Changes</Button>
    </form>
  );
}
