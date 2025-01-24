import React from "react";
import { X } from "lucide-react"; // Import close icon

const Modal = ({ isOpen, onClose, title, description, children }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-11/12 max-w-md mx-auto relative">
                {/* Close Button */}
                <button
                    className="absolute top-2 right-2 text-gray-600 hover:text-gray-900"
                    onClick={onClose}
                >
                    <X />
                </button>
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-bold">{title}</h2>
                </div>
                <p className="mb-4">{description}</p>
                <div>{children}</div>
            </div>
        </div>
    );
};

export default Modal;
