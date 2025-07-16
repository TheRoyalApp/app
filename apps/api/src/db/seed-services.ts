import { getDatabase } from './connection.js';
import { services } from './schema.js';

async function seedServices() {
  try {
    const db = await getDatabase();
    
    const defaultServices = [
      {
        name: 'Classic Haircut',
        description: 'Traditional men\'s haircut with wash and style',
        price: '25.00',
        duration: 30,
        isActive: true
      },
      {
        name: 'Premium Haircut',
        description: 'Premium haircut with wash, style, and consultation',
        price: '35.00',
        duration: 45,
        isActive: true
      },
      {
        name: 'Beard Trim',
        description: 'Professional beard trimming and shaping',
        price: '15.00',
        duration: 20,
        isActive: true
      },
      {
        name: 'Haircut + Beard',
        description: 'Complete grooming package - haircut and beard trim',
        price: '40.00',
        duration: 50,
        isActive: true
      },
      {
        name: 'Kids Haircut',
        description: 'Haircut for children under 12',
        price: '20.00',
        duration: 25,
        isActive: true
      }
    ];

    console.log('🌱 Seeding services...');
    
    for (const service of defaultServices) {
      try {
        const [createdService] = await db.insert(services).values(service).returning();
        if (createdService) {
          console.log(`✅ Created service: ${createdService.name} - $${createdService.price}`);
        } else {
          console.log(`⚠️ Service created but no data returned: ${service.name}`);
        }
      } catch (error) {
        console.error(`❌ Failed to create service ${service.name}:`, error);
      }
    }
    
    console.log('🎉 Services seeding completed!');
  } catch (error) {
    console.error('❌ Error seeding services:', error);
  } finally {
    process.exit(0);
  }
}

seedServices(); 