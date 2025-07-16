import type { Context } from 'hono';
import { getDatabase } from '../db/connection.js';
import { services } from '../db/schema.js';
import { eq } from 'drizzle-orm';
import type { Service } from './services.d.js';
import { successResponse, errorResponse } from '../helpers/response.helper.js';
import { 
  createServiceProduct, 
  updateServiceProduct, 
  createNewPrice, 
  archivePrice, 
  deleteProduct 
} from '../helpers/stripe.helper.js';

// Create a new service
export async function createService(serviceData: {
  name: string;
  description?: string;
  price: number;
  duration: number;
  stripeCurrency?: string;
}) {
  const res = {
    data: null as Service | null,
    error: null as string | null,
  };

  try {
    const { name, description, price, duration, stripeCurrency = 'mxn' } = serviceData;
    
    if (!name || !price || !duration) {
      res.error = 'Missing required fields';
      return res;
    }

    const db = await getDatabase();

    // Create Stripe product and price
    let stripeProductId: string | null = null;
    let stripePriceId: string | null = null;
    let stripeAdvancePriceId: string | null = null;

    try {
      console.log('Intentando crear producto en Stripe...');
      const stripeResult = await createServiceProduct({
        name,
        description,
        price: parseFloat(price.toString()),
        currency: stripeCurrency,
      });
      stripeProductId = stripeResult.productId;
      stripePriceId = stripeResult.priceId;
      stripeAdvancePriceId = stripeResult.advancePriceId;
      console.log('Producto y precios creados en Stripe:', stripeResult);
    } catch (stripeError) {
      console.error('Stripe error:', stripeError);
      res.error = 'Failed to create Stripe product: ' + (stripeError instanceof Error ? stripeError.message : stripeError);
      return res;
    }

    // Create service in database
    const [service] = await db.insert(services).values({
      name,
      description,
      price: price.toString(),
      duration,
      isActive: true,
      stripeProductId,
      stripePriceId,
      stripeAdvancePriceId,
      stripeCurrency,
    }).returning();

    res.data = service as Service;
    return res;
  } catch (error) {
    console.error('Error creating service:', error);
    res.error = 'Internal server error: ' + (error instanceof Error ? error.message : error);
    return res;
  }
}

// List all services
export async function listServices() {
  const res = {
    data: null as Service[] | null,
    error: null as string | null,
  };

  try {
    const db = await getDatabase();
    const allServices = await db.select().from(services);
    res.data = allServices as Service[];
    return res;
  } catch (error) {
    console.error('Error listing services:', error);
    
    // Handle specific database errors
    if (error instanceof Error) {
      if (error.message.includes('column') && error.message.includes('does not exist')) {
        res.error = 'Database schema error. Please contact administrator.';
        return res;
      } else if (error.message.includes('connection') || error.message.includes('timeout')) {
        res.error = 'Database connection error. Please try again later.';
        return res;
      } else if (error.message.includes('permission') || error.message.includes('access')) {
        res.error = 'Database access error. Please contact administrator.';
        return res;
      }
    }
    
    // Generic error message to prevent exposing internal details
    res.error = 'Error al cargar servicios. Por favor, intenta más tarde.';
    return res;
  }
}

// Get service by ID
export async function getServiceById(id: string) {
  const res = {
    data: null as Service | null,
    error: null as string | null,
  };

  try {
    if (!id) {
      res.error = 'Service ID is required';
      return res;
    }

    const db = await getDatabase();
    const [service] = await db.select().from(services).where(eq(services.id, id));
    
    if (!service) {
      res.error = 'Service not found';
      return res;
    }

    res.data = service as Service;
    return res;
  } catch (error) {
    console.error('Error getting service:', error);
    
    // Handle specific database errors
    if (error instanceof Error) {
      if (error.message.includes('column') && error.message.includes('does not exist')) {
        res.error = 'Database schema error. Please contact administrator.';
        return res;
      } else if (error.message.includes('connection') || error.message.includes('timeout')) {
        res.error = 'Database connection error. Please try again later.';
        return res;
      } else if (error.message.includes('permission') || error.message.includes('access')) {
        res.error = 'Database access error. Please contact administrator.';
        return res;
      }
    }
    
    res.error = 'Internal server error';
    return res;
  }
}

// Update service
export async function updateService(id: string, updateData: Partial<Service>) {
  const res = {
    data: null as Service | null,
    error: null as string | null,
  };

  try {
    if (!id) {
      res.error = 'Service ID is required';
      return res;
    }

    const db = await getDatabase();
    
    // Check if service exists
    const [existingService] = await db.select().from(services).where(eq(services.id, id));
    if (!existingService) {
      res.error = 'Service not found';
      return res;
    }

    // Update Stripe product if name or description changed
    if (existingService.stripeProductId && (updateData.name || updateData.description)) {
      try {
        await updateServiceProduct(existingService.stripeProductId, {
          name: updateData.name,
          description: updateData.description,
        });
      } catch (stripeError) {
        console.error('Stripe update error:', stripeError);
        // Continue with database update even if Stripe fails
      }
    }

    // Create new Stripe price if price changed
    if (updateData.price && existingService.stripeProductId) {
      try {
        const newPrice = await createNewPrice(
          existingService.stripeProductId,
          parseFloat(updateData.price.toString()),
          existingService.stripeCurrency || 'mxn'
        );
        
        // Archive old price if it exists
        if (existingService.stripePriceId) {
          await archivePrice(existingService.stripePriceId);
        }
        
        updateData.stripePriceId = newPrice.id;
      } catch (stripeError) {
        console.error('Stripe price update error:', stripeError);
        // Continue with database update even if Stripe fails
      }
    }

    const [updatedService] = await db
      .update(services)
      .set({
        ...updateData,
        updatedAt: new Date()
      })
      .where(eq(services.id, id))
      .returning();

    res.data = updatedService as Service;
    return res;
  } catch (error) {
    console.error('Error updating service:', error);
    
    // Handle specific database errors
    if (error instanceof Error) {
      if (error.message.includes('column') && error.message.includes('does not exist')) {
        res.error = 'Database schema error. Please contact administrator.';
        return res;
      } else if (error.message.includes('connection') || error.message.includes('timeout')) {
        res.error = 'Database connection error. Please try again later.';
        return res;
      } else if (error.message.includes('permission') || error.message.includes('access')) {
        res.error = 'Database access error. Please contact administrator.';
        return res;
      }
    }
    
    res.error = 'Internal server error';
    return res;
  }
}

// Delete service
export async function deleteService(id: string) {
  const res = {
    data: null as Service | null,
    error: null as string | null,
  };

  try {
    if (!id) {
      res.error = 'Service ID is required';
      return res;
    }

    const db = await getDatabase();
    
    // Check if service exists
    const [existingService] = await db.select().from(services).where(eq(services.id, id));
    if (!existingService) {
      res.error = 'Service not found';
      return res;
    }

    // Archive Stripe price and delete product
    if (existingService.stripePriceId) {
      try {
        await archivePrice(existingService.stripePriceId);
      } catch (stripeError) {
        console.error('Stripe price archive error:', stripeError);
      }
    }

    if (existingService.stripeProductId) {
      try {
        await deleteProduct(existingService.stripeProductId);
      } catch (stripeError) {
        console.error('Stripe product delete error:', stripeError);
      }
    }

    await db.delete(services).where(eq(services.id, id));

    res.data = existingService as Service; // Return the deleted service data
    return res;
  } catch (error) {
    console.error('Error deleting service:', error);
    
    // Handle specific database errors
    if (error instanceof Error) {
      if (error.message.includes('column') && error.message.includes('does not exist')) {
        res.error = 'Database schema error. Please contact administrator.';
        return res;
      } else if (error.message.includes('connection') || error.message.includes('timeout')) {
        res.error = 'Database connection error. Please try again later.';
        return res;
      } else if (error.message.includes('permission') || error.message.includes('access')) {
        res.error = 'Database access error. Please contact administrator.';
        return res;
      }
    }
    
    res.error = 'Internal server error';
    return res;
  }
}