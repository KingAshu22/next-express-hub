import React, { useState } from "react";

const SearchList = ({
    type,
    list,
    topList,
    selectedItems,
    setSelectedItems,
}) => {
    const [searchTerm, setSearchTerm] = useState("");

    const handleChange = (e) => {
        setSearchTerm(e.target.value);
    };

    const handleSelectItem = (item) => {
        if (!selectedItems.includes(item)) {
            setSelectedItems([...selectedItems, item]);
        }
        setSearchTerm("");
    };

    const handleRemoveItem = (itemToRemove) => {
        setSelectedItems(selectedItems.filter((item) => item !== itemToRemove));
    };

    const filteredItems = list.filter(
        (item) =>
            item.toLowerCase().includes(searchTerm.toLowerCase()) &&
            !selectedItems.includes(item)
    );

    const filteredTopItems = topList.filter(
        (item) => !selectedItems.includes(item)
    );

    return (
        <div className="mt-4">
            <div className="mb-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                    Selected {type}:
                </label>
                <div className="flex flex-wrap">
                    {selectedItems.map((item, index) => (
                        <div
                            key={index}
                            className="bg-primary text-white px-3 py-1 m-1 rounded-full flex items-center"
                        >
                            {item}
                            <button
                                type="button"
                                className="ml-2 text-white hover:text-gray-300"
                                onClick={() => handleRemoveItem(item)}
                            >
                                &times;
                            </button>
                        </div>
                    ))}
                </div>
            </div>

            <input
                type="text"
                value={searchTerm}
                onChange={handleChange}
                placeholder={`Search for your ${type}`}
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
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
                <label className="block text-sm font-medium text-gray-400 mb-1">
                    Suggestions:
                </label>
                <div className="flex flex-wrap">
                    {filteredTopItems.map((item, index) => (
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

export default SearchList;
