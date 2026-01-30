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
  const [touched, setTouched] = useState({
    total: false,
    ppc: false,
    carats: false,
    markup: false,
  });

  // Validation using proper string-based validators
  const totalError = touched.total
    ? validateNumber(totalPrice, { min: 0, max: 1000000, label: 'Total price' })
    : null;
  const ppcError = touched.ppc
    ? validateNumber(pricePerCarat, { min: 0, max: 1000000, label: 'Price per carat' })
    : null;
  const caratsError = touched.carats
    ? validateNumber(carats, { positive: true, min: 0.01, max: 1000, label: 'Carats' })
    : null;
  const markupError = touched.markup
    ? validateNumber(markup, { min: -100, max: 1000, label: 'Markup' })
    : null;

  const totalNum = parseFloat(totalPrice);
  const ppcNum = parseFloat(pricePerCarat);
  const caratsNum = parseFloat(carats);
  const markupNum = parseFloat(markup);

  const isValidTotal = !totalError && !isNaN(totalNum) && totalNum >= 0;
  const isValidPpc = !ppcError && !isNaN(ppcNum) && ppcNum >= 0;
  const isValidCarats = !caratsError && !isNaN(caratsNum) && caratsNum > 0;
  const isValidMarkup = !markupError && !isNaN(markupNum);

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
            onBlur={() => setTouched(t => ({ ...t, total: true }))}
            aria-invalid={!!totalError}
            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-crystal-500 focus:border-crystal-500 ${totalError ? 'border-red-300' : 'border-slate-300'}`}
            placeholder="e.g., 5000"
          />
          <ValidationMessage message={totalError || ''} visible={!!totalError} />
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
            onBlur={() => setTouched(t => ({ ...t, ppc: true }))}
            aria-invalid={!!ppcError}
            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-crystal-500 focus:border-crystal-500 ${ppcError ? 'border-red-300' : 'border-slate-300'}`}
            placeholder="e.g., 10000"
          />
          <ValidationMessage message={ppcError || ''} visible={!!ppcError} />
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
            onBlur={() => setTouched(t => ({ ...t, carats: true }))}
            aria-invalid={!!caratsError}
            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-crystal-500 focus:border-crystal-500 ${caratsError ? 'border-red-300' : 'border-slate-300'}`}
            placeholder="e.g., 0.50"
          />
          <ValidationMessage message={caratsError || ''} visible={!!caratsError} />
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
          onBlur={() => setTouched(t => ({ ...t, markup: true }))}
          aria-invalid={!!markupError}
          className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-crystal-500 focus:border-crystal-500 ${markupError ? 'border-red-300' : 'border-slate-300'}`}
          placeholder="e.g., 30 (or -10 for discount)"
        />
        <p className="text-xs text-slate-500 mt-1">
          Positive for retail markup, negative for discount
        </p>
        <ValidationMessage message={markupError || ''} visible={!!markupError} />
      </div>

      {/* Hint when inputs are incomplete but no errors */}
      {(totalPrice || pricePerCarat || carats) &&
        calculatedTotal === null && calculatedPpc === null && calculatedCarats === null &&
        !totalError && !ppcError && !caratsError && (
        <div className="p-3 rounded-lg bg-amber-50 border border-amber-200 text-amber-700 text-sm">
          Enter any two of: Total Price, Price per Carat, or Carats to calculate the third.
        </div>
      )}

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
