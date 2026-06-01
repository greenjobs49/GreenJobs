const mongoose = require('mongoose');

const MONGO_URI = 'mongodb+srv://greenjobs111_db_user:greenjobs987@greenjobs.ebxl10k.mongodb.net/greenjobs';

async function run() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('Connected to MongoDB');
    
    const UserSchema = new mongoose.Schema({
        name: String,
        email: String,
        role: String,
        status: String,
        isVerified: Boolean
    }, { strict: false });
    const User = mongoose.model('User', UserSchema, 'users');
    
    // Create an admin user if it doesn't exist
    const adminEmail = "admin@greenjobs.in";
    const existingAdmin = await User.findOne({ email: adminEmail });
    
    if (!existingAdmin) {
        await User.create({
            name: "Admin User",
            email: adminEmail,
            role: "admin",
            status: "active",
            isVerified: true
        });
        console.log("Created admin user:", adminEmail);
    } else {
        console.log("Admin user already exists:", adminEmail);
    }
    
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

run();
