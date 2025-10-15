import { Card } from "@/components/ui/card"
import { MapPin, Package, User, DollarSign } from "lucide-react"

export default function ShipmentDetails({ awbData }) {
  return (
    <div className="space-y-4">
      {/* Sender Info */}
      <Card className="bg-slate-800 border-slate-700 p-4">
        <div className="flex items-start gap-3 mb-3">
          <User className="w-5 h-5 text-blue-400 flex-shrink-0 mt-1" />
          <div className="flex-1">
            <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wide mb-2">Sender</h3>
            <div className="space-y-1">
              <p className="text-white font-medium">{awbData.sender?.name}</p>
              <p className="text-slate-400 text-sm">{awbData.sender?.address}</p>
              <p className="text-slate-400 text-sm">
                {awbData.sender?.city}, {awbData.sender?.zip}
              </p>
              <p className="text-slate-400 text-sm">{awbData.sender?.contact}</p>
            </div>
          </div>
        </div>
      </Card>

      {/* Receiver Info */}
      <Card className="bg-slate-800 border-slate-700 p-4">
        <div className="flex items-start gap-3 mb-3">
          <MapPin className="w-5 h-5 text-green-400 flex-shrink-0 mt-1" />
          <div className="flex-1">
            <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wide mb-2">Receiver</h3>
            <div className="space-y-1">
              <p className="text-white font-medium">{awbData.receiver?.name}</p>
              <p className="text-slate-400 text-sm">{awbData.receiver?.address}</p>
              <p className="text-slate-400 text-sm">
                {awbData.receiver?.city}, {awbData.receiver?.zip}
              </p>
              <p className="text-slate-400 text-sm">{awbData.receiver?.country}</p>
              <p className="text-slate-400 text-sm">{awbData.receiver?.contact}</p>
            </div>
          </div>
        </div>
      </Card>

      {/* Package Info */}
      <Card className="bg-slate-800 border-slate-700 p-4">
        <div className="flex items-start gap-3 mb-3">
          <Package className="w-5 h-5 text-amber-400 flex-shrink-0 mt-1" />
          <div className="flex-1">
            <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wide mb-3">Package Details</h3>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="text-xs text-slate-500 uppercase">Pieces</p>
                <p className="text-white font-medium">{awbData.boxes?.length || 0}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500 uppercase">Total Weight</p>
                <p className="text-white font-medium">
                  {awbData.boxes?.reduce((sum, box) => sum + Number.parseFloat(box.actualWeight || 0), 0).toFixed(2)} kg
                </p>
              </div>
            </div>
            {awbData.boxes && awbData.boxes.length > 0 && (
              <div className="mt-3 pt-3 border-t border-slate-700">
                <p className="text-xs text-slate-500 uppercase mb-2">Items</p>
                <div className="space-y-2">
                  {awbData.boxes.map((box, idx) => (
                    <div key={idx} className="text-sm">
                      <p className="text-slate-300 font-medium">Box {idx + 1}</p>
                      {box.items?.map((item, itemIdx) => (
                        <p key={itemIdx} className="text-slate-400 text-xs ml-2">
                          • {item.name} (Qty: {item.quantity})
                        </p>
                      ))}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </Card>

      {/* Rate Info */}
      {awbData.rateInfo && (
        <Card className="bg-slate-800 border-slate-700 p-4">
          <div className="flex items-start gap-3">
            <DollarSign className="w-5 h-5 text-purple-400 flex-shrink-0 mt-1" />
            <div className="flex-1">
              <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wide mb-3">Rate Information</h3>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-xs text-slate-500 uppercase">Courier</p>
                  <p className="text-white font-medium">{awbData.rateInfo.courier}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500 uppercase">Zone</p>
                  <p className="text-white font-medium">{awbData.rateInfo.zone}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500 uppercase">Base Charge</p>
                  <p className="text-white font-medium">₹{awbData.rateInfo.baseCharge}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500 uppercase">Total with GST</p>
                  <p className="text-white font-medium">₹{awbData.rateInfo.totalWithGST}</p>
                </div>
              </div>
            </div>
          </div>
        </Card>
      )}
    </div>
  )
}
