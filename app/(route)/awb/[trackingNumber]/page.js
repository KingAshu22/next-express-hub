"use client";

import { useState, useEffect, use } from "react";
import axios from "axios";
import Image from "next/image";
import { Mail, MapPin, Phone, Printer } from "lucide-react";
import Barcode from "react-barcode"; // Import the barcode package

export default function AWBView({ params }) {
  const { trackingNumber } = use(params);
  console.log("Tracking number: " + trackingNumber);

  const [awbData, setAwbData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchAWBData = async () => {
      console.log(`AWB fetching data ${trackingNumber}`);
      setLoading(true);
      try {
        const response = await axios.get(`/api/awb/${trackingNumber}`);
        setAwbData(response.data[0]);
        setLoading(false);
      } catch (err) {
        setError("Failed to fetch AWB data");
        setLoading(false);
      }
    };

    if (trackingNumber) {
      fetchAWBData();
    }
  }, [trackingNumber]);

  if (loading) return <div className="text-center mt-8">Loading...</div>;
  if (error)
    return <div className="text-center mt-8 text-[#E31E24]">{error}</div>;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="container mx-auto px-4 max-w-4xl pt-0 mt-0">
      <div className="bg-white shadow-lg rounded-lg overflow-hidden pt-0 mt-0">
        <div className="p-6 pt-0 mt-0">
          {/* Flex container for logo, barcode, and title */}
          <div className="flex items-center justify-between border-b border-gray-200 pb-4">
            <div>
              <Image
                src="/logo.jpg"
                alt="Express Hub"
                width={200}
                height={60}
                className=""
              />
              {/* Add contact info below the logo */}
              <div className="text-left mt-2">
                <p className="text-sm text-gray-500 flex flex-row">
                  <Phone className="h-4" /> +91 81691 55537
                </p>
                <p className="text-sm text-gray-500 flex flex-row">
                  <Mail className="h-4" /> expresshub555@gmail.com
                </p>
                <p className="text-sm text-gray-500 flex flex-row">
                  <MapPin className="h-4" /> Mumbai, Bengaluru
                </p>
              </div>
            </div>

            {/* Barcode Section */}
            <div className="mx-4">
              <Barcode
                height={60}
                fontSize={15}
                value={awbData?.trackingNumber}
              />
            </div>

            <div className="text-right">
              <h1 className="text-2xl font-bold text-[#232C65]">Air Waybill</h1>
              <p className="text-[#E31E24] font-semibold">
                {awbData?.trackingNumber}
              </p>
            </div>
          </div>

          {/* The rest of the content */}
          <div className="grid grid-cols-2 md:grid-cols-2 gap-6">
            <div>
              <h2 className="text-lg font-semibold text-[#232C65] mb-2">
                Sender Information
              </h2>
              <AddressBox data={awbData?.sender} />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-[#232C65] mb-2">
                Receiver Information
              </h2>
              <AddressBox data={awbData?.receiver} />
            </div>
          </div>

          <div>
            <h2 className="text-lg font-semibold text-[#232C65] mb-2">
              Shipment Details
            </h2>
            <div className="grid grid-cols-4 gap-4">
              <InfoItem label="Invoice Number" value={awbData?.invoiceNumber} />
              <InfoItem
                label="Date"
                value={
                  awbData?.date
                    ? new Date(awbData?.date).toLocaleDateString()
                    : "Not available"
                }
              />
              <InfoItem label="Parcel Type" value={awbData?.parcelType} />
              <InfoItem label="Status" value={awbData?.parcelStatus[0]} />
            </div>
          </div>

          <div>
            <h2 className="text-lg font-semibold text-[#232C65] mb-2">
              Package Information
            </h2>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    {[
                      "Dimensions (L×B×H)",
                      "Actual Weight",
                      "Dim. Weight",
                      "Chargeable Weight",
                      "Box Total",
                    ]?.map((header) => (
                      <th
                        key={header}
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        {header}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {awbData?.boxes?.map((box, index) => {
                    const boxTotal = box.items?.reduce((total, item) => {
                      return total + item.quantity * item.price;
                    }, 0);

                    return (
                      <tr key={index}>
                        <td className="px-6 py-4 whitespace-nowrap">{`${box.length}×${box.breadth}×${box.height}`}</td>
                        <td className="px-6 py-4 whitespace-nowrap">{`${box.actualWeight} kg`}</td>
                        <td className="px-6 py-4 whitespace-nowrap">{`${box.dimensionalWeight} kg`}</td>
                        <td className="px-6 py-4 whitespace-nowrap">{`${box.chargeableWeight} kg`}</td>
                        <td className="px-6 py-4 whitespace-nowrap">{`₹${boxTotal?.toFixed(
                          2
                        )}`}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          <div>
            <h2 className="text-lg font-semibold text-[#232C65] mb-2">Items</h2>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    {["Box", "Item Name", "Quantity", "Price", "Subtotal"]?.map(
                      (header) => (
                        <th
                          key={header}
                          className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                        >
                          {header}
                        </th>
                      )
                    )}
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {awbData?.boxes?.map((box, index) =>
                    box.items?.map((item, itemIndex) => {
                      const itemSubtotal = item.quantity * item.price;

                      return (
                        <tr key={`${index}-${itemIndex}`}>
                          <td className="px-6 py-4 whitespace-nowrap">{`Box ${
                            index + 1
                          }`}</td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {item.name}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {item.quantity}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">{`₹${item.price}`}</td>
                          <td className="px-6 py-4 whitespace-nowrap">{`₹${itemSubtotal.toFixed(
                            2
                          )}`}</td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className="bg-gray-50 px-6 py-4 print:hidden">
          <button
            onClick={handlePrint}
            className="flex items-center justify-center w-full md:w-auto px-6 py-2 border border-transparent text-base font-medium rounded-md text-white bg-[#E31E24] hover:bg-[#C71D23] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#E31E24]"
          >
            <Printer className="mr-2" size={20} />
            Print AWB
          </button>
        </div>
      </div>
    </div>
  );
}

function AddressBox({ data }) {
  return (
    <div className="border border-gray-200 rounded p-4">
      <p className="font-semibold">{data?.name}</p>
      <p>{data?.address}</p>
      <p>{data?.zip}</p>
      <p>{data?.country}</p>
      <p>Contact: {data?.contact}</p>
    </div>
  );
}

function InfoItem({ label, value }) {
  return (
    <div>
      <p className="text-sm text-gray-500">{label}</p>
      <p className="font-medium">{value}</p>
    </div>
  );
}
