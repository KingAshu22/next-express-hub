'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover";
import {
  Command,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
} from "@/components/ui/command";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { ChevronsUpDown, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { Countries } from "@/app/constants/country";

export default function CreateEstimate() {
  const [formData, setFormData] = useState({
    code: '',
    date: '',
    name: '',
    address: '',
    city: '',
    zipCode: '',
    country: '',
    receiverCity: '',
    receiverCountry: '',
    awbNumber: '',
    forwardingNumber: '',
    forwardingLink: '',
    weight: '',
    rate: '',
    discount: '0',
  });
  const [loading, setLoading] = useState(false);
  const [countryOpen, setCountryOpen] = useState(false);
  const [receiverCountryOpen, setReceiverCountryOpen] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const fetchNextCode = async () => {
      const res = await fetch('/api/get-last-estimate');
      const { code } = await res.json();
      setFormData((prev) => ({ ...prev, code }));
    };
    fetchNextCode();
  }, []);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleCountrySelect = (value) => {
    setFormData(prev => ({
      ...prev,
      country: value
    }));
    setCountryOpen(false);
  };

  const handleReceiverCountrySelect = (value) => {
    setFormData(prev => ({
      ...prev,
      receiverCountry: value
    }));
    setReceiverCountryOpen(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const weight = parseFloat(formData.weight) || 0;
    const rate = parseFloat(formData.rate) || 0;
    const discount = parseFloat(formData.discount) || 0;
    const subtotal = weight * rate;
    const total = subtotal - discount;

    const payload = {
      ...formData,
      weight,
      rate,
      discount,
      subtotal,
      total,
      date: new Date(formData.date),
    };

    const res = await fetch('/api/estimate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (res.ok) {
      router.push('/estimate');
    } else {
      alert('Failed to create estimate');
    }
    setLoading(false);
  };

  return (
    <div className="p-6 max-w-lg mx-auto">
      <h1 className="text-2xl font-bold mb-6">Create New Estimate</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Code */}
        <div>
          <label className="block mb-1">Code</label>
          <input
            type="text"
            name="code"
            value={formData.code}
            readOnly
            className="w-full p-2 border rounded bg-gray-100"
          />
        </div>

        {/* Date */}
        <div>
          <label className="block mb-1">Date</label>
          <input
            type="date"
            name="date"
            value={formData.date}
            onChange={handleChange}
            required
            className="w-full p-2 border rounded"
          />
        </div>

        {/* Name */}
        <div>
          <label className="block mb-1">Name</label>
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleChange}
            required
            className="w-full p-2 border rounded"
          />
        </div>

        {/* Address */}
        <div>
          <label className="block mb-1">Address</label>
          <input
            type="text"
            name="address"
            value={formData.address}
            onChange={handleChange}
            className="w-full p-2 border rounded"
          />
        </div>

        {/* City & Zip */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block mb-1">City</label>
            <input
              type="text"
              name="city"
              value={formData.city}
              onChange={handleChange}
              className="w-full p-2 border rounded"
            />
          </div>
          <div>
            <label className="block mb-1">Zip Code</label>
            <input
              type="text"
              name="zipCode"
              value={formData.zipCode}
              onChange={handleChange}
              className="w-full p-2 border rounded"
            />
          </div>
        </div>

        {/* Country Dropdown */}
        <div className="space-y-1">
          <Label htmlFor="country" className="text-sm">Country*</Label>
          <Popover open={countryOpen} onOpenChange={setCountryOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                role="combobox"
                aria-expanded={countryOpen}
                className="w-full justify-between h-10 text-sm bg-white"
              >
                {formData.country || "Select country..."}
                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-full p-0 max-h-60">
              <Command>
                <CommandInput placeholder="Search country..." className="text-sm h-9" />
                <CommandList>
                  <CommandEmpty className="text-sm py-2 px-4">No country found.</CommandEmpty>
                  <CommandGroup>
                    {Countries.map((country) => (
                      <CommandItem
                        key={country}
                        value={country}
                        onSelect={() => handleCountrySelect(country)}
                        className="text-sm"
                      >
                        <Check
                          className={cn(
                            "mr-2 h-4 w-4",
                            formData.country === country ? "opacity-100" : "opacity-0"
                          )}
                        />
                        {country}
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
        </div>

        {/* Receiver City */}
        <div>
          <label className="block mb-1">Receiver City</label>
          <input
            type="text"
            name="receiverCity"
            value={formData.receiverCity}
            onChange={handleChange}
            className="w-full p-2 border rounded"
          />
        </div>

        {/* Receiver Country Dropdown */}
        <div className="space-y-1">
          <Label htmlFor="receiverCountry" className="text-sm">Receiver Country*</Label>
          <Popover open={receiverCountryOpen} onOpenChange={setReceiverCountryOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                role="combobox"
                aria-expanded={receiverCountryOpen}
                className="w-full justify-between h-10 text-sm bg-white"
              >
                {formData.receiverCountry || "Select receiver country..."}
                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-full p-0 max-h-60">
              <Command>
                <CommandInput placeholder="Search country..." className="text-sm h-9" />
                <CommandList>
                  <CommandEmpty className="text-sm py-2 px-4">No country found.</CommandEmpty>
                  <CommandGroup>
                    {Countries.map((country) => (
                      <CommandItem
                        key={country}
                        value={country}
                        onSelect={() => handleReceiverCountrySelect(country)}
                        className="text-sm"
                      >
                        <Check
                          className={cn(
                            "mr-2 h-4 w-4",
                            formData.receiverCountry === country ? "opacity-100" : "opacity-0"
                          )}
                        />
                        {country}
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
        </div>

        {/* AWB Number */}
        <div>
          <label className="block mb-1">AWB Number</label>
          <input
            type="text"
            name="awbNumber"
            value={formData.awbNumber}
            onChange={handleChange}
            className="w-full p-2 border rounded"
          />
        </div>

        {/* Forwarding Number */}
        <div>
          <label className="block mb-1">Forwarding Number</label>
          <input
            type="text"
            name="forwardingNumber"
            value={formData.forwardingNumber}
            onChange={handleChange}
            className="w-full p-2 border rounded"
          />
        </div>

        {/* Forwarding Link */}
        <div>
          <label className="block mb-1">Forwarding Link</label>
          <input
            type="text"
            name="forwardingLink"
            value={formData.forwardingLink}
            onChange={handleChange}
            className="w-full p-2 border rounded"
          />
        </div>

        {/* Weight */}
        <div>
          <label className="block mb-1">Weight (kg)</label>
          <input
            type="number"
            step="0.01"
            name="weight"
            value={formData.weight}
            onChange={handleChange}
            required
            className="w-full p-2 border rounded"
          />
        </div>

        {/* Rate */}
        <div>
          <label className="block mb-1">Rate (₹/kg)</label>
          <input
            type="number"
            step="0.01"
            name="rate"
            value={formData.rate}
            onChange={handleChange}
            required
            className="w-full p-2 border rounded"
          />
        </div>

        {/* Discount */}
        <div>
          <label className="block mb-1">Discount (₹)</label>
          <input
            type="number"
            step="0.01"
            name="discount"
            value={formData.discount}
            onChange={handleChange}
            className="w-full p-2 border rounded"
          />
        </div>

        {/* Auto-calculated subtotal & total */}
        <div className="p-3 border rounded bg-gray-50 space-y-1 text-sm">
          <p>Subtotal: <strong>{(parseFloat(formData.weight || '0') * parseFloat(formData.rate || '0')).toFixed(2)}</strong></p>
          <p>Total (after discount): <strong>{((parseFloat(formData.weight || '0') * parseFloat(formData.rate || '0')) - parseFloat(formData.discount || '0')).toFixed(2)}</strong></p>
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={loading}
          className="w-full py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? 'Creating...' : 'Create Estimate'}
        </button>
      </form>
    </div>
  );
}
