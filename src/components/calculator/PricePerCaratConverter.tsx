/**
 * Price Per Carat Converter
 * Calculate total price from price per carat and vice versa
 */

import { useState } from 'react';
import { ResultCard } from './ResultCard';
import { ValidationMessage, validateNumber } from './ValidationMessage';

export function PricePerCaratConverter() {
  const [totalPrice, setTotalPrice] = useState('');
  const [pricePerCarat, setPricePerCarat] = useState('');
  const [carats, setCarats] = useState('');
  const [markup, setMarkup] = useState('0');

  const totalNum = parseFloat(totalPrice);
  const ppcNum = parseFloat(pricePerCarat);
  const caratsNum = parseFloat(carats);
  const markupNum = parseFloat(markup);

  const isValidTotal = validateNumber(totalNum, 0, 1000000);
  const isValidPpc = validateNumber(ppcNum, 0, 1000000);
  const isValidCarats = validateNumber(caratsNum, 0.01, 1000);
  const isValidMarkup = validateNumber(markupNum, -100, 1000);

  // Calculate missing values
  let calculatedTotal: number | null = null;
  let calculatedPpc: number | null = null;
  let calculatedCarats: number | null = null;
  let retailPrice: number | null = null;

  if (isValidPpc && isValidCarats) {
    calculatedTotal = ppcNum * caratsNum;
    if (isValidMarkup) {
      retailPrice = calculatedTotal * (1 + markupNum / 100);
    }
  } else if (isValidTotal && isValidCarats && caratsNum > 0) {
    calculatedPpc = totalNum / caratsNum;
    if (isValidMarkup) {
      retailPrice = totalNum * (1 + markupNum / 100);
    }
  } else if (isValidTotal && isValidPpc && ppcNum > 0) {
    calculatedCarats = totalNum / ppcNum;
  }

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm text-slate-600">
          Convert between total price and price per carat. Optionally add markup percentage for retail calculations.
        </p>
        <p className="text-xs text-slate-500 mt-2">
          <strong>Formula:</strong> Total Price = Price per Carat × Carats
        </p>
      </div>

      <div className="grid md:grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Total Price ($)
          </label>
          <input
            type="number"
            step="0.01"
            min="0"
            value={totalPrice}
            onChange={(e) => setTotalPrice(e.target.value)}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-crystal-500 focus:border-crystal-500"
            placeholder="e.g., 5000"
          />
          <ValidationMessage value={totalNum} validator={(v) => validateNumber(v, 0, 1000000)} />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Price per Carat ($)
          </label>
          <input
            type="number"
            step="0.01"
            min="0"
            value={pricePerCarat}
            onChange={(e) => setPricePerCarat(e.target.value)}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-crystal-500 focus:border-crystal-500"
            placeholder="e.g., 10000"
          />
          <ValidationMessage value={ppcNum} validator={(v) => validateNumber(v, 0, 1000000)} />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Carats (ct)
          </label>
          <input
            type="number"
            step="0.01"
            min="0"
            value={carats}
            onChange={(e) => setCarats(e.target.value)}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-crystal-500 focus:border-crystal-500"
            placeholder="e.g., 0.50"
          />
          <ValidationMessage value={caratsNum} validator={(v) => validateNumber(v, 0.01, 1000)} />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-2">
          Markup / Discount (%)
        </label>
        <input
          type="number"
          step="1"
          value={markup}
          onChange={(e) => setMarkup(e.target.value)}
          className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-crystal-500 focus:border-crystal-500"
          placeholder="e.g., 30 (or -10 for discount)"
        />
        <p className="text-xs text-slate-500 mt-1">
          Positive for retail markup, negative for discount
        </p>
        <ValidationMessage value={markupNum} validator={(v) => validateNumber(v, -100, 1000)} />
      </div>

      {calculatedTotal !== null && (
        <ResultCard
          value={calculatedTotal.toFixed(2)}
          unit="$"
          label="Total Price"
          variant="emerald"
        />
      )}

      {calculatedPpc !== null && (
        <ResultCard
          value={calculatedPpc.toFixed(2)}
          unit="$/ct"
          label="Price per Carat"
          variant="sapphire"
        />
      )}

      {calculatedCarats !== null && (
        <ResultCard
          value={calculatedCarats.toFixed(3)}
          unit="ct"
          label="Total Carats"
          variant="crystal"
        />
      )}

      {retailPrice !== null && markupNum !== 0 && (
        <div className="p-4 rounded-lg bg-topaz-50 border border-topaz-200">
          <div className="text-sm font-semibold text-topaz-900 mb-1">
            {markupNum > 0 ? 'Retail Price' : 'Discounted Price'} ({markupNum > 0 ? '+' : ''}{markupNum}%)
          </div>
          <div className="text-2xl font-bold text-topaz-700">
            ${retailPrice.toFixed(2)}
          </div>
          <p className="text-xs text-topaz-700 mt-1">
            {markupNum > 0 ? 'Markup' : 'Discount'}: ${Math.abs(retailPrice - (calculatedTotal || 0)).toFixed(2)}
          </p>
        </div>
      )}

      <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
        <h4 className="text-sm font-semibold text-slate-900 mb-2">Pricing Examples</h4>
        <ul className="text-sm text-slate-600 space-y-1">
          <li>• 1.0ct diamond at $10,000/ct = $10,000 total</li>
          <li>• $5,000 sapphire ÷ 0.50ct = $10,000/ct</li>
          <li>• 30% retail markup on $5,000 = $6,500 retail</li>
          <li>• 10% trade discount on $5,000 = $4,500 net</li>
        </ul>
      </div>
    </div>
  );
}
