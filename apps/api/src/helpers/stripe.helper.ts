import Stripe from 'stripe';

// Initialize Stripe with your secret key
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2025-05-28.basil',
});

export interface StripeServiceData {
  name: string;
  description?: string;
  price: number;
  currency?: string;
}

/**
 * Create a Stripe product and two prices (full and 50% advance) for a service
 */
export async function createServiceProduct(serviceData: StripeServiceData) {
  try {
    // Create the product
    const product = await stripe.products.create({
      name: serviceData.name,
      description: serviceData.description,
      metadata: {
        type: 'service',
      },
    });

    // Create the full price (in cents for MXN)
    const fullPrice = await stripe.prices.create({
      product: product.id,
      unit_amount: Math.round(serviceData.price * 100), // Convert to cents
      currency: serviceData.currency || 'mxn',
      // One-time payment (no recurring)
    });

    // Create the 50% advance price (in cents for MXN)
    const advancePrice = await stripe.prices.create({
      product: product.id,
      unit_amount: Math.round(serviceData.price * 100 * 0.5), // 50% in cents
      currency: serviceData.currency || 'mxn',
      // One-time payment (no recurring)
    });

    return {
      productId: product.id,
      priceId: fullPrice.id,
      advancePriceId: advancePrice.id,
    };
  } catch (error) {
    console.error('Error creating Stripe product/prices:', error);
    throw new Error('Failed to create Stripe product and prices');
  }
}

/**
 * Update a Stripe product
 */
export async function updateServiceProduct(
  productId: string,
  serviceData: Partial<StripeServiceData>
) {
  try {
    const updateData: any = {};
    
    if (serviceData.name) updateData.name = serviceData.name;
    if (serviceData.description) updateData.description = serviceData.description;

    const product = await stripe.products.update(productId, updateData);
    return product;
  } catch (error) {
    console.error('Error updating Stripe product:', error);
    throw new Error('Failed to update Stripe product');
  }
}

/**
 * Create a new price for an existing product
 */
export async function createNewPrice(
  productId: string,
  price: number,
  currency: string = 'mxn'
) {
  try {
    const newPrice = await stripe.prices.create({
      product: productId,
      unit_amount: Math.round(price * 100), // Convert to cents
      currency: currency,
      // One-time payment (no recurring)
    });

    return newPrice;
  } catch (error) {
    console.error('Error creating new Stripe price:', error);
    throw new Error('Failed to create new Stripe price');
  }
}

/**
 * Archive a Stripe price (mark as inactive)
 */
export async function archivePrice(priceId: string) {
  try {
    const price = await stripe.prices.update(priceId, {
      active: false,
    });
    return price;
  } catch (error) {
    console.error('Error archiving Stripe price:', error);
    throw new Error('Failed to archive Stripe price');
  }
}

/**
 * Delete a Stripe product (only if no active prices)
 */
export async function deleteProduct(productId: string) {
  try {
    const product = await stripe.products.del(productId);
    return product;
  } catch (error) {
    console.error('Error deleting Stripe product:', error);
    throw new Error('Failed to delete Stripe product');
  }
}

/**
 * Get product and price information
 */
export async function getProductInfo(productId: string) {
  try {
    const product = await stripe.products.retrieve(productId);
    return product;
  } catch (error) {
    console.error('Error retrieving Stripe product:', error);
    throw new Error('Failed to retrieve Stripe product');
  }
}

/**
 * Get price information
 */
export async function getPriceInfo(priceId: string) {
  try {
    const price = await stripe.prices.retrieve(priceId);
    return price;
  } catch (error) {
    console.error('Error retrieving Stripe price:', error);
    throw new Error('Failed to retrieve Stripe price');
  }
} 