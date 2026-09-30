import React, { useState } from 'react';
import { MaterialScore, PackagingMaterial } from '../types/packaging';
import { PACKAGING_MATERIALS } from '../data/materials';
import { X, Check, Minus, Plus } from 'lucide-react';

interface CompareModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMaterialScores: MaterialScore[];
}

export const CompareModal: React.FC<CompareModalProps> = ({
  isOpen,
  onClose,
  initialMaterialScores
}) => {
  if (!isOpen) return null;

  // Selected material IDs (up to 3)
  const [selectedIds, setSelectedIds] = useState<string[]>(() => {
    return initialMaterialScores.slice(0, 3).map((m) => m.material.id);
  });

  const toggleMaterial = (id: string) => {
    if (selectedIds.includes(id)) {
      if (selectedIds.length > 1) {
        setSelectedIds(selectedIds.filter((item) => item !== id));
      }
    } else {
      if (selectedIds.length < 3) {
        setSelectedIds([...selectedIds, id]);
      }
    }
  };

  const selectedMaterials = selectedIds
    .map((id) => {
      const scored = initialMaterialScores.find((m) => m.material.id === id);
      const raw = PACKAGING_MATERIALS.find((m) => m.id === id);
      return {
        material: scored ? scored.material : raw!,
        compatibility: scored ? scored.compatibility : null
      };
    })
    .filter((m) => Boolean(m.material));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div>
            <h2 className="text-base font-extrabold text-slate-900">Compare Packaging Materials</h2>
            <p className="text-xs text-slate-500">
              Select up to 3 materials to compare multi-criteria barrier and physical metrics
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Material Selection Chips */}
        <div className="p-3 border-b border-slate-100 bg-white">
          <span className="text-[11px] font-bold uppercase text-slate-400 block mb-2">
            Available Candidates (Select 2 to 3):
          </span>
          <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto pr-1">
            {PACKAGING_MATERIALS.map((mat) => {
              const isSelected = selectedIds.includes(mat.id);
              const scored = initialMaterialScores.find((m) => m.material.id === mat.id);
              return (
                <button
                  key={mat.id}
                  onClick={() => toggleMaterial(mat.id)}
                  className={`text-xs px-2.5 py-1 rounded-lg border font-medium flex items-center gap-1.5 transition-all ${
                    isSelected
                      ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                      : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  <span>{mat.shortName}</span>
                  {scored && (
                    <span
                      className={`text-[10px] font-bold px-1 rounded ${
                        isSelected ? 'bg-emerald-700 text-white' : 'bg-slate-200 text-slate-700'
                      }`}
                    >
                      {scored.compatibility}%
                    </span>
                  )}
                  {isSelected && <Check className="w-3 h-3" />}
                </button>
              );
            })}
          </div>
        </div>

        {/* Comparison Table */}
        <div className="p-4 overflow-x-auto flex-1">
          <table className="w-full text-xs text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200">
                <th className="py-2.5 px-3 font-bold text-slate-500 bg-slate-50/50 w-32">Metric</th>
                {selectedMaterials.map(({ material, compatibility }) => (
                  <th key={material.id} className="py-2.5 px-3 font-bold text-slate-900 min-w-36">
                    <div>{material.shortName}</div>
                    {compatibility !== null && (
                      <span className="inline-block mt-0.5 text-[11px] font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">
                        {compatibility}% Match
                      </span>
                    )}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              <tr>
                <td className="py-2.5 px-3 font-semibold text-slate-500 bg-slate-50/50">Category</td>
                {selectedMaterials.map(({ material }) => (
                  <td key={material.id} className="py-2.5 px-3 font-medium">
                    {material.category}
                  </td>
                ))}
              </tr>

              <tr>
                <td className="py-2.5 px-3 font-semibold text-slate-500 bg-slate-50/50">
                  Moisture Barrier (WVTR)
                </td>
                {selectedMaterials.map(({ material }) => (
                  <td key={material.id} className="py-2.5 px-3">
                    <span className="font-bold text-slate-900">{material.wvtr}</span>
                    <span className="text-[10px] text-slate-400 block">g/(m²·day)</span>
                    <span className="text-[10px] text-emerald-700 font-semibold">{material.moistureBarrier} barrier</span>
                  </td>
                ))}
              </tr>

              <tr>
                <td className="py-2.5 px-3 font-semibold text-slate-500 bg-slate-50/50">
                  Oxygen Barrier (OTR)
                </td>
                {selectedMaterials.map(({ material }) => (
                  <td key={material.id} className="py-2.5 px-3">
                    <span className="font-bold text-slate-900">{material.otr}</span>
                    <span className="text-[10px] text-slate-400 block">cc/(m²·day·atm)</span>
                    <span className="text-[10px] text-emerald-700 font-semibold">{material.oxygenBarrier} barrier</span>
                  </td>
                ))}
              </tr>

              <tr>
                <td className="py-2.5 px-3 font-semibold text-slate-500 bg-slate-50/50">
                  Oil / Fat Resistance
                </td>
                {selectedMaterials.map(({ material }) => (
                  <td key={material.id} className="py-2.5 px-3 font-medium">
                    {material.oilFatResistance}
                  </td>
                ))}
              </tr>

              <tr>
                <td className="py-2.5 px-3 font-semibold text-slate-500 bg-slate-50/50">
                  Glass Transition (Tg)
                </td>
                {selectedMaterials.map(({ material }) => (
                  <td key={material.id} className="py-2.5 px-3 font-medium">
                    {material.thermalTg}°C
                    <span className="text-[10px] text-slate-400 block">
                      {material.thermalTg <= 0 ? 'Sub-zero flexible' : 'Rigid amorphous'}
                    </span>
                  </td>
                ))}
              </tr>

              <tr>
                <td className="py-2.5 px-3 font-semibold text-slate-500 bg-slate-50/50">
                  Fresh Produce Fit
                </td>
                {selectedMaterials.map(({ material }) => (
                  <td key={material.id} className="py-2.5 px-3 font-bold">
                    <span
                      className={
                        material.freshProduceSuitability >= 80
                          ? 'text-emerald-700'
                          : material.freshProduceSuitability >= 50
                          ? 'text-amber-700'
                          : 'text-red-600'
                      }
                    >
                      {material.freshProduceSuitability}%
                    </span>
                  </td>
                ))}
              </tr>

              <tr>
                <td className="py-2.5 px-3 font-semibold text-slate-500 bg-slate-50/50">
                  Sustainability
                </td>
                {selectedMaterials.map(({ material }) => (
                  <td key={material.id} className="py-2.5 px-3">
                    <span
                      className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-bold ${
                        material.sustainability === 'Bio-compostable'
                          ? 'bg-emerald-100 text-emerald-800'
                          : material.sustainability === 'High'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      {material.sustainability}
                    </span>
                  </td>
                ))}
              </tr>

              <tr>
                <td className="py-2.5 px-3 font-semibold text-slate-500 bg-slate-50/50">
                  Relative Cost
                </td>
                {selectedMaterials.map(({ material }) => (
                  <td key={material.id} className="py-2.5 px-3 font-bold text-slate-800">
                    {material.relativeCost}
                  </td>
                ))}
              </tr>

              <tr>
                <td className="py-2.5 px-3 font-semibold text-slate-500 bg-slate-50/50">
                  Anti-Fog / MAP Capable
                </td>
                {selectedMaterials.map(({ material }) => (
                  <td key={material.id} className="py-2.5 px-3">
                    <span className="text-[11px] block">
                      Anti-Fog: {material.antiFogCapable ? 'Yes' : 'No'}
                    </span>
                    <span className="text-[11px] block text-slate-500">
                      MAP Gas Flush: {material.gasFlushingMAPCapable ? 'Yes' : 'No'}
                    </span>
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-slate-200 bg-slate-50 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-900 text-white text-xs font-semibold transition-colors"
          >
            Close Comparison
          </button>
        </div>
      </div>
    </div>
  );
};
