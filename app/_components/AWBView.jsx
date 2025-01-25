"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { Printer } from "lucide-react";

export default function AWBViewClient({ awbData }) {
  const [isPrinting, setIsPrinting] = useState(false);

  useEffect(() => {
    console.log("AWB data: ", awbData);
  }, [awbData]);

  const handlePrint = () => {
    setIsPrinting(true);
    window.print();
    setIsPrinting(false);
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <p>Tracking Number: {awbData.trackingNumber}</p>
      <div className="bg-white shadow-lg rounded-lg overflow-hidden">
        <div className="p-6 space-y-6">
          <div className="flex justify-between items-center border-b border-gray-200 pb-4">
            <div>
              <Image
                src="/placeholder.svg?height=60&width=200"
                alt="Express Hub"
                width={200}
                height={60}
              />
            </div>
            <div className="text-right">
              <h1 className="text-2xl font-bold text-[#232C65]">Air Waybill</h1>
              <p className="text-[#E31E24] font-semibold">
                {awbData.trackingNumber}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h2 className="text-lg font-semibold text-[#232C65] mb-2">
                Sender Information
              </h2>
              <AddressBox data={awbData.sender} />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-[#232C65] mb-2">
                Receiver Information
              </h2>
              <AddressBox data={awbData.receiver} />
            </div>
          </div>

          <div>
            <h2 className="text-lg font-semibold text-[#232C65] mb-2">
              Shipment Details
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <InfoItem label="Invoice Number" value={awbData.invoiceNumber} />
              <InfoItem
                label="Date"
                value={new Date(awbData.date).toLocaleDateString()}
              />
              <InfoItem label="Parcel Type" value={awbData.parcelType} />
              <InfoItem label="GST" value={awbData.gst} />
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
                  {awbData.boxes?.map((box, index) => (
                    <tr key={index}>
                      <td className="px-6 py-4 whitespace-nowrap">{`${box.length}×${box.breadth}×${box.height}`}</td>
                      <td className="px-6 py-4 whitespace-nowrap">{`${box.actualWeight} kg`}</td>
                      <td className="px-6 py-4 whitespace-nowrap">{`${box.dimensionalWeight} kg`}</td>
                      <td className="px-6 py-4 whitespace-nowrap">{`${box.chargeableWeight} kg`}</td>
                    </tr>
                  ))}
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
                    {["Name", "Quantity", "Price"]?.map((header) => (
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
                  {awbData.boxes?.flatMap((box) =>
                    box.items?.map((item, index) => (
                      <tr key={index}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {item?.name}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {item?.quantity}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">{`₹${item?.price}`}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className="bg-gray-50 px-6 py-4">
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
