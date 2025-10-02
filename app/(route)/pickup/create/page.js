"use client"

import { useState } from "react"
import axios from "axios"
import { useRouter } from "next/navigation"

export default function CreatePickupPage() {
  const [formData, setFormData] = useState({
    date: "",
    pickupFrom: "",
    pickupClient: "",
    pickupLocation: "",
    pickupBoxes: [],
  })

  const [loading, setLoading] = useState(false)
  const router = useRouter()

  function handleChange(e) {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  function addBox() {
    const newBox = {
      boxNumber: formData.pickupBoxes.length + 1,
      items: [],
    }
    setFormData({
      ...formData,
      pickupBoxes: [...formData.pickupBoxes, newBox],
    })
  }

  function removeBox(boxIndex) {
    const updatedBoxes = formData.pickupBoxes.filter((_, index) => index !== boxIndex)
    // Renumber boxes
    const renumberedBoxes = updatedBoxes.map((box, index) => ({
      ...box,
      boxNumber: index + 1,
    }))
    setFormData({
      ...formData,
      pickupBoxes: renumberedBoxes,
    })
  }

  function addItemToBox(boxIndex) {
    const updatedBoxes = [...formData.pickupBoxes]
    updatedBoxes[boxIndex].items.push({ itemName: "", quantity: 1 })
    setFormData({
      ...formData,
      pickupBoxes: updatedBoxes,
    })
  }

  function removeItemFromBox(boxIndex, itemIndex) {
    const updatedBoxes = [...formData.pickupBoxes]
    updatedBoxes[boxIndex].items.splice(itemIndex, 1)
    setFormData({
      ...formData,
      pickupBoxes: updatedBoxes,
    })
  }

  function handleItemChange(boxIndex, itemIndex, field, value) {
    const updatedBoxes = [...formData.pickupBoxes]
    updatedBoxes[boxIndex].items[itemIndex][field] = value
    setFormData({
      ...formData,
      pickupBoxes: updatedBoxes,
    })
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setLoading(true)

    try {
      await axios.post("/api/pickup", formData)
      router.push("/pickup")
    } catch (error) {
      console.error("Error creating pickup:", error)
      alert("Failed to create pickup. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-md p-6">
        <h1 className="text-3xl font-bold mb-6 text-gray-800">Create New Pickup</h1>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Pickup Date *</label>
              <input
                type="date"
                name="date"
                value={formData.date}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Pickup From *</label>
              <input
                type="text"
                name="pickupFrom"
                value={formData.pickupFrom}
                onChange={handleChange}
                placeholder="Enter pickup source"
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Client Name *</label>
              <input
                type="text"
                name="pickupClient"
                value={formData.pickupClient}
                onChange={handleChange}
                placeholder="Enter client name"
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Pickup Location *</label>
              <input
                type="text"
                name="pickupLocation"
                value={formData.pickupLocation}
                onChange={handleChange}
                placeholder="Enter pickup location"
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Boxes Section */}
          <div className="border-t pt-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-semibold text-gray-800">Pickup Boxes</h3>
              <button
                type="button"
                onClick={addBox}
                className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md font-medium transition-colors"
              >
                Add Box
              </button>
            </div>

            {formData.pickupBoxes.length === 0 && (
              <p className="text-gray-500 text-center py-4">
                No boxes added yet. Click "Add Box" to start adding boxes.
              </p>
            )}

            {formData.pickupBoxes.map((box, boxIndex) => (
              <div key={boxIndex} className="bg-gray-50 p-4 rounded-lg mb-4">
                <div className="flex justify-between items-center mb-3">
                  <h4 className="text-lg font-medium text-gray-700">Box {box.boxNumber}</h4>
                  <button
                    type="button"
                    onClick={() => removeBox(boxIndex)}
                    className="text-red-600 hover:text-red-800 font-medium"
                  >
                    Remove Box
                  </button>
                </div>

                <div className="space-y-2">
                  {box.items.map((item, itemIndex) => (
                    <div key={itemIndex} className="flex gap-2">
                      <input
                        type="text"
                        value={item.itemName}
                        onChange={(e) => handleItemChange(boxIndex, itemIndex, "itemName", e.target.value)}
                        placeholder={`Item ${itemIndex + 1} name`}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      <input
                        type="number"
                        value={item.quantity}
                        onChange={(e) =>
                          handleItemChange(boxIndex, itemIndex, "quantity", Number.parseInt(e.target.value) || 1)
                        }
                        placeholder="Qty"
                        min="1"
                        className="w-20 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      <button
                        type="button"
                        onClick={() => removeItemFromBox(boxIndex, itemIndex)}
                        className="text-red-600 hover:text-red-800 px-2"
                      >
                        Remove
                      </button>
                    </div>
                  ))}

                  <button
                    type="button"
                    onClick={() => addItemToBox(boxIndex)}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded-md text-sm font-medium transition-colors"
                  >
                    Add Item
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Submit Buttons */}
          <div className="flex gap-4 pt-6">
            <button
              type="submit"
              disabled={loading}
              className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-6 py-2 rounded-md font-medium transition-colors"
            >
              {loading ? "Creating..." : "Create Pickup"}
            </button>
            <button
              type="button"
              onClick={() => router.push("/pickup")}
              className="bg-gray-500 hover:bg-gray-600 text-white px-6 py-2 rounded-md font-medium transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
