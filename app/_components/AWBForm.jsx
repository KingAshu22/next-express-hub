"use client";

import { useState, useEffect } from "react";
import { format } from "date-fns";
import { CalendarIcon, Plus, Minus, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Countries } from "@/app/constants/country";
import axios from "axios";
import SingleSearch from "./SingleSearch";
import { SearchableCountrySelect } from "./SearchableCountrySelect";

export default function AWBForm({ isEdit = false, awb }) {
  const [date, setDate] = useState(awb?.date || Date.now());
  const [parcelType, setParcelType] = useState(
    awb?.parcelType || "International"
  );
  const [staffId, setStaffId] = useState(awb?.staffId || "");
  const [invoiceNumber, setInvoiceNumber] = useState(awb?.invoiceNumber || "");
  const [senderName, setSenderName] = useState(awb?.sender?.name || "");
  const [senderAddress, setSenderAddress] = useState(
    awb?.sender?.address || ""
  );
  const [senderCountry, setSenderCountry] = useState(
    awb?.sender?.country || "India"
  );
  const [senderZipCode, setSenderZipCode] = useState(awb?.sender?.zip || "");
  const [senderContact, setSenderContact] = useState(
    awb?.sender?.contact || ""
  );
  const [kycType, setKycType] = useState(
    awb?.sender?.kyc?.type || "Aadhaar No -"
  );
  const [kyc, setKyc] = useState(awb?.sender?.kyc?.kyc || "");
  const [gst, setGst] = useState(awb?.gst || "");
  const [receiverName, setReceiverName] = useState(awb?.receiver?.name || "");
  const [receiverAddress, setReceiverAddress] = useState(
    awb?.receiver?.address || ""
  );
  const [receiverCountry, setReceiverCountry] = useState(
    awb?.receiver?.country || ""
  );
  const [receiverZipCode, setReceiverZipCode] = useState(
    awb?.receiver?.zip || ""
  );
  const [receiverContact, setReceiverContact] = useState(
    awb?.receiver?.contact || ""
  );
  const [trackingNumber, setTrackingNumber] = useState(
    awb?.trackingNumber || ""
  );
  const [boxes, setBoxes] = useState(
    awb?.boxes || [
      {
        length: "",
        breadth: "",
        height: "",
        actualWeight: "",
        dimensionalWeight: "",
        chargeableWeight: "",
        items: [
          {
            name: "",
            quantity: "",
            price: "",
          },
        ],
      },
    ]
  );
  const [parcelStatus, setParcelStatus] = useState(
    awb?.parcelStatus || "Item Accepted By Courier"
  );
  const [totalChargeableWeight, setTotalChargeableWeight] = useState("");
  useEffect(() => {
    !isEdit && getInvoiceNumber();
  }, []);

  useEffect(() => {
    // Calculate the total chargeable weight
    const totalWeight = boxes.reduce((acc, box) => {
      const chargeableWeight = parseFloat(box.chargeableWeight) || 0; // Parse as a number and default to 0 if invalid
      return acc + chargeableWeight;
    }, 0); // Initial accumulator value is 0

    // Update the totalChargeableWeight state
    setTotalChargeableWeight(Math.round(totalWeight));
  }, [boxes]);

  const getInvoiceNumber = async () => {
    try {
      const response = await axios.get("/api/get-last-awb");
      const lastInvoiceNumber = response.data.invoiceNumber;
      const incrementedNumber = (parseInt(lastInvoiceNumber) + 1).toString();

      // Construct the new invoice number
      const newInvoiceNumber = incrementedNumber;

      // Set the new invoice number
      setInvoiceNumber(newInvoiceNumber);
      setTrackingNumber(response.data.trackingNumber);
    } catch (error) {
      console.error("Error fetching parcel:", error);
      // setError("Failed to fetch parcel. Please try again later.");
    }
  };

  const addBox = () => {
    setBoxes([
      ...boxes,
      {
        length: "",
        breadth: "",
        height: "",
        actualWeight: "",
        dimensionalWeight: "",
        chargeableWeight: "",
        items: [{ name: "", quantity: "", price: "" }],
      },
    ]);
  };

  const handleBoxChange = (index, field, value) => {
    const updatedBoxes = [...boxes];
    updatedBoxes[index][field] = value;

    if (["length", "breadth", "height", "actualWeight"].includes(field)) {
      const box = updatedBoxes[index];
      const dimensionalWeight = Math.round(
        (box.length * box.breadth * box.height) / 5000
      );
      const chargeableWeight = Math.max(box.actualWeight, dimensionalWeight);
      updatedBoxes[index].dimensionalWeight = dimensionalWeight;
      updatedBoxes[index].chargeableWeight = chargeableWeight;
    }

    setBoxes(updatedBoxes);
  };

  const handleItemChange = (boxIndex, itemIndex, field, value) => {
    const updatedBoxes = [...boxes];
    updatedBoxes[boxIndex].items[itemIndex][field] = value;
    setBoxes(updatedBoxes);
  };

  const addItem = (boxIndex) => {
    const updatedBoxes = [...boxes];
    updatedBoxes[boxIndex].items.push({ name: "", quantity: "", price: "" });
    setBoxes(updatedBoxes);
  };

  const removeItem = (boxIndex, itemIndex) => {
    const updatedBoxes = [...boxes];
    updatedBoxes[boxIndex].items.splice(itemIndex, 1);
    setBoxes(updatedBoxes);
  };

  const removeBox = (boxIndex) => {
    const updatedBoxes = [...boxes];
    updatedBoxes.splice(boxIndex, 1);
    setBoxes(updatedBoxes);
  };

  const handleSubmit = async () => {
    try {
      console.log("Inside Save Parcel Function");
      const parcelData = {
        parcelType,
        staffId,
        invoiceNumber,
        date,
        trackingNumber,
        sender: {
          name: senderName,
          address: senderAddress,
          country: senderCountry,
          zip: senderZipCode,
          contact: senderContact,
          kyc: {
            type: kycType,
            kyc,
          },
        },
        receiver: {
          name: receiverName,
          address: receiverAddress,
          country: receiverCountry,
          zip: receiverZipCode,
          contact: receiverContact,
        },
        gst,
        boxes,
        parcelStatus,
      };

      const response = await axios.post("/api/awb", parcelData);

      if (response.status === 200) {
        console.log("Parcel saved successfully:", response.data);
        alert("Parcel saved successfully!");
      } else {
        console.error("Failed to save parcel:", response.data);
        alert("Failed to save the parcel. Please try again.");
      }
    } catch (error) {
      console.error(
        "Error saving parcel:",
        error.response?.data || error.message
      );
      alert("An error occurred while saving the parcel.");
    }
  };

  const editSubmit = async () => {
    try {
      console.log("Inside Save Parcel Function");
      const parcelData = {
        parcelType,
        staffId,
        invoiceNumber,
        date,
        trackingNumber,
        sender: {
          name: senderName,
          address: senderAddress,
          country: senderCountry,
          zip: senderZipCode,
          contact: senderContact,
          kyc: {
            type: kycType,
            kyc,
          },
        },
        receiver: {
          name: receiverName,
          address: receiverAddress,
          country: receiverCountry,
          zip: receiverZipCode,
          contact: receiverContact,
        },
        gst,
        boxes,
        parcelStatus,
      };

      const response = await axios.put(
        `/api/awb/${trackingNumber}`,
        parcelData
      );

      if (response.status === 200) {
        console.log("Parcel saved successfully:", response.data);
        alert("Parcel saved successfully!");
      } else {
        console.error("Failed to save parcel:", response.data);
        alert("Failed to save the parcel. Please try again.");
      }
    } catch (error) {
      console.error(
        "Error saving parcel:",
        error.response?.data || error.message
      );
      alert("An error occurred while saving the parcel.");
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8 text-center text-[#232C65]">
        {isEdit ? "Edit AWB" : "Create AWB"}
      </h1>
      <form onSubmit={isEdit ? editSubmit : handleSubmit} className="space-y-8">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl text-[#232C65]">
              Basic Details
            </CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="space-y-2">
              <Label htmlFor="invoiceNumber">Invoice No:</Label>
              <Input
                id="invoiceNumber"
                type="text"
                placeholder="Invoice No."
                value={invoiceNumber}
                onChange={(e) => setInvoiceNumber(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="trackingNumber">Tracking No:</Label>
              <Input
                id="trackingNumber"
                type="number"
                placeholder="Tracking No."
                value={trackingNumber}
                onChange={(e) => setTrackingNumber(e.target.value)}
                readOnly
              />
            </div>
            <div className="space-y-2">
              <Label>Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant={"outline"}
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !date && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {date ? (
                      format(date, "PPP")
                    ) : (
                      <span>Select Parcel Date</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={date}
                    onSelect={setDate}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
            <div className="space-y-2">
              <Label>Parcel Type</Label>
              <Select value={parcelType} onValueChange={setParcelType}>
                <SelectTrigger>
                  <SelectValue placeholder="Select Parcel Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="International">International</SelectItem>
                  <SelectItem value="Domestic">Domestic</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Parcel Status</Label>
              <Select value={parcelStatus} onValueChange={setParcelStatus}>
                <SelectTrigger>
                  <SelectValue placeholder="Select Parcel Status" />
                </SelectTrigger>
                <SelectContent>
                  {[
                    "Item Accepted By Courier",
                    "Shipment Arrived at Export Gateway",
                    "Connection Established",
                    "In-Transit",
                    "At Destination Sort Facility",
                    "Out For Delivery",
                    "Delivered",
                    "Unsuccessful Delivery Attempt",
                  ].map((status) => (
                    <SelectItem key={status} value={status}>
                      {status}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-2xl text-[#232C65]">
              Sender Details
            </CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="space-y-2">
              <Label htmlFor="senderName">Sender Name</Label>
              <Input
                id="senderName"
                type="text"
                placeholder="Sender Name"
                value={senderName}
                onChange={(e) => setSenderName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="senderAddress">Sender Address</Label>
              <Textarea
                id="senderAddress"
                placeholder="Sender Address"
                value={senderAddress}
                onChange={(e) => setSenderAddress(e.target.value)}
                rows={4}
              />
            </div>
            <div className="space-y-2">
              <SingleSearch
                type="Sender Country"
                list={Countries}
                selectedItem={senderCountry}
                setSelectedItem={setSenderCountry}
                showSearch={true}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="senderZipCode">Sender Zip Code</Label>
              <Input
                id="senderZipCode"
                type="text"
                placeholder="Sender Zip Code"
                value={senderZipCode}
                onChange={(e) => setSenderZipCode(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="senderContact">Sender Contact</Label>
              <Input
                id="senderContact"
                type="text"
                placeholder="Sender Contact"
                value={senderContact}
                onChange={(e) => setSenderContact(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Sender KYC Type</Label>
              <Select value={kycType} onValueChange={setKycType}>
                <SelectTrigger>
                  <SelectValue placeholder="Select KYC Type" />
                </SelectTrigger>
                <SelectContent>
                  {[
                    "Aadhaar No -",
                    "Pan No -",
                    "Passport No -",
                    "Driving License No -",
                    "Voter ID Card No -",
                    "GST No -",
                  ].map((type) => (
                    <SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="kyc">KYC</Label>
              <Input
                id="kyc"
                type="text"
                placeholder="KYC"
                value={kyc}
                onChange={(e) => setKyc(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="gst">GST</Label>
              <Input
                id="gst"
                type="text"
                placeholder="GST No"
                value={gst}
                onChange={(e) => setGst(e.target.value)}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-2xl text-[#232C65]">
              Receiver Details
            </CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="space-y-2">
              <Label htmlFor="receiverName">Receiver Name</Label>
              <Input
                id="receiverName"
                type="text"
                placeholder="Receiver Name"
                value={receiverName}
                onChange={(e) => setReceiverName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="receiverAddress">Receiver Address</Label>
              <Textarea
                id="receiverAddress"
                placeholder="Receiver Address"
                value={receiverAddress}
                onChange={(e) => setReceiverAddress(e.target.value)}
                rows={4}
              />
            </div>
            <div className="space-y-2">
              <SingleSearch
                type="Receiver Country"
                list={Countries}
                selectedItem={receiverCountry}
                setSelectedItem={setReceiverCountry}
                showSearch={true}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="receiverZipCode">Receiver Zip Code</Label>
              <Input
                id="receiverZipCode"
                type="text"
                placeholder="Receiver Zip Code"
                value={receiverZipCode}
                onChange={(e) => setReceiverZipCode(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="receiverContact">Receiver Contact</Label>
              <Input
                id="receiverContact"
                type="text"
                placeholder="Receiver Contact"
                value={receiverContact}
                onChange={(e) => setReceiverContact(e.target.value)}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-2xl text-[#232C65]">
              Box Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {boxes.map((box, boxIndex) => (
              <Card key={boxIndex}>
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle className="text-xl text-[#232C65]">
                    Box {boxIndex + 1}
                  </CardTitle>
                  {boxIndex > 0 && (
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      onClick={() => removeBox(boxIndex)}
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Remove Box
                    </Button>
                  )}
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor={`length-${boxIndex}`}>Length (cm)</Label>
                      <Input
                        id={`length-${boxIndex}`}
                        type="number"
                        placeholder="Length (cm)"
                        value={box.length || ""}
                        onChange={(e) =>
                          handleBoxChange(
                            boxIndex,
                            "length",
                            Number.parseFloat(e.target.value) || ""
                          )
                        }
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor={`breadth-${boxIndex}`}>
                        Breadth (cm)
                      </Label>
                      <Input
                        id={`breadth-${boxIndex}`}
                        type="number"
                        placeholder="Breadth (cm)"
                        value={box.breadth || ""}
                        onChange={(e) =>
                          handleBoxChange(
                            boxIndex,
                            "breadth",
                            Number.parseFloat(e.target.value) || ""
                          )
                        }
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor={`height-${boxIndex}`}>Height (cm)</Label>
                      <Input
                        id={`height-${boxIndex}`}
                        type="number"
                        placeholder="Height (cm)"
                        value={box.height || ""}
                        onChange={(e) =>
                          handleBoxChange(
                            boxIndex,
                            "height",
                            Number.parseFloat(e.target.value) || ""
                          )
                        }
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor={`actualWeight-${boxIndex}`}>
                        Actual Weight (kg)
                      </Label>
                      <Input
                        id={`actualWeight-${boxIndex}`}
                        type="number"
                        placeholder="Actual Weight (kg)"
                        value={box.actualWeight || ""}
                        onChange={(e) =>
                          handleBoxChange(
                            boxIndex,
                            "actualWeight",
                            Number.parseFloat(e.target.value) || ""
                          )
                        }
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor={`dimensionalWeight-${boxIndex}`}>
                        Dimensional Weight (kg)
                      </Label>
                      <Input
                        id={`dimensionalWeight-${boxIndex}`}
                        type="number"
                        placeholder="Dimensional Weight (kg)"
                        value={box.dimensionalWeight || ""}
                        readOnly
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor={`chargeableWeight-${boxIndex}`}>
                        Chargeable Weight (kg)
                      </Label>
                      <Input
                        id={`chargeableWeight-${boxIndex}`}
                        type="number"
                        placeholder="Chargeable Weight (kg)"
                        value={box.chargeableWeight || ""}
                        readOnly
                        required
                      />
                    </div>
                  </div>
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-[#232C65]">
                      Items
                    </h3>
                    {box.items.map((item, itemIndex) => (
                      <Card key={itemIndex}>
                        <CardHeader className="flex flex-row items-center justify-between">
                          <CardTitle className="text-lg text-[#232C65]">
                            Item {itemIndex + 1}
                          </CardTitle>
                          {itemIndex > 0 && (
                            <Button
                              type="button"
                              variant="destructive"
                              size="sm"
                              onClick={() => removeItem(boxIndex, itemIndex)}
                            >
                              <Minus className="h-4 w-4 mr-2" />
                              Remove Item
                            </Button>
                          )}
                        </CardHeader>
                        <CardContent>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="space-y-2">
                              <Label
                                htmlFor={`itemName-${boxIndex}-${itemIndex}`}
                              >
                                Name
                              </Label>
                              <Input
                                id={`itemName-${boxIndex}-${itemIndex}`}
                                type="text"
                                placeholder="Item Name"
                                value={item.name || ""}
                                onChange={(e) =>
                                  handleItemChange(
                                    boxIndex,
                                    itemIndex,
                                    "name",
                                    e.target.value
                                  )
                                }
                                required
                              />
                            </div>
                            <div className="space-y-2">
                              <Label
                                htmlFor={`itemQuantity-${boxIndex}-${itemIndex}`}
                              >
                                Quantity
                              </Label>
                              <Input
                                id={`itemQuantity-${boxIndex}-${itemIndex}`}
                                type="number"
                                placeholder="Quantity"
                                value={item.quantity || ""}
                                onChange={(e) =>
                                  handleItemChange(
                                    boxIndex,
                                    itemIndex,
                                    "quantity",
                                    e.target.value
                                  )
                                }
                                required
                              />
                            </div>
                            <div className="space-y-2">
                              <Label
                                htmlFor={`itemPrice-${boxIndex}-${itemIndex}`}
                              >
                                Price
                              </Label>
                              <Input
                                id={`itemPrice-${boxIndex}-${itemIndex}`}
                                type="number"
                                placeholder="Price"
                                value={item.price || ""}
                                onChange={(e) =>
                                  handleItemChange(
                                    boxIndex,
                                    itemIndex,
                                    "price",
                                    e.target.value
                                  )
                                }
                                required
                              />
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => addItem(boxIndex)}
                      className="mt-2"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add Item
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
            <Button
              type="button"
              variant="outline"
              onClick={addBox}
              className="mt-4"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Box
            </Button>
          </CardContent>
        </Card>

        <div className="flex justify-end">
          <Button
            type="submit"
            className="bg-[#E31E24] hover:bg-[#C71D23] text-white"
          >
            {isEdit ? "Update AWB" : "Create AWB"}
          </Button>
        </div>
      </form>
    </div>
  );
}
