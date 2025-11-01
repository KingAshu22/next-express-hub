"use client";

import { useState, useEffect, use } from "react";
import axios from "axios";
import Image from "next/image";
import { Mail, MapPin, MoveRight, Phone, Printer } from "lucide-react";
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
    <div className="container mx-auto px-1 max-w-4xl pt-0 mt-0">
      <div className="bg-white border border-black rounded-lg overflow-hidden pt-0 mt-0">
        <div className="p-4 pt-0 mt-0">
          {/* Flex container for logo, barcode, and title */}
          <div className="flex items-center justify-between">
            <div>
              <Image
                src="/logo.jpg"
                alt="Kargo Onee"
                width={200}
                height={60}
                className=""
              />
              {/* Add contact info below the logo */}
              <div className="text-left mt-2">
                <p className="text-sm text-gray-500 flex flex-row">
                  <Phone className="h-4" /> +91 97699 93011 / +91 81691 55537
                </p>
                <p className="text-sm text-gray-500 flex flex-row">
                  <Mail className="h-4" /> expresshub555@gmail.com
                </p>
                <p className="text-sm text-gray-500 flex flex-row">
                  <MapPin className="h-4" /> Mumbai | Hyderabad | Bangalore | Kerala
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
          <div className="flex items-center justify-center">
            <div className="flex items-center justify-between">
              <p className="flex gap-2 text-[#E31E24] font-bold">
                {awbData?.sender?.country} <MoveRight />{" "}
                {awbData?.receiver?.country}
              </p>
            </div>
          </div>
          <hr className="w-full pb-4" />

          {/* The rest of the content */}
          <div className="grid grid-cols-2 md:grid-cols-2 gap-2 text-xs">
            <div>
              <h2 className="text-md font-semibold text-[#232C65] mb-2">
                Sender Information
              </h2>
              <AddressBox data={awbData?.sender} />
            </div>
            <div>
              <h2 className="text-md font-semibold text-[#232C65] mb-2">
                Receiver Information
              </h2>
              <AddressBox data={awbData?.receiver} />
            </div>
          </div>

          <div>
            <h2 className="text-xs font-semibold text-[#232C65] mb-2">
              Shipment Details
            </h2>
            <div className="grid grid-cols-4 gap-1 text-xs">
              <InfoItem label="Invoice Number" value={awbData?.invoiceNumber} />
              <InfoItem
                label="Date"
                value={
                  awbData?.date
                    ? new Date(awbData?.date).toLocaleDateString("en-GB")
                    : "Not available"
                }
              />
              <InfoItem label="Parcel Type" value={awbData?.parcelType} />
              <InfoItem label="Status" value={awbData?.parcelStatus[awbData?.parcelStatus.length - 1]?.status} />
            </div>
          </div>

          <div>
            <h2 className="text-xs font-semibold text-[#232C65] mb-2">
              Package Information
            </h2>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 text-xs">
                <thead className="bg-gray-50">
                  <tr>
                    {[
                      "Box No",
                      "Dimensions (L×B×H)",
                      "Actual Weight",
                      "Dim. Weight",
                      "Chargeable Weight",
                    ]?.map((header) => (
                      <th
                        key={header}
                        className="px-1 py-1 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
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
                        <td className="px-8 py-2 whitespace-nowrap">{`${index + 1
                          }`}</td>
                        <td className="px-8 py-2 whitespace-nowrap">{`${box.length}×${box.breadth}×${box.height}`}</td>
                        <td className="px-8 py-2 whitespace-nowrap">{`${box.actualWeight} kg`}</td>
                        <td className="px-8 py-2 whitespace-nowrap">{`${box.dimensionalWeight} kg`}</td>
                        <td className="px-8 py-2 whitespace-nowrap">{`${box.chargeableWeight} kg`}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className="text-xs px-2">
          <p className="text-[#232C65] font-semibold text-justify">
            Terms & Conditions
          </p>
          <ul>
            <li>
              Any Extra Charges (Remote Area Charges, Pickup Charges, etc) would
              be charged extra.
            </li>
            <li>
              If the consignment is lost or damaged in transit by Kargo Onee
              Company, the maximum claim payable by Kargo Onee Company will be
              Rs. 100/- per kg or Rs. 5,000, whichever is lower.
            </li>
            <li>
              Kargo Onee Company will not be responsible for delayed delivery
              due to fire, accidents, riots, strikes, and natural calamities,
              flight delay, offloading of cargo, airlines space problem,
              airlines bagging mis-routing, customs process delay, lockdown,
              war, civil war, disturbed area.
            </li>
            <li>No claim would be accepted after 48 hours of delivery.</li>
            <li>
              The consignor is responsible for all the consequences if any
              incorrect/false declaration is given.
            </li>
            <li>
              Any dispute, controversy, or claim arising out of this shipment
              shall be subject to the jurisdiction of courts in Mumbai only,
              irrespective of the place of origin, payment, and destination of
              the consignment.
            </li>
            <li>
              The consignments handed over to Kargo Onee Company do not violate
              the rules and regulations of the Post & Telegraph Department and
              IATA under the Geneva Convention.
            </li>
            <li>
              No delivery time is given or committed for shipments booked for
              economy services.
            </li>
            <li>
              Kargo Onee Company is not responsible for any duties/penalties or
              charges applied to any shipment by any government authorities of
              the destination country.
            </li>
          </ul>
        </div>

        <div className="bg-gray-50 p-1 print:hidden">
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
    <div className="border border-gray-200 rounded p-4 py-1">
      <p className="font-semibold text-[#E31E24]">{data?.name}</p>
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
