# Shipping concepts

## Modes

- Parcel: individually handled packages with dimensions and weight.
- LTL: palletized or large freight that normally requires freight class, handling-unit details, and origin/destination facility types.

Do not convert between modes merely because one returns no rates.

## Identifiers

- Quote ID identifies the complete rate request.
- Rate ID identifies the selected carrier/service result within a quote.
- Shipment or booking ID identifies the Shippeek operational record.
- PRO or tracking number identifies the carrier movement.
- Idempotency key identifies one intended state-changing operation across retries.

Preserve identifiers in the customer's order or fulfillment record. Do not expose provider-private account identifiers.

## Booking checks

Before booking, verify the quote is fresh, the carrier and service match the user's selection, addresses and contacts are complete, pickup intent is explicit, and any price or address correction has been accepted. Never assume insurance, hazmat, customs, liftgate, residential, appointment, or inside-delivery requirements.
