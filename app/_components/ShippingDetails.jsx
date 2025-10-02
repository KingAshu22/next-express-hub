import React from "react";

export default function ShippingDetails({ parcelDetails }) {
    if (!parcelDetails) return <p>Loading...</p>;

    const numberToWords = (num) => {
        const ones = ["", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine"];
        const tens = ["", "Ten", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];
        const teens = ["", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen", "Seventeen", "Eighteen", "Nineteen"];

        if (num === 0) return "Zero";
        let str = "";

        if (num >= 10000000) {
            str += numberToWords(Math.floor(num / 10000000)) + " Crore ";
            num %= 10000000;
        }
        if (num >= 100000) {
            str += numberToWords(Math.floor(num / 100000)) + " Lakh ";
            num %= 100000;
        }
        if (num >= 1000) {
            str += numberToWords(Math.floor(num / 1000)) + " Thousand ";
            num %= 1000;
        }
        if (num >= 100) {
            str += ones[Math.floor(num / 100)] + " Hundred ";
            num %= 100;
        }
        if (num >= 20) {
            str += tens[Math.floor(num / 10)] + " ";
            num %= 10;
        }
        if (num >= 11 && num <= 19) {
            str += teens[num - 10] + " ";
            num = 0;
        }
        if (num >= 1 && num <= 9) {
            str += ones[num] + " ";
        }

        return str.trim();
    };

    return (
        <div className="container mt-4">
            <button className="btn btn-primary mb-3" onClick={() => window.print()}>
                Print
            </button>
            <div className="border p-3">
                <h2 className="text-center">Invoice</h2>

                {/* Invoice Details */}
                <table className="table table-bordered">
                    <tbody>
                        <tr>
                            <td>Date: {new Date(parcelDetails.date).toLocaleDateString()}</td>
                            <td>EXP. REF- {parcelDetails.trackingNumber}</td>
                        </tr>
                        <tr>
                            <td>Country of Origin: {parcelDetails.sender?.country || "N/A"}</td>
                            <td>Country of Final Destination: {parcelDetails.receiver?.country || "N/A"}</td>
                        </tr>
                    </tbody>
                </table>

                {/* Sender & Receiver */}
                <table className="table table-bordered">
                    <tbody>
                        <tr>
                            <td style={{ width: "50%" }}>
                                <strong>Sender:</strong> <br />
                                {parcelDetails.sender?.name} <br />
                                {parcelDetails.sender?.address}, {parcelDetails.sender?.zip}, {parcelDetails.sender?.country}
                                <br />
                                Contact No: {parcelDetails.sender?.contact} <br />
                                {parcelDetails.sender?.kyc?.type} {parcelDetails.sender?.kyc?.kyc}
                            </td>
                            <td style={{ width: "50%" }}>
                                <strong>Receiver:</strong> <br />
                                {parcelDetails.receiver?.name} <br />
                                {parcelDetails.receiver?.address}, {parcelDetails.receiver?.zip}, {parcelDetails.receiver?.country}
                                <br />
                                Contact No: {parcelDetails.receiver?.contact}
                            </td>
                        </tr>
                    </tbody>
                </table>

                {/* Goods Description */}
                <table className="table table-bordered">
                    <thead>
                        <tr>
                            <th>Box.No</th>
                            <th>Description of Goods</th>
                            <th>Quantity</th>
                            <th>Rate</th>
                            <th>Value</th>
                        </tr>
                    </thead>
                    <tbody>
                        {parcelDetails.boxes?.length > 0 ? (
                            parcelDetails.boxes.map((box, index) => (
                                <tr key={index}>
                                    <td>{box.boxNumber || "N/A"}</td>
                                    <td>
                                        {box.packets?.length > 0
                                            ? box.packets.map((desc, i) => <div key={i}>{desc.description}</div>)
                                            : "N/A"}
                                    </td>
                                    <td>
                                        {box.packets?.length > 0
                                            ? box.packets.map((desc, i) => <div key={i}>{desc.quantity}</div>)
                                            : "N/A"}
                                    </td>
                                    <td>
                                        {box.packets?.length > 0
                                            ? box.packets.map((desc, i) => <div key={i}>{desc.rate}</div>)
                                            : "N/A"}
                                    </td>
                                    <td>
                                        {box.packets?.length > 0
                                            ? box.packets.map((desc, i) => <div key={i}>{desc.price}</div>)
                                            : "N/A"}
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan="5" className="text-center">
                                    No items available
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>

                {/* Total Amount */}
                <table className="table table-bordered">
                    <tbody>
                        <tr>
                            <td style={{ width: "86.5%" }}>
                                <strong>Total Amount in INR:</strong>
                            </td>
                            <td>
                                <strong>&#8377; {parcelDetails.parcelValue}</strong>
                            </td>
                        </tr>
                        <tr>
                            <td colSpan="2">
                                <strong>In Words:</strong> {numberToWords(parcelDetails.parcelValue)} Rupees Only
                            </td>
                        </tr>
                    </tbody>
                </table>

                {/* Signature Section */}
                <table className="table table-bordered">
                    <tbody>
                        <tr>
                            <td>
                                We certify that the information given above is true and correct to the best of our knowledge.
                            </td>
                        </tr>
                        <tr>
                            <td className="text-end pt-4">Signature & Date</td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>
    );
}
