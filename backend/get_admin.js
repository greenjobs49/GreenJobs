const mongoose = require('mongoose');

const MONGO_URI = 'mongodb+srv://greenjobs111_db_user:greenjobs987@greenjobs.ebxl10k.mongodb.net/greenjobs';

async function run() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('Connected to MongoDB');
    
    const UserSchema = new mongoose.Schema({}, { strict: false });
    const User = mongoose.model('User', UserSchema, 'users');
    
    const admins = await User.find({ role: 'admin' });
    console.log('Admins:');
    admins.forEach(admin => {
      console.log(`Name: ${admin.get('name')}, Email: ${admin.get('email')}`);
    });
    
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

run();
