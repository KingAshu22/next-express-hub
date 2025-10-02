"use client";

import { useState, useEffect, use } from "react";
import axios from "axios";
import withAuth from "@/lib/withAuth";
import CustomerRegistrationForm from "@/app/_components/CustomerForm";

const EditCustomer = ({ params }) => {
    const { _id } = use(params);
    console.log("_id: " + _id);

    const [customer, setCustomer] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        console.log("Customer Data", customer);
    }, [customer]);

    useEffect(() => {
        const fetchCustomer = async () => {
            console.log(`Customer fetching data ${_id}`);
            try {
                const response = await axios.get(
                    `/api/customer/${_id}`
                );
                const data = response.data;
                setCustomer(data);
                setLoading(false);
            } catch (err) {
                setError("Failed to fetch Customer data");
                setLoading(false);
            }
        };

        fetchCustomer();
    }, []);

    if (loading) return <div className="text-center mt-8">Loading...</div>;
    if (error)
        return <div className="text-center mt-8 text-[#E31E24]">{error}</div>;

    return (
        <div className="min-h-screen flex items-center justify-center">
            <CustomerRegistrationForm isEdit={true} customer={customer} />
        </div>
    );
};

export default withAuth(EditCustomer);
