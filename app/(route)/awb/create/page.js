"use client";

import { useEffect, useState } from "react";
import { format } from "date-fns";
import { Calendar as CalendarIcon } from "lucide-react";

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
import SingleSearch from "@/app/_components/SingleSearch";
import { Countries } from "@/app/constants/country";
import axios from "axios";

export default function CreateParcelForm() {
  const [date, setDate] = useState();
  const [parcelType, setParcelType] = useState("International");
  const [staffId, setStaffId] = useState("");
  const [invoiceNumber, setInvoiceNumber] = useState("");
  const [senderName, setSenderName] = useState("");
  const [senderAddress, setSenderAddress] = useState("");
  const [senderCountry, setSenderCountry] = useState("India");
  const [senderZipCode, setSenderZipCode] = useState("");
  const [senderContact, setSenderContact] = useState("");
  const [kycType, setKycType] = useState("Aadhaar No -");
  const [kyc, setKyc] = useState("");
  const [gst, setGst] = useState("");
  const [receiverName, setReceiverName] = useState("");
  const [receiverAddress, setReceiverAddress] = useState("");
  const [receiverCountry, setReceiverCountry] = useState("");
  const [receiverZipCode, setReceiverZipCode] = useState("");
  const [receiverContact, setReceiverContact] = useState("");
  const [zone, setZone] = useState("");
  const [billToSelector, setBillToSelector] = useState("Sender");
  const [billToName, setBillToName] = useState("");
  const [billToAddress, setBillToAddress] = useState("");
  const [billToContact, setBillToContact] = useState("");
  const [trackingNumber, setTrackingNumber] = useState("");
  const [boxes, setBoxes] = useState([
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
  ]);
  const [totalChargeableWeight, setTotalChargeableWeight] = useState("");
  useEffect(() => {
    getInvoiceNumber();
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

  useEffect(() => {
    CheckBillToSelector();
  }, [billToSelector]);

  const CheckBillToSelector = (name, address, contact) => {
    if (billToSelector === "Sender") {
      setBillToName(name);
      setBillToAddress(address);
      setBillToContact(contact);
    } else if (billToSelector === "Receiver") {
      setBillToName(name);
      setBillToAddress(address);
      setBillToContact(contact);
    } else {
      setBillToName("");
      setBillToAddress("");
      setBillToContact("");
    }
  };

  useEffect(() => {
    if (billToSelector === "Sender") {
      CheckBillToSelector(senderName, senderAddress, senderContact);
    } else if (billToSelector === "Receiver") {
      CheckBillToSelector(receiverName, receiverAddress, receiverContact);
    }
  }, [
    billToSelector,
    senderName,
    senderAddress,
    senderContact,
    receiverName,
    receiverAddress,
    receiverContact,
  ]);

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

  const saveParcel = async () => {
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
          zipCode: senderZipCode,
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
          zipCode: receiverZipCode,
          contact: receiverContact,
        },
        billTo: {
          name: billToName,
          address: billToAddress,
          contact: billToContact,
        },
        gst,
        boxes,
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

  return (
    <div className="container mx-auto px-2">
      <h1 className="text-2xl font-bold mb-4">Create AWB Bill</h1>
      <form onSubmit={saveParcel}>
        {/* General Parcel Information */}
        <h1 className="text-xl mb-4">Basic Details for Shipping</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 justify-items-center justify-center items-start content-center gap-4 mb-4">
          <div className="grid w-full min-w-sm items-center gap-1.5">
            <Label htmlFor="invoiceNumber">Invoice No:</Label>
            <Input
              type="text"
              placeholder="Invoice No."
              value={invoiceNumber}
              onChange={(e) => setInvoiceNumber(e.target.value)}
            />
          </div>
          <div className="grid w-full min-w-sm items-center gap-1.5">
            <Label htmlFor="trackingNumber">Tracking No:</Label>
            <Input
              type="number"
              placeholder="Tracking No."
              value={trackingNumber}
              onChange={(e) => setTrackingNumber(e.target.value)}
            />
          </div>
          <div className="grid w-full min-w-sm gap-1.5 md:mt-6">
            <Label htmlFor="date" className="lg:-mt-6">
              Date
            </Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant={"outline"}
                  className={cn(
                    "lg:-mt-2 w-full justify-start text-left font-normal",
                    !date && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {date ? format(date, "PPP") : <span>Select Parcel Date</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-full p-0">
                <Calendar
                  mode="single"
                  selected={date}
                  onSelect={setDate}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>
          <div className="">
            <SingleSearch
              type="Select Parcel Type"
              topList={["International", "Domestic"]}
              selectedItem={parcelType}
              setSelectedItem={setParcelType}
              showSearch={false}
            />
          </div>
        </div>
        <h1 className="text-xl mb-4">Sender Details:</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-8 justify-items-center justify-center items-start content-center gap-4 mb-4">
          <div className="lg:mt-2">
            <Input
              type="text"
              placeholder="Sender Name"
              value={senderName}
              onChange={(e) => setSenderName(e.target.value)}
            />
          </div>
          <div className="grid w-full min-w-sm items-center gap-1.5">
            <Label htmlFor="senderAddress">Sender Address:</Label>
            <textarea
              id="senderAddress"
              placeholder="Sender Address"
              value={senderAddress}
              onChange={(e) => setSenderAddress(e.target.value)}
              className="w-full px-2 py-1 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows="4" // Set rows to control the height
            />
          </div>
          <div className="lg:-mt-10">
            <SingleSearch
              type="Sender Country"
              list={Countries}
              selectedItem={senderCountry}
              setSelectedItem={setSenderCountry}
              showSearch={true}
            />
          </div>
          <div className="grid w-full min-w-sm items-center gap-1.5">
            <Label htmlFor="senderZipCode">Sender Zip Code:</Label>
            <Input
              type="text"
              placeholder="Sender Zip Code"
              value={senderZipCode}
              onChange={(e) => setSenderZipCode(e.target.value)}
            />
          </div>
          <div className="grid w-full min-w-sm items-center gap-1.5">
            <Label htmlFor="senderContact">Sender Contact:</Label>
            <Input
              type="text"
              placeholder="Sender Contact"
              value={senderContact}
              onChange={(e) => setSenderContact(e.target.value)}
            />
          </div>
          <div className="lg:-mt-10">
            <SingleSearch
              type="Sender KYC Type"
              list={[
                "Aadhaar No -",
                "Pan No -",
                "Passport No -",
                "Driving License No -",
                "Voter ID Card No -",
                "GST No -",
              ]}
              selectedItem={kycType}
              setSelectedItem={setKycType}
              showSearch={true}
            />
          </div>
          <div className="grid w-full min-w-sm items-center gap-1.5">
            <Label htmlFor="kyc">KYC:</Label>
            <Input
              type="text"
              placeholder="KYC"
              value={kyc}
              onChange={(e) => setKyc(e.target.value)}
            />
          </div>
          <div className="grid w-full min-w-sm items-center gap-1.5">
            <Label htmlFor="gst">GST:</Label>
            <Input
              type="text"
              placeholder="GST No"
              value={gst}
              onChange={(e) => setGst(e.target.value)}
            />
          </div>
        </div>
        <h1 className="text-xl mb-4">Receiver Details:</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 justify-items-center justify-center items-start content-center gap-4 mb-4">
          <div className="lg:-mt-1">
            <Input
              type="text"
              placeholder="Receiver Name"
              value={receiverName}
              onChange={(e) => setReceiverName(e.target.value)}
            />
          </div>
          <div className="grid w-full min-w-sm items-center gap-1.5">
            <Label htmlFor="receiverAddress">Receiver Address:</Label>
            <textarea
              id="receiverAddress"
              placeholder="Receiver Address"
              value={receiverAddress}
              onChange={(e) => setReceiverAddress(e.target.value)}
              className="w-full px-2 py-1 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows="4" // Set rows to control the height
            />
          </div>
          <div className="">
            <SingleSearch
              type="Receiver Country"
              list={Countries}
              selectedItem={receiverCountry}
              setSelectedItem={setReceiverCountry}
              showSearch={true}
            />
          </div>
          <div className="grid w-full min-w-sm items-center gap-1.5">
            <Label htmlFor="receiverZipCode">Receiver Zip Code:</Label>
            <Input
              type="text"
              placeholder="Receiver Zip Code"
              value={receiverZipCode}
              onChange={(e) => setReceiverZipCode(e.target.value)}
            />
          </div>
          <div className="grid w-full min-w-sm items-center gap-1.5">
            <Label htmlFor="receiverContact">Receiver Contact:</Label>
            <Input
              type="text"
              placeholder="Receiver Contact"
              value={receiverContact}
              onChange={(e) => setReceiverContact(e.target.value)}
            />
          </div>
          <div className="grid w-full min-w-sm items-center gap-1.5">
            <Label htmlFor="zone">Zone:</Label>
            <Input
              type="text"
              placeholder="Zone"
              value={zone}
              onChange={(e) => setZone(e.target.value)}
            />
          </div>
        </div>
        <h1 className="text-xl mb-4">Bill To Details:</h1>
        <div className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-4 justify-items-center justify-center items-start content-center gap-4 mb-4">
          <div className="">
            <SingleSearch
              type="Bill To"
              list={["Sender", "Receiver", "Other Person"]}
              topList={["Sender", "Receiver", "Other Person"]}
              selectedItem={billToSelector}
              setSelectedItem={setBillToSelector}
              showSearch={false}
            />
          </div>
          <div className="grid w-full min-w-sm items-center gap-1.5">
            <Label htmlFor="billToName">Bill To Name:</Label>
            <Input
              type="text"
              placeholder="Bill To Name"
              value={billToName}
              onChange={(e) => setBillToName(e.target.value)}
            />
          </div>
          <div className="grid w-full min-w-sm items-center gap-1.5">
            <Label htmlFor="billToAddress">Bill To Address:</Label>
            <Input
              type="text"
              placeholder="Bill To Address"
              value={billToAddress}
              onChange={(e) => setBillToAddress(e.target.value)}
            />
          </div>
          <div className="grid w-full min-w-sm items-center gap-1.5">
            <Label htmlFor="billToContact">Bill To Contact:</Label>
            <Input
              type="text"
              placeholder="Bill To Contact"
              value={billToContact}
              onChange={(e) => setBillToContact(e.target.value)}
            />
          </div>
        </div>
        <h1 className="text-xl mb-4">Box Details:</h1>
        <div className="mb-4">
          <h2 className="text-lg font-bold mb-2">Boxes</h2>
          {boxes.map((box, boxIndex) => (
            <div key={boxIndex} className="p-4 mb-4 border rounded shadow-sm">
              <h1 className="text-xl mb-4">Box {boxIndex + 1}:</h1>
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
                {/* Box Fields */}
                <div>
                  <Label htmlFor="length">Length (cm):</Label>
                  <Input
                    type="number"
                    placeholder="Length (cm)"
                    value={box.length || ""}
                    onChange={(e) =>
                      handleBoxChange(
                        boxIndex,
                        "length",
                        parseFloat(e.target.value) || ""
                      )
                    }
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="breadth">Breadth (cm):</Label>
                  <Input
                    type="number"
                    placeholder="Breadth (cm)"
                    value={box.breadth || ""}
                    onChange={(e) =>
                      handleBoxChange(
                        boxIndex,
                        "breadth",
                        parseFloat(e.target.value) || ""
                      )
                    }
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="height">Height (cm):</Label>
                  <Input
                    type="number"
                    placeholder="Height (cm)"
                    value={box.height || ""}
                    onChange={(e) =>
                      handleBoxChange(
                        boxIndex,
                        "height",
                        parseFloat(e.target.value) || ""
                      )
                    }
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="actualWeight">Actual Weight (kg):</Label>
                  <Input
                    type="number"
                    placeholder="Actual Weight (kg)"
                    value={box.actualWeight || ""}
                    onChange={(e) =>
                      handleBoxChange(
                        boxIndex,
                        "actualWeight",
                        parseFloat(e.target.value) || ""
                      )
                    }
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="dimensionalWeight">
                    Dimensional Weight (kg):
                  </Label>
                  <Input
                    type="number"
                    placeholder="Dimensional Weight (kg)"
                    value={box.dimensionalWeight || ""}
                    readOnly
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="chargeableWeight">
                    Chargeable Weight (kg):
                  </Label>
                  <Input
                    type="number"
                    placeholder="Chargeable Weight (kg)"
                    value={box.chargeableWeight || ""}
                    readOnly
                    required
                  />
                </div>
                <button
                  type="button"
                  onClick={() => removeBox(boxIndex)}
                  className="lg:mt-6 w-28 h-8 bg-red-500 text-white rounded"
                >
                  Remove Box
                </button>
              </div>
              <h3 className="text-lg font-semibold mt-4">Items</h3>
              {box.items.map((item, itemIndex) => (
                <div key={itemIndex}>
                  <h1 className="text-md mb-4">Item {itemIndex + 1}:</h1>
                  <div
                    key={itemIndex}
                    className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-2"
                  >
                    <div>
                      <Label htmlFor={`itemName-${boxIndex}-${itemIndex}`}>
                        Name:
                      </Label>
                      <Input
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
                    <div>
                      <Label htmlFor={`itemQuantity-${boxIndex}-${itemIndex}`}>
                        Quantity:
                      </Label>
                      <Input
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
                    <div>
                      <Label htmlFor={`itemPrice-${boxIndex}-${itemIndex}`}>
                        Price:
                      </Label>
                      <Input
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
                    <button
                      type="button"
                      onClick={() => removeItem(boxIndex, itemIndex)}
                      className="lg:mt-6 w-28 h-8 bg-red-500 text-white px-2 py-1 rounded"
                    >
                      Remove Item
                    </button>
                  </div>
                </div>
              ))}
              <button
                type="button"
                onClick={() => addItem(boxIndex)}
                className="bg-blue-500 text-white px-4 py-2 rounded mt-4"
              >
                Add Item
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={addBox}
            className="bg-blue-500 text-white px-4 py-2 rounded"
          >
            Add Box
          </button>
        </div>
        {/* Submit */}
        <button
          type="submit"
          className="bg-green-500 text-white px-4 py-2 rounded"
        >
          Submit
        </button>
      </form>
    </div>
  );
}
