/**
 * Price Per Carat Converter
 * Calculate total price from price per carat and vice versa
 */

import { useMemo, useState } from 'react';
import { validateNumber } from './ValidationMessage';
import { FormField, NumberInput } from '../form';
import { NumberResult, MultiValueResult } from './results';

export function PricePerCaratConverter() {
  const [totalPrice, setTotalPrice] = useState('');
  const [pricePerCarat, setPricePerCarat] = useState('');
  const [carats, setCarats] = useState('');
  const [markup, setMarkup] = useState('0');

  // Eager validation
  const totalError = totalPrice ? validateNumber(totalPrice, { min: 0, max: 1000000, label: 'Total price' }) : null;
  const ppcError = pricePerCarat ? validateNumber(pricePerCarat, { min: 0, max: 1000000, label: 'Price per carat' }) : null;
  const caratsError = carats ? validateNumber(carats, { positive: true, min: 0.01, max: 1000, label: 'Carats' }) : null;
  const markupError = markup ? validateNumber(markup, { min: -100, max: 1000, label: 'Markup' }) : null;

  const result = useMemo(() => {
    const totalNum = parseFloat(totalPrice);
    const ppcNum = parseFloat(pricePerCarat);
    const caratsNum = parseFloat(carats);
    const markupNum = parseFloat(markup) || 0;

    const isValidTotal = !totalError && !isNaN(totalNum) && totalNum >= 0;
    const isValidPpc = !ppcError && !isNaN(ppcNum) && ppcNum >= 0;
    const isValidCarats = !caratsError && !isNaN(caratsNum) && caratsNum > 0;
    const isValidMarkup = !markupError && !isNaN(markupNum);

    // Calculate missing values
    if (isValidPpc && isValidCarats) {
      const calculatedTotal = ppcNum * caratsNum;
      const retailPrice = isValidMarkup ? calculatedTotal * (1 + markupNum / 100) : null;
      return { type: 'total' as const, calculatedTotal, retailPrice, markupNum };
    }

    if (isValidTotal && isValidCarats && caratsNum > 0) {
      const calculatedPpc = totalNum / caratsNum;
      const retailPrice = isValidMarkup ? totalNum * (1 + markupNum / 100) : null;
      return { type: 'ppc' as const, calculatedPpc, retailPrice, markupNum, totalNum };
    }

    if (isValidTotal && isValidPpc && ppcNum > 0) {
      const calculatedCarats = totalNum / ppcNum;
      return { type: 'carats' as const, calculatedCarats };
    }

    return null;
  }, [totalPrice, pricePerCarat, carats, markup, totalError, ppcError, caratsError, markupError]);

  const hasAnyInput = totalPrice || pricePerCarat || carats;
  const needsMoreInput = hasAnyInput && !result && !totalError && !ppcError && !caratsError;

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
        <FormField name="total-price" label="Total Price" unit="$" error={totalError}>
          <NumberInput
            value={totalPrice}
            onChange={setTotalPrice}
            min={0}
            step={0.01}
            placeholder="e.g., 5000"
          />
        </FormField>

        <FormField name="price-per-carat" label="Price per Carat" unit="$/ct" error={ppcError}>
          <NumberInput
            value={pricePerCarat}
            onChange={setPricePerCarat}
            min={0}
            step={0.01}
            placeholder="e.g., 10000"
          />
        </FormField>

        <FormField name="carats" label="Carats" unit="ct" error={caratsError}>
          <NumberInput
            value={carats}
            onChange={setCarats}
            min={0}
            step={0.01}
            placeholder="e.g., 0.50"
          />
        </FormField>
      </div>

      <FormField
        name="markup"
        label="Markup / Discount"
        unit="%"
        error={markupError}
        hint="Positive for retail markup, negative for discount"
      >
        <NumberInput
          value={markup}
          onChange={setMarkup}
          step={1}
          placeholder="e.g., 30 (or -10 for discount)"
          allowNegative
        />
      </FormField>

      {needsMoreInput && (
        <div className="p-3 rounded-lg bg-amber-50 border border-amber-200 text-amber-700 text-sm">
          Enter any two of: Total Price, Price per Carat, or Carats to calculate the third.
        </div>
      )}

      {result?.type === 'total' && (
        <NumberResult
          value={result.calculatedTotal}
          precision={2}
          unit="$"
          unitPosition="before"
          label="Total Price"
          variant="emerald"
        />
      )}

      {result?.type === 'ppc' && (
        <NumberResult
          value={result.calculatedPpc}
          precision={2}
          unit="$/ct"
          label="Price per Carat"
          variant="sapphire"
        />
      )}

      {result?.type === 'carats' && (
        <NumberResult
          value={result.calculatedCarats}
          precision={3}
          unit="ct"
          label="Total Carats"
        />
      )}

      {result?.retailPrice !== undefined && result.retailPrice !== null && result.markupNum !== 0 && (
        <MultiValueResult
          results={[
            {
              value: result.retailPrice,
              precision: 2,
              unit: '$',
              label: result.markupNum > 0 ? `Retail Price (+${result.markupNum}%)` : `Discounted Price (${result.markupNum}%)`,
              primary: true,
            },
            {
              value: Math.abs(result.retailPrice - (result.type === 'total' ? result.calculatedTotal : result.totalNum!)),
              precision: 2,
              unit: '$',
              label: result.markupNum > 0 ? 'Markup Amount' : 'Discount Amount',
            },
          ]}
          variant="topaz"
          layout="horizontal"
        />
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
