import { formatToIndianNumber } from "@/lib/utils";
import React, { useState } from "react";

const SingleSearch = ({
    type,
    list,
    topList,
    selectedItem,
    setSelectedItem,
    showSearch = true,
    isOneLine = false,
    onInputChange, // New prop for input change callback
}) => {
    const [searchTerm, setSearchTerm] = useState("");

    const handleChange = (e) => {
        const value = e.target.value;
        setSearchTerm(value);
        if (onInputChange) {
            onInputChange(value); // Call the onInputChange prop
        }
    };

    const handleSelectItem = (item) => {
        setSelectedItem(item);
        setSearchTerm("");
    };

    const filteredItems = list?.filter(
        (item) =>
            item?.toLowerCase().includes(searchTerm.toLowerCase()) &&
            item !== selectedItem
    );

    return (
        <div>
            <div>
                {type && (
                    <label className="block text-sm font-medium text-gray-700 mb-1 capitalize">
                        {type}:
                    </label>
                )}
                <div className="flex flex-wrap">
                    {showSearch && selectedItem && (
                        <div className="bg-primary text-white px-3 py-1 m-1 rounded-full flex items-center capitalize text-sm">
                            {selectedItem}
                        </div>
                    )}
                    {!showSearch &&
                        topList?.map((item, index) => (
                            <button
                                type="button"
                                key={index}
                                onClick={() => handleSelectItem(item)}
                                className={[
                                    item === selectedItem
                                        ? "bg-primary text-white px-3 py-1 m-1 rounded-full flex items-center capitalize text-sm"
                                        : "bg-gray-200 text-gray-700 px-3 py-1 m-1 rounded-full hover:bg-gray-300 capitalize text-sm",
                                    isOneLine ? "w-screen" : "",
                                ].join(" ")}
                            >
                                {isOneLine
                                    ? formatToIndianNumber(parseInt(item.replace(/,/g, "")))
                                    : item}
                            </button>
                        ))}
                </div>
            </div>

            {showSearch && (
                <input
                    type="text"
                    value={searchTerm}
                    onChange={handleChange} // Updated handler
                    placeholder={`Search ${type}`}
                    className="w-full px-2 py-1 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
            )}
            {searchTerm && (
                <ul className="mt-2 border rounded-lg shadow-lg bg-white overflow-hidden">
                    {filteredItems.map((item, index) => (
                        <li
                            key={index}
                            onClick={() => handleSelectItem(item)}
                            className="px-4 py-2 cursor-pointer hover:bg-blue-100"
                        >
                            {item}
                        </li>
                    ))}
                </ul>
            )}

            <div className="mb-2">
                {showSearch && topList && (
                    <label className="block text-sm font-medium text-gray-400 mb-1">
                        Suggestions:
                    </label>
                )}
                <div className="flex flex-wrap">
                    {showSearch &&
                        topList?.map((item, index) => (
                            <button
                                type="button"
                                key={index}
                                onClick={() => handleSelectItem(item)}
                                className="bg-gray-200 text-gray-700 px-3 py-1 m-1 rounded-full hover:bg-gray-300"
                            >
                                {item}
                            </button>
                        ))}
                </div>
            </div>
        </div>
    );
};

export default SingleSearch;
