const Client = require('../models/Client');
const Package = require('../models/Package');

// Get all clients
exports.getAllClients = async (req, res) => {
  try {
    const clients = await Client.find().populate('packages');

    // Transform logo paths to full URLs
    const clientsWithFullUrls = clients.map(client => {
      const clientObj = client.toObject();
      if (clientObj.logo && !clientObj.logo.startsWith('http')) {
        const baseURL = `${req.protocol}://${req.get('host')}`;
        clientObj.logo = `${baseURL}${clientObj.logo}`;
      }
      return clientObj;
    });

    res.json(clientsWithFullUrls);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get single client
exports.getClientById = async (req, res) => {
  try {
    const client = await Client.findById(req.params.id).populate('packages');
    if (!client) return res.status(404).json({ message: 'Client not found' });

    // Transform logo path to full URL
    const clientObj = client.toObject();
    if (clientObj.logo && !clientObj.logo.startsWith('http')) {
      const baseURL = `${req.protocol}://${req.get('host')}`;
      clientObj.logo = `${baseURL}${clientObj.logo}`;
    }

    res.json(clientObj);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Add new client
exports.addClient = async (req, res) => {
  try {
    console.log('Entered addClient controller');
    // Check if req.body exists
    if (!req.body) {
      return res.status(400).json({ message: 'Request body is empty. Please check your form data.' });
    }

    const { name, email, phone, company, industry, otherIndustry, address, city, state } = req.body;
    console.log('Extracted fields, checking existing client for email:', email);

    // Validate required fields
    if (!name || !email || !phone) {
      return res.status(400).json({ message: 'Name, email, and phone are required' });
    }

    // Check if client already exists
    const existingClient = await Client.findOne({ email });
    console.log('Finished Client.findOne');
    if (existingClient) {
      return res.status(400).json({ message: 'Client already exists' });
    }

    // Build logo path if file was uploaded
    let logoPath = null;
    if (req.file) {
      logoPath = `/uploads/${req.file.filename}`;
    }

    console.log('Building new client with req.admin._id:', req.admin?._id);
    const newClient = new Client({
      name,
      email,
      phone,
      company: company || '',
      industry: industry || 'Marketing',
      otherIndustry: otherIndustry || '',
      address: address || '',
      city: city || '',
      state: state || '',
      logo: logoPath,
      createdBy: req.admin._id
    });

    console.log('Saving new client to DB...');
    const savedClient = await newClient.save();
    console.log('Client saved successfully with ID:', savedClient._id);

    // Transform logo path to full URL before sending response
    const clientObj = savedClient.toObject();
    if (clientObj.logo && !clientObj.logo.startsWith('http')) {
      const baseURL = `${req.protocol}://${req.get('host')}`;
      clientObj.logo = `${baseURL}${clientObj.logo}`;
    }

    console.log('Returning success response');
    res.status(201).json(clientObj);
  } catch (error) {
    console.error('Error adding client:', error);
    res.status(500).json({ message: error.message });
  }
};

// Update client
exports.updateClient = async (req, res) => {
  try {
    // Check if req.body exists
    if (!req.body) {
      return res.status(400).json({ message: 'Request body is empty. Please check your form data.' });
    }

    let updateData = { ...req.body, updatedAt: Date.now() };

    // Handle logo upload if file was provided
    if (req.file) {
      updateData.logo = `/uploads/${req.file.filename}`;
    }

    const client = await Client.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true }
    );

    if (!client) return res.status(404).json({ message: 'Client not found' });

    // Transform logo path to full URL
    const clientObj = client.toObject();
    if (clientObj.logo && !clientObj.logo.startsWith('http')) {
      const baseURL = `${req.protocol}://${req.get('host')}`;
      clientObj.logo = `${baseURL}${clientObj.logo}`;
    }

    res.json({
      message: 'Client updated successfully',
      client: clientObj
    });
  } catch (error) {
    console.error('Error updating client:', error);
    res.status(500).json({ message: error.message });
  }
};

// Delete client
exports.deleteClient = async (req, res) => {
  try {
    const client = await Client.findByIdAndDelete(req.params.id);
    if (!client) return res.status(404).json({ message: 'Client not found' });

    // Delete associated packages
    await Package.deleteMany({ client: req.params.id });

    res.json({ message: 'Client deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update client status
exports.updateClientStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const client = await Client.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );

    if (!client) return res.status(404).json({ message: 'Client not found' });

    res.json({
      message: 'Client status updated',
      client
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get client packages
exports.getClientPackages = async (req, res) => {
  try {
    const packages = await Package.find({ client: req.params.id });
    res.json(packages);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get client statistics
exports.getClientStats = async (req, res) => {
  try {
    const totalClients = await Client.countDocuments();
    const activeClients = totalClients; // All clients are considered active

    res.json({
      totalClients,
      activeClients,
      pendingClients: 0,
      inactiveClients: 0
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
