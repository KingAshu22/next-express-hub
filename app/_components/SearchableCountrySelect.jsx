"use client";

import * as React from "react";
import { Check, ChevronsUpDown } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Countries as ImportedCountries } from "@/app/constants/country";

// Fallback countries list in case the import fails or is empty
const fallbackCountries = [
  "United States",
  "Canada",
  "United Kingdom",
  "Australia",
  "Germany",
  "France",
  "Japan",
  "India",
  "Brazil",
  "South Africa",
];

// Use imported countries if available, otherwise use fallback
const Countries =
  Array.isArray(ImportedCountries) && ImportedCountries.length > 0
    ? ImportedCountries
    : fallbackCountries;

// Remove duplicates from Countries array
const uniqueCountries = [...new Set(Countries)];

export function SearchableCountrySelect({
  value,
  onChange,
  placeholder = "Select country",
  countries = fallbackCountries, // Use the provided countries or fallback to the default list
}) {
  const [open, setOpen] = React.useState(false);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between"
        >
          {value
            ? uniqueCountries.find((country) => country === value) ||
              placeholder
            : placeholder}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0">
        <Command>
          <CommandInput placeholder="Search country..." />
          <CommandEmpty>No country found.</CommandEmpty>
          <CommandGroup className="max-h-64 overflow-y-auto">
            {uniqueCountries.map((country, index) => (
              <CommandItem
                key={`${country}-${index}`}
                onSelect={() => {
                  onChange(country);
                  setOpen(false);
                }}
              >
                <Check
                  className={cn(
                    "mr-2 h-4 w-4",
                    value === country ? "opacity-100" : "opacity-0"
                  )}
                />
                {country}
              </CommandItem>
            ))}
          </CommandGroup>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
