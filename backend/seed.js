const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');

dotenv.config();

const Admin = require('./models/Admin');
const Client = require('./models/Client');
const Team = require('./models/Team');
const Package = require('./models/Package');

const seedDatabase = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });

    console.log('📦 Starting database seeding...');

    // Drop collections to clear indices
    try {
      await Admin.collection.drop();
      await Client.collection.drop();
      await Team.collection.drop();
      await Package.collection.drop();
    } catch (err) {
      // Collections might not exist, that's ok
    }

    console.log('🗑️ Cleared existing data and indices');

    // Create Admin User
    const hashedPassword = await bcrypt.hash('password123', 10);
    const admin = await Admin.create({
      name: 'Admin User',
      email: 'admin@technoguide.com',
      password: hashedPassword,
      role: 'Super Admin',
      phone: '+919876543210',
      company: 'TechnoGuide',
      isActive: true
    });

    console.log('✅ Admin created:', admin.email);

    // Create Sample Clients
    const clients = await Client.create([
      {
        name: 'ABC Solutions',
        email: 'contact@abc.com',
        phone: '+919876543211',
        company: 'ABC Solutions Pvt Ltd',
        industry: 'Marketing',
        address: '123 Business Park',
        city: 'Mumbai',
        state: 'Maharashtra',
        country: 'India',
        budget: 100000,
        status: 'Active',
        createdBy: admin._id
      },
      {
        name: 'XYZ Innovations',
        email: 'info@xyz.com',
        phone: '+919876543212',
        company: 'XYZ Innovations Inc',
        industry: 'Technology',
        address: '456 Tech Street',
        city: 'Bangalore',
        state: 'Karnataka',
        country: 'India',
        budget: 150000,
        status: 'Active',
        createdBy: admin._id
      },
      {
        name: 'Global Brands',
        email: 'hello@globalbrands.com',
        phone: '+919876543213',
        company: 'Global Brands Ltd',
        industry: 'Retail',
        address: '789 Commerce Hub',
        city: 'Delhi',
        state: 'Delhi',
        country: 'India',
        budget: 200000,
        status: 'Pending',
        createdBy: admin._id
      }
    ]);

    console.log(`✅ ${clients.length} clients created`);

    // Create Sample Team Members
    const managers = await Team.create(
      {
        name: 'Raj Kumar',
        email: 'raj@technoguide.com',
        phone: '+919876543220',
        role: 'Manager',
        department: 'Marketing',
        skills: ['Leadership', 'Project Management', 'Marketing Strategy'],
        designation: 'Project Manager',
        experience: 5,
        status: 'Active',
        city: 'Mumbai',
        country: 'India'
      }
    );

    const teamMembers = await Team.create([
      {
        name: 'Priya Singh',
        email: 'priya@technoguide.com',
        phone: '+919876543221',
        role: 'Designer',
        department: 'Design',
        skills: ['Graphic Design', 'UI/UX', 'Figma', 'Adobe Creative Suite'],
        designation: 'Graphic Designer',
        experience: 3,
        reportingTo: managers._id,
        status: 'Active',
        city: 'Mumbai',
        country: 'India'
      },
      {
        name: 'Arun Reddy',
        email: 'arun@technoguide.com',
        phone: '+919876543222',
        role: 'Videographer',
        department: 'Media',
        skills: ['Video Production', 'Editing', 'Motion Graphics', 'Adobe Premiere'],
        designation: 'Video Producer',
        experience: 4,
        reportingTo: managers._id,
        status: 'Active',
        city: 'Bangalore',
        country: 'India'
      },
      {
        name: 'Neha Sharma',
        email: 'neha@technoguide.com',
        phone: '+919876543223',
        role: 'Content Writer',
        department: 'Content',
        skills: ['Content Writing', 'SEO', 'Copywriting', 'Social Media'],
        designation: 'Content Strategist',
        experience: 3,
        reportingTo: managers._id,
        status: 'Active',
        city: 'Delhi',
        country: 'India'
      },
      {
        name: 'Vikram Patel',
        email: 'vikram@technoguide.com',
        phone: '+919876543224',
        role: 'Social Media Executive',
        department: 'Marketing',
        skills: ['Social Media Management', 'Instagram', 'Facebook', 'LinkedIn'],
        designation: 'Social Media Manager',
        experience: 2,
        reportingTo: managers._id,
        status: 'Active',
        city: 'Mumbai',
        country: 'India'
      }
    ]);

    console.log(`✅ ${teamMembers.length + 1} team members created`);

    // Create Sample Packages
    const packages = await Package.create([
      {
        name: 'Social Media Monthly Plan',
        description: 'Complete social media management for 1 month',
        type: ['Social Media Marketing'],
        amount: 25000,
        duration: 1,
        durationUnit: 'months',
        deliverables: ['8 Posts', '2 Reels', '4 Stories'],
        features: ['Content Planning', 'Posting', 'Engagement', 'Analytics'],
        client: clients[0]._id,
        budget: 25000,
        status: 'Active',
        manager: managers._id,
        assignedTeam: [teamMembers[1]._id, teamMembers[3]._id],
        progress: 45,
        createdBy: admin._id
      },
      {
        name: 'Video Production Package',
        description: 'Professional video production and editing',
        type: ['Content Marketing'],
        amount: 50000,
        duration: 2,
        durationUnit: 'weeks',
        deliverables: ['2 Promotional Videos', 'Product Reels'],
        features: ['Scripting', 'Shooting', 'Editing', 'Color Grading'],
        client: clients[1]._id,
        budget: 50000,
        status: 'Active',
        manager: managers._id,
        assignedTeam: [teamMembers[1]._id],
        progress: 60,
        createdBy: admin._id
      },
      {
        name: 'Graphic Design Bundle',
        description: 'Complete graphic design for branding',
        type: ['Graphic Design'],
        amount: 35000,
        duration: 1,
        durationUnit: 'months',
        deliverables: ['Logo Design', '10 Social Graphics', 'Brand Guidelines'],
        features: ['Logo Design', 'Social Media Templates', 'Print Design'],
        client: clients[2]._id,
        budget: 35000,
        status: 'Active',
        manager: managers._id,
        assignedTeam: [teamMembers[0]._id],
        progress: 30,
        createdBy: admin._id
      }
    ]);

    console.log(`✅ ${packages.length} packages created`);

    console.log('\n✨ Database seeding completed successfully!');
    console.log('\n📋 Demo Credentials:');
    console.log('Email: admin@technoguide.com');
    console.log('Password: password123\n');

    mongoose.connection.close();
  } catch (error) {
    console.error('❌ Error seeding database:', error.message);
    mongoose.connection.close();
    process.exit(1);
  }
};

seedDatabase();
