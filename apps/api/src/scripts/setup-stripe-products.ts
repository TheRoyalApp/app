#!/usr/bin/env bun

/**
 * Setup Stripe Products and Prices for Services
 * This script creates Stripe products and prices for all services in the database
 * and updates the services with the Stripe IDs.
 */

import * as dotenv from 'dotenv';
dotenv.config({ path: './apps/api/.env' });

import Stripe from 'stripe';
import { getDatabase } from '../db/connection.js';
import { services } from '../db/schema.js';
import { eq } from 'drizzle-orm';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-05-28.basil',
});

async function setupStripeProducts() {
  try {
    console.log('🚀 Setting up Stripe products and prices...');
    
    const db = await getDatabase();
    
    // Get all services from database
    const allServices = await db.select().from(services);
    console.log(`📋 Found ${allServices.length} services to configure`);
    
    for (const service of allServices) {
      console.log(`\n🔄 Configuring service: ${service.name}`);
      
      try {
        // Create Stripe product
        const product = await stripe.products.create({
          name: service.name,
          description: service.description || undefined,
          metadata: {
            serviceId: service.id,
            duration: service.duration.toString(),
          },
        });
        
        console.log(`✅ Created product: ${product.name} (${product.id})`);
        
        // Create full price (100% of service price)
        const fullPrice = await stripe.prices.create({
          product: product.id,
          unit_amount: Math.round(parseFloat(service.price) * 100), // Convert to cents
          currency: service.stripeCurrency || 'mxn',
          metadata: {
            serviceId: service.id,
            paymentType: 'full',
          },
        });
        
        console.log(`✅ Created full price: ${fullPrice.unit_amount} ${fullPrice.currency} (${fullPrice.id})`);
        
        // Create advance price (50% of service price)
        const advancePrice = await stripe.prices.create({
          product: product.id,
          unit_amount: Math.round(parseFloat(service.price) * 50), // 50% of full price
          currency: service.stripeCurrency || 'mxn',
          metadata: {
            serviceId: service.id,
            paymentType: 'advance',
          },
        });
        
        console.log(`✅ Created advance price: ${advancePrice.unit_amount} ${advancePrice.currency} (${advancePrice.id})`);
        
        // Update service with Stripe IDs
        await db.update(services)
          .set({
            stripeProductId: product.id,
            stripePriceId: fullPrice.id,
            stripeAdvancePriceId: advancePrice.id,
            updatedAt: new Date(),
          })
          .where(eq(services.id, service.id));
        
        console.log(`✅ Updated service with Stripe IDs`);
        
      } catch (error) {
        console.error(`❌ Failed to configure service ${service.name}:`, error);
      }
    }
    
    console.log('\n🎉 Stripe setup completed!');
    
    // Verify the setup
    console.log('\n📊 Verification:');
    const updatedServices = await db.select().from(services);
    for (const service of updatedServices) {
      console.log(`- ${service.name}:`);
      console.log(`  Product: ${service.stripeProductId || 'Not set'}`);
      console.log(`  Full Price: ${service.stripePriceId || 'Not set'}`);
      console.log(`  Advance Price: ${service.stripeAdvancePriceId || 'Not set'}`);
    }
    
  } catch (error) {
    console.error('❌ Error setting up Stripe products:', error);
  } finally {
    process.exit(0);
  }
}

setupStripeProducts(); 